// Set conversation to bot status for AI processing
require('dotenv').config({ path: '.env.local' });

async function setConversationBotStatus() {
  const conversationId = process.argv[2] || 44;
  
  const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';
  
  if (!CHATWOOT_API_TOKEN) {
    console.error('❌ CHATWOOT_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('\n🤖 Setting Conversation to Bot Status');
  console.log('=====================================');
  console.log(`📍 Conversation ID: ${conversationId}`);
  
  try {
    // Update conversation status to bot
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`;
    
    console.log('📝 Updating conversation status to "bot"...');
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'bot'
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Conversation status updated successfully!');
      console.log('   New Status:', data.status);
      console.log('   Contact:', data.meta?.sender?.name || 'Unknown');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Send a message to trigger AI response:');
      console.log(`   node scripts/test-chatwoot-message-flow.js ${conversationId}`);
      console.log('\n2. Or send directly to Chatwoot:');
      console.log(`   node scripts/test-direct-chatwoot-message.js ${conversationId}`);
      console.log('\n3. AI should now respond because conversation is in bot status!');
      
    } else {
      console.log('❌ Failed to update conversation:', response.status);
      const error = await response.text();
      console.log('Error:', error);
      
      // Try alternative approach - toggle status
      console.log('\n🔄 Trying alternative: Toggle conversation status...');
      
      const toggleUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/toggle_status`;
      const toggleResponse = await fetch(toggleUrl, {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'bot'
        })
      });
      
      if (toggleResponse.ok) {
        const toggleData = await toggleResponse.json();
        console.log('✅ Status toggled successfully!');
        console.log('   New Status:', toggleData.payload?.current_status || toggleData.status);
      } else {
        console.log('❌ Toggle also failed:', toggleResponse.status);
        
        console.log('\n💡 Manual Fix Required:');
        console.log('1. Login to Chatwoot at https://chat.nextnest.sg');
        console.log('2. Find conversation #' + conversationId);
        console.log('3. Change status to "bot" or "pending"');
        console.log('4. Make sure no human agent is assigned');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

setConversationBotStatus();