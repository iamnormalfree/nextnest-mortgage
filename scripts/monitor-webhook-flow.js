// Monitor the complete webhook flow
require('dotenv').config({ path: '.env.local' });

async function monitorWebhookFlow() {
  const conversationId = process.argv[2] || 44;
  const message = process.argv[3] || "What are the best mortgage rates for first-time buyers?";
  
  console.log('\n🔄 Complete Webhook Flow Monitor');
  console.log('===================================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  console.log(`💬 Message: "${message}"`);
  console.log('\n');
  
  const NGROK_URL = 'https://e07cec3fd516.ngrok-free.app';
  
  console.log('📋 Configuration Check:');
  console.log(`   ✅ Ngrok URL: ${NGROK_URL}`);
  console.log(`   ✅ Webhook endpoint: ${NGROK_URL}/api/chatwoot-webhook`);
  console.log(`   ✅ n8n webhook: ${process.env.N8N_AI_BROKER_WEBHOOK_URL}`);
  console.log(`   ✅ AI Broker enabled: ${process.env.ENABLE_AI_BROKER}`);
  
  try {
    // Step 1: Send message
    console.log('\n1️⃣ Sending message to Chatwoot...');
    const sendResponse = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: message,
        message_type: 'incoming'
      })
    });
    
    if (!sendResponse.ok) {
      console.log('❌ Failed to send message');
      return;
    }
    
    const sentMessage = await sendResponse.json();
    console.log('   ✅ Message sent (ID: ' + sentMessage.message?.id + ')');
    
    // Step 2: Check ngrok inspector
    console.log('\n2️⃣ Check ngrok inspector for webhooks:');
    console.log(`   🌐 Open: http://localhost:4040`);
    console.log('   Look for POST requests to /api/chatwoot-webhook');
    
    // Step 3: Test webhook directly
    console.log('\n3️⃣ Testing webhook endpoint directly...');
    const testPayload = {
      event: 'message_created',
      conversation: {
        id: conversationId,
        status: 'pending', // Match actual status
        custom_attributes: {
          ai_broker_name: 'Michelle Chen',
          broker_persona: 'balanced',
          lead_score: 75
        }
      },
      message: {
        id: Date.now(),
        content: message,
        message_type: 'incoming',
        private: false,
        sender: {
          type: 'contact',
          name: 'Test User'
        }
      }
    };
    
    const webhookResponse = await fetch(`${NGROK_URL}/api/chatwoot-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatwoot-Signature': 'test' // Simulate Chatwoot signature
      },
      body: JSON.stringify(testPayload)
    });
    
    if (webhookResponse.ok) {
      console.log('   ✅ Webhook endpoint accessible via ngrok');
    } else {
      console.log('   ❌ Webhook endpoint not accessible');
    }
    
    // Step 4: Monitor for responses
    console.log('\n4️⃣ Monitoring for AI responses...');
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkForResponse = async () => {
      attempts++;
      console.log(`   Attempt ${attempts}/${maxAttempts}...`);
      
      const messagesResponse = await fetch(
        `http://localhost:3000/api/chat/messages?conversation_id=${conversationId}`
      );
      
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        const recentMessages = data.messages?.slice(-2) || [];
        
        const hasAIResponse = recentMessages.some(msg => 
          msg.message_type === 'outgoing' && 
          msg.created_at > sentMessage.message?.created_at
        );
        
        if (hasAIResponse) {
          console.log('\n✅ AI Response Detected!');
          const aiMessage = recentMessages.find(msg => msg.message_type === 'outgoing');
          console.log(`   "${aiMessage.content.substring(0, 100)}..."`);
          return true;
        }
      }
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return checkForResponse();
      }
      
      return false;
    };
    
    const responseFound = await checkForResponse();
    
    if (!responseFound) {
      console.log('\n⚠️ No AI response detected after 15 seconds');
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Check ngrok inspector: http://localhost:4040');
      console.log('2. Check your server console for webhook logs');
      console.log('3. Check n8n workflow execution history');
      console.log('4. Verify conversation status in Chatwoot');
      
      // Check conversation status
      const statusResponse = await fetch(
        `http://localhost:3000/api/brokers/conversation/${conversationId}`
      );
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('\n📊 Conversation Status:');
        console.log('   Broker:', statusData.broker?.name || 'None assigned');
        console.log('   Status:', statusData.status || 'Unknown');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

monitorWebhookFlow();