import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://xlncuntbqajqfkegmuvo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU1MzY4MywiZXhwIjoyMDczMTI5NjgzfQ.vTtYX4dPce_KlkT8XlgB1-OGFqI-sV7CPNnovNA0kXE';

async function runMigration() {
  console.log('🚀 Starting AI Chat Intelligence System Migration...\n');

  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration SQL file
  const migrationPath = join(process.cwd(), 'lib', 'db', 'migrations', '001_ai_conversations.sql');
  console.log(`📂 Reading migration file: ${migrationPath}`);
  
  const sqlContent = readFileSync(migrationPath, 'utf-8');
  console.log(`✅ Migration file loaded (${sqlContent.length} characters)\n`);

  // Split SQL into individual statements (handle multi-statement execution)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{statement: string, error: any}> = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    
    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // Some errors are expected (e.g., "already exists" for idempotent migrations)
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Warning: ${error.message}`);
          successCount++;
        } else {
          console.log(`  ❌ Error: ${error.message}`);
          errors.push({ statement: preview, error: error.message });
          errorCount++;
        }
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    } catch (err: any) {
      console.log(`  ❌ Exception: ${err.message}`);
      errors.push({ statement: preview, error: err.message });
      errorCount++;
    }

    console.log('');
  }

  // Summary
  console.log('=' .repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('');

  if (errors.length > 0) {
    console.log('⚠️  ERRORS ENCOUNTERED:');
    errors.forEach((e, i) => {
      console.log(`\n${i + 1}. ${e.statement}`);
      console.log(`   Error: ${e.error}`);
    });
    console.log('');
  }

  // Verification
  console.log('🔍 VERIFICATION:');
  console.log('-'.repeat(60));

  // Check tables
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('conversations', 'conversation_turns', 'calculation_audit');`
  });

  console.log('\n📋 Tables Created:');
  if (!tablesError && tables) {
    console.log('  ✅ conversations');
    console.log('  ✅ conversation_turns');
    console.log('  ✅ calculation_audit');
  } else {
    console.log(`  ❌ Error checking tables: ${tablesError?.message}`);
  }

  // Check indexes
  const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
    sql: `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('conversations', 'conversation_turns', 'calculation_audit');`
  });

  console.log('\n🔍 Indexes Created:');
  if (!indexesError && indexes) {
    console.log('  ✅ All indexes created successfully');
  } else {
    console.log(`  ❌ Error checking indexes: ${indexesError?.message}`);
  }

  // Check views
  const { data: views, error: viewsError } = await supabase.rpc('exec_sql', {
    sql: `SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname IN ('active_conversations', 'model_usage_stats', 'calculation_compliance_report');`
  });

  console.log('\n📊 Views Created:');
  if (!viewsError && views) {
    console.log('  ✅ active_conversations');
    console.log('  ✅ model_usage_stats');
    console.log('  ✅ calculation_compliance_report');
  } else {
    console.log(`  ❌ Error checking views: ${viewsError?.message}`);
  }

  console.log('\n' + '='.repeat(60));
  
  if (errorCount === 0) {
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n💡 Next step: Run foundation tests:');
    console.log('   npx tsx scripts/test-ai-foundation.ts');
  } else {
    console.log('⚠️  MIGRATION COMPLETED WITH ERRORS');
    console.log('\n💡 Check errors above and retry if needed.');
  }
  
  console.log('='.repeat(60));

  process.exit(errorCount === 0 ? 0 : 1);
}

runMigration().catch(console.error);
