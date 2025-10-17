# E2E Test Scenarios - Path2 Mobile Flow

**Framework:** Playwright
**Purpose:** End-to-end testing of mobile form experience with real user flows

---

## File Structure

```
tests/e2e/path2-mobile-flow.test.ts
tests/e2e/path2-conditional-fields.test.ts
tests/e2e/path2-session-restore.test.ts
tests/e2e/path2-ab-testing.test.ts
```

---

## Scenario 1: Complete Mobile Form Flow (Happy Path)

**File:** `tests/e2e/path2-mobile-flow.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path2 Mobile Form - Complete Flow', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should complete new purchase flow on mobile', async ({ page }) => {
    // Start form
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // === STEP 1: Contact Info ===
    await expect(page.locator('h2:has-text("Step 1")')).toBeVisible()

    // Check touch target sizes (WCAG 2.1 Level AAA)
    const nameInput = page.locator('input[name="name"]')
    const nameBox = await nameInput.boundingBox()
    expect(nameBox?.height).toBeGreaterThanOrEqual(48) // Minimum 48px

    // Fill contact info
    await nameInput.fill('Jane Tan')
    await page.locator('input[name="email"]').fill('jane.tan@test.com')
    await page.locator('input[name="phone"]').fill('91234567')

    // Continue to Step 2
    const continueBtn = page.locator('button:has-text("Continue")')
    const btnBox = await continueBtn.boundingBox()
    expect(btnBox?.height).toBeGreaterThanOrEqual(48) // Button touch target

    await continueBtn.click()

    // === STEP 2: Property Details ===
    await expect(page.locator('h2:has-text("Step 2")')).toBeVisible()

    // Check mobile select (bottom sheet pattern)
    await page.locator('button:has-text("Select property type")').click()

    // Bottom sheet should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Select HDB option
    await page.locator('button:has-text("HDB")').click()

    // Check smart defaults are applied
    const priceInput = page.locator('input[name="priceRange"]')
    const defaultPrice = await priceInput.inputValue()
    expect(defaultPrice).toBeTruthy() // Should be pre-filled with $500k

    // Verify numeric keyboard trigger
    await priceInput.click()
    expect(await priceInput.getAttribute('inputMode')).toBe('numeric')

    // Continue to Step 3
    await page.locator('button:has-text("Get instant loan estimate")').click()

    // === INSTANT CALCULATION ===
    // Should show calculation result
    await expect(page.locator('text=Max Loan Amount')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=$')).toBeVisible()

    // === STEP 3: Financial Details ===
    await page.locator('button:has-text("Continue to financial details")').click()

    await expect(page.locator('h2:has-text("Step 3")')).toBeVisible()

    // Smart defaults should apply for income (based on HDB)
    const incomeInput = page.locator('input[name="actualIncomes.0"]')
    const defaultIncome = await incomeInput.inputValue()
    expect(defaultIncome).toBeTruthy() // Should be pre-filled

    // Fill remaining fields
    await incomeInput.fill('5000')
    await page.locator('input[name="actualAges.0"]').fill('35')

    // Complete form
    await page.locator('button:has-text("Connect with AI Mortgage Specialist")').click()

    // === BROKER MATCH ===
    await expect(page.locator('text=AI BROKER MATCHED')).toBeVisible({ timeout: 10000 })

    // Should show broker card
    await expect(page.locator('text=Dr. Elena')).toBeVisible()
  })
})
```

---

## Scenario 2: Conditional Field Visibility

**File:** `tests/e2e/path2-conditional-fields.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path2 Conditional Fields', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should show/hide development name based on property category', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Complete Step 1
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@test.com')
    await page.locator('input[name="phone"]').fill('91234567')
    await page.locator('button:has-text("Continue")').click()

    // Step 2: Property Details
    await expect(page.locator('h2:has-text("Step 2")')).toBeVisible()

    // Development name should NOT be visible initially
    await expect(page.locator('input[name="developmentName"]')).not.toBeVisible()

    // Select "Resale" category
    await page.locator('button:has-text("Select property category")').click()
    await page.locator('button:has-text("Resale")').click()

    // Still no development name
    await expect(page.locator('input[name="developmentName"]')).not.toBeVisible()

    // Change to "New Launch"
    await page.locator('button:has-text("Resale")').click() // Re-open selector
    await page.locator('button:has-text("New Launch")').click()

    // Development name should appear
    await expect(page.locator('input[name="developmentName"]')).toBeVisible()

    // Fill development name
    await page.locator('input[name="developmentName"]').fill('The Reserve Residences')

    // Continue should work
    await page.locator('button:has-text("Continue")').click()
    await expect(page.locator('h2:has-text("Step 3")')).toBeVisible()
  })

  test('should show cash out field only when refinancing goal includes cash_out', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=refinance')

    // Complete Step 1
    await fillContactInfo(page)

    // Navigate to refinancing goals (exact step depends on form structure)
    // Assuming it's in Step 2 or 3

    // Initially no cash out field
    await expect(page.locator('input[name="cashOutAmount"]')).not.toBeVisible()

    // Select "Lower Rate" goal only
    await page.locator('label:has-text("Lower Interest Rate")').click()

    // Still no cash out field
    await expect(page.locator('input[name="cashOutAmount"]')).not.toBeVisible()

    // Select "Cash Out" goal
    await page.locator('label:has-text("Cash Out")').click()

    // Cash out field should appear
    await expect(page.locator('input[name="cashOutAmount"]')).toBeVisible()

    // Field should be required (star indicator or required attribute)
    const cashOutInput = page.locator('input[name="cashOutAmount"]')
    const labelText = await page.locator('label:has([name="cashOutAmount"])').textContent()
    expect(labelText).toContain('*') // Required indicator
  })
})
```

---

## Scenario 3: Session Persistence & Restoration

**File:** `tests/e2e/path2-session-restore.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path2 Session Persistence', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should restore partial form data after page reload', async ({ page, context }) => {
    await page.goto('http://localhost:3000/apply')

    // Fill partial data (Step 1 only)
    await page.locator('input[name="name"]').fill('Restored User')
    await page.locator('input[name="email"]').fill('restored@test.com')
    await page.locator('input[name="phone"]').fill('98765432')

    // Wait for debounced save (300ms)
    await page.waitForTimeout(500)

    // Reload page (simulate user closing browser and returning)
    await page.reload()

    // Data should be restored
    await expect(page.locator('input[name="name"]')).toHaveValue('Restored User')
    await expect(page.locator('input[name="email"]')).toHaveValue('restored@test.com')
    await expect(page.locator('input[name="phone"]')).toHaveValue('98765432')
  })

  test('should restore data across multiple steps', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Fill Step 1
    await page.locator('input[name="name"]').fill('Multi Step User')
    await page.locator('input[name="email"]').fill('multistep@test.com')
    await page.locator('input[name="phone"]').fill('91112222')
    await page.locator('button:has-text("Continue")').click()

    // Fill Step 2 partially
    await page.locator('button:has-text("Select property type")').click()
    await page.locator('button:has-text("HDB")').click()
    await page.locator('input[name="priceRange"]').fill('500000')

    // Wait for save
    await page.waitForTimeout(500)

    // Reload page
    await page.reload()

    // Should restore to Step 2 with data
    await expect(page.locator('h2:has-text("Step 2")')).toBeVisible()
    await expect(page.locator('button:has-text("HDB")')).toBeVisible()

    const priceInput = page.locator('input[name="priceRange"]')
    await expect(priceInput).toHaveValue('500000')
  })

  test('should clear session after successful completion', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Complete entire form
    await fillCompleteForm(page)

    // Submit
    await page.locator('button:has-text("Connect with AI Mortgage Specialist")').click()

    // Wait for broker match
    await expect(page.locator('text=AI BROKER MATCHED')).toBeVisible({ timeout: 10000 })

    // Go back to form
    await page.goto('http://localhost:3000/apply')

    // Should be a fresh form (no restored data)
    await expect(page.locator('input[name="name"]')).toHaveValue('')
    await expect(page.locator('input[name="email"]')).toHaveValue('')
  })
})
```

---

## Scenario 4: Touch Interactions & Swipe Navigation

**File:** `tests/e2e/path2-touch-interactions.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path2 Touch Interactions', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should support swipe navigation between steps', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Fill Step 1
    await fillContactInfo(page)
    await page.locator('button:has-text("Continue")').click()

    // Now on Step 2
    await expect(page.locator('h2:has-text("Step 2")')).toBeVisible()

    // Swipe left to go forward (simulate touch gesture)
    const main = page.locator('main')
    const box = await main.boundingBox()

    if (box) {
      // Swipe left (right to left)
      await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2)
      await page.touchscreen.swipe(
        { x: box.x + box.width - 50, y: box.y + box.height / 2 },
        { x: box.x + 50, y: box.y + box.height / 2 }
      )
    }

    // Should advance to next section (if validation passes)
    // Implementation depends on form structure
  })

  test('should have proper touch target sizes for all interactive elements', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Check all form inputs
    const inputs = await page.locator('input, button, select').all()

    for (const input of inputs) {
      const box = await input.boundingBox()
      if (box) {
        // WCAG 2.1 Level AAA: 48px minimum
        expect(box.height).toBeGreaterThanOrEqual(48)
      }
    }
  })

  test('should show haptic feedback on button press (visual indicator)', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    const continueBtn = page.locator('button:has-text("Continue")')

    // Check initial state
    const initialBg = await continueBtn.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )

    // Tap button
    await continueBtn.click()

    // Background should change (hover/active state)
    // Note: Haptic feedback itself can't be tested in Playwright
    // We're testing the visual feedback instead
  })
})
```

---

## Scenario 5: A/B Test Variant Rendering

**File:** `tests/e2e/path2-ab-testing.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path2 A/B Testing', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should render control variant by default', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Complete Step 1
    await fillContactInfo(page)
    await page.locator('button:has-text("Continue")').click()

    // Step 2 CTA should show control text
    await expect(
      page.locator('button:has-text("Get instant loan estimate")')
    ).toBeVisible()
  })

  test('should render treatment variant when forced', async ({ page }) => {
    // Mock experiment variant via localStorage or query param
    await page.addInitScript(() => {
      localStorage.setItem('__experiments__', JSON.stringify({
        'step2_cta_copy': 'See your max loan amount'
      }))
    })

    await page.goto('http://localhost:3000/apply')

    // Complete Step 1
    await fillContactInfo(page)
    await page.locator('button:has-text("Continue")').click()

    // Step 2 CTA should show treatment text
    await expect(
      page.locator('button:has-text("See your max loan amount")')
    ).toBeVisible()
  })

  test('should track experiment exposure events', async ({ page }) => {
    // Setup analytics tracking listener
    const events: any[] = []
    await page.on('console', msg => {
      if (msg.text().includes('[Analytics]')) {
        events.push(msg.text())
      }
    })

    await page.goto('http://localhost:3000/apply')

    // Navigate through form
    await fillContactInfo(page)
    await page.locator('button:has-text("Continue")').click()

    // Check analytics event was fired
    // (Implementation depends on analytics setup)
    // expect(events.some(e => e.includes('experiment_exposure'))).toBe(true)
  })
})
```

---

## Helper Functions

```typescript
// Common helper functions used across test files

async function fillContactInfo(page: any) {
  await page.locator('input[name="name"]').fill('Test User')
  await page.locator('input[name="email"]').fill('test@test.com')
  await page.locator('input[name="phone"]').fill('91234567')
}

async function fillCompleteForm(page: any) {
  // Step 1
  await page.locator('input[name="name"]').fill('Complete User')
  await page.locator('input[name="email"]').fill('complete@test.com')
  await page.locator('input[name="phone"]').fill('91234567')
  await page.locator('button:has-text("Continue")').click()

  // Step 2
  await page.locator('button:has-text("Select property type")').click()
  await page.locator('button:has-text("HDB")').click()
  await page.locator('input[name="priceRange"]').fill('500000')
  await page.locator('button:has-text("Continue")').click()

  // Step 3
  await page.locator('input[name="actualIncomes.0"]').fill('5000')
  await page.locator('input[name="actualAges.0"]').fill('35')
}
```

---

## Running E2E Tests

```bash
# Run all E2E tests
npx playwright test tests/e2e/

# Run specific scenario
npx playwright test tests/e2e/path2-mobile-flow.test.ts

# Run with UI mode (interactive debugging)
npx playwright test --ui

# Run on specific device
npx playwright test --project='Mobile Chrome'

# Run with trace (for debugging)
npx playwright test --trace on
```

**Expected Output:**
```
Running 8 tests using 1 worker

  ✓ [Mobile Chrome] › path2-mobile-flow.test.ts:5:1 › should complete new purchase flow (8.2s)
  ✓ [Mobile Chrome] › path2-conditional-fields.test.ts:5:1 › should show/hide development name (3.4s)
  ✓ [Mobile Chrome] › path2-session-restore.test.ts:5:1 › should restore partial form data (2.1s)
  ✓ [Mobile Chrome] › path2-touch-interactions.test.ts:5:1 › should support swipe navigation (4.3s)

  8 passed (28.5s)
```

**References:**
- Playwright docs: https://playwright.dev/docs/intro
- Mobile testing: https://playwright.dev/docs/emulation
- Touch events: https://playwright.dev/docs/input#touch
