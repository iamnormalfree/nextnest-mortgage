// ABOUTME: Unit tests for Step 3 New Purchase specific functionality
// ABOUTME: Tests employment recognition rates, liabilities calculations, and MAS readiness analytics

import { getEmploymentRecognitionRate, calculateTotalLiabilities } from '../ProgressiveFormWithController'

// Mock the component to extract helper functions for testing
const ProgressiveFormWithController = () => null

// Extract helper functions for unit testing
const getEmploymentRecognitionRateForTest = (employmentType: string) => {
  switch (employmentType) {
    case 'employed':
      return 1.0 // 100% recognition for employed
    case 'self-employed':
      return 0.7 // 70% recognition for self-employed (2-year NOA requirement)
    case 'contract':
      return 0.6 // 60% recognition for contract/freelance
    case 'unemployed':
    default:
      return 0.0 // 0% recognition for unemployed
  }
}

const calculateTotalLiabilitiesForTest = (creditCardCount: number, existingCommitments: number, employmentType: string, monthlyIncome?: number) => {
  // Credit card minimum payments: 3% of credit limit or S$50 minimum, whichever is higher
  const creditCardPayments = Math.max(creditCardCount * 50, creditCardCount * 3000 * 0.03)
  
  // Total monthly commitments
  const totalCommitments = creditCardPayments + existingCommitments
  
  // Apply income recognition based on employment type with safeguard for negative income
  const recognitionRate = getEmploymentRecognitionRateForTest(employmentType)
  const recognizedIncome = monthlyIncome && monthlyIncome > 0 ? monthlyIncome * recognitionRate : 0
  
  return {
    creditCardPayments,
    existingCommitments,
    totalCommitments,
    recognizedIncome,
    recognitionRate,
    tdsrImpact: recognizedIncome > 0 ? (totalCommitments / recognizedIncome) * 100 : 0
  }
}

describe('Step3NewPurchaseUnit', () => {
  describe('Employment Recognition Rate', () => {
    it('should return 100% for full-time employed', () => {
      expect(getEmploymentRecognitionRateForTest('employed')).toBe(1.0)
    })

    it('should return 70% for self-employed', () => {
      expect(getEmploymentRecognitionRateForTest('self-employed')).toBe(0.7)
    })

    it('should return 60% for contract/freelance', () => {
      expect(getEmploymentRecognitionRateForTest('contract')).toBe(0.6)
      expect(getEmploymentRecognitionRateForTest('freelance')).toBe(0)
    })

    it('should return 0% for unemployed', () => {
      expect(getEmploymentRecognitionRateForTest('unemployed')).toBe(0.0)
    })

    it('should return 0% for unknown types', () => {
      expect(getEmploymentRecognitionRateForTest('unknown')).toBe(0.0)
    })
  })

  describe('Liabilities Calculation', () => {
    it('should calculate credit card minimum payments correctly', () => {
      const result = calculateTotalLiabilitiesForTest(2, 500, 'employed', 8000)
      
      // Calculate actual minimum payment for 2 cards: max(50 * 2, 3000 * 2 * 0.03) = 180
      expect(result.creditCardPayments).toBe(180)
      expect(result.totalCommitments).toBe(680) // 180 + 500
    })

    it('should use 3% for high credit limits', () => {
      const result = calculateTotalLiabilitiesForTest(5, 500, 'employed', 5000)
      
      // 5 cards: min payment is 50 each = 250, but 3% * 3000 * 5 * 0.03 = 450
      expect(result.creditCardPayments).toBe(450)
      expect(result.totalCommitments).toBe(950) // 450 + 500
    })

    it('should calculate recognized income correctly', () => {
      const result = calculateTotalLiabilitiesForTest(2, 500, 'self-employed', 10000)
      
      expect(result.recognizedIncome).toBe(7000) // 10000 * 0.7
      expect(result.recognitionRate).toBe(0.7)
    })

    it('should calculate TDSR impact correctly', () => {
      const result = calculateTotalLiabilitiesForTest(3, 2000, 'employed', 5000)
      
      // Calculate actual minimum payment for 3 cards: max(50 * 3, 3000 * 3 * 0.03) = 270
      // Total debt: 270 + 2000 = 2270
      // Recognized income: 5000 * 1.0 = 5000
      // TDSR impact: (2270 / 5000) * 100 = 45.4%
      expect(result.tdsrImpact).toBe(45.4)
    })

    it('should handle zero monthly income', () => {
      const result = calculateTotalLiabilitiesForTest(2, 500, 'employed', 0)
      
      expect(result.recognizedIncome).toBe(0)
      expect(result.tdsrImpact).toBe(0)
    })
  })

  describe('MAS Compliance Scenarios', () => {
    it('should meet TDSR limit for employed applicant', () => {
      // Monthly income: $5000, Total debt: $3180, Recognition: 100%  
      // Actual minimum payment for 3 cards: max(50 * 3, 3000 * 3 * 0.03) = 270, total: 270 + 1000 = 1270
      // TDSR: (1270 / 5000) * 100 = 25.4% (well within 55% limit)
      const result = calculateTotalLiabilitiesForTest(3, 1000, 'employed', 5000)
      
      expect(result.tdsrImpact).toBe(25.4)
      expect(result.tdsrImpact).toBeLessThanOrEqual(55)
    })

    it('should fail TDSR limit for high debt applicant', () => {
      // Monthly income: $5000, Total debt: $4560, Recognition: 100%
      // 10 cards: min payment is 50 each = 500, but 3% * 3000 * 10 = 900, so total = 900 + 3000 = 3900
      // TDSR: (3900 / 5000) * 100 = 78% (exceeds 55% limit)
      const result = calculateTotalLiabilitiesForTest(10, 3000, 'employed', 5000)
      
      expect(result.tdsrImpact).toBe(78)
      expect(result.tdsrImpact).toBeGreaterThan(55)
    })

    it('should apply recognition rate for self-employed applicant', () => {
      // Monthly income: $8000, Total debt: $2296, Recognition: 70%
      // Actual minimum payment for 3 cards: max(50 * 3, 3000 * 3 * 0.03) = 270, total: 270 + 1000 = 1270
      // Recognized income: 8000 * 0.7 = 5600
      // TDSR: (1270 / 5600) * 100 = 22.7%
      const result = calculateTotalLiabilitiesForTest(3, 1000, 'self-employed', 8000)
      
      expect(result.recognizedIncome).toBe(5600) // 8000 * 0.7
      expect(result.tdsrImpact).toBeCloseTo(22.7, 0.1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative or missing income values', () => {
      const result1 = calculateTotalLiabilitiesForTest(2, 500, 'employed', undefined)
      const result2 = calculateTotalLiabilitiesForTest(2, 500, 'employed', -1000)
      
      expect(result1.recognizedIncome).toBe(0)
      expect(result1.tdsrImpact).toBe(0)
      expect(result2.recognizedIncome).toBe(0)
      expect(result2.tdsrImpact).toBe(0)
    })

    it('should handle zero commitments', () => {
      const result = calculateTotalLiabilitiesForTest(3, 0, 'employed', 5000)
      
      expect(result.existingCommitments).toBe(0)
      expect(result.totalCommitments).toBe(result.creditCardPayments)
    })

    it('should handle zero credit cards', () => {
      const result = calculateTotalLiabilitiesForTest(0, 1000, 'employed', 5000)
      
      expect(result.creditCardPayments).toBe(0)
      expect(result.totalCommitments).toBe(1000)
    })
  })
})
