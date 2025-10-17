---
title: n8n-chatwoot-ai-broker-fix-session
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-13
---

# N8N Chatwoot AI Broker Assignment Fix Session

## Session Date: 2025-09-13

## Problem Identified
The n8n workflow `chatwoot-conversation-enhancer.json` was assigning conversations to incorrect brokers. The workflow had hardcoded placeholder broker names that didn't match the actual AI brokers in the Supabase database.

## Current Status: PAUSED - Ready to Resume

### What We Discovered

**Actual AI Brokers in Supabase (5 active brokers):**
1. **Grace Lim** (ID: 80fc7106-f788-43d1-9530-2bcfa5bcca33)
   - Personality: conservative
   - Style: No-pressure consultation, relationship-focused
   - Approach: Takes time to understand concerns, never rushes

2. **Jasmine Lee** (ID: f6ce6684-0d02-4b4c-8058-567a5c8889fe)
   - Personality: networker
   - Style: Leverages exclusive connections and insider information
   - Approach: Name-drops developers, mentions off-market deals

3. **Michelle Chen** (ID: 84372c72-8ed5-4bde-bbf9-567b117acffa)
   - Personality: aggressive
   - Style: Direct and opportunity-focused, creates urgency
   - Approach: Identifies exclusive deals, emphasizes time-sensitivity

4. **Rachel Tan** (ID: 0da6f209-6e3d-43e8-b75e-1d4d6687813f) ⭐ **USER MENTIONED THIS ONE**
   - Personality: modern
   - Style: Data-focused with visual comparisons, transparency-first
   - Approach: Shows calculations, uses charts, provides spreadsheets

5. **Sarah Wong** (ID: ff765326-a1f0-4293-aa1b-386805997fc1)
   - Personality: balanced
   - Style: Educational and supportive, builds trust through expertise
   - Approach: Explains complex terms simply, provides multiple options

**Outdated Brokers in N8N Workflow:**
- Marcus Chen (doesn't exist)
- Sarah Wong (exists but different personality)
- Jasmine Lee (exists but different approach)

### N8N Workflow Issues Fixed So Far

**✅ COMPLETED:**
1. **Data Flow Issues**: Fixed references to conversation data throughout workflow nodes
2. **"Generate User Message" node**: Updated to reference correct conversation data
3. **"Generate Broker Message" node**: Updated to reference correct conversation data
4. **Workflow Execution**: Successfully tested end-to-end flow

**🔄 IN PROGRESS - NEEDS COMPLETION:**

#### 1. "Determine Labels" Node (Line 195-205)
**CURRENT CODE** (outdated):
```javascript
const AI_BROKERS = {
  'Marcus Chen': { label: 'AI-Broker-Marcus', color: '#FF6B6B' },
  'Sarah Wong': { label: 'AI-Broker-Sarah', color: '#4ECDC4' },
  'Jasmine Lee': { label: 'AI-Broker-Jasmine', color: '#45B7D1' }
};
```

**NEEDS UPDATE TO**:
```javascript
const AI_BROKERS = {
  'Grace Lim': { label: 'AI-Broker-Grace-Lim', color: '#96CEB4' },
  'Jasmine Lee': { label: 'AI-Broker-Jasmine-Lee', color: '#45B7D1' },
  'Michelle Chen': { label: 'AI-Broker-Michelle-Chen', color: '#FF6B6B' },
  'Rachel Tan': { label: 'AI-Broker-Rachel-Tan', color: '#4ECDC4' },
  'Sarah Wong': { label: 'AI-Broker-Sarah-Wong', color: '#DDA0DD' }
};
```

#### 2. "Assign to User" Node (Line 125)
**CURRENT CODE** (hardcoded to User ID 1):
```json
"jsonBody": "{\n  \"assignee_id\": 1\n}"
```

**NEEDS UPDATE TO DYNAMIC ASSIGNMENT**:
```javascript
// Need to find Chatwoot User IDs first
const conversation = $('Split into Items').item.json;
const brokerName = conversation.custom_attributes?.ai_broker_name;

const brokerUserIds = {
  'Grace Lim': [CHATWOOT_USER_ID],     // Need to find
  'Jasmine Lee': [CHATWOOT_USER_ID],   // Need to find
  'Michelle Chen': [CHATWOOT_USER_ID], // Need to find
  'Rachel Tan': [CHATWOOT_USER_ID],    // Need to find
  'Sarah Wong': [CHATWOOT_USER_ID]     // Need to find
};

const assigneeId = brokerUserIds[brokerName] || 1;
```

#### 3. "Generate Broker Message" Node (Line 282)
**NEEDS COMPLETE REWRITE** with personality-based messages:

```javascript
const brokerIntros = {
  'Grace Lim': `Hello ${userName}! 😊\n\nI'm Grace Lim, and I'd love to help you explore your mortgage options at a comfortable pace.\n\n[Conservative, no-pressure approach]`,
  
  'Jasmine Lee': `Hi ${userName}! 🎯\n\nI'm Jasmine Lee, and I have some exclusive opportunities that might interest you.\n\n[Networker approach with insider connections]`,
  
  'Michelle Chen': `Hi ${userName}! ⚡\n\nI'm Michelle Chen - I've spotted some time-sensitive opportunities for your ${propertyType} search!\n\n[Aggressive, urgency-focused approach]`,
  
  'Rachel Tan': `Hello ${userName}! 📊\n\nI'm Rachel Tan. Let me show you the data and calculations for your mortgage options.\n\n[Modern, data-focused approach]`,
  
  'Sarah Wong': `Hello ${userName}! 👋\n\nI'm Sarah Wong, and I'm here to guide you through your mortgage journey step by step.\n\n[Balanced, educational approach]`
};
```

### Critical Missing Information

**🚨 BLOCKER: Need Chatwoot User IDs**

To complete the fix, we need to find the **Chatwoot User IDs** for each AI broker agent:
- Go to Chatwoot Dashboard → Settings → Agents
- Find each AI broker agent
- Note their User ID numbers
- Update the `brokerUserIds` mapping in "Assign to User" node

### Files Modified This Session

1. **`C:\Users\HomePC\Desktop\Code\NextNest\n8n-workflows\chatwoot-conversation-enhancer.json`**
   - Fixed "Generate User Message" node (line 239)
   - Fixed "Generate Broker Message" node to reference correct data source

2. **`C:\Users\HomePC\Desktop\Code\NextNest\scripts\get-ai-brokers.js`** (NEW)
   - Script to query Supabase for actual AI broker data
   - Provides mappings for n8n workflow updates

### Test Results From This Session

**✅ Successful Workflow Execution:**
- Conversation 75: Successfully processed
- Labels added: ["AI-Broker-Marcus", "Property-EC"] 
- User message created (ID: 399)
- Broker message created (ID: 400)
- BUT: Still using outdated "Marcus Chen" instead of actual brokers

### Next Steps to Complete

1. **Find Chatwoot User IDs** for all 5 AI brokers
2. **Update "Determine Labels" node** with correct AI_BROKERS mapping
3. **Update "Assign to User" node** with dynamic broker assignment logic
4. **Update "Generate Broker Message" node** with personality-based intro messages
5. **Test workflow** with actual broker assignment (Rachel Tan specifically)
6. **Verify in Chatwoot** that conversations are assigned to correct broker agents

### Development Environment
- Site running on: `http://localhost:3004`
- N8N workflow file: `n8n-workflows/chatwoot-conversation-enhancer.json`
- Supabase credentials: Available in `scripts/test-supabase-connection.js`

### Key Learning
The workflow was functionally working but using placeholder data. The real fix requires mapping the actual Supabase AI broker data to the corresponding Chatwoot User IDs for proper agent assignment.

**Resume Point:** Get Chatwoot User IDs and complete the 3 remaining node updates above.