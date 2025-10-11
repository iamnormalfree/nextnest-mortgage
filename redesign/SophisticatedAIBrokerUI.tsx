'use client'

import React, { useState, useEffect } from 'react'

// Sophisticated icon components - 16px for consistency with design principles
const SendIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
)

const SparkleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L14.09 8.26L20.18 8.27L15.04 11.97L17.13 18.24L12 14.54L6.87 18.24L8.96 11.97L3.82 8.27L9.91 8.26L12 2Z"></path>
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

interface Message {
  id: string
  role: 'user' | 'broker'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    dataPoints?: string[]
  }
}

interface AIInsight {
  type: 'rate' | 'urgency' | 'opportunity' | 'risk'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
}

// Animated Counter Component (typed)
type CounterProps = { end: number; duration?: number; prefix?: string; suffix?: string }
const AnimatedCounter: React.FC<CounterProps> = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | undefined
    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return (
    <span className="font-mono">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

interface SophisticatedAIBrokerUIProps {
  formData?: any
  sessionId?: string
  situationalInsights?: any
  rateIntelligence?: any
  defenseStrategy?: any
  leadScore?: number | null
  isLoading?: boolean
  onBrokerConsultation?: () => void
}

export default function SophisticatedAIBrokerUI({
  formData,
  sessionId,
  situationalInsights,
  rateIntelligence,
  defenseStrategy,
  leadScore = 85,
  isLoading = false,
  onBrokerConsultation
}: SophisticatedAIBrokerUIProps = {}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'broker',
      content: 'Hello! I\'ve completed a real-time analysis of your mortgage profile against 286 packages. I found several optimization opportunities that could save you thousands.',
      timestamp: new Date(),
      metadata: {
        confidence: 0.95,
        dataPoints: ['286 packages analyzed', '23 banks compared', '3 optimal matches']
      }
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeInsightTab, setActiveInsightTab] = useState('overview')

  // Sophisticated AI insights
  const insights: AIInsight[] = [
    {
      type: 'rate',
      title: 'Rate Optimization',
      description: 'Market conditions favorable',
      value: '1.35%',
      trend: 'down'
    },
    {
      type: 'urgency',
      title: 'Timing Analysis',
      description: 'Lock-in ends in 45 days',
      value: '45d',
      trend: 'stable'
    },
    {
      type: 'opportunity',
      title: 'Savings Potential',
      description: 'Lifetime optimization',
      value: '$34.5K',
      trend: 'up'
    },
    {
      type: 'risk',
      title: 'Risk Assessment',
      description: 'Interest rate forecast',
      value: 'Low',
      trend: 'stable'
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

    // Simulate sophisticated broker response
    setTimeout(() => {
      const brokerMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'broker',
        content: 'Based on my analysis of current market conditions and your specific profile, I can see three strategic options for you. Let me break down the numbers and timing considerations.',
        timestamp: new Date(),
        metadata: {
          confidence: 0.92,
          dataPoints: ['Real-time rates', 'Predictive modeling', 'Risk analysis']
        }
      }
      setMessages(prev => [...prev, brokerMessage])
      setIsTyping(false)
    }, 1800)
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container">
        <div className="flex">
        <div className="w-60 bg-mist p-3 flex flex-col gap-3">
          {/* AI Confidence Score - Compact */}
          <div className="bg-white p-3 border border-fog">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-xs text-silver mb-1">AI Confidence Score</div>
                <div className="text-2xl font-mono text-gold">
                  <AnimatedCounter end={70} suffix="%" duration={1500} />
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-emerald text-white">
                LIVE
              </span>
            </div>
            <div className="h-1 bg-fog relative">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500"
                style={{ width: '70%' }}
              />
            </div>
          </div>

          {/* Compact Tabs */}
          <div className="flex text-xs">
            {['Overview', 'Analysis', 'Action'].map((tab) => (
              <button
                key={tab}
                className={`px-2 py-1 text-xs font-medium flex-1 ${activeInsightTab === tab.toLowerCase() ? 'bg-white border-b border-gold' : 'text-silver hover:text-ink'}`}
                onClick={() => setActiveInsightTab(tab.toLowerCase())}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Compact Insights Cards */}
          {activeInsightTab === 'overview' && (
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="bg-white p-2 border border-fog">
                  <div className="flex items-center gap-2 mb-1">
                    {insight.type === 'rate' && <TrendingUpIcon />}
                    {insight.type === 'urgency' && <ClockIcon />}
                    {insight.type === 'opportunity' && <SparkleIcon />}
                    {insight.type === 'risk' && <ShieldIcon />}
                    <span className="text-xs font-medium text-ink">{insight.title}</span>
                  </div>
                  <div className="text-xs text-silver mb-1">{insight.description}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-gold">{insight.value}</span>
                    {insight.trend && (
                      <span className={`text-xs ${
                        insight.trend === 'up' ? 'text-emerald' :
                        insight.trend === 'down' ? 'text-ruby' : 'text-silver'
                      }`}>
                        {insight.trend === 'up' ? '↑' : insight.trend === 'down' ? '↓' : '→'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compact Market Pulse */}
          <div className="bg-ink text-white p-3 mt-auto">
            <div className="text-xs font-medium mb-2">Market Pulse</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>SIBOR</span>
                <span className="font-mono">3.84%</span>
              </div>
              <div className="flex justify-between">
                <span>SORA</span>
                <span className="font-mono">3.52%</span>
              </div>
              <div className="flex justify-between">
                <span>Fixed</span>
                <span className="font-mono">2.85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Compact Header */}
          <div className="p-4 border-b border-fog">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1 className="text-2xl font-light text-gold mb-1">AI Mortgage Advisor</h1>
                <p className="text-xs text-silver">Powered by GPT-4 • Analyzing 286 packages in real-time</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-silver">
                <SparkleIcon />
                <span>AI ENHANCED</span>
              </div>
            </div>
            
            {/* Compact Statistics Bar */}
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-xl font-mono text-ink">286</div>
                <div className="text-xs text-silver">PACKAGES ANALYZED</div>
              </div>
              <div>
                <div className="text-xl font-mono text-ink">23</div>
                <div className="text-xs text-silver">BANKS COMPARED</div>
              </div>
              <div>
                <div className="text-xl font-mono text-ink">3</div>
                <div className="text-xs text-silver">OPTIMAL MATCHES</div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-ink text-white'
                      : 'bg-mist text-ink'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    {message.metadata && (
                      <>
                        {message.metadata.confidence && (
                          <div className="text-xs opacity-70 mt-2">
                            Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                          </div>
                        )}
                        {message.metadata.dataPoints && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {message.metadata.dataPoints.map((point, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-gold text-ink">
                                {point}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-mist p-3">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-silver">AI is analyzing</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-gold animate-pulse"></div>
                        <div className="w-1 h-1 bg-gold animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-gold animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Input Area */}
          <div className="p-4 border-t border-fog bg-white">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 text-sm border border-fog focus:outline-none focus:border-gold"
                placeholder="Ask about rates, savings, timing, or market conditions..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-gold text-ink hover:bg-yellow-500 transition-all duration-200"
                disabled={!inputValue.trim()}
              >
                <SendIcon />
              </button>
            </div>

            {/* Compact Quick Actions */}
            <div className="flex gap-2">
              {['Current rates?', 'Best time to refinance?', 'Calculate savings'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputValue(prompt)}
                  className="px-2 py-1 text-xs border border-fog hover:bg-mist transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}