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

// Using ProgressiveFormWithController for production (has working Chatwoot integration)
// TEMPORARY FIX: Use static import bypassing dynamic loading issue 
import { ProgressiveFormWithController } from '@/components/forms/ProgressiveFormWithController'

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
        <div>
          {/* Form container handles its own max-width constraints */}
          {validLoanType === 'commercial' ? (
            <CommercialQuickForm sessionId={sessionId} className="w-full" />
          ) : (
            <ProgressiveFormWithController
              loanType={validLoanType}
              sessionId={sessionId}
              onStepCompletion={handleGateCompletion}
              onAIInsight={handleAIInsight}
              onScoreUpdate={handleScoreUpdate}
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
