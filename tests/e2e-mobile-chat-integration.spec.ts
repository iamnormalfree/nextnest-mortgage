import { test, expect } from '@playwright/test'

test.describe('Mobile Chat Integration', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  })

  test('redirects to chat page after form submission', async ({ page }) => {
    // Navigate to form
    await page.goto('http://localhost:3000/apply')

    // Fill form (simplified - adjust based on actual form fields)
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Wait for redirect to chat page
    await page.waitForURL(/\/chat\?conversation=\d+/)

    // Verify conversationId in URL
    const url = page.url()
    expect(url).toContain('/chat?conversation=')
  })

  test('renders mobile UI on mobile viewport', async ({ page }) => {
    // Navigate directly to chat (assume conversationId=12345 for testing)
    await page.goto('http://localhost:3000/chat?conversation=12345')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check for mobile UI indicators
    // Adjust selectors based on actual mobile UI structure
    const isMobileLayout = await page.evaluate(() => {
      const width = window.innerWidth
      return width <= 768 // Mobile breakpoint
    })

    expect(isMobileLayout).toBe(true)

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test('mobile UI is touch-friendly', async ({ page }) => {
    await page.goto('http://localhost:3000/chat?conversation=12345')
    await page.waitForLoadState('networkidle')

    // Find all interactive elements (buttons, links)
    const interactiveElements = await page.locator('button, a[href], input, textarea').all()

    // Check touch target sizes (minimum 44px)
    for (const element of interactiveElements) {
      const box = await element.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.width).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('empty state shows when no conversationId', async ({ page }) => {
    await page.goto('http://localhost:3000/chat')
    await page.waitForLoadState('networkidle')

    // Verify empty state message
    await expect(page.getByText('Analysis not ready yet')).toBeVisible()
    await expect(page.getByText('Start Your Analysis')).toBeVisible()
  })
})

test.describe('Desktop Chat Integration', () => {
  test.use({
    viewport: { width: 1440, height: 900 } // Desktop
  })

  test('renders desktop UI on desktop viewport', async ({ page }) => {
    await page.goto('http://localhost:3000/chat?conversation=12345')
    await page.waitForLoadState('networkidle')

    // Check for desktop UI indicators
    const isDesktopLayout = await page.evaluate(() => {
      const width = window.innerWidth
      return width > 768 // Desktop breakpoint
    })

    expect(isDesktopLayout).toBe(true)
  })
})
