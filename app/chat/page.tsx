'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ResponsiveBrokerShell } from '@/components/ai-broker/ResponsiveBrokerShell'
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
  const hasInitialized = useRef(false)

  // Navigation guard: Prevent back button from returning to form
  useEffect(() => {
    const currentPath = window.location.pathname + window.location.search
    window.history.pushState(null, '', currentPath)

    const handlePopState = () => {
      window.location.replace('/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
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

    // Small delay to ensure everything is loaded
    setTimeout(() => {
      setIsReady(true)
    }, 500)
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
    <ResponsiveBrokerShell
      conversationId={parseInt(conversationId)}
      broker={broker}
      formData={userData}
      sessionId={conversationId}
      isLoading={!isReady}
    />
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <div className="w-16 h-1 bg-fog overflow-hidden">
          <div className="h-full bg-gold transition-all duration-200" style={{ width: '60%' }}/>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
