> **⚠️ MERGED**: This partial guide is now part of a comprehensive document.
> **Use instead**: [Chatwoot Complete Setup Guide](../../chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md)
> **Archived**: 2025-10-01
> **Reason**: Consolidated to reduce overlap and improve maintainability

[Original content below]
---


# Complete n8n Setup for Self-Hosted Chatwoot Integration

## How Your Setup Communicates

### Your Infrastructure:
- **Chatwoot**: Self-hosted at `https://chat.nextnest.sg`
- **n8n**: Hosted at `https://primary-production-1af6.up.railway.app`
- **NextNest App**: Local/deployed separately

### Communication Flow:
```
1. Customer types in NextNest chat UI
        ↓
2. NextNest sends to Chatwoot API (chat.nextnest.sg)
        ↓
3. Chatwoot triggers webhook to n8n
        ↓
4. n8n processes with OpenAI
        ↓
5. n8n sends response back to Chatwoot API
        ↓
6. Response appears in NextNest chat UI
```

## Step-by-Step Setup Guide

### 1. In Chatwoot (chat.nextnest.sg)

#### Configure the Agent Bot:
```bash
# Navigate to: https://chat.nextnest.sg/super_admin
# Or regular admin: https://chat.nextnest.sg/app/accounts/1/settings/agent_bots

1. Click on "NextNest AI Broker" bot (or create new)
2. Set configuration:
   - Name: NextNest AI Assistant
   - Outgoing URL: https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot
   - Description: AI-powered mortgage assistant
3. Copy the Bot Token (you'll need this)
4. Save
```

#### Assign Bot to Inbox:
```bash
1. Go to Settings → Inboxes
2. Select your website inbox
3. Go to "Settings" tab
4. Under "Agent Bots" section
5. Select "NextNest AI Assistant"
6. Save
```

### 2. In n8n (primary-production-1af6.up.railway.app)

#### Create HTTP Header Credential:
```javascript
// In n8n UI:
1. Go to Credentials → New
2. Select "Header Auth"
3. Configure:
   - Name: Chatwoot API
   - Header Name: Api-Access-Token
   - Header Value: your-chatwoot-api-token
4. Save
```

⚠️ **Security Note**: Never commit actual API tokens. Use environment variables and secure credential storage.

#### Set Environment Variables in n8n:
```bash
# Add these to your n8n instance:
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=your-chatwoot-api-token
CHATWOOT_ACCOUNT_ID=your-account-id
CHATWOOT_INBOX_ID=your-inbox-id
```

⚠️ **Security Note**: Replace placeholders with your actual values. Never commit these to version control.

### 3. The n8n Workflow

#### Node 1: Webhook (Receives from Chatwoot)
```json
{
  "name": "Chatwoot Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "chatwoot-ai-bot",
    "responseMode": "onReceived",
    "responseCode": 200,
    "responseData": "{\"received\": true}"
  }
}
```
**This creates**: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot`

#### Node 2: HTTP Request (Get Conversation History)
```json
{
  "name": "Get Conversation History",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "=https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{{$json.conversation.id}}/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{
        "name": "Api-Access-Token",
        "value": "your-chatwoot-api-token"
      }]
    }
  }
}
```

⚠️ **Security Note**: Use n8n credential system instead of hardcoding tokens.

#### Node 3: OpenAI (Generate Response)
```json
{
  "name": "Generate AI Response",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "resource": "chat",
    "model": "gpt-3.5-turbo",
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "=You are a mortgage expert assistant..."
        },
        {
          "role": "user",
          "content": "={{$json.message.content}}"
        }
      ]
    }
  }
}
```

#### Node 4: HTTP Request (Send Response to Chatwoot)
```json
{
  "name": "Send to Chatwoot",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "=https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{{$json.conversation.id}}/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{
        "name": "Api-Access-Token",
        "value": "your-chatwoot-api-token"
      }]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [{
        "name": "content",
        "value": "={{$json.choices[0].message.content}}"
      },
      {
        "name": "message_type",
        "value": "outgoing"
      }]
    }
  }
}
```

## API Endpoints n8n Uses

n8n communicates with your Chatwoot using these endpoints:

### Reading Data:
```bash
# Get conversation messages (for memory)
GET https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{id}/messages

# Get conversation details
GET https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{id}

# Get contact details
GET https://chat.nextnest.sg/api/v1/accounts/{account-id}/contacts/{id}
```

### Writing Data:
```bash
# Send a message
POST https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{id}/messages

# Update conversation status (for handoff)
PATCH https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{id}

# Update custom attributes
POST https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{id}/custom_attributes
```

## Security Considerations

### API Token Security:
- Your Chatwoot API token is used for authentication
- **Always** store it securely in n8n credentials, never in workflow configurations
- This token has full access to your Chatwoot account
- Regenerate tokens periodically for security
- Never commit tokens to version control

### Webhook Security:
- The webhook URL is public but only accepts specific JSON structure
- Consider adding webhook token validation for extra security
- n8n can validate incoming webhooks with a secret

### CORS and Headers:
- Your self-hosted Chatwoot already allows API access
- n8n handles all necessary headers automatically
- No CORS issues since it's server-to-server

## Testing the Connection

### 1. Test Chatwoot → n8n:
```bash
# Send a test webhook from your local machine
curl -X POST https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "conversation": {"id": 33},
    "message": {"content": "Test message", "message_type": "incoming"}
  }'
```

### 2. Test n8n → Chatwoot:
```bash
# Test API access from n8n to Chatwoot
curl -X GET https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations \
  -H "Api-Access-Token: your-chatwoot-api-token"
```

### 3. End-to-End Test:
1. Send a message in your NextNest chat
2. Check n8n execution logs
3. Verify response appears in chat

## Troubleshooting

### If Messages Don't Trigger n8n:
1. Check bot is assigned to inbox in Chatwoot
2. Verify webhook URL in bot settings
3. Check conversation status is "bot"
4. Look at n8n webhook execution logs

### If n8n Can't Send to Chatwoot:
1. Verify API token is correct
2. Check Chatwoot API is accessible
3. Ensure conversation ID exists
4. Check n8n HTTP node configuration

### If No Response in Chat:
1. Verify OpenAI API key in n8n
2. Check OpenAI response format
3. Ensure message_type is "outgoing"
4. Check NextNest polling for new messages

## Complete Flow Verification

To verify everything works:

```javascript
// 1. Your NextNest app creates conversation:
POST to: https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations
With: Lead form data as custom_attributes

// 2. Customer sends message:
POST to: https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{conversation-id}/messages

// 3. Chatwoot bot webhook fires:
POST to: https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot

// 4. n8n processes and responds:
POST to: https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{conversation-id}/messages

// 5. NextNest polls and displays:
GET from: https://chat.nextnest.sg/api/v1/accounts/{account-id}/conversations/{conversation-id}/messages
```

## Important Notes

1. **Both Systems Must Be Online**: 
   - Chatwoot at chat.nextnest.sg
   - n8n at primary-production-1af6.up.railway.app

2. **API Token Must Be Valid**:
   - Token expires if regenerated in Chatwoot
   - Update in n8n if changed

3. **Conversation Status Matters**:
   - Must be "bot" for bot to respond
   - Changes to "open" for human handoff

4. **Message Types**:
   - incoming = from customer
   - outgoing = from bot/agent
   - private = internal notes

This is a production-ready setup that handles thousands of conversations!