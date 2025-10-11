'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOBILE_DESIGN_TOKENS } from '@/lib/design-tokens/mobile'
import type { MobileInsightCardProps } from './types'

/**
 * Mobile-optimized insight card with collapsible details
 * Height: 60px collapsed, 120px expanded
 * Supports progressive disclosure pattern (Level 1-4)
 * All interactive elements meet 44px touch target minimum
 */
export const MobileInsightCard: React.FC<MobileInsightCardProps> = ({
  title,
  priority,
  summary,
  details,
  action,
  isExpanded: controlledExpanded,
  onToggle
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false)
  
  // Use controlled or internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  // Priority-based styling
  const getPriorityColors = () => {
    switch (priority) {
      case 'high':
        return {
          card: 'border-red-200 bg-red-50',
          badge: 'bg-red-100 text-red-800',
          button: 'hover:bg-red-100'
        }
      case 'medium':
        return {
          card: 'border-yellow-200 bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800',
          button: 'hover:bg-yellow-100'
        }
      case 'low':
        return {
          card: 'border-green-200 bg-green-50',
          badge: 'bg-green-100 text-green-800',
          button: 'hover:bg-green-100'
        }
      default:
        return {
          card: 'border-gray-200 bg-gray-50',
          badge: 'bg-gray-100 text-gray-800',
          button: 'hover:bg-gray-100'
        }
    }
  }

  const colors = getPriorityColors()
  const hasExpandableContent = details && details.length > 0

  return (
    <div
      className={cn(
        'border rounded-lg transition-all duration-200',
        colors.card
      )}
      style={{
        padding: MOBILE_DESIGN_TOKENS.spacing.md, // 12px as specified
      }}
    >
      {/* Header - Always visible, clickable if has expandable content */}
      <div
        className={cn(
          'flex items-center justify-between',
          hasExpandableContent ? 'min-h-[44px] cursor-pointer' : 'min-h-[36px]'
        )}
        onClick={hasExpandableContent ? handleToggle : undefined}
        role={hasExpandableContent ? 'button' : undefined}
        tabIndex={hasExpandableContent ? 0 : undefined}
        onKeyDown={hasExpandableContent ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        } : undefined}
        aria-expanded={hasExpandableContent ? isExpanded : undefined}
        aria-label={hasExpandableContent ? `${isExpanded ? 'Collapse' : 'Expand'} ${title} details` : undefined}
      >
        <div className="flex-1 min-w-0" style={{ paddingRight: MOBILE_DESIGN_TOKENS.spacing.sm }}>
          <div className="flex items-center mb-0.5" style={{ gap: MOBILE_DESIGN_TOKENS.spacing.sm }}>
            <h4 className={cn(MOBILE_DESIGN_TOKENS.typography.body, 'font-medium text-ink truncate')}>{title}</h4>
            <span className={cn(
              MOBILE_DESIGN_TOKENS.typography.tiny,
              'px-2 py-0.5 rounded-full flex-shrink-0',
              colors.badge
            )}>
              {priority}
            </span>
          </div>
          <p className={cn(MOBILE_DESIGN_TOKENS.typography.small, 'text-graphite leading-tight line-clamp-2')}>{summary}</p>
        </div>
        
        {/* Expand/Collapse Button */}
        {hasExpandableContent && (
          <button 
            className={cn(
              'p-2 rounded-lg transition-colors flex-shrink-0',
              colors.button
            )}
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
            }}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
          >
            {isExpanded ?
              <ChevronDown className="w-4 h-4 text-graphite" /> :
              <ChevronRight className="w-4 h-4 text-graphite" />
            }
          </button>
        )}
      </div>

      {/* Expandable Details */}
      {isExpanded && hasExpandableContent && (
        <div
          className="border-t border-white/50 animate-in slide-in-from-top-2 duration-200"
          style={{
            marginTop: MOBILE_DESIGN_TOKENS.spacing.sm,
            paddingTop: MOBILE_DESIGN_TOKENS.spacing.sm
          }}
        >
          <ul style={{ gap: MOBILE_DESIGN_TOKENS.spacing.xs }} className="space-y-1">
            {details.map((detail, idx) => (
              <li key={idx} className={cn(MOBILE_DESIGN_TOKENS.typography.small, 'text-graphite flex items-start')}>
                <span
                  className="w-1 h-1 bg-graphite rounded-full flex-shrink-0"
                  style={{
                    marginTop: MOBILE_DESIGN_TOKENS.spacing.sm,
                    marginRight: MOBILE_DESIGN_TOKENS.spacing.sm
                  }}
                ></span>
                <span className="leading-relaxed">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      {action && (
        <div
          className="border-t border-white/50"
          style={{
            marginTop: MOBILE_DESIGN_TOKENS.spacing.md,
            paddingTop: MOBILE_DESIGN_TOKENS.spacing.sm
          }}
        >
          <button
            onClick={action.onClick}
            className={cn(
              'w-full rounded-lg font-medium transition-colors',
              'flex items-center justify-center',
              MOBILE_DESIGN_TOKENS.typography.body,
              action.variant === 'secondary'
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gold text-ink hover:bg-gold/90'
            )}
            style={{
              minHeight: MOBILE_DESIGN_TOKENS.touchTargets.minimum,
              padding: `${MOBILE_DESIGN_TOKENS.spacing.sm} ${MOBILE_DESIGN_TOKENS.spacing.md}`
            }}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}

// Loading skeleton for insight cards
export const MobileInsightCardSkeleton: React.FC = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 animate-pulse">
      <div className="flex items-center justify-between min-h-[44px]">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )
}