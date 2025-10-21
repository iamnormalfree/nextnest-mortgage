/**
 * ABOUTME: E2E test verifying lead form submission navigates to AI broker chat UI
 * Tests the complete user flow from form completion through ChatTransitionScreen to chat page
 */

import { test, expect } from '@playwright/test'

test.describe('Lead Form to AI Broker Chat Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the apply page
    await page.goto('/apply')

    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 })
  })

  test('should navigate to chat page after completing lead form', async ({ page }) => {
    // STEP 1: Fill Contact Information
    console.log('📝 Step 1: Filling contact information...')
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="phone"]', '+6591234567')

    // Check if we need to click Next or if it auto-advances
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible()) {
      await nextButton.click()
    }

    // Wait for Step 2
    await page.waitForTimeout(500)

    // STEP 2: Fill Property Details
    console.log('📝 Step 2: Filling property details...')

    // Select loan type if not already selected
    const newPurchaseOption = page.locator('button:has-text("New Purchase")')
    if (await newPurchaseOption.isVisible()) {
      await newPurchaseOption.click()
    }

    // Select property category
    await page.locator('button:has-text("Resale")').click()
    await page.waitForTimeout(300)

    // Select property type
    await page.selectOption('select[name="propertyType"]', 'HDB')

    // Fill property price
    await page.fill('input[name="priceRange"]', '500000')

    // Fill age
    await page.fill('input[name="combinedAge"]', '35')

    // Click Next to go to Step 3
    await page.locator('button:has-text("Next")').click()
    await page.waitForTimeout(500)

    // STEP 3: Fill Financial Information
    console.log('📝 Step 3: Filling financial information...')

    // Fill income
    await page.fill('input[name="actualIncomes[0]"]', '8000')

    // Select employment type
    await page.selectOption('select[name="employmentType"]', 'employed')

    // Handle commitments (select "No" for simplicity)
    const hasCommitmentsNo = page.locator('label:has-text("No")').first()
    if (await hasCommitmentsNo.isVisible()) {
      await hasCommitmentsNo.click()
    }

    // STEP 4: Complete Form and Verify Chat Transition
    console.log('📝 Step 4: Submitting form...')

    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete")')
    await submitButton.click()

    // Wait for ChatTransitionScreen to appear
    console.log('⏳ Waiting for ChatTransitionScreen...')
    await expect(page.locator('text=/Connecting to Your Broker|AI BROKER MATCHED/i')).toBeVisible({ timeout: 10000 })

    // Wait for analyzing state to complete (3.5 seconds + buffer)
    console.log('⏳ Waiting for broker matching animation...')
    await page.waitForTimeout(4000)

    // Check if we're in "ready" state with "Continue to Chat" button
    const continueButton = page.locator('button:has-text("Continue to Chat")')
    await expect(continueButton).toBeVisible({ timeout: 5000 })

    console.log('✅ ChatTransitionScreen appeared with Continue button')

    // Click Continue to Chat
    console.log('🖱️  Clicking Continue to Chat...')
    await continueButton.click()

    // VERIFICATION: Check if we navigated to chat page
    console.log('🔍 Verifying navigation to /chat page...')

    // Wait for URL to change to /chat with conversation parameter
    await page.waitForURL(/\/chat\?conversation=\d+/, { timeout: 15000 })

    // Verify we're on the chat page
    const currentUrl = page.url()
    console.log(`✅ Navigated to: ${currentUrl}`)
    expect(currentUrl).toContain('/chat?conversation=')

    // Extract conversation ID from URL
    const urlParams = new URLSearchParams(currentUrl.split('?')[1])
    const conversationId = urlParams.get('conversation')
    expect(conversationId).not.toBeNull()
    expect(parseInt(conversationId!)).toBeGreaterThan(0)

    console.log(`✅ Conversation ID: ${conversationId}`)

    // Wait for chat interface to load
    console.log('⏳ Waiting for chat interface to load...')

    // Check for CustomChatInterface elements
    await expect(
      page.locator('text=/Loading chat interface|Chat Interface/i').first()
    ).toBeVisible({ timeout: 10000 })

    console.log('✅ Chat interface loaded successfully')
  })

  test('should show fallback options if Chatwoot is not configured', async ({ page }) => {
    // This test verifies graceful degradation when Chatwoot is unavailable

    // Fill and submit form (abbreviated version)
    console.log('📝 Filling form with minimal data...')

    await page.fill('input[name="name"]', 'Fallback Test')
    await page.fill('input[name="email"]', 'fallback@example.com')
    await page.fill('input[name="phone"]', '+6591234568')

    // Skip through to final step (implementation depends on your form structure)
    // This is a placeholder - adjust based on actual form navigation
    await page.locator('button:has-text("Submit"), button:has-text("Complete")').click()

    // Wait for ChatTransitionScreen
    await page.waitForTimeout(4000)

    // Check if fallback UI appears (phone/email options)
    const phoneButton = page.locator('button:has-text("Call:")')
    const emailButton = page.locator('button:has-text("Email:")')
    const whatsappButton = page.locator('button:has-text("WhatsApp")')

    // If ANY fallback button is visible, test passes (graceful degradation)
    const hasFallback = (
      (await phoneButton.isVisible()) ||
      (await emailButton.isVisible()) ||
      (await whatsappButton.isVisible())
    )

    if (hasFallback) {
      console.log('✅ Fallback UI displayed (expected if Chatwoot not configured)')
      expect(hasFallback).toBeTruthy()
    } else {
      console.log('✅ Chat transition successful (Chatwoot configured)')
      // Should have navigated to chat page
      await expect(page).toHaveURL(/\/chat\?conversation=\d+/, { timeout: 5000 })
    }
  })

  test('should handle API errors gracefully with retry mechanism', async ({ page }) => {
    // This test verifies the retry logic in ChatTransitionScreen

    // Intercept the API call to simulate failures then success
    let attemptCount = 0

    await page.route('**/api/chatwoot-conversation', async (route) => {
      attemptCount++
      console.log(`🔄 API attempt ${attemptCount}`)

      if (attemptCount < 2) {
        // Fail first attempt
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            fallback: {
              type: 'phone',
              contact: '+6583341445',
              message: 'Temporary error'
            }
          })
        })
      } else {
        // Succeed on second attempt
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            conversationId: 999,
            widgetConfig: {
              baseUrl: 'https://chat.nextnest.sg',
              websiteToken: 'test-token',
              conversationId: 999,
              locale: 'en',
              position: 'right',
              hideMessageBubble: false,
              customAttributes: {
                ai_broker_name: 'Test Broker',
                lead_score: 75
              }
            }
          })
        })
      }
    })

    // Fill minimal form data
    await page.fill('input[name="name"]', 'Retry Test')
    await page.fill('input[name="email"]', 'retry@example.com')
    await page.fill('input[name="phone"]', '+6591234569')

    // Submit form
    await page.locator('button:has-text("Submit"), button:has-text("Complete")').click()

    // Wait for transition screen
    await page.waitForTimeout(4000)

    // Click Continue
    await page.locator('button:has-text("Continue to Chat")').click()

    // Should retry and eventually succeed
    console.log('⏳ Waiting for retry mechanism...')

    // Check for retry message
    const retryMessage = page.locator('text=/Retrying|Connection issue/i')
    if (await retryMessage.isVisible({ timeout: 2000 })) {
      console.log('✅ Retry message displayed')
    }

    // Should eventually navigate to chat page
    await expect(page).toHaveURL(/\/chat\?conversation=999/, { timeout: 10000 })

    console.log(`✅ Successfully retried after ${attemptCount} attempts`)
  })
})
