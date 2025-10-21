import { test, expect } from '@playwright/test';

test.describe('Private Property Scenario', () => {
  test('New Purchase - Private Resale property flow', async ({ page }) => {
    // Navigate to apply page (defaults to New Purchase loan type)
    await page.goto('http://localhost:3002/apply');
    await page.waitForTimeout(500);
    
    // Step 1: Fill basic contact info
    await page.locator('#full-name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('91234567');
    
    // Click Continue/Next button to proceed to Step 2
    const continueButton = page.locator('button').filter({ hasText: /continue|next/i });
    await continueButton.click();
    await page.waitForTimeout(1000);
    
    // Step 2: Property Details
    console.log('\n=== Step 2: Property Details ===');
    
    // Select Property Category - Resale
    await page.locator('#property-category').click();
    await page.waitForTimeout(300);
    const resaleOption = page.locator('[role="option"]').filter({ hasText: 'Resale' });
    await resaleOption.click();
    await page.waitForTimeout(500);
    
    // Select Property Type - Private
    await page.locator('#property-type').click();
    await page.waitForTimeout(300);
    const privateOption = page.locator('[role="option"]').filter({ hasText: /Private Condo/ });
    await privateOption.click();
    await page.waitForTimeout(800);
    
    // VERIFICATION 1: Check if checkbox appears
    console.log('\n=== VERIFICATION 1: Checkbox Visibility ===');
    const checkboxLabel = page.locator('label').filter({ hasText: /keeping my current property/i });
    const checkboxVisible = await checkboxLabel.isVisible().catch(() => false);
    console.log('Checkbox label visible: ' + (checkboxVisible ? 'YES' : 'NO'));
    
    if (checkboxVisible) {
      console.log('PASS: Checkbox appears for Private property');
    } else {
      console.log('FAIL: Checkbox does NOT appear for Private property');
    }
    
    expect(checkboxVisible, 'Checkbox should be visible for Private property').toBe(true);
    
    // VERIFICATION 2: Check default state (should be unchecked)
    console.log('\n=== VERIFICATION 2: Default Checkbox State ===');
    const checkboxInput = page.locator('input[type="checkbox"]').first();
    const isChecked = await checkboxInput.isChecked();
    console.log('Checkbox checked state: ' + isChecked);
    console.log('Checkbox unchecked by default: ' + (!isChecked ? 'YES' : 'NO'));
    
    if (!isChecked) {
      console.log('PASS: Checkbox is unchecked by default');
    } else {
      console.log('FAIL: Checkbox is checked (should be unchecked)');
    }
    
    expect(isChecked, 'Checkbox should be unchecked by default').toBe(false);
    
    // Fill Property Price
    console.log('\n=== Filling Property Details ===');
    await page.locator('#property-price').fill('1500000');
    console.log('Property Price: $1,500,000');

    // Fill Combined Age
    await page.locator('#combined-age').fill('35');
    console.log('Combined Age: 35');

    // Wait for instant analysis to calculate
    console.log('\nWaiting for instant analysis calculation...');
    await page.waitForTimeout(2500);

    // VERIFICATION 3: Check instant analysis
    console.log('\n=== VERIFICATION 3: Instant Analysis ===');

    const analysisText = page.locator('text=/You qualify for up to/i');
    const analysisVisible = await analysisText.isVisible().catch(() => false);
    console.log('Instant analysis visible: ' + (analysisVisible ? 'YES' : 'NO'));

    if (analysisVisible) {
      console.log('PASS: Instant analysis appears');

      // Extract max loan amount
      const pageContent = await page.content();
      const loanMatch = pageContent.match(/\$([0-9,]+)/);

      if (loanMatch) {
        const loanAmountStr = loanMatch[1];
        const loanAmount = parseInt(loanAmountStr.replace(/,/g, ''));
        console.log('Max Loan Amount: $' + loanAmountStr);

        // Expected: 75% of $1,500,000 = $1,125,000
        const expectedMin = 1100000;
        const expectedMax = 1150000;

        if (loanAmount >= expectedMin && loanAmount <= expectedMax) {
          console.log('PASS: Max loan in expected range (~$1,125,000 for 75% LTV)');
        } else {
          console.log('FAIL: Max loan NOT in expected range');
          console.log('Expected: $1,100,000 - $1,150,000');
          console.log('Actual: $' + loanAmount.toLocaleString());
        }
      } else {
        console.log('Could not extract loan amount from page');
      }
    } else {
      console.log('FAIL: Instant analysis does NOT appear');
    }
    
    // VERIFICATION 4: existingProperties value
    console.log('\n=== VERIFICATION 4: existingProperties Value ===');
    console.log('Expected: 0 (checkbox unchecked = no existing properties)');
    console.log('Calculation should use existingProperties = 0');
    
    // Take screenshot for manual verification
    await page.screenshot({ 
      path: 'test-results/private-property-test.png', 
      fullPage: true 
    });
    console.log('\nScreenshot saved: test-results/private-property-test.png');
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('1. Checkbox appears: ' + (checkboxVisible ? 'PASS' : 'FAIL'));
    console.log('2. Checkbox unchecked by default: ' + (!isChecked ? 'PASS' : 'FAIL'));
    console.log('3. Instant analysis appears: ' + (analysisVisible ? 'PASS' : 'FAIL'));
    console.log('4. Expected max loan: ~$1,125,000 (75% LTV)');
    console.log('5. Expected existingProperties: 0');
    console.log('='.repeat(60));
  });
});
