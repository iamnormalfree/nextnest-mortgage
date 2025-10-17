// Test script to trigger AI bot response for rates question

async function testRatesResponse() {
  try {
    // First, send the webhook event
    const webhookResponse = await fetch('http://localhost:3004/api/chatwoot-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'message_created',
        message: {
          id: 75,
          content: 'tell me more about rates',
          message_type: 'incoming',
          private: false,
          sender: { type: 'contact' }
        },
        conversation: {
          id: 33,
          status: 'bot',
          custom_attributes: {
            lead_score: 100,
            broker_persona: 'balanced',
            ai_broker_name: 'Sarah Wong',
            loan_type: 'new_purchase',
            property_category: 'resale',
            employment_type: 'employed',
            monthly_income: 5000
          }
        }
      })
    });
    
    console.log('Webhook response:', await webhookResponse.json());
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if response was sent to Chatwoot
    const messagesResponse = await fetch(
      'https://chat.nextnest.sg/api/v1/accounts/1/conversations/33/messages',
      {
        headers: {
          'Api-Access-Token': process.env.CHATWOOT_API_TOKEN
        }
      }
    );
    
    const messages = await messagesResponse.json();
    const lastMessage = messages.payload[0];
    
    console.log('\n✅ Last message in conversation:');
    console.log('From:', lastMessage.sender?.name || 'Bot');
    console.log('Content:', lastMessage.content.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRatesResponse();