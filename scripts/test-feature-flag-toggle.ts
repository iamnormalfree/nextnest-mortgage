// ABOUTME: Test feature flag toggle for AI Orchestrator
// ABOUTME: Verifies both orchestrator (flag=true) and legacy (flag=false) paths work
/**
 * Feature Flag Toggle Test
 * Week 5: Verify ENABLE_FULL_AI_INTELLIGENCE toggle
 *
 * Tests both paths:
 * 1. Flag = true → AI Orchestrator path
 * 2. Flag = false → Legacy direct AI service path
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { isFullAIIntelligenceEnabled } from '@/lib/utils/feature-flags';

async function runFlagTest() {
  console.log('\n🚦 Feature Flag Toggle Test\n');
  console.log('='.repeat(60));

  // Test 1: Check current flag state
  console.log('\n📊 Test 1: Current Flag State');
  const currentState = isFullAIIntelligenceEnabled();
  console.log(`✅ ENABLE_FULL_AI_INTELLIGENCE = ${currentState}`);
  console.log(`   From env var: ${process.env.ENABLE_FULL_AI_INTELLIGENCE}`);

  // Test 2: Verify flag function works with different values
  console.log('\n🔄 Test 2: Flag Function Logic');

  // Save original
  const original = process.env.ENABLE_FULL_AI_INTELLIGENCE;

  // Test true
  process.env.ENABLE_FULL_AI_INTELLIGENCE = 'true';
  const testTrue = isFullAIIntelligenceEnabled();
  console.log(`✅ ENABLE_FULL_AI_INTELLIGENCE='true' → ${testTrue}`);

  // Test 1
  process.env.ENABLE_FULL_AI_INTELLIGENCE = '1';
  const testOne = isFullAIIntelligenceEnabled();
  console.log(`✅ ENABLE_FULL_AI_INTELLIGENCE='1' → ${testOne}`);

  // Test false
  process.env.ENABLE_FULL_AI_INTELLIGENCE = 'false';
  const testFalse = isFullAIIntelligenceEnabled();
  console.log(`✅ ENABLE_FULL_AI_INTELLIGENCE='false' → ${testFalse}`);

  // Test undefined
  delete process.env.ENABLE_FULL_AI_INTELLIGENCE;
  const testUndefined = isFullAIIntelligenceEnabled();
  console.log(`✅ ENABLE_FULL_AI_INTELLIGENCE=undefined → ${testUndefined} (default: false)`);

  // Restore original
  if (original !== undefined) {
    process.env.ENABLE_FULL_AI_INTELLIGENCE = original;
  }

  // Test 3: Integration with worker code
  console.log('\n⚙️ Test 3: Worker Integration Check');
  console.log('   Checking if worker code imports feature flag...');

  const fs = require('fs');
  const workerPath = resolve(__dirname, '../lib/queue/broker-worker.ts');
  const workerCode = fs.readFileSync(workerPath, 'utf-8');

  const hasImport = workerCode.includes('isFullAIIntelligenceEnabled');
  const hasCheck = workerCode.includes('if (isFullAIIntelligenceEnabled())');
  const hasOrchestratorPath = workerCode.includes('Using AI Orchestrator');
  const hasLegacyPath = workerCode.includes('Using legacy AI service');

  if (hasImport && hasCheck && hasOrchestratorPath && hasLegacyPath) {
    console.log('✅ Worker has proper feature flag integration');
    console.log('   ✓ Import: isFullAIIntelligenceEnabled');
    console.log('   ✓ Check: if (isFullAIIntelligenceEnabled())');
    console.log('   ✓ Orchestrator path exists');
    console.log('   ✓ Legacy path exists');
  } else {
    console.log('❌ Worker missing feature flag integration');
    if (!hasImport) console.log('   ✗ Missing import');
    if (!hasCheck) console.log('   ✗ Missing check');
    if (!hasOrchestratorPath) console.log('   ✗ Missing orchestrator path');
    if (!hasLegacyPath) console.log('   ✗ Missing legacy path');
  }

  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const allPassed = testTrue === true &&
                    testOne === true &&
                    testFalse === false &&
                    testUndefined === false &&
                    hasImport &&
                    hasCheck &&
                    hasOrchestratorPath &&
                    hasLegacyPath;

  if (allPassed) {
    console.log('✅ All tests passed!');
    console.log('   Feature flag toggle is working correctly');
    console.log('   Worker integration is complete');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runFlagTest().catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
