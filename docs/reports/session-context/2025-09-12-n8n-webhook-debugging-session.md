---
title: n8n-webhook-debugging-session
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-12
---

# n8n Webhook Debugging Session - September 12, 2025

## 🎯 Session Objective
Fix the AI Broker integration where n8n is not processing messages correctly and returning canned responses instead of AI-generated responses.

## 🐛 Core Problem Identified
The n8n workflow's IF node is failing because it expects:
- `message.message_type` = "incoming"
- `message.sender.type` = "contact"

But these fields were coming through as undefined due to payload corruption from object spread operators.

## 📊 Current Implementation Status

### ✅ What's Working
1. **Webhook Reception**: Chatwoot successfully sends webhooks to NextNest app via ngrok
2. **ngrok Tunnel**: Active at `https://e07cec3fd516.ngrok-free.app` → `localhost:3004`
3. **n8n Triggering**: Webhooks reach n8n and trigger workflow start
4. **UI Components**: All Task 5 components (BrokerProfile, Chat Interface, etc.) are implemented
5. **Duplicate Prevention**: Added message ID tracking to prevent duplicate webhook processing
6. **Loop Prevention**: Outgoing messages (type 1) are now skipped to prevent infinite loops

### ❌ What's Not Working
1. **n8n IF Node Failure**: The workflow stops at the IF node because required fields are undefined
2. **Canned Responses**: n8n returns "I can help you with your mortgage needs" instead of AI responses
3. **Multiple Webhook Triggers**: Each message triggers 2-4 webhook events (now partially fixed)

## 🔧 Fixes Applied

### Fix 1: Webhook Loop Prevention
```javascript
// Skip outgoing messages to prevent loops
if (messageType === 1 || messageType === 'outgoing') {
  console.log('⏭️ Skipping outgoing message to prevent loop');
  return NextResponse.json({ received: true, skipped: 'outgoing message' });
}
```

### Fix 2: Duplicate Message Prevention
```javascript
const processedMessages = new Set<string>();
const messageId = event.id?.toString() || `${event.conversation?.id}-${event.content}-${Date.now()}`;
if (processedMessages.has(messageId)) {
  console.log('⏭️ Skipping duplicate webhook for message:', messageId);
  return NextResponse.json({ received: true, skipped: 'duplicate' });
}
processedMessages.add(messageId);
```

### Fix 3: Payload Structure Correction (3 Variants)

#### Variant 1: Clean Payload Without Spread
```javascript
const n8nPayload = {
  event: event.event || 'message_created',
  id: event.id,
  account: event.account,
  content: event.content,
  conversation_id: event.conversation?.id,
  message_type: 'incoming',
  message: {
    id: event.id || Date.now(),
    message_type: 'incoming',
    content: event.content || '',
    conversation_id: event.conversation?.id,
    sender: {
      type: 'contact',
      name: 'User',
      id: 1
    }
  },
  conversation: {
    id: event.conversation?.id,
    status: 'bot'
  }
};
```

#### Variant 2: Deep Clone Approach
```javascript
const n8nPayload = JSON.parse(JSON.stringify({
  event: event.event,
  id: event.id,
  // ... base structure
}));

n8nPayload.message = {
  message_type: 'incoming',
  sender: { type: 'contact' },
  // ... explicit nested structure
};
```

#### Variant 3: Minimal Payload (Currently Active)
```javascript
const n8nPayload = {
  event: 'message_created',
  content: event.content || '',
  message: {
    message_type: 'incoming',  // n8n IF node checks this
    sender: {
      type: 'contact'  // n8n IF node checks this
    },
    content: event.content || ''
  },
  conversation: {
    id: event.conversation?.id,
    status: 'bot',
    custom_attributes: event.conversation?.custom_attributes || {}
  }
};
```

## 🔄 Message Flow Architecture

```
1. User types message in NextNest chat UI
   ↓
2. Message sent to Chatwoot via /api/chat/send
   ↓
3. Chatwoot creates message (incoming, type 0)
   ↓
4. Chatwoot webhook fires to ngrok URL
   ↓
5. NextNest /api/chatwoot-webhook receives event
   ↓
6. Webhook handler transforms payload for n8n
   ↓
7. Transformed payload sent to n8n webhook
   ↓
8. n8n IF node checks message.message_type and message.sender.type
   ↓
9. [CURRENTLY FAILING] n8n should process with OpenAI
   ↓
10. n8n should send response back to Chatwoot
```

## 🛠️ Environment Configuration

### .env.local Settings
```env
N8N_AI_BROKER_WEBHOOK_URL=https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker
ENABLE_AI_BROKER=true
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=[configured]
CHATWOOT_ACCOUNT_ID=1
```

### Server Configuration
- **Development Server**: Port 3004 (to match ngrok)
- **ngrok URL**: https://e07cec3fd516.ngrok-free.app
- **Conversation ID**: 44 (test conversation)

## 📝 Key Files Modified

1. **`app/api/chatwoot-webhook/route.ts`**
   - Added loop prevention for outgoing messages
   - Added duplicate message detection
   - Fixed payload transformation (3 variants created)
   - Improved logging for debugging

2. **`components/chat/CustomChatInterface.tsx`**
   - Changed from test endpoint to real Chatwoot API
   - Fixed message handling for real responses
   - Updated polling logic

3. **Scripts Created**
   - `test-chatwoot-message-flow.js` - Test complete flow
   - `test-direct-chatwoot-message.js` - Direct Chatwoot API test
   - `check-conversation-status.js` - Check conversation details
   - `check-all-messages.js` - View all messages
   - `monitor-webhook-flow.js` - Monitor webhook processing

## 🚨 Remaining Issues to Fix

1. **n8n Workflow Configuration**
   - The IF node conditions might need adjustment
   - OpenAI API key might not be configured
   - Response node might not be sending back to Chatwoot

2. **Canned Response Issue**
   - "I can help you with your mortgage needs" appears to be a fallback
   - Need to check n8n workflow for default response nodes

3. **Server Restart Required**
   - The webhook handler changes need server restart
   - Port 3004 is currently in use by old process

## 📋 Next Steps When Resuming

1. **Restart the development server**
   ```bash
   # Kill existing process on port 3004
   # Then restart:
   npm run dev -- --port 3004
   ```

2. **Test the webhook payload fix**
   - Send a test message in chat
   - Check console for transformed payload structure
   - Verify n8n receives correct nested fields

3. **Debug n8n workflow**
   - Check n8n execution history
   - Verify IF node receives `message.message_type` and `message.sender.type`
   - Check OpenAI configuration in n8n
   - Verify response node configuration

4. **Test end-to-end flow**
   - Send message → Check webhook → Verify n8n processing → Check for AI response

## 🎯 Success Criteria

The integration will be considered successful when:
- [ ] User messages trigger n8n workflow without errors
- [ ] n8n IF node passes with correct field values
- [ ] OpenAI generates contextual responses (not canned)
- [ ] Responses appear in Chatwoot UI
- [ ] No duplicate messages or infinite loops
- [ ] Consistent response times under 5 seconds

## 💡 Key Insights

1. **Object Spread Corruption**: The `...event` spread was overwriting our carefully crafted message structure
2. **Webhook Payload Structure**: Chatwoot sends different payload formats than expected
3. **Message Type Values**: 0 = incoming (user), 1 = outgoing (bot/agent)
4. **Duplicate Webhooks**: Chatwoot can send multiple webhook events for the same message
5. **n8n Field Requirements**: The IF node specifically checks nested fields, not root-level

---

**Session Status**: PAUSED - Ready to resume with server restart and testing of payload fixes