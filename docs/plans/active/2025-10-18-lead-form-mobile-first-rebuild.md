---
status: draft
priority: high
owner: engineering
created: 2025-10-17
updated: 2025-10-31
workstream: forms
complexity: medium
estimated_hours: 40
blocked_by: 2025-10-18-lead-form-desktop-ux-quick-wins.md
---

# Lead Form Mobile-First Rebuild

## Prerequisites

**BLOCKED BY:** `2025-10-18-lead-form-desktop-ux-quick-wins.md`

Path 1 (desktop UX quick wins) must complete first because:
1. Both modify same components (`ProgressiveFormWithController.tsx`, Step 3 sections)
2. Path 1 establishes baseline desktop UX that mobile build depends on
3. Desktop conversion metrics inform mobile A/B testing strategy
4. Sequential execution avoids merge conflicts from parallel work on same files

**Before starting Phase 2:**
- [ ] Path 1 deployed to production
- [ ] Desktop conversion metrics collected (2 weeks minimum)
- [ ] Baseline established for mobile comparison
- [ ] No regressions or console errors from Path 1 changes

## Implementation Guide

**Read first:** `docs/runbooks/forms/mobile-optimization-guide.md` - Complete mobile optimization patterns (CAN-051 ✅)

Covers:
- Touch target standards (48px minimum, WCAG AAA)
- Conditional field visibility system
- Smart defaults with affordability validation
- Session persistence using existing `useLoanApplicationStorage`
- A/B testing framework
- Feature flags & gradual rollout

## Problem Statement

60% of mortgage shoppers browse on mobile first, but mobile conversion is 40% lower than desktop. Current form has small touch targets (32px), no session persistence, shows irrelevant fields (15 fields vs 8 needed), and lacks data-driven optimization framework.

## Success Criteria

- Mobile conversion increases >35%
- Touch targets ≥48px (WCAG AAA compliance)
- Average fields shown reduces to 8-10 (down from 15)
- Session restoration rate >30% of incomplete sessions
- Smart default acceptance >70%
- Bundle size stays <140KB gzipped
- Zero regressions in desktop conversion

## Tasks

### Phase 1: Mobile Components (✅ COMPLETED)
- [x] Mobile-optimized input components with 56px touch targets
- [x] Native touch gesture support (0KB vs 40KB framer-motion)
- [x] Error boundary for graceful failures

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#touch-target-standards`

### Phase 2: Conditional Visibility (🚧 IN PROGRESS)
- [ ] Field conditional rules engine
  - File: `lib/forms/field-conditionals.ts`, tests
  - Show/hide based on loan type, property type, employment status
- [ ] Visibility hook integrated with React Hook Form
  - File: `lib/hooks/useFieldVisibility.ts`
- [ ] Apply to `ProgressiveFormWithController.tsx`

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#conditional-field-visibility`

### Phase 3: Smart Defaults & Session
- [ ] Smart defaults system with affordability validation
  - File: `lib/forms/smart-defaults.ts`, tests
  - Prevents suggesting $1.2M property to $3K/mo income
- [ ] **CRITICAL:** Use existing `useLoanApplicationStorage` hook (113 lines, 7-day persistence)
  - Update `hooks/useProgressiveFormController.ts` to restore on mount
  - DO NOT create new storage hooks (969 lines of proven code already exist)

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#smart-defaults-system` and `#session-persistence`

### Phase 4: A/B Testing Framework
- [ ] Experiment configuration system
  - File: `lib/ab-testing/experiments.ts`, `lib/hooks/useExperiment.ts`
  - Deterministic hash-based bucketing
- [ ] Conversion tracking events
  - Track: step_started, step_completed, instant_calc_viewed, form_completed
- [ ] Apply experiments:
  - Step 2 CTA copy (4 variants)
  - Instant calc timing (auto vs on-demand)
  - Step 3 field order (income vs age first)

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#ab-testing-framework`

### Phase 5: Feature Flags & Rollout
- [ ] Feature flag system (percentage + allowlist)
  - File: `lib/feature-flags.ts`
- [ ] Conditional rendering in `app/apply/page.tsx`
- [ ] Gradual rollout schedule:
  - Week 1: 0% (team allowlist)
  - Week 2: 10% → 25% → 50% → 75%
  - Week 3: 100%

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#feature-flags-gradual-rollout`

### Phase 6: Testing & Documentation
- [ ] Unit tests (conditional rules, smart defaults, experiments)
- [ ] Integration tests (field visibility, session restore)
- [ ] E2E tests (complete flow, touch targets ≥48px validation, session restore)
- [ ] Update `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` with Path 2 enhancements

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#testing-patterns`

## Testing Strategy

**All test templates and patterns:** `docs/runbooks/forms/mobile-optimization-guide.md#testing-patterns`

- **Unit:** Conditional rules, smart defaults, A/B bucketing
- **Integration:** Field visibility with form state, session persistence
- **E2E:** Mobile user journey (iPhone 13), touch gestures, 48px validation

## Rollback Plan

**Feature flag:** `mobile_first_form` starts at 0%
- Instant disable if error rates spike
- Desktop form continues as fallback
- Session data persists across rollback

**Thresholds:**
- Error rate >5% → immediate rollback to 0%
- Conversion drop >10% → pause rollout
- Bundle size >140KB → block deployment

## Dependencies

**External:** None (using native APIs only)

**Internal:**
- Dr Elena v2 calculator: `lib/calculations/instant-profile.ts` (CANONICAL_REFERENCES.md)
- Form contracts: `lib/contracts/form-contracts.ts`
- Existing storage: `lib/hooks/useLoanApplicationStorage.ts` (113 lines, proven)
- Form controller: `hooks/useProgressiveFormController.ts`

## Metrics Tracking

Track in PostHog/analytics:
1. `mobile_conversion_rate` - completed / started (mobile only)
2. `fields_shown_avg` - average visible fields per session
3. `session_restored_rate` - restored / incomplete sessions
4. `smart_default_kept_rate` - unchanged defaults / shown
5. `ab_experiment_exposure` - user saw variant
6. `ab_conversion_by_variant` - completed by variant

**Baseline:** Week of 2025-10-17 (before rollout)
**Target:** Week of 2025-11-07 (after 100% rollout)

## Constraint Alignment

**Constraint A – Public Surfaces Ready** (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1)
- Mobile-first rebuild strengthens Stage 0 launch gate by delivering accessible lead capture that meets Lighthouse/accessibility guardrails
- Related CAN task: **CAN-051** (mobile optimization runbook - ✅ completed 2025-10-31)

## Next Actions After Completion

- [ ] Monitor metrics for 2 weeks post-100% rollout
- [ ] Document winning A/B variants
- [ ] Promote winners to 100% traffic
- [ ] Archive plan to `docs/plans/archive/2025/10/`
- [ ] Create completion report
- [ ] Plan Path 3 enhancements
