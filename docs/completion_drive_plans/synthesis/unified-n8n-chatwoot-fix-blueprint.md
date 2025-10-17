# Unified n8n-Chatwoot Fix Blueprint

**Date:** October 2, 2025
**Phase:** 2 - Plan Synthesis & Path Selection
**Status:** READY FOR IMPLEMENTATION
**Objective:** Eliminate Chatwoot-n8n message duplication through coordinated fixes

---

## Executive Summary

After reviewing both Phase 1 planning outputs (n8n workflow analysis and webhook audit), I've identified a **two-pronged fix strategy** that addresses the root causes of message duplication:

**FINDING #1:** n8n workflow sends automatic broker greetings with "Sarah Wong" fallback (Message #2)
**FINDING #2:** Agent bot webhook is REDUNDANT with account webhook (potential duplicate event processing)

**UNIFIED STRATEGY:**
1. **Primary Fix:** Remove greeting nodes from n8n workflow (Path B from n8n plan)
2. **Secondary Fix:** Disable agent bot webhook (Approach A from webhook plan)
3. **Execution Order:** n8n fix FIRST, then webhook fix (dependencies documented below)

**EXPECTED OUTCOME:**
- Current: 2 duplicate greetings (down from 3 after disabling chatwoot-natural-flow)
- After Implementation: 1 greeting only (from backend broker-engagement-manager)
- Risk Level: LOW (both fixes are reversible in <5 minutes)

---

## #LCL_EXPORT_CRITICAL: Root Cause Analysis

### Dual Webhook Registration + n8n Greeting

**Issue #1: n8n Workflow Sends Automatic Greetings**
```
n8n Workflow: "Chatwoot Conversation Enhancer v2"
├─ Polls every 60 seconds for pending conversations
├─ Assigns broker to Chatwoot user ✅
├─ Sets status to "open" ✅
├─ Applies labels (AI-Broker-*, Property-*) ✅
└─ 🔴 SENDS BROKER GREETING (Lines 243-286)
    ├─ "Generate Broker Message" node (Code)
    └─ "Add Broker Message" node (HTTP POST)
    └─> Falls back to "Sarah Wong" if broker name missing
    └─> DUPLICATES backend greeting
```

**Issue #2: Redundant Webhook Sources**
```
Chatwoot Event: message_created
├─ Account Webhook (ID: 1) → n8n
└─ Agent Bot Webhook (Bot: NextNest AI Broker) → n8n (SAME URL)
    └─> n8n receives event TWICE
    └─> May process message TWICE
```

**Backend Greeting (CORRECT - Keep This):**
```
Backend: broker-engagement-manager
├─ Runs on form submission
├─ Assigns broker from Supabase
├─ Sends greeting synchronously
└─ Uses CORRECT broker name (no fallback)
```

**Conclusion:** Backend greeting is authoritative. n8n should handle auxiliary tasks (labels, status) but NOT send greetings.

---

## #PATH_DECISION: Unified Fix Selection

### Review of Phase 1 Options

**n8n Workflow Options (from n8n-greeting-disable-plan.md):**
- ❌ **Path A:** Disable entire workflow → Loses labels, status updates
- ✅ **Path B:** Remove greeting nodes only → Preserves labels, surgical fix
- ⚠️ **Path C:** Add conditional logic → Too complex, unnecessary
- ❌ **Path D:** Change to webhook trigger → Doesn't solve duplication

**Webhook Configuration Options (from webhook-audit-report.md):**
- ✅ **Approach A:** Disable agent bot webhook → Simple, reversible, eliminates duplicate events
- ⚠️ **Approach B:** Add deduplication in n8n → Adds complexity, doesn't address greeting issue
- ⚠️ **Approach C:** Modify account webhook events → Risky, may break n8n logic

### #PATH_RATIONALE: Selected Combination

**SELECTED:** n8n Path B + Webhook Approach A

**Why This Combination:**

1. **Addresses Both Root Causes:**
   - Path B removes duplicate greeting source (n8n workflow)
   - Approach A eliminates duplicate event delivery (bot webhook)

2. **Preserves Valuable Functionality:**
   - Labels still applied (AI-Broker-*, Property-*)
   - Status updates preserved (pending → open)
   - User assignment maintained
   - Account webhook continues delivering events

3. **Low Complexity, High Reversibility:**
   - n8n: Delete 2 nodes + update connections (5-10 min)
   - Webhook: Disable bot via UI toggle (2 min)
   - Both rollback in <5 minutes via UI

4. **System-Wide Coherence:**
   - Backend owns user-facing features (greetings, broker identity)
   - n8n owns inbox management (labels, organization)
   - Single event source (account webhook) for clarity

5. **No False Patterns:**
   - #PHANTOM_PATTERN avoided: Not treating symptoms (deduplication) while ignoring cause (dual sources)
   - #FALSE_FLUENCY check: Combination feels heavier than "just disable n8n" but preserves critical labels
   - #FIXED_FRAMING avoided: Rejected "simplest fix" (disable entire workflow) because it breaks features

**Why Not Alternative Combinations:**

- **n8n Path A + Webhook Approach A:** Loses labels functionality (breaks Chatwoot inbox organization)
- **n8n Path B + Webhook Approach B:** Adds unnecessary complexity (deduplication) when removing source is simpler
- **n8n Path C + Webhook Approach A:** Over-engineers n8n (conditional logic) when deletion is sufficient

---

## #LCL_EXPORT_CRITICAL: Unified Implementation Plan

### Execution Order (DEPENDENCIES MATTER)

**CRITICAL:** Execute fixes in THIS ORDER:

```
1. n8n Workflow Fix (PRIMARY)
   ├─ Removes greeting source
   ├─ Reduces duplicates from 2 → 1 (if webhook is only duplicate event source)
   └─ OR reduces from 2 → 1-2 (if bot webhook also triggers duplicates)

2. Agent Bot Webhook Disable (SECONDARY)
   ├─ Eliminates duplicate event source
   ├─ Ensures n8n receives each event ONCE
   └─ Reduces duplicates to 0 (GOAL)

3. Verification Testing
   ├─ Confirm 1 greeting only
   ├─ Verify labels still applied
   └─ Check n8n receives single event per action
```

**Why This Order:**
- n8n fix addresses KNOWN duplicate (greeting message)
- Webhook fix addresses POTENTIAL duplicate (event processing)
- Testing after EACH fix isolates which fix solved which issue
- If only n8n fix needed, we avoid unnecessary webhook changes

---

### Phase 1: n8n Workflow Modification

**Objective:** Remove greeting-sending nodes while preserving labels/status functionality

**Prerequisites:**
- [ ] Access to n8n UI: https://n8n.nextnest.sg
- [ ] OR access to workflow JSON: `n8n-workflows/Chatwoot Conversation Enhancer v2.json`
- [ ] Backup created: `n8n-workflows/Chatwoot Conversation Enhancer v2.backup.json`

**Implementation Steps (n8n UI Method - RECOMMENDED):**

1. **Backup Workflow**
   ```bash
   cp "C:\Users\HomePC\Desktop\Code\NextNest\n8n-workflows\Chatwoot Conversation Enhancer v2.json" \
      "C:\Users\HomePC\Desktop\Code\NextNest\n8n-workflows\Chatwoot Conversation Enhancer v2.backup.json"
   ```

2. **Open n8n Editor**
   - Navigate to: https://n8n.nextnest.sg
   - Login with credentials
   - Open "Chatwoot Conversation Enhancer v2" workflow

3. **Deactivate Workflow (Safety)**
   - Toggle "Active" switch to OFF
   - Prevents execution during editing

4. **Delete "Generate Broker Message" Node**
   - Click orange Code node labeled "Generate Broker Message"
   - Press DELETE key or right-click → Delete
   - Confirm deletion

5. **Delete "Add Broker Message" Node**
   - Click blue HTTP Request node labeled "Add Broker Message"
   - Press DELETE key or right-click → Delete
   - Confirm deletion

6. **Verify Connections**
   - Click "Add User Message" node
   - Check right panel: Should show NO outgoing connections
   - Workflow ends after "Add User Message"

7. **Save Workflow**
   - Click "Save" button (top right)
   - Confirm changes saved

8. **Reactivate Workflow**
   - Toggle "Active" switch back to ON
   - Workflow resumes polling every 1 minute

**Expected Workflow After Modification:**
```
Schedule Trigger (every 1 min)
  ↓
Get Pending Conversations
  ↓
Check if Conversations Exist
  └─ TRUE → Split Out
      ↓
  Assign to User
      ↓
  Set Status to Open
      ↓
  Check Broker Name Status
      ↓
  Determine Labels
      ↓
  Add Labels
      ↓
  Generate User Message (SKIPPED)
      ↓
  Add User Message (NO-OP)
      ↓
  END ✅ (no greeting nodes)
```

**Verification (Phase 1 Only):**
- [ ] Workflow active in n8n UI
- [ ] "Generate Broker Message" node MISSING
- [ ] "Add Broker Message" node MISSING
- [ ] Workflow ends after "Add User Message"
- [ ] Create test conversation → Count greetings (expect 1)

**Rollback (if needed):**
1. n8n UI → Workflow → Workflow History → Restore previous version
2. OR re-import backup JSON via Import from File

**Time Estimate:** 10-15 minutes

---

### Phase 2: Agent Bot Webhook Disable

**Objective:** Eliminate duplicate event source to n8n

**Prerequisites:**
- [ ] Phase 1 COMPLETED and TESTED
- [ ] Chatwoot admin access: https://chat.nextnest.sg
- [ ] Current configuration documented (already in webhook-audit-report.md)

**Implementation Steps:**

1. **Identify Inbox with Bot Assignment**
   ```bash
   curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
     https://chat.nextnest.sg/api/v1/accounts/1/inboxes
   # Look for: "agent_bot_inbox_id": 1
   ```

2. **Disable Bot via Chatwoot Admin UI**
   - Login to Chatwoot: https://chat.nextnest.sg
   - Go to Settings → Inboxes → [Website Inbox]
   - Click "Bot Configuration" tab
   - Under "Assigned Bot", select "None" or click "Remove"
   - Click "Update Inbox Settings"

3. **Verify Bot Removal**
   ```bash
   curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
     https://chat.nextnest.sg/api/v1/accounts/1/inboxes
   # Verify: "agent_bot_inbox_id": null
   ```

**Expected Architecture After Modification:**
```
Chatwoot Instance
├─ Account Webhook (ID: 1) → n8n ✅ (ONLY SOURCE)
└─ Agent Bot Webhook → DISABLED ❌

n8n receives:
├─ message_created (1x via account webhook) ✅
├─ conversation_created (1x) ✅
└─ conversation_status_changed (1x) ✅
```

**Verification (Phase 2):**
- [ ] Bot removed from inbox (Chatwoot UI)
- [ ] API confirms `agent_bot_inbox_id: null`
- [ ] Create test conversation → n8n logs show 1 event per action
- [ ] Count greetings → Should still be 1 (no change from Phase 1)

**Rollback (if needed):**
1. Chatwoot UI → Settings → Inboxes → Bot Configuration
2. Select "NextNest AI Broker" from dropdown
3. Save changes

**Time Estimate:** 5-10 minutes

---

### Phase 3: Integration Validation

**Objective:** Verify both fixes work together and achieve goal (1 greeting only)

**Test Cases:**

**Test 1: Fresh Conversation Creation**
- [ ] Submit mortgage form with NEW email: `unified-test-<timestamp>@nextnest.sg`
- [ ] Wait 60 seconds (n8n poll cycle)
- [ ] Open Chatwoot conversation
- [ ] **COUNT GREETINGS:** Should be EXACTLY 1
- [ ] **CHECK LABELS:** Should have AI-Broker-* and Property-* labels
- [ ] **CHECK STATUS:** Should be "open"
- [ ] **CHECK ASSIGNEE:** Should be assigned to user ID 1

**Test 2: User Reply Handling**
- [ ] In same conversation, send user message: "What are the interest rates?"
- [ ] **COUNT RESPONSES:** Should receive EXACTLY 1 AI response
- [ ] Check n8n logs: Should show 1 `message_created` event received
- [ ] Check account webhook logs: Should show 1 event sent to n8n

**Test 3: High Volume (Load Testing)**
- [ ] Submit 5 forms in rapid succession (within 30 seconds)
- [ ] Wait 90 seconds (all processed)
- [ ] Check ALL 5 conversations:
   - [ ] Each has EXACTLY 1 greeting
   - [ ] Each has labels applied
   - [ ] Each has status "open"
   - [ ] No errors in n8n execution logs

**Test 4: Regression Testing (Ensure No Breakage)**
- [ ] Backend greeting still appears (Message #1)
- [ ] Broker name matches Supabase assignment (not "Sarah Wong" fallback)
- [ ] Chatwoot widget loads correctly
- [ ] User can send/receive messages
- [ ] n8n AI broker responses work (if separate workflow exists)

**Success Criteria:**
```
✅ Zero duplicate greeting messages (1 greeting per conversation)
✅ Labels applied correctly (AI-Broker-*, Property-*)
✅ Conversation status set to "open"
✅ n8n receives each event ONCE (verified in logs)
✅ Backend greeting delivery >99%
✅ No user-facing breakage
```

**Time Estimate:** 30-45 minutes

---

## #LCL_EXPORT_CRITICAL: Rollback Strategy

### Emergency Rollback (If Critical Failure)

**Scenario 1: n8n Workflow Broken (No Labels, Errors)**

**Immediate Actions (3-5 minutes):**
1. Open n8n UI: https://n8n.nextnest.sg
2. Click workflow name dropdown → "Workflow History"
3. Find version before deletion (timestamped)
4. Click "Restore"
5. Verify workflow active

**OR (If n8n UI Unavailable):**
```bash
# Restore from backup
cp "C:\Users\HomePC\Desktop\Code\NextNest\n8n-workflows\Chatwoot Conversation Enhancer v2.backup.json" \
   "C:\Users\HomePC\Desktop\Code\NextNest\n8n-workflows\Chatwoot Conversation Enhancer v2.json"
# Re-import to n8n when available
```

**Verify Restoration:**
- [ ] "Generate Broker Message" node exists
- [ ] "Add Broker Message" node exists
- [ ] Workflow executes without errors

---

**Scenario 2: Bot Disable Broke AI Responses**

**Immediate Actions (2-3 minutes):**
1. Login to Chatwoot: https://chat.nextnest.sg
2. Settings → Inboxes → [Website Inbox] → Bot Configuration
3. Select "NextNest AI Broker" from dropdown
4. Save changes

**Verify Restoration:**
- [ ] API shows `agent_bot_inbox_id: 1`
- [ ] Test conversation receives AI responses
- [ ] No errors in n8n logs

---

**Scenario 3: Partial Success (Phase 1 Works, Phase 2 Fails)**

**Strategy:**
- **Keep Phase 1 changes** (n8n workflow modification)
- **Rollback Phase 2 only** (re-enable bot webhook)
- **Result:** 1 greeting (from backend), but duplicate events may persist
- **Acceptable:** Fixes primary user-facing issue (duplicate greetings)

---

## #LCL_EXPORT_FIRM: Division of Labor

### Post-Fix Responsibilities

| Function | Owner | Method | Timing |
|----------|-------|--------|--------|
| **User-Facing Features** | | | |
| Broker Assignment | Backend | Supabase query | Immediate (on form submit) |
| Greeting Message | Backend | chatwoot-client | Immediate (after assignment) |
| Custom Attributes | Backend | Chatwoot API | Immediate (with greeting) |
| **Inbox Management** | | | |
| Conversation Status | n8n | Chatwoot API | Polling (every 60s) |
| Labels (AI-Broker-*) | n8n | Chatwoot API | Polling (every 60s) |
| Labels (Property-*) | n8n | Chatwoot API | Polling (every 60s) |
| User Assignment | n8n | Chatwoot API | Polling (every 60s) |
| **Event Delivery** | | | |
| Webhook Events | Chatwoot | Account Webhook | Real-time |
| Event Processing | n8n | Workflow execution | On receipt |

**Rationale:**
- **Backend** owns critical path (user experience, broker identity)
- **n8n** owns auxiliary functions (organization, metadata)
- **Clear separation** prevents duplication and role confusion
- **Backend executes synchronously** (reliable, immediate)
- **n8n polls asynchronously** (acceptable 60s delay for labels)

---

## #LCL_EXPORT_CRITICAL: Testing Validation Plan

### Test Coverage Matrix

| Test Type | Description | Pass Criteria | Time Required |
|-----------|-------------|---------------|---------------|
| **Unit Tests** | | | |
| n8n Workflow Structure | Verify nodes deleted, connections updated | No greeting nodes, workflow ends at "Add User Message" | 5 min |
| Webhook Configuration | Verify bot disabled, account webhook active | `agent_bot_inbox_id: null`, account webhook exists | 5 min |
| **Integration Tests** | | | |
| Fresh Conversation | Submit form → count messages | Exactly 1 greeting | 10 min |
| User Reply | Send message → count responses | Exactly 1 AI response | 5 min |
| Label Application | Check conversation labels | AI-Broker-* and Property-* present | 5 min |
| Status Update | Check conversation status | Status = "open" | 2 min |
| **Regression Tests** | | | |
| Backend Greeting | Verify backend still sends greeting | Greeting appears, correct broker name | 5 min |
| Broker Name Accuracy | Check greeting uses correct broker | Not "Sarah Wong" fallback | 5 min |
| Chatwoot Widget | Load widget on website | Widget loads, no errors | 5 min |
| Message Flow | User sends → AI responds | No errors, response relevant | 5 min |
| **Load Tests** | | | |
| High Volume | 5 forms in 30 seconds | All conversations: 1 greeting, labels applied | 15 min |
| n8n Performance | Check execution time | <10s per conversation | 5 min |
| Rate Limiting | Verify no Chatwoot API errors | No 429 errors in logs | 5 min |

**Total Testing Time:** ~75-90 minutes (including wait times)

---

### Verification Queries

**Check Greeting Count (Chatwoot API):**
```bash
# Replace 244 with actual conversation ID
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  "https://chat.nextnest.sg/api/v1/accounts/1/conversations/244/messages" \
  | jq '[.payload[] | select(.message_type == 1)] | length'
# Expected output: 1
```

**Check n8n Event Reception (n8n UI):**
```
1. Open n8n UI: https://n8n.nextnest.sg
2. Click "Executions" tab
3. Find latest execution for conversation
4. Verify:
   - "Add Labels" step completed ✅
   - "Set Status to Open" step completed ✅
   - "Add Broker Message" step MISSING ✅
```

**Check Bot Webhook Status (Chatwoot API):**
```bash
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  https://chat.nextnest.sg/api/v1/accounts/1/agent_bots
# Verify bot exists but not assigned to inbox
```

**Check Backend Logs (if accessible):**
```bash
grep "Initial broker message sent successfully" logs/app.log | tail -10
# Verify backend still sending greetings
```

---

## #LCL_EXPORT_CRITICAL: Integration Coordination Points

### Cross-Component Dependencies

**Dependency 1: Broker Name Propagation**
```
Backend assigns broker
  ↓ (immediate)
Backend sets custom_attributes { ai_broker_name: "Sarah Wong" }
  ↓ (immediate)
Backend sends greeting "I'm Sarah Wong..."
  ↓ (60 seconds later)
n8n polls Chatwoot
  ↓
n8n reads custom_attributes
  ↓
n8n applies label "AI-Broker-Sarah"
```
**CRITICAL:** n8n reads broker name AFTER backend sets it. 60s delay ensures no race condition for labels.

**Dependency 2: Event Flow**
```
User action (form submit, message send)
  ↓
Chatwoot processes action
  ↓
Chatwoot fires webhook (account webhook ONLY after fix)
  ↓
n8n receives event ONCE
  ↓
n8n processes (labels, status, etc.)
  ↓
NextNest receives results from n8n (via /api/chatwoot-webhook)
```
**CRITICAL:** Single webhook source ensures n8n processes each event exactly once.

**Dependency 3: Greeting Timing**
```
Backend sends greeting (immediate, synchronous)
  ↓ (0-2 seconds)
User sees greeting in Chatwoot widget
  ↓ (60 seconds later)
n8n polls and applies labels
  ↓
User sees labels in conversation (internal, not visible to end user)
```
**CRITICAL:** Backend greeting happens BEFORE n8n processing. User sees greeting immediately, labels applied later.

---

### Interface Contracts

**Backend → Chatwoot (Message Posting):**
```typescript
POST /api/v1/accounts/1/conversations/{id}/messages
Headers:
  Api-Access-Token: <CHATWOOT_API_TOKEN>
  Content-Type: application/json
Body:
  {
    content: "Hello John! I'm Sarah Wong...",
    message_type: "outgoing",
    private: false
  }
```
**Contract:** Backend MUST send greeting immediately after broker assignment. No fallback needed (high reliability).

**Chatwoot → n8n (Account Webhook):**
```json
POST https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker
Headers:
  Content-Type: application/json
Body:
  {
    event: "message_created",
    conversation: { id: 244, ... },
    message: { content: "...", ... }
  }
```
**Contract:** Chatwoot sends events to n8n ONCE per action (after bot webhook disabled). n8n processes without duplication.

**n8n → Chatwoot (Label Application):**
```typescript
POST /api/v1/accounts/1/conversations/{id}/labels
Headers:
  Api-Access-Token: <CHATWOOT_API_TOKEN>
Body:
  {
    labels: ["AI-Broker-Sarah", "Property-HDB"]
  }
```
**Contract:** n8n applies labels after polling pending conversations. Must preserve this functionality after greeting removal.

---

## Monitoring & Verification Plan

### Week 1 Monitoring (Critical Period)

**KPIs to Track:**

| Metric | Target | Alert Threshold | Check Frequency |
|--------|--------|-----------------|-----------------|
| Greeting Duplicates | 0 per conversation | > 0 | Every conversation |
| Greeting Count | 1 per conversation | != 1 | Every conversation |
| Label Application Rate | >95% | <90% | Daily |
| n8n Workflow Success Rate | >95% | <90% | Hourly |
| Backend Greeting Delivery | >99% | <95% | Hourly |
| n8n Event Reception | 1 per action | > 1 | Per execution |
| Bot Webhook Fires | 0 (disabled) | > 0 | Daily |

**Log Queries:**

**Backend Greeting Success:**
```bash
# Count backend greetings sent (last 24 hours)
grep "Initial broker message sent successfully" logs/app.log | wc -l

# Check for failures
grep "Failed to send broker message" logs/app.log
```

**n8n Execution Success:**
```
# Via n8n UI
1. Workflows → Chatwoot Conversation Enhancer v2 → Executions
2. Filter: Last 24 hours
3. Check success rate (green vs red)
4. Investigate any failures
```

**Greeting Count Verification:**
```bash
# For recent conversations (replace IDs)
for id in 244 245 246; do
  count=$(curl -s -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
    "https://chat.nextnest.sg/api/v1/accounts/1/conversations/$id/messages" \
    | jq '[.payload[] | select(.message_type == 1)] | length')
  echo "Conversation $id: $count greetings"
done
# Expected: "1" for all conversations
```

---

### Alert Conditions

**CRITICAL (Immediate Action):**
- Greeting count > 1 detected (duplication recurred)
- n8n workflow disabled unexpectedly
- Backend greeting failures >10% for 5+ minutes
- Chatwoot API rate limit exceeded (429 errors)

**WARNING (Monitor Closely):**
- Label application rate <90%
- n8n workflow execution time >30s
- Backend greeting failures >5% for 15+ minutes
- Bot webhook fires (should be 0)

**INFO (Track Trends):**
- n8n execution time 10-30s (normal range)
- Label application rate 90-95% (acceptable)
- Backend greeting latency >2s (acceptable)

---

## #LCL_EXPORT_CASUAL: Recommendations

### Post-Implementation Optimizations

**Week 2-4 (After Stable):**

1. **Monitoring Dashboard:**
   - Create Grafana/Datadog dashboard for key metrics
   - Track greeting count, label rate, n8n success over time
   - Set up automated alerts (Slack/email)

2. **Performance Tuning:**
   - Review n8n polling frequency (60s may be too aggressive)
   - Consider 2-3 minute polling for labels (non-critical path)
   - Monitor Chatwoot API rate limits

3. **Security Hardening:**
   - Add webhook signature validation (Chatwoot sends `X-Chatwoot-Signature`)
   - Implement IP allowlisting on n8n Railway deployment
   - Add rate limiting on n8n webhook endpoint
   - Rotate Chatwoot API token (quarterly schedule)

4. **Documentation Updates:**
   - Update architecture diagrams (single webhook source)
   - Document n8n workflow purpose (labels/status, NOT greetings)
   - Create runbook for n8n workflow maintenance

5. **Code Cleanup:**
   - Archive `chatwoot-natural-flow` route (already disabled)
   - Remove unused `chatwoot-ai-webhook` route (if confirmed deprecated)
   - Add comments in n8n workflow JSON explaining node purposes

---

### Future Considerations

**Question for User/Stakeholders:**
- Should labels be applied by backend (instead of n8n)? Would eliminate 60s delay.
- Is n8n polling necessary, or can we move to event-driven (webhook trigger)?
- Do we need agent bot at all, or can we use account webhook exclusively?

**Potential Architecture Evolution:**
```
Future State (Optional):
├─ Chatwoot → Backend (single webhook, all events)
├─ Backend handles: greetings, labels, status
├─ n8n handles: AI response generation only
└─ Simplifies architecture, reduces polling overhead
```

---

## Files Modified / Created

### Modified (Implementation)
1. `n8n-workflows/Chatwoot Conversation Enhancer v2.json`
   - Nodes deleted: "Generate Broker Message", "Add Broker Message"
   - Connections updated: "Add User Message" → END

2. Chatwoot Configuration (via UI/API)
   - Agent bot removed from inbox (bot webhook disabled)
   - Account webhook remains active

### Created (Documentation)
3. `docs/completion_drive_plans/synthesis/unified-n8n-chatwoot-fix-blueprint.md` (this file)

### Backup
4. `n8n-workflows/Chatwoot Conversation Enhancer v2.backup.json` (created before modification)

---

## Next Steps for Implementation Agent (Phase 3)

### Pre-Implementation Checklist
- [ ] Read this blueprint thoroughly
- [ ] Confirm access to n8n UI: https://n8n.nextnest.sg
- [ ] Confirm access to Chatwoot admin: https://chat.nextnest.sg
- [ ] Confirm Chatwoot API token available: `ML1DyhzJyDKFFvsZLvEYfHnC`
- [ ] Create backup of n8n workflow JSON

### Implementation Sequence
1. **Execute Phase 1: n8n Workflow Modification** (10-15 min)
   - Follow steps in "Phase 1: n8n Workflow Modification"
   - Test: Create conversation → count greetings (expect 1)

2. **Execute Phase 2: Agent Bot Webhook Disable** (5-10 min)
   - Follow steps in "Phase 2: Agent Bot Webhook Disable"
   - Test: Verify bot disabled, count greetings (still expect 1)

3. **Execute Phase 3: Integration Validation** (30-45 min)
   - Run all test cases from "Phase 3: Integration Validation"
   - Document results in test report

4. **Monitor for 24-48 Hours**
   - Track KPIs from "Monitoring & Verification Plan"
   - Watch for alerts
   - Respond to user reports

5. **If Issues Found:**
   - Execute rollback immediately (see "Rollback Strategy")
   - Document failure mode
   - Escalate to planning agents for re-planning

### Success Criteria
- [ ] Zero duplicate greeting messages
- [ ] Labels applied correctly (>95% of conversations)
- [ ] n8n workflow success rate >95%
- [ ] Backend greeting delivery >99%
- [ ] No user-facing breakage
- [ ] No rollbacks required in first 48 hours

---

## Completion Criteria

**This synthesis is complete when:**

- [x] Both Phase 1 plans reviewed (n8n + webhook)
- [x] All PATH_DECISION points evaluated
- [x] Optimal path combination selected with rationale
- [x] Integration dependencies identified and documented
- [x] Unified implementation plan created (sequenced steps)
- [x] Rollback strategy documented for each phase
- [x] Testing validation plan created
- [x] Cross-component interface contracts defined
- [x] Monitoring and alert conditions specified
- [x] LCL exports marked for implementation agent

**Ready for Phase 3 Implementation.**

---

## #LCL_EXPORT_CRITICAL: Unified Fix Sequence

```yaml
fix_sequence:
  - phase: 1
    name: "n8n Workflow Greeting Removal"
    target: "n8n-workflows/Chatwoot Conversation Enhancer v2.json"
    action: "Delete greeting nodes (Generate Broker Message, Add Broker Message)"
    method: "n8n UI deletion (recommended) OR JSON editing"
    time: "10-15 minutes"
    rollback_time: "3-5 minutes"
    risk: "LOW"
    preserves:
      - "Label application (AI-Broker-*, Property-*)"
      - "Status updates (pending → open)"
      - "User assignment (assignee_id)"
    removes:
      - "Duplicate broker greeting with Sarah Wong fallback"

  - phase: 2
    name: "Agent Bot Webhook Disable"
    target: "Chatwoot inbox configuration"
    action: "Remove agent bot from inbox"
    method: "Chatwoot admin UI (Settings → Inboxes → Bot Configuration)"
    time: "5-10 minutes"
    rollback_time: "2-3 minutes"
    risk: "LOW"
    preserves:
      - "Account webhook (primary event source)"
      - "n8n AI response generation"
    removes:
      - "Duplicate event source (bot webhook)"
      - "Duplicate message_created events to n8n"

  - phase: 3
    name: "Integration Validation"
    target: "System-wide verification"
    action: "Test greeting count, labels, n8n execution"
    method: "Manual testing + automated checks"
    time: "30-45 minutes"
    rollback_time: "N/A (validation only)"
    risk: "NONE"
    validates:
      - "1 greeting per conversation (goal achieved)"
      - "Labels still applied (functionality preserved)"
      - "n8n receives 1 event per action (no duplication)"
      - "Backend greeting delivery (authoritative source)"

expected_outcome: "2 duplicate greetings → 1 greeting (backend only)"
system_coherence: "Backend owns greetings, n8n owns labels/status"
reversibility: "Both fixes rollback in <5 minutes via UI"
```

---

## #LCL_EXPORT_FIRM: Testing Validation Points

```yaml
validation_points:
  unit_tests:
    - id: "n8n-structure"
      check: "Greeting nodes deleted, connections updated"
      pass_criteria: "No 'Generate Broker Message' or 'Add Broker Message' nodes"
      method: "Visual inspection in n8n UI"

    - id: "webhook-config"
      check: "Bot webhook disabled, account webhook active"
      pass_criteria: "agent_bot_inbox_id: null, account webhook exists"
      method: "Chatwoot API query"

  integration_tests:
    - id: "greeting-count"
      check: "Fresh conversation has 1 greeting"
      pass_criteria: "Exactly 1 outgoing message (message_type: 1)"
      method: "Chatwoot API query /messages"

    - id: "label-application"
      check: "Labels applied to conversation"
      pass_criteria: "AI-Broker-* and Property-* labels present"
      method: "Chatwoot UI or API query /labels"

    - id: "status-update"
      check: "Conversation status set to open"
      pass_criteria: "status: 'open'"
      method: "Chatwoot API query /conversations"

    - id: "event-deduplication"
      check: "n8n receives 1 event per action"
      pass_criteria: "n8n execution log shows 1 webhook trigger per message"
      method: "n8n UI Executions tab"

  regression_tests:
    - id: "backend-greeting"
      check: "Backend still sends greeting"
      pass_criteria: "Greeting appears, correct broker name (not Sarah Wong)"
      method: "Backend logs + Chatwoot UI"

    - id: "message-flow"
      check: "User can send/receive messages"
      pass_criteria: "User sends message → AI responds (1 response only)"
      method: "Manual test via Chatwoot widget"

  load_tests:
    - id: "high-volume"
      check: "5 forms in 30 seconds"
      pass_criteria: "All 5 conversations: 1 greeting, labels applied"
      method: "Automated form submission + API verification"

    - id: "n8n-performance"
      check: "Workflow execution time"
      pass_criteria: "<10s per conversation"
      method: "n8n execution logs"

monitoring_kpis:
  - metric: "greeting_count_per_conversation"
    target: 1
    alert_if: "!= 1"
    frequency: "every_conversation"

  - metric: "label_application_rate"
    target: ">95%"
    alert_if: "<90%"
    frequency: "daily"

  - metric: "n8n_workflow_success_rate"
    target: ">95%"
    alert_if: "<90%"
    frequency: "hourly"

  - metric: "backend_greeting_delivery"
    target: ">99%"
    alert_if: "<95%"
    frequency: "hourly"

  - metric: "n8n_event_reception_count"
    target: "1_per_action"
    alert_if: ">1"
    frequency: "per_execution"
```

---

**END OF BLUEPRINT**

This unified blueprint is ready for implementation. Proceed to Phase 3 when ready.
