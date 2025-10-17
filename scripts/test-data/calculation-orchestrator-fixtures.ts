/**
 * ABOUTME: Test fixtures for calculation orchestrator end-to-end tests
 * ABOUTME: Provides 6 realistic Singapore mortgage scenarios for validating the complete Dr. Elena flow
 */

import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { BrokerPersona } from '@/lib/calculations/broker-persona';

export const testBrokerPersonas: Record<string, BrokerPersona> = {
  eager: {
    name: 'Dr. Elena Chen',
    type: 'aggressive' as const,
    name: 'Dr. Elena Chen',
    title: 'Technical Mortgage Specialist',
    urgencyLevel: 'high',
    approach: 'professional',
    avatar: 'Let us secure the best rates for you today!',
    responseStyle: { tone: 'data-driven'
  },
  balanced: {
    name: 'Michael Tan',
    type: 'balanced' as const,
    name: 'Michael Tan',
    title: 'Senior Mortgage Consultant',
    urgencyLevel: 'medium',
    approach: 'friendly',
    avatar: 'Let me walk you through your options.',
    responseStyle: { tone: 'consultative'
  },
  relaxed: {
    name: 'Sarah Lim',
    type: 'conservative' as const,
    name: 'Sarah Lim',
    title: 'Client Advisor',
    urgencyLevel: 'low',
    approach: 'empathetic',
    avatar: 'Take your time - I am here to help.',
    responseStyle: { tone: 'educational'
  }
};

export interface TestScenario {
  name: string;
  description: string;
  leadData: ProcessedLeadData;
  userMessage: string;
  brokerPersona: BrokerPersona;
  expectedCalculation: {
    maxLoanMin: number;
    maxLoanMax: number;
    tdsrUsedMax: number;
    limitingFactor?: 'TDSR' | 'MSR' | 'LTV';
    masCompliant: boolean;
  };
}

export const testScenarios: TestScenario[] = [
  {
    name: 'Fixed Income HDB (Baseline)',
    description: 'First-time buyer, salaried, HDB flat - should have MSR limit',
    leadData: {
      name: 'John Tan',
      email: 'john.tan@example.com',
      phone: '+6591234567',
      propertyType: 'HDB',
      propertyCategory: 'HDB 4-room',
      propertyPrice: 500000,
      actualIncomes: [6000],
      employmentType: 'Salaried Full-Time',
      age: 32,
      citizenship: 'Citizen',
      propertyCount: 1,
      existingCommitments: 500,
      timeline: '3-6 months',
      loanType: 'PRIVATE_PURCHASE',
      leadScore: 85,
      source: 'test'
    },
    userMessage: 'How much can I borrow for this HDB flat?',
    brokerPersona: testBrokerPersonas.balanced,
    expectedCalculation: {
      maxLoanMin: 337000,
      maxLoanMax: 345000,
      tdsrUsedMax: 55,
      limitingFactor: 'MSR',
      masCompliant: true
    }
  },
  {
    name: 'Self-Employed Private (Income Haircut)',
    description: 'Self-employed buyer, private condo - 70% income recognition',
    leadData: {
      name: 'Sarah Ong',
      email: 'sarah.ong@example.com',
      phone: '+6592345678',
      propertyType: 'Private',
      propertyCategory: 'Private Condo',
      propertyPrice: 1200000,
      actualIncomes: [15000],
      employmentType: 'Self-Employed / Business Owner',
      age: 38,
      citizenship: 'Citizen',
      propertyCount: 1,
      existingCommitments: 1000,
      timeline: '6-12 months',
      loanType: 'PRIVATE_PURCHASE',
      leadScore: 75,
      source: 'test'
    },
    userMessage: 'What is my maximum loan amount for this condo?',
    brokerPersona: testBrokerPersonas.eager,
    expectedCalculation: {
      maxLoanMin: 830000,
      maxLoanMax: 850000,
      tdsrUsedMax: 55,
      limitingFactor: 'TDSR',
      masCompliant: true
    }
  },
  {
    name: 'Variable Income EC (Commission)',
    description: 'Sales professional with commission income, EC purchase',
    leadData: {
      name: 'David Lim',
      email: 'david.lim@example.com',
      phone: '+6593456789',
      propertyType: 'EC',
      propertyCategory: 'Executive Condo',
      propertyPrice: 900000,
      actualIncomes: [10000],
      employmentType: 'Salaried + Commission',
      age: 35,
      citizenship: 'Citizen',
      propertyCount: 1,
      existingCommitments: 800,
      timeline: '3-6 months',
      loanType: 'PRIVATE_PURCHASE',
      leadScore: 80,
      source: 'test'
    },
    userMessage: 'Can you calculate my loan eligibility for this EC?',
    brokerPersona: testBrokerPersonas.balanced,
    expectedCalculation: {
      maxLoanMin: 630000,
      maxLoanMax: 680000,
      tdsrUsedMax: 55,
      limitingFactor: 'TDSR',
      masCompliant: true
    }
  },
  {
    name: 'Second Property HDB (LTV Penalty)',
    description: 'Second property purchase - 45% LTV limit',
    leadData: {
      name: 'Michelle Wong',
      email: 'michelle.wong@example.com',
      phone: '+6594567890',
      propertyType: 'HDB',
      propertyCategory: 'HDB 5-room',
      propertyPrice: 600000,
      actualIncomes: [8000],
      employmentType: 'Salaried Full-Time',
      age: 40,
      citizenship: 'Citizen',
      propertyCount: 2,
      existingCommitments: 1200,
      timeline: '1-3 months',
      loanType: 'PRIVATE_PURCHASE',
      leadScore: 70,
      source: 'test'
    },
    userMessage: 'How much can I borrow for my second property?',
    brokerPersona: testBrokerPersonas.relaxed,
    expectedCalculation: {
      maxLoanMin: 265000,
      maxLoanMax: 275000,
      tdsrUsedMax: 55,
      limitingFactor: 'LTV',
      masCompliant: true
    }
  },
  {
    name: 'TDSR Violation (Over-committed)',
    description: 'High debt obligations causing TDSR breach',
    leadData: {
      name: 'Robert Ng',
      email: 'robert.ng@example.com',
      phone: '+6595678901',
      propertyType: 'Private',
      propertyCategory: 'Private Condo',
      propertyPrice: 1500000,
      actualIncomes: [8000],
      employmentType: 'Salaried Full-Time',
      age: 45,
      citizenship: 'Citizen',
      propertyCount: 1,
      existingCommitments: 4000,
      timeline: '6-12 months',
      loanType: 'PRIVATE_PURCHASE',
      leadScore: 50,
      source: 'test'
    },
    userMessage: 'Can I afford this property?',
    brokerPersona: testBrokerPersonas.relaxed,
    expectedCalculation: {
      maxLoanMin: 30000,
      maxLoanMax: 100000,
      tdsrUsedMax: 100,
      masCompliant: false
    }
  },
  {
    name: 'Joint Application (Co-applicant)',
    description: 'Joint application with spouse, combined income',
    leadData: {
      name: 'James and Emily Chua',
      email: 'james.chua@example.com',
      phone: '+6596789012',
      propertyType: 'Private',
      propertyCategory: 'Private Condo',
      propertyPrice: 1800000,
      actualIncomes: [12000, 9000],
      employmentType: 'Salaried Full-Time',
      age: 36,
      coApplicantAge: 34,
      citizenship: 'Citizen',
      propertyCount: 1,
      existingCommitments: 1500,
      timeline: '3-6 months',
      loanType: 'PRIVATE_PURCHASE',
      leadScore: 90,
      source: 'test'
    },
    userMessage: 'What is our combined loan eligibility?',
    brokerPersona: testBrokerPersonas.eager,
    expectedCalculation: {
      maxLoanMin: 1200000,
      maxLoanMax: 1350000,
      tdsrUsedMax: 55,
      limitingFactor: 'LTV',
      masCompliant: true
    }
  }
];

export function generateTestConversationId(testName: string): number {
  const hash = testName.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return Math.abs(hash % 100000);
}
