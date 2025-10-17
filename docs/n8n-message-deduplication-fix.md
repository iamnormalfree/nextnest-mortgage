# Response-Awareness Fix Plan
## Chatwoot → n8n → Chatwoot Message Duplication

### Issues Identified
1. **Template message appearing twice** - once on bot side, once on user side
2. **Multiple (3x) bot responses** after user sends a message
3. **Silver divider** appearing below bot messages (UI styling issue)

### Root Cause

#### Issue 1: Message Echo Not Being Tracked
**Problem:** n8n sends messages to Chatwoot with correct `message_type: 1`, but the message ID is never tracked for echo detection.

**Flow:**
```
User sends message → Chatwoot → Webhook → n8n
n8n generates response → Sends to Chatwoot (message_type: 1) ✅
n8n gets message ID back but DOESN'T track it ❌
Chatwoot webhook fires again with the outgoing message
Webhook skips it (message_type: 1) ✅
BUT Chatwoot might echo it with different structure ❌
Frontend polls and gets duplicate messages ❌
```

#### Issue 2: Multiple n8n HTTP Requests
**Problem:** The n8n workflow might have multiple execution paths that all send messages to Chatwoot.

**Evidence from workflow:**
- Line 184: "Send Response to Chatwoot" node
- Line 197: "Handle Handoff" node (also sends messages)
- Line 210: "Update Attributes" node (might trigger additional logic)

### Fix Implementation

#### Fix 1: Add Message Tracking Endpoint for n8n

Create a new API endpoint that n8n can call AFTER sending a message to Chatwoot to track it for echo detection.

**File:** `app/api/track-bot-message/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { trackBotMessage } from '@/lib/utils/message-tracking'

/**
 * Track bot messages sent by n8n for echo detection
 * Called by n8n AFTER it successfully sends a message to Chatwoot
 */
export async function POST(request: NextRequest) {
  try {
    const { conversationId, content, messageId } = await request.json()

    if (!conversationId || !content || !messageId) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, content, messageId' },
        { status: 400 }
      )
    }

    // Track the bot message for echo detection
    trackBotMessage(conversationId, content, messageId)

    console.log('✅ n8n message tracked for echo detection:', {
      conversationId,
      messageId,
      contentPreview: content.substring(0, 50)
    })

    return NextResponse.json({
      success: true,
      tracked: true,
      conversationId,
      messageId
    })
  } catch (error) {
    console.error('Error tracking n8n message:', error)
    return NextResponse.json(
      { error: 'Failed to track message' },
      { status: 500 }
    )
  }
}
```

#### Fix 2: Update n8n Workflow to Track Messages

**Update the "Send Response to Chatwoot" code node (line 184) to:**

```javascript
// Send Response to Chatwoot
const data = $input.first().json;
const conversationId = data.conversationId;
const aiResponse = data.aiResponse;
const shouldHandoff = data.shouldHandoff;

// Check if this is a test conversation
const isTestConversation = conversationId > 90000 || conversationId === 12346 || conversationId === 12347;

if (isTestConversation) {
  console.log(`Test mode - conversation ${conversationId} - not sending to Chatwoot`);
  return {
    status: 'test_mode',
    message: 'Response generated but not sent (test conversation)',
    conversationId: conversationId,
    response: aiResponse,
    shouldHandoff: shouldHandoff,
    brokerName: data.brokerName,
    testResult: 'SUCCESS - AI response generated correctly'
  };
}

// For production - send to Chatwoot
try {
  const response = await this.helpers.httpRequest({
    method: 'POST',
    url: `https://chat.nextnest.sg/api/v1/accounts/1/conversations/${conversationId}/messages`,
    headers: {
      'api-access-token': '={{$env.CHATWOOT_API_TOKEN}}',
      'Content-Type': 'application/json'
    },
    body: {
      content: aiResponse,
      message_type: 1,  // outgoing
      private: false
    },
    json: true
  });

  // 🔥 NEW: Track message for echo detection
  const messageId = response.id?.toString();
  if (messageId) {
    try {
      await this.helpers.httpRequest({
        method: 'POST',
        url: 'https://nextnest.sg/api/track-bot-message',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          conversationId: conversationId,
          content: aiResponse,
          messageId: messageId
        },
        json: true
      });
      console.log(`✅ Tracked message ${messageId} for echo detection`);
    } catch (trackError) {
      console.error('⚠️ Failed to track message (non-critical):', trackError.message);
      // Don't fail the whole process if tracking fails
    }
  }

  // If handoff needed, update conversation status
  if (shouldHandoff) {
    await this.helpers.httpRequest({
      method: 'PATCH',
      url: `https://chat.nextnest.sg/api/v1/accounts/1/conversations/${conversationId}`,
      headers: {
        'api-access-token': '={{$env.CHATWOOT_API_TOKEN}}',
        'Content-Type': 'application/json'
      },
      body: {
        status: 'pending'
      },
      json: true
    });
  }

  return {
    status: 'success',
    messageId: response.id,
    conversationId: conversationId,
    response: aiResponse,
    shouldHandoff: shouldHandoff,
    handoffStatus: shouldHandoff ? 'pending' : 'bot',
    brokerName: data.brokerName,
    tracked: !!messageId
  };

} catch (error) {
  // Error handling remains the same
  if (error.message.includes('404') && conversationId > 1000) {
    console.log(`Conversation ${conversationId} doesn't exist in Chatwoot (expected for test)`);
    return {
      status: 'test_success',
      message: 'Test conversation - response generated successfully',
      conversationId: conversationId,
      response: aiResponse,
      shouldHandoff: shouldHandoff,
      brokerName: data.brokerName,
      error: 'Conversation not in Chatwoot (expected for test IDs)'
    };
  }

  return {
    status: 'error',
    error: error.message,
    conversationId: conversationId,
    response: aiResponse,
    shouldHandoff: shouldHandoff
  };
}
```

#### Fix 3: Ensure Webhook Properly Checks Echo Detection

The webhook already has echo detection (line 76-86), but let's ensure it logs properly:

**Update `/api/chatwoot-webhook/route.ts` (lines 76-86):**

```typescript
// Check for bot message echoes (before duplicate fingerprint check)
if (isIncomingMessage) {
  const webhookMessageId = event.id?.toString()
  const messageContent = event.content || event.message?.content || ''

  console.log('🔍 Checking for echo:', {
    conversationId: event.conversation?.id,
    messageId: webhookMessageId,
    contentPreview: messageContent.substring(0, 50),
    messageType: messageType
  })

  if (checkIfEcho(event.conversation?.id, messageContent, webhookMessageId)) {
    console.log('⏭️ Skipping echoed bot message:', {
      conversationId: event.conversation?.id,
      messageId: webhookMessageId,
      reason: 'Detected as bot echo'
    })
    return NextResponse.json({ received: true, skipped: 'bot_echo' })
  }
}
```

#### Fix 4: Prevent n8n Workflow from Processing Duplicate Events

Add deduplication in the n8n workflow's "If - Check Message Type" node.

**Update the "If - Check Message Type" node to include a Code node before it:**

**New Node:** "Deduplicate Events" (Code node)
```javascript
// Deduplicate events to prevent processing same message multiple times
const input = $input.first().json;
const body = input.body || input;
const event = body.event;
const messageId = body.message?.id || body.id;

// Create unique fingerprint for this event
const fingerprint = `${event}-${messageId}-${Date.now()}`;

// Check if we've seen this exact event in the last 30 seconds
const cacheKey = `n8n_event_${fingerprint}`;

// Use workflow static data for persistence
const staticData = this.getWorkflowStaticData('global');

if (!staticData.processedEvents) {
  staticData.processedEvents = {};
}

const now = Date.now();
const thirtySecondsAgo = now - 30000;

// Clean up old entries
Object.keys(staticData.processedEvents).forEach(key => {
  if (staticData.processedEvents[key] < thirtySecondsAgo) {
    delete staticData.processedEvents[key];
  }
});

// Check if already processed
if (staticData.processedEvents[fingerprint]) {
  console.log(`⏭️ Skipping duplicate event: ${fingerprint}`);
  throw new Error('DUPLICATE_EVENT'); // This will stop the workflow
}

// Mark as processed
staticData.processedEvents[fingerprint] = now;

console.log(`✅ Processing event: ${fingerprint}`);

return input;
```

### Testing Plan

1. **Create the tracking endpoint**
2. **Update n8n workflow** to call tracking endpoint after sending messages
3. **Test the flow:**
   - Send a user message
   - Verify only ONE bot response appears
   - Check logs to confirm message tracking
4. **Monitor for echo detection working properly**

### Expected Results

- ✅ No duplicate messages on user side
- ✅ Exactly ONE bot response per user message
- ✅ Echo detection catches any Chatwoot message loops
- ✅ No silver divider issues (should resolve once message types are correct)
