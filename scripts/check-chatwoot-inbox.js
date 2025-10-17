// Script to check Chatwoot inbox configuration
const https = require('https');

// Configuration from environment
const CHATWOOT_BASE_URL = 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = '1';
const CHATWOOT_INBOX_ID = '1';
const CHATWOOT_WEBSITE_TOKEN = 't7f8JA6rDZ4pPJg3qzf6ALAY';

console.log('🔍 Checking Chatwoot Configuration...\n');
console.log('Base URL:', CHATWOOT_BASE_URL);
console.log('Account ID:', CHATWOOT_ACCOUNT_ID);
console.log('Inbox ID:', CHATWOOT_INBOX_ID);
console.log('Website Token:', CHATWOOT_WEBSITE_TOKEN);
console.log('\n' + '='.repeat(50) + '\n');

// Function to make API request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CHATWOOT_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'api_access_token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function checkChatwoot() {
  try {
    // 1. Check all inboxes
    console.log('📦 Fetching all inboxes...');
    const inboxesResponse = await makeRequest(`/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`);
    
    if (inboxesResponse.status === 200) {
      const inboxes = inboxesResponse.data.payload || inboxesResponse.data;
      console.log(`✅ Found ${inboxes.length} inbox(es)\n`);
      
      // List all inboxes
      inboxes.forEach((inbox, index) => {
        console.log(`Inbox ${index + 1}:`);
        console.log(`  - ID: ${inbox.id}`);
        console.log(`  - Name: ${inbox.name}`);
        console.log(`  - Channel Type: ${inbox.channel_type}`);
        console.log(`  - Widget Color: ${inbox.widget_color || 'N/A'}`);
        
        // Check for website channel
        if (inbox.channel_type === 'Channel::WebWidget') {
          console.log(`  ✨ This is a Website Widget Channel!`);
          console.log(`  - Website URL: ${inbox.website_url || 'Not set'}`);
          console.log(`  - Website Token: ${inbox.website_token || 'Not visible'}`);
          console.log(`  - Widget Settings:`, JSON.stringify(inbox.web_widget_script || {}, null, 2));
        }
        
        if (inbox.channel_type === 'Channel::Api') {
          console.log(`  🔌 This is an API Channel`);
          console.log(`  - Webhook URL: ${inbox.webhook_url || 'Not set'}`);
        }
        
        console.log('');
      });
      
      // Check if our configured inbox exists
      const ourInbox = inboxes.find(inbox => inbox.id == CHATWOOT_INBOX_ID);
      if (ourInbox) {
        console.log(`✅ Inbox with ID ${CHATWOOT_INBOX_ID} exists`);
        console.log(`   Type: ${ourInbox.channel_type}`);
        
        if (ourInbox.channel_type !== 'Channel::WebWidget') {
          console.log(`\n⚠️  WARNING: Inbox ${CHATWOOT_INBOX_ID} is not a Website Widget channel!`);
          console.log(`   It's a ${ourInbox.channel_type} channel instead.`);
          console.log(`   You need to create a Website Widget inbox for the chat widget to work.\n`);
        }
      } else {
        console.log(`❌ Inbox with ID ${CHATWOOT_INBOX_ID} not found`);
      }
      
    } else {
      console.log(`❌ Failed to fetch inboxes: ${inboxesResponse.status}`);
      console.log('Response:', inboxesResponse.data);
    }
    
    // 2. Try to check widget configuration
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🔧 Checking widget configuration endpoint...');
    
    // This endpoint doesn't require auth - it's public for the widget
    const widgetUrl = `${CHATWOOT_BASE_URL}/api/v1/widget/config?website_token=${CHATWOOT_WEBSITE_TOKEN}`;
    console.log(`Testing: ${widgetUrl}`);
    
    // Make a simple HTTPS request without auth
    https.get(widgetUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const config = JSON.parse(data);
            console.log('✅ Widget configuration is accessible!');
            console.log('Widget Config:', JSON.stringify(config, null, 2));
          } catch (e) {
            console.log('✅ Widget endpoint responds but returned non-JSON data');
          }
        } else if (res.statusCode === 404) {
          console.log('❌ Widget configuration not found (404)');
          console.log('   This means no Website Widget inbox exists with token:', CHATWOOT_WEBSITE_TOKEN);
          console.log('\n📝 TO FIX THIS:');
          console.log('   1. Log into Chatwoot at', CHATWOOT_BASE_URL);
          console.log('   2. Go to Settings → Inboxes');
          console.log('   3. Click "Add Inbox"');
          console.log('   4. Select "Website" channel type');
          console.log('   5. Configure your website details');
          console.log('   6. Copy the website token and update your .env.local');
        } else {
          console.log(`⚠️  Widget endpoint returned status: ${res.statusCode}`);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Failed to reach widget endpoint:', err.message);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkChatwoot();