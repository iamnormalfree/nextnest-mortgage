'use client'

/**
 * ABOUTME: Test page for CustomChatInterface component
 * ABOUTME: Tests desktop and mobile breakpoints with real conversation data
 */

import React, { useState } from 'react'
import CustomChatInterface from '@/components/chat/CustomChatInterface'

export default function TestChatInterfacePage() {
  const [viewport, setViewport] = useState<'mobile-320' | 'mobile-360' | 'mobile-390' | 'tablet' | 'desktop'>('mobile-360')
  const [conversationId] = useState(280) // Use existing test conversation

  const viewportSizes = {
    'mobile-320': '320px',
    'mobile-360': '360px',
    'mobile-390': '390px',
    'tablet': '768px',
    'desktop': '1024px',
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Controls */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <h1 className="text-xl font-bold mb-4">CustomChatInterface Test</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setViewport('mobile-320')}
            className={`px-4 py-2 rounded ${viewport === 'mobile-320' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Mobile 320px
          </button>
          <button
            onClick={() => setViewport('mobile-360')}
            className={`px-4 py-2 rounded ${viewport === 'mobile-360' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Mobile 360px
          </button>
          <button
            onClick={() => setViewport('mobile-390')}
            className={`px-4 py-2 rounded ${viewport === 'mobile-390' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Mobile 390px
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-4 py-2 rounded ${viewport === 'tablet' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Tablet 768px
          </button>
          <button
            onClick={() => setViewport('desktop')}
            className={`px-4 py-2 rounded ${viewport === 'desktop' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Desktop 1024px
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Current Viewport:</strong> {viewportSizes[viewport]}</p>
          <p><strong>Conversation ID:</strong> {conversationId}</p>
          <p><strong>Test Instructions:</strong></p>
          <ul className="list-disc list-inside ml-4 mt-2">
            <li>Test message sending and receiving</li>
            <li>Verify typing indicators appear</li>
            <li>Check polling (messages update every 3s)</li>
            <li>Confirm no console errors</li>
            <li>Validate layout at all breakpoints</li>
          </ul>
        </div>
      </div>

      {/* Chat Interface Container */}
      <div className="flex justify-center">
        <div
          style={{ width: viewportSizes[viewport], maxWidth: '100%' }}
          className="border-4 border-gray-300 rounded-lg shadow-lg bg-white overflow-hidden"
        >
          {/* Height: 667px simulates iPhone SE viewport height */}
          <div style={{ height: '667px' }}>
            <CustomChatInterface
              conversationId={conversationId}
              contactName="Test User"
              contactEmail="test@example.com"
              brokerName="Rachel Tan"
            />
          </div>
        </div>
      </div>

      {/* QA Checklist */}
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">QA Checklist</h2>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Messages render correctly on all viewports</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Typing indicator appears when sending message</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Polling works (check console for "Fetched messages")</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Input field accessible and usable on mobile</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Send button works on mobile</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>No console errors or warnings</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Messages scroll properly</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Quick action buttons render on mobile</span>
          </label>
        </div>
      </div>
    </div>
  )
}
