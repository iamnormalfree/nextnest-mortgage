# Integration Test Template - Path2 Form Features

**Framework:** Jest + @testing-library/react
**Purpose:** Test interactions between components and form state

---

## File Structure

```
components/forms/__tests__/ProgressiveFormIntegration.test.tsx
components/forms/__tests__/ConditionalFieldsIntegration.test.tsx
lib/hooks/__tests__/FormSessionIntegration.test.tsx
```

---

## Template 1: Form Field Interactions

**For:** Testing how fields interact with React Hook Form and validation

```tsx
// components/forms/__tests__/ProgressiveFormIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Progressive Form Integration', () => {
  const mockProps = {
    loanType: 'new_purchase' as const,
    sessionId: 'test-123',
    onStepCompletion: jest.fn(),
    onAIInsight: jest.fn(),
    onScoreUpdate: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate all Step 1 fields before advancing', async () => {
    render(<ProgressiveFormWithController {...mockProps} />)

    // Try to advance without filling
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
    })

    // Should NOT advance
    expect(mockProps.onStepCompletion).not.toHaveBeenCalled()
  })

  it('should advance to Step 2 after valid Step 1 submission', async () => {
    render(<ProgressiveFormWithController {...mockProps} />)

    // Fill valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane Tan')
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@test.com')
    await userEvent.type(screen.getByLabelText(/phone/i), '91234567')

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Should advance to Step 2
    await waitFor(() => {
      expect(mockProps.onStepCompletion).toHaveBeenCalledWith({
        step: 0,
        data: expect.objectContaining({
          name: 'Jane Tan',
          email: 'jane@test.com',
          phone: '91234567'
        })
      })
    })
  })

  it('should trigger instant calculation at Step 2', async () => {
    render(<ProgressiveFormWithController {...mockProps} />)

    // Complete Step 1
    await fillStep1()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Fill Step 2 (property details)
    await waitFor(() => {
      expect(screen.getByLabelText(/property type/i)).toBeInTheDocument()
    })

    await userEvent.selectOptions(screen.getByLabelText(/property type/i), 'HDB')
    await userEvent.type(screen.getByLabelText(/property price/i), '500000')

    // Click "Get instant loan estimate"
    fireEvent.click(screen.getByRole('button', { name: /get instant/i }))

    // Should call onAIInsight with calculation
    await waitFor(() => {
      expect(mockProps.onAIInsight).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'instant_calculation',
          data: expect.objectContaining({
            maxLoanAmount: expect.any(Number),
            tdsr: expect.any(Number)
          })
        })
      )
    })
  })

  // Helper function
  async function fillStep1() {
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/phone/i), '91234567')
  }
})
```

---

## Template 2: Conditional Field Logic

**For:** Testing field visibility based on form state

```tsx
// components/forms/__tests__/ConditionalFieldsIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Conditional Fields Integration', () => {
  it('should show development name only for new launch properties', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Navigate to Step 2
    await fillContactInfo()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })

    // Development name should NOT be visible initially
    expect(screen.queryByLabelText(/development name/i)).not.toBeInTheDocument()

    // Select new_launch
    await userEvent.selectOptions(
      screen.getByLabelText(/property category/i),
      'new_launch'
    )

    // Development name should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/development name/i)).toBeInTheDocument()
    })
  })

  it('should show/hide cash out amount based on refinancing goals', async () => {
    render(
      <ProgressiveFormWithController
        loanType="refinance"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    await navigateToRefinanceGoals()

    // Cash out field should NOT be visible
    expect(screen.queryByLabelText(/cash out amount/i)).not.toBeInTheDocument()

    // Select "Lower Rate" only
    await userEvent.click(screen.getByLabelText(/lower rate/i))

    // Still no cash out field
    expect(screen.queryByLabelText(/cash out amount/i)).not.toBeInTheDocument()

    // Select "Cash Out"
    await userEvent.click(screen.getByLabelText(/cash out/i))

    // Cash out field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/cash out amount/i)).toBeInTheDocument()
    })

    // Field should be required
    const cashOutInput = screen.getByLabelText(/cash out amount/i)
    expect(cashOutInput).toHaveAttribute('required')
  })

  it('should hide joint applicant fields when hasJointApplicant is false', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    await navigateToStep3()

    // Initially no joint applicant
    expect(screen.queryByLabelText(/joint applicant income/i)).not.toBeInTheDocument()

    // Enable joint applicant
    await userEvent.click(screen.getByLabelText(/joint applicant/i))

    // Joint fields should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/joint applicant income/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/joint applicant age/i)).toBeInTheDocument()
    })
  })

  // Helper functions
  async function fillContactInfo() {
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/phone/i), '91234567')
  }

  async function navigateToRefinanceGoals() {
    // Implementation depends on form structure
  }

  async function navigateToStep3() {
    // Implementation depends on form structure
  }
})
```

---

## Template 3: Session Persistence

**For:** Testing localStorage integration with form state

```tsx
// lib/hooks/__tests__/FormSessionIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '@/components/forms/ProgressiveFormWithController'

describe('Form Session Persistence Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should save form data to localStorage on field change', async () => {
    const sessionId = 'test-session-123'

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId={sessionId}
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Fill some fields
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane Tan')
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@test.com')

    // Wait for debounced save (300ms)
    await waitFor(() => {
      const stored = localStorage.getItem(`nextnest_loan_application_${sessionId}`)
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.name).toBe('Jane Tan')
      expect(parsed.email).toBe('jane@test.com')
    }, { timeout: 1000 })
  })

  it('should restore form data on page reload', async () => {
    const sessionId = 'test-session-456'

    // Pre-populate localStorage (simulate previous session)
    const savedData = {
      name: 'Restored User',
      email: 'restored@test.com',
      phone: '98765432',
      loanType: 'new_purchase',
      version: '1.0',
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(
      `nextnest_loan_application_${sessionId}`,
      JSON.stringify(savedData)
    )

    // Render form
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId={sessionId}
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Data should be restored
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Restored User')
      expect(screen.getByLabelText(/email/i)).toHaveValue('restored@test.com')
      expect(screen.getByLabelText(/phone/i)).toHaveValue('98765432')
    })
  })

  it('should clear localStorage on successful form completion', async () => {
    const sessionId = 'test-session-789'
    const mockOnComplete = jest.fn()

    render(
      <ProgressiveFormMobile
        loanType="new_purchase"
        sessionId={sessionId}
        onComplete={mockOnComplete}
      />
    )

    // Fill and submit entire form
    await fillEntireForm()
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    // Should clear localStorage after completion
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()

      const stored = localStorage.getItem(`nextnest_loan_application_${sessionId}`)
      expect(stored).toBeNull()
    })
  })

  it('should expire old sessions after 7 days', () => {
    // Create old session (8 days ago)
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 8)

    localStorage.setItem('nextnest_loan_application_old', JSON.stringify({
      name: 'Old User',
      version: '1.0',
      lastUpdated: oldDate.toISOString()
    }))

    // Render new form (triggers cleanup)
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="new-session"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Old session should be removed
    const oldStored = localStorage.getItem('nextnest_loan_application_old')
    expect(oldStored).toBeNull()
  })

  async function fillEntireForm() {
    // Implementation depends on form structure
    await userEvent.type(screen.getByLabelText(/name/i), 'Complete User')
    await userEvent.type(screen.getByLabelText(/email/i), 'complete@test.com')
    // ... fill all required fields
  }
})
```

---

## Template 4: Real Calculation Engine Tests

**For:** Testing with actual Dr Elena v2 calculations (NO MOCKS)

```tsx
// components/forms/__tests__/InstantCalculationIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'
import { hdbBuyerScenario } from '@/tests/fixtures/dr-elena-v2-scenarios'

describe('Instant Calculation Integration (Real Engine)', () => {
  it('should calculate max loan for HDB buyer scenario', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Use fixture data
    await fillFormWithFixture(hdbBuyerScenario)

    // Trigger calculation
    fireEvent.click(screen.getByRole('button', { name: /get instant/i }))

    // Should show REAL calculation result
    await waitFor(() => {
      // Based on hdbBuyerScenario fixture:
      // Income: $5,000, Property: $500k HDB
      // Expected max loan: ~$375,000 (75% LTV)
      expect(screen.getByText(/\$375,000/)).toBeInTheDocument()
    })
  })

  async function fillFormWithFixture(fixture: any) {
    // Fill form with fixture data
    // Implementation depends on fixture structure
  }
})
```

---

## Running Integration Tests

```bash
# Run all integration tests
npm test -- --testPathPattern=Integration

# Run specific integration test
npm test -- ConditionalFieldsIntegration.test.tsx

# Run with coverage
npm test -- --coverage --testPathPattern=Integration
```

**Expected Output:**
```
PASS  components/forms/__tests__/ProgressiveFormIntegration.test.tsx
  Progressive Form Integration
    ✓ should validate all Step 1 fields (152ms)
    ✓ should advance to Step 2 after valid submission (98ms)
    ✓ should trigger instant calculation (234ms)

PASS  components/forms/__tests__/ConditionalFieldsIntegration.test.tsx
  Conditional Fields Integration
    ✓ should show development name for new launch (89ms)
    ✓ should show/hide cash out amount (112ms)

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Time:        3.456s
```

**References:**
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- User Event: https://testing-library.com/docs/user-event/intro
