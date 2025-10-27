// ABOUTME: Sidebar component showing MAS readiness status with TDSR/MSR ratios

'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { MasReadinessResult } from '@/hooks/useMasReadiness'

interface MasReadinessSidebarProps {
  result: MasReadinessResult
  propertyType?: string
  isBlurred?: boolean
  onUnlock?: () => void
}

export function MasReadinessSidebar({ result, propertyType, isBlurred = false, onUnlock }: MasReadinessSidebarProps) {
  const { isReady, tdsr, tdsrLimit, msr, msrLimit, reasons } = result
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  // MSR only applies to HDB and EC properties
  const shouldShowMsr = propertyType === 'HDB' || propertyType === 'EC'

  // Calculate gaps for over-limit scenarios
  const tdsrGap = tdsr > tdsrLimit ? tdsr - tdsrLimit : 0
  const msrGap = msr > msrLimit ? msr - msrLimit : 0

  // Determine main blocker for plain English messaging
  const mainBlocker = tdsrGap > 0 ? 'TDSR' : msrGap > 0 ? 'MSR' : null

  // Filter reasons into user-facing and technical
  const policyReason = reasons.find(r => r.startsWith('Policy references:'))
  const technicalReasons = reasons.filter(r =>
    !r.includes('Eligible') &&
    !r.startsWith('Policy references:') &&
    !r.includes('Complete income') &&
    !r.includes('Enter applicant')
  )

  // Generate plain English summary
  const getPlainEnglishSummary = () => {
    if (reasons.some(r => r.includes('Complete income') || r.includes('Enter applicant'))) {
      return 'Complete all required fields to check eligibility'
    }

    if (isReady) {
      return 'Your income supports this purchase'
    }

    if (mainBlocker === 'TDSR') {
      return 'There are ways to bridge the gap'
    }

    if (mainBlocker === 'MSR') {
      return 'There are ways to bridge the gap'
    }

    return 'Complete all fields to check eligibility'
  }

  return (
    <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8] relative overflow-hidden">
      <div className={isBlurred ? 'blur-sm' : ''}>
      {/* Hero Status */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div
          className={'w-12 h-12 rounded-full flex items-center justify-center mb-3 ' + (isReady ? 'bg-[#10B981]' : 'bg-[#EF4444]')}
          data-testid={isReady ? 'mas-ready-icon' : 'mas-not-ready-icon'}
        >
          {isReady ? (
            <CheckCircle className="w-7 h-7 text-white" />
          ) : (
            <AlertTriangle className="w-7 h-7 text-white" />
          )}
        </div>
        <h3 className="text-lg font-bold text-black mb-1">
          {isReady ? "You Can Afford This Property!" : "Let's Make This Work"}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Ratio Display with Hierarchy */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#666666] uppercase tracking-wider">TDSR</span>
            <div className="flex items-baseline gap-2">
              <span
                className={'text-base font-bold font-mono ' + (tdsr === 0 ? 'text-gray-400' : tdsr <= tdsrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}
              >
                {tdsr === 0 ? '–' : `${tdsr.toFixed(1)}%`}
              </span>
              <span className="text-xs text-[#999999] font-mono">/ {tdsrLimit}%</span>
              <span className={'text-base ' + (tdsr === 0 ? 'text-gray-400' : tdsr <= tdsrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                {tdsr === 0 ? '' : tdsr <= tdsrLimit ? '✓' : '✗'}
              </span>
            </div>
          </div>
          {tdsrGap > 0 && (
            <p className="text-xs text-[#EF4444] text-right">
              {tdsrGap.toFixed(1)}% over limit
            </p>
          )}

          {shouldShowMsr && (
            <>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#666666] uppercase tracking-wider">MSR</span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={'text-base font-bold font-mono ' + (msr === 0 ? 'text-gray-400' : msr <= msrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}
                  >
                    {msr === 0 ? '–' : `${msr.toFixed(1)}%`}
                  </span>
                  <span className="text-xs text-[#999999] font-mono">/ {msrLimit}%</span>
                  <span className={'text-base ' + (msr === 0 ? 'text-gray-400' : msr <= msrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                    {msr === 0 ? '' : msr <= msrLimit ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              {msrGap > 0 && (
                <p className="text-xs text-[#EF4444] text-right">
                  {msrGap.toFixed(1)}% over limit
                </p>
              )}
            </>
          )}
        </div>

        {/* Plain English Summary */}
        <div className="pt-3 border-t border-[#E5E5E5]">
          <p className={'text-sm ' + (isReady ? 'text-[#10B981]' : 'text-[#666666]')}>
            {getPlainEnglishSummary()}
          </p>
        </div>

        {/* Calculation Details - Progressive Disclosure (minimized, non-factor) */}
        {technicalReasons.length > 0 && (
          <div className="pt-3 border-t border-[#E5E5E5] opacity-40 hover:opacity-60 transition-opacity">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-[10px] text-[#999999] hover:text-[#666666] transition-colors"
            >
              <span>Calculation details</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-2 space-y-1">
                {technicalReasons.map((reason, index) => (
                  <p key={index} className="text-[10px] text-[#999999] flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{reason}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* AI Specialist CTA - Only show when unlocked */}
      {!isBlurred && (
        <div className="p-4 pt-3">
          <button
            type="button"
            onClick={() => {
              // TODO: Integrate with AI broker navigation
              console.log('Navigate to AI specialist with context:', { isReady, tdsr, msr, reasons })
            }}
            className="w-full px-4 py-3 bg-[#F7B32B] text-black text-sm font-semibold hover:bg-[#E5A01F] transition-colors rounded flex items-center justify-center gap-2"
          >
            {isReady ? 'Get Your Loan Package' : 'Explore Your Options'}
            <span>→</span>
          </button>
        </div>
      )}

      {/* Blur overlay when locked with unlock button */}
      {isBlurred && onUnlock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <button
            type="button"
            onClick={onUnlock}
            className="px-4 py-2 bg-[#F7B32B] text-black text-xs font-semibold hover:bg-[#E5A01F] transition-colors rounded shadow-lg"
          >
            Unlock My Eligibility
          </button>
        </div>
      )}
    </div>
  )
}
