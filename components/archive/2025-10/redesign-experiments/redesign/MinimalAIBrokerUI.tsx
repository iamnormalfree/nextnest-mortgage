'use client'

import React, { useState } from 'react'

// Minimal icon components
const SendIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
)

const SparkleIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <path d="M12 2L14.09 8.26L20.18 8.27L15.04 11.97L17.13 18.24L12 14.54L6.87 18.24L8.96 11.97L3.82 8.27L9.91 8.26L12 2Z"></path>
  </svg>
)

const AlertIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)

interface Message {
  id: string
  role: 'user' | 'broker'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    urgency?: 'high' | 'medium' | 'low'
  }
}

interface AIInsight {
  type: 'rate' | 'urgency' | 'opportunity'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export default function MinimalAIBrokerUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'broker',
      content: 'Hello! I\'ve analyzed your mortgage profile. Based on your situation, I see some immediate opportunities to optimize your rates.',
      timestamp: new Date(),
      metadata: { confidence: 0.95 }
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Sample AI insights
  const insights: AIInsight[] = [
    {
      type: 'rate',
      title: 'Rate Optimization',
      description: 'Current market conditions favor refinancing',
      priority: 'high'
    },
    {
      type: 'urgency',
      title: 'Time Sensitive',
      description: 'Lock-in period ends in 45 days',
      priority: 'medium'
    },
    {
      type: 'opportunity',
      title: 'Savings Potential',
      description: '$34,560 over loan tenure',
      priority: 'high'
    }
  ]

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate broker response
    setTimeout(() => {
      const brokerMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'broker',
        content: 'I understand your concern. Let me analyze the best options for you based on current market rates and your profile.',
        timestamp: new Date(),
        metadata: { confidence: 0.92 }
      }
      setMessages(prev => [...prev, brokerMessage])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div className="grid" style={{ gridTemplateColumns: '300px 1fr', gap: 'var(--space-lg)', height: '100vh', paddingTop: 'var(--space-3xl)' }}>

          {/* Left Sidebar - AI Insights */}
          <div className="flex flex-col gap-lg">
            <div>
              <h3 className="heading-2xl font-body font-semibold text-graphite mb-md">
                AI Analysis
              </h3>

              {/* Lead Score */}
              <div className="card p-md mb-md">
                <div className="text-xs text-stone mb-xs">Lead Score</div>
                <div className="heading-4xl font-display text-black">85%</div>
                <div className="text-xs text-stone">High conversion probability</div>
              </div>

              {/* Insights */}
              <div className="space-y-sm">
                {insights.map((insight, index) => (
                  <div key={index} className="p-sm border border-mist">
                    <div className="flex items-start gap-sm">
                      <div className={`mt-xs ${
                        insight.priority === 'high' ? 'text-accent' : 'text-stone'
                      }`}>
                        {insight.type === 'urgency' ? <AlertIcon /> : <SparkleIcon />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-graphite">
                          {insight.title}
                        </div>
                        <div className="text-xs text-stone mt-xs">
                          {insight.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-sm font-semibold text-graphite mb-sm">
                Suggested Actions
              </h4>
              <div className="space-y-xs">
                <button className="w-full text-left text-sm text-accent py-xs">
                  → Calculate exact savings
                </button>
                <button className="w-full text-left text-sm text-accent py-xs">
                  → Compare all 286 packages
                </button>
                <button className="w-full text-left text-sm text-accent py-xs">
                  → Schedule consultation
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="flex flex-col" style={{ height: 'calc(100vh - var(--space-3xl))' }}>
            {/* Chat Header */}
            <div className="border-b border-mist pb-md mb-lg">
              <h2 className="heading-3xl font-display text-black">
                AI Mortgage Advisor
              </h2>
              <p className="text-sm text-stone mt-xs">
                Analyzing 286 packages in real-time
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-lg" style={{ minHeight: 0 }}>
              <div className="space-y-md">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-lg ${
                      message.role === 'user'
                        ? 'bg-black text-white p-md'
                        : 'border border-mist p-md'
                    }`}>
                      <p className="text-sm" style={{ lineHeight: '1.6' }}>
                        {message.content}
                      </p>
                      {message.metadata?.confidence && (
                        <div className="text-xs opacity-70 mt-sm">
                          Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="border border-mist p-md">
                      <div className="flex gap-xs">
                        <div className="w-2 h-2 bg-stone rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-stone rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-stone rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-mist pt-md">
              <div className="flex gap-sm">
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="Ask about rates, savings, or timeline..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="btn btn-primary"
                  disabled={!inputValue.trim()}
                >
                  <SendIcon />
                </button>
              </div>
              <p className="text-xs text-stone mt-sm">
                AI analyzes market data in real-time to provide accurate recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}