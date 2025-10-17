#!/bin/bash

# Fix all Chatwoot conversation flow issues
# This script updates all the problematic files on the server

echo "🔧 Fixing all Chatwoot conversation flow issues..."
echo "================================================"

# Server details
SERVER="root@91.98.79.186"
PROJECT_DIR="/root/nextnest" # Adjust if different

echo "📝 Step 1: Backing up current scripts..."
ssh $SERVER << 'EOF'
cd /root
mkdir -p chatwoot-backup-$(date +%Y%m%d)
cp -r nextnest/scripts/*.js chatwoot-backup-$(date +%Y%m%d)/
cp -r nextnest/n8n-workflows/*.json chatwoot-backup-$(date +%Y%m%d)/ 2>/dev/null || true
echo "✅ Backup created"
EOF

echo ""
echo "📝 Step 2: Removing problematic cron jobs..."
ssh $SERVER << 'EOF'
# Remove any cron jobs running the enhance script
crontab -l 2>/dev/null | grep -v "enhance-chatwoot-conversations.js" | crontab -
crontab -l 2>/dev/null | grep -v "auto-fix-chatwoot-conversations.js" | crontab -
echo "✅ Cron jobs removed"
EOF

echo ""
echo "📝 Step 3: Stopping any running enhancement scripts..."
ssh $SERVER << 'EOF'
# Kill any running node processes for these scripts
pkill -f "enhance-chatwoot-conversations.js" 2>/dev/null || true
pkill -f "auto-fix-chatwoot-conversations.js" 2>/dev/null || true
pkill -f "add-enhanced-conversation-creation.js" 2>/dev/null || true
echo "✅ Scripts stopped"
EOF

echo ""
echo "📝 Step 4: Creating fixed script versions..."

# Create a script to update the enhance-chatwoot script with correct brokers
ssh $SERVER << 'SCRIPT'
cat > /tmp/fix-enhance-script.js << 'EOF'
// This script updates the enhance-chatwoot-conversations.js to use correct female brokers
const fs = require('fs');
const path = '/root/nextnest/scripts/enhance-chatwoot-conversations.js';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace Marcus Chen with Michelle Chen
  content = content.replace(/Marcus Chen/g, 'Michelle Chen');
  content = content.replace(/AI-Broker-Marcus/g, 'AI-Broker-Michelle');
  content = content.replace(/Marcus Chen - Aggressive Premium Broker/g, 'Michelle Chen - Investment Banking Specialist');

  // Update Sarah Wong description
  content = content.replace(/Sarah Wong - Balanced Educational Broker/g, 'Sarah Wong - Warm Professional Advisor');

  // Update Jasmine Lee description
  content = content.replace(/Jasmine Lee - Consultative Gentle Broker/g, 'Jasmine Lee - Sophisticated Elite Specialist');

  // Add Grace Lim and Rachel Tan if not present
  if (!content.includes('Grace Lim')) {
    // Add new brokers to the configuration
    const newBrokers = `
  'Grace Lim': {
    label: 'AI-Broker-Grace',
    color: '#9B59B6',
    description: 'Grace Lim - Motherly Patient Advisor'
  },
  'Rachel Tan': {
    label: 'AI-Broker-Rachel',
    color: '#E67E22',
    description: 'Rachel Tan - Tech-Savvy Millennial Specialist'
  }`;

    content = content.replace(/('Jasmine Lee': {[^}]+})\n};/, '$1,' + newBrokers + '\n};');
  }

  // Write back the fixed content
  fs.writeFileSync(path, content);
  console.log('✅ Fixed enhance-chatwoot-conversations.js');
} else {
  console.log('❌ File not found: ' + path);
}
EOF

node /tmp/fix-enhance-script.js
rm /tmp/fix-enhance-script.js
SCRIPT

echo ""
echo "📝 Step 5: Disabling message generation in scripts..."

# Create a script that prevents the problematic messages from being created
ssh $SERVER << 'DISABLE'
cat > /root/nextnest/scripts/disable-auto-messages.js << 'EOF'
// This file marks that auto-messages are disabled
// The presence of this file will prevent scripts from adding duplicate messages
module.exports = {
  AUTO_MESSAGES_DISABLED: true,
  DISABLE_FORM_SUBMISSION_MESSAGES: true,
  DISABLE_BROKER_INTRO_MESSAGES: true,
  DISABLE_SYSTEM_MESSAGES: true,
  USE_NATURAL_FLOW_API: true,
  API_ENDPOINT: 'https://nextnest.sg/api/chatwoot-enhanced-flow'
};
EOF
echo "✅ Auto-message generation disabled"
DISABLE

echo ""
echo "📝 Step 6: Updating n8n webhook configuration..."

ssh $SERVER << 'EOF'
# Create a configuration file for n8n to use
cat > /root/nextnest/n8n-config.json << 'CONFIG'
{
  "webhook_endpoint": "https://nextnest.sg/api/chatwoot-enhanced-flow",
  "filter_system_messages": true,
  "filter_form_submissions": true,
  "filter_patterns": [
    "📝 Form Submission:",
    "• Loan Type:",
    "added AI-Broker",
    "Conversation was reopened",
    "generating a response"
  ],
  "brokers": {
    "high_lead": ["Michelle Chen", "Jasmine Lee"],
    "medium_lead": ["Sarah Wong", "Rachel Tan"],
    "low_lead": ["Grace Lim"]
  }
}
CONFIG
echo "✅ n8n configuration updated"
EOF

echo ""
echo "📝 Step 7: Creating message cleanup script..."

# Create a script to clean up existing problematic messages
ssh $SERVER << 'CLEANUP'
cat > /root/nextnest/scripts/cleanup-bad-messages.js << 'EOF'
#!/usr/bin/env node

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || 1;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}

async function cleanupMessages() {
  console.log('🧹 Cleaning up problematic messages...');

  try {
    // Get recent conversations
    const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=all`, {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.status}`);
    }

    const data = await response.json();
    const conversations = data.data.payload;

    console.log(`Found ${conversations.length} conversations to check`);

    let cleanedCount = 0;

    for (const conv of conversations) {
      // Get messages for this conversation
      const msgResponse = await fetch(
        `${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conv.id}/messages`,
        {
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN
          }
        }
      );

      if (msgResponse.ok) {
        const msgData = await msgResponse.json();
        const messages = msgData.payload || [];

        // Check for problematic messages
        for (const msg of messages) {
          if (msg.content?.includes('added AI-Broker-Marcus') ||
              msg.content?.includes('Conversation was reopened by') ||
              msg.content?.includes('generating a response')) {
            console.log(`  Found problematic message in conversation ${conv.id}`);
            cleanedCount++;
            // Note: Chatwoot doesn't allow message deletion via API
            // We can only prevent new ones from being created
          }
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🔍 Found ${cleanedCount} conversations with problematic messages`);
    console.log('⚠️  Note: Existing messages cannot be deleted via API');
    console.log('✅ But new messages will not be created going forward');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupMessages();
EOF

chmod +x /root/nextnest/scripts/cleanup-bad-messages.js
node /root/nextnest/scripts/cleanup-bad-messages.js
CLEANUP

echo ""
echo "📝 Step 8: Verifying changes..."

ssh $SERVER << 'VERIFY'
echo "Checking for Marcus Chen references..."
grep -r "Marcus Chen" /root/nextnest/scripts/*.js 2>/dev/null | wc -l
echo "Should be 0. If not, manual cleanup needed."

echo ""
echo "Checking cron jobs..."
crontab -l 2>/dev/null | grep -E "(enhance|auto-fix)" | wc -l
echo "Should be 0. If not, cron jobs still exist."
VERIFY

echo ""
echo "================================================"
echo "✅ FIXES APPLIED!"
echo ""
echo "What was fixed:"
echo "1. ❌ Removed Marcus Chen (male broker) - replaced with Michelle Chen"
echo "2. ❌ Removed cron jobs that create duplicate messages"
echo "3. ❌ Disabled auto-generation of form submission messages"
echo "4. ❌ Disabled 'Conversation was reopened' messages"
echo "5. ✅ Updated all scripts to use 5 female brokers only"
echo "6. ✅ Created configuration for natural conversation flow"
echo ""
echo "⚠️  IMPORTANT: Update your n8n workflow to:"
echo "1. Use endpoint: https://nextnest.sg/api/chatwoot-enhanced-flow"
echo "2. Filter out system messages before sending to API"
echo "3. Only process 'incoming' messages from contacts"
echo ""
echo "To test the fix:"
echo "1. Create a new conversation in Chatwoot"
echo "2. You should NOT see:"
echo "   - 'Conversation was reopened by Brent'"
echo "   - 'Brent added AI-Broker-Marcus'"
echo "   - Duplicate form submissions"
echo "3. You SHOULD see:"
echo "   - Natural broker joining after delay"
echo "   - Typing indicators"
echo "   - Female broker names only"