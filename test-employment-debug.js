const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to production...');
  await page.goto('https://nextnest.sg');
  await page.waitForLoadState('networkidle');

  // Navigate through form to Gate 3
  const getStartedButton = page.getByRole('button', { name: /get started|start/i }).first();
  if (await getStartedButton.isVisible({ timeout: 5000 })) {
    await getStartedButton.click();
    await page.waitForTimeout(1000);
  }

  const newPurchaseButton = page.getByRole('button', { name: /new purchase/i }).first();
  await newPurchaseButton.click();
  await page.waitForURL(/.*\/apply.*/i, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Fill Gates 1 & 2 quickly
  const nameInput = page.getByPlaceholder(/name|full name/i).first();
  await nameInput.fill('Test User');

  const emailInput = page.getByPlaceholder(/email/i);
  await emailInput.fill('test@test.com');

  const phoneInput = page.getByPlaceholder(/phone|mobile|contact/i);
  await phoneInput.fill('91234567');

  let continueBtn = page.getByRole('button', { name: /continue/i });
  await continueBtn.click();
  await page.waitForTimeout(2000);

  // Gate 2
  const categorySelect = page.locator('[id="property-category"]').first();
  await categorySelect.click();
  await page.waitForTimeout(500);
  const resaleOption = page.getByRole('option', { name: /resale/i });
  await resaleOption.click();
  await page.waitForTimeout(1000);

  const typeSelect = page.locator('[id="property-type"]').first();
  await typeSelect.click();
  await page.waitForTimeout(500);
  const hdbOption = page.getByRole('option', { name: /HDB/i });
  await hdbOption.click();
  await page.waitForTimeout(1000);

  const priceInput = page.locator('[id="property-price"]');
  await priceInput.fill('500000');

  const ageInput = page.locator('[id="combined-age"]');
  await ageInput.fill('35');

  continueBtn = page.getByRole('button', { name: /continue|get instant/i });
  await continueBtn.click();
  await page.waitForTimeout(3000);

  // NOW AT GATE 3 - Check employment dropdown options
  console.log('\n=== CHECKING EMPLOYMENT TYPE OPTIONS ===');
  const employmentSelect = page.getByRole("combobox", { name: /employment/i }).first();

  if (await employmentSelect.isVisible({ timeout: 5000 })) {
    console.log('✓ Employment dropdown found');
    await employmentSelect.click();
    await page.waitForTimeout(1000);

    // Get all options
    const options = page.getByRole('option');
    const count = await options.count();
    console.log(`Found ${count} options:`);

    for (let i = 0; i < count; i++) {
      const optionText = await options.nth(i).textContent();
      console.log(`  ${i + 1}. "${optionText}"`);
    }
  } else {
    console.log('✗ Employment dropdown NOT found');
  }

  await page.waitForTimeout(5000);
  await browser.close();
})();
