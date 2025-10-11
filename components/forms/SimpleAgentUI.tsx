'use client'

import React from 'react'
import { ChevronRight, Clock, Shield, TrendingUp, AlertCircle, CheckCircle, Target, Lightbulb } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SituationalInsights {
  otpAnalysis?: {
    urgencyLevel: 'critical' | 'high' | 'moderate' | 'low'
    keyFactors: string[]
    recommendations: string[]
    timeline: string
  }
  paymentSchemeAnalysis?: {
    progressivePayment: {
      applicable: boolean
      benefit: string | null
    }
    deferredPayment: {
      applicable: boolean
      benefit: string | null
    }
    normalPayment: {
      recommendation: string
    }
  }
  lockInAnalysis?: {
    currentStatus: 'locked' | 'ending_soon' | 'free' | 'unknown'
    actionRequired: boolean
    timing: string
    strategy: string[]
  }
  overallRecommendation?: string
  nextSteps?: string[]
}

interface RateIntelligence {
  marketPhase?: string
  fedStance?: string
  soraOutlook?: string
  recommendedPackageType?: string
  timingRecommendation?: string
  keyInsights?: string[]
  riskFactors?: string[]
}

interface DefenseStrategy {
  strategies?: Array<{
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }>
  primaryFocus?: string
  nextActions?: string[]
}

interface SimpleAgentUIProps {
  situationalInsights?: SituationalInsights | null
  rateIntelligence?: RateIntelligence | null
  defenseStrategy?: DefenseStrategy | null
  leadScore?: number | null
  isLoading?: boolean
  onBrokerConsultation?: () => void
}

export function SimpleAgentUI({
  situationalInsights,
  rateIntelligence,
  defenseStrategy,
  leadScore,
  isLoading = false,
  onBrokerConsultation
}: SimpleAgentUIProps) {
  
  // Helper to get urgency color
  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Helper to get urgency icon
  const getUrgencyIcon = (level?: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-5 h-5" />
      case 'moderate':
        return <Clock className="w-5 h-5" />
      case 'low':
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  // If no data, return null
  if (!situationalInsights && !rateIntelligence && !defenseStrategy) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Lead Score Badge */}
      {leadScore !== null && leadScore !== undefined && leadScore > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Lead Score</p>
              <p className="text-2xl font-bold">{leadScore}%</p>
            </div>
          </div>
          {leadScore > 70 && (
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              High Priority
            </span>
          )}
        </div>
      )}

      {/* Situational Analysis Section */}
      {situationalInsights && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
              Situational Analysis
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* OTP/Urgency Analysis */}
            {situationalInsights.otpAnalysis && (
              <div className={`border rounded-lg p-4 ${getUrgencyColor(situationalInsights.otpAnalysis.urgencyLevel)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getUrgencyIcon(situationalInsights.otpAnalysis.urgencyLevel)}
                    <span className="font-semibold capitalize">
                      {situationalInsights.otpAnalysis.urgencyLevel} Urgency
                    </span>
                  </div>
                  <span className="text-sm">
                    {situationalInsights.otpAnalysis.timeline}
                  </span>
                </div>
                
                {situationalInsights.otpAnalysis.keyFactors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Key Factors:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {situationalInsights.otpAnalysis.keyFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {situationalInsights.otpAnalysis.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Recommendations:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {situationalInsights.otpAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Payment Scheme Analysis */}
            {situationalInsights.paymentSchemeAnalysis && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="font-semibold text-gray-900 mb-3">Payment Scheme Options</p>
                <div className="space-y-2">
                  {situationalInsights.paymentSchemeAnalysis.progressivePayment.applicable && (
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Progressive Payment Available</p>
                        <p className="text-sm text-gray-600">
                          {situationalInsights.paymentSchemeAnalysis.progressivePayment.benefit}
                        </p>
                      </div>
                    </div>
                  )}
                  {situationalInsights.paymentSchemeAnalysis.deferredPayment.applicable && (
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Deferred Payment Option</p>
                        <p className="text-sm text-gray-600">
                          {situationalInsights.paymentSchemeAnalysis.deferredPayment.benefit}
                        </p>
                      </div>
                    </div>
                  )}
                  {!situationalInsights.paymentSchemeAnalysis.progressivePayment.applicable && 
                   !situationalInsights.paymentSchemeAnalysis.deferredPayment.applicable && (
                    <p className="text-sm text-gray-600">
                      {situationalInsights.paymentSchemeAnalysis.normalPayment.recommendation}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Lock-in Analysis */}
            {situationalInsights.lockInAnalysis && situationalInsights.lockInAnalysis.currentStatus !== 'unknown' && (
              <div className={`border rounded-lg p-4 ${
                situationalInsights.lockInAnalysis.actionRequired 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">Lock-in Status</p>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    situationalInsights.lockInAnalysis.currentStatus === 'ending_soon' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : situationalInsights.lockInAnalysis.currentStatus === 'free'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {situationalInsights.lockInAnalysis.currentStatus.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {situationalInsights.lockInAnalysis.timing}
                </p>
                {situationalInsights.lockInAnalysis.strategy.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {situationalInsights.lockInAnalysis.strategy.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Overall Recommendation */}
            {situationalInsights.overallRecommendation && (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  {situationalInsights.overallRecommendation}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Rate Intelligence Section */}
      {rateIntelligence && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Rate Intelligence
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rateIntelligence.marketPhase && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Market Phase</p>
                  <p className="font-medium text-gray-900">{rateIntelligence.marketPhase}</p>
                </div>
              )}
              {rateIntelligence.fedStance && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Fed Stance</p>
                  <p className="font-medium text-gray-900">{rateIntelligence.fedStance}</p>
                </div>
              )}
              {rateIntelligence.soraOutlook && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">SORA Outlook</p>
                  <p className="font-medium text-gray-900">{rateIntelligence.soraOutlook}</p>
                </div>
              )}
              {rateIntelligence.recommendedPackageType && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Recommended Package</p>
                  <p className="font-medium text-gray-900">{rateIntelligence.recommendedPackageType}</p>
                </div>
              )}
            </div>

            {/* Timing Recommendation */}
            {rateIntelligence.timingRecommendation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 mb-1">Timing Recommendation</p>
                    <p className="text-sm text-green-800">
                      {rateIntelligence.timingRecommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Insights */}
            {rateIntelligence.keyInsights && rateIntelligence.keyInsights.length > 0 && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Key Insights</p>
                <ul className="space-y-1">
                  {rateIntelligence.keyInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {rateIntelligence.riskFactors && rateIntelligence.riskFactors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-yellow-900 mb-2">Risk Factors to Consider</p>
                <ul className="space-y-1">
                  {rateIntelligence.riskFactors.map((risk, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <span className="text-sm text-yellow-800">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Defense Strategy Section */}
      {defenseStrategy && defenseStrategy.strategies && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-600" />
              Strategic Defense Plan
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Primary Focus */}
            {defenseStrategy.primaryFocus && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="font-medium text-purple-900 mb-1">Primary Focus</p>
                <p className="text-sm text-purple-800">
                  {defenseStrategy.primaryFocus}
                </p>
              </div>
            )}

            {/* Strategies */}
            <div className="space-y-3">
              {defenseStrategy.strategies.map((strategy, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-lg p-4 ${
                    strategy.priority === 'high' 
                      ? 'bg-red-50 border-red-200'
                      : strategy.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900">{strategy.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      strategy.priority === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : strategy.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {strategy.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {strategy.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Next Actions */}
            {defenseStrategy.nextActions && defenseStrategy.nextActions.length > 0 && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Next Actions</p>
                <ol className="list-decimal list-inside space-y-1">
                  {defenseStrategy.nextActions.map((action, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{action}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Broker Consultation CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Ready to Optimize Your Mortgage?</h3>
            <p className="text-indigo-100">
              Get personalized advice from our mortgage specialists based on this analysis.
            </p>
          </div>
          <button
            onClick={onBrokerConsultation}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center space-x-2"
          >
            <span>Schedule Consultation</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}