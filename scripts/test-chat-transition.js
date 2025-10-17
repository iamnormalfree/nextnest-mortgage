#!/usr/bin/env node

/**
 * Test script for chat transition API with retry logic
 * Tests the /api/chatwoot-conversation endpoint behavior
 */

const testFormData = {
  // Step 1 fields
  name: 'Test User',
  email: 'test@example.com',
  phone: '91234567',

  // Step 2 fields
  loanType: 'new_purchase',
  propertyCategory: 'resale',
  propertyType: 'HDB',
  propertyPrice: 500000,

  // Step 3 fields
  actualAges: [35],
  actualIncomes: [5000],
  employmentType: 'employed',
  existingCommitments: 1000
}

async function testChatTransition() {
  console.log('🧪 Testing chat transition API...\n')

  try {
    console.log('📤 Sending request to http://localhost:3004/api/chatwoot-conversation')
    console.log('📦 Request payload:', {
      formData: testFormData,
      sessionId: 'test-session-' + Date.now(),
      leadScore: 65
    })

    const response = await fetch('http://localhost:3004/api/chatwoot-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData: testFormData,
        sessionId: 'test-session-' + Date.now(),
        leadScore: 65
      })
    })

    console.log(`\n📥 Response status: ${response.status} ${response.statusText}`)

    const data = await response.json()
    console.log('📄 Response data:', JSON.stringify(data, null, 2))

    if (data.success) {
      console.log('\n✅ SUCCESS: Chat conversation created')
      console.log(`   Conversation ID: ${data.conversationId}`)
      console.log(`   Widget config:`, data.widgetConfig?.baseUrl ? 'Present' : 'Missing')
    } else if (data.fallback) {
      console.log('\n⚠️ FALLBACK: Chat service unavailable')
      console.log(`   Fallback type: ${data.fallback.type}`)
      console.log(`   Fallback contact: ${data.fallback.contact}`)
      console.log(`   Message: ${data.fallback.message}`)
      console.log('\n   This is expected if Chatwoot is not configured.')
    } else {
      console.log('\n❌ ERROR: Unexpected response format')
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    if (error.cause) {
      console.error('   Cause:', error.cause)
    }
  }
}

// Run the test
console.log('=' .repeat(60))
console.log('CHAT TRANSITION API TEST')
console.log('=' .repeat(60))
testChatTransition().then(() => {
  console.log('\n' + '=' .repeat(60))
  console.log('Test completed')
  process.exit(0)
}).catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})