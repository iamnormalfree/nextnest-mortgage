# Message Duplication Fix - Continuation Session

**Date:** October 3, 2025
**Status:** ✅ PARTIAL SUCCESS - Reduced from 3 to 2 messages
**Next Task:** Find and fix Message #2 (Sarah Wong default agent message)
**Branch:** `bloomberg-compact-apply-stepper`

---

## Current Status Summary

### ✅ What's Fixed

1. **Message #1 Source (ELIMINATED):** `chatwoot-natural-flow` webhook
   - **File:** `app/api/chatwoot-natural-flow/route.ts`
   - **Fix:** Entire route disabled (returns `{ disabled: true }`)
   - **Status:** CONFIRMED WORKING - No longer sends duplicate greeting

2. **Echo Detection System (IMPLEMENTED):**
   - **Files Created:**
     - `lib/utils/message-tracking.ts` (258 lines)
   - **Files Modified:**
     - `lib/integrations/chatwoot-client.ts` (tracking added)
     - `app/api/chatwoot-webhook/route.ts` (echo detection added)
     - `app/api/chatwoot-ai-webhook/route.ts` (tracking added)
   - **Status:** Working correctly but not addressing the current issue

### ⚠️ What's Still Broken

**Message #2 (ACTIVE):** Unknown source sending "Sarah Wong" default greeting
- **Symptom:** Second message appears with "Sarah Wong" as the agent
- **Characteristic:** Uses DEFAULT broker (not the assigned broker)
- **Location:** Unknown - needs investigation

---

## Investigation Summary So Far

### Message Flow Analysis

**Current Execution Path:**
```
User Submits Form
    ↓
/api/chatwoot-conversation (creates conversation)
    ↓
brokerEngagementManager.handleNewConversation()
    ↓
announceBrokerJoin() → sendInitialMessage()
    ↓
✅ MESSAGE #1 SENT (Correct broker - e.g., Michelle Chen)
    ↓
Chatwoot fires webhook: conversation_created
    ↓
/api/chatwoot-natural-flow receives webhook
    ↓
⏭️ DISABLED (returns { disabled: true })
    ↓
[UNKNOWN SOURCE]
    ↓
❌ MESSAGE #2 SENT (Default broker - Sarah Wong)
```

### Key Clues About Message #2

**User Report:**
> "the last repeated message (which has the default sarah wong agent in the message)"

**This tells us:**
1. Message #2 uses **DEFAULT** broker (not assigned broker)
2. Sarah Wong is likely the default/fallback broker
3. The code path sending it doesn't have access to the assigned broker data

### Possible Sources of Message #2

#### Hypothesis 1: Another Active Webhook
**Likelihood:** HIGH

**Check:**
```bash
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks
```

**Expected findings:**
- Multiple webhooks registered for `conversation_created` event
- One of them might be calling a DIFFERENT endpoint

**Action:** Disable all webhooks except `/api/chatwoot-webhook` (for n8n)

---

#### Hypothesis 2: Archived Webhook Still Active
**Likelihood:** MEDIUM

**Location:** `_archived/api/chatwoot-enhanced-flow/route.ts`

**Theory:**
- File was archived but might still be accessible via URL
- Chatwoot might still have webhook registered pointing to it
- Would explain "default" broker (archived code uses fallback)

**Check:**
```bash
# See if archived route is accessible
curl -X POST http://localhost:3006/api/chatwoot-enhanced-flow \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Action:**
- Verify archived route is NOT accessible
- If accessible, disable it like chatwoot-natural-flow

---

#### Hypothesis 3: Chatwoot Auto-Assignment Feature
**Likelihood:** MEDIUM

**Theory:**
- Chatwoot has built-in "auto-assign to agent" feature
- Might be configured to auto-assign to "Sarah Wong" on new conversations
- This would trigger a "joined conversation" message

**Check:**
1. Log into https://chat.nextnest.sg
2. Settings → Inboxes → Website Inbox
3. Check "Collaborators" or "Auto Assignment" settings
4. Look for "Sarah Wong" as default assignee

**Action:** Disable auto-assignment if enabled

---

#### Hypothesis 4: n8n Workflow Sending Default Greeting
**Likelihood:** HIGH

**Theory:**
- n8n workflow listens for `conversation_created` events
- Sends default greeting with hardcoded "Sarah Wong"
- Doesn't have access to assigned broker from Supabase

**Files to Check:**
- `n8n-workflows/ai-broker-persona-workflow.json`
- `n8n-workflows/NN-AI-Broker-FIXED.json`
- `n8n-workflows/Chatwoot Conversation Enhancer v2.json`

**Look for:**
- Hardcoded "Sarah Wong" text
- Default broker assignment
- `conversation_created` event triggers

**Action:**
- Review n8n workflows
- Disable greeting-sending nodes
- Or update to use assigned broker from custom_attributes

---

#### Hypothesis 5: Frontend Component Sending Message
**Likelihood:** LOW

**Theory:**
- React component might POST to Chatwoot API on mount
- Sends default greeting with fallback broker

**Check:**
```bash
grep -r "Sarah Wong\|sendMessage.*default" components app/apply --include="*.tsx" -n
```

**Action:** Review any suspicious POST calls to Chatwoot

---

## Investigation Plan for Next Session

### Phase 1: Identify Message #2 Source (30 minutes)

**Step 1: Add Stack Trace Logging**

Edit `lib/integrations/chatwoot-client.ts` line 377:
```typescript
console.log('📤 Sending initial message to Chatwoot:', {
  conversationId,
  brokerName: leadData.brokerPersona.name,
  messagePreview: initialMessage.substring(0, 50) + '...',
  stackTrace: new Error().stack?.split('\n').slice(0, 5) // ← ADD THIS
})
```

**Step 2: Submit Fresh Test Form**
- Use NEW email: `debug-message2-source@nextnest.sg`
- Monitor server logs in real-time
- Count how many "Sending initial message" logs appear

**Expected:**
- Should see ONLY ONE log (from broker-engagement-manager)
- If you see TWO → Stack trace will show second caller

**Step 3: Check Chatwoot Message API Directly**

Search ALL code for direct Chatwoot message POSTs:
```bash
grep -r "conversations.*messages.*POST\|message_type.*outgoing" . \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  -n | grep -v node_modules | grep -v .next
```

**Expected findings:**
- `chatwoot-client.ts` - ✅ Known (tracked)
- `chatwoot-webhook/route.ts` - ✅ Known (tracked)
- `chatwoot-ai-webhook/route.ts` - ✅ Known (tracked)
- `chatwoot-natural-flow/route.ts` - ⏭️ Disabled
- **Unknown file** - ❌ THIS IS MESSAGE #2 SOURCE

---

### Phase 2: Verify Webhook Configuration (15 minutes)

**Action:**
```bash
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks \
  | jq '.'
```

**Check for:**
- Multiple webhooks pointing to different endpoints
- Webhooks subscribed to `conversation_created` event
- URLs pointing to archived routes

**Expected result:**
```json
[
  {
    "id": 1,
    "url": "https://your-domain.com/api/chatwoot-webhook",
    "subscriptions": ["message_created"]
  }
]
```

**If multiple webhooks:** Document all URLs and subscription events

---

### Phase 3: Review n8n Workflows (20 minutes)

**Files to Read:**
- `n8n-workflows/NN-AI-Broker-FIXED.json`
- `n8n-workflows/Chatwoot Conversation Enhancer v2.json`

**Search for:**
- `conversation_created` triggers
- Hardcoded "Sarah Wong" strings
- Default broker assignments
- Message sending nodes

**Questions to answer:**
1. Does n8n send greetings on conversation_created?
2. Does it use a default broker or read from custom_attributes?
3. Is the n8n workflow even active?

---

### Phase 4: Check Chatwoot Auto-Assignment (10 minutes)

**Manual Check:**
1. Login: https://chat.nextnest.sg
2. Navigate: Settings → Inboxes → [Your Website Inbox]
3. Check: "Collaborators" tab
4. Look for: Auto-assignment rules
5. Check if "Sarah Wong" is default agent

**Expected:** No auto-assignment (or different default)

---

## Quick Debug Commands for Next Session

```bash
# 1. Check active webhooks
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks

# 2. Search for all Chatwoot message sends
grep -r "sendMessage\|POST.*messages\|message_type.*outgoing" \
  . --include="*.ts" -n | grep -v node_modules | head -20

# 3. Check if archived route is accessible
curl -X POST http://localhost:3006/api/chatwoot-enhanced-flow \
  -H "Content-Type: application/json" \
  -d '{"event": "conversation_created"}'

# 4. Search n8n workflows for Sarah Wong
grep -r "Sarah Wong" n8n-workflows/ -n

# 5. Search for default broker assignments
grep -r "default.*broker\|fallback.*broker" lib app --include="*.ts" -n
```

---

## Files Modified in This Session

### Created:
1. `lib/utils/message-tracking.ts` (258 lines)
2. `docs/sessions/2025-10-03-message-duplication-fix-session.md`
3. `docs/sessions/2025-10-03-message-duplication-fix-continuation.md` (this file)
4. `docs/troubleshooting/message-duplication-debug.md`
5. `FIX_APPLIED.md`

### Modified:
6. `lib/integrations/chatwoot-client.ts` (added tracking)
7. `app/api/chatwoot-webhook/route.ts` (added echo detection)
8. `app/api/chatwoot-ai-webhook/route.ts` (added tracking)
9. `app/api/chatwoot-natural-flow/route.ts` (DISABLED entire route)

### Planning Documents Created:
10. `docs/completion_drive_plans/webhook-echo-detection-plan.md`
11. `docs/completion_drive_plans/message-send-deduplication-plan.md`
12. `docs/completion_drive_plans/synthesis/unified-deduplication-blueprint.md`
13. `docs/completion_drive_plans/verification/deduplication-verification-report.md`
14. `docs/reports/2025-10-03-n8n-vs-backend-analysis.md`

---

## Success Metrics

### Current State:
- ✅ Message count: **2** (reduced from 3)
- ✅ Message #1: broker-engagement-manager (correct broker)
- ❌ Message #2: Unknown source (Sarah Wong default)

### Target State:
- 🎯 Message count: **1**
- 🎯 Only broker-engagement-manager sends greeting
- 🎯 Correct broker (from Supabase assignment)

---

## Next Session Checklist

**Before Starting:**
- [ ] Have Chatwoot admin access ready
- [ ] Have n8n workflow access (if applicable)
- [ ] Terminal ready for curl commands
- [ ] Dev server running with logs visible

**Investigation Steps:**
1. [ ] Add stack trace logging to sendInitialMessage
2. [ ] Submit test form with NEW email
3. [ ] Count "Sending initial message" logs
4. [ ] Run webhook configuration check
5. [ ] Search for all Chatwoot message POSTs
6. [ ] Review n8n workflows (if active)
7. [ ] Check Chatwoot auto-assignment settings

**When Message #2 Source Found:**
- [ ] Disable/fix the source
- [ ] Test with NEW email
- [ ] Verify ONLY 1 message appears
- [ ] Update this document with solution

---

## Key Insights from This Session

1. **Echo detection was correct but addressing wrong problem**
   - Echo detection prevents same message bouncing back
   - Actual problem was multiple independent senders

2. **"Default broker" is the smoking gun**
   - Message #2 uses Sarah Wong (default)
   - Means it doesn't have access to assigned broker
   - Narrows down possible code paths significantly

3. **Architectural fragmentation**
   - Multiple systems trying to "help" by sending greetings
   - Need to centralize in broker-engagement-manager ONLY

4. **Testing requires NEW emails every time**
   - Old conversations already have duplicates in database
   - Fix only prevents NEW duplicates from being created

---

## User Feedback

**Original Report:**
> "the templated messages is still repeated 3x"

**After Fix #1:**
> "now there's only 2 messages"

**Remaining Issue:**
> "the last repeated message (which has the default sarah wong agent in the message)"

---

## Recommended Approach for Next Session

**Use `/response-awareness` framework:**

```
/response-awareness Find and fix Message #2 source (Sarah Wong default greeting)

Context:
- Reduced from 3 to 2 messages (progress!)
- Message #2 uses DEFAULT broker (Sarah Wong)
- Message #1 uses CORRECT broker (e.g., Michelle Chen)
- Need to find code path that doesn't have assigned broker data

Investigation priorities:
1. Check Chatwoot webhook configuration (multiple webhooks?)
2. Search for ALL Chatwoot message POSTs
3. Review n8n workflows for default greetings
4. Check Chatwoot auto-assignment feature
5. Verify archived routes are not accessible
```

---

## Git Status at End of Session

**Branch:** `bloomberg-compact-apply-stepper`

**Uncommitted Changes:**
- Modified: 4 files (tracking implementation)
- Created: 14 files (docs, plans, session logs)
- Disabled: 1 route (chatwoot-natural-flow)

**Recommended Commit:**
```bash
git add .
git commit -m "fix: disable chatwoot-natural-flow webhook (reduced duplicates from 3 to 2)

- Disabled app/api/chatwoot-natural-flow/route.ts to prevent Message #2
- Route now returns { disabled: true } instead of sending greeting
- Implemented echo detection system (tracking + fingerprinting)
- Created comprehensive debugging documentation

Progress: 3 messages → 2 messages
Remaining: Find and fix Sarah Wong default message source

Session: docs/sessions/2025-10-03-message-duplication-fix-continuation.md
"
```

---

## Quick Resume Commands

**To continue this task:**

1. **Read this document:**
   ```
   Read docs/sessions/2025-10-03-message-duplication-fix-continuation.md
   ```

2. **Start investigation:**
   ```
   /response-awareness Find and fix Message #2 source (Sarah Wong default greeting)
   ```

3. **Or manually run debug commands:**
   ```bash
   # Check webhooks
   curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
     https://chat.nextnest.sg/api/v1/accounts/1/webhooks

   # Search for message senders
   grep -r "message_type.*outgoing" . --include="*.ts" -n | grep -v node_modules
   ```

---

**Session paused. Ready to continue when user is ready.**
