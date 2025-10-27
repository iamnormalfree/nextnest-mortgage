---
status: active
complexity: medium
estimated_hours: 12-16
tier1_files: instant-profile.ts, ProgressiveFormWithController.tsx
constraint: TBD
can_task: TBD
---

# Step 2 Refinance: Market Opportunity UI Redesign

**Implementation Guide:** See `docs/runbooks/forms/refinance-market-opportunity-implementation-guide.md` for detailed code examples, patterns, and testing strategies.

## Problem Statement

Current Step 2 refinance display shows "$41/mo savings" without knowing user's loan tenure or target bank package, creating false precision. Users don't understand what savings are based on, and we can't accurately calculate monthly payment changes without tenure data.

**Goal:** Replace precision-focused display with excitement-focused "market opportunity landscape" that shows rate ranges, bank competition, and interest savings potential over fixed periods (2-3 years) to motivate Step 3 completion.

## Success Criteria

1. **Display accuracy:** Step 2 shows interest savings over 2-3 year windows, not monthly payment changes
2. **Market context:** Shows fixed/floating/hybrid rate ranges with bank counts (using placeholder data: 1M SORA 1.29%, 3M SORA 1.39%)
3. **No false precision:** All copy uses "could save" not "will save", includes disclaimers
4. **Data flexibility:** Backend structure supports daily rate updates (even if using static data now)
5. **Test coverage:** 100% of new calculation functions, 90%+ component coverage
6. **Mobile responsive:** Sidebar displays correctly on mobile as inline card

## Pre-Implementation

**REQUIRED before Task 1:** `bash scripts/validate-market-opportunity-setup.sh` (validates dependencies, config, files)

**Read these docs:**
- [ ] `docs/runbooks/forms/refinance-market-opportunity-implementation-guide.md` (code examples, patterns, tests)
- [ ] `docs/runbooks/forms/refinance-market-opportunity-common-mistakes.md` (10 common pitfalls, recovery commands)
- [ ] `CANONICAL_REFERENCES.md` sections on instant-profile.ts and ProgressiveFormWithController.tsx (Tier 1 rules)

## Tasks

### Task 1: Create Market Rate Data Structure (2h)
**Files:** `lib/types/market-rates.ts`, `lib/types/__tests__/market-rates.test.ts`
**Build:** `MarketRateSnapshot` interface, `RateRange` interface, `getPlaceholderRates()` factory
**Note:** Rates as PERCENTAGES (2.15 = 2.15%)
**Commit:** `feat(types): add MarketRateSnapshot interface with placeholder factory`
**Details:** Implementation guide Task 1

---

### Task 2: Create Interest Savings Calculator (3h)
**Files:** `lib/calculations/refinance-savings.ts`, `lib/calculations/__tests__/refinance-savings.test.ts`
**Build:** `InterestSavingsResult` interface, `calculateInterestSavings()` with simple interest, rounds DOWN to $100
**CRITICAL:** Function expects DECIMALS (use 0.0215 for 2.15%)
**Test:** $400k at 3% vs 2.15% = $6,800 (2yr) / $10,200 (3yr), zero handling, negative clamping
**Commit:** `feat(calculations): add interest savings calculator with conservative rounding`
**Details:** Implementation guide Task 2

---

### Task 3: Add Multi-Scenario Comparison (2h)
**Files:** Update `lib/calculations/refinance-savings.ts` and tests
**Build:** `SavingsScenario` interface, `percentageToDecimal()` helper, `generateSavingsScenarios()` for 3 scenarios
**CRITICAL:** Add `import type { MarketRateSnapshot }` from ../types/market-rates
**Test:** 3 scenarios (2yr/3yr fixed, floating), MIN rates, non-negative, sorted by savings
**Commit:** `feat(calculations): add multi-scenario savings comparison`
**Details:** Implementation guide Task 3

---

### Task 4: Update RefinanceOutlookResult Interface (1h)
**Files:** Update `lib/calculations/instant-profile.ts` (line ~98) and tests
**Change:** Add `savingsScenarios?: SavingsScenario[]` field, update `calculateRefinanceOutlook()` options
**Test:** Backward compatibility, new field when requested
**Commit:** `feat(calculations): add savingsScenarios to RefinanceOutlookResult`
**Note:** Tier 1 file - check CANONICAL_REFERENCES.md before modifying
**Details:** Implementation guide Task 4

---

### Task 5: Create MarketRateDisplay Component (3h)
**Files:** `components/forms/instant-analysis/MarketRateDisplay.tsx`, `__tests__/MarketRateDisplay.test.tsx`
**Build:** Rate ranges display with red/green indicators, bank counts
**Props:** `{ marketRates: MarketRateSnapshot, currentRate: number }`
**Test:** Renders all packages, correct colors, bank counts, missing data handling
**Commit:** `feat(components): add MarketRateDisplay component`
**Details:** Implementation guide Task 5 + Visual Design Specifications

---

### Task 6: Create SavingsDisplay Component (2h)
**Files:** `components/forms/instant-analysis/SavingsDisplay.tsx`, `__tests__/SavingsDisplay.test.tsx`
**Build:** 2yr/3yr savings with "~" prefix, "could save" copy, EXACT legal disclaimer
**Props:** `{ scenarios: SavingsScenario[], outstandingLoan: number }`
**CRITICAL:** Must use exact disclaimer from implementation guide
**Test:** Number formatting, disclaimer exact, "could save" present, "will save" ABSENT
**Commit:** `feat(components): add SavingsDisplay component`
**Details:** Implementation guide Task 6 + Visual Design Specifications

---

### Task 7: Redesign RefinanceOutlookSidebar (2h)
**PRE-CHECK:** `git status RefinanceOutlookSidebar.tsx` - commit baseline if untracked
**Files:** Update `components/forms/instant-analysis/RefinanceOutlookSidebar.tsx` and tests
**Change:** Import 3 child components (MarketRateDisplay, SavingsDisplay, MarketContextWidget), replace current display
**Requires:** Tasks 5, 6, 9 completed first (child components exist)
**Test:** No regression, renders sub-components, loading states, mobile layout
**Commit:** `refactor(components): redesign RefinanceOutlookSidebar with market opportunity UI`
**Details:** Implementation guide Task 7 + Component Dependency Tree

---

### Task 8: Integrate Market Rates into Form (2h)
**Files:** Update `components/forms/ProgressiveFormWithController.tsx` (lines ~318-358) and tests
**Change:** Update `useMemo` to call `getPlaceholderRates()`, add `includeSavingsScenarios: true`
**Test:** Calculation triggers, result includes scenarios, backward compatibility
**Commit:** `feat(forms): integrate market rates into refinance calculation`
**Note:** Tier 1 file - check CANONICAL_REFERENCES.md before modifying
**Details:** Implementation guide Task 8

---

### Task 9: Add MarketContextWidget (1h)
**Files:** `components/forms/instant-analysis/MarketContextWidget.tsx`, `__tests__/MarketContextWidget.test.tsx`
**Build:** SORA benchmarks card with relative date formatting
**Props:** `{ soraBenchmarks: { one_month, three_month }, updatedAt: string }`
**Test:** Renders SORA rates, formats dates ("Today", "Yesterday"), missing data handling
**Commit:** `feat(components): add MarketContextWidget for SORA benchmarks`
**Details:** Implementation guide Task 9 + Visual Design Specifications

---

### Task 10: E2E Test for Complete Flow (1h)
**Files:** `tests/e2e/refinance-market-opportunity-step2.spec.ts`
**Test:** Full flow (navigate → fill → verify), all 3 components render, "could save" present, "will save" ABSENT, disclaimer present
**Commit:** `test(e2e): add refinance market opportunity flow test`
**Details:** Implementation guide Task 10 + Testing Patterns

---

## Testing Strategy

**Run tests:** `npm test` (all), `npm test refinance-savings` (single), `npm test -- --coverage`, `npm run test:e2e`

**Coverage:** 100% calculations, 90%+ components, E2E happy path + errors

**Distribution:** Unit (70%), Component (20%), E2E (10%)

**See implementation guide for detailed test patterns.**

## Development Workflow

**TDD cycle:**
1. Write failing test
2. Implement minimal code
3. Test passes
4. Commit

**Commit after EACH task** (10 commits total). Pre-commit hook runs linter and validates plan length.

**If tests fail, do NOT commit.** Fix tests first.

## Rollback Plan

If production breaks:
1. `git revert HEAD` (revert most recent commit)
2. `git push` (deploy revert)
3. Old calculation logic unchanged (backward compatibility via optional fields)

## Future Work (Out of Scope)

**Phase 2:** Manual markdown data updates (`data/market-rates/YYYY-MM-DD.md`)

**Phase 3:** Python script for MAS SORA scraping (ask Brent for existing script), daily cron job, `/api/market-rates` endpoint

**Phase 4:** Analytics tracking, A/B test 2yr vs 3yr emphasis

## Notes

**Placeholder data to use:**
- 1M SORA: 1.29%, 3M SORA: 1.39%
- 2yr fixed: 2.15-2.45% (8 banks)
- 3yr fixed: 2.35-2.65% (12 banks)
- 3M SORA floating: 2.60-2.85% (15 banks)

**Key principles:**
- Use simple interest (not amortization) - no tenure needed
- Round savings DOWN (conservative)
- Use "could save" not "will save"
- Show rate ranges, not specific banks

**Questions for Brent:**
1. Python script for MAS SORA scraping? (mentioned as available)
2. Market rate data location: `data/` or `lib/constants/`?
3. Markdown format for manual bank package updates?
