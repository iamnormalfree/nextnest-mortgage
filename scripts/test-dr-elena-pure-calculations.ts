/**
 * Dr. Elena Pure Calculations Test Suite
 * Tests ONLY the pure calculation functions - no external dependencies
 *
 * No Redis, Supabase, or API keys required!
 *
 * @module test-dr-elena-pure-calculations
 */

import { calculateMaxLoanAmount, LoanCalculationInputs, calculateTDSR, calculateMSR, calculateStampDuty } from '@/lib/calculations/dr-elena-mortgage';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

const TEST_SCENARIOS = [
  {
    name: 'Scenario 1: First-time HDB Buyer',
    description: 'Young couple, first property, well within limits',
    inputs: {
      propertyPrice: 500000,
      propertyType: 'HDB' as const,
      monthlyIncome: 6000,
      existingCommitments: 500,
      age: 30,
      citizenship: 'Citizen' as const,
      propertyCount: 1 as const
    },
    expectedOutcome: {
      masCompliant: true,
      limitingFactor: 'LTV',
      tdsrRange: [30, 50] as [number, number],
      minLoan: 300000,
      maxLoan: 400000
    }
  },
  {
    name: 'Scenario 2: Second Property Investor',
    description: 'Investor buying second property, LTV constraint',
    inputs: {
      propertyPrice: 1200000,
      propertyType: 'Private' as const,
      monthlyIncome: 15000,
      existingCommitments: 2000,
      age: 40,
      citizenship: 'Citizen' as const,
      propertyCount: 2 as const
    },
    expectedOutcome: {
      masCompliant: true,
      limitingFactor: 'LTV',
      tdsrRange: [30, 55] as [number, number],
      minLoan: 400000,
      maxLoan: 600000
    }
  },
  {
    name: 'Scenario 3: High Income Professional',
    description: 'High earner, comfortable TDSR margin',
    inputs: {
      propertyPrice: 2000000,
      propertyType: 'Private' as const,
      monthlyIncome: 25000,
      existingCommitments: 1000,
      age: 35,
      citizenship: 'Citizen' as const,
      propertyCount: 1 as const
    },
    expectedOutcome: {
      masCompliant: true,
      limitingFactor: 'LTV',
      tdsrRange: [30, 50] as [number, number],
      minLoan: 1200000,
      maxLoan: 1600000
    }
  },
  {
    name: 'Scenario 4: Marginal TDSR Case',
    description: 'Close to 55% TDSR limit, needs careful calculation',
    inputs: {
      propertyPrice: 800000,
      propertyType: 'Private' as const,
      monthlyIncome: 8000,
      existingCommitments: 2500,
      age: 35,
      citizenship: 'Citizen' as const,
      propertyCount: 1 as const
    },
    expectedOutcome: {
      masCompliant: true,
      limitingFactor: 'TDSR',
      tdsrRange: [50, 55] as [number, number],
      minLoan: 300000,
      maxLoan: 500000
    }
  },
  {
    name: 'Scenario 5: Non-Compliant Case',
    description: 'Exceeds TDSR limit, should fail MAS compliance',
    inputs: {
      propertyPrice: 1000000,
      propertyType: 'Private' as const,
      monthlyIncome: 5000,
      existingCommitments: 2000,
      age: 30,
      citizenship: 'Citizen' as const,
      propertyCount: 1 as const
    },
    expectedOutcome: {
      masCompliant: false,
      limitingFactor: 'TDSR',
      tdsrRange: [55, 100] as [number, number],
      minLoan: 0,
      maxLoan: 300000
    }
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runTests() {
  console.log('='.repeat(80));
  console.log('DR. ELENA PURE CALCULATIONS TEST SUITE');
  console.log('MAS Compliance & Calculation Accuracy Tests');
  console.log('No external dependencies required!');
  console.log('='.repeat(80));
  console.log();

  let passedTests = 0;
  let failedTests = 0;
  const results: any[] = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${scenario.name}`);
    console.log(`${scenario.description}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Run calculation
      const calculation = calculateMaxLoanAmount(scenario.inputs);

      console.log('=Ê INPUT:');
      console.log(`  Property Price: S$${scenario.inputs.propertyPrice.toLocaleString()}`);
      console.log(`  Monthly Income: S$${scenario.inputs.monthlyIncome.toLocaleString()}`);
      console.log(`  Existing Commitments: S$${scenario.inputs.existingCommitments.toLocaleString()}`);
      console.log(`  Property Type: ${scenario.inputs.propertyType}`);
      console.log(`  Property Count: ${scenario.inputs.propertyCount}`);
      console.log();

      console.log('=Ð CALCULATION RESULTS:');
      console.log(`  Max Loan: S$${calculation.maxLoan.toLocaleString()}`);
      console.log(`  Monthly Payment: S$${calculation.monthlyPayment.toLocaleString()}`);
      console.log(`  Down Payment: S$${calculation.downPayment.toLocaleString()}`);
      console.log(`  Cash Required: S$${calculation.minCashRequired.toLocaleString()}`);
      console.log(`  TDSR: ${calculation.tdsrUsed}%`);
      if (calculation.msrUsed !== null) {
        console.log(`  MSR: ${calculation.msrUsed}%`);
      }
      console.log(`  Limiting Factor: ${calculation.limitingFactor}`);
      console.log(`  LTV Applied: ${calculation.ltvApplied}%`);
      console.log(`  Max Tenure: ${calculation.maxTenure} years`);
      console.log(`  MAS Compliant: ${calculation.masCompliant ? ' YES' : 'L NO'}`);
      console.log();

      // Validate results
      const checks = {
        masCompliant: calculation.masCompliant === scenario.expectedOutcome.masCompliant,
        limitingFactor: calculation.limitingFactor === scenario.expectedOutcome.limitingFactor,
        tdsrInRange: calculation.tdsrUsed >= scenario.expectedOutcome.tdsrRange[0] &&
                     calculation.tdsrUsed <= scenario.expectedOutcome.tdsrRange[1],
        loanInRange: calculation.maxLoan >= scenario.expectedOutcome.minLoan &&
                     calculation.maxLoan <= scenario.expectedOutcome.maxLoan
      };

      const allChecksPassed = Object.values(checks).every(v => v);

      console.log(' VALIDATION:');
      console.log(`  MAS Compliant Match: ${checks.masCompliant ? '' : 'L'} (Expected: ${scenario.expectedOutcome.masCompliant}, Got: ${calculation.masCompliant})`);
      console.log(`  Limiting Factor Match: ${checks.limitingFactor ? '' : 'L'} (Expected: ${scenario.expectedOutcome.limitingFactor}, Got: ${calculation.limitingFactor})`);
      console.log(`  TDSR in Range: ${checks.tdsrInRange ? '' : 'L'} (Expected: ${scenario.expectedOutcome.tdsrRange[0]}-${scenario.expectedOutcome.tdsrRange[1]}%, Got: ${calculation.tdsrUsed}%)`);
      console.log(`  Loan in Range: ${checks.loanInRange ? '' : 'L'} (Expected: $${scenario.expectedOutcome.minLoan.toLocaleString()}-$${scenario.expectedOutcome.maxLoan.toLocaleString()}, Got: $${calculation.maxLoan.toLocaleString()})`);
      console.log();

      if (calculation.warnings.length > 0) {
        console.log('   WARNINGS:');
        calculation.warnings.forEach(w => console.log(`  - ${w}`));
        console.log();
      }

      if (calculation.reasoning.length > 0) {
        console.log('=Ý REASONING:');
        calculation.reasoning.slice(0, 3).forEach(r => console.log(`  - ${r}`));
        console.log();
      }

      if (allChecksPassed) {
        passedTests++;
        console.log(` ${scenario.name}: PASSED`);
      } else {
        failedTests++;
        console.log(`L ${scenario.name}: FAILED`);
      }

      results.push({
        scenario: scenario.name,
        passed: allChecksPassed,
        calculation,
        checks
      });

    } catch (error) {
      failedTests++;
      console.error(`L ${scenario.name}: EXCEPTION:`, error);
      results.push({
        scenario: scenario.name,
        passed: false,
        error: String(error)
      });
    }
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Scenarios: ${TEST_SCENARIOS.length}`);
  console.log(` Passed: ${passedTests}`);
  console.log(`L Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / TEST_SCENARIOS.length) * 100)}%`);
  console.log('='.repeat(80));

  // Test individual functions
  console.log('\n\n' + '='.repeat(80));
  console.log('INDIVIDUAL FUNCTION TESTS');
  console.log('='.repeat(80));

  // Test TDSR calculation
  console.log('\n[Test] calculateTDSR()');
  const tdsrTest = calculateTDSR(10000, 2000, 3000, 'Private');
  console.log(`  Input: Income=$10k, Existing=$2k, Proposed=$3k`);
  console.log(`  TDSR Ratio: ${tdsrTest.tdsrRatio}%`);
  console.log(`  Available: $${tdsrTest.available}`);
  console.log(`  Compliant: ${tdsrTest.compliant ? '' : 'L'}`);
  console.log(`  Stress Test Rate: ${tdsrTest.stressTestRate}%`);

  // Test MSR calculation
  console.log('\n[Test] calculateMSR()');
  const msrTest = calculateMSR(10000, 'HDB');
  console.log(`  Input: Income=$10k, PropertyType=HDB`);
  console.log(`  MSR Limit: $${msrTest.msrLimit}`);
  console.log(`  Applicable: ${msrTest.applicable ? '' : 'L'}`);

  // Test Stamp Duty calculation
  console.log('\n[Test] calculateStampDuty()');
  const stampDutyTest = calculateStampDuty(1000000, 'Citizen', 1, 'Private');
  console.log(`  Input: Price=$1M, Citizen, First Property`);
  console.log(`  BSD: $${stampDutyTest.bsd.toLocaleString()}`);
  console.log(`  ABSD: $${stampDutyTest.absd.toLocaleString()}`);
  console.log(`  Total: $${stampDutyTest.total.toLocaleString()}`);

  console.log('\n' + '='.repeat(80));

  if (passedTests === TEST_SCENARIOS.length) {
    console.log('<‰ ALL TESTS PASSED! <‰');
    console.log('Dr. Elena pure calculations are MAS-compliant and accurate!');
  } else {
    console.log('   SOME TESTS FAILED');
    console.log('Please review the failed scenarios above.');
  }

  console.log('='.repeat(80));

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
