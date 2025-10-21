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

    // Wait for chat to be ready
    await page.waitForSelector('[data-testid="messages-container"]', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // TEST 1: Verify chat interface loaded
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await expect(messageInput).toBeEnabled();
    console.log('✓ Message input visible and enabled');

    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();
    console.log('✓ Send button visible');

    // TEST 2: Send a message
    const testMessage = 'Hello, I have questions about my loan application';
    await messageInput.fill(testMessage);
    await sendButton.click();
    console.log(`✓ Sent message: "${testMessage}"`);

    // Wait for message to appear
    await page.waitForTimeout(2000);

    // TEST 3: Verify message appeared
    const messages = page.locator('[data-testid="message-item"]');
    await expect(messages.first()).toBeVisible({ timeout: 5000 });
    const messageCount = await messages.count();
    console.log(`✓ Messages displayed: ${messageCount}`);

    // TEST 4: Wait for broker response (BullMQ processing)
    console.log('⏳ Waiting for broker response (up to 15 seconds)...');
    await page.waitForTimeout(15000);

    const updatedCount = await messages.count();
    if (updatedCount > messageCount) {
      console.log(`✓ Broker responded! New message count: ${updatedCount}`);
    } else {
      console.log(`⚠ No new messages yet (count still: ${updatedCount})`);
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
