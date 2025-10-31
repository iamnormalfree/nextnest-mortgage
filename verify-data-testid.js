const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://nextnest.sg/apply?loanType=new_purchase');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Gate 1
  await page.getByPlaceholder(/name/i).first().fill('Test');
  await page.getByPlaceholder(/email/i).fill(`test${Date.now()}@test.com`);
  await page.getByPlaceholder(/phone/i).fill('91234567');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(2000);

  // Gate 2
  await page.locator('[id="property-category"]').first().click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: /resale/i }).click();
  await page.waitForTimeout(1000);

  await page.locator('[id="property-type"]').first().click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: /HDB/i }).click();
  await page.waitForTimeout(1000);

  await page.locator('[id="property-price"]').fill('500000');
  await page.locator('[id="combined-age"]').fill('35');
  await page.getByRole('button', { name: /continue|get instant/i }).click();
  await page.waitForTimeout(3000);

  console.log('\n=== VERIFYING DATA-TESTID DEPLOYMENT ===\n');

  // Open employment dropdown
  const empSelect = page.locator('[id="employment-type-select-0"]');
  await empSelect.click();
  await page.waitForTimeout(1000);

  // Check if data-testid exists
  const testIdOption = page.locator('[data-testid="employment-option-employed"]');
  const testIdExists = await testIdOption.count();

  console.log(`data-testid selector found: ${testIdExists > 0 ? 'YES' : 'NO'}`);
  console.log(`Count: ${testIdExists}`);

  if (testIdExists > 0) {
    const isVisible = await testIdOption.isVisible();
    console.log(`Is visible: ${isVisible}`);

    if (isVisible) {
      const text = await testIdOption.textContent();
      console.log(`Text content: "${text}"`);
    }
  } else {
    console.log('\n❌ data-testid NOT FOUND - deployment may not have completed');
    console.log('   Checking all options:');

    const allOptions = page.getByRole('option');
    const count = await allOptions.count();
    for (let i = 0; i < count; i++) {
      const html = await allOptions.nth(i).evaluate(el => el.outerHTML);
      console.log(`   Option ${i}: ${html.substring(0, 200)}`);
    }
  }

  console.log('\nBrowser staying open for inspection...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
