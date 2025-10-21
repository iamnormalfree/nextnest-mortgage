import { test } from '@playwright/test';

test('debug page state', async ({ page }) => {
  await page.goto('http://localhost:3002/apply?loanType=new_purchase');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-initial-page.png', fullPage: true });
  
  // Get all button texts
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    console.log(`Button ${i}: "${text}"`);
  }
  
  // Get page HTML
  const html = await page.content();
  console.log('Page HTML length:', html.length);
});
