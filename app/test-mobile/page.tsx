'use client'

import React, { useState } from 'react'
import { SimpleMobileChatUI } from '@/components/ai-broker/SimpleMobileChatUI'
import { MobileChatUI } from '@/components/ai-broker/MobileChatUI'
import { MobileChatUIFixed } from '@/components/ai-broker/MobileChatUIFixed'
import { MobileAIAssistant } from '@/components/ai-broker/MobileAIAssistant'
import { MobileAIAssistantFixed } from '@/components/ai-broker/MobileAIAssistantFixed'
import { MobileAIAssistantCompact } from '@/components/ai-broker/MobileAIAssistantCompact'
import { MobileAIBrokerUI } from '@/components/ai-broker'
import './mobile.css'

export default function TestMobilePage() {
  const [mobileUIType, setMobileUIType] = useState<'simple' | 'chat' | 'chat-fixed' | 'assistant' | 'assistant-fixed' | 'assistant-compact' | 'original'>('assistant-compact')
  const [showData, setShowData] = useState(true)

  const sampleInsights = {
    otpAnalysis: {
      urgencyLevel: 'high' as const,
      keyFactors: ['OTP expiring soon'],
      recommendations: ['Act now'],
      timeline: 'Within 30 days'
    },
    overallRecommendation: 'Time to refinance'
  }

  return (
    <>
      {/* Fixed Controls at Top */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 z-50 flex items-center gap-2">
        <select
          value={mobileUIType}
          onChange={(e) => setMobileUIType(e.target.value as any)}
          className="px-2 py-1 text-xs bg-gray-700 rounded"
        >
          <option value="simple">Simple Chat</option>
          <option value="assistant-compact">AI Assistant Compact</option>
          <option value="assistant-fixed">AI Assistant Fixed</option>
          <option value="chat-fixed">Chat UI Fixed</option>
          <option value="chat">Chat UI Original</option>
          <option value="assistant">AI Assistant Original</option>
          <option value="original">Original Broker</option>
        </select>
        <button
          onClick={() => setShowData(!showData)}
          className="px-2 py-1 text-xs bg-gray-700 rounded"
        >
          {showData ? 'Hide' : 'Show'} Data
        </button>
        <span className="ml-auto text-xs opacity-75">360px viewport</span>
      </div>

      {/* Full Screen Mobile UI - NO MARGINS */}
      <div className="fixed inset-0 top-10">
        {mobileUIType === 'simple' && (
          <SimpleMobileChatUI />
        )}
        {mobileUIType === 'chat-fixed' && (
          <MobileChatUIFixed
            agentName="AI Mortgage Advisor"
            agentStatus="online"
            leadScore={showData ? 85 : null}
            onSendMessage={(msg) => console.log(msg)}
          />
        )}
        {mobileUIType === 'chat' && (
          <MobileChatUI
            agentName="AI Mortgage Advisor"
            agentStatus="online"
            leadScore={showData ? 85 : null}
            onSendMessage={(msg) => console.log(msg)}
          />
        )}
        {mobileUIType === 'assistant' && (
          <MobileAIAssistant
            leadScore={showData ? 85 : null}
            situationalInsights={showData ? sampleInsights : null}
            onBrokerConsultation={() => console.log('Broker consultation')}
          />
        )}
        {mobileUIType === 'assistant-fixed' && (
          <MobileAIAssistantFixed
            leadScore={showData ? 85 : null}
            situationalInsights={showData ? sampleInsights : null}
            onBrokerConsultation={() => console.log('Broker consultation')}
          />
        )}
        {mobileUIType === 'assistant-compact' && (
          <MobileAIAssistantCompact
            leadScore={showData ? 85 : null}
            situationalInsights={showData ? sampleInsights : null}
            onBrokerConsultation={() => console.log('Broker consultation')}
          />
        )}
        {mobileUIType === 'original' && (
          <MobileAIBrokerUI
            leadScore={showData ? 85 : null}
            situationalInsights={showData ? sampleInsights : null}
            onBrokerConsultation={() => console.log('Broker consultation')}
          />
        )}
      </div>
    </>
  )
}