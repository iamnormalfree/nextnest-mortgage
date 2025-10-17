# N8N Natural Conversation Flow Setup Guide

## Overview
This guide helps you configure n8n to use the new natural conversation flow for AI brokers in Chatwoot, creating more human-like interactions.

## Key Improvements

### Before (Awkward Flow):
```
03:52 PM - Brent added AI-Broker-Marcus, Property-HDB
03:52 PM - Hi Brent! I'm Marcus Chen...
```

### After (Natural Flow):
```
03:52 PM - Marcus Chen joined the conversation
03:52 PM - [typing indicator for 2-3 seconds]
03:52 PM - Good afternoon Brent! I'm Marcus Chen. Thank you for considering us...
```

## N8N Workflow Configuration

### 1. Update Webhook Endpoint

Change your n8n webhook to point to the new natural flow endpoint:

**Old:** `https://nextnest.sg/api/chatwoot-ai-webhook`
**New:** `https://nextnest.sg/api/chatwoot-natural-flow`

### 2. Modify HTTP Request Nodes

Update all HTTP request nodes in your n8n workflow:

```json
{
  "method": "POST",
  "url": "https://nextnest.sg/api/chatwoot-natural-flow",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "event": "={{ $json.event }}",
    "conversation": "={{ $json.conversation }}",
    "message": "={{ $json.message }}",
    "account": "={{ $json.account }}"
  }
}
```

### 3. Configure Conversation Created Event

Add a new branch in n8n for `conversation_created` events:

```javascript
// IF Node: Check Event Type
if (items[0].json.event === 'conversation_created') {
  // Route to Natural Flow API
  // This will handle broker assignment and natural greeting
}
```

### 4. Remove Old Assignment Logic

Replace the old assignment logic that shows:
- "Brent added AI-Broker-Marcus"
- Immediate broker response

With new natural flow that:
- Waits 2-3 seconds
- Shows "Marcus Chen joined the conversation"
- Simulates typing
- Sends personalized greeting

## Broker Personality Mapping

The system automatically selects brokers based on lead score:

| Lead Score | Broker Type | Example Brokers | Join Delay | Style |
|------------|-------------|-----------------|------------|-------|
| 80-100 | Aggressive | Marcus Chen, Michelle Chen | 1.5-2s | Fast, urgent, opportunity-focused |
| 50-79 | Balanced | Sarah Wong | 2.5s | Professional, informative |
| 0-49 | Conservative | Jasmine Lee, David Lim | 3-3.5s | Patient, educational |

## Conversation Stages

The system tracks conversation stages and adapts responses:

1. **Greeting Stage** (0-2 messages)
   - Build rapport
   - Understand needs
   - Natural introduction

2. **Discovery Stage** (3-5 messages)
   - Gather information
   - Educate on options
   - Build trust

3. **Nurturing Stage** (6-10 messages)
   - Demonstrate value
   - Answer questions
   - Provide calculations

4. **Closing Stage** (10+ messages or high lead score)
   - Move towards commitment
   - Offer next steps
   - Prepare for handoff

5. **Handoff Stage**
   - Smooth transition to human
   - Summary for agent
   - Maintain conversation flow

## Testing the Natural Flow

### Test Script
```javascript
// scripts/test-natural-flow.js
const testNaturalFlow = async () => {
  const response = await fetch('https://nextnest.sg/api/chatwoot-natural-flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event: 'conversation_created',
      conversation: {
        id: 123,
        custom_attributes: {
          name: 'Test User',
          lead_score: 85,
          property_category: 'condo',
          monthly_income: 12000,
          loan_type: 'new_purchase'
        }
      }
    })
  });

  const result = await response.json();
  console.log('Natural flow response:', result);
};

testNaturalFlow();
```

## Expected Behavior

### Conversation Start
1. User submits form
2. Wait 2-3 seconds (broker "traveling" to chat)
3. System message: "Sarah Wong joined the conversation"
4. Typing indicator appears for 2-4 seconds
5. Personalized greeting based on lead data

### During Conversation
1. Each response has natural typing delay
2. Responses acknowledge previous messages
3. Personality-consistent language
4. Progressive disclosure of information
5. Natural transitions between topics

### Handoff Triggers
- Direct request: "speak to human", "real person"
- High intent: "ready to apply", "sign up now"
- High-value leads after 8+ messages
- Complex situations
- Customer frustration

## Environment Variables

Add these to your `.env.local`:

```bash
# Chatwoot Configuration
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=your_api_token_here
CHATWOOT_ACCOUNT_ID=1

# OpenAI (Optional - for enhanced responses)
OPENAI_API_KEY=your_openai_key_here
```

## Monitoring and Analytics

Track these metrics to measure improvement:

1. **Engagement Metrics**
   - Average messages per conversation
   - Time to first response
   - Conversation completion rate

2. **Quality Metrics**
   - Handoff rate
   - Customer satisfaction
   - Lead conversion rate

3. **Natural Flow Metrics**
   - Typing simulation accuracy
   - Response relevance score
   - Personality consistency

## Troubleshooting

### Issue: Brokers responding too quickly
**Solution:** Increase typing delays in `natural-conversation-flow.ts`

### Issue: Wrong broker personality assigned
**Solution:** Adjust lead score thresholds in `selectBestBroker()` function

### Issue: Awkward handoff messages
**Solution:** Customize handoff messages in `generateHandoffMessage()` function

### Issue: System messages still showing old format
**Solution:** Ensure n8n workflow is using new endpoint and not old assignment logic

## Rollback Plan

If you need to rollback to the old system:

1. Change webhook endpoint back to `/api/chatwoot-ai-webhook`
2. Re-enable old broker assignment logic in n8n
3. Disable natural flow endpoint

## Next Steps

1. Deploy the new API endpoint
2. Update n8n workflow to use new endpoint
3. Test with different lead scores
4. Monitor conversation quality
5. Adjust timing and personalities based on feedback

## Support

For issues or questions:
- Check logs: `docker logs chatwoot_chatwoot_1`
- Test endpoint: `curl -X POST https://nextnest.sg/api/chatwoot-natural-flow`
- Review conversation: Check Chatwoot dashboard for message flow