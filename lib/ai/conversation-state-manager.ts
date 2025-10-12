/**
 * AI Chat Intelligence System - Conversation State Manager
 * 
 * Manages conversation state with Redis caching and token budget tracking.
 * Ensures conversations stay within budget while maintaining context.
 * 
 * @module conversation-state-manager
 * @version 1.0.0
 */

import Redis from 'ioredis';
import { getRedisConnection } from '@/lib/queue/redis-config';
import {
  ConversationState,
  ConversationPhase,
  UserIntent,
  TokenBudget,
  CacheKeyBuilder
} from '@/lib/contracts/ai-conversation-contracts';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { calculationRepository } from '@/lib/db/repositories/calculation-repository';
import { LoanCalculationInputs, LoanCalculationResult } from '@/lib/calculations/dr-elena-mortgage';

/**
 * Redis cache key builder for conversation data
 */
const CACHE_KEYS: CacheKeyBuilder = {
  conversation: (conversationId: number) => `ai:conversation:${conversationId}`,
  intent: (conversationId: number, messageId: string) => `ai:intent:${conversationId}:${messageId}`,
  tokenBudget: (conversationId: number) => `ai:tokens:${conversationId}`
};

/**
 * Default token budget configuration
 * Target: 24,000 tokens for 20-turn conversation = 1,200 tokens/turn average
 */
const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  total: 24000,
  perMessage: 1200,
  reserved: 2000,    // Reserve for final messages
  warning: 18000     // Switch to mini model at 75% usage
};

/**
 * Conversation State Manager
 * 
 * Responsibilities:
 * - Track conversation phase and progress
 * - Manage token budget allocation
 * - Cache state in Redis for fast access
 * - Persist state to Supabase for durability
 */
export class ConversationStateManager {
  private redis: Redis | null = null;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor() {
    // Lazy initialization - Redis will be connected on first use
  }

  /**
   * Get or create Redis connection (lazy initialization)
   */
  private getRedis(): Redis {
    if (!this.redis) {
      // Cast to any to work around BullMQ ConnectionOptions vs ioredis RedisOptions type incompatibility
      // The options are compatible at runtime, just different TypeScript definitions
      this.redis = new Redis(getRedisConnection() as any);

      this.redis.on('error', (error) => {
        console.error('Redis error in ConversationStateManager:', error);
      });
    }
    return this.redis;
  }
  
  /**
   * Initialize new conversation state
   */
  async initializeConversation(
    conversationId: number,
    contactId: number,
    leadData: ProcessedLeadData,
    brokerPersona: BrokerPersona
  ): Promise<ConversationState> {
    const state: ConversationState = {
      conversationId,
      contactId,
      phase: 'greeting',
      leadData,
      brokerPersona,
      messageCount: 0,
      totalTokensUsed: 0,
      tokenBudget: DEFAULT_TOKEN_BUDGET.total,
      intentHistory: [],
      collectedInfo: {},
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    
    // Cache in Redis
    await this.saveState(state);
    
    console.log(`Initialized conversation state for ${conversationId}:`, {
      phase: state.phase,
      broker: brokerPersona.name,
      tokenBudget: state.tokenBudget
    });
    
    return state;
  }
  
  /**
   * Get conversation state (from cache or database)
   */
  async getState(conversationId: number): Promise<ConversationState | null> {
    try {
      // Try Redis cache first
      const cached = await this.getRedis().get(CACHE_KEYS.conversation(conversationId));
      
      if (cached) {
        const state = JSON.parse(cached);
        // Convert date strings back to Date objects
        state.createdAt = new Date(state.createdAt);
        state.lastMessageAt = new Date(state.lastMessageAt);
        if (state.expiresAt) state.expiresAt = new Date(state.expiresAt);
        
        return state;
      }
      
      // TODO Week 2: Fall back to Supabase if not in cache
      console.warn(`Conversation ${conversationId} not found in cache`);
      return null;
      
    } catch (error) {
      console.error(`Error getting conversation state:`, error);
      return null;
    }
  }
  
  /**
   * Save conversation state to cache and database
   */
  async saveState(state: ConversationState): Promise<void> {
    try {
      // Update last message timestamp
      state.lastMessageAt = new Date();
      
      // Save to Redis cache
      await this.getRedis().setex(
        CACHE_KEYS.conversation(state.conversationId),
        this.CACHE_TTL,
        JSON.stringify(state)
      );
      
      // TODO Week 2: Persist to Supabase for durability
      
    } catch (error) {
      console.error(`Error saving conversation state:`, error);
      throw error;
    }
  }
  
  /**
   * Update conversation phase
   */
  async updatePhase(conversationId: number, newPhase: ConversationPhase): Promise<void> {
    const state = await this.getState(conversationId);
    if (!state) throw new Error(`Conversation ${conversationId} not found`);
    
    console.log(`Phase transition: ${state.phase} -> ${newPhase}`);
    
    state.phase = newPhase;
    await this.saveState(state);
  }
  
  /**
   * Track message and update token usage
   */
  async trackMessage(
    conversationId: number,
    intent: UserIntent,
    tokensUsed: number
  ): Promise<ConversationState> {
    const state = await this.getState(conversationId);
    if (!state) throw new Error(`Conversation ${conversationId} not found`);
    
    // Update message count
    state.messageCount += 1;
    
    // Update token usage
    state.totalTokensUsed += tokensUsed;
    
    // Add intent to history (keep last 5)
    state.intentHistory.push(intent);
    if (state.intentHistory.length > 5) {
      state.intentHistory = state.intentHistory.slice(-5);
    }
    
    await this.saveState(state);
    
    // Log token budget status
    this.logTokenBudget(state);
    
    return state;
  }
  
  /**
   * Check if conversation is approaching token budget limit
   */
  isApproachingBudgetLimit(state: ConversationState): boolean {
    return state.totalTokensUsed >= DEFAULT_TOKEN_BUDGET.warning;
  }
  
  /**
   * Get remaining token budget
   */
  getRemainingBudget(state: ConversationState): number {
    return state.tokenBudget - state.totalTokensUsed;
  }
  
  /**
   * Calculate recommended tokens for next message
   */
  getRecommendedTokenLimit(state: ConversationState): number {
    const remaining = this.getRemainingBudget(state);
    const estimatedRemainingMessages = Math.max(20 - state.messageCount, 1);
    
    // Average remaining budget across expected messages
    const recommended = Math.floor(remaining / estimatedRemainingMessages);
    
    // Ensure minimum 200 tokens, maximum 2000 tokens
    return Math.max(200, Math.min(recommended, 2000));
  }
  
  /**
   * Update collected information
   */
  async updateCollectedInfo(
    conversationId: number,
    info: Partial<ConversationState['collectedInfo']>
  ): Promise<void> {
    const state = await this.getState(conversationId);
    if (!state) throw new Error(`Conversation ${conversationId} not found`);
    
    state.collectedInfo = {
      ...state.collectedInfo,
      ...info
    };
    
    await this.saveState(state);
  }
  
  /**
   * Log token budget status for monitoring
   */
  private logTokenBudget(state: ConversationState): void {
    const usage = (state.totalTokensUsed / state.tokenBudget) * 100;
    const remaining = this.getRemainingBudget(state);
    
    const emoji = usage < 50 ? '🟢' : usage < 75 ? '🟡' : '🔴';
    
    console.log(`${emoji} Token Budget [${state.conversationId}]:`, {
      used: state.totalTokensUsed,
      budget: state.tokenBudget,
      remaining,
      usage: `${usage.toFixed(1)}%`,
      messages: state.messageCount
    });
  }
  
  /**
   * Clean up expired conversations from cache
   */
  async cleanupExpired(): Promise<number> {
    // This would typically be called by a cron job
    // For now, Redis TTL handles automatic cleanup
    return 0;
  }
  
  /**
   * Record calculation in audit trail and update conversation state
   * Week 3 Phase 5: Dr. Elena Integration
   */
  async recordCalculation(
    conversationId: number,
    calculationType: 'max_loan' | 'affordability' | 'refinancing' | 'stamp_duty' | 'comparison',
    inputs: LoanCalculationInputs,
    results: LoanCalculationResult
  ): Promise<void> {
    try {
      // Store in Supabase audit trail
      const auditId = await calculationRepository.storeCalculationAudit(
        conversationId.toString(),
        calculationType,
        inputs,
        results
      );

      console.log(`✅ Calculation recorded: ${auditId} (Type: ${calculationType}, Max Loan: $${results.maxLoan.toLocaleString()})`);

      // Update conversation state
      const state = await this.getState(conversationId);
      if (state) {
        state.collectedInfo = {
          ...state.collectedInfo,
          hasCalculatedLoan: true,
          lastCalculationType: calculationType,
          lastCalculationResult: results
        };
        await this.saveState(state);
      }
    } catch (error) {
      console.error('❌ Failed to record calculation:', error);
      // Don't throw - calculation was successful, audit failure shouldn't break flow
    }
  }

  /**
   * Close Redis connection (call on shutdown)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
