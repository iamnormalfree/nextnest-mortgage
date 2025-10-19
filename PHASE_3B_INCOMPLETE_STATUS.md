# Phase 3B: INCOMPLETE - Critical Fix Missing

**Date:** 2025-10-19
**Status:** ⚠️ INCOMPLETE - Core bug still present
**Context Window:** Ending, needs fresh continuation

---

## 🚨 CRITICAL ISSUE DISCOVERED

**User Question:** "Why is the instant analysis for HDB resale, $1M and 38 combined age still shows MSR calculations?"

**Answer:** Phase 3B was marked complete but the **core fix was never applied**.

**Evidence:**
```
Step 2 showing: "Based on your income, you can borrow comfortably within MSR guidelines"
Expected: "Based on property regulations and LTV limits" (Step 2 = pure LTV, NO income)
```

---

## What's Actually Complete ✅

### Phase 3A: Types + Pure LTV Calculation ✅ DONE
- ✅ `lib/contracts/form-contracts.ts` - Discriminated union types added
- ✅ `lib/calculations/instant-profile-pure-ltv.ts` - Pure LTV function created
- ✅ `tests/calculations/pure-ltv.test.ts` - 11/11 tests passing
- ✅ 100% Dr. Elena v2 compliance verified

### Phase 3C: UI Type Guards ✅ DONE
- ✅ Fixed property name mismatch: `maxLoan` → `maxLoanAmount`
- ✅ Added type guard imports to `ProgressiveFormWithController.tsx`
- ✅ Added type guards for discriminated union rendering
- ✅ Fixed `tenureCapYears` → `effectiveTenure`
- ✅ Updated `Step3NewPurchase.tsx` to use `InstantCalcResult` type
- ✅ Fixed `FullAnalysisCalcResult` construction in hook
- ✅ Fixed `RefinanceCalcResult` construction
- ✅ Excluded `plugins.disabled` from TypeScript compilation
- ✅ **Build passing successfully**

---

## What's MISSING ❌

### Phase 3B: Form State Management - INCOMPLETE

**File:** `hooks/useProgressiveFormController.ts`

**What was added:**
- ✅ Lines 15, 26 - Type imports
- ✅ Lines 39, 106 - State variable types updated
- ✅ Lines 290-318 - Helper functions added:
  ```typescript
  const hasRequiredStep2Data = useCallback(...)
  const hasRequiredStep3Data = useCallback(...)
  ```

**What's STILL MISSING (THE CRITICAL BUG):**
- ❌ **Lines 320-533** - `calculateInstant()` function body NOT replaced
- ❌ **Line 374** - Still has hardcoded $8,000 income:
  ```typescript
  const income = Math.max(parseNumber(formData.actualIncomes?.[0] ?? formData.monthlyIncome, 8000), 0)
  ```

**Current function still:**
1. Always calls `calculateInstantProfile()` (old function with income)
2. Never checks `currentStep` for routing
3. Never calls `calculatePureLtvMaxLoan()` (new pure LTV function)
4. Always applies MSR/TDSR calculations even on Step 2

---

## Required Fix (Phase 3B Completion)

### Target File
`C:\Users\HomePC\Desktop\Code\NextNest\hooks\useProgressiveFormController.ts`

### Lines to Replace
Lines 321-533 (entire `calculateInstant` function body)

### Replacement Logic (from IMPLEMENTATION_STATUS_FINAL.md lines 83-131)

```typescript
const calculateInstant = useCallback((options: { force?: boolean; ltvMode?: number } = {}) => {
  const { force = false } = options
  if (hasCalculated && !force) {
    return
  }

  const formData = form.getValues()

  // STEP-AWARE ROUTING BASED ON CURRENT STEP
  if (currentStep === 2) {
    // STEP 2: PURE LTV CALCULATION (NO INCOME)
    if (!hasRequiredStep2Data()) {
      setInstantCalcResult(null)
      return
    }

    const parseNumber = (value: any, fallback: number) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    const propertyPrice = parseNumber(formData.priceRange ?? formData.propertyPrice, 0)
    if (propertyPrice <= 0) {
      setInstantCalcResult(null)
      return
    }

    const rawPropertyType = formData.propertyType || (propertyCategory === 'commercial' ? 'Commercial' : undefined)
    const personaPropertyType: 'HDB' | 'Private' | 'EC' | 'Commercial' = (() => {
      switch (rawPropertyType) {
        case 'Private':
        case 'Landed':
          return 'Private'
        case 'EC':
          return 'EC'
        case 'Commercial':
          return 'Commercial'
        case 'HDB':
        default:
          return 'HDB'
      }
    })()

    // ⚠️ CRITICAL FIX: Call pure LTV function (NO INCOME PARAMETER)
    const pureLtvResult = calculatePureLtvMaxLoan({
      property_price: propertyPrice,
      existing_properties: parseNumber(formData.existingProperties, 0),
      age: parseNumber(formData.combinedAge, 35),
      property_type: personaPropertyType
    })

    setInstantCalcResult(pureLtvResult) // calculationType: 'pure_ltv'
    setIsInstantCalcLoading(true)
    setShowInstantCalc(false)

    instantCalcTimerRef.current = setTimeout(() => {
      setShowInstantCalc(true)
      setIsInstantCalcLoading(false)
    }, 1000)

    setHasCalculated(true)

  } else if (currentStep >= 3) {
    // STEP 3+: FULL ANALYSIS WITH INCOME
    if (!hasRequiredStep3Data()) {
      setInstantCalcResult(null)
      return
    }

    const parseNumber = (value: any, fallback: number) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    // ⚠️ CRITICAL: Validate actual income (NO DEFAULT)
    const actualIncome = parseNumber(formData.actualIncomes?.[0], 0)
    if (actualIncome <= 0) {
      setInstantCalcResult(null)
      return
    }

    // [Continue with existing calculation logic but using actualIncome]
    // ... (rest of the new_purchase calculation from lines 340-456)
  }

  // Keep refinance branch as-is (lines 458-512)
}, [currentStep, hasRequiredStep2Data, hasRequiredStep3Data, form, mappedLoanType, propertyCategory, hasCalculated])
```

---

## Key Changes Needed

### 1. Add Step-Aware Routing
```typescript
if (currentStep === 2) {
  // Pure LTV path
} else if (currentStep >= 3) {
  // Full analysis path
}
```

### 2. Step 2: Pure LTV (NO INCOME)
```typescript
const pureLtvResult = calculatePureLtvMaxLoan({
  property_price: propertyPrice,
  existing_properties: formData.existingProperties,
  age: parseNumber(formData.combinedAge, 35),
  property_type: personaPropertyType
})
setInstantCalcResult(pureLtvResult) // calculationType: 'pure_ltv'
```

### 3. Step 3+: Validate Income (NO DEFAULT)
```typescript
const actualIncome = parseNumber(formData.actualIncomes?.[0], 0)
if (actualIncome <= 0) {
  setInstantCalcResult(null)
  return
}
// Then use actualIncome (not hardcoded 8000)
```

### 4. Update Dependencies
```typescript
}, [currentStep, hasRequiredStep2Data, hasRequiredStep3Data, form, mappedLoanType, propertyCategory, hasCalculated])
```

---

## Verification After Fix

### Test Scenario
1. Navigate to Step 2
2. Enter: HDB Resale, $1M, age 38, first property
3. Check instant analysis

### Expected Results
- ✅ Shows: "$750,000" (75% LTV for first property)
- ✅ Message: "Based on property regulations and LTV limits"
- ✅ NO mention of MSR/TDSR/income
- ✅ `instantCalcResult.calculationType === 'pure_ltv'`
- ✅ `instantCalcResult.limitingFactor === 'LTV'`
- ✅ No 'msr_limited' or 'tdsr_limited' in reason codes

### Current (Wrong) Results
- ❌ Shows: "$454,000" (MSR-limited with hardcoded income)
- ❌ Message: "Based on your income, you can borrow comfortably within MSR guidelines"
- ❌ Still using income-based calculations on Step 2

---

## References for Next Session

### Key Documents
1. **`IMPLEMENTATION_STATUS_FINAL.md`** - Lines 83-131 show exact replacement logic
2. **`docs/plans/active/2025-10-19-calculation-fix-synthesis.md`** - Full implementation plan
3. **`docs/plans/active/2025-10-19-step2-instant-analysis-pure-ltv-calculation.md`** - Step 2 specification

### Test Files
1. **`tests/calculations/pure-ltv.test.ts`** - 11/11 passing (pure function works)
2. Need to add hook-level tests after fix

### Current Build Status
✅ Build passing (all type errors fixed in Phase 3C)
⚠️ Functionality wrong (Step 2 using income calculations)

---

## Next Steps for Fresh Context

1. **Read this file** to understand current state
2. **Read** `hooks/useProgressiveFormController.ts` lines 320-533
3. **Replace** the entire `calculateInstant` function body with step-aware version
4. **Test** Step 2 calculation manually or with Playwright
5. **Verify** all 30+ items in verification checklist (IMPLEMENTATION_STATUS_FINAL.md lines 250-288)
6. **Mark Phase 3B** as actually complete
7. **Proceed to Phase 4** (E2E testing)

---

## Why This Matters

**This is the ROOT CAUSE of the original bug report:**
- User on Step 2 sees MSR-based calculation using hardcoded $8,000 income
- Should see pure LTV calculation based only on property regulations
- $1M HDB should show $750k (75% LTV), not $454k (MSR-limited)

**Fix will resolve:**
- ✅ Hardcoded income removed from Step 2
- ✅ Step 2 uses pure LTV (no income parameter)
- ✅ Step 3+ validates actual income (no defaults)
- ✅ UI messaging will be accurate (via calculationType discriminator)
- ✅ 100% Dr. Elena v2 compliance achieved

---

**Status:** Ready for implementation in fresh context window
**Blocker:** None - all dependencies complete, just needs function replacement
**Risk:** Medium - core logic change, but well-specified and tested function available
**Estimated Time:** 30-60 minutes (careful replacement + verification)
