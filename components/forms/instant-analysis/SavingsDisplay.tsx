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
    <div className="border border-[#E5E5E5] bg-[#F8F8F8] p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-black">Potential Savings</h3>
      </div>

      <div className="space-y-3">
        {/* Best Rate Package */}
        <div>
          <p className="text-sm text-[#666666] mb-1">
            Best Rate: {bestScenario.rate.toFixed(2)}% ({bestScenario.packageType})
          </p>
        </div>

        {/* 2-Year Savings */}
        <div>
          <p className="text-2xl font-bold text-nn-gold">
            ~{formatCurrency(bestScenario.savingsTwoYear)}
          </p>
          <p className="text-sm text-[#666666]">over 2 years</p>
        </div>

        {/* 3-Year Savings */}
        <div>
          <p className="text-2xl font-bold text-nn-gold">
            ~{formatCurrency(bestScenario.savingsThreeYear)}
          </p>
          <p className="text-sm text-[#666666]">over 3 years</p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E5E5] pt-3" />

        {/* Legal Disclaimer */}
        <div className="flex gap-2">
          <span className="text-nn-blue text-sm">ℹ️</span>
          <p className="text-xs text-[#666666] italic">
            Estimated savings based on market rates as of {currentDate}. Actual savings depend on your approved package, loan tenure, and fees. This is not a guarantee. Terms apply.
          </p>
        </div>
      </div>
    </div>
  );
}
