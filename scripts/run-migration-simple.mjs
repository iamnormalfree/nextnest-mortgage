import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://xlncuntbqajqfkegmuvo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbmN1bnRicWFqcWZrZWdtdXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU1MzY4MywiZXhwIjoyMDczMTI5NjgzfQ.vTtYX4dPce_KlkT8XlgB1-OGFqI-sV7CPNnovNA0kXE';

async function runMigration() {
  console.log('🚀 Starting AI Chat Intelligence System Migration...
');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Read migration SQL
  const migrationPath = join(process.cwd(), 'lib', 'db', 'migrations', '001_ai_conversations.sql');
  const sqlContent = readFileSync(migrationPath, 'utf-8');
  
  console.log('📂 Executing migration file...
');

  // Try direct execution first
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/query', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    const result = await response.json();
    console.log('Migration Response:', result);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration().catch(console.error);