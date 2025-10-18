/**
 * Loan Type Selector Component
 * Lead: Sarah Lim - Senior Frontend Engineer
 * Co-Lead: Priya Sharma - UX Engineer
 * 
 * First interaction point - no email required
 * Implements trust building with CSS-only animations (0KB overhead)
 */

'use client'

import React, { useState, useEffect } from 'react'
// Temporarily disabled for debugging
// import { 
//   eventBus, 
//   FormEvents, 
//   useEventPublisher, 
//   useCreateEvent 
// } from '@/lib/events/event-bus'
import { 
  useTrustCascade, 
  useLoadingAnimation 
} from '@/lib/hooks/useAnimation'
import { cn } from '@/lib/utils'

interface LoanTypeOption {
  type: 'new_purchase' | 'refinance' | 'commercial'
  label: string
  subtext: string
  icon: string
  benefits: string[]
  urgencyHook: string
  marketContext?: string
}

// Trust signals for progressive reveal
const trustSignals = [
  {
    type: 'authority' as const,
    message: 'MAS Licensed • Bank-Grade Security',
    icon: '🛡️',
    displayAfter: 0
  },
  {
    type: 'social_proof' as const,
    message: '12,847 Singaporeans saved this month',
    icon: '👥',
    displayAfter: 3000
  },
  {
    type: 'urgency' as const,
    message: 'DBS rates increase Friday • 3 days left',
    icon: '⏰',
    displayAfter: 8000
  }
]

const loanTypes: LoanTypeOption[] = [
  {
    type: 'new_purchase',
    label: 'Buying a Property',
    subtext: 'Get pre-approved in 24 hours',
    icon: '🏠',
    benefits: ['IPA competition edge', 'Developer negotiation power', 'Instant eligibility check'],
    urgencyHook: 'Properties selling in avg 3 weeks',
    marketContext: '73% of buyers save $382/month with us'
  },
  {
    type: 'refinance',
    label: 'Refinancing',
    subtext: 'Lower your monthly payments',
    icon: '🔄',
    benefits: ['Save up to $800/month', 'Lock-in expiry assistance', 'Same-day approval possible'],
    urgencyHook: 'Rates increase this Friday',
    marketContext: 'Average savings: $456/month'
  },
  {
    type: 'commercial',
    label: 'Commercial Property',
    subtext: 'Business & investment properties',
    icon: '🏢',
    benefits: ['Higher loan amounts', 'Investment property financing', 'Business expansion support'],
    urgencyHook: 'Commercial rates tightening',
    marketContext: 'Average loan: $2.5M for office/retail'
  }
]

interface LoanTypeSelectorProps {
  onSelect: (type: 'new_purchase' | 'refinance' | 'commercial') => void
  sessionId: string
  className?: string
}

export const LoanTypeSelector = ({ onSelect, sessionId, className }: LoanTypeSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Temporarily comment out event publishing to isolate the issue
  // const publishEvent = useEventPublisher()
  // const createEvent = useCreateEvent(sessionId)
  
  // Use custom hook for trust cascade - simplified without events
  const visibleTrustSignals = useTrustCascade(trustSignals, (index) => {
    // Temporarily disabled event publishing
    console.log('Trust signal shown:', index)
  })
  
  // Use loading animation hook
  const showLoading = useLoadingAnimation(isAnalyzing, 800)
  
  const handleSelect = (type: 'new_purchase' | 'refinance' | 'commercial') => {
    console.log('Loan type selected:', type)
    setSelectedType(type)
    setIsAnalyzing(true)
    
    // Simplified version - directly call onSelect after delay
    setTimeout(() => {
      setIsAnalyzing(false)
      onSelect(type)
    }, 800)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center animate-fade-in">
        <h2 className="text-2xl md:text-3xl font-gilda font-normal text-[#0D1B2A] mb-3">
          What brings you here today?
        </h2>
        <p className="text-gray-600 font-inter">
          Get personalized insights in 30 seconds • No commitment required
        </p>
      </div>
      
      {/* Trust Signal Cascade */}
      <div className="trust-signals flex flex-col items-center gap-2 min-h-[60px]">
        {trustSignals.map((signal, index) => (
          <div
            key={signal.message}
            className={cn(
              'trust-signal flex items-center gap-2 text-sm transition-all-300',
              visibleTrustSignals.includes(index) ? 'animate-slide-down opacity-100' : 'opacity-0',
              signal.type === 'urgency' && 'text-red-600',
              signal.type === 'authority' && 'text-blue-600',
              signal.type === 'social_proof' && 'text-green-600'
            )}
          >
            <span>{signal.icon}</span>
            <span className="font-medium">{signal.message}</span>
          </div>
        ))}
      </div>
      
      {/* Loan Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loanTypes.map((option, index) => (
          <button
            key={option.type}
            type="button"
            className={cn(
              'relative cursor-pointer transition-all-300 hover-scale animate-fade-in w-full text-left',
              selectedType === option.type && 'ring-2 ring-[#FFB800]',
              `animation-delay-${index + 1}`
            )}
            onClick={() => handleSelect(option.type)}
            onMouseEnter={() => setHoveredType(option.type)}
            onMouseLeave={() => setHoveredType(null)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={cn(
              'bg-white rounded-xl p-6 border-2 transition-colors-300 h-full',
              selectedType === option.type 
                ? 'border-[#FFB800] bg-gradient-to-br from-[#FFB800]/5 to-transparent' 
                : 'border-gray-200 hover:border-[#FFB800]/50 hover-shadow'
            )}>
              {/* Icon and Header */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">{option.icon}</div>
                <h3 className="text-xl font-gilda font-normal text-[#0D1B2A] mb-1">
                  {option.label}
                </h3>
                <p className="text-sm text-[#FFB800] font-inter font-medium">
                  {option.subtext}
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-2 mb-4">
                {option.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {benefit}
                  </div>
                ))}
              </div>

              {/* Urgency Hook */}
              <div className="text-xs text-red-600 font-inter bg-red-50 rounded-lg px-3 py-2 font-medium">
                ⏰ {option.urgencyHook}
              </div>
              
              {/* Market Context on Hover */}
              {hoveredType === option.type && option.marketContext && (
                <div className="mt-3 pt-3 border-t border-gray-100 animate-slide-up">
                  <p className="text-xs text-gray-600">
                    💡 {option.marketContext}
                  </p>
                </div>
              )}

              {/* Selection Indicator */}
              {selectedType === option.type && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center animate-scale-in">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-8 text-center animate-scale-in">
            <div className="w-12 h-12 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-[#0D1B2A]">
              Preparing your personalized analysis...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This takes just a moment
            </p>
          </div>
        </div>
      )}
      
      {/* Bottom Trust Bar */}
      <div className="flex items-center justify-center gap-6 mt-8 py-4 border-t border-gray-100 animate-fade-in">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Bank-Grade Security
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          No Hidden Fees
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Instant Calculation
        </div>
      </div>
    </div>
  )
}

export default LoanTypeSelector