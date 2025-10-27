// ABOUTME: Sidebar component showing MAS readiness status with TDSR/MSR ratios

'use client'

import React from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { MasReadinessResult } from '@/hooks/useMasReadiness'

interface MasReadinessSidebarProps {
  result: MasReadinessResult
  propertyType?: string
  isBlurred?: boolean
  onUnlock?: () => void
}

export function MasReadinessSidebar({ result, propertyType, isBlurred = false, onUnlock }: MasReadinessSidebarProps) {
  const { isReady, tdsr, tdsrLimit, msr, msrLimit, reasons } = result

  // MSR only applies to HDB and EC properties
  const shouldShowMsr = propertyType === 'HDB' || propertyType === 'EC'

  return (
    <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8] relative overflow-hidden">
      <div className={isBlurred ? 'blur-sm' : ''}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-black">MAS Readiness Check</h3>
          <p className="text-xs text-[#666666]">Updated just now</p>
        </div>
        <div
          className={'w-6 h-6 rounded-full flex items-center justify-center ' + (isReady ? 'bg-[#10B981]' : 'bg-[#EF4444]')}
          data-testid={isReady ? 'mas-ready-icon' : 'mas-not-ready-icon'}
        >
          {isReady ? (
            <CheckCircle className="w-4 h-4 text-white" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#666666]">TDSR</span>
          <span
            className={'text-sm font-mono ' + (tdsr === 0 ? 'text-gray-400' : tdsr <= tdsrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}
          >
            {tdsr === 0 ? '–' : `${tdsr.toFixed(1)}%`} / {tdsrLimit}%
          </span>
        </div>

        {shouldShowMsr && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#666666]">MSR</span>
            <span
              className={'text-sm font-mono ' + (msr === 0 ? 'text-gray-400' : msr <= msrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}
            >
              {msr === 0 ? '–' : `${msr.toFixed(1)}%`} / {msrLimit}%
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#666666] mb-2">Requirements:</p>
          <ul className="space-y-1">
            {reasons.map((reason, index) => (
              <li
                key={index}
                className={'text-xs flex items-start gap-2 ' + (reason.includes('Eligible') ? 'text-[#10B981]' : 'text-[#666666]')}
              >
                <span className="mt-0.5">{reason.includes('Eligible') ? '✓' : '•'}</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>

      {/* Blur overlay when locked with unlock button */}
      {isBlurred && onUnlock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <div className="bg-white/95 px-6 py-4 rounded-lg shadow-xl text-center space-y-3 max-w-[90%]">
            <p className="text-sm font-semibold text-[#000000]">
              Ready to see your MAS readiness score?
            </p>
            <p className="text-xs text-[#666666]">
              Unlock your precise snapshot
            </p>
            <button
              type="button"
              onClick={onUnlock}
              className="w-full px-6 py-3 bg-[#000000] text-white text-sm font-semibold hover:bg-[#333333] transition-colors rounded"
            >
              Unlock My Score
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
