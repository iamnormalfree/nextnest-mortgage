// Test if webhook is being received by sending a test webhook payload
require('dotenv').config({ path: '.env.local' });

async function testWebhookReception() {
  const conversationId = process.argv[2] || 44;
  
  console.log('\n🔔 Testing Webhook Reception');
  console.log('============================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  
  // Simulate a Chatwoot webhook payload
  const webhookPayload = {
    event: 'message_created',
    conversation: {
      id: conversationId,
      status: 'bot', // Pretend it's bot status
      custom_attributes: {
        ai_broker_id: 'test-broker',
        ai_broker_name: 'Michelle Chen',
        broker_persona: 'balanced',
        lead_score: 75
      }
    },
    message: {
      id: Date.now(),
      content: 'Test webhook message - What are the mortgage rates?',
      message_type: 'incoming',
      private: false,
      sender: {
        type: 'contact',
        name: 'Test User'
      }
    }
  };
  
  try {
    console.log('📤 Sending test webhook to your app...');
    console.log('   Endpoint: http://localhost:3000/api/chatwoot-webhook');
    
    const response = await fetch('http://localhost:3000/api/chatwoot-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook received successfully!');
      console.log('   Response:', JSON.stringify(data, null, 2));
      
      console.log('\n📋 This means:');
      console.log('   - Your webhook endpoint is working');
      console.log('   - It should forward to n8n if enabled');
      console.log('   - Check server logs to see if n8n was contacted');
      
      console.log('\n🔍 Now check:');
      console.log('   1. Server console for webhook processing logs');
      console.log('   2. n8n workflow execution history');
      console.log('   3. Chatwoot for any AI response');
      
    } else {
      console.log('❌ Webhook endpoint failed:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 This usually means:');
    console.log('   - Your Next.js server is not running');
    console.log('   - Or the webhook endpoint has an error');
  }
  
  console.log('\n=====================================');
  console.log('📝 Webhook Configuration in Chatwoot:');
  console.log('1. Login to Chatwoot admin');
  console.log('2. Go to Settings → Integrations → Webhooks');
  console.log('3. Add webhook URL: https://YOUR_APP_URL/api/chatwoot-webhook');
  console.log('4. Select events: message_created, conversation_status_changed');
  console.log('5. Save and test');
}

testWebhookReception();