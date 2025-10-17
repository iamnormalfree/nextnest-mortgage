# Webhook Echo Detection & Deduplication Plan

## Problem Statement

**User-Reported Issue:** "When a user types an answer, the same templated message appears on right side (User side) and then re-appears on bot message side again (left side)"

**Root Cause Analysis:**
1. **Webhook Echo Loop**: Chatwoot sends outgoing bot messages BACK as incoming user messages
2. **Missing Send-Side Deduplication**: No tracking when messages are sent, allowing echoes to bypass existing filters
3. **Content-Based Duplication**: Different message IDs but identical content slips through ID-only deduplication
4. **Potential Double Webhook Configuration**: Both inbox-level and bot-level webhooks may be firing

**Impact:**
- Same message appears 3 times in conversation (outgoing → echoed as incoming → re-sent as outgoing)
- Poor user experience
- n8n AI broker receives duplicate webhook events
- Wasted API calls to OpenAI
- Confusion in conversation history

---

## Current Implementation Analysis

### File: `app/api/chatwoot-webhook/route.ts`

**Existing Deduplication (Lines 54-60):**
```typescript
const messageId = event.id?.toString() || `${event.conversation?.id}-${event.content}-${Date.now()}`;
if (processedMessages.has(messageId)) {
  console.log('⏭️ Skipping duplicate webhook for message:', messageId);
  return NextResponse.json({ received: true, skipped: 'duplicate' });
}
processedMessages.add(messageId);
```

**Problems with Current Approach:**
1. **Relies on `event.id`**: Chatwoot may assign different IDs to echoed messages
2. **Fallback includes `Date.now()`**: Makes same content appear unique across requests
3. **No content fingerprinting**: Identical messages with different IDs pass through
4. **5-minute TTL cleanup (lines 9-11)**: Too aggressive, may miss rapid echoes within cleanup window

**Existing Outgoing Filter (Lines 49-52):**
```typescript
if (isOutgoingMessage) {
  console.log('⏭️ Skipping outgoing message to prevent loop');
  return NextResponse.json({ received: true, skipped: 'outgoing message' });
}
```

**Problem:**
- Works IF Chatwoot correctly labels echoed messages as `message_type: 1` (outgoing)
- FAILS if Chatwoot re-labels echoed bot messages as `message_type: 0` (incoming)
- Evidence suggests the latter is happening (user sees bot message on "User side")

**Cache Management (Lines 6-11):**
```typescript
const processedMessages = new Set<string>();

setInterval(() => {
  processedMessages.clear();
}, 5 * 60 * 1000);
```

**Problems:**
1. **Single global Set**: No per-conversation isolation
2. **Complete flush every 5 min**: Loses all echo detection state abruptly
3. **No bot-message-specific tracking**: Mixes user messages and bot echoes
4. **No size limit**: Could grow unbounded in high-traffic scenarios

---

## Proposed Solutions

### Solution 1: Enhanced Content Fingerprinting

#PATH_DECISION: **Hybrid Approach (Option B + Option C)** - Full content SHA-256 hash with semantic normalization

**Rationale:**
- **Option A (first 200 chars)**: Too prone to false positives (e.g., "Hi there! Let me help you..." variations)
- **Option B (full SHA-256)**: Strong collision resistance, captures full content
- **Option C (semantic normalization)**: Prevents whitespace/case variations from bypassing detection

**Chosen Approach: B + C (Normalize then Hash)**

**Implementation Details:**

```typescript
// Location: app/api/chatwoot-webhook/route.ts (after line 11)

import crypto from 'crypto'

/**
 * Generate semantic content fingerprint
 * Normalizes whitespace and case before hashing to catch near-duplicates
 */
function generateMessageFingerprint(conversationId: number, content: string, messageType: number | string): string {
  // Semantic normalization
  const normalized = content
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces to single space
    .replace(/[\r\n]+/g, '\n') // Normalize line breaks

  // Full content hash with conversation context
  const composite = `${conversationId}:${messageType}:${normalized}`
  const hash = crypto.createHash('sha256').update(composite).digest('hex')

  return `${conversationId}-${hash.substring(0, 16)}` // 16-char hash for readability
}
```

**Integration Point (Lines 54-60 replacement):**
```typescript
// Generate content-based fingerprint
const messageType = event.message?.message_type ?? event.message_type;
const content = event.content || event.message?.content || '';
const fingerprint = generateMessageFingerprint(
  event.conversation?.id,
  content,
  messageType
);

// Check fingerprint-based deduplication
if (processedMessages.has(fingerprint)) {
  console.log('⏭️ Skipping duplicate message by fingerprint:', fingerprint);
  return NextResponse.json({ received: true, skipped: 'duplicate_fingerprint' });
}
processedMessages.add(fingerprint);
```

**Trade-offs:**
- **Pros:**
  - Strong collision resistance (SHA-256)
  - Catches semantic duplicates (normalized)
  - Per-conversation isolation (conversationId in hash)
  - Whitespace-agnostic (collapsed spaces)
- **Cons:**
  - Hashing overhead (~0.1-0.5ms per message) - negligible
  - May catch legitimate similar messages (low risk with 16-char hash)

**False Positive Risk Mitigation:**
- Conversational messages are naturally diverse
- Templated greetings are EXACTLY what we want to deduplicate
- 16-char hash provides 2^64 unique fingerprints (collision odds ~1 in 10^19)

---

### Solution 2: Bot Message Echo Detection

#PATH_DECISION: **Hybrid of Option A + Option C** - LRU cache with message ID tracking AND content-based matching

**Rationale:**
- **Option A (content LRU)**: Catches echoes even if IDs change
- **Option B (time-window)**: Too fragile (latency spikes break detection)
- **Option C (ID tracking)**: Only works if Chatwoot preserves IDs (evidence suggests it doesn't)

**Chosen Approach: A + C (Content LRU + ID tracking as fallback)**

**Implementation Details:**

**Data Structure (after line 11):**
```typescript
// Track bot messages per conversation for echo detection
interface BotMessageCache {
  content: string[]      // LRU cache of last N content hashes
  messageIds: Set<string> // Sent message IDs (if available)
  timestamp: number      // Last update time for TTL
}

const botMessageTracker = new Map<number, BotMessageCache>();

// Cache limits
const MAX_BOT_MESSAGES_PER_CONVERSATION = 10;
const BOT_MESSAGE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
```

**Echo Detection Function (new):**
```typescript
/**
 * Check if incoming message is an echo of a recently sent bot message
 * Uses both content matching and message ID tracking
 */
function checkIfEcho(conversationId: number, content: string, messageId?: string): boolean {
  const cache = botMessageTracker.get(conversationId);

  if (!cache) {
    return false; // No bot messages sent yet
  }

  // Check 1: Message ID match (if available)
  if (messageId && cache.messageIds.has(messageId)) {
    console.log('🔍 Echo detected via message ID:', messageId);
    return true;
  }

  // Check 2: Content hash match (normalized)
  const normalized = content
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  const contentHash = crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);

  if (cache.content.includes(contentHash)) {
    console.log('🔍 Echo detected via content match:', contentHash);
    return true;
  }

  return false;
}
```

**Bot Message Tracking Function (new):**
```typescript
/**
 * Track bot message for echo detection
 * Called when sending messages via sendMessageToChatwoot
 */
function trackBotMessage(conversationId: number, content: string, messageId?: string): void {
  let cache = botMessageTracker.get(conversationId);

  if (!cache) {
    cache = {
      content: [],
      messageIds: new Set(),
      timestamp: Date.now()
    };
    botMessageTracker.set(conversationId, cache);
  }

  // Track content hash (normalized)
  const normalized = content
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  const contentHash = crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);

  // LRU eviction: keep only last N messages
  cache.content.push(contentHash);
  if (cache.content.length > MAX_BOT_MESSAGES_PER_CONVERSATION) {
    cache.content.shift(); // Remove oldest
  }

  // Track message ID if available
  if (messageId) {
    cache.messageIds.add(messageId);

    // Limit message ID set size (keep last 20 IDs)
    if (cache.messageIds.size > 20) {
      const oldestId = cache.messageIds.values().next().value;
      cache.messageIds.delete(oldestId);
    }
  }

  // Update timestamp
  cache.timestamp = Date.now();

  console.log('📝 Tracked bot message for echo detection:', {
    conversationId,
    contentHash,
    messageId,
    cacheSize: cache.content.length
  });
}
```

**Integration (after line 52):**
```typescript
// Check for bot message echo (BEFORE fingerprint check)
const messageId = event.id?.toString();
const content = event.content || event.message?.content || '';

if (isIncomingMessage && checkIfEcho(event.conversation?.id, content, messageId)) {
  console.log('⏭️ Skipping echoed bot message');
  return NextResponse.json({ received: true, skipped: 'bot_echo' });
}
```

**Update `sendMessageToChatwoot` (lines 346-383):**
```typescript
async function sendMessageToChatwoot(conversationId: number, message: string) {
  try {
    const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

    console.log('📤 Sending message to Chatwoot:', {
      url: `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      conversationId,
      messageLength: message.length
    });

    const response = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          message_type: 'outgoing',
          private: false
        })
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      const sentMessageId = responseData.id?.toString(); // Extract Chatwoot message ID

      // CRITICAL: Track sent message for echo detection
      trackBotMessage(conversationId, message, sentMessageId);

      console.log('✅ AI response sent to Chatwoot', { messageId: sentMessageId });
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send message to Chatwoot:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error sending message to Chatwoot:', error);
  }
}
```

**Trade-offs:**
- **Pros:**
  - Dual detection (content + ID) for reliability
  - LRU eviction prevents unbounded growth
  - Per-conversation isolation
  - Handles both ID preservation and ID mutation cases
  - 15-min TTL balances memory vs echo detection window
- **Cons:**
  - Memory footprint: ~10 content hashes + ~20 IDs per active conversation (~2KB per conversation)
  - Cache cleanup needed (see Solution 3)
  - Requires modifying all `sendMessageToChatwoot` call sites

---

### Solution 3: Enhanced Cache Management

#PATH_DECISION: **Option A + TTL-based cleanup** - Map<conversationId, Cache> with per-conversation TTL

**Rationale:**
- **Option A**: Per-conversation isolation essential for multi-tenant accuracy
- **Option B**: Single Set with composite keys loses conversation context, harder to expire
- **Option C**: Redis overkill for MVP, adds deployment complexity (save for Phase 3)

**Chosen Approach: Map<conversationId, Cache> with smart TTL cleanup**

**Implementation Details:**

**Cache Architecture (lines 6-11 replacement):**
```typescript
// ENHANCED: Per-conversation message deduplication
const processedMessages = new Map<number, Set<string>>(); // conversationId → message fingerprints

// ENHANCED: Per-conversation bot message tracking
const botMessageTracker = new Map<number, BotMessageCache>(); // conversationId → bot cache

// Cache configuration
const MESSAGE_FINGERPRINT_TTL = 10 * 60 * 1000; // 10 minutes (longer than 5 to catch slow echoes)
const BOT_MESSAGE_CACHE_TTL = 15 * 60 * 1000;   // 15 minutes
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;   // Clean every 5 minutes

// Timestamp tracking for TTL
const conversationTimestamps = new Map<number, number>(); // conversationId → last activity timestamp
```

**Smart Cleanup Logic (replace lines 9-11):**
```typescript
/**
 * TTL-based cache cleanup
 * Only removes conversations with no activity beyond TTL
 */
setInterval(() => {
  const now = Date.now();
  let cleanedConversations = 0;
  let cleanedFingerprints = 0;
  let cleanedBotCaches = 0;

  // Clean processedMessages (fingerprint deduplication)
  for (const [conversationId, timestamp] of conversationTimestamps.entries()) {
    if (now - timestamp > MESSAGE_FINGERPRINT_TTL) {
      processedMessages.delete(conversationId);
      conversationTimestamps.delete(conversationId);
      cleanedConversations++;
      cleanedFingerprints++;
    }
  }

  // Clean botMessageTracker (echo detection)
  for (const [conversationId, cache] of botMessageTracker.entries()) {
    if (now - cache.timestamp > BOT_MESSAGE_CACHE_TTL) {
      botMessageTracker.delete(conversationId);
      cleanedBotCaches++;
    }
  }

  if (cleanedConversations > 0 || cleanedBotCaches > 0) {
    console.log('🧹 Cache cleanup completed:', {
      cleanedConversations,
      cleanedFingerprints,
      cleanedBotCaches,
      remainingConversations: processedMessages.size,
      remainingBotCaches: botMessageTracker.size
    });
  }
}, CACHE_CLEANUP_INTERVAL);
```

**Update Fingerprint Tracking (integrate with Solution 1):**
```typescript
// After generating fingerprint (Solution 1 code)
const conversationId = event.conversation?.id;

// Get or create conversation fingerprint set
if (!processedMessages.has(conversationId)) {
  processedMessages.set(conversationId, new Set());
}
const conversationFingerprints = processedMessages.get(conversationId)!;

// Check fingerprint-based deduplication
if (conversationFingerprints.has(fingerprint)) {
  console.log('⏭️ Skipping duplicate message by fingerprint:', fingerprint);
  return NextResponse.json({ received: true, skipped: 'duplicate_fingerprint' });
}

// Add fingerprint and update timestamp
conversationFingerprints.add(fingerprint);
conversationTimestamps.set(conversationId, Date.now());
```

**Memory Estimation:**
- **Per Conversation:**
  - Fingerprint Set: ~10 messages × 32 chars = 320 bytes
  - Bot Message Cache: ~10 content hashes + 20 IDs = ~1.5 KB
  - Total per conversation: ~2 KB
- **100 Active Conversations:** 200 KB
- **1000 Active Conversations:** 2 MB (acceptable for Node.js)

**Trade-offs:**
- **Pros:**
  - Per-conversation isolation (no cross-conversation pollution)
  - Smart TTL cleanup (preserves active conversations)
  - Bounded memory growth
  - Easy to monitor cache sizes
  - Deployment-simple (in-memory, no external deps)
- **Cons:**
  - In-memory only (lost on server restart - acceptable for deduplication)
  - Requires TTL tuning for optimal balance
  - Not suitable for extreme scale (10k+ concurrent conversations - use Redis then)

---

## Critical Interfaces & Integration Points

#LCL_EXPORT_CRITICAL: webhook_deduplication_contract::[
  {
    "interface": "generateMessageFingerprint",
    "params": "(conversationId: number, content: string, messageType: number | string) => string",
    "returns": "16-char hex fingerprint (e.g., '123-a4f7e8d2c1b0a3f9')",
    "purpose": "Content-based deduplication across webhook events"
  },
  {
    "interface": "checkIfEcho",
    "params": "(conversationId: number, content: string, messageId?: string) => boolean",
    "returns": "true if message is echo of recent bot message",
    "purpose": "Prevent bot message echoes from triggering AI responses"
  },
  {
    "interface": "trackBotMessage",
    "params": "(conversationId: number, content: string, messageId?: string) => void",
    "returns": "void (updates botMessageTracker cache)",
    "purpose": "Record sent bot messages for echo detection",
    "callsite": "MUST be called in sendMessageToChatwoot after successful send"
  }
]

#LCL_EXPORT_FIRM: integration_points::[
  {
    "component": "n8n AI Broker",
    "webhook_url": "process.env.N8N_AI_BROKER_WEBHOOK_URL",
    "concern": "n8n responses MUST NOT be blocked by echo detection",
    "solution": "n8n sends via Chatwoot API → triggers outgoing message webhook → correctly filtered by isOutgoingMessage check (line 49)",
    "verification": "Test n8n response appears in chat WITHOUT being deduplicated"
  },
  {
    "component": "Initial Greeting Send",
    "file": "app/api/chatwoot-conversation/route.ts",
    "location": "~line 308-314 (greeting message send)",
    "concern": "Initial greeting is the MAIN duplicate culprit",
    "solution": "Ensure trackBotMessage() is called when sending greeting",
    "coordination": "message-send-deduplicator agent MUST update this callsite"
  },
  {
    "component": "Message Polling (Frontend)",
    "file": "app/api/chat/messages/route.ts",
    "location": "Lines 85-115 (existing queue deduplication)",
    "concern": "Frontend polling should NOT see deduplicated messages",
    "solution": "Webhook deduplication is SERVER-SIDE ONLY - does not affect Chatwoot API responses",
    "verification": "Frontend receives full message history from Chatwoot API, not webhook"
  },
  {
    "component": "Webhook Configuration Audit",
    "action": "Pre-deployment check",
    "commands": [
      "curl -H 'Api-Access-Token: $CHATWOOT_API_TOKEN' https://chat.nextnest.sg/api/v1/accounts/1/webhooks",
      "curl -H 'Api-Access-Token: $CHATWOOT_API_TOKEN' https://chat.nextnest.sg/api/v1/accounts/1/agent_bots"
    ],
    "expected": "ONLY ONE webhook per event type (no duplicates)",
    "action_if_duplicates": "Disable redundant webhooks in Chatwoot admin panel"
  }
]

#LCL_EXPORT_CRITICAL: message_id_contract::[
  {
    "format": "Chatwoot message ID",
    "type": "number (returned in API response after message send)",
    "example": "responseData.id → '123456'",
    "extraction": "await response.json() → responseData.id",
    "usage": "Pass to trackBotMessage(conversationId, content, responseData.id?.toString())"
  },
  {
    "fallback": "If Chatwoot doesn't return ID (edge case)",
    "behavior": "trackBotMessage works with content-only (messageId = undefined)",
    "echo_detection": "Falls back to content matching (still effective)"
  }
]

---

## Implementation Checklist

### Phase 1: Core Deduplication (Priority 1)
- [ ] **Step 1.1:** Replace `processedMessages` Set with `Map<number, Set<string>>` (per-conversation)
- [ ] **Step 1.2:** Implement `generateMessageFingerprint()` function with semantic normalization
- [ ] **Step 1.3:** Update fingerprint check logic (lines 54-60) to use conversation-specific Sets
- [ ] **Step 1.4:** Add `conversationTimestamps` Map for TTL tracking
- [ ] **Step 1.5:** Replace 5-min cleanup with smart TTL cleanup logic

### Phase 2: Bot Echo Detection (Priority 1)
- [ ] **Step 2.1:** Add `botMessageTracker` Map data structure
- [ ] **Step 2.2:** Implement `checkIfEcho()` function (content + ID matching)
- [ ] **Step 2.3:** Implement `trackBotMessage()` function (LRU + ID tracking)
- [ ] **Step 2.4:** Add echo check in webhook handler (after line 52, before fingerprint check)
- [ ] **Step 2.5:** Update `sendMessageToChatwoot()` to call `trackBotMessage()` after successful send

### Phase 3: Integration Points (Priority 2)
- [ ] **Step 3.1:** Audit Chatwoot webhook configuration (check for duplicates)
- [ ] **Step 3.2:** Update initial greeting send in `chatwoot-conversation/route.ts` (coordinate with message-send-deduplicator agent)
- [ ] **Step 3.3:** Update all other `sendMessageToChatwoot` callsites (localProcessing, n8n fallback, etc.)
- [ ] **Step 3.4:** Add debug logging for cache sizes (monitor memory usage)

### Phase 4: Testing & Validation (Priority 2)
- [ ] **Step 4.1:** Unit test: `generateMessageFingerprint()` with variations (whitespace, case, line breaks)
- [ ] **Step 4.2:** Unit test: `checkIfEcho()` with content match, ID match, no match
- [ ] **Step 4.3:** Unit test: `trackBotMessage()` LRU eviction (11th message evicts 1st)
- [ ] **Step 4.4:** Integration test: Send greeting → verify echo skipped
- [ ] **Step 4.5:** Integration test: n8n response → verify NOT blocked
- [ ] **Step 4.6:** Load test: 100 rapid messages → verify no duplicates, cache bounded

---

## Testing Requirements

#PLAN_UNCERTAINTY: [How to simulate Chatwoot webhook echoes in test environment without real Chatwoot instance?]

**Possible Solutions:**
1. Mock webhook payloads with identical content, different IDs
2. Use ngrok tunnel to real Chatwoot instance (integration test)
3. Create test harness that sends duplicate POST requests to `/api/chatwoot-webhook`

**Preferred: Option 3 (Test Harness) + Option 2 (Final Validation)**

### Unit Tests

**File:** `app/api/chatwoot-webhook/__tests__/deduplication.test.ts` (new)

```typescript
describe('Message Fingerprinting', () => {
  test('generates consistent fingerprint for identical content', () => {
    const fp1 = generateMessageFingerprint(123, 'Hello World', 0);
    const fp2 = generateMessageFingerprint(123, 'Hello World', 0);
    expect(fp1).toBe(fp2);
  });

  test('normalizes whitespace variations', () => {
    const fp1 = generateMessageFingerprint(123, 'Hello  World', 0);
    const fp2 = generateMessageFingerprint(123, 'Hello   World', 0);
    const fp3 = generateMessageFingerprint(123, 'hello world', 0); // Case normalized
    expect(fp1).toBe(fp2);
    expect(fp1).toBe(fp3);
  });

  test('differentiates by conversation ID', () => {
    const fp1 = generateMessageFingerprint(123, 'Hello', 0);
    const fp2 = generateMessageFingerprint(456, 'Hello', 0);
    expect(fp1).not.toBe(fp2);
  });

  test('differentiates by message type', () => {
    const fp1 = generateMessageFingerprint(123, 'Hello', 0);
    const fp2 = generateMessageFingerprint(123, 'Hello', 1);
    expect(fp1).not.toBe(fp2);
  });
});

describe('Bot Echo Detection', () => {
  beforeEach(() => {
    botMessageTracker.clear(); // Reset cache
  });

  test('detects echo via content match', () => {
    trackBotMessage(123, 'Hello from bot');
    const isEcho = checkIfEcho(123, 'Hello from bot');
    expect(isEcho).toBe(true);
  });

  test('detects echo via message ID', () => {
    trackBotMessage(123, 'Hello from bot', 'msg-456');
    const isEcho = checkIfEcho(123, 'Different content', 'msg-456');
    expect(isEcho).toBe(true); // ID match overrides content
  });

  test('does not false-positive on different conversation', () => {
    trackBotMessage(123, 'Hello from bot');
    const isEcho = checkIfEcho(456, 'Hello from bot'); // Different conversation
    expect(isEcho).toBe(false);
  });

  test('LRU eviction works correctly', () => {
    // Track 11 messages (limit is 10)
    for (let i = 0; i < 11; i++) {
      trackBotMessage(123, `Message ${i}`);
    }

    const cache = botMessageTracker.get(123)!;
    expect(cache.content.length).toBe(10); // Evicted oldest

    // First message should be evicted
    const isEcho = checkIfEcho(123, 'Message 0');
    expect(isEcho).toBe(false);

    // 10th message should still be cached
    const isEcho10 = checkIfEcho(123, 'Message 10');
    expect(isEcho10).toBe(true);
  });
});

describe('Cache Cleanup', () => {
  // Mock timers for TTL testing
  jest.useFakeTimers();

  test('cleans up expired conversation fingerprints', () => {
    processedMessages.set(123, new Set(['fingerprint-1']));
    conversationTimestamps.set(123, Date.now() - 11 * 60 * 1000); // 11 min ago (expired)

    // Trigger cleanup
    jest.advanceTimersByTime(CACHE_CLEANUP_INTERVAL);

    expect(processedMessages.has(123)).toBe(false);
    expect(conversationTimestamps.has(123)).toBe(false);
  });

  test('preserves active conversations', () => {
    processedMessages.set(123, new Set(['fingerprint-1']));
    conversationTimestamps.set(123, Date.now() - 2 * 60 * 1000); // 2 min ago (active)

    jest.advanceTimersByTime(CACHE_CLEANUP_INTERVAL);

    expect(processedMessages.has(123)).toBe(true);
  });
});
```

### Integration Tests

**File:** `scripts/test-webhook-deduplication.js` (new)

```javascript
const fetch = require('node-fetch');

const WEBHOOK_URL = 'http://localhost:3006/api/chatwoot-webhook';

// Test 1: Send identical message twice (should skip 2nd)
async function testDuplicateFingerprint() {
  console.log('\n🧪 Test 1: Duplicate Fingerprint Detection');

  const payload = {
    event: 'message_created',
    id: Math.random(), // Different IDs
    content: 'Hello, I need help with mortgage',
    message_type: 0,
    conversation: { id: 999, status: 'bot' },
    sender: { type: 'contact' }
  };

  const res1 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result1 = await res1.json();
  console.log('First send:', result1); // Should process

  // Send identical content with different ID
  payload.id = Math.random();
  const res2 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result2 = await res2.json();
  console.log('Second send:', result2); // Should skip with 'duplicate_fingerprint'

  if (result2.skipped === 'duplicate_fingerprint') {
    console.log('✅ PASS: Duplicate fingerprint detected');
  } else {
    console.log('❌ FAIL: Duplicate not caught');
  }
}

// Test 2: Bot echo detection
async function testBotEcho() {
  console.log('\n🧪 Test 2: Bot Message Echo Detection');

  // Simulate bot sending message (should track it)
  // This would normally happen via sendMessageToChatwoot
  // For test, we directly call trackBotMessage (need to expose for testing)

  // Then send webhook with same content as incoming
  const payload = {
    event: 'message_created',
    id: 'test-echo-123',
    content: 'Hi there! Let me help you with your mortgage needs.',
    message_type: 0, // Incoming (ECHOED from bot)
    conversation: { id: 998, status: 'bot' },
    sender: { type: 'contact' }
  };

  // Pre-track this as bot message
  // (In real scenario, this happens in sendMessageToChatwoot)
  // trackBotMessage(998, payload.content, 'original-msg-id');

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  console.log('Echo webhook result:', result);

  if (result.skipped === 'bot_echo') {
    console.log('✅ PASS: Bot echo detected and skipped');
  } else {
    console.log('❌ FAIL: Bot echo not caught');
  }
}

// Run tests
(async () => {
  await testDuplicateFingerprint();
  // await testBotEcho(); // Requires trackBotMessage to be testable
})();
```

### Manual Testing Steps (Real Chatwoot)

1. **Setup:**
   - Deploy webhook changes to dev environment
   - Configure ngrok tunnel to local dev server
   - Update Chatwoot webhook URL to ngrok URL

2. **Test Case 1: Initial Greeting Echo**
   - Submit mortgage form on website
   - Observe initial greeting message in Chatwoot
   - Check server logs: Should see "Tracked bot message for echo detection"
   - If Chatwoot echoes: Should see "Skipping echoed bot message"
   - **Expected:** Only ONE greeting visible to user

3. **Test Case 2: n8n AI Response (NOT Blocked)**
   - Send user message in Chatwoot widget
   - n8n generates AI response
   - Check server logs: n8n response sent via Chatwoot API
   - Webhook receives outgoing message event
   - **Expected:** Skipped with "outgoing message", NOT "bot_echo"

4. **Test Case 3: Rapid Messages**
   - Send 5 messages quickly from widget
   - Each triggers n8n response
   - **Expected:** No duplicates, all 10 messages visible (5 user + 5 bot)

5. **Test Case 4: Whitespace Variations**
   - Manually send duplicate webhook with extra spaces
   - **Expected:** Caught by fingerprint normalization

---

## Rollback Plan

**If false positives occur (legitimate messages blocked):**

### Immediate Rollback (< 5 minutes)
1. Set feature flag: `process.env.ENABLE_ECHO_DETECTION = 'false'`
2. Deploy flag to production
3. Webhook falls back to old fingerprint logic (event ID only)

### Gradual Rollback
1. Disable bot echo detection only: Comment out `checkIfEcho()` call
2. Keep enhanced fingerprinting: Keeps content-based deduplication
3. Monitor for improvement

### Full Rollback
1. Git revert commit with deduplication changes
2. Redeploy previous webhook handler
3. Original 5-min Set-based deduplication restored

**Rollback Trigger Conditions:**
- False positive rate > 1% (legitimate messages blocked)
- n8n AI responses blocked
- User messages incorrectly labeled as echoes
- Memory usage > 100 MB for cache (indicates leak)

---

## Success Metrics

### Primary Metrics (Week 1 Monitoring)
- **Echo Skip Rate:** 2-10% of webhooks (indicates echoes being caught)
- **False Positive Rate:** < 0.5% (manually verify via logs)
- **Duplicate Message Reports:** 0 (user feedback)
- **n8n Response Delivery:** 100% (no AI responses blocked)

### Performance Metrics
- **Webhook Processing Latency:** < 50ms overhead (fingerprinting + echo check)
- **Memory Usage:** < 10 MB for cache (100 active conversations)
- **Cache Hit Rate:** 2-10% (deduplication effectiveness)

### Monitoring Queries (Add to logging)
```typescript
// Log every 100 webhooks
if (webhookCount % 100 === 0) {
  console.log('📊 Deduplication Stats:', {
    totalWebhooks: webhookCount,
    fingerprintSkips: fingerprintSkipCount,
    echoSkips: echoSkipCount,
    falsePositives: falsePositiveCount, // Requires manual flagging
    cacheSize: processedMessages.size,
    botCacheSize: botMessageTracker.size,
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB'
  });
}
```

---

## Potential Issues

#Potential_Issue: **Chatwoot May Send Both Incoming AND Outgoing Webhooks for Same Message**

**Evidence:** User reports seeing bot message on "User side" (incoming) AND "bot side" (outgoing)

**Hypothesis:** Chatwoot sends TWO webhooks for echoed messages:
1. First: `message_type: 1` (outgoing) - caught by existing filter (line 49)
2. Second: `message_type: 0` (incoming) - SLIPS THROUGH, this is the bug

**Mitigation in Plan:**
- `checkIfEcho()` runs BEFORE fingerprint check
- Catches echoes regardless of `message_type` label
- Content-based matching immune to type mutations

**Verification Test:**
- Add logging: "Incoming message content: X, Last bot message: Y"
- If X === Y but type is 0, confirms hypothesis

---

#Potential_Issue: **n8n Workflow Timeout During AI Generation**

**Context:** If n8n takes > 30s to generate AI response, Chatwoot webhook may retry

**Risk:** Same user message triggers multiple n8n workflows

**Mitigation:**
- Enhanced fingerprinting catches duplicate user messages
- n8n should implement idempotency (check if conversation already processing)

**Recommended n8n Enhancement (Future):**
```javascript
// n8n workflow: Check if conversation is already processing
const isProcessing = await redis.get(`processing:${conversationId}`);
if (isProcessing) {
  return { skipped: 'already_processing' };
}

// Set lock
await redis.set(`processing:${conversationId}`, 'true', 'EX', 60);

// Generate AI response...

// Release lock
await redis.del(`processing:${conversationId}`);
```

---

#Potential_Issue: **Memory Leak if Conversations Never Get Cleaned**

**Scenario:** Conversation stalls (no messages for 15+ min) but cache isn't cleaned

**Current Mitigation:**
- TTL-based cleanup runs every 5 minutes
- Conversations idle > 10 min (MESSAGE_FINGERPRINT_TTL) are removed

**Additional Safeguard (Recommended):**
```typescript
// Hard limit: Max 1000 conversations in cache
const MAX_CACHED_CONVERSATIONS = 1000;

if (processedMessages.size >= MAX_CACHED_CONVERSATIONS) {
  // Evict oldest conversation (FIFO)
  const oldestConvId = conversationTimestamps.entries().next().value[0];
  processedMessages.delete(oldestConvId);
  conversationTimestamps.delete(oldestConvId);
  console.warn('⚠️ Cache limit reached, evicted conversation:', oldestConvId);
}
```

---

#Potential_Issue: **Race Condition: Message Sent BEFORE trackBotMessage Completes**

**Scenario:**
1. `sendMessageToChatwoot()` fires Chatwoot API request
2. Chatwoot immediately sends webhook (< 10ms)
3. Webhook arrives BEFORE `trackBotMessage()` is called
4. Echo not detected

**Likelihood:** Low (Chatwoot webhook latency typically > 50ms)

**Mitigation (If Observed):**
```typescript
// Call trackBotMessage BEFORE sending (pre-track)
trackBotMessage(conversationId, message); // No messageId yet

const response = await fetch(...); // Send to Chatwoot

if (response.ok) {
  const responseData = await response.json();
  const messageId = responseData.id?.toString();

  // Update cache with messageId
  const cache = botMessageTracker.get(conversationId)!;
  if (messageId) {
    cache.messageIds.add(messageId);
  }
}
```

**Trade-off:** Pre-tracking may cache messages that fail to send (acceptable, cleaned by TTL)

---

## Integration with Next Agent: message-send-deduplicator

#LCL_EXPORT_CRITICAL: message_id_contract::[
  {
    "contract_name": "trackBotMessage Integration",
    "required_by": "message-send-deduplicator agent",
    "description": "All message send callsites MUST call trackBotMessage after successful send",
    "callsites": [
      {
        "file": "app/api/chatwoot-conversation/route.ts",
        "location": "~line 308-314",
        "context": "Initial greeting send after conversation creation",
        "current_code": "await sendMessageToChatwoot(conversationId, greetingMessage)",
        "required_change": "sendMessageToChatwoot already updated to call trackBotMessage internally - VERIFY IT WORKS"
      },
      {
        "file": "app/api/chatwoot-webhook/route.ts",
        "location": "Line 270 (localProcessing function)",
        "context": "Fallback message when n8n unavailable",
        "required_change": "ALREADY CALLS sendMessageToChatwoot - auto-tracked"
      },
      {
        "file": "app/api/chatwoot-ai-webhook/route.ts",
        "location": "Lines 62-68 (handoff message) and 68 (AI response)",
        "context": "n8n alternative AI webhook",
        "required_change": "Calls sendMessageToChatwoot - auto-tracked IF using same function"
      }
    ],
    "verification": "Grep for 'sendMessageToChatwoot' calls, ensure all use updated function signature"
  }
]

**Coordination Points:**
1. **message-send-deduplicator** must verify `sendMessageToChatwoot()` update is deployed
2. If new send functions are created, they MUST call `trackBotMessage()`
3. Test coverage: Ensure initial greeting is tracked (most critical echo source)

---

## Conclusion

This plan addresses webhook echo detection and deduplication through a **three-pronged approach**:

1. **Enhanced Content Fingerprinting** - Catches semantic duplicates with SHA-256 + normalization
2. **Bot Message Echo Detection** - Dual tracking (content + ID) with LRU cache
3. **Smart Cache Management** - Per-conversation isolation with TTL-based cleanup

**Key Innovations:**
- Content-based deduplication immune to ID mutations
- Pre-emptive echo tracking at send-time (not just receive-time)
- Conversation-scoped caches for multi-tenant accuracy
- Graceful fallbacks (content matching works even if IDs unavailable)

**Risk Mitigation:**
- Low false positive risk (normalized SHA-256 with 2^64 keyspace)
- Bounded memory (2KB per conversation, hard limits)
- Fast rollback (feature flag + git revert)
- n8n response exemption (outgoing message filter)

**Success Criteria:**
- Zero user-reported duplicates
- No n8n responses blocked
- < 0.5% false positive rate
- < 10 MB cache footprint

**Next Agent Handoff:**
The **message-send-deduplicator agent** will verify all `sendMessageToChatwoot` callsites integrate with `trackBotMessage()`, with special focus on the initial greeting send in `chatwoot-conversation/route.ts` (the primary echo source).
