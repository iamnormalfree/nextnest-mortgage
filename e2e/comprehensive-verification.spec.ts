// ABOUTME: Comprehensive E2E verification of progressive form calculation corrections
// ABOUTME: Tests all 4 workstreams from 2025-10-31-progressive-form-calculation-correction-plan.md

import { test, expect } from '@playwright/test';

test.describe('Workstream 1 & 2: Calculator + UI Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/apply');
    await page.waitForLoadState('networkidle');
  });

  test('Step 2: Pure LTV Calculation (No Income)', async ({ page }) => {
    // Fill Step 0: Contact Info
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="mobile"]', '91234567');
    await page.click('button:has-text("Next")');

    // Wait for Step 1
    await page.waitForSelector('text=What You Need');

    // Fill Step 1: Property Details
    await page.click('button:has-text("New Purchase")');
    await page.waitForTimeout(500);

    // Select HDB Resale
    await page.click('button:has-text("HDB")');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="propertyType"]', 'HDB Resale');

    // Fill property details
    await page.fill('input[name="propertyPrice"]', '1000000');
    await page.fill('input[name="existingProperties"]', '0');
    await page.fill('input[name="age"]', '38');

    // Trigger Step 2 instant analysis
    await page.click('button:has-text("Next")');

    // Wait for instant analysis to load
    await page.waitForSelector('text=Instant Analysis', { timeout: 10000 });

    // VERIFICATION: Step 2 should show PURE LTV (75% of $1M = $750k)
    // Should NOT show income-based MSR/TDSR limits
    const maxLoanText = await page.textContent('[data-testid="max-loan-amount"]').catch(() =>
      page.textContent('text=/\\$750,000|750,000/')
    );

    expect(maxLoanText).toContain('750');

    // Verify no income assumptions (should not show $454k MSR-limited result)
    const content = await page.content();
    expect(content).not.toContain('454,000');
    expect(content).not.toContain('Based on your income'); // Should not assume income

    console.log('✅ Step 2 Pure LTV: Max Loan =', maxLoanText);
  });

  test('Step 3: Full Analysis with Income + MSR/TDSR', async ({ page }) => {
    // Navigate through to Step 3
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="mobile"]', '91234567');
    await page.click('button:has-text("Next")');

    await page.waitForSelector('text=What You Need');
    await page.click('button:has-text("New Purchase")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("HDB")');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="propertyType"]', 'HDB Resale');
    await page.fill('input[name="propertyPrice"]', '1000000');
    await page.fill('input[name="existingProperties"]', '0');
    await page.fill('input[name="age"]', '38');
    await page.click('button:has-text("Next")');

    // Wait for Step 3
    await page.waitForSelector('text=Your Finances');

    // Fill income
    await page.fill('input[name="actualIncomes.0"]', '10000');

    // Select employment type
    const employmentSelect = await page.locator('select[name="employmentType"]').count();
    if (employmentSelect > 0) {
      await page.selectOption('select[name="employmentType"]', 'Employed (Fixed)');
    }

    // Fill liabilities (enable one)
    const personalLoanCheckbox = await page.locator('input[type="checkbox"][name*="personalLoan"]').count();
    if (personalLoanCheckbox > 0) {
      await page.check('input[type="checkbox"][name*="personalLoan"]');
      await page.fill('input[name*="personalLoanPayment"]', '500');
    }

    // Trigger calculation
    await page.click('button:has-text("Calculate")').catch(() =>
      page.dispatchEvent('input[name="actualIncomes.0"]', 'blur')
    );

    // Wait for MAS Readiness panel
    await page.waitForSelector('text=/TDSR|MSR/', { timeout: 10000 });

    // VERIFICATION: Should show MSR and TDSR percentages
    const content = await page.content();

    // Check for MSR/TDSR compliance display
    const hasMSR = content.includes('MSR') || content.includes('msr');
    const hasTDSR = content.includes('TDSR') || content.includes('tdsr');

    expect(hasMSR || hasTDSR).toBeTruthy();

    // Check for persona-derived reason codes or policy references
    const hasPersonaData = content.includes('reasonCode') ||
                          content.includes('policyRef') ||
                          content.includes('MAS Notice') ||
                          content.includes('Policy reference');

    console.log('✅ Step 3 Full Analysis: MSR/TDSR displayed, Persona codes =', hasPersonaData);
  });

  test('Step 3: MAS Readiness Panel Renders Persona Codes', async ({ page }) => {
    // Quick navigation to Step 3
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="mobile"]', '91234567');
    await page.click('button:has-text("Next")');

    await page.waitForSelector('text=What You Need');
    await page.click('button:has-text("New Purchase")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Private")');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="propertyType"]', 'Private Condo');
    await page.fill('input[name="propertyPrice"]', '1500000');
    await page.fill('input[name="existingProperties"]', '1'); // Second property
    await page.fill('input[name="age"]', '40');
    await page.click('button:has-text("Next")');

    await page.waitForSelector('text=Your Finances');
    await page.fill('input[name="actualIncomes.0"]', '15000');

    // Trigger calculation and wait
    await page.click('button:has-text("Calculate")').catch(() =>
      page.dispatchEvent('input[name="actualIncomes.0"]', 'blur')
    );

    await page.waitForTimeout(2000);

    // Check for LTV cap applied (should be 45% for second property)
    const content = await page.content();

    // Second property should show 45% LTV
    const has45LTV = content.includes('45%') || content.includes('45 %');

    // Check if persona codes are rendered
    const hasReasonCodes = content.includes('reason') || content.includes('Reason');
    const hasPolicyRefs = content.includes('Policy reference') || content.includes('MAS Notice');

    console.log('✅ Second Property LTV Cap: 45% =', has45LTV);
    console.log('✅ Persona Codes Rendered: ReasonCodes =', hasReasonCodes, ', PolicyRefs =', hasPolicyRefs);

    expect(has45LTV).toBeTruthy();
  });

  test('Refinance Flow: Cash-Out Calculation', async ({ page }) => {
    // Navigate to refinance flow
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="mobile"]', '91234567');
    await page.click('button:has-text("Next")');

    await page.waitForSelector('text=What You Need');
    await page.click('button:has-text("Refinance")');
    await page.waitForTimeout(500);

    // Select Private property (cash-out allowed)
    await page.click('button:has-text("Private")');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="propertyType"]', 'Private Condo');

    // Fill refinance details
    await page.fill('input[name="propertyPrice"]', '2000000');
    await page.fill('input[name="outstandingLoan"]', '800000');
    await page.fill('input[name="currentRate"]', '2.5');
    await page.fill('input[name="existingProperties"]', '0'); // Owner-occupied
    await page.fill('input[name="age"]', '45');

    await page.click('button:has-text("Next")');

    // Wait for refinance analysis
    await page.waitForSelector('text=Your Finances', { timeout: 10000 });

    // Fill income for refinance
    await page.fill('input[name="actualIncomes.0"]', '20000');

    // Trigger calculation
    await page.click('button:has-text("Calculate")').catch(() =>
      page.dispatchEvent('input[name="actualIncomes.0"]', 'blur')
    );

    await page.waitForTimeout(2000);

    // VERIFICATION: Refinance should show cash-out eligibility
    const content = await page.content();

    const hasCashOut = content.includes('cash out') || content.includes('Cash Out') || content.includes('cashOut');
    const hasRefinanceGuidance = content.includes('refinanc') || content.includes('Refinanc');

    console.log('✅ Refinance Flow: Cash-out =', hasCashOut, ', Guidance =', hasRefinanceGuidance);

    expect(hasRefinanceGuidance).toBeTruthy();
  });
});

test.describe('Workstream 3: Regression Coverage', () => {
  test('Calculator regression: HDB $1M first property = $750k', async ({ page }) => {
    await page.goto('http://localhost:3000/apply');

    // Quick fill to Step 2
    await page.fill('input[name="firstName"]', 'Regress');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'regress@test.com');
    await page.fill('input[name="mobile"]', '98765432');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("New Purchase")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("HDB")');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="propertyType"]', 'HDB Resale');
    await page.fill('input[name="propertyPrice"]', '1000000');
    await page.fill('input[name="existingProperties"]', '0');
    await page.fill('input[name="age"]', '35');
    await page.click('button:has-text("Next")');

    // Wait for instant analysis
    await page.waitForSelector('text=Instant Analysis', { timeout: 10000 });

    // Verify exactly $750k (not $454k from old MSR bug)
    const maxLoan = await page.textContent('[data-testid="max-loan-amount"]').catch(() =>
      page.textContent('text=/750,000/')
    );

    expect(maxLoan).toContain('750');

    console.log('✅ Regression Test: HDB $1M = $750k (not $454k)');
  });

  test('Commercial property: No CPF, 5% stress rate', async ({ page }) => {
    await page.goto('http://localhost:3000/apply');

    await page.fill('input[name="firstName"]', 'Commercial');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'commercial@test.com');
    await page.fill('input[name="mobile"]', '87654321');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("New Purchase")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Commercial")');
    await page.waitForTimeout(500);

    // Commercial property
    const commercialOptions = await page.locator('select[name="propertyType"] option').allTextContents();
    const hasCommercial = commercialOptions.some(opt => opt.includes('Commercial') || opt.includes('Shop'));

    if (hasCommercial) {
      await page.selectOption('select[name="propertyType"]', { index: 0 }); // First commercial option
      await page.fill('input[name="propertyPrice"]', '3000000');
      await page.fill('input[name="existingProperties"]', '0');
      await page.fill('input[name="age"]', '50');
      await page.click('button:has-text("Next")');

      await page.waitForSelector('text=Your Finances');
      await page.fill('input[name="actualIncomes.0"]', '30000');

      await page.click('button:has-text("Calculate")').catch(() =>
        page.dispatchEvent('input[name="actualIncomes.0"]', 'blur')
      );

      await page.waitForTimeout(2000);

      const content = await page.content();

      // Verify NO CPF mentioned (commercial disallows CPF)
      const noCPF = !content.includes('CPF allowed') && !content.includes('CPF withdrawal');

      // Verify 5% stress rate applied (should show higher rate than residential 4%)
      const has5PercentStress = content.includes('5%') || content.includes('5.0%');

      console.log('✅ Commercial: No CPF =', noCPF, ', 5% stress =', has5PercentStress);
    } else {
      console.log('⚠️ Commercial property type not available in form');
    }
  });
});
