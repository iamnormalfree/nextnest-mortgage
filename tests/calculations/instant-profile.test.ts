// ABOUTME: Unit tests for instant profile calculator functions aligned with Dr Elena v2 persona
import {
  drElenaV2Scenarios,
  extendedScenarios,
  getScenarioById,
  getMSRScenarios,
  roundingTestCases,
  incomeRecognitionCases,
  commitmentCalculationCases
} from '../fixtures/dr-elena-v2-scenarios';

// Calculator functions to be implemented (will fail until implemented)
import {
  calculateInstantProfile,
  calculateComplianceSnapshot,
  calculateRefinanceOutlook
} from '../../lib/calculations/instant-profile';

describe('Instant Profile Calculator - Dr Elena v2 Alignment', () => {
  describe('calculateInstantProfile', () => {
    it('should align with Dr Elena v2 first-time buyer scenario (test_scenarios.scenario_1)', () => {
      const scenario = getScenarioById('scenario_1');
      expect(scenario).toBeDefined();
      
      if (!scenario) return;

      const result = calculateInstantProfile(scenario.inputs, 75);

      // These assertions will fail until implementation exists
      expect(result.maxLoan).toBe(scenario.expected_outputs.max_loan);
      expect(result.maxLTV).toBe(scenario.expected_outputs.max_ltv);
      expect(result.tdsrAvailable).toBe(scenario.expected_outputs.tdsr_available);
      expect(result.limitingFactor).toBe(scenario.expected_outputs.limiting_factor);
    });

    it('should calculate HDB purchase where MSR binds (test_scenarios.scenario_2)', () => {
      const scenario = getScenarioById('scenario_2');
      expect(scenario).toBeDefined();
      
      if (!scenario) return;

      const result = calculateInstantProfile(scenario.inputs, 75);

      expect(result.limitingFactor).toBe('MSR');
      expect(result.msrLimit).toBe(scenario.expected_outputs.msr_limit);
    });

    it('should apply reduced LTV for age trigger conditions', () => {
      const scenario = getScenarioById('scenario_4');
      expect(scenario).toBeDefined();
      
      if (!scenario) return;

      const result = calculateInstantProfile(scenario.inputs, 75);

      // Age 45 + tenure 30 = loan ends at 75, should trigger reduced LTV
      expect(result.maxLTV).toBe(55); // Reduced from 75%
      expect(result.minCashPercent).toBe(10); // Increased from 5%
    });

    it('should handle second property with reduced LTV and ABSD', () => {
      const scenario = getScenarioById('scenario_3');
      expect(scenario).toBeDefined();
      
      if (!scenario) return;

      const result = calculateInstantProfile(scenario.inputs, 45);

      expect(result.maxLTV).toBe(45); // Second loan
      expect(result.absdRate).toBe(20); // SC second property
      expect(result.minCashPercent).toBe(25);
    });
  });

  describe('calculateComplianceSnapshot', () => {
    it('should calculate TDSR and MSR compliance metrics', () => {
      const testInput = {
        income: 10000,
        commitments: 2000,
        property_type: 'Private' as const,
        loan_amount: 500000,
        rate: 3.5,
        tenure: 25
      };

      const result = calculateComplianceSnapshot(testInput);

      // Should fail until implemented
      expect(result.tdsrLimit).toBe(3500); // 10000 * 0.55 - 2000
      expect(result.tdsrRatio).toBeDefined();
      expect(result.isTDSRCompliant).toBeDefined();
    });

    it('should apply MSR for HDB properties', () => {
      const hdbInput = {
        income: 8000,
        commitments: 500,
        property_type: 'HDB' as const,
        loan_amount: 400000,
        rate: 2.8,
        tenure: 25
      };

      const result = calculateComplianceSnapshot(hdbInput);

      // Should fail until implemented
      expect(result.msrLimit).toBe(2400); // 8000 * 0.30
      expect(result.msrRatio).toBeDefined();
      expect(result.isMSRCompliant).toBeDefined();
      expect(result.limitingFactor).toBe('MSR');
    });

    it('should recognize variable income at 70% rate', () => {
      const variableIncomeInput = {
        employment_type: 'variable_income' as const,
        gross_income: 10000,
        commitments: 1000,
        property_type: 'Private' as const,
        loan_amount: 600000,
        rate: 3.5,
        tenure: 25
      };

      const result = calculateComplianceSnapshot(variableIncomeInput);

      // Should recognize only 7000 of 10000 variable income
      expect(result.recognizedIncome).toBe(7000);
      expect(result.tdsrLimit).toBe(2850); // (7000 * 0.55) - 1000
    });
  });

  describe('calculateRefinanceOutlook', () => {
    it('should calculate refinance scenarios for private property', () => {
      const refinanceInput = {
        current_balance: 800000,
        current_rate: 4.5,
        months_remaining: 18,
        property_value: 1200000,
        property_type: 'Private' as const,
        is_owner_occupied: true,
        objective: 'lower_payment' as const
      };

      const result = calculateRefinanceOutlook(refinanceInput);

      // Should fail until implemented
      expect(result.projectedMonthlySavings).toBeDefined();
      expect(result.maxCashOut).toBeDefined();
      expect(result.timingGuidance).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle cash-out calculations only for private properties', () => {
      const privateInput = {
        property_value: 1000000,
        outstanding_loan: 600000,
        cpf_used: 200000,
        property_type: 'Private' as const
      };

      const privateResult = calculateRefinanceOutlook(privateInput);
      expect(privateResult.maxCashOut).toBeGreaterThan(0);

      const hdbInput = {
        ...privateInput,
        property_type: 'HDB' as const
      };

      const hdbResult = calculateRefinanceOutlook(hdbInput);
      expect(hdbResult.maxCashOut).toBe(0); // No cash-out for HDB
    });
  });

  describe('Rounding Rules Alignment', () => {
    it('should round loan eligibility down to nearest thousand', () => {
      const testResult = calculateInstantProfile({
        property_price: 1000000,
        property_type: 'Private' as const,
        buyer_profile: 'SC' as const,
        existing_properties: 0,
        income: 12000,
        commitments: 1000,
        rate: 3.6,
        tenure: 25,
        age: 35
      }, 75);

      // Max loan should be rounded down to nearest thousand
      expect(testResult.maxLoan % 1000).toBe(0);
    });

    it('should round funds required up to nearest thousand', () => {
      // This will test the down payment calculation
      const testResult = calculateInstantProfile({
        property_price: 1234567, // Irregular amount
        property_type: 'Private' as const,
        buyer_profile: 'SC' as const,
        existing_properties: 0,
        income: 15000,
        commitments: 1500,
        rate: 3.8,
        tenure: 30,
        age: 40
      }, 75);

      // Down payment should be rounded up to nearest thousand
      expect(testResult.downpaymentRequired % 1000).toBe(0);
    });
  });

  describe('Income Recognition Edge Cases', () => {
    it('should apply 70% recognition for self-employed income', () => {
      const selfEmployedInput = {
        employment_type: 'self_employed' as const,
        gross_income: 15000,
        commitments: 2000,
        property_type: 'Private' as const,
        loan_amount: 800000,
        rate: 3.5,
        tenure: 25
      };

      const result = calculateComplianceSnapshot(selfEmployedInput);
      expect(result.recognizedIncome).toBe(10500); // 15000 * 0.70
    });

    it('should handle employment type switching correctly', () => {
      const baseInputs = {
        gross_income: 10000,
        commitments: 1000,
        property_type: 'Private' as const,
        loan_amount: 600000,
        rate: 3.5,
        tenure: 25
      };

      const employedResult = calculateComplianceSnapshot({
        ...baseInputs,
        employment_type: 'employed' as const
      });

      const selfEmployedResult = calculateComplianceSnapshot({
        ...baseInputs,
        employment_type: 'self_employed' as const
      });

      // Self-employed should recognize less income
      expect(employedResult.recognizedIncome).toBe(10000);
      expect(selfEmployedResult.recognizedIncome).toBe(7000);
    });
  });

  describe('Integration Tests Using Persona Test Scenarios', () => {
    test.each([...drElenaV2Scenarios, ...extendedScenarios])(
      'scenario $id: $description',
      (scenario) => {
        const result = calculateInstantProfile(scenario.inputs, 75);

        // Core validations that should pass for all scenarios
        expect(result).toBeDefined();
        expect(result.maxLTV).toBeGreaterThan(0);
        expect(result.maxLTV).toBeLessThanOrEqual(75);
        expect(result.tdsrAvailable).toBeGreaterThanOrEqual(0);

        // Scenario-specific validations
        if (scenario.expected_outputs.max_loan) {
          expect(result.maxLoan).toBe(scenario.expected_outputs.max_loan);
        }

        if (scenario.expected_outputs.limiting_factor) {
          expect(result.limitingFactor).toBe(scenario.expected_outputs.limiting_factor);
        }
      }
    );
  });
});
