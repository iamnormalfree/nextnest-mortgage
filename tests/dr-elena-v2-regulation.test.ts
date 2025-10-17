// ABOUTME: Validates Dr Elena v2 covers critical regulatory guardrails.
// ABOUTME: Ensures CPF, bridging, and HDB guidance aligns with lesson source material.
import persona from '../dr-elena-mortgage-expert-v2.json';

describe('dr-elena v2 regulatory coverage', () => {
  it('includes CPF usage limits and statutory sale proceeds sequence', () => {
    const cpfRules = persona.computational_modules?.cpf_usage_rules;
    expect(cpfRules).toBeDefined();

    expect(cpfRules?.limits?.valuation_limit_description?.toLowerCase()).toContain(
      'lower of property valuation or purchase price',
    );
    expect(cpfRules?.limits?.withdrawal_limit_percent).toBe(120);
    expect(cpfRules?.limits?.withdrawal_limit_note).toContain('future servicing must be cash');

    expect(cpfRules?.sale_proceeds_order?.post_2002).toEqual([
      'Refund CPF principal withdrawn',
      'Redeem outstanding housing loan',
      'Refund CPF accrued interest',
    ]);

    expect(cpfRules?.sale_proceeds_order?.pre_2002).toEqual([
      'Redeem outstanding housing loan',
      'Refund CPF principal withdrawn',
      'Refund CPF accrued interest',
    ]);

    expect(cpfRules?.charges_priority).toEqual([
      'Outstanding housing loan from financier',
      'CPF principal up to valuation limit (incl. legal and stamp fees)',
      'CPF above valuation limit with accrued interest (pari passu with housing loan interest)',
      'CPF legal expenses (pari passu with financier legal expenses)',
      'Equity term loan / overdraft',
    ]);
  });

  it('captures bridging loan tenure and documentation guardrails', () => {
    const bridging = persona.computational_modules?.specialized_calculators?.bridging_financing;
    expect(bridging).toBeDefined();

    expect(bridging?.max_tenure_months).toBe(6);
    expect(bridging?.repayment_mode).toBe('Cash only; CPF not allowed for instalments');
    expect(bridging?.documentation).toEqual({
      application: ['Granted Option to Purchase for sale property'],
      disbursement: ['Exercised Option to Purchase for sale property'],
    });
  });

  it('details HDB concessionary loan cash, tenure, and rate rules', () => {
    const hdbRules = persona.computational_modules?.property_specific_rules?.hdb;
    expect(hdbRules).toBeDefined();

    const concessionary = hdbRules?.concessionary_loan;
    expect(concessionary).toBeDefined();
    expect(concessionary?.cash_downpayment_percent).toBe(0);
    expect(concessionary?.interest_formula).toBe('CPF OA rate + 0.10%');
    expect(concessionary?.max_tenure_years).toBe(25);
    expect(concessionary?.second_loan_reduction_note).toContain('retain the higher of $25,000 or 50% of cash proceeds');
  });
});
