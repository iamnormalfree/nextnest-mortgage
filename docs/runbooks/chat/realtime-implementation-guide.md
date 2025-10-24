ABOUTME: Comprehensive guide for implementing real-time chat features using Ably across customer and broker experiences.
ABOUTME: Covers setup, client hooks, server publishers, typing/presence, accessibility, and testing patterns.

# Real-Time Chat Implementation Guide

---
**Owner:** Engineering
**Status:** Active
**Last Updated:** 2025-10-31
**Related Plans:** `docs/plans/active/2025-10-22-ai-broker-realtime-upgrade-plan.md`
**Related Runbooks:** `docs/runbooks/data/chat-event-mirroring.md`, `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
---

## Overview

This guide covers implementing real-time features in the NextNest chat experience using Ably Pub/Sub. It replaces polling-based message delivery with event-driven WebSocket connections.

**Use cases:**
- Instant message delivery (customer ↔ AI broker)
- Typing indicators and read receipts
- Presence awareness (online/offline status)
- SLA warnings and escalation notifications
- Quick-reply suggestions

## Architecture

```
┌─────────────┐         ┌──────────┐         ┌─────────────┐
│   Browser   │◄────────│   Ably   │────────►│ Next Server │
│  (Customer) │ WebSocket│          │ REST API│   /Worker   │
└─────────────┘         └──────────┘         └─────────────┘
       │                     │                      │
       │                     │                      │
       ▼                     ▼                      ▼
  UI Updates          Event Routing           Publisher
  Typing Events       Channel Mgmt            AI Responses
  Quick Actions       Presence                SLA Alerts
```

## Getting Started

### Prerequisites

- Node 18.17+, npm 9+
- Ably account (free tier for development)
- Existing chat infrastructure (Chatwoot, BullMQ worker)

### Key Directories

- `lib/realtime/` - Ably client/server utilities
- `components/chat/` - Chat UI components
- `app/api/ably/` - Webhook handlers
- `app/api/chat/` - Legacy polling endpoints (keep as fallback)

### Environment Setup

**Install dependencies:**
```bash
npm install ably
```

**Environment variables (`.env.local`):**
```env
# Ably credentials (from dashboard)
ABLY_API_KEY=your_api_key
ABLY_API_KEY_ID=your_key_id
ABLY_API_KEY_SECRET=your_key_secret

# Webhook security
ABLY_WEBHOOK_SIGNING_KEY=your_signing_key
```

**Update `.env.local.example` and `env.d.ts` accordingly.**

## Server-Side Publishing

### Ably Server Publisher Utility

**File:** `lib/realtime/ably-server.ts`

**Purpose:** Reusable helper for publishing events from Next.js server routes and BullMQ workers.

```typescript
import * as Ably from 'ably/promises';

let ablyClient: Ably.Rest | null = null;

function getAblyClient(): Ably.Rest {
  if (!ablyClient) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      throw new Error('ABLY_API_KEY not configured');
    }
    ablyClient = new Ably.Rest({ key: apiKey });
  }
  return ablyClient;
}

export async function publishEvent(
  conversationId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const client = getAblyClient();
  const channel = client.channels.get(`conversation:${conversationId}`);

  await channel.publish(eventType, {
    ...payload,
    timestamp: Date.now()
  });
}
```

**Channel naming convention:** `conversation:{conversationId}`

**Event types:**
- `message:user` - Customer sent message
- `message:ai` - AI broker responded
- `typing:start` / `typing:stop` - Typing indicators
- `read` - Message read receipt
- `sla:warning` / `sla:violation` - SLA alerts
- `ui:suggestionSelected` - Analytics event

### Integration Points

#### 1. Chatwoot Webhook (User Messages)

**File:** `app/api/chatwoot-webhook/route.ts`

```typescript
import { publishEvent } from '@/lib/realtime/ably-server';

export async function POST(req: NextRequest) {
  // ... existing webhook validation ...

  const { conversation_id, content, message_id } = await req.json();

  // Publish to Ably
  await publishEvent(conversation_id, 'message:user', {
    messageId: message_id,
    content: sanitize(content),
    timestamp: Date.now()
  });

  // ... existing queue enqueue logic ...
}
```

#### 2. BullMQ Worker (AI Responses)

**File:** `lib/queue/broker-worker.ts`

```typescript
import { publishEvent } from '@/lib/realtime/ably-server';

async function processJob(job: Job) {
  const { conversationId, persona } = job.data;

  // Generate AI response
  const response = await generateBrokerResponse(/* ... */);

  // Publish to Ably BEFORE posting to Chatwoot
  await publishEvent(conversationId, 'message:ai', {
    messageId: response.id,
    content: response.content,
    persona: persona,
    timing: {
      queue_duration_ms: Date.now() - job.timestamp,
      ai_duration_ms: response.duration
    }
  });

  // Post to Chatwoot
  await chatwootClient.sendMessage(/* ... */);
}
```

#### 3. SLA Monitoring (Warnings/Violations)

**File:** `lib/queue/broker-worker.ts` or `lib/monitoring/alert-service.ts`

```typescript
if (queueDuration > SLA_WARNING_THRESHOLD) {
  await publishEvent(conversationId, 'sla:warning', {
    threshold: SLA_WARNING_THRESHOLD,
    actual: queueDuration,
    severity: 'warning'
  });
}

if (queueDuration > SLA_VIOLATION_THRESHOLD) {
  await publishEvent(conversationId, 'sla:violation', {
    threshold: SLA_VIOLATION_THRESHOLD,
    actual: queueDuration,
    severity: 'critical'
  });
}
```

### Testing Server Publisher

**File:** `lib/realtime/__tests__/ably-server.test.ts`

```typescript
import { publishEvent } from '../ably-server';
import * as Ably from 'ably/promises';

jest.mock('ably/promises');

describe('publishEvent', () => {
  it('publishes to correct channel with timestamp', async () => {
    const mockPublish = jest.fn().mockResolvedValue(undefined);
    const mockChannel = { publish: mockPublish };
    const mockClient = { channels: { get: jest.fn(() => mockChannel) } };

    (Ably.Rest as jest.Mock).mockImplementation(() => mockClient);

    await publishEvent('conv-123', 'message:ai', { content: 'Hello' });

    expect(mockClient.channels.get).toHaveBeenCalledWith('conversation:conv-123');
    expect(mockPublish).toHaveBeenCalledWith('message:ai', expect.objectContaining({
      content: 'Hello',
      timestamp: expect.any(Number)
    }));
  });

  it('throws when ABLY_API_KEY missing', async () => {
    delete process.env.ABLY_API_KEY;
    await expect(publishEvent('conv-123', 'test', {})).rejects.toThrow('ABLY_API_KEY not configured');
  });
});
```

## Client-Side Subscription

### React Hook for Conversation Channel

**File:** `lib/realtime/useConversationChannel.ts`

```typescript
import { useEffect, useState } from 'react';
import * as Ably from 'ably/promises';
import { Types } from 'ably';

interface UseConversationChannelOptions {
  conversationId: string;
  onMessage?: (message: Types.Message) => void;
  onTyping?: (isTyping: boolean) => void;
  onRead?: (data: unknown) => void;
  onSLA?: (data: unknown) => void;
}

export function useConversationChannel({
  conversationId,
  onMessage,
  onTyping,
  onRead,
  onSLA
}: UseConversationChannelOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const client = new Ably.Realtime({
      authUrl: '/api/ably/auth', // Token auth endpoint
      authMethod: 'POST'
    });

    const channel = client.channels.get(`conversation:${conversationId}`);

    // Connection state handlers
    client.connection.on('connected', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    client.connection.on('disconnected', () => {
      setIsConnected(false);
      setIsReconnecting(true);
    });

    // Event subscriptions
    if (onMessage) {
      channel.subscribe(['message:user', 'message:ai'], onMessage);
    }

    if (onTyping) {
      channel.subscribe('typing:start', () => onTyping(true));
      channel.subscribe('typing:stop', () => onTyping(false));
    }

    if (onRead) {
      channel.subscribe('read', (msg) => onRead(msg.data));
    }

    if (onSLA) {
      channel.subscribe(['sla:warning', 'sla:violation'], (msg) => onSLA(msg.data));
    }

    // Cleanup
    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [conversationId, onMessage, onTyping, onRead, onSLA]);

  return { isConnected, isReconnecting };
}
```

### Token Authentication Endpoint

**File:** `app/api/ably/auth/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as Ably from 'ably/promises';

export async function POST(req: NextRequest) {
  const { conversationId } = await req.json();

  // Validate user has access to conversation (check cookie/session)
  // ... authentication logic ...

  const client = new Ably.Rest({ key: process.env.ABLY_API_KEY! });

  const tokenRequest = await client.auth.createTokenRequest({
    clientId: `customer-${conversationId}`,
    capability: {
      [`conversation:${conversationId}`]: ['subscribe', 'publish']
    },
    ttl: 3600000 // 1 hour
  });

  return NextResponse.json(tokenRequest);
}
```

### Integrating Hook in Chat Component

**File:** `components/chat/CustomChatInterface.tsx`

```typescript
import { useConversationChannel } from '@/lib/realtime/useConversationChannel';

export function CustomChatInterface({ conversationId }: Props) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const { isConnected, isReconnecting } = useConversationChannel({
    conversationId,
    onMessage: (msg) => {
      setMessages(prev => [...prev, msg.data]);
    },
    onTyping: setIsTyping,
    onSLA: (data) => {
      // Show SLA warning banner
      console.warn('SLA alert:', data);
    }
  });

  return (
    <div>
      {isReconnecting && <ReconnectionBanner />}
      {isTyping && <TypingIndicator />}
      <MessageList messages={messages} />
      {/* ... rest of component ... */}
    </div>
  );
}
```

## Feature Patterns

### Typing Indicators

**Customer typing → Broker sees indicator**

```typescript
// In customer chat component
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setInputValue(value);

  // Publish typing events
  if (value.length > 0 && !isTyping) {
    publishEvent(conversationId, 'typing:start', { actor: 'customer' });
    setIsTyping(true);
  }

  // Debounced stop
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    publishEvent(conversationId, 'typing:stop', { actor: 'customer' });
    setIsTyping(false);
  }, 2000);
};
```

**Broker dashboard shows typing:**

```typescript
useConversationChannel({
  conversationId,
  onTyping: (isTyping) => {
    setCustomerTyping(isTyping);
  }
});
```

### Read Receipts

**Customer reads message → Update timestamp**

```typescript
useEffect(() => {
  // When messages rendered in viewport
  const latestMessage = messages[messages.length - 1];
  if (latestMessage && latestMessage.sender === 'ai') {
    publishEvent(conversationId, 'read', {
      messageId: latestMessage.id,
      readAt: Date.now()
    });
  }
}, [messages]);
```

### Quick-Reply Chips

**Dynamic suggestions based on conversation state**

**API:** `app/api/chat/suggestions/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const { conversationId, persona } = req.nextUrl.searchParams;

  // Fetch conversation context from Redis/Supabase
  const context = await getConversationContext(conversationId);

  // Return persona-specific suggestions
  const suggestions = getSuggestionsForPersona(persona, context);

  return NextResponse.json({ suggestions });
}
```

**Component:** `components/chat/SuggestionChips.tsx`

```typescript
export function SuggestionChips({ conversationId, persona }: Props) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetch(`/api/chat/suggestions?conversationId=${conversationId}&persona=${persona}`)
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions));
  }, [conversationId, persona]);

  const handleChipClick = (suggestion: string) => {
    // Pre-fill input
    setInputValue(suggestion);

    // Publish analytics event
    publishEvent(conversationId, 'ui:suggestionSelected', {
      suggestion,
      persona
    });
  };

  return (
    <div className="flex gap-2">
      {suggestions.map(s => (
        <button key={s} onClick={() => handleChipClick(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
```

## Accessibility

### ARIA Roles & Live Regions

```tsx
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  className="messages-container"
>
  {messages.map(msg => (
    <div key={msg.id} role="article" aria-label={`Message from ${msg.sender}`}>
      {msg.content}
    </div>
  ))}
</div>
```

### Keyboard Navigation

```tsx
<button
  onClick={sendMessage}
  aria-label="Send message"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  Send
</button>
```

### Reconnection Messaging

```tsx
function ReconnectionBanner() {
  return (
    <div role="alert" aria-live="assertive" className="bg-yellow-100 p-4">
      Connection lost. Reconnecting...
    </div>
  );
}
```

### High-Contrast Mode

Use Tailwind tokens from `tailwind.config.ts`:

```tsx
<div className="bg-background text-foreground border-border">
  {/* Respects system high-contrast preferences */}
</div>
```

## Mobile Responsiveness

### Breakpoint Testing

Test at: **320px, 360px, 390px, 768px**

```css
/* globals.css */
.chat-container {
  padding: 1rem;
}

@media (max-width: 360px) {
  .chat-container {
    padding: 0.5rem;
  }
}
```

### Touch-Friendly Targets

Ensure buttons ≥44px tap target:

```tsx
<button className="min-h-[44px] min-w-[44px]">
  Send
</button>
```

## Testing Strategy

### Unit Tests

**Hook testing:** `lib/realtime/__tests__/useConversationChannel.test.tsx`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useConversationChannel } from '../useConversationChannel';

jest.mock('ably/promises');

test('calls onMessage when event received', async () => {
  const onMessage = jest.fn();

  renderHook(() => useConversationChannel({
    conversationId: 'conv-123',
    onMessage
  }));

  // Simulate Ably message
  mockChannel.emit('message', { data: { content: 'Hello' } });

  await waitFor(() => {
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({
      data: { content: 'Hello' }
    }));
  });
});
```

### Integration Tests

**API route testing:** `app/api/ably/auth/__tests__/route.test.ts`

Mock authentication → Call route → Assert token request returned with correct capability

### E2E Testing

**Dual-browser scenario:**

1. Open customer chat in Browser A
2. Open broker dashboard in Browser B
3. Type in Browser A → Verify typing indicator in Browser B
4. Send message in Browser A → Verify instant delivery in Browser B (no polling delay)

**Network throttling:**

1. Open DevTools → Network → Throttle to "Slow 3G"
2. Disconnect → Verify reconnection banner appears
3. Reconnect → Verify banner disappears and messages sync

### Performance Validation

**Metrics:**
- Connection establishment: <1s
- Message delivery latency: <500ms (P95)
- Typing indicator delay: <200ms

**Commands:**
```bash
npm run test              # Unit tests
npm run test:integration  # API + hook integration
npm run test:e2e          # Playwright E2E
```

## Deployment

### Feature Flag

**Environment variable:** `ENABLE_ABLY_REALTIME`

```typescript
const REALTIME_ENABLED = process.env.ENABLE_ABLY_REALTIME === 'true';

if (REALTIME_ENABLED) {
  // Use Ably hook
  return <RealtimeChat />;
} else {
  // Fallback to polling
  return <PollingChat />;
}
```

### Rollout Strategy

1. **Dev** - Always enabled
2. **Staging** - Enabled, monitor for 24h
3. **Production** - Gradual rollout:
   - Week 1: 10% of conversations
   - Week 2: 50% of conversations
   - Week 3: 100% of conversations

### Monitoring

**Ably Dashboard:**
- Connection count
- Message throughput
- Failed publishes

**Custom Alerts:** (via `lib/monitoring/alert-service.ts`)
- Connection failures >5% in 5min window
- Message delivery failures >1% in 5min window
- Webhook signature failures >10 in 1min window

### Rollback Procedure

1. Set `ENABLE_ABLY_REALTIME=false` in production
2. Redeploy or restart instances
3. Verify polling fallback working
4. Investigate Ably dashboard logs

## Troubleshooting

### Client can't connect

**Symptoms:** `isConnected` stays false, console shows auth errors

**Solutions:**
1. Check `/api/ably/auth` returns valid token request
2. Verify Ably API key has correct permissions
3. Check browser console for CORS issues

### Messages not appearing

**Symptoms:** Server publishes but client doesn't receive

**Solutions:**
1. Verify channel name matches on both sides (`conversation:{id}`)
2. Check client subscribed to correct event types
3. Review Ably dashboard → Channel history

### High latency

**Symptoms:** Messages delayed >2s

**Solutions:**
1. Check Ably region (should be closest to users)
2. Review network tab for slow `/api/ably/auth` calls
3. Monitor server publish time (should be <100ms)

## References

- **Ably Docs:** https://ably.com/docs
- **React Hooks:** https://ably.com/docs/getting-started/react
- **Token Auth:** https://ably.com/docs/core-features/authentication#token-authentication
- **Event Mirroring:** `docs/runbooks/data/chat-event-mirroring.md`
- **AI Broker Guide:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
