# n8n Workflow Fixes - Convert PostgreSQL to HTTP Nodes

## Issue 1: Fix Assign Best Broker 2 Query

The `assign_best_broker` function returns the broker ID, and we need to fetch the broker details. Also note that the `role` column doesn't exist in the schema.

**Current Query (WRONG):**
```sql
SELECT 
  b.*,
  assign_best_broker(...) as assigned_broker_id
FROM ai_brokers b
WHERE b.id = assign_best_broker(...)
```

**Fixed Query (WORKING):**
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

## Issue 2: Convert All PostgreSQL Nodes to HTTP Requests

### Node 1: Execute a SQL query2 (Check Broker Assignment)
**Replace with HTTP Request node:**

```javascript
// Node Type: HTTP Request
// Method: POST
// URL: https://[YOUR-PROJECT-REF].supabase.co/rest/v1/rpc/check_broker_assignment

// Headers:
{
  "apikey": "{{ $vars.SUPABASE_ANON_KEY }}",
  "Content-Type": "application/json"
}

// Body (JSON):
{
  "conversation_id_param": {{ $json["conversationId"] || 0 }}
}
```

**First, create this function in Supabase SQL Editor:**
```sql
CREATE OR REPLACE FUNCTION check_broker_assignment(conversation_id_param INTEGER)
RETURNS TABLE(
  hasbroker BOOLEAN,
  conversation_id INTEGER,
  broker_id UUID,
  status TEXT,
  broker_name TEXT,
  personality_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN bc.broker_id IS NOT NULL THEN true ELSE false END as hasbroker,
    COALESCE(conversation_id_param, 0) as conversation_id,
    bc.broker_id,
    bc.status,
    b.name as broker_name,
    b.personality_type
  FROM (SELECT COALESCE(conversation_id_param, 0) as conv_id) as input
  LEFT JOIN broker_conversations bc
    ON bc.conversation_id = input.conv_id
    AND bc.status = 'active'
  LEFT JOIN ai_brokers b
    ON bc.broker_id = b.id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

### Node 2: Assign Best Broker 2 (Keep as PostgreSQL)
**Since the assign_best_broker function is working, keep using PostgreSQL node with the fixed query above.**

**Alternative: If you want to convert to HTTP for reliability:**

First create an RPC function in Supabase:
```sql
CREATE OR REPLACE FUNCTION get_assigned_broker(
  p_lead_score INTEGER,
  p_loan_type TEXT,
  p_property_type TEXT,
  p_monthly_income NUMERIC,
  p_timeline TEXT
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  slug VARCHAR(50),
  photo_url VARCHAR(500),
  personality_type VARCHAR(50),
  voice_description TEXT,
  communication_style TEXT,
  approach_style TEXT,
  favorite_phrases TEXT[],
  speaking_speed DECIMAL(3,2),
  voice_model VARCHAR(50),
  background TEXT,
  specializations TEXT[],
  is_active BOOLEAN,
  current_workload INTEGER
) AS $$
BEGIN
  RETURN QUERY
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
  WHERE b.id = assign_best_broker(
    p_lead_score,
    p_loan_type,
    p_property_type,
    p_monthly_income,
    p_timeline
  );
END;
$$ LANGUAGE plpgsql;
```

Then use HTTP Request node:
```javascript
// Node Type: HTTP Request
// Method: POST
// URL: https://[YOUR-PROJECT-REF].supabase.co/rest/v1/rpc/get_assigned_broker

// Headers:
{
  "apikey": "{{ $vars.SUPABASE_ANON_KEY }}",
  "Content-Type": "application/json"
}

// Body (JSON):
{
  "p_lead_score": {{ $('Extract Customer Profile').item.json.leadScore }},
  "p_loan_type": "{{ $('Extract Customer Profile').item.json.loanType }}",
  "p_property_type": "{{ $('Extract Customer Profile').item.json.propertyType }}",
  "p_monthly_income": {{ $('Extract Customer Profile').item.json.monthlyIncome }},
  "p_timeline": "{{ $('Extract Customer Profile').item.json.timeline }}"
}
```

### Node 3: Create Assignment Records (FIXED - PostgreSQL Version)
**If keeping PostgreSQL node, use this query:**

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

**OR Replace with HTTP Request node for better reliability:**

```javascript
// Node Type: HTTP Request
// Method: POST
// URL: https://[YOUR-PROJECT-REF].supabase.co/rest/v1/broker_conversations

// Headers:
{
  "apikey": "{{ $vars.SUPABASE_SERVICE_KEY }}",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}

// Body (JSON):
{
  "conversation_id": {{ $('Extract Customer Profile').item.json.conversationId }},
  "broker_id": "{{ $('Assign Best Broker 2').first().json.id }}",
  "contact_id": {{ $('Extract Customer Profile').item.json.contactId }},
  "customer_name": "{{ $('Extract Customer Profile').item.json.name }}",
  "customer_email": "{{ $('Extract Customer Profile').item.json.email }}",
  "customer_phone": "{{ $('Extract Customer Profile').item.json.phone }}",
  "lead_score": {{ $('Extract Customer Profile').item.json.leadScore }},
  "loan_type": "{{ $('Extract Customer Profile').item.json.loanType }}",
  "property_type": "{{ $('Extract Customer Profile').item.json.propertyType }}",
  "monthly_income": {{ $('Extract Customer Profile').item.json.monthlyIncome }},
  "loan_amount": {{ $('Extract Customer Profile').item.json.loanAmount || 0 }},
  "timeline": "{{ $('Extract Customer Profile').item.json.timeline }}",
  "assignment_method": "auto",
  "assignment_reason": "Best match based on lead score and profile",
  "status": "active"
}
```

### Node 4: Execute a SQL query3 (Get Broker Details)
**Replace with HTTP Request node:**

```javascript
// Node Type: HTTP Request
// Method: GET
// URL: https://[YOUR-PROJECT-REF].supabase.co/rest/v1/ai_brokers

// Headers:
{
  "apikey": "{{ $vars.SUPABASE_ANON_KEY }}",
  "Content-Type": "application/json"
}

// Query Parameters:
select=*
id=eq.{{ $json["broker_id"] }}
```

### Node 5: Update Metrics
**Replace with two HTTP Request nodes:**

**5a. Update Conversation Metrics:**
```javascript
// Node Type: HTTP Request
// Method: PATCH
// URL: https://[YOUR-PROJECT-REF].supabase.co/rest/v1/broker_conversations

// Headers:
{
  "apikey": "{{ $vars.SUPABASE_SERVICE_KEY }}",
  "Content-Type": "application/json"
}

// Query Parameters:
conversation_id=eq.{{ $('Check Handoff Triggers').first().json.conversationId }}

// Body (JSON):
{
  "messages_exchanged": {{ $('Check Handoff Triggers').first().json.messageCount }},
  "broker_messages": {{ $('Check Handoff Triggers').first().json.messageCount }},
  "last_message_at": "{{ new Date().toISOString() }}",
  "handoff_triggered": {{ $('Check Handoff Triggers').first().json.shouldHandoff }},
  "handoff_reason": "{{ $('Check Handoff Triggers').first().json.handoffReason }}",
  "status": "{{ $('Check Handoff Triggers').first().json.shouldHandoff ? 'handoff_requested' : 'active' }}"
}
```

**5b. Update Broker Metrics:**
```javascript
// Node Type: HTTP Request
// Method: PATCH
// URL: https://[YOUR-PROJECT-REF].supabase.co/rest/v1/ai_brokers

// Headers:
{
  "apikey": "{{ $vars.SUPABASE_SERVICE_KEY }}",
  "Content-Type": "application/json"
}

// Query Parameters:
id=eq.{{ $('Check Handoff Triggers').first().json.brokerId }}

// Body (JSON):
{
  "total_messages_sent": {{ $('Get Current Broker Stats').first().json.total_messages_sent + 1 }},
  "last_active_at": "{{ new Date().toISOString() }}"
}
```

## Setting up n8n Variables

In n8n, go to Variables and add:
- `SUPABASE_URL`: https://[YOUR-PROJECT-REF].supabase.co
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_KEY`: Your Supabase service key

## Complete Fix Summary

1. **Add Variables** to n8n for Supabase keys
2. **Create the check_broker_assignment function** in Supabase
3. **Add "Calculate Broker Assignment" Code node** before broker assignment
4. **Replace all 5 PostgreSQL nodes** with HTTP Request nodes
5. **Update the Create Assignment Records** to use the calculated broker_id

## Testing After Changes

1. Send test webhook with conversation ID 456
2. Check each node execution:
   - Should see broker_id as proper UUID, not 'null'
   - HTTP requests should succeed without credential refresh issues
   - Assignment should be recorded in database

## Get Broker UUIDs

Run this in Supabase SQL Editor to get your broker IDs:
```sql
SELECT id, name, personality_type FROM ai_brokers;
```

Use these UUIDs in the brokerMap in the Calculate Broker Assignment node.