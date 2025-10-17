/**
 * AI Chat Intelligence System - Foundation Layer Tests
 * 
 * Comprehensive test suite for all foundation layer components:
 * 1. Redis Connection & State Management
 * 2. Supabase Connection & Repository
 * 3. Intent Router (heuristic + AI)
 * 4. Conversation State Manager
 * 5. Feature Flags
 * 
 * @version 1.0.0
 */

import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import { ConversationStateManager } from '@/lib/ai/conversation-state-manager';
import { IntentRouter } from '@/lib/ai/intent-router';
import { ConversationRepository } from '@/lib/db/conversation-repository';
import { getFeatureFlag, getCurrentFeatureFlags } from '@/lib/utils/feature-flags';
import { ProcessedLeadData } from '@/lib/integrations/chatwoot-client';
import { BrokerPersona } from '@/lib/calculations/broker-persona';

// Test results tracking
interface TestResult {
  testName: string;
  status: 'PASS' | 'SKIP' | 'FAIL';
  message: string;
  duration?: number;
  details?: any;
}

const results: TestResult[] = [];

// Utility functions
function logTest(testName: string) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST: ' + testName);
  console.log('='.repeat(80));
}

function recordResult(result: TestResult) {
  results.push(result);
  const emoji = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⚠️' : '❌';
  console.log('\n' + emoji + ' ' + result.status + ': ' + result.message);
  if (result.details) {
    console.log('Details:', JSON.stringify(result.details, null, 2));
  }
  if (result.duration !== undefined) {
    console.log('Duration: ' + result.duration + 'ms');
  }
}

async function runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
  logTest(testName);
  const startTime = Date.now();
  
  try {
    await testFn();
    recordResult({
      testName,
      status: 'PASS',
      message: testName + ' passed successfully',
      duration: Date.now() - startTime
    });
  } catch (error: any) {
    recordResult({
      testName,
      status: 'FAIL',
      message: error.message || 'Unknown error',
      duration: Date.now() - startTime,
      details: { error: error.toString(), stack: error.stack }
    });
  }
}

async function skipTest(testName: string, reason: string): Promise<void> {
  logTest(testName);
  recordResult({
    testName,
    status: 'SKIP',
    message: reason
  });
}

// Mock data generators
function createMockLeadData(): ProcessedLeadData {
  return {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+6591234567',
    loanType: 'hdb_loan',
    propertyCategory: 'hdb',
    propertyType: '4_room',
    actualIncomes: [5000, 4500],
    actualAges: [30, 28],
    employmentType: 'employed',
    leadScore: 75,
    sessionId: 'test-session-' + Date.now(),
    brokerPersona: {
      type: 'balanced',
      name: 'Sarah Wong',
      title: 'Family Mortgage Consultant',
      approach: 'educational_consultative',
      urgencyLevel: 'medium',
      avatar: '/images/brokers/sarah-wong.svg',
      responseStyle: {
        tone: 'warm, family-focused, trustworthy',
        pacing: 'moderate - educate then guide',
        focus: 'family needs, stable solutions'
      }
    },
    existingCommitments: 1000,
    propertyPrice: 500000
  };
}

// Test implementations will be added in next part
export async function testRedisConnection(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL not found in environment variables');
  }
  
  console.log('Connecting to Redis:', redisUrl.replace(/:[^:@]*@/, ':***@'));
  
  const redis = new Redis(redisUrl);
  
  try {
    // Test 1: Ping
    const pingResult = await redis.ping();
    if (pingResult !== 'PONG') {
      throw new Error('Expected PONG, got ' + pingResult);
    }
    console.log('✓ Redis PING successful');
    
    // Test 2: Write
    const testKey = 'ai:test:' + Date.now();
    const testValue = { test: 'data', timestamp: Date.now() };
    await redis.setex(testKey, 60, JSON.stringify(testValue));
    console.log('✓ Redis WRITE successful');
    
    // Test 3: Read
    const retrieved = await redis.get(testKey);
    if (!retrieved) {
      throw new Error('Failed to retrieve test data');
    }
    const parsed = JSON.parse(retrieved);
    if (parsed.test !== 'data') {
      throw new Error('Retrieved data does not match');
    }
    console.log('✓ Redis READ successful');
    
    // Test 4: TTL
    const ttl = await redis.ttl(testKey);
    if (ttl <= 0 || ttl > 60) {
      throw new Error('Invalid TTL: ' + ttl);
    }
    console.log('✓ Redis TTL successful (' + ttl + 's remaining)');
    
    // Test 5: Cleanup
    await redis.del(testKey);
    const afterDelete = await redis.get(testKey);
    if (afterDelete !== null) {
      throw new Error('Failed to delete test key');
    }
    console.log('✓ Redis DELETE successful');
    
  } finally {
    await redis.quit();
  }
}