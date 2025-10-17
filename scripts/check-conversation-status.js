// Check conversation status and details
require('dotenv').config({ path: '.env.local' });

async function checkConversationStatus() {
  const conversationId = process.argv[2] || 44;
  
  const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';
  
  if (!CHATWOOT_API_TOKEN) {
    console.error('❌ CHATWOOT_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('\n🔍 Checking Conversation Status');
  console.log('==================================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  
  try {
    // Get conversation details
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`;
    
    const response = await fetch(url, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('\n📊 Conversation Details:');
      console.log('   Status:', data.status === 'open' ? '🟢 OPEN (Human Agent)' : data.status === 'bot' ? '🤖 BOT' : `⚫ ${data.status}`);
      console.log('   Agent:', data.assignee?.name || 'None');
      console.log('   Contact:', data.meta?.sender?.name || 'Unknown');
      console.log('   Channel:', data.inbox?.name || 'Unknown');
      console.log('   Created:', new Date(data.created_at * 1000).toLocaleString());
      
      console.log('\n🏷️ Custom Attributes:');
      const attrs = data.custom_attributes || {};
      Object.keys(attrs).forEach(key => {
        console.log(`   ${key}: ${attrs[key]}`);
      });
      
      if (data.status !== 'bot') {
        console.log('\n⚠️ Warning: Conversation is not in "bot" status!');
        console.log('   Current status:', data.status);
        console.log('   This means:');
        console.log('   - AI Bot will NOT respond to messages');
        console.log('   - Webhook might not trigger for bot processing');
        console.log('   - Need to change status to "bot" for AI responses');
        
        if (data.status === 'open') {
          console.log('\n💡 To enable AI responses:');
          console.log('   1. Login to Chatwoot admin');
          console.log('   2. Find this conversation');
          console.log('   3. Change status from "open" to "bot"');
          console.log('   4. Or unassign the human agent');
        }
      } else {
        console.log('\n✅ Conversation is in BOT status - AI should respond!');
      }
      
      // Get recent messages
      const messagesUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;
      const messagesResponse = await fetch(messagesUrl, {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
        }
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const recentMessages = messagesData.payload?.slice(0, 3) || [];
        
        console.log('\n💬 Recent Messages:');
        recentMessages.forEach((msg) => {
          const sender = msg.sender?.name || 'Unknown';
          const type = msg.message_type === 0 ? '👤' : '🤖';
          const time = new Date(msg.created_at * 1000).toLocaleTimeString();
          console.log(`   [${time}] ${type} ${sender}: "${msg.content.substring(0, 60)}..."`);
        });
      }
      
    } else {
      console.log('❌ Failed to get conversation:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkConversationStatus();