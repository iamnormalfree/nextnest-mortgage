import { test, expect, Page } from '@playwright/test';

interface UXIssue {
  issue: string;
  location: string;
  userImpact: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  reproductionSteps: string[];
}

const issues: UXIssue[] = [];

function reportIssue(issue: UXIssue) {
  issues.push(issue);
  console.log(`
[${issue.severity}] ${issue.issue}`);
}

test.describe('Step 2: Property Details UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apply');
    await page.locator('#full-name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('91234567');
    await page.locator('button:has-text("Next")').click();
    await page.waitForTimeout(500);
  });

  test('Property price input - comma formatting', async ({ page }) => {
    const input = page.locator('#property-price');
    await input.fill('1234567');
    await page.waitForTimeout(200);
    const value = await input.inputValue();
    
    if (!value.includes(',')) {
      reportIssue({
        issue: 'No comma formatting',
        location: '#property-price',
        userImpact: 'Hard to read large numbers',
        severity: 'Medium',
        reproductionSteps: ['Type 1234567', 'No commas']
      });
    } else {
      console.log('✓ Comma formatting works:', value);
    }
  });

  test('Age input - decimal validation', async ({ page }) => {
    const input = page.locator('#combined-age');
    await input.fill('35.5');
    await page.waitForTimeout(100);
    const value = await input.inputValue();
    
    if (value.includes('.')) {
      reportIssue({
        issue: 'Accepts decimal ages',
        location: '#combined-age',
        userImpact: 'Invalid values possible',
        severity: 'Medium',
        reproductionSteps: ['Type 35.5', 'Decimal accepted']
      });
    }
  });

  test('Property category dropdown', async ({ page }) => {
    const select = page.locator('#property-category');
    await expect(select).toBeVisible();
    await select.click();
    await page.waitForTimeout(300);
    
    const options = page.locator('[role="option"]');
    const count = await options.count();
    
    if (count === 0) {
      reportIssue({
        issue: 'No dropdown options',
        location: '#property-category',
        userImpact: 'Cannot select category',
        severity: 'Critical',
        reproductionSteps: ['Click dropdown', 'No options']
      });
    } else {
      console.log(`✓ Found ${count} options`);
    }
  });

  test('Instant analysis appears', async ({ page }) => {
    await page.locator('#property-category').click();
    await page.waitForTimeout(200);
    const opts = page.locator('[role="option"]');
    if (await opts.count() > 0) await opts.first().click();
    
    await page.locator('#property-price').fill('800000');
    await page.locator('#combined-age').fill('35');
    await page.waitForTimeout(2000);
    
    const result = page.locator('text=You qualify for up to');
    const visible = await result.isVisible().catch(() => false);
    
    if (!visible) {
      reportIssue({
        issue: 'No instant analysis',
        location: 'Calculation section',
        userImpact: 'No loan feedback',
        severity: 'High',
        reproductionSteps: ['Fill fields', 'No analysis']
      });
    } else {
      console.log('✓ Instant analysis shown');
    }
  });

  test('LTV toggle buttons', async ({ page }) => {
    await page.locator('#property-category').click();
    await page.waitForTimeout(200);
    const opts = page.locator('[role="option"]');
    if (await opts.count() > 0) await opts.first().click();
    
    await page.locator('#property-price').fill('800000');
    await page.locator('#combined-age').fill('35');
    await page.waitForTimeout(2000);
    
    const ltv75 = page.locator('button:has-text("75%")');
    const ltv55 = page.locator('button:has-text("55%")');
    
    const has75 = await ltv75.isVisible().catch(() => false);
    const has55 = await ltv55.isVisible().catch(() => false);
    
    if (!has75 || !has55) {
      reportIssue({
        issue: 'LTV buttons missing',
        location: 'LTV toggle',
        userImpact: 'Cannot explore LTV',
        severity: 'Medium',
        reproductionSteps: ['Fill fields', 'No LTV buttons']
      });
    } else {
      console.log('✓ LTV toggle found');
    }
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2 UX REPORT');
    console.log('='.repeat(60));

    if (issues.length === 0) {
      console.log('\n✅ NO ISSUES FOUND\n');
    } else {
      console.log(`\nTotal: ${issues.length}\n`);
      
      const bySev = {
        Critical: issues.filter(i => i.severity === 'Critical'),
        High: issues.filter(i => i.severity === 'High'),
        Medium: issues.filter(i => i.severity === 'Medium'),
        Low: issues.filter(i => i.severity === 'Low'),
      };
      
      ['Critical', 'High', 'Medium', 'Low'].forEach(sev => {
        if (bySev[sev].length > 0) {
          console.log(`
${sev}: ${bySev[sev].length}`);
          bySev[sev].forEach((iss, i) => {
            console.log(`  ${i + 1}. ${iss.issue} (${iss.location})`);
            console.log(`     Impact: ${iss.userImpact}`);
          });
        }
      });
    }
    console.log('\n' + '='.repeat(60));
  });
});
