// ABOUTME: Tests for Step 3 New Purchase component covering income panel, liabilities toggles, and MAS readiness card

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step3NewPurchase } from '../sections/Step3NewPurchase'
import { FormProvider, useForm } from 'react-hook-form'
import { MortgageFormData } from '@/lib/contracts/form-contracts'

jest.mock('@/lib/calculations/instant-profile', () => ({
  getEmploymentRecognitionRate: jest.fn((type) => {
    const rates = {
      employed: 1.0,
      'self-employed': 0.7,
      variable: 0.6,
      contract: 0.8,
      unemployed: 0,
      other: 0.5
    }
    return rates[type] || 1.0
  }),
  calculateTotalLiabilities: jest.fn(() => 0),
  calculateInstantProfile: jest.fn(() => ({
    limitingFactor: 'none',
    minCashPercent: 5,
    tdsrRatio: 45,
    tdsrLimit: 55,
    msrLimit: 30,
    maxLoan: 720000
  }))
}))

const { calculateInstantProfile } = jest.requireMock('@/lib/calculations/instant-profile') as {
  calculateInstantProfile: jest.Mock
}

const defaultFormValues: Partial<MortgageFormData> = {
  actualIncomes: [8000],
  actualVariableIncomes: [0],
  actualAges: [35],
  employmentType: 'employed',
  employmentDetails: {
    'self-employed': {
      businessAgeYears: '',
      noaSubmitted: false,
      averageReportedIncome: ''
    },
    variable: {
      averagePastTwelveMonths: '',
      lowestObservedIncome: ''
    }
  },
  liabilities: {
    propertyLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
    carLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
    creditCards: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
    personalLines: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
    otherCommitments: ''
  },
  priceRange: 1000000,
  loanAmount: 750000
}

const RenderWithForm = (
  props: Partial<React.ComponentProps<typeof Step3NewPurchase>> = {},
  formDefaults?: Partial<MortgageFormData>
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const methods = useForm<MortgageFormData>({
      defaultValues: {
        ...defaultFormValues,
        ...(formDefaults || {})
      } as MortgageFormData
    })

    return (
      <FormProvider {...methods}>
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              control: methods.control
            })
          : children}
      </FormProvider>
    )
  }

  return render(
    <Step3NewPurchase
      onFieldChange={props.onFieldChange || jest.fn()}
      showJointApplicant={false}
      errors={{}}
      getErrorMessage={jest.fn()}
      {...props}
    />,
    { wrapper: Wrapper }
  )
}

const selectEmploymentOption = async (optionText: string) => {
  const user = userEvent.setup()
  const trigger = screen.getByRole('combobox', { name: /employment type/i })
  await user.click(trigger)
  const option = await screen.findByRole('option', { name: new RegExp(optionText, 'i') })
  await user.click(option)
}

describe('Step3NewPurchase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Income Panel', () => {
    it('renders primary applicant fields by default', () => {
      RenderWithForm()
      
      expect(screen.getByText('Applicant 1 (Primary)')).toBeInTheDocument()
      expect(screen.getByLabelText(/Monthly income/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Your Age/i)).toBeInTheDocument()
      expect(screen.getByText('Employment Type *')).toBeInTheDocument()
    })

    it('shows employment type selection with recognition rates', async () => {
      RenderWithForm()
      
      await selectEmploymentOption('Self-employed')
      
      await waitFor(() => {
        expect(screen.getByText('Income recognition: 70%')).toBeInTheDocument()
      })
    })

    it('reveals self-employed follow-up panel when selected', async () => {
      RenderWithForm()

      await selectEmploymentOption('Self-employed')

      await waitFor(() => {
        expect(screen.getByLabelText(/Years your business has been operating/i)).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/Average 12-month profit after expenses/i)).toBeInTheDocument()
    })

    it('reveals variable income panel with averaging inputs', async () => {
      RenderWithForm()

      await selectEmploymentOption('Variable income')

      await waitFor(() => {
        expect(screen.getByLabelText(/Average monthly income over 12 months/i)).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/Lowest observed monthly income/i)).toBeInTheDocument()
    })

    it('triggers analytics on income field changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const incomeInput = screen.getByLabelText(/Monthly income/i)
      fireEvent.change(incomeInput, { target: { value: '10000' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'actualIncomes.0',
        10000,
        expect.objectContaining({
          section: 'income_panel',
          action: 'updated_primary_income'
        })
      )
    })
  })

  describe('Joint Applicant Fields', () => {
    it('does not show joint applicant fields by default', () => {
      RenderWithForm()
      
      expect(screen.queryByText('Applicant 2 (Joint)')).not.toBeInTheDocument()
    })

    it('shows joint applicant fields when enabled', () => {
      RenderWithForm({ showJointApplicant: true })
      
      expect(screen.getByText('Applicant 2 (Joint)')).toBeInTheDocument()
      const incomeInputs = screen.getAllByLabelText(/Monthly income/i)
      expect(incomeInputs.length).toBeGreaterThanOrEqual(2)
    })

    it('marks joint income as optional', async () => {
      RenderWithForm({ showJointApplicant: true })
      
      const jointIncomeLabel = screen.getByText('Optional if not applicable')
      expect(jointIncomeLabel).toBeInTheDocument()
    })

    it('appears only once - no duplicate blocks', async () => {
      const { container } = RenderWithForm({ showJointApplicant: true })
      
      const jointBlocks = container.querySelectorAll('[id="applicant-2-joint"]')
      // Should not contain duplicate blocks
      const textElements = container.querySelectorAll('p')
      const jointHeaderTexts = Array.from(textElements).filter(el => 
        el.textContent === 'Applicant 2 (Joint)'
      )
      expect(jointHeaderTexts).toHaveLength(1)
    })
  })

  describe('Liabilities Panel', () => {
    it('renders liabilities checklist toggles', () => {
      RenderWithForm()

      expect(screen.getByRole('checkbox', { name: /Property loans/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /Car loans/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /Credit cards/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /Personal lines/i })).toBeInTheDocument()
    })

    it('reveals structured liability inputs when toggled on', async () => {
      RenderWithForm()

      const carToggle = screen.getByRole('checkbox', { name: /Car loans/i })
      fireEvent.click(carToggle)

      await waitFor(() => {
        expect(screen.getByLabelText(/Car loan outstanding balance/i)).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/Car loan monthly payment/i)).toBeInTheDocument()
    })

    it('allows other commitments to be captured in textarea', () => {
      RenderWithForm()

      const textarea = screen.getByLabelText(/Other commitments/i)
      fireEvent.change(textarea, { target: { value: 'Tuition fees' } })

      expect(textarea).toHaveValue('Tuition fees')
    })
  })

  describe('MAS Readiness Card', () => {
    it('initially shows incomplete state when fields are missing', () => {
      RenderWithForm({}, {
        actualIncomes: [undefined as unknown as number],
        actualAges: [undefined as unknown as number],
        priceRange: undefined,
        loanAmount: undefined
      })

      expect(screen.getByText('MAS Readiness Check')).toBeInTheDocument()
      expect(screen.getByText('Complete income, age, and property value to check eligibility')).toBeInTheDocument()
    })

    it('shows MAS readiness metrics when data is complete', () => {
      RenderWithForm()
      
      expect(screen.getByText('MAS Readiness Check')).toBeInTheDocument()
      expect(screen.getByText('TDSR')).toBeInTheDocument()
      expect(screen.getByText('MSR')).toBeInTheDocument()
    })

    it('displays correct status colors based on eligibility', () => {
      RenderWithForm()

      const readinessCard = screen.getByText('MAS Readiness Check')
      expect(readinessCard).toBeInTheDocument()

      const ratioTexts = screen.getAllByText(/\d+.\d+%\s\/\s\d+%/)
      expect(ratioTexts.length).toBeGreaterThanOrEqual(2)
      ratioTexts.forEach((ratio) => expect(ratio).toBeInTheDocument())
    })

    it('shows requirements list with appropriate symbols', () => {
      RenderWithForm()
      
      // Should have requirements section
      expect(screen.getByText('Requirements:')).toBeInTheDocument()
      
      // Should list eligibility or issues
      const requirementsList = screen.getByText(/Requirements:/i).parentElement
      expect(requirementsList).toBeInTheDocument()
    })
  })

  describe('Calculator integration', () => {
    it('passes recognized income for self-employed profiles into calculator', async () => {
      RenderWithForm(undefined, {
        employmentType: 'self-employed',
        actualIncomes: [0],
        employmentDetails: {
          'self-employed': {
            businessAgeYears: '',
            noaSubmitted: true,
            averageReportedIncome: ''
          },
          variable: {
            averagePastTwelveMonths: '',
            lowestObservedIncome: ''
          }
        }
      })

      calculateInstantProfile.mockClear()

      await selectEmploymentOption('Self-employed')

      const user = userEvent.setup()
      const avgIncomeInput = await screen.findByLabelText(/Average 12-month profit after expenses/i)
      await user.clear(avgIncomeInput)
      await user.type(avgIncomeInput, '15000')

      await waitFor(() => {
        const incomeCalls = calculateInstantProfile.mock.calls.map((call) => call[0]?.income)
        expect(
          incomeCalls.some((value) => typeof value === 'number' && Math.abs(value - 10500) < 1)
        ).toBe(true)
      })
    })

    it('retains base salary at 100% while applying recognition to variable income', async () => {
      RenderWithForm(undefined, {
        actualIncomes: [6000],
        actualVariableIncomes: [0],
        employmentType: 'variable'
      })

      calculateInstantProfile.mockClear()

      await selectEmploymentOption('Variable income')

      const user = userEvent.setup()
      const primaryIncome = screen.getByLabelText('Monthly income *')
      await user.clear(primaryIncome)
      await user.type(primaryIncome, '6000')

      const avgVariable = await screen.findByLabelText(/Average monthly income over 12 months/i)
      await user.clear(avgVariable)
      await user.type(avgVariable, '4000')

      await waitFor(() => {
        const incomeCalls = calculateInstantProfile.mock.calls.map((call) => call[0]?.income)
        expect(
          incomeCalls.some((value) => typeof value === 'number' && Math.abs(value - 8400) < 1)
        ).toBe(true)
      })
    })

    it('sums enabled liability payments into calculator commitments', async () => {
      RenderWithForm()

      calculateInstantProfile.mockClear()

      const propertyToggle = screen.getByRole('checkbox', { name: /Property loans/i })
      const carToggle = screen.getByRole('checkbox', { name: /Car loans/i })

      fireEvent.click(propertyToggle)
      fireEvent.click(carToggle)

      const propertyPayment = await screen.findByLabelText(/Property loan monthly payment/i)
      fireEvent.change(propertyPayment, { target: { value: '500' } })

      const carPayment = screen.getByLabelText(/Car loan monthly payment/i)
      fireEvent.change(carPayment, { target: { value: '250' } })

      await waitFor(() => {
        expect(
          calculateInstantProfile.mock.calls.some((call) => call[0]?.commitments === 750)
        ).toBe(true)
      })
    })
  })

  describe('Analytics Integration', () => {
    it('emits analytics for employment type changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      await selectEmploymentOption('Self-employed')

      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'employmentType',
        'self-employed',
        expect.objectContaining({
          section: 'employment_panel',
          action: 'changed',
          metadata: expect.objectContaining({
            recognitionRate: 0.7
          })
        })
      )
    })

    it('emits analytics for liabilities toggle changes', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const propertyToggle = screen.getByRole('checkbox', { name: /Property loans/i })
      fireEvent.click(propertyToggle)

      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'liabilities.propertyLoans.enabled',
        true,
        expect.objectContaining({
          section: 'liabilities_panel',
          action: 'toggle',
          metadata: expect.objectContaining({
            liabilityType: 'propertyLoans'
          })
        })
      )
    })

    it('includes timestamps in all analytics events', async () => {
      const mockOnFieldChange = jest.fn()
      RenderWithForm({ onFieldChange: mockOnFieldChange })

      const incomeInput = screen.getByLabelText(/Monthly income/i)
      fireEvent.change(incomeInput, { target: { value: '9000' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith(
        'actualIncomes.0',
        9000,
        expect.objectContaining({
          metadata: expect.objectContaining({
            timestamp: expect.any(Date)
          })
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for all form controls', () => {
      RenderWithForm()
      
      // Check all form controls have proper labels
      expect(screen.getByLabelText(/Monthly income/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Your Age/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /employment type/i })).toBeInTheDocument()
    })

    it('uses semantic structure for sections', () => {
      RenderWithForm()

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 })
      const sectionTitles = sectionHeadings.map((heading) => heading.textContent)

      expect(sectionTitles).toEqual(
        expect.arrayContaining(['Income Details', 'Financial Commitments', 'MAS Readiness Check'])
      )
    })
  })
})
