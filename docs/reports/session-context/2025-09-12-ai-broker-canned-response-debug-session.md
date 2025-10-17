---
title: ai-broker-canned-response-debug-session
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-12
---

# AI Broker Canned Response Debug Session - September 12, 2025

## Problem Statement
The AI broker chat is returning a canned response "I can help you with your mortgage needs." instead of AI-generated responses.

## Root Cause Identified
The canned response is being sent by the **n8n workflow**, not by NextNest code. Even though the IF node fails and there's no FALSE branch, n8n is somehow sending this default message to Chatwoot.

## Current Configuration

### Chatwoot Bot Setup
- **Bot Name**: NextNest AI Broker
- **Bot ID**: 1
- **Webhook URL**: Changed from n8n direct to NextNest: `https://e07cec3fd516.ngrok-free.app/api/chatwoot-webhook`
- **Bot Connected to Inbox**: Yes (confirmed connected)
- **No automation rules** configured in Chatwoot

### Message Flow
1. User sends message in Chatwoot
2. Chatwoot bot webhook calls NextNest (`/api/chatwoot-webhook`)
3. NextNest filters and forwards to n8n (`https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker`)
4. n8n workflow starts but IF node fails
5. **n8n sends canned response to Chatwoot** (despite IF node failure)
6. Chatwoot sends webhook back to NextNest for the outgoing message
7. NextNest correctly skips the outgoing message

## Evidence from Logs

### Webhook Processing Pattern
```
🚀 Forwarding to n8n AI Broker workflow
✅ n8n processed successfully: { message: 'Workflow was started' }
// Then immediately after:
🔔 Chatwoot webhook received: {
  content: "I can help you with your mortgage needs.",
  messageType: 'outgoing',
  senderType: 'user',
  sender: { name: "Brent" }
}
```

### Key Findings
1. **Message Type Issues**: Chatwoot sends `message_type` nested under `message` object, not at root level
2. **n8n IF Node Failing**: Checking wrong paths (`$json.body.message.message_type` vs actual structure)
3. **No FALSE Branch**: IF node has no FALSE branch defined in workflow
4. **Canned Response Source**: Must be from n8n error handling or default response mechanism

## Code Changes Made

### 1. Fixed Webhook Handler Message Type Detection
```javascript
// Before:
const messageType = event.message_type;

// After:
const messageType = event.message?.message_type ?? event.message_type;
```

### 2. Updated Logging for Better Debugging
Added comprehensive logging to show actual vs expected message types and paths.

### 3. Bot Webhook URL Updated
Changed from direct n8n to NextNest for better filtering:
- From: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker`
- To: `https://e07cec3fd516.ngrok-free.app/api/chatwoot-webhook`

## n8n Workflow Issues

### Current n8n Workflow Structure
```
Webhook → IF (fails) → No FALSE branch → Workflow ends
         ↓
    (TRUE would go to Extract Customer Profile → ... → OpenAI)
```

### The Mystery
Despite IF node failing and no FALSE branch:
- n8n returns `{ message: 'Workflow was started' }`
- But somehow sends "I can help you with your mortgage needs." to Chatwoot

### Possible n8n Causes
1. **Error Workflow**: n8n might have a global error workflow sending default responses
2. **Webhook Node Settings**: "Always Output Data" or error handling in webhook node
3. **Hidden Node**: A node that always executes regardless of IF result
4. **n8n Bot Integration**: n8n might have its own Chatwoot integration sending defaults

## What We Ruled Out

### ❌ Not from NextNest Code
- Webhook handler doesn't send messages when n8n succeeds
- No hardcoded response in our codebase (except n8n workflow JSON)
- LocalProcessing only runs when n8n fails (not when it succeeds)

### ❌ Not from Chatwoot
- No automation rules configured
- No default bot responses in Chatwoot settings
- Bot exists but only forwards to webhook

### ❌ Not from IF Node TRUE Branch
- TRUE branch never executes (IF conditions fail)
- Check Handoff Triggers node is deep in TRUE branch, never reached

## Next Steps to Fix

### In n8n:
1. **Check Error Workflows**: Look for any error handling workflows
2. **Check Webhook Node Settings**: 
   - Response Mode
   - Error Output
   - Always Output Data setting
3. **Add Debug Node**: Right after webhook to log what's received
4. **Fix IF Node Conditions**: Update to match actual payload structure
5. **Add FALSE Branch**: Handle non-matching messages properly
6. **Remove Any Default Responses**: Search entire n8n instance for the canned text

### In NextNest (Already Done):
- ✅ Fixed message type detection
- ✅ Updated bot webhook URL
- ✅ Added comprehensive logging
- ✅ Proper filtering of incoming vs outgoing messages

## Test Results

### Current Behavior:
1. User message → NextNest → n8n → IF fails
2. n8n sends canned response to Chatwoot
3. Response appears in conversation
4. No AI-generated content

### Expected Behavior:
1. User message → NextNest → n8n → IF succeeds
2. n8n processes through OpenAI
3. AI response sent to Chatwoot
4. Contextual response appears

## Key Files Modified

1. `app/api/chatwoot-webhook/route.ts` - Fixed message type detection
2. `Session_Context/n8n-webhook-debugging-session.md` - Previous debug session
3. `Session_Context/n8n-workflow-fix-guide.md` - n8n configuration guide
4. `Session_Context/canned-response-root-cause.md` - Root cause analysis
5. `scripts/test-complete-flow.js` - Test script for flow validation

## Environment Details

- **Development Server**: localhost:3004
- **ngrok Tunnel**: https://e07cec3fd516.ngrok-free.app (active)
- **n8n Webhook**: https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker
- **Chatwoot**: https://chat.nextnest.sg
- **Conversation ID**: 44 (test conversation)

## Conclusion

The issue is definitively in the n8n workflow configuration. Despite the IF node failing and having no FALSE branch, n8n is sending the canned response "I can help you with your mortgage needs." to Chatwoot. This suggests either:

1. n8n has error handling that sends default responses
2. There's a hidden workflow or node sending this
3. The n8n-Chatwoot integration has a default fallback

The fix requires investigating the n8n instance configuration, not the NextNest code.