# Message Duplication Debugging Guide

**Issue:** Templated messages still appearing 3 times after implementing fixes

---

## ⚠️ CRITICAL: You Must Test with a NEW Conversation

**The fix ONLY applies to NEW conversations created AFTER the code changes.**

Old conversations already have duplicate messages in Chatwoot's database - the fix prevents NEW duplicates, it doesn't remove existing ones.

### Testing Steps:

1. **Use a DIFFERENT email address** (not one you've tested with before)
2. **Submit a completely fresh form**
3. **Check the NEW conversation** (not old ones)

Example:
- ❌ DON'T: test@nextnest.sg (if you've used this before)
- ✅ DO: test-oct3-v2@nextnest.sg (new email)

---

## Debugging Checklist

### Step 1: Verify Dev Server Restarted

The code changes require a server restart to take effect.

**Action:**
```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

**Expected Output:**
```
✓ Ready in 3.2s
○ Local: http://localhost:3006
```

---

### Step 2: Check Logs During Form Submission

When you submit a NEW form, you should see these logs IN THIS ORDER:

**Expected Log Sequence:**
```
📤 Sending initial message to Chatwoot: { conversationId: XXX, brokerName: 'Michelle Chen', ... }
✅ Initial broker message sent successfully: { messageId: '12345', brokerName: 'Michelle Chen', ... }
✅ Initial broker message tracked for echo detection: { conversationId: XXX, messageId: '12345' }
```

**Then when webhook arrives (~250ms later):**
```
🔔 Chatwoot webhook received: { event: 'message_created', conversationId: XXX, messageType: 0, ... }
⏭️ Skipping outgoing message to prevent loop   <-- OR
⏭️ Skipping echoed bot message: { conversationId: XXX, messageId: '12345' }
```

**If you see this, it's WORKING!**

---

### Step 3: What If Logs Are Missing?

**Missing "Tracked bot message" log:**
```typescript
// Check if trackBotMessage is being called
// File: lib/integrations/chatwoot-client.ts line 421
```

**Possible causes:**
1. Dev server not restarted
2. TypeScript compilation errors (check terminal)
3. Import statement missing

**Fix:**
```bash
# Check for compilation errors
npx tsc --noEmit

# If errors found, fix them first
# Then restart dev server
```

---

### Step 4: Verify Webhook Echo Detection

**Test webhook manually:**

Create a test webhook payload and POST to your local endpoint:

```bash
curl -X POST http://localhost:3006/api/chatwoot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "id": 12345,
    "content": "Hi! I'\''m Michelle Chen...",
    "message_type": 0,
    "conversation": {
      "id": 244
    },
    "sender": {
      "type": "contact"
    }
  }'
```

**Expected Response:**
```json
{
  "received": true,
  "skipped": "bot_echo"
}
```

If you see `"skipped": "bot_echo"` → Echo detection is working!

---

### Step 5: Common Issues & Solutions

#### Issue 1: "Module not found" error for message-tracking

**Symptoms:**
```
Error: Cannot find module '@/lib/utils/message-tracking'
```

**Solution:**
The file was created. Check if it exists:
```bash
ls -la lib/utils/message-tracking.ts
```

If missing, the implementation agent's file wasn't saved. Check git status:
```bash
git status
```

---

#### Issue 2: Webhook arrives BEFORE tracking completes

**Symptoms:**
```
⏭️ Skipping echoed bot message  <-- NOT appearing
🚀 Forwarding to n8n AI Broker workflow  <-- Message forwarded (shouldn't be)
```

**Explanation:**
Race condition - webhook arrived before `trackBotMessage()` completed.

**Check logs for this indicator:**
```
#COMPLETION_DRIVE_INTEGRATION: Race condition detected - webhook processed before tracking
```

**Solution:**
The 98ms buffer should prevent this. If it happens:
1. Check system clock synchronization
2. Increase buffer in blueprint (contact support)

---

#### Issue 3: TypeScript compilation errors blocking build

**Symptoms:**
```
Error: Type 'string | undefined' is not assignable to type 'string'
```

**List all errors:**
```bash
npx tsc --noEmit 2>&1 | grep "error TS"
```

**Known errors (unrelated to deduplication):**
- `lib/ai/broker-availability.ts` (5 errors)
- `lib/ai/natural-conversation-flow.ts` (1 error)
- `lib/hooks/useChatwootIntegration.ts` (2 errors)

**Temporary workaround:**
These don't block dev mode, only production builds.

---

#### Issue 4: Chatwoot doesn't return message ID

**Symptoms:**
```
⚠️ Chatwoot did not return message ID, using fallback: fallback-244-1759375333
```

**Explanation:**
This is expected occasionally (< 1% of messages). Fallback ID is used.

**If > 5% of messages use fallback:**
Alert! This means Chatwoot API format changed. Contact support.

---

## Live Testing Protocol

### Test Case 1: New Form Submission (CRITICAL)

**Steps:**
1. Open incognito window
2. Navigate to http://localhost:3006
3. Fill form with **NEW email** (e.g., debug-test-1@nextnest.sg)
4. Submit form
5. Wait for chat transition
6. **COUNT MESSAGES IN CHATWOOT UI**

**Expected Result:**
- Greeting appears **EXACTLY ONCE**
- No duplicates on right side (user messages)
- No duplicate greetings on left side (bot messages)

**If Duplicates Still Appear:**
- Check logs (see Step 2 above)
- Verify you used a NEW email
- Confirm dev server restarted
- Check if old webhook configuration exists (disable it)

---

### Test Case 2: User Reply

**Steps:**
1. After greeting appears once
2. Type a message: "What are the interest rates?"
3. Send message
4. **CHECK LOGS**

**Expected Logs:**
```
🔔 Chatwoot webhook received: { event: 'message_created', messageType: 0, ... }
⏭️ Skipping outgoing message to prevent loop  <-- Should NOT see this (user message is incoming)
🚀 Forwarding to n8n AI Broker workflow  <-- Should see this (message forwarded to AI)
```

**Expected Result:**
- User message appears ONCE
- n8n AI response appears ONCE (not blocked)

---

### Test Case 3: Webhook Configuration Audit

**Check for duplicate webhooks:**

```bash
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "url": "https://your-domain.com/api/chatwoot-webhook",
    "subscriptions": ["message_created", "conversation_created", ...]
  }
]
```

**If you see MULTIPLE webhooks with same events:**
- Disable all except ONE
- This causes duplicate webhook deliveries → duplicate processing

**How to disable:**
1. Log into https://chat.nextnest.sg
2. Settings → Integrations → Webhooks
3. Find duplicate webhook
4. Toggle OFF or DELETE

---

## Success Criteria

After implementing fixes and testing with a NEW conversation:

✅ **Primary Goal:** Templated greeting appears EXACTLY ONCE (not 3 times)

✅ **Secondary Goals:**
- User messages appear once
- n8n AI responses appear once (not blocked)
- Logs show "Tracked bot message" and "Skipping echoed bot message"

✅ **Monitoring (Week 1):**
- Zero user reports of duplicates
- Echo skip rate: 2-10%
- Tracking success: 100%
- n8n delivery: 100%

---

## If Still Not Working After All Steps

**Collect this information:**

1. **Browser Console Logs** (with timestamps)
2. **Server Console Logs** (full output during form submission)
3. **Chatwoot Conversation ID** of the NEW test conversation
4. **Screenshot** of duplicate messages in Chatwoot UI
5. **Git status** output:
   ```bash
   git status
   git log --oneline -5
   ```

6. **Verify file exists:**
   ```bash
   cat lib/utils/message-tracking.ts | head -20
   ```

**Contact Support With:**
- All collected information above
- Email used for test: [email]
- Timestamp of test: [timestamp]
- Dev server logs from that exact time

---

## Quick Smoke Test (30 seconds)

```bash
# 1. Check file exists
ls lib/utils/message-tracking.ts

# 2. Check imports in webhook
grep "trackBotMessage\|checkIfEcho" app/api/chatwoot-webhook/route.ts

# 3. Check imports in client
grep "trackBotMessage" lib/integrations/chatwoot-client.ts

# 4. Restart dev server
npm run dev

# 5. Submit form with NEW email
# 6. Check logs for "Tracked bot message"
# 7. Check Chatwoot UI for single greeting

# If all pass → Fixed!
# If any fail → See troubleshooting sections above
```

---

## Remember

**OLD CONVERSATIONS WILL STILL HAVE DUPLICATES**

The fix prevents NEW duplicates from being created.
It does NOT remove existing duplicates from old conversations.

**ALWAYS TEST WITH A NEW EMAIL ADDRESS**
