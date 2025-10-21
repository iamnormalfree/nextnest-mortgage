import { test, expect } from '@playwright/test';

test.describe('Property Type Switching Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/apply');
    await page.locator('#full-name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('91234567');
    await page.locator('button:has-text("Next")').click();
    await page.waitForTimeout(500);
  });

  test('Scenario A: Private to HDB resets existingProperties', async ({ page }) => {
    await page.locator('#property-category').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Private")').click();
    await page.waitForTimeout(300);
    
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await page.waitForTimeout(200);
    const checked = await checkbox.isChecked();
    console.log('Private - Checkbox checked:', checked);
    expect(checked).toBe(true);
    
    await page.locator('#property-price').fill('800000');
    await page.locator('#combined-age').fill('35');
    await page.waitForTimeout(500);
    
    await page.locator('#property-category').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("HDB")').click();
    await page.waitForTimeout(500);
    
    const checkboxAfter = page.locator('input[type="checkbox"]').first();
    const exists = await checkboxAfter.count();
    console.log('HDB - Checkbox exists:', exists);
    
    const existingPropertiesAfter = exists > 0 ? (await checkboxAfter.isChecked() ? 1 : 0) : 0;
    console.log('existingProperties after switch to HDB:', existingPropertiesAfter);
    expect(existingPropertiesAfter).toBe(0);
  });

  test('Scenario B: HDB to Private shows unchecked checkbox', async ({ page }) => {
    await page.locator('#property-category').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("HDB")').click();
    await page.waitForTimeout(300);
    
    await page.locator('#property-price').fill('500000');
    await page.locator('#combined-age').fill('30');
    await page.waitForTimeout(500);
    
    await page.locator('#property-category').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Private")').click();
    await page.waitForTimeout(500);
    
    const checkbox = page.locator('input[type="checkbox"]').first();
    const visible = await checkbox.isVisible();
    console.log('Private - Checkbox visible:', visible);
    expect(visible).toBe(true);
    
    const unchecked = !(await checkbox.isChecked());
    console.log('Private - Checkbox unchecked:', unchecked);
    expect(unchecked).toBe(true);
    
    const existingPropertiesAfter = unchecked ? 0 : 1;
    console.log('existingProperties after switch to Private:', existingPropertiesAfter);
    expect(existingPropertiesAfter).toBe(0);
  });
});
