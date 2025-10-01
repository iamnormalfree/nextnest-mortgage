---
title: form-refactor-guide
type: runbook
domain: forms
owner: engineering
last-reviewed: 2025-09-30
---

# Form Refactor Guide

_Last updated: 2025-09-24 14:41_

## Purpose
Provide a repeatable playbook for refactoring large form components (e.g., ProgressiveForm.tsx, IntelligentMortgageForm.tsx, ChatTransitionScreen.tsx) without destabilising the mortgage funnel.

## Approach Overview
1. **Map responsibilities** – document sections of the file (validation, state, analytics, transitions) before moving code.
2. **Add safety nets** – ship baseline tests and snapshots so every incremental extraction is verifiable.
3. **Slice gradually** – move one concern at a time into its own module while keeping the public API stable.
4. **Validate continuously** – run lint/tests, manual walkthroughs, and capture notes after each chunk.

---

## Task Checklist

### 1. Discovery & Documentation
- [ ] Outline the current file structure (top-level hooks, helper functions, JSX sections) in a short doc or file header.
- [ ] Identify duplicate logic shared with sibling components (e.g., ProgressiveFormWithController, IntelligentMortgageForm).
- [ ] List external dependencies (analytics trackers, feature flags, contexts) so extracted modules import the right contracts.

### 2. Guardrails
- [ ] Add/confirm a happy-path integration test (Playwright/Cypress) covering the full mortgage funnel.
- [ ] Write unit tests for critical helpers (session handling, AI insight requests, chat transition triggers).
- [ ] Capture current component screenshots or Storybook stories for visual regression checks.

### 3. Modularization Strategy
- [ ] Create a orms/ subdirectory (e.g., components/forms/progressive/) for new modules.
- [ ] Extract well-scoped chunks one at a time:
  - [ ] Step configuration & validation schemas.
  - [ ] State management hooks (useProgressiveSteps, useChatTransition).
  - [ ] Presentation components (GateOneSection, IncomeFields, SummaryCard).
  - [ ] Side-effects (analytics, session storage) into lib/ utilities if reusable.
- [ ] Re-export through the main file to keep existing imports working during migration.

### 4. Review & Cleanup
- [ ] After each extraction, run tests + lint and update the refactor log (below).
- [ ] Remove dead code (old helpers, unused imports) only after confirming no other component depends on them.
- [ ] Update related docs (e.g., this guide, apply readiness plan) with new module locations.

### 5. Communication & Validation
- [ ] Record progress in alidation-reports/ (what changed, tests run, any follow-ups).
- [ ] Surface tricky decisions (e.g., shared state shape changes) to tech leads before merging.
- [ ] Once stable, archive the legacy variants (e.g., ProgressiveFormWithController) or clearly mark them as deprecated.

---

## Refactor Log Template
Use this table to track incremental merges.

| Date | Commit / PR | Section Refactored | Tests Run | Notes |
|------|-------------|--------------------|-----------|-------|
| YYYY-MM-DD | link | e.g., Step 2 fields ? ProgressiveStepTwo.tsx | lint, form-e2e | Observations |

---

## Rollback Guidance
- Keep feature branches small; revert the last chunk if regressions appear.
- Retain the original monolith until the new modules are proven; avoid deleting the old code until integration tests pass consistently.

