const { chromium } = require('@playwright/test');

(async () => {
  console.log('🔍 Starting production verification...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down so you can see what's happening
  });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Opening production apply page...');
    await page.goto('https://nextnest.sg/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Step 2: Filling Gate 1 (name, email, phone)...');
    await page.getByPlaceholder(/name/i).first().fill('Verification Test');
    await page.getByPlaceholder(/email/i).fill('verify@test.com');
    await page.getByPlaceholder(/phone/i).fill('91234567');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(2000);

    console.log('Step 3: Filling Gate 2 (property details)...');
    // Property Category
    await page.locator('[id="property-category"]').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: /resale/i }).click();
    await page.waitForTimeout(1000);

    // Property Type
    await page.locator('[id="property-type"]').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: /HDB/i }).click();
    await page.waitForTimeout(1000);

    // Property Price
    await page.locator('[id="property-price"]').fill('500000');

    // Combined Age
    await page.locator('[id="combined-age"]').fill('35');

    await page.getByRole('button', { name: /continue|get instant/i }).click();
    await page.waitForTimeout(3000);

    console.log('\n====================================');
    console.log('GATE 3 - EMPLOYMENT TYPE DROPDOWN');
    console.log('====================================\n');

    // Find employment dropdown
    const empDropdown = page.getByRole("combobox", { name: /employment/i }).first();

    if (await empDropdown.isVisible({ timeout: 5000 })) {
      console.log('✅ Employment dropdown found\n');

      // Click to open dropdown
      await empDropdown.click();
      await page.waitForTimeout(1000);

      // Get all options
      const options = page.getByRole('option');
      const count = await options.count();

      console.log(`Found ${count} employment options:\n`);

      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        console.log(`  ${i + 1}. "${text}"`);
      }

      console.log('\n====================================');
      console.log('TESTING EXPECTED SELECTOR');
      console.log('====================================\n');

      const expectedOption = page.getByRole('option', {
        name: 'Employed (3+ months with current employer)'
      });

      const found = await expectedOption.isVisible().catch(() => false);

      if (found) {
        console.log('✅ FOUND: "Employed (3+ months with current employer)"');
        console.log('   → Test selector should work!');
      } else {
        console.log('❌ NOT FOUND: "Employed (3+ months with current employer)"');
        console.log('   → This is why the test is failing!');
        console.log('   → Production has different options than expected');
      }

      console.log('\n====================================');
      console.log('BROWSER WILL STAY OPEN FOR 30 SECONDS');
      console.log('Check the dropdown yourself in the browser window');
      console.log('====================================\n');

      await page.waitForTimeout(30000);

    } else {
      console.log('❌ Employment dropdown NOT visible');
      console.log('   → Something is wrong with page navigation');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
})();
