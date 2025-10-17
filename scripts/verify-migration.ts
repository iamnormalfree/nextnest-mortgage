/**
 * Verification Script for AI Chat Intelligence System Database Migration
 * Run this AFTER executing the migration in Supabase SQL Editor
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Validate environment variables
if (!SUPABASE_URL) {
  console.error('\n❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}
if (!SUPABASE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_KEY not found in .env.local');
  process.exit(1);
}

async function verifyMigration() {
  console.log('='.repeat(70));
  console.log('AI CHAT INTELLIGENCE SYSTEM - MIGRATION VERIFICATION');
  console.log('='.repeat(70));
  console.log();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let allChecks = true;

  // Check 1: Conversations table
  console.log('[1/7] Checking conversations table...');
  const { error: conv_error } = await supabase.from('conversations').select('id').limit(0);
  if (conv_error) {
    console.log('  ❌ FAIL:', conv_error.message);
    allChecks = false;
  } else {
    console.log('  ✅ PASS: conversations table exists');
  }

  // Check 2: Conversation turns table
  console.log('[2/7] Checking conversation_turns table...');
  const { error: turns_error } = await supabase.from('conversation_turns').select('id').limit(0);
  if (turns_error) {
    console.log('  ❌ FAIL:', turns_error.message);
    allChecks = false;
  } else {
    console.log('  ✅ PASS: conversation_turns table exists');
  }

  // Check 3: Calculation audit table
  console.log('[3/7] Checking calculation_audit table...');
  const { error: audit_error } = await supabase.from('calculation_audit').select('id').limit(0);
  if (audit_error) {
    console.log('  ❌ FAIL:', audit_error.message);
    allChecks = false;
  } else {
    console.log('  ✅ PASS: calculation_audit table exists');
  }

  // Check 4: Active conversations view
  console.log('[4/7] Checking active_conversations view...');
  const { error: view1_error } = await supabase.from('active_conversations').select('id').limit(0);
  if (view1_error) {
    console.log('  ❌ FAIL:', view1_error.message);
    allChecks = false;
  } else {
    console.log('  ✅ PASS: active_conversations view exists');
  }

  // Check 5: Model usage stats view
  console.log('[5/7] Checking model_usage_stats view...');
  const { error: view2_error } = await supabase.from('model_usage_stats').select('model_used').limit(0);
  if (view2_error) {
    console.log('  ❌ FAIL:', view2_error.message);
    allChecks = false;
  } else {
    console.log('  ✅ PASS: model_usage_stats view exists');
  }

  // Check 6: Calculation compliance view
  console.log('[6/7] Checking calculation_compliance_report view...');
  const { error: view3_error } = await supabase.from('calculation_compliance_report').select('calculation_type').limit(0);
  if (view3_error) {
    console.log('  ❌ FAIL:', view3_error.message);
    allChecks = false;
  } else {
    console.log('  ✅ PASS: calculation_compliance_report view exists');
  }

  // Check 7: Test insert and retrieve
  console.log('[7/7] Testing insert and retrieve...');
  const testConversation = {
    id: 'test_' + Date.now(),
    user_id: 'test_user',
    memory_snapshot: { critical: [], firm: [], casual: [] }
  };

  const { error: insert_error } = await supabase
    .from('conversations')
    .insert(testConversation);

  if (insert_error) {
    console.log('  ❌ FAIL: Insert failed -', insert_error.message);
    allChecks = false;
  } else {
    const { data, error: select_error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConversation.id)
      .single();

    if (select_error || !data) {
      console.log('  ❌ FAIL: Select failed -', select_error?.message);
      allChecks = false;
    } else {
      console.log('  ✅ PASS: Insert and retrieve successful');
      
      // Cleanup
      await supabase.from('conversations').delete().eq('id', testConversation.id);
    }
  }

  console.log();
  console.log('='.repeat(70));
  
  if (allChecks) {
    console.log('✅ ALL CHECKS PASSED - Migration successful!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Run foundation tests: npx tsx scripts/test-ai-foundation.ts');
    console.log('  2. Start using the AI Chat Intelligence System');
  } else {
    console.log('❌ SOME CHECKS FAILED - Please review errors above');
    console.log();
    console.log('Troubleshooting:');
    console.log('  1. Ensure migration SQL was executed completely');
    console.log('  2. Check Supabase SQL Editor for error messages');
    console.log('  3. Verify service role key is correct');
  }
  
  console.log('='.repeat(70));

  process.exit(allChecks ? 0 : 1);
}

verifyMigration().catch(console.error);
