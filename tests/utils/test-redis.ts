// ABOUTME: Test Redis setup helper for BullMQ integration tests
// ABOUTME: Provides real in-memory Redis instances using redis-memory-server

import { RedisMemoryServer } from 'redis-memory-server';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';

let redisServer: RedisMemoryServer | null = null;
let redisClient: Redis | null = null;
let testRedisUrl: string | null = null;

/**
 * Start in-memory Redis server for testing
 *
 * Uses redis-memory-server to spin up actual Redis instance in memory.
 * This supports BullMQ's Lua scripts with cmsgpack, unlike ioredis-mock.
 *
 * IMPORTANT: Sets REDIS_URL environment variable so getRedisConnection()
 * from lib/queue/redis-config.ts points to the test instance.
 */
export async function startTestRedis(): Promise<Redis> {
  // Create and start Redis server
  redisServer = new RedisMemoryServer();
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();

  // Build Redis URL and set as environment variable
  testRedisUrl = `redis://${host}:${port}`;
  process.env.REDIS_URL = testRedisUrl;

  console.log(`🧪 Test Redis started: ${testRedisUrl}`);

  // Connect ioredis client
  redisClient = new Redis({
    host,
    port,
    maxRetriesPerRequest: null, // Required for BullMQ
  });

  return redisClient;
}

/**
 * Get the test Redis URL
 *
 * Use this if you need to manually configure connections to the test instance
 */
export function getTestRedisUrl(): string {
  if (!testRedisUrl) {
    throw new Error('Test Redis not started. Call startTestRedis() first.');
  }
  return testRedisUrl;
}

/**
 * Stop in-memory Redis server and close connection
 */
export async function stopTestRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }

  if (redisServer) {
    await redisServer.stop();
    redisServer = null;
  }

  // Clear environment variable
  delete process.env.REDIS_URL;
  testRedisUrl = null;

  console.log('🧪 Test Redis stopped');
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use startTestRedis() instead
 */
export function createTestRedis() {
  throw new Error('createTestRedis() is deprecated. Use startTestRedis() with async/await.');
}

/**
 * Create test Queue connected to in-memory Redis
 * 
 * @param name - Queue name (must match Worker name)
 * @param redis - ioredis-mock instance from createTestRedis()
 */
export function createTestQueue<T = any>(name: string, redis: any): Queue<T> {
  return new Queue<T>(name, {
    connection: redis,
  });
}

/**
 * Create test Worker connected to in-memory Redis
 * 
 * @param name - Worker name (must match Queue name)
 * @param processor - Job processing function
 * @param redis - ioredis-mock instance from createTestRedis()
 */
export function createTestWorker<T = any>(
  name: string,
  processor: any,
  redis: any
): Worker<T> {
  return new Worker<T>(name, processor, {
    connection: redis,
    autorun: false, // Manual control for tests
  });
}
