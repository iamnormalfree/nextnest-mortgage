// ABOUTME: End-to-end production test - complete form submission flow to chat
// ABOUTME: Tests the full user journey on nextnest.sg from homepage → form → chat

import { test, expect, Page } from '@playwright/test';

// Helper: Complete the loan application form
async function completeLoanApplicationForm(page: Page) {
  // Step 1: Visit homepage and navigate to apply page with loan type
  await page.goto('https://nextnest.sg');
  await page.waitForLoadState('networkidle');

  // Click the "Get Started" button on homepage to reveal loan type selection
  const getStartedButton = page.getByRole('button', { name: /get started|start/i }).first();
  if (await getStartedButton.isVisible({ timeout: 5000 })) {
    await getStartedButton.click();
    await page.waitForTimeout(1000);
  }

  // Click "New Purchase" option
  const newPurchaseButton = page.getByRole('button', { name: /new purchase/i }).or(
    page.getByText('New Purchase', { exact: false })
  ).first();
  await newPurchaseButton.waitFor({ timeout: 10000 });
  await newPurchaseButton.click();

  // Wait for navigation to /apply page
  await page.waitForURL(/.*\/apply.*/i, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Step 2: Fill out the progressive form
  // The form uses a step-by-step flow, so we need to fill and continue through each step

  // Step 2a: Property details
  // Property type - click HDB option
  const hdbButton = page.getByRole('button', { name: /HDB|4-room|5-room/i }).first();
  if (await hdbButton.isVisible({ timeout: 5000 })) {
    await hdbButton.click();
    await page.waitForTimeout(800);
  }

  // Property price
  const priceInput = page.getByPlaceholder(/price|amount/i).or(
    page.locator('input[type="number"]').first()
  );
  if (await priceInput.isVisible({ timeout: 5000 })) {
    await priceInput.click();
    await priceInput.fill('500000');
    await page.waitForTimeout(800);
  }

  // Continue to next step
  let continueBtn = page.getByRole('button', { name: /continue|next/i });
  if (await continueBtn.isVisible({ timeout: 3000 })) {
    await continueBtn.click();
    await page.waitForTimeout(1500);
  }

  // Step 2b: Personal information
  // Age
  const ageInput = page.getByPlaceholder(/age/i).or(
    page.locator('input[type="number"]').filter({ hasText: '' }).first()
  );
  if (await ageInput.isVisible({ timeout: 5000 })) {
    await ageInput.click();
    await ageInput.fill('35');
    await page.waitForTimeout(800);
  }

  // Income
  const incomeInput = page.getByPlaceholder(/income|salary/i).or(
    page.locator('input[type="number"]').filter({ hasText: '' }).nth(1)
  );
  if (await incomeInput.isVisible({ timeout: 5000 })) {
    await incomeInput.click();
    await incomeInput.fill('8000');
    await page.waitForTimeout(800);
  }

  // Continue
  continueBtn = page.getByRole('button', { name: /continue|next/i });
  if (await continueBtn.isVisible({ timeout: 3000 })) {
    await continueBtn.click();
    await page.waitForTimeout(1500);
  }

  // Step 2c: Contact information (final step before chat)
  // Name
  const nameInput = page.getByPlaceholder(/name|full name/i).or(
    page.locator('input[type="text"]').first()
  );
  if (await nameInput.isVisible({ timeout: 5000 })) {
    await nameInput.click();
    await nameInput.fill('Playwright Test User');
    await page.waitForTimeout(800);
  }

  // Email
  const emailInput = page.getByPlaceholder(/email/i).or(
    page.locator('input[type="email"]')
  );
  if (await emailInput.isVisible({ timeout: 5000 })) {
    await emailInput.click();
    await emailInput.fill(`test${Date.now()}@playwright.test`);
    await page.waitForTimeout(800);
  }

  // Phone
  const phoneInput = page.getByPlaceholder(/phone|mobile|contact/i).or(
    page.locator('input[type="tel"]')
  );
  if (await phoneInput.isVisible({ timeout: 5000 })) {
    await phoneInput.click();
    await phoneInput.fill('91234567');
    await page.waitForTimeout(800);
  }

  // Submit form - triggers chat creation and redirect
  const submitButton = page.getByRole('button', { name: /submit|chat|speak to broker|get started/i }).last();
  await submitButton.waitFor({ timeout: 10000 });
  await submitButton.click();

  // Wait for navigation to chat page
  await page.waitForURL(/.*\/chat.*/i, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Allow chat to fully initialize
}

// Helper: Wait for chat interface to be ready
async function waitForChatReady(page: Page) {
  await page.waitForSelector('[data-testid="messages-container"]', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

// Helper: Send a message in chat
async function sendMessage(page: Page, message: string) {
  const input = page.locator('[data-testid="message-input"]');
  await input.fill(message);
  await page.locator('[data-testid="send-button"]').click();
}

test.describe('Production E2E: Complete User Journey', () => {

  test('Full flow: Homepage → Form → Chat interaction', async ({ page }) => {
    // STEP 1: Complete loan application form
    await completeLoanApplicationForm(page);

    // STEP 2: Verify chat interface loaded
    await waitForChatReady(page);

    // Verify message input is visible and enabled
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await expect(messageInput).toBeEnabled();

    // Verify send button exists
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();

    // STEP 3: Send a test message
    await sendMessage(page, 'Hello, I have questions about my loan options');

    // Wait for message to appear
    await page.waitForTimeout(1000);

    // Verify message was sent (should appear in messages)
    const messages = page.locator('[data-testid="message-item"]');
    await expect(messages.first()).toBeVisible({ timeout: 5000 });

    // STEP 4: Wait for broker typing indicator or response
    const typingIndicator = page.locator('[data-testid="typing-indicator"]');

    // Check if typing indicator appears (may be brief)
    try {
      await expect(typingIndicator).toBeVisible({ timeout: 5000 });
      console.log('✓ Typing indicator appeared');
    } catch {
      console.log('⚠ Typing indicator too fast or not shown');
    }

    // Wait for AI response (polling interval is 3s, so wait up to 10s)
    await page.waitForTimeout(10000);

    // Verify we have at least 2 messages (user + AI response)
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);

    console.log(`✓ Chat working! Message count: ${messageCount}`);
  });

  test('Mobile viewport: Form → Chat on iPhone', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13

    // Complete form flow
    await completeLoanApplicationForm(page);

    // Verify chat loads on mobile
    await waitForChatReady(page);

    // Check mobile-specific elements
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await expect(messageInput).toBeInViewport();

    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeInViewport();

    // Check quick actions are scrollable
    const quickActions = page.locator('[data-testid="quick-actions"]');
    if (await quickActions.isVisible({ timeout: 3000 })) {
      const overflow = await quickActions.evaluate(el => window.getComputedStyle(el).overflowX);
      expect(overflow).toBe('auto');
    }

    // Send a message and verify it works on mobile
    await sendMessage(page, 'Mobile test message');
    await page.waitForTimeout(2000);

    const messages = page.locator('[data-testid="message-item"]');
    await expect(messages.first()).toBeVisible();

    console.log('✓ Mobile chat working!');
  });

  test('Chat persistence: Message survives page refresh', async ({ page }) => {
    // Complete form to get to chat
    await completeLoanApplicationForm(page);
    await waitForChatReady(page);

    // Send a unique message
    const testMessage = `Persistence test ${Date.now()}`;
    await sendMessage(page, testMessage);
    await page.waitForTimeout(3000); // Wait for message to be saved

    // Get current URL to reload same chat
    const chatUrl = page.url();

    // Refresh the page
    await page.reload();
    await waitForChatReady(page);

    // Verify our message is still there
    await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 5000 });

    console.log('✓ Chat persistence working!');
  });
});

test.describe('Production Smoke Tests (Post-Form)', () => {

  test.beforeEach(async ({ page }) => {
    // Complete form to get to chat before each test
    await completeLoanApplicationForm(page);
    await waitForChatReady(page);
  });

  test('Critical: Message input accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE

    const input = page.locator('[data-testid="message-input"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();

    // Verify input is clickable/tappable
    await input.click();
    await expect(input).toBeFocused();
  });

  test('Critical: Send button accessible after typing', async ({ page }) => {
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();

    // Fill input
    const input = page.locator('[data-testid="message-input"]');
    await input.fill('Test message');

    // Verify send button is in viewport
    await expect(sendButton).toBeInViewport();
  });

  test('Critical: No horizontal overflow on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    // Send a long message
    await sendMessage(page, 'This is a very long message that should not cause horizontal scrolling in the chat interface regardless of viewport width because it should wrap properly');

    await page.waitForTimeout(1000);

    // Check for horizontal scroll
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    const scrollWidth = await messagesContainer.evaluate(el => el.scrollWidth);
    const clientWidth = await messagesContainer.evaluate(el => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Critical: Auto-scroll to bottom on new messages', async ({ page }) => {
    // Send multiple messages
    for (let i = 1; i <= 3; i++) {
      await sendMessage(page, `Message ${i}`);
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(2000);

    // Last message should be in viewport
    const messages = page.locator('[data-testid="message-item"]');
    const lastMessage = messages.last();
    await expect(lastMessage).toBeInViewport();
  });
});
