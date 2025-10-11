import { ConnectionOptions } from 'bullmq';

/**
 * Redis connection configuration for BullMQ
 * Supports Railway, Upstash, and local Redis
 *
 * INTEGRATION NOTES:
 * - Used by: broker-queue.ts, broker-worker.ts
 * - Environment variable: REDIS_URL (required)
 * - See: docs/ENVIRONMENT_SETUP.md for setup instructions
 */
export function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required. See docs/ENVIRONMENT_SETUP.md');
  }

  try {
    const url = new URL(redisUrl);

    const config: ConnectionOptions = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username === 'default' ? undefined : url.username,

      // Railway/Production: Enable TLS
      tls: process.env.NODE_ENV === 'production' && url.protocol === 'rediss:'
        ? {}
        : undefined,

      // BullMQ requirement
      maxRetriesPerRequest: null,

      // Connection resilience
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('❌ Redis connection failed after 10 retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 3000); // Max 3 seconds
        console.log(`⚠️ Redis retry ${times}, waiting ${delay}ms`);
        return delay;
      },

      // Keep-alive
      enableOfflineQueue: true,
      connectTimeout: 10000,
      keepAlive: 30000,
    };

    console.log('✅ Redis configuration loaded:', {
      host: config.host,
      port: config.port,
      tls: !!config.tls,
      env: process.env.NODE_ENV
    });

    return config;
  } catch (error) {
    console.error('❌ Invalid REDIS_URL format:', error);
    throw new Error('Invalid REDIS_URL. Format: redis://[username:password@]host:port');
  }
}

/**
 * Test Redis connection
 * Use this in health checks
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());

    await redis.ping();
    await redis.quit();

    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
}
