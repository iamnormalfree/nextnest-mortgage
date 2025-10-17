/**
 * Create a test customer message in Chatwoot to trigger the bot
 */

const CHATWOOT_API_URL = 'https://chat.nextnest.sg';
const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}

async function createTestMessage() {
  try {
    console.log('🎭 Creating a test customer message to trigger the bot...\n');
    
    // First, create a new contact
    const contact = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/contacts`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Bot Test User',
        email: 'bottest@example.com',
        phone_number: '+6591234567'
      })
    });

    const contactData = await contact.json();
    console.log('✅ Created test contact:', contactData.payload?.contact?.name);

    // Create a conversation in the API inbox (assuming inbox ID 1)
    const conversation = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/conversations`, {
      method: 'POST',
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_id: `test-${Date.now()}`,
        inbox_id: 1,
        contact_id: contactData.payload?.contact?.id,
        custom_attributes: {
          lead_score: 80,
          broker_persona: 'balanced',
          property_type: 'HDB',
          monthly_income: 7000
        }
      })
    });

    const conversationData = await conversation.json();
    console.log('✅ Created conversation:', conversationData.id);

    // Now create an incoming message that should trigger the bot
    const message = await fetch(
      `${CHATWOOT_API_URL}/api/v1/accounts/1/conversations/${conversationData.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'Hi! I need help with mortgage rates for my HDB purchase. What options do I have?',
          message_type: 'incoming',
          private: false
        })
      }
    );

    const messageData = await message.json();
    
    if (message.ok) {
      console.log('✅ Created incoming message - this should trigger your bot!');
      console.log(`📧 Message: "${messageData.content}"`);
      console.log(`🔗 View conversation: ${CHATWOOT_API_URL}/app/accounts/1/conversations/${conversationData.id}`);
      
      console.log('\n🔍 Watch your terminal for webhook logs:');
      console.log('   🔔 Chatwoot webhook received');
      console.log('   📝 Full webhook event');
      console.log('   ✅ Processing incoming message from user');
      console.log('   🤖 AI response sent to Chatwoot');
      
      // Wait a bit then check for bot response
      console.log('\n⏳ Waiting 5 seconds for bot response...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const messagesResponse = await fetch(
        `${CHATWOOT_API_URL}/api/v1/accounts/1/conversations/${conversationData.id}/messages`,
        {
          headers: { 'Api-Access-Token': API_TOKEN }
        }
      );
      
      const allMessages = await messagesResponse.json();
      console.log(`\n📨 Total messages in conversation: ${allMessages.payload?.length || 0}`);
      
      if (allMessages.payload?.length > 1) {
        console.log('✅ Bot responded! Latest messages:');
        allMessages.payload.slice(-2).forEach(msg => {
          console.log(`   [${msg.message_type}] ${msg.content?.substring(0, 100)}...`);
        });
      } else {
        console.log('❌ No bot response yet. Check your webhook logs.');
      }
      
    } else {
      console.error('❌ Failed to create message:', messageData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
createTestMessage().catch(console.error);