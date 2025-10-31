const { chromium } = require('@playwright/test');

(async () => {
  console.log('🔍 Debugging employment select interaction...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Navigate to apply page...');
    await page.goto('https://nextnest.sg/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Step 2: Fill Gate 1...');
    await page.getByPlaceholder(/name/i).first().fill('Debug Test');
    await page.getByPlaceholder(/email/i).fill('debug@test.com');
    await page.getByPlaceholder(/phone/i).fill('91234567');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(2000);

    console.log('Step 3: Fill Gate 2...');
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

    console.log('\n====================================');
    console.log('GATE 3 - DEBUGGING EMPLOYMENT SELECT');
    console.log('====================================\n');

    // Find the employment select
    const empSelect = page.getByRole("combobox", { name: /employment/i }).first();
    console.log('✓ Found employment select');

    // Get current value
    const beforeText = await empSelect.textContent();
    console.log(`Before click: "${beforeText}"`);

    // Click to open
    console.log('\nClicking select to open dropdown...');
    await empSelect.click();
    await page.waitForTimeout(1000);

    // Check if dropdown is visible
    const options = page.getByRole('option');
    const count = await options.count();
    console.log(`\nDropdown options count: ${count}`);

    if (count > 0) {
      console.log('\nOptions found:');
      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        console.log(`  ${i + 1}. "${text}"`);
      }

      // Try clicking first option
      console.log('\nAttempting to click first option...');
      await options.first().click({ force: true });
      await page.waitForTimeout(1000);

      // Check if value changed
      const afterText = await empSelect.textContent();
      console.log(`\nAfter click: "${afterText}"`);

      if (afterText !== beforeText) {
        console.log('✅ SUCCESS: Select value changed!');
      } else {
        console.log('❌ FAILED: Select value did NOT change');
      }

      // Check if income field appeared
      const incomeField = page.getByLabel(/monthly income/i).first();
      const incomeVisible = await incomeField.isVisible().catch(() => false);

      console.log(`\nIncome field visible: ${incomeVisible}`);

      if (!incomeVisible) {
        console.log('❌ Income field did NOT appear - selection failed');
      }
    } else {
      console.log('❌ No options found - dropdown did not open');
    }

    console.log('\n\nBrowser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
})();
