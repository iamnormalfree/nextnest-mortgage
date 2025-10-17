/**
 * Test the chat creation API to troubleshoot "chat unavailable" error
 */

// Mock form data that would come from Step 3
const testFormData = {
  formData: {
    // Step 1 - Basic info
    name: "Test User",
    email: "test@example.com", 
    phone: "91234567",
    
    // Step 2 - Loan details
    loanType: "new_purchase",
    propertyCategory: "resale",
    propertyType: "HDB 4-room",
    propertyPrice: 500000,
    
    // Step 3 - Income details
    actualAges: [35],
    actualIncomes: [8000],
    employmentType: "employed",
    existingCommitments: 1000,
    creditCardCount: "2-3",
    applicantType: "single"
  },
  sessionId: "test_session_" + Date.now(),
  leadScore: 85
};

console.log('🧪 Testing Chat Creation API');
console.log('='.repeat(50));

async function testChatCreation() {
  try {
    console.log('📤 Sending request to /api/chatwoot-conversation...');
    console.log('Data:', JSON.stringify(testFormData, null, 2));
    
    const response = await fetch('http://localhost:3004/api/chatwoot-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testFormData)
    });

    console.log('📥 Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Success! Conversation created:', data.conversationId);
      console.log('🔗 Widget config received');
    } else {
      console.log('❌ Failed:', data.error);
      if (data.fallback) {
        console.log('🔄 Fallback provided:', data.fallback);
      }
      if (data.details) {
        console.log('📝 Validation errors:', data.details);
      }
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

// Also test the broker assignment directly
async function testBrokerAssignment() {
  try {
    console.log('\n🤖 Testing Broker Assignment...');
    
    // Check if the broker assignment API exists
    const response = await fetch('http://localhost:3004/api/brokers/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        leadScore: 85,
        loanType: 'new_purchase',
        propertyType: 'resale',
        monthlyIncome: 8000,
        timeline: 'soon'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Broker assignment works:', data);
    } else {
      console.log('❌ Broker assignment API not found or failed:', response.status);
    }
    
  } catch (error) {
    console.log('⚠️ Broker assignment test failed:', error.message);
  }
}

// Run tests
testChatCreation().then(() => {
  return testBrokerAssignment();
});