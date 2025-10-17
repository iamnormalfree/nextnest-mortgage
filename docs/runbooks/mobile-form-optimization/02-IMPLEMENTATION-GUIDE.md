# Path 2 Implementation Guide

**How to implement tasks using TDD workflow, commit patterns, and testing strategies.**

---

## 🎯 Test-Driven Development (TDD) Workflow

**MANDATORY for all features and bug fixes.**

### The TDD Cycle

```
1. RED → Write failing test
2. GREEN → Write minimal code to pass
3. REFACTOR → Improve code while keeping tests green
4. COMMIT → Commit the working feature
```

### Step-by-Step Process

#### 1. Write Failing Test

```bash
# Create test file first
touch components/forms/__tests__/MobileNumberInput.test.tsx

# Write test that validates desired behavior
npm test -- components/forms/__tests__/MobileNumberInput.test.tsx
# Expected: FAIL (feature doesn't exist yet)
```

**Example failing test:**
```tsx
import { render, screen } from '@testing-library/react'
import { MobileNumberInput } from '../mobile/MobileNumberInput'

describe('MobileNumberInput', () => {
  it('should trigger numeric keyboard on mobile', () => {
    render(
      <MobileNumberInput
        label="Income"
        value=""
        onChange={jest.fn()}
      />
    )

    const input = screen.getByLabelText('Income')
    expect(input).toHaveAttribute('inputMode', 'numeric')
  })
})
```

#### 2. Run Test (Confirm Failure)

```bash
npm test -- MobileNumberInput.test.tsx

# Expected output:
# FAIL  components/forms/__tests__/MobileNumberInput.test.tsx
#   ● MobileNumberInput › should trigger numeric keyboard on mobile
#     Cannot find module '../mobile/MobileNumberInput'
```

#### 3. Write Minimal Code

Create **ONLY** the code needed to make test pass:

```tsx
// components/forms/mobile/MobileNumberInput.tsx
export function MobileNumberInput({ label, value, onChange }) {
  return (
    <div>
      <label>{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
```

#### 4. Run Test (Confirm Success)

```bash
npm test -- MobileNumberInput.test.tsx

# Expected output:
# PASS  components/forms/__tests__/MobileNumberInput.test.tsx
#   ✓ should trigger numeric keyboard on mobile (23ms)
```

#### 5. Refactor (Keep Tests Green)

Improve code quality while keeping tests passing:

```tsx
// Add TypeScript types, styling, error handling
export function MobileNumberInput({
  label,
  value,
  onChange,
  error
}: MobileNumberInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-14 px-4 border-2",
          error ? "border-red-500" : "border-gray-200"
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

Run tests again to ensure refactoring didn't break anything:

```bash
npm test -- MobileNumberInput.test.tsx
# Still PASS
```

#### 6. Commit Working Feature

```bash
git add components/forms/mobile/MobileNumberInput.tsx
git add components/forms/__tests__/MobileNumberInput.test.tsx
git commit -m "feat: add mobile number input with numeric keyboard

- Use inputMode='numeric' to trigger mobile keyboard
- Add 48px touch target for WCAG compliance
- Include error state styling

Improves mobile UX by showing appropriate keyboard type"
```

---

## 📝 Commit Message Format

### Template

```
<type>: <what you did> (<why it matters>)

<optional body with details>
- Bullet points for key changes
- Focus on WHAT and WHY, not HOW

<optional footer with refs>
Relates to Task 2
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Add or update tests
- `refactor:` - Code restructuring (no behavior change)
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons (no code change)
- `chore:` - Updating build tasks, etc (no production code change)

### Examples

**Good:**
```bash
git commit -m "feat: add conditional field visibility (reduces user cognitive load)

- Create field-conditionals.ts with centralized rules
- Add useFieldVisibility hook for React integration
- Development name only shows for new launch properties
- Cash out amount only shows when refinancing goal selected

Reduces average fields shown from 15 to 8-10 based on context"
```

**Bad:**
```bash
git commit -m "update files"  # What files? Why?
git commit -m "fix bug"       # What bug? How fixed?
git commit -m "WIP"           # Not descriptive enough
```

---

## 🧪 Testing Strategies

### Unit Tests

Test individual functions/components in isolation.

**Location:** `lib/forms/__tests__/`, `components/forms/__tests__/`

**Example:**
```tsx
// lib/forms/__tests__/field-conditionals.test.ts
import { shouldShowField } from '../field-conditionals'

describe('shouldShowField', () => {
  it('shows development name for new launch', () => {
    const formState = {
      loanType: 'new_purchase',
      propertyCategory: 'new_launch'
    }
    expect(shouldShowField('developmentName', formState)).toBe(true)
  })

  it('hides development name for resale', () => {
    const formState = {
      loanType: 'new_purchase',
      propertyCategory: 'resale'
    }
    expect(shouldShowField('developmentName', formState)).toBe(false)
  })
})
```

### Integration Tests

Test multiple components working together.

**Location:** `components/forms/__tests__/`

**Example:**
```tsx
// components/forms/__tests__/ProgressiveForm-conditionals.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Conditional Fields Integration', () => {
  it('shows development name when new launch selected', async () => {
    render(<ProgressiveFormWithController loanType="new_purchase" />)

    // Select new launch
    fireEvent.change(screen.getByLabelText('Property Category'), {
      target: { value: 'new_launch' }
    })

    // Development name should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Development Name/i)).toBeVisible()
    })
  })
})
```

### E2E Tests (Playwright)

Test complete user flows in real browser.

**Location:** `tests/e2e/`

**Example:**
```tsx
// tests/e2e/path2-mobile-flow.test.ts
import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 13'] })

test('mobile user completes form with conditionals', async ({ page }) => {
  await page.goto('http://localhost:3000/apply?loanType=new_purchase')

  // Fill contact info
  await page.fill('input[name="name"]', 'Jane Tan')
  await page.fill('input[name="email"]', 'jane@test.com')
  await page.fill('input[name="phone"]', '98765432')
  await page.click('button:has-text("Continue")')

  // Select new launch
  await page.selectOption('select[name="propertyCategory"]', 'new_launch')

  // Development name should appear (conditional field)
  await expect(page.locator('input[name="developmentName"]')).toBeVisible()
})
```

---

## 🔄 Development Iteration Pattern

### For Each Sub-Task

```bash
# 1. Create branch (if needed)
git checkout -b feature/task-2-conditional-fields

# 2. Write failing test
touch lib/forms/__tests__/field-conditionals.test.ts
npm test -- field-conditionals.test.ts
# Confirm: FAIL

# 3. Implement feature
touch lib/forms/field-conditionals.ts
# ... write code ...

# 4. Run tests until green
npm test -- field-conditionals.test.ts
# Confirm: PASS

# 5. Run full test suite
npm test
# Confirm: All pass

# 6. Verify build
npm run build
# Confirm: No errors

# 7. Commit
git add lib/forms/field-conditionals.ts lib/forms/__tests__/field-conditionals.test.ts
git commit -m "feat: add field conditional logic"

# 8. Repeat for next sub-task
```

### For Each Complete Task

```bash
# 1. Run full quality checks
npm run lint     # No lint errors
npm test         # All tests pass
npm run build    # Build succeeds

# 2. Update task status
# Edit: 00-INDEX.md - Mark task as complete

# 3. Commit status update
git add docs/plans/active/path2-lead-form-optimization/00-INDEX.md
git commit -m "docs: mark Task 2 complete in Path2 index"

# 4. Push to remote
git push origin fix/progressive-form-calculation-corrections
```

---

## 🛡️ Quality Gates (Must Pass Before Committing)

### Automated Checks

```bash
# TypeScript compilation
npm run build
# Must exit with code 0

# Linting
npm run lint
# Must show "No linting errors"

# Tests
npm test
# Must show "All tests passed"
```

### Manual Checks

- [ ] No `any` types in TypeScript
- [ ] ABOUTME comments on new files
- [ ] Design system compliance (no rounded corners, correct colors)
- [ ] Touch targets ≥48px for mobile components
- [ ] No framer-motion or heavy dependencies added

---

## 🐛 Debugging Workflow

### When Tests Fail

**1. Read error message carefully**

```
FAIL  lib/forms/__tests__/field-conditionals.test.ts
  ● shouldShowField › shows development name for new launch

    expect(received).toBe(expected)

    Expected: true
    Received: false
```

**2. Reproduce consistently**

```bash
npm test -- field-conditionals.test.ts
# Run multiple times to confirm not flaky
```

**3. Check recent changes**

```bash
git diff HEAD~1 lib/forms/field-conditionals.ts
# What changed since last working commit?
```

**4. Find working examples**

```bash
grep -r "showWhen" lib/forms/
# Look for similar patterns that work
```

**5. Form hypothesis and test**

```tsx
// Hypothesis: showWhen not checking propertyCategory correctly
console.log('formState:', formState)
console.log('propertyCategory:', formState.propertyCategory)
```

**6. Fix and verify**

```bash
npm test -- field-conditionals.test.ts
# Confirm: PASS
```

---

## 📊 Test Coverage Goals

Maintain these coverage thresholds:

- **Statements:** ≥80%
- **Branches:** ≥75%
- **Functions:** ≥80%
- **Lines:** ≥80%

Check coverage:
```bash
npm test -- --coverage
```

---

## 🔗 Quick Links

- [Return to Index](./00-INDEX.md)
- [Onboarding Guide](./01-ONBOARDING.md)
- [Unit Test Template](./testing/unit-test-template.md)
- [Integration Test Template](./testing/integration-test-template.md)
- [E2E Test Scenarios](./testing/e2e-test-scenarios.md)
