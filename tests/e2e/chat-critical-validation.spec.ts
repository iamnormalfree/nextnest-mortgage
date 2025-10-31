// ABOUTME: Critical path validation for CustomChatInterface QA
// Streamlined tests for Task 2.2 mobile/desktop validation

import { test, expect, Page } from '@playwright/test';

// Critical viewports only
const VIEWPORTS = [
  { name: 'Mobile-320', width: 320, height: 568 },
  { name: 'Mobile-390', width: 390, height: 844 },
  { name: 'Desktop-1024', width: 1024, height: 768 }
];

test.describe('Chat UI - Critical Validation (Task 2.2)', () => {

  // TC1+TC2: Input and send button visible and accessible
  VIEWPORTS.forEach(viewport => {
    test(`Input/Send accessible on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000/chat-playwright-test');

      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check data-testid elements exist
      const input = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      const messagesContainer = page.locator('[data-testid="messages-container"]');

      await expect(input).toBeVisible({ timeout: 10000 });
      await expect(sendButton).toBeVisible({ timeout: 10000 });
      await expect(messagesContainer).toBeVisible({ timeout: 10000 });

      // Verify input is usable
      await input.click();
      await input.fill('Test message');
      await expect(sendButton).toBeEnabled();
    });
  });

  // TC4: No horizontal overflow on mobile
  test('No horizontal overflow on mobile 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('http://localhost:3000/test-chat-interface');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Send a long message
    const input = page.locator('[data-testid="message-input"]');
    await input.fill('This is a very long message that tests horizontal overflow handling in narrow mobile viewports');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="send-button"]').click({ force: true });

    await page.waitForTimeout(1000);

    // Check no horizontal scroll on chat container
    const chatContainer = page.locator('[data-testid="messages-container"]');
    const scrollWidth = await chatContainer.evaluate(el => el.scrollWidth);
    const clientWidth = await chatContainer.evaluate(el => el.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // 10px tolerance
  });

  // TC9: Optimistic UI
  test('Optimistic UI shows message immediately', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/chat-playwright-test');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const testMessage = `Test-${Date.now()}`;
    const input = page.locator('[data-testid="message-input"]');

    await input.fill(testMessage);
    await page.waitForTimeout(500);
    await page.locator('[data-testid="send-button"]').click({ force: true });

    // Message should appear quickly (optimistic)
    // Check that message was added (optimistic UI)
    await expect(page.locator('[data-testid="message-item"]').last()).toBeVisible({ timeout: 5000 });
  });

  // TC3: Quick actions scrollable
  test('Quick actions render and scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('http://localhost:3000/test-chat-interface');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const quickActions = page.locator('[data-testid="quick-actions"]');
    await expect(quickActions).toBeVisible({ timeout: 10000 });

    // Check overflow-x-auto
    const overflow = await quickActions.evaluate(el => window.getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
  });

  // Console error check
  test('No critical console errors on mobile', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        criticalErrors.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/test-chat-interface');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter known acceptable errors
    const actualErrors = criticalErrors.filter(err =>
      !err.includes('sourcemap') &&
      !err.includes('favicon') &&
      !err.includes('404')
    );

    expect(actualErrors.length).toBe(0);
  });
});
