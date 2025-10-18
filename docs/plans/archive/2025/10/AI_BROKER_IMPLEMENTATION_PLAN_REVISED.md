# AI Broker Implementation Plan - REVISED & VERIFIED
**Project**: NextNest Mortgage Advisory Platform
**Date**: January 17, 2025 (REVISED after verification)
**Status**: ✅ Verified against existing codebase
**Stack**: Vercel AI SDK + BullMQ + Existing Systems (Railway)

---

## ⚠️ IMPORTANT: This is the REVISED plan

This document replaces the original `AI_BROKER_IMPLEMENTATION_PLAN.md` based on comprehensive verification against your existing codebase.

**Key Changes from Original**:
- ✅ Integrates with (not replaces) your existing broker system
- ✅ Preserves conversation deduplication logic
- ✅ Maintains broker capacity tracking in Supabase
- ✅ Keeps echo detection system
- ✅ Reuses existing timing calculations
- ✅ Provides gradual migration from n8n
- ✅ Adds Phase 0 for documentation before coding

---

## Executive Summary

**Decision**: Enhance existing system with Vercel AI SDK + BullMQ (not replace)

**Integration Approach**: "Enhance existing" not "replace with new"

**Timeline**: 10-14 days (includes proper migration)

**End Goals (All Verified):**
1. ✅ Queue management - BullMQ replaces in-memory array
2. ✅ Human-like timing - Reuse existing `analyzeMessageUrgency()`
3. ✅ Multiple personas - Keep existing 5 broker personas
4. ✅ Human handoff - Preserve existing trigger detection
5. ✅ Natural conversation - Add Vercel AI SDK streaming
6. ✅ Chatwoot integration - Enhance existing client
7. ✅ No duplicate messages - Preserve echo detection
8. ✅ Persistent queue - BullMQ + Redis
9. ✅ Conversation reuse - Preserve deduplication logic

---

## Architecture Overview

### Your Current System (Keep 85% of this):
```
User Form → Next.js API → Chatwoot creates conversation
                        → Check for existing conversation (KEEP THIS)
                        → In-memory queue (REPLACE THIS ONLY)
                        → Broker assignment (KEEP THIS)
                        → n8n webhook (MIGRATE GRADUALLY)
                        → OpenAI SDK (ENHANCE WITH VERCEL AI SDK)
                        → Chatwoot messages (KEEP THIS)
                        → Echo detection (KEEP THIS)
                        → Capacity tracking (KEEP THIS)
```

### Enhanced System (After Implementation):
```
User Form → Next.js API → Chatwoot creates conversation
                        → Check for existing conversation ✅ PRESERVED
                        → BullMQ Queue (persistent) ✅ NEW
                        → Worker processes job
                        → Broker assignment ✅ EXISTING FUNCTION
                        → Mark broker busy ✅ EXISTING FUNCTION
                        → Analyze urgency ✅ EXISTING FUNCTION
                        → Wait (calculated delay)
                        → Vercel AI SDK generates response ✅ NEW
                        → Send via existing Chatwoot client ✅ EXISTING
                        → Track with echo detection ✅ EXISTING
                        → Release capacity ✅ EXISTING FUNCTION
```

**What Changes**: Only the queue storage (in-memory → Redis) and AI SDK (OpenAI → Vercel)
**What Stays**: 85% of your code (broker assignment, personas, Chatwoot, capacity management)

---

## Implementation Phases (REVISED)

### ⚠️ Phase 0: Documentation & Preparation (NEW - Days 1-2)
**CRITICAL**: Don't skip this phase

### Phase 1: BullMQ Foundation (Days 3-4)
**Focus**: Add queue alongside existing system

### Phase 2: AI Service Integration (Days 5-6)
**Focus**: Vercel AI SDK that calls existing functions

### Phase 3: Worker Implementation (Days 7-8)
**Focus**: Connect worker to existing systems

### Phase 4: Gradual Migration (Days 9-12)
**Focus**: Parallel running → cutover

### Phase 5: Monitoring & Cleanup (Days 13-14)
**Focus**: Production readiness

---

## Phase 0: Documentation & Preparation (CRITICAL)

### Goal: Understand what you have before changing it

### Step 0.1: Document Current Architecture

**Create**: `docs/CURRENT_ARCHITECTURE.md`

```markdown
# Current NextNest AI Broker Architecture

## System Overview

**Production Components**:
1. Next.js app on Railway
2. Chatwoot (self-hosted) at chat.nextnest.sg
3. n8n workflows for AI responses
4. Supabase for broker database
5. OpenAI SDK for AI generation

## Conversation Flow

### 1. User Submits Form
**File**: `app/api/chatwoot-conversation/route.ts`
**Process**:
- Calculates lead score
- Determines broker persona
- Creates/finds Chatwoot contact
- **Checks for existing conversation** (lines 235-276)
- Creates conversation or reuses existing
- Queues broker assignment

### 2. Broker Assignment
**File**: `lib/ai/broker-assignment.ts`
**Process**:
- Queries Supabase for available brokers
- Matches broker type to lead score
- Records assignment in broker_conversations table
- Returns broker details

### 3. Capacity Management
**File**: `lib/ai/broker-availability.ts`
**Functions**:
- `markBrokerBusy()` - Increments workload, updates availability
- `releaseBrokerCapacity()` - Decrements workload, frees capacity
- Tracks in Supabase ai_brokers table

### 4. Queue Management (IN-MEMORY - TO BE REPLACED)
**File**: `lib/engagement/broker-engagement-manager.ts`
**Current Issues**:
- Line 36: `private queue: EngagementContext[] = []` ❌ Lost on restart
- No persistence
- No retry logic
- No monitoring

### 5. Broker Personas
**File**: `lib/calculations/broker-persona.ts`
**Contains**:
- 5 broker personas (Michelle, Jasmine, Rachel, Sarah, Grace)
- `analyzeMessageUrgency()` - Calculates response delays (1-6s)
- `generatePersonaGreeting()` - Creates initial messages
- `getConversationStarters()` - Provides follow-up prompts

### 6. Chatwoot Integration
**File**: `lib/integrations/chatwoot-client.ts`
**Methods TO REUSE**:
- `createOrUpdateContact()` - Contact management
- `createConversation()` - Conversation creation
- `sendInitialMessage()` - Sends broker greeting with deduplication
- `hasExistingGreeting()` - Prevents duplicate greetings (lines 373-410)
- `createActivityMessage()` - System messages
- `updateConversationCustomAttributes()` - Metadata updates

### 7. Webhook Handler
**File**: `app/api/chatwoot-webhook/route.ts`
**Critical Features TO PRESERVE**:
- Lines 6-12: `processedMessages` Set for deduplication
- Lines 76-95: `checkIfEcho()` - Prevents bot message echoes
- Lines 140-261: n8n forwarding logic (to be migrated)
- Lines 263-304: Local processing fallback
- Circuit breaker pattern

### 8. n8n Workflow (TO BE MIGRATED)
**Current Setup**:
- Receives webhooks from Chatwoot
- Processes AI broker responses
- Sends back to Chatwoot via API
- Has own retry logic
- Handles rate limiting

**Environment Variables**:
```bash
N8N_AI_BROKER_WEBHOOK_URL=https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker
ENABLE_AI_BROKER=true
```

## Database Schema

### Supabase Tables Used:
1. **ai_brokers**
   - Broker profiles
   - Availability status
   - Current workload
   - Max concurrent chats

2. **broker_conversations**
   - Assignment records
   - Lead score tracking
   - Conversation metrics
   - Handoff details

## What Must Be Preserved:

- ✅ Conversation deduplication logic
- ✅ Echo detection system
- ✅ Broker capacity tracking
- ✅ Response timing calculations
- ✅ Broker persona system
- ✅ Chatwoot client methods
- ✅ Database assignment records
- ✅ Handoff trigger detection

## What Will Change:

- ❌ In-memory queue → BullMQ (Redis-backed)
- ❌ OpenAI SDK → Vercel AI SDK (optional, can coexist)
- ⚠️ n8n integration → Direct processing (gradual migration)
```

### Step 0.2: Create Integration Mapping

**Create**: `docs/INTEGRATION_MAPPING.md`

```markdown
# BullMQ Integration Mapping

This document maps BullMQ jobs to existing NextNest functions.

## Job Structure

```typescript
interface BrokerConversationJob {
  // Identity
  conversationId: number
  brokerId: string
  brokerName: string

  // Context (from existing system)
  brokerPersona: BrokerPersona  // From broker-persona.ts
  processedLeadData: ProcessedLeadData  // From chatwoot-client.ts

  // Message
  userMessage: string
  messageType: 'greeting' | 'reply'

  // Flags (from existing deduplication)
  isConversationReopen: boolean
  skipGreeting: boolean

  // Timing (calculated by existing function)
  responseDelay: number  // From analyzeMessageUrgency()
}
```

## Function Mapping

### Job Creation (When to queue)

**Scenario 1: New Conversation**
```typescript
// File: app/api/chatwoot-conversation/route.ts
// After line 320 (conversation created)

await queueBrokerConversation({
  conversationId: conversation.id,
  brokerId: broker.id,
  brokerName: broker.name,
  brokerPersona: processedLeadData.brokerPersona,
  processedLeadData,
  userMessage: `Initial greeting for ${processedLeadData.name}`,
  messageType: 'greeting',
  isConversationReopen: dedupeResult.isReopen,
  skipGreeting: dedupeResult.isReopen && dedupeResult.hasRecentActivity,
  responseDelay: 2000  // Will be recalculated by existing function
})
```

**Scenario 2: Incoming Message**
```typescript
// File: app/api/chatwoot-webhook/route.ts
// After line 73 (verified as incoming message)

await queueBrokerConversation({
  conversationId: event.conversation.id,
  brokerId: broker.id,  // From getBrokerForConversation()
  brokerName: broker.name,
  brokerPersona: broker.persona,
  processedLeadData: {}, // Fetch from conversation attributes
  userMessage: event.content,
  messageType: 'reply',
  isConversationReopen: false,
  skipGreeting: true,  // Never greet on replies
  responseDelay: 0  // Will be calculated
})
```

### Job Processing (Worker logic)

```typescript
// File: lib/queue/broker-worker.ts

async function processJob(job: Job<BrokerConversationJob>) {
  const { data } = job

  // STEP 1: Mark broker busy (EXISTING FUNCTION)
  // File: lib/ai/broker-availability.ts
  await markBrokerBusy(
    { id: data.brokerId },
    data.conversationId
  )

  // STEP 2: Calculate response delay (EXISTING FUNCTION)
  // File: lib/calculations/broker-persona.ts
  const urgency = analyzeMessageUrgency(
    data.userMessage,
    data.brokerPersona
  )

  // STEP 3: Wait for natural timing
  await delay(urgency.responseTime)

  // STEP 4: Generate AI response (NEW - Vercel AI SDK)
  // File: lib/ai/broker-ai-service.ts (new file)
  const aiResponse = await generateBrokerResponse({
    message: data.userMessage,
    persona: data.brokerPersona,
    leadData: data.processedLeadData
  })

  // STEP 5: Send to Chatwoot (EXISTING METHOD)
  // File: lib/integrations/chatwoot-client.ts
  const chatwoot = new ChatwootClient()

  if (data.messageType === 'greeting' && !data.skipGreeting) {
    // Use existing method with deduplication
    await chatwoot.sendInitialMessage(
      data.conversationId,
      data.processedLeadData
    )
  } else {
    // Regular message
    await chatwoot.sendMessage(
      data.conversationId,
      aiResponse
    )
  }

  // STEP 6: Check handoff (EXISTING FUNCTION)
  // File: lib/calculations/broker-persona.ts
  if (urgency.escalate) {
    await triggerHandoff(data.conversationId, urgency.escalateReason)
  }

  // STEP 7: Update metrics (EXISTING FUNCTION)
  // File: lib/ai/broker-assignment.ts
  await updateBrokerMetrics(
    data.conversationId,
    data.brokerId,
    1,  // message count
    urgency.escalate,
    urgency.escalateReason
  )

  // STEP 8: Release capacity (EXISTING FUNCTION)
  // File: lib/ai/broker-availability.ts
  await releaseBrokerCapacity(data.brokerId)
}
```

## Environment Variables Needed

```bash
# Existing (keep all)
OPENAI_API_KEY=sk-...
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=...
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=...
CHATWOOT_WEBSITE_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# New (add these)
REDIS_URL=redis://...
WORKER_CONCURRENCY=3

# Migration (temporary)
ENABLE_BULLMQ_BROKER=false  # Start false, enable gradually
BULLMQ_TRAFFIC_PERCENTAGE=0  # Start 0%, increase to 100%
```

## Migration Strategy

### Week 1: Parallel Running (0% BullMQ traffic)
- BullMQ processes jobs but responses discarded
- n8n continues handling all traffic
- Compare outputs for validation

### Week 2: Gradual Shift (10% BullMQ traffic)
- 10% of conversations use BullMQ
- 90% still use n8n
- Monitor for issues

### Week 3: Majority Shift (50% → 100%)
- Gradually increase to 100%
- Keep n8n as emergency backup
- Monitor metrics closely

### Week 4: Cleanup (Optional)
- If stable, decommission n8n
- Remove parallel running code
- Update documentation
```

### Step 0.3: Environment Setup Checklist

**Create**: `docs/ENVIRONMENT_SETUP.md`

```markdown
# Environment Setup for BullMQ Migration

## Required Services

### 1. Redis (New)

**Option A: Railway Redis** (Recommended)
```bash
# In Railway dashboard:
1. Click "New" → "Database" → "Add Redis"
2. Wait for provisioning (~2 minutes)
3. Copy REDIS_URL from Variables tab
4. Add to .env.local
```

**Option B: Upstash** (Serverless)
```bash
# At upstash.com:
1. Create account
2. Create Redis database
3. Copy REDIS_URL
4. Add to .env.local
```

**Option C: Local** (Development only)
```bash
docker run -d -p 6379:6379 redis
REDIS_URL=redis://localhost:6379
```

### 2. Update .env.local

```bash
# ===== EXISTING (Verify these exist) =====
OPENAI_API_KEY=sk-proj-...
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=...
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=...
CHATWOOT_WEBSITE_TOKEN=...
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
N8N_AI_BROKER_WEBHOOK_URL=https://...
ENABLE_AI_BROKER=true

# ===== NEW (Add these) =====
# Redis for BullMQ
REDIS_URL=redis://default:password@host:port

# BullMQ Configuration
WORKER_CONCURRENCY=3
QUEUE_RATE_LIMIT=10
ENABLE_BULLMQ_BROKER=false  # Start disabled
BULLMQ_TRAFFIC_PERCENTAGE=0  # Start at 0%

# Monitoring (optional)
QUEUE_DASHBOARD_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/...  # For alerts
```

### 3. Verify Database Access

```bash
# Test Supabase connection
npm run test-supabase-connection

# Should return:
# ✅ Connected to Supabase
# ✅ ai_brokers table accessible
# ✅ broker_conversations table accessible
```

### 4. Verify Chatwoot Access

```bash
# Test Chatwoot API
npm run test-chatwoot-connection

# Should return:
# ✅ Connected to Chatwoot
# ✅ Account ID: 1
# ✅ Inbox ID: ...
# ✅ Can create contacts
# ✅ Can create conversations
```

### 5. Install New Dependencies

```bash
npm install bullmq ioredis ai @ai-sdk/openai
npm install --save-dev @types/ioredis

# Verify installation
npm list bullmq ioredis ai @ai-sdk/openai

# Should show:
# ├── bullmq@5.x.x
# ├── ioredis@5.x.x
# ├── ai@4.x.x
# └── @ai-sdk/openai@1.x.x
```

### 6. Test Redis Connection

**Create test script**: `scripts/test-redis.js`

```javascript
const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis(process.env.REDIS_URL);

  try {
    // Test write
    await redis.set('test-key', 'test-value');
    console.log('✅ Redis write successful');

    // Test read
    const value = await redis.get('test-key');
    console.log('✅ Redis read successful:', value);

    // Clean up
    await redis.del('test-key');
    console.log('✅ Redis delete successful');

    process.exit(0);
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

testRedis();
```

```bash
node scripts/test-redis.js

# Should output:
# ✅ Redis write successful
# ✅ Redis read successful: test-value
# ✅ Redis delete successful
```

## Pre-Implementation Checklist

Before proceeding to Phase 1, verify:

- [ ] ✅ `docs/CURRENT_ARCHITECTURE.md` created and reviewed
- [ ] ✅ `docs/INTEGRATION_MAPPING.md` created and reviewed
- [ ] ✅ `docs/ENVIRONMENT_SETUP.md` created (this file)
- [ ] ✅ Redis provisioned and connection tested
- [ ] ✅ All environment variables added to `.env.local`
- [ ] ✅ Dependencies installed (`bullmq`, `ioredis`, `ai`, `@ai-sdk/openai`)
- [ ] ✅ Supabase connection verified
- [ ] ✅ Chatwoot connection verified
- [ ] ✅ Team aware of migration plan
- [ ] ✅ Rollback procedure documented
- [ ] ✅ n8n will remain active during migration

**If all checked**: Proceed to Phase 1
**If any unchecked**: Complete that step first
```

---

## Phase 1: BullMQ Foundation (Days 3-4)

### Goal: Add queue infrastructure alongside existing system

### Step 1.1: Create Redis Configuration

**Create**: `lib/queue/redis-config.ts`

```typescript
import { ConnectionOptions } from 'bullmq';

/**
 * Redis connection configuration for BullMQ
 * Supports Railway, Upstash, and local Redis
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
```

### Step 1.2: Create Queue with Existing Function Integration

**Create**: `lib/queue/broker-queue.ts`

```typescript
import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { BrokerPersona } from '@/lib/calculations/broker-persona';

/**
 * Job data structure
 * Integrates with existing NextNest types
 */
export interface BrokerConversationJob {
  // Identity
  conversationId: number;
  brokerId: string;
  brokerName: string;

  // Context (from existing system)
  brokerPersona: BrokerPersona;  // From existing broker-persona.ts
  processedLeadData: ProcessedLeadData;  // From existing chatwoot-client.ts

  // Message
  userMessage: string;
  messageType: 'greeting' | 'reply';

  // Flags (from existing deduplication)
  isConversationReopen: boolean;
  skipGreeting: boolean;

  // Timing (will be calculated by existing analyzeMessageUrgency function)
  responseDelay?: number;
}

/**
 * Create BullMQ queue instance
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
 * Add conversation to queue
 *
 * IMPORTANT: This function is called from:
 * - app/api/chatwoot-conversation/route.ts (new conversations)
 * - app/api/chatwoot-webhook/route.ts (incoming messages)
 */
export async function queueBrokerConversation(
  data: Omit<BrokerConversationJob, 'responseDelay'>
) {
  try {
    // Create unique job ID for deduplication
    const timestamp = Date.now();
    const jobId = `conv-${data.conversationId}-${timestamp}`;

    // Determine priority based on lead score
    const priority = data.processedLeadData.leadScore > 75 ? 1 : 5;

    console.log(`📋 Queueing job:`, {
      jobId,
      conversationId: data.conversationId,
      brokerName: data.brokerName,
      messageType: data.messageType,
      isReopen: data.isConversationReopen,
      skipGreeting: data.skipGreeting,
      priority,
    });

    const job = await brokerQueue.add(
      'process-conversation',
      data,
      {
        jobId,
        priority,
        // Slight delay for new conversations to allow Chatwoot to settle
        delay: data.messageType === 'greeting' ? 500 : 0,
      }
    );

    console.log(`✅ Job queued successfully: ${job.id}`);

    return job;
  } catch (error) {
    console.error(`❌ Failed to queue conversation ${data.conversationId}:`, error);
    throw error;
  }
}

/**
 * Get queue metrics for monitoring
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
```

### Step 1.3: Create Worker with Existing Function Integration

**Create**: `lib/queue/broker-worker.ts`

```typescript
import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis-config';
import { BrokerConversationJob } from './broker-queue';

// Import EXISTING functions (not recreating them)
import { analyzeMessageUrgency } from '@/lib/calculations/broker-persona';
import { markBrokerBusy, releaseBrokerCapacity } from '@/lib/ai/broker-availability';
import { updateBrokerMetrics } from '@/lib/ai/broker-assignment';
import { ChatwootClient } from '@/lib/integrations/chatwoot-client';

// Import NEW AI service (to be created in Phase 2)
import { generateBrokerResponse } from '@/lib/ai/broker-ai-service';

/**
 * Process broker conversation job
 *
 * This function integrates with ALL existing NextNest systems:
 * - Broker capacity management (broker-availability.ts)
 * - Response timing calculation (broker-persona.ts)
 * - Chatwoot client (chatwoot-client.ts)
 * - Metrics tracking (broker-assignment.ts)
 */
async function processConversationJob(job: Job<BrokerConversationJob>) {
  const { data } = job;
  const startTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Processing conversation ${data.conversationId}`);
  console.log(`   Broker: ${data.brokerName} (${data.brokerPersona.type})`);
  console.log(`   Message Type: ${data.messageType}`);
  console.log(`   Is Reopen: ${data.isConversationReopen}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // STEP 1: Mark broker as busy (EXISTING FUNCTION)
    // Location: lib/ai/broker-availability.ts
    console.log('📊 Step 1: Marking broker busy...');
    await markBrokerBusy(
      {
        id: data.brokerId,
        current_workload: null,
        active_conversations: null,
        max_concurrent_chats: null,
      },
      data.conversationId
    );
    console.log('✅ Broker marked as busy');

    // STEP 2: Calculate response delay (EXISTING FUNCTION)
    // Location: lib/calculations/broker-persona.ts lines 154-189
    console.log('⏱️ Step 2: Calculating response timing...');
    const urgencyAnalysis = analyzeMessageUrgency(
      data.userMessage,
      data.brokerPersona
    );
    console.log('✅ Response timing calculated:', {
      responseTime: `${urgencyAnalysis.responseTime}ms`,
      isUrgent: urgencyAnalysis.isUrgent,
      escalate: urgencyAnalysis.escalate,
    });

    // STEP 3: Wait for natural timing (human-like delay)
    console.log(`⏳ Step 3: Waiting ${urgencyAnalysis.responseTime}ms for natural timing...`);
    await new Promise(resolve => setTimeout(resolve, urgencyAnalysis.responseTime));
    console.log('✅ Wait complete');

    // STEP 4: Generate AI response (NEW - Vercel AI SDK)
    // Location: lib/ai/broker-ai-service.ts (to be created in Phase 2)
    console.log('🧠 Step 4: Generating AI response...');
    const aiResponse = await generateBrokerResponse({
      message: data.userMessage,
      persona: data.brokerPersona,
      leadData: data.processedLeadData,
      conversationId: data.conversationId,
    });
    console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

    // STEP 5: Send to Chatwoot (EXISTING METHODS)
    // Location: lib/integrations/chatwoot-client.ts
    console.log('📤 Step 5: Sending to Chatwoot...');
    const chatwootClient = new ChatwootClient();

    if (data.messageType === 'greeting' && !data.skipGreeting) {
      // Use existing sendInitialMessage which has deduplication
      // Location: chatwoot-client.ts lines 415-494
      console.log('   Using sendInitialMessage (has deduplication built-in)');
      await chatwootClient.sendInitialMessage(
        data.conversationId,
        data.processedLeadData
      );
    } else {
      // Regular message (need to add this method - see Step 3.1)
      console.log('   Sending regular message');
      await chatwootClient.sendMessage(data.conversationId, aiResponse);
    }
    console.log('✅ Message sent to Chatwoot');

    // STEP 6: Check for handoff (EXISTING LOGIC)
    // Location: broker-persona.ts line 164-167
    if (urgencyAnalysis.escalate) {
      console.log('🚨 Step 6: Escalation needed, triggering handoff...');
      await triggerHandoff(
        data.conversationId,
        'Customer requested human agent',
        chatwootClient
      );
      console.log('✅ Handoff triggered');
    }

    // STEP 7: Update metrics (EXISTING FUNCTION)
    // Location: lib/ai/broker-assignment.ts lines 167-201
    console.log('📈 Step 7: Updating broker metrics...');
    await updateBrokerMetrics(
      data.conversationId,
      data.brokerId,
      1, // message count
      urgencyAnalysis.escalate,
      urgencyAnalysis.escalate ? 'User requested human agent' : undefined
    );
    console.log('✅ Metrics updated');

    // STEP 8: Release broker capacity (EXISTING FUNCTION)
    // Location: lib/ai/broker-availability.ts
    console.log('🔓 Step 8: Releasing broker capacity...');
    await releaseBrokerCapacity(data.brokerId);
    console.log('✅ Broker capacity released');

    const duration = Date.now() - startTime;
    console.log(`\n✅ Job completed successfully in ${duration}ms\n`);

    return {
      status: 'completed',
      conversationId: data.conversationId,
      duration,
      escalated: urgencyAnalysis.escalate,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Job failed after ${duration}ms:`, error);

    // Try to release broker capacity even on error
    try {
      await releaseBrokerCapacity(data.brokerId);
      console.log('✅ Broker capacity released after error');
    } catch (releaseError) {
      console.error('❌ Failed to release broker capacity:', releaseError);
    }

    // On final failure, escalate to human
    if (job.attemptsMade >= 2) {
      console.error('❌ All retries exhausted, escalating to human');
      try {
        const chatwootClient = new ChatwootClient();
        await chatwootClient.sendMessage(
          data.conversationId,
          "I'm experiencing technical difficulties. Let me connect you with a human specialist right away."
        );
        await triggerHandoff(
          data.conversationId,
          `AI system failure: ${error.message}`,
          chatwootClient
        );
      } catch (escalationError) {
        console.error('❌ Failed to escalate:', escalationError);
      }
    }

    throw error; // Re-throw for BullMQ retry logic
  }
}

/**
 * Trigger human handoff
 * Integrates with existing Chatwoot system
 */
async function triggerHandoff(
  conversationId: number,
  reason: string,
  chatwootClient: ChatwootClient
): Promise<void> {
  console.log(`👤 Triggering handoff for conversation ${conversationId}: ${reason}`);

  try {
    // Update conversation attributes
    await chatwootClient.updateConversationCustomAttributes(conversationId, {
      broker_status: 'handoff_requested',
      handoff_reason: reason,
      handoff_at: new Date().toISOString(),
    });

    // Send activity message (with deduplication)
    await chatwootClient.createActivityMessage(
      conversationId,
      `🔔 Human specialist requested: ${reason}`,
      true // Check for duplicates
    );

    console.log('✅ Handoff completed');
  } catch (error) {
    console.error('❌ Handoff failed:', error);
    throw error;
  }
}

/**
 * Create BullMQ worker
 */
export const brokerWorker = new Worker<BrokerConversationJob>(
  'broker-conversations',
  processConversationJob,
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3'),
    limiter: {
      max: parseInt(process.env.QUEUE_RATE_LIMIT || '10'),
      duration: 1000,
    },
  }
);

// Worker event handlers
brokerWorker.on('completed', (job) => {
  console.log(`✅ Worker completed job ${job.id}`);
});

brokerWorker.on('failed', (job, err) => {
  console.error(`❌ Worker failed job ${job?.id}:`, err.message);
});

brokerWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n⚠️ ${signal} received, gracefully shutting down worker...`);
  await brokerWorker.close();
  console.log('✅ Worker closed successfully');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log('🚀 BullMQ worker initialized and ready to process jobs');
```

### Step 1.4: Create Worker Manager for Next.js

**Create**: `lib/queue/worker-manager.ts`

```typescript
/**
 * Worker Manager for Next.js
 *
 * Ensures BullMQ worker runs in server environment only
 * Handles Railway-specific requirements (health checks, restarts)
 */

let workerInitialized = false;
let worker: any = null;

export async function initializeWorker() {
  // Skip on client-side
  if (typeof window !== 'undefined') {
    console.log('⚠️ Worker initialization skipped (client-side)');
    return null;
  }

  // Skip if already initialized
  if (workerInitialized && worker) {
    console.log('✅ Worker already initialized');
    return worker;
  }

  try {
    console.log('🚀 Initializing BullMQ worker...');

    // Dynamically import worker (lazy load)
    const { brokerWorker } = await import('./broker-worker');

    worker = brokerWorker;
    workerInitialized = true;

    console.log('✅ BullMQ worker initialized successfully');
    console.log(`   Concurrency: ${process.env.WORKER_CONCURRENCY || 3}`);
    console.log(`   Rate limit: ${process.env.QUEUE_RATE_LIMIT || 10}/second`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);

    return worker;
  } catch (error) {
    console.error('❌ Failed to initialize worker:', error);
    workerInitialized = false;
    worker = null;
    throw error;
  }
}

/**
 * Get worker status for health checks
 */
export function getWorkerStatus() {
  return {
    initialized: workerInitialized,
    running: worker !== null,
    isPaused: worker?.isPaused() || false,
    isRunning: worker?.isRunning() || false,
  };
}

/**
 * Close worker (for testing or shutdown)
 */
export async function closeWorker() {
  if (worker) {
    console.log('⏹️ Closing worker...');
    await worker.close();
    workerInitialized = false;
    worker = null;
    console.log('✅ Worker closed');
  }
}

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  initializeWorker().catch(err => {
    console.error('❌ Failed to auto-initialize worker in production:', err);
  });
}
```

### Step 1.5: Create Health Check Endpoint

**Create or Update**: `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { initializeWorker, getWorkerStatus } from '@/lib/queue/worker-manager';
import { getQueueMetrics } from '@/lib/queue/broker-queue';
import { testRedisConnection } from '@/lib/queue/redis-config';

// Initialize worker when API starts
initializeWorker().catch(console.error);

/**
 * Health check endpoint
 * Railway uses this to verify service is healthy
 */
export async function GET() {
  try {
    // Check Redis
    const redisHealthy = await testRedisConnection();

    // Check worker status
    const workerStatus = getWorkerStatus();

    // Check queue metrics
    const queueMetrics = await getQueueMetrics();

    // Overall health
    const healthy = redisHealthy && workerStatus.initialized;

    return NextResponse.json({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: {
        connected: redisHealthy,
      },
      worker: workerStatus,
      queue: queueMetrics,
    }, {
      status: healthy ? 200 : 503
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, {
      status: 503
    });
  }
}
```

### Step 1.6: Test Queue System

**Create test script**: `scripts/test-queue.ts`

```typescript
/**
 * Test script for BullMQ integration
 * Run with: npx tsx scripts/test-queue.ts
 */

import { queueBrokerConversation, getQueueMetrics } from '../lib/queue/broker-queue';
import { initializeWorker } from '../lib/queue/worker-manager';

async function testQueue() {
  console.log('\n📋 Testing BullMQ Queue System\n');

  try {
    // Initialize worker
    console.log('1️⃣ Initializing worker...');
    await initializeWorker();
    console.log('✅ Worker initialized\n');

    // Create test job
    console.log('2️⃣ Creating test job...');
    const job = await queueBrokerConversation({
      conversationId: 99999,
      brokerId: 'test-broker',
      brokerName: 'Test Broker',
      brokerPersona: {
        type: 'balanced',
        name: 'Test Broker',
        title: 'Test Specialist',
        approach: 'test',
        urgencyLevel: 'medium',
        avatar: '/test.svg',
        responseStyle: {
          tone: 'professional',
          pacing: 'moderate',
          focus: 'testing',
        },
      },
      processedLeadData: {
        name: 'Test User',
        email: 'test@test.com',
        phone: '+6512345678',
        loanType: 'home_loan',
        actualIncomes: [5000],
        actualAges: [30],
        employmentType: 'employed',
        leadScore: 65,
        sessionId: 'test-session',
        brokerPersona: {} as any,
      },
      userMessage: 'Test message',
      messageType: 'greeting',
      isConversationReopen: false,
      skipGreeting: false,
    });
    console.log('✅ Job created:', job.id, '\n');

    // Wait for processing
    console.log('3️⃣ Waiting for job to process...');
    await job.waitUntilFinished(brokerQueueEvents, 30000);
    console.log('✅ Job processed\n');

    // Check metrics
    console.log('4️⃣ Checking queue metrics...');
    const metrics = await getQueueMetrics();
    console.log('✅ Queue metrics:', metrics, '\n');

    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testQueue();
```

**Add to package.json**:
```json
{
  "scripts": {
    "test-queue": "npx tsx scripts/test-queue.ts"
  }
}
```

### Phase 1 Completion Checklist:

- [ ] ✅ `lib/queue/redis-config.ts` created
- [ ] ✅ `lib/queue/broker-queue.ts` created
- [ ] ✅ `lib/queue/broker-worker.ts` created
- [ ] ✅ `lib/queue/worker-manager.ts` created
- [ ] ✅ `app/api/health/route.ts` updated
- [ ] ✅ `scripts/test-queue.ts` created
- [ ] ✅ Queue test passes: `npm run test-queue`
- [ ] ✅ Health check passes: `curl http://localhost:3000/api/health`
- [ ] ✅ No errors in console
- [ ] ✅ Redis metrics visible

**Deliverable**: Persistent queue working, not yet connected to production

---

## Phase 2: AI Service Integration (Days 5-6)

### Goal: Create AI service using Vercel AI SDK that integrates with existing functions

### Step 2.1: Install Vercel AI SDK

```bash
npm install ai @ai-sdk/openai
```

### Step 2.2: Create AI Broker Service with Existing Persona Integration

**Create**: `lib/ai/broker-ai-service.ts`

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';

/**
 * Generate AI broker response using Vercel AI SDK
 *
 * This service integrates with existing broker persona system
 * Location of personas: lib/calculations/broker-persona.ts
 */

interface GenerateBrokerResponseInput {
  message: string;
  persona: BrokerPersona;
  leadData: ProcessedLeadData;
  conversationId: number;
}

/**
 * Generate broker response using AI
 *
 * Uses existing persona definitions from broker-persona.ts
 * Maintains consistency with your 5 broker types:
 * - Michelle Chen (aggressive, investment)
 * - Jasmine Lee (aggressive, luxury)
 * - Rachel Tan (balanced, millennial)
 * - Sarah Wong (balanced, family)
 * - Grace Lim (conservative, first-time)
 */
export async function generateBrokerResponse(
  input: GenerateBrokerResponseInput
): Promise<string> {
  const { message, persona, leadData, conversationId } = input;

  console.log(`🧠 Generating ${persona.type} response for ${persona.name}`);

  try {
    // Create system prompt based on existing persona
    const systemPrompt = createSystemPromptFromPersona(persona, leadData);

    // Generate response with Vercel AI SDK
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxTokens: 500,
      // Add conversation tracking for future context management
      headers: {
        'X-Conversation-ID': conversationId.toString(),
      },
    });

    console.log(`✅ Generated response (${text.length} chars)`);

    return text;

  } catch (error) {
    console.error(`❌ AI generation failed for conversation ${conversationId}:`, error);

    // Fallback to template-based response
    console.log('⚠️ Using fallback template response');
    return getFallbackResponse(persona, message);
  }
}

/**
 * Create system prompt from existing broker persona
 *
 * Uses data from lib/calculations/broker-persona.ts:
 * - persona.responseStyle.tone
 * - persona.responseStyle.pacing
 * - persona.responseStyle.focus
 * - persona.approach
 * - persona.urgencyLevel
 */
function createSystemPromptFromPersona(
  persona: BrokerPersona,
  leadData: ProcessedLeadData
): string {
  // Base prompt for all brokers
  const basePrompt = `You are ${persona.name}, a ${persona.title} at NextNest Mortgage Advisory in Singapore.

## Your Personality & Style:
- Type: ${persona.type}
- Tone: ${persona.responseStyle.tone}
- Pacing: ${persona.responseStyle.pacing}
- Focus: ${persona.responseStyle.focus}
- Approach: ${persona.approach}
- Urgency Level: ${persona.urgencyLevel}

## Customer Context:
- Name: ${leadData.name}
- Lead Score: ${leadData.leadScore}/100
- Loan Type: ${leadData.loanType?.replace(/_/g, ' ') || 'not specified'}
- Property: ${leadData.propertyCategory || 'not specified'}
- Monthly Income: S$${leadData.actualIncomes?.[0]?.toLocaleString() || 'not specified'}
- Employment: ${leadData.employmentType || 'not specified'}

## Guidelines:
1. Stay in character - respond exactly as ${persona.name} would
2. Focus on Singapore mortgage market (HDB, private property, investment)
3. Be specific with numbers when possible, use ranges (e.g., "1.5%-2.5%")
4. Keep responses concise (2-3 short paragraphs)
5. End with a specific question to continue conversation
6. Never make up bank names or specific rates
7. If asked complex legal/compliance questions, acknowledge and offer human specialist

## Important Rules:
- Never provide regulated financial advice
- If customer seems frustrated → acknowledge and offer human connection
- Stay warm and helpful, matching ${persona.type} persona tone
- Use Singapore context (CPF, HDB, private property, TDSR, MSR)`;

  // Add persona-specific additions from existing persona types
  switch (persona.type) {
    case 'aggressive':
      return basePrompt + `\n\n## ${persona.type.toUpperCase()} Style Additions:
- Emphasize urgency: "limited time", "exclusive rates", "secure now"
- Focus on ROI and investment gains
- Use data and numbers confidently
- Create sense of opportunity
- Be action-oriented and decisive
- Examples from your persona: "${persona.responseStyle.tone}"`;

    case 'conservative':
      return basePrompt + `\n\n## ${persona.type.toUpperCase()} Style Additions:
- Be patient and educational: "let's take this step by step"
- Break down complex concepts
- Use reassuring language: "no pressure", "at your pace"
- Prioritize understanding over speed
- Be motherly/fatherly in tone
- Examples from your persona: "${persona.responseStyle.tone}"`;

    case 'balanced':
    default:
      return basePrompt + `\n\n## ${persona.type.toUpperCase()} Style Additions:
- Be professional yet approachable
- Balance speed with thoroughness
- Provide clear explanations with actionable steps
- Modern and tech-savvy communication
- Examples from your persona: "${persona.responseStyle.tone}"`;
  }
}

/**
 * Fallback response when AI fails
 * Uses existing persona greeting templates as reference
 * Location: lib/calculations/broker-persona.ts lines 129-149
 */
function getFallbackResponse(persona: BrokerPersona, message: string): string {
  const fallbacks = {
    aggressive: `Thank you for reaching out! I'm experiencing a brief technical issue, but I'm here to help you maximize your mortgage opportunity. Can you tell me more about your property goals? I'll make sure we secure the best rates for you.`,

    balanced: `Thanks for your message! I'm having a small technical hiccup, but I'm still here to assist you. Could you share more details about what you're looking for? I want to make sure I provide you with the most relevant information.`,

    conservative: `Hello! I appreciate your patience. I'm experiencing a minor technical issue, but I'm absolutely here to help you. Please don't worry - we'll take this step by step. What questions can I answer for you?`,
  };

  return fallbacks[persona.type] || fallbacks.balanced;
}

/**
 * Streaming version for future real-time chat UI
 * (Optional - not used in current Chatwoot integration)
 */
export async function streamBrokerResponse(
  input: GenerateBrokerResponseInput
) {
  const { openai } = await import('@ai-sdk/openai');
  const { streamText } = await import('ai');

  const systemPrompt = createSystemPromptFromPersona(input.persona, input.leadData);

  return streamText({
    model: openai('gpt-4-turbo'),
    system: systemPrompt,
    prompt: input.message,
    temperature: 0.7,
    maxTokens: 500,
  });
}
```

### Step 2.3: Add sendMessage Method to Chatwoot Client

**Update**: `lib/integrations/chatwoot-client.ts`

Add this method to the `ChatwootClient` class (around line 790, before the closing bracket):

```typescript
/**
 * Send a simple text message to conversation
 * Used by BullMQ worker for AI responses
 */
async sendMessage(conversationId: number, content: string): Promise<void> {
  try {
    console.log(`📤 Sending message to conversation ${conversationId}`);

    const response = await fetch(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          message_type: 1, // Outgoing message
          private: false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.statusText} - ${errorText}`);
    }

    const sentMessage = await response.json();
    console.log(`✅ Message sent successfully`);

    // Track for echo detection (existing system)
    const messageId = sentMessage.id?.toString() || `fallback-${conversationId}-${Date.now()}`;
    try {
      trackBotMessage(conversationId, content, messageId);
    } catch (trackingError) {
      console.error('⚠️ Failed to track bot message (non-critical):', trackingError);
    }

  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}
```

### Step 2.4: Test AI Service

**Create test script**: `scripts/test-ai-service.ts`

```typescript
/**
 * Test Vercel AI SDK integration
 * Run with: npx tsx scripts/test-ai-service.ts
 */

import { generateBrokerResponse } from '../lib/ai/broker-ai-service';
import { BrokerPersona } from '../lib/calculations/broker-persona';

async function testAIService() {
  console.log('\n🧠 Testing Vercel AI SDK Integration\n');

  // Test persona (Sarah Wong - balanced)
  const testPersona: BrokerPersona = {
    type: 'balanced',
    name: 'Sarah Wong',
    title: 'Family Mortgage Consultant',
    approach: 'educational_consultative',
    urgencyLevel: 'medium',
    avatar: '/images/brokers/sarah-wong.svg',
    responseStyle: {
      tone: 'warm, family-focused, trustworthy',
      pacing: 'moderate - educate then guide',
      focus: 'family needs, stable solutions',
    },
  };

  const testLeadData = {
    name: 'John Tan',
    email: 'john@test.com',
    phone: '+6591234567',
    loanType: 'home_loan',
    actualIncomes: [6000],
    actualAges: [35],
    employmentType: 'employed',
    leadScore: 65,
    sessionId: 'test-session',
    brokerPersona: testPersona,
  };

  try {
    console.log('1️⃣ Testing AI response generation...');
    const response = await generateBrokerResponse({
      message: 'I want to buy a 4-room HDB flat. What mortgage rates can I get?',
      persona: testPersona,
      leadData: testLeadData,
      conversationId: 12345,
    });

    console.log('\n✅ AI Response Generated:\n');
    console.log('─'.repeat(60));
    console.log(response);
    console.log('─'.repeat(60));

    console.log('\n2️⃣ Verifying response characteristics...');
    console.log(`   Length: ${response.length} characters`);
    console.log(`   Contains broker name: ${response.includes('Sarah') ? '✅' : '❌'}`);
    console.log(`   Professional tone: ${response.length > 50 ? '✅' : '❌'}`);
    console.log(`   Ends with question: ${response.includes('?') ? '✅' : '❌'}`);

    console.log('\n🎉 AI service test passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ AI service test failed:', error);
    process.exit(1);
  }
}

testAIService();
```

**Add to package.json**:
```json
{
  "scripts": {
    "test-ai-service": "npx tsx scripts/test-ai-service.ts"
  }
}
```

### Phase 2 Completion Checklist:

- [ ] ✅ Vercel AI SDK installed
- [ ] ✅ `lib/ai/broker-ai-service.ts` created
- [ ] ✅ Integrates with existing broker persona system
- [ ] ✅ `sendMessage()` method added to ChatwootClient
- [ ] ✅ `scripts/test-ai-service.ts` created
- [ ] ✅ AI test passes: `npm run test-ai-service`
- [ ] ✅ Responses match broker personality
- [ ] ✅ Fallback responses work
- [ ] ✅ No errors in console

**Deliverable**: AI service generating persona-specific responses

---

## Phase 3: Connect to Production (Days 7-8)

### Goal: Connect BullMQ to existing webhook and conversation creation

### Step 3.1: Update Conversation Creation API

**Update**: `app/api/chatwoot-conversation/route.ts`

Find the section after conversation is created (around line 320). Add BullMQ queueing:

```typescript
// Around line 320, after conversation is created

// ADD THIS IMPORT AT TOP OF FILE:
import { queueBrokerConversation } from '@/lib/queue/broker-queue';

// AFTER conversation creation (around line 320), ADD:
console.log('✅ Conversation created:', conversation.id);

// NEW: Check if BullMQ is enabled
const useBullMQ = process.env.ENABLE_BULLMQ_BROKER === 'true';

if (useBullMQ) {
  console.log('📋 Queueing broker assignment via BullMQ...');

  // Queue the conversation (respects existing deduplication flags)
  await queueBrokerConversation({
    conversationId: conversation.id,
    brokerId: 'pending', // Will be assigned by worker
    brokerName: processedLeadData.brokerPersona.name,
    brokerPersona: processedLeadData.brokerPersona,
    processedLeadData,
    userMessage: `Initial greeting for ${processedLeadData.name}`,
    messageType: 'greeting',
    isConversationReopen: dedupeResult.isReopen || false,
    skipGreeting: dedupeResult.isReopen && dedupeResult.hasRecentActivity,
  });

  console.log('✅ Conversation queued in BullMQ');
} else {
  // KEEP EXISTING LOGIC (broker engagement manager)
  console.log('⚠️ Using existing broker engagement manager');
  const result = await brokerEngagementManager.handleNewConversation({
    conversationId: conversation.id,
    leadScore: processedLeadData.leadScore,
    loanType: processedLeadData.loanType,
    propertyCategory: processedLeadData.propertyCategory || '',
    monthlyIncome: processedLeadData.actualIncomes[0] || 0,
    timeline: 'immediate',
    processedLeadData,
    sessionId: processedLeadData.sessionId,
  });
}

// Rest of existing code continues...
```

### Step 3.2: Update Webhook Handler

**Update**: `app/api/chatwoot-webhook/route.ts`

Add BullMQ queueing for incoming messages (around line 130, after n8n forwarding):

```typescript
// ADD THIS IMPORT AT TOP OF FILE:
import { queueBrokerConversation } from '@/lib/queue/broker-queue';
import { getBrokerForConversation } from '@/lib/ai/broker-assignment';

// Around line 130, AFTER n8n forwarding section, ADD:

// NEW: BullMQ queueing (parallel with n8n during migration)
const useBullMQ = process.env.ENABLE_BULLMQ_BROKER === 'true';
const trafficPercentage = parseInt(process.env.BULLMQ_TRAFFIC_PERCENTAGE || '0');

if (useBullMQ && Math.random() * 100 < trafficPercentage) {
  console.log(`📋 Queueing to BullMQ (${trafficPercentage}% traffic)`);

  try {
    // Get assigned broker
    const broker = await getBrokerForConversation(conversationId);

    if (broker) {
      await queueBrokerConversation({
        conversationId,
        brokerId: broker.id,
        brokerName: broker.name,
        brokerPersona: {
          name: broker.name,
          type: broker.personality_type as any,
          title: broker.title || '',
          approach: broker.approach || '',
          urgencyLevel: 'medium',
          avatar: broker.avatar || '',
          responseStyle: {
            tone: broker.tone || '',
            pacing: broker.pacing || '',
            focus: broker.focus || '',
          },
        },
        processedLeadData: {} as any, // Fetch from conversation if needed
        userMessage: messageContent,
        messageType: 'reply',
        isConversationReopen: false,
        skipGreeting: true,
      });

      console.log('✅ Message queued in BullMQ');
    }
  } catch (error) {
    console.error('❌ Failed to queue to BullMQ:', error);
    // Continue with n8n as fallback
  }
}

// KEEP EXISTING n8n forwarding logic
// This allows parallel running during migration
```

### Step 3.3: Create Gradual Migration Controls

**Create**: `lib/utils/migration-control.ts`

```typescript
/**
 * Migration control utilities
 * Manages gradual rollout from n8n to BullMQ
 */

export interface MigrationStatus {
  bullmqEnabled: boolean;
  trafficPercentage: number;
  n8nEnabled: boolean;
  parallelMode: boolean;
}

/**
 * Get current migration status
 */
export function getMigrationStatus(): MigrationStatus {
  const bullmqEnabled = process.env.ENABLE_BULLMQ_BROKER === 'true';
  const trafficPercentage = parseInt(process.env.BULLMQ_TRAFFIC_PERCENTAGE || '0');
  const n8nEnabled = process.env.ENABLE_AI_BROKER === 'true';

  return {
    bullmqEnabled,
    trafficPercentage,
    n8nEnabled,
    parallelMode: bullmqEnabled && n8nEnabled,
  };
}

/**
 * Determine if this request should use BullMQ
 * Based on traffic percentage
 */
export function shouldUseBullMQ(leadScore?: number): boolean {
  const status = getMigrationStatus();

  if (!status.bullmqEnabled) {
    return false;
  }

  // 100% cutover
  if (status.trafficPercentage >= 100) {
    return true;
  }

  // 0% - no traffic
  if (status.trafficPercentage <= 0) {
    return false;
  }

  // Gradual rollout
  // Optional: Prioritize high-value leads for BullMQ
  if (leadScore && leadScore > 75) {
    // Send premium leads to BullMQ first
    return Math.random() * 100 < Math.min(status.trafficPercentage * 1.5, 100);
  }

  return Math.random() * 100 < status.trafficPercentage;
}

/**
 * Log migration decision
 */
export function logMigrationDecision(
  conversationId: number,
  usedBullMQ: boolean,
  reason: string
) {
  const status = getMigrationStatus();

  console.log(`🔀 Migration decision for conversation ${conversationId}:`);
  console.log(`   Used BullMQ: ${usedBullMQ ? '✅' : '❌'}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Status: BullMQ ${status.trafficPercentage}%, n8n ${status.n8nEnabled ? 'ON' : 'OFF'}`);
}
```

### Step 3.4: Create Migration Dashboard Endpoint

**Create**: `app/api/admin/migration-status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getMigrationStatus } from '@/lib/utils/migration-control';
import { getQueueMetrics } from '@/lib/queue/broker-queue';
import { getWorkerStatus } from '@/lib/queue/worker-manager';

/**
 * Admin endpoint to check migration status
 * Access at: /api/admin/migration-status
 */
export async function GET() {
  try {
    const migration = getMigrationStatus();
    const queue = await getQueueMetrics();
    const worker = getWorkerStatus();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      migration: {
        ...migration,
        description: getMigrationDescription(migration),
      },
      queue,
      worker,
      recommendations: getMigrationRecommendations(migration, queue),
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
    }, {
      status: 500
    });
  }
}

function getMigrationDescription(status: any): string {
  if (!status.bullmqEnabled) {
    return 'BullMQ not enabled. All traffic using n8n.';
  }

  if (status.trafficPercentage === 0) {
    return 'BullMQ enabled but no traffic routed. Safe testing mode.';
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

function getMigrationRecommendations(migration: any, queue: any): string[] {
  const recommendations = [];

  if (!migration.bullmqEnabled) {
    recommendations.push('Set ENABLE_BULLMQ_BROKER=true to begin migration');
  }

  if (migration.bullmqEnabled && migration.trafficPercentage === 0) {
    recommendations.push('Set BULLMQ_TRAFFIC_PERCENTAGE=10 to start with 10% traffic');
  }

  if (queue && queue.failed > 10) {
    recommendations.push('⚠️ High failure rate - investigate before increasing traffic');
  }

  if (queue && queue.waiting > 20) {
    recommendations.push('⚠️ Queue backing up - consider increasing WORKER_CONCURRENCY');
  }

  if (migration.trafficPercentage >= 50 && queue && queue.failed === 0) {
    recommendations.push('✅ System stable - safe to increase to 100%');
  }

  if (migration.trafficPercentage === 100 && migration.n8nEnabled) {
    recommendations.push('Consider disabling n8n (ENABLE_AI_BROKER=false) after 1 week stability');
  }

  return recommendations;
}
```

### Phase 3 Completion Checklist:

- [ ] ✅ Conversation creation API updated
- [ ] ✅ Webhook handler updated
- [ ] ✅ Migration control utilities created
- [ ] ✅ Migration dashboard endpoint created
- [ ] ✅ Environment variables set (ENABLE_BULLMQ_BROKER=false initially)
- [ ] ✅ Test with 0% traffic (safe mode)
- [ ] ✅ Verify parallel running works
- [ ] ✅ No existing functionality broken

**Deliverable**: BullMQ integrated but disabled (safe to deploy)

---

## Phase 4: Gradual Migration (Days 9-12)

### Goal: Safely migrate traffic from n8n to BullMQ

### Migration Timeline

#### Week 1: Validation (0% BullMQ traffic)

**Environment Settings**:
```bash
ENABLE_BULLMQ_BROKER=true
BULLMQ_TRAFFIC_PERCENTAGE=0
ENABLE_AI_BROKER=true  # n8n still active
```

**What Happens**:
- BullMQ processes jobs but responses are NOT sent to customers
- n8n continues handling all customer traffic
- Compare BullMQ outputs with n8n outputs for validation

**Actions**:
1. Deploy to production
2. Monitor `/api/admin/migration-status`
3. Check queue metrics every hour
4. Compare response quality
5. Fix any issues found

**Success Criteria**:
- [ ] Zero errors in BullMQ processing
- [ ] Queue stays near zero (no backups)
- [ ] Worker processes jobs successfully
- [ ] Response quality matches n8n

#### Week 2: Gradual Rollout (10% → 50%)

**Day 1-2: 10% Traffic**
```bash
ENABLE_BULLMQ_BROKER=true
BULLMQ_TRAFFIC_PERCENTAGE=10
ENABLE_AI_BROKER=true  # n8n handles remaining 90%
```

**Actions**:
- Monitor for 48 hours
- Check customer feedback
- Verify no duplicate messages
- Monitor queue health

**Success Criteria**:
- [ ] No customer complaints
- [ ] Failed jobs < 1%
- [ ] No duplicate messages
- [ ] Response timing 2-6 seconds

**Day 3-4: 25% Traffic**
```bash
BULLMQ_TRAFFIC_PERCENTAGE=25
```

**Day 5-7: 50% Traffic**
```bash
BULLMQ_TRAFFIC_PERCENTAGE=50
```

#### Week 3: Majority Cutover (75% → 100%)

**Day 1-2: 75% Traffic**
```bash
BULLMQ_TRAFFIC_PERCENTAGE=75
```

**Day 3-5: 90% Traffic**
```bash
BULLMQ_TRAFFIC_PERCENTAGE=90
```

**Day 6-7: 100% Traffic**
```bash
BULLMQ_TRAFFIC_PERCENTAGE=100
ENABLE_AI_BROKER=true  # Keep n8n as emergency backup
```

**Success Criteria**:
- [ ] All metrics stable for 48 hours
- [ ] Customer satisfaction maintained
- [ ] No conversation loss
- [ ] Broker capacity tracking accurate

#### Week 4: Cleanup (Optional)

**After 7 days of 100% stability**:
```bash
BULLMQ_TRAFFIC_PERCENTAGE=100
ENABLE_AI_BROKER=false  # Disable n8n
```

**Actions**:
- Remove n8n webhook forwarding code
- Update documentation
- Archive n8n workflows
- Celebrate! 🎉

### Monitoring During Migration

**Create monitoring script**: `scripts/monitor-migration.ts`

```typescript
/**
 * Migration monitoring script
 * Run with: npx tsx scripts/monitor-migration.ts
 */

import { getQueueMetrics } from '../lib/queue/broker-queue';
import { getMigrationStatus } from '../lib/utils/migration-control';

async function monitorMigration() {
  console.clear();
  console.log('📊 NextNest Migration Monitor');
  console.log('=' .repeat(60));
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  try {
    // Get status
    const migration = getMigrationStatus();
    const queue = await getQueueMetrics();

    // Migration status
    console.log('🔀 Migration Status:');
    console.log(`   BullMQ Enabled: ${migration.bullmqEnabled ? '✅' : '❌'}`);
    console.log(`   Traffic to BullMQ: ${migration.trafficPercentage}%`);
    console.log(`   n8n Active: ${migration.n8nEnabled ? '✅' : '❌'}`);
    console.log(`   Mode: ${migration.parallelMode ? 'Parallel' : 'Single System'}\n`);

    // Queue health
    console.log('📋 Queue Health:');
    console.log(`   Waiting: ${queue.waiting}`);
    console.log(`   Active: ${queue.active}`);
    console.log(`   Completed: ${queue.completed}`);
    console.log(`   Failed: ${queue.failed}`);
    console.log(`   Delayed: ${queue.delayed}\n`);

    // Health indicators
    console.log('🏥 Health Indicators:');
    const failureRate = queue.completed > 0
      ? (queue.failed / (queue.completed + queue.failed) * 100).toFixed(2)
      : 0;
    console.log(`   Failure Rate: ${failureRate}%`);
    console.log(`   Queue Backup: ${queue.waiting > 10 ? '⚠️ YES' : '✅ NO'}`);
    console.log(`   System Health: ${getHealthStatus(queue)}\n`);

    // Recommendations
    console.log('💡 Recommendations:');
    const recommendations = getRecommendations(migration, queue);
    recommendations.forEach(rec => console.log(`   ${rec}`));

    console.log('\n' + '='.repeat(60));
    console.log('Press Ctrl+C to stop monitoring\n');

  } catch (error) {
    console.error('❌ Monitoring error:', error);
  }

  // Refresh every 10 seconds
  setTimeout(monitorMigration, 10000);
}

function getHealthStatus(queue: any): string {
  if (queue.failed > 10) return '🔴 UNHEALTHY';
  if (queue.waiting > 20) return '🟡 DEGRADED';
  return '🟢 HEALTHY';
}

function getRecommendations(migration: any, queue: any): string[] {
  const recs = [];

  if (!migration.bullmqEnabled) {
    recs.push('Enable BullMQ to begin migration');
  } else if (migration.trafficPercentage === 0) {
    recs.push('Increase traffic to 10% to start validation');
  } else if (queue.failed === 0 && queue.waiting < 5) {
    recs.push(`✅ Stable - safe to increase traffic`);
  } else if (queue.failed > 5) {
    recs.push('⚠️ Investigate failures before increasing traffic');
  }

  if (migration.trafficPercentage === 100 && queue.failed === 0) {
    recs.push('🎉 Migration complete! Consider disabling n8n backup');
  }

  return recs;
}

monitorMigration();
```

**Add to package.json**:
```json
{
  "scripts": {
    "monitor-migration": "npx tsx scripts/monitor-migration.ts"
  }
}
```

### Rollback Procedure

If issues arise at any stage:

**Immediate Rollback**:
```bash
# 1. Set traffic to 0%
BULLMQ_TRAFFIC_PERCENTAGE=0

# 2. Ensure n8n is active
ENABLE_AI_BROKER=true

# 3. Restart Next.js
npm run build && npm start

# 4. Verify n8n handling all traffic
curl https://your-site.com/api/admin/migration-status
```

**Investigation**:
1. Check failed jobs: Visit Railway logs
2. Review queue metrics: `/api/admin/migration-status`
3. Compare with n8n behavior
4. Fix issues
5. Resume migration when ready

### Phase 4 Completion Checklist:

- [ ] ✅ Week 1 (0% traffic) completed successfully
- [ ] ✅ Week 2 (10% → 50%) completed successfully
- [ ] ✅ Week 3 (75% → 100%) completed successfully
- [ ] ✅ 7 days of 100% stability achieved
- [ ] ✅ Customer satisfaction maintained
- [ ] ✅ No conversation loss
- [ ] ✅ Broker capacity tracking accurate
- [ ] ✅ Queue health consistently green
- [ ] ✅ Failed jobs < 1%

**Deliverable**: Production traffic on BullMQ

---

## Phase 5: Monitoring & Optimization (Days 13-14)

### Goal: Production monitoring and cleanup

### Step 5.1: Install BullBoard Dashboard

```bash
npm install @bull-board/express @bull-board/api
```

**Create**: `app/api/admin/queue-dashboard/route.ts`

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { brokerQueue } from '@/lib/queue/broker-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queue-dashboard');

createBullBoard({
  queues: [new BullMQAdapter(brokerQueue)],
  serverAdapter,
});

export const GET = serverAdapter.registerPlugin();
```

Access dashboard at: `http://localhost:3000/api/admin/queue-dashboard`

### Step 5.2: Create Alert System

**Create**: `lib/monitoring/alerts.ts`

```typescript
/**
 * Alert system for production monitoring
 */

export async function sendAlert(alert: {
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: any;
}) {
  console.log(`🚨 ALERT [${alert.level.toUpperCase()}]: ${alert.title}`);
  console.log(`   ${alert.message}`);
  if (alert.data) {
    console.log('   Data:', JSON.stringify(alert.data, null, 2));
  }

  // Send to Slack (if configured)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*[${alert.level.toUpperCase()}]* ${alert.title}`,
          attachments: [{
            text: alert.message,
            color: alert.level === 'critical' ? 'danger' :
                   alert.level === 'warning' ? 'warning' : 'good',
          }],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Log to file for analysis
  // TODO: Implement log aggregation
}

/**
 * Check queue health and alert if needed
 */
export async function checkQueueHealth() {
  const { getQueueMetrics } = await import('@/lib/queue/broker-queue');
  const metrics = await getQueueMetrics();

  if (!metrics) {
    await sendAlert({
      level: 'critical',
      title: 'Queue Metrics Unavailable',
      message: 'Unable to fetch queue metrics. Redis may be down.',
    });
    return;
  }

  // Check failure rate
  const failureRate = metrics.completed > 0
    ? (metrics.failed / (metrics.completed + metrics.failed))
    : 0;

  if (failureRate > 0.05) {
    await sendAlert({
      level: 'warning',
      title: 'High Failure Rate',
      message: `Failure rate is ${(failureRate * 100).toFixed(2)}% (threshold: 5%)`,
      data: metrics,
    });
  }

  // Check queue backup
  if (metrics.waiting > 20) {
    await sendAlert({
      level: 'warning',
      title: 'Queue Backing Up',
      message: `${metrics.waiting} jobs waiting (threshold: 20)`,
      data: metrics,
    });
  }

  // Check stalled jobs
  if (metrics.delayed > 50) {
    await sendAlert({
      level: 'info',
      title: 'Many Delayed Jobs',
      message: `${metrics.delayed} jobs delayed (may be intentional timing)`,
      data: metrics,
    });
  }
}
```

### Step 5.3: Create Production Runbook

**Create**: `docs/PRODUCTION_RUNBOOK.md`

```markdown
# Production Runbook - AI Broker System

## Quick Reference

### Health Check Endpoints
- **Overall Health**: GET `/api/health`
- **Queue Metrics**: GET `/api/admin/migration-status`
- **Queue Dashboard**: GET `/api/admin/queue-dashboard` (BullBoard UI)

### Emergency Contacts
- **Engineering Lead**: [Your contact]
- **On-Call**: [Rotation]

---

## Common Scenarios

### Scenario 1: Queue is backing up

**Symptoms**:
- Many jobs in "waiting" state
- Customers not receiving responses

**Diagnosis**:
```bash
curl https://your-site.com/api/admin/migration-status
# Check queue.waiting count
```

**Solutions**:

**Option A: Increase worker concurrency**
```bash
# In Railway dashboard:
1. Add environment variable: WORKER_CONCURRENCY=5
2. Restart service
3. Monitor for 10 minutes
```

**Option B: Scale horizontally (add more Railway instances)**
```bash
# In Railway dashboard:
1. Add replicas
2. Each instance runs its own worker
3. Jobs distributed automatically
```

---

### Scenario 2: High failure rate

**Symptoms**:
- Many failed jobs in queue
- Customers receiving "technical difficulties" message

**Diagnosis**:
```bash
# Check failed jobs in BullBoard
Visit: https://your-site.com/api/admin/queue-dashboard

# Check logs
# In Railway: View logs, filter for "Job failed"
```

**Common Causes**:
1. **OpenAI API down**: Check status.openai.com
2. **Chatwoot API down**: Check chat.nextnest.sg/api/health
3. **Supabase down**: Check status.supabase.com
4. **Redis connection issue**: Check Redis logs

**Solutions**:

**For OpenAI issues**:
```bash
# Fallback already implemented in code
# Jobs will use template responses
# No action needed
```

**For Chatwoot issues**:
```bash
# Jobs will retry automatically
# If persistent, check Chatwoot status
```

**For database issues**:
```bash
# Verify Supabase connection:
npm run test-supabase-connection
```

---

### Scenario 3: Duplicate messages

**Symptoms**:
- Customers receiving same greeting multiple times
- Echo messages appearing

**Diagnosis**:
```bash
# Check if echo detection is working
# Look for "Echo detected" in logs

# Check conversation in Chatwoot
# Count greeting messages from broker
```

**Solutions**:
- Echo detection should prevent this (existing code)
- If still occurring, may be timing issue
- Check for multiple workers processing same job
- Verify job IDs are unique

---

### Scenario 4: Need to rollback to n8n

**When to rollback**:
- Critical issues with BullMQ
- Multiple systems down
- Need immediate stability

**Rollback Procedure**:
```bash
# 1. Stop BullMQ traffic
# In Railway dashboard:
Set BULLMQ_TRAFFIC_PERCENTAGE=0

# 2. Ensure n8n active
Set ENABLE_AI_BROKER=true

# 3. Restart service
Click "Restart" in Railway dashboard

# 4. Verify
curl https://your-site.com/api/admin/migration-status
# Should show: BullMQ 0%, n8n ON

# 5. Monitor
# All new conversations should use n8n
# BullMQ jobs will drain naturally
```

---

### Scenario 5: Worker crashed

**Symptoms**:
- No jobs being processed
- Worker status shows "not running"

**Diagnosis**:
```bash
curl https://your-site.com/api/health
# Check worker.isRunning = false
```

**Solutions**:
```bash
# Worker should auto-restart with service
# If not:
1. In Railway dashboard, click "Restart"
2. Worker will initialize on startup
3. Queued jobs will resume processing
```

---

## Monitoring Checklist

### Daily Checks (Automated)
- [ ] Queue health (failure rate < 5%)
- [ ] Queue not backing up (waiting < 20)
- [ ] Worker running
- [ ] Redis connected
- [ ] Response times normal (2-6 seconds)

### Weekly Checks (Manual)
- [ ] Review failed jobs for patterns
- [ ] Check customer feedback
- [ ] Verify broker capacity tracking
- [ ] Review conversation quality
- [ ] Update documentation if needed

---

## Performance Baselines

### Normal Operation
- Queue waiting: 0-5 jobs
- Queue active: 1-3 jobs
- Failed jobs: < 1% of total
- Average response time: 3-4 seconds
- Worker CPU: 20-40%
- Redis memory: < 100MB

### Alert Thresholds
- Queue waiting: > 20 jobs (warning)
- Failed rate: > 5% (critical)
- Response time: > 10 seconds (warning)
- Redis memory: > 500MB (warning)

---

## Contact Information

### Systems
- **Next.js App**: [Railway URL]
- **Redis**: [Railway Redis URL]
- **Chatwoot**: chat.nextnest.sg
- **Supabase**: [Your project URL]

### Access
- **Railway Dashboard**: https://railway.app/project/[your-project]
- **Queue Dashboard**: https://your-site.com/api/admin/queue-dashboard
- **Supabase Dashboard**: https://app.supabase.com/project/[your-project]
```

### Phase 5 Completion Checklist:

- [ ] ✅ BullBoard dashboard installed
- [ ] ✅ Alert system configured
- [ ] ✅ Slack webhooks setup (optional)
- [ ] ✅ Production runbook created
- [ ] ✅ Team trained on new system
- [ ] ✅ Monitoring running smoothly
- [ ] ✅ All documentation updated

**Deliverable**: Fully monitored production system

---

## Final Implementation Checklist

### Pre-Implementation (Phase 0)
- [ ] ✅ `docs/CURRENT_ARCHITECTURE.md` created
- [ ] ✅ `docs/INTEGRATION_MAPPING.md` created
- [ ] ✅ `docs/ENVIRONMENT_SETUP.md` created
- [ ] ✅ Redis provisioned
- [ ] ✅ Dependencies installed
- [ ] ✅ Environment variables configured

### Phase 1 (BullMQ Foundation)
- [ ] ✅ Redis config created
- [ ] ✅ Queue created with existing function integration
- [ ] ✅ Worker created calling existing functions
- [ ] ✅ Worker manager created
- [ ] ✅ Health check endpoint updated
- [ ] ✅ Queue test passes

### Phase 2 (AI Service)
- [ ] ✅ Vercel AI SDK installed
- [ ] ✅ AI service created with persona integration
- [ ] ✅ Chatwoot sendMessage method added
- [ ] ✅ AI test passes

### Phase 3 (Integration)
- [ ] ✅ Conversation API updated
- [ ] ✅ Webhook handler updated
- [ ] ✅ Migration controls created
- [ ] ✅ Admin dashboard created
- [ ] ✅ Tested with 0% traffic

### Phase 4 (Migration)
- [ ] ✅ Week 1 (0% validation) complete
- [ ] ✅ Week 2 (10%→50%) complete
- [ ] ✅ Week 3 (75%→100%) complete
- [ ] ✅ 7 days stability at 100%

### Phase 5 (Production)
- [ ] ✅ BullBoard dashboard installed
- [ ] ✅ Alerts configured
- [ ] ✅ Runbook created
- [ ] ✅ Team trained
- [ ] ✅ n8n decommissioned (optional)

---

## Success Metrics

### Technical Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Queue persistence | 100% (no lost jobs) | Test this |
| Duplicate rate | < 1% | Currently ~5% |
| Response timing | 2-6 seconds | Currently <1s |
| Failed jobs | < 1% | - |
| Uptime | > 99.5% | - |

### Business Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Customer satisfaction | > 4/5 | Measure this |
| Conversion rate | Maintain or improve | Baseline needed |
| Handoff accuracy | > 90% | - |
| Response quality | Maintain | Baseline needed |

---

## Support & Resources

### Documentation
- This file: Implementation plan
- `docs/CURRENT_ARCHITECTURE.md`: System overview
- `docs/INTEGRATION_MAPPING.md`: Function mapping
- `docs/PRODUCTION_RUNBOOK.md`: Operations guide

### Tools
- Queue Dashboard: `/api/admin/queue-dashboard`
- Migration Status: `/api/admin/migration-status`
- Health Check: `/api/health`

### Getting Help
- Review verification report for common issues
- Check existing code before adding new functions
- Test locally before deploying
- Monitor during gradual rollout

---

**Implementation Status**: Ready to begin Phase 0
**Estimated Completion**: 10-14 days
**Risk Level**: Low (gradual migration, easy rollback)
**Next Step**: Create Phase 0 documentation files
