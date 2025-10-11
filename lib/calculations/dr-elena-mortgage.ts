/**
 * Dr. Elena's MAS-Compliant Mortgage Calculations
 * Pure functions - deterministic, no AI/LLM
 *
 * Compliance: MAS Notice 632 (LTV), MAS Notice 645 (TDSR)
 * Rounding: Client-protective standards
 * Version: 2.0.0
 */

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface LoanCalculationInputs {
  propertyPrice: number;
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial';
  monthlyIncome: number;
  existingCommitments: number;
  age: number;
  citizenship: 'Citizen' | 'PR' | 'Foreigner';
  propertyCount: 1 | 2 | 3;
  coApplicant?: {
    monthlyIncome: number;
    age: number;
    existingCommitments: number;
  };
}

export interface LoanCalculationResult {
  // Loan eligibility
  maxLoan: number;
  ltvApplied: number;
  ltvPenalty: boolean;

  // Payment calculations
  monthlyPayment: number;
  stressTestPayment: number;

  // Compliance
  tdsrUsed: number;
  msrUsed: number | null;
  limitingFactor: 'TDSR' | 'MSR' | 'LTV';

  // Funds required
  downPayment: number;
  minCashRequired: number;
  cpfAllowed: number;
  stampDuty: number;
  totalFundsRequired: number;

  // Tenure
  maxTenure: number;
  recommendedTenure: number;

  // Regulatory
  reasoning: string[];
  masCompliant: boolean;
  warnings: string[];
}

export interface TDSRCalculation {
  tdsrRatio: number;
  available: number;
  compliant: boolean;
  stressTestRate: number;
}

export interface MSRCalculation {
  msrLimit: number | null;
  applicable: boolean;
}

export interface StampDutyCalculation {
  bsd: number;
  absd: number;
  total: number;
  breakdown: string[];
}

// ============================================================================
// MAS REGULATORY CONSTANTS
// ============================================================================

const MAS_REGULATIONS = {
  TDSR_LIMIT: 0.55,  // 55% of gross income
  MSR_LIMIT: 0.30,   // 30% of gross income (HDB/EC only)
  STRESS_TEST_RATES: {
    RESIDENTIAL: 4.0,  // 4% for residential properties
    COMMERCIAL: 5.0     // 5% for commercial properties
  },
  LTV_LIMITS: {
    FIRST_PROPERTY: 75,
    SECOND_PROPERTY: 45,
    THIRD_PROPERTY: 35
  },
  EXTENDED_TENURE_PENALTY: 5,  // -5% LTV if tenure > 30 years
  MIN_CASH_PERCENT: {
    STANDARD: 5,
    WITH_PENALTY: 10
  },
  AGE_LIMITS: {
    HDB_EC: 65,
    PRIVATE: 75
  },
  MAX_TENURE: {
    HDB_EC: 25,
    PRIVATE: 35
  }
};

// BSD Progressive Rates (Buyer's Stamp Duty)
const BSD_RATES = [
  { threshold: 180000, rate: 0.01 },
  { threshold: 180000, rate: 0.02 },   // $180k-$360k
  { threshold: 640000, rate: 0.03 },   // $360k-$1M
  { threshold: 500000, rate: 0.04 },   // $1M-$1.5M
  { threshold: Infinity, rate: 0.05 }  // Above $1.5M
];

// ABSD Rates (Additional Buyer's Stamp Duty)
const ABSD_RATES = {
  Citizen: { first: 0, second: 20, third: 30 },
  PR: { first: 5, second: 30, third: 35 },
  Foreigner: { first: 60, second: 60, third: 60 }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Round loan amount DOWN to nearest $1,000 (client protection)
 */
function roundLoanDown(amount: number): number {
  return Math.floor(amount / 1000) * 1000;
}

/**
 * Round payment UP to nearest $1 (client protection)
 */
function roundPaymentUp(amount: number): number {
  return Math.ceil(amount);
}

/**
 * Round funds required UP to nearest $1,000 (client protection)
 */
function roundFundsUp(amount: number): number {
  return Math.ceil(amount / 1000) * 1000;
}

/**
 * Round percentage to 2 decimal places
 */
function roundPercent(percent: number): number {
  return Math.round(percent * 100) / 100;
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate TDSR with stress test rates
 * MAS Notice 645: Total Debt Servicing Ratio must not exceed 55%
 */
export function calculateTDSR(
  monthlyIncome: number,
  existingCommitments: number,
  proposedPayment: number,
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial'
): TDSRCalculation {
  const stressTestRate = (propertyType === 'Commercial')
    ? MAS_REGULATIONS.STRESS_TEST_RATES.COMMERCIAL
    : MAS_REGULATIONS.STRESS_TEST_RATES.RESIDENTIAL;

  const available = (monthlyIncome * MAS_REGULATIONS.TDSR_LIMIT) - existingCommitments;
  const tdsrRatio = ((proposedPayment + existingCommitments) / monthlyIncome) * 100;

  return {
    tdsrRatio: roundPercent(tdsrRatio),
    available: Math.floor(available),  // Client-protective: round DOWN
    compliant: tdsrRatio <= (MAS_REGULATIONS.TDSR_LIMIT * 100),
    stressTestRate
  };
}

/**
 * Calculate MSR (HDB/EC only)
 * MAS Notice 632: Mortgage Servicing Ratio must not exceed 30% for HDB/EC
 */
export function calculateMSR(
  monthlyIncome: number,
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial'
): MSRCalculation {
  if (propertyType === 'Private' || propertyType === 'Commercial') {
    return { msrLimit: null, applicable: false };
  }

  return {
    msrLimit: Math.floor(monthlyIncome * MAS_REGULATIONS.MSR_LIMIT),  // Round DOWN
    applicable: true
  };
}

/**
 * Calculate monthly payment using standard mortgage formula
 * Client-protective: Round UP to nearest $1
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  interestRate: number,  // Annual percentage
  tenureYears: number
): {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
} {
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = tenureYears * 12;

  // Standard mortgage formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const exactPayment = loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const monthlyPayment = roundPaymentUp(exactPayment);
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;

  return {
    monthlyPayment,
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment)
  };
}

/**
 * Calculate IWAA for joint applications
 * Income-Weighted Average Age: Round UP for conservative tenure calculation
 */
export function calculateIWAA(
  applicants: Array<{ age: number; income: number }>
): number {
  const totalWeightedAge = applicants.reduce(
    (sum, a) => sum + (a.age * a.income), 0
  );
  const totalIncome = applicants.reduce((sum, a) => sum + a.income, 0);

  // Dr. Elena: Round UP for conservative tenure calculation
  return Math.ceil(totalWeightedAge / totalIncome);
}

/**
 * Calculate stamp duties (BSD + ABSD)
 */
export function calculateStampDuty(
  propertyPrice: number,
  citizenship: 'Citizen' | 'PR' | 'Foreigner',
  propertyCount: number,
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial'
): StampDutyCalculation {
  // Calculate BSD (progressive rates)
  let bsd = 0;
  let remaining = propertyPrice;
  const breakdown: string[] = [];

  for (const tier of BSD_RATES) {
    const taxableAmount = Math.min(remaining, tier.threshold);
    const tax = taxableAmount * tier.rate;
    bsd += tax;
    remaining -= taxableAmount;

    if (tax > 0) {
      breakdown.push(`BSD: $${taxableAmount.toLocaleString()} @ ${tier.rate * 100}% = $${Math.round(tax).toLocaleString()}`);
    }

    if (remaining <= 0) break;
  }

  bsd = Math.round(bsd);

  // Calculate ABSD
  let absd = 0;
  const absdRates = ABSD_RATES[citizenship];

  if (propertyType !== 'HDB' && propertyType !== 'EC') {  // ABSD applies to private/commercial
    let absdRate = 0;
    if (propertyCount === 1) absdRate = absdRates.first;
    else if (propertyCount === 2) absdRate = absdRates.second;
    else absdRate = absdRates.third;

    absd = Math.round(propertyPrice * (absdRate / 100));

    if (absd > 0) {
      breakdown.push(`ABSD: $${propertyPrice.toLocaleString()} @ ${absdRate}% = $${absd.toLocaleString()}`);
    }
  }

  return {
    bsd,
    absd,
    total: bsd + absd,
    breakdown
  };
}

/**
 * Main function: Calculate maximum loan amount with MAS compliance
 */
export function calculateMaxLoanAmount(
  inputs: LoanCalculationInputs
): LoanCalculationResult {
  const reasoning: string[] = [];
  const warnings: string[] = [];

  // Determine LTV based on property count
  let baseLTV = MAS_REGULATIONS.LTV_LIMITS.FIRST_PROPERTY;
  if (inputs.propertyCount === 2) baseLTV = MAS_REGULATIONS.LTV_LIMITS.SECOND_PROPERTY;
  if (inputs.propertyCount >= 3) baseLTV = MAS_REGULATIONS.LTV_LIMITS.THIRD_PROPERTY;

  reasoning.push(`Base LTV: ${baseLTV}% for ${inputs.propertyCount === 1 ? 'first' : inputs.propertyCount === 2 ? 'second' : 'third+'} property`);

  // Calculate max tenure based on age
  const ageLimit = (inputs.propertyType === 'HDB' || inputs.propertyType === 'EC')
    ? MAS_REGULATIONS.AGE_LIMITS.HDB_EC
    : MAS_REGULATIONS.AGE_LIMITS.PRIVATE;

  const tenureLimit = (inputs.propertyType === 'HDB' || inputs.propertyType === 'EC')
    ? MAS_REGULATIONS.MAX_TENURE.HDB_EC
    : MAS_REGULATIONS.MAX_TENURE.PRIVATE;

  const maxTenure = Math.min(tenureLimit, ageLimit - inputs.age);
  reasoning.push(`Max tenure: ${maxTenure} years (limit: ${tenureLimit}, age: ${inputs.age})`);

  // Check for extended tenure penalty
  let effectiveLTV = baseLTV;
  let minCashPercent = MAS_REGULATIONS.MIN_CASH_PERCENT.STANDARD;
  let ltvPenalty = false;

  if (maxTenure > 30 || (inputs.age + maxTenure) > ageLimit) {
    effectiveLTV = baseLTV - MAS_REGULATIONS.EXTENDED_TENURE_PENALTY;
    minCashPercent = MAS_REGULATIONS.MIN_CASH_PERCENT.WITH_PENALTY;
    ltvPenalty = true;
    warnings.push(`Extended tenure penalty: -5% LTV (${baseLTV}% → ${effectiveLTV}%)`);
    reasoning.push('MAS Notice 632: Extended tenure penalty applied');
  }

  // Calculate TDSR and MSR limits
  const tdsrCalc = calculateTDSR(
    inputs.monthlyIncome,
    inputs.existingCommitments,
    0,  // Will calculate iteratively
    inputs.propertyType
  );

  const msrCalc = calculateMSR(inputs.monthlyIncome, inputs.propertyType);

  // Determine effective monthly limit
  let effectiveMonthlyLimit = tdsrCalc.available;
  let limitingFactor: 'TDSR' | 'MSR' | 'LTV' = 'TDSR';

  if (msrCalc.applicable && msrCalc.msrLimit !== null) {
    if (msrCalc.msrLimit < tdsrCalc.available) {
      effectiveMonthlyLimit = msrCalc.msrLimit;
      limitingFactor = 'MSR';
      reasoning.push(`MSR limit ($${msrCalc.msrLimit}) is more restrictive than TDSR ($${tdsrCalc.available})`);
    } else {
      reasoning.push(`TDSR limit ($${tdsrCalc.available}) is more restrictive than MSR ($${msrCalc.msrLimit})`);
    }
  }

  // Calculate max loan from payment limit
  const monthlyRate = tdsrCalc.stressTestRate / 100 / 12;
  const numPayments = maxTenure * 12;
  const maxLoanFromPayment = roundLoanDown(
    effectiveMonthlyLimit * ((Math.pow(1 + monthlyRate, numPayments) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, numPayments)))
  );

  // Calculate max loan from LTV
  const maxLoanFromLTV = roundLoanDown(inputs.propertyPrice * (effectiveLTV / 100));

  // Use whichever is more restrictive
  let maxLoan = Math.min(maxLoanFromPayment, maxLoanFromLTV);
  if (maxLoan === maxLoanFromLTV) {
    limitingFactor = 'LTV';
    reasoning.push(`LTV limit ($${maxLoanFromLTV.toLocaleString()}) is more restrictive`);
  }

  // Calculate final monthly payment
  const finalPayment = calculateMonthlyPayment(
    maxLoan,
    tdsrCalc.stressTestRate,
    maxTenure
  );

  // Calculate funds required
  const downPayment = inputs.propertyPrice - maxLoan;
  const minCashRequired = roundFundsUp(inputs.propertyPrice * (minCashPercent / 100));
  const cpfAllowed = downPayment - minCashRequired;

  const stampDuty = calculateStampDuty(
    inputs.propertyPrice,
    inputs.citizenship,
    inputs.propertyCount,
    inputs.propertyType
  );

  const totalFundsRequired = minCashRequired + stampDuty.total;

  // Calculate TDSR usage
  const finalTDSR = calculateTDSR(
    inputs.monthlyIncome,
    inputs.existingCommitments,
    finalPayment.monthlyPayment,
    inputs.propertyType
  );

  // Compliance check
  const masCompliant = finalTDSR.compliant && maxLoan > 0;
  if (!masCompliant) {
    warnings.push('TDSR exceeds 55% limit - loan may not be approved');
  }

  return {
    maxLoan,
    ltvApplied: effectiveLTV,
    ltvPenalty,
    monthlyPayment: finalPayment.monthlyPayment,
    stressTestPayment: finalPayment.monthlyPayment,
    tdsrUsed: finalTDSR.tdsrRatio,
    msrUsed: msrCalc.applicable ? roundPercent((finalPayment.monthlyPayment / inputs.monthlyIncome) * 100) : null,
    limitingFactor,
    downPayment: roundFundsUp(downPayment),
    minCashRequired,
    cpfAllowed,
    stampDuty: stampDuty.total,
    totalFundsRequired: roundFundsUp(totalFundsRequired),
    maxTenure,
    recommendedTenure: Math.min(maxTenure, 30),  // Recommend avoiding penalty
    reasoning,
    masCompliant,
    warnings
  };
}
