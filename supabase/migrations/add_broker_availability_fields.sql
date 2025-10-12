-- Migration: Add Broker Availability Management Fields
-- Created: 2025-10-12
-- Description: Adds columns required for tracking broker capacity, availability, and workload
-- Dependencies: lib/ai/broker-availability.ts, lib/ai/broker-assignment.ts
--
-- This migration adds the following columns to ai_brokers table:
-- - current_workload: Tracks current number of active conversations (INTEGER)
-- - max_concurrent_chats: Maximum conversations a broker can handle (INTEGER, default: 1)
-- - active_conversations: Current active conversation count (INTEGER, default: 0)
-- - is_available: Whether broker can accept new conversations (BOOLEAN, default: TRUE)
-- - last_active_at: Timestamp of last broker activity (TIMESTAMPTZ, nullable)
--
-- The migration is idempotent and safe to run multiple times.

-- Add missing columns for broker availability management
ALTER TABLE ai_brokers 
ADD COLUMN IF NOT EXISTS current_workload INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS max_concurrent_chats INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS active_conversations INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Create composite index for efficient availability queries
-- This index optimizes the common query pattern: WHERE is_available = TRUE AND is_active = TRUE
CREATE INDEX IF NOT EXISTS idx_ai_brokers_availability 
ON ai_brokers (is_available, is_active) 
WHERE is_available = TRUE AND is_active = TRUE;

-- Create index for workload tracking
-- Useful for finding brokers with lowest workload
CREATE INDEX IF NOT EXISTS idx_ai_brokers_workload 
ON ai_brokers (current_workload, is_available) 
WHERE is_available = TRUE AND is_active = TRUE;

-- Update existing broker records with safe defaults
-- This ensures any existing brokers are properly initialized
UPDATE ai_brokers
SET 
  current_workload = COALESCE(current_workload, 0),
  max_concurrent_chats = COALESCE(max_concurrent_chats, 1),
  active_conversations = COALESCE(active_conversations, 0),
  is_available = COALESCE(is_available, TRUE)
WHERE current_workload IS NULL 
   OR max_concurrent_chats IS NULL 
   OR active_conversations IS NULL 
   OR is_available IS NULL;

-- Add comment to table explaining the capacity management fields
COMMENT ON COLUMN ai_brokers.current_workload IS 'Current number of active conversations assigned to this broker';
COMMENT ON COLUMN ai_brokers.max_concurrent_chats IS 'Maximum number of concurrent conversations this broker can handle';
COMMENT ON COLUMN ai_brokers.active_conversations IS 'Real-time count of active conversations (synced with broker_conversations table)';
COMMENT ON COLUMN ai_brokers.is_available IS 'Boolean flag indicating if broker can accept new conversations (auto-updated when workload changes)';
COMMENT ON COLUMN ai_brokers.last_active_at IS 'Timestamp of last broker activity (message sent, conversation assigned, etc.)';
