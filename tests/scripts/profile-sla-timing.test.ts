// ABOUTME: Validates SLA profiler conversation setup behavior.
// ABOUTME: Ensures profiling script sources conversation IDs from Chatwoot.

/**
 * @jest-environment node
 */

import type { ChatwootConversation } from '@/lib/integrations/chatwoot-client'

const createConversationMock = jest.fn<Promise<ChatwootConversation>, []>()

jest.mock('@/lib/integrations/chatwoot-client', () => ({
  ChatwootClient: jest.fn().mockImplementation(() => ({
    createConversation: createConversationMock
  }))
}))

import { prepareProfilingConversation } from '@/scripts/profile-sla-timing'

describe('profile-sla-timing conversation provisioning', () => {
  beforeEach(() => {
    createConversationMock.mockReset()
  })

  it('creates a real conversation for profiling samples', async () => {
    createConversationMock.mockResolvedValue({
      id: 987,
      contact_id: 654,
      account_id: 1,
      inbox_id: 12,
      status: 'open'
    } as ChatwootConversation)

    const result = await prepareProfilingConversation(3)

    expect(createConversationMock).toHaveBeenCalledTimes(1)
    expect(result.conversationId).toBe(987)
    expect(result.contactId).toBe(654)
  })
})
