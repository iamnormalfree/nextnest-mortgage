/**
 * Mortgage Calculation Service
 * Lead: Ahmad Ibrahim - Senior Backend Engineer
 * 
 * Singapore-compliant mortgage calculations based on MAS regulations
 * Integrates Dr. Elena Tan's expert profile for precise calculations
 */

import { z } from 'zod'
import singaporeExpertProfile from '../../../../dr-elena-mortgage-expert.json'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface MortgageCalculationInput {
  propertyPrice: number
  loanAmount?: number
  interestRate: number
  tenure: number
  propertyType: 'HDB' | 'EC' | 'Private' | 'Landed' | 'Commercial'
  borrowerAge?: number
  monthlyIncome?: number
  totalCommitments?: number
  isFirstProperty?: boolean
  buyerProfile?: 'Singapore Citizen' | 'PR' | 'Foreigner' | 'Entity'
}

export interface MortgageCalculationResult {
  monthlyPayment: number
  totalInterest: number
  totalPayment: number
  principalAmount: number
  effectiveLoanAmount: number
  stampDuty: {
    bsd: number
    absd: number
    total: number
  }
  cashRequired: {
    downpayment: number
    stampDuty: number
    legalFees: number
    total: number
  }
  eligibility: {
    maxLoanAmount: number
    tdsrLimit?: number
    msrLimit?: number
    ltvLimit: number
    actualLtv: number
  }
  warnings: string[]
  recommendations: string[]
}

export interface TDSRCalculation {
  recognizedIncome: number
  totalCommitments: number
  tdsrLimit: number
  availableForMortgage: number
  stressTestRate: number
  maxLoanFromTDSR: number
}

export interface MSRCalculation {
  recognizedIncome: number
  msrLimit: number
  maxLoanFromMSR: number
  applicable: boolean
}

// ============================================================================
// CORE CALCULATION SERVICE
// ============================================================================

export class MortgageCalculationService {
  private readonly roundingRules = singaporeExpertProfile.computational_modules.rounding_rules
  private readonly formulas = singaporeExpertProfile.computational_modules.core_formulas
  private readonly ltvLimits = singaporeExpertProfile.computational_modules.ltv_limits
  private readonly stampDutyRates = singaporeExpertProfile.computational_modules.stamp_duty_rates
  private readonly incomeRecognition = singaporeExpertProfile.computational_modules.income_recognition
  private readonly propertyRules = singaporeExpertProfile.computational_modules.property_specific_rules

  /**
   * Calculate monthly mortgage payment
   * Using Dr. Elena Tan's formula with client-protective rounding
   */
  calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    years: number
  ): number {
    // Edge case: zero interest
    if (annualRate === 0) {
      return Math.ceil(principal / (years * 12))
    }

    const monthlyRate = annualRate / 12
    const numberOfPayments = years * 12

    // Standard amortization formula
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

    // Round UP to nearest dollar (conservative for client)
    return Math.ceil(monthlyPayment)
  }

  /**
   * Calculate maximum loan from monthly payment (inverse calculation)
   */
  calculateLoanFromPayment(
    monthlyPayment: number,
    annualRate: number,
    years: number
  ): number {
    if (annualRate === 0) {
      return monthlyPayment * years * 12
    }

    const monthlyRate = annualRate / 12
    const numberOfPayments = years * 12

    const maxLoan = monthlyPayment * 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1) / 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))

    // Round DOWN to nearest thousand (protect from over-borrowing)
    return Math.floor(maxLoan / 1000) * 1000
  }

  /**
   * Calculate TDSR (Total Debt Servicing Ratio)
   */
  calculateTDSR(
    monthlyIncome: number,
    totalCommitments: number,
    propertyType: string
  ): TDSRCalculation {
    const recognizedIncome = monthlyIncome // Simplified - would apply recognition rates
    const tdsrLimit = recognizedIncome * 0.55
    
    // Stress test rate based on property type
    const stressTestRate = propertyType === 'Commercial' ? 0.05 : 0.04
    
    const availableForMortgage = Math.max(0, tdsrLimit - totalCommitments)
    
    // Calculate max loan based on available TDSR
    const maxLoanFromTDSR = this.calculateLoanFromPayment(
      availableForMortgage,
      stressTestRate,
      30 // Standard 30-year calculation
    )

    return {
      recognizedIncome,
      totalCommitments,
      tdsrLimit,
      availableForMortgage,
      stressTestRate,
      maxLoanFromTDSR
    }
  }

  /**
   * Calculate MSR (Mortgage Servicing Ratio) for HDB/EC
   */
  calculateMSR(
    monthlyIncome: number,
    propertyType: string
  ): MSRCalculation {
    const applicable = propertyType === 'HDB' || propertyType === 'EC'
    
    if (!applicable) {
      return {
        recognizedIncome: monthlyIncome,
        msrLimit: 0,
        maxLoanFromMSR: 0,
        applicable: false
      }
    }

    const recognizedIncome = monthlyIncome
    const msrLimit = recognizedIncome * 0.30
    
    // HDB/EC max tenure is 25 years
    const maxLoanFromMSR = this.calculateLoanFromPayment(
      msrLimit,
      0.04, // Stress test rate
      25
    )

    return {
      recognizedIncome,
      msrLimit,
      maxLoanFromMSR,
      applicable: true
    }
  }

  /**
   * Calculate LTV limits based on property count and buyer profile
   */
  calculateLTV(
    isFirstProperty: boolean,
    propertyCount: number,
    buyerProfile: string,
    tenure: number,
    borrowerAge?: number
  ): { maxLtv: number; minCash: number } {
    let maxLtv: number
    let minCash: number

    // Entity buyers have special limits
    if (buyerProfile === 'Entity') {
      return { maxLtv: 15, minCash: 85 }
    }

    // Individual/joint buyers
    if (isFirstProperty) {
      maxLtv = 75
      minCash = 5
    } else if (propertyCount === 2) {
      maxLtv = 45
      minCash = 25
    } else {
      maxLtv = 35
      minCash = 25
    }

    // Tenure adjustment
    if (tenure > 30 || (borrowerAge && borrowerAge + tenure > 65)) {
      maxLtv -= 5
      minCash += 5
    }

    return { maxLtv, minCash }
  }

  /**
   * Calculate stamp duties (BSD + ABSD)
   */
  calculateStampDuty(
    propertyPrice: number,
    propertyType: string,
    buyerProfile: string,
    isFirstProperty: boolean,
    propertyCount: number
  ): { bsd: number; absd: number; total: number } {
    // Calculate BSD
    const bsd = this.calculateBSD(propertyPrice, propertyType)
    
    // Calculate ABSD
    const absd = this.calculateABSD(
      propertyPrice,
      buyerProfile,
      isFirstProperty,
      propertyCount
    )

    return {
      bsd: Math.ceil(bsd),
      absd: Math.ceil(absd),
      total: Math.ceil(bsd + absd)
    }
  }

  /**
   * Calculate Buyer's Stamp Duty
   */
  private calculateBSD(propertyPrice: number, propertyType: string): number {
    const isResidential = propertyType !== 'Commercial'
    const tiers = isResidential 
      ? this.stampDutyRates.bsd_residential.tiers
      : this.stampDutyRates.bsd_commercial.tiers

    let bsd = 0
    let remainingValue = propertyPrice

    for (const tier of tiers) {
      if ('max' in tier && tier.max !== undefined) {
        if (propertyPrice <= tier.max) {
          bsd = tier.base + (remainingValue * tier.rate)
          break
        }
        remainingValue = propertyPrice - tier.max
      } else {
        // Last tier (above)
        bsd = tier.base + (remainingValue * tier.rate)
        break
      }
    }

    return bsd
  }

  /**
   * Calculate Additional Buyer's Stamp Duty
   */
  private calculateABSD(
    propertyPrice: number,
    buyerProfile: string,
    isFirstProperty: boolean,
    propertyCount: number
  ): number {
    const rates = this.stampDutyRates.absd_rates.single_buyers

    let absdRate = 0

    switch (buyerProfile) {
      case 'Singapore Citizen':
        if (isFirstProperty) {
          absdRate = rates.singapore_citizen.first_property
        } else if (propertyCount === 2) {
          absdRate = rates.singapore_citizen.second_property
        } else {
          absdRate = rates.singapore_citizen.third_plus
        }
        break
        
      case 'PR':
        if (isFirstProperty) {
          absdRate = rates.permanent_resident.first_property
        } else if (propertyCount === 2) {
          absdRate = rates.permanent_resident.second_property
        } else {
          absdRate = rates.permanent_resident.third_plus
        }
        break
        
      case 'Foreigner':
        absdRate = rates.foreigner.all_properties
        break
        
      case 'Entity':
        absdRate = rates.entity.all_properties
        break
    }

    return propertyPrice * (absdRate / 100)
  }

  /**
   * Perform complete mortgage calculation with all components
   */
  calculate(input: MortgageCalculationInput): MortgageCalculationResult {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Basic calculation
    const loanAmount = input.loanAmount || (input.propertyPrice * 0.75)
    const monthlyPayment = this.calculateMonthlyPayment(
      loanAmount,
      input.interestRate,
      input.tenure
    )
    
    const totalPayment = monthlyPayment * input.tenure * 12
    const totalInterest = totalPayment - loanAmount

    // Stamp duty calculation
    const stampDuty = this.calculateStampDuty(
      input.propertyPrice,
      input.propertyType,
      input.buyerProfile || 'Singapore Citizen',
      input.isFirstProperty ?? true,
      1
    )

    // LTV calculation
    const ltvInfo = this.calculateLTV(
      input.isFirstProperty ?? true,
      1,
      input.buyerProfile || 'Singapore Citizen',
      input.tenure,
      input.borrowerAge
    )

    const actualLtv = (loanAmount / input.propertyPrice) * 100

    // Cash requirements
    const downpayment = input.propertyPrice - loanAmount
    const cashRequired = {
      downpayment: Math.ceil(downpayment),
      stampDuty: stampDuty.total,
      legalFees: Math.ceil(3000), // Estimated
      total: Math.ceil(downpayment + stampDuty.total + 3000)
    }

    // Eligibility calculations
    let maxLoanAmount = input.propertyPrice * (ltvInfo.maxLtv / 100)
    let tdsrLimit: number | undefined
    let msrLimit: number | undefined

    if (input.monthlyIncome && input.totalCommitments !== undefined) {
      const tdsr = this.calculateTDSR(
        input.monthlyIncome,
        input.totalCommitments,
        input.propertyType
      )
      tdsrLimit = tdsr.availableForMortgage
      maxLoanAmount = Math.min(maxLoanAmount, tdsr.maxLoanFromTDSR)

      if (input.propertyType === 'HDB' || input.propertyType === 'EC') {
        const msr = this.calculateMSR(input.monthlyIncome, input.propertyType)
        msrLimit = msr.msrLimit
        maxLoanAmount = Math.min(maxLoanAmount, msr.maxLoanFromMSR)
        
        if (msr.maxLoanFromMSR < tdsr.maxLoanFromTDSR) {
          warnings.push('MSR is the limiting factor for this HDB/EC purchase')
        }
      }
    }

    // Round down max loan to nearest thousand
    maxLoanAmount = Math.floor(maxLoanAmount / 1000) * 1000

    // Generate warnings and recommendations
    if (actualLtv > ltvInfo.maxLtv) {
      warnings.push(`Loan exceeds maximum LTV of ${ltvInfo.maxLtv}%`)
    }

    if (input.borrowerAge && input.borrowerAge + input.tenure > 65) {
      warnings.push('Loan tenure extends beyond retirement age')
      recommendations.push('Consider shorter tenure or younger co-borrower')
    }

    if (monthlyPayment > (input.monthlyIncome || 0) * 0.3) {
      recommendations.push('Monthly payment exceeds 30% of income - consider lower loan amount')
    }

    return {
      monthlyPayment,
      totalInterest,
      totalPayment,
      principalAmount: loanAmount,
      effectiveLoanAmount: maxLoanAmount,
      stampDuty,
      cashRequired,
      eligibility: {
        maxLoanAmount,
        tdsrLimit,
        msrLimit,
        ltvLimit: ltvInfo.maxLtv,
        actualLtv
      },
      warnings,
      recommendations
    }
  }

  /**
   * Calculate with EFA (Eligible Financial Assets) for deficit coverage
   */
  calculateWithEFA(
    input: MortgageCalculationInput,
    monthlyDeficit: number
  ): { pledgeFund: number; showFund: number } {
    const limitingRatio = input.propertyType === 'HDB' || input.propertyType === 'EC' 
      ? 0.30 
      : 0.55

    // Calculate pledge fund needed
    const pledgeFund = (monthlyDeficit / limitingRatio) * 48
    
    // Calculate show fund (total assets needed)
    const showFund = pledgeFund / 0.30

    return {
      pledgeFund: Math.ceil(pledgeFund / 1000) * 1000,
      showFund: Math.ceil(showFund / 1000) * 1000
    }
  }

  /**
   * Progressive payment calculation for BUC (Building Under Construction)
   */
  calculateProgressivePayment(
    propertyPrice: number,
    stage: string
  ): { stagePayment: number; cumulative: number } {
    const stages = singaporeExpertProfile.computational_modules.specialized_calculators.progressive_payment_buc.stages
    
    let cumulative = 0
    let stagePayment = 0

    for (const s of stages) {
      const payment = propertyPrice * (s.percentage / 100)
      cumulative += payment
      
      if (s.stage === stage) {
        stagePayment = payment
        break
      }
    }

    return {
      stagePayment: Math.ceil(stagePayment),
      cumulative: Math.ceil(cumulative)
    }
  }
}

// Export singleton instance
export const mortgageCalculationService = new MortgageCalculationService()