#!/usr/bin/env node

/**
 * Test n8n webhook for HANDOFF scenarios (shouldHandoff = true)
 * This tests the TRUE branch of the second IF node
 */

const N8N_TEST_WEBHOOK_URL = 'https://primary-production-1af6.up.railway.app/webhook-test/chatwoot-ai-broker';

const HANDOFF_TEST_CASES = [
  {
    name: 'Customer Ready to Apply',
    conversationId: 95001,
    message: 'Yes, I am ready to apply now. Let\'s proceed with the application.',
    messageCount: 8,
    leadScore: 85,
    expectedHandoff: true,
    expectedReason: 'Customer explicitly requested to proceed or speak with human'
  },
  {
    name: 'Request Human Agent',
    conversationId: 95003,
    message: 'I want to speak to a real person please',
    messageCount: 5,
    leadScore: 75,
    expectedHandoff: true,
    expectedReason: 'Customer explicitly requested to proceed or speak with human'
  },
  {
    name: 'High-Value Lead After Multiple Messages',
    conversationId: 95003,
    message: 'What are the next steps? I think I understand everything.',
    messageCount: 10,  // 7+ messages
    leadScore: 90,     // 80+ score
    expectedHandoff: true,
    expectedReason: 'High-value lead ready for conversion'
  },
  {
    name: 'Complex Situation',
    conversationId: 95004,
    message: 'I am going through a divorce and need to refinance. Is this complicated?',
    messageCount: 3,
    leadScore: 60,
    expectedHandoff: true,
    expectedReason: 'Complex situation requiring specialist attention'
  },
  {
    name: 'Customer Frustration',
    conversationId: 95005,
    message: 'This is frustrating. You are not helpful at all!',
    messageCount: 4,
    leadScore: 70,
    expectedHandoff: true,
    expectedReason: 'Customer showing frustration - immediate attention needed'
  }
];

async function testHandoffScenario(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Conversation ID: ${testCase.conversationId}`);
  console.log(`   Message: "${testCase.message}"`);
  console.log(`   Message Count: ${testCase.messageCount}`);
  console.log(`   Lead Score: ${testCase.leadScore}`);
  console.log(`   Expected Handoff: ${testCase.expectedHandoff}`);
  
  const payload = {
    event: 'message_created',
    id: `test-webhook-${Date.now()}`,
    conversation: {
      id: testCase.conversationId,
      contact_id: 99999,
      status: 'bot',
      custom_attributes: {
        name: `Test User ${testCase.conversationId}`,
        email: `test-${testCase.conversationId}@example.com`,
        phone: '+6591234567',
        lead_score: testCase.leadScore,
        loan_type: 'refinancing',
        property_category: 'private_condo',
        monthly_income: 12000,
        loan_amount: 1200000,
        purchase_timeline: 'urgent',
        employment_type: 'employed',
        message_count: testCase.messageCount - 1,  // Current count before this message
        status: 'bot',
        ai_broker_id: '84372c72-8ed5-4bde-bbf9-567b117acffa',
        ai_broker_name: 'Michelle Chen'
      },
      contact: {
        id: 99999,
        name: `Test User ${testCase.conversationId}`,
        email: `test-${testCase.conversationId}@example.com`,
        phone_number: '+6591234567'
      }
    },
    message: {
      id: 300000 + testCase.conversationId,
      content: testCase.message,
      message_type: 'incoming',
      created_at: new Date().toISOString(),
      sender: {
        id: 99999,
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
      
      try {
        const result = JSON.parse(responseText);
        if (result.executionId) {
          console.log('   📋 Execution ID:', result.executionId);
        }
      } catch {
        console.log('   📝 Response received');
      }
    } else {
      console.log('   ❌ Error! Status:', response.status);
    }
    
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
  }
  
  console.log('\n   📊 Expected Flow:');
  console.log('   1. Check Handoff Triggers → shouldHandoff: TRUE');
  console.log('   2. IF2 → TRUE branch (handoff needed)');
  console.log('   3. Handle Handoff to Human Agent node executes');
  console.log('   4. Would update conversation status to "open"');
  console.log('   5. Would add internal note with handoff details');
  console.log(`   6. Reason: ${testCase.expectedReason}`);
}

async function runAllHandoffTests() {
  console.log('🚀 n8n Handoff Test Suite');
  console.log('=========================');
  console.log('Testing scenarios that should trigger handoff to human agent');
  console.log('');
  
  for (const testCase of HANDOFF_TEST_CASES) {
    await testHandoffScenario(testCase);
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n=========================');
  console.log('✅ All handoff tests sent!');
  console.log('');
  console.log('📊 Check n8n execution logs to verify:');
  console.log('1. shouldHandoff is TRUE');
  console.log('2. IF2 goes to TRUE branch');
  console.log('3. "Handle Handoff to Human Agent" node executes');
  console.log('4. Internal note would be added (in test mode)');
  console.log('5. Conversation status would change to "open"');
  console.log('');
  console.log('🔍 In the "Check Handoff Triggers" node output, verify:');
  console.log('- shouldHandoff: true');
  console.log('- handoffReason: matches expected reason');
  console.log('- urgencyLevel: high/medium/urgent based on scenario');
}

// Command line argument handling
const args = process.argv.slice(2);

if (args[0] && parseInt(args[0]) >= 0 && parseInt(args[0]) < HANDOFF_TEST_CASES.length) {
  // Test specific scenario
  const index = parseInt(args[0]);
  testHandoffScenario(HANDOFF_TEST_CASES[index]);
} else {
  // Run all tests
  runAllHandoffTests();
}

/**
 * USAGE:
 * 
 * Test all handoff scenarios:
 * node scripts/test-n8n-handoff.js
 * 
 * Test specific scenario (0-4):
 * node scripts/test-n8n-handoff.js 0  # Test "ready to apply"
 * node scripts/test-n8n-handoff.js 1  # Test "speak to human"
 * node scripts/test-n8n-handoff.js 2  # Test high-value after many messages
 * node scripts/test-n8n-handoff.js 3  # Test complex situation
 * node scripts/test-n8n-handoff.js 4  # Test frustration
 * 
 * WHAT TO CHECK IN N8N:
 * 
 * 1. Check Handoff Triggers node should output:
 *    - shouldHandoff: true
 *    - handoffReason: (specific reason)
 *    - urgencyLevel: high/medium/urgent
 * 
 * 2. IF2 node should go to TRUE branch
 * 
 * 3. "Handle Handoff to Human Agent" node should:
 *    - Return test_mode status (for test IDs)
 *    - Show what actions would be taken
 *    - Include handoff details
 */