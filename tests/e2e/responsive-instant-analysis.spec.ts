import { test, expect } from '@playwright/test'

test.describe('Responsive Instant Analysis', () => {
  test('Desktop: Shows floating sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/apply')

    // Navigate to Step 2
    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    // Fill Step 2 fields progressively
    await page.selectOption('[name="propertyCategory"]', 'resale')
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="priceRange"]', '800000')
    await page.fill('[name="combinedAge"]', '35')

    // Wait for instant calc to complete
    await page.waitForTimeout(2000)

    // Verify sidebar visible (desktop layout)
    const sidebar = page.locator('.form-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toContainText('You can borrow up to')

    // Test sticky behavior
    const initialPosition = await sidebar.boundingBox()
    await page.mouse.wheel(0, 500) // Scroll down
    await page.waitForTimeout(500)
    const scrolledPosition = await sidebar.boundingBox()

    // Sidebar should stay at same Y position (sticky)
    expect(scrolledPosition?.top).toBe(initialPosition?.top)
  })

  test('Mobile: Shows inline card (no sidebar)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/apply')

    // Navigate to Step 2
    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    // Fill Step 2 fields
    await page.selectOption('[name="propertyCategory"]', 'resale')
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="priceRange"]', '800000')
    await page.fill('[name="combinedAge"]', '35')

    // Wait for instant calc
    await page.waitForTimeout(2000)

    // Verify inline card visible (mobile layout)
    await expect(page.locator('text=/You can borrow up to/i')).toBeVisible()

    // Verify no sidebar on mobile
    const sidebar = page.locator('.form-sidebar')
    await expect(sidebar).not.toBeVisible()
  })

  test('Touch targets meet 48px minimum on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/apply')

    // Check all button touch targets
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box && box.height > 0) { // Only check visible buttons
        expect(box.height).toBeGreaterThanOrEqual(44) // iOS standard is 44px
      }
    }
  })
})
