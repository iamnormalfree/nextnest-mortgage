// Check broker assignment for a conversation
const conversationId = process.argv[2] || 41;

async function checkBrokerAssignment() {
  console.log(`\n🔍 Checking broker assignment for conversation ${conversationId}...\n`);

  try {
    // 1. Check if broker is assigned via API
    const response = await fetch(`http://localhost:3000/api/brokers/conversation/${conversationId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Broker found via API:');
      console.log(JSON.stringify(data.broker, null, 2));
    } else if (response.status === 404) {
      console.log('❌ No broker assigned to this conversation');
      
      // Check Supabase directly
      console.log('\n📊 Checking Supabase directly...');
      
      const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8';
      
      // Check broker_conversations table
      const supabaseResponse = await fetch(
        `${supabaseUrl}/rest/v1/broker_conversations?conversation_id=eq.${conversationId}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (supabaseResponse.ok) {
        const assignments = await supabaseResponse.json();
        if (assignments.length > 0) {
          console.log('📌 Found assignment in broker_conversations:');
          console.log(JSON.stringify(assignments[0], null, 2));
          
          // Get broker details
          const brokerId = assignments[0].broker_id;
          const brokerResponse = await fetch(
            `${supabaseUrl}/rest/v1/ai_brokers?id=eq.${brokerId}`,
            {
              headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (brokerResponse.ok) {
            const brokers = await brokerResponse.json();
            if (brokers.length > 0) {
              console.log('\n🤖 Broker details:');
              console.log(JSON.stringify(brokers[0], null, 2));
            }
          }
        } else {
          console.log('❌ No assignment found in broker_conversations table');
          
          // Suggest creating assignment
          console.log('\n💡 To assign a broker, you can:');
          console.log('1. Submit a new form to create a fresh conversation with broker');
          console.log('2. Manually assign a broker using the assign-broker script');
          console.log('3. Trigger the n8n workflow for this conversation');
        }
      }
    } else {
      console.log('❌ API error:', response.status, response.statusText);
    }
    
    // 2. Check what brokers are available
    console.log('\n📋 Available brokers in system:');
    const brokersResponse = await fetch(
      'https://xlncuntbqajqfkegmuvo.supabase.co/rest/v1/ai_brokers?is_active=eq.true',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (brokersResponse.ok) {
      const brokers = await brokersResponse.json();
      console.log(`Found ${brokers.length} active brokers:`);
      brokers.forEach(b => {
        console.log(`  - ${b.name} (${b.personality_type}) - Workload: ${b.current_workload}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBrokerAssignment();