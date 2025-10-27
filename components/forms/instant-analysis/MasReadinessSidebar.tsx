// ABOUTME: Sidebar component showing MAS readiness status with TDSR/MSR ratios

'use client'

import React from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { MasReadinessResult } from '@/hooks/useMasReadiness'

interface MasReadinessSidebarProps {
  result: MasReadinessResult
}

export function MasReadinessSidebar({ result }: MasReadinessSidebarProps) {
  const { isReady, tdsr, tdsrLimit, msr, msrLimit, reasons } = result

  return (
    <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
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

        <div className="flex justify-between items-center">
          <span className="text-xs text-[#666666]">MSR</span>
          <span
            className={'text-sm font-mono ' + (msr === 0 ? 'text-gray-400' : msr <= msrLimit ? 'text-[#10B981]' : 'text-[#EF4444]')}
          >
            {msr === 0 ? '–' : `${msr.toFixed(1)}%`} / {msrLimit}%
          </span>
        </div>

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
  )
}
