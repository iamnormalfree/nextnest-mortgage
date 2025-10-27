# Refinance Market Opportunity UI - Implementation Guide

**Purpose:** Detailed implementation guide for redesigning Step 2 refinance calculations to show market opportunity landscape instead of false-precision monthly payment savings.

**Target Audience:** Engineers implementing the plan in `docs/plans/active/2025-10-27-step2-refinance-market-opportunity-ui.md`

**Last Updated:** 2025-10-27

---

## Architecture Overview

### Current Problem
Step 2 shows "$41/mo savings" without knowing loan tenure or target package, creating false precision. Users don't understand basis for calculation.

### Solution Approach
Replace monthly payment display with:
1. **Market rate landscape** - Fixed/floating/hybrid ranges with bank counts
2. **Interest savings** - 2-3 year windows using simple interest (conservative)
3. **Market context** - SORA benchmarks, update timestamps
4. **Excitement-first UX** - "Could save" not "will save", multiple package options

### Design Principles
- **YAGNI:** Use placeholder data now, build for future automation
- **DRY:** Share calculation logic between scenarios
- **TDD:** Write test → Implement → Commit
- **Conservative:** Round savings DOWN, use MIN rates for displays

### Critical: Rate Conversion Pattern

**IMPORTANT:** Market rates are stored as PERCENTAGES (e.g., 2.15 means 2.15%), but calculations use DECIMALS (e.g., 0.0215).

**Always use this helper function:**

```typescript
/**
 * Converts percentage rate to decimal for calculations.
 * @param rate - Rate as percentage (e.g., 2.15 for 2.15%)
 * @returns Rate as decimal (e.g., 0.0215)
 */
function percentageToDecimal(rate: number): number {
  return rate / 100;
}

// Usage:
const rateAsPercentage = 2.15; // From MarketRateSnapshot
const rateAsDecimal = percentageToDecimal(rateAsPercentage); // 0.0215
calculateInterestSavings(400000, 0.03, rateAsDecimal, 2); // ✅ Correct
```

**Common mistake:** Mixing percentages and decimals leads to 100x calculation errors.

---

## Key Files and Patterns

### Tier 1 Files (Check CANONICAL_REFERENCES.md Before Modifying)

**`lib/calculations/instant-profile.ts`** (lines 613-821)
- Contains `calculateRefinanceOutlook()` function
- **Rule:** Do NOT change rounding strategy without Dr Elena v2 approval
- **Pattern:** All calculations use helper functions: `roundLoanEligibility()`, `roundMonthlyPayment()`

**`components/forms/ProgressiveFormWithController.tsx`** (lines 318-358)
- Contains calculation trigger using `useMemo()` hook
- **Rule:** Do NOT change step progression logic
- **Pattern:** Uses `useWatch()` to detect form field changes

**`components/forms/instant-analysis/RefinanceOutlookSidebar.tsx`** (lines 13-65)
- Current display component (will be refactored)
- **Pattern:** Shows loading state when data unavailable

### Existing Patterns to Follow

**Calculation Functions** (see `lib/calculations/instant-profile.ts:110-425`)
```typescript
// Pattern: Export interface, implement function, export helpers
export interface CalculationInput { /* fields */ }
export interface CalculationResult { /* fields */ }

export function calculateSomething(input: CalculationInput): CalculationResult {
  // Validate inputs
  // Perform calculation
  // Apply rounding rules
  // Return structured result
}

// Helper for rounding
function roundHelper(value: number): number {
  return Math.floor(value / 1000) * 1000; // Example
}
```

**Component Pattern** (see `components/forms/instant-analysis/InstantAnalysisSidebar.tsx`)
```tsx
// Pattern: Props interface, loading state, structured display
interface ComponentProps {
  data: SomeType | null;
  isLoading: boolean;
}

export function Component({ data, isLoading }: ComponentProps) {
  if (isLoading || !data) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      <Section1 />
      <Section2 />
    </div>
  );
}
```

---

## Implementation Details by Task

### Task 1: Market Rate Data Structure

**File:** `lib/types/market-rates.ts` (create new)

```typescript
// ABOUTME: TypeScript interfaces for market rate snapshots (fixed/floating/hybrid packages)
// ABOUTME: Used by refinance calculation and display components

/**
 * Snapshot of market mortgage rates at a point in time.
 * Updated daily via cron job (future) or manual updates (current).
 */
export interface MarketRateSnapshot {
  /** ISO 8601 timestamp when rates were last updated */
  updated_at: string;

  /** Fixed-rate mortgage packages */
  fixed_packages: {
    two_year: RateRange;
    three_year: RateRange;
    five_year: RateRange;
  };

  /** Floating-rate packages (SORA-based) */
  floating_packages: {
    three_month_sora: RateRange;
    one_month_sora: RateRange;
  };

  /** Hybrid packages (fixed period then floating) */
  hybrid_packages: {
    two_year_fixed_then_floating: RateRange;
  };

  /** Current SORA benchmark rates */
  sora_benchmarks: {
    three_month: number; // Current 3M SORA %
    one_month: number;   // Current 1M SORA %
  };
}

/**
 * Rate range with min/max and bank count for competition signal
 */
export interface RateRange {
  min: number;        // Minimum rate % (e.g., 2.15)
  max: number;        // Maximum rate % (e.g., 2.45)
  bank_count: number; // Number of banks offering in this range
}

/**
 * Returns placeholder market rates for development.
 * TODO: Replace with API call in Phase 3 (cron job automation).
 */
export function getPlaceholderRates(): MarketRateSnapshot {
  return {
    updated_at: new Date().toISOString(),
    fixed_packages: {
      two_year: { min: 2.15, max: 2.45, bank_count: 8 },
      three_year: { min: 2.35, max: 2.65, bank_count: 12 },
      five_year: { min: 2.65, max: 2.95, bank_count: 7 },
    },
    floating_packages: {
      three_month_sora: { min: 2.60, max: 2.85, bank_count: 15 },
      one_month_sora: { min: 2.55, max: 2.80, bank_count: 9 },
    },
    hybrid_packages: {
      two_year_fixed_then_floating: { min: 2.20, max: 2.50, bank_count: 10 },
    },
    sora_benchmarks: {
      three_month: 1.39,
      one_month: 1.29,
    },
  };
}
```

**Test File:** `tests/types/market-rates.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { getPlaceholderRates, type MarketRateSnapshot } from '@/lib/types/market-rates';

describe('MarketRateSnapshot', () => {
  it('should return valid structure from placeholder', () => {
    const rates = getPlaceholderRates();

    expect(rates).toHaveProperty('updated_at');
    expect(rates).toHaveProperty('fixed_packages');
    expect(rates).toHaveProperty('floating_packages');
    expect(rates).toHaveProperty('sora_benchmarks');
  });

  it('should have valid rate ranges', () => {
    const rates = getPlaceholderRates();

    expect(rates.fixed_packages.two_year.min).toBeGreaterThan(0);
    expect(rates.fixed_packages.two_year.min).toBeLessThan(rates.fixed_packages.two_year.max);
    expect(rates.fixed_packages.two_year.bank_count).toBeGreaterThan(0);
  });

  it('should have valid ISO timestamp', () => {
    const rates = getPlaceholderRates();

    expect(() => new Date(rates.updated_at)).not.toThrow();
    expect(new Date(rates.updated_at).toISOString()).toBe(rates.updated_at);
  });

  it('should have SORA benchmarks between 0-10%', () => {
    const rates = getPlaceholderRates();

    expect(rates.sora_benchmarks.one_month).toBeGreaterThanOrEqual(0);
    expect(rates.sora_benchmarks.one_month).toBeLessThanOrEqual(10);
    expect(rates.sora_benchmarks.three_month).toBeGreaterThanOrEqual(0);
    expect(rates.sora_benchmarks.three_month).toBeLessThanOrEqual(10);
  });
});
```

---

### Task 2: Interest Savings Calculator

**File:** `lib/calculations/refinance-savings.ts` (create new)

```typescript
// ABOUTME: Calculates interest savings for refinance scenarios using simple interest (conservative)
// ABOUTME: Used by Step 2 refinance form to show potential savings over 2-3 year windows

/**
 * Calculates interest savings using simple interest formula (conservative estimate).
 *
 * Formula:
 * - Current interest = outstanding × currentRate × years
 * - New interest = outstanding × targetRate × years
 * - Savings = current - new (clamped to 0 minimum)
 *
 * Why simple interest:
 * - Conservative (actual savings higher with amortization)
 * - Easy to explain to users
 * - No need to know exact tenure
 *
 * @param outstandingLoan - Current loan balance
 * @param currentRate - Current interest rate as decimal (e.g., 0.03 for 3%)
 * @param targetRate - Target refinance rate as decimal
 * @param years - Time window for savings calculation (typically 2-3)
 * @returns Interest savings breakdown
 */
export function calculateInterestSavings(
  outstandingLoan: number,
  currentRate: number,
  targetRate: number,
  years: number
): InterestSavingsResult {
  // Validate inputs
  if (outstandingLoan <= 0 || years <= 0) {
    return { savings: 0, currentInterest: 0, newInterest: 0 };
  }

  // Simple interest calculation
  const currentInterest = outstandingLoan * currentRate * years;
  const newInterest = outstandingLoan * targetRate * years;

  // Calculate savings (clamp to 0 if negative)
  const rawSavings = currentInterest - newInterest;
  const savings = Math.max(0, rawSavings);

  // Round savings DOWN to nearest $100 (conservative, per Dr Elena v2)
  const roundedSavings = Math.floor(savings / 100) * 100;

  return {
    savings: roundedSavings,
    currentInterest: Math.round(currentInterest),
    newInterest: Math.round(newInterest),
  };
}

export interface InterestSavingsResult {
  /** Total interest savings over period (rounded down to $100) */
  savings: number;
  /** Interest paid at current rate */
  currentInterest: number;
  /** Interest paid at new rate */
  newInterest: number;
}
```

**Test File:** `tests/calculations/refinance-savings.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { calculateInterestSavings } from '@/lib/calculations/refinance-savings';

describe('calculateInterestSavings', () => {
  it('should calculate 2-year savings correctly', () => {
    const result = calculateInterestSavings(400000, 0.03, 0.0215, 2);

    // Current: 400k × 3% × 2 = $24,000
    // New: 400k × 2.15% × 2 = $17,200
    // Savings: $6,800
    expect(result.savings).toBe(6800);
    expect(result.currentInterest).toBe(24000);
    expect(result.newInterest).toBe(17200);
  });

  it('should calculate 3-year savings correctly', () => {
    const result = calculateInterestSavings(400000, 0.03, 0.0215, 3);

    // Current: 400k × 3% × 3 = $36,000
    // New: 400k × 2.15% × 3 = $25,800
    // Savings: $10,200
    expect(result.savings).toBe(10200);
  });

  it('should return zero for zero outstanding loan', () => {
    const result = calculateInterestSavings(0, 0.03, 0.0215, 2);

    expect(result.savings).toBe(0);
    expect(result.currentInterest).toBe(0);
    expect(result.newInterest).toBe(0);
  });

  it('should clamp negative savings to zero', () => {
    // Target rate HIGHER than current (no benefit to refinance)
    const result = calculateInterestSavings(400000, 0.02, 0.03, 2);

    expect(result.savings).toBe(0);
  });

  it('should round savings down to nearest $100', () => {
    // Create scenario that results in $6,850 raw savings
    const result = calculateInterestSavings(400000, 0.030625, 0.0215, 2);

    // Should round $6,850 → $6,800
    expect(result.savings).toBe(6800);
  });
});
```

---

### Task 3: Multi-Scenario Comparison

**Add to:** `lib/calculations/refinance-savings.ts`

```typescript
// Add import at top of file:
import type { MarketRateSnapshot } from '../types/market-rates';

/**
 * Converts percentage rate to decimal for calculations.
 * @param rate - Rate as percentage (e.g., 2.15 for 2.15%)
 * @returns Rate as decimal (e.g., 0.0215)
 */
function percentageToDecimal(rate: number): number {
  return rate / 100;
}

/**
 * Savings scenario for a specific package type
 */
export interface SavingsScenario {
  /** Package type label (e.g., "2-Year Fixed", "Floating SORA") */
  packageType: string;
  /** Target rate for this scenario (decimal) */
  rate: number;
  /** Savings over 2 years */
  savingsTwoYear: number;
  /** Savings over 3 years */
  savingsThreeYear: number;
}

/**
 * Generates savings scenarios for multiple package types.
 * Uses MIN rate from each package range (most attractive to user).
 *
 * @param outstandingLoan - Current loan balance
 * @param currentRate - Current rate as decimal
 * @param marketRates - Market rate snapshot
 * @returns Array of scenarios sorted by 2-year savings (best first)
 */
export function generateSavingsScenarios(
  outstandingLoan: number,
  currentRate: number,
  marketRates: MarketRateSnapshot
): SavingsScenario[] {
  const scenarios: SavingsScenario[] = [];

  // 2-Year Fixed scenario
  const twoYearRate = percentageToDecimal(marketRates.fixed_packages.two_year.min);
  const twoYearFixed = calculateInterestSavings(outstandingLoan, currentRate, twoYearRate, 2);
  scenarios.push({
    packageType: '2-Year Fixed',
    rate: marketRates.fixed_packages.two_year.min,
    savingsTwoYear: twoYearFixed.savings,
    savingsThreeYear: calculateInterestSavings(outstandingLoan, currentRate, twoYearRate, 3).savings,
  });

  // 3-Year Fixed scenario
  const threeYearRate = percentageToDecimal(marketRates.fixed_packages.three_year.min);
  const threeYearFixed = calculateInterestSavings(outstandingLoan, currentRate, threeYearRate, 2);
  scenarios.push({
    packageType: '3-Year Fixed',
    rate: marketRates.fixed_packages.three_year.min,
    savingsTwoYear: threeYearFixed.savings,
    savingsThreeYear: calculateInterestSavings(outstandingLoan, currentRate, threeYearRate, 3).savings,
  });

  // Floating SORA scenario
  const floatingRate = percentageToDecimal(marketRates.floating_packages.three_month_sora.min);
  const floatingRateCalc = calculateInterestSavings(outstandingLoan, currentRate, floatingRate, 2);
  scenarios.push({
    packageType: 'Floating SORA',
    rate: marketRates.floating_packages.three_month_sora.min,
    savingsTwoYear: floatingRateCalc.savings,
    savingsThreeYear: calculateInterestSavings(outstandingLoan, currentRate, floatingRate, 3).savings,
  });

  // Sort by 2-year savings descending (best first)
  return scenarios.sort((a, b) => b.savingsTwoYear - a.savingsTwoYear);
}
```

**Add to test file:**

```typescript
describe('generateSavingsScenarios', () => {
  it('should generate 3 scenarios', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    expect(scenarios).toHaveLength(3);
    expect(scenarios[0]).toHaveProperty('packageType');
    expect(scenarios[0]).toHaveProperty('rate');
    expect(scenarios[0]).toHaveProperty('savingsTwoYear');
    expect(scenarios[0]).toHaveProperty('savingsThreeYear');
  });

  it('should use MIN rates for all scenarios', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    const twoYearScenario = scenarios.find(s => s.packageType === '2-Year Fixed');
    expect(twoYearScenario?.rate).toBe(marketRates.fixed_packages.two_year.min);
  });

  it('should sort scenarios by 2-year savings descending', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i - 1].savingsTwoYear).toBeGreaterThanOrEqual(
        scenarios[i].savingsTwoYear
      );
    }
  });

  it('should have non-negative savings', () => {
    const marketRates = getPlaceholderRates();
    const scenarios = generateSavingsScenarios(400000, 0.03, marketRates);

    scenarios.forEach(s => {
      expect(s.savingsTwoYear).toBeGreaterThanOrEqual(0);
      expect(s.savingsThreeYear).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

### Task 4: Update RefinanceOutlookResult Interface

**File:** `lib/calculations/instant-profile.ts` (lines 98-108)

**Change:**
```typescript
// Add import at top
import type { SavingsScenario } from './refinance-savings';

// Update interface (around line 98)
export interface RefinanceOutlookResult {
  projectedMonthlySavings?: number;
  currentMonthlyPayment?: number;
  maxCashOut: number;
  timingGuidance: string;
  recommendations: string[];
  reasonCodes: string[];
  policyRefs: string[];
  ltvCapApplied: number;
  cpfRedemptionAmount: number;

  // NEW: Add this field
  savingsScenarios?: SavingsScenario[];  // Multi-package interest savings
}
```

**Update function signature (around line 613):**
```typescript
export function calculateRefinanceOutlook(
  inputs: RefinanceOutlookInput,
  options?: {
    includeSavingsScenarios?: boolean;
    marketRates?: MarketRateSnapshot;
  }
): RefinanceOutlookResult
```

**Add to function body (before return statement, around line 815):**
```typescript
// Generate savings scenarios if requested
let savingsScenarios: SavingsScenario[] | undefined;
if (options?.includeSavingsScenarios && options?.marketRates && property_value) {
  savingsScenarios = generateSavingsScenarios(
    effectiveBalance,
    effectiveCurrentRate / 100,
    options.marketRates
  );
}

return {
  // ... existing fields
  savingsScenarios,
};
```

**Update test file:** `tests/calculations/instant-profile.test.ts`

Add new test case:
```typescript
it('should include savings scenarios when requested', () => {
  const input: RefinanceOutlookInput = {
    property_value: 900000,
    outstanding_loan: 400000,
    current_rate: 3.0,
    property_type: 'Private',
  };

  const marketRates = getPlaceholderRates();
  const result = calculateRefinanceOutlook(input, {
    includeSavingsScenarios: true,
    marketRates,
  });

  expect(result.savingsScenarios).toBeDefined();
  expect(result.savingsScenarios).toHaveLength(3);
});

it('should maintain backward compatibility without options', () => {
  const input: RefinanceOutlookInput = {
    property_value: 900000,
    outstanding_loan: 400000,
    current_rate: 3.0,
  };

  const result = calculateRefinanceOutlook(input);

  expect(result.savingsScenarios).toBeUndefined();
  expect(result.maxCashOut).toBeDefined(); // Existing fields still work
});
```

---

## Visual Design Specifications

### Component Dependency Tree

```
RefinanceOutlookSidebar (parent container)
  ├─ MarketRateDisplay (rate ranges + bank counts)
  ├─ SavingsDisplay (2yr/3yr savings scenarios)
  └─ MarketContextWidget (SORA benchmarks + timestamp)
```

**Implementation Order (follows dependency tree):**
1. Task 5: Create `MarketRateDisplay` (no dependencies)
2. Task 6: Create `SavingsDisplay` (no dependencies)
3. Task 9: Create `MarketContextWidget` (no dependencies)
4. Task 7: Refactor `RefinanceOutlookSidebar` (imports all 3 above)

**Import example for Task 7:**
```typescript
// components/forms/instant-analysis/RefinanceOutlookSidebar.tsx
import { MarketRateDisplay } from './MarketRateDisplay';
import { SavingsDisplay } from './SavingsDisplay';
import { MarketContextWidget } from './MarketContextWidget';
```

### MarketRateDisplay Layout

```
┌──────────────────────────────────────────┐
│ Market Snapshot                          │
│ Updated: Today                           │
├──────────────────────────────────────────┤
│                                          │
│ 2-Year Fixed                             │
│ 2.15% - 2.45%    8 banks offering   🟢  │
│                                          │
│ 3-Year Fixed                             │
│ 2.35% - 2.65%    12 banks offering  🟢  │
│                                          │
│ Floating SORA (3M)                       │
│ 2.60% - 2.85%    15 banks offering  🔴  │
│                                          │
│ ──────────────────────────────────────   │
│                                          │
│ Your Current Rate: 3.00% 🔴              │
└──────────────────────────────────────────┘
```

**Color Logic:**
- Rate < current: 🟢 Green indicator `text-nn-green`
- Rate >= current: 🔴 Red indicator `text-nn-red`

**Spacing & Typography:**
- Container: `border border-[#E5E5E5] bg-[#F8F8F8] p-4`
- Between sections: `space-y-3`
- Header: `text-sm font-semibold text-black`
- Rate range: `text-lg font-bold text-black`
- Bank count: `text-xs text-[#666666]`
- Indicator: `text-xl` (emoji or icon)

### SavingsDisplay Layout

```
┌──────────────────────────────────────────┐
│ Potential Savings                        │
├──────────────────────────────────────────┤
│                                          │
│ Best Rate: 2.15% (2-Year Fixed)          │
│                                          │
│ ~$6,800 over 2 years                     │
│ ~$10,200 over 3 years                    │
│                                          │
│ ──────────────────────────────────────   │
│                                          │
│ ℹ️ Estimated savings based on market    │
│   rates as of 27 Oct 2025. Actual       │
│   savings depend on your approved        │
│   package, loan tenure, and fees.        │
│   This is not a guarantee.               │
└──────────────────────────────────────────┘
```

**Legal Disclaimer (EXACT TEXT - Required for Compliance):**

```
Estimated savings based on market rates as of {date}. Actual savings depend on your approved package, loan tenure, and fees. This is not a guarantee. Terms apply.
```

**Copy Rules:**
- Use "~" prefix for all dollar amounts (shows approximation)
- Use "could save" not "will save" in any descriptive text
- Always include disclaimer at bottom of component
- Use "potential", "estimated", or "approximate" language

**Styling:**
- Savings amounts: `text-2xl font-bold text-nn-gold`
- Period labels: `text-sm text-[#666666]`
- Disclaimer: `text-xs text-[#666666] italic`
- Disclaimer icon: `text-nn-blue`

### MarketContextWidget Layout

```
┌──────────────────────────────────────────┐
│ SORA Benchmarks                          │
├──────────────────────────────────────────┤
│ 1-Month: 1.29%    3-Month: 1.39%         │
│                                          │
│ Last updated: Today at 6:00 AM           │
└──────────────────────────────────────────┘
```

**Date Formatting:**
- Same day: "Today at {time}"
- Yesterday: "Yesterday at {time}"
- This week: "{Weekday} at {time}"
- Older: "{DD MMM YYYY}"

---

### Task 5-9: Component Implementation

**Component Pattern:** All display components follow same structure:

```tsx
// Component file structure
interface ComponentProps {
  // Props defined here
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Handle loading/error states first
  if (isLoading) return <LoadingPlaceholder />;
  if (!data) return <EmptyState />;

  // Main render
  return (
    <div className="space-y-4">
      {/* Content here */}
    </div>
  );
}
```

**Tailwind Styling Rules:**
- Use existing color tokens from `tailwind.config.ts`
- Match form component spacing: `space-y-4`, `p-4`, `mb-4`
- Text sizes: `text-sm` for body, `text-xs` for labels, `text-lg` for emphasis
- Colors: `text-black` for primary, `text-[#666666]` for secondary
- Borders: `border border-[#E5E5E5]`

**Number Formatting:**
```typescript
// Use Intl.NumberFormat for consistency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatRate = (value: number) => {
  return `${value.toFixed(2)}%`;
};
```

---

## Testing Patterns

### Unit Test Pattern
```typescript
describe('FunctionName', () => {
  // Happy path tests
  it('should calculate correctly with valid inputs', () => {
    const result = functionName(validInput);
    expect(result).toBe(expectedOutput);
  });

  // Edge cases
  it('should handle zero values', () => { /* ... */ });
  it('should handle negative values', () => { /* ... */ });
  it('should handle undefined values', () => { /* ... */ });

  // Business logic
  it('should apply conservative rounding', () => { /* ... */ });
  it('should match Dr Elena v2 requirements', () => { /* ... */ });
});
```

### Component Test Pattern
```typescript
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render with valid data', () => {
    render(<ComponentName data={validData} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ComponentName isLoading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should format numbers correctly', () => {
    render(<ComponentName data={{ amount: 6800 }} />);
    expect(screen.getByText('$6,800')).toBeInTheDocument();
  });
});
```

### E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test('refinance market opportunity flow', async ({ page }) => {
  // Navigate
  await page.goto('/apply?loanType=refinance');

  // Fill Step 1
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button:has-text("Continue")');

  // Fill Step 2 fields
  await page.selectOption('[name="propertyType"]', 'HDB Flat');
  await page.fill('[name="currentRate"]', '3');
  await page.fill('[name="outstandingLoan"]', '400000');

  // Verify sidebar appears
  await expect(page.locator('text=Market Snapshot')).toBeVisible();
  await expect(page.locator('text=2-Year Fixed')).toBeVisible();

  // Verify savings display
  await expect(page.locator('text=/\\$6,800/')).toBeVisible();

  // Verify "could save" copy (not "will save")
  await expect(page.locator('text=/could save/i')).toBeVisible();
  await expect(page.locator('text=/will save/i')).not.toBeVisible();
});
```

---

## Pre-Flight Validation

**REQUIRED: Run validation script before starting implementation:**

```bash
bash scripts/validate-market-opportunity-setup.sh
```

This validates:
- Test dependencies (@jest/globals, @playwright/test)
- TypeScript configuration (path aliases)
- Jest environment setup
- File states (committed vs untracked)
- Tier 1 canonical files exist
- CANONICAL_REFERENCES.md accessibility

**If validation fails, fix errors before proceeding with Task 1.**

---

## Common Pitfalls

1. **Mixing percentages and decimals (CRITICAL - causes 100x calculation errors)**
   - ❌ BAD: `calculateInterestSavings(400000, 0.03, marketRates.fixed_packages.two_year.min, 2)`
     - This treats 2.15 as 2.15 (215%) instead of 2.15% (0.0215)
   - ✅ GOOD: `calculateInterestSavings(400000, 0.03, percentageToDecimal(marketRates.fixed_packages.two_year.min), 2)`
   - **Solution:** Always use `percentageToDecimal()` helper function (see "Critical: Rate Conversion Pattern" above)

2. **Using amortization instead of simple interest**
   - Stick to simple interest for now (conservative, no tenure needed)
   - Amortization requires tenure - we don't have that at Step 2

3. **Showing "will save" instead of "could save"**
   - Always use hedging language ("could", "potential", "estimated", "~")
   - Use EXACT legal disclaimer (see "Legal Disclaimer" in Visual Design Specifications)
   - Never guarantee savings amounts

4. **Forgetting to round DOWN**
   - Savings must round DOWN (conservative per Dr Elena v2)
   - Use `Math.floor(value / 100) * 100` for $100 rounding

5. **Modifying Tier 1 files without tests**
   - Always write tests FIRST for instant-profile.ts changes
   - Check CANONICAL_REFERENCES.md rules before modifying
   - Run `grep -n "instant-profile" CANONICAL_REFERENCES.md` to find current line numbers

6. **Creating components without loading states**
   - Every component needs loading/empty state handling
   - Match existing pattern in InstantAnalysisSidebar.tsx

7. **Hardcoding rates instead of using placeholder function**
   - Always use `getPlaceholderRates()` function
   - Never hardcode 2.15, 2.45, etc. directly in components

8. **Wrong test file placement**
   - ❌ BAD: `tests/components/MarketRateDisplay.test.tsx` (centralized)
   - ✅ GOOD: `components/forms/instant-analysis/__tests__/MarketRateDisplay.test.tsx` (co-located)
   - Rule: Component tests co-locate in `__tests__/` subfolder (see CANONICAL_REFERENCES.md line 620)

9. **Missing imports causing TypeScript errors**
   - Always import `MarketRateSnapshot` from `'../types/market-rates'` in refinance-savings.ts
   - Check import paths match your file location (relative paths matter)

10. **Creating components in wrong order (circular dependency risk)**
    - Follow implementation order in Component Dependency Tree
    - Create leaf components (MarketRateDisplay, SavingsDisplay, MarketContextWidget) BEFORE parent (RefinanceOutlookSidebar)
    - Task order is designed to prevent circular dependencies

---

## Future Automation (Out of Scope)

When ready to implement automated rate updates:

1. **Data storage:** `data/market-rates/YYYY-MM-DD.json`
2. **API endpoint:** `/api/market-rates` returning latest snapshot
3. **Cron job:** Daily script at 6am SGT
4. **SORA scraping:** Ask Brent for Python script from other codebase
5. **Bank package parser:** Manual markdown → JSON for now

---

## Questions During Implementation

If you encounter issues:

1. **Type errors:** Check `CANONICAL_REFERENCES.md` for Tier 1 interface rules
2. **Test failures:** Review existing test patterns in `tests/calculations/`
3. **Styling issues:** Match existing form components in `components/forms/`
4. **Unclear requirements:** Check plan success criteria or ask Brent

**Good luck! Follow TDD, commit frequently, and refer back to this guide.**
