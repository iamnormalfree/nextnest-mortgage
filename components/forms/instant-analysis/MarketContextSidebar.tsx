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
      <div className="border border-[#E5E5E5]/30 bg-white/60 backdrop-blur-md p-3 shadow-sm rounded-lg">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-black/90 uppercase tracking-wide">Market Context</h3>
          <p className="text-[10px] text-[#666666]/80 mt-0.5">Loading market data...</p>
        </div>
        <p className="text-xs text-[#666666]/80">
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
