// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { IntentRouter } from '@/lib/ai/intent-router';

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

async function testIntentRouter() {
  console.log('Testing Intent Router');
  console.log('='.repeat(60));
  
  const router = new IntentRouter();
  
  const tests = [
    { msg: 'Hello there!', expected: 'greeting' },
    { msg: 'How much can I borrow?', expected: 'calculation_request' },
    { msg: 'Send me the form', expected: 'document_request' },
    { msg: 'Should I buy now?', expected: 'complex_analysis' },
    { msg: 'Ready to apply', expected: 'next_steps' },
    { msg: 'Too expensive', expected: 'objection_handling' }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    const result = await router.classifyIntent(test.msg);
    const match = result.category === test.expected;
    if (match) passed++;
    
    console.log((match ? '✅' : '❌') + ' ' + test.msg.substring(0, 30).padEnd(30) + ' => ' + result.category);
  }
  
  console.log('Passed: ' + passed + '/' + tests.length);
  
  if (passed >= tests.length * 0.75) {
    console.log('✅ Intent Router working correctly');
    process.exit(0);
  } else {
    console.log('❌ Intent Router needs improvement');
    process.exit(1);
  }
}

testIntentRouter();
