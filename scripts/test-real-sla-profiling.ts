#!/usr/bin/env tsx

/**
 * Real SLA Profiling Test - Phase 2 Task 2.5
 *
 * Tests the actual worker with AI segment instrumentation
 * Generates real end-to-end timing samples for optimization
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { queueIncomingMessage } from '@/lib/queue/broker-queue';
import { mockBrokerPersona, mockLeadData } from '@/tests/fixtures/broker-test-data';

interface RealTimingSample {
  sampleId: number;
  conversationId: number;
  userMessage: string;
  timestamp: string;
  queueAddTimestamp: number;
  results?: any;
}

async function testRealSLASamples(): Promise<RealTimingSample[]> {
  console.log('🚀 Starting Real SLA Profiling Test');
  console.log('   Testing optimized worker with AI segment instrumentation');

  const samples: RealTimingSample[] = [];
  const sampleCount = 5; // Start with 5 samples to test

  // Test scenarios - mix of short and long messages
  const testScenarios = [
    'Hi, I need help with a mortgage application', // Short message - should use gpt-4o-mini
    'What is the current interest rate for a 30-year fixed mortgage?', // Medium
    'I have a credit score of 750, earn $8,000/month, and have $50,000 saved. How much can I borrow for a condo?', // Long - may use claude-3.5-sonnet
    'What documents do I need for a mortgage application?', // Short
    'Can you explain the difference between fixed and variable mortgage rates, including pros and cons for each option?', // Medium-long
  ];

  console.log(`\n📊 Capturing ${sampleCount} real timing samples...\n`);

  for (let i = 0; i < sampleCount; i++) {
    const sampleId = i + 1;
    const conversationId = 2000 + sampleId; // Different range from previous tests
    const userMessage = testScenarios[i];

    console.log(`📋 Sample ${sampleId}/${sampleCount}: ${userMessage.substring(0, 60)}...`);

    try {
      // Record queue start time
      const queueStart = Date.now();

      // Queue the message with timing instrumentation
      const job = await queueIncomingMessage({
        conversationId,
        contactId: 3000 + sampleId,
        brokerId: 'test-broker-sla-' + sampleId,
        brokerName: `SLA Test Broker ${sampleId}`,
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage,
      });

      console.log(`   ✅ Job queued: ${job.id}`);

      const sample: RealTimingSample = {
        sampleId,
        conversationId,
        userMessage,
        timestamp: new Date().toISOString(),
        queueAddTimestamp: queueStart,
      };

      samples.push(sample);

      console.log(`   📊 Queue timestamp captured: ${queueStart}`);

    } catch (error) {
      console.error(`   ❌ Sample failed:`, error);
    }

    console.log('');

    // Brief pause between samples
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return samples;
}

async function checkWorkerStatus() {
  try {
    const response = await fetch('http://localhost:3002/api/worker/start', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Worker not responding');
    }

    const status = await response.json();
    console.log('✅ Worker status:', status.status);
    return status.status.running;
  } catch (error) {
    console.error('❌ Worker check failed:', error);
    return false;
  }
}

async function monitorResults(conversationIds: number[]) {
  console.log('\n⏳ Monitoring for worker processing results...');

  // Wait for worker to process jobs
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Check queue status
  try {
    const response = await fetch('http://localhost:3002/api/admin/migration-status');
    const status = await response.json();

    console.log('\n📈 Queue Status After Processing:');
    console.log(`   Active: ${status.queue.active}`);
    console.log(`   Completed: ${status.queue.completed}`);
    console.log(`   Failed: ${status.queue.failed}`);
    console.log(`   Waiting: ${status.queue.waiting}`);

    return status;
  } catch (error) {
    console.error('❌ Failed to check queue status:', error);
    return null;
  }
}

async function main() {
  try {
    console.log('🎯 Phase 2 Task 2.5 - Real SLA Profiling Test');
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('');

    // Check if worker is running
    const workerRunning = await checkWorkerStatus();
    if (!workerRunning) {
      console.error('❌ Worker is not running. Please start the worker first.');
      process.exit(1);
    }

    // Generate real timing samples
    const samples = await testRealSLASamples();

    console.log(`\n✅ Generated ${samples.length} real timing samples`);
    console.log('   Now monitoring for worker processing results...');

    // Monitor results
    const finalStatus = await monitorResults(samples.map(s => s.conversationId));

    if (finalStatus) {
      console.log('\n📊 Final Results:');
      console.log(`   Total jobs queued: ${samples.length}`);
      console.log(`   Completed jobs: ${finalStatus.queue.completed}`);
      console.log(`   Failed jobs: ${finalStatus.queue.failed}`);

      const successRate = finalStatus.queue.completed / samples.length * 100;
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);

      if (successRate >= 80) {
        console.log('\n✅ Real SLA profiling test completed successfully');
        console.log('   Ready to run full 10-sample profiling with optimization');
      } else {
        console.log('\n⚠️ Low success rate - worker may need debugging');
      }
    }

  } catch (error) {
    console.error('❌ Real SLA profiling test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}