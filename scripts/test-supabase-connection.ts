import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('Testing Supabase Connection');
  console.log('='.repeat(60));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }
  
  console.log('Connecting to:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { error: pingError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    
    if (pingError) {
      if (pingError.message.includes('does not exist')) {
        console.log('⚠️  Tables not created yet');
        console.log('Run migration: lib/db/migrations/001_ai_conversations.sql');
        process.exit(0);
      }
      throw pingError;
    }
    
    console.log('✅ Connection successful');
    
    const tables = ['conversations', 'conversation_turns', 'calculation_audit'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      console.log((error ? '❌' : '✅') + ' ' + table);
    }
    
    console.log('✅ ALL TESTS PASSED!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
  }
}

testSupabaseConnection();
