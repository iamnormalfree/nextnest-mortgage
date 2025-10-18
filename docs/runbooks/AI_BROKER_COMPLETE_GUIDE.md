---
title: AI Broker System - Complete Guide
domain: AI/ChatOps
owner: AI Team
last_reviewed: 2025-10-01
status: Canonical
replaces: AI_BROKER_PERSONA_SYSTEM.md, AI_BROKER_SETUP_GUIDE.md, COMPLETE_AI_BROKER_FLOW.md
---

# AI Broker System - Complete Guide

> **Canonical Reference**: This is the authoritative guide for the AI broker persona system. This guide consolidates architecture, implementation, and operational knowledge for NextNest's multi-persona AI broker system.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Implementation Guide](#implementation-guide)
3. [End-to-End Flow](#end-to-end-flow)
4. [Optimization & Monitoring](#optimization--monitoring)
5. [Troubleshooting](#troubleshooting)

---

## 1. System Architecture

### 1.1 System Overview

NextNest uses a multi-persona AI broker system with 5 distinct personalities that automatically match customers based on their profile, learn from interactions, and optimize for conversion over time. Each broker has:
- Distinct personality and communication style
- Professional photo/avatar
- Performance metrics and learning capabilities
- Optimal customer segments based on lead scoring

### 1.2 Broker Personas

#### Marcus Chen - The Closer
```yaml
Profile:
  Name: Marcus Chen
  Age: 35
  Background: Ex-investment banker, 12 years experience
  Photo: /images/brokers/marcus-chen.jpg
  Voice: Confident, direct, slight Singaporean accent

Personality:
  Style: Aggressive, opportunity-focused
  Approach: Creates urgency, FOMO tactics
  Strengths: High-value deals, quick decisions
  Weaknesses: Can be too pushy for cautious buyers

Performance Metrics:
  Conversion Rate: 32%
  Best With: Investors, urgent buyers, score 80+
  Avg Messages to Handoff: 6
  Successful Handoff Rate: 78%
```

#### Sarah Wong - The Educator
```yaml
Profile:
  Name: Sarah Wong
  Age: 42
  Background: Former bank manager, CPF specialist
  Photo: /images/brokers/sarah-wong.jpg
  Voice: Professional, warm, clear explanations

Personality:
  Style: Balanced, educational
  Approach: Builds trust through expertise
  Strengths: First-time buyers, complex cases
  Weaknesses: Sometimes too detailed

Performance Metrics:
  Conversion Rate: 28%
  Best With: First-timers, families, score 60-80
  Avg Messages to Handoff: 8
  Successful Handoff Rate: 85%
```

#### David Lim - The Relationship Builder
```yaml
Profile:
  Name: David Lim
  Age: 48
  Background: 20 years in real estate, HDB expert
  Photo: /images/brokers/david-lim.jpg
  Voice: Patient, fatherly, reassuring

Personality:
  Style: Conservative, no-pressure
  Approach: Long-term relationship focus
  Strengths: Anxious buyers, elderly clients
  Weaknesses: Slow to close

Performance Metrics:
  Conversion Rate: 24%
  Best With: Cautious buyers, retirees, score 40-60
  Avg Messages to Handoff: 12
  Successful Handoff Rate: 92%
```

#### Rachel Tan - The Tech-Savvy Millennial
```yaml
Profile:
  Name: Rachel Tan
  Age: 28
  Background: FinTech background, data-driven approach
  Photo: /images/brokers/rachel-tan.jpg
  Voice: Energetic, uses analogies, emoji-friendly

Personality:
  Style: Modern, data-focused, transparent
  Approach: Uses comparisons, visualizations
  Strengths: Young professionals, tech workers
  Weaknesses: Less effective with traditional buyers

Performance Metrics:
  Conversion Rate: 30%
  Best With: Millennials, tech sector, score 70+
  Avg Messages to Handoff: 7
  Successful Handoff Rate: 81%
```

#### Ahmad Ibrahim - The Network Specialist
```yaml
Profile:
  Name: Ahmad Ibrahim
  Age: 39
  Background: Ex-property developer, insider knowledge
  Photo: /images/brokers/ahmad-ibrahim.jpg
  Voice: Confident, well-connected, insider tips

Personality:
  Style: Exclusive deals, network leverage
  Approach: "I know someone who..." angle
  Strengths: Investors, upgraders, special requirements
  Weaknesses: May overpromise

Performance Metrics:
  Conversion Rate: 35%
  Best With: Investors, special cases, score 85+
  Avg Messages to Handoff: 5
  Successful Handoff Rate: 75%
```

### 1.3 Database Schema

**Status**: ✅ Implemented at `C:\Users\HomePC\Desktop\Code\NextNest\database\ai-brokers-schema.sql`

#### AI Broker Profiles Table
```sql
CREATE TABLE ai_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  age INTEGER,
  background TEXT,
  photo_url VARCHAR(255),
  voice_description TEXT,
  personality_style VARCHAR(50),
  approach TEXT,
  strengths TEXT[],
  weaknesses TEXT[],

  -- Performance Metrics (Updated Real-time)
  total_conversations INTEGER DEFAULT 0,
  successful_handoffs INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  avg_messages_to_handoff DECIMAL(5,2) DEFAULT 0,
  avg_customer_satisfaction DECIMAL(3,2) DEFAULT 0,

  -- Learning Parameters
  optimal_lead_score_min INTEGER DEFAULT 0,
  optimal_lead_score_max INTEGER DEFAULT 100,
  best_customer_types TEXT[],
  best_property_types TEXT[],
  best_loan_types TEXT[],

  -- Availability
  is_active BOOLEAN DEFAULT true,
  current_conversations INTEGER DEFAULT 0,
  max_concurrent_conversations INTEGER DEFAULT 5,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Conversation Assignments Table
```sql
CREATE TABLE broker_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id INTEGER NOT NULL,
  broker_id UUID REFERENCES ai_brokers(id),
  customer_name VARCHAR(100),
  lead_score INTEGER,

  -- Assignment Reason
  assignment_reason TEXT,
  assignment_score DECIMAL(5,2),

  -- Performance Tracking
  messages_exchanged INTEGER DEFAULT 0,
  handoff_triggered BOOLEAN DEFAULT false,
  handoff_reason TEXT,
  converted BOOLEAN DEFAULT false,
  customer_feedback INTEGER,

  -- Timing
  assigned_at TIMESTAMP DEFAULT NOW(),
  handoff_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### Broker Learning History
```sql
CREATE TABLE broker_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES ai_brokers(id),
  conversation_id INTEGER,

  -- What Worked
  successful_phrases TEXT[],
  successful_tactics TEXT[],

  -- What Didn't Work
  failed_approaches TEXT[],
  customer_objections TEXT[],

  -- Insights
  learned_preferences JSONB,
  recommended_adjustments TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Performance Analytics
```sql
CREATE TABLE broker_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES ai_brokers(id),
  period_start DATE,
  period_end DATE,

  -- Metrics
  total_conversations INTEGER,
  handoffs INTEGER,
  conversions INTEGER,
  avg_response_time INTEGER,
  avg_conversation_duration INTEGER,

  -- Optimization Insights
  best_performing_hours INTEGER[],
  best_customer_segments TEXT[],
  improvement_areas TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.4 Assignment Logic

The broker assignment algorithm matches customers to brokers based on multiple factors:

```javascript
function selectBroker(customer) {
  const brokers = [
    {
      id: 'marcus-chen',
      name: 'Marcus Chen',
      score: 0,
      optimal: { minScore: 75, maxScore: 100 },
      strengths: ['investors', 'urgent', 'high-value']
    },
    {
      id: 'sarah-wong',
      name: 'Sarah Wong',
      score: 0,
      optimal: { minScore: 50, maxScore: 80 },
      strengths: ['first-timer', 'families', 'education']
    },
    {
      id: 'david-lim',
      name: 'David Lim',
      score: 0,
      optimal: { minScore: 30, maxScore: 60 },
      strengths: ['cautious', 'elderly', 'hdb']
    },
    {
      id: 'rachel-tan',
      name: 'Rachel Tan',
      score: 0,
      optimal: { minScore: 60, maxScore: 90 },
      strengths: ['millennials', 'tech', 'data-driven']
    },
    {
      id: 'ahmad-ibrahim',
      name: 'Ahmad Ibrahim',
      score: 0,
      optimal: { minScore: 80, maxScore: 100 },
      strengths: ['investors', 'special-cases', 'network']
    }
  ];

  // Calculate match scores
  brokers.forEach(broker => {
    // Lead score match (30 points)
    if (customer.leadScore >= broker.optimal.minScore &&
        customer.leadScore <= broker.optimal.maxScore) {
      broker.score += 30;
    }

    // Timeline match (20 points)
    if (customer.timeline === 'urgent' && broker.strengths.includes('urgent')) {
      broker.score += 20;
    }

    // Customer type match (15 points)
    if (customer.employmentType === 'tech' && broker.strengths.includes('tech')) {
      broker.score += 15;
    }

    // Property type match (15 points)
    if (customer.propertyType === 'hdb' && broker.strengths.includes('hdb')) {
      broker.score += 15;
    }

    // Income level match (20 points)
    if (customer.income > 10000 && broker.strengths.includes('high-value')) {
      broker.score += 20;
    }

    // Add randomization for testing (remove in production)
    broker.score += Math.random() * 10;
  });

  // Sort by score and return best match
  brokers.sort((a, b) => b.score - a.score);
  return brokers[0];
}
```

**Assignment Mapping**:
- **Score 85+**: Marcus Chen or Ahmad Ibrahim (aggressive, high-value)
- **Score 70-84**: Rachel Tan (modern, data-driven)
- **Score 50-69**: Sarah Wong (educational, balanced)
- **Score <50**: David Lim (conservative, patient)

---

## 2. Implementation Guide

### 2.1 Prerequisites

Before implementing the AI broker system, ensure you have:

- ✅ **Chatwoot self-hosted** (chat.nextnest.sg)
- ✅ **n8n instance** (Railway)
- **Supabase or PostgreSQL database** (required)
- **OpenAI API key** (required)
- ✅ **Broker photos/avatars** (`/public/images/brokers/`)

### 2.2 Step-by-Step Setup

#### Step 1: Database Setup (15 minutes)

1. **Create Database in Supabase**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Create new project "nextnest-ai-brokers"
   - Save your database URL and anon key

2. **Run Database Schema**
   - Go to SQL Editor in Supabase
   - Copy contents of `C:\Users\HomePC\Desktop\Code\NextNest\database\ai-brokers-schema.sql`
   - Run the query
   - Verify all 4 tables are created and 5 brokers are populated

3. **Get Database Connection String**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

#### Step 2: n8n Setup (20 minutes)

1. **Add Credentials in n8n**

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
   - Header Value: `ML1DyhzJyDKFFvsZLvEYfHnC`

   **OpenAI API**:
   - Name: `OpenAI API`
   - API Key: `sk-[YOUR-OPENAI-KEY]`

2. **Import Workflow**
   - In n8n, go to Workflows
   - Click "Import from File"
   - Upload `n8n-workflows/ai-broker-persona-workflow.json`
   - Open the workflow
   - Update all credential references
   - Save and Activate

3. **Get Webhook URL**
   - Click on "Chatwoot Webhook" node
   - Copy the Production URL
   - Format: `https://primary-production-1af6.up.railway.app/webhook/chatwoot-ai-broker`

#### Step 3: Chatwoot Configuration (10 minutes)

1. **Update Bot Webhook**
   ```bash
   # In Chatwoot admin
   1. Go to Settings → Agent Bots
   2. Edit "NextNest AI Broker"
   3. Update Outgoing URL to your n8n webhook URL
   4. Save
   ```

2. **Ensure Bot is Assigned**
   ```bash
   1. Go to Settings → Inboxes
   2. Select your website inbox
   3. Go to Settings tab
   4. Under Agent Bots, select "NextNest AI Broker"
   5. Save
   ```

#### Step 4: Broker Assets Setup

**Status**: ✅ Already implemented at `C:\Users\HomePC\Desktop\Code\NextNest\public\images\brokers\`

Existing broker assets:
- `default-broker.svg`
- `grace-lim.svg` (David Lim equivalent)
- `jasmine-lee.svg` (Ahmad Ibrahim equivalent)
- `michelle-chen.svg` (Marcus Chen equivalent)
- `rachel-tan.svg`
- `sarah-wong.svg`

**Update Database with Photo URLs**:
```sql
UPDATE ai_brokers SET photo_url = '/images/brokers/michelle-chen.svg' WHERE slug = 'marcus-chen';
UPDATE ai_brokers SET photo_url = '/images/brokers/sarah-wong.svg' WHERE slug = 'sarah-wong';
UPDATE ai_brokers SET photo_url = '/images/brokers/grace-lim.svg' WHERE slug = 'david-lim';
UPDATE ai_brokers SET photo_url = '/images/brokers/rachel-tan.svg' WHERE slug = 'rachel-tan';
UPDATE ai_brokers SET photo_url = '/images/brokers/jasmine-lee.svg' WHERE slug = 'ahmad-ibrahim';
```

#### Step 5: Update NextNest UI (20 minutes)

1. **Add Broker Display Component**

Create or verify `C:\Users\HomePC\Desktop\Code\NextNest\components\chat\BrokerProfile.tsx`:

```tsx
interface BrokerProfileProps {
  brokerName?: string;
  brokerPhoto?: string;
  brokerRole?: string;
  isTyping?: boolean;
}

export default function BrokerProfile({
  brokerName = "AI Assistant",
  brokerPhoto = "/images/brokers/default-broker.svg",
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

2. **Update Form Submission**

In your lead form submission at `C:\Users\HomePC\Desktop\Code\NextNest\app\api\chatwoot-conversation\route.ts`:

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

### 2.3 Environment Variables

Ensure these are configured:

```env
# Chatwoot
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=ML1DyhzJyDKFFvsZLvEYfHnC
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_WEBSITE_TOKEN=your-website-token

# OpenAI (in n8n)
OPENAI_API_KEY=sk-...

# Supabase (in n8n)
DATABASE_URL=postgresql://...
```

### 2.4 Cost Breakdown

- **OpenAI**: ~$0.002 per message (GPT-3.5-turbo)
- **Supabase**: Free tier sufficient for most usage
- **n8n**: Already hosted on Railway
- **Chatwoot**: Self-hosted (free)
- **Total**: ~$50/month for 25,000 messages

---

## 3. End-to-End Flow

### 3.1 User Journey Overview

```
[User Fills Form]
    ↓
[Step 1: Basic Info] → [Step 2: Property Details] → [Step 3: Financial Info]
    ↓
[Form Submission]
    ↓
[/api/chatwoot-conversation endpoint]
    ↓
[Create Chatwoot Conversation with Attributes]
    ↓
[Redirect to /chat?conversation={id}]
    ↓
[Chat Interface Opens]
    ↓
[Chatwoot Webhook → n8n]
    ↓
[n8n Assigns AI Broker Based on Lead Score]
    ↓
[OpenAI Generates Response with Persona]
    ↓
[Message Sent Back to Chat]
    ↓
[User Sees AI Broker Response]
```

### 3.2 Detailed Flow Steps

#### Step 1: Lead Form Completion
**URL**: `http://localhost:3000/` (all local development)

User fills progressive form:
- **Gate 1**: Name, Email, Phone
- **Gate 2**: Loan Type, Property Details
- **Gate 3**: Income, Employment, Commitments

Lead score calculated based on:
- Income level
- Property value
- Employment stability
- Loan-to-value ratio

#### Step 2: Form Submission Processing
**Endpoint**: `C:\Users\HomePC\Desktop\Code\NextNest\app\api\chatwoot-conversation\route.ts`

Form data sent to API:
```javascript
{
  formData: {
    name: "John Doe",
    email: "john@example.com",
    phone: "91234567",
    loanType: "new_purchase",
    propertyPrice: 1500000,
    actualIncomes: [8000],
    employmentType: "employed",
    // ... other fields
  },
  sessionId: "session_xyz",
  leadScore: 85  // Calculated score
}
```

#### Step 3: Chatwoot Conversation Creation

**UPDATED 2025-10-01**: New unified broker orchestration ensures single source of truth from Supabase through to chat UI.

1. **Contact Creation/Update**:
   ```javascript
   const contact = await chatwootClient.createOrUpdateContact({
     name: "John Doe",
     email: "john@example.com",
     phone: "+6591234567"
   })
   ```

2. **Conversation Creation**:
   ```javascript
   const conversation = await chatwootClient.createConversation({
     contact_id: contact.id,
     custom_attributes: {
       // Core lead attributes
       lead_score: 85,
       loan_type: "new_purchase",
       property_category: "resale",
       monthly_income: 8000,
       purchase_timeline: "soon",

       // CRITICAL: This triggers the AI bot
       status: "bot"
     }
   })
   ```

3. **Broker Assignment** (NEW - Before Messages):
   ```javascript
   // Query Supabase ai_brokers table for best match
   const { brokerId, brokerName } = await assignBestBroker({
     leadScore: 85,
     loanType: "new_purchase",
     propertyValue: 1500000,
     monthlyIncome: 8000
   });

   // Update lead data with assigned broker BEFORE messages
   processedLeadData.brokerPersona = {
     id: brokerId,
     name: brokerName
   };

   // Store in Chatwoot customAttributes
   await chatwootClient.updateConversationAttributes(conversation.id, {
     ai_broker_assigned: true,
     ai_broker_name: brokerName,
     ai_broker_id: brokerId
   });
   ```

4. **Message Posting Sequence** (NEW - Synchronous):
   ```javascript
   // Handled by broker-engagement-manager.ts
   await brokerEngagementManager.handleNewConversation({
     conversationId: conversation.id,
     leadData: processedLeadData
   });

   // Posts messages in sequence:
   // 1. "reviewing your details" activity message (immediate)
   // 2. Synchronous wait 2000ms (Railway-safe, no setTimeout)
   // 3. "joined the conversation" activity message
   // 4. Personalized greeting from assigned broker
   ```

5. **API Response** (NEW - Returns Broker):
   ```javascript
   return {
     conversationId: conversation.id,
     widgetConfig: {
       customAttributes: {
         ai_broker_name: brokerName,
         ai_broker_id: brokerId
       }
     }
   }
   ```

**Key Improvements**:
- ✅ Broker assigned BEFORE messages (eliminates race conditions)
- ✅ Synchronous 2s wait (Railway-safe, no setTimeout)
- ✅ Single source of truth (Supabase `ai_brokers` table)
- ✅ Broker name consistent across all systems
- ✅ No duplicate queue messages

#### Step 4: Frontend State Propagation (NEW - 2025-10-01)

**Flow**: API Response → ChatTransitionScreen → sessionStorage → InsightsPage → Chat UI

1. **ChatTransitionScreen Receives Broker**:
   ```typescript
   // components/forms/ChatTransitionScreen.tsx
   const { widgetConfig } = apiResponse;
   const brokerName = widgetConfig?.customAttributes?.ai_broker_name;

   // Store in sessionStorage for persistence across redirects
   sessionStorage.setItem('chatBrokerData', JSON.stringify({
     broker_name: brokerName,
     broker_id: widgetConfig?.customAttributes?.ai_broker_id
   }));

   // Redirect to /apply/insights
   router.push(`/apply/insights?conversation=${conversationId}`);
   ```

2. **InsightsPageClient Reads Broker**:
   ```typescript
   // app/apply/insights/page.tsx
   const [brokerData, setBrokerData] = useState<BrokerData | null>(null);

   useEffect(() => {
     const storedData = sessionStorage.getItem('chatBrokerData');
     if (storedData) {
       const parsed = JSON.parse(storedData);
       setBrokerData(parsed);
     }
   }, []);

   // Pass to ResponsiveBrokerShell
   <ResponsiveBrokerShell
     conversationId={conversationId}
     brokerName={brokerData?.broker_name}
   />
   ```

3. **ResponsiveBrokerShell Propagates to Chat**:
   ```typescript
   // components/chat/ResponsiveBrokerShell.tsx
   <IntegratedBrokerChat
     conversationId={conversationId}
     brokerName={brokerName} // From props
   />
   ```

4. **IntegratedBrokerChat Displays Broker**:
   ```typescript
   // components/chat/IntegratedBrokerChat.tsx
   <div className="chat-header">
     <h3>Chat with {brokerName || 'AI Specialist'}</h3>
   </div>
   ```

**Result**:
- Broker name consistent from API → sessionStorage → Chat UI
- No flash of "AI Specialist" before broker name appears
- User redirected to `/apply/insights?conversation={conversationId}`
- Chat header displays correct broker name immediately

#### Step 5: n8n Workflow Activation

When conversation status is "bot", the n8n workflow receives a webhook from Chatwoot:

```json
{
  "event": "conversation_created",
  "conversation": {
    "id": 123,
    "custom_attributes": {
      "lead_score": 85,
      "status": "bot"
    }
  }
}
```

**Broker Assignment Logic**:
- Score 85+ → Marcus Chen or Ahmad Ibrahim
- Score 70-84 → Rachel Tan
- Score 50-69 → Sarah Wong
- Score <50 → David Lim

**Queries Supabase for**:
- Broker profile and personality
- Previous conversation history
- Learning data and successful phrases

#### Step 6: AI Response Generation

**System Prompt with Broker Persona**:
```
You are Marcus Chen, an aggressive investment property specialist.
- Personality: Direct, results-driven, time-conscious
- Speaking style: Professional but pushy, uses urgency
- Goal: Convert high-value leads quickly
- Include occasional Singlish: "Wah, your income very solid!"
```

**Context Included**:
- Lead form data
- Lead score and analysis
- Conversation history
- Property market data

**Response Generated by GPT-3.5/4**

#### Step 7: Message Delivery

n8n sends to Chatwoot API:
```javascript
POST /api/v1/accounts/{account}/conversations/{id}/messages
{
  content: "Hi John! I'm Marcus Chen...",
  message_type: "outgoing",
  private: false
}
```

User sees in chat:
- Broker profile with photo
- Typing indicator
- AI-generated response
- Quick action buttons

#### Step 8: Ongoing Conversation Loop

1. User sends message → Chatwoot webhook → n8n
2. n8n processes with context and persona
3. OpenAI generates contextual response
4. Response sent back to user

#### Step 9: Handoff Triggers

**Automatic triggers in n8n**:
- User says: "speak to human", "real person", "agent"
- User says: "ready to apply", "let's proceed"
- High engagement: 7+ messages with score 80+
- Frustration detected: negative sentiment
- Complex situation: divorce, bankruptcy mentioned

**When triggered**:
1. n8n changes conversation status from "bot" to "open"
2. Sends internal note about handoff reason
3. Human agent receives notification
4. Conversation continues with human

### 3.3 Message Role Contract

**Status**: ✅ Implemented as of 2025-10-18 (commits: 5b75526, 28b1fe7, 6e7b4de)

The `/api/chat/messages` endpoint returns normalized message objects with a `role` field that simplifies UI rendering and eliminates ambiguity between user, agent, and system messages.

#### Response Format

```typescript
{
  id: string
  content: string
  role: 'user' | 'agent' | 'system'  // NEW FIELD
  message_type: number               // Preserved for backward compatibility
  created_at: string
  private: boolean
  sender: {
    name: string
    avatar_url: string | null
    type: 'contact' | 'agent' | 'bot' | 'system'
  } | null
  original: object                   // Raw Chatwoot payload for debugging
}
```

#### Role Derivation Logic

**Implementation**: `app/api/chat/messages/route.ts:122-144`

The server derives the `role` field using a priority-based algorithm:

1. **Check `message_type` first** (primary indicator):
   - `message_type === 2` → `role: 'system'` (activity messages)
   - `message_type === 1` → `role: 'agent'` (outgoing messages)
   - `message_type === 0` → `role: 'user'` (incoming messages)

2. **Fall back to `sender.type`** (secondary indicator):
   - `sender.type === 'system'` → `role: 'system'`
   - `sender.type === 'agent'` OR `'bot'` → `role: 'agent'`
   - `sender.type === 'contact'` → `role: 'user'`

3. **Special case for private messages**:
   - If `private: true`, force `role: 'agent'` (internal notes)

```typescript
// Simplified example from route.ts:122-144
let role: 'user' | 'agent' | 'system' = 'agent'

if (msg.message_type === 2) {
  role = 'system'
} else if (msg.message_type === 1) {
  role = 'agent'
} else if (msg.message_type === 0) {
  role = 'user'
} else if (msg.sender?.type === 'system') {
  role = 'system'
}

if (msg.private) {
  role = 'agent'  // Override for private messages
}
```

#### System Message Rendering

**Implementation**: `components/chat/EnhancedChatInterface.tsx:366-372`

System messages render as centered status chips without avatars:

```tsx
// Example system message rendering
if (messageRole === 'system') {
  return (
    <div className="flex justify-center my-2">
      <div className="px-3 py-1 bg-mist/70 text-graphite text-xs text-center rounded-md border border-fog/70">
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  )
}
```

**Visual Design**:
- Centered alignment (no left/right bias)
- Subtle background (`bg-mist/70`)
- Small text (`text-xs`)
- No avatar or sender name
- Border for visual separation

#### Boilerplate Filtering

**Implementation**: `components/chat/CustomChatInterface.tsx:51-54`

Noisy Chatwoot automation events are hidden from the UI:

```typescript
const hiddenActivityPatterns = [
  /conversation was reopened/i,
  /added property/i
]

// Applied during system message rendering:
const shouldHide = hiddenActivityPatterns.some(pattern => 
  pattern.test(message.content || '')
)
```

**Rationale**: 
- Reduces clutter in chat UI
- Preserves messages in database for audit trail
- User sees only meaningful status updates ("Sarah is joining the conversation")

#### Activity Message Creation

**Implementation**: `lib/integrations/chatwoot-client.ts:651-723`

When creating system messages (e.g., broker join notifications):

```typescript
// Primary: Use Chatwoot activity endpoint
POST /api/v1/accounts/:accountId/conversations/:conversationId/activities
{
  action: 'conversation_activity',
  content: 'Sarah Wong is joining the conversation'
}

// Response: 204 No Content (success)

// Fallback: Use messages endpoint with message_type: 2
POST /api/v1/accounts/:accountId/conversations/:conversationId/messages
{
  content: 'Sarah Wong is joining the conversation',
  message_type: 2  // Forces system classification
}
```

**Graceful Degradation**:
- Tries `/activities` endpoint first (Chatwoot's official API)
- Handles 204 No Content correctly
- Falls back to `/messages` with `message_type: 2` if activities endpoint fails
- Logs errors but doesn't expose implementation details to caller

#### Testing the Contract

**Verify role normalization**:
```bash
# Fetch messages for a conversation
curl http://localhost:3000/api/chat/messages?conversationId=123

# Expected: All messages have 'role' field
# System messages: role === 'system'
# Agent messages: role === 'agent'
# User messages: role === 'user'
```

**Verify UI rendering**:
1. Send test message → Should appear as customer bubble (right-aligned)
2. Agent responds → Should appear as agent bubble with avatar (left-aligned)
3. Broker joins → Should appear as centered system chip (no avatar)
4. Automation events → Should be hidden from view

**Common Issues**:
- Missing `role` field → Check API response format
- System messages showing as agent → Check `message_type === 2` handling
- Boilerplate visible → Update `hiddenActivityPatterns` regex
- Avatar showing for system → Check UI conditional rendering

---

### 3.4 Integration Points

Key API routes in NextNest:
- `C:\Users\HomePC\Desktop\Code\NextNest\app\api\chatwoot-conversation\route.ts` - Conversation creation
- `C:\Users\HomePC\Desktop\Code\NextNest\app\api\chatwoot-webhook\route.ts` - Webhook receiver
- `C:\Users\HomePC\Desktop\Code\NextNest\app\api\contact\route.ts` - Contact management

**Port Reference**: All local development uses `http://localhost:3000`

### 3.5 Visual Elements in Chat UI

#### Broker Profile Display
```javascript
const BrokerProfile = ({ broker }) => (
  <div className="broker-profile">
    <img src={broker.photo_url} alt={broker.name} />
    <div className="broker-info">
      <h3>{broker.name}</h3>
      <p>{broker.tagline}</p>
      <div className="broker-stats">
        <span>⭐ {broker.satisfaction}/5</span>
        <span>💬 {broker.total_conversations} chats</span>
        <span>✅ {broker.conversion_rate}% success</span>
      </div>
    </div>
    <div className="broker-status">
      <span className="typing-indicator">Sarah is typing...</span>
    </div>
  </div>
);
```

#### Handoff Transition
```javascript
const HandoffTransition = ({ fromBroker, toHuman }) => (
  <div className="handoff-transition">
    <div className="handoff-message">
      <p>🤝 {fromBroker.name} has prepared everything for you.</p>
      <p>Brent is now joining the conversation...</p>
    </div>
    <div className="handoff-summary">
      <h4>Quick Summary:</h4>
      <ul>
        <li>Lead Score: {leadScore}/100</li>
        <li>Ready for: {loanType}</li>
        <li>Discussed: {topicsDiscussed.join(', ')}</li>
        <li>Next Step: {recommendedAction}</li>
      </ul>
    </div>
  </div>
);
```

### 3.6 Testing Scenarios

#### Test Case 1: High-Value Lead
**Input**:
- Income: $15,000/month
- Property: $2,000,000 condo
- Employment: Stable

**Expected**:
- Marcus Chen or Ahmad Ibrahim assigned
- Aggressive, investment-focused responses
- Quick handoff trigger (5-6 messages)

#### Test Case 2: First-Time Buyer
**Input**:
- Income: $5,000/month
- Property: $500,000 HDB
- Employment: Recently started

**Expected**:
- Sarah Wong assigned
- Balanced, educational responses
- Patient handoff approach (8-10 messages)

#### Test Case 3: Conservative Buyer
**Input**:
- Income: $3,500/month
- Property: $400,000 HDB
- Age: 55+

**Expected**:
- David Lim assigned
- Conservative, careful responses
- Very patient handoff (10-12 messages)

---

## 4. Optimization & Monitoring

### 4.1 Learning Algorithm

**n8n Scheduled Workflow** (runs daily):

```javascript
{
  "name": "Daily Broker Optimization",
  "type": "code",
  "code": `
    // Analyze yesterday's performance
    const performances = await db.query(\`
      SELECT
        broker_id,
        AVG(CASE WHEN handoff_triggered THEN 1 ELSE 0 END) as handoff_rate,
        AVG(CASE WHEN converted THEN 1 ELSE 0 END) as conversion_rate,
        AVG(messages_exchanged) as avg_messages,
        array_agg(DISTINCT customer_type) as successful_segments
      FROM broker_assignments
      WHERE assigned_at > NOW() - INTERVAL '1 day'
      GROUP BY broker_id
    \`);

    // Update each broker's profile
    for (const perf of performances) {
      // Adjust optimal lead score range
      if (perf.conversion_rate > 0.3) {
        await db.query(\`
          UPDATE ai_brokers
          SET
            optimal_lead_score_min = optimal_lead_score_min - 5,
            optimal_lead_score_max = optimal_lead_score_max + 5
          WHERE id = $1
        \`, [perf.broker_id]);
      }

      // Update best customer types
      await db.query(\`
        UPDATE ai_brokers
        SET best_customer_types = $1
        WHERE id = $2
      \`, [perf.successful_segments, perf.broker_id]);
    }
  `
}
```

### 4.2 Performance Metrics

#### A/B Testing Different Approaches
```sql
-- Track which phrases work best
CREATE TABLE broker_phrase_performance (
  broker_id UUID,
  phrase TEXT,
  context VARCHAR(50),
  times_used INTEGER,
  led_to_handoff INTEGER,
  led_to_conversion INTEGER,
  effectiveness_score DECIMAL(5,2)
);

-- Example: Marcus learns that "exclusive deal" works better than "limited time"
UPDATE ai_brokers
SET successful_phrases = array_append(successful_phrases, 'exclusive deal')
WHERE id = 'marcus-chen-uuid';
```

#### Key Performance Indicators

**Per Broker**:
- Conversion Rate: Target 25-35%
- Handoff Rate: Target 70-80%
- Avg Messages to Handoff: Target 6-10
- Customer Satisfaction: Target 4.0+/5.0
- Successful Handoff Rate: Target 75%+

**System-Wide**:
- Assignment Accuracy: Right broker for right customer
- Response Time: <2-3 seconds average
- Handoff to Application Ratio: 60%+
- Overall Conversion Rate: 28%+ across all brokers

### 4.3 Monitoring Dashboard

```javascript
const BrokerDashboard = () => {
  return (
    <div className="dashboard">
      <h2>AI Broker Performance</h2>

      {brokers.map(broker => (
        <div className="broker-card">
          <img src={broker.photo} />
          <h3>{broker.name}</h3>

          <div className="metrics">
            <div>Conversations Today: {broker.todayConversations}</div>
            <div>Current Active: {broker.currentActive}</div>
            <div>Handoff Rate: {broker.handoffRate}%</div>
            <div>Conversion Rate: {broker.conversionRate}%</div>
            <div>Avg Rating: {broker.avgRating}/5</div>
          </div>

          <div className="best-performing">
            <h4>Best With:</h4>
            <ul>
              {broker.bestSegments.map(segment => (
                <li>{segment}: {segment.successRate}%</li>
              ))}
            </ul>
          </div>

          <div className="recent-learnings">
            <h4>Recent Insights:</h4>
            <p>{broker.latestLearning}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 4.4 Daily Performance Query

```sql
-- Daily performance summary
SELECT
  b.name,
  b.photo_url,
  COUNT(bc.id) as conversations_today,
  COUNT(bc.id) FILTER (WHERE bc.handoff_triggered) as handoffs,
  COUNT(bc.id) FILTER (WHERE bc.converted) as conversions,
  ROUND(AVG(bc.messages_exchanged), 1) as avg_messages
FROM ai_brokers b
LEFT JOIN broker_assignments bc ON b.id = bc.broker_id
WHERE DATE(bc.assigned_at) = CURRENT_DATE
GROUP BY b.id, b.name, b.photo_url;
```

### 4.5 Learning Insights Query

```sql
-- See what's working
SELECT
  b.name,
  bl.successful_phrases,
  bl.successful_tactics,
  bl.learned_preferences,
  bl.recommended_adjustments
FROM broker_learning bl
JOIN ai_brokers b ON bl.broker_id = b.id
ORDER BY bl.created_at DESC
LIMIT 20;
```

### 4.6 Advanced Features (Optional)

#### Voice Messages with TTS
```javascript
// Using OpenAI TTS
const generateVoiceMessage = async (text, brokerId) => {
  const broker = await getBrokerProfile(brokerId);

  const audio = await openai.audio.speech.create({
    model: "tts-1",
    voice: broker.voice_model, // Different voice for each broker
    input: text,
    speed: broker.speaking_speed // Marcus: 1.1, David: 0.9
  });

  return audio;
};
```

#### Dynamic Broker Availability
```javascript
const BrokerAvailability = () => {
  const [availableBrokers, setAvailableBrokers] = useState([]);

  useEffect(() => {
    const checkAvailability = async () => {
      const brokers = await fetch('/api/brokers/availability');
      setAvailableBrokers(brokers.filter(b =>
        b.current_conversations < b.max_concurrent_conversations
      ));
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="broker-availability">
      <h4>Available Brokers:</h4>
      {availableBrokers.map(broker => (
        <div key={broker.id} className="broker-status">
          <img src={broker.photo} />
          <span className="online-dot" />
          <span>{broker.name}</span>
          <span>{5 - broker.current_conversations} slots available</span>
        </div>
      ))}
    </div>
  );
};
```

### 4.7 Maintenance Tasks

#### Daily
- Check n8n execution logs for errors
- Monitor conversion rates by broker
- Review handoff success rates
- Verify message delivery times

#### Weekly
- Analyze broker performance trends
- Update successful phrases database
- Adjust optimal lead score ranges
- Review customer feedback

#### Monthly
- Optimize assignment algorithm based on data
- Update broker profiles with learning insights
- Analyze conversion patterns by segment
- Review and refine handoff triggers

---

## 5. Troubleshooting

### 5.1 Common Issues

#### Issue: No AI Response
**Symptoms**: User sends message, no response from bot

**Debug Steps**:
1. Check n8n workflow is Active
2. Verify webhook URL in Chatwoot bot settings matches n8n
3. Confirm conversation has `status: "bot"` attribute
4. Review n8n execution logs for errors
5. Verify OpenAI API key is valid
6. Check Supabase connection in n8n

**Solution**:
```bash
# Test webhook manually
curl -X POST https://your-n8n-instance.railway.app/webhook/chatwoot-ai-broker \
  -H "Content-Type: application/json" \
  -d '{"event":"message_created","conversation":{"id":123,"status":"bot"}}'
```

#### Issue: Wrong Broker Assigned
**Symptoms**: High-value lead gets conservative broker

**Debug Steps**:
1. Check lead score calculation in form submission
2. Verify broker availability in database
3. Review assignment function logic in n8n
4. Check `optimal_lead_score_min/max` in `ai_brokers` table
5. Verify workload limits not exceeded

**Solution**:
```sql
-- Check broker availability and ranges
SELECT name, is_active, current_conversations,
       optimal_lead_score_min, optimal_lead_score_max
FROM ai_brokers
WHERE is_active = true;

-- Reset workload if needed
UPDATE ai_brokers SET current_conversations = 0;
```

#### Issue: No Handoff Happening
**Symptoms**: Conversation continues with bot indefinitely

**Debug Steps**:
1. Verify conversation status changes in Chatwoot
2. Check handoff triggers in n8n workflow
3. Ensure human agents are available and online
4. Review urgency calculations
5. Check message count threshold

**Solution**:
```javascript
// Manual handoff via n8n
await updateConversation(conversationId, {
  status: 'open',
  custom_attributes: {
    handoff_from_broker: broker.name,
    handoff_reason: 'Manual intervention',
    handoff_urgency: 'high'
  }
});
```

#### Issue: Bot Responds to Human Agent
**Symptoms**: Bot interferes with human conversation

**Debug Steps**:
1. Check conversation status is "open" not "bot"
2. Verify webhook filters in n8n
3. Ensure bot is properly unassigned

**Solution**:
```javascript
// In n8n webhook node, add filter:
if (conversation.status !== 'bot') {
  return; // Skip bot processing
}
```

#### Issue: Database Connection Fails
**Symptoms**: n8n can't query broker profiles

**Debug Steps**:
1. Verify Supabase credentials in n8n
2. Check database URL format
3. Confirm SSL mode is enabled
4. Test connection from n8n PostgreSQL node

**Solution**:
```bash
# Test connection string
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

### 5.2 Monitoring Points

#### n8n Metrics
- Workflow execution success rate: Target 98%+
- Average response time: Target <2 seconds
- OpenAI API usage and costs
- Error rates by node
- Webhook delivery success

#### Chatwoot Metrics
- Conversation creation rate
- Message delivery success: Target 99%+
- Handoff completion rate
- Agent response time after handoff
- Bot assignment accuracy

#### Business Metrics
- Lead score distribution across brokers
- Broker assignment accuracy: Target 90%+
- Conversion rates by broker: Target 25-35%
- Handoff to application ratio: Target 60%+
- Customer satisfaction scores

### 5.3 Success Indicators

#### Technical Success
- ✅ Conversations created with correct attributes
- ✅ n8n workflow triggered automatically
- ✅ AI responses generated within 2-3 seconds
- ✅ Smooth handoff to human agents
- ✅ No duplicate messages or loops

#### Business Success
- ✅ 70-80% of conversations reach handoff
- ✅ 25-35% convert to applications
- ✅ Consistent broker personalities across conversations
- ✅ Positive customer feedback (4.0+/5.0)
- ✅ Reduced time-to-handoff with maintained quality

---

## Implementation Timeline

### Phase 1: Basic Personas (Week 1)
- ✅ Create 5 broker profiles in database
- ✅ Set up broker assignment logic
- Implement personality in OpenAI prompts
- Test broker selection algorithm

### Phase 2: Visual Integration (Week 2)
- ✅ Add broker photos to chat UI
- Implement typing indicators
- Create handoff animations
- Design broker profile displays

### Phase 3: Learning System (Week 3)
- Track performance metrics
- Implement optimization algorithms
- A/B test different approaches
- Build feedback loops

### Phase 4: Advanced Features (Week 4)
- Add voice messages (optional)
- Implement broker availability display
- Create performance dashboards
- Optimize based on real data

---

## Related Documentation

- [Chatwoot Complete Setup](C:\Users\HomePC\Desktop\Code\NextNest\docs\runbooks\chatops\CHATWOOT_COMPLETE_SETUP_GUIDE.md)
- [n8n Workflows](C:\Users\HomePC\Desktop\Code\NextNest\n8n-workflows\)
- [Database Schema](C:\Users\HomePC\Desktop\Code\NextNest\database\ai-brokers-schema.sql)
- [Broker Assets](C:\Users\HomePC\Desktop\Code\NextNest\public\images\brokers\)

---

## Recent Changes & Awareness Notes

### Property-Type-Aware AI Insights (2025-10-18)
**Commit:** `c55f4c3`
**Impact:** AI refinance insights now adapt to property type

**What Changed:**
- `app/api/ai-insights/route.ts` now uses `getPlaceholderRate()` for market rate comparisons
- Rate opportunity detection adapts to property type (HDB: 2.1%, Private: 2.6%, Commercial: 3.0%)
- AI insights trigger only when current rate exceeds property-specific market rate

**Example Impact:**
- **Before:** HDB refinance with 2.5% rate would trigger "savings opportunity" (vs hardcoded 3.0%)
- **After:** HDB refinance with 2.5% rate correctly shows as "above market" (vs 2.1% HDB refinance rate)

**Testing Recommendations:**
- Test AI insights for HDB refinance scenarios (should trigger at lower rates)
- Test AI insights for Commercial refinance scenarios (should trigger at higher rates)
- Verify urgency levels adapt correctly across property types

**Related Files:**
- Source function: `lib/calculations/instant-profile.ts:862-870` (`getPlaceholderRate`)
- AI insights logic: `app/api/ai-insights/route.ts:106-122`
- Function usage audit: `docs/plans/active/2025-10-18-function-usage-audit-plan.md`

**Deferred Opportunities:**
- Using full `calculateRefinancingSavings()` for break-even and lifetime savings in AI insights (MEDIUM priority)
- See audit plan lines 339-345 for implementation details

---

**Last Updated**: 2025-10-18
**Status**: Canonical - Use this guide as the single source of truth for AI broker implementation
