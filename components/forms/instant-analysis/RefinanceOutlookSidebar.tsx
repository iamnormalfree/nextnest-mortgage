// ABOUTME: Refinance outlook sidebar showing savings, cash-out, and timing guidance

'use client'

import React from 'react'
import type { RefinanceOutlookResult } from '@/lib/calculations/instant-profile'

interface RefinanceOutlookSidebarProps {
  outlookResult: RefinanceOutlookResult | null
  isLoading?: boolean
}

export function RefinanceOutlookSidebar({ outlookResult, isLoading = false }: RefinanceOutlookSidebarProps) {
  // Show waiting state when data is incomplete
  if (isLoading || !outlookResult) {
    return (
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-black">Refinance Outlook</h3>
          <p className="text-xs text-[#666666] mt-1">Waiting for data...</p>
        </div>
        <p className="text-sm text-[#666666]">
          {isLoading
            ? 'Fill in property value and outstanding loan in Step 2 to see your refinance outlook.'
            : 'Complete the required fields to calculate your savings potential.'}
        </p>
      </div>
    )
  }

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined) return '—'
    return value.toLocaleString()
  }

  return (
    <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-black">Refinance Outlook</h3>
        <p className="text-xs text-[#666666]">Updated just now</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#666666] mb-1">Monthly Savings</p>
          <p className="text-lg font-semibold text-black">
            ${formatNumber(outlookResult.projectedMonthlySavings)}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#666666] mb-1">Cash-Out Available</p>
          <p className="text-lg font-semibold text-black">
            ${formatNumber(outlookResult.maxCashOut)}
          </p>
        </div>

        <div className="pt-3 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#666666] mb-1">Best Time to Refinance</p>
          <p className="text-sm text-black">{outlookResult.timingGuidance}</p>
        </div>
      </div>
    </div>
  )
}
