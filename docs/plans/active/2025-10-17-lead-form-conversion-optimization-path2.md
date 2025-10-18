---
status: active
owner: engineering
created: 2025-10-17
updated: 2025-10-17
workstream: forms
complexity: medium
estimated_hours: 40
---

# Mobile Lead Form Optimization

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
- [x] Create mobile-optimized input components (2h)
  - Files: `components/forms/mobile/MobileNumberInput.tsx`, `MobileSelect.tsx`
  - Commit: 8578ebd
- [x] Add native touch gesture support (2h)
  - File: `components/forms/ProgressiveFormMobile.tsx`
  - Used native events (0KB) instead of framer-motion (40KB)
- [x] Create error boundary for graceful failures (1h)
  - File: `components/ErrorBoundary.tsx`

### Phase 2: Conditional Visibility (🚧 IN PROGRESS)
- [ ] Create field conditional rules (2h)
  - File: `lib/forms/field-conditionals.ts`
  - Test: `lib/forms/__tests__/field-conditionals.test.ts`
  - See: `docs/runbooks/mobile-form-optimization/tasks/task-2-conditional-fields.md`
- [ ] Add visibility hook (1h)
  - File: `lib/hooks/useFieldVisibility.ts`
  - Integrates with React Hook Form
- [ ] Apply to existing form (2h)
  - Update: `components/forms/ProgressiveFormWithController.tsx`
  - Test: Show/hide fields based on loan type, property category

### Phase 3: Smart Defaults & Session
- [ ] Create smart defaults system (3h)
  - File: `lib/forms/smart-defaults.ts`
  - Test: `lib/forms/__tests__/smart-defaults.test.ts`
  - Includes affordability validation (prevent suggesting $1.2M to $3k/mo income)
  - See: `docs/runbooks/mobile-form-optimization/reference/singapore-mortgage-context.md`
- [ ] Integrate existing session storage (1h)
  - **CRITICAL:** Use `useLoanApplicationStorage` (already exists at `lib/hooks/useLoanApplicationStorage.ts`, 113 lines, 7-day persistence)
  - **DO NOT** create new storage hooks - we already have battle-tested solutions:
    * `useLoanApplicationStorage` - Form data persistence with auto-cleanup
    * `useChatSessionStorage` - Chat message persistence (95 lines)
    * `sessionManager` - Unified sessionStorage API (116 lines at `lib/utils/session-manager.ts`)
  - **Total existing storage:** 969 lines of proven code
  - **Implementation:** Update `hooks/useProgressiveFormController.ts` to restore persisted data on mount using `retrieveLoanApplicationData(sessionId)`
  - **Error handling:** Form data auto-saves to localStorage, so on submission failure users can reload and retry (no complex offline queue needed)

### Phase 4: A/B Testing Framework
- [ ] Create experiment configuration (2h)
  - File: `lib/ab-testing/experiments.ts`
  - Test: `lib/ab-testing/__tests__/experiments.test.ts`
- [ ] Add experiment hook (1h)
  - File: `lib/hooks/useExperiment.ts`
  - Deterministic bucketing (hash-based)
- [ ] Add conversion tracking (2h)
  - File: `lib/analytics/events.ts`
  - Track: step_started, step_completed, instant_calc_viewed, form_completed
- [ ] Apply to form (2h)
  - Experiment 1: Step 2 CTA copy (4 variants)
  - Experiment 2: Instant calc timing (auto vs on-demand)
  - Experiment 3: Step 3 field order (income vs age first)

### Phase 5: Feature Flags & Rollout
- [ ] Create feature flag system (2h)
  - File: `lib/feature-flags.ts`
  - Percentage-based rollout + allowlist
- [ ] Add conditional rendering (1h)
  - Update: `app/apply/page.tsx`
  - Switch between mobile/desktop forms based on flag + viewport
- [ ] Configure gradual rollout (1h)
  - Week 1: 0% (team allowlist only)
  - Week 2: 10% → 25% → 50% → 75%
  - Week 3: 100%

### Phase 6: Testing & Documentation
- [ ] Write integration tests (3h)
  - Test: `tests/integration/conditional-fields.test.ts`
  - Test: Session restore across page reload
  - Test: A/B variant rendering
- [ ] Write E2E tests (3h)
  - Test: `tests/e2e/mobile-form-complete-flow.test.ts`
  - Test: Touch gesture navigation
  - Test: 48px touch target validation
  - See: `docs/runbooks/mobile-form-optimization/testing/e2e-test-scenarios.md`
- [ ] Update documentation (2h)
  - Update: `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
  - Add: Path 2 enhancements section

## Testing Strategy

**Unit Tests:**
- All new utilities: `lib/forms/__tests__/*.test.ts`
- All new hooks: `lib/hooks/__tests__/*.test.ts`
- Calculator affordability validation

**Integration Tests:**
- Conditional field visibility with form state
- Session persistence + restoration
- Smart defaults + user input interaction
- A/B experiment bucketing consistency

**E2E Tests:**
- Complete mobile user journey (iPhone 13 viewport)
- Touch gesture navigation (swipe left/right)
- Session restore after page reload
- Touch target size validation (≥48px)
- A/B variant rendering

**Testing Templates:**
- Unit: `docs/runbooks/mobile-form-optimization/testing/unit-test-template.md`
- Integration: `docs/runbooks/mobile-form-optimization/testing/integration-test-template.md`
- E2E: `docs/runbooks/mobile-form-optimization/testing/e2e-test-scenarios.md`

## Rollback Plan

**Feature flag:** `mobile_first_form` starts at 0%
- Can disable instantly if error rates spike
- Desktop form continues working as fallback
- Session data persists across rollback (uses existing storage)

**Monitoring thresholds:**
- Error rate >5% → immediate rollback to 0%
- Conversion drop >10% → pause rollout, investigate
- Bundle size >140KB → block deployment

**Rollback command:**
```typescript
// In lib/feature-flags.ts
mobile_first_form: {
  enabled: false, // ← Set to false
  rolloutPercentage: 0
}
```

## Related Documentation

**Implementation guides:**
- Full task breakdown: `docs/runbooks/mobile-form-optimization/`
- Onboarding guide: `docs/runbooks/mobile-form-optimization/01-ONBOARDING.md`
- TDD workflow: `docs/runbooks/mobile-form-optimization/02-IMPLEMENTATION-GUIDE.md`

**Reference materials:**
- Design system rules: `docs/runbooks/mobile-form-optimization/reference/design-system-rules.md`
- Singapore mortgage context: `docs/runbooks/mobile-form-optimization/reference/singapore-mortgage-context.md`
- Success metrics: `docs/runbooks/mobile-form-optimization/reference/success-metrics.md`
- **CRITICAL - Existing storage:** `docs/runbooks/mobile-form-optimization/reference/amendment-existing-storage.md`

**Testing resources:**
- Unit test template: `docs/runbooks/mobile-form-optimization/testing/unit-test-template.md`
- Integration test template: `docs/runbooks/mobile-form-optimization/testing/integration-test-template.md`
- E2E scenarios: `docs/runbooks/mobile-form-optimization/testing/e2e-test-scenarios.md`

**Existing architecture:**
- Forms: `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
- Tech stack: `docs/runbooks/TECH_STACK_GUIDE.md`
- Design system: `/app/redesign/sophisticated-flow/page.tsx` (canonical reference)

## Dependencies

**External:**
- No new npm packages required (using native APIs)
- Existing storage system: `useLoanApplicationStorage` (113 lines)

**Internal:**
- Dr Elena v2 calculation engine: `lib/calculations/instant-profile.ts`
- Form contracts: `lib/contracts/form-contracts.ts`
- Existing form controller: `hooks/useProgressiveFormController.ts`

## Metrics Tracking

Track in PostHog/analytics:
1. `mobile_conversion_rate` - forms completed / forms started (mobile only)
2. `fields_shown_avg` - average visible fields per session
3. `session_restored_rate` - restored sessions / incomplete sessions
4. `smart_default_kept_rate` - unchanged defaults / defaults shown
5. `ab_experiment_exposure` - user saw variant
6. `ab_conversion_by_variant` - completed by variant

**Baseline measurement:** Week of 2025-10-17 (before rollout)
**Target measurement:** Week of 2025-11-07 (after 100% rollout)

## Next Actions After Completion

- [ ] Monitor metrics for 2 weeks post-100% rollout
- [ ] Document winning A/B variants
- [ ] Promote winning variants to 100% traffic
- [ ] Archive this plan to `docs/plans/archive/2025/10/`
- [ ] Create completion report
- [ ] Plan Path 3 enhancements (voice input, instant approval, WhatsApp integration)
