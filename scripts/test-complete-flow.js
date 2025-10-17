const https = require('https');

// Configuration
const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = 1;
const CONVERSATION_ID = 44;

async function sendTestMessage() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      content: `Test message at ${new Date().toISOString()}: Can you tell me about mortgage options for HDB flats?`,
      message_type: 'incoming',
      private: false
    });

    const url = new URL(`${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${CONVERSATION_ID}/messages`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('📤 Sending test message to Chatwoot...');
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            console.log('✅ Message sent successfully');
            console.log('Message ID:', result.id);
            console.log('Content:', result.content);
            resolve(result);
          } else {
            console.error('❌ Failed to send message:', res.statusCode);
            console.error('Response:', result);
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          console.error('Failed to parse response:', responseData);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function checkMessages() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${CONVERSATION_ID}/messages`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN
      }
    };

    console.log('\n📥 Checking messages in conversation...');
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            const messages = result.payload || [];
            console.log(`Found ${messages.length} messages`);
            
            // Show last 5 messages
            const recentMessages = messages.slice(0, 5);
            recentMessages.forEach(msg => {
              const sender = msg.sender?.name || 'Unknown';
              const type = msg.message_type === 0 ? 'incoming' : 'outgoing';
              console.log(`\n[${type}] ${sender}: ${msg.content?.substring(0, 100)}`);
              console.log(`  Created: ${new Date(msg.created_at).toLocaleString()}`);
            });
            
            resolve(messages);
          } else {
            console.error('Failed to get messages:', res.statusCode);
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (e) {
          console.error('Failed to parse response:', responseData);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    req.end();
  });
}

async function waitForResponse(originalMessageId, maxWaitTime = 30000) {
  console.log('\n⏳ Waiting for AI response...');
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    
    try {
      const messages = await checkMessages();
      
      // Look for a response after our message
      const ourMessageIndex = messages.findIndex(m => m.id === originalMessageId);
      if (ourMessageIndex >= 0 && ourMessageIndex > 0) {
        const potentialResponse = messages[ourMessageIndex - 1];
        
        if (potentialResponse.message_type === 1 && // Outgoing message
            potentialResponse.created_at > messages[ourMessageIndex].created_at) {
          console.log('\n🤖 AI Response received:');
          console.log(potentialResponse.content);
          return potentialResponse;
        }
      }
    } catch (error) {
      console.error('Error checking for response:', error.message);
    }
    
    process.stdout.write('.');
  }
  
  console.log('\n⏱️ Timeout waiting for response');
  return null;
}

async function main() {
  try {
    console.log('🚀 Starting complete flow test');
    console.log('================================\n');
    
    // Send test message
    const sentMessage = await sendTestMessage();
    
    // Wait a moment for webhook processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for AI response
    const response = await waitForResponse(sentMessage.id);
    
    if (response) {
      console.log('\n✅ Test completed successfully!');
      
      // Check if it's the canned response
      if (response.content === 'I can help you with your mortgage needs.') {
        console.log('⚠️ WARNING: Received canned response instead of AI-generated response');
        console.log('This indicates n8n workflow is not processing correctly');
      }
    } else {
      console.log('\n❌ No AI response received');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();