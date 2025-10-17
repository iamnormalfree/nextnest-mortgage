# n8n Chatwoot Conversation Enhancer Workflow

## Overview

This n8n workflow automatically enhances Chatwoot conversations every minute by:
- ✅ **Finding pending conversations** (those invisible due to UI bug)
- ✅ **Assigning to user** (makes them visible)
- ✅ **Setting status to open** (shows in dashboard)
- ✅ **Adding visual labels** (AI broker + property type)
- ✅ **Adding user form message** (conversation context)
- ✅ **Adding AI broker introduction** (personalized greeting)

## Workflow Structure

```
⏰ Every 1 Minute
    ↓
📥 Get Pending Conversations
    ↓
❓ Any Conversations?
    ↓ YES                    ↓ NO
🔄 Split into Items      ⏸️ No Action
    ↓
👤 Assign to User
    ↓
📂 Set Status to Open
    ↓
❓ Has Broker Info?
    ↓ YES
🏷️ Determine Labels
    ↓
🔗 Add Labels
    ↓
📝 Generate User Message
    ↓
💬 Add User Message  
    ↓
🤖 Generate Broker Message
    ↓
💬 Add Broker Message
    ↓
✅ COMPLETE!
```

## Installation Steps

### 1. Import Workflow
1. Open your n8n instance
2. Go to **Workflows**
3. Click **Import from File**
4. Select: `chatwoot-conversation-enhancer.json`
5. Click **Import**

### 2. Configure Credentials
⚠️ **SECURITY WARNING**: The workflow JSON files contain hardcoded credentials that must be updated before use:
- Chatwoot API Token: `your-chatwoot-api-token`
- Account ID: `your-account-id`
- User ID: `your-user-id`

**Action Required:**
1. After importing, edit each HTTP Request node
2. Replace hardcoded credentials with n8n credential references
3. Use n8n's built-in credential management system
4. Never commit actual tokens to version control

### 3. Create Labels (One-time Setup)
The workflow expects these labels to exist in Chatwoot:

**AI Broker Labels:**
- `AI-Broker-Marcus` (Red #FF6B6B)
- `AI-Broker-Sarah` (Teal #4ECDC4)  
- `AI-Broker-Jasmine` (Blue #45B7D1)

**Property Labels:**
- `Property-HDB` (Green #96CEB4)
- `Property-EC` (Yellow #FFEAA7)
- `Property-Private` (Purple #DDA0DD)

**Create them by running:**
```bash
node scripts/enhance-chatwoot-conversations.js
```
(This will create the labels if they don't exist)

### 4. Activate Workflow
1. In n8n, open the imported workflow
2. Click **Active** toggle to enable it
3. The workflow will run every minute automatically

## Workflow Nodes Explained

### 1. **Schedule Trigger**
- **Type**: Cron/Schedule
- **Frequency**: Every 1 minute
- **Purpose**: Triggers the enhancement process

### 2. **Get Pending Conversations** 
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://chat.nextnest.sg/api/v1/accounts/1/conversations?status=pending`
- **Purpose**: Fetches conversations with pending status

### 3. **Check if Conversations Exist**
- **Type**: IF node
- **Condition**: `conversations.length > 0`
- **Purpose**: Only proceed if there are conversations to process

### 4. **Split into Items**
- **Type**: Split In Batches
- **Field**: `data.payload`
- **Purpose**: Process each conversation individually

### 5. **Assign to User**
- **Type**: HTTP Request  
- **Method**: POST
- **URL**: `https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{id}}/assignments`
- **Body**: `{"assignee_id": 1}`
- **Purpose**: Assigns conversation to user (fixes invisibility)

### 6. **Set Status to Open**
- **Type**: HTTP Request
- **Method**: POST  
- **URL**: `https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{id}}/toggle_status`
- **Body**: `{"status": "open"}`
- **Purpose**: Changes status from pending to open (fixes invisibility)

### 7. **Check if Has Broker Info**
- **Type**: IF node
- **Condition**: `custom_attributes.ai_broker_name` exists
- **Purpose**: Only add labels/messages if broker info is present

### 8. **Determine Labels**
- **Type**: Code node (JavaScript)
- **Purpose**: Maps broker names and property types to label names

### 9. **Add Labels**
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{id}}/labels`
- **Purpose**: Adds visual labels for broker and property type

### 10. **Generate User Message**
- **Type**: Code node (JavaScript)
- **Purpose**: Creates formatted user form submission message

### 11. **Add User Message**
- **Type**: HTTP Request
- **Method**: POST
- **Purpose**: Adds user form message as incoming message

### 12. **Generate Broker Message** 
- **Type**: Code node (JavaScript)
- **Purpose**: Creates personalized AI broker introduction

### 13. **Add Broker Message**
- **Type**: HTTP Request
- **Method**: POST
- **Purpose**: Adds AI broker introduction as outgoing message

## Benefits vs Manual Scripts

### Manual Scripts:
- ❌ **Computer dependent** - stops when computer turns off
- ❌ **Windows only** - requires Task Scheduler setup
- ❌ **Manual setup** - needs admin rights and configuration
- ❌ **Hard to modify** - requires code changes

### n8n Workflow:
- ✅ **Always running** - cloud-based, 24/7 operation
- ✅ **Platform independent** - works anywhere n8n runs
- ✅ **Visual editing** - modify workflow with drag-and-drop
- ✅ **Built-in monitoring** - see execution history and errors
- ✅ **Easy scaling** - adjust frequency or add features easily
- ✅ **Integrated** - part of your existing n8n infrastructure

## Monitoring

### View Execution History
1. Go to **Executions** in n8n
2. Filter by workflow: "Chatwoot Conversation Enhancer"
3. See successful/failed runs with details

### Success Indicators
- **Green executions** = All conversations processed successfully
- **Yellow executions** = Some conversations failed (partial success)
- **Red executions** = Workflow failed completely

### Logs Show:
- Number of conversations processed
- Which conversations were enhanced
- Any API errors or failures

## Customization

### Change Frequency
1. Edit **Schedule Trigger** node
2. Modify interval (e.g., every 30 seconds, every 5 minutes)

### Modify Messages
1. Edit **Generate Broker Message** node
2. Update broker introduction templates
3. Add new broker personas

### Add Features
- Email notifications on enhancement
- Slack alerts for new conversations
- CRM integration updates
- Custom webhook triggers

## Troubleshooting

### Common Issues

**1. Labels Not Found**
- **Error**: 404 when adding labels
- **Solution**: Run `enhance-chatwoot-conversations.js` once to create labels

**2. API Rate Limiting** 
- **Error**: 429 Too Many Requests
- **Solution**: Add delay nodes between HTTP requests

**3. Conversations Not Found**
- **Error**: No conversations to process
- **Solution**: Check if conversations are being created correctly

**4. Authentication Failed**
- **Error**: 401 Unauthorized  
- **Solution**: Verify API token is correct in HTTP request nodes

### Debugging Steps
1. **Test individual nodes** - Run single node to see output
2. **Check execution logs** - View detailed error messages
3. **Verify API responses** - Ensure Chatwoot API is responding
4. **Test with manual conversation** - Create test conversation to debug

## Production Ready

This workflow is designed for production use:
- ✅ **Error handling** - IF conditions prevent failures
- ✅ **Efficient** - Only processes conversations that need enhancement
- ✅ **Safe** - Won't duplicate labels or messages
- ✅ **Scalable** - Handles multiple conversations per run
- ✅ **Monitored** - Full execution logging

Your Chatwoot conversations will now be automatically enhanced every minute! 🎉