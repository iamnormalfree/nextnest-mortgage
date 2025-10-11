'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { MOBILE_DESIGN_TOKENS } from '@/lib/design-tokens/mobile'
import type { MobileSectionTabsProps, MobileTab } from './types'

/**
 * Mobile tab navigation with touch-friendly interface
 * Each tab meets 44px minimum touch target requirement
 * Supports badges for notification counts
 * Keyboard accessible with proper focus management
 */
export const MobileSectionTabs: React.FC<MobileSectionTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
  }

  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleTabClick(tabId)
    }
    // Arrow key navigation
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
      let nextIndex: number
      
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
      } else {
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
      }
      
      onTabChange(tabs[nextIndex].id)
    }
  }

  return (
    <div className="flex border-b border-fog bg-white" role="tablist">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id
        const IconComponent = tab.icon
        
        return (
          <button
            key={tab.id}
            className={cn(
              'flex-1 py-3 px-2 text-xs font-medium transition-colors relative',
              'min-h-[44px] flex flex-col items-center justify-center gap-1',
              'focus:outline-none focus:ring-2 focus:ring-gold focus:ring-inset',
              isActive
                ? 'text-gold border-b-2 border-gold bg-gold/5'
                : 'text-graphite hover:text-ink hover:bg-mist/50'
            )}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
          >
            {/* Icon with optional badge */}
            <div className="relative flex items-center justify-center">
              <IconComponent className="w-4 h-4" />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            
            {/* Tab Label */}
            <span className="truncate max-w-full">{tab.label}</span>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Tab content wrapper for proper ARIA labeling
export const MobileTabContent: React.FC<{
  tabId: string
  activeTab: string
  children: React.ReactNode
  className?: string
}> = ({ tabId, activeTab, children, className }) => {
  const isActive = activeTab === tabId
  
  if (!isActive) return null
  
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={cn('focus:outline-none', className)}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

// Loading skeleton for tabs
export const MobileSectionTabsSkeleton: React.FC = () => {
  return (
    <div className="flex border-b border-fog bg-white">
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="flex-1 py-3 px-2 min-h-[44px] flex flex-col items-center justify-center gap-1 animate-pulse">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  )
}