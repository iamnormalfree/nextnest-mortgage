// ABOUTME: Tests to ensure number inputs don't show leading zero prefix when typing

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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
  actualIncomes: [undefined],
  actualVariableIncomes: [undefined],
  actualAges: [undefined],
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
  priceRange: undefined,
  loanAmount: undefined
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

describe('Step3NewPurchase - Leading Zeros Bug Fix', () => {
  it('monthly income field does not show "0" prefix when typing', () => {
    RenderWithForm()
    const input = screen.getByLabelText(/Monthly income/i) as HTMLInputElement
    
    // Check that input starts empty or without a "0"
    expect(input.value).not.toBe('0')
  })

  it('age field does not show "0" prefix when typing', () => {
    RenderWithForm()
    const input = screen.getByLabelText(/Your Age/i) as HTMLInputElement
    
    // Check that input starts empty or without a "0"
    expect(input.value).not.toBe('0')
  })

  it('typing "8000" in income field shows "8000", not "08000"', () => {
    RenderWithForm()
    const input = screen.getByLabelText(/Monthly income/i) as HTMLInputElement
    
    // Simulate user typing
    fireEvent.change(input, { target: { value: '8000' } })
    
    // Should show 8000, not 08000
    expect(input.value).toBe('8,000')
    expect(input.value).not.toContain('08')
  })

  it('typing "35" in age field shows "35", not "035"', () => {
    RenderWithForm()
    const input = screen.getByLabelText(/Your Age/i) as HTMLInputElement
    
    // Simulate user typing
    fireEvent.change(input, { target: { value: '35' } })
    
    // Should show 35, not 035
    expect(input.value).toBe('35')
    expect(input.value).not.toContain('03')
  })
})
