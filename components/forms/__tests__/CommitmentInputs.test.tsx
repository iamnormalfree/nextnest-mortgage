// ABOUTME: Tests for simplified commitment inputs in Step 4.
// ABOUTME: Ensures Yes/No gate reduces friction for users with no loans.

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

// Mock ChatTransitionScreen to avoid Chatwoot API calls in tests
jest.mock('../ChatTransitionScreen', () => {
  return function MockChatTransitionScreen() {
    return <div data-testid="chat-transition-screen">Connecting to AI broker...</div>
  }
})

describe('Simplified Commitment Inputs', () => {
  it('should hide commitment fields when user selects No', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "No" for existing loans
    await screen.findByText(/do you have any existing loans/i)
    const noButton = screen.getByRole('button', { name: /^No$/i })
    await user.click(noButton)

    // VERIFY: Commitment checkboxes are hidden
    await waitFor(() => {
      expect(screen.queryByLabelText(/property loans/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/car loans/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/credit cards/i)).not.toBeInTheDocument()
    })
  })

  it('should show commitment fields when user selects Yes', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "Yes" for existing loans
    await screen.findByText(/do you have any existing loans/i)
    const yesButton = screen.getByRole('button', { name: /^Yes$/i })
    await user.click(yesButton)

    // VERIFY: Commitment checkboxes are shown
    await waitFor(() => {
      expect(screen.getByLabelText(/property loans/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/car loans/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/credit cards/i)).toBeInTheDocument()
    })
  })

  it('should clear commitment data when toggling from Yes to No', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "Yes"
    await screen.findByText(/do you have any existing loans/i)
    const yesButton = screen.getByRole('button', { name: /^Yes$/i })
    await user.click(yesButton)

    // Fill in some commitment data
    await waitFor(() => {
      expect(screen.getByLabelText(/car loans/i)).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText(/car loans/i))

    // Wait for monthly payment field to appear after checking the checkbox
    const carLoanPaymentLabel = await screen.findByText(/car loan monthly payment/i)
    const carLoanPaymentInput = carLoanPaymentLabel.closest('label')?.querySelector('input')
    expect(carLoanPaymentInput).toBeInTheDocument()

    if (carLoanPaymentInput) {
      await user.type(carLoanPaymentInput, '500')
    }

    // Click "No"
    const noButton = screen.getByRole('button', { name: /^No$/i })
    await user.click(noButton)

    // Click "Yes" again
    await user.click(yesButton)

    // VERIFY: Previously entered data is cleared
    await waitFor(() => {
      expect(screen.getByLabelText(/car loans/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/car loans/i)).not.toBeChecked()
  })

  it('should allow form submission with No commitments', async () => {
    const user = userEvent.setup()
    const mockOnStepCompletion = jest.fn()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
        onStepCompletion={mockOnStepCompletion}
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "No" for commitments
    await screen.findByText(/do you have any existing loans/i)
    const noButton = screen.getByRole('button', { name: /^No$/i })
    await user.click(noButton)

    // Click "Connect with AI Mortgage Specialist"
    const connectButton = screen.getByRole('button', { name: /connect with ai mortgage specialist/i })
    await user.click(connectButton)

    // VERIFY: Form submission succeeds (ChatTransitionScreen appears)
    await waitFor(() => {
      expect(screen.getByTestId('chat-transition-screen')).toBeInTheDocument()
    }, { timeout: 3000 })

    // VERIFY: onStepCompletion was called
    expect(mockOnStepCompletion).toHaveBeenCalled()
  })
})
