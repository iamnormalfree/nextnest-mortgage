---
title: implementation-plan
status: backlog
owner: ai-broker
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Feed this backlog item into `/response-awareness` with the ai-broker squad before implementation.

# 🎯 NextNest AI-Human Broker Implementation Plan

## 🏗️ Architecture Overview

```
NextNest (Railway) → Lead Form → AI Broker (Tiledesk/Railway) ⟷ Human Broker Dashboard
     ↓                                                                    ↓
Webhook Integration ← Conversation Analytics (Langfuse/Railway) → Real-time Monitoring
```

## 🚀 Railway Deployment Strategy

### **Phase 1: Deploy Tiledesk on Railway**

#### **Step 1: Create Tiledesk Service**
```bash
# In Railway dashboard:
1. New Project → "NextNest Chat System"
2. Add Service → Docker Image
3. Image: `tiledesk/tiledesk-server`
4. Add MongoDB service from Railway template
```

#### **Step 2: Environment Variables**
```bash
DATABASE_URI=mongodb://mongo/tiledesk-server
EXTERNAL_BASE_URL=https://your-tiledesk.railway.app
EXTERNAL_MQTT_BASE_URL=wss://your-tiledesk.railway.app
JWT_SECRET=your-jwt-secret-here
SUPER_PASSWORD=your-super-admin-password
```

#### **Step 3: Deploy Langfuse Analytics**
```bash
# Railway has official Langfuse template
1. Add Service → Template → Langfuse
2. Configure PostgreSQL database
3. Set NEXTAUTH_SECRET and LANGFUSE_SECRET_KEY
```

### **Phase 2: NextNest Integration**

#### **Step 1: Add Dependencies**
```bash
npm install @tiledesk/tiledesk-client langfuse
```

#### **Step 2: Create Webhook Handler**
Create `app/api/tiledesk-webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TiledeskClient } from '@tiledesk/tiledesk-client';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  
  // Process different events
  switch (payload.hook?.event) {
    case 'message.create':
      await handleNewMessage(payload);
      break;
    case 'request.create':
      await handleNewConversation(payload);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handleNewMessage(payload: any) {
  // Log to Langfuse for analytics
  // Check for human takeover triggers
  // Update lead scoring
}
```

#### **Step 3: Lead Form Integration**
Update your existing lead form in `components/ContactSection.tsx`:

```typescript
const handleSubmit = async (data: MortgageFormData) => {
  // Your existing form processing
  
  // Create Tiledesk conversation after Step 3
  if (currentStep >= 3) {
    const conversation = await createTiledeskChat({
      leadId: data.id,
      leadScore: calculatedScore,
      loanType: data.loanType,
      metadata: data
    });
    
    // Redirect to chat interface
    window.open(`https://your-tiledesk.railway.app/chat/${conversation.id}`);
  }
};
```

## 👥 Human Broker Takeover Workflow

### **Real-time Observation Dashboard**

#### **How Human Broker Monitors Conversations:**

1. **Multi-Conversation Dashboard**
   - Login to Tiledesk admin: `https://your-tiledesk.railway.app`
   - View all active conversations in real-time
   - See AI responses before they're sent (configurable delay)
   - Lead scoring and context displayed per conversation

2. **Live Monitoring Features:**
   ```
   Conversation List:
   ├── Lead #001 - Sarah Chen (Score: 85/100)
   │   ├── Status: AI Active | Last: "What's my rate?"
   │   ├── Context: $450K refinance | 720 FICO
   │   └── [OBSERVE] [TAKE OVER] [ADD NOTE]
   │
   ├── Lead #002 - Mike Johnson (Score: 92/100)  
   │   ├── Status: Human Active | Last: Human typing...
   │   └── [CHAT ACTIVE] [TRANSFER BACK] 
   ```

#### **How Human Takeover Works:**

**Method 1: Instant Takeover**
- Click "TAKE OVER" button
- AI immediately stops responding
- Human types next message
- Client sees: "You're now connected with [Your Name], senior mortgage broker"

**Method 2: Approval Mode**
- Configure AI to wait 10-15 seconds before sending responses
- Human can approve, edit, or take over during this window
- Client doesn't know about the delay

**Method 3: Triggered Takeover**
```typescript
// Automatic triggers in your webhook handler
const takeover_triggers = [
  'rate too high',
  'competitor mentioned', 
  'complex scenario',
  'frustrated tone detected',
  'loan amount > $1M'
];

if (message.includes(takeover_triggers)) {
  await tiledesk.assignToHuman(conversationId, brokerId);
}
```

### **Seamless Handoff Process:**

1. **AI → Human Handoff:**
   ```
   AI: "Let me connect you with our senior broker for personalized guidance."
   [Internal: Full conversation history + lead data transferred]
   Human: "Hi Sarah! I've reviewed your refinance scenario. Based on your 720 FICO score..."
   ```

2. **Context Preservation:**
   - Full chat history preserved
   - Lead form data attached
   - AI insights and scoring visible to human
   - Previous conversation scoring/sentiment analysis

3. **Human → AI Return:**
   - Human can transfer back to AI for routine follow-ups
   - AI maintains conversation context
   - Useful for document collection, scheduling, basic Q&A

## 🛡️ Security Implementation

### **Step 1: Add Competitor Protection**
```typescript
// app/api/chat-guard/route.ts
const COMPETITOR_KEYWORDS = [
  'I work at', 'fellow broker', 'rates comparison', 
  'other lenders', 'shopping around rates'
];

const RATE_LIMITS = {
  conversations_per_hour: 3,
  messages_per_conversation: 50,
  new_leads_per_day: 10
};

export async function POST(request: NextRequest) {
  const { message, userId, ipAddress } = await request.json();
  
  // Check rate limits
  if (await isRateLimited(userId, ipAddress)) {
    return NextResponse.json({ blocked: true, reason: 'rate_limit' });
  }
  
  // Check competitor keywords
  if (containsCompetitorKeywords(message)) {
    await flagForHumanReview(userId);
    return NextResponse.json({ flagged: true });
  }
  
  return NextResponse.json({ approved: true });
}
```

### **Step 2: Lead Verification Gates**
```typescript
// Only allow chat after:
const VERIFICATION_GATES = {
  email_verified: true,
  phone_verified: true, // For loans > $500K
  lead_score: 60, // Minimum score
  geo_validated: true // Your service areas only
};
```

## 📱 Mobile Dashboard Setup

### **Android Real-time Monitoring Options:**

#### **Option 1: Tiledesk Mobile App (Recommended)**
- Download Tiledesk app from Google Play Store
- Login with your admin credentials
- Receive push notifications for new conversations
- Full chat functionality from mobile device

#### **Option 2: Progressive Web App (PWA)**
```typescript
// Add to your NextNest site - Mobile broker dashboard
// app/broker-mobile/page.tsx
'use client';

export default function MobileBrokerDashboard() {
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket('wss://your-tiledesk.railway.app/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        sendPushNotification(data.conversation);
        setConversations(prev => updateConversation(prev, data));
      }
    };
    
    // Request notification permission
    Notification.requestPermission();
    
    return () => ws.close();
  }, []);
  
  return (
    <div className="mobile-broker-dashboard">
      <div className="conversation-list">
        {conversations.map(conv => (
          <ConversationCard 
            key={conv.id} 
            conversation={conv}
            onTakeOver={() => takeOverConversation(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### **Option 3: Custom Android App with React Native**
```bash
# Quick React Native setup for broker app
npx create-expo-app@latest BrokerDashboard --template blank-typescript

# Key features to implement:
- WebSocket real-time connection
- Push notifications via Expo Notifications
- Chat interface for takeover
- Lead context display
- One-tap takeover functionality
```

### **Real-time Notification Setup:**

#### **Push Notifications Configuration**
```typescript
// app/api/broker-notify/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { event, conversation, leadScore } = await request.json();
  
  // Send push notification to broker's mobile device
  if (event === 'high_value_lead' && leadScore > 80) {
    await sendPushNotification({
      title: '🔥 High-Value Lead Alert',
      body: `New ${conversation.loanType} lead - Score: ${leadScore}/100`,
      data: {
        conversationId: conversation.id,
        action: 'view_conversation'
      }
    });
  }
  
  // Send SMS for critical situations
  if (event === 'frustrated_client') {
    await sendSMS({
      to: process.env.BROKER_PHONE,
      message: `URGENT: Client needs immediate attention - ${conversation.id}`
    });
  }
  
  return NextResponse.json({ notified: true });
}
```

#### **Mobile Dashboard Features:**
```typescript
// Mobile-optimized features
const MOBILE_FEATURES = {
  push_notifications: {
    new_lead: 'Instant notification when lead enters chat',
    high_value: 'Special alert for leads > $500K or score > 85',
    frustrated: 'Emergency notification for negative sentiment',
    competitor: 'Alert when competitor keywords detected'
  },
  
  quick_actions: {
    one_tap_takeover: 'Take over conversation instantly',
    preset_responses: 'Quick mortgage broker responses',
    lead_context: 'Full lead form data + scoring',
    voice_notes: 'Send voice messages to clients'
  },
  
  offline_mode: {
    cached_conversations: 'View recent chats offline',
    auto_sync: 'Sync when connection restored',
    queue_messages: 'Queue responses for sending'
  }
};
```

## 📊 Implementation Timeline

### **Week 1: Railway Setup**
- [ ] Deploy Tiledesk on Railway
- [ ] Deploy Langfuse analytics
- [ ] Configure databases and environment variables
- [ ] Test basic chat functionality

### **Week 2: NextNest Integration**
- [ ] Add webhook handlers to your existing codebase
- [ ] Integrate chat trigger after Step 3 of forms
- [ ] Test lead data transfer to Tiledesk
- [ ] Set up basic AI broker responses

### **Week 3: Human Broker Dashboard**
- [ ] Configure multi-conversation monitoring
- [ ] Set up takeover triggers and workflows  
- [ ] Train AI responses for mortgage scenarios
- [ ] Test human handoff process

### **Week 4: Mobile Dashboard & Security**
- [ ] Set up mobile dashboard (PWA or native app)
- [ ] Configure push notifications and real-time alerts
- [ ] Implement competitor protection
- [ ] Add rate limiting and fraud detection
- [ ] Load testing and optimization

## 💰 Cost Estimation

**Railway Monthly Costs:**
- NextNest site: $5 (existing)
- Tiledesk + MongoDB: $25-40 
- Langfuse + PostgreSQL: $15-25
- **Total: ~$45-70/month**

**Additional Mobile Costs:**
- Push notification service (OneSignal): Free up to 10K users
- SMS alerts (Twilio): ~$10/month for moderate usage
- Mobile app hosting: Free (PWA) or $99/year (App Store)

## 🔄 Data Flow Example

1. **Lead completes Step 3 of mortgage form**
2. **NextNest calculates lead score → 85/100**
3. **Creates Tiledesk conversation with context**
4. **AI broker starts with: "Hi Sarah! I see you're looking to refinance $450K..."**
5. **🔔 Mobile push notification: "High-value lead (85/100) - Sarah Chen - $450K refinance"**
6. **Human broker opens mobile app, monitors conversation**
7. **After 3-4 AI exchanges, human taps "TAKE OVER"**
8. **Seamless transition: "Let me provide personalized guidance..."**
9. **All interactions logged to Langfuse for analytics**

## 🎯 Success Metrics

- **Response Time**: Human takeover within 30 seconds of trigger
- **Lead Conversion**: Track AI vs human-assisted conversion rates
- **Mobile Efficiency**: Average mobile response time < 2 minutes
- **Competitor Protection**: Block rate > 95% for identified competitors
- **System Uptime**: 99.9% availability for critical mortgage conversations

This implementation keeps your NextNest site lean while adding powerful AI-human broker capabilities with full mobile monitoring through Railway's infrastructure.