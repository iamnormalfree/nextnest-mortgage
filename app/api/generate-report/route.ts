import { NextRequest, NextResponse } from 'next/server'
import { mortgageFormSchema } from '@/lib/validation/mortgage-schemas'
import { calculateMortgage } from '@/lib/calculations/mortgage'
import { LeadScorer } from '@/lib/processing/lead-scorer'
import { z } from 'zod'

const reportRequestSchema = z.object({
  formData: mortgageFormSchema,
  aiInsights: z.array(z.any()).optional(),
  aiContext: z.any().optional()
})

interface MortgageReport {
  id: string
  client: {
    name: string
    email: string
    phone: string
    loanType: string
  }
  analysis: {
    currentSituation: any
    recommendations: any[]
    savingsOpportunity: any
    marketComparison: any[]
  }
  leadScore: any
  nextSteps: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  compliance: {
    pdpaConsent: boolean
    disclosures: string[]
    regulatoryNotes: string[]
  }
  generatedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formData, aiInsights, aiContext } = reportRequestSchema.parse(body)

    // Generate comprehensive mortgage report
    const report = await generateMortgageReport(formData, aiInsights, aiContext)

    // Store report in database (in production)
    // await saveReportToDatabase(report)

    return NextResponse.json({
      success: true,
      report,
      reportUrl: `/reports/${report.id}` // For future PDF download
    })

  } catch (error) {
    console.error('Report Generation Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

async function generateMortgageReport(
  formData: any,
  aiInsights?: any[],
  aiContext?: any
): Promise<MortgageReport> {
  
  const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Calculate mortgage metrics
  const mortgageCalculation = calculateMortgageAnalysis(formData)
  
  // Generate lead score
  const leadScore = LeadScorer.calculateScore(formData, aiContext)
  
  // Generate analysis based on loan type
  const analysis = await generateAnalysis(formData, mortgageCalculation, aiInsights)
  
  // Generate recommendations
  const recommendations = generateRecommendations(formData, analysis, aiInsights)
  
  // Generate next steps
  const nextSteps = generateNextSteps(formData, leadScore.category)
  
  return {
    id: reportId,
    client: {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      loanType: formData.loanType
    },
    analysis: {
      currentSituation: analysis.currentSituation,
      recommendations: recommendations,
      savingsOpportunity: analysis.savingsOpportunity,
      marketComparison: analysis.marketComparison
    },
    leadScore,
    nextSteps,
    compliance: {
      pdpaConsent: formData.marketingConsent || false,
      disclosures: [
        'NextNest Pte Ltd is licensed by MAS as a mortgage broker',
        'We earn commission from successful loan placements but provide transparent advice',
        'All rate quotations are indicative and subject to bank approval',
        'This analysis is based on information provided and current market conditions'
      ],
      regulatoryNotes: [
        'Subject to MAS TDSR/MSR requirements',
        'Final approval depends on credit assessment',
        'Interest rates subject to change'
      ]
    },
    generatedAt: new Date().toISOString()
  }
}

function calculateMortgageAnalysis(formData: any) {
  try {
    // Convert form data to calculation input
    const calculationInput = convertFormDataToCalculationInput(formData)
    return calculateMortgage(calculationInput)
  } catch (error) {
    console.error('Mortgage calculation error:', error)
    // Return basic analysis if calculation fails
    return generateBasicAnalysis(formData)
  }
}

function convertFormDataToCalculationInput(formData: any) {
  const base = {
    loanTerm: 25, // Default
    propertyType: (formData.propertyType || 'Private') as 'HDB' | 'EC' | 'Private' | 'Commercial',
    citizenship: 'Citizen' as const, // Default
    isFirstProperty: formData.firstTimeBuyer !== false
  }

  if (formData.loanType === 'new_purchase') {
    return {
      ...base,
      loanAmount: (formData.priceRange || 800000) * 0.8, // Assume 80% LTV
      interestRate: getMarketRate(formData.propertyType),
      propertyValue: formData.priceRange || 800000,
      downPayment: (formData.priceRange || 800000) * 0.2
    }
  }

  if (formData.loanType === 'refinance') {
    return {
      ...base,
      loanAmount: formData.outstandingLoan || 500000,
      interestRate: formData.currentRate || 3.5,
      propertyValue: formData.propertyValue || (formData.outstandingLoan || 500000) * 1.2
    }
  }

  if (formData.loanType === 'commercial') {
    return {
      ...base,
      loanAmount: formData.equityAmount || 200000,
      interestRate: 4.5, // Equity loans typically higher
      propertyValue: formData.propertyValue || 1000000
    }
  }

  // Fallback
  return {
    ...base,
    loanAmount: 500000,
    interestRate: 3.5,
    propertyValue: 600000
  }
}

function getMarketRate(propertyType: string): number {
  const marketRates = {
    'HDB': 2.6,
    'EC': 2.8,
    'Private': 3.1,
    'Landed': 3.2,
    'Commercial': 4.2
  }
  return marketRates[propertyType as keyof typeof marketRates] || 3.1
}

function generateBasicAnalysis(formData: any) {
  // Basic analysis when calculation fails
  const loanAmount = formData.outstandingLoan || formData.priceRange * 0.8 || 500000
  const rate = formData.currentRate || 3.5
  const monthlyPayment = (loanAmount * (rate/100/12)) / (1 - Math.pow(1 + (rate/100/12), -300))
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    loanAmount,
    interestRate: rate,
    loanTerm: 25,
    totalPayment: Math.round(monthlyPayment * 300),
    totalInterest: Math.round(monthlyPayment * 300 - loanAmount)
  }
}

async function generateAnalysis(formData: any, calculation: any, aiInsights?: any[]) {
  const currentSituation = {
    loanType: formData.loanType,
    currentMonthlyPayment: calculation.monthlyPayment,
    totalInterestPayable: calculation.totalInterest,
    propertyType: formData.propertyType || 'Not specified',
    loanAmount: calculation.loanAmount
  }

  // Market comparison - simulate bank offerings
  const marketComparison = generateMarketComparison(formData, calculation)
  
  // Savings opportunity
  const savingsOpportunity = calculateSavingsOpportunity(formData, calculation, marketComparison)

  return {
    currentSituation,
    savingsOpportunity,
    marketComparison
  }
}

function generateMarketComparison(formData: any, calculation: any) {
  const banks = [
    { name: 'DBS', rate: 3.05, fees: 2500, features: ['Flexible repayment', '24/7 online banking'] },
    { name: 'OCBC', rate: 3.08, fees: 2300, features: ['Rate lock option', 'Premier banking perks'] },
    { name: 'UOB', rate: 3.12, fees: 2400, features: ['Cashback rewards', 'Investment linkage'] },
    { name: 'Maybank', rate: 2.95, fees: 2600, features: ['Competitive rates', 'Fast approval'] },
    { name: 'HSBC', rate: 3.15, fees: 2200, features: ['Global banking', 'Wealth management'] }
  ]

  return banks.map(bank => {
    const monthlyRate = bank.rate / 100 / 12
    const numPayments = calculation.loanTerm * 12
    const monthlyPayment = (calculation.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1)
    
    return {
      bank: bank.name,
      interestRate: bank.rate,
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(monthlyPayment * numPayments - calculation.loanAmount),
      fees: bank.fees,
      features: bank.features,
      savings: Math.round(calculation.monthlyPayment - monthlyPayment)
    }
  }).sort((a, b) => b.savings - a.savings) // Sort by savings descending
}

function calculateSavingsOpportunity(formData: any, calculation: any, marketComparison: any[]) {
  if (marketComparison.length === 0) return null

  const bestOption = marketComparison[0]
  const monthlySavings = bestOption.savings
  const yearlySavings = monthlySavings * 12
  const totalSavings = monthlySavings * calculation.loanTerm * 12

  return {
    bestBank: bestOption.bank,
    bestRate: bestOption.interestRate,
    monthlySavings,
    yearlySavings,
    totalSavingsOverTerm: totalSavings,
    breakEvenMonths: bestOption.fees > 0 ? Math.ceil(bestOption.fees / monthlySavings) : 0
  }
}

function generateRecommendations(formData: any, analysis: any, aiInsights?: any[]) {
  const recommendations = []

  // Primary recommendation based on savings
  if (analysis.savingsOpportunity && analysis.savingsOpportunity.monthlySavings > 200) {
    recommendations.push({
      priority: 'high',
      title: 'Significant Savings Opportunity',
      description: `Switch to ${analysis.savingsOpportunity.bestBank} to save SGD ${analysis.savingsOpportunity.monthlySavings}/month`,
      action: 'Schedule consultation to discuss refinancing',
      expectedBenefit: `SGD ${analysis.savingsOpportunity.totalSavingsOverTerm.toLocaleString()} over loan term`
    })
  }

  // Timing recommendations
  if (formData.loanType === 'refinance' && formData.lockInStatus === 'ending_soon') {
    recommendations.push({
      priority: 'high',
      title: 'Perfect Timing Window',
      description: 'Your lock-in period is ending soon - ideal time to refinance without penalties',
      action: 'Apply for refinancing within next 30 days',
      expectedBenefit: 'Avoid lock-in penalties and secure better rates'
    })
  }

  // First-time buyer recommendations
  if (formData.loanType === 'new_purchase' && formData.firstTimeBuyer) {
    recommendations.push({
      priority: 'medium',
      title: 'First-Time Buyer Benefits',
      description: 'Maximize available grants and scheme benefits',
      action: 'Review CPF grants and HDB/bank schemes eligibility',
      expectedBenefit: 'Up to SGD 80,000 in additional financial support'
    })
  }

  // Add AI insights as recommendations
  if (aiInsights) {
    aiInsights.forEach(insight => {
      if (insight.actionable) {
        recommendations.push({
          priority: insight.urgency,
          title: insight.title,
          description: insight.message,
          action: 'Discuss with mortgage advisor',
          expectedBenefit: insight.value || 'Optimized mortgage strategy'
        })
      }
    })
  }

  return recommendations.slice(0, 5) // Limit to top 5 recommendations
}

function generateNextSteps(formData: any, leadCategory: string) {
  const immediate = []
  const shortTerm = []
  const longTerm = []

  if (leadCategory === 'premium') {
    immediate.push('Senior advisor will contact within 2 hours')
    immediate.push('Prepare recent salary slips and bank statements')
    shortTerm.push('Complete detailed financial assessment')
    shortTerm.push('Receive personalized rate quotes from 5+ banks')
    longTerm.push('Execute optimal refinancing/purchase strategy')
  } else if (leadCategory === 'qualified') {
    immediate.push('Mortgage specialist will contact within 4 hours')
    immediate.push('Review current loan statements (if refinancing)')
    shortTerm.push('Conduct comprehensive mortgage comparison')
    shortTerm.push('Negotiate with preferred banks on your behalf')
    longTerm.push('Complete mortgage application process')
  } else {
    immediate.push('Receive detailed market analysis via email')
    immediate.push('Access our online mortgage calculator for scenarios')
    shortTerm.push('Educational content on mortgage optimization')
    shortTerm.push('Periodic market updates and opportunities')
    longTerm.push('Re-engage when ready to proceed')
  }

  return { immediate, shortTerm, longTerm }
}