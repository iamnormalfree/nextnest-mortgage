---
title: nextnest-chatwoot-setup
status: backlog
owner: ai-broker
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Feed this backlog item into `/response-awareness` with the ai-broker squad before implementation.

# NextNest Chatwoot AI Broker Setup

## 🎯 Current Status: API WORKING - Need Inbox Creation

Your NextNest AI Broker system is fully implemented and ready for testing! Here's what you need to do:

## Step 1: ✅ DONE - Your API Token is Working!

Your token: `ML1DyhzJyDKFFvsZLvEYfHnC`
Status: **WORKING** (belongs to user "Brent")

## Step 2: Update Environment Variables

Add to your `.env.local`:
```bash
# Chatwoot Configuration (WORKING!)
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=ML1DyhzJyDKFFvsZLvEYfHnC
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1  # Update after creating inbox

# Langfuse Configuration  
LANGFUSE_PUBLIC_KEY=pk_xxxxx  # Get from analytics.nextnest.sg
LANGFUSE_SECRET_KEY=sk_xxxxx  # Get from analytics.nextnest.sg
LANGFUSE_BASE_URL=https://analytics.nextnest.sg

# For webhook callbacks
NEXT_PUBLIC_URL=https://nextnest.sg
```

## Step 2.5: ⚠️ CREATE AN INBOX FIRST!

1. **Go to**: `https://chat.nextnest.sg/app/accounts/1/settings/inboxes`
2. **Click "Add Inbox"**
3. **Choose "Website"** channel
4. **Configure:**
   - Name: "NextNest Leads"
   - Website URL: `https://nextnest.sg`
5. **Save and get the Inbox ID**
6. **Update CHATWOOT_INBOX_ID in .env.local**

## Step 3: Test the API Connection

```bash
# Add your API token to the test script first
node scripts/test-chatwoot-api.js
```

## Step 4: Configure Chatwoot Webhook

1. **Go to**: `https://chat.nextnest.sg/app/accounts/1/settings/integrations/webhooks`
2. **Add webhook URL**: `https://nextnest.sg/api/chatwoot-webhook`
3. **Select events**: `message_created`, `conversation_created`
4. **Save webhook**

## Step 5: Test the Complete Flow

1. **Fill out your form** on the website
2. **Complete all 3 steps**
3. **Check console logs** for conversation creation
4. **Click "Chat with [Broker Name]"**
5. **Send a test message** in Chatwoot
6. **Verify AI broker responds**

## 🤖 Your AI Brokers

### Elena Chen (Aggressive - Lead Score ≥75)
- **Persona**: Urgent, FOMO-driven, exclusive deals
- **Avatar**: 👩‍💼
- **Specialty**: High-value clients, quick closures

### David Tan (Balanced - Lead Score 45-74)  
- **Persona**: Professional, informative, trustworthy
- **Avatar**: 👨‍💼
- **Specialty**: Standard clients, education-focused

### Sarah Lim (Conservative - Lead Score <45)
- **Persona**: Patient, educational, no-pressure
- **Avatar**: 👩‍🎓
- **Specialty**: First-time buyers, careful planners

## 🔄 How It Works

```
Form Completion → Lead Scoring → AI Broker Assignment
       ↓                              ↓
   Chatwoot Conv             Broker sends greeting
       ↓                              ↓
Human monitors dashboard ← → User chats with AI
       ↓                              ↓
  Escalation triggers          AI recommends handoff
       ↓                              ↓
   Human takes over          "Let me get my supervisor"
```

## 📊 Human Broker Dashboard

**View Active Conversations**: `https://chat.nextnest.sg/app/accounts/1/dashboard`

**What Humans See**:
- Real-time conversations with AI brokers
- Lead scores and personas in conversation details
- Internal notes when escalation is recommended
- One-click conversation takeover

**Escalation Triggers**:
- User says "speak to human", "manager", "ready to proceed"
- High-value lead (75+) after 15+ messages
- Any lead after 25+ messages

## 🎭 Making AI Brokers Feel Real

### Current Implementation:
- ✅ Unique names and avatars
- ✅ Distinct personalities and responses  
- ✅ Professional titles and bios
- ✅ Conversation assignment by persona

### Future Enhancements:
- 📸 Professional headshot photos
- 🕐 "Working hours" simulation
- 🎯 Specialization areas
- 📈 Individual performance tracking
- 🏆 "Employee of the month" gamification

## 🔧 Debugging

### Check Logs:
```bash
# View form completion logs
# Check browser console when submitting form

# View webhook logs  
# Check your Next.js server logs

# View Chatwoot activity
# Go to Settings → Audit Logs
```

### Test API Endpoints:
```bash
# Test conversation creation
curl -X POST https://nextnest.sg/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@test.com"}'

# Test AI response
curl -X POST https://nextnest.sg/api/broker-response \
  -H "Content-Type: application/json" \
  -d '{"message":"What are current rates?","leadScore":75,"brokerPersona":"aggressive"}'
```

## 📈 Performance Tracking

### Built-in Metrics:
- Message count per conversation
- Lead scores and persona distribution
- Escalation rates and reasons
- Response times (when Langfuse is connected)

### Langfuse Integration (Next Phase):
- Conversation quality scores
- AI broker performance comparison
- Revenue attribution per broker
- Optimization recommendations

## 🚀 Go Live Checklist

- [ ] API token configured
- [ ] Webhook URL added to Chatwoot
- [ ] Test form → conversation → AI response flow works
- [ ] Human brokers trained on dashboard
- [ ] Escalation process documented
- [ ] Monitoring alerts configured

## 💡 Next Steps

1. **Test thoroughly** with different lead scores
2. **Train human brokers** on takeover process
3. **Monitor initial conversations** for quality
4. **Add Langfuse tracking** for detailed analytics
5. **Optimize AI responses** based on feedback
6. **Add broker performance dashboards**

## 🎉 You're Ready!

Your AI-assisted mortgage advisory system is now live! The AI brokers will:
- ✅ Automatically greet users with personalized messages
- ✅ Respond intelligently based on lead context
- ✅ Flag high-value conversations for human takeover
- ✅ Provide seamless handoff with full context

Time to test it out and start converting those leads! 🚀