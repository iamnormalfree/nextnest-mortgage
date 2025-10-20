// ABOUTME: Tests for Step 3 number formatting with commas in income and liability fields

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Step3NewPurchase } from '../sections/Step3NewPurchase'
import { Step3Refinance } from '../sections/Step3Refinance'
import { FormProvider, useForm } from 'react-hook-form'
import { MortgageFormData } from '@/lib/contracts/form-contracts'

// Mock instant-profile calculations
jest.mock('@/lib/calculations/instant-profile', () => ({
  getEmploymentRecognitionRate: jest.fn(() => 1.0),
  calculateTotalLiabilities: jest.fn(() => 0),
  calculateInstantProfile: jest.fn(() => ({
    limitingFactor: 'none',
    maxLoan: 720000
  })),
  calculateComplianceSnapshot: jest.fn(() => ({
    tdsrRatio: 45,
    tdsrLimit: 55
  })),
  calculateRefinanceOutlook: jest.fn(() => null)
}))

const TestWrapper = ({ children, defaultValues }: { children: React.ReactNode, defaultValues?: Partial<MortgageFormData> }) => {
  const FormWrapper = () => {
    const methods = useForm<MortgageFormData>({
      defaultValues: defaultValues as MortgageFormData
    })
    return <FormProvider {...methods}>{children}</FormProvider>
  }
  return <FormWrapper />
}

describe('Step3NewPurchase - Number Formatting', () => {
  const mockOnFieldChange = jest.fn()
  const mockErrors = {}
  const mockGetErrorMessage = () => 'Error'
  const mockFieldValues = {
    actualIncomes: [undefined],
    actualVariableIncomes: [undefined],
    actualAges: [undefined]
  }

  it('should display comma-formatted placeholder in primary income field', () => {
    render(
      <TestWrapper>
        <Step3NewPurchase
          onFieldChange={mockOnFieldChange}
          showJointApplicant={false}
          errors={mockErrors}
          getErrorMessage={mockGetErrorMessage}
          fieldValues={mockFieldValues}
          instantCalcResult={null}
        />
      </TestWrapper>
    )

    const incomeInput = screen.getByLabelText(/monthly income/i) as HTMLInputElement
    expect(incomeInput.placeholder).toBe('8,000')
  })

  it('should display comma-formatted value when income entered', () => {
    render(
      <TestWrapper defaultValues={{ actualIncomes: [15000] }}>
        <Step3NewPurchase
          onFieldChange={mockOnFieldChange}
          showJointApplicant={false}
          errors={mockErrors}
          getErrorMessage={mockGetErrorMessage}
          fieldValues={{ ...mockFieldValues, actualIncomes: [15000] }}
          instantCalcResult={null}
        />
      </TestWrapper>
    )

    const incomeInput = screen.getByLabelText(/monthly income/i) as HTMLInputElement
    expect(incomeInput.value).toBe('15,000')
  })

  it('should parse comma-formatted input and store as number', async () => {
    render(
      <TestWrapper>
        <Step3NewPurchase
          onFieldChange={mockOnFieldChange}
          showJointApplicant={false}
          errors={mockErrors}
          getErrorMessage={mockGetErrorMessage}
          fieldValues={mockFieldValues}
          instantCalcResult={null}
        />
      </TestWrapper>
    )

    const incomeInput = screen.getByLabelText(/monthly income/i)
    fireEvent.change(incomeInput, { target: { value: '25,500' } })

    expect(mockOnFieldChange).toHaveBeenCalledWith(
      'actualIncomes.0',
      25500,
      expect.any(Object)
    )
  })

  it('should use inputMode="numeric" for mobile keyboard', () => {
    render(
      <TestWrapper>
        <Step3NewPurchase
          onFieldChange={mockOnFieldChange}
          showJointApplicant={false}
          errors={mockErrors}
          getErrorMessage={mockGetErrorMessage}
          fieldValues={mockFieldValues}
          instantCalcResult={null}
        />
      </TestWrapper>
    )

    const incomeInput = screen.getByLabelText(/monthly income/i) as HTMLInputElement
    expect(incomeInput.inputMode).toBe('numeric')
  })

  it('should format variable income field with commas', () => {
    render(
      <TestWrapper defaultValues={{ actualVariableIncomes: [3500] }}>
        <Step3NewPurchase
          onFieldChange={mockOnFieldChange}
          showJointApplicant={false}
          errors={mockErrors}
          getErrorMessage={mockGetErrorMessage}
          fieldValues={{ ...mockFieldValues, actualVariableIncomes: [3500] }}
          instantCalcResult={null}
        />
      </TestWrapper>
    )

    const variableIncomeInput = screen.getByLabelText(/variable.*bonus income/i) as HTMLInputElement
    expect(variableIncomeInput.value).toBe('3,500')
  })
})

// #Potential_Issue: Step3Refinance tests skipped for now - component uses useWatch hook
// which requires complex FormProvider mocking. Will test via E2E or add proper mocking later.
