// ABOUTME: Calculator functions aligned with Dr Elena v2 mortgage expert persona
// ABOUTME: Source: dr-elena-mortgage-expert-v2.json computational_modules
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
  const {
    property_price,
    property_type,
    buyer_profile,
    existing_properties,
    income,
    commitments,
    rate,
    tenure,
    age,
    loan_type = 'new_purchase',
    is_owner_occupied = true
  } = inputs;

  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.ltv_limits.individual_borrowers
  const ltvLimits = {
    first_loan: { max_ltv_base: 75, max_ltv_reduced: 55, min_cash_base: 5, min_cash_reduced: 10 },
    second_loan: { max_ltv_base: 45, max_ltv_reduced: 25, min_cash: 25 },
    third_plus_loan: { max_ltv_base: 35, max_ltv_reduced: 15, min_cash: 25 }
  };

  // Determine if reduced LTV applies based on age/tenure triggers
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.ltv_limits.tenure_or_age_triggers
  const loanEndAge = age + tenure;
  const isReducedLTVTriggered = property_type === 'HDB' ? 
    (tenure > 25) || (loanEndAge > 65) :
    (tenure > 30) || (loanEndAge > 65);

  // Select LTV tier based on existing properties and triggers
  let ltvTier;
  if (existing_properties === 0) {
    ltvTier = isReducedLTVTriggered ? ltvLimits.first_loan.max_ltv_reduced : ltvLimits.first_loan.max_ltv_base;
  } else if (existing_properties === 1) {
    ltvTier = ltvLimits.second_loan.max_ltv_base;
  } else {
    ltvTier = ltvLimits.third_plus_loan.max_ltv_base;
  }

  // Override with manually selected LTV mode for Step 2 UI
  ltvTier = Math.min(ltvTier, ltvMode);

  // Calculate maximum loan amount using loan_from_payment formula inverse
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.loan_from_payment
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = tenure * 12;
  const tdsrAvailable = calculateTDSRAvailable(income, commitments);
  
  // Use stress test rate (4% for residential) as per MAS requirements
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.tdsr_available
  const stressTestRate = property_type === 'Commercial' ? 0.05 : 0.04; // 5% for commercial, 4% for residential
  const monthlyStressRate = stressTestRate / 12;
  
  // Max loan based on income (TDSR constraint)
  const maxLoanByIncome = roundLoanEligibility(
    tdsrAvailable * (Math.pow(1 + monthlyStressRate, numberOfPayments) - 1) / (monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments))
  );

  // Max loan based on LTV constraint
  const maxLoanByLTV = roundLoanEligibility(property_price * (ltvTier / 100));

  // Apply the more restrictive constraint
  let maxLoan = Math.min(maxLoanByIncome, maxLoanByLTV);
  let limitingFactor = maxLoanByIncome < maxLoanByLTV ? 'TDSR' : 'LTV';

  // For HDB properties, also check MSR constraint
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.msr_limit
  let msrLimit: number | undefined;
  let msrRatio: number | undefined;
  let updatedLimitingFactor = limitingFactor;
  
  if (property_type === 'HDB' || (property_type === 'EC' && loan_type === 'new_purchase')) {
    msrLimit = calculateMSRLimit(income);
    const monthlyPayment = roundMonthlyPayment(maxLoan * monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments) / (Math.pow(1 + monthlyStressRate, numberOfPayments) - 1));
    msrRatio = monthlyPayment;
    
    // Check if MSR is more restrictive than the current limiting factor
    if (monthlyPayment > msrLimit) {
      // MSR is more restrictive - recalculate max loan based on MSR limit
      maxLoan = roundLoanEligibility(
        msrLimit * (Math.pow(1 + monthlyStressRate, numberOfPayments) - 1) / (monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments))
      );
      updatedLimitingFactor = 'MSR';
    }
  }

  // Calculate down payment and CPF/cash breakdown
  const downpaymentRequired = roundFundsRequired(property_price - maxLoan);
  
  // CPF allowance rules
  // Source: dr-elena-mortgage-expert-v2.json (general CPF rules, simplified for instant calculation)
  const cpfAllowed = property_type !== 'Commercial' && buyer_profile !== 'Foreigner';
  const cpfAllowedAmount = cpfAllowed ? Math.min(downpaymentRequired * 0.8, 200000) : 0;

  // ABSD rates based on buyer profile and existing properties
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.stamp_duty_rates.absd_residential
  let absdRate = 0;
  if (buyer_profile === 'SC') {
    if (existing_properties === 1) absdRate = 20;
    if (existing_properties >= 2) absdRate = 30;
  } else if (buyer_profile === 'PR') {
    if (existing_properties === 0) absdRate = 5;
    if (existing_properties >= 1) absdRate = 30;
  } else if (buyer_profile === 'Foreigner') {
    absdRate = 60;
  }

  // Determine minimum cash percentage
  let minCashPercent: number;
  if (existing_properties === 0) {
    minCashPercent = isReducedLTVTriggered ? ltvLimits.first_loan.min_cash_reduced : ltvLimits.first_loan.min_cash_base;
  } else {
    minCashPercent = (existing_properties === 1) ? ltvLimits.second_loan.min_cash : ltvLimits.third_plus_loan.min_cash;
  }

  // Generate reason codes and policy references
  const reasonCodes: string[] = [];
  const policyRefs: string[] = [];

  if (limitingFactor === 'TDSR') {
    reasonCodes.push('TDSR_LIMITED');
    policyRefs.push('MAS Notice 645');
  }
  if (limitingFactor === 'MSR') {
    reasonCodes.push('MSR_LIMITED');
    policyRefs.push('MAS Notice 632');
  }
  if (isReducedLTVTriggered && existing_properties === 0) {
    reasonCodes.push('AGE_TENURE_TRIGGER');
    policyRefs.push('MAS Loan Tenure & LTV Limits');
  }
  if (absdRate > 0) {
    reasonCodes.push('ABSD_APPLICABLE');
    policyRefs.push('IRAS ABSD Rates');
  }

  return {
    maxLoan,
    maxLTV: ltvTier,
    minCashPercent,
    absdRate,
    tdsrAvailable,
    limitingFactor: updatedLimitingFactor as 'TDSR' | 'MSR' | 'LTV',
    msrLimit,
    downpaymentRequired,
    cpfAllowed,
    reasonCodes,
    policyRefs
  };
}

/**
 * Calculate compliance snapshot including TDSR and MSR analysis
 * Aligned with Dr Elena v2 persona core formulas and income recognition
 */
export function calculateComplianceSnapshot(
  inputs: ComplianceSnapshotInput
): ComplianceSnapshotResult {
  const {
    income,
    employment_type = 'employed',
    gross_income,
    commitments,
    property_type,
    loan_amount,
    rate,
    tenure
  } = inputs;

  // Calculate recognized income based on employment type
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.income_recognition
  let recognizedIncome: number;
  if (income) {
    recognizedIncome = income; // Already recognized income provided
  } else if (gross_income) {
    recognizedIncome = calculateRecognizedIncome(employment_type, gross_income);
  } else {
    recognizedIncome = 0;
  }

  // Calculate TDSR compliance
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.tdsr_available
  const tdsrLimit = Math.round(recognizedIncome * 0.55 - commitments); // Round to handle floating point precision
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = tenure * 12;
  const monthlyPayment = roundMonthlyPayment(
    loan_amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
  const tdsrRatio = monthlyPayment;
  const isTDSRCompliant = monthlyPayment <= tdsrLimit;

  // Calculate MSR compliance for HDB/EC properties
  // Source: dr-elena-mortgage-expert-v2.json -> computational_modules.core_formulas.msr_limit
  let msrLimit: number | undefined;
  let msrRatio: number | undefined;
  let isMSRCompliant: boolean | undefined;
  
  if (property_type === 'HDB' || property_type === 'EC') {
    msrLimit = Math.round(recognizedIncome * 0.30); // Don't round MSR limit for calculation
    msrRatio = monthlyPayment;
    isMSRCompliant = monthlyPayment <= msrLimit;
  }

  // Determine limiting factor
  let limitingFactor: 'TDSR' | 'MSR' | 'LTV' | undefined;
  if (!isTDSRCompliant) {
    limitingFactor = 'TDSR';
  } else if (isMSRCompliant === false) {
    limitingFactor = 'MSR';
  }

  // Generate reason codes and policy references
  const reasonCodes: string[] = [];
  const policyRefs: string[] = [];

  if (!isTDSRCompliant) {
    reasonCodes.push('TDSR_EXCEEDED');
    policyRefs.push('MAS Notice 645');
  }
  if (isMSRCompliant === false) {
    reasonCodes.push('MSR_EXCEEDED');
    policyRefs.push('MAS Notice 632');
  }
  if (employment_type === 'self_employed' || employment_type === 'variable_income') {
    reasonCodes.push('VARIABLE_INCOME_RECOGNITION');
    policyRefs.push('MAS Income Recognition Guidelines');
  }
  if (limitingFactor) {
    reasonCodes.push('COMPLIANCE_LIMITED');
  }

  return {
    recognizedIncome,
    tdsrLimit,
    tdsrRatio: monthlyPayment,
    isTDSRCompliant,
    msrLimit,
    msrRatio,
    isMSRCompliant,
    limitingFactor,
    reasonCodes,
    policyRefs
  };
}

/**
 * Calculate refinance outlook including cash-out potential and timing guidance
 * Aligned with Dr Elena v2persona specialized calculators
 */
export function calculateRefinanceOutlook(
  inputs: RefinanceOutlookInput
): RefinanceOutlookResult {
  const {
    property_value,
    current_balance = 0,
    current_rate = 0,
    months_remaining = 0,
    property_type = 'Private',
    is_owner_occupied = true,
    objective = 'lower_payment',
    cpf_used = 0,
    outstanding_loan = 0
  } = inputs;

  // Default target rate for calculation (current market rate)
  const targetRate = 2.8;
  const savingsRate = current_rate > targetRate ? current_rate - targetRate : 0;

  // Calculate projected monthly savings
  let projectedMonthlySavings: number | undefined;
  if (current_balance > 0 && savingsRate > 0) {
    const monthlyRate = current_rate / 100 / 12;
    const targetMonthlyRate = targetRate / 100 / 12;
    const remainingPayments = months_remaining || 25 * 12; // Default to 25 years if not specified
    
    const currentMonthlyPayment = roundMonthlyPayment(
      current_balance * monthlyRate * Math.pow(1 + monthlyRate, remainingPayments) / 
      (Math.pow(1 + monthlyRate, remainingPayments) - 1)
    );
    
    const targetMonthlyPayment = roundMonthlyPayment(
      current_balance * targetMonthlyRate * Math.pow(1 + targetMonthlyRate, remainingPayments) / 
      (Math.pow(1 + targetMonthlyRate, remainingPayments) - 1)
    );
    
    projectedMonthlySavings = currentMonthlyPayment - targetMonthlyPayment;
  }

  // Calculate maximum cash-out amount (only for private properties)
  // Source: Dr Elena v2 persona guidance on cash-out refinancing
  let maxCashOut = 0;
  if (property_type === 'Private') {
    // Handle different input combinations
    let outstandingLoanAmount = 0;
    let propertyValuation = 0;
    
    if (outstanding_loan) {
      outstandingLoanAmount = outstanding_loan;
    } else if (current_balance) {
      outstandingLoanAmount = current_balance;
    }
    
    if (property_value) {
      propertyValuation = property_value;
    } else if (current_balance && property_type === 'Private') {
      // If no property value, estimate as 1.3x current balance for private property
      propertyValuation = current_balance * 1.3;
    }
    
    if (propertyValuation > 0 && outstandingLoanAmount > 0) {
      // Maximum LTV for refinance cash-out is typically 75% of property value
      // Less outstanding loan and CPF used returns the cash-out available
      const maxRefinanceAmount = roundLoanEligibility(propertyValuation * 0.75);
      const equityAvailable = maxRefinanceAmount - outstandingLoanAmount;
      maxCashOut = Math.max(0, roundFundsRequired(equityAvailable));
    }
  }
  
  // HDB/EC typically cannot cash-out refinancing
  if (property_type === 'HDB' || property_type === 'EC') {
    maxCashOut = 0;
  }

  // Generate timing guidance based on months remaining
  let timingGuidance: string;
  if (months_remaining === 0) {
    timingGuidance = 'Consider refinancing immediately - no penalty period remaining';
  } else if (months_remaining <= 6) {
    timingGuidance = 'Good timing to refinance - minimal penalty period remaining';
  } else if (months_remaining <= 18) {
    timingGuidance = 'Review refinancing options - penalty period still applies';
  } else {
    timingGuidance = 'Wait until penalty period ends (typically 2-3 years) for maximum savings';
  }

  // Generate recommendations based on objective and property type
  const recommendations: string[] = [];
  const reasonCodes: string[] = [];
  const policyRefs: string[] = [];

  if (objective === 'lower_payment' && projectedMonthlySavings && projectedMonthlySavings > 100) {
    recommendations.push(`Potential monthly savings of $${projectedMonthlySavings.toLocaleString()}`);
    reasonCodes.push('PAYMENT_REDUCTION_AVAILABLE');
  }

  if (objective === 'cash_out' && maxCashOut > 50000) {
    recommendations.push(`Cash-out refinancing available up to $${maxCashOut.toLocaleString()}`);
    reasonCodes.push('CASH_OUT_ELIGIBLE');
    policyRefs.push('Bank Cash-out Refinancing Policies');
  }

  if (property_type === 'Private' && is_owner_occupied) {
    recommendations.push('Owner-occupied private property qualifies for best rates');
    reasonCodes.push('OWNER_OCCUPIED_PRIVATE');
  }

  if (property_type === 'HDB') {
    recommendations.push('HDB refinancing limited to loan balance - no cash-out option');
    reasonCodes.push('HDB_NO_CASH_OUT');
    policyRefs.push('HDB Refinancing Guidelines');
  }

  if (savingsRate > 1.0) {
    recommendations.push('Significant rate differential makes refinancing attractive');
    reasonCodes.push('HIGH_RATE_DIFFERENTIAL');
  }

  if (months_remaining > 24) {
    recommendations.push('Consider penalty waiver negotiation with current bank');
    reasonCodes.push('PENALTY_PERIOD_ACTIVE');
    policyRefs.push('Mortgage Penalty Clauses');
  }

  // Default recommendation if none specific
  if (recommendations.length === 0) {
    recommendations.push('Review your current loan terms to determine refinancing benefits');
    reasonCodes.push('REVIEW_RECOMMENDED');
  }

  return {
    projectedMonthlySavings,
    maxCashOut,
    timingGuidance,
    recommendations,
    reasonCodes,
    policyRefs
  };
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
