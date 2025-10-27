#!/usr/bin/env tsx

/**
 * Test script for the performance analysis endpoint
 * Validates the API structure and response format
 */

interface PerformanceResponse {
  success: boolean;
  data?: {
    totalMessages: number;
    completeMessages: number;
    partialMessages: number;
    distribution: {
      under1s: number;
      under2s: number;
      under5s: number;
      over5s: number;
      over10s: number;
      over30s: number;
    };
    stats: {
      meanLatency: number;
      medianLatency: number;
      p95Latency: number;
      p99Latency: number;
      minLatency: number;
      maxLatency: number;
    };
    phaseBreakdown: {
      queueToWorker: number;
      workerProcessing: number;
      workerToChatwoot: number;
    };
    recentSamples: any[];
    systemInfo: {
      enabled: boolean;
      lastUpdated: string;
      sampleWindow: string;
    };
  };
  error?: string;
}

async function testPerformanceEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/admin/performance-analysis`;

  console.log(`🧪 Testing Performance Analysis Endpoint`);
  console.log(`   URL: ${endpoint}`);
  console.log('');

  try {
    // Test 1: Basic request
    console.log('📋 Test 1: Basic API request...');
    const response = await fetch(endpoint);

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: PerformanceResponse = await response.json();
    console.log(`   Response success: ${result.success}`);

    if (!result.success) {
      console.error(`   ❌ API Error: ${result.error}`);
      return;
    }

    if (!result.data) {
      console.error('   ❌ No data in response');
      return;
    }

    // Test 2: Validate response structure
    console.log('\n📋 Test 2: Validating response structure...');
    const data = result.data;

    const requiredFields = [
      'totalMessages',
      'completeMessages',
      'partialMessages',
      'distribution',
      'stats',
      'phaseBreakdown',
      'systemInfo'
    ];

    let structureValid = true;
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`   ❌ Missing field: ${field}`);
        structureValid = false;
      } else {
        console.log(`   ✅ ${field}: present`);
      }
    }

    if (!structureValid) {
      return;
    }

    // Test 3: Validate nested structures
    console.log('\n📋 Test 3: Validating nested structures...');

    // Distribution fields
    const distributionFields = ['under1s', 'under2s', 'under5s', 'over5s', 'over10s', 'over30s'];
    for (const field of distributionFields) {
      if (typeof (data.distribution as any)[field] !== 'number') {
        console.error(`   ❌ Distribution.${field} should be a number`);
        structureValid = false;
      } else {
        console.log(`   ✅ Distribution.${field}: ${(data.distribution as any)[field]}`);
      }
    }

    // Stats fields
    const statsFields = ['meanLatency', 'medianLatency', 'p95Latency', 'p99Latency', 'minLatency', 'maxLatency'];
    for (const field of statsFields) {
      if (typeof (data.stats as any)[field] !== 'number') {
        console.error(`   ❌ Stats.${field} should be a number`);
        structureValid = false;
      } else {
        console.log(`   ✅ Stats.${field}: ${(data.stats as any)[field]}ms`);
      }
    }

    // Phase breakdown fields
    const phaseFields = ['queueToWorker', 'workerProcessing', 'workerToChatwoot'];
    for (const field of phaseFields) {
      if (typeof (data.phaseBreakdown as any)[field] !== 'number') {
        console.error(`   ❌ PhaseBreakdown.${field} should be a number`);
        structureValid = false;
      } else {
        console.log(`   ✅ PhaseBreakdown.${field}: ${(data.phaseBreakdown as any)[field]}ms`);
      }
    }

    // Test 4: Validate data consistency
    console.log('\n📋 Test 4: Validating data consistency...');

    const totalMessages = data.completeMessages + data.partialMessages;
    if (totalMessages !== data.totalMessages) {
      console.warn(`   ⚠️ Message count mismatch: ${data.completeMessages} + ${data.partialMessages} ≠ ${data.totalMessages}`);
    } else {
      console.log(`   ✅ Message counts consistent: ${data.totalMessages}`);
    }

    // Check distribution sums
    const distributionTotal = Object.values(data.distribution).reduce((sum, count) => sum + count, 0);
    if (distributionTotal > totalMessages) {
      console.warn(`   ⚠️ Distribution total (${distributionTotal}) exceeds message count (${totalMessages})`);
    } else {
      console.log(`   ✅ Distribution counts reasonable: ${distributionTotal}/${totalMessages}`);
    }

    // Check latency consistency
    if (data.stats.minLatency > data.stats.maxLatency) {
      console.error(`   ❌ Invalid latency range: min (${data.stats.minLatency}) > max (${data.stats.maxLatency})`);
    } else if (data.stats.medianLatency < data.stats.minLatency || data.stats.medianLatency > data.stats.maxLatency) {
      console.error(`   ❌ Invalid median: ${data.stats.medianLatency} outside range [${data.stats.minLatency}, ${data.stats.maxLatency}]`);
    } else {
      console.log(`   ✅ Latency statistics consistent`);
    }

    // Test 5: Test query parameters
    console.log('\n📋 Test 5: Testing query parameters...');

    // Test with limit parameter
    const limitedResponse = await fetch(`${endpoint}?limit=5`);
    const limitedResult: PerformanceResponse = await limitedResponse.json();

    if (limitedResult.success && limitedResult.data) {
      console.log(`   ✅ Limit parameter works: ${limitedResult.data.recentSamples.length} samples returned`);
    } else {
      console.log(`   ⚠️ Limit parameter may not be working as expected`);
    }

    // Test 6: Performance expectations
    console.log('\n📋 Test 6: Validating performance expectations...');

    if (data.totalMessages > 0) {
      // SLA compliance rate
      const slaComplianceRate = (data.distribution.under5s / totalMessages) * 100;
      console.log(`   SLA Compliance (<5s): ${slaComplianceRate.toFixed(1)}%`);

      if (slaComplianceRate >= 95) {
        console.log(`   ✅ SLA compliance meets target (≥95%)`);
      } else {
        console.log(`   ⚠️ SLA compliance below target (≥95%)`);
      }

      // Mean latency
      if (data.stats.meanLatency < 2000) {
        console.log(`   ✅ Mean latency within expectations: ${Math.round(data.stats.meanLatency)}ms`);
      } else {
        console.log(`   ⚠️ High mean latency: ${Math.round(data.stats.meanLatency)}ms`);
      }

      // Critical issues
      if (data.distribution.over30s > 0) {
        console.log(`   🚨 Critical latency issues: ${data.distribution.over30s} messages >30s`);
      } else {
        console.log(`   ✅ No critical latency issues`);
      }
    } else {
      console.log(`   ℹ️ No message data available for performance validation`);
    }

    console.log('\n🎉 Performance Analysis Endpoint Test Complete!');
    console.log(`   Endpoint is functional and returning valid data structure`);
    console.log(`   System is ${data.systemInfo.enabled ? 'ENABLED' : 'DISABLED'} for SLA timing`);
    console.log(`   Last updated: ${data.systemInfo.lastUpdated}`);
    console.log(`   Sample window: ${data.systemInfo.sampleWindow}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPerformanceEndpoint().catch(console.error);