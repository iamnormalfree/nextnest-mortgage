/**
 * Conversion Tracking Module
 * Tracks user journey from form to chat engagement
 */

import { z } from 'zod';

// Event type definitions
export enum ConversionEventType {
  // Form events
  FORM_STARTED = 'form_started',
  FORM_STEP_COMPLETED = 'form_step_completed',
  FORM_ABANDONED = 'form_abandoned',
  FORM_COMPLETED = 'form_completed',
  
  // Chat transition events
  CHAT_TRANSITION_STARTED = 'chat_transition_started',
  CHAT_TRANSITION_FAILED = 'chat_transition_failed',
  CHAT_TRANSITION_FALLBACK = 'chat_transition_fallback',
  CHAT_CONVERSATION_CREATED = 'chat_conversation_created',
  
  // Engagement events
  FIRST_MESSAGE_SENT = 'first_message_sent',
  FIRST_MESSAGE_ENGAGED = 'first_message_engaged',
  CHAT_ENDED = 'chat_ended',
  LEAD_QUALIFIED = 'lead_qualified'
}

// ConversionEvent interface
export interface ConversionEvent {
  eventName: ConversionEventType;
  timestamp: string;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
  metrics: {
    leadScore?: number;
    stepNumber?: number;
    timeOnStep?: number;
    conversionValue?: number;
  };
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

// Conversion metrics interface
export interface ConversionMetrics {
  timeRange: '1h' | '24h' | '7d' | '30d';
  formCompletions: number;
  chatTransitionsAttempted: number;
  chatTransitionsSuccessful: number;
  fallbacksUsed: number;
  firstMessageEngagements: number;
  conversionRates: {
    formToTransition: number;
    transitionToChat: number;
    chatToEngagement: number;
    overallFormToEngagement: number;
  };
  averageTransitionTime: number;
  leadScoreDistribution: {
    high: number;    // 75-100
    medium: number;  // 45-74
    low: number;     // 0-44
  };
  fallbackReasons: Record<string, number>;
  performanceMetrics: {
    avgFormCompletionTime: number;
    avgChatLoadTime: number;
    avgTimeToFirstMessage: number;
  };
}

// Funnel stage definition
export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeSpent: number;
}

// Validation schemas
const conversionEventSchema = z.object({
  eventName: z.nativeEnum(ConversionEventType),
  timestamp: z.string(),
  sessionId: z.string(),
  userId: z.string().optional(),
  properties: z.record(z.string(), z.any()),
  metrics: z.object({
    leadScore: z.number().min(0).max(100).optional(),
    stepNumber: z.number().optional(),
    timeOnStep: z.number().optional(),
    conversionValue: z.number().optional()
  }),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    referrer: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional()
  }).optional()
});

/**
 * Conversion Tracker Class
 * Handles all conversion tracking and analytics
 */
export class ConversionTracker {
  private events: ConversionEvent[] = [];
  private sessionData: Map<string, any> = new Map();
  private endpoint: string;

  constructor(endpoint: string = '/api/analytics/events') {
    this.endpoint = endpoint;
    this.loadStoredEvents();
  }

  /**
   * Load events from localStorage
   */
  private loadStoredEvents(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nextnest_conversion_events');
      if (stored) {
        try {
          this.events = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to load stored events:', error);
        }
      }
    }
  }

  /**
   * Store events to localStorage
   */
  private storeEvents(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nextnest_conversion_events', JSON.stringify(this.events.slice(-100)));
      } catch (error) {
        console.error('Failed to store events:', error);
      }
    }
  }

  /**
   * Send event to analytics endpoint
   */
  private async sendEvent(event: ConversionEvent): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
      // Store failed events for retry
      this.events.push(event);
      this.storeEvents();
    }
  }

  /**
   * Calculate conversion value based on lead score and form data
   */
  private calculateConversionValue(leadScore: number, formData: any): number {
    let value = 0;

    // Base value from lead score
    if (leadScore >= 75) value += 1000;
    else if (leadScore >= 45) value += 500;
    else value += 100;

    // Additional value from loan type
    if (formData.loanType === 'new_purchase') value += 300;
    else if (formData.loanType === 'refinancing') value += 200;
    else if (formData.loanType === 'equity_loan') value += 150;

    // Income multiplier
    const monthlyIncome = formData.actualIncomes?.[0] || 0;
    if (monthlyIncome > 15000) value *= 2;
    else if (monthlyIncome > 8000) value *= 1.5;

    return Math.round(value);
  }

  /**
   * Track form start
   */
  async trackFormStart(sessionId: string, metadata?: any): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.FORM_STARTED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        entryPoint: metadata?.entryPoint || 'hero_cta',
        device: this.getDeviceType()
      },
      metrics: {
        stepNumber: 0
      },
      metadata
    };

    this.sessionData.set(sessionId, {
      startTime: Date.now(),
      steps: []
    });

    await this.sendEvent(event);
  }

  /**
   * Track form step completion
   */
  async trackFormStepCompleted(
    sessionId: string,
    stepNumber: number,
    stepData: any,
    timeOnStep: number
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.FORM_STEP_COMPLETED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        stepNumber,
        stepName: this.getStepName(stepNumber),
        fieldsCompleted: Object.keys(stepData).length
      },
      metrics: {
        stepNumber,
        timeOnStep
      }
    };

    const session = this.sessionData.get(sessionId);
    if (session) {
      session.steps.push({ stepNumber, completedAt: Date.now() });
    }

    await this.sendEvent(event);
  }

  /**
   * Track form completion
   */
  async trackFormCompletion(
    sessionId: string,
    formData: any,
    leadScore: number,
    timeToComplete: number
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.FORM_COMPLETED,
      timestamp: new Date().toISOString(),
      sessionId,
      userId: formData.email,
      properties: {
        loanType: formData.loanType,
        propertyCategory: formData.propertyCategory,
        monthlyIncome: formData.actualIncomes?.[0],
        completionTime: timeToComplete,
        stepsCompleted: 3
      },
      metrics: {
        leadScore,
        stepNumber: 3,
        timeOnStep: timeToComplete,
        conversionValue: this.calculateConversionValue(leadScore, formData)
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Track form abandonment
   */
  async trackFormAbandonment(
    sessionId: string,
    lastStep: number,
    timeSpent: number,
    reason?: string
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.FORM_ABANDONED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        lastStep,
        abandonmentReason: reason || 'user_exit',
        timeSpent
      },
      metrics: {
        stepNumber: lastStep,
        timeOnStep: timeSpent
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Track chat transition start
   */
  async trackChatTransitionStart(
    sessionId: string,
    leadScore: number,
    brokerPersona: string
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.CHAT_TRANSITION_STARTED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        brokerPersona,
        transitionType: 'automatic'
      },
      metrics: {
        leadScore,
        stepNumber: 4
      }
    };

    this.sessionData.set(`${sessionId}_transition`, {
      startTime: Date.now()
    });

    await this.sendEvent(event);
  }

  /**
   * Track successful chat creation
   */
  async trackChatCreated(
    sessionId: string,
    conversationId: number,
    leadScore: number,
    transitionTime: number
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.CHAT_CONVERSATION_CREATED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        conversationId,
        transitionTime,
        success: true,
        widgetType: 'chatwoot'
      },
      metrics: {
        leadScore,
        stepNumber: 4,
        timeOnStep: transitionTime
      }
    };

    await this.sendEvent(event);
    await this.updateConversionMetrics(sessionId);
  }

  /**
   * Track chat transition failure
   */
  async trackChatTransitionFailed(
    sessionId: string,
    reason: string,
    fallbackType?: string
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.CHAT_TRANSITION_FAILED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        failureReason: reason,
        fallbackProvided: !!fallbackType,
        fallbackType
      },
      metrics: {
        stepNumber: 4
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Track fallback usage
   */
  async trackFallbackUsed(
    sessionId: string,
    fallbackType: 'phone' | 'email' | 'whatsapp',
    leadScore: number
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.CHAT_TRANSITION_FALLBACK,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        fallbackType,
        userAction: 'clicked'
      },
      metrics: {
        leadScore,
        stepNumber: 4
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Track first message engagement
   */
  async trackFirstMessageEngagement(
    sessionId: string,
    conversationId: number,
    responseTime: number,
    engaged: boolean
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName: ConversionEventType.FIRST_MESSAGE_ENGAGED,
      timestamp: new Date().toISOString(),
      sessionId,
      properties: {
        conversationId,
        responseTime,
        engaged,
        engagementType: engaged ? 'replied' : 'viewed'
      },
      metrics: {
        stepNumber: 5,
        timeOnStep: responseTime
      }
    };

    await this.sendEvent(event);
  }

  /**
   * Update conversion metrics
   */
  private async updateConversionMetrics(sessionId: string): Promise<void> {
    // This would typically update a database or analytics service
    // For now, we'll calculate and log metrics
    const sessionEvents = this.events.filter(e => e.sessionId === sessionId);
    
    const metrics = {
      sessionId,
      totalEvents: sessionEvents.length,
      conversionPath: sessionEvents.map(e => e.eventName),
      totalTime: this.calculateTotalTime(sessionEvents),
      completed: sessionEvents.some(e => e.eventName === ConversionEventType.CHAT_CONVERSATION_CREATED)
    };

    console.log('📊 Conversion Metrics Updated:', metrics);
  }

  /**
   * Calculate total time from events
   */
  private calculateTotalTime(events: ConversionEvent[]): number {
    if (events.length < 2) return 0;
    
    const start = new Date(events[0].timestamp).getTime();
    const end = new Date(events[events.length - 1].timestamp).getTime();
    
    return Math.round((end - start) / 1000); // Return in seconds
  }

  /**
   * Get step name by number
   */
  private getStepName(stepNumber: number): string {
    const steps = [
      'Initial',
      'Loan Details',
      'Personal Information',
      'Financial Information',
      'Chat Transition'
    ];
    return steps[stepNumber] || `Step ${stepNumber}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get funnel analytics
   */
  async getFunnelAnalytics(timeRange: '1h' | '24h' | '7d' | '30d'): Promise<FunnelStage[]> {
    // Filter events by time range
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantEvents = this.events.filter(e => 
      new Date(e.timestamp) > cutoffTime
    );

    // Calculate funnel stages
    const stages: FunnelStage[] = [
      {
        name: 'Form Started',
        count: relevantEvents.filter(e => e.eventName === ConversionEventType.FORM_STARTED).length,
        conversionRate: 100,
        dropoffRate: 0,
        avgTimeSpent: 0
      },
      {
        name: 'Form Completed',
        count: relevantEvents.filter(e => e.eventName === ConversionEventType.FORM_COMPLETED).length,
        conversionRate: 0,
        dropoffRate: 0,
        avgTimeSpent: 0
      },
      {
        name: 'Chat Transition Started',
        count: relevantEvents.filter(e => e.eventName === ConversionEventType.CHAT_TRANSITION_STARTED).length,
        conversionRate: 0,
        dropoffRate: 0,
        avgTimeSpent: 0
      },
      {
        name: 'Chat Created',
        count: relevantEvents.filter(e => e.eventName === ConversionEventType.CHAT_CONVERSATION_CREATED).length,
        conversionRate: 0,
        dropoffRate: 0,
        avgTimeSpent: 0
      },
      {
        name: 'First Message Engaged',
        count: relevantEvents.filter(e => e.eventName === ConversionEventType.FIRST_MESSAGE_ENGAGED).length,
        conversionRate: 0,
        dropoffRate: 0,
        avgTimeSpent: 0
      }
    ];

    // Calculate conversion and dropoff rates
    for (let i = 1; i < stages.length; i++) {
      const prevStage = stages[i - 1];
      const currStage = stages[i];
      
      if (prevStage.count > 0) {
        currStage.conversionRate = (currStage.count / stages[0].count) * 100;
        currStage.dropoffRate = ((prevStage.count - currStage.count) / prevStage.count) * 100;
      }
    }

    return stages;
  }

  /**
   * Get cutoff time for time range
   */
  private getCutoffTime(timeRange: '1h' | '24h' | '7d' | '30d'): Date {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Clear stored events
   */
  clearEvents(): void {
    this.events = [];
    this.sessionData.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nextnest_conversion_events');
    }
  }
}

// Export singleton instance
export const conversionTracker = new ConversionTracker();