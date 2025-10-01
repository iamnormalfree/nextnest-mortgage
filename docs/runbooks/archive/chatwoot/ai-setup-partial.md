> **⚠️ MERGED**: This partial guide is now part of a comprehensive document.
> **Use instead**: [Chatwoot Complete Setup Guide](../../chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md)
> **Archived**: 2025-10-01
> **Reason**: Consolidated to reduce overlap and improve maintainability

[Original content below]
---


# Chatwoot AI Bot Setup Guide

## Understanding Chatwoot's AI Capabilities

### What Chatwoot's OpenAI Integration Actually Does:
- **AI Assist for Agents**: Helps human agents write better responses
- **NOT Automated Bot**: Doesn't automatically respond to customers
- **Requires Human Action**: Agent must click to use AI suggestions

### What You Need for Automated AI Conversations:
A custom webhook bot that:
1. Receives messages from Chatwoot via webhooks
2. Uses OpenAI API to generate responses with lead context
3. Automatically responds until handoff triggers
4. Transfers to human agents when needed

## Implementation Architecture

```
[Customer Message in Chatwoot]
           ↓
[Chatwoot Webhook Event]
           ↓
[Your NextNest API Endpoint]
           ↓
[OpenAI API Call with Context]
           ↓
[AI Generated Response]
           ↓
[Send Back to Chatwoot]
           ↓
[Monitor for Handoff Triggers]
           ↓
[Transfer to Human if Needed]
```

## Setup Steps

### 1. Add OpenAI API Key to Environment
```env
# Add to .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for better quality
```

### 2. Install OpenAI SDK
```bash
npm install openai
```

### 3. Configure Chatwoot Bot
```javascript
// In Chatwoot Admin Panel:
// 1. Go to Settings → Agent Bots
// 2. Create new bot "NextNest AI Assistant"
// 3. Set webhook URL to: https://your-ngrok-url.app/api/chatwoot-ai-webhook
// 4. Copy the bot token to .env.local
```

### 4. Set Conversation to Bot Mode
When creating a conversation from your lead form:
```javascript
// Set conversation status to 'bot' for AI handling
const conversation = await createChatwootConversation({
  status: 'bot',  // Important: This enables bot handling
  custom_attributes: {
    // Lead form data for context
    name: formData.name,
    lead_score: calculatedScore,
    loan_type: formData.loanType,
    monthly_income: formData.monthlyIncome,
    property_category: formData.propertyCategory,
    // ... other relevant data
  }
})
```

## How the AI Bot Works

### 1. Context Building
The bot uses lead form data to understand the customer:
```javascript
// System prompt includes:
- Customer name and profile
- Lead score (qualification level)
- Financial details (income, loan amount)
- Property preferences
- Current mortgage rates
- Singapore-specific regulations
```

### 2. Intelligent Responses
OpenAI generates contextual responses based on:
- Customer's specific question
- Their financial profile
- Conversation history
- Current market data

### 3. Automatic Handoff Triggers
Bot transfers to human when detecting:
- High-intent keywords ("speak to human", "ready to proceed")
- Complex situations (divorce, bankruptcy, special cases)
- Frustration signals
- High-value lead after multiple exchanges
- Specific purchase readiness signals

### 4. Handoff Process
When handoff is triggered:
1. Conversation status changes from 'bot' to 'open'
2. Human agents get notified
3. Internal note added with context
4. Customer receives handoff message

## Testing the Setup

### 1. Test Webhook Connection
```bash
# Send test message to your webhook
curl -X POST http://localhost:3004/api/chatwoot-ai-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "message": {
      "content": "What are the current mortgage rates?",
      "message_type": "incoming"
    },
    "conversation": {
      "id": 123,
      "custom_attributes": {
        "name": "John",
        "lead_score": 85,
        "monthly_income": 8000
      }
    }
  }'
```

### 2. Monitor Logs
```bash
# Watch server logs for AI processing
npm run dev
# Look for:
# 🤖 AI Webhook received
# 📊 OpenAI generating response
# ✅ Response sent to Chatwoot
```

### 3. Test Handoff Triggers
Send messages like:
- "I want to speak to a human"
- "Ready to apply now"
- "This is urgent, need help ASAP"

## Customization Options

### Adjust AI Behavior
```javascript
// In your webhook handler:
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  temperature: 0.7,  // 0-1: Lower = more focused, Higher = more creative
  max_tokens: 500,   // Response length limit
  presence_penalty: 0.6,  // Reduce repetition
  frequency_penalty: 0.3  // Encourage variety
})
```

### Customize Handoff Rules
```javascript
// Add your business-specific triggers:
const customHandoffTriggers = [
  'loan above 1 million',
  'commercial property',
  'refinancing urgent',
  // Add more based on your needs
]
```

## Important Limitations

1. **Chatwoot's Built-in OpenAI**: Only for agent assistance, not automated bots
2. **Response Time**: OpenAI API calls take 1-3 seconds
3. **Cost**: Each message uses OpenAI tokens (monitor usage)
4. **Accuracy**: AI responses need monitoring and refinement

## Troubleshooting

### Bot Not Responding
- Check webhook URL is accessible (use ngrok)
- Verify conversation status is 'bot'
- Check OpenAI API key is valid
- Review server logs for errors

### Poor Response Quality
- Upgrade to GPT-4 model
- Improve system prompt with more context
- Add more specific examples in prompt
- Fine-tune temperature settings

### Handoff Not Working
- Verify conversation status changes to 'open'
- Check agent availability in Chatwoot
- Review handoff trigger keywords
- Ensure API token has correct permissions

## Cost Optimization

### Token Usage Estimates
- GPT-3.5-turbo: ~$0.002 per conversation
- GPT-4: ~$0.02 per conversation
- Average conversation: 5-10 exchanges

### Optimization Tips
1. Use GPT-3.5-turbo for initial responses
2. Upgrade to GPT-4 only for complex queries
3. Cache common responses
4. Implement rate limiting
5. Set max token limits

## Next Steps

1. **Monitor Performance**: Track response quality and handoff rates
2. **Refine Prompts**: Improve based on actual conversations
3. **Add Analytics**: Track conversion rates and bot effectiveness
4. **Scale Gradually**: Start with specific use cases, then expand