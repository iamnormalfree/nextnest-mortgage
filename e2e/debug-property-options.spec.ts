import { test } from '@playwright/test';

test('Debug property type options', async ({ page }) => {
  await page.goto('http://localhost:3002/apply');
  await page.waitForTimeout(500);
  
  // Fill Step 1
  await page.locator('#full-name').fill('Test User');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#phone').fill('91234567');
  
  // Continue to Step 2
  const continueButton = page.locator('button').filter({ hasText: /continue|next/i });
  await continueButton.click();
  await page.waitForTimeout(1000);
  
  // Select Resale
  await page.locator('#property-category').click();
  await page.waitForTimeout(300);
  const resaleOption = page.locator('[role="option"]').filter({ hasText: 'Resale' });
  await resaleOption.click();
  await page.waitForTimeout(500);
  
  // Open Property Type dropdown
  console.log('Opening Property Type dropdown...');
  await page.locator('#property-type').click();
  await page.waitForTimeout(500);
  
  // List all options
  const options = page.locator('[role="option"]');
  const count = await options.count();
  console.log('Found ' + count + ' property type options:');
  
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    const text = await option.textContent();
    console.log('  ' + (i + 1) + '. "' + text + '"');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-property-options.png', fullPage: true });
  console.log('\nScreenshot saved: test-results/debug-property-options.png');
});
