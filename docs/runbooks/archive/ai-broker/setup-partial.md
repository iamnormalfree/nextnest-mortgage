> **⚠️ MERGED**: This partial guide is now part of a comprehensive document.
> **Use instead**: [AI Broker Complete Guide](../AI_BROKER_COMPLETE_GUIDE.md)
> **Archived**: 2025-10-01
> **Reason**: Consolidated to reduce overlap and improve maintainability

[Original content below]
---


# AI Broker Persona System - Complete Setup Guide

## What You're Building
A team of 5 AI mortgage brokers with distinct personalities, photos, and learning capabilities that:
- Automatically get assigned to customers based on best match
- Have conversations with full memory and context
- Learn what works and optimize over time
- Handoff to you at the perfect moment
- Track performance and conversion rates

## Prerequisites
- Chatwoot self-hosted (✅ You have this at chat.nextnest.sg)
- n8n instance (✅ You have this on Railway)
- Supabase or PostgreSQL database
- OpenAI API key
- Broker photos/avatars (we'll generate these)

## Step 1: Database Setup (15 minutes)

### 1.1 Create Database in Supabase
1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project "nextnest-ai-brokers"
3. Save your database URL and anon key

### 1.2 Run Database Schema
1. Go to SQL Editor in Supabase
2. Copy entire contents of `database/ai-brokers-schema.sql`
3. Run the query
4. You'll now have all tables and 5 brokers pre-populated

### 1.3 Get Database Connection String
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Step 2: n8n Setup (20 minutes)

### 2.1 Add Credentials in n8n
1. Go to your n8n instance
2. Add these credentials:

**PostgreSQL (Supabase)**:
- Name: `Supabase PostgreSQL`
- Host: `db.[PROJECT-REF].supabase.co`
- Database: `postgres`
- User: `postgres`
- Password: `[YOUR-PASSWORD]`
- Port: `5432`
- SSL: `require`

**Chatwoot API**:
- Name: `Chatwoot API`
- Type: Header Auth
- Header Name: `Api-Access-Token`
- Header Value: `your-chatwoot-api-token`

⚠️ **Security Note**: Never commit actual API tokens to version control.

**OpenAI API**:
- Name: `OpenAI API`
- API Key: `sk-[YOUR-OPENAI-KEY]`

### 2.2 Import Workflow
1. In n8n, go to Workflows
2. Click "Import from File"
3. Upload `n8n-workflows/ai-broker-persona-workflow.json`
4. Open the workflow
5. Update all credential references to use your credentials
6. Save and Activate

### 2.3 Get Webhook URL
1. In the workflow, click on "Chatwoot Webhook" node
2. Copy the Production URL
3. It will look like: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker`

## Step 3: Chatwoot Configuration (10 minutes)

### 3.1 Update Bot Webhook
```bash
# In Chatwoot admin
1. Go to Settings → Agent Bots
2. Edit "NextNest AI Broker"
3. Update Outgoing URL to your n8n webhook URL
4. Save
```

### 3.2 Ensure Bot is Assigned
```bash
1. Go to Settings → Inboxes
2. Select your website inbox
3. Go to Settings tab
4. Under Agent Bots, select "NextNest AI Broker"
5. Save
```

## Step 4: Broker Assets Setup (15 minutes)

### 4.1 Create Broker Photos
Create these folders in your NextNest project:
```
public/
  images/
    brokers/
      michelle-chen.jpg
      sarah-wong.jpg
      grace-lim.jpg
      rachel-tan.jpg
      jasmine-lee.jpg
```

### 4.2 Generate AI Photos (Free Options)
Use one of these to generate professional headshots:
- [This Person Does Not Exist](this)
- [Generated Photos](https://generated.photos/)
- [Bing Image Creator](https://www.bing.com/images/create)

Prompts for each broker:
- **Michelle Chen**: "Professional Singaporean Chinese woman, 35 years old, confident investment banker, power suit"
- **Sarah Wong**: "Friendly Singaporean Chinese woman, 42 years old, warm smile, professional business attire"
- **Grace Lim**: "Motherly Singaporean Chinese woman, 48 years old, kind face, smart casual attire"
- **Rachel Tan**: "Young Singaporean Chinese woman, 28 years old, modern millennial, tech professional style"
- **Jasmine Lee**: "Elegant Singaporean Chinese woman, 39 years old, sophisticated, designer outfit"

### 4.3 Update Database with Photo URLs
```sql
UPDATE ai_brokers SET photo_url = '/images/brokers/michelle-chen.jpg' WHERE slug = 'michelle-chen';
UPDATE ai_brokers SET photo_url = '/images/brokers/sarah-wong.jpg' WHERE slug = 'sarah-wong';
UPDATE ai_brokers SET photo_url = '/images/brokers/grace-lim.jpg' WHERE slug = 'grace-lim';
UPDATE ai_brokers SET photo_url = '/images/brokers/rachel-tan.jpg' WHERE slug = 'rachel-tan';
UPDATE ai_brokers SET photo_url = '/images/brokers/jasmine-lee.jpg' WHERE slug = 'jasmine-lee';
```

## Step 5: Update Your NextNest UI (20 minutes)

### 5.1 Add Broker Display Component
Create `components/chat/BrokerProfile.tsx`:
```tsx
interface BrokerProfileProps {
  brokerName?: string;
  brokerPhoto?: string;
  brokerRole?: string;
  isTyping?: boolean;
}

export default function BrokerProfile({ 
  brokerName = "AI Assistant",
  brokerPhoto = "/images/default-broker.jpg",
  brokerRole = "Mortgage Specialist",
  isTyping = false 
}: BrokerProfileProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
      <img 
        src={brokerPhoto} 
        alt={brokerName}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{brokerName}</h4>
        <p className="text-xs text-gray-600">{brokerRole}</p>
      </div>
      {isTyping && (
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
        </div>
      )}
    </div>
  );
}
```

### 5.2 Update Form Submission
In your lead form submission, add broker assignment:
```javascript
// When creating Chatwoot conversation
const response = await fetch('/api/chatwoot/conversations', {
  method: 'POST',
  body: JSON.stringify({
    ...formData,
    custom_attributes: {
      ...existingAttributes,
      // These trigger broker assignment
      lead_score: calculatedLeadScore,
      loan_type: formData.loanType,
      property_category: formData.propertyType,
      monthly_income: formData.monthlyIncome,
      purchase_timeline: formData.timeline,
      // Bot will be assigned by n8n
      status: 'bot'
    }
  })
});
```

## Step 6: Testing the System (10 minutes)

### 6.1 Test Single Conversation
1. Complete your lead form
2. Navigate to chat interface
3. Send "Hi, I need help with a mortgage"
4. Watch n8n execution logs
5. Verify broker responds with personality

### 6.2 Test Different Personas
Create test leads with different profiles:
- **High-value investor** (Score 90+) → Should get Michelle or Jasmine
- **First-time buyer** (Score 50-70) → Should get Sarah
- **Cautious elderly** (Score 30-50) → Should get Grace
- **Young professional** (Score 70-85) → Should get Rachel

### 6.3 Test Handoff
Send these messages to trigger handoff:
- "I'm ready to apply now"
- "Can I speak to a human?"
- "Let's proceed with the application"

## Step 7: Monitor & Optimize

### 7.1 Create Performance Dashboard
```sql
-- Daily performance query
SELECT 
  b.name,
  b.photo_url,
  COUNT(bc.id) as conversations_today,
  COUNT(bc.id) FILTER (WHERE bc.handoff_triggered) as handoffs,
  COUNT(bc.id) FILTER (WHERE bc.converted) as conversions,
  ROUND(AVG(bc.messages_exchanged), 1) as avg_messages
FROM ai_brokers b
LEFT JOIN broker_conversations bc ON b.id = bc.broker_id
WHERE DATE(bc.assigned_at) = CURRENT_DATE
GROUP BY b.id, b.name, b.photo_url;
```

### 7.2 Track Learning
```sql
-- See what's working
SELECT 
  b.name,
  bl.successful_phrases,
  bl.key_insight,
  bl.confidence_score
FROM broker_learning bl
JOIN ai_brokers b ON bl.broker_id = b.id
WHERE bl.confidence_score > 0.7
ORDER BY bl.created_at DESC
LIMIT 20;
```

## Step 8: Advanced Features (Optional)

### 8.1 Add Voice Messages (with TTS)
```javascript
// In n8n, add OpenAI TTS node
const audio = await openai.audio.speech.create({
  model: "tts-1",
  voice: broker.voice_model, // Different per broker
  input: aiResponse
});
// Send audio to Chatwoot as attachment
```

### 8.2 Show Broker Availability
```javascript
// Real-time availability check
const availableBrokers = await fetch('/api/brokers/availability');
// Show in UI who's "online"
```

### 8.3 A/B Test Phrases
```sql
-- Track phrase performance
UPDATE broker_phrases
SET 
  times_used = times_used + 1,
  led_to_handoff = led_to_handoff + 1
WHERE phrase = 'exclusive opportunity'
AND broker_id = 'marcus-uuid';
```

## Troubleshooting

### Bot Not Responding
1. Check n8n workflow is Active
2. Verify webhook URL in Chatwoot bot settings
3. Check conversation status is "bot"
4. Look at n8n execution logs

### Wrong Broker Assigned
1. Check lead score calculation
2. Verify broker availability in database
3. Review assignment function logic
4. Check workload limits

### No Handoff Happening
1. Verify conversation status changes
2. Check handoff triggers in n8n
3. Ensure human agents are available
4. Review urgency calculations

## Maintenance Tasks

### Daily
- Check n8n execution logs
- Monitor conversion rates
- Review handoff success

### Weekly
- Analyze broker performance
- Update successful phrases
- Adjust optimal lead score ranges

### Monthly
- Review and optimize assignment algorithm
- Update broker profiles based on learning
- Analyze conversion patterns

## Cost Breakdown
- **OpenAI**: ~$0.002 per message (GPT-3.5)
- **Supabase**: Free tier sufficient
- **n8n**: Already on Railway
- **Chatwoot**: Self-hosted (free)
- **Total**: ~$50/month for 25,000 messages

## Success Metrics to Track
1. **Assignment Accuracy**: Right broker for right customer
2. **Handoff Rate**: 70-80% target
3. **Conversion Rate**: 25-35% target
4. **Messages to Handoff**: 6-10 optimal
5. **Customer Satisfaction**: Post-chat survey

## Next Steps
1. Run for 1 week with test traffic
2. Analyze which brokers perform best
3. Refine personas based on data
4. Add more sophisticated learning
5. Implement voice capabilities

This system will give you a scalable AI brokerage that feels real, learns continuously, and optimizes for conversion!