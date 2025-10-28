# Work Log

## 2025-11-07 - Homepage Brand Alignment Implementation Plan

**Constraint:** A – Public Surfaces Ready
**CAN Tasks:** CAN-001, CAN-020, CAN-036
**Deliverables:**
- Created comprehensive implementation plan `docs/plans/active/2025-11-07-homepage-brand-alignment-facelift.md` with bite-sized tasks, code snippets, testing strategy, and rollback plan.
- Plan addresses 4 priorities: (1) Copy updates to evidence-based positioning, (2) Yellow reduction per Rule of Two, (3) Claims cleanup (remove unverified stats), (4) Visual regression testing.
- Targets production homepage (`app/page.tsx`) with specific line references, before/after code examples, and commit messages.
- Assumes zero-context engineer: included voice guide summary, design system principles, common mistakes checklist.
**Next Steps:** Execute plan via TDD workflow; manual browser testing after each priority; create completion report when all tasks done.

## 2025-11-07 - Constraint A Voice & Accessibility Docs

**Constraint:** A – Public Surfaces Ready  
**CAN Tasks:** CAN-036 (voice and tone reference), CAN-037 (accessibility checklist)  
**Deliverables:**  
- Authored `docs/content/voice-and-tone.md` with voice pillars, tonal modes, lexicon, and surface playbooks tied to the T.A.M.A. messaging sequence.  
- Published `docs/runbooks/design/accessibility-checklist.md` outlining WCAG 2.1 AA checks for homepage, progressive form, AI broker chat, and PDFs, plus audit procedures and regression triggers.  
**Next Steps:** Align homepage copy and component workstreams with the new guide; trigger accessibility audit before mobile chat rollout.

## 2025-11-07 - Decision Bank Homepage Concepts Prototype

**Constraint:** A – Public Surfaces Ready  
**CAN Tasks:** CAN-001, CAN-020, CAN-036  
**Deliverables:**  
- Drafted `docs/plans/active/2025-11-07-decision-bank-homepage-test-page.md` capturing scope and success criteria.  
- Implemented `app/test-homepage-decision-bank/page.tsx` with Decision Bank range snapshot, stay-vs-switch comparison, case log carousel, process explainer, and disclosure banner.  
**Next Steps:** Review prototype with Brent; upon approval, schedule production homepage updates and run accessibility checklist per CAN-037.

## 2025-10-26 - IWAA & 55% LTV Tenure Fix - COMPLETE ✅

**Goal:** Implement IWAA (Income-Weighted Average Age) for joint applicants and 55% LTV extended tenure rules per Dr Elena v2 spec.

**Bugs Fixed:**
1. **IWAA Not Calculated**: Joint applicant age ignored → wrong tenure caps → lower max loan amounts
2. **55% LTV Extended Tenure Missing**: Safer borrowers (55% LTV) penalized with same tenure as 75% LTV

**Files Modified:**
- `lib/calculations/instant-profile.ts` (+97 lines, comprehensive tenure calculation)
- `hooks/useProgressiveFormController.ts` (+44 lines, co-applicant data extraction)

**Tests Added:**
- `lib/calculations/__tests__/iwaa-tenure-integration.test.ts` (15 comprehensive integration tests)

**Test Results:**
- ✅ All 21 tests passing (6 IWAA rounding + 15 integration)
- ✅ No regressions
- ✅ TypeScript compiles successfully

**Implementation Highlights:**
- IWAA uses `Math.ceil()` for rounding UP (Dr Elena v2 compliant)
- Property-specific tenure formulas for all types (HDB, EC, Private, Commercial)
- Separate logic for 75% vs 55% LTV tiers
- HDB 55% LTV: Uses `MIN(75-IWAA, 30)` formula (extended tenure)
- EC/Private/Commercial 55% LTV: Cap at 35 years (vs 30 for 75% LTV)
- Backwards compatible (single applicant scenarios still work)
- Edge cases handled (old applicants, zero income co-applicant, mismatched arrays)

**Commits:**
1. `3086d9e` - test: add IWAA tenure integration tests (failing) + feat: add ages/incomes to interface
2. `1b65316` - feat: implement IWAA-based tenure calculation
3. `94af73e` - feat: pass co-applicant ages/incomes for IWAA calculation

**Example Impact:**
```
BEFORE (WRONG):
Primary: Age 50, Income $10k | Co-applicant: Age 30, Income $2k
→ Uses age 50 only → Tenure: MIN(65-50, 25) = 15 years

AFTER (CORRECT):
IWAA = (50×10000 + 30×2000) / 12000 = 47 (weighted average)
→ Tenure: MIN(65-47, 25) = 18 years → 3 years longer! → Higher max loan ✅
```

**Follow-Up Tasks (Out of Scope):**
- LTV tier auto-detection (form doesn't auto-switch to 55% LTV yet)
- MasReadiness sidebar UI updates to display corrected max loan prominently
- Refinancing tenure rules (different formula: MIN(original_tenure - years_elapsed, caps))

**Ready for:** Manual browser testing, then code review + merge

**Plan:** `docs/plans/active/2025-10-26-iwaa-tenure-fix.md`
**Runbook:** `docs/runbooks/mortgage/IWAA_TENURE_IMPLEMENTATION_GUIDE.md`

---

## 2025-10-26 - Mobile Layout Fixes

### Fix 1: Two-Column Grid Collapse on Mobile

**Problem:** Financial commitments grids displayed in 2 columns on mobile, causing horizontal scroll and cramped inputs.

**Solution:** Added `sm:` breakpoint to collapse grids to single column on mobile devices (<640px).

**Files Changed:**
- `components/forms/sections/Step3NewPurchase.tsx` (lines 522, 739)

**Changes:**
```typescript
// OLD: className="grid grid-cols-[1fr_1fr] gap-3"
// NEW: className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3"
```

**Result:** Grid displays as single column on mobile, 2 columns on tablet and desktop.

---

### Fix 2: Touch Target Sizes for Edit Buttons

**Problem:** Edit buttons (primary and co-applicant income) had insufficient touch target size (<44px), difficult to tap on mobile.

**Solution:** Added minimum height and padding classes to meet 44px minimum touch target.

**Files Changed:**
- `components/forms/sections/Step3NewPurchase.tsx` (lines 302, 643)

**Changes:**
```typescript
// Added: min-h-[44px] px-4 py-2
className="text-sm text-[#666666] hover:text-black transition-colors min-h-[44px] px-4 py-2"
```

**Result:** Edit buttons now meet WCAG 2.1 AAA mobile touch target guidelines (44x44px).

---

### Fix 3: Mobile Sidebar Fallback for Step 3

**Problem:** Step 3 instant analysis sidebars (MAS readiness, refinance outlook) were hidden on mobile, losing valuable user feedback.

**Solution:** Added mobile inline cards that display after step content when viewport is mobile (<768px).

**Files Changed:**
- `components/forms/ProgressiveFormWithController.tsx` (lines 1443-1458)

**Pattern Used:** Matches existing Step 2 mobile inline card pattern (line 1349-1358).

**Changes:**
```typescript
{/* Mobile: Inline MAS readiness card */}
{currentStep === 3 && isMobile && loanType === 'new_purchase' && (
  <div className="mt-6 p-4 border border-[#E5E5E5] bg-white rounded-lg">
    <MasReadinessSidebar result={masReadiness} />
  </div>
)}

{/* Mobile: Inline refinance outlook card */}
{currentStep === 3 && isMobile && loanType === 'refinance' && refinanceOutlookResult && (
  <div className="mt-6 p-4 border border-[#E5E5E5] bg-white rounded-lg">
    <RefinanceOutlookSidebar
      outlookResult={refinanceOutlookResult}
      isLoading={!refinanceDataAvailable}
    />
  </div>
)}
```

**Result:** Mobile users now see instant analysis feedback inline after form content, consistent with Step 2 behavior.

---

### Build Status

- Dev server: Started successfully on port 3001
- Production build: Pre-existing error with `/api/ai-insights` (unrelated to mobile fixes)
- TypeScript: No compilation errors from changes
- Modified files compile successfully

### Testing Notes

**Manual testing required:**
1. Open Chrome DevTools responsive mode
2. Set viewport to 375px (iPhone SE)
3. Navigate through refinance flow to Step 3
   - Verify: Refinance outlook sidebar appears inline (not hidden)
4. Navigate through new purchase flow to Step 3
   - Verify: MAS readiness sidebar appears inline
   - Verify: Financial commitments are single column
   - Verify: Edit buttons are easy to tap (44px+ height)
5. Verify: No horizontal scroll at 375px viewport

---

## 2025-10-26 - Two UX Fixes

### Fix 1: Auto-Collapse Income Panel When Commitments Selected

**Problem:** When user selected "Yes" to financial commitments, the income panel remained expanded, making the form too long.

**Solution:** Added `setIsPrimaryIncomeExpanded(false)` and `setIsCoApplicantIncomeExpanded(false)` to the Yes button onClick handlers.

**Files Changed:**
- `components/forms/sections/Step3NewPurchase.tsx` (lines 457, 671)

**Tests:**
- `components/forms/__tests__/Step3-commitments-collapse-fix.test.tsx` (3 passing tests)

**Result:** Income panel now collapses to summary view when user clicks Yes, showing collapsed card with Edit button.

---

### Fix 2: Remove Property Type Auto-Selection for Resale

**Problem:** When user selected "resale" property category, property type was auto-selecting "HDB" (first option in dropdown).

**Solution:** Modified the property type sync logic to only clear invalid values, not auto-select the first valid option. BTO and Commercial still auto-select correctly (HDB and Commercial respectively).

**Files Changed:**
- `components/forms/ProgressiveFormWithController.tsx` (lines 400-406)

**Before:**
```typescript
if (!currentValue || !validValues.includes(currentValue)) {
  const nextValue = validValues[0]
  if (nextValue) {
    setValue('propertyType', nextValue)  // Auto-select first option
  }
}
```

**After:**
```typescript
// Clear property type if invalid, but don't auto-select (user must choose)
if (currentValue && !validValues.includes(currentValue)) {
  setValue('propertyType', '')  // Clear only, no auto-select
}
```

**Tests:**
- `tests/e2e/property-type-no-default-resale.spec.ts` (E2E test for manual verification)

**Result:** Resale and New Launch categories no longer auto-select property type. User must manually choose from dropdown.

---

### TDD Process Followed

1. **Red:** Wrote failing tests first
2. **Green:** Implemented minimal fixes to make tests pass
3. **Refactor:** Verified no regressions in existing tests

**Test Results:**
- Step3-commitments-collapse-fix.test.tsx: 3/3 passing
- Existing Step3 tests: Some pre-existing failures unrelated to these changes

