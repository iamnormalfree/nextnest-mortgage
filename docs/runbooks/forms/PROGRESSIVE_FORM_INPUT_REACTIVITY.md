# ABOUTME: Implementation guide for progressive form input validation, reactivity and number input fixes
# Covers input validation patterns, zero-prefix bug resolution and instant analysis recalculation patterns

# Progressive Form Input Validation & Reactivity Implementation Guide

**Purpose:** Technical implementation patterns for input validation, number input "0" prefix bug fixes, and instant analysis reactivity issues.

**Related Plan:** `docs/plans/active/2025-10-19-progressive-form-input-validation-and-reactivity-fixes.md`

**Related Audit:** `docs/reports/step3-ux-audit-report.md`

---

## Table of Contents

1. [Input Validation Patterns](#input-validation-patterns)
2. [Number Input "0" Prefix Bug](#number-input-0-prefix-bug---implementation)
3. [Instant Analysis Reactivity](#instant-analysis-reactivity---implementation)
4. [Testing Patterns](#testing-patterns)
5. [Performance Considerations](#performance-considerations)
6. [Rollback Procedure](#rollback-procedure)

---

## Input Validation Patterns

### Overview

Critical validation patterns to prevent invalid user input (negative numbers, unrealistic values) from corrupting calculations and database state.

**Source:** Based on UX audit findings (`docs/reports/step3-ux-audit-report.md`)

### HTML Input Attributes

**Pattern: Numeric Fields with Minimum Values**

```typescript
// Income, liabilities, business age - must be non-negative
<input
  type="number"
  min="0"
  step="any"
  placeholder="5000"
  {...register('monthlyIncome', { valueAsNumber: true })}
/>
```

**Pattern: Age Field with Range**

```typescript
// Age must be 18-99
<input
  type="number"
  min="18"
  max="99"
  step="1"
  placeholder="35"
  {...register('actualAges.0', { valueAsNumber: true })}
/>
```

**Key Attributes:**
- `min` - Prevents values below threshold (enforced by browser)
- `max` - Prevents values above threshold
- `step="1"` - Prevents decimals (integers only)
- `step="any"` - Allows decimals (for monetary values)

### Zod Schema Validation

**Pattern: Non-Negative Numeric Fields**

```typescript
// lib/validation/mortgage-schemas.ts
import { z } from 'zod';

const mortgageSchema = z.object({
  // Income fields - must be >= 0
  monthlyIncome: z.number()
    .min(0, 'Income cannot be negative')
    .optional(),

  variableIncome: z.number()
    .min(0, 'Variable income cannot be negative')
    .optional(),

  // Liability fields - must be >= 0
  existingLoanBalance: z.number()
    .min(0, 'Balance cannot be negative')
    .optional(),

  monthlyLoanPayment: z.number()
    .min(0, 'Payment cannot be negative')
    .optional(),
});
```

**Pattern: Age Field with Range + Integer Constraint**

```typescript
const mortgageSchema = z.object({
  actualAges: z.array(
    z.number()
      .int('Age must be a whole number')
      .min(18, 'Age must be at least 18')
      .max(99, 'Age must be 99 or less')
  ).optional(),
});
```

**Pattern: Self-Employed Business Age**

```typescript
const mortgageSchema = z.object({
  businessAge: z.number()
    .int('Business age must be a whole number')
    .min(0, 'Business age cannot be negative')
    .max(100, 'Please verify business age')
    .optional(),
});
```

### Error Message Display

**Pattern: Show Validation Errors Below Input**

```typescript
import { useFormContext } from 'react-hook-form';

function IncomeField() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-1">
      <label htmlFor="monthlyIncome">Monthly Income</label>
      <input
        id="monthlyIncome"
        type="number"
        min="0"
        className={errors.monthlyIncome ? 'border-red-500' : ''}
        {...register('monthlyIncome', { valueAsNumber: true })}
      />
      {errors.monthlyIncome && (
        <p className="text-sm text-red-600">
          {errors.monthlyIncome.message}
        </p>
      )}
    </div>
  );
}
```

**Pattern: Age Field with Helpful Context**

```typescript
<div className="space-y-1">
  <label htmlFor="age">Your Age</label>
  <input
    id="age"
    type="number"
    min="18"
    max="99"
    step="1"
    className={errors.actualAges?.[0] ? 'border-red-500' : ''}
    {...register('actualAges.0', { valueAsNumber: true })}
  />
  {errors.actualAges?.[0] && (
    <p className="text-sm text-red-600">
      {errors.actualAges[0].message}
    </p>
  )}
  <p className="text-xs text-gray-500">
    Age affects maximum loan tenure and LTV limits
  </p>
</div>
```

### Validation Flow

**Client-Side (Browser):**
1. HTML attributes (`min`, `max`, `step`) provide immediate feedback
2. Browser shows native validation UI on form submit
3. Prevents typing invalid characters (e.g., 'e', '-' for integers)

**Application-Level (Zod):**
1. Schema validation runs on form submit
2. Custom error messages displayed
3. Prevents form progression with invalid data

**Server-Side (API):**
1. Re-validate with same Zod schema
2. Prevent malicious/corrupted submissions
3. Return validation errors to client

### Files to Update

**Components:**
- `components/forms/ProgressiveFormWithController.tsx` (Step 2: age, property value, loan quantum)
- `components/forms/sections/Step3NewPurchase.tsx` (income, age, liabilities, business age)
- `components/forms/sections/Step3Refinance.tsx` (income, loan balance, property value)

**Schemas:**
- `lib/validation/mortgage-schemas.ts` (all numeric field validations)

**Tests:**
- `lib/validation/__tests__/mortgage-schemas.test.ts` (schema validation tests)
- `components/forms/__tests__/Step3NewPurchase.test.tsx` (component validation tests)

### Common Pitfalls

**❌ Don't: Trust client-side validation alone**
```typescript
// Insufficient - user can bypass browser validation
<input type="number" min="0" />
```

**✅ Do: Layer validations (HTML + Zod + Server)**
```typescript
// HTML attribute
<input type="number" min="0" {...register('income')} />

// Zod schema
z.number().min(0, 'Income cannot be negative')

// API route
export async function POST(req: Request) {
  const parsed = mortgageSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error }, { status: 400 });
}
```

**❌ Don't: Use generic error messages**
```typescript
z.number().min(0) // Shows "Number must be greater than or equal to 0"
```

**✅ Do: Provide context-specific messages**
```typescript
z.number().min(0, 'Income cannot be negative')
z.number().min(18, 'You must be at least 18 years old to apply')
```

### Testing Validation

**Unit Tests (Schema):**
```typescript
// lib/validation/__tests__/mortgage-schemas.test.ts
describe('mortgage schema validation', () => {
  it('rejects negative income', () => {
    const result = mortgageSchema.safeParse({
      monthlyIncome: -5000
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be negative');
    }
  });

  it('rejects age below 18', () => {
    const result = mortgageSchema.safeParse({
      actualAges: [15]
    });
    expect(result.success).toBe(false);
  });

  it('rejects age above 99', () => {
    const result = mortgageSchema.safeParse({
      actualAges: [150]
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid age range', () => {
    const result = mortgageSchema.safeParse({
      actualAges: [35]
    });
    expect(result.success).toBe(true);
  });
});
```

**Component Tests:**
```typescript
// components/forms/__tests__/Step3NewPurchase.test.tsx
it('displays error when negative income entered', async () => {
  render(<Step3NewPurchase />);

  const incomeInput = screen.getByLabelText(/Monthly Income/i);
  await userEvent.type(incomeInput, '-5000');

  const submitButton = screen.getByRole('button', { name: /continue/i });
  await userEvent.click(submitButton);

  expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument();
});

it('displays error when age is outside valid range', async () => {
  render(<Step3NewPurchase />);

  const ageInput = screen.getByLabelText(/Your Age/i);
  await userEvent.type(ageInput, '150');

  const submitButton = screen.getByRole('button', { name: /continue/i });
  await userEvent.click(submitButton);

  expect(screen.getByText(/Age must be/i)).toBeInTheDocument();
});
```

**Manual Tests (Playwright):**
```typescript
// e2e/form-validation.spec.ts
test('rejects negative income values', async ({ page }) => {
  await page.goto('/apply');
  // Fill Step 1, navigate to Step 3
  await page.getByLabel(/Monthly Income/i).fill('-5000');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText(/cannot be negative/i)).toBeVisible();
});

test('enforces age range 18-99', async ({ page }) => {
  await page.goto('/apply');
  // Navigate to Step 3
  const ageInput = page.getByLabel(/Your Age/i);

  // Test below minimum
  await ageInput.fill('15');
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText(/at least 18/i)).toBeVisible();

  // Test above maximum
  await ageInput.fill('150');
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText(/99 or less/i)).toBeVisible();

  // Test valid value
  await ageInput.fill('35');
  // Should not show error
  await expect(page.getByText(/Age must be/i)).not.toBeVisible();
});
```

---

## Number Input "0" Prefix Bug - Implementation

### Problem Pattern
```typescript
// ❌ WRONG - Causes "0" prefix when editing
<input type="number" defaultValue={0} />
```

When user clicks and types, they see: "035" instead of "35"

### Solution Patterns

**Option A: Clear zero on focus**
```typescript
<input
  type="number"
  defaultValue=""
  placeholder="35"
  onFocus={(e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  }}
/>
```

**Option B: Use text input with numeric mode (recommended)**
```typescript
import { formatNumber, parseFormattedNumber } from '@/lib/utils/format';

<input
  type="text"
  inputMode="numeric"
  className="font-mono"
  value={formatNumber(value)}
  onChange={(e) => {
    const parsed = parseFormattedNumber(e.target.value);
    form.setValue('fieldName', parsed);
  }}
/>
```

**Helper Functions:**
```typescript
// lib/utils/format.ts
export function formatNumber(value: number | string): string {
  if (!value) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-SG');
}

export function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0;
}
```

### Files to Update

**Step 2 (Property Details):**
- File: `components/forms/ProgressiveFormWithController.tsx`
- Fields: `propertyValue`, `loanQuantum`, `actualAges[0]`

**Step 3 New Purchase:**
- File: `components/forms/sections/Step3NewPurchase.tsx`
- Fields: `actualIncomes`, `actualVariableIncomes`, `actualAges`, commitment amounts

**Step 3 Refinance:**
- File: `components/forms/sections/Step3Refinance.tsx`
- Fields: `monthlyIncome`, `outstandingLoan`, `currentRate`, `propertyValue`

---

## Instant Analysis Reactivity - Implementation

### Problem

Current behavior:
```typescript
// Only calculates once on mount
useEffect(() => {
  if (propertyValue && loanQuantum) {
    calculateInstant();
  }
}, []); // ❌ Empty deps - never recalculates
```

### Solution Pattern

**Use `useWatch` to monitor form fields:**

```typescript
import { useWatch } from 'react-hook-form';

function useProgressiveFormController() {
  // ... existing code ...

  // Watch fields that affect instant analysis
  const watchedFields = useWatch({
    control,
    name: [
      'propertyValue',
      'loanQuantum',
      'actualAges',
      'ltvMode',
      'propertyType'
    ]
  });

  // Debounced recalculation
  useEffect(() => {
    const timer = setTimeout(() => {
      const values = form.getValues();
      const {
        propertyValue,
        loanQuantum,
        actualAges,
        ltvMode,
        propertyType
      } = values;

      // Only recalculate if we have minimum required fields
      if (propertyValue && loanQuantum && actualAges?.[0]) {
        setIsInstantCalcLoading(true);

        // Force recalculation with current values
        calculateInstant({
          force: true,
          ltvMode: ltvMode || 75
        });

        // Clear loading state after 500ms
        setTimeout(() => {
          setIsInstantCalcLoading(false);
        }, 500);
      }
    }, 500); // 500ms debounce to prevent excessive calls

    return () => clearTimeout(timer);
  }, [watchedFields]); // Recalculates when any watched field changes

  // ... rest of hook ...
}
```

### Debounce Configuration

**Why 500ms?**
- Prevents calculation on every keystroke
- Feels responsive to user (< 1 second)
- Reduces unnecessary calculations

**Tuning guidance:**
- Desktop: 500ms is good
- Mobile: Consider 300ms for faster feel
- Heavy calcs: May need 750ms

### Loading State Pattern

```typescript
// State
const [isInstantCalcLoading, setIsInstantCalcLoading] = useState(false);

// UI Display
{isInstantCalcLoading ? (
  <div className="flex items-center gap-2">
    <div className="animate-spin h-4 w-4 border-2 border-gold border-t-transparent rounded-full" />
    <span>Recalculating...</span>
  </div>
) : (
  <div>{/* Instant analysis results */}</div>
)}
```

### Fields to Watch

**Step 2 Fields Affecting Instant Analysis:**

| Field | Impact | Example |
|-------|--------|---------|
| `propertyValue` | Changes max loan calculation | $800k → $1M increases loan |
| `loanQuantum` | Changes LTV ratio | $600k → $700k affects LTV |
| `actualAges[0]` | Triggers age-based LTV reduction | Age 55+ may reduce LTV to 55% |
| `ltvMode` | Switches between 75%/55% caps | Manual toggle by user |
| `propertyType` | Commercial vs residential rules | Commercial uses 5% stress floor |

**Don't Watch (Not Relevant to Instant Analysis):**
- Contact info (name, email, phone)
- Employment type (affects Step 3, not instant analysis)
- Commitments (affects TDSR in Step 3, not max loan)

---

## Testing Patterns

### Manual Test Cases

**Test 1: Number Input Prefix**
```
1. Navigate to /apply
2. Fill Step 1, proceed to Step 2
3. Click "Property Value" field
4. Type "800000"
5. ✅ Verify: Shows "800000" NOT "0800000"
```

**Test 2: Instant Analysis Updates**
```
1. Fill Step 2: Property Value = $800k, Loan = $600k, Age = 35
2. Note max loan result (e.g., "$600k")
3. Change Property Value to $1,000,000
4. ✅ Verify: Max loan updates to ~$750k
5. Change Age to 60
6. ✅ Verify: Max loan may reduce (age trigger)
```

**Test 3: Debouncing Works**
```
1. Fill Step 2 completely
2. Rapidly change property value multiple times
3. ✅ Verify: Only 1 calculation after typing stops
4. ✅ Verify: No lag or performance issues
```

### Automated Test Patterns

**Unit Test: Debounced Recalculation**
```typescript
// hooks/__tests__/useProgressiveFormController.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useProgressiveFormController } from '../useProgressiveFormController';

it('debounces instant analysis recalculation', async () => {
  const { result } = renderHook(() => useProgressiveFormController());

  // Change property value multiple times quickly
  act(() => {
    result.current.form.setValue('propertyValue', 800000);
  });
  act(() => {
    result.current.form.setValue('propertyValue', 900000);
  });
  act(() => {
    result.current.form.setValue('propertyValue', 1000000);
  });

  // Should only call calculateInstant once after debounce
  await waitFor(() => {
    expect(calculateInstantProfile).toHaveBeenCalledTimes(1);
  }, { timeout: 1000 });
});
```

**Component Test: No Zero Prefix**
```typescript
// components/forms/__tests__/ProgressiveFormWithController.test.tsx
it('number inputs do not show zero prefix when typing', () => {
  render(<ProgressiveFormWithController />);

  const propertyValueInput = screen.getByLabelText(/Property Value/i);

  // Simulate user typing
  fireEvent.focus(propertyValueInput);
  fireEvent.change(propertyValueInput, { target: { value: '800000' } });

  // Should NOT have leading zero
  expect(propertyValueInput).toHaveValue('800000');
  expect(propertyValueInput).not.toHaveValue('0800000');
});
```

---

## Performance Considerations

### Calculation Cost
- Simple instant analysis: ~10ms
- Complex with all inputs: ~50ms
- Acceptable for debounced updates

### Optimization Tips
1. **Debounce aggressively** (500ms minimum)
2. **Only watch necessary fields** (don't watch all form state)
3. **Conditional execution** (check minimum required fields first)
4. **Memoize expensive computations** (use useMemo for complex transformations)

### Memory Leaks Prevention
```typescript
useEffect(() => {
  const timer = setTimeout(/* ... */);

  // ✅ CRITICAL: Always cleanup timers
  return () => clearTimeout(timer);
}, [deps]);
```

---

## Rollback Procedure

If issues arise after deployment:

1. **Revert number input changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Disable reactivity temporarily:**
   ```typescript
   // Quick fix: Comment out useEffect
   /*
   useEffect(() => {
     // Recalculation logic
   }, [watchedFields]);
   */
   ```

3. **Deploy hotfix:**
   - Remove debounced recalculation
   - Keep manual recalc button as fallback
   - Investigate root cause

---

## Related Files

**Controller Logic:**
- `hooks/useProgressiveFormController.ts` (main controller)

**Form Components:**
- `components/forms/ProgressiveFormWithController.tsx` (Step 2)
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`

**Utilities:**
- `lib/utils/format.ts` (number formatting helpers)

**Tests:**
- `hooks/__tests__/useProgressiveFormController.test.ts`
- `components/forms/__tests__/ProgressiveFormWithController.test.tsx`

---

## Success Metrics

**Functional:**
- ✅ No "0" prefix in any number input
- ✅ Instant analysis updates within 1 second of input change
- ✅ Debouncing prevents >1 calc per 500ms
- ✅ All existing tests pass

**Performance:**
- ✅ No noticeable lag when typing
- ✅ Calculation completes in <100ms
- ✅ No memory leaks (cleanup timers)

**User Experience:**
- ✅ Number inputs feel natural and intuitive
- ✅ Instant analysis feels responsive
- ✅ No flickering or layout shifts
