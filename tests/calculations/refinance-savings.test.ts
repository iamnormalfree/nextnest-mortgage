import { describe, it, expect } from '@jest/globals';
import { calculateInterestSavings } from '@/lib/calculations/refinance-savings';

describe('calculateInterestSavings', () => {
  it('should calculate 2-year savings correctly', () => {
    const result = calculateInterestSavings(400000, 0.03, 0.0215, 2);

    // Current: 400k × 3% × 2 = $24,000
    // New: 400k × 2.15% × 2 = $17,200
    // Savings: $6,800
    expect(result.savings).toBe(6800);
    expect(result.currentInterest).toBe(24000);
    expect(result.newInterest).toBe(17200);
  });

  it('should calculate 3-year savings correctly', () => {
    const result = calculateInterestSavings(400000, 0.03, 0.0215, 3);

    // Current: 400k × 3% × 3 = $36,000
    // New: 400k × 2.15% × 3 = $25,800
    // Savings: $10,200
    expect(result.savings).toBe(10200);
  });

  it('should return zero for zero outstanding loan', () => {
    const result = calculateInterestSavings(0, 0.03, 0.0215, 2);

    expect(result.savings).toBe(0);
    expect(result.currentInterest).toBe(0);
    expect(result.newInterest).toBe(0);
  });

  it('should clamp negative savings to zero', () => {
    // Target rate HIGHER than current (no benefit to refinance)
    const result = calculateInterestSavings(400000, 0.02, 0.03, 2);

    expect(result.savings).toBe(0);
  });

  it('should round savings down to nearest $100', () => {
    // Create scenario that results in raw savings needing rounding
    // 400k × (0.0301875 - 0.0215) × 2 = 6,950 → should round down to 6,900
    const result = calculateInterestSavings(400000, 0.0301875, 0.0215, 2);

    // Should round $6,950 → $6,900
    expect(result.savings).toBe(6900);
  });
});
