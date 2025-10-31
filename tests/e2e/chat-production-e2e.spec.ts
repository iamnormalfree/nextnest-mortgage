// ABOUTME: End-to-end production test - complete form submission flow to chat
// ABOUTME: Tests the full user journey on nextnest.sg from homepage → form → chat

import { test, expect, Page } from '@playwright/test';

// Helper: Complete the loan application form
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

  // =========================================================================
  // GATE 1: Who You Are (name, email, phone)
  // =========================================================================
  
  // Name
  const nameInput = page.getByPlaceholder(/name|full name/i).or(
    page.locator('input[type="text"]').first()
  );
  await nameInput.waitFor({ timeout: 5000 });
  await nameInput.click();
  await nameInput.fill('Playwright Test User');
  await nameInput.blur();
  await page.waitForTimeout(500);

  // Email
  const emailInput = page.getByPlaceholder(/email/i).or(
    page.locator('input[type="email"]')
  );
  await emailInput.click();
  await emailInput.fill(`test${Date.now()}@playwright.test`);
  await emailInput.blur();
  await page.waitForTimeout(500);

  // Phone
  const phoneInput = page.getByPlaceholder(/phone|mobile|contact/i).or(
    page.locator('input[type="tel"]')
  );
  await phoneInput.click();
  await phoneInput.fill('91234567');
  await phoneInput.blur();
  await page.waitForTimeout(500);

  // Continue to Gate 2
  let continueBtn = page.getByRole('button', { name: /continue/i });
  await continueBtn.waitFor({ timeout: 5000 });
  await continueBtn.click();
  await page.waitForTimeout(1500);

  // =========================================================================
  // GATE 2: What You Need (propertyCategory, propertyType, priceRange, combinedAge)
  // =========================================================================
  
  // Wait for property category dropdown
  await page.waitForTimeout(1000);
  
  // Property Category - need to find and click the select dropdown
  const categorySelect = page.locator('[id="property-category"]').or(
    page.getByRole('combobox').first()
  );
  
  if (await categorySelect.isVisible({ timeout: 5000 })) {
    await categorySelect.click();
    await page.waitForTimeout(500);
    
    // Select "Resale" option from dropdown
    const resaleOption = page.getByRole('option', { name: /resale/i });
    await resaleOption.click();
    await page.waitForTimeout(800);
  }

  // Property Type - appears after category is selected
  await page.waitForTimeout(500);
  
  const typeSelect = page.locator('[id="property-type"]').or(
    page.getByRole('combobox').nth(1)
  );
  
  if (await typeSelect.isVisible({ timeout: 5000 })) {
    await typeSelect.click();
    await page.waitForTimeout(500);
    
    // Select "HDB" option
    const hdbOption = page.getByRole('option', { name: /HDB/i });
    await hdbOption.click();
    await page.waitForTimeout(800);
  }

  // Property Price
  const priceInput = page.locator('[id="property-price"]').or(
    page.getByPlaceholder(/price|amount/i)
  );
  await priceInput.waitFor({ timeout: 5000 });
  await priceInput.click();
  await priceInput.fill('500000');
  await priceInput.blur();
  await page.waitForTimeout(500);

  // Combined Age - CRITICAL: Required by Gate 2 schema
  const ageInput = page.locator('[id="combined-age"]').or(
    page.getByPlaceholder(/age/i)
  );
  await ageInput.waitFor({ timeout: 5000 });
  await ageInput.click();
  await ageInput.fill('35');
  await ageInput.blur();
  await page.waitForTimeout(500);

  // Continue to Gate 3
  continueBtn = page.getByRole('button', { name: /continue|get instant/i });
  await continueBtn.waitFor({ timeout: 5000 });
  await continueBtn.click();
  await page.waitForTimeout(2000);

  // =========================================================================
  // GATE 3: Financial Details (actualIncomes.0, age, employmentType, commitments)
  // =========================================================================

  // Income (actualIncomes.0)
  // Updated selector: use label instead of placeholder (placeholder is now numeric "8,000")
  const incomeInput = page.getByLabel(/monthly income/i).first();

  await incomeInput.waitFor({ timeout: 5000 });
  await incomeInput.click();
  await incomeInput.fill('8000');
  await incomeInput.blur();
  await page.waitForTimeout(500);

  // Age - CRITICAL: Separate from combined age in Gate 2
  // Use spinbutton role to target the age field specifically
  const ageFieldStep4 = page.getByRole('spinbutton', { name: /age/i }).or(
    page.locator('input[type="number"]').nth(1)
  );

  if (await ageFieldStep4.isVisible({ timeout: 5000 })) {
    await ageFieldStep4.click();
    await ageFieldStep4.clear();
    await ageFieldStep4.fill('35');
    await ageFieldStep4.blur();
    await page.waitForTimeout(500);
  }

  // Employment Type - Use deterministic data-testid selector
  // Bypasses Radix UI portal issues with display text matching
  const employmentSelect = page.locator('[id="employment-type-select-0"]').or(
    page.getByRole('combobox', { name: /employment/i }).first()
  );

  if (await employmentSelect.isVisible({ timeout: 5000 })) {
    await employmentSelect.click();
    await page.waitForTimeout(500);

    // Target by data-testid - deterministic and avoids portal/text matching issues
    const employedOption = page.locator('[data-testid="employment-option-employed"]');
    await employedOption.click();
    await page.waitForTimeout(800);
  }

  // Financial Commitments - CRITICAL: Required question
  // Look for the Yes/No buttons for "Do you have any existing loans or commitments?"
  const noCommitmentsButton = page.getByRole('button', { name: /^no$/i });

  if (await noCommitmentsButton.isVisible({ timeout: 5000 })) {
    await noCommitmentsButton.click();
    await page.waitForTimeout(500);
  }

  // Wait for validation to enable submit button
  await page.waitForTimeout(1000);

  // Submit form - triggers chat creation and redirect
  const submitButton = page.getByRole('button', { name: /submit|chat|speak to broker|get started|connect|continue/i }).last();
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
  await input.blur();
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
    await input.blur();

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
