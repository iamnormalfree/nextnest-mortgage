-- Idempotent Migration Script for Dr. Elena
-- This script can be run multiple times safely
-- It will only create objects that don't exist

-- =============================================================================
-- PART 1: Create Tables (IF NOT EXISTS)
-- =============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  memory_snapshot JSONB NOT NULL DEFAULT '{"critical": [], "firm": [], "casual": []}'::jsonb,
  broker_persona TEXT,
  lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
  loan_type TEXT
);

-- Conversation turns table
CREATE TABLE IF NOT EXISTS conversation_turns (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token_count INTEGER DEFAULT 0 CHECK (token_count >= 0),
  model_used TEXT,
  intent_classification JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Calculation audit table
CREATE TABLE IF NOT EXISTS calculation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  calculation_type TEXT NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mas_compliant BOOLEAN DEFAULT true,
  regulatory_notes TEXT,
  formula_version TEXT DEFAULT '1.0'
);

-- =============================================================================
-- PART 2: Create Indexes (IF NOT EXISTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(last_activity DESC) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_lead_score ON conversations(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_turns_conversation_id ON conversation_turns(conversation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_turns_role ON conversation_turns(role);
CREATE INDEX IF NOT EXISTS idx_calculation_audit_conversation ON calculation_audit(conversation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calculation_audit_type ON calculation_audit(calculation_type);
CREATE INDEX IF NOT EXISTS idx_calculation_audit_compliance ON calculation_audit(mas_compliant) WHERE mas_compliant = false;

-- =============================================================================
-- PART 3: Enable RLS (Safe to run multiple times)
-- =============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_audit ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 4: Create or Replace Policies
-- =============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS conversations_user_policy ON conversations;
DROP POLICY IF EXISTS turns_user_policy ON conversation_turns;
DROP POLICY IF EXISTS calculation_audit_service_policy ON calculation_audit;

-- Recreate policies
CREATE POLICY conversations_user_policy ON conversations
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY turns_user_policy ON conversation_turns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_turns.conversation_id
      AND (conversations.user_id = auth.uid()::text OR auth.jwt()->>'role' = 'service_role')
    )
  );

CREATE POLICY calculation_audit_service_policy ON calculation_audit
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- PART 5: Create or Replace Views
-- =============================================================================

-- Active conversations view
CREATE OR REPLACE VIEW active_conversations AS
SELECT
  c.id,
  c.user_id,
  c.created_at,
  c.last_activity,
  c.broker_persona,
  c.lead_score,
  c.loan_type,
  COUNT(ct.id) as turn_count,
  SUM(ct.token_count) as total_tokens
FROM conversations c
LEFT JOIN conversation_turns ct ON c.id = ct.conversation_id
WHERE c.archived_at IS NULL
GROUP BY c.id;

-- Model usage analytics view
CREATE OR REPLACE VIEW model_usage_stats AS
SELECT
  model_used,
  COUNT(*) as usage_count,
  SUM(token_count) as total_tokens,
  AVG(token_count) as avg_tokens_per_turn,
  DATE_TRUNC('day', timestamp) as date
FROM conversation_turns
WHERE model_used IS NOT NULL
GROUP BY model_used, DATE_TRUNC('day', timestamp);

-- Calculation compliance view
CREATE OR REPLACE VIEW calculation_compliance_report AS
SELECT
  calculation_type,
  COUNT(*) as total_calculations,
  COUNT(*) FILTER (WHERE mas_compliant = true) as compliant_calculations,
  COUNT(*) FILTER (WHERE mas_compliant = false) as non_compliant_calculations,
  ROUND(100.0 * COUNT(*) FILTER (WHERE mas_compliant = true) / COUNT(*), 2) as compliance_rate
FROM calculation_audit
GROUP BY calculation_type;

-- =============================================================================
-- PART 6: Add Comments (Safe to run multiple times)
-- =============================================================================

COMMENT ON TABLE conversations IS 'Stores conversation metadata and memory snapshots for AI chat system';
COMMENT ON TABLE conversation_turns IS 'Individual messages within conversations, tracks tokens and model usage';
COMMENT ON TABLE calculation_audit IS 'MAS-compliant audit trail for all Dr. Elena mortgage calculations';
COMMENT ON COLUMN conversations.memory_snapshot IS 'Tiered memory: critical (confirmed facts), firm (inferences), casual (context)';
COMMENT ON COLUMN conversation_turns.intent_classification IS 'Result of intent routing (category, confidence, suggested model)';
COMMENT ON COLUMN calculation_audit.mas_compliant IS 'Whether calculation follows MAS Notice 632/645 regulations';

-- =============================================================================
-- Success Message
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully (idempotent)';
  RAISE NOTICE 'Tables: conversations, conversation_turns, calculation_audit';
  RAISE NOTICE 'Views: active_conversations, model_usage_stats, calculation_compliance_report';
  RAISE NOTICE 'RLS: Enabled on all tables';
  RAISE NOTICE 'Policies: 3 policies created';
END $$;
