'use client'

import { useEffect } from 'react'

// Extend Window interface for analytics tools
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    conversions?: ConversionTracker
  }
}

interface ConversionEvent {
  event: 'page_view' | 'form_start' | 'form_step' | 'form_submit' | 'ai_insight_view' | 'cta_click'
  properties: {
    page?: string
    step?: string
    form_type?: 'legacy' | 'intelligent'
    loan_type?: string
    insight_type?: string
    cta_text?: string
    session_id?: string
    user_id?: string
    timestamp?: number
    engaged?: string
    location?: string
    signal?: string
    value?: string
  }
}

interface ConversionTrackerProps {
  children: React.ReactNode
}

// Global Window interface declarations moved to types/global.d.ts

class ConversionTracker {
  private sessionId: string
  private userId?: string
  private startTime: number

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    this.initializeTracking()
  }

  private generateSessionId(): string {
    return `NN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeTracking() {
    // Store session start time for engagement measurement
    if (typeof window !== 'undefined') {
      (window as any).pageLoadTime = this.startTime
    }
  }

  track(event: ConversionEvent) {
    const enrichedEvent = {
      ...event,
      properties: {
        ...event.properties,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: Date.now(),
        time_on_page: Date.now() - this.startTime,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      }
    }

    // Send to various analytics platforms
    this.sendToGoogleAnalytics(enrichedEvent)
    this.sendToFacebookPixel(enrichedEvent)
    this.sendToInternal(enrichedEvent)

    console.log('Conversion tracked:', enrichedEvent)
  }

  private sendToGoogleAnalytics(event: ConversionEvent & { properties: any }) {
    if (typeof window !== 'undefined' && window.gtag) {
      const { event: eventName, properties } = event

      window.gtag('event', eventName, {
        event_category: 'mortgage_form',
        event_label: properties.form_type || 'unknown',
        custom_parameters: {
          session_id: properties.session_id,
          loan_type: properties.loan_type,
          form_step: properties.step,
          time_on_page: properties.time_on_page
        }
      })
    }
  }

  private sendToFacebookPixel(event: ConversionEvent & { properties: any }) {
    if (typeof window !== 'undefined' && window.fbq) {
      const { event: eventName, properties } = event

      // Map internal events to Facebook events
      const fbEventMap: Record<string, string> = {
        'page_view': 'PageView',
        'form_start': 'InitiateCheckout',
        'form_submit': 'Lead',
        'ai_insight_view': 'ViewContent',
        'cta_click': 'AddToCart'
      }

      const fbEvent = fbEventMap[eventName] || 'CustomEvent'
      
      window.fbq('track', fbEvent, {
        content_category: 'mortgage_application',
        content_name: properties.loan_type || 'mortgage_inquiry',
        value: this.calculateEventValue(eventName),
        currency: 'SGD'
      })
    }
  }

  private sendToInternal(event: ConversionEvent & { properties: any }) {
    // Send to internal analytics API
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }).catch(error => {
        console.error('Failed to send internal analytics:', error)
      })
    }
  }

  private calculateEventValue(eventName: string): number {
    // Assign values to conversion events for ROI tracking
    const eventValues: Record<string, number> = {
      'page_view': 1,
      'form_start': 25,
      'form_step': 10,
      'form_submit': 100,
      'ai_insight_view': 15,
      'cta_click': 5
    }

    return eventValues[eventName] || 0
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  // Conversion funnel tracking
  trackFormFunnel(step: string, formType: 'legacy' | 'intelligent', loanType?: string) {
    this.track({
      event: 'form_step',
      properties: {
        step,
        form_type: formType,
        loan_type: loanType
      }
    })
  }

  // AI interaction tracking
  trackAIInsight(insightType: string, engaged: boolean) {
    this.track({
      event: 'ai_insight_view',
      properties: {
        insight_type: insightType,
        engaged: engaged.toString()
      }
    })
  }

  // CTA performance tracking
  trackCTA(ctaText: string, location: string) {
    this.track({
      event: 'cta_click',
      properties: {
        cta_text: ctaText,
        location
      }
    })
  }

  // Lead quality indicators
  trackEngagementSignal(signal: string, value: any) {
    this.track({
      event: 'form_step',
      properties: {
        step: 'engagement_signal',
        signal,
        value: value.toString()
      }
    })
  }
}

const ConversionTrackerComponent: React.FC<ConversionTrackerProps> = ({ children }) => {
  useEffect(() => {
    // Initialize global conversion tracker
    if (typeof window !== 'undefined' && !window.conversions) {
      window.conversions = new ConversionTracker()
      
      // Track initial page view
      window.conversions.track({
        event: 'page_view',
        properties: {
          page: window.location.pathname
        }
      })
    }
  }, [])

  return <>{children}</>
}

// Custom hook for easy tracking
export function useConversionTracking() {
  const track = (event: ConversionEvent) => {
    if (typeof window !== 'undefined' && window.conversions) {
      window.conversions.track(event)
    }
  }

  const trackFormStep = (step: string, formType: 'legacy' | 'intelligent', loanType?: string) => {
    if (typeof window !== 'undefined' && window.conversions) {
      window.conversions.trackFormFunnel(step, formType, loanType)
    }
  }

  const trackAIInsight = (insightType: string, engaged: boolean = true) => {
    if (typeof window !== 'undefined' && window.conversions) {
      window.conversions.trackAIInsight(insightType, engaged)
    }
  }

  const trackCTA = (ctaText: string, location: string = 'unknown') => {
    if (typeof window !== 'undefined' && window.conversions) {
      window.conversions.trackCTA(ctaText, location)
    }
  }

  const trackEngagement = (signal: string, value: any) => {
    if (typeof window !== 'undefined' && window.conversions) {
      window.conversions.trackEngagementSignal(signal, value)
    }
  }

  return {
    track,
    trackFormStep,
    trackAIInsight,
    trackCTA,
    trackEngagement
  }
}

export default ConversionTrackerComponent