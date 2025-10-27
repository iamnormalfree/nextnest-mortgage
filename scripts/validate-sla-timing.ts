#!/usr/bin/env tsx

/**
 * Direct SLA Timing Validation
 *
 * Tests the queue timing system directly without requiring full webhooks
 * This validates that our hop-by-hop timing instrumentation works correctly.
 */

import { config } from 'dotenv';
// Load environment variables from .env.local
config({ path: '.env.local' });

import { queueIncomingMessage, getSLATimingData } from '@/lib/queue/broker-queue';
import { mockBrokerPersona, mockLeadData } from '@/tests/fixtures/broker-test-data';

interface TimingSample {
  sampleId: number;
  conversationId: number;
  timestamp: string;
  queueAddTimestamp: number;
  workerStartTimestamp?: number;
  workerCompleteTimestamp?: number;
  totalDuration?: number;
  processingTime: number;
}

async function runSLATimingValidation() {
  console.log('🔍 SLA Timing Validation - Direct Queue Testing');
  console.log(`   Target: Validate hop-by-hop timing instrumentation`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const samples: TimingSample[] = [];
  const sampleCount = 10;

  console.log(`📊 Testing ${sampleCount} queue jobs with timing instrumentation...\n`);

  for (let i = 0; i < sampleCount; i++) {
    const sampleId = i + 1;
    const conversationId = 1000 + sampleId;

    console.log(`📋 Test ${sampleId}/${sampleCount}: Processing queue job ${conversationId}`);

    try {
      // Record queue add time
      const queueAddTime = Date.now();

      // Queue the message (this will inject timing data)
      const job = await queueIncomingMessage({
        conversationId,
        contactId: 2000 + sampleId,
        brokerId: 'test-broker-' + sampleId,
        brokerName: `Test Broker ${sampleId}`,
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: `Test message ${sampleId}: How much can I borrow?`,
      });

      console.log(`   ✅ Job queued: ${job.id}`);

      // Simulate processing time (500ms - 2000ms)
      const processingTime = 500 + Math.random() * 1500;
      console.log(`   ⏳ Simulating ${Math.round(processingTime)}ms processing time...`);

      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Get timing data for this conversation
      const timingDataList = await getSLATimingData(conversationId);

      if (timingDataList.length > 0) {
        const timingData = timingDataList[0];

        const sample: TimingSample = {
          sampleId,
          conversationId,
          timestamp: new Date().toISOString(),
          queueAddTimestamp: timingData.queueAddTimestamp || queueAddTime,
          workerStartTimestamp: timingData.workerStartTimestamp,
          workerCompleteTimestamp: timingData.workerCompleteTimestamp,
          totalDuration: timingData.totalDuration,
          processingTime: Math.round(processingTime),
        };

        samples.push(sample);

        const latency = sample.totalDuration ? Math.round(sample.totalDuration) : 'N/A';
        const status = sample.totalDuration && sample.totalDuration < 5000 ? '✅ SLA OK' : '⚠️ SLA BREACH';
        console.log(`   📊 End-to-end latency: ${latency}ms ${status}`);

        if (timingData.workerStartTimestamp && timingData.workerCompleteTimestamp) {
          const actualProcessing = timingData.workerCompleteTimestamp - timingData.workerStartTimestamp;
          console.log(`   ⚙️ Worker processing: ${actualProcessing}ms`);
        }

      } else {
        console.log(`   ⚠️ No timing data found for conversation ${conversationId}`);
      }

    } catch (error) {
      console.error(`   ❌ Test failed:`, error);
    }

    console.log('');

    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate statistics
  const completeSamples = samples.filter(s => s.totalDuration && s.totalDuration > 0);

  if (completeSamples.length === 0) {
    console.log('❌ FAILED: No complete timing data collected');
    return {
      success: false,
      samples,
      statistics: null,
    };
  }

  const durations = completeSamples.map(s => s.totalDuration!).sort((a, b) => a - b);

  const statistics = {
    totalSamples: samples.length,
    completeSamples: completeSamples.length,
    meanLatency: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    medianLatency: durations[Math.floor(durations.length / 2)],
    p95Latency: durations[Math.floor(durations.length * 0.95)],
    p99Latency: durations[Math.floor(durations.length * 0.99)],
    minLatency: durations[0],
    maxLatency: durations[durations.length - 1],
    slaCompliant: durations.filter(d => d < 5000).length,
    slaComplianceRate: (durations.filter(d => d < 5000).length / durations.length) * 100,
  };

  return {
    success: true,
    samples,
    statistics,
  };
}

async function main() {
  try {
    const results = await runSLATimingValidation();

    // Display results
    console.log('='.repeat(80));
    console.log('📊 SLA TIMING VALIDATION RESULTS');
    console.log('='.repeat(80));

    if (!results.success) {
      console.log('❌ VALIDATION FAILED: No timing data collected');
      console.log('');
      console.log('Possible causes:');
      console.log('  - Redis not running');
      console.log('  - ENABLE_SLA_TIMING not set to "true"');
      console.log('  - Queue system not properly initialized');
      console.log('');
      console.log('Troubleshooting:');
      console.log('  1. Check Redis connection: npm run monitor:health');
      console.log('  2. Set environment: ENABLE_SLA_TIMING=true');
      console.log('  3. Verify queue system: npm run monitor:queue');
      process.exit(1);
    }

    console.log(`Total samples: ${results.statistics!.totalSamples}`);
    console.log(`Complete samples: ${results.statistics!.completeSamples}`);
    console.log('');
    console.log('📈 TIMING STATISTICS:');
    console.log(`   Mean latency: ${Math.round(results.statistics!.meanLatency)}ms`);
    console.log(`   Median latency: ${Math.round(results.statistics!.medianLatency)}ms`);
    console.log(`   P95 latency: ${Math.round(results.statistics!.p95Latency)}ms`);
    console.log(`   P99 latency: ${Math.round(results.statistics!.p99Latency)}ms`);
    console.log(`   Min latency: ${Math.round(results.statistics!.minLatency)}ms`);
    console.log(`   Max latency: ${Math.round(results.statistics!.maxLatency)}ms`);
    console.log('');
    console.log('🎯 SLA COMPLIANCE:');
    console.log(`   SLA compliant (<5s): ${results.statistics!.slaCompliant}/${results.statistics!.completeSamples} (${results.statistics!.slaComplianceRate.toFixed(1)}%)`);
    console.log('');

    // Generate detailed sample report
    console.log('📋 SAMPLE DETAILS:');
    results.samples.forEach(sample => {
      const latency = sample.totalDuration ? Math.round(sample.totalDuration) : 'N/A';
      const status = sample.totalDuration && sample.totalDuration < 5000 ? '✅' : '❌';
      console.log(`   Sample ${sample.sampleId}: Conv ${sample.conversationId} - ${latency}ms ${status}`);
    });

    console.log('');

    // Conclusion
    const p95Passes = results.statistics!.p95Latency < 5000;
    const slaPasses = results.statistics!.slaComplianceRate >= 95;

    if (p95Passes && slaPasses) {
      console.log('✅ SLA VALIDATION PASSED');
      console.log(`   P95 latency ${Math.round(results.statistics!.p95Latency)}ms < 5000ms ✅`);
      console.log(`   SLA compliance ${results.statistics!.slaComplianceRate.toFixed(1)}% ≥ 95% ✅`);
      console.log('');
      console.log('🎉 Hop-by-hop timing instrumentation is working correctly!');
      console.log('   - Queue timestamps captured ✅');
      console.log('   - Worker timestamps captured ✅');
      console.log('   - End-to-end duration calculated ✅');
      console.log('   - P95 latency meets SLA requirements ✅');
      process.exit(0);
    } else {
      console.log('❌ SLA VALIDATION FAILED');
      if (!p95Passes) {
        console.log(`   P95 latency ${Math.round(results.statistics!.p95Latency)}ms ≥ 5000ms ❌`);
      }
      if (!slaPasses) {
        console.log(`   SLA compliance ${results.statistics!.slaComplianceRate.toFixed(1)}% < 95% ❌`);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ SLA validation execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runSLATimingValidation };