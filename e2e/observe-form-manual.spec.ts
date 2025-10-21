// ABOUTME: Simple observation script - just navigate and take screenshots without complex interactions
import { test } from '@playwright/test';

test.describe('Progressive Form - Simple Observation', () => {
  test('manually observe form and take screenshots', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    console.log('\n=== NAVIGATING TO FORM ===\n');

    // Go directly to Step 2 with pre-filled data via URL params
    const step2URL = 'http://localhost:3007/apply?loanType=new_purchase&name=Test%20User&email=test@example.com&phone=91234567&step=2';

    console.log(`Navigating to: ${step2URL}`);
    await page.goto(step2URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\nStep 2 loaded - taking screenshot');
    await page.screenshot({ path: 'screenshots/manual-step2-initial.png', fullPage: true });

    // Get all text content to search for instant calc indicators
    const pageText = await page.textContent('body');
    console.log('\n=== CHECKING FOR INSTANT CALC KEYWORDS ===');
    console.log(`Contains "instant": ${pageText?.includes('instant') || pageText?.includes('Instant')}`);
    console.log(`Contains "analyzing": ${pageText?.includes('analyzing') || pageText?.includes('Analyzing')}`);
    console.log(`Contains "LTV": ${pageText?.includes('LTV')}`);
    console.log(`Contains "TDSR": ${pageText?.includes('TDSR')}`);
    console.log(`Contains "MSR": ${pageText?.includes('MSR')}`);

    // Check for numeric input fields
    console.log('\n=== STEP 2 NUMERIC FIELDS ===');
    const numericInputs = await page.locator('input[type="number"], input[type="tel"], input[inputmode="numeric"]').all();
    console.log(`Found ${numericInputs.length} numeric input fields`);

    for (let i = 0; i < numericInputs.length; i++) {
      const field = numericInputs[i];
      const name = await field.getAttribute('name') || 'unnamed';
      const placeholder = await field.getAttribute('placeholder') || '';
      const type = await field.getAttribute('type') || '';
      const inputMode = await field.getAttribute('inputmode') || '';
      console.log(`  ${i + 1}. name="${name}", type="${type}", inputmode="${inputMode}", placeholder="${placeholder}"`);
    }

    // Now let's try to actually fill some fields and observe
    console.log('\n=== FILLING STEP 2 FIELDS ===');

    // Try to click property category button
    const resaleButton = page.locator('button[value="resale"]');
    if (await resaleButton.count() > 0) {
      console.log('Clicking "resale" button...');
      await resaleButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/manual-step2-after-category.png', fullPage: true });
    }

    // Try to click property type
    const hdbButton = page.locator('button[value="HDB"]');
    if (await hdbButton.count() > 0) {
      console.log('Clicking "HDB" button...');
      await hdbButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/manual-step2-after-type.png', fullPage: true });
    }

    // Try to fill property price
    const priceInput = page.locator('input[name="propertyPrice"]');
    if (await priceInput.count() > 0) {
      console.log('Filling property price: 800000');
      await priceInput.fill('800000');
      await page.waitForTimeout(500);

      const displayedValue = await priceInput.inputValue();
      console.log(`Property price displayed as: "${displayedValue}"`);

      await page.waitForTimeout(1500); // Wait a bit to see if calc appears
      await page.screenshot({ path: 'screenshots/manual-step2-after-price.png', fullPage: true });
    }

    // Try to click existing properties button
    const existingPropsButton = page.locator('button[value="0"]');
    if (await existingPropsButton.count() > 0) {
      console.log('Clicking "0 existing properties" button...');
      await existingPropsButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/manual-step2-all-filled.png', fullPage: true });
    }

    // Wait a bit longer to see if instant calc appears
    console.log('\nWaiting 3 seconds to observe if instant calculation appears...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/manual-step2-final-wait.png', fullPage: true });

    // Check again for instant calc elements
    const instantCalcElements = await page.locator('[data-testid*="instant"]').all();
    const instantClassElements = await page.locator('[class*="instant"]').all();
    console.log(`\nInstant calculation elements found (by testid): ${instantCalcElements.length}`);
    console.log(`Instant calculation elements found (by class): ${instantClassElements.length}`);

    // Check if there's a results section or calculation display
    const resultsSection = await page.locator('[class*="result"], [class*="calculation"], [data-testid*="result"]').all();
    console.log(`Results/calculation sections found: ${resultsSection.length}`);

    // Get the full page text again
    const finalPageText = await page.textContent('body');

    console.log('\n=== FINAL PAGE CONTENT SCAN ===');
    console.log(`Page contains "Instant": ${finalPageText?.includes('Instant')}`);
    console.log(`Page contains "Your loan": ${finalPageText?.includes('Your loan') || finalPageText?.includes('your loan')}`);
    console.log(`Page contains "Maximum": ${finalPageText?.includes('Maximum')}`);
    console.log(`Page contains "Eligible": ${finalPageText?.includes('Eligible')}`);
    console.log(`Page contains any dollar amount: ${/\$[\d,]+/.test(finalPageText || '')}`);

    console.log('\n=== OBSERVATION COMPLETE ===\n');
  });
});
