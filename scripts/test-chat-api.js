// Test the chat API endpoints
async function testChatAPI() {
  console.log('\n🔍 Testing Chat API Endpoints\n');
  console.log('=' .repeat(50));

  const conversationId = 44;
  const testMessage = "What are the current interest rates?";

  // Test 1: Check if broker is assigned
  console.log('1️⃣ Checking broker assignment...');
  try {
    const brokerResponse = await fetch(`http://localhost:3000/api/brokers/conversation/${conversationId}`);
    if (brokerResponse.ok) {
      const brokerData = await brokerResponse.json();
      console.log('✅ Broker found:', brokerData.broker.name);
      console.log('   Personality:', brokerData.broker.personalityType);
    } else {
      console.log('❌ No broker found for conversation', conversationId);
      console.log('   Run: node scripts/assign-broker-to-conversation.js', conversationId);
      return;
    }
  } catch (error) {
    console.log('❌ Error fetching broker:', error.message);
  }

  // Test 2: Test the chat/send endpoint
  console.log('\n2️⃣ Testing /api/chat/send (Chatwoot)...');
  try {
    const response = await fetch('http://localhost:3000/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: testMessage,
        message_type: 'outgoing'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chatwoot endpoint working');
      console.log('   Message sent:', data.message?.content?.substring(0, 50) + '...');
    } else {
      const error = await response.text();
      console.log('❌ Chatwoot endpoint failed:', response.status);
      console.log('   Error:', error.substring(0, 100));
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 3: Test the chat/send-test endpoint
  console.log('\n3️⃣ Testing /api/chat/send-test (Local simulation)...');
  try {
    const response = await fetch('http://localhost:3000/api/chat/send-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: testMessage,
        message_type: 'outgoing'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test endpoint working');
      console.log('   AI Response:', data.message?.content?.substring(0, 100) + '...');
      console.log('   From:', data.message?.sender?.name);
      console.log('   Type:', data.message?.sender?.type);
    } else {
      const error = await response.text();
      console.log('❌ Test endpoint failed:', response.status);
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 4: Test fetching messages
  console.log('\n4️⃣ Testing /api/chat/messages...');
  try {
    const response = await fetch(`http://localhost:3000/api/chat/messages?conversation_id=${conversationId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Messages endpoint working');
      console.log('   Total messages:', data.messages?.length || 0);
      if (data.messages?.length > 0) {
        console.log('   Latest:', data.messages[data.messages.length - 1]?.content?.substring(0, 50));
      }
    } else {
      console.log('❌ Messages endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n📊 Summary:');
  console.log('   - If all endpoints fail: Server might not be running');
  console.log('   - If only Chatwoot fails: Expected (Chatwoot not configured)');
  console.log('   - If test endpoint works: Chat should work with simulated responses');
  console.log('\n💡 To fix issues:');
  console.log('   1. Make sure dev server is running: npm run dev');
  console.log('   2. Check browser console for errors');
  console.log('   3. Try refreshing the chat page');
  console.log('   4. Check if conversation 44 has a broker assigned');
  
  console.log('\n' + '=' .repeat(50));
}

testChatAPI();