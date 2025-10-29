/**
 * ABOUTME: End-to-end test for collapsible employment sections in Step3Refinance
 */

import { test, expect, Page } from '@playwright/test'

async function navigateToStep3(page: Page) {
  await page.goto('http://localhost:3000/apply?loanType=refinance')
  await page.waitForLoadState('networkidle')
  
  const currentStep = await page.textContent('h3')
  
  if (currentStep?.includes('Step 2')) {
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
  }
  
  await expect(page.locator('h3')).toContainText('Step 3')
}

test.describe('Collapsible Employment Sections', () => {
  test('Scenario 1: Initial State', async ({ page }) => {
    await navigateToStep3(page)
    await page.screenshot({ path: 'test-results/01-initial.png', fullPage: true })
    
    const primarySection = page.locator('text=Primary').first()
    await expect(primarySection).toBeVisible()
    console.log('Scenario 1 PASSED')
  })

  test('Scenario 2: Incomplete State', async ({ page }) => {
    await navigateToStep3(page)
    
    const doneButton = page.locator('button:has-text("Done")').first()
    if (await doneButton.isVisible()) {
      await doneButton.click()
      await page.waitForTimeout(500)
    }
    
    await page.screenshot({ path: 'test-results/02-incomplete.png', fullPage: true })
    console.log('Scenario 2 PASSED')
  })

  test('Scenario 3: Complete State', async ({ page }) => {
    await navigateToStep3(page)
    
    await page.selectOption('select[name="employmentType"]', 'employed')
    await page.fill('input[name="actualIncomes.0"]', '8000')
    await page.fill('input[name="actualAges.0"]', '35')
    await page.waitForTimeout(500)
    
    const doneButton = page.locator('button:has-text("Done")').first()
    if (await doneButton.isVisible()) {
      await doneButton.click()
      await page.waitForTimeout(500)
    }
    
    await page.screenshot({ path: 'test-results/03-complete.png', fullPage: true })
    console.log('Scenario 3 PASSED')
  })
})
