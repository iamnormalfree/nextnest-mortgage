---
title: n8n-if-node-fix
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-12
---

# n8n IF Node Fix Instructions

## Current Problem
The IF node in your n8n workflow is checking the WRONG paths. It's looking for `$json.body.message.message_type` but the actual structure depends on how the webhook receives data.

## What NextNest Sends
Your webhook handler (app/api/chatwoot-webhook/route.ts) sends this structure:
```json
{
  "event": "message_created",
  "content": "User's message here",
  "message": {
    "message_type": "incoming",
    "sender": {
      "type": "contact"
    },
    "content": "User's message here"
  },
  "conversation": {
    "id": 44,
    "status": "bot",
    "custom_attributes": {}
  }
}
```

## What n8n Receives
When n8n webhook node receives this, it wraps it in a `body` object:
```json
{
  "body": {
    "event": "message_created",
    "content": "User's message here",
    "message": {
      "message_type": "incoming",
      "sender": {
        "type": "contact"
      },
      "content": "User's message here"
    },
    "conversation": {
      "id": 44,
      "status": "bot"
    }
  }
}
```

## The Fix for n8n IF Node

### CURRENT (WRONG) Expressions:
1. `{{ $json.body.event }}` → This is correct ✅
2. `{{ $json.body.conversation.status }}` → This is correct ✅  
3. `{{ $json.body.message.message_type }}` → WRONG PATH ❌
4. `{{ $json.body.message.sender.type }}` → WRONG PATH ❌

### FIXED Expressions:
Update the IF node conditions to:

1. **Event Check (Keep as is):**
   - Expression: `{{ $json.body.event }}`
   - Equals: `message_created`

2. **Conversation Status (Remove or adjust):**
   - Expression: `{{ $json.body.conversation.status }}`
   - Equals: `bot`
   - OR remove this check if conversations might be "pending"

3. **Message Type (FIX THIS):**
   - Expression: `{{ $json.body.message.message_type }}`
   - Equals: `incoming`
   - **Note:** This should already be correct based on your payload!

4. **Sender Type (FIX THIS):**
   - Expression: `{{ $json.body.message.sender.type }}`
   - Equals: `contact`
   - **Note:** This should also be correct!

## Debug Steps in n8n

1. **Add a Code node right after the Webhook:**
```javascript
console.log('Full webhook data:', JSON.stringify($input.first().json, null, 2));
console.log('Body:', JSON.stringify($input.first().json.body, null, 2));
console.log('Message type path check:');
console.log('  body.message.message_type =', $input.first().json.body?.message?.message_type);
console.log('  body.message.sender.type =', $input.first().json.body?.message?.sender?.type);
return $input.first();
```

2. **Test with this exact payload:**
```json
{
  "event": "message_created",
  "content": "What are the best mortgage rates?",
  "message": {
    "message_type": "incoming",
    "sender": {
      "type": "contact"
    },
    "content": "What are the best mortgage rates?"
  },
  "conversation": {
    "id": 44,
    "status": "bot",
    "custom_attributes": {}
  }
}
```

## The Canned Response Source

The canned response "I can help you with your mortgage needs." is coming from the **Check Handoff Triggers** node (line 48 in your workflow) as a fallback when the AI response extraction fails:

```javascript
// Line 48 in Check Handoff Triggers node
response = "I can help you with your mortgage needs.";
```

This happens because:
1. IF node fails → workflow doesn't reach OpenAI
2. Check Handoff Triggers still runs but has no AI response
3. Falls back to the hardcoded message

## Quick Fix Option

If the paths are still not working, use a more flexible IF node expression:

```javascript
// For message_type check:
{{ $json.body?.message?.message_type || $json.message?.message_type || 'none' }}

// For sender type check:  
{{ $json.body?.message?.sender?.type || $json.message?.sender?.type || 'none' }}
```

## Testing the Fix

1. Update the IF node with the correct expressions
2. Execute the workflow manually with test data
3. Check that the IF node outputs "true" branch
4. Verify OpenAI node receives the data
5. Confirm the response is AI-generated, not canned

## Alternative: Bypass IF Node for Testing

To quickly test if the rest of the workflow works:
1. Temporarily connect Webhook directly to "Extract Customer Profile"
2. This bypasses the IF check
3. If it works, you know the IF node is the only problem