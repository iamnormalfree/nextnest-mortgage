// Test script to verify the correct way to create activity/system messages in Chatwoot
// Based on CHATWOOT_DOCUMENTATION_REFERENCE.txt line 147: message_type 2 = activity/system message

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

async function testActivityMessages(conversationId) {
  console.log(`\n🧪 Testing activity message creation for conversation ${conversationId}\n`)

  // Test 1: String value 'activity'
  console.log('1. Testing with message_type: "activity" (string)...')
  const test1 = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'TEST STRING: Michelle Chen is reviewing your details.',
        message_type: 'activity',  // String value
        private: false
      })
    }
  )
  console.log(`   Status: ${test1.status}`)
  if (test1.ok) {
    const data1 = await test1.json()
    console.log(`   Created message type: ${data1.message_type}`)
  }

  // Test 2: Numeric value 2
  console.log('\n2. Testing with message_type: 2 (numeric)...')
  const test2 = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'TEST NUMERIC: Sarah Wong joined the conversation.',
        message_type: 2,  // Numeric value
        private: false
      })
    }
  )
  console.log(`   Status: ${test2.status}`)
  if (test2.ok) {
    const data2 = await test2.json()
    console.log(`   Created message type: ${data2.message_type}`)
  }

  // Test 3: Check what the API returns when we fetch messages
  console.log('\n3. Fetching messages to see their types...')
  const fetchResponse = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
    {
      headers: {
        'Api-Access-Token': CHATWOOT_API_TOKEN
      }
    }
  )

  if (fetchResponse.ok) {
    const data = await fetchResponse.json()
    const messages = data.payload || data || []

    // Find our test messages
    const testMessages = messages.filter(m =>
      m.content && (m.content.includes('TEST STRING') || m.content.includes('TEST NUMERIC'))
    )

    console.log('\n   Found test messages:')
    testMessages.forEach(msg => {
      console.log(`   - "${msg.content.substring(0, 50)}..."`)
      console.log(`     message_type: ${msg.message_type} (${typeof msg.message_type})`)
      console.log(`     sender.type: ${msg.sender?.type}`)
    })
  }

  console.log('\n✅ Test complete. Check the UI to see which renders as a system message.')
}

// Get conversation ID from command line or use default
const conversationId = process.argv[2] || '120'

testActivityMessages(conversationId).catch(console.error)