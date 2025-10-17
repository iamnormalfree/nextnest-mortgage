---
title: canned-response-root-cause
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-12
---

# Root Cause: Canned Response "I can help you with your mortgage needs."

## The Real Flow

1. **User sends message** in Chatwoot
2. **Chatwoot Agent Bot** (NextNest AI Broker) receives the message
3. **Bot webhook** is configured to: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker` (n8n)
4. **n8n workflow starts** but the IF node fails because:
   - It's checking for `$json.body.message.message_type === "incoming"`
   - But receiving bot messages with `message_type: 1` (outgoing)
5. **n8n workflow ends** without a proper response path
6. **Chatwoot expects a response** from the bot webhook
7. **Default/fallback response** is sent somehow

## The Actual Problem

The Chatwoot Agent Bot is configured to call n8n directly, NOT our NextNest webhook handler. This means:
- Our NextNest `/api/chatwoot-webhook` is NOT being called for initial messages
- n8n is receiving messages directly from Chatwoot
- n8n is failing to process them correctly
- A default response is being sent (either by n8n or Chatwoot)

## Evidence

1. **Bot Configuration:**
   ```json
   {
     "name": "NextNest AI Broker",
     "outgoing_url": "https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker"
   }
   ```
   This points directly to n8n, not NextNest.

2. **n8n Receives Bot Messages:**
   The payload shows `message_type: "outgoing"` from sender Brent (the bot), meaning n8n is receiving its own bot messages, creating a loop.

3. **No Bot Connection to Inbox:**
   The check shows: "❌ No bot connected to this inbox!"

## The Solution

### Option 1: Fix the Bot Webhook URL (Recommended)
Change the Chatwoot bot webhook URL from n8n to NextNest:
```
FROM: https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker
TO: https://e07cec3fd516.ngrok-free.app/api/chatwoot-webhook
```

This way:
- Chatwoot → NextNest → n8n (with proper filtering)
- NextNest can filter out bot messages
- NextNest can handle the response properly

### Option 2: Fix n8n Workflow
1. Add proper message type checking
2. Add a FALSE branch that does nothing (no response)
3. Ensure only user messages trigger AI processing
4. Remove all fallback/default responses

### Option 3: Connect Bot to Inbox
The bot exists but isn't connected to the inbox. In Chatwoot:
1. Go to Settings → Inboxes → NextNest AI Broker
2. In Bot Configuration section
3. Select "NextNest AI Broker" from dropdown
4. Save

## Why the Canned Response?

The message "I can help you with your mortgage needs." is likely:
1. **n8n Fallback**: In the "Check Handoff Triggers" node when AI response extraction fails
2. **Chatwoot Default**: When bot webhook doesn't return a proper response format
3. **Test Data**: Hardcoded during testing and not removed

## Immediate Fix

1. **Update Bot Webhook URL** to point to NextNest instead of n8n
2. **Connect Bot to Inbox** in Chatwoot settings
3. **Test with user message** (not bot message)

## Verification Steps

1. Send a user message (not bot message)
2. Check NextNest logs for webhook reception
3. Verify n8n receives filtered user message only
4. Confirm AI-generated response (not canned)