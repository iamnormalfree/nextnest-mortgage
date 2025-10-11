import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateUrgencyProfile } from '@/lib/calculations/urgency-calculator'
import { SituationalAnalysisAgent } from '@/lib/agents/situational-analysis-agent'
import { RateIntelligenceAgent } from '@/lib/agents/rate-intelligence-agent'
import { DynamicDefenseAgent } from '@/lib/agents/dynamic-defense-agent'
import { CompetitiveProtectionAgent } from '@/lib/agents/competitive-protection-agent'
// DISABLED: DecouplingDetectionAgent - needs LLM refinement for realistic triggers
// import { DecouplingDetectionAgent } from '@/lib/agents/decoupling-detection-agent'

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 50

// In-memory rate limiter (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Request validation schema (supports partial data for progressive disclosure)
const analyzeRequestSchema = z.object({
  formData: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    loanType: z.enum(['new_purchase', 'refinance', 'commercial', 'construction']),
    propertyType: z.string().optional(),
    priceRange: z.number().optional(),
    outstandingLoan: z.number().optional(),
    currentRate: z.number().optional(),
    lockInStatus: z.string().optional(),
    // Support both timeline fields for different loan types
    purchaseTimeline: z.string().optional(), // For new_purchase
    businessType: z.string().optional(), // For commercial
    propertyValue: z.number().optional(),
    urgency: z.string().optional(), // Deprecated but kept for compatibility
    urgencyProfile: z.object({
      level: z.enum(['immediate', 'soon', 'planning', 'exploring']),
      score: z.number(),
      source: z.string(),
      reason: z.string()
    }).optional(),
    leadScore: z.number().optional(),
    firstTimeBuyer: z.boolean().optional(),
    employmentType: z.string().optional(),
    monthlyIncome: z.number().optional(),
    existingCommitments: z.number().optional(),
    preferredBanks: z.array(z.string()).optional(),
    additionalNotes: z.string().optional(),
    marketingConsent: z.boolean().optional(),
  }),
  // Metadata for tracking submission points
  metadata: z.object({
    sessionId: z.string(),
    submissionPoint: z.enum(['gate2', 'gate3']).optional(),
    n8nGate: z.enum(['G2', 'G3']).optional(),
    timestamp: z.string()
  }).optional(),
  // Legacy fields for backward compatibility
  sessionId: z.string().optional(),
  timestamp: z.string().optional(),
})

// Rate limiting middleware
function checkRateLimit(clientIp: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const clientData = rateLimitStore.get(clientIp)
  
  if (!clientData || clientData.resetTime < now) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    })
    return { allowed: true }
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  clientData.count++
  return { allowed: true }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  // Convert Map entries to array for iteration compatibility
  Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  })
}, RATE_LIMIT_WINDOW_MS * 2)

// n8n webhook integration with urgency enrichment
// TEMPORARILY DISABLED: Keeping for potential future automation needs
// To re-enable: uncomment this function and the callN8nAnalysis call in POST handler
/*
async function callN8nAnalysis(data: any): Promise<any> {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  
  if (!n8nWebhookUrl) {
    console.warn('N8N_WEBHOOK_URL not configured, using fallback analysis')
    return null
  }
  
  // Calculate urgency profile before sending to n8n
  const urgencyProfile = calculateUrgencyProfile(data.formData)
  
  // Enrich data with urgency for n8n
  const enrichedFormData = {
    ...data.formData,
    urgencyProfile, // Add computed urgency profile
    // Remove old urgency field if it exists to avoid confusion
    urgency: undefined
  }
  
  // Extract metadata for gate-specific handling
  const metadata = data.metadata || {
    sessionId: data.sessionId || generateSessionId(),
    timestamp: data.timestamp || new Date().toISOString()
  }
  
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData: enrichedFormData,
        metadata: {
          ...metadata,
          submissionPoint: metadata.submissionPoint || 'unknown',
          n8nGate: metadata.n8nGate || 'unknown'
        },
        // Legacy fields for backward compatibility
        timestamp: metadata.timestamp,
        sessionId: metadata.sessionId,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    
    if (!response.ok) {
      console.error(`n8n webhook returned ${response.status}: ${response.statusText}`)
      return null
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('n8n webhook call failed:', error)
    return null
  }
}
*/

// Local AI Agent Orchestration - replaces n8n webhook
async function runLocalAIAnalysis(data: any): Promise<any> {
  const { formData, metadata } = data
  
  try {
    // Initialize AI agents
    const situationalAgent = new SituationalAnalysisAgent()
    const rateAgent = new RateIntelligenceAgent()
    const defenseAgent = new DynamicDefenseAgent()
    const protectionAgent = new CompetitiveProtectionAgent()
    // DISABLED: const decouplingAgent = new DecouplingDetectionAgent()
    
    // Determine which gate we're at
    const submissionPoint = metadata?.submissionPoint
    const isGate2 = submissionPoint === 'gate2'
    const isGate3 = submissionPoint === 'gate3'
    
    // Gate 2: Basic analysis
    if (isGate2) {
      // Run initial analysis with available data
      const [situationalAnalysis, rateIntelligence] = await Promise.all([
        situationalAgent.analyze(formData),
        rateAgent.generateIntelligence(formData)
      ])
      
      // DISABLED: Decoupling detection - needs LLM refinement
      // const decouplingAnalysis = await decouplingAgent.analyzeDecouplingPatterns({...})
      
      // Check for competitor signals
      const isCompetitor = protectionAgent.detectCompetitorSignals({
        sessionId: metadata?.sessionId || generateSessionId(),
        completionSpeed: Date.now() - new Date(metadata?.timestamp || Date.now()).getTime(),
        email: formData.email,
        phonePattern: formData.phone
      })
      
      // Apply competitive protection (information gating)
      const protectedInfo = protectionAgent.gateInformation(
        {
          situationalInsights: [situationalAnalysis],
          rateIntelligence,
          defenseStrategy: null
        },
        isCompetitor
      )
      
      return {
        insights: protectedInfo.situationalInsights,
        analysisType: 'ai_analysis',
        analysisLevel: 'preliminary',
        confidence: 0.85,
        nextSteps: ['Complete financial details for personalized optimization'],
        message: 'Initial AI analysis complete. Add financial details for full strategic recommendations.',
        generatedAt: new Date().toISOString()
      }
    }
    
    // Gate 3: Comprehensive analysis with financial data
    if (isGate3) {
      // First run basic analysis
      const basicAnalysis = await situationalAgent.analyze(formData)
      
      // Then enhance with financial data
      const [situationalAnalysis, rateIntelligence, defenseStrategy] = await Promise.all([
        situationalAgent.enhanceWithFinancials(basicAnalysis, {
          monthlyIncome: formData.monthlyIncome || 0,
          existingCommitments: formData.existingCommitments,
          packagePreference: formData.packagePreference,
          riskTolerance: formData.riskTolerance,
          planningHorizon: formData.planningHorizon
        }),
        rateAgent.generateIntelligence(formData),
        defenseAgent.generateDefenseStrategy(formData)
      ])
      
      // Check for competitor signals
      const isCompetitor = protectionAgent.detectCompetitorSignals({
        sessionId: metadata?.sessionId || generateSessionId(),
        completionSpeed: Date.now() - new Date(metadata?.timestamp || Date.now()).getTime(),
        email: formData.email,
        phonePattern: formData.phone
      })
      
      // Apply competitive protection with full context
      const protectedInfo = protectionAgent.gateInformation(
        {
          situationalInsights: [situationalAnalysis],
          rateIntelligence,
          defenseStrategy
        },
        isCompetitor
      )
      
      // Calculate lead score based on AI analysis
      const leadScore = calculateLeadScore(formData, situationalAnalysis)
      
      return {
        insights: protectedInfo.situationalInsights,
        analysisType: 'ai_analysis',
        analysisLevel: 'comprehensive',
        confidence: 0.95,
        leadScore,
        defenseStrategy: protectedInfo.defenseStrategy,
        pdfGeneration: 'triggered',
        brokerNotification: leadScore > 70 ? 'sent' : 'pending',
        message: 'Complete AI analysis ready. Personalized strategy developed.',
        generatedAt: new Date().toISOString()
      }
    }
    
    // Default: Run basic analysis if gate not specified
    const analysis = await situationalAgent.analyze(formData)
    return {
      insights: [analysis], // Wrap analysis result as insights array
      analysisType: 'ai_analysis',
      confidence: 0.8,
      generatedAt: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('AI analysis error:', error)
    // Fallback to psychological response if AI fails
    return generateAlgorithmicInsight(data)
  }
}

// Calculate lead score based on AI analysis and form data
function calculateLeadScore(formData: any, analysis: any): number {
  let score = 50 // Base score
  
  // Urgency factors from OTP analysis
  if (analysis.otpAnalysis?.urgencyLevel === 'critical') score += 20
  else if (analysis.otpAnalysis?.urgencyLevel === 'high') score += 15
  else if (analysis.otpAnalysis?.urgencyLevel === 'moderate') score += 10
  
  // Financial factors
  if (formData.monthlyIncome) {
    if (formData.monthlyIncome > 15000) score += 15
    else if (formData.monthlyIncome > 8000) score += 10
    else if (formData.monthlyIncome > 5000) score += 5
  }
  
  // Loan type factors
  if (formData.loanType === 'refinance' && formData.lockInStatus === 'ending_soon') {
    score += 15 // High urgency refinance
  }
  
  // Contact completeness
  if (formData.email && formData.phone) score += 10
  
  // Cap at 100
  return Math.min(100, score)
}

// Psychological trigger-based fallback (maintains tollbooth strategy)
function generateAlgorithmicInsight(data: any) {
  const { formData } = data
  
  // Determine completion level for gate progression
  const hasEmail = formData.email && formData.email.includes('@')
  const hasPhone = formData.phone && formData.phone.length > 7
  const hasFinancialInfo = formData.monthlyIncome || formData.outstandingLoan || formData.currentRate
  const isFullProfile = hasEmail && hasPhone && hasFinancialInfo
  
  // If not enough info, trigger FOMO and urgency
  if (!isFullProfile) {
    return {
      insights: [{
        type: 'analysis_pending',
        urgency: 'medium',
        title: 'Your Analysis is Being Prepared',
        message: 'Our Personal Mortgage Brain is processing your profile. We\'ll email you a detailed analysis within 2 hours.',
        actionable: true,
        value: 'Personalized strategy',
        nextStep: 'Complete your profile below to unlock your full mortgage optimization report.',
        gatePrompt: true,
        psychTrigger: 'completion_bias' // Zeigarnik effect - incomplete tasks create tension
      }],
      analysisType: 'manual_pending',
      requiresCompletion: true,
      confidence: 1.0,
      generatedAt: new Date().toISOString()
    }
  }
  
  // For completed profiles when n8n fails - use psychological expertise
  const psychResponses = getPsychologicalResponses(formData)
  
  return {
    insights: psychResponses,
    analysisType: 'expert_guidance',
    confidence: 0.95,
    generatedAt: new Date().toISOString()
  }
}

// Psychological trigger responses using behavioral economics principles
function getPsychologicalResponses(formData: any) {
  const responses = []
  const userName = formData.name ? formData.name.split(' ')[0] : ''
  const greeting = userName ? `${userName}, ` : ''
  
  // Base response - creates anticipation without revealing value
  responses.push({
    type: 'processing',
    urgency: 'high',
    title: `${greeting}Your Profile Triggered Our Priority Queue`,
    message: 'Our Personal Mortgage Brain detected patterns in your profile that require immediate attention. Full analysis underway.',
    actionable: true,
    value: 'Priority processing',
    psychTrigger: 'pattern_interrupt' // Breaks expected flow, creates attention
  })
  
  // Loan-type specific psychological nudges
  if (formData.loanType === 'refinance') {
    if (formData.lockInStatus === 'ending_soon') {
      // Loss aversion trigger
      responses.push({
        type: 'window_closing',
        urgency: 'high',
        title: 'Limited Time Opportunity Detected',
        message: 'Your lock-in timing aligns with a market window that typically closes within 3-4 weeks. We\'re expediting your analysis.',
        actionable: false,
        value: 'Time-sensitive opportunity',
        psychTrigger: 'loss_aversion'
      })
    } else if (formData.currentRate && formData.currentRate > 3.5) {
      // Relative deprivation
      responses.push({
        type: 'peer_comparison',
        urgency: 'medium',
        title: 'Comparative Analysis Running',
        message: `Processing your rate against 847 similar profiles refinanced this month. Results will show your relative position.`,
        actionable: false,
        value: 'Peer benchmarking',
        psychTrigger: 'social_proof'
      })
    }
  }
  
  if (formData.loanType === 'new_purchase') {
    if (formData.firstTimeBuyer) {
      // Scarcity principle
      responses.push({
        type: 'exclusive_access',
        urgency: 'medium',
        title: 'First-Timer Advantages Identified',
        message: 'You qualify for benefits that 73% of buyers don\'t know exist. Documenting all eligible advantages now.',
        actionable: false,
        value: 'Exclusive benefits',
        psychTrigger: 'information_asymmetry'
      })
    } else {
      // Anchoring bias
      responses.push({
        type: 'market_intelligence',
        urgency: 'medium',
        title: 'Market Intelligence Gathered',
        message: 'Cross-referencing your requirements with this week\'s unannounced bank policy changes. Most buyers won\'t see these for 2-3 weeks.',
        actionable: false,
        value: 'Early intelligence',
        psychTrigger: 'information_advantage'
      })
    }
  }
  
  if (formData.loanType === 'commercial') {
    // Commercial complexity
    responses.push({
      type: 'specialist_consultation',
      urgency: 'high',
      title: 'Commercial Financing Specialist',
      message: 'Commercial property financing requires specialist expertise. Our certified commercial brokers will provide comprehensive structure analysis.',
      actionable: true,
      value: 'Specialist consultation',
      psychTrigger: 'expert_authority'
    })
  }
  
  // Urgency-specific psychological response
  if (formData.urgency === 'immediate') {
    // Time pressure + commitment
    responses.push({
      type: 'fast_track',
      urgency: 'high',
      title: 'Express Lane Activated',
      message: 'Your case moved to our 30-minute response queue. Only 3 slots remaining today.',
      actionable: true,
      value: 'Priority slot secured',
      action: 'Analysis in 30 minutes',
      psychTrigger: 'urgency_scarcity'
    })
  } else if (formData.urgency === '3_months') {
    // Future pacing
    responses.push({
      type: 'strategic_timing',
      urgency: 'medium',
      title: 'Optimal Entry Point Calculated',
      message: 'Your 3-month timeline intersects with predicted rate movements. Preparing action calendar with key decision dates.',
      actionable: false,
      value: 'Strategic timeline',
      psychTrigger: 'temporal_optimization'
    })
  }
  
  // Always end with curiosity gap + next steps
  responses.push({
    type: 'analysis_preview',
    urgency: 'medium',
    title: 'Analysis Complete - Review Required',
    message: 'We found 3 critical factors affecting your mortgage options that require immediate attention. Full report being formatted now.',
    actionable: true,
    value: 'Critical factors identified',
    deliveryTime: formData.urgency === 'immediate' ? '30 minutes' : '2 hours',
    teaser: 'One factor alone could save you 5 figures. Report arriving soon.',
    psychTrigger: 'curiosity_gap'
  })
  
  return responses
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Request logging for monitoring with gate tracking
function logRequest(
  method: string, 
  clientIp: string, 
  success: boolean, 
  responseTime: number,
  analysisType: 'ai_analysis' | 'n8n' | 'fallback' | 'error',
  gateInfo?: {
    submissionPoint?: string
    n8nGate?: string
  }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    clientIp,
    success,
    responseTime,
    analysisType,
    // Track submission patterns
    submissionPoint: gateInfo?.submissionPoint || 'unknown',
    n8nGate: gateInfo?.n8nGate || 'unknown',
    // This helps monitor conversion between gates
    isGate2: gateInfo?.submissionPoint === 'gate2',
    isGate3: gateInfo?.submissionPoint === 'gate3'
  }
  
  // In production, send to monitoring service
  console.log('API Request:', JSON.stringify(logEntry))
  
  // Track conversion metrics
  if (gateInfo?.submissionPoint === 'gate2') {
    console.log('📊 Gate 2 submission tracked - Monitor for Gate 3 conversion')
  } else if (gateInfo?.submissionPoint === 'gate3') {
    console.log('🎯 Gate 3 submission tracked - Full conversion achieved')
  }
  
  // You could also write to a log file or send to a service like DataDog
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  
  try {
    // Rate limiting check
    const rateLimitResult = checkRateLimit(clientIp)
    if (!rateLimitResult.allowed) {
      logRequest('POST', clientIp, false, Date.now() - startTime, 'error')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60)
          }
        }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = analyzeRequestSchema.parse(body)
    
    // Extract submission metadata
    const submissionPoint = validatedData.metadata?.submissionPoint
    const n8nGate = validatedData.metadata?.n8nGate
    
    console.log(`📊 Processing submission: Point=${submissionPoint}, Gate=${n8nGate}`)
    
    // Use local AI analysis instead of n8n
    // Note: n8n integration code is commented out above for potential future use
    const analysisResult = await runLocalAIAnalysis(validatedData)
    const analysisType: 'ai_analysis' | 'fallback' = analysisResult.analysisType || 'ai_analysis'
    
    // Log successful request with gate information
    logRequest('POST', clientIp, true, Date.now() - startTime, analysisType, {
      submissionPoint,
      n8nGate
    })
    
    // Provide gate-specific response structure
    let gateSpecificResponse = analysisResult
    
    if (submissionPoint === 'gate2' && n8nGate === 'G2') {
      // Gate 2 response: Basic analysis, encourage completion
      gateSpecificResponse = {
        ...analysisResult,
        analysisLevel: 'preliminary',
        nextSteps: ['Complete financial details for full analysis'],
        message: 'Initial analysis complete. Add financial details for personalized bank matches.'
      }
    } else if (submissionPoint === 'gate3' && n8nGate === 'G3') {
      // Gate 3 response: Full analysis with PDF trigger
      gateSpecificResponse = {
        ...analysisResult,
        analysisLevel: 'comprehensive',
        pdfGeneration: 'triggered',
        brokerNotification: analysisResult.leadScore > 70 ? 'sent' : 'pending',
        message: 'Complete analysis ready. Check your email for detailed report.'
      }
    }
    
    // Return analysis result with gate context
    return NextResponse.json({
      success: true,
      data: gateSpecificResponse,
      meta: {
        analysisType,
        processingTime: Date.now() - startTime,
        sessionId: validatedData.metadata?.sessionId || validatedData.sessionId || generateSessionId(),
        submissionPoint,
        n8nGate
      }
    })
    
  } catch (error) {
    console.error('Form analysis error:', error)
    logRequest('POST', clientIp, false, Date.now() - startTime, 'error')
    
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
        error: 'Analysis service temporarily unavailable',
        fallbackUrl: '/dashboard' // Direct users to calculator as fallback
      },
      { status: 503 }
    )
  }
}

// Health check endpoint for monitoring
export async function GET(request: NextRequest) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      n8nConfigured: !!n8nWebhookUrl,
      rateLimitEnabled: true,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS
    }
  })
}