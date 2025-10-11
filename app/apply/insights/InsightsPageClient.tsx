'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResponsiveBrokerShell } from '@/components/ai-broker/ResponsiveBrokerShell'
import { useLoanApplicationContext } from '@/lib/hooks/useLoanApplicationContext'
import { sessionManager, AssignedBroker } from '@/lib/utils/session-manager'

interface InsightsPageClientProps {
  initialMobileState: boolean
}

export function InsightsPageClient({ initialMobileState }: InsightsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, setInsights } = useLoanApplicationContext()
  const [isLoading, setIsLoading] = useState(true)
  const [analysisData, setAnalysisData] = useState<any>(null)

  // Get session ID from query params or context
  const sessionId = searchParams.get('session') || data.sessionId

  // Get conversation ID from URL params (primary) or sessionStorage (fallback)
  const conversationParam = searchParams.get('conversation')

  // Check for existing Chatwoot session and broker data
  const [chatwootConversationId, setChatwootConversationId] = useState<number | null>(
    conversationParam ? parseInt(conversationParam) : null
  )
  const [brokerData, setBrokerData] = useState<AssignedBroker | null>(null)

  useEffect(() => {
    // Check if Chatwoot conversation was already created
    if (!sessionId) return

    // If we already have conversationId from URL, use it
    if (conversationParam) {
      console.log('Using conversation ID from URL:', conversationParam)
      setChatwootConversationId(parseInt(conversationParam))
    }

    const session = sessionManager.getChatwootSession(sessionId)
    if (session) {
      console.log('Found existing Chatwoot session:', session)
      // Only set conversationId from session if not already set from URL
      if (!conversationParam) {
        setChatwootConversationId(session.conversationId)
      }

      // Extract broker data if available (Tier 1: Real broker from Supabase)
      if (session.broker) {
        console.log('Found assigned broker:', session.broker)
        setBrokerData(session.broker)
      } else if (session.preselectedPersona) {
        // Fallback to preselected persona if no real broker assigned yet
        console.log('Using preselected persona as fallback:', session.preselectedPersona)
        // Note: ResponsiveBrokerShell will handle the fallback internally
      }
    }
  }, [sessionId])

  useEffect(() => {
    // Simulate fetching AI analysis results
    const fetchAnalysis = async () => {
      if (!sessionId) {
        console.log('⏸️ No session ID yet, skipping analysis fetch')
        return
      }

      setIsLoading(true)

      try {
        // In production, fetch from API based on session ID
        // const response = await fetch(`/api/ai-insights?session=${sessionId}`)
        // const data = await response.json()

        // For now, use mock data
        const mockAnalysis = {
          situationalInsights: {
            otpAnalysis: {
              urgencyLevel: 'high' as const,
              keyFactors: [
                'OTP expiring within 30 days',
                'IPA secured - ready for immediate action',
                'New launch booking requires quick decision'
              ],
              recommendations: [
                'Schedule immediate consultation with mortgage specialist',
                'Prepare all required documents now',
                'Secure IPA if not already done'
              ],
              timeline: 'Action needed within 30 days'
            },
            overallRecommendation: 'Time-sensitive opportunity requiring immediate action. Progressive payment scheme available for your property type.',
            nextSteps: [
              'Schedule immediate consultation with mortgage broker',
              'Prepare income documents and property papers',
              'Get loan quotes from 3-5 banks'
            ]
          },
          rateIntelligence: {
            timingRecommendation: 'Lock in rates within next 30-60 days before potential market shifts',
          },
          defenseStrategy: {
            strategies: [],
            nextActions: []
          },
          leadScore: 85
        }

        setAnalysisData(mockAnalysis)
        setInsights(mockAnalysis, mockAnalysis.leadScore)
      } catch (error) {
        console.error('Failed to fetch analysis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [sessionId])  // Removed setInsights - it should be a stable function

  const handleBrokerConsultation = () => {
    // If Chatwoot conversation exists, use it
    if (chatwootConversationId) {
      console.log('Opening Chatwoot conversation:', chatwootConversationId)

      // Navigate to chat page with conversation ID
      router.push(`/chat?conversation=${chatwootConversationId}&session=${sessionId}`)
    } else {
      // Fallback to consultation page
      console.log('Starting broker consultation for session:', sessionId)
      router.push(`/apply/consultation?session=${sessionId}`)
    }
  }

  const handleUpdateFormData = (updatedData: any) => {
    // Update form data if user goes back to edit
    console.log('Updating form data:', updatedData)
  }

  return (
    <ResponsiveBrokerShell
      conversationId={chatwootConversationId}
      broker={brokerData}
      situationalInsights={analysisData?.situationalInsights}
      rateIntelligence={analysisData?.rateIntelligence}
      defenseStrategy={analysisData?.defenseStrategy}
      leadScore={analysisData?.leadScore}
      formData={data}
      sessionId={sessionId}
      isLoading={isLoading}
      onBrokerConsultation={handleBrokerConsultation}
      onUpdateFormData={handleUpdateFormData}
      initialMobileState={initialMobileState}
    />
  )
}