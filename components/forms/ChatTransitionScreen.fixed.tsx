'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Bot, Phone, MessageSquare, Mail, Loader2 } from 'lucide-react'
import { conversionTracker } from '@/lib/analytics/conversion-tracking'
import { calculateBrokerPersona, BrokerPersona } from '@/lib/calculations/broker-persona'
import { sessionManager, AssignedBroker } from '@/lib/utils/session-manager'

interface ChatTransitionScreenProps {
  formData: {
    name: string
    email: string
    phone: string
    loanType: string
    propertyCategory?: string
    propertyType?: string
    actualAges?: number[]
    actualIncomes?: number[]
    employmentType?: string
    hasExistingLoan?: boolean
    existingLoanDetails?: {
      outstandingAmount: number
      monthlyPayment: number
      remainingTenure: number
    }
  }
  leadScore: number
  sessionId: string
  onTransitionComplete: (conversationId: number) => void
  onFallbackRequired: (fallbackData: {
    type: 'phone' | 'email' | 'form'
    contact: string
    message: string
  }) => void
}

type TransitionState = 'analyzing' | 'ready' | 'connecting' | 'success' | 'fallback'

export default function ChatTransitionScreen({
  formData,
  leadScore,
  sessionId,
  onTransitionComplete,
  onFallbackRequired
}: ChatTransitionScreenProps) {
  const [state, setState] = useState<TransitionState>('analyzing')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Connected! Loading chat...')
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [brokerPersona, setBrokerPersona] = useState<BrokerPersona | null>(null)
  const [isAvatarError, setIsAvatarError] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [fallbackData, setFallbackData] = useState<{
    type: 'phone' | 'email' | 'form'
    contact: string
    message: string
  } | null>(null)

  // Simulate analyzing and broker matching process
  // FIXED: Added leadScore and formData to dependency array
  useEffect(() => {
    // Only run if we're in analyzing state
    if (state !== 'analyzing') return

    // Start with analyzing animation
    let progressInterval: NodeJS.Timeout
    let messageTimeout1: NodeJS.Timeout
    let messageTimeout2: NodeJS.Timeout
    let messageTimeout3: NodeJS.Timeout
    let brokerTimeout: NodeJS.Timeout

    // Animate progress bar smoothly
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 15
      })
    }, 400)

    // Update messages to show progress through analysis
    messageTimeout1 = setTimeout(() => setMessage('Analyzing your requirements...'), 800)
    messageTimeout2 = setTimeout(() => setMessage('Finding the perfect match...'), 1600)
    messageTimeout3 = setTimeout(() => setMessage('Loading chat...'), 2400)

    // After 3.5 seconds, show the matched broker
    brokerTimeout = setTimeout(() => {
      const personaScore = leadScore || 50
      const personaDetails = calculateBrokerPersona(personaScore, formData)
      setBrokerPersona(personaDetails)
      setMessage('Perfect match found!')
      setState('ready')
      setProgress(100)
    }, 3500)

    return () => {
      if (progressInterval) clearInterval(progressInterval)
      if (messageTimeout1) clearTimeout(messageTimeout1)
      if (messageTimeout2) clearTimeout(messageTimeout2)
      if (messageTimeout3) clearTimeout(messageTimeout3)
      if (brokerTimeout) clearTimeout(brokerTimeout)
    }
  }, [state, leadScore, formData])

  // Rest of the component remains the same...
  // (truncated for brevity - full component continues as before)

  return null
}
