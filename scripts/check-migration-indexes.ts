// ABOUTME: Verifies indexes exist in Supabase database
// ABOUTME: Uses direct SQL query via Supabase client

import { createClient } from '@supabase/supabase-js';

async function checkIndexes(): Promise<void> {
  console.log('Checking Database Indexes...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const expectedIndexes = [
    'idx_conversations_user_id',
    'idx_conversations_active',
    'idx_conversations_lead_score',
    'idx_turns_conversation_id',
    'idx_turns_role',
    'idx_calculation_audit_conversation',
    'idx_calculation_audit_type',
    'idx_calculation_audit_compliance'
  ];
  
  console.log('Querying pg_indexes for public schema...\n');
  
  try {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public')
      .in('indexname', expectedIndexes);
    
    if (error) {
      console.error('Error querying indexes:', error.message);
      console.log('\nAttempting raw SQL query...\n');
      
      const query = `
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('conversations', 'conversation_turns', 'calculation_audit')
        ORDER BY tablename, indexname
      `;
      
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', { sql: query });
      
      if (sqlError) {
        console.error('Raw SQL also failed:', sqlError.message);
        process.exit(1);
      }
      
      console.log('All indexes found:');
      console.log(sqlData);
      return;
    }
    
    console.log('Expected indexes found:');
    expectedIndexes.forEach(index => {
      const found = data?.find(d => d.indexname === index);
      const icon = found ? '✅' : '❌';
      const table = found ? ` (${found.tablename})` : '';
      console.log(`  ${icon} ${index}${table}`);
    });
    
    const foundCount = data?.length || 0;
    console.log(`\nTotal: ${foundCount}/${expectedIndexes.length} indexes found`);
    
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

checkIndexes().catch(console.error);
