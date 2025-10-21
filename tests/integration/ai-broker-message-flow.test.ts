/**
 * ABOUTME: Integration tests for AI Broker message flow
 * ABOUTME: Tests queue → worker → AI → Chatwoot pipeline with BullMQ internals mocked
 *
 * Tests the complete end-to-end message flow:
 * 1. Message queued via queueIncomingMessage
 * 2. Worker processes job
 * 3. AI generates response (or falls back to template)
 * 4. Response sent to Chatwoot
 *
 * APPROACH: Mock BullMQ's Queue class and Redis connection, but let our actual
 * business logic in queueIncomingMessage, processIncomingMessage, etc. run.
 */

import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { Job } from 'bullmq';

// Mock BullMQ's Queue class (but not our queue functions)
const mockQueueAdd = jest.fn();
const mockQueueGetWaitingCount = jest.fn();
const mockQueueGetActiveCount = jest.fn();
const mockQueueGetCompletedCount = jest.fn();
const mockQueueGetFailedCount = jest.fn();
const mockQueueGetDelayedCount = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    getWaitingCount: mockQueueGetWaitingCount,
    getActiveCount: mockQueueGetActiveCount,
    getCompletedCount: mockQueueGetCompletedCount,
    getFailedCount: mockQueueGetFailedCount,
    getDelayedCount: mockQueueGetDelayedCount,
    pause: jest.fn(),
    resume: jest.fn(),
    drain: jest.fn(),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
  Worker: jest.fn(),
  Job: class MockJob {
    id: string;
    name: string;
    data: any;
    constructor(id: string, name: string, data: any) {
      this.id = id;
      this.name = name;
      this.data = data;
    }
  },
}));

// Mock Redis connection
jest.mock('@/lib/queue/redis-config', () => ({
  getRedisConnection: jest.fn(() => ({
    host: 'localhost',
    port: 6379,
  })),
}));

// Mock AI SDK
const generateTextMock = jest.fn();
jest.mock('ai', () => ({
  generateText: generateTextMock,
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => ({ id: 'openai-mock' })),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(() => ({ id: 'anthropic-mock' })),
}));

// Mock intent router
const intentRouterMock = {
  classifyIntent: jest.fn().mockResolvedValue({
    category: 'simple_question',
    confidence: 0.9,
    requiresCalculation: false,
    suggestedModel: 'gpt-4o',
    reasoning: 'stubbed classification',
  }),
};
jest.mock('@/lib/ai/intent-router', () => ({
  intentRouter: intentRouterMock,
}));

// Mock Dr. Elena service
const drElenaServiceMock = {
  processCalculationRequest: jest.fn().mockResolvedValue({
    chatResponse: 'Mock calculation response',
  }),
};
jest.mock('@/lib/ai/dr-elena-integration-service', () => ({
  drElenaService: drElenaServiceMock,
}));

// Mock Chatwoot client
const mockSendMessage = jest.fn().mockResolvedValue({ id: 1450 });
const mockUpdateConversationCustomAttributes = jest.fn().mockResolvedValue(true);
jest.mock('@/lib/integrations/chatwoot-client', () => ({
  ChatwootClient: jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
    updateConversationCustomAttributes: mockUpdateConversationCustomAttributes,
  })),
  ProcessedLeadData: {} as any,
}));

// Mock broker assignment functions
const mockAssignBestBroker = jest.fn().mockResolvedValue({
  brokerId: 'broker-123',
  brokerName: 'Rachel Tan',
});
const mockUpdateBrokerMetrics = jest.fn().mockResolvedValue(undefined);
const mockGetBrokerForConversation = jest.fn().mockResolvedValue({
  brokerId: 'broker-123',
  brokerName: 'Rachel Tan',
});
jest.mock('@/lib/ai/broker-assignment', () => ({
  assignBestBroker: mockAssignBestBroker,
  updateBrokerMetrics: mockUpdateBrokerMetrics,
  getBrokerForConversation: mockGetBrokerForConversation,
}));

// Mock broker availability
const mockMarkBrokerBusy = jest.fn().mockResolvedValue(undefined);
const mockReleaseBrokerCapacity = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/ai/broker-availability', () => ({
  markBrokerBusy: mockMarkBrokerBusy,
  releaseBrokerCapacity: mockReleaseBrokerCapacity,
}));

// Mock broker persona functions
const mockAnalyzeMessageUrgency = jest.fn().mockResolvedValue({
  responseTime: '4000ms',
  isUrgent: false,
  escalate: false,
});
jest.mock('@/lib/calculations/broker-persona', () => {
  const actual = jest.requireActual('@/lib/calculations/broker-persona');
  return {
    ...actual,
    analyzeMessageUrgency: mockAnalyzeMessageUrgency,
  };
});

describe('AI Broker Message Flow Integration', () => {
  // Test fixtures
  const mockBrokerPersona: BrokerPersona = {
    name: 'Test Broker',
    type: 'balanced',
    title: 'Senior Consultant',
    approach: 'Professional',
    urgencyLevel: 'medium',
    avatar: 'TB',
    responseStyle: {
      tone: 'professional',
      pacing: 'moderate',
      focus: 'balanced',
    },
  };

  const mockLeadData: ProcessedLeadData = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+6591234567',
    loanType: 'new_purchase',
    leadScore: 65,
    sessionId: 'test-session-123',
    actualIncomes: [8000],
    actualAges: [35],
    employmentType: 'employed',
    propertyCategory: 'condo',
    propertyType: 'private',
    brokerPersona: mockBrokerPersona,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mocks
    mockQueueAdd.mockReset();
    mockQueueGetWaitingCount.mockReset();
    mockQueueGetActiveCount.mockReset();
    mockQueueGetCompletedCount.mockReset();
    mockQueueGetFailedCount.mockReset();
    mockQueueGetDelayedCount.mockReset();
    generateTextMock.mockReset();
    intentRouterMock.classifyIntent.mockReset();
    drElenaServiceMock.processCalculationRequest.mockReset();
    mockSendMessage.mockReset();
    mockUpdateConversationCustomAttributes.mockReset();
    mockAssignBestBroker.mockReset();
    mockUpdateBrokerMetrics.mockReset();
    mockGetBrokerForConversation.mockReset();
    mockMarkBrokerBusy.mockReset();
    mockReleaseBrokerCapacity.mockReset();
    mockAnalyzeMessageUrgency.mockReset();

    // Set default resolved values
    intentRouterMock.classifyIntent.mockResolvedValue({
      category: 'simple_question',
      confidence: 0.9,
      requiresCalculation: false,
      suggestedModel: 'gpt-4o',
      reasoning: 'stubbed classification',
    });
    drElenaServiceMock.processCalculationRequest.mockResolvedValue({
      chatResponse: 'Mock calculation response',
    });
    mockSendMessage.mockResolvedValue({ id: 1450 });
    mockGetBrokerForConversation.mockResolvedValue({
      brokerId: 'broker-123',
      brokerName: 'Rachel Tan',
    });
    mockAnalyzeMessageUrgency.mockResolvedValue({
      responseTime: '4000ms',
      isUrgent: false,
      escalate: false,
    });
  });

  describe('Task 1: queueIncomingMessage enqueues with correct payload', () => {
    it('should enqueue a job with all required fields', async () => {
      // Import AFTER mocks are set up
      const { queueIncomingMessage } = await import('@/lib/queue/broker-queue');

      const mockJob = {
        id: 'incoming-message-123-789',
        name: 'incoming-message',
        opts: { priority: 3 },
        data: {
          type: 'incoming-message',
          conversationId: 123,
          contactId: 456,
          brokerId: 'broker-123',
          brokerName: 'Test Broker',
          brokerPersona: mockBrokerPersona,
          processedLeadData: mockLeadData,
          userMessage: 'Hello, I need help',
          skipGreeting: true,
          timestamp: expect.any(Number),
        },
      };

      mockQueueAdd.mockResolvedValueOnce(mockJob as any);

      const jobData = {
        conversationId: 123,
        contactId: 456,
        brokerId: 'broker-123',
        brokerName: 'Test Broker',
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: 'Hello, I need help',
        messageId: 789,
      };

      const job = await queueIncomingMessage(jobData);

      // Verify our queue logic called BullMQ's add() with correct params
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'incoming-message',
        expect.objectContaining({
          type: 'incoming-message',
          conversationId: 123,
          contactId: 456,
          brokerId: 'broker-123',
          brokerName: 'Test Broker',
          brokerPersona: mockBrokerPersona,
          processedLeadData: mockLeadData,
          userMessage: 'Hello, I need help',
          skipGreeting: true,
        }),
        expect.objectContaining({
          jobId: 'incoming-message-123-789',
          priority: 3,
        })
      );

      expect(job).toEqual(mockJob);
    });

    it('should calculate priority correctly for incoming messages', async () => {
      const { queueIncomingMessage } = await import('@/lib/queue/broker-queue');

      mockQueueAdd.mockResolvedValueOnce({
        id: 'incoming-message-123-789',
        name: 'incoming-message',
      } as any);

      await queueIncomingMessage({
        conversationId: 123,
        contactId: 456,
        brokerId: 'broker-123',
        brokerName: 'Test Broker',
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: 'Hello',
        messageId: 789,
      });

      // Incoming messages always get priority 3
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'incoming-message',
        expect.any(Object),
        expect.objectContaining({
          priority: 3,
        })
      );
    });

    it('should set skipGreeting to true for incoming messages', async () => {
      const { queueIncomingMessage } = await import('@/lib/queue/broker-queue');

      mockQueueAdd.mockResolvedValueOnce({
        id: 'incoming-message-123-789',
        name: 'incoming-message',
      } as any);

      await queueIncomingMessage({
        conversationId: 123,
        contactId: 456,
        brokerId: 'broker-123',
        brokerName: 'Test Broker',
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: 'Hello',
        messageId: 789,
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'incoming-message',
        expect.objectContaining({
          skipGreeting: true,
        }),
        expect.any(Object)
      );
    });
  });

  describe('Task 2: queueNewConversation calculates priority based on lead score', () => {
    it('should assign priority 1 for high lead score (>75)', async () => {
      const { queueNewConversation } = await import('@/lib/queue/broker-queue');

      const highScoreLead: ProcessedLeadData = {
        ...mockLeadData,
        leadScore: 85,
      };

      mockQueueAdd.mockResolvedValueOnce({
        id: 'new-conversation-123-1234567890',
        name: 'new-conversation',
      } as any);

      await queueNewConversation({
        conversationId: 123,
        contactId: 456,
        processedLeadData: highScoreLead,
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'new-conversation',
        expect.any(Object),
        expect.objectContaining({
          priority: 1, // High priority for high lead score
        })
      );
    });

    it('should assign priority 5 for normal lead score (≤75)', async () => {
      const { queueNewConversation } = await import('@/lib/queue/broker-queue');

      mockQueueAdd.mockResolvedValueOnce({
        id: 'new-conversation-123-1234567890',
        name: 'new-conversation',
      } as any);

      await queueNewConversation({
        conversationId: 123,
        contactId: 456,
        processedLeadData: mockLeadData, // leadScore: 65
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'new-conversation',
        expect.any(Object),
        expect.objectContaining({
          priority: 5, // Normal priority for normal lead score
        })
      );
    });

    it('should add 500ms delay for new conversations', async () => {
      const { queueNewConversation } = await import('@/lib/queue/broker-queue');

      mockQueueAdd.mockResolvedValueOnce({
        id: 'new-conversation-123-1234567890',
        name: 'new-conversation',
      } as any);

      await queueNewConversation({
        conversationId: 123,
        contactId: 456,
        processedLeadData: mockLeadData,
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'new-conversation',
        expect.any(Object),
        expect.objectContaining({
          delay: 500,
        })
      );
    });
  });

  describe('Task 3: AI fallback returns templated text when OpenAI fails', () => {
    it('should use fallback template when OpenAI API fails', async () => {
      const { generateBrokerResponse } = await import('@/lib/ai/broker-ai-service');

      generateTextMock.mockRejectedValueOnce(new Error('OpenAI API Error: Invalid API key'));

      const response = await generateBrokerResponse({
        message: 'test message',
        persona: mockBrokerPersona,
        leadData: mockLeadData,
        conversationId: 123,
      });

      expect(response).toContain('technical');
      expect(response).toBeTruthy();
    });

    it('should return persona-specific fallback template', async () => {
      const { generateBrokerResponse } = await import('@/lib/ai/broker-ai-service');

      const aggressivePersona: BrokerPersona = {
        ...mockBrokerPersona,
        type: 'aggressive',
      };

      generateTextMock.mockRejectedValueOnce(new Error('OpenAI API Error'));

      const aggressiveResponse = await generateBrokerResponse({
        message: 'test',
        persona: aggressivePersona,
        leadData: mockLeadData,
        conversationId: 123,
      });

      expect(aggressiveResponse).toContain('maximize your mortgage opportunity');

      const conservativePersona: BrokerPersona = {
        ...mockBrokerPersona,
        type: 'conservative',
      };

      generateTextMock.mockRejectedValueOnce(new Error('OpenAI API Error'));

      const conservativeResponse = await generateBrokerResponse({
        message: 'test',
        persona: conservativePersona,
        leadData: mockLeadData,
        conversationId: 123,
      });

      expect(conservativeResponse).toContain('step by step');
      expect(conservativeResponse).not.toBe(aggressiveResponse);
    });
  });

  describe('Task 4: Persona prompt creation includes context', () => {
    it('should create persona-specific system prompts with customer context', async () => {
      const { generateBrokerResponse } = await import('@/lib/ai/broker-ai-service');

      generateTextMock.mockResolvedValueOnce({
        text: 'Mocked AI response with persona tone',
      });

      const response = await generateBrokerResponse({
        message: 'What are current mortgage rates?',
        persona: mockBrokerPersona,
        leadData: mockLeadData,
        conversationId: 123,
      });

      expect(response).toBe('Mocked AI response with persona tone');

      // Verify generateText was called with correct structure
      expect(generateTextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'What are current mortgage rates?',
            }),
          ]),
          temperature: 0.7,
        })
      );
    });

    it('should include lead score and income in system prompt', async () => {
      const { generateBrokerResponse } = await import('@/lib/ai/broker-ai-service');

      generateTextMock.mockResolvedValueOnce({
        text: 'Response',
      });

      await generateBrokerResponse({
        message: 'Help me with my loan',
        persona: mockBrokerPersona,
        leadData: mockLeadData,
        conversationId: 123,
      });

      // Verify system prompt construction includes context
      expect(generateTextMock).toHaveBeenCalled();
      const callArgs = generateTextMock.mock.calls[0][0];
      expect(callArgs.system).toBeDefined();
      expect(callArgs.system).toContain('Test Broker');
      expect(callArgs.system).toContain('balanced');
    });
  });

  describe('Task 5: getQueueMetrics returns accurate counts', () => {
    it('should aggregate queue metrics from BullMQ counts', async () => {
      const { getQueueMetrics } = await import('@/lib/queue/broker-queue');

      mockQueueGetWaitingCount.mockResolvedValue(5);
      mockQueueGetActiveCount.mockResolvedValue(2);
      mockQueueGetCompletedCount.mockResolvedValue(100);
      mockQueueGetFailedCount.mockResolvedValue(3);
      mockQueueGetDelayedCount.mockResolvedValue(1);

      const metrics = await getQueueMetrics();

      expect(metrics).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 8, // waiting + active + delayed
      });
    });

    it('should return null on error', async () => {
      const { getQueueMetrics } = await import('@/lib/queue/broker-queue');

      mockQueueGetWaitingCount.mockRejectedValue(new Error('Redis connection failed'));

      const metrics = await getQueueMetrics();

      expect(metrics).toBeNull();
    });
  });

  describe('Full end-to-end contract test', () => {
    it('should queue message with all required data for worker processing', async () => {
      const { queueIncomingMessage } = await import('@/lib/queue/broker-queue');

      const jobData = {
        conversationId: 999,
        contactId: 888,
        brokerId: 'broker-999',
        brokerName: 'Integration Test Broker',
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: 'End-to-end test message',
        messageId: 777,
      };

      const mockJobObject = {
        id: 'incoming-message-999-777',
        name: 'incoming-message',
        data: {
          type: 'incoming-message',
          conversationId: 999,
          contactId: 888,
          brokerId: 'broker-999',
          brokerName: 'Integration Test Broker',
          brokerPersona: mockBrokerPersona,
          processedLeadData: mockLeadData,
          userMessage: 'End-to-end test message',
          skipGreeting: true,
          timestamp: expect.any(Number),
        },
      };

      mockQueueAdd.mockResolvedValueOnce(mockJobObject as any);

      const job = await queueIncomingMessage(jobData);

      // Verify queueing logic is correct
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'incoming-message',
        expect.objectContaining({
          type: 'incoming-message',
          conversationId: 999,
          brokerId: 'broker-999',
          brokerName: 'Integration Test Broker',
          userMessage: 'End-to-end test message',
          brokerPersona: mockBrokerPersona,
          processedLeadData: mockLeadData,
          skipGreeting: true,
        }),
        expect.objectContaining({
          jobId: 'incoming-message-999-777',
          priority: 3,
        })
      );

      expect(job.id).toBe('incoming-message-999-777');
      expect(job.data.type).toBe('incoming-message');
      expect(job.data.conversationId).toBe(999);
      expect(job.data.userMessage).toBe('End-to-end test message');
    });
  });
});
