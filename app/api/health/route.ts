/**
 * Health Check API with Worker Auto-Start
 *
 * Returns 200 OK if the application is running
 * Used by Railway healthcheck
 *
 * IMPORTANT: Auto-initializes BullMQ worker on first health check
 * - Ensures worker starts automatically on Railway deployment
 * - Singleton pattern prevents duplicate workers on subsequent checks
 * - Worker runs in background, doesn't block health check response
 */

import { NextResponse } from 'next/server';
import { initializeWorker, getWorkerStatus } from '@/lib/queue/worker-manager';

export async function GET() {
  // Auto-initialize worker on first health check (Railway auto-start)
  // Singleton pattern in worker-manager prevents duplicate initialization
  if (typeof window === 'undefined') {
    // Run in background, don't await to avoid blocking health check
    initializeWorker().catch(err => {
      console.error('⚠️ Worker initialization failed in health check:', err);
    });
  }

  const workerStatus = getWorkerStatus();

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    worker: {
      initialized: workerStatus.initialized,
      running: workerStatus.running
    }
  });
}
