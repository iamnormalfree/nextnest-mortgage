'use client'

import { Suspense } from 'react'
import { IntegratedBrokerChat } from '@/components/ai-broker/IntegratedBrokerChat'

// Mock data for testing (same as mobile)
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

export default function TestDesktopChatPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div>Loading...</div>}>
        <IntegratedBrokerChat
          conversationId={12345}
          broker={{ name: 'Test Broker', id: 'test-broker-1', status: 'assigned' }}
          formData={{ name: 'Test User', email: 'test@example.com' }}
          sessionId="test-session-123"
          situationalInsights={mockData.situationalInsights}
          rateIntelligence={mockData.rateIntelligence}
          defenseStrategy={mockData.defenseStrategy}
          leadScore={mockData.leadScore}
        />
      </Suspense>
    </div>
  )
}
