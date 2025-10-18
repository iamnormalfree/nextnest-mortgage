# Chatwoot Enhanced Webhook Disable Procedure

## Purpose
Disable the legacy `/api/chatwoot-enhanced-flow` webhook that conflicts with new broker assignment orchestration.

## Prerequisites
- Admin access to Chatwoot at https://chat.nextnest.sg
- Credentials from `.env.local`:
  - `CHATWOOT_API_TOKEN=ML1DyhzJyDKFFvsZLvEYfHnC`
  - `CHATWOOT_BASE_URL=https://chat.nextnest.sg`
  - `CHATWOOT_ACCOUNT_ID=1`

## Context: Why Disable This Webhook?

The `/api/chatwoot-enhanced-flow` webhook causes three critical issues:

1. **Random Broker Selection**: Randomly selects brokers (lines 199-218), overwriting Supabase assignments
2. **Duplicate Queue Messages**: Posts "All AI specialists are helping" messages that conflict with frontend
3. **Broker Name Mismatch**: Uses different broker than what was assigned in Supabase

The new orchestration in `/api/chatwoot-conversation` + `broker-engagement-manager.ts` fixes these issues by:
- Single source of truth from Supabase `ai_brokers` table
- Broker assigned BEFORE any messages posted
- Synchronous 2s wait ensures reliable message timing

## Step 1: Backup Current Configuration

1. Log in to Chatwoot admin: https://chat.nextnest.sg
2. Navigate to: **Settings → Integrations → Webhooks**
3. Take screenshot of current webhook configuration
4. Document webhook details:
   - **URL**: `[your-domain]/api/chatwoot-enhanced-flow`
   - **Events subscribed**: [list all checked events]
   - **Active status**: [ON/OFF]
5. Save screenshot to `docs/runbooks/backups/chatwoot-webhook-backup-[YYYY-MM-DD].png`

**Example webhook details to capture:**
```
URL: https://nextnest.vercel.app/api/chatwoot-enhanced-flow
Events:
  ☑ conversation_created
  ☑ message_created
  ☑ conversation_status_changed
Active: ON
Created: [date]
Last triggered: [timestamp]
```

## Step 2: Disable Enhanced Flow Webhook

1. In Chatwoot admin, go to **Settings → Integrations → Webhooks**
2. Find webhook with URL containing `/api/chatwoot-enhanced-flow`
3. Toggle **Active** switch to **OFF** (do NOT delete yet)
4. Click **Save** or **Update**
5. Take screenshot confirming webhook is disabled

**Important:** Do NOT delete the webhook entry yet. Keep it disabled for rollback capability.

## Step 3: Verify Webhook Disabled

### Automated Verification (Recommended)

Run the integration test script:

```bash
# From project root
node scripts/test-broker-chat-integration.js
```

Expected output:
```
Test 2: Checking for enhanced-flow requests...
⚠️  Manual verification required: Check logs for POST to /api/chatwoot-enhanced-flow
   Expected: ZERO requests
```

### Manual Verification

1. Complete the apply flow in your development/staging environment:
   - Fill out progressive form
   - Submit to ChatTransitionScreen
   - Wait for redirect to /apply/insights

2. Check Chatwoot conversation timeline:
   - Should see: "reviewing your details" → 2s wait → "joined the conversation" → greeting
   - Should NOT see: duplicate broker greetings or queue messages

3. Check application logs (Railway/Vercel):
   ```bash
   # Search logs for enhanced-flow requests
   # Expected: ZERO POST requests to /api/chatwoot-enhanced-flow
   ```

4. Verify broker consistency:
   - Note broker name in chat header (e.g., "Sarah Wong")
   - Check greeting message uses same broker name
   - Check Chatwoot conversation custom attributes: `ai_broker_name` matches

### Success Criteria

- ✅ No POST requests to `/api/chatwoot-enhanced-flow` in logs
- ✅ Broker name consistent across header and messages
- ✅ Join message appears within 2-5 seconds
- ✅ No duplicate "All AI specialists are helping" messages

## Step 4: Monitor for 14 Days

- **Date disabled**: [YYYY-MM-DD]
- **Monitoring end date**: [YYYY-MM-DD + 14 days]

### Monitoring Checklist

Daily checks (first 3 days):
- [ ] Check conversation creation logs for errors
- [ ] Verify broker assignments happening correctly
- [ ] Confirm no user complaints about chat issues
- [ ] Check API response times < 10s (Vercel timeout)

Weekly checks (remaining 11 days):
- [ ] Review conversation volume and assignment success rate
- [ ] Check for any broker name mismatch reports
- [ ] Verify join messages appearing consistently

### Metrics to Watch

**Success Indicators:**
- ✅ All conversations assign correct broker (100% match with Supabase)
- ✅ No messages from enhanced-flow endpoint (zero requests)
- ✅ Zero user complaints about chat functionality
- ✅ Join messages appear within 2-5s consistently
- ✅ No duplicate queue messages in conversations

**Warning Signs:**
- ❌ Broker names mismatch between header and greeting
- ❌ Join messages missing or delayed >10s
- ❌ Duplicate "All AI specialists are helping" messages
- ❌ API timeouts or errors in conversation creation
- ❌ User complaints about chat not working

## Step 5: Delete Legacy Code (After 14 Days)

**Only proceed if monitoring shows zero issues.**

If all success criteria met after 14 days:

```bash
# Already archived to _archived/ by this procedure
# After 14 days, can optionally remove from git history (not recommended yet)

# Recommended: Leave in _archived/ for additional 76 days (90 days total)
# Then safe to delete permanently

# Update monitoring document
echo "Enhanced webhook disabled successfully for 14 days" >> docs/runbooks/backups/monitoring-log.txt
echo "No issues detected. Webhook can remain disabled." >> docs/runbooks/backups/monitoring-log.txt
```

### Final Cleanup (After 90 Days Total)

If you want to remove archived code after 90 days:

```bash
# Remove from repository (optional, only after 90 days)
git rm -r _archived/api/chatwoot-enhanced-flow
git commit -m "chore: remove legacy enhanced-flow webhook after 90 days

Safe to delete after 90 days of stable operation with new orchestration.
No issues detected during monitoring period."

git push
```

## Rollback Procedure

If issues occur after disabling webhook, follow this escalation path:

### Tier 1: Re-enable Webhook (5 minutes)

**When to use**: Broker assignments failing, messages missing, immediate production issue

1. Log in to Chatwoot admin: https://chat.nextnest.sg
2. Navigate to **Settings → Integrations → Webhooks**
3. Find `/api/chatwoot-enhanced-flow` webhook
4. Toggle **Active** switch to **ON**
5. Click **Save**
6. Test conversation creation:
   ```bash
   node scripts/test-broker-chat-integration.js
   ```
7. Verify messages appear in Chatwoot conversation

**Expected recovery time**: 5 minutes

### Tier 2: Restore Archived Code (15 minutes)

**When to use**: Webhook can't be re-enabled, code was deleted, need full rollback

1. Restore code from archive:
   ```bash
   git mv _archived/api/chatwoot-enhanced-flow app/api/chatwoot-enhanced-flow
   ```

2. Redeploy application:
   ```bash
   # If using Vercel
   vercel --prod

   # If using Railway
   git push
   ```

3. Re-enable webhook in Chatwoot admin (see Tier 1)

4. Test full flow:
   ```bash
   node scripts/test-broker-chat-integration.js
   ```

**Expected recovery time**: 15 minutes

### Tier 3: Emergency Backend Rollback (30 minutes)

**When to use**: New orchestration has critical bugs, need to revert all changes

1. Identify commit before broker orchestration changes:
   ```bash
   git log --oneline --grep="broker-chat-alignment"
   ```

2. Revert to previous stable version:
   ```bash
   git revert [commit-hash]
   git push
   ```

3. Re-enable webhook (Tier 1)

4. Monitor for stability

**Expected recovery time**: 30 minutes

### Tier 4: Emergency Webhook Disable (2 minutes)

**When to use**: Webhook causing cascade failures, need immediate stop

```bash
# Direct API call to disable webhook (requires webhook ID)
curl -X PATCH \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks/[WEBHOOK_ID] \
  -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  -H "Content-Type: application/json" \
  -d '{"webhook": {"enabled": false}}'
```

**Note**: Replace `[WEBHOOK_ID]` with actual webhook ID from Chatwoot admin.

## Troubleshooting

### Issue: Webhook Already Disabled But Still Receiving Requests

**Diagnosis:**
- Check Chatwoot webhook list: webhook status should be OFF
- Check application logs: look for POST requests to `/api/chatwoot-enhanced-flow`

**Solution:**
1. Verify webhook ID matches (might be multiple webhooks)
2. Check if webhook is disabled at account level vs. inbox level
3. Clear Chatwoot webhook cache (wait 5 minutes, test again)

### Issue: Can't Find Webhook in Chatwoot Admin

**Diagnosis:**
- Webhook might have been deleted already
- User might not have admin permissions

**Solution:**
1. Check Chatwoot API directly:
   ```bash
   curl -X GET \
     https://chat.nextnest.sg/api/v1/accounts/1/webhooks \
     -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC"
   ```
2. If not found: webhook already disabled/deleted (good!)
3. If found: note webhook ID and disable via API

### Issue: Broker Names Still Mismatching After Disable

**Diagnosis:**
- Webhook disable didn't propagate
- Frontend using cached broker data
- API not returning broker in customAttributes

**Solution:**
1. Clear browser cache and sessionStorage
2. Check API response includes `ai_broker_name`:
   ```bash
   # Test API response
   curl -X POST http://localhost:3000/api/chatwoot-conversation \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","email":"test@example.com"}'
   ```
3. Verify `broker-engagement-manager.ts` is using assigned broker

## Contact

- **Chat Operations Team**: [contact info needed] #PLAN_UNCERTAINTY: Need ops team contact
- **Engineering Lead**: [lead contact needed] #PLAN_UNCERTAINTY: Need eng lead contact
- **Emergency Escalation**: [emergency contact needed] #PLAN_UNCERTAINTY: Need emergency contact

## References

- **New Orchestration**: `/app/api/chatwoot-conversation/route.ts`
- **Broker Manager**: `/lib/engagement/broker-engagement-manager.ts`
- **Legacy Webhook**: `_archived/api/chatwoot-enhanced-flow/route.ts`
- **Integration Tests**: `/scripts/test-broker-chat-integration.js`
- **n8n Coordination**: `/docs/runbooks/n8n-workflow-coordination.md`

## Changelog

- **2025-10-01**: Initial procedure created for broker-chat alignment implementation
