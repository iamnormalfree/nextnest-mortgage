# Dr. Elena Staging Test Plan

**Date**: 2025-01-17
**Version**: 2.0.0
**Status**: Ready for Staging Tests

---

## 🎯 Test Objectives

1. Verify Dr. Elena calculations work in staging environment
2. Test end-to-end Chatwoot integration
3. Validate Redis and Supabase connections
4. Confirm audit trail recording
5. Test all 5 MAS compliance scenarios
6. Verify error handling and fallbacks

---

## 🔧 Pre-Test Setup

### 1. Environment Variables (Staging)

Create `.env.staging` or update staging environment with:

```env
# OpenAI (for AI explanations)
OPENAI_API_KEY=sk-proj-YOUR-KEY

# Redis (for conversation state)
REDIS_URL=redis://default:YOUR-PASSWORD@staging-redis:6379

# Supabase (for audit trail)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-key

# Chatwoot (for message handling)
CHATWOOT_BASE_URL=https://your-staging-chatwoot.com
CHATWOOT_API_TOKEN=your-token
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_WEBSITE_TOKEN=your-website-token
```

### 2. Database Migration

**Run once in staging Supabase:**

```bash
# Execute the migration SQL
psql $STAGING_DATABASE_URL < lib/db/migrations/001_ai_conversations.sql

# Verify tables created
psql $STAGING_DATABASE_URL -c "\dt"
# Should show: conversations, conversation_turns, calculation_audit
```

### 3. Verify Services

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
# Expected: PONG

# Test Supabase connection (from Supabase dashboard)
# Run: SELECT 1;
# Expected: Returns 1

# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq .
# Expected: Returns list of models
```

---

## 📋 Test Scenarios

### Test 1: Pure Calculation Accuracy

**Objective**: Verify Dr. Elena calculations work without AI

**Command**:
```bash
npx tsx scripts/test-dr-elena-pure-calculations.ts
```

**Expected Result**:
```
✅ All tests passed
Success Rate: 100%
```

**What This Tests**:
- TDSR calculations
- MSR calculations for HDB/EC
- LTV limits by property count
- Extended tenure penalties
- Client-protective rounding

**Pass Criteria**: All 5 scenarios return correct max loan amounts

---

### Test 2: Full Integration (Local)

**Objective**: Test complete Dr. Elena flow with Redis/Supabase

**Prerequisites**:
- Redis running and accessible
- Supabase tables created
- OpenAI API key valid

**Command**:
```bash
npx tsx scripts/test-dr-elena-integration.ts
```

**Expected Result**:
```
================================================================================
TEST SUMMARY
================================================================================
Total Scenarios: 5
✅ Passed: 5
❌ Failed: 0
Success Rate: 100%
================================================================================
```

**What This Tests**:
- Pure calculations + AI explanations
- Audit trail storage in Supabase
- Redis conversation state
- Error handling and fallbacks

**Pass Criteria**: 100% test pass rate with no errors

---

### Test 3: Chatwoot Webhook Integration

**Objective**: Test real Chatwoot message → Dr. Elena → Response flow

#### 3A. Manual Webhook Test

**Setup**:
1. Deploy to staging environment
2. Configure Chatwoot webhook to point to: `https://your-staging.com/api/chatwoot-ai-webhook`

**Test Steps**:

1. **Create Test Conversation in Chatwoot**
   ```bash
   # Use Chatwoot dashboard or API to create conversation
   # with custom attributes:
   {
     "name": "Test User",
     "lead_score": 75,
     "loan_type": "new_purchase",
     "property_category": "HDB",
     "monthly_income": 6000,
     "property_price": 500000,
     "age": 30,
     "citizenship": "Citizen",
     "property_count": 1,
     "existing_commitments": 500
   }
   ```

2. **Send Calculation Question**
   - In Chatwoot, send: "How much can I borrow?"
   - Wait for AI response (should be <3 seconds)

3. **Verify Response Contains**:
   - ✅ Max loan amount (should be ~$341,000 for HDB test case)
   - ✅ Monthly payment estimate
   - ✅ Down payment requirement
   - ✅ TDSR percentage
   - ✅ Limiting factor (MSR for HDB)
   - ✅ Next steps recommendations

**Expected Response Format**:
```
Based on your S$6,000 monthly income:

📊 **Your Mortgage Snapshot:**
• Max Loan: **S$341,000**
• Monthly Payment: **S$1,426**
• Down Payment: **S$159,000**
• TDSR: 38.33% (limit: 55%)

🔑 **Key Points:**
• MSR (30% rule) is limiting your loan amount for HDB
• You're well within TDSR limits
• Strong financial position for first property

📌 **Next Steps:**
1. Get pre-approval to lock in borrowing capacity
2. Start viewing properties up to S$500,000
3. Prepare documents for faster processing

What questions do you have?
```

#### 3B. Automated Webhook Test Script

**Create test script**:
```bash
# File: scripts/test-staging-webhook.sh
#!/bin/bash

STAGING_URL="https://your-staging.com/api/chatwoot-ai-webhook"

# Simulate Chatwoot webhook
curl -X POST $STAGING_URL \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "message": {
      "id": 12345,
      "content": "How much can I borrow?",
      "message_type": "incoming",
      "private": false,
      "sender": {
        "type": "contact"
      }
    },
    "conversation": {
      "id": 99999,
      "custom_attributes": {
        "name": "Test User",
        "lead_score": 75,
        "loan_type": "new_purchase",
        "property_category": "HDB",
        "monthly_income": 6000,
        "property_price": 500000,
        "age": 30,
        "citizenship": "Citizen",
        "property_count": 1,
        "existing_commitments": 500
      }
    }
  }'

echo "\n✅ Webhook test sent. Check staging logs for response."
```

**Run**:
```bash
chmod +x scripts/test-staging-webhook.sh
./scripts/test-staging-webhook.sh
```

---

### Test 4: Database Audit Trail

**Objective**: Verify calculations are being recorded in Supabase

**Steps**:

1. **Run a calculation** (via Test 3)

2. **Check Supabase**:
   ```sql
   -- Query recent calculations
   SELECT
     id,
     conversation_id,
     calculation_type,
     mas_compliant,
     (results->>'maxLoan')::numeric as max_loan,
     (results->>'tdsrUsed')::numeric as tdsr,
     (results->>'limitingFactor') as limiting_factor,
     timestamp
   FROM calculation_audit
   ORDER BY timestamp DESC
   LIMIT 10;
   ```

3. **Expected Result**:
   - Should see your test calculation
   - `mas_compliant` = true
   - `max_loan` matches expected amount
   - `tdsr` percentage correct
   - `timestamp` recent

**Pass Criteria**: Calculation appears in database within 1 second

---

### Test 5: Error Handling & Fallbacks

**Objective**: Verify system handles errors gracefully

#### 5A. Missing Environment Variable

**Test**:
1. Temporarily remove `OPENAI_API_KEY` from staging env
2. Send calculation request
3. System should:
   - ✅ Still calculate (pure functions don't need AI)
   - ✅ Use fallback explanation (template-based)
   - ✅ Log error but not crash

#### 5B. Redis Connection Failure

**Test**:
1. Point `REDIS_URL` to invalid address
2. Send calculation request
3. System should:
   - ✅ Still calculate and respond
   - ✅ Skip conversation state caching
   - ✅ Log warning but continue

#### 5C. Supabase Connection Failure

**Test**:
1. Use invalid `SUPABASE_SERVICE_KEY`
2. Send calculation request
3. System should:
   - ✅ Still calculate and respond
   - ✅ Skip audit trail storage
   - ✅ Log error with fallback ID
   - ✅ Continue functioning

**Pass Criteria**: System never crashes, always provides calculation

---

## 🔍 Monitoring & Validation

### Real-Time Logs

**Watch staging logs**:
```bash
# If on Vercel/Railway/similar
vercel logs --follow

# If using Docker
docker logs -f container-name

# Look for these log patterns:
# ✅ "🧮 Routing to Dr. Elena calculation engine..."
# ✅ "✅ Dr. Elena response generated"
# ✅ "✅ Calculation recorded"
```

### Performance Metrics

**Track these metrics during testing**:

1. **Response Time**:
   - Pure calculation: <50ms
   - With AI explanation: <2s
   - Total webhook response: <3s

2. **Success Rate**:
   - Calculations: 100%
   - Audit trail: >95% (acceptable to fail if DB down)
   - AI explanations: >95%

3. **Accuracy**:
   - MAS compliance: 100%
   - Calculation precision: ±0.01%

### Supabase Dashboard Checks

**Navigate to**: Supabase Dashboard → Table Editor

1. **Check `calculation_audit` table**:
   - Records appearing? ✅
   - `mas_compliant` = true? ✅
   - Formula version = "2.0.0"? ✅

2. **Check `conversations` table** (if used):
   - Conversation IDs matching? ✅

3. **Run compliance query**:
   ```sql
   SELECT
     COUNT(*) as total_calculations,
     COUNT(*) FILTER (WHERE mas_compliant = true) as compliant,
     ROUND(100.0 * COUNT(*) FILTER (WHERE mas_compliant = true) / COUNT(*), 2) as compliance_rate
   FROM calculation_audit
   WHERE timestamp > NOW() - INTERVAL '1 hour';
   ```
   - Expected: 100% compliance rate

---

## 📊 Test Results Template

### Test Execution Log

| Test | Status | Response Time | Notes |
|------|--------|---------------|-------|
| Pure Calculations | ⏳ | - | Not yet run |
| Full Integration | ⏳ | - | Not yet run |
| Chatwoot Webhook | ⏳ | - | Not yet run |
| Audit Trail | ⏳ | - | Not yet run |
| Error Handling | ⏳ | - | Not yet run |

**Update after each test with**: ✅ Pass / ❌ Fail

### Issues Found

| Issue | Severity | Description | Resolution |
|-------|----------|-------------|------------|
| - | - | - | - |

### Performance Baseline

- **Average Response Time**: ___s
- **P95 Response Time**: ___s
- **Success Rate**: ___%
- **Audit Trail Rate**: ___%

---

## ✅ Staging Sign-Off Checklist

Before approving for production:

- [ ] All 5 test scenarios passing (100%)
- [ ] Chatwoot webhook responding <3s
- [ ] Calculations stored in Supabase
- [ ] Redis caching working (check logs)
- [ ] Error handling graceful (no crashes)
- [ ] Audit trail 100% compliant
- [ ] Performance metrics within targets
- [ ] No memory leaks observed
- [ ] Logs clean (no unexpected errors)
- [ ] Team review completed

---

## 🚨 Rollback Plan

If issues found in staging:

1. **Immediate**: Disable webhook in Chatwoot
2. **Investigate**: Check staging logs for errors
3. **Fix**: Apply fixes to codebase
4. **Retest**: Run full test suite again
5. **Re-enable**: Once all tests pass

**Rollback Command**:
```bash
# Revert webhook URL in Chatwoot to previous endpoint
# OR
# Set feature flag to disable Dr. Elena routing
```

---

## 📞 Support Contacts

**During Staging Tests**:
- Technical Issues: Check `docs/runbooks/ai-broker/dr-elena-quick-start.md` troubleshooting
- MAS Compliance Questions: Review `lib/calculations/dr-elena-mortgage.ts`
- Database Issues: Check Supabase logs
- Performance Issues: Monitor Redis connection

**Escalation**:
- If calculations are incorrect → Review MAS regulations
- If system crashes → Check error handling logs
- If performance degrades → Check Redis/Supabase latency

---

## 🎯 Success Criteria Summary

**Stage is READY FOR PRODUCTION when**:

✅ All automated tests passing (100%)
✅ Manual Chatwoot tests successful
✅ Audit trail recording correctly
✅ Performance <3s end-to-end
✅ Error handling working gracefully
✅ No memory leaks or crashes
✅ Team approved

**Status**: ⏳ Ready to Begin Testing

---

*Test Plan Version: 1.0*
*Created: 2025-01-17*
*Dr. Elena Version: 2.0.0*
