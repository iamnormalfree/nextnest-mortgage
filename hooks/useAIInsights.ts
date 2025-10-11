import { useState, useCallback, useRef } from 'react'
import { AIContext } from '@/lib/validation/mortgage-schemas'

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

interface UseAIInsightsReturn {
  insights: AIInsight[]
  loading: boolean
  error: string | null
  fetchInsights: (formData: any, stage?: 'initial' | 'detailed' | 'final') => Promise<void>
  clearInsights: () => void
}

export function useAIInsights(): UseAIInsightsReturn {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchInsights = useCallback(async (
    formData: any, 
    stage: 'initial' | 'detailed' | 'final' = 'initial'
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      // Generate AI context
      const aiContext: AIContext = {
        userBehavior: {
          timeOnPage: Date.now() - ((window as any).pageLoadTime || Date.now()),
          formInteractions: Object.keys(formData).length,
          hesitationPoints: [],
          deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        },
        marketContext: {
          currentRates: {
            hdb: 2.6,
            private: 3.1,
            commercial: 4.2
          },
          rateDirection: 'rising',
          marketSentiment: 'cooling'
        },
        leadIntelligence: {
          urgencyScore: calculateUrgencyScore(formData),
          sophisticationLevel: getSophisticationLevel(formData),
          priceRange: getPriceRange(formData),
          likelyToConvert: calculateConversionLikelihood(formData)
        }
      }

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          aiContext,
          stage
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setInsights(data.insights)
      } else {
        throw new Error(data.error || 'Failed to fetch insights')
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was aborted, ignore
        return
      }
      
      console.error('Error fetching AI insights:', err)
      setError(err.message || 'Failed to fetch AI insights')
      
      // Fallback insights for better UX
      setInsights(generateFallbackInsights(formData))
      
    } finally {
      setLoading(false)
    }
  }, [])

  const clearInsights = useCallback(() => {
    setInsights([])
    setError(null)
    setLoading(false)
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    insights,
    loading,
    error,
    fetchInsights,
    clearInsights
  }
}

// Helper functions
function calculateUrgencyScore(formData: any): number {
  let score = 3 // base score

  // Timeline urgency
  if (formData.purchaseTimeline === 'this_month') score += 4
  else if (formData.purchaseTimeline === 'next_3_months') score += 2

  // Refinancing urgency
  if (formData.lockInStatus === 'ending_soon') score += 3
  if (formData.currentRate && formData.currentRate > 4.0) score += 2

  // Financial urgency
  if (formData.refinanceReason === 'debt_consolidation') score += 2

  return Math.min(Math.max(score, 1), 10)
}

function getSophisticationLevel(formData: any): 'beginner' | 'intermediate' | 'advanced' {
  let sophistication = 0

  // Knowledge indicators
  if (formData.ipaStatus === 'have_ipa') sophistication += 2
  if (formData.cashOutAmount > 0) sophistication += 1
  if (formData.equityAmount > 500000) sophistication += 2
  if (formData.purpose === 'investment') sophistication += 2

  if (sophistication >= 4) return 'advanced'
  if (sophistication >= 2) return 'intermediate'
  return 'beginner'
}

function getPriceRange(formData: any): 'budget' | 'mid_market' | 'premium' | 'luxury' {
  const price = formData.priceRange || formData.outstandingLoan || formData.propertyValue || 0

  if (price < 600000) return 'budget'
  if (price < 1200000) return 'mid_market'  
  if (price < 2500000) return 'premium'
  return 'luxury'
}

function calculateConversionLikelihood(formData: any): boolean {
  let score = 0

  // Positive indicators
  if (formData.purchaseTimeline === 'this_month' || formData.purchaseTimeline === 'next_3_months') score += 2
  if (formData.lockInStatus === 'ending_soon' || formData.lockInStatus === 'no_lock') score += 2
  if (formData.currentRate && formData.currentRate > 3.5) score += 2
  if (formData.ipaStatus === 'applied' || formData.ipaStatus === 'starting') score += 1

  // Negative indicators
  if (formData.purchaseTimeline === 'exploring') score -= 1
  if (formData.lockInStatus === 'locked') score -= 1

  return score >= 2
}

function generateFallbackInsights(formData: any): AIInsight[] {
  const fallbackInsights: AIInsight[] = [
    {
      type: 'market_alert',
      title: 'Market Analysis Available',
      message: 'Our AI is analyzing current market conditions and 200+ loan packages to find your best options.',
      urgency: 'low',
      actionable: false,
      category: 'market'
    }
  ]

  // Add specific fallbacks based on loan type
  if (formData.loanType === 'refinance' && formData.currentRate > 3.5) {
    fallbackInsights.unshift({
      type: 'rate_opportunity',
      title: 'Refinancing Opportunity',
      message: 'Your current rate appears higher than market rates. Refinancing could provide savings.',
      urgency: 'medium',
      actionable: true,
      category: 'financial'
    })
  }

  if (formData.loanType === 'new_purchase' && formData.ipaStatus === 'what_is_ipa') {
    fallbackInsights.unshift({
      type: 'negotiation_tip',
      title: 'IPA Recommendation',
      message: 'Consider getting pre-approved first - it strengthens your negotiating position with sellers.',
      urgency: 'medium',
      actionable: true,
      category: 'strategy'
    })
  }

  return fallbackInsights
}