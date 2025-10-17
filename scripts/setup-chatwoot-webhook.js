// Setup Chatwoot webhook configuration
require('dotenv').config({ path: '.env.local' });

async function setupChatwootWebhook() {
  const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';
  
  // Your ngrok URL
  const NGROK_URL = 'https://e07cec3fd516.ngrok-free.app';
  const WEBHOOK_URL = `${NGROK_URL}/api/chatwoot-webhook`;
  
  if (!CHATWOOT_API_TOKEN) {
    console.error('❌ CHATWOOT_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('\n🔧 Chatwoot Webhook Configuration');
  console.log('===================================');
  console.log(`🌐 Ngrok URL: ${NGROK_URL}`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log('\n');
  
  try {
    // First, list existing webhooks
    console.log('📋 Checking existing webhooks...');
    const listUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks`;
    
    const listResponse = await fetch(listUrl, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
      }
    });
    
    if (listResponse.ok) {
      const webhooks = await listResponse.json();
      console.log(`Found ${webhooks.payload?.length || 0} existing webhooks`);
      
      if (webhooks.payload?.length > 0) {
        console.log('\n📌 Existing webhooks:');
        webhooks.payload.forEach(webhook => {
          console.log(`   ID: ${webhook.id} - URL: ${webhook.url}`);
          console.log(`      Events: ${webhook.subscriptions?.join(', ') || 'none'}`);
        });
      }
    }
    
    // Create new webhook
    console.log('\n➕ Creating new webhook...');
    const createUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks`;
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook: {
          url: WEBHOOK_URL,
          subscriptions: [
            'message_created',
            'message_updated',
            'conversation_created',
            'conversation_status_changed',
            'conversation_updated'
          ]
        }
      })
    });
    
    if (createResponse.ok) {
      const webhook = await createResponse.json();
      console.log('✅ Webhook created successfully!');
      console.log('   Webhook ID:', webhook.id);
      console.log('   URL:', webhook.url);
      console.log('   Events:', webhook.subscriptions?.join(', '));
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Your webhook is now configured!');
      console.log('2. Test it by sending a message:');
      console.log(`   node scripts/test-direct-chatwoot-message.js 44`);
      console.log('\n3. Watch your server logs for webhook reception');
      console.log('4. Check n8n workflow execution');
      
    } else {
      const error = await createResponse.text();
      console.log('❌ Failed to create webhook:', createResponse.status);
      console.log('Error:', error);
      
      if (error.includes('already exists')) {
        console.log('\n💡 Webhook URL already exists. You may need to:');
        console.log('1. Delete the existing webhook in Chatwoot admin');
        console.log('2. Or update it with the new ngrok URL');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    console.log('\n📝 Manual Configuration Required:');
    console.log('1. Login to Chatwoot at https://chat.nextnest.sg');
    console.log('2. Go to Settings → Integrations → Webhooks');
    console.log('3. Add a new webhook with:');
    console.log(`   URL: ${WEBHOOK_URL}`);
    console.log('   Events: message_created, conversation_status_changed');
    console.log('4. Save the webhook');
  }
  
  console.log('\n===================================');
  console.log('📊 Testing Webhook:');
  console.log(`After configuration, test with:`);
  console.log(`node scripts/test-direct-chatwoot-message.js 44`);
}

setupChatwootWebhook();