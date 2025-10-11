'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Clock, DollarSign } from 'lucide-react'

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
      color: 'text-ink'
    },
    {
      title: 'Timing Analysis',
      icon: Clock,
      value: '45 days',
      label: 'Optimal Window',
      color: 'text-ink'
    },
    {
      title: 'Savings Potential',
      icon: DollarSign,
      value: '$34,560',
      label: 'Lifetime Savings',
      color: 'text-ink'
    }
  ]

  return (
    <div className={`h-full ${className}`}>
      <div className="p-4">
        {/* AI Confidence Score */}
        <div className="pb-3 mb-3 border-b border-fog">
          <div className="text-xs uppercase tracking-wider text-silver font-medium">
            AI Confidence Score
          </div>
          <div className="text-2xl font-mono font-light text-ink mt-1">
            {confidenceScore}%
          </div>
          <div className="w-full h-1 bg-fog mt-2">
            <div
              className="h-full bg-gold transition-all duration-200"
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
          <p className="text-xs text-silver mt-1">
            Based on 286 packages analyzed
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex mb-3 border-b border-fog">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex-1 pb-2 text-xs uppercase tracking-wider transition-colors duration-200
                ${activeSection === section.id
                  ? 'text-ink border-b-2 border-gold'
                  : 'text-silver hover:text-graphite'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Insight Cards */}
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="border-l-2 border-fog pl-3 py-2">
              <div className="text-xs uppercase tracking-wider text-silver">
                {insight.title}
              </div>
              <div className="text-lg font-mono font-light text-ink">
                {insight.value}
              </div>
              <p className="text-xs text-silver">
                {insight.label}
              </p>
            </div>
          ))}
        </div>


        {/* Market Pulse */}
        <div className="mt-4 pt-3 border-t border-fog">
          <div className="text-xs uppercase tracking-wider text-silver mb-2">Market Pulse</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-silver">SIBOR</span>
              <span className="font-mono text-ink">3.84%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-silver">SORA</span>
              <span className="font-mono text-ink">3.52%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-silver">Fixed</span>
              <span className="font-mono text-ink">2.85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsightsSidebar