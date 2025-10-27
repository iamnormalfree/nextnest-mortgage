import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { MarketRateDisplay } from '../MarketRateDisplay';
import { getPlaceholderRates } from '@/lib/types/market-rates';

describe('MarketRateDisplay', () => {
  const marketRates = getPlaceholderRates();
  const currentRate = 3.0;

  it('should render all package types', () => {
    render(<MarketRateDisplay marketRates={marketRates} currentRate={currentRate} />);

    expect(screen.getByText('Market Snapshot')).toBeInTheDocument();
    expect(screen.getByText(/2-Year Fixed/i)).toBeInTheDocument();
    expect(screen.getByText(/3-Year Fixed/i)).toBeInTheDocument();
    expect(screen.getByText(/Floating SORA/i)).toBeInTheDocument();
  });

  it('should show correct colors based on rate comparison', () => {
    const { container } = render(<MarketRateDisplay marketRates={marketRates} currentRate={currentRate} />);

    // 2-Year Fixed (2.15%) < current (3.0%) should be green
    const twoYearSection = container.querySelector('[data-testid="rate-2yr"]');
    expect(twoYearSection).toHaveClass('text-nn-green');

    // Current rate indicator should be red (no better rates)
    const currentSection = container.querySelector('[data-testid="current-rate"]');
    expect(currentSection).toHaveClass('text-nn-red');
  });

  it('should display bank counts', () => {
    render(<MarketRateDisplay marketRates={marketRates} currentRate={currentRate} />);

    expect(screen.getByText(/8 banks offering/i)).toBeInTheDocument();
    expect(screen.getByText(/12 banks offering/i)).toBeInTheDocument();
  });

  it('should handle missing data gracefully', () => {
    const emptyRates = {
      ...marketRates,
      fixed_packages: {
        two_year: { min: 0, max: 0, bank_count: 0 },
        three_year: { min: 0, max: 0, bank_count: 0 },
        five_year: { min: 0, max: 0, bank_count: 0 },
      },
    };

    render(<MarketRateDisplay marketRates={emptyRates} currentRate={currentRate} />);
    
    expect(screen.getByText('Market Snapshot')).toBeInTheDocument();
  });
});
