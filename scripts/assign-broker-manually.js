// Manually assign a broker to a conversation for testing
const conversationId = process.argv[2] || 41;
const brokerSlug = process.argv[3] || 'michelle-chen'; // Default to Michelle Chen

async function assignBrokerManually() {
  console.log(`\n🎯 Manually assigning broker to conversation ${conversationId}...\n`);

  const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU1MzY4MywiZXhwIjoyMDczMTI5NjgzfQ.p2FxZsHU8N4vNJ3U-hZqnj9TxdvHgJWyiX8Bk7RXVFY';

  try {
    // 1. Get broker details
    console.log(`📋 Fetching broker: ${brokerSlug}`);
    const brokerResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_brokers?slug=eq.${brokerSlug}`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!brokerResponse.ok) {
      throw new Error(`Failed to fetch broker: ${brokerResponse.status}`);
    }

    const brokers = await brokerResponse.json();
    if (brokers.length === 0) {
      console.log('❌ Broker not found. Available brokers:');
      console.log('  - michelle-chen (aggressive)');
      console.log('  - sarah-wong (balanced)');
      console.log('  - grace-lim (conservative)');
      console.log('  - rachel-tan (modern)');
      console.log('  - jasmine-lee (networker)');
      return;
    }

    const broker = brokers[0];
    console.log(`✅ Found broker: ${broker.name} (${broker.personality_type})`);

    // 2. Check if assignment already exists
    console.log('\n🔍 Checking existing assignment...');
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/broker_conversations?conversation_id=eq.${conversationId}`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const existingAssignments = await checkResponse.json();
    
    if (existingAssignments.length > 0) {
      console.log('⚠️  Assignment already exists. Updating...');
      
      // Update existing assignment
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/broker_conversations?conversation_id=eq.${conversationId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            broker_id: broker.id,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (updateResponse.ok) {
        console.log('✅ Assignment updated successfully!');
      } else {
        console.log('❌ Failed to update assignment:', await updateResponse.text());
      }
    } else {
      console.log('📝 Creating new assignment...');
      
      // Create new assignment
      const createResponse = await fetch(
        `${supabaseUrl}/rest/v1/broker_conversations`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            conversation_id: parseInt(conversationId),
            broker_id: broker.id,
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            lead_score: 75,
            loan_type: 'new_purchase',
            property_type: 'hdb',
            monthly_income: 8000,
            timeline: 'soon',
            assignment_method: 'manual_test',
            assignment_reason: 'Manual assignment for testing',
            status: 'active',
            assigned_at: new Date().toISOString()
          })
        }
      );

      if (createResponse.ok) {
        const result = await createResponse.json();
        console.log('✅ Assignment created successfully!');
        console.log(JSON.stringify(result, null, 2));
      } else {
        const error = await createResponse.text();
        console.log('❌ Failed to create assignment:', error);
      }
    }

    // 3. Update broker workload
    console.log('\n📊 Updating broker workload...');
    const workloadResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_brokers?id=eq.${broker.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_workload: broker.current_workload + 1
        })
      }
    );

    if (workloadResponse.ok) {
      console.log('✅ Workload updated');
    }

    // 4. Verify assignment via API
    console.log('\n🔍 Verifying via API...');
    const verifyResponse = await fetch(`http://localhost:3000/api/brokers/conversation/${conversationId}`);
    
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log('✅ Broker now accessible via API:');
      console.log(`  Name: ${data.broker.name}`);
      console.log(`  Role: ${data.broker.role}`);
      console.log(`  Photo: ${data.broker.photoUrl}`);
      console.log(`\n🎉 Success! Refresh the chat page to see the broker profile.`);
    } else {
      console.log('⚠️  API verification failed. The assignment might take a moment to propagate.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Usage instructions
if (process.argv.length < 3) {
  console.log('Usage: node scripts/assign-broker-manually.js <conversation_id> [broker_slug]');
  console.log('\nExamples:');
  console.log('  node scripts/assign-broker-manually.js 41');
  console.log('  node scripts/assign-broker-manually.js 41 sarah-wong');
  console.log('\nAvailable brokers:');
  console.log('  michelle-chen, sarah-wong, grace-lim, rachel-tan, jasmine-lee');
} else {
  assignBrokerManually();
}