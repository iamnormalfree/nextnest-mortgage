// ABOUTME: Provides typed Dr Elena mortgage persona constants for calculator helpers
// ABOUTME: Derives mortgage limits and policy references from dr-elena-mortgage-expert-v2.json

import persona from '@/dr-elena-mortgage-expert-v2.json';

const modules = persona.computational_modules;

// Source: computational_modules.ltv_limits.individual_borrowers
export const DR_ELENA_LTV_LIMITS = Object.freeze({
  firstLoan: { ...modules.ltv_limits.individual_borrowers.first_loan },
  secondLoan: { ...modules.ltv_limits.individual_borrowers.second_loan },
  thirdPlusLoan: { ...modules.ltv_limits.individual_borrowers.third_plus_loan }
}) as Readonly<{
  firstLoan: typeof modules.ltv_limits.individual_borrowers.first_loan;
  secondLoan: typeof modules.ltv_limits.individual_borrowers.second_loan;
  thirdPlusLoan: typeof modules.ltv_limits.individual_borrowers.third_plus_loan;
}>;

// Source: computational_modules.ltv_limits.tenure_or_age_triggers
export const DR_ELENA_TENURE_TRIGGERS = Object.freeze({
  rule: modules.ltv_limits.tenure_or_age_triggers.rule
}) as Readonly<{ rule: string }>;

// Source: computational_modules.core_formulas.tdsr_available.stress_test_rates
export const DR_ELENA_STRESS_TEST_FLOORS = Object.freeze({
  residential: modules.core_formulas.tdsr_available.stress_test_rates.residential / 100,
  nonResidential: modules.core_formulas.tdsr_available.stress_test_rates.non_residential / 100
}) as Readonly<{
  residential: number;
  nonResidential: number;
}>;

// Source: computational_modules.income_recognition
export const DR_ELENA_INCOME_RECOGNITION = Object.freeze({
  fixedIncome: modules.income_recognition.fixed_income.recognition_rate,
  variableIncome: modules.income_recognition.variable_income.default_recognition_rate,
  selfEmployed: modules.income_recognition.self_employed_income.recognition_rate,
  rentalIncome: modules.income_recognition.rental_income.recognition_rate
}) as Readonly<{
  fixedIncome: number;
  variableIncome: number;
  selfEmployed: number;
  rentalIncome: number;
}>;

const creditCardRateMatch = modules.commitment_calculations.credit_cards.formula.match(/0\.0?3/);
const overdraftRateMatch = modules.commitment_calculations.overdraft_facilities.formula.match(/0\.0?5/);
const guarantorRateMatch = modules.commitment_calculations.guarantor_obligations.formula.match(/0\.\d+/);

// Source: computational_modules.commitment_calculations
export const DR_ELENA_COMMITMENT_RATES = Object.freeze({
  creditCards: {
    rate: creditCardRateMatch ? Number(creditCardRateMatch[0]) : 0.03,
    minimum: 50
  },
  overdraft: {
    rate: overdraftRateMatch ? Number(overdraftRateMatch[0]) : 0.05
  },
  guarantor: {
    rate: guarantorRateMatch ? Number(guarantorRateMatch[0]) : 0.2
  }
}) as Readonly<{
  creditCards: { rate: number; minimum: number };
  overdraft: { rate: number };
  guarantor: { rate: number };
}>;

// Source: computational_modules.cpf_usage_rules
export const DR_ELENA_CPF_USAGE_RULES = Object.freeze({
  withdrawalLimitPercent: modules.cpf_usage_rules.limits.withdrawal_limit_percent,
  chargesPriority: [...modules.cpf_usage_rules.charges_priority],
  saleProceedsOrder: {
    post2002: [...modules.cpf_usage_rules.sale_proceeds_order.post_2002],
    pre2002: [...modules.cpf_usage_rules.sale_proceeds_order.pre_2002]
  }
}) as Readonly<{
  withdrawalLimitPercent: number;
  chargesPriority: string[];
  saleProceedsOrder: {
    post2002: string[];
    pre2002: string[];
  };
}>;

// Source: computational_modules.rounding_rules
export const DR_ELENA_ROUNDING_RULES = Object.freeze({
  loanEligibility: {
    rule: modules.rounding_rules.loan_eligibility.rule,
    formula: modules.rounding_rules.loan_eligibility.formula
  },
  fundsRequired: {
    rule: modules.rounding_rules.funds_required.rule,
    formula: modules.rounding_rules.funds_required.formula
  },
  monthlyPayments: {
    rule: modules.rounding_rules.monthly_payments.rule,
    formula: modules.rounding_rules.monthly_payments.formula
  }
}) as Readonly<{
  loanEligibility: { rule: string; formula: string };
  fundsRequired: { rule: string; formula: string };
  monthlyPayments: { rule: string; formula: string };
}>;

// Source: computational_modules.stamp_duty_rates.absd_rates
export const DR_ELENA_ABSD_RATES = Object.freeze({
  singleBuyers: {
    singaporeCitizen: {
      firstProperty: modules.stamp_duty_rates.absd_rates.single_buyers.singapore_citizen.first_property,
      secondProperty: modules.stamp_duty_rates.absd_rates.single_buyers.singapore_citizen.second_property,
      thirdPlus: modules.stamp_duty_rates.absd_rates.single_buyers.singapore_citizen.third_plus
    },
    permanentResident: {
      firstProperty: modules.stamp_duty_rates.absd_rates.single_buyers.permanent_resident.first_property,
      secondProperty: modules.stamp_duty_rates.absd_rates.single_buyers.permanent_resident.second_property,
      thirdPlus: modules.stamp_duty_rates.absd_rates.single_buyers.permanent_resident.third_plus
    },
    foreigner: {
      allProperties: modules.stamp_duty_rates.absd_rates.single_buyers.foreigner.all_properties
    },
    entity: {
      allProperties: modules.stamp_duty_rates.absd_rates.single_buyers.entity.all_properties
    }
  },
  marriedCouples: {
    scSc: { ...modules.stamp_duty_rates.absd_rates.married_couples.sc_sc },
    scPr: { ...modules.stamp_duty_rates.absd_rates.married_couples.sc_pr },
    scForeigner: { ...modules.stamp_duty_rates.absd_rates.married_couples.sc_foreigner },
    prPr: { ...modules.stamp_duty_rates.absd_rates.married_couples.pr_pr },
    prForeigner: { ...modules.stamp_duty_rates.absd_rates.married_couples.pr_foreigner },
    foreignerForeigner: { ...modules.stamp_duty_rates.absd_rates.married_couples.foreigner_foreigner }
  },
  jointPurchaseRule: modules.stamp_duty_rates.absd_rates.joint_purchase_non_married.rule
});

// Source: profile_metadata.links and computational_modules references
export const DR_ELENA_POLICY_REFERENCES = Object.freeze({
  tdsr: 'MAS Notice 645',
  msr: 'MAS Notice 632',
  cpfAccruedInterest: 'cpf_accrued_interest',
  saleProceedsOrder: 'sale_proceeds_order'
}) as Readonly<{
  tdsr: string;
  msr: string;
  cpfAccruedInterest: string;
  saleProceedsOrder: string;
}>;
