// ABOUTME: Displays potential interest savings for refinance scenarios with legal disclaimer
// ABOUTME: Shows 2-year and 3-year savings estimates using best available package rates

'use client'

import React from 'react'
import type { SavingsScenario } from '@/lib/calculations/refinance-savings'

interface SavingsDisplayProps {
  scenarios: SavingsScenario[];
  outstandingLoan: number;
}

export function SavingsDisplay({ scenarios, outstandingLoan }: SavingsDisplayProps) {
  // Format currency with no decimal places
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get best scenario (already sorted by 2-year savings descending)
  const bestScenario = scenarios[0];

  // Get current date for disclaimer
  const currentDate = new Date().toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="border border-[#E5E5E5]/30 bg-white/60 backdrop-blur-md p-3 shadow-sm rounded-lg">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-black/90 uppercase tracking-wide">Potential Savings</h3>
      </div>

      <div className="space-y-2.5">
        {/* Best Rate Package */}
        <div>
          <p className="text-xs text-[#666666]/80">
            Best Rate: {bestScenario.rate.toFixed(2)}% ({bestScenario.packageType})
          </p>
        </div>

        {/* 2-Year Savings */}
        <div>
          <p className="text-xl font-bold text-nn-gold leading-tight">
            ~{formatCurrency(bestScenario.savingsTwoYear)}
          </p>
          <p className="text-[10px] text-[#666666]/80 mt-0.5">over 2 years</p>
        </div>

        {/* 3-Year Savings */}
        <div>
          <p className="text-xl font-bold text-nn-gold leading-tight">
            ~{formatCurrency(bestScenario.savingsThreeYear)}
          </p>
          <p className="text-[10px] text-[#666666]/80 mt-0.5">over 3 years</p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E5E5]/40 pt-2.5 mt-0.5" />

        {/* Legal Disclaimer */}
        <div className="flex gap-1.5">
          <span className="text-nn-blue text-xs mt-0.5">ℹ️</span>
          <p className="text-[10px] text-[#666666]/80 italic leading-snug">
            Estimated savings based on market rates as of {currentDate}. Actual savings depend on your approved package, loan tenure, and fees. This is not a guarantee. Terms apply.
          </p>
        </div>
      </div>
    </div>
  );
}
