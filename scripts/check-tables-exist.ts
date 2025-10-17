// ABOUTME: Quick check if migration tables exist in Supabase
// ABOUTME: Verifies conversations, conversation_turns, and calculation_audit tables

import { createClient } from '@supabase/supabase-js';

async function checkTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking if migration tables exist...\n');

  // Check conversations table
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('count')
    .limit(0);

  if (convError) {
    console.log('❌ conversations table: NOT FOUND');
    console.log('   Error:', convError.message);
  } else {
    console.log('✅ conversations table: EXISTS');
  }

  // Check conversation_turns table
  const { data: turns, error: turnsError } = await supabase
    .from('conversation_turns')
    .select('count')
    .limit(0);

  if (turnsError) {
    console.log('❌ conversation_turns table: NOT FOUND');
    console.log('   Error:', turnsError.message);
  } else {
    console.log('✅ conversation_turns table: EXISTS');
  }

  // Check calculation_audit table
  const { data: audit, error: auditError } = await supabase
    .from('calculation_audit')
    .select('count')
    .limit(0);

  if (auditError) {
    console.log('❌ calculation_audit table: NOT FOUND');
    console.log('   Error:', auditError.message);
  } else {
    console.log('✅ calculation_audit table: EXISTS');
  }

  console.log('\n' + '='.repeat(50));

  if (!convError && !turnsError && !auditError) {
    console.log('✅ MIGRATION COMPLETE - All tables exist');
    console.log('\nYou can skip the manual migration step.');
  } else {
    console.log('⚠️ MIGRATION NEEDED - Some tables missing');
    console.log('\nAction required:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of: lib/db/migrations/001_ai_conversations.sql');
    console.log('3. Paste and click "Run"');
  }
}

checkTables().catch(console.error);
