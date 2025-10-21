'use client'

// ABOUTME: QA test page for CustomChatInterface mobile/desktop validation
// Provides viewport controls and conversation ID for comprehensive testing

import React, { useState } from 'react'
import CustomChatInterface from '@/components/chat/CustomChatInterface'

export default function ChatQATestPage() {
  const [conversationId] = useState(280) // Default test conversation ID
  const [viewport, setViewport] = useState('390px')

  const viewports = [
    { name: 'iPhone SE', width: '320px' },
    { name: 'Galaxy S9', width: '360px' },
    { name: 'iPhone 12/13', width: '390px' },
    { name: 'iPad', width: '768px' },
    { name: 'Desktop', width: '1024px' },
    { name: 'Full', width: '100%' }
  ]

  return (
    <div className="min-h-screen bg-graphite">
      {/* Fixed Controls at Top */}
      <div className="fixed top-0 left-0 right-0 bg-ink text-white p-3 z-50 flex items-center gap-3 border-b border-fog">
        <span className="text-sm font-medium">Viewport:</span>
        <select
          value={viewport}
          onChange={(e) => setViewport(e.target.value)}
          className="px-3 py-1.5 text-sm bg-graphite text-white border border-fog rounded focus:border-gold focus:outline-none"
        >
          {viewports.map(v => (
            <option key={v.width} value={v.width}>
              {v.name} ({v.width})
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm opacity-75">
          Conversation ID: {conversationId}
        </span>
        <span className="text-xs opacity-50 ml-2">
          QA Test Mode
        </span>
      </div>

      {/* Chat Interface Container */}
      <div className="pt-14 flex justify-center items-center min-h-screen p-4">
        <div
          className="bg-white shadow-lg border border-fog"
          style={{
            width: viewport === '100%' ? '100%' : viewport,
            maxWidth: viewport === '100%' ? '1200px' : viewport,
            height: '600px'
          }}
        >
          <CustomChatInterface
            conversationId={conversationId}
            contactName="Test User"
            contactEmail="test@example.com"
            brokerName="AI Broker"
          />
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="fixed bottom-0 left-0 right-0 bg-ink text-white p-3 border-t border-fog">
        <div className="text-xs opacity-75 space-y-1">
          <p><strong>Test Cases:</strong> Input visible • Send accessible • Quick actions scroll • No overflow • Typing indicator • Auto-scroll • Polling (3s) • Error state • Optimistic UI • Persistence</p>
          <p><strong>How to test:</strong> 1) Select viewport 2) Send test messages 3) Wait for AI responses 4) Verify UI behavior 5) Check console for errors</p>
        </div>
      </div>
    </div>
  )
}
