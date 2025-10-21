import { test, expect, Page } from '@playwright/test';

/**
 * Test: Private Property - Second Property Scenario
 * Validates LTV calculation when user keeps existing property (45% LTV cap)
 */

test.describe('Private Property - Second Property LTV Calculation', () => {
  test('should apply 45% LTV cap when keeping current property', async ({ page }) => {
    // Navigate to application form (defaults to new_purchase loan type)
    await page.goto('http://localhost:3008/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Fill contact information
    console.log('Step 1: Filling contact information...');
    await page.locator('#full-name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('91234567');
    
    // Wait for Next button to be enabled
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeVisible({ timeout: 5000 });
    await expect(nextButton).toBeEnabled({ timeout: 5000 });
    
    await nextButton.click();
    console.log('✓ Clicked Next button');
    
    // Wait for Step 2 to load
    await page.waitForTimeout(1000);
    
    // Verify we're on Step 2 by checking for property category selector
    console.log('Step 2: Selecting property details...');
    const propertyCategory = page.locator('#property-category');
    await expect(propertyCategory).toBeVisible({ timeout: 5000 });
    
    // Select Property Category - Resale
    await propertyCategory.click();
    await page.waitForTimeout(300);
    
    const resaleOption = page.locator('[role="option"]').filter({ hasText: 'Resale' });
    await expect(resaleOption).toBeVisible();
    await resaleOption.click();
    console.log('✓ Selected Resale category');
    await page.waitForTimeout(300);
    
    // Select Property Type - Private
    const propertyType = page.locator('#property-type');
    await expect(propertyType).toBeVisible({ timeout: 5000 });
    await propertyType.click();
    await page.waitForTimeout(300);
    
    const privateOption = page.locator('[role="option"]').filter({ hasText: 'Private' });
    await expect(privateOption).toBeVisible();
    await privateOption.click();
    console.log('✓ Selected Private property type');
    await page.waitForTimeout(300);
    
    // Verify checkbox is visible (only shown for Private/EC/Landed)
    const checkbox = page.locator('#second-property');
    await expect(checkbox).toBeVisible({ timeout: 5000 });
    console.log('✓ Second property checkbox is visible');
    
    // CHECK the checkbox "I'm keeping my current property"
    await checkbox.check();
    await page.waitForTimeout(300);
    
    // Verify checkbox is checked
    await expect(checkbox).toBeChecked();
    console.log('✓ Checkbox is checked (existingProperties = 1)');
    
    // Fill Property Price - $1,000,000
    const priceInput = page.locator('#property-price');
    await priceInput.fill('1000000');
    console.log('✓ Filled property price: $1,000,000');
    await page.waitForTimeout(300);
    
    // Fill Combined Age - 35
    const ageInput = page.locator('#combined-age');
    await ageInput.fill('35');
    console.log('✓ Filled combined age: 35');
    await page.waitForTimeout(2000); // Wait for calculation
    
    // Extract instant analysis max loan with checkbox CHECKED
    const maxLoanChecked = await extractMaxLoan(page);
    console.log(`\nMax Loan (checkbox CHECKED - 45% LTV): $${maxLoanChecked.toLocaleString()}`);
    
    // Verify max loan is around $450,000 (45% of $1M)
    const expectedMaxLoanChecked = 450000;
    const toleranceChecked = 0.05; // 5% tolerance
    const lowerBoundChecked = expectedMaxLoanChecked * (1 - toleranceChecked);
    const upperBoundChecked = expectedMaxLoanChecked * (1 + toleranceChecked);
    
    expect(maxLoanChecked).toBeGreaterThanOrEqual(lowerBoundChecked);
    expect(maxLoanChecked).toBeLessThanOrEqual(upperBoundChecked);
    
    console.log(`✓ Max loan is within expected range: $${lowerBoundChecked.toLocaleString()} - $${upperBoundChecked.toLocaleString()}`);
    
    // UNCHECK the checkbox
    await checkbox.uncheck();
    console.log('\nUnchecking checkbox...');
    await page.waitForTimeout(2000); // Wait for recalculation
    
    // Verify checkbox is unchecked
    await expect(checkbox).not.toBeChecked();
    console.log('✓ Checkbox is unchecked (existingProperties = 0)');
    
    // Extract instant analysis max loan with checkbox UNCHECKED
    const maxLoanUnchecked = await extractMaxLoan(page);
    console.log(`Max Loan (checkbox UNCHECKED - 75% LTV): $${maxLoanUnchecked.toLocaleString()}`);
    
    // Verify max loan is around $750,000 (75% of $1M)
    const expectedMaxLoanUnchecked = 750000;
    const toleranceUnchecked = 0.05; // 5% tolerance
    const lowerBoundUnchecked = expectedMaxLoanUnchecked * (1 - toleranceUnchecked);
    const upperBoundUnchecked = expectedMaxLoanUnchecked * (1 + toleranceUnchecked);
    
    expect(maxLoanUnchecked).toBeGreaterThanOrEqual(lowerBoundUnchecked);
    expect(maxLoanUnchecked).toBeLessThanOrEqual(upperBoundUnchecked);
    
    console.log(`✓ Max loan is within expected range: $${lowerBoundUnchecked.toLocaleString()} - $${upperBoundUnchecked.toLocaleString()}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Property Price: $1,000,000`);
    console.log(`Combined Age: 35`);
    console.log(`Property Type: Private (Resale)`);
    console.log(`\nWith checkbox CHECKED (existingProperties = 1):`);
    console.log(`  Max Loan: $${maxLoanChecked.toLocaleString()}`);
    console.log(`  Expected: ~$450,000 (45% LTV)`);
    console.log(`\nWith checkbox UNCHECKED (existingProperties = 0):`);
    console.log(`  Max Loan: $${maxLoanUnchecked.toLocaleString()}`);
    console.log(`  Expected: ~$750,000 (75% LTV)`);
    console.log('\nRESULT: PASS ✓');
    console.log('='.repeat(60));
  });
});

/**
 * Helper function to extract max loan amount from instant analysis
 */
async function extractMaxLoan(page: Page): Promise<number> {
  // Look for the instant analysis section
  const analysisText = page.locator('text=You qualify for up to');
  
  // Wait for it to be visible
  await expect(analysisText).toBeVisible({ timeout: 5000 });
  
  // Get the full text content from the page
  const fullText = await page.textContent('body');
  
  if (!fullText) {
    throw new Error('Could not read page text');
  }
  
  // Extract number from text like "You qualify for up to $450,000"
  const match = fullText.match(/You qualify for up to\s+\$([0-9,]+)/);
  if (!match) {
    throw new Error(`Could not extract max loan from text. Full text: ${fullText.substring(0, 500)}`);
  }
  
  // Remove commas and convert to number
  const maxLoan = parseInt(match[1].replace(/,/g, ''), 10);
  
  return maxLoan;
}
