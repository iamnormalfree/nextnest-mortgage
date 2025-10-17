#!/usr/bin/env node

/**
 * Production API Smoke Tests
 * Run these tests after deployment to verify critical endpoints are working
 *
 * Usage: node scripts/smoke-tests.js [base-url]
 * Example: node scripts/smoke-tests.js https://nextnest.sg
 */

const baseUrl = process.argv[2] || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005';

console.log('🚀 Running API Smoke Tests');
console.log(`📍 Base URL: ${baseUrl}`);
console.log('----------------------------\n');

let passCount = 0;
let failCount = 0;

async function testEndpoint(name, method, path, body = null) {
  const url = `${baseUrl}${path}`;
  console.log(`Testing ${name}...`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const startTime = Date.now();
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    // Check response status
    if (response.ok || response.status === 400) { // 400 is ok for validation errors
      console.log(`✅ ${name}: ${response.status} (${responseTime}ms)`);

      // Try to parse JSON response
      try {
        const data = await response.json();
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (e) {
        console.log(`   Response: (non-JSON)`);
      }

      passCount++;
    } else {
      console.log(`❌ ${name}: ${response.status} ${response.statusText} (${responseTime}ms)`);
      failCount++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failCount++;
  }

  console.log('');
}

async function runTests() {
  console.log('🔍 Testing Health Endpoints\n');

  // Health check endpoint
  await testEndpoint(
    'Health Check - Chat Integration',
    'GET',
    '/api/health/chat-integration'
  );

  console.log('🔍 Testing Core Endpoints\n');

  // Contact form endpoint (with minimal payload)
  await testEndpoint(
    'Contact Form Submission',
    'POST',
    '/api/contact',
    {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+6591234567',
      message: 'Smoke test message'
    }
  );

  // Forms analyze endpoint (AI analysis)
  await testEndpoint(
    'Form Analysis',
    'POST',
    '/api/forms/analyze',
    {
      fieldName: 'loanAmount',
      fieldValue: 500000,
      formData: {
        loanType: 'new_purchase',
        propertyType: 'HDB'
      }
    }
  );

  // Chatwoot conversation creation
  await testEndpoint(
    'Chatwoot Conversation Creation',
    'POST',
    '/api/chatwoot-conversation',
    {
      leadData: {
        name: 'Smoke Test',
        email: 'smoke@test.com',
        loanType: 'new_purchase'
      }
    }
  );

  // Analytics endpoint
  await testEndpoint(
    'Analytics Events',
    'POST',
    '/api/analytics/events',
    {
      event: 'smoke_test',
      properties: {
        timestamp: Date.now()
      }
    }
  );

  // Conversion dashboard
  await testEndpoint(
    'Conversion Dashboard',
    'GET',
    '/api/analytics/conversion-dashboard?timeRange=1h'
  );

  // Compliance report
  await testEndpoint(
    'Compliance Report',
    'GET',
    '/api/compliance/report'
  );

  console.log('🔍 Testing Page Routes\n');

  // Test main pages
  const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Calculator', path: '/calculator' },
    { name: 'Chat', path: '/chat' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Compliance', path: '/compliance' },
    { name: 'PDPA', path: '/pdpa' },
    { name: 'System Status', path: '/system-status' }
  ];

  for (const page of pages) {
    await testEndpoint(page.name, 'GET', page.path);
  }

  console.log('----------------------------');
  console.log('📊 Test Results Summary\n');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);

  if (failCount > 0) {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All smoke tests passed!');
    process.exit(0);
  }
}

// Run the tests
console.log('Starting smoke tests...\n');
runTests().catch(error => {
  console.error('Fatal error running smoke tests:', error);
  process.exit(1);
});