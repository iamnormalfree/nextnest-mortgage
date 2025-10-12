# Database Migrations

This directory contains SQL migration files for the NextNest database schema.

## Migration Files

### 20251012045549_add_broker_availability_fields.sql

**Purpose:** Adds broker capacity management and availability tracking columns to the `ai_brokers` table.

**Added Columns:**
- `current_workload` (INTEGER, NOT NULL, DEFAULT 0) - Current number of active conversations
- `max_concurrent_chats` (INTEGER, NOT NULL, DEFAULT 1) - Maximum concurrent conversations allowed
- `active_conversations` (INTEGER, NOT NULL, DEFAULT 0) - Real-time active conversation count
- `is_available` (BOOLEAN, NOT NULL, DEFAULT TRUE) - Availability status flag
- `last_active_at` (TIMESTAMPTZ, NULLABLE) - Last activity timestamp

**Indexes Created:**
- `idx_ai_brokers_availability` - Composite index on (is_available, is_active) for fast availability queries
- `idx_ai_brokers_workload` - Composite index on (current_workload, is_available) for workload-based queries

**Code Dependencies:**
- `lib/ai/broker-availability.ts` - Manages broker capacity using these fields
- `lib/ai/broker-assignment.ts` - Queries availability for broker assignment

**Safety Features:**
- Uses `IF NOT EXISTS` clauses for idempotent execution
- Safe to run multiple times without errors
- Automatically initializes existing records with safe defaults

## Running Migrations

### Using Supabase CLI:
```bash
supabase db push
```

### Manual Execution:
```bash
psql -h <your-host> -U <your-user> -d <your-database> -f supabase/migrations/20251012045549_add_broker_availability_fields.sql
```

### Rollback (if needed):
```sql
-- Remove added columns (use with caution)
ALTER TABLE ai_brokers 
DROP COLUMN IF EXISTS current_workload,
DROP COLUMN IF EXISTS max_concurrent_chats,
DROP COLUMN IF EXISTS active_conversations,
DROP COLUMN IF EXISTS is_available,
DROP COLUMN IF EXISTS last_active_at;

-- Remove indexes
DROP INDEX IF EXISTS idx_ai_brokers_availability;
DROP INDEX IF EXISTS idx_ai_brokers_workload;
```

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_brokers'
  AND column_name IN ('current_workload', 'max_concurrent_chats', 'active_conversations', 'is_available', 'last_active_at')
ORDER BY column_name;
```

Check that existing brokers have been initialized:

```sql
SELECT id, name, current_workload, max_concurrent_chats, active_conversations, is_available
FROM ai_brokers
LIMIT 5;
```
