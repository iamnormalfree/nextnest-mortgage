'use client'

import React from 'react'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOBILE_DESIGN_TOKENS } from '@/lib/design-tokens/mobile'
import type { MobileScoreWidgetProps } from './types'

/**
 * Compact score widget for mobile viewports
 * Height: 72px vs current 120px+ from desktop version
 * Optimized for 320px+ viewports with proper touch targets
 */
export const MobileScoreWidget: React.FC<MobileScoreWidgetProps> = ({
  score,
  priority,
  className = ''
}) => {
  // Determine priority styling based on score and priority text
  const getPriorityColor = () => {
    if (score >= 70 || priority.toLowerCase().includes('high')) {
      return 'from-gold/10 to-gold/5 border-gold/20'
    } else if (score >= 40 || priority.toLowerCase().includes('medium')) {
      return 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20'
    } else {
      return 'from-gray-500/10 to-gray-500/5 border-gray-500/20'
    }
  }

  const getScoreColor = () => {
    if (score >= 70) return 'bg-gold text-ink'
    if (score >= 40) return 'bg-yellow-500 text-white'
    return 'bg-gray-500 text-white'
  }

  const getIndicatorColor = () => {
    if (score >= 70) return 'bg-gold'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 bg-gradient-to-r rounded-lg border',
      getPriorityColor(),
      className
    )}>
      {/* Score Circle - 48px for comfortable touch target */}
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center',
        getScoreColor()
      )}>
        <span className="text-sm font-bold">{score}%</span>
      </div>
      
      {/* Score Information */}
      <div className="flex-1 min-w-0"> {/* min-w-0 prevents text overflow */}
        <p className="text-xs text-graphite leading-tight">AI Confidence Score</p>
        <p className="text-sm font-semibold text-ink truncate">{priority} Priority</p>
      </div>
      
      {/* Visual Indicator */}
      <div className={cn(
        'w-2 h-8 rounded-full',
        getIndicatorColor()
      )}></div>
      
      {/* Target Icon */}
      <Target className="w-4 h-4 text-gold flex-shrink-0" />
    </div>
  )
}

// Loading skeleton for the score widget
export const MobileScoreWidgetSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="w-2 h-8 bg-gray-200 rounded-full"></div>
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
    </div>
  )
}