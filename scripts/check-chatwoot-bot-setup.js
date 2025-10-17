/**
 * Check Chatwoot Bot Setup & Webhook Configuration
 */

const CHATWOOT_API_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
const API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  console.error('Set it in your .env.local file or run: export CHATWOOT_API_TOKEN=your-token');
  process.exit(1);
}

async function checkBotSetup() {
  console.log('🔍 Checking Chatwoot Bot Configuration\n');
  console.log('=====================================\n');

  try {
    // 1. Check Agent Bots
    console.log('1️⃣ Checking Agent Bots...\n');
    const botsResponse = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/agent_bots`, {
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (botsResponse.ok) {
      const bots = await botsResponse.json();
      if (bots.length > 0) {
        console.log(`✅ Found ${bots.length} bot(s):\n`);
        bots.forEach(bot => {
          console.log(`   Bot Name: ${bot.name}`);
          console.log(`   Bot ID: ${bot.id}`);
          console.log(`   Webhook URL: ${bot.outgoing_url || 'NOT SET'}`);
          console.log(`   Bot Type: ${bot.bot_type || 'webhook'}`);
          console.log('   ---');
        });
      } else {
        console.log('❌ No bots found! You need to create a bot.');
      }
    }

    // 2. Check Inbox Configuration
    console.log('\n2️⃣ Checking Inbox Configuration...\n');
    const inboxResponse = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/inboxes`, {
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (inboxResponse.ok) {
      const inboxes = await inboxResponse.json();
      const apiInbox = inboxes.payload?.find(inbox => inbox.channel_type === 'Channel::Api');
      
      if (apiInbox) {
        console.log(`✅ Found API Inbox: ${apiInbox.name}`);
        console.log(`   Inbox ID: ${apiInbox.id}`);
        console.log(`   Channel Type: ${apiInbox.channel_type}`);
        
        // Check if bot is connected
        if (apiInbox.agent_bot_inbox) {
          console.log(`   ✅ Bot Connected: ${apiInbox.agent_bot_inbox.agent_bot?.name || 'Unknown'}`);
        } else {
          console.log('   ❌ No bot connected to this inbox!');
          console.log('   ACTION NEEDED: Go to Inbox settings and select your bot');
        }
      } else {
        console.log('❌ No API Inbox found');
      }
    }

    // 3. Check Webhooks (different from bots)
    console.log('\n3️⃣ Checking Webhooks Configuration...\n');
    const webhooksResponse = await fetch(`${CHATWOOT_API_URL}/api/v1/accounts/1/webhooks`, {
      headers: {
        'Api-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (webhooksResponse.ok) {
      const webhooks = await webhooksResponse.json();
      if (webhooks.payload?.length > 0) {
        console.log(`Found ${webhooks.payload.length} webhook(s):\n`);
        webhooks.payload.forEach(webhook => {
          console.log(`   URL: ${webhook.url}`);
          console.log(`   Events: ${webhook.subscriptions?.join(', ') || 'None'}`);
          console.log('   ---');
        });
      } else {
        console.log('ℹ️  No webhooks configured (this is OK if using Agent Bot)');
      }
    }

  } catch (error) {
    console.error('❌ Error checking configuration:', error.message);
  }

  console.log('\n\n📋 TROUBLESHOOTING CHECKLIST:');
  console.log('================================');
  console.log('');
  console.log('For the bot to auto-reply, you need ALL of these:');
  console.log('');
  console.log('1. ✓ Agent Bot created with webhook URL');
  console.log('   - Go to Settings → Bots');
  console.log('   - Create "NextNest AI Broker" bot');
  console.log('   - Set webhook URL to: https://nextnest.sg/api/chatwoot-webhook');
  console.log('');
  console.log('2. ✓ Bot connected to your inbox');
  console.log('   - Go to Settings → Inboxes → Your API Inbox');
  console.log('   - In "Bot Configuration" section');
  console.log('   - Select "NextNest AI Broker" from dropdown');
  console.log('   - Click Save');
  console.log('');
  console.log('3. ✓ Webhook URL is publicly accessible');
  console.log('   - Your production server must be running');
  console.log('   - https://nextnest.sg/api/chatwoot-webhook must be reachable');
  console.log('   - OR use ngrok for local testing');
  console.log('');
  console.log('4. ✓ New conversations have "bot" status');
  console.log('   - When bot is connected, new conversations start as "bot"');
  console.log('   - Bot receives webhook events for these conversations');
  console.log('');
  console.log('🔧 LOCAL TESTING WITH NGROK:');
  console.log('=============================');
  console.log('If testing locally, use ngrok to expose your webhook:');
  console.log('');
  console.log('1. Install ngrok: npm install -g ngrok');
  console.log('2. Run: ngrok http 3004');
  console.log('3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
  console.log('4. Update bot webhook URL to: https://abc123.ngrok.io/api/chatwoot-webhook');
  console.log('5. Test with a new message in Chatwoot');
}

// Run the check
checkBotSetup().catch(console.error);