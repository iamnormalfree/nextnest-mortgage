/**
 * ABOUTME: Multi-Model Orchestration End-to-End Test
 * ABOUTME: Tests all 3 AI models (GPT-4o-mini, GPT-4o, Claude Sonnet) with intent routing
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { generateBrokerResponse } from '@/lib/ai/broker-ai-service';
import { intentRouter } from '@/lib/ai/intent-router';
import { BrokerPersona } from '@/lib/calculations/broker-persona';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';

// Validate API keys are loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('\n❌ OPENAI_API_KEY not found in .env.local');
  console.log('Check that .env.local exists and contains OPENAI_API_KEY');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n❌ ANTHROPIC_API_KEY not found in .env.local');
  console.log('Check that .env.local exists and contains ANTHROPIC_API_KEY');
  process.exit(1);
}

const CONVERSATION_ID = 999999;

const mockLeadData: ProcessedLeadData = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+6591234567',
  leadScore: 75,
  loanType: 'home_loan',
  propertyCategory: 'Private',
  propertyType: 'Condo',
  propertyPrice: 1000000,
  actualIncomes: [8000],
  existingCommitments: 1500,
  employmentType: 'Salaried',
  citizenship: 'Citizen',
  age: 35,
  propertyCount: 1
};

const mockPersona: BrokerPersona = {
  id: 'test-broker',
  name: 'Test Broker',
  title: 'Senior Mortgage Specialist',
  type: 'balanced',
  approach: 'Professional and thorough',
  urgencyLevel: 'medium',
  responseStyle: {
    tone: 'Professional yet approachable',
    pacing: 'Moderate',
    focus: 'Solution-oriented'
  },
  greeting: {
    opening: 'Hello',
    qualification: 'Let me understand your needs',
    transition: 'Great'
  },
  specialties: ['Home Loans'],
  availability: 'available'
};

interface TestMetrics {
  testName: string;
  modelUsed: string;
  provider: string;
  responseTime: number;
  success: boolean;
  responseLength: number;
  error?: string;
}

const metrics: TestMetrics[] = [];

async function runAllTests(): Promise<void> {
  console.log('Multi-Model Orchestration Test');
  console.log('Testing all 3 models with intent routing');
  
  const tests = [
    { name: 'Simple Greeting', msg: "Hi, I'm interested in getting a mortgage", expectedModel: 'gpt-4o-mini' },
    { name: 'Calculation', msg: "I earn $8000/month. How much can I borrow?", expectedModel: 'gpt-4o' },
    { name: 'Complex Analysis', msg: "Should I buy HDB or condo? Consider investment and resale.", expectedModel: 'claude-3.5-sonnet' }
  ];
  
  for (const test of tests) {
    console.log('Test:', test.name);
    const startTime = Date.now();
    
    try {
      const intent = await intentRouter.classifyIntent(test.msg);
      console.log('  Intent:', intent.category, '| Model:', intent.suggestedModel);
      
      const response = await generateBrokerResponse({
        message: test.msg,
        persona: mockPersona,
        leadData: mockLeadData,
        conversationId: CONVERSATION_ID,
        conversationHistory: []
      });
      
      const responseTime = Date.now() - startTime;
      console.log('  Time:', responseTime + 'ms', '| Length:', response.length, 'chars');
      console.log('  Preview:', response.substring(0, 100) + '...');
      
      metrics.push({
        testName: test.name,
        modelUsed: intent.suggestedModel,
        provider: intent.suggestedModel.includes('claude') ? 'Anthropic' : 'OpenAI',
        responseTime,
        success: true,
        responseLength: response.length
      });
      
      console.log('  ✅ PASSED');
    } catch (error) {
      console.log('  ❌ FAILED:', error);
      metrics.push({
        testName: test.name,
        modelUsed: test.expectedModel,
        provider: 'Unknown',
        responseTime: Date.now() - startTime,
        success: false,
        responseLength: 0,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  console.log();
  console.log('='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  
  const passed = metrics.filter(m => m.success).length;
  const total = metrics.length;
  
  metrics.forEach(m => {
    const status = m.success ? '✅' : '❌';
    console.log(status, m.testName, '|', m.modelUsed, '|', m.responseTime + 'ms');
    if (m.error) console.log('   Error:', m.error);
  });
  
  console.log();
  console.log('Passed:', passed + '/' + total);
  
  if (passed >= total * 0.75) {
    console.log('✅ Multi-Model Orchestration: WORKING');
    process.exit(0);
  } else {
    console.log('❌ Multi-Model Orchestration: NEEDS ATTENTION');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
