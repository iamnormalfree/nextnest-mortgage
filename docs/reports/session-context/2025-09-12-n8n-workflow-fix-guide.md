---
title: n8n-workflow-fix-guide
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-12
---

# n8n Workflow Fix Guide - September 12, 2025

## Current Status
✅ **What's Working:**
- Webhooks are reaching n8n successfully
- n8n workflow is being triggered ("Workflow was started")
- Our NextNest app is sending the correct payload structure

❌ **What's NOT Working:**
- n8n is returning canned response: "I can help you with your mortgage needs."
- The IF node in n8n is not matching our payload conditions
- No AI-generated responses are being created

## The Payload We're Sending

```json
{
  "event": "message_created",
  "content": "What are the best mortgage rates for HDB flats?",
  "message": {
    "message_type": "incoming",
    "sender": {
      "type": "contact"
    },
    "content": "What are the best mortgage rates for HDB flats?"
  },
  "conversation": {
    "id": 44,
    "status": "bot",
    "custom_attributes": {}
  }
}
```

## n8n Workflow Configuration Fixes Needed

### 1. Fix the IF Node Conditions

The IF node should check for these exact paths:
- **Condition 1:** `{{ $json.message.message_type }}` equals `"incoming"`
- **Condition 2:** `{{ $json.message.sender.type }}` equals `"contact"`

**Common Mistakes to Avoid:**
- Don't check `$json.message_type` (root level) - we send it nested under `message`
- Don't check for numeric values (0 or 1) - we send string values
- Make sure to use exact string matching, not contains

### 2. Update the Webhook Node

Make sure the webhook node:
- Method: POST
- Response Mode: "Respond immediately"
- Response Code: 200
- Response Data: `{"message": "Workflow was started"}`

### 3. Fix the OpenAI Node

The OpenAI node should:
- Use the message content from: `{{ $json.message.content }}`
- Have a proper system prompt for mortgage advice
- Temperature: 0.7-0.9 for conversational responses

**Example System Prompt:**
```
You are an expert mortgage broker in Singapore helping customers with their mortgage queries. 
Provide helpful, accurate, and friendly advice about mortgage options, rates, and processes.
Keep responses concise but informative, focusing on Singapore's mortgage market.
```

### 4. Fix the Chatwoot Response Node

After OpenAI generates a response, send it back to Chatwoot:

**HTTP Request Node Configuration:**
- Method: POST
- URL: `https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{ $json.conversation.id }}/messages`
- Authentication: Header Auth
  - Name: `Api-Access-Token`
  - Value: `ML1DyhzJyDKFFvsZLvEYfHnC`
- Body (JSON):
```json
{
  "content": "{{ $node['OpenAI'].json.choices[0].message.content }}",
  "message_type": "outgoing",
  "private": false
}
```

## Complete n8n Workflow Structure

```
1. Webhook (Trigger)
   ↓
2. IF Node (Check conditions)
   ↓ (True branch)
3. OpenAI Node (Generate response)
   ↓
4. HTTP Request (Send to Chatwoot)
   ↓
5. Response (Success)

   ↓ (False branch from IF)
6. Set Node (Default response)
   ↓
7. HTTP Request (Send default to Chatwoot)
```

## Testing the Fix

1. **In n8n:**
   - Click "Execute Workflow" manually
   - Use this test input for the webhook node:
   ```json
   {
     "event": "message_created",
     "content": "What are HDB loan rates?",
     "message": {
       "message_type": "incoming",
       "sender": { "type": "contact" },
       "content": "What are HDB loan rates?"
     },
     "conversation": { "id": 44, "status": "bot" }
   }
   ```

2. **Check each node output:**
   - Webhook: Should receive the payload
   - IF: Should evaluate to TRUE
   - OpenAI: Should generate a contextual response
   - HTTP Request: Should successfully send to Chatwoot

## Debugging Tips

1. **Add a Code Node after Webhook to log the payload:**
   ```javascript
   console.log('Received payload:', JSON.stringify($input.item.json, null, 2));
   console.log('Message type:', $input.item.json.message?.message_type);
   console.log('Sender type:', $input.item.json.message?.sender?.type);
   return $input.item;
   ```

2. **Check IF Node expressions:**
   - Click on the IF node
   - Check "Input Data" to see what it's receiving
   - Verify the expressions are accessing the correct paths

3. **Common IF Node Expression Fixes:**
   ```
   WRONG: {{ $json.message_type }}
   RIGHT: {{ $json.message.message_type }}
   
   WRONG: {{ $json.sender.type }}
   RIGHT: {{ $json.message.sender.type }}
   
   WRONG: {{ $json.message.message_type === 0 }}
   RIGHT: {{ $json.message.message_type === "incoming" }}
   ```

## Environment Variables in n8n

Make sure these are set in your n8n instance:
- `OPENAI_API_KEY`: Your OpenAI API key
- `CHATWOOT_API_TOKEN`: ML1DyhzJyDKFFvsZLvEYfHnC
- `CHATWOOT_BASE_URL`: https://chat.nextnest.sg

## Success Indicators

When fixed correctly, you should see:
1. IF node showing "TRUE" branch taken
2. OpenAI node generating unique responses based on the question
3. HTTP Request node returning 200 status
4. In Chatwoot: AI-generated responses appearing instead of canned text

## Need Help?

If the workflow still isn't working after these fixes:
1. Export the workflow JSON and review it
2. Check n8n execution logs for errors
3. Verify OpenAI API key is valid and has credits
4. Test each node individually using "Execute Node" feature