'use client'

import React, { useState } from 'react'
// import { LoanTypeSelector } from './LoanTypeSelector'
import SimpleLoanTypeSelector from './SimpleLoanTypeSelector'
import { ProgressiveForm } from './ProgressiveForm'
// import CommercialQuickForm from './CommercialQuickForm' // Archived - not in primary flow
import { calculateUrgencyProfile } from '@/lib/calculations/urgency-calculator'
import { calculateLeadScore } from '@/lib/calculations/mortgage'
import { generateMortgageInsights } from '@/lib/insights/mortgage-insights-generator'
import { Target, TrendingUp, Lightbulb } from 'lucide-react'

/**
 * Intelligent Mortgage Form - Main Entry Point
 * Orchestrates the loan type selection and progressive form flow
 * Implements cumulative submission strategy per roundtable decision
 */

// Cumulative form state interface per roundtable requirements
interface FormState {
  gate0Data: { loanType?: string }
  gate1Data: { name?: string; email?: string }
  gate2Data: { 
    phone?: string
    // Loan-specific fields based on type
    propertyType?: string
    priceRange?: number
    purchaseTimeline?: string
    currentRate?: number
    outstandingLoan?: number
    lockInStatus?: string
    propertyValue?: number
    purpose?: string
  }
  gate3Data: { 
    monthlyIncome?: number
    existingCommitments?: number 
  }
}

interface IntelligentMortgageFormProps {
  className?: string
}

// Gate verbose logging behind development flag
const IS_DEV = process.env.NODE_ENV !== 'production'
const devLog = (...args: any[]) => { if (IS_DEV) console.log(...args) }
const devWarn = (...args: any[]) => { if (IS_DEV) console.warn(...args) }

const IntelligentMortgageForm = ({ className = '' }: IntelligentMortgageFormProps) => {
  const [selectedLoanType, setSelectedLoanType] = useState<'new_purchase' | 'refinance' | 'commercial' | null>(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Cumulative form state management - stores data from all gates
  const [formState, setFormState] = useState<FormState>({
    gate0Data: {},
    gate1Data: {},
    gate2Data: {},
    gate3Data: {}
  })
  
  // Track submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  
  // Store AI agent response data
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [leadScore, setLeadScore] = useState<number | null>(null)
  
  // Chatwoot chat state
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [showChatPrompt, setShowChatPrompt] = useState(false)

  const handleLoanTypeSelect = (loanType: 'new_purchase' | 'refinance' | 'commercial') => {
    setSelectedLoanType(loanType)
    // Store Gate 0 data (loan type selection)
    setFormState(prev => ({
      ...prev,
      gate0Data: { loanType }
    }))
  }

  // Submit cumulative data to AI analysis API
  const submitToAIAnalysis = async (cumulativeData: any, submissionPoint: 'gate2' | 'gate3', n8nGate: 'G2' | 'G3') => {
    setIsSubmitting(true)
    setSubmissionError(null)
    
    try {
      // Calculate urgency profile BEFORE sending
      const urgencyProfile = calculateUrgencyProfile(cumulativeData)
      
      // Calculate lead score BEFORE sending (basic calculation for now)
      // Note: Full calculation requires MortgageResult which we don't have yet
      const basicLeadScore = urgencyProfile.score * 5 // Basic scoring based on urgency
      
      // Send enriched data to API for AI agent analysis
      const response = await fetch('/api/forms/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: {
            ...cumulativeData,
            urgencyProfile,  // Pre-calculated urgency
            leadScore: basicLeadScore  // Basic lead score
          },
          metadata: {
            sessionId,
            submissionPoint,
            n8nGate,
            timestamp: new Date().toISOString()
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`)
      }
      
      // Handle AI agent response
      const result = await response.json()
      
      // Handle AI insights from agents
      if (result.data?.insights && Array.isArray(result.data.insights)) {
        handleAIAgentInsights(result.data.insights)
      }
      
      // Handle lead score from AI analysis
      if (result.data?.leadScore) {
        handleScoreUpdate(result.data.leadScore)
      }
      
      // Handle defense strategy if available (Gate 3)
      if (result.data?.defenseStrategy) {
        devLog('🛡️ Defense strategy received:', result.data.defenseStrategy)
      }
      
      devLog(`✅ Successfully submitted to AI analysis at ${submissionPoint} (${n8nGate})`)
      return result
      
    } catch (error) {
      console.error(`❌ Error submitting to AI analysis:`, error)
      setSubmissionError(error instanceof Error ? error.message : 'Submission failed')
      // Continue with local processing even if API fails
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler for step completion - implements cumulative submission strategy
  const handleStepCompletion = async (step: number, data: any) => {
    devLog(`📋 Step ${step} completed with data:`, data)
    
    // Accumulate data based on step
    switch(step) {
      case 0:
        // Step 0 is handled by handleLoanTypeSelect
        // This case shouldn't be reached but included for completeness
        setFormState(prev => ({ ...prev, gate0Data: data }))
        // NO API CALL per roundtable decision
        break
        
      case 1:
        setFormState(prev => ({ ...prev, gate1Data: data }))
        // NO API CALL - insufficient data per roundtable decision
        devLog('📝 Step 1 data stored locally, no submission yet')
        break
        
      case 2:
        setFormState(prev => ({ ...prev, gate2Data: data }))
        // FIRST AI SUBMISSION - Have enough for G2 analysis
        devLog('🚀 Step 2 complete - submitting cumulative data to AI agents for G2 analysis')
        const gate2CumulativeData = {
          loanType: formState.gate0Data.loanType || selectedLoanType,  // Ensure loanType is present
          ...formState.gate0Data,
          ...formState.gate1Data,
          ...data  // gate2Data
        }
        
        // Generate intelligent insights locally IMMEDIATELY
        devLog('📊 Gate 2 cumulative data:', gate2CumulativeData)
        const gate2Insights = generateMortgageInsights(gate2CumulativeData as any, 2)
        devLog('📊 Generated insights:', gate2Insights)
        
        if (gate2Insights.length > 0) {
          setAiInsights(gate2Insights as any)
        } else {
          devWarn('⚠️ No insights generated for Gate 2')
        }
        
        // Submit to AI analysis but don't let it overwrite our local insights
        await submitToAIAnalysis(gate2CumulativeData, 'gate2', 'G2')
        break
        
      case 3:
        setFormState(prev => ({ ...prev, gate3Data: data }))
        // SECOND AI SUBMISSION - Complete profile for G3 analysis
        devLog('🚀 Gate 3 complete - submitting all data to AI agents for comprehensive G3 analysis')
        const gate3CumulativeData = {
          loanType: formState.gate0Data.loanType || selectedLoanType,  // Ensure loanType is present
          ...formState.gate0Data,
          ...formState.gate1Data,
          ...formState.gate2Data,
          ...data  // gate3Data
        }
        
        // Generate comprehensive insights with full data IMMEDIATELY
        const gate3Insights = generateMortgageInsights(gate3CumulativeData as any, 3)
        if (gate3Insights.length > 0) {
          devLog('📊 Generated local insights for Gate 3:', gate3Insights)
          setAiInsights(gate3Insights as any)
        }
        
        // Submit to AI analysis but don't let it overwrite our local insights
        await submitToAIAnalysis(gate3CumulativeData, 'gate3', 'G3')
        
        // Chat creation is now owned by ChatTransitionScreen to avoid duplicates
        // Only calculate lead score here for display purposes
        try {
          // Calculate mortgage results first for proper lead scoring
          const mockResults = {
            monthlyPayment: 0,
            totalInterest: 0,
            totalAmount: 0,
            tdsrCompliant: true,
            msrCompliant: true,
            potentialSavings: 500
          } as any

          const calculatedLeadScore = calculateLeadScore(gate3CumulativeData as any, mockResults)
          setLeadScore(calculatedLeadScore)

          devLog('📊 Lead score calculated:', calculatedLeadScore)
          devLog('💬 Chat creation will be handled by ChatTransitionScreen')

          // Show completion prompt without creating duplicate conversation
          setShowChatPrompt(true)
        } catch (error) {
          console.error('Failed to calculate lead score:', error)
        }
        break
        
      default:
        devWarn(`⚠️ Unexpected step number: ${step}`)
    }
  }

  // Handler for AI insights from AI agents
  const handleAIAgentInsights = (insight: any) => {
    devLog('🤖 AI Agent insight received:', insight)
    
    // Process insights from AI agents - handle single insight
    const insights = Array.isArray(insight) ? insight : [insight]
    const processedInsights = insights.map(insight => {
      // Handle different insight formats from agents
      if (insight.otpAnalysis || insight.paymentSchemeAnalysis || insight.lockInAnalysis) {
        // Situational Analysis Agent format
        return {
          type: 'situational',
          title: 'Market Timing Analysis',
          message: formatSituationalInsight(insight),
          urgencyLevel: insight.otpAnalysis?.urgencyLevel || 'moderate',
          timestamp: new Date().toISOString(),
          source: 'ai_agent'
        }
      } else if (insight.marketAnalysis || insight.packageComparison) {
        // Rate Intelligence Agent format
        return {
          type: 'rate_intelligence',
          title: 'Rate Strategy Insights',
          message: formatRateInsight(insight),
          timestamp: new Date().toISOString(),
          source: 'ai_agent'
        }
      } else if (insight.layers) {
        // Dynamic Defense Agent format
        return {
          type: 'defense_strategy',
          title: 'Strategic Positioning',
          message: formatDefenseInsight(insight),
          timestamp: new Date().toISOString(),
          source: 'ai_agent'
        }
      } else {
        // Generic insight format
        return {
          ...insight,
          timestamp: new Date().toISOString(),
          source: 'ai_agent'
        }
      }
    })
    
    // Replace existing insights with new AI agent insights
    setAiInsights(processedInsights)
  }
  
  // Format situational insights from agents
  const formatSituationalInsight = (insight: any) => {
    const parts = []
    
    // Only show refinancing-specific insights for refinance loan type
    if (selectedLoanType === 'refinance') {
      if (insight.otpAnalysis?.recommendation) {
        parts.push(`OTP Status: ${insight.otpAnalysis.recommendation}`)
      }
      if (insight.paymentSchemeAnalysis?.recommendation) {
        parts.push(`Payment Strategy: ${insight.paymentSchemeAnalysis.recommendation}`)
      }
      if (insight.lockInAnalysis?.recommendation) {
        parts.push(`Lock-in: ${insight.lockInAnalysis.recommendation}`)
      }
    }
    
    // For new purchase, show different insights or general analysis
    if (selectedLoanType === 'new_purchase') {
      if (insight.eligibilityAnalysis?.recommendation) {
        parts.push(`Eligibility: ${insight.eligibilityAnalysis.recommendation}`)
      }
      if (insight.loanStructureAnalysis?.recommendation) {
        parts.push(`Loan Structure: ${insight.loanStructureAnalysis.recommendation}`)
      }
      if (insight.timingAnalysis?.recommendation) {
        parts.push(`Market Timing: ${insight.timingAnalysis.recommendation}`)
      }
    }
    
    return parts.join(' | ') || 'Analysis in progress...'
  }
  
  // Format rate intelligence insights from agents
  const formatRateInsight = (insight: any) => {
    const parts = []
    
    if (insight.marketAnalysis) {
      parts.push(`Market: ${insight.marketAnalysis.currentPhase}`)
    }
    if (insight.packageComparison) {
      parts.push(`Best fit: ${insight.packageComparison.recommendation}`)
    }
    
    return parts.join(' | ') || 'Rate analysis in progress...'
  }
  
  // Format defense strategy insights from agents
  const formatDefenseInsight = (insight: any) => {
    if (insight.layers && insight.layers.length > 0) {
      return `${insight.layers.length} strategic layers identified for optimal negotiation position`
    }
    return 'Building defense strategy...'
  }

  // Handler for lead score updates
  const handleScoreUpdate = (score: any) => {
    devLog('📊 Lead score updated:', score)
    // Store the latest lead score
    setLeadScore(typeof score === 'number' ? score : score?.value || score?.score || null)
    
    // Trigger lead qualification based on score
    if (typeof score === 'number' || score?.value) {
      const scoreValue = typeof score === 'number' ? score : score.value
      if (scoreValue >= 80) {
        devLog('🏆 High-quality lead detected! Score:', scoreValue)
      } else if (scoreValue >= 60) {
        devLog('📈 Qualified lead. Score:', scoreValue)
      } else {
        devLog('📊 Lead needs nurturing. Score:', scoreValue)
      }
    }
  }

  return (
    <section id="intelligent-contact" className={`py-16 bg-mist scroll-mt-12 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {!selectedLoanType ? (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-gilda font-normal text-ink mb-4">
                Get Your Personalized Mortgage Intelligence
              </h2>
              <p className="text-lg text-graphite max-w-2xl mx-auto font-inter">
                Our AI analyzes your situation and shows you exactly which banks will compete for you - in real time.
              </p>
            </div>

            {/* Loan Type Selector - Using simplified version for debugging */}
            <div className="max-w-4xl mx-auto">
              <SimpleLoanTypeSelector
                onSelect={handleLoanTypeSelect}
                redirectToApply={true}
              />
            </div>
          </>
        ) : (
          <>
            {/* Preload Chatwoot widget as soon as loan type is selected */}
            
            {/* Commercial flow removed - only supporting new_purchase and refinance */}
            {selectedLoanType && (
              <div className="max-w-3xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-8">
                  <div className="flex items-center text-sm font-inter text-graphite">
                    <button 
                      onClick={() => setSelectedLoanType(null)}
                      className="hover:text-gold transition-colors"
                    >
                      Choose loan type
                    </button>
                    <span className="mx-2">→</span>
                    <span className="text-ink font-medium capitalize">
                      {selectedLoanType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Progressive Form for new_purchase and refinance (legacy progressive form) */}
                <ProgressiveForm 
                  loanType={selectedLoanType}
                  sessionId={sessionId}
                  onStepCompletion={handleStepCompletion}
                  onAIInsight={handleAIAgentInsights}
                  onScoreUpdate={handleScoreUpdate}
                  isExternallySubmitting={isSubmitting}
                  submissionError={submissionError}
                />
                
                {/* Chat prompt removed - ChatTransitionScreen handles chat creation and redirect */}
                
                {/* AI Insights & Lead Score Display - Hide "Analysis in progress" messages in Step 3 */}
                {(aiInsights.length > 0 || leadScore !== null) && (
                <div className="mt-8 space-y-4">
                  {/* Lead Score Display */}
                  {leadScore !== null && (
                    <div className="bg-white  p-4 border border-gold/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">Lead Score</span>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-gold">{leadScore}</div>
                          <div className="text-sm text-graphite">/100</div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-fog h-2">
                        <div 
                          className="bg-gold h-2 transition-all duration-500"
                          style={{ width: `${Math.min(leadScore, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-graphite flex items-center gap-1">
                        {leadScore >= 80 ? (
                          <>
                            <Target className="w-3 h-3 text-gold" />
                            <span>High-priority lead</span>
                          </>
                        ) : leadScore >= 60 ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-gold" />
                            <span>Qualified lead</span>
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-3 h-3 text-gold" />
                            <span>Needs nurturing</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* AI Insights Display */}
                  {aiInsights.length > 0 && (
                    <div className="space-y-4">
                      {aiInsights.filter(insight => {
                        // Filter out "Analysis in progress..." messages
                        const insightData = insight['0'] || insight;
                        return insightData.message && 
                               !insightData.message.includes('Analysis in progress') &&
                               !insightData.message.includes('analysis in progress');
                      }).map((insight, index) => {
                        // Handle insights from AI agents and local generator
                        const insightData = insight['0'] || insight;
                        
                        // Determine card style based on insight type
                        const getCardStyle = () => {
                          switch(insightData.type) {
                            case 'warning': return 'bg-gold/10 border-gold/30'
                            case 'opportunity': return 'bg-emerald/10 border-emerald/30'
                            case 'calculation': return 'bg-mist border-fog'
                            case 'advice': return 'bg-mist border-fog'
                            default: return 'bg-mist border-fog'
                          }
                        }
                        
                        return (
                          <div key={index} className={` p-4 border ${getCardStyle()}`}>
                            <div className="space-y-3">
                              {/* Title */}
                              {insightData.title && (
                                <div className="font-semibold text-ink text-lg">
                                  {insightData.title}
                                </div>
                              )}
                              
                              {/* Main Message */}
                              {insightData.message && (
                                <div className="text-sm text-graphite">
                                  {insightData.message}
                                </div>
                              )}
                              
                              {/* Calculations Display */}
                              {insightData.calculations && (
                                <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-white">
                                  {insightData.calculations.maxLoan && (
                                    <div>
                                      <div className="text-xs text-silver">Max Loan</div>
                                      <div className="font-semibold">S${insightData.calculations.maxLoan.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {insightData.calculations.monthlyPayment && (
                                    <div>
                                      <div className="text-xs text-silver">Monthly Payment</div>
                                      <div className="font-semibold">S${insightData.calculations.monthlyPayment.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {insightData.calculations.stampDuty && (
                                    <div>
                                      <div className="text-xs text-silver">Stamp Duty</div>
                                      <div className="font-semibold">S${insightData.calculations.stampDuty.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {insightData.calculations.downpayment && (
                                    <div>
                                      <div className="text-xs text-silver">Downpayment</div>
                                      <div className="font-semibold">S${insightData.calculations.downpayment.toLocaleString()}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Details List */}
                              {insightData.details && insightData.details.length > 0 && (
                                <ul className="text-sm text-graphite space-y-1">
                                  {insightData.details.map((detail: string, idx: number) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              
                              {/* Value Highlight */}
                              {insightData.value && (
                                <div className="text-sm font-semibold text-gold bg-gold/10 inline-block px-2 py-1">
                                  {insightData.value}
                                </div>
                              )}
                              
                              {/* Next Step CTA */}
                              {insightData.nextStep && (
                                <div className="pt-2 border-t">
                                  <div className="text-sm text-graphite flex items-center">
                                    <span className="mr-2">→</span>
                                    <span className="italic">{insightData.nextStep}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Bottom Trust Indicators */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white  p-6 border border-fog/30">
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-graphite">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald"></div>
                <span>Bank-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gold"></div>
                <span>MAS regulated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-charcoal"></div>
                <span>AI-powered insights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gold-dark"></div>
                <span>No hidden fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default IntelligentMortgageForm