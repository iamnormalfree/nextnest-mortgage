# Unified Message Deduplication Implementation Blueprint

## Executive Summary

This blueprint synthesizes Agent A's webhook echo detection strategy with Agent B's send-side tracking approach into a cohesive deduplication system. The solution prevents duplicate messages through dual-layer protection: (1) proactive tracking when messages are sent to Chatwoot, and (2) reactive echo detection when webhooks arrive. Both layers share a unified cache architecture (`botMessageTracker`) with content fingerprinting (SHA-256 + semantic normalization) and message ID tracking. The 98ms timing buffer between send-side tracking completion and webhook arrival provides race condition protection, while fingerprint-based deduplication serves as a safety net. Three critical send functions require updates, all encapsulating tracking logic internally for fail-safe operation.

---

## Path Coherence Validation

#PATH_RATIONALE: Agent A's webhook detection and Agent B's send tracking are fully compatible and complementary - they represent write (send-side) and read (webhook-side) operations on the same shared cache, with no conflicting assumptions.

### Agent A's Path Decisions (Webhook Echo Detection)

**Fingerprinting Strategy:**
- **Chosen:** Hybrid SHA-256 + semantic normalization (Option B + C)
- **Format:** 16-char hex hash of `${conversationId}:${messageType}:${normalizedContent}`
- **Normalization:** Lowercase, trim, collapse whitespace, normalize line breaks
- **Storage:** `Map<conversationId, Set<fingerprints>>` for fingerprint deduplication

**Echo Detection Strategy:**
- **Chosen:** LRU cache with dual tracking (Option A + C)
- **Data Structure:** `Map<conversationId, BotMessageCache>`
- **Cache Contents:** Last 10 content hashes + last 20 message IDs
- **TTL:** 15 minutes for bot message cache, 10 minutes for fingerprints
- **Detection Order:** Echo check → Fingerprint check → Forward to n8n

**Cache Management:**
- **Chosen:** Per-conversation Map with TTL-based cleanup (Option A)
- **Cleanup Interval:** 5 minutes
- **Memory Footprint:** ~2KB per conversation (~200KB for 100 active conversations)

### Agent B's Path Decisions (Send-Side Tracking)

**Message ID Strategy:**
- **Chosen:** Chatwoot's response ID + fallback (Option C + A)
- **Primary Format:** `responseData.id?.toString()` (Chatwoot's numeric ID)
- **Fallback Format:** `fallback-${conversationId}-${Date.now()}`
- **Extraction Point:** After successful Chatwoot API response (`response.ok`)

**Tracking Storage:**
- **Chosen:** Shared cache with Agent A (Option B - NO separate storage)
- **Writes To:** Agent A's `botMessageTracker` Map
- **Coordination:** Send-side writes, webhook-side reads
- **Location:** Shared utility at `lib/utils/message-tracking.ts`

**Integration Pattern:**
- **Chosen:** Internal tracking within each send function (Option A)
- **Encapsulation:** Tracking logic inside send functions (caller-agnostic)
- **Error Handling:** Try-catch around tracking (non-blocking failures)
- **Callsites:** 3 send functions require updates

**Timing Strategy:**
- **Chosen:** Async with await (Option B)
- **Sequence:** Send → Extract ID → Track → Return
- **Latency:** +2ms overhead (tracking is in-memory)
- **Race Buffer:** 98ms+ between tracking completion and webhook arrival

### Compatibility Assessment

**✓ Message ID Alignment:**
- Agent B extracts `responseData.id?.toString()` (e.g., `"123456"`)
- Agent A stores in `botMessageCache.messageIds` Set (expects strings)
- **Format Match:** ✓ Both use string format
- **Fallback Handling:** Agent B's fallback IDs work with Agent A's content-based detection

**✓ Shared Cache Coordination:**
- Agent B calls `trackBotMessage(conversationId, content, messageId)`
- Agent A's function writes to `botMessageTracker` Map
- Webhook handler reads same `botMessageTracker` via `checkIfEcho()`
- **Write-Read Flow:** ✓ Send-side writes once, webhook reads once per message
- **Isolation:** ✓ Per-conversation Map prevents cross-contamination

**✓ Timing & Race Protection:**
- Agent B completes tracking at ~152ms from conversation start
- Chatwoot webhook arrives at ~250ms (98ms buffer)
- **Buffer Adequacy:** ✓ 98ms exceeds typical webhook latency variance (50-200ms range)
- **Edge Case Handling:** Agent A's fingerprint deduplication catches rare race conditions

**✓ Content Format:**
- Agent B passes original message text (no normalization) to `trackBotMessage()`
- Agent A normalizes inside `trackBotMessage()` before hashing
- **Separation of Concerns:** ✓ Send-side provides raw content, tracking layer handles normalization

**✓ Error Propagation:**
- Agent B wraps tracking in try-catch (non-blocking)
- If tracking fails, send succeeds but echo detection degrades
- **Fallback Mitigation:** ✓ Agent A's fingerprint check still works even without ID tracking

### Cross-Domain Conflicts: NONE DETECTED

No conflicting assumptions identified. Both agents operate on complementary phases of the message lifecycle (send vs. receive) with a shared cache as the integration point.

---

## Unified Architecture

#LCL_EXPORT_CRITICAL: unified_architecture::complete_message_flow_with_dual_deduplication

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER FORM SUBMISSION                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POST /api/chatwoot-conversation (route.ts)                         │
│  ├─ Create Chatwoot conversation                                    │
│  ├─ Assign broker from Supabase                                     │
│  └─ Call: chatwootClient.sendInitialMessage()                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SEND INITIAL GREETING (lib/integrations/chatwoot-client.ts)        │
│  ├─ Generate personalized greeting (broker persona)                 │
│  ├─ POST to Chatwoot API: /conversations/{id}/messages              │
│  │   └─ Body: { content, message_type: 1 (outgoing) }              │
│  ├─ Await response: { id: 123456, content: "...", ... }            │
│  └─ Extract Message ID: responseData.id?.toString()                 │
│      └─ Result: "123456" (or fallback-{convId}-{timestamp})         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼ [Agent B's Send-Side Tracking]
┌─────────────────────────────────────────────────────────────────────┐
│  TRACK SENT MESSAGE (lib/utils/message-tracking.ts)                 │
│  ├─ Call: trackBotMessage(conversationId, content, messageId)       │
│  ├─ Get/Create cache: botMessageTracker.get(conversationId)         │
│  ├─ Normalize content: lowercase, trim, collapse spaces             │
│  ├─ Generate content hash: SHA-256(normalized) → 16-char hex        │
│  ├─ Update cache.content[] (LRU: max 10, evict oldest)              │
│  ├─ Update cache.messageIds Set (add messageId, max 20)             │
│  ├─ Update cache.timestamp (for 15-min TTL)                         │
│  └─ Log: "📝 Tracked bot message: { contentHash, messageId }"       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼ [~152ms from conversation start]
┌─────────────────────────────────────────────────────────────────────┐
│  TRACKING COMPLETE → Return to caller                                │
│  └─ API responds to user: { conversationId, status: "success" }     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ [~98ms buffer window]
                             │
                             ▼ [~250ms: Chatwoot processes message internally]
┌─────────────────────────────────────────────────────────────────────┐
│  CHATWOOT WEBHOOK FIRED (to /api/chatwoot-webhook)                  │
│  └─ Event: message_created                                          │
│      ├─ id: 123456 (same as sent message)                           │
│      ├─ content: "Hi John! I'm Michelle Chen..." (ECHO)             │
│      ├─ message_type: 0 (incoming) ← MISLABELED by Chatwoot         │
│      └─ conversation: { id: 789, status: "bot" }                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼ [Agent A's Webhook Echo Detection]
┌─────────────────────────────────────────────────────────────────────┐
│  WEBHOOK HANDLER (app/api/chatwoot-webhook/route.ts)                │
│                                                                       │
│  [FILTER 1: Outgoing Message Type Check (Line 49-52)]               │
│  ├─ if (message_type === 1): Skip "outgoing message"                │
│  └─ Result: PASSED (type is 0, mislabeled) → Continue               │
│                                                                       │
│  [FILTER 2: Bot Echo Detection (Agent A - NEW)]                     │
│  ├─ Call: checkIfEcho(conversationId, content, messageId)           │
│  │   ├─ Get cache: botMessageTracker.get(conversationId)            │
│  │   ├─ Check 1: messageIds.has("123456")?                          │
│  │   │   └─ Result: ✓ MATCH (same ID from send-side tracking)       │
│  │   ├─ Log: "🔍 Echo detected via message ID: 123456"              │
│  │   └─ Return: true                                                 │
│  ├─ if (isEcho): Skip "bot_echo"                                    │
│  └─ Return: { received: true, skipped: "bot_echo" } ← ✅ BLOCKED    │
│                                                                       │
│  [FILTER 3: Fingerprint Deduplication (Agent A - Fallback)]         │
│  ├─ Generate fingerprint: hash(conversationId, type, normalized)    │
│  ├─ Check: processedMessages.get(conversationId).has(fingerprint)?  │
│  └─ if (duplicate): Skip "duplicate_fingerprint"                    │
│                                                                       │
│  [FORWARD TO N8N (if all filters passed)]                           │
│  └─ POST to N8N_AI_BROKER_WEBHOOK_URL (not reached for echo)        │
└─────────────────────────────────────────────────────────────────────┘

RESULT: Greeting appears ONCE in Chatwoot (bot side only)
        Echo webhook detected and skipped → No duplicate → No n8n trigger
```

**Key Flow Annotations:**

1. **Send-Side Tracking (Agent B):** Happens inside `sendInitialMessage()` after Chatwoot responds - writes to `botMessageTracker` with both content hash and message ID
2. **98ms Race Buffer:** Tracking completes at ~152ms, webhook arrives at ~250ms - prevents race conditions
3. **Echo Detection (Agent A):** Webhook handler checks `botMessageTracker` BEFORE processing - matches by ID first, then content
4. **Dual Fallback:** If ID missing, content hash matching works; if tracking fails, fingerprint deduplication catches duplicates
5. **n8n Protection:** Echo filter runs BEFORE n8n forwarding - prevents AI broker from receiving duplicate events

---

## Resolved Planning Uncertainties

#PATH_RATIONALE: Race condition resolution - Agent B's 98ms timing buffer combined with Agent A's dual detection (ID + content) provides robust protection with fingerprint deduplication as safety net

### Agent A's Planning Uncertainties

**Uncertainty 1: Test Simulation Without Real Chatwoot**
- **Agent A Flagged:** `#PLAN_UNCERTAINTY: How to simulate Chatwoot webhook echoes in test environment without real Chatwoot instance?`
- **Agent A Proposed:** Mock payloads OR ngrok tunnel OR test harness
- **Agent B Resolution:** Recommends hybrid approach:
  1. **Unit Tests:** Mock `trackBotMessage()` and `checkIfEcho()` with in-memory cache
  2. **Integration Tests:** Test harness sending duplicate POST to `/api/chatwoot-webhook`
  3. **Manual Tests:** ngrok tunnel to real Chatwoot (final validation)
- **Synthesis Decision:** Use ALL THREE approaches in testing phases
  - Unit tests verify logic isolation
  - Integration tests verify end-to-end flow without external dependencies
  - Manual tests validate real-world behavior

**Uncertainty 2: Race Condition (Webhook Before Tracking)**
- **Agent A Flagged:** `#Potential_Issue: Race condition if webhook before trackBotMessage`
- **Agent A Noted:** Low likelihood (Chatwoot webhook latency typically > 50ms)
- **Agent B Resolution:**
  - **Timing Analysis:** Tracking completes at ~152ms, webhook at ~250ms (98ms buffer)
  - **Buffer Adequacy:** 98ms exceeds Chatwoot webhook latency variance (50-200ms typical)
  - **Fallback Strategy:** If race occurs (< 1%), fingerprint deduplication catches it
  - **Monitoring:** Log when echo detected by content instead of ID (indicates race)
- **Synthesis Decision:** **Race condition is MITIGATED but not eliminated**
  - **Primary Protection:** 98ms timing buffer (covers 99%+ cases)
  - **Fallback Protection:** Fingerprint deduplication (catches remaining edge cases)
  - **Monitoring Required:** Track occurrences via logs (implement in Phase 5)
  - **Pre-Tracking Option:** Reserved for future if race rate > 1% (Agent A's pre-track strategy)

### Agent B's Planning Uncertainties

**Uncertainty 1: `trackBotMessage()` Function Location**
- **Agent B Flagged:** `#PLAN_UNCERTAINTY: Where should trackBotMessage() be defined to allow access from all send functions?`
- **Agent B Proposed:** Shared utility vs. duplication vs. API endpoint
- **Synthesis Decision:** **Shared utility at `lib/utils/message-tracking.ts`**
  - **Rationale:** DRY principle, type safety, testable, no circular dependencies
  - **Exports:** `botMessageTracker`, `trackBotMessage()`, `checkIfEcho()`, `BotMessageCache` interface
  - **Imports:** All three send functions + webhook handler import from this single file
  - **Agent A Coordination:** Move Agent A's implementations to this shared file

**Uncertainty 2: Race Condition Testing**
- **Agent B Flagged:** `#PLAN_UNCERTAINTY: How to test race condition scenario (webhook arrives before tracking completes)?`
- **Agent B Proposed:** Artificial delay vs. mock webhook vs. ngrok + throttling
- **Synthesis Decision:** **Artificial delay (dev mode) + mock webhook**
  - **Dev Mode Flag:** `process.env.SIMULATE_RACE_CONDITION = 'true'` adds 100ms delay to tracking
  - **Mock Webhook:** Send webhook immediately after send (before tracking completes)
  - **Expected Result:** Fingerprint deduplication catches it (verifies fallback works)

---

## Integration Checklist

#LCL_EXPORT_FIRM: integration_checklist::pre_deployment_requirements

### Pre-Deployment Validation

1. **Webhook Configuration Audit (Agent A Requirement)**
   - [ ] Run: `curl -H 'Api-Access-Token: $CHATWOOT_API_TOKEN' https://chat.nextnest.sg/api/v1/accounts/1/webhooks`
   - [ ] Verify: ONLY ONE webhook per event type (`message_created`)
   - [ ] Check: No duplicate inbox-level + bot-level webhooks
   - [ ] Action if duplicates: Disable redundant webhooks in Chatwoot admin panel

2. **Chatwoot API Response Validation (Agent B Requirement)**
   - [ ] Test: Send message to Chatwoot, verify `responseData.id` is present
   - [ ] Verify: Message ID format is numeric (e.g., `123456`)
   - [ ] Check: Fallback ID generation never needed in 100 test sends
   - [ ] Document: Log warning rate for missing IDs (should be 0%)

3. **Shared Utility Creation (Both Agents)**
   - [ ] Create: `lib/utils/message-tracking.ts`
   - [ ] Move: Agent A's `botMessageTracker`, `trackBotMessage()`, `checkIfEcho()` to shared file
   - [ ] Export: All functions and cache with proper TypeScript types
   - [ ] Verify: No circular import dependencies

4. **n8n AI Broker Non-Blocking Verification (Agent A Requirement)**
   - [ ] Test: n8n sends AI response → Chatwoot API → webhook fired
   - [ ] Verify: Webhook has `message_type: 1` (outgoing)
   - [ ] Confirm: Skipped with reason "outgoing message" (NOT "bot_echo")
   - [ ] Check: AI response appears in chat widget (not blocked)

5. **Frontend Polling Non-Impact Verification (Agent A Requirement)**
   - [ ] Test: GET `/api/chat/messages?conversationId=X` after deduplication
   - [ ] Verify: Full message history returned (webhook deduplication is server-side only)
   - [ ] Confirm: No messages missing from frontend view
   - [ ] Check: Existing queue deduplication logic still works (lines 85-115)

### Code Update Requirements

6. **Send Function Updates (Agent B - Critical)**
   - [ ] Update: `lib/integrations/chatwoot-client.ts::sendInitialMessage` (line 372)
     - [ ] Import: `trackBotMessage` from `lib/utils/message-tracking`
     - [ ] Extract: `sentMessage.id` from Chatwoot response
     - [ ] Call: `trackBotMessage(conversationId, initialMessage, messageId)`
     - [ ] Add: Try-catch around tracking (non-blocking errors)
     - [ ] Update: Console logs to show tracking status

   - [ ] Update: `app/api/chatwoot-webhook/route.ts::sendMessageToChatwoot` (line 346)
     - [ ] Import: `trackBotMessage` from `lib/utils/message-tracking`
     - [ ] Parse: `await response.json()` to extract `responseData.id`
     - [ ] Call: `trackBotMessage(conversationId, message, messageId)`
     - [ ] Add: Error logging for tracking failures

   - [ ] Update: `app/api/chatwoot-ai-webhook/route.ts::sendMessageToChatwoot` (line 413)
     - [ ] Import: `trackBotMessage` from `lib/utils/message-tracking`
     - [ ] Parse: `await response.json()` to extract `responseData.id`
     - [ ] Call: `trackBotMessage(conversationId, message, messageId)`
     - [ ] Match: Implementation with chatwoot-webhook version (DRY)

7. **Webhook Handler Updates (Agent A - Critical)**
   - [ ] Update: `app/api/chatwoot-webhook/route.ts` imports
     - [ ] Import: `trackBotMessage`, `checkIfEcho`, `botMessageTracker` from shared utility
     - [ ] Remove: Local definitions (moved to shared file)

   - [ ] Add: Echo detection logic (after line 52, before fingerprint check)
     - [ ] Call: `checkIfEcho(conversationId, content, messageId)`
     - [ ] If true: Return `{ received: true, skipped: 'bot_echo' }`

   - [ ] Update: Fingerprint deduplication (lines 54-60)
     - [ ] Replace: Global `processedMessages` Set with `Map<number, Set<string>>`
     - [ ] Add: `conversationTimestamps` Map for TTL tracking
     - [ ] Implement: Per-conversation fingerprint Sets

   - [ ] Update: Cache cleanup interval (lines 9-11)
     - [ ] Replace: Simple `clear()` with smart TTL cleanup
     - [ ] Add: Separate cleanup for `processedMessages` and `botMessageTracker`

8. **Cache Management Setup (Agent A)**
   - [ ] Configure: `MESSAGE_FINGERPRINT_TTL = 10 * 60 * 1000` (10 min)
   - [ ] Configure: `BOT_MESSAGE_CACHE_TTL = 15 * 60 * 1000` (15 min)
   - [ ] Configure: `CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000` (5 min)
   - [ ] Configure: `MAX_BOT_MESSAGES_PER_CONVERSATION = 10` (LRU limit)
   - [ ] Configure: `MAX_MESSAGE_IDS_PER_CONVERSATION = 20` (ID Set limit)

### Testing Requirements

9. **Unit Tests (Both Agents)**
   - [ ] Create: `lib/utils/__tests__/message-tracking.test.ts`
     - [ ] Test: `generateMessageFingerprint()` with whitespace/case variations
     - [ ] Test: `trackBotMessage()` LRU eviction (11th message evicts 1st)
     - [ ] Test: `checkIfEcho()` via content match, ID match, no match
     - [ ] Test: Message ID extraction and fallback generation
     - [ ] Test: Cache cleanup TTL expiration

   - [ ] Create: `app/api/chatwoot-webhook/__tests__/deduplication.test.ts`
     - [ ] Test: Duplicate fingerprint detection
     - [ ] Test: Bot echo detection (both ID and content paths)
     - [ ] Test: Per-conversation isolation (no cross-contamination)

10. **Integration Tests (Both Agents)**
    - [ ] Create: `scripts/test-webhook-deduplication.js`
      - [ ] Test: Send identical message twice → 2nd skipped with "duplicate_fingerprint"
      - [ ] Test: Bot echo → skipped with "bot_echo"
      - [ ] Test: n8n response → NOT blocked (outgoing message filter works)

    - [ ] Create: `scripts/test-message-send-tracking.js`
      - [ ] Test: Form submission → greeting tracked in `botMessageTracker`
      - [ ] Test: Webhook with greeting content → detected as echo
      - [ ] Test: All 3 send functions → verify tracking works

11. **Manual Validation (Real Chatwoot)**
    - [ ] Setup: ngrok tunnel to dev server
    - [ ] Test Case 1: Initial greeting echo
      - [ ] Submit form → Check logs for "Tracked bot message"
      - [ ] If echo webhook: Check logs for "Echo detected via message ID"
      - [ ] Verify: Only ONE greeting in Chatwoot UI

    - [ ] Test Case 2: n8n AI response (not blocked)
      - [ ] Send user message → n8n generates response
      - [ ] Verify: Response appears in chat (not blocked)
      - [ ] Check logs: Skipped as "outgoing message" (NOT "bot_echo")

    - [ ] Test Case 3: Rapid messages (no duplicates)
      - [ ] Send 5 user messages quickly
      - [ ] Verify: 10 messages total (5 user + 5 bot), no duplicates

### Monitoring Setup

12. **Logging & Observability (Both Agents)**
    - [ ] Add: Deduplication stats logging (every 100 webhooks)
      - [ ] Track: `fingerprintSkipCount`, `echoSkipCount`, `totalWebhooks`
      - [ ] Track: `processedMessages.size`, `botMessageTracker.size`
      - [ ] Track: Memory usage (`process.memoryUsage().heapUsed`)

    - [ ] Add: Tracking failure warnings
      - [ ] Log: When tracking fails but send succeeds
      - [ ] Log: When Chatwoot doesn't return message ID (fallback used)
      - [ ] Log: When race condition detected (echo by content, not ID)

    - [ ] Add: Debug endpoint (dev only): `GET /api/debug/message-tracking/:conversationId`
      - [ ] Return: Cache contents (tracked messages, fingerprints, timestamps)

---

## Implementation Order & Dependencies

#PATH_DECISION: Implementation sequencing - Foundation first (shared utility), then send-side (tracking), then webhook-side (detection), finally testing and monitoring. Parallel work possible within phases but sequential between phases to prevent integration conflicts.

### Phase 1: Foundation (Sequential - Must Complete First)

**Rationale:** All other phases depend on shared utility existing and being correctly structured.

- [ ] **Step 1.1:** Create `lib/utils/message-tracking.ts` (Agent A + B coordination)
  - **Owner:** Implementation agent (coordinating both plans)
  - **Dependencies:** None
  - **Contents:**
    - Export `botMessageTracker: Map<number, BotMessageCache>`
    - Export `BotMessageCache` interface
    - Export `trackBotMessage()` function (Agent A's implementation)
    - Export `checkIfEcho()` function (Agent A's implementation)
    - Export `generateMessageFingerprint()` function (Agent A's implementation)
  - **Validation:** TypeScript compiles with no errors, exports accessible

- [ ] **Step 1.2:** Set up cache cleanup interval
  - **Owner:** Implementation agent
  - **Dependencies:** Step 1.1 complete
  - **Contents:**
    - `conversationTimestamps: Map<number, number>`
    - TTL-based cleanup logic (Agent A's implementation)
    - Cleanup interval: 5 minutes
  - **Validation:** No memory leaks, old conversations evicted correctly

- [ ] **Step 1.3:** Initialize cache configuration constants
  - **Owner:** Implementation agent
  - **Dependencies:** Step 1.1 complete
  - **Constants:**
    - `MESSAGE_FINGERPRINT_TTL = 10 * 60 * 1000`
    - `BOT_MESSAGE_CACHE_TTL = 15 * 60 * 1000`
    - `CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000`
    - `MAX_BOT_MESSAGES_PER_CONVERSATION = 10`
  - **Validation:** Constants exported and used in cleanup logic

### Phase 2: Send-Side Integration (Parallel Within Phase)

**Rationale:** Three send functions can be updated in parallel - no dependencies between them.

**Priority Order:** Initial greeting (critical) → Webhook fallback (medium) → AI webhook (medium)

- [ ] **Step 2.1:** Update `lib/integrations/chatwoot-client.ts::sendInitialMessage` (CRITICAL)
  - **Owner:** Agent B implementation
  - **Dependencies:** Phase 1 complete
  - **Priority:** 🔴 CRITICAL (primary echo source)
  - **Changes:**
    - Import `trackBotMessage` from `lib/utils/message-tracking`
    - Extract `sentMessage.id` after `response.ok`
    - Generate `messageId`: `sentMessage.id?.toString() || fallback-${conversationId}-${Date.now()}`
    - Call `trackBotMessage(conversationId, initialMessage, messageId)` in try-catch
    - Update console logs: Show `messageId` and tracking status
  - **Validation:** Test form submission → verify tracking logs appear

- [ ] **Step 2.2:** Update `app/api/chatwoot-webhook/route.ts::sendMessageToChatwoot` (MEDIUM)
  - **Owner:** Agent B implementation
  - **Dependencies:** Phase 1 complete
  - **Priority:** 🟡 MEDIUM (fallback path)
  - **Changes:**
    - Import `trackBotMessage` from `lib/utils/message-tracking`
    - Parse `await response.json()` to get `responseData`
    - Extract `messageId`: `responseData.id?.toString() || fallback-${conversationId}-${Date.now()}`
    - Call `trackBotMessage(conversationId, message, messageId)` in try-catch
    - Add error logging for tracking failures
  - **Validation:** Disable n8n → send user message → verify fallback tracked

- [ ] **Step 2.3:** Update `app/api/chatwoot-ai-webhook/route.ts::sendMessageToChatwoot` (MEDIUM)
  - **Owner:** Agent B implementation
  - **Dependencies:** Phase 1 complete
  - **Priority:** 🟡 MEDIUM (alternative AI path)
  - **Changes:**
    - Import `trackBotMessage` from `lib/utils/message-tracking`
    - Parse response to get `responseData.id`
    - Generate `messageId` (same pattern as Step 2.2)
    - Call `trackBotMessage(conversationId, message, messageId)` in try-catch
    - Match implementation with chatwoot-webhook version (DRY)
  - **Validation:** Test AI webhook alternative → verify tracking

### Phase 3: Webhook Integration (Sequential - Order Matters)

**Rationale:** Echo detection must be added before fingerprint updates to maintain correct filter order.

- [ ] **Step 3.1:** Update `app/api/chatwoot-webhook/route.ts` imports
  - **Owner:** Agent A implementation
  - **Dependencies:** Phase 1 complete, Phase 2 optional (can work in parallel)
  - **Changes:**
    - Import `trackBotMessage`, `checkIfEcho`, `botMessageTracker` from shared utility
    - Remove local definitions of these functions (now in shared file)
  - **Validation:** TypeScript compiles, no import errors

- [ ] **Step 3.2:** Add bot echo detection logic (NEW - Agent A)
  - **Owner:** Agent A implementation
  - **Dependencies:** Step 3.1 complete
  - **Location:** After outgoing message check (line 52), BEFORE fingerprint check
  - **Changes:**
    - Extract `messageId = event.id?.toString()`
    - Extract `content = event.content || event.message?.content || ''`
    - Call `checkIfEcho(conversationId, content, messageId)`
    - If true: Return `{ received: true, skipped: 'bot_echo' }`
  - **Validation:** Test with tracked message → verify echo skipped

- [ ] **Step 3.3:** Update fingerprint deduplication (REFACTOR - Agent A)
  - **Owner:** Agent A implementation
  - **Dependencies:** Step 3.2 complete (echo detection must come first)
  - **Changes:**
    - Replace `processedMessages: Set<string>` with `Map<number, Set<string>>`
    - Add `conversationTimestamps: Map<number, number>`
    - Update fingerprint check to use per-conversation Sets
    - Call `generateMessageFingerprint()` from shared utility
  - **Validation:** Test duplicate content → verify fingerprint deduplication works

- [ ] **Step 3.4:** Update cache cleanup logic (REFACTOR - Agent A)
  - **Owner:** Agent A implementation
  - **Dependencies:** Step 3.3 complete
  - **Changes:**
    - Replace 5-min `clear()` with smart TTL cleanup
    - Clean `processedMessages` (10-min TTL)
    - Clean `botMessageTracker` (15-min TTL)
    - Log cleanup stats (conversations cleaned, cache sizes)
  - **Validation:** Wait 10+ min → verify old conversations cleaned

### Phase 4: Testing (Parallel Within Test Types, Sequential Across Types)

**Rationale:** Unit tests can run in parallel, integration tests depend on unit tests passing, manual tests depend on integration tests passing.

**Sequence:** Unit Tests → Integration Tests → Manual Validation

- [ ] **Step 4.1:** Unit tests for message tracking (Agent B focus)
  - **Owner:** Testing phase
  - **Dependencies:** Phase 1-3 complete
  - **File:** `lib/utils/__tests__/message-tracking.test.ts`
  - **Coverage:**
    - Message ID extraction from Chatwoot response
    - Fallback ID generation when ID missing
    - `trackBotMessage()` with ID and without ID
    - `checkIfEcho()` via ID match and content match
    - LRU eviction (11th message evicts 1st)
  - **Validation:** All tests pass, coverage > 90%

- [ ] **Step 4.2:** Unit tests for fingerprinting (Agent A focus)
  - **Owner:** Testing phase
  - **Dependencies:** Phase 1-3 complete
  - **File:** `app/api/chatwoot-webhook/__tests__/deduplication.test.ts`
  - **Coverage:**
    - `generateMessageFingerprint()` with whitespace variations
    - Fingerprint consistency (same input → same output)
    - Per-conversation differentiation (same content, different conversations)
    - Message type differentiation (incoming vs outgoing)
  - **Validation:** All tests pass, coverage > 90%

- [ ] **Step 4.3:** Unit tests for cache cleanup (Agent A focus)
  - **Owner:** Testing phase
  - **Dependencies:** Phase 1-3 complete
  - **File:** Same as Step 4.2
  - **Coverage:**
    - TTL-based cleanup (expired conversations removed)
    - Active conversation preservation (recent activity not cleaned)
    - Separate TTL for fingerprints (10 min) and bot cache (15 min)
  - **Validation:** Mock timers, verify cleanup logic

- [ ] **Step 4.4:** Integration test - Send → Track → Echo flow (Critical Path)
  - **Owner:** Testing phase
  - **Dependencies:** Steps 4.1-4.3 pass
  - **File:** `scripts/test-message-send-tracking.js`
  - **Scenario:**
    1. Submit form → conversation created
    2. Verify: `trackBotMessage()` called with greeting content
    3. Check: `botMessageTracker` contains conversation ID and message ID
    4. Send webhook with same content and ID
    5. Verify: `checkIfEcho()` returns true
    6. Confirm: Webhook skipped with "bot_echo"
  - **Validation:** End-to-end flow works, echo detected

- [ ] **Step 4.5:** Integration test - Fingerprint deduplication (Fallback Path)
  - **Owner:** Testing phase
  - **Dependencies:** Steps 4.1-4.3 pass
  - **File:** `scripts/test-webhook-deduplication.js`
  - **Scenario:**
    1. Send identical message twice (different IDs)
    2. Verify: 2nd message skipped with "duplicate_fingerprint"
    3. Send whitespace variation of same message
    4. Verify: Caught by normalization
  - **Validation:** Content-based deduplication works

- [ ] **Step 4.6:** Integration test - n8n response NOT blocked (Critical)
  - **Owner:** Testing phase
  - **Dependencies:** Steps 4.1-4.3 pass
  - **File:** Same as Step 4.5
  - **Scenario:**
    1. Send user message → n8n generates response
    2. n8n sends to Chatwoot API
    3. Webhook fired with `message_type: 1` (outgoing)
    4. Verify: Skipped with "outgoing message" (NOT "bot_echo")
    5. Confirm: Response appears in chat widget
  - **Validation:** n8n responses not blocked by echo detection

- [ ] **Step 4.7:** Manual validation with real Chatwoot (Final Gate)
  - **Owner:** Testing phase
  - **Dependencies:** All integration tests pass (Steps 4.4-4.6)
  - **Setup:** ngrok tunnel + Chatwoot webhook configured
  - **Test Cases:**
    1. Initial greeting echo (primary issue) - See Integration Checklist #11
    2. n8n AI response not blocked - See Integration Checklist #11
    3. Rapid messages (5 user + 5 bot) - See Integration Checklist #11
  - **Validation:** Zero duplicates in Chatwoot UI, all logs correct

### Phase 5: Monitoring & Post-Deployment (Sequential)

**Rationale:** Monitoring setup required before deployment, observability needed after deployment.

- [ ] **Step 5.1:** Add deduplication statistics logging
  - **Owner:** Implementation agent
  - **Dependencies:** Phase 1-4 complete
  - **Changes:**
    - Log every 100 webhooks: skip counts, cache sizes, memory usage
    - Log tracking failures (if any)
    - Log fallback ID usage (if any)
    - Log race condition indicators (echo by content instead of ID)
  - **Validation:** Logs appear in production, stats accurate

- [ ] **Step 5.2:** Add debug endpoint (dev only)
  - **Owner:** Implementation agent
  - **Dependencies:** Phase 1-4 complete
  - **Endpoint:** `GET /api/debug/message-tracking/:conversationId`
  - **Returns:**
    - `botMessageTracker` cache contents for conversation
    - Tracked message IDs and content hashes
    - Cache timestamps and TTL remaining
  - **Validation:** Accessible in dev, returns correct data

- [ ] **Step 5.3:** Week 1 monitoring (post-deployment)
  - **Owner:** Operations/DevOps
  - **Dependencies:** Deployed to production
  - **Metrics:** See "Consolidated Success Metrics" section
  - **Actions:**
    - Monitor echo skip rate (expect 2-10%)
    - Monitor user-reported duplicates (expect 0)
    - Monitor tracking success rate (expect 100%)
    - Monitor memory usage (expect < 10 MB for cache)
  - **Validation:** All metrics within target ranges

### Dependency Graph

```
Phase 1 (Foundation)
  └─ Step 1.1 (Create shared utility) ← BLOCKING for all other phases
     └─ Step 1.2 (Cache cleanup)
     └─ Step 1.3 (Constants)

Phase 2 (Send-Side) - PARALLEL WITHIN PHASE
  ├─ Step 2.1 (Initial greeting tracking) ← CRITICAL PRIORITY
  ├─ Step 2.2 (Webhook fallback tracking)
  └─ Step 2.3 (AI webhook tracking)

Phase 3 (Webhook-Side) - SEQUENTIAL WITHIN PHASE
  └─ Step 3.1 (Update imports)
     └─ Step 3.2 (Add echo detection) ← MUST come before fingerprint
        └─ Step 3.3 (Update fingerprint)
           └─ Step 3.4 (Update cleanup)

Phase 4 (Testing) - SEQUENTIAL BY TYPE
  └─ Steps 4.1-4.3 (Unit tests) ← PARALLEL
     └─ Steps 4.4-4.6 (Integration tests) ← PARALLEL
        └─ Step 4.7 (Manual validation) ← SEQUENTIAL (final gate)

Phase 5 (Monitoring) - SEQUENTIAL
  └─ Step 5.1 (Logging)
     └─ Step 5.2 (Debug endpoint)
        └─ Step 5.3 (Week 1 monitoring)
```

**Parallel Work Opportunities:**
- Phase 2 steps can be done simultaneously (3 developers)
- Phase 4 unit tests can be done simultaneously (2 developers)
- Phase 4 integration tests can be done simultaneously (after unit tests pass)

**Sequential Constraints:**
- Phase 1 MUST complete before Phase 2 or Phase 3
- Phase 3 steps must be done in order (imports → echo → fingerprint → cleanup)
- Phase 4.7 (manual) MUST come after integration tests pass
- Phase 5 MUST come after Phase 4 (no deployment without testing)

---

## Unified Testing Strategy

#LCL_EXPORT_CRITICAL: test_plan::comprehensive_coverage_across_all_deduplication_layers

### Unit Tests (Priority Order)

**File 1: `lib/utils/__tests__/message-tracking.test.ts`** (Agent B focus)

1. **Message ID Extraction (Priority: HIGH)**
   ```typescript
   describe('Message ID Extraction', () => {
     test('extracts Chatwoot message ID from response')
     test('generates fallback ID when Chatwoot ID missing')
     test('fallback ID format matches regex: fallback-{convId}-{timestamp}')
   })
   ```

2. **trackBotMessage Integration (Priority: HIGH)**
   ```typescript
   describe('trackBotMessage', () => {
     test('tracks message with Chatwoot ID (both content and ID stored)')
     test('tracks message without ID (content-only)')
     test('LRU eviction works (11th message evicts 1st)')
     test('message ID Set size limited to 20')
     test('updates conversation timestamp for TTL')
   })
   ```

3. **checkIfEcho Detection (Priority: HIGH)**
   ```typescript
   describe('checkIfEcho', () => {
     test('detects echo via message ID match (even if content different)')
     test('detects echo via content hash match (even if ID different)')
     test('normalizes content before matching (whitespace/case variations)')
     test('does not false-positive on different conversation')
     test('returns false when no cache exists for conversation')
   })
   ```

4. **Error Handling (Priority: MEDIUM)**
   ```typescript
   describe('Tracking Error Handling', () => {
     test('tracking throws but send continues (non-blocking)')
     test('logs error when tracking fails')
   })
   ```

**File 2: `app/api/chatwoot-webhook/__tests__/deduplication.test.ts`** (Agent A focus)

5. **Message Fingerprinting (Priority: HIGH)**
   ```typescript
   describe('generateMessageFingerprint', () => {
     test('generates consistent fingerprint for identical content')
     test('normalizes whitespace variations (single/multiple spaces)')
     test('normalizes case (Hello vs hello)')
     test('normalizes line breaks (\\r\\n vs \\n)')
     test('differentiates by conversation ID (same content, different convs)')
     test('differentiates by message type (incoming vs outgoing)')
     test('fingerprint format: {conversationId}-{16-char hex}')
   })
   ```

6. **Fingerprint Deduplication (Priority: HIGH)**
   ```typescript
   describe('Fingerprint-Based Deduplication', () => {
     test('skips duplicate message with same fingerprint')
     test('per-conversation isolation (same fingerprint, different conv not skipped)')
     test('updates conversation timestamp on new fingerprint')
   })
   ```

7. **Cache Cleanup (Priority: MEDIUM)**
   ```typescript
   describe('Cache Cleanup', () => {
     test('cleans up expired conversation fingerprints (> 10 min TTL)')
     test('cleans up expired bot message caches (> 15 min TTL)')
     test('preserves active conversations (< TTL)')
     test('logs cleanup stats (conversations cleaned, remaining)')
   })
   ```

### Integration Tests (Scenario-Based)

**File 3: `scripts/test-message-send-tracking.js`** (Agent B scenarios)

8. **Scenario 1: Initial Greeting Tracking (Priority: CRITICAL)**
   ```javascript
   async function testInitialGreetingTracking() {
     // Submit form → conversation created
     // Verify: sendInitialMessage called
     // Check: botMessageTracker contains conversationId
     // Verify: messageId extracted and stored
     // Expected: Logs show "Tracked bot message: { contentHash, messageId }"
   }
   ```

9. **Scenario 2: All Send Functions Track (Priority: HIGH)**
   ```javascript
   async function testAllSendFunctionsTrack() {
     // Test: sendInitialMessage (chatwoot-client)
     // Test: sendMessageToChatwoot (chatwoot-webhook)
     // Test: sendMessageToChatwoot (chatwoot-ai-webhook)
     // Verify: All three tracked correctly
     // Expected: 3 entries in botMessageTracker
   }
   ```

10. **Scenario 3: Fallback ID Generation (Priority: MEDIUM)**
    ```javascript
    async function testFallbackIdGeneration() {
      // Mock: Chatwoot response without ID
      // Verify: Fallback ID generated (fallback-{convId}-{timestamp})
      // Check: Tracking still succeeds with fallback ID
      // Expected: Warning log "Chatwoot did not return message ID"
    }
    ```

**File 4: `scripts/test-webhook-deduplication.js`** (Agent A scenarios)

11. **Scenario 4: Bot Echo Detection (Priority: CRITICAL)**
    ```javascript
    async function testBotEchoDetection() {
      // Step 1: Track bot message (simulate send)
      // Step 2: Send webhook with same content and ID
      // Verify: checkIfEcho() returns true
      // Expected: Webhook skipped with "bot_echo"
    }
    ```

12. **Scenario 5: Duplicate Fingerprint Detection (Priority: HIGH)**
    ```javascript
    async function testDuplicateFingerprint() {
      // Send identical message twice (different IDs)
      // Verify: 1st processed, 2nd skipped
      // Expected: 2nd returns { skipped: 'duplicate_fingerprint' }
    }
    ```

13. **Scenario 6: n8n Response NOT Blocked (Priority: CRITICAL)**
    ```javascript
    async function testN8nResponseNotBlocked() {
      // Simulate n8n AI response (message_type: 1, outgoing)
      // Verify: Skipped with "outgoing message" (NOT "bot_echo")
      // Expected: Response NOT in botMessageTracker (wasn't sent by us)
    }
    ```

14. **Scenario 7: Whitespace Variation Deduplication (Priority: MEDIUM)**
    ```javascript
    async function testWhitespaceNormalization() {
      // Send message: "Hello  World" (double space)
      // Send message: "Hello   World" (triple space)
      // Send message: "hello world" (lowercase, single space)
      // Verify: All three have same fingerprint
      // Expected: 2nd and 3rd skipped as duplicates
    }
    ```

15. **Scenario 8: Per-Conversation Isolation (Priority: HIGH)**
    ```javascript
    async function testPerConversationIsolation() {
      // Send message to conversation 123: "Hello"
      // Send message to conversation 456: "Hello" (same content)
      // Verify: Both processed (different fingerprints due to conversationId)
      // Expected: Neither skipped
    }
    ```

### Manual Tests (Real Chatwoot - Final Validation)

**Setup:**
- Deploy to dev environment
- Configure ngrok tunnel: `ngrok http 3006`
- Update Chatwoot webhook URL to ngrok URL
- Ensure Chatwoot API credentials valid

16. **Manual Test 1: Initial Greeting Echo Prevention (Priority: CRITICAL)**
    ```
    Steps:
    1. Submit mortgage form on website
    2. Observe Chatwoot conversation (admin panel)
    3. Check server logs for tracking confirmation
    4. Wait for potential echo webhook (if Chatwoot sends it)
    5. Verify only ONE greeting visible in conversation

    Expected Logs:
    - "📤 Sending message to Chatwoot" (sendInitialMessage)
    - "✅ Initial broker message sent and tracked: { messageId: '12345' }"
    - "📝 Tracked bot message for echo detection: { contentHash: 'a4f7...', messageId: '12345' }"
    - [If echo occurs] "🔍 Echo detected via message ID: 12345"
    - [If echo occurs] "⏭️ Skipping echoed bot message"

    Expected UI:
    - Chatwoot conversation shows ONE greeting (bot side)
    - NO duplicate on user side
    - NO second copy on bot side

    Success Criteria: Zero duplicates
    ```

17. **Manual Test 2: n8n AI Response Not Blocked (Priority: CRITICAL)**
    ```
    Steps:
    1. Open Chatwoot widget on website
    2. Send user message: "What's your interest rate?"
    3. Wait for n8n AI broker response
    4. Verify response appears in widget
    5. Check server logs for correct filtering

    Expected Logs:
    - "🔗 Forwarding to n8n AI broker" (user message)
    - [n8n processes]
    - "📤 Sending message to Chatwoot" (n8n response via API)
    - [Webhook fires for n8n's message]
    - "⏭️ Skipping outgoing message to prevent loop" (NOT "bot_echo")

    Expected UI:
    - User message appears (right side)
    - AI response appears (left side)
    - NO duplicate AI response

    Success Criteria: AI response visible, not blocked
    ```

18. **Manual Test 3: Rapid Message Stress Test (Priority: MEDIUM)**
    ```
    Steps:
    1. Send 5 user messages rapidly (< 10 seconds total)
    2. Wait for all n8n responses
    3. Count messages in conversation
    4. Verify no duplicates

    Expected UI:
    - 5 user messages (right side)
    - 5 AI responses (left side)
    - Total: 10 messages (+ 1 initial greeting = 11)
    - NO duplicates

    Success Criteria: Exactly 11 messages, no duplicates
    ```

19. **Manual Test 4: Cache Cleanup Verification (Priority: LOW)**
    ```
    Steps:
    1. Create conversation, send greeting
    2. Check debug endpoint: GET /api/debug/message-tracking/{convId}
    3. Wait 10 minutes (fingerprint TTL)
    4. Check debug endpoint again
    5. Wait 15 minutes (bot cache TTL)
    6. Check debug endpoint again

    Expected Results:
    - At 10 min: Fingerprints cleaned, bot cache still present
    - At 15 min: Bot cache cleaned

    Success Criteria: TTL cleanup works correctly
    ```

### Test Coverage Targets

- **Unit Test Coverage:** > 90% for `lib/utils/message-tracking.ts`
- **Integration Test Coverage:** 100% of critical paths (echo detection, fingerprint dedup, n8n not blocked)
- **Manual Test Coverage:** 100% of user-facing scenarios (greeting, AI response, rapid messages)

### Test Execution Order

1. **Unit Tests First:** Run all unit tests (Steps 1-7) - MUST pass before proceeding
2. **Integration Tests Second:** Run integration scenarios (Steps 8-15) - MUST pass before manual tests
3. **Manual Tests Final:** Execute with real Chatwoot (Steps 16-19) - Final validation before deployment

### Rollback Triggers (If Tests Fail)

- **Unit Tests Fail:** Do NOT proceed to integration tests - fix code first
- **Integration Tests Fail:** Do NOT deploy - investigate root cause
- **Manual Test 1 or 2 Fails:** CRITICAL - do NOT deploy until fixed (core functionality broken)
- **Manual Test 3 Fails:** MEDIUM - investigate but may deploy with monitoring
- **Manual Test 4 Fails:** LOW - non-critical, can deploy with manual cleanup as fallback

---

## Consolidated Success Metrics

| Metric | Target | Source | Monitoring Method | Alert Threshold |
|--------|--------|--------|-------------------|-----------------|
| **Primary Metrics (Week 1)** |
| Echo skip rate | 2-10% of webhooks | Agent A | Log analysis: `echoSkipCount / totalWebhooks` | < 1% (too low, echoes not detected) OR > 15% (false positives) |
| Tracking success rate | 100% | Agent B | Log analysis: `trackedMessages / sentMessages` | < 99% (tracking failures) |
| User-reported duplicates | 0 | User feedback | Support tickets, user complaints | > 0 (CRITICAL issue) |
| Message ID extraction rate | 100% | Agent B | Log analysis: `chatwootIdsReturned / totalSends` | < 95% (Chatwoot not returning IDs) |
| False positive rate (echo) | < 0.5% | Agent A | Manual log review (legitimate messages blocked) | > 1% (too many false positives) |
| n8n response delivery | 100% | Agent A | Log analysis: `n8nResponsesDelivered / n8nResponsesSent` | < 100% (AI responses blocked) |
| **Performance Metrics** |
| Webhook processing latency | < 50ms overhead | Agent A | Timing logs: `fingerprintTime + echoCheckTime` | > 100ms (too slow) |
| Tracking latency (send-side) | < 2ms | Agent B | Timing logs: `trackBotMessage` execution time | > 5ms (tracking too slow) |
| API response overhead | < 3ms | Agent B | Timing logs: conversation creation total time | > 10ms (send-side impact too high) |
| Memory usage (cache) | < 10 MB | Both | `process.memoryUsage().heapUsed` for cache | > 50 MB (memory leak risk) |
| Cache size (conversations) | < 1000 | Both | `botMessageTracker.size` | > 1000 (need hard limit or Redis) |
| Race condition occurrences | 0 | Agent B | Log analysis: `echoByContentNotId / totalEchoes` | > 1% (timing buffer insufficient) |
| **Code Quality Metrics** |
| Send function update coverage | 3/3 (100%) | Agent B | Code review | < 3/3 (missing send function) |
| Unit test coverage | > 90% | Both | Jest coverage report | < 80% (insufficient testing) |
| Integration test pass rate | 100% | Both | Test results | < 100% (tests failing) |
| Manual test success | 100% | Both | Manual validation checklist | < 100% (real-world issues) |
| **Cache Health Metrics** |
| Fingerprint TTL cleanups | > 0 per hour | Agent A | Cleanup logs: `cleanedFingerprints` | 0 (cleanup not running) |
| Bot cache TTL cleanups | > 0 per hour | Agent A | Cleanup logs: `cleanedBotCaches` | 0 (cleanup not running) |
| Average cache entries per conv | < 10 messages | Agent A | `sum(cache.content.length) / botMessageTracker.size` | > 15 (LRU not working) |
| Fallback ID usage rate | < 1% | Agent B | Log analysis: `fallbackIdsGenerated / totalTracked` | > 5% (Chatwoot reliability issue) |

### Monitoring Dashboard (Recommended)

```typescript
// Log every 100 webhooks (Agent A + B combined)
if (webhookCount % 100 === 0) {
  console.log('📊 Unified Deduplication Stats:', {
    // Webhook-side metrics (Agent A)
    totalWebhooks: webhookCount,
    fingerprintSkips: fingerprintSkipCount,
    echoSkips: echoSkipCount,
    outgoingSkips: outgoingMessageSkipCount,
    processedToN8n: n8nForwardCount,

    // Send-side metrics (Agent B)
    totalMessagesSent: sentMessageCount,
    messagesTracked: trackedMessageCount,
    trackingFailures: trackingFailureCount,
    fallbackIdsUsed: fallbackIdCount,

    // Cache metrics (Both)
    conversationsInCache: botMessageTracker.size,
    fingerprintSetsInCache: processedMessages.size,
    averageBotMessagesPerConv: calculateAverageCacheSize(),

    // Performance metrics
    avgWebhookLatency: calculateAvgLatency(),
    avgTrackingLatency: calculateAvgTrackingLatency(),
    memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,

    // Race condition indicators
    raceConditionsPossible: echoByContentNotIdCount,

    // Timestamp
    timestamp: new Date().toISOString()
  });
}
```

### Week 1 Validation Checklist

- [ ] **Day 1:** Deploy to production, monitor echo skip rate
  - Expected: 2-10% of webhooks skipped as echoes
  - Alert if: < 1% (echoes not detected) OR > 15% (false positives)

- [ ] **Day 2:** Monitor user feedback channels
  - Expected: Zero duplicate reports
  - Alert if: Any user reports duplicates

- [ ] **Day 3:** Verify n8n AI responses working
  - Expected: 100% delivery rate
  - Alert if: Any AI responses blocked

- [ ] **Day 4:** Check memory usage trends
  - Expected: < 10 MB cache footprint
  - Alert if: Memory growing unbounded (> 50 MB)

- [ ] **Day 5:** Review race condition indicators
  - Expected: 0 occurrences (echo by content instead of ID)
  - Alert if: > 1% of echoes detected by content fallback

- [ ] **Day 7:** Full metrics review
  - Compare all metrics against targets
  - Decide: Continue monitoring OR rollback OR optimize

---

## Risk Assessment

#PATH_RATIONALE: Overall risk - MEDIUM with strong mitigation strategies. Technical risks are well-understood and have fallbacks; integration risks are mitigated by phased rollout and comprehensive testing. Memory and timing risks are bounded by design constraints.

### Technical Risks

**Risk 1: Race Condition (Webhook Before Tracking)**
- **Severity:** LOW
- **Likelihood:** VERY LOW (< 1% of cases)
- **Impact:** Single duplicate message (caught by fingerprint fallback)
- **Evidence:** Agent B's timing analysis shows 98ms buffer (webhook at ~250ms, tracking at ~152ms)
- **Mitigation:**
  - Primary: 98ms timing buffer (covers 99%+ cases)
  - Fallback: Agent A's fingerprint deduplication catches edge cases
  - Monitoring: Log when echo detected by content instead of ID (indicates race)
  - Future: Pre-tracking option (Agent A's strategy) if race rate > 1%
- **Rollback Plan:** None needed (fingerprint fallback handles it)

**Risk 2: Chatwoot Not Returning Message ID**
- **Severity:** LOW
- **Likelihood:** VERY LOW (Chatwoot consistently returns IDs in testing)
- **Impact:** Fallback to content-only echo detection (slightly less precise)
- **Mitigation:**
  - Fallback ID generation: `fallback-${conversationId}-${Date.now()}`
  - Content-based echo detection still works without ID
  - Log warning when fallback used (monitor frequency)
- **Rollback Plan:** None needed (content-based detection is primary, ID is enhancement)

**Risk 3: Tracking Function Throws Exception**
- **Severity:** LOW
- **Likelihood:** VERY LOW (in-memory Map operations rarely fail)
- **Impact:** Send succeeds but echo detection degrades to fingerprint-only
- **Mitigation:**
  - Try-catch around all `trackBotMessage()` calls
  - Non-blocking errors (send continues even if tracking fails)
  - Log CRITICAL error with conversation ID and message preview
  - Agent A's fingerprint deduplication is safety net
- **Rollback Plan:** None needed (send succeeds, deduplication degrades gracefully)

**Risk 4: Memory Leak (Cache Unbounded Growth)**
- **Severity:** MEDIUM
- **Likelihood:** LOW (TTL cleanup prevents unbounded growth)
- **Impact:** Server memory exhaustion (> 100 MB), potential crashes
- **Mitigation:**
  - TTL-based cleanup every 5 minutes
  - Fingerprint cache: 10-min TTL
  - Bot message cache: 15-min TTL
  - LRU limits: 10 messages per conversation (content), 20 IDs per conversation
  - Memory estimation: ~2 KB per conversation (~200 KB for 100 active)
  - Hard limit recommendation: 1000 conversations max (Agent A's potential safeguard)
- **Rollback Plan:** Manual cache clear via debug endpoint, restart server

### Integration Risks

**Risk 5: n8n AI Responses Blocked by Echo Detection**
- **Severity:** HIGH (breaks AI broker functionality)
- **Likelihood:** LOW (n8n responses have `message_type: 1`, caught by outgoing filter)
- **Impact:** Users don't receive AI broker responses
- **Mitigation:**
  - Outgoing message filter runs BEFORE echo detection (line 49)
  - n8n sends via Chatwoot API → triggers outgoing webhook → skipped correctly
  - Echo detection only checks incoming messages (`message_type: 0`)
  - Integration test validates n8n not blocked (Test Scenario 6)
  - Manual test confirms AI responses visible (Manual Test 2)
- **Rollback Plan:** Disable echo detection only (keep fingerprint dedup), redeploy

**Risk 6: Frontend Message Polling Affected**
- **Severity:** MEDIUM (users don't see messages)
- **Likelihood:** VERY LOW (webhook dedup is server-side only)
- **Impact:** Frontend missing messages from history
- **Mitigation:**
  - Webhook deduplication affects only webhook forwarding to n8n
  - Frontend polls Chatwoot API directly (`GET /conversations/{id}/messages`)
  - Chatwoot API returns full history (unaffected by webhook skipping)
  - Existing queue deduplication in `app/api/chat/messages/route.ts` (lines 85-115) unchanged
- **Rollback Plan:** None needed (frontend and webhook are separate paths)

**Risk 7: Duplicate Webhook Configuration**
- **Severity:** MEDIUM (duplicate events despite deduplication)
- **Likelihood:** LOW (pre-deployment audit catches this)
- **Impact:** Deduplication catches duplicates but wastes processing
- **Mitigation:**
  - Pre-deployment webhook audit (Integration Checklist #1)
  - Check for both inbox-level and bot-level webhooks
  - Ensure only ONE webhook per event type
  - Disable redundant webhooks in Chatwoot admin panel
- **Rollback Plan:** Disable duplicate webhooks (no code changes needed)

### Deployment Risks

**Risk 8: Code Duplication (Three Send Functions)**
- **Severity:** LOW (maintenance burden, not functional risk)
- **Likelihood:** HIGH (tracking code duplicated 3x)
- **Impact:** Inconsistent tracking if one function updated without others
- **Mitigation:**
  - All three functions updated in Phase 2 (coordinated)
  - Integration tests validate all three track correctly
  - Code review checklist: Verify all send functions updated
  - Future refactor: Single `sendTrackedMessage()` utility (Agent B's recommendation)
- **Rollback Plan:** None needed (functional risk is low)

**Risk 9: False Positives (Legitimate Messages Blocked)**
- **Severity:** HIGH (users miss messages)
- **Likelihood:** VERY LOW (SHA-256 collision odds ~1 in 10^19)
- **Impact:** User messages incorrectly labeled as echoes or duplicates
- **Mitigation:**
  - Per-conversation fingerprinting (same content in different convs NOT duplicate)
  - Message type differentiation (incoming vs outgoing have different fingerprints)
  - Echo detection checks conversation-specific cache (no cross-conversation false positives)
  - Manual log review during Week 1 (validate no legitimate blocks)
- **Rollback Plan:** Disable echo detection, keep fingerprint dedup with shorter TTL

**Risk 10: Shared Utility Import Errors**
- **Severity:** HIGH (breaks send and webhook functions)
- **Likelihood:** LOW (TypeScript catches import errors at compile time)
- **Impact:** Functions can't import `trackBotMessage()`, deployment fails
- **Mitigation:**
  - TypeScript compile check before deployment
  - Phase 1 completion required before Phase 2/3 (no skipping foundation)
  - Integration tests validate imports work
- **Rollback Plan:** Git revert, redeploy previous version

### Overall Risk Summary

**Risk Level: MEDIUM**

**Rationale:**
- **High-Severity Risks:** n8n blocking (LOW likelihood), false positives (VERY LOW likelihood)
- **Medium-Severity Risks:** Memory leak (LOW likelihood), frontend impact (VERY LOW likelihood)
- **Low-Severity Risks:** Race condition (VERY LOW likelihood), tracking failures (VERY LOW likelihood)

**Confidence Level: HIGH**

**Why:**
- Dual-layer protection (echo detection + fingerprint fallback)
- Comprehensive testing strategy (unit + integration + manual)
- Phased rollout (dev → manual validation → production)
- Graceful degradation (tracking failures non-blocking)
- Strong monitoring (Week 1 metrics, debug endpoint)

**Deployment Recommendation: PROCEED with monitoring**

**Conditions:**
- All unit tests pass (> 90% coverage)
- All integration tests pass (100% critical paths)
- Manual Test 1 and 2 pass (greeting echo + n8n not blocked)
- Pre-deployment webhook audit complete
- Week 1 monitoring plan in place

---

## Rollback Plan

### Immediate Rollback (< 5 Minutes) - CRITICAL Issues

**Trigger Conditions:**
- n8n AI responses blocked (users not receiving broker responses)
- False positive rate > 5% (legitimate messages incorrectly skipped)
- Server memory > 500 MB (memory leak)
- User-reported duplicates > 10 in first hour (deduplication not working)

**Rollback Steps:**
1. **Feature Flag Disable:**
   ```bash
   # Set in environment variables (Vercel dashboard or .env)
   ENABLE_ECHO_DETECTION=false
   ENABLE_FINGERPRINT_DEDUP=false
   ```

2. **Deploy Flag:**
   ```bash
   # Redeploy with flags disabled (Vercel auto-deploys on env change)
   # Webhook falls back to old logic (event ID-only deduplication)
   ```

3. **Verify Rollback:**
   - Check logs: Echo detection logs should disappear
   - Test n8n: Send user message, verify AI response appears
   - Monitor duplicates: Duplicates may return (acceptable temporarily)

**Expected Recovery Time:** < 5 minutes (flag change + Vercel redeploy)

### Gradual Rollback - MEDIUM Issues

**Trigger Conditions:**
- Echo skip rate > 15% (too aggressive, possible false positives)
- Tracking success rate < 95% (tracking failures)
- Memory usage 50-500 MB (concerning but not critical)

**Rollback Steps:**
1. **Disable Echo Detection Only (Keep Fingerprint Dedup):**
   ```typescript
   // In app/api/chatwoot-webhook/route.ts
   // Comment out echo detection block:
   /*
   if (isIncomingMessage && checkIfEcho(...)) {
     return NextResponse.json({ received: true, skipped: 'bot_echo' });
   }
   */
   ```

2. **Keep Fingerprint Deduplication:**
   ```typescript
   // Leave fingerprint check active:
   if (conversationFingerprints.has(fingerprint)) {
     return NextResponse.json({ received: true, skipped: 'duplicate_fingerprint' });
   }
   ```

3. **Deploy Partial Rollback:**
   ```bash
   git add app/api/chatwoot-webhook/route.ts
   git commit -m "Disable echo detection (keep fingerprint dedup)"
   git push origin main
   ```

**Expected Recovery Time:** 10-15 minutes (code change + git push + Vercel deploy)

**Impact:**
- Echo detection disabled (potential echoes not caught by ID/content matching)
- Fingerprint deduplication still active (content-based duplicates still blocked)
- Reduces false positive risk while maintaining some protection

### Full Rollback - Restore Original State

**Trigger Conditions:**
- Multiple MEDIUM issues combined
- Uncertainty about root cause
- Need time to investigate without affecting users

**Rollback Steps:**
1. **Git Revert to Pre-Deduplication Commit:**
   ```bash
   # Find commit before deduplication changes
   git log --oneline

   # Revert to specific commit (replace COMMIT_HASH)
   git revert COMMIT_HASH

   # Or reset (if no other commits depend on it)
   git reset --hard COMMIT_HASH

   # Force push (use with caution)
   git push origin main --force
   ```

2. **Verify Original Behavior Restored:**
   - Check `app/api/chatwoot-webhook/route.ts`: Should have old 5-min Set-based dedup
   - Test send functions: Should NOT call `trackBotMessage()`
   - Test webhook: Should use event ID-only deduplication

**Expected Recovery Time:** 15-20 minutes (git revert + Vercel deploy + verification)

**Impact:**
- Original duplicate issue may return (user-reported problem)
- But system stability restored (no new risks)

### Post-Rollback Actions

**After Any Rollback:**
1. **Notify Stakeholders:**
   - Alert development team
   - Inform support team (users may report duplicates)
   - Update status page (if public-facing)

2. **Incident Analysis:**
   - Collect logs from rollback period
   - Review metrics (what triggered rollback?)
   - Identify root cause
   - Document lessons learned

3. **Fix Development:**
   - Address root cause in development environment
   - Re-run full testing suite (unit + integration + manual)
   - Deploy to staging for extended testing
   - Plan re-deployment with enhanced monitoring

4. **Re-Deployment Criteria:**
   - Root cause fixed and verified in staging
   - All tests pass (including regression tests for rollback issue)
   - Monitoring enhanced to detect rollback condition earlier
   - Stakeholder approval for re-deployment

### Rollback Decision Matrix

| Issue | Severity | Rollback Type | Expected Time |
|-------|----------|---------------|---------------|
| n8n responses blocked | CRITICAL | Immediate (feature flag) | < 5 min |
| False positives > 5% | CRITICAL | Immediate (feature flag) | < 5 min |
| Memory > 500 MB | CRITICAL | Immediate (feature flag) | < 5 min |
| User duplicates > 10/hour | CRITICAL | Immediate (feature flag) | < 5 min |
| Echo skip rate > 15% | MEDIUM | Gradual (disable echo only) | 10-15 min |
| Tracking success < 95% | MEDIUM | Gradual (disable echo only) | 10-15 min |
| Memory 50-500 MB | MEDIUM | Gradual (disable echo only) | 10-15 min |
| Multiple MEDIUM issues | HIGH | Full rollback (git revert) | 15-20 min |
| Uncertain root cause | MEDIUM | Full rollback (git revert) | 15-20 min |

### Manual Cache Clear (Emergency)

**If Rollback Doesn't Resolve Memory Issue:**

```typescript
// Create emergency endpoint: POST /api/debug/clear-cache
// (Only accessible with admin token)

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clear all caches
  botMessageTracker.clear();
  processedMessages.clear();
  conversationTimestamps.clear();

  console.log('🚨 EMERGENCY: All caches manually cleared');

  return NextResponse.json({
    cleared: true,
    timestamp: new Date().toISOString()
  });
}
```

**Use only as last resort** (clears all echo detection state, duplicates may occur temporarily)

---

## Post-Implementation Monitoring

### Week 1: Intensive Monitoring (Daily Reviews)

**Daily Metrics Review (9 AM daily):**
- [ ] **Day 1:** Echo skip rate, tracking success rate, user reports
  - Target: 2-10% echo skips, 100% tracking, 0 user reports
  - Alert if: Outside targets

- [ ] **Day 2:** n8n delivery rate, false positive check
  - Target: 100% n8n delivery, 0 false positives
  - Action: Manual log review for any "bot_echo" with legitimate messages

- [ ] **Day 3:** Memory usage trend, cache sizes
  - Target: < 10 MB memory, < 200 active conversations
  - Alert if: Memory growing linearly (indicates leak)

- [ ] **Day 4:** Performance metrics (latency)
  - Target: < 50ms webhook overhead, < 2ms tracking
  - Alert if: Latency increasing over time

- [ ] **Day 5:** Race condition indicators
  - Target: 0 occurrences (echo by content instead of ID)
  - Alert if: > 1% of echoes via content fallback

- [ ] **Day 6:** Fallback ID usage, Chatwoot reliability
  - Target: < 1% fallback IDs used
  - Alert if: > 5% (Chatwoot not returning IDs)

- [ ] **Day 7:** Comprehensive review, decision point
  - Review all metrics against targets
  - Decision: Continue to Week 2 OR rollback OR optimize

### Week 2-4: Reduced Monitoring (Weekly Reviews)

**Weekly Metrics Review (Fridays):**
- [ ] **Week 2:** Aggregate metrics (weekly averages)
  - Compare to Week 1 baseline
  - Check for any degradation or improvement

- [ ] **Week 3:** Long-term trends
  - Memory usage over 3 weeks
  - Cache cleanup effectiveness
  - User satisfaction (support ticket count)

- [ ] **Week 4:** Final validation
  - All metrics stable within targets
  - Zero critical issues
  - Decision: Continue monitoring OR reduce to monthly

### Ongoing Monitoring (Monthly Reviews)

**Monthly Metrics Dashboard:**
- Echo skip rate (monthly average)
- User-reported duplicates (monthly count)
- Memory usage (max, average, 95th percentile)
- n8n delivery rate (monthly average)
- Tracking success rate (monthly average)

**Quarterly Reviews:**
- Consider optimizations (e.g., Redis if > 1000 concurrent conversations)
- Review code duplication (refactor to single send function)
- Evaluate feature flag removal (if stable for 3+ months)

### Alert Thresholds (Real-Time)

**Critical Alerts (Immediate Response Required):**
- n8n delivery rate < 100% (AI responses blocked)
- User-reported duplicates > 0 (core issue not fixed)
- Memory usage > 100 MB (potential leak)
- False positive rate > 1% (legitimate messages blocked)

**Warning Alerts (Investigate Within 24 Hours):**
- Echo skip rate < 1% or > 15% (tuning needed)
- Tracking success rate < 99% (tracking failures)
- Race condition rate > 1% (timing buffer insufficient)
- Fallback ID usage > 5% (Chatwoot reliability issue)

**Info Alerts (Review During Weekly Check):**
- Cache size > 500 conversations (consider Redis)
- Average cache entries per conversation > 12 (LRU not working optimally)
- Webhook latency > 75ms (performance degradation)

### Monitoring Tools Setup

**Log Aggregation:**
```bash
# Recommended: Use Vercel Logs or external log service (e.g., Datadog, Logtail)
# Filter logs by:
# - "📊 Unified Deduplication Stats" (metrics logs)
# - "⚠️" (warning logs)
# - "❌" (error logs)
# - "🔍 Echo detected" (echo detection logs)
```

**Debug Endpoint Usage:**
```bash
# Weekly cache inspection (dev environment)
curl https://dev.nextnest.sg/api/debug/message-tracking/123

# Expected response:
{
  "conversationId": 123,
  "botMessageCache": {
    "contentHashes": ["a4f7e8d2c1b0a3f9", "b5g8f9e3d2c1b4a0"],
    "messageIds": ["123456", "123457"],
    "timestamp": "2023-10-15T10:30:00.000Z",
    "ttlRemaining": "12m 34s"
  },
  "fingerprintCache": {
    "fingerprints": ["123-a4f7e8d2c1b0a3f9", "123-b5g8f9e3d2c1b4a0"],
    "timestamp": "2023-10-15T10:30:00.000Z",
    "ttlRemaining": "7m 12s"
  }
}
```

**Memory Monitoring:**
```typescript
// Add to cache cleanup interval (every 5 min)
const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
if (memoryUsageMB > 50) {
  console.warn('⚠️ High memory usage:', {
    memoryMB: memoryUsageMB,
    conversationsInCache: botMessageTracker.size,
    fingerprintsInCache: processedMessages.size
  });
}
```

### User Feedback Channels

**Monitor for Duplicate Reports:**
- Support email (support@nextnest.sg)
- Chatwoot widget feedback
- Direct user complaints
- Analytics (form abandonment, chat exit rates)

**Response Protocol if User Reports Duplicate:**
1. Acknowledge issue immediately
2. Collect conversation ID from user
3. Check debug endpoint for conversation
4. Review logs for that conversation (why wasn't duplicate caught?)
5. Escalate to development team if deduplication failed
6. Consider rollback if multiple reports (> 3 in 1 hour)

---

## Remaining Uncertainties for Verification (Phase 4)

#PLAN_UNCERTAINTY: Real-world Chatwoot webhook timing variance under production load (98ms buffer may need adjustment based on production data)

**Uncertainty 1: Production Webhook Latency**
- **Context:** Agent B's timing analysis based on development environment (98ms buffer)
- **Question:** Does Chatwoot webhook latency remain 50-200ms under production load (100+ concurrent users)?
- **Risk:** If production latency < 50ms, race conditions may occur more frequently
- **Verification Method:**
  - Week 1 monitoring: Log webhook arrival times vs. message sent times
  - Calculate actual buffer in production
  - Check race condition rate (echo detected by content instead of ID)
- **Action if Buffer < 50ms:** Implement Agent A's pre-tracking strategy (track before send)

#PLAN_UNCERTAINTY: False positive rate for fingerprint deduplication in real conversational data (theoretical collision odds don't account for templated message patterns)

**Uncertainty 2: False Positive Rate in Production**
- **Context:** SHA-256 collision odds are 1 in 10^19, but templated messages (greetings, disclaimers) may have similar content
- **Question:** Do templated messages across different conversations trigger false positives?
- **Risk:** User in conversation A sends "Hello", user in conversation B sends "Hello" → flagged as duplicate?
- **Current Mitigation:** Fingerprint includes `conversationId` (prevents cross-conversation false positives)
- **Verification Method:**
  - Week 1 monitoring: Manual log review of all "duplicate_fingerprint" skips
  - Check if any skipped messages were legitimate (different conversations, different users)
- **Action if False Positives Found:** Add user ID to fingerprint composite (`${conversationId}:${userId}:${messageType}:${content}`)

#PLAN_UNCERTAINTY: n8n timeout retries behavior when webhook deduplication active (if n8n retries on timeout, will duplicates occur?)

**Uncertainty 3: n8n Retry Behavior**
- **Context:** Agent A flagged n8n timeout retries as potential duplicate source
- **Question:** If n8n workflow times out (> 30s), does Chatwoot retry webhook? Will fingerprint deduplication catch retry?
- **Risk:** User message triggers n8n workflow → timeout → Chatwoot retries → duplicate forwarding to n8n
- **Current Mitigation:** Fingerprint deduplication catches identical message content
- **Verification Method:**
  - Test: Simulate n8n timeout (add artificial delay in n8n workflow)
  - Observe: Does Chatwoot retry webhook?
  - Verify: Is retry caught by fingerprint deduplication?
- **Action if Duplicates Found:** Implement n8n-side idempotency (Agent A's recommended enhancement with Redis lock)

#PLAN_UNCERTAINTY: Code duplication refactoring timing (should three send functions be unified before or after deduplication fix?)

**Uncertainty 4: Refactoring Priority**
- **Context:** Agent B recommends accepting duplication for Phase 1, refactoring later
- **Question:** Is code duplication (3x send functions) acceptable for production, or should refactoring happen before deployment?
- **Risk:** If refactoring done first, delay to deduplication fix; if done later, risk of inconsistent updates
- **Current Decision:** Accept duplication for Phase 1 (fix first, refactor later)
- **Verification Method:**
  - Phase 1 deployment: Verify all 3 functions updated consistently
  - Code review: Ensure tracking logic identical across all three
  - Integration tests: Validate all 3 send paths tracked correctly
- **Action if Inconsistencies Found:** Prioritize refactoring to single `sendTrackedMessage()` utility in Phase 2

#PLAN_UNCERTAINTY: Cache size growth rate in production (2KB per conversation estimate may not account for high-traffic scenarios)

**Uncertainty 5: Production Cache Growth**
- **Context:** Agent A estimates ~2KB per conversation, ~200KB for 100 active conversations
- **Question:** What is actual cache size in production with 1000+ daily conversations?
- **Risk:** Cache grows faster than estimated, memory usage exceeds 10 MB target
- **Verification Method:**
  - Week 1 monitoring: Log `botMessageTracker.size` and memory usage hourly
  - Calculate: Actual KB per conversation in production
  - Check: TTL cleanup effectiveness (are old conversations evicted correctly?)
- **Action if Growth Excessive:**
  - Reduce TTL (10 min → 5 min for fingerprints)
  - Implement hard limit (1000 conversations max, FIFO eviction)
  - Consider Redis for multi-server or high-scale deployments

---

## Conclusion

This unified blueprint synthesizes Agent A's webhook echo detection and Agent B's send-side tracking into a cohesive, production-ready deduplication system. The architecture leverages a **shared cache** (`botMessageTracker`) with **dual-layer protection**: proactive tracking when messages are sent (Agent B) and reactive echo detection when webhooks arrive (Agent A).

**Key Innovations:**
- **Single Source of Truth:** Send-side and webhook-side share same cache (no synchronization complexity)
- **Dual Detection:** Message ID matching (fast, precise) + content fingerprinting (robust, catches edge cases)
- **Timing Buffer:** 98ms window between tracking and webhook arrival prevents race conditions
- **Graceful Degradation:** Tracking failures non-blocking, fingerprint deduplication as safety net
- **Fail-Safe Integration:** Tracking encapsulated inside send functions (impossible to forget)

**Risk Profile: MEDIUM with Strong Mitigation**
- **High-Severity Risks:** n8n blocking (LOW likelihood), false positives (VERY LOW likelihood)
- **Technical Risks:** Race condition, memory leak, tracking failures (all LOW-MEDIUM likelihood with fallbacks)
- **Deployment Risks:** Code duplication, import errors (LOW likelihood, caught by testing)

**Path Coherence: FULLY VALIDATED**
- ✓ Message ID format compatible (Chatwoot's numeric ID as string)
- ✓ Shared cache coordination works (send writes, webhook reads)
- ✓ Timing buffer sufficient (98ms exceeds typical webhook latency)
- ✓ No conflicting assumptions between agents

**Implementation Priority:**
1. **Phase 1 (Foundation):** Create shared utility - BLOCKING for all else
2. **Phase 2 (Send-Side):** Update 3 send functions - CRITICAL priority on initial greeting
3. **Phase 3 (Webhook-Side):** Add echo detection, update fingerprinting - SEQUENTIAL within phase
4. **Phase 4 (Testing):** Unit → Integration → Manual - MUST pass before deployment
5. **Phase 5 (Monitoring):** Week 1 intensive, then reduced - Ongoing observability

**Success Criteria:**
- Zero user-reported duplicates
- 100% n8n AI response delivery
- < 0.5% false positive rate
- < 10 MB memory footprint
- 98ms+ race condition buffer maintained

**Deployment Readiness:** PROCEED with comprehensive monitoring and phased rollout. All planning uncertainties identified with verification methods. Rollback plans in place for critical, medium, and low-severity issues.

**Next Phase:** Implementation agent executes Phase 1-5 with this blueprint as unified specification.
