const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening production apply page directly...');
  await page.goto('https://nextnest.sg/apply?loanType=new_purchase');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'prod-apply-page.png', fullPage: true });

  console.log('✅ Screenshot saved to prod-apply-page.png');
  console.log('Check if the page loads correctly');

  await page.waitForTimeout(10000); // Keep browser open for 10 seconds
  await browser.close();
})();
