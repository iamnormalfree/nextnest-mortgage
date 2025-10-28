'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CustomChatInterface from '@/components/chat/CustomChatInterface'
import ChatLayoutShell from '@/components/chat/ChatLayoutShell'
import InsightsSidebar from '@/components/chat/InsightsSidebar'
// Removed AdvisorHeader - integrated inline
// Removed unused components for cleaner UI
import BrokerProfile from '@/components/chat/BrokerProfile'
import HandoffNotification from '@/components/chat/HandoffNotification'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversationId = searchParams.get('conversation')
  const [isReady, setIsReady] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [broker, setBroker] = useState<any>(null)
  const [isLoadingBroker, setIsLoadingBroker] = useState(true)
  const [isHandoff, setIsHandoff] = useState(false)
  const [handoffDetails, setHandoffDetails] = useState<{ reason?: string; urgency?: any }>({})
  const hasInitialized = useRef(false)
  const [inputMessage, setInputMessage] = useState('')

  // Navigation guard: Prevent back button from returning to form
  useEffect(() => {
    // Add a history entry so we can detect back button press
    const currentPath = window.location.pathname + window.location.search
    window.history.pushState(null, '', currentPath)

    const handlePopState = () => {
      // Back button was pressed - redirect to homepage
      window.location.replace('/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    // Prevent re-running
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Retrieve stored user information from sessionStorage
    const formData = sessionStorage.getItem('form_data')

    if (formData) {
      const data = JSON.parse(formData)
      console.log('Retrieved user data:', data)
      setUserData(data)
    }

    // Fetch broker details if conversation exists
    if (conversationId) {
      fetchBrokerDetails(conversationId)
    }

    // Listen for handoff events (custom event from chat interface)
    const handleHandoff = (event: CustomEvent) => {
      setIsHandoff(true)
      setHandoffDetails({
        reason: event.detail?.reason || 'Customer requested human assistance',
        urgency: event.detail?.urgency || 'normal'
      })
    }

    window.addEventListener('chatwoot:handoff' as any, handleHandoff)

    // Small delay to ensure everything is loaded
    setTimeout(() => {
      setIsReady(true)
    }, 500)

    return () => {
      window.removeEventListener('chatwoot:handoff' as any, handleHandoff)
    }
  }, [conversationId])

  const fetchBrokerDetails = async (convId: string) => {
    try {
      setIsLoadingBroker(true)
      const response = await fetch(`/api/brokers/conversation/${convId}`)
      if (response.ok) {
        const data = await response.json()
        setBroker(data.broker)
        console.log('Broker assigned:', data.broker)
      } else {
        console.log('No broker assigned to this conversation')
      }
    } catch (error) {
      console.error('Error fetching broker:', error)
    } finally {
      setIsLoadingBroker(false)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInputMessage(text)
    // The input will be passed to CustomChatInterface via props or context
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <Card className="max-w-md border-fog">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-ink mb-2">Analysis not ready yet</h2>
            <p className="text-graphite mb-4">
              Complete the form first—we&apos;ll have your breakdown ready within 24 hours.
            </p>
            <Button
              onClick={() => window.location.href = '/apply'}
              className="bg-gold text-ink hover:bg-gold-dark"
            >
              Start Your Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ChatLayoutShell
      leftSidebar={<InsightsSidebar />}
    >
      <div className="h-full flex flex-col">
        {!isReady ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              {/* Simple progress indicator instead of continuous spinner */}
              <div className="w-16 h-1 bg-fog mx-auto mb-4 overflow-hidden">
                <div className="h-full bg-gold transition-all duration-200" style={{ width: '60%' }}/>
              </div>
              <p className="text-graphite">Loading chat interface...</p>
            </div>
          </div>
        ) : (
          <>

            {/* Broker Profile removed - not needed */}

            {/* Handoff Notification */}
            {isHandoff && (
              <HandoffNotification
                reason={handoffDetails.reason}
                urgencyLevel={handoffDetails.urgency}
              />
            )}

            {/* Custom Chat Interface - Full Height */}
            <div className="flex-1 overflow-hidden">
              <CustomChatInterface
                conversationId={parseInt(conversationId)}
                contactName={userData?.name || 'You'}
                contactEmail={userData?.email}
                brokerName={broker?.name || 'Agent'}
                prefillMessage={inputMessage}
              />
            </div>

          </>
        )}
      </div>
    </ChatLayoutShell>
  )
}

export default function ChatPage() {
  return (
    <div className="fixed inset-0"> {/* Full viewport without nav bar padding */}
      <Suspense fallback={
        <div className="min-h-screen bg-mist flex items-center justify-center">
          <div className="w-16 h-1 bg-fog overflow-hidden">
            <div className="h-full bg-gold transition-all duration-200" style={{ width: '60%' }}/>
          </div>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </div>
  )
}