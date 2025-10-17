---
title: nextnest-gate-structure-roundtable
type: report
category: mappings
status: archived
owner: engineering
date: 2025-08-31
---

# 🎯 NEXTNEST GATE STRUCTURE & URGENCY ROUNDTABLE
**Date**: 2025-08-31  
**Purpose**: Achieve absolute consensus on gate structure and urgency field handling

## ⚠️ ABSOLUTE AUTHORITY DECLARATION
**This document is the SINGLE SOURCE OF TRUTH for all lead form implementations.**
- ALL tasks must check this document before any lead form changes
- ALL n8n workflows must align with these specifications
- ALL code implementations must follow these patterns
- NO changes to lead form process without updating this document first

---

## 📊 CURRENT CONFLICTS IDENTIFIED

### 1. **Gate Structure Mismatch**

| Source | Gate 0 | Gate 1 | Gate 2 | Gate 3 |
|--------|--------|--------|--------|--------|
| **AI Plan** (Task 1.3) | Loan type selection (no email) | Basic details + email | Full profile | Financial details |
| **Actual Implementation** | Loan type (completed) | Name + Email only | Phone + loan fields | Financial (optional) |
| **n8n Workflow** | N/A | Minimal (no email/phone) | Email + phone + 3 fields | All 8 required fields |

### 2. **Urgency Field Chaos**

| Loan Type | Current Form Field | n8n Expects | Business Logic |
|-----------|-------------------|-------------|----------------|
| **New Purchase** | `purchaseTimeline` | `urgency` | Timeline makes sense |
| **Refinance** | `lockInStatus` | `urgency` | Lock-in indicates urgency |
| **Equity Loan** | `purpose` | `urgency` | Purpose shows intent |

### 3. **Field Requirements Inconsistency**

**n8n G3 Required Fields**:
```javascript
['name', 'loanType', 'propertyType', 'currentRate', 'outstandingLoan', 'monthlyIncome', 'lockInStatus', 'urgency']
```

**Actual Form Provides**:
- ✅ Common: `name`, `loanType`, `propertyType`, `monthlyIncome`
- ⚠️ Conditional: `currentRate`, `outstandingLoan` (refinance only)
- ❌ Missing: Universal `urgency` field
- ❌ Wrong: `lockInStatus` not available for new purchase

---

## 🤝 ROUNDTABLE CONSENSUS DECISION

After thorough discussion, the team agrees on the following structure:

### ✅ **FINAL GATE STRUCTURE**

#### **Gate 0: Loan Type Selection** ✅
- **Fields**: `loanType` only
- **Purpose**: Zero-friction entry, build trust
- **CTA**: "Get Instant Estimate (No Email Required)"
- **Trust Level**: 0%
- **Status**: Already implemented correctly

#### **Gate 1: Basic Identity** ✅
- **Fields**: `name`, `email`
- **Purpose**: Minimal commitment for AI analysis
- **CTA**: "See Your Personalized Analysis"
- **Trust Level**: 25%
- **Validation**: Name (2+ chars), valid email

#### **Gate 2: Contact & Core Details** ✅
- **Fields**: `phone` + 3-5 loan-specific fields
  - **New Purchase**: `propertyType`, `priceRange`, `purchaseTimeline`
  - **Refinance**: `currentRate`, `outstandingLoan`, `lockInStatus`
  - **Equity**: `propertyValue`, `outstandingLoan`, `purpose`
- **Purpose**: Qualify lead and enable meaningful analysis
- **CTA**: "Get Full Report & Bank Matches"
- **Trust Level**: 50%
- **Validation**: Singapore phone + loan-specific requirements

#### **Gate 3: Financial Profile** ✅
- **Fields**: `monthlyIncome`, `existingCommitments`, optional enhancers
- **Purpose**: Complete qualification for broker consultation
- **CTA**: "Unlock Exclusive Rates & Expert Advice"
- **Trust Level**: 75%
- **Validation**: Income required, others optional

### ✅ **URGENCY FIELD RESOLUTION**

**Decision**: Create computed `urgencyProfile` from loan-specific fields

```typescript
// lib/calculations/urgency-calculator.ts
export interface UrgencyProfile {
  level: 'immediate' | 'soon' | 'planning' | 'exploring'
  score: number // 0-20 for n8n scoring
  source: string // Which field determined urgency
  reason: string // Human-readable explanation
}

export function calculateUrgencyProfile(formData: any): UrgencyProfile {
  const { loanType } = formData
  
  // Map loan-specific fields to unified urgency
  switch(loanType) {
    case 'new_purchase':
      return mapPurchaseTimelineToUrgency(formData.purchaseTimeline)
    
    case 'refinance':
      return mapLockInStatusToUrgency(formData.lockInStatus)
    
    case 'equity_loan':
      return mapPurposeToUrgency(formData.purpose)
    
    default:
      return { 
        level: 'exploring', 
        score: 5, 
        source: 'default',
        reason: 'General inquiry'
      }
  }
}

// Mapping functions
function mapPurchaseTimelineToUrgency(timeline: string): UrgencyProfile {
  const mappings = {
    'this_month': { level: 'immediate', score: 20, reason: 'Purchasing this month' },
    'next_3_months': { level: 'soon', score: 15, reason: 'Purchasing within 3 months' },
    '3_6_months': { level: 'planning', score: 10, reason: 'Planning 3-6 months ahead' },
    'exploring': { level: 'exploring', score: 5, reason: 'Exploring options' }
  }
  return { ...mappings[timeline] || mappings.exploring, source: 'purchaseTimeline' }
}

function mapLockInStatusToUrgency(lockStatus: string): UrgencyProfile {
  const mappings = {
    'ending_soon': { level: 'immediate', score: 20, reason: 'Lock-in period ending' },
    'no_lock': { level: 'soon', score: 15, reason: 'No penalty - can switch anytime' },
    'not_sure': { level: 'soon', score: 12, reason: 'Needs lock-in verification' },
    'locked': { level: 'planning', score: 8, reason: 'Currently in lock-in period' }
  }
  return { ...mappings[lockStatus] || mappings.not_sure, source: 'lockInStatus' }
}

function mapPurposeToUrgency(purpose: string): UrgencyProfile {
  const mappings = {
    'investment': { level: 'immediate', score: 18, reason: 'Time-sensitive investment' },
    'business': { level: 'immediate', score: 18, reason: 'Business capital needs' },
    'personal': { level: 'soon', score: 12, reason: 'Personal financing' },
    'other': { level: 'exploring', score: 8, reason: 'General equity inquiry' }
  }
  return { ...mappings[purpose] || mappings.other, source: 'purpose' }
}
```

---

## 📤 SUBMISSION STRATEGY (CRITICAL)

### **CUMULATIVE SUBMISSION POINTS**

**This is the APPROVED submission strategy - NO DEVIATION ALLOWED**

| Form Gate | Action | Data Sent | n8n Gate | Purpose |
|-----------|--------|-----------|----------|---------|
| **Gate 0** | Store locally only | None | N/A | Loan type selection |
| **Gate 1** | Store locally only | None | N/A | Basic identity capture |
| **Gate 2** | **FIRST SUBMISSION** | Gates 0+1+2 cumulative | **G2** | Preliminary analysis |
| **Gate 3** | **SECOND SUBMISSION** | Gates 0+1+2+3 cumulative | **G3** | Full analysis & PDF |

### **Submission Implementation**

```typescript
// MANDATORY: Only submit at Gates 2 and 3
const handleGateCompletion = async (gate: number, data: any) => {
  switch(gate) {
    case 0:
    case 1:
      // NO SUBMISSION - Store locally only
      updateLocalState(gate, data)
      break
      
    case 2:
      // FIRST SUBMISSION - Cumulative data to n8n G2
      await submitToN8n({
        ...gate0Data,
        ...gate1Data,
        ...data,
        submissionPoint: 'gate2',
        n8nGate: 'G2'
      })
      break
      
    case 3:
      // SECOND SUBMISSION - Complete data to n8n G3
      await submitToN8n({
        ...gate0Data,
        ...gate1Data,
        ...gate2Data,
        ...data,
        submissionPoint: 'gate3',
        n8nGate: 'G3'
      })
      break
  }
}
```

## 🏗️ ARCHITECTURE CLARIFICATION

### **Why Two Implementations?**

**1. TypeScript (`lib/calculations/urgency-calculator.ts`)**
- **Used by**: NextNest frontend and API
- **Purpose**: Real-time form validation, client-side scoring, API enrichment
- **When**: Before data reaches n8n

**2. JavaScript (n8n validation script)**
- **Used by**: n8n workflow nodes
- **Purpose**: Workflow routing, lead scoring, AI analysis
- **When**: After form submission

### **Integration Strategy**

```typescript
// app/api/forms/analyze/route.ts
import { calculateUrgencyProfile } from '@/lib/calculations/urgency-calculator'

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  // Step 1: Calculate urgency in NextNest
  const urgencyProfile = calculateUrgencyProfile(data.formData)
  
  // Step 2: Enrich data before sending to n8n
  const enrichedData = {
    ...data,
    formData: {
      ...data.formData,
      urgencyProfile // Add computed urgency
    }
  }
  
  // Step 3: Send to n8n (which will also calculate to verify)
  const n8nResponse = await callN8nWebhook(enrichedData)
}
```

**Benefits of Dual Implementation**:
- ✅ Frontend gets instant feedback without API calls
- ✅ n8n remains self-contained and testable
- ✅ Cross-validation ensures consistency
- ✅ No external dependencies in n8n workflow

## 🔧 IMPLEMENTATION ACTIONS

### 1. **Update n8n Validation Script**
```javascript
// Phase_2_n8n_Workflow_Setup/06_Validation_Scripts/updated-g3-validation.js

// Add urgency calculation
const urgencyProfile = calculateUrgencyProfile(formData);

// Use in validation
const validation = {
  ...existingValidation,
  urgency: urgencyProfile, // Add computed urgency
  metrics: {
    ...metrics,
    urgencyScore: urgencyProfile.score
  }
};
```

### 2. **Update API Layer**
```typescript
// app/api/forms/analyze/route.ts
import { calculateUrgencyProfile } from '@/lib/calculations/urgency-calculator'

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  // Add urgency profile before sending to n8n
  const enrichedData = {
    ...data,
    urgencyProfile: calculateUrgencyProfile(data.formData)
  }
  
  // Send to n8n with urgency included
  const n8nResponse = await callN8nAnalysis(enrichedData)
}
```

### 3. **Update Lead Scoring**
```typescript
// lib/calculations/mortgage.ts
export function calculateLeadScore(data: LeadCaptureData): number {
  const urgencyProfile = calculateUrgencyProfile(data)
  
  // Use urgency score in calculation
  const urgencyScore = urgencyProfile.score // 0-20 points
  const completenessScore = calculateCompleteness(data) // 0-40 points
  const valueScore = calculateValue(data) // 0-40 points
  
  return urgencyScore + completenessScore + valueScore
}
```

### 4. **Update Type Definitions**
```typescript
// types/mortgage.ts
export interface LeadCaptureData {
  name: string
  email: string
  phone: string
  loanType: 'new_purchase' | 'refinance' | 'equity_loan'
  
  // Loan-specific urgency indicators
  purchaseTimeline?: 'this_month' | 'next_3_months' | '3_6_months' | 'exploring'
  lockInStatus?: 'ending_soon' | 'no_lock' | 'locked' | 'not_sure'
  purpose?: 'investment' | 'business' | 'personal' | 'other'
  
  // Computed field (not user input)
  urgencyProfile?: UrgencyProfile
  
  // ... other fields
}
```

---

## ✅ VALIDATION CHECKLIST

### Gate Progression Validation
- [x] Gate 0 → Gate 1: Only `loanType` required
- [x] Gate 1 → Gate 2: `name` + `email` required
- [x] Gate 2 → Gate 3: `phone` + loan-specific fields required
- [x] Gate 3 → Complete: `monthlyIncome` required

### n8n Compatibility
- [ ] Update validation script to use urgency calculation
- [ ] Test with all three loan types
- [ ] Verify scoring consistency
- [ ] Confirm gate routing works

### Documentation Alignment
- [ ] Update AI Implementation Plan
- [ ] Update Phase 2 n8n documentation
- [ ] Update type definitions
- [ ] Update API documentation

---

## 📈 EXPECTED OUTCOMES

1. **Consistent Gate Structure**: All systems use same 4-gate progression
2. **Smart Urgency Handling**: Context-aware urgency from loan-specific fields
3. **n8n Compatibility**: Seamless integration without field mismatches
4. **Better Lead Scoring**: More accurate urgency signals
5. **Cleaner Codebase**: No contradictions or confusion

---

## 🎬 NEXT STEPS

1. **Immediate** (Today):
   - [ ] Implement urgency calculator function
   - [ ] Update n8n validation script
   - [ ] Test with sample data

2. **Tomorrow**:
   - [ ] Update API endpoints
   - [ ] Test full flow with n8n
   - [ ] Update documentation

3. **This Week**:
   - [ ] Monitor lead quality
   - [ ] Adjust scoring weights
   - [ ] Gather broker feedback

---

**Roundtable Conclusion**: This structure provides clarity, consistency, and compatibility across all systems while maintaining business logic integrity.

**Approved by**: All team members
**Implementation Owner**: Backend Engineer with n8n Specialist support
**Timeline**: Complete by end of week

---

## 🛡️ COMPLIANCE CHECKLIST FOR ALL CHANGES

### **Before ANY Lead Form Change**

#### 1. Gate Structure Compliance
- [ ] Does it follow the 4-gate structure (0-3)?
- [ ] Are the required fields for each gate preserved?
- [ ] Do CTAs match the approved text?
- [ ] Are trust levels correctly displayed?

#### 2. Field Naming Compliance
- [ ] New Purchase: Uses `purchaseTimeline` (not urgency)
- [ ] Refinance: Uses `lockInStatus` (not urgency)
- [ ] Equity: Uses `purpose` (not urgency)
- [ ] All gates: Uses exact field names from this document

#### 3. Validation Logic Compliance
- [ ] Gate 0→1: Only `loanType` required
- [ ] Gate 1→2: `name` + `email` required
- [ ] Gate 2→3: `phone` + loan-specific fields required
- [ ] Gate 3→Complete: `monthlyIncome` required

#### 4. n8n Integration Compliance
- [ ] Urgency calculation included in both TypeScript and n8n script
- [ ] Field mappings match exactly
- [ ] Scoring ranges consistent (0-20 for urgency)
- [ ] Gate detection logic aligned
- [ ] Submission ONLY at Gates 2 and 3 (cumulative data)
- [ ] Gate 2 maps to n8n G2, Gate 3 maps to n8n G3
- [ ] NO submissions at Gates 0 or 1

#### 5. Documentation Compliance
- [ ] This document updated FIRST
- [ ] Implementation plan updated if needed
- [ ] Type definitions match
- [ ] API documentation current

### **Testing Requirements**

```javascript
// Test Data for Each Loan Type
const testCases = {
  new_purchase: {
    gate1: { name: 'Test User', email: 'test@example.com' },
    gate2: { phone: '91234567', propertyType: 'HDB', priceRange: 800000, purchaseTimeline: 'this_month' },
    gate3: { monthlyIncome: 8000, existingCommitments: 2000 },
    expectedUrgency: { level: 'immediate', score: 20 }
  },
  refinance: {
    gate1: { name: 'Test User', email: 'test@example.com' },
    gate2: { phone: '91234567', currentRate: 4.2, outstandingLoan: 500000, lockInStatus: 'ending_soon' },
    gate3: { monthlyIncome: 10000, existingCommitments: 3000 },
    expectedUrgency: { level: 'immediate', score: 20 }
  },
  equity_loan: {
    gate1: { name: 'Test User', email: 'test@example.com' },
    gate2: { phone: '91234567', propertyValue: 1000000, outstandingLoan: 400000, purpose: 'investment' },
    gate3: { monthlyIncome: 12000, existingCommitments: 4000 },
    expectedUrgency: { level: 'immediate', score: 18 }
  }
}
```

### **Code Review Checklist**

**Frontend Changes**:
- [ ] Uses TypeScript urgency calculator
- [ ] Form progression matches gate structure
- [ ] Validation follows gate requirements
- [ ] API calls include urgency profile

**Backend Changes**:
- [ ] API enriches data with urgency
- [ ] Forwards complete data to n8n
- [ ] Error handling for missing fields
- [ ] Logging for debugging

**n8n Workflow Changes**:
- [ ] Validation script calculates urgency
- [ ] Gate routing uses correct thresholds
- [ ] Lead scoring includes urgency
- [ ] AI prompts reference urgency

---

## 📋 QUICK REFERENCE

### Gate Fields at a Glance

```yaml
Gate 0: [loanType]
Gate 1: [name, email]
Gate 2:
  new_purchase: [phone, propertyType, priceRange, purchaseTimeline]
  refinance: [phone, currentRate, outstandingLoan, lockInStatus]
  equity_loan: [phone, propertyValue, outstandingLoan, purpose]
Gate 3: [monthlyIncome, existingCommitments?]
```

### Urgency Mapping

```yaml
HIGH (immediate, 18-20 points):
  - purchaseTimeline: 'this_month'
  - lockInStatus: 'ending_soon'
  - purpose: 'investment' or 'business'

MEDIUM (soon, 12-15 points):
  - purchaseTimeline: 'next_3_months'
  - lockInStatus: 'no_lock' or 'not_sure'
  - purpose: 'personal'

LOW (planning, 8-10 points):
  - purchaseTimeline: '3_6_months'
  - lockInStatus: 'locked'

MINIMAL (exploring, 5-8 points):
  - purchaseTimeline: 'exploring'
  - purpose: 'other'
```

---

## 🚨 VIOLATION PROTOCOL

If any implementation violates this document:
1. **STOP** the deployment immediately
2. **REPORT** to lead architect
3. **REVERT** changes if deployed
4. **UPDATE** this document if legitimate change needed
5. **REVIEW** in next roundtable session

---

**THIS DOCUMENT SUPERSEDES ALL OTHER DOCUMENTATION FOR LEAD FORM STRUCTURE**