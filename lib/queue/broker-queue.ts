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
    // Create unique job ID for deduplication
    const timestamp = Date.now();
    const jobId = `new-conversation-${data.conversationId}-${timestamp}`;

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
    // Create unique job ID for deduplication
    const timestamp = Date.now();
    const jobId = `incoming-message-${data.conversationId}-${data.messageId || timestamp}`;

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
