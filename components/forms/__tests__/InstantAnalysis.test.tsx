/**
 * ABOUTME: Tests for instant analysis display in Step 2 (What You Need).
 * ABOUTME: Ensures Dr Elena calculations appear automatically with default values.
 */

import { render, screen, waitFor } from '@testing-library/react'
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

    // Navigate to Step 2 (What You Need) - default values should trigger auto-calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Wait for Step 2 to load and instant analysis to auto-trigger
    // Default values: propertyCategory='resale', propertyType='HDB', priceRange=500000, combinedAge=35
    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })

    // Wait for instant calculation to complete (500ms debounce + 1000ms display timer = ~1500ms)
    await waitFor(
      () => {
        expect(screen.getByText(/you qualify for up to/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // VERIFY: Big number is shown (any formatted dollar amount)
    expect(screen.getByText(/\$[\d,]+/)).toBeInTheDocument()
  })

  it('should NOT show technical persona codes by default', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 2
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })

    // Wait for instant analysis to appear (auto-triggered by default values)
    await waitFor(
      () => {
        expect(screen.getByText(/you qualify for up to/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // VERIFY: Technical codes are NOT shown in the simplified instant analysis
    // Note: Policy refs might appear in MAS Readiness on Step 3, but not in Step 2 instant analysis
    expect(screen.queryByText(/msr_binding/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tenure_cap_property_limit/i)).not.toBeInTheDocument()
  })

  it('should show user-friendly summary instead of jargon', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 2
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })

    // Wait for instant analysis to appear
    await waitFor(
      () => {
        expect(screen.getByText(/you qualify for up to/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // VERIFY: Plain English summary is shown
    // Summary should explain limiting factor in user-friendly language
    const summaryPatterns = [
      /based on your income/i,
      /can borrow comfortably/i,
      /optimized for healthy/i,
      /loan amount is set/i
    ]

    const hasUserFriendlySummary = summaryPatterns.some(pattern =>
      screen.queryByText(pattern)
    )

    expect(hasUserFriendlySummary).toBe(true)
  })

  it('should toggle detailed breakdown on click', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 2
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })

    // Wait for instant analysis to appear
    await waitFor(
      () => {
        expect(screen.getByText(/you qualify for up to/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // VERIFY: Details are hidden initially
    expect(screen.queryByText(/monthly payment/i)).not.toBeInTheDocument()

    // Click "View full breakdown"
    const toggleBtn = screen.getByRole('button', { name: /view full breakdown/i })
    await user.click(toggleBtn)

    // VERIFY: Details are now visible
    await waitFor(() => {
      expect(screen.getByText(/monthly payment/i)).toBeInTheDocument()
    })
    expect(screen.getAllByText(/down payment/i).length).toBeGreaterThan(0)

    // Click again to hide
    await user.click(screen.getByRole('button', { name: /hide details/i }))

    // VERIFY: Details are hidden again
    await waitFor(() => {
      expect(screen.queryByText(/monthly payment/i)).not.toBeInTheDocument()
    })
  })
})
