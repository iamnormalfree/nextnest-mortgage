/**
 * Test webhook with real conversation ID
 */

const CHATWOOT_API_URL = 'https://chat.nextnest.sg';
const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const LOCAL_WEBHOOK = 'http://localhost:3004/api/chatwoot-webhook';

async function testWithRealConversation() {
  console.log('🔍 Finding a real conversation to test with...\n');
  
  try {
    // Get recent conversations
    const response = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/conversations`, {
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.data?.conversations && data.data.conversations.length > 0) {
        const conversation = data.data.conversations[0];
        console.log(`✅ Found conversation: ${conversation.id}`);
        console.log(`   Status: ${conversation.status}`);
        console.log(`   Contact: ${conversation.meta?.sender?.name || 'Unknown'}\n`);
        
        // Create a test webhook event with real conversation ID
        const webhookEvent = {
          event: 'message_created',
          id: 'test-real-' + Date.now(),
          message: {
            id: Date.now(),
            content: 'What are the current mortgage rates for HDB?',
            message_type: 'incoming',
            private: false,
            created_at: new Date().toISOString(),
            sender: {
              id: conversation.meta?.sender?.id || 1,
              name: conversation.meta?.sender?.name || 'Test User',
              email: conversation.meta?.sender?.email || 'test@example.com',
              type: 'contact'
            }
          },
          conversation: {
            id: conversation.id,
            status: conversation.status,
            custom_attributes: conversation.custom_attributes || {
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
        
        console.log('📤 Sending webhook event to local server...\n');
        
        const webhookResponse = await fetch(LOCAL_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookEvent)
        });
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook processed successfully!');
          console.log('\n🔍 Check Chatwoot conversation for AI response');
          console.log(`   Conversation URL: ${CHATWOOT_API_URL}/app/accounts/1/conversations/${conversation.id}`);
          
          // Wait a bit then check if message was sent
          console.log('\n⏳ Waiting 3 seconds for AI response...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check conversation messages
          const messagesResponse = await fetch(
            `${CHATWOOT_API_URL}/api/v1/accounts/1/conversations/${conversation.id}/messages`,
            {
              headers: {
                'Api-Access-Token': API_TOKEN
              }
            }
          );
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const recentMessages = messagesData.payload?.slice(-2);
            
            console.log('\n📨 Recent messages in conversation:');
            recentMessages?.forEach(msg => {
              console.log(`   [${msg.message_type}] ${msg.content?.substring(0, 100)}...`);
            });
          }
        } else {
          console.error('❌ Webhook failed:', webhookResponse.status);
        }
        
      } else {
        console.log('❌ No conversations found');
        console.log('   Create a conversation in Chatwoot first');
      }
    } else {
      console.error('❌ Failed to fetch conversations:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n\n📋 TROUBLESHOOTING:');
  console.log('====================');
  console.log('If the AI response is not appearing:');
  console.log('1. Check your server logs for errors');
  console.log('2. Ensure the bot webhook URL is set to your localtunnel URL');
  console.log('3. Make sure the conversation status is "bot" or "pending"');
  console.log('4. Verify the bot is connected to the inbox');
}

// Run the test
testWithRealConversation().catch(console.error);