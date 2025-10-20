// ABOUTME: Tests for chat transition screen triggering after form completion.
// ABOUTME: Ensures users successfully reach AI broker chat interface.

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'
import { LoanType } from '@/lib/contracts/form-contracts'

const mockPublishEvent = jest.fn(async () => {})
const mockCreateEvent = jest.fn((eventType: string, aggregateId: string, payload: any) => ({
  eventType,
  aggregateId,
  payload,
  metadata: {
    timestamp: new Date(),
    sessionId: 'test-session',
    correlationId: 'test-correlation'
  }
}))

jest.mock('@/lib/events/event-bus', () => {
  const actual = jest.requireActual('@/lib/events/event-bus')
  return {
    ...actual,
    useEventPublisher: () => mockPublishEvent,
    useCreateEvent: () => mockCreateEvent
  }
})

// Mock ChatTransitionScreen to avoid Chatwoot API calls in tests
jest.mock('../ChatTransitionScreen', () => {
  return function MockChatTransitionScreen() {
    return <div data-testid="chat-transition-screen">Connecting to AI broker...</div>
  }
})

// Mock ChatWidgetLoader
jest.mock('@/components/forms/ChatWidgetLoader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock the calculator
jest.mock('@/lib/calculations/instant-profile', () => ({
  calculateInstantProfile: jest.fn(() => ({
    maxLoan: 750000,
    maxLTV: 75,
    minCashPercent: 5,
    absdRate: 0,
    tdsrAvailable: 5000,
    limitingFactor: 'LTV',
    downpaymentRequired: 250000,
    cpfAllowed: true,
    cpfAllowedAmount: 180000,
    tenureCapYears: 25,
    tenureCapSource: 'regulation',
    reasonCodes: ['ltv_reduced_age_trigger'],
    policyRefs: ['MAS Notice 645']
  })),
  roundMonthlyPayment: jest.fn((amount) => Math.round(amount)),
  getEmploymentRecognitionRate: jest.fn(() => 1.0)
}))

// Mock Radix Select (simplified version for tests)
jest.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react')

  const SelectContext = React.createContext<any>(null)

  const Select = ({ value, onValueChange, children }: any) => {
    const [selectedValue, setSelectedValue] = React.useState<string | undefined>(value)

    React.useEffect(() => {
      setSelectedValue(value)
    }, [value])

    const selectValue = React.useCallback((nextValue: string) => {
      setSelectedValue(nextValue)
      if (onValueChange) {
        onValueChange(nextValue)
      }
    }, [onValueChange])

    const contextValue = React.useMemo(() => ({
      value: selectedValue,
      selectValue
    }), [selectedValue, selectValue])

    return (
      React.createElement(SelectContext.Provider, { value: contextValue },
        React.createElement('div', { role: 'presentation' }, children)
      )
    )
  }

  const SelectTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => {
    const context = React.useContext(SelectContext)
    return React.createElement('button', { ...props, ref, type: 'button' }, props.children)
  })
  SelectTrigger.displayName = 'SelectTrigger'

  const SelectValue = React.forwardRef<HTMLSpanElement, any>(({ placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    return React.createElement('span', { ...props, ref }, context?.value ?? placeholder ?? '')
  })
  SelectValue.displayName = 'SelectValue'

  const SelectContent = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => {
    return React.createElement('div', { ...props, ref, role: 'listbox' }, children)
  })
  SelectContent.displayName = 'SelectContent'

  const SelectItem = React.forwardRef<HTMLDivElement, any>(({ children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    return React.createElement(
      'div',
      {
        ...props,
        ref,
        role: 'option',
        onClick: () => context?.selectValue(value)
      },
      children
    )
  })
  SelectItem.displayName = 'SelectItem'

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
  }
})

describe('Chat Transition After Form Completion', () => {
  const defaultProps = {
    loanType: 'new_purchase' as LoanType,
    sessionId: 'test-session-123',
    onStepCompletion: jest.fn(),
    onAIInsight: jest.fn(),
    onScoreUpdate: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show ChatTransitionScreen after completing Step 4 (index 3)', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        {...defaultProps}
      />
    )

    // Step 1: Fill contact info (Step 1 - "Who You Are")
    const nameInput = screen.getByLabelText(/Full Name/i)
    const emailInput = screen.getByLabelText(/Email Address/i)
    const phoneInput = screen.getByLabelText(/Phone Number/i)

    await user.type(nameInput, 'John Tan')
    await user.type(emailInput, 'john.tan@example.com')
    await user.type(phoneInput, '91234567')

    const continueBtn = screen.getByRole('button', { name: /continue to property details/i })
    await user.click(continueBtn)

    // Step 2: Fill property details (Step 2 - "What You Need")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get instant loan estimate/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    // Select property category
    const propertyCategorySelect = screen.getByLabelText(/Property Category/i)
    await user.click(propertyCategorySelect)

    // Wait for dropdown and select resale
    await waitFor(() => {
      const resaleOption = screen.getByRole('option', { name: /Resale/i })
      return resaleOption
    })
    const resaleOption = screen.getByRole('option', { name: /Resale/i })
    await user.click(resaleOption)

    // Fill remaining required fields for Step 2
    const priceRangeInput = screen.getByLabelText(/Property Value/i)
    await user.type(priceRangeInput, '500000')

    const ageInput = screen.getByLabelText(/Your Age/i)
    await user.type(ageInput, '35')

    // Click "Get instant loan estimate" button
    const estimateBtn = screen.getByRole('button', { name: /get instant loan estimate/i })
    await user.click(estimateBtn)

    // Step 3: Fill financial details (Step 3 - "Your Finances")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Connect with AI Mortgage Specialist/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    // Fill minimum required fields
    const incomeInput = screen.getByLabelText(/income/i)
    await user.type(incomeInput, '5000')

    // Click "Connect with AI Mortgage Specialist" button
    const connectBtn = screen.getByRole('button', { name: /Connect with AI Mortgage Specialist/i })
    await user.click(connectBtn)

    // VERIFY: ChatTransitionScreen should appear
    await waitFor(() => {
      expect(screen.getByTestId('chat-transition-screen')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should NOT show ChatTransitionScreen before Step 4 completion', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        {...defaultProps}
      />
    )

    // Fill Step 1
    await user.type(screen.getByLabelText(/Full Name/i), 'John Tan')
    await user.type(screen.getByLabelText(/Email Address/i), 'john.tan@example.com')
    await user.type(screen.getByLabelText(/Phone Number/i), '91234567')

    // VERIFY: ChatTransitionScreen should NOT appear at Step 1
    expect(screen.queryByTestId('chat-transition-screen')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continue to property details/i }))

    // Wait for Step 2
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get instant loan estimate/i })).toBeInTheDocument()
    })

    // VERIFY: ChatTransitionScreen should NOT appear at Step 2
    expect(screen.queryByTestId('chat-transition-screen')).not.toBeInTheDocument()
  })

  it('should verify currentStep === 3 triggers transition (not === 2)', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <ProgressiveFormWithController
        {...defaultProps}
      />
    )

    // Step 1 - currentStep should be 1
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument() // Display is currentStep + 1

    await user.type(screen.getByLabelText(/Full Name/i), 'John Tan')
    await user.type(screen.getByLabelText(/Email Address/i), 'john.tan@example.com')
    await user.type(screen.getByLabelText(/Phone Number/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue to property details/i }))

    // Step 2 - currentStep should be 2
    await waitFor(() => {
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument()
    })

    // Select property category to enable form progression
    const propertyCategorySelect = screen.getByLabelText(/Property Category/i)
    await user.click(propertyCategorySelect)
    await waitFor(() => screen.getByRole('option', { name: /Resale/i }))
    await user.click(screen.getByRole('option', { name: /Resale/i }))

    // Fill minimum required fields
    const priceInput = screen.getByLabelText(/Property Value/i)
    await user.type(priceInput, '500000')
    const ageInput = screen.getByLabelText(/Your Age/i)
    await user.type(ageInput, '35')

    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Step 3 - currentStep should be 3 (Step 4 of 4)
    await waitFor(() => {
      expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Fill minimum Step 3 fields
    const incomeInput = screen.getByLabelText(/income/i)
    await user.type(incomeInput, '5000')

    // At this point currentStep === 3, clicking connect should trigger transition
    const connectBtn = screen.getByRole('button', { name: /Connect with AI Mortgage Specialist/i })
    await user.click(connectBtn)

    // VERIFY: Transition happens because currentStep === 3 (fixed from === 2)
    await waitFor(() => {
      expect(screen.getByTestId('chat-transition-screen')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  // Note: Navigation testing verified manually - onTransitionComplete now includes:
  // window.location.href = `/chat?conversation=${conversationId}`
  // Full E2E test would require complex window.location mocking
})
