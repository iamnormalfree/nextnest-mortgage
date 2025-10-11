/**
 * Conversation Repository - Supabase cold storage
 *
 * Handles persistent storage of:
 * - Conversation metadata
 * - Conversation turns (user/assistant messages)
 * - Calculation audit trail
 *
 * Works in tandem with ConversationStateManager (Redis hot storage)
 */

import { createClient } from '@supabase/supabase-js';
import {
  ConversationContext,
  ConversationTurn,
  CalculationAudit,
} from '@/lib/contracts/ai-conversation-contracts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class ConversationRepository {
  /**
   * Store conversation metadata and memory snapshot
   */
  async storeConversation(context: ConversationContext): Promise<void> {
    const { error } = await supabaseAdmin
      .from('conversations')
      .upsert({
        id: context.conversationId,
        user_id: context.user.email,
        created_at: context.metadata.startedAt,
        last_activity: new Date().toISOString(),
        memory_snapshot: context.memory,
        broker_persona: context.broker.persona.name,
        lead_score: context.user.leadScore,
        loan_type: context.user.loanType,
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('❌ Failed to store conversation:', error);
      throw new Error(`Conversation storage failed: ${error.message}`);
    }

    console.log(`✅ Stored conversation ${context.conversationId}`);
  }

  /**
   * Store individual conversation turn
   */
  async storeTurn(turn: ConversationTurn): Promise<void> {
    const { error } = await supabaseAdmin
      .from('conversation_turns')
      .insert({
        id: turn.id,
        conversation_id: turn.conversationId,
        role: turn.role,
        content: turn.content,
        timestamp: turn.timestamp,
        token_count: turn.tokenCount,
        model_used: turn.modelUsed,
        intent_classification: turn.intentClassification,
        metadata: turn.metadata,
      });

    if (error) {
      console.error('❌ Failed to store turn:', error);
      throw new Error(`Turn storage failed: ${error.message}`);
    }
  }

  /**
   * Store calculation audit for Dr. Elena compliance tracking
   */
  async storeCalculationAudit(audit: CalculationAudit): Promise<void> {
    const { error } = await supabaseAdmin
      .from('calculation_audit')
      .insert({
        conversation_id: audit.conversationId,
        calculation_type: audit.calculationType,
        inputs: audit.inputs,
        results: audit.results,
        timestamp: audit.timestamp,
        mas_compliant: audit.masCompliant,
        regulatory_notes: audit.regulatoryNotes,
      });

    if (error) {
      console.error('❌ Failed to store calculation audit:', error);
      throw new Error(`Calculation audit failed: ${error.message}`);
    }

    console.log(`✅ Stored calculation audit: ${audit.calculationType}`);
  }

  /**
   * Retrieve conversation history from cold storage
   * Used when Redis hot memory expires (after 1 hour)
   */
  async getConversation(conversationId: string): Promise<ConversationContext | null> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('❌ Failed to retrieve conversation:', error);
      throw new Error(`Conversation retrieval failed: ${error.message}`);
    }

    // Reconstruct ConversationContext from stored data
    // Note: This is a simplified reconstruction
    // Full context includes more fields populated from ProcessedLeadData
    return {
      conversationId: data.id,
      user: {
        name: data.user_id, // Simplified - should lookup user details
        email: data.user_id,
        leadScore: data.lead_score,
        loanType: data.loan_type,
      },
      memory: data.memory_snapshot,
      metadata: {
        startedAt: data.created_at,
        lastActivity: data.last_activity,
        turnCount: 0, // Will be populated by getTurns
      },
    } as ConversationContext;
  }

  /**
   * Get conversation turns (paginated)
   */
  async getTurns(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationTurn[]> {
    const { data, error } = await supabaseAdmin
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Failed to retrieve turns:', error);
      throw new Error(`Turn retrieval failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      tokenCount: row.token_count,
      modelUsed: row.model_used,
      intentClassification: row.intent_classification,
      metadata: row.metadata,
    }));
  }

  /**
   * Get calculation audit trail for a conversation
   * Used for compliance reporting and debugging
   */
  async getCalculationAudits(conversationId: string): Promise<CalculationAudit[]> {
    const { data, error } = await supabaseAdmin
      .from('calculation_audit')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Failed to retrieve calculation audits:', error);
      throw new Error(`Calculation audit retrieval failed: ${error.message}`);
    }

    return data.map(row => ({
      conversationId: row.conversation_id,
      calculationType: row.calculation_type,
      inputs: row.inputs,
      results: row.results,
      timestamp: row.timestamp,
      masCompliant: row.mas_compliant,
      regulatoryNotes: row.regulatory_notes,
    }));
  }

  /**
   * Get conversation statistics for analytics
   */
  async getConversationStats(conversationId: string) {
    const { data: turnData, error: turnError } = await supabaseAdmin
      .from('conversation_turns')
      .select('token_count, model_used')
      .eq('conversation_id', conversationId);

    if (turnError) {
      console.error('❌ Failed to get stats:', turnError);
      return null;
    }

    const totalTokens = turnData.reduce((sum, turn) => sum + (turn.token_count || 0), 0);
    const modelDistribution = turnData.reduce((dist, turn) => {
      const model = turn.model_used || 'unknown';
      dist[model] = (dist[model] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      totalTurns: turnData.length,
      totalTokens,
      modelDistribution,
    };
  }

  /**
   * Archive old conversations (soft delete)
   * Keeps data for compliance but marks as archived
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Failed to archive conversation:', error);
      throw new Error(`Conversation archival failed: ${error.message}`);
    }

    console.log(`📦 Archived conversation ${conversationId}`);
  }
}

// Export singleton instance
export const conversationRepository = new ConversationRepository();
