# n8n Workflow Coordination with New Broker Orchestration

## Overview

This document defines the coordination strategy between n8n workflows and the new Next.js broker orchestration implemented in the broker-chat alignment feature.

**Key Principle**: Single source of truth for broker assignments is **Supabase `ai_brokers` table**, managed by Next.js backend.

## Current n8n Workflows

### 1. NN AI Broker - Updated v2

**File**: `n8n-workflows/NN AI Broker - Updated v2.json`

**Status**: ✅ KEEP ACTIVE

**Purpose**:
- AI conversation handling and broker handoffs
- Responds to user messages with personalized AI replies
- Handles broker-to-human escalations

**Integration with New Orchestration**:
- ✅ Respects Supabase broker assignments via `check_broker_assignment` RPC
- ✅ Does NOT reassign brokers (consumes assignments only)
- ✅ Compatible with new broker-engagement-manager.ts

**No Changes Required**: Workflow is already compatible with new orchestration.

**Verification**:
```bash
# Test that n8n respects Supabase assignments
node scripts/test-n8n-broker-flow.js
```

---

### 2. Chatwoot Conversation Enhancer

**Files**:
- `n8n-workflows/chatwoot-conversation-enhancer.json`
- `n8n-workflows/Chatwoot Conversation Enhancer v2.json`

**Status**: ⚠️ REVIEW RECOMMENDED

**Purpose**:
- Enhances conversations with labels and metadata
- May add conversation context and categorization

**Potential Issue**:
This workflow may post duplicate broker greeting messages or interfere with the new message sequence.

**Recommended Action**:

1. **Audit Workflow** (Manual Review Required):
   - Open workflow in n8n admin UI
   - Search for any message posting nodes (Chatwoot → Send Message)
   - Check if workflow posts broker greetings or join messages

2. **If Message Posting Found**:
   - **Option A** (Recommended): Remove message posting nodes, keep metadata enhancement
   - **Option B**: Disable workflow temporarily, monitor for issues
   - **Option C**: Add deduplication logic to prevent duplicate messages

3. **Coordination with Backend**:
   - Ensure workflow runs AFTER backend broker-engagement-manager completes
   - Use Chatwoot webhook event timestamps to sequence correctly

**Audit Checklist**:
- [ ] Opened workflow in n8n admin UI
- [ ] Checked for Chatwoot "Send Message" nodes
- [ ] Verified no broker greeting messages posted
- [ ] Confirmed no "joined the conversation" activity messages
- [ ] Tested workflow with new orchestration (no conflicts)

---

### 3. NN AI Broker - Updated (Legacy)

**File**: `n8n-workflows/NN AI Broker - Updated.json`

**Status**: ⚠️ LEGACY VERSION

**Purpose**: Previous version of AI broker workflow

**Recommended Action**:
- Verify not active in n8n production instance
- If active, migrate to "NN AI Broker - Updated v2"
- Archive workflow file if replaced

---

### 4. NN-AI-Broker-FIXED

**File**: `n8n-workflows/NN-AI-Broker-FIXED.json`

**Status**: ⚠️ UNKNOWN VERSION

**Recommended Action**:
- Verify if active in n8n production
- Compare with "NN AI Broker - Updated v2" to identify differences
- Archive if superseded by v2

---

## Coordination Strategy

### Broker Assignment Ownership

**Single Source of Truth**: Supabase `ai_brokers` table

**Owner**: `/app/api/chatwoot-conversation/route.ts` (Next.js backend)

**Responsibilities**:
- Select broker based on lead profile and workload
- Update Supabase `ai_brokers.current_load` field
- Store broker assignment in Chatwoot customAttributes
- Return broker to frontend in API response

**n8n Role**:
- **Consume** broker assignments (read from Chatwoot customAttributes)
- **Do NOT reassign** brokers (violates single source of truth)

---

### Message Posting Ownership

**Owner**: `lib/engagement/broker-engagement-manager.ts` (Next.js backend)

**Message Sequence**:
1. "reviewing your details" activity message (immediate)
2. Synchronous wait 2000ms (Railway-safe)
3. "joined the conversation" activity message
4. Personalized greeting from assigned broker

**n8n Role**:
- Post **AI response messages** only (replies to user questions)
- Do NOT post broker join messages
- Do NOT post broker greeting messages
- Do NOT post queue messages

**Deduplication**:
- Frontend (`/api/chat/messages`) filters duplicate queue messages
- n8n should respect this deduplication by not posting queue messages

---

### Event Sequencing

**Chatwoot Webhook Events**:

1. `conversation_created` → Triggers Next.js `/api/chatwoot-conversation`
2. Backend assigns broker, posts messages
3. `message_created` events → Can trigger n8n AI responses
4. n8n workflows receive events AFTER backend completes

**Coordination Mechanism**:
- Use Chatwoot customAttributes to signal orchestration state
- Example: `ai_broker_assigned: true` indicates backend completed
- n8n checks this flag before processing events

**Example n8n Logic**:
```javascript
// In n8n workflow, check if backend completed
const customAttributes = $input.item.json.conversation.custom_attributes;

if (!customAttributes.ai_broker_assigned) {
  // Backend hasn't assigned broker yet, skip processing
  return [];
}

// Safe to proceed, broker is assigned
const assignedBroker = customAttributes.ai_broker_name;
// Use assignedBroker for AI responses...
```

---

## Integration Testing

### Test 1: Verify n8n Respects Supabase Assignments

```bash
# Create conversation, check n8n doesn't reassign
node scripts/test-n8n-broker-coordination.js
```

Expected behavior:
- Backend assigns broker (e.g., "Sarah Wong")
- n8n workflow receives `message_created` event
- n8n uses assigned broker, does NOT reassign
- Broker name consistent across all messages

### Test 2: Check for Duplicate Messages

```bash
# Test that n8n doesn't post duplicate greetings
node scripts/test-duplicate-message-check.js
```

Expected behavior:
- Backend posts: reviewing → joined → greeting
- n8n does NOT post additional join/greeting messages
- Only ONE greeting from assigned broker
- No duplicate "All AI specialists are helping" messages

### Test 3: End-to-End Flow

```bash
# Test complete flow with n8n active
npm run test:complete-broker-flow
```

Expected behavior:
1. User submits form → Backend assigns broker
2. Messages appear: reviewing → joined → greeting
3. User asks question → n8n responds with AI reply
4. Broker name consistent throughout conversation

---

## Future Migration Path

### Scenario: Synchronous Wait Becomes Problematic

If the synchronous 2s wait in backend causes API latency issues:

**Current Latency**: ~2-4s (2s wait + Chatwoot API calls)
**Problematic Threshold**: p95 > 5s for 3 consecutive days

**Migration Option**: Move Join Message Posting to n8n

**Steps**:

1. **Create New n8n Workflow**: "Broker Join Scheduler"
   - Trigger: HTTP webhook from `/api/chatwoot-conversation`
   - Input: `{ conversationId, brokerId, brokerName }`
   - Logic:
     - Wait 5-15 seconds (variable delay for naturalness)
     - Post "joined the conversation" activity message
     - Post personalized greeting from assigned broker

2. **Update Backend** (`/api/chatwoot-conversation/route.ts`):
   ```typescript
   // Remove synchronous wait
   // await brokerEngagementManager.handleNewConversation(...)

   // Instead, trigger n8n workflow
   await fetch(process.env.N8N_BROKER_JOIN_WEBHOOK_URL, {
     method: 'POST',
     body: JSON.stringify({
       conversationId,
       brokerId: processedLeadData.brokerPersona.id,
       brokerName: processedLeadData.brokerPersona.name
     })
   });
   ```

3. **Monitor Latency Improvement**:
   - Expected: API latency drops to <1s
   - Trade-off: Join message delay increases to 5-15s

4. **Rollback Plan**:
   - Keep `broker-engagement-manager.ts` code in repository
   - Can revert backend to synchronous flow if issues occur

**Estimated Effort**: 2-3 days

**Trigger Condition**: p95 API latency > 5s for 3 consecutive days

**Priority**: Low (current synchronous flow is working)

---

## Troubleshooting

### Issue: n8n Reassigning Brokers

**Symptoms**:
- Broker name in header differs from greeting message
- Supabase `ai_brokers` shows different broker than Chatwoot

**Diagnosis**:
```bash
# Check n8n workflow for broker selection logic
# Look for: selectBrokerForLead(), Math.random(), broker assignment
```

**Solution**:
1. Review n8n workflow nodes
2. Remove any broker selection/assignment logic
3. Update workflow to read `ai_broker_name` from customAttributes
4. Redeploy workflow in n8n admin

### Issue: Duplicate Join Messages

**Symptoms**:
- Multiple "joined the conversation" messages in same conversation
- Multiple broker greetings from different brokers

**Diagnosis**:
```bash
# Check if n8n posting join messages
node scripts/test-duplicate-message-check.js
```

**Solution**:
1. Audit n8n "Chatwoot Conversation Enhancer" workflow
2. Remove message posting nodes (keep metadata enhancement only)
3. Verify backend broker-engagement-manager is sole message poster

### Issue: n8n Not Responding to User Messages

**Symptoms**:
- User asks question, no AI reply from broker
- n8n workflow logs show errors

**Diagnosis**:
```bash
# Check n8n workflow execution logs
# Look for: webhook reception, broker lookup, message posting
```

**Solution**:
1. Verify n8n has access to Chatwoot customAttributes
2. Check `ai_broker_assigned` flag is set to `true`
3. Confirm n8n can read `ai_broker_name` from conversation
4. Test n8n webhook reception with manual trigger

---

## Manual n8n Workflow Audit

**Required Before Production**:

1. **Access n8n Admin UI**:
   - URL: [n8n instance URL needed] #PLAN_UNCERTAINTY: Need n8n admin URL
   - Credentials: [n8n admin credentials needed] #PLAN_UNCERTAINTY: Need admin credentials

2. **For Each Active Workflow**:
   - [ ] Identify all Chatwoot "Send Message" nodes
   - [ ] Document what messages each node sends
   - [ ] Check if messages conflict with backend broker-engagement-manager
   - [ ] Verify workflow reads `ai_broker_name` from customAttributes
   - [ ] Confirm no random broker selection logic exists

3. **Document Findings**:
   - Create spreadsheet: Workflow Name | Message Type | Conflict? | Action Required
   - Share with ops team for review

4. **Coordinate Changes**:
   - Schedule maintenance window for workflow updates
   - Test workflow changes in n8n staging environment first
   - Deploy to production with rollback plan

---

## Contact

- **n8n Admin**: [contact info needed] #PLAN_UNCERTAINTY: Need n8n admin contact
- **Workflow Owner**: [contact info needed] #PLAN_UNCERTAINTY: Need workflow owner contact
- **Integration Escalation**: See `/docs/runbooks/chatwoot-webhook-disable-procedure.md`

---

## Related Documentation

- **Webhook Disable Procedure**: `/docs/runbooks/chatwoot-webhook-disable-procedure.md`
- **Main Runbook**: `/docs/runbooks/PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK.md`
- **New Orchestration**: `/app/api/chatwoot-conversation/route.ts`
- **Broker Manager**: `/lib/engagement/broker-engagement-manager.ts`
- **Legacy Webhook**: `/_archived/api/chatwoot-enhanced-flow/route.ts`

---

## Changelog

- **2025-10-01**: Initial coordination strategy documented for broker-chat alignment
- **2025-10-01**: Identified "Chatwoot Conversation Enhancer" for audit
- **2025-10-01**: Confirmed "NN AI Broker - Updated v2" compatibility
