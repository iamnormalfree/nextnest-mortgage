// ABOUTME: Manual test script to observe progressive form behavior and number formatting
// This script tests the instant calculation behavior and numeric field formatting

import { test, expect } from '@playwright/test';

test.describe('Progressive Form - Manual Investigation', () => {
  test('observe instant calculation behavior and number formatting', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout
    console.log('\n=== STARTING TEST ===\n');

    // Navigate to the form
    await page.goto('http://localhost:3007/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');

    console.log('Step 1: Taking initial screenshot');
    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });

    // Step 1: Fill basic info
    console.log('\nStep 1: Filling basic info');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');

    // Fill phone number if present
    const phoneInput = page.locator('input[name="phone"]');
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('91234567');
    }

    // Wait a bit for validation
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/02-step1-filled.png', fullPage: true });

    // Check button state
    const button = page.locator('button:has-text("Continue to property details")');
    const isDisabled = await button.getAttribute('disabled');
    console.log(`Button disabled state: ${isDisabled !== null}`);

    // If button is disabled, check what fields might be missing
    if (isDisabled !== null) {
      console.log('Button is disabled. Checking form validity...');
      const allInputs = await page.locator('input').all();
      for (const input of allInputs) {
        const name = await input.getAttribute('name');
        const value = await input.inputValue();
        const required = await input.getAttribute('required');
        console.log(`Input: name="${name}", value="${value}", required="${required !== null}"`);
      }
    }

    // Wait for button to be enabled (with timeout)
    console.log('Waiting for button to be enabled...');
    await button.waitFor({ state: 'attached', timeout: 10000 });
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    }, { timeout: 10000 }).catch(() => console.log('Button did not become enabled'));

    // Try clicking anyway
    await button.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('\nStep 2: On property details page');
    await page.screenshot({ path: 'screenshots/03-step2-initial.png', fullPage: true });

    // Check for any instant calculation display before filling
    const instantCalcBefore = await page.locator('[data-testid*="instant"], [class*="instant"], text=/instant/i').count();
    console.log(`Instant calc elements visible before filling: ${instantCalcBefore}`);

    // Fill Step 2: Property details
    console.log('\nFilling Step 2 fields...');

    // Property category - resale
    await page.click('button[value="resale"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-step2-category-selected.png', fullPage: true });

    // Property type - HDB
    await page.click('button[value="HDB"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/05-step2-type-selected.png', fullPage: true });

    // Property price
    const priceInput = page.locator('input[name="propertyPrice"]');
    await priceInput.fill('800000');
    console.log('\nProperty price filled: 800000');

    // Check what's displayed in the field
    const priceValue = await priceInput.inputValue();
    const priceDisplayed = await priceInput.evaluate(el => (el as HTMLInputElement).value);
    console.log(`Price input value: "${priceValue}"`);
    console.log(`Price displayed: "${priceDisplayed}"`);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/06-step2-price-entered.png', fullPage: true });

    // Existing properties
    await page.click('button[value="0"]');
    await page.waitForTimeout(500);

    console.log('\nAll Step 2 fields filled - checking for instant calculation...');
    await page.screenshot({ path: 'screenshots/07-step2-all-filled.png', fullPage: true });

    // Wait a bit to see if calculation appears
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/08-step2-after-wait.png', fullPage: true });

    // Check for instant calculation elements
    const instantCalcAfter = await page.locator('[data-testid*="instant"], [class*="instant"], text=/instant/i, text=/analyzing/i, text=/calculating/i').count();
    console.log(`Instant calc elements visible after filling: ${instantCalcAfter}`);

    // Look for any calculation display
    const pageContent = await page.content();
    const hasLTV = pageContent.includes('LTV') || pageContent.includes('loan-to-value');
    const hasTDSR = pageContent.includes('TDSR') || pageContent.includes('debt service');
    const hasMSR = pageContent.includes('MSR') || pageContent.includes('mortgage service');

    console.log(`\nCalculation indicators found:`);
    console.log(`- LTV mentioned: ${hasLTV}`);
    console.log(`- TDSR mentioned: ${hasTDSR}`);
    console.log(`- MSR mentioned: ${hasMSR}`);

    // Check all numeric input fields on Step 2
    console.log('\n=== STEP 2 NUMERIC FIELDS ===');
    const numericFields = await page.locator('input[type="number"], input[type="tel"], input[inputmode="numeric"]').all();
    console.log(`Found ${numericFields.length} numeric input fields on Step 2`);

    for (let i = 0; i < numericFields.length; i++) {
      const field = numericFields[i];
      const name = await field.getAttribute('name') || 'unnamed';
      const value = await field.inputValue();
      const placeholder = await field.getAttribute('placeholder') || '';
      console.log(`  Field ${i + 1}: name="${name}", value="${value}", placeholder="${placeholder}"`);
    }

    // Progress to Step 3
    console.log('\n=== PROGRESSING TO STEP 3 ===');
    // Look for the button that moves to Step 3 - might be "Continue" or similar
    const step3Button = await page.locator('button').filter({ hasText: /continue|next/i }).first();
    await step3Button.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/09-step3-initial.png', fullPage: true });

    // Fill income field
    console.log('\nFilling monthly income...');
    const incomeInput = page.locator('input[name="monthlyIncome"]');
    await incomeInput.fill('8000');

    const incomeValue = await incomeInput.inputValue();
    console.log(`Income input value: "${incomeValue}"`);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/10-step3-income-entered.png', fullPage: true });

    // Wait to see if calculation updates
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/11-step3-after-wait.png', fullPage: true });

    // Check for calculation update indicators
    const step3Content = await page.content();
    const hasRecalc = step3Content.includes('analyzing') || step3Content.includes('calculating') || step3Content.includes('updating');
    console.log(`\nCalculation update indicator on Step 3: ${hasRecalc}`);

    // Check all numeric fields on Step 3
    console.log('\n=== STEP 3 NUMERIC FIELDS ===');
    const step3NumericFields = await page.locator('input[type="number"], input[type="tel"], input[inputmode="numeric"]').all();
    console.log(`Found ${step3NumericFields.length} numeric input fields on Step 3`);

    for (let i = 0; i < step3NumericFields.length; i++) {
      const field = step3NumericFields[i];
      const name = await field.getAttribute('name') || 'unnamed';
      const value = await field.inputValue();
      const placeholder = await field.getAttribute('placeholder') || '';
      const type = await field.getAttribute('type') || '';
      const inputMode = await field.getAttribute('inputmode') || '';
      console.log(`  Field ${i + 1}: name="${name}", value="${value}", type="${type}", inputmode="${inputMode}", placeholder="${placeholder}"`);
    }

    // Final full page screenshot
    await page.screenshot({ path: 'screenshots/12-step3-final.png', fullPage: true });

    console.log('\n=== TEST COMPLETE ===\n');
    console.log('Screenshots saved to screenshots/ directory');
  });
});
