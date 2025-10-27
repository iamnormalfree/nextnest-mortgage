// ABOUTME: Calculates interest savings for refinance scenarios using simple interest (conservative)
// ABOUTME: Used by Step 2 refinance form to show potential savings over 2-3 year windows

/**
 * Calculates interest savings using simple interest formula (conservative estimate).
 *
 * Formula:
 * - Current interest = outstanding × currentRate × years
 * - New interest = outstanding × targetRate × years
 * - Savings = current - new (clamped to 0 minimum)
 *
 * Why simple interest:
 * - Conservative (actual savings higher with amortization)
 * - Easy to explain to users
 * - No need to know exact tenure
 *
 * @param outstandingLoan - Current loan balance
 * @param currentRate - Current interest rate as decimal (e.g., 0.03 for 3%)
 * @param targetRate - Target refinance rate as decimal
 * @param years - Time window for savings calculation (typically 2-3)
 * @returns Interest savings breakdown
 */
export function calculateInterestSavings(
  outstandingLoan: number,
  currentRate: number,
  targetRate: number,
  years: number
): InterestSavingsResult {
  // Validate inputs
  if (outstandingLoan <= 0 || years <= 0) {
    return { savings: 0, currentInterest: 0, newInterest: 0 };
  }

  // Simple interest calculation
  const currentInterest = outstandingLoan * currentRate * years;
  const newInterest = outstandingLoan * targetRate * years;

  // Calculate savings (clamp to 0 if negative)
  const rawSavings = currentInterest - newInterest;
  const savings = Math.max(0, rawSavings);

  // Round savings DOWN to nearest $100 (conservative, per Dr Elena v2)
  const roundedSavings = Math.floor(savings / 100) * 100;

  return {
    savings: roundedSavings,
    currentInterest: Math.round(currentInterest),
    newInterest: Math.round(newInterest),
  };
}

export interface InterestSavingsResult {
  /** Total interest savings over period (rounded down to $100) */
  savings: number;
  /** Interest paid at current rate */
  currentInterest: number;
  /** Interest paid at new rate */
  newInterest: number;
}
