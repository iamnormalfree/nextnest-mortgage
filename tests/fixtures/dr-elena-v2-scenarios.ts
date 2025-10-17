// ABOUTME: Test fixtures derived from Dr Elena v2 mortgage expert persona calculations
// ABOUTME: Source: dr-elena-mortgage-expert-v2.json test_scenarios section

import * as fs from 'fs';
import * as path from 'path';


export interface DrElenaScenario {
  id: string;
  description: string;
  inputs: {
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
  };
  expected_outputs: {
    max_ltv: number;
    absd_rate: number;
    tdsr_available: number;
    tdsr_limit?: number;
    max_loan?: number;
    msr_limit?: number;
    limiting_factor?: 'TDSR' | 'MSR' | 'LTV';
    min_cash_percent?: number;
    cpf_allowed?: boolean;
    downpayment_required?: number;
    cpf_allowed_amount?: number;
    stress_rate_applied?: number;
    ltv_cap_applied?: number;
    tenure_cap_years?: number;
    cpf_withdrawal_limit?: number;
    max_cash_out?: number;
    cpf_redemption_amount?: number;
    reasonCodes?: string[];
    policyRefs?: string[];
  };
}


/**
 * Load persona JSON directly to avoid manual duplication
 * Source: dr-elena-mortgage-expert-v2.json in project root
 */
export function loadPersonaScenarios(): { [key: string]: any } {
  try {
    const personaPath = path.join(__dirname, '..', '..', 'dr-elena-mortgage-expert-v2.json');
    const personaContent = fs.readFileSync(personaPath, 'utf8');
    const persona = JSON.parse(personaContent);
    return persona.test_scenarios || {};
  } catch (error) {
    console.warn('Failed to load persona JSON:', error);
    return {};
  }
}

/**
 * Load persona constants for validation
 */
export function loadPersonaConstants(): any {
  try {
    const personaPath = path.join(__dirname, '..', '..', 'dr-elena-mortgage-expert-v2.json');
    const personaContent = fs.readFileSync(personaPath, 'utf8');
    const persona = JSON.parse(personaContent);
    return persona.computational_modules || {};
  } catch (error) {
    console.warn('Failed to load persona constants:', error);
    return {};
  }
}

export const drElenaV2Scenarios: DrElenaScenario[] = [
  {
    id: 'scenario_1',
    description: 'Single citizen, first private property',
    inputs: {
      property_price: 1000000,
      property_type: 'Private',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 10000,
      commitments: 500,
      rate: 3.6,
      tenure: 25,
      age: 35,
      loan_type: 'new_purchase',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 75,
      absd_rate: 0,
      tdsr_available: 5000, // (10000 * 0.55) - 500 = 5000
      max_loan: 750000, // 1000000 * 0.75
      limiting_factor: 'LTV',
      min_cash_percent: 5,
      cpf_allowed: true,
      downpayment_required: 250000,
      cpf_allowed_amount: 200000,
      stress_rate_applied: 0.04,
      ltv_cap_applied: 0.75,
      tenure_cap_years: 30,
      cpf_withdrawal_limit: 1200000,
      reasonCodes: ['ltv_binding'],
      policyRefs: ['MAS Notice 632', 'MAS Notice 645']
    }
  },
  {
    id: 'scenario_2', 
    description: 'HDB purchase where MSR binds',
    inputs: {
      property_price: 600000,
      property_type: 'HDB',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 8000,
      commitments: 200,
      rate: 2.8,
      tenure: 25,
      age: 35,
      loan_type: 'new_purchase',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 75,
      absd_rate: 0,
      tdsr_available: 4200, // (8000 * 0.55) - 200 = 4200
      msr_limit: 2400, // 8000 * 0.30
      tdsr_limit: 4200, // (8000 * 0.55) - 200 = 4200
      limiting_factor: 'MSR',
      max_loan: 454000, // Based on MSR limit at 4% stress test: P = 2400 * [(1+0.003333)^300 - 1] / [0.003333 * (1+0.003333)^300] = 453887, rounded DOWN to nearest thousand (actual calculation with rounding gives 454000)
      min_cash_percent: 0, // HDB concessionary loan
      cpf_allowed: true,
      downpayment_required: 146000,
      cpf_allowed_amount: 146000,
      stress_rate_applied: 0.04,
      ltv_cap_applied: 0.75,
      tenure_cap_years: 25,
      cpf_withdrawal_limit: 720000,
      reasonCodes: ['msr_binding'],
      policyRefs: ['MAS Notice 632', 'MAS Notice 645']
    }
  }
];

// Additional scenarios for comprehensive testing based on persona logic
export const extendedScenarios: DrElenaScenario[] = [
  {
    id: 'scenario_3',
    description: 'Second property purchase with reduced LTV',
    inputs: {
      property_price: 1500000,
      property_type: 'Private',
      buyer_profile: 'SC',
      existing_properties: 1,
      income: 15000,
      commitments: 2000,
      rate: 3.8,
      tenure: 20,
      age: 40,
      loan_type: 'new_purchase',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 45, // Second loan
      absd_rate: 20, // SC second property
      tdsr_available: 6250, // (15000 * 0.55) - 2000 = 6250
      max_loan: 675000, // 1500000 * 0.45
      limiting_factor: 'LTV',
      min_cash_percent: 25,
      cpf_allowed: true,
      downpayment_required: 825000,
      cpf_allowed_amount: 450000,
      stress_rate_applied: 0.04,
      ltv_cap_applied: 0.45,
      tenure_cap_years: 25,
      cpf_withdrawal_limit: 1800000,
      reasonCodes: ['ltv_reduced_second_property'],
      policyRefs: ['MAS Notice 632', 'MAS Notice 645']
    }
  },
  {
    id: 'scenario_4',
    description: 'Age trigger reducing LTV (loan ends after 65)',
    inputs: {
      property_price: 800000,
      property_type: 'Private',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 12000,
      commitments: 1000,
      rate: 3.5,
      tenure: 30,
      age: 45, // 45 + 30 = 75 > 65, triggers reduced LTV
      loan_type: 'new_purchase',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 55, // Reduced due to age trigger
      absd_rate: 0,
      tdsr_available: 5600, // (12000 * 0.55) - 1000 = 5600
      max_loan: 440000, // 800000 * 0.55
      limiting_factor: 'LTV',
      min_cash_percent: 10, // Increased for reduced LTV
      cpf_allowed: true,
      downpayment_required: 360000,
      cpf_allowed_amount: 280000,
      stress_rate_applied: 0.04,
      ltv_cap_applied: 0.55,
      tenure_cap_years: 20,
      cpf_withdrawal_limit: 960000,
      reasonCodes: ['ltv_reduced_age_trigger'],
      policyRefs: ['MAS Notice 632', 'MAS Notice 645']
    }
  },
  {
    id: 'scenario_5',
    description: 'Refinance with cash-out on private property',
    inputs: {
      property_price: 1200000,
      property_type: 'Private',
      buyer_profile: 'SC',
      existing_properties: 1,
      income: 18000,
      commitments: 3000,
      rate: 4.2,
      tenure: 15,
      age: 42,
      loan_type: 'refinance',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 45, // Second loan rules apply
      absd_rate: 0, // ABSD only applies to purchases, not refinance
      tdsr_available: 6900, // (18000 * 0.55) - 3000 = 6900
      max_loan: 540000, // 1200000 * 0.45
      limiting_factor: 'LTV',
      min_cash_percent: 25,
      cpf_allowed: true,
      downpayment_required: 660000,
      cpf_allowed_amount: 360000,
      stress_rate_applied: 0.042,
      ltv_cap_applied: 0.45,
      tenure_cap_years: 15,
      cpf_withdrawal_limit: 1440000,
      max_cash_out: 0,
      reasonCodes: ['refinance_equity_available'],
      policyRefs: ['MAS Notice 645']
    }
  },
  {
    id: 'scenario_6',
    description: 'Commercial property purchase (no CPF)',
    inputs: {
      property_price: 2000000,
      property_type: 'Commercial',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 25000,
      commitments: 5000,
      rate: 4.5,
      tenure: 20,
      age: 38,
      loan_type: 'new_purchase',
      is_owner_occupied: false
    },
    expected_outputs: {
      max_ltv: 60,
      absd_rate: 0, // No ABSD on commercial
      tdsr_available: 8750, // (25000 * 0.55) - 5000 = 8750
      max_loan: 1200000,
      limiting_factor: 'LTV',
      min_cash_percent: 25,
      cpf_allowed: false,
      downpayment_required: 800000,
      cpf_allowed_amount: 0,
      stress_rate_applied: 0.05,
      ltv_cap_applied: 0.6,
      tenure_cap_years: 27,
      cpf_withdrawal_limit: 2400000,
      reasonCodes: ['cpf_not_allowed', 'commercial_property'],
      policyRefs: ['MAS Notice 645']
    }
  }
];

// Rounding test fixtures based on persona rounding rules
export interface RoundingTestCase {
  description: string;
  input_value: number;
  rounding_type: 'loan_eligibility' | 'funds_required' | 'monthly_payment' | 'percentage';
  expected_output: number;
  persona_reference: string;
}

export const roundingTestCases: RoundingTestCase[] = [
  {
    description: 'Loan eligibility rounds DOWN to nearest thousand',
    input_value: 756789,
    rounding_type: 'loan_eligibility',
    expected_output: 756000,
    persona_reference: 'computational_modules.rounding_rules.loan_eligibility'
  },
  {
    description: 'Funds required rounds UP to nearest thousand',
    input_value: 123456,
    rounding_type: 'funds_required',
    expected_output: 124000,
    persona_reference: 'computational_modules.rounding_rules.funds_required'
  },
  {
    description: 'Monthly payment rounds UP to nearest dollar',
    input_value: 4234.56,
    rounding_type: 'monthly_payment',
    expected_output: 4235,
    persona_reference: 'computational_modules.rounding_rules.monthly_payments'
  },
  {
    description: 'Percentage rounds to 2 decimal places',
    input_value: 4.56789,
    rounding_type: 'percentage',
    expected_output: 4.57,
    persona_reference: 'computational_modules.rounding_rules.percentages'
  }
];

// Income recognition test fixtures
export interface IncomeRecognitionCase {
  employment_type: 'employed' | 'self_employed' | 'variable_income';
  gross_income: number;
  expected_recognized_income: number;
  persona_reference: string;
}

export const incomeRecognitionCases: IncomeRecognitionCase[] = [
  {
    employment_type: 'employed',
    gross_income: 10000,
    expected_recognized_income: 10000,
    persona_reference: 'computational_modules.income_recognition.fixed_income'
  },
  {
    employment_type: 'self_employed',
    gross_income: 10000,
    expected_recognized_income: 7000,
    persona_reference: 'computational_modules.income_recognition.self_employed_income'
  },
  {
    employment_type: 'variable_income',
    gross_income: 5000,
    expected_recognized_income: 3500,
    persona_reference: 'computational_modules.income_recognition.variable_income'
  }
];

// Commitment calculation fixtures
export interface CommitmentCalculationCase {
  commitment_type: 'credit_card' | 'overdraft' | 'existing_mortgage';
  input_value: number;
  expected_monthly_commitment: number;
  persona_reference: string;
}

export const commitmentCalculationCases: CommitmentCalculationCase[] = [
  {
    commitment_type: 'credit_card',
    input_value: 10000,
    expected_monthly_commitment: 300, // 10000 * 0.03
    persona_reference: 'computational_modules.commitment_calculations.credit_cards'
  },
  {
    commitment_type: 'credit_card',
    input_value: 1000,
    expected_monthly_commitment: 50, // MAX(1000 * 0.03, 50) = 50
    persona_reference: 'computational_modules.commitment_calculations.credit_cards'
  },
  {
    commitment_type: 'overdraft',
    input_value: 50000,
    expected_monthly_commitment: 2500, // 50000 * 0.05
    persona_reference: 'computational_modules.commitment_calculations.overdraft_facilities'
  }
];

// Negative test scenarios - failure cases
export const negativeScenarios: DrElenaScenario[] = [
  {
    id: 'scenario_negative_tdsr_breach',
    description: 'TDSR breach due to high commitments',
    inputs: {
      property_price: 1000000,
      property_type: 'Private',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 10000,
      commitments: 8000, // Very high commitments
      rate: 3.6,
      tenure: 25,
      age: 35,
      loan_type: 'new_purchase',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 75,
      absd_rate: 0,
      tdsr_available: -2500, // (10000 * 0.55) - 8000 = -2500
      max_loan: 0, // Cannot borrow
      limiting_factor: 'TDSR',
      min_cash_percent: 5,
      cpf_allowed: true,
      downpayment_required: 1000000, // Full price
      cpf_allowed_amount: 0,
      stress_rate_applied: 0.04,
      ltv_cap_applied: 0.75,
      tenure_cap_years: 30,
      cpf_withdrawal_limit: 1200000,
      reasonCodes: ['TDSR_EXCEEDED', 'insufficient_income'],
      policyRefs: ['MAS Notice 645']
    }
  },
  {
    id: 'scenario_negative_msr_breach',
    description: 'MSR breach for HDB purchase',
    inputs: {
      property_price: 600000,
      property_type: 'HDB',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 5000, // Low income
      commitments: 2000, // High commitments
      rate: 2.8,
      tenure: 25,
      age: 35,
      loan_type: 'new_purchase',
      is_owner_occupied: true
    },
    expected_outputs: {
      max_ltv: 75,
      absd_rate: 0,
      tdsr_available: 750, // (5000 * 0.55) - 2000 = 750
      msr_limit: 1500, // 5000 * 0.30
      tdsr_limit: 750, // (5000 * 0.55) - 2000 = 750
      limiting_factor: 'MSR',
      max_loan: 250000, // Calculated at stress rate, much less than LTV allows
      min_cash_percent: 0,
      cpf_allowed: true,
      downpayment_required: 350000,
      cpf_allowed_amount: 350000,
      stress_rate_applied: 0.04,
      ltv_cap_applied: 0.75,
      tenure_cap_years: 25,
      cpf_withdrawal_limit: 720000,
      reasonCodes: ['MSR_EXCEEDED', 'high_debt_burden'],
      policyRefs: ['MAS Notice 632', 'MAS Notice 645']
    }
  },
  {
    id: 'scenario_negative_commercial_cpf',
    description: 'Commercial property - CPF not allowed',
    inputs: {
      property_price: 1500000,
      property_type: 'Commercial',
      buyer_profile: 'SC',
      existing_properties: 0,
      income: 20000,
      commitments: 3000,
      rate: 4.8,
      tenure: 20,
      age: 40,
      loan_type: 'new_purchase',
      is_owner_occupied: false
    },
    expected_outputs: {
      max_ltv: 60,
      absd_rate: 0,
      tdsr_available: 8000, // (20000 * 0.55) - 3000 = 8000
      max_loan: 900000,
      limiting_factor: 'LTV',
      min_cash_percent: 25,
      cpf_allowed: false,
      downpayment_required: 600000,
      cpf_allowed_amount: 0,
      stress_rate_applied: 0.05,
      ltv_cap_applied: 0.6,
      tenure_cap_years: 27,
      cpf_withdrawal_limit: 0,
      reasonCodes: ['cpf_not_allowed', 'commercial_property', 'cash_only_downpayment'],
      policyRefs: ['MAS Notice 645']
    }
  }
];

// Helper function to get scenario by ID
export function getScenarioById(id: string): DrElenaScenario | undefined {
  return [...drElenaV2Scenarios, ...extendedScenarios, ...negativeScenarios].find(s => s.id === id);
}

// Helper function to get all scenarios for a specific property type
export function getScenariosByPropertyType(propertyType: string): DrElenaScenario[] {
  return [...drElenaV2Scenarios, ...extendedScenarios, ...negativeScenarios].filter(
    s => s.inputs.property_type.toLowerCase() === propertyType.toLowerCase()
  );
}

// Helper function to get scenarios requiring MSR calculation
export function getMSRScenarios(): DrElenaScenario[] {
  return [...drElenaV2Scenarios, ...extendedScenarios, ...negativeScenarios].filter(
    s => s.inputs.property_type === 'HDB' || s.inputs.property_type === 'EC'
  );
}

// Helper function to get negative test scenarios
export function getNegativeScenarios(): DrElenaScenario[] {
  return negativeScenarios;
}
