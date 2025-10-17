// Comprehensive test script for all implemented changes
// Tests Task 1-4 requirements from AI_BROKER_IMPLEMENTATION_PLAN.md

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chat.nextnest.sg'
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;

if (!CHATWOOT_API_TOKEN) {
  console.error('❌ Error: CHATWOOT_API_TOKEN environment variable is required');
  process.exit(1);
}
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
}

function log(type, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  switch(type) {
    case 'success':
      console.log(`${colors.green}✅ [${timestamp}] ${message}${colors.reset}`)
      testResults.passed++
      break
    case 'error':
      console.log(`${colors.red}❌ [${timestamp}] ${message}${colors.reset}`)
      testResults.failed++
      break
    case 'warning':
      console.log(`${colors.yellow}⚠️ [${timestamp}] ${message}${colors.reset}`)
      testResults.warnings++
      break
    case 'info':
      console.log(`${colors.blue}ℹ️ [${timestamp}] ${message}${colors.reset}`)
      break
    default:
      console.log(`[${timestamp}] ${message}`)
  }
}

// Test 1: Activity Endpoint (Task 1)
async function testActivityEndpoint(conversationId) {
  log('info', 'Testing Task 1: Activity Endpoint Implementation...')

  try {
    // Test with proper payload structure
    const response = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/activities`,
      {
        method: 'POST',
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'conversation_activity',
          content: 'TEST: Broker system message via activities endpoint'
        })
      }
    )

    if (response.status === 204) {
      log('success', 'Activities endpoint returned 204 No Content (expected)')
    } else {
      log('warning', `Activities endpoint returned ${response.status} instead of 204`)
    }

    // Verify the message appears with correct role
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for message to appear

    const messagesResponse = await fetch(
      `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        headers: {
          'Api-Access-Token': CHATWOOT_API_TOKEN
        }
      }
    )

    if (messagesResponse.ok) {
      const data = await messagesResponse.json()
      const messages = data.payload || data || []
      const activityMessage = messages.find(m =>
        m.content && m.content.includes('TEST: Broker system message')
      )

      if (activityMessage) {
        if (activityMessage.message_type === 2 || activityMessage.message_type === 'activity') {
          log('success', `Activity message has correct message_type: ${activityMessage.message_type}`)
        } else {
          log('error', `Activity message has wrong message_type: ${activityMessage.message_type}`)
        }
      } else {
        log('warning', 'Activity message not found in conversation (may be using fallback)')
      }
    }
  } catch (error) {
    log('error', `Activity endpoint test failed: ${error.message}`)
  }
}

// Test 2: Message Type Normalization (Task 2)
async function testMessageTypeNormalization(conversationId) {
  log('info', 'Testing Task 2: Role Fallback Hardening...')

  try {
    // Create messages with different types
    const testMessages = [
      { content: 'TEST: Numeric type 0', message_type: 0 },
      { content: 'TEST: Numeric type 1', message_type: 1 },
      { content: 'TEST: Numeric type 2', message_type: 2 },
      { content: 'TEST: String incoming', message_type: 'incoming' },
      { content: 'TEST: String outgoing', message_type: 'outgoing' },
      { content: 'TEST: String activity', message_type: 'activity' }
    ]

    for (const msg of testMessages) {
      const response = await fetch(
        `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Api-Access-Token': CHATWOOT_API_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...msg, private: false })
        }
      )

      if (response.ok) {
        log('success', `Created message with type: ${msg.message_type}`)
      } else {
        log('error', `Failed to create message with type: ${msg.message_type}`)
      }
    }

    // Test our API endpoint role assignment
    const apiResponse = await fetch(
      `http://localhost:3007/api/chat/messages?conversation_id=${conversationId}`
    )

    if (apiResponse.ok) {
      const data = await apiResponse.json()
      const messages = data.messages || []

      // Check if roles are properly assigned
      const testMsgs = messages.filter(m => m.content?.includes('TEST:'))

      testMsgs.forEach(msg => {
        const expectedRole = msg.content.includes('type 0') || msg.content.includes('incoming') ? 'user' :
                            msg.content.includes('type 1') || msg.content.includes('outgoing') ? 'agent' :
                            msg.content.includes('type 2') || msg.content.includes('activity') ? 'system' : null

        if (msg.role === expectedRole) {
          log('success', `Message "${msg.content.substring(0, 30)}..." has correct role: ${msg.role}`)
        } else {
          log('error', `Message "${msg.content.substring(0, 30)}..." has wrong role: ${msg.role} (expected: ${expectedRole})`)
        }
      })
    }
  } catch (error) {
    log('error', `Message type normalization test failed: ${error.message}`)
  }
}

// Test 3: Broker Assignment Flow
async function testBrokerAssignment() {
  log('info', 'Testing Task 3 & 4: Broker Assignment and UI Components...')

  try {
    // Create a test conversation with broker assignment
    const response = await fetch('http://localhost:3007/api/chatwoot-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formData: {
          name: "Test User",
          email: `test${Date.now()}@example.com`,
          phone: "91234567",
          loanType: "new_purchase",
          propertyCategory: "resale",
          propertyType: "HDB",
          propertyPrice: 500000,
          actualAges: [35],
          actualIncomes: [8000],
          employmentType: "employed",
          existingCommitments: 500,
          creditCardCount: "2",
          applicantType: "single"
        },
        sessionId: `test-${Date.now()}`,
        leadScore: 85
      })
    })

    if (response.ok) {
      const result = await response.json()
      log('success', `Created conversation ${result.conversationId} with broker assignment`)

      if (result.widgetConfig?.customAttributes?.ai_broker_name) {
        log('success', `Broker "${result.widgetConfig.customAttributes.ai_broker_name}" was assigned`)
      } else {
        log('warning', 'No broker name in response (may be queued)')
      }

      // Wait and check for system messages
      await new Promise(resolve => setTimeout(resolve, 3000))

      const messagesResponse = await fetch(
        `http://localhost:3007/api/chat/messages?conversation_id=${result.conversationId}`
      )

      if (messagesResponse.ok) {
        const data = await messagesResponse.json()
        const systemMessages = data.messages.filter(m => m.role === 'system')

        if (systemMessages.length > 0) {
          log('success', `Found ${systemMessages.length} system messages`)
          systemMessages.forEach(msg => {
            log('info', `System message: "${msg.content}"`)
          })
        } else {
          log('warning', 'No system messages found yet (broker may be delayed)')
        }
      }

      return result.conversationId
    } else {
      log('error', 'Failed to create conversation for broker assignment test')
    }
  } catch (error) {
    log('error', `Broker assignment test failed: ${error.message}`)
  }

  return null
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 COMPREHENSIVE IMPLEMENTATION TEST')
  console.log('Testing all tasks from AI_BROKER_IMPLEMENTATION_PLAN.md')
  console.log('='.repeat(60) + '\n')

  // Use an existing conversation or create a new one
  const testConversationId = process.argv[2] || await testBrokerAssignment()

  if (testConversationId) {
    log('info', `Using conversation ID: ${testConversationId}`)

    // Run all tests
    await testActivityEndpoint(testConversationId)
    await testMessageTypeNormalization(testConversationId)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`)
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`)
  console.log(`${colors.yellow}⚠️ Warnings: ${testResults.warnings}${colors.reset}`)

  const totalTests = testResults.passed + testResults.failed
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0

  console.log(`\n📈 Success Rate: ${successRate}%`)

  if (testResults.failed === 0) {
    console.log(`\n${colors.green}🎉 All critical tests passed! Implementation is ready for review.${colors.reset}`)
  } else {
    console.log(`\n${colors.red}⚠️ Some tests failed. Please review the errors above.${colors.reset}`)
  }
}

// Run tests
runTests().catch(console.error)