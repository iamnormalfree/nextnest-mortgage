// ABOUTME: Debug test to capture browser console logs during form submission
// ABOUTME: Helps identify why ChatTransitionScreen is not appearing

import { test, expect } from '@playwright/test'

test('Debug chat transition with console logs', async ({ page }) => {
  const consoleLogs: string[] = []
  const consoleErrors: string[] = []

  // Capture all console messages
  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') {
      consoleErrors.push(text)
      console.log(`🔴 Console Error: ${text}`)
    } else {
      consoleLogs.push(text)
      console.log(`💬 Console Log: ${text}`)
    }
  })

  // Navigate to form
  await page.goto('http://localhost:3010/')
  await page.click('text=Start Free Analysis')

  // Select New Purchase
  await page.click('text=New Purchase')

  // Step 1
  await page.fill('input[id="full-name"]', 'John Tan')
  await page.fill('input[id="email"]', 'john.tan@example.com')
  await page.fill('input[id="phone"]', '91234567')
  await page.click('button:has-text("Continue to property details")')

  // Wait for Step 2
  await page.waitForTimeout(1000)

  // Step 2 - Fill property details
  await page.fill('input[placeholder*="500"]', '500000')
  await page.click('button:has-text("Get instant loan estimate")')

  // Wait for Step 3
  await page.waitForTimeout(2000)

  // Step 3 - Fill income
  console.log('\n=== FILLING STEP 3 ===')
  await page.fill('input[placeholder*="5"]', '5000')
  await page.waitForTimeout(500)

  console.log('\n=== CLICKING CONNECT BUTTON ===')
  await page.click('button:has-text("Connect with AI Mortgage Specialist")')

  // Wait to see if transition happens
  await page.waitForTimeout(3000)

  // Check for chat transition
  const chatTransitionVisible = await page.locator('text=Connecting to AI broker').isVisible().catch(() => false)

  console.log('\n=== TEST RESULTS ===')
  console.log(`Chat Transition Visible: ${chatTransitionVisible}`)
  console.log(`\nConsole Logs (${consoleLogs.length}):`)
  consoleLogs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`))
  console.log(`\nConsole Errors (${consoleErrors.length}):`)
  consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`))

  // Look for our debug logs
  const validationPassedLogs = consoleLogs.filter(log => log.includes('Form validation passed'))
  const validationFailedLogs = consoleErrors.filter(log => log.includes('Form validation failed'))

  console.log(`\n=== VALIDATION STATUS ===`)
  console.log(`Validation Passed Logs: ${validationPassedLogs.length}`)
  console.log(`Validation Failed Logs: ${validationFailedLogs.length}`)

  if (validationFailedLogs.length > 0) {
    console.log('\n❌ Form validation is FAILING')
    console.log('Failed logs:', validationFailedLogs)
  } else if (validationPassedLogs.length > 0) {
    console.log('\n✅ Form validation is PASSING')
    console.log('But chat transition still not appearing - different issue!')
  } else {
    console.log('\n⚠️ No validation logs found - handler not being called')
  }
})
