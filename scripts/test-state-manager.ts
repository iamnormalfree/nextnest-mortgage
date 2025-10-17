import { ConversationStateManager } from '@/lib/ai/conversation-state-manager';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';

async function testStateManager() {
  console.log('Testing Conversation State Manager');
  console.log('='.repeat(60));
  
  const manager = new ConversationStateManager();
  
  const mockLead: ProcessedLeadData = {
    name: 'Test User',
    email: 'test@test.com',
    phone: '+6591234567',
    loanType: 'hdb_loan',
    actualIncomes: [5000],
    actualAges: [30],
    employmentType: 'employed',
    leadScore: 75,
    sessionId: 'test-' + Date.now(),
    brokerPersona: {
      type: 'balanced',
      name: 'Sarah Wong',
      title: 'Consultant',
      approach: 'consultative',
      urgencyLevel: 'medium',
      avatar: '/avatar.svg',
      responseStyle: { tone: 'warm', pacing: 'moderate', focus: 'family' }
    }
  };
  
  try {
    const conversationId = Date.now();
    
    console.log('Test 1: Initialize Conversation');
    const state = await manager.initializeConversation(conversationId, 123, mockLead, mockLead.brokerPersona);
    if (state.tokenBudget !== 24000) throw new Error('Budget should be 24000');
    console.log('✅ Initialized with budget:', state.tokenBudget);
    
    console.log('Test 2: Track Message');
    await manager.trackMessage(conversationId, 'greeting', 150);
    const updated = await manager.getState(conversationId);
    if (!updated || updated.totalTokensUsed !== 150) throw new Error('Tokens not tracked');
    console.log('✅ Tracked 150 tokens, remaining:', manager.getRemainingBudget(updated));
    
    console.log('Test 3: Update Phase');
    await manager.updatePhase(conversationId, 'qualification');
    const afterPhase = await manager.getState(conversationId);
    if (!afterPhase || afterPhase.phase !== 'qualification') throw new Error('Phase not updated');
    console.log('✅ Phase updated to:', afterPhase.phase);
    
    console.log('✅ ALL TESTS PASSED!');
    await manager.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
    await manager.disconnect();
    process.exit(1);
  }
}

testStateManager();
