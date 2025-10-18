---
title: progressive-form-restoration-implementation-plan
status: completed
owner: engineering
last-reviewed: 2025-10-29
context: Restore tested Step 2/3 UI, instant analysis tiers, and analytics groundwork on `/apply`
---

# Progressive Form Restoration Implementation Plan

> This plan converts the signed-off restoration spec (see references below) into an execution-ready backlog for an engineer who is new to NextNest. Follow the steps sequentially, respect TDD, and keep every change lean.

## Objectives
- Rebuild the `/apply` progressive form to match the previously tested Step 2/3 experience described in `docs/plans/active/2025-10-14-progressive-form-restoration-plan.md`.
- Reinstate Tier 2 instant analysis panels and lay out Tier 3 MAS-compliant placeholders without wiring final metrics yet.
- Capture foundation analytics via the existing event bus so future instrumentation can expand without UI churn.
- Ship with parity to the current homepage journey (`app/redesign/sophisticated-flow/page.tsx` → `components/ContactSection.tsx`) and avoid regressions in lead capture or chat hand-off.

## Preconditions
- ✅ Node.js 18+ and npm installed (`node -v`, `npm -v`).
- ✅ Working clone of `NextNest` with dependencies installed (`npm install`).
- ✅ Ability to run local dev server (`npm run dev`) and lint (`npm run lint`).
- ✅ Familiarity with Git basics (branching, commits, rebasing).

## Required Reading & Context (Do These First)
- `/README.md` — repo overview, scripts, and environment hints.
- `docs/plans/active/2025-10-14-progressive-form-restoration-plan.md` — source of truth for desired UI/feature set.
- `docs/reports/INSTANT_CALCULATION_STRATEGY_v2.md` — copy, metric tiers, and UX rationale.
- `components/forms/ProgressiveFormWithController.tsx` — the form you are modifying.
- `hooks/useProgressiveFormController.ts` — orchestrates step flow, validation, and instant calculations.
- `lib/forms/form-config.ts` — documents step definitions and field mappings (align your UI to these definitions).
- `lib/validation/mortgage-schemas.ts` — Zod schemas you may need to adjust for new/optional fields.

Take notes as you read; do not proceed until the flow and controller responsibilities make sense. If anything is unclear, stop and ask Brent.

## Tooling & Commands Reference
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run lint -- --max-warnings=0` (preferred; repo uses ESLint + TypeScript)
- Tests (if/when added): `npm test` (Jest) or command defined by newly created scripts.
- Build smoke test (optional near the end): `npm run build`

## Git Hygiene
- Create a dedicated WIP branch before editing (e.g., `git checkout -b feature/progressive-form-restoration`).
- Commit early and often—after each major task below. Use conventional summaries (e.g., `feat(form): add step 2 property context fields`).
- Never commit failing tests. Keep the worktree clean.

## Implementation Workstream

### 1. Baseline Snapshot & Safety Net
- [x] Run `npm run lint` and (if available) any existing test suite to capture the current pass state. Save outputs.
- [x] Open `/apply` locally (`npm run dev`, navigate to http://localhost:3000/apply) and record screenshots of the current Step 2/3 experience for comparison.
- [x] Verify homepage CTA (`/` → loan type selection) still routes into `/apply`. Note any anomalies.

### 2. Document Current Behaviour
- [x] Inspect `components/forms/ProgressiveFormWithController.tsx` and map current Step 2/Step 3 JSX blocks. Sketch what fields exist vs what the plan requires.
- [x] Review `hooks/useProgressiveFormController.ts` to understand `instantCalcResult`, field registration, and `onFieldChange`.
- [x] Confirm default values in `lib/forms/form-config.ts` and existing schema definitions in `lib/validation/mortgage-schemas.ts`.
- Deliverable: short internal note (can live in commit message or developer notes) summarising gaps you observed.

### 3. Test Harness Preparation (TDD Setup)
- [x] If no existing tests cover the progressive form, create a dedicated test file (`components/forms/__tests__/ProgressiveFormWithController.test.tsx`) using React Testing Library.
- [x] Add baseline tests that render the form, advance to Step 2, and assert the current (incorrect) fields. Mark them with `test.skip` temporarily and add a TODO referencing this plan.
- [x] Plan future assertions: Step 2 fields, optional block toggle, Step 3 joint applicant toggles, analytics dispatch hooks.

### 4. Reinstate Step 2 Required Inputs (New Purchase)
- [x] Write failing tests verifying Step 2 renders the four required inputs (property category/type, price range, combined age) once Step 1 completes.
- [x] Update `ProgressiveFormWithController.tsx`:
  - Replace current Step 2 JSX with the new field set, using existing UI primitives (`Select`, `Input`).
  - Ensure each input calls `onFieldChange` so instant analysis triggers.
  - Respect styling: monochrome palette + gold accent; match surrounding utility classes.
- [x] Ensure fields bind to schema keys defined in `form-config` and `mortgage-schemas`.
- [x] Run tests (they should now pass) and `npm run lint`.
- Deliverable: commit for Step 2 core fields.

### 5. Add Step 2 Optional Context Block
- [x] Write failing tests asserting the presence of an “optional context” toggle and that optional fields remain hidden until expanded.
- [x] Implement a collapsible section below the required inputs containing:
  - Development name (`developmentName`)
  - Payment scheme selection (`paymentScheme`)
  - Any other optional fields documented in the restoration plan.
- [x] Update schemas if necessary to allow optional values (ensure they remain non-blocking).
- [x] Verify tests and lint.
- Deliverable: commit for optional Step 2 context.

### 6. Restore Tier 2 Instant Analysis Panel
- [x] Write failing tests that assert:
  - No panel before Step 2 is complete.
  - Tier 2 panel renders loan range, down payment guidance, and monthly payment once required fields are filled (mock controller result).
  - Locked Tier 3 tiles display placeholder copy.
- [x] Extract an `InstantAnalysisPanel` sub-component if it keeps the main form lean; otherwise update the inline block.
- [x] Consume `instantCalcResult` safely; handle missing fields gracefully.
- [x] Align copy with `INSTANT_CALCULATION_STRATEGY_v2.md`.
- [x] Confirm tests + lint pass.
- Deliverable: commit for Tier 2 panel restoration.

### 7. Recreate Step 3 Skeleton (New Purchase)
- [x] Write failing tests ensuring:
  - Step 3 shows Applicant 1 age/income, credit-card count, employment status, commitments field.
  - Joint applicant toggle reveals Applicant 2 inputs and optional commitments.
  - Tier 3 panel shows locked MAS metrics with placeholder copy.
- [x] Update form JSX accordingly, reusing controller fields (`actualAges`, `actualIncomes`, etc.).
- [x] Ensure toggling joint applicant clears hidden values on disable to avoid stale data (controller already supports this; hook into existing helpers).
- [x] Confirm tests + lint pass.
- Deliverable: commit for Step 3 skeleton.

### 8. Analytics Foundation via Event Bus
- [x] Locate the analytics publisher (`lib/events/event-bus`, `useEventPublisher`).
- [x] Write tests (mocking the publisher) asserting events fire for:
  - Step transitions (Step 2 view, Step 3 view).
  - Optional section expansion.
  - Joint applicant toggle.
  - Tier 2 CTA interactions.
- [x] Instrument the form to dispatch events with payload `{ loanType, tier, action, fieldState }` via `useAnalyticsEvent`.
- [x] Ensure events trigger only once per interaction to avoid noise.
- [x] Tests + lint.
- Deliverable: commit for analytics groundwork.

### 9. Schema & Default Value Audit
- [x] Update `lib/validation/mortgage-schemas.ts` to align with new fields (optional vs required, joint applicant opt-in).
- [x] Ensure `lib/forms/form-config.ts` default values align with UI (undefined for optional, 0 only when required).
- [x] Add tests for schema updates if coverage exists; otherwise, consider a light unit test for defaults.
- Deliverable: commit for schema/default adjustments.

### 10. Manual QA Pass
- [x] Run `npm run dev`, walk through:
  - New purchase Step 2 completion triggers Tier 2 metrics.
  - Optional block expands/collapses without validation errors.
  - Step 3 toggle logic works; placeholders show.
  - Analytics events log in console (temporary instrumentation) or add jest mock verification.
- [x] Confirm `/apply?loanType=refinance` still works (even if unchanged).
- [x] Capture before/after screenshots for documentation.
- [x] Run `npm run lint` and any relevant tests a final time.

### 11. Documentation & Handoff
- [x] Update `docs/plans/active/2025-10-14-progressive-form-restoration-plan.md` status if appropriate (coordinate with Brent).
- [x] Add notes to `validation-reports/` or create a new QA log describing test cases run, issues found/fixed.
- [x] Update `docs/work-log.md` task status if you are the one executing.
- [x] Prepare change summary for PR (link to plan + doc references).

## Future Work (Do Not Implement Now)
- Wiring actual MAS metrics into Tier 3 once copy and calculations are finalised.
- Refinancing-specific Step 2/3 rebuild (will follow same pattern; wait for green light).
- Expanded analytics dashboards beyond event dispatch.
- Visual polish variants (animations, urgency banners) until data proves need.

## Testing Guidance
- Prefer React Testing Library + Jest for component behaviour.
- Controller-level tests should remain untouched unless behaviour changes; mocks should reflect the simple path (no heavy mocking of responsiveness).
- Keep tests focused on user-visible outcomes: required fields present, optional blocks toggle, analytics events fired.
- When in doubt, write the test first, watch it fail, then implement.

## Verification Checklist Before PR
- [ ] All new tests pass and cover desired behaviour.
- [ ] `npm run lint` passes with zero warnings.
- [ ] Manual QA scenarios exercised and recorded.
- [ ] No unused imports, console logs, or stray debug styles.
- [ ] Committed screenshots/recordings stored outside the repo (reference in PR description instead).

## References
- `docs/plans/active/2025-10-14-progressive-form-restoration-plan.md`
- `docs/reports/INSTANT_CALCULATION_STRATEGY_v2.md`
- `hooks/useProgressiveFormController.ts`
- `components/forms/ProgressiveFormWithController.tsx`
- `lib/forms/form-config.ts`
- `lib/validation/mortgage-schemas.ts`
- `components/ContactSection.tsx` (homepage entry point reassurance)
- `docs/work-log.md` (task tracking)

Follow this plan step-by-step, keep Brent in the loop on any ambiguity, and do not skip TDD or linting. Stop and ask for clarification whenever something feels off.
