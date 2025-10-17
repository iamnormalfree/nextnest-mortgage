# Task 2: Conditional Field Visibility

**Status:** 🚧 NEXT - HIGH PRIORITY
**Estimated Time:** 4-6 hours
**Prerequisites:** Task 1 completed ✅

[← Back to Index](../00-INDEX.md) | [Previous: Task 1](task-1-mobile-components.md) | [Next: Task 3 →](task-3-smart-defaults.md)

---

## Overview

**Objective:** Show/hide fields dynamically based on user context to reduce cognitive load

**Why This Matters:**
- Not all fields are relevant to all users
- Showing irrelevant fields = confusion = drop-off
- Smart forms feel personalized

**Expected Impact:**
- Reduce average fields shown from 15 to 8-10
- 20-30% reduction in form abandonment
- Faster completion times

**Files to Create:**
- `lib/forms/field-conditionals.ts` - Centralized conditional logic
- `lib/hooks/useFieldVisibility.ts` - React integration hook
- `lib/forms/__tests__/field-conditionals.test.ts` - Unit tests

**Files to Update:**
- `components/forms/ProgressiveFormWithController.tsx` - Apply conditional rendering
- `components/forms/ProgressiveFormMobile.tsx` - Apply to mobile form

---

## Implementation Steps

### 2.1 Define Conditional Rules

**Create:** `lib/forms/field-conditionals.ts`

```typescript
// ABOUTME: Conditional logic for showing/hiding form fields based on user context
// ABOUTME: Centralizes all field visibility rules to prevent scattered conditional logic

import type { LoanType, PropertyCategory, FormState } from '@/lib/contracts/form-contracts'

export interface FieldCondition {
  field: string
  showWhen: (formState: Partial<FormState>) => boolean
  requiredWhen?: (formState: Partial<FormState>) => boolean
}

export const fieldConditionals: FieldCondition[] = [
  // Development name only for new launch properties
  {
    field: 'developmentName',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'new_launch',
    requiredWhen: (state) => false // Optional field
  },

  // Unit type only for new launch
  {
    field: 'unitType',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'new_launch',
    requiredWhen: (state) => false
  },

  // TOP date only for new launch
  {
    field: 'topDate',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'new_launch',
    requiredWhen: (state) => false
  },

  // BTO project only for BTO
  {
    field: 'btoProject',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'bto',
    requiredWhen: (state) => true // Required for BTO
  },

  // Refinancing goals only for refinance
  {
    field: 'refinancingGoals',
    showWhen: (state) => state.loanType === 'refinance',
    requiredWhen: (state) => true
  },

  // Cash out amount only if "cash_out" is in refinancing goals
  {
    field: 'cashOutAmount',
    showWhen: (state) =>
      state.loanType === 'refinance' &&
      Array.isArray(state.refinancingGoals) &&
      state.refinancingGoals.includes('cash_out'),
    requiredWhen: (state) =>
      state.refinancingGoals?.includes('cash_out') || false
  },

  // Joint applicant fields only if hasJointApplicant = true
  {
    field: 'actualIncomes.1',
    showWhen: (state) => state.hasJointApplicant === true,
    requiredWhen: (state) => state.hasJointApplicant === true
  },
  {
    field: 'actualAges.1',
    showWhen: (state) => state.hasJointApplicant === true,
    requiredWhen: (state) => state.hasJointApplicant === true
  },

  // Employment details only for self-employed or variable income
  {
    field: 'employmentDetails.self-employed',
    showWhen: (state) => state.employmentType === 'self-employed',
    requiredWhen: (state) => state.employmentType === 'self-employed'
  },
  {
    field: 'employmentDetails.variable',
    showWhen: (state) =>
      state.employmentType === 'contract' ||
      state.employmentType === 'variable',
    requiredWhen: (state) =>
      state.employmentType === 'contract' ||
      state.employmentType === 'variable'
  }
]

export function shouldShowField(
  fieldName: string,
  formState: Partial<FormState>
): boolean {
  const condition = fieldConditionals.find(c => c.field === fieldName)
  if (!condition) return true // Show by default if no condition defined
  return condition.showWhen(formState)
}

export function isFieldRequired(
  fieldName: string,
  formState: Partial<FormState>
): boolean {
  const condition = fieldConditionals.find(c => c.field === fieldName)
  if (!condition || !condition.requiredWhen) return false
  return condition.requiredWhen(formState)
}
```

**Key Design Decisions:**
1. Centralized rules prevent scattered logic across components
2. Pure functions for testability
3. Default to showing fields (fail-safe)
4. Separate `showWhen` and `requiredWhen` for flexibility

---

### 2.2 Create Visibility Hook

**Create:** `lib/hooks/useFieldVisibility.ts`

```typescript
// ABOUTME: React hook for managing conditional field visibility in forms
// ABOUTME: Integrates field-conditionals.ts rules with React Hook Form

import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { shouldShowField, isFieldRequired } from '@/lib/forms/field-conditionals'
import type { FormState } from '@/lib/contracts/form-contracts'

export function useFieldVisibility(control: any) {
  // Watch all form values
  const formState = useWatch({ control }) as Partial<FormState>

  return useMemo(() => ({
    shouldShow: (fieldName: string) => shouldShowField(fieldName, formState),
    isRequired: (fieldName: string) => isFieldRequired(fieldName, formState)
  }), [formState])
}
```

**Why `useMemo`:**
- Prevents unnecessary re-renders
- Only recalculates when formState changes
- Performance optimization for forms with many fields

---

### 2.3 Apply Conditional Rendering

**Update:** `components/forms/ProgressiveFormWithController.tsx`

Add hook at top of component:

```tsx
import { useFieldVisibility } from '@/lib/hooks/useFieldVisibility'

export function ProgressiveFormWithController({ ... }) {
  const { shouldShow, isRequired } = useFieldVisibility(control)

  // ... rest of component

  // Example: Conditionally render development name field
  return (
    <>
      {shouldShow('developmentName') && (
        <Controller
          name="developmentName"
          control={control}
          rules={{ required: isRequired('developmentName') }}
          render={({ field }) => (
            <div>
              <label>
                Development Name {isRequired('developmentName') && '*'}
              </label>
              <Input {...field} />
            </div>
          )}
        />
      )}

      {shouldShow('cashOutAmount') && (
        <Controller
          name="cashOutAmount"
          control={control}
          rules={{ required: isRequired('cashOutAmount') }}
          render={({ field }) => (
            <div>
              <label>
                Cash Out Amount {isRequired('cashOutAmount') && '*'}
              </label>
              <Input {...field} type="text" inputMode="numeric" />
            </div>
          )}
        />
      )}

      {shouldShow('actualIncomes.1') && (
        <Controller
          name="actualIncomes.1"
          control={control}
          rules={{ required: isRequired('actualIncomes.1') }}
          render={({ field }) => (
            <div>
              <label>
                Joint Applicant Income {isRequired('actualIncomes.1') && '*'}
              </label>
              <Input {...field} type="text" inputMode="numeric" />
            </div>
          )}
        />
      )}
    </>
  )
}
```

**Update:** `components/forms/ProgressiveFormMobile.tsx`

Apply same pattern to mobile form:

```tsx
import { useFieldVisibility } from '@/lib/hooks/useFieldVisibility'

export function ProgressiveFormMobile({ ... }) {
  const { shouldShow, isRequired } = useFieldVisibility(control)

  // Use in renderMobileStep function
  // Example for Step 2 property details
  return (
    <>
      {shouldShow('developmentName') && (
        <MobileInput
          label={`Development Name${isRequired('developmentName') ? ' *' : ''}`}
          value={watch('developmentName')}
          onChange={(val) => setValue('developmentName', val)}
        />
      )}
    </>
  )
}
```

---

## Testing

### 2.4 Unit Tests for Conditional Logic

**Create:** `lib/forms/__tests__/field-conditionals.test.ts`

```typescript
import { shouldShowField, isFieldRequired } from '../field-conditionals'

describe('Field Conditionals', () => {
  describe('Development Name', () => {
    it('should show for new launch properties', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'new_launch' as const
      }

      expect(shouldShowField('developmentName', formState)).toBe(true)
    })

    it('should hide for resale properties', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'resale' as const
      }

      expect(shouldShowField('developmentName', formState)).toBe(false)
    })

    it('should hide for refinance loans', () => {
      const formState = {
        loanType: 'refinance' as const,
        propertyCategory: 'new_launch' as const
      }

      expect(shouldShowField('developmentName', formState)).toBe(false)
    })
  })

  describe('Cash Out Amount', () => {
    it('should show only if cash_out in refinancing goals', () => {
      const formState = {
        loanType: 'refinance' as const,
        refinancingGoals: ['cash_out', 'lower_rate']
      }

      expect(shouldShowField('cashOutAmount', formState)).toBe(true)
    })

    it('should hide if cash_out not selected', () => {
      const formState = {
        loanType: 'refinance' as const,
        refinancingGoals: ['lower_rate']
      }

      expect(shouldShowField('cashOutAmount', formState)).toBe(false)
    })

    it('should be required when shown', () => {
      const formState = {
        loanType: 'refinance' as const,
        refinancingGoals: ['cash_out']
      }

      expect(isFieldRequired('cashOutAmount', formState)).toBe(true)
    })

    it('should hide for new purchase loans', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        refinancingGoals: ['cash_out']
      }

      expect(shouldShowField('cashOutAmount', formState)).toBe(false)
    })
  })

  describe('Joint Applicant Fields', () => {
    it('should show when hasJointApplicant is true', () => {
      const formState = {
        hasJointApplicant: true
      }

      expect(shouldShowField('actualIncomes.1', formState)).toBe(true)
      expect(shouldShowField('actualAges.1', formState)).toBe(true)
    })

    it('should hide when hasJointApplicant is false', () => {
      const formState = {
        hasJointApplicant: false
      }

      expect(shouldShowField('actualIncomes.1', formState)).toBe(false)
      expect(shouldShowField('actualAges.1', formState)).toBe(false)
    })

    it('should be required when shown', () => {
      const formState = {
        hasJointApplicant: true
      }

      expect(isFieldRequired('actualIncomes.1', formState)).toBe(true)
    })
  })

  describe('BTO Project', () => {
    it('should show for BTO category', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'bto' as const
      }

      expect(shouldShowField('btoProject', formState)).toBe(true)
    })

    it('should be required for BTO', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'bto' as const
      }

      expect(isFieldRequired('btoProject', formState)).toBe(true)
    })

    it('should hide for non-BTO properties', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'resale' as const
      }

      expect(shouldShowField('btoProject', formState)).toBe(false)
    })
  })

  describe('Default Behavior', () => {
    it('should show fields without conditions by default', () => {
      const formState = {}

      expect(shouldShowField('name', formState)).toBe(true)
      expect(shouldShowField('email', formState)).toBe(true)
      expect(shouldShowField('priceRange', formState)).toBe(true)
    })
  })
})
```

### 2.5 Integration Tests

**Create:** `components/forms/__tests__/conditional-fields-integration.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Conditional Fields Integration', () => {
  it('should show development name when new launch selected', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Development name should not be visible initially
    expect(screen.queryByLabelText(/Development Name/i)).not.toBeInTheDocument()

    // Select new launch category
    fireEvent.change(screen.getByLabelText('Property Category'), {
      target: { value: 'new_launch' }
    })

    // Development name field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Development Name/i)).toBeInTheDocument()
    })
  })

  it('should show cash out amount only when cash_out goal selected', async () => {
    render(
      <ProgressiveFormWithController
        loanType="refinance"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Cash out amount should not be visible initially
    expect(screen.queryByLabelText(/Cash Out Amount/i)).not.toBeInTheDocument()

    // Select cash_out refinancing goal
    const cashOutCheckbox = screen.getByLabelText(/Cash Out/i)
    fireEvent.click(cashOutCheckbox)

    // Cash out amount field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Cash Out Amount/i)).toBeInTheDocument()
    })
  })

  it('should show joint applicant fields when hasJointApplicant enabled', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Joint applicant fields should not be visible initially
    expect(screen.queryByLabelText(/Joint Applicant Income/i)).not.toBeInTheDocument()

    // Enable joint applicant
    const jointApplicantToggle = screen.getByLabelText(/Joint Application/i)
    fireEvent.click(jointApplicantToggle)

    // Joint applicant fields should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Joint Applicant Income/i)).toBeInTheDocument()
    })
  })
})
```

---

## Run Tests

```bash
# Run unit tests
npm test -- lib/forms/__tests__/field-conditionals.test.ts

# Run integration tests
npm test -- components/forms/__tests__/conditional-fields-integration.test.tsx

# Run all tests
npm test
```

**Expected Output:**
```
PASS  lib/forms/__tests__/field-conditionals.test.ts
  Field Conditionals
    Development Name
      ✓ should show for new launch properties (3ms)
      ✓ should hide for resale properties (1ms)
      ✓ should hide for refinance loans (1ms)
    Cash Out Amount
      ✓ should show only if cash_out in refinancing goals (2ms)
      ✓ should hide if cash_out not selected (1ms)
      ✓ should be required when shown (1ms)
    Joint Applicant Fields
      ✓ should show when hasJointApplicant is true (2ms)
      ✓ should hide when hasJointApplicant is false (1ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

---

## Commit Point

```bash
git add lib/forms/field-conditionals.ts
git add lib/hooks/useFieldVisibility.ts
git add lib/forms/__tests__/field-conditionals.test.ts
git add components/forms/__tests__/conditional-fields-integration.test.tsx
git add components/forms/ProgressiveFormWithController.tsx
git add components/forms/ProgressiveFormMobile.tsx

git commit -m "feat: add conditional field visibility based on user context

- Create centralized field conditional logic in field-conditionals.ts
- Add useFieldVisibility hook for React integration
- Implement dynamic show/hide for irrelevant fields
- Add comprehensive test coverage for conditional rules
- Apply to both desktop and mobile forms

Reduces average fields shown from 15 to 8-10 based on user context"
```

---

## Success Criteria

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Fields hide/show correctly based on user selections
- [ ] Required validation only applies to visible fields
- [ ] Mobile and desktop forms both respect conditionals
- [ ] Performance: No lag when toggling field visibility

---

## Next Steps

After committing this task:
1. Verify fields conditionally render in browser (`npm run dev`)
2. Test on real devices (mobile + desktop)
3. Proceed to [Task 3: Smart Defaults](task-3-smart-defaults.md)

---

[← Back to Index](../00-INDEX.md) | [Previous: Task 1](task-1-mobile-components.md) | [Next: Task 3 →](task-3-smart-defaults.md)
