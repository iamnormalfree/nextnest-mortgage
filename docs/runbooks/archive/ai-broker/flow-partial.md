> **⚠️ MERGED**: This partial guide is now part of a comprehensive document.
> **Use instead**: [AI Broker Complete Guide](../AI_BROKER_COMPLETE_GUIDE.md)
> **Archived**: 2025-10-01
> **Reason**: Consolidated to reduce overlap and improve maintainability

[Original content below]
---


# Complete AI Broker Flow: From Form to Chat

## 🎯 Overview
This document walks through the complete flow from lead form submission to chatting with an AI broker persona.

## 📊 Flow Diagram

```
[User Fills Form] 
    ↓
[Step 1: Basic Info] → [Step 2: Property Details] → [Step 3: Financial Info]
    ↓
[Form Submission]
    ↓
[/api/chatwoot-conversation endpoint]
    ↓
[Create Chatwoot Conversation with Attributes]
    ↓
[Redirect to /chat?conversation={id}]
    ↓
[Chat Interface Opens]
    ↓
[Chatwoot Webhook → n8n]
    ↓
[n8n Assigns AI Broker Based on Lead Score]
    ↓
[OpenAI Generates Response with Persona]
    ↓
[Message Sent Back to Chat]
    ↓
[User Sees AI Broker Response]
```

## 🔄 Detailed Step-by-Step Flow

### Step 1: Lead Form Completion
**URL**: `http://localhost:3004/`

1. User fills progressive form:
   - **Gate 1**: Name, Email, Phone
   - **Gate 2**: Loan Type, Property Details
   - **Gate 3**: Income, Employment, Commitments

2. Lead score calculated based on:
   - Income level
   - Property value
   - Employment stability
   - Loan-to-value ratio

### Step 2: Form Submission Processing
**Endpoint**: `/api/chatwoot-conversation`

When user completes Step 3:

```javascript
// Form data sent to API
{
  formData: {
    name: "John Doe",
    email: "john@example.com",
    phone: "91234567",
    loanType: "new_purchase",
    propertyPrice: 1500000,
    actualIncomes: [8000],
    employmentType: "employed",
    // ... other fields
  },
  sessionId: "session_xyz",
  leadScore: 85  // Calculated score
}
```

### Step 3: Chatwoot Conversation Creation
**What happens in `/api/chatwoot-conversation`**:

1. **Contact Creation/Update**:
   ```javascript
   // Creates or updates contact in Chatwoot
   const contact = await chatwootClient.createOrUpdateContact({
     name: "John Doe",
     email: "john@example.com",
     phone: "+6591234567"
   })
   ```

2. **Conversation Creation with Broker Attributes**:
   ```javascript
   // Creates conversation with AI broker assignment data
   const conversation = await chatwootClient.createConversation({
     contact_id: contact.id,
     custom_attributes: {
       // Core broker assignment attributes
       lead_score: 85,
       loan_type: "new_purchase",
       property_category: "resale",
       monthly_income: 8000,
       purchase_timeline: "soon",
       
       // Triggers n8n workflow
       status: "bot",  // CRITICAL: This triggers the AI bot
       
       // Broker assignment
       broker_persona: "aggressive",  // Based on score
       ai_broker_name: "Michelle Chen"
     }
   })
   ```

3. **Initial Message Sent**:
   - Personalized greeting from assigned broker
   - Based on lead score and profile

### Step 4: Redirect to Chat
**URL**: `/chat?conversation={conversationId}`

User is redirected to chat interface with:
- Conversation ID in URL
- Widget configuration
- Broker profile displayed

### Step 5: n8n Workflow Activation
**Webhook URL**: `https://your-n8n-instance.railway.app/webhook/chatwoot-ai-broker`

When conversation status is "bot", n8n workflow:

1. **Receives Webhook** from Chatwoot:
   ```json
   {
     "event": "conversation_created",
     "conversation": {
       "id": 123,
       "custom_attributes": {
         "lead_score": 85,
         "status": "bot"
       }
     }
   }
   ```

2. **Assigns Broker** based on lead score:
   - Score 85+ → Michelle Chen or Jasmine Lee
   - Score 70-84 → Rachel Tan
   - Score 50-69 → Sarah Wong
   - Score <50 → Grace Lim

3. **Queries Supabase** for:
   - Broker profile and personality
   - Previous conversation history
   - Learning data and successful phrases

### Step 6: AI Response Generation
**n8n → OpenAI API**

1. **System Prompt** with broker persona:
   ```
   You are Michelle Chen, an aggressive investment property specialist.
   - Personality: Direct, results-driven, time-conscious
   - Speaking style: Professional but pushy, uses urgency
   - Goal: Convert high-value leads quickly
   - Include occasional Singlish: "Wah, your income very solid!"
   ```

2. **Context Included**:
   - Lead form data
   - Lead score and analysis
   - Conversation history
   - Property market data

3. **Response Generated** by GPT-3.5/4

### Step 7: Message Delivery
**n8n → Chatwoot → User**

1. **n8n sends to Chatwoot API**:
   ```javascript
   POST /api/v1/accounts/{account}/conversations/{id}/messages
   {
     content: "Hi John! I'm Michelle Chen...",
     message_type: "outgoing",
     private: false
   }
   ```

2. **User sees in chat**:
   - Broker profile with photo
   - Typing indicator
   - AI-generated response
   - Quick action buttons

### Step 8: Ongoing Conversation
**User ↔ AI Broker Loop**

1. **User sends message** → Chatwoot webhook → n8n
2. **n8n processes** with context and persona
3. **OpenAI generates** contextual response
4. **Response sent back** to user

### Step 9: Handoff Triggers
**When to transfer to human**:

Automatic triggers in n8n:
- User says: "speak to human", "real person", "agent"
- User says: "ready to apply", "let's proceed"
- High engagement: 7+ messages with score 80+
- Frustration detected: negative sentiment
- Complex situation: divorce, bankruptcy mentioned

When triggered:
1. n8n changes conversation status from "bot" to "open"
2. Sends internal note about handoff reason
3. Human agent receives notification
4. Conversation continues with human

## 🔧 Configuration Requirements

### 1. Environment Variables
```env
# Chatwoot
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=your-chatwoot-api-token
CHATWOOT_ACCOUNT_ID=your-account-id
CHATWOOT_INBOX_ID=your-inbox-id
CHATWOOT_WEBSITE_TOKEN=your-website-token

# OpenAI (in n8n)
OPENAI_API_KEY=your-openai-api-key

# Supabase (in n8n)
DATABASE_URL=your-database-connection-string
```

⚠️ **Security Note**: Never commit actual credentials to version control. Use environment-specific configuration files that are gitignored.

### 2. n8n Workflow Setup
1. Import `n8n-workflows/ai-broker-persona-workflow.json`
2. Update credentials:
   - PostgreSQL (Supabase)
   - Chatwoot API
   - OpenAI API
3. Activate workflow
4. Copy webhook URL

### 3. Chatwoot Bot Configuration
1. Go to Settings → Agent Bots
2. Edit "NextNest AI Broker"
3. Set Outgoing URL to n8n webhook
4. Ensure bot is assigned to inbox

## 🧪 Testing the Flow

### Test Case 1: High-Value Lead
1. Fill form with:
   - Income: $15,000/month
   - Property: $2,000,000 condo
   - Employment: Stable
2. Expected: Michelle Chen or Jasmine Lee assigned
3. Verify: Aggressive, investment-focused responses

### Test Case 2: First-Time Buyer
1. Fill form with:
   - Income: $5,000/month
   - Property: $500,000 HDB
   - Employment: Recently started
2. Expected: Sarah Wong assigned
3. Verify: Balanced, educational responses

### Test Case 3: Conservative Buyer
1. Fill form with:
   - Income: $3,500/month
   - Property: $400,000 HDB
   - Age: 55+
2. Expected: Grace Lim assigned
3. Verify: Conservative, careful responses

## 🚨 Troubleshooting

### Issue: No AI Response
1. Check n8n workflow is Active
2. Verify webhook URL in Chatwoot bot
3. Check conversation has `status: "bot"`
4. Review n8n execution logs

### Issue: Wrong Broker Assigned
1. Check lead score calculation
2. Verify broker assignment logic in n8n
3. Review Supabase broker availability

### Issue: No Handoff
1. Verify handoff triggers in n8n
2. Check conversation status changes
3. Ensure human agents are available

## 📊 Monitoring Points

### n8n Metrics
- Workflow execution success rate
- Average response time
- OpenAI API usage
- Error rates

### Chatwoot Metrics
- Conversation creation rate
- Message delivery success
- Handoff completion rate
- Agent response time

### Business Metrics
- Lead score distribution
- Broker assignment accuracy
- Conversion rates by broker
- Handoff to application ratio

## ✅ Success Indicators

1. **Technical Success**:
   - Conversations created with correct attributes
   - n8n workflow triggered automatically
   - AI responses generated within 2-3 seconds
   - Smooth handoff to human agents

2. **Business Success**:
   - 70-80% of conversations reach handoff
   - 25-35% convert to applications
   - Consistent broker personalities
   - Positive customer feedback

## 🎯 Next Steps

1. **Generate Real Broker Photos**
2. **Test Complete Flow End-to-End**
3. **Monitor n8n Execution Logs**
4. **Track Conversion Metrics**
5. **Optimize Prompts Based on Performance**

---

This flow ensures every lead gets personalized AI engagement with the right broker persona, maximizing conversion potential while maintaining authentic conversations.