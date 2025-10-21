// ABOUTME: Playwright test to verify age pre-fill from Step 2 to Step 4
import { test, expect } from '@playwright/test'

test('Age pre-fill verification - single applicant', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await page.waitForLoadState('networkidle')
  
  // Step 1: Select loan type
  const newPurchaseButton = page.getByRole('button', { name: /new purchase|buying a home/i })
  await newPurchaseButton.click()
  
  // Step 2: Fill contact info (Singapore phone number format)
  await page.fill('[name="name"]', 'Test User')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="phone"]', '81234567')
  
  // Wait for validation to complete
  await page.waitForTimeout(500)
  
  await page.getByRole('button', { name: /continue/i }).click()
  
  // Step 3: Fill property details with age = 42
  await page.waitForSelector('[name="combinedAge"]')
  await page.fill('[name="priceRange"]', '500000')
  await page.fill('[name="combinedAge"]', '42')
  
  // Wait for validation
  await page.waitForTimeout(500)
  
  // Click to Step 4
  await page.getByRole('button', { name: /get instant loan estimate/i }).click()
  
  // Step 4: Verify age is pre-filled
  await page.waitForSelector('[name="actualAges.0"]', { timeout: 10000 })
  const ageInput = page.locator('[name="actualAges.0"]')
  const ageValue = await ageInput.inputValue()
  
  console.log('Pre-filled age value:', ageValue)
  expect(parseInt(ageValue)).toBe(42)
})
