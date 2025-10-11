'use client'

import React from 'react'
import { Package, Building, CheckCircle } from 'lucide-react'

interface MetricsRowProps {
  packagesAnalyzed?: number
  banksCompared?: number
  optimalMatches?: number
  className?: string
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  packagesAnalyzed = 286,
  banksCompared = 23,
  optimalMatches = 3,
  className = ''
}) => {
  const metrics = [
    {
      icon: Package,
      label: 'Packages Analyzed',
      value: packagesAnalyzed.toString(),
      color: 'text-ink'
    },
    {
      icon: Building,
      label: 'Banks Compared',
      value: banksCompared.toString(),
      color: 'text-ink'
    },
    {
      icon: CheckCircle,
      label: 'Optimal Matches',
      value: optimalMatches.toString(),
      color: 'text-emerald'
    }
  ]

  return (
    <div className={`bg-white border border-fog ${className}`}>
      <div className="grid grid-cols-3 divide-x divide-fog">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-gold" />
                <span className="text-xs uppercase tracking-wider text-silver">
                  {metric.label}
                </span>
              </div>
              <div className={`text-xl font-mono font-medium ${metric.color}`}>
                {metric.value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MetricsRow