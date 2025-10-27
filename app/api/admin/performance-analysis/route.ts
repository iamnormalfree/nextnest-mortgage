
/**
 * Performance Analysis API Endpoint
 * Production monitoring for SLA latency distribution validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getSLATimingData, MessageTimingData } from "@/lib/queue/broker-queue";

interface LatencyDistribution {
  // SLA thresholds (in milliseconds)
  under1s: number;      // < 1000ms  - Excellent
  under2s: number;      // < 2000ms  - Good
  under5s: number;      // < 5000ms  - SLA compliant
  over5s: number;       // >= 5000ms - SLA breach
  over10s: number;      // >= 10000ms - Critical
  over30s: number;      // >= 30000ms - Severe
}

interface PerformanceMetrics {
  totalMessages: number;
  completeMessages: number; // Has end-to-end timing
  partialMessages: number;  // Missing chatwoot timestamp

  // Latency distribution
  distribution: LatencyDistribution;

  // Statistics (only for complete end-to-end messages)
  stats: {
    meanLatency: number;
    medianLatency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;
  };

  // Phase breakdown (average milliseconds per phase)
  phaseBreakdown: {
    queueToWorker: number;   // Time in queue before processing
    workerProcessing: number; // Worker processing time
    workerToChatwoot: number; // Time from worker complete to Chatwoot send
  };

  // Recent samples for detailed analysis
  recentSamples: MessageTimingData[];

  // System info
  systemInfo: {
    enabled: boolean;
    lastUpdated: string;
    sampleWindow: string;
  };
}

/**
 * Calculate latency distribution from timing data
 */
function calculateLatencyDistribution(timingData: MessageTimingData[]): LatencyDistribution {
  const distribution = {
    under1s: 0,
    under2s: 0,
    under5s: 0,
    over5s: 0,
    over10s: 0,
    over30s: 0
  };

  timingData.forEach(data => {
    if (!data.totalDuration) return;

    const duration = data.totalDuration;
    if (duration < 1000) distribution.under1s++;
    else if (duration < 2000) distribution.under2s++;
    else if (duration < 5000) distribution.under5s++;
    else if (duration < 10000) distribution.over5s++;
    else if (duration < 30000) distribution.over30s++;
    else distribution.over30s++;
  });

  return distribution;
}

/**
 * Calculate statistical metrics from complete timing data
 */
function calculateStats(completeTimingData: MessageTimingData[]) {
  const durations = completeTimingData
    .map(data => data.totalDuration!)
    .filter(duration => duration > 0)
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return {
      meanLatency: 0,
      medianLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      minLatency: 0,
      maxLatency: 0
    };
  }

  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const median = durations[Math.floor(durations.length / 2)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const min = durations[0];
  const max = durations[durations.length - 1];

  return { meanLatency: mean, medianLatency: median, p95Latency: p95, p99Latency: p99, minLatency: min, maxLatency: max };
}

/**
 * Calculate phase breakdown averages
 */
function calculatePhaseBreakdown(timingData: MessageTimingData[]) {
  const queueToWorkerTimes: number[] = [];
  const workerProcessingTimes: number[] = [];
  const workerToChatwootTimes: number[] = [];

  timingData.forEach(data => {
    if (data.queueAddTimestamp && data.workerStartTimestamp) {
      queueToWorkerTimes.push(data.workerStartTimestamp - data.queueAddTimestamp);
    }

    if (data.workerStartTimestamp && data.workerCompleteTimestamp) {
      workerProcessingTimes.push(data.workerCompleteTimestamp - data.workerStartTimestamp);
    }

    if (data.workerCompleteTimestamp && data.chatwootSendTimestamp) {
      workerToChatwootTimes.push(data.chatwootSendTimestamp - data.workerCompleteTimestamp);
    }
  });

  const average = (arr: number[]) => arr.length > 0 ? arr.reduce((sum, x) => sum + x, 0) / arr.length : 0;

  return {
    queueToWorker: Math.round(average(queueToWorkerTimes)),
    workerProcessing: Math.round(average(workerProcessingTimes)),
    workerToChatwoot: Math.round(average(workerToChatwootTimes))
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "100");

    console.log(`🔍 Performance analysis requested ${conversationId ? `for conversation ${conversationId}` : 'for all conversations'}`);

    // Get timing data
    const timingDataList = await getSLATimingData(
      conversationId ? parseInt(conversationId) : undefined
    );

    // Filter for analysis (only messages with meaningful timing)
    const validTimingData = timingDataList.filter(data =>
      data.queueAddTimestamp &&
      data.totalDuration &&
      data.totalDuration > 0
    );

    // Separate complete vs partial timing data
    const completeMessages = validTimingData.filter(data => data.chatwootSendTimestamp);
    const partialMessages = validTimingData.filter(data => !data.chatwootSendTimestamp);

    // Calculate metrics
    const distribution = calculateLatencyDistribution(validTimingData);
    const stats = calculateStats(completeMessages);
    const phaseBreakdown = calculatePhaseBreakdown(validTimingData);

    const performanceData: PerformanceMetrics = {
      totalMessages: timingDataList.length,
      completeMessages: completeMessages.length,
      partialMessages: partialMessages.length,
      distribution,
      stats,
      phaseBreakdown,
      recentSamples: timingDataList.slice(0, 10), // Show 10 most recent
      systemInfo: {
        enabled: process.env.ENABLE_SLA_TIMING === "true",
        lastUpdated: new Date().toISOString(),
        sampleWindow: "Last hour (TTL: 3600s)"
      }
    };

    // Log key insights for production monitoring
    console.log(`📊 Performance Analysis Results:`);
    console.log(`   Total messages: ${performanceData.totalMessages}`);
    console.log(`   Complete end-to-end: ${performanceData.completeMessages}`);
    console.log(`   SLA compliant (<5s): ${distribution.under5s}/${validTimingData.length} (${Math.round(distribution.under5s / validTimingData.length * 100)}%)`);
    console.log(`   SLA breaches (>5s): ${distribution.over5s + distribution.over10s + distribution.over30s}/${validTimingData.length} (${Math.round((distribution.over5s + distribution.over10s + distribution.over30s) / validTimingData.length * 100)}%)`);
    console.log(`   Mean latency: ${Math.round(stats.meanLatency)}ms`);
    console.log(`   P95 latency: ${Math.round(stats.p95Latency)}ms`);

    if (performanceData.phaseBreakdown.workerToChatwoot > 2000) {
      console.warn(`⚠️ High Chatwoot API latency detected: ${performanceData.phaseBreakdown.workerToChatwoot}ms`);
    }

    if (distribution.over30s > 0) {
      console.error(`🚨 CRITICAL: ${distribution.over30s} messages with >30s latency`);
    }

    return NextResponse.json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error("Performance analysis failed:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to analyze performance data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

