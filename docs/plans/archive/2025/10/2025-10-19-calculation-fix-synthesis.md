# Progressive Form Calculation Fix - Implementation Synthesis

**Date:** 2025-10-19
**Status:** Ready for Implementation
**Phase:** 2 (Synthesis Complete)
**Quality Bar:** "Cannot be wrong in calculations" - Dr. Elena v2 compliance required

---

## Executive Summary

This document synthesizes the comprehensive calculation audit (Phase 0) and multi-domain planning (Phase 1a/1b/1c) into a unified, conflict-free implementation blueprint for fixing calculation errors across the progressive form workflow.

**Core Fix:** Remove hardcoded $8,000 income assumption on Step 2, implement step-aware calculation routing that uses pure LTV for Step 2 and full MSR/TDSR analysis for Step 3.

**Timeline:** 15 hours (2 days) across 5 implementation phases
**Risk:** LOW - Changes are additive, backward compatible, with feature flag rollback

---

## Integration Contracts Verified

### Type Compatibility ✅

**Discriminated Union Pattern:**
```typescript
// form-contracts.ts
export type InstantCalcResult = PureLtvCalcResult | FullAnalysisCalcResult | RefinanceCalcResult

// All three domains use same discriminator field
interface PureLtvCalcResult {
  calculationType: 'pure_ltv'  // ← Discriminator
  // ...
}

interface FullAnalysisCalcResult {
  calculationType: 'full_analysis'  // ← Discriminator
  // ...
}
```

**Type Guards for UI:**
```typescript
export const isPureLtvResult = (result: InstantCalcResult): result is PureLtvCalcResult => {
  return result.calculationType === 'pure_ltv'
}
```

**✅ No conflicts** - All domains agree on discriminator pattern

### Data Flow Integrity ✅

**Step 2: Pure LTV Calculation**
```
User Input (Step 2):
  - propertyPrice
  - propertyType
  - existingProperties
  - combinedAge

    ↓

Form Controller (useProgressiveFormController.ts):
  - Calls calculatePureLtvMaxLoan()
  - NO income parameter
  - Sets calculationType: 'pure_ltv'

    ↓

Calculation (instant-profile.ts):
  - Returns maxLoanAmount based on LTV only
  - Includes reasonCodes: ['first_property_75_ltv']
  - NO MSR/TDSR checks

    ↓

UI Display (ProgressiveFormWithController.tsx):
  - Checks isPureLtvResult(result)
  - Shows "Based on property regulations"
  - NO mention of income
```

**Step 3: Full Analysis**
```
User Input (Step 3):
  - actualIncomes[0] (required)
  - existingCommitments

    ↓

Form Controller:
  - Calls calculateInstantProfile()
  - Uses ACTUAL income (no default)
  - Sets calculationType: 'full_analysis'

    ↓

Calculation:
  - Returns maxLoanAmount with MSR/TDSR checks
  - Includes limitingFactor: 'MSR' | 'TDSR' | 'LTV'

    ↓

UI Display:
  - Checks isFullAnalysisResult(result)
  - Shows "Based on your income and MAS compliance"
  - Shows TDSR/MSR status
```

**✅ No conflicts** - Data flow is clean and step-aware

### State Transitions ✅

**Scenario 1: Step 2 → Step 3 (Forward)**
- Step 2 shows pure LTV result ($750k)
- User enters income on Step 3
- `hasRequiredStep3Data()` returns true
- `calculateInstant()` re-runs with actual income
- Step 3 shows full analysis ($750k or less if MSR/TDSR limited)

**Scenario 2: Step 3 → Step 2 (Back)**
- Step 3 shows full analysis result
- User clicks "Back"
- `prev()` callback clears `instantCalcResult`
- `hasRequiredStep2Data()` returns true
- `calculateInstant()` re-runs pure LTV calculation
- Step 2 shows pure LTV result again

**Scenario 3: Form Restoration**
- User refreshes page
- Form data restored from localStorage
- Current step restored
- Initialization effect checks `hasRequiredStep2Data()` or `hasRequiredStep3Data()`
- Triggers appropriate calculation based on current step

**✅ No conflicts** - All transitions handled correctly

---

## Implementation Order

### Critical Path Diagram

```
Phase A: Types
  (1 hour)
    ↓
Phase B: Calculation Logic
  (3 hours)
    ↓
Phase C: Form State Management  ← BOTTLENECK
  (4 hours)
    ↓
    ├──→ Phase D: UI Components
    │      (4 hours)
    │
    └──→ Phase E: Integration & E2E Tests
           (3 hours)

Total: 15 hours (2 working days)
```

### Phase Details

#### Phase A: Type System & Contracts
**No dependencies**

**Files Modified:**
1. `lib/contracts/form-contracts.ts`

**Changes:**
- Add `InstantCalcResult` discriminated union (lines after 418)
- Add `PureLtvCalcResult` interface
- Add `FullAnalysisCalcResult` interface
- Add `RefinanceCalcResult` interface
- Add type guard functions: `isPureLtvResult()`, `isFullAnalysisResult()`

**Tests:**
```typescript
// tests/types/form-contracts.test.ts
describe('InstantCalcResult type guards', () => {
  it('isPureLtvResult should identify pure LTV results', () => {
    const result: InstantCalcResult = {
      calculationType: 'pure_ltv',
      maxLoanAmount: 750000,
      // ...
    }
    expect(isPureLtvResult(result)).toBe(true)
    expect(isFullAnalysisResult(result)).toBe(false)
  })
})
```

**Duration:** 1 hour

---

#### Phase B: Calculation Logic
**Depends on:** Phase A (types must exist)

**Files Modified:**
1. `lib/calculations/instant-profile.ts`

**Changes:**
- Add `calculatePureLtvMaxLoan()` function (new export)
- Implement LTV tier selection (75%/45%/35%, reduced 55%/25%/15%)
- Implement age-based tenure caps
- Implement CPF vs cash down payment split
- Generate reason codes and policy refs
- Return `PureLtvCalcResult` type

**Function Signature:**
```typescript
export function calculatePureLtvMaxLoan(params: {
  property_price: number
  existing_properties: number
  age: number
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial'
}): PureLtvCalcResult
```

**Tests:**
```typescript
// tests/calculations/pure-ltv.test.ts
describe('calculatePureLtvMaxLoan', () => {
  it('HDB $1M first property age 35 should return $750k', () => {
    const result = calculatePureLtvMaxLoan({
      property_price: 1_000_000,
      existing_properties: 0,
      age: 35,
      property_type: 'HDB'
    })

    expect(result.maxLoanAmount).toBe(750_000)
    expect(result.ltvPercentage).toBe(75)
    expect(result.calculationType).toBe('pure_ltv')
    expect(result.limitingFactor).toBe('LTV')
    expect(result.reasonCodes).toContain('first_property_75_ltv')
    expect(result.reasonCodes).not.toContain('msr_limited')
  })

  // ... 4 more Dr. Elena v2 scenarios
})
```

**Dr. Elena v2 Compliance:**
- LTV tiers from `computational_modules.ltv_limits.individual_borrowers`
- Tenure rules from `computational_modules.tenure_rules`
- CPF rules from `computational_modules.cpf_usage_rules`
- Rounding rules from `computational_modules.rounding_rules`

**Duration:** 3 hours

---

#### Phase C: Form State Management
**Depends on:** Phase A (types), Phase B (calculation function)

**Files Modified:**
1. `hooks/useProgressiveFormController.ts`

**Changes:**
- **Line 37:** Change `instantCalcResult: any` → `instantCalcResult: InstantCalcResult | null`
- **Line 104:** Change `useState<any>(null)` → `useState<InstantCalcResult | null>(null)`
- **After line 286:** Add `hasRequiredStep2Data()` helper
- **After line 286:** Add `hasRequiredStep3Data()` helper
- **Lines 289-491:** Rewrite `calculateInstant()` function:
  - Add step-aware routing (if currentStep === 2, else if currentStep >= 3)
  - Step 2 branch: Call `calculatePureLtvMaxLoan()`, set `calculationType: 'pure_ltv'`
  - Step 3 branch: Call `calculateInstantProfile()` with actual income (NO default), set `calculationType: 'full_analysis'`
- **Lines 494-581:** Update debounced reactivity effect:
  - Add `currentStep` dependency
  - Check `hasRequiredStep2Data()` for Step 2 recalcs
  - Check `hasRequiredStep3Data()` for Step 3 recalcs
- **Lines 584-645:** Update initial trigger effect:
  - Only trigger on Step 2 with complete data
  - Use `hasRequiredStep2Data()` check
- **Line 773:** Update `prev()` callback:
  - Clear `instantCalcResult` state
  - Set `hasCalculated = false`
  - Trigger recalculation for new step after delay

**Critical Fix:**
```typescript
// OLD (Line 342 - WRONG):
const income = Math.max(parseNumber(formData.actualIncomes?.[0] ?? formData.monthlyIncome, 8000), 0)

// NEW - REMOVED from Step 2 branch entirely
// Step 2 branch now calls:
const pureLtvResult = calculatePureLtvMaxLoan({
  property_price: propertyPrice,
  existing_properties: formData.existingProperties,
  age: parseNumber(formData.combinedAge, 35),
  property_type: formData.propertyType
})
```

**Tests:**
```typescript
// tests/hooks/useProgressiveFormController.test.ts
describe('Step-aware calculation routing', () => {
  it('Step 2 should use pure LTV (no income)', async () => {
    const { result } = renderHook(() => useProgressiveFormController({
      loanType: 'new_purchase',
      sessionId: 'test',
      onStepCompletion: jest.fn(),
      onAIInsight: jest.fn(),
      onScoreUpdate: jest.fn()
    }))

    // Navigate to Step 2, fill data
    act(() => {
      result.current.setCurrentStep(2)
      result.current.setValue('propertyPrice', 1000000)
      result.current.setValue('propertyType', 'HDB')
      result.current.setValue('existingProperties', 0)
      result.current.setValue('combinedAge', 35)
    })

    // Wait for calculation
    await waitFor(() => {
      expect(result.current.instantCalcResult).toBeTruthy()
    }, { timeout: 2000 })

    // Assertions
    expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
    expect(result.current.instantCalcResult?.maxLoanAmount).toBe(750000)
  })

  it('Step 3 should use full analysis with actual income', async () => {
    // ... test full analysis with actualIncomes[0] = 8000
  })

  it('Step 3 should NOT calculate without income', async () => {
    // ... test that result is null if no income provided
  })
})
```

**Duration:** 4 hours

---

#### Phase D: UI Components
**Depends on:** Phase A (types), Phase B (calculation), Phase C (form state)

**Files Modified:**
1. `components/forms/ProgressiveFormWithController.tsx`

**Changes:**
- **Add components** (after line 50):
  - `InfoTooltip` component (educational popovers)
  - `PureLtvCard` component (Step 2 display)
  - `FullAnalysisCard` component (Step 3 display)
  - Error state components
- **Update lines 919-1102** (instant analysis display):
  - Replace with discriminator-based rendering
  - Use `isPureLtvResult()` type guard for Step 2 card
  - Use `isFullAnalysisResult()` type guard for Step 3 card
- **Update lines 456-483** (generateUserFriendlySummary):
  - Deprecate function (messaging now in cards)
- **Add tooltip content** (after components):
  - LTV definition
  - MSR definition
  - TDSR definition
  - CPF usage explanation
  - Minimum cash requirement explanation

**Step 2 Messaging:**
```tsx
{instantCalcResult && isPureLtvResult(instantCalcResult) && (
  <PureLtvCard result={instantCalcResult} formData={formData} />
)}

// Inside PureLtvCard:
<h4>Property Feasibility Check</h4>
<p>Based on property regulations and LTV limits</p>
<InfoTooltip>
  LTV (Loan-to-Value): Maximum loan percentage allowed by Singapore
  banking regulations. First property buyers can borrow up to 75%.
</InfoTooltip>
<div className="text-sm text-gray-600 mt-4">
  ℹ️ Next step: We'll check your income to confirm you can afford this amount
</div>
```

**Step 3 Messaging:**
```tsx
{instantCalcResult && isFullAnalysisResult(instantCalcResult) && (
  <FullAnalysisCard result={instantCalcResult} formData={formData} />
)}

// Inside FullAnalysisCard:
<h4>Income & Affordability Check</h4>
<p>Based on your income and MAS compliance</p>
<div className="flex items-center gap-2">
  {result.tdsrPass ? '✅' : '❌'} TDSR Check: {result.tdsrPass ? 'Pass' : 'Fail'}
</div>
{result.msrLimit && (
  <div className="flex items-center gap-2">
    {result.msrPass ? '✅' : '❌'} MSR Check: {result.msrPass ? 'Pass' : 'Fail'}
  </div>
)}
```

**Tests:**
```typescript
// tests/components/ProgressiveFormWithController.test.tsx
describe('Instant analysis display', () => {
  it('Step 2 should show pure LTV card', () => {
    const { getByText } = render(<ProgressiveFormWithController {...props} />)

    // Simulate Step 2 with pure LTV result
    act(() => {
      // ... setup
    })

    expect(getByText('Property Feasibility Check')).toBeInTheDocument()
    expect(getByText(/Based on property regulations/)).toBeInTheDocument()
    expect(queryByText(/Based on your income/)).not.toBeInTheDocument()
  })

  it('Step 3 should show full analysis card', () => {
    // ... test full analysis messaging appears
  })
})
```

**Duration:** 4 hours

---

#### Phase E: Integration & E2E Testing
**Depends on:** All previous phases

**Files Created:**
1. `e2e/step2-pure-ltv.spec.ts` (NEW)
2. `e2e/step3-full-analysis.spec.ts` (NEW)
3. `e2e/form-navigation-calculations.spec.ts` (NEW)

**E2E Test Scenarios:**

**Test 1: Step 2 Pure LTV Display**
```typescript
test('Step 2 shows pure LTV for HDB $1M first property', async ({ page }) => {
  await page.goto('/apply')

  // Step 0: Select loan type
  await page.click('text=New Property Purchase')
  await page.click('text=Continue')

  // Step 1: Enter contact info
  await page.fill('[name="name"]', 'John Doe')
  await page.fill('[name="email"]', 'john@example.com')
  await page.fill('[name="phone"]', '91234567')
  await page.click('text=Continue')

  // Step 2: Enter property details
  await page.click('text=Resale')
  await page.click('text=HDB')
  await page.fill('[name="priceRange"]', '1000000')
  await page.fill('[name="combinedAge"]', '35')
  await page.click('text=No existing properties')

  // Wait for instant analysis to appear
  await page.waitForSelector('text=Property Feasibility Check')

  // Verify pure LTV result
  await expect(page.locator('text=$750,000')).toBeVisible()
  await expect(page.locator('text=Based on property regulations')).toBeVisible()
  await expect(page.locator('text=Based on your income')).not.toBeVisible()

  // Verify educational content
  await page.hover('[aria-label="Info tooltip for LTV"]')
  await expect(page.locator('text=LTV (Loan-to-Value)')).toBeVisible()
})
```

**Test 2: Step 3 Full Analysis Display**
```typescript
test('Step 3 shows full analysis with income', async ({ page }) => {
  // ... navigate to Step 3 (reuse Step 2 setup)

  await page.click('text=Get instant loan estimate')

  // Step 3: Enter income
  await page.fill('[name="actualIncomes.0"]', '8000')
  await page.fill('[name="actualAges.0"]', '35')

  // Wait for full analysis
  await page.waitForSelector('text=Income & Affordability Check')

  // Verify full analysis result
  await expect(page.locator('text=Based on your income and MAS compliance')).toBeVisible()
  await expect(page.locator('text=TDSR Check')).toBeVisible()
  await expect(page.locator('text=MSR Check')).toBeVisible()
})
```

**Test 3: Back Navigation Recalculation**
```typescript
test('Back from Step 3 to Step 2 shows pure LTV again', async ({ page }) => {
  // ... navigate to Step 3, verify full analysis shown

  // Go back to Step 2
  await page.click('text=Back')

  // Wait for page transition
  await page.waitForSelector('text=What you need')

  // Verify pure LTV result restored
  await expect(page.locator('text=Property Feasibility Check')).toBeVisible()
  await expect(page.locator('text=$750,000')).toBeVisible()
  await expect(page.locator('text=Based on property regulations')).toBeVisible()
})
```

**Duration:** 3 hours

---

## Risk Mitigation

### Breaking Changes: NONE ✅

**All changes are additive:**
- `calculationType` field added (discriminator)
- `calculatePureLtvMaxLoan()` function added (new export)
- `hasRequiredStep2Data()` helper added (internal)
- `hasRequiredStep3Data()` helper added (internal)
- Existing functions unchanged (signatures preserved)

**Backward compatibility:**
- UI checks discriminator with type guards (graceful degradation)
- Form state uses discriminated union (TypeScript enforces correctness)
- Calculation functions return compatible types

### Rollback Strategy

**Feature Flag:**
```typescript
// lib/feature-flags.ts
export const USE_STEP_AWARE_CALCULATIONS =
  process.env.NEXT_PUBLIC_FEATURE_STEP_AWARE_CALCS !== 'false'

// In useProgressiveFormController.ts calculateInstant()
if (USE_STEP_AWARE_CALCULATIONS) {
  // New step-aware logic
  if (currentStep === 2) {
    // Pure LTV
  } else if (currentStep >= 3) {
    // Full analysis
  }
} else {
  // Legacy logic (fall back to current behavior)
  const income = Math.max(parseNumber(formData.actualIncomes?.[0] ?? formData.monthlyIncome, 8000), 0)
  // ... existing code
}
```

**Rollback Process:**
1. Set `NEXT_PUBLIC_FEATURE_STEP_AWARE_CALCS=false` in environment
2. Redeploy (no code changes needed)
3. Users see old behavior
4. Investigate and fix issue
5. Re-enable flag

### Edge Cases Handled

**1. User has income data but is on Step 2**
- ✅ Step 2 branch ignores income entirely
- ✅ Uses `calculatePureLtvMaxLoan()` which doesn't accept income parameter
- ✅ TypeScript prevents passing income

**2. User is on Step 3 but hasn't entered income**
- ✅ `hasRequiredStep3Data()` returns false
- ✅ `calculateInstant()` returns early (no calculation)
- ✅ UI shows validation message (form schema enforces required field)

**3. Form restored from localStorage**
- ✅ Initialization effect checks current step
- ✅ Calls appropriate calculation based on step
- ✅ Restores correct result type

**4. User changes property price on Step 2**
- ✅ Debounced reactivity effect detects change
- ✅ Re-runs pure LTV calculation (no income involved)
- ✅ Result updates after 500ms debounce

**5. Mobile layout**
- ✅ All new components use responsive Tailwind classes
- ✅ InfoTooltip adapts to mobile (smaller popover)
- ✅ Cards stack vertically on mobile

---

## Dr. Elena v2 Compliance

### LTV Tiers Consistency ✅

**All three domains use identical values:**

| Property Count | Base LTV | Reduced LTV | Min Cash (Base) | Min Cash (Reduced) |
|----------------|----------|-------------|-----------------|-------------------|
| First (0)      | 75%      | 55%         | 5%              | 10%               |
| Second (1)     | 45%      | 25%         | 25%             | 25%               |
| Third+ (2+)    | 35%      | 15%         | 25%             | 25%               |

**Source:** `dr-elena-mortgage-expert-v2.json` → `computational_modules.ltv_limits.individual_borrowers`

**Verified in:**
- ✅ Calculation logic (`calculatePureLtvMaxLoan()`)
- ✅ Form state (passes correct `existing_properties` value)
- ✅ UI messaging (displays correct LTV percentage)

### CPF Rules Consistency ✅

**Minimum Cash Requirements:**
- Base LTV: 5% cash minimum
- Reduced LTV: 10% cash minimum
- Second property: 25% cash minimum
- Commercial: 100% cash (NO CPF)

**CPF Withdrawal Limit:**
- 120% of property valuation/purchase price (lower of two)

**Verified in:**
- ✅ Calculation logic (computes CPF vs cash split)
- ✅ UI display (shows CPF allowed amount and minimum cash)

### Tenure Caps Consistency ✅

**Property Type Limits:**
- HDB concessionary: 25 years
- HDB bank loan: 30 years
- Private/EC: 30-35 years
- Commercial: 35 years

**Age-Based Limit:**
- Loan must end by age 65: `maxTenure = 65 - age`

**Verified in:**
- ✅ Calculation logic (applies both property and age limits)
- ✅ UI display (shows effective tenure with explanation)

### MSR/TDSR Compliance ✅

**Step 2: NO MSR/TDSR checks** (pure LTV only)
**Step 3: Full MSR/TDSR checks** with actual income

**Formulas:**
- TDSR: `(Income × 0.55) - Commitments`
- MSR: `Income × 0.30` (HDB/EC only)
- Stress rates: 4.0% residential, 5.0% commercial

**Verified in:**
- ✅ Step 2 calculation does NOT call MSR/TDSR functions
- ✅ Step 3 calculation uses `calculateInstantProfile()` with correct formulas
- ✅ UI shows MSR/TDSR status only on Step 3

---

## Test Strategy

### Unit Tests (Total: 8 test files)

1. **`tests/types/form-contracts.test.ts`** (NEW)
   - Type guard functions
   - Discriminator pattern validation

2. **`tests/calculations/pure-ltv.test.ts`** (NEW)
   - 5 Dr. Elena v2 scenarios:
     - HDB $1M first property age 35 → $750k
     - Private $1.5M first property age 35 → $1.125M
     - Private $1.5M second property age 35 → $675k
     - Commercial $2M first property age 35 → $1.2M
     - HDB $800k first property age 55 → $440k (reduced LTV)
   - Edge cases: age > 65, invalid inputs

3. **`tests/hooks/useProgressiveFormController.test.ts`** (NEW)
   - Step 2 uses pure LTV (no income)
   - Step 3 uses full analysis (with income)
   - Step 3 without income shows no result
   - Back navigation recalculates
   - Form restoration triggers correct calc

4. **`tests/calculations/instant-profile.test.ts`** (EXISTING - update)
   - Verify existing tests still pass
   - Add test: "Should NOT be called on Step 2"

5. **`tests/calculations/compliance-snapshot.test.ts`** (EXISTING - no changes)
   - Existing MSR/TDSR tests remain valid

### Integration Tests (Total: 3 scenarios)

1. **Step 2 Complete → Pure LTV Display**
   - Fill Step 2 form completely
   - Verify `instantCalcResult.calculationType === 'pure_ltv'`
   - Verify UI shows "Based on property regulations"

2. **Step 3 Complete → Full Analysis Display**
   - Fill Step 3 form with income
   - Verify `instantCalcResult.calculationType === 'full_analysis'`
   - Verify UI shows "Based on your income"

3. **Back Navigation → Recalculation**
   - Navigate Step 2 → Step 3 → back to Step 2
   - Verify calculation type changes appropriately
   - Verify UI messaging updates

### E2E Tests (Total: 5 user journeys)

1. **Full Happy Path: New Purchase HDB**
   - Step 0 → Step 1 → Step 2 (see pure LTV $750k) → Step 3 (see full analysis)
   - Verify numbers match Dr. Elena v2 expectations

2. **Full Happy Path: Refinance Private**
   - Refinance flow with refinance-specific calculations

3. **Validation Blocker: Step 2 Incomplete**
   - Try to advance without required fields
   - Verify form blocks progression

4. **Back Navigation: Recalculation**
   - Navigate forward and back
   - Verify calculations update correctly

5. **Mobile Viewport: Layout Integrity**
   - Run all tests on 375px viewport
   - Verify no layout breaks

**Total Test Coverage:** ~45 tests

---

## Final Verification Checklist

**Implementation Team: Check ALL items before deploying to production**

### Code Quality
- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] All ESLint warnings resolved (`npm run lint`)
- [ ] No console errors in browser
- [ ] No console warnings in browser (development mode)

### Calculation Correctness
- [ ] HDB $1M first property age 35 shows $750k on Step 2 (NOT $454k)
- [ ] Private $1.5M first property age 35 shows $1.125M on Step 2
- [ ] Private $1.5M second property age 35 shows $675k on Step 2
- [ ] Commercial $2M shows 100% cash down payment (NO CPF)
- [ ] All Dr. Elena v2 test scenarios pass

### Step 2 Pure LTV
- [ ] Step 2 calculation uses ZERO income data (no hardcoded defaults)
- [ ] Step 2 UI shows "Based on property regulations" (NOT "Based on your income")
- [ ] Step 2 `instantCalcResult.calculationType === 'pure_ltv'`
- [ ] Step 2 `limitingFactor === 'LTV'` (never MSR or TDSR)
- [ ] Step 2 reason codes do NOT contain 'msr_limited' or 'tdsr_limited'

### Step 3 Full Analysis
- [ ] Step 3 calculation uses ACTUAL income (formData.actualIncomes[0])
- [ ] Step 3 UI shows "Based on your income and MAS compliance"
- [ ] Step 3 `instantCalcResult.calculationType === 'full_analysis'`
- [ ] Step 3 shows TDSR check status
- [ ] Step 3 shows MSR check status (if HDB/EC)
- [ ] Step 3 shows monthly payment estimate

### Edge Cases
- [ ] User with income on Step 2 still sees pure LTV (income ignored)
- [ ] User without income on Step 3 sees validation message (no calculation)
- [ ] Back navigation from Step 3 to Step 2 shows pure LTV again
- [ ] Form restoration triggers correct calculation for current step
- [ ] Property price change on Step 2 recalculates pure LTV only

### UI/UX
- [ ] InfoTooltip component works (hover/click)
- [ ] All educational content displays correctly (LTV, MSR, TDSR definitions)
- [ ] Mobile layout not broken (test 320px, 375px, 768px viewports)
- [ ] No flickering during calculation loading states
- [ ] Debounce timing feels responsive (500ms)

### Tests
- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing
- [ ] All E2E tests passing (`npx playwright test`)
- [ ] Test output is pristine (no uncaught errors, warnings)
- [ ] Manual QA completed (real user flow testing)

### Documentation
- [ ] `CANONICAL_REFERENCES.md` updated with `calculatePureLtvMaxLoan()`
- [ ] `docs/work-log.md` updated with implementation notes
- [ ] Main plan marked "Implementation Complete"
- [ ] Any issues found during implementation documented

### Deployment
- [ ] Feature flag `NEXT_PUBLIC_FEATURE_STEP_AWARE_CALCS` set to `true` (or omitted)
- [ ] Rollback strategy tested (set flag to `false` and verify fallback works)
- [ ] Production build succeeds (`npm run build`)
- [ ] Lighthouse performance score >90

---

## Conflict Resolutions

### No Conflicts Found ✅

All three domain plans (Phase 1a/1b/1c) are **fully aligned**:

1. **Type System:** All domains agree on `calculationType` discriminator pattern
2. **Data Flow:** Step 2 uses pure LTV, Step 3 uses full analysis - no ambiguity
3. **Messaging:** UI messaging matches calculation type - no contradictions
4. **Dr. Elena v2:** All domains use identical LTV tiers, CPF rules, tenure caps

**No conflicts require resolution.**

---

## Documentation Updates

### Files to Update After Implementation

1. **`CANONICAL_REFERENCES.md`**
   - Add `calculatePureLtvMaxLoan()` to Tier 1 (Canonical Truth) section
   - Mark as core calculation function

2. **`docs/work-log.md`**
   - Document implementation decisions
   - Note any deviations from plan
   - Record actual time spent vs estimates

3. **`docs/plans/active/2025-10-19-step2-instant-analysis-pure-ltv-calculation.md`**
   - Update status from "Ready for Implementation" to "Implementation Complete"
   - Add link to completion report (if created)

4. **`docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`**
   - Document step-aware calculation pattern
   - Add best practices for future form calculations

---

## Timeline Summary

| Phase | Duration | Dependencies | Deliverables |
|-------|----------|--------------|--------------|
| **A: Types** | 1 hour | None | Discriminated union types, type guards |
| **B: Calculation** | 3 hours | Phase A | `calculatePureLtvMaxLoan()` function + tests |
| **C: Form State** | 4 hours | A, B | Step-aware routing in controller + tests |
| **D: UI** | 4 hours | A, B, C | New components, messaging updates + tests |
| **E: E2E** | 3 hours | A, B, C, D | Full user journey tests |

**Total: 15 hours (2 working days)**

**Critical Path:** A → B → C → (D, E in parallel)

**Earliest Completion:** 2 days if C, D, E can overlap partially

---

## Success Metrics

### Correctness (Primary Goal)
✅ **Zero calculation errors** - All Dr. Elena v2 scenarios pass
✅ **Zero premature income assumptions** - Step 2 uses NO income data
✅ **100% regulatory compliance** - MAS Notice 645 LTV limits correct

### User Experience
✅ **Clear expectations** - Users understand pure LTV (Step 2) vs affordability (Step 3)
✅ **No confusion** - Messaging matches actual data used in calculations
✅ **Educational** - Tooltips explain regulatory concepts

### Code Quality
✅ **Type safe** - Discriminated unions prevent wrong calculation type usage
✅ **Testable** - 45+ tests cover all scenarios and edge cases
✅ **Maintainable** - Step-aware pattern easy to understand and extend

---

## Implementation Start Checklist

**Before starting implementation, ensure:**

- [ ] All Phase 1 plans reviewed and approved
- [ ] Dr. Elena v2 persona JSON accessible (`dr-elena-mortgage-expert-v2.json`)
- [ ] Development environment ready (Node 18+, TypeScript, Playwright)
- [ ] Feature branch created (`git checkout -b fix/step2-pure-ltv-calculation`)
- [ ] All dependencies installed (`npm install`)
- [ ] Tests currently passing (`npm test`)
- [ ] TDD approach confirmed (write failing tests first)

---

**This synthesis is complete and ready for implementation. All domains are aligned, conflicts resolved, and verification checklist prepared. Quality bar: "Cannot be wrong in calculations" will be met through comprehensive Dr. Elena v2 compliance testing.**
