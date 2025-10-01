# Archived: Legacy Enhanced Flow Webhook

## Archived Date
2025-10-01

## Reason for Archival

This webhook endpoint (`/api/chatwoot-enhanced-flow`) conflicted with the new broker assignment orchestration implemented in the broker-chat alignment feature.

### Issues with Legacy Webhook

1. **Random Broker Selection** (lines 199-218 in route.ts):
   - Randomly selected brokers based on lead score
   - Overwrote Supabase broker assignments
   - Caused broker name mismatches between header and greeting

2. **Duplicate Queue Messages**:
   - Posted "All AI specialists are helping" messages
   - Conflicted with frontend queue message logic
   - Created confusing user experience

3. **Race Conditions**:
   - Used `setTimeout` for delays (lines 91, 100, 156, 180)
   - Unreliable in serverless environments (Railway/Vercel)
   - Messages could arrive out of order

4. **Lack of Single Source of Truth**:
   - Didn't respect Supabase `ai_brokers` table assignments
   - Created divergence between database state and chat UI

## Replacement

New orchestration eliminates these issues:

### Backend Components

**1. Broker Assignment** (`/app/api/chatwoot-conversation/route.ts`):
- Assigns broker BEFORE any messages posted
- Single source of truth from Supabase `ai_brokers` table
- Returns broker in API response customAttributes

**2. Message Posting** (`/lib/engagement/broker-engagement-manager.ts`):
- Posts messages in sequence: reviewing → 2s wait → joined → greeting
- Synchronous wait (no setTimeout) ensures reliable timing
- Uses assigned broker from Supabase, not random selection

**3. Frontend Propagation**:
- ChatTransitionScreen extracts broker from API response
- Stores in sessionStorage for /apply/insights page
- ResponsiveBrokerShell displays consistent broker name

### Key Improvements

- ✅ Broker assigned BEFORE messages (eliminates race conditions)
- ✅ Synchronous 2s wait (Railway-safe, no setTimeout)
- ✅ Single source of truth (Supabase `ai_brokers` table)
- ✅ Broker name consistent across all systems
- ✅ No duplicate queue messages

## Webhook Status

**Disabled in Chatwoot admin on**: 2025-10-01

**Monitoring period**: 14 days (until 2025-10-15)

**Procedure**: See `/docs/runbooks/chatwoot-webhook-disable-procedure.md`

## Restoration Instructions

If rollback needed during monitoring period:

### Quick Rollback (Tier 1 - Webhook Only)

```bash
# Re-enable webhook in Chatwoot admin
# Settings → Integrations → Webhooks → Toggle ON
```

### Full Rollback (Tier 2 - Code + Webhook)

```bash
# Restore code from archive
cd C:/Users/HomePC/Desktop/Code/NextNest
mv _archived/api/chatwoot-enhanced-flow app/api/chatwoot-enhanced-flow
git add app/api/chatwoot-enhanced-flow
git commit -m "rollback: restore enhanced-flow webhook

Rolling back broker-chat alignment due to [issue description]"
git push

# Re-enable webhook in Chatwoot admin
# Settings → Integrations → Webhooks → Toggle ON

# Verify restoration
node scripts/test-broker-chat-integration.js
```

## Safe to Delete

This code can be permanently deleted after:

**Monitoring period**: 14 days (2025-10-15)
**Safety buffer**: Additional 76 days
**Total retention**: 90 days from archival date

**Safe delete date**: 2025-12-30

### Deletion Command (After 2025-12-30)

```bash
# Remove from repository
git rm -r _archived/api/chatwoot-enhanced-flow
git commit -m "chore: remove legacy enhanced-flow webhook after 90 days

Safe to delete after 90 days of stable operation with new orchestration.
No issues detected during monitoring period.

Monitoring log: docs/runbooks/backups/monitoring-log.txt"
git push
```

## Related Documentation

- **Disable Procedure**: `/docs/runbooks/chatwoot-webhook-disable-procedure.md`
- **n8n Coordination**: `/docs/runbooks/n8n-workflow-coordination.md`
- **New Orchestration**: `/app/api/chatwoot-conversation/route.ts`
- **Broker Manager**: `/lib/engagement/broker-engagement-manager.ts`
- **Integration Tests**: `/scripts/test-broker-chat-integration.js`
- **Main Runbook**: `/docs/runbooks/PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK.md`

## Technical Details

### Legacy Webhook Events

The webhook subscribed to:
- `conversation_created`: Triggered broker assignment and greeting
- `message_created`: Responded to user messages with AI-generated replies
- `conversation_status_changed`: Cleaned up conversation state

### Legacy Broker Selection Logic

```javascript
// Lines 199-218 in route.ts
function selectBrokerForLead(attributes: any) {
  const leadScore = attributes.lead_score || 50

  if (leadScore >= 80) {
    // High-value: Michelle or Jasmine
    const brokers = ['michelle-chen', 'jasmine-lee']
    const selected = brokers[Math.floor(Math.random() * brokers.length)]
    return AI_BROKERS[selected]
  }
  // ... random selection continues
}
```

This random selection **ignored** Supabase assignments, causing mismatches.

### New Broker Assignment Logic

```typescript
// In /app/api/chatwoot-conversation/route.ts
const { brokerId, brokerName } = await assignBestBroker(leadData);
processedLeadData.brokerPersona = {
  id: brokerId,
  name: brokerName
  // ... assigned BEFORE messages posted
};
```

Single source of truth from Supabase `ai_brokers` table.

## Changelog

- **2025-10-01**: Archived after broker-chat alignment implementation
- **2025-10-01**: Webhook disabled in Chatwoot admin
- **2025-10-01**: Monitoring period started (14 days)
- **Target 2025-12-30**: Safe to permanently delete

## Contact

For questions about this archival:
- See `/docs/runbooks/chatwoot-webhook-disable-procedure.md` for escalation contacts
- Check monitoring log: `/docs/runbooks/backups/monitoring-log.txt`
