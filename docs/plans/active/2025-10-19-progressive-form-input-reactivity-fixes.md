---
title: progressive-form-input-reactivity-fixes
status: draft
owner: engineering
created: 2025-10-19
priority: high
estimated_hours: 4
dependencies:
  - 2025-10-31-progressive-form-calculation-correction-plan.md (completed)
  - 2025-10-18-lead-form-desktop-ux-quick-wins.md (active - complementary)
---

# Progressive Form Input Reactivity Fixes

## Context

During verification of the progressive form calculation corrections (2025-10-31 plan), two UX issues were discovered that impact form usability but are separate from calculation accuracy.

**Branch:** `fix/progressive-form-calculation-corrections` (completed calculation fixes)
**New Branch:** TBD (for these UX fixes)

---

## Issues Identified

### Issue 1: Number Input "0" Prefix Bug

**Symptom:**
- When editing number fields (age, loan amount, property value, etc.), typing shows "0" in front of user input
- Example: User types "35" but field shows "035" or "0035"

**User Impact:**
- Confusing and non-intuitive input experience
- Requires user to delete the "0" prefix manually
- Breaks expected number input behavior

**Affected Fields:**
- Step 2: Property value, loan quantum, age
- Step 3: Monthly income, commitments, outstanding loan amounts

**Root Cause:** Likely `type="number"` inputs with `defaultValue={0}` or similar pattern where the zero isn't cleared on first edit.

**Related Work:** Desktop UX quick wins plan addresses comma formatting but doesn't fix this prefix issue.

---

### Issue 2: Instant Analysis Not Updating on Input Changes

**Symptom:**
- Step 2 instant analysis displays results after initial calculation
- When user changes age, loan quantum, or other inputs, instant analysis does NOT recalculate
- Stale results remain on screen

**User Impact:**
- Misleading/incorrect information displayed to user
- Breaks trust in instant analysis accuracy
- User doesn't see impact of changing inputs

**Expected Behavior:**
- Instant analysis should recalculate when relevant inputs change (age, property value, loan amount, LTV mode)
- Should debounce to avoid excessive calculations (e.g., 500ms delay)
- Should show loading state during recalculation

**Root Cause:** Likely missing `useWatch` or effect dependencies to trigger `calculateInstant()` when form values change.

---

## Scope

**In Scope:**
1. Fix number input "0" prefix bug across all number fields
2. Implement instant analysis reactivity (recalculate on input changes)
3. Add debouncing to prevent excessive recalculations
4. Add loading state for recalculations
5. Verify with Playwright tests

**Out of Scope:**
- Calculation accuracy (handled by 2025-10-31 plan ✅)
- Number comma formatting (handled by desktop UX quick wins plan)
- Visual design changes (handled by desktop UX quick wins plan)

---

## Technical Approach

**See Implementation Runbook:** `docs/runbooks/forms/PROGRESSIVE_FORM_INPUT_REACTIVITY.md`

### Fix 1: Number Input Prefix Bug

**Root Cause:** `type="number"` inputs with `defaultValue={0}` show "0" prefix when editing.

**Solution:** Use text input with `inputMode="numeric"` and formatting helpers, OR clear zero on focus.

**Files to Fix:**
- `components/forms/ProgressiveFormWithController.tsx`
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`

---

### Fix 2: Instant Analysis Reactivity

**Root Cause:** `useEffect` with empty deps only calculates on mount, never recalculates.

**Solution:** Use `useWatch` to monitor form fields + debounced recalculation (500ms).

**Files to Fix:**
- `hooks/useProgressiveFormController.ts`

**Fields to Monitor:**
- `propertyValue`, `loanQuantum`, `actualAges`, `ltvMode`, `propertyType`

---

## Testing Strategy

**See Runbook for detailed test patterns:** `docs/runbooks/forms/PROGRESSIVE_FORM_INPUT_REACTIVITY.md`

### Manual Tests (Playwright)
1. Number input prefix - Type "500000", verify no "0" prefix
2. Instant analysis updates - Change property value, verify recalculation
3. Debouncing works - Rapid changes only trigger 1 calculation

### Automated Tests
- Unit tests in `hooks/__tests__/useProgressiveFormController.test.ts`
- Component tests in `components/forms/__tests__/ProgressiveFormWithController.test.tsx`

---

## Implementation Plan

### Task 1: Fix Number Input Prefix (1 hour)
1. Audit all number inputs in Step 2 and Step 3
2. Replace `defaultValue={0}` with `defaultValue=""` or add onFocus handler
3. Test manually with Playwright
4. Write component tests to prevent regression

### Task 2: Implement Instant Analysis Reactivity (2 hours)
1. Add `useWatch` to monitor relevant fields in controller hook
2. Implement debounced recalculation (500ms delay)
3. Add loading state during recalculation
4. Test manually with Playwright
5. Write unit tests for debouncing and recalc logic

### Task 3: Verification & Documentation (1 hour)
1. Run full test suite: `npm test -- --runInBand`
2. Run lint: `npm run lint`
3. Manual QA on `/apply` page
4. Update work-log with findings
5. Document in FORMS_ARCHITECTURE_GUIDE.md

---

## Success Criteria

✅ **Number inputs have no "0" prefix when typing**
✅ **Instant analysis recalculates when inputs change**
✅ **Debouncing prevents excessive calculations (max 1 per 500ms)**
✅ **Loading state shows during recalculation**
✅ **All existing tests pass (252/256 production tests)**
✅ **No new lint warnings introduced**

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

- **Runbook:** `docs/runbooks/forms/DESKTOP_UX_PATTERNS.md`
- **Completed Plan:** `docs/plans/active/2025-10-31-progressive-form-calculation-correction-plan.md`
- **Active Plan:** `docs/plans/active/2025-10-18-lead-form-desktop-ux-quick-wins.md`
- **Architecture:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`

---

## Notes

- These issues were discovered during manual verification of calculation corrections
- Both issues impact user experience but not calculation accuracy
- Fixing these will improve trust and usability of instant analysis feature
- Estimated 4 hours total implementation time
