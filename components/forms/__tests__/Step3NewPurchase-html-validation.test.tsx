// ABOUTME: Tests for HTML validation attributes on Step3NewPurchase numeric inputs

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Step3NewPurchase } from '../sections/Step3NewPurchase'
import { FormProvider, useForm } from 'react-hook-form'
import { MortgageFormData } from '@/lib/contracts/form-contracts'

jest.mock('@/lib/calculations/instant-profile', () => ({
  getEmploymentRecognitionRate: jest.fn(() => 1.0),
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

describe('Step3NewPurchase - HTML Validation Attributes', () => {
  describe('Income Fields', () => {
    it('monthly income input has min="0" attribute', () => {
      RenderWithForm()
      const input = screen.getByLabelText(/Monthly income/i) as HTMLInputElement
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
    })
  })

  describe('Age Fields', () => {
    it('age input has min="18", max="99", step="1" attributes', () => {
      RenderWithForm()
      const input = screen.getByLabelText(/Your Age/i) as HTMLInputElement
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '18')
      expect(input).toHaveAttribute('max', '99')
      expect(input).toHaveAttribute('step', '1')
    })
  })

  describe('Self-Employed Fields', () => {
    it('business age input has min="0" attribute', () => {
      RenderWithForm({}, { employmentType: 'self-employed' })
      const input = screen.getByLabelText(/Years your business has been operating/i) as HTMLInputElement
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
    })

    it('average reported income has min="0" attribute', () => {
      RenderWithForm({}, { employmentType: 'self-employed' })
      const input = screen.getByLabelText(/Average 12-month profit/i) as HTMLInputElement
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
    })
  })
})
