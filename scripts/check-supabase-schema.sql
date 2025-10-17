-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ai_brokers', 'broker_conversations', 'broker_learning', 'broker_performance');

-- Check ai_brokers columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_brokers' 
ORDER BY ordinal_position;

-- Check broker_conversations columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'broker_conversations' 
ORDER BY ordinal_position;

-- Check if there's any column named 'role' anywhere
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'role' 
AND table_schema = 'public';

-- Test basic query
SELECT COUNT(*) as broker_count FROM ai_brokers;
SELECT COUNT(*) as conversation_count FROM broker_conversations;