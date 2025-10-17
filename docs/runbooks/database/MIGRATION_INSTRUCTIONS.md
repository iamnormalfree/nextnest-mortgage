# AI Chat Intelligence System - Database Migration Instructions

## Overview

This guide walks you through manually running the database migration for the AI Chat Intelligence System in Supabase.

## Prerequisites

- Supabase project: `xlncuntbqajqfkegmuvo`
- Access to Supabase Dashboard
- Migration file: `lib/db/migrations/001_ai_conversations.sql`

## Step 1: Access Supabase SQL Editor

1. Open your browser and navigate to:
   ```
   https://supabase.com/dashboard/project/xlncuntbqajqfkegmuvo/sql/new
   ```

2. You should see the SQL Editor interface

## Step 2: Copy Migration SQL

The migration SQL is already in your clipboard. If not, run:

```powershell
Get-Content lib\db\migrations\001_ai_conversations.sql | Set-Clipboard
```

Or manually open the file at:
```
C:\Users\HomePC\Desktop\Code\NextNest\lib\db\migrations\001_ai_conversations.sql
```

## Step 3: Execute Migration

1. Paste the SQL into the SQL Editor (Ctrl+V)
2. Click the **"Run"** button (or press Ctrl+Enter)
3. Wait for execution (should take 5-10 seconds)

## Step 4: Verify Success

You should see output messages indicating:

- ✅ `CREATE TABLE` (3 times)
  - conversations
  - conversation_turns
  - calculation_audit

- ✅ `CREATE INDEX` (8 times)
  - idx_conversations_user_id
  - idx_conversations_active
  - idx_conversations_lead_score
  - idx_turns_conversation_id
  - idx_turns_role
  - idx_calculation_audit_conversation
  - idx_calculation_audit_type
  - idx_calculation_audit_compliance

- ✅ `CREATE VIEW` (3 times)
  - active_conversations
  - model_usage_stats
  - calculation_compliance_report

- ✅ `ALTER TABLE` (3 times) - RLS enabled
- ✅ `CREATE POLICY` (3 times)

## Step 5: Run Verification Script

After successful execution, verify the migration:

```bash
npx tsx scripts/verify-migration.ts
```

This will check:
1. All tables exist and are accessible
2. All views are created
3. Data can be inserted and retrieved

## Step 6: Run Foundation Tests

Once verification passes, run the full foundation test suite:

```bash
npx tsx scripts/test-ai-foundation.ts
```

You should see:
```
✅ Database Tables - conversations table exists
```

## Troubleshooting

### Error: "relation already exists"

This is OK! The migration uses `IF NOT EXISTS` so it's idempotent. Just means tables are already created.

### Error: "permission denied"

Ensure you're logged into the correct Supabase account with admin access.

### Connection timeout

The database might be sleeping. Try the migration again after a few seconds.

## What This Migration Creates

### Tables

1. **conversations** - Stores conversation metadata and memory snapshots
   - Fields: id, user_id, created_at, last_activity, memory_snapshot, broker_persona, lead_score, loan_type

2. **conversation_turns** - Individual messages within conversations
   - Fields: id, conversation_id, role, content, timestamp, token_count, model_used, intent_classification

3. **calculation_audit** - MAS-compliant audit trail for mortgage calculations
   - Fields: id, conversation_id, calculation_type, inputs, results, mas_compliant, regulatory_notes

### Views

1. **active_conversations** - Analytics view for active conversations
2. **model_usage_stats** - Token and model usage tracking
3. **calculation_compliance_report** - MAS compliance reporting

### Security

- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Service role has full access for admin operations

## Success Criteria

✅ All 3 tables created
✅ All 8 indexes created  
✅ All 3 views created
✅ RLS enabled on all tables
✅ Verification script passes
✅ Foundation test shows "Database Tables: ✅ PASS"

## Next Steps

Once migration is complete:

1. ✅ Verify migration: `npx tsx scripts/verify-migration.ts`
2. ✅ Run foundation tests: `npx tsx scripts/test-ai-foundation.ts`
3. 🚀 Start using the AI Chat Intelligence System!
