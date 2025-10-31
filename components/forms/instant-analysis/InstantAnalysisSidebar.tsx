// ABOUTME: Sticky sidebar component for instant analysis on desktop (≥1024px)
// ABOUTME: Shows max loan calculations for new purchase and savings for refinance

'use client'

import React from 'react'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { cn, formatNumberWithCommas } from '@/lib/utils'
import type { LoanType } from '@/lib/contracts/form-contracts'

export interface InstantAnalysisCalcResult {
  maxLoanAmount?: number  // Field name from calculator (BaseInstantCalcResult)
  monthlyPayment?: number
  monthlySavings?: number
  currentMonthlyPayment?: number  // Field name from refinance calculator
  newMonthlyPayment?: number      // Field name from refinance calculator
  limitingFactor?: string
  ltvRatio?: number  // Field name from calculator (not ltvUsed)
}

interface InstantAnalysisSidebarProps {
  calcResult: InstantAnalysisCalcResult | null
  loanType: LoanType
  isLoading: boolean
}

export function InstantAnalysisSidebar({
  calcResult,
  loanType,
  isLoading
}: InstantAnalysisSidebarProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-[#E5E5E5]">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#FCD34D]" />
          <span className="text-sm font-semibold text-black">Analyzing...</span>
        </div>
        <p className="text-xs text-[#666666]">
          Processing your details. This usually takes a few seconds.
        </p>
      </div>
    )
  }

  // No result yet
  if (!calcResult) {
    return null
  }

  // Render for new purchase
  if (loanType === 'new_purchase' && calcResult.maxLoanAmount) {
    return (
      <div className="p-6 bg-white border border-[#E5E5E5] space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#FCD34D]" />
          <span className="text-sm font-semibold text-black">Instant Analysis</span>
        </div>

        {/* Main result */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
            You can borrow up to
          </p>
          <p className="text-3xl font-bold text-[#000000]">
            ${formatNumberWithCommas(calcResult.maxLoanAmount.toString())}
          </p>
        </div>

        {/* Monthly payment */}
        {calcResult.monthlyPayment && (
          <div className="pt-4 border-t border-[#E5E5E5]">
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
              Est. Monthly Payment
            </p>
            <p className="text-xl font-semibold text-black">
              ${formatNumberWithCommas(Math.round(calcResult.monthlyPayment).toString())}/mo
            </p>
          </div>
        )}

        {/* Limiting factor badge */}
        {calcResult.limitingFactor && (
          <div className="pt-4 border-t border-[#E5E5E5]">
            <p className="text-xs text-[#666666]">
              Limited by: <span className="font-semibold text-black">{calcResult.limitingFactor}</span>
            </p>
          </div>
        )}

        {/* Help text */}
        <div className="pt-4 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#666666] leading-relaxed">
            This is an instant estimate based on your property and income details. Complete the form for a detailed breakdown.
          </p>
        </div>
      </div>
    )
  }

  // Render for refinance
  if (loanType === 'refinance' && calcResult.monthlySavings) {
    const currentPayment = calcResult.currentMonthlyPayment ?? 0
    const newPayment = calcResult.newMonthlyPayment ?? (currentPayment - calcResult.monthlySavings)
    const savingsPercent = currentPayment > 0
      ? Math.round((calcResult.monthlySavings / currentPayment) * 100)
      : 0

    return (
      <div className="p-6 bg-white border border-[#E5E5E5] space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#FCD34D]" />
          <span className="text-sm font-semibold text-black">Refinancing Opportunity</span>
        </div>

        {/* Monthly savings */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
            You could save
          </p>
          <p className="text-3xl font-bold text-[#000000]">
            ${formatNumberWithCommas(Math.round(calcResult.monthlySavings).toString())}/mo
          </p>
          {savingsPercent > 0 && (
            <p className="text-sm text-[#FCD34D] font-semibold mt-1">
              {savingsPercent}% reduction
            </p>
          )}
        </div>

        {/* Current vs New payment */}
        <div className="pt-4 border-t border-[#E5E5E5] space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">
              Current Payment
            </p>
            <p className="text-lg font-mono text-black">
              ${formatNumberWithCommas(Math.round(currentPayment).toString())}/mo
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">
              New Payment (est.)
            </p>
            <p className="text-lg font-mono font-semibold text-black">
              ${formatNumberWithCommas(Math.round(newPayment).toString())}/mo
            </p>
          </div>
        </div>

        {/* Help text */}
        <div className="pt-4 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#666666] leading-relaxed">
            Based on current market rates. Complete the form to get a detailed breakdown and lock in these savings.
          </p>
        </div>
      </div>
    )
  }

  return null
}
