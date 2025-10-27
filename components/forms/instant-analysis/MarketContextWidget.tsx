// ABOUTME: Displays SORA benchmark rates with relative date formatting
// ABOUTME: Provides market context for floating rate mortgage packages

'use client'

import React from 'react'

interface MarketContextWidgetProps {
  soraBenchmarks: {
    one_month: number;
    three_month: number;
  };
  updatedAt: string;
}

export function MarketContextWidget({ soraBenchmarks, updatedAt }: MarketContextWidgetProps) {
  // Format relative date with time
  const formatRelativeDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const timeString = date.toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (diffHours < 24) {
      return `Today at ${timeString}`;
    } else if (diffHours < 48) {
      return `Yesterday at ${timeString}`;
    } else if (diffDays < 7) {
      const weekday = date.toLocaleDateString('en-SG', { weekday: 'long' });
      return `${weekday} at ${timeString}`;
    } else {
      return date.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  return (
    <div className="border border-[#E5E5E5]/30 bg-white/60 backdrop-blur-md p-3 shadow-sm rounded-lg">
      <div className="mb-2.5">
        <h3 className="text-xs font-semibold text-black/90 uppercase tracking-wide">SORA Benchmarks</h3>
      </div>

      <div className="flex justify-between mb-2.5">
        <div>
          <p className="text-[10px] text-[#666666]/80">1-Month</p>
          <p className="text-base font-bold text-black/90 leading-tight">{soraBenchmarks.one_month.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-[#666666]/80">3-Month</p>
          <p className="text-base font-bold text-black/90 leading-tight">{soraBenchmarks.three_month.toFixed(2)}%</p>
        </div>
      </div>

      <p className="text-[10px] text-[#666666]/80">Last updated: {formatRelativeDate(updatedAt)}</p>
    </div>
  );
}
