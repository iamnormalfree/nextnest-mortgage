'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Mic, Image as ImageIcon,
  Phone, ArrowLeft, TrendingUp, AlertCircle,
  CheckCircle2, Calculator, Home, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileAIAssistantCompactProps {
  leadScore?: number | null
  situationalInsights?: any
  rateIntelligence?: any
  defenseStrategy?: any
  isLoading?: boolean
  formData?: any
  sessionId?: string
  onBrokerConsultation?: () => void
}

export const MobileAIAssistantCompact: React.FC<MobileAIAssistantCompactProps> = ({
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
    { icon: Calculator, label: 'Calc', query: 'Calculate my mortgage payment' },
    { icon: TrendingUp, label: 'Rates', query: 'What are current rates?' },
    { icon: Home, label: 'Refi', query: 'Should I refinance?' },
    { icon: DollarSign, label: 'Save', query: 'How much can I save?' }
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
        content: 'Let me analyze that for you...',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
    }, 1000)
  }

  const handleQuickAction = (query: string) => {
    setInputValue(query)
    setShowQuickActions(false)
    // Auto-send the message
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages([newMessage])

    setTimeout(() => {
      const response = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'I\'ll help you with that right away.',
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
      {/* Ultra Compact Header - 40px */}
      <div className="h-10 bg-white border-b flex items-center px-3 flex-shrink-0">
        <button className="w-7 h-7 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 mx-2 flex items-center gap-2">
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-500">Active</span>
          </div>
        </div>
        <button className="w-7 h-7 flex items-center justify-center">
          <Phone className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ultra Compact Score Banner - 36px */}
      {leadScore && activeView === 'chat' && (
        <div className="h-9 bg-gradient-to-r from-amber-50 to-yellow-50 border-b px-3 flex items-center flex-shrink-0">
          <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{leadScore}%</span>
          </div>
          <div className="flex-1 mx-2">
            <p className="text-[10px] text-gray-500 leading-tight">Optimization Score</p>
            <p className="text-xs font-semibold leading-tight">Strong Position</p>
          </div>
          <div className="px-1.5 py-0.5 bg-green-100 rounded-full flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
            <span className="text-[10px] text-green-700">Ready</span>
          </div>
        </div>
      )}

      {/* Compact Tab Navigation - 32px */}
      <div className="h-8 flex border-b bg-white flex-shrink-0">
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

      {/* Content Area - Maximum space for chat */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages Area - Takes most space */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col">
                  {/* Compact Welcome - Fixed at top */}
                  <div className="text-center pt-8 pb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Home className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-sm font-semibold">Hi! How can I help?</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Ask me about your mortgage</p>
                  </div>

                  {/* Spacer to push quick actions to bottom */}
                  <div className="flex-1" />

                  {/* Ultra Compact Quick Actions - Single Row */}
                  {showQuickActions && (
                    <div className="px-2 pb-2">
                      <div className="flex gap-0.5">
                        {quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            className="flex-1 flex items-center justify-center gap-0.5 px-1 py-0.5 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
                            onClick={() => handleQuickAction(action.query)}
                          >
                            <action.icon className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />
                            <span className="text-[10px] text-gray-600">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-2">
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
                          "max-w-[80%] rounded-2xl px-3 py-1.5",
                          msg.type === 'user'
                            ? "bg-amber-400 text-white"
                            : "bg-white shadow-sm"
                        )}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'insights' && (
          <div className="px-3 py-2 space-y-2">
            {/* Ultra Compact Insight Cards */}
            <div className="bg-white rounded-md p-2.5 border border-gray-200">
              <div className="flex items-start">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 mr-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold">Time-Sensitive</h3>
                  <p className="text-[10px] text-gray-600 mt-0.5">OTP expires in 30 days</p>
                </div>
                <button className="text-[10px] text-amber-600 font-medium">Act →</button>
              </div>
            </div>

            <div className="bg-white rounded-md p-2.5 border border-gray-200">
              <div className="flex items-start">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500 mt-0.5 mr-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold">Rates: 3.85%</h3>
                  <p className="text-[10px] text-gray-600 mt-0.5">Trending down</p>
                </div>
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">↓</span>
              </div>
            </div>
          </div>
        )}

        {activeView === 'analysis' && (
          <div className="px-3 py-2 space-y-2">
            {/* Compact Analysis */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 mr-1.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Act within 30 days for best rates
              </p>
            </div>

            <div className="bg-white rounded-md p-2.5 border border-gray-200">
              <h3 className="text-xs font-semibold mb-1.5">Your Position</h3>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-600">Optimization</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onBrokerConsultation}
              className="w-full bg-amber-400 text-white rounded-md py-2 flex items-center justify-center text-xs font-medium"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Speak with Specialist
            </button>
          </div>
        )}
      </div>

      {/* Compact Input Area - 44px */}
      {activeView === 'chat' && (
        <div className="h-11 bg-white border-t flex items-center px-3 gap-2 flex-shrink-0">
          <button className="w-7 h-7 flex items-center justify-center text-gray-500" aria-label="Attach image">
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message..."
            className="flex-1 h-7 px-2.5 bg-gray-100 rounded-full text-xs outline-none focus:bg-white focus:ring-1 focus:ring-amber-400"
          />

          {inputValue ? (
            <button
              onClick={handleSend}
              className="w-7 h-7 bg-amber-400 text-white rounded-full flex items-center justify-center"
            >
              <Send className="w-3 h-3" />
            </button>
          ) : (
            <button className="w-7 h-7 flex items-center justify-center text-gray-500">
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default MobileAIAssistantCompact