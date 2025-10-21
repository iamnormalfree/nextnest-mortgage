import { NextResponse } from 'next/server';
import {
  checkHealthAndAlert,
  logAlerts,
  sendAlertNotification,
  formatAlertSummary,
  DEFAULT_THRESHOLDS,
  type AlertThresholds,
} from '@/lib/monitoring/alert-service';

export const dynamic = 'force-dynamic';

/**
 * ABOUTME: Real-time alert monitoring endpoint
 * ABOUTME: Checks system health against thresholds and returns active alerts
 *
 * GET /api/monitoring/alerts
 * - Returns current alerts based on health thresholds
 * - Logs alerts to console for Railway visibility
 *
 * Query Parameters:
 * - checkOnly=true - Only check and log, don't return details
 * - thresholds=custom - Use custom thresholds (JSON in body for POST)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get('checkOnly') === 'true';

    // Check health and generate alerts
    const alerts = await checkHealthAndAlert(DEFAULT_THRESHOLDS);

    // Enhanced logging for Railway dashboard visibility
    alerts.forEach(alert => {
      const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.message}`);
      if (alert.details) {
        console.log(`   Details: ${alert.details}`);
      }
    });

    // Send Slack notifications for critical alerts
    if (alerts.some(a => a.severity === 'critical')) {
      await sendAlertNotification(alerts);
    }

    // If check-only mode, just return summary
    if (checkOnly) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        status: alerts.length === 0 ? 'healthy' : 'alerts_detected',
        alertCount: alerts.length,
        criticalCount: alerts.filter(a => a.severity === 'critical').length,
      });
    }

    // Return full alert details
    const summary = formatAlertSummary(alerts);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: alerts.length === 0 ? 'healthy' : 'alerts_detected',
      summary,
      alerts,
      thresholds: DEFAULT_THRESHOLDS,
    });
  } catch (error) {
    console.error('❌ Alert monitoring endpoint error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check alerts',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for custom threshold checks
 *
 * Body: { thresholds: AlertThresholds }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customThresholds: Partial<AlertThresholds> = body.thresholds || {};

    // Merge with defaults
    const thresholds: AlertThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...customThresholds,
    };

    // Check with custom thresholds
    const alerts = await checkHealthAndAlert(thresholds);

    // Enhanced logging
    alerts.forEach(alert => {
      const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.message}`);
      if (alert.details) {
        console.log(`   Details: ${alert.details}`);
      }
    });

    // Send Slack notifications for critical alerts
    if (alerts.some(a => a.severity === 'critical')) {
      await sendAlertNotification(alerts);
    }

    const summary = formatAlertSummary(alerts);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: alerts.length === 0 ? 'healthy' : 'alerts_detected',
      summary,
      alerts,
      thresholds,
    });
  } catch (error) {
    console.error('❌ Custom alert check error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check alerts',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
