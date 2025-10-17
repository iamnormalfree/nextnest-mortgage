/**
 * Production Webhook Setup for Chatwoot
 * Configures webhook to point to your deployment URL
 */

require('dotenv').config({ path: '.env.local' });

async function setupProductionWebhook() {
  const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';

  // Determine webhook URL based on environment
  const PRODUCTION_URL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL;
  const LOCAL_URL = 'http://localhost:3001';

  // For production readiness testing, use localhost first, then switch to production
  const WEBHOOK_URL = PRODUCTION_URL
    ? `${PRODUCTION_URL}/api/chatwoot-webhook`
    : `${LOCAL_URL}/api/chatwoot-webhook`;

  if (!CHATWOOT_API_TOKEN) {
    console.error('❌ CHATWOOT_API_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('\n🚀 Production Chatwoot Webhook Configuration');
  console.log('='.repeat(50));
  console.log(`🌐 Chatwoot URL: ${CHATWOOT_BASE_URL}`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`📊 Account ID: ${CHATWOOT_ACCOUNT_ID}`);
  console.log('\n');

  try {
    // Step 1: List existing webhooks
    console.log('📋 Step 1: Checking existing webhooks...');
    const listUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks`;

    const listResponse = await fetch(listUrl, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
      }
    });

    let existingWebhooks = [];
    if (listResponse.ok) {
      const data = await listResponse.json();
      existingWebhooks = Array.isArray(data.payload) ? data.payload : (data.payload ? [data.payload] : []);
      console.log(`   Found ${existingWebhooks.length} existing webhook(s)`);

      if (existingWebhooks.length > 0) {
        console.log('\n📌 Existing webhooks:');
        existingWebhooks.forEach(webhook => {
          console.log(`   ID: ${webhook.id}`);
          console.log(`   URL: ${webhook.url}`);
          console.log(`   Events: ${webhook.subscriptions?.join(', ') || 'none'}`);
          console.log('');
        });
      }
    } else {
      console.warn('⚠️  Could not list webhooks:', listResponse.status);
    }

    // Step 2: Check if webhook already exists for this URL
    const existingWebhook = existingWebhooks.find(w => w.url === WEBHOOK_URL);

    if (existingWebhook) {
      console.log(`✅ Webhook already configured for ${WEBHOOK_URL}`);
      console.log(`   Webhook ID: ${existingWebhook.id}`);
      console.log(`   Events: ${existingWebhook.subscriptions?.join(', ')}`);

      // Check if it has the right events
      const requiredEvents = ['message_created', 'conversation_status_changed'];
      const hasAllEvents = requiredEvents.every(event =>
        existingWebhook.subscriptions?.includes(event)
      );

      if (!hasAllEvents) {
        console.log('\n⚠️  Webhook missing required events. Updating...');
        await updateWebhook(existingWebhook.id, WEBHOOK_URL, CHATWOOT_BASE_URL, CHATWOOT_API_TOKEN, CHATWOOT_ACCOUNT_ID);
      }

    } else {
      // Step 3: Create new webhook
      console.log('\n➕ Step 2: Creating new webhook...');
      await createWebhook(WEBHOOK_URL, CHATWOOT_BASE_URL, CHATWOOT_API_TOKEN, CHATWOOT_ACCOUNT_ID);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ WEBHOOK CONFIGURATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n🎯 Next Steps:');
    console.log('1. Webhook is configured and ready');
    console.log('2. Run broker seeding: node scripts/seed-brokers.js');
    console.log('3. Test end-to-end: node scripts/test-production-readiness.js');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);

    console.log('\n📝 Manual Configuration Required:');
    console.log('1. Login to Chatwoot at https://chat.nextnest.sg');
    console.log('2. Go to Settings → Integrations → Webhooks');
    console.log('3. Add a new webhook with:');
    console.log(`   URL: ${WEBHOOK_URL}`);
    console.log('   Events: message_created, conversation_status_changed');
    console.log('4. Save the webhook');
  }
}

async function createWebhook(webhookUrl, baseUrl, apiToken, accountId) {
  const createUrl = `${baseUrl}/api/v1/accounts/${accountId}/webhooks`;

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Api-Access-Token': apiToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      webhook: {
        url: webhookUrl,
        subscriptions: [
          'message_created',           // CRITICAL: For AI broker responses
          'conversation_status_changed' // For human handoff tracking
        ]
      }
    })
  });

  if (createResponse.ok) {
    const webhook = await createResponse.json();
    console.log('   ✅ Webhook created successfully!');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Events: ${webhook.subscriptions?.join(', ')}`);
    return webhook;
  } else {
    const error = await createResponse.text();
    console.error('   ❌ Failed to create webhook:', createResponse.status);
    console.error('   Error:', error);

    if (error.includes('already exists') || error.includes('has already been taken')) {
      console.log('\n   💡 Webhook URL already registered.');
      console.log('   This is normal - the webhook is already configured.');
    } else {
      throw new Error(`Webhook creation failed: ${error}`);
    }
  }
}

async function updateWebhook(webhookId, webhookUrl, baseUrl, apiToken, accountId) {
  const updateUrl = `${baseUrl}/api/v1/accounts/${accountId}/webhooks/${webhookId}`;

  const updateResponse = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      'Api-Access-Token': apiToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      webhook: {
        url: webhookUrl,
        subscriptions: [
          'message_created',
          'conversation_status_changed'
        ]
      }
    })
  });

  if (updateResponse.ok) {
    console.log('   ✅ Webhook updated successfully!');
  } else {
    console.error('   ⚠️  Could not update webhook:', updateResponse.status);
  }
}

setupProductionWebhook();
