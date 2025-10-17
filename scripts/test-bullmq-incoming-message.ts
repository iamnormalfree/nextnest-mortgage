/**
 * Test Script: BullMQ Incoming Message Flow
 *
 * Tests the complete flow:
 * 1. Queue incoming message to BullMQ
 * 2. Worker processes the message
 * 3. AI generates response
 * 4. Response sent to Chatwoot
 */

import { queueIncomingMessage } from '../lib/queue/broker-queue';
import { BrokerPersona } from '../lib/calculations/broker-persona';
import { ProcessedLeadData } from '../lib/integrations/chatwoot-client';

async function testIncomingMessageFlow() {
  console.log('🧪 Testing BullMQ Incoming Message Flow\n');

  // Mock broker persona (balanced type)
  const brokerPersona: BrokerPersona = {
    name: 'Rachel Tan',
    type: 'balanced',
    title: 'Senior Mortgage Consultant',
    approach: 'Professional yet approachable',
    urgencyLevel: 'medium',
    avatar: 'RT',
    responseStyle: {
      tone: 'professional',
      pacing: 'moderate',
      focus: 'balanced',
    },
  };

  // Mock processed lead data
  const processedLeadData: ProcessedLeadData = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+6591234567',
    loanType: 'new_purchase',
    leadScore: 65,
    sessionId: 'test-session-123',
    actualIncomes: [8000],
    actualAges: [35],
    employmentType: 'employed',
    propertyCategory: 'condo',
    propertyType: 'private',
    brokerPersona,
  };

  try {
    console.log('📋 Step 1: Queueing incoming message to BullMQ...');

    const job = await queueIncomingMessage({
      conversationId: 280, // Test conversation ID from your report
      contactId: 123,
      brokerId: 'broker-123',
      brokerName: 'Rachel Tan',
      brokerPersona,
      processedLeadData,
      userMessage: 'hi',
      messageId: Date.now(),
    });

    console.log('✅ Message queued successfully!');
    console.log('   Job ID:', job.id);
    console.log('   Job Name:', job.name);
    console.log('   Priority:', job.opts.priority);
    console.log('\n⏳ Worker should now process this job...');
    console.log('   Check worker logs for processing details');
    console.log('   Worker will:');
    console.log('   1. Get broker assignment');
    console.log('   2. Analyze message urgency');
    console.log('   3. Generate AI response via OpenAI');
    console.log('   4. Send response to Chatwoot conversation 280');

    // Wait a bit to see initial processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const state = await job.getState();
    console.log('\n📊 Job State:', state);

    if (state === 'completed') {
      const result = await job.returnvalue;
      console.log('✅ Job completed:', result);
    } else if (state === 'failed') {
      const failedReason = job.failedReason;
      console.error('❌ Job failed:', failedReason);
    } else {
      console.log('⏳ Job still processing... (state:', state, ')');
      console.log('   Use worker logs to monitor progress');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testIncomingMessageFlow()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test script error:', error);
    process.exit(1);
  });
