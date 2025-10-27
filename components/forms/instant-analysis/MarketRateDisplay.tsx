// ABOUTME: Displays market rate snapshot with rate ranges, bank counts, and current rate comparison
// ABOUTME: Used in refinance sidebar to show available mortgage packages

'use client'

import React from 'react'
import type { MarketRateSnapshot } from '@/lib/types/market-rates'

interface MarketRateDisplayProps {
  marketRates: MarketRateSnapshot;
  currentRate: number;
}

export function MarketRateDisplay({ marketRates, currentRate }: MarketRateDisplayProps) {
  // Format relative date
  const formatRelativeDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Determine if rate is better than current
  const getRateColor = (min: number): string => {
    return min < currentRate ? 'text-nn-green' : 'text-nn-red';
  };

  const getRateIndicator = (min: number): string => {
    return min < currentRate ? '🟢' : '🔴';
  };

  return (
    <div className="border border-[#E5E5E5] bg-[#F8F8F8] p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-black">Market Snapshot</h3>
        <p className="text-xs text-[#666666]">Updated: {formatRelativeDate(marketRates.updated_at)}</p>
      </div>

      <div className="space-y-3">
        {/* 2-Year Fixed */}
        <div data-testid="rate-2yr" className={getRateColor(marketRates.fixed_packages.two_year.min)}>
          <p className="text-sm font-medium">2-Year Fixed</p>
          <p className="text-lg font-bold">
            {marketRates.fixed_packages.two_year.min.toFixed(2)}% - {marketRates.fixed_packages.two_year.max.toFixed(2)}%
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#666666]">{marketRates.fixed_packages.two_year.bank_count} banks offering</p>
            <span className="text-xl">{getRateIndicator(marketRates.fixed_packages.two_year.min)}</span>
          </div>
        </div>

        {/* 3-Year Fixed */}
        <div data-testid="rate-3yr" className={getRateColor(marketRates.fixed_packages.three_year.min)}>
          <p className="text-sm font-medium">3-Year Fixed</p>
          <p className="text-lg font-bold">
            {marketRates.fixed_packages.three_year.min.toFixed(2)}% - {marketRates.fixed_packages.three_year.max.toFixed(2)}%
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#666666]">{marketRates.fixed_packages.three_year.bank_count} banks offering</p>
            <span className="text-xl">{getRateIndicator(marketRates.fixed_packages.three_year.min)}</span>
          </div>
        </div>

        {/* Floating SORA */}
        <div data-testid="rate-floating" className={getRateColor(marketRates.floating_packages.three_month_sora.min)}>
          <p className="text-sm font-medium">Floating SORA (3M)</p>
          <p className="text-lg font-bold">
            {marketRates.floating_packages.three_month_sora.min.toFixed(2)}% - {marketRates.floating_packages.three_month_sora.max.toFixed(2)}%
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#666666]">{marketRates.floating_packages.three_month_sora.bank_count} banks offering</p>
            <span className="text-xl">{getRateIndicator(marketRates.floating_packages.three_month_sora.min)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E5E5] pt-3" />

        {/* Your Current Rate */}
        <div data-testid="current-rate" className="text-nn-red">
          <p className="text-sm font-medium">Your Current Rate</p>
          <p className="text-lg font-bold flex items-center gap-2">
            {currentRate.toFixed(2)}% <span className="text-xl">🔴</span>
          </p>
        </div>
      </div>
    </div>
  );
}
