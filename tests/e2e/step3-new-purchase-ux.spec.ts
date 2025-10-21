// ABOUTME: E2E test for Step 3 New Purchase UX - identifies all UX issues

import { test, expect, Page } from '@playwright/test';

interface UXIssue {
  issue: string;
  location: string;
  userImpact: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

const uxIssues: UXIssue[] = [];

function reportIssue(issue: UXIssue) {
  uxIssues.push(issue);
  console.log(`[${issue.severity}] ${issue.issue}`);
  console.log(`Location: ${issue.location}`);
  console.log(`Impact: ${issue.userImpact}
`);
}

test.describe('Step 3 New Purchase UX Testing', () => {
  test.beforeEach(async ({ page }) => {
    uxIssues.length = 0;
    await page.goto('/apply?loanType=new_purchase');
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    console.log(`
========== UX ISSUES REPORT ==========
`);
    console.log(`Total Issues Found: ${uxIssues.length}
`);
    
    const categories = ['Critical', 'High', 'Medium', 'Low'];
    categories.forEach(severity => {
      const issues = uxIssues.filter(i => i.severity === severity);
      if (issues.length > 0) {
        console.log(`## ${severity} Priority Issues (${issues.length})
`);
        issues.forEach((issue, idx) => {
          console.log(`${idx + 1}. **${issue.issue}**`);
          console.log(`   - Location: ${issue.location}`);
          console.log(`   - Impact: ${issue.userImpact}
`);
        });
      }
    });
  });

  test('Income fields validation', async ({ page }) => {
    // Step 1
    const nameInput = page.locator('input#full-name');
    await nameInput.fill('John Doe');
    await nameInput.blur();

    const emailInput = page.locator('input#email');
    await emailInput.fill('john@example.com');
    await emailInput.blur();

    const phoneInput = page.locator('input#phone');
    await phoneInput.fill('91234567');
    await phoneInput.blur();

    const stepOneCta = page.locator('button:has-text("Continue to property details")');
    await expect(stepOneCta).toBeEnabled({ timeout: 5000 });
    await stepOneCta.click();
    await page.waitForTimeout(1000);
    
    // Step 2
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
    
    // Step 3 - Income testing
    const incomeInput = page.locator('input#monthly-income-primary');
    await incomeInput.waitFor({ state: 'visible', timeout: 5000 });
    
    await incomeInput.fill('-5000');
    const negValue = await incomeInput.inputValue();
    
    if (negValue.includes('-')) {
      reportIssue({
        issue: 'Income field accepts negative numbers',
        location: 'Monthly income input',
        userImpact: 'Invalid negative income values allowed',
        severity: 'High'
      });
    }
  });
});
