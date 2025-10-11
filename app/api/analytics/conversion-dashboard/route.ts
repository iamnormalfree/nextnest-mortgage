/**
 * Real-time Analytics Dashboard API
 * Provides conversion metrics and funnel analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ConversionEventType } from '@/lib/analytics/conversion-tracking';

// Request validation schema
const dashboardRequestSchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
  metrics: z.array(z.string()).optional(),
  groupBy: z.enum(['hour', 'day', 'week']).optional()
});

// Mock data store (in production, this would be a database)
interface StoredEvent {
  eventName: ConversionEventType;
  timestamp: string;
  sessionId: string;
  userId?: string;
  leadScore?: number;
  properties: Record<string, any>;
}

// Simulated event store
const eventStore: StoredEvent[] = [];

// Generate mock historical data
function generateMockData(timeRange: string): void {
  if (eventStore.length > 0) return; // Already generated

  const now = new Date();
  const sessions = 120; // Number of sessions to generate

  for (let i = 0; i < sessions; i++) {
    const sessionId = `session_${Date.now()}_${i}`;
    const startTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const leadScore = Math.floor(Math.random() * 100);
    
    // Form started
    eventStore.push({
      eventName: ConversionEventType.FORM_STARTED,
      timestamp: startTime.toISOString(),
      sessionId,
      properties: {}
    });

    // 85% complete the form
    if (Math.random() < 0.85) {
      const formCompleteTime = new Date(startTime.getTime() + Math.random() * 10 * 60 * 1000);
      eventStore.push({
        eventName: ConversionEventType.FORM_COMPLETED,
        timestamp: formCompleteTime.toISOString(),
        sessionId,
        leadScore,
        properties: {
          loanType: ['new_purchase', 'refinancing', 'equity_loan'][Math.floor(Math.random() * 3)]
        }
      });

      // 95% attempt chat transition
      if (Math.random() < 0.95) {
        const transitionTime = new Date(formCompleteTime.getTime() + Math.random() * 30 * 1000);
        eventStore.push({
          eventName: ConversionEventType.CHAT_TRANSITION_STARTED,
          timestamp: transitionTime.toISOString(),
          sessionId,
          leadScore,
          properties: {
            brokerPersona: leadScore >= 75 ? 'aggressive' : leadScore >= 45 ? 'balanced' : 'conservative'
          }
        });

        // 90% successfully create chat
        if (Math.random() < 0.90) {
          const chatCreatedTime = new Date(transitionTime.getTime() + Math.random() * 5 * 1000);
          eventStore.push({
            eventName: ConversionEventType.CHAT_CONVERSATION_CREATED,
            timestamp: chatCreatedTime.toISOString(),
            sessionId,
            leadScore,
            properties: {
              conversationId: Math.floor(Math.random() * 10000)
            }
          });

          // 82% engage with first message
          if (Math.random() < 0.82) {
            const engagementTime = new Date(chatCreatedTime.getTime() + Math.random() * 60 * 1000);
            eventStore.push({
              eventName: ConversionEventType.FIRST_MESSAGE_ENGAGED,
              timestamp: engagementTime.toISOString(),
              sessionId,
              leadScore,
              properties: {
                engaged: true
              }
            });
          }
        } else {
          // Failed transition - use fallback
          eventStore.push({
            eventName: ConversionEventType.CHAT_TRANSITION_FALLBACK,
            timestamp: new Date(transitionTime.getTime() + 3000).toISOString(),
            sessionId,
            leadScore,
            properties: {
              fallbackType: ['phone', 'email', 'whatsapp'][Math.floor(Math.random() * 3)]
            }
          });
        }
      }
    } else {
      // Form abandoned
      eventStore.push({
        eventName: ConversionEventType.FORM_ABANDONED,
        timestamp: new Date(startTime.getTime() + Math.random() * 5 * 60 * 1000).toISOString(),
        sessionId,
        properties: {
          lastStep: Math.floor(Math.random() * 3) + 1
        }
      });
    }
  }
}

/**
 * Calculate conversion metrics from events
 */
async function calculateConversionMetrics(startTime: Date): Promise<any> {
  // Generate mock data if needed
  generateMockData('7d');

  // Filter events by time range
  const relevantEvents = eventStore.filter(e => 
    new Date(e.timestamp) > startTime
  );

  // Count events by type
  const formStarts = relevantEvents.filter(e => e.eventName === ConversionEventType.FORM_STARTED).length;
  const formCompletions = relevantEvents.filter(e => e.eventName === ConversionEventType.FORM_COMPLETED).length;
  const formAbandoned = relevantEvents.filter(e => e.eventName === ConversionEventType.FORM_ABANDONED).length;
  const chatTransitionsAttempted = relevantEvents.filter(e => e.eventName === ConversionEventType.CHAT_TRANSITION_STARTED).length;
  const chatTransitionsSuccessful = relevantEvents.filter(e => e.eventName === ConversionEventType.CHAT_CONVERSATION_CREATED).length;
  const fallbacksUsed = relevantEvents.filter(e => e.eventName === ConversionEventType.CHAT_TRANSITION_FALLBACK).length;
  const firstMessageEngagements = relevantEvents.filter(e => e.eventName === ConversionEventType.FIRST_MESSAGE_ENGAGED).length;

  // Calculate lead score distribution
  const withLeadScore = relevantEvents.filter(e => e.leadScore !== undefined);
  const leadScoreDistribution = {
    high: withLeadScore.filter(e => e.leadScore! >= 75).length,
    medium: withLeadScore.filter(e => e.leadScore! >= 45 && e.leadScore! < 75).length,
    low: withLeadScore.filter(e => e.leadScore! < 45).length
  };

  // Calculate fallback reasons
  const fallbackEvents = relevantEvents.filter(e => e.eventName === ConversionEventType.CHAT_TRANSITION_FALLBACK);
  const fallbackReasons: Record<string, number> = {};
  fallbackEvents.forEach(e => {
    const type = e.properties.fallbackType || 'unknown';
    fallbackReasons[type] = (fallbackReasons[type] || 0) + 1;
  });

  // Calculate average times
  const transitionTimes: number[] = [];
  const completionTimes: number[] = [];

  // Group events by session to calculate times
  const sessionGroups = new Map<string, StoredEvent[]>();
  relevantEvents.forEach(event => {
    if (!sessionGroups.has(event.sessionId)) {
      sessionGroups.set(event.sessionId, []);
    }
    sessionGroups.get(event.sessionId)!.push(event);
  });

  sessionGroups.forEach((events) => {
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const startEvent = events.find(e => e.eventName === ConversionEventType.FORM_STARTED);
    const completeEvent = events.find(e => e.eventName === ConversionEventType.FORM_COMPLETED);
    const transitionEvent = events.find(e => e.eventName === ConversionEventType.CHAT_TRANSITION_STARTED);
    const chatEvent = events.find(e => e.eventName === ConversionEventType.CHAT_CONVERSATION_CREATED);

    if (startEvent && completeEvent) {
      const time = (new Date(completeEvent.timestamp).getTime() - new Date(startEvent.timestamp).getTime()) / 1000;
      completionTimes.push(time);
    }

    if (transitionEvent && chatEvent) {
      const time = (new Date(chatEvent.timestamp).getTime() - new Date(transitionEvent.timestamp).getTime()) / 1000;
      transitionTimes.push(time);
    }
  });

  const avgTransitionTime = transitionTimes.length > 0 
    ? transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length 
    : 0;

  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
    : 0;

  return {
    formStarts,
    formCompletions,
    formAbandoned,
    chatTransitionsAttempted,
    chatTransitionsSuccessful,
    fallbacksUsed,
    firstMessageEngagements,
    conversionRates: {
      formToCompletion: formStarts > 0 ? (formCompletions / formStarts * 100).toFixed(1) : 0,
      formToTransition: formCompletions > 0 ? (chatTransitionsAttempted / formCompletions * 100).toFixed(1) : 0,
      transitionToChat: chatTransitionsAttempted > 0 ? (chatTransitionsSuccessful / chatTransitionsAttempted * 100).toFixed(1) : 0,
      chatToEngagement: chatTransitionsSuccessful > 0 ? (firstMessageEngagements / chatTransitionsSuccessful * 100).toFixed(1) : 0,
      overallFormToEngagement: formStarts > 0 ? (firstMessageEngagements / formStarts * 100).toFixed(1) : 0
    },
    averageTransitionTime: avgTransitionTime.toFixed(1),
    averageCompletionTime: (avgCompletionTime / 60).toFixed(1), // Convert to minutes
    leadScoreDistribution,
    fallbackReasons,
    performanceMetrics: {
      avgFormCompletionTime: (avgCompletionTime / 60).toFixed(1),
      avgChatLoadTime: avgTransitionTime.toFixed(1),
      avgTimeToFirstMessage: '45.2' // Mock value
    }
  };
}

/**
 * GET handler - retrieve dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate cutoff time
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const metrics = await calculateConversionMetrics(cutoffTime);

    // Build funnel data
    const funnelData = [
      {
        stage: 'Form Started',
        count: metrics.formStarts,
        percentage: 100
      },
      {
        stage: 'Form Completed',
        count: metrics.formCompletions,
        percentage: metrics.formStarts > 0 ? (metrics.formCompletions / metrics.formStarts * 100) : 0
      },
      {
        stage: 'Chat Transition',
        count: metrics.chatTransitionsAttempted,
        percentage: metrics.formStarts > 0 ? (metrics.chatTransitionsAttempted / metrics.formStarts * 100) : 0
      },
      {
        stage: 'Chat Created',
        count: metrics.chatTransitionsSuccessful,
        percentage: metrics.formStarts > 0 ? (metrics.chatTransitionsSuccessful / metrics.formStarts * 100) : 0
      },
      {
        stage: 'Engaged',
        count: metrics.firstMessageEngagements,
        percentage: metrics.formStarts > 0 ? (metrics.firstMessageEngagements / metrics.formStarts * 100) : 0
      }
    ];

    // Calculate time series data (hourly for last 24h)
    const timeSeriesData = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      const hourEvents = eventStore.filter(e => {
        const eventTime = new Date(e.timestamp);
        return eventTime >= hourStart && eventTime < hourEnd;
      });

      timeSeriesData.push({
        hour: hourStart.getHours(),
        formStarts: hourEvents.filter(e => e.eventName === ConversionEventType.FORM_STARTED).length,
        conversions: hourEvents.filter(e => e.eventName === ConversionEventType.CHAT_CONVERSATION_CREATED).length
      });
    }

    const response = {
      success: true,
      timeRange,
      lastUpdated: new Date().toISOString(),
      metrics,
      funnelData,
      timeSeriesData,
      summary: {
        totalSessions: metrics.formStarts,
        successfulConversions: metrics.firstMessageEngagements,
        overallConversionRate: metrics.conversionRates.overallFormToEngagement,
        avgSessionDuration: metrics.performanceMetrics.avgFormCompletionTime,
        topFallbackReason: Object.entries(metrics.fallbackReasons)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve analytics data' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - receive analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Store the event (in production, this would go to a database)
    eventStore.push({
      eventName: body.eventName,
      timestamp: body.timestamp,
      sessionId: body.sessionId,
      userId: body.userId,
      leadScore: body.metrics?.leadScore,
      properties: body.properties || {}
    });

    // Keep only last 1000 events in memory
    if (eventStore.length > 1000) {
      eventStore.splice(0, eventStore.length - 1000);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Event recorded' 
    });
  } catch (error) {
    console.error('Analytics Event Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record event' 
      },
      { status: 500 }
    );
  }
}