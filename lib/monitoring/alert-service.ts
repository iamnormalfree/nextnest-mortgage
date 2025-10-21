/**
 * ABOUTME: Alert monitoring service for AI Broker system
 * ABOUTME: Checks health metrics against thresholds and triggers alerts
 */

import { getQueueMetrics } from '@/lib/queue/broker-queue';
import { getWorkerStatus } from '@/lib/queue/worker-manager';

export interface AlertThresholds {
  // Queue thresholds
  maxFailedJobs: number;
  maxWaitingJobs: number;
  maxActiveJobs: number;
  minHealthScore: number;

  // Performance thresholds
  maxAvgProcessingTime: number; // milliseconds
  maxAIResponseTime: number; // milliseconds
  minThroughput: number; // jobs per minute

  // Worker thresholds
  workerDownTime: number; // minutes before alerting
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  maxFailedJobs: 10,
  maxWaitingJobs: 50,
  maxActiveJobs: 20,
  minHealthScore: 70,
  maxAvgProcessingTime: 15000, // 15 seconds
  maxAIResponseTime: 8000, // 8 seconds
  minThroughput: 5, // 5 jobs/min minimum
  workerDownTime: 5, // 5 minutes
};

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  category: 'queue' | 'worker' | 'performance' | 'system';
  message: string;
  metric: string;
  value: number | boolean;
  threshold: number | boolean;
  timestamp: Date;
  resolved: boolean;
}

interface SystemMetrics {
  queue: {
    waiting: number;
    active: number;
    failed: number;
    completed: number;
  } | null;
  worker: {
    initialized: boolean;
    running: boolean;
  } | null;
  healthScore: number;
}

/**
 * Check system health and generate alerts for threshold violations
 */
export async function checkHealthAndAlert(
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    // Get current metrics
    const queueMetrics = await getQueueMetrics();
    const workerStatus = getWorkerStatus();

    // Calculate health score (simplified - full calculation in migration-status endpoint)
    const healthScore = calculateQuickHealthScore(queueMetrics, workerStatus);

    // Check queue thresholds
    if (queueMetrics) {
      // Failed jobs alert
      if (queueMetrics.failed > thresholds.maxFailedJobs) {
        alerts.push({
          severity: 'critical',
          category: 'queue',
          message: `High failure rate detected: ${queueMetrics.failed} failed jobs exceeds threshold of ${thresholds.maxFailedJobs}`,
          metric: 'failed_jobs',
          value: queueMetrics.failed,
          threshold: thresholds.maxFailedJobs,
          timestamp: new Date(),
          resolved: false,
        });
      } else if (queueMetrics.failed > thresholds.maxFailedJobs / 2) {
        alerts.push({
          severity: 'warning',
          category: 'queue',
          message: `Moderate failure rate: ${queueMetrics.failed} failed jobs approaching threshold`,
          metric: 'failed_jobs',
          value: queueMetrics.failed,
          threshold: thresholds.maxFailedJobs,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Waiting jobs alert
      if (queueMetrics.waiting > thresholds.maxWaitingJobs) {
        alerts.push({
          severity: 'critical',
          category: 'queue',
          message: `Queue backup detected: ${queueMetrics.waiting} jobs waiting exceeds threshold of ${thresholds.maxWaitingJobs}`,
          metric: 'waiting_jobs',
          value: queueMetrics.waiting,
          threshold: thresholds.maxWaitingJobs,
          timestamp: new Date(),
          resolved: false,
        });
      } else if (queueMetrics.waiting > thresholds.maxWaitingJobs / 2) {
        alerts.push({
          severity: 'warning',
          category: 'queue',
          message: `Queue growing: ${queueMetrics.waiting} jobs waiting`,
          metric: 'waiting_jobs',
          value: queueMetrics.waiting,
          threshold: thresholds.maxWaitingJobs,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Active jobs alert
      if (queueMetrics.active > thresholds.maxActiveJobs) {
        alerts.push({
          severity: 'warning',
          category: 'performance',
          message: `High concurrency: ${queueMetrics.active} active jobs exceeds threshold of ${thresholds.maxActiveJobs}`,
          metric: 'active_jobs',
          value: queueMetrics.active,
          threshold: thresholds.maxActiveJobs,
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // Check worker status
    if (workerStatus) {
      if (!workerStatus.initialized) {
        alerts.push({
          severity: 'critical',
          category: 'worker',
          message: 'Worker not initialized - jobs will not be processed',
          metric: 'worker_initialized',
          value: false,
          threshold: true,
          timestamp: new Date(),
          resolved: false,
        });
      } else if (!workerStatus.running) {
        alerts.push({
          severity: 'critical',
          category: 'worker',
          message: 'Worker not running - jobs will not be processed',
          metric: 'worker_running',
          value: false,
          threshold: true,
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // Check health score
    if (healthScore < thresholds.minHealthScore) {
      const severity = healthScore < 50 ? 'critical' : 'warning';
      alerts.push({
        severity,
        category: 'system',
        message: `System health score (${healthScore}) below threshold of ${thresholds.minHealthScore}`,
        metric: 'health_score',
        value: healthScore,
        threshold: thresholds.minHealthScore,
        timestamp: new Date(),
        resolved: false,
      });
    }

    return alerts;
  } catch (error) {
    console.error('❌ Alert check failed:', error);

    // Return system error alert
    return [
      {
        severity: 'critical',
        category: 'system',
        message: `Alert monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metric: 'monitoring_status',
        value: false,
        threshold: true,
        timestamp: new Date(),
        resolved: false,
      },
    ];
  }
}

/**
 * Quick health score calculation (simplified version)
 */
function calculateQuickHealthScore(
  queue: { waiting: number; active: number; failed: number; completed: number } | null,
  worker: { initialized: boolean; running: boolean } | null
): number {
  let score = 100;

  if (queue) {
    if (queue.failed > 10) score -= 30;
    else if (queue.failed > 5) score -= 15;

    if (queue.waiting > 20) score -= 25;
    else if (queue.waiting > 10) score -= 10;
  }

  if (worker) {
    if (!worker.initialized) score -= 30;
    if (worker.initialized && !worker.running) score -= 30;
  }

  return Math.max(0, score);
}

/**
 * Log alerts to console (can be extended to send notifications)
 */
export function logAlerts(alerts: Alert[]): void {
  if (alerts.length === 0) {
    console.log('✅ All health checks passed - no alerts');
    return;
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  console.log(`\n🚨 ALERT SUMMARY: ${alerts.length} alert(s) detected`);
  console.log(`   Critical: ${criticalAlerts.length}`);
  console.log(`   Warning: ${warningAlerts.length}\n`);

  alerts.forEach((alert) => {
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.category}`);
    console.log(`   ${alert.message}`);
    console.log(`   Metric: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`);
    console.log(`   Time: ${alert.timestamp.toISOString()}\n`);
  });
}

/**
 * Send alert notification (extend this for email/Slack/etc.)
 */
export async function sendAlertNotification(alert: Alert): Promise<void> {
  // TODO: Implement notification delivery
  // Options:
  // 1. Email via SendGrid/AWS SES
  // 2. Slack webhook
  // 3. PagerDuty/OpsGenie
  // 4. SMS via Twilio
  // 5. Discord webhook

  console.log(`📬 Alert notification (not implemented): ${alert.message}`);
}

/**
 * Get formatted alert summary for API responses
 */
export function formatAlertSummary(alerts: Alert[]): {
  total: number;
  critical: number;
  warning: number;
  info: number;
  categories: Record<string, number>;
  recent: Alert[];
} {
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
    categories: alerts.reduce(
      (acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    recent: alerts.slice(0, 5), // Last 5 alerts
  };
}
