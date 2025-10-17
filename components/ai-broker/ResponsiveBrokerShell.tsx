'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useMobileView } from '@/lib/hooks/useMediaQuery'
import { FEATURE_FLAGS } from '@/lib/features/feature-flags'
import { ChatErrorBoundary } from './ChatErrorBoundary'
import { AssignedBroker } from '@/lib/utils/session-manager'
import type {
  MobileAIBrokerUIProps,
  SituationalInsights,
  RateIntelligence,
  DefenseStrategy
} from './types'

// Dynamic imports for code splitting
const SophisticatedAIBrokerUI = dynamic(
  () => import('@/components/archive/2025-10/redesign-experiments/redesign/SophisticatedAIBrokerUI'),
  {
    ssr: false,
    loading: () => <LoadingSkeleton />
  }
)

const IntegratedBrokerChat = dynamic(
  () => import('./IntegratedBrokerChat').then(mod => ({ default: mod.IntegratedBrokerChat })),
  {
    ssr: false,
    loading: () => <LoadingSkeleton />
  }
)

const MobileAIAssistantCompact = dynamic(
  () => import('./MobileAIAssistantCompact'),
  {
    ssr: false,
    loading: () => <MobileLoadingSkeleton />
  }
)

export interface ResponsiveBrokerShellProps {
  // Analysis data from form submission
  situationalInsights?: SituationalInsights | null
  rateIntelligence?: RateIntelligence | null
  defenseStrategy?: DefenseStrategy | null
  leadScore?: number | null

  // Chat integration
  conversationId?: number | null
  broker?: AssignedBroker | null  // Broker data from sessionStorage

  // Form data context
  formData?: any
  sessionId?: string

  // Loading states
  isLoading?: boolean

  // Actions
  onBrokerConsultation?: () => void
  onUpdateFormData?: (data: any) => void

  // Server-side mobile detection
  initialMobileState?: boolean
}

/**
 * Responsive shell that renders mobile or desktop AI broker UI
 * based on viewport size and feature flags
 */
export function ResponsiveBrokerShell({
  situationalInsights,
  rateIntelligence,
  defenseStrategy,
  leadScore,
  conversationId,
  broker,
  formData,
  sessionId,
  isLoading = false,
  onBrokerConsultation,
  onUpdateFormData,
  initialMobileState = false
}: ResponsiveBrokerShellProps) {
  const [mounted, setMounted] = useState(false)
  const isMobileViewport = useMobileView()

  // Handle hydration - run only once on mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which UI to show
  const shouldUseMobileUI = FEATURE_FLAGS.MOBILE_AI_BROKER_UI &&
    (!mounted ? initialMobileState : isMobileViewport)

  // Mobile UI - Full screen, no padding
  if (shouldUseMobileUI) {
    return (
      <div className="fixed inset-0 bg-white">
        <MobileAIAssistantCompact
          situationalInsights={situationalInsights}
          rateIntelligence={rateIntelligence}
          defenseStrategy={defenseStrategy}
          leadScore={leadScore}
          isLoading={isLoading}
          onBrokerConsultation={onBrokerConsultation}
          formData={formData}
          sessionId={sessionId}
        />
      </div>
    )
  }

  // Desktop UI - Choose between integrated chat or placeholder
  if (!shouldUseMobileUI) {
    // If we have a conversationId, show the integrated chat with real Chatwoot
    if (conversationId) {
      return (
        <ChatErrorBoundary>
          <IntegratedBrokerChat
            conversationId={conversationId}
            broker={broker}
            formData={formData}
            sessionId={sessionId || ''}
            situationalInsights={situationalInsights}
            rateIntelligence={rateIntelligence}
            defenseStrategy={defenseStrategy}
            leadScore={leadScore}
          />
        </ChatErrorBoundary>
      )
    }

    // Otherwise show the placeholder UI (existing behavior)
    return (
      <SophisticatedAIBrokerUI
        formData={formData}
        sessionId={sessionId}
        situationalInsights={situationalInsights}
        rateIntelligence={rateIntelligence}
        defenseStrategy={defenseStrategy}
        leadScore={leadScore}
        isLoading={isLoading}
        onBrokerConsultation={onBrokerConsultation}
      />
    )
  }

  // This should not be reached, but keeping for safety
  return null
}

// Loading skeleton for desktop
function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

// Loading skeleton for mobile
function MobileLoadingSkeleton() {
  return (
    <div className="fixed inset-0 bg-white animate-pulse">
      <div className="h-12 bg-gray-100 border-b" />
      <div className="flex-1 p-4 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="p-4 border-t bg-gray-50">
        <div className="h-12 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}

export default ResponsiveBrokerShell