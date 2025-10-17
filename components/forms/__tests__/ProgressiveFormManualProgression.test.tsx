// ABOUTME: Regression tests for manual progression of the progressive form
// ABOUTME: Ensures Step 1 waits for explicit submit before advancing

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

jest.mock('@/lib/analytics/conversion-tracking', () => ({
  conversionTracker: {
    trackFormStepCompleted: jest.fn().mockResolvedValue(undefined),
    trackFormCompletion: jest.fn().mockResolvedValue(undefined),
    trackChatTransitionStart: jest.fn().mockResolvedValue(undefined),
    trackChatTransitionFallback: jest.fn().mockResolvedValue(undefined),
    trackChatTransitionSuccess: jest.fn().mockResolvedValue(undefined),
    trackFormAbandonment: jest.fn().mockResolvedValue(undefined),
    clearEvents: jest.fn()
  }
}))

// Prevent fetch errors if any analytics code slips through
global.fetch = global.fetch ?? (() => Promise.resolve({ ok: true, json: async () => ({}) }))

const TestWrapper: React.FC = () => (
  <ProgressiveFormWithController
    loanType="new_purchase"
    sessionId="test-session"
    onStepCompletion={jest.fn()}
    onAIInsight={jest.fn()}
    onScoreUpdate={jest.fn()}
  />
)

describe('ProgressiveFormWithController - Manual Progression', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  test('stays on Step 2 of 4 (contact details) until the user submits the form', async () => {
    render(<TestWrapper />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const phoneInput = screen.getByLabelText(/phone number/i)

    await user.type(nameInput, 'Alex Tan')
    await user.type(emailInput, 'alex@example.com')
    await user.type(phoneInput, '91234567')

    const getStepHeading = (label: string) =>
      screen.getByText((content, element) => {
        if (element?.tagName.toLowerCase() !== 'h3') return false
        return content.replace(/\s+/g, ' ').includes(label)
      })

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(getStepHeading('Step 2 of 4')).toBeInTheDocument()
    expect(screen.queryByLabelText(/property category/i)).not.toBeInTheDocument()

    const continueButton = screen.getByRole('button', { name: /continue to property details/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(getStepHeading('Step 3 of 4')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
  })
})
