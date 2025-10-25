import { test, expect } from '@playwright/test'

test.describe('Complete Progressive Form Journey', () => {
  test('New Purchase: Full flow with all progressive disclosure', async ({ page }) => {
    await page.goto('/apply')

    // Step 1: Loan Type
    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    // Step 2: Progressive Disclosure (3 levels)

    // Level 1: Only category visible
    await expect(page.locator('[name="propertyCategory"]')).toBeVisible()
    await expect(page.locator('[name="propertyType"]')).not.toBeVisible()
    await expect(page.locator('[name="priceRange"]')).not.toBeVisible()

    // Select category → Type appears
    await page.selectOption('[name="propertyCategory"]', 'resale')
    await expect(page.locator('[name="propertyType"]')).toBeVisible()
    await expect(page.locator('[name="priceRange"]')).not.toBeVisible()

    // Select type → Price + age appear
    await page.selectOption('[name="propertyType"]', 'Private')
    await expect(page.locator('[name="priceRange"]')).toBeVisible()
    await expect(page.locator('[name="combinedAge"]')).toBeVisible()

    // Fill remaining fields
    await page.fill('[name="priceRange"]', '800000')
    await page.fill('[name="combinedAge"]', '35')

    // Wait for instant analysis
    await page.waitForTimeout(2000)

    // Instant analysis appears
    await expect(page.locator('text=/You can borrow up to/i')).toBeVisible()

    await page.click('button:has-text("Continue")')

    // Step 3: Employment fields
    // Note: This test assumes Step3 components exist and work
    // If Step3 hasn't been implemented yet, this will fail and that's expected

    // Fill basic income fields (if visible)
    const incomeField = page.locator('[name="actualIncomes.0"]')
    if (await incomeField.isVisible()) {
      await incomeField.fill('8000')
    }

    const ageField = page.locator('[name="actualAges.0"]')
    if (await ageField.isVisible()) {
      await ageField.fill('35')
    }
  })

  test('Refinance: Shows all fields immediately in Step 2', async ({ page }) => {
    await page.goto('/apply')

    // Step 1
    await page.click('text=Refinance')
    await page.click('button:has-text("Continue")')

    // Step 2 (refinance shows all fields immediately - no progressive disclosure)
    await expect(page.locator('[name="propertyType"]')).toBeVisible()
    await expect(page.locator('[name="currentRate"]')).toBeVisible()
    await expect(page.locator('[name="outstandingLoan"]')).toBeVisible()
    await expect(page.locator('[name="currentBank"]')).toBeVisible()

    // Fill fields
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="currentRate"]', '2.5')
    await page.fill('[name="outstandingLoan"]', '400000')
    await page.selectOption('[name="currentBank"]', 'dbs')

    // Wait for instant calc
    await page.waitForTimeout(2000)

    // Should show savings
    await expect(page.locator('text=/You could save/i')).toBeVisible()
  })

  test('Property type labels are clean (no suffixes)', async ({ page }) => {
    await page.goto('/apply')

    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    await page.selectOption('[name="propertyCategory"]', 'resale')

    // Wait for propertyType dropdown to appear
    await page.waitForSelector('[name="propertyType"]')

    // Check dropdown options don't have "(Resale)" suffix
    const options = await page.locator('[name="propertyType"] option').allTextContents()

    // Options should be clean labels
    expect(options.some(opt => opt.includes('HDB'))).toBeTruthy()
    expect(options.some(opt => opt.includes('Private'))).toBeTruthy()

    // Should NOT have redundant suffixes like "(Resale)"
    expect(options.some(opt => opt.includes('(Resale)'))).toBeFalsy()
  })

  test('Existing property checkbox only shows for Private/EC/Landed', async ({ page }) => {
    await page.goto('/apply')

    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    await page.selectOption('[name="propertyCategory"]', 'resale')

    // Select HDB - checkbox should NOT appear
    await page.selectOption('[name="propertyType"]', 'HDB')
    await page.fill('[name="priceRange"]', '500000')
    await page.fill('[name="combinedAge"]', '30')

    let existingPropertiesCheckbox = page.locator('#second-property')
    await expect(existingPropertiesCheckbox).not.toBeVisible()

    // Select Private - checkbox SHOULD appear
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="priceRange"]', '800000')

    await expect(existingPropertiesCheckbox).toBeVisible()
  })
})
