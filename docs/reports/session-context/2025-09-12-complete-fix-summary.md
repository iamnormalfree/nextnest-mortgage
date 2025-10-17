---
title: complete-fix-summary
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-12
---

# Complete Fix Summary - AI Broker Chat Issue

## Root Cause Analysis

### The Core Problem
1. **User messages ARE being sent to n8n** (webhook triggers successfully)
2. **n8n workflow executes** but the IF node fails
3. **The canned response** "I can help you with your mortgage needs" comes from the fallback in the "Check Handoff Triggers" node
4. **No user message content** appears in the n8n execution because the IF node fails before reaching the AI processing

## The Missing Pieces

### 1. Webhook Payload Issue
The Chatwoot webhook sends different structures for incoming vs outgoing messages:
- **Incoming (user) messages**: `message_type: 0` 
- **Outgoing (bot) messages**: `message_type: 1`

Your webhook handler is now fixed to check both:
```javascript
const messageType = event.message?.message_type ?? event.message_type;
```

### 2. n8n Workflow Issues

#### Current Flow (BROKEN):
```
Webhook → IF (fails) → Nothing happens → Fallback response
```

#### What SHOULD happen:
```
Webhook → IF (succeeds) → Extract Profile → Get Broker → Process History → OpenAI → Send Response
```

### 3. The Critical n8n Fix Needed

The IF node needs BOTH paths configured:

**TRUE Branch** (current setup - for incoming messages):
- Goes to "Extract Customer Profile" ✅

**FALSE Branch** (MISSING - needs to be added):
- Should log the message for context
- Should skip processing but not send canned response
- Should return acknowledgment without bot response

## Immediate Actions Needed

### 1. In n8n Workflow:

Add a FALSE branch from the IF node that:
```javascript
// Code node for FALSE branch
const event = $input.first().json.body;
console.log('Non-incoming message received:', {
  type: event.message_type,
  content: event.content,
  sender: event.sender
});

// Log for context but don't process
return {
  status: 'skipped',
  reason: 'Not an incoming user message',
  messageType: event.message_type,
  logged: true
};
```

### 2. Fix the "Check Handoff Triggers" Node

Line 48 has the fallback that causes the canned response:
```javascript
// CURRENT (BAD):
response = "I can help you with your mortgage needs.";

// SHOULD BE:
if (!response && aiData) {
  // Only use fallback if we actually tried to get AI response
  response = "I can help you with your mortgage needs.";
} else if (!response) {
  // If no AI data, don't send any response
  return {
    status: 'no_response_needed',
    reason: 'No AI processing occurred'
  };
}
```

### 3. Debug Why IF Node Fails

Add a Code node RIGHT AFTER the Webhook to debug:
```javascript
const body = $input.first().json.body;
console.log('=== WEBHOOK DEBUG ===');
console.log('Event:', body.event);
console.log('Message Type:', body.message?.message_type);
console.log('Sender Type:', body.message?.sender?.type);
console.log('Content:', body.content || body.message?.content);
console.log('Full body structure:', JSON.stringify(body, null, 2));

// Check what the IF node will see
const willPass = 
  body.event?.includes('created') &&
  body.conversation?.status === 'bot' &&
  body.message?.message_type === 'incoming' &&
  body.message?.sender?.type === 'contact';

console.log('Will IF node pass?', willPass);

return $input.first();
```

## The Real Issue

Based on the webhook data you showed, the incoming webhook has:
- `message_type: 1` (outgoing bot message)
- Content: "I can help you with your mortgage needs"

This means **n8n is receiving webhooks for the BOT's OWN MESSAGES**, not user messages!

## The Solution

### Option 1: Fix Chatwoot Webhook Configuration
Check your Chatwoot webhook settings - it might be configured to send ALL messages instead of just incoming user messages.

### Option 2: Better Filtering in NextNest
The webhook handler should be filtering better. Update the check:

```javascript
// In app/api/chatwoot-webhook/route.ts
const messageType = event.message?.message_type ?? event.message_type;
const senderType = event.message?.sender?.type ?? event.sender?.type;

// Only forward INCOMING messages from CONTACTS
if (messageType !== 0 && messageType !== 'incoming') {
  console.log('Skipping non-incoming message:', messageType);
  return NextResponse.json({ received: true, skipped: 'not incoming' });
}

if (senderType !== 'contact') {
  console.log('Skipping non-contact message:', senderType);
  return NextResponse.json({ received: true, skipped: 'not from contact' });
}
```

### Option 3: Create Separate Webhook for User Messages
Set up a dedicated webhook in Chatwoot that ONLY fires for incoming user messages:
- Event: `message_created`
- Filter: `message_type = 0` (incoming only)
- Filter: `sender_type = contact`

## Testing the Fix

1. Send a message from the user
2. Check server logs for "Checking conditions"
3. Verify `isIncomingMessage: true`
4. Check n8n execution history
5. Verify IF node takes TRUE branch
6. Check OpenAI node receives data

## Summary

The main issue is that **user messages aren't being properly identified and forwarded to n8n**, while **bot messages are being sent to n8n** causing the IF node to correctly reject them. The fix requires:

1. ✅ Better message type detection (already fixed in webhook handler)
2. ⚠️ Proper FALSE branch handling in n8n (needs to be added)
3. ⚠️ Remove fallback canned response (needs to be fixed in n8n)
4. ⚠️ Ensure only user messages trigger the webhook (check Chatwoot config)