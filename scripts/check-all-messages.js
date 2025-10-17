// Check all messages in a conversation
require('dotenv').config({ path: '.env.local' });

async function checkAllMessages() {
  const conversationId = process.argv[2] || 44;
  
  const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';
  
  console.log('\n📬 Fetching ALL Messages');
  console.log('========================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  
  try {
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;
    
    const response = await fetch(url, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
      }
    });

    if (response.ok) {
      const data = await response.json();
      const messages = data.payload || [];
      
      console.log(`\n📊 Total Messages: ${messages.length}`);
      console.log('\n🔍 Last 10 Messages (newest first):');
      console.log('====================================');
      
      messages.slice(0, 10).forEach((msg, index) => {
        const time = new Date(msg.created_at * 1000).toLocaleTimeString();
        const date = new Date(msg.created_at * 1000).toLocaleDateString();
        const type = msg.message_type === 0 ? '👤 IN' : '🤖 OUT';
        const sender = msg.sender?.name || 'Unknown';
        const private_tag = msg.private ? ' [PRIVATE]' : '';
        
        console.log(`\n${index + 1}. [${date} ${time}] ${type} ${sender}${private_tag}`);
        console.log(`   ID: ${msg.id} | Type: ${msg.message_type}`);
        console.log(`   "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`);
      });
      
      // Check for AI responses
      const outgoingMessages = messages.filter(m => m.message_type === 1);
      const recentOutgoing = outgoingMessages.filter(m => {
        const msgTime = new Date(m.created_at * 1000);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return msgTime > fiveMinutesAgo;
      });
      
      console.log('\n📈 Statistics:');
      console.log(`   Total outgoing messages: ${outgoingMessages.length}`);
      console.log(`   Recent (last 5 min): ${recentOutgoing.length}`);
      
      if (recentOutgoing.length > 0) {
        console.log('\n✅ Recent AI Responses Detected:');
        recentOutgoing.forEach(msg => {
          const time = new Date(msg.created_at * 1000).toLocaleTimeString();
          console.log(`   [${time}] "${msg.content.substring(0, 80)}..."`);
        });
      }
      
    } else {
      console.log('❌ Failed to fetch messages:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkAllMessages();