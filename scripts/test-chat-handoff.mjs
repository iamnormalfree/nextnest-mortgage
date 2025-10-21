#!/usr/bin/env node
/**
 * ABOUTME: Diagnostic script to test lead form to chat handoff flow
 * Tests the complete chain: Form completion → ChatTransitionScreen → Chatwoot API → Chat page navigation
 */

// Use built-in fetch (Node 18+)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005';
const PRODUCTION_URL = 'https://nextnest.sg';

// Test form data matching ProgressiveForm Step 3 completion
const testFormData = {
  formData: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+6591234567',
    loanType: 'new_purchase',
    propertyCategory: 'resale',
    propertyType: 'HDB',
    actualAges: [35],
    actualIncomes: [8000],
    employmentType: 'employed'
  },
  sessionId: `test-session-${Date.now()}`,
  leadScore: 75
};

console.log('🧪 Lead Form to Chat Handoff Diagnostic Test');
console.log('='.repeat(60));

// Test 1: Check if Chatwoot environment variables are configured
console.log('\n📋 Test 1: Checking Chatwoot Configuration');
console.log('-'.repeat(60));

const requiredEnvVars = [
  'CHATWOOT_API_TOKEN',
  'CHATWOOT_BASE_URL',
  'CHATWOOT_ACCOUNT_ID',
  'CHATWOOT_INBOX_ID',
  'CHATWOOT_WEBSITE_TOKEN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 These should be set in Railway or your .env file');
} else {
  console.log('✅ All Chatwoot environment variables are configured');
  console.log(`   Base URL: ${process.env.CHATWOOT_BASE_URL}`);
  console.log(`   Account ID: ${process.env.CHATWOOT_ACCOUNT_ID}`);
  console.log(`   Inbox ID: ${process.env.CHATWOOT_INBOX_ID}`);
}

// Test 2: Test the Chatwoot conversation API endpoint
console.log('\n📋 Test 2: Testing /api/chatwoot-conversation Endpoint');
console.log('-'.repeat(60));

try {
  console.log(`🔄 Sending POST request to ${BASE_URL}/api/chatwoot-conversation`);
  console.log(`📦 Payload:`, JSON.stringify(testFormData, null, 2));

  const response = await fetch(`${BASE_URL}/api/chatwoot-conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testFormData)
  });

  const data = await response.json();

  console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
  console.log(`📦 Response Body:`, JSON.stringify(data, null, 2));

  if (response.ok && data.success && data.conversationId > 0) {
    console.log('\n✅ SUCCESS: Chatwoot conversation created successfully');
    console.log(`   Conversation ID: ${data.conversationId}`);
    console.log(`   Widget Config: ${data.widgetConfig ? '✓ Present' : '✗ Missing'}`);
    console.log(`   Broker Name: ${data.widgetConfig?.customAttributes?.ai_broker_name || 'N/A'}`);

    // Test 3: Check if chat page would load
    console.log('\n📋 Test 3: Checking Chat Page Navigation');
    console.log('-'.repeat(60));

    const chatPageUrl = `${BASE_URL}/chat?conversation=${data.conversationId}`;
    console.log(`🔄 Testing navigation to: ${chatPageUrl}`);

    const chatPageResponse = await fetch(chatPageUrl);
    if (chatPageResponse.ok) {
      console.log('✅ Chat page is accessible');
      console.log(`   Status: ${chatPageResponse.status}`);
    } else {
      console.log('❌ Chat page returned an error');
      console.log(`   Status: ${chatPageResponse.status} ${chatPageResponse.statusText}`);
    }

  } else if (data.fallback) {
    console.log('\n⚠️  FALLBACK MODE: Chatwoot not fully configured');
    console.log(`   Fallback Type: ${data.fallback.type}`);
    console.log(`   Contact: ${data.fallback.contact}`);
    console.log(`   Message: ${data.fallback.message}`);
    console.log('\n💡 This means ChatTransitionScreen will show fallback options instead of navigating to chat');
  } else {
    console.log('\n❌ UNEXPECTED RESPONSE: API returned success=false or invalid conversationId');
    console.log('   This indicates a problem with the conversation creation flow');
  }

} catch (error) {
  console.log('\n❌ ERROR: Failed to connect to API endpoint');
  console.log(`   Error: ${error.message}`);
  console.log('\n💡 Make sure the development server is running (`npm run dev`)');
}

// Test 4: Production check (if not running locally)
if (BASE_URL === 'http://localhost:3005') {
  console.log('\n📋 Test 4: Production Environment Check');
  console.log('-'.repeat(60));
  console.log('💡 To test against production, run:');
  console.log(`   BASE_URL=${PRODUCTION_URL} node scripts/test-chat-handoff.mjs`);
}

console.log('\n' + '='.repeat(60));
console.log('🎯 Diagnostic Summary');
console.log('='.repeat(60));

console.log('\n📝 Expected Flow:');
console.log('   1. User completes Step 4 of progressive form');
console.log('   2. ProgressiveFormWithController sets showChatTransition=true');
console.log('   3. ChatTransitionScreen shows analyzing animation (3.5s)');
console.log('   4. User clicks "Continue to Chat" button');
console.log('   5. ChatTransitionScreen calls /api/chatwoot-conversation');
console.log('   6. API creates Chatwoot conversation and returns conversationId');
console.log('   7. onTransitionComplete navigates to /chat?conversation=<id>');
console.log('   8. Chat page loads CustomChatInterface with conversation');

console.log('\n🔍 Common Issues:');
console.log('   ❌ Missing Chatwoot env vars → Fallback mode (phone/email options)');
console.log('   ❌ Network error → Retry with exponential backoff (max 3 retries)');
console.log('   ❌ Circuit breaker open → 503 error with fallback');
console.log('   ❌ Chat page 404 → Check app/chat/page.tsx exists');
console.log('   ❌ Conversation not found → Check sessionStorage for form_data');

console.log('\n✅ Next Steps:');
console.log('   1. Check browser console logs for errors during form submission');
console.log('   2. Verify Chatwoot webhook is configured in Railway dashboard');
console.log('   3. Test the flow in production: https://nextnest.sg/apply');
console.log('   4. Check Railway logs: `railway logs --follow`');

console.log('\n');
