// ABOUTME: Market context sidebar showing current market rates and SORA benchmarks
// ABOUTME: Displays on Step 2 to provide market landscape for refinance decision

'use client'

import React from 'react'
import { MarketRateDisplay } from './MarketRateDisplay'
import { MarketContextWidget } from './MarketContextWidget'
import { getPlaceholderRates } from '@/lib/types/market-rates'

interface MarketContextSidebarProps {
  currentRate: number
  isLoading?: boolean
}

export function MarketContextSidebar({ currentRate, isLoading = false }: MarketContextSidebarProps) {
  // Show waiting state when loading
  if (isLoading) {
    return (
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-black">Market Context</h3>
          <p className="text-xs text-[#666666] mt-1">Loading market data...</p>
        </div>
        <p className="text-sm text-[#666666]">
          Fill in your current rate to see market comparison.
        </p>
      </div>
    )
  }

  // Get market rates for display (using placeholder for now)
  const marketRates = getPlaceholderRates()

  return (
    <div className="space-y-4">
      <MarketRateDisplay marketRates={marketRates} currentRate={currentRate} />
      <MarketContextWidget soraBenchmarks={marketRates.sora_benchmarks} updatedAt={marketRates.updated_at} />
    </div>
  )
}
