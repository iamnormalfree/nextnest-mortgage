'use client'

import React from 'react'
import { ChevronDown, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileInsightStripProps {
  leadScore?: number | null
  urgencyLevel?: 'critical' | 'high' | 'moderate' | 'low'
  primaryRecommendation?: string
  onToggle: () => void
  className?: string
}

/**
 * Collapsible insight strip below chat header
 * Level 1 disclosure - always visible overview
 * Compact 80px height as specified in mobile plan
 */
export const MobileInsightStrip: React.FC<MobileInsightStripProps> = ({
  leadScore,
  urgencyLevel,
  primaryRecommendation,
  onToggle,
  className
}) => {
  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'critical':
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'moderate':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getScoreColor = () => {
    if (!leadScore) return 'bg-gray-400'
    if (leadScore >= 70) return 'bg-green-500'
    if (leadScore >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceText = () => {
    if (!leadScore) return 'Analysis in progress'
    if (leadScore >= 70) return 'Confidence score is strong'
    if (leadScore >= 50) return 'Confidence score is moderate'
    return 'Confidence score needs improvement'
  }

  const shouldShowWarning = () => {
    return urgencyLevel === 'critical' || (leadScore && leadScore < 50)
  }

  const shouldShowSuccess = () => {
    return leadScore && leadScore >= 70
  }

  return (
    <div className={cn(
      'border-b border-gray-200 bg-white',
      'py-2', // Remove px since parent provides spacing
      'h-16', // Reduced from 80px to 64px
      className
    )}>
      {/* Simplified chip row layout */}
      <div className="flex items-center gap-2 h-full px-2">
        {/* Score Chip - Compact */}
        {leadScore && (
          <div className={cn(
            'flex items-center gap-2 px-2 py-0.5 rounded-full flex-shrink-0',
            getScoreColor() === 'bg-green-500' ? 'bg-green-100 text-green-800' :
            getScoreColor() === 'bg-yellow-500' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          )}>
            <Target className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">
              {leadScore}%
            </span>
            {shouldShowSuccess() && (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            {shouldShowWarning() && (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
          </div>
        )}

        {/* Helper Text - Compact */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 leading-tight truncate">
            {getConfidenceText()}
            {primaryRecommendation && ` - ${primaryRecommendation}`}
          </p>
        </div>

        {/* Priority Badge - Compact */}
        {urgencyLevel && (
          <div className="flex-shrink-0">
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              urgencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
              urgencyLevel === 'high' ? 'bg-red-100 text-red-600' :
              urgencyLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            )}>
              {urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)}
            </span>
          </div>
        )}

        {/* Collapse Button - Compact */}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded min-h-[32px] min-w-[32px] flex items-center justify-center flex-shrink-0"
          aria-label="Hide insights"
        >
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  )
}