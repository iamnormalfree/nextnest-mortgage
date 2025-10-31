const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
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

  console.log('\n=== EMPLOYMENT SELECT TEST ===\n');

  // Test: Find employment select
  const empSelect = page.locator('[id="employment-type-select-0"]');
  const isVisible = await empSelect.isVisible().catch(() => false);
  console.log(`1. Employment select visible: ${isVisible}`);

  if (!isVisible) {
    // Try alternate selector
    const empSelectAlt = page.getByRole('combobox', { name: /employment/i }).first();
    const isVisibleAlt = await empSelectAlt.isVisible().catch(() => false);
    console.log(`   Alternate selector visible: ${isVisibleAlt}`);
  }

  // Test: Click to open
  console.log(`2. Clicking employment select...`);
  await empSelect.click();
  await page.waitForTimeout(1000);

  // Test: Find options
  const options = page.getByRole('option');
  const count = await options.count();
  console.log(`3. Options count: ${count}`);

  if (count > 0) {
    console.log('   Options found:');
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      console.log(`     ${i}: "${text}"`);
    }

    // Test: Click first option
    console.log(`4. Clicking first option...`);
    await options.first().click();
    await page.waitForTimeout(1000);

    // Test: Check if value changed
    const selectText = await empSelect.textContent();
    console.log(`5. Select text after click: "${selectText}"`);

    // Test: Check if income field appeared
    const incomeField = page.getByLabel(/monthly income/i).first();
    const incomeVisible = await incomeField.isVisible().catch(() => false);
    console.log(`6. Income field visible: ${incomeVisible}`);

    if (!incomeVisible) {
      console.log('\n❌ INCOME FIELD DID NOT APPEAR');
      console.log('   This means the employment type was NOT set in the form state');
    } else {
      console.log('\n✅ SUCCESS - Income field appeared!');
    }
  }

  console.log('\n\nBrowser will stay open for 30 seconds...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
