/**
 * Dedicated Form Page at /apply
 * Renders only the Progressive Form with minimal header
 * Accepts loanType query parameter for prefilling
 */

'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { LoanType } from '@/components/forms/SimpleLoanTypeSelector'
import { useLoanApplicationContext } from '@/lib/hooks/useLoanApplicationContext'

// Dynamic import for better performance
const ProgressiveForm = dynamic(
  () => import('@/components/forms/ProgressiveForm').then(mod => ({ default: mod.ProgressiveForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-gold motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-silver">Loading application form...</p>
          </div>
        </div>
      </div>
    )
  }
)

// Dynamic import for commercial direct-to-broker form
const CommercialQuickForm = dynamic(
  () => import('@/components/forms/CommercialQuickForm'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-silver">Loading...</div>
      </div>
    )
  }
)

// Type guard to validate loan type from query
function isValidLoanType(value: string | null): value is LoanType {
  return value === 'new_purchase' || value === 'refinance' || value === 'commercial'
}

// Inner component that uses search params
function ApplyPageContent() {
  const searchParams = useSearchParams()
  const { data, updateStepData, setInsights } = useLoanApplicationContext()

  const loanTypeParam = searchParams.get('loanType')
  const validLoanType = isValidLoanType(loanTypeParam) ? loanTypeParam : 'new_purchase'

  // Check for debug mode
  const debugParam = searchParams.get('debug')
  const showDiagnostics = debugParam === '1' || debugParam === 'true'

  const [sessionId] = useState(data.sessionId)
  const [aiInsights, setAIInsights] = useState<any>(null)
  const [leadScore, setLeadScore] = useState<any>(null)

  const handleGateCompletion = (gate: number, gateData: any) => {
    console.log(`Gate ${gate} completed with data:`, gateData)

    // Update context with gate data
    updateStepData(gate, gateData)

    // The ProgressiveForm component will handle the ChatTransitionScreen
    // No need to redirect or create Chatwoot here
  }

  const handleAIInsight = (insight: any) => {
    setAIInsights(insight)
    setInsights(insight, leadScore)
  }

  const handleScoreUpdate = (score: any) => {
    setLeadScore(score)
    setInsights(aiInsights, score)
  }

  return (
    <>
      {/* Main content - form only (header comes from ConditionalNav in layout) */}
      <main className="min-h-screen bg-mist">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
          {/* Form container with compact desktop mode support */}
          {validLoanType === 'commercial' ? (
            <CommercialQuickForm sessionId={sessionId} className="w-full" />
          ) : (
            <ProgressiveForm
              loanType={validLoanType}
              sessionId={sessionId}
              onGateCompletion={handleGateCompletion}
              onAIInsight={handleAIInsight}
              onScoreUpdate={handleScoreUpdate}
              className="w-full"
            />
          )}
        </div>
      </main>
    </>
  )
}

// Main page component with Suspense boundary
export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-silver">Loading...</div>
      </div>
    }>
      <ApplyPageContent />
    </Suspense>
  )
}