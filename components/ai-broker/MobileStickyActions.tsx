'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Phone, HelpCircle, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DefenseStrategy } from './types'

interface MobileStickyActionsProps {
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  defenseStrategy?: DefenseStrategy | null
  className?: string
  onHeightChange?: (height: number) => void
  transcriptScrolled?: number // Total scroll amount from transcript
}

/**
 * Sticky bottom action sheet within thumb reach
 * Appears on scroll as specified in mobile plan
 * 56px height with proper touch targets
 */
export const MobileStickyActions: React.FC<MobileStickyActionsProps> = ({
  onPrimaryAction,
  onSecondaryAction,
  defenseStrategy,
  className,
  onHeightChange,
  transcriptScrolled = 0
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  // Report height changes to parent
  useEffect(() => {
    if (containerRef && onHeightChange) {
      const height = isVisible ? containerRef.offsetHeight : 0
      onHeightChange(height)
    }
  }, [isVisible, isExpanded, containerRef, onHeightChange])

  // Show action sheet when user has scrolled in the transcript
  useEffect(() => {
    setIsVisible(transcriptScrolled > 100)
  }, [transcriptScrolled])

  // Reset height when hiding
  useEffect(() => {
    if (!isVisible && onHeightChange) {
      onHeightChange(0)
    }
  }, [isVisible, onHeightChange])

  if (!isVisible) return null

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 bg-transparent', className)}>
      <div
        ref={setContainerRef}
        className="w-full bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-out"
      >
        {/* Expandable content */}
        {isExpanded && (
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">Quick Actions</h4>

              {defenseStrategy?.nextActions && (
                <div className="space-y-1">
                  {defenseStrategy.nextActions.slice(0, 3).map((action, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                      <div className="w-1 h-1 bg-gray-400 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors min-h-[36px]">
                  <HelpCircle className="w-3 h-3 inline mr-1" />
                  FAQ
                </button>
                <button className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors min-h-[36px]">
                  Compliance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main action bar - Grid Layout */}
        <div
          className={cn(
            'grid grid-cols-[auto_auto_1fr] gap-2 p-3',
            'min-h-[56px] items-center'
          )}
          style={{
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
          }}
        >
          {/* Expand toggle - Fixed size */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'p-2 border border-gray-300 bg-white',
              'min-h-[40px] min-w-[40px] flex items-center justify-center',
              'hover:bg-gray-50 transition-colors'
            )}
          >
            <ChevronUp
              className={cn(
                'w-4 h-4 text-gray-600 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </button>

          {/* Secondary Action - Lighter styling */}
          <button
            onClick={onSecondaryAction}
            className={cn(
              'flex items-center justify-center px-2 py-2 border border-gray-300 bg-gray-50',
              'text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
              'min-h-[44px] min-w-[64px]'
            )}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Later
          </button>

          {/* Primary Action - Strong hierarchy */}
          <button
            onClick={onPrimaryAction}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 bg-gold text-ink',
              'text-sm font-bold hover:bg-gold/90 transition-colors',
              'min-h-[44px] w-full',
              'shadow-sm ring-1 ring-gold/10'
            )}
          >
            <Phone className="w-4 h-4" />
            <span>Speak to Advisor</span>
          </button>
        </div>
      </div>
    </div>
  )
}
