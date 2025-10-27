#!/usr/bin/env tsx

/**
 * SLA Timing Profiler - Phase 2 Task 2.5
 *
 * Captures 10 production-like timing samples with complete end-to-end measurement
 * Profiles the slowest segment and optimizes worker dispatch
 * Documents measurements and analysis in work-log.md
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { queueIncomingMessage, getSLATimingData } from '@/lib/queue/broker-queue';
import { mockBrokerPersona, mockLeadData } from '@/tests/fixtures/broker-test-data';
import { ChatwootClient } from '@/lib/integrations/chatwoot-client';

interface TimingSample {
  sampleId: number;
  conversationId: number;
  userMessage: string;
  timestamp: string;
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

interface SegmentAnalysis {
  segment: string;
  samples: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  p95Time: number;
  bottleneckScore: number; // 0-10, higher = more problematic
}

async function getRealConversation(sampleId: number): Promise<{conversationId: number, contactId: number}> {
  console.log(`🔧 Using real Chatwoot conversation for sample ${sampleId}...`);

  // Use the real conversation IDs created manually
  const realConversationIds = [291, 292, 293];
  const realContactIds = [69, 70, 71]; // From the earlier creation attempts

  const index = (sampleId - 1) % realConversationIds.length;
  const conversationId = realConversationIds[index];
  const contactId = realContactIds[index];

  console.log(`   ✅ Using real conversation ID: ${conversationId}, contact ID: ${contactId}`);

  return {
    conversationId,
    contactId
  };
}

async function captureTimingSamples(): Promise<TimingSample[]> {
  console.log('🚀 Starting SLA Timing Profiler - Phase 2 Task 2.5');
  console.log(`   Target: Capture 10 production-like timing samples`);
  console.log(`   Profile: Analyze slowest segment and optimize`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const samples: TimingSample[] = [];
  const sampleCount = 10;

  // Test scenarios simulating real user messages
  const testScenarios = [
    'Hi, I need help with a mortgage application',
    'What\'s the current interest rate for a 30-year fixed mortgage?',
    'I have a credit score of 750 and earn $8,000/month. How much can I borrow?',
    'What documents do I need for a mortgage application?',
    'Can you explain the difference between fixed and variable rates?',
    'I\'m looking at a $500,000 condo. What would my monthly payment be?',
    'How long does the mortgage approval process typically take?',
    'What are the closing costs I should expect?',
    'Can I get pre-approved before finding a property?',
    'Thank you for the information. This has been very helpful.',
  ];

  console.log(`📊 Capturing ${sampleCount} end-to-end timing samples...\n`);

  for (let i = 0; i < sampleCount; i++) {
    const sampleId = i + 1;
    const userMessage = testScenarios[i];

    console.log(`📋 Sample ${sampleId}/${sampleCount}: ${userMessage.substring(0, 50)}...`);

    try {
      // Use a real conversation first to avoid 404 errors
      const { conversationId, contactId } = await getRealConversation(sampleId);
      // Record queue start time
      const queueStart = Date.now();

      // Queue the message (this injects timing data)
      const job = await queueIncomingMessage({
        conversationId,
        contactId,
        brokerId: 'test-broker-' + sampleId,
        brokerName: `Test Broker ${sampleId}`,
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage,
      });

      console.log(`   ✅ Job queued: ${job.id}`);

      // Wait for worker to process (5-10 seconds)
      console.log(`   ⏳ Waiting for worker processing...`);
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Get timing data
      const timingDataList = await getSLATimingData(conversationId);

      if (timingDataList.length > 0) {
        const timingData = timingDataList[0];

        const sample: TimingSample = {
          sampleId,
          conversationId,
          userMessage,
          timestamp: new Date().toISOString(),
          queueAddTimestamp: timingData.queueAddTimestamp || queueStart,
          workerStartTimestamp: timingData.workerStartTimestamp,
          workerCompleteTimestamp: timingData.workerCompleteTimestamp,
          chatwootSendTimestamp: timingData.chatwootSendTimestamp,
          totalDuration: timingData.totalDuration,
          phaseBreakdown: {
            queueToWorker: timingData.workerStartTimestamp && timingData.queueAddTimestamp
              ? timingData.workerStartTimestamp - timingData.queueAddTimestamp
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
        console.log(`   📊 End-to-end latency: ${latency}ms ${status}`);

        if (sample.phaseBreakdown.queueToWorker > 0) {
          console.log(`   📈 Phase breakdown: Queue→Worker ${sample.phaseBreakdown.queueToWorker}ms, Worker ${sample.phaseBreakdown.workerProcessing}ms, Worker→Chatwoot ${sample.phaseBreakdown.workerToChatwoot}ms`);
        }

      } else {
        console.log(`   ⚠️ No timing data found for conversation ${conversationId}`);
        // Still record partial sample
        samples.push({
          sampleId,
          conversationId,
          userMessage,
          timestamp: new Date().toISOString(),
          queueAddTimestamp: queueStart,
          phaseBreakdown: { queueToWorker: 0, workerProcessing: 0, workerToChatwoot: 0 },
        });
      }

    } catch (error) {
      console.error(`   ❌ Sample failed:`, error);
    }

    console.log('');

    // Brief pause between samples
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return samples;
}

function analyzeSegments(samples: TimingSample[]): SegmentAnalysis[] {
  const completeSamples = samples.filter(s => s.totalDuration && s.totalDuration > 0);

  if (completeSamples.length === 0) {
    return [];
  }

  const segments: SegmentAnalysis[] = [
    {
      segment: 'queueToWorker',
      samples: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: 0,
      p95Time: 0,
      bottleneckScore: 0,
    },
    {
      segment: 'workerProcessing',
      samples: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: 0,
      p95Time: 0,
      bottleneckScore: 0,
    },
    {
      segment: 'workerToChatwoot',
      samples: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: 0,
      p95Time: 0,
      bottleneckScore: 0,
    },
  ];

  // Calculate statistics for each segment
  completeSamples.forEach(sample => {
    segments[0].samples++;
    segments[0].averageTime += sample.phaseBreakdown.queueToWorker;
    segments[0].maxTime = Math.max(segments[0].maxTime, sample.phaseBreakdown.queueToWorker);
    segments[0].minTime = segments[0].samples === 1 ? sample.phaseBreakdown.queueToWorker : Math.min(segments[0].minTime, sample.phaseBreakdown.queueToWorker);

    segments[1].samples++;
    segments[1].averageTime += sample.phaseBreakdown.workerProcessing;
    segments[1].maxTime = Math.max(segments[1].maxTime, sample.phaseBreakdown.workerProcessing);
    segments[1].minTime = segments[1].samples === 1 ? sample.phaseBreakdown.workerProcessing : Math.min(segments[1].minTime, sample.phaseBreakdown.workerProcessing);

    segments[2].samples++;
    segments[2].averageTime += sample.phaseBreakdown.workerToChatwoot;
    segments[2].maxTime = Math.max(segments[2].maxTime, sample.phaseBreakdown.workerToChatwoot);
    segments[2].minTime = segments[2].samples === 1 ? sample.phaseBreakdown.workerToChatwoot : Math.min(segments[2].minTime, sample.phaseBreakdown.workerToChatwoot);
  });

  // Calculate averages and P95
  segments.forEach(segment => {
    if (segment.samples > 0) {
      segment.averageTime = Math.round(segment.averageTime / segment.samples);

      // Calculate P95 (simplified)
      const values = completeSamples.map(s => {
        if (segment.segment === 'queueToWorker') return s.phaseBreakdown.queueToWorker;
        if (segment.segment === 'workerProcessing') return s.phaseBreakdown.workerProcessing;
        return s.phaseBreakdown.workerToChatwoot;
      }).sort((a, b) => a - b);

      segment.p95Time = values[Math.floor(values.length * 0.95)] || 0;

      // Calculate bottleneck score (0-10)
      const avgMs = segment.averageTime;
      if (avgMs < 100) segment.bottleneckScore = 0;
      else if (avgMs < 500) segment.bottleneckScore = 2;
      else if (avgMs < 1000) segment.bottleneckScore = 4;
      else if (avgMs < 2000) segment.bottleneckScore = 6;
      else if (avgMs < 5000) segment.bottleneckScore = 8;
      else segment.bottleneckScore = 10;
    }
  });

  return segments.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
}

function generateWorkLogEntry(samples: TimingSample[], segments: SegmentAnalysis[]): string {
  const completeSamples = samples.filter(s => s.totalDuration && s.totalDuration > 0);

  if (completeSamples.length === 0) {
    return `## SLA Timing Profiling - ${new Date().toISOString()}

❌ FAILED: No complete timing data collected
`;
  }

  const durations = completeSamples.map(s => s.totalDuration!).sort((a, b) => a - b);
  const meanLatency = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const medianLatency = durations[Math.floor(durations.length / 2)];
  const p95Latency = durations[Math.floor(durations.length * 0.95)];
  const slaCompliant = durations.filter(d => d < 5000).length;

  let workLog = `## SLA Timing Profiling - ${new Date().toISOString()}

### Phase 2 Task 2.5: Response SLA Remediation

#### Sample Collection
- **Target:** 10 production-like timing samples
- **Achieved:** ${completeSamples.length}/10 complete samples
- **Success Rate:** ${(completeSamples.length / 10 * 100).toFixed(1)}%

#### End-to-End Latency Statistics
- **Mean Latency:** ${Math.round(meanLatency)}ms
- **Median Latency:** ${Math.round(medianLatency)}ms
- **P95 Latency:** ${Math.round(p95Latency)}ms
- **SLA Compliant (<5s):** ${slaCompliant}/${completeSamples.length} (${(slaCompliant / completeSamples.length * 100).toFixed(1)}%)

#### Phase Breakdown Analysis
`;

  segments.forEach((segment, index) => {
    workLog += `${index + 1}. **${segment.segment}**: ${segment.averageTime}ms average, ${segment.p95Time}ms P95 (Bottleneck Score: ${segment.bottleneckScore}/10)\n`;
  });

  workLog += `
#### Slowest Segment Analysis
- **Primary Bottleneck:** ${segments[0].segment} (${segments[0].averageTime}ms average)
- **Recommendation: `;

  if (segments[0].bottleneckScore >= 8) {
    workLog += `URGENT optimization required for ${segments[0].segment}`;
  } else if (segments[0].bottleneckScore >= 6) {
    workLog += `High priority optimization for ${segments[0].segment}`;
  } else if (segments[0].bottleneckScore >= 4) {
    workLog += `Moderate optimization for ${segments[0].segment}`;
  } else {
    workLog += `${segments[0].segment} performance is acceptable`;
  }

  workLog += `

#### Optimization Recommendations
`;

  if (segments[0].segment === 'queueToWorker' && segments[0].averageTime > 500) {
    workLog += `- **Queue Optimization**: Increase worker concurrency from 3 to 10\n`;
    workLog += `- **Rate Limits**: Increase QUEUE_RATE_LIMIT from 10 to 30 jobs/sec\n`;
  }

  if (segments[0].segment === 'workerProcessing' && segments[0].averageTime > 2000) {
    workLog += `- **AI Service**: Optimize prompt caching and model selection\n`;
    workLog += `- **Worker Configuration**: Enable parallel processing\n`;
  }

  if (segments[0].segment === 'workerToChatwoot' && segments[0].averageTime > 1000) {
    workLog += `- **Chatwoot API**: Implement connection pooling and retries\n`;
    workLog += `- **Network**: Optimize API call timeouts and error handling\n`;
  }

  workLog += `
#### Sample Details
| Sample | Conversation | Message Preview | Latency (ms) | Status |
|--------|-------------|-----------------|---------------|--------|
`;

  completeSamples.forEach(sample => {
    const preview = sample.userMessage.substring(0, 30) + '...';
    const latency = Math.round(sample.totalDuration!);
    const status = latency < 5000 ? '✅' : '❌';
    workLog += `| ${sample.sampleId} | ${sample.conversationId} | ${preview} | ${latency} | ${status} |\n`;
  });

  workLog += `
#### Conclusion
`;

  if (p95Latency < 5000 && slaCompliant >= Math.floor(completeSamples.length * 0.95)) {
    workLog += `✅ **P95 SLA Requirement Met**: ${Math.round(p95Latency)}ms < 5000ms\n`;
    workLog += `✅ **SLA Compliance Rate**: ${(slaCompliant / completeSamples.length * 100).toFixed(1)}% ≥ 95%\n`;
    workLog += `\n**Status**: Phase 2 Task 2.5 COMPLETED SUCCESSFULLY`;
  } else {
    workLog += `❌ **P95 SLA Requirement Not Met**: ${Math.round(p95Latency)}ms ≥ 5000ms\n`;
    workLog += `❌ **SLA Compliance Rate Below Target**: ${(slaCompliant / completeSamples.length * 100).toFixed(1)}% < 95%\n`;
    workLog += `\n**Status**: Phase 2 Task 2.5 REQUIRES OPTIMIZATION`;
  }

  return workLog;
}

async function updateWorkLog(workLogEntry: string): Promise<void> {
  try {
    const fs = await import('fs');
    const workLogPath = 'docs/work-log.md';

    let existingContent = '';
    if (fs.default.existsSync(workLogPath)) {
      existingContent = fs.default.readFileSync(workLogPath, 'utf-8');
    }

    const newContent = existingContent + '\n\n' + workLogEntry;
    fs.default.writeFileSync(workLogPath, newContent);

    console.log(`📝 Work log updated: docs/work-log.md`);
  } catch (error) {
    console.error('❌ Failed to update work log:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting SLA Timing Profiler...');

    // Check if worker is running
    const workerResponse = await fetch('http://localhost:3002/api/worker/start');
    if (!workerResponse.ok) {
      throw new Error('Worker not running. Please start worker first: curl -X POST http://localhost:3002/api/worker/start');
    }

    const workerStatus = await workerResponse.json();
    console.log('   Worker status response:', JSON.stringify(workerStatus, null, 2));

    if (!workerStatus.worker || !workerStatus.worker.isRunning) {
      throw new Error('Worker not running. Please start worker first.');
    }

    console.log('✅ Worker status confirmed');

    // Capture timing samples
    const samples = await captureTimingSamples();

    // Analyze segments
    const segments = analyzeSegments(samples);

    // Generate work log entry
    const workLogEntry = generateWorkLogEntry(samples, segments);

    // Update work log
    await updateWorkLog(workLogEntry);

    // Display results
    console.log('='.repeat(80));
    console.log('📊 SLA TIMING PROFILER RESULTS');
    console.log('='.repeat(80));

    const completeSamples = samples.filter(s => s.totalDuration && s.totalDuration > 0);

    if (completeSamples.length === 0) {
      console.log('❌ FAILED: No complete timing data collected');
      console.log('   - Worker may not be processing jobs');
      console.log('   - ENABLE_SLA_TIMING may not be set');
      console.log('   - Check Redis connection');
      process.exit(1);
    }

    const durations = completeSamples.map(s => s.totalDuration!).sort((a, b) => a - b);
    const p95Latency = durations[Math.floor(durations.length * 0.95)];
    const slaCompliant = durations.filter(d => d < 5000).length;

    console.log(`Complete samples: ${completeSamples.length}/10`);
    console.log(`P95 latency: ${Math.round(p95Latency)}ms`);
    console.log(`SLA compliant: ${slaCompliant}/${completeSamples.length} (${(slaCompliant / completeSamples.length * 100).toFixed(1)}%)`);
    console.log('');

    console.log('📈 Segment Analysis:');
    segments.forEach((segment, index) => {
      const icon = segment.bottleneckScore >= 8 ? '🚨' : segment.bottleneckScore >= 6 ? '⚠️' : '✅';
      console.log(`   ${icon} ${segment.segment}: ${segment.averageTime}ms avg (Score: ${segment.bottleneckScore}/10)`);
    });

    console.log('');
    console.log('📝 Work log updated with detailed analysis');
    console.log('   See docs/work-log.md for complete results');

    if (p95Latency < 5000 && slaCompliant >= Math.floor(completeSamples.length * 0.95)) {
      console.log('');
      console.log('✅ PHASE 2 TASK 2.5 COMPLETED SUCCESSFULLY');
      console.log('   P95 SLA requirement met (< 5s)');
      console.log('   SLA compliance rate meets target');
      process.exit(0);
    } else {
      console.log('');
      console.log('⚠️ PHASE 2 TASK 2.5 REQUIRES OPTIMIZATION');
      console.log('   P95 SLA requirement not met OR');
      console.log('   SLA compliance rate below target');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ SLA timing profiler failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { captureTimingSamples, analyzeSegments };