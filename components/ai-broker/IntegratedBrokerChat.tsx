'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { SophisticatedLayout } from './SophisticatedLayout'
import { sessionManager, AssignedBroker } from '@/lib/utils/session-manager'

// Lazy load the chat interface
const CustomChatInterface = dynamic(
  () => import('@/components/chat/CustomChatInterface'),
  {
    ssr: false,
    loading: () => <ChatLoadingSkeleton />
  }
)

interface IntegratedBrokerChatProps {
  conversationId: number
  broker?: AssignedBroker | null  // Broker data from parent (Tier 1)
  formData: any
  sessionId: string
  situationalInsights?: any
  rateIntelligence?: any
  defenseStrategy?: any
  leadScore?: number | null
}

export function IntegratedBrokerChat({
  conversationId,
  broker,
  formData,
  sessionId,
  situationalInsights,
  rateIntelligence,
  defenseStrategy,
  leadScore
}: IntegratedBrokerChatProps) {
  // Three-tier fallback: prop → sessionStorage → API
  const [brokerName, setBrokerName] = useState<string>(
    broker?.name || 'AI Mortgage Advisor'  // Tier 1: Use prop if provided
  )

  useEffect(() => {
    // If broker name already set from prop, no need to fetch
    if (broker?.name) {
      console.log('Using broker from prop (Tier 1):', broker.name)
      setBrokerName(broker.name)
      return
    }

    // Tier 2: Try sessionStorage
    const session = sessionManager.getChatwootSession(sessionId)
    if (session?.broker?.name) {
      console.log('Using broker from sessionStorage (Tier 2):', session.broker.name)
      setBrokerName(session.broker.name)
      return
    }

    // Legacy: Check old brokerName field for backward compatibility
    if (session?.brokerName) {
      console.log('Using legacy brokerName from sessionStorage (Tier 2 fallback):', session.brokerName)
      setBrokerName(session.brokerName)
      return
    }

    // Tier 3: Fallback to API call (only if prop and sessionStorage don't have broker)
    console.log('No broker in prop or sessionStorage, fetching from API (Tier 3)...')
    const fetchBrokerName = async () => {
      try {
        const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}&limit=1`)
        if (response.ok) {
          const data = await response.json()
          const apiBrokerName = data.conversation?.custom_attributes?.ai_broker_name
          if (apiBrokerName) {
            console.log('Fetched broker from API:', apiBrokerName)
            setBrokerName(apiBrokerName)

            // Update session for future use
            const existingSession = sessionManager.getChatwootSession(sessionId) || { conversationId }
            sessionManager.setChatwootSession(sessionId, {
              ...existingSession,
              broker: {
                name: apiBrokerName,
                id: data.conversation?.custom_attributes?.ai_broker_id || '',
                status: 'assigned'
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching broker name from API (Tier 3):', error)
        // Keep default broker name on error
      }
    }

    if (conversationId) {
      fetchBrokerName()
    }
  }, [conversationId, sessionId, broker])

  return (
    <SophisticatedLayout
      insights={situationalInsights}
      rateIntelligence={rateIntelligence}
      leadScore={leadScore}
    >
      <CustomChatInterface
        conversationId={conversationId}
        contactName={formData?.name || 'You'}
        contactEmail={formData?.email}
        brokerName={brokerName}
      />
    </SophisticatedLayout>
  )
}

function ChatLoadingSkeleton() {
  return (
    <div className="flex-1 p-4 animate-pulse">
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="max-w-lg bg-gray-100 rounded-lg p-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-lg bg-gray-100 rounded-lg p-3">
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="h-12 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}