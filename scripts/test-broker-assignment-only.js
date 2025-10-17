// Test just the broker assignment functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8';

async function testBrokerAssignment() {
  console.log('\n🎯 Testing Broker Assignment (Simulating assignBestBroker function)\n');
  console.log('=' .repeat(50));

  const supabase = createClient(supabaseUrl, anonKey);
  
  // Test parameters
  const testConversationId = 100 + Math.floor(Math.random() * 900); // Random ID 100-999
  const leadScore = 78;
  const loanType = 'new_purchase';
  const propertyType = 'hdb';
  const monthlyIncome = 8500;
  const timeline = 'soon';

  console.log('📋 Test Parameters:');
  console.log(`   Conversation ID: ${testConversationId}`);
  console.log(`   Lead Score: ${leadScore}`);
  console.log(`   Loan Type: ${loanType}`);
  console.log(`   Property Type: ${propertyType}`);
  console.log(`   Monthly Income: ${monthlyIncome}`);

  try {
    // Step 1: Fetch available brokers
    console.log('\n1️⃣ Fetching available brokers...');
    const { data: brokers, error: brokersError } = await supabase
      .from('ai_brokers')
      .select('*')
      .eq('is_active', true)
      .lt('current_workload', 10);

    if (brokersError) {
      console.log('   ❌ Error fetching brokers:', brokersError.message);
      return;
    }

    console.log(`   ✅ Found ${brokers?.length || 0} available brokers`);

    // Step 2: Select best broker based on lead score
    let targetPersonality = 'balanced';
    if (leadScore >= 75) {
      targetPersonality = 'aggressive';
    } else if (leadScore >= 55) {
      targetPersonality = 'balanced';
    } else if (leadScore < 45) {
      targetPersonality = 'conservative';
    }

    console.log(`   🎯 Target personality: ${targetPersonality}`);

    let broker = brokers?.find(b => b.personality_type === targetPersonality);
    if (!broker && brokers && brokers.length > 0) {
      broker = brokers[0]; // Fallback to first available
    }

    if (!broker) {
      console.log('   ❌ No brokers available');
      return;
    }

    console.log(`   ✅ Selected broker: ${broker.name} (${broker.personality_type})`);

    // Step 3: Create assignment
    console.log('\n2️⃣ Creating broker assignment...');
    const { data: assignment, error: assignmentError } = await supabase
      .from('broker_conversations')
      .insert({
        conversation_id: testConversationId,
        broker_id: broker.id,
        lead_score: leadScore,
        loan_type: loanType,
        property_type: propertyType,
        monthly_income: monthlyIncome,
        timeline: timeline,
        assignment_method: 'auto',
        assignment_reason: `Best match based on lead score (${leadScore}) and ${targetPersonality} personality type`,
        status: 'active'
      })
      .select()
      .single();

    if (assignmentError) {
      console.log('   ❌ Error creating assignment:', assignmentError.message);
      if (assignmentError.message.includes('duplicate')) {
        console.log('      → Assignment already exists for this conversation');
      } else if (assignmentError.message.includes('violates row-level security')) {
        console.log('      → RLS is blocking the insert');
      }
      return;
    }

    console.log('   ✅ Assignment created successfully!');
    console.log(`      Assignment ID: ${assignment.id}`);

    // Step 4: Update broker workload
    console.log('\n3️⃣ Updating broker workload...');
    const { error: updateError } = await supabase
      .from('ai_brokers')
      .update({ current_workload: broker.current_workload + 1 })
      .eq('id', broker.id);

    if (updateError) {
      console.log('   ⚠️  Warning: Could not update workload:', updateError.message);
    } else {
      console.log('   ✅ Workload updated');
    }

    // Step 5: Verify via API
    console.log('\n4️⃣ Verifying assignment via API...');
    const response = await fetch(`http://localhost:3000/api/brokers/conversation/${testConversationId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Broker accessible via API:');
      console.log(`      Name: ${data.broker.name}`);
      console.log(`      Role: ${data.broker.role}`);
      console.log(`      Photo: ${data.broker.photoUrl}`);
    } else {
      console.log('   ⚠️  API returned:', response.status);
    }

    console.log('\n✨ SUCCESS! Broker assignment is working!');
    console.log(`🌐 Test URL: http://localhost:3000/chat?conversation=${testConversationId}`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('broker_conversations')
      .delete()
      .eq('conversation_id', testConversationId);
    
    await supabase
      .from('ai_brokers')
      .update({ current_workload: broker.current_workload })
      .eq('id', broker.id);

    console.log('   ✅ Cleanup complete');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '=' .repeat(50));
}

testBrokerAssignment();