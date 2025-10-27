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
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-black">Potential Savings</h3>
          <p className="text-xs text-[#666666] mt-1">Calculating your savings...</p>
        </div>
        <p className="text-sm text-[#666666]">
          Complete Step 2 to see your personalized savings estimate.
        </p>
      </div>
    )
  }

  // Check if we have savings scenarios to display
  if (!outlookResult.savingsScenarios || outlookResult.savingsScenarios.length === 0) {
    return (
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-black">Potential Savings</h3>
          <p className="text-xs text-[#666666]">Updated just now</p>
        </div>
        <p className="text-sm text-[#666666]">
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
