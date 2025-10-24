ABOUTME: Data pipeline architecture for mirroring chat events from Ably webhooks to Redis and Supabase.
ABOUTME: Covers webhook validation, event normalization, dual-write patterns, and retention policies.

# Chat Event Mirroring Pipeline

---
**Owner:** Engineering + Data
**Status:** Active
**Last Updated:** 2025-10-31
**Related CAN Tasks:** CAN-033
**Related Plans:** `docs/plans/active/2025-10-22-ai-broker-realtime-upgrade-plan.md`
---

## Overview

The chat event mirroring pipeline captures real-time events from Ably and persists them to both Redis (short-term cache) and Supabase (long-term storage). This enables conversation resume, analytics, compliance audits, and AI context hydration.

**Architecture:**
```
Ably Pub/Sub → Ably Webhook → Next.js API Route → Redis + Supabase
                                                  ↓
                                            Worker Context Loader
```

## Event Flow

1. **Publisher** - Server/worker publishes event to Ably channel
2. **Ably** - Broadcasts to subscribers + triggers webhook
3. **Webhook Handler** - Validates, normalizes, dual-writes to Redis + Supabase
4. **Consumers** - Workers/analytics pull from Redis; reports query Supabase

## Ably Webhook Configuration

### Setup Steps

1. **Ably Dashboard** → Account → Integrations → Webhooks
2. **Configure webhook:**
   - URL: `https://your-domain.com/api/ably/events`
   - Events: `channel.message`, `channel.presence`
   - Channel filter: `conversation:*`
   - Custom headers: `X-Ably-Signature` (auto-added)

3. **Environment variables:**
   ```env
   ABLY_WEBHOOK_SIGNING_KEY=your_signing_key_from_dashboard
   ```

### Signature Validation

**Implementation:** `lib/realtime/ably-webhook.ts`

```typescript
import crypto from 'crypto';

export function validateAblySignature(
  body: string,
  signature: string,
  signingKey: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', signingKey)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Security notes:**
- Always validate signature BEFORE processing payload
- Use `crypto.timingSafeEqual` to prevent timing attacks
- Return 401 for invalid signatures (don't leak details)

## API Route Implementation

**File:** `app/api/ably/events/route.ts`

### Request Handling

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateAblySignature } from '@/lib/realtime/ably-webhook';
import { writeToRedis } from '@/lib/cache/redis-client';
import { writeToSupabase } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
  // 1. Extract signature
  const signature = req.headers.get('X-Ably-Signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // 2. Get raw body for signature validation
  const rawBody = await req.text();
  const signingKey = process.env.ABLY_WEBHOOK_SIGNING_KEY!;

  if (!validateAblySignature(rawBody, signature, signingKey)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse payload
  const payload = JSON.parse(rawBody);

  // 4. Process events (dual-write)
  try {
    await Promise.allSettled(
      payload.items.map(async (event: AblyWebhookEvent) => {
        const normalizedEvent = normalizeEvent(event);

        // Parallel writes (fire-and-forget for Redis, wait for Supabase)
        await Promise.all([
          writeToRedis(normalizedEvent),
          writeToSupabase(normalizedEvent)
        ]);
      })
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Event mirroring failed:', error);
    // Return 200 to prevent Ably retries (already logged)
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
```

### Event Normalization

**Purpose:** Convert Ably's webhook format to our internal schema

```typescript
interface AblyWebhookEvent {
  name: string;
  channel: string;
  data: unknown;
  timestamp: number;
}

interface NormalizedChatEvent {
  conversation_id: string;
  event_type: 'message:user' | 'message:ai' | 'typing:start' | 'typing:stop' | 'read' | 'sla:warning' | 'sla:violation';
  payload: {
    message_id?: string;
    content?: string;
    persona?: string;
    timestamp: number;
    timing?: {
      queue_duration_ms?: number;
      ai_duration_ms?: number;
    };
  };
  occurred_at: string; // ISO 8601
}

function normalizeEvent(event: AblyWebhookEvent): NormalizedChatEvent {
  const conversationId = event.channel.replace('conversation:', '');

  return {
    conversation_id: conversationId,
    event_type: event.name as NormalizedChatEvent['event_type'],
    payload: event.data as NormalizedChatEvent['payload'],
    occurred_at: new Date(event.timestamp).toISOString()
  };
}
```

## Redis Integration

**File:** `lib/cache/redis-client.ts`

### Data Structure

**Key pattern:** `chat:conversation:{conversationId}:events`
**Type:** List (LPUSH for chronological order)
**TTL:** 24 hours (conversation resume window)

### Write Implementation

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function writeToRedis(event: NormalizedChatEvent): Promise<void> {
  const key = `chat:conversation:${event.conversation_id}:events`;
  const value = JSON.stringify(event);

  // LPUSH adds to head (newest first)
  await redis.lpush(key, value);

  // Set 24h expiry if new key
  await redis.expire(key, 86400, 'NX');

  // Trim to last 100 events (prevent unbounded growth)
  await redis.ltrim(key, 0, 99);
}
```

### Read Implementation (for context hydration)

```typescript
export async function getRecentEvents(
  conversationId: string,
  limit: number = 20
): Promise<NormalizedChatEvent[]> {
  const key = `chat:conversation:${conversationId}:events`;
  const events = await redis.lrange(key, 0, limit - 1);

  return events.map(e => JSON.parse(e));
}
```

## Supabase Integration

**File:** `lib/db/supabase-admin.ts`

### Schema

**Table:** `chat_events`

```sql
CREATE TABLE chat_events (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_events_conversation ON chat_events(conversation_id, occurred_at DESC);
CREATE INDEX idx_chat_events_type ON chat_events(event_type, occurred_at DESC);
```

### Write Implementation

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role for server writes
  { auth: { persistSession: false } }
);

export async function writeToSupabase(event: NormalizedChatEvent): Promise<void> {
  const { error } = await supabase
    .from('chat_events')
    .insert({
      conversation_id: event.conversation_id,
      event_type: event.event_type,
      payload: event.payload,
      occurred_at: event.occurred_at
    });

  if (error) {
    console.error('Supabase write failed:', error);
    throw error;
  }
}
```

## Error Handling & Retry Logic

### Webhook Handler Strategy

1. **Signature validation failure** → Return 401 (no retry)
2. **Parsing error** → Return 200 + log (prevent retry loop)
3. **Redis write failure** → Log, continue to Supabase
4. **Supabase write failure** → Return 200 + alert (already logged)

**Rationale:** Ably retries 5xx responses. We prefer manual investigation over auto-retry for data consistency.

### Monitoring

**Key metrics:**
- Webhook processing time (target: <500ms P95)
- Redis write failures (alert if >1% in 5min window)
- Supabase write failures (alert if >0.1% in 5min window)
- Signature validation failures (alert if >10 in 1min - possible attack)

**Implementation:** See `lib/monitoring/alert-service.ts`

## Data Retention

| Storage | TTL | Purpose | Cleanup |
|---------|-----|---------|---------|
| Redis | 24h | Conversation resume, worker context | Auto-expire |
| Supabase | 90 days (configurable) | Analytics, compliance | Scheduled job |

### Supabase Cleanup Job

**File:** `scripts/cleanup-old-chat-events.ts`

```typescript
// Run daily via cron
const RETENTION_DAYS = 90;

const { data, error } = await supabase
  .from('chat_events')
  .delete()
  .lt('occurred_at', new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString());

console.log(`Deleted ${data?.length || 0} events older than ${RETENTION_DAYS} days`);
```

## Testing

### Unit Tests

**File:** `lib/realtime/__tests__/ably-webhook.test.ts`

```typescript
describe('validateAblySignature', () => {
  it('accepts valid signature', () => {
    const body = JSON.stringify({ test: 'data' });
    const signature = crypto.createHmac('sha256', 'secret').update(body).digest('hex');
    expect(validateAblySignature(body, signature, 'secret')).toBe(true);
  });

  it('rejects invalid signature', () => {
    expect(validateAblySignature('body', 'wrong', 'secret')).toBe(false);
  });
});
```

### Integration Tests

**File:** `app/api/ably/events/__tests__/route.test.ts`

Mock Ably payload → POST to route → Assert Redis + Supabase called with normalized data

### End-to-End Validation

1. Publish test event via `lib/realtime/ably-server.ts`
2. Wait 2s for webhook propagation
3. Query Redis: `redis-cli LRANGE chat:conversation:test-123:events 0 0`
4. Query Supabase: `SELECT * FROM chat_events WHERE conversation_id = 'test-123' ORDER BY occurred_at DESC LIMIT 1`
5. Verify event present in both

## Troubleshooting

### Webhook not receiving events

1. Check Ably dashboard → Logs for webhook delivery status
2. Verify channel filter matches published channel name
3. Test webhook URL manually: `curl -X POST https://your-domain.com/api/ably/events`

### Signature validation failures

1. Verify `ABLY_WEBHOOK_SIGNING_KEY` matches dashboard value
2. Check for body parsing issues (must validate against raw body string)
3. Review Ably dashboard logs for signature they sent

### Redis write failures

1. Check Redis connection: `redis-cli PING`
2. Verify `REDIS_URL` env var
3. Check Redis memory limits (eviction policy)

### Supabase write failures

1. Verify `SUPABASE_SERVICE_ROLE_KEY` has insert permissions
2. Check schema matches (run migrations)
3. Review Supabase logs for constraint violations

## Production Checklist

- [ ] Ably webhook configured with correct URL and signing key
- [ ] Environment variables set in production (Vercel/hosting platform)
- [ ] Redis configured with sufficient memory and eviction policy
- [ ] Supabase table created with indexes
- [ ] Monitoring alerts configured for failure rates
- [ ] Cleanup job scheduled (cron or Vercel Cron)
- [ ] Load test: 100 events/min for 5min, verify no backlog
- [ ] Review logs for 24h after deployment

## References

- **Ably Webhook Docs:** https://ably.com/docs/general/webhooks
- **Redis Lists:** https://redis.io/docs/data-types/lists/
- **Supabase Service Role:** https://supabase.com/docs/guides/api#the-service_role-key
- **Related Runbook:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
- **Plan:** `docs/plans/active/2025-10-22-ai-broker-realtime-upgrade-plan.md` (Stage 1, Task 1.5)
