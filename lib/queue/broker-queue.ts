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
 * Create BullMQ queue instance
 *
 * INTEGRATION WITH EXISTING SYSTEMS:
 * - Jobs call existing functions from:
 *   - broker-assignment.ts (assignBestBroker, updateBrokerMetrics)
 *   - broker-availability.ts (markBrokerBusy, releaseBrokerCapacity)
 *   - broker-persona.ts (analyzeMessageUrgency)
 *   - chatwoot-client.ts (sendInitialMessage, updateConversationCustomAttributes)
 */
export const brokerQueue = new Queue<BrokerConversationJob>(
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

/**
 * Queue events for monitoring
 */
export const brokerQueueEvents = new QueueEvents('broker-conversations', {
  connection: getRedisConnection(),
});

// Monitor queue events
brokerQueueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Job completed: ${jobId}`);
});

brokerQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job failed: ${jobId}`, failedReason);
});

brokerQueueEvents.on('active', ({ jobId }) => {
  console.log(`🔄 Job started: ${jobId}`);
});

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

    const job = await brokerQueue.add(
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

    const job = await brokerQueue.add(
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
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      brokerQueue.getWaitingCount(),
      brokerQueue.getActiveCount(),
      brokerQueue.getCompletedCount(),
      brokerQueue.getFailedCount(),
      brokerQueue.getDelayedCount(),
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
  await brokerQueue.pause();
  console.log('⏸️ Queue paused');
}

export async function resumeQueue() {
  await brokerQueue.resume();
  console.log('▶️ Queue resumed');
}

/**
 * Emergency: Drain all jobs (for rollback)
 */
export async function drainQueue() {
  await brokerQueue.drain();
  console.log('🚰 Queue drained');
}
