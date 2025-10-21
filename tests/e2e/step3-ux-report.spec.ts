// ABOUTME: Comprehensive E2E UX testing for Step 3 New Purchase flow

import { test, Page, expect } from '@playwright/test';

interface UXIssue {
  issue: string;
  location: string;
  userImpact: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

const uxIssues: UXIssue[] = [];

function reportIssue(issue: UXIssue) {
  uxIssues.push(issue);
}

async function navigateToStep3(page: Page) {
  await page.goto('/apply?loanType=new_purchase');
  await page.waitForLoadState('networkidle');
  
  const nameInput = page.locator('input#full-name');
  await nameInput.fill('Test User');
  await nameInput.blur();

  const emailInput = page.locator('input#email');
  await emailInput.fill('test@example.com');
  await emailInput.blur();

  const phoneInput = page.locator('input#phone');
  await phoneInput.fill('91234567');
  await phoneInput.blur();

  const stepOneCta = page.locator('button:has-text("Continue to property details")');
  await expect(stepOneCta).toBeEnabled({ timeout: 5000 });
  await stepOneCta.click();
  await page.waitForTimeout(1000);
  
  const priceInput = page.locator('input[name="priceRange"]');
  await priceInput.fill('1000000');
  await priceInput.blur();

  const ageInput = page.locator('input#combined-age');
  await ageInput.fill('35');
  await ageInput.blur();

  const stepTwoCta = page.locator('button:has-text("Get instant loan estimate")');
  await expect(stepTwoCta).toBeEnabled({ timeout: 5000 });
  await stepTwoCta.click();
  await page.waitForTimeout(1000);
}

test.describe('Step 3 New Purchase - Complete UX Audit', () => {
  test.afterAll(async () => {
    console.log('\n\n=================================');
    console.log('STEP 3 NEW PURCHASE UX AUDIT REPORT');
    console.log('=================================\n');
    console.log(`Total Issues Found: ${uxIssues.length}\n`);
    
    const groups = {
      'Critical': uxIssues.filter(i => i.severity === 'Critical'),
      'High': uxIssues.filter(i => i.severity === 'High'),
      'Medium': uxIssues.filter(i => i.severity === 'Medium'),
      'Low': uxIssues.filter(i => i.severity === 'Low'),
    };
    
    Object.entries(groups).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`\n## ${severity} Priority (${issues.length} issues)\n`);
        issues.forEach((issue, idx) => {
          console.log(`${idx + 1}. ${issue.issue}`);
          console.log(`   Location: ${issue.location}`);
          console.log(`   Impact: ${issue.userImpact}\n`);
        });
      }
    });
  });

  test('Income field - negative numbers', async ({ page }) => {
    await navigateToStep3(page);
    
    const income = page.locator('input#monthly-income-primary');
    await income.fill('-5000');
    const val = await income.inputValue();
    
    if (val.includes('-')) {
      reportIssue({
        issue: 'Monthly income accepts negative values',
        location: 'Step 3 > Income Details > Monthly income',
        userImpact: 'Users can enter invalid negative income',
        severity: 'High'
      });
    }
  });

  test('Age field - unrealistic values', async ({ page }) => {
    await navigateToStep3(page);
    
    const age = page.locator('input#age-primary');
    await age.fill('150');
    const val = await age.inputValue();
    
    if (parseInt(val) > 120) {
      reportIssue({
        issue: 'Age field accepts unrealistic values',
        location: 'Step 3 > Income Details > Your Age',
        userImpact: 'No validation for impossible ages',
        severity: 'Medium'
      });
    }
  });

  test('Liabilities gate question visibility', async ({ page }) => {
    await navigateToStep3(page);
    
    const gate = page.locator('text=/Do you have any existing loans/i');
    const visible = await gate.isVisible().catch(() => false);
    
    if (!visible) {
      reportIssue({
        issue: 'Liabilities gate question not visible',
        location: 'Step 3 > Financial Commitments',
        userImpact: 'Cannot indicate existing loans',
        severity: 'Critical'
      });
    }
  });

  test('MAS Readiness Check visibility', async ({ page }) => {
    await navigateToStep3(page);
    
    const mas = page.locator('text=MAS Readiness Check');
    const visible = await mas.isVisible().catch(() => false);
    
    if (!visible) {
      reportIssue({
        issue: 'MAS Readiness Check not visible',
        location: 'Step 3 bottom section',
        userImpact: 'Cannot see eligibility status',
        severity: 'Critical'
      });
    }
  });
});
