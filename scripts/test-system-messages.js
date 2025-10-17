// Test script to create different types of messages in Chatwoot
// This will help us understand how each message type appears

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

async function createTestMessages(conversationId) {
  console.log(`\n🧪 Testing different message types for conversation ${conversationId}\n`)

  // Test 1: Regular outgoing message (agent message)
  console.log('1. Creating regular agent message...')
  const agent = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'TEST 1: This is a regular agent message (outgoing)',
        message_type: 'outgoing',
        private: false
      })
    }
  )
  console.log(`   Status: ${agent.status} ${agent.statusText}`)

  // Test 2: Activity message (should be system message)
  console.log('2. Creating activity/system message...')
  const activity = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'TEST 2: Sarah Wong is reviewing your details (activity)',
        message_type: 'activity',
        private: false
      })
    }
  )
  console.log(`   Status: ${activity.status} ${activity.statusText}`)

  // Test 3: Private message (should be hidden)
  console.log('3. Creating private message...')
  const privateMsg = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'TEST 3: This is a private note (should be hidden)',
        message_type: 'outgoing',
        private: true
      })
    }
  )
  console.log(`   Status: ${privateMsg.status} ${privateMsg.statusText}`)

  // Test 4: Using numeric message_type
  console.log('4. Creating message with numeric type 2 (activity)...')
  const numeric = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'TEST 4: Michelle Chen joined the conversation (numeric type 2)',
        message_type: 2,  // Numeric activity type
        private: false
      })
    }
  )
  console.log(`   Status: ${numeric.status} ${numeric.statusText}`)

  console.log('\n✅ Test messages created. Check the chat UI to see how they render.')
  console.log('Expected behavior:')
  console.log('  - TEST 1: Should appear as agent message (left side)')
  console.log('  - TEST 2: Should appear as centered system chip')
  console.log('  - TEST 3: Should be hidden (private)')
  console.log('  - TEST 4: Should appear as centered system chip')
}

// Get conversation ID from command line or use default
const conversationId = process.argv[2] || '24'

createTestMessages(conversationId).catch(console.error)