const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 Navigating to production...');
    await page.goto('https://nextnest.sg');
    await page.waitForLoadState('networkidle');

    // Quick navigation to Gate 3
    const getStarted = page.getByRole('button', { name: /get started|start/i }).first();
    if (await getStarted.isVisible({ timeout: 3000 })) await getStarted.click();

    await page.getByRole('button', { name: /new purchase/i }).first().click();
    await page.waitForURL(/.*\/apply.*/i);
    await page.waitForTimeout(2000);

    // Fill Gate 1
    await page.getByPlaceholder(/name/i).first().fill('Test');
    await page.getByPlaceholder(/email/i).fill('test@test.com');
    await page.getByPlaceholder(/phone/i).fill('91234567');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(2000);

    // Fill Gate 2
    const cat = page.locator('[id="property-category"]').first();
    await cat.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: /resale/i }).click();
    await page.waitForTimeout(800);

    const type = page.locator('[id="property-type"]').first();
    await type.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: /HDB/i }).click();
    await page.waitForTimeout(800);

    await page.locator('[id="property-price"]').fill('500000');
    await page.locator('[id="combined-age"]').fill('35');
    await page.getByRole('button', { name: /continue|get instant/i }).click();
    await page.waitForTimeout(3000);

    // NOW CHECK EMPLOYMENT DROPDOWN
    console.log('\n====== EMPLOYMENT TYPE OPTIONS ======');

    const empSelect = page.getByRole("combobox", { name: /employment/i }).first();

    if (await empSelect.isVisible({ timeout: 5000 })) {
      console.log('✅ Employment dropdown found');
      await empSelect.click();
      await page.waitForTimeout(1000);

      const options = page.getByRole('option');
      const count = await options.count();
      console.log(`\nFound ${count} options:`);

      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        console.log(`  ${i + 1}. "${text}"`);
      }

      // Try to find our expected option
      console.log('\n====== TESTING SELECTORS ======');
      const exactMatch = page.getByRole('option', { name: 'Employed (3+ months with current employer)' });
      const isVisible = await exactMatch.isVisible().catch(() => false);
      console.log(`Exact match "Employed (3+ months with current employer)": ${isVisible ? '✅ FOUND' : '❌ NOT FOUND'}`);

      // Try regex
      const regexMatch = page.getByRole('option', { name: /Employed.*3.*months/i });
      const regexVisible = await regexMatch.isVisible().catch(() => false);
      console.log(`Regex match /Employed.*3.*months/i: ${regexVisible ? '✅ FOUND' : '❌ NOT FOUND'}`);

    } else {
      console.log('❌ Employment dropdown NOT visible');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
