#!/usr/bin/env node

/**
 * Test n8n workflow with real conversation ID
 * This simulates what Chatwoot sends when a real conversation happens
 */

// STEP 1: First create a real conversation in Chatwoot
async function createRealConversation() {
  const CHATWOOT_API = 'https://chat.nextnest.sg/api/v1';
  const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
  
  try {
    // 1. Create or find a contact
    const contactResponse = await fetch(`${CHATWOOT_API}/accounts/1/contacts`, {
      method: 'POST',
      headers: {
        'api-access-token': API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User for n8n',
        email: `test-n8n-${Date.now()}@example.com`,
        phone_number: '+6591234567'
      })
    });
    
    const contact = await contactResponse.json();
    console.log('✅ Contact created:', contact.payload.id);
    
    // 2. Create a conversation with bot status and attributes
    const conversationResponse = await fetch(`${CHATWOOT_API}/accounts/1/conversations`, {
      method: 'POST',
      headers: {
        'api-access-token': API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contact_id: contact.payload.id,
        inbox_id: 1,
        status: 'bot', // IMPORTANT: This triggers the bot
        custom_attributes: {
          // These are what trigger broker assignment
          lead_score: 85,
          loan_type: 'refinancing',
          property_category: 'private_condo',
          monthly_income: 12000,
          loan_amount: 1200000,
          purchase_timeline: 'urgent',
          employment_type: 'self_employed',
          message_count: 0,
          status: 'bot'
        }
      })
    });
    
    const conversation = await conversationResponse.json();
    console.log('✅ Conversation created:', conversation.id);
    
    // 3. Send a message to trigger the webhook
    const messageResponse = await fetch(
      `${CHATWOOT_API}/accounts/1/conversations/${conversation.id}/messages`,
      {
        method: 'POST',
        headers: {
          'api-access-token': API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'I need help refinancing my condo loan. Current rates are too high.',
          message_type: 'incoming',
          private: false
        })
      }
    );
    
    const message = await messageResponse.json();
    console.log('✅ Message sent:', message.id);
    
    return {
      contactId: contact.payload.id,
      conversationId: conversation.id,
      messageId: message.id
    };
    
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return null;
  }
}

// STEP 2: Send webhook payload to n8n
async function testN8nWebhook(conversationId, contactId, messageId) {
  // Your n8n webhook URL - update this!
  const N8N_WEBHOOK_URL = 'https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker';
  
  // This is the exact payload structure Chatwoot sends
  const webhookPayload = {
    event: 'message_created',
    id: `webhook-${Date.now()}`,
    conversation: {
      id: conversationId,  // REAL conversation ID
      contact_id: contactId,
      status: 'bot',
      custom_attributes: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+6591234567',
        lead_score: 85,
        loan_type: 'refinancing',
        property_category: 'private_condo',
        monthly_income: 12000,
        loan_amount: 1200000,
        purchase_timeline: 'urgent',
        employment_type: 'self_employed',
        message_count: 1,
        status: 'bot'
      },
      contact: {
        id: contactId,
        name: 'Test User',
        email: 'test@example.com',
        phone_number: '+6591234567'
      }
    },
    message: {
      id: messageId,
      content: 'I need help refinancing my condo loan. Current rates are too high.',
      message_type: 'incoming',
      created_at: new Date().toISOString(),
      sender: {
        id: contactId,
        type: 'contact',
        name: 'Test User'
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
  
  console.log('\n📤 Sending webhook to n8n...');
  console.log('Conversation ID:', conversationId);
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatwoot-Signature': 'test-signature' // n8n may not verify this
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.text();
    console.log('✅ n8n Response:', response.status, result);
    
    // Wait a bit for n8n to process
    console.log('\n⏳ Waiting 5 seconds for n8n to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the conversation got a response
    await checkConversationResponse(conversationId);
    
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
  }
}

// STEP 3: Check if AI broker responded
async function checkConversationResponse(conversationId) {
  const CHATWOOT_API = 'https://chat.nextnest.sg/api/v1';
  const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
  
  try {
    const response = await fetch(
      `${CHATWOOT_API}/accounts/1/conversations/${conversationId}/messages`,
      {
        headers: {
          'api-access-token': API_TOKEN
        }
      }
    );
    
    const data = await response.json();
    const messages = data.payload || [];
    
    console.log('\n📨 Conversation Messages:');
    messages.forEach(msg => {
      console.log(`  [${msg.message_type === 0 ? 'USER' : 'BOT'}]: ${msg.content?.substring(0, 100)}...`);
    });
    
    // Check custom attributes to see if broker was assigned
    const convResponse = await fetch(
      `${CHATWOOT_API}/accounts/1/conversations/${conversationId}`,
      {
        headers: {
          'api-access-token': API_TOKEN
        }
      }
    );
    
    const convData = await convResponse.json();
    console.log('\n🤖 Broker Assignment:');
    console.log('  Broker ID:', convData.custom_attributes?.ai_broker_id || 'Not assigned');
    console.log('  Broker Name:', convData.custom_attributes?.ai_broker_name || 'Not assigned');
    console.log('  Persona:', convData.custom_attributes?.broker_persona || 'Not assigned');
    
  } catch (error) {
    console.error('❌ Error checking response:', error);
  }
}

// MAIN: Run the test
async function runTest() {
  console.log('🚀 Starting n8n Real Conversation Test\n');
  console.log('This test will:');
  console.log('1. Create a real conversation in Chatwoot');
  console.log('2. Send webhook to n8n with real conversation ID');
  console.log('3. Check if AI broker responded\n');
  
  // Option 1: Create new conversation
  const realData = await createRealConversation();
  
  if (realData) {
    await testN8nWebhook(
      realData.conversationId, 
      realData.contactId, 
      realData.messageId
    );
  }
  
  // Option 2: Use existing conversation (uncomment to use)
  /*
  const EXISTING_CONVERSATION_ID = 123; // Replace with real ID
  const EXISTING_CONTACT_ID = 456;      // Replace with real ID
  const EXISTING_MESSAGE_ID = 789;      // Replace with real ID
  
  await testN8nWebhook(
    EXISTING_CONVERSATION_ID,
    EXISTING_CONTACT_ID,
    EXISTING_MESSAGE_ID
  );
  */
}

// Run the test
runTest().catch(console.error);

/**
 * IMPORTANT NOTES FOR TESTING:
 * 
 * 1. Update n8n workflow "Code in JavaScript" node:
 *    - Remove: const conversationId = 24;
 *    - Add: const conversationId = input.conversationId || input.customer?.conversationId;
 * 
 * 2. For Supabase:
 *    - If testing without Supabase connected, the broker assignment will fail
 *    - You can temporarily bypass by using mock data in n8n
 *    - Or set up Supabase first (recommended)
 * 
 * 3. Check n8n execution logs:
 *    - Go to n8n workflow executions
 *    - Look for any errors in red
 *    - Check each node's output
 * 
 * 4. Common issues:
 *    - Webhook URL incorrect: Update N8N_WEBHOOK_URL
 *    - n8n workflow not active: Activate it
 *    - Database connection failed: Check Supabase credentials
 *    - OpenAI key invalid: Update in n8n credentials
 */