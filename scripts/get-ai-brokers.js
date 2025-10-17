// Get AI brokers from Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8';

async function getAIBrokers() {
  console.log('🔍 Fetching AI brokers from Supabase...\n');
  
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { data: brokers, error } = await supabase
      .from('ai_brokers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching brokers:', error.message);
      return;
    }

    if (!brokers || brokers.length === 0) {
      console.log('⚠️  No active brokers found');
      return;
    }

    console.log(`✅ Found ${brokers.length} active AI brokers:\n`);
    
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.name}`);
      console.log(`   ID: ${broker.id}`);
      console.log(`   Slug: ${broker.slug}`);
      console.log(`   Role: ${broker.role}`);
      console.log(`   Personality: ${broker.personality_type}`);
      console.log(`   Communication Style: ${broker.communication_style}`);
      console.log(`   Approach: ${broker.approach_style}`);
      console.log(`   Workload: ${broker.current_workload}`);
      console.log('');
    });

    // Generate n8n mappings
    console.log('🔧 N8N Workflow Mappings:');
    console.log('\nFor AI_BROKERS object in "Determine Labels" node:');
    console.log('const AI_BROKERS = {');
    brokers.forEach(broker => {
      console.log(`  '${broker.name}': { label: 'AI-Broker-${broker.name.replace(/\s+/g, '-')}', color: '#FF6B6B' },`);
    });
    console.log('};');

    console.log('\nFor brokerUserIds object in "Assign to User" node:');
    console.log('const brokerUserIds = {');
    brokers.forEach(broker => {
      console.log(`  '${broker.name}': ${broker.id}, // Replace with actual Chatwoot User ID`);
    });
    console.log('};');

    console.log('\nFor brokerIntros object in "Generate Broker Message" node:');
    console.log('const brokerIntros = {');
    brokers.forEach(broker => {
      console.log(`  '${broker.name}': \`Hello \${userName}! 👋\\n\\nI'm ${broker.name}, and I'm here to help with your mortgage needs.\\n\\n[Customize this message based on ${broker.personality_type} personality and ${broker.communication_style} style]\`,`);
    });
    console.log('};');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

getAIBrokers();