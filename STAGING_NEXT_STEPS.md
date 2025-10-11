# 🎯 Staging Test - Next Steps

**Status**: Ready to Deploy to Staging
**Date**: 2025-01-17
**Dr. Elena Version**: 2.0.0

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Local Tests First

**Windows (PowerShell)**:
```powershell
.\scripts\test-staging-quick.ps1
```

**Linux/Mac**:
```bash
chmod +x scripts/test-staging-quick.sh
./scripts/test-staging-quick.sh
```

This will verify:
- ✅ Environment variables configured
- ✅ Redis connection working
- ✅ Pure calculations passing
- ✅ Integration tests passing

**Expected Output**:
```
🚀 Dr. Elena Staging Quick Test
================================
✅ PASS: All required environment variables set
✅ PASS: Redis connection successful
✅ PASS: Pure calculations working correctly
✅ PASS: Integration tests passed

🎉 All automated tests passed!
```

---

### Step 2: Deploy to Staging

Choose your deployment platform:

#### Option A: Vercel
```bash
# Set environment variables in Vercel dashboard first
vercel --prod --env=staging

# Or use Vercel CLI to set env vars
vercel env add OPENAI_API_KEY staging
vercel env add REDIS_URL staging
# ... (add all required vars)
```

#### Option B: Railway
```bash
# Set environment variables in Railway dashboard
railway up --environment staging
```

#### Option C: Docker
```bash
# Build and deploy with env file
docker build -t nextnest-staging .
docker run -d \
  --env-file .env.staging \
  -p 3000:3000 \
  nextnest-staging
```

---

### Step 3: Run Database Migration

**In Supabase Dashboard (Staging Project)**:

1. Navigate to: SQL Editor
2. Copy contents of `lib/db/migrations/001_ai_conversations.sql`
3. Run the migration
4. Verify tables created:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('conversations', 'conversation_turns', 'calculation_audit');
   ```

**Expected Result**: 3 tables shown

---

### Step 4: Test Chatwoot Integration

#### Manual Test via Chatwoot Dashboard

1. **Configure Webhook**:
   - Go to: Chatwoot Settings → Integrations → Webhooks
   - Add webhook: `https://your-staging-url.com/api/chatwoot-ai-webhook`
   - Subscribe to: `message_created`

2. **Create Test Conversation**:
   - Contact name: "Test User"
   - Add custom attributes (via API or manually):
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

3. **Send Test Messages**:

   **Test 1: Simple calculation**
   ```
   User: "How much can I borrow?"
   Expected: AI responds with max loan ~$341,000 within 3 seconds
   ```

   **Test 2: Specific question**
   ```
   User: "What's my TDSR?"
   Expected: AI responds with TDSR explanation ~38%
   ```

   **Test 3: General question**
   ```
   User: "What interest rates do you have?"
   Expected: AI responds with current rate ranges
   ```

4. **Verify Response Quality**:
   - ✅ Response within 3 seconds
   - ✅ Contains actual calculation numbers
   - ✅ Mentions limiting factor (MSR for HDB)
   - ✅ Includes next steps
   - ✅ Tone matches broker persona (balanced/Sarah Wong for score 75)

---

### Step 5: Verify Audit Trail

**In Supabase Dashboard**:

1. Go to: Table Editor → `calculation_audit`

2. Check recent record exists:
   ```sql
   SELECT
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

3. **Verify**:
   - ✅ Record appears within 1 second of sending message
   - ✅ `mas_compliant` = true
   - ✅ `max_loan` = ~341000
   - ✅ `limiting_factor` = "MSR"
   - ✅ `tdsr` = ~38.33

---

## 📊 Success Criteria

**Stage is ready for production when**:

### Automated Tests
- [x] Pure calculations: 100% pass rate
- [x] Integration tests: 100% pass rate
- [ ] Local environment validated

### Staging Environment
- [ ] Deployed to staging successfully
- [ ] Environment variables configured
- [ ] Database migration completed

### Functional Tests
- [ ] Chatwoot webhook responding <3s
- [ ] Calculations accurate (match test results)
- [ ] Audit trail recording correctly
- [ ] Redis caching working (check logs)
- [ ] Error handling graceful (no crashes)

### Performance
- [ ] Average response time <3s
- [ ] P95 response time <5s
- [ ] No memory leaks observed
- [ ] Logs clean (no unexpected errors)

### Team Review
- [ ] Technical review completed
- [ ] MAS compliance verified
- [ ] Documentation reviewed

---

## 🔍 Monitoring Staging

### Watch Logs in Real-Time

**Vercel**:
```bash
vercel logs --follow
```

**Railway**:
```bash
railway logs --follow
```

**Docker**:
```bash
docker logs -f container-name
```

### Key Log Patterns to Look For

**✅ Success Indicators**:
```
🧮 Routing to Dr. Elena calculation engine...
✅ Dr. Elena response generated (588 chars)
✅ Calculation recorded: xxx (Type: max_loan, Max Loan: $341,000)
📤 Sending AI message to Chatwoot
✅ AI response sent to Chatwoot: { messageId: 12345 }
```

**⚠️ Warning Signs** (acceptable):
```
⚠️ Conversation 999999 not found in cache
⚠️ Failed to store calculation audit (non-critical)
```

**❌ Error Signs** (needs investigation):
```
❌ AI generation failed
❌ Failed to send message to Chatwoot
❌ Redis connection error (recurring)
```

---

## 🐛 Troubleshooting Guide

### Issue: "Environment variable not configured"

**Solution**:
1. Check `.env.staging` or platform environment settings
2. Verify all required vars are set:
   - `OPENAI_API_KEY`
   - `REDIS_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `CHATWOOT_*` variables
3. Restart staging deployment after setting vars

---

### Issue: "Calculations not appearing in Supabase"

**Diagnosis**:
```sql
-- Check if table exists
SELECT COUNT(*) FROM calculation_audit;

-- Check table structure
\d calculation_audit
```

**Solutions**:
1. Run migration again (idempotent)
2. Check `SUPABASE_SERVICE_KEY` is correct (not anon key)
3. Verify RLS policies allow service role access

---

### Issue: "No response from webhook"

**Diagnosis**:
1. Check webhook URL is correct in Chatwoot
2. Verify staging URL is accessible publicly
3. Check Chatwoot webhook logs for errors

**Solutions**:
1. Test webhook directly with curl:
   ```bash
   curl -X POST https://your-staging-url.com/api/chatwoot-ai-webhook \
     -H "Content-Type: application/json" \
     -d @scripts/test-webhook.json
   ```
2. Check firewall/CORS settings
3. Verify Next.js API route is deployed

---

### Issue: "Response too slow (>5s)"

**Check**:
1. Redis latency: `redis-cli -u $REDIS_URL --latency`
2. Supabase latency: Check dashboard metrics
3. OpenAI API latency: Check OpenAI status page

**Solutions**:
1. Move Redis closer to app (same region)
2. Use connection pooling for Supabase
3. Implement timeout on OpenAI calls (already done)

---

## 📈 Performance Baselines

After staging tests, record these metrics:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Pure calculation time | <50ms | ___ | ⏳ |
| With AI explanation | <2s | ___ | ⏳ |
| Total webhook response | <3s | ___ | ⏳ |
| Audit trail storage | <500ms | ___ | ⏳ |
| Redis cache hit rate | >80% | ___ | ⏳ |
| MAS compliance rate | 100% | ___ | ⏳ |

---

## 🎉 Staging Sign-Off

**When all checks pass**:

1. **Update status**:
   ```bash
   git add docs/DR_ELENA_STAGING_TEST_PLAN.md
   git commit -m "test: Dr. Elena staging validation complete"
   ```

2. **Create deployment ticket**:
   - Title: "Deploy Dr. Elena to Production"
   - Include: Staging test results
   - Attach: Performance metrics

3. **Schedule production deployment**:
   - Choose low-traffic time
   - Have rollback plan ready
   - Monitor first 100 messages closely

---

## 📞 Need Help?

**Quick References**:
- Full test plan: `docs/DR_ELENA_STAGING_TEST_PLAN.md`
- Quick start guide: `docs/DR_ELENA_QUICK_START.md`
- Technical docs: `docs/DR_ELENA_INTEGRATION_COMPLETE.md`
- Troubleshooting: `docs/DR_ELENA_QUICK_START.md` (Troubleshooting section)

**Common Issues**:
- Calculation errors → Review `lib/calculations/dr-elena-mortgage.ts`
- Integration errors → Check `lib/ai/dr-elena-integration-service.ts`
- Webhook errors → Review `app/api/chatwoot-ai-webhook/route.ts`

---

## ✅ Checklist Summary

**Before proceeding to production**:

1. Local Tests
   - [x] Pure calculations: 100% pass
   - [x] Integration tests: 100% pass
   - [ ] Quick test script passes

2. Staging Deployment
   - [ ] Deployed successfully
   - [ ] Environment variables set
   - [ ] Database migration run

3. Functional Validation
   - [ ] Webhook responding <3s
   - [ ] Calculations accurate
   - [ ] Audit trail working
   - [ ] Error handling graceful

4. Performance Validation
   - [ ] Metrics within targets
   - [ ] No memory leaks
   - [ ] Logs clean

5. Team Sign-Off
   - [ ] Technical review done
   - [ ] Compliance verified
   - [ ] Ready for production

---

**Status**: ⏳ Ready to begin staging tests

**Next Action**: Run `.\scripts\test-staging-quick.ps1` (Windows) or `./scripts/test-staging-quick.sh` (Linux/Mac)

---

*Last Updated: 2025-01-17*
*Dr. Elena Version: 2.0.0*
