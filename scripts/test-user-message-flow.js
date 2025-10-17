/**
 * Test script to verify user message triggers n8n workflow
 * Run this while sending a user message in Chatwoot to see the flow
 */

// Using native fetch (Node 18+)

// Test Configuration
const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = '1';
const N8N_WEBHOOK_URL = 'https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker';
const NEXTNEST_WEBHOOK_URL = 'https://e07cec3fd516.ngrok-free.app/api/chatwoot-webhook';

console.log('🧪 Testing User Message → NextNest → n8n Flow');
console.log('='.repeat(50));

async function testUserMessageFlow() {
  try {
    console.log('📋 Test Setup:');
    console.log('   - Chatwoot:', CHATWOOT_BASE_URL);
    console.log('   - NextNest Webhook:', NEXTNEST_WEBHOOK_URL);
    console.log('   - n8n Webhook:', N8N_WEBHOOK_URL);
    console.log('');

    // Step 1: Create a test conversation or use existing one
    console.log('🔍 Step 1: Finding or creating test conversation...');
    
    // Get conversations to find one to test with
    const conversationsResponse = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!conversationsResponse.ok) {
      throw new Error(`Failed to get conversations: ${conversationsResponse.status}`);
    }

    const conversations = await conversationsResponse.json();
    console.log(`   Found ${conversations.data?.length || 0} conversations`);

    // Find a bot conversation or use the first one
    let testConversation = conversations.data?.find(c => c.status === 'bot') || conversations.data?.[0];
    
    if (!testConversation) {
      console.log('❌ No conversations found. Please create a conversation in Chatwoot first.');
      return;
    }

    console.log(`   Using conversation ID: ${testConversation.id}`);
    console.log(`   Status: ${testConversation.status}`);
    console.log('');

    // Step 2: Test n8n webhook directly first
    console.log('🔧 Step 2: Testing n8n webhook directly...');
    
    const testPayload = {
      event: 'message_created',
      content: 'Test message from script',
      message: {
        message_type: 'incoming',
        sender: { type: 'contact' },
        content: 'Test message from script'
      },
      conversation: {
        id: testConversation.id,
        status: 'bot',
        custom_attributes: {}
      }
    };

    try {
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        timeout: 10000
      });

      if (n8nResponse.ok) {
        const n8nResult = await n8nResponse.json();
        console.log('✅ n8n webhook responded successfully');
        console.log('   Response:', JSON.stringify(n8nResult, null, 2));
      } else {
        console.log('❌ n8n webhook failed:', n8nResponse.status);
        const errorText = await n8nResponse.text();
        console.log('   Error:', errorText);
      }
    } catch (n8nError) {
      console.log('❌ n8n webhook error:', n8nError.message);
    }
    console.log('');

    // Step 3: Test NextNest webhook
    console.log('🔧 Step 3: Testing NextNest webhook...');
    
    try {
      const nextNestResponse = await fetch(NEXTNEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          event: 'message_created',
          content: 'Test message via NextNest',
          message: {
            message_type: 0, // incoming
            sender: { type: 'contact' },
            content: 'Test message via NextNest',
            private: false
          },
          conversation: {
            id: testConversation.id,
            status: 'bot',
            custom_attributes: {},
            contact: {
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        }),
        timeout: 15000
      });

      if (nextNestResponse.ok) {
        const nextNestResult = await nextNestResponse.json();
        console.log('✅ NextNest webhook responded successfully');
        console.log('   Response:', JSON.stringify(nextNestResult, null, 2));
      } else {
        console.log('❌ NextNest webhook failed:', nextNestResponse.status);
        const errorText = await nextNestResponse.text();
        console.log('   Error:', errorText);
      }
    } catch (nextNestError) {
      console.log('❌ NextNest webhook error:', nextNestError.message);
    }
    console.log('');

    // Step 4: Instructions for manual testing
    console.log('📋 Step 4: Manual Testing Instructions');
    console.log('-'.repeat(40));
    console.log('1. Go to Chatwoot: https://chat.nextnest.sg');
    console.log(`2. Open conversation ID: ${testConversation.id}`);
    console.log('3. Send a message AS THE CUSTOMER (not as agent)');
    console.log('4. Watch your NextNest dev server logs (port 3004)');
    console.log('5. Check n8n logs at: https://primary-production-1af6.up.railway.app');
    console.log('');
    
    console.log('✅ Expected Flow:');
    console.log('   User types → Chatwoot → NextNest logs webhook');
    console.log('   → NextNest calls n8n → n8n processes → AI response');
    console.log('');
    
    console.log('❌ If flow breaks, check:');
    console.log('   - Chatwoot bot webhook URL points to your NextNest');
    console.log('   - NextNest dev server is running on port 3004');
    console.log('   - ngrok URL is active and accessible');
    console.log('   - n8n workflow is active and listening');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserMessageFlow();