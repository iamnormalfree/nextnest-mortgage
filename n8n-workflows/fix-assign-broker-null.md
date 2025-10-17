# Fix for assign_best_broker Returning NULL

## Debug Steps

### 1. First, Check if Brokers Exist
Run this in Supabase SQL Editor:
```sql
-- Check if brokers exist and are active
SELECT 
  id, 
  name, 
  personality_type, 
  is_active, 
  current_workload 
FROM ai_brokers;
```

### 2. Test the Function Directly
```sql
-- Test with your exact parameters
SELECT assign_best_broker(
  85,              -- lead_score from your test
  'new_purchase',  -- loan_type
  'resale',        -- property_type  
  8000,            -- monthly_income
  'urgent'         -- timeline
);
```

### 3. Check Why It's NULL
```sql
-- See what the function is trying to do
SELECT 
  name,
  personality_type,
  is_active,
  current_workload,
  CASE 
    WHEN 85 >= 75 THEN 'Should match aggressive'
    WHEN 85 >= 45 THEN 'Should match balanced'
    ELSE 'Should match conservative'
  END as expected_match
FROM ai_brokers
WHERE is_active = true 
  AND current_workload < 10;
```

## SOLUTION 1: Fix the assign_best_broker Function

The function might be too restrictive. Replace it with this simpler version:

```sql
i tr
```

## SOLUTION 2: Direct Assignment in n8n (Skip the Function)

Replace the "Assign Best Broker 2" query with this direct assignment:

```sql
-- Direct broker assignment without function
WITH broker_selection AS (
  SELECT 
    CASE 
      WHEN {{ $('Extract Customer Profile').item.json.leadScore }} >= 75 THEN 'aggressive'
      WHEN {{ $('Extract Customer Profile').item.json.leadScore }} >= 45 THEN 'balanced'
      ELSE 'conservative'
    END as target_personality
)
SELECT 
  b.id as broker_id,
  b.*
FROM ai_brokers b, broker_selection bs
WHERE b.personality_type = bs.target_personality
  AND b.is_active = true
  AND b.current_workload < 10
UNION ALL
-- Fallback: get any active broker if no personality match
SELECT 
  b.id as broker_id,
  b.*
FROM ai_brokers b
WHERE b.is_active = true
  AND b.current_workload < 10
  AND NOT EXISTS (
    SELECT 1 FROM ai_brokers b2, broker_selection bs
    WHERE b2.personality_type = bs.target_personality
      AND b2.is_active = true
      AND b2.current_workload < 10
  )
LIMIT 1;
```

## SOLUTION 3: Hardcode for Testing

For immediate testing, replace "Assign Best Broker 2" with a Code node:

```javascript
// Code node: Assign Broker Based on Score
const customerProfile = $('Extract Customer Profile').item.json;
const leadScore = customerProfile.leadScore || 50;

// Hardcoded broker mappings (get these IDs from your database)
const brokers = {
  aggressive: {
    id: 'YOUR-MICHELLE-CHEN-UUID',  // Replace with actual UUID
    name: 'Michelle Chen',
    personality_type: 'aggressive',
    voice_description: 'Direct, results-driven professional',
    communication_style: 'Assertive and time-conscious',
    approach_style: 'Push for quick decisions',
    favorite_phrases: ['exclusive opportunity', 'act fast', 'limited time'],
    speaking_speed: 'fast',
    voice_model: 'alloy'
  },
  balanced: {
    id: 'YOUR-SARAH-WONG-UUID',  // Replace with actual UUID
    name: 'Sarah Wong',
    personality_type: 'balanced',
    voice_description: 'Friendly and knowledgeable advisor',
    communication_style: 'Educational and supportive',
    approach_style: 'Build trust through expertise',
    favorite_phrases: ['let me explain', 'great question', 'here are your options'],
    speaking_speed: 'moderate',
    voice_model: 'nova'
  },
  conservative: {
    id: 'YOUR-GRACE-LIM-UUID',  // Replace with actual UUID
    name: 'Grace Lim',
    personality_type: 'conservative',
    voice_description: 'Patient and caring counselor',
    communication_style: 'Gentle and reassuring',
    approach_style: 'No pressure, take your time',
    favorite_phrases: ['no rush', 'when you\'re ready', 'let\'s go through this slowly'],
    speaking_speed: 'slow',
    voice_model: 'shimmer'
  }
};

// Select broker based on score
let selectedBroker;
if (leadScore >= 75) {
  selectedBroker = brokers.aggressive;
} else if (leadScore >= 45) {
  selectedBroker = brokers.balanced;
} else {
  selectedBroker = brokers.conservative;
}

return selectedBroker;
```

Then get the actual UUIDs by running:
```sql
SELECT id, name, personality_type FROM ai_brokers;
```

## SOLUTION 4: Reset and Populate Brokers

If the ai_brokers table is empty or corrupted:

```sql
-- Clear and repopulate brokers
TRUNCATE TABLE broker_conversations, broker_learning, broker_performance CASCADE;
DELETE FROM ai_brokers;

-- Insert fresh brokers
INSERT INTO ai_brokers (id, name, slug, personality_type, role, is_active, current_workload) VALUES
  (gen_random_uuid(), 'Michelle Chen', 'michelle-chen', 'aggressive', 'Senior Investment Specialist', true, 0),
  (gen_random_uuid(), 'Sarah Wong', 'sarah-wong', 'balanced', 'Mortgage Consultant', true, 0),
  (gen_random_uuid(), 'Grace Lim', 'grace-lim', 'conservative', 'First-Time Buyer Specialist', true, 0),
  (gen_random_uuid(), 'Rachel Tan', 'rachel-tan', 'balanced', 'Digital Native Advisor', true, 0),
  (gen_random_uuid(), 'Jasmine Lee', 'jasmine-lee', 'aggressive', 'Premium Property Expert', true, 0);

-- Verify they exist
SELECT id, name, personality_type FROM ai_brokers;
```

## Recommended Immediate Fix

Use **SOLUTION 2** (Direct Assignment) in your n8n node. It bypasses the function entirely and guarantees a broker will be selected.

After applying the fix, the "Create Assignment Records" node should work because it will have a valid broker_id to insert.