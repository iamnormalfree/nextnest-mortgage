// ABOUTME: Unit tests for refinance outlook calculator functions
// ABOUTME: Validates specialized_calculators.equity_term_loan, property_specific_rules, cpf_usage_rules
import { calculateRefinanceOutlook } from '../../lib/calculations/instant-profile';

describe('Refinance Outlook Calculator - Dr Elena v2 Alignment', () => {
  describe('Cash-out Calculations', () => {
    it('should calculate cash-out for private property only', () => {
      const privatePropertyInput = {
        property_value: 1200000,
        outstanding_loan: 700000,
        cpf_used: 150000,
        property_type: 'Private' as const,
        is_owner_occupied: true
      };

      const result = calculateRefinanceOutlook(privatePropertyInput);

      // Private property should allow cash-out
      expect(result.maxCashOut).toBeGreaterThan(0);
      expect(result.reasonCodes).toContain('private_property_cash_out_allowed');
    });

    it('should not allow cash-out for HDB properties', () => {
      const hdbPropertyInput = {
        property_value: 600000,
        outstanding_loan: 400000,
        cpf_used: 100000,
        property_type: 'HDB' as const,
        is_owner_occupied: true
      };

      const result = calculateRefinanceOutlook(hdbPropertyInput);

      // HDB should not allow cash-out
      expect(result.maxCashOut).toBe(0);
      expect(result.reasonCodes).toContain('hdb_cash_out_not_allowed');
    });

    it('should calculate cash-out equity term formula correctly', () => {
      const input = {
        property_value: 1000000,
        outstanding_loan: 500000,
        cpf_used: 100000,
        property_type: 'Private' as const
      };

      const result = calculateRefinanceOutlook(input);

      // Formula: (Market_Value × LTV%) - Outstanding_Loan - CPF_Used(inc. accrued)
      // Should person to persona equity_term_loan calculation
      expect(result.maxCashOut).toBeGreaterThan(0);
      expect(result.policyRefs).toContain('charges_priority');
    });
  });

  describe('Objectives-based Calculations', () => {
    it('should calculate monthly savings for "lower payment" objective', () => {
      const lowerPaymentInput = {
        current_balance: 800000,
        current_rate: 4.5,
        property_value: 1200000,
        property_type: 'Private' as const,
        objective: 'lower_payment' as const,
        months_remaining: 24
      };

      const result = calculateRefinanceOutlook(lowerPaymentInput);

      expect(result.projectedMonthlySavings).toBeGreaterThan(0);
      expect(result.recommendations).toContain('lower_payment_strategy');
    });

    it('should calculate tenure reduction for "shorten tenure" objective', () => {
      const shortenTenureInput = {
        current_balance: 600000,
        current_rate: 3.8,
        property_value: 1000000,
        property_type: 'Private' as const,
        objective: 'shorten_tenure' as const,
        months_remaining: 36
      };

      const result = calculateRefinanceOutlook(shortenTenureInput);

      expect(result.projectedMonthlySavings).toBeDefined(); // May be negative for shorter tenure
      expect(result.recommendations).toContain('tenure_reduction_strategy');
    });

    it('should provide rate certainty analysis', () => {
      const rateCertaintyInput = {
        current_balance: 700000,
        current_rate: 5.2, // High current rate
        months_remaining: 12,
        property_value: 1100000,
        property_type: 'Private' as const,
        objective: 'rate_certainty' as const
      };

      const result = calculateRefinanceOutlook(rateCertaintyInput);

      expect(result.recommendations).toContain('rate_certainty_benefits');
      expect(result.timingGuidance).toContain('lock_in_advantage');
    });
  });

  describe('Timing Guidance', () => {
    it('should provide timing recommendations based on months remaining', () => {
      const timingInput = {
        months_remaining: 6, // Approaching lock-in expiry
        property_type: 'Private' as const,
        property_value: 1000000,
        outstanding_loan: 650000
      };

      const result = calculateRefinanceOutlook(timingInput);

      expect(result.timingGuidance).toContain('Start paperwork');
      expect(result.timingGuidance).toContain('6 months');
      expect(result.reasonCodes).toContain('timing_critical_window');
    });

    it('should handle early lock-in expiry recommendations', () => {
      const earlyInput = {
        months_remaining: 3, // Very close to expiry
        property_type: 'Private' as const,
        property_value: 900000,
        outstanding_loan: 500000
      };

      const result = calculateRefinanceOutlook(earlyInput);

      expect(result.timingGuidance).toContain('immediate');
      expect(result.recommendations).toContain('urgent_referral');
    });

    it('should advise patience for long lock-in periods', () => {
      const longLockInInput = {
        months_remaining: 24, // Long remaining period
        property_type: 'Private' as const,
        property_value: 1100000,
        outstanding_loan: 700000
      };

      const result = calculateRefinanceOutlook(longLockInInput);

      expect(result.timingGuidance).toContain('penalty consideration');
      expect(result.recommendations).toContain('monitor_rates');
    });
  });

  describe('Owner-Occupied vs Investment Properties', () => {
    it('should apply different LTV for investment properties', () => {
      const investmentInput = {
        property_value: 1000000,
        outstanding_loan: 600000,
        cpf_used: 100000,
        property_type: 'Private' as const,
        is_owner_occupied: false // Investment property
      };

      const ownerOccupiedInput = {
        ...investmentInput,
        is_owner_occupied: true
      };

      const investmentResult = calculateRefinanceOutlook(investmentInput);
      const ownerOccupiedResult = calculateRefinanceOutlook(ownerOccupiedInput);

      // Investment properties typically have lower LTV limits
      expect(investmentResult.maxCashOut).toBeLessThanOrEqual(ownerOccupiedResult.maxCashOut);
      expect(investmentResult.reasonCodes).toContain('investment_property_rules');
    });

    it('should include rental income considerations for investment properties', () => {
      const investmentInput = {
        property_value: 1200000,
        outstanding_loan: 700000,
        property_type: 'Private' as const,
        is_owner_occupied: false,
        // TODO: Add rental income input once implemented
      };

      const result = calculateRefinanceOutlook(investmentInput);

      expect(result.reasonCodes).toContain('rental_income_consideration');
      // TODO: Test rental income calculation once implemented
    });
  });

  describe('CPF Usage in Refinance', () => {
    it('should account for CPF accrued interest', () => {
      const cpfInput = {
        property_value: 1000000,
        outstanding_loan: 600000,
        cpf_used: 150000, // Significant CPF usage
        property_type: 'Private' as const,
        is_owner_occupied: true
      };

      const result = calculateRefinanceOutlook(cpfInput);

      // Should include accrued interest in equity calculation
      expect(result.reasonCodes).toContain('cpf_accrued_interest_considered');
      expect(result.policyRefs).toContain('cpf_accrued_interest');
    });

    it('should follow CPF sale proceeds order for post-2002 properties', () => {
      const post2002Input = {
        property_value: 900000,
        outstanding_loan: 500000,
        cpf_used: 120000,
        property_type: 'Private' as const,
        property_age: 15, // Post-2002
        is_owner_occupied: true
      };

      const result = calculateRefinanceOutlook(post2002Input);

      // Post-2002: Refund CPF principal first, then loan, then accrued interest
      expect(result.reasonCodes).toContain('post_2002_cpf_order');
      expect(result.policyRefs).toContain('sale_proceeds_order');
    });
  });

  describe('Monthly Savings Calculation', () => {
    it('should calculate savings based on rate differential', () => {
      const rateDiffInput = {
        current_balance: 800000,
        current_rate: 4.8, // High current rate
        property_value: 1200000,
        property_type: 'Private' as const,
        objective: 'lower_payment' as const,
        months_remaining: 18
      };

      const result = calculateRefinanceOutlook(rateDiffInput);

      // Should demonstrate significant monthly savings
      expect(result.projectedMonthlySavings).toBeGreaterThan(200); // Reasonable minimum
      expect(result.reasonCodes).toContain('rate_differential_savings');
    });

    it('should show negative savings for shorter tenure with same payment', () => {
      const shortenTenureInput = {
        current_balance: 600000,
        current_rate: 3.5, // Same rate
        property_value: 1000000,
        property_type: 'Private' as const,
        objective: 'shorten_tenure' as const,
        months_remaining: 30
      };

      const result = calculateRefinanceOutlook(shortenTenureInput);

      // Shorter tenure usually means higher monthly payment
      expect(result.projectedMonthlySavings).toBeLessThan(0);
      expect(result.recommendations).toContain('higher_payment_shorter_tenure');
    });
  });

  describe('Policy Compliance', () => {
    it('should include MAS regulatory references', () => {
      const input = {
        property_value: 1000000,
        outstanding_loan: 650000,
        property_type: 'Private' as const,
        is_owner_occupied: true
      };

      const result = calculateRefinanceOutlook(input);

      expect(result.policyRefs).toContain('MAS Notice 632');
      expect(result.policyRefs).toContain('MAS Notice 645');
      expect(result.reasonCodes).toContain('mas_compliant_calculation');
    });

    it('should validate property type restrictions', () => {
      const commercialInput = {
        property_value: 2000000,
        outstanding_loan: 1200000,
        property_type: 'Commercial' as const,
        is_owner_occupied: false
      };

      const result = calculateRefinanceOutlook(commercialInput);

      expect(result.policyRefs).toContain('MAS Notice 645');
      expect(result.reasonCodes).toContain('cpf_not_allowed_commercial');
    });
  });

  describe('Edge Cases', () => {
    it('should handle high loan-to-value scenarios', () => {
      const highLtvInput = {
        property_value: 800000,
        outstanding_loan: 750000, // Very high LTV
        property_type: 'Private' as const
      };

      const result = calculateRefinanceOutlook(highLtvInput);

      expect(result.maxCashOut).toBe(0); // No cash-out available
      expect(result.reasonCodes).toContain('high_ltv_no_cash_out');
    });

    it('should handle zero outstanding loan', () => {
      const paidOffInput = {
        property_value: 1000000,
        outstanding_loan: 0, // Fully paid off
        cpf_used: 200000,
        property_type: 'Private' as const
      };

      const result = calculateRefinanceOutlook(paidOffInput);

      // Should handle full equity scenario
      expect(result.maxCashOut).toBeGreaterThan(0);
      expect(result.reasonCodes).toContain('fully_paid_property');
    });

    it('should handle insufficient equity scenarios', () => {
      const negativeEquityInput = {
        property_value: 500000,
        outstanding_loan: 600000, // Negative equity
        cpf_used: 100000,
        property_type: 'Private' as const
      };

      const result = calculateRefinanceOutlook(negativeEquityInput);

      expect(result.maxCashOut).toBe(0);
      expect(result.reasonCodes).toContain('negative_equity_no_refinance');
    });
  });
});
