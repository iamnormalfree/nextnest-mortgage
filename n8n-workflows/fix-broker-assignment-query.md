# Fix Broker Assignment Query - Return Broker Details

## The Problem
After updating the `assign_best_broker` function, it returns a UUID, but your query is not fetching the actual broker details. It's just returning `{success: true}`.

## Solution: Update "Assign Best Broker 2" Query

Replace your current query with this one that actually fetches the broker details:

### Option 1: Two-Step Query (Recommended) - CORRECTED
```sql
-- First get the broker ID, then fetch full details
WITH assigned_broker AS (
  SELECT assign_best_broker(
    {{ $('Extract Customer Profile').item.json.leadScore }},
    '{{ $('Extract Customer Profile').item.json.loanType }}',
    '{{ $('Extract Customer Profile').item.json.propertyType }}',
    {{ $('Extract Customer Profile').item.json.monthlyIncome }},
    '{{ $('Extract Customer Profile').item.json.timeline }}'
  ) as broker_id
)
SELECT 
  b.id,
  b.name,
  b.slug,
  b.photo_url,
  b.personality_type,
  b.voice_description,
  b.communication_style,
  b.approach_style,
  b.favorite_phrases,
  b.speaking_speed,
  b.voice_model,
  b.background,
  b.specializations,
  b.is_active,
  b.current_workload
FROM ai_brokers b
JOIN assigned_broker ab ON b.id = ab.broker_id
WHERE ab.broker_id IS NOT NULL;
```

### Option 2: Direct Query - CORRECTED
```sql
SELECT 
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
  background,
  specializations,
  is_active,
  current_workload
FROM ai_brokers
WHERE id = (
  SELECT assign_best_broker(
    {{ $('Extract Customer Profile').item.json.leadScore }},
    '{{ $('Extract Customer Profile').item.json.loanType }}',
    '{{ $('Extract Customer Profile').item.json.propertyType }}',
    {{ $('Extract Customer Profile').item.json.monthlyIncome }},
    '{{ $('Extract Customer Profile').item.json.timeline }}'
  )
);
```

### Option 3: With Fallback (Most Robust) - CORRECTED
```sql
-- Get assigned broker with fallback to any available broker
WITH assignment AS (
  SELECT assign_best_broker(
    {{ $('Extract Customer Profile').item.json.leadScore }},
    '{{ $('Extract Customer Profile').item.json.loanType }}',
    '{{ $('Extract Customer Profile').item.json.propertyType }}',
    {{ $('Extract Customer Profile').item.json.monthlyIncome }},
    '{{ $('Extract Customer Profile').item.json.timeline }}'
  ) as broker_id
)
SELECT 
  COALESCE(assigned.id, fallback.id) as broker_id,
  COALESCE(assigned.id, fallback.id) as id,
  COALESCE(assigned.name, fallback.name) as name,
  COALESCE(assigned.slug, fallback.slug) as slug,
  COALESCE(assigned.photo_url, fallback.photo_url) as photo_url,
  COALESCE(assigned.personality_type, fallback.personality_type) as personality_type,
  COALESCE(assigned.voice_description, fallback.voice_description) as voice_description,
  COALESCE(assigned.communication_style, fallback.communication_style) as communication_style,
  COALESCE(assigned.approach_style, fallback.approach_style) as approach_style,
  COALESCE(assigned.favorite_phrases, fallback.favorite_phrases) as favorite_phrases,
  COALESCE(assigned.speaking_speed, fallback.speaking_speed) as speaking_speed,
  COALESCE(assigned.voice_model, fallback.voice_model) as voice_model,
  COALESCE(assigned.background, fallback.background) as background,
  COALESCE(assigned.specializations, fallback.specializations) as specializations,
  COALESCE(assigned.is_active, fallback.is_active) as is_active,
  COALESCE(assigned.current_workload, fallback.current_workload) as current_workload
FROM assignment
LEFT JOIN ai_brokers assigned ON assigned.id = assignment.broker_id
LEFT JOIN LATERAL (
  SELECT * FROM ai_brokers 
  WHERE is_active = true 
  ORDER BY current_workload ASC 
  LIMIT 1
) fallback ON assignment.broker_id IS NULL;
```

## Then Update "Create Assignment Records" Query

Change the broker_id line to use the correct field:

```sql
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
) VALUES (
  gen_random_uuid(),
  {{ $('Extract Customer Profile').item.json.conversationId }},
  '{{ $('Assign Best Broker 2').first().json.id }}',  -- Use .first().json.id
  {{ $('Extract Customer Profile').item.json.contactId }},
  '{{ $('Extract Customer Profile').item.json.name }}',
  '{{ $('Extract Customer Profile').item.json.email }}',
  '{{ $('Extract Customer Profile').item.json.phone }}',
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
)
RETURNING *;
```

## IMPORTANT: Columns that DON'T exist in ai_brokers table
Based on the actual schema, these columns do NOT exist and should NOT be used:
- `role` - This column doesn't exist in the table

## Columns that DO exist in ai_brokers table:
- `id`, `name`, `slug`
- `age`, `years_experience`, `background`, `education`, `specializations`, `languages`
- `photo_url`, `avatar_style`, `voice_description`, `voice_model`, `speaking_speed`
- `personality_type`, `communication_style`, `approach_style`
- `strengths`, `weaknesses`, `favorite_phrases`, `conversation_starters`, `closing_techniques`
- `is_active`, `current_workload`
- Performance metrics: `total_conversations`, `successful_handoffs`, etc.

## Alternative: Add IF Node to Check

Add an IF node between "Assign Best Broker 2" and "Create Assignment Records":

**IF Node Conditions:**
- Check if `{{ $json.id }}` exists
- Check if `{{ $json.id }}` is not equal to "undefined"

**True branch:** Continue to Create Assignment Records
**False branch:** Skip or use a default broker

## Debug: Check What's Being Returned

Add a Code node after "Assign Best Broker 2" to inspect:

```javascript
// Debug node
const input = $input.first().json;
console.log('Broker assignment result:', input);

// Check what fields are available
if (input.id) {
  return {
    broker_id: input.id,
    broker_name: input.name,
    debug: 'Broker found successfully'
  };
} else {
  return {
    broker_id: null,
    error: 'No broker assigned',
    debug: input
  };
}
```

## Quick Test in Supabase

Run this to verify the function and query work:

```sql
-- Test the complete flow
WITH test_assignment AS (
  SELECT assign_best_broker(85, 'new_purchase', 'resale', 8000, 'urgent') as broker_id
)
SELECT 
  b.*,
  ta.broker_id as assigned_id
FROM test_assignment ta
LEFT JOIN ai_brokers b ON b.id = ta.broker_id;

-- Should return broker details, not just {success: true}
```

Use **Option 1** (Two-Step Query) - it's the most reliable and will definitely return the broker details needed for the next node.