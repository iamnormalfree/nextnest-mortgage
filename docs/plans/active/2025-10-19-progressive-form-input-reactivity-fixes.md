---
title: progressive-form-input-validation-and-reactivity-fixes
status: draft
owner: engineering
created: 2025-10-19
priority: high
estimated_hours: 6
dependencies:
  - 2025-10-31-progressive-form-calculation-correction-plan.md (completed)
  - 2025-10-18-lead-form-desktop-ux-quick-wins.md (active - complementary)
related_audits:
  - docs/reports/step3-ux-audit-report.md (18 issues identified, 9 critical/high priority)
---

# Progressive Form Input Validation & Reactivity Fixes

## Context

Comprehensive UX audit (`docs/reports/step3-ux-audit-report.md`) identified 18 input validation and reactivity issues across Step 2/Step 3. This plan addresses all critical/high priority issues plus reactivity problems discovered during calculation verification.

**Branch:** TBD (new branch for validation + reactivity fixes)

---

## Issues Summary

**Full audit details:** `docs/reports/step3-ux-audit-report.md` (18 total issues)

### Critical Issues (2)
1. **Negative numbers accepted** - Income, age, liabilities accept invalid negative values
2. **Unrealistic values accepted** - Age accepts values outside 18-99 range

### High Priority (7)
3. **Variable income negatives** - Variable/bonus income accepts negatives
4. **Liability balance negatives** - Outstanding balances accept negatives
5. **Liability payment negatives** - Monthly payments accept negatives
6. **Business age negatives** - Self-employed business age accepts negatives
7. **Leading zeros bug** - "08000" instead of "8000" causes visual confusion
8. **No visual feedback** - MAS calculations update silently when inputs change
9. **Stale instant analysis** - Step 2 instant analysis doesn't recalculate on input changes

### Medium/Low Priority (9)
- See full audit report for age decimals, max values, placeholders, tooltips, character limits, etc.

---

## Scope

**In Scope (Critical + High Priority):**
1. Add `min` attributes to all numeric inputs (income, age, liabilities, business age)
2. Add `max` attribute to age (18-99 range)
3. Add Zod schema validation for all numeric fields
4. Fix leading zeros bug across all number inputs
5. Implement instant analysis reactivity (recalculate on input changes)
6. Add visual feedback when MAS calculations update
7. Add debouncing to prevent excessive recalculations
8. Verify with Playwright + Jest tests

**Out of Scope (Deferred to Future):**
- Medium/Low priority issues (see audit report for details)
- Calculation accuracy (handled by 2025-10-31 plan ✅)
- Number comma formatting (handled by desktop UX quick wins plan)
- Visual design changes (handled by desktop UX quick wins plan)

---

## Technical Approach

**Implementation Guide:** See `docs/runbooks/forms/PROGRESSIVE_FORM_INPUT_REACTIVITY.md` for detailed patterns and code examples.

### Fix 1: Add Input Validation Attributes

**Files:**
- `components/forms/ProgressiveFormWithController.tsx` (Step 2 fields)
- `components/forms/sections/Step3NewPurchase.tsx` (income, age, liabilities)
- `components/forms/sections/Step3Refinance.tsx` (liabilities)

**Changes:**
- Add `min="0"` to: income, variable income, liability balances, liability payments, business age
- Add `min="18" max="99"` to age fields
- Add `step="1"` to age (prevent decimals)
- Add error messages for constraint violations

### Fix 2: Update Zod Schemas

**File:** `lib/validation/mortgage-schemas.ts`

**Changes:**
- Add `.min(0)` to all income and liability numeric fields
- Add `.min(18).max(99)` to age fields
- Add `.int()` to age (no decimals)

### Fix 3: Fix Leading Zeros Bug

**Solution:** Replace `defaultValue={0}` with `defaultValue=""` OR add `onFocus` handler to clear zero

**Files:** Same as Fix 1

### Fix 4: Instant Analysis Reactivity

**File:** `hooks/useProgressiveFormController.ts`

**Solution:** Add `useWatch` to monitor fields + debounced recalculation (500ms)

**Fields:** `propertyValue`, `loanQuantum`, `actualAges`, `ltvMode`, `propertyType`

---

## Testing Strategy

### Manual Tests (Playwright)
1. **Negative values blocked** - Try entering "-5000" in income, verify rejected
2. **Age range enforced** - Try entering "150" in age, verify error message
3. **Leading zeros fixed** - Type "500000", verify no "0" prefix
4. **Instant analysis updates** - Change property value, verify recalculation
5. **Debouncing works** - Rapid changes only trigger 1 calculation

### Automated Tests (Jest)
- Schema validation: `lib/validation/__tests__/mortgage-schemas.test.ts`
- Controller reactivity: `hooks/__tests__/useProgressiveFormController.test.ts`
- Component validation: `components/forms/__tests__/Step3NewPurchase.test.tsx`

---

## Implementation Plan

### Task 1: Add Schema Validation (TDD - 1 hour)
1. Write failing tests in `mortgage-schemas.test.ts` for negative/invalid values
2. Update Zod schemas with `.min()`, `.max()`, `.int()` constraints
3. Verify tests pass

### Task 2: Add HTML Input Attributes (1.5 hours)
1. Audit all numeric inputs in Step 2/3 components
2. Add `min`, `max`, `step` attributes per technical approach
3. Add error message displays for constraint violations
4. Test manually with Playwright (negative values, age range)

### Task 3: Fix Leading Zeros Bug (1 hour)
1. Replace `defaultValue={0}` with `defaultValue=""` across components
2. Test manually - type "8000" should not show "08000"
3. Write component tests to prevent regression

### Task 4: Implement Instant Analysis Reactivity (2 hours)
1. Add `useWatch` to controller hook monitoring relevant fields
2. Implement debounced recalculation (500ms)
3. Add loading state during recalc
4. Write unit tests for debouncing and recalc logic
5. Test manually - change property value, verify instant analysis updates

### Task 5: Verification (0.5 hours)
1. Run full test suite: `npm test -- --runInBand`
2. Run lint: `npm run lint`
3. Manual QA on `/apply` page (all scenarios from audit)
4. Update work-log with completion notes

---

## Success Criteria

✅ **All numeric inputs reject negative values (income, age, liabilities)**
✅ **Age field enforces 18-99 range with clear error messages**
✅ **Zod schemas validate all constraints (verified by tests)**
✅ **Number inputs have no "0" prefix when typing**
✅ **Instant analysis recalculates when inputs change**
✅ **Debouncing prevents excessive calculations (max 1 per 500ms)**
✅ **All existing tests pass + new validation tests green**
✅ **No new lint warnings introduced**
✅ **Manual Playwright QA passes all scenarios from audit report**

---

## Dependencies

**Builds on:**
- `2025-10-31-progressive-form-calculation-correction-plan.md` (COMPLETE ✅)
  - Calculation logic is correct
  - These fixes address input UX, not calculation accuracy

**Complements:**
- `2025-10-18-lead-form-desktop-ux-quick-wins.md` (ACTIVE)
  - Desktop UX plan handles comma formatting
  - This plan handles input prefix and reactivity

**Blocked by:** None

---

## Risk Assessment

**Low Risk:**
- Changes are isolated to input handling and effect dependencies
- Calculation logic remains untouched (already verified in prior plan)
- Can be tested thoroughly with Playwright before deployment

**Mitigation:**
- Full test suite verification before merge
- Manual QA on all form flows
- Staged rollout if needed

---

## Rollback Plan

If issues arise:
1. Revert commits related to this plan
2. Calculation corrections remain intact (separate branch)
3. Desktop UX improvements remain intact (separate plan)

---

## Related Documentation

- **Implementation Runbook:** `docs/runbooks/forms/PROGRESSIVE_FORM_INPUT_REACTIVITY.md` (validation patterns, reactivity patterns, test examples)
- **UX Audit Report:** `docs/reports/step3-ux-audit-report.md` (source of validation issues)
- **Completed Plan:** `docs/plans/active/2025-10-31-progressive-form-calculation-correction-plan.md`
- **Complementary Plan:** `docs/plans/active/2025-10-18-lead-form-desktop-ux-quick-wins.md`
- **Architecture:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`

---

## Notes

- This plan addresses 9 of 18 issues from UX audit (all critical/high priority)
- Medium/low priority issues (9 remaining) deferred to future work
- Validation fixes prevent data corruption in calculations
- Reactivity fixes improve user trust in instant analysis
- Estimated 6 hours total implementation time (up from 4h to include validation)
