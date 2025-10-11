'use client'

import React, { useState, useEffect } from 'react'

// Sophisticated icon components
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

// Animated Counter Component
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

interface AIInsight {
  type: 'rate' | 'urgency' | 'opportunity' | 'risk'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
}

interface SophisticatedLayoutProps {
  insights?: any
  rateIntelligence?: any
  leadScore?: number | null
  children: React.ReactNode
}

export function SophisticatedLayout({
  insights: situationalInsights,
  rateIntelligence,
  leadScore = 85,
  children
}: SophisticatedLayoutProps) {
  const [activeInsightTab, setActiveInsightTab] = useState('overview')

  // Sophisticated AI insights
  const insights: AIInsight[] = [
    {
      type: 'rate',
      title: 'Rate Optimization',
      description: 'Market conditions favorable',
      value: rateIntelligence?.currentBestRate || '1.35%',
      trend: 'down'
    },
    {
      type: 'urgency',
      title: 'Timing Analysis',
      description: situationalInsights?.otpAnalysis?.timeline || 'Lock-in ends in 45 days',
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

  return (
    <div className="min-h-screen bg-white">
      <div className="container">
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-60 bg-mist p-3 flex flex-col gap-3">
            {/* AI Confidence Score */}
            <div className="bg-white p-3 border border-fog">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-silver mb-1">AI Confidence Score</div>
                  <div className="text-2xl font-mono text-gold">
                    <AnimatedCounter end={leadScore || 70} suffix="%" duration={1500} />
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-emerald text-white">
                  LIVE
                </span>
              </div>
              <div className="h-1 bg-fog relative">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{ width: `${leadScore || 70}%` }}
                />
              </div>
            </div>

            {/* Compact Tabs */}
            <div className="flex text-xs">
              {['Overview', 'Analysis', 'Action'].map((tab) => (
                <button
                  key={tab}
                  className={`px-2 py-1 text-xs font-medium flex-1 ${
                    activeInsightTab === tab.toLowerCase()
                      ? 'bg-white border-b border-gold'
                      : 'text-silver hover:text-ink'
                  }`}
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

            {/* Analysis Tab Content */}
            {activeInsightTab === 'analysis' && (
              <div className="space-y-2">
                <div className="bg-white p-2 border border-fog">
                  <div className="text-xs font-medium text-ink mb-1">Market Analysis</div>
                  <div className="text-xs text-silver">
                    Based on current trends and your profile, we recommend acting within the next 30-60 days.
                  </div>
                </div>
                {situationalInsights?.otpAnalysis?.keyFactors && (
                  <div className="bg-white p-2 border border-fog">
                    <div className="text-xs font-medium text-ink mb-1">Key Factors</div>
                    <ul className="text-xs text-silver space-y-1">
                      {situationalInsights.otpAnalysis.keyFactors.slice(0, 3).map((factor: string, i: number) => (
                        <li key={i}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Tab Content */}
            {activeInsightTab === 'action' && (
              <div className="space-y-2">
                <div className="bg-white p-2 border border-fog">
                  <div className="text-xs font-medium text-ink mb-1">Next Steps</div>
                  <ul className="text-xs text-silver space-y-1">
                    <li>• Schedule consultation</li>
                    <li>• Prepare documents</li>
                    <li>• Get pre-approval</li>
                  </ul>
                </div>
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

            {/* Children - This is where the chat interface will go */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}