# Dr. Elena Staging Deployment - Railway Guide

**Platform**: Railway
**Status**: Ready to Deploy
**Test Pass Rate**: 100% (5/5 scenarios)
**Estimated Time**: 20-30 minutes

---

## Prerequisites Checklist

Before starting, ensure you have:

- [x] Railway account with project created
- [x] Redis service running on Railway (confirmed: maglev.proxy.rlwy.net:29926)
- [x] Supabase staging project created
- [x] Chatwoot staging account
- [x] OpenAI API key
- [ ] Railway CLI installed (optional, but recommended)

---

## Part 1: Database Migration (Supabase)

**Time**: 5 minutes

### Step 1.1: Access Supabase Dashboard

1. Go to your Supabase staging project: https://app.supabase.com
2. Navigate to: **SQL Editor** (left sidebar)

### Step 1.2: Run Migration

1. Click "New Query"
2. Copy the entire contents of `lib/db/migrations/001_ai_conversations.sql`
3. Paste into the SQL editor
4. Click "Run" or press `Ctrl+Enter`

### Step 1.3: Verify Migration Success

Run this verification query:
```sql
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'conversation_turns', 'calculation_audit')
ORDER BY table_name;
```

**Expected Result**: 3 rows showing all three tables

### Step 1.4: Test Insert Permission

```sql
-- Test that service role can insert (should succeed)
INSERT INTO conversations (id, user_id, broker_persona, lead_score, loan_type)
VALUES ('test-999', 'test-user', 'balanced', 75, 'new_purchase');

-- Verify it was inserted
SELECT * FROM conversations WHERE id = 'test-999';

-- Clean up test data
DELETE FROM conversations WHERE id = 'test-999';
```

**If migration fails**: Check error messages, ensure you're using the service role (not anon key)

✅ **Checkpoint 1**: Database tables created successfully

---

## Part 2: Configure Railway Environment Variables

**Time**: 10 minutes

### Step 2.1: Access Railway Dashboard

1. Go to: https://railway.app
2. Select your **staging project**
3. Click on your **Next.js service**
4. Navigate to: **Variables** tab

### Step 2.2: Add Dr. Elena Environment Variables

Click "+ New Variable" and add each of these:

#### OpenAI Configuration
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

#### Redis Configuration (Already set, verify it)
```
REDIS_URL=redis://default:zluDQrlUgSOSZHPrVHtkrFAuzSEkndJu@maglev.proxy.rlwy.net:29926
```

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_KEY
```

**How to get Supabase keys:**
1. Go to Supabase project settings
2. Navigate to: API → Project API keys
3. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy "service_role" secret → `SUPABASE_SERVICE_KEY` (NOT the anon public key!)

#### Chatwoot Configuration
```
CHATWOOT_BASE_URL=https://your-chatwoot-staging.com
CHATWOOT_API_TOKEN=your_api_token_here
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_WEBSITE_TOKEN=your_website_token
```

**How to get Chatwoot credentials:**
1. Login to Chatwoot staging
2. Go to: Settings → Integrations → API → Access Token
3. Copy values from your staging setup

#### Feature Flags (Enable Dr. Elena)
```
AI_ENABLE_INTENT_CLASSIFICATION=true
AI_ENABLE_CALCULATION_EXPLANATIONS=true
```

#### Node Environment
```
NODE_ENV=production
PORT=3000
```

### Step 2.3: Verify All Variables Set

Your Railway variables should now include:
- ✅ OPENAI_API_KEY
- ✅ REDIS_URL
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ SUPABASE_SERVICE_KEY
- ✅ CHATWOOT_BASE_URL
- ✅ CHATWOOT_API_TOKEN
- ✅ CHATWOOT_ACCOUNT_ID
- ✅ CHATWOOT_INBOX_ID
- ✅ AI_ENABLE_INTENT_CLASSIFICATION
- ✅ AI_ENABLE_CALCULATION_EXPLANATIONS

✅ **Checkpoint 2**: All environment variables configured

---

## Part 3: Deploy to Railway

**Time**: 5-10 minutes (includes build time)

### Step 3.1: Commit and Push Changes

Make sure all Dr. Elena code is committed:

```bash
# Check what's changed
git status

# Add all Dr. Elena files
git add lib/calculations/dr-elena-mortgage.ts
git add lib/ai/dr-elena-explainer.ts
git add lib/ai/dr-elena-integration-service.ts
git add lib/db/repositories/calculation-repository.ts
git add lib/db/migrations/001_ai_conversations.sql
git add scripts/test-dr-elena-*.ts
git add docs/DR_ELENA_*.md

# Commit with descriptive message
git commit -m "feat: Deploy Dr. Elena v2.0.0 to staging - 100% MAS compliant

- Pure calculation engine (MAS Notice 632/645)
- AI explanation layer (gpt-4o-mini)
- Audit trail system (Supabase)
- Integration with Chatwoot webhook
- 100% test pass rate (5/5 scenarios)
- 97% cost reduction vs previous approach

See: STAGING_READINESS_REPORT.md for details"

# Push to trigger Railway deployment
git push origin main
```

### Step 3.2: Monitor Deployment

In Railway dashboard:
1. Go to: **Deployments** tab
2. Watch the build logs in real-time
3. Look for these success indicators:

```
✓ Building...
✓ Installing dependencies
✓ Running next build
✓ Build completed
✓ Starting service...
✓ Health check passed
```

### Step 3.3: Get Staging URL

Once deployed:
1. Go to: **Settings** tab in Railway
2. Under "Domains", you'll see your staging URL
3. Copy this URL (format: `https://your-app-production.up.railway.app`)

**Test the URL**: Open in browser, should see your NextNest homepage

✅ **Checkpoint 3**: Application deployed and accessible

---

## Part 4: Configure Chatwoot Webhook

**Time**: 3 minutes

### Step 4.1: Get Webhook URL

Your webhook URL will be:
```
https://your-app-production.up.railway.app/api/chatwoot-ai-webhook
```

Replace `your-app-production.up.railway.app` with your actual Railway domain.

### Step 4.2: Configure in Chatwoot

1. Login to Chatwoot staging
2. Navigate to: **Settings → Integrations → Webhooks**
3. Click **+ Add Webhook**
4. Configure:
   - **Endpoint URL**: `https://your-app.railway.app/api/chatwoot-ai-webhook`
   - **Events**: Select `message_created`
5. Click **Create Webhook**

### Step 4.3: Verify Webhook

In Chatwoot:
1. Go to webhook settings
2. Check status shows "Active" or "Enabled"
3. Note the webhook ID for troubleshooting

✅ **Checkpoint 4**: Chatwoot webhook configured

---

## Part 5: End-to-End Testing

**Time**: 5 minutes

### Test 5.1: Create Test Conversation

In Chatwoot staging:

1. **Create a new conversation** (or use existing test contact)
2. **Add custom attributes** to the contact:
   ```json
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

### Test 5.2: Send Calculation Request

In the conversation, send this message:
```
How much can I borrow?
```

### Test 5.3: Verify AI Response

Within 3 seconds, you should receive a response containing:

✅ **Expected Response Format**:
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
...
```

**Response should include:**
- ✅ Max loan amount (~S$341,000 for test case)
- ✅ Monthly payment estimate
- ✅ Down payment requirement
- ✅ TDSR percentage (should be ~38%)
- ✅ Limiting factor mention (MSR for HDB)
- ✅ Persona-appropriate tone (balanced for score 75)

### Test 5.4: Check Logs

Monitor Railway logs:
```bash
# Install Railway CLI (if not already)
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Watch logs in real-time
railway logs --follow
```

**Look for these log entries:**
```
🧮 Routing to Dr. Elena calculation engine...
✅ Dr. Elena response generated (588 chars)
✅ Calculation recorded: xxx (Type: max_loan, Max Loan: $341,000)
📤 Sending AI message to Chatwoot
✅ AI response sent to Chatwoot: { messageId: 12345 }
```

### Test 5.5: Verify Audit Trail

In Supabase SQL Editor:
```sql
-- Check recent calculations
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
LIMIT 5;
```

**Expected Result**: Your test calculation appears with:
- ✅ `mas_compliant` = true
- ✅ `max_loan` ≈ 341000
- ✅ `tdsr` ≈ 38.33
- ✅ `limiting_factor` = "MSR"
- ✅ Recent timestamp

✅ **Checkpoint 5**: End-to-end test successful

---

## Part 6: Additional Test Scenarios

### Test 6.1: High Income Case
Send: "I earn S$15,000 per month and want to buy a S$1.2M condo. How much can I borrow?"

**Expected**: Response with ~S$480,000 max loan (45% LTV for second property)

### Test 6.2: General Question (Non-Calculation)
Send: "What interest rates do you currently have?"

**Expected**: General response about rates (should NOT trigger Dr. Elena calculation)

### Test 6.3: Edge Case - Low Income
Send: "I earn S$3,000 per month, can I buy a S$500,000 HDB?"

**Expected**: Response explaining limited borrowing capacity, protective TDSR calculations

---

## Troubleshooting Guide

### Issue: No Response from AI

**Diagnosis:**
```bash
# Check Railway logs
railway logs

# Look for errors containing:
# - "OPENAI_API_KEY"
# - "Failed to send message"
# - "webhook"
```

**Solutions:**
1. Verify OPENAI_API_KEY is set correctly in Railway
2. Check Chatwoot webhook is active
3. Verify Railway app URL is accessible

---

### Issue: Wrong Calculation Results

**Diagnosis:**
```sql
-- Check calculation audit in Supabase
SELECT * FROM calculation_audit
ORDER BY timestamp DESC
LIMIT 1;
```

**Solutions:**
1. Verify inputs are being passed correctly
2. Check if MAS compliance is true
3. Review calculation reasoning in logs

---

### Issue: Audit Trail Not Recording

**Diagnosis:**
```bash
# Check Railway logs for Supabase errors
railway logs | grep -i "supabase\|database\|audit"
```

**Solutions:**
1. Verify SUPABASE_SERVICE_KEY is correct (not anon key)
2. Check RLS policies allow service role
3. Verify tables exist in Supabase

---

### Issue: Redis Connection Errors

**Diagnosis:**
```bash
# Check Redis connectivity
railway logs | grep -i "redis"
```

**Solutions:**
1. Verify REDIS_URL format is correct
2. Check Redis service is running in Railway
3. Test Redis connection from Railway shell:
   ```bash
   railway run redis-cli -u $REDIS_URL ping
   ```

---

## Success Criteria Checklist

Before considering staging deployment successful:

### Functional Tests
- [ ] Calculation request returns response <3 seconds
- [ ] Max loan amount is accurate (matches test expectations)
- [ ] TDSR/MSR/LTV correctly identified
- [ ] Response tone matches broker persona (balanced for score 75)
- [ ] General questions route to standard AI (not Dr. Elena)

### Technical Validation
- [ ] Audit trail records appear in Supabase
- [ ] All calculations show `mas_compliant = true`
- [ ] Railway logs show no errors
- [ ] Redis connection stable (no reconnection logs)
- [ ] Webhook responding reliably

### Performance
- [ ] Average response time <3s
- [ ] P95 response time <5s
- [ ] No memory leaks observed (check Railway metrics)
- [ ] Logs clean (no unexpected errors)

---

## Monitoring Staging

### Railway Dashboard Metrics

Monitor in Railway dashboard:
1. **CPU Usage**: Should stay <50% for normal load
2. **Memory**: Should stay <512MB for normal load
3. **Response Time**: Monitor average latency
4. **Error Rate**: Should be 0% or near 0%

### Supabase Analytics

Monitor in Supabase dashboard:
1. **Database → Reports**: Check query performance
2. **API → Logs**: Monitor service role usage
3. **Storage**: Track audit trail growth

### Log Patterns to Monitor

**✅ Good Patterns** (Success):
```
🧮 Routing to Dr. Elena calculation engine...
✅ Dr. Elena response generated
✅ Calculation recorded
✅ AI response sent to Chatwoot
```

**⚠️ Warning Patterns** (Acceptable):
```
⚠️ Conversation not found in cache
⚠️ Failed to store calculation audit (non-critical)
```

**❌ Error Patterns** (Needs Investigation):
```
❌ AI generation failed
❌ Failed to send message to Chatwoot
❌ Redis connection error (recurring)
❌ OpenAI API error
```

---

## Rollback Plan

If critical issues occur:

### Immediate Rollback (< 2 minutes)

**Option 1: Disable Webhook**
1. Go to Chatwoot → Webhooks
2. Disable or delete the webhook
3. No more requests will route to Dr. Elena

**Option 2: Environment Variable Toggle**
In Railway variables:
```
AI_ENABLE_CALCULATION_EXPLANATIONS=false
```
This disables Dr. Elena routing while keeping other features working.

### Full Rollback (< 5 minutes)

```bash
# Revert to previous deployment
git revert HEAD
git push origin main

# Or redeploy specific commit
railway up --commit <previous-commit-sha>
```

---

## Next Steps After Successful Staging

### 24-Hour Monitoring Period

Monitor for:
1. Any errors in Railway logs
2. Supabase audit trail accuracy
3. Chatwoot conversation quality
4. User feedback (if applicable)

### Collect Metrics

Track these metrics:
```sql
-- Performance metrics
SELECT
  AVG((results->>'maxLoan')::numeric) as avg_loan,
  COUNT(*) as total_calculations,
  COUNT(*) FILTER (WHERE mas_compliant = true) as compliant,
  AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY timestamp)))) as avg_time_between
FROM calculation_audit
WHERE timestamp > NOW() - INTERVAL '24 hours';
```

### Production Readiness Checklist

After 24 hours of successful staging:

- [ ] No critical errors observed
- [ ] Calculations remain 100% MAS compliant
- [ ] Performance within targets (<3s)
- [ ] Audit trail recording reliably
- [ ] Team reviewed and approved
- [ ] Documentation updated with any learnings
- [ ] Production deployment plan confirmed

---

## Support & Documentation

**Reference Documents:**
- Full Integration Docs: `docs/DR_ELENA_INTEGRATION_COMPLETE.md`
- Quick Start Guide: `docs/DR_ELENA_QUICK_START.md`
- Test Plan: `docs/DR_ELENA_STAGING_TEST_PLAN.md`
- Readiness Report: `STAGING_READINESS_REPORT.md`

**Troubleshooting:**
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Chatwoot API: https://www.chatwoot.com/developers/api

**Emergency Contacts:**
- Technical Issues: Check troubleshooting section above
- MAS Compliance: Review `lib/calculations/dr-elena-mortgage.ts`
- Performance Issues: Check Redis/Supabase latency

---

**Deployment Status**: Ready to begin

**Estimated Total Time**: 20-30 minutes

**Confidence Level**: 95%

**Next Action**: Start with Part 1 (Database Migration)

---

*Deployment Guide Version: 1.0*
*Last Updated: 2025-01-17*
*Dr. Elena Version: 2.0.0*
*Platform: Railway*
