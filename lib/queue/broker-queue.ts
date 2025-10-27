import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { BrokerPersona } from '@/lib/calculations/broker-persona';

/**
 * BullMQ Job Data Structure
 *
 * INTEGRATION NOTES:
 * - ProcessedLeadData: from existing lib/integrations/chatwoot-client.ts
 * - BrokerPersona: from existing lib/calculations/broker-persona.ts
 * - Used by: broker-worker.ts to process conversations
 *
 * JOB TYPES:
 * - 'new-conversation': Initial broker greeting after form submission
 * - 'incoming-message': AI response to customer message
 */
export interface BrokerConversationJob {
  // Job type
  type: 'new-conversation' | 'incoming-message';

  // Identity
  conversationId: number;
  contactId: number;

  // Broker assignment (from existing broker-assignment.ts)
  brokerId?: string;
  brokerName?: string;

  // Context (from existing system)
  brokerPersona: BrokerPersona;  // From existing broker-persona.ts
  processedLeadData: ProcessedLeadData;  // From existing chatwoot-client.ts

  // Message details
  userMessage?: string;

  // Flags (from existing deduplication logic)
  isConversationReopen?: boolean;
  skipGreeting?: boolean;

  // SLA Timing Data (Phase 1 Day 1)
  timingData?: {
    messageId: string;
    queueAddTimestamp: number;
  };

  // Metadata
  timestamp?: number;
}

/**
 * Lazy initialization for BullMQ queue instance
 *
 * IMPORTANT: Uses lazy initialization to prevent build-time execution.
 * Environment variables (REDIS_URL) are only available at runtime in Docker builds.
 *
 * INTEGRATION WITH EXISTING SYSTEMS:
 * - Jobs call existing functions from:
 *   - broker-assignment.ts (assignBestBroker, updateBrokerMetrics)
 *   - broker-availability.ts (markBrokerBusy, releaseBrokerCapacity)
 *   - broker-persona.ts (analyzeMessageUrgency)
 *   - chatwoot-client.ts (sendInitialMessage, updateConversationCustomAttributes)
 */
let _brokerQueue: Queue<BrokerConversationJob> | null = null;

export function getBrokerQueue(): Queue<BrokerConversationJob> {
  if (!_brokerQueue) {
    _brokerQueue = new Queue<BrokerConversationJob>(
      'broker-conversations',
      {
        connection: getRedisConnection(),
        // Note: High-throughput timing operations use pooled connections for better performance
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 86400, // 24 hours
            count: 1000,
          },
          removeOnFail: {
            age: 604800, // 7 days
          },
        },
      }
    );
  }
  return _brokerQueue;
}

/**
 * Lazy initialization for queue events (monitoring)
 */
let _brokerQueueEvents: QueueEvents | null = null;

export function getBrokerQueueEvents(): QueueEvents {
  if (!_brokerQueueEvents) {
    _brokerQueueEvents = new QueueEvents('broker-conversations', {
      // Note: Queue events use standard connection; timing ops use pooled connections
      connection: getRedisConnection(),
    });

    // Set up event handlers once
    _brokerQueueEvents.on('completed', ({ jobId }) => {
      console.log(`✅ Job completed: ${jobId}`);
    });

    _brokerQueueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job failed: ${jobId}`, failedReason);
    });

    _brokerQueueEvents.on('active', ({ jobId }) => {
      console.log(`🔄 Job started: ${jobId}`);
    });
  }
  return _brokerQueueEvents;
}

/**
 * Add new conversation to queue
 *
 * CALLED FROM:
 * - app/api/chatwoot-conversation/route.ts (after conversation creation)
 *
 * IMPORTANT: This function will be integrated into the existing conversation
 * creation flow alongside the current BrokerEngagementManager during the
 * gradual migration (Phase 4).
 */
export async function queueNewConversation(data: {
  conversationId: number;
  contactId: number;
  processedLeadData: ProcessedLeadData;
  isConversationReopen?: boolean;
  skipGreeting?: boolean;
}) {
  try {
    // Create unique job ID for deduplication and timing
    const timestamp = Date.now();
    const messageId = `conv-${data.conversationId}-${timestamp}`;
    const jobId = `new-conversation-${data.conversationId}-${timestamp}`;
    
    // Add timing data for SLA monitoring
    await addTimingDataToJob(data.conversationId, messageId, timestamp);

    // Determine priority based on lead score
    const priority = data.processedLeadData.leadScore > 75 ? 1 : 5;

    console.log(`📋 Queueing new conversation:`, {
      jobId,
      conversationId: data.conversationId,
      leadScore: data.processedLeadData.leadScore,
      brokerPersona: data.processedLeadData.brokerPersona.name,
      isReopen: data.isConversationReopen,
      skipGreeting: data.skipGreeting,
      priority,
    });

    const job = await getBrokerQueue().add(
      'new-conversation',
      {
        type: 'new-conversation',
        conversationId: data.conversationId,
        contactId: data.contactId,
        brokerPersona: data.processedLeadData.brokerPersona,
        processedLeadData: data.processedLeadData,
        userMessage: `Initial greeting for ${data.processedLeadData.name}`,
        isConversationReopen: data.isConversationReopen || false,
        skipGreeting: data.skipGreeting || false,
        timestamp,
        timingData: {
          messageId,
          queueAddTimestamp: timestamp,
        },
      },
      {
        jobId,
        priority,
        // Slight delay for new conversations to allow Chatwoot to settle
        delay: 500,
      }
    );

    console.log(`✅ New conversation queued successfully: ${job.id}`);

    return job;
  } catch (error) {
    console.error(`❌ Failed to queue new conversation ${data.conversationId}:`, error);
    throw error;
  }
}

/**
 * Add incoming message to queue
 *
 * CALLED FROM:
 * - app/api/chatwoot-webhook/route.ts (after echo detection)
 *
 * IMPORTANT: This function will be integrated into the webhook handler
 * alongside the current n8n forwarding during the gradual migration (Phase 4).
 */
export async function queueIncomingMessage(data: {
  conversationId: number;
  contactId: number;
  brokerId: string;
  brokerName: string;
  brokerPersona: BrokerPersona;
  processedLeadData: ProcessedLeadData;
  userMessage: string;
  messageId?: number;
}) {
  try {
    // Create unique job ID for deduplication and timing
    const timestamp = Date.now();
    const messageId = `conv-${data.conversationId}-${timestamp}`;
    const jobId = `incoming-message-${data.conversationId}-${data.messageId || timestamp}`;
    // Add timing data for SLA monitoring
    await addTimingDataToJob(data.conversationId, messageId, timestamp);

    console.log(`📋 Queueing incoming message:`, {
      jobId,
      conversationId: data.conversationId,
      brokerName: data.brokerName,
      messagePreview: data.userMessage.substring(0, 50) + '...',
    });

    const job = await getBrokerQueue().add(
      'incoming-message',
      {
        type: 'incoming-message',
        conversationId: data.conversationId,
        contactId: data.contactId,
        brokerId: data.brokerId,
        brokerName: data.brokerName,
        brokerPersona: data.brokerPersona,
        processedLeadData: data.processedLeadData,
        userMessage: data.userMessage,
        skipGreeting: true, // Never greet on incoming messages
        timestamp,
        timingData: {
          messageId,
          queueAddTimestamp: timestamp,
        },
      },
      {
        jobId,
        priority: 3, // Normal priority for incoming messages
      }
    );

    console.log(`✅ Incoming message queued successfully: ${job.id}`);

    return job;
  } catch (error) {
    console.error(`❌ Failed to queue incoming message ${data.conversationId}:`, error);
    throw error;
  }
}

/**
 * Get queue metrics for monitoring
 *
 * USED BY:
 * - app/api/health/route.ts (health checks)
 * - app/api/admin/migration-status/route.ts (migration dashboard)
 * - scripts/monitor-migration.ts (monitoring script)
 */
export async function getQueueMetrics() {
  try {
    const queue = getBrokerQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const metrics = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };

    // Alert on high failure rate
    if (failed > 10) {
      console.warn(`⚠️ High failure rate: ${failed} failed jobs`);
    }

    // Alert on queue backup
    if (waiting > 20) {
      console.warn(`⚠️ Queue backing up: ${waiting} jobs waiting`);
    }

    return metrics;
  } catch (error) {
    console.error('❌ Failed to get queue metrics:', error);
    return null;
  }
}

/**
 * Pause/resume queue for maintenance
 */
export async function pauseQueue() {
  await getBrokerQueue().pause();
  console.log('⏸️ Queue paused');
}

export async function resumeQueue() {
  await getBrokerQueue().resume();
  console.log('▶️ Queue resumed');
}

/**
 * Emergency: Drain all jobs (for rollback)
 */
export async function drainQueue() {
  await getBrokerQueue().drain();
  console.log('🚰 Queue drained');
}

// ============================================================================
// SLA TIMING TRACKING (Phase 1 Day 1 Integration)
// ============================================================================

/**
 * Timing data structure for SLA monitoring
 * Tracks hop-by-hop timing through the queue system
 */
export interface MessageTimingData {
  messageId: string;
  conversationId: number;
  queueAddTimestamp?: number;
  workerStartTimestamp?: number;
  workerCompleteTimestamp?: number;
  chatwootSendTimestamp?: number;
  totalDuration?: number;
  // AI Segment Instrumentation (Phase 2 Task 2.5)
  aiSegment?: {
    model?: string;
    promptLength?: number;
    responseLength?: number;
    orchestratorPath?: string; // 'dr-elena', 'direct-ai', 'fallback'
    aiStartTimestamp?: number;
    aiCompleteTimestamp?: number;
    aiProcessingTime?: number;
  };
}

/**
 * In-memory timing data store with Redis persistence
 */
const TIMING_DATA_KEY_PREFIX = 'timing:';
const TIMING_TTL = 3600; // 1 hour TTL

/**
 * Update timing data for SLA monitoring
 * Called by worker to track progress through the system
 */
export async function updateTimingData(
  conversationId: number,
  messageId: string,
  updates: Partial<MessageTimingData>
): Promise<void> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    const key = `${TIMING_DATA_KEY_PREFIX}${conversationId}:${messageId}`;

    // Get existing timing data
    const existing = await redis.hgetall(key);
    const timingData: MessageTimingData = {
      messageId,
      conversationId,
      queueAddTimestamp: existing.queueAddTimestamp ? parseInt(existing.queueAddTimestamp) : undefined,
      workerStartTimestamp: existing.workerStartTimestamp ? parseInt(existing.workerStartTimestamp) : undefined,
      workerCompleteTimestamp: existing.workerCompleteTimestamp ? parseInt(existing.workerCompleteTimestamp) : undefined,
      chatwootSendTimestamp: existing.chatwootSendTimestamp ? parseInt(existing.chatwootSendTimestamp) : undefined,
      totalDuration: existing.totalDuration ? parseInt(existing.totalDuration) : undefined,
    };

    // Apply updates
    Object.assign(timingData, updates);

    // Calculate total duration - prioritize end-to-end delivery time when available
    if (timingData.queueAddTimestamp) {
      if (timingData.chatwootSendTimestamp) {
        // Full end-to-end: queue → Chatwoot delivered
        timingData.totalDuration = timingData.chatwootSendTimestamp - timingData.queueAddTimestamp;
      } else if (timingData.workerCompleteTimestamp) {
        // Partial: queue → worker finished (fallback while Chatwoot pending)
        timingData.totalDuration = timingData.workerCompleteTimestamp - timingData.queueAddTimestamp;
      }
    }

    // Store updated data
    const pipeline = redis.pipeline();
    pipeline.hset(key, timingData as any);
    pipeline.expire(key, TIMING_TTL);
    await pipeline.exec();

    await redis.quit();
    
    console.log(`⏱️ Timing data updated for ${conversationId}:${messageId}`, {
      phase: Object.keys(updates)[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to update timing data:', error);
    // Non-critical - don't throw errors
  }
}

/**
 * Get timing data for monitoring and SLA analysis
 */
export async function getTimingData(
  conversationId: number,
  messageId: string
): Promise<MessageTimingData | null> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    const key = `${TIMING_DATA_KEY_PREFIX}${conversationId}:${messageId}`;

    const data = await redis.hgetall(key);
    await redis.quit();

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      messageId,
      conversationId,
      queueAddTimestamp: data.queueAddTimestamp ? parseInt(data.queueAddTimestamp) : undefined,
      workerStartTimestamp: data.workerStartTimestamp ? parseInt(data.workerStartTimestamp) : undefined,
      workerCompleteTimestamp: data.workerCompleteTimestamp ? parseInt(data.workerCompleteTimestamp) : undefined,
      chatwootSendTimestamp: data.chatwootSendTimestamp ? parseInt(data.chatwootSendTimestamp) : undefined,
      totalDuration: data.totalDuration ? parseInt(data.totalDuration) : undefined,
    };
  } catch (error) {
    console.error('❌ Failed to get timing data:', error);
    return null;
  }
}

/**
 * Get SLA timing data for multiple conversations (for analysis endpoint)
 */
export async function getSLATimingData(
  conversationId?: number
): Promise<MessageTimingData[]> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());

    const timingDataList: MessageTimingData[] = [];
    let keys: string[] = [];
    let cursor = '0';

    // Use SCAN instead of KEYS to avoid blocking Redis event loop
    const scanPattern = conversationId
      ? `${TIMING_DATA_KEY_PREFIX}${conversationId}:*`
      : `${TIMING_DATA_KEY_PREFIX}*`;

    do {
      try {
        const result = await redis.scan(cursor, 'MATCH', scanPattern, 'COUNT', 100);
        cursor = result[0];
        keys = result[1];

        for (const key of keys) {
          try {
            const data = await redis.hgetall(key);
            if (data && Object.keys(data).length > 0) {
              const [convId, msgId] = key.replace(TIMING_DATA_KEY_PREFIX, '').split(':');
              timingDataList.push({
                messageId: msgId,
                conversationId: parseInt(convId),
                queueAddTimestamp: data.queueAddTimestamp ? parseInt(data.queueAddTimestamp) : undefined,
                workerStartTimestamp: data.workerStartTimestamp ? parseInt(data.workerStartTimestamp) : undefined,
                workerCompleteTimestamp: data.workerCompleteTimestamp ? parseInt(data.workerCompleteTimestamp) : undefined,
                chatwootSendTimestamp: data.chatwootSendTimestamp ? parseInt(data.chatwootSendTimestamp) : undefined,
                totalDuration: data.totalDuration ? parseInt(data.totalDuration) : undefined,
              });
            }
          } catch (dataError) {
            console.error(`❌ Error processing timing key ${key}:`, dataError);
            // Continue processing other keys
          }
        }

        // Limit results to prevent memory issues
        if (timingDataList.length >= 100) {
          console.log(`⚠️ Limiting timing data to 100 entries for performance`);
          break;
        }

      } catch (scanError) {
        console.error('❌ Redis SCAN error:', scanError);
        break;
      }
    } while (cursor !== '0');

    await redis.quit();
    return timingDataList;
  } catch (error) {
    console.error('❌ Failed to get SLA timing data:', error);
    return [];
  }
}

/**
 * Add timing data to job when queueing
 */
async function addTimingDataToJob(
  conversationId: number,
  messageId: string,
  queueAddTimestamp: number
): Promise<void> {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(getRedisConnection());
    const key = `${TIMING_DATA_KEY_PREFIX}${conversationId}:${messageId}`;

    await redis.hset(key, {
      messageId,
      conversationId: conversationId.toString(),
      queueAddTimestamp: queueAddTimestamp.toString(),
    });
    await redis.expire(key, TIMING_TTL);
    await redis.quit();
  } catch (error) {
    console.error('❌ Failed to add timing data to job:', error);
    // Non-critical
  }
}
