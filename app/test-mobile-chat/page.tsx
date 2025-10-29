'use client'

import { Suspense } from 'react'
import { MobileAIAssistantCompact } from '@/components/ai-broker/MobileAIAssistantCompact'

// Mock data for testing
const mockData = {
  situationalInsights: {
    otpAnalysis: {
      urgencyLevel: 'high' as const,
      keyFactors: ['Lock-in ending soon', 'Market rates favorable'],
      recommendations: ['Refinance to fixed rate', 'Consider 3-year lock-in'],
      timeline: 'Complete within 4 weeks'
    },
    overallRecommendation: 'Refinancing recommended based on current market conditions'
  },
  rateIntelligence: {
    marketPhase: 'Stabilizing',
    timingRecommendation: 'Lock in rates now before next Fed decision',
    keyInsights: ['Rates expected to stabilize', 'Good time to lock in']
  },
  defenseStrategy: {
    primaryFocus: 'Secure favorable fixed rate',
    nextActions: ['Submit refinancing application', 'Compare bank offers']
  },
  leadScore: 85
}

export default function TestMobileChatPage() {
  return (
    <div className="fixed inset-0 bg-white">
      {/* Force mobile viewport for testing */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />

      <Suspense fallback={<div>Loading...</div>}>
        <MobileAIAssistantCompact
          situationalInsights={mockData.situationalInsights}
          rateIntelligence={mockData.rateIntelligence}
          defenseStrategy={mockData.defenseStrategy}
          leadScore={mockData.leadScore}
          isLoading={false}
          formData={{ name: 'Test User', email: 'test@example.com' }}
          sessionId="test-session-123"
        />
      </Suspense>
    </div>
  )
}
