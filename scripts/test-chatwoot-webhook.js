/**
 * Test Chatwoot Webhook Configuration
 * This script tests if the webhook endpoint is properly receiving events
 */

const WEBHOOK_URL = 'http://localhost:3004/api/chatwoot-webhook';

// Simulate a Chatwoot message_created event
const testEvent = {
  event: 'message_created',
  id: 'test-' + Date.now(),
  message: {
    id: 12345,
    content: 'What are the current mortgage rates?',
    message_type: 'incoming',
    private: false,
    created_at: new Date().toISOString(),
    sender: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    }
  },
  conversation: {
    id: 99999,
    status: 'bot',
    custom_attributes: {
      lead_score: 75,
      broker_persona: 'balanced',
      ai_broker_name: 'Sarah Wong',
      property_type: 'HDB',
      monthly_income: 8000,
      message_count: 1
    }
  },
  account: {
    id: 1,
    name: 'NextNest'
  }
};

async function testWebhook() {
  console.log('🧪 Testing Chatwoot Webhook...\n');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('Event Type:', testEvent.event);
  console.log('Message:', testEvent.message.content);
  console.log('\n📤 Sending test event...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatwoot-Signature': 'test-signature' // In production, Chatwoot signs these
      },
      body: JSON.stringify(testEvent)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook responded successfully!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // The webhook should have triggered AI response generation
      console.log('\n🤖 AI Response should be generated and sent back to Chatwoot');
      console.log('Check your server logs for:');
      console.log('  - "🔔 Chatwoot webhook received"');
      console.log('  - "🤖 Processing message for Sarah Wong"');
      console.log('  - "🤖 Generating broker response"');
    } else {
      console.error('❌ Webhook error:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Failed to reach webhook:', error.message);
    console.log('\n⚠️  Make sure:');
    console.log('  1. Your Next.js dev server is running on port 3004');
    console.log('  2. The webhook endpoint exists at /api/chatwoot-webhook');
  }
}

// Run the test
testWebhook();

console.log('\n📝 Next Steps:');
console.log('1. Go to Chatwoot Settings → Bots');
console.log('2. Create a new Agent Bot with webhook URL: https://nextnest.sg/api/chatwoot-webhook');
console.log('3. Connect the bot to your inbox');
console.log('4. Test with a real message in Chatwoot');