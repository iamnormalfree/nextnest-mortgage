import { z } from 'zod'
import type { MortgageInput, MortgageResult } from '@/types/mortgage'

// Zod schema for mortgage input validation
export const MortgageInputSchema = z.object({
  loanAmount: z.number().min(1000, 'Loan amount must be at least SGD 1,000'),
  interestRate: z.number().min(0.01, 'Interest rate must be at least 0.01%').max(15, 'Interest rate cannot exceed 15%'),
  loanTerm: z.number().min(1, 'Loan term must be at least 1 year').max(35, 'Loan term cannot exceed 35 years'),
  downPayment: z.number().min(0).optional(),
  propertyValue: z.number().min(0).optional(),
})

export type ValidatedMortgageInput = z.infer<typeof MortgageInputSchema>

/**
 * Calculate monthly mortgage payment using the standard mortgage formula
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where: M = Monthly payment, P = Principal, r = Monthly interest rate, n = Number of payments
 */
export function calculateMortgage(input: MortgageInput): MortgageResult {
  // Validate input using Zod
  const validatedInput = MortgageInputSchema.parse(input)
  
  const { loanAmount, interestRate, loanTerm } = validatedInput
  
  // Convert annual interest rate to monthly rate
  const monthlyRate = interestRate / 100 / 12
  
  // Calculate total number of payments
  const numPayments = loanTerm * 12
  
  // Calculate monthly payment using mortgage formula
  const monthlyPayment = monthlyRate === 0 
    ? loanAmount / numPayments // Handle 0% interest rate edge case
    : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  // Calculate totals
  const totalPayment = monthlyPayment * numPayments
  const totalInterest = totalPayment - loanAmount
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100, // Round to 2 decimal places
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    loanAmount,
    interestRate,
    loanTerm,
  }
}

// Predefined mortgage scenarios for quick calculations
export const MORTGAGE_SCENARIOS = {
  HDB_FLAT: {
    name: 'HDB Flat',
    loanAmount: 400000,
    interestRate: 2.3,
    loanTerm: 25,
  },
  PRIVATE_CONDO: {
    name: 'Private Condo',
    loanAmount: 800000,
    interestRate: 2.8,
    loanTerm: 30,
  },
} as const
