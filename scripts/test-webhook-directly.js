/**
 * Direct Webhook Test
 * Simulates Chatwoot sending a webhook to our /api/chatwoot-webhook endpoint
 * to verify the conversation_status fix works in the webhook handler
 */

const WEBHOOK_URL = 'http://localhost:3001/api/chatwoot-webhook';
const CONVERSATION_ID = 276; // From previous test

// Simulated Chatwoot webhook payload for a user message
const webhookPayload = {
  event: 'message_created',
  id: Date.now(),
  content: 'Hello, can you help me with my mortgage application?',
  message_type: 0, // incoming
  created_at: new Date().toISOString(),
  private: false,
  sender: {
    type: 'contact',
    id: 58
  },
  conversation: {
    id: CONVERSATION_ID,
    status: 'open',
    custom_attributes: {
      conversation_status: 'bot', // This should be set by our fix
      ai_broker_name: 'Jasmine Lee',
      lead_score: 75,
      loan_type: 'new_purchase'
    }
  }
};

async function sendWebhook() {
  console.log('🧪 Testing webhook handler with conversation_status...\n');
  console.log('📤 Sending webhook payload to:', WEBHOOK_URL);
  console.log('📦 Payload:', JSON.stringify(webhookPayload, null, 2));

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookPayload)
  });

  console.log('\n📥 Response status:', response.status);

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Webhook processed successfully:', data);
  } else {
    console.error('❌ Webhook failed:', await response.text());
  }

  console.log('\n👀 Check your "npm run dev" terminal for:');
  console.log('   🔔 Chatwoot webhook received');
  console.log('   🚀 Forwarding to n8n AI Broker workflow');
  console.log('   📤 Sending to n8n with transformed payload');
  console.log('   ✅ n8n workflow filter requirements check: { all_conditions_met: true }');
  console.log('   ✅ n8n processed successfully');
}

sendWebhook().catch(console.error);
