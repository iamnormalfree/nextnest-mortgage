// ABOUTME: Safeguards persona-aligned calculator constants using Dr Elena v2 JSON source
// ABOUTME: Ensures helper constants stay synced with dr-elena-mortgage-expert-v2.json modules

import persona from '@/dr-elena-mortgage-expert-v2.json';

import {
  DR_ELENA_ABSD_RATES,
  DR_ELENA_COMMITMENT_RATES,
  DR_ELENA_CPF_USAGE_RULES,
  DR_ELENA_INCOME_RECOGNITION,
  DR_ELENA_LTV_LIMITS,
  DR_ELENA_POLICY_REFERENCES,
  DR_ELENA_ROUNDING_RULES,
  DR_ELENA_STRESS_TEST_FLOORS,
  DR_ELENA_TENURE_TRIGGERS
} from '@/lib/calculations/dr-elena-constants';

describe('Dr Elena persona constants', () => {
  it('matches LTV tiers defined in the persona JSON', () => {
    expect(DR_ELENA_LTV_LIMITS.firstLoan).toEqual(
      persona.computational_modules.ltv_limits.individual_borrowers.first_loan
    );
    expect(DR_ELENA_LTV_LIMITS.secondLoan).toEqual(
      persona.computational_modules.ltv_limits.individual_borrowers.second_loan
    );
    expect(DR_ELENA_LTV_LIMITS.thirdPlusLoan).toEqual(
      persona.computational_modules.ltv_limits.individual_borrowers.third_plus_loan
    );
  });

  it('uses tenure and age trigger rules from persona JSON', () => {
    expect(DR_ELENA_TENURE_TRIGGERS.rule).toBe(
      persona.computational_modules.ltv_limits.tenure_or_age_triggers.rule
    );
  });

  it('keeps stress test floors aligned with persona guidance', () => {
    const stressRates = persona.computational_modules.core_formulas.tdsr_available.stress_test_rates;
    expect(DR_ELENA_STRESS_TEST_FLOORS.residential).toBe(stressRates.residential / 100);
    expect(DR_ELENA_STRESS_TEST_FLOORS.nonResidential).toBe(stressRates.non_residential / 100);
  });

  it('tracks income recognition rates directly from persona JSON', () => {
    expect(DR_ELENA_INCOME_RECOGNITION.fixedIncome).toBe(
      persona.computational_modules.income_recognition.fixed_income.recognition_rate
    );
    expect(DR_ELENA_INCOME_RECOGNITION.selfEmployed).toBe(
      persona.computational_modules.income_recognition.self_employed_income.recognition_rate
    );
    expect(DR_ELENA_INCOME_RECOGNITION.variableIncome).toBe(
      persona.computational_modules.income_recognition.variable_income.default_recognition_rate
    );
  });

  it('honors commitment calculation formulas from persona JSON', () => {
    const creditCardFormula = persona.computational_modules.commitment_calculations.credit_cards.formula;
    const creditCardRate = Number(creditCardFormula.match(/0\.0?3/)?.[0]);
    expect(DR_ELENA_COMMITMENT_RATES.creditCards.rate).toBe(creditCardRate);
    expect(DR_ELENA_COMMITMENT_RATES.creditCards.minimum).toBe(50);

    const overdraftFormula = persona.computational_modules.commitment_calculations.overdraft_facilities.formula;
    const overdraftRate = Number(overdraftFormula.match(/0\.0?5/)?.[0]);
    expect(DR_ELENA_COMMITMENT_RATES.overdraft.rate).toBe(overdraftRate);

    const guarantorFormula = persona.computational_modules.commitment_calculations.guarantor_obligations.formula;
    const guarantorRate = Number(guarantorFormula.match(/0\.\d+/)?.[0]);
    expect(DR_ELENA_COMMITMENT_RATES.guarantor.rate).toBe(guarantorRate);
  });

  it('reflects CPF usage rules from the persona JSON', () => {
    expect(DR_ELENA_CPF_USAGE_RULES.withdrawalLimitPercent).toBe(
      persona.computational_modules.cpf_usage_rules.limits.withdrawal_limit_percent
    );
    expect(DR_ELENA_CPF_USAGE_RULES.chargesPriority).toEqual(
      persona.computational_modules.cpf_usage_rules.charges_priority
    );
  });

  it('captures rounding rules defined by the persona', () => {
    expect(DR_ELENA_ROUNDING_RULES.loanEligibility.formula).toBe(
      persona.computational_modules.rounding_rules.loan_eligibility.formula
    );
    expect(DR_ELENA_ROUNDING_RULES.fundsRequired.formula).toBe(
      persona.computational_modules.rounding_rules.funds_required.formula
    );
    expect(DR_ELENA_ROUNDING_RULES.monthlyPayments.formula).toBe(
      persona.computational_modules.rounding_rules.monthly_payments.formula
    );
  });

  it('records policy references applied across calculators', () => {
    expect(DR_ELENA_POLICY_REFERENCES.tdsr).toBe('MAS Notice 645');
    expect(DR_ELENA_POLICY_REFERENCES.msr).toBe('MAS Notice 632');
    expect(DR_ELENA_POLICY_REFERENCES.cpfAccruedInterest).toBe('cpf_accrued_interest');
  });

  it('keeps ABSD rates in sync with persona JSON', () => {
    expect(DR_ELENA_ABSD_RATES.singleBuyers.singaporeCitizen.firstProperty).toBe(
      persona.computational_modules.stamp_duty_rates.absd_rates.single_buyers.singapore_citizen.first_property
    );
    expect(DR_ELENA_ABSD_RATES.marriedCouples.scSc.first).toBe(
      persona.computational_modules.stamp_duty_rates.absd_rates.married_couples.sc_sc.first
    );
    expect(DR_ELENA_ABSD_RATES.jointPurchaseRule).toBe(
      persona.computational_modules.stamp_duty_rates.absd_rates.joint_purchase_non_married.rule
    );
  });
});
