#!/usr/bin/env tsx

/**
 * Production Performance Monitoring Script
 *
 * Continuously monitors /api/admin/performance-analysis to validate
 * expected latency distribution and alert on performance anomalies.
 *
 * Usage:
 *   npm run monitor:performance    # Run once
 *   npm run monitor:performance:continuous  # Run continuously
 */

interface PerformanceMetrics {
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
}

interface PerformanceAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

class PerformanceMonitor {
  private baseUrl: string;
  private checkInterval: number = 30000; // 30 seconds
  private isRunning: boolean = false;
  private alerts: PerformanceAlert[] = [];
  private previousMetrics: PerformanceMetrics | null = null;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch current performance metrics
   */
  private async fetchMetrics(): Promise<PerformanceMetrics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/performance-analysis`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch metrics');
      }

      return result.data as PerformanceMetrics;
    } catch (error) {
      console.error('❌ Failed to fetch performance metrics:', error);
      return null;
    }
  }

  /**
   * Analyze metrics and generate alerts for anomalies
   */
  private analyzeMetrics(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const now = new Date().toISOString();

    // Skip analysis if insufficient data
    if (metrics.totalMessages < 5) {
      return [{
        severity: 'info',
        message: 'Insufficient data for analysis',
        metric: 'totalMessages',
        value: metrics.totalMessages,
        threshold: 5,
        timestamp: now
      }];
    }

    const totalMessages = metrics.completeMessages + metrics.partialMessages;
    if (totalMessages === 0) return alerts;

    // 1. SLA Compliance Check
    const slaCompliantRate = metrics.distribution.under5s / totalMessages;
    if (slaCompliantRate < 0.95) {
      alerts.push({
        severity: 'critical',
        message: `SLA compliance below 95%: ${Math.round(slaCompliantRate * 100)}%`,
        metric: 'slaCompliance',
        value: slaCompliantRate * 100,
        threshold: 95,
        timestamp: now
      });
    }

    // 2. Mean Latency Check (expecting < 2000ms with optimizations)
    if (metrics.stats.meanLatency > 2000) {
      alerts.push({
        severity: 'warning',
        message: `High mean latency: ${Math.round(metrics.stats.meanLatency)}ms`,
        metric: 'meanLatency',
        value: metrics.stats.meanLatency,
        threshold: 2000,
        timestamp: now
      });
    }

    // 3. P95 Latency Check (expecting < 5000ms)
    if (metrics.stats.p95Latency > 5000) {
      alerts.push({
        severity: 'warning',
        message: `High P95 latency: ${Math.round(metrics.stats.p95Latency)}ms`,
        metric: 'p95Latency',
        value: metrics.stats.p95Latency,
        threshold: 5000,
        timestamp: now
      });
    }

    // 4. Critical Latency Check
    if (metrics.distribution.over30s > 0) {
      alerts.push({
        severity: 'critical',
        message: `${metrics.distribution.over30s} messages with >30s latency`,
        metric: 'criticalLatency',
        value: metrics.distribution.over30s,
        threshold: 0,
        timestamp: now
      });
    }

    // 5. Chatwoot API Latency Check
    if (metrics.phaseBreakdown.workerToChatwoot > 2000) {
      alerts.push({
        severity: 'warning',
        message: `High Chatwoot API latency: ${metrics.phaseBreakdown.workerToChatwoot}ms`,
        metric: 'chatwootLatency',
        value: metrics.phaseBreakdown.workerToChatwoot,
        threshold: 2000,
        timestamp: now
      });
    }

    // 6. Queue Backup Check
    if (metrics.phaseBreakdown.queueToWorker > 5000) {
      alerts.push({
        severity: 'warning',
        message: `High queue wait time: ${metrics.phaseBreakdown.queueToWorker}ms`,
        metric: 'queueWaitTime',
        value: metrics.phaseBreakdown.queueToWorker,
        threshold: 5000,
        timestamp: now
      });
    }

    // 7. Partial Messages Check (missing end-to-end timing)
    const partialRate = metrics.partialMessages / totalMessages;
    if (partialRate > 0.2) {
      alerts.push({
        severity: 'warning',
        message: `High partial message rate: ${Math.round(partialRate * 100)}%`,
        metric: 'partialMessageRate',
        value: partialRate * 100,
        threshold: 20,
        timestamp: now
      });
    }

    // 8. Trend Analysis (if we have previous metrics)
    if (this.previousMetrics) {
      const latencyChange = metrics.stats.meanLatency - this.previousMetrics.stats.meanLatency;
      const latencyChangePercent = (latencyChange / this.previousMetrics.stats.meanLatency) * 100;

      if (Math.abs(latencyChangePercent) > 50) {
        alerts.push({
          severity: 'warning',
          message: `Latency changed by ${Math.round(latencyChangePercent)}%: ${Math.round(latencyChange)}ms`,
          metric: 'latencyTrend',
          value: Math.abs(latencyChangePercent),
          threshold: 50,
          timestamp: now
        });
      }
    }

    return alerts;
  }

  /**
   * Display metrics in a readable format
   */
  private displayMetrics(metrics: PerformanceMetrics): void {
    console.log('\n' + '='.repeat(80));
    console.log(`📊 Performance Analysis - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(80));

    // Overview
    console.log(`📈 Overview:`);
    console.log(`   Total messages: ${metrics.totalMessages}`);
    console.log(`   Complete end-to-end: ${metrics.completeMessages}`);
    console.log(`   Partial (no Chatwoot): ${metrics.partialMessages}`);
    console.log(`   SLA enabled: ${metrics.systemInfo.enabled}`);

    if (metrics.completeMessages === 0) {
      console.log('⚠️ No complete end-to-end timing data available');
      return;
    }

    // Latency Distribution
    const total = metrics.completeMessages + metrics.partialMessages;
    console.log(`\n⏱️ Latency Distribution (${total} messages):`);
    console.log(`   < 1s (Excellent):   ${metrics.distribution.under1s} (${Math.round(metrics.distribution.under1s / total * 100)}%)`);
    console.log(`   < 2s (Good):        ${metrics.distribution.under2s} (${Math.round(metrics.distribution.under2s / total * 100)}%)`);
    console.log(`   < 5s (SLA OK):      ${metrics.distribution.under5s} (${Math.round(metrics.distribution.under5s / total * 100)}%)`);
    console.log(`   > 5s (SLA Breach):  ${metrics.distribution.over5s + metrics.distribution.over10s + metrics.distribution.over30s} (${Math.round((metrics.distribution.over5s + metrics.distribution.over10s + metrics.distribution.over30s) / total * 100)}%)`);
    console.log(`     - 5-10s:          ${metrics.distribution.over5s}`);
    console.log(`     - 10-30s:         ${metrics.distribution.over10s}`);
    console.log(`     - >30s:           ${metrics.distribution.over30s}`);

    // Statistics (only for complete messages)
    if (metrics.completeMessages > 0) {
      console.log(`\n📊 Statistics (complete messages only):`);
      console.log(`   Mean:   ${Math.round(metrics.stats.meanLatency)}ms`);
      console.log(`   Median: ${Math.round(metrics.stats.medianLatency)}ms`);
      console.log(`   P95:    ${Math.round(metrics.stats.p95Latency)}ms`);
      console.log(`   P99:    ${Math.round(metrics.stats.p99Latency)}ms`);
      console.log(`   Range:  ${Math.round(metrics.stats.minLatency)}ms - ${Math.round(metrics.stats.maxLatency)}ms`);
    }

    // Phase Breakdown
    console.log(`\n🔄 Phase Breakdown (average):`);
    console.log(`   Queue → Worker:    ${metrics.phaseBreakdown.queueToWorker}ms`);
    console.log(`   Worker Processing: ${metrics.phaseBreakdown.workerProcessing}ms`);
    console.log(`   Worker → Chatwoot: ${metrics.phaseBreakdown.workerToChatwoot}ms`);
  }

  /**
   * Display alerts in a readable format
   */
  private displayAlerts(alerts: PerformanceAlert[]): void {
    if (alerts.length === 0) {
      console.log('\n✅ No performance issues detected');
      return;
    }

    console.log('\n🚨 Performance Alerts:');
    alerts.forEach(alert => {
      const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
      console.log(`   ${icon} ${alert.message}`);
      console.log(`      Metric: ${alert.metric} | Value: ${alert.value} | Threshold: ${alert.threshold}`);
    });
  }

  /**
   * Run a single performance check
   */
  public async checkOnce(): Promise<void> {
    console.log('🔍 Running performance analysis...');

    const metrics = await this.fetchMetrics();
    if (!metrics) {
      console.error('❌ Failed to fetch performance metrics');
      return;
    }

    this.displayMetrics(metrics);

    const alerts = this.analyzeMetrics(metrics);
    this.displayAlerts(alerts);

    // Store for trend analysis
    this.previousMetrics = metrics;
  }

  /**
   * Start continuous monitoring
   */
  public async startContinuous(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting continuous performance monitoring (interval: ${this.checkInterval / 1000}s)`);
    console.log('Press Ctrl+C to stop\n');

    // Initial check
    await this.checkOnce();

    // Continuous checks
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }

      await this.checkOnce();
    }, this.checkInterval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping performance monitoring...');
      this.isRunning = false;
      clearInterval(interval);

      console.log('\n📋 Summary:');
      if (this.alerts.length > 0) {
        console.log(`   Total alerts generated: ${this.alerts.length}`);
        const critical = this.alerts.filter(a => a.severity === 'critical').length;
        const warnings = this.alerts.filter(a => a.severity === 'warning').length;
        if (critical > 0) console.log(`   Critical alerts: ${critical}`);
        if (warnings > 0) console.log(`   Warning alerts: ${warnings}`);
      } else {
        console.log('   No performance issues detected during monitoring period');
      }

      process.exit(0);
    });
  }

  /**
   * Set custom check interval
   */
  public setCheckInterval(milliseconds: number): void {
    this.checkInterval = milliseconds;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const monitor = new PerformanceMonitor(baseUrl);

  if (args.includes('--continuous') || args.includes('-c')) {
    // Set custom interval if provided
    const intervalArg = args.find(arg => arg.startsWith('--interval='));
    if (intervalArg) {
      const interval = parseInt(intervalArg.split('=')[1]);
      if (!isNaN(interval) && interval > 0) {
        monitor.setCheckInterval(interval);
      }
    }

    await monitor.startContinuous();
  } else {
    await monitor.checkOnce();
  }
}

// Export for programmatic use
export { PerformanceMonitor };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}