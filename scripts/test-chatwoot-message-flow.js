// Test the complete Chatwoot message flow with n8n integration
// Using built-in fetch (Node.js 18+)

async function testChatwootMessageFlow() {
  const conversationId = process.argv[2] || 44;
  const message = process.argv[3] || "What are the current interest rates for a new HDB purchase?";
  
  console.log('\n🚀 Testing Complete Chatwoot Message Flow');
  console.log('==========================================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  console.log(`💬 Message: "${message}"`);
  console.log('\n');
  
  try {
    // Step 1: Send message through the API that actually goes to Chatwoot
    console.log('1️⃣ Sending message to Chatwoot via /api/chat/send...');
    const sendResponse = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: message,
        message_type: 'incoming' // Important: incoming triggers the webhook
      })
    });

    if (sendResponse.ok) {
      const data = await sendResponse.json();
      console.log('✅ Message sent to Chatwoot successfully!');
      console.log('   Message ID:', data.message?.id);
      console.log('   Type:', data.message?.message_type);
      console.log('   Sender:', data.message?.sender?.type);
      
      console.log('\n2️⃣ Webhook flow:');
      console.log('   - Chatwoot will trigger webhook to your app');
      console.log('   - Your app forwards to n8n at:', process.env.N8N_AI_BROKER_WEBHOOK_URL || 'https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker');
      console.log('   - n8n processes with OpenAI and sends response back to Chatwoot');
      
      console.log('\n3️⃣ Check for AI response:');
      console.log('   🌐 Chatwoot UI: https://chat.nextnest.sg');
      console.log('   🖥️ Local UI: http://localhost:3000/chat?conversation=' + conversationId);
      
      // Wait a bit then check for messages
      console.log('\n⏳ Waiting 5 seconds for AI response...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Fetch messages to see if AI responded
      console.log('4️⃣ Checking for new messages...');
      const messagesResponse = await fetch(`http://localhost:3000/api/chat/messages?conversation_id=${conversationId}`);
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const recentMessages = messagesData.messages?.slice(-3) || [];
        
        console.log(`\n📬 Last ${recentMessages.length} messages in conversation:`);
        recentMessages.forEach((msg, index) => {
          const sender = msg.sender?.name || 'Unknown';
          const type = msg.message_type === 'incoming' ? '👤' : '🤖';
          console.log(`   ${type} ${sender}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`);
        });
        
        // Check if there's a bot/AI response
        const hasAIResponse = recentMessages.some(msg => 
          msg.message_type === 'outgoing' || 
          msg.sender?.type === 'agent' || 
          msg.sender?.type === 'bot'
        );
        
        if (hasAIResponse) {
          console.log('\n✅ AI response detected! Check Chatwoot UI to see it.');
        } else {
          console.log('\n⚠️ No AI response detected yet. Possible issues:');
          console.log('   - n8n workflow might not be active');
          console.log('   - Webhook URL might be incorrect');
          console.log('   - OpenAI API key might not be configured in n8n');
          console.log('   - Conversation might not be in "bot" status');
        }
      }
      
    } else {
      console.log('❌ Failed to send message:', sendResponse.status);
      const error = await sendResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n==========================================');
  console.log('📝 Troubleshooting Tips:');
  console.log('1. Check n8n workflow is active at https://primary-production-1af6.up.railway.app');
  console.log('2. Verify webhook URL in .env.local matches n8n webhook node');
  console.log('3. Ensure conversation is in "bot" status (not "open")');
  console.log('4. Check Chatwoot webhook is configured to point to your app');
  console.log('5. Look at server logs for webhook reception');
}

testChatwootMessageFlow();