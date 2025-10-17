# n8n Message Tracking Implementation Guide

## Summary of Changes

Fixed Chatwoot ↔ n8n message duplication issues by implementing proper message tracking for echo detection.

### Issues Resolved
1. ✅ Template message appearing twice (bot side + user side)
2. ✅ Multiple (3x) bot responses after user message
3. ✅ Echo detection now properly prevents message loops

## What Was Changed

### 1. New API Endpoint: `/api/track-bot-message`
**File:** `app/api/track-bot-message/route.ts`

This endpoint allows n8n to register bot messages for echo detection after sending them to Chatwoot.

**Purpose:**
- n8n sends message to Chatwoot → gets message ID back
- n8n calls this endpoint with (conversationId, content, messageId)
- Message gets tracked in echo detection cache
- Prevents the webhook from re-processing the same message

### 2. Enhanced Webhook Echo Detection
**File:** `app/api/chatwoot-webhook/route.ts`

Added detailed logging to echo detection at lines 79-94:
- Logs every echo check with message ID and content preview
- Shows why messages are being skipped (if detected as echo)
- Helps debug message flow issues

### 3. Documentation
**Files Created:**
- `docs/n8n-message-deduplication-fix.md` - Comprehensive fix plan
- `docs/n8n-message-tracking-implementation-guide.md` - This file

## n8n Workflow Updates Required

### Update 1: Modify "Send Response to Chatwoot" Node

**Location:** In your n8n workflow "NN AI Broker - Updated v2", find the Code node that sends messages to Chatwoot (currently around line 184).

**Add this code AFTER successfully sending to Chatwoot:**

```javascript
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
```

**Full updated node code in:** `docs/n8n-message-deduplication-fix.md`

### Update 2: Add Event Deduplication (Optional but Recommended)

Add a new Code node BEFORE "If - Check Message Type" to prevent duplicate event processing.

**Node Name:** "Deduplicate Events"

**Code:** See full code in `docs/n8n-message-deduplication-fix.md` under "Fix 4"

This prevents n8n from processing the same Chatwoot event multiple times within a 30-second window.

## Testing Instructions

### Step 1: Deploy Backend Changes
```bash
# Backend changes are already deployed:
# - /api/track-bot-message endpoint created
# - Enhanced echo detection logging added
```

### Step 2: Update n8n Workflow
1. Open n8n workflow: https://n8n.nextnest.sg (or your n8n instance)
2. Navigate to "NN AI Broker - Updated v2" workflow
3. Find the "Send Response to Chatwoot" Code node
4. Add the message tracking code (see Update 1 above)
5. Save and activate the workflow

### Step 3: Test the Flow
1. **Send a test message** in a conversation
2. **Check logs** for:
   ```
   ✅ Tracked message {messageId} for echo detection
   🔍 Checking for echo: {conversationId, messageId, ...}
   ```
3. **Verify**: Only ONE bot response appears (not 2-3)
4. **Verify**: Bot message appears on the RIGHT side (agent/bot), not LEFT (user)

### Step 4: Monitor for Issues
Check for these log patterns:
- `⏭️ Skipping echoed bot message` - Echo detection working ✅
- `⏭️ Skipping outgoing message to prevent loop` - Message type check working ✅
- Multiple responses to same user message - Still an issue ❌

## Rollback Instructions

If issues occur:

### Rollback Backend
```bash
# Remove the tracking endpoint
git checkout HEAD -- app/api/track-bot-message
```

### Rollback n8n
1. Open n8n workflow
2. Remove the tracking code added to "Send Response to Chatwoot" node
3. Save workflow

## Architecture Flow (After Fix)

```
User sends message
  ↓
Chatwoot API receives message (message_type: 0)
  ↓
Chatwoot webhook fires → /api/chatwoot-webhook
  ↓
Webhook checks: isIncoming? ✅, isFromContact? ✅, not an echo? ✅
  ↓
Forwards to n8n
  ↓
n8n generates AI response
  ↓
n8n sends to Chatwoot (message_type: 1) → Gets message ID back
  ↓
n8n calls /api/track-bot-message with (conversationId, content, messageId)
  ↓
Message tracked in echo detection cache
  ↓
Chatwoot webhook fires again (message_type: 1)
  ↓
Webhook checks: isOutgoing? ✅ → SKIP (prevents loop)
  ↓
Frontend polls and gets ONE bot message ✅
```

## Key Files Modified

1. **Created:**
   - `app/api/track-bot-message/route.ts` - New tracking endpoint
   - `docs/n8n-message-deduplication-fix.md` - Fix plan
   - `docs/n8n-message-tracking-implementation-guide.md` - This guide

2. **Updated:**
   - `app/api/chatwoot-webhook/route.ts` - Enhanced echo detection logging

3. **Requires Update (in n8n UI):**
   - n8n workflow: "NN AI Broker - Updated v2" → "Send Response to Chatwoot" node

## Support

If you encounter issues:
1. Check logs for the patterns mentioned above
2. Verify n8n workflow has the tracking code
3. Test with a fresh conversation (new email)
4. Check that message IDs are being tracked: Look for `✅ Tracked message` logs

## Next Steps

1. ✅ Backend changes deployed
2. ⏳ Update n8n workflow (manual step - see Update 1)
3. ⏳ Test with real user message
4. ⏳ Monitor for 24 hours to ensure stability
5. ✅ If stable, mark as resolved
