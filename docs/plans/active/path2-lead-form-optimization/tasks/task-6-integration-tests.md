# Task 6: Integration & E2E Tests

**Status:** ⏸️ PENDING
**Estimated Time:** 4-5 hours
**Prerequisites:** Task 5 completed

[← Back to Index](../00-INDEX.md) | [Previous: Task 5](task-5-feature-flags.md) | [Next: Task 7 →](task-7-documentation.md)

---

## Overview

**Objective:** Comprehensive end-to-end testing of all Path 2 features working together

**Why This Matters:**
- Unit tests verify individual pieces
- Integration tests verify the whole system
- Catch edge cases before production
- Confidence in release quality

**Expected Impact:**
- Catch 90%+ of bugs before production
- Reduce production incidents
- Faster debugging when issues arise
- Documentation through tests

**Files to Create:**
- `tests/e2e/path2-integration.test.ts` - Full flow tests
- `tests/e2e/path2-mobile.test.ts` - Mobile-specific tests
- `tests/e2e/path2-session-restore.test.ts` - Session persistence tests

---

## Implementation Steps

### 6.1 Complete Flow Test

**Create:** `tests/e2e/path2-integration.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path 2 Complete Flow', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should complete mobile form with conditional fields and smart defaults', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Step 1: Contact Info
    await page.fill('input[name="name"]', 'Jane Tan')
    await page.fill('input[name="email"]', 'jane@test.com')
    await page.fill('input[name="phone"]', '98765432')
    await page.click('button:has-text("Continue")')

    // Step 2: Property Details
    await page.selectOption('select[name="propertyCategory"]', 'new_launch')

    // Development name should appear (conditional field)
    await expect(page.locator('input[name="developmentName"]')).toBeVisible()
    await page.fill('input[name="developmentName"]', 'The Reserve Residences')

    // Smart defaults should be applied
    const priceInput = page.locator('input[name="priceRange"]')
    const defaultPrice = await priceInput.inputValue()
    expect(defaultPrice).toBeTruthy() // Should be pre-filled
    expect(parseInt(defaultPrice.replace(/,/g, ''))).toBeGreaterThan(0)

    await page.click('button:has-text("Continue")')

    // Step 3: Financial Details
    const incomeInput = page.locator('input[name="actualIncomes.0"]')
    const defaultIncome = await incomeInput.inputValue()
    expect(defaultIncome).toBeTruthy() // Should be pre-filled

    // Fill remaining required fields
    await page.fill('input[name="actualAges.0"]', '35')

    await page.click('button:has-text("Connect with AI Mortgage Specialist")')

    // Should reach broker match screen
    await expect(page.locator('text=AI BROKER MATCHED')).toBeVisible({ timeout: 10000 })
  })

  test('should hide irrelevant fields based on selections', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Navigate to Step 2
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    // Select resale property
    await page.selectOption('select[name="propertyCategory"]', 'resale')

    // Development name should NOT be visible (conditional field)
    await expect(page.locator('input[name="developmentName"]')).not.toBeVisible()

    // Change to new launch
    await page.selectOption('select[name="propertyCategory"]', 'new_launch')

    // Development name should NOW be visible
    await expect(page.locator('input[name="developmentName"]')).toBeVisible()
  })

  test('should show joint applicant fields when toggled', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Navigate to Step 3
    await page.fill('input[name="name"]', 'Test')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="priceRange"]', '500000')
    await page.click('button:has-text("Continue")')

    // Joint applicant fields should not be visible initially
    await expect(page.locator('input[name="actualIncomes.1"]')).not.toBeVisible()

    // Toggle joint applicant
    await page.click('input[type="checkbox"][name="hasJointApplicant"]')

    // Joint applicant fields should now be visible
    await expect(page.locator('input[name="actualIncomes.1"]')).toBeVisible()
    await expect(page.locator('input[name="actualAges.1"]')).toBeVisible()
  })

  test('should validate affordability for smart defaults', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Navigate to property selection with low income
    await page.fill('input[name="name"]', 'Low Income User')
    await page.fill('input[name="email"]', 'low@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    // First provide low income
    await page.fill('input[name="actualIncomes.0"]', '3000')

    // Then select private property
    await page.selectOption('select[name="propertyType"]', 'Private')

    // Smart default should suggest affordable price (NOT $1.2M)
    const priceInput = page.locator('input[name="priceRange"]')
    const suggestedPrice = await priceInput.inputValue()
    const priceValue = parseInt(suggestedPrice.replace(/,/g, ''))

    // Should be less than default Private price ($1.2M)
    expect(priceValue).toBeLessThan(1200000)
    // But still reasonable (not $0)
    expect(priceValue).toBeGreaterThan(100000)
  })
})
```

---

### 6.2 Session Restore Tests

**Create:** `tests/e2e/path2-session-restore.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Session Persistence', () => {
  test('should restore session after page reload', async ({ page, context }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Fill partial data
    await page.fill('input[name="name"]', 'Session Test User')
    await page.fill('input[name="email"]', 'session@test.com')
    await page.fill('input[name="phone"]', '98765432')

    // Reload page
    await page.reload()

    // Data should be restored
    await expect(page.locator('input[name="name"]')).toHaveValue('Session Test User')
    await expect(page.locator('input[name="email"]')).toHaveValue('session@test.com')
    await expect(page.locator('input[name="phone"]')).toHaveValue('98765432')
  })

  test('should persist data across navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Fill Step 1
    await page.fill('input[name="name"]', 'Navigation Test')
    await page.fill('input[name="email"]', 'nav@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    // Fill Step 2
    await page.fill('input[name="priceRange"]', '600000')
    await page.click('button:has-text("Continue")')

    // Go back to Step 1
    await page.click('button:has-text("Back")')

    // Data should still be there
    await expect(page.locator('input[name="name"]')).toHaveValue('Navigation Test')
  })

  test('should clear session on completion', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Complete form
    await page.fill('input[name="name"]', 'Completion Test')
    await page.fill('input[name="email"]', 'complete@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="priceRange"]', '500000')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="actualIncomes.0"]', '5000')
    await page.fill('input[name="actualAges.0"]', '35')
    await page.click('button:has-text("Connect with AI Mortgage Specialist")')

    // Wait for completion
    await expect(page.locator('text=AI BROKER MATCHED')).toBeVisible({ timeout: 10000 })

    // Go back to form
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Form should be empty (session cleared)
    await expect(page.locator('input[name="name"]')).toHaveValue('')
  })

  test('should handle submission failure gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/forms/analyze', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      })
    })

    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Fill form
    await page.fill('input[name="name"]', 'Error Test')
    await page.fill('input[name="email"]', 'error@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="priceRange"]', '500000')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="actualIncomes.0"]', '5000')
    await page.fill('input[name="actualAges.0"]', '35')
    await page.click('button:has-text("Connect with AI Mortgage Specialist")')

    // Should show error message
    await expect(page.locator('text=Your data is saved')).toBeVisible()

    // Reload page - data should still be there
    await page.reload()
    await expect(page.locator('input[name="name"]')).toHaveValue('Error Test')
  })
})
```

---

### 6.3 A/B Test Verification

**Add to:** `tests/e2e/path2-integration.test.ts`

```typescript
test('should respect A/B test variant', async ({ page }) => {
  // Mock experiment to return specific variant
  await page.addInitScript(() => {
    (window as any).__EXPERIMENTS__ = {
      'step2_cta_copy': 'See your max loan amount'
    }
  })

  await page.goto('http://localhost:3000/apply?loanType=new_purchase')

  // Navigate to Step 2
  await page.fill('input[name="name"]', 'Test')
  await page.fill('input[name="email"]', 'test@test.com')
  await page.fill('input[name="phone"]', '91234567')
  await page.click('button:has-text("Continue")')

  // Should show variant CTA text
  await expect(
    page.locator('button:has-text("See your max loan amount")')
  ).toBeVisible()
})

test('should track experiment exposure events', async ({ page }) => {
  const events: any[] = []

  // Capture analytics events
  await page.exposeFunction('captureEvent', (eventName: string, props: any) => {
    events.push({ eventName, props })
  })

  await page.addInitScript(() => {
    const originalTrackEvent = (window as any).trackEvent
    ;(window as any).trackEvent = (name: string, props: any) => {
      ;(window as any).captureEvent(name, props)
      if (originalTrackEvent) originalTrackEvent(name, props)
    }
  })

  await page.goto('http://localhost:3000/apply?loanType=new_purchase')

  // Should track experiment exposure
  const exposureEvent = events.find(e => e.eventName === 'experiment_exposure')
  expect(exposureEvent).toBeTruthy()
  expect(exposureEvent.props.experimentId).toBeTruthy()
})
```

---

### 6.4 Mobile Touch Interaction Tests

**Create:** `tests/e2e/path2-mobile.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Touch Interactions', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should have WCAG-compliant touch targets', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Check all interactive elements
    const buttons = await page.locator('button, input, select').all()

    for (const element of buttons) {
      const box = await element.boundingBox()
      if (box) {
        // WCAG 2.1 Level AAA requires 48x48px minimum
        expect(box.height).toBeGreaterThanOrEqual(48)
        expect(box.width).toBeGreaterThanOrEqual(48)
      }
    }
  })

  test('should trigger numeric keyboard for income fields', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    // Navigate to income field
    await page.fill('input[name="name"]', 'Test')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="priceRange"]', '500000')
    await page.click('button:has-text("Continue")')

    // Check inputMode attribute
    const incomeInput = page.locator('input[name="actualIncomes.0"]')
    await expect(incomeInput).toHaveAttribute('inputMode', 'numeric')
  })

  test('should support bottom sheet selection on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000/apply?loanType=new_purchase')

    await page.fill('input[name="name"]', 'Test')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    // Click on property type selector
    await page.click('button:has-text("Select property type")')

    // Bottom sheet should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Select option
    await page.click('button:has-text("HDB")')

    // Bottom sheet should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Value should be selected
    await expect(page.locator('button:has-text("HDB")')).toBeVisible()
  })
})
```

---

## Run Tests

```bash
# Run all E2E tests
npx playwright test tests/e2e/

# Run specific test file
npx playwright test tests/e2e/path2-integration.test.ts

# Run with UI mode (recommended for debugging)
npx playwright test --ui

# Run on specific device
npx playwright test --project='Mobile Chrome'
```

**Expected Output:**
```
Running 12 tests using 3 workers

  ✓ tests/e2e/path2-integration.test.ts:7:3 › should complete mobile form with conditional fields (8.2s)
  ✓ tests/e2e/path2-integration.test.ts:45:3 › should hide irrelevant fields based on selections (4.1s)
  ✓ tests/e2e/path2-integration.test.ts:67:3 › should show joint applicant fields when toggled (5.3s)
  ✓ tests/e2e/path2-session-restore.test.ts:5:3 › should restore session after page reload (3.8s)
  ✓ tests/e2e/path2-mobile.test.ts:8:3 › should have WCAG-compliant touch targets (2.9s)

12 passed (42.3s)
```

---

## Commit Point

```bash
git add tests/e2e/path2-integration.test.ts
git add tests/e2e/path2-session-restore.test.ts
git add tests/e2e/path2-mobile.test.ts

git commit -m "test: add comprehensive E2E tests for Path 2 features

- Add full flow integration tests
- Test conditional field visibility
- Verify session persistence and restore
- Test smart defaults and affordability validation
- Verify A/B test variant rendering
- Test mobile touch interactions and WCAG compliance
- Add submission failure handling tests

All Path 2 features now covered by E2E tests"
```

---

## Success Criteria

- [ ] All E2E tests pass (`npx playwright test`)
- [ ] Tests cover all Path 2 features
- [ ] Tests run on mobile viewports
- [ ] Session restore works correctly
- [ ] Conditional fields tested
- [ ] Smart defaults tested
- [ ] A/B tests verified
- [ ] Touch targets meet WCAG standards

---

## Next Steps

After committing this task:
1. Run full test suite (`npx playwright test`)
2. Verify all tests pass
3. Check test coverage
4. Proceed to [Task 7: Documentation](task-7-documentation.md)

---

[← Back to Index](../00-INDEX.md) | [Previous: Task 5](task-5-feature-flags.md) | [Next: Task 7 →](task-7-documentation.md)
