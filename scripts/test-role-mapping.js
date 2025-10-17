// Test script to verify role mapping for numeric type 1
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

async function testNumericType1(conversationId) {
  console.log('\n🔍 Testing numeric type 1 role mapping...')

  try {
    // Create a message with numeric type 1
    const createResponse = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'TEST: Numeric type 1 - should be agent',
          message_type: 1,
          private: false
        })
      }
    )

    if (createResponse.ok) {
      const created = await createResponse.json()
      console.log('✅ Created message with type 1')
      console.log('   Message ID:', created.id)
      console.log('   Message type:', created.message_type)
      console.log('   Sender type:', created.sender?.type)
    }

    // Wait for message to propagate
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Fetch via our API
    const apiResponse = await fetch(
      `http://localhost:3007/api/chat/messages?conversation_id=${conversationId}`
    )

    if (apiResponse.ok) {
      const data = await apiResponse.json()
      const testMsg = data.messages.find(m =>
        m.content?.includes('TEST: Numeric type 1')
      )

      if (testMsg) {
        console.log('\n📊 Message details from our API:')
        console.log('   Content:', testMsg.content)
        console.log('   Message type:', testMsg.message_type)
        console.log('   Sender type:', testMsg.sender?.type)
        console.log('   Assigned role:', testMsg.role)
        console.log('   Expected role: agent')

        if (testMsg.role === 'agent') {
          console.log('✅ Role correctly assigned as agent')
        } else {
          console.log(`❌ Role incorrectly assigned as ${testMsg.role}`)
          console.log('\nDebug: Full message object:')
          console.log(JSON.stringify(testMsg, null, 2))
        }
      }
    }

    // Also fetch directly from Chatwoot to see raw data
    const chatwootResponse = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN
        }
      }
    )

    if (chatwootResponse.ok) {
      const chatwootData = await chatwootResponse.json()
      const messages = chatwootData.payload || chatwootData || []
      const rawMsg = messages.find(m =>
        m.content?.includes('TEST: Numeric type 1')
      )

      if (rawMsg) {
        console.log('\n📦 Raw Chatwoot message:')
        console.log('   Message type:', rawMsg.message_type)
        console.log('   Sender:', JSON.stringify(rawMsg.sender))
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run test
const conversationId = process.argv[2] || 135
testNumericType1(conversationId)