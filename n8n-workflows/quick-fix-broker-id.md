# Quick Fix for broker_id NULL Error

## Immediate Fix (Without Converting to HTTP)

### 1. Fix "Assign Best Broker 2" Node Query

**Change the SQL query to:**
```sql
SELECT 
  id as broker_id,
  id,
  name,
  slug,
  photo_url,
  personality_type,
  voice_description,
  communication_style,
  approach_style,
  favorite_phrases,
  speaking_speed,
  voice_model,
  role,
  is_active,
  current_workload
FROM ai_brokers
WHERE id = assign_best_broker(
  {{ $('Extract Customer Profile').item.json.leadScore }},
  '{{ $('Extract Customer Profile').item.json.loanType }}',
  '{{ $('Extract Customer Profile').item.json.propertyType }}',
  {{ $('Extract Customer Profile').item.json.monthlyIncome }},
  '{{ $('Extract Customer Profile').item.json.timeline }}'
)
LIMIT 1;
```

### 2. Fix "Create Assignment Records" Node

**Change the broker_id line from:**
```sql
'{{ $('Assign Best Broker 2').item.json.assigned_broker_id }}'
```

**To:**
```sql
'{{ $('Assign Best Broker 2').item.json.broker_id || $('Assign Best Broker 2').item.json.id }}'
```

### 3. Add NULL Check in Create Assignment Records

**Complete updated query:**
```sql
-- Only insert if we have a valid broker_id
INSERT INTO broker_conversations (
  id,
  conversation_id,
  broker_id,
  contact_id,
  customer_name,
  customer_email,
  customer_phone,
  lead_score,
  loan_type,
  property_type,
  monthly_income,
  loan_amount,
  timeline,
  assignment_method,
  assignment_reason,
  status,
  assigned_at
) 
SELECT
  gen_random_uuid(),
  {{ $('Extract Customer Profile').item.json.conversationId }},
  '{{ $('Assign Best Broker 2').item.json.id }}',
  {{ $('Extract Customer Profile').item.json.contactId }},
  '{{ $('Extract Customer Profile').item.json.name }}',
  '{{ $('Extract Customer Profile').item.json.email || 'NULL' }}',
  '{{ $('Extract Customer Profile').item.json.phone || 'NULL' }}',
  {{ $('Extract Customer Profile').item.json.leadScore }},
  '{{ $('Extract Customer Profile').item.json.loanType }}',
  '{{ $('Extract Customer Profile').item.json.propertyType }}',
  {{ $('Extract Customer Profile').item.json.monthlyIncome }},
  {{ $('Extract Customer Profile').item.json.loanAmount || 0 }},
  '{{ $('Extract Customer Profile').item.json.timeline }}',
  'auto',
  'Best match based on lead score and profile',
  'active',
  NOW()
WHERE '{{ $('Assign Best Broker 2').item.json.id }}' IS NOT NULL
  AND '{{ $('Assign Best Broker 2').item.json.id }}' != 'null'
  AND '{{ $('Assign Best Broker 2').item.json.id }}' != ''
RETURNING *;
```

## Alternative: Add Fallback Broker

If assign_best_broker returns NULL, use a default broker:

```sql
-- In Assign Best Broker 2 node
SELECT 
  COALESCE(
    (SELECT * FROM ai_brokers WHERE id = assign_best_broker(
      {{ $('Extract Customer Profile').item.json.leadScore }},
      '{{ $('Extract Customer Profile').item.json.loanType }}',
      '{{ $('Extract Customer Profile').item.json.propertyType }}',
      {{ $('Extract Customer Profile').item.json.monthlyIncome }},
      '{{ $('Extract Customer Profile').item.json.timeline }}'
    )),
    (SELECT * FROM ai_brokers WHERE personality_type = 'balanced' LIMIT 1)
  ) as broker;
```

## Debug: Check if assign_best_broker Function Works

Run this in Supabase to test the function:
```sql
-- Test the function with sample data
SELECT assign_best_broker(
  85,           -- lead_score
  'refinancing', -- loan_type
  'private_condo', -- property_type
  12000,        -- monthly_income
  'urgent'      -- timeline
);

-- Should return a UUID, not NULL
-- If it returns NULL, check if ai_brokers table has data:
SELECT id, name, personality_type, is_active FROM ai_brokers;
```

## If Function Returns NULL

The function might be returning NULL because:
1. No brokers in the ai_brokers table
2. All brokers have is_active = false
3. All brokers have current_workload >= 10

Fix by running:
```sql
-- Ensure brokers exist and are active
UPDATE ai_brokers SET is_active = true, current_workload = 0;

-- Check the function logic
SELECT * FROM ai_brokers 
WHERE is_active = true 
AND current_workload < 10;
```