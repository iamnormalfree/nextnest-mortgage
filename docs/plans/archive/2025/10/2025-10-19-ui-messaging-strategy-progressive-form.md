---
title: "UI Messaging Strategy: Progressive Form Calculation Audit"
created: 2025-10-19
status: active
phase: Design
priority: critical
tags: [ui, forms, messaging, user-experience, dr-elena-v2]
---

# UI Messaging Strategy: Progressive Form Calculation Audit

## Context

**Critical Issue:** Step 2 instant analysis shows "Based on your income" when income hasn't been collected yet (Step 3).

**Solution:** Two distinct UI cards based on calculationType discriminator

**Implementation:** See `docs/runbooks/forms/INSTANT_ANALYSIS_UI_COMPONENTS.md` for full code

---

## #LCL_EXPORT_CRITICAL: Messaging Architecture

### Two-Phase Educational Journey

**Step 2: Property Feasibility (Pure LTV)**
- Focus: "Can you borrow against THIS property?"
- Data: Property price, type, age, existing properties
- NO mention of income/affordability
- Educational: Explain LTV, down payment, CPF rules

**Step 3: Income Affordability (Full Analysis)**
- Focus: "Can YOU afford this loan?"
- Data: All Step 2 data + income + commitments
- Show progression: LTV limit → Income check → Final approval
- Educational: Explain MSR, TDSR, monthly payment

### Discriminator-Based Rendering Pattern

```typescript
// #LCL_EXPORT_CRITICAL: calculationType discriminator
{instantCalcResult?.calculationType === 'pure_ltv' && (
  <PureLtvCard result={instantCalcResult} formData={formData} />
)}

{instantCalcResult?.calculationType === 'full_analysis' && (
  <FullAnalysisCard result={instantCalcResult} formData={formData} />
)}
```

---

## Component Architecture

### 1. InfoTooltip Component

**Purpose:** Educational tooltips (LTV, MSR, TDSR, CPF, Min Cash, Tenure Caps)

**Design:** Sharp rectangles, Bloomberg colors, accessible (keyboard nav, ARIA labels)

**Implementation:** See runbook for full code

---

### 2. PureLtvCard (Step 2)

**Key messaging:**
- Headline: "Property Feasibility Check"
- Context: "Based on property regulations and LTV limits"
- Next step: "We'll check your income to confirm you can afford this"

**Sections:** Max Loan (LTV), Down Payment (CPF/Cash split), Max Tenure (age-based)

**Implementation:** See runbook for full code

---

### 3. FullAnalysisCard (Step 3)

**Key messaging:**
- Headline: "Income & Affordability Check"
- Success: "Approved Loan Amount" (green) OR "Maximum Available" (red)
- MAS compliance: TDSR/MSR check status (✓/✗)

**Sections:** TDSR Check, MSR Check (if applicable), Monthly Payment, Full Breakdown

**Implementation:** See runbook for full code

---

### 4. Error State Components

- **Step2MissingDataWarning:** Yellow warning if property details incomplete
- **Step3MissingIncomeWarning:** Yellow warning if income not entered
- **AffordabilityFailureGuidance:** Red guidance if TDSR/MSR exceeded

**Implementation:** See runbook for full code

---

## Integration Points

### A. Replace Instant Analysis Rendering (Lines 948-1011)

**Current:** Single card with misleading "Based on your income" message

**New:** Discriminator-based `renderInstantAnalysis()` function

See runbook for full integration code

### B. Deprecate generateUserFriendlySummary() (Lines 456-483)

**Reason:** New system uses inline messaging in cards

**Action:** Return empty string for new calculationType, keep legacy fallback

---

## Props Contracts

```typescript
interface PureLtvResult {
  calculationType: 'pure_ltv'
  maxLoanAmount: number
  ltvPercentage: number
  downPaymentRequired: number
  cpfDownPayment: number
  cashDownPayment: number
  minCashPercent: number
  effectiveTenure: number
  reasonCodes: string[]
  policyRefs: string[]
}

interface FullAnalysisResult {
  calculationType: 'full_analysis'
  maxLoanAmount: number
  tdsrPass: boolean
  msrPass?: boolean
  tdsrUsagePercent: number
  msrUsagePercent?: number
  monthlyPayment: number
  tenure: number
  rate: number
  limitingFactor: 'LTV' | 'TDSR' | 'MSR'
  reasonCodes: string[]
}
```

---

## Design System Compliance

**Colors:** Monochrome (#000, #666, #E5E5E5, #F8F8F8, #FFF) + Semantic (#10B981, #EF4444, #F59E0B)

**Typography:** font-semibold (600), font-normal (400), font-mono (numbers)

**Layout:** Sharp rectangles (NO rounded corners), 1px borders, 8px spacing

---

## Analytics Events

```typescript
// Step 2: 'step2_pure_ltv_shown'
// Step 3: 'step3_full_analysis_shown'
// Tooltip: 'education_tooltip_viewed'
```

See runbook for full event payloads

---

## Files to Modify

### 1. components/forms/ProgressiveFormWithController.tsx

1. Add InfoTooltip component (after imports)
2. Add PureLtvCard component
3. Add FullAnalysisCard component
4. Add error state components
5. Replace lines 948-1011 with renderInstantAnalysis()
6. Update generateUserFriendlySummary() (mark deprecated)

**Full code:** See `docs/runbooks/forms/INSTANT_ANALYSIS_UI_COMPONENTS.md`

### 2. lib/contracts/form-contracts.ts

Add: `export type InstantCalcResult = PureLtvResult | FullAnalysisResult`

---

## Testing Strategy

**Manual:**
- Step 2 Pure LTV (first/second property scenarios)
- Step 3 Full Analysis (pass/fail scenarios)
- Tooltips (hover + click)
- Breakdown expand/collapse
- Error states
- Mobile responsive

**E2E:** See separate test plan

---

## Success Criteria

✅ Step 2 NEVER mentions income

✅ Step 3 shows income-based analysis

✅ calculationType discriminator works

✅ All tooltips implemented

✅ Bloomberg design system followed

✅ WCAG AA accessible

✅ Mobile responsive (320px+)

---

## Dependencies

**Must complete BEFORE:**
- Phase 1a: calculatePureLtvMaxLoan()
- Phase 1b: calculationType discriminator

**Blocks:** Phase 2 (E2E testing), Phase 3 (Production)

---

## Estimated Effort

11 hours (1.5 days)

---

## Implementation Reference

**Full component code, tooltips, integration patterns:**

`docs/runbooks/forms/INSTANT_ANALYSIS_UI_COMPONENTS.md`
