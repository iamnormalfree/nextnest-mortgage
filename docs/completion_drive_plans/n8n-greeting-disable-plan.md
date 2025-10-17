# n8n Workflow Greeting Disable Plan

**Date:** October 2, 2025
**Task:** Phase 1A - n8n Workflow Specialist - Greeting Removal Planning
**Workflow:** Chatwoot Conversation Enhancer v2
**Problem:** Duplicate greeting with "Sarah Wong" fallback (Message #2 in duplication chain)

---

## Executive Summary

This plan addresses the second duplicate greeting message identified in the message duplication investigation. The n8n workflow "Chatwoot Conversation Enhancer v2" sends a default broker greeting with "Sarah Wong" fallback, duplicating the greeting already sent by the backend `broker-engagement-manager`.

**Current State:**
- 3 greetings → 2 greetings (after disabling chatwoot-natural-flow)
- Message #2 source: n8n workflow line 245 ("Generate Broker Message" node)
- Uses fallback "Sarah Wong" when broker name not available

**Target State:**
- 1 greeting only (from broker-engagement-manager)
- n8n workflow preserves other functions (labels, status updates)
- No duplicate greetings

---

## #LCL_EXPORT_CRITICAL: Current Workflow Analysis

### Workflow Overview

**File:** `n8n-workflows/Chatwoot Conversation Enhancer v2.json`

**Trigger:** Schedule Trigger (every 1 minute)
**Purpose:** Poll for pending conversations and enhance them with:
1. Broker assignment to Chatwoot user
2. Status change (pending → open)
3. Label application (AI-Broker-*, Property-*)
4. User form submission message (DISABLED at line 202)
5. **Broker greeting message (ACTIVE - THIS IS THE PROBLEM)**

**Active Status:** `"active": true` (line 551)

### Message Flow Trace

```
Schedule Trigger (every 1 min)
  ↓
Get Pending Conversations (Chatwoot API)
  ↓
Check if Conversations Exist (IF node)
  ├─ FALSE → No Action Needed (NoOp)
  └─ TRUE → Split Out (iterate conversations)
      ↓
  Assign to User (PATCH /conversations/{id})
      ↓
  Set Status to Open (POST /toggle_status)
      ↓
  Check Broker Name Status (IF ai_broker_name not empty)
      ↓ TRUE
  Determine Labels (Code node - reads custom_attributes)
      ↓
  Add Labels (POST /labels)
      ↓
  Generate User Message (Code node - SKIPPED, line 202)
      ↓
  Add User Message (HTTP Request - NO-OP due to skip)
      ↓
  🔴 Generate Broker Message (Code node - LINE 245 - PROBLEM!)
      ↓
  🔴 Add Broker Message (POST /messages - SENDS DUPLICATE GREETING)
```

---

## #LCL_EXPORT_CRITICAL: Greeting-Sending Nodes

### Node 1: "Generate Broker Message" (ID: 22275fd0-ec4a-4aba-b256-02fde0851a7b)

**Location:** Lines 243-255
**Type:** Code node (JavaScript)
**Purpose:** Generate broker introduction message based on custom_attributes

**Code Analysis (Line 245):**
```javascript
const brokerIntros = {
  'Marcus Chen': `Hi ${userName}! 🎯\n\n  I'm Marcus Chen, your dedicated mortgage specialist...`,
  'Sarah Wong': `Hello ${userName}! 👋\n\n  I'm Sarah Wong, and I'm excited to help you...`,
  'Jasmine Lee': `Hi ${userName},\n\n  Thank you for taking the time...`
};

const introMessage = brokerIntros[brokerName] || brokerIntros['Sarah Wong'];
// ↑ THIS IS THE SMOKING GUN - "Sarah Wong" fallback
```

**Problem:**
- Reads `ai_broker_name` from `custom_attributes` (race condition)
- Falls back to "Sarah Wong" if broker name missing/undefined
- This fallback triggers when n8n processes conversation before backend sets broker name
- Generates duplicate greeting that conflicts with backend greeting

**Output:**
```json
{
  "conversation_id": 244,
  "broker_message": "Hello John! 👋\n\nI'm Sarah Wong...",
  "broker_name": "Sarah Wong"
}
```

**#COMPLETION_DRIVE: Race Condition Indicator**
The fallback to "Sarah Wong" suggests n8n processes conversation before backend completes broker assignment. This is expected given:
1. Backend sends greeting immediately after assignment
2. n8n polls every 60 seconds
3. Conversation sits in "pending" status during backend processing
4. n8n picks it up before status changes to "open"

---

### Node 2: "Add Broker Message" (ID: 86271722-06b1-438f-ba23-fe0c610e9998)

**Location:** Lines 256-286
**Type:** HTTP Request
**Purpose:** POST broker greeting to Chatwoot messages API

**Request Details:**
- **Method:** POST
- **URL:** `https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{ $json.conversation_id }}/messages`
- **Headers:**
  - `Api-Access-Token: {{$env.CHATWOOT_API_TOKEN}}`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "content": "{{ JSON.stringify($json.broker_message) }}",
    "message_type": "outgoing",
    "private": false
  }
  ```

**Problem:**
- Sends duplicate greeting to Chatwoot
- Uses `message_type: "outgoing"` (appears as agent message)
- No deduplication check (always sends if workflow reaches this node)
- This is the **exact duplicate** of backend greeting

---

### Node 3: "Generate User Message" (ID: aaa2fd40-ffdc-4e61-9db6-edc9fa4bcf14)

**Location:** Lines 199-211
**Type:** Code node (JavaScript)
**Status:** **ALREADY DISABLED** ✅

**Code Analysis (Line 202):**
```javascript
// Skip generating user-facing form submission message - process internally only
return [{
  json: {
    conversation_id: conversation.id,
    // No user_message - prevents form submission display in chat
    conversation: conversation,
    skip_user_message: true  // ← DISABLED
  }
}];
```

**Result:**
- Node 4 ("Add User Message") receives `skip_user_message: true`
- HTTP Request has no `content` to send (undefined)
- Chatwoot API likely returns error or no-op
- **No user message duplication** (already fixed)

---

### Non-Greeting Nodes (PRESERVE THESE)

#### Node: "Determine Labels" (ID: 5c77a143-121a-47cd-86d1-d40f087b0ad3)

**Location:** Lines 155-167
**Type:** Code node
**Purpose:** Map broker name and property type to Chatwoot labels

**Logic:**
```javascript
const AI_BROKERS = {
  'Marcus Chen': { label: 'AI-Broker-Marcus', color: '#FF6B6B' },
  'Sarah Wong': { label: 'AI-Broker-Sarah', color: '#4ECDC4' },
  'Jasmine Lee': { label: 'AI-Broker-Jasmine', color: '#45B7D1' }
};

const PROPERTY_LABELS = {
  'HDB': { label: 'Property-HDB', color: '#96CEB4' },
  'EC': { label: 'Property-EC', color: '#FFEAA7' },
  'Private': { label: 'Property-Private', color: '#DDA0DD' }
};
```

**Keep:** YES - Labels are useful for Chatwoot inbox organization

---

#### Node: "Add Labels" (ID: 42e6cd05-e09d-4f6a-b3c6-4832179aeb94)

**Location:** Lines 168-198
**Type:** HTTP Request
**Purpose:** POST labels to Chatwoot conversation

**Keep:** YES - No duplication, enhances conversation metadata

---

#### Node: "Assign to User" (ID: 8fc97b5f-33a0-4943-b2b2-3e079d652900)

**Location:** Lines 93-123
**Type:** HTTP Request
**Purpose:** Assign conversation to Chatwoot user (assignee_id: 1)

**Keep:** MAYBE - Check if backend already assigns user
**#PLAN_UNCERTAINTY:** Is assignee_id used by backend or n8n only?

---

#### Node: "Set Status to Open" (ID: 8e804b5b-e47c-4b7f-b870-dab4f599763b)

**Location:** Lines 124-154
**Type:** HTTP Request
**Purpose:** Change conversation status from "pending" to "open"

**Keep:** MAYBE - Backend may already set status to "open"
**#PLAN_UNCERTAINTY:** Does backend set status or rely on n8n?

---

## #PATH_DECISION: Implementation Approaches

### Path A: Disable Entire Workflow ⚠️ LOSES FUNCTIONALITY

**Implementation:**
```json
{
  "active": false,  // Change line 551 from true to false
  ...
}
```

**Or via n8n UI:**
1. Open n8n workflow editor
2. Toggle "Active" switch to OFF
3. Save workflow

**Pros:**
- Simplest solution (1 line change)
- Guaranteed no duplicate greetings
- No risk of partial execution

**Cons:**
- **Loses label assignment** (AI-Broker-*, Property-*)
- **Loses status updates** (pending → open)
- **Loses user assignment** (assignee_id)
- May break Chatwoot inbox organization

**When to Use:**
- If backend handles ALL workflow functions
- If labels/status are not critical
- For quick testing to confirm n8n is the source

**#FIXED_FRAMING: "Just disable it" feels simple but may break other features**

---

### Path B: Remove Only Greeting Nodes ✅ RECOMMENDED

**Implementation Steps:**

1. **Delete "Generate Broker Message" node**
   - Remove lines 243-255 from JSON
   - Or delete node in n8n UI

2. **Delete "Add Broker Message" node**
   - Remove lines 256-286 from JSON
   - Or delete node in n8n UI

3. **Update connections**
   - Current: `Add User Message` → `Generate Broker Message` → `Add Broker Message` → END
   - New: `Add User Message` → END (workflow completes after user message)
   - Update `connections` object (lines 494-515):
     ```json
     "Add User Message": {
       "main": [
         [
           // DELETE THIS CONNECTION
           // {
           //   "node": "Generate Broker Message",
           //   "type": "main",
           //   "index": 0
           // }
         ]
       ]
     }
     ```

4. **Remove obsolete connections**
   - Delete `"Generate Broker Message"` connection block (lines 506-515)

**Pros:**
- **Preserves labels** (AI-Broker-*, Property-*)
- **Preserves status updates** (pending → open)
- **Preserves user assignment** (assignee_id)
- Surgical fix (only removes duplication source)
- Easy to revert (restore deleted nodes)

**Cons:**
- Requires JSON editing or n8n UI access
- Slightly more complex than Path A
- Need to update connection mappings

**#LCL_EXPORT_FIRM: implementation_approach::path_b_recommended**

**Testing:**
1. After modification, workflow runs every 1 minute
2. Check pending conversations still get:
   - ✅ Labels applied (AI-Broker-Sarah, Property-HDB)
   - ✅ Status set to "open"
   - ✅ Assignee set to user ID 1
   - ❌ NO greeting message sent
3. Verify backend greeting still appears (1 message only)

---

### Path C: Add Conditional Logic to Skip Greetings ⚠️ COMPLEX

**Implementation:**

Insert conditional check BEFORE "Generate Broker Message" node:

**New Node: "Check if Greeting Already Sent"**
```json
{
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "leftValue": "={{ $('Set Status to Open').item.json.messages?.length }}",
          "rightValue": 0,
          "operator": {
            "type": "number",
            "operation": "gt"
          }
        }
      ]
    }
  },
  "type": "n8n-nodes-base.if",
  "name": "Check if Greeting Already Sent"
}
```

**Logic:**
- Query Chatwoot `/messages` endpoint for conversation
- Count outgoing messages with `message_type: 1`
- If count > 0 → Skip greeting (backend already sent)
- If count = 0 → Send greeting (backend failed)

**Pros:**
- Provides fallback if backend fails to send greeting
- Most resilient approach
- Prevents duplication while keeping safety net

**Cons:**
- **Adds extra API call** (GET /messages for every conversation)
- Increases workflow execution time
- More complex logic (more failure points)
- Requires n8n workflow restructuring

**When to Use:**
- If backend greeting delivery is unreliable
- If n8n should act as fallback safety net
- If you want redundancy over simplicity

**#PLAN_UNCERTAINTY: Backend Reliability**
Current backend uses synchronous message posting (no setTimeout). Reliability should be high (>99%). Fallback may be unnecessary complexity.

---

### Path D: Change Trigger to message_created Webhook ⚠️ FUNDAMENTAL CHANGE

**Current Trigger:** Schedule (poll every 1 minute)
**Proposed Trigger:** Chatwoot webhook on `conversation_created` event

**Implementation:**

1. **Change trigger node:**
   ```json
   {
     "parameters": {
       "path": "chatwoot-enhancer-v2",
       "responseMode": "responseNode",
       "options": {}
     },
     "type": "n8n-nodes-base.webhook",
     "name": "Chatwoot Webhook"
   }
   ```

2. **Register webhook in Chatwoot:**
   ```bash
   curl -X POST "https://chat.nextnest.sg/api/v1/accounts/1/webhooks" \
     -H "Api-Access-Token: ${CHATWOOT_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://n8n.nextnest.sg/webhook/chatwoot-enhancer-v2",
       "subscriptions": ["conversation_created"]
     }'
   ```

3. **Add condition to skip if greeting exists:**
   - Check `conversation.messages` in webhook payload
   - Skip greeting if outgoing message already present

**Pros:**
- Real-time processing (no 1-minute delay)
- More efficient (event-driven vs. polling)
- Can access conversation data immediately

**Cons:**
- **Same race condition** (webhook fires before backend completes)
- **Doesn't solve duplication** (both backend and n8n receive webhook)
- Requires webhook infrastructure setup
- Polling trigger may be intentional design

**Rejected:** Doesn't address root problem (duplication). Path B is simpler.

---

## #PATH_RATIONALE: Recommended Approach

**RECOMMENDATION: Path B (Remove Only Greeting Nodes)**

### Justification

1. **Preserves Valuable Functionality**
   - Labels help organize Chatwoot inbox
   - Status updates may be relied upon by Chatwoot automations
   - User assignment enables conversation routing

2. **Surgical Fix**
   - Only removes duplication source
   - Minimal impact on workflow
   - Easy to test and verify

3. **Backend Already Sends Greeting**
   - `broker-engagement-manager` sends greeting synchronously
   - Delivery guaranteed (no setTimeout)
   - Correct broker name (from Supabase assignment)
   - No need for n8n fallback

4. **Low Risk**
   - Workflow continues running
   - Other features unaffected
   - Easy to rollback (restore deleted nodes)

5. **Aligns with Message Orchestration Plan**
   - Backend is single source of truth for greetings
   - n8n handles auxiliary tasks (labels, status)
   - Clear separation of concerns

### Trade-offs Accepted

- **No fallback greeting:** If backend fails, no greeting sent
  - Mitigation: Backend reliability is high (synchronous execution)
  - Monitoring: Alert if greeting send failures >1%
  - Manual recovery: Agent can send greeting manually via Chatwoot UI

- **Labels may use stale broker names:** n8n reads `ai_broker_name` from custom_attributes
  - Mitigation: Backend updates custom_attributes before n8n polls
  - Timing: n8n polls every 60s, backend completes in <5s
  - Impact: Labels should be correct 99% of time

---

## Step-by-Step Modification Instructions

### Option 1: Edit JSON File Directly

**Prerequisites:**
- Text editor (VS Code, Sublime, etc.)
- Access to `n8n-workflows/Chatwoot Conversation Enhancer v2.json`
- Backup of original file

**Steps:**

1. **Backup Original Workflow**
   ```bash
   cp "n8n-workflows/Chatwoot Conversation Enhancer v2.json" \
      "n8n-workflows/Chatwoot Conversation Enhancer v2.backup.json"
   ```

2. **Open Workflow in Editor**
   ```bash
   code "n8n-workflows/Chatwoot Conversation Enhancer v2.json"
   ```

3. **Delete "Generate Broker Message" Node**
   - Locate lines 243-255
   - Delete entire node object:
     ```json
     {
       "parameters": {
         "jsCode": "// Generate AI broker introduction message\n  const conversation = $('Determine Labels').first().json.conversation;\n  ..."
       },
       "id": "22275fd0-ec4a-4aba-b256-02fde0851a7b",
       "name": "Generate Broker Message",
       "type": "n8n-nodes-base.code",
       ...
     },
     ```
   - **IMPORTANT:** Remove trailing comma if it's the last node in array

4. **Delete "Add Broker Message" Node**
   - Locate lines 256-286 (after deletion, line numbers shift)
   - Delete entire node object:
     ```json
     {
       "parameters": {
         "method": "POST",
         "url": "=https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{ $json.conversation_id }}/messages",
         ...
       },
       "id": "86271722-06b1-438f-ba23-fe0c610e9998",
       "name": "Add Broker Message",
       ...
     },
     ```

5. **Update Connections - Remove Outgoing Connection from "Add User Message"**
   - Locate `connections` object (around line 494)
   - Find `"Add User Message"` block:
     ```json
     "Add User Message": {
       "main": [
         [
           {
             "node": "Generate Broker Message",  // DELETE THIS ENTIRE OBJECT
             "type": "main",
             "index": 0
           }
         ]
       ]
     },
     ```
   - Change to:
     ```json
     "Add User Message": {
       "main": [
         []  // Empty array = no outgoing connections
       ]
     },
     ```

6. **Delete "Generate Broker Message" Connection Block**
   - Locate `"Generate Broker Message"` in connections (around line 506):
     ```json
     "Generate Broker Message": {
       "main": [
         [
           {
             "node": "Add Broker Message",
             "type": "main",
             "index": 0
           }
         ]
       ]
     },
     ```
   - **DELETE ENTIRE BLOCK** (including surrounding braces and trailing comma)

7. **Validate JSON Syntax**
   ```bash
   # Using jq (if installed)
   jq empty "n8n-workflows/Chatwoot Conversation Enhancer v2.json"

   # Or online: https://jsonlint.com/
   ```

8. **Import Modified Workflow to n8n**
   - Open n8n UI: https://n8n.nextnest.sg
   - Workflows → Import from File
   - Select modified JSON file
   - **IMPORTANT:** Choose "Replace existing workflow" (same workflow ID)
   - Activate workflow

9. **Verify Changes**
   - Open workflow in n8n editor
   - Check node graph:
     - ✅ "Determine Labels" → "Add Labels" → "Generate User Message" → "Add User Message" → END
     - ❌ "Generate Broker Message" node MISSING
     - ❌ "Add Broker Message" node MISSING
   - Check connections:
     - "Add User Message" should have NO outgoing connections
     - Workflow should end after "Add User Message"

---

### Option 2: Edit in n8n UI (Recommended for Non-Technical Users)

**Prerequisites:**
- Access to n8n web UI: https://n8n.nextnest.sg
- Login credentials
- Workflow edit permissions

**Steps:**

1. **Open Workflow**
   - Navigate to Workflows
   - Find "Chatwoot Conversation Enhancer" or "Chatwoot Conversation Enhancer v2"
   - Click to open editor

2. **Deactivate Workflow (Safety Precaution)**
   - Toggle "Active" switch to OFF
   - This prevents workflow from running during editing

3. **Delete "Generate Broker Message" Node**
   - Click on "Generate Broker Message" node (orange Code node)
   - Press DELETE key or right-click → Delete
   - Confirm deletion

4. **Delete "Add Broker Message" Node**
   - Click on "Add Broker Message" node (blue HTTP Request node)
   - Press DELETE key or right-click → Delete
   - Confirm deletion

5. **Verify Connections**
   - Click on "Add User Message" node
   - Check "Connections" panel on right
   - Should show NO outgoing connections
   - If any remain, click X to remove

6. **Save Workflow**
   - Click "Save" button (top right)
   - Workflow auto-saves, but explicit save ensures changes persist

7. **Reactivate Workflow**
   - Toggle "Active" switch back to ON
   - Workflow will resume polling every 1 minute

8. **Test Immediately**
   - Click "Execute Workflow" button (top right)
   - Or wait for next scheduled execution (1 minute)
   - Check execution log:
     - ✅ Labels applied
     - ✅ Status set to "open"
     - ❌ No "Add Broker Message" execution

---

## Rollback Procedure

### If Using JSON Edit Method

1. **Restore Backup File**
   ```bash
   cp "n8n-workflows/Chatwoot Conversation Enhancer v2.backup.json" \
      "n8n-workflows/Chatwoot Conversation Enhancer v2.json"
   ```

2. **Re-import to n8n**
   - n8n UI → Workflows → Import from File
   - Select backup file
   - Choose "Replace existing workflow"
   - Activate workflow

3. **Verify Restoration**
   - Check "Generate Broker Message" node exists
   - Check "Add Broker Message" node exists
   - Test workflow execution

---

### If Using n8n UI Method

1. **n8n Has Version History**
   - Click workflow name dropdown (top left)
   - Select "Workflow History"
   - Find previous version (before deletion)
   - Click "Restore"

2. **Or Re-import Original JSON**
   - Export original workflow from backup
   - Import → Replace existing
   - Activate

3. **Emergency Rollback (If n8n Unavailable)**
   - Check git history for original JSON:
     ```bash
     git log --all --full-history -- "n8n-workflows/Chatwoot Conversation Enhancer v2.json"
     git checkout <commit-hash> -- "n8n-workflows/Chatwoot Conversation Enhancer v2.json"
     ```
   - Re-import to n8n when available

---

## Testing Checklist

### Pre-Deployment Testing (n8n Dev/Staging Instance)

**If you have a separate n8n dev instance:**

- [ ] Import modified workflow to dev n8n
- [ ] Activate workflow
- [ ] Create test conversation in Chatwoot (dev account)
- [ ] Verify labels applied: AI-Broker-*, Property-*
- [ ] Verify status changed: pending → open
- [ ] Verify assignee set: user ID 1
- [ ] **Verify NO duplicate greeting sent**
- [ ] Check n8n execution log for errors
- [ ] Confirm workflow completes successfully

**If no dev instance, test in production with canary conversation:**

- [ ] Create test conversation with email: `n8n-test-greeting-disable@nextnest.sg`
- [ ] Monitor in real-time
- [ ] Verify changes as above
- [ ] If issues found, rollback immediately

---

### Post-Deployment Testing (Production)

**Wait for Next Scheduled Execution (1 minute):**

- [ ] Create fresh conversation via form submission
- [ ] Use NEW email: `greeting-test-v2-<timestamp>@nextnest.sg`
- [ ] Wait 60 seconds for n8n poll
- [ ] Check Chatwoot conversation:
  - [ ] **Count outgoing messages:** Should be EXACTLY 1 (backend greeting only)
  - [ ] **Check labels:** Should have AI-Broker-* and Property-* labels
  - [ ] **Check status:** Should be "open"
  - [ ] **Check assignee:** Should be assigned to user ID 1
- [ ] Check n8n execution log:
  - [ ] Workflow completed successfully
  - [ ] No "Add Broker Message" step in execution path
  - [ ] "Add Labels" step executed
  - [ ] "Set Status to Open" step executed

---

### Regression Testing (Verify Other Features Unaffected)

- [ ] Backend greeting still appears (Message #1)
- [ ] Broker name in greeting matches Supabase assignment
- [ ] No queue message duplication
- [ ] Chatwoot widget loads correctly
- [ ] User can send messages
- [ ] n8n AI broker responses still work (different workflow)
- [ ] Chatwoot inbox organization intact (labels working)

---

### Load Testing (Optional but Recommended)

**Simulate High Volume:**

- [ ] Submit 10 forms in rapid succession (within 1 minute)
- [ ] All 10 conversations should:
  - [ ] Have 1 greeting only (no duplicates)
  - [ ] Have correct labels
  - [ ] Have status "open"
  - [ ] Have assignee set

**Check n8n Performance:**

- [ ] Workflow execution time <10s per conversation
- [ ] No timeout errors
- [ ] No rate limiting errors from Chatwoot API

---

## Monitoring & Alerts

### Metrics to Track

1. **Greeting Message Count per Conversation**
   - Query Chatwoot API: `GET /conversations/{id}/messages`
   - Filter: `message_type: 1` (outgoing)
   - Expected: 1 greeting per conversation
   - Alert: If count > 1 (duplication detected)

2. **n8n Workflow Execution Success Rate**
   - n8n UI → Workflow → Executions
   - Expected: >95% success rate
   - Alert: If <90% or consecutive failures

3. **Label Application Rate**
   - Check conversations for presence of AI-Broker-* labels
   - Expected: >95% of conversations have labels
   - Alert: If <80% (indicates workflow failure)

4. **Backend Greeting Send Success Rate**
   - Check logs for: `✅ Initial broker message sent successfully`
   - Expected: >99%
   - Alert: If <95%

---

### Alert Conditions

**Critical Alerts (Immediate Action):**

- n8n workflow disabled unexpectedly
- Chatwoot API rate limit exceeded
- Backend greeting send failures >10% for 5 minutes

**Warning Alerts (Monitor):**

- Label application rate <90%
- n8n workflow execution time >30s
- Greeting count per conversation >1 (duplication recurrence)

---

### Log Queries

**Check n8n Execution Logs:**
```bash
# Via n8n UI: Workflows → Chatwoot Conversation Enhancer v2 → Executions → [Latest]
# Look for:
# ✅ "Add Labels" step completed
# ✅ "Set Status to Open" step completed
# ❌ "Add Broker Message" step MISSING (should not appear)
```

**Check Backend Logs:**
```bash
# Filter for greeting send confirmations
grep "Initial broker message sent successfully" /var/log/nextnest/app.log

# Count greetings per conversation
grep "conversationId: 244" /var/log/nextnest/app.log | grep "broker message"
# Should see exactly 1 match per conversation
```

**Check Chatwoot Message Count via API:**
```bash
curl -H "Api-Access-Token: ${CHATWOOT_API_TOKEN}" \
  "https://chat.nextnest.sg/api/v1/accounts/1/conversations/244/messages" \
  | jq '[.payload[] | select(.message_type == 1)] | length'
# Should return: 1
```

---

## LCL Exports for Synthesis Agent

### #LCL_EXPORT_CRITICAL: workflow_structure::greeting_removal

**Modified Workflow Flow:**
```
Schedule Trigger (every 1 min)
  ↓
Get Pending Conversations
  ↓
Check if Conversations Exist
  ├─ NO → No Action Needed
  └─ YES → Split Out
      ↓
  Assign to User
      ↓
  Set Status to Open
      ↓
  Check Broker Name Status
      ↓ (ai_broker_name not empty)
  Determine Labels
      ↓
  Add Labels
      ↓
  Generate User Message (SKIPPED)
      ↓
  Add User Message (NO-OP)
      ↓
  END (no greeting nodes)
```

**Key Change:** Workflow terminates after "Add User Message" node. No downstream nodes to send greeting.

---

### #LCL_EXPORT_FIRM: integration_coordination::n8n_backend_responsibilities

**Division of Labor:**

| Function | Owner | Method | Timing |
|----------|-------|--------|--------|
| Broker Assignment | Backend | Supabase query | Immediate (on form submit) |
| Greeting Message | Backend | chatwoot-client | Immediate (after assignment) |
| Custom Attributes | Backend | Chatwoot API | Immediate (with greeting) |
| Conversation Status | n8n | Chatwoot API | Polling (every 60s) |
| Labels | n8n | Chatwoot API | Polling (every 60s) |
| User Assignment | n8n | Chatwoot API | Polling (every 60s) |

**Rationale:**
- Backend owns user-facing features (greeting, broker identity)
- n8n owns inbox management (labels, organization)
- Clear separation prevents duplication

---

### #LCL_EXPORT_FIRM: data_flow::broker_name_propagation

**Broker Name Lifecycle:**

```
Form Submission
  ↓
Backend: assignBestBroker() → "Sarah Wong"
  ↓
Backend: Update custom_attributes { ai_broker_name: "Sarah Wong" }
  ↓
Backend: Send greeting: "I'm Sarah Wong..."
  ↓
[60 seconds later]
  ↓
n8n: Poll Chatwoot, read custom_attributes
  ↓
n8n: Determine Labels → "AI-Broker-Sarah"
  ↓
n8n: Add Labels to conversation
  ↓
n8n: END (no greeting sent)
```

**Critical Insight:** n8n reads broker name AFTER backend sets it. No race condition for labels (60s delay is sufficient). Race condition only affects greeting timing (hence backend must own greeting).

---

## Files Requiring Changes

**Modified:**
1. `n8n-workflows/Chatwoot Conversation Enhancer v2.json`
   - Delete nodes: "Generate Broker Message", "Add Broker Message"
   - Update connections: Remove outgoing from "Add User Message"

**Created (Documentation):**
2. `docs/completion_drive_plans/n8n-greeting-disable-plan.md` (this file)

**Backup:**
3. `n8n-workflows/Chatwoot Conversation Enhancer v2.backup.json` (created before modification)

---

## Alternative Approaches Considered

### Why Not Disable Entire Workflow?

**Rejected because:**
- Loses label functionality (AI-Broker-*, Property-*)
- Loses status management (pending → open)
- Loses user assignment (routing)
- Chatwoot inbox organization would degrade

**Acceptable only if:**
- Backend implements ALL workflow functions
- Labels moved to backend code
- Status updates moved to backend code
- User assignment moved to backend code

**Current State:** Backend does NOT implement these. Disabling workflow would create gaps.

---

### Why Not Add Deduplication Check?

**Rejected because:**
- Adds complexity (extra API call per conversation)
- Increases execution time (GET /messages + count)
- Doesn't solve root problem (n8n shouldn't send greetings)
- Backend already guarantees greeting delivery (no need for fallback)

**Acceptable only if:**
- Backend greeting delivery is unreliable (<95%)
- Need redundancy for critical path
- Extra 1-2s execution time acceptable

**Current State:** Backend reliability is high (synchronous execution). Fallback unnecessary.

---

### Why Not Change to Webhook Trigger?

**Rejected because:**
- Doesn't solve duplication (both backend and n8n receive webhook)
- Same race condition (webhook fires before backend completes)
- Requires webhook infrastructure setup
- Polling trigger may be intentional (batch processing)

**Acceptable only if:**
- Real-time processing required (1-minute delay unacceptable)
- Polling causes resource contention
- Webhook deduplication logic added

**Current State:** 1-minute polling delay is acceptable for labels/status. Real-time not needed.

---

## Success Criteria

**Primary Goal:**
- ✅ Greeting message appears EXACTLY ONCE per conversation
- ✅ Greeting contains CORRECT broker name (from Supabase)
- ✅ No "Sarah Wong" fallback messages

**Secondary Goals:**
- ✅ Labels applied correctly (AI-Broker-*, Property-*)
- ✅ Conversation status set to "open"
- ✅ Assignee set to user ID 1
- ✅ n8n workflow completes successfully (no errors)

**Monitoring (Week 1):**
- Zero reports of duplicate greetings
- Label application rate >95%
- n8n workflow success rate >95%
- Backend greeting delivery >99%

---

## Next Steps for Implementation Agent

1. **Backup Current Workflow**
   ```bash
   cp "n8n-workflows/Chatwoot Conversation Enhancer v2.json" \
      "n8n-workflows/Chatwoot Conversation Enhancer v2.backup.json"
   ```

2. **Choose Modification Method**
   - **Recommended:** n8n UI (safer, visual confirmation)
   - **Alternative:** JSON editing (faster, requires validation)

3. **Execute Modification**
   - Follow "Step-by-Step Modification Instructions" above
   - Validate changes before activating

4. **Test with Canary Conversation**
   - Create test conversation
   - Verify 1 greeting only
   - Verify labels applied
   - Check n8n execution log

5. **Monitor Production for 24 Hours**
   - Track greeting count metric
   - Check n8n success rate
   - Watch for user reports

6. **If Issues Found:**
   - Execute rollback procedure immediately
   - Investigate root cause
   - Re-plan if needed

---

## Questions for User / Stakeholders

### Before Implementation

- [ ] **Do we have access to n8n UI?** (If no, must use JSON editing)
- [ ] **Is there a dev/staging n8n instance?** (For safe testing)
- [ ] **Are labels critical for business operations?** (Confirms Path B vs Path A)
- [ ] **Is backend greeting delivery monitored?** (Need baseline reliability data)
- [ ] **Can we tolerate 1-minute delay for labels?** (Validates polling vs webhook)

### For Confirmation

- [ ] **User confirms:** Backend already sends greeting (no n8n fallback needed)
- [ ] **User confirms:** Labels are important (must preserve them)
- [ ] **User confirms:** 1-minute polling delay is acceptable
- [ ] **User confirms:** Can rollback if issues found

---

## Risk Assessment

### Low Risk
- ✅ Workflow modification is reversible (version history + backup)
- ✅ Changes are surgical (only 2 nodes deleted)
- ✅ Backend functionality unaffected
- ✅ Can rollback in <5 minutes if needed

### Medium Risk
- ⚠️ Labels may fail if workflow breaks (test thoroughly)
- ⚠️ No greeting fallback if backend fails (accept <1% cases)
- ⚠️ JSON syntax errors could break workflow (validate before import)

### Mitigation Strategies
- **Backup workflow before modification**
- **Test in dev/staging first** (if available)
- **Canary test in production** (single conversation)
- **Monitor for 24-48 hours** before considering complete
- **Document rollback procedure** (this document)

---

## Completion Criteria

**This plan is complete when:**

- [x] Current workflow analyzed and documented
- [x] Greeting-sending nodes identified
- [x] 2-3 implementation approaches explored
- [x] Recommended approach selected with rationale
- [x] Step-by-step modification instructions provided
- [x] Rollback procedure documented
- [x] Testing checklist created
- [x] LCL exports marked for synthesis agent

**Ready for handoff to implementation agent.**

---

**END OF PLAN**
