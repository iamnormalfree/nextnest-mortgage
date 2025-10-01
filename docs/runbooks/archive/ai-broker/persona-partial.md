> **⚠️ MERGED**: This partial guide is now part of a comprehensive document.
> **Use instead**: [AI Broker Complete Guide](../AI_BROKER_COMPLETE_GUIDE.md)
> **Archived**: 2025-10-01
> **Reason**: Consolidated to reduce overlap and improve maintainability

[Original content below]
---


# Multi-Persona AI Broker System with Learning & Optimization

## System Overview

Create 4-5 persistent AI brokers with distinct personalities, appearances, and evolving profiles that optimize for conversion over time.

## The AI Broker Team

### 1. Marcus Chen - The Closer
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

### 2. Sarah Wong - The Educator
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

### 3. David Lim - The Relationship Builder
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

### 4. Rachel Tan - The Tech-Savvy Millennial
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

### 5. Ahmad Ibrahim - The Network Specialist
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

## Implementation Architecture

### Database Schema (Supabase/PostgreSQL)

```sql
-- AI Broker Profiles Table
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

-- Conversation Assignments Table
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

-- Broker Learning History
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

-- Performance Analytics
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

## n8n Workflow Implementation

### Master Workflow: Intelligent Broker Assignment

```javascript
// Node 1: Webhook Receiver
{
  "name": "Receive Chatwoot Message",
  "type": "webhook",
  "path": "chatwoot-ai-broker"
}

// Node 2: Get Customer Profile
{
  "name": "Fetch Lead Data",
  "type": "code",
  "code": `
    const conversation = $input.first().json.conversation;
    const attributes = conversation.custom_attributes || {};
    
    return {
      customerId: conversation.contact_id,
      name: attributes.name,
      leadScore: attributes.lead_score || 50,
      loanType: attributes.loan_type,
      propertyType: attributes.property_category,
      income: attributes.monthly_income,
      timeline: attributes.purchase_timeline,
      employmentType: attributes.employment_type,
      previousBroker: attributes.assigned_broker
    };
  `
}

// Node 3: Smart Broker Selection
{
  "name": "Select Best Broker",
  "type": "code",
  "code": `
    const customer = $input.first().json;
    
    // Broker selection algorithm
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
        // Lead score match
        if (customer.leadScore >= broker.optimal.minScore && 
            customer.leadScore <= broker.optimal.maxScore) {
          broker.score += 30;
        }
        
        // Timeline match
        if (customer.timeline === 'urgent' && broker.strengths.includes('urgent')) {
          broker.score += 20;
        }
        
        // Customer type match
        if (customer.employmentType === 'tech' && broker.strengths.includes('tech')) {
          broker.score += 15;
        }
        
        // Property type match
        if (customer.propertyType === 'hdb' && broker.strengths.includes('hdb')) {
          broker.score += 15;
        }
        
        // Income level match
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
    
    const selectedBroker = selectBroker(customer);
    
    return {
      brokerId: selectedBroker.id,
      brokerName: selectedBroker.name,
      matchScore: selectedBroker.score,
      customer: customer
    };
  `
}

// Node 4: Load Broker Personality & History
{
  "name": "Get Broker Profile",
  "type": "postgres",
  "query": `
    SELECT 
      name, personality_style, approach, voice_description,
      photo_url, background, strengths, weaknesses,
      conversion_rate, avg_messages_to_handoff
    FROM ai_brokers 
    WHERE slug = '{{$json.brokerId}}'
  `
}

// Node 5: Get Conversation History
{
  "name": "Fetch Previous Messages",
  "type": "httpRequest",
  "url": "https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{$json.conversation.id}}/messages"
}

// Node 6: Generate Personalized Response
{
  "name": "OpenAI with Broker Persona",
  "type": "openAi",
  "messages": [
    {
      "role": "system",
      "content": `You are {{broker.name}}, a {{broker.age}}-year-old mortgage broker in Singapore.

PERSONALITY & STYLE:
- Background: {{broker.background}}
- Voice: {{broker.voice_description}}
- Approach: {{broker.approach}}
- Strengths: {{broker.strengths}}
- Current conversion rate: {{broker.conversion_rate}}%

CUSTOMER PROFILE:
- Name: {{customer.name}}
- Lead Score: {{customer.leadScore}}/100
- Loan Type: {{customer.loanType}}
- Income: S${{customer.income}}
- Timeline: {{customer.timeline}}

CONVERSATION CONTEXT:
This is message #{{messageCount}} in our conversation.
Previous topics discussed: {{previousTopics}}

YOUR OBJECTIVES:
1. Build rapport using your unique personality
2. Address their specific needs based on profile
3. Guide toward handoff when ready (target: {{broker.avg_messages_to_handoff}} messages)
4. Use phrases that have worked before: {{broker.successful_phrases}}

IMPORTANT:
- Stay consistently in character as {{broker.name}}
- Reference your background naturally
- Use your typical voice and mannerisms
- Mention your experience when relevant
- If customer seems ready, suggest speaking directly`
    },
    {
      "role": "user",
      "content": "{{$json.message.content}}"
    }
  ]
}

// Node 7: Check Handoff Triggers
{
  "name": "Analyze for Handoff",
  "type": "code",
  "code": `
    const response = $input.first().json;
    const broker = $input.all()[1].json;
    const messageCount = $input.all()[2].json.messageCount;
    
    let shouldHandoff = false;
    let handoffReason = '';
    let urgencyLevel = 'normal';
    
    // Check various handoff triggers
    const userMessage = response.userMessage.toLowerCase();
    
    // Direct request
    if (userMessage.includes('speak') && userMessage.includes('human')) {
      shouldHandoff = true;
      handoffReason = 'Customer requested human agent';
      urgencyLevel = 'high';
    }
    
    // High intent signals
    else if (userMessage.includes('ready to apply') || 
             userMessage.includes('let\\'s proceed')) {
      shouldHandoff = true;
      handoffReason = 'Customer ready to proceed with application';
      urgencyLevel = 'high';
    }
    
    // Optimal handoff point for this broker
    else if (messageCount >= broker.avg_messages_to_handoff && 
             response.customer.leadScore >= 75) {
      shouldHandoff = true;
      handoffReason = 'Optimal handoff point reached for conversion';
      urgencyLevel = 'medium';
    }
    
    // Frustration detection
    else if (userMessage.includes('frustrated') || 
             userMessage.includes('not helpful')) {
      shouldHandoff = true;
      handoffReason = 'Customer showing frustration';
      urgencyLevel = 'high';
    }
    
    return {
      shouldHandoff,
      handoffReason,
      urgencyLevel,
      brokerId: broker.id,
      messageCount
    };
  `
}

// Node 8: Send Response with Broker Signature
{
  "name": "Send to Chatwoot",
  "type": "httpRequest",
  "method": "POST",
  "url": "https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{conversationId}}/messages",
  "body": {
    "content": "{{aiResponse}}\n\n---\n*{{broker.name}}*\n*{{broker.tagline}}*",
    "message_type": "outgoing"
  }
}

// Node 9: Update Broker Performance
{
  "name": "Track Performance",
  "type": "postgres",
  "query": `
    UPDATE broker_assignments
    SET 
      messages_exchanged = messages_exchanged + 1,
      handoff_triggered = {{shouldHandoff}},
      handoff_reason = '{{handoffReason}}'
    WHERE conversation_id = {{conversationId}}
    RETURNING *;
  `
}

// Node 10: If Handoff, Update Conversation
{
  "name": "Trigger Human Handoff",
  "type": "httpRequest",
  "method": "PATCH",
  "url": "https://chat.nextnest.sg/api/v1/accounts/1/conversations/{{conversationId}}",
  "body": {
    "status": "open",
    "custom_attributes": {
      "handoff_from_broker": "{{broker.name}}",
      "handoff_reason": "{{handoffReason}}",
      "handoff_urgency": "{{urgencyLevel}}"
    }
  }
}
```

## Visual Elements in Chat UI

### Broker Profile Display
```javascript
// In your NextNest chat component
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

### Handoff Transition
```javascript
// Smooth handoff animation
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

## Performance Optimization System

### A/B Testing Different Approaches
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

### Learning Algorithm (n8n Scheduled Workflow)
```javascript
// Runs daily to optimize broker profiles
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
        // This broker is doing well with current segment
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

## Voice & Multimedia Integration

### Text-to-Speech for Voice Notes
```javascript
// Using ElevenLabs or OpenAI TTS
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

### Dynamic Broker Availability
```javascript
// Show which brokers are "online"
const BrokerAvailability = () => {
  const [availableBrokers, setAvailableBrokers] = useState([]);
  
  useEffect(() => {
    // Fetch current broker workload
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

## Implementation Timeline

### Phase 1: Basic Personas (Week 1)
- Create 5 broker profiles in database
- Set up broker assignment logic
- Implement personality in OpenAI prompts

### Phase 2: Visual Integration (Week 2)
- Add broker photos to chat UI
- Implement typing indicators
- Create handoff animations

### Phase 3: Learning System (Week 3)
- Track performance metrics
- Implement optimization algorithms
- A/B test different approaches

### Phase 4: Advanced Features (Week 4)
- Add voice messages
- Implement broker availability
- Create performance dashboards

## Monitoring Dashboard

```javascript
// Real-time broker performance dashboard
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

This creates a realistic multi-broker AI system that feels like a real mortgage brokerage with actual people!