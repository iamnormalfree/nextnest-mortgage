// Assign a broker to a specific conversation for testing
const { createClient } = require('@supabase/supabase-js');

const conversationId = process.argv[2] || 44;
const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8';

async function assignBroker() {
  const supabase = createClient(supabaseUrl, anonKey);
  
  console.log(`\n🎯 Assigning broker to conversation ${conversationId}...\n`);

  // Get Michelle Chen (aggressive personality)
  const { data: brokers } = await supabase
    .from('ai_brokers')
    .select('*')
    .eq('personality_type', 'aggressive')
    .single();

  if (!brokers) {
    console.log('❌ No broker found');
    return;
  }

  const broker = brokers;
  console.log(`📋 Assigning ${broker.name} to conversation ${conversationId}`);

  // Check if assignment exists
  const { data: existing } = await supabase
    .from('broker_conversations')
    .select('id')
    .eq('conversation_id', conversationId)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('broker_conversations')
      .update({
        broker_id: broker.id,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId);

    if (error) {
      console.log('❌ Update failed:', error.message);
    } else {
      console.log('✅ Assignment updated!');
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('broker_conversations')
      .insert({
        conversation_id: parseInt(conversationId),
        broker_id: broker.id,
        lead_score: 75,
        loan_type: 'new_purchase',
        property_type: 'hdb',
        monthly_income: 8000,
        timeline: 'soon',
        assignment_method: 'manual',
        assignment_reason: 'Manual assignment for testing',
        status: 'active'
      });

    if (error) {
      console.log('❌ Insert failed:', error.message);
    } else {
      console.log('✅ Assignment created!');
    }
  }

  console.log(`\n🌐 Open: http://localhost:3000/chat?conversation=${conversationId}`);
  console.log('   You should now see the broker profile!');
}

assignBroker();