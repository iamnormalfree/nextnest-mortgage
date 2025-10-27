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

## Pre-Flight Validation

**REQUIRED: Run validation script BEFORE starting Task 1:**

```bash
bash scripts/validate-market-opportunity-setup.sh
```

This validates all dependencies, configurations, and file states. **If validation fails, fix errors before proceeding.**

## Pre-Implementation Checklist

- [ ] ✅ Pre-flight validation passed (see above)
- [ ] Read implementation guide: `docs/runbooks/forms/refinance-market-opportunity-implementation-guide.md`
  - **Critical:** Read "Rate Conversion Pattern" section (percentages vs decimals)
  - **Critical:** Read "Visual Design Specifications" section (mockups + legal disclaimer)
  - **Critical:** Read "Common Pitfalls" section (avoid 100x calculation errors)
- [ ] Read common mistakes guide: `docs/runbooks/forms/refinance-market-opportunity-common-mistakes.md`
  - Quick reference for the 10 most common implementation mistakes
  - Recovery commands if you make a mistake
  - Pre-flight/mid-flight/post-flight checklists
- [ ] Read `CANONICAL_REFERENCES.md`:
  - Section "Primary Calculator - Dr Elena v2" (find line with: `grep -n "Primary Calculator" CANONICAL_REFERENCES.md`)
  - Section "ProgressiveFormWithController.tsx" (find line with: `grep -n "ProgressiveFormWithController" CANONICAL_REFERENCES.md`)
  - **Note:** Line numbers may drift - always use grep to find current location
- [ ] Review existing patterns:
  - `calculateInstantProfile()` in instant-profile.ts (calculation structure)
  - `InstantAnalysisSidebar.tsx` (component loading states)
  - `RefinanceOutlookSidebar.tsx` (current implementation - may be untracked, check git status)
- [ ] Verify tools:
  - TypeScript 5.x: `npx tsc --version`
  - Test runner: `npm test -- --version`
  - Git working directory: `git status`

## Tasks

### Task 1: Create Market Rate Data Structure (2h)

**New files (EXPLICIT PATHS):**
- `lib/types/market-rates.ts` (interface + placeholder factory)
- `lib/types/__tests__/market-rates.test.ts` (unit tests, co-located)

**What to build:**
- `MarketRateSnapshot` interface (fixed/floating/hybrid packages, SORA benchmarks)
- `RateRange` interface (min/max/bank_count)
- `getPlaceholderRates()` factory function returning hardcoded placeholder data
- **Note:** Rates stored as PERCENTAGES (2.15 = 2.15%), not decimals

**Test cases:**
- Valid structure (all required fields)
- Rates 0-10% (percentage range)
- Positive bank counts
- Valid ISO timestamp

**Commit:** `feat(types): add MarketRateSnapshot interface with placeholder factory`

**Details:** See implementation guide section "Task 1" for complete interface definition and test patterns.

---

### Task 2: Create Interest Savings Calculator (3h)

**New files (EXPLICIT PATHS):**
- `lib/calculations/refinance-savings.ts` (calculator functions)
- `lib/calculations/__tests__/refinance-savings.test.ts` (unit tests, co-located)

**What to build:**
- `InterestSavingsResult` interface
- `calculateInterestSavings(outstandingLoan, currentRate, targetRate, years)` using simple interest formula
- Returns `{ savings, currentInterest, newInterest }` with savings rounded DOWN to $100
- **CRITICAL:** Function expects rates as DECIMALS (use 0.0215 for 2.15%)

**Test cases:**
- $400k at 3% vs 2.15% = $6,800 (2yr) / $10,200 (3yr)
- Zero outstanding loan handling
- Negative savings clamped to zero (target rate > current rate)
- Rounding down to nearest $100

**Commit:** `feat(calculations): add interest savings calculator with conservative rounding`

**Details:** See implementation guide "Task 2" for formula, rounding rules, TDD approach.

---

### Task 3: Add Multi-Scenario Comparison (2h)

**Update files:**
- `lib/calculations/refinance-savings.ts` (add functions)
- `lib/calculations/__tests__/refinance-savings.test.ts` (add test cases)

**What to build:**
- `SavingsScenario` interface
- `percentageToDecimal(rate)` helper function (converts MarketRateSnapshot percentages to decimals)
- `generateSavingsScenarios(outstandingLoan, currentRate, marketRates)` returning array of 3 scenarios
- **CRITICAL:** Add `import type { MarketRateSnapshot } from '../types/market-rates';` at top of file
- Uses MIN rate from each package type (most attractive), sorted by 2yr savings descending

**Test cases:**
- 3 scenarios generated (2yr fixed, 3yr fixed, floating)
- MIN rates used from MarketRateSnapshot
- Non-negative savings for all scenarios
- Correct sorting (best savings first)

**Commit:** `feat(calculations): add multi-scenario savings comparison`

**Details:** See implementation guide "Task 3" for scenario structure, helper function, and logic.

---

### Task 4: Update RefinanceOutlookResult Interface (1h)
**Update files:** `lib/calculations/instant-profile.ts` (line 98), `tests/calculations/instant-profile.test.ts`

**What to change:**
- Add optional field `savingsScenarios?: SavingsScenario[]` to interface
- Update `calculateRefinanceOutlook()` to accept options: `{ includeSavingsScenarios?: boolean, marketRates?: MarketRateSnapshot }`
- Generate scenarios when flag enabled

**Test cases:** Backward compatibility (existing tests pass), new field when requested, structure validation

**Commit:** `feat(calculations): add savingsScenarios to RefinanceOutlookResult`

**Note:** Tier 1 file - check CANONICAL_REFERENCES.md lines 76-108 before modifying.

**Details:** See implementation guide "Task 4" for signature changes and test updates.

---

### Task 5: Create MarketRateDisplay Component (3h)

**New files (EXPLICIT PATHS):**
- `components/forms/instant-analysis/MarketRateDisplay.tsx` (component)
- `components/forms/instant-analysis/__tests__/MarketRateDisplay.test.tsx` (tests, co-located)

**What to build:**
- Presentational component showing rate ranges (2yr/3yr fixed, floating SORA)
- Props: `{ marketRates: MarketRateSnapshot, currentRate: number }`
- Red/green indicator based on rate competitiveness (rate < current = green, rate >= current = red)
- Shows bank counts for competition signal
- **Design:** See "MarketRateDisplay Layout" in implementation guide for ASCII mockup

**Test cases:**
- Renders all packages (2yr/3yr fixed, floating)
- Correct indicator colors (green for lower rates, red for higher)
- Bank counts displayed
- Handles missing data gracefully

**Commit:** `feat(components): add MarketRateDisplay component`

**Details:** See implementation guide "Visual Design Specifications" for mockups, colors, spacing, and typography.

---

### Task 6: Create SavingsDisplay Component (2h)

**New files (EXPLICIT PATHS):**
- `components/forms/instant-analysis/SavingsDisplay.tsx` (component)
- `components/forms/instant-analysis/__tests__/SavingsDisplay.test.tsx` (tests, co-located)

**What to build:**
- Component showing 2yr/3yr savings for best rate scenario
- Props: `{ scenarios: SavingsScenario[], outstandingLoan: number }`
- Copy uses "~" prefix (e.g., "~$6,800"), "could save" language, NEVER "will save"
- **CRITICAL:** Must include exact legal disclaimer (see implementation guide "Legal Disclaimer")
- **Design:** See "SavingsDisplay Layout" in implementation guide for ASCII mockup

**Required disclaimer (EXACT TEXT):**
```
Estimated savings based on market rates as of {date}. Actual savings depend on your approved package, loan tenure, and fees. This is not a guarantee. Terms apply.
```

**Test cases:**
- Number formatting with commas ($6,800 not $6800)
- Disclaimer present and exact
- Zero handling (shows $0 gracefully)
- Missing data graceful fallback
- Test for "could save" present, "will save" ABSENT

**Commit:** `feat(components): add SavingsDisplay component`

**Details:** See implementation guide "Visual Design Specifications" for mockups, copy rules, styling.

---

### Task 7: Redesign RefinanceOutlookSidebar (2h)

**⚠️ PRE-CHECK:** Run `git status components/forms/instant-analysis/RefinanceOutlookSidebar.tsx`
- If UNTRACKED: Commit baseline first with `git add [file] && git commit -m "feat: baseline RefinanceOutlookSidebar before redesign"`
- If TRACKED: Proceed with refactoring

**Update files:**
- `components/forms/instant-analysis/RefinanceOutlookSidebar.tsx` (refactor)
- `components/forms/instant-analysis/__tests__/RefinanceOutlookSidebar.test.tsx` (update tests)

**What to change:**
- **Import child components:** `MarketRateDisplay`, `SavingsDisplay`, `MarketContextWidget` (see implementation guide for exact import)
- Replace current display with 3 child components
- Keep existing loading state logic (lines 14-29 in current file)
- Maintain mobile/desktop responsive behavior
- Update props interface if needed

**Component dependency order (must exist before this task):**
1. ✅ MarketRateDisplay (Task 5)
2. ✅ SavingsDisplay (Task 6)
3. ✅ MarketContextWidget (Task 9)

**Test cases:**
- No regression (existing tests pass)
- Renders new sub-components
- Loading states work
- Missing data handled gracefully
- Mobile layout correct

**Commit:** `refactor(components): redesign RefinanceOutlookSidebar with market opportunity UI`

**Details:** See implementation guide "Component Dependency Tree" for import structure and integration pattern.

---

### Task 8: Integrate Market Rates into Form (2h)
**Update files:** `components/forms/ProgressiveFormWithController.tsx` (lines 318-358), `__tests__/ProgressiveFormWithController.test.tsx`

**What to change:**
- Update `useMemo` hook to call `getPlaceholderRates()` and pass to calculation
- Add `includeSavingsScenarios: true` flag in options
- Watch for `currentRate` field changes

**Test cases:** Calculation triggers correctly, result includes scenarios, backward compatibility maintained

**Commit:** `feat(forms): integrate market rates into refinance calculation`

**Note:** Tier 1 file - check CANONICAL_REFERENCES.md lines 21-45 before modifying.

**Details:** See implementation guide "Task 8" for useMemo pattern.

---

### Task 9: Add MarketContextWidget (1h)

**New files (EXPLICIT PATHS):**
- `components/forms/instant-analysis/MarketContextWidget.tsx` (component)
- `components/forms/instant-analysis/__tests__/MarketContextWidget.test.tsx` (tests, co-located)

**What to build:**
- Small card showing SORA benchmarks (1M, 3M) and update timestamp
- Props: `{ soraBenchmarks: { one_month, three_month }, updatedAt: string }`
- Relative date formatting: "Today at 6:00 AM", "Yesterday", etc.
- **Design:** See "MarketContextWidget Layout" in implementation guide for ASCII mockup

**Test cases:**
- Renders SORA rates correctly
- Formats timestamp relative ("Today", "Yesterday", "DD MMM YYYY")
- Handles missing data gracefully
- Shows update time

**Commit:** `feat(components): add MarketContextWidget for SORA benchmarks`

**Details:** See implementation guide "Visual Design Specifications" for mockups and date formatting rules.

---

### Task 10: E2E Test for Complete Flow (1h)

**New files (EXPLICIT PATHS):**
- `tests/e2e/refinance-market-opportunity-step2.spec.ts` (Playwright E2E test)

**What to test:**
- Full user flow: navigate → fill Step 1 → fill Step 2 → verify sidebar displays
- Verify MarketRateDisplay appears (rate ranges visible)
- Verify savings numbers correct (match calculation)
- Verify "could save" copy present (hedging language)
- **CRITICAL:** Verify "will save" NOT present (guarantees forbidden)
- Verify legal disclaimer present

**Test assertions:**
- Sidebar visible after Step 2 fields filled
- All 3 child components render (MarketRateDisplay, SavingsDisplay, MarketContextWidget)
- Numbers formatted correctly (commas, $ prefix)
- Copy uses approximate language ("~", "could", "estimated")
- No guarantee language ("will", "guaranteed", "promise")

**Commit:** `test(e2e): add refinance market opportunity flow test`

**Details:** See implementation guide "Testing Patterns" section for Playwright test structure and assertions.

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
