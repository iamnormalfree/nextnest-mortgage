// ABOUTME: Hook for calculating MAS readiness (TDSR/MSR compliance) for mortgage applications

import { useMemo } from 'react'
import { calculateInstantProfile } from '@/lib/calculations/instant-profile'

export interface MasReadinessInput {
  effectiveIncome: number
  age: number
  ages?: number[]  // For IWAA calculation with joint applicants
  incomes?: number[]  // For IWAA calculation with joint applicants
  propertyValue: number
  propertyType: string
  totalMonthlyCommitments: number
  loanAmount: number
}

export interface MasReadinessResult {
  isReady: boolean
  tdsr: number
  tdsrLimit: number
  msr: number
  msrLimit: number
  reasons: string[]
}

export function useMasReadiness(input: MasReadinessInput): MasReadinessResult {
  const {
    effectiveIncome,
    age,
    ages,
    incomes,
    propertyValue,
    propertyType,
    totalMonthlyCommitments,
    loanAmount
  } = input

  return useMemo(() => {
    // Return not ready if required data is missing
    if (!effectiveIncome || !age || !propertyValue) {
      return {
        isReady: false,
        tdsr: 0,
        tdsrLimit: 55,
        msr: 0,
        msrLimit: 30,
        reasons: ['Complete income, age, and property value to check eligibility']
      }
    }

    // Call the instant profile calculator to get limiting factors
    // Pass ages/incomes arrays for IWAA calculation if available
    console.log('🔍 [MAS Readiness] Input to calculateInstantProfile:', {
      age,
      ages,
      income: effectiveIncome,
      incomes,
      hasAges: ages && ages.length > 0,
      hasIncomes: incomes && incomes.length > 0
    })

    const calculatorResult = calculateInstantProfile({
      property_price: propertyValue,
      property_type: propertyType as any,
      buyer_profile: 'SC',
      existing_properties: 0,
      income: effectiveIncome,
      incomes,  // Pass co-applicant incomes for IWAA
      commitments: totalMonthlyCommitments,
      rate: 3.0,
      tenure: 30,
      age,
      ages,  // Pass co-applicant ages for IWAA
      loan_type: 'new_purchase',
      is_owner_occupied: true
    })

    console.log('🔍 [MAS Readiness] Calculator result:', {
      tenureCapYears: calculatorResult.tenureCapYears,
      maxLoan: calculatorResult.maxLoan,
      tenureCapSource: calculatorResult.tenureCapSource
    })

    // Build reason codes from calculator output
    const reasons: string[] = []

    if (calculatorResult.reasonCodes && calculatorResult.reasonCodes.length > 0) {
      const codeMap: Record<string, string> = {
        'tdsr_binding': 'TDSR ratio is above compliance threshold',
        'msr_binding': 'MSR ratio is above the 30% cap',
        'ltv_binding': 'Loan-to-value ceiling reached based on property price',
        'ltv_first_loan': 'First property LTV cap applies',
        'ltv_second_loan': 'Second property LTV cap applies',
        'ltv_third_loan': 'Subsequent property LTV cap applies',
        'ltv_reduced_age_trigger': 'Reduced LTV due to age or tenure',
        'cpf_not_allowed': 'CPF usage not permitted for this property',
        'stress_rate_quoted_applied': 'Stress test rate applied',
        'tenure_cap_age_limit': 'Loan tenure limited by borrower age',
        'tenure_cap_property_limit': 'Loan tenure limited by property type',
        'absd_applies': 'Additional Buyer Stamp Duty (ABSD) applies'
      }
      reasons.push(...calculatorResult.reasonCodes.map(code => codeMap[code] || code))
    }

    if (calculatorResult.policyRefs && calculatorResult.policyRefs.length > 0) {
      const policyList = calculatorResult.policyRefs.join(', ')
      reasons.push('Policy references: ' + policyList)
    }

    if (!reasons.length) {
      reasons.push('Eligible for mortgage financing')
    }

    // Calculate monthly mortgage payment for the NEW loan
    // Using MAS stress test rate (4% for residential properties)
    // Use IWAA-adjusted tenure from calculator result
    const stressTestRate = 4.0
    const monthlyRate = stressTestRate / 100 / 12
    const tenureYears = calculatorResult.tenureCapYears || 25  // Use IWAA tenure, fallback to 25
    const numberOfPayments = tenureYears * 12

    // Use max loan from calculator (reflects IWAA tenure), fallback to parameter
    const effectiveLoanAmount = calculatorResult.maxLoan || loanAmount

    let monthlyMortgagePayment = 0
    if (effectiveLoanAmount > 0 && monthlyRate > 0) {
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)
      const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1
      monthlyMortgagePayment = Math.ceil(effectiveLoanAmount * (numerator / denominator))
    }

    // Calculate TDSR: (New Mortgage Payment + Existing Commitments) / Income
    const tdsrRatio = effectiveIncome > 0
      ? ((monthlyMortgagePayment + totalMonthlyCommitments) / effectiveIncome) * 100
      : 0

    // Calculate MSR: (New Mortgage Payment ONLY) / Income
    const msrLimitAmount = calculatorResult.msrLimit ?? (effectiveIncome * 0.30)
    const msrRatio = effectiveIncome > 0 && msrLimitAmount > 0
      ? (monthlyMortgagePayment / effectiveIncome) * 100
      : 0

    // Determine readiness based on limiting factors
    const limitingFactor = calculatorResult.limitingFactor
    const isReady = limitingFactor !== 'TDSR' && limitingFactor !== 'MSR'

    return {
      isReady,
      tdsr: tdsrRatio,
      tdsrLimit: 55,
      msr: msrRatio,
      msrLimit: 30,
      reasons
    }
  }, [effectiveIncome, age, ages, incomes, propertyValue, propertyType, totalMonthlyCommitments, loanAmount])
}
