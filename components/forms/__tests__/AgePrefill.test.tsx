/**
 * ABOUTME: Tests for age pre-fill from Step 2 to Step 4.
 * ABOUTME: Ensures user doesn't have to re-enter age information.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Age Pre-fill in Step 4', () => {
  it('should pre-fill age for single applicant', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Step 2: Fill contact info
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: Combined Age defaults to 35 (from form-config.ts)
    // Click through to Step 4
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: "Your Age" field is pre-filled with 35
    await screen.findByLabelText(/your age/i)
    const ageInput = screen.getByLabelText(/your age/i)
    expect(ageInput).toHaveValue(35) // Default from Step 2
  })

  it('should pre-fill age from combined age value', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Step 2: Fill contact info
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: Change combined age to 80
    await screen.findByLabelText(/combined age/i)
    const combinedAgeInput = screen.getByLabelText(/combined age/i)
    await user.clear(combinedAgeInput)
    await user.type(combinedAgeInput, '80')

    // Progress to Step 4
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Age is pre-filled with 80 (full combined age, since joint applicant not yet enabled)
    await screen.findByLabelText(/your age/i)
    const age1Input = screen.getByLabelText(/your age/i)
    expect(age1Input).toHaveValue(80)
  })

  it('should allow user to edit pre-filled age', async () => {
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

    // Edit age from 35 to 42
    await screen.findByLabelText(/your age/i)
    const ageInput = screen.getByLabelText(/your age/i)
    await user.clear(ageInput)
    await user.type(ageInput, '42')

    // VERIFY: Age is updated
    expect(ageInput).toHaveValue(42)
  })
})
