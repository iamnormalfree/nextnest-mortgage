import { test } from '@playwright/test';

test('Simple page load test', async ({ page }) => {
  console.log('Navigating to http://localhost:3002/apply');
  await page.goto('http://localhost:3002/apply', { waitUntil: 'networkidle' });
  
  console.log('Page loaded');
  
  // Wait for page to be interactive
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/page-load.png', fullPage: true });
  console.log('Screenshot saved: test-results/page-load.png');
  
  // Get page title
  const title = await page.title();
  console.log('Page title: ' + title);
  
  // Check if full-name input exists
  const fullNameExists = await page.locator('#full-name').count();
  console.log('full-name input exists: ' + (fullNameExists > 0 ? 'YES' : 'NO'));
  
  // Get all input IDs
  const inputs = await page.locator('input').all();
  console.log('Found ' + inputs.length + ' inputs');
  
  for (let i = 0; i < Math.min(inputs.length, 10); i++) {
    const input = inputs[i];
    const id = await input.getAttribute('id');
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    console.log('  Input ' + (i+1) + ': id=' + id + ', type=' + type + ', placeholder=' + placeholder);
  }
});
