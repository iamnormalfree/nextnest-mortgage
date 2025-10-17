import { getFeatureFlag, getCurrentFeatureFlags } from '@/lib/utils/feature-flags';

async function testFeatureFlags() {
  console.log('Testing Feature Flags');
  console.log('='.repeat(60));
  
  try {
    const flags = getCurrentFeatureFlags();
    
    console.log('Enabled Features:');
    console.log('  Intent Classification:', flags.enableIntentClassification ? '✅' : '❌');
    console.log('  Response Awareness:', flags.enableResponseAwareness ? '✅' : '❌');
    console.log('  Calculation Explanations:', flags.enableCalculationExplanations ? '✅' : '❌');
    console.log('  Multi-Model Orchestration:', flags.enableMultiModelOrchestration ? '✅' : '❌');
    console.log('  Conversation Summarization:', flags.enableConversationSummarization ? '✅' : '❌');
    
    console.log('Model Weights:');
    console.log('  gpt-4o-mini:', flags.modelWeights['gpt-4o-mini']);
    console.log('  gpt-4o:', flags.modelWeights['gpt-4o']);
    console.log('  claude-3.5-sonnet:', flags.modelWeights['claude-3.5-sonnet']);
    
    const sum = flags.modelWeights['gpt-4o-mini'] + flags.modelWeights['gpt-4o'] + flags.modelWeights['claude-3.5-sonnet'];
    console.log('  Sum:', sum.toFixed(2), sum === 1.0 ? '✅' : '❌');
    
    if (!flags.enableIntentClassification) throw new Error('Intent classification should be enabled');
    if (Math.abs(sum - 1.0) > 0.01) throw new Error('Weights must sum to 1.0');
    
    console.log('✅ ALL TESTS PASSED!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
  }
}

testFeatureFlags();
