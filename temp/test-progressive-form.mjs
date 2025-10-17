// ABOUTME: Playwright test script for progressive form flow testing
// ABOUTME: Tests form progression, instant calculations, and visual appearance

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testProgressiveForm() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const screenshotDir = join(__dirname, 'playwright-screenshots');

  const findings = {
    instantCalcAutomatic: false,
    incomeFieldsHaveCommas: false,
    step3VisualWeight: '',
    mobileResponsiveness: [],
    observations: []
  };

  try {
    console.log('1. Navigating to /apply page...');
    await page.goto('http://localhost:3007/apply');
    await page.waitForLoadState('networkidle');

    // Step 1: Capture initial state
    console.log('2. Capturing initial state...');
    await page.screenshot({
      path: join(screenshotDir, '01-initial-state.png'),
      fullPage: true
    });
    findings.observations.push('Initial page loaded successfully');

    // Step 2: Fill out Step 1
    console.log('3. Filling Step 1 form...');

    // Wait for name field and fill it
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    await page.fill('input[name="name"]', 'Test User');

    // Fill email
    await page.fill('input[name="email"]', 'test@test.com');

    // Fill phone
    await page.fill('input[name="phone"]', '91234567');

    await page.screenshot({
      path: join(screenshotDir, '02-step1-filled.png'),
      fullPage: true
    });

    // Step 3: Navigate to Step 2
    console.log('4. Navigating to Step 2...');
    // Button text: "Continue to property details"
    const nextButton = page.locator('button:has-text("Continue to property details")').first();
    await nextButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: join(screenshotDir, '03-step2-initial.png'),
      fullPage: true
    });

    // Step 4: Fill Step 2 fields (they appear to be pre-filled based on query params)
    console.log('5. Step 2 fields appear pre-filled, waiting for instant calc...');

    // Wait for instant calculation to appear
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: join(screenshotDir, '04-step2-filled.png'),
      fullPage: true
    });

    // Step 5: Check for instant calc
    console.log('6. Checking for instant calculation...');
    const loanAmountVisible = await page.locator('text=/\\$[0-9,]+/').isVisible().catch(() => false);
    const qualifyTextVisible = await page.locator('text=/qualify|borrow/i').isVisible().catch(() => false);
    findings.instantCalcAutomatic = loanAmountVisible && qualifyTextVisible;
    findings.observations.push(`Instant calc visible: ${findings.instantCalcAutomatic}`);

    // Capture the instant calc amount
    if (findings.instantCalcAutomatic) {
      const amountText = await page.locator('text=/\\$[0-9,]+/').first().textContent();
      findings.observations.push(`Instant calc amount shown: ${amountText}`);

      await page.screenshot({
        path: join(screenshotDir, '05-instant-calc-result.png'),
        fullPage: true
      });
    }

    // Step 6: Navigate to Step 3
    console.log('7. Navigating to Step 3...');
    // Look for "Get instant loan estimate" button
    const step2NextButton = page.locator('button:has-text("Get instant loan estimate")').first();
    await step2NextButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(screenshotDir, '06-step3-initial.png'),
      fullPage: true
    });

    // Step 7: Analyze Step 3 visual weight
    console.log('8. Analyzing Step 3 visual appearance...');

    // Check for income fields
    const incomeFields = await page.locator('input').filter(async (input) => {
      const label = await input.getAttribute('aria-label') || '';
      const placeholder = await input.getAttribute('placeholder') || '';
      return label.toLowerCase().includes('income') ||
             placeholder.toLowerCase().includes('income') ||
             label.toLowerCase().includes('salary');
    }).count();

    findings.observations.push(`Found ${incomeFields} income-related fields`);

    // Get page dimensions and check density
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const visibleHeight = 720; // viewport height
    const density = incomeFields / (pageHeight / visibleHeight);

    if (density < 0.5) {
      findings.step3VisualWeight = 'Light - Low field density, good whitespace';
    } else if (density < 1) {
      findings.step3VisualWeight = 'Medium - Balanced field density';
    } else {
      findings.step3VisualWeight = 'Heavy - High field density, crowded';
    }

    // Step 8: Test income field input and formatting
    console.log('9. Testing income field input...');

    // Find income field - it should be a text or number input
    const incomeField = page.locator('input[type="text"]').or(page.locator('input[type="number"]')).first();

    await incomeField.fill('5000');
    await page.waitForTimeout(1000); // Wait for any formatting

    const incomeValue = await incomeField.inputValue();
    findings.incomeFieldsHaveCommas = incomeValue.includes(',');
    findings.observations.push(`Income field value after typing "5000": "${incomeValue}"`);

    await page.screenshot({
      path: join(screenshotDir, '07-step3-income-filled.png'),
      fullPage: true
    });

    // Step 9: Test mobile responsiveness
    console.log('10. Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(500);

    await page.screenshot({
      path: join(screenshotDir, '08-mobile-step3.png'),
      fullPage: true
    });

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );

    if (hasHorizontalScroll) {
      findings.mobileResponsiveness.push('⚠️ Horizontal scroll detected on mobile');
    } else {
      findings.mobileResponsiveness.push('✓ No horizontal scroll on mobile');
    }

    // Check if buttons are accessible
    const buttonsVisible = await page.locator('button').first().isVisible();
    if (buttonsVisible) {
      findings.mobileResponsiveness.push('✓ Buttons visible on mobile');
    } else {
      findings.mobileResponsiveness.push('⚠️ Buttons not visible on mobile');
    }

    console.log('\n=== TEST FINDINGS ===\n');
    console.log('Does instant calc show automatically on Step 2?', findings.instantCalcAutomatic ? 'YES' : 'NO');
    console.log('Do income fields have commas?', findings.incomeFieldsHaveCommas ? 'YES' : 'NO');
    console.log('Step 3 visual weight:', findings.step3VisualWeight);
    console.log('\nMobile Responsiveness:');
    findings.mobileResponsiveness.forEach(item => console.log('  -', item));
    console.log('\nObservations:');
    findings.observations.forEach(item => console.log('  -', item));
    console.log('\n=== Screenshots saved to temp/playwright-screenshots ===\n');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({
      path: join(screenshotDir, '99-error-state.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }

  return findings;
}

testProgressiveForm().catch(console.error);
