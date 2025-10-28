// ABOUTME: Elegant refinance opportunity sidebar showing market context and savings potential

'use client'

import { TrendingDown, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumberWithCommas } from '@/lib/utils'

interface RefinanceOpportunitySidebarProps {
  currentRate?: number
  marketRate?: number  // From Step 2 market snapshot
  loanAmount?: number
  onConnectToBroker?: () => void
  isLoading?: boolean
}

export function RefinanceOpportunitySidebar({
  currentRate = 0,
  marketRate = 0,
  loanAmount = 0,
  onConnectToBroker,
  isLoading = false
}: RefinanceOpportunitySidebarProps) {
  // Calculate potential opportunity indicator
  const rateDifference = currentRate - marketRate
  const hasOpportunity = rateDifference > 0.25  // If current rate is 0.25% higher

  // Calculate interest savings
  const year1Savings = loanAmount * (rateDifference / 100)
  const year2Savings = year1Savings  // Simplified: assumes constant rates

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FCD34D]" />
          <h3 className="text-sm font-semibold text-black">Refinance Opportunity</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-[#F8F8F8] animate-pulse rounded"></div>
          <div className="h-4 bg-[#F8F8F8] animate-pulse rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#FCD34D]" />
        <h3 className="text-sm font-semibold text-black">Refinance Opportunity</h3>
      </div>

      {/* Market Context */}
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]/50 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#666666]">Your Current Rate</span>
          <span className="font-mono text-lg font-semibold text-black">{currentRate.toFixed(2)}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-[#666666]">Current Market Range</span>
          <span className="font-mono text-lg font-semibold text-[#10B981]">
            {marketRate > 0 ? `~${marketRate.toFixed(2)}%` : 'Loading...'}
          </span>
        </div>

        {hasOpportunity && rateDifference > 0 && loanAmount > 0 && (
          <div className="pt-2 border-t border-[#E5E5E5] space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#666666]">Year 1 Interest Savings</span>
              <span className="font-mono text-sm font-semibold text-[#10B981]">
                ${formatNumberWithCommas(Math.round(year1Savings))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#666666]">Year 2 Interest Savings</span>
              <span className="font-mono text-sm font-semibold text-[#10B981]">
                ${formatNumberWithCommas(Math.round(year2Savings))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Message */}
      {hasOpportunity ? (
        <p className="text-xs text-[#666666] leading-relaxed">
          Current market rates may help reduce monthly payments or loan tenure. Speak to our AI Specialist for personalized recommendations.
        </p>
      ) : (
        <p className="text-xs text-[#666666] leading-relaxed">
          Market rates are competitive. Our AI Specialist can review your options and ensure best terms.
        </p>
      )}

      {/* CTA to AI Broker */}
      <Button
        type="button"
        onClick={onConnectToBroker}
        className="w-full bg-[#FCD34D] hover:bg-[#FCD34D]/90 text-black font-semibold flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Speak to AI Specialist
      </Button>

      {/* Market Data Source */}
      <div className="pt-3 border-t border-[#E5E5E5]">
        <p className="text-[10px] text-[#999999] text-center">
          Rates based on current SORA market snapshot
        </p>
      </div>
    </div>
  )
}
