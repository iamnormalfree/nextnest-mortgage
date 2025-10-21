// ABOUTME: Playwright test to verify age pre-fill from Step 2 to Step 4
import { test, expect } from '@playwright/test'

test('Age pre-fill verification - single applicant', async ({ page }) => {
  // Navigate to the form
  await page.goto('http://localhost:3000/')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Step 1: Select loan type
  const newPurchaseButton = page.getByRole('button', { name: /new purchase|buying a home/i })
  await newPurchaseButton.click()
  
  // Step 2: Fill contact info
  await page.fill('[name="name"]', 'Test User')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="phone"]', '91234567')
  await page.getByRole('button', { name: /continue/i }).click()
  
  // Step 3: Fill property details with age = 42
  await page.waitForSelector('[name="combinedAge"]')
  await page.fill('[name="combinedAge"]', '42')
  
  // Click to Step 4
  await page.getByRole('button', { name: /get instant loan estimate/i }).click()
  
  // Step 4: Verify age is pre-filled
  await page.waitForSelector('[name="actualAges.0"]')
  const ageInput = page.locator('[name="actualAges.0"]')
  const ageValue = await ageInput.inputValue()
  
  console.log('Pre-filled age value:', ageValue)
  expect(parseInt(ageValue)).toBe(42)
})

test('Age pre-fill verification - joint applicant', async ({ page }) => {
  // Navigate to the form
  await page.goto('http://localhost:3000/')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Step 1: Select loan type
  const newPurchaseButton = page.getByRole('button', { name: /new purchase|buying a home/i })
  await newPurchaseButton.click()
  
  // Step 2: Fill contact info
  await page.fill('[name="name"]', 'Test User')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="phone"]', '91234567')
  await page.getByRole('button', { name: /continue/i }).click()
  
  // Step 3: Fill property details with age = 80
  await page.waitForSelector('[name="combinedAge"]')
  await page.fill('[name="combinedAge"]', '80')
  
  // Enable joint applicant BEFORE moving to Step 4
  const jointCheckbox = page.locator('[name="hasJointApplicant"]')
  if (await jointCheckbox.isVisible()) {
    await jointCheckbox.check()
  }
  
  // Click to Step 4
  await page.getByRole('button', { name: /get instant loan estimate/i }).click()
  
  // Step 4: Verify age is pre-filled as combinedAge / 2 = 40
  await page.waitForSelector('[name="actualAges.0"]')
  const ageInput = page.locator('[name="actualAges.0"]')
  const ageValue = await ageInput.inputValue()
  
  console.log('Pre-filled age value for joint applicant:', ageValue)
  expect(parseInt(ageValue)).toBe(40)
})
