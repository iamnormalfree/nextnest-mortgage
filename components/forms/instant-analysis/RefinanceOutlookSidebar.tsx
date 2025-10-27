// ABOUTME: Refinance outlook sidebar showing market rates, savings, and SORA benchmarks
// ABOUTME: Composed of MarketRateDisplay, SavingsDisplay, and MarketContextWidget

'use client'

import React from 'react'
import type { RefinanceOutlookResult } from '@/lib/calculations/instant-profile'
import { MarketRateDisplay } from './MarketRateDisplay'
import { SavingsDisplay } from './SavingsDisplay'
import { MarketContextWidget } from './MarketContextWidget'
import { getPlaceholderRates } from '@/lib/types/market-rates'

interface RefinanceOutlookSidebarProps {
  outlookResult: RefinanceOutlookResult | null
  isLoading?: boolean
  currentRate: number
}

export function RefinanceOutlookSidebar({ outlookResult, isLoading = false, currentRate }: RefinanceOutlookSidebarProps) {
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

  // Check if we have savings scenarios to display
  if (!outlookResult.savingsScenarios || outlookResult.savingsScenarios.length === 0) {
    return (
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-black">Refinance Outlook</h3>
          <p className="text-xs text-[#666666]">Updated just now</p>
        </div>
        <p className="text-sm text-[#666666]">
          Calculating market opportunities...
        </p>
      </div>
    )
  }

  // Get market rates for display (using placeholder for now)
  const marketRates = getPlaceholderRates()

  // Estimate outstanding loan from max cash out and LTV
  const estimatedOutstandingLoan = 400000 // TODO: Pass from form in Task 8

  return (
    <div className="space-y-4">
      <MarketRateDisplay marketRates={marketRates} currentRate={currentRate} />
      <SavingsDisplay scenarios={outlookResult.savingsScenarios} outstandingLoan={estimatedOutstandingLoan} />
      <MarketContextWidget soraBenchmarks={marketRates.sora_benchmarks} updatedAt={marketRates.updated_at} />
    </div>
  )
}
