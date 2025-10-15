// ABOUTME: Calculator functions aligned with Dr Elena v2 mortgage expert persona
// These functions implement the core calculation logic for instant analysis, compliance, and refinance outlook

export interface InstantProfileInput {
  property_price: number;
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial';
  buyer_profile: 'SC' | 'PR' | 'Foreigner';
  existing_properties: number;
  income: number;
  commitments: number;
  rate: number;
  tenure: number;
  age: number;
  loan_type?: 'new_purchase' | 'refinance';
  is_owner_occupied?: boolean;
}

export interface InstantProfileResult {
  maxLoan: number;
  maxLTV: number;
  minCashPercent: number;
  absdRate: number;
  tdsrAvailable: number;
  limitingFactor: 'TDSR' | 'MSR' | 'LTV';
  msrLimit?: number;
  downpaymentRequired: number;
  cpfAllowed: boolean;
  reasonCodes: string[];
  policyRefs: string[];
}

export interface ComplianceSnapshotInput {
  income?: number;
  employment_type?: 'employed' | 'self_employed' | 'variable_income' | 'not_working';
  gross_income?: number;
  commitments: number;
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial';
  loan_amount: number;
  rate: number;
  tenure: number;
  recognizedIncome?: number;
}

export interface ComplianceSnapshotResult {
  recognizedIncome: number;
  tdsrLimit: number;
  tdsrRatio: number;
  isTDSRCompliant: boolean;
  msrLimit?: number;
  msrRatio?: number;
  isMSRCompliant?: boolean;
  limitingFactor?: 'TDSR' | 'MSR' | 'LTV';
  reasonCodes: string[];
  policyRefs: string[];
}

export interface RefinanceOutlookInput {
  property_value?: number;
  current_balance?: number;
  current_rate?: number;
  months_remaining?: number;
  property_type?: 'HDB' | 'Private' | 'EC' | 'Commercial';
  is_owner_occupied?: boolean;
  objective?: 'lower_payment' | 'shorten_tenure' | 'rate_certainty';
 cpf_used?: number;
 outstanding_loan?: number;
}

export interface RefinanceOutlookResult {
  projectedMonthlySavings?: number;
  maxCashOut: number;
  timingGuidance: string;
  recommendations: string[];
  reasonCodes: string[];
  policyRefs: string[];
}

/**
 * Calculate instant profile including LTV, TDSR, MSR, and down payment analysis
 * Aligned with Dr Elena v2 persona computational modules
 */
export function calculateInstantProfile(
  inputs: InstantProfileInput,
  ltvMode: number = 75
): InstantProfileResult {
  // TODO: Implement calculation logic aligned with persona
  throw new Error('Not implemented: calculateInstantProfile - requires person-aligned calculation logic');
}

/**
 * Calculate compliance snapshot including TDSR and MSR analysis
 * Aligned with Dr Elena v2 persona core formulas and income recognition
 */
export function calculateComplianceSnapshot(
  inputs: ComplianceSnapshotInput
): ComplianceSnapshotResult {
  // TODO: Implement calculation logic aligned with persona
  throw new Error('Not implemented: calculateComplianceSnapshot - requires person-aligned calculation logic');
}

/**
 * Calculate refinance outlook including cash-out potential and timing guidance
 * Aligned with Dr Elena v2persona specialized calculators
 */
export function calculateRefinanceOutlook(
  inputs: RefinanceOutlookInput
): RefinanceOutlookResult {
  // TODO: Implement calculation logic aligned with persona
  throw new Error('Not implemented: calculateRefinanceOutlook - requires person-aligned calculation logic');
}

/**
 * Helper function for loan eligibility rounding (ROUND DOWN to nearest thousand)
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.rounding_rules.loan_eligibility
 */
export function roundLoanEligibility(amount: number): number {
  return Math.floor(amount / 1000) * 1000;
}

/**
 * Helper function for funds required rounding (ROUND UP to nearest thousand)
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.rounding_rules.funds_required
 */
export function roundFundsRequired(amount: number): number {
  return Math.ceil(amount / 1000) * 1000;
}

/**
 * Helper function for monthly payment rounding (ROUND UP to nearest dollar)
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.rounding_rules.monthly_payments
 */
export function roundMonthlyPayment(amount: number): number {
  return Math.ceil(amount);
}

/**
 * Calculate recognized income based on employment type
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.income_recognition
 */
export function calculateRecognizedIncome(
  employmentType: string,
  grossIncome: number
): number {
  const recognitionRates = {
    'employed': 1.0,
    'self_employed': 0.7,
    'variable_income': 0.7,
    'rental_income': 0.7,
    'not_working': 0,
    'other': 1.0
  };

  const rate = recognitionRates[employmentType as keyof typeof recognitionRates] || 1.0;
  return Math.floor(grossIncome * rate);
}

/**
 * Calculate TDSR available amount
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.tdsr_available
 */
export function calculateTDSRAvailable(income: number, commitments: number): number {
  return Math.floor((income * 0.55) - commitments);
}

/**
 * Calculate MSR limit for HDB/EC properties
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.msr_limit
 */
export function calculateMSRLimit(income: number): number {
  return Math.floor(income * 0.30);
}

/**
 * Calculate monthly credit card commitment
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.commitment_calculations.credit_cards
 */
export function calculateCreditCardCommitment(outstandingBalance: number): number {
  return Math.max(outstandingBalance * 0.03, 50);
}

/**
 * Calculate overdraft facility commitment
 * Source: dr-elena-mortgage-expert-v2.json -> computational_modules.commitment_calculations.overdraft_facilities
 */
export function calculateOverdraftCommitment(facilityLimit: number): number {
  return facilityLimit * 0.05;
}
