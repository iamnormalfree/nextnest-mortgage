---
title: Chatwoot Complete Setup Guide
domain: ChatOps
owner: Platform Team
last_reviewed: 2025-10-01
status: Canonical
replaces: CHATWOOT_DEPLOYMENT_GUIDE.md, CHATWOOT_AI_SETUP.md, N8N_CHATWOOT_SETUP.md
---

# Chatwoot Complete Setup Guide

> **Canonical Reference**: This is the authoritative guide for all Chatwoot setup in NextNest.

## Table of Contents
1. [Platform Deployment](#1-platform-deployment)
2. [Initial Configuration](#2-initial-configuration)
3. [AI Bot Integration](#3-ai-bot-integration)
4. [n8n Workflow Setup](#4-n8n-workflow-setup)
5. [Testing & Troubleshooting](#5-testing--troubleshooting)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Quick Reference](#quick-reference)

---

## 1. Platform Deployment

### Deployment Options Overview

Choose the deployment option that best fits your needs:

| Option | Difficulty | Cost | Use Case |
|--------|-----------|------|----------|
| Heroku | Easy | Free/Paid | Quick testing |
| Railway | Easy | Pay-as-you-go | Modern deployment |
| DigitalOcean | Medium | $12/month | Managed platform |
| Docker/VPS | Advanced | $5-15/month | Full control |

### Option A: Heroku (Fastest Setup)

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/chatwoot/chatwoot)

1. Click the button above
2. Create Heroku account if needed
3. Fill in app name (e.g., `nextnest-chat`)
4. Deploy (takes ~5 minutes)
5. Your URL: `https://[app-name].herokuapp.com`

**Pros**: No server management, automatic SSL, free tier available
**Cons**: Limited free tier hours, slower cold starts

### Option B: Railway (Recommended for Quick Start)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/chatwoot)

1. Click Deploy on Railway
2. Sign in with GitHub
3. Configure environment variables
4. Deploy automatically
5. Get instant URL

**Pros**: Modern UI, GitHub integration, fast deployment
**Cons**: Pay-as-you-go pricing only

### Option C: DigitalOcean App Platform

```bash
1. Go to https://marketplace.digitalocean.com/apps/chatwoot
2. Click "Create Chatwoot App"
3. Choose $12/month plan
4. Deploy in 1 click
```

**Pros**: Managed service, predictable pricing, good performance
**Cons**: Requires payment upfront

### Option D: Docker on VPS (Production Recommended)

#### Prerequisites
- VPS with 2GB RAM minimum (Hetzner CX21 or DigitalOcean $12 droplet)
- Ubuntu 20.04 or 22.04
- Domain pointed to server IP

#### Installation Steps

```bash
# SSH into your server
ssh root@your-server-ip

# Run Chatwoot installer
wget https://get.chatwoot.app/linux/install.sh
chmod +x install.sh
./install.sh --install

# Follow prompts:
# - Enter domain: chat.nextnest.sg
# - Enter email: admin@nextnest.sg
# - Choose yes for SSL
```

**Pros**: Full control, best performance, cost-effective at scale
**Cons**: Requires server management knowledge

#### Optional: SSL with Caddy (if not using installer's SSL)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddyfile
sudo nano /etc/caddy/Caddyfile

# Add:
chat.nextnest.sg {
    reverse_proxy localhost:3000
}

# Restart Caddy
sudo systemctl restart caddy
```

### Post-Deployment: Getting Your IDs

After deployment, you need to find your Account ID and Inbox ID.

#### Method 1: From URL (Easiest)

1. **Login to Chatwoot**
2. **Account ID**: Look at the URL
   ```
   https://app.chatwoot.com/app/accounts/[ACCOUNT_ID]/dashboard
   Example: https://app.chatwoot.com/app/accounts/1/dashboard
   Account ID = 1
   ```

3. **Inbox ID**: Go to Settings > Inboxes > Click on your inbox
   ```
   https://app.chatwoot.com/app/accounts/1/settings/inboxes/[INBOX_ID]/settings
   Example: https://app.chatwoot.com/app/accounts/1/settings/inboxes/2/settings
   Inbox ID = 2
   ```

#### Method 2: From API

```bash
# Get Account ID
curl -H "api_access_token: YOUR_API_TOKEN" \
  https://your-chatwoot-url/api/v1/profile

# Response includes:
{
  "id": 1,
  "name": "Your Name",
  "accounts": [{
    "id": 1,  # <-- This is your Account ID
    "name": "NextNest"
  }]
}

# Get Inbox ID
curl -H "api_access_token: YOUR_API_TOKEN" \
  https://your-chatwoot-url/api/v1/accounts/1/inboxes

# Response includes:
{
  "payload": [{
    "id": 1,  # <-- This is your Inbox ID
    "name": "Website Live Chat"
  }]
}
```

#### Method 3: From Database (Self-hosted only)

```bash
# SSH into server
ssh root@your-server-ip

# Access Chatwoot Rails console
cd /opt/chatwoot
sudo -u chatwoot bundle exec rails console

# In console:
Account.first.id  # Returns Account ID
Inbox.first.id    # Returns Inbox ID
```

---

## 2. Initial Configuration

### Step 1: Create Website Inbox

**Location**: Settings > Inboxes > Add Inbox

1. Click "Add Inbox"
2. Choose "Website"
3. Configure:
   - **Name**: "NextNest Live Chat"
   - **Website URL**: https://nextnest.sg
   - **Welcome Message**: "Hi! I'm your AI mortgage broker. How can I help?"
   - **Widget Color**: Match your brand
4. Save and copy the Website Token

### Step 2: Configure Custom Attributes (CRITICAL)

**Why it matters**: Custom attributes allow you to see lead qualification data directly in the Chatwoot conversation panel.

**Location**: Settings > Custom Attributes > Add Attribute

Create these attributes one by one:

| Attribute Key | Display Name | Type | Description |
|--------------|--------------|------|-------------|
| `lead_score` | Lead Score | Number | Qualification score (0-100) |
| `loan_type` | Loan Type | Text | new_purchase/refinancing/commercial |
| `employment_type` | Employment Type | Text | employed/self-employed/etc |
| `property_category` | Property Category | Text | resale/new_launch/bto/commercial |
| `session_id` | Session ID | Text | Unique form session identifier |
| `broker_persona` | AI Broker Type | Text | aggressive/balanced/conservative |
| `monthly_income` | Monthly Income | Number | Combined monthly income |
| `property_price` | Property Price | Number | Target property value |
| `has_existing_loan` | Has Existing Loan | Text | true/false for refinancing |

**Instructions**:
1. Click "Add Attribute"
2. Select "Applies to: Contact"
3. Fill in the details from the table above
4. Save
5. Repeat for all attributes

> **Warning**: Without these attributes, lead qualification data won't be visible in Chatwoot, making it impossible to prioritize or personalize responses effectively.

### Step 3: Get API Access Token

**Location**: Profile Settings > Access Token

1. Click profile icon (top right)
2. Go to "Profile Settings"
3. Click "Access Token"
4. Copy the token
5. Ensure the token has these permissions:
   - Create/update contacts
   - Create conversations
   - Access inbox

### Step 4: Configure Teams

**Location**: Settings > Teams

Create three teams for lead segmentation:

1. **Premium Sales** - For high-value leads (score 75-100)
2. **General Sales** - For qualified leads (score 45-74)
3. **Support** - For nurture leads (score 0-44)

Assign agents to appropriate teams based on their expertise.

**Why this matters**: Team-based routing ensures leads are handled by agents with the right skills and authority levels.

### Step 5: Set Up Automation Rules

**Location**: Settings > Automation > Add Rule

Create three automation rules based on lead scores:

#### Rule 1: High-Value Leads (Score 75-100)
- **Condition**: Custom Attribute `lead_score` > 75
- **Actions**:
  - Assign to team: "Premium Sales"
  - Add label: "Hot Lead"
  - Send initial message: Use Marcus Chen persona template

#### Rule 2: Medium-Value Leads (Score 45-74)
- **Condition**: Custom Attribute `lead_score` between 45-74
- **Actions**:
  - Assign to team: "General Sales"
  - Add label: "Qualified Lead"
  - Send initial message: Use Sarah Wong persona template

#### Rule 3: Low-Value Leads (Score 0-44)
- **Condition**: Custom Attribute `lead_score` < 45
- **Actions**:
  - Assign to team: "Support"
  - Add label: "Nurture Lead"
  - Send initial message: Use David Lim persona template

**Why this matters**: Automated assignment ensures leads are handled by the right team instantly, improving response times and conversion rates.

### Step 6: Create Canned Responses

**Location**: Settings > Canned Responses

Create templates for each broker persona:

#### Marcus Chen (Aggressive - High Lead Score)
```
Hi {{contact.name}}!

I've analyzed your mortgage application and have excellent news!

✅ Pre-qualification Status: Highly Likely Approved
💰 Potential Savings: Based on your profile
🏆 Your Profile Score: {{custom_attributes.lead_score}}/100

The market is moving fast. Ready to lock in these rates today?
```

#### Sarah Wong (Balanced - Medium Lead Score)
```
Hello {{contact.name}}!

I've reviewed your {{custom_attributes.loan_type}} application.

Your profile shows good potential for approval. Let me guide you through your options and answer any questions.

What would you like to explore first?
```

#### David Lim (Conservative - Low Lead Score)
```
Hi {{contact.name}},

Thank you for your mortgage inquiry. I'm here to help you understand your options without any pressure.

Feel free to ask me anything - even questions you think might be "basic."
```

### Step 7: Configure Webhook (Optional)

**Location**: Settings > Integrations > Webhooks

1. Click "Add Webhook"
2. Enter webhook URL: `https://nextnest.sg/api/chatwoot-webhook`
3. Select events:
   - `conversation_created` - Track when chat starts
   - `message_created` - Process AI responses
   - `conversation_status_changed` - Monitor resolution

**Why this matters**: Webhooks enable real-time synchronization between Chatwoot and your application, allowing for automated responses and analytics tracking.

---

## 3. AI Bot Integration

### Understanding Chatwoot's AI Capabilities

#### What Chatwoot's Built-in OpenAI Integration Does:
- **AI Assist for Agents**: Helps human agents write better responses
- **NOT Automated Bot**: Doesn't automatically respond to customers
- **Requires Human Action**: Agent must click to use AI suggestions

#### What You Need for Automated AI Conversations:
A custom webhook bot that:
1. Receives messages from Chatwoot via webhooks
2. Uses OpenAI API to generate responses with lead context
3. Automatically responds until handoff triggers
4. Transfers to human agents when needed

### Implementation Architecture

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

### Setup Steps

#### Step 1: Add OpenAI API Key to Environment

```env
# Add to .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for better quality
```

#### Step 2: Install OpenAI SDK

```bash
npm install openai
```

#### Step 3: Configure Chatwoot Bot

**Option A: Via Super Admin Panel** (Recommended)
```bash
# Navigate to: https://chat.nextnest.sg/super_admin
# Or regular admin: https://chat.nextnest.sg/app/accounts/1/settings/agent_bots

1. Click "Add Agent Bot" or select existing bot
2. Configure:
   - Name: NextNest AI Assistant
   - Outgoing URL: https://your-domain.com/api/chatwoot-ai-webhook
   - Description: AI-powered mortgage assistant
3. Copy the Bot Token (save to .env.local)
4. Save
```

**Option B: Via API**
```bash
curl -X POST https://chat.nextnest.sg/api/v1/agent_bots \
  -H "Api-Access-Token: YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NextNest AI Assistant",
    "outgoing_url": "https://your-domain.com/api/chatwoot-ai-webhook"
  }'
```

#### Step 4: Assign Bot to Inbox

**Location**: Settings > Inboxes > [Your Inbox] > Settings

1. Go to Settings → Inboxes
2. Select your website inbox
3. Go to "Settings" tab
4. Under "Agent Bots" section
5. Select "NextNest AI Assistant"
6. Save

#### Step 5: Set Conversation to Bot Mode

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

### How the AI Bot Works

#### 1. Context Building
The bot uses lead form data to understand the customer:
- Customer name and profile
- Lead score (qualification level)
- Financial details (income, loan amount)
- Property preferences
- Current mortgage rates
- Singapore-specific regulations

#### 2. Intelligent Responses
OpenAI generates contextual responses based on:
- Customer's specific question
- Their financial profile
- Conversation history
- Current market data

#### 3. Automatic Handoff Triggers
Bot transfers to human when detecting:
- High-intent keywords ("speak to human", "ready to proceed")
- Complex situations (divorce, bankruptcy, special cases)
- Frustration signals
- High-value lead after multiple exchanges
- Specific purchase readiness signals

#### 4. Handoff Process
When handoff is triggered:
1. Conversation status changes from 'bot' to 'open'
2. Human agents get notified
3. Internal note added with context
4. Customer receives handoff message

### Customization Options

#### Adjust AI Behavior

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

#### Customize Handoff Rules

```javascript
// Add your business-specific triggers:
const customHandoffTriggers = [
  'loan above 1 million',
  'commercial property',
  'refinancing urgent',
  'speak to human',
  'ready to proceed',
  // Add more based on your needs
]
```

### Cost Optimization

#### Token Usage Estimates
- GPT-3.5-turbo: ~$0.002 per conversation
- GPT-4: ~$0.02 per conversation
- Average conversation: 5-10 exchanges

#### Optimization Tips
1. Use GPT-3.5-turbo for initial responses
2. Upgrade to GPT-4 only for complex queries
3. Cache common responses
4. Implement rate limiting
5. Set max token limits

---

## 4. n8n Workflow Setup

### Infrastructure Overview

#### Your Setup Components:
- **Chatwoot**: Self-hosted at `https://chat.nextnest.sg`
- **n8n**: Hosted at `https://primary-production-1af6.up.railway.app`
- **NextNest App**: Local/deployed separately

#### Communication Flow:
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

### n8n Setup Steps

#### Step 1: Create HTTP Header Credential in n8n

**Location**: n8n UI > Credentials > New

```javascript
1. Click "New Credential"
2. Select "Header Auth"
3. Configure:
   - Name: Chatwoot API
   - Header Name: Api-Access-Token
   - Header Value: YOUR_CHATWOOT_API_TOKEN
4. Save
```

#### Step 2: Set Environment Variables in n8n

Add these to your n8n Railway instance:

```bash
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=YOUR_API_TOKEN_HERE
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
OPENAI_API_KEY=sk-your-openai-key-here
```

### n8n Workflow Configuration

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

> **Important**: Use this URL as the Outgoing URL in your Chatwoot bot configuration.

#### Node 2: HTTP Request (Get Conversation History)

```json
{
  "name": "Get Conversation History",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "=https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{$json.conversation.id}}/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{
        "name": "Api-Access-Token",
        "value": "={{$credentials.chatwootApi.value}}"
      }]
    }
  }
}
```

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
          "content": "=You are a mortgage expert assistant for NextNest, a Singapore-based mortgage brokerage. Use the conversation history and customer data to provide personalized, accurate mortgage advice. Be professional, friendly, and concise."
        },
        {
          "role": "user",
          "content": "={{$json.message.content}}"
        }
      ]
    },
    "options": {
      "temperature": 0.7,
      "maxTokens": 500
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
    "url": "=https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{$json.conversation.id}}/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{
        "name": "Api-Access-Token",
        "value": "={{$credentials.chatwootApi.value}}"
      }]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "content",
          "value": "={{$json.choices[0].message.content}}"
        },
        {
          "name": "message_type",
          "value": "outgoing"
        }
      ]
    }
  }
}
```

### API Endpoints n8n Uses

#### Reading Data:
```bash
# Get conversation messages (for memory)
GET https://chat.nextnest.sg/api/v1/accounts/1/conversations/{id}/messages

# Get conversation details
GET https://chat.nextnest.sg/api/v1/accounts/1/conversations/{id}

# Get contact details
GET https://chat.nextnest.sg/api/v1/accounts/1/contacts/{id}
```

#### Writing Data:
```bash
# Send a message
POST https://chat.nextnest.sg/api/v1/accounts/1/conversations/{id}/messages

# Update conversation status (for handoff)
PATCH https://chat.nextnest.sg/api/v1/accounts/1/conversations/{id}

# Update custom attributes
POST https://chat.nextnest.sg/api/v1/accounts/1/conversations/{id}/custom_attributes
```

### Security Considerations

#### API Token Security:
- Your Chatwoot API token has full access to your Chatwoot account
- Store it securely in n8n credentials, not in workflow
- Rotate tokens periodically

#### Webhook Security:
- The webhook URL is public but only accepts specific JSON structure
- Consider adding webhook token validation for extra security
- n8n can validate incoming webhooks with a secret

#### CORS and Headers:
- Your self-hosted Chatwoot already allows API access
- n8n handles all necessary headers automatically
- No CORS issues since it's server-to-server communication

---

## 5. Testing & Troubleshooting

### Testing Your Setup

#### Test 1: API Connection

```bash
# Test API connection
curl -I -H "api_access_token: YOUR_API_TOKEN" \
  https://your-chatwoot-url/api/v1/accounts/1/inboxes

# Should return: HTTP/2 200
```

#### Test 2: Conversation Creation

```bash
curl -X POST http://localhost:3000/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "91234567",
      "loanType": "new_purchase",
      "propertyCategory": "resale",
      "actualAges": [30],
      "actualIncomes": [8000],
      "employmentType": "employed"
    },
    "sessionId": "test-123",
    "leadScore": 85
  }'
```

**Expected Result**:
- Conversation created in Chatwoot
- Custom attributes visible in conversation panel
- Correct team assignment based on lead score
- Appropriate initial message sent

#### Test 3: Chatwoot → n8n Connection

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

#### Test 4: n8n → Chatwoot Connection

```bash
# Test API access from n8n to Chatwoot
curl -X GET https://chat.nextnest.sg/api/v1/accounts/1/conversations \
  -H "Api-Access-Token: YOUR_API_TOKEN"
```

#### Test 5: AI Webhook

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

#### Test 6: Handoff Triggers

Send messages like:
- "I want to speak to a human"
- "Ready to apply now"
- "This is urgent, need help ASAP"

#### Test 7: Using Test Scripts

```bash
# Test Chatwoot backend connection
npm run test:chatwoot
# or
npx tsx scripts/test-chatwoot-backend.ts
```

### Monitoring Logs

```bash
# Watch server logs for AI processing
npm run dev

# Look for:
# 🤖 AI Webhook received
# 📊 OpenAI generating response
# ✅ Response sent to Chatwoot
```

### Common Issues & Solutions

#### Issue: Cannot connect to Chatwoot API

**Symptoms**: 401 Unauthorized or connection refused

**Solutions**:
```bash
# Check if Chatwoot is running
curl https://your-chatwoot-url/api

# Should return: {"version":"2.x.x"}

# Verify API token is correct
# Regenerate token in Profile Settings if needed
```

#### Issue: CORS errors

**Symptoms**: CORS policy blocking requests in browser

**Solution**: Add to Chatwoot .env:
```env
CORS_ORIGINS=https://nextnest.sg,http://localhost:3000
```

#### Issue: "Phone number has already been taken"

**Symptoms**: 400 Bad Request when creating contact

**Solution**: The system now searches for existing contacts by email and phone, updating them instead of creating duplicates. If issue persists, check your contact creation logic.

#### Issue: 400 Bad Request

**Symptoms**: Conversation creation fails

**Solution**: Ensure all required fields are populated in the form. The API accepts optional employment type and income arrays.

#### Issue: Custom attributes not showing

**Symptoms**: Attributes not visible in Chatwoot UI

**Solution**: Verify attributes are created with exact key names as listed in Section 2, Step 2.

#### Issue: Webhooks not firing

**Symptoms**: n8n workflow not triggered

**Solutions**:
1. Check webhook URL is publicly accessible
2. Verify webhook returns 200 status
3. Check bot is assigned to inbox in Chatwoot
4. Verify conversation status is "bot"
5. Look at n8n webhook execution logs

#### Issue: Bot Not Responding

**Symptoms**: Messages sent but no AI response

**Solutions**:
- Check webhook URL is accessible (use ngrok for local testing)
- Verify conversation status is 'bot'
- Check OpenAI API key is valid
- Review server logs for errors
- Ensure bot is assigned to inbox

#### Issue: Poor Response Quality

**Symptoms**: AI responses are generic or inaccurate

**Solutions**:
- Upgrade to GPT-4 model
- Improve system prompt with more context
- Add more specific examples in prompt
- Fine-tune temperature settings
- Include more lead form data in context

#### Issue: Handoff Not Working

**Symptoms**: Conversation doesn't transfer to human

**Solutions**:
- Verify conversation status changes to 'open'
- Check agent availability in Chatwoot
- Review handoff trigger keywords
- Ensure API token has correct permissions

#### Issue: Messages Don't Trigger n8n

**Symptoms**: Webhook not reaching n8n

**Solutions**:
1. Check bot is assigned to inbox in Chatwoot
2. Verify webhook URL in bot settings
3. Check conversation status is "bot"
4. Look at n8n webhook execution logs

#### Issue: n8n Can't Send to Chatwoot

**Symptoms**: n8n workflow executes but messages don't appear

**Solutions**:
1. Verify API token is correct
2. Check Chatwoot API is accessible
3. Ensure conversation ID exists
4. Check n8n HTTP node configuration

#### Issue: No Response in Chat

**Symptoms**: AI generates response but doesn't show in UI

**Solutions**:
1. Verify OpenAI API key in n8n
2. Check OpenAI response format
3. Ensure message_type is "outgoing"
4. Check NextNest polling for new messages

#### Issue: SSL Certificate Errors

**Symptoms**: SSL/TLS errors when connecting

**Solution**: Use Caddy for automatic SSL (see Section 1 - Docker deployment)

### Complete Flow Verification

To verify everything works end-to-end:

```javascript
// 1. Your NextNest app creates conversation:
POST to: https://chat.nextnest.sg/api/v1/accounts/1/conversations
With: Lead form data as custom_attributes

// 2. Customer sends message:
POST to: https://chat.nextnest.sg/api/v1/accounts/1/conversations/33/messages

// 3. Chatwoot bot webhook fires:
POST to: https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot

// 4. n8n processes and responds:
POST to: https://chat.nextnest.sg/api/v1/accounts/1/conversations/33/messages

// 5. NextNest polls and displays:
GET from: https://chat.nextnest.sg/api/v1/accounts/1/conversations/33/messages
```

---

## Environment Variables Reference

### Required Variables

Create `.env.local` with these variables:

```env
# ===== CHATWOOT CONFIGURATION =====

# Your Chatwoot instance URL (no trailing slash)
CHATWOOT_BASE_URL=https://chat.nextnest.sg

# API Access Token (from Profile Settings > Access Token)
CHATWOOT_API_TOKEN=your-api-token-here

# Account ID (from URL or API)
CHATWOOT_ACCOUNT_ID=1

# Inbox ID (from URL or API)
CHATWOOT_INBOX_ID=1

# Website Token (from Inbox Settings > Configuration)
CHATWOOT_WEBSITE_TOKEN=your-website-token-here

# ===== AI BOT CONFIGURATION =====

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# OpenAI Model (gpt-3.5-turbo or gpt-4)
OPENAI_MODEL=gpt-3.5-turbo

# Bot Token (from Agent Bots configuration)
CHATWOOT_BOT_TOKEN=your-bot-token-here

# ===== N8N CONFIGURATION =====

# n8n Webhook URL (if using n8n)
N8N_WEBHOOK_URL=https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-bot

# ===== OPTIONAL: CORS CONFIGURATION =====

# Add to Chatwoot's .env (not NextNest)
CORS_ORIGINS=https://nextnest.sg,http://localhost:3000
```

### How to Get Each Variable

| Variable | How to Find |
|----------|-------------|
| `CHATWOOT_BASE_URL` | Your Chatwoot deployment URL |
| `CHATWOOT_API_TOKEN` | Profile Settings > Access Token |
| `CHATWOOT_ACCOUNT_ID` | From URL: `/accounts/[ID]/` |
| `CHATWOOT_INBOX_ID` | Settings > Inboxes > [Inbox] > URL |
| `CHATWOOT_WEBSITE_TOKEN` | Settings > Inboxes > [Inbox] > Configuration |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `CHATWOOT_BOT_TOKEN` | Settings > Agent Bots > [Bot] > Token |
| `N8N_WEBHOOK_URL` | n8n Workflow > Webhook node URL |

---

## Quick Reference

### Essential URLs

```bash
# Chatwoot Admin
https://chat.nextnest.sg/app/accounts/1/dashboard

# Chatwoot Super Admin (self-hosted only)
https://chat.nextnest.sg/super_admin

# Chatwoot Settings
https://chat.nextnest.sg/app/accounts/1/settings

# Chatwoot API Docs
https://www.chatwoot.com/developers/api
```

### Key API Endpoints

```bash
# Authentication Header
Api-Access-Token: YOUR_TOKEN_HERE

# Create Conversation
POST /api/v1/accounts/{account_id}/conversations

# Send Message
POST /api/v1/accounts/{account_id}/conversations/{id}/messages

# Get Messages
GET /api/v1/accounts/{account_id}/conversations/{id}/messages

# Update Conversation
PATCH /api/v1/accounts/{account_id}/conversations/{id}

# Create Contact
POST /api/v1/accounts/{account_id}/contacts

# Update Contact
PATCH /api/v1/accounts/{account_id}/contacts/{id}
```

### Message Types

| Type | Description | Use Case |
|------|-------------|----------|
| `incoming` | From customer | User messages |
| `outgoing` | From bot/agent | Responses |
| `private` | Internal note | Agent notes, handoff context |

### Conversation Statuses

| Status | Description | When to Use |
|--------|-------------|-------------|
| `bot` | Bot handling | AI automated responses |
| `open` | Human assigned | Agent takeover |
| `resolved` | Closed | Completed conversations |
| `pending` | Waiting | Awaiting response |

### Important Permissions

Ensure your API token has these permissions:
- ✅ Create/update contacts
- ✅ Create conversations
- ✅ Send messages
- ✅ Access inbox
- ✅ Update custom attributes

### Workflow Impact Summary

This integration creates a seamless handoff from form to chat:

1. **User completes mortgage form** → Lead score calculated
2. **API creates Chatwoot conversation** → Custom attributes attached
3. **Automation rules trigger** → Correct team assigned
4. **AI bot responds** → Personalized assistance provided
5. **Handoff to human** → When triggers detected
6. **Agent sees full context** → Personalized response sent
7. **Analytics tracked** → Conversion funnel optimized

**Result**: Higher conversion rates, faster response times, and better customer experience.

---

## Related Documentation

- [AI Broker System](../AI_BROKER_COMPLETE_GUIDE.md)
- [Tech Stack Guide](../TECH_STACK_GUIDE.md)
- [ChatOps Runbook](./chatwoot-setup-guide.md) *(Deprecated - use this guide)*
- [Official Chatwoot Docs](https://www.chatwoot.com/docs)
- [Chatwoot API Documentation](https://www.chatwoot.com/developers/api)
- [n8n Documentation](https://docs.n8n.io)

---

## Support

For technical issues:
- Check server logs: `npm run dev`
- Review Chatwoot logs: Admin → System Logs
- Monitor n8n execution logs
- Contact: tech@nextnest.sg

**Last Updated**: 2025-10-01
**Maintained By**: Platform Team
