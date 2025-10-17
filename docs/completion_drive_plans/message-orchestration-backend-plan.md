# Message Orchestration Backend Plan

## Executive Summary

This plan addresses three critical issues in the backend message orchestration system:

1. **setTimeout dropped by Vercel** → "{Broker} joined the conversation" never appears
2. **Persona mutation timing** → Initial greeting uses stale persona
3. **Duplicate queue messages** → Activity emitted twice by Chatwoot

## Problem Analysis

### Problem 1: setTimeout Dropped by Vercel

**Location:** `lib/engagement/broker-engagement-manager.ts:140-167`

**Current Implementation:**
```typescript
setTimeout(async () => {
  await chatwootClient.createActivityMessage(
    conversationId,
    `${broker.name} joined the conversation.`
  )
  await chatwootClient.sendInitialMessage(...)
}, delayMs)
```

**Root Cause:**
- Vercel serverless functions terminate after response is sent to client
- setTimeout callbacks are queued in event loop but never execute
- Process terminates before timer fires
- Join message is lost 100% of the time in production

**Evidence:**
- Line 140: Timer is set with 3-15 second delay
- Line 169-171: `unref()` is called (doesn't help in serverless)
- API route completes at `chatwoot-conversation/route.ts:374` before timer fires

**Impact:**
- User never sees "{Broker Name} joined the conversation" activity
- Breaks expected UX flow: queue → reviewing → **join** → greeting
- Jump from "reviewing" directly to greeting feels jarring

**#PHANTOM_PATTERN: setTimeout works in local development**
This creates false confidence because local Node.js keeps process alive, but Vercel doesn't.

---

### Problem 2: Persona Mutation Timing

**Location:** `app/api/chatwoot-conversation/route.ts:287-321`

**Current Flow:**
```typescript
// Line 170: Calculate PRE-SELECTED persona from form data
const brokerPersona = calculateBrokerPersona(leadScore, sanitizedData)

// Line 179-194: Store in processedLeadData
const processedLeadData: ProcessedLeadData = {
  brokerPersona,  // ← Uses pre-selected "Dr. Elena Rodriguez" or similar
  ...
}

// Line 287: Call broker engagement with STALE persona
const engagementResult = await brokerEngagementManager.handleNewConversation({
  processedLeadData,  // ← brokerPersona is WRONG here!
  ...
})
// ↑ This function IMMEDIATELY uses processedLeadData.brokerPersona to send messages!

// Line 318-321: TOO LATE! Message already sent!
if (assignedBroker && assignedBroker.name) {
  processedLeadData.brokerPersona.name = assignedBroker.name  // ← Updates AFTER use
}
```

**Root Cause:**
- `handleNewConversation()` is called BEFORE persona is updated
- Inside `handleNewConversation()`, line 124 mutates persona: `context.processedLeadData.brokerPersona.name = broker.name`
- BUT the greeting message (line 160) uses the mutated value immediately
- The mutation happens inside async setTimeout, so it's unreliable
- Race condition: persona update vs. message sending

**Evidence from broker-engagement-manager.ts:**
```typescript
// Line 124-125: Updates persona INSIDE announceBrokerJoin
context.processedLeadData.brokerPersona.name = broker.name
context.processedLeadData.brokerPersona.type = broker.personality_type

// Line 160: Sends greeting with updated persona
await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)
```

**But wait! The setTimeout drops the entire block, so:**
- Line 124-125 updates never execute in Vercel
- Line 160 sendInitialMessage never executes
- User sees NO greeting at all!

**Compound Issue:**
1. Persona is updated too late (line 318-321 in route.ts)
2. Even the internal update (line 124-125) doesn't help because setTimeout drops
3. Result: Greeting with wrong broker name, OR no greeting at all

**Impact:**
- User sees "Dr. Elena Rodriguez" in greeting but "Sarah Wong" in Chatwoot attributes
- Or greeting never arrives because setTimeout dropped
- Inconsistent broker identity across UI and messages

---

### Problem 3: Duplicate Queue Messages

**Location:** `lib/engagement/broker-engagement-manager.ts:52-56`

**Current Implementation:**
```typescript
if (!broker) {
  await chatwootClient.createActivityMessage(
    context.conversationId,
    'All AI specialists are helping other homeowners right now. We\'ll connect you as soon as one is free.'
  )
}
```

**Root Cause:**
- Chatwoot emits webhook events for activity messages
- `/api/chatwoot-enhanced-flow` webhook receives "message_created" event
- Enhanced flow RE-POSTS a duplicate queue message (lines 51-113)
- Result: Two queue messages with different `message_type` values

**Evidence:**
- `createActivityMessage()` posts via `/activities` endpoint (returns 204)
- Chatwoot emits webhook: `event: "message_created"`, `message_type: 2`
- Enhanced webhook sees this, thinks it's new conversation, posts ANOTHER message
- Second message has `message_type: "incoming"`, `sender.type: "contact"` (wrong!)

**Webhook Trace:**
```
1. broker-engagement-manager.ts:53 → createActivityMessage("All AI specialists...")
2. Chatwoot webhook → POST /api/chatwoot-enhanced-flow
3. enhanced-flow/route.ts:51 → handleConversationCreated()
4. enhanced-flow/route.ts:87 → selectBrokerForLead() (picks random broker!)
5. enhanced-flow/route.ts:94 → sendBrokerJoinedMessage() (duplicate!)
```

**Impact:**
- User sees queue message twice in UI
- One renders as centered system message (correct)
- One renders as right-aligned user bubble (wrong)
- Confusing UX, looks like a bug

**Additional Problem: Enhanced Webhook Overrides Supabase Assignment**
- Line 87 in enhanced-flow: `selectBrokerForLead()` randomly picks broker
- Ignores `ai_broker_name` from Supabase assignment
- Overwrites correct broker with random one
- Lines 107-112: Updates `custom_attributes.ai_broker_name` with wrong broker

---

## Explored Approaches

### #PATH_DECISION: Join Message Delivery Mechanism

#### Path A: n8n Webhook with Delay Node ⚠️ COMPLEX

**Implementation:**
```typescript
// In broker-engagement-manager.ts:announceBrokerJoin()
await fetch('https://n8n.nextnest.sg/webhook/broker-join', {
  method: 'POST',
  body: JSON.stringify({
    conversationId,
    brokerName: broker.name,
    delaySeconds: 5
  })
})
```

**n8n Workflow:**
1. Receive webhook payload
2. Wait node: 5-15 seconds
3. HTTP Request: POST to Chatwoot `/activities` endpoint
4. HTTP Request: POST greeting message to Chatwoot `/messages` endpoint

**Pros:**
- Guaranteed delivery (n8n runs independently of Vercel)
- No API route timeout concerns
- Scales horizontally
- Can add retry logic
- Timing feels natural (async human-like delay)

**Cons:**
- External dependency (n8n downtime = no join messages)
- Adds network latency (2 HTTP hops instead of 1)
- Requires n8n infrastructure setup
- Harder to debug (messages span multiple systems)
- Cannot easily test locally without n8n instance

**Risk Assessment:**
- **Failure Mode:** n8n webhook unreachable → join message never arrives
- **Rollback Plan:** Keep synchronous fallback in code (detect n8n failure, post immediately)
- **Monitoring:** Alert if n8n webhook returns 5xx for >1 minute

**#PLAN_UNCERTAINTY: n8n reliability**
Current n8n setup not production-hardened. Need HA config, health checks, SLA guarantees.

---

#### Path B: Synchronous Wait (≤2s) ✅ RECOMMENDED

**Implementation:**
```typescript
// In broker-engagement-manager.ts:announceBrokerJoin()
async function announceBrokerJoin(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord
): Promise<number> {
  // Update conversation attributes FIRST
  await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
    ai_broker_id: broker.id,
    ai_broker_name: broker.name,
    broker_persona: broker.personality_type,
    broker_status: 'joining'
  })

  // Post "reviewing" activity immediately
  await chatwootClient.createActivityMessage(
    context.conversationId,
    `${broker.name} is reviewing your details and will join the chat shortly.`
  )

  // SHORT synchronous wait (2 seconds max to avoid timeout)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Post "joined" activity
  await chatwootClient.createActivityMessage(
    context.conversationId,
    `${broker.name} joined the conversation.`
  )

  // Update status to engaged
  await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
    broker_status: 'engaged'
  })

  // Post greeting immediately after join
  await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)

  return 2 // Return actual delay seconds
}
```

**Pros:**
- **Guaranteed delivery** (no external dependencies)
- Simple, easy to test, easy to debug
- No infrastructure changes required
- Works identically in local dev and production
- Total sequence time: ~3-4 seconds (acceptable UX)
- No race conditions (everything in single async chain)

**Cons:**
- Blocks API route for 2 extra seconds (total response time ~4-5s instead of ~2-3s)
- User sees loading state slightly longer
- Less "natural" timing (humans take 5-15s to join, not 2s)

**Risk Assessment:**
- **Failure Mode:** Vercel timeout (max 10s for Hobby, 60s for Pro)
- **Mitigation:** 2s wait is safe margin (leaves 8s for other operations)
- **Monitoring:** Track API response times, alert if p95 >5s

**UX Impact:**
- User sees form spinner for 2-3 extra seconds → acceptable
- Trade-off: Reliability > "natural" timing
- Messages still appear in correct order: reviewing → join → greeting

**#LCL_EXPORT_CRITICAL: architecture_decision::join_message_delivery**
**RECOMMENDATION: Path B (Synchronous Wait)**
Prioritizes reliability and simplicity over marginal UX improvement.

---

#### Path C: Upstash Queue / Vercel Cron ⚠️ OVERENGINEERED

**Implementation:**
```typescript
// In broker-engagement-manager.ts
await upstashQueue.enqueue({
  action: 'broker_join',
  conversationId,
  brokerName: broker.name,
  executeAt: Date.now() + 5000
})
```

**Worker (Vercel Cron every 10 seconds):**
```typescript
// api/cron/process-broker-joins/route.ts
export async function GET() {
  const jobs = await upstashQueue.dequeue()
  for (const job of jobs) {
    if (Date.now() >= job.executeAt) {
      await postJoinMessage(job.conversationId, job.brokerName)
    }
  }
}
```

**Pros:**
- Fully async (no blocking)
- Scales to high volume
- Precise timing control
- Can retry failed jobs

**Cons:**
- Requires Upstash Redis (paid service)
- Adds infrastructure complexity
- Cron granularity: 10s minimum (not precise)
- Queue processing delays (10-20s actual vs. 5s intended)
- Overkill for current scale (10-50 conversations/day)

**#FALSE_FLUENCY: "Queues are best practice for async jobs"**
True for high-volume systems, but premature optimization here.

---

#### Path D: Immediate Synchronous Delivery (No Delay) ⚠️ UX DOWNGRADE

**Implementation:**
```typescript
// Post join message immediately after assignment
await chatwootClient.createActivityMessage(
  context.conversationId,
  `${broker.name} joined the conversation.`
)
await chatwootClient.sendInitialMessage(...)
```

**Pros:**
- Simplest possible code
- Zero delay, instant response
- No timeout risk

**Cons:**
- Broker "joins" instantly (0.1 seconds)
- Feels robotic, breaks immersion
- No time to show "reviewing your details" message
- Loses human-like pacing

**UX Impact:**
- User submits form → instant greeting
- No anticipation, no "specialist is thinking" cue
- Cheapens premium feel of AI broker

**Rejected:** Sacrifices too much UX quality for marginal simplicity gain.

---

### #PATH_DECISION: Persona Update Timing

#### Path A: Assign Broker BEFORE handleNewConversation ✅ RECOMMENDED

**Implementation:**
```typescript
// In chatwoot-conversation/route.ts

// STEP 1: Calculate pre-selected persona (for fallback only)
const brokerPersona = calculateBrokerPersona(leadScore, sanitizedData)

// STEP 2: Prepare lead data with fallback persona
const processedLeadData: ProcessedLeadData = {
  brokerPersona,  // Fallback: "Dr. Elena Rodriguez" etc.
  ...
}

// STEP 3: Try to assign REAL broker from Supabase
const assignedBroker = await assignBestBroker(
  leadScore,
  sanitizedData.loanType,
  sanitizedData.propertyCategory || 'resale',
  formData.actualIncomes?.[0] || 0,
  formData.loanType === 'refinance' ? 'immediate' : 'soon',
  conversation.id
)

// STEP 4: UPDATE persona BEFORE calling engagement manager
if (assignedBroker) {
  processedLeadData.brokerPersona = {
    name: assignedBroker.name,
    type: (assignedBroker.personality_type as "aggressive" | "balanced" | "conservative") || processedLeadData.brokerPersona.type,
    approach: processedLeadData.brokerPersona.approach,  // Keep calculated approach
    urgencyLevel: processedLeadData.brokerPersona.urgencyLevel
  }
  console.log('✅ Updated persona to real broker:', processedLeadData.brokerPersona.name)
}

// STEP 5: NOW call engagement manager with CORRECT persona
const engagementResult = await brokerEngagementManager.handleNewConversation({
  conversationId: conversation.id,
  leadScore,
  loanType: sanitizedData.loanType,
  propertyCategory: sanitizedData.propertyCategory || 'resale',
  monthlyIncome: formData.actualIncomes?.[0] || 0,
  timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',
  processedLeadData,  // ← Contains correct broker name NOW
  sessionId
})

// STEP 6: Remove lines 318-321 (no longer needed)
// if (assignedBroker && assignedBroker.name) {
//   processedLeadData.brokerPersona.name = assignedBroker.name  // DELETE
// }
```

**Pros:**
- Guarantees correct persona in ALL messages (join, greeting)
- Single source of truth (persona updated once, used consistently)
- Easy to debug (linear flow)
- No race conditions

**Cons:**
- Blocks API response until broker assigned (~500ms Supabase query)
- Total response time: ~2.5s instead of ~2s
- Persona object becomes more complex (merge pre-selected + real broker)

**Risk Assessment:**
- **Failure Mode:** Supabase timeout → use fallback persona
- **Mitigation:** Already handled (assignBestBroker returns null on error)
- **Monitoring:** Track Supabase query times, alert if p95 >1s

**#LCL_EXPORT_FIRM: data_flow::broker_persona_lifecycle**
```
┌───────────────────────────────────────────────────┐
│ 1. calculateBrokerPersona(leadScore, formData)   │
│    → Fallback: "Dr. Elena Rodriguez"             │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ 2. processedLeadData.brokerPersona = fallback     │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ 3. assignBestBroker() → Supabase query           │
│    → Returns: "Sarah Wong" (real broker)         │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ 4. UPDATE processedLeadData.brokerPersona         │
│    name: "Sarah Wong" (overwrites fallback)       │
│    type: "balanced" (from Supabase)               │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ 5. handleNewConversation(processedLeadData)       │
│    → Uses correct "Sarah Wong" in all messages    │
└───────────────────────────────────────────────────┘
```

**RECOMMENDATION: Path A (Assign Before)**
Guarantees consistency, acceptable latency cost.

---

#### Path B: Pass Broker as Separate Parameter ⚠️ API CHANGE

**Implementation:**
```typescript
// Change function signature
async handleNewConversation(
  context: EngagementContext,
  assignedBroker: BrokerRecord | null  // ← NEW parameter
): Promise<ScheduleResult>

// In chatwoot-conversation/route.ts
const assignedBroker = await assignBestBroker(...)
await brokerEngagementManager.handleNewConversation(
  { conversationId, leadScore, ..., processedLeadData },
  assignedBroker  // ← Pass separately
)
```

**Pros:**
- Clear separation: form data vs. broker assignment
- Easier to test (mock broker parameter)
- Explicit dependency

**Cons:**
- Breaks existing function signature (refactor required)
- More parameters = more cognitive load
- Doesn't solve timing issue (still need to update persona)

**Rejected:** Adds complexity without solving root problem.

---

#### Path C: Two-Phase Initialization ⚠️ OVERENGINEERED

**Implementation:**
```typescript
// Phase 1: Create conversation shell
const conversation = await chatwootClient.createConversation(leadData, true) // skip messages

// Phase 2: Assign broker
const broker = await assignBestBroker(...)
leadData.brokerPersona.name = broker.name

// Phase 3: Send messages
await brokerEngagementManager.sendWelcomeSequence(conversation.id, leadData)
```

**Pros:**
- Very explicit phases
- Easy to add steps between phases
- Testable in isolation

**Cons:**
- More complex flow (3 steps instead of 1)
- More function calls (higher error surface)
- Harder to reason about state (conversation exists before messages)

**Rejected:** Over-engineering for this use case.

---

### #PATH_DECISION: Message Ordering Strategy

**Expected UX Flow:**
```
User completes form
  ↓
[API processes assignment]
  ↓
1. "Sarah Wong is reviewing your details..." (reviewing activity)
  ↓
[2-second delay]
  ↓
2. "Sarah Wong joined the conversation" (join activity)
  ↓
[Immediate]
  ↓
3. "Good morning John! I'm Sarah Wong..." (broker greeting)
```

**Requirements:**
- Queue message ONLY if no broker assigned
- NO setTimeout (use synchronous wait)
- Correct broker name in ALL messages
- No duplicate messages

#### Recommended Implementation

```typescript
// In broker-engagement-manager.ts:announceBrokerJoin()

async function announceBrokerJoin(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord
): Promise<number> {
  // Ensure persona is updated FIRST (should be done in route.ts, but belt-and-suspenders)
  context.processedLeadData.brokerPersona.name = broker.name
  context.processedLeadData.brokerPersona.type = broker.personality_type || context.processedLeadData.brokerPersona.type

  // Update Chatwoot attributes immediately
  await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
    ai_broker_id: broker.id,
    ai_broker_name: broker.name,
    broker_persona: broker.personality_type,
    broker_slug: broker.slug,
    broker_status: 'joining'
  })

  // Message 1: Reviewing activity (immediate)
  await chatwootClient.createActivityMessage(
    context.conversationId,
    `${broker.name} is reviewing your details and will join the chat shortly.`
  )

  // Synchronous wait (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Message 2: Joined activity
  await chatwootClient.createActivityMessage(
    context.conversationId,
    `${broker.name} joined the conversation.`
  )

  // Update status to engaged
  await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
    broker_status: 'engaged'
  })

  // Message 3: Greeting (immediate after join)
  await chatwootClient.sendInitialMessage(
    context.conversationId,
    context.processedLeadData
  )

  console.log('✅ Welcome sequence complete:', {
    conversationId: context.conversationId,
    brokerName: broker.name,
    totalTimeSeconds: 2
  })

  return 2 // Return actual delay
}
```

**Sequence Timing:**
- T+0ms: "reviewing" message posted
- T+2000ms: "joined" message posted
- T+2050ms: Greeting message posted
- T+2100ms: API response returned to client

**#LCL_EXPORT_FIRM: implementation_logic::message_sequence**
```
handleNewConversation()
  ├─ assignBestBroker() → Returns Sarah Wong
  ├─ if (!broker)
  │   ├─ createActivityMessage("All AI specialists busy...")
  │   └─ return { status: 'queued' }
  └─ if (broker)
      └─ announceBrokerJoin()
          ├─ updateConversationCustomAttributes({ broker_status: 'joining' })
          ├─ createActivityMessage("Sarah Wong is reviewing...")
          ├─ await delay(2000)
          ├─ createActivityMessage("Sarah Wong joined...")
          ├─ updateConversationCustomAttributes({ broker_status: 'engaged' })
          └─ sendInitialMessage("Good morning John...")
```

---

### #PATH_DECISION: Queue Message Deduplication Location

**Frontend Planner Recommendation:** Filter in `/api/chat/messages` (centralized).

#### Implementation in api/chat/messages/route.ts

**Location:** After line 73 (before formatting messages)

```typescript
// After line 73: messages filtered by afterId

// DEDUPLICATION LOGIC: Remove duplicate queue messages
const QUEUE_MESSAGE_PATTERNS = [
  'All AI specialists are helping other homeowners',
  'AI specialists are helping',
  'connect you as soon as one is free'
]

const seenQueueMessages = new Set<string>()
messages = messages.filter((msg: any, index: number) => {
  // Check if this is a queue message
  const isQueueMessage = QUEUE_MESSAGE_PATTERNS.some(pattern =>
    msg.content?.includes(pattern)
  )

  if (isQueueMessage) {
    // Create unique key for this queue message
    const queueKey = `queue_${conversationId}_${msg.content.substring(0, 50)}`

    // If we've seen this exact queue message, filter it out
    if (seenQueueMessages.has(queueKey)) {
      console.log('🚫 Filtered duplicate queue message:', {
        messageId: msg.id,
        content: msg.content.substring(0, 50)
      })
      return false
    }

    // Mark as seen (keep first occurrence)
    seenQueueMessages.add(queueKey)
    return true
  }

  // Keep all non-queue messages
  return true
})
```

**Alternative: Stricter Deduplication by message_type**

```typescript
// Track seen messages by content hash
const seenMessages = new Map<string, any>()

messages = messages.filter((msg: any) => {
  // Create fingerprint: content + message_type
  const fingerprint = `${msg.content}_${msg.message_type}`

  // If exact duplicate exists, check which to keep
  if (seenMessages.has(fingerprint)) {
    const existing = seenMessages.get(fingerprint)

    // RULE: Prefer message_type: 2 (activity) over message_type: 'incoming'
    if (msg.message_type === 2 && existing.message_type !== 2) {
      // Replace existing with this one
      seenMessages.set(fingerprint, msg)
      return false // Filter out existing (will be re-added)
    }

    // Otherwise filter this duplicate
    console.log('🚫 Filtered duplicate message:', {
      messageId: msg.id,
      existingId: existing.id,
      content: msg.content.substring(0, 50)
    })
    return false
  }

  // First occurrence - keep it
  seenMessages.set(fingerprint, msg)
  return true
})
```

**RECOMMENDATION: First approach (pattern-based)**
- Safer (only filters known queue messages)
- Won't accidentally filter legitimate duplicate messages (e.g., user says "yes" twice)
- Easy to extend with more patterns

**#LCL_EXPORT_FIRM: implementation_logic::message_deduplication**

---

## Data Flow Map: Broker Assignment to Greeting

**#LCL_EXPORT_CRITICAL: data_flow::broker_assignment_to_greeting**

```
┌─────────────────────────────────────────────────────────────┐
│ USER SUBMITS FORM                                            │
│ POST /api/chatwoot-conversation                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ chatwoot-conversation/route.ts                              │
│                                                              │
│ 1. Calculate FALLBACK persona (line 170)                    │
│    → brokerPersona = {                                      │
│        name: "Dr. Elena Rodriguez",                         │
│        type: "aggressive"                                   │
│      }                                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Store in processedLeadData (line 179-194)                │
│    → processedLeadData = {                                  │
│        brokerPersona: { name: "Dr. Elena...", type: "..." },│
│        ...                                                   │
│      }                                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create Chatwoot conversation (line 273)                  │
│    → conversation = { id: 12345 }                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ASSIGN REAL BROKER from Supabase                         │
│    lib/ai/broker-assignment.ts:assignBestBroker()           │
│                                                              │
│    Query: SELECT * FROM ai_brokers                          │
│           WHERE is_active = true                            │
│           AND is_available = true                           │
│           AND personality_type = 'balanced'                 │
│                                                              │
│    Returns: {                                               │
│      id: "uuid-123",                                        │
│      name: "Sarah Wong",                                    │
│      personality_type: "balanced",                          │
│      slug: "sarah-wong"                                     │
│    }                                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 🔴 CRITICAL STEP: UPDATE PERSONA (NEW!)                  │
│    chatwoot-conversation/route.ts (BEFORE line 287)         │
│                                                              │
│    if (assignedBroker) {                                    │
│      processedLeadData.brokerPersona.name = "Sarah Wong"    │
│      processedLeadData.brokerPersona.type = "balanced"      │
│    }                                                         │
│                                                              │
│    NOW processedLeadData has CORRECT broker!                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Call broker engagement (line 287)                        │
│    brokerEngagementManager.handleNewConversation({          │
│      processedLeadData  ← Contains "Sarah Wong" now         │
│    })                                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. broker-engagement-manager.ts:handleNewConversation()     │
│                                                              │
│    Line 41: assignBestBroker() again?                       │
│    🔴 WAIT! We already assigned broker in step 4!           │
│    🔴 PROBLEM: Calling assignBestBroker() TWICE             │
│                                                              │
│    Solution: Pass assignedBroker as parameter OR            │
│              Skip re-assignment if already assigned          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. announceBrokerJoin()                                     │
│    broker-engagement-manager.ts:116-176                     │
│                                                              │
│    Lines 124-125: Belt-and-suspenders persona update        │
│    context.processedLeadData.brokerPersona.name = broker.name│
│                                                              │
│    Line 127: updateConversationCustomAttributes({           │
│      ai_broker_name: "Sarah Wong"                           │
│    })                                                        │
│                                                              │
│    Line 135: createActivityMessage(                         │
│      "Sarah Wong is reviewing your details..."              │
│    )                                                         │
│                                                              │
│    Line 140: await delay(2000)  ← NEW! Synchronous wait     │
│                                                              │
│    Line 149: createActivityMessage(                         │
│      "Sarah Wong joined the conversation."                  │
│    )                                                         │
│                                                              │
│    Line 160: sendInitialMessage()                           │
│      → Uses processedLeadData.brokerPersona.name            │
│      → Generates: "Good morning John! I'm Sarah Wong..."    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. chatwoot-client.ts:sendInitialMessage()                  │
│    Line 372: sendInitialMessage(conversationId, leadData)   │
│                                                              │
│    Line 424: generateInitialMessage(leadData)               │
│      → Reads: leadData.brokerPersona.name = "Sarah Wong"    │
│      → Generates greeting with correct broker name          │
│                                                              │
│    Line 376: POST to Chatwoot /messages endpoint            │
│      Body: {                                                │
│        content: "Good morning John! I'm Sarah Wong...",     │
│        message_type: 1,  // outgoing                        │
│        sender: { type: 'agent' }                            │
│      }                                                       │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Return API response                                     │
│     chatwoot-conversation/route.ts:335-373                  │
│                                                              │
│     Response: {                                             │
│       success: true,                                        │
│       conversationId: 12345,                                │
│       widgetConfig: {                                       │
│         customAttributes: {                                 │
│           ai_broker_name: "Sarah Wong",  ← CORRECT!         │
│           ai_broker_id: "uuid-123",                         │
│           broker_persona: "balanced",                       │
│           broker_status: "engaged"                          │
│         }                                                    │
│       }                                                      │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight: Double Assignment Problem**

The flow calls `assignBestBroker()` TWICE:
1. In `chatwoot-conversation/route.ts` (implicitly via handleNewConversation)
2. In `broker-engagement-manager.ts:41` (explicitly)

**Solution:**
Refactor to avoid double assignment. Either:
- **Option A:** Pass `assignedBroker` as parameter to `handleNewConversation()`
- **Option B:** Move broker assignment entirely into `handleNewConversation()` (remove from route.ts)

**RECOMMENDATION: Option A** (pass as parameter)
- Keeps route.ts in control of broker assignment
- Makes dependency explicit
- Easier to test

---

## API Response Contract (for Frontend)

**#LCL_EXPORT_FIRM: api_contract::conversation_response_shape**

```typescript
// File: app/api/chatwoot-conversation/route.ts
// Response interface (already defined at line 64-82, needs update)

interface ChatwootConversationResponse {
  success: boolean
  conversationId: number
  widgetConfig: {
    baseUrl: string
    websiteToken: string
    conversationId: number
    locale: 'en'
    position: 'right'
    hideMessageBubble: boolean
    customAttributes: {
      // Core broker assignment attributes
      ai_broker_id: string          // Supabase UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
      ai_broker_name: string         // Real broker name (e.g., "Sarah Wong") - NOT pre-selected persona
      broker_persona: string         // Personality type (e.g., "balanced", "aggressive", "conservative")
      broker_slug: string            // URL-safe slug (e.g., "sarah-wong")
      broker_status: 'assigned' | 'queued' | 'joining' | 'engaged'
      broker_join_eta?: number       // Seconds until broker joins (e.g., 2)
      broker_queue_position?: number // Position in queue if status='queued'

      // Lead attributes
      lead_score: number             // 0-100
      loan_type: string              // 'new_purchase' | 'refinance' | 'commercial'
      property_category: string      // 'resale' | 'new_launch' | 'bto' | 'commercial'
      monthly_income: number         // In SGD
      purchase_timeline: string      // 'immediate' | 'soon' | 'exploring'

      // Session metadata
      session_id: string             // Frontend session ID
      conversation_reused?: boolean  // True if existing conversation reused
      reuse_reason?: string          // Reason for reuse

      // Additional context
      employment_type: string
      property_price: number
      existing_commitments: number
      applicant_ages: number[]

      // Bot status (triggers n8n workflow)
      status: 'bot'
    }
  }
  error?: string
  fallback?: {
    type: 'phone' | 'email' | 'form'
    contact: string
    message: string
  }
}
```

**Validation Rules:**

1. **ai_broker_name MUST match Supabase broker name**
   ```typescript
   if (assignedBroker) {
     assert(response.widgetConfig.customAttributes.ai_broker_name === assignedBroker.name)
   }
   ```

2. **broker_status transitions:**
   - `queued` → No broker assigned (all busy)
   - `joining` → Broker assigned, reviewing message posted
   - `engaged` → Broker joined, greeting sent

3. **Conditional attributes:**
   - `broker_join_eta` → ONLY if `broker_status === 'joining'`
   - `broker_queue_position` → ONLY if `broker_status === 'queued'`

4. **Frontend sessionStorage contract:**
   ```typescript
   // Frontend will store:
   sessionStorage.setItem('chatwoot_session', JSON.stringify({
     conversationId: response.conversationId,
     broker: {
       id: response.widgetConfig.customAttributes.ai_broker_id,
       name: response.widgetConfig.customAttributes.ai_broker_name,
       status: response.widgetConfig.customAttributes.broker_status
     },
     timestamp: Date.now()
   }))
   ```

**Updated Response Logic (route.ts:335-373):**

```typescript
const response: ChatwootConversationResponse = {
  success: true,
  conversationId: conversation.id,
  widgetConfig: {
    ...widgetConfig,
    customAttributes: {
      // Broker assignment from Supabase (GUARANTEED correct after persona update)
      ai_broker_id: assignedBroker?.id || '',
      ai_broker_name: assignedBroker?.name || processedLeadData.brokerPersona.name,  // Fallback to pre-selected if no assignment
      broker_persona: assignedBroker?.personality_type || processedLeadData.brokerPersona.type,
      broker_slug: assignedBroker?.slug || '',
      broker_status: assignedBroker ? 'engaged' : 'queued',  // 'engaged' because greeting already sent
      broker_join_eta: undefined,  // Not needed, already joined
      broker_queue_position: queuePosition ?? undefined,

      // Lead attributes (unchanged)
      lead_score: leadScore,
      loan_type: sanitizedData.loanType,
      property_category: sanitizedData.propertyCategory || 'resale',
      monthly_income: formData.actualIncomes?.[0] || 0,
      purchase_timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',

      // Session metadata
      session_id: sessionId,
      conversation_reused: conversation.custom_attributes?.reused || false,
      reuse_reason: conversation.custom_attributes?.reuse_reason,

      // Additional context
      employment_type: sanitizedData.employmentType,
      property_price: formData.propertyPrice || formData.propertyValue || 0,
      existing_commitments: formData.existingCommitments || 0,
      applicant_ages: formData.actualAges,

      // Bot status
      status: 'bot'
    }
  }
}
```

**Key Changes:**
- `broker_status: 'engaged'` instead of `'joining'` (because messages already sent synchronously)
- Remove `broker_join_eta` (not needed, no async delay from client perspective)
- `ai_broker_name` guaranteed to match `assignedBroker.name` (updated before engagement)

---

## Enhanced Webhook Strategy

**#LCL_EXPORT_FIRM: integration_coordination::enhanced_webhook_disable**

**Current Problem:**
- `/api/chatwoot-enhanced-flow` webhook is active
- Randomly assigns brokers, overwriting Supabase assignments (line 87, 199-218)
- Posts duplicate messages (line 94, 103)
- Conflicts with new orchestration system

**Decision: DISABLE Enhanced Webhook**

### Rationale

1. **Duplicate Functionality**
   - Enhanced flow re-implements broker assignment
   - New system already handles assignment via Supabase
   - Two systems = inconsistent state

2. **Conflicts with Supabase**
   - Enhanced flow: Picks random broker from hardcoded list (line 199-218)
   - New system: Queries Supabase for optimal match
   - Enhanced flow OVERWRITES correct assignment

3. **Message Duplication**
   - Enhanced flow posts "joined" message (line 94)
   - New system posts same message synchronously
   - Result: Two "joined" messages

4. **Stale Broker Data**
   - Enhanced flow uses hardcoded `AI_BROKERS` object
   - Doesn't reflect Supabase `ai_brokers` table state
   - Can assign brokers that are inactive/unavailable

### Migration Steps

**Step 1: Identify Chatwoot Webhook Registration**
```bash
curl -X GET "https://chat.nextnest.sg/api/v1/accounts/1/webhooks" \
  -H "Api-Access-Token: ${CHATWOOT_API_TOKEN}"
```

**Step 2: Locate Enhanced Flow Webhook**
```json
{
  "payload": [
    {
      "id": 123,
      "url": "https://nextnest.sg/api/chatwoot-enhanced-flow",
      "subscriptions": [
        "conversation_created",
        "message_created"
      ]
    }
  ]
}
```

**Step 3: Delete Webhook**
```bash
curl -X DELETE "https://chat.nextnest.sg/api/v1/accounts/1/webhooks/123" \
  -H "Api-Access-Token: ${CHATWOOT_API_TOKEN}"
```

**Step 4: Verify Deletion**
```bash
curl -X GET "https://chat.nextnest.sg/api/v1/accounts/1/webhooks" \
  -H "Api-Access-Token: ${CHATWOOT_API_TOKEN}"
# Should NOT list enhanced-flow URL
```

**Step 5: Archive File (Don't Delete Yet)**
```bash
mkdir -p app/api/_archived
mv app/api/chatwoot-enhanced-flow app/api/_archived/chatwoot-enhanced-flow
```

**Rationale for archiving:**
- Keep code for reference
- Easy to restore if issues found
- Contains useful logic for future n8n workflows

**Step 6: Update Documentation**
Create `docs/runbooks/chatwoot-webhook-migration.md`:
```markdown
# Chatwoot Webhook Migration

## Date: 2025-10-01

### Change
Disabled `/api/chatwoot-enhanced-flow` webhook.

### Reason
- Conflicted with Supabase broker assignment
- Posted duplicate messages
- Used stale hardcoded broker data

### New System
All broker assignment now handled via:
- `lib/ai/broker-assignment.ts` (Supabase queries)
- `lib/engagement/broker-engagement-manager.ts` (message orchestration)
- Synchronous message posting (no setTimeout)

### Rollback Plan
1. Re-enable webhook: `POST /api/v1/accounts/1/webhooks`
2. Restore file: `mv app/api/_archived/chatwoot-enhanced-flow app/api/`
3. Disable new system: Set `DISABLE_BROKER_ASSIGNMENT=true`
```

**Step 7: Monitor for 48 Hours**
- Check logs for missing messages
- Verify broker assignments are correct
- Confirm no duplicate messages

**Rollback Triggers:**
- Broker greetings not appearing
- Incorrect broker names in messages
- Conversations stuck in "joining" status

### Alternative: Update Enhanced Webhook (NOT RECOMMENDED)

If disabling is not feasible, update to respect Supabase:

```typescript
// In chatwoot-enhanced-flow/route.ts:handleConversationCreated()

async function handleConversationCreated(event: any, state: any) {
  const { conversation } = event
  const attributes = conversation.custom_attributes || {}

  // 🔴 NEW: Check if broker already assigned from Supabase
  if (attributes.ai_broker_name && attributes.ai_broker_id) {
    console.log('✅ Broker already assigned from Supabase, skipping enhanced flow')
    state.brokerAssigned = true
    return  // EXIT EARLY, don't re-assign
  }

  // Only proceed if no broker assigned yet
  if (attributes.lead_score && !state.brokerAssigned) {
    // ... existing logic
  }
}
```

**Issues with this approach:**
- Still duplicates functionality
- Adds complexity (two code paths)
- Harder to debug (which system assigned broker?)

**RECOMMENDATION: Disable Entirely (Step 1-7)**

---

## Error Handling & Fallbacks

### Scenario 1: Supabase Assignment Fails

**Cause:** Database timeout, network error, no available brokers

**Detection:**
```typescript
const assignedBroker = await assignBestBroker(...)
if (!assignedBroker) {
  // Failure or no availability
}
```

**Fallback:**
```typescript
// In chatwoot-conversation/route.ts (after line 287)

if (!assignedBroker) {
  console.warn('⚠️ No broker available, using pre-selected persona')

  // Keep fallback persona (already set at line 170)
  // processedLeadData.brokerPersona = { name: "Dr. Elena Rodriguez", ... }

  // Post queue message via engagement manager
  const engagementResult = await brokerEngagementManager.handleNewConversation({
    conversationId: conversation.id,
    leadScore,
    loanType: sanitizedData.loanType,
    propertyCategory: sanitizedData.propertyCategory || 'resale',
    monthlyIncome: formData.actualIncomes?.[0] || 0,
    timeline: formData.loanType === 'refinance' ? 'immediate' : 'soon',
    processedLeadData,  // Uses fallback persona
    sessionId
  })
  // handleNewConversation will post queue message and return { status: 'queued' }

  // DON'T send greeting (no broker to greet from)
  // DON'T update conversation attributes with broker_status: 'engaged'
}
```

**User Experience:**
- User sees: "All AI specialists are helping other homeowners..."
- No broker greeting message
- Frontend shows queue position
- When broker becomes available, queue processing assigns them

**API Response:**
```typescript
{
  success: true,
  conversationId: 12345,
  widgetConfig: {
    customAttributes: {
      ai_broker_name: '',  // Empty (no assignment)
      broker_status: 'queued',
      broker_queue_position: 3
    }
  }
}
```

---

### Scenario 2: Chatwoot API Timeout

**Cause:** Chatwoot server slow, network issues, rate limiting

**Detection:**
```typescript
try {
  await chatwootClient.createActivityMessage(...)
} catch (error) {
  // Chatwoot API failure
}
```

**Fallback:**
```typescript
// In chatwoot-conversation/route.ts:376-418 (existing circuit breaker)

catch (chatwootError: any) {
  console.error('⚠️ Chatwoot API error:', chatwootError?.message || chatwootError)

  // Check circuit breaker status
  if (chatwootError?.message?.includes('Circuit breaker')) {
    console.log('🚫 Circuit breaker is OPEN - returning fallback')

    // Return phone fallback
    const fallback = ChatwootCircuitBreaker.fallbackResponse()
    return NextResponse.json({
      success: false,
      conversationId: 0,
      widgetConfig: { /* empty config */ },
      fallback: {
        type: 'phone',
        contact: process.env.CHAT_FALLBACK_PHONE || '+6583341445',
        message: 'Chat temporarily unavailable. Please call us directly for immediate assistance.'
      }
    }, { status: 200 })  // Return 200, not 503 (frontend handles gracefully)
  }
}
```

**User Experience:**
- User sees: "Chat service temporarily unavailable"
- Displays phone number: "+65 8334 1445"
- Call-to-action: "Call us for immediate assistance"
- No conversation created (conversationId: 0)

**Circuit Breaker Settings:**
```typescript
// In lib/patterns/circuit-breaker.ts
{
  failureThreshold: 3,      // Open after 3 failures
  resetTimeout: 60000,      // Try again after 60s
  halfOpenRequests: 2       // Test with 2 requests before closing
}
```

---

### Scenario 3: Message Posting Fails Midway

**Cause:** Chatwoot API fails AFTER "reviewing" message posted, BEFORE "joined" message

**Detection:**
```typescript
// In broker-engagement-manager.ts:announceBrokerJoin()

await chatwootClient.createActivityMessage(
  context.conversationId,
  `${broker.name} is reviewing your details...`
)  // ✅ SUCCESS

await new Promise(resolve => setTimeout(resolve, 2000))

await chatwootClient.createActivityMessage(
  context.conversationId,
  `${broker.name} joined the conversation.`
)  // ❌ FAILURE - Timeout!
```

**Result:**
- User sees "reviewing" message
- Never sees "joined" message
- Greeting message also fails
- Conversation stuck in "joining" status

**Mitigation:**
```typescript
async function announceBrokerJoin(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord
): Promise<number> {
  try {
    // Message 1: Reviewing
    await chatwootClient.createActivityMessage(
      context.conversationId,
      `${broker.name} is reviewing your details and will join the chat shortly.`
    )

    // Wait
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Message 2: Joined
    await chatwootClient.createActivityMessage(
      context.conversationId,
      `${broker.name} joined the conversation.`
    )

    // Update status
    await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
      broker_status: 'engaged'
    })

    // Message 3: Greeting
    await chatwootClient.sendInitialMessage(
      context.conversationId,
      context.processedLeadData
    )

    return 2
  } catch (error) {
    console.error('❌ Message sequence failed:', error)

    // FALLBACK: Update status to 'engaged' even if messages failed
    // This prevents conversation from being stuck in 'joining'
    try {
      await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
        broker_status: 'engaged',
        message_sequence_failed: true,
        failure_timestamp: new Date().toISOString()
      })
    } catch (updateError) {
      console.error('❌ Failed to update status after message failure:', updateError)
    }

    // Re-throw to trigger route.ts fallback response
    throw error
  }
}
```

**User Experience:**
- If "reviewing" posted but "joined" failed:
  - User sees "reviewing" message indefinitely
  - No greeting message
  - Conversation status set to 'engaged' (allows user to send messages)
  - Broker can still respond manually

- If ALL messages fail:
  - Circuit breaker triggers
  - User sees phone fallback
  - Conversation not created

**Monitoring Alert:**
```typescript
if (attributes.message_sequence_failed) {
  // Alert: "Message sequence failed for conversation {id}"
  // Action: Manual review needed
}
```

---

### Scenario 4: n8n Webhook Fails (If Path A Chosen)

**Cause:** n8n server down, webhook URL unreachable, timeout

**Detection:**
```typescript
const response = await fetch('https://n8n.nextnest.sg/webhook/broker-join', {
  method: 'POST',
  body: JSON.stringify({ conversationId, brokerName }),
  timeout: 5000  // 5s timeout
})

if (!response.ok) {
  // n8n webhook failed
}
```

**Fallback:**
```typescript
// In broker-engagement-manager.ts (if using n8n)

async function announceBrokerJoin(...) {
  try {
    // Try n8n webhook first
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        conversationId: context.conversationId,
        brokerName: broker.name,
        delaySeconds: 5
      }),
      timeout: 5000
    })

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`)
    }

    console.log('✅ n8n webhook triggered, messages will be posted asynchronously')
    return 5  // Estimated delay

  } catch (n8nError) {
    console.warn('⚠️ n8n webhook failed, falling back to synchronous posting:', n8nError)

    // FALLBACK: Post messages synchronously (Path B)
    await chatwootClient.createActivityMessage(
      context.conversationId,
      `${broker.name} is reviewing your details...`
    )
    await new Promise(resolve => setTimeout(resolve, 2000))
    await chatwootClient.createActivityMessage(
      context.conversationId,
      `${broker.name} joined the conversation.`
    )
    await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)

    return 2  // Actual delay
  }
}
```

**Monitoring:**
- Alert if n8n fallback triggered >5 times in 10 minutes
- Dashboard: n8n webhook success rate
- Action: Check n8n server health, restart if needed

**Rollback Plan:**
1. Set `DISABLE_N8N_WEBHOOKS=true` in env vars
2. Code automatically uses synchronous fallback
3. No deployment needed (graceful degradation)

---

## Testing Strategy

**#LCL_EXPORT_FIRM: testing_strategy::orchestration_validation**

### Unit Tests

**File:** `lib/engagement/__tests__/broker-engagement-manager.test.ts`

```typescript
import { brokerEngagementManager } from '../broker-engagement-manager'
import { ChatwootClient } from '@/lib/integrations/chatwoot-client'

// Mock Chatwoot client
jest.mock('@/lib/integrations/chatwoot-client')
jest.mock('@/lib/ai/broker-assignment')

describe('BrokerEngagementManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('announceBrokerJoin', () => {
    it('posts messages in correct order', async () => {
      const mockChatwoot = new ChatwootClient()
      const mockBroker = {
        id: 'broker-123',
        name: 'Sarah Wong',
        personality_type: 'balanced'
      }

      const context = {
        conversationId: 12345,
        leadScore: 75,
        loanType: 'new_purchase',
        processedLeadData: {
          brokerPersona: { name: 'Fallback', type: 'balanced' }
        }
      }

      await brokerEngagementManager['announceBrokerJoin'](
        mockChatwoot,
        context,
        mockBroker
      )

      // Verify message order
      expect(mockChatwoot.createActivityMessage).toHaveBeenNthCalledWith(
        1,
        12345,
        'Sarah Wong is reviewing your details and will join the chat shortly.'
      )

      expect(mockChatwoot.createActivityMessage).toHaveBeenNthCalledWith(
        2,
        12345,
        'Sarah Wong joined the conversation.'
      )

      expect(mockChatwoot.sendInitialMessage).toHaveBeenCalledWith(
        12345,
        expect.objectContaining({
          brokerPersona: expect.objectContaining({
            name: 'Sarah Wong'
          })
        })
      )
    })

    it('updates persona before sending messages', async () => {
      const mockChatwoot = new ChatwootClient()
      const mockBroker = {
        id: 'broker-123',
        name: 'Michelle Chen',
        personality_type: 'aggressive'
      }

      const context = {
        conversationId: 12345,
        processedLeadData: {
          brokerPersona: { name: 'Dr. Elena Rodriguez', type: 'balanced' }
        }
      }

      await brokerEngagementManager['announceBrokerJoin'](
        mockChatwoot,
        context,
        mockBroker
      )

      // Verify persona was updated BEFORE sendInitialMessage
      expect(context.processedLeadData.brokerPersona.name).toBe('Michelle Chen')
      expect(context.processedLeadData.brokerPersona.type).toBe('aggressive')
    })

    it('waits 2 seconds between reviewing and joined messages', async () => {
      jest.useFakeTimers()
      const mockChatwoot = new ChatwootClient()

      const promise = brokerEngagementManager['announceBrokerJoin'](
        mockChatwoot,
        { conversationId: 123, processedLeadData: {} },
        { name: 'Sarah Wong' }
      )

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000)
      await promise

      expect(mockChatwoot.createActivityMessage).toHaveBeenCalledTimes(2)
      jest.useRealTimers()
    })
  })

  describe('handleNewConversation', () => {
    it('posts queue message when no broker available', async () => {
      const mockAssignBestBroker = require('@/lib/ai/broker-assignment').assignBestBroker
      mockAssignBestBroker.mockResolvedValue(null)  // No broker

      const result = await brokerEngagementManager.handleNewConversation({
        conversationId: 123,
        leadScore: 50,
        loanType: 'refinance',
        processedLeadData: {}
      })

      expect(result.status).toBe('queued')
      expect(ChatwootClient.prototype.createActivityMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('All AI specialists are helping')
      )
    })

    it('does NOT post queue message when broker assigned', async () => {
      const mockAssignBestBroker = require('@/lib/ai/broker-assignment').assignBestBroker
      mockAssignBestBroker.mockResolvedValue({
        id: 'broker-123',
        name: 'Sarah Wong'
      })

      await brokerEngagementManager.handleNewConversation({
        conversationId: 123,
        leadScore: 75,
        processedLeadData: {}
      })

      // Should NOT call createActivityMessage with queue text
      const calls = ChatwootClient.prototype.createActivityMessage.mock.calls
      const queueCalls = calls.filter(call => call[1].includes('All AI specialists'))
      expect(queueCalls).toHaveLength(0)
    })
  })
})
```

---

### Integration Tests

**File:** `app/api/chatwoot-conversation/__tests__/route.integration.test.ts`

```typescript
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock external services
jest.mock('@/lib/db/supabase-client')
jest.mock('@/lib/integrations/chatwoot-client')

describe('POST /api/chatwoot-conversation', () => {
  it('updates persona BEFORE calling engagement manager', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/chatwoot-conversation', {
      method: 'POST',
      body: JSON.stringify({
        formData: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+6591234567',
          loanType: 'new_purchase',
          actualIncomes: [10000],
          actualAges: [35]
        },
        sessionId: 'session-123',
        leadScore: 75
      })
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    // Verify ai_broker_name matches assigned broker, not pre-selected persona
    expect(data.widgetConfig.customAttributes.ai_broker_name).not.toBe('Dr. Elena Rodriguez')
    expect(data.widgetConfig.customAttributes.ai_broker_name).toBe('Sarah Wong')  // From Supabase
  })

  it('returns correct broker_status when assigned', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/chatwoot-conversation', {
      method: 'POST',
      body: JSON.stringify({
        formData: { /* valid data */ },
        sessionId: 'session-123',
        leadScore: 75
      })
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(data.widgetConfig.customAttributes.broker_status).toBe('engaged')
    expect(data.widgetConfig.customAttributes.ai_broker_id).toBeDefined()
  })

  it('returns queued status when no broker available', async () => {
    // Mock all brokers busy
    const mockAssignBestBroker = require('@/lib/ai/broker-assignment').assignBestBroker
    mockAssignBestBroker.mockResolvedValue(null)

    const mockRequest = new NextRequest('http://localhost:3000/api/chatwoot-conversation', {
      method: 'POST',
      body: JSON.stringify({
        formData: { /* valid data */ },
        sessionId: 'session-123',
        leadScore: 50
      })
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(data.widgetConfig.customAttributes.broker_status).toBe('queued')
    expect(data.widgetConfig.customAttributes.broker_queue_position).toBeGreaterThan(0)
  })
})
```

---

### E2E Tests (Playwright)

**File:** `tests/e2e/broker-assignment.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Broker Assignment Flow', () => {
  test('shows correct broker name in greeting', async ({ page }) => {
    // Fill form
    await page.goto('http://localhost:3000/apply')
    await page.fill('[name="name"]', 'John Doe')
    await page.fill('[name="email"]', 'john@example.com')
    await page.fill('[name="phone"]', '+6591234567')
    await page.selectOption('[name="loanType"]', 'new_purchase')
    await page.fill('[name="actualIncomes[0]"]', '10000')
    await page.click('button[type="submit"]')

    // Wait for chat transition
    await page.waitForSelector('[data-testid="chat-widget"]')

    // Wait for messages to load
    await page.waitForTimeout(3000)

    // Verify broker name consistency
    const greetingMessage = page.locator('[data-role="agent"]').first()
    const greetingText = await greetingMessage.textContent()

    expect(greetingText).toMatch(/I'm (Sarah Wong|Michelle Chen|Rachel Tan)/)

    // Extract broker name from greeting
    const brokerName = greetingText.match(/I'm ([^,]+)/)?.[1]

    // Verify same name appears in widget header
    const widgetHeader = page.locator('[data-testid="chat-header"]')
    await expect(widgetHeader).toContainText(brokerName)
  })

  test('shows messages in correct order', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')
    // ... fill form ...
    await page.click('button[type="submit"]')

    await page.waitForSelector('[data-testid="chat-widget"]')

    // Wait for all messages
    await page.waitForTimeout(5000)

    const messages = page.locator('[data-testid="message"]')
    const messageTexts = await messages.allTextContents()

    // Expected order:
    // 1. "Sarah Wong is reviewing your details..."
    // 2. "Sarah Wong joined the conversation"
    // 3. "Good morning John! I'm Sarah Wong..."

    expect(messageTexts[0]).toMatch(/is reviewing your details/)
    expect(messageTexts[1]).toMatch(/joined the conversation/)
    expect(messageTexts[2]).toMatch(/Good morning|Good afternoon|Good evening/)
  })

  test('shows queue message when no brokers available', async ({ page }) => {
    // Mock Supabase to return no brokers
    await page.route('**/rest/v1/ai_brokers*', route => {
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    })

    await page.goto('http://localhost:3000/apply')
    // ... fill form ...
    await page.click('button[type="submit"]')

    await page.waitForSelector('[data-testid="chat-widget"]')

    const queueMessage = page.locator('[data-role="system"]').first()
    await expect(queueMessage).toContainText('All AI specialists are helping')
  })
})
```

---

### Load Tests (Artillery)

**File:** `tests/load/broker-assignment.yml`

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5  # 5 conversations per second
      name: "Sustained load"
    - duration: 30
      arrivalRate: 20  # Spike to 20/s
      name: "Peak traffic"
  processor: "./load-test-processor.js"

scenarios:
  - name: "Complete form and assign broker"
    flow:
      - post:
          url: "/api/chatwoot-conversation"
          json:
            formData:
              name: "Load Test User {{ $randomString() }}"
              email: "loadtest{{ $randomNumber() }}@example.com"
              phone: "+659{{ $randomNumber(1000000, 9999999) }}"
              loanType: "new_purchase"
              actualIncomes: [10000]
              actualAges: [35]
              employmentType: "employed"
              loanType: "new_purchase"
              propertyCategory: "resale"
            sessionId: "session-{{ $randomString() }}"
            leadScore: "{{ $randomNumber(40, 100) }}"
          capture:
            - json: "$.conversationId"
              as: "conversationId"
            - json: "$.widgetConfig.customAttributes.ai_broker_name"
              as: "brokerName"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: "success"
            - hasProperty: "conversationId"

      - get:
          url: "/api/chat/messages?conversation_id={{ conversationId }}"
          expect:
            - statusCode: 200
            - hasProperty: "messages"

      - think: 2  # Wait 2 seconds

      - post:
          url: "/api/chat/messages"
          json:
            conversation_id: "{{ conversationId }}"
            message: "What are the current rates?"
          expect:
            - statusCode: 200
```

**Assertions:**
- p95 response time <3s for conversation creation
- p99 response time <5s
- 0% timeout errors (all messages posted successfully)
- Broker name consistency: 100% match between API response and greeting message

---

### Manual Testing Checklist

**Before Deployment:**

- [ ] Create conversation with available broker
  - [ ] "Reviewing" message appears within 1s
  - [ ] "Joined" message appears after ~2s
  - [ ] Greeting message appears immediately after "joined"
  - [ ] Broker name in greeting matches `ai_broker_name` in attributes

- [ ] Create conversation when all brokers busy
  - [ ] Queue message appears: "All AI specialists are helping..."
  - [ ] NO "joined" message
  - [ ] NO greeting message
  - [ ] `broker_status: 'queued'` in API response

- [ ] Verify no duplicate queue messages
  - [ ] Check Chatwoot UI: Only ONE queue message visible
  - [ ] Check `/api/chat/messages`: Only ONE queue message in response

- [ ] Test Supabase assignment
  - [ ] High lead score (80+) assigns aggressive broker (Michelle Chen)
  - [ ] Medium lead score (60-79) assigns balanced broker (Sarah Wong)
  - [ ] Low lead score (<60) assigns conservative broker (Grace Lim)

- [ ] Test enhanced webhook disabled
  - [ ] Check Chatwoot webhooks list: `/api/chatwoot-enhanced-flow` NOT present
  - [ ] Create conversation: Broker name does NOT randomly change
  - [ ] No duplicate "joined" messages

- [ ] Test error handling
  - [ ] Simulate Supabase timeout: Fallback persona used
  - [ ] Simulate Chatwoot timeout: Phone fallback displayed
  - [ ] Simulate message posting failure: Conversation status updates to 'engaged' anyway

---

## Implementation Checklist

**Phase 1: Persona Timing Fix**

- [ ] Update `chatwoot-conversation/route.ts`:
  - [ ] Move broker assignment BEFORE `handleNewConversation()` call
  - [ ] Update `processedLeadData.brokerPersona` with real broker name
  - [ ] Remove lines 318-321 (obsolete persona update)

**Phase 2: Replace setTimeout with Synchronous Wait**

- [ ] Update `broker-engagement-manager.ts:announceBrokerJoin()`:
  - [ ] Remove setTimeout logic (lines 140-167)
  - [ ] Replace with synchronous `await new Promise(resolve => setTimeout(resolve, 2000))`
  - [ ] Post messages in sequence: reviewing → wait → joined → greeting
  - [ ] Remove `pendingTimers` Map (no longer needed)
  - [ ] Remove `unref()` call (lines 169-171)

**Phase 3: Message Deduplication**

- [ ] Update `api/chat/messages/route.ts`:
  - [ ] Add deduplication logic after line 73
  - [ ] Filter duplicate queue messages by content pattern
  - [ ] Log filtered messages for monitoring

**Phase 4: Disable Enhanced Webhook**

- [ ] Delete Chatwoot webhook registration for `/api/chatwoot-enhanced-flow`
- [ ] Archive `app/api/chatwoot-enhanced-flow` directory
- [ ] Create migration runbook in `docs/runbooks/`
- [ ] Update `.env.example` with any new variables

**Phase 5: Update API Response Contract**

- [ ] Verify `widgetConfig.customAttributes` matches frontend contract
- [ ] Ensure `broker_status: 'engaged'` (not 'joining')
- [ ] Test response shape in integration tests

**Phase 6: Testing**

- [ ] Run unit tests: `npm run test lib/engagement`
- [ ] Run integration tests: `npm run test app/api/chatwoot-conversation`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Load test: `npm run test:load`
- [ ] Manual testing checklist (see above)

**Phase 7: Monitoring & Rollback Plan**

- [ ] Add metrics: broker assignment success rate
- [ ] Add metrics: message sequence completion rate
- [ ] Add alerts: Supabase query time >1s
- [ ] Add alerts: Chatwoot API timeout rate >5%
- [ ] Document rollback procedure

---

## Uncertainties

**#PLAN_UNCERTAINTY: Synchronous Wait Acceptability**

- **Question:** Is 2-second synchronous wait acceptable for UX?
- **Trade-off:** Reliability (guaranteed delivery) vs. responsiveness (faster API response)
- **Recommendation:** Start with 2s, monitor user feedback, reduce to 1s if complaints
- **Mitigation:** Add loading state with progress indicator on frontend

**#PLAN_UNCERTAINTY: Enhanced Webhook Dependencies**

- **Question:** Are there any n8n workflows depending on `/api/chatwoot-enhanced-flow` webhook?
- **Risk:** Disabling webhook might break downstream automation
- **Validation:** Check n8n workflows for any HTTP Request nodes pointing to this URL
- **Mitigation:** Search n8n workflows for "chatwoot-enhanced-flow" before disabling

**#PLAN_UNCERTAINTY: Message Deduplication Side Effects**

- **Question:** Could deduplication filter legitimate duplicate user messages?
- **Example:** User accidentally sends "yes" twice, second message filtered
- **Risk:** Low (deduplication only targets queue activity messages)
- **Mitigation:** Scope deduplication to specific message patterns, not all duplicates

**#PLAN_UNCERTAINTY: Broker Reassignment Logic**

- **Question:** Should `handleNewConversation()` call `assignBestBroker()` again, or reuse passed broker?
- **Current:** Calls `assignBestBroker()` twice (route.ts line 287 + engagement-manager.ts line 41)
- **Recommendation:** Refactor to avoid double assignment (pass broker as parameter)
- **Complexity:** Medium (requires function signature change)

---

## Summary of Recommendations

### 1. Join Message Delivery
**✅ RECOMMENDED: Path B (Synchronous Wait)**
- Replace setTimeout with 2-second synchronous wait
- Post messages sequentially in single async chain
- Guaranteed delivery, no external dependencies

### 2. Persona Timing
**✅ RECOMMENDED: Path A (Assign Before)**
- Call `assignBestBroker()` BEFORE `handleNewConversation()`
- Update `processedLeadData.brokerPersona` immediately after assignment
- Remove obsolete persona update on line 318-321

### 3. Message Deduplication
**✅ RECOMMENDED: Pattern-Based Filtering**
- Add deduplication in `/api/chat/messages/route.ts`
- Filter by queue message content patterns
- Keep first occurrence, filter subsequent duplicates

### 4. Enhanced Webhook
**✅ RECOMMENDED: Disable Entirely**
- Delete Chatwoot webhook registration
- Archive `/api/chatwoot-enhanced-flow` code
- Document in runbook with rollback procedure

### 5. Broker Reassignment
**⚠️ NEEDS REFACTOR: Avoid Double Assignment**
- Current code calls `assignBestBroker()` twice
- Refactor to pass broker as parameter to `handleNewConversation()`
- OR skip second assignment if broker already set

---

## Files Requiring Changes

1. **`app/api/chatwoot-conversation/route.ts`** (479 lines)
   - Lines 287-321: Move broker assignment before handleNewConversation
   - Update persona immediately after assignment

2. **`lib/engagement/broker-engagement-manager.ts`** (186 lines)
   - Lines 116-176: Replace setTimeout with synchronous wait
   - Remove pendingTimers Map (lines 36-37, 71-75, 165, 173)
   - Update message posting sequence

3. **`app/api/chat/messages/route.ts`** (144 lines)
   - After line 73: Add deduplication logic

4. **Chatwoot Admin Panel**
   - Delete webhook pointing to `/api/chatwoot-enhanced-flow`

5. **`app/api/chatwoot-enhanced-flow/route.ts`** (406 lines)
   - Archive entire directory to `app/api/_archived/`

6. **New file: `docs/runbooks/chatwoot-webhook-migration.md`**
   - Document migration steps and rollback procedure

---

## Next Steps for Synthesis Agent

The synthesis agent should:

1. **Implement persona timing fix** (highest priority)
   - Ensures correct broker name in all messages
   - Blocks other fixes from working correctly

2. **Replace setTimeout with synchronous wait**
   - Fixes dropped join messages
   - Enables message sequence to complete

3. **Add message deduplication**
   - Prevents duplicate queue messages in UI
   - Low risk, high user-facing impact

4. **Disable enhanced webhook**
   - Coordinate with infra team to delete webhook
   - Archive code, don't delete (reversible)

5. **Run full test suite**
   - Verify persona consistency
   - Verify message order
   - Verify no duplicates

6. **Monitor for 24-48 hours**
   - Check broker assignment success rate
   - Check message sequence completion rate
   - Check for user reports of missing messages

**Critical Success Metrics:**
- Broker name consistency: 100% (greeting matches attributes)
- Message sequence completion: >99% (all 3 messages appear)
- Duplicate queue messages: 0% (only one instance in UI)
- API response time p95: <4s (acceptable with 2s wait)

---

**#LCL_EXPORT_CRITICAL: implementation_priority_order**

1. Persona timing fix (route.ts)
2. Synchronous wait (broker-engagement-manager.ts)
3. Message deduplication (api/chat/messages)
4. Disable enhanced webhook (Chatwoot admin + archive code)
5. Testing + monitoring

**End of Plan**
