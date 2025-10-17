---
title: chatwoot-implementation-plan
status: backlog
owner: ai-broker
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Feed this backlog item into `/response-awareness` with the ai-broker squad before implementation.

# ✅ IMPLEMENTED: Chatwoot + Langfuse Integration

## Current Status: Ready for Testing

### ✅ Completed Integration

### ✅ Key Advantages
1. **Proper API Keys**: Generated directly in the UI
2. **Simple REST API**: No complex authentication dance
3. **Better Documentation**: Specifically for self-hosted
4. **Webhook Support**: Easy bot integration
5. **Custom Attributes**: Perfect for lead scoring

## Quick Setup Guide

### 1. Deploy Chatwoot (Hetzner)

```bash
# Docker Compose deployment
version: '3'
services:
  chatwoot:
    image: chatwoot/chatwoot:latest
    environment:
      - RAILS_ENV=production
      - SECRET_KEY_BASE=your-secret-key
      - FRONTEND_URL=https://chat.nextnest.sg
      - DATABASE_URL=postgres://user:pass@db:5432/chatwoot
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
```

### 2. Get API Access Token

1. Login to Chatwoot dashboard
2. Go to **Settings → API Access** 
3. Click **Create API Token**
4. Copy the token - it looks like: `api_xxxxxxxxxxxxx`

### 3. NextNest Integration

```javascript
// app/api/chatwoot-conversation/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.json();
  
  // Calculate lead score
  const leadScore = calculateLeadScore(formData);
  const brokerPersona = leadScore >= 75 ? 'aggressive' : 
                        leadScore >= 45 ? 'balanced' : 'conservative';
  
  // Create conversation in Chatwoot
  const response = await fetch('https://chat.nextnest.sg/api/v1/accounts/1/conversations', {
    method: 'POST',
    headers: {
      'api_access_token': process.env.CHATWOOT_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source_id: `lead_${Date.now()}`,
      inbox_id: 1, // Your inbox ID
      contact: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone
      },
      custom_attributes: {
        lead_score: leadScore,
        broker_persona: brokerPersona,
        property_type: formData.propertyType,
        loan_amount: formData.loanAmount,
        monthly_income: formData.monthlyIncome
      },
      message: {
        content: `New ${brokerPersona} lead from mortgage form (Score: ${leadScore}/100)`
      }
    })
  });
  
  const conversation = await response.json();
  
  return NextResponse.json({
    success: true,
    conversationUrl: `https://chat.nextnest.sg/app/accounts/1/conversations/${conversation.id}`,
    leadScore,
    brokerPersona
  });
}
```

### 4. Bot Webhook Handler

```javascript
// app/api/chatwoot-webhook/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json();
  
  if (event.event === 'message_created' && !event.message.private) {
    const { conversation, message } = event;
    
    // Get lead data from custom attributes
    const leadScore = conversation.custom_attributes.lead_score;
    const brokerPersona = conversation.custom_attributes.broker_persona;
    
    // Generate AI response
    const aiResponse = await generateBrokerResponse({
      message: message.content,
      leadScore,
      brokerPersona,
      propertyType: conversation.custom_attributes.property_type
    });
    
    // Send response back to Chatwoot
    await fetch(`https://chat.nextnest.sg/api/v1/accounts/1/conversations/${conversation.id}/messages`, {
      method: 'POST',
      headers: {
        'api_access_token': process.env.CHATWOOT_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: aiResponse.response,
        message_type: 'outgoing',
        private: false
      })
    });
    
    // Track in Langfuse
    await trackInLangfuse({
      conversationId: conversation.id,
      userMessage: message.content,
      aiResponse: aiResponse.response,
      metadata: conversation.custom_attributes
    });
  }
  
  return NextResponse.json({ received: true });
}
```

### 5. Langfuse Integration

```javascript
import { Langfuse } from 'langfuse';

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: 'https://langfuse.nextnest.sg' // Your self-hosted Langfuse
});

async function trackInLangfuse(data) {
  const trace = langfuse.trace({
    id: data.conversationId,
    metadata: data.metadata
  });
  
  trace.generation({
    name: 'broker-response',
    input: data.userMessage,
    output: data.aiResponse,
    model: 'custom-broker-model',
    metadata: {
      leadScore: data.metadata.lead_score,
      brokerPersona: data.metadata.broker_persona
    }
  });
  
  await langfuse.flush();
}
```

## Environment Variables

```bash
# .env.local
CHATWOOT_API_KEY=api_xxxxxxxxxxxxx
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1

# Langfuse
LANGFUSE_PUBLIC_KEY=pk_xxxxx
LANGFUSE_SECRET_KEY=sk_xxxxx
LANGFUSE_BASE_URL=https://langfuse.nextnest.sg
```

## Migration Steps

1. **Deploy Chatwoot** on your Hetzner server
2. **Create Inbox** for NextNest leads
3. **Generate API Token** in settings
4. **Update environment variables**
5. **Deploy webhook handler** to your Next.js app
6. **Configure webhook** in Chatwoot settings
7. **Test end-to-end flow**

## Why This is Better

### Compared to Tiledesk:
- ✅ **No authentication issues** - API keys just work
- ✅ **Clear documentation** for self-hosted
- ✅ **Simple REST API** - no SDK needed
- ✅ **Better webhook support** for bots
- ✅ **Easier debugging** with clear error messages

### Architecture Benefits:
1. **Lead Form** → Chatwoot API (with API key)
2. **Chatwoot** → Webhook → Your Bot
3. **Bot Response** → Chatwoot API → User
4. **All Events** → Langfuse for tracking

### Features You Get:
- 📊 Lead scoring via custom attributes
- 🤖 AI broker personas
- 📈 Full conversation tracking
- 🔄 Automatic handoff to humans
- 📱 Mobile apps for agents
- 🎯 Automation rules
- 📧 Email/SMS integration

## Testing Script

```javascript
// scripts/test-chatwoot.js
async function testChatwoot() {
  const apiKey = 'api_xxxxxxxxxxxxx';
  const baseUrl = 'https://chat.nextnest.sg';
  
  // Test API access
  const response = await fetch(`${baseUrl}/api/v1/accounts/1/inboxes`, {
    headers: {
      'api_access_token': apiKey
    }
  });
  
  if (response.ok) {
    console.log('✅ Chatwoot API working!');
    const inboxes = await response.json();
    console.log('Available inboxes:', inboxes);
  } else {
    console.log('❌ API access failed:', response.status);
  }
}
```

## Summary

**Chatwoot + Langfuse** gives you:
- ✅ Easier setup and maintenance
- ✅ Better API with proper keys
- ✅ Cleaner webhook-based bot integration
- ✅ Full observability with Langfuse
- ✅ No authentication headaches

The migration is straightforward and will save you time in the long run!