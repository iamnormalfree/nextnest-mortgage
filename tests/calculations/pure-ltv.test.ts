import { calculatePureLtvMaxLoan } from '@/lib/calculations/instant-profile'
import { describe, it, expect } from '@jest/globals'

describe('calculatePureLtvMaxLoan - Dr. Elena v2 Compliance', () => {
  
  describe('First Property Scenarios', () => {
    it('HDB $1M first property age 35 should return $750k (75% LTV)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 1_000_000,
        existing_properties: 0,
        age: 35,
        property_type: 'HDB'
      })

      expect(result.calculationType).toBe('pure_ltv')
      expect(result.maxLoanAmount).toBe(750_000)
      expect(result.ltvPercentage).toBe(75)
      expect(result.downPayment).toBe(250_000)
      expect(result.minCashPercent).toBe(5)
      expect(result.minCashRequired).toBe(50_000)
      expect(result.cashDownPayment).toBe(50_000)
      expect(result.cpfDownPayment).toBe(200_000)
      expect(result.cpfAllowed).toBe(true)
      expect(result.effectiveTenure).toBe(25)
      expect(result.limitingFactor).toBe('LTV')
      expect(result.reasonCodes).toContain('first_property_75_ltv')
      expect(result.reasonCodes).toContain('min_cash_5_percent')
      expect(result.reasonCodes).not.toContain('msr_limited')
      expect(result.reasonCodes).not.toContain('tdsr_limited')
    })

    it('Private $1.5M first property age 35 should return $1.125M (75% LTV)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 1_500_000,
        existing_properties: 0,
        age: 35,
        property_type: 'Private'
      })

      expect(result.maxLoanAmount).toBe(1_125_000)
      expect(result.ltvPercentage).toBe(75)
      expect(result.downPayment).toBe(375_000)
      expect(result.minCashPercent).toBe(5)
      expect(result.minCashRequired).toBe(75_000)
      expect(result.cashDownPayment).toBe(75_000)
      expect(result.cpfDownPayment).toBe(300_000)
      expect(result.effectiveTenure).toBe(30)
      expect(result.tenureCapSource).toBe('age')
      expect(result.reasonCodes).toContain('tenure_capped_by_age')
    })
  })

  describe('Second Property Scenarios', () => {
    it('Private $1.5M second property age 35 should return $675k (45% LTV)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 1_500_000,
        existing_properties: 1,
        age: 35,
        property_type: 'Private'
      })

      expect(result.maxLoanAmount).toBe(675_000)
      expect(result.ltvPercentage).toBe(45)
      expect(result.downPayment).toBe(825_000)
      expect(result.minCashPercent).toBe(25)
      expect(result.minCashRequired).toBe(375_000)
      expect(result.cashDownPayment).toBe(375_000)
      expect(result.cpfDownPayment).toBe(450_000)
      expect(result.reasonCodes).toContain('second_property_45_ltv')
    })
  })

  describe('Third Property Scenarios', () => {
    it('Private $2M third property age 30 should return $700k (35% base LTV)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 2_000_000,
        existing_properties: 2,
        age: 30,
        property_type: 'Private'
      })

      expect(result.maxLoanAmount).toBe(700_000)
      expect(result.ltvPercentage).toBe(35)
      expect(result.downPayment).toBe(1_300_000)
      expect(result.minCashPercent).toBe(25)
      expect(result.minCashRequired).toBe(500_000)
      expect(result.cashDownPayment).toBe(500_000)
      expect(result.cpfDownPayment).toBe(800_000)
      expect(result.reasonCodes).toContain('third_property_35_ltv')
    })
  })

  describe('Commercial Property Scenarios', () => {
    it('Commercial $2M first property age 35 should have NO CPF (100% cash down)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 2_000_000,
        existing_properties: 0,
        age: 35,
        property_type: 'Commercial'
      })

      expect(result.cpfAllowed).toBe(false)
      expect(result.cpfDownPayment).toBe(0)
      expect(result.cpfAllowedAmount).toBe(0)
      expect(result.cashDownPayment).toBe(result.downPayment)
      expect(result.reasonCodes).toContain('commercial_100_percent_cash')
    })
  })

  describe('Reduced LTV Scenarios', () => {
    it('HDB $800k first property age 55 should return $440k (55% reduced LTV)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 800_000,
        existing_properties: 0,
        age: 55,
        property_type: 'HDB'
      })

      expect(result.ltvPercentage).toBe(55)
      expect(result.maxLoanAmount).toBe(440_000)
      expect(result.minCashPercent).toBe(10)
      expect(result.reasonCodes).toContain('reduced_ltv_age_exceeds_65')
      expect(result.reasonCodes).toContain('min_cash_10_percent')
    })
    
    it('Private $1M first property age 50 should return $550k (55% reduced LTV)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 1_000_000,
        existing_properties: 0,
        age: 50,
        property_type: 'Private'
      })

      expect(result.ltvPercentage).toBe(55)
      expect(result.maxLoanAmount).toBe(550_000)
      expect(result.minCashPercent).toBe(10)
      expect(result.minCashRequired).toBe(100_000)
      expect(result.reasonCodes).toContain('reduced_ltv_age_exceeds_65')
    })
  })

  describe('Edge Cases', () => {
    it('should handle age > 65 (no loan eligibility)', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 1_000_000,
        existing_properties: 0,
        age: 70,
        property_type: 'HDB'
      })

      expect(result.effectiveTenure).toBe(0)
      expect(result.maxLoanAmount).toBe(0)
    })

    it('should round DOWN max loan to nearest thousand', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 999_999,
        existing_properties: 0,
        age: 35,
        property_type: 'HDB'
      })

      expect(result.maxLoanAmount).toBe(749_000)
    })

    it('should round UP down payment to nearest thousand', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 999_999,
        existing_properties: 0,
        age: 35,
        property_type: 'HDB'
      })

      expect(result.downPayment).toBe(251_000)
    })
    
    it('should handle age exactly 65', () => {
      const result = calculatePureLtvMaxLoan({
        property_price: 1_000_000,
        existing_properties: 0,
        age: 65,
        property_type: 'Private'
      })

      expect(result.effectiveTenure).toBe(0)
      expect(result.maxLoanAmount).toBe(0)
    })
  })
})
