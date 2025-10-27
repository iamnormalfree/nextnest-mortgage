#!/usr/bin/env tsx

/**
 * Simple Conversation Test for SLA
 *
 * Creates a minimal valid conversation using direct API calls
 * Then runs SLA profiling with that conversation ID
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { queueIncomingMessage } from '@/lib/queue/broker-queue';

async function testSLAWithRealConversation() {
  console.log('🎯 Simple SLA Test with Real Conversation');
  console.log('   Timestamp:', new Date().toISOString());

  try {
    // Use a conversation ID that might exist
    // Since the Chatwoot client created contact ID 67, let's try some reasonable conversation IDs
    const possibleConversationIds = [67, 68, 69, 100, 101];

    // Test with the first possible ID
    const testConversationId = possibleConversationIds[0];

    console.log(`\n📋 Testing with conversation ID: ${testConversationId}`);

    // Start the worker first
    console.log('\n🚀 Step 1: Ensuring worker is running...');
    const workerResponse = await fetch('http://localhost:3000/api/worker/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const workerStatus = await workerResponse.json();
    console.log('✅ Worker status:', workerStatus);

    // Wait a moment for worker to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📋 Step 2: Queueing test message...');

    const testMessage = 'Hello, I need help with a mortgage application. This is a test message for SLA validation.';

    const job = await queueIncomingMessage({
      conversationId: testConversationId,
      contactId: testConversationId,
      brokerId: 'sla-test-broker',
      userMessage: testMessage,
      messageType: 'incoming',
      priority: 1,
      source: 'web'
    });

    console.log('✅ Message queued successfully:');
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Conversation ID: ${testConversationId}`);

    if (job.data.timingData && job.data.timingData.queueAddTimestamp) {
      console.log(`   Queue timestamp: ${new Date(job.data.timingData.queueAddTimestamp).toISOString()}`);
    }

    console.log('\n📋 Step 3: Waiting for processing...');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('\n📋 Step 4: Checking results...');

    // Try to retrieve timing data
    const { getSLATimingData } = await import('@/lib/queue/broker-queue');

    try {
      const timingDataList = await getSLATimingData(testConversationId);

      if (timingDataList.length > 0) {
        console.log(`✅ Found ${timingDataList.length} timing records:`);

        timingDataList.forEach((timingData, index) => {
          console.log(`   Record ${index + 1}:`);
          console.log(`     Message ID: ${timingData.messageId}`);
          console.log(`     Queue Timestamp: ${timingData.queueAddTimestamp ? new Date(timingData.queueAddTimestamp).toISOString() : 'N/A'}`);
          console.log(`     Worker Start: ${timingData.workerStartTimestamp ? new Date(timingData.workerStartTimestamp).toISOString() : 'N/A'}`);
          console.log(`     Worker Complete: ${timingData.workerCompleteTimestamp ? new Date(timingData.workerCompleteTimestamp).toISOString() : 'N/A'}`);
          console.log(`     Chatwoot Send: ${timingData.chatwootSendTimestamp ? new Date(timingData.chatwootSendTimestamp).toISOString() : 'N/A'}`);
          console.log(`     Total Duration: ${timingData.totalDuration ? timingData.totalDuration + 'ms' : 'N/A'}`);

          if (timingData.aiSegment) {
            console.log(`     AI Segment:`);
            console.log(`       Model: ${timingData.aiSegment.model || 'N/A'}`);
            console.log(`       Processing Time: ${timingData.aiSegment.aiProcessingTime ? timingData.aiSegment.aiProcessingTime + 'ms' : 'N/A'}`);
          }
        });

        // Check if we have complete end-to-end timing
        const completeTiming = timingDataList.find(t => t.totalDuration && t.chatwootSendTimestamp);

        if (completeTiming) {
          console.log('\n✅ SUCCESS: Complete end-to-end timing captured!');
          console.log(`   Total Duration: ${completeTiming.totalDuration}ms`);
          console.log(`   SLA Status: ${completeTiming.totalDuration < 5000 ? 'COMPLIANT' : 'BREACH'}`);
          return testConversationId;
        } else {
          console.log('\n⚠️ Partial timing captured - worker processed but Chatwoot API may have failed');
          return testConversationId;
        }
      } else {
        console.log('❌ No timing data found');
      }
    } catch (error) {
      console.error('❌ Error retrieving timing data:', error);
    }

    return testConversationId;

  } catch (error) {
    console.error('❌ Error in SLA test:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Simple SLA Test');

    const conversationId = await testSLAWithRealConversation();

    console.log('\n🎯 RESULT:');
    console.log(`   Test completed with conversation ID: ${conversationId}`);
    console.log('   Check timing data above for SLA compliance');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}