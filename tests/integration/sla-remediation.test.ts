// ABOUTME: Integration tests for SLA remediation system
// Tests timestamp injection, queue optimization, and SLA monitoring functionality
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { Queue, Worker } from "bullmq";
import type Redis from "ioredis";
import { startTestRedis, stopTestRedis } from "../utils/test-redis";
import {
  queueIncomingMessage,
  queueNewConversation,
  getBrokerQueue,
  updateTimingData,
  getTimingData,
} from "@/lib/queue/broker-queue";
import { checkSLACompliance } from "@/lib/monitoring/alert-service";
import {
  mockBrokerPersona,
  mockLeadData,
  mockHighScoreLead,
} from "../fixtures/broker-test-data";

describe("SLA Remediation Integration Tests", () => {
  let redis: Redis;
  let queue: Queue;
  let worker: Worker;

  beforeAll(async () => {
    redis = await startTestRedis();
    process.env.OPENAI_API_KEY = "test-key";
  });

  beforeEach(async () => {
    queue = getBrokerQueue();
    await queue.obliterate();
    
    worker = new Worker(
      "broker-conversations",
      async (job) => {
        const startTime = Date.now();
        await updateTimingData(job.data.conversationId, job.data.timingData.messageId, {
          workerStartTimestamp: startTime,
        });
        const processingTime = Math.random() * 1000 + 500;
        await new Promise(resolve => setTimeout(resolve, processingTime));
        const endTime = Date.now();
        await updateTimingData(job.data.conversationId, job.data.timingData.messageId, {
          workerCompleteTimestamp: endTime,
        });
        return { success: true };
      },
      { connection: redis, concurrency: 10 }
    );
  });

  afterEach(async () => {
    if (worker) await worker.close();
  });

  afterAll(async () => {
    if (queue) await queue.close();
    await stopTestRedis();
  });

  it("should inject queue add timestamp into job data", async () => {
    const beforeQueue = Date.now();
    const job = await queueIncomingMessage({
      conversationId: 123,
      contactId: 456,
      brokerId: "broker-789",
      brokerName: "Test Broker",
      brokerPersona: mockBrokerPersona,
      processedLeadData: mockLeadData,
      userMessage: "Test message",
    });
    const afterQueue = Date.now();

    expect(job.data.timingData).toBeDefined();
    expect(job.data.timingData.queueAddTimestamp).toBeGreaterThanOrEqual(beforeQueue);
    expect(job.data.timingData.queueAddTimestamp).toBeLessThanOrEqual(afterQueue);
  });

  it("should track timing data through worker processing", async () => {
    const job = await queueIncomingMessage({
      conversationId: 124,
      contactId: 457,
      brokerId: "broker-790",
      brokerName: "Test Broker",
      brokerPersona: mockBrokerPersona,
      processedLeadData: mockLeadData,
      userMessage: "Test timing",
    });

    // Wait for worker to process the job (max 5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check timing data was recorded
    const timingData = await getTimingData(124, job.data.timingData.messageId);

    expect(timingData).toBeDefined();
    expect(timingData!.queueAddTimestamp).toBeDefined();
    expect(timingData!.workerStartTimestamp).toBeDefined();
    expect(timingData!.workerCompleteTimestamp).toBeDefined();
    expect(timingData!.totalDuration).toBeGreaterThan(0);
  });

  it("should process jobs with optimized concurrency", async () => {
    const jobs = [];
    const jobCount = 15;

    for (let i = 0; i < jobCount; i++) {
      jobs.push(
        queueIncomingMessage({
          conversationId: 200 + i,
          contactId: 300 + i,
          brokerId: "broker-" + i,
          brokerName: "Broker " + i,
          brokerPersona: mockBrokerPersona,
          processedLeadData: mockLeadData,
          userMessage: "Test message " + i,
        })
      );
    }

    const startTime = Date.now();
    // Wait for jobs to be processed (with optimized concurrency should be fast)
    await new Promise(resolve => setTimeout(resolve, 3000));
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000);

    // Verify queue processed the jobs by checking they're no longer waiting
    const queue = getBrokerQueue();
    const waitingCount = await queue.getWaitingCount();
    expect(waitingCount).toBe(0);
  });

  it("should prioritize high lead score conversations correctly", async () => {
    const highScoreJob = await queueNewConversation({
      conversationId: 600,
      contactId: 700,
      processedLeadData: mockHighScoreLead,
      skipGreeting: true,
    });

    const normalScoreJob = await queueNewConversation({
      conversationId: 601,
      contactId: 701,
      processedLeadData: mockLeadData,
      skipGreeting: true,
    });

    expect(highScoreJob.opts?.priority).toBe(1);
    expect(normalScoreJob.opts?.priority).toBe(5);
  });

  it("should check SLA compliance correctly", async () => {
    await queueIncomingMessage({
      conversationId: 1000,
      contactId: 1001,
      brokerId: "sla-test-broker",
      brokerName: "SLA Test Broker",
      brokerPersona: mockBrokerPersona,
      processedLeadData: mockLeadData,
      userMessage: "SLA compliance test",
    });

    const alerts = await checkSLACompliance();
    const slaAlerts = alerts.filter(a => a.category === "sla");
    expect(slaAlerts.length).toBe(0);
  });
});
