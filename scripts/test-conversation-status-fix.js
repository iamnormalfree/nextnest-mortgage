/**
 * Verification Test: conversation_status Fix
 *
 * Tests the complete flow to ensure AI broker responds to user messages:
 * 1. Create conversation via /api/chatwoot-conversation
 * 2. Verify conversation has conversation_status: 'bot' in custom_attributes
 * 3. Send user message via Chatwoot API
 * 4. Monitor webhook logs for n8n forwarding
 * 5. Verify n8n workflow receives correct payload with conversation_status: 'bot'
 */

// Use native fetch (available in Node.js 18+)

// Configuration from .env.local
const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = 'ML1DyhzJyDKFFvsZLvEYfHnC';
const CHATWOOT_ACCOUNT_ID = '1';
const API_BASE_URL = 'http://localhost:3001';

// Test data
const testLead = {
  formData: {
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    phone: '+6591234567',
    loanType: 'new_purchase',
    propertyCategory: 'resale',
    propertyType: 'HDB',
    propertyPrice: 500000,
    actualAges: [35],
    actualIncomes: [6000],
    employmentType: 'employed',
    applicantType: 'single'
  },
  sessionId: `test-session-${Date.now()}`,
  leadScore: 75
};

async function step1_CreateConversation() {
  console.log('\n📝 STEP 1: Creating conversation via /api/chatwoot-conversation...');

  const response = await fetch(`${API_BASE_URL}/api/chatwoot-conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testLead)
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  console.log('✅ Conversation created:', {
    success: data.success,
    conversationId: data.conversationId,
    customAttributes: data.widgetConfig?.customAttributes
  });

  return data.conversationId;
}

async function step2_VerifyConversationStatus(conversationId) {
  console.log(`\n🔍 STEP 2: Verifying conversation ${conversationId} has conversation_status in custom_attributes...`);

  const response = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`,
    {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation: ${response.status}`);
  }

  const conversation = await response.json();
  const conversationStatus = conversation.custom_attributes?.conversation_status;

  console.log('📊 Conversation details:', {
    id: conversation.id,
    status: conversation.status,
    custom_attributes: conversation.custom_attributes
  });

  if (conversationStatus === 'bot') {
    console.log('✅ PASS: conversation_status is correctly set to "bot"');
    return true;
  } else {
    console.error('❌ FAIL: conversation_status is NOT set to "bot":', conversationStatus);
    return false;
  }
}

async function step3_SendUserMessage(conversationId) {
  console.log(`\n💬 STEP 3: Sending user message to conversation ${conversationId}...`);

  const userMessage = 'Hello, can you help me with my mortgage application?';

  const response = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: userMessage,
        message_type: 'incoming',
        private: false
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status} ${await response.text()}`);
  }

  const message = await response.json();
  console.log('✅ User message sent:', {
    messageId: message.id,
    content: message.content,
    message_type: message.message_type
  });

  return message.id;
}

async function step4_WaitForWebhook() {
  console.log(`\n⏳ STEP 4: Waiting 10 seconds for webhook to process and n8n to respond...`);
  console.log('👀 Watch your terminal where "npm run dev" is running for:');
  console.log('   🔔 Chatwoot webhook received');
  console.log('   🚀 Forwarding to n8n AI Broker workflow');
  console.log('   📤 Sending to n8n with transformed payload');
  console.log('   ✅ n8n workflow filter requirements check: { all_conditions_met: true }');
  console.log('   ✅ n8n processed successfully');
  console.log('\n⏱️  Waiting...');

  await new Promise(resolve => setTimeout(resolve, 10000));
}

async function step5_CheckForAIResponse(conversationId) {
  console.log(`\n🤖 STEP 5: Checking if AI broker responded in conversation ${conversationId}...`);

  const response = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }

  const data = await response.json();
  const messages = data.payload || data || [];

  console.log(`📬 Found ${messages.length} total messages in conversation`);

  // Look for outgoing messages (from bot) after the initial greeting
  const outgoingMessages = messages.filter(msg =>
    msg.message_type === 1 || msg.message_type === 'outgoing'
  );

  console.log(`\n📤 Outgoing messages (from AI broker):`);
  outgoingMessages.forEach((msg, index) => {
    console.log(`   ${index + 1}. [${new Date(msg.created_at).toLocaleTimeString()}] ${msg.content.substring(0, 80)}...`);
  });

  // Check if there are at least 2 outgoing messages (initial greeting + AI response)
  if (outgoingMessages.length >= 2) {
    console.log('\n✅ PASS: AI broker responded to user message!');
    return true;
  } else if (outgoingMessages.length === 1) {
    console.log('\n⚠️  PARTIAL: Only initial greeting found, AI may not have responded yet');
    console.log('    Try checking again in a few seconds');
    return false;
  } else {
    console.log('\n❌ FAIL: No AI responses found');
    return false;
  }
}

async function runVerificationTest() {
  console.log('🧪 Starting conversation_status Fix Verification Test');
  console.log('=' .repeat(70));

  try {
    // Step 1: Create conversation
    const conversationId = await step1_CreateConversation();

    // Step 2: Verify conversation_status is set
    const statusOk = await step2_VerifyConversationStatus(conversationId);
    if (!statusOk) {
      throw new Error('conversation_status verification failed - aborting test');
    }

    // Step 3: Send user message
    await step3_SendUserMessage(conversationId);

    // Step 4: Wait for processing
    await step4_WaitForWebhook();

    // Step 5: Check for AI response
    const aiResponded = await step5_CheckForAIResponse(conversationId);

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`conversation_status set correctly: ${statusOk ? '✅ YES' : '❌ NO'}`);
    console.log(`AI broker responded: ${aiResponded ? '✅ YES' : '⚠️  NOT YET (may need more time)'}`);
    console.log('\nConversation URL:', `${CHATWOOT_BASE_URL}/app/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`);

    if (statusOk && aiResponded) {
      console.log('\n🎉 SUCCESS: All tests passed! AI broker is responding correctly.');
      process.exit(0);
    } else if (statusOk && !aiResponded) {
      console.log('\n⚠️  INCONCLUSIVE: conversation_status is correct, but AI response not detected yet.');
      console.log('   This may be a timing issue. Check the conversation URL above or server logs.');
      process.exit(1);
    } else {
      console.log('\n❌ FAILURE: conversation_status not set correctly.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runVerificationTest();
