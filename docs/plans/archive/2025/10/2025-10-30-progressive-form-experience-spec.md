---
title: progressive-form-experience-spec
status: in-progress
owner: engineering
last-reviewed: 2025-10-30
context: Align Step 2/Step 3 UX and instant analysis math with Dr Elena v2 guidance
---

# Progressive Form Experience Specification — Step 2 & Step 3

> Source-of-truth UX and calculation blueprint for the `/apply` progressive form covering Step 2 (What You Need) and Step 3 (Your Finances) across new purchase and refinance journeys.

## Objectives
- Deliver a friction-light Step 2 that conditionally reveals only relevant fields while auto-injecting BUC optional context and LTV insights aligned with `dr-elena-mortgage-expert-v2.json`.
- Diverge Step 3 flows for new purchase vs refinance so each collects the minimum viable data for accurate MAS/TDSR guidance and refinance strategy.
- Centralise instant analysis, MAS readiness, and refinance outlook math in audited pure functions to guarantee persona-aligned accuracy.

## References
- docs/plans/active/2025-10-14-progressive-form-restoration-plan.md
- docs/plans/active/2025-10-28-progressive-form-restoration-implementation-plan.md
- docs/reports/INSTANT_CALCULATION_STRATEGY_v2.md
- remap-ux/RECONCILIATION_PLAN.md
- remap-ux/STEP_3_FINALIZED_SPECIFICATION.md
- dr-elena-mortgage-expert-v2.json

## Step 2 — What You Need
- **Property category as master switch**: show property-type selector only for `resale` and `new_launch`. Auto-assign `HDB` for `bto` and `Commercial` for `commercial`.
- **Property-type lists**: `resale` → {HDB, Private Condo, Landed}; `new_launch` → {Executive Condo, Private Condo, Landed}. Persist selection in controller state and schema.
- **Optional context toggle**: render only when `propertyCategory === 'new_launch'`. Button copy “Add optional context · For better personalization.” Expanded fields: development name, payment scheme (dropdown), future-ready slot for launch-specific questions. Analytics event `optional_context` fires on toggle with throttle.
- **Instant analysis reveal**: upon satisfying required Step 2 inputs, trigger `analyzing` state for ~1 s (inline spinner + copy). After delay, show personalized card expanded by default.
- **LTV segmented control**: default `75%` active, `55%` adjacent. Switching re-runs calculations, updates tenure guidance, and shows info-icon tooltip summarising the lower-leverage benefits. Persist selection in controller; analytics event `ltv_mode_change`.
- **Persona-aligned copy**: Update headings/subtext to reflect Dr Elena v2 tone (confidence, compliance, CPF transparency). Down payment breakdown uses CPF vs cash split produced by calculator.

## Step 3 — New Purchase
- **Household income panel**: defaults each applicant to “Employed (salary)” with fields for salary and optional variable income (comma-formatted). Employment-type selector options: Employed (salary), Self-employed, Variable income, Not working, Other. Each non-default choice reveals targeted follow-up (e.g., business age, 12-month average). Co-applicant block collapsed until toggled on.
- **Liabilities & obligations**: checklist toggles for property loans, car loans, credit cards, personal lines. Enabling reveals structured balance + monthly payment fields; totals feed calculator. Freeform “Other commitments” textarea handles edge cases.
- **MAS readiness preview**: live-updating card showing TDSR/MSR status, max eligible loan, CPF/cash requirement, and tenure cap. Pulls from calculator with rounding safety rules. Include “Updated just now” timestamp. Analytics event `mas_preview_refresh` throttled.

## Step 3 — Refinance
- **Shared income panel**: reuse new purchase structure with copy emphasising income stability. Owner-occupied vs investment toggle appended for advisory logic.
- **Current loan snapshot**: editable summary of outstanding balance, current rate, months remaining on package (used for timing guidance). Fields seeded from Step 2 data.
- **Refinance objectives**: segmented buttons for {Lower monthly payment, Keep payment but shorten tenure, Lock in rate certainty}. Choosing “Shorten tenure” reveals preferred tenure input. `Exploring cash-out?` checkbox renders only if property is private; enabling prompts desired cash amount and equity reminder.
- **Timing guidance**: input “How many months remain on your current package?” (integer). Calculator translates into recommended notice period and surfaces message (“Start paperwork in X weeks to avoid higher spread overlap”). Background assumption: borrowers honour lock-in to avoid penalties.
- **Advisory preview**: live card summarising projected monthly savings, tenure adjustment, and timing warning. Integrates objectives, property use, and calculator output.

## Constraint Alignment

- Constraint A – Public Surfaces Ready (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1): This specification governs the progressive form UX and calculation accuracy required for Stage 0 readiness and ensures implementation plans trace back to the launch gate checklist.

## Calculation & Data Model
- **Calculator module**: create `lib/calculations/instant-profile.ts` (or extend existing) exporting:
  - `calculateInstantProfile(step2State, ltvMode)`
  - `calculateComplianceSnapshot(step3State)`
  - `calculateRefinanceOutlook(step2State, step3State)`
- **Persona audit**: extract from `dr-elena-mortgage-expert-v2.json` the LTV matrices, tenure caps, CPF/cash ratios, stress rates, rounding behaviors. Encode as typed constants with docstrings referencing persona sections.
- **Deterministic outputs**: functions return typed objects containing results plus rationale metadata (`reasonCodes`, `policyRefs`) for tooltips. No async work.
- **Testing**: Jest unit tests covering representative scenarios (75% vs 55%, self-employed edge case, refinance timing). Golden numbers sourced from persona doc; maintain fixtures under `tests/fixtures/dr-elena-v2/`.

## Analytics & Telemetry
- Extend existing event bus usage for:
  - `optional_context_toggle`
  - `ltv_mode_change`
  - `refinance_objective_change`
  - `refinance_cashout_toggle`
  - `mas_preview_refresh`
- Ensure events include `loanType`, `step`, `fieldState`, and persona version hash for traceability.
- Throttle repeat emissions (≥1 s) to avoid flooding analytics.

## Non-Goals
- No visual overhaul beyond described tweaks (spinner, cards).
- No backend or Chatwoot changes.
- Tier 3 MAS metrics for refinance remain advisory—not binding underwriting decisions yet.

## Open Questions
- Confirm final copy for info tooltips (Dr Elena voice) with Brent before implementation.
- Validate whether additional BUC-specific fields (e.g., TOP date) join the optional block in this release.
- Determine if persona version display (“Calibrated with Dr Elena v2.1.0”) should be surfaced in UI or only analytics.
