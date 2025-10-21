/**
 * Visual validation check for HTML input attributes
 * Run with: npx playwright test e2e/visual-validation-check.spec.ts --headed
 */

import { test, expect } from '@playwright/test';

test.describe('Visual HTML Validation Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/apply');

    // Fill Step 1
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="mobile"]', '91234567');

    // Click Next to go to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
  });

  test('New Purchase: Age field should have min/max attributes', async ({ page }) => {
    // Select New Purchase
    await page.click('text=New Purchase');
    await page.waitForTimeout(500);

    // Check age input
    const ageInput = page.locator('input[name="combinedAge"]').first();

    // Verify HTML attributes
    await expect(ageInput).toHaveAttribute('min', '18');
    await expect(ageInput).toHaveAttribute('max', '99');
    await expect(ageInput).toHaveAttribute('step', '1');

    console.log('✅ Age field has correct validation attributes');
  });

  test('Refinance: Current Rate field should have min attribute (THE FIX)', async ({ page }) => {
    // Select Refinance
    await page.click('text=Refinance');
    await page.waitForTimeout(500);

    // Check current rate input
    const rateInput = page.locator('input[placeholder="3.0"]');

    // Verify the fix we applied
    await expect(rateInput).toHaveAttribute('min', '0');
    await expect(rateInput).toHaveAttribute('step', '0.01');

    console.log('✅ Current Interest Rate field has min="0" attribute (OUR FIX)');

    // Try to enter negative value
    await rateInput.fill('-2.5');

    // Get the actual value (HTML5 validation should prevent negative)
    const value = await rateInput.inputValue();
    console.log(`Attempted to enter: -2.5, Actual value: ${value}`);

    // Note: HTML5 validation behavior varies by browser
    // Some browsers show validation message, others prevent input
  });

  test('Refinance: Outstanding loan field should have min attribute', async ({ page }) => {
    // Select Refinance
    await page.click('text=Refinance');
    await page.waitForTimeout(500);

    // Check outstanding loan input
    const loanInput = page.locator('input[name="outstandingLoan"]').first();

    // Verify attributes
    await expect(loanInput).toHaveAttribute('min', '0');

    console.log('✅ Outstanding loan field has min="0" attribute');
  });

  test('Step 3: Income fields should have min attribute', async ({ page }) => {
    // Quick path to Step 3
    await page.click('text=New Purchase');
    await page.waitForTimeout(500);

    // Fill minimal Step 2 fields
    await page.fill('input[name="combinedAge"]', '35');
    await page.selectOption('select', 'HDB');
    await page.fill('input[placeholder="e.g. 500000"]', '500000');

    // Click Next to Step 3
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check income input in Step 3
    const incomeInputs = page.locator('input[type="number"]').filter({ hasText: /income/i });
    const firstIncome = incomeInputs.first();

    // Verify min attribute
    await expect(firstIncome).toHaveAttribute('min', '0');

    console.log('✅ Step 3 income field has min="0" attribute');
  });

  test('Visual: Try entering invalid values and see browser validation', async ({ page }) => {
    // Select New Purchase
    await page.click('text=New Purchase');
    await page.waitForTimeout(500);

    const ageInput = page.locator('input[name="combinedAge"]').first();

    // Take screenshot before invalid input
    await page.screenshot({ path: 'test-results/before-invalid-age.png' });

    // Try invalid age (below 18)
    await ageInput.fill('15');
    await page.click('button:has-text("Next")'); // Trigger validation

    // Take screenshot after - should show validation message
    await page.screenshot({ path: 'test-results/invalid-age-validation.png' });

    console.log('📸 Screenshots saved to test-results/');
    console.log('   - before-invalid-age.png');
    console.log('   - invalid-age-validation.png');

    // Clear and try valid value
    await ageInput.fill('35');
    await page.screenshot({ path: 'test-results/valid-age.png' });

    console.log('   - valid-age.png');
  });
});
