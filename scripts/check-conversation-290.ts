#!/usr/bin/env tsx

/**
 * Check Conversation 290 for SLA Timing Data
 *
 * Checks the specific conversation created via manual form completion
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSLATimingData } from '@/lib/queue/broker-queue';

async function checkConversation290() {
  console.log('🎯 Checking Conversation 290 for SLA Data');
  console.log('   Timestamp:', new Date().toISOString());
  console.log('   Conversation ID: 290 (from manual form completion)');

  try {
    const conversationId = 290;

    console.log('\n📊 Retrieving timing data...');

    const timingDataList = await getSLATimingData(conversationId);

    if (timingDataList.length > 0) {
      console.log(`✅ Found ${timingDataList.length} timing records:`);

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
            console.log(`      ⚠️ Worker completed but Chatwoot send failed (404 error)`);
          }
        } else {
          console.log(`      ⚠️ Incomplete timing data - worker may still be processing`);
        }
      });

      // Summary analysis
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

        // P95 calculation
        const sortedDurations = completeExamples.map(ex => ex.totalDuration).sort((a, b) => a - b);
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p95Duration = sortedDurations[p95Index] || sortedDurations[sortedDurations.length - 1];

        console.log(`   P95 Duration: ${p95Duration}ms (${(p95Duration/1000).toFixed(1)}s)`);
        console.log(`   P95 SLA Status: ${p95Duration < 5000 ? '✅ UNDER 5s TARGET' : '❌ EXCEEDS 5s TARGET'}`);

        console.log('\n🎉 SUCCESS: Real end-to-end SLA data captured!');
        console.log('   This demonstrates that the manual form approach bypasses the Chatwoot API 404 issue.');
        console.log('   The worker can complete jobs successfully when given valid conversation IDs.');

      } else {
        console.log('\n⚠️ No complete end-to-end examples found.');
        console.log('   The worker may still be processing, or Chatwoot integration is still failing.');
        console.log('   Try waiting 30 more seconds and running this script again.');
      }

    } else {
      console.log('❌ No timing data found for conversation 290');
      console.log('   This could mean:');
      console.log('   1. The worker has not processed the message yet');
      console.log('   2. There was an error in the message processing');
      console.log('   3. The message was not queued properly');
      console.log('\n💡 Suggestions:');
      console.log('   - Wait 30 seconds and run this script again');
      console.log('   - Check if the worker is running: curl -X POST http://localhost:3000/api/worker/start');
      console.log('   - Send another test message in the chat interface');
    }

  } catch (error) {
    console.error('❌ Error checking conversation 290:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Conversation 290 SLA Check');
    await checkConversation290();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to check conversation 290:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}