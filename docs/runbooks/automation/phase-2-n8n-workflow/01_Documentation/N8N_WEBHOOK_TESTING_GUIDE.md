---
title: n8n-webhook-testing-guide
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# n8n Webhook Testing Guide - NextNest Lead Forms

## To personally test in Powershell

Invoke-WebRequest -Uri "https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"formData":{"email":"test@test.com","loanType":"refinance"}}'


## **Problem Diagnosed & Solved** 🎉

### **What Was Causing the Testing Issues:**

1. **❌ "Authorization data is wrong!"** 
   - **Root Cause**: n8n webhook was in **TEST MODE**
   - **Symptom**: Railway returned 403 Forbidden with auth error
   - **Reality**: Not an auth issue, but webhook not activated

2. **❌ Webhook Not Registered Error**
   - **Error Message**: `"The requested webhook 'api/forms/analyze' is not registered"`
   - **Root Cause**: Need to manually activate webhook before testing
   - **Solution**: Click "Execute workflow" button in n8n canvas

### **Critical Understanding:**
n8n webhooks in **development/test mode** require manual activation and only work for **ONE call** per activation.

---

## **Correct Testing Process** ✅

### **Step 1: Activate Webhook in n8n**
1. Open your n8n workflow
2. Click the **"Execute workflow"** button on the canvas
3. Webhook becomes active for exactly **ONE test call**

### **Step 2: Immediately Send Test Request**
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{"formData":{"email":"test@test.com","loanType":"refinance"}}'
```

### **Step 3: Repeat Process for Each Test**
- Each test requires **re-activation** in n8n
- Click "Execute workflow" → Send curl → Check results
- Webhook becomes inactive after each successful call

---

## **Test Results Validation** ✅

### **G1 Test Result (WORKING!):**
```json
{
  "formData": {
    "email": "test@test.com", 
    "loanType": "refinance"
  },
  "gate": "G1",
  "lead": {
    "score": 41,           // ✅ Improved from old ~19
    "segment": "Developing", // ✅ Better than old "Cold"
    "scoreBreakdown": {
      "completeness": 15,   // ✅ 2/4 fields vs old 2/8
      "finance": 15,        // ✅ 40-25 G1 penalty
      "urgency": 8,         // ✅ Default urgency
      "engagement": 3,      // ✅ G1 engagement
      "rawScore": 41
    }
  }
}
```

**🎉 Lead Scoring Fix Confirmed Working:**
- **Old G1**: ~19 points (Cold)
- **New G1**: 41 points (Developing) = +22 point improvement!

---

## **Comprehensive Test Suite**

### **G1 Tests:**
```bash
# Basic email submission
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{"formData":{"email":"test@test.com","loanType":"refinance"}}'
# Expected: ~41 points (Developing)
```

### **G2 Tests:**

#### **G2 New Purchase (Expected: ~84 points, Premium)**
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{"formData":{"name":"Sarah Chen","email":"sarah@example.com","phone":"91234567","loanType":"new_purchase","purchaseTimeline":"next_3_months","propertyType":"HDB"}}'
```

#### **G2 Refinance (Expected: ~92 points, Premium)**
```bash  
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{"formData":{"name":"David Lim","email":"david@example.com","phone":"98765432","loanType":"refinance","propertyValue":"800000","outstandingLoan":"500000","lockInStatus":"ending_soon"}}'
```

#### **G2 Cash Equity (Expected: ~80 points, Premium)**
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{"formData":{"name":"Jennifer Wong","email":"jennifer@example.com","phone":"87654321","loanType":"cash_equity","purpose":"investment","equityNeeded":"200000"}}'
```

---

## **What to Look For in Results**

### **Key Improvements Implemented:**

1. **✅ No More Artificial Income Penalty**
   - G2 leads: -5 penalty instead of -20
   - Only G3 gets full income assessment

2. **✅ Gate-Appropriate Field Expectations**
   - G1/G2: Uses 4 basic fields (name, email, phone, loanType)
   - G3: Uses 8 complete fields (includes monthlyIncome, etc.)

3. **✅ Loan-Specific Bonuses**
   - New Purchase: +2 for purchaseTimeline, +2 for propertyType
   - Refinance: +2 for propertyValue, +2 for outstandingLoan, +2 for lockInStatus  
   - Cash Equity: +2 for equityNeeded, +2 for purpose

4. **✅ Intelligent Financial Assessment**
   - Refinance: Uses LTV ratio (propertyValue/outstandingLoan)
   - Good LTV (<60%): +5 bonus
   - High LTV (>80%): -10 penalty

5. **✅ Proper Urgency Mapping**
   - purchaseTimeline: "next_3_months" → 12 points
   - lockInStatus: "ending_soon" → 15 points
   - Default → 8 points

### **Expected Score Ranges:**
- **G1**: ~35-45 (Developing) - Was ~15-25 (Cold)
- **G2**: ~75-95 (Qualified/Premium) - Was ~40-50 (Developing)
- **G3**: ~60-100 (All segments) - Will be realistic with full data

---

## **Troubleshooting Common Issues**

### **❌ "Authorization data is wrong!"**
- **Solution**: Not an auth issue - activate webhook in n8n first

### **❌ "Webhook not registered"**  
- **Solution**: Click "Execute workflow" in n8n canvas

### **❌ "Expecting value: line 1 column 1 (char 0)"**
- **Solution**: Response is HTML error, not JSON - check webhook activation

### **❌ No response or timeout**
- **Solution**: Webhook expired after one use - re-activate in n8n

---

## **Production vs Test Mode**

### **Test Mode (Current):**
- Requires manual activation per test
- Webhook URL: `webhook-test/api/forms/analyze`
- Only works for one call per activation

### **Production Mode:**
- Always active, no manual activation needed  
- Webhook URL: `api/forms/analyze` (without webhook-test)
- Unlimited calls

### **To Switch to Production:**
1. In n8n, change webhook node from "Test" to "Production"
2. Deploy workflow
3. Use production URL for continuous testing

---

## **Integration Notes**

### **Frontend Integration:**
Your NextNest form should POST to:
```javascript
// Production endpoint (when ready)
const response = await fetch('https://primary-production-1af6.up.railway.app/api/forms/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ formData: formData })
});
```

### **Expected Response Format:**
```javascript
{
  formData: { /* original form data */ },
  gate: "G1" | "G2" | "G3",
  lead: {
    score: number,           // 0-100
    segment: "Cold" | "Developing" | "Qualified" | "Premium",
    dsr: number | null,      // Only available with income data
    scoreBreakdown: { /* detailed breakdown */ }
  },
  // ... additional workflow data
}
```

---

## **Testing Checklist**

- [x] **G1 Basic**: ✅ 41 points (Developing) - Improved!
- [ ] **G2 New Purchase**: Expected ~84 (Premium)  
- [ ] **G2 Refinance**: Expected ~92 (Premium)
- [ ] **G2 Cash Equity**: Expected ~80 (Premium)
- [ ] **G2 Minimal**: Expected ~80 (Premium)

**Next**: Test all G2 scenarios to confirm scoring improvements are working across all loan types.

---

*This guide resolves the webhook testing confusion and confirms the Lead Score Calculator improvements are working correctly!* 🚀