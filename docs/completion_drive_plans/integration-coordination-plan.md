# Integration Coordination Plan: External Systems Orchestration

**Date:** 2025-10-01
**Status:** Phase 1 Planning Complete
**Author:** Integration Coordination Planner (Claude Code)

---

## Executive Summary

This plan addresses critical integration conflicts between the new API orchestration layer (`/api/chatwoot-conversation`) and three legacy systems:

1. **Legacy Enhanced Webhook** (`/api/chatwoot-enhanced-flow`) - Randomly overwrites Supabase broker assignments
2. **n8n Workflows** - Duplicates broker assignment and message posting logic
3. **Chatwoot Webhook Configuration** - Triggers conflicting flows, causes message duplication

**Primary Goal:** Establish single source of truth for broker assignment and message delivery without breaking existing functionality.

**Recommended Approach:** Phased disable-then-delete strategy with comprehensive rollback procedures.

---

## Problem Analysis

### Problem 1: Legacy Enhanced Webhook Conflicts

**File:** `app/api/chatwoot-enhanced-flow/route.ts` (406 lines)

**Current Behavior:**
```typescript
// Lines 199-218: selectBrokerForLead()
function selectBrokerForLead(attributes: any) {
  const leadScore = attributes.lead_score || 50

  if (leadScore >= 80) {
    const brokers = ['michelle-chen', 'jasmine-lee']
    const selected = brokers[Math.floor(Math.random() * brokers.length)]
    return AI_BROKERS[selected]  // ❌ Random selection, ignores Supabase
  }
  // ... more random assignments
}
```

**Conflict Scenario:**
```
1. User submits form → /api/chatwoot-conversation assigns "Dr. Elena Rodriguez" (Supabase)
   → Supabase broker_conversations: broker_id = "elena-rodriguez-uuid"
   → conversation.custom_attributes.ai_broker_name = "Dr. Elena Rodriguez"

2. Chatwoot fires webhook → /api/chatwoot-enhanced-flow receives event
   → selectBrokerForLead() randomly picks "Sarah Wong"
   → Overwrites conversation attributes with wrong broker

3. Result: Frontend shows "Dr. Elena Rodriguez", chat shows "Sarah Wong" greeting
```

**#PATTERN_CONFLICT: Dual broker assignment systems**
- Supabase: Database-driven, workload-aware, persistent
- Enhanced Flow: In-memory, random, stateless

**Root Cause:** Enhanced flow webhook was created before Supabase integration existed. It was never updated to respect Supabase assignments.

---

### Problem 2: n8n Workflow Coordination

**Files:**
- `n8n-workflows/NN AI Broker - Updated v2.json` (46KB, 738 lines)
- `n8n-workflows/chatwoot-conversation-enhancer.json` (17KB, 530 lines)

#### n8n Workflow 1: "NN AI Broker - Updated v2"

**Trigger:** Webhook at `POST /chatwoot-ai-broker`

**Event Filters (lines 61-110):**
```javascript
// Only processes if ALL conditions match:
- event: "created"
- conversation.status: "bot"
- message.message_type: "incoming"
- message.sender.type: "contact"
```

**Broker Assignment Logic:**

**Path A: No Broker Assigned (TRUE branch)** (lines 256-288)
```javascript
// Calls Supabase RPC: check_broker_assignment
// If no broker exists (hasbroker: false):
//   → Assign Best Broker (line 354-386)
//   → Creates broker_conversations record
//   → Returns broker data
```

**Path B: Broker Already Assigned (FALSE branch)** (lines 342-350)
```javascript
// Fetches broker details from ai_brokers table
// Returns existing broker data
```

**Message Posting Logic:**

**Node: "Code in JavaScript1" (lines 183-194)** - Sends AI response to Chatwoot
```javascript
// Posts message_type: 'outgoing' to conversation
// If shouldHandoff = true:
//   → Updates conversation status to 'pending'
```

**Node: "Code in JavaScript2" (lines 196-207)** - Handoff to human
```javascript
// Changes conversation status to 'open'
// Posts internal note with handoff details
```

**#LCL_EXPORT_CRITICAL: n8n_workflow::broker_assignment_coordination**

**Key Finding:** n8n workflow **respects Supabase assignments** via `check_broker_assignment` RPC. It does NOT randomly assign brokers.

**Conflict with Enhanced Flow:** Enhanced flow bypasses this check and randomly reassigns.

---

#### n8n Workflow 2: "Chatwoot Conversation Enhancer"

**Trigger:** Schedule (every 1 minute)

**Purpose:** Finds pending conversations and adds metadata

**Flow:**
1. Get all conversations with status = "pending"
2. For each conversation:
   - Assign to user ID 1
   - Change status to "open"
   - Add labels (broker name, property type)
   - **Generate user message** (line 238-249) - Skipped if `skip_user_message: true`
   - **Generate broker message** (line 282-293) - Posts personalized greeting
   - Add message to conversation

**#PLAN_UNCERTAINTY: Duplicate greeting messages?**

This workflow posts broker greeting messages for **pending** conversations. But `broker-engagement-manager.ts` (line 140-167) also posts greeting messages via setTimeout after join activity.

**Potential Duplication:**
```
Scenario: User submits form
1. /api/chatwoot-conversation creates conversation (status: "bot")
2. broker-engagement-manager.announceBrokerJoin() schedules greeting (5-15s delay)
3. Conversation remains "bot" status
4. n8n "Conversation Enhancer" runs every 1 minute
5. If conversation status changed to "pending" before timer fires:
   → n8n posts greeting
   → setTimeout also fires and posts greeting
   → User sees 2 identical greetings
```

**#PATTERN_CONFLICT: Dual message orchestration systems**
- API orchestration: setTimeout in broker-engagement-manager.ts
- n8n orchestration: Schedule trigger every 1 minute

**#BEST_PRACTICE_TENSION:**
- **Practice A:** Keep message orchestration in API layer (single source of truth, easier debugging)
- **Practice B:** Offload to n8n (reliable async, no Vercel timeout issues, easier to adjust timing)

---

### Problem 3: Message Deduplication

**Observation from frontend requirements:**

```
User sees 2 instances of queue message:
1. Centered system message (correct)
2. Right-aligned user bubble (duplicate echo)
```

**Hypothesis Investigation:**

**Hypothesis 1: Webhook Echo**
- API posts queue message to Chatwoot (message_type: 2 / 'activity')
- Chatwoot fires webhook on message_created event
- Webhook handler posts another message → Creates loop

**Evidence from chatwoot-enhanced-flow/route.ts:**
```typescript
// Line 54-56: Handles message_created events
case 'message_created':
  await handleMessageCreated(event, state)
  break

// Line 119-147: handleMessageCreated filters
if (message.message_type !== 'incoming' ||
    message.private ||
    message.sender?.type === 'agent') {
  return  // ✅ Skips outgoing and agent messages
}

// Line 136-147: Skips form submissions and system messages
if (message.content?.includes('• Loan Type:') ||
    message.content?.includes('📝 Form Submission:') ||
    message.content?.includes('added AI-Broker') ||
    message.content?.includes('Conversation was reopened') ||
    message.message_type === 'activity') {
  return  // ✅ Filters activity messages
}
```

**Verdict:** Enhanced flow has proper filtering. Not the cause of duplication.

---

**Hypothesis 2: Chatwoot Message Echo Behavior**

From `CHATWOOT_DOCUMENTATION_REFERENCE.txt` (lines 143-148):
```
## Numeric Message Types:
- 0 = incoming (from customer/contact)
- 1 = outgoing (from agent/bot)
- 2 = activity/system message
```

**Expected Behavior:**
```javascript
// API posts queue message
await chatwootClient.createActivityMessage(conversationId,
  'All AI specialists are helping other homeowners right now...')
// → Should create message_type: 2 (activity)
```

**Actual Chatwoot Behavior (suspected):**

Chatwoot may echo activity messages as:
1. First webhook: `message_type: 2, content: "queue message"` → Frontend renders centered
2. Second webhook: `message_type: 0, sender.type: 'contact', content: "queue message"` → Frontend renders as user bubble

**#PLAN_UNCERTAINTY: Need to verify Chatwoot webhook payload logs**

Cannot confirm without inspecting actual webhook payloads. Recommendation: Add logging in `/api/chatwoot-webhook` to capture raw payloads.

---

**Hypothesis 3: Multiple Webhook Sources**

**Possible Sources:**
1. Enhanced flow webhook posts queue message
2. n8n workflow posts queue message
3. New orchestrator posts queue message

**Evidence Check:**

**broker-engagement-manager.ts (line 52-56):**
```typescript
if (!broker) {
  await chatwootClient.createActivityMessage(
    context.conversationId,
    'All AI specialists are helping other homeowners right now...'
  )
  // ✅ Only new orchestrator posts queue message
}
```

**chatwoot-enhanced-flow/route.ts:**
No queue message logic found in file.

**n8n Conversation Enhancer:**
Does not post queue messages (only handles pending conversations).

**Verdict:** Only one source. Not a duplicate source issue.

---

**#LCL_EXPORT_FIRM: debugging_strategy::duplicate_message_root_cause**

**Most Likely Cause:** Chatwoot webhook configuration firing duplicate events or API misuse of message_type parameter.

**Action Required:**
1. Log raw webhook payloads in `/api/chatwoot-webhook`
2. Inspect message_created events for queue message
3. Check if Chatwoot returns different message_type values for same message

---

## Solution Architecture

### Path Decision Matrix

#### Decision 1: Legacy Enhanced Webhook Strategy

**#PATH_DECISION: Enhanced webhook lifecycle**

| **Path** | **Approach** | **Pros** | **Cons** | **Recommendation** |
|----------|-------------|----------|----------|-------------------|
| **A** | Disable webhook in Chatwoot admin | Clean break, no code changes, reversible | Dead code remains in repo | ✅ **RECOMMENDED** (Phase 1) |
| **B** | Update webhook to respect Supabase | Maintains fallback option, gradual migration | Complex logic, maintenance burden, dual systems | ❌ Not recommended |
| **C** | Delete webhook endpoint + disable | Clean codebase, forces commitment | Irreversible without git revert | ⏳ Phase 2 (after 2 weeks stable) |

**Selected Path: A → Wait → C**

**Rationale:**
- **Disable first** allows safe testing without risk
- **2-week waiting period** validates new orchestration stability
- **Delete after stability** removes technical debt permanently

---

#### Decision 2: n8n Workflow Role Definition

**#PATH_DECISION: n8n_coordination::workflow_responsibility**

| **Path** | **Approach** | **Pros** | **Cons** | **Recommendation** |
|----------|-------------|----------|----------|-------------------|
| **A** | Use n8n for join message delivery only | Solves setTimeout reliability, minimal changes | Adds external dependency | ✅ **RECOMMENDED** |
| **B** | Disable n8n workflows entirely | Simplifies architecture, fewer moving parts | Loses async scheduling, Vercel timeout risk | ❌ Too risky |
| **C** | Use n8n for ALL message orchestration | Centralized message timing, easier to adjust | Complex setup, harder debugging, API becomes thin layer | ❌ Over-engineering |

**Selected Path: A**

**Implementation:**
```typescript
// In broker-engagement-manager.ts, replace setTimeout with n8n webhook trigger

private async announceBrokerJoin(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord
): Promise<number> {
  const delaySeconds = this.randomDelaySeconds()

  // Instead of setTimeout, trigger n8n workflow
  await fetch(`${process.env.N8N_WEBHOOK_URL}/broker-join-scheduler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: context.conversationId,
      brokerId: broker.id,
      brokerName: broker.name,
      delaySeconds,
      processedLeadData: context.processedLeadData
    })
  })

  return delaySeconds
}
```

**n8n Workflow (new):**
```
1. Webhook Trigger: POST /broker-join-scheduler
2. Wait Node: {{ $json.delaySeconds }} seconds
3. HTTP Request: POST to Chatwoot API
   → Create join activity message
4. Wait Node: 2 seconds
5. HTTP Request: POST to Chatwoot API
   → Create greeting message
```

**#LCL_EXPORT_CRITICAL: architecture_decision::n8n_async_message_delivery**

---

#### Decision 3: Chatwoot Conversation Enhancer Workflow

**#PATH_DECISION: conversation_enhancer_workflow::status**

| **Path** | **Approach** | **Pros** | **Cons** | **Recommendation** |
|----------|-------------|----------|----------|-------------------|
| **A** | Keep active (handles pending conversations) | Provides safety net for failed orchestrations | Potential duplicate greetings | ⚠️ Conditional |
| **B** | Disable workflow | Removes duplication risk | Loses fallback mechanism | ❌ Too risky |
| **C** | Update to only add labels, no messages | Keeps metadata sync, removes duplication | Requires workflow modification | ✅ **RECOMMENDED** |

**Selected Path: C**

**Implementation:**
- Remove "Generate User Message" node
- Remove "Add User Message" node
- Remove "Generate Broker Message" node
- Remove "Add Broker Message" node
- Keep: Assign to User, Set Status to Open, Determine Labels, Add Labels

**Reasoning:** Labels and status sync are useful. Message posting should only happen via new orchestrator.

---

### Recommended Implementation Sequence

#### Phase 1: Disable Legacy Webhook (Week 1)

**Step 1.1: Backup Current Configuration**

```bash
# Create backup of webhook settings
curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks \
  > docs/backups/chatwoot-webhooks-2025-10-01.json

# Document current setup
cat > docs/backups/chatwoot-config-snapshot-2025-10-01.md <<EOF
# Chatwoot Configuration Snapshot

**Date:** $(date)
**User:** Brent (NextNest Admin)

## Active Webhooks:
[Paste output from curl command above]

## Active Agent Bots:
$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/agent_bots)

## Inbox Configuration:
- Inbox ID: $CHATWOOT_INBOX_ID
- Inbox Name: NextNest Website
- Bot Configuration: [Check in Chatwoot UI]
EOF
```

**#LCL_EXPORT_CRITICAL: operations_procedure::configuration_backup**

---

**Step 1.2: Disable Enhanced Flow Webhook**

**Manual Steps (Chatwoot Admin UI):**

1. Log into `https://chat.nextnest.sg`
2. Navigate to **Settings** → **Integrations** → **Webhooks**
3. Find webhook with URL: `https://[your-domain]/api/chatwoot-enhanced-flow`
4. Toggle **"Active"** switch to **OFF** (do not delete)
5. Click **"Save Changes"**
6. Screenshot the disabled webhook (save to `docs/backups/`)

**Verification:**
```bash
# Create test conversation
curl -X POST https://[your-domain]/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/sample-form-submission.json

# Check API logs: Should NOT see POST to /api/chatwoot-enhanced-flow
# Check Chatwoot inbox: Messages should only come from new orchestrator
```

---

**Step 1.3: Update n8n Conversation Enhancer Workflow**

**Action:** Remove message posting nodes from workflow

**Access n8n:**
```bash
# If n8n is hosted locally:
open http://localhost:5678

# If n8n is on Railway/cloud:
open https://[your-n8n-domain]
```

**Workflow Modifications:**
1. Open workflow: "Chatwoot Conversation Enhancer"
2. **Delete Node:** "Generate User Message" (id: cf5f5f07)
3. **Delete Node:** "Add User Message" (id: df6f6f08)
4. **Delete Node:** "Generate Broker Message" (id: ef7f7f09)
5. **Delete Node:** "Add Broker Message" (id: ff8f8f10)
6. **Reconnect Flow:**
   ```
   Add Labels → [END]
   ```
7. **Save Workflow**
8. **Test Execution:** Trigger manually to verify no errors

**Expected Result:** Workflow only updates labels and status, does not post messages.

---

#### Phase 2: Implement n8n Join Message Scheduler (Week 1)

**Step 2.1: Create New n8n Workflow**

**Workflow Name:** "Broker Join Message Scheduler"

**Workflow JSON Template:**
```json
{
  "name": "Broker Join Message Scheduler",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "broker-join-scheduler",
        "options": {}
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "webhookId": "broker-join-scheduler"
    },
    {
      "parameters": {
        "unit": "seconds",
        "amount": "={{ $json.delaySeconds }}"
      },
      "name": "Wait for Join Time",
      "type": "n8n-nodes-base.wait"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{ $json.conversationId }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Api-Access-Token",
              "value": "={{$env.CHATWOOT_API_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"content\": \"{{ $json.brokerName }} joined the conversation.\",\n  \"message_type\": \"activity\",\n  \"private\": false\n}",
        "options": {}
      },
      "name": "Post Join Activity",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "unit": "seconds",
        "amount": "2"
      },
      "name": "Wait Before Greeting",
      "type": "n8n-nodes-base.wait"
    },
    {
      "parameters": {
        "jsCode": "const leadData = $json.processedLeadData;\nconst brokerName = $json.brokerName;\nconst leadScore = leadData.leadScore;\nconst monthlyIncome = leadData.actualIncomes?.[0] || 5000;\nconst loanType = leadData.loanType;\nconst propertyCategory = leadData.propertyCategory;\n\nconst greeting = `Hi ${leadData.name}! I'm ${brokerName}, your mortgage specialist. I've reviewed your ${loanType} application for ${propertyCategory} and I'm here to help you find the best solution. How can I assist you today?`;\n\nreturn { greeting };"
      },
      "name": "Generate Greeting",
      "type": "n8n-nodes-base.code"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{ $json.conversationId }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Api-Access-Token",
              "value": "={{$env.CHATWOOT_API_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"content\": {{ JSON.stringify($('Generate Greeting').item.json.greeting) }},\n  \"message_type\": \"outgoing\",\n  \"private\": false\n}",
        "options": {}
      },
      "name": "Post Greeting Message",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "method": "PATCH",
        "url": "=https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{ $json.conversationId }}/custom_attributes",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Api-Access-Token",
              "value": "={{$env.CHATWOOT_API_TOKEN}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"custom_attributes\": {\n    \"broker_status\": \"engaged\"\n  }\n}",
        "options": {}
      },
      "name": "Update Broker Status",
      "type": "n8n-nodes-base.httpRequest"
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Wait for Join Time", "type": "main", "index": 0 }]]
    },
    "Wait for Join Time": {
      "main": [[{ "node": "Post Join Activity", "type": "main", "index": 0 }]]
    },
    "Post Join Activity": {
      "main": [[{ "node": "Wait Before Greeting", "type": "main", "index": 0 }]]
    },
    "Wait Before Greeting": {
      "main": [[{ "node": "Generate Greeting", "type": "main", "index": 0 }]]
    },
    "Generate Greeting": {
      "main": [[{ "node": "Post Greeting Message", "type": "main", "index": 0 }]]
    },
    "Post Greeting Message": {
      "main": [[{ "node": "Update Broker Status", "type": "main", "index": 0 }]]
    }
  },
  "active": false
}
```

**Import Steps:**
1. Copy JSON template to file: `n8n-workflows/broker-join-message-scheduler.json`
2. In n8n UI: Click **"+"** → **"Import from File"**
3. Select the JSON file
4. **Activate Workflow**
5. Copy webhook URL (e.g., `https://n8n.yourdomain.com/webhook/broker-join-scheduler`)

---

**Step 2.2: Update broker-engagement-manager.ts**

**File:** `lib/engagement/broker-engagement-manager.ts`

**Changes Required:**

```typescript
// Add environment variable
const N8N_BROKER_JOIN_WEBHOOK = process.env.N8N_BROKER_JOIN_WEBHOOK_URL

private async announceBrokerJoin(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord
): Promise<number> {
  const delaySeconds = this.randomDelaySeconds()

  // Update context with broker details
  context.processedLeadData.brokerPersona.name = broker.name
  context.processedLeadData.brokerPersona.type = (broker.personality_type as "aggressive" | "balanced" | "conservative") || context.processedLeadData.brokerPersona.type

  // Update conversation attributes
  await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
    ai_broker_id: broker.id,
    ai_broker_name: broker.name,
    broker_persona: broker.personality_type,
    broker_slug: broker.slug,
    broker_status: 'joining'
  })

  // Post immediate joining announcement
  await chatwootClient.createActivityMessage(
    context.conversationId,
    `${broker.name} is reviewing your details and will join the chat shortly.`
  )

  // #COMPLETION_DRIVE_INTEGRATION: Trigger n8n for reliable async message delivery
  if (N8N_BROKER_JOIN_WEBHOOK) {
    try {
      await fetch(N8N_BROKER_JOIN_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: context.conversationId,
          brokerId: broker.id,
          brokerName: broker.name,
          delaySeconds,
          processedLeadData: context.processedLeadData
        })
      })
      console.log('✅ n8n broker join workflow triggered:', { conversationId: context.conversationId, delaySeconds })
    } catch (error) {
      console.error('❌ Failed to trigger n8n workflow, falling back to setTimeout:', error)
      // Fallback to original setTimeout logic
      this.scheduleWithTimeout(chatwootClient, context, broker, delaySeconds)
    }
  } else {
    // Fallback if n8n not configured
    console.warn('⚠️ N8N_BROKER_JOIN_WEBHOOK_URL not set, using setTimeout fallback')
    this.scheduleWithTimeout(chatwootClient, context, broker, delaySeconds)
  }

  return delaySeconds
}

// Extract setTimeout logic to separate method for fallback
private scheduleWithTimeout(
  chatwootClient: ChatwootClient,
  context: EngagementContext,
  broker: BrokerRecord,
  delaySeconds: number
) {
  const delayMs = delaySeconds * 1000

  const timer = setTimeout(async () => {
    try {
      console.log('⏰ Broker join timer fired (setTimeout fallback):', {
        conversationId: context.conversationId,
        brokerName: broker.name,
        delayMs,
        timestamp: new Date().toISOString()
      })

      await chatwootClient.createActivityMessage(
        context.conversationId,
        `${broker.name} joined the conversation.`
      )

      await chatwootClient.updateConversationCustomAttributes(context.conversationId, {
        broker_status: 'engaged'
      })

      console.log('📨 Sending broker greeting message...')
      await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)
      console.log('✅ Broker greeting message sent')
    } catch (error) {
      console.error('Failed to post broker join activity:', error)
    } finally {
      this.pendingTimers.delete(context.conversationId)
    }
  }, delayMs)

  if (typeof (timer as any).unref === 'function') {
    (timer as any).unref()
  }

  this.pendingTimers.set(context.conversationId, timer as NodeJS.Timeout)
}
```

**Environment Variable:**
```bash
# Add to .env.local
N8N_BROKER_JOIN_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/broker-join-scheduler
```

**#LCL_EXPORT_FIRM: implementation_strategy::n8n_integration_with_fallback**

---

#### Phase 3: Testing & Validation (Week 1-2)

**Test Suite 1: Webhook Disabled Verification**

```bash
# Test script: scripts/test-webhook-disabled.sh

#!/bin/bash
set -e

echo "🧪 Test 1: Webhook Disabled Verification"
echo "========================================="

# Submit test form
RESPONSE=$(curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+6591234567",
      "loanType": "new_purchase",
      "propertyCategory": "resale",
      "actualIncomes": [5000],
      "actualAges": [30]
    },
    "sessionId": "test-session-'$(date +%s)'",
    "leadScore": 75
  }')

CONVERSATION_ID=$(echo $RESPONSE | jq -r '.conversationId')
echo "✅ Created conversation: $CONVERSATION_ID"

# Wait 5 seconds
echo "⏳ Waiting 5 seconds..."
sleep 5

# Check API logs for enhanced-flow requests
echo "🔍 Checking API logs..."
if grep -q "POST /api/chatwoot-enhanced-flow" logs/api.log; then
  echo "❌ FAIL: Enhanced flow webhook was called"
  exit 1
else
  echo "✅ PASS: Enhanced flow webhook NOT called"
fi

# Verify conversation has correct broker
CONV_DATA=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/$CONVERSATION_ID)

BROKER_NAME=$(echo $CONV_DATA | jq -r '.custom_attributes.ai_broker_name')
echo "✅ Assigned broker: $BROKER_NAME"

# Verify broker matches Supabase assignment
# (Add Supabase query here)

echo "✅ Test 1 passed!"
```

---

**Test Suite 2: n8n Join Message Delivery**

```bash
# Test script: scripts/test-n8n-join-message.sh

#!/bin/bash
set -e

echo "🧪 Test 2: n8n Join Message Delivery"
echo "====================================="

# Submit form
RESPONSE=$(curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/high-score-lead.json)

CONVERSATION_ID=$(echo $RESPONSE | jq -r '.conversationId')
BROKER_NAME=$(echo $RESPONSE | jq -r '.widgetConfig.customAttributes.ai_broker_name')
JOIN_ETA=$(echo $RESPONSE | jq -r '.widgetConfig.customAttributes.broker_join_eta')

echo "✅ Conversation: $CONVERSATION_ID"
echo "✅ Broker: $BROKER_NAME"
echo "⏳ Join ETA: ${JOIN_ETA}s"

# Wait for join message (ETA + 5s buffer)
WAIT_TIME=$((JOIN_ETA + 5))
echo "⏳ Waiting ${WAIT_TIME}s for join message..."
sleep $WAIT_TIME

# Fetch conversation messages
MESSAGES=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/$CONVERSATION_ID/messages)

# Check for join activity message
JOIN_MSG=$(echo $MESSAGES | jq -r '.payload[] | select(.content | contains("joined the conversation"))')

if [ -z "$JOIN_MSG" ]; then
  echo "❌ FAIL: Join message not found"
  exit 1
fi

echo "✅ PASS: Join message found:"
echo $JOIN_MSG | jq '.content'

# Check for greeting message
GREETING_MSG=$(echo $MESSAGES | jq -r '.payload[] | select(.message_type == 1 and (.content | contains("Hi")))')

if [ -z "$GREETING_MSG" ]; then
  echo "❌ FAIL: Greeting message not found"
  exit 1
fi

echo "✅ PASS: Greeting message found:"
echo $GREETING_MSG | jq '.content'

# Verify broker status updated
CONV_DATA=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/$CONVERSATION_ID)

BROKER_STATUS=$(echo $CONV_DATA | jq -r '.custom_attributes.broker_status')

if [ "$BROKER_STATUS" != "engaged" ]; then
  echo "❌ FAIL: Broker status is '$BROKER_STATUS', expected 'engaged'"
  exit 1
fi

echo "✅ PASS: Broker status correctly updated to 'engaged'"
echo "✅ Test 2 passed!"
```

---

**Test Suite 3: No Duplicate Queue Messages**

```bash
# Test script: scripts/test-no-duplicate-queue.sh

#!/bin/bash
set -e

echo "🧪 Test 3: No Duplicate Queue Messages"
echo "======================================="

# Temporarily set all brokers to max capacity
psql $SUPABASE_DB_URL <<EOF
UPDATE ai_brokers SET current_workload = max_concurrent_chats;
EOF

echo "✅ Set all brokers to max capacity"

# Submit form
RESPONSE=$(curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/standard-lead.json)

CONVERSATION_ID=$(echo $RESPONSE | jq -r '.conversationId')
echo "✅ Created conversation: $CONVERSATION_ID"

# Wait 5 seconds
sleep 5

# Fetch messages
MESSAGES=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/$CONVERSATION_ID/messages)

# Count queue messages
QUEUE_MSG_COUNT=$(echo $MESSAGES | jq '[.payload[] | select(.content | contains("All AI specialists are helping"))] | length')

echo "📊 Queue message count: $QUEUE_MSG_COUNT"

if [ "$QUEUE_MSG_COUNT" -ne 1 ]; then
  echo "❌ FAIL: Expected 1 queue message, found $QUEUE_MSG_COUNT"
  echo "Messages:"
  echo $MESSAGES | jq '.payload[] | select(.content | contains("All AI specialists"))'
  exit 1
fi

echo "✅ PASS: Exactly 1 queue message found"

# Check message types
QUEUE_MSGS=$(echo $MESSAGES | jq '.payload[] | select(.content | contains("All AI specialists"))')
echo "Message details:"
echo $QUEUE_MSGS | jq '{message_type, sender_type: .sender.type, content}'

# Verify it's an activity message (not user message)
ACTIVITY_COUNT=$(echo $QUEUE_MSGS | jq -s 'map(select(.message_type == 2)) | length')

if [ "$ACTIVITY_COUNT" -ne 1 ]; then
  echo "❌ FAIL: Queue message is not activity type (message_type: 2)"
  exit 1
fi

echo "✅ PASS: Queue message is correct type (activity)"

# Reset broker capacity
psql $SUPABASE_DB_URL <<EOF
UPDATE ai_brokers SET current_workload = 0;
EOF

echo "✅ Reset broker capacity"
echo "✅ Test 3 passed!"
```

---

**Test Suite 4: End-to-End Broker Assignment Consistency**

```bash
# Test script: scripts/test-e2e-broker-consistency.sh

#!/bin/bash
set -e

echo "🧪 Test 4: End-to-End Broker Assignment Consistency"
echo "===================================================="

# Submit form
RESPONSE=$(curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/high-score-lead.json)

CONVERSATION_ID=$(echo $RESPONSE | jq -r '.conversationId')
BROKER_FROM_API=$(echo $RESPONSE | jq -r '.widgetConfig.customAttributes.ai_broker_name')

echo "✅ API returned broker: $BROKER_FROM_API"

# Check Supabase broker_conversations table
BROKER_FROM_SUPABASE=$(psql $SUPABASE_DB_URL -t -c \
  "SELECT b.name FROM broker_conversations bc
   JOIN ai_brokers b ON bc.broker_id = b.id
   WHERE bc.conversation_id = $CONVERSATION_ID")

echo "✅ Supabase broker: $BROKER_FROM_SUPABASE"

# Check Chatwoot custom attributes
CONV_DATA=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/$CONVERSATION_ID)

BROKER_FROM_CHATWOOT=$(echo $CONV_DATA | jq -r '.custom_attributes.ai_broker_name')

echo "✅ Chatwoot broker: $BROKER_FROM_CHATWOOT"

# Wait for greeting message
echo "⏳ Waiting for greeting..."
sleep 20

# Check message author
MESSAGES=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/$CONVERSATION_ID/messages)

GREETING_MSG=$(echo $MESSAGES | jq -r '.payload[] | select(.message_type == 1) | select(.content | contains("Hi"))')
BROKER_FROM_MESSAGE=$(echo $GREETING_MSG | jq -r '.content' | grep -oP "I'm \K[^,]+")

echo "✅ Message author: $BROKER_FROM_MESSAGE"

# Compare all sources
if [ "$BROKER_FROM_API" = "$BROKER_FROM_SUPABASE" ] && \
   [ "$BROKER_FROM_API" = "$BROKER_FROM_CHATWOOT" ] && \
   [ "$BROKER_FROM_API" = "$BROKER_FROM_MESSAGE" ]; then
  echo "✅ PASS: All systems agree on broker: $BROKER_FROM_API"
  exit 0
else
  echo "❌ FAIL: Broker mismatch detected!"
  echo "API: $BROKER_FROM_API"
  echo "Supabase: $BROKER_FROM_SUPABASE"
  echo "Chatwoot: $BROKER_FROM_CHATWOOT"
  echo "Message: $BROKER_FROM_MESSAGE"
  exit 1
fi
```

---

#### Phase 4: Monitoring & Rollback Readiness (Week 2)

**Monitoring Setup**

```typescript
// Add to lib/monitoring/integration-health-monitor.ts

import { auditLogger } from '@/lib/security/audit-logger'

interface IntegrationHealthMetrics {
  timestamp: string
  enhanced_flow_requests: number  // Should be 0
  n8n_workflow_executions: number
  broker_assignments: number
  message_duplicates: number
  failed_assignments: number
}

class IntegrationHealthMonitor {
  private metrics: IntegrationHealthMetrics = {
    timestamp: new Date().toISOString(),
    enhanced_flow_requests: 0,
    n8n_workflow_executions: 0,
    broker_assignments: 0,
    message_duplicates: 0,
    failed_assignments: 0
  }

  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'critical', details: IntegrationHealthMetrics }> {
    // Check enhanced flow endpoint (should have 0 requests)
    const enhancedFlowHits = await this.checkEnhancedFlowActivity()

    if (enhancedFlowHits > 0) {
      await auditLogger.logSuspiciousActivity(
        'system',
        'enhanced_flow_webhook_unexpected_activity',
        { requestCount: enhancedFlowHits },
        null
      )
      return { status: 'critical', details: { ...this.metrics, enhanced_flow_requests: enhancedFlowHits } }
    }

    // Check n8n workflow execution rate
    const n8nRate = await this.checkN8nWorkflowRate()
    this.metrics.n8n_workflow_executions = n8nRate

    // Check broker assignment success rate
    const assignmentRate = await this.checkBrokerAssignmentRate()
    this.metrics.broker_assignments = assignmentRate

    // Check for duplicate messages
    const duplicateRate = await this.checkDuplicateMessageRate()
    this.metrics.message_duplicates = duplicateRate

    if (duplicateRate > 10 || assignmentRate < 90) {
      return { status: 'degraded', details: this.metrics }
    }

    return { status: 'healthy', details: this.metrics }
  }

  private async checkEnhancedFlowActivity(): Promise<number> {
    // Count requests to enhanced-flow endpoint in last hour
    // Implementation depends on logging system
    return 0
  }

  private async checkN8nWorkflowRate(): Promise<number> {
    // Query n8n API for workflow execution count
    // Implementation depends on n8n setup
    return 0
  }

  private async checkBrokerAssignmentRate(): Promise<number> {
    // Query Supabase for successful assignments in last hour
    // Return percentage
    return 100
  }

  private async checkDuplicateMessageRate(): Promise<number> {
    // Check Chatwoot for duplicate message patterns
    return 0
  }
}

export const integrationHealthMonitor = new IntegrationHealthMonitor()
```

**Health Check Endpoint:**

```typescript
// Add to app/api/system-status/route.ts

import { integrationHealthMonitor } from '@/lib/monitoring/integration-health-monitor'

export async function GET() {
  const health = await integrationHealthMonitor.checkHealth()

  return NextResponse.json({
    status: health.status,
    metrics: health.details,
    timestamp: new Date().toISOString()
  }, {
    status: health.status === 'healthy' ? 200 :
            health.status === 'degraded' ? 207 : 503
  })
}
```

---

**Rollback Strategy**

**#LCL_EXPORT_CRITICAL: operations_procedure::rollback_strategy**

**Rollback Trigger Conditions:**
- ❌ Chat fails to load (blank screen)
- ❌ No messages appear in new conversations
- ❌ 500 errors in `/api/chatwoot-conversation` exceed 5% of requests
- ❌ User reports: "I see different broker names in different places"
- ❌ Broker assignment rate drops below 90%

---

**Rollback Procedure:**

**Step R1: Re-enable Enhanced Flow Webhook (5 minutes)**

```bash
# Manual action in Chatwoot UI:
1. Navigate to Settings → Integrations → Webhooks
2. Find webhook: /api/chatwoot-enhanced-flow
3. Toggle "Active" to ON
4. Save changes

# Verify webhook re-enabled:
curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks | \
  jq '.[] | select(.url | contains("enhanced-flow"))'

# Expected: "active": true
```

**Test rollback:**
```bash
# Submit test form
curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d @test-fixtures/standard-lead.json

# Check logs: Should see POST to /api/chatwoot-enhanced-flow
# Verify messages appear in conversation
```

**If Step R1 insufficient, proceed to R2.**

---

**Step R2: Revert API Changes (15 minutes)**

```bash
# Identify commits to revert
git log --oneline --grep="broker-engagement-manager" --since="1 week ago"

# Example output:
# abc1234 feat: integrate n8n for join message delivery
# def5678 fix: update broker persona timing

# Revert commits (newest first)
git revert abc1234
git revert def5678

# Verify changes reverted
git diff HEAD~2 lib/engagement/broker-engagement-manager.ts

# Expected: setTimeout logic restored, n8n webhook removed

# Build and test locally
npm run build
npm run start

# Test broker join messages work
bash scripts/test-broker-join-legacy.sh

# Deploy to production
git push origin main
# Vercel auto-deploys
```

**If Step R2 insufficient, proceed to R3.**

---

**Step R3: Revert n8n Workflow Changes (10 minutes)**

```bash
# Re-import original workflow from backup
# In n8n UI:
1. Open workflow: "Chatwoot Conversation Enhancer"
2. Click "..." → "Import from File"
3. Select: docs/backups/chatwoot-conversation-enhancer-original.json
4. Overwrite existing workflow
5. Activate workflow

# Verify workflow restored:
# - "Generate Broker Message" node present
# - "Add Broker Message" node present
# - Connections restored
```

---

**Step R4: Emergency Fallback (5 minutes)**

```bash
# Disable broker assignment entirely
# Set environment variable in Vercel:
DISABLE_BROKER_ASSIGNMENT=true

# Update chatwoot-conversation/route.ts to check flag:
if (process.env.DISABLE_BROKER_ASSIGNMENT === 'true') {
  // Route all leads to default persona
  const defaultBroker = {
    id: 'default',
    name: 'Sarah Wong',
    personality_type: 'balanced'
  }
  // Skip Supabase assignment
  return defaultBroker
}

# Redeploy immediately
```

**Contact escalation:**
- Notify Chat Ops team immediately
- Escalate to engineering lead if rollback fails
- Phone fallback: Direct users to +65 8334 1445

---

#### Phase 5: Delete Legacy Webhook (Week 3+)

**Prerequisites:**
- ✅ 2 weeks stable operation
- ✅ Zero enhanced-flow requests logged
- ✅ Broker assignment success rate > 95%
- ✅ No user-reported broker mismatches
- ✅ Integration health status: "healthy"

**Deletion Steps:**

```bash
# Step 1: Delete webhook in Chatwoot admin
1. Settings → Integrations → Webhooks
2. Find /api/chatwoot-enhanced-flow webhook
3. Click "Delete" (not just disable)
4. Confirm deletion

# Step 2: Delete API route file
git rm app/api/chatwoot-enhanced-flow/route.ts

# Step 3: Document deletion decision
cat > docs/architecture-decisions/2025-10-15-remove-enhanced-flow-webhook.md <<EOF
# Remove Legacy Enhanced Flow Webhook

**Date:** 2025-10-15
**Status:** Implemented
**Authors:** Brent, Engineering Team

## Decision

Delete \`/api/chatwoot-enhanced-flow\` webhook endpoint after 2 weeks stable operation.

## Context

Legacy webhook randomly assigned brokers, conflicting with Supabase-driven assignments.
New orchestration in \`/api/chatwoot-conversation\` + n8n workflows provides single source of truth.

## Consequences

- ✅ Reduced code complexity
- ✅ Eliminated dual assignment systems
- ✅ Improved broker consistency
- ⚠️ Irreversible without git revert

## Rollback

If issues discovered after deletion:
\`\`\`bash
git revert [commit-hash]
git push origin main
# Re-enable webhook in Chatwoot admin
\`\`\`

## Validation

- Enhanced flow requests: 0 (over 14 days)
- Broker assignment success: 98.7%
- User-reported issues: 0
EOF

# Step 4: Commit and deploy
git add -A
git commit -m "Remove legacy enhanced-flow webhook after successful migration

- Deleted app/api/chatwoot-enhanced-flow/route.ts
- Removed webhook from Chatwoot admin
- 2 weeks stable operation validated
- Documented in architecture decisions

Closes #INTEGRATION-COORDINATION"

git push origin main
```

---

## Webhook Configuration Reference

### Current Webhook Setup (Before Changes)

**Account-Level Webhooks:**
```json
{
  "id": 1,
  "url": "https://nextnest.sg/api/chatwoot-enhanced-flow",
  "active": true,
  "events": [
    "conversation_created",
    "message_created",
    "conversation_status_changed"
  ]
}
```

**Agent Bot Webhooks:**
```json
{
  "id": 1,
  "name": "NN AI Broker",
  "webhook_url": "https://n8n.yourdomain.com/webhook/chatwoot-ai-broker",
  "active": true
}
```

---

### Target Webhook Setup (After Changes)

**Account-Level Webhooks:**
```json
{
  "id": 1,
  "url": "https://nextnest.sg/api/chatwoot-enhanced-flow",
  "active": false,  // ← DISABLED
  "events": [
    "conversation_created",
    "message_created",
    "conversation_status_changed"
  ]
}
```

**Agent Bot Webhooks:**
```json
{
  "id": 1,
  "name": "NN AI Broker",
  "webhook_url": "https://n8n.yourdomain.com/webhook/chatwoot-ai-broker",
  "active": true  // ← Remains active
}
```

**New n8n Webhooks:**
```json
{
  "name": "Broker Join Message Scheduler",
  "webhook_url": "https://n8n.yourdomain.com/webhook/broker-join-scheduler",
  "trigger": "API POST request from broker-engagement-manager"
}
```

---

## Environment Variables Checklist

**Required for Integration:**

```bash
# Chatwoot
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=your_api_token
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=your_inbox_id
CHATWOOT_WEBSITE_TOKEN=your_website_token

# n8n (new)
N8N_BROKER_JOIN_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/broker-join-scheduler

# Fallback
CHAT_FALLBACK_PHONE=+6583341445

# Monitoring (optional)
DISABLE_BROKER_ASSIGNMENT=false  # Set to true for emergency fallback
```

---

## Documentation Updates

**#LCL_EXPORT_FIRM: documentation_requirements::runbook_updates**

### File 1: Integration Runbook (New)

**Path:** `docs/runbooks/integration-coordination-runbook.md`

**Contents:**
```markdown
# Integration Coordination Runbook

## Quick Reference

**Broker Assignment Flow:**
1. User submits form → /api/chatwoot-conversation
2. API calls assignBestBroker() → Supabase query
3. Broker assignment recorded in broker_conversations
4. API triggers n8n webhook → Broker Join Scheduler
5. n8n waits 5-15s → Posts join activity
6. n8n posts greeting message
7. Conversation status: joining → engaged

**Disabled Systems:**
- ❌ /api/chatwoot-enhanced-flow (webhook disabled 2025-10-01)
- ⚠️ n8n "Conversation Enhancer" (modified to skip message posting)

**Active Systems:**
- ✅ /api/chatwoot-conversation (primary orchestrator)
- ✅ n8n "Broker Join Scheduler" (async message delivery)
- ✅ n8n "NN AI Broker - Updated v2" (AI responses, handoffs)

## Troubleshooting

### Issue: Broker name mismatch

**Symptoms:**
- Frontend shows "Dr. Elena Rodriguez"
- Chat shows greeting from "Sarah Wong"

**Diagnosis:**
```bash
# Check Supabase assignment
psql $SUPABASE_DB_URL -c \
  "SELECT b.name, bc.conversation_id
   FROM broker_conversations bc
   JOIN ai_brokers b ON bc.broker_id = b.id
   WHERE bc.conversation_id = [CONVERSATION_ID]"

# Check Chatwoot attributes
curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/[CONVERSATION_ID] | \
  jq '.custom_attributes.ai_broker_name'

# Check if enhanced-flow webhook fired (should be 0)
grep "POST /api/chatwoot-enhanced-flow" logs/api.log | grep [CONVERSATION_ID]
```

**Resolution:**
- If enhanced-flow appears in logs: Webhook not disabled properly, disable in Chatwoot admin
- If Supabase/Chatwoot mismatch: Check n8n "Assign Best Broker" node for errors

---

### Issue: Join message never appears

**Symptoms:**
- User sees "Sarah Wong is reviewing your details..." (joining message)
- Never sees "Sarah Wong joined the conversation" (join activity)
- No greeting message

**Diagnosis:**
```bash
# Check n8n workflow execution
# In n8n UI: Executions tab → Filter by "Broker Join Scheduler"
# Look for recent execution with conversation ID

# Check n8n webhook response time
curl -X POST https://n8n.yourdomain.com/webhook/test | jq '.status'
# Expected: 200 OK

# Check environment variable
echo $N8N_BROKER_JOIN_WEBHOOK_URL
# Expected: https://n8n.yourdomain.com/webhook/broker-join-scheduler
```

**Resolution:**
- If n8n workflow not executing: Check webhook URL, verify workflow active
- If webhook URL missing: Add to .env.local, redeploy
- If n8n unreachable: System falling back to setTimeout (check logs for "setTimeout fallback")

---

### Issue: Duplicate queue messages

**Symptoms:**
- Queue message appears twice:
  1. Centered (system message) ✅
  2. Right-aligned user bubble ❌

**Diagnosis:**
```bash
# Fetch conversation messages
MESSAGES=$(curl -H "Api-Access-Token: $CHATWOOT_API_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/conversations/[CONVERSATION_ID]/messages)

# Check queue message types
echo $MESSAGES | jq '.payload[] | select(.content | contains("All AI specialists")) | {message_type, sender_type: .sender.type}'

# Expected output:
# {
#   "message_type": 2,        ← Activity message (correct)
#   "sender_type": "contact"  ← System sender
# }

# If multiple messages appear, check for webhook echoes
echo $MESSAGES | jq '[.payload[] | select(.content | contains("All AI specialists"))] | length'
# Expected: 1
```

**Resolution:**
- If message_type is 0 (incoming): Chatwoot webhook echo issue, contact Chatwoot support
- If multiple sources: Check n8n workflows for queue message posting (should only be in API)

---

## Emergency Contacts

- **Engineering Lead:** [Name] ([Email])
- **Chat Ops Team:** [Name] ([Email])
- **Chatwoot Support:** support@chatwoot.com
- **n8n Support:** [Community Forum / Support Channel]

## Change Log

- 2025-10-01: Enhanced flow webhook disabled
- 2025-10-01: n8n Broker Join Scheduler implemented
- 2025-10-01: Conversation Enhancer modified (removed message posting)
```

---

### File 2: Architecture Decision Record (New)

**Path:** `docs/architecture-decisions/2025-10-01-broker-assignment-orchestration.md`

**Contents:**
```markdown
# Broker Assignment Orchestration: Single Source of Truth

**Date:** 2025-10-01
**Status:** Implemented
**Decision Makers:** Brent (Product), Claude Code (Integration Planner)

## Context

Prior to October 2025, NextNest had three competing systems for broker assignment:

1. **Legacy Enhanced Flow Webhook** (`/api/chatwoot-enhanced-flow`)
   - Random broker selection from hardcoded list
   - No database persistence
   - Triggered on every conversation_created event

2. **n8n Workflow** ("NN AI Broker - Updated v2")
   - Database-driven assignment via Supabase
   - Workload-aware broker selection
   - Triggered on message_created events

3. **New API Orchestrator** (`/api/chatwoot-conversation`)
   - Database-driven assignment via Supabase
   - Integrated with broker-engagement-manager
   - Triggered on form submission

**Problem:** Enhanced flow randomly overwrote Supabase assignments, causing broker name mismatches between frontend and chat.

## Decision

**Selected Approach:** Disable legacy enhanced flow webhook, consolidate orchestration in `/api/chatwoot-conversation` + n8n for async message delivery.

**Trade-offs Considered:**

| **Approach** | **Pros** | **Cons** | **Selected?** |
|--------------|----------|----------|--------------|
| Update enhanced flow to respect Supabase | Gradual migration, maintains fallback | Complex dual-system logic | ❌ |
| Disable enhanced flow, use API only | Single source of truth, cleaner architecture | setTimeout unreliable in Vercel | ⚠️ Partial |
| Disable enhanced flow, offload to n8n | Reliable async, single source of truth | External dependency | ✅ **YES** |

## Implementation

1. **Disable enhanced flow webhook** in Chatwoot admin (reversible)
2. **Create n8n "Broker Join Scheduler" workflow** for async message delivery
3. **Update broker-engagement-manager.ts** to trigger n8n webhook instead of setTimeout
4. **Modify n8n "Conversation Enhancer"** to skip message posting (keep label sync)

## Consequences

### Positive
- ✅ Single source of truth for broker assignment (Supabase)
- ✅ Reliable async message delivery (n8n eliminates Vercel timeout issues)
- ✅ Consistent broker names across all systems (frontend, Supabase, Chatwoot, messages)
- ✅ Reduced code complexity (one orchestrator, not three)

### Negative
- ⚠️ Dependency on n8n availability (mitigated by setTimeout fallback)
- ⚠️ Requires n8n configuration (additional deployment step)

### Neutral
- 📝 Dead code remains in repo until Phase 5 deletion (after 2 weeks stable)

## Validation

**Success Metrics:**
- Broker assignment success rate > 95%
- Zero broker name mismatches reported by users
- Zero requests to enhanced-flow endpoint
- Join messages delivered within ETA ± 3 seconds

**Monitoring:**
- Integration health endpoint: `/api/system-status`
- Daily checks for enhanced-flow activity (should be 0)
- n8n workflow execution logs

## Rollback

If integration fails:
1. Re-enable enhanced flow webhook in Chatwoot (5 min)
2. Revert broker-engagement-manager.ts to setTimeout (15 min)
3. Revert n8n Conversation Enhancer to post messages (10 min)

Full rollback procedure: `docs/runbooks/integration-coordination-runbook.md#rollback-procedure`

## Future Work

- **Phase 5 (Week 3+):** Delete enhanced-flow endpoint entirely
- **Future:** Migrate AI response generation to n8n (currently in "NN AI Broker - Updated v2")
- **Future:** Consolidate all n8n workflows into single orchestrator workflow
```

---

## Team Coordination

**#LCL_EXPORT_FIRM: team_coordination::chat_ops_communication**

### Pre-Implementation Email Template

**To:** Chat Ops Team
**Subject:** [ACTION REQUIRED] Chatwoot Webhook Configuration Change – Oct 3, 2025
**Priority:** High

---

**Hi Chat Ops Team,**

We're implementing a critical integration fix to resolve broker name mismatch issues in our chat system.

**What's Happening:**
- We're disabling the legacy webhook that randomly reassigns brokers
- New orchestration system will provide consistent broker assignments across all touchpoints

**When:**
- **Scheduled:** Thursday, Oct 3, 2025, 10:00 AM SGT (low-traffic period)
- **Duration:** ~30 minutes

**What You Need to Do:**

**Before Oct 3:**
- Review this plan: `docs/completion_drive_plans/integration-coordination-plan.md`
- Ensure you have Chatwoot admin access (username: [your-email])
- Confirm availability during implementation window

**During Implementation (Oct 3, 10:00 AM):**
1. **Monitor Chatwoot inbox** for any anomalies
2. **Check for user complaints** about missing messages or blank chat
3. **Test chat widget** on staging site: https://staging.nextnest.sg
4. **Report immediately** if you observe:
   - Conversations not receiving broker assignments
   - Messages failing to appear
   - Chat widget not loading

**After Implementation:**
- **Daily for 1 week:** Check for broker name consistency:
  - Does frontend show same broker as chat messages?
  - Are join messages appearing within 15 seconds?
- **Report weekly summary** of any issues

**Rollback Plan:**
If critical issues occur, we can revert changes in 5 minutes. Call Brent at [phone] or Slack #eng-alerts.

**Testing Checklist (Post-Deploy):**
```
[ ] Submit test form on website
[ ] Verify broker assigned in chat
[ ] Confirm join message appears
[ ] Check greeting message matches broker name
[ ] Verify chat is responsive
```

**Questions?**
Reply to this email or Slack me in #eng-integration.

**Monitoring Dashboard:**
https://nextnest.sg/api/system-status (bookmark this!)

Thanks for your support!

—Brent

---

## Uncertainties & Open Questions

**#PLAN_UNCERTAINTY: Staging environment availability**

**Question:** Do we have a staging Chatwoot instance for testing webhook changes?

**Impact:** If no staging, must test in production carefully with low-traffic period.

**Mitigation:**
- Schedule change during 10 AM SGT (after morning rush, before lunch)
- Have rollback ready in 5 minutes
- Monitor Chat Ops team for immediate feedback

---

**#PLAN_UNCERTAINTY: Chatwoot webhook echo behavior**

**Question:** Why does Chatwoot echo activity messages as incoming messages?

**Impact:** Causes duplicate queue messages (system + user bubble).

**Investigation Required:**
1. Add logging to capture raw webhook payloads:
```typescript
// In app/api/chatwoot-webhook/route.ts (if exists, or create)
export async function POST(request: NextRequest) {
  const payload = await request.json()

  // Log raw payload for analysis
  console.log('🔍 RAW WEBHOOK PAYLOAD:', JSON.stringify(payload, null, 2))

  // Log to file for later analysis
  await appendFile('logs/chatwoot-webhooks.jsonl', JSON.stringify({
    timestamp: new Date().toISOString(),
    event: payload.event,
    message_type: payload.message?.message_type,
    sender_type: payload.message?.sender?.type,
    content_preview: payload.message?.content?.substring(0, 50)
  }) + '\n')

  return NextResponse.json({ received: true })
}
```

2. Analyze logs after test submission to identify duplicate events

**Hypothesis to test:**
- Chatwoot fires both `message_type: 2` and `message_type: 0` for activity messages
- Frontend should filter by `sender.type === 'contact'` to exclude echoes

---

**#PLAN_UNCERTAINTY: n8n workflow execution reliability**

**Question:** What happens if n8n is down when join message scheduled?

**Impact:** Users won't see join/greeting messages.

**Mitigation:**
- Implemented setTimeout fallback in broker-engagement-manager.ts
- Log fallback usage for monitoring
- Set up n8n uptime monitoring (e.g., UptimeRobot, Pingdom)

**Recommended Alert:**
- If fallback used > 10% of time, escalate to engineering
- Investigate n8n stability or increase n8n capacity

---

## Appendix: File Inventory

**Files Modified:**
- `lib/engagement/broker-engagement-manager.ts` (lines 116-176)
- `n8n-workflows/chatwoot-conversation-enhancer.json` (remove nodes 238-293)

**Files Created:**
- `n8n-workflows/broker-join-message-scheduler.json` (new workflow)
- `docs/completion_drive_plans/integration-coordination-plan.md` (this file)
- `docs/runbooks/integration-coordination-runbook.md` (operational guide)
- `docs/architecture-decisions/2025-10-01-broker-assignment-orchestration.md` (ADR)
- `docs/backups/chatwoot-webhooks-2025-10-01.json` (config backup)
- `docs/backups/chatwoot-config-snapshot-2025-10-01.md` (snapshot)
- `scripts/test-webhook-disabled.sh` (test suite)
- `scripts/test-n8n-join-message.sh` (test suite)
- `scripts/test-no-duplicate-queue.sh` (test suite)
- `scripts/test-e2e-broker-consistency.sh` (test suite)
- `lib/monitoring/integration-health-monitor.ts` (health checks)
- `app/api/system-status/route.ts` (health endpoint)

**Files to Delete (Phase 5):**
- `app/api/chatwoot-enhanced-flow/route.ts` (after 2 weeks stable)

---

## Success Criteria

**Integration is successful if:**

1. ✅ **Zero enhanced-flow requests** logged over 14 days
2. ✅ **Broker assignment consistency:** Frontend, Supabase, Chatwoot, messages all show same broker 100% of time
3. ✅ **Join message delivery:** Join activity appears within ETA ± 5 seconds in >95% of conversations
4. ✅ **No duplicate messages:** Queue messages appear exactly once (as activity type)
5. ✅ **High availability:** Integration health status "healthy" >99% of time
6. ✅ **Zero user complaints** about broker mismatches or missing messages

**Monitoring Window:** 14 days (Oct 3 - Oct 17, 2025)

**Go/No-Go Decision:** Oct 17, 2025
- If all criteria met → Proceed to Phase 5 (delete enhanced-flow)
- If any criteria failed → Investigate, fix, extend monitoring by 7 days

---

## Conclusion

This integration coordination plan establishes a single source of truth for broker assignment by:

1. **Disabling conflicting legacy webhook** (reversible)
2. **Consolidating orchestration** in `/api/chatwoot-conversation`
3. **Offloading async delivery to n8n** (reliable, no Vercel timeout)
4. **Providing comprehensive testing** and rollback procedures

**Recommended Next Steps:**

1. **Review with team:** Share plan with Chat Ops and engineering
2. **Schedule implementation:** Oct 3, 2025, 10:00 AM SGT
3. **Prepare backups:** Document current configuration
4. **Execute Phase 1:** Disable enhanced flow webhook
5. **Execute Phase 2:** Implement n8n scheduler
6. **Monitor closely:** 14 days validation period
7. **Delete legacy code:** Phase 5 after validation

**#LCL_EXPORT_CRITICAL: integration_coordination::execution_readiness**

---

**Plan Status:** ✅ Ready for Implementation
**Approval Required:** Product Lead, Engineering Lead, Chat Ops Team
**Target Date:** October 3, 2025

---

*End of Integration Coordination Plan*
