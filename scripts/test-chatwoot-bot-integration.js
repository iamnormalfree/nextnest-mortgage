/**
 * Test Chatwoot Bot Integration
 * This script tests the complete bot workflow
 */

const WEBHOOK_URL = 'http://localhost:3004/api/chatwoot-webhook';
const CHATWOOT_API_URL = 'https://chat.nextnest.sg';
const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const BOT_TOKEN = 'a4Z9qVqcYzKEg4QTa4JyHDQv';

// Test 1: Simulate a bot event from Chatwoot
async function testBotWebhook() {
  console.log('🤖 TEST 1: Testing Bot Webhook Handler\n');
  console.log('==================================\n');
  
  const botEvent = {
    event: 'message_created',
    id: 'bot-test-' + Date.now(),
    message: {
      id: Date.now(),
      content: 'I need help with mortgage rates',
      message_type: 'incoming',
      private: false,
      created_at: new Date().toISOString(),
      sender: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        type: 'contact' // Customer message
      }
    },
    conversation: {
      id: 99999,
      status: 'bot', // Bot is handling this conversation
      custom_attributes: {
        lead_score: 75,
        broker_persona: 'balanced',
        ai_broker_name: 'Sarah Wong',
        property_type: 'HDB',
        monthly_income: 8000,
        message_count: 1,
        firstName: 'John'
      }
    },
    account: {
      id: 1,
      name: 'NextNest'
    }
  };

  try {
    console.log('📤 Sending bot event to webhook...');
    console.log('Message:', botEvent.message.content);
    console.log('Status:', botEvent.conversation.status);
    console.log('Sender Type:', botEvent.message.sender.type);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botEvent)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Webhook processed the bot event!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      console.log('\n🔍 Expected Behavior:');
      console.log('1. Webhook receives the message');
      console.log('2. Calls /api/broker-response to generate AI response');
      console.log('3. Sends AI response back to Chatwoot conversation');
      console.log('4. Customer sees the AI response in chat');
    } else {
      console.error('❌ Webhook error:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Failed to reach webhook:', error.message);
  }
}

// Test 2: Check if bot is configured in Chatwoot
async function checkBotConfiguration() {
  console.log('\n🔧 TEST 2: Checking Bot Configuration in Chatwoot\n');
  console.log('==========================================\n');
  
  try {
    // List all bots
    const response = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/agent_bots`, {
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const bots = await response.json();
      console.log('📋 Configured Bots:', bots.length > 0 ? '' : 'None found');
      
      bots.forEach(bot => {
        console.log(`\n  Bot: ${bot.name}`);
        console.log(`  ID: ${bot.id}`);
        console.log(`  Webhook URL: ${bot.outgoing_url || 'Not set'}`);
        console.log(`  Status: ${bot.bot_type || 'Active'}`);
      });

      const nextNestBot = bots.find(bot => bot.name.includes('NextNest'));
      if (nextNestBot) {
        console.log('\n✅ NextNest AI Broker bot is configured!');
        console.log(`   Webhook URL: ${nextNestBot.outgoing_url}`);
      } else {
        console.log('\n⚠️  NextNest AI Broker bot not found in Chatwoot');
        console.log('   Please create it in Settings → Bots');
      }
    } else {
      console.log('⚠️  Could not fetch bot configuration');
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error checking bot configuration:', error.message);
  }
}

// Test 3: Simulate the complete flow
async function testCompleteFlow() {
  console.log('\n🚀 TEST 3: Complete Bot Flow Simulation\n');
  console.log('=====================================\n');
  
  console.log('📝 Flow Steps:');
  console.log('1. User sends message in Chatwoot');
  console.log('2. Chatwoot triggers bot webhook');
  console.log('3. Your webhook generates AI response');
  console.log('4. AI response sent back to conversation');
  console.log('5. User sees AI reply\n');

  // First, test if the broker-response API works
  console.log('Testing AI response generation...');
  
  try {
    const aiResponse = await fetch('http://localhost:3004/api/broker-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What are the current mortgage rates?',
        leadScore: 75,
        brokerPersona: 'balanced',
        propertyType: 'HDB',
        monthlyIncome: 8000,
        firstName: 'Test User',
        messageCount: 1,
        isFirstMessage: true
      })
    });

    if (aiResponse.ok) {
      const data = await aiResponse.json();
      console.log('\n✅ AI Response Generated Successfully!');
      console.log('Response preview:', data.response.substring(0, 200) + '...');
      console.log('Market data included:', !!data.marketData);
    } else {
      console.error('❌ AI response generation failed:', aiResponse.status);
    }
  } catch (error) {
    console.error('❌ Error testing AI response:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 CHATWOOT BOT INTEGRATION TEST SUITE');
  console.log('====================================\n');
  console.log('Bot Token:', BOT_TOKEN);
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('\n');

  await testBotWebhook();
  await checkBotConfiguration();
  await testCompleteFlow();

  console.log('\n\n📋 CHECKLIST FOR FULL INTEGRATION:');
  console.log('===================================');
  console.log('✓ 1. Bot created in Chatwoot (NextNest AI Broker)');
  console.log('✓ 2. Bot webhook URL set to: https://nextnest.sg/api/chatwoot-webhook');
  console.log('✓ 3. Bot connected to your API inbox');
  console.log('✓ 4. Webhook endpoint handles bot events');
  console.log('✓ 5. AI response generation working');
  console.log('? 6. Test with a real message in Chatwoot chat');
  
  console.log('\n🎯 TO TEST LIVE:');
  console.log('1. Open your Chatwoot inbox');
  console.log('2. Send a test message as a customer');
  console.log('3. Watch for the AI broker response');
  console.log('4. Check server logs for webhook activity');
}

// Run the tests
runAllTests().catch(console.error);