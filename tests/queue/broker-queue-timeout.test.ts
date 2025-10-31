// ABOUTME: Verifies broker queue defends against stalled Redis instrumentation.
// ABOUTME: Ensures chat creation fails fast when BullMQ instrumentation locks up.

import { describe, expect, it, beforeEach, jest } from '@jest/globals'

jest.mock('bullmq', () => {
  const addMock = jest.fn().mockResolvedValue({ id: 'job-123' })

  class MockQueue {
    add = addMock
  }

  class MockQueueEvents {
    on() {}
  }

  return { Queue: MockQueue, QueueEvents: MockQueueEvents, __addMock: addMock }
})

jest.mock('ioredis', () => {
  return class MockRedis {
    status = 'ready'

    hset() {
      return new Promise(resolve => setTimeout(() => resolve('ok'), 200))
    }

    expire() {
      return Promise.resolve(1)
    }

    quit() {
      return Promise.resolve()
    }

    disconnect() {}
  }
})

describe('queueNewConversation failure handling', () => {
beforeEach(() => {
  jest.resetModules()
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.BROKER_QUEUE_TIMING_TIMEOUT_MS = '50'
})

  it('throws quickly when redis timing instrumentation is slow', async () => {
    const { queueNewConversation } = await import('@/lib/queue/broker-queue')
    const { TimeoutError } = await import('@/lib/utils/async-timeout')

    const start = Date.now()

    const promise = queueNewConversation({
      conversationId: 99,
      contactId: 123,
      processedLeadData: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+6591234567',
        loanType: 'new_purchase',
        actualIncomes: [8000],
        actualAges: [35],
        employmentType: 'employed',
        leadScore: 70,
        sessionId: 'session-123',
        brokerPersona: {
          name: 'Balanced Specialist',
          title: 'Senior Broker',
          approach: 'supportive',
          type: 'balanced',
          urgencyLevel: 'medium'
        }
      }
    })

    await expect(promise).rejects.toBeInstanceOf(TimeoutError)

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(150)
  })
})
