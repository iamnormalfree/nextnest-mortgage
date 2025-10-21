// ABOUTME: Playwright test to verify HDB property scenario and calculation logic
// Tests that HDB properties correctly hide multi-property checkbox and show proper LTV

import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3002' });

test.describe('HDB Property Calculation Test', () => {
  test('HDB scenario - verify no multi-property checkbox and correct max loan', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[DEBUG]') || text.includes('[PRICE INPUT]') || text.includes('🔍')) {
        consoleMessages.push(text);
        console.log(text);
      }
    });

    // Navigate to form
    await page.goto('/apply');
    
    // Wait for page to be fully loaded (check for any visible element first)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Fill Step 1
    const nameInput = page.locator('#full-name');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('Test User');
    
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('91234567');
    
    // Progress to Step 2
    await page.locator('button:has-text("Continue to property details")').click();
    await page.waitForTimeout(1000);
    
    // Fill Step 2 - HDB scenario
    // Property Category: Resale
    const categorySelect = page.locator('#property-category');
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    await categorySelect.click();
    await page.waitForTimeout(500);
    
    const resaleOption = page.locator('[role="option"]').filter({ hasText: 'Resale' });
    await expect(resaleOption).toBeVisible();
    await resaleOption.click();
    await page.waitForTimeout(500);
    
    // Property Type: HDB
    const typeSelect = page.locator('#property-type');
    await expect(typeSelect).toBeVisible({ timeout: 5000 });
    await typeSelect.click();
    await page.waitForTimeout(500);
    
    const hdbOption = page.locator('[role="option"]').filter({ hasText: 'HDB' });
    await expect(hdbOption).toBeVisible();
    await hdbOption.click();
    await page.waitForTimeout(500);
    
    // Property Price: $1,000,000
    const priceInput = page.locator('#property-price');
    await expect(priceInput).toBeVisible();
    await priceInput.click();
    await priceInput.clear();

    // Use pressSequentially instead of fill to simulate real typing
    await priceInput.pressSequentially('1000000', { delay: 50 });

    // Trigger blur event to ensure onChange fires
    await priceInput.blur();
    await page.waitForTimeout(1000);  // Wait for value to be processed

    // Verify the value was entered correctly
    const enteredValue = await priceInput.inputValue();
    console.log(`✅ Property Price Input Value: ${enteredValue}`);
    
    // Combined Age: 35
    const ageInput = page.locator('#combined-age');
    await expect(ageInput).toBeVisible();
    await ageInput.click();
    await ageInput.clear();
    await ageInput.pressSequentially('35', { delay: 50 });
    await ageInput.blur();

    // Wait for instant analysis to calculate (debounce + calculation time)
    await page.waitForTimeout(3000);
    
    // VERIFICATION 1: Checkbox should NOT appear for HDB
    const multiPropertyCheckbox = page.locator('text=I\'m keeping my current property');
    const checkboxVisible = await multiPropertyCheckbox.isVisible().catch(() => false);
    
    console.log('\n='.repeat(60));
    console.log('HDB CALCULATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log('\n1. Multi-property checkbox visibility:');
    console.log(`   Expected: NOT visible (HDB can't own 2 properties)`);
    console.log(`   Actual: ${checkboxVisible ? 'VISIBLE (FAIL)' : 'NOT visible (PASS)'}`);
    
    // VERIFICATION 2: Check form state via browser console
    const formState = await page.evaluate(() => {
      return (window as any).__form_state || null;
    });

    // VERIFICATION 2B: Check instant analysis state
    const analysisState = await page.evaluate(() => {
      return (window as any).__instant_analysis || null;
    });

    console.log('\n2. Form state (existingProperties):');
    console.log(`   Expected: 0`);
    console.log(`   Actual: ${formState?.existingProperties ?? 'undefined'}`);
    console.log(`   Full form state:`, JSON.stringify(formState, null, 2));
    console.log('\n2B. Instant analysis state:');
    console.log(JSON.stringify(analysisState, null, 2));
    
    // VERIFICATION 3: Extract max loan amount from instant analysis
    const pageText = await page.locator('body').textContent();
    
    // Try multiple patterns to find the loan amount
    let maxLoanAmount = 'NOT FOUND';
    const patterns = [
      /You qualify for up to\s+\$?([\d,]+)/i,
      /qualify for up to\s+\$?([\d,]+)/i,
      /maximum loan[:\s]+\$?([\d,]+)/i,
      /max loan[:\s]+\$?([\d,]+)/i,
      /loan amount[:\s]+\$?([\d,]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = pageText?.match(pattern);
      if (match) {
        maxLoanAmount = match[1];
        console.log(`   Matched pattern: ${pattern.source}`);
        break;
      }
    }
    
    console.log('\n3. Max loan amount:');
    console.log(`   Expected: Around $750,000 (75% LTV of $1M)`);
    console.log(`   Actual: $${maxLoanAmount}`);
    
    // Debug: print relevant portion of page text if not found
    if (maxLoanAmount === 'NOT FOUND') {
      console.log('\nDEBUG: Searching page for loan-related text:');
      const lines = pageText?.split('\n').filter(line => 
        line.toLowerCase().includes('loan') || 
        line.toLowerCase().includes('qualify') ||
        line.match(/\$[\d,]+/)
      ).slice(0, 10);
      console.log(lines?.join('\n'));
    }
    
    // Parse the actual loan amount
    const actualLoan = parseInt(maxLoanAmount.replace(/,/g, ''), 10);
    const expectedLoan = 750000;
    const tolerance = 10000; // Allow $10k tolerance
    
    const loanCorrect = !isNaN(actualLoan) && 
                       Math.abs(actualLoan - expectedLoan) <= tolerance;
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Checkbox Hidden: ${!checkboxVisible ? 'PASS' : 'FAIL'}`);
    console.log(`ExistingProperties = 0: ${formState?.existingProperties === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`Max Loan ~$750k: ${loanCorrect ? 'PASS' : 'FAIL'}`);
    
    if (!loanCorrect && !isNaN(actualLoan)) {
      console.log(`   Actual was: $${actualLoan.toLocaleString()}`);
      console.log(`   Expected: $${expectedLoan.toLocaleString()}`);
      console.log(`   Difference: $${Math.abs(actualLoan - expectedLoan).toLocaleString()}`);
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Assertions
    expect(checkboxVisible, 'Multi-property checkbox should NOT be visible for HDB').toBe(false);
    expect(formState?.existingProperties, 'existingProperties should be 0').toBe(0);
    expect(actualLoan, 'Max loan should be around $750k').toBeGreaterThanOrEqual(expectedLoan - tolerance);
    expect(actualLoan, 'Max loan should be around $750k').toBeLessThanOrEqual(expectedLoan + tolerance);
  });
});
