#!/usr/bin/env node

/**
 * ABOUTME: Manual QA validation script for CustomChatInterface
 * ABOUTME: Tests API endpoints and generates validation report with evidence
 */

import fs from 'fs/promises';

const CONVERSATION_ID = 280; // Test conversation from previous validations
const BASE_URL = 'http://localhost:3001';

const report = {
  timestamp: new Date().toISOString(),
  testResults: [],
};

async function testEndpoint(name, url, expectedStatus, checks = []) {
  console.log(`\n📋 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url);
    const isSuccess = response.status === expectedStatus;

    const result = {
      name,
      url,
      expectedStatus,
      actualStatus: response.status,
      passed: isSuccess,
      timestamp: new Date().toISOString(),
    };

    if (response.headers.get('content-type')?.includes('json')) {
      const data = await response.json();
      result.responseData = data;

      // Run additional checks
      for (const check of checks) {
        const checkResult = check.test(data);
        result[check.name] = checkResult;
        result.passed = result.passed && checkResult;
      }
    }

    console.log(`   Status: ${response.status} ${isSuccess ? '✅' : '❌'}`);
    report.testResults.push(result);
    return result;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    report.testResults.push({
      name,
      url,
      error: error.message,
      passed: false,
    });
    return { passed: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 CustomChatInterface QA Validation');
  console.log('=====================================\n');

  // Test 1: Health endpoint
  await testEndpoint(
    'Health Check',
    `${BASE_URL}/api/health`,
    200,
    [
      {
        name: 'hasWorkerStatus',
        test: (data) => data.worker?.initialized === true,
      },
    ]
  );

  // Test 2: Fetch messages from conversation
  await testEndpoint(
    'Fetch Messages API',
    `${BASE_URL}/api/chatwoot/messages?conversationId=${CONVERSATION_ID}`,
    200,
    [
      {
        name: 'hasMessages',
        test: (data) => Array.isArray(data) && data.length > 0,
      },
      {
        name: 'messagesHaveContent',
        test: (data) => data.every(msg => msg.content && msg.message_type !== undefined),
      },
    ]
  );

  // Test 3: Conversation metadata
  await testEndpoint(
    'Conversation Metadata',
    `${BASE_URL}/api/chatwoot/conversations/${CONVERSATION_ID}`,
    200,
    [
      {
        name: 'hasConversationId',
        test: (data) => data.id === CONVERSATION_ID,
      },
      {
        name: 'hasContactInfo',
        test: (data) => data.meta?.sender?.name !== undefined,
      },
    ]
  );

  // Test 4: Queue metrics (observability)
  await testEndpoint(
    'Queue Metrics',
    `${BASE_URL}/api/admin/migration-status`,
    200,
    [
      {
        name: 'hasQueueMetrics',
        test: (data) => data.queue?.waiting !== undefined,
      },
      {
        name: 'workerRunning',
        test: (data) => data.worker?.running === true,
      },
    ]
  );

  // Generate report
  const passedTests = report.testResults.filter(r => r.passed).length;
  const totalTests = report.testResults.length;

  console.log('\n\n📊 Test Summary');
  console.log('================');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Write report
  const reportPath = 'docs/validation-reports/chat-qa-validation-2025-10-21.json';
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Create markdown summary
  const markdownReport = generateMarkdownReport(report, passedTests, totalTests);
  const mdPath = 'docs/validation-reports/chat-qa-validation-2025-10-21.md';
  await fs.writeFile(mdPath, markdownReport);
  console.log(`📄 Markdown report saved to: ${mdPath}`);

  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

function generateMarkdownReport(report, passedTests, totalTests) {
  const date = new Date(report.timestamp).toLocaleDateString();

  let md = `# Chat QA Validation Report\n\n`;
  md += `**Date:** ${date}\n`;
  md += `**Status:** ${passedTests === totalTests ? '✅ PASSED' : '❌ FAILED'}\n`;
  md += `**Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;
  md += `---\n\n`;
  md += `## Test Results Summary\n\n`;
  md += `| Test | Status | Details |\n`;
  md += `|------|--------|----------|\n`;

  for (const result of report.testResults) {
    const status = result.passed ? '✅' : '❌';
    const details = result.error || `HTTP ${result.actualStatus}`;
    md += `| ${result.name} | ${status} | ${details} |\n`;
  }

  md += `\n---\n\n## Component Validation\n\n`;
  md += `### API Endpoints\n\n`;

  for (const result of report.testResults) {
    md += `#### ${result.name}\n\n`;
    md += `- **URL:** \`${result.url}\`\n`;
    md += `- **Expected Status:** ${result.expectedStatus}\n`;
    md += `- **Actual Status:** ${result.actualStatus}\n`;
    md += `- **Result:** ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;

    if (result.responseData) {
      md += `\n**Response Sample:**\n\`\`\`json\n`;
      md += JSON.stringify(result.responseData, null, 2).substring(0, 500);
      md += `\n\`\`\`\n`;
    }

    md += `\n`;
  }

  md += `---\n\n## Mobile/Desktop Compatibility\n\n`;
  md += `### Manual Testing Checklist\n\n`;
  md += `- [ ] Test on mobile 320px viewport\n`;
  md += `- [ ] Test on mobile 360px viewport\n`;
  md += `- [ ] Test on mobile 390px viewport\n`;
  md += `- [ ] Test on tablet 768px viewport\n`;
  md += `- [ ] Test on desktop 1024px viewport\n`;
  md += `- [ ] Verify message input accessible on all viewports\n`;
  md += `- [ ] Verify send button works on mobile\n`;
  md += `- [ ] Verify quick action buttons render correctly\n`;
  md += `- [ ] Verify typing indicator appears\n`;
  md += `- [ ] Verify message polling works (3s interval)\n\n`;

  md += `### API Integration Verified\n\n`;
  md += `- ${report.testResults.find(r => r.name === 'Fetch Messages API')?.passed ? '✅' : '❌'} Messages API working\n`;
  md += `- ${report.testResults.find(r => r.name === 'Conversation Metadata')?.passed ? '✅' : '❌'} Conversation metadata accessible\n`;
  md += `- ${report.testResults.find(r => r.name === 'Queue Metrics')?.passed ? '✅' : '❌'} Queue system operational\n`;
  md += `- ${report.testResults.find(r => r.name === 'Health Check')?.passed ? '✅' : '❌'} Worker auto-start verified\n\n`;

  md += `---\n\n## Conclusion\n\n`;
  if (passedTests === totalTests) {
    md += `✅ **All API endpoints passing.** Chat interface has working backend integration.\n\n`;
    md += `**Production Readiness:** READY for Phase 3 rollout\n`;
  } else {
    md += `⚠️ **Some tests failing.** Review failed endpoints before production deployment.\n`;
  }

  return md;
}

main().catch(console.error);
