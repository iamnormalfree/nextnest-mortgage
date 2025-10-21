# Lead Form to Chat Navigation Debugging Guide

## Problem Statement
After submitting the lead form, the page doesn't navigate to the AI broker chat UI even though Chatwoot webhook is configured in Railway.

## Expected Flow

```
User completes Step 4 (Financial Info)
         ↓
ProgressiveFormWithController.onFormComplete() sets showChatTransition=true
         ↓
ChatTransitionScreen appears with analyzing animation (3.5 seconds)
         ↓
Shows "AI BROKER MATCHED" with broker persona
         ↓
User clicks "Continue to Chat" button
         ↓
ChatTransitionScreen.initiateChatTransition() calls /api/chatwoot-conversation
         ↓
API creates Chatwoot conversation + assigns broker
         ↓
Returns conversationId in response
         ↓
onTransitionComplete() navigates to /chat?conversation=<id>
         ↓
Chat page loads with CustomChatInterface
```

## Quick Diagnostic Steps

### Step 1: Check Browser Console

**Open browser console** (F12 / Cmd+Option+I) and look for:

✅ **Success indicators:**
```javascript
🔍 DEBUG: ChatTransition API request payload: {...}
✅ Contact ready: 12345
✅ Chatwoot conversation ready: 67890
✅ Broker assignment successful: {...}
📱 Calling onTransitionComplete with conversationId: 67890
✅ onTransitionComplete called successfully
```

❌ **Error indicators:**
```javascript
⚠️ Chatwoot not fully configured
❌ API response error: 503
❌ Chat transition error: [error message]
🚫 Circuit breaker is OPEN
```

### Step 2: Run Diagnostic Script

```bash
# Test locally
npm run dev
node scripts/test-chat-handoff.mjs

# Test production
BASE_URL=https://nextnest.sg node scripts/test-chat-handoff.mjs
```

**Expected output:**
- ✅ All Chatwoot environment variables configured
- ✅ API returns `success: true` and `conversationId > 0`
- ✅ Chat page is accessible

**Fallback output:**
- ⚠️ FALLBACK MODE: Chatwoot not fully configured
- Shows phone/email fallback options

### Step 3: Check Railway Environment Variables

**Required variables in Railway dashboard:**
```bash
CHATWOOT_API_TOKEN=ML1DyhzJyDKFFvsZLvEYfHnC
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_WEBSITE_TOKEN=SBSfsRrvWSyzfVUXv7QKjoa2
```

**Verify in Railway:**
```bash
railway variables
```

### Step 4: Check Chatwoot Webhook Configuration

**In Chatwoot dashboard:**
1. Go to Settings → Inboxes → [Your Inbox]
2. Check Webhook URL: `https://nextnest.sg/api/chatwoot-webhook`
3. Events should be enabled:
   - ✅ Message Created
   - ✅ Message Updated
   - ✅ Conversation Created
   - ✅ Conversation Status Changed

### Step 5: Test API Endpoint Directly

**Using curl:**
```bash
curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+6591234567",
      "loanType": "new_purchase",
      "propertyCategory": "resale",
      "propertyType": "HDB",
      "actualAges": [35],
      "actualIncomes": [8000],
      "employmentType": "employed"
    },
    "sessionId": "test-session-123",
    "leadScore": 75
  }'
```

**Expected response:**
```json
{
  "success": true,
  "conversationId": 12345,
  "widgetConfig": {
    "conversationId": 12345,
    "customAttributes": {
      "ai_broker_name": "Sarah Chen",
      "broker_status": "assigned"
    }
  }
}
```

**Fallback response (if Chatwoot not configured):**
```json
{
  "success": false,
  "conversationId": 0,
  "fallback": {
    "type": "phone",
    "contact": "+6583341445",
    "message": "Chat service is being configured..."
  }
}
```

## Common Issues & Solutions

### Issue 1: ChatTransitionScreen appears but "Continue to Chat" button does nothing

**Symptoms:**
- Analyzing animation completes
- Broker card shows
- Button click has no effect

**Debug steps:**
1. Check browser console for API errors
2. Look for network tab → `/api/chatwoot-conversation` request
3. Check response status and body

**Likely causes:**
- API returning 503 (Chatwoot unavailable)
- Circuit breaker is open
- Missing environment variables in production

**Solution:**
```bash
# Verify Railway env vars
railway variables | grep CHATWOOT

# Check Railway logs for API errors
railway logs --follow

# Test API directly
curl -X POST https://nextnest.sg/api/chatwoot-conversation -d '...'
```

### Issue 2: Form submits but ChatTransitionScreen never appears

**Symptoms:**
- Step 4 submission works
- No transition screen
- Page stays on form

**Debug steps:**
1. Check `ProgressiveFormWithController.tsx:112`
2. Verify `currentStep === 3` condition (Step 4 is index 3)
3. Check `onFormComplete` callback fires

**Console debug:**
```javascript
// In ProgressiveFormWithController.tsx:109-115
onFormComplete: (data) => {
  console.log('🐛 DEBUG: onFormComplete called', { currentStep, data })
  setIsFormCompleted(true)
  if (currentStep === 3) {
    console.log('✅ Setting showChatTransition=true')
    setShowChatTransition(true)
  } else {
    console.log('❌ Wrong step:', currentStep, 'expected 3')
  }
}
```

### Issue 3: API returns fallback instead of conversationId

**Symptoms:**
- API returns `success: false`
- Shows phone/email fallback options

**Causes:**
1. **Chatwoot not configured** (lines 99-135 in API route)
2. **Circuit breaker open** (too many recent failures)
3. **Chatwoot API down** (external service issue)

**Solution:**

**For missing configuration:**
```bash
# Set all required variables in Railway
railway variables set CHATWOOT_API_TOKEN=<your-token>
railway variables set CHATWOOT_BASE_URL=https://chat.nextnest.sg
railway variables set CHATWOOT_ACCOUNT_ID=1
railway variables set CHATWOOT_INBOX_ID=1
railway variables set CHATWOOT_WEBSITE_TOKEN=<your-token>

# Trigger redeploy
railway up
```

**For circuit breaker:**
```bash
# Check circuit breaker stats in Railway logs
railway logs | grep "Circuit breaker"

# Wait for circuit breaker to auto-recover (60 seconds)
# Or restart the service to reset it
railway restart
```

### Issue 4: Page navigates but shows "No Conversation Found"

**Symptoms:**
- URL changes to `/chat?conversation=12345`
- Chat page shows error card

**Debug steps:**
1. Check URL has valid conversation ID
2. Verify `sessionStorage` has `form_data` key
3. Check `/api/brokers/conversation/<id>` returns broker data

**Console debug:**
```javascript
// In browser console on /chat page
console.log('Session data:', sessionStorage.getItem('form_data'))
console.log('Conversation ID:', new URLSearchParams(window.location.search).get('conversation'))
```

**Solution:**
```javascript
// If sessionStorage is empty, navigation happened too fast
// ChatTransitionScreen should set it (lines 209-215)
sessionStorage.setItem('form_data', JSON.stringify({
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  loanType: formData.loanType
}))
```

### Issue 5: Conversation created but chat interface doesn't load

**Symptoms:**
- URL is correct: `/chat?conversation=12345`
- Loading spinner appears forever
- No error in console

**Debug steps:**
1. Check if `CustomChatInterface` component is mounting
2. Verify Chatwoot widget script loads
3. Check browser network tab for widget requests

**Component check:**
```javascript
// In app/chat/page.tsx:141-147
console.log('🐛 CustomChatInterface props:', {
  conversationId: parseInt(conversationId),
  contactName: userData?.name,
  contactEmail: userData?.email,
  brokerName: broker?.name
})
```

**Solution:**
- Check `components/chat/CustomChatInterface.tsx` for errors
- Verify Chatwoot widget script URL is correct
- Check CORS settings in Chatwoot dashboard

## Testing Tools

### 1. Diagnostic Script
```bash
node scripts/test-chat-handoff.mjs
```

### 2. E2E Test
```bash
npx playwright test e2e/lead-form-to-chat-navigation.spec.ts --headed
```

### 3. Manual Test Checklist

**Pre-flight:**
- [ ] Railway app is running: `railway status`
- [ ] All env vars set: `railway variables | grep CHATWOOT`
- [ ] Chatwoot webhook configured in dashboard

**Test flow:**
1. [ ] Navigate to https://nextnest.sg/apply
2. [ ] Fill Step 1 (name, email, phone)
3. [ ] Fill Step 2 (property details)
4. [ ] Fill Step 3 (income, employment)
5. [ ] Fill Step 4 (financial details)
6. [ ] Click Submit
7. [ ] ChatTransitionScreen appears
8. [ ] Analyzing animation plays (3.5s)
9. [ ] Broker card appears with "Continue to Chat" button
10. [ ] Click "Continue to Chat"
11. [ ] URL changes to `/chat?conversation=<id>`
12. [ ] Chat interface loads
13. [ ] Can send messages

## Production Verification

```bash
# Check Railway deployment status
railway status

# Follow logs for real-time debugging
railway logs --follow

# Test production API
curl -X POST https://nextnest.sg/api/chatwoot-conversation -H "Content-Type: application/json" -d @test-payload.json

# Check if conversation was created in Chatwoot
# Login to https://chat.nextnest.sg and check Conversations tab
```

## Related Files

**Frontend Flow:**
- `components/forms/ProgressiveFormWithController.tsx:109-115` - onFormComplete trigger
- `components/forms/ProgressiveFormWithController.tsx:1511-1538` - ChatTransitionScreen render
- `components/forms/ChatTransitionScreen.tsx:110-273` - initiateChatTransition()

**Backend API:**
- `app/api/chatwoot-conversation/route.ts` - Conversation creation endpoint

**Chat Page:**
- `app/chat/page.tsx` - Chat UI component

**Diagnostic Tools:**
- `scripts/test-chat-handoff.mjs` - API diagnostic script
- `e2e/lead-form-to-chat-navigation.spec.ts` - E2E test

## Next Steps

1. **Run diagnostic script first:**
   ```bash
   BASE_URL=https://nextnest.sg node scripts/test-chat-handoff.mjs
   ```

2. **Check Railway logs during form submission:**
   ```bash
   railway logs --follow
   ```

3. **Test locally with full logging:**
   ```bash
   npm run dev
   # Open http://localhost:3005/apply in browser with console open
   ```

4. **If still failing, collect this info:**
   - Browser console output (full log)
   - Network tab screenshot (API requests)
   - Railway logs during submission
   - Diagnostic script output
   - Chatwoot webhook configuration screenshot

---

**Last Updated:** 2025-10-20
**Related Issue:** Lead form to chat navigation failure
**Status:** Diagnostic tools created, awaiting user test results
