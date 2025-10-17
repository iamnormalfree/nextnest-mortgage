#!/usr/bin/env node

/**
 * Test n8n webhook for TRUE branch (new broker assignment)
 * This creates a test with a NEW conversation ID that doesn't have a broker yet
 */

const N8N_TEST_WEBHOOK_URL = 'https://primary-production-1af6.up.railway.app/webhook-test/chatwoot-ai-broker';

// Generate a unique conversation ID that won't exist in database
const NEW_CONVERSATION_ID = 90000 + Math.floor(Math.random() * 10000);

async function testNewBrokerAssignment() {
  console.log('🚀 Testing NEW Broker Assignment (True Branch)');
  console.log('   Conversation ID:', NEW_CONVERSATION_ID);
  console.log('   This ID should NOT exist in database, triggering new assignment\n');
  
  const payload = {
    event: 'message_created',
    id: `test-webhook-${Date.now()}`,
    conversation: {
      id: NEW_CONVERSATION_ID,  // New conversation ID
      contact_id: 99999,        // New contact ID
      status: 'bot',
      custom_attributes: {
        name: 'New Test User',
        email: `newuser-${NEW_CONVERSATION_ID}@example.com`,
        phone: '+6598765432',
        lead_score: 82,          // High score for aggressive broker
        loan_type: 'refinancing',
        property_category: 'private_condo',
        monthly_income: 15000,
        loan_amount: 1500000,
        purchase_timeline: 'urgent',
        employment_type: 'employed',
        message_count: 0,        // First message
        status: 'bot'
      },
      contact: {
        id: 99999,
        name: 'New Test User',
        email: `newuser-${NEW_CONVERSATION_ID}@example.com`,
        phone_number: '+6598765432'
      }
    },
    message: {
      id: 200000 + NEW_CONVERSATION_ID,
      content: 'Hi, I need to refinance my condo urgently. What are the best rates?',
      message_type: 'incoming',
      created_at: new Date().toISOString(),
      sender: {
        id: 99999,
        type: 'contact',
        name: 'New Test User'
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
    console.log('📤 Sending webhook for NEW broker assignment...');
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
      console.log('✅ Success! Status:', response.status);
      
      try {
        const result = JSON.parse(responseText);
        if (result.executionId) {
          console.log('📋 Execution ID:', result.executionId);
        }
      } catch {
        console.log('📝 Response:', responseText.substring(0, 200));
      }
    } else {
      console.log('❌ Error! Status:', response.status);
      console.log('📝 Response:', responseText);
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  console.log('\n📊 Expected Flow:');
  console.log('1. Check Broker Assignment → hasbroker: false');
  console.log('2. IF1 → True branch (no broker assigned)');
  console.log('3. Assign Best Broker → Should assign broker based on score 82');
  console.log('4. Create Assignment Records → Insert new record');
  console.log('5. Merge Broker Context → Continue with assigned broker');
  console.log('\n🔍 Check n8n execution to verify:');
  console.log('- "Check Broker Assignment" returns hasbroker: false');
  console.log('- "Assign Best Broker" assigns Michelle Chen or similar (score 82)');
  console.log('- "Create Assignment Records" successfully inserts');
  console.log('- No errors in any node');
}

// Also create a function to test existing broker (False branch)
async function testExistingBroker() {
  console.log('\n🚀 Testing EXISTING Broker (False Branch)');
  console.log('   Using conversation ID: 456 (has Michelle Chen)\n');
  
  const payload = {
    event: 'message_created',
    id: `test-webhook-${Date.now()}`,
    conversation: {
      id: 456,  // Existing conversation with broker
      contact_id: 5679,
      status: 'bot',
      custom_attributes: {
        name: 'Test User 456',
        email: 'test-456@example.com',
        phone: '+6591234567',
        lead_score: 85,
        loan_type: 'new_purchase',
        property_category: 'resale',
        monthly_income: 8000,
        loan_amount: 800000,
        purchase_timeline: 'urgent',
        employment_type: 'employed',
        message_count: 3,  // Ongoing conversation
        status: 'bot'
      },
      contact: {
        id: 5679,
        name: 'Test User 456',
        email: 'test-456@example.com',
        phone_number: '+6591234567'
      }
    },
    message: {
      id: 98767,
      content: 'What about the interest rates for 30-year loans?',
      message_type: 'incoming',
      created_at: new Date().toISOString(),
      sender: {
        id: 5679,
        type: 'contact',
        name: 'Test User 456'
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
    console.log('📤 Sending webhook for EXISTING broker...');
    const response = await fetch(N8N_TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatwoot-Signature': 'test-signature'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log('✅ Success!');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n📊 Expected Flow:');
  console.log('1. Check Broker Assignment → hasbroker: true (Michelle Chen)');
  console.log('2. IF1 → False branch (broker exists)');
  console.log('3. Get Broker Details → Fetch Michelle Chen details');
  console.log('4. Merge Broker Context → Continue with existing broker');
}

// Run tests based on command line argument
const args = process.argv.slice(2);

if (args[0] === '--existing') {
  testExistingBroker();
} else if (args[0] === '--both') {
  testNewBrokerAssignment().then(() => {
    setTimeout(() => {
      testExistingBroker();
    }, 3000);
  });
} else {
  // Default: test new broker assignment
  testNewBrokerAssignment();
}

/**
 * USAGE:
 * 
 * Test NEW broker assignment (True branch):
 * node scripts/test-n8n-new-broker.js
 * 
 * Test EXISTING broker (False branch):
 * node scripts/test-n8n-new-broker.js --existing
 * 
 * Test BOTH scenarios:
 * node scripts/test-n8n-new-broker.js --both
 */