---
title: roundtable-progressive-form-n8n-integration
status: archived
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Historical plan archived from Phase 1 consolidation. Reference only; launch `/response-awareness` if reviving.

# 🚨 EMERGENCY ROUNDTABLE: Progressive Form vs n8n Integration Strategy
**Date**: 2025-08-31  
**Priority**: CRITICAL  
**Purpose**: Define when and how n8n webhooks are triggered in progressive form flow

---

## 🔴 THE CRITICAL ISSUE

### Current Confusion:
1. **Progressive Form**: Has 4 gates (0-3) with incremental data collection
2. **n8n Workflow**: Expects different gate structure (G1, G2, G3)
3. **Webhook Timing**: When should we call n8n? After each gate? Only at completion?
4. **Calculation Location**: Where should lead scoring happen? Frontend? API? n8n?

### The Core Problem:
**"Gate 1 in n8n requires Gate 0 + Gate 1 data from the form, but the form submits progressively"**

---

## 👥 ROUNDTABLE PARTICIPANTS

- **Frontend Architect**: Progressive form behavior
- **Backend Engineer**: API and webhook integration
- **n8n Specialist**: Workflow requirements
- **Product Owner**: Business logic requirements
- **Security Engineer**: Data transmission concerns

---

## 📊 CURRENT IMPLEMENTATION ANALYSIS

### Frontend Form Flow:
```typescript
// components/forms/IntelligentMortgageForm.tsx
Gate 0: Loan Type Selection → No API call
Gate 1: Name + Email → onGateCompletion(1, data)
Gate 2: Phone + Loan Details → onGateCompletion(2, data)
Gate 3: Financial Info → onGateCompletion(3, data)
```

### Current Handler (Does Nothing with n8n):
```typescript
const handleGateCompletion = (gate: number, data: any) => {
  console.log(`✅ Gate ${gate} completed with data:`, data)
  // HERE: Should we call n8n? When?
}
```

### n8n Expectations:
```javascript
// n8n workflow expects:
G1: Minimal data (no meaningful analysis)
G2: Email + phone + 3 fields (can do basic analysis)
G3: All required fields (full analysis)
```

---

## 🎯 ROUNDTABLE CONSENSUS DECISION

After thorough discussion, the team agrees on the following architecture:

### ✅ **DECISION: CUMULATIVE SUBMISSION STRATEGY**

**Principle**: Send cumulative data to n8n at strategic points, not after every gate.

### **Submission Points:**

#### **1. NO SUBMISSION at Gate 0**
- **Why**: Only loan type selected, no user data
- **Action**: Store locally, no API call

#### **2. NO SUBMISSION at Gate 1** 
- **Why**: Only name + email, insufficient for analysis
- **Action**: Store locally, show client-side feedback

#### **3. FIRST SUBMISSION at Gate 2**
- **Why**: Have email + phone + loan details (maps to n8n G2)
- **Data Sent**: Cumulative (Gate 0 + 1 + 2 data)
- **n8n Response**: Basic analysis, lead scoring, preliminary insights

#### **4. SECOND SUBMISSION at Gate 3**
- **Why**: Complete profile (maps to n8n G3)
- **Data Sent**: All cumulative data
- **n8n Response**: Full analysis, PDF generation, broker notification

### **Implementation Architecture:**

```typescript
// components/forms/IntelligentMortgageForm.tsx - UPDATED
interface FormState {
  gate0Data: { loanType: string }
  gate1Data: { name: string, email: string }
  gate2Data: { phone: string, ...loanSpecificFields }
  gate3Data: { monthlyIncome: number, existingCommitments?: number }
}

const handleGateCompletion = async (gate: number, data: any) => {
  // Accumulate data
  switch(gate) {
    case 0:
      setFormState(prev => ({ ...prev, gate0Data: data }))
      // No API call
      break
      
    case 1:
      setFormState(prev => ({ ...prev, gate1Data: data }))
      // No API call - insufficient data
      break
      
    case 2:
      setFormState(prev => ({ ...prev, gate2Data: data }))
      // FIRST n8n SUBMISSION - Have enough for G2 analysis
      await submitToN8n({
        ...formState.gate0Data,
        ...formState.gate1Data,
        ...data,
        submissionPoint: 'gate2',
        n8nGate: 'G2'
      })
      break
      
    case 3:
      setFormState(prev => ({ ...prev, gate3Data: data }))
      // SECOND n8n SUBMISSION - Complete profile
      await submitToN8n({
        ...formState.gate0Data,
        ...formState.gate1Data,
        ...formState.gate2Data,
        ...data,
        submissionPoint: 'gate3',
        n8nGate: 'G3'
      })
      break
  }
}

async function submitToN8n(cumulativeData: any) {
  // Calculate urgency profile BEFORE sending
  const urgencyProfile = calculateUrgencyProfile(cumulativeData)
  
  // Calculate lead score BEFORE sending
  const leadScore = calculateLeadScore(cumulativeData)
  
  // Send enriched data to API
  const response = await fetch('/api/forms/analyze', {
    method: 'POST',
    body: JSON.stringify({
      formData: {
        ...cumulativeData,
        urgencyProfile,  // Pre-calculated
        leadScore        // Pre-calculated
      },
      metadata: {
        sessionId,
        submissionPoint: cumulativeData.submissionPoint,
        timestamp: new Date().toISOString()
      }
    })
  })
  
  // Handle n8n response
  const result = await response.json()
  if (result.insights) {
    handleAIInsight(result.insights)
  }
  if (result.leadScore) {
    handleScoreUpdate(result.leadScore)
  }
}
```

---

## 🏗️ CALCULATION LOCATION STRATEGY

### **WHERE CALCULATIONS HAPPEN:**

#### **1. Frontend (Immediate Feedback)**
```typescript
// lib/calculations/urgency-calculator.ts
// lib/calculations/mortgage.ts
- Urgency calculation ✅
- Basic lead scoring ✅
- TDSR/MSR estimates ✅
- Monthly payment calculation ✅
```
**Benefits**: Instant feedback, no API latency, better UX

#### **2. API Layer (Enrichment)**
```typescript
// app/api/forms/analyze/route.ts
- Validate frontend calculations ✅
- Add server-side enrichments ✅
- Prepare data for n8n ✅
- Handle fallback logic ✅
```
**Benefits**: Security, validation, centralized logic

#### **3. n8n Workflow (Processing)**
```javascript
// n8n validation scripts
- Re-calculate for verification ✅
- Route based on score ✅
- Trigger automations ✅
- Generate reports ✅
```
**Benefits**: Workflow automation, integration with external systems

---

## 📋 IMPLEMENTATION CHECKLIST

### **Immediate Actions:**

1. **Update IntelligentMortgageForm.tsx**
   - [ ] Add cumulative state management
   - [ ] Implement submission at Gate 2 and 3 only
   - [ ] Add loading states during submission
   - [ ] Handle n8n responses appropriately

2. **Update API Endpoint**
   - [ ] Accept submission point metadata
   - [ ] Map form gates to n8n gates
   - [ ] Return appropriate responses per gate
   - [ ] Log submission patterns

3. **Update n8n Workflow**
   - [ ] Handle G2 submissions (partial data)
   - [ ] Handle G3 submissions (complete data)
   - [ ] Return different responses based on gate
   - [ ] Track conversion between G2 and G3

### **Testing Requirements:**

```javascript
// Test Case 1: Gate 2 Submission
{
  formData: {
    loanType: 'new_purchase',
    name: 'Test User',
    email: 'test@example.com',
    phone: '91234567',
    propertyType: 'HDB',
    priceRange: 800000,
    purchaseTimeline: 'this_month'
  },
  metadata: {
    submissionPoint: 'gate2',
    n8nGate: 'G2'
  }
}
// Expected: Basic analysis, preliminary score

// Test Case 2: Gate 3 Submission
{
  formData: {
    // ... all gate 2 data plus:
    monthlyIncome: 8000,
    existingCommitments: 2000
  },
  metadata: {
    submissionPoint: 'gate3',
    n8nGate: 'G3'
  }
}
// Expected: Full analysis, PDF generation triggered
```

---

## 🎯 KEY BENEFITS OF THIS APPROACH

1. **Reduced API Calls**: Only 2 submissions instead of 4
2. **Meaningful Analysis**: n8n only processes when sufficient data exists
3. **Better UX**: Users get feedback at right moments
4. **Clear Mapping**: Form gates 0+1+2 = n8n G2, Form gates 0+1+2+3 = n8n G3
5. **Flexibility**: Can adjust submission points without breaking flow

---

## ⚠️ CRITICAL CONSIDERATIONS

### **Data Privacy**
- Only send data when user expects it (after meaningful input)
- Clear consent before first submission (Gate 2)
- PDPA compliance maintained

### **Performance**
- Frontend calculations prevent blocking
- API calls only when necessary
- n8n processes meaningful data only

### **Error Handling**
```typescript
// Fallback strategy if n8n fails
if (!n8nResponse.success) {
  // Use frontend calculations
  const fallbackScore = calculateLeadScore(formData)
  const fallbackUrgency = calculateUrgencyProfile(formData)
  
  // Store for retry
  await storeForRetry(formData)
  
  // Continue with local calculations
  return { score: fallbackScore, urgency: fallbackUrgency }
}
```

---

## 📊 DECISION MATRIX

| Approach | Pros | Cons | Score |
|----------|------|------|-------|
| **Submit Every Gate** | Real-time tracking | Too many API calls, n8n overhead | 3/10 |
| **Submit Only at End** | Simple, one call | No intermediate insights, late scoring | 5/10 |
| **Submit at Gate 2 & 3** ✅ | Balanced, meaningful data | Slightly complex state management | 9/10 |
| **Calculate Everything in n8n** | Centralized logic | No instant feedback, API dependent | 4/10 |
| **Calculate Everything Frontend** | Instant, no latency | Security concerns, no automation | 6/10 |
| **Hybrid Calculation** ✅ | Best of both worlds | Requires sync between systems | 9/10 |

---

## 🚀 FINAL RECOMMENDATION

**Adopt the Cumulative Submission Strategy with Hybrid Calculations:**

1. **Gates 0-1**: Collect locally, no submission
2. **Gate 2**: First submission with cumulative data → n8n G2
3. **Gate 3**: Second submission with all data → n8n G3
4. **Calculations**: Frontend for instant feedback, validated by backend, processed by n8n

**This architecture provides the best balance of performance, user experience, and system efficiency.**

---

**Roundtable Verdict**: APPROVED UNANIMOUSLY  
**Implementation Owner**: Frontend Architect with Backend Engineer support  
**Timeline**: Implement by end of week  
**Review Date**: One week post-implementation