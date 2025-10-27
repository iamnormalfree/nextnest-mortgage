#!/usr/bin/env tsx

/**
 * Scan All Recent Conversations for SLA Data
 *
 * Looks for any recent timing data regardless of conversation ID
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSLATimingData } from '@/lib/queue/broker-queue';

async function scanAllConversations() {
  console.log('🔍 Scanning All Recent Conversations for SLA Data');
  console.log('   Timestamp:', new Date().toISOString());

  // Try a range of possible conversation IDs that might have been created recently
  const possibleIds = [
    // Recent manual form completion likely creates higher IDs
    66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
    100, 101, 102, 103, 104, 105,
    500, 501, 502, 503, 504, 505,
    1000, 1001, 1002, 1003, 1004, 1005
  ];

  let foundData = [];

  for (const conversationId of possibleIds) {
    try {
      console.log(`\n📊 Checking conversation ${conversationId}:`);

      const timingDataList = await getSLATimingData(conversationId);

      if (timingDataList.length > 0) {
        console.log(`   ✅ Found ${timingDataList.length} timing records`);

        timingDataList.forEach((timingData, index) => {
          console.log(`   📈 Record ${index + 1}:`);
          console.log(`      Message ID: ${timingData.messageId}`);
          console.log(`      Queue Timestamp: ${timingData.queueAddTimestamp ? new Date(timingData.queueAddTimestamp).toISOString() : 'N/A'}`);
          console.log(`      Worker Start: ${timingData.workerStartTimestamp ? new Date(timingData.workerStartTimestamp).toISOString() : 'N/A'}`);
          console.log(`      Worker Complete: ${timingData.workerCompleteTimestamp ? new Date(timingData.workerCompleteTimestamp).toISOString() : 'N/A'}`);
          console.log(`      Chatwoot Send: ${timingData.chatwootSendTimestamp ? new Date(timingData.chatwootSendTimestamp).toISOString() : 'N/A'}`);
          console.log(`      Total Duration: ${timingData.totalDuration ? timingData.totalDuration + 'ms' : 'N/A'}`);

          if (timingData.aiSegment) {
            console.log(`      🤖 AI Segment:`);
            console.log(`         Model: ${timingData.aiSegment.model || 'N/A'}`);
            console.log(`         Processing Time: ${timingData.aiSegment.aiProcessingTime ? timingData.aiSegment.aiProcessingTime + 'ms' : 'N/A'}`);
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
            }

            console.log(`      🎯 SLA Status: ${totalDuration < 5000 ? '✅ COMPLIANT' : '❌ BREACH'} (${totalDuration}ms)`);

            foundData.push({
              conversationId,
              messageId: timingData.messageId,
              queueTimestamp: timingData.queueAddTimestamp,
              workerStart: timingData.workerStartTimestamp,
              workerComplete: timingData.workerCompleteTimestamp,
              chatwootSend: timingData.chatwootSendTimestamp,
              totalDuration,
              queueToWorker,
              workerProcessing,
              slaCompliant: totalDuration < 5000
            });
          }
        });
      } else {
        console.log(`   ❌ No timing data found`);
      }
    } catch (error) {
      console.log(`   ⚠️ Error checking conversation ${conversationId}: ${error.message}`);
    }
  }

  return foundData;
}

async function main() {
  try {
    console.log('🚀 Starting Full Conversation Scan');

    const results = await scanAllConversations();

    if (results.length > 0) {
      console.log('\n📊 SUMMARY:');
      console.log(`   Total conversations with timing data: ${results.length}`);

      const compliantCount = results.filter(r => r.slaCompliant).length;
      const avgTotalDuration = results.reduce((sum, r) => sum + r.totalDuration, 0) / results.length;
      const avgQueueToWorker = results.reduce((sum, r) => sum + r.queueToWorker, 0) / results.length;
      const avgWorkerProcessing = results.reduce((sum, r) => sum + r.workerProcessing, 0) / results.length;

      console.log(`   SLA Compliance Rate: ${(compliantCount / results.length * 100).toFixed(1)}%`);
      console.log(`   Average Total Duration: ${Math.round(avgTotalDuration)}ms (${(avgTotalDuration/1000).toFixed(1)}s)`);
      console.log(`   Average Queue→Worker: ${Math.round(avgQueueToWorker)}ms (${(avgQueueToWorker/1000).toFixed(1)}s)`);
      console.log(`   Average Worker Processing: ${Math.round(avgWorkerProcessing)}ms (${(avgWorkerProcessing/1000).toFixed(1)}s)`);

      // Find complete end-to-end examples
      const completeExamples = results.filter(r => r.chatwootSend !== null);

      if (completeExamples.length > 0) {
        console.log(`\n🎉 SUCCESS: Found ${completeExamples.length} complete end-to-end examples!`);
        console.log('   These show full queue→worker→Chatwoot timing with real data.');

        completeExamples.forEach((example, index) => {
          console.log(`\n   Complete Example ${index + 1}:`);
          console.log(`      Conversation ID: ${example.conversationId}`);
          console.log(`      Total Duration: ${example.totalDuration}ms (${(example.totalDuration/1000).toFixed(1)}s)`);
          console.log(`      SLA Status: ${example.totalDuration < 5000 ? '✅ COMPLIANT' : '❌ BREACH'}`);
        });
      } else {
        console.log('\n⚠️ No complete end-to-end examples found.');
        console.log('   All examples show queue→worker timing but stop at Chatwoot API integration.');
      }

    } else {
      console.log('\n❌ No timing data found for any conversation IDs');
      console.log('   This suggests either:');
      console.log('   1. The worker did not process the message from your manual form completion');
      console.log('   2. The manual form completion created a conversation ID outside our search range');
      console.log('   3. There was an error in the processing pipeline');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed to scan conversations:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}