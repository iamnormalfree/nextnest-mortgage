# Function Usage Audit Plan

**Date:** 2025-10-18
**Status:** Active
**Priority:** Medium
**Context:** After migrating calculateIWAA, getPlaceholderRate, calculateRefinancingSavings from mortgage.ts to instant-profile.ts

---

## Purpose

Audit all usage of the 3 migrated utility functions to ensure they're being used optimally in production code and identify any opportunities to leverage them in active work.

---

## Functions to Audit

### 1. `calculateIWAA(ages: number[], incomes: number[])`
**Purpose:** Income-Weighted Average Age calculation
**Use Case:** Determining maximum loan tenure based on multiple borrowers' ages and incomes
**Location:** `lib/calculations/instant-profile.ts:846-855`

### 2. `getPlaceholderRate(propertyType: string, loanType: string)`
**Purpose:** Get default interest rates by property type
**Returns:** Default rates (HDB: 2.3%, Private: 2.8%, Commercial: 3.2%)
**Location:** `lib/calculations/instant-profile.ts:862-870`

### 3. `calculateRefinancingSavings(currentRate, outstandingLoan, remainingTenure, propertyValue?)`
**Purpose:** Simplified refinance savings calculator
**Note:** Different from `calculateRefinanceOutlook()` (more comprehensive)
**Location:** `lib/calculations/instant-profile.ts:878-916`

---

## Current Known Usage

### Production Code
- ✅ `hooks/useProgressiveFormController.ts` - All 3 functions imported and used

### Archived Code
- All archived files updated to import from `lib/calculations/archive/2025-10/mortgage.ts`

---

## Audit Tasks

### Task 1: Search for Potential Usage Opportunities
**Check if these functions could be used in:**
- [x] `components/forms/ProgressiveFormWithController.tsx`
- [x] `components/forms/sections/Step3NewPurchase.tsx`
- [x] `components/forms/sections/Step3Refinance.tsx`
- [x] `lib/calculations/instant-profile.ts` (internal usage)
- [x] Active plans in `docs/plans/active/`

**Search patterns:**
```bash
# Look for age-related calculations that could use calculateIWAA
grep -r "combinedAge\|age.*income\|income.*age" components/ hooks/ lib/ --include="*.ts" --include="*.tsx"

# Look for hardcoded rates that could use getPlaceholderRate
grep -r "2\.3\|2\.8\|3\.2.*rate\|rate.*2\.[0-9]" components/ hooks/ lib/ --include="*.ts" --include="*.tsx"

# Look for manual refinance calculations that could use calculateRefinancingSavings
grep -r "refinanc.*saving\|monthlySavings\|currentRate.*newRate" components/ hooks/ lib/ --include="*.ts" --include="*.tsx"
```

### Task 2: Check Active Plans
Review active plans to see if any could benefit from these functions:
- [x] `2025-11-01-lead-form-chat-handoff-optimization-plan.md`
- [x] `2025-10-28-progressive-form-restoration-implementation-plan.md`
- [x] `2025-10-17-lead-form-conversion-optimization-path2.md`

### Task 3: Document Findings
Create usage report:
- [x] Current usage count
- [x] Potential usage opportunities
- [x] Recommendations for leveraging these utilities

---

## Audit Findings (Completed: 2025-10-18)

### Function 1: `calculateIWAA()` - Income-Weighted Average Age

**Current Usage:**
- ✅ `hooks/useProgressiveFormController.ts` - Imported and used in production

**Potential Usage Opportunities Found:** 0

**Analysis:**
- Searched for patterns: `combinedAge`, `age.*income`, `income.*age`
- Found 50+ references to `combinedAge` field usage across codebase
- **NONE require IWAA calculation** - all are simple field reads/writes for single applicants
- Joint applicant age handling uses simple array indexing (`actualAges[0]`, `actualAges[1]`)
- No manual age weighting calculations found

**Recommendation:** LOW PRIORITY
- Function is correctly placed and used only where needed
- No refactoring opportunities identified
- Keep as specialized utility for joint applicant scenarios

---

### Function 2: `getPlaceholderRate()` - Default Interest Rate by Property Type

**Current Usage:**
- ✅ `hooks/useProgressiveFormController.ts` - Imported and used in production
- ✅ `lib/calculations/instant-profile.ts:864-870` - Function definition with rates table

**Potential Usage Opportunities Found:** 3 (HIGH PRIORITY)

#### Opportunity 1: `lib/validation/dynamic-g3-validation.ts:126`
**File:** `C:\Users\HomePC\Desktop\Code\NextNest\lib\validation\dynamic-g3-validation.ts`
**Lines:** 124-128
**Current Code:**
```typescript
if (currentRate > 0 && outstanding > 0 && currentRate > 2.8) {
  const currentMonthly = outstanding * (currentRate / 100 / 12)
  const newMonthly = outstanding * (2.8 / 100 / 12) // Assume market rate of 2.8%
  potentialSavings = Math.round(currentMonthly - newMonthly)
}
```
**Issue:** Hardcoded `2.8%` assumption (should be `2.6%` for refinance per getPlaceholderRate)
**Fix:**
```typescript
import { getPlaceholderRate } from '@/lib/calculations/instant-profile'

const marketRate = getPlaceholderRate(formData.propertyType || 'Private', 'refinance')
const newMonthly = outstanding * (marketRate / 100 / 12)
```
**Impact:** More accurate refinance savings estimates in G3 validation
**Priority:** HIGH - Affects AI insights accuracy

#### Opportunity 2: `components/forms/ProgressiveFormWithController.tsx:866`
**File:** `C:\Users\HomePC\Desktop\Code\NextNest\components\forms\ProgressiveFormWithController.tsx`
**Lines:** 866-871
**Current Code:**
```typescript
const calculateMonthlyPayment = (loanAmount: number, rate: number = 2.8, years: number = 25) => {
  const monthlyRate = rate / 100 / 12
  const months = years * 12
  const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
  return Math.round(monthlyPayment)
}
```
**Issue:** Hardcoded `2.8%` default (should vary by property type)
**Fix:**
```typescript
import { getPlaceholderRate } from '@/lib/calculations/instant-profile'

const calculateMonthlyPayment = (
  loanAmount: number,
  propertyType: string = 'Private',
  loanType: string = 'new_purchase',
  years: number = 25
) => {
  const rate = getPlaceholderRate(propertyType, loanType)
  const monthlyRate = rate / 100 / 12
  // ... rest of calculation
}
```
**Impact:** Dynamic rate assumptions in instant analysis UI
**Priority:** MEDIUM - Improves UX accuracy but not blocking

#### Opportunity 3: `app/api/ai-insights/route.ts:107`
**File:** `C:\Users\HomePC\Desktop\Code\NextNest\app\api\ai-insights\route.ts`
**Lines:** 106-114
**Current Code:**
```typescript
if (formData.currentRate && formData.currentRate > 3.2) {
  const potentialSavings = Math.round((formData.currentRate - 3.0) * formData.outstandingLoan / 100 / 12)
  insights.push({
    type: 'rate_opportunity',
    title: 'High Savings Potential Detected',
    message: `Your ${formData.currentRate}% rate is ${(formData.currentRate - 3.0).toFixed(1)}% above current market rates.`,
    // ...
  })
}
```
**Issue:** Hardcoded `3.0%` market rate assumption
**Fix:**
```typescript
import { getPlaceholderRate } from '@/lib/calculations/instant-profile'

const marketRate = getPlaceholderRate(formData.propertyType || 'Private', 'refinance')
if (formData.currentRate && formData.currentRate > marketRate) {
  const potentialSavings = Math.round((formData.currentRate - marketRate) * formData.outstandingLoan / 100 / 12)
  insights.push({
    type: 'rate_opportunity',
    title: 'High Savings Potential Detected',
    message: `Your ${formData.currentRate}% rate is ${(formData.currentRate - marketRate).toFixed(1)}% above current market rates.`,
    // ...
  })
}
```
**Impact:** More accurate AI insights for different property types
**Priority:** HIGH - Affects AI broker recommendations

**Recommendation:** HIGH PRIORITY
- Replace all 3 hardcoded rate assumptions with `getPlaceholderRate()`
- Consolidates rate defaults to single source of truth
- Estimated effort: 30 minutes across 3 files

---

### Function 3: `calculateRefinancingSavings()` - Simplified Refinance Calculator

**Current Usage:**
- ✅ `hooks/useProgressiveFormController.ts:21` - Imported and used in production

**Potential Usage Opportunities Found:** 2 (MEDIUM PRIORITY)

#### Opportunity 1: `lib/validation/dynamic-g3-validation.ts:122-128`
**File:** `C:\Users\HomePC\Desktop\Code\NextNest\lib\validation\dynamic-g3-validation.ts`
**Lines:** 122-128
**Current Code:**
```typescript
// Potential Savings (for refinance)
let potentialSavings = null
if (currentRate > 0 && outstanding > 0 && currentRate > 2.8) {
  const currentMonthly = outstanding * (currentRate / 100 / 12)
  const newMonthly = outstanding * (2.8 / 100 / 12)
  potentialSavings = Math.round(currentMonthly - newMonthly)
}
```
**Issue:** Manual calculation duplicates logic from `calculateRefinancingSavings()`
**Fix:**
```typescript
import { calculateRefinancingSavings, getPlaceholderRate } from '@/lib/calculations/instant-profile'

let potentialSavings = null
if (currentRate > 0 && outstanding > 0) {
  const propertyType = formData.propertyType || 'Private'
  const remainingTenure = Number(formData.yearsRemaining) || 20
  const savings = calculateRefinancingSavings(currentRate, outstanding, remainingTenure)
  potentialSavings = savings.monthlySavings
}
```
**Impact:** Consistent refinance savings calculation logic
**Priority:** MEDIUM - Nice-to-have, not blocking

#### Opportunity 2: `app/api/ai-insights/route.ts:106-114`
**File:** `C:\Users\HomePC\Desktop\Code\NextNest\app\api\ai-insights\route.ts`
**Lines:** 106-114
**Current Code:**
```typescript
if (formData.currentRate && formData.currentRate > 3.2) {
  const potentialSavings = Math.round((formData.currentRate - 3.0) * formData.outstandingLoan / 100 / 12)
  insights.push({
    type: 'rate_opportunity',
    value: `SGD ${potentialSavings.toLocaleString()}/month`,
    data: { monthlySavings: potentialSavings, yearlyTotal: potentialSavings * 12 },
    // ...
  })
}
```
**Issue:** Overly simplistic savings calculation (missing break-even, lifetime savings)
**Fix:**
```typescript
import { calculateRefinancingSavings } from '@/lib/calculations/instant-profile'

if (formData.currentRate && formData.outstandingLoan) {
  const remainingTenure = Number(formData.yearsRemaining) || 20
  const savings = calculateRefinancingSavings(
    formData.currentRate,
    formData.outstandingLoan,
    remainingTenure,
    formData.propertyValue
  )

  if (savings.worthRefinancing) {
    insights.push({
      type: 'rate_opportunity',
      value: `SGD ${savings.monthlySavings.toLocaleString()}/month`,
      data: {
        monthlySavings: savings.monthlySavings,
        yearlyTotal: savings.annualSavings,
        lifetimeSavings: savings.lifetimeSavings,
        breakEvenMonths: savings.breakEvenMonths
      },
      // ...
    })
  }
}
```
**Impact:** Richer AI insights with break-even and lifetime savings data
**Priority:** MEDIUM - Enhances AI broker recommendations

**Recommendation:** MEDIUM PRIORITY
- Replace manual calculations with `calculateRefinancingSavings()` for consistency
- Adds break-even analysis to AI insights (user benefit)
- Estimated effort: 20 minutes across 2 files

---

### Active Plans Review

#### Plan 1: `2025-11-01-lead-form-chat-handoff-optimization-plan.md`
**Relevance:** LOW
- Focus: Form completion → chat transition flow
- No rate calculations or refinance logic mentioned
- **No opportunities to leverage audited functions**

#### Plan 2: `2025-10-28-progressive-form-restoration-implementation-plan.md`
**Relevance:** LOW
- Status: COMPLETED
- Focus: Tier 2 instant analysis UI restoration
- Uses instant analysis results from controller (which already uses these functions)
- **No opportunities to leverage audited functions**

#### Plan 3: `2025-10-17-lead-form-conversion-optimization-path2.md`
**Relevance:** LOW
- Focus: Mobile form optimization, conditional fields, session storage
- No calculation logic changes planned
- **No opportunities to leverage audited functions**

---

## Summary of Recommendations

### High Priority (Do Now)
1. ✅ **Replace hardcoded `2.8%` in `dynamic-g3-validation.ts:126`**
   - File: `lib/validation/dynamic-g3-validation.ts`
   - Replace: `const newMonthly = outstanding * (2.8 / 100 / 12)`
   - With: `const marketRate = getPlaceholderRate(formData.propertyType || 'Private', 'refinance')`
   - Impact: More accurate refinance savings in G3 validation
   - Effort: 5 minutes

2. ✅ **Replace hardcoded `3.0%` in `ai-insights/route.ts:107`**
   - File: `app/api/ai-insights/route.ts`
   - Replace: Hardcoded `3.0%` market rate
   - With: `getPlaceholderRate(formData.propertyType || 'Private', 'refinance')`
   - Impact: Property-type-aware AI insights
   - Effort: 5 minutes

### Medium Priority (Nice to Have)
3. **Enhance AI insights with full `calculateRefinancingSavings()` in `ai-insights/route.ts`**
   - File: `app/api/ai-insights/route.ts:106-114`
   - Add: Break-even months, lifetime savings, `worthRefinancing` flag
   - Impact: Richer AI broker recommendations
   - Effort: 15 minutes

4. **Replace manual calculation in `dynamic-g3-validation.ts` with `calculateRefinancingSavings()`**
   - File: `lib/validation/dynamic-g3-validation.ts:122-128`
   - Impact: Consistent calculation logic across codebase
   - Effort: 10 minutes

### Low Priority (Optional)
5. **Consider property-type-aware rates in `ProgressiveFormWithController.tsx:866`**
   - File: `components/forms/ProgressiveFormWithController.tsx`
   - Replace: `calculateMonthlyPayment(loanAmount, rate = 2.8)`
   - With: Property-type-aware default rate
   - Impact: Slightly more accurate UI calculations
   - Effort: 10 minutes
   - **Note:** May require passing `propertyType` through multiple layers

---

## Conclusion

**Total Opportunities Found:** 5
- **High Priority:** 2
- **Medium Priority:** 2
- **Low Priority:** 1

**Recommended Immediate Actions:**
1. Fix hardcoded rate in `dynamic-g3-validation.ts` (5 min)
2. Fix hardcoded rate in `ai-insights/route.ts` (5 min)

**Total Estimated Effort for All Recommendations:** 45 minutes

**Key Insight:**
- `calculateIWAA()` is correctly specialized - no refactoring needed
- `getPlaceholderRate()` has **3 high-value opportunities** to replace hardcoded assumptions
- `calculateRefinancingSavings()` has **2 medium-value opportunities** to consolidate logic

**Next Steps:**
- Create separate refactoring tasks for HIGH priority items
- Bundle MEDIUM priority items into next refinance feature work
- Skip LOW priority items unless refactoring that area anyway

---

## Success Criteria

- [x] All 3 functions documented with current usage
- [x] Searched codebase for potential usage opportunities
- [x] Checked active plans for relevance
- [x] Created recommendations list
- [x] Identified 5 concrete refactoring opportunities with priority levels

---

## Timeline

**Estimated:** 30 minutes
**Priority:** Can be done incrementally as we work on related features

---

## Notes

- **calculateIWAA** is specialized - only useful when dealing with joint applicants
- **getPlaceholderRate** could replace hardcoded rate assumptions throughout codebase
- **calculateRefinancingSavings** is simpler than calculateRefinanceOutlook - good for quick estimates

---

## Next Actions

1. Run grep searches to find potential usage
2. Review findings and create recommendations
3. Update code if opportunities found
4. Mark plan as completed
