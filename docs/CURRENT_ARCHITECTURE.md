# Current Architecture - NextNest AI Broker System
**Document Version:** 1.0
**Last Updated:** January 2025
**Status:** Pre-Migration Baseline

---

## System Overview

NextNest currently implements an AI broker system for mortgage advisory with the following characteristics:

### Core Capabilities
- ✅ **Multiple AI Broker Personas** - 5 distinct brokers with different communication styles
- ✅ **Lead Scoring & Routing** - 0-100 lead score determines broker assignment
- ✅ **Chatwoot Integration** - Self-hosted at chat.nextnest.sg
- ✅ **Human Handoff** - Manual takeover capability via Chatwoot status changes
- ✅ **Echo Detection** - Prevents duplicate message processing
- ✅ **Conversation Deduplication** - Returns customers reuse existing conversations
- ✅ **Broker Capacity Management** - Database-tracked workload and availability
- ✅ **Response Timing** - Human-like delays (1-6 seconds) based on message urgency
- ✅ **n8n Integration** - Webhook-based AI response generation

### Current Limitations
- ❌ **In-Memory Queue** - Conversation queue lost on server restart
- ❌ **n8n Dependency** - External system for AI orchestration adds complexity
- ❌ **Duplicate Risk** - ~5% duplicate message rate despite echo detection
- ❌ **No Retry Logic** - Failed AI responses not automatically retried
- ❌ **Limited Visibility** - No queue monitoring dashboard

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT INTERACTION                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   NextNest Form  │
                    │   (/apply page)  │
                    └──────────────────┘
                              │
                              ▼
           ┌────────────────────────────────────────┐
           │  app/api/chatwoot-conversation/route.ts │
           │  • Lead data validation                │
           │  • Conversation deduplication          │
           │  • Contact creation/lookup             │
           │  • Conversation creation               │
           └────────────────────────────────────────┘
                              │
                              ▼
           ┌────────────────────────────────────────┐
           │  lib/engagement/                       │
           │  broker-engagement-manager.ts          │
           │  • IN-MEMORY queue management          │
           │  • Broker assignment                   │
           │  • Greeting message orchestration      │
           └────────────────────────────────────────┘
                              │
                              ▼
           ┌────────────────────────────────────────┐
           │  lib/integrations/chatwoot-client.ts   │
           │  • Send initial greeting               │
           │  • Echo detection tracking             │
           │  • Activity messages                   │
           │  • Custom attributes                   │
           └────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Chatwoot UI    │
                    │ chat.nextnest.sg │
                    └──────────────────┘
                              │
                      (User responds)
                              │
                              ▼
           ┌────────────────────────────────────────┐
           │  app/api/chatwoot-webhook/route.ts     │
           │  • Echo detection check                │
           │  • Message deduplication               │
           │  • Forward to n8n                      │
           └────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   n8n Workflow   │
                    │  • OpenAI call   │
                    │  • Response gen  │
                    └──────────────────┘
                              │
                              ▼
           ┌────────────────────────────────────────┐
           │  n8n → Chatwoot API                    │
           │  • Posts AI broker response            │
           └────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Chatwoot UI    │
                    │ (shows response) │
                    └──────────────────┘
```

---

## Key Components Breakdown

### 1. Broker Persona System

**File:** `lib/calculations/broker-persona.ts`

**Five Broker Personas:**

| Broker | Type | Lead Score | Specialty |
|--------|------|------------|-----------|
| Michelle Chen | Aggressive | 70-100 | High-earners, commercial |
| Jasmine Lee | Aggressive | 70-100 | Luxury properties |
| Rachel Tan | Balanced | 50-69 | Millennials, first-time HDB |
| Sarah Wong | Balanced | 50-69 | Families, upgraders |
| Grace Lim | Conservative | 0-49 | First-time buyers, cautious |

**Key Functions:**
```typescript
// Lines 154-189: Response timing calculation
export function analyzeMessageUrgency(
  message: string,
  persona: BrokerPersona
): {
  isUrgent: boolean
  responseTime: number  // 1-6 seconds
  escalate: boolean
}

// Lines 15-94: Persona definitions with:
// - responseStyle (tone, tempo, complexity)
// - approach (aggressive/balanced/conservative)
// - specialty areas
// - greeting templates
```

**Critical:** This system already calculates human-like response delays. Do not recreate this logic.

---

### 2. Broker Assignment & Capacity Management

#### Assignment Logic
**File:** `lib/ai/broker-assignment.ts`

```typescript
// Lines 10-127: Primary assignment function
export async function assignBestBroker(
  leadScore: number,
  loanType: string,
  propertyType: string,
  monthlyIncome: number,
  timeline: string,
  conversationId: number
): Promise<BrokerRecord>

// Process:
// 1. Query Supabase ai_brokers table (lines 20-44)
// 2. Filter by availability (current_workload < max_concurrent_chats)
// 3. Match personality type to lead score (lines 64-86)
// 4. Select broker with lowest workload
// 5. Record assignment in broker_conversations (lines 97-113)
```

#### Capacity Tracking
**File:** `lib/ai/broker-availability.ts`

```typescript
// Lines 12-38: Mark broker as busy
export async function markBrokerBusy(
  broker: BrokerRecord,
  conversationId?: number
): Promise<void>
// Updates:
// - current_workload (increment)
// - active_conversations (append)
// - is_available (false if at max)
// - last_active (timestamp)

// Lines 40-81: Release broker capacity
export async function releaseBrokerCapacity(
  brokerId: string
): Promise<void>
// Updates:
// - current_workload (decrement)
// - is_available (true if below max)
```

**Database Schema:**
```sql
-- ai_brokers table
CREATE TABLE ai_brokers (
  id UUID PRIMARY KEY,
  name TEXT,
  personality_type TEXT,  -- 'aggressive' | 'balanced' | 'conservative'
  is_available BOOLEAN,
  current_workload INTEGER,
  max_concurrent_chats INTEGER DEFAULT 3,
  active_conversations JSONB,
  created_at TIMESTAMPTZ
);

-- broker_conversations table
CREATE TABLE broker_conversations (
  id UUID PRIMARY KEY,
  broker_id UUID REFERENCES ai_brokers(id),
  chatwoot_conversation_id INTEGER,
  lead_score DECIMAL,
  status TEXT,  -- 'active' | 'completed' | 'handed_off'
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

---

### 3. In-Memory Queue System

**File:** `lib/engagement/broker-engagement-manager.ts`

**Current Implementation:**
```typescript
// Line 36: In-memory queue (LOST ON RESTART)
private queue: EngagementContext[] = []

// Lines 62-91: Queue management
async queueConversation(context: EngagementContext): Promise<void> {
  this.queue.push(context)
  await this.processQueue()
}

// Lines 93-109: Process queue
private async processQueue(): Promise<void> {
  if (this.isProcessing || this.queue.length === 0) return
  this.isProcessing = true

  while (this.queue.length > 0) {
    const context = this.queue.shift()
    await this.handleBrokerJoin(context)
  }

  this.isProcessing = false
}
```

**Critical Functions to Preserve:**

```typescript
// Lines 111-189: Sophisticated broker joining logic
async announceBrokerJoin(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord
): Promise<void>
// Does:
// 1. Update conversation custom attributes
// 2. Post "Broker joined" activity message (with 500ms delay)
// 3. Send personalized greeting from broker (with 2s delay)
// 4. Handle conversation status changes
// 5. Error handling with retries

// Key timing:
await new Promise(resolve => setTimeout(resolve, 500))  // Before activity
await new Promise(resolve => setTimeout(resolve, 2000)) // Before greeting
```

**⚠️ MIGRATION TARGET:** Replace in-memory queue with BullMQ, preserve all other logic.

---

### 4. Chatwoot Integration

**File:** `lib/integrations/chatwoot-client.ts`

**Existing Sophisticated Methods:**

#### 4.1 Send Initial Message with Deduplication
```typescript
// Lines 415-494
async sendInitialMessage(
  conversationId: number,
  leadData: ProcessedLeadData
): Promise<void>

// Features:
// - Checks for existing greeting (lines 417-422)
// - Personalized message from broker persona
// - Echo detection tracking (lines 472-481)
// - Error handling with retries
// - Activity message fallback

// Uses:
await this.hasExistingGreeting(conversationId, brokerName)
trackBotMessage(conversationId, message, messageId)
```

#### 4.2 Greeting Deduplication
```typescript
// Lines 373-410
async hasExistingGreeting(
  conversationId: number,
  brokerName: string
): Promise<boolean>

// Checks:
// 1. Fetches all messages from conversation
// 2. Looks for existing greeting with broker name
// 3. Returns true if greeting found (skip duplicate)
```

#### 4.3 Activity Messages
```typescript
// Lines 644-670
async createActivityMessage(
  conversationId: number,
  message: string
): Promise<void>

// System-level messages (not from broker persona)
// Used for: "Broker joined", "Handoff triggered", etc.
```

#### 4.4 Custom Attributes
```typescript
// Lines 721-761
async updateConversationCustomAttributes(
  conversationId: number,
  attributes: Record<string, any>
): Promise<void>

// Stores metadata:
// - broker_id, broker_name
// - lead_score
// - loan_type, property_type
// - ai_status (bot_active, human_handoff)
```

**⚠️ NEED TO ADD:**
```typescript
async sendMessage(
  conversationId: number,
  content: string
): Promise<{ message_id?: number }>
// Simple message sending for AI responses
// Must integrate with echo detection
```

---

### 5. Webhook Handler & Echo Detection

**File:** `app/api/chatwoot-webhook/route.ts`

**Echo Detection System:**
```typescript
// Lines 6-12: In-memory deduplication
const processedMessages = new Set<string>()

// Lines 76-95: Check if message is bot's own echo
function checkIfEcho(
  event: any,
  conversationId: number
): boolean {
  const messageId = event.id
  const botMessageIds = getBotMessageIds(conversationId)
  return botMessageIds.has(messageId.toString())
}

// Lines 97-111: Duplicate prevention
if (processedMessages.has(dedupeKey)) {
  return NextResponse.json({ status: 'duplicate_skipped' })
}
processedMessages.add(dedupeKey)
```

**n8n Forwarding:**
```typescript
// Lines 140-261: Current n8n integration
if (N8N_AI_BROKER_WEBHOOK_URL && event.message_type === 'incoming') {
  // Forward to n8n with:
  // - conversation_id
  // - message content
  // - sender info
  // - conversation metadata

  const n8nResponse = await fetch(N8N_AI_BROKER_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(n8nPayload)
  })
}
```

**⚠️ MIGRATION TARGET:** Replace n8n forwarding with BullMQ job creation.

---

### 6. Conversation Creation & Deduplication

**File:** `app/api/chatwoot-conversation/route.ts`

**Critical Deduplication Logic:**
```typescript
// Lines 235-276: Check for existing conversation
const deduplicator = getConversationDeduplicator(chatwootClient)
const dedupeResult = await deduplicator.checkForExistingConversation(
  contact.id,
  processedLeadData.loanType
)

if (!dedupeResult.shouldCreateNew && dedupeResult.existingConversationId) {
  console.log(`♻️ Reusing conversation #${dedupeResult.existingConversationId}`)

  // COMPLEX REUSE LOGIC:
  // 1. Check if broker already assigned
  // 2. If no broker, assign one now
  // 3. Update conversation attributes
  // 4. Send activity message about returning customer
  // 5. Optionally send new greeting

  return NextResponse.json({
    success: true,
    conversationId: dedupeResult.existingConversationId,
    reused: true
  })
}

// Lines 278-340: Create new conversation if no match found
```

**Deduplication Criteria:**
```typescript
// From conversation-deduplicator.ts
// Matches conversations from same contact with:
// - Same loan type
// - Still in 'open' or 'pending' status
// - Created within last 30 days
```

**⚠️ MUST PRESERVE:** This sophisticated deduplication logic prevents conversation spam.

---

## Data Flow Examples

### Example 1: New Lead Submission

```
1. User submits form at /apply
   ↓
2. POST /api/chatwoot-conversation
   - Validates lead data
   - Checks for existing conversation (deduplication)
   - Creates Chatwoot contact
   - Creates new conversation
   ↓
3. broker-engagement-manager.queueConversation()
   - Adds to in-memory queue
   - Processes queue immediately
   ↓
4. assignBestBroker()
   - Queries ai_brokers table
   - Selects based on lead score + availability
   - Records in broker_conversations table
   ↓
5. markBrokerBusy()
   - Increments current_workload
   - Updates active_conversations
   - Sets is_available if at max capacity
   ↓
6. announceBrokerJoin()
   - Updates conversation custom attributes
   - Posts activity: "Michelle Chen has joined"
   - Waits 2 seconds
   - Posts greeting: "Hi! I'm Michelle..."
   ↓
7. trackBotMessage()
   - Stores message ID for echo detection
   ↓
8. Conversation appears in Chatwoot UI
```

### Example 2: User Responds (Current with n8n)

```
1. User types message in Chatwoot
   ↓
2. Chatwoot triggers webhook
   ↓
3. POST /api/chatwoot-webhook
   - Receives event
   - checkIfEcho() - is this our own message? NO
   - Check processedMessages Set - already seen? NO
   - Add to processedMessages
   ↓
4. Forward to n8n
   - POST to N8N_AI_BROKER_WEBHOOK_URL
   - n8n receives message
   ↓
5. n8n workflow
   - Calls OpenAI API
   - Gets broker persona context
   - Generates response
   ↓
6. n8n posts back to Chatwoot API
   - Message appears in conversation
   ↓
7. Chatwoot triggers webhook again (echo)
   ↓
8. POST /api/chatwoot-webhook
   - checkIfEcho() - YES (message ID in botMessageIds)
   - Skip processing ✅
```

### Example 3: Human Handoff

```
1. AI detects complex question
   - analyzeMessageUrgency() returns escalate: true
   ↓
2. Update conversation status
   - Change from 'bot' to 'open'
   - Post activity: "Conversation requires human broker"
   ↓
3. Chatwoot UI shows conversation in "Open" tab
   ↓
4. Human broker responds
   - Message has message_type: 'outgoing', sender role: 'agent'
   ↓
5. Webhook handler
   - Detects human message
   - Stops routing to AI
   ↓
6. releaseBrokerCapacity()
   - Decrements AI broker workload
   - Marks conversation as 'handed_off'
```

---

## Environment Variables

### Current .env.local Setup

```bash
# Chatwoot
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_API_KEY=your_api_key_here
CHATWOOT_BOT_USER_ID=1

# n8n (TO BE MIGRATED AWAY FROM)
N8N_AI_BROKER_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-broker

# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OpenAI (already in use)
OPENAI_API_KEY=sk-...

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Performance Characteristics

### Current Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Homepage load time | 1.2s | SSR, programmatic SEO pages |
| Apply page load time | 1.8s | Dynamic form with validation |
| Greeting message delay | 2s | After broker assignment |
| Activity message delay | 500ms | System notifications |
| Response timing | 1-6s | Based on message urgency |
| Queue processing | Immediate | In-memory, no persistence |
| Duplicate message rate | ~5% | Despite echo detection |
| Broker capacity | 3 concurrent | Per broker in database |

### Bundle Sizes

| Asset | Size | Loading |
|-------|------|---------|
| Homepage bundle | 200KB | Initial load |
| OpenAI SDK | 300KB | Imported in API routes |
| Chatwoot widget | 150KB | Lazy loaded |

---

## Database Schema

### ai_brokers Table
```sql
CREATE TABLE ai_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  current_workload INTEGER DEFAULT 0,
  max_concurrent_chats INTEGER DEFAULT 3,
  active_conversations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_brokers_available ON ai_brokers(is_available, current_workload);
CREATE INDEX idx_brokers_personality ON ai_brokers(personality_type);
```

### broker_conversations Table
```sql
CREATE TABLE broker_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES ai_brokers(id),
  chatwoot_conversation_id INTEGER UNIQUE NOT NULL,
  lead_score DECIMAL(5,2),
  loan_type TEXT,
  property_type TEXT,
  status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  handoff_triggered BOOLEAN DEFAULT false,
  handoff_reason TEXT,
  message_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_broker_conv_broker ON broker_conversations(broker_id);
CREATE INDEX idx_broker_conv_chatwoot ON broker_conversations(chatwoot_conversation_id);
CREATE INDEX idx_broker_conv_status ON broker_conversations(status);
```

---

## Critical Integration Points

### Functions That MUST Be Called in Migration

| Function | File | Purpose | When to Call |
|----------|------|---------|--------------|
| `assignBestBroker()` | broker-assignment.ts | Assign broker to conversation | On new conversation |
| `markBrokerBusy()` | broker-availability.ts | Increment broker workload | Before processing |
| `analyzeMessageUrgency()` | broker-persona.ts | Calculate response delay | For each message |
| `announceBrokerJoin()` | broker-engagement-manager.ts | Orchestrate greeting | Initial assignment |
| `sendInitialMessage()` | chatwoot-client.ts | Send with deduplication | Send greeting |
| `hasExistingGreeting()` | chatwoot-client.ts | Check for duplicates | Before greeting |
| `createActivityMessage()` | chatwoot-client.ts | System notifications | Status changes |
| `updateConversationCustomAttributes()` | chatwoot-client.ts | Store metadata | Assignment/updates |
| `checkIfEcho()` | chatwoot-webhook/route.ts | Prevent echo loops | Every webhook |
| `checkForExistingConversation()` | conversation-deduplicator.ts | Reuse conversations | Before creating |
| `updateBrokerMetrics()` | broker-assignment.ts | Track performance | After response |
| `releaseBrokerCapacity()` | broker-availability.ts | Decrement workload | On handoff/complete |

---

## Known Issues & Limitations

### 1. Queue Persistence ❌
**Issue:** In-memory queue lost on server restart
**Impact:** Conversations in queue disappear
**Frequency:** Every deployment or crash
**Mitigation Target:** BullMQ with Redis

### 2. n8n Dependency ❌
**Issue:** External system for AI orchestration
**Impact:** Extra latency, complexity, another service to manage
**Frequency:** Every conversation
**Mitigation Target:** Vercel AI SDK in-process

### 3. Duplicate Messages ❌
**Issue:** ~5% duplicate rate despite echo detection
**Impact:** Customers see duplicate greetings/responses
**Frequency:** Intermittent
**Mitigation Target:** BullMQ job IDs for deduplication

### 4. No Retry Logic ❌
**Issue:** Failed AI responses silently fail
**Impact:** Conversations stall
**Frequency:** 1-2% of messages (API errors)
**Mitigation Target:** BullMQ automatic retries

### 5. Limited Monitoring ❌
**Issue:** No visibility into queue state
**Impact:** Hard to debug issues
**Frequency:** During troubleshooting
**Mitigation Target:** BullBoard dashboard

---

## Migration Constraints

### Must Preserve
- ✅ All 5 broker personas and their configurations
- ✅ Lead scoring system
- ✅ Broker assignment logic with Supabase queries
- ✅ Broker capacity tracking (current_workload, is_available)
- ✅ Echo detection system (processedMessages, checkIfEcho)
- ✅ Conversation deduplication (checkForExistingConversation)
- ✅ Response timing calculation (analyzeMessageUrgency)
- ✅ Broker joining orchestration (announceBrokerJoin)
- ✅ Custom attribute tracking
- ✅ Activity message system
- ✅ Greeting deduplication (hasExistingGreeting)
- ✅ Human handoff detection
- ✅ Metrics tracking (updateBrokerMetrics)

### Can Replace
- 🔄 In-memory queue → BullMQ with Redis
- 🔄 n8n OpenAI calls → Vercel AI SDK
- 🔄 n8n webhook forwarding → BullMQ job creation

### Must Add
- ➕ Redis connection configuration
- ➕ BullMQ queue setup
- ➕ BullMQ worker process
- ➕ Worker lifecycle management (Next.js safe)
- ➕ Vercel AI SDK integration
- ➕ sendMessage() method in ChatwootClient
- ➕ Gradual migration controls
- ➕ Queue monitoring dashboard

---

## Success Criteria for Migration

The migration is successful when:

1. **Zero Functional Regression**
   - All existing features work exactly as before
   - Same broker assignment logic
   - Same response timing
   - Same echo detection effectiveness
   - Same deduplication behavior

2. **Enhanced Reliability**
   - Queue persists through restarts (100% retention)
   - Duplicate rate < 1% (down from 5%)
   - Failed messages automatically retry (3 attempts)
   - No lost conversations

3. **Simplified Architecture**
   - n8n dependency removed
   - All logic in Next.js codebase
   - TypeScript end-to-end

4. **Maintained Performance**
   - Homepage load time: 1.2s (no change)
   - Apply page load time: < 2s
   - Response timing: 2-6s (slightly slower for human feel)
   - No bundle size regression on SSR pages

5. **Operational Improvements**
   - Queue visibility via BullBoard
   - Job retry monitoring
   - Error alerting
   - Capacity utilization tracking

---

## Next Steps

**Before writing any code:**
1. ✅ Review this document
2. ⏭️ Review `INTEGRATION_MAPPING.md` for function-to-function mapping
3. ⏭️ Review `ENVIRONMENT_SETUP.md` for prerequisites

**Then begin Phase 1: BullMQ Foundation**

---

**Document Status:** ✅ Complete
**Ready for:** Phase 0 completion → Phase 1 implementation
