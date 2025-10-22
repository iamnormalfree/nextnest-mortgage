// ABOUTME: Reusable test fixtures for AI Broker integration tests
// ABOUTME: Provides consistent test data for personas, leads, and conversation jobs

import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { BrokerConversationJob } from '@/lib/queue/broker-queue';

/**
 * Mock broker persona for testing
 * Based on Rachel Tan (balanced, millennial) from broker-persona.ts
 */
export const mockBrokerPersona: BrokerPersona = {
  type: 'balanced',
  name: 'Rachel Tan',
  title: 'Senior Mortgage Specialist',
  approach: 'Professional and Modern',
  urgencyLevel: 'medium',
  avatar: 'RT',
  responseStyle: {
    tone: 'professional yet approachable',
    pacing: 'moderate',
    focus: 'balanced',
  },
};

/**
 * Mock processed lead data for testing
 * Represents a typical qualified lead
 */
export const mockLeadData: ProcessedLeadData = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+6591234567',
  loanType: 'new_purchase',
  propertyCategory: 'condo',
  propertyType: 'private',
  actualIncomes: [8000],
  actualAges: [35],
  employmentType: 'employed',
  leadScore: 65,
  sessionId: 'test-session-123',
  brokerPersona: mockBrokerPersona,
  propertyPrice: 500000,
  existingCommitments: 1000,
};

/**
 * Mock conversation job data for incoming message tests
 */
export const mockIncomingMessageJob: Omit<BrokerConversationJob, 'timestamp'> = {
  type: 'incoming-message',
  conversationId: 999,
  contactId: 888,
  brokerId: 'broker-123',
  brokerName: 'Rachel Tan',
  brokerPersona: mockBrokerPersona,
  processedLeadData: mockLeadData,
  userMessage: 'How much can I borrow?',
  skipGreeting: true,
};

/**
 * Mock conversation job data for new conversation tests
 */
export const mockNewConversationJob: Omit<BrokerConversationJob, 'timestamp'> = {
  type: 'new-conversation',
  conversationId: 999,
  contactId: 888,
  brokerPersona: mockBrokerPersona,
  processedLeadData: mockLeadData,
  isConversationReopen: false,
  skipGreeting: true, // Fix: Should be true as tests expect
};

/**
 * High lead score data for priority testing
 */
export const mockHighScoreLead: ProcessedLeadData = {
  ...mockLeadData,
  leadScore: 85,
};

/**
 * Aggressive broker persona for fallback testing
 */
export const mockAggressivePersona: BrokerPersona = {
  type: 'aggressive',
  name: 'Michelle Chen',
  title: 'Investment Property Specialist',
  approach: 'Direct and Results-Driven',
  urgencyLevel: 'high',
  avatar: 'MC',
  responseStyle: {
    tone: 'confident and action-oriented',
    pacing: 'fast',
    focus: 'ROI and investment gains',
  },
};

/**
 * Conservative broker persona for fallback testing
 */
export const mockConservativePersona: BrokerPersona = {
  type: 'conservative',
  name: 'Grace Lim',
  title: 'First-Time Buyer Specialist',
  approach: 'Patient and Educational',
  urgencyLevel: 'low',
  avatar: 'GL',
  responseStyle: {
    tone: 'warm and reassuring',
    pacing: 'slow',
    focus: 'education and understanding',
  },
};
