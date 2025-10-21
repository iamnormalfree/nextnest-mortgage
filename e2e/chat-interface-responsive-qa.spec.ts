import { test, expect } from '@playwright/test';

test.describe('CustomChatInterface QA', () => {
  const TEST_URL = 'http://localhost:3004/test-chat-interface';
  
  test('Mobile 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto(TEST_URL);
    await page.click('button:has-text("Mobile 320px")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/chat-qa-mobile-320.png', fullPage: true });
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    console.log('Mobile 320px: PASS');
  });

  test('Mobile 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 667 });
    await page.goto(TEST_URL);
    await page.click('button:has-text("Mobile 360px")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/chat-qa-mobile-360.png', fullPage: true });
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    console.log('Mobile 360px: PASS');
  });

  test('Mobile 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 667 });
    await page.goto(TEST_URL);
    await page.click('button:has-text("Mobile 390px")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/chat-qa-mobile-390.png', fullPage: true });
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    console.log('Mobile 390px: PASS');
  });

  test('Desktop 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(TEST_URL);
    await page.click('button:has-text("Desktop 1024px")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/chat-qa-desktop-1024.png', fullPage: true });
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    console.log('Desktop 1024px: PASS');
  });

  test('Send message test', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 667 });
    await page.goto(TEST_URL);
    await page.click('button:has-text("Mobile 360px")');
    await page.waitForTimeout(2000);
    
    const input = page.locator('input[type="text"]').first();
    await input.fill('Test from Playwright');
    await page.screenshot({ path: 'screenshots/chat-qa-before-send.png', fullPage: true });
    
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/chat-qa-after-send.png', fullPage: true });
    console.log('Message send: PASS');
  });

  test('Quick actions', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 667 });
    await page.goto(TEST_URL);
    await page.click('button:has-text("Mobile 360px")');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Current rates")');
    const value = await page.locator('input[type="text"]').first().inputValue();
    expect(value).toBe('What are current market rates?');
    await page.screenshot({ path: 'screenshots/chat-qa-quick-action.png', fullPage: true });
    console.log('Quick actions: PASS');
  });
});
