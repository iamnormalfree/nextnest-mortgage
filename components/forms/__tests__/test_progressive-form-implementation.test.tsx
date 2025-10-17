// ABOUTME: Verifies Step 2 UI renders correctly after completing Step 1 inputs
// ABOUTME: Ensures optional context toggle appears for new launch scenarios

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

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

describe('ProgressiveForm Step 2 implementation', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  test('renders property details inputs and optional context toggle', async () => {
    render(<TestWrapper />)

    await user.type(screen.getByLabelText(/full name/i), 'Jamie Lee')
    await user.type(screen.getByLabelText(/email address/i), 'jamie@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '98765432')

    const continueButton = screen.getByRole('button', { name: /continue to property details/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/property type/i)).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText(/property category/i))
    const newLaunchOption = await screen.findByRole('option', { name: /new launch/i })
    await user.click(newLaunchOption)

    await waitFor(() => {
      expect(screen.getByText(/optional context/i)).toBeInTheDocument()
    })
  })
})
