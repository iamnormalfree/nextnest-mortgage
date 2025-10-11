-- AI Conversations Database Schema
-- Supports: Conversation storage, turn tracking, calculation audits
-- Compatible with: Supabase PostgreSQL

-- Conversations table (metadata and memory snapshots)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  -- Memory snapshot (JSONB for flexible querying)
  memory_snapshot JSONB NOT NULL DEFAULT '{"critical": [], "firm": [], "casual": []}'::jsonb,

  -- Context fields
  broker_persona TEXT,
  lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
  loan_type TEXT
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Index for active conversations
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(last_activity DESC) WHERE archived_at IS NULL;

-- Index for lead score filtering
CREATE INDEX IF NOT EXISTS idx_conversations_lead_score ON conversations(lead_score DESC);

-- Conversation turns table (individual messages)
CREATE TABLE IF NOT EXISTS conversation_turns (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Token tracking
  token_count INTEGER DEFAULT 0 CHECK (token_count >= 0),

  -- Model tracking
  model_used TEXT,

  -- Intent classification (JSONB for structured data)
  intent_classification JSONB,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for conversation retrieval
CREATE INDEX IF NOT EXISTS idx_turns_conversation_id ON conversation_turns(conversation_id, timestamp DESC);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_turns_role ON conversation_turns(role);

-- Calculation audit table (Dr. Elena compliance tracking)
CREATE TABLE IF NOT EXISTS calculation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  calculation_type TEXT NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- MAS compliance tracking
  mas_compliant BOOLEAN DEFAULT true,
  regulatory_notes TEXT,

  -- Formula version tracking (for auditing if formulas change)
  formula_version TEXT DEFAULT '1.0'
);

-- Index for calculation lookups
CREATE INDEX IF NOT EXISTS idx_calculation_audit_conversation ON calculation_audit(conversation_id, timestamp DESC);

-- Index for calculation type analysis
CREATE INDEX IF NOT EXISTS idx_calculation_audit_type ON calculation_audit(calculation_type);

-- Index for compliance queries
CREATE INDEX IF NOT EXISTS idx_calculation_audit_compliance ON calculation_audit(mas_compliant) WHERE mas_compliant = false;

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY conversations_user_policy ON conversations
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.jwt()->>'role' = 'service_role');

-- Policy: Users can only see turns from their conversations
CREATE POLICY turns_user_policy ON conversation_turns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_turns.conversation_id
      AND (conversations.user_id = auth.uid()::text OR auth.jwt()->>'role' = 'service_role')
    )
  );

-- Policy: Only service role can access calculation audits (compliance)
CREATE POLICY calculation_audit_service_policy ON calculation_audit
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- Views for analytics

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

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Stores conversation metadata and memory snapshots for AI chat system';
COMMENT ON TABLE conversation_turns IS 'Individual messages within conversations, tracks tokens and model usage';
COMMENT ON TABLE calculation_audit IS 'MAS-compliant audit trail for all Dr. Elena mortgage calculations';

COMMENT ON COLUMN conversations.memory_snapshot IS 'Tiered memory: critical (confirmed facts), firm (inferences), casual (context)';
COMMENT ON COLUMN conversation_turns.intent_classification IS 'Result of intent routing (category, confidence, suggested model)';
COMMENT ON COLUMN calculation_audit.mas_compliant IS 'Whether calculation follows MAS Notice 632/645 regulations';
