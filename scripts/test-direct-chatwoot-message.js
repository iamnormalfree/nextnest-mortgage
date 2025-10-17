// Test sending message directly to Chatwoot API
require('dotenv').config({ path: '.env.local' });
// Using built-in fetch (Node.js 18+)

async function testDirectChatwootMessage() {
  const conversationId = process.argv[2] || 44;
  const message = process.argv[3] || "What are the best mortgage rates available?";
  
  const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';
  
  if (!CHATWOOT_API_TOKEN) {
    console.error('❌ CHATWOOT_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('\n🔄 Testing Direct Chatwoot Message');
  console.log('=====================================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  console.log(`💬 Message: "${message}"`);
  console.log(`🌐 Chatwoot URL: ${CHATWOOT_BASE_URL}`);
  console.log('\n');
  
  try {
    // Send message directly to Chatwoot
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;
    
    console.log('📤 Sending message directly to Chatwoot API...');
    console.log('   URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message,
        message_type: 'incoming', // User message
        private: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Message sent successfully!');
      console.log('   Message ID:', data.id);
      console.log('   Created at:', data.created_at);
      console.log('   Sender:', data.sender?.name || 'Unknown');
      
      console.log('\n📋 Expected Flow:');
      console.log('1. Message appears in Chatwoot UI');
      console.log('2. Chatwoot webhook fires to your app');
      console.log('3. Your app forwards to n8n');
      console.log('4. n8n processes with AI and responds');
      console.log('5. AI response appears in Chatwoot');
      
      console.log('\n🔍 Check these locations:');
      console.log('   - Chatwoot UI: https://chat.nextnest.sg (login as agent)');
      console.log('   - Visitor view: https://chat.nextnest.sg/widget?website_token=YOUR_TOKEN');
      console.log('   - Your app: http://localhost:3000/chat?conversation=' + conversationId);
      
      // Wait and check for response
      console.log('\n⏳ Waiting 8 seconds for AI response...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Fetch messages again
      console.log('\n📬 Fetching recent messages...');
      const messagesUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;
      const messagesResponse = await fetch(messagesUrl, {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
        }
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const recentMessages = messagesData.payload?.slice(0, 5) || [];
        
        console.log(`\nLast ${recentMessages.length} messages:`);
        recentMessages.forEach((msg, index) => {
          const sender = msg.sender?.name || 'Unknown';
          const type = msg.message_type === 'incoming' ? '👤 User' : '🤖 Bot';
          const time = new Date(msg.created_at * 1000).toLocaleTimeString();
          console.log(`   [${time}] ${type}: "${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}"`);
        });
        
        const lastMessage = recentMessages[0];
        if (lastMessage && lastMessage.message_type === 'outgoing') {
          console.log('\n✅ AI Response detected!');
          console.log('🎉 The flow is working! Messages should be visible in Chatwoot UI.');
        } else {
          console.log('\n⚠️ No AI response detected. Check:');
          console.log('   1. Is n8n workflow active?');
          console.log('   2. Is webhook configured in Chatwoot admin?');
          console.log('   3. Check server logs for webhook reception');
        }
      }
      
    } else {
      console.log('❌ Failed to send message:', response.status);
      const error = await response.text();
      console.log('Error:', error);
      
      if (response.status === 404) {
        console.log('\n💡 404 Error means:');
        console.log('   - Conversation ID might not exist');
        console.log('   - Try creating a new conversation first');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 Network error usually means:');
    console.log('   - Chatwoot URL is incorrect');
    console.log('   - Network/firewall issues');
    console.log('   - Chatwoot server is down');
  }
}

testDirectChatwootMessage();