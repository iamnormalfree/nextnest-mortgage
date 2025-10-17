const https = require('https');

// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker';

async function testN8nWebhook() {
  // This is the exact payload structure our webhook handler sends
  const payload = {
    event: 'message_created',
    content: 'What are the best mortgage rates for HDB flats?',
    
    // The critical message object that n8n IF node checks
    message: {
      message_type: 'incoming',  // n8n IF node checks this
      sender: {
        type: 'contact'  // n8n IF node checks this
      },
      content: 'What are the best mortgage rates for HDB flats?'
    },
    
    // Conversation for context
    conversation: {
      id: 44,
      status: 'bot',
      custom_attributes: {}
    }
  };

  console.log('📤 Sending test payload to n8n webhook:');
  console.log('URL:', N8N_WEBHOOK_URL);
  console.log('\nPayload structure:');
  console.log('- message.message_type:', payload.message?.message_type);
  console.log('- message.sender.type:', payload.message?.sender?.type);
  console.log('- conversation.status:', payload.conversation?.status);
  console.log('- content:', payload.content);
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(N8N_WEBHOOK_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    console.log('\n🚀 Sending request...');
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📥 Response from n8n:');
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          const result = JSON.parse(responseData);
          console.log('Response Body:', JSON.stringify(result, null, 2));
          
          if (res.statusCode === 200) {
            console.log('\n✅ n8n webhook accepted the request');
            
            // Check if it's a workflow start response
            if (result.message === 'Workflow was started') {
              console.log('✅ Workflow was triggered successfully');
              console.log('\n⚠️ NOTE: The workflow is running but may still be returning canned responses');
              console.log('This suggests the IF node conditions are not matching our payload structure');
            }
          } else {
            console.error('\n❌ n8n returned an error:', res.statusCode);
          }
          
          resolve(result);
        } catch (e) {
          console.log('Raw Response:', responseData);
          resolve(responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Request error:', error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Test variations of the payload to see what works
async function testPayloadVariations() {
  console.log('\n🧪 Testing different payload variations...\n');
  console.log('=' .repeat(60));
  
  const variations = [
    {
      name: 'Current structure (nested)',
      payload: {
        event: 'message_created',
        content: 'Test message',
        message: {
          message_type: 'incoming',
          sender: { type: 'contact' },
          content: 'Test message'
        },
        conversation: { id: 44, status: 'bot' }
      }
    },
    {
      name: 'Flat structure',
      payload: {
        event: 'message_created',
        message_type: 'incoming',
        sender_type: 'contact',
        content: 'Test message',
        conversation_id: 44,
        conversation_status: 'bot'
      }
    },
    {
      name: 'Mixed structure',
      payload: {
        event: 'message_created',
        message_type: 'incoming',
        content: 'Test message',
        message: {
          message_type: 'incoming',
          sender: { type: 'contact' }
        },
        sender: { type: 'contact' },
        conversation: { id: 44, status: 'bot' }
      }
    },
    {
      name: 'Chatwoot original format',
      payload: {
        event: 'message_created',
        id: 999,
        content: 'Test message',
        message_type: 0, // 0 = incoming in Chatwoot
        sender: {
          id: 1,
          type: 'contact',
          name: 'Test User'
        },
        conversation: {
          id: 44,
          status: 'bot',
          can_reply: true
        }
      }
    }
  ];
  
  for (const variation of variations) {
    console.log(`\nTesting: ${variation.name}`);
    console.log('-'.repeat(40));
    
    try {
      const response = await sendTestPayload(variation.payload);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error.message);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function sendTestPayload(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(N8N_WEBHOOK_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            body: result
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Main execution
async function main() {
  console.log('🔬 n8n Webhook Direct Testing Tool');
  console.log('=====================================\n');
  
  // First test the current payload
  await testN8nWebhook();
  
  // Then test variations
  console.log('\n\nWould you like to test different payload variations? (Uncomment the line below)');
  // await testPayloadVariations();
}

main().catch(console.error);