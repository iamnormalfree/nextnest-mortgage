#!/usr/bin/env tsx

/**
 * Retrieve Real SLA Timing Data from Redis
 *
 * Extracts actual timing measurements from Redis for completed jobs
 * Provides real end-to-end SLA data for Task 2.5 completion
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getRedisConnection } from '@/lib/queue/redis-config';
import { getSLATimingData } from '@/lib/queue/broker-queue';

async function retrieveRealTimingData() {
  console.log('🔍 Retrieving Real SLA Timing Data from Redis');
  console.log('   Timestamp:', new Date().toISOString());

  try {
    // Test the conversation IDs from our recent test
    const conversationIds = [2001, 2002, 2003, 2004, 2005];
    const allTimingData = [];

    for (const conversationId of conversationIds) {
      console.log(`\n📊 Checking conversation ${conversationId}:`);

      try {
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
              console.log(`      AI Segment:`);
              console.log(`         Model: ${timingData.aiSegment.model || 'N/A'}`);
              console.log(`         Prompt Length: ${timingData.aiSegment.promptLength || 'N/A'}`);
              console.log(`         Response Length: ${timingData.aiSegment.responseLength || 'N/A'}`);
              console.log(`         Orchestrator Path: ${timingData.aiSegment.orchestratorPath || 'N/A'}`);
              console.log(`         AI Processing Time: ${timingData.aiSegment.aiProcessingTime ? timingData.aiSegment.aiProcessingTime + 'ms' : 'N/A'}`);
            }

            // Calculate phase breakdown if we have complete data
            if (timingData.queueAddTimestamp && timingData.workerStartTimestamp && timingData.workerCompleteTimestamp) {
              const queueToWorker = timingData.workerStartTimestamp - timingData.queueAddTimestamp;
              const workerProcessing = timingData.workerCompleteTimestamp - timingData.workerStartTimestamp;
              const totalDuration = timingData.totalDuration || (Date.now() - timingData.queueAddTimestamp);

              console.log(`      Phase Breakdown:`);
              console.log(`         Queue→Worker: ${queueToWorker}ms`);
              console.log(`         Worker Processing: ${workerProcessing}ms`);
              console.log(`         Worker→Chatwoot: ${timingData.chatwootSendTimestamp ? (timingData.chatwootSendTimestamp - timingData.workerCompleteTimestamp) + 'ms' : 'N/A'}`);

              allTimingData.push({
                conversationId,
                messageId: timingData.messageId,
                totalDuration,
                queueToWorker,
                workerProcessing,
                workerToChatwoot: timingData.chatwootSendTimestamp ? (timingData.chatwootSendTimestamp - timingData.workerCompleteTimestamp) : 0,
                aiSegment: timingData.aiSegment,
                slaStatus: totalDuration < 5000 ? 'COMPLIANT' : 'BREACH'
              });
            }
          });
        } else {
          console.log(`   ❌ No timing data found`);
        }
      } catch (error) {
        console.error(`   ❌ Error retrieving data for conversation ${conversationId}:`, error);
      }
    }

    // Summary analysis
    if (allTimingData.length > 0) {
      console.log(`\n📊 REAL SLA TIMING ANALYSIS:`);
      console.log(`   Total Samples: ${allTimingData.length}`);

      const compliantSamples = allTimingData.filter(d => d.slaStatus === 'COMPLIANT').length;
      const avgDuration = allTimingData.reduce((sum, d) => sum + d.totalDuration, 0) / allTimingData.length;
      const avgQueueToWorker = allTimingData.reduce((sum, d) => sum + d.queueToWorker, 0) / allTimingData.length;
      const avgWorkerProcessing = allTimingData.reduce((sum, d) => sum + d.workerProcessing, 0) / allTimingData.length;

      console.log(`   Average Total Duration: ${Math.round(avgDuration)}ms`);
      console.log(`   SLA Compliance Rate: ${(compliantSamples / allTimingData.length * 100).toFixed(1)}%`);
      console.log(`   Average Queue→Worker: ${Math.round(avgQueueToWorker)}ms`);
      console.log(`   Average Worker Processing: ${Math.round(avgWorkerProcessing)}ms`);

      // P95 calculation
      const sortedDurations = allTimingData.map(d => d.totalDuration).sort((a, b) => a - b);
      const p95Index = Math.floor(sortedDurations.length * 0.95);
      const p95Duration = sortedDurations[p95Index] || sortedDurations[sortedDurations.length - 1];

      console.log(`   P95 Duration: ${p95Duration}ms`);
      console.log(`   P95 SLA Status: ${p95Duration < 5000 ? '✅ COMPLIANT' : '❌ BREACH'}`);

      return {
        samples: allTimingData,
        analysis: {
          totalSamples: allTimingData.length,
          complianceRate: compliantSamples / allTimingData.length * 100,
          averageDuration: Math.round(avgDuration),
          p95Duration,
          p95Compliant: p95Duration < 5000
        }
      };
    } else {
      console.log(`\n❌ No complete timing data found`);
      return null;
    }

  } catch (error) {
    console.error('❌ Failed to retrieve timing data:', error);
    return null;
  }
}

async function main() {
  try {
    console.log('🎯 Task 2.5 - Real SLA Data Retrieval');

    const results = await retrieveRealTimingData();

    if (results) {
      console.log(`\n✅ SUCCESS: Real SLA timing data retrieved`);
      console.log(`   Ready for Task 2.5 completion with actual measurements`);

      if (results.analysis.p95Compliant) {
        console.log(`🎯 P95 SLA Target Achieved: ${results.analysis.p95Duration}ms < 5000ms`);
      } else {
        console.log(`⚠️ P95 SLA Target Not Met: ${results.analysis.p95Duration}ms ≥ 5000ms`);
        console.log(`   Optimizations needed to meet target`);
      }
    } else {
      console.log(`\n❌ No timing data available - worker may not be processing jobs completely`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}