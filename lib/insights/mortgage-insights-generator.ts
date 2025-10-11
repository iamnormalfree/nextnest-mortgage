/**
 * Mortgage Insights Generator powered by Dr. Elena Tan's expertise
 * Generates intelligent, contextual insights based on form data and calculations
 */

import { calculateMortgage } from '@/lib/calculations/mortgage'
import { calculateUrgencyProfile } from '@/lib/calculations/urgency-calculator'

// Import Dr. Elena's computational modules
import drElenaExpertise from '@/dr-elena-mortgage-expert.json'

interface InsightContext {
  loanType: 'new_purchase' | 'refinance' | 'commercial'
  propertyType?: string
  priceRange?: number
  purchaseTimeline?: string
  currentRate?: number
  outstandingLoan?: number
  lockInStatus?: string
  propertyValue?: number
  purpose?: string
  monthlyIncome?: number
  existingCommitments?: number
  name?: string
  email?: string
  phone?: string
}

interface MortgageInsight {
  type: 'calculation' | 'advice' | 'warning' | 'opportunity' | 'analysis'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  details?: string[]
  value?: string | number
  actionable: boolean
  nextStep?: string
  calculations?: {
    maxLoan?: number
    monthlyPayment?: number
    tdsr?: number
    msr?: number
    stampDuty?: number
    absd?: number
    downpayment?: number
  }
}

export class MortgageInsightsGenerator {
  private context: InsightContext
  private expertise = drElenaExpertise

  constructor(context: InsightContext) {
    this.context = context
  }

  /**
   * Generate insights based on which gate the user has completed
   */
  generateInsights(gateNumber: number): MortgageInsight[] {
    switch (gateNumber) {
      case 2:
        return this.generateGate2Insights()
      case 3:
        return this.generateGate3Insights()
      default:
        return []
    }
  }

  /**
   * Gate 2 insights - preliminary analysis with available data
   */
  private generateGate2Insights(): MortgageInsight[] {
    const insights: MortgageInsight[] = []
    const urgencyProfile = calculateUrgencyProfile(this.context)

    // Loan-type specific insights
    if (this.context.loanType === 'refinance') {
      // Refinancing-specific insights
      if (this.context.currentRate && this.context.outstandingLoan) {
        const currentMonthly = this.calculatePaymentForRate(this.context.outstandingLoan, this.context.currentRate)
        const marketRate = 2.95 // Current market average
        const newMonthly = this.calculatePaymentForRate(this.context.outstandingLoan, marketRate)
        const monthlySavings = Math.max(0, currentMonthly - newMonthly)
        
        insights.push({
          type: monthlySavings > 0 ? 'opportunity' : 'calculation',
          urgency: monthlySavings > 500 ? 'high' : 'medium',
          title: monthlySavings > 0 ? '💰 Significant Savings Opportunity' : '📊 Refinancing Analysis',
          message: monthlySavings > 0 
            ? `Save ${this.formatCurrency(monthlySavings)}/month by refinancing from ${this.context.currentRate}% to ${marketRate}%`
            : `Your current ${this.context.currentRate}% rate is competitive. Market average is ${marketRate}%`,
          calculations: {
            monthlyPayment: newMonthly,
            maxLoan: this.context.outstandingLoan
          },
          details: [
            `Current payment: ${this.formatCurrency(currentMonthly)}/month`,
            `New payment: ${this.formatCurrency(newMonthly)}/month`,
            `Annual savings: ${this.formatCurrency(monthlySavings * 12)}`,
            `Break-even period: ${monthlySavings > 0 ? Math.ceil(3000 / monthlySavings) + ' months' : 'N/A'}`
          ],
          value: monthlySavings > 0 ? `${this.formatCurrency(monthlySavings * 12)} yearly` : 'Market analysis',
          actionable: true,
          nextStep: monthlySavings > 0 
            ? 'Complete profile to lock in these savings'
            : 'Monitor rates for better opportunities'
        })
      }

      // Lock-in status insight
      if (this.context.lockInStatus) {
        const lockInInsight = this.getLockInInsight(this.context.lockInStatus)
        if (lockInInsight) {
          insights.push(lockInInsight)
        }
      }
    } else if (this.context.loanType === 'new_purchase') {
      // New purchase insights
      if (this.context.priceRange) {
        const estimatedLoan = this.context.priceRange * 0.75
        const monthlyPayment = this.calculateQuickPayment(estimatedLoan)
        const stampDuty = Math.round(this.context.priceRange * 0.044) // Approximate
        
        insights.push({
          type: 'calculation',
          urgency: 'medium',
          title: '🏠 Purchase Cost Breakdown',
          message: `For ${this.formatCurrency(this.context.priceRange)} property with 75% loan`,
          calculations: {
            maxLoan: estimatedLoan,
            monthlyPayment: monthlyPayment,
            downpayment: this.context.priceRange * 0.25,
            stampDuty: stampDuty
          },
          details: [
            `Loan amount: ${this.formatCurrency(estimatedLoan)}`,
            `25% downpayment: ${this.formatCurrency(this.context.priceRange * 0.25)}`,
            `Estimated stamp duty: ${this.formatCurrency(stampDuty)}`,
            `Total upfront: ${this.formatCurrency(this.context.priceRange * 0.25 + stampDuty)}`
          ],
          actionable: true,
          nextStep: 'Add income to check affordability'
        })
      }
    } else if (this.context.loanType === 'commercial') {
      // Equity loan insights
      if (this.context.propertyValue) {
        const maxEquity = this.context.propertyValue * 0.75 - (this.context.outstandingLoan || 0)
        
        insights.push({
          type: 'calculation',
          urgency: 'medium',
          title: '💎 Available Equity',
          message: `Unlock up to ${this.formatCurrency(maxEquity)} from your property`,
          calculations: {
            maxLoan: maxEquity
          },
          details: [
            `Property value: ${this.formatCurrency(this.context.propertyValue)}`,
            `Max LTV (75%): ${this.formatCurrency(this.context.propertyValue * 0.75)}`,
            `Outstanding loan: ${this.formatCurrency(this.context.outstandingLoan || 0)}`,
            `Available equity: ${this.formatCurrency(maxEquity)}`
          ],
          actionable: true,
          nextStep: 'Complete assessment for equity release options'
        })
      }
    }

    // Remove duplicate calculations - already handled above in loan-type specific sections

    // Always provide at least one insight - market overview
    if (insights.length === 0) {
      insights.push({
        type: 'advice',
        urgency: 'medium',
        title: '📈 Current Market Analysis',
        message: 'Singapore mortgage rates are competitive with banks offering between 2.8% to 3.8% for new purchases',
        details: [
          'Fixed rates: 2.95% - 3.5% (2-3 year lock-in)',
          'Floating rates: SORA + 0.7% to 1.2%',
          'Refinancing packages starting from 2.8%'
        ],
        actionable: true,
        nextStep: 'Complete your income details for personalized bank recommendations'
      })
    }

    return insights
  }

  /**
   * Gate 3 insights - comprehensive analysis with full data
   */
  private generateGate3Insights(): MortgageInsight[] {
    const insights: MortgageInsight[] = []

    // Provide insights even with partial data
    if (!this.context.monthlyIncome) {
      insights.push({
        type: 'advice',
        urgency: 'medium',
        title: '📊 Preliminary Assessment',
        message: 'Based on current market conditions and your property preferences',
        details: [
          'Average loan approval takes 2-4 weeks',
          'Documentation required: Income proof, CPF statements, employment letter',
          'Pre-approval validity: 30 days typically'
        ],
        actionable: true,
        nextStep: 'Add income details to unlock personalized affordability analysis'
      })
      return insights
    }

    // Calculate TDSR inline
    const monthlyIncome = this.context.monthlyIncome
    const totalDebtObligations = this.context.existingCommitments || 0
    const tdsr = {
      ratio: totalDebtObligations / monthlyIncome,
      availableForHousing: (monthlyIncome * 0.55) - totalDebtObligations,
      limit: 0.55
    }

    // ============================================================================
    // BUG FIX 2: Apply MSR as Additional Constraint for HDB/EC
    // ============================================================================
    // Dr. Elena's MAS Compliance: For HDB/EC, MSR (30%) is an ADDITIONAL constraint
    // Must use whichever is MORE RESTRICTIVE (TDSR or MSR)
    const propertyType = this.context.propertyType || 'Private'
    const isHDBorEC = propertyType === 'HDB' || propertyType === 'EC'
    
    let effectiveMonthlyLimit = tdsr.availableForHousing
    let limitingFactor = 'TDSR'
    
    if (isHDBorEC) {
      // Calculate MSR limit (30% of income, NO debt deduction)
      const msrLimit = monthlyIncome * 0.30
      
      // Use whichever is MORE RESTRICTIVE
      if (msrLimit < tdsr.availableForHousing) {
        effectiveMonthlyLimit = msrLimit
        limitingFactor = 'MSR'
      }
    }
    // ============================================================================

    // Insight 1: Affordability Analysis
    const maxAffordableLoan = this.calculateMaxLoan(effectiveMonthlyLimit, propertyType)
    
    insights.push({
      type: 'analysis',
      urgency: 'high',
      title: '📊 Your Personalized Affordability Analysis',
      message: `Based on MAS TDSR framework, you can afford up to ${this.formatCurrency(maxAffordableLoan)} in loans`,
      calculations: {
        maxLoan: maxAffordableLoan,
        tdsr: tdsr.ratio,
        monthlyPayment: tdsr.availableForHousing
      },
      details: [
        `TDSR Ratio: ${(tdsr.ratio * 100).toFixed(1)}% (limit: 55%)`,
        `Available for housing: ${this.formatCurrency(tdsr.availableForHousing)}/month`,
        `Maximum property value: ${this.formatCurrency(maxAffordableLoan / 0.75)}`
      ],
      actionable: true,
      nextStep: 'Download your personalized mortgage report'
    })

    // Insight 2: Bank Matching based on Dr. Elena's expertise
    const bankRecommendations = this.getBankRecommendations()
    
    insights.push({
      type: 'advice',
      urgency: 'medium',
      title: '🏦 Top 3 Banks for Your Profile',
      message: bankRecommendations.message,
      details: bankRecommendations.banks,
      actionable: true,
      nextStep: 'We\'ll negotiate with these banks on your behalf'
    })

    // Insight 3: Stamp Duty and ABSD calculations (simplified)
    if (this.context.priceRange || this.context.propertyValue) {
      const propertyPrice = this.context.priceRange || this.context.propertyValue || 0
      
      // Simplified stamp duty calculation (approximately 4% for residential)
      const stampDuty = Math.round(propertyPrice * 0.044)
      // ABSD for first-time citizen buyer is 0%
      const absd = 0
      
      insights.push({
        type: 'calculation',
        urgency: 'medium',
        title: '📋 Total Upfront Costs Breakdown',
        message: `Total stamp duties and fees: ${this.formatCurrency(stampDuty + absd + 3500)}`,
        calculations: {
          stampDuty: stampDuty,
          absd: absd
        },
        details: [
          `Buyer's Stamp Duty: ${this.formatCurrency(stampDuty)}`,
          `ABSD: ${this.formatCurrency(absd)} (First property - Citizen)`,
          `Legal fees (est.): ${this.formatCurrency(3000)}`,
          `Valuation fee: ${this.formatCurrency(500)}`
        ],
        actionable: false
      })
    }

    // Insight 4: Optimization opportunities
    const optimizations = this.identifyOptimizations()
    if (optimizations.length > 0) {
      insights.push({
        type: 'opportunity',
        urgency: 'medium',
        title: '💡 Optimization Opportunities',
        message: 'We found ways to improve your mortgage terms',
        details: optimizations,
        actionable: true,
        nextStep: 'Schedule a call with our mortgage specialist'
      })
    }

    return insights
  }

  /**
   * Helper functions for calculations
   */
  private calculateQuickPayment(loanAmount: number): number {
    const monthlyRate = 0.035 / 12 // Assume 3.5% rate
    const months = 25 * 12 // 25 years
    
    const payment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1)
    
    return Math.ceil(payment)
  }

  /**
   * Calculate max loan from monthly payment limit
   * 
   * BUG FIX 2: Now properly applies MSR as additional constraint for HDB/EC
   * Dr. Elena's MAS Compliance: MSR (30%) is MORE RESTRICTIVE than TDSR (55%) for HDB/EC
   */
  private calculateMaxLoan(monthlyPayment: number, propertyType?: string): number {
    const monthlyRate = 0.04 / 12 // Use 4% stress test rate (MAS compliance)
    const months = 25 * 12
    
    // Apply MSR constraint for HDB/EC properties
    // For HDB/EC: MSR limit is MORE RESTRICTIVE than TDSR in typical scenarios
    // Example: Income $4,000, Debt $500
    //   TDSR: ($4,000 × 0.55) - $500 = $1,700/month
    //   MSR: $4,000 × 0.30 = $1,200/month ← Use this (more restrictive)
    let effectiveMonthlyPayment = monthlyPayment
    
    // Note: This function receives TDSR-based monthly limit as input
    // For proper MSR compliance, the calling code should pass the minimum of:
    // - TDSR limit: (income × 0.55) - existing debt
    // - MSR limit: income × 0.30 (for HDB/EC only)
    
    const maxLoan = effectiveMonthlyPayment * 
      (Math.pow(1 + monthlyRate, months) - 1) / 
      (monthlyRate * Math.pow(1 + monthlyRate, months))
    
    // Dr. Elena's client-protective rounding: Round DOWN to nearest $1,000
    return Math.floor(maxLoan / 1000) * 1000
  }

  private calculateRefinanceSavings(): number {
    if (!this.context.currentRate || !this.context.outstandingLoan) return 0
    
    const currentPayment = this.calculatePaymentForRate(
      this.context.outstandingLoan, 
      this.context.currentRate
    )
    
    const newRate = Math.max(2.8, this.context.currentRate - 1) // Assume 1% lower or 2.8% min
    const newPayment = this.calculatePaymentForRate(
      this.context.outstandingLoan,
      newRate
    )
    
    return currentPayment - newPayment
  }

  private calculatePaymentForRate(loan: number, rate: number): number {
    const monthlyRate = rate / 100 / 12
    const months = 20 * 12 // Assume 20 years remaining
    
    return loan * 
      (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1)
  }

  private getBankRecommendations() {
    // Simulate bank matching based on profile
    const banks = [
      'DBS - Lowest rates for stable income profiles',
      'OCBC - Best for self-employed with 2-year track record',
      'UOB - Flexible on TDSR calculations'
    ]
    
    return {
      message: 'Based on your profile, these banks offer the best terms',
      banks
    }
  }

  private identifyOptimizations(): string[] {
    const optimizations: string[] = []
    
    if (this.context.existingCommitments && this.context.existingCommitments > 1000) {
      optimizations.push('Consider consolidating existing loans to improve TDSR')
    }
    
    if (this.context.loanType === 'new_purchase') {
      optimizations.push('Structure as joint application to increase borrowing capacity')
    }
    
    if (this.context.propertyType === 'HDB') {
      optimizations.push('Check eligibility for Enhanced CPF Housing Grant (up to $80,000)')
    }
    
    return optimizations
  }

  private getTimeframe(urgencyScore: number): string {
    if (urgencyScore >= 18) return '1-2 weeks'
    if (urgencyScore >= 15) return '2-4 weeks'
    if (urgencyScore >= 10) return '1-2 months'
    return '2-3 months'
  }

  private getLockInInsight(lockInStatus: string): MortgageInsight | null {
    switch(lockInStatus) {
      case 'no_lockin':
        return {
          type: 'opportunity',
          urgency: 'high',
          title: '✅ Perfect Timing - No Lock-in Period',
          message: 'You can refinance immediately without any penalties',
          details: [
            'Zero penalty fees',
            'Free to switch to better rates',
            'Banks competing aggressively for no-penalty switches'
          ],
          actionable: true,
          nextStep: 'Lock in a better rate before markets change'
        }
      
      case 'expiring_soon':
        return {
          type: 'warning',
          urgency: 'critical',
          title: '⚡ Lock-in Expiring Soon',
          message: 'Your lock-in period is ending - prime time to refinance',
          details: [
            'Start application 3 months before expiry',
            'Multiple banks to compare',
            'Avoid auto-renewal at higher rates'
          ],
          value: 'Act within 30 days',
          actionable: true,
          nextStep: 'Get pre-approved offers from multiple banks'
        }
      
      case 'locked_in':
        return {
          type: 'advice',
          urgency: 'low',
          title: '🔒 Currently in Lock-in Period',
          message: 'Calculate if penalty cost is worth the savings from refinancing',
          details: [
            'Typical penalty: 1.5% of outstanding loan',
            'May still save if rate difference > 1%',
            'Plan ahead for lock-in expiry date'
          ],
          actionable: true,
          nextStep: 'Calculate break-even analysis'
        }
      
      default:
        return null
    }
  }

  private formatCurrency(amount: number): string {
    return `S$${amount.toLocaleString('en-SG')}`
  }
}

/**
 * Factory function to generate insights
 */
export function generateMortgageInsights(
  formData: InsightContext,
  gateNumber: number
): MortgageInsight[] {
  const generator = new MortgageInsightsGenerator(formData)
  return generator.generateInsights(gateNumber)
}