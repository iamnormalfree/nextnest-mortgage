#!/usr/bin/env tsx

/**
 * Create Real Chatwoot Conversation for SLA Testing
 *
 * Uses Playwright to fill out the form and get a real conversation ID
 * Then uses that ID for end-to-end SLA profiling
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function createRealConversation() {
  console.log('🎯 Creating Real Chatwoot Conversation for SLA Testing');
  console.log('   Timestamp:', new Date().toISOString());

  const browser = await chromium.launch({ headless: false }); // Use headed for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n📱 Step 1: Navigating to application...');

    // Navigate to the local application
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    console.log('✅ Page loaded successfully');

    // Look for the main CTA button
    console.log('\n📱 Step 2: Finding Get Started button...');

    const getStartedSelectors = [
      'button:has-text("Get Started")',
      'a:has-text("Get Started")',
      '[data-testid*="get-started"]',
      'button:has-text("Start")',
    ];

    let getStartedButton = null;
    for (const selector of getStartedSelectors) {
      try {
        getStartedButton = await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`   ✅ Found button with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!getStartedButton) {
      console.log('   ⚠️ Could not find Get Started button. Taking screenshot...');
      await page.screenshot({ path: 'debug-get-started.png', fullPage: true });
      throw new Error('Could not find Get Started button');
    }

    console.log('\n📱 Step 3: Clicking Get Started...');
    await getStartedButton.click();
    await page.waitForTimeout(2000);

    console.log('✅ Get Started clicked');

    // Look for loan type selection
    console.log('\n📱 Step 4: Selecting loan type...');

    const newPurchaseSelectors = [
      'button:has-text("New Purchase")',
      'input[value="new_purchase"]',
      '[data-testid*="new-purchase"]',
    ];

    let newPurchaseButton = null;
    for (const selector of newPurchaseSelectors) {
      try {
        newPurchaseButton = await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`   ✅ Found New Purchase option with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!newPurchaseButton) {
      console.log('   ⚠️ Could not find New Purchase option. Taking screenshot...');
      await page.screenshot({ path: 'debug-loan-type.png', fullPage: true });
      throw new Error('Could not find New Purchase option');
    }

    await newPurchaseButton.click();
    await page.waitForTimeout(2000);

    console.log('✅ New Purchase selected');

    // Wait for form to load and then fill it out
    console.log('\n📱 Step 5: Filling out form...');

    // Wait for form elements to be ready
    await page.waitForTimeout(3000);

    // Fill in basic form fields
    try {
      // Name
      await page.fill('input[name="name"]', 'John Doe');

      // Email
      await page.fill('input[name="email"]', 'john.doe.test@example.com');

      // Phone
      await page.fill('input[name="phone"]', '+65 9123 4567');

      // Annual income
      await page.fill('input[name="annualIncome"]', '120000');

      // Property value
      await page.fill('input[name="propertyValue"]', '800000');

      console.log('   ✅ Basic form fields filled');
    } catch (error) {
      console.log('   ⚠️ Could not fill all form fields. Continuing...');
    }

    // Look for submit button
    console.log('\n📱 Step 6: Looking for submit button...');

    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Continue")',
      'button[type="submit"]',
      '[data-testid*="submit"]',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`   ✅ Found submit button with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!submitButton) {
      console.log('   ⚠️ Could not find submit button. Taking screenshot...');
      await page.screenshot({ path: 'debug-submit.png', fullPage: true });
      throw new Error('Could not find submit button');
    }

    await submitButton.click();
    await page.waitForTimeout(5000);

    console.log('✅ Form submitted, waiting for redirect...');

    // Wait for redirect to chat page
    console.log('\n📱 Step 7: Waiting for chat page...');

    try {
      await page.waitForURL(/.*\/chat.*/i, { timeout: 15000 });
      console.log('✅ Redirected to chat page!');
    } catch (error) {
      console.log('   ⚠️ No redirect to chat page. Taking screenshot...');
      await page.screenshot({ path: 'debug-after-submit.png', fullPage: true });
      throw new Error('Form submission did not redirect to chat');
    }

    // Wait for chat to load
    await page.waitForTimeout(5000);

    console.log('\n📱 Step 8: Checking for conversation ID...');

    // Try to extract conversation ID from URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Look for conversation ID in URL
    const urlMatch = currentUrl.match(/[?&]conversation_id=(\d+)/);
    let conversationId = null;

    if (urlMatch) {
      conversationId = parseInt(urlMatch[1]);
      console.log(`   ✅ Found conversation ID in URL: ${conversationId}`);
    } else {
      // Try to find conversation ID in page content
      const pageContent = await page.content();
      const idMatch = pageContent.match(/conversation[_\s-]?id[:\s]+(\d+)/i);

      if (idMatch) {
        conversationId = parseInt(idMatch[1]);
        console.log(`   ✅ Found conversation ID in page content: ${conversationId}`);
      } else {
        console.log('   ⚠️ Could not find conversation ID. Taking screenshot...');
        await page.screenshot({ path: 'debug-chat.png', fullPage: true });

        // Try to extract from localStorage or cookies
        try {
          const localStorage = await page.evaluate(() => {
            return {
              conversationId: localStorage.getItem('conversationId'),
              sessionData: localStorage.getItem('sessionData'),
            };
          });

          if (localStorage.conversationId) {
            conversationId = parseInt(localStorage.conversationId);
            console.log(`   ✅ Found conversation ID in localStorage: ${conversationId}`);
          }
        } catch (e) {
          console.log('   ⚠️ Could not extract conversation ID from localStorage');
        }
      }
    }

    if (!conversationId) {
      throw new Error('Could not extract conversation ID');
    }

    console.log('\n✅ SUCCESS: Real conversation created!');
    console.log(`   Conversation ID: ${conversationId}`);
    console.log(`   Page URL: ${currentUrl}`);

    // Keep the browser open for potential use
    console.log('\n🎯 Next: Use this conversation ID for SLA profiling');
    console.log('   Worker should process messages to this conversation ID');

    // Close browser after a short delay
    await page.waitForTimeout(2000);
    await context.close();
    await browser.close();

    return conversationId;

  } catch (error) {
    console.error('❌ Error creating conversation:', error);

    // Take screenshot for debugging
    try {
      await page.screenshot({ path: 'error-conversation-creation.png', fullPage: true });
      console.log('   📸 Screenshot saved: error-conversation-creation.png');
    } catch (screenshotError) {
      console.log('   ⚠️ Could not save screenshot');
    }

    await context.close();
    await browser.close();
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Real Chatwoot Conversation Creation');

    const conversationId = await createRealConversation();

    console.log('\n🎯 RESULT:');
    console.log(`   Real Chatwoot Conversation ID: ${conversationId}`);
    console.log('   Ready for end-to-end SLA profiling');
    console.log('\nNext step: Run SLA profiling with this conversation ID');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed to create conversation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}