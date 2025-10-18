---
title: broker-message-fix-plan
status: in-progress
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# Broker Message Flow & Chunk Loading Fix Plan

_Last updated: 2025-09-25_
_Priority: CRITICAL - Messages not appearing after broker assignment_
_Reviewer: Senior Developer_

## ⚠️ CRITICAL ISSUES TO FIX
1. **MobileAIAssistantCompact chunk loading error** - Prevents mobile UI from loading
2. **Messages stop appearing after system message** - Broker greeting never shows
3. **Wrong broker name displayed** - Shows "AI Mortgage Advisor" instead of assigned broker

## Prerequisites
- [ ] **STOP**: Read this entire plan before making any changes
- [ ] Create backup branch: `git checkout -b fix/broker-messages-and-chunks`
- [ ] Test current behavior and document issues you see
- [ ] Have browser DevTools open (F12) to monitor Console and Network tabs

---

## Issue 1: Fix MobileAIAssistantCompact Chunk Loading Error ⚡

### Problem
When switching to mobile view, you get:
```
ChunkLoadError: Loading chunk _app-pages-browser_components_ai-broker_MobileAIAssistantCompact_tsx failed
```

### Root Cause
Incorrect dynamic import syntax trying to access a named export when it's actually a default export.

### Solution Steps

#### Step 1.1: Fix Dynamic Import
**File**: `components/ai-broker/ResponsiveBrokerShell.tsx`

**Find this code** (around line 32-37):
```typescript
const MobileAIAssistantCompact = dynamic(
  () => import('./MobileAIAssistantCompact').then(mod => ({ default: mod.MobileAIAssistantCompact })),
  {
    ssr: false,
    loading: () => <MobileLoadingSkeleton />
  }
)
```

**Replace with exactly this**:
```typescript
const MobileAIAssistantCompact = dynamic(
  () => import('./MobileAIAssistantCompact'),
  {
    ssr: false,
    loading: () => <MobileLoadingSkeleton />
  }
)
```

**Why this fixes it**: The file already exports `export default MobileAIAssistantCompact`, so we don't need the `.then()` transformation.

#### Step 1.2: Test The Fix
1. Save the file
2. The dev server should auto-reload
3. Open Chrome DevTools (F12) → Network tab
4. Set browser to mobile view (Ctrl+Shift+M or click device icon)
5. Navigate to `/apply/insights`
6. ✅ Should load without errors

---

## Issue 2: Fix Missing Broker Messages 💬

### Problem
After seeing "All AI specialists are helping..." or "Michelle Chen is reviewing your details...", no other messages appear.

### Root Cause
1. Messages are created with wrong type
2. Timer delays cause timing issues
3. Message polling might miss new messages

### Solution Steps

#### Step 2.1: Fix Message Type for Initial Greeting
**File**: `lib/integrations/chatwoot-client.ts`

**Find this code** (around line 313-317):
```typescript
body: JSON.stringify({
  content: initialMessage,
  message_type: 'outgoing',
  private: false
})
```

**Replace with exactly this**:
```typescript
body: JSON.stringify({
  content: initialMessage,
  message_type: 1,  // Use numeric type - 1 = outgoing/agent message
  private: false,
  sender: {
    type: 'agent'  // Explicitly mark as agent message
  }
})
```

**Why this fixes it**: Ensures the message is properly classified as an agent message.

#### Step 2.2: Add Success Logging
**In the same file**, right after the code you just changed, find:
```typescript
if (!response.ok) {
  console.error('Failed to send initial message:', await response.text())
}
```

**Replace with this more detailed version**:
```typescript
if (response.ok) {
  const sentMessage = await response.json()
  console.log('✅ Initial broker message sent successfully:', {
    messageId: sentMessage.id,
    brokerName: leadData.brokerPersona.name,
    preview: sentMessage.content?.substring(0, 50) + '...'
  })
} else {
  const errorText = await response.text()
  console.error('❌ Failed to send initial broker message:', {
    status: response.status,
    error: errorText,
    brokerName: leadData.brokerPersona.name
  })
}
```

#### Step 2.3: Fix Activity/System Messages
**Same file** (`lib/integrations/chatwoot-client.ts`)

**Find this code** (around line 453-457):
```typescript
body: JSON.stringify({
  content,
  message_type: 2,  // Numeric 2 = activity/system message
  private: false
})
```

**Replace with**:
```typescript
body: JSON.stringify({
  content,
  message_type: 2,  // Activity/system message
  private: false,
  sender: {
    type: 'system'  // Explicitly mark as system
  }
})
```

#### Step 2.4: Add Debugging to Broker Join Timer
**File**: `lib/engagement/broker-engagement-manager.ts`

**Find this code** (around line 140-145):
```typescript
const timer = setTimeout(async () => {
  try {
    await chatwootClient.createActivityMessage(
      context.conversationId,
      `${broker.name} joined the conversation.`
    )
```

**Add logging right after the try**:
```typescript
const timer = setTimeout(async () => {
  try {
    console.log('⏰ Broker join timer fired:', {
      conversationId: context.conversationId,
      brokerName: broker.name,
      delayMs,
      timestamp: new Date().toISOString()
    })

    await chatwootClient.createActivityMessage(
      context.conversationId,
      `${broker.name} joined the conversation.`
    )
```

**Then find** (around line 151-152):
```typescript
// Send the broker's personalized greeting message after joining
await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)
```

**Add logging before and after**:
```typescript
// Send the broker's personalized greeting message after joining
console.log('📨 Sending broker greeting message...')
await chatwootClient.sendInitialMessage(context.conversationId, context.processedLeadData)
console.log('✅ Broker greeting message sent')
```

---

## Issue 3: Fix Message Polling & Display 🔄

### Problem
Messages might be created but not showing in the UI.

### Solution Steps

#### Step 3.1: Add Debugging to Message Fetching
**File**: `components/chat/CustomChatInterface.tsx`

**Find the fetchMessages function** (around line 112-139)

**After this line** (around line 123):
```typescript
console.log('Fetched messages:', data.messages?.length || 0, 'messages')
```

**Add more detailed logging**:
```typescript
console.log('Fetched messages:', data.messages?.length || 0, 'messages')

// Add this detailed logging
if (data.messages && data.messages.length > 0) {
  console.log('📥 Message details:', data.messages.map((m: any) => ({
    id: m.id,
    type: m.message_type,
    sender: m.sender?.type,
    content: m.content?.substring(0, 40) + '...',
    private: m.private
  })))
}
```

#### Step 3.2: Debug Polling for New Messages
**Same file**, find the `pollNewMessages` function (around line 142-172)

**After this line** (around line 159):
```typescript
console.log('📨 New messages received:', newMessages.length)
```

**Add this debugging**:
```typescript
console.log('📨 New messages received:', newMessages.length)
if (newMessages.length > 0) {
  console.log('New message details:', newMessages.map((m: any) => ({
    id: m.id,
    content: m.content?.substring(0, 40) + '...'
  })))
}
```

**Also add after the if block** (around line 167):
```typescript
} else if (lastMessageIdRef.current > 0) {
  console.log('🔄 No new messages in this poll, checking after ID:', lastMessageIdRef.current)
}
```

---

## Issue 4: Fix Message Role Classification 🏷️

### Problem
System messages appearing on wrong side or with wrong styling.

### Solution Steps

#### Step 4.1: Debug Message Role Detection
**File**: `components/chat/CustomChatInterface.tsx`

**Find the getMessageRole function** (around line 302)

**Add this at the very start of the function**:
```typescript
const getMessageRole = (message: Message): 'user' | 'agent' | 'system' => {
  // Debug specific broker messages
  if (message.content?.includes('reviewing your details') ||
      message.content?.includes('joined the conversation') ||
      message.content?.includes('All AI specialists')) {
    console.log('🔍 Broker/System message detected:', {
      id: message.id,
      messageType: message.message_type,
      senderType: message.sender?.type,
      content: message.content?.substring(0, 50),
      willBeClassifiedAs: 'checking...'
    })
  }

  // ... rest of the existing function code
```

---

## Testing Your Fixes 🧪

### Test Scenario A: Mobile Chunk Loading
1. Clear browser cache (Ctrl+Shift+Delete → Cached images and files)
2. Set viewport to mobile (< 768px) using DevTools
3. Navigate to `/apply`
4. Complete form and submit
5. ✅ No chunk loading errors in console
6. ✅ Mobile UI loads correctly

### Test Scenario B: Complete Message Flow
1. Open browser console (F12)
2. Navigate to `/apply`
3. Complete the form with test data:
   - Name: Test User
   - Email: test@example.com
   - Phone: 91234567
   - Select any options
4. Submit the form
5. Watch console for these messages in order:
   - ✅ "All AI specialists are helping..." OR broker assignment
   - ✅ "{Broker Name} is reviewing your details..."
   - ✅ Wait 3-15 seconds
   - ✅ "⏰ Broker join timer fired"
   - ✅ "{Broker Name} joined the conversation"
   - ✅ "📨 Sending broker greeting message"
   - ✅ Broker's personalized greeting appears

### Test Scenario C: Send and Receive Messages
1. After broker greeting appears
2. Type "What are the current rates?" in the chat
3. Press Send
4. ✅ Your message appears on the right
5. ✅ Response appears on the left (might take a few seconds)

---

## Common Issues & Solutions 🔧

### If messages still don't appear:
1. **Check Network tab** for failed requests to `/api/chat/messages`
2. **Check conversation status**:
   ```javascript
   // Run in browser console
   const sessionId = 'YOUR_SESSION_ID'; // Get from sessionStorage
   fetch(`/api/chat/messages?conversation_id=YOUR_CONVERSATION_ID`)
     .then(r => r.json())
     .then(d => console.log('All messages:', d))
   ```

3. **Force refresh messages**:
   - Hard refresh: Ctrl+Shift+R
   - Clear sessionStorage: `sessionStorage.clear()` in console
   - Try incognito mode

### If you see TypeScript errors:
```bash
# Check for type errors
npx tsc --noEmit

# If errors exist, they might be pre-existing
# Focus on fixing the runtime issues first
```

---

## Verification Checklist ✅

Before considering the fix complete:

- [ ] Mobile UI loads without chunk errors
- [ ] System messages appear (centered, italic, no box)
- [ ] Broker assignment message appears
- [ ] Broker greeting message appears after delay
- [ ] User messages appear on right
- [ ] Agent messages appear on left
- [ ] Can send and receive messages
- [ ] Console shows expected log messages
- [ ] No duplicate messages
- [ ] Correct broker name shown (not "AI Mortgage Advisor")

---

## Emergency Rollback 🔴

If something breaks badly:

1. **Stop and rollback**:
   ```bash
   git stash  # Save your changes
   git checkout main  # Go back to main branch
   npm run dev  # Restart server
   ```

2. **Document what happened**:
   - Take screenshot of errors
   - Copy console errors to a file
   - Note which step caused the issue

3. **Get help**:
   - Share the error details with senior developer
   - Include the step number where it failed

---

## Time Estimate ⏱️
- Issue 1 (Chunk Loading): 5 minutes
- Issue 2 (Message Types): 20 minutes
- Issue 3 (Polling): 15 minutes
- Issue 4 (Classification): 10 minutes
- Testing: 30 minutes
- **Total: ~1.5 hours**

---

## Final Notes for Junior Developer 📝

**IMPORTANT TIPS**:
1. Make changes one at a time and test after each
2. Keep console open to see debug messages
3. If unsure about a change, ask before proceeding
4. The message flow is: System → Broker Assignment → Delay → Join → Greeting
5. Messages are async - sometimes wait 5-10 seconds for them to appear

**Key Insight**: The main problem is that messages ARE being created in Chatwoot, but they're not appearing in our UI due to:
- Wrong message types
- Classification issues
- Polling/timing problems

Focus on getting messages to APPEAR first, then worry about perfect styling.

**Success looks like**: A conversation where all messages appear in the correct order with the assigned broker's name.

Good luck! 🚀