# ABOUTME: Implementation guide for progressive form input reactivity and number input fixes
# Covers zero-prefix bug resolution and instant analysis recalculation patterns

# Progressive Form Input Reactivity Implementation Guide

**Purpose:** Technical implementation patterns for fixing number input "0" prefix bug and instant analysis reactivity issues.

**Related Plan:** `docs/plans/active/2025-10-19-progressive-form-input-reactivity-fixes.md`

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
