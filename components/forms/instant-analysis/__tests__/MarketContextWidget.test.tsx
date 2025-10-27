import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { MarketContextWidget } from '../MarketContextWidget';

describe('MarketContextWidget', () => {
  const soraBenchmarks = {
    one_month: 1.29,
    three_month: 1.39,
  };

  it('should render SORA rates', () => {
    const updatedAt = new Date().toISOString();
    render(<MarketContextWidget soraBenchmarks={soraBenchmarks} updatedAt={updatedAt} />);

    expect(screen.getByText('SORA Benchmarks')).toBeInTheDocument();
    expect(screen.getByText(/1.29%/)).toBeInTheDocument();
    expect(screen.getByText(/1.39%/)).toBeInTheDocument();
  });

  it('should format dates correctly for same day', () => {
    const now = new Date();
    render(<MarketContextWidget soraBenchmarks={soraBenchmarks} updatedAt={now.toISOString()} />);

    expect(screen.getByText(/Today at/)).toBeInTheDocument();
  });

  it('should format dates correctly for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    render(<MarketContextWidget soraBenchmarks={soraBenchmarks} updatedAt={yesterday.toISOString()} />);

    expect(screen.getByText(/Yesterday at/)).toBeInTheDocument();
  });

  it('should handle missing data', () => {
    const emptySora = { one_month: 0, three_month: 0 };
    render(<MarketContextWidget soraBenchmarks={emptySora} updatedAt={new Date().toISOString()} />);

    expect(screen.getByText('SORA Benchmarks')).toBeInTheDocument();
  });
});
