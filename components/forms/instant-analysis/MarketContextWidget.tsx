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
    <div className="border border-[#E5E5E5] bg-[#F8F8F8] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-black">SORA Benchmarks</h3>
      </div>

      <div className="flex justify-between mb-3">
        <div>
          <p className="text-xs text-[#666666]">1-Month</p>
          <p className="text-lg font-bold text-black">{soraBenchmarks.one_month.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-[#666666]">3-Month</p>
          <p className="text-lg font-bold text-black">{soraBenchmarks.three_month.toFixed(2)}%</p>
        </div>
      </div>

      <p className="text-xs text-[#666666]">Last updated: {formatRelativeDate(updatedAt)}</p>
    </div>
  );
}
