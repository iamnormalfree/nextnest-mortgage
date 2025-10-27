import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { RefinanceOutlookSidebar } from '../RefinanceOutlookSidebar';
import type { RefinanceOutlookResult } from '@/lib/calculations/instant-profile';
import { getPlaceholderRates } from '@/lib/types/market-rates';
import { generateSavingsScenarios } from '@/lib/calculations/refinance-savings';

describe('RefinanceOutlookSidebar', () => {
  const marketRates = getPlaceholderRates();
  const savingsScenarios = generateSavingsScenarios(400000, 0.03, marketRates);

  const mockOutlookWithScenarios: RefinanceOutlookResult = {
    maxCashOut: 200000,
    timingGuidance: 'Favorable conditions for refinancing',
    recommendations: ['review_recommended'],
    reasonCodes: ['mas_compliant_calculation'],
    policyRefs: ['MAS Notice 645'],
    ltvCapApplied: 75,
    cpfRedemptionAmount: 50000,
    savingsScenarios,
  };

  it('should render all 3 child components', () => {
    render(<RefinanceOutlookSidebar outlookResult={mockOutlookWithScenarios} isLoading={false} currentRate={3.0} />);

    // Check for MarketRateDisplay
    expect(screen.getByText('Market Snapshot')).toBeInTheDocument();

    // Check for SavingsDisplay
    expect(screen.getByText('Potential Savings')).toBeInTheDocument();

    // Check for MarketContextWidget
    expect(screen.getByText('SORA Benchmarks')).toBeInTheDocument();
  });

  it('should show loading state when data missing', () => {
    render(<RefinanceOutlookSidebar outlookResult={null} isLoading={true} currentRate={3.0} />);

    expect(screen.getByText('Refinance Outlook')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for data/)).toBeInTheDocument();
  });

  it('should handle missing savingsScenarios gracefully', () => {
    const outlookWithoutScenarios: RefinanceOutlookResult = {
      ...mockOutlookWithScenarios,
      savingsScenarios: undefined,
    };

    render(<RefinanceOutlookSidebar outlookResult={outlookWithoutScenarios} isLoading={false} currentRate={3.0} />);

    // Should still render something, possibly a loading state or empty state
    expect(screen.getByText('Refinance Outlook')).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    const { container } = render(<RefinanceOutlookSidebar outlookResult={mockOutlookWithScenarios} isLoading={false} currentRate={3.0} />);

    // Check for space-y-4 spacing
    const parentDiv = container.querySelector('.space-y-4');
    expect(parentDiv).toBeInTheDocument();
  });
});
