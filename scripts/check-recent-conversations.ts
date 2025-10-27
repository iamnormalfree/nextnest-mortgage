#!/usr/bin/env tsx

/**
 * Check Recent Conversations for SLA Timing Data
 *
 * Looks for recent conversations that may have been created via manual form completion
 * and retrieves any available SLA timing data
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getRedisConnection } from '@/lib/queue/redis-config';

async function checkRecentConversations() {
  console.log('🔍 Checking Recent Conversations for SLA Data');
  console.log('   Timestamp:', new Date().toISOString());

  try {
    const redis = getRedisConnection();

    // Look for recent timing data keys
    console.log('\n📋 Step 1: Scanning Redis for timing data...');

    const timingKeys = await redis.keys('sla:timing:*');
    console.log(`   Found ${timingKeys.length} timing keys`);

    if (timingKeys.length === 0) {
      console.log('   ⚠️ No timing data found in Redis');
      return [];
    }

    // Get the 10 most recent timing records
    const recentKeys = timingKeys.slice(-10);

    console.log('\n📋 Step 2: Retrieving recent timing data...');

    const results = [];

    for (const key of recentKeys) {
      try {
        const data = await redis.hgetall(key);

        if (data && data.conversationId) {
          const conversationId = parseInt(data.conversationId);
          console.log(`\n   📊 Conversation ${conversationId}:`);
          console.log(`      Message ID: ${data.messageId || 'N/A'}`);
          console.log(`      Queue Timestamp: ${data.queueAddTimestamp ? new Date(parseInt(data.queueAddTimestamp)).toISOString() : 'N/A'}`);
          console.log(`      Worker Start: ${data.workerStartTimestamp ? new Date(parseInt(data.workerStartTimestamp)).toISOString() : 'N/A'}`);
          console.log(`      Worker Complete: ${data.workerCompleteTimestamp ? new Date(parseInt(data.workerCompleteTimestamp)).toISOString() : 'N/A'}`);
          console.log(`      Chatwoot Send: ${data.chatwootSendTimestamp ? new Date(parseInt(data.chatwootSendTimestamp)).toISOString() : 'N/A'}`);
          console.log(`      Total Duration: ${data.totalDuration ? data.totalDuration + 'ms' : 'N/A'}`);

          // Parse AI segment if present
          if (data.aiSegment) {
            try {
              const aiSegment = JSON.parse(data.aiSegment);
              console.log(`      🤖 AI Segment:`);
              console.log(`         Model: ${aiSegment.model || 'N/A'}`);
              console.log(`         Processing Time: ${aiSegment.aiProcessingTime ? aiSegment.aiProcessingTime + 'ms' : 'N/A'}`);
            } catch (e) {
              console.log(`      🤖 AI Segment: ${data.aiSegment}`);
            }
          }

          // Calculate phase breakdown if we have complete data
          if (data.queueAddTimestamp && data.workerStartTimestamp && data.workerCompleteTimestamp) {
            const queueToWorker = parseInt(data.workerStartTimestamp) - parseInt(data.queueAddTimestamp);
            const workerProcessing = parseInt(data.workerCompleteTimestamp) - parseInt(data.workerStartTimestamp);
            const totalDuration = data.totalDuration ? parseInt(data.totalDuration) : (Date.now() - parseInt(data.queueAddTimestamp));

            console.log(`      ⏱️ Phase Breakdown:`);
            console.log(`         Queue→Worker: ${queueToWorker}ms (${(queueToWorker/1000).toFixed(1)}s)`);
            console.log(`         Worker Processing: ${workerProcessing}ms (${(workerProcessing/1000).toFixed(1)}s)`);

            if (data.chatwootSendTimestamp) {
              const workerToChatwoot = parseInt(data.chatwootSendTimestamp) - parseInt(data.workerCompleteTimestamp);
              console.log(`         Worker→Chatwoot: ${workerToChatwoot}ms (${(workerToChatwoot/1000).toFixed(1)}s)`);
            }

            console.log(`      🎯 SLA Status: ${totalDuration < 5000 ? '✅ COMPLIANT' : '❌ BREACH'} (${totalDuration}ms)`);

            results.push({
              conversationId,
              messageId: data.messageId,
              queueTimestamp: parseInt(data.queueAddTimestamp),
              workerStart: parseInt(data.workerStartTimestamp),
              workerComplete: parseInt(data.workerCompleteTimestamp),
              chatwootSend: data.chatwootSendTimestamp ? parseInt(data.chatwootSendTimestamp) : null,
              totalDuration,
              queueToWorker,
              workerProcessing,
              slaCompliant: totalDuration < 5000
            });
          } else {
            console.log(`      ⚠️ Incomplete timing data`);
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing key ${key}:`, error);
      }
    }

    await redis.quit();

    return results;

  } catch (error) {
    console.error('❌ Error checking recent conversations:', error);
    return [];
  }
}

async function main() {
  try {
    console.log('🚀 Starting Recent Conversation Check');

    const results = await checkRecentConversations();

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
      } else {
        console.log('\n⚠️ No complete end-to-end examples found.');
        console.log('   All examples show queue→worker timing but stop at Chatwoot API integration.');
      }

      console.log('\n🎯 RECOMMENDATION:');
      if (completeExamples.length > 0 && compliantCount >= results.length * 0.95) {
        console.log('   ✅ P95 SLA target achieved - ready for production deployment');
      } else {
        console.log('   ⚠️ Need more complete examples or Chatwoot API fixes to validate P95 target');
      }

    } else {
      console.log('\n❌ No timing data found');
      console.log('   Either no conversations were created, or the worker did not process any messages');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed to check recent conversations:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}