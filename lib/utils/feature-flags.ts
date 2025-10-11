/**
 * AI Chat Intelligence System - Feature Flags
 * 
 * Centralized feature flag configuration for gradual rollout and A/B testing.
 * Allows enabling/disabling AI features without code deployment.
 * 
 * @module feature-flags
 * @version 1.0.0
 */

import { AIFeatureFlags } from '@/lib/contracts/ai-conversation-contracts';

/**
 * Default feature flags for AI Chat Intelligence System
 * 
 * Week 1-2: Foundation features enabled
 * Week 3+: Advanced features will be enabled progressively
 */
export const AI_FEATURE_FLAGS: AIFeatureFlags = {
  // Week 1-2: Foundation Layer (ENABLED)
  enableIntentClassification: true,
  enableResponseAwareness: false,  // Week 4
  
  // Week 3: Dr. Elena Integration (DISABLED until Week 3)
  enableCalculationExplanations: false,
  
  // Week 4: Memory & Optimization (DISABLED until Week 4)
  enableMultiModelOrchestration: false,
  enableConversationSummarization: false,
  
  // Multi-model weights (used when enableMultiModelOrchestration = true)
  modelWeights: {
    'gpt-4o-mini': 0.70,   // 70% - Standard responses
    'gpt-4o': 0.20,        // 20% - Complex calculations
    'claude-3-haiku': 0.10 // 10% - Creative explanations
  }
};

/**
 * Get feature flag value with environment override
 * Allows runtime configuration via environment variables
 */
export function getFeatureFlag(flagName: keyof Omit<AIFeatureFlags, 'modelWeights'>): boolean {
  // Check environment variable override
  const envKey = `AI_${flagName}`.toUpperCase();
  const envValue = process.env[envKey];
  
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  // Fall back to default configuration
  return AI_FEATURE_FLAGS[flagName] as boolean;
}

/**
 * Get model weights with environment override
 */
export function getModelWeights(): AIFeatureFlags['modelWeights'] {
  const weights = { ...AI_FEATURE_FLAGS.modelWeights };
  
  // Check environment overrides
  const miniWeight = process.env.AI_MODEL_WEIGHT_GPT4O_MINI;
  const gpt4Weight = process.env.AI_MODEL_WEIGHT_GPT4O;
  const claudeWeight = process.env.AI_MODEL_WEIGHT_CLAUDE;
  
  if (miniWeight) weights['gpt-4o-mini'] = parseFloat(miniWeight);
  if (gpt4Weight) weights['gpt-4o'] = parseFloat(gpt4Weight);
  if (claudeWeight) weights['claude-3-haiku'] = parseFloat(claudeWeight);
  
  // Validate weights sum to 1.0
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.01) {
    console.warn(`Model weights sum to ${sum}, normalizing to 1.0`);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] = weights[key as keyof typeof weights] / sum;
    });
  }
  
  return weights;
}

/**
 * Check if AI system is fully enabled
 * Used for health checks and monitoring
 */
export function isAISystemEnabled(): boolean {
  return getFeatureFlag('enableIntentClassification');
}

/**
 * Get current feature flag configuration
 * Useful for debugging and monitoring
 */
export function getCurrentFeatureFlags(): AIFeatureFlags {
  return {
    enableIntentClassification: getFeatureFlag('enableIntentClassification'),
    enableResponseAwareness: getFeatureFlag('enableResponseAwareness'),
    enableCalculationExplanations: getFeatureFlag('enableCalculationExplanations'),
    enableMultiModelOrchestration: getFeatureFlag('enableMultiModelOrchestration'),
    enableConversationSummarization: getFeatureFlag('enableConversationSummarization'),
    modelWeights: getModelWeights()
  };
}
