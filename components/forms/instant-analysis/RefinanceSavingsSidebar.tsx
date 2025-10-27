// ABOUTME: Refinance savings sidebar showing potential interest savings over 2-3 years
// ABOUTME: Displays on Step 3 to motivate completion with personalized savings

'use client'

import React from 'react'
import type { RefinanceOutlookResult } from '@/lib/calculations/instant-profile'
import { SavingsDisplay } from './SavingsDisplay'

interface RefinanceSavingsSidebarProps {
  outlookResult: RefinanceOutlookResult | null
  isLoading?: boolean
}

export function RefinanceSavingsSidebar({ outlookResult, isLoading = false }: RefinanceSavingsSidebarProps) {
  // Show waiting state when data is incomplete
  if (isLoading || !outlookResult) {
    return (
      <div className="border border-[#E5E5E5]/30 bg-white/60 backdrop-blur-md p-3 shadow-sm rounded-lg">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-black/90 uppercase tracking-wide">Potential Savings</h3>
          <p className="text-[10px] text-[#666666]/80 mt-0.5">Calculating your savings...</p>
        </div>
        <p className="text-xs text-[#666666]/80">
          Complete Step 2 to see your personalized savings estimate.
        </p>
      </div>
    )
  }

  // Check if we have savings scenarios to display
  if (!outlookResult.savingsScenarios || outlookResult.savingsScenarios.length === 0) {
    return (
      <div className="border border-[#E5E5E5]/30 bg-white/60 backdrop-blur-md p-3 shadow-sm rounded-lg">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-black/90 uppercase tracking-wide">Potential Savings</h3>
          <p className="text-[10px] text-[#666666]/80">Updated just now</p>
        </div>
        <p className="text-xs text-[#666666]/80">
          Calculating savings scenarios...
        </p>
      </div>
    )
  }

  // Estimate outstanding loan from max cash out (TODO: pass from form)
  const estimatedOutstandingLoan = 400000

  return (
    <SavingsDisplay scenarios={outlookResult.savingsScenarios} outstandingLoan={estimatedOutstandingLoan} />
  )
}
