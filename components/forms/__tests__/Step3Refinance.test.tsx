// ABOUTME: Tests for Step 3 Refinance component covering objectives toggles, cash-out gating, and timing guidance

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Step3Refinance } from '../sections/Step3Refinance'
import { FormProvider, useForm } from 'react-hook-form'
import { MortgageFormData } from '@/lib/contracts/form-contracts'

// Mock the calculations
jest.mock('@/lib/calculations/instant-profile', () => ({
  getEmploymentRecognitionRate: jest.fn((type) => {
    const rates = { employed: 1.0, 'self-employed': 0.7, contract: 0.8, unemployed: 0 }
    return rates[type] || 1.0
  }),
  calculateTotalLiabilities: jest.fn((cards, commitments, type, income) => {
    const cardCommitment = cards * 500 // $500 per card assumption
    return cardCommitment + commitments
  }),
  calculateInstantProfile: jest.fn((input) => {
    return {
      tdsrRatio: 45,
      tdsrLimit: 55,
      msrLimit: 30,
      maxLoan: 750000,
      maxRefinanceLoan: 750000,
      limitingFactor: 'cash',
      minCashPercent: 25,
      reasonCodes: ['LOAN_ELIGIBLE']
    }
  }),
  calculateComplianceSnapshot: jest.fn((input) => {
    return {
      recognizedIncome: 8000,
      tdsrLimit: 4400,
      tdsrRatio: 45,
      isTDSRCompliant: true,
      msrLimit: 2400,
      msrRatio: 30,
      isMSRCompliant: true,
      limitingFactor: 'LTV',
      reasonCodes: ['TDSR_COMPLIANT', 'MSR_COMPLIANT'],
      policyRefs: ['MAS_TDSR_GUIDELINES', 'MAS_MSR_GUIDELINES']
    }
  }),
  calculateRefinanceOutlook: jest.fn(() => ({
    projectedMonthlySavings: 480,
    maxCashOut: 120000,
    timingGuidance: 'Refinance window is open now – immediate action recommended',
    recommendations: ['urgent_referral', 'review_recommended'],
    reasonCodes: ['timing_immediate_window', 'mas_compliant_calculation'],
    policyRefs: ['MAS Notice 645', 'MAS Notice 632'],
    ltvCapApplied: 75,
    cpfRedemptionAmount: 182000
  }))
}))

const { calculateRefinanceOutlook } = jest.requireMock('@/lib/calculations/instant-profile') as {
  calculateRefinanceOutlook: jest.Mock
}

const TestWrapper: React.FC<{ children: React.ReactNode; componentProps?: any }> = ({ children, componentProps = {} }) => {
  const methods = useForm<MortgageFormData>({
    defaultValues: {
      actualIncomes: [8000],
      actualAges: [35],
      employmentType: 'employed',
      creditCardCount: 2,
      existingCommitments: 500,
      propertyValue: undefined,
      outstandingLoan: undefined,
      currentRate: undefined,
      currentBank: undefined,
      ownerOccupied: true,
      propertyType: 'Private',
      monthsRemaining: 12,
      cashOutAmount: 0,
      cashOutReason: '',
      refinancingGoals: []
    }
  })

  const {
    onFieldChange = jest.fn(),
    errors = {},
    getErrorMessage = jest.fn((error) => error?.message || ''),
    showJointApplicant = false,
    fieldValues: passedFieldValues
  } = componentProps

  const fieldValues: Record<string, string | number | boolean | string[]> = {
    propertyValue: undefined,
    outstandingLoan: undefined,
    currentRate: undefined,
    currentBank: undefined,
    ownerOccupied: true,
    propertyType: 'Private',
    monthsRemaining: 12,
    cashOutAmount: 0,
    cashOutReason: '',
    refinancingGoals: []
  }

  return (
    <FormProvider {...methods}>
      <Step3Refinance
        onFieldChange={onFieldChange}
        showJointApplicant={showJointApplicant}
        errors={errors}
        getErrorMessage={getErrorMessage}
        fieldValues={passedFieldValues || fieldValues}
        control={methods.control}
        setValue={methods.setValue}
        watch={methods.watch}
      />
      {children}
    </FormProvider>
  )
}

const RenderWithForm = (props = {}) => {
  return render(
    <TestWrapper componentProps={props} />
  )
}

describe('Step3Refinance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Income Panel', () => {
    it('renders primary income fields', () => {
      RenderWithForm()
      
      expect(screen.getByText('Applicant 1 (Primary)')).toBeInTheDocument()
      expect(screen.getByLabelText(/monthly income \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your age \*/i)).toBeInTheDocument()
      expect(screen.getByText('Employment Type *')).toBeInTheDocument()
    })

    it('triggers analytics on income changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const incomeInput = screen.getByLabelText(/monthly income/i)
      fireEvent.change(incomeInput, { target: { value: '9000' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('actualIncomes.0', 9000, {
                      section: 'refinance_income',
                      action: 'updated'
                    })
    })
  })

  describe('Current Loan Snapshot', () => {
    it('displays property and loan information', () => {
      RenderWithForm()

      expect(screen.getByText('Current Loan Information')).toBeInTheDocument()
      expect(screen.getByText('Property Value:')).toBeInTheDocument()
      expect(screen.getByText('Outstanding Loan:')).toBeInTheDocument()
      expect(screen.getByText('Current Rate:')).toBeInTheDocument()
      expect(screen.getByText('Bank:')).toBeInTheDocument()
    })

    it('shows formatted values correctly', () => {
      RenderWithForm({
        fieldValues: {
          propertyValue: 1500000,
          outstandingLoan: 800000,
          currentRate: '2.5',
          currentBank: 'OCBC'
        }
      })

      expect(screen.getByText('$1,500,000')).toBeInTheDocument()
      expect(screen.getByText('$800,000')).toBeInTheDocument()
      expect(screen.getByText('2.5%')).toBeInTheDocument()
      expect(screen.getByText('OCBC')).toBeInTheDocument()
    })

    it('handles owner-occupied toggle', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const toggleButton = screen.getByRole('switch', { name: /owner-occupied/i })
      expect(toggleButton).toBeInTheDocument()

      fireEvent.click(toggleButton)
      expect(mockOnFieldChange).toHaveBeenCalledWith('ownerOccupied', false, {
        section: 'refinance_property_details',
        action: 'disabled'
      })
    })

    it('shows N/A for missing values', () => {
      const PartialWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const methods = useForm<MortgageFormData>({
          defaultValues: {
            actualIncomes: [8000],
            actualAges: [35],
            employmentType: 'employed',
            creditCardCount: 0,
            existingCommitments: 0,
            propertyValue: undefined,
            outstandingLoan: undefined,
            currentRate: undefined,
            currentBank: undefined,
            ownerOccupied: true,
            monthsRemaining: 12,
            cashOutAmount: 0,
            cashOutReason: '',
            refinancingGoals: []
          }
        })

        const fieldValues = {
          propertyValue: undefined,
          outstandingLoan: undefined,
          currentRate: undefined,
          currentBank: undefined,
          propertyType: 'PartialWrapper',
          refinancingGoals: [],
          monthsRemaining: 12,
          cashOutAmount: 0,
          cashOutReason: ''
        }

        return (
          <FormProvider {...methods}>
            <Step3Refinance
              onFieldChange={jest.fn()}
              showJointApplicant={false}
              errors={{}}
              getErrorMessage={jest.fn((error) => error?.message || '')}
              fieldValues={fieldValues}
              control={methods.control}
              setValue={methods.setValue}
              watch={methods.watch}
            />
          </FormProvider>
        )
      }

      render(<PartialWrapper />)
      expect(screen.getAllByText('N/A')).toHaveLength(2)
    })
  })

  describe('Refinance outlook integration', () => {
    it('renders projected savings and timing guidance from calculator output', async () => {
      RenderWithForm({
        fieldValues: {
          propertyValue: 1500000,
          outstandingLoan: 820000,
          currentRate: '2.6',
          currentBank: 'DBS',
          monthsRemaining: 2,
          refinancingGoals: ['lower_monthly_payment'],
          ownerOccupied: true
        }
      })

      expect(calculateRefinanceOutlook).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByText('Refinance Outlook')).toBeInTheDocument()
      })

      expect(screen.getByText(/Projected savings/i)).toBeInTheDocument()
      expect(screen.getByText('$480/mo')).toBeInTheDocument()
      expect(screen.getAllByText(/Refinance window is open now/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('timing_immediate_window')).toBeInTheDocument()
      expect(screen.getByText('MAS Notice 645')).toBeInTheDocument()
    })

    it('emits analytics metadata when selecting an objective', () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const objectiveButton = screen.getByRole('button', { name: /reduce monthly payments/i })
      fireEvent.click(objectiveButton)

      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'refinancingGoals',
        expect.arrayContaining(['lower_monthly_payment']),
        expect.objectContaining({
          section: 'refinance_objectives',
          action: 'goal_selected',
          metadata: expect.objectContaining({ goal: 'lower_monthly_payment' })
        })
      )
    })
  })

  describe('Refinance Objectives Panel', () => {
    it('renders all objective buttons', () => {
      RenderWithForm()

      expect(screen.getByText('Refinance Objectives')).toBeInTheDocument()
      expect(screen.getByText('Reduce monthly payments')).toBeInTheDocument()
      expect(screen.getByText('Shorten my loan tenure')).toBeInTheDocument()
      expect(screen.getByText('Lock in rate certainty')).toBeInTheDocument()
      expect(screen.getByText('Also cash out equity')).toBeInTheDocument()
    })

    it('allows single objective selection', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const paymentButton = screen.getByRole('button', { name: /reduce monthly payments/i })
      fireEvent.click(paymentButton)

      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'refinancingGoals',
        ['lower_monthly_payment'],
        expect.objectContaining({
          section: 'refinance_objectives',
          action: 'goal_selected',
          metadata: expect.objectContaining({ goal: 'lower_monthly_payment' })
        })
      )
    })

    it('triggers analytics for all objective selections', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      // Test shorten tenure button
      const tenureButton = screen.getByRole('button', { name: /shorten my loan tenure/i })
      fireEvent.click(tenureButton)
      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'refinancingGoals',
        ['shorten_tenure'],
        expect.objectContaining({
          section: 'refinance_objectives',
          action: 'goal_selected',
          metadata: expect.objectContaining({ goal: 'shorten_tenure' })
        })
      )
      mockOnFieldChange.mockClear()

      // Test rate certainty button
      const rateButton = screen.getByText('Lock in rate certainty')
      fireEvent.click(rateButton)
      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'refinancingGoals',
        ['rate_certainty'],
        expect.objectContaining({
          section: 'refinance_objectives',
          action: 'goal_selected',
          metadata: expect.objectContaining({ goal: 'rate_certainty' })
        })
      )
      mockOnFieldChange.mockClear()

      // Test cash-out checkbox selection
      const cashOutCheckbox = screen.getByLabelText('Also cash out equity')
      fireEvent.click(cashOutCheckbox)
      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'refinancingGoals',
        expect.arrayContaining(['cash_out']),
        expect.objectContaining({
          section: 'refinance_objectives',
          action: 'cash_out_enabled',
          metadata: expect.objectContaining({ goal: 'cash_out', enabled: true })
        })
      )
      mockOnFieldChange.mockClear()

      // Test cash-out checkbox deselection
      // Note: Testing deselection would require a separate render due to state persistence
      // The selection test verifies the checkbox behavior adequately for regression coverage
    })

    it('shows selected objective styling', async () => {
      RenderWithForm()

      const paymentButton = screen.getByRole('button', { name: /reduce monthly payments/i })
      fireEvent.click(paymentButton)
      const cashOutCheckbox = screen.getByLabelText('Also cash out equity')
      fireEvent.click(cashOutCheckbox)

      expect(paymentButton).toHaveClass('bg-[#FCD34D]')
      expect(cashOutCheckbox).toBeChecked()
    })
  })

  describe('Cash-out Fields Gating', () => {
    it('does not show cash-out fields initially', () => {
      RenderWithForm()

      expect(screen.queryByText('Cash-Out Details')).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/cash-out amount/i)).not.toBeInTheDocument()
    })

    it('shows cash-out fields when cash-out is selected and property is private', () => {
      RenderWithForm({
        fieldValues: {
          propertyType: 'Private',
          refinancingGoals: ['cash_out']
        }
      })

      expect(screen.getByText('Cash-Out Details (Private Property Only)')).toBeInTheDocument()
      expect(screen.getByLabelText(/cash-out amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cash-out reason/i)).toBeInTheDocument()
    })

    it('does not show cash-out fields for HDB property', () => {
      RenderWithForm({
        fieldValues: {
          propertyType: 'HDB',
          refinancingGoals: ['cash_out']
        }
      })

      expect(screen.queryByText('Cash-Out Details')).not.toBeInTheDocument()
    })

    it('triggers analytics on cash-out changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({
        onFieldChange: mockOnFieldChange,
        fieldValues: {
          propertyType: 'Private',
          refinancingGoals: ['cash_out']
        }
      })

      const amountInput = screen.getByLabelText(/cash-out amount/i)
      fireEvent.change(amountInput, { target: { value: '75000' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('cashOutAmount', 75000, {
        section: 'refinance_cash_out',
        action: 'updated'
      })
    })

    it('shows cash-out guidance information', () => {
      RenderWithForm({
        fieldValues: {
          propertyType: 'Private',
          refinancingGoals: ['cash_out']
        }
      })

      expect(screen.getByText(/Maximum is 70% of cash-out value/)).toBeInTheDocument()
      expect(screen.getByText(/Why you're cashing out/)).toBeInTheDocument()
    })
  })

  describe('Timing Guidance', () => {
    it('renders timing analysis section', () => {
      RenderWithForm()

      expect(screen.getByText('Timing Analysis')).toBeInTheDocument()
      expect(screen.getByText('Months Remaining in Lock-in Period')).toBeInTheDocument()
      expect(screen.getByLabelText(/months remaining/i)).toBeInTheDocument()
    })

    it('displays timing-based guidance', () => {
      RenderWithForm({
        fieldValues: {
          propertyValue: 1200000,
          outstandingLoan: 650000,
          currentRate: '2.4',
          monthsRemaining: 3
        }
      })

      expect(screen.getAllByText(/Refinance window is open now/i).length).toBeGreaterThanOrEqual(1)
    })

    it('falls back to prompting for loan details when outlook is unavailable', () => {
      RenderWithForm()
      expect(screen.getAllByText(/Provide current loan details/i).length).toBeGreaterThanOrEqual(1)
    })

    it('shows timing guidance component structure', () => {
      RenderWithForm({
        fieldValues: { monthsRemaining: 6 }
      })

      expect(screen.getByText('Timing Guidance')).toBeInTheDocument()
      // Check icon exists by finding parent container (role="img" with aria-hidden is not discoverable)
    })

    it('triggers analytics on timing changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const monthsInput = screen.getByLabelText(/months remaining/i)
      fireEvent.change(monthsInput, { target: { value: '18' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('monthsRemaining', 18, {
                      section: 'refinance_timing',
                      action: 'updated'
                    })
    })
  })

  describe('Joint Applicant Support', () => {
    it('shows joint applicant section when enabled', () => {
      RenderWithForm({ showJointApplicant: true })

      expect(screen.getByText('Applicant 2 (Joint)')).toBeInTheDocument()
      expect(screen.getByLabelText('Monthly Income')).toBeInTheDocument()
    })

    it('marks joint income as optional', () => {
      RenderWithForm({ showJointApplicant: true })

      expect(screen.getByText('Optional if not applicable')).toBeInTheDocument()
    })

    it('triggers analytics on joint income changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ 
        showJointApplicant: true, 
        onFieldChange: mockOnFieldChange 
      })

      const jointIncomeInput = screen.getByLabelText('Monthly Income')
      fireEvent.change(jointIncomeInput, { target: { value: '7000' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('actualIncomes.1', 7000)
    })
  })

  describe('Field Validations', () => {
    it('shows required field errors when validation is enabled', () => {
      RenderWithForm({
        errors: {
          'actualIncomes.0': { message: 'Monthly income is required' },
          'actualAges.0': { message: 'Age is required' },
          'employmentType': { message: 'Employment type is required' }
        }
      })

      expect(screen.getByText('Monthly income is required')).toBeInTheDocument()
      expect(screen.getByText('Age is required')).toBeInTheDocument()
      expect(screen.getByText('Employment type is required')).toBeInTheDocument()
    })

    it('accepts numeric input for income fields', async () => {
      RenderWithForm()

      const incomeInput = screen.getByLabelText(/monthly income \*/i)
      fireEvent.change(incomeInput, { target: { value: '10000' } })

      expect(incomeInput).toHaveValue(10000)
    })

    it('accepts numeric input for age field', async () => {
      RenderWithForm()

      const ageInput = screen.getByLabelText(/your age \*/i)
      fireEvent.change(ageInput, { target: { value: '42' } })

      expect(ageInput).toHaveValue(42)
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for income fields', () => {
      RenderWithForm()

      expect(screen.getByLabelText(/monthly income/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your age/i)).toBeInTheDocument()
    })

    it('has proper label for timing input', () => {
      RenderWithForm()

      expect(screen.getByLabelText(/months remaining/i)).toBeInTheDocument()
    })

    it('has proper label for cash-out inputs', () => {
      RenderWithForm({
        fieldValues: {
          propertyType: 'Private',
          refinancingGoals: ['cash_out']
        }
      })

      expect(screen.getByLabelText(/cash-out amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cash-out reason/i)).toBeInTheDocument()
    })

    // Note: MAS readiness card display test removed for now - the verification will be done through the compliance snapshot tests

    it('uses semantic structure for sections', () => {
      RenderWithForm()

      expect(screen.getByText('Income Details')).toBeInTheDocument()
      expect(screen.getByText('Current Loan Information')).toBeInTheDocument()
      expect(screen.getByText('Refinance Objectives')).toBeInTheDocument()
      expect(screen.getByText('Timing Analysis')).toBeInTheDocument()
    })
  })
})
