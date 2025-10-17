// Test script to create a new conversation and verify broker system messages
// This simulates what happens when a user completes the form

const testData = {
  formData: {
    // Step 1 - Basic info
    name: "Test User",
    email: "test@example.com",
    phone: "91234567",

    // Step 2 - Loan details
    loanType: "new_purchase",
    propertyCategory: "resale",
    propertyType: "HDB",
    propertyPrice: 500000,

    // Step 3 - Income
    actualAges: [35],
    actualIncomes: [5000],
    employmentType: "employed",
    existingCommitments: 500,
    creditCardCount: "2",
    applicantType: "single"
  },
  sessionId: `test-${Date.now()}`,
  leadScore: 75
}

async function createTestConversation() {
  console.log('\n🧪 Creating test conversation to verify broker system messages\n')

  try {
    const response = await fetch('http://localhost:3007/api/chatwoot-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Failed to create conversation:', response.status, error)
      return
    }

    const result = await response.json()
    console.log('✅ Conversation created successfully!')
    console.log('   Conversation ID:', result.conversationId)

    if (result.widgetConfig?.customAttributes?.ai_broker_name) {
      console.log('   Assigned Broker:', result.widgetConfig.customAttributes.ai_broker_name)
    }

    console.log('\n📋 Expected behavior:')
    console.log('   1. System message: "[Broker] is reviewing your details and will join the chat shortly."')
    console.log('   2. After 3-15 seconds: "[Broker] joined the conversation."')
    console.log('   3. Both should appear as centered system chips, not as user/agent messages')

    console.log('\n🔗 Open the chat at: http://localhost:3007/chat?conversation_id=' + result.conversationId)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTestConversation()