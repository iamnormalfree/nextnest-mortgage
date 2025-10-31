/**
 * Manual visual verification script for mobile form styling
 * Run with: node scripts/visual-test-mobile-form.js
 */

const { chromium } = require('@playwright/test');

async function captureScreenshots() {
  console.log('Starting visual verification...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to apply page
    console.log('Navigating to /apply...');
    await page.goto('http://localhost:3000/apply', { waitUntil: 'networkidle' });
    
    // Step 1: Click New Purchase
    console.log('Selecting New Purchase...');
    const newPurchaseBtn = page.getByRole('button', { name: /new purchase/i });
    await newPurchaseBtn.waitFor({ state: 'visible', timeout: 10000 });
    await newPurchaseBtn.click();
    await page.waitForTimeout(1000);
    
    // Step 2: Fill property details
    console.log('Filling property details...');
    await page.waitForSelector('[role=combobox]', { timeout: 5000 });
    
    const dropdown = page.locator('[role=combobox]').first();
    await dropdown.click();
    await page.waitForTimeout(500);
    
    const privateOption = page.getByRole('option', { name: /private/i }).first();
    await privateOption.click();
    await page.waitForTimeout(500);
    
    const priceInput = page.locator('input[name=priceRange]');
    await priceInput.fill('800000');
    await page.waitForTimeout(300);
    
    const downpaymentInput = page.locator('input[name=actualDownPayment]');
    await downpaymentInput.fill('160000');
    await page.waitForTimeout(300);
    
    const nextBtn = page.getByRole('button', { name: /next/i });
    await nextBtn.click();
    await page.waitForTimeout(2000);
    
    // Step 3: Verify we reached Step 3
    console.log('Checking for Step 3...');
    const primaryApplicantHeader = page.getByText(/primary applicant/i);
    await primaryApplicantHeader.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log('DESKTOP VIEW');
    await page.screenshot({ 
      path: 'test-results/mobile-form-verification/desktop-step3-full.png',
      fullPage: true 
    });
    console.log('Captured: desktop-step3-full.png');
    
    // Get color information
    const headerBg = await page.evaluate(() => {
      const el = document.querySelector('.bg-[#FEF3C7]');
      return el ? window.getComputedStyle(el).backgroundColor : 'not found';
    });
    console.log('Header Background: ' + headerBg);
    
    // Fill the form
    console.log('Filling income details...');
    const employmentDropdown = page.locator('[role=combobox]').first();
    await employmentDropdown.click();
    await page.waitForTimeout(500);
    const employedOption = page.getByRole('option', { name: /employed/i }).first();
    await employedOption.click();
    await page.waitForTimeout(500);
    
    const incomeInput = page.locator('input#monthly-income-primary');
    await incomeInput.fill('8000');
    await page.waitForTimeout(300);
    
    const ageInput = page.locator('input#age-primary');
    await ageInput.fill('35');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/mobile-form-verification/desktop-filled.png',
      fullPage: true 
    });
    console.log('Captured: desktop-filled.png');
    
    // Mobile viewport
    console.log('MOBILE VIEW (390x844)');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/mobile-form-verification/mobile-390-step3.png',
      fullPage: true 
    });
    console.log('Captured: mobile-390-step3.png');
    
    console.log('VERIFICATION COMPLETE');
    console.log('Screenshots saved to: test-results/mobile-form-verification/');
    
    // Keep browser open
    console.log('Browser will stay open for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-results/mobile-form-verification/error.png' });
  } finally {
    await browser.close();
  }
}

captureScreenshots();
