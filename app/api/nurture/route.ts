import { NextRequest, NextResponse } from 'next/server'
import { NurtureEngine, NurtureSequence } from '@/lib/engagement/nurture-engine'
import { LeadScorer } from '@/lib/processing/lead-scorer'
import { z } from 'zod'

const nurtureRequestSchema = z.object({
  leadData: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    loanType: z.enum(['new_purchase', 'refinance', 'commercial']).optional(),
    propertyType: z.string().optional(),
    currentRate: z.number().optional(),
    lockInStatus: z.string().optional(),
    ipaStatus: z.string().optional(),
    purchaseTimeline: z.string().optional()
  }),
  aiInsights: z.array(z.any()).optional(),
  leadScore: z.any().optional(),
  triggerType: z.enum(['immediate', 'scheduled', 'conditional']).default('immediate')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadData, aiInsights = [], leadScore, triggerType } = nurtureRequestSchema.parse(body)

    // Generate lead score if not provided
    let finalLeadScore = leadScore
    if (!finalLeadScore) {
      finalLeadScore = LeadScorer.calculateScore(leadData as any)
    }

    // Create nurture sequence
    const sequence = NurtureEngine.createSequence(leadData, finalLeadScore, aiInsights)

    // Schedule nurture execution
    const executionPlan = await scheduleNurtureSequence(leadData, sequence, triggerType)

    return NextResponse.json({
      success: true,
      sequence: {
        name: sequence.name,
        duration: sequence.duration,
        expectedConversion: sequence.expectedConversion,
        stageCount: sequence.stages.length
      },
      executionPlan,
      leadScore: {
        category: finalLeadScore.category,
        priority: finalLeadScore.priority,
        total: finalLeadScore.total
      }
    })

  } catch (error) {
    console.error('Nurture API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create nurture sequence' },
      { status: 500 }
    )
  }
}

// Engagement tracking endpoint
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const stage = searchParams.get('stage')
    const action = searchParams.get('action')

    if (!leadId || !stage || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Track engagement
    NurtureEngine.trackEngagement(leadId, parseInt(stage), action)

    // Update lead score if significant engagement
    if (['email_click', 'call_answered', 'form_submit'].includes(action)) {
      await updateLeadEngagement(leadId, action)
    }

    return NextResponse.json({
      success: true,
      message: 'Engagement tracked successfully'
    })

  } catch (error) {
    console.error('Engagement tracking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track engagement' },
      { status: 500 }
    )
  }
}

async function scheduleNurtureSequence(
  leadData: any, 
  sequence: NurtureSequence, 
  triggerType: string
) {
  const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const executionPlan = []

  for (const stage of sequence.stages) {
    const scheduleTime = calculateScheduleTime(stage.day, triggerType)
    
    const execution = {
      stageId: `${leadId}-S${stage.day}`,
      day: stage.day,
      title: stage.title,
      type: stage.type,
      scheduledTime: scheduleTime,
      status: 'scheduled',
      content: await personalizeContent(stage.content, leadData)
    }

    executionPlan.push(execution)

    // In production: Schedule actual execution
    // - Queue in task scheduler (Bull, Agenda, etc.)
    // - Set up webhooks for email/SMS services
    // - Create CRM tasks for calls
    console.log(`Scheduled: ${stage.title} for ${scheduleTime}`)
  }

  return {
    leadId,
    sequenceName: sequence.name,
    totalStages: executionPlan.length,
    duration: sequence.duration,
    stages: executionPlan.map(stage => ({
      day: stage.day,
      title: stage.title,
      type: stage.type,
      scheduledTime: stage.scheduledTime
    }))
  }
}

function calculateScheduleTime(day: number, triggerType: string): string {
  const baseTime = new Date()
  
  if (triggerType === 'immediate' && day === 0) {
    // Send immediately for day 0 stages
    baseTime.setMinutes(baseTime.getMinutes() + 5)
  } else {
    // Schedule for business hours
    baseTime.setDate(baseTime.getDate() + day)
    baseTime.setHours(9, 0, 0, 0) // 9 AM
    
    // Avoid weekends
    const dayOfWeek = baseTime.getDay()
    if (dayOfWeek === 0) baseTime.setDate(baseTime.getDate() + 1) // Sunday -> Monday
    if (dayOfWeek === 6) baseTime.setDate(baseTime.getDate() + 2) // Saturday -> Monday
  }

  return baseTime.toISOString()
}

async function personalizeContent(content: any, leadData: any) {
  let personalizedMessage = content.message
  let personalizedSubject = content.subject || ''

  // Replace personalization tokens
  const replacements = {
    '{name}': leadData.name,
    '{property_type}': leadData.propertyType || 'property',
    '{loan_type}': leadData.loanType || 'mortgage',
    '{savings}': content.personalization?.savings || 'potential savings',
    '{timeline}': content.personalization?.timeline || 'your timeline',
    '{opportunity}': content.personalization?.opportunity || 'additional benefits'
  }

  for (const [token, value] of Object.entries(replacements)) {
    personalizedMessage = personalizedMessage.replace(new RegExp(token, 'g'), value)
    personalizedSubject = personalizedSubject.replace(new RegExp(token, 'g'), value)
  }

  return {
    ...content,
    message: personalizedMessage,
    subject: personalizedSubject,
    personalized: true,
    personalizedAt: new Date().toISOString()
  }
}

async function updateLeadEngagement(leadId: string, action: string) {
  // Update lead score based on engagement
  const engagementBonus = {
    'email_open': 0.1,
    'email_click': 0.3,
    'call_answered': 0.5,
    'form_submit': 0.7,
    'meeting_scheduled': 1.0
  }

  const bonus = engagementBonus[action as keyof typeof engagementBonus] || 0
  
  console.log(`Updated lead ${leadId} engagement score by +${bonus} for ${action}`)
  
  // In production:
  // - Update lead score in database
  // - Trigger sequence modifications if needed
  // - Update CRM records
}

// Utility endpoint to get sequence templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'

    const sequences = getSequenceTemplates(category)

    return NextResponse.json({
      success: true,
      sequences,
      categories: ['premium', 'qualified', 'nurture', 'cold']
    })

  } catch (error) {
    console.error('Get sequences error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get sequences' },
      { status: 500 }
    )
  }
}

function getSequenceTemplates(category: string) {
  const templates = {
    premium: {
      name: 'Premium VIP Sequence',
      description: 'White-glove service for high-value prospects',
      duration: 14,
      expectedConversion: 75,
      stages: 6,
      features: ['Personal advisor', 'Same-day response', 'Exclusive offers']
    },
    qualified: {
      name: 'Qualified Professional Sequence',
      description: 'Structured engagement for qualified prospects',
      duration: 21,
      expectedConversion: 45,
      stages: 6,
      features: ['Professional consultation', 'Detailed reports', 'Market updates']
    },
    nurture: {
      name: 'Educational Nurture Sequence',
      description: 'Value-first education to build trust',
      duration: 60,
      expectedConversion: 25,
      stages: 6,
      features: ['Educational content', 'Case studies', 'Market insights']
    },
    cold: {
      name: 'Minimal Touch Sequence',
      description: 'Light-touch nurturing for low-engagement prospects',
      duration: 90,
      expectedConversion: 8,
      stages: 3,
      features: ['Quarterly updates', 'Basic analysis', 'Minimal contact']
    }
  }

  if (category === 'all') {
    return templates
  }

  return { [category]: templates[category as keyof typeof templates] }
}