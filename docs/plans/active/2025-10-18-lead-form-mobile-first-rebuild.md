---
status: draft
priority: high
owner: engineering
created: 2025-10-17
updated: 2025-10-31
workstream: forms
complexity: medium
estimated_hours: 40
---

# Lead Form Mobile-First Rebuild

## Prerequisites

**Desktop Baseline:** `2025-10-18-lead-form-desktop-ux-quick-wins.md` finished on 2025-10-20. Confirm the production metrics gathered since that deployment before changing the mobile flow.

**Before starting Phase 2:**
- [ ] Validate that desktop quick-win changes remain stable (no open regressions in `ProgressiveFormWithController.tsx`)
- [ ] Capture the current desktop conversion baseline (rolling 14-day window) to compare against mobile rollouts
- [ ] Verify form typography and color usage match the refreshed Part 04 brand canon (warm-gold CTAs, no rounded corners)

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
- [x] Mobile-optimized number/select inputs shipped in `components/forms/mobile/` (56px touch targets, warm-gold focus rings)
- [x] Native touch gesture support (0KB vs 40KB framer-motion)
- [x] Error boundary for graceful failures

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#touch-target-standards`

### Phase 2: Conditional Visibility (🚧 IN PROGRESS)
- [ ] Extend Step 2 visibility logic in `lib/forms/field-visibility-rules.ts` (progressive disclosure by loan/property type)
- [ ] Add `hooks/useFieldVisibility.ts` to connect React Hook Form with the visibility rules
- [ ] Apply the hook to the mobile flow within `ProgressiveFormWithController.tsx`

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
  - Files: `lib/analytics/experiments.ts`, `lib/hooks/useExperiment.ts`
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
  - Files: `lib/features/feature-flags.ts`, `lib/features/server-feature-flags.ts`
- [ ] Conditional rendering in `app/apply/page.tsx` (mobile vs desktop experience)
- [ ] Gradual rollout schedule:
  - Week 1: 0% (team allowlist)
  - Week 2: 10% → 25% → 50% → 75%
  - Week 3: 100%

**Reference:** `docs/runbooks/forms/mobile-optimization-guide.md#feature-flags-gradual-rollout`

### Phase 6: Testing & Documentation
- [ ] Unit tests (conditional rules, smart defaults, experiments)
- [ ] Integration tests (field visibility, session restore)
- [ ] E2E tests (complete flow, touch targets ≥48px validation, session restore)
- [ ] Update `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` with Path 2 enhancements and warm-gold CTA guidance

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
