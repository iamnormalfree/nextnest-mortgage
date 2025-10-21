# Form Issues - Root Cause Analysis & Categorical Solutions

**Created:** 2025-10-19
**Context:** Analyzing roadmap plans and Dr. Elena v2 mortgage knowledge to solve categorical form issues
**Related Plans:**
- `docs/plans/active/2025-10-19-step2-instant-analysis-pure-ltv-calculation.md`
- `docs/plans/active/2025-10-30-progressive-form-experience-spec.md`
- `docs/plans/active/2025-10-30-dr-elena-audit-plan.md`

---

## Executive Summary

The current Step 2 instant analysis error (showing MSR-limited $454k instead of pure LTV $750k) reveals a **systemic pattern** of premature data assumptions across our progressive form. This document categorizes root causes and proposes architectural solutions to prevent similar issues.

**Core Problem:** We're applying **calculation complexity** at the **wrong form steps**, violating the principle that each step should only use data **actually collected up to that point**.

---

## Category 1: Premature Data Assumptions

### Current Issues

#### 1.1 Hardcoded Income Default (Step 2)
**Location:** `hooks/useProgressiveFormController.ts:342`
```typescript
const income = Math.max(parseNumber(formData.actualIncomes?.[0] ?? formData.monthlyIncome, 8000), 0)
```

**Problem:**
- Assumes $8,000 income before user provides any income data
- Causes MSR/TDSR limits to be applied incorrectly on Step 2
- Shows "Based on your income" messaging when we have NO income

**Impact:**
- HDB $1M → Shows $454k (MSR-limited) instead of $750k (75% LTV)
- Private $1.5M → Shows ~$375k instead of $1.125M
- **User confusion:** Instant analysis feels arbitrary and untrustworthy

#### 1.2 Multi-Step Calculation Function Misuse
**Location:** `lib/instant-profile.ts` - `calculateInstantProfile()`

**Problem:**
- Single function tries to handle both:
  - Step 2 analysis (should use ONLY property price, age, ownership count)
  - Step 3+ analysis (should use ACTUAL income, commitments, etc.)
- No clear separation of concerns

**Root Cause:** We're using a "kitchen sink" calculation function instead of **step-specific calculation strategies**.

### Dr. Elena v2 Knowledge Reveals

From `DR_ELENA_V2_CALCULATION_MATRIX.md`:

> **LTV Tiers:**
> - First property: 75% LTV
> - Second property: 45% LTV
> - Third+ property: 35% LTV
>
> **Age-based reductions:** Applied when tenure > 25y (HDB) or > 30y (non-HDB) OR loan end age > 65

**What this means:**
- Step 2 has EVERYTHING it needs for max loan calculation: property price, ownership count, age
- MSR/TDSR should ONLY appear in Step 3+ after income data collected
- We're conflating "what could you borrow" (LTV) with "what can you afford" (MSR/TDSR)

### Solution Pattern 1: Step-Aware Calculation Strategy

**Create separate calculation functions per form step:**

```typescript
// lib/calculations/step2-pure-ltv.ts
export function calculatePureLtvMaxLoan(params: {
  propertyPrice: number;
  existingProperties: number;
  age: number;
}): {
  maxLoanAmount: number;
  ltvPercentage: number;
  downPaymentRequired: number;
  maxTenure: number;
  reasonCodes: string[];
}

// lib/calculations/step3-compliance-snapshot.ts
export function calculateComplianceSnapshot(params: {
  propertyPrice: number;
  existingProperties: number;
  age: number;
  actualIncome: number;  // NOW we have this!
  commitments: number;
  propertyType: PropertyType;
}): {
  maxLoanAmount: number;  // Now MSR/TDSR constrained
  msrLimit: number | null;
  tdsrLimit: number;
  compliance: 'pass' | 'fail';
  // ... full compliance details
}
```

**Benefits:**
1. **Type safety:** Can't call Step 3 function without income data
2. **Clear contracts:** Each function documents exactly what data it needs
3. **Testability:** Each step's logic tested in isolation
4. **Maintainability:** Changes to Step 2 logic can't break Step 3

---

## Category 2: Calculation Complexity at Wrong Time

### Current Issues

#### 2.1 Step 2 Shows "Instant Analysis" (Misnomer)
**Problem:** The term "instant analysis" suggests comprehensive calculation, but Step 2 should show **LTV guidance**, not full affordability analysis.

**Messaging Issues:**
- "Based on your income" → We don't have income yet!
- "Maximum loan amount" → Which calculation? LTV? MSR? TDSR?
- User expects full analysis, gets partial/wrong result

#### 2.2 Progressive Disclosure Violation
From the roadmap and UX spec, our form philosophy:

> **Step 0:** Loan type
> **Step 1:** Who you are (contact)
> **Step 2:** What you need (property details)
> **Step 3:** Your finances (income, commitments)

**Progressive disclosure principle:** Each step should:
1. Collect MINIMAL data needed for next insight
2. Show insights using ONLY data collected so far
3. Set expectations for what's coming next

**Current violation:**
- Step 2 tries to answer "Can I afford this?" (requires Step 3 data)
- Should answer: "How much can I borrow based on property rules?" (pure LTV)

### Dr. Elena v2 Knowledge Reveals

From `DR_ELENA_V2_CALCULATION_MATRIX.md`:

> **TDSR**: `(Recognized_Income × 0.55) - Total_Commitments`
> **MSR**: `Recognized_Income × 0.30` (HDB/EC only)
> **Stress Test Rates**: 4.0% residential, 5.0% non-residential

**What this means:**
- TDSR/MSR are **affordability** calculations requiring income
- LTV is a **regulatory limit** based on property characteristics
- These are DIFFERENT questions answered at DIFFERENT form steps

### Solution Pattern 2: Staged Insight Delivery

**Step 2 - Property Feasibility:**
```
┌─────────────────────────────────────┐
│ Property Feasibility                │
├─────────────────────────────────────┤
│ Based on property price and LTV     │
│ limits for your situation:          │
│                                     │
│ Maximum Loan: $750,000              │
│ Down Payment: $250,000              │
│ Maximum Tenure: 25 years            │
│                                     │
│ ℹ️  This is based on LTV limits.   │
│    Next, we'll check what you can   │
│    afford based on your income.     │
└─────────────────────────────────────┘
```

**Step 3 - Affordability Analysis:**
```
┌─────────────────────────────────────┐
│ MAS Compliance Check                │
├─────────────────────────────────────┤
│ Based on your income and finances:  │
│                                     │
│ ✅ TDSR: Pass (45% used)            │
│ ✅ MSR: Pass (28% used)             │
│                                     │
│ Approved Loan: $750,000             │
│ Monthly Payment: $3,200             │
│                                     │
│ ℹ️  You can borrow the full LTV    │
│    amount. Ready to proceed?        │
└─────────────────────────────────────┘
```

**Benefits:**
1. **Clear expectations:** User knows Step 2 is preliminary
2. **Accurate insights:** Each step uses only available data
3. **Educational:** User learns LTV vs affordability distinction
4. **Trust building:** No confusing/contradictory numbers

---

## Category 3: State Management & Data Flow

### Current Issues

#### 3.1 Unclear Data Dependencies
**Problem:** Hard to trace which calculations depend on which form fields

**Example from current codebase:**
```typescript
// In useProgressiveFormController.ts
useEffect(() => {
  // This runs on ANY form change
  // Which fields actually matter for instant analysis?
  // What order should calculations run?
  calculateInstantProfile(formData)
}, [formData])
```

#### 3.2 Calculation Re-runs & Performance
**Problem:** Every form field change triggers full recalculation, even if field isn't relevant

**Example:**
- User types name in Step 1 → Triggers instant profile calculation (wasteful)
- User changes email → Recalculates LTV (unnecessary)

### Solution Pattern 3: Dependency-Aware Calculations

**Create explicit dependency mappings:**

```typescript
// lib/calculations/dependencies.ts
export const CALCULATION_DEPENDENCIES = {
  pureLtvMaxLoan: [
    'propertyPrice',
    'existingProperties',
    'age'
  ],
  complianceSnapshot: [
    'propertyPrice',
    'existingProperties',
    'age',
    'actualIncome',
    'commitments',
    'propertyType'
  ],
  refinanceOutlook: [
    'currentLoanBalance',
    'currentRate',
    'monthsRemaining',
    'refinanceObjective',
    // ... etc
  ]
} as const;

// In hook
const pureLtvResult = useMemo(() => {
  return calculatePureLtvMaxLoan({
    propertyPrice: formData.propertyPrice,
    existingProperties: formData.existingProperties,
    age: formData.age
  });
}, [
  formData.propertyPrice,
  formData.existingProperties,
  formData.age
  // ONLY these fields trigger recalc
]);
```

**Benefits:**
1. **Performance:** Only recalculate when relevant fields change
2. **Clarity:** Explicit dependencies in one place
3. **Testing:** Can verify dependencies are minimal/correct
4. **Debugging:** Easy to trace why calculation ran

---

## Category 4: Form Branching & Conditional Logic

### Current Issues

#### 4.1 New Purchase vs Refinance Paths
From the UX spec and roadmap:

> **Step 3 — New Purchase**: Income, liabilities, MAS preview
> **Step 3 — Refinance**: Income, current loan snapshot, objectives, timing

**Problem:** Different loan types need different fields and calculations, but current form treats them similarly.

#### 4.2 Property Type Specifics
From Dr. Elena v2:

> **MSR applies to:** HDB (concessionary + bank loan), EC (developer sale only)
> **CPF disallowed for:** Commercial properties
> **Cash-out allowed for:** Private properties only (post-TOP)

**Problem:** Current form doesn't enforce these property-specific rules at the right times.

### Solution Pattern 4: Type-Safe Form Branching

**Use discriminated unions for loan type specific state:**

```typescript
// lib/forms/form-state-types.ts
type NewPurchaseState = {
  loanType: 'new_purchase';
  propertyCategory: 'bto' | 'resale' | 'new_launch';
  // ... Step 2 fields

  // Step 3 fields
  income: number;
  liabilities: Liability[];
  // NO refinance fields
}

type RefinanceState = {
  loanType: 'refinance';
  propertyType: PropertyType;  // Must be known
  // ... Step 2 fields

  // Step 3 fields
  income: number;
  currentLoanBalance: number;
  refinanceObjective: 'lower_payment' | 'shorten_tenure' | 'rate_certainty';
  cashOutRequested?: number;  // Only if private property
  // NO new purchase specific fields
}

type FormState = NewPurchaseState | RefinanceState;

// Calculation functions can now be type-safe:
function calculateRefinanceOutlook(
  state: Extract<FormState, { loanType: 'refinance' }>
): RefinanceOutlook {
  // TypeScript guarantees refinance fields exist
  const { currentLoanBalance, refinanceObjective } = state;
  // ...
}
```

**Benefits:**
1. **Type safety:** Can't call refinance calculations with new purchase state
2. **Clarity:** Form structure matches domain model
3. **Validation:** Can't have invalid field combinations
4. **Code completion:** IDE suggests only valid fields for loan type

---

## Category 5: Testing & Validation Gaps

### Current Issues

#### 5.1 No Test Coverage for Step-Specific Logic
**Problem:** Current tests (per audit plan) validate FULL calculations but not step-by-step progression

**Missing test scenarios:**
- "Step 2 should NOT apply MSR/TDSR limits"
- "Step 2 calculation should ONLY depend on property price, age, ownership count"
- "Step 3 new purchase should require income before showing affordability"

#### 5.2 Dr. Elena v2 Scenario Coverage
From audit plan and calculation matrix, we have:

> **Persona test scenarios:** 6+ scenarios covering first-time buyer, second property, commercial, etc.

**Problem:** These test FULL calculations (correct), but we also need tests for PARTIAL calculations at each step.

### Solution Pattern 5: Step-Aware Test Strategy

**Add test suites for each form step:**

```typescript
// tests/calculations/step2-pure-ltv.test.ts
describe('Step 2 Pure LTV Calculations', () => {
  it('first property HDB $1M age 35 should show $750k', () => {
    const result = calculatePureLtvMaxLoan({
      propertyPrice: 1_000_000,
      existingProperties: 0,
      age: 35
    });

    expect(result.maxLoanAmount).toBe(750_000);
    expect(result.ltvPercentage).toBe(75);
    expect(result.reasonCodes).toContain('first_property_75_ltv');
    expect(result.reasonCodes).not.toContain('msr_limited'); // CRITICAL
    expect(result.reasonCodes).not.toContain('tdsr_limited');
  });

  it('should NOT require income parameter', () => {
    // Type-level test: this should compile
    calculatePureLtvMaxLoan({
      propertyPrice: 1_000_000,
      existingProperties: 0,
      age: 35
      // NO income field - intentional!
    });
  });
});

// tests/calculations/step3-compliance.test.ts
describe('Step 3 Compliance Calculations', () => {
  it('should apply MSR limits for HDB when income provided', () => {
    const result = calculateComplianceSnapshot({
      propertyPrice: 1_000_000,
      existingProperties: 0,
      age: 35,
      actualIncome: 8000, // NOW we have income
      commitments: 0,
      propertyType: 'HDB'
    });

    expect(result.msrLimit).toBeDefined();
    expect(result.msrLimit).toBeLessThan(result.maxLoanAmount);
    // ... etc
  });
});
```

**Benefits:**
1. **Regression prevention:** Can't accidentally add income to Step 2
2. **Documentation:** Tests show what each step should/shouldn't do
3. **Confidence:** Step 2 changes can't break Step 3 logic

---

## Category 6: User Experience & Messaging

### Current Issues

#### 6.1 Confusing Terminology
**Current terms:**
- "Instant Analysis" - Sounds comprehensive but is incomplete
- "Maximum Loan" - Which maximum? LTV? MSR? TDSR?
- "Based on your income" - When we don't have income yet

**User mental model confusion:**
- User sees $454k on Step 2
- Fills income on Step 3
- Expects number to go UP (more info = better results?)
- Number stays same or changes unpredictably
- User loses trust

#### 6.2 Missing Educational Context
From roadmap Phase 1.5 goals:

> **Content Foundation:**
> - MAS Notice 632 explainer (TDSR)
> - MAS Notice 645 explainer (MSR)
> - LTV limits guide

**Problem:** Form shows calculations without explaining WHY numbers are what they are.

### Solution Pattern 6: Educational Progressive Disclosure

**Step 2 - Set Clear Expectations:**
```
┌──────────────────────────────────────────┐
│ Property Purchase Analysis               │
├──────────────────────────────────────────┤
│ Based on Singapore banking regulations:  │
│                                          │
│ 🏦 Maximum Loan (LTV Limit)              │
│    $750,000                              │
│    └─ 75% of property price for first   │
│       property buyers                    │
│                                          │
│ 💰 Down Payment Required                 │
│    $250,000                              │
│    └─ Can use CPF + cash                │
│                                          │
│ 📅 Maximum Loan Tenure                   │
│    25 years                              │
│    └─ Based on your age (35)            │
│                                          │
│ ⏭️  Next: We'll check your income to    │
│    confirm you can afford this amount    │
└──────────────────────────────────────────┘
```

**Step 3 - Show Affordability vs Eligibility:**
```
┌──────────────────────────────────────────┐
│ Income & Affordability Check             │
├──────────────────────────────────────────┤
│ Property Eligibility (from Step 2)       │
│ └─ $750,000 maximum based on LTV rules   │
│                                          │
│ Your Affordability (Step 3 analysis)     │
│ ├─ TDSR Check: ✅ Pass                   │
│ │  └─ 45% of income used                │
│ └─ MSR Check: ✅ Pass                    │
│    └─ 28% of income used                │
│                                          │
│ 🎉 Final Approved Loan: $750,000         │
│    You can borrow the full LTV amount!   │
│                                          │
│ 📊 Monthly Payment: $3,200               │
│    └─ Based on 25-year tenure at 3.5%   │
└──────────────────────────────────────────┘
```

**Benefits:**
1. **Transparency:** User knows where each number comes from
2. **Education:** User learns mortgage concepts naturally
3. **Trust:** No mysterious number changes
4. **Progression:** Clear "unlocking" of more accurate analysis

---

## Category 7: Architecture & Code Organization

### Current Issues

#### 7.1 Monolithic Calculation Files
**Current structure (from CANONICAL_REFERENCES):**
- `lib/instant-profile.ts` - 800+ lines, handles everything
- `hooks/useProgressiveFormController.ts` - 1,500+ lines, complex state management

**Problems:**
- Hard to find relevant calculation logic
- Changes to one calculation can break others
- Difficult to test in isolation
- No clear ownership of each calculation

#### 7.2 Mixed Concerns in Components
**Current pattern:**
```typescript
// ProgressiveFormWithController.tsx (1,517 lines)
function ProgressiveFormWithController() {
  // Renders form UI
  // Manages form state
  // Runs calculations
  // Handles validation
  // Manages step transitions
  // Handles analytics
  // ... everything!
}
```

### Solution Pattern 7: Calculation Module Architecture

**Proposed structure:**
```
lib/calculations/
├── index.ts                 # Public API exports
├── types.ts                 # Shared calculation types
├── constants.ts             # Dr. Elena v2 constants
│
├── step2/
│   ├── pure-ltv.ts         # Pure LTV calculations
│   ├── tenure-limits.ts    # Age-based tenure
│   └── down-payment.ts     # CPF vs cash breakdown
│
├── step3/
│   ├── new-purchase/
│   │   ├── msr-check.ts    # MSR calculations
│   │   ├── tdsr-check.ts   # TDSR calculations
│   │   └── compliance.ts   # Combined MAS compliance
│   └── refinance/
│       ├── outlook.ts      # Refinance scenarios
│       ├── timing.ts       # Timing guidance
│       └── cashout.ts      # Equity calculations
│
└── utils/
    ├── rounding.ts         # Dr. Elena rounding rules
    ├── income.ts           # Income recognition rates
    └── commitments.ts      # Liability calculations
```

**Each module exports:**
```typescript
// Pure function with clear inputs/outputs
export function calculateX(params: XParams): XResult {
  // Uses ONLY params (no global state)
  // Returns deterministic result
  // Includes reason codes for UI
}

// Type definitions
export type XParams = { ... }
export type XResult = { ... }

// Constants from Dr. Elena v2
export const X_CONSTANTS = { ... }
```

**Benefits:**
1. **Modularity:** Each calculation is self-contained
2. **Testability:** Easy to test each calculation in isolation
3. **Discoverability:** Clear where each calculation lives
4. **Maintainability:** Changes are localized
5. **Documentation:** Each module documents its persona source

---

## Prevention Strategies

### Strategy 1: Pre-Implementation Checklist

**Before adding ANY new calculation to the form:**

- [ ] **Step Identification:** Which form step will show this calculation?
- [ ] **Data Availability:** What data is collected by that step?
- [ ] **Dependency Mapping:** List ONLY fields this calculation needs
- [ ] **Type Safety:** Can TypeScript prevent using unavailable data?
- [ ] **Persona Alignment:** Which Dr. Elena v2 section defines this calculation?
- [ ] **Test Coverage:** Write failing test for step-specific behavior
- [ ] **Messaging:** How will UI explain where this number comes from?

### Strategy 2: Calculation Review Process

**Code review checklist:**

```typescript
// For ANY new calculation function:

// ✅ Has explicit parameter types (not "any")
// ✅ Doesn't access form state directly (no `formData.field`)
// ✅ Returns typed result with reason codes
// ✅ Has unit tests with Dr. Elena scenarios
// ✅ Documented which form step uses it
// ✅ No premature data assumptions (hardcoded defaults)
// ✅ Clear error messages if data missing

function calculateSomething(
  params: SomethingParams  // ✅ Explicit type
): SomethingResult {       // ✅ Explicit return
  // ✅ Uses only params
  const result = doCalculation(params);

  return {
    value: result,
    reasonCodes: ['why'],  // ✅ Reason codes
    policyRefs: ['MAS Notice X']
  };
}
```

### Strategy 3: Form Step Contracts

**Formalize what each step "promises":**

```typescript
// lib/forms/step-contracts.ts
export const STEP_CONTRACTS = {
  step1: {
    provides: ['name', 'email', 'phone'],
    calculations: [],  // No calculations yet
    insights: []
  },

  step2: {
    provides: ['propertyPrice', 'propertyType', 'existingProperties'],
    calculations: ['pureLtvMaxLoan', 'tenureLimits'],
    insights: ['property_feasibility'],
    mustNotUse: ['income', 'commitments']  // ⚠️  Forbidden fields
  },

  step3_new_purchase: {
    provides: ['income', 'commitments', 'employmentType'],
    calculations: ['msrCheck', 'tdsrCheck', 'complianceSnapshot'],
    insights: ['mas_compliance', 'affordability'],
    requires: ['propertyPrice', 'propertyType']  // From Step 2
  }
} as const;
```

**Usage in tests:**
```typescript
// Automatically verify contracts
it('Step 2 calculations should not use forbidden fields', () => {
  const step2Contract = STEP_CONTRACTS.step2;

  // Parse calculation function to extract dependencies
  const deps = extractDependencies(calculatePureLtvMaxLoan);

  // Verify no forbidden fields used
  const forbidden = deps.filter(d =>
    step2Contract.mustNotUse.includes(d)
  );

  expect(forbidden).toHaveLength(0);
});
```

### Strategy 4: Documentation-Driven Development

**For each new calculation:**

1. **Write the docs first** (in calculation module):
```typescript
/**
 * Calculate maximum loan based on pure LTV limits.
 *
 * Used in: Step 2 Property Feasibility
 * Persona Source: dr-elena-mortgage-expert-v2.json
 *   - computational_modules.ltv_limits.individual_borrowers
 *   - computational_modules.tenure_rules
 *
 * Data Requirements:
 * - Property price (collected Step 2)
 * - Existing property count (collected Step 2)
 * - Borrower age (collected Step 1)
 *
 * Does NOT use: Income, commitments, employment data
 *
 * Returns: Max loan, LTV %, down payment, tenure, reason codes
 *
 * Test Coverage: tests/calculations/step2-pure-ltv.test.ts
 */
```

2. **Write the tests** (TDD)
3. **Implement the function**
4. **Update the step contract**
5. **Add UI messaging** with educational context

---

## Implementation Priority

### Phase 1: Fix Critical Step 2 Issue (Current Active Plan)
**Plan:** `2025-10-19-step2-instant-analysis-pure-ltv-calculation.md`

1. Create `calculatePureLtvMaxLoan()` in `lib/instant-profile.ts`
2. Update Step 2 to use pure LTV (remove hardcoded income)
3. Update messaging (remove "Based on your income")
4. Add tests for pure LTV scenarios
5. Verify HDB $1M shows $750k

**Timeline:** 1-2 days (per TDD approach)

### Phase 2: Implement Step-Specific Architecture
**New Plan Needed:** `step-aware-calculation-architecture.md`

1. Create `lib/calculations/` module structure
2. Extract Step 2 calculations (pure LTV, tenure, down payment)
3. Extract Step 3 calculations (MSR, TDSR, compliance)
4. Separate refinance calculations
5. Add dependency mappings
6. Update form hooks to use new modules

**Timeline:** 3-5 days

### Phase 3: Enhance UX & Messaging
**Aligns with:** Roadmap Phase 1.5 (Content Foundation)

1. Update Step 2 card with educational context
2. Add Step 3 "Eligibility vs Affordability" comparison
3. Add info tooltips explaining LTV, MSR, TDSR
4. Link to MAS Notice explainers (when available)

**Timeline:** 2-3 days

### Phase 4: Form Branching & Type Safety
**New Plan Needed:** `form-state-type-safety.md`

1. Define discriminated unions for loan types
2. Update form state management
3. Add type-safe calculation routing
4. Update property-specific validations

**Timeline:** 3-5 days

---

## Success Metrics

### Correctness Metrics
- ✅ All Dr. Elena v2 test scenarios pass
- ✅ Step 2 shows pure LTV (no income assumptions)
- ✅ Step 3 applies MSR/TDSR correctly
- ✅ No hardcoded defaults (except documented fallbacks)

### User Experience Metrics
- ✅ No confusing number changes between steps
- ✅ Clear messaging explaining each calculation
- ✅ User can understand why they got their max loan number

### Code Quality Metrics
- ✅ Each calculation function <100 lines
- ✅ 100% test coverage on calculation logic
- ✅ No circular dependencies
- ✅ Clear step contracts enforced by types

### Prevention Metrics
- ✅ Pre-implementation checklist used for new calculations
- ✅ Code review checklist passes before merge
- ✅ Documentation exists before implementation

---

## Open Questions for Brent

1. **Immediate Fix Scope:** Should Phase 1 ONLY fix Step 2 pure LTV, or also improve messaging?

2. **Architecture Refactor Timing:** When should we tackle Phase 2 (calculation module architecture)? Before or after mobile UX improvements?

3. **Educational Content:** For Phase 3 UX enhancements, should we write MAS Notice explainers now, or wait for Phase 1.5 content foundation?

4. **Form State Types:** Phase 4 discriminated unions will require form state migration. OK to do this incrementally, or wait for a dedicated refactor sprint?

5. **Testing Strategy:** Should we add Playwright E2E tests for step-by-step progression, or are unit tests on calculations sufficient?

6. **Dr. Elena v2 Integration:** Are there OTHER areas where we're prematurely assuming data (not just Step 2)? Should we audit the entire form flow?

---

## Conclusion

The Step 2 instant analysis error is a symptom of a **systemic architectural issue**: applying complex calculations before we have the required data.

**Root causes:**
1. Monolithic calculation functions mixing concerns
2. No clear step contracts for data availability
3. Premature optimization (trying to show "smart" analysis too early)
4. Missing educational context for users

**Solutions:**
1. **Immediate:** Pure LTV calculations for Step 2 (active plan)
2. **Short-term:** Step-aware calculation architecture
3. **Medium-term:** Enhanced UX with educational messaging
4. **Long-term:** Type-safe form branching and contracts

**Prevention:**
- Pre-implementation checklists
- Code review contracts
- Documentation-driven development
- Explicit step dependencies

This approach will not only fix the current issue but prevent similar issues across all form steps, property types, and loan types.
