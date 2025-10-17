---
title: progressive-form-restoration-plan
status: draft
owner: engineering
last-reviewed: 2025-01-12
context: Restore Step 2/3 UI and instant analysis
---

# Progressive Form Restoration Plan
**Goal**: Reinstate the rich Step 2/3 experience (new purchase & refinancing) so `/apply` collects the right data and displays tiered instant analysis using the existing controller logic.  
**Audience**: Junior developer

---

## Overview
- Current `/apply` path renders `ProgressiveFormWithController.tsx`, but that UI only collects single-applicant inputs and shows one metric.
- `useProgressiveFormController.ts` still fires instant calculations and expects the original field layout.
- `lib/forms/form-config.ts` documents the intended Step 2/3 fields (per loan type).

**Scope**: Update the form UI to match the documented flow, reintroduce tiered instant-analysis panels, and ensure Step 3 feeds joint-applicant data to the controller.

---

## Step-by-Step Tasks

### 1. Confirm Current Surface
- Load `/apply` locally; note the existing Step 2/3 fields and instant-analysis placeholder.
- Read `ProgressiveFormWithController.tsx` to understand current field bindings.
- Skim `useProgressiveFormController.ts` to confirm `instantCalcResult` shape and trigger logic.

### 2. Rebuild Step 2 Inputs
**New Purchase**
1. Replace Step 2 fields with:
   - Property category (`propertyCategory`)
   - Property type (`propertyType`)
   - Property price (`priceRange`)
   - Approximate combined age (`combinedAge`)
2. Bind via `Controller` or `register` with `onFieldChange`.

**Refinancing**
1. Ensure Step 2 includes:
   - Property type (`propertyType`)
   - Current interest rate (`currentRate`)
   - Outstanding loan amount (`outstandingLoan`)
   - Current bank (`currentBank`, include “Prefer not to say”)
2. Remove extraneous Step 2 fields (lock-in, tenure, etc).

### 3. Restore Instant-Analysis Panels
- Add a Tier 1 teaser after Step 1 completion.
- For Step 2 completion:
  - **New purchase**: loan range, down-payment breakdown, monthly payment, “unlock Step 3” copy.
  - **Refinance**: current vs estimated payment, savings, break-even, urgency messaging.
- Use `instantCalcResult` fields; follow wording from `docs/reports/INSTANT_CALCULATION_STRATEGY_v2.md`.

### 4. Recreate Step 3 Inputs
**New Purchase**
- Toggle: single vs joint applicant.
- Applicant 1: age (`actualAges.0`), income (`actualIncomes.0`).
- Applicant 2: age (`actualAges.1`), income (`actualIncomes.1`) when joint.
- Credit card count (`creditCardCount`).
- Employment status (three options).
- Monthly commitments (`existingCommitments` optional).

**Refinancing**
- Income/job change (yes/no + detail).
- Employment status.
- Package preference buttons.
- Monthly commitments (optional).
- Any fields moved from Step 2 per reconciliation docs.

### 5. Surface Tier 3 Metrics
- After Step 3 completion, display MAS-compliant panel:
  - TDSR/MSR usage, funds required, loan approval probability (new purchase).
  - Goal-specific savings update, TDSR improvement, urgency strip (refinance).
- CTA: “Review these results with our AI broker for next steps.”

### 6. Update Validation & Defaults
- Adjust `lib/validation/mortgage-schemas.ts` so new fields validate correctly (e.g., co-applicant optionality).
- Ensure `getDefaultValues` supplies undefined/0 as appropriate.
- Verify `getVisibleFields` aligns with the new UI.

### 7. Testing & Verification
- Manual QA for both loan types:
  - Step 2 triggers instant analysis after all four fields.
  - Step 3 shows MAS panel and CTA.
- Run lint/tests (`npm run lint`, relevant scripts) to catch regressions.

### 8. Documentation & Notes
- Capture screenshots or notes for anything still pending (mobile tweaks, analytics hooks).
- Signpost remaining backlog items if any new gaps appear.

---

## Deliverables
- Updated `components/forms/ProgressiveFormWithController.tsx` (revised Step 2/3 UI + instant panels).
- Helper components if extracted (e.g., `InstantAnalysisDisplay`, `ApplicantSection`).
- Schema/default tweaks supporting the new UI.
- QA checklist demonstrating both journeys.

---

## References
- `hooks/useProgressiveFormController.ts` – existing instant-calculation logic.
- `lib/forms/form-config.ts` – Step definitions and field mappings.
- `docs/reports/INSTANT_CALCULATION_STRATEGY_v2.md` – UI copy and metric tiers.
- `remap-ux/RECONCILIATION_PLAN.md` – final Step 2/3 field counts.
- `remap-ux/STEP_3_FINALIZED_SPECIFICATION.md` – detailed Step 3 layout for joint applicants.

---

**Status**: Ready for execution once reviewed.
