# IWAA & 55% LTV Tenure Fix - Complete Implementation Plan

**Date:** 2025-10-26
**Status:** Active
**Priority:** HIGH - Mortgage Compliance Issue
**Complexity:** MEDIUM (affects core calculation engine)
**Constraint:** Constraint A - Data In, Data Approved

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Success Criteria](#success-criteria)
3. [Domain Knowledge Required](#domain-knowledge-required)
4. [Architecture Overview](#architecture-overview)
5. [Pre-Implementation Checklist](#pre-implementation-checklist)
6. [Implementation Tasks](#implementation-tasks)
7. [Testing Strategy](#testing-strategy)
8. [Verification Checklist](#verification-checklist)
9. [Rollback Plan](#rollback-plan)

---

## Problem Statement

### Current Bugs

**Bug #1: IWAA Not Used for Joint Applicants**

When a loan application has 2 applicants (joint application), the system currently:
- Uses only the primary applicant's age for tenure calculation
- Ignores the co-applicant's age entirely
- Results in incorrect maximum loan tenure calculations
- Violates MAS (Monetary Authority of Singapore) regulations

**Impact:** Users get **lower max loan amounts** than they're entitled to when the co-applicant is younger.

**Bug #2: Missing 55% LTV Extended Tenure Rules**

When a borrower qualifies for the 55% LTV tier (reduced loan amount), they should receive:
- **Extended tenure caps** (longer repayment period)
- Different age formulas than the 75% LTV tier

Current code treats all LTV tiers the same, resulting in:
- Shorter tenure than allowed
- Lower max loan amounts
- Non-compliance with MAS regulations

**Impact:** Safer borrowers (55% LTV) are penalized with shorter tenure when they should get longer.

---

## Success Criteria

### Functional Requirements

1. **IWAA Calculation**
   - ✅ When 2 applicants exist, calculate IWAA: `(Age1 × Income1 + Age2 × Income2) / (Income1 + Income2)`
   - ✅ Round UP to nearest integer (Dr Elena v2 spec)
   - ✅ Use IWAA instead of single age for all tenure calculations

2. **55% LTV Tenure Rules**
   - ✅ HDB 55% LTV: `MIN(75 - IWAA, 30 years)` (not `MIN(65 - IWAA, 25)`)
   - ✅ EC/Private/Landed 55% LTV: `MIN(65 - IWAA, 35 years)` (not `MIN(65 - IWAA, 30)`)
   - ✅ Detect which LTV tier applies to each scenario

3. **Backwards Compatibility**
   - ✅ Single applicant scenarios continue to work (use age directly)
   - ✅ All existing tests still pass
   - ✅ No breaking changes to API/interfaces

### Non-Functional Requirements

- 100% test coverage for new IWAA logic
- Zero regressions in existing mortgage calculations
- Dr Elena v2 compliance documented in code comments

### Out of Scope

- UI changes to MasReadiness sidebar (separate task after this is merged)
- LTV tier auto-detection logic (will be added in Phase 2)
- Refinancing tenure rules (different formula, separate task)

---

## Domain Knowledge Required

### What is IWAA?

**IWAA = Income-Weighted Average Age**

This is a Singapore mortgage regulation concept for joint borrowers.

**Why it matters:**
- Loan tenure (repayment period) is capped by borrower age
- Formula: `MAX_TENURE = MIN(65 - age, regulatory_cap)`
- For joint applications, you can't just use one person's age
- IWAA weights ages by each person's income contribution

**Example:**
```
Applicant 1: Age 50, Income $10,000/month
Applicant 2: Age 30, Income $2,000/month

Wrong way (current code): Use age 50
  → Tenure = MIN(65 - 50, 25) = 15 years
  → Higher monthly payment → Lower max loan

Right way (IWAA):
  IWAA = (50×10000 + 30×2000) / 12000 = 46.67 → Round UP = 47
  → Tenure = MIN(65 - 47, 25) = 18 years
  → Lower monthly payment → Higher max loan
```

The younger co-applicant extends the possible tenure!

### What is the 55% LTV Extended Tenure Scheme?

**LTV = Loan-to-Value ratio** (how much you can borrow vs property price)

Singapore has tiered LTV limits:
- **75% LTV (base tier):** Higher loan amount, standard tenure caps
- **55% LTV (reduced tier):** Lower loan amount, BUT extended tenure caps as compensation

**Current Tenure Caps:**

| Property Type | 75% LTV Formula | 55% LTV Formula |
|---------------|-----------------|-----------------|
| HDB | `MIN(65 - IWAA, 25)` | `MIN(75 - IWAA, 30)` ⚠️ Extended! |
| EC/Private/Landed | `MIN(65 - IWAA, 30)` | `MIN(65 - IWAA, 35)` ⚠️ Extended! |
| Commercial | `MIN(65 - IWAA, 30)` | `MIN(65 - IWAA, 35)` ⚠️ Extended! |

**Why 55% LTV gets extended tenure:**
- They're borrowing less (safer for bank)
- MAS allows longer tenure as incentive
- Example: 35-year-old with 55% LTV can get 35-year tenure (vs 30-year max for 75% LTV)

### What is Dr Elena v2?

`dr-elena-mortgage-expert-v2.json` is our **source of truth** for mortgage calculations.

It's a JSON specification (848 lines) containing:
- All MAS regulatory formulas
- Income recognition rates
- LTV limits by property type
- Tenure calculation rules
- ABSD/BSD rates
- Test scenarios

**Location:** `dr-elena-mortgage-expert-v2.json` (repo root)

**Key sections for this task:**
- Lines 164-168: IWAA calculation formula
- Lines 630-735: Property-specific tenure rules
- Lines 235-260: LTV limits and triggers

**Our code must match Dr Elena v2 100%** - this is a compliance requirement.

---

## Architecture Overview

### Current Data Flow (BROKEN)

```
User Input (ProgressiveFormWithController.tsx)
  └─ actualAges: [35, 30]  ← Form COLLECTS this
  └─ actualIncomes: [5000, 3000]  ← Form COLLECTS this
       ↓
useProgressiveFormController.ts
  └─ combinedAge: 35  ← Uses ONLY first age ❌
  └─ actualIncome: 8000  ← Sums both incomes ✅
       ↓
calculateInstantProfile(instant-profile.ts)
  └─ age: 35  ← Receives single age ❌
  └─ tenureCapYears = MIN(65 - 35, 25) = 25
       ↓
Result: Ignores co-applicant's age, wrong tenure
```

### Fixed Data Flow (TARGET)

```
User Input (ProgressiveFormWithController.tsx)
  └─ actualAges: [35, 30]
  └─ actualIncomes: [5000, 3000]
       ↓
useProgressiveFormController.ts
  └─ Extract arrays from formData
  └─ Calculate IWAA = 34 (via calculateIWAA)
  └─ Detect LTV tier (75% or 55%)
       ↓
calculateInstantProfile(instant-profile.ts)
  └─ Receive: ages: [35, 30], incomes: [5000, 3000]
  └─ Calculate IWAA internally
  └─ Apply property + LTV tier specific formula
  └─ tenureCapYears = MIN(65 - 34, 25) = 25  ← Correct!
       ↓
Result: Uses IWAA, applies correct tenure caps
```

### Files Affected

| File | Role | Change Type |
|------|------|-------------|
| `lib/calculations/instant-profile.ts` | Core calculation engine | **MODIFY** (Tier 1 - see CANONICAL_REFERENCES.md) |
| `hooks/useProgressiveFormController.ts` | Form data orchestrator | **MODIFY** (pass arrays) |
| `lib/calculations/__tests__/iwaa-rounding-fix.test.ts` | IWAA rounding tests | **EXISTS** ✅ |
| `lib/calculations/__tests__/iwaa-tenure-integration.test.ts` | Tenure calculation tests | **CREATE** |
| `lib/calculations/__tests__/instant-profile.test.ts` | Existing calculation tests | **VERIFY** (no regressions) |
| `dr-elena-mortgage-expert-v2.json` | Regulatory spec | **REFERENCE ONLY** |

---

## Pre-Implementation Checklist

Before writing ANY code, complete these steps:

### 1. Read Required Documentation

- [ ] `CANONICAL_REFERENCES.md` - Check rules for modifying `instant-profile.ts`
- [ ] `dr-elena-mortgage-expert-v2.json` lines 164-168 (IWAA formula)
- [ ] `dr-elena-mortgage-expert-v2.json` lines 630-735 (tenure rules)
- [ ] `CLAUDE.md` section on TDD (Critical Rules)
- [ ] This plan in full (don't skip sections!)

### 2. Verify Current State

```bash
# Check current branch
git status
git branch --show-current

# Should be on: lead-form-calculation-redesign

# Run existing tests (baseline)
npm test -- lib/calculations/__tests__/instant-profile.test.ts
npm test -- lib/calculations/__tests__/iwaa-rounding-fix.test.ts

# All should PASS before you start
```

### 3. Create Work Log Entry

Add to `docs/work-log.md`:

```markdown
## 2025-10-26 - IWAA & 55% LTV Tenure Fix

**Goal:** Implement IWAA (Income-Weighted Average Age) for joint applicants and 55% LTV extended tenure rules per Dr Elena v2 spec.

**Bugs Fixed:**
1. Joint applicant age not considered (IWAA missing)
2. 55% LTV tenure caps too restrictive (missing extended formulas)

**Files Modified:**
- lib/calculations/instant-profile.ts
- hooks/useProgressiveFormController.ts

**Tests Added:**
- lib/calculations/__tests__/iwaa-tenure-integration.test.ts

**Commits:** (will update as I go)
- [ ] test: add IWAA tenure integration tests (failing)
- [ ] feat: update InstantProfileInput interface for IWAA support
- [ ] feat: implement IWAA-based tenure calculation
- [ ] feat: add 55% LTV extended tenure rules
- [ ] feat: pass co-applicant data from form controller
- [ ] test: verify all existing tests pass
- [ ] docs: update comments with Dr Elena v2 references
```

---

## Implementation Tasks

### Task 0: Initial Setup (5 minutes)

**Goal:** Prepare environment and confirm baseline.

**Steps:**

1. **Ensure clean working directory:**
   ```bash
   git status
   # Should show existing changes from previous work
   # If uncommitted changes unrelated to this task, stash or commit them
   ```

2. **Run baseline tests:**
   ```bash
   npm test -- lib/calculations/__tests__/iwaa-rounding-fix.test.ts
   ```
   **Expected:** 6 tests pass (IWAA rounding fix already done)

3. **Read the IWAA function:**
   ```bash
   # Open in editor:
   lib/calculations/instant-profile.ts

   # Navigate to line 846-855
   # Confirm Math.ceil() is used (not Math.round)
   ```

**Acceptance Criteria:**
- ✅ All existing tests pass
- ✅ `calculateIWAA()` function uses `Math.ceil()` for rounding
- ✅ Work log entry created

**Commit:** No commit yet (setup only)

---

### Task 1: Write Failing Tests for IWAA Tenure Integration (30 minutes)

**Goal:** Create comprehensive tests that FAIL because IWAA isn't used yet.

**Why TDD (Test-Driven Development)?**
- Tests define the spec before you write code
- You know you're done when tests pass
- Prevents over-engineering (YAGNI - You Ain't Gonna Need It)
- Catches regressions immediately

**File to Create:** `lib/calculations/__tests__/iwaa-tenure-integration.test.ts`

**Test Structure:**

```typescript
// ABOUTME: Integration tests for IWAA-based tenure calculation in calculateInstantProfile
// ABOUTME: Validates Dr Elena v2 compliance for joint applicants and 55% LTV extended tenure

import { calculateInstantProfile } from '../instant-profile'

describe('IWAA Tenure Integration - Dr Elena v2 Compliance', () => {

  // Test Group 1: HDB 75% LTV (baseline)
  describe('HDB - 75% LTV Tier', () => {
    it('should use IWAA for joint applicants, capped at 25 years', () => {
      // Given: Joint applicants
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],  // ← This will be NEW parameter (currently doesn't exist)
        incomes: [5000, 3000],  // ← This will be NEW parameter
        income: 8000,  // Total income (backwards compat)
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 35,  // ← OLD parameter (will be deprecated but kept for backwards compat)
        loan_type: 'new_purchase'
      })

      // IWAA = (35×5000 + 30×3000) / 8000 = 33.125 → Math.ceil = 34
      // Tenure = MIN(65 - 34, 25) = MIN(31, 25) = 25

      expect(result.tenureCapYears).toBe(25)
      expect(result.tenureCapSource).toBe('regulation') // Capped by 25-year max
    })

    it('should use single age when only one applicant', () => {
      // Given: Single applicant (backwards compatibility)
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 40,
        loan_type: 'new_purchase'
      })

      // Tenure = MIN(65 - 40, 25) = 25
      expect(result.tenureCapYears).toBe(25)
    })

    it('should cap by age when IWAA is older', () => {
      // Given: Older joint applicants
      const result = calculateInstantProfile({
        property_price: 400000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [55, 45],
        incomes: [6000, 4000],
        income: 10000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 55,
        loan_type: 'new_purchase'
      })

      // IWAA = (55×6000 + 45×4000) / 10000 = 51
      // Tenure = MIN(65 - 51, 25) = MIN(14, 25) = 14

      expect(result.tenureCapYears).toBe(14)
      expect(result.tenureCapSource).toBe('age') // Capped by age, not regulation
    })
  })

  // Test Group 2: HDB 55% LTV (EXTENDED TENURE)
  describe('HDB - 55% LTV Extended Tenure Tier', () => {
    it('should use 75 - IWAA formula, capped at 30 years', () => {
      // Given: Joint applicants with 55% LTV
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 35,
        loan_type: 'new_purchase'
      }, 55)  // ← ltvMode = 55% (extended tier)

      // IWAA = 34
      // 55% LTV Extended: Tenure = MIN(75 - 34, 30) = MIN(41, 30) = 30

      expect(result.tenureCapYears).toBe(30)
      expect(result.tenureCapSource).toBe('regulation') // Capped by 30-year max
    })

    it('should give longer tenure than 75% LTV for same IWAA', () => {
      // Comparison: 75% LTV vs 55% LTV for same applicants
      const base75 = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [45, 40],
        incomes: [6000, 4000],
        income: 10000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 45,
        loan_type: 'new_purchase'
      }, 75)  // 75% LTV

      const extended55 = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [45, 40],
        incomes: [6000, 4000],
        income: 10000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 45,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      // 75% LTV: MIN(65 - 43, 25) = MIN(22, 25) = 22
      // 55% LTV: MIN(75 - 43, 30) = MIN(32, 30) = 30

      expect(extended55.tenureCapYears).toBeGreaterThan(base75.tenureCapYears)
    })
  })

  // Test Group 3: EC - 75% LTV
  describe('EC - 75% LTV Tier', () => {
    it('should use 65 - IWAA, capped at 30 years', () => {
      const result = calculateInstantProfile({
        property_price: 800000,
        property_type: 'EC',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 35,
        loan_type: 'new_purchase'
      })

      // IWAA = 34
      // Tenure = MIN(65 - 34, 30) = MIN(31, 30) = 30

      expect(result.tenureCapYears).toBe(30)
      expect(result.tenureCapSource).toBe('regulation')
    })
  })

  // Test Group 4: EC - 55% LTV EXTENDED
  describe('EC - 55% LTV Extended Tenure Tier', () => {
    it('should use 65 - IWAA, capped at 35 years (extended)', () => {
      const result = calculateInstantProfile({
        property_price: 800000,
        property_type: 'EC',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 35,
        age: 35,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      // IWAA = 34
      // 55% Extended: Tenure = MIN(65 - 34, 35) = MIN(31, 35) = 31

      expect(result.tenureCapYears).toBe(31)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 5: Private/Condo - 75% LTV
  describe('Private/Condo - 75% LTV Tier', () => {
    it('should use 65 - IWAA, capped at 30 years', () => {
      const result = calculateInstantProfile({
        property_price: 1200000,
        property_type: 'Private',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [40, 35],
        incomes: [8000, 6000],
        income: 14000,
        commitments: 0,
        rate: 4.0,
        tenure: 30,
        age: 40,
        loan_type: 'new_purchase'
      })

      // IWAA = (40×8000 + 35×6000) / 14000 = 38 (rounded up)
      // Tenure = MIN(65 - 38, 30) = MIN(27, 30) = 27

      expect(result.tenureCapYears).toBe(27)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 6: Private/Condo - 55% LTV EXTENDED
  describe('Private/Condo - 55% LTV Extended Tenure Tier', () => {
    it('should use 65 - IWAA, capped at 35 years (extended)', () => {
      const result = calculateInstantProfile({
        property_price: 1200000,
        property_type: 'Private',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [40, 35],
        incomes: [8000, 6000],
        income: 14000,
        commitments: 0,
        rate: 4.0,
        tenure: 35,
        age: 40,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      // IWAA = 38
      // 55% Extended: Tenure = MIN(65 - 38, 35) = MIN(27, 35) = 27

      expect(result.tenureCapYears).toBe(27)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 7: Commercial
  describe('Commercial - Both LTV Tiers', () => {
    it('75% LTV: should use 65 - IWAA, capped at 30 years', () => {
      const result = calculateInstantProfile({
        property_price: 2000000,
        property_type: 'Commercial',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [50, 30],
        incomes: [10000, 2000],
        income: 12000,
        commitments: 0,
        rate: 5.0,  // Commercial uses 5% stress test
        tenure: 30,
        age: 50,
        loan_type: 'new_purchase'
      })

      // IWAA = (50×10000 + 30×2000) / 12000 = 47 (rounded up)
      // Tenure = MIN(65 - 47, 30) = MIN(18, 30) = 18

      expect(result.tenureCapYears).toBe(18)
      expect(result.tenureCapSource).toBe('age')
    })

    it('55% LTV: should use 65 - IWAA, capped at 35 years (extended)', () => {
      const result = calculateInstantProfile({
        property_price: 2000000,
        property_type: 'Commercial',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [35, 30],
        incomes: [5000, 3000],
        income: 8000,
        commitments: 0,
        rate: 5.0,
        tenure: 35,
        age: 35,
        loan_type: 'new_purchase'
      }, 55)  // 55% LTV extended

      // IWAA = 34
      // 55% Extended: Tenure = MIN(65 - 34, 35) = MIN(31, 35) = 31

      expect(result.tenureCapYears).toBe(31)
      expect(result.tenureCapSource).toBe('age')
    })
  })

  // Test Group 8: Edge Cases
  describe('Edge Cases', () => {
    it('should handle very old applicants (minimum tenure 1 year)', () => {
      const result = calculateInstantProfile({
        property_price: 400000,
        property_type: 'Private',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [70, 70],
        incomes: [4000, 4000],
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 1,
        age: 70,
        loan_type: 'new_purchase'
      })

      // IWAA = 70
      // Tenure = MIN(65 - 70, 30) = MIN(-5, 30) = -5 → should cap at 1

      expect(result.tenureCapYears).toBeGreaterThanOrEqual(1)
    })

    it('should handle zero income co-applicant', () => {
      const result = calculateInstantProfile({
        property_price: 600000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        ages: [40, 30],
        incomes: [8000, 0],  // Co-applicant has no income
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 40,
        loan_type: 'new_purchase'
      })

      // IWAA should just use age 40 (ignore zero-income applicant)
      // Tenure = MIN(65 - 40, 25) = 25

      expect(result.tenureCapYears).toBe(25)
    })

    it('should handle missing ages/incomes (backwards compatibility)', () => {
      // Old code path: no ages/incomes arrays provided
      const result = calculateInstantProfile({
        property_price: 500000,
        property_type: 'HDB',
        buyer_profile: 'SC',
        existing_properties: 0,
        income: 8000,
        commitments: 0,
        rate: 4.0,
        tenure: 25,
        age: 35,
        loan_type: 'new_purchase'
      })

      // Should fall back to single 'age' parameter
      expect(result.tenureCapYears).toBe(25)
    })
  })
})
```

**Steps to Create the Test:**

1. **Create file:**
   ```bash
   touch lib/calculations/__tests__/iwaa-tenure-integration.test.ts
   ```

2. **Copy the test code above into the file**

3. **Run the tests (EXPECT FAILURES):**
   ```bash
   npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
   ```

**Expected Output:**
```
FAIL lib/calculations/__tests__/iwaa-tenure-integration.test.ts
  × should use IWAA for joint applicants, capped at 25 years

    TypeError: property_price is required
    (or similar errors because ages/incomes parameters don't exist yet)

Test Suites: 1 failed, 1 total
Tests:       20 failed, 20 total
```

**Why the tests fail:**
- `ages` and `incomes` parameters don't exist in `InstantProfileInput` interface yet
- TypeScript compilation will show errors
- This is EXPECTED in TDD - tests define the API we want to build

**Acceptance Criteria:**
- ✅ Test file created with 20+ test cases
- ✅ Tests cover: HDB, EC, Private, Commercial, all LTV tiers, edge cases
- ✅ Tests currently FAIL (as expected in TDD)
- ✅ Each test has clear comments explaining IWAA calculation

**Commit:**
```bash
git add lib/calculations/__tests__/iwaa-tenure-integration.test.ts
git commit -m "test: add IWAA tenure integration tests (failing)

- 20+ test cases covering all property types and LTV tiers
- Tests currently fail because ages/incomes parameters don't exist yet
- TDD: tests define the API we want to implement
- Refs: dr-elena-mortgage-expert-v2.json lines 630-735"
```

---

### Task 2: Update InstantProfileInput Interface (10 minutes)

**Goal:** Add `ages` and `incomes` optional parameters to the interface.

**Why Optional?**
- Backwards compatibility - old code uses single `age` and `income`
- Single applicants don't need arrays
- Gradual migration - form controller will pass arrays, old callers won't break

**File to Modify:** `lib/calculations/instant-profile.ts`

**Current Interface (lines 13-25):**

```typescript
export interface InstantProfileInput {
  property_price: number;
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial';
  buyer_profile: 'SC' | 'PR' | 'Foreigner';
  existing_properties: number;
  income: number;
  commitments: number;
  rate: number;
  tenure: number;
  age: number;
  loan_type?: 'new_purchase' | 'refinance';
  is_owner_occupied?: boolean;
}
```

**Updated Interface:**

```typescript
export interface InstantProfileInput {
  property_price: number;
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial';
  buyer_profile: 'SC' | 'PR' | 'Foreigner';
  existing_properties: number;

  // Income (backwards compatible)
  income: number;  // Total recognized income
  incomes?: number[];  // Individual applicant incomes for IWAA calculation (optional)

  commitments: number;
  rate: number;
  tenure: number;

  // Age (backwards compatible)
  age: number;  // Primary applicant age (or single applicant)
  ages?: number[];  // Individual applicant ages for IWAA calculation (optional)

  loan_type?: 'new_purchase' | 'refinance';
  is_owner_occupied?: boolean;
}
```

**Steps:**

1. **Open file:**
   ```bash
   # In your editor:
   lib/calculations/instant-profile.ts
   ```

2. **Navigate to line 13** (the `InstantProfileInput` interface)

3. **Add the two optional fields:**
   - `incomes?: number[]` after the `income` field
   - `ages?: number[]` after the `age` field

4. **Add helpful comments** explaining:
   - What each array is for (IWAA calculation)
   - Why they're optional (backwards compatibility)

5. **Save the file**

6. **Run TypeScript compiler:**
   ```bash
   npx tsc --noEmit
   ```
   **Expected:** No errors (interface change is backwards compatible)

7. **Run tests again:**
   ```bash
   npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
   ```
   **Expected:** Still failing, but different error now:
   - TypeScript errors should be gone
   - Tests fail because logic doesn't use the new fields yet

**Acceptance Criteria:**
- ✅ `ages?: number[]` added to interface
- ✅ `incomes?: number[]` added to interface
- ✅ TypeScript compiles without errors
- ✅ Existing tests still pass (backwards compatibility verified)

**Commit:**
```bash
git add lib/calculations/instant-profile.ts
git commit -m "feat: add ages and incomes arrays to InstantProfileInput

- Support joint applicant IWAA calculation
- Optional fields for backwards compatibility
- Existing single age/income fields still work
- Refs: dr-elena-mortgage-expert-v2.json line 164"
```

---

### Task 3: Implement IWAA-Based Tenure Calculation (45 minutes)

**Goal:** Use IWAA when `ages` and `incomes` arrays are provided.

**File to Modify:** `lib/calculations/instant-profile.ts`

**Current Tenure Logic (lines 265-272):**

```typescript
const regulatoryTenureCap = property_type === 'Commercial'
  ? 35
  : (property_type === 'HDB' || property_type === 'EC')
    ? 25
    : 30;

const ageBasedCap = Math.max(65 - age, 1);
const tenureCapYears = Math.max(1, Math.min(regulatoryTenureCap, ageBasedCap));
const tenureCapSource: TenureCapSource = ageBasedCap < regulatoryTenureCap ? 'age' : 'regulation';
```

**Problems:**
1. Uses single `age` (ignores co-applicants)
2. Doesn't distinguish 75% vs 55% LTV tiers
3. Wrong caps for 55% LTV (missing extended tenure)

**New Logic (REPLACE lines 265-272):**

```typescript
// IWAA Calculation (Dr Elena v2 line 164-168)
// If ages/incomes arrays provided, calculate Income-Weighted Average Age
// Otherwise, fall back to single age (backwards compatibility)
const effectiveAge = (ages && incomes && ages.length > 0 && incomes.length > 0)
  ? calculateIWAA(ages, incomes)
  : age;

console.log('🔍 Tenure calculation:', {
  providedAge: age,
  providedAges: ages,
  providedIncomes: incomes,
  effectiveAge,
  ltvMode,
  property_type
})

// Dr Elena v2: Property-specific tenure rules (lines 630-735)
// Different formulas for 75% LTV (base) vs 55% LTV (extended)
let regulatoryTenureCap: number
let ageFormula: 'standard' | 'extended'

if (property_type === 'HDB') {
  if (ltvMode === 55) {
    // HDB 55% LTV Extended: MIN(75 - IWAA, 30) [line 638-640]
    regulatoryTenureCap = 30
    ageFormula = 'extended'
  } else {
    // HDB 75% LTV: MIN(65 - IWAA, 25) [line 634-636]
    regulatoryTenureCap = 25
    ageFormula = 'standard'
  }
} else if (property_type === 'EC') {
  if (ltvMode === 55) {
    // EC 55% LTV Extended: MIN(65 - IWAA, 35) [line 670-672]
    regulatoryTenureCap = 35
    ageFormula = 'extended'
  } else {
    // EC 75% LTV: MIN(65 - IWAA, 30) [line 665-667]
    regulatoryTenureCap = 30
    ageFormula = 'standard'
  }
} else if (property_type === 'Private') {
  if (ltvMode === 55) {
    // Private 55% LTV Extended: MIN(65 - IWAA, 35) [line 687-689]
    regulatoryTenureCap = 35
    ageFormula = 'extended'
  } else {
    // Private 75% LTV: MIN(65 - IWAA, 30) [line 682-684]
    regulatoryTenureCap = 30
    ageFormula = 'standard'
  }
} else if (property_type === 'Commercial') {
  if (ltvMode === 55) {
    // Commercial 55% LTV Extended: MIN(65 - IWAA, 35) [line 709-711]
    regulatoryTenureCap = 35
    ageFormula = 'extended'
  } else {
    // Commercial 75% LTV: MIN(65 - IWAA, 30) [line 704-706]
    regulatoryTenureCap = 30
    ageFormula = 'standard'
  }
} else {
  // Fallback (shouldn't happen)
  regulatoryTenureCap = 30
  ageFormula = 'standard'
}

// Apply age-based cap
// Standard formula: 65 - effectiveAge
// Extended formula (HDB 55% only): 75 - effectiveAge
const ageLimitBase = (property_type === 'HDB' && ltvMode === 55) ? 75 : 65
const ageBasedCap = Math.max(ageLimitBase - effectiveAge, 1)

// Take minimum of regulatory cap and age-based cap
const tenureCapYears = Math.max(1, Math.min(regulatoryTenureCap, ageBasedCap))
const tenureCapSource: TenureCapSource = ageBasedCap < regulatoryTenureCap ? 'age' : 'regulation'

console.log('🔍 Tenure result:', {
  effectiveAge,
  ageLimitBase,
  ageBasedCap,
  regulatoryTenureCap,
  tenureCapYears,
  tenureCapSource,
  formula: ageFormula
})
```

**Steps:**

1. **Open file:**
   ```bash
   lib/calculations/instant-profile.ts
   ```

2. **Find the function signature (line 109):**
   ```typescript
   export function calculateInstantProfile(
     inputs: InstantProfileInput,
     ltvMode: number = 75
   ): InstantProfileResult {
   ```

3. **Destructure the new fields from inputs (line 113):**

   **Before:**
   ```typescript
   const {
     property_price,
     property_type,
     buyer_profile,
     existing_properties,
     income,
     commitments,
     rate,
     tenure,
     age,
     loan_type = 'new_purchase'
   } = inputs;
   ```

   **After:**
   ```typescript
   const {
     property_price,
     property_type,
     buyer_profile,
     existing_properties,
     income,
     incomes,  // ← Add this
     commitments,
     rate,
     tenure,
     age,
     ages,  // ← Add this
     loan_type = 'new_purchase'
   } = inputs;
   ```

4. **Navigate to line 265** (tenure calculation logic)

5. **DELETE lines 265-272** (old tenure logic)

6. **PASTE the new logic** (from above)

7. **Save file**

8. **Run TypeScript compiler:**
   ```bash
   npx tsc --noEmit
   ```
   **Expected:** No errors

9. **Run the integration tests:**
   ```bash
   npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
   ```

**Expected Output:**

Some tests should now PASS, but some might still fail. This is normal - we'll iterate.

**Debugging Tips:**

If tests fail with wrong numbers:

1. **Check the console logs:**
   ```
   🔍 Tenure calculation: { effectiveAge: 34, ltvMode: 75, property_type: 'HDB' }
   🔍 Tenure result: { tenureCapYears: 25, ageBasedCap: 31, regulatoryTenureCap: 25 }
   ```

2. **Verify IWAA calculation manually:**
   - Test says: `ages: [35, 30], incomes: [5000, 3000]`
   - IWAA = (35×5000 + 30×3000) / 8000 = 265000/8000 = 33.125
   - Math.ceil(33.125) = 34 ✓

3. **Verify tenure formula:**
   - HDB 75% LTV: MIN(65 - 34, 25) = MIN(31, 25) = 25 ✓

4. **If IWAA is wrong:**
   - Check `calculateIWAA()` uses `Math.ceil()` (not `Math.round()`)
   - Verify incomes array sums correctly

5. **If tenure is wrong:**
   - Check `ltvMode` value (should be 55 or 75)
   - Check property type matches expected
   - Verify the right age formula is used (65 vs 75)

**Acceptance Criteria:**
- ✅ IWAA calculated when `ages` and `incomes` provided
- ✅ Falls back to single `age` when arrays not provided (backwards compat)
- ✅ 55% LTV uses extended caps (30/35 years vs 25/30)
- ✅ All property types handled correctly
- ✅ HDB 55% LTV uses 75-IWAA formula (not 65-IWAA)
- ✅ At least 15+ tests passing (some edge cases may still need fixes)

**Commit:**
```bash
git add lib/calculations/instant-profile.ts
git commit -m "feat: implement IWAA-based tenure calculation

- Use calculateIWAA when ages/incomes arrays provided
- Fall back to single age for backwards compatibility
- Separate logic for 75% vs 55% LTV tiers
- HDB 55% LTV uses 75-IWAA formula (extended tenure)
- EC/Private/Commercial 55% LTV cap at 35 years (extended)
- Dr Elena v2 compliant tenure formulas
- Refs: dr-elena-mortgage-expert-v2.json lines 630-735"
```

---

### Task 4: Fix Remaining Edge Cases (20 minutes)

**Goal:** Handle edge cases that might cause test failures.

**Run tests and check for failures:**
```bash
npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
```

**Common Edge Cases to Fix:**

#### Edge Case 1: Very Old Applicants (Negative Tenure)

**Problem:** `65 - 70 = -5` → negative tenure

**Fix:** Already handled by `Math.max(ageBasedCap, 1)` but verify tests pass.

**Test:**
```typescript
it('should handle very old applicants (minimum tenure 1 year)', () => {
  // IWAA = 70, Tenure should be capped at 1
})
```

#### Edge Case 2: Zero Income Co-Applicant

**Problem:** Co-applicant exists but has $0 income

**Current Behavior:**
```typescript
// calculateIWAA function (line 850-851)
const totalIncome = incomes.reduce((sum, income) => sum + income, 0)
if (totalIncome === 0) return ages[0] || 0
```

This already handles it! If total income is 0, returns first age.

**Test:**
```typescript
it('should handle zero income co-applicant', () => {
  // incomes: [8000, 0] → IWAA should just use age 40
})
```

**Verify:** Test should pass without changes.

#### Edge Case 3: Missing ages/incomes (Backwards Compatibility)

**Problem:** Old code doesn't pass `ages` or `incomes` arrays

**Current Behavior:**
```typescript
const effectiveAge = (ages && incomes && ages.length > 0 && incomes.length > 0)
  ? calculateIWAA(ages, incomes)
  : age;
```

This already handles it! Falls back to `age` parameter.

**Test:**
```typescript
it('should handle missing ages/incomes (backwards compatibility)', () => {
  // No ages/incomes provided, should use age: 35
})
```

**Verify:** Test should pass without changes.

#### Edge Case 4: Mismatched Array Lengths

**Problem:** `ages: [35, 30], incomes: [5000]` (different lengths)

**Current Behavior:**
```typescript
// calculateIWAA function (line 848)
if (ages.length !== incomes.length) return ages[0] || 0
```

Already handled! Returns first age if arrays don't match.

**Add Test (if not already present):**
```typescript
it('should handle mismatched ages/incomes array lengths', () => {
  const result = calculateInstantProfile({
    property_price: 500000,
    property_type: 'HDB',
    buyer_profile: 'SC',
    existing_properties: 0,
    ages: [35, 30],
    incomes: [8000],  // Only one income (mismatch!)
    income: 8000,
    commitments: 0,
    rate: 4.0,
    tenure: 25,
    age: 35,
    loan_type: 'new_purchase'
  })

  // Should fall back to ages[0] = 35
  expect(result.tenureCapYears).toBe(25)
})
```

**Steps:**

1. **Run tests and identify failures:**
   ```bash
   npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
   ```

2. **For each failing test:**
   - Read the error message carefully
   - Check expected vs actual values
   - Add console.log if needed to debug
   - Fix the logic in `instant-profile.ts`

3. **Add any missing edge case tests**

4. **Re-run tests until all pass:**
   ```bash
   npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
   ```

**Acceptance Criteria:**
- ✅ ALL 20+ integration tests pass
- ✅ Edge cases handled gracefully (no crashes)
- ✅ Backwards compatibility maintained

**Commit:**
```bash
git add lib/calculations/__tests__/iwaa-tenure-integration.test.ts
git add lib/calculations/instant-profile.ts
git commit -m "fix: handle edge cases for IWAA tenure calculation

- Minimum tenure capped at 1 year for old applicants
- Zero income co-applicants handled gracefully
- Mismatched array lengths fall back to single age
- All 20+ integration tests passing"
```

---

### Task 5: Update Form Controller to Pass Co-Applicant Data (30 minutes)

**Goal:** Modify `useProgressiveFormController.ts` to pass `ages` and `incomes` arrays to `calculateInstantProfile`.

**File to Modify:** `hooks/useProgressiveFormController.ts`

**Current Code (lines 460-496):**

```typescript
const age = parseNumber(formData.combinedAge, 35)  // ← Only uses combinedAge
const tenure = Math.max(parseNumber(formData.requestedTenure, 25), 1)
const commitments = Math.max(parseNumber(formData.existingCommitments, 0), 0)
const rateAssumption = getPlaceholderRate(personaPropertyType, mappedLoanType)

const profile = calculateInstantProfile({
  property_price: propertyPrice,
  property_type: personaPropertyType,
  buyer_profile: buyerProfile,
  existing_properties: existingProperties,
  income: actualIncome,
  commitments,
  rate: rateAssumption,
  tenure,
  age,  // ← Single age
  loan_type: 'new_purchase',
  is_owner_occupied: true
}, ltvModeValue)
```

**New Code (REPLACE lines 460-496):**

```typescript
// Extract co-applicant data for IWAA calculation
// Form collects: actualAges and actualIncomes as arrays
const actualAges = formData.actualAges
const actualIncomes = formData.actualIncomes

// Parse arrays, filtering out undefined/null values
const parsedAges = Array.isArray(actualAges)
  ? actualAges.filter((v): v is number => typeof v === 'number' && v > 0)
  : []

const parsedIncomes = Array.isArray(actualIncomes)
  ? actualIncomes.filter((v): v is number => typeof v === 'number' && v > 0)
  : []

// Fallback to single age if arrays not available (backwards compat)
const age = parseNumber(formData.combinedAge, 35)
const tenure = Math.max(parseNumber(formData.requestedTenure, 25), 1)
const commitments = Math.max(parseNumber(formData.existingCommitments, 0), 0)
const rateAssumption = getPlaceholderRate(personaPropertyType, mappedLoanType)

console.log('🔍 IWAA data for calculation:', {
  actualAges,
  actualIncomes,
  parsedAges,
  parsedIncomes,
  hasCoApplicant: parsedAges.length > 1,
  fallbackAge: age
})

const profile = calculateInstantProfile({
  property_price: propertyPrice,
  property_type: personaPropertyType,
  buyer_profile: buyerProfile,
  existing_properties: existingProperties,
  income: actualIncome,
  incomes: parsedIncomes.length > 0 ? parsedIncomes : undefined,  // ← New: pass incomes array
  commitments,
  rate: rateAssumption,
  tenure,
  age,
  ages: parsedAges.length > 0 ? parsedAges : undefined,  // ← New: pass ages array
  loan_type: 'new_purchase',
  is_owner_occupied: true
}, ltvModeValue)
```

**Steps:**

1. **Open file:**
   ```bash
   hooks/useProgressiveFormController.ts
   ```

2. **Navigate to line 460** (inside `calculateInstant` function, Step 3+ section)

3. **Find the line:**
   ```typescript
   const age = parseNumber(formData.combinedAge, 35)
   ```

4. **BEFORE that line, add the new extraction logic** (see code above)

5. **Update the `calculateInstantProfile` call** to include:
   ```typescript
   incomes: parsedIncomes.length > 0 ? parsedIncomes : undefined,
   ages: parsedAges.length > 0 ? parsedAges : undefined,
   ```

6. **Save file**

7. **Test in browser:**
   ```bash
   npm run dev
   ```

8. **Open browser:** `http://localhost:3000/apply`

9. **Fill out form with joint applicants:**
   - Step 1: Name, email, phone
   - Step 2: Property details, combined age
   - Step 3: Check "Joint application"
   - Enter Applicant 1: Age 35, Income $5000
   - Enter Applicant 2: Age 30, Income $3000

10. **Check browser console** for:
    ```
    🔍 IWAA data for calculation: {
      actualAges: [35, 30],
      actualIncomes: [5000, 3000],
      parsedAges: [35, 30],
      parsedIncomes: [5000, 3000],
      hasCoApplicant: true
    }
    🔍 Tenure calculation: { effectiveAge: 34, ... }
    ```

**Verification:**

**Single Applicant Test:**
1. Fill Step 3 WITHOUT checking "Joint application"
2. Only Applicant 1 fields shown
3. Console should show:
   ```
   parsedAges: [35],
   parsedIncomes: [8000],
   hasCoApplicant: false
   ```

**Joint Applicant Test:**
1. Check "Joint application"
2. Fill both applicants
3. Console should show:
   ```
   parsedAges: [35, 30],
   parsedIncomes: [5000, 3000],
   hasCoApplicant: true,
   effectiveAge: 34  // ← IWAA calculated!
   ```

**Acceptance Criteria:**
- ✅ Form data extracted correctly from `actualAges` and `actualIncomes`
- ✅ Arrays filtered to remove invalid values
- ✅ Passed to `calculateInstantProfile` only when present
- ✅ Single applicant flow still works (backwards compat)
- ✅ Console logs show correct IWAA calculation
- ✅ No TypeScript errors

**Commit:**
```bash
git add hooks/useProgressiveFormController.ts
git commit -m "feat: pass co-applicant ages/incomes for IWAA calculation

- Extract actualAges and actualIncomes arrays from form data
- Filter and validate array values
- Pass to calculateInstantProfile for joint applicant scenarios
- Maintain backwards compatibility for single applicants
- Add debug logging for IWAA data flow"
```

---

### Task 6: Verify All Existing Tests Pass (20 minutes)

**Goal:** Ensure no regressions introduced by our changes.

**Why This Matters:**
- Core calculation engine is critical (CANONICAL_REFERENCES.md - Tier 1 file)
- Changes affect max loan amounts shown to users
- Must maintain backwards compatibility

**Tests to Run:**

```bash
# 1. IWAA rounding tests (should already pass)
npm test -- lib/calculations/__tests__/iwaa-rounding-fix.test.ts

# 2. IWAA tenure integration tests (should all pass now)
npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts

# 3. Existing instant-profile tests (check for regressions)
npm test -- lib/calculations/__tests__/instant-profile.test.ts

# 4. All calculation tests
npm test -- lib/calculations/__tests__/

# 5. Form controller tests (if they exist)
npm test -- hooks/__tests__/useProgressiveFormController

# 6. Full test suite (nuclear option - takes longer)
npm test
```

**Expected Results:**

1. **IWAA Rounding:** 6/6 pass ✅
2. **IWAA Tenure Integration:** 20+/20+ pass ✅
3. **Instant Profile:** All pass ✅ (no regressions)
4. **Other Calculation Tests:** All pass ✅

**If ANY test fails:**

### Debugging Process:

1. **Read the error message carefully:**
   ```
   Expected: 400000
   Received: 420000
   ```

2. **Identify what changed:**
   - Is the test using old API (single age)?
   - Does test expect wrong value (needs updating)?
   - Did we introduce a bug?

3. **Check if test needs updating:**

   **Example:** Test assumes age 40, but now uses IWAA

   **Before:**
   ```typescript
   const result = calculateInstantProfile({
     age: 40,  // Single age
     income: 8000,
     // ...
   })
   expect(result.tenureCapYears).toBe(25)
   ```

   **After (if test should use IWAA):**
   ```typescript
   const result = calculateInstantProfile({
     ages: [40, 35],  // Joint applicants
     incomes: [5000, 3000],
     income: 8000,
     age: 40,  // Keep for backwards compat
     // ...
   })
   // IWAA = 38, tenure may differ
   expect(result.tenureCapYears).toBe(27)  // ← Update expected value
   ```

4. **Check for actual bugs:**

   If test failure reveals logic error:
   - Fix the logic in `instant-profile.ts`
   - Re-run tests
   - Don't just update test to match wrong value!

5. **Ask yourself:**
   - Did the test expect the OLD (wrong) behavior?
   - Or does it reveal a NEW bug in our implementation?

**Common Regression Scenarios:**

| Scenario | Fix |
|----------|-----|
| Test uses single `age`, now fails | Test was correct, our code should support single age (backwards compat) |
| Test expects different tenure cap | Check if test assumed wrong LTV tier, update test |
| Test fails for joint applicants | Check IWAA calculation in our code |
| All tests fail with "undefined" | Check interface destructuring in `calculateInstantProfile` |

**Acceptance Criteria:**
- ✅ All IWAA tests pass (6 rounding + 20+ integration)
- ✅ All existing instant-profile tests pass (no regressions)
- ✅ No TypeScript compilation errors
- ✅ No console errors in browser dev tools

**Commit (if test updates needed):**
```bash
git add lib/calculations/__tests__/*.test.ts
git commit -m "test: update existing tests for IWAA compatibility

- Maintain backwards compatibility for single-age tests
- Update tenure expectations for joint applicant scenarios
- All tests passing with no regressions"
```

---

### Task 7: Manual Browser Testing (30 minutes)

**Goal:** Verify the fix works end-to-end in the actual form.

**Setup:**

```bash
npm run dev
```

Open: `http://localhost:3000/apply`

**Test Scenario 1: Single Applicant (Baseline)**

**Steps:**
1. Fill Step 1: Name, email, phone
2. Fill Step 2:
   - Property type: HDB
   - Price: $500,000
   - Combined age: 40
   - Existing properties: 0 (First property)
3. Fill Step 3:
   - **UNCHECK "Joint application"**
   - Applicant 1 Age: 40
   - Applicant 1 Income: $8,000
   - Employment: Employed
   - Commitments: $500

**Expected Behavior:**
- Max loan shown: ~$375,000 (75% LTV)
- Tenure: 25 years (MIN(65-40, 25) = 25)
- MAS Readiness Sidebar shows green/red based on TDSR/MSR

**Verify:**
- Check browser console for:
  ```
  🔍 IWAA data: { parsedAges: [40], parsedIncomes: [8000], hasCoApplicant: false }
  🔍 Tenure result: { effectiveAge: 40, tenureCapYears: 25 }
  ```

**Screenshot:** Take screenshot of MAS Readiness sidebar

---

**Test Scenario 2: Joint Applicant (Younger Co-Applicant)**

**Steps:**
1. Continue from Scenario 1, or refresh page
2. Fill Step 1-2 same as above
3. Fill Step 3:
   - **CHECK "Joint application"** ✅
   - Applicant 1 Age: 50
   - Applicant 1 Income: $6,000
   - Applicant 2 Age: 30
   - Applicant 2 Income: $2,000
   - Employment: Employed
   - Commitments: $800

**Manual Calculation:**
```
IWAA = (50×6000 + 30×2000) / 8000
     = (300000 + 60000) / 8000
     = 360000 / 8000
     = 45

HDB 75% LTV: Tenure = MIN(65 - 45, 25) = MIN(20, 25) = 20 years
```

**Expected Behavior:**
- Tenure: 20 years (not 15 years if it used age 50 alone!)
- Max loan: Higher than if only age 50 was used
- Console shows:
  ```
  effectiveAge: 45  // ← IWAA, not 50!
  tenureCapYears: 20
  ```

**Verify:**
- MAS Readiness sidebar updates
- Max loan amount visible
- No console errors

---

**Test Scenario 3: Joint Applicant with 55% LTV (Extended Tenure)**

**Steps:**
1. Fill Step 1-2:
   - Property type: Private Condo
   - Price: $1,200,000
   - Combined age: 35
   - Existing properties: 0
2. Fill Step 3:
   - CHECK "Joint application"
   - Applicant 1 Age: 35
   - Applicant 1 Income: $5,000
   - Applicant 2 Age: 30
   - Applicant 2 Income: $3,000
   - Employment: Employed
   - Commitments: $1,500

**Manual Calculation:**
```
IWAA = (35×5000 + 30×3000) / 8000 = 33.125 → Math.ceil = 34

Private 75% LTV: Tenure = MIN(65 - 34, 30) = MIN(31, 30) = 30 years
Private 55% LTV: Tenure = MIN(65 - 34, 35) = MIN(31, 35) = 31 years ← Extended!
```

**Expected Behavior (if 55% LTV triggered):**
- Tenure: 31 years (extended cap)
- Console shows:
  ```
  ltvMode: 55
  regulatoryTenureCap: 35
  tenureCapYears: 31
  formula: 'extended'
  ```

**Note:** LTV tier auto-detection is out of scope for this task. For now, we've implemented the LOGIC, but the form might not automatically switch to 55% LTV. That's OK - the calculation engine is ready when we add LTV tier detection later.

---

**Test Scenario 4: HDB 55% LTV Extended (75-IWAA Formula)**

**This is the MOST IMPORTANT test** - verifies the HDB extended tenure bug fix.

**Setup:**
- Manually trigger 55% LTV mode (if needed, add `ltvMode: 55` in console or code)
- Or wait for LTV tier detection (future task)

**Expected for HDB 55% LTV:**
```
IWAA = 34
Tenure = MIN(75 - 34, 30) = MIN(41, 30) = 30 years

vs 75% LTV:
Tenure = MIN(65 - 34, 25) = MIN(31, 25) = 25 years

Difference: 5 years longer tenure!
```

**For now:** Verify in console logs that the LOGIC exists:
```
🔍 Tenure calculation: { property_type: 'HDB', ltvMode: 55 }
🔍 Tenure result: { ageLimitBase: 75, tenureCapYears: 30 }
```

---

**Acceptance Criteria:**
- ✅ Single applicant: Uses age directly, correct tenure
- ✅ Joint applicant: Uses IWAA, extends tenure when younger co-applicant
- ✅ All property types work (HDB, EC, Private, Commercial)
- ✅ Console logs show correct IWAA and tenure calculations
- ✅ No browser console errors
- ✅ MAS Readiness sidebar displays (even if values not updated yet - separate task)

**Document Results:**

Create a simple markdown file:

```bash
# Create test results doc
touch docs/plans/active/2025-10-26-iwaa-manual-test-results.md
```

**Content:**
```markdown
# IWAA Fix - Manual Test Results

## Date: 2025-10-26
## Tester: [Your Name]

### Test Scenario 1: Single Applicant
- ✅ Age 40 used correctly
- ✅ Tenure = 25 years
- ✅ No console errors

### Test Scenario 2: Joint Applicant (Younger Co-Applicant)
- ✅ IWAA = 45 calculated correctly
- ✅ Tenure = 20 years (not 15!)
- ✅ Console shows IWAA in logs

### Test Scenario 3: Private 55% LTV Extended
- ✅ Logic exists for 35-year cap
- ⚠️ LTV tier auto-detection not yet implemented (expected)

### Test Scenario 4: HDB 55% LTV (75-IWAA)
- ✅ Code supports 75-IWAA formula
- ⚠️ LTV tier auto-detection needed to trigger

## Issues Found:
- None (or list any issues)

## Next Steps:
- [ ] Update MasReadiness sidebar to show corrected max loan (separate task)
- [ ] Implement LTV tier auto-detection (separate task)
```

**Commit:**
```bash
git add docs/plans/active/2025-10-26-iwaa-manual-test-results.md
git commit -m "docs: manual test results for IWAA fix

- Single applicant scenarios verified
- Joint applicant IWAA calculation working
- Extended tenure logic present (55% LTV)
- Ready for LTV tier auto-detection (future task)"
```

---

### Task 8: Update Code Comments and Documentation (20 minutes)

**Goal:** Document the implementation for future developers.

**Files to Update:**

#### 1. `lib/calculations/instant-profile.ts`

**Add to file header (lines 1-2):**

```typescript
// ABOUTME: Calculator functions aligned with Dr Elena v2 mortgage expert persona
// ABOUTME: Source: dr-elena-mortgage-expert-v2.json computational_modules
// ABOUTME: v2.1.0 - Updated 2025-10-26 to include IWAA and 55% LTV extended tenure
```

**Add comment before tenure calculation (before line 265):**

```typescript
// ========================================================================
// TENURE CALCULATION - Dr Elena v2 Compliance
// ========================================================================
//
// Singapore MAS regulations cap loan tenure based on:
// 1. Borrower age: Older borrowers get shorter tenure
// 2. Property type: HDB/EC/Private/Commercial have different caps
// 3. LTV tier: 55% LTV gets extended tenure vs 75% LTV
//
// For joint applicants, use IWAA (Income-Weighted Average Age):
//   IWAA = (Age1 × Income1 + Age2 × Income2) / (Income1 + Income2)
//   Round UP to nearest integer (Math.ceil)
//
// Dr Elena v2 References:
// - IWAA formula: dr-elena-mortgage-expert-v2.json lines 164-168
// - HDB tenure rules: lines 633-642
// - EC tenure rules: lines 664-674
// - Private tenure rules: lines 681-690
// - Commercial tenure rules: lines 703-712
//
// Key Rules:
// - HDB 75% LTV: MIN(65 - IWAA, 25 years)
// - HDB 55% LTV: MIN(75 - IWAA, 30 years) ← Extended!
// - EC/Private/Landed 75% LTV: MIN(65 - IWAA, 30 years)
// - EC/Private/Landed 55% LTV: MIN(65 - IWAA, 35 years) ← Extended!
// - Commercial 75% LTV: MIN(65 - IWAA, 30 years)
// - Commercial 55% LTV: MIN(65 - IWAA, 35 years) ← Extended!
//
// Updated: 2025-10-26 to fix IWAA and extended tenure bugs
// ========================================================================
```

#### 2. `hooks/useProgressiveFormController.ts`

**Add comment before IWAA extraction (line ~460):**

```typescript
// ========================================================================
// CO-APPLICANT DATA EXTRACTION FOR IWAA
// ========================================================================
//
// For joint applications, extract ages and incomes arrays from form data
// to calculate IWAA (Income-Weighted Average Age) for accurate tenure caps.
//
// Form fields:
// - actualAges: [number, number?] - Ages of applicant 1 and 2
// - actualIncomes: [number, number?] - Incomes of applicant 1 and 2
//
// These are passed to calculateInstantProfile which handles IWAA calculation
// and applies appropriate tenure formulas per Dr Elena v2 spec.
//
// Fallback: If arrays not available, uses single 'age' parameter (backwards compat)
// ========================================================================
```

#### 3. Update Interface JSDoc Comments

**In `instant-profile.ts` interface (line 13):**

```typescript
/**
 * Input parameters for instant mortgage profile calculation
 *
 * @property property_price - Property value in SGD
 * @property property_type - HDB | EC | Private | Commercial
 * @property buyer_profile - SC (Singapore Citizen) | PR | Foreigner
 * @property existing_properties - Number of properties already owned (0, 1, 2+)
 * @property income - Total recognized monthly income (sum of all applicants)
 * @property incomes - Individual applicant incomes for IWAA calculation (optional)
 * @property commitments - Total monthly debt commitments
 * @property rate - Interest rate assumption (percentage, e.g., 4.0 for 4%)
 * @property tenure - Requested loan tenure in years
 * @property age - Primary applicant age (or single applicant age)
 * @property ages - Individual applicant ages for IWAA calculation (optional)
 * @property loan_type - 'new_purchase' | 'refinance'
 * @property is_owner_occupied - Owner-occupied vs investment property
 *
 * @remarks
 * For joint applicants, provide both `ages` and `incomes` arrays.
 * Function will calculate IWAA (Income-Weighted Average Age) and apply
 * appropriate tenure caps per MAS regulations.
 *
 * If `ages` and `incomes` are not provided, falls back to single `age`
 * parameter for backwards compatibility.
 *
 * @see dr-elena-mortgage-expert-v2.json for regulatory formulas
 */
export interface InstantProfileInput {
  // ... fields
}
```

**Acceptance Criteria:**
- ✅ File headers updated with version info
- ✅ Tenure calculation section has comprehensive comment block
- ✅ Dr Elena v2 line references included
- ✅ JSDoc comments added to interface
- ✅ Co-applicant extraction logic documented

**Commit:**
```bash
git add lib/calculations/instant-profile.ts
git add hooks/useProgressiveFormController.ts
git commit -m "docs: add comprehensive comments for IWAA implementation

- Document tenure calculation logic with Dr Elena v2 references
- Add JSDoc comments to InstantProfileInput interface
- Explain IWAA formula and extended tenure rules
- Include line references to dr-elena-mortgage-expert-v2.json
- Document co-applicant data extraction in form controller"
```

---

### Task 9: Create Completion Report (15 minutes)

**Goal:** Document what was done, what works, and what's next.

**File to Create:** `docs/plans/active/2025-10-26-iwaa-tenure-fix-COMPLETION.md`

**Template:**

```markdown
# IWAA & 55% LTV Tenure Fix - COMPLETION REPORT

**Date Completed:** 2025-10-26
**Plan:** 2025-10-26-iwaa-tenure-fix-complete.md
**Status:** ✅ COMPLETE
**Tests:** All passing

---

## Summary

Fixed two critical mortgage calculation bugs affecting loan tenure and max loan amounts:

1. **IWAA (Income-Weighted Average Age) not used for joint applicants**
   - System ignored co-applicant age, resulting in incorrect tenure caps
   - Now calculates IWAA properly: `(Age1×Income1 + Age2×Income2) / Total Income`
   - Rounds UP per Dr Elena v2 spec (Math.ceil)

2. **55% LTV extended tenure rules missing**
   - Borrowers with 55% LTV (safer tier) should get longer tenure
   - HDB 55% LTV: Now uses `MIN(75-IWAA, 30)` instead of `MIN(65-IWAA, 25)`
   - EC/Private/Landed 55% LTV: Now capped at 35 years instead of 30

---

## Changes Made

### Code Changes

| File | Lines Changed | Description |
|------|---------------|-------------|
| `lib/calculations/instant-profile.ts` | ~50 lines | IWAA tenure calculation, 55% LTV rules |
| `hooks/useProgressiveFormController.ts` | ~30 lines | Extract co-applicant data, pass to calc engine |
| `lib/calculations/__tests__/iwaa-tenure-integration.test.ts` | New file, ~300 lines | 20+ integration tests |

### Tests Added

- **IWAA Rounding Tests:** 6 tests (already existed, verified)
- **IWAA Tenure Integration:** 20+ tests covering:
  - All property types (HDB, EC, Private, Commercial)
  - Both LTV tiers (75% base, 55% extended)
  - Edge cases (old applicants, zero income co-applicant, mismatched arrays)

### Documentation

- Comprehensive code comments with Dr Elena v2 line references
- JSDoc comments on interfaces
- Manual test results documented
- This completion report

---

## Test Results

### Automated Tests

```bash
✅ IWAA Rounding: 6/6 pass
✅ IWAA Tenure Integration: 20/20 pass
✅ Existing Instant Profile Tests: All pass (no regressions)
✅ TypeScript: No compilation errors
```

### Manual Browser Tests

```bash
✅ Single applicant: Correct tenure calculation
✅ Joint applicant (younger co-applicant): IWAA extends tenure correctly
✅ All property types verified
✅ No console errors
```

---

## What Works Now

### Scenarios Fixed

**Before (WRONG):**
```
Applicant 1: Age 50, Income $10,000
Applicant 2: Age 30, Income $2,000

System used: Age 50
Tenure: MIN(65-50, 25) = 15 years
Result: Lower max loan due to short tenure
```

**After (CORRECT):**
```
Applicant 1: Age 50, Income $10,000
Applicant 2: Age 30, Income $2,000

System uses: IWAA = 47 (weighted average)
Tenure: MIN(65-47, 25) = 18 years
Result: Higher max loan due to longer tenure ✅
```

### Backwards Compatibility

- ✅ Single applicant forms still work (uses `age` parameter)
- ✅ Existing code not passing arrays continues to function
- ✅ All existing tests pass without modification

---

## What's NOT Done (Out of Scope)

These were intentionally excluded and should be separate tasks:

1. **LTV Tier Auto-Detection**
   - Code supports both 75% and 55% LTV formulas
   - But doesn't automatically detect which tier applies
   - Need separate logic to determine LTV tier based on:
     - Loan amount vs property value
     - TDSR/MSR breach
     - Age triggers (loan end age > 65)

2. **MasReadiness Sidebar UI Updates**
   - Sidebar calculation engine now uses correct tenure
   - But sidebar display may not show updated max loan prominently
   - Needs UI/UX improvements (separate ticket)

3. **Refinancing Tenure Rules**
   - This fix covers new purchase only
   - Refinancing has different formula: `MIN(original_tenure - years_elapsed, caps)`
   - Separate implementation needed

---

## Known Limitations

1. **Manual LTV Tier Selection**
   - `ltvMode` parameter exists (55 or 75)
   - But form controller doesn't auto-detect which tier
   - For now, assumes 75% LTV by default
   - Future: Add detection logic based on MAS triggers

2. **HDB Lease Remaining**
   - Dr Elena v2 spec mentions lease remaining affects LTV tier
   - Not currently captured in form
   - May need additional form fields

---

## Verification Steps (For Reviewer)

### 1. Run Tests

```bash
npm test -- lib/calculations/__tests__/iwaa-rounding-fix.test.ts
npm test -- lib/calculations/__tests__/iwaa-tenure-integration.test.ts
npm test -- lib/calculations/__tests__/instant-profile.test.ts
```

**Expected:** All pass ✅

### 2. Check TypeScript

```bash
npx tsc --noEmit
```

**Expected:** No errors ✅

### 3. Manual Test (Browser)

```bash
npm run dev
# Open http://localhost:3000/apply
```

**Test:**
- Fill form with joint applicants (different ages)
- Check console for IWAA calculation logs
- Verify tenure cap is correct

### 4. Code Review Checklist

- [ ] Dr Elena v2 line references present in comments
- [ ] IWAA uses Math.ceil (round UP, not round)
- [ ] All property types handled (HDB, EC, Private, Commercial)
- [ ] Both LTV tiers implemented (75% and 55%)
- [ ] Backwards compatibility maintained (single age still works)
- [ ] Edge cases handled (old applicants, zero income, mismatched arrays)

---

## Commits Made

```
1. test: add IWAA tenure integration tests (failing)
2. feat: add ages and incomes arrays to InstantProfileInput
3. feat: implement IWAA-based tenure calculation
4. fix: handle edge cases for IWAA tenure calculation
5. feat: pass co-applicant ages/incomes for IWAA calculation
6. test: update existing tests for IWAA compatibility
7. docs: manual test results for IWAA fix
8. docs: add comprehensive comments for IWAA implementation
```

---

## Follow-Up Tasks

Create these as separate tickets:

### HIGH Priority

1. **LTV Tier Auto-Detection**
   - Detect when 55% LTV applies
   - Implement MAS triggers:
     - Loan end age > 65
     - HDB lease < 20 years remaining
     - Property value decline risk
   - File: `lib/calculations/ltv-tier-detection.ts`

2. **Update MasReadiness Sidebar**
   - Display corrected max loan prominently
   - Show IWAA in sidebar (if joint applicants)
   - Update "readiness" calculation
   - File: `components/forms/instant-analysis/MasReadinessSidebar.tsx`

### MEDIUM Priority

3. **Refinancing Tenure Rules**
   - Different formula: `MIN(original_tenure - years_elapsed - 1, caps)`
   - Add to instant-profile.ts
   - Tests for refinance scenarios

4. **HDB Lease Remaining Field**
   - Add to Step 2 of form
   - Use for LTV tier detection
   - Dr Elena v2 compliance

### LOW Priority

5. **Admin Dashboard**
   - Show IWAA in application details
   - Audit trail for tenure calculations
   - Compliance reporting

---

## Sign-Off

**Developer:** [Your Name]
**Date:** 2025-10-26
**Tests:** All passing ✅
**Ready for:** Code review + merge

**Reviewer:** _______________
**Date Reviewed:** _______________
**Status:** ⬜ Approved  ⬜ Changes Requested

---

## Appendix: Dr Elena v2 References

### IWAA Formula (lines 164-168)

```json
{
  "iwaa_calculation": {
    "description": "Income-Weighted Average Age for joint borrowers",
    "formula": "(Σ Age_i × Income_i) / (Σ Income_i)",
    "rounding": "Round up to nearest integer",
    "purpose": "Used for tenure/LTV trigger test"
  }
}
```

### Tenure Rules Summary

| Property | LTV Tier | Formula | Cap |
|----------|----------|---------|-----|
| HDB | 75% | MIN(65 - IWAA, 25) | 25 years |
| HDB | 55% | MIN(75 - IWAA, 30) | 30 years |
| EC | 75% | MIN(65 - IWAA, 30) | 30 years |
| EC | 55% | MIN(65 - IWAA, 35) | 35 years |
| Private | 75% | MIN(65 - IWAA, 30) | 30 years |
| Private | 55% | MIN(65 - IWAA, 35) | 35 years |
| Commercial | 75% | MIN(65 - IWAA, 30) | 30 years |
| Commercial | 55% | MIN(65 - IWAA, 35) | 35 years |

---

**END OF COMPLETION REPORT**
```

**Steps to Create:**

1. Copy template above
2. Fill in your name and date
3. Update any sections based on your actual implementation
4. Save to: `docs/plans/active/2025-10-26-iwaa-tenure-fix-COMPLETION.md`

**Commit:**
```bash
git add docs/plans/active/2025-10-26-iwaa-tenure-fix-COMPLETION.md
git commit -m "docs: completion report for IWAA tenure fix

- Document all changes made
- Test results summary
- Known limitations and follow-up tasks
- Sign-off checklist for reviewer"
```

---

### Task 10: Archive Plan and Update Work Log (10 minutes)

**Goal:** Mark plan as complete and archive for future reference.

**Steps:**

1. **Update Work Log:**

   ```bash
   # Open docs/work-log.md
   # Add completion entry
   ```

   **Content:**
   ```markdown
   ## 2025-10-26 - IWAA & 55% LTV Tenure Fix - COMPLETE ✅

   **Summary:** Fixed mortgage calculation bugs for joint applicant tenure and 55% LTV extended tenure rules.

   **Bugs Fixed:**
   1. IWAA not calculated for joint applicants
   2. 55% LTV missing extended tenure caps

   **Files Modified:**
   - lib/calculations/instant-profile.ts (+50 lines)
   - hooks/useProgressiveFormController.ts (+30 lines)

   **Tests Added:**
   - lib/calculations/__tests__/iwaa-tenure-integration.test.ts (20+ tests)

   **Tests Passing:** All (no regressions)

   **Commits:**
   - test: add IWAA tenure integration tests (failing)
   - feat: add ages and incomes arrays to InstantProfileInput
   - feat: implement IWAA-based tenure calculation
   - fix: handle edge cases for IWAA tenure calculation
   - feat: pass co-applicant ages/incomes for IWAA calculation
   - test: update existing tests for IWAA compatibility
   - docs: manual test results for IWAA fix
   - docs: add comprehensive comments for IWAA implementation
   - docs: completion report for IWAA tenure fix

   **Plan:** docs/plans/active/2025-10-26-iwaa-tenure-fix-complete.md
   **Completion Report:** docs/plans/active/2025-10-26-iwaa-tenure-fix-COMPLETION.md

   **Follow-Up Tasks:**
   - LTV tier auto-detection
   - Update MasReadiness sidebar UI
   - Refinancing tenure rules (separate implementation)

   **Ready for:** Code review + merge to main branch
   ```

2. **Archive Plan:**

   ```bash
   # Create archive directory if needed
   mkdir -p docs/plans/archive/2025/10

   # Move plan to archive
   mv docs/plans/active/2025-10-26-iwaa-tenure-fix-complete.md \
      docs/plans/archive/2025/10/

   # Move completion report to archive
   mv docs/plans/active/2025-10-26-iwaa-tenure-fix-COMPLETION.md \
      docs/plans/archive/2025/10/

   # Keep manual test results in active if still relevant
   # Or move it too:
   mv docs/plans/active/2025-10-26-iwaa-manual-test-results.md \
      docs/plans/archive/2025/10/
   ```

3. **Commit:**
   ```bash
   git add docs/work-log.md
   git add docs/plans/archive/2025/10/
   git commit -m "docs: archive IWAA tenure fix plan

   - Mark plan as complete in work log
   - Move plan and completion report to archive
   - All tests passing, ready for review"
   ```

**Acceptance Criteria:**
- ✅ Work log updated with completion entry
- ✅ Plan files moved to `docs/plans/archive/2025/10/`
- ✅ Follow-up tasks documented
- ✅ Clear status: READY FOR REVIEW

---

## Testing Strategy

### Test Pyramid

```
        E2E Tests (Manual)
       ┌─────────────────┐
       │  Browser Tests  │  ← Verify UI + calculation integration
       └─────────────────┘
              ▲
              │
    ┌─────────────────────────┐
    │  Integration Tests      │  ← Test calculateInstantProfile with arrays
    │  (iwaa-tenure-*.test)   │     Verify all property types, LTV tiers
    └─────────────────────────┘
              ▲
              │
  ┌───────────────────────────────┐
  │  Unit Tests                   │  ← Test calculateIWAA function
  │  (iwaa-rounding-fix.test)     │     Verify rounding, edge cases
  └───────────────────────────────┘
```

### Test Coverage Requirements

- **Unit Tests (calculateIWAA):** 100% coverage
  - Rounding (Math.ceil vs Math.round)
  - Single applicant
  - Joint applicants (equal income, weighted income)
  - Edge cases (zero income, mismatched arrays)

- **Integration Tests (calculateInstantProfile):** All scenarios
  - 4 property types × 2 LTV tiers = 8 main scenarios
  - Edge cases: old applicants, backwards compatibility
  - Total: 20+ tests

- **Regression Tests:** All existing tests must pass
  - `instant-profile.test.ts`
  - Other calculation tests

### Test Data Design

**Good Test Design Principles:**

1. **Use Realistic Values:**
   ```typescript
   // ✅ GOOD - Realistic Singapore property/income
   property_price: 500000,  // $500k HDB
   incomes: [5000, 3000],   // $5k + $3k/month
   ages: [35, 30]           // Typical first-time buyers

   // ❌ BAD - Unrealistic values
   property_price: 100,
   incomes: [1, 1],
   ages: [1, 1]
   ```

2. **Test Boundary Conditions:**
   ```typescript
   // Test age limits
   ages: [18, 18]  // Minimum age
   ages: [70, 70]  // Very old (tenure = 1 year)
   ages: [65, 64]  // Just at boundary (65 - 65 = 0 → cap at 1)
   ```

3. **Test Regulatory Caps:**
   ```typescript
   // HDB 75% LTV: Cap is 25 years
   ages: [30, 25]  // IWAA = 28, 65-28=37 → MIN(37, 25) = 25

   // HDB 55% LTV: Cap is 30 years
   ages: [30, 25]  // IWAA = 28, 75-28=47 → MIN(47, 30) = 30
   ```

4. **Test Both Cap Types:**
   ```typescript
   // Age-capped scenario
   ages: [55, 50]  // IWAA = 53, 65-53=12 < 25 → capped by age

   // Regulation-capped scenario
   ages: [30, 25]  // IWAA = 28, 65-28=37 > 25 → capped by regulation
   ```

5. **Avoid Magic Numbers:**
   ```typescript
   // ✅ GOOD - Clear calculation
   // IWAA = (35×5000 + 30×3000) / 8000 = 33.125 → ceil = 34
   const ages = [35, 30]
   const incomes = [5000, 3000]
   const expectedIWAA = 34

   // ❌ BAD - Unclear why we expect 34
   expect(calculateIWAA([35, 30], [5000, 3000])).toBe(34)
   ```

6. **Test Error Messages:**
   ```typescript
   // Include helpful comments in tests
   it('should use IWAA for joint applicants', () => {
     // Given: Joint applicants with IWAA = 34
     // When: Calculate tenure for HDB 75% LTV
     // Then: Tenure = MIN(65-34, 25) = MIN(31, 25) = 25
   })
   ```

---

## Verification Checklist

Before marking this plan as COMPLETE, verify:

### Code Quality

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No ESLint warnings in modified files
- [ ] All functions have JSDoc comments
- [ ] Dr Elena v2 line references included in comments
- [ ] Console.log statements left in for debugging (helpful for future)

### Testing

- [ ] All new tests pass (20+ integration tests)
- [ ] All existing tests still pass (no regressions)
- [ ] Manual browser testing completed
- [ ] Edge cases covered (old applicants, zero income, mismatched arrays)

### Functionality

- [ ] IWAA calculated correctly (Math.ceil for rounding)
- [ ] Tenure uses IWAA when joint applicants
- [ ] Falls back to single age when arrays not provided
- [ ] 55% LTV extended tenure caps implemented
- [ ] HDB 55% LTV uses 75-IWAA formula (not 65-IWAA)
- [ ] All property types supported (HDB, EC, Private, Commercial)

### Documentation

- [ ] Work log updated with completion entry
- [ ] Completion report created
- [ ] Code comments comprehensive
- [ ] Manual test results documented
- [ ] Follow-up tasks identified

### Version Control

- [ ] All changes committed with clear messages
- [ ] Commits follow conventional commit format
- [ ] Branch is clean (no unrelated changes)
- [ ] Ready to create pull request

---

## Rollback Plan

If bugs are discovered after merge:

### Immediate Rollback (Nuclear Option)

```bash
# Revert all commits from this feature
git log --oneline | grep "IWAA\|tenure"  # Find commit hashes

# Revert in reverse order
git revert <commit-8>
git revert <commit-7>
# ... etc

# Or revert entire branch
git revert -m 1 <merge-commit-hash>
```

### Partial Rollback (Surgical Fix)

If only one part is broken:

1. **Keep IWAA rounding fix** (already done, safe)
2. **Revert tenure calculation** if it causes issues:
   ```bash
   git revert <commit-hash-for-tenure-implementation>
   ```

3. **Revert form controller changes** if data extraction fails:
   ```bash
   git revert <commit-hash-for-form-controller>
   ```

### Hot Fix Process

If critical bug found:

1. Create hot fix branch: `git checkout -b hotfix/iwaa-tenure-fix`
2. Fix the specific bug
3. Write failing test first (TDD)
4. Fix the code
5. Verify all tests pass
6. Fast-track PR review
7. Merge to main immediately

### Monitoring After Deployment

Watch for:
- User reports of incorrect loan amounts
- Console errors in production logs
- Chatwoot tickets mentioning tenure or max loan
- Analytics: Track form completion rate (should not drop)

---

## Appendix: Common Errors and Solutions

### Error 1: "Property 'ages' does not exist"

**Cause:** TypeScript interface not updated

**Fix:** Add `ages?: number[]` to `InstantProfileInput` interface

---

### Error 2: "Cannot read property 'length' of undefined"

**Cause:** Code assumes `ages` array exists

**Fix:** Add null check:
```typescript
const effectiveAge = (ages && ages.length > 0)
  ? calculateIWAA(ages, incomes)
  : age
```

---

### Error 3: Test expects 25 but gets 30

**Cause:** Test assumes 75% LTV but code using 55% LTV

**Fix:** Check `ltvMode` parameter in test:
```typescript
const result = calculateInstantProfile({
  // ...
}, 75)  // ← Explicitly set LTV mode
```

---

### Error 4: IWAA is 33 instead of 34

**Cause:** Using `Math.round()` instead of `Math.ceil()`

**Fix:** Update `calculateIWAA` function:
```typescript
return Math.ceil(weightedSum)  // Not Math.round()
```

---

### Error 5: "actualAges is undefined"

**Cause:** Form not collecting co-applicant ages

**Fix:** Verify form fields in `ProgressiveFormWithController.tsx`:
```typescript
// Check form schema includes:
actualAges: z.array(z.number()).optional()
```

---

### Error 6: Tenure is negative

**Cause:** Very old applicants (65 - 70 = -5)

**Fix:** Add minimum cap:
```typescript
const ageBasedCap = Math.max(ageLimitBase - effectiveAge, 1)
```

---

### Error 7: Tests pass but browser shows wrong values

**Cause:** Form controller not passing arrays to calculation engine

**Fix:** Verify `useProgressiveFormController.ts` includes:
```typescript
ages: parsedAges.length > 0 ? parsedAges : undefined,
incomes: parsedIncomes.length > 0 ? parsedIncomes : undefined,
```

---

### Error 8: Build fails in production

**Cause:** TypeScript strict mode errors

**Fix:** Run build locally first:
```bash
npm run build
```

Fix any TypeScript errors before deploying.

---

## Glossary

| Term | Definition |
|------|------------|
| **IWAA** | Income-Weighted Average Age - MAS formula for joint borrowers |
| **LTV** | Loan-to-Value ratio (loan amount ÷ property price) |
| **MAS** | Monetary Authority of Singapore (financial regulator) |
| **TDSR** | Total Debt Servicing Ratio (max 55% of income) |
| **MSR** | Mortgage Servicing Ratio (max 30% of income, HDB/EC only) |
| **Tenure** | Loan repayment period in years |
| **Dr Elena v2** | Regulatory specification file for mortgage calculations |
| **55% LTV Tier** | Reduced loan amount tier with extended tenure benefits |
| **Regulatory Cap** | Maximum tenure allowed by property type regulation |
| **Age-Based Cap** | Maximum tenure allowed by borrower age |

---

**END OF IMPLEMENTATION PLAN**

This plan is comprehensive and ready for a skilled developer with zero context on our codebase. Each task includes:
- Clear goal
- Exact files to modify
- Code snippets
- Testing approach
- Commit messages
- Acceptance criteria

Follow TDD throughout, commit frequently, and update the work log as you go.
