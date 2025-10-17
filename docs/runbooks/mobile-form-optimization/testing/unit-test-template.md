# Unit Test Template - Path2 Components

**Framework:** Jest + @testing-library/react
**Purpose:** Generic template for testing form components and utilities

---

## File Structure

```
lib/forms/__tests__/smart-defaults.test.ts
components/forms/__tests__/MobileNumberInput.test.tsx
lib/hooks/__tests__/useFieldVisibility.test.ts
```

---

## Template 1: Pure Functions (TypeScript)

**For:** Utilities, calculations, conditional logic

```typescript
// lib/forms/__tests__/smart-defaults.test.ts
import { getSmartDefaults } from '../smart-defaults'

describe('Smart Defaults', () => {
  // Test basic functionality
  it('should return default price for HDB property', () => {
    const result = getSmartDefaults('new_purchase', 'HDB')

    expect(result.priceRange).toBe(500000)
    expect(result.actualIncomes[0]).toBe(5000)
  })

  // Test edge cases
  it('should handle missing property type gracefully', () => {
    const result = getSmartDefaults('new_purchase', undefined)

    expect(result.priceRange).toBeUndefined()
  })

  // Test validation logic
  it('should validate affordability before suggesting price', () => {
    const existingData = {
      actualIncomes: { '0': 3000 } // Low income
    }
    const result = getSmartDefaults('new_purchase', 'Private', existingData)

    // Should NOT suggest $1.2M to someone earning $3k/month
    expect(result.priceRange).toBeLessThan(1200000)
    expect(result.priceRange).toBeGreaterThan(0)
  })

  // Test data persistence
  it('should not override existing user data', () => {
    const existing = {
      priceRange: 600000,
      actualIncomes: { '0': 8000 }
    }
    const result = getSmartDefaults('new_purchase', 'HDB', existing)

    // Should not override what user already filled
    expect(result.priceRange).toBeUndefined()
    expect(result.actualIncomes).toBeUndefined()
  })

  // Test all property types
  describe('Property Types', () => {
    const testCases = [
      { type: 'HDB', expectedPrice: 500000, expectedIncome: 5000 },
      { type: 'EC', expectedPrice: 850000, expectedIncome: 8000 },
      { type: 'Private', expectedPrice: 1200000, expectedIncome: 12000 },
      { type: 'Landed', expectedPrice: 2500000, expectedIncome: 20000 }
    ]

    testCases.forEach(({ type, expectedPrice, expectedIncome }) => {
      it(`should return correct defaults for ${type}`, () => {
        const result = getSmartDefaults('new_purchase', type as any)

        expect(result.priceRange).toBe(expectedPrice)
        expect(result.actualIncomes[0]).toBe(expectedIncome)
      })
    })
  })
})
```

---

## Template 2: React Components (TSX)

**For:** Form inputs, mobile components, UI elements

```tsx
// components/forms/__tests__/MobileNumberInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileNumberInput } from '../mobile/MobileNumberInput'

describe('MobileNumberInput', () => {
  // Test rendering
  it('should render with label and placeholder', () => {
    render(
      <MobileNumberInput
        label="Monthly Income"
        value=""
        onChange={jest.fn()}
        placeholder="5,000"
      />
    )

    expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('5,000')).toBeInTheDocument()
  })

  // Test user interaction
  it('should call onChange when user types', () => {
    const mockOnChange = jest.fn()
    render(
      <MobileNumberInput
        label="Monthly Income"
        value=""
        onChange={mockOnChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '5000' } })

    expect(mockOnChange).toHaveBeenCalledWith('5000')
  })

  // Test mobile keyboard trigger
  it('should have inputMode="numeric" for mobile keyboard', () => {
    render(
      <MobileNumberInput
        label="Monthly Income"
        value=""
        onChange={jest.fn()}
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('inputMode', 'numeric')
  })

  // Test error state
  it('should display error message when provided', () => {
    render(
      <MobileNumberInput
        label="Monthly Income"
        value=""
        onChange={jest.fn()}
        error="Income is required"
      />
    )

    expect(screen.getByText('Income is required')).toBeInTheDocument()
  })

  // Test helper text
  it('should show helper text when no error', () => {
    render(
      <MobileNumberInput
        label="Monthly Income"
        value=""
        onChange={jest.fn()}
        helperText="Your gross monthly income before deductions"
      />
    )

    expect(screen.getByText(/Your gross monthly income/i)).toBeInTheDocument()
  })

  // Test prefix rendering
  it('should display currency prefix', () => {
    render(
      <MobileNumberInput
        label="Monthly Income"
        value="5000"
        onChange={jest.fn()}
        prefix="$"
      />
    )

    expect(screen.getByText('$')).toBeInTheDocument()
  })

  // Test accessibility
  it('should have proper ARIA labels', () => {
    render(
      <MobileNumberInput
        label="Monthly Income"
        value=""
        onChange={jest.fn()}
      />
    )

    const input = screen.getByRole('textbox', { name: /Monthly Income/i })
    expect(input).toBeInTheDocument()
  })
})
```

---

## Template 3: React Hooks

**For:** Custom hooks with state management

```typescript
// lib/hooks/__tests__/useFieldVisibility.test.ts
import { renderHook } from '@testing-library/react-hooks'
import { useForm } from 'react-hook-form'
import { useFieldVisibility } from '../useFieldVisibility'

describe('useFieldVisibility', () => {
  it('should show field when condition is met', () => {
    const { result } = renderHook(() => {
      const { control, setValue } = useForm()

      // Set form state
      setValue('loanType', 'new_purchase')
      setValue('propertyCategory', 'new_launch')

      return useFieldVisibility(control)
    })

    expect(result.current.shouldShow('developmentName')).toBe(true)
  })

  it('should hide field when condition is not met', () => {
    const { result } = renderHook(() => {
      const { control, setValue } = useForm()

      setValue('loanType', 'new_purchase')
      setValue('propertyCategory', 'resale')

      return useFieldVisibility(control)
    })

    expect(result.current.shouldShow('developmentName')).toBe(false)
  })

  it('should update when form state changes', () => {
    const { result } = renderHook(() => {
      const { control, setValue } = useForm()
      return { visibility: useFieldVisibility(control), setValue }
    })

    // Initially hidden
    result.current.setValue('propertyCategory', 'resale')
    expect(result.current.visibility.shouldShow('developmentName')).toBe(false)

    // Change to new_launch - should show
    result.current.setValue('propertyCategory', 'new_launch')
    expect(result.current.visibility.shouldShow('developmentName')).toBe(true)
  })
})
```

---

## Common Testing Patterns

### 1. Snapshot Testing (Use Sparingly)
```typescript
it('should match snapshot', () => {
  const { container } = render(<MobileNumberInput {...props} />)
  expect(container.firstChild).toMatchSnapshot()
})
```

**⚠️  Warning:** Avoid snapshot tests for frequently changing UI. Use only for stable components.

### 2. Testing Async Behavior
```typescript
it('should debounce onChange calls', async () => {
  jest.useFakeTimers()
  const mockOnChange = jest.fn()

  render(<DebouncedInput onChange={mockOnChange} delay={300} />)

  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'test' } })

  // Should NOT call immediately
  expect(mockOnChange).not.toHaveBeenCalled()

  // Fast-forward time
  jest.advanceTimersByTime(300)

  // Should call after delay
  expect(mockOnChange).toHaveBeenCalledWith('test')

  jest.useRealTimers()
})
```

### 3. Testing Error Boundaries
```typescript
it('should catch errors gracefully', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation()

  const ThrowError = () => {
    throw new Error('Test error')
  }

  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText('Error occurred')).toBeInTheDocument()

  consoleError.mockRestore()
})
```

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- smart-defaults.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

**Expected Output:**
```
PASS  lib/forms/__tests__/smart-defaults.test.ts
  Smart Defaults
    ✓ should return default price for HDB property (12ms)
    ✓ should handle missing property type gracefully (3ms)
    ✓ should validate affordability (8ms)
    Property Types
      ✓ should return correct defaults for HDB (2ms)
      ✓ should return correct defaults for EC (2ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        1.234s
```

**References:**
- Jest docs: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
