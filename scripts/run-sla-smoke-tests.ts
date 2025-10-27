#!/usr/bin/env tsx

/**
 * Production-like SLA Smoke Tests
 *
 * Phase 2 Task 2.5: Collect 10 production-like timing samples
 * and document the results for SLA validation.
 *
 * This script simulates real AI broker conversations and measures
 * end-to-end latency to validate P95 AI response latency < 5s.
 */

interface TimingSample {
  sampleId: number;
  conversationId: number;
  timestamp: string;
  userMessage: string;
  queueAddTimestamp: number;
  workerStartTimestamp?: number;
  workerCompleteTimestamp?: number;
  chatwootSendTimestamp?: number;
  totalDuration?: number;
  phaseBreakdown: {
    queueToWorker: number;
    workerProcessing: number;
    workerToChatwoot: number;
  };
}

interface SLATestResult {
  testSuite: string;
  timestamp: string;
  environment: string;
  samples: TimingSample[];
  statistics: {
    totalSamples: number;
    completeSamples: number;
    partialSamples: number;
    meanLatency: number;
    medianLatency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;
    slaCompliant: number;
    slaComplianceRate: number;
  };
  phaseBreakdown: {
    queueToWorker: number;
    workerProcessing: number;
    workerToChatwoot: number;
  };
  conclusion: string;
}

// Test scenarios for production-like conditions
const TEST_SCENARIOS = [
  {
    type: 'new-conversation' as const,
    userMessage: 'Hi, I need help with a mortgage application',
    urgency: 'medium',
    description: 'Initial customer inquiry'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'What\'s the current interest rate for a 30-year fixed mortgage?',
    urgency: 'high',
    description: 'Rate inquiry (high urgency)'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'I have a credit score of 750 and earn $8,000/month. How much can I borrow?',
    urgency: 'high',
    description: 'Borrowing capacity question'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'What documents do I need for a mortgage application?',
    urgency: 'medium',
    description: 'Documentation requirements'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'Can you explain the difference between fixed and variable rates?',
    urgency: 'medium',
    description: 'Educational question'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'I\'m looking at a $500,000 condo. What would my monthly payment be?',
    urgency: 'high',
    description: 'Payment calculation (specific property)'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'How long does the mortgage approval process typically take?',
    urgency: 'low',
    description: 'Process timeline question'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'What are the closing costs I should expect?',
    urgency: 'medium',
    description: 'Cost-related inquiry'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'Can I get pre-approved before finding a property?',
    urgency: 'high',
    description: 'Pre-approval question (high intent)'
  },
  {
    type: 'incoming-message' as const,
    userMessage: 'Thank you for the information. This has been very helpful.',
    urgency: 'low',
    description: 'Acknowledgment/closing message'
  }
];

/**
 * Generate mock lead data for testing
 */
function generateMockLeadData(scenario: typeof TEST_SCENARIOS[0]) {
  const baseIncomes = [5000, 6500, 8000, 10000, 12000, 15000];
  const baseAges = [28, 32, 35, 40, 45];
  const creditScores = [680, 720, 750, 780, 820];

  const income = baseIncomes[Math.floor(Math.random() * baseIncomes.length)];
  const age = baseAges[Math.floor(Math.random() * baseAges.length)];
  const creditScore = creditScores[Math.floor(Math.random() * creditScores.length)];

  // Adjust lead score based on scenario urgency
  let leadScore = 65; // Base score
  if (scenario.urgency === 'high') leadScore += 15;
  if (scenario.urgency === 'low') leadScore -= 10;
  if (scenario.userMessage.includes('$') || scenario.userMessage.includes('borrow')) leadScore += 10;

  return {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+6591234567',
    loanType: 'new_purchase' as const,
    propertyCategory: 'condo' as const,
    propertyType: 'private' as const,
    actualIncomes: [income],
    actualAges: [age],
    employmentType: 'employed' as const,
    leadScore,
    sessionId: `test-session-${Date.now()}`,
    brokerPersona: {
      type: 'balanced' as const,
      name: 'Rachel Tan',
      title: 'Senior Mortgage Specialist',
      approach: 'Professional and Modern',
      urgencyLevel: 'medium' as const,
      avatar: 'RT',
      responseStyle: {
        tone: 'professional yet approachable',
        pacing: 'moderate',
        focus: 'balanced',
      },
    },
    propertyPrice: 500000 + Math.floor(Math.random() * 300000),
    existingCommitments: 1000,
  };
}

/**
 * Calculate statistics from timing samples
 */
function calculateStatistics(samples: TimingSample[]) {
  const completeSamples = samples.filter(s => s.totalDuration && s.totalDuration > 0);
  const partialSamples = samples.filter(s => !s.totalDuration);

  if (completeSamples.length === 0) {
    return {
      totalSamples: samples.length,
      completeSamples: 0,
      partialSamples: partialSamples.length,
      meanLatency: 0,
      medianLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      minLatency: 0,
      maxLatency: 0,
      slaCompliant: 0,
      slaComplianceRate: 0,
    };
  }

  const durations = completeSamples
    .map(s => s.totalDuration!)
    .sort((a, b) => a - b);

  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const median = durations[Math.floor(durations.length / 2)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const min = durations[0];
  const max = durations[durations.length - 1];

  const slaCompliant = durations.filter(d => d < 5000).length;
  const slaComplianceRate = (slaCompliant / completeSamples.length) * 100;

  return {
    totalSamples: samples.length,
    completeSamples: completeSamples.length,
    partialSamples: partialSamples.length,
    meanLatency: mean,
    medianLatency: median,
    p95Latency: p95,
    p99Latency: p99,
    minLatency: min,
    maxLatency: max,
    slaCompliant,
    slaComplianceRate,
  };
}

/**
 * Calculate phase breakdown averages
 */
function calculatePhaseBreakdown(samples: TimingSample[]) {
  const queueToWorkerTimes: number[] = [];
  const workerProcessingTimes: number[] = [];
  const workerToChatwootTimes: number[] = [];

  samples.forEach(sample => {
    if (sample.queueAddTimestamp && sample.workerStartTimestamp) {
      queueToWorkerTimes.push(sample.workerStartTimestamp - sample.queueAddTimestamp);
    }

    if (sample.workerStartTimestamp && sample.workerCompleteTimestamp) {
      workerProcessingTimes.push(sample.workerCompleteTimestamp - sample.workerStartTimestamp);
    }

    if (sample.workerCompleteTimestamp && sample.chatwootSendTimestamp) {
      workerToChatwootTimes.push(sample.chatwootSendTimestamp - sample.workerCompleteTimestamp);
    }
  });

  const average = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((sum, x) => sum + x, 0) / arr.length : 0;

  return {
    queueToWorker: Math.round(average(queueToWorkerTimes)),
    workerProcessing: Math.round(average(workerProcessingTimes)),
    workerToChatwoot: Math.round(average(workerToChatwootTimes)),
  };
}

/**
 * Run production-like smoke tests
 */
async function runSLASmokeTests(): Promise<SLATestResult> {
  console.log('🚀 Starting Production-like SLA Smoke Tests');
  console.log(`   Target: Collect 10 timing samples for P95 < 5s validation`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const samples: TimingSample[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Check if performance endpoint is available
  try {
    const healthResponse = await fetch(`${baseUrl}/api/admin/performance-analysis`);
    if (!healthResponse.ok) {
      throw new Error('Performance analysis endpoint not available');
    }
    console.log('✅ Performance analysis endpoint is available');
  } catch (error) {
    console.error('❌ Performance analysis endpoint not accessible:', error);
    console.log('   Make sure the development server is running on port 3000');
    process.exit(1);
  }

  console.log('\n📊 Running 10 production-like test scenarios...\n');

  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    const sampleId = i + 1;
    const conversationId = 1000 + sampleId;

    console.log(`📋 Test ${sampleId}/10: ${scenario.description}`);
    console.log(`   Message: "${scenario.userMessage.substring(0, 60)}..."`);
    console.log(`   Urgency: ${scenario.urgency}`);

    const startTime = Date.now();

    try {
      // Create mock lead data
      const leadData = generateMockLeadData(scenario);

      if (scenario.type === 'new-conversation') {
        // Queue new conversation
        const response = await fetch(`${baseUrl}/api/chatwoot-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            loanType: leadData.loanType,
            propertyCategory: leadData.propertyCategory,
            monthlyIncome: leadData.actualIncomes[0],
            employmentType: leadData.employmentType,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create conversation: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`   ✅ Conversation created: ${result.conversationId}`);

      } else {
        // Queue incoming message
        const response = await fetch(`${baseUrl}/api/chatwoot-webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation: {
              id: conversationId,
              messages: [],
              contact_id: 2000 + sampleId,
            },
            message: {
              content: scenario.userMessage,
              message_type: 'incoming',
              created_at: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to queue message: ${response.statusText}`);
        }

        console.log(`   ✅ Message queued successfully`);
      }

      // Wait for processing (simulate real-time monitoring)
      console.log(`   ⏳ Waiting for processing...`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get timing data from performance endpoint
      const perfResponse = await fetch(`${baseUrl}/api/admin/performance-analysis?conversationId=${conversationId}`);
      if (perfResponse.ok) {
        const perfResult = await perfResponse.json();
        if (perfResult.success && perfResult.data.recentSamples.length > 0) {
          const timingData = perfResult.data.recentSamples[0];

          const sample: TimingSample = {
            sampleId,
            conversationId,
            timestamp: new Date().toISOString(),
            userMessage: scenario.userMessage,
            queueAddTimestamp: timingData.queueAddTimestamp || startTime,
            workerStartTimestamp: timingData.workerStartTimestamp,
            workerCompleteTimestamp: timingData.workerCompleteTimestamp,
            chatwootSendTimestamp: timingData.chatwootSendTimestamp,
            totalDuration: timingData.totalDuration,
            phaseBreakdown: {
              queueToWorker: timingData.workerStartTimestamp
                ? timingData.workerStartTimestamp - (timingData.queueAddTimestamp || startTime)
                : 0,
              workerProcessing: timingData.workerStartTimestamp && timingData.workerCompleteTimestamp
                ? timingData.workerCompleteTimestamp - timingData.workerStartTimestamp
                : 0,
              workerToChatwoot: timingData.workerCompleteTimestamp && timingData.chatwootSendTimestamp
                ? timingData.chatwootSendTimestamp - timingData.workerCompleteTimestamp
                : 0,
            },
          };

          samples.push(sample);

          const latency = sample.totalDuration ? Math.round(sample.totalDuration) : 'N/A';
          const status = sample.totalDuration && sample.totalDuration < 5000 ? '✅ SLA OK' : '⚠️ SLA BREACH';
          console.log(`   📊 Latency: ${latency}ms ${status}`);

          if (sample.phaseBreakdown.queueToWorker > 0) {
            console.log(`   📈 Phase breakdown: Queue→Worker ${sample.phaseBreakdown.queueToWorker}ms, Worker ${sample.phaseBreakdown.workerProcessing}ms, Worker→Chatwoot ${sample.phaseBreakdown.workerToChatwoot}ms`);
          }
        } else {
          console.log(`   ⚠️ No timing data available for this sample`);
        }
      } else {
        console.log(`   ⚠️ Could not retrieve timing data`);
      }

    } catch (error) {
      console.error(`   ❌ Test failed:`, error);

      // Still record a sample with partial data
      samples.push({
        sampleId,
        conversationId,
        timestamp: new Date().toISOString(),
        userMessage: scenario.userMessage,
        queueAddTimestamp: startTime,
        phaseBreakdown: { queueToWorker: 0, workerProcessing: 0, workerToChatwoot: 0 },
      });
    }

    console.log('');

    // Brief pause between tests to simulate realistic usage
    if (i < TEST_SCENARIOS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Calculate statistics
  const statistics = calculateStatistics(samples);
  const phaseBreakdown = calculatePhaseBreakdown(samples);

  // Generate conclusion
  let conclusion = '';
  if (statistics.completeSamples === 0) {
    conclusion = '❌ FAILED: No complete timing data collected. Check system configuration.';
  } else if (statistics.slaComplianceRate >= 95) {
    conclusion = `✅ PASSED: P95 latency ${Math.round(statistics.p95Latency)}ms < 5000ms. SLA compliance ${statistics.slaComplianceRate.toFixed(1)}%.`;
  } else if (statistics.p95Latency < 5000) {
    conclusion = `✅ PASSED: P95 latency ${Math.round(statistics.p95Latency)}ms < 5000ms. However, overall SLA compliance is ${statistics.slaComplianceRate.toFixed(1)}%.`;
  } else {
    conclusion = `❌ FAILED: P95 latency ${Math.round(statistics.p95Latency)}ms >= 5000ms. SLA compliance ${statistics.slaComplianceRate.toFixed(1)}%.`;
  }

  return {
    testSuite: 'Production-like SLA Smoke Tests',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    samples,
    statistics,
    phaseBreakdown,
    conclusion,
  };
}

/**
 * Save test results to file
 */
async function saveResults(results: SLATestResult): Promise<void> {
  const filename = `sla-smoke-test-results-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = `test-results/${filename}`;

  try {
    await import('fs').then(fs => {
      if (!fs.default.existsSync('test-results')) {
        fs.default.mkdirSync('test-results', { recursive: true });
      }
      fs.default.writeFileSync(filepath, JSON.stringify(results, null, 2));
    });

    console.log(`📁 Results saved to: ${filepath}`);
  } catch (error) {
    console.error('❌ Failed to save results:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const results = await runSLASmokeTests();

    // Display summary
    console.log('='.repeat(80));
    console.log('📊 SLA SMOKE TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Test Suite: ${results.testSuite}`);
    console.log(`Environment: ${results.environment}`);
    console.log(`Timestamp: ${results.timestamp}`);
    console.log('');

    console.log('📈 STATISTICS:');
    console.log(`   Total samples: ${results.statistics.totalSamples}`);
    console.log(`   Complete samples: ${results.statistics.completeSamples}`);
    console.log(`   Partial samples: ${results.statistics.partialSamples}`);
    console.log(`   Mean latency: ${Math.round(results.statistics.meanLatency)}ms`);
    console.log(`   Median latency: ${Math.round(results.statistics.medianLatency)}ms`);
    console.log(`   P95 latency: ${Math.round(results.statistics.p95Latency)}ms`);
    console.log(`   P99 latency: ${Math.round(results.statistics.p99Latency)}ms`);
    console.log(`   Min latency: ${Math.round(results.statistics.minLatency)}ms`);
    console.log(`   Max latency: ${Math.round(results.statistics.maxLatency)}ms`);
    console.log(`   SLA compliant (<5s): ${results.statistics.slaCompliant}/${results.statistics.completeSamples} (${results.statistics.slaComplianceRate.toFixed(1)}%)`);
    console.log('');

    console.log('⏱️ PHASE BREAKDOWN:');
    console.log(`   Queue → Worker: ${results.phaseBreakdown.queueToWorker}ms`);
    console.log(`   Worker Processing: ${results.phaseBreakdown.workerProcessing}ms`);
    console.log(`   Worker → Chatwoot: ${results.phaseBreakdown.workerToChatwoot}ms`);
    console.log('');

    console.log('🎯 CONCLUSION:');
    console.log(`   ${results.conclusion}`);
    console.log('');

    // Save results
    await saveResults(results);

    // Set exit code based on SLA compliance
    if (results.statistics.p95Latency < 5000 && results.statistics.slaComplianceRate >= 95) {
      console.log('✅ SLA validation PASSED');
      process.exit(0);
    } else {
      console.log('❌ SLA validation FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ SLA smoke test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runSLASmokeTests, type SLATestResult, type TimingSample };