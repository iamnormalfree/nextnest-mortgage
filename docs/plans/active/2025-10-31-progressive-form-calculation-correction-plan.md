---
title: progressive-form-calculation-correction-plan
status: draft
owner: engineering
created: 2025-10-31
context: Remediate instant analysis math, Step 3 readiness logic, and regression coverage per 2025-10-31 audit
---

# Progressive Form Calculation Correction Plan

## Overview
- Address the three remediation tracks Brent requested after the 2025-10-31 audit:
  1. Reconcile the calculator helpers with `dr-elena-mortgage-expert-v2.json`.
  2. Correct Step 3 readiness panels and persona displays so they surface accurate SG-MAS guidance.
  3. Tighten the TDD harness so future dr Elena regressions are caught automatically.
- Assume the implementer knows TypeScript and React but has zero context for NextNest, Singapore mortgages, or our tooling conventions.
- Every task starts with failing tests, follows TDD, and ends with passing lint + targeted Jest runs. Keep commits small and purposeful.

## Orientation
- **Read These First**
  - `docs/plans/active/2025-10-30-progressive-form-experience-implementation-plan.md` (current but needs corrections).
  - `docs/reports/DR_ELENA_V2_CALCULATION_MATRIX.md` (authoritative mapping of persona rules).
  - `dr-elena-mortgage-expert-v2.json` (ground truth for all formulas, limits, reason codes).
  - `docs/runbooks/PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK.md` (working style expectations).
  - `SKILL.md` → Executing Plans workflow.
  - `docs/work-log.md` (to understand the in-flight work log; update it as progress is made).
- **Key Directories**
  - `lib/calculations/` — calculator helpers and persona logic.
  - `components/forms/` — progressive form UI, Step 2/Step 3 panels.
  - `hooks/useProgressiveFormController.ts` — headless form orchestration.
  - `tests/calculations/` — Jest suites for calculator logic.
  - `tests/fixtures/` — persona-derived fixtures.
- **Tooling Commands (run from repo root)**
  - `npm run lint`
  - `npm test -- --runInBand --testPathPattern="tests/calculations/..."` (targeted suites)
  - `npm test -- --runInBand --testPathPattern="components/forms/..."` (UI coverage)
  - `npm run dev` (manual smoke at `/apply` if required)

## Git & Branching
- Create a dedicated branch before touching files:  
  `git checkout -b fix/progressive-form-calculation-corrections`
- Commit after each numbered workstream section (or earlier if work naturally splits). Use messages like:
  - `test(calculations): cover dr elena ltv and stress rate floors`
  - `feat(calculations): align instant profile with persona tiers`
  - `fix(forms): render mas readiness with persona metrics`
- Never commit with failing tests or lint errors. Run quick status checks (`git status`) before staging.

## Workstream 0 — Plan Status & Context Sync
1. **Re-open existing implementation plan**
   - Update `docs/plans/active/2025-10-30-progressive-form-experience-implementation-plan.md`:
     - Set `status` front-matter to `needs_corrections`.
     - In the “Completion Summary,” append a short sentence citing the 2025-10-31 audit findings (no history recap, just note misalignment discovered).
     - Add “Action Items” section summarising the three remediation tracks with links to this plan.
2. **Journal update**
   - Log the kickoff in `docs/work-log.md` task list and add a dated entry noting branch name, scope, and dependency on dr Elena persona.
3. **Optional confirmation**
   - If there are any previously failing tests unrelated to this effort, document them in the journal and surface to Brent before proceeding.

## Workstream 1 — Calculator Alignment with dr Elena v2

### Goal
Ensure `calculateInstantProfile`, `calculateComplianceSnapshot`, and `calculateRefinanceOutlook` strictly follow persona formulas, limits, rounding, and policy references.

### Tasks
1. **Persona constants module**
   - File: add `lib/calculations/dr-elena-constants.ts`.
   - Content: export typed constants for LTV tiers, tenure triggers, stress floors, CPF rules, income recognition, commitment formulas, and policy reference IDs pulled from `dr-elena-mortgage-expert-v2.json`.
   - Comment each export with the persona path (no historical remarks).
   - Write failing tests first: create `tests/calculations/dr-elena-constants.test.ts` asserting constants match the persona JSON (use fixtures to avoid drift).
   - If we maintain an index barrel (e.g., `lib/calculations/index.ts`), re-export the constants so helpers consume them from a single place.
2. **Instant profile refactor (TDD)**
   - File: `lib/calculations/instant-profile.ts`.
   - Steps:
     1. Augment `tests/calculations/instant-profile.test.ts`:
        - Assert every scenario’s numeric outputs exactly (max loan, LTV, cash split, limiting factors, tenure caps).
        - Add edge coverage for commercial (should allow persona-configured LTV, CPF zero, stress 5%).
        - Add tests ensuring stress rate is `Math.max(floor, quoted)` and LTV cap respects reduced tiers.
        - Mark tests `it.todo` temporarily if needed to keep suite red prior to implementation.
     2. Align types before implementation:
        - Update `InstantProfileResult` (and mirrored interfaces in `lib/contracts/form-contracts.ts`) to include persona-driven fields you will expose in the UI (e.g., `stressRateApplied`, `cpfWithdrawalLimit`, `ltvCapApplied`).
        - Ensure helper return types remain serialisable for analytics (no functions, only primitives/arrays).
     3. Refactor implementation to:
        - Use persona constants for tier selection instead of literals (`Commercial` must read from constants, default to persona’s bank policy fallback).
        - Apply reduced LTV tiers for second/third loans and trigger logic (tenure over threshold or age > 65).
        - Compute stress payment with `Math.max(quoted_rate, stress_floor)` before deriving loan eligibility.
        - Replace CPF allowance logic with valuation/withdrawal limit checks (respect 120% cap, use rounding helpers).
        - Populate `reasonCodes` and `policyRefs` using persona IDs (avoid duplicates via `Set`).
     4. Ensure rounding follows persona helper functions (loan eligibility down, funds required up, monthly payment up).
   - Run `npm test -- --runInBand --testPathPattern="tests/calculations/instant-profile.test.ts"`.
3. **Compliance snapshot corrections**
   - File: `lib/calculations/instant-profile.ts`.
   - Tests:
     - Expand `tests/calculations/compliance-snapshot.test.ts` to check:
       - Recognized income by employment type (70% for variable and self-employed, 100% for fixed).
       - TDSR and MSR compliance using stress payments (4%/5% floors vs quoted rate).
       - Policy references conditional on property type (HDB/EC include `MAS Notice 632`, others omit).
       - Limiting factor priority when stress payment breaches thresholds.
   - Implementation:
     - Use persona constants for income recognition and commitment calculations (credit cards, overdraft, guarantor).
     - Calculate stress payments with `Math.max(rate, stress_floor)`.
     - Compare compliance against dollar caps and ratio thresholds correctly (use recognized income).
4. **Refinance outlook recalibration**
   - Tests:
     - Strengthen `tests/calculations/refinance-outlook.test.ts`:
       - CPF accrued interest using monthly compounding from persona guidance.
       - Cash-out eligibility respects persona withdrawal/valuation limits.
       - Recommendations/time windows map to months remaining (immediate, critical, planning, long).
       - Investment properties apply reduced LTV caps.
   - Implementation updates in `lib/calculations/instant-profile.ts`:
     - Swap simple interest for compounded CPF accrual (use persona rate).
     - Determine allowable loan via persona LTV cap table (owner vs investment).
     - Enforce bridging/CPF rules (no CPF for commercial; HDB cash-out blocked).
5. **Controller wiring audit**
   - Files: `hooks/useProgressiveFormController.ts`, `lib/calculations/mortgage.ts` (if still referencing legacy helpers).
   - Ensure controller uses recalibrated outputs:
     - Pass rate assumptions through `Math.max(placeholder_rate, stress_floor)`.
     - Respect persona reason codes/policy references when bubbling results to UI.
     - Remove any redundant calculations already handled by helpers.
   - Update or delete stale helpers in `lib/calculations/mortgage.ts` if they duplicate persona logic; if removal would be destructive, consult Brent first.

## Workstream 2 — Step 3 Readiness & Persona Display Corrections

### Goal
Present accurate MAS readiness guidance and persona-derived data within the form UI.

### Tasks
1. **Step 2 instant analysis card**
   - File: `components/forms/ProgressiveFormWithController.tsx`.
   - Tests: extend `components/forms/__tests__/ProgressiveFormWithController.test.tsx` (create if missing) to validate:
     - CPF vs cash amounts reflect valuation/withdrawal limits.
     - Limiting factor, reason codes, policy refs display the persona strings returned by the calculator.
     - Commercial flow hides CPF hints and shows stress rate copy.
   - Implementation:
     - Use persona outputs (`cpfAllowedAmount`, `maxLoan`, `reasonCodes`, `policyRefs`) directly.
     - Show stress rate footnote when `rateAssumption` differs from quoted input.
     - Avoid recalculating monthly payment; rely on helper output or add dedicated helper if needed (placed in `lib/calculations/instant-profile.ts`).
2. **Step 3 New Purchase readiness panel**
   - File: `components/forms/sections/Step3NewPurchase.tsx`.
   - Tests: create/extend `components/forms/__tests__/Step3NewPurchase.test.tsx`:
     - Mock recognized income inputs to cover employed, self-employed, variable cases.
     - Assert readiness reasons appear when MSR/TDSR breached, including persona reason codes.
   - Implementation:
     - Replace custom MSR/TDSR math with direct calls to `calculateComplianceSnapshot`.
     - Aggregate commitments using persona calculators (`calculateCreditCardCommitment`, etc.).
     - Display persona policy references (e.g., MAS notices) when compliance snapshot returns them.
     - Update `lib/contracts/form-contracts.ts` (and any downstream types) to capture new readiness fields (recognized income, policy refs, stress rate applied).
3. **Step 3 Refinance readiness panel**
   - File: `components/forms/sections/Step3Refinance.tsx`.
   - Tests: extend `components/forms/__tests__/Step3Refinance.test.tsx`:
     - Cover credit card commitment formula, CPF redemption messaging, investment vs owner outcomes.
     - Validate recommendations toggle based on months remaining/objective.
   - Implementation:
     - Replace `(creditCardCount * 50)` with `calculateCreditCardCommitment`.
     - Surface CPF redemption amount and accrued interest using calculator outputs.
     - Ensure reasons/policy refs map to persona IDs (no hard-coded strings unless persona supplies them).
4. **Analytics payload review**
   - File: `hooks/useProgressiveFormController.ts`.
   - Confirm analytics events include:
     - Persona version, LTV mode, limiting factor, policy refs emitted by calculators.
     - No manual transcription of policy text; send IDs.
   - Update relevant tests under `tests/components/...` or `tests/hooks/...` to assert analytics payload shape if existing coverage relies on stubbed data.

## Workstream 3 — Harden Regression Tests & Documentation

### Goal
Lock in correctness through robust fixtures, tests, and documentation updates.

### Tasks
1. **Fixture refresh**
   - File: `tests/fixtures/dr-elena-v2-scenarios.ts`.
   - Sync inputs/outputs with persona JSON:
     - Include `max_cash_out`, `cpf_withdrawal_limit`, `stress_rate_applied`, etc., where available.
     - Add utility to load persona JSON directly so updates remain DRY (avoid manual duplication).
     - Document fixture source with persona keys.
     - Extend fixture TypeScript types to cover newly surfaced persona fields so tests stay type-safe.
2. **Negative scenario coverage**
   - Add tests for failure cases:
     - TDSR breach due to high commitments.
     - MSR breach for HDB (ensuring limiting factor flagged).
     - Commercial CPF disallowance.
   - Place in existing calculation test suites; mark them to expect `reasonCodes` entries (e.g., `tdsr_exceeded`).
3. **Snapshot removal / refinement**
   - Audit any snapshot usage in calculator/component tests; replace with explicit assertions referencing persona outputs to prevent brittle updates.
4. **Documentation updates**
   - `docs/reports/DR_ELENA_V2_CALCULATION_MATRIX.md`: update tables to reflect final constants (e.g., commercial LTV assumptions, CPF valuation/withdrawal logic). Record any unresolved gaps.
   - `docs/plans/active/2025-10-30-dr-elena-audit-plan.md`: add a “Resolved Gaps” section referencing this plan and note any outstanding items.
   - `docs/work-log.md`: log progress and remaining TODOs after each workstream.
5. **Final verification script**
   - Run sequentially:
     ```bash
     npm run lint
     npm test -- --runInBand --testPathPattern="tests/calculations"
     npm test -- --runInBand --testPathPattern="components/forms"
     ```
   - Document outputs (pass/fail) in the journal.

## Workstream 4 — Handoff & Completion
1. **Manual sanity (optional but recommended)**
   - `npm run dev` and visit `http://localhost:3000/apply`.
   - Test sample paths:
     - New purchase, private condo, age-trigger scenario.
     - HDB buyer with variable income.
     - Commercial property showing CPF disallowed.
     - Refinance cash-out attempt for private property vs HDB.
   - Capture observations in journal; flag discrepancies immediately.
2. **Update plans**
   - When remediation complete, set this plan’s `status` to `completed`.
   - Update `docs/plans/active/2025-10-30-progressive-form-experience-implementation-plan.md` with a corrective summary and link to commits/tests run.
3. **Prepare handoff summary**
   - Draft PR description or internal note covering:
     - Tests executed (with commands).
     - Persona rules now enforced.
     - Any deferred items.
   - Ensure journal contains enough detail for Brent to review.

## Success Criteria
- All calculator and Step 3 tests pass with persona-aligned assertions.
- Step 2/Step 3 UI renders persona outputs accurately for all property types.
- Documentation reflects corrected math and outstanding risks.
- Lint/test commands pass cleanly; no TODOs or `.only` left behind.
- Brent can review commits and understand changes without guesswork.
