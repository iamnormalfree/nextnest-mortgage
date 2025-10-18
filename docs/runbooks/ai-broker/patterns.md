# AI Broker Patterns

**Purpose:** Design patterns and technical learnings for AI broker chat implementation

---

## WPM-Based Typing Calculation

**Source:** `_archived/api/chatwoot-enhanced-flow/route.ts` (lines 304-320)

### Algorithm

Creates realistic typing delays based on message length and broker personality.

```typescript
function calculateNaturalTypingTime(message: string, broker: any): number {
  // Base: 40-60 words per minute typing speed
  const words = message.split(' ').length
  const baseWPM = broker.personality === 'aggressive' ? 55 :
                  broker.personality === 'conservative' ? 45 : 50

  const baseTime = (words / baseWPM) * 60 * 1000

  // Add thinking time (1-2 seconds)
  const thinkingTime = 1000 + Math.random() * 1000

  // Add variation (±20%)
  const variation = baseTime * 0.2
  const typingTime = baseTime + thinkingTime + (Math.random() * variation * 2 - variation)

  return Math.floor(typingTime)
}
```

### Parameters
- **Aggressive brokers**: 55 WPM (faster, confident)
- **Balanced brokers**: 50 WPM (moderate pace)
- **Conservative brokers**: 45 WPM (thoughtful, measured)

### Constraints
From archived route.ts line 179:
```typescript
const waitTime = Math.min(Math.max(typingTime, 2000), 8000)
```

- **Minimum delay**: 2 seconds (prevents instant robotic responses)
- **Maximum delay**: 8 seconds (prevents frustrating waits)

### Application
Use this pattern when implementing AI broker chat interfaces to create natural, human-like response timing.

---

## Serverless setTimeout Limitations

### Problem
The archived webhook (`_archived/api/chatwoot-enhanced-flow/route.ts`) used `setTimeout` for delays:

```typescript
// ❌ UNRELIABLE in serverless environments
await new Promise(resolve => setTimeout(resolve, joinDelay))  // Line 91
await new Promise(resolve => setTimeout(resolve, 1500))       // Line 100
await new Promise(resolve => setTimeout(resolve, 2000))       // Line 156
await new Promise(resolve => setTimeout(resolve, waitTime))   // Line 180
```

### Why This Failed
1. **Railway/Vercel timeout limits**: Requests timeout after 10-30 seconds
2. **Race conditions**: Messages could arrive out of order
3. **No guarantee of execution**: Serverless functions can be terminated mid-execution
4. **Connection timeouts**: Long-running connections drop

### Solution Implemented
**Synchronous orchestration** in `lib/engagement/broker-engagement-manager.ts`:

```typescript
// ✅ RELIABLE approach
export async function postBrokerSequence(conversationId: number, broker: any) {
  // 1. Post "reviewing" message
  await postMessage(conversationId, "I'm reviewing your information...")

  // 2. Wait 2 seconds (synchronous, blocking)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 3. Post "joined" message
  await postMessage(conversationId, `${broker.name} joined the conversation`)

  // 4. Post greeting
  await postMessage(conversationId, generateGreeting(broker))
}
```

### Key Difference
- Old: Webhook triggered async, hoped messages arrived in order
- New: Orchestrator controls sequence, waits synchronously, guarantees order

### Lesson Learned
**Never use setTimeout in serverless webhooks for sequencing.** Use synchronous orchestration with guaranteed execution order.

---

## Broker Name Mismatch Bug (Why Archived Was Deleted)

### Root Cause
The archived webhook had **random broker selection** that conflicted with Supabase assignments:

```typescript
// ❌ WRONG - From _archived route.ts lines 199-218
function selectBrokerForLead(attributes: any) {
  const leadScore = attributes.lead_score || 50

  if (leadScore >= 80) {
    // High-value: Michelle or Jasmine
    const brokers = ['michelle-chen', 'jasmine-lee']
    const selected = brokers[Math.floor(Math.random() * brokers.length)]  // RANDOM!
    return AI_BROKERS[selected]
  }
  // ...
}
```

### What Went Wrong
1. **Supabase assigned** broker during conversation creation
2. **Webhook randomly selected** different broker on message event
3. **UI showed** Supabase broker in header
4. **Chat showed** webhook broker in greeting
5. **Result**: "Sarah Wong" in header, "Michelle Chen" in chat message

### Fix Implemented
**Single source of truth** in `/app/api/chatwoot-conversation/route.ts`:

```typescript
// ✅ CORRECT - Assign BEFORE posting messages
const { brokerId, brokerName } = await assignBestBroker(leadData);
processedLeadData.brokerPersona = {
  id: brokerId,
  name: brokerName
};

// Store in customAttributes for UI
customAttributes.ai_broker_name = brokerName;

// Then orchestrator uses THIS broker for all messages
await postBrokerSequence(conversationId, { name: brokerName });
```

### Pattern to Follow
1. **Assign broker ONCE** during conversation creation
2. **Store in database** (Supabase `ai_brokers` table)
3. **Propagate to all systems** via customAttributes
4. **Never re-select** on subsequent events

---

## Natural Conversation Flow Pattern

### Greeting Generation by Personality

From archived route.ts lines 223-253, personality-specific greetings:

```typescript
function generatePersonalizedGreeting(attributes: any, broker: any): string {
  const name = attributes.name || 'there'
  const propertyType = attributes.property_category || 'property'
  const leadScore = attributes.lead_score || 50
  const timeOfDay = getTimeOfDay()

  if (broker.personality === 'aggressive') {
    return `${timeOfDay} ${name}! I'm ${broker.name}. I just reviewed your profile and you're in an excellent position! With your score of ${leadScore}/100 and current market conditions, we have a unique opportunity. I have exclusive access to rates that aren't publicly available. Let me show you how we can save you thousands on your ${propertyType} purchase.`
  }

  if (broker.personality === 'balanced') {
    return `${timeOfDay} ${name}, I'm ${broker.name}. Thank you for reaching out about your mortgage needs. I've been helping families secure their homes for over 10 years, and I'm here to guide you through your options. Based on your profile, you have several strong paths forward. What's most important to you in choosing a mortgage?`
  }

  // Conservative
  return `${timeOfDay} ${name}, I'm ${broker.name}. Welcome! I understand that exploring mortgage options can feel overwhelming, especially for ${propertyType} purchases. I've been helping families like yours for 15 years, and I'm here to guide you step by step, with no pressure at all. What would you like to know first?`
}
```

### Personality Traits
- **Aggressive**: Urgency, exclusivity, FOMO, numbers-driven
- **Balanced**: Professional, experienced, consultative, question-based
- **Conservative**: Empathy, reassurance, step-by-step, no-pressure

### Time-of-Day Personalization
```typescript
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
```

---

## Response Intent Matching

From archived route.ts lines 258-299, intent-based responses:

### Rate Inquiry
```typescript
if (lower.includes('rate') || lower.includes('interest')) {
  if (broker.personality === 'aggressive') {
    return `Great question! Right now I have access to exclusive rates starting from 3.65% for ${propertyType} - but these are only available today. With your income of S$${income}, your monthly payment would be around S$${Math.floor(income * 0.3)}. This rate expires in 48 hours. Should I lock it in for you now?`
  }
  // ...
}
```

### Qualification Inquiry
```typescript
if (lower.includes('qualify') || lower.includes('afford')) {
  const maxLoan = Math.floor(income * 0.55 * 12 * 25 / 1000) * 1000

  if (broker.personality === 'aggressive') {
    return `You're in an EXCELLENT position! With S$${income} monthly income, you qualify for loans up to S$${maxLoan.toLocaleString()}. This puts premium properties within reach. I can get you pre-approved TODAY - shall we start immediately?`
  }
  // ...
}
```

### Pattern
1. **Detect intent** from user message keywords
2. **Calculate relevant numbers** based on user profile
3. **Respond in personality-consistent voice**
4. **Include specific data** (rates, amounts, timelines)
5. **End with CTA** (call to action)

---

## Archival Reason Summary

### Why Deleted
The `_archived/api/chatwoot-enhanced-flow/` webhook was archived and deleted due to:

1. **Random broker selection** overwrote Supabase assignments
2. **setTimeout unreliability** in serverless environments (Railway)
3. **Duplicate queue messages** conflicted with frontend logic
4. **No single source of truth** for broker identity

### Replacement
New orchestration in:
- `/app/api/chatwoot-conversation/route.ts` (broker assignment)
- `/lib/engagement/broker-engagement-manager.ts` (message sequencing)
- Frontend propagation via sessionStorage

### Monitoring Period
- **Disabled**: 2025-10-01
- **Monitoring**: 14 days (until 2025-10-15)
- **Safe to delete**: 2025-12-30 (90 days retention)

---

## Related Documentation

- **Archived README**: `_archived/api/chatwoot-enhanced-flow/README.md`
- **Current implementation**: `/lib/engagement/broker-engagement-manager.ts`
- **Broker assignment**: `/app/api/chatwoot-conversation/route.ts`
- **V1 calculator patterns**: `/docs/reports/mortgage-calculator-v1-patterns-extracted.md`
