import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const analyticsEventSchema = z.object({
  event: z.enum(['page_view', 'form_start', 'form_step', 'form_submit', 'ai_insight_view', 'cta_click']),
  properties: z.object({
    page: z.string().optional(),
    step: z.string().optional(),
    form_type: z.enum(['legacy', 'intelligent']).optional(),
    loan_type: z.string().optional(),
    insight_type: z.string().optional(),
    cta_text: z.string().optional(),
    session_id: z.string().optional(),
    user_id: z.string().optional(),
    timestamp: z.number().optional(),
    time_on_page: z.number().optional(),
    page_url: z.string().optional(),
    referrer: z.string().optional(),
    engaged: z.string().optional(),
    location: z.string().optional(),
    signal: z.string().optional(),
    value: z.string().optional()
  })
})

interface ConversionFunnel {
  date: string
  total_page_views: number
  form_starts: number
  form_completions: number
  intelligent_form_starts: number
  intelligent_form_completions: number
  ai_insights_viewed: number
  conversion_rate: number
  intelligent_conversion_rate: number
}

// Store analytics data (in production, use proper database)
const analyticsData: any[] = []
let dailyStats: Record<string, ConversionFunnel> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = analyticsEventSchema.parse(body)
    
    // Enrich event data
    const enrichedEvent = {
      ...event,
      properties: {
        ...event.properties,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || '',
        timestamp: event.properties.timestamp || Date.now()
      },
      received_at: new Date().toISOString()
    }

    // Store event
    analyticsData.push(enrichedEvent)
    
    // Update daily statistics
    updateDailyStats(enrichedEvent)
    
    // Process event for real-time insights
    await processEventForInsights(enrichedEvent)
    
    console.log('Analytics event processed:', {
      event: enrichedEvent.event,
      session: enrichedEvent.properties.session_id,
      form_type: enrichedEvent.properties.form_type
    })

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    })

  } catch (error) {
    console.error('Analytics API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid event data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process analytics event' },
      { status: 500 }
    )
  }
}

// Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const metric = searchParams.get('metric') || 'overview'

    let responseData: any

    switch (metric) {
      case 'funnel':
        responseData = getConversionFunnel(period)
        break
      case 'ai_insights':
        responseData = getAIInsightsPerformance()
        break
      case 'form_performance':
        responseData = getFormPerformance()
        break
      case 'real_time':
        responseData = getRealTimeStats()
        break
      default:
        responseData = getOverviewStats(period)
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve analytics data' },
      { status: 500 }
    )
  }
}

function updateDailyStats(event: any) {
  const date = new Date(event.properties.timestamp).toISOString().split('T')[0]
  
  if (!dailyStats[date]) {
    dailyStats[date] = {
      date,
      total_page_views: 0,
      form_starts: 0,
      form_completions: 0,
      intelligent_form_starts: 0,
      intelligent_form_completions: 0,
      ai_insights_viewed: 0,
      conversion_rate: 0,
      intelligent_conversion_rate: 0
    }
  }

  const stats = dailyStats[date]

  switch (event.event) {
    case 'page_view':
      stats.total_page_views++
      break
    case 'form_start':
      stats.form_starts++
      if (event.properties.form_type === 'intelligent') {
        stats.intelligent_form_starts++
      }
      break
    case 'form_submit':
      stats.form_completions++
      if (event.properties.form_type === 'intelligent') {
        stats.intelligent_form_completions++
      }
      break
    case 'ai_insight_view':
      stats.ai_insights_viewed++
      break
  }

  // Calculate conversion rates
  if (stats.form_starts > 0) {
    stats.conversion_rate = (stats.form_completions / stats.form_starts) * 100
  }
  if (stats.intelligent_form_starts > 0) {
    stats.intelligent_conversion_rate = (stats.intelligent_form_completions / stats.intelligent_form_starts) * 100
  }
}

async function processEventForInsights(event: any) {
  // Process high-value events for real-time optimization
  if (event.event === 'form_submit' && event.properties.form_type === 'intelligent') {
    // High-value conversion - could trigger immediate follow-up
    console.log('High-value conversion detected:', event.properties.session_id)
  }

  if (event.event === 'ai_insight_view' && event.properties.engaged === 'true') {
    // User engaged with AI insights - good lead quality indicator
    console.log('AI engagement detected:', event.properties.insight_type)
  }

  // Detect drop-off points
  if (event.event === 'form_step' && event.properties.step === 'loan_details') {
    const sessionEvents = analyticsData.filter(e => 
      e.properties.session_id === event.properties.session_id
    )
    
    // Check if this is where users typically drop off
    const timeSpent = event.properties.time_on_page || 0
    if (timeSpent < 30000) { // Less than 30 seconds
      console.log('Potential drop-off detected at loan_details step')
    }
  }
}

function getConversionFunnel(period: string) {
  const days = parseInt(period.replace('d', '')) || 7
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const funnelData = Object.values(dailyStats)
    .filter(stats => new Date(stats.date) >= startDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totals = funnelData.reduce((acc, day) => ({
    page_views: acc.page_views + day.total_page_views,
    form_starts: acc.form_starts + day.form_starts,
    form_completions: acc.form_completions + day.form_completions,
    intelligent_starts: acc.intelligent_starts + day.intelligent_form_starts,
    intelligent_completions: acc.intelligent_completions + day.intelligent_form_completions,
    ai_insights: acc.ai_insights + day.ai_insights_viewed
  }), {
    page_views: 0,
    form_starts: 0,
    form_completions: 0,
    intelligent_starts: 0,
    intelligent_completions: 0,
    ai_insights: 0
  })

  return {
    daily_data: funnelData,
    period_totals: totals,
    conversion_rate: totals.form_starts > 0 ? (totals.form_completions / totals.form_starts * 100) : 0,
    intelligent_conversion_rate: totals.intelligent_starts > 0 ? (totals.intelligent_completions / totals.intelligent_starts * 100) : 0,
    ai_engagement_rate: totals.form_starts > 0 ? (totals.ai_insights / totals.form_starts * 100) : 0
  }
}

function getAIInsightsPerformance() {
  const aiEvents = analyticsData.filter(e => e.event === 'ai_insight_view')
  
  const insightTypes: Record<string, { views: number, engaged: number }> = {}
  
  aiEvents.forEach(event => {
    const type = event.properties.insight_type || 'unknown'
    if (!insightTypes[type]) {
      insightTypes[type] = { views: 0, engaged: 0 }
    }
    insightTypes[type].views++
    if (event.properties.engaged === 'true') {
      insightTypes[type].engaged++
    }
  })

  return {
    total_insights_shown: aiEvents.length,
    insight_performance: Object.entries(insightTypes).map(([type, stats]) => ({
      type,
      views: stats.views,
      engaged: stats.engaged,
      engagement_rate: stats.views > 0 ? (stats.engaged / stats.views * 100) : 0
    })),
    top_performing_insights: Object.entries(insightTypes)
      .sort((a, b) => (b[1].engaged / b[1].views) - (a[1].engaged / a[1].views))
      .slice(0, 5)
  }
}

function getFormPerformance() {
  const formEvents = analyticsData.filter(e => 
    ['form_start', 'form_step', 'form_submit'].includes(e.event)
  )

  const sessionAnalysis: Record<string, any> = {}

  formEvents.forEach(event => {
    const session = event.properties.session_id
    if (!session) return

    if (!sessionAnalysis[session]) {
      sessionAnalysis[session] = {
        form_type: event.properties.form_type,
        steps: [],
        completed: false,
        start_time: null,
        completion_time: null
      }
    }

    const analysis = sessionAnalysis[session]
    
    if (event.event === 'form_start') {
      analysis.start_time = event.properties.timestamp
    } else if (event.event === 'form_step') {
      analysis.steps.push({
        step: event.properties.step,
        timestamp: event.properties.timestamp
      })
    } else if (event.event === 'form_submit') {
      analysis.completed = true
      analysis.completion_time = event.properties.timestamp
    }
  })

  const sessions = Object.values(sessionAnalysis)
  const completedSessions = sessions.filter((s: any) => s.completed)
  const legacySessions = sessions.filter((s: any) => s.form_type === 'legacy')
  const intelligentSessions = sessions.filter((s: any) => s.form_type === 'intelligent')

  return {
    total_sessions: sessions.length,
    completion_rate: sessions.length > 0 ? (completedSessions.length / sessions.length * 100) : 0,
    legacy_conversion: legacySessions.length > 0 ? 
      (legacySessions.filter((s: any) => s.completed).length / legacySessions.length * 100) : 0,
    intelligent_conversion: intelligentSessions.length > 0 ? 
      (intelligentSessions.filter((s: any) => s.completed).length / intelligentSessions.length * 100) : 0,
    average_completion_time: calculateAverageCompletionTime(completedSessions),
    drop_off_points: calculateDropOffPoints(sessions)
  }
}

function getRealTimeStats() {
  const last24Hours = analyticsData.filter(e => 
    e.properties.timestamp > Date.now() - 24 * 60 * 60 * 1000
  )

  const lastHour = analyticsData.filter(e =>
    e.properties.timestamp > Date.now() - 60 * 60 * 1000
  )

  return {
    last_24h: {
      page_views: last24Hours.filter(e => e.event === 'page_view').length,
      form_starts: last24Hours.filter(e => e.event === 'form_start').length,
      form_submits: last24Hours.filter(e => e.event === 'form_submit').length,
      ai_insights: last24Hours.filter(e => e.event === 'ai_insight_view').length
    },
    last_hour: {
      page_views: lastHour.filter(e => e.event === 'page_view').length,
      form_starts: lastHour.filter(e => e.event === 'form_start').length,
      form_submits: lastHour.filter(e => e.event === 'form_submit').length,
      ai_insights: lastHour.filter(e => e.event === 'ai_insight_view').length
    },
    active_sessions: getActiveSessionCount()
  }
}

function getOverviewStats(period: string) {
  const funnel = getConversionFunnel(period)
  const aiPerformance = getAIInsightsPerformance()
  const formPerformance = getFormPerformance()

  return {
    funnel_overview: {
      page_views: funnel.period_totals.page_views,
      form_starts: funnel.period_totals.form_starts,
      completions: funnel.period_totals.form_completions,
      conversion_rate: funnel.conversion_rate
    },
    ai_impact: {
      insights_shown: aiPerformance.total_insights_shown,
      engagement_rate: aiPerformance.insight_performance.reduce((acc, i) => acc + i.engagement_rate, 0) / aiPerformance.insight_performance.length || 0,
      conversion_lift: funnel.intelligent_conversion_rate - (funnel.conversion_rate - funnel.intelligent_conversion_rate)
    },
    form_comparison: {
      legacy_conversion: formPerformance.legacy_conversion,
      intelligent_conversion: formPerformance.intelligent_conversion,
      improvement: formPerformance.intelligent_conversion - formPerformance.legacy_conversion
    }
  }
}

function calculateAverageCompletionTime(sessions: any[]): number {
  const times = sessions
    .filter((s: any) => s.start_time && s.completion_time)
    .map((s: any) => s.completion_time - s.start_time)

  return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
}

function calculateDropOffPoints(sessions: any[]): any[] {
  const stepCounts: Record<string, number> = {}
  
  sessions.forEach((session: any) => {
    session.steps.forEach((step: any) => {
      stepCounts[step.step] = (stepCounts[step.step] || 0) + 1
    })
  })

  return Object.entries(stepCounts)
    .map(([step, count]) => ({ step, count }))
    .sort((a, b) => b.count - a.count)
}

function getActiveSessionCount(): number {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const recentSessions = new Set(
    analyticsData
      .filter(e => e.properties.timestamp > fiveMinutesAgo)
      .map(e => e.properties.session_id)
      .filter(Boolean)
  )
  return recentSessions.size
}