import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Analytics event schema
const analyticsEventSchema = z.object({
  eventName: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  userId: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  metrics: z.object({
    leadScore: z.number().optional(),
    stepNumber: z.number().optional(),
    timeOnStep: z.number().optional(),
    conversionValue: z.number().optional()
  }).optional()
})

// In-memory storage for development (replace with database in production)
const events: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the event data
    const validatedEvent = analyticsEventSchema.parse(body)
    
    // Store the event (in production, this would go to a database or analytics service)
    events.push({
      ...validatedEvent,
      serverTimestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })
    
    // Log for debugging
    console.log('📊 Analytics event received:', validatedEvent.eventName, {
      sessionId: validatedEvent.sessionId,
      leadScore: validatedEvent.metrics?.leadScore
    })
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
    
  } catch (error) {
    console.error('Analytics event error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid event data',
          details: (error as any).errors || error 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to track event' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  // Filter events by session if provided
  let filteredEvents = sessionId 
    ? events.filter(e => e.sessionId === sessionId)
    : events
  
  // Return the most recent events
  const recentEvents = filteredEvents.slice(-limit)
  
  return NextResponse.json({
    success: true,
    events: recentEvents,
    total: filteredEvents.length
  })
}