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
  }, [state])


  const initiateChatTransition = async (retryCount = 0): Promise<void> => {
    const startTime = Date.now()
    const maxRetries = 3
    const retryDelays = [1000, 2000, 4000] // Exponential backoff

    try {
      // Track chat transition start (only on first attempt)
      if (retryCount === 0) {
        const persona = leadScore >= 75 ? 'aggressive' : leadScore >= 45 ? 'balanced' : 'conservative'
        await conversionTracker.trackChatTransitionStart(sessionId, leadScore, persona)
      }

      // Debug the request payload before sending
      console.log('ðŸ” DEBUG: ChatTransition API request payload:', {
        formData,
        sessionId,
        leadScore,
        attempt: retryCount + 1
      })

      // Call the API to create Chatwoot conversation
      const response = await fetch('/api/chatwoot-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          sessionId,
          leadScore
        })
      })

      const data = await response.json()

      // Handle both 200 OK responses with fallback and error status codes
      if (!response.ok && response.status !== 200) {
        console.error('API response error:', response.status, response.statusText)
        console.error('Error response body:', data)

        // Retry on 503 or 500 errors if we haven't exceeded max retries
        if ((response.status === 503 || response.status === 500) && retryCount < maxRetries) {
          const delay = retryDelays[retryCount]
          console.log(`⏳ Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`)
          setMessage(`Connection issue. Retrying... (${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return initiateChatTransition(retryCount + 1)
        }

        // If we got a fallback in the error response, use it
        if (data.fallback) {
          await conversionTracker.trackChatTransitionFailed(sessionId, 'api_error', data.fallback.type)
          setFallbackData(data.fallback)
          setState('fallback')
          return
        }

        throw new Error(`API error: ${response.status} - ${response.statusText}`)
      }

      // Check if we have a successful conversation
      if (data.success && data.conversationId && data.conversationId > 0) {
        // Track successful chat creation
        const transitionTime = (Date.now() - startTime) / 1000
        await conversionTracker.trackChatCreated(sessionId, data.conversationId, leadScore, transitionTime)

        // Extract broker data from API response (Tier 1: Real broker from Supabase)
        const assignedBroker: AssignedBroker | null = data.widgetConfig?.customAttributes?.ai_broker_name
          ? {
              name: data.widgetConfig.customAttributes.ai_broker_name,
              id: data.widgetConfig.customAttributes.ai_broker_id || '',
              status: (data.widgetConfig.customAttributes.broker_status || 'assigned') as 'assigned' | 'queued' | 'engaged'
            }
          : null

        // Store complete session data with broker information
        sessionManager.setChatwootSession(sessionId, {
          conversationId: data.conversationId,
          broker: assignedBroker,  // Real broker from API
          preselectedPersona: brokerPersona ? {
            name: brokerPersona.name,
            title: brokerPersona.title,
            approach: brokerPersona.approach
          } : undefined,  // Pre-selected persona for fallback
          formData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            loanType: formData.loanType
          },
          timestamp: Date.now()
        })

        // Store widget config for backward compatibility
        if (data.widgetConfig) {
          sessionStorage.setItem('chatwoot_widget_config', JSON.stringify(data.widgetConfig))
        }

        // Store form data and lead score for backward compatibility
        sessionStorage.setItem('form_data', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          loanType: formData.loanType
        }))
        sessionStorage.setItem('lead_score', leadScore.toString())

        // Successfully created conversation - proceed directly to chat
        console.log('✅ Conversation created successfully:', {
          conversationId: data.conversationId,
          widgetConfig: !!data.widgetConfig,
          broker: data.widgetConfig?.customAttributes?.ai_broker_name
        })

        setConversationId(data.conversationId)
        setState('success') // Show loading state before navigation
        setProgress(100)
        setMessage('Connected! Loading chat...')

        // Notify parent and let it handle loading the chat widget
        console.log('🔔 Calling onTransitionComplete with conversationId:', data.conversationId)
        onTransitionComplete(data.conversationId)
        console.log('✅ onTransitionComplete called successfully')
        return
      } else if (data.fallback) {
        // Track fallback usage - this happens when Chatwoot is not configured
        console.log('📱 Chat service unavailable, showing fallback options:', data.fallback)
        await conversionTracker.trackChatTransitionFailed(sessionId, 'api_fallback', data.fallback.type)

        // Handle fallback scenario gracefully
        setFallbackData(data.fallback)
        setState('fallback')
      } else {
        // Unexpected response format
        console.error('Unexpected API response format:', data)
        throw new Error('Invalid conversation response')
      }
    } catch (error) {
      console.error('Chat transition error:', error)

      // Retry on network errors if we haven't exceeded max retries
      if (retryCount < maxRetries && error instanceof Error &&
          (error.message.includes('fetch') || error.message.includes('network'))) {
        const delay = retryDelays[retryCount]
        console.log(`⏳ Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`)
        setMessage(`Network issue. Retrying... (${retryCount + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return initiateChatTransition(retryCount + 1)
      }

      // Track transition failure after all retries exhausted
      await conversionTracker.trackChatTransitionFailed(sessionId, 'exception', 'phone')

      // Default fallback with consistent phone number
      const defaultFallback = {
        type: 'phone' as const,
        contact: '+6583341445',
        message: 'Chat temporarily unavailable. Call us directly for immediate assistance!'
      }

      setFallbackData(defaultFallback)
      setState('fallback')
    }
  }

  const getApproachDescription = (persona: BrokerPersona): string => {
    switch (persona.approach) {
      case 'premium_rates_focus':
        return 'Exclusive rates and investment strategies tailored for you.'
      case 'educational_consultative':
        return 'Guides you through each financing option with clarity.'
      case 'value_focused_supportive':
        return 'Step-by-step support to maximise savings and confidence.'
      default:
        return 'Personalized guidance to help you move forward with confidence.'
    }
  }

  const handleContinueToChat = async () => {
    // Prevent multiple clicks
    if (isConnecting) return

    // Set loading state
    setIsConnecting(true)

    // Keep showing the broker while creating the conversation
    // Don't change state - stay on 'ready'
    await initiateChatTransition()

    // Note: isConnecting will remain true until transition completes or fails
    // This prevents multiple clicks during the transition
  }

  const handleFallbackAction = async (action: 'call' | 'whatsapp' | 'email') => {
    if (!fallbackData) return

    // Track fallback usage
    const fallbackType = action === 'call' ? 'phone' : action === 'whatsapp' ? 'whatsapp' : 'email'
    await conversionTracker.trackFallbackUsed(sessionId, fallbackType, leadScore)

    switch (action) {
      case 'call':
        window.open(`tel:${fallbackData.contact}`)
        break
      case 'whatsapp':
        const phoneNumber = fallbackData.contact.replace(/\D/g, '')
        window.open(`https://wa.me/${phoneNumber}`)
        break
      case 'email':
        window.open(`mailto:assist@nextnest.sg`)
        break
    }
    
    onFallbackRequired(fallbackData)
  }

  // Ready State - Show broker and wait for user action
  if (state === 'ready' && brokerPersona) {
    const personaInitials = brokerPersona.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)

    return (
      <Card className="mx-auto w-full max-w-sm rounded-2xl border-fog bg-white shadow-sm sm:max-w-md">
        <CardContent className="flex flex-col items-center gap-2 px-3 py-3 text-center sm:px-4 sm:py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white to-mist border border-gold/40 sm:h-10 sm:w-10">
            <span className="text-sm font-semibold uppercase tracking-wide text-gold">
              {personaInitials}
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">AI BROKER MATCHED</p>
            <h3 className="text-sm font-semibold text-ink">{brokerPersona.name}</h3>
            <p className="text-[11px] text-graphite">{message}</p>
          </div>

          <Button
            size="sm"
            onClick={handleContinueToChat}
            disabled={isConnecting}
            className="w-full bg-gold text-ink hover:bg-gold-dark text-sm h-8 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Continue to Chat'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Analyzing State (initial state - shows BEFORE broker assignment)
  if (state === 'analyzing') {
    return (
      <Card className="mx-auto w-full max-w-sm rounded-2xl border-fog bg-white shadow-sm sm:max-w-md">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          {/* Large circular icon background */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mist/50">
            <Bot className="h-10 w-10 text-gold" aria-hidden="true" />
          </div>

          {/* Title and subtitle */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-ink">Connecting to Your Broker</h3>
            <p className="text-sm text-graphite">{message}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full mt-2">
            <Progress value={progress} className="h-2 w-full bg-fog [&>div]:bg-gold" aria-label="Analysis progress" />
          </div>

          {/* Bottom caption */}
          <p className="text-xs uppercase tracking-wider text-silver mt-2">
            Preparing your dashboard...
          </p>
        </CardContent>
      </Card>
    )
  }

  // Connecting State (when creating the Chatwoot conversation)
  if (state === 'connecting') {
    return (
      <Card className="mx-auto w-full max-w-sm rounded-2xl border-fog bg-white shadow-sm sm:max-w-md">
        <CardContent className="flex flex-col items-center gap-2 px-3 py-3 text-center sm:px-4 sm:py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mist sm:h-10 sm:w-10">
            <Bot className="h-5 w-5 text-gold sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-ink">Setting Up Chat</p>
            <p className="text-[11px] text-graphite">{message}</p>
          </div>
          <Progress value={progress} className="h-1.5 w-full bg-fog [&>div]:bg-gold" />
          <p className="text-[10px] uppercase tracking-wide text-silver">Please wait...</p>
        </CardContent>
      </Card>
    )
  }

  // Success State - Now just shows loading while transitioning to chat
  if (state === 'success') {
    return (
      <Card className="mx-auto w-full max-w-sm rounded-2xl border-fog bg-white shadow-sm sm:max-w-md">
        <CardContent className="flex flex-col items-center gap-2 px-3 py-3 text-center sm:px-4 sm:py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mist sm:h-10 sm:w-10">
            <Bot className="h-5 w-5 text-gold sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-ink">Loading Chat</p>
            <p className="text-[11px] text-graphite">Preparing your conversation...</p>
          </div>
          <Progress value={100} className="h-1.5 w-full bg-fog [&>div]:bg-gold" />
        </CardContent>
      </Card>
    )
  }

  // Fallback State (Error)
  if (state === 'fallback' && fallbackData) {
    return (
      <Card className="mx-auto w-full max-w-sm rounded-2xl border-fog bg-white shadow-sm sm:max-w-md">
        <CardContent className="p-6 pt-6 sm:p-8 sm:pt-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gold/10 flex items-center justify-center">
              <Phone className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-3">
              Let&apos;s Connect Directly
            </h3>
            <p className="text-graphite mb-6">
              Our chat system is updating. Your dedicated broker is ready to help immediately:
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleFallbackAction('call')}
                className="w-full border-fog text-graphite hover:bg-mist flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call: {fallbackData.contact}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFallbackAction('whatsapp')}
                className="w-full border-fog text-graphite hover:bg-mist flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFallbackAction('email')}
                className="w-full border-fog text-graphite hover:bg-mist flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email: assist@nextnest.sg
              </Button>
            </div>
            <p className="text-xs text-silver mt-6">
              {fallbackData.message}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}





