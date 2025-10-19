---
status: active
priority: critical
created: 2025-10-17
updated: 2025-10-19
workstream: forms
complexity: light
estimated_hours: 8
blocks: 2025-10-18-lead-form-mobile-first-rebuild.md
---

# Lead Form Desktop UX Quick Wins

**Timeline:** 1 week (Week 1 of Phase 1)
**Expected Impact:** 15-20% desktop conversion increase
**Complexity:** Low
**Risk:** Low

## Context

The lead form at /apply has three critical UX issues causing conversion leakage:

1. **Inconsistent number formatting** - Some fields show commas (500,000), others don't (5000)
2. **Cognitive overload** - Instant calculation results appear before user requests them
3. **Visual weight** - Too many borders, boxes, and verbose labels create friction

This is a **quick win path** to stop ad budget bleeding while full rebuild happens in parallel.

---

## Problem Statement

Desktop users encounter three conversion friction points:
- Number formatting inconsistency reduces trust
- Premature calculation display increases cognitive load
- Heavy visual design feels intimidating on financial details step

---

## Success Criteria

1. **Number formatting consistency:** All monetary fields display commas (500,000)
2. **Reduced cognitive load:** Instant calc hidden until user clicks reveal button
3. **Lighter visual weight:** Reduced borders, smaller text, cleaner hierarchy
4. **No performance regression:** Lighthouse score remains >90
5. **Conversion increase:** 15-20% improvement in desktop form completions

---

## Task Breakdown

See [Desktop UX Patterns Runbook](../../runbooks/forms/DESKTOP_UX_PATTERNS.md) for implementation details.

### Task 1: Standardize Number Formatting

**Objective:** Apply comma separators to all monetary input fields

**Files:**
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`

**Implementation:**
- Convert type="number" to type="text" with inputMode="numeric"
- Use formatNumberWithCommas/parseFormattedNumber helpers
- Add font-mono className

**Testing:** Manual formatting, unit tests, E2E submission

---

### Task 2: Hide Instant Calc Behind User Action

**Objective:** Reduce cognitive load by showing calc only when requested

**Files:**
- `components/forms/ProgressiveFormWithController.tsx`

**Implementation:**
- Add showInstantCalcResult state
- Wrap result display with conditional rendering
- Show CTA button: "See your max loan amount"
- Reset state on step navigation

**Testing:** Button interaction, state reset, E2E flow

---

### Task 3: Reduce Visual Weight on Step 3

**Objective:** Make financial details step feel lighter

**Files:**
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`

**Implementation:**
- Reduce heading sizes (text-xs, uppercase, grey)
- Remove heavy backgrounds and borders
- Use simple border-b for separation
- Condense helper text
- Progressive disclosure for MAS requirements

**Testing:** Visual QA, Playwright screenshots, E2E functionality

---

### Task 4: Update Form Config for Clarity

**Objective:** Align CTA text with new delayed-calc UX

**Files:**
- `lib/forms/form-config.ts`

**Implementation:**
- Change Step 2 ctaText from "Get instant loan estimate" to "Continue to financial details"

**Testing:** Manual verification, unit tests

---

## Pre-Implementation Checklist

**Before starting implementation:**
- [ ] Check CANONICAL_REFERENCES.md for folder structure standards
- [ ] Verify no Tier 1 files will be modified (if yes, review change rules)
- [ ] Review Desktop UX Patterns runbook for implementation details
- [ ] Identify which tests need to be written first (TDD)

**File placement decisions:**
- [x] Modifying existing components (no new files)
- [x] Tests colocated in components/__tests__/
- [x] Visual regression tests in tests/visual/

---

## Testing Strategy

### Pre-Deployment Checklist

1. Unit tests pass (npm test)
2. E2E tests pass (npx playwright test)
3. Lint passes (npm run lint)
4. Manual QA complete (new purchase + refinance flows)
5. Visual regression reviewed (screenshots)
6. Performance check (Lighthouse >90)

### Known Issues to Watch

1. iOS numeric keyboard (use inputMode="numeric")
2. React Hook Form warnings (always provide value prop)
3. Comma parsing edge cases (handled by parseFormattedNumber)

---

## Deployment Process

1. Create feature branch: `feat/lead-form-quick-wins`
2. Implement with TDD (test first, code second)
3. Create PR with before/after screenshots
4. Deploy to staging
5. Deploy to production with monitoring

See runbook for rollback procedures.

---

## Success Metrics

### Key Metrics

1. **Conversion Rate:** Baseline TBD → Target +15-20%
2. **Step 2→3 Progression:** Target +10%
3. **Instant Calc Engagement:** Target >70% click-through
4. **Form Completion Time:** Target ±10% (no significant change)
5. **Bounce Rate:** Target -20% Step 2, -15% Step 3

### Analytics Events

Track: form_step_complete, instant_calc_reveal, formatted_input_interaction

---

## Rollback Plan

If conversion rate drops or critical bugs appear:

1. Identify issue (console errors, analytics, devices)
2. Quick fix (revert commit, toggle flag, hot-fix)
3. Full rollback (git revert and push)
4. Post-mortem (document, update tests, re-deploy)

---

## Documentation Updates

After completion:

1. **Update CLAUDE.md:** Add note about number formatting standards
2. **Update work-log.md:** Document completion
3. **Archive plan:** Move to docs/plans/archive/2025/10/

---

## Next Steps After Completion

**Prerequisite checks before starting mobile-first rebuild:**
- [ ] Desktop conversion increased by ≥15% (verified via analytics)
- [ ] No console errors or regressions in production
- [ ] All Path 1 tests passing
- [ ] Visual weight changes validated by users (2+ weeks of data)
- [ ] Baseline metrics collected for mobile A/B testing

**Then proceed to:** `docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md`

**Why mobile rebuild is blocked:** Both modify same components; Path 1 establishes baseline desktop UX that mobile build depends on; desktop metrics inform mobile A/B testing strategy.

---

**See [Desktop UX Patterns Runbook](../../runbooks/forms/DESKTOP_UX_PATTERNS.md) for all implementation details.**
