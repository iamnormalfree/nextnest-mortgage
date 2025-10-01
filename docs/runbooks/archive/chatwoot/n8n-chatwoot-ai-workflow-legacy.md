# ⚠️ DEPRECATED - Archived 2025-10-01

**This document has been superseded by**: `docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md (Part 4: n8n Workflow Setup)`

**Why archived**: Content consolidated into comprehensive guide for better maintenance.

**Original content preserved below for reference**:

---

# n8n Workflow for Chatwoot AI Bot with OpenAI

## Why n8n is Perfect for This

n8n gives you:
- Visual workflow builder (no coding)
- Built-in OpenAI integration
- Easy conversation memory management
- Error handling and retries
- Monitoring and logs
- Quick modifications without redeploying code

## Complete n8n Workflow Setup

### Workflow Overview
```
[Webhook Trigger] 
    ↓
[Filter: Only Customer Messages]
    ↓
[Get Conversation History from Chatwoot]
    ↓
[Extract Lead Form Data from Attributes]
    ↓
[Build OpenAI Prompt with Context]
    ↓
[OpenAI Chat Completion]
    ↓
[Check for Handoff Triggers]
    ↓
[Send Response to Chatwoot]
    ↓
[Update Conversation Attributes]
```

## Step-by-Step n8n Workflow Configuration

### 1. Webhook Node (Trigger)
```json
{
  "webhookMethod": "POST",
  "path": "chatwoot-ai-bot",
  "responseMode": "onReceived",
  "responseData": "firstEntryJson"
}
```
**Webhook URL**: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot`

### 2. Filter Node (Only Process Customer Messages)
```javascript
// Expression:
{{$json["event"] === "message_created" && 
  $json["message"]["message_type"] === "incoming" && 
  $json["message"]["sender"]["type"] !== "agent"}}
```

### 3. HTTP Request Node (Get Conversation History)
```json
{
  "method": "GET",
  "url": "={{$env.CHATWOOT_BASE_URL}}/api/v1/accounts/{{$env.CHATWOOT_ACCOUNT_ID}}/conversations/{{$json['conversation']['id']}}/messages",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "headers": {
    "Api-Access-Token": "={{$env.CHATWOOT_API_TOKEN}}"
  }
}
```

### 4. Code Node (Build Context with Memory)
```javascript
// Extract lead data and build context
const conversation = $input.first().json.conversation;
const currentMessage = $input.first().json.message.content;
const history = $input.all()[1].json.payload || [];

// Extract lead form data from custom attributes
const leadData = conversation.custom_attributes || {};
const messageCount = leadData.message_count || 0;

// Build conversation history for OpenAI (last 10 messages)
const conversationHistory = history
  .slice(-10)
  .map(msg => ({
    role: msg.message_type === 0 ? 'user' : 'assistant',
    content: msg.content
  }));

// Create system prompt with full context
const systemPrompt = `You are Sarah Wong, an expert mortgage broker in Singapore helping ${leadData.name || 'the customer'}.

CUSTOMER PROFILE:
- Name: ${leadData.name}
- Lead Score: ${leadData.lead_score}/100
- Loan Type: ${leadData.loan_type}
- Property: ${leadData.property_category}
- Monthly Income: S$${leadData.monthly_income}
- Employment: ${leadData.employment_type}
- Timeline: ${leadData.purchase_timeline}
- Messages Exchanged: ${messageCount}

CURRENT SINGAPORE RATES:
- 2-year fixed: 3.70% - 3.80%
- 3-year fixed: 3.60% - 3.70%
- Max loan: S$${(leadData.monthly_income * 0.55 * 12 * 25).toFixed(0)}

CONVERSATION STYLE:
- Professional yet friendly
- Use actual numbers from their profile
- Reference previous discussion points
- Build on what was already discussed
- Remember their concerns and preferences
- Suggest next steps based on conversation stage

IMPORTANT:
- This is message #${messageCount + 1} in our conversation
- Maintain continuity with previous messages
- Don't repeat information already provided
- Progress the conversation toward conversion`;

return {
  systemPrompt,
  conversationHistory,
  currentMessage,
  leadData,
  messageCount
};
```

### 5. OpenAI Node (Generate Response)
```json
{
  "resource": "chat",
  "operation": "complete",
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "={{$json.systemPrompt}}"
    },
    ...{{$json.conversationHistory}},
    {
      "role": "user", 
      "content": "={{$json.currentMessage}}"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 500
}
```

### 6. Code Node (Check Handoff Triggers)
```javascript
const userMessage = $input.first().json.currentMessage.toLowerCase();
const aiResponse = $input.first().json.message.content;
const leadData = $input.first().json.leadData;
const messageCount = $input.first().json.messageCount;

// Handoff trigger keywords
const handoffTriggers = [
  'speak to human', 'real person', 'human agent',
  'ready to proceed', 'apply now', 'sign up',
  'call me', 'phone number', 'contact me'
];

// Check for triggers
let shouldHandoff = false;
let handoffReason = '';

// Direct request for human
if (handoffTriggers.some(trigger => userMessage.includes(trigger))) {
  shouldHandoff = true;
  handoffReason = 'Customer requested human assistance';
}

// High-value lead after multiple messages
else if (messageCount > 8 && leadData.lead_score >= 80) {
  shouldHandoff = true;
  handoffReason = 'High-value lead ready for conversion';
}

// Complex situation
else if (userMessage.includes('divorce') || userMessage.includes('bankruptcy')) {
  shouldHandoff = true;
  handoffReason = 'Complex situation requiring specialist';
}

return {
  shouldHandoff,
  handoffReason,
  aiResponse: shouldHandoff 
    ? `I understand this is important. Let me connect you with a senior specialist who can assist you immediately. They'll be with you shortly.`
    : aiResponse,
  conversationId: $input.first().json.conversation.id
};
```

### 7. HTTP Request Node (Send Response to Chatwoot)
```json
{
  "method": "POST",
  "url": "={{$env.CHATWOOT_BASE_URL}}/api/v1/accounts/{{$env.CHATWOOT_ACCOUNT_ID}}/conversations/{{$json.conversationId}}/messages",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "headers": {
    "Api-Access-Token": "={{$env.CHATWOOT_API_TOKEN}}"
  },
  "body": {
    "content": "={{$json.aiResponse}}",
    "message_type": "outgoing",
    "private": false
  }
}
```

### 8. IF Node (Handle Handoff)
**Condition**: `{{$json.shouldHandoff === true}}`

#### 8a. HTTP Request Node (Change Status to Open)
```json
{
  "method": "PATCH",
  "url": "={{$env.CHATWOOT_BASE_URL}}/api/v1/accounts/{{$env.CHATWOOT_ACCOUNT_ID}}/conversations/{{$json.conversationId}}",
  "headers": {
    "Api-Access-Token": "={{$env.CHATWOOT_API_TOKEN}}"
  },
  "body": {
    "status": "open"
  }
}
```

#### 8b. HTTP Request Node (Add Internal Note)
```json
{
  "method": "POST",
  "url": "={{$env.CHATWOOT_BASE_URL}}/api/v1/accounts/{{$env.CHATWOOT_ACCOUNT_ID}}/conversations/{{$json.conversationId}}/messages",
  "headers": {
    "Api-Access-Token": "={{$env.CHATWOOT_API_TOKEN}}"
  },
  "body": {
    "content": "🤖➡️👨‍💼 AI Handoff: {{$json.handoffReason}}\nLead Score: {{$json.leadData.lead_score}}\nMessages: {{$json.messageCount}}",
    "message_type": "outgoing",
    "private": true
  }
}
```

### 9. HTTP Request Node (Update Message Count)
```json
{
  "method": "POST",
  "url": "={{$env.CHATWOOT_BASE_URL}}/api/v1/accounts/{{$env.CHATWOOT_ACCOUNT_ID}}/conversations/{{$json.conversationId}}/custom_attributes",
  "headers": {
    "Api-Access-Token": "={{$env.CHATWOOT_API_TOKEN}}"
  },
  "body": {
    "custom_attributes": {
      "message_count": "={{$json.messageCount + 1}}",
      "last_ai_response": "={{new Date().toISOString()}}",
      "handoff_triggered": "={{$json.shouldHandoff}}"
    }
  }
}
```

## Setting Up in n8n

### 1. Create Credentials
In n8n, add these credentials:
- **OpenAI API**: Your OpenAI API key
- **HTTP Header Auth**: For Chatwoot API token

### 2. Environment Variables
Add to n8n:
```
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=your-api-token
CHATWOOT_ACCOUNT_ID=1
```

### 3. Configure Chatwoot Bot
In Chatwoot:
1. Go to Settings → Agent Bots
2. Update webhook URL to: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot`

### 4. Test the Workflow
1. Send a test message in your chat
2. Watch n8n execution in real-time
3. Check conversation in Chatwoot

## Advantages of n8n Approach

### 1. Visual Debugging
- See each step's input/output
- Identify where issues occur
- Test individual nodes

### 2. Easy Modifications
- Change prompts without coding
- Adjust handoff rules visually
- Add new conditions easily

### 3. Built-in Features
- Automatic retries on failure
- Error notifications
- Execution history
- Performance monitoring

### 4. Memory Management
- Fetch conversation history
- Maintain context across messages
- Store session data in variables

## Example Conversation with Memory

**Message 1**: "Hi, I need help with a mortgage"
> AI: "Hello! I'm Sarah Wong. I see you're looking for a new purchase loan for a resale property. With your income of S$5,000, you could qualify for up to S$420,000. What specific aspect would you like to discuss?"

**Message 2**: "What are the rates?"
> AI: "Based on what we discussed, for your resale property purchase, current rates are:
> • 2-year fixed: 3.70% (recommended for your situation)
> • 3-year fixed: 3.60%
> With a S$350,000 loan, your monthly payment would be around S$1,420."

**Message 3**: "That sounds good. How do I apply?"
> AI: "Excellent! Since you're ready to move forward, let me connect you with a senior specialist who can process your application immediately. They'll help you lock in the 3.70% rate we discussed."
> [Triggers handoff]

## Testing Memory Persistence

To verify memory is working:
1. Start a conversation
2. Mention specific details (name, amount, preference)
3. In next message, ask about "what we discussed"
4. AI should reference previous context
5. Check if it avoids repeating information

## Next Steps

1. **Import Workflow**: I can create a JSON file you can import directly into n8n
2. **Test with Real Data**: Use actual lead form submissions
3. **Monitor Performance**: Track response quality and handoff rates
4. **Optimize Prompts**: Refine based on real conversations