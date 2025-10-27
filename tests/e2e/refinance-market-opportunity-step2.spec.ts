import { test, expect } from '@playwright/test';

test.describe('Refinance Market Opportunity Flow', () => {
  test('should display market opportunity UI in refinance sidebar', async ({ page }) => {
    // Navigate to refinance flow
    await page.goto('/apply?loanType=refinance');

    // Wait for page to load
    await expect(page.locator('text=Who You Are')).toBeVisible();

    // Fill Step 1
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="phone"]', '91234567');

    // Click Continue to Step 2
    await page.click('button:has-text("Continue")');

    // Wait for Step 2 to load
    await expect(page.locator('text=What You Need')).toBeVisible();

    // Fill Step 2 refinance fields
    // Note: Actual field names may vary based on form implementation
    await page.selectOption('[name="propertyType"]', 'Private');
    await page.fill('[name="currentRate"]', '3.0');
    await page.fill('[name="outstandingLoan"]', '400000');
    await page.fill('[name="propertyValue"]', '900000');

    // Wait for sidebar calculations to appear
    await page.waitForTimeout(1000); // Allow calculation to trigger

    // Verify MarketRateDisplay is visible
    await expect(page.locator('text=Market Snapshot')).toBeVisible();
    await expect(page.locator('text=2-Year Fixed')).toBeVisible();

    // Verify SavingsDisplay is visible
    await expect(page.locator('text=Potential Savings')).toBeVisible();

    // Verify savings amount with ~ prefix
    await expect(page.locator('text=/~\$[0-9,]+/')).toBeVisible();

    // Verify hedging language (could save, potential, estimated)
    const potentialText = await page.locator('text=/potential/i').count();
    const estimatedText = await page.locator('text=/estimated/i').count();
    expect(potentialText + estimatedText).toBeGreaterThan(0);

    // Verify "will save" is NOT present
    const willSaveText = await page.locator('text=/will save/i').count();
    expect(willSaveText).toBe(0);

    // Verify legal disclaimer
    await expect(page.locator('text=/This is not a guarantee/')).toBeVisible();

    // Verify SORA Benchmarks
    await expect(page.locator('text=SORA Benchmarks')).toBeVisible();
  });

  test('should show waiting state when data is incomplete', async ({ page }) => {
    await page.goto('/apply?loanType=refinance');

    // Fill Step 1 only
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="phone"]', '91234567');

    await page.click('button:has-text("Continue")');

    // Should show waiting state in sidebar
    await expect(page.locator('text=Waiting for data')).toBeVisible();
  });
});
