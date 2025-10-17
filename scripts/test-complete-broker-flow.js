// Test the complete broker assignment flow
// This simulates form submission -> conversation creation -> broker assignment

async function testCompleteBrokerFlow() {
  console.log('\n🚀 Testing Complete AI Broker Flow\n');
  console.log('=' .repeat(50));

  const formData = {
    formData: {
      // Step 1: Contact
      name: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      phone: '91234567',
      
      // Step 2: Loan details
      loanType: 'new_purchase',
      propertyCategory: 'resale',
      propertyType: 'HDB 4-Room',
      propertyPrice: 600000,
      
      // Step 3: Financial
      actualAges: [35],
      actualIncomes: [8500],
      employmentType: 'employed',
      existingCommitments: 500,
      creditCardCount: '2'
    },
    sessionId: 'test-session-' + Date.now(),
    leadScore: 78
  };

  try {
    // 1. Submit form to create conversation
    console.log('📝 Step 1: Submitting form data...');
    console.log(`   Name: ${formData.formData.name}`);
    console.log(`   Lead Score: ${formData.leadScore}`);
    console.log(`   Loan Type: ${formData.formData.loanType}`);
    
    const response = await fetch('http://localhost:3000/api/chatwoot-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create conversation: ${error}`);
    }

    const result = await response.json();
    console.log('\n✅ Step 1 Complete: Conversation created');
    console.log(`   Conversation ID: ${result.conversationId}`);
    
    // Check if broker was assigned
    if (result.widgetConfig?.customAttributes?.ai_broker_id) {
      console.log(`   Broker ID: ${result.widgetConfig.customAttributes.ai_broker_id}`);
      console.log(`   Broker Name: ${result.widgetConfig.customAttributes.ai_broker_name}`);
    }

    // 2. Fetch broker details via API
    console.log('\n🔍 Step 2: Fetching broker details...');
    const brokerResponse = await fetch(
      `http://localhost:3000/api/brokers/conversation/${result.conversationId}`
    );

    if (brokerResponse.ok) {
      const brokerData = await brokerResponse.json();
      console.log('✅ Step 2 Complete: Broker retrieved');
      console.log(`   Name: ${brokerData.broker.name}`);
      console.log(`   Role: ${brokerData.broker.role}`);
      console.log(`   Personality: ${brokerData.broker.personalityType}`);
      console.log(`   Photo: ${brokerData.broker.photoUrl}`);
    } else if (brokerResponse.status === 404) {
      console.log('⚠️  No broker found - checking Supabase directly...');
      
      // Check Supabase
      const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8';
      
      const dbCheck = await fetch(
        `${supabaseUrl}/rest/v1/broker_conversations?conversation_id=eq.${result.conversationId}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const assignments = await dbCheck.json();
      if (assignments.length > 0) {
        console.log('   ✅ Assignment exists in database:');
        console.log(`      Broker ID: ${assignments[0].broker_id}`);
        console.log(`      Status: ${assignments[0].status}`);
        console.log('   ⚠️  But API is not returning it - check getBrokerForConversation function');
      } else {
        console.log('   ❌ No assignment in database - assignBestBroker might have failed');
      }
    }

    // 3. Test chat page URL
    console.log('\n🌐 Step 3: Chat page ready');
    console.log(`   URL: http://localhost:3000/chat?conversation=${result.conversationId}`);
    console.log('\n✨ Test complete! Open the URL above to see the broker profile.');
    
    // 4. Optional: Send a test message to trigger n8n
    console.log('\n💬 Step 4: Sending test message (optional)...');
    console.log('   This would trigger the n8n workflow for AI response');
    
    return result.conversationId;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📝 Troubleshooting tips:');
    console.error('1. Make sure the dev server is running (npm run dev)');
    console.error('2. Check if Supabase credentials are correct in .env.local');
    console.error('3. Verify Chatwoot is configured and running');
    console.error('4. Check browser console for detailed errors');
  }
}

// Run the test
testCompleteBrokerFlow().then(conversationId => {
  if (conversationId) {
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Success! Conversation ID:', conversationId);
  }
});