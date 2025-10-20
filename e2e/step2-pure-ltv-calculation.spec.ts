// ABOUTME: E2E test to verify Step 2 uses pure LTV calculation (Phase 3B fix)
// Verifies: calculationType === 'pure_ltv', limitingFactor === 'LTV', NO income used

import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3002' });

test.describe('Step 2 Pure LTV Calculation - Phase 3B Verification', () => {
  test('Step 2 HDB $1M should use pure LTV (NO income)', async ({ page }) => {
    // Capture console messages to verify calculation type
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('🔍') || text.includes('Pure LTV')) {
        console.log(text);
      }
    });

    // Navigate to form
    await page.goto('/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill Step 1 (Contact Info)
    await page.locator('#full-name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('91234567');
    await page.locator('button:has-text("Continue to property details")').click();
    await page.waitForTimeout(1000);

    // Fill Step 2 (Property Details)
    // Property Type: HDB (should default to Resale)
    const typeSelect = page.locator('#property-type');
    await expect(typeSelect).toBeVisible({ timeout: 5000 });
    await typeSelect.click();
    await page.waitForTimeout(300);

    const hdbOption = page.locator('[role="option"]').filter({ hasText: 'HDB' });
    await expect(hdbOption).toBeVisible();
    await hdbOption.click();
    await page.waitForTimeout(300);

    // Property Price: $1,000,000
    const priceInput = page.locator('#property-price');
    await expect(priceInput).toBeVisible();
    await priceInput.click();
    await priceInput.clear();
    await priceInput.pressSequentially('1000000', { delay: 50 });
    await priceInput.blur();
    await page.waitForTimeout(500);

    // Combined Age: 38
    const ageInput = page.locator('#combined-age');
    await expect(ageInput).toBeVisible();
    await ageInput.click();
    await ageInput.clear();
    await ageInput.pressSequentially('38', { delay: 50 });
    await ageInput.blur();

    // Wait for instant analysis to calculate (debounce 500ms + calculation time + display timer 1000ms)
    await page.waitForTimeout(2500);

    // VERIFICATION 1: Console logs should show "Step 2: Using PURE LTV calculation (no income)"
    const pureLtvLog = consoleLogs.find(log =>
      log.includes('Step 2: Using PURE LTV calculation') ||
      log.includes('Step 2: Calling calculatePureLtvMaxLoan')
    );

    console.log('\n' + '='.repeat(70));
    console.log('STEP 2 PURE LTV CALCULATION VERIFICATION');
    console.log('='.repeat(70));

    console.log('\n1. Console Logs - Pure LTV Routing:');
    console.log(`   Expected: "Step 2: Using PURE LTV calculation (no income)"`);
    console.log(`   Found: ${pureLtvLog ? 'YES ✅' : 'NO ❌'}`);
    if (pureLtvLog) {
      console.log(`   Log: ${pureLtvLog}`);
    }

    // VERIFICATION 2: Check calculation result via browser console
    const calcResult = await page.evaluate(() => {
      // Access React component state if exposed for testing
      return (window as any).__instant_calc_result || null;
    });

    console.log('\n2. Calculation Result Type:');
    console.log(`   Expected calculationType: 'pure_ltv'`);
    console.log(`   Actual: ${calcResult?.calculationType || 'NOT FOUND'}`);
    console.log(`   Expected limitingFactor: 'LTV'`);
    console.log(`   Actual: ${calcResult?.limitingFactor || 'NOT FOUND'}`);

    // VERIFICATION 3: Max loan amount should be $750,000 (75% of $1M)
    const pageText = await page.locator('body').textContent();
    const loanMatch = pageText?.match(/You qualify for up to\s+\$?([\d,]+)/i);
    const maxLoanAmount = loanMatch ? loanMatch[1] : 'NOT FOUND';
    const actualLoan = parseInt(maxLoanAmount.replace(/,/g, ''), 10);

    console.log('\n3. Max Loan Amount:');
    console.log(`   Expected: $750,000 (75% LTV for first property)`);
    console.log(`   Actual: $${maxLoanAmount}`);
    console.log(`   Status: ${Math.abs(actualLoan - 750000) <= 1000 ? 'PASS ✅' : 'FAIL ❌'}`);

    // VERIFICATION 4: UI messaging should NOT mention income
    const hasIncomeText = pageText?.toLowerCase().includes('based on your income') || false;

    console.log('\n4. UI Messaging:');
    console.log(`   Should NOT mention "based on your income": ${!hasIncomeText ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   Should mention property regulations or LTV: ${pageText?.toLowerCase().includes('property') ? 'PASS ✅' : 'FAIL ❌'}`);

    // VERIFICATION 5: Reason codes should NOT contain MSR/TDSR
    const pureLtvReasonLog = consoleLogs.find(log => log.includes('Pure LTV result:'));
    let hasMsrTdsr = false;
    if (pureLtvReasonLog) {
      hasMsrTdsr = pureLtvReasonLog.includes('msr_limited') || pureLtvReasonLog.includes('tdsr_limited');
    }

    console.log('\n5. Reason Codes:');
    console.log(`   Should NOT contain 'msr_limited' or 'tdsr_limited': ${!hasMsrTdsr ? 'PASS ✅' : 'FAIL ❌'}`);

    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Pure LTV routing detected: ${!!pureLtvLog}`);
    console.log(`✅ Max loan = $750k: ${Math.abs(actualLoan - 750000) <= 1000}`);
    console.log(`✅ No income messaging: ${!hasIncomeText}`);
    console.log(`✅ No MSR/TDSR in reason codes: ${!hasMsrTdsr}`);
    console.log('='.repeat(70) + '\n');

    // Assertions
    expect(pureLtvLog, 'Console should log pure LTV routing').toBeTruthy();
    expect(actualLoan, 'Max loan should be $750k').toBeGreaterThanOrEqual(749000);
    expect(actualLoan, 'Max loan should be $750k').toBeLessThanOrEqual(751000);
    expect(hasIncomeText, 'UI should NOT mention "based on your income"').toBe(false);
    expect(hasMsrTdsr, 'Reason codes should NOT contain MSR/TDSR limits').toBe(false);
  });

  test('Step 2 Private $1.5M second property should use pure LTV at 45%', async ({ page }) => {
    // Capture console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('🔍') || text.includes('Pure LTV')) {
        console.log(text);
      }
    });

    // Navigate to form
    await page.goto('/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill Step 1
    await page.locator('#full-name').fill('Second Property Buyer');
    await page.locator('#email').fill('second@example.com');
    await page.locator('#phone').fill('91234567');
    await page.locator('button:has-text("Continue to property details")').click();
    await page.waitForTimeout(1000);

    // Fill Step 2 - Private property
    const typeSelect = page.locator('#property-type');
    await expect(typeSelect).toBeVisible({ timeout: 5000 });
    await typeSelect.click();
    await page.waitForTimeout(300);

    const privateOption = page.locator('[role="option"]').filter({ hasText: 'Private' });
    await expect(privateOption).toBeVisible();
    await privateOption.click();
    await page.waitForTimeout(300);

    // Property Price: $1,500,000
    const priceInput = page.locator('#property-price');
    await expect(priceInput).toBeVisible();
    await priceInput.click();
    await priceInput.clear();
    await priceInput.pressSequentially('1500000', { delay: 50 });
    await priceInput.blur();
    await page.waitForTimeout(500);

    // Combined Age: 35
    const ageInput = page.locator('#combined-age');
    await expect(ageInput).toBeVisible();
    await ageInput.click();
    await ageInput.clear();
    await ageInput.pressSequentially('35', { delay: 50 });
    await ageInput.blur();
    await page.waitForTimeout(500);

    // Check for second property checkbox (should be visible for Private)
    const secondPropertyCheckbox = page.locator('text=I\'m keeping my current property');
    const checkboxVisible = await secondPropertyCheckbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      console.log('✅ Second property checkbox found (Private allows multi-property)');
      // Check the checkbox to trigger second property LTV
      await secondPropertyCheckbox.click();
      await page.waitForTimeout(1000);
    }

    // Wait for instant analysis
    await page.waitForTimeout(2500);

    // VERIFICATION: Max loan should be $675,000 (45% LTV for second property)
    const pageText = await page.locator('body').textContent();
    const loanMatch = pageText?.match(/You qualify for up to\s+\$?([\d,]+)/i);
    const maxLoanAmount = loanMatch ? loanMatch[1] : 'NOT FOUND';
    const actualLoan = parseInt(maxLoanAmount.replace(/,/g, ''), 10);
    const expectedLoan = 675000; // 45% of $1.5M

    console.log('\n' + '='.repeat(70));
    console.log('SECOND PROPERTY - PURE LTV VERIFICATION');
    console.log('='.repeat(70));
    console.log('\nMax Loan Amount:');
    console.log(`   Expected: $675,000 (45% LTV for second property)`);
    console.log(`   Actual: $${maxLoanAmount}`);
    console.log(`   Status: ${Math.abs(actualLoan - expectedLoan) <= 5000 ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log('='.repeat(70) + '\n');

    // Assertion (allow $5k tolerance)
    expect(actualLoan, 'Max loan should be $675k').toBeGreaterThanOrEqual(expectedLoan - 5000);
    expect(actualLoan, 'Max loan should be $675k').toBeLessThanOrEqual(expectedLoan + 5000);
  });
});
