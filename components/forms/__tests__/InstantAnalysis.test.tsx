/**
 * ABOUTME: Tests for instant analysis display in Step 3 (property details).
 * ABOUTME: Ensures Dr Elena calculations are presented in user-friendly format.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Instant Analysis Display', () => {
  it('should show max loan amount prominently', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 3
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Trigger instant calculation
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Big number is shown
    expect(await screen.findByText(/you qualify for up to/i)).toBeInTheDocument()
    expect(screen.getByText(/\$284,000/)).toBeInTheDocument() // HDB default scenario
  })

  it('should NOT show technical persona codes by default', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 3 and trigger calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Technical codes are hidden
    expect(screen.queryByText(/msr_binding/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tenure_cap_property_limit/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/MAS Notice 645/i)).not.toBeInTheDocument()
  })

  it('should show user-friendly summary instead of jargon', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate and trigger calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Plain English summary is shown
    expect(await screen.findByText(/based on your income/i)).toBeInTheDocument()
    // Could be "MSR guidelines" or "TDSR" depending on calculation
  })

  it('should toggle detailed breakdown on click', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate and trigger calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Details are hidden initially
    expect(screen.queryByText(/monthly payment/i)).not.toBeInTheDocument()

    // Click "View full breakdown"
    const toggleBtn = await screen.findByRole('button', { name: /view full breakdown/i })
    await user.click(toggleBtn)

    // VERIFY: Details are now visible
    expect(await screen.findByText(/monthly payment/i)).toBeInTheDocument()
    expect(screen.getByText(/down payment/i)).toBeInTheDocument()

    // Click again to hide
    await user.click(screen.getByRole('button', { name: /hide details/i }))

    // VERIFY: Details are hidden again
    expect(screen.queryByText(/monthly payment/i)).not.toBeInTheDocument()
  })
})
