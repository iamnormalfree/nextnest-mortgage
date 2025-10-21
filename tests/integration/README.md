# BullMQ Integration Tests

## Overview

Real integration tests for BullMQ queue operations that test the **actual queue helper functions** (`queueIncomingMessage`, `queueNewConversation`) from `lib/queue/broker-queue.ts` using **redis-memory-server** for in-memory Redis instances.

**Key Difference**: These tests exercise the real code paths used in production, not just BullMQ mechanics.

## Why redis-memory-server?

### The Problem with ioredis-mock

Initially, we used `ioredis-mock` for testing, but BullMQ's Lua scripts rely on `cmsgpack` (MessagePack serialization) which `ioredis-mock` doesn't support in its Lua VM. This caused failures like:

```
Error trying to load/executing lua code string in VM:
... attempt to index a nil value (global 'cmsgpack')
```

### The Solution

**redis-memory-server** spins up actual Redis instances in memory (~4MB per instance), providing:
- ✅ Full BullMQ Lua script support (including cmsgpack)
- ✅ Isolated test instances on random ports
- ✅ Fast, in-memory execution
- ✅ Automatic binary download and caching
- ✅ No external Redis dependencies

## Running Tests

```bash
# Run once
npm run test:integration

# Watch mode
npm run test:integration:watch
```

## Test Architecture

### Setup (`tests/utils/test-redis.ts`)

The test helper sets `REDIS_URL` environment variable so production code connects to the test instance:

```typescript
import { startTestRedis, stopTestRedis } from "../utils/test-redis";
import { queueIncomingMessage, queueNewConversation, getBrokerQueue } from "@/lib/queue/broker-queue";

beforeAll(async () => {
  redis = await startTestRedis(); // Sets process.env.REDIS_URL to test instance
});

beforeEach(async () => {
  queue = getBrokerQueue(); // Uses REDIS_URL env var
  await queue.obliterate();
});

afterAll(async () => {
  await queue.close(); // Close singleton queue
  await stopTestRedis(); // Cleanup Redis + clears REDIS_URL
});
```

### Testing Real Queue Helpers

Tests call the actual production helper functions:

```typescript
// Real production code path
const job = await queueIncomingMessage({
  conversationId: 999,
  contactId: 888,
  brokerId: "broker-123",
  brokerName: "Rachel Tan",
  brokerPersona: mockBrokerPersona,
  processedLeadData: mockLeadData,
  userMessage: "How much can I borrow?",
  messageId: 777,
});

// Verify the job was created correctly
expect(job.opts?.priority).toBe(3); // Helper logic: incoming = priority 3
expect(job.data.skipGreeting).toBe(true); // Helper logic: always true for incoming
```

### Test Configuration (`vitest.config.ts`)

- **Environment**: Node (not jsdom)
- **Pool**: Forks with single fork for BullMQ isolation
- **Timeouts**: 10s for tests and hooks
- **Includes**: `tests/integration/**/*.test.ts`

## Current Test Coverage

**ai-broker-message-flow.test.ts** (9 tests, all passing ✅)

All tests use **real production queue helpers** (not direct `queue.add()` calls):

1. **Queue Payload Structure via Real Helper Functions**
   - ✅ `queueIncomingMessage()` creates correct job structure
   - ✅ `queueNewConversation()` creates correct job structure

2. **Priority Calculation via Real Helper Functions**
   - ✅ `queueNewConversation()` assigns priority 1 for high lead score (>75)
   - ✅ `queueIncomingMessage()` assigns priority 3 (always)
   - ✅ `queueNewConversation()` assigns priority 5 for normal lead score (≤75)

3. **Job State and Data Integrity via Real Helpers**
   - ✅ Jobs created in 'prioritized' state (BullMQ behavior with priority)
   - ✅ Job data preserved after retrieval

4. **Message Type Filtering via Real Helpers**
   - ✅ `queueIncomingMessage()` enforces `skipGreeting=true` (always)
   - ✅ `queueNewConversation()` respects `skipGreeting` parameter

### What We're Testing

- ✅ Real code paths from `lib/queue/broker-queue.ts`
- ✅ Priority calculation logic in helpers
- ✅ Job ID generation patterns
- ✅ Data transformation by helpers
- ✅ BullMQ Lua scripts with cmsgpack (via redis-memory-server)
- ✅ Queue configuration (retry, backoff, cleanup)

## Key Differences from ioredis-mock

| Feature | ioredis-mock | redis-memory-server |
|---------|-------------|---------------------|
| **Lua cmsgpack** | ❌ Not supported | ✅ Full support |
| **BullMQ scripts** | ❌ Fails | ✅ Works |
| **Setup** | Synchronous | Async (await startTestRedis()) |
| **Cleanup** | Simple quit | stopTestRedis() |
| **Memory** | ~1MB | ~4MB per instance |
| **Speed** | Faster | Slightly slower (real Redis) |

## Dependencies

```json
{
  "devDependencies": {
    "redis-memory-server": "^0.13.0",
    "vitest": "^3.2.4",
    "@vitest/ui": "^3.2.4"
  }
}
```

## Troubleshooting

### Tests hanging or timing out

Check that `stopTestRedis()` is called in `afterAll()`. BullMQ connections must be closed properly.

### Binary download issues in CI

redis-memory-server auto-downloads Redis binaries. In CI, ensure sufficient timeout or pre-cache binaries.

### Port conflicts

Each test file gets a random port. If you see port conflicts, ensure proper cleanup between test runs.

## References

- [BullMQ Testing Issue #3363](https://github.com/taskforcesh/bullmq/issues/3363)
- [redis-memory-server Documentation](https://github.com/mhassan1/redis-memory-server)
- [Vitest Configuration](https://vitest.dev/config/)
