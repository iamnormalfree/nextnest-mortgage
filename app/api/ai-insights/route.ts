import { NextRequest, NextResponse } from 'next/server'
import { mortgageFormSchema, AIContext, aiContextSchema } from '@/lib/validation/mortgage-schemas'
import { z } from 'zod'

interface AIInsight {
  type: 'market_alert' | 'rate_opportunity' | 'timing_advice' | 'negotiation_tip' | 'savings_calculation'
  title: string
  message: string
  urgency: 'low' | 'medium' | 'high'
  value?: string
  data?: Record<string, any>
  actionable?: boolean
  category: 'financial' | 'market' | 'timing' | 'strategy'
}

const requestSchema = z.object({
  formData: z.record(z.string(), z.any()), // Accept any form data for flexibility
  aiContext: aiContextSchema.optional(),
  stage: z.enum(['initial', 'detailed', 'final']).default('initial')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formData, aiContext, stage } = requestSchema.parse(body)

    // Generate AI insights based on form data and context
    const insights = await generateIntelligentInsights(formData, aiContext, stage)

    return NextResponse.json({
      success: true,
      insights,
      generated_at: new Date().toISOString(),
      stage
    })

  } catch (error) {
    console.error('AI Insights API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate insights' 
      },
      { status: 500 }
    )
  }
}

async function generateIntelligentInsights(
  formData: any, 
  aiContext?: AIContext, 
  stage: 'initial' | 'detailed' | 'final' = 'initial'
): Promise<AIInsight[]> {
  const insights: AIInsight[] = []

  // Refinancing insights
  if (formData.loanType === 'refinance') {
    insights.push(...generateRefinanceInsights(formData, aiContext))
  }

  // New purchase insights
  if (formData.loanType === 'new_purchase') {
    insights.push(...generateNewPurchaseInsights(formData, aiContext))
  }

  // Commercial loan insights
  if (formData.loanType === 'commercial') {
    insights.push(...generateCommercialInsights(formData, aiContext))
  }

  // Market context insights
  if (aiContext?.marketContext) {
    insights.push(...generateMarketInsights(formData, aiContext))
  }

  // Behavioral insights
  if (aiContext?.userBehavior) {
    insights.push(...generateBehavioralInsights(formData, aiContext))
  }

  // Stage-specific insights
  if (stage === 'detailed' || stage === 'final') {
    insights.push(...generateAdvancedInsights(formData, aiContext, stage))
  }

  // Prioritize and limit insights
  return prioritizeInsights(insights, stage)
}

function generateRefinanceInsights(formData: any, aiContext?: AIContext): AIInsight[] {
  const insights: AIInsight[] = []

  // Rate opportunity analysis
  if (formData.currentRate && formData.currentRate > 3.2) {
    const potentialSavings = Math.round((formData.currentRate - 3.0) * formData.outstandingLoan / 100 / 12)
    insights.push({
      type: 'rate_opportunity',
      title: 'High Savings Potential Detected',
      message: `Your ${formData.currentRate}% rate is ${(formData.currentRate - 3.0).toFixed(1)}% above current market rates. Refinancing could save significant monthly payments.`,
      urgency: formData.currentRate > 4.0 ? 'high' : 'medium',
      value: `SGD ${potentialSavings.toLocaleString()}/month`,
      data: { monthlySavings: potentialSavings, yearlyTotal: potentialSavings * 12 },
      actionable: true,
      category: 'financial'
    })
  }

  // Lock-in status insights
  if (formData.lockInStatus === 'ending_soon') {
    insights.push({
      type: 'timing_advice',
      title: 'Perfect Refinancing Window',
      message: 'Your lock-in period is ending soon - ideal timing to refinance without penalties. Market rates are favorable.',
      urgency: 'high',
      actionable: true,
      category: 'timing'
    })
  } else if (formData.lockInStatus === 'locked') {
    insights.push({
      type: 'timing_advice',
      title: 'Lock-in Period Active',
      message: 'Consider penalty costs vs. potential savings. We can calculate if breaking your lock-in makes financial sense.',
      urgency: 'medium',
      actionable: true,
      category: 'strategy'
    })
  }

  return insights
}

function generateNewPurchaseInsights(formData: any, aiContext?: AIContext): AIInsight[] {
  const insights: AIInsight[] = []

  // IPA status insights
  if (formData.ipaStatus === 'what_is_ipa' || formData.ipaStatus === 'starting') {
    insights.push({
      type: 'negotiation_tip',
      title: 'IPA First Strategy',
      message: 'Get In-Principle Approval before house hunting. Sellers prefer pre-approved buyers - gives you 10-15% better negotiation power.',
      urgency: 'high',
      value: '10-15% negotiation advantage',
      actionable: true,
      category: 'strategy'
    })
  }

  // Property type specific insights
  if (formData.propertyType === 'HDB' && formData.firstTimeBuyer) {
    insights.push({
      type: 'market_alert',
      title: 'First-Timer HDB Benefits',
      message: 'As a first-time buyer, you qualify for up to SGD 80,000 in grants. Maximize your purchasing power.',
      urgency: 'medium',
      value: 'Up to SGD 80,000 grants',
      actionable: true,
      category: 'financial'
    })
  }

  if (formData.propertyType === 'Private' && formData.priceRange > 1500000) {
    insights.push({
      type: 'market_alert',
      title: 'Premium Market Intelligence',
      message: 'Luxury segment showing price corrections. Consider properties 5-10% below asking price for better value.',
      urgency: 'medium',
      value: '5-10% potential savings',
      actionable: true,
      category: 'market'
    })
  }

  return insights
}

function generateCommercialInsights(formData: any, aiContext?: AIContext): AIInsight[] {
  const insights: AIInsight[] = []

  if (formData.businessType === 'retail' || formData.businessType === 'office') {
    insights.push({
      type: 'timing_advice',
      title: 'Commercial Specialist Required',
      message: 'Commercial properties require specialized financing structures. Our commercial specialist will contact you within 24 hours.',
      urgency: 'high',
      actionable: true,
      category: 'strategy'
    })
  }

  return insights
}

function generateMarketInsights(formData: any, aiContext: AIContext): AIInsight[] {
  const insights: AIInsight[] = []

  if (aiContext.marketContext.rateDirection === 'rising') {
    insights.push({
      type: 'timing_advice',
      title: 'Rate Environment Alert',
      message: 'Interest rates trending upward. Lock in favorable rates within next 30-60 days to avoid increases.',
      urgency: 'high',
      actionable: true,
      category: 'timing'
    })
  }

  if (aiContext.marketContext.marketSentiment === 'cooling') {
    insights.push({
      type: 'negotiation_tip',
      title: 'Buyer\'s Market Advantage',
      message: 'Current market cooling gives buyers more negotiation power. Consider making strategic offers 5-8% below asking.',
      urgency: 'medium',
      value: '5-8% negotiation room',
      actionable: true,
      category: 'strategy'
    })
  }

  return insights
}

function generateBehavioralInsights(formData: any, aiContext: AIContext): AIInsight[] {
  const insights: AIInsight[] = []

  if (aiContext.userBehavior.timeOnPage > 300 && aiContext.leadIntelligence.urgencyScore < 5) {
    insights.push({
      type: 'timing_advice',
      title: 'Take Your Time',
      message: 'We notice you\'re researching thoroughly. Smart approach! Our analysis shows the best rates for careful decision-makers.',
      urgency: 'low',
      actionable: false,
      category: 'strategy'
    })
  }

  return insights
}

function generateAdvancedInsights(formData: any, aiContext?: AIContext, stage: 'detailed' | 'final' = 'detailed'): AIInsight[] {
  const insights: AIInsight[] = []

  if (stage === 'final') {
    // Advanced calculations and comprehensive analysis
    insights.push({
      type: 'savings_calculation',
      title: 'Complete Financial Analysis',
      message: 'Comprehensive analysis includes ALL costs: legal fees, valuation, opportunity costs, and 10-year projections.',
      urgency: 'low',
      actionable: true,
      category: 'financial'
    })
  }

  return insights
}

function prioritizeInsights(insights: AIInsight[], stage: string): AIInsight[] {
  // Sort by urgency and relevance
  const sorted = insights.sort((a, b) => {
    const urgencyOrder = { high: 3, medium: 2, low: 1 }
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
  })

  // Limit insights based on stage
  const maxInsights = stage === 'initial' ? 3 : stage === 'detailed' ? 5 : 7
  return sorted.slice(0, maxInsights)
}