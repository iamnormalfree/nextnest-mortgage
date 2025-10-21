// ABOUTME: Automated persona prompt validation tests
// Validates persona prompts contain expected tone keywords and compliance guardrails

import { createSystemPromptFromPersona } from '@/lib/ai/broker-ai-service';
import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';

describe('Persona Prompt Validation', () => {
  const mockLeadData: ProcessedLeadData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+6591234567',
    loanType: 'hdb_loan',
    propertyCategory: 'HDB',
    propertyType: '4-room BTO',
    actualIncomes: [8000],
    actualAges: [32],
    employmentType: 'salaried',
    leadScore: 65,
    sessionId: 'test-session-123',
    brokerPersona: {} as BrokerPersona,
    existingCommitments: 500,
    propertyPrice: 500000,
  };

  describe('Aggressive Persona Keywords', () => {
    const aggressivePersona: BrokerPersona = {
      id: 'michelle-chen',
      name: 'Michelle Chen',
      type: 'aggressive',
      title: 'Investment Property Specialist',
      approach: 'premium_rates_focus',
      urgencyLevel: 'high',
      avatar: '/images/brokers/michelle-chen.svg',
      responseStyle: {
        tone: 'confident, strategic, results-oriented',
        pacing: 'fast - exclusive opportunities',
        focus: 'investment strategies, portfolio growth'
      }
    };

    it('includes FOMO and urgency keywords', () => {
      const prompt = createSystemPromptFromPersona(aggressivePersona, mockLeadData);
      expect(prompt).toMatch(/limited time|exclusive|secure now/i);
      expect(prompt).toMatch(/ROI|investment|gains/i);
    });

    it('includes compliance guardrails', () => {
      const prompt = createSystemPromptFromPersona(aggressivePersona, mockLeadData);
      expect(prompt).toMatch(/Never provide regulated financial advice/i);
      expect(prompt).toMatch(/Never make up bank names/i);
    });
  });

  describe('Conservative Persona Keywords', () => {
    const conservativePersona: BrokerPersona = {
      id: 'grace-lim',
      name: 'Grace Lim',
      type: 'conservative',
      title: 'First-Time Buyer Specialist',
      approach: 'value_focused_supportive',
      urgencyLevel: 'low',
      avatar: '/images/brokers/grace-lim.svg',
      responseStyle: {
        tone: 'motherly, patient, educational',
        pacing: 'slow - build trust and understanding',
        focus: 'education, step-by-step guidance'
      }
    };

    it('includes patient and educational language', () => {
      const prompt = createSystemPromptFromPersona(conservativePersona, mockLeadData);
      expect(prompt).toMatch(/step by step|patient|educational/i);
      expect(prompt).toMatch(/no pressure|at your pace/i);
    });

    it('includes compliance guardrails', () => {
      const prompt = createSystemPromptFromPersona(conservativePersona, mockLeadData);
      expect(prompt).toMatch(/Never provide regulated financial advice/i);
    });
  });

  describe('Balanced Persona Keywords', () => {
    const balancedPersona: BrokerPersona = {
      id: 'rachel-tan',
      name: 'Rachel Tan',
      type: 'balanced',
      title: 'Millennial Mortgage Specialist',
      approach: 'educational_consultative',
      urgencyLevel: 'medium',
      avatar: '/images/brokers/rachel-tan.svg',
      responseStyle: {
        tone: 'modern, tech-savvy, approachable',
        pacing: 'moderate - digital-first guidance',
        focus: 'smart financing, future planning'
      }
    };

    it('includes professional language', () => {
      const prompt = createSystemPromptFromPersona(balancedPersona, mockLeadData);
      expect(prompt).toMatch(/professional|approachable/i);
    });

    it('does not include all aggressive keywords together', () => {
      const prompt = createSystemPromptFromPersona(balancedPersona, mockLeadData);
      const hasAllAggressiveKeywords = 
        /limited time/i.test(prompt) && 
        /exclusive rates/i.test(prompt) && 
        /secure now/i.test(prompt);
      expect(hasAllAggressiveKeywords).toBe(false);
    });
  });

  describe('Lead Data Context', () => {
    const testPersona: BrokerPersona = {
      id: 'rachel-tan',
      name: 'Rachel Tan',
      type: 'balanced',
      title: 'Millennial Mortgage Specialist',
      approach: 'educational_consultative',
      urgencyLevel: 'medium',
      avatar: '/images/brokers/rachel-tan.svg',
      responseStyle: {
        tone: 'modern, tech-savvy, approachable',
        pacing: 'moderate - digital-first guidance',
        focus: 'smart financing, future planning'
      }
    };

    it('includes lead score', () => {
      const prompt = createSystemPromptFromPersona(testPersona, mockLeadData);
      expect(prompt).toContain('65');
    });

    it('includes income', () => {
      const prompt = createSystemPromptFromPersona(testPersona, mockLeadData);
      expect(prompt).toMatch(/8[,]?000/);
    });

    it('includes customer name', () => {
      const prompt = createSystemPromptFromPersona(testPersona, mockLeadData);
      expect(prompt).toContain('Test User');
    });
  });

  describe('Singapore Context', () => {
    const testPersona: BrokerPersona = {
      id: 'rachel-tan',
      name: 'Rachel Tan',
      type: 'balanced',
      title: 'Millennial Mortgage Specialist',
      approach: 'educational_consultative',
      urgencyLevel: 'medium',
      avatar: '/images/brokers/rachel-tan.svg',
      responseStyle: {
        tone: 'modern, tech-savvy, approachable',
        pacing: 'moderate - digital-first guidance',
        focus: 'smart financing, future planning'
      }
    };

    it('includes Singapore mortgage market context', () => {
      const prompt = createSystemPromptFromPersona(testPersona, mockLeadData);
      expect(prompt).toMatch(/Singapore mortgage market/i);
    });

    it('mentions Singapore terms', () => {
      const prompt = createSystemPromptFromPersona(testPersona, mockLeadData);
      expect(prompt).toMatch(/HDB|CPF|TDSR|MSR/i);
    });
  });
});
