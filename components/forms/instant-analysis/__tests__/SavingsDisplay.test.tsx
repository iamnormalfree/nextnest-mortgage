import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { SavingsDisplay } from '../SavingsDisplay';
import type { SavingsScenario } from '@/lib/calculations/refinance-savings';

describe('SavingsDisplay', () => {
  const mockScenarios: SavingsScenario[] = [
    {
      packageType: '2-Year Fixed',
      rate: 2.15,
      savingsTwoYear: 6800,
      savingsThreeYear: 10200,
    },
    {
      packageType: '3-Year Fixed',
      rate: 2.35,
      savingsTwoYear: 5200,
      savingsThreeYear: 7800,
    },
    {
      packageType: 'Floating SORA',
      rate: 2.60,
      savingsTwoYear: 3200,
      savingsThreeYear: 4800,
    },
  ];

  it('should render savings amounts', () => {
    render(<SavingsDisplay scenarios={mockScenarios} outstandingLoan={400000} />);

    expect(screen.getByText('Potential Savings')).toBeInTheDocument();
    expect(screen.getByText(/6,800/)).toBeInTheDocument(); // Best 2-year savings
    expect(screen.getByText(/10,200/)).toBeInTheDocument(); // Best 3-year savings
  });

  it('should have ~ prefix for all dollar amounts', () => {
    render(<SavingsDisplay scenarios={mockScenarios} outstandingLoan={400000} />);

    const savingsText = screen.getByText(/~\$6,800/);
    expect(savingsText).toBeInTheDocument();
  });

  it('should include legal disclaimer with exact match', () => {
    render(<SavingsDisplay scenarios={mockScenarios} outstandingLoan={400000} />);

    expect(screen.getByText(/This is not a guarantee/)).toBeInTheDocument();
    expect(screen.getByText(/Actual savings depend/)).toBeInTheDocument();
  });

  it('should NOT contain "will save" language', () => {
    const { container } = render(<SavingsDisplay scenarios={mockScenarios} outstandingLoan={400000} />);

    expect(container.textContent).not.toMatch(/will save/i);
  });

  it('should use "could save" language', () => {
    render(<SavingsDisplay scenarios={mockScenarios} outstandingLoan={400000} />);

    // Check for hedging language somewhere in component
    expect(screen.getByText(/potential/i) || screen.getByText(/estimated/i) || screen.getByText(/could/i)).toBeTruthy();
  });
});
