// Test sending a message directly
async function testSendMessage() {
  const conversationId = 44;
  const message = "What are the interest rates?";
  
  console.log('\n📤 Sending test message...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/chat/send-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: message,
        message_type: 'outgoing'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log('\n📥 AI Response:');
      console.log(data.message.content);
      console.log('\nFrom:', data.message.sender.name);
      console.log('Type:', data.message.sender.type);
      console.log('\n🌐 Now check: http://localhost:3000/chat?conversation=' + conversationId);
    } else {
      console.log('❌ Failed:', response.status);
      const error = await response.text();
      console.log(error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testSendMessage();