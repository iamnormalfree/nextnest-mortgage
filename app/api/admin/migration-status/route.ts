import { NextResponse } from 'next/server';
import { getMigrationStatus, getMigrationRecommendations } from '@/lib/utils/migration-control';
import { getQueueMetrics } from '@/lib/queue/broker-queue';
import { getWorkerStatus } from '@/lib/queue/worker-manager';

/**
 * Admin Migration Status Dashboard
 *
 * PURPOSE:
 * Provides real-time visibility into the BullMQ migration from n8n.
 * Tracks queue health, worker status, and migration progress.
 *
 * USAGE:
 * GET /api/admin/migration-status
 *
 * RETURNS:
 * - migration: Current migration configuration and phase
 * - queue: Queue metrics (waiting, active, completed, failed)
 * - worker: Worker status (initialized, running, paused)
 * - recommendations: Next steps based on current state
 * - health: Overall system health assessment
 *
 * MONITORING:
 * - Check this endpoint every 5 minutes during migration
 * - Alert on high failure rates (>10 failed jobs)
 * - Alert on queue backups (>20 waiting jobs)
 * - Use recommendations to guide migration progression
 *
 * SECURITY:
 * - TODO: Add authentication (API key or session check)
 * - Currently open for initial development/testing
 */
export async function GET() {
  try {
    // Get current migration configuration
    const migration = getMigrationStatus();

    // Get queue metrics
    let queue = null;
    let queueError = null;
    try {
      queue = await getQueueMetrics();
    } catch (error) {
      queueError = error instanceof Error ? error.message : 'Unknown queue error';
      console.error('❌ Failed to get queue metrics:', queueError);
    }

    // Get worker status
    let worker = null;
    let workerError = null;
    try {
      worker = getWorkerStatus();
    } catch (error) {
      workerError = error instanceof Error ? error.message : 'Unknown worker error';
      console.error('❌ Failed to get worker status:', workerError);
    }

    // Get recommendations based on current state
    const recommendations = getMigrationRecommendations(queue || undefined);

    // Calculate overall health status
    const health = calculateSystemHealth(migration, queue, worker);

    // Build response
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      migration: {
        ...migration,
        description: getMigrationDescription(migration),
      },
      queue: queue || {
        error: queueError,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      },
      worker: worker || {
        error: workerError,
        initialized: false,
        running: false,
        isPaused: false,
        isRunning: false,
      },
      recommendations,
      health,
      environment: {
        ENABLE_BULLMQ_BROKER: process.env.ENABLE_BULLMQ_BROKER || 'false',
        BULLMQ_ROLLOUT_PERCENTAGE: process.env.BULLMQ_ROLLOUT_PERCENTAGE || '0',
        ENABLE_AI_BROKER: process.env.ENABLE_AI_BROKER || 'false',
        WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY || '3',
        QUEUE_RATE_LIMIT: process.env.QUEUE_RATE_LIMIT || '10',
      },
    });
  } catch (error) {
    console.error('❌ Admin migration status error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get migration status',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * Get human-readable migration description
 */
function getMigrationDescription(status: any): string {
  if (!status.bullmqEnabled) {
    return 'BullMQ not enabled. All traffic using n8n or legacy system.';
  }

  if (status.trafficPercentage === 0) {
    return 'BullMQ enabled but no traffic routed. Safe testing/validation mode.';
  }

  if (status.trafficPercentage < 10) {
    return `Initial rollout: ${status.trafficPercentage}% traffic on BullMQ.`;
  }

  if (status.trafficPercentage < 50) {
    return `Gradual rollout: ${status.trafficPercentage}% traffic on BullMQ.`;
  }

  if (status.trafficPercentage < 100) {
    return `Majority traffic on BullMQ: ${status.trafficPercentage}%.`;
  }

  if (status.n8nEnabled) {
    return '100% traffic on BullMQ. n8n still active as backup.';
  }

  return '100% cutover complete. n8n can be decommissioned.';
}

/**
 * Calculate overall system health
 */
function calculateSystemHealth(
  migration: any,
  queue: any,
  worker: any
): {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  issues: string[];
  summary: string;
} {
  const issues: string[] = [];
  let score = 100;

  // Check if systems are configured
  if (!migration.bullmqEnabled && !migration.n8nEnabled) {
    return {
      status: 'warning',
      score: 50,
      issues: ['No AI broker system enabled'],
      summary: 'No active broker system',
    };
  }

  // Check queue health
  if (queue) {
    // High failure rate
    if (queue.failed > 10) {
      issues.push(`High failure rate: ${queue.failed} failed jobs`);
      score -= 30;
    } else if (queue.failed > 5) {
      issues.push(`Moderate failures: ${queue.failed} failed jobs`);
      score -= 15;
    }

    // Queue backing up
    if (queue.waiting > 20) {
      issues.push(`Queue backing up: ${queue.waiting} jobs waiting`);
      score -= 25;
    } else if (queue.waiting > 10) {
      issues.push(`Queue growing: ${queue.waiting} jobs waiting`);
      score -= 10;
    }

    // No activity (might be issue or just quiet period)
    if (migration.bullmqEnabled && migration.trafficPercentage > 0) {
      if (queue.completed === 0 && queue.active === 0 && queue.waiting === 0) {
        issues.push('No queue activity detected');
        score -= 20;
      }
    }
  } else {
    issues.push('Queue metrics unavailable');
    score -= 20;
  }

  // Check worker health
  if (worker) {
    if (migration.bullmqEnabled && !worker.initialized) {
      issues.push('Worker not initialized');
      score -= 30;
    }

    if (migration.bullmqEnabled && worker.initialized && !worker.running) {
      issues.push('Worker not running');
      score -= 30;
    }

    if (worker.isPaused) {
      issues.push('Worker is paused');
      score -= 20;
    }
  } else {
    if (migration.bullmqEnabled) {
      issues.push('Worker status unavailable');
      score -= 20;
    }
  }

  // Determine status based on score
  let status: 'healthy' | 'warning' | 'critical' | 'unknown';
  if (score >= 80) {
    status = 'healthy';
  } else if (score >= 60) {
    status = 'warning';
  } else if (score >= 40) {
    status = 'critical';
  } else {
    status = 'unknown';
  }

  // Generate summary
  let summary = '';
  if (status === 'healthy') {
    summary = 'All systems operating normally';
  } else if (status === 'warning') {
    summary = 'System operational with minor issues';
  } else if (status === 'critical') {
    summary = 'Critical issues detected - immediate attention required';
  } else {
    summary = 'System health unknown - check configuration';
  }

  return {
    status,
    score,
    issues,
    summary,
  };
}

/**
 * POST endpoint for emergency controls
 *
 * USAGE:
 * POST /api/admin/migration-status
 * Body: { action: 'pause' | 'resume' | 'rollback' }
 *
 * SECURITY:
 * - TODO: Add authentication
 * - These are emergency operations - should be restricted
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // TODO: Add authentication check here
    // For now, log a warning
    console.warn('⚠️ Admin action requested without authentication:', action);

    switch (action) {
      case 'pause':
        // Pause queue processing
        const { pauseQueue } = await import('@/lib/queue/broker-queue');
        await pauseQueue();
        return NextResponse.json({
          success: true,
          message: 'Queue paused successfully',
          timestamp: new Date().toISOString(),
        });

      case 'resume':
        // Resume queue processing
        const { resumeQueue } = await import('@/lib/queue/broker-queue');
        await resumeQueue();
        return NextResponse.json({
          success: true,
          message: 'Queue resumed successfully',
          timestamp: new Date().toISOString(),
        });

      case 'rollback':
        // Emergency rollback - drain queue and disable BullMQ
        const { drainQueue } = await import('@/lib/queue/broker-queue');
        await drainQueue();
        return NextResponse.json({
          success: true,
          message: 'Queue drained. Set ENABLE_BULLMQ_BROKER=false to complete rollback.',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Supported: pause, resume, rollback',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Admin action error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Action failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
}
