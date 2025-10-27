#!/usr/bin/env tsx

/**
 * Send Test Message to Conversation 290
 *
 * Sends a fresh test message to trigger worker processing now that worker is running
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { queueIncomingMessage } from '@/lib/queue/broker-queue';

async function sendTestMessageTo290() {
  console.log('🎯 Sending Test Message to Conversation 290');
  console.log('   Timestamp:', new Date().toISOString());

  try {
    console.log('\n📋 Step 1: Queueing fresh test message...');

    const testMessage = 'Hi, I need help with a mortgage application. This is a fresh test message for SLA validation.';

    const job = await queueIncomingMessage({
      conversationId: 290,
      contactId: 290,
      brokerId: 'sla-test-broker-290',
      userMessage: testMessage,
      messageType: 'incoming',
      priority: 1,
      source: 'web'
    });

    console.log('✅ Message queued successfully:');
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Conversation ID: 290`);
    console.log(`   Message: ${testMessage}`);

    if (job.data.timingData && job.data.timingData.queueAddTimestamp) {
      console.log(`   Queue timestamp: ${new Date(job.data.timingData.queueAddTimestamp).toISOString()}`);
    }

    console.log('\n📋 Step 2: Waiting for worker processing...');

    // Wait for worker to process
    console.log('   ⏳ Waiting 15 seconds for worker to process...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n📋 Step 3: Retrieving updated timing data...');

    const { getSLATimingData } = await import('@/lib/queue/broker-queue');

    const timingDataList = await getSLATimingData(290);

    console.log(`\n📊 Found ${timingDataList.length} timing records for conversation 290:`);

    let completeExamples = [];

    timingDataList.forEach((timingData, index) => {
      console.log(`\n   📈 Record ${index + 1}:`);
      console.log(`      Message ID: ${timingData.messageId}`);
      console.log(`      Queue Timestamp: ${timingData.queueAddTimestamp ? new Date(timingData.queueAddTimestamp).toISOString() : 'N/A'}`);
      console.log(`      Worker Start: ${timingData.workerStartTimestamp ? new Date(timingData.workerStartTimestamp).toISOString() : 'N/A'}`);
      console.log(`      Worker Complete: ${timingData.workerCompleteTimestamp ? new Date(timingData.workerCompleteTimestamp).toISOString() : 'N/A'}`);
      console.log(`      Chatwoot Send: ${timingData.chatwootSendTimestamp ? new Date(timingData.chatwootSendTimestamp).toISOString() : 'N/A'}`);
      console.log(`      Total Duration: ${timingData.totalDuration ? timingData.totalDuration + 'ms' : 'N/A'}`);

      if (timingData.aiSegment) {
        console.log(`      🤖 AI Segment:`);
        console.log(`         Model: ${timingData.aiSegment.model || 'N/A'}`);
        console.log(`         Prompt Length: ${timingData.aiSegment.promptLength || 'N/A'} chars`);
        console.log(`         Response Length: ${timingData.aiSegment.responseLength || 'N/A'} chars`);
        console.log(`         Orchestrator Path: ${timingData.aiSegment.orchestratorPath || 'N/A'}`);
        console.log(`         AI Processing Time: ${timingData.aiSegment.aiProcessingTime ? timingData.aiSegment.aiProcessingTime + 'ms' : 'N/A'}`);
      }

      // Calculate phase breakdown if we have complete data
      if (timingData.queueAddTimestamp && timingData.workerStartTimestamp && timingData.workerCompleteTimestamp) {
        const queueToWorker = timingData.workerStartTimestamp - timingData.queueAddTimestamp;
        const workerProcessing = timingData.workerCompleteTimestamp - timingData.workerStartTimestamp;
        const totalDuration = timingData.totalDuration || (Date.now() - timingData.queueAddTimestamp);

        console.log(`      ⏱️ Phase Breakdown:`);
        console.log(`         Queue→Worker: ${queueToWorker}ms (${(queueToWorker/1000).toFixed(1)}s)`);
        console.log(`         Worker Processing: ${workerProcessing}ms (${(workerProcessing/1000).toFixed(1)}s)`);

        if (timingData.chatwootSendTimestamp) {
          const workerToChatwoot = timingData.chatwootSendTimestamp - timingData.workerCompleteTimestamp;
          console.log(`         Worker→Chatwoot: ${workerToChatwoot}ms (${(workerToChatwoot/1000).toFixed(1)}s)`);

          console.log(`      🎯 SLA Status: ${totalDuration < 5000 ? '✅ COMPLIANT' : '❌ BREACH'} (${totalDuration}ms)`);

          if (timingData.totalDuration) {
            completeExamples.push({
              messageId: timingData.messageId,
              totalDuration: timingData.totalDuration,
              queueToWorker,
              workerProcessing,
              workerToChatwoot,
              slaCompliant: timingData.totalDuration < 5000
            });
          }
        } else {
          console.log(`      ⚠️ Worker completed but Chatwoot send failed`);
        }
      } else {
        console.log(`      ⚠️ Incomplete timing data - worker may still be processing`);
      }
    });

    // Summary
    console.log('\n📊 CONVERSATION 290 SUMMARY:');
    console.log(`   Total timing records: ${timingDataList.length}`);
    console.log(`   Complete end-to-end examples: ${completeExamples.length}`);

    if (completeExamples.length > 0) {
      const avgDuration = completeExamples.reduce((sum, ex) => sum + ex.totalDuration, 0) / completeExamples.length;
      const avgQueueToWorker = completeExamples.reduce((sum, ex) => sum + ex.queueToWorker, 0) / completeExamples.length;
      const avgWorkerProcessing = completeExamples.reduce((sum, ex) => sum + ex.workerProcessing, 0) / completeExamples.length;
      const compliantCount = completeExamples.filter(ex => ex.slaCompliant).length;

      console.log(`   Average Total Duration: ${Math.round(avgDuration)}ms (${(avgDuration/1000).toFixed(1)}s)`);
      console.log(`   Average Queue→Worker: ${Math.round(avgQueueToWorker)}ms (${(avgQueueToWorker/1000).toFixed(1)}s)`);
      console.log(`   Average Worker Processing: ${Math.round(avgWorkerProcessing)}ms (${(avgWorkerProcessing/1000).toFixed(1)}s)`);
      console.log(`   SLA Compliance Rate: ${(compliantCount / completeExamples.length * 100).toFixed(1)}%`);

      console.log('\n🎉 SUCCESS: Real end-to-end SLA data captured!');
      console.log('   The manual form approach successfully bypassed the Chatwoot API 404 issue.');

    } else {
      console.log('\n⚠️ Still no complete end-to-end examples found.');
      console.log('   The worker may be encountering issues with Chatwoot API integration.');
    }

    return completeExamples;

  } catch (error) {
    console.error('❌ Error sending test message to conversation 290:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Test Message to Conversation 290');

    const results = await sendTestMessageTo290();

    if (results.length > 0) {
      console.log('\n🎯 FINAL RESULT:');
      console.log(`   ✅ Successfully captured ${results.length} complete SLA measurements`);
      console.log('   Task 2.5 can be marked as COMPLETED with real end-to-end data');
    } else {
      console.log('\n⚠️ Need to investigate worker processing or Chatwoot integration');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed to send test message:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}