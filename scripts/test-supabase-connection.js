// Test Supabase connection and RLS
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlncuntbqajqfkegmuvo.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTM2ODMsImV4cCI6MjA3MzEyOTY4M30.bHiwII2RVw48sJGNl-30pJnXe82zDDbR5gMqdl3WWT8';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU1MzY4MywiZXhwIjoyMDczMTI5NjgzfQ.p2FxZsHU8N4vNJ3U-hZqnj9TxdvHgJWyiX8Bk7RXVFY';

async function testSupabaseRLS() {
  console.log('\n🔍 Testing Supabase RLS and Permissions\n');
  console.log('=' .repeat(50));

  // Test 1: Anon Client (what the browser uses)
  console.log('\n1️⃣ Testing with ANON key (browser/public access):');
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  
  try {
    // Try to read brokers
    const { data: brokers, error: readError } = await supabaseAnon
      .from('ai_brokers')
      .select('id, name, personality_type')
      .eq('is_active', true)
      .limit(1);
    
    if (readError) {
      console.log('   ❌ Cannot READ brokers:', readError.message);
    } else {
      console.log('   ✅ Can READ brokers:', brokers?.length || 0, 'found');
    }

    // Try to insert assignment
    const testAssignment = {
      conversation_id: 9999,
      broker_id: brokers?.[0]?.id || '80fc7106-f788-43d1-9530-2bcfa5bcca33',
      lead_score: 75,
      loan_type: 'test',
      property_type: 'test',
      status: 'test',
      assignment_method: 'test'
    };

    const { error: insertError } = await supabaseAnon
      .from('broker_conversations')
      .insert(testAssignment);
    
    if (insertError) {
      console.log('   ❌ Cannot INSERT assignments:', insertError.message);
      if (insertError.message.includes('row-level security')) {
        console.log('      → RLS is blocking inserts!');
      }
    } else {
      console.log('   ✅ Can INSERT assignments');
      // Clean up test
      await supabaseAnon
        .from('broker_conversations')
        .delete()
        .eq('conversation_id', 9999);
    }

  } catch (error) {
    console.log('   ❌ Anon client error:', error.message);
  }

  // Test 2: Service Client (what the backend should use)
  console.log('\n2️⃣ Testing with SERVICE key (backend/admin access):');
  const supabaseService = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Try to read brokers
    const { data: brokers, error: readError } = await supabaseService
      .from('ai_brokers')
      .select('id, name, personality_type')
      .eq('is_active', true)
      .limit(1);
    
    if (readError) {
      console.log('   ❌ Cannot READ brokers:', readError.message);
    } else {
      console.log('   ✅ Can READ brokers:', brokers?.length || 0, 'found');
    }

    // Try to insert assignment
    const testAssignment = {
      conversation_id: 9998,
      broker_id: brokers?.[0]?.id || '80fc7106-f788-43d1-9530-2bcfa5bcca33',
      lead_score: 75,
      loan_type: 'test',
      property_type: 'test',
      status: 'test',
      assignment_method: 'test'
    };

    const { error: insertError } = await supabaseService
      .from('broker_conversations')
      .insert(testAssignment);
    
    if (insertError) {
      console.log('   ❌ Cannot INSERT assignments:', insertError.message);
      if (insertError.message.includes('row-level security')) {
        console.log('      → RLS is STILL blocking service role!');
        console.log('      → This means RLS policies need fixing');
      }
    } else {
      console.log('   ✅ Can INSERT assignments');
      // Clean up test
      await supabaseService
        .from('broker_conversations')
        .delete()
        .eq('conversation_id', 9998);
    }

  } catch (error) {
    console.log('   ❌ Service client error:', error.message);
  }

  // Test 3: Check RLS status
  console.log('\n3️⃣ Checking RLS configuration:');
  
  const { data: rlsStatus } = await supabaseService
    .rpc('check_rls_status');
    
  console.log('\n📊 Summary:');
  console.log('   - If ANON can INSERT: RLS is disabled or has permissive policies');
  console.log('   - If SERVICE can INSERT but ANON cannot: RLS is properly configured');
  console.log('   - If neither can INSERT: RLS is too restrictive');
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Run the fix-rls-policies.sql in Supabase SQL Editor');
  console.log('   2. Use SERVICE key for backend operations');
  console.log('   3. Keep RLS enabled for security');
  
  console.log('\n' + '=' .repeat(50));
}

// Create the RLS check function
async function setupRLSCheckFunction() {
  const supabaseService = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const createFunction = `
    CREATE OR REPLACE FUNCTION check_rls_status()
    RETURNS TABLE(tablename text, rls_enabled boolean)
    LANGUAGE sql
    AS $$
      SELECT tablename::text, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('ai_brokers', 'broker_conversations', 'broker_performance');
    $$;
  `;

  try {
    await supabaseService.rpc('query', { query: createFunction });
  } catch (e) {
    // Function might already exist or we can't create it
  }
}

// Run tests
testSupabaseRLS();