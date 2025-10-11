'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Clock, DollarSign, Activity } from 'lucide-react'

interface InsightsSidebarProps {
  className?: string
}

export const InsightsSidebar: React.FC<InsightsSidebarProps> = ({ className = '' }) => {
  const [confidenceScore, setConfidenceScore] = useState<number>(70)
  const [activeSection, setActiveSection] = useState<string>('overview')

  useEffect(() => {
    // Get confidence score from sessionStorage
    const leadScore = sessionStorage.getItem('lead_score')
    if (leadScore) {
      // Convert lead score (0-100) to confidence percentage
      const score = parseInt(leadScore)
      setConfidenceScore(Math.max(70, Math.min(95, score))) // Cap between 70-95%
    }
  }, [])

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'action', label: 'Action' }
  ]

  const insights = [
    {
      title: 'Rate Optimization',
      icon: TrendingUp,
      value: '1.33%',
      label: 'Potential Savings',
      color: 'text-emerald'
    },
    {
      title: 'Timing Analysis',
      icon: Clock,
      value: '45 days',
      label: 'Optimal Window',
      color: 'text-gold'
    },
    {
      title: 'Savings Potential',
      icon: DollarSign,
      value: '$34,560',
      label: 'Lifetime Savings',
      color: 'text-emerald'
    }
  ]

  return (
    <div className={`p-4 ${className}`}>
      {/* AI Confidence Score Card */}
      <div className="bg-white border border-fog p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-silver font-medium">
            AI Confidence Score
          </h3>
          <span className="text-xs bg-gold text-ink px-2 py-1 font-medium">
            LIVE
          </span>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-mono font-medium text-ink">
            {confidenceScore}%
          </div>
          <div className="w-full h-2 bg-fog">
            <div
              className="h-full bg-gold transition-all duration-200"
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
          <p className="text-xs text-graphite">
            Based on {286} packages analyzed
          </p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border border-fog mb-4">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-200
              ${activeSection === section.id
                ? 'bg-mist text-ink border-l-2 border-gold'
                : 'text-graphite hover:bg-mist'
              }
            `}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div key={index} className="bg-white border border-fog p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-mist flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs uppercase tracking-wider text-silver font-medium mb-1">
                    {insight.title}
                  </h4>
                  <div className={`text-xl font-mono font-medium ${insight.color} mb-1`}>
                    {insight.value}
                  </div>
                  <p className="text-xs text-graphite">
                    {insight.label}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity Indicator */}
      <div className="mt-4 p-3 bg-mist border border-fog">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold" />
          <span className="text-xs text-graphite">
            Real-time analysis active
          </span>
        </div>
      </div>
    </div>
  )
}

export default InsightsSidebar