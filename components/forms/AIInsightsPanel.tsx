'use client'

import { useState, useEffect } from 'react'
import { AIContext } from '@/lib/validation/mortgage-schemas'

interface AIInsight {
  type: 'market_alert' | 'rate_opportunity' | 'timing_advice' | 'negotiation_tip'
  title: string
  message: string
  urgency: 'low' | 'medium' | 'high'
  value?: string
  actionable?: boolean
}

interface AIInsightsPanelProps {
  formData: any
  aiContext?: AIContext
  visible: boolean
  onInsightClick?: (insight: AIInsight) => void
}

const AIInsightsPanel = ({ formData, aiContext, visible, onInsightClick }: AIInsightsPanelProps) => {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)

  // Simulate AI insight generation based on form data
  useEffect(() => {
    if (!visible || !formData.loanType) return

    setIsGenerating(true)
    
    // Simulate API delay for AI processing
    const timer = setTimeout(() => {
      const generatedInsights = generateInsights(formData, aiContext)
      setInsights(generatedInsights)
      setIsGenerating(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [formData, aiContext, visible])

  // Cycle through insights
  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentInsightIndex((prev) => (prev + 1) % insights.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [insights.length])

  const generateInsights = (data: any, context?: AIContext): AIInsight[] => {
    const insights: AIInsight[] = []

    if (data.loanType === 'refinance') {
      if (data.currentRate > 3.5) {
        insights.push({
          type: 'rate_opportunity',
          title: 'Significant Savings Detected',
          message: `Current rate of ${data.currentRate}% is above market. Potential savings: SGD 800-1,200/month`,
          urgency: 'high',
          value: 'SGD 800-1,200/month',
          actionable: true
        })
      }

      if (data.lockInStatus === 'ending_soon') {
        insights.push({
          type: 'timing_advice',
          title: 'Perfect Timing',
          message: 'Lock-in period ending soon. Best time to refinance without penalties.',
          urgency: 'high',
          actionable: true
        })
      }
    }

    if (data.loanType === 'new_purchase') {
      if (data.ipaStatus === 'what_is_ipa') {
        insights.push({
          type: 'negotiation_tip',
          title: 'IPA Advantage',
          message: 'Get pre-approved first. Sellers prefer buyers with In-Principle Approval - 15% better negotiation power.',
          urgency: 'medium',
          actionable: true
        })
      }

      if (data.propertyType === 'Private' && data.priceRange > 1500000) {
        insights.push({
          type: 'market_alert',
          title: 'Premium Market Intel',
          message: 'Luxury segment cooling. Consider negotiating 5-8% below asking price.',
          urgency: 'medium',
          value: '5-8% savings',
          actionable: true
        })
      }
    }

    // Market context insights
    if (context?.marketContext.rateDirection === 'rising') {
      insights.push({
        type: 'timing_advice',
        title: 'Rate Alert',
        message: 'Rates expected to rise 0.25% next quarter. Lock in current rates soon.',
        urgency: 'high',
        actionable: true
      })
    }

    // Default insights if none generated
    if (insights.length === 0) {
      insights.push({
        type: 'market_alert',
        title: 'Market Analysis Ready',
        message: 'AI analyzing 200+ loan packages to find your best matches.',
        urgency: 'low',
        actionable: false
      })
    }

    return insights
  }

  if (!visible) return null

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 w-80 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-nn-grey-medium/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-nn-gold to-nn-gold/80 px-4 py-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
            <span className="text-white font-inter font-medium text-sm">
              AI Intelligence
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isGenerating ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-nn-gold border-t-transparent rounded-full animate-spin"></div>
                <span className="text-nn-grey-medium text-sm font-inter">
                  Analyzing your scenario...
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-nn-grey-light rounded animate-pulse"></div>
                <div className="h-3 bg-nn-grey-light rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-nn-grey-light rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-4">
              {/* Current Insight */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className={`
                    w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                    ${insights[currentInsightIndex].urgency === 'high' ? 'bg-red-500' : 
                      insights[currentInsightIndex].urgency === 'medium' ? 'bg-nn-gold' : 'bg-green-500'}
                  `}></div>
                  <div className="flex-1">
                    <h4 className="font-inter font-semibold text-nn-grey-dark text-sm">
                      {insights[currentInsightIndex].title}
                    </h4>
                    <p className="text-xs text-nn-grey-medium mt-1 leading-relaxed">
                      {insights[currentInsightIndex].message}
                    </p>
                  </div>
                </div>

                {insights[currentInsightIndex].value && (
                  <div className="bg-nn-gold/10 rounded-lg px-3 py-2">
                    <span className="text-nn-gold font-inter font-medium text-sm">
                      💰 {insights[currentInsightIndex].value}
                    </span>
                  </div>
                )}

                {insights[currentInsightIndex].actionable && (
                  <button
                    onClick={() => onInsightClick?.(insights[currentInsightIndex])}
                    className="w-full bg-nn-gold hover:bg-nn-gold/90 text-white text-xs font-inter font-medium px-3 py-2 rounded-lg transition-colors duration-200"
                  >
                    Tell me more
                  </button>
                )}
              </div>

              {/* Insight indicators */}
              {insights.length > 1 && (
                <div className="flex justify-center space-x-1">
                  {insights.map((_, index) => (
                    <div
                      key={index}
                      className={`
                        w-2 h-2 rounded-full transition-colors duration-200
                        ${index === currentInsightIndex ? 'bg-nn-gold' : 'bg-nn-grey-light'}
                      `}
                    />
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-nn-grey-light pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-nn-grey-medium font-inter">
                    {insights.length} insights found
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-inter">Live</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Trust signal */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center px-3 py-1 bg-white rounded-full shadow-sm border border-nn-grey-medium/30">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs text-nn-grey-medium font-inter">
            Bank-grade security
          </span>
        </div>
      </div>
    </div>
  )
}

export default AIInsightsPanel