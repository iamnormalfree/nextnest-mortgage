import { test, expect } from '@playwright/test';

test.describe('Manual Private Second Property Test', () => {
  test('should check second property scenario with checkbox', async ({ page }) => {
    // Set longer timeout for manual testing
    test.setTimeout(120000);

    console.log('1. Navigating to /apply...');
    await page.goto('http://localhost:3002/apply');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/01-landing.png', fullPage: true });

    console.log('2. Clicking New Purchase...');
    await page.click('text=New Purchase');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/02-after-new-purchase.png', fullPage: true });

    console.log('3. Filling contact information...');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="phone"]', '91234567');
    await page.screenshot({ path: 'test-results/03-contact-filled.png', fullPage: true });

    console.log('4. Clicking Continue...');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/04-step2-loaded.png', fullPage: true });

    console.log('5. Selecting Resale...');
    await page.click('text=Resale');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/05-resale-selected.png', fullPage: true });

    console.log('6. Selecting Private...');
    await page.click('text=Private');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/06-private-selected.png', fullPage: true });

    // Check if checkbox is visible
    const checkbox = page.locator('input[type="checkbox"]').filter({ hasText: /keeping.*current.*property/i });
    const isCheckboxVisible = await checkbox.isVisible().catch(() => false);
    console.log('7. Checkbox visible?', isCheckboxVisible);

    if (isCheckboxVisible) {
      console.log('8. Checking the checkbox...');
      await checkbox.check();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/07-checkbox-checked.png', fullPage: true });
    } else {
      console.log('8. WARNING: Checkbox not found! Taking screenshot...');
      await page.screenshot({ path: 'test-results/07-checkbox-not-found.png', fullPage: true });
    }

    console.log('9. Entering property price 1500000...');
    await page.fill('input[name="propertyPrice"]', '1500000');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/08-price-entered.png', fullPage: true });

    console.log('10. Entering combined age 35...');
    await page.fill('input[name="combinedAge"]', '35');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/09-age-entered.png', fullPage: true });

    console.log('11. Waiting for instant analysis...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/10-instant-analysis-result.png', fullPage: true });

    // Extract instant analysis data
    const analysisText = await page.textContent('body');
    console.log('\n=== INSTANT ANALYSIS RESULTS ===');
    console.log('Checkbox checked:', await checkbox.isChecked().catch(() => 'N/A'));
    console.log('Full page text (for debugging):', analysisText?.substring(0, 500));
    
    // Try to find max loan amount
    const maxLoanElements = await page.locator('text=/max.*loan|loan.*amount/i').all();
    for (const elem of maxLoanElements) {
      console.log('Found element:', await elem.textContent());
    }

    console.log('\nTest completed! Check test-results/ folder for screenshots.');
  });
});
