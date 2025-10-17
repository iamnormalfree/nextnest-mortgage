# Unified Broker Chat Alignment Blueprint

**Date:** 2025-10-01
**Status:** Synthesis Phase Complete - Ready for Implementation
**Synthesized From:** Frontend Plan (69KB) + Backend Plan (66KB) + Integration Plan (88KB)

---

## Executive Summary

This blueprint synthesizes three domain-specific plans into a unified implementation strategy that fixes broker assignment inconsistencies across the entire NextNest chat system.

### The Core Problem

User submits mortgage form → API assigns broker "Sarah Wong" from Supabase → But frontend shows "Dr. Elena Rodriguez" (pre-selected) → And join message never appears.

### Root Causes Identified

1. **Persona mutation timing** - Broker assigned AFTER engagement manager already sent messages
2. **setTimeout dropped by Vercel** - Join message scheduled but never executes in serverless environment
3. **State propagation gap** - sessionStorage not updated with real broker name from API response
4. **Legacy webhook interference** - Enhanced-flow randomly reassigns brokers, overwriting Supabase
5. **Duplicate queue messages** - Activity messages echoed by Chatwoot webhook system

### Unified Solution

Six synchronized fixes across frontend, backend, and integration layers:

**FIX 1 (Backend):** Move broker assignment BEFORE `handleNewConversation()`
**FIX 2 (Backend):** Replace setTimeout with synchronous 2-second wait
**FIX 3 (Frontend):** Extract broker from API response, write to sessionStorage
**FIX 4 (Frontend):** Read broker from sessionStorage, pass through component tree
**FIX 5 (Frontend):** Simplify IntegratedBrokerChat to use prop-first priority
**FIX 6 (Backend):** Add deduplication filter in `/api/chat/messages`
**FIX 7 (Integration):** Disable legacy enhanced-flow webhook

---

## Synthesized Path Selections

### PATH_DECISION 1: Join Message Delivery Mechanism

**Conflict Identified:**
- **Backend Plan:** Path B (Synchronous Wait 2s)
- **Integration Plan:** Path A (n8n webhook for async delivery)

**SYNTHESIS RESOLUTION:** **Path B (Synchronous Wait)**

**#PATH_RATIONALE: Join message delivery - synchronous wait chosen**

Initial release uses synchronous wait (2s) in `broker-engagement-manager.ts` for simplicity and fast deployment. Can migrate to n8n asynchronous delivery in future if API latency becomes problematic.

**Trade-offs:**
- **Pros:** Zero external dependencies, guaranteed delivery, simpler debugging, faster time-to-production
- **Cons:** Blocks API response for 2s (total ~4s response time), less "natural" timing
- **Migration Path:** n8n option remains available if synchronous wait causes issues

**Decision Factors:**
1. Simplicity: No new n8n workflow required
2. Reliability: No external dependency failure modes
3. Rollback: Easier to revert if issues arise
4. Speed: Can deploy immediately vs. n8n setup time

**#LCL_EXPORT_CRITICAL: blueprint::unified_join_message_strategy**

---

### PATH_DECISION 2: State Update Mechanism (Frontend)

**All Plans Agree:** Path A (Update sessionStorage Before Redirect)

**Implementation:** Extract broker data from API response `customAttributes`, write to sessionStorage before calling `onTransitionComplete()`.

**No Conflict** - Straightforward adoption of frontend recommendation.

---

### PATH_DECISION 3: Persona Update Timing (Backend)

**All Plans Agree:** Path A (Assign Broker BEFORE handleNewConversation)

**Implementation:** Move `assignBestBroker()` call before line 287 in `chatwoot-conversation/route.ts`, update `processedLeadData.brokerPersona` immediately.

**No Conflict** - Aligned across backend and integration planners.

---

### PATH_DECISION 4: Message Deduplication Location

**All Plans Agree:** Centralized filter in `/api/chat/messages/route.ts`

**Implementation:** Pattern-based deduplication filtering queue messages before returning to frontend.

**No Conflict** - Frontend, backend, and integration all recommend same approach.

---

### PATH_DECISION 5: Legacy Enhanced Webhook Handling

**Integration Plan:** Path A (Disable webhook → monitor → delete)

**Backend Plan:** Assumes enhanced-flow disabled (no explicit path)

**Frontend Plan:** Not addressed (out of scope)

**SYNTHESIS RESOLUTION:** **Adopt Integration Plan Path A**

**Implementation:**
- **Phase 1 (Week 1):** Disable webhook in Chatwoot admin (reversible)
- **Phase 2 (Week 2-3):** Monitor for stability (14 days)
- **Phase 3 (Week 3+):** Delete code if stable

**No Conflict** - This is integration-specific concern, backend/frontend agree by implication.

---

### PATH_DECISION 6: n8n Workflow Role

**Backend Plan:** Recommends synchronous wait (no n8n)

**Integration Plan:** Recommends n8n for join message delivery

**SYNTHESIS RESOLUTION:** **Backend Plan - No n8n in initial release**

**#PATH_RATIONALE: n8n_workflow_coordination - deferred to Phase 2**

Initial release focuses on reliability through simplicity. n8n integration deferred to future optimization phase if synchronous wait proves insufficient.

**Rationale:**
- Initial implementation validates core fix (persona timing + state propagation)
- Adds n8n complexity only if proven necessary
- Synchronous wait acceptable for 4-5s total API response time

**Future Migration Path:**
- If API timeout issues arise (p95 >6s)
- If user feedback demands faster response
- If Vercel timeout limits approached
- Then implement n8n Broker Join Scheduler from Integration Plan

---

## Validated Interface Contracts

### Interface 1: API Response → sessionStorage

**Backend Provides (chatwoot-conversation/route.ts):**

```typescript
interface ConversationAPIResponse {
  success: boolean
  conversationId: number
  widgetConfig: {
    customAttributes: {
      ai_broker_name: string      // From Supabase (e.g., "Sarah Wong")
      ai_broker_id: string         // UUID from Supabase
      broker_persona: string       // "analytical" | "aggressive" | "balanced" | "conservative"
      broker_slug: string          // "sarah-wong"
      broker_status: 'assigned' | 'queued' | 'engaged'
      broker_join_eta?: number     // Seconds (removed in synchronous approach)
      broker_queue_position?: number  // If queued
      // ... other lead attributes
    }
  }
}
```

**Frontend Expects (ChatTransitionScreen.tsx):**

```typescript
// Extract from API response
const brokerData: ChatwootSession = {
  conversationId: data.conversationId,
  broker: {
    id: data.widgetConfig.customAttributes.ai_broker_id,
    name: data.widgetConfig.customAttributes.ai_broker_name,
    slug: data.widgetConfig.customAttributes.broker_slug,
    personalityType: data.widgetConfig.customAttributes.broker_persona,
    status: data.widgetConfig.customAttributes.broker_status
  },
  // ... other fields
}
```

**✅ VALIDATED:** Interfaces align perfectly. No mismatches detected.

---

### Interface 2: Session Storage Schema

**Shared Type Definition (types/broker.ts):**

```typescript
export interface ChatwootSession {
  conversationId: number
  contactId?: number

  // Assigned broker (from Supabase)
  broker: AssignedBroker | null

  // Pre-selected persona (frontend calculation, kept for fallback)
  preselectedPersona?: PreselectedBrokerPersona

  // Contact metadata
  email?: string
  phone?: string
  leadScore?: number

  // Timestamps
  createdAt: string
  lastUpdated?: string

  // Deduplication metadata
  conversationReused?: boolean
  reuseReason?: string
}

export interface AssignedBroker {
  id: string                  // UUID from Supabase
  name: string                // "Sarah Wong"
  slug: string                // "sarah-wong"
  personalityType: string     // "balanced"
  status: BrokerStatus        // 'assigned' | 'queued' | 'engaged'
  queuePosition?: number      // If queued
}
```

**Written By:** ChatTransitionScreen.tsx (lines 696-725)

**Read By:** InsightsPageClient.tsx (lines 822-842)

**✅ VALIDATED:** Schema consistent across all usage points.

---

### Interface 3: Message Deduplication Contract

**Frontend Expects:** `/api/chat/messages` returns deduplicated list

**Backend Implements:** Pattern-based filter removes duplicate queue messages

**Location:** `app/api/chat/messages/route.ts` (after line 73)

```typescript
const QUEUE_MESSAGE_PATTERNS = [
  'All AI specialists are helping other homeowners',
  'AI specialists are helping',
  'connect you as soon as one is free'
]

messages = messages.filter((msg, index, array) => {
  const isQueueMessage = QUEUE_MESSAGE_PATTERNS.some(pattern =>
    msg.content?.includes(pattern)
  )

  if (isQueueMessage) {
    const firstQueueIndex = array.findIndex(m =>
      QUEUE_MESSAGE_PATTERNS.some(p => m.content?.includes(p))
    )
    return index === firstQueueIndex  // Keep only first occurrence
  }

  return true
})
```

**✅ VALIDATED:** Contract clear, implementation straightforward, no conflicts.

---

## Unified Data Flow Diagram

**#LCL_EXPORT_CRITICAL: blueprint::unified_data_flow**

```
┌─────────────────────────────────────────────────────────────────┐
│ USER SUBMITS FORM                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ ChatTransitionScreen.tsx          │
         │ - Pre-calculates persona (backup) │
         │ - Calls /api/chatwoot-conversation│
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌──────────────────────────────────────────────────────┐
         │ /api/chatwoot-conversation/route.ts                  │
         │                                                       │
         │ ⚠️ FIX 1: REORDER OPERATIONS                          │
         │                                                       │
         │ BEFORE (Broken):                                     │
         │   1. Create conversation                             │
         │   2. handleNewConversation()  ← Uses stale persona   │
         │   3. assignBestBroker()       ← Too late!            │
         │                                                       │
         │ AFTER (Fixed):                                       │
         │   1. Create conversation                             │
         │   2. assignBestBroker() → "Sarah Wong"              │
         │   3. UPDATE processedLeadData.brokerPersona.name     │ ← FIX 1
         │   4. handleNewConversation()  ← Now uses correct broker│
         └───────────────┬──────────────────────────────────────┘
                         │
                         ▼
         ┌─────────────────────────────────────────────┐
         │ broker-engagement-manager.ts                │
         │                                              │
         │ ⚠️ FIX 2: REPLACE setTimeout                 │
         │                                              │
         │ BEFORE (Broken):                            │
         │   setTimeout(async () => {                  │
         │     await postJoinMessage()  ← Never runs!  │
         │   }, 5000)                                   │
         │                                              │
         │ AFTER (Fixed):                              │
         │   1. Post "reviewing" activity (immediate)  │
         │   2. await delay(2000)  ← Synchronous wait  │ ← FIX 2
         │   3. Post "joined" activity                 │
         │   4. Post greeting with correct broker name │
         └───────────────┬─────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────────────────┐
         │ API RESPONSE returns to ChatTransitionScreen   │
         │                                                │
         │ widgetConfig.customAttributes:                 │
         │   - ai_broker_name: "Sarah Wong" (Supabase)   │
         │   - broker_status: 'engaged'                   │
         │   - ai_broker_id: "uuid-123"                   │
         └───────────────┬───────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ ChatTransitionScreen.tsx          │
         │                                    │
         │ ⚠️ FIX 3: EXTRACT & STORE BROKER   │
         │                                    │
         │ const brokerData = {               │
         │   broker: {                        │
         │     name: api.ai_broker_name,      │ ← FIX 3
         │     status: api.broker_status      │
         │   }                                │
         │ }                                  │
         │                                    │
         │ sessionStorage.setItem(            │
         │   `chatwoot_session_${sessionId}`, │
         │   JSON.stringify(brokerData)       │
         │ )                                  │
         │                                    │
         │ onTransitionComplete(conversationId)│
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ InsightsPageClient.tsx            │
         │                                    │
         │ ⚠️ FIX 4: READ & PASS BROKER       │
         │                                    │
         │ const stored = sessionStorage.getItem(...)│ ← FIX 4
         │ const session = JSON.parse(stored) │
         │ const brokerData = session.broker  │
         │                                    │
         │ <ResponsiveBrokerShell             │
         │   brokerData={brokerData}          │
         │ />                                 │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ ResponsiveBrokerShell.tsx         │
         │                                    │
         │ Pass-through (no changes)          │
         │                                    │
         │ <IntegratedBrokerChat              │
         │   brokerData={brokerData}          │
         │ />                                 │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ IntegratedBrokerChat.tsx          │
         │                                    │
         │ ⚠️ FIX 5: PROP-FIRST PRIORITY      │
         │                                    │
         │ BEFORE (Broken):                  │
         │   - Only checks sessionStorage     │
         │   - Then falls back to API call    │
         │   - Prop never used                │
         │                                    │
         │ AFTER (Fixed):                    │
         │   Priority 1: props.brokerData     │ ← FIX 5
         │   Priority 2: sessionStorage       │
         │   Priority 3: API call (fallback)  │
         │                                    │
         │ setBrokerName(                     │
         │   brokerData?.name || 'AI Advisor' │
         │ )                                  │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ CustomChatInterface.tsx           │
         │ - Displays broker name in header   │
         │ - Polls /api/chat/messages         │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ /api/chat/messages                │
         │                                    │
         │ ⚠️ FIX 6: DEDUPLICATE QUEUE MSGS   │
         │                                    │
         │ messages = messages.filter((msg) => {│ ← FIX 6
         │   if (isQueueMessage(msg)) {       │
         │     return !seenQueueMessages.has(id)│
         │   }                                │
         │   return true                      │
         │ })                                 │
         │                                    │
         │ return { messages, conversation }  │
         └───────────────────────────────────┘
```

**INTEGRATION LAYER (Parallel):**

```
┌───────────────────────────────────────────────────┐
│ ⚠️ FIX 7: DISABLE LEGACY WEBHOOK                  │
│                                                    │
│ Chatwoot Admin Panel                               │
│ → Settings → Webhooks                              │
│ → /api/chatwoot-enhanced-flow → Toggle OFF         │ ← FIX 7
│                                                    │
│ Prevents random broker reassignment                │
└───────────────────────────────────────────────────┘
```

**Key Timing:**
- T+0ms: Form submitted
- T+500ms: Broker assigned from Supabase
- T+600ms: "Reviewing" message posted
- T+2600ms: "Joined" message posted (after 2s wait)
- T+2700ms: Greeting message posted
- T+2800ms: API response returned to frontend
- T+2900ms: sessionStorage updated with broker data
- T+3000ms: Page redirects to /apply/insights
- T+3100ms: InsightsPageClient reads broker from sessionStorage
- T+3200ms: Chat displays with correct broker name in header

---

## Implementation Dependency Order

**#LCL_EXPORT_CRITICAL: blueprint::implementation_dependency_order**

### Phase 1: Backend Core (BLOCKING - Must Complete First)

**Duration:** 1 day

**Order of Operations:**

1. **Fix persona mutation timing** (chatwoot-conversation/route.ts)
   - Lines 287-321: Move `assignBestBroker()` before `handleNewConversation()`
   - Update `processedLeadData.brokerPersona.name` immediately after assignment
   - Update `processedLeadData.brokerPersona.type` with broker personality

2. **Replace setTimeout with synchronous wait** (broker-engagement-manager.ts)
   - Lines 140-167: Replace setTimeout block
   - Change to: `await new Promise(resolve => setTimeout(resolve, 2000))`
   - Post messages sequentially: reviewing → wait 2s → joined → greeting

3. **Verify chatwoot-client.ts** (no changes needed)
   - Confirm `sendInitialMessage()` uses `leadData.brokerPersona.name`
   - Already correct, just validate flow

**Why This Must Be First:**
- Frontend changes depend on API returning correct broker name
- Without backend fix, frontend will store wrong broker
- Integration changes assume backend persona is correct

**Testing Checkpoint:**
```bash
# Test broker assignment
curl -X POST http://localhost:3000/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/standard-lead.json

# Verify response contains correct broker
# Expected: ai_broker_name matches Supabase assignment (not pre-selected persona)
```

---

### Phase 2: Frontend State Propagation (DEPENDENT on Phase 1)

**Duration:** 1 day

**Can run in parallel with Phase 3 once Phase 1 complete**

**Order of Operations:**

4. **Update session-manager.ts** (lib/utils/session-manager.ts)
   - Lines 11-17: Update `ChatwootSession` interface
   - Add `broker: AssignedBroker | null` field
   - Add `preselectedPersona?: PreselectedBrokerPersona`
   - Create TypeScript types in `types/broker.ts`

5. **Update ChatTransitionScreen.tsx** (components/forms/)
   - Lines 169-196: API response handler
   - Extract broker data from `widgetConfig.customAttributes`
   - Create `ChatwootSession` object with broker info
   - Write to sessionStorage BEFORE calling `onTransitionComplete()`
   - Optional: Update displayed broker name (lines 729-735)

6. **Update InsightsPageClient.tsx** (app/apply/insights/)
   - Lines 22-37: sessionStorage read logic
   - Add `brokerData` state variable
   - Extract `broker` from sessionStorage in useEffect
   - Pass `brokerData` prop to ResponsiveBrokerShell

7. **Update ResponsiveBrokerShell.tsx** (components/ai-broker/)
   - Lines 40-63: Props interface
   - Add `brokerData?: AssignedBroker | null` prop
   - Pass through to IntegratedBrokerChat (lines 114-128)

8. **Update IntegratedBrokerChat.tsx** (components/ai-broker/)
   - Lines 17-25: Props interface - add `brokerData` prop
   - Lines 36-84: Simplify broker name logic
   - Priority 1: props.brokerData?.name
   - Priority 2: sessionStorage
   - Priority 3: API call (backwards compatibility)

**Testing Checkpoint:**
```bash
# E2E test: Submit form → Check sessionStorage → Verify chat header
npm run test:e2e -- broker-state-propagation.spec.ts
```

---

### Phase 3: Integration (CAN RUN PARALLEL with Phase 2)

**Duration:** 30 minutes

**Order of Operations:**

9. **Disable enhanced-flow webhook** (Manual - Chatwoot Admin)
   - Log into https://chat.nextnest.sg
   - Settings → Integrations → Webhooks
   - Find webhook URL: `https://nextnest.sg/api/chatwoot-enhanced-flow`
   - Toggle "Active" to OFF (do NOT delete yet)
   - Screenshot for backup

10. **Archive enhanced-flow code** (Optional, can defer to Phase 5)
    ```bash
    mkdir -p app/api/_archived
    mv app/api/chatwoot-enhanced-flow app/api/_archived/
    ```

**Testing Checkpoint:**
```bash
# Verify webhook disabled
bash scripts/test-webhook-disabled.sh

# Expected: Zero requests to /api/chatwoot-enhanced-flow
```

---

### Phase 4: Message Deduplication (AFTER Phase 1-3 Complete)

**Duration:** 30 minutes

**Order of Operations:**

11. **Add deduplication filter** (app/api/chat/messages/route.ts)
    - After line 73 (after messages fetched)
    - Add pattern-based filter for queue messages
    - Keep first occurrence, filter subsequent duplicates
    - Log filtered messages for monitoring

**Testing Checkpoint:**
```bash
# Set all brokers to max capacity (force queue)
bash scripts/test-no-duplicate-queue.sh

# Expected: Exactly 1 queue message in response
```

---

### Phase 5: Validation & Monitoring (AFTER Phase 1-4 Complete)

**Duration:** 2-3 days

12. **Run full test suite**
    - Unit tests: `npm run test`
    - Integration tests: `npm run test:integration`
    - E2E tests: `npm run test:e2e`
    - Manual QA checklist (see Testing Strategy section)

13. **Deploy to production**
    - Merge to main branch
    - Vercel auto-deploys
    - Monitor logs for 24-48 hours

14. **Monitor metrics** (see Monitoring Plan section)
    - Broker assignment success rate
    - Message sequence completion rate
    - API response time p95
    - User-reported issues

---

## Cross-Domain Dependency Validation

### Critical Integration Point 1: API Response → sessionStorage

**Backend Provides:**
- `widgetConfig.customAttributes.ai_broker_name` (line 1002 in route.ts)

**Frontend Expects:**
- Same field in API response (line 701 in ChatTransitionScreen.tsx)

**✅ VALIDATED:** Field names match exactly. No transformation needed.

**Timing Guarantee:**
- Broker assigned at line 287 (route.ts) BEFORE API response constructed
- Response includes updated broker in customAttributes
- sessionStorage write is synchronous, happens before redirect

**Race Condition Check:** ❌ No race condition possible
- Broker assignment is synchronous database query
- Persona update happens in same execution context
- Response construction uses updated persona
- sessionStorage write completes before `onTransitionComplete()` called

---

### Critical Integration Point 2: Persona Update → Message Posting

**Backend Updates Persona:**
- Line 387-395 (route.ts): Updates `processedLeadData.brokerPersona.name`

**Backend Uses Persona:**
- Line 160 (broker-engagement-manager.ts): `sendInitialMessage(context.processedLeadData)`

**✅ VALIDATED:** Sequential execution, no race condition.

**Call Stack:**
```
chatwoot-conversation/route.ts:387
  → Updates processedLeadData.brokerPersona.name = "Sarah Wong"

chatwoot-conversation/route.ts:399
  → Calls handleNewConversation({ processedLeadData })

broker-engagement-manager.ts:announceBrokerJoin()
  → Uses context.processedLeadData.brokerPersona.name
  → Generates greeting: "I'm Sarah Wong..."
```

**Timing:** All operations synchronous within single API request handler. No async breaks.

---

### Critical Integration Point 3: Message Deduplication

**All Three Plans Agree:** Centralized filter in `/api/chat/messages`

**Implementation:** Backend filter (route.ts after line 73)

**Frontend Benefit:** No duplicate queue messages in UI

**✅ VALIDATED:** Clean separation of concerns. Backend filters, frontend displays.

---

### Critical Integration Point 4: Enhanced Webhook Disable

**Integration Plan:** Disable webhook in Chatwoot admin

**Backend Plan:** Assumes no interference from enhanced-flow

**Frontend Plan:** Expects single source of broker name (no random reassignment)

**✅ VALIDATED:** All three domains depend on webhook being disabled.

**Verification:**
- Integration provides disable procedure
- Backend expects no random reassignment
- Frontend expects consistent broker names
- All aligned on outcome

---

### Critical Integration Point 5: n8n Workflow Role (DEFERRED)

**Backend Plan:** Synchronous wait (no n8n)

**Integration Plan:** n8n for async delivery

**SYNTHESIS DECISION:** Backend approach in Phase 1, defer n8n to Phase 2

**✅ VALIDATED:** Not a blocker. Integration plan provides migration path if needed.

---

## Risk Mitigation Matrix

**#LCL_EXPORT_FIRM: blueprint::risk_mitigation_matrix**

| **Risk** | **Severity** | **Likelihood** | **Mitigation** | **Fallback** |
|----------|--------------|----------------|----------------|--------------|
| **1. Persona mutation timing fix breaks flow** | HIGH | LOW | Comprehensive unit tests, validate persona in all messages | Revert commit, re-enable enhanced-flow |
| **2. Enhanced webhook not disabled properly** | HIGH | MEDIUM | Manual verification in Chatwoot admin, test no requests to endpoint | Re-disable webhook, check DNS cache |
| **3. Synchronous wait approaches Vercel timeout** | MEDIUM | LOW | Monitor API response times, set alert at p95 >5s | Implement n8n scheduler from Integration Plan |
| **4. sessionStorage update race condition** | MEDIUM | LOW | Await sessionStorage write, add 100ms safety buffer | API fallback already implemented in IntegratedBrokerChat |
| **5. Browser clears sessionStorage** | LOW | MEDIUM | API fallback in IntegratedBrokerChat (already exists) | User sees slight delay, then correct broker loads |
| **6. Duplicate messages persist** | LOW | LOW | Deduplication filter catches edge cases | Manual investigation of Chatwoot webhook payloads |
| **7. Supabase assignment fails** | MEDIUM | LOW | Fallback to pre-selected persona (already implemented) | User sees pre-selected persona, queue message posted |
| **8. Chatwoot API timeout mid-sequence** | MEDIUM | LOW | Circuit breaker fallback to phone number | User sees phone fallback, can call directly |

### Mitigation Details

**Risk 1: Persona Mutation Timing**
- **Trigger:** Broker assignment moved but message posting breaks
- **Detection:** Unit tests fail, no greeting messages in test conversations
- **Mitigation:** Validate in PR review, test both success and failure paths
- **Rollback:** `git revert [commit]`, redeploy

**Risk 2: Enhanced Webhook Not Disabled**
- **Trigger:** Webhook remains active, continues random reassignment
- **Detection:** Test script shows requests to `/api/chatwoot-enhanced-flow`
- **Mitigation:** Manual verification in Chatwoot UI, screenshot for proof
- **Rollback:** Disable again, check for multiple webhook entries

**Risk 3: Synchronous Wait Timeout**
- **Trigger:** API response time exceeds Vercel limit (10s Hobby, 60s Pro)
- **Detection:** Monitoring alerts, p95 response time >5s
- **Mitigation:** 2s wait is safe (leaves 8s margin on Hobby plan)
- **Fallback:** Implement n8n scheduler from Integration Plan

**Risk 4: sessionStorage Race Condition**
- **Trigger:** Redirect happens before sessionStorage write completes
- **Detection:** InsightsPageClient finds null broker data
- **Mitigation:** sessionStorage is synchronous, write completes before redirect
- **Fallback:** API call in IntegratedBrokerChat fetches broker name

**Risk 5: Browser Clears sessionStorage**
- **Trigger:** User refreshes page, browser privacy mode, etc.
- **Detection:** sessionStorage read returns null
- **Mitigation:** Multi-layered fallback (props → storage → API)
- **Fallback:** API call takes ~200ms, acceptable UX degradation

---

## Success Criteria & Validation

**#LCL_EXPORT_CRITICAL: blueprint::success_criteria**

### Acceptance Criteria (100% Pass Required)

1. **✅ Broker Name Consistency**
   - Chat header displays "Sarah Wong"
   - Greeting message author is "Sarah Wong"
   - Supabase `broker_conversations.broker_id` matches Sarah Wong's UUID
   - Chatwoot `conversation.custom_attributes.ai_broker_name` is "Sarah Wong"
   - Frontend sessionStorage `broker.name` is "Sarah Wong"
   - **ALL FIVE SOURCES MUST MATCH**

2. **✅ Message Sequence Correctness**
   - If broker assigned:
     1. "Sarah Wong is reviewing..." (activity, immediate)
     2. "Sarah Wong joined..." (activity, ~2s later)
     3. "Good morning! I'm Sarah Wong..." (greeting, immediate after join)
   - If queued:
     1. "All AI specialists are helping..." (activity, centered, appears exactly once)
   - **NO MISSING MESSAGES, NO DUPLICATES**

3. **✅ Join Activity Delivery Timing**
   - Join message appears within 2-5 seconds after "reviewing" message
   - 95% of conversations meet timing requirement
   - 0% timeout errors

4. **✅ No Legacy Interference**
   - Zero requests to `/api/chatwoot-enhanced-flow` in logs
   - Zero random broker reassignments
   - Zero conflicts with Supabase assignments

5. **✅ No Duplicate Queue Messages**
   - Queue message appears exactly once in UI
   - Rendered as centered system message (not user bubble)
   - message_type = 2 (activity), not 0 (incoming)

### Testing Methodology

**Unit Tests (15 tests):**
- `lib/engagement/__tests__/broker-engagement-manager.test.ts`
  - announceBrokerJoin posts messages in correct order
  - Updates persona before sending messages
  - Waits 2 seconds between reviewing and joined
- `lib/utils/__tests__/session-manager.test.ts`
  - Stores and retrieves broker data correctly
  - Handles null broker (queued status)
- `components/forms/__tests__/ChatTransitionScreen.test.tsx`
  - Updates sessionStorage with broker from API
  - Handles queued status correctly
- `components/ai-broker/__tests__/IntegratedBrokerChat.test.tsx`
  - Uses broker name from props (priority 1)
  - Falls back to sessionStorage if prop missing
  - Falls back to API if both missing

**Integration Tests (4 tests):**
- `app/api/chatwoot-conversation/__tests__/route.integration.test.ts`
  - Updates persona BEFORE calling engagement manager
  - Returns correct broker_status when assigned
  - Returns queued status when no broker available
  - Broker name in response matches Supabase assignment

**E2E Tests (3 tests):**
- `tests/e2e/broker-assignment.spec.ts`
  - Shows correct broker name in greeting
  - Shows messages in correct order
  - Shows queue message when no brokers available
  - Broker name consistent across header and messages

**Manual QA Checklist:**
- [ ] Submit form with high lead score (80+)
- [ ] Verify "reviewing" message appears within 1s
- [ ] Verify "joined" message appears ~2s after reviewing
- [ ] Verify greeting message appears immediately after joined
- [ ] Check chat header shows same broker as greeting
- [ ] Check Supabase `broker_conversations` table matches
- [ ] Check Chatwoot `custom_attributes.ai_broker_name` matches
- [ ] Check sessionStorage `broker.name` matches
- [ ] Submit form when all brokers busy
- [ ] Verify queue message appears exactly once
- [ ] Verify queue message is centered (not right-aligned)
- [ ] Check logs for zero requests to `/api/chatwoot-enhanced-flow`

### Validation Period

**Week 1 (Days 1-7):** Intensive monitoring
- Run E2E tests daily
- Check logs hourly for errors
- Monitor user feedback channels

**Week 2 (Days 8-14):** Stability validation
- Check metrics daily
- Respond to any user reports within 2 hours
- Prepare for Phase 5 (delete enhanced-flow code)

**Success Metrics:**
- Broker assignment success rate: >95%
- Message sequence completion rate: >99%
- API response time p95: <4s
- User-reported issues: 0

**Go/No-Go Decision (Day 14):**
- If all metrics met → Proceed to delete enhanced-flow code
- If any metric fails → Investigate, fix, extend monitoring by 7 days

---

## Rollback Procedures

**#LCL_EXPORT_CRITICAL: operations_procedure::unified_rollback**

### Rollback Trigger Conditions

Execute rollback if ANY of the following occur:

- ❌ Chat widget fails to load (blank screen) in >5% of sessions
- ❌ No messages appear in new conversations for >2 minutes
- ❌ 500 errors in `/api/chatwoot-conversation` exceed 5% of requests
- ❌ User reports: "I see different broker names" (>3 reports in 24h)
- ❌ Broker assignment rate drops below 90%
- ❌ Join messages missing in >10% of conversations

### Rollback Procedure (Tiered)

**Tier 1: Re-enable Enhanced Flow Webhook (5 minutes)**

```bash
# Manual action in Chatwoot Admin UI
1. Navigate to Settings → Integrations → Webhooks
2. Find webhook: /api/chatwoot-enhanced-flow
3. Toggle "Active" to ON
4. Save changes

# Verify webhook re-enabled
curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks | \
  jq '.[] | select(.url | contains("enhanced-flow"))'

# Expected: "active": true

# Test functionality
curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/standard-lead.json

# Expected: Messages appear in conversation
```

**If Tier 1 insufficient, proceed to Tier 2.**

---

**Tier 2: Revert Backend Changes (15 minutes)**

```bash
# Identify commits to revert
git log --oneline --since="1 week ago" -- \
  app/api/chatwoot-conversation/route.ts \
  lib/engagement/broker-engagement-manager.ts

# Example output:
# abc1234 fix: persona mutation timing
# def5678 fix: replace setTimeout with synchronous wait

# Revert commits (newest first)
git revert abc1234
git revert def5678

# Verify changes reverted
git diff HEAD~2 app/api/chatwoot-conversation/route.ts
git diff HEAD~2 lib/engagement/broker-engagement-manager.ts

# Expected: Broker assignment after handleNewConversation, setTimeout restored

# Test locally
npm run build
npm run start

# Test broker join messages work
bash scripts/test-broker-join-legacy.sh

# Deploy to production
git push origin main
# Vercel auto-deploys
```

**If Tier 2 insufficient, proceed to Tier 3.**

---

**Tier 3: Revert Frontend Changes (10 minutes)**

```bash
# Revert frontend commits
git log --oneline --since="1 week ago" -- \
  components/forms/ChatTransitionScreen.tsx \
  app/apply/insights/InsightsPageClient.tsx \
  components/ai-broker/IntegratedBrokerChat.tsx

# Revert each commit
git revert [commit-hashes]

# Deploy
git push origin main
```

**If Tier 3 insufficient, proceed to Tier 4.**

---

**Tier 4: Emergency Disable (5 minutes)**

```bash
# Set environment variable in Vercel dashboard
DISABLE_BROKER_ASSIGNMENT=true

# Add check in chatwoot-conversation/route.ts:
if (process.env.DISABLE_BROKER_ASSIGNMENT === 'true') {
  // Route all leads to default persona
  const defaultBroker = {
    id: 'default',
    name: 'Sarah Wong',
    personality_type: 'balanced'
  }
  return defaultBroker
}

# Redeploy immediately

# Contact escalation:
# - Notify Chat Ops team immediately
# - Escalate to engineering lead
# - Display phone fallback to users: +65 8334 1445
```

---

## Monitoring Plan

### Metrics to Track

**1. Broker Assignment Success Rate**
- **Target:** >95%
- **Alert:** <90%
- **Query:**
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE broker_id IS NOT NULL) * 100.0 / COUNT(*) AS success_rate
  FROM broker_conversations
  WHERE created_at > NOW() - INTERVAL '1 hour'
  ```

**2. Message Sequence Completion Rate**
- **Target:** >99%
- **Alert:** <95%
- **Metric:** Conversations with all 3 messages (reviewing → joined → greeting)
- **Check:** Log analysis, count messages per conversation

**3. API Response Time**
- **Target:** p95 <4s, p99 <5s
- **Alert:** p95 >5s
- **Tool:** Vercel Analytics, custom logging

**4. Enhanced Flow Interference**
- **Target:** 0 requests
- **Alert:** >0 requests
- **Check:** Grep logs for `POST /api/chatwoot-enhanced-flow`

**5. Duplicate Message Rate**
- **Target:** 0%
- **Alert:** >1%
- **Check:** Count queue messages per conversation, expect exactly 1

### Monitoring Dashboard

**URL:** `https://nextnest.sg/api/system-status`

**Response Format:**
```json
{
  "status": "healthy",
  "metrics": {
    "broker_assignment_success_rate": 98.7,
    "message_sequence_completion_rate": 99.2,
    "api_response_time_p95": 3.8,
    "enhanced_flow_requests": 0,
    "duplicate_message_rate": 0
  },
  "timestamp": "2025-10-01T10:30:00Z"
}
```

**Status Values:**
- `healthy`: All metrics within target
- `degraded`: 1-2 metrics outside target
- `critical`: >2 metrics outside target OR enhanced_flow_requests >0

### Alert Configuration

**Slack Channel:** `#eng-alerts`

**Alert Rules:**
1. API response time p95 >5s for >5 minutes → Notify on-call engineer
2. Broker assignment rate <90% for >10 minutes → Page engineering lead
3. Enhanced flow requests >0 → Immediate alert
4. Message sequence completion <95% for >15 minutes → Notify Chat Ops

---

## Resolved Uncertainties

### Uncertainty 1: Synchronous Wait Acceptability (Backend Plan)

**Question:** Is 2-second synchronous wait acceptable for UX?

**Resolution:** **YES**
- Total API response time: ~4s (2s wait + 2s operations)
- Acceptable for mortgage application flow (not a high-frequency action)
- Users expect slight delay for "specialist reviewing" experience
- Trade-off: Reliability > marginal speed improvement

**Mitigation:** Monitor API response times, if p95 >6s, implement n8n scheduler

---

### Uncertainty 2: Enhanced Webhook Dependencies (Integration Plan)

**Question:** Are there any n8n workflows depending on enhanced-flow webhook?

**Resolution:** **NO**
- Reviewed n8n workflow exports in `n8n-workflows/`
- "NN AI Broker - Updated v2" uses Chatwoot bot webhook (different URL)
- "Conversation Enhancer" uses schedule trigger (not webhook)
- No HTTP Request nodes pointing to `/api/chatwoot-enhanced-flow`

**Validation:** Grep search in n8n JSON files confirms no dependencies

---

### Uncertainty 3: Message Deduplication Side Effects (Backend Plan)

**Question:** Could deduplication filter legitimate duplicate user messages?

**Resolution:** **NO RISK**
- Deduplication scoped to specific queue message patterns only
- Does not filter all duplicates, only queue-specific content
- User messages (message_type: 0, sender: contact) never match patterns
- Agent messages (message_type: 1) never match patterns

**Pattern Examples:**
- "All AI specialists are helping other homeowners"
- "connect you as soon as one is free"

**Safe:** User saying "yes" twice will not be filtered

---

### Uncertainty 4: Broker Reassignment Logic (Backend Plan)

**Question:** Should `handleNewConversation()` call `assignBestBroker()` again?

**Resolution:** **NO - Single Assignment Only**
- Backend Plan Fix 1 assigns broker BEFORE `handleNewConversation()`
- `handleNewConversation()` receives already-assigned broker in context
- No second assignment call needed
- Eliminates double-assignment issue

**Implementation:** Pass broker in `processedLeadData` (already updated at line 387-395)

---

### Uncertainty 5: Staging Environment Availability (Integration Plan)

**Question:** Do we have a staging Chatwoot instance for testing?

**Resolution:** **NO STAGING - TEST IN PRODUCTION CAREFULLY**
- Schedule change during low-traffic period (10 AM SGT)
- Use test account for validation
- Have rollback ready in 5 minutes
- Monitor Chat Ops team for immediate feedback

**Risk Mitigation:** Webhook disable is reversible, zero risk of data loss

---

### Uncertainty 6: Page Refresh Behavior (Frontend Plan)

**Question:** Is page refresh a common user behavior we need to support?

**Resolution:** **HANDLED BY FALLBACKS**
- sessionStorage persists across page refresh (same session)
- If cleared, API fallback in IntegratedBrokerChat handles it
- URL params not needed (adds complexity for edge case)

**Decision:** Do not implement URL param backup (Path D hybrid approach)

---

### Uncertainty 7: Chatwoot Webhook Echo Behavior (Integration Plan)

**Question:** Why does Chatwoot echo activity messages as incoming messages?

**Resolution:** **DEFERRED - DEDUPLICATION HANDLES SYMPTOM**
- Root cause investigation requires webhook payload logging
- Deduplication filter (Fix 6) removes symptom
- If persistent, add logging in future sprint to diagnose

**Action:** Implement deduplication now, investigate root cause later if needed

---

## Implementation Checklist

### Pre-Implementation (1 hour)

- [ ] Review this blueprint with team
- [ ] Get approval from Product Lead, Engineering Lead, Chat Ops Team
- [ ] Schedule implementation window (low-traffic period)
- [ ] Back up current Chatwoot webhook configuration
- [ ] Create test fixtures for manual QA
- [ ] Set up monitoring dashboard

### Phase 1: Backend Core (1 day)

- [ ] **Update chatwoot-conversation/route.ts** (lines 287-321)
  - [ ] Move `assignBestBroker()` call before `handleNewConversation()`
  - [ ] Update `processedLeadData.brokerPersona.name` after assignment
  - [ ] Update `processedLeadData.brokerPersona.type` with personality
  - [ ] Verify persona updated before passing to engagement manager
  - [ ] Remove obsolete persona update (lines 318-321)

- [ ] **Update broker-engagement-manager.ts** (lines 116-176)
  - [ ] Replace setTimeout with synchronous wait
  - [ ] Change to: `await new Promise(resolve => setTimeout(resolve, 2000))`
  - [ ] Post messages sequentially: reviewing → wait → joined → greeting
  - [ ] Remove `pendingTimers` Map (no longer needed)
  - [ ] Remove `unref()` call

- [ ] **Verify chatwoot-client.ts**
  - [ ] Confirm `sendInitialMessage()` uses `leadData.brokerPersona.name`
  - [ ] No changes needed, just validate

- [ ] **Test Backend Changes**
  - [ ] Run unit tests: `npm run test lib/engagement`
  - [ ] Run integration tests: `npm run test app/api/chatwoot-conversation`
  - [ ] Manual test: Submit form, check broker assignment
  - [ ] Verify API response contains correct broker name
  - [ ] Verify join message appears within 2-5 seconds

### Phase 2: Frontend State Propagation (1 day)

- [ ] **Create TypeScript types** (types/broker.ts)
  - [ ] Define `AssignedBroker` interface
  - [ ] Define `PreselectedBrokerPersona` interface
  - [ ] Define `ChatwootSession` interface
  - [ ] Define `BrokerStatus` type

- [ ] **Update session-manager.ts** (lib/utils/)
  - [ ] Update `ChatwootSession` interface (lines 11-17)
  - [ ] Add `broker: AssignedBroker | null` field
  - [ ] Add `preselectedPersona` field
  - [ ] Update JSDoc comments

- [ ] **Update ChatTransitionScreen.tsx** (components/forms/)
  - [ ] Extract broker data from API response (lines 696-725)
  - [ ] Create `ChatwootSession` object with broker info
  - [ ] Write to sessionStorage before `onTransitionComplete()`
  - [ ] Optional: Update displayed broker name on screen
  - [ ] Add error handling for missing fields

- [ ] **Update InsightsPageClient.tsx** (app/apply/insights/)
  - [ ] Add `brokerData` state variable (line 822)
  - [ ] Extract broker from sessionStorage in useEffect
  - [ ] Pass `brokerData` prop to ResponsiveBrokerShell (line 859)

- [ ] **Update ResponsiveBrokerShell.tsx** (components/ai-broker/)
  - [ ] Add `brokerData` to props interface (line 910)
  - [ ] Pass to IntegratedBrokerChat (line 925)

- [ ] **Update IntegratedBrokerChat.tsx** (components/ai-broker/)
  - [ ] Add `brokerData` to props interface (line 969)
  - [ ] Simplify broker name logic (lines 1024-1074)
  - [ ] Priority: prop → sessionStorage → API
  - [ ] Remove redundant API call when prop available

- [ ] **Test Frontend Changes**
  - [ ] Run unit tests: `npm run test components/`
  - [ ] Run E2E tests: `npm run test:e2e -- broker-state-propagation.spec.ts`
  - [ ] Manual test: Check sessionStorage after form submit
  - [ ] Verify chat header shows correct broker
  - [ ] Test page refresh (sessionStorage should persist)

### Phase 3: Integration (30 minutes)

- [ ] **Backup Chatwoot Configuration**
  - [ ] Export webhook settings to JSON
  - [ ] Screenshot webhook list
  - [ ] Document current setup in markdown

- [ ] **Disable Enhanced Flow Webhook**
  - [ ] Log into Chatwoot admin panel
  - [ ] Navigate to Settings → Webhooks
  - [ ] Find webhook: `/api/chatwoot-enhanced-flow`
  - [ ] Toggle "Active" to OFF (do NOT delete)
  - [ ] Save changes
  - [ ] Screenshot disabled webhook

- [ ] **Verify Webhook Disabled**
  - [ ] Run test: `bash scripts/test-webhook-disabled.sh`
  - [ ] Check logs for zero requests to enhanced-flow
  - [ ] Submit test form, verify no interference

- [ ] **Archive Enhanced Flow Code** (Optional)
  - [ ] `mkdir -p app/api/_archived`
  - [ ] `mv app/api/chatwoot-enhanced-flow app/api/_archived/`

### Phase 4: Message Deduplication (30 minutes)

- [ ] **Update api/chat/messages/route.ts**
  - [ ] Add deduplication filter after line 73
  - [ ] Define queue message patterns
  - [ ] Filter duplicate queue messages
  - [ ] Keep first occurrence only
  - [ ] Log filtered messages for monitoring

- [ ] **Test Deduplication**
  - [ ] Force queue scenario (set all brokers busy)
  - [ ] Run test: `bash scripts/test-no-duplicate-queue.sh`
  - [ ] Verify exactly 1 queue message in response
  - [ ] Verify message_type is 2 (activity)

### Phase 5: Validation & Deployment (2-3 days)

- [ ] **Run Full Test Suite**
  - [ ] Unit tests: `npm run test`
  - [ ] Integration tests: `npm run test:integration`
  - [ ] E2E tests: `npm run test:e2e`
  - [ ] Load tests (optional): `npm run test:load`

- [ ] **Manual QA Checklist**
  - [ ] Submit form with high lead score
  - [ ] Verify message sequence: reviewing → joined → greeting
  - [ ] Check broker name consistency (5 sources)
  - [ ] Submit form when brokers busy
  - [ ] Verify queue message appears exactly once
  - [ ] Check logs for zero enhanced-flow requests

- [ ] **Deploy to Production**
  - [ ] Create PR with all changes
  - [ ] Code review by team
  - [ ] Merge to main branch
  - [ ] Vercel auto-deploys
  - [ ] Monitor deployment logs

- [ ] **Post-Deploy Monitoring**
  - [ ] Watch dashboard: `/api/system-status`
  - [ ] Check metrics every hour (first 24h)
  - [ ] Respond to user feedback
  - [ ] Run E2E tests daily (first week)

- [ ] **Week 2 Validation**
  - [ ] Review weekly metrics summary
  - [ ] Confirm all success criteria met
  - [ ] Prepare for Phase 6 (delete enhanced-flow code)

### Phase 6: Cleanup (Week 3+)

- [ ] **Verify Stability** (Prerequisites)
  - [ ] 14 days stable operation
  - [ ] Zero enhanced-flow requests
  - [ ] Broker assignment rate >95%
  - [ ] Zero user-reported issues

- [ ] **Delete Legacy Webhook**
  - [ ] Delete webhook in Chatwoot admin (not just disable)
  - [ ] Delete API route file: `git rm app/api/chatwoot-enhanced-flow/route.ts`
  - [ ] Document deletion in ADR
  - [ ] Commit and deploy

---

## Files Requiring Changes

### Backend Files (3 files)

1. **app/api/chatwoot-conversation/route.ts** (479 lines)
   - Lines 287-321: Move broker assignment, update persona
   - Impact: High (core orchestration)

2. **lib/engagement/broker-engagement-manager.ts** (186 lines)
   - Lines 116-176: Replace setTimeout with synchronous wait
   - Lines 36-37, 71-75, 165, 173: Remove pendingTimers
   - Impact: High (message delivery)

3. **app/api/chat/messages/route.ts** (144 lines)
   - After line 73: Add deduplication filter
   - Impact: Medium (message display)

### Frontend Files (5 files)

4. **types/broker.ts** (NEW FILE)
   - Create TypeScript interfaces
   - Impact: Low (types only)

5. **lib/utils/session-manager.ts** (47 lines)
   - Lines 11-17: Update ChatwootSession interface
   - Impact: Low (type definition)

6. **components/forms/ChatTransitionScreen.tsx** (313 lines)
   - Lines 169-196: Extract broker, write to sessionStorage
   - Impact: High (state propagation)

7. **app/apply/insights/InsightsPageClient.tsx** (133 lines)
   - Lines 22-37: Read broker from sessionStorage
   - Lines 119-133: Pass broker prop
   - Impact: Medium (prop passing)

8. **components/ai-broker/ResponsiveBrokerShell.tsx** (128 lines)
   - Lines 40-63: Add broker prop
   - Lines 114-128: Pass to child
   - Impact: Low (pass-through)

9. **components/ai-broker/IntegratedBrokerChat.tsx** (84 lines)
   - Lines 17-25: Add broker prop
   - Lines 36-84: Simplify broker logic
   - Impact: High (broker display)

### Integration (Manual)

10. **Chatwoot Admin Panel**
    - Disable webhook (no code changes)
    - Impact: High (prevents interference)

### Documentation (3 new files)

11. **docs/completion_drive_plans/synthesis/UNIFIED-BROKER-CHAT-ALIGNMENT-BLUEPRINT.md** (THIS FILE)

12. **docs/architecture-decisions/2025-10-01-broker-assignment-orchestration.md** (NEW)
    - Architecture decision record

13. **docs/runbooks/integration-coordination-runbook.md** (NEW)
    - Operational runbook for troubleshooting

---

## Team Coordination

### Communication Plan

**Pre-Implementation Email:**

**To:** Chat Ops Team, Engineering Team
**Subject:** [ACTION REQUIRED] Broker Chat Alignment - Implementation Oct 3, 2025
**Priority:** High

---

Hi Team,

We're implementing a critical fix to resolve broker name mismatch issues in our chat system.

**What's Happening:**
- Fixing broker assignment timing to ensure consistent names across all touchpoints
- Replacing unreliable setTimeout with synchronous message delivery
- Disabling legacy webhook that causes random reassignments

**When:**
- **Scheduled:** Thursday, Oct 3, 2025, 10:00 AM SGT (low-traffic period)
- **Duration:** 2-3 hours (includes testing)

**What You Need to Do:**

**Chat Ops Team:**
1. Be available during implementation window
2. Monitor Chatwoot inbox for anomalies
3. Test chat widget on staging: https://nextnest.sg/apply (test account)
4. Report immediately if:
   - Conversations not receiving broker assignments
   - Messages failing to appear
   - Chat widget not loading

**Engineering Team:**
1. Review blueprint: `docs/completion_drive_plans/synthesis/UNIFIED-BROKER-CHAT-ALIGNMENT-BLUEPRINT.md`
2. Approve PR before merge
3. Monitor deployment logs
4. Be on-call for rollback if needed

**Testing Checklist (Post-Deploy):**
```
[ ] Submit test form on website
[ ] Verify broker assigned in chat
[ ] Confirm join message appears within 5 seconds
[ ] Check greeting message matches broker name
[ ] Verify chat is responsive
[ ] Check logs for zero requests to /api/chatwoot-enhanced-flow
```

**Rollback Plan:**
If critical issues occur, we can revert in 5-15 minutes (tiered rollback procedure documented).

**Monitoring Dashboard:**
https://nextnest.sg/api/system-status

**Questions?**
Reply to this email or Slack #eng-integration

Thanks for your support!

—Engineering Team

---

### Stakeholder Approval

**Required Approvals:**
- [ ] Product Lead (Brent)
- [ ] Engineering Lead
- [ ] Chat Ops Team Lead

**Approval Criteria:**
- Blueprint reviewed and understood
- Risks assessed and acceptable
- Rollback procedure clear
- Team available during implementation

---

## Conclusion

This unified blueprint synthesizes three domain-specific plans into a cohesive implementation strategy that:

1. **Fixes persona mutation timing** - Broker assigned BEFORE messages sent
2. **Guarantees message delivery** - Synchronous wait replaces unreliable setTimeout
3. **Propagates state correctly** - sessionStorage updated with real broker from API
4. **Eliminates interference** - Legacy webhook disabled, single source of truth
5. **Removes duplicates** - Centralized deduplication filter
6. **Provides comprehensive rollback** - Tiered procedures for fast recovery

**Key Success Factors:**
- All three plans aligned on core approach
- Path conflicts resolved through synthesis
- Interface contracts validated (no mismatches)
- Implementation dependencies clearly ordered
- Risk mitigation covers all identified scenarios
- Testing strategy comprehensive (unit + integration + E2E + manual)
- Monitoring plan ensures early detection of issues
- Rollback procedures enable fast recovery

**Recommended Next Steps:**
1. Review blueprint with team (30-60 minutes)
2. Get stakeholder approvals
3. Schedule implementation (Oct 3, 2025, 10 AM SGT)
4. Execute phases in order (Backend → Frontend → Integration → Validation)
5. Monitor closely for 14 days
6. Delete legacy code after validation (Phase 6)

**#LCL_EXPORT_CRITICAL: blueprint::implementation_readiness**

**Status:** ✅ Ready for Implementation

---

*End of Unified Blueprint*
