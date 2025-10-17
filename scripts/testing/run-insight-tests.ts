/**
 * Mortgage Insights Test Runner
 * Executes various scenarios to test insight generation quality
 */

import { MortgageInsightsGenerator } from '@/lib/insights/mortgage-insights-generator'
import fs from 'fs'

// Test scenarios
const testScenarios = {
  // NEW PURCHASE SCENARIOS
  NP1_HighValue: {
    name: 'High-Value Property Purchase',
    gate2Data: {
      loanType: 'new_purchase' as const,
      name: 'John Tan',
      email: 'john@example.com',
      phone: '91234567',
      propertyType: 'Private',
      priceRange: 2000000,
      purchaseTimeline: 'next_3_months'
    },
    gate3Data: {
      monthlyIncome: 25000,
      existingCommitments: 2000
    }
  },
  
  NP2_HDB: {
    name: 'HDB Purchase - Moderate Income',
    gate2Data: {
      loanType: 'new_purchase' as const,
      name: 'Sarah Lim',
      email: 'sarah@example.com',
      phone: '98765432',
      propertyType: 'HDB',
      priceRange: 600000,
      purchaseTimeline: 'this_month'
    },
    gate3Data: {
      monthlyIncome: 8000,
      existingCommitments: 500
    }
  },
  
  NP3_Commercial: {
    name: 'Commercial Property Investment',
    gate2Data: {
      loanType: 'new_purchase' as const,
      name: 'Peter Wong',
      email: 'peter@example.com',
      phone: '97778888',
      propertyType: 'Commercial',
      priceRange: 3000000,
      purchaseTimeline: '3_6_months'
    },
    gate3Data: {
      monthlyIncome: 40000,
      existingCommitments: 5000
    }
  },
  
  // REFINANCING SCENARIOS
  RF1_NoLockHighSavings: {
    name: 'Refinance - No Lock-in, High Savings',
    gate2Data: {
      loanType: 'refinance' as const,
      name: 'David Chen',
      email: 'david@example.com',
      phone: '91112222',
      currentRate: 4.5,
      outstandingLoan: 800000,
      lockInStatus: 'no_lockin',
      propertyValue: 1200000
    },
    gate3Data: {
      monthlyIncome: 15000,
      existingCommitments: 1000
    }
  },
  
  RF2_LockedMarginal: {
    name: 'Refinance - Locked In, Marginal Savings',
    gate2Data: {
      loanType: 'refinance' as const,
      name: 'Michelle Ng',
      email: 'michelle@example.com',
      phone: '93334444',
      currentRate: 3.2,
      outstandingLoan: 500000,
      lockInStatus: 'locked_in',
      propertyValue: 800000
    },
    gate3Data: {
      monthlyIncome: 10000,
      existingCommitments: 800
    }
  },
  
  RF3_ExpiringSoon: {
    name: 'Refinance - Lock-in Expiring Soon',
    gate2Data: {
      loanType: 'refinance' as const,
      name: 'Karen Teo',
      email: 'karen@example.com',
      phone: '95559999',
      currentRate: 3.8,
      outstandingLoan: 650000,
      lockInStatus: 'expiring_soon',
      propertyValue: 1000000
    },
    gate3Data: {
      monthlyIncome: 12000,
      existingCommitments: 600
    }
  },
  
  // REFINANCE/CASH-OUT SCENARIOS (previously equity loan)
  EQ1_Investment: {
    name: 'Refinance - Cash Out for Investment',
    gate2Data: {
      loanType: 'refinance' as const,
      name: 'Robert Tan',
      email: 'robert@example.com',
      phone: '95556666',
      propertyValue: 2500000,
      outstandingLoan: 600000,
      currentRate: 3.2,
      lockInStatus: 'no_lock' as const,
      currentBank: 'DBS',
      propertyType: 'Private' as const
    },
    gate3Data: {
      monthlyIncome: 30000,
      existingCommitments: 3000
    }
  },
  
  EQ2_Business: {
    name: 'Refinance - Cash Out for Business Capital',
    gate2Data: {
      loanType: 'refinance' as const,
      name: 'Jennifer Lee',
      email: 'jennifer@example.com',
      phone: '91110000',
      propertyValue: 1800000,
      outstandingLoan: 400000,
      currentRate: 2.9,
      lockInStatus: 'ending_soon' as const,
      currentBank: 'OCBC',
      propertyType: 'Private' as const
    },
    gate3Data: {
      monthlyIncome: 20000,
      existingCommitments: 2500
    }
  },
  
  EQ3_Personal: {
    name: 'Refinance - Cash Out for Personal Use',
    gate2Data: {
      loanType: 'refinance' as const,
      name: 'Andrew Lim',
      email: 'andrew@example.com',
      phone: '92223333',
      propertyValue: 1000000,
      outstandingLoan: 300000,
      currentRate: 3.5,
      lockInStatus: 'no_lock' as const,
      currentBank: 'UOB',
      propertyType: 'HDB' as const
    },
    gate3Data: {
      monthlyIncome: 8000,
      existingCommitments: 400
    }
  }
}

// Test runner function
function runInsightTests() {
  const results: any[] = []
  
  Object.entries(testScenarios).forEach(([key, scenario]) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${scenario.name}`)
    console.log('='.repeat(60))
    
    // Test Gate 2
    const gate2Generator = new MortgageInsightsGenerator(scenario.gate2Data)
    const gate2Insights = gate2Generator.generateInsights(2)
    
    console.log('\n📊 GATE 2 INSIGHTS:')
    gate2Insights.forEach((insight, index) => {
      console.log(`\nInsight ${index + 1}:`)
      console.log(`  Type: ${insight.type}`)
      console.log(`  Title: ${insight.title}`)
      console.log(`  Message: ${insight.message}`)
      if (insight.calculations) {
        console.log('  Calculations:', insight.calculations)
      }
      if (insight.details) {
        console.log('  Details:')
        insight.details.forEach(detail => console.log(`    - ${detail}`))
      }
    })
    
    // Test Gate 3 (with cumulative data)
    const gate3Data = {
      ...scenario.gate2Data,
      ...scenario.gate3Data
    }
    const gate3Generator = new MortgageInsightsGenerator(gate3Data)
    const gate3Insights = gate3Generator.generateInsights(3)
    
    console.log('\n📊 GATE 3 INSIGHTS:')
    gate3Insights.forEach((insight, index) => {
      console.log(`\nInsight ${index + 1}:`)
      console.log(`  Type: ${insight.type}`)
      console.log(`  Title: ${insight.title}`)
      console.log(`  Message: ${insight.message}`)
      if (insight.calculations) {
        console.log('  Calculations:', insight.calculations)
      }
      if (insight.details) {
        console.log('  Details:')
        insight.details.forEach(detail => console.log(`    - ${detail}`))
      }
    })
    
    // Store results
    results.push({
      scenario: key,
      name: scenario.name,
      gate2Data: scenario.gate2Data,
      gate3Data: scenario.gate3Data,
      gate2Insights: gate2Insights,
      gate3Insights: gate3Insights,
      metrics: {
        gate2InsightCount: gate2Insights.length,
        gate3InsightCount: gate3Insights.length,
        hasCalculations: gate2Insights.some(i => i.calculations) || gate3Insights.some(i => i.calculations),
        hasActionableInsights: gate2Insights.some(i => i.actionable) || gate3Insights.some(i => i.actionable),
        urgencyLevels: Array.from(new Set([...gate2Insights, ...gate3Insights].map(i => i.urgency)))
      }
    })
  })
  
  // Save results to file
  const output = {
    testRunDate: new Date().toISOString(),
    totalScenarios: results.length,
    results: results,
    summary: {
      averageGate2Insights: results.reduce((sum, r) => sum + r.metrics.gate2InsightCount, 0) / results.length,
      averageGate3Insights: results.reduce((sum, r) => sum + r.metrics.gate3InsightCount, 0) / results.length,
      scenariosWithCalculations: results.filter(r => r.metrics.hasCalculations).length,
      scenariosWithActionableInsights: results.filter(r => r.metrics.hasActionableInsights).length
    }
  }
  
  // Write to JSON file
  fs.writeFileSync(
    'insight-test-results.json',
    JSON.stringify(output, null, 2)
  )
  
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total scenarios tested: ${output.totalScenarios}`)
  console.log(`Average Gate 2 insights: ${output.summary.averageGate2Insights.toFixed(1)}`)
  console.log(`Average Gate 3 insights: ${output.summary.averageGate3Insights.toFixed(1)}`)
  console.log(`Scenarios with calculations: ${output.summary.scenariosWithCalculations}/${output.totalScenarios}`)
  console.log(`Scenarios with actionable insights: ${output.summary.scenariosWithActionableInsights}/${output.totalScenarios}`)
  
  return output
}

// Execute tests
if (require.main === module) {
  console.log('🚀 Starting Mortgage Insights Test Suite...\n')
  const results = runInsightTests()
  console.log('\n✅ Test results saved to: Testing/insight-test-results.json')
}

export { runInsightTests, testScenarios }