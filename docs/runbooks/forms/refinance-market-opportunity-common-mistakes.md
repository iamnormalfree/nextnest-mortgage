# Common Mistakes - Market Opportunity UI Implementation

**Target Audience:** Junior developers using Claude Code to implement the plan in `docs/plans/active/2025-10-27-step2-refinance-market-opportunity-ui.md`

**Purpose:** Quick reference to avoid the 10 most common mistakes that cause implementation failures

**Last Updated:** 2025-10-27

---

## Quick Checklist Before Starting

```bash
# Run validation script FIRST:
bash scripts/validate-market-opportunity-setup.sh

# If validation passes, proceed to Task 1
# If validation fails, fix errors before continuing
```

---

## Critical Mistakes (Will Break Implementation)

### 1. 🔴 Mixing Percentages and Decimals (100x Calculation Error)

**Problem:** Market rates stored as PERCENTAGES (2.15 = 2.15%), but calculations need DECIMALS (0.0215).

**Wrong:**
```typescript
// ❌ This treats 2.15 as 215% instead of 2.15%
calculateInterestSavings(400000, 0.03, marketRates.fixed_packages.two_year.min, 2);
// Result: NEGATIVE savings (wrong!)
```

**Correct:**
```typescript
// ✅ Convert percentage to decimal
function percentageToDecimal(rate: number): number {
  return rate / 100;
}

calculateInterestSavings(
  400000,
  0.03,
  percentageToDecimal(marketRates.fixed_packages.two_year.min),
  2
);
// Result: $6,800 savings (correct!)
```

**Where this matters:**
- Task 2: `calculateInterestSavings()` expects decimals
- Task 3: `generateSavingsScenarios()` must convert rates before calling calculator

**Test to verify:**
```typescript
// Your test should fail if conversion is missing:
const result = calculateInterestSavings(400000, 0.03, percentageToDecimal(2.15), 2);
expect(result.savings).toBe(6800); // Should pass
```

---

### 2. 🟡 Wrong Test File Placement

**Problem:** Tests placed in wrong location fail pre-commit hooks and break codebase organization.

**Wrong:**
```
❌ tests/components/MarketRateDisplay.test.tsx (centralized, violates standards)
❌ tests/MarketRateDisplay.test.tsx (no context folder)
❌ components/forms/instant-analysis/MarketRateDisplay.test.tsx (not in __tests__)
```

**Correct:**
```
✅ components/forms/instant-analysis/__tests__/MarketRateDisplay.test.tsx
✅ lib/types/__tests__/market-rates.test.ts
✅ lib/calculations/__tests__/refinance-savings.test.ts
```

**Rule:** Component tests co-locate with components in `__tests__/` subfolder (per CANONICAL_REFERENCES.md line 620).

---

### 3. 🟠 Missing Import for MarketRateSnapshot

**Problem:** TypeScript errors in Task 3 because `MarketRateSnapshot` type not imported.

**Wrong:**
```typescript
// lib/calculations/refinance-savings.ts
// ❌ Missing import
export function generateSavingsScenarios(
  outstandingLoan: number,
  currentRate: number,
  marketRates: MarketRateSnapshot // TypeScript error: Cannot find name 'MarketRateSnapshot'
): SavingsScenario[] {
```

**Correct:**
```typescript
// ✅ Add import at top of file
import type { MarketRateSnapshot } from '../types/market-rates';

export function generateSavingsScenarios(
  outstandingLoan: number,
  currentRate: number,
  marketRates: MarketRateSnapshot // ✅ Type available
): SavingsScenario[] {
```

---

### 4. 🟡 RefinanceOutlookSidebar File State Confusion

**Problem:** Task 7 says "Update files" but file may be untracked in git, causing confusion.

**Check FIRST:**
```bash
git status components/forms/instant-analysis/RefinanceOutlookSidebar.tsx
```

**If UNTRACKED:**
```bash
# Commit baseline first
git add components/forms/instant-analysis/RefinanceOutlookSidebar.tsx
git commit -m "feat: baseline RefinanceOutlookSidebar before redesign"
# THEN proceed with Task 7 refactoring
```

**If TRACKED:**
```bash
# Proceed directly with Task 7 refactoring
```

---

## Legal/Compliance Mistakes

### 5. 🟠 Wrong Disclaimer or Guarantee Language

**Problem:** Using guarantee language ("will save", "guaranteed") creates legal liability.

**Wrong Copy:**
```typescript
❌ "You will save $6,800 over 2 years"
❌ "Guaranteed savings of $10,200"
❌ "Save $6,800" (no hedge)
```

**Correct Copy:**
```typescript
✅ "~$6,800" (tilde shows approximation)
✅ "You could save approximately $6,800"
✅ "Estimated savings: ~$6,800"
```

**Exact Legal Disclaimer (MUST USE in SavingsDisplay):**
```
Estimated savings based on market rates as of {date}. Actual savings depend on your approved package, loan tenure, and fees. This is not a guarantee. Terms apply.
```

**Test to verify:**
```typescript
it('should not use guarantee language', () => {
  render(<SavingsDisplay scenarios={mockScenarios} />);
  expect(screen.queryByText(/will save/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/guaranteed/i)).not.toBeInTheDocument();
  expect(screen.getByText(/could save/i)).toBeInTheDocument(); // Hedging language present
});
```

---

## Implementation Order Mistakes

### 6. 🟠 Creating Components in Wrong Order

**Problem:** Creating parent component before child components causes import errors and circular dependencies.

**Wrong Order:**
```
❌ Task 7 first: Create RefinanceOutlookSidebar
   (tries to import MarketRateDisplay, SavingsDisplay, MarketContextWidget - don't exist yet!)
```

**Correct Order (follows dependency tree):**
```
✅ Task 5: Create MarketRateDisplay (leaf node, no dependencies)
✅ Task 6: Create SavingsDisplay (leaf node, no dependencies)
✅ Task 9: Create MarketContextWidget (leaf node, no dependencies)
✅ Task 7: Refactor RefinanceOutlookSidebar (parent, imports all 3 above)
```

**Dependency Tree:**
```
RefinanceOutlookSidebar (parent - do LAST)
  ├─ MarketRateDisplay (child - do FIRST)
  ├─ SavingsDisplay (child - do FIRST)
  └─ MarketContextWidget (child - do FIRST)
```

---

## Configuration Mistakes

### 7. 🟡 Outdated Line Number References

**Problem:** Plan references specific line numbers that may have drifted as code changes.

**Wrong:**
```bash
# ❌ Blindly trusting fixed line numbers
# "Read CANONICAL_REFERENCES.md lines 76-108"
# (those lines may have shifted!)
```

**Correct:**
```bash
# ✅ Use grep to find current location
grep -n "Primary Calculator - Dr Elena v2" CANONICAL_REFERENCES.md
grep -n "ProgressiveFormWithController" CANONICAL_REFERENCES.md

# Then read the section found (line numbers may be 80-112 now, not 76-108)
```

---

## Testing Mistakes

### 8. 🟡 Forgetting to Test for Forbidden Language

**Problem:** Tests pass but legal team finds "will save" language in production.

**Missing Test:**
```typescript
// ❌ Only testing positive case (disclaimer present)
it('should display disclaimer', () => {
  expect(screen.getByText(/estimated savings/i)).toBeInTheDocument();
});
```

**Complete Test:**
```typescript
// ✅ Test BOTH positive (hedge present) and negative (guarantee absent)
it('should use hedge language, not guarantees', () => {
  render(<SavingsDisplay scenarios={mockScenarios} />);

  // Positive assertions (hedge language present)
  expect(screen.getByText(/could save/i)).toBeInTheDocument();
  expect(screen.getByText(/estimated/i)).toBeInTheDocument();
  expect(screen.getByText(/not a guarantee/i)).toBeInTheDocument();

  // Negative assertions (guarantee language absent)
  expect(screen.queryByText(/will save/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/guaranteed/i)).not.toBeInTheDocument();
});
```

---

## Design Mistakes

### 9. 🟠 No Visual Reference, Guessing Layout

**Problem:** Functional code but UI looks wrong because developer guessed spacing/colors.

**Wrong Approach:**
```typescript
// ❌ Guessing design
<div className="p-2 text-base"> {/* random spacing/size */}
  <span className="text-blue-500">2.15%</span> {/* wrong color */}
</div>
```

**Correct Approach:**
```typescript
// ✅ Follow implementation guide mockups
// See "MarketRateDisplay Layout" in implementation guide for:
// - Spacing: space-y-3, p-4
// - Typography: text-sm for header, text-lg for rates
// - Colors: text-nn-green for good rates, text-nn-red for bad rates

<div className="border border-[#E5E5E5] bg-[#F8F8F8] p-4">
  <div className="space-y-3">
    <p className="text-sm font-semibold text-black">Market Snapshot</p>
    <p className="text-lg font-bold text-black">2.15% - 2.45%</p>
    <span className="text-nn-green text-xl">🟢</span>
  </div>
</div>
```

**Where to find specs:**
- Implementation guide section: "Visual Design Specifications"
- ASCII mockups show layout
- Typography/spacing/color tables show exact values

---

## Pre-Flight Validation Mistakes

### 10. 🔴 Skipping Validation Script

**Problem:** Starting Task 1 without running validation leads to missing dependencies, config errors, file conflicts.

**Wrong:**
```bash
# ❌ Starting immediately
# "Let's create lib/types/market-rates.ts..."
# (may fail due to missing @jest/globals, wrong tsconfig, file conflicts)
```

**Correct:**
```bash
# ✅ Run validation FIRST
bash scripts/validate-market-opportunity-setup.sh

# If PASS: Proceed to Task 1
# If FAIL: Fix errors before continuing
```

**What validation checks:**
- @jest/globals installed (required for test imports)
- @playwright/test installed (required for E2E tests)
- TypeScript path alias configured (`@/` → `./`)
- Jest environment configured (jsdom for components)
- RefinanceOutlookSidebar file state (tracked vs untracked)
- Tier 1 files exist (instant-profile.ts, ProgressiveFormWithController.tsx)
- CANONICAL_REFERENCES.md accessible

---

## Quick Recovery Commands

**If you made a mistake:**

```bash
# Percentage/decimal error:
# Check all calculateInterestSavings calls use percentageToDecimal()
grep -n "calculateInterestSavings" lib/calculations/refinance-savings.ts

# Wrong test location:
# Move test to correct location
git mv tests/components/MarketRateDisplay.test.tsx \
  components/forms/instant-analysis/__tests__/MarketRateDisplay.test.tsx

# Missing import:
# Add to top of refinance-savings.ts:
# import type { MarketRateSnapshot } from '../types/market-rates';

# Uncommitted RefinanceOutlookSidebar:
git status components/forms/instant-analysis/RefinanceOutlookSidebar.tsx
git add components/forms/instant-analysis/RefinanceOutlookSidebar.tsx
git commit -m "feat: baseline RefinanceOutlookSidebar before redesign"
```

---

## Summary: Pre-Flight, Mid-Flight, Post-Flight

**BEFORE starting (Pre-Flight):**
1. Run `bash scripts/validate-market-opportunity-setup.sh`
2. Read implementation guide sections: Rate Conversion, Visual Design, Common Pitfalls
3. Check git status of RefinanceOutlookSidebar.tsx

**DURING implementation (Mid-Flight):**
1. Always use `percentageToDecimal()` helper for rate conversions
2. Create child components (Tasks 5, 6, 9) BEFORE parent (Task 7)
3. Place tests in `__tests__/` subfolder next to component
4. Use exact legal disclaimer copy
5. Follow ASCII mockups for layout/spacing/colors

**AFTER implementation (Post-Flight):**
1. Run all tests: `npm test`
2. Run E2E test: `npm run test:e2e`
3. Verify no "will save" language in UI
4. Check all imports resolve (no TypeScript errors)
5. Commit frequently (10 commits total, 1 per task)

---

## Questions?

If stuck:
1. Check implementation guide: `docs/runbooks/forms/refinance-market-opportunity-implementation-guide.md`
2. Check this common mistakes file (you are here)
3. Run validation script: `bash scripts/validate-market-opportunity-setup.sh`
4. Search CANONICAL_REFERENCES.md: `grep -i "search term" CANONICAL_REFERENCES.md`
5. Ask Brent (don't guess on Tier 1 file changes)
