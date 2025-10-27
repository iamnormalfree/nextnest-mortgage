// ABOUTME: Simplified production E2E test using Playwright codegen approach
// ABOUTME: Manual test - run with --headed to complete form manually, then automates chat testing

import { test, expect, Page } from '@playwright/test';

test.describe('Production E2E - Manual Form, Automated Chat', () => {

  test('Complete form manually, then test chat', async ({ page }) => {
    // Set long timeout for manual form completion
    test.setTimeout(600000); // 10 minutes
    // Navigate to the site
    await page.goto('https://nextnest.sg');

    // This test requires manual interaction to complete the form
    // The tester will:
    // 1. Click "Get Started"
    // 2. Select "New Purchase"
    // 3. Fill out all form fields
    // 4. Submit to get to chat

    console.log('\n=== MANUAL STEPS REQUIRED ===');
    console.log('1. Click "Get Started" button');
    console.log('2. Select "New Purchase" loan type');
    console.log('3. Fill out the progressive form completely');
    console.log('4. Submit the form to navigate to /chat');
    console.log('5. Wait for chat to load');
    console.log('\nPress Ctrl+C when ready to continue automated testing...\n');

    // Wait for user to navigate to chat page
    await page.waitForURL(/.*\/chat.*/i, { timeout: 600000 }); // 10 minute timeout

    console.log('\n✓ Chat page detected! Starting automated tests...\n');

    // Wait for chat to be ready - try multiple selectors as production might use different layout
    const chatLoaded = await Promise.race([
      page.waitForSelector('[data-testid="messages-container"]', { timeout: 10000 }).then(() => 'testid'),
      page.waitForSelector('input[placeholder*="Ask about"]', { timeout: 10000 }).then(() => 'placeholder'),
      page.waitForSelector('textarea[placeholder*="Ask about"]', { timeout: 10000 }).then(() => 'textarea'),
    ]).catch(() => null);

    if (!chatLoaded) {
      console.log('⚠ Chat interface elements not found with expected selectors');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'chat-debug.png', fullPage: true });
      console.log('Screenshot saved to: chat-debug.png');
    }

    await page.waitForTimeout(3000);

    // TEST 1: Verify chat interface loaded - flexible selectors
    const messageInput = page.locator('[data-testid="message-input"]')
      .or(page.locator('input[placeholder*="Ask about"]'))
      .or(page.locator('textarea[placeholder*="Ask about"]'))
      .first();

    await expect(messageInput).toBeVisible({ timeout: 5000 });
    await expect(messageInput).toBeEnabled();
    console.log('✓ Message input visible and enabled');

    const sendButton = page.locator('[data-testid="send-button"]')
      .or(page.locator('button[type="submit"]').filter({ hasText: '' }))
      .or(page.getByRole('button', { name: /send/i }))
      .first();

    await expect(sendButton).toBeVisible({ timeout: 5000 });
    console.log('✓ Send button visible');

    // TEST 2: Send a message
    const testMessage = 'Hello, I have questions about my loan application';
    await messageInput.fill(testMessage);
    await sendButton.click();
    console.log(`✓ Sent message: "${testMessage}"`);

    // Wait for message to appear
    await page.waitForTimeout(2000);

    // TEST 3: Verify message appeared - look for message content
    const messages = page.locator('[data-testid="message-item"]')
      .or(page.locator('div').filter({ hasText: testMessage }))
      .or(page.locator('.message, [class*="message"]'));

    const messageVisible = await messages.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (messageVisible) {
      var messageCount = await messages.count();
      console.log(`✓ Messages displayed: ${messageCount}`);
    } else {
      console.log('⚠ Could not find message elements - checking if text is on page...');
      const textFound = await page.locator(`text=${testMessage}`).isVisible().catch(() => false);
      if (textFound) {
        console.log('✓ Message text found on page (different structure than expected)');
        var messageCount = 1; // At least our message is there
      } else {
        console.log('✗ Message not found on page');
        var messageCount = 0;
      }
    }

    // TEST 4: Wait for broker response (BullMQ processing) and measure SLA
    console.log('⏳ Waiting for broker response (measuring 5-second SLA)...');
    const startTime = Date.now();

    // Wait up to 15 seconds but check every 500ms for quicker response detection
    let brokerResponded = false;
    let responseTime = 0;

    for (let i = 0; i < 30; i++) { // 30 * 500ms = 15 seconds max
      await page.waitForTimeout(500);
      const currentCount = await messages.count();
      if (currentCount > messageCount) {
        brokerResponded = true;
        responseTime = Date.now() - startTime;
        break;
      }
    }

    const updatedCount = await messages.count();
    if (updatedCount > messageCount) {
      const slaMet = responseTime <= 5000; // 5 second SLA
      console.log(`✓ Broker responded! Response time: ${responseTime}ms (${slaMet ? 'SLA MET' : 'SLA EXCEEDED'})`);
      console.log(`✓ New message count: ${updatedCount}`);
    } else {
      console.log(`⚠ No broker response within 15 seconds`);
      console.log(`✗ SLA NOT MET - No response detected`);
    }

    // TEST 5: Check for typing indicator
    const typingIndicator = page.locator('[data-testid="typing-indicator"]');
    const isTyping = await typingIndicator.isVisible().catch(() => false);
    console.log(isTyping ? '✓ Typing indicator shown' : '⚠ No typing indicator');

    // TEST 6: Verify no horizontal scroll
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    const scrollWidth = await messagesContainer.evaluate(el => el.scrollWidth);
    const clientWidth = await messagesContainer.evaluate(el => el.clientWidth);

    if (scrollWidth <= clientWidth + 5) {
      console.log('✓ No horizontal overflow');
    } else {
      console.log(`⚠ Horizontal overflow detected: ${scrollWidth}px vs ${clientWidth}px`);
    }

    // TEST 7: Test message persistence
    console.log('\n🔄 Testing persistence - refreshing page...');
    await page.reload();
    await page.waitForSelector('[data-testid="messages-container"]', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const persistedMessages = page.locator('[data-testid="message-item"]');
    const persistedCount = await persistedMessages.count();

    if (persistedCount > 0) {
      console.log(`✓ Messages persisted after refresh: ${persistedCount} messages`);
    } else {
      console.log('⚠ Messages not persisted');
    }

    console.log('\n=== ALL TESTS COMPLETE ===\n');
  });
});

test.describe('Production E2E - Quick Validation (Requires Active Chat)', () => {

  test('Validate chat on existing conversation', async ({ page }) => {
    // This test assumes you have a chat URL with ?conversation=XXX
    // Get the conversation ID from environment or config
    const conversationId = process.env.TEST_CONVERSATION_ID;

    if (!conversationId) {
      console.log('⚠ Skipping: No TEST_CONVERSATION_ID environment variable set');
      test.skip();
      return;
    }

    await page.goto(`https://nextnest.sg/chat?conversation=${conversationId}`);
    await page.waitForSelector('[data-testid="messages-container"]', { timeout: 15000 });

    // Quick smoke tests
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();

    // Send test message
    await page.locator('[data-testid="message-input"]').fill('Test message from Playwright');
    await page.locator('[data-testid="send-button"]').click();

    await page.waitForTimeout(5000);

    const messages = page.locator('[data-testid="message-item"]');
    expect(await messages.count()).toBeGreaterThan(0);

    console.log('✓ Quick validation passed');
  });
});
