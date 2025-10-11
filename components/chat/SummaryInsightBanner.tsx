'use client'

import React from 'react'

interface SummaryInsightBannerProps {
  summary?: string
  packagesAnalyzed?: number
  banksCompared?: number
  optimalMatches?: number
  className?: string
}

export const SummaryInsightBanner: React.FC<SummaryInsightBannerProps> = ({
  summary = "Based on our comprehensive analysis of the current market rates and your financial profile, we've identified 3 optimal mortgage packages that could save you significant amounts over your loan tenure. The best option offers a rate of 1.33% with minimal lock-in restrictions.",
  packagesAnalyzed = 286,
  banksCompared = 23,
  optimalMatches = 3,
  className = ''
}) => {
  const highlights = [
    { label: `${packagesAnalyzed} packages`, key: 'packages' },
    { label: `${banksCompared} banks`, key: 'banks' },
    { label: `${optimalMatches} matches`, key: 'matches' }
  ]

  return (
    <div className={`bg-mist border border-fog p-6 mb-3 ${className}`}>
      <div className="space-y-3">
        <p className="text-sm text-graphite leading-relaxed">
          {summary}
        </p>

        <div className="flex flex-wrap gap-2">
          {highlights.map((highlight, index) => (
            <span
              key={highlight.key}
              className="bg-gold text-ink text-xs font-medium px-2 py-1"
            >
              {highlight.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SummaryInsightBanner