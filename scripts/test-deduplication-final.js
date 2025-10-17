// Test script for deduplication implementation
// Use built-in fetch (Node 18+) or node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch')

const API_URL = process.env.API_URL || 'http://localhost:3002'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testDeduplication() {
  const timestamp = Date.now()
  const testData = {
    formData: {
      // Step 1 - Personal details
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: '91234567',  // Local format

      // Step 2 - Loan details
      loanType: 'new_purchase',
      propertyCategory: 'resale',
      propertyType: 'HDB',
      propertyPrice: 500000,

      // Step 3 - Income details
      actualAges: [35],
      actualIncomes: [8000],
      employmentType: 'employed',
      existingCommitments: 0
    },
    sessionId: `test-session-${timestamp}`,
    leadScore: 75
  }

  console.log('🧪 Test 1: First submission')
  console.log('Phone input:', testData.formData.phone)

  try {
    const response1 = await fetch(`${API_URL}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result1 = await response1.json()
    console.log('✅ First submission result:', {
      success: result1.success,
      conversationId: result1.conversationId,
      reused: result1.widgetConfig?.customAttributes?.conversation_reused
    })

    if (!result1.success) {
      console.error('❌ First submission failed:', result1)
      return
    }

    // Wait 5 seconds
    console.log('\n⏳ Waiting 5 seconds...')
    await delay(5000)

    console.log('\n🧪 Test 2: Immediate resubmission (within 30 min window)')
    const response2 = await fetch(`${API_URL}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result2 = await response2.json()
    console.log('✅ Second submission result:', {
      success: result2.success,
      conversationId: result2.conversationId,
      reused: result2.widgetConfig?.customAttributes?.conversation_reused,
      reuseReason: result2.widgetConfig?.customAttributes?.reuse_reason
    })

    // Verify same conversation ID
    if (result1.conversationId === result2.conversationId) {
      console.log('✅ SUCCESS: Same conversation reused!')
    } else {
      console.log('⚠️  WARNING: Different conversation created')
    }

    // Test 3: Different loan type
    console.log('\n🧪 Test 3: Different loan type (should create new)')
    testData.formData.loanType = 'refinance'

    const response3 = await fetch(`${API_URL}/api/chatwoot-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result3 = await response3.json()
    console.log('✅ Different loan type result:', {
      success: result3.success,
      conversationId: result3.conversationId,
      reused: result3.widgetConfig?.customAttributes?.conversation_reused
    })

    if (result3.conversationId !== result1.conversationId) {
      console.log('✅ SUCCESS: New conversation created for different loan type')
    } else {
      console.log('⚠️  WARNING: Reused conversation for different loan type')
    }

    // Test 4: Phone normalization
    console.log('\n🧪 Test 4: Phone format variations')
    const phoneVariations = [
      '91234567',       // Local
      '6591234567',     // With country code
      '+6591234567',    // With +
      '+65 9123 4567'   // With spaces
    ]

    for (const phone of phoneVariations) {
      testData.formData.phone = phone
      testData.formData.email = `test${Date.now()}@example.com`  // New email

      const response = await fetch(`${API_URL}/api/chatwoot-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      console.log(`  Phone "${phone}" → Success: ${result.success}`)
    }

    console.log('\n✅ All tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
testDeduplication()