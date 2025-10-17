#!/usr/bin/env node

/**
 * Test n8n webhook in TEST mode
 * This sends a test payload to the n8n test webhook endpoint
 */

const N8N_TEST_WEBHOOK_URL = 'https://primary-production-1af6.up.railway.app/webhook-test/chatwoot-ai-broker';

// Test cases with different conversation IDs and lead scores
const TEST_CASES = [
  {
    name: 'High-Value Lead (Score 85+)',
    conversationId: 1001,
    leadScore: 90,
    loanType: 'refinancing',
    propertyCategory: 'private_condo',
    monthlyIncome: 15000,
    expectedBroker: 'Michelle Chen or Jasmine Lee'
  },
  {
    name: 'Medium-Value Lead (Score 70-84)',
    conversationId: 1002,
    leadScore: 75,
    loanType: 'new_purchase',
    propertyCategory: 'resale',
    monthlyIncome: 8000,
    expectedBroker: 'Rachel Tan'
  },
  {
    name: 'First-Time Buyer (Score 50-69)',
    conversationId: 1003,
    leadScore: 60,
    loanType: 'new_purchase',
    propertyCategory: 'hdb',
    monthlyIncome: 5000,
    expectedBroker: 'Sarah Wong'
  },
  {
    name: 'Conservative Buyer (Score <50)',
    conversationId: 1004,
    leadScore: 40,
    loanType: 'refinancing',
    propertyCategory: 'hdb',
    monthlyIncome: 3500,
    expectedBroker: 'Grace Lim'
  }
];

async function sendTestWebhook(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Conversation ID: ${testCase.conversationId}`);
  console.log(`   Lead Score: ${testCase.leadScore}`);
  console.log(`   Expected Broker: ${testCase.expectedBroker}`);
  
  const payload = {
    event: 'message_created',
    id: `test-webhook-${Date.now()}`,
    conversation: {
      id: testCase.conversationId,  // Dynamic conversation ID
      contact_id: 5679,
      status: 'bot',
      custom_attributes: {
        name: `Test User ${testCase.conversationId}`,
        email: `test-${testCase.conversationId}@example.com`,
        phone: '+6591234567',
        lead_score: testCase.leadScore,
        loan_type: testCase.loanType,
        property_category: testCase.propertyCategory,
        monthly_income: testCase.monthlyIncome,
        loan_amount: testCase.monthlyIncome * 100,
        purchase_timeline: 'urgent',
        employment_type: 'employed',
        message_count: 1,
        status: 'bot'
      },
      contact: {
        id: 5679,
        name: `Test User ${testCase.conversationId}`,
        email: `test-${testCase.conversationId}@example.com`,
        phone_number: '+6591234567'
      }
    },
    message: {
      id: 98766 + testCase.conversationId,
      content: 'I need help with my mortgage. What are my options?',
      message_type: 'incoming',
      created_at: new Date().toISOString(),
      sender: {
        id: 5679,
        type: 'contact',
        name: `Test User ${testCase.conversationId}`
      }
    },
    account: {
      id: 1,
      name: 'NextNest'
    },
    inbox: {
      id: 1,
      name: 'Website'
    }
  };
  
  try {
    console.log('   📤 Sending webhook...');
    const response = await fetch(N8N_TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatwoot-Signature': 'test-signature'
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('   ✅ Success! Status:', response.status);
      
      // Try to parse response as JSON
      try {
        const result = JSON.parse(responseText);
        if (result.executionId) {
          console.log('   📋 Execution ID:', result.executionId);
          console.log(`   🔗 Check execution: https://primary-production-1af6.up.railway.app/workflow/I6fx7kySryKCu4zi/executions/${result.executionId}`);
        }
      } catch {
        console.log('   📝 Response:', responseText.substring(0, 100));
      }
    } else {
      console.log('   ❌ Error! Status:', response.status);
      console.log('   📝 Response:', responseText);
    }
    
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 n8n Test Webhook - Complete Test Suite');
  console.log('==========================================');
  console.log('Testing URL:', N8N_TEST_WEBHOOK_URL);
  console.log('');
  console.log('This will test:');
  console.log('1. Dynamic conversation ID extraction');
  console.log('2. Broker assignment based on lead score');
  console.log('3. Supabase database queries');
  console.log('4. OpenAI response generation');
  console.log('');
  
  // Run all test cases
  for (const testCase of TEST_CASES) {
    await sendTestWebhook(testCase);
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n==========================================');
  console.log('✅ All tests sent!');
  console.log('');
  console.log('📊 Check n8n for results:');
  console.log('1. Go to: https://primary-production-1af6.up.railway.app');
  console.log('2. Open your workflow');
  console.log('3. Click "Executions" tab');
  console.log('4. Check each test execution');
  console.log('');
  console.log('🔍 What to verify:');
  console.log('✓ Conversation ID is correctly extracted (not 24)');
  console.log('✓ Broker assignment matches expected persona');
  console.log('✓ Database queries succeed (green nodes)');
  console.log('✓ OpenAI generates personalized response');
  console.log('✓ No red error nodes in execution');
}

// Command line argument handling
const args = process.argv.slice(2);

if (args[0] === '--single' && args[1]) {
  // Test single conversation ID
  const conversationId = parseInt(args[1]);
  const singleTest = {
    name: 'Custom Test',
    conversationId: conversationId,
    leadScore: args[2] ? parseInt(args[2]) : 75,
    loanType: 'new_purchase',
    propertyCategory: 'resale',
    monthlyIncome: 8000,
    expectedBroker: 'Based on score'
  };
  
  sendTestWebhook(singleTest).then(() => {
    console.log('\n✅ Test complete!');
  });
} else {
  // Run all tests
  runAllTests();
}

/**
 * USAGE:
 * 
 * Run all test cases:
 * node scripts/test-n8n-webhook-test-mode.js
 * 
 * Test single conversation ID:
 * node scripts/test-n8n-webhook-test-mode.js --single 999
 * 
 * Test single conversation with custom lead score:
 * node scripts/test-n8n-webhook-test-mode.js --single 999 85
 * 
 * TROUBLESHOOTING:
 * 
 * If you see "Conversation ID is 24":
 * - The dynamic ID extraction isn't working
 * - Check the "Code in JavaScript" node update
 * 
 * If database queries fail:
 * - Check Supabase credentials in n8n
 * - Verify tables exist with check-supabase-schema.sql
 * - Check PostgreSQL node connection
 * 
 * If OpenAI fails:
 * - Check OpenAI API key in n8n credentials
 * - Verify API key has credits
 * 
 * If no broker assigned:
 * - Check "Execute a SQL query2" node
 * - Verify ai_brokers table has data
 * - Check assign_best_broker function exists
 */