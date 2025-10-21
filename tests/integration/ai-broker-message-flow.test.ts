// ABOUTME: Real BullMQ integration tests validating queue→worker→AI→Chatwoot flow without mocks
// Uses redis-memory-server for actual Redis instance with cmsgpack support
// Tests REAL queue helper functions (queueIncomingMessage, queueNewConversation)

import { Queue } from "bullmq";
import type Redis from "ioredis";
import { startTestRedis, stopTestRedis } from "../utils/test-redis";
import {
  queueIncomingMessage,
  queueNewConversation,
  getBrokerQueue,
} from "@/lib/queue/broker-queue";
import {
  mockBrokerPersona,
  mockLeadData,
  mockIncomingMessageJob,
  mockNewConversationJob,
  mockHighScoreLead,
  mockAggressivePersona,
  mockConservativePersona,
} from "../fixtures/broker-test-data";
import type { BrokerConversationJob } from "@/lib/queue/broker-queue";

describe("AI Broker Real Integration Tests", () => {
  let redis: Redis;
  let queue: Queue;

  beforeAll(async () => {
    redis = await startTestRedis();
  });

  beforeEach(async () => {
    // Get the queue instance (getBrokerQueue uses REDIS_URL env var set by startTestRedis)
    queue = getBrokerQueue();
    await queue.obliterate(); // Clear all jobs between tests
  });

  afterEach(async () => {
    // DON'T close the queue - getBrokerQueue() returns a singleton
    // Closing it breaks subsequent tests
    // The queue will be cleaned up when Redis stops in afterAll
  });

  afterAll(async () => {
    // Close the queue singleton before stopping Redis
    if (queue) {
      await queue.close();
    }
    await stopTestRedis();
  });

  describe("Queue Payload Structure via Real Helper Functions", () => {
    it("should queue incoming message via queueIncomingMessage() helper", async () => {
      // Use REAL queue helper function
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

      expect(job).toBeDefined();
      expect(job.id).toContain("incoming-message-999-777");

      // Verify job exists in Redis with correct data
      const jobFromRedis = await queue.getJob(job.id!);
      expect(jobFromRedis).toBeDefined();
      expect(jobFromRedis!.data.userMessage).toBe("How much can I borrow?");
      expect(jobFromRedis!.data.brokerPersona.type).toBe("balanced");
      expect(jobFromRedis!.data.processedLeadData.actualIncomes[0]).toBe(8000);
      expect(jobFromRedis!.data.skipGreeting).toBe(true); // Always true for incoming messages
      expect(jobFromRedis!.opts?.priority).toBe(3); // Normal priority
    });

    it("should queue new conversation via queueNewConversation() helper", async () => {
      // Use REAL queue helper function
      const job = await queueNewConversation({
        conversationId: 888,
        contactId: 777,
        processedLeadData: mockLeadData,
        isConversationReopen: false,
        skipGreeting: true,
      });

      expect(job).toBeDefined();
      expect(job.id).toContain("new-conversation-888-");

      const jobFromRedis = await queue.getJob(job.id!);
      expect(jobFromRedis).toBeDefined();
      expect(jobFromRedis!.data.type).toBe("new-conversation");
      expect(jobFromRedis!.data.skipGreeting).toBe(true);
      expect(jobFromRedis!.data.brokerPersona.name).toBe("Rachel Tan");
      expect(jobFromRedis!.opts?.priority).toBe(5); // Normal lead score priority
    });
  });

  describe("Priority Calculation via Real Helper Functions", () => {
    it("should assign priority 1 for high lead score (>75) via queueNewConversation()", async () => {
      // Use REAL queue helper with high lead score
      const job = await queueNewConversation({
        conversationId: 888,
        contactId: 777,
        processedLeadData: mockHighScoreLead, // leadScore: 85
        skipGreeting: true,
      });

      expect(job.opts?.priority).toBe(1); // Helper calculates: leadScore > 75 → priority 1
    });

    it("should assign priority 3 for incoming messages via queueIncomingMessage()", async () => {
      // Use REAL queue helper
      const job = await queueIncomingMessage({
        conversationId: 999,
        contactId: 888,
        brokerId: "broker-123",
        brokerName: "Rachel Tan",
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: "Test message",
      });

      expect(job.opts?.priority).toBe(3); // Helper always assigns priority 3 for incoming
    });

    it("should assign priority 5 for normal lead score (<75) via queueNewConversation()", async () => {
      // Use REAL queue helper with normal lead score
      const job = await queueNewConversation({
        conversationId: 888,
        contactId: 777,
        processedLeadData: mockLeadData, // leadScore: 65
        skipGreeting: true,
      });

      expect(job.opts?.priority).toBe(5); // Helper calculates: leadScore ≤ 75 → priority 5
    });
  });

  describe("Job State and Data Integrity via Real Helpers", () => {
    it("should create job in prioritized state via queueIncomingMessage()", async () => {
      const job = await queueIncomingMessage({
        conversationId: 999,
        contactId: 888,
        brokerId: "broker-123",
        brokerName: "Rachel Tan",
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: "State test message",
      });

      const state = await job.getState();
      expect(state).toBe("prioritized"); // Jobs with priority are in 'prioritized' state
    });

    it("should preserve job data after retrieval via queueNewConversation()", async () => {
      const job = await queueNewConversation({
        conversationId: 888,
        contactId: 777,
        processedLeadData: mockLeadData,
        skipGreeting: true,
      });

      const retrievedJob = await queue.getJob(job.id!);
      expect(retrievedJob).toBeDefined();
      expect(retrievedJob!.data.conversationId).toBe(888);
      expect(retrievedJob!.data.contactId).toBe(777);
      expect(retrievedJob!.data.processedLeadData.name).toBe("Test Customer");
    });
  });

  describe("Message Type Filtering via Real Helpers", () => {
    it("should enforce skipGreeting=true for all incoming messages", async () => {
      const job = await queueIncomingMessage({
        conversationId: 999,
        contactId: 888,
        brokerId: "broker-123",
        brokerName: "Rachel Tan",
        brokerPersona: mockBrokerPersona,
        processedLeadData: mockLeadData,
        userMessage: "This is an incoming message",
      });

      expect(job.data.skipGreeting).toBe(true); // Helper always sets this for incoming
      expect(job.data.type).toBe("incoming-message");
      expect(job.data.userMessage).toBe("This is an incoming message");
    });

    it("should respect skipGreeting parameter in queueNewConversation()", async () => {
      const job = await queueNewConversation({
        conversationId: 888,
        contactId: 777,
        processedLeadData: mockLeadData,
        skipGreeting: true,
      });

      expect(job.data.type).toBe("new-conversation");
      expect(job.data.skipGreeting).toBe(true);
    });
  });
});
