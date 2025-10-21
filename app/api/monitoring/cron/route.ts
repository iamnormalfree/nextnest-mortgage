import { NextResponse } from 'next/server';
import { checkHealthAndAlert, logAlerts } from '@/lib/monitoring/alert-service';

export const dynamic = 'force-dynamic';

/**
 * ABOUTME: Periodic health check endpoint for cron jobs
 * ABOUTME: Designed to be called every 5 minutes by external cron service
 *
 * PURPOSE:
 * - Runs automated health checks
 * - Logs alerts to Railway for visibility
 * - Returns status for cron service verification
 *
 * SETUP WITH RAILWAY CRON:
 * 1. Add cron schedule: "* /5 * * * *" (every 5 minutes)
 * 2. URL: https://your-domain.com/api/monitoring/cron
 * 3. Method: GET
 * 4. Add CRON_SECRET to environment variables
 *
 * SETUP WITH UPTIME ROBOT:
 * 1. Create HTTP(S) monitor
 * 2. URL: https://your-domain.com/api/monitoring/cron?secret=YOUR_SECRET
 * 3. Check interval: 5 minutes
 * 4. Alert on non-200 status
 *
 * SECURITY:
 * - Validates CRON_SECRET from environment
 * - Returns 401 if secret doesn't match
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && providedSecret !== expectedSecret) {
      console.warn('⚠️ Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Running periodic health check...');

    // Run health check
    const alerts = await checkHealthAndAlert();

    // Log alerts (visible in Railway)
    logAlerts(alerts);

    // Determine response status
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    const hasHealthIssues = criticalAlerts.length > 0;

    // Return summary
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: hasHealthIssues ? 'unhealthy' : 'healthy',
      alerts: {
        total: alerts.length,
        critical: criticalAlerts.length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
      },
      message:
        alerts.length === 0
          ? 'All systems healthy'
          : `${alerts.length} alert(s) detected - check logs`,
    });
  } catch (error) {
    console.error('❌ Cron health check failed:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual health check trigger
 */
export async function POST() {
  try {
    console.log('🔔 Manual health check triggered...');

    const alerts = await checkHealthAndAlert();

    logAlerts(alerts);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: alerts.length === 0 ? 'healthy' : 'alerts_detected',
      alerts: {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === 'critical').length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
      },
      details: alerts,
    });
  } catch (error) {
    console.error('❌ Manual health check failed:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
