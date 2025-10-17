# AI Broker Implementation Plan - Complete Technical Specification

## 🎯 Objective
Fix critical gaps in AI Broker system to achieve fully functional form → chat → AI broker flow with visual UI, database persistence, and proper testing.

## 🚀 Role-Based Message System (Implemented)

### Overview
The broker system now properly renders broker status updates as neutral system messages instead of customer bubbles, using a role-based message classification system.

### Message Role Classification
Messages are now normalized server-side with three distinct roles:
- **`user`**: Customer messages (incoming messages from contacts)
- **`agent`**: Broker/AI responses (outgoing messages from agents/bots)
- **`system`**: System notifications and status updates (activity messages)

### API Response Contract
The `/api/chat/messages` endpoint now returns messages with the following structure:
```typescript
{
  id: number,
  content: string,
  role: 'user' | 'agent' | 'system',  // Normalized role
  message_type: string,                // Original Chatwoot type (for backward compatibility)
  created_at: string,
  private: boolean,
  sender: {
    name: string,
    avatar_url?: string,
    type: string
  },
  original: any  // Raw Chatwoot payload for debugging
}
```

### Implementation Details

#### 1. Server-Side Role Normalization
- **File**: `app/api/chat/messages/route.ts`
- Maps Chatwoot `message_type` values (0=incoming, 1=outgoing, 2=activity) to roles
- Considers `sender.type` for additional context
- Preserves raw payload in `original` field for debugging

#### 2. Chatwoot Activity Endpoint
- **File**: `lib/integrations/chatwoot-client.ts`
- `createActivityMessage()` must be updated to call `/api/v1/.../activities`
  with Chatwoot's `{ action: 'conversation_activity', content }` payload
- Handle 204 No Content responses and log non-2xx statuses
- `updateConversationCustomAttributes()` preserves existing attributes

#### 3. UI Role-Based Rendering
- **Files**: `components/chat/CustomChatInterface.tsx`, `components/chat/EnhancedChatInterface.tsx`
- System messages render as centered status chips without avatars
- User/agent messages maintain left/right alignment
- Boilerplate system messages are filtered ("conversation was reopened", "added property")

### System Message Examples
System messages that now render as centered status chips:
- "{{broker}} is reviewing your details."
- "{{broker}} joined the conversation."
- "Processing your request..."

### Debug Logging
Temporary debug logging added to verify message role derivation:
```javascript
console.log('[DEBUG] Message role derivation:', {
  id: msg.id,
  message_type: msg.message_type,
  sender_type: msg.sender?.type,
  private: msg.private,
  content_preview: msg.content?.substring(0, 50)
})
```
*Note: Remove debug logging after verification*

## 📋 Implementation Tasks

### Task 1: Switch Chatwoot Activity Endpoint
**Priority**: CRITICAL
**Estimated Time**: 45 minutes
**Risk Level**: Medium

#### Files to Modify:
- `lib/integrations/chatwoot-client.ts`

#### Changes Required:
- Replace the `/messages` POST with the `/activities` endpoint
- Send payload `{ action: 'conversation_activity', content }`
- Treat 204 as success; surface non-2xx responses in logs
- Add minimal unit coverage or inline smoke test to confirm the activity is accepted

#### Testing Required:
- Trigger a broker join event and confirm Chatwoot classifies it as `activity`
- Reload chat UI to verify the message arrives with `role: 'system'`

---

### Task 2: Harden Role Fallbacks in Chat Interfaces
**Priority**: HIGH
**Estimated Time**: 30 minutes
**Risk Level**: Medium

#### Files to Modify:
- `components/chat/CustomChatInterface.tsx`
- `components/chat/EnhancedChatInterface.tsx`

#### Changes Required:
- Normalise `message.message_type` as string/number before comparison
- Map `0 | 'incoming'` to `user`, `1 | 'outgoing'` to `agent`, `2 | 'activity'` to `system`
- Guard against undefined `sender` to avoid misclassification

#### Testing Required:
- Load conversations with cached messages lacking `role`
- Confirm user messages remain right-aligned and broker replies stay left-aligned

---

### Task 3: Fix n8n Workflow Dynamic Conversation ID
**Priority**: CRITICAL
**Estimated Time**: 30 minutes
**Risk Level**: Low

#### Files to Modify:
- `n8n-workflows/NN AI Broker - Updated.json` (line 264-275)

#### Changes Required:
```javascript
// REMOVE (line 264):
const conversationId = 24; // Force conversation 24 for testing

// REPLACE WITH:
const conversationId = input.conversationId || input.customer?.conversationId || 24;
```

#### Testing Required:
- Send test webhook with real conversation ID
- Verify conversation history fetches correctly
- Check error handling for missing IDs

#### Second-Order Effects:
- All downstream nodes will receive correct conversation data
- Broker assignments will be properly tracked per conversation
- Metrics will be accurate

---

### Task 4: Create Broker Profile UI Components
**Priority**: HIGH
**Estimated Time**: 2 hours
**Risk Level**: Low

#### Files to Create:
1. `components/chat/BrokerProfile.tsx`
2. `components/chat/BrokerTypingIndicator.tsx`
3. `public/images/brokers/michelle-chen.jpg`
4. `public/images/brokers/sarah-wong.jpg`
5. `public/images/brokers/grace-lim.jpg`
6. `public/images/brokers/rachel-tan.jpg`
7. `public/images/brokers/jasmine-lee.jpg`

#### Component Implementation:
```tsx
// components/chat/BrokerProfile.tsx
import Image from 'next/image';

interface BrokerProfileProps {
  id: string;
  name: string;
  photoUrl: string;
  role: string;
  personalityType: string;
  isOnline?: boolean;
  isTyping?: boolean;
}

export default function BrokerProfile({
  id,
  name,
  photoUrl,
  role,
  personalityType,
  isOnline = true,
  isTyping = false
}: BrokerProfileProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b shadow-sm">
      <div className="relative">
        <Image
          src={photoUrl || '/images/default-broker.jpg'}
          alt={name}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600">{role}</p>
      </div>
      {isTyping && <BrokerTypingIndicator />}
    </div>
  );
}
```

#### Files to Modify:
- `app/chat/page.tsx` - Import and use BrokerProfile
- `components/forms/ChatTransitionScreen.tsx` - Pass broker data

#### Testing Required:
- Verify images load correctly
- Test responsive design
- Check typing indicator animation
- Validate online status display

---

### Task 3: Setup Supabase Database Connection
**Priority**: CRITICAL
**Estimated Time**: 1 hour
**Risk Level**: Medium

#### Files to Create:
1. `.env.local` (update existing)
2. `lib/db/supabase-client.ts`
3. `lib/db/types/database.types.ts`
4. `app/api/brokers/[id]/route.ts`

#### Environment Variables:
```env
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

#### Supabase Client:
```typescript
// lib/db/supabase-client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Client for browser (public operations)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client for server (admin operations)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

#### Database Schema to Run:
- Execute `database/ai-brokers-schema.sql` in Supabase SQL Editor
- Verify all tables created successfully
- Insert initial broker data

#### Testing Required:
- Test database connection
- Verify broker data retrieval
- Check error handling for connection failures

---

### Task 4: Update Chatwoot Conversation API
**Priority**: HIGH
**Estimated Time**: 2 hours
**Risk Level**: Medium

#### Files to Modify:
1. `app/api/chatwoot-conversation/route.ts`
2. `lib/integrations/chatwoot-client.ts`
3. `lib/ai/broker-assignment.ts` (new)

#### Broker Assignment Logic:
```typescript
// lib/ai/broker-assignment.ts
import { supabaseAdmin } from '@/lib/db/supabase-client';

export async function assignBestBroker(
  leadScore: number,
  loanType: string,
  propertyType: string,
  monthlyIncome: number,
  timeline: string
) {
  // Query available brokers
  const { data: brokers } = await supabaseAdmin
    .from('ai_brokers')
    .select('*')
    .eq('is_active', true)
    .lt('current_workload', 10);

  // Assignment logic based on lead score
  let targetPersonality = 'balanced';
  if (leadScore >= 75) targetPersonality = 'aggressive';
  else if (leadScore < 45) targetPersonality = 'conservative';

  // Find best match
  const broker = brokers?.find(b => 
    b.personality_type === targetPersonality
  ) || brokers?.[0];

  if (broker) {
    // Record assignment
    await supabaseAdmin.from('broker_conversations').insert({
      conversation_id: conversationId,
      broker_id: broker.id,
      lead_score: leadScore,
      loan_type: loanType,
      property_type: propertyType,
      monthly_income: monthlyIncome,
      timeline: timeline,
      status: 'active'
    });

    // Update workload
    await supabaseAdmin
      .from('ai_brokers')
      .update({ current_workload: broker.current_workload + 1 })
      .eq('id', broker.id);
  }

  return broker;
}
```

#### API Route Updates:
```typescript
// In app/api/chatwoot-conversation/route.ts
// Add after conversation creation:
const broker = await assignBestBroker(
  leadScore,
  formData.loanType,
  formData.propertyType,
  formData.monthlyIncome,
  formData.timeline
);

// Update conversation attributes
await chatwootClient.updateConversation(conversationId, {
  custom_attributes: {
    ...existing_attributes,
    ai_broker_id: broker.id,
    ai_broker_name: broker.name,
    broker_persona: broker.personality_type
  }
});

// Return broker data in response
return NextResponse.json({
  success: true,
  conversationId,
  broker: {
    id: broker.id,
    name: broker.name,
    photoUrl: broker.photo_url,
    role: broker.role
  }
});
```

#### Testing Required:
- Test broker assignment for different lead scores
- Verify database updates
- Check workload balancing
- Test fallback when no brokers available

---

### Task 5: Enhance Chat Interface
**Priority**: HIGH
**Estimated Time**: 3 hours
**Risk Level**: Medium

#### Files to Modify:
1. `app/chat/page.tsx`
2. `components/ChatwootWidget.tsx`
3. `components/chat/HandoffNotification.tsx` (new)

#### Chat Page Enhancement:
```typescript
// app/chat/page.tsx
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrokerProfile from '@/components/chat/BrokerProfile';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const [broker, setBroker] = useState(null);
  const [isHandoff, setIsHandoff] = useState(false);

  useEffect(() => {
    // Fetch broker details
    if (conversationId) {
      fetch(`/api/brokers/conversation/${conversationId}`)
        .then(res => res.json())
        .then(data => setBroker(data.broker));
    }

    // Listen for handoff events
    window.addEventListener('chatwoot:handoff', () => {
      setIsHandoff(true);
    });
  }, [conversationId]);

  return (
    <div className="flex flex-col h-screen">
      {broker && <BrokerProfile {...broker} />}
      {isHandoff && <HandoffNotification />}
      <ChatwootWidget conversationId={conversationId} />
    </div>
  );
}
```

#### Testing Required:
- Test broker profile display
- Verify typing indicators
- Test handoff notifications
- Check mobile responsiveness

---

### Task 6: Fix Webhook Integration
**Priority**: CRITICAL
**Estimated Time**: 2 hours
**Risk Level**: High

#### Files to Modify:
1. `app/api/chatwoot-webhook/route.ts`
2. `lib/security/webhook-verification.ts` (new)

#### Webhook Handler Update:
```typescript
// app/api/chatwoot-webhook/route.ts
import { verifyWebhookSignature } from '@/lib/security/webhook-verification';
import { supabaseAdmin } from '@/lib/db/supabase-client';

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-chatwoot-signature');
    const body = await request.text();
    
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { event, conversation, message } = data;

    // Handle different events
    switch (event) {
      case 'message_created':
        if (conversation.status === 'bot' && message.message_type === 'incoming') {
          // Trigger n8n workflow
          await fetch(process.env.N8N_WEBHOOK_URL!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }
        break;

      case 'conversation_status_changed':
        if (conversation.status === 'open') {
          // Update database for handoff
          await supabaseAdmin
            .from('broker_conversations')
            .update({
              status: 'handoff_completed',
              handoff_at: new Date().toISOString()
            })
            .eq('conversation_id', conversation.id);
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

#### Testing Required:
- Test with real Chatwoot webhooks
- Verify signature validation
- Test all event types
- Check error handling

---

### Task 7-10: Supporting Infrastructure

#### Conversation Tracking (`lib/db/conversation-tracker.ts`):
- Track all messages exchanged
- Update broker performance metrics
- Record handoff reasons and timing

#### Analytics Dashboard (`app/dashboard/brokers/page.tsx`):
- Display broker performance metrics
- Show conversion rates
- Track handoff success rates
- Monitor response times

#### End-to-End Testing (`scripts/test-e2e-broker-flow.ts`):
```typescript
// Complete flow test
async function testCompleteFlow() {
  // 1. Submit form
  const formResponse = await submitTestForm({
    name: 'Test User',
    email: 'test@example.com',
    loanType: 'new_purchase',
    monthlyIncome: 8000
  });
  
  // 2. Verify conversation created
  assert(formResponse.conversationId);
  assert(formResponse.broker);
  
  // 3. Send test message
  const messageResponse = await sendMessage(
    formResponse.conversationId,
    'I need help with my mortgage'
  );
  
  // 4. Verify AI response
  assert(messageResponse.content.includes(formResponse.broker.name));
  
  // 5. Test handoff
  const handoffResponse = await sendMessage(
    formResponse.conversationId,
    'I want to speak to a human'
  );
  
  // 6. Verify status change
  const status = await getConversationStatus(formResponse.conversationId);
  assert(status === 'open');
}
```

---

## 🚨 Risk Mitigation

### Database Failures:
- Implement connection pooling
- Add retry logic with exponential backoff
- Cache broker data in Redis/memory

### Webhook Processing:
- Add message queue (Bull/BullMQ)
- Implement idempotency checks
- Log all webhook events

### AI Response Delays:
- Set timeout limits (5 seconds)
- Implement fallback responses
- Show typing indicators

### Testing Strategy:
1. Unit tests for each component
2. Integration tests for API routes
3. E2E tests for complete flow
4. Load testing for concurrent users
5. Chaos testing for failure scenarios

---

## 📊 Success Metrics

### Technical Metrics:
- Response time < 3 seconds
- Error rate < 1%
- Successful handoff rate > 95%
- Database query time < 100ms

### Business Metrics:
- Conversation to handoff: 70-80%
- Handoff to application: 30-40%
- Customer satisfaction > 4.5/5
- Broker utilization: 60-80%

---

## 🔄 Rollback Plan

If issues occur:
1. Disable n8n workflow
2. Revert to simple bot responses
3. Manual broker assignment
4. Direct chat without AI
5. Full rollback to previous version

---

## 📅 Implementation Timeline

**Day 1**: Tasks 1-3 (Critical infrastructure)
**Day 2**: Tasks 4-5 (API and UI)
**Day 3**: Tasks 6-8 (Integration and tracking)
**Day 4**: Tasks 9-10 (Analytics and testing)
**Day 5**: Production deployment and monitoring

---

This plan ensures systematic implementation with minimal risk and maximum visibility into potential issues.
