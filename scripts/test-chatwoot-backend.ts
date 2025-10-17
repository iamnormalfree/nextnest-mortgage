#!/usr/bin/env tsx
/**
 * Test script for Chatwoot backend API integration
 * Tests the Form-to-Chat implementation components
 */

import { calculateBrokerPersona } from '../lib/calculations/broker-persona'

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

// Test data sets
const testData = {
  highScoreLead: {
    formData: {
      name: 'John Tan',
      email: 'john.tan@example.com',
      phone: '91234567',
      loanType: 'new_purchase' as const,
      propertyCategory: 'new_launch' as const,
      propertyType: 'Condominium',
      propertyPrice: 1500000,
      actualAges: [35],
      actualIncomes: [15000],
      employmentType: 'employed' as const,
      existingCommitments: 500,
      creditCardCount: '2'
    },
    sessionId: 'test-session-high-score',
    leadScore: 85
  },
  mediumScoreLead: {
    formData: {
      name: 'Sarah Lee',
      email: 'sarah.lee@example.com',
      phone: '81234567',
      loanType: 'refinance' as const,
      propertyCategory: 'resale' as const,
      propertyType: 'HDB',
      propertyValue: 600000,
      actualAges: [42, 40],
      actualIncomes: [5000, 4000],
      employmentType: 'employed' as const,
      applicantType: 'joint' as const,
      hasExistingLoan: true,
      existingLoanDetails: {
        outstandingAmount: 350000,
        monthlyPayment: 2200,
        remainingTenure: 20,
        currentRate: 2.6
      },
      lockInStatus: 'ending_soon' as const,
      refinancingGoals: ['lower_rates', 'cash_out']
    },
    sessionId: 'test-session-medium-score',
    leadScore: 60
  },
  lowScoreLead: {
    formData: {
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      phone: '61234567',
      loanType: 'commercial' as const,
      propertyCategory: 'commercial' as const,
      commercialPropertyType: 'Office Space',
      propertyPrice: 3000000,
      actualAges: [28],
      actualIncomes: [3500],
      employmentType: 'self-employed' as const,
      purchaseStructure: 'company' as const,
      existingCommitments: 1500
    },
    sessionId: 'test-session-low-score',
    leadScore: 35
  }
}

// Test broker persona calculation
async function testBrokerPersonaCalculation() {
  console.log(`\n${colors.bold}${colors.blue}Testing Broker Persona Calculation${colors.reset}`)
  console.log('=' .repeat(50))
  
  const testCases = [
    { name: 'High Score Lead (85/100)', data: testData.highScoreLead },
    { name: 'Medium Score Lead (60/100)', data: testData.mediumScoreLead },
    { name: 'Low Score Lead (35/100)', data: testData.lowScoreLead }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n${colors.yellow}Test Case: ${testCase.name}${colors.reset}`)
    
    try {
      const persona = calculateBrokerPersona(testCase.data.leadScore, testCase.data.formData)
      
      console.log(`${colors.green}✓ Persona calculated successfully${colors.reset}`)
      console.log(`  Type: ${persona.type}`)
      console.log(`  Name: ${persona.name}`)
      console.log(`  Approach: ${persona.approach}`)
      console.log(`  Urgency: ${persona.urgencyLevel}`)
      console.log(`  Title: ${persona.title}`)
      console.log(`  Avatar: ${persona.avatar}`)
      console.log(`  Response Style:`)
      console.log(`    - Tone: ${persona.responseStyle.tone}`)
      console.log(`    - Pacing: ${persona.responseStyle.pacing}`)
      console.log(`    - Focus: ${persona.responseStyle.focus}`)
    } catch (error) {
      console.log(`${colors.red}✗ Failed: ${error}${colors.reset}`)
    }
  }
}

// Test Chatwoot conversation API endpoint
async function testChatwootConversationAPI() {
  console.log(`\n${colors.bold}${colors.blue}Testing Chatwoot Conversation API Endpoint${colors.reset}`)
  console.log('=' .repeat(50))
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const testCases = [
    { name: 'High Score Lead', data: testData.highScoreLead },
    { name: 'Medium Score Lead', data: testData.mediumScoreLead },
    { name: 'Low Score Lead', data: testData.lowScoreLead }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n${colors.yellow}Test Case: ${testCase.name}${colors.reset}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/chatwoot-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log(`${colors.green}✓ API call successful${colors.reset}`)
        console.log(`  Status: ${response.status}`)
        console.log(`  Success: ${result.success}`)
        
        if (result.conversationId) {
          console.log(`  Conversation ID: ${result.conversationId}`)
        }
        
        if (result.widgetConfig) {
          console.log(`  Widget Config:`)
          console.log(`    Base URL: ${result.widgetConfig.baseUrl}`)
          console.log(`    Position: ${result.widgetConfig.position}`)
          console.log(`    Locale: ${result.widgetConfig.locale}`)
        }
        
        if (result.fallback) {
          console.log(`${colors.yellow}  Fallback activated:${colors.reset}`)
          console.log(`    Type: ${result.fallback.type}`)
          console.log(`    Contact: ${result.fallback.contact}`)
          console.log(`    Message: ${result.fallback.message}`)
        }
      } else {
        console.log(`${colors.red}✗ API call failed${colors.reset}`)
        console.log(`  Status: ${response.status}`)
        console.log(`  Error: ${result.error || 'Unknown error'}`)
        
        if (result.fallback) {
          console.log(`${colors.yellow}  Fallback provided:${colors.reset}`)
          console.log(`    Type: ${result.fallback.type}`)
          console.log(`    Contact: ${result.fallback.contact}`)
        }
      }
    } catch (error) {
      console.log(`${colors.red}✗ Request failed: ${error}${colors.reset}`)
    }
  }
}

// Test data validation
async function testDataValidation() {
  console.log(`\n${colors.bold}${colors.blue}Testing Data Validation${colors.reset}`)
  console.log('=' .repeat(50))
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const invalidTestCases = [
    {
      name: 'Missing required fields',
      data: {
        formData: {
          name: 'Test User'
          // Missing email, phone, etc.
        },
        sessionId: 'test-invalid-1',
        leadScore: 50
      }
    },
    {
      name: 'Invalid phone format',
      data: {
        ...testData.highScoreLead,
        formData: {
          ...testData.highScoreLead.formData,
          phone: '12345' // Invalid Singapore phone
        }
      }
    },
    {
      name: 'Invalid email format',
      data: {
        ...testData.highScoreLead,
        formData: {
          ...testData.highScoreLead.formData,
          email: 'not-an-email'
        }
      }
    },
    {
      name: 'Invalid lead score',
      data: {
        ...testData.highScoreLead,
        leadScore: 150 // Out of range
      }
    }
  ]
  
  for (const testCase of invalidTestCases) {
    console.log(`\n${colors.yellow}Test Case: ${testCase.name}${colors.reset}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/chatwoot-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      })
      
      const result = await response.json()
      
      if (response.status === 400) {
        console.log(`${colors.green}✓ Validation correctly rejected invalid data${colors.reset}`)
        console.log(`  Status: ${response.status}`)
        console.log(`  Error: ${result.error}`)
        
        if (result.details) {
          console.log(`  Validation details: ${JSON.stringify(result.details, null, 2)}`)
        }
      } else {
        console.log(`${colors.red}✗ Validation unexpectedly passed${colors.reset}`)
        console.log(`  Status: ${response.status}`)
      }
    } catch (error) {
      console.log(`${colors.red}✗ Request failed: ${error}${colors.reset}`)
    }
  }
}

// Test environment configuration
async function testEnvironmentConfig() {
  console.log(`\n${colors.bold}${colors.blue}Testing Environment Configuration${colors.reset}`)
  console.log('=' .repeat(50))
  
  const requiredEnvVars = [
    'CHATWOOT_BASE_URL',
    'CHATWOOT_API_TOKEN',
    'CHATWOOT_ACCOUNT_ID',
    'CHATWOOT_INBOX_ID',
    'CHATWOOT_WEBSITE_TOKEN',
    'CHAT_FALLBACK_PHONE',
    'CHAT_FALLBACK_EMAIL'
  ]
  
  let allPresent = true
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (value) {
      console.log(`${colors.green}✓ ${envVar}: Set${colors.reset}`)
      
      // Mask sensitive values
      if (envVar.includes('TOKEN') || envVar.includes('KEY')) {
        console.log(`  Value: ${value.substring(0, 4)}****`)
      } else {
        console.log(`  Value: ${value}`)
      }
    } else {
      console.log(`${colors.red}✗ ${envVar}: Missing${colors.reset}`)
      allPresent = false
    }
  }
  
  if (!allPresent) {
    console.log(`\n${colors.yellow}⚠ Some environment variables are missing.${colors.reset}`)
    console.log('Please ensure all required variables are set in .env.local')
  }
}

// Summary report
function generateSummary(results: any) {
  console.log(`\n${colors.bold}${colors.blue}Test Summary${colors.reset}`)
  console.log('=' .repeat(50))
  
  console.log(`\n${colors.bold}Implementation Status:${colors.reset}`)
  console.log('✅ Broker Persona Calculation: Implemented')
  console.log('✅ Chatwoot Conversation API: Implemented')
  console.log('✅ Data Validation: Implemented')
  console.log('⏳ Circuit Breaker Pattern: Not implemented')
  console.log('⏳ Frontend Components: Not implemented')
  
  console.log(`\n${colors.bold}Next Steps:${colors.reset}`)
  console.log('1. Configure environment variables with actual Chatwoot instance')
  console.log('2. Deploy Chatwoot instance on Hetzner')
  console.log('3. Implement circuit breaker pattern for resilience')
  console.log('4. Create frontend transition components')
  console.log('5. Integrate with ProgressiveForm Step 3')
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}${colors.blue}Chatwoot Backend API Test Suite${colors.reset}`)
  console.log(`${colors.bold}Testing Form-to-Chat Implementation${colors.reset}`)
  console.log('=' .repeat(50))
  
  try {
    // Run all tests
    await testBrokerPersonaCalculation()
    await testEnvironmentConfig()
    
    // Only test API if running locally
    if (process.env.NODE_ENV !== 'production') {
      await testChatwootConversationAPI()
      await testDataValidation()
    } else {
      console.log(`\n${colors.yellow}Skipping API tests in production environment${colors.reset}`)
    }
    
    // Generate summary
    generateSummary({})
    
    console.log(`\n${colors.green}${colors.bold}✅ Test suite completed${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}${colors.bold}Test suite failed:${colors.reset}`, error)
    process.exit(1)
  }
}

// Run tests
runTests()