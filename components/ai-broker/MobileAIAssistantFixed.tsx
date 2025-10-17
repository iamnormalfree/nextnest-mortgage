'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Mic, Image as ImageIcon, MoreHorizontal,
  Phone, ArrowLeft, Star, TrendingUp, AlertCircle,
  CheckCircle2, Clock, DollarSign, Home, Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileAIAssistantFixedProps {
  leadScore?: number | null
  situationalInsights?: any
  rateIntelligence?: any
  onBrokerConsultation?: () => void
}

export const MobileAIAssistantFixed: React.FC<MobileAIAssistantFixedProps> = ({
  leadScore = 85,
  situationalInsights,
  rateIntelligence,
  onBrokerConsultation
}) => {
  const [activeView, setActiveView] = useState<'chat' | 'insights' | 'analysis'>('chat')
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions = [
    { icon: Calculator, label: 'Calc' },
    { icon: TrendingUp, label: 'Rates' },
    { icon: Home, label: 'Refi' },
    { icon: DollarSign, label: 'Save' }
  ]

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setShowQuickActions(false)

    // Simulate response
    setTimeout(() => {
      const response = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'I\'ll analyze that for you right away.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
    }, 1000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Compact Header - 44px */}
      <div className="h-11 bg-white border-b flex items-center px-3 flex-shrink-0">
        <button className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 mx-2">
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600">Active</span>
          </div>
        </div>
        <button className="w-8 h-8 flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Score Banner - 48px (1/3 of original) */}
      {leadScore && activeView === 'chat' && (
        <div className="h-12 bg-gradient-to-r from-yellow-50 to-amber-50 border-b px-3 flex items-center flex-shrink-0">
          <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{leadScore}%</span>
          </div>
          <div className="flex-1 mx-2">
            <p className="text-xs text-gray-600">Optimization Score</p>
            <p className="text-xs font-semibold">Strong Position</p>
          </div>
          <div className="px-2 py-0.5 bg-green-100 rounded-full">
            <span className="text-xs text-green-700 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation - 36px */}
      <div className="h-9 flex border-b bg-white flex-shrink-0">
        {['chat', 'insights', 'analysis'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view as any)}
            className={cn(
              "flex-1 text-xs font-medium capitalize",
              "border-b-2 transition-colors",
              activeView === view
                ? "border-amber-400 text-amber-600 bg-amber-50"
                : "border-transparent text-gray-600"
            )}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {messages.length === 0 ? (
                <>
                  {/* Welcome Section - Fixed at top */}
                  <div className="text-center pt-6 pb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Home className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-sm font-semibold mb-1">Welcome!</h2>
                    <p className="text-xs text-gray-600">
                      How can I help with your mortgage?
                    </p>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />
                </>
              ) : (
                <div className="flex-1 overflow-y-auto px-3 py-3">
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.type === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2",
                          msg.type === 'user'
                            ? "bg-amber-400 text-white"
                            : "bg-white shadow-sm"
                        )}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

              {/* Ultra Compact Quick Actions - Single Row */}
              {showQuickActions && messages.length === 0 && (
                <div className="px-2 pb-2">
                  <div className="flex gap-0.5 justify-center">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        className="flex-1 flex items-center justify-center gap-0.5 px-1 py-1 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
                        onClick={() => setInputValue(action.label)}
                      >
                        <action.icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-[10px] text-gray-700 truncate">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'insights' && (
          <div className="px-3 py-3 space-y-2">
            {/* Compact Insight Cards */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Time-Sensitive</h3>
                  <p className="text-xs text-gray-600 mt-0.5">OTP expiring in 30 days</p>
                  <button className="text-xs text-amber-600 font-medium mt-1">Act Now →</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-start">
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Rate Outlook</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Fixed rates at 3.85%</p>
                  <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                    ↓ trending down
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-start">
                <Star className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Savings Potential</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Could save $450/mo</p>
                  <button className="text-xs text-amber-600 font-medium mt-1">Calculate →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'analysis' && (
          <div className="px-3 py-3 space-y-3">
            {/* Compact Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                Market conditions favor action within 30 days
              </p>
            </div>

            {/* Compact Analysis Card */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h3 className="text-sm font-semibold mb-2">Your Position</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Optimization</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Market Timing</span>
                    <span className="font-semibold">Good</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400" style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact CTA Button */}
            <button
              onClick={onBrokerConsultation}
              className="w-full bg-amber-400 text-white rounded-lg py-2.5 flex items-center justify-center text-sm font-medium"
            >
              <Phone className="w-4 h-4 mr-2" />
              Speak with Specialist
            </button>
          </div>
        )}
      </div>

      {/* Input Area - Only show in chat view - 48px */}
      {activeView === 'chat' && (
        <div className="h-12 bg-white border-t flex items-center px-3 gap-2 flex-shrink-0">
          <button className="w-8 h-8 flex items-center justify-center text-gray-500" aria-label="Attach image">
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about mortgage..."
            className="flex-1 h-8 px-3 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-1 focus:ring-amber-400"
          />

          {inputValue ? (
            <button
              onClick={handleSend}
              className="w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button className="w-8 h-8 flex items-center justify-center text-gray-500">
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default MobileAIAssistantFixed