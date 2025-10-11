# Dr. Elena Quick Start Guide

## 🚀 5-Minute Setup

### 1. Environment Variables
```env
# Add to .env.local
OPENAI_API_KEY=sk-proj-your-key
REDIS_URL=redis://your-redis-url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### 2. Database Setup
```bash
# Run migration (if not already done)
psql $DATABASE_URL < lib/db/migrations/001_ai_conversations.sql
```

### 3. Test Installation
```bash
# Test pure calculations (no API keys needed)
npx tsx scripts/test-dr-elena-pure-calculations.ts

# Test full integration (requires API keys)
npx tsx scripts/test-dr-elena-integration.ts
```

---

## 📋 How It Works

### User asks a calculation question
```
User: "How much can I borrow with my $6000 monthly income?"
```

### System Flow
1. **Intent Router** classifies message as "calculation_request"
2. **Dr. Elena** runs MAS-compliant calculations
3. **AI Explainer** generates natural language response
4. **Audit Trail** records calculation in Supabase
5. **Chatwoot** sends formatted response to user

### Response Format
```
Based on your S$6,000 monthly income:

📊 **Your Mortgage Snapshot:**
• Max Loan: **S$341,000**
• Monthly Payment: **S$1,426**
• Down Payment: **S$159,000**
• Cash Required: **S$25,000**
• TDSR: 38.33% (limit: 55%)

🔑 **Key Points:**
• MSR (30% rule) is limiting your loan amount for HDB
• You're well within TDSR limits (38% vs 55% max)
• Strong financial position for first property purchase

📌 **Recommended Next Steps:**
1. Get pre-approval to lock in your borrowing capacity
2. Start viewing properties up to S$500,000
3. Prepare your documents for faster processing

What questions do you have about these calculations?
```

---

## 🔧 Common Tasks

### Check if Dr. Elena is Active
```typescript
// In any file
import { drElenaService } from '@/lib/ai/dr-elena-integration-service';

const response = await drElenaService.processCalculationRequest({
  conversationId: 123,
  leadData: {
    name: 'Test User',
    leadScore: 75,
    loanType: 'new_purchase',
    propertyCategory: 'HDB',
    propertyPrice: 500000,
    actualIncomes: [6000],
    existingCommitments: 500,
    age: 30,
    citizenship: 'Citizen',
    propertyCount: 1,
    employmentType: 'employed'
  },
  brokerPersona: calculateBrokerPersona(75, 'HDB', 'new_purchase'),
  userMessage: 'How much can I borrow?'
});

console.log(response.chatResponse);
```

### View Recent Calculations
```sql
-- In Supabase SQL Editor
SELECT
  conversation_id,
  calculation_type,
  (inputs->>'monthlyIncome')::numeric as income,
  (results->>'maxLoan')::numeric as max_loan,
  (results->>'tdsrUsed')::numeric as tdsr,
  mas_compliant,
  timestamp
FROM calculation_audit
ORDER BY timestamp DESC
LIMIT 10;
```

### Check Compliance Rate
```sql
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_calcs,
  COUNT(*) FILTER (WHERE mas_compliant = true) as compliant,
  ROUND(100.0 * COUNT(*) FILTER (WHERE mas_compliant = true) / COUNT(*), 1) as compliance_rate
FROM calculation_audit
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

---

## 🐛 Troubleshooting

### Issue: "Calculation not being triggered"
**Check:**
1. Intent router classification working?
   ```typescript
   const intent = await intentRouter.classifyIntent(message, context);
   console.log('Intent:', intent.category, intent.requiresCalculation);
   ```
2. Is user message too vague? Try: "How much can I borrow?"

### Issue: "Calculations seem wrong"
**Verify:**
1. Input data is correct:
   ```typescript
   console.log('Lead Data:', leadData);
   ```
2. Check MAS compliance flags:
   ```typescript
   console.log('MAS Compliant:', calculation.masCompliant);
   console.log('Warnings:', calculation.warnings);
   ```

### Issue: "Audit trail not saving"
**Debug:**
1. Check Supabase connection
2. Verify conversation exists in `conversations` table
3. Review foreign key constraints

### Issue: "Redis connection error"
**Fix:**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

---

## 📊 Monitoring Dashboard Queries

### Daily Summary
```sql
SELECT
  COUNT(*) as calculations_today,
  COUNT(DISTINCT conversation_id) as unique_conversations,
  AVG((results->>'tdsrUsed')::numeric) as avg_tdsr,
  COUNT(*) FILTER (WHERE mas_compliant = false) as non_compliant
FROM calculation_audit
WHERE timestamp::date = CURRENT_DATE;
```

### Top Property Types
```sql
SELECT
  inputs->>'propertyType' as property_type,
  COUNT(*) as count,
  AVG((results->>'maxLoan')::numeric) as avg_loan
FROM calculation_audit
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY inputs->>'propertyType'
ORDER BY count DESC;
```

### Limiting Factors
```sql
SELECT
  results->>'limitingFactor' as factor,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM calculation_audit
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY results->>'limitingFactor'
ORDER BY count DESC;
```

---

## 🎯 Best Practices

### 1. Always Validate Input
```typescript
if (!leadData.actualIncomes?.[0]) {
  console.warn('Missing income data, using default');
}
```

### 2. Check MAS Compliance
```typescript
if (!result.calculation.masCompliant) {
  console.log('Non-compliant:', result.calculation.warnings);
  // Consider flagging for human review
}
```

### 3. Monitor Performance
```typescript
const start = Date.now();
const result = await drElenaService.processCalculationRequest(request);
console.log(`Dr. Elena response time: ${Date.now() - start}ms`);
```

### 4. Handle Errors Gracefully
```typescript
try {
  const result = await drElenaService.processCalculationRequest(request);
  return result.chatResponse;
} catch (error) {
  console.error('Dr. Elena error:', error);
  return 'I apologize, I\'m having trouble with calculations right now. Let me connect you with a specialist.';
}
```

---

## 📈 Success Metrics

### Target KPIs
- ✅ Response time: <3 seconds
- ✅ MAS compliance: >99%
- ✅ User satisfaction: Measured via handoff rate
- ✅ Cost per calculation: <$0.001

### How to Track
```sql
-- Average response quality (proxy: no immediate handoff)
SELECT
  COUNT(*) as total_calculations,
  COUNT(*) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = ca.conversation_id
    AND c.custom_attributes->>'handoff_triggered' = 'true'
    AND c.custom_attributes->>'handoff_time'::timestamp - ca.timestamp < INTERVAL '2 minutes'
  )) as successful_no_handoff,
  ROUND(100.0 * COUNT(*) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = ca.conversation_id
    AND c.custom_attributes->>'handoff_triggered' = 'true'
  )) / COUNT(*), 1) as success_rate
FROM calculation_audit ca
WHERE timestamp > NOW() - INTERVAL '7 days';
```

---

## 🔐 Security Notes

### Data Privacy
- Calculations stored with conversation_id only
- No PII in calculation_audit table
- Audit trail subject to GDPR/PDPA retention policies

### Access Control
- Use service role key for Supabase (not anon key)
- Redis credentials secured in environment
- OpenAI API key with rate limits

---

## 📞 Support Contacts

### Technical Issues
- Check: `docs/DR_ELENA_INTEGRATION_COMPLETE.md`
- Logs: Check Vercel/deployment logs for errors
- Database: Supabase dashboard → SQL Editor

### MAS Compliance Questions
- Reference: MAS Notice 632 (LTV), Notice 645 (TDSR)
- Formulas: `lib/calculations/dr-elena-mortgage.ts`
- Audit: Query `calculation_audit` table

---

## 🎉 Quick Wins

### Test a Calculation in 30 Seconds
```bash
node -e "
const { calculateMaxLoanAmount } = require('./lib/calculations/dr-elena-mortgage.ts');
console.log(calculateMaxLoanAmount({
  propertyPrice: 500000,
  propertyType: 'HDB',
  monthlyIncome: 6000,
  existingCommitments: 500,
  age: 30,
  citizenship: 'Citizen',
  propertyCount: 1
}));
"
```

### Enable Debug Logging
```typescript
// In .env.local
DEBUG=dr-elena:*

// Will log:
// 🧮 Dr. Elena: Processing calculation for conversation 123
// 📊 Calculation inputs: { ... }
// ✅ Calculation complete: { maxLoan: 341000, ... }
// 💬 AI explanation generated (588 chars)
```

---

*Last Updated: 2025-01-17*
*Version: 2.0.0*
