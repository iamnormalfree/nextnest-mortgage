# Lead Form Conversion Optimization - Path 2 (Production-Ready)

**Timeline:** 2 weeks (no experimentation phase)
**Expected Impact:** 35-45% conversion increase
**Complexity:** Medium
**Risk:** Low (battle-tested patterns, no experimental features)

**Status:** ✅ Task 1 Complete | 🚧 Tasks 2-8 Pending | ✅ Amended to use existing storage solutions (2025-10-17)

**Amendment Summary (2025-10-17):**
- ❌ REMOVED: Task 3.2 `useFormSession.ts` creation
- ❌ REMOVED: Task 3.3 `useOfflineQueue.ts` and `OfflineIndicator.tsx`
- ✅ REPLACED: Use existing `useLoanApplicationStorage` (7-day, 113 lines)
- ✅ BENEFIT: Saves 450 lines of redundant code + maintenance overhead
- 📄 Details: See `PATH2_AMENDMENT_EXISTING_SOLUTIONS.md`

---

## 📋 ENGINEER ONBOARDING - READ THIS FIRST

This guide assumes you are a skilled developer but know **nothing about our codebase or problem domain**. Everything you need is documented below.

### Prerequisites

**Required Reading** (read these files BEFORE starting any task):
1. `CLAUDE.md` - Project rules and development philosophy
2. **`docs/plans/active/PATH2_AMENDMENT_EXISTING_SOLUTIONS.md`** - CRITICAL: Use existing storage solutions
3. `components/forms/ProgressiveForm.tsx` - Existing desktop form (gate-based system, NOT steps)
4. `lib/calculations/instant-profile.ts` - Dr Elena v2 mortgage calculation engine
5. `lib/contracts/form-contracts.ts` - TypeScript interfaces and types
6. `lib/forms/form-config.ts` - Form field configuration and validation rules
7. `hooks/useLoanApplicationContext.tsx` - Form state management hook
8. `lib/hooks/useLoanApplicationStorage.ts` - Existing 7-day persistence (DO NOT recreate)

**Tech Stack Summary:**
- **Framework:** Next.js 14 (App Router, NOT Pages Router)
- **Forms:** React Hook Form v7 (Controller pattern for controlled inputs)
- **Validation:** Zod schemas (NOT yup, NOT joi)
- **Styling:** Tailwind CSS (monochrome + yellow accent only)
- **TypeScript:** Strict mode (NO `any` types allowed)
- **Testing:** Jest + Playwright (TDD required for ALL features)

**Key Concepts:**

1. **Gate-Based Forms (NOT Steps)**
   - Our forms use "gates" (0-3), not "steps"
   - Gates unlock based on data quality, not sequential completion
   - Example: User at Gate 2 can jump to Gate 0 to edit name
   - This is NOT a wizard/stepper pattern

2. **Dr Elena v2 Mortgage Engine**
   - Singapore MAS regulations: TDSR ≤ 55%, MSR ≤ 30%
   - Instant calculations happen at Gate 2 (after property details)
   - Three calculation types:
     - `calculateInstantProfile()` - Quick estimate (Gate 2)
     - `calculateComplianceSnapshot()` - Full validation (Gate 3)
     - `calculateRefinanceOutlook()` - Refinancing scenarios
   - NEVER mock these in tests - use real data fixtures

3. **Singapore Mortgage Context**
   - Property types: HDB (public housing), EC (executive condo), Private, Landed
   - Loan types: New Purchase, Refinance, Equity Loan
   - Typical buyer: 30-40 years old, $5-12k/month income
   - Market data (Q3 2024): HDB ~$500k, Private ~$1.2M, Landed ~$2.5M

4. **Mobile-First Mandate**
   - 60%+ users browse on mobile first
   - Touch targets MUST be 48px+ (WCAG 2.1 Level AAA)
   - Use `inputMode="numeric"` for number inputs (NOT `type="number"`)
   - NO rounded corners (sharp rectangles only - see design system)
   - NO framer-motion (40KB bundle) - use native touch events

5. **Design System: Sophisticated Flow**
   - Reference: Design system tokens in `tailwind.config.ts` (canonical source of truth)
   - Color: 90% monochrome + 10% yellow accent (#FCD34D)
   - ❌ FORBIDDEN: Purple, rounded corners, font-medium/font-bold
   - ✅ ALLOWED: font-light (300), font-normal (400), font-semibold (600)
   - "Rule of One": ONE yellow CTA button per viewport max

### Development Workflow

**Before Starting ANY Task:**
```bash
# 1. Ensure you're on the correct branch
git status  # Should show: On branch fix/progressive-form-calculation-corrections

# 2. Pull latest changes
git pull origin fix/progressive-form-calculation-corrections

# 3. Install dependencies (if needed)
npm install

# 4. Start dev server
npm run dev  # Runs on http://localhost:3000
```

**Test-Driven Development (MANDATORY):**
1. Write FAILING test that validates desired functionality
2. Run test to confirm it fails: `npm test -- <test-file>.test.ts`
3. Write ONLY enough code to make test pass
4. Run test to confirm success
5. Refactor while keeping tests green
6. Commit with descriptive message

**Commit Frequency:**
- Commit after EACH completed sub-task
- Commit message format: `feat: <what you did> (<why it matters>)`
- Example: `feat: add mobile number input with haptic feedback (improves mobile UX)`
- NEVER batch multiple features into one commit

**Code Quality Checklist (BEFORE committing):**
- [ ] No TypeScript errors: `npm run build`
- [ ] No lint errors: `npm run lint`
- [ ] All tests pass: `npm test`
- [ ] No `any` types (use proper TypeScript interfaces)
- [ ] Design system compliance (no rounded corners, correct colors)
- [ ] ABOUTME comments at top of new files (2 lines explaining purpose)
- [ ] No framer-motion or other heavy dependencies

### Testing Instructions

**Running Tests:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- components/forms/__tests__/ProgressiveForm.test.tsx

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

**Expected Test Output Format:**
```
PASS  components/forms/__tests__/MobileNumberInput.test.tsx
  MobileNumberInput
    ✓ should render with label (23ms)
    ✓ should trigger numeric keyboard on mobile (12ms)
    ✓ should format currency with prefix (18ms)
    ✓ should show error state when invalid (15ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.456s
```

**Manual Testing (after automated tests pass):**
1. Open `http://localhost:3000/apply?loanType=new_purchase`
2. Test on mobile viewport: Chrome DevTools → Toggle device toolbar → iPhone 13
3. Verify touch targets are large (use element inspector - should be ≥48px)
4. Test keyboard types: Tap income field → Should show numeric keyboard
5. Test session restore: Fill form partially → Reload page → Data should persist

### Common Pitfalls & Solutions

**Pitfall 1: Confusing Gates with Steps**
- ❌ WRONG: `currentStep`, `nextStep()`, `previousStep()`
- ✅ RIGHT: `currentGate`, `advanceGate()`, `returnToGate(0)`

**Pitfall 2: Using Wrong Input Type**
```tsx
// ❌ WRONG - Breaks comma formatting, poor mobile UX
<input type="number" />

// ✅ RIGHT - Shows numeric keyboard, allows formatting
<input type="text" inputMode="numeric" />
```

**Pitfall 3: Forgetting ABOUTME Comments**
```tsx
// ❌ WRONG - Missing context
export function MobileSelect() { ... }

// ✅ RIGHT - Clear purpose
// ABOUTME: Mobile-optimized selection component using bottom sheet pattern
// ABOUTME: Replaces tiny dropdowns with full-screen selection for better UX
export function MobileSelect() { ... }
```

**Pitfall 4: Adding Rounded Corners**
```tsx
// ❌ WRONG - Violates design system
<button className="rounded-lg bg-[#FCD34D]">Continue</button>

// ✅ RIGHT - Sharp rectangles only
<button className="bg-[#FCD34D]">Continue</button>
```

**Pitfall 5: Mocking Calculation Engine**
```tsx
// ❌ WRONG - Tests mock behavior, not real logic
jest.mock('@/lib/calculations/instant-profile')

// ✅ RIGHT - Use real engine with fixture data
import { calculateInstantProfile } from '@/lib/calculations/instant-profile'
const result = calculateInstantProfile(fixtureData)
expect(result.maxLoanAmount).toBe(400000)
```

### Troubleshooting

**Problem: "Module not found: @/lib/..."**
- **Cause:** TypeScript path alias not resolved
- **Solution:** Restart TypeScript server in VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"

**Problem: "localStorage is not defined"**
- **Cause:** Server-side rendering (SSR) doesn't have localStorage
- **Solution:** Check `typeof window !== 'undefined'` before accessing localStorage

**Problem: Tests fail with "Cannot find module 'react-hook-form'"**
- **Cause:** Missing dev dependencies
- **Solution:** `npm install` then `npm test`

**Problem: Bundle size increased by >50KB**
- **Cause:** Accidentally imported heavy library
- **Solution:** Run `ANALYZE=true npm run build` to identify culprit, remove import

**Problem: Touch targets too small on mobile**
- **Cause:** Forgot to set explicit height
- **Solution:** Add `h-12` or `h-14` class (48px or 56px minimum)

### Getting Help

If you're stuck after trying the troubleshooting steps above:
1. Check existing implementations in `components/forms/` directory
2. Search codebase for similar patterns: `grep -r "useForm" components/`
3. Read the canonical documentation: `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
4. Ask Brent with specific context: "I'm implementing X, tried Y, got error Z"

---

## ✅ COMPLETED: Task 1 - Mobile-First Form Components

**Completed Files:**
- ✅ `components/forms/ProgressiveFormMobile.tsx` - Main mobile form with native touch events
- ✅ `components/forms/mobile/MobileNumberInput.tsx` - Touch-optimized input with haptic feedback
- ✅ `components/forms/mobile/MobileSelect.tsx` - Bottom sheet pattern for selections
- ✅ `components/ErrorBoundary.tsx` - React error boundary for graceful failures

**Commit:** `8578ebd` - "feat: create mobile-first form with native touch events"

**Key Features Implemented:**
- Native touch events (0KB bundle cost vs 40KB framer-motion) ✅
- Haptic feedback on all interactions ✅
- Debounced field changes (300ms) to prevent calculation jank during swipes ✅
- 48px+ touch targets (WCAG compliant) ✅
- Bottom sheet pattern for mobile-native UX ✅
- Error boundaries for graceful degradation ✅
- Proper ARIA labels for accessibility ✅

---

## 🚧 PENDING IMPLEMENTATION

**Timeline:** 2 weeks (no experimentation phase)
**Expected Impact:** 35-45% conversion increase
**Complexity:** Medium
**Risk:** Low (battle-tested patterns, no experimental features)

## Context

Path 2 is the **comprehensive rebuild** that runs in parallel to Path 1 quick wins. This addresses deeper structural issues:

1. **Mobile-first design** - Current form is desktop-optimized, mobile is afterthought
2. **Smart field conditionals** - Show/hide fields based on user context
3. **Intelligent defaults** - Remember sessions, pre-fill common values
4. **A/B testing framework** - Built-in experimentation for continuous optimization

## Architecture Context

### Tech Stack (Same as Path 1)
- **Framework:** Next.js 14 (App Router)
- **Form Library:** React Hook Form
- **Validation:** Zod schemas
- **Styling:** Tailwind CSS (mobile-first approach)
- **Component Library:** Shadcn/ui
- **New:** Experimentation framework (PostHog or similar)

### Files to Create
- `components/forms/ProgressiveFormMobile.tsx` - New mobile-optimized form
- `components/forms/FormFieldConditionals.tsx` - Conditional logic component
- `lib/hooks/useFormSession.ts` - Session persistence hook
- `lib/hooks/useFieldVisibility.ts` - Dynamic field showing/hiding
- `lib/ab-testing/experiments.ts` - A/B test configuration
- `lib/forms/smart-defaults.ts` - Intelligent default values

### Files to Refactor
- `components/forms/ProgressiveFormWithController.tsx` - Extract shared logic
- `hooks/useProgressiveFormController.ts` - Add session persistence
- `lib/forms/form-config.ts` - Add conditional field rules

---

## Task Breakdown

### Task 1: Mobile-First Form Redesign

**Objective:** Create a touch-optimized, mobile-first form experience

**Why This Matters:**
- >60% of mortgage shoppers browse on mobile first
- Current form has small touch targets, tiny fonts
- Desktop-first design punishes mobile users

**Implementation Steps:**

#### 1.1 Create Mobile-Optimized Component Shell

**Create:** `components/forms/ProgressiveFormMobile.tsx`

```tsx
// ABOUTME: Mobile-first progressive mortgage application form with touch optimization
// ABOUTME: Replaces desktop-first ProgressiveFormWithController for mobile viewports

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { getMobileFormSchema } from '@/lib/forms/mobile-schemas'
import type { LoanType } from '@/lib/contracts/form-contracts'

interface ProgressiveFormMobileProps {
  loanType: LoanType
  sessionId: string
  onComplete: (data: any) => void
}

export function ProgressiveFormMobile({
  loanType,
  sessionId,
  onComplete
}: ProgressiveFormMobileProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(getMobileFormSchema(loanType, currentStep))
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className={cn(
              "text-sm text-[#666666]",
              currentStep === 0 && "invisible"
            )}
          >
            ← Back
          </button>
          <div className="text-xs text-[#666666]">
            Step {currentStep + 1} of 3
          </div>
        </div>
      </header>

      {/* Form content */}
      <main className="px-4 py-6">
        {renderMobileStep(currentStep, { register, errors, watch })}
      </main>

      {/* Sticky footer CTA */}
      <footer className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-4 py-3">
        <button
          type="button"
          className="w-full h-12 bg-[#FCD34D] hover:bg-[#FBB614] text-black font-semibold text-base"
          onClick={handleSubmit((data) => {
            if (currentStep < 2) {
              setCurrentStep(prev => prev + 1)
            } else {
              onComplete(data)
            }
          })}
        >
          Continue
        </button>
      </footer>
    </div>
  )
}

function renderMobileStep(
  step: number,
  formMethods: any
) {
  // Implementation in next sub-task
  return null
}
```

**Why:**
- Sticky header/footer keep navigation visible
- Large touch targets (48px minimum)
- Full-screen utilization on mobile
- Simple back button (no complex navigation)

#### 1.2 Design Mobile-Optimized Input Components

**Create:** `components/forms/mobile/MobileNumberInput.tsx`

```tsx
// ABOUTME: Touch-optimized number input with native mobile keyboard
// ABOUTME: Uses inputMode for numeric keyboard without type="number" restrictions

import React from 'react'
import { cn } from '@/lib/utils'

interface MobileNumberInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  prefix?: string
  error?: string
  helperText?: string
}

export function MobileNumberInput({
  label,
  value,
  onChange,
  placeholder,
  prefix = '$',
  error,
  helperText
}: MobileNumberInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black">
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#666666]">
            {prefix}
          </span>
        )}

        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-14 text-2xl font-mono",
            prefix ? "pl-10 pr-4" : "px-4",
            "border-2 border-[#E5E5E5]",
            "focus:border-[#FCD34D] focus:outline-none",
            error && "border-[#EF4444]"
          )}
        />
      </div>

      {error && (
        <p className="text-sm text-[#EF4444]">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-[#666666]">{helperText}</p>
      )}
    </div>
  )
}
```

**Why:**
- `inputMode="numeric"` triggers number keyboard on mobile
- Still allows comma formatting (unlike `type="number"`)
- Extra large text (24px) for easy reading
- Extra large touch target (56px height)
- Clear visual feedback on focus

#### 1.3 Create Dropdown Alternative for Mobile

**Create:** `components/forms/mobile/MobileSelect.tsx`

```tsx
// ABOUTME: Mobile-optimized selection component using bottom sheet pattern
// ABOUTME: Replaces tiny dropdowns with full-screen selection for better UX

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface MobileSelectProps {
  label: string
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (value: string) => void
  error?: string
}

export function MobileSelect({
  label,
  options,
  value,
  onChange,
  error
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-black">
          {label}
        </label>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full h-14 px-4 text-left",
            "border-2 border-[#E5E5E5]",
            "flex items-center justify-between",
            error && "border-[#EF4444]"
          )}
        >
          <span className={cn(
            "text-base",
            selectedOption ? "text-black" : "text-[#666666]"
          )}>
            {selectedOption?.label || "Select an option"}
          </span>
          <span className="text-[#666666]">▼</span>
        </button>

        {error && (
          <p className="text-sm text-[#EF4444]">{error}</p>
        )}
      </div>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#E5E5E5] px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-black">{label}</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#666666]"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#E5E5E5]">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full px-4 py-4 text-left",
                    option.value === value && "bg-[#FCD34D]/10"
                  )}
                >
                  <div className="font-medium text-black">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-[#666666] mt-1">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Why:**
- Bottom sheet pattern is mobile-native UX
- Large touch targets for each option
- Shows descriptions without crowding
- Native feel (like iOS/Android pickers)

#### 1.4 Add Swipe Navigation (✅ COMPLETED with Native Touch Events)

**Implementation:** Native Touch Events (0KB bundle vs 40KB framer-motion)

This was completed in Task 1 using native browser APIs instead of framer-motion. See `components/forms/ProgressiveFormMobile.tsx:80-94` for implementation:

```tsx
// Native touch event detection
const [touchStart, setTouchStart] = useState(0)
const [touchEnd, setTouchEnd] = useState(0)

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.targetTouches[0].clientX)
}

const handleTouchEnd = async () => {
  if (!touchStart || !touchEnd) return

  const delta = touchStart - touchEnd
  const isSwipe = Math.abs(delta) > 100

  if (isSwipe && 'vibrate' in navigator) {
    navigator.vibrate(10) // Haptic feedback
  }

  if (delta > 0) {
    // Swipe left = next
    await goToNextStep()
  } else if (delta < 0) {
    // Swipe right = previous
    goToPreviousStep()
  }
}

return (
  <main
    onTouchStart={handleTouchStart}
    onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
    onTouchEnd={handleTouchEnd}
  >
    {/* form content */}
  </main>
)
```

**Why Native Touch Events:**
- 0KB bundle cost (vs 40KB for framer-motion)
- Haptic feedback with `navigator.vibrate()`
- Better performance on low-end devices
- No external dependencies

**Testing Task 1:**

1. **Create Mobile Test Suite:**

`tests/mobile/form-mobile.test.ts`

```tsx
import { test, expect, devices } from '@playwright/test'

test.use({
  ...devices['iPhone 13'],
})

test.describe('Mobile Form Experience', () => {
  test('should have large touch targets', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Check input height (should be at least 48px)
    const nameInput = page.locator('input[name="name"]')
    const box = await nameInput.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(48)

    // Check button height
    const continueBtn = page.locator('button:has-text("Continue")')
    const btnBox = await continueBtn.boundingBox()
    expect(btnBox?.height).toBeGreaterThanOrEqual(48)
  })

  test('should trigger numeric keyboard', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Navigate to income field
    await page.fill('input[name="name"]', 'Test')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    // Check inputMode attribute
    await page.click('button:has-text("Get instant loan estimate")')
    const incomeInput = page.locator('input[name="actualIncomes.0"]')
    await expect(incomeInput).toHaveAttribute('inputMode', 'numeric')
  })

  test('should support swipe navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/apply')

    // Complete Step 1
    await page.fill('input[name="name"]', 'Test')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="phone"]', '91234567')
    await page.click('button:has-text("Continue")')

    // Swipe left (simulate touch gesture)
    await page.touchscreen.tap(200, 300)
    await page.touchscreen.swipe({ x: 300, y: 300 }, { x: 50, y: 300 })

    // Should advance to next step (if validation passes)
    await expect(page.locator('text=Step 3')).toBeVisible()
  })
})
```

2. **Run Tests:**
```bash
npx playwright test tests/mobile/ --project='Mobile Chrome'
```

**Commit Point:**
```bash
git add components/forms/ProgressiveFormMobile.tsx
git add components/forms/mobile/
git add tests/mobile/
git commit -m "feat: create mobile-first form with touch optimization

- Add ProgressiveFormMobile component with sticky header/footer
- Create MobileNumberInput with inputMode and large touch targets
- Add MobileSelect with bottom sheet pattern
- Implement swipe navigation using framer-motion
- Add mobile-specific test suite

Mobile users now get native-feeling experience with 48px+ touch targets"
```

---

### Task 2: Conditional Field Visibility

**Objective:** Show/hide fields dynamically based on user context to reduce cognitive load

**Why This Matters:**
- Not all fields are relevant to all users
- Showing irrelevant fields = confusion = drop-off
- Smart forms feel personalized

**Implementation Steps:**

#### 2.1 Define Conditional Rules

**Create:** `lib/forms/field-conditionals.ts`

```typescript
// ABOUTME: Conditional logic for showing/hiding form fields based on user context
// ABOUTME: Centralizes all field visibility rules to prevent scattered conditional logic

import type { LoanType, PropertyCategory, FormState } from '@/lib/contracts/form-contracts'

export interface FieldCondition {
  field: string
  showWhen: (formState: Partial<FormState>) => boolean
  requiredWhen?: (formState: Partial<FormState>) => boolean
}

export const fieldConditionals: FieldCondition[] = [
  // Development name only for new launch properties
  {
    field: 'developmentName',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'new_launch',
    requiredWhen: (state) => false // Optional field
  },

  // Unit type only for new launch
  {
    field: 'unitType',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'new_launch',
    requiredWhen: (state) => false
  },

  // TOP date only for new launch
  {
    field: 'topDate',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'new_launch',
    requiredWhen: (state) => false
  },

  // BTO project only for BTO
  {
    field: 'btoProject',
    showWhen: (state) =>
      state.loanType === 'new_purchase' &&
      state.propertyCategory === 'bto',
    requiredWhen: (state) => true // Required for BTO
  },

  // Refinancing goals only for refinance
  {
    field: 'refinancingGoals',
    showWhen: (state) => state.loanType === 'refinance',
    requiredWhen: (state) => true
  },

  // Cash out amount only if "cash_out" is in refinancing goals
  {
    field: 'cashOutAmount',
    showWhen: (state) =>
      state.loanType === 'refinance' &&
      Array.isArray(state.refinancingGoals) &&
      state.refinancingGoals.includes('cash_out'),
    requiredWhen: (state) =>
      state.refinancingGoals?.includes('cash_out') || false
  },

  // Joint applicant fields only if hasJointApplicant = true
  {
    field: 'actualIncomes.1',
    showWhen: (state) => state.hasJointApplicant === true,
    requiredWhen: (state) => state.hasJointApplicant === true
  },
  {
    field: 'actualAges.1',
    showWhen: (state) => state.hasJointApplicant === true,
    requiredWhen: (state) => state.hasJointApplicant === true
  },

  // Employment details only for self-employed or variable income
  {
    field: 'employmentDetails.self-employed',
    showWhen: (state) => state.employmentType === 'self-employed',
    requiredWhen: (state) => state.employmentType === 'self-employed'
  },
  {
    field: 'employmentDetails.variable',
    showWhen: (state) =>
      state.employmentType === 'contract' ||
      state.employmentType === 'variable',
    requiredWhen: (state) =>
      state.employmentType === 'contract' ||
      state.employmentType === 'variable'
  }
]

export function shouldShowField(
  fieldName: string,
  formState: Partial<FormState>
): boolean {
  const condition = fieldConditionals.find(c => c.field === fieldName)
  if (!condition) return true // Show by default if no condition defined
  return condition.showWhen(formState)
}

export function isFieldRequired(
  fieldName: string,
  formState: Partial<FormState>
): boolean {
  const condition = fieldConditionals.find(c => c.field === fieldName)
  if (!condition || !condition.requiredWhen) return false
  return condition.requiredWhen(formState)
}
```

#### 2.2 Create Visibility Hook

**Create:** `lib/hooks/useFieldVisibility.ts`

```typescript
// ABOUTME: React hook for managing conditional field visibility in forms
// ABOUTME: Integrates field-conditionals.ts rules with React Hook Form

import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { shouldShowField, isFieldRequired } from '@/lib/forms/field-conditionals'
import type { FormState } from '@/lib/contracts/form-contracts'

export function useFieldVisibility(control: any) {
  // Watch all form values
  const formState = useWatch({ control }) as Partial<FormState>

  return useMemo(() => ({
    shouldShow: (fieldName: string) => shouldShowField(fieldName, formState),
    isRequired: (fieldName: string) => isFieldRequired(fieldName, formState)
  }), [formState])
}
```

#### 2.3 Apply Conditional Rendering

**Update:** `components/forms/ProgressiveFormWithController.tsx`

Add hook at top of component:

```tsx
import { useFieldVisibility } from '@/lib/hooks/useFieldVisibility'

export function ProgressiveFormWithController({ ... }) {
  const { shouldShow, isRequired } = useFieldVisibility(control)

  // ... rest of component

  // Example: Conditionally render development name field
  return (
    <>
      {shouldShow('developmentName') && (
        <Controller
          name="developmentName"
          control={control}
          rules={{ required: isRequired('developmentName') }}
          render={({ field }) => (
            <div>
              <label>
                Development Name {isRequired('developmentName') && '*'}
              </label>
              <Input {...field} />
            </div>
          )}
        />
      )}
    </>
  )
}
```

**Testing Task 2:**

1. **Unit Tests for Conditional Logic:**

Create: `lib/forms/__tests__/field-conditionals.test.ts`

```typescript
import { shouldShowField, isFieldRequired } from '../field-conditionals'

describe('Field Conditionals', () => {
  describe('Development Name', () => {
    it('should show for new launch properties', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'new_launch' as const
      }

      expect(shouldShowField('developmentName', formState)).toBe(true)
    })

    it('should hide for resale properties', () => {
      const formState = {
        loanType: 'new_purchase' as const,
        propertyCategory: 'resale' as const
      }

      expect(shouldShowField('developmentName', formState)).toBe(false)
    })
  })

  describe('Cash Out Amount', () => {
    it('should show only if cash_out in refinancing goals', () => {
      const formState = {
        loanType: 'refinance' as const,
        refinancingGoals: ['cash_out', 'lower_rate']
      }

      expect(shouldShowField('cashOutAmount', formState)).toBe(true)
    })

    it('should hide if cash_out not selected', () => {
      const formState = {
        loanType: 'refinance' as const,
        refinancingGoals: ['lower_rate']
      }

      expect(shouldShowField('cashOutAmount', formState)).toBe(false)
    })

    it('should be required when shown', () => {
      const formState = {
        loanType: 'refinance' as const,
        refinancingGoals: ['cash_out']
      }

      expect(isFieldRequired('cashOutAmount', formState)).toBe(true)
    })
  })
})
```

2. **Integration Test:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Conditional Fields Integration', () => {
  it('should show development name when new launch selected', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Select new launch category
    fireEvent.change(screen.getByLabelText('Property Category'), {
      target: { value: 'new_launch' }
    })

    // Development name field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Development Name/i)).toBeInTheDocument()
    })
  })
})
```

**Commit Point:**
```bash
git add lib/forms/field-conditionals.ts
git add lib/hooks/useFieldVisibility.ts
git add lib/forms/__tests__/field-conditionals.test.ts
git commit -m "feat: add conditional field visibility based on user context

- Create centralized field conditional logic in field-conditionals.ts
- Add useFieldVisibility hook for React integration
- Implement dynamic show/hide for irrelevant fields
- Add comprehensive test coverage for conditional rules

Reduces average fields shown from 15 to 8-10 based on user context"
```

---

### Task 3: Smart Defaults & Session Persistence

**Objective:** Pre-fill common values and remember user's session to reduce friction

**⚠️ CRITICAL: Use Existing Solutions**

**DO NOT CREATE:**
- ❌ `lib/hooks/useFormSession.ts` - We already have `useLoanApplicationStorage`
- ❌ `lib/hooks/useOfflineQueue.ts` - Unnecessary, form auto-saves
- ❌ `components/OfflineIndicator.tsx` - Simple error UI is sufficient

**USE INSTEAD:**
- ✅ `lib/hooks/useLoanApplicationStorage.ts` - 7-day persistence (113 lines)
- ✅ `lib/utils/session-manager.ts` - Unified storage API (116 lines)
- ✅ `/api/forms/analyze` - Already has graceful degradation (645 lines)

**Total existing infrastructure:** 969 lines of battle-tested code

**See:** `docs/plans/active/PATH2_AMENDMENT_EXISTING_SOLUTIONS.md` for full details

---

**Implementation Steps:**

#### 3.1 Create Smart Defaults System

**Create:** `lib/forms/smart-defaults.ts`

```typescript
// ABOUTME: Intelligent default values based on Singapore mortgage market patterns
// ABOUTME: Reduces user input by pre-filling common scenarios

import type { LoanType, PropertyType } from '@/lib/contracts/form-contracts'

interface SmartDefaultsConfig {
  // Common Singapore mortgage patterns
  defaultPropertyPrice: Record<PropertyType, number>
  defaultAge: number
  defaultIncome: Record<'HDB' | 'EC' | 'Private' | 'Landed', number>
  defaultTenure: number
  defaultRate: number
}

const SMART_DEFAULTS: SmartDefaultsConfig = {
  // Based on Q3 2024 Singapore property market data
  defaultPropertyPrice: {
    HDB: 500000,
    EC: 850000,
    Private: 1200000,
    Landed: 2500000,
    Commercial: 1500000
  },

  // Median age of first-time buyers in Singapore
  defaultAge: 35,

  // Median income for property types (MAS guidelines)
  defaultIncome: {
    HDB: 5000,
    EC: 8000,
    Private: 12000,
    Landed: 20000
  },

  // Most common loan tenure
  defaultTenure: 25,

  // Current market average rate
  defaultRate: 2.8
}

export function getSmartDefaults(
  loanType: LoanType,
  propertyType?: PropertyType,
  existingData?: Partial<any>
) {
  const defaults: any = {}

  // CRITICAL: Validate affordability before suggesting prices
  // Prevents suggesting $1.2M property to someone earning $3k/month
  const userIncome = existingData?.actualIncomes?.['0'] || null
  const suggestedPrice = propertyType ? SMART_DEFAULTS.defaultPropertyPrice[propertyType] : null

  if (suggestedPrice && userIncome) {
    // Quick affordability check using TDSR 55% rule
    // Monthly debt servicing should not exceed 55% of gross income
    const maxMonthlyRepayment = userIncome * 0.55
    const estimatedMonthlyRepayment = (suggestedPrice * 0.75 * 0.028) / 12 // 75% LTV, 2.8% rate

    if (estimatedMonthlyRepayment > maxMonthlyRepayment) {
      // User can't afford suggested price - scale it down
      const affordablePrice = (maxMonthlyRepayment * 12) / (0.75 * 0.028)
      defaults.priceRange = Math.floor(affordablePrice / 10000) * 10000 // Round to nearest $10k
    } else {
      defaults.priceRange = suggestedPrice
    }
  } else if (propertyType && !existingData?.priceRange) {
    // No income data yet - use default price
    defaults.priceRange = SMART_DEFAULTS.defaultPropertyPrice[propertyType]
  }

  // Income based on property type (only if not already filled)
  if (propertyType && !existingData?.actualIncomes?.['0']) {
    const incomeKey = propertyType as keyof typeof SMART_DEFAULTS.defaultIncome
    defaults.actualIncomes = {
      0: SMART_DEFAULTS.defaultIncome[incomeKey] || 5000
    }
  }

  // Age
  if (!existingData?.combinedAge) {
    defaults.combinedAge = SMART_DEFAULTS.defaultAge
  }

  // Refinance-specific defaults
  if (loanType === 'refinance') {
    if (!existingData?.currentRate) {
      defaults.currentRate = 3.5 // Assume higher rate (why they're refinancing)
    }
    if (!existingData?.remainingTenure) {
      defaults.remainingTenure = 20
    }
  }

  return defaults
}

// Location-based defaults (future enhancement)
export function getLocationBasedDefaults(postalCode?: string) {
  if (!postalCode) return {}

  // Map postal code to district
  const district = getDistrictFromPostal(postalCode)

  // Different defaults for District 9/10/11 (prime areas)
  const isPrime = ['09', '10', '11'].includes(district)

  return {
    propertyType: isPrime ? 'Private' : 'HDB',
    priceRange: isPrime ? 1500000 : 500000
  }
}

function getDistrictFromPostal(postal: string): string {
  // Singapore postal code logic
  const firstTwo = postal.slice(0, 2)
  // Simplified mapping (full implementation needed)
  return firstTwo
}
```

#### 3.2 Use Existing Session Persistence

**IMPORTANT:** We already have a battle-tested session persistence system - DO NOT create new storage hooks.

**Use:** `lib/hooks/useLoanApplicationStorage.ts` (113 lines, 7-day persistence)

**Why this is better:**
- ✅ Already tested and deployed in production
- ✅ 7-day expiry (vs proposed 24-hour)
- ✅ Version control with automatic migration
- ✅ Auto-cleanup of old sessions
- ✅ SSR-safe with proper `typeof window` checks

**Implementation:**

**Update:** `hooks/useProgressiveFormController.ts`

```typescript
import { useLoanApplicationStorage, retrieveLoanApplicationData, clearLoanApplicationData } from '@/lib/hooks/useLoanApplicationStorage'
import { getSmartDefaults } from '@/lib/forms/smart-defaults'

export function useProgressiveFormController({ sessionId, loanType, ... }) {
  // Restore persisted data on mount
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      const restoredData = retrieveLoanApplicationData(sessionId)
      if (restoredData) {
        // Restore form values
        Object.keys(restoredData).forEach(key => {
          setValue(key, restoredData[key])
        })
      }
      setInitialized(true)
    }
  }, [initialized, sessionId, setValue])

  // Auto-save using existing hook (7-day persistence)
  useLoanApplicationStorage(getValues(), sessionId)

  // Apply smart defaults with affordability validation
  const smartDefaults = useMemo(() => {
    const propertyType = watch('propertyType')
    const existingData = getValues()
    return getSmartDefaults(loanType, propertyType, existingData)
  }, [loanType, watch('propertyType'), watch('actualIncomes.0')])

  useEffect(() => {
    if (smartDefaults.priceRange && !getValues('priceRange')) {
      setValue('priceRange', smartDefaults.priceRange)
    }
  }, [smartDefaults, setValue, getValues])

  // Clear session on completion
  const handleComplete = useCallback((data: any) => {
    clearLoanApplicationData(sessionId)
    onFormComplete?.(data)
  }, [sessionId, onFormComplete])
}
```

#### 3.3 Handle Submission Failures Gracefully

**IMPORTANT:** NO offline queue needed - form data is already auto-saved via `useLoanApplicationStorage`.

**Why NO offline queue:**
- ✅ Form data auto-saves to localStorage on every change
- ✅ On page reload, data auto-restores via `retrieveLoanApplicationData()`
- ✅ Simple retry button for failed submissions
- ✅ No complex queue management or duplicate submission risk
- ✅ `/api/forms/analyze` already has graceful degradation built-in

**Implementation:**

**Update:** `app/apply/page.tsx` (or wherever form submission happens)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearLoanApplicationData } from '@/lib/hooks/useLoanApplicationStorage'

export default function ApplyPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/forms/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          metadata: {
            sessionId,
            submissionPoint: 'gate3',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      const result = await response.json()

      // Success - clear persisted data and redirect
      clearLoanApplicationData(sessionId)
      router.push('/chat')

    } catch (error) {
      // Data is ALREADY saved via useLoanApplicationStorage
      // Just show friendly error message
      setSubmitError(
        'Unable to submit right now. Your data is saved - please try again in a moment.'
      )
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {submitError && (
        <div className="bg-[#EF4444] text-white p-4 mb-4">
          {submitError}
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="ml-4 underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* ... rest of form ... */}
    </form>
  )
}
```

#### 3.4 Summary: Existing Solutions Used

**What we're using from the codebase:**
- ✅ `useLoanApplicationStorage` - 7-day persistence with version control (113 lines)
- ✅ `retrieveLoanApplicationData` - Restore sessions on page load
- ✅ `clearLoanApplicationData` - Clean up on successful submission
- ✅ `sessionManager` - Unified sessionStorage API (116 lines)
- ✅ `/api/forms/analyze` - Already has graceful degradation (645 lines)

**Total existing infrastructure:** 969 lines of battle-tested code

**What we're NOT creating:**
- ❌ NO `useFormSession.ts` - redundant, use `useLoanApplicationStorage`
- ❌ NO `useOfflineQueue.ts` - unnecessary complexity
- ❌ NO `OfflineIndicator.tsx` - simple error UI is sufficient

**Files to reference (not create):**
| File | Purpose | Lines |
|------|---------|-------|
| `lib/hooks/useLoanApplicationStorage.ts` | Form persistence | 113 |
| `lib/hooks/useChatSessionStorage.ts` | Chat persistence | 95 |
| `lib/utils/session-manager.ts` | Unified storage API | 116 |
| `app/api/forms/analyze/route.ts` | Submission handling | 645 |

**Testing Task 3:**

1. **Test Smart Defaults:**

Create: `lib/forms/__tests__/smart-defaults.test.ts`

```typescript
import { getSmartDefaults } from '../smart-defaults'

describe('Smart Defaults', () => {
  it('should provide HDB defaults for HDB property', () => {
    const defaults = getSmartDefaults('new_purchase', 'HDB')

    expect(defaults.priceRange).toBe(500000)
    expect(defaults.actualIncomes[0]).toBe(5000)
  })

  it('should provide higher defaults for private property', () => {
    const defaults = getSmartDefaults('new_purchase', 'Private')

    expect(defaults.priceRange).toBe(1200000)
    expect(defaults.actualIncomes[0]).toBe(12000)
  })

  it('should validate affordability before suggesting price', () => {
    const existingData = { actualIncomes: { '0': 3000 } } // Low income
    const defaults = getSmartDefaults('new_purchase', 'Private', existingData)

    // Should scale down from 1.2M to affordable amount
    expect(defaults.priceRange).toBeLessThan(1200000)
  })

  it('should not override existing data', () => {
    const existing = { priceRange: 600000 }
    const defaults = getSmartDefaults('new_purchase', 'HDB', existing)

    expect(defaults.priceRange).toBeUndefined()
  })
})
```

2. **Test Session Persistence (EXISTING TESTS):**

**IMPORTANT:** The session persistence is already tested in `lib/hooks/__tests__/useLoanApplicationStorage.test.ts`

If that test file doesn't exist yet, create it:

```typescript
import { renderHook } from '@testing-library/react-hooks'
import { useLoanApplicationStorage, retrieveLoanApplicationData, clearLoanApplicationData } from '../useLoanApplicationStorage'

describe('Loan Application Storage (EXISTING)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should persist form data with 7-day expiry', () => {
    const mockData = {
      loanType: 'new_purchase',
      propertyType: 'HDB',
      priceRange: 500000
    }

    renderHook(() => useLoanApplicationStorage(mockData, 'test-123'))

    // Data should be in localStorage
    const stored = localStorage.getItem('nextnest_loan_application_test-123')
    expect(stored).toBeTruthy()

    // Should have version and timestamp
    const parsed = JSON.parse(stored!)
    expect(parsed.version).toBe('1.0')
    expect(parsed.lastUpdated).toBeTruthy()
  })

  it('should restore data on page reload', () => {
    const originalData = {
      loanType: 'refinance',
      outstandingLoan: 300000
    }

    // Simulate save
    renderHook(() => useLoanApplicationStorage(originalData, 'test-456'))

    // Simulate page reload
    const restored = retrieveLoanApplicationData('test-456')

    expect(restored).toEqual(originalData)
  })

  it('should expire data after 7 days', () => {
    // Mock old timestamp
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 8)

    localStorage.setItem('nextnest_loan_application_old', JSON.stringify({
      loanType: 'new_purchase',
      version: '1.0',
      lastUpdated: sevenDaysAgo.toISOString()
    }))

    // Trigger cleanup
    renderHook(() => useLoanApplicationStorage({}, 'new-session'))

    // Old data should be removed
    expect(localStorage.getItem('nextnest_loan_application_old')).toBeNull()
  })
})
```

**Commit Point:**
```bash
git add lib/forms/smart-defaults.ts
git add lib/forms/__tests__/smart-defaults.test.ts
git add hooks/useProgressiveFormController.ts
git commit -m "feat: add smart defaults with existing storage integration

- Create intelligent defaults based on Singapore market data
- Integrate with EXISTING useLoanApplicationStorage (7-day persistence)
- Add affordability validation to prevent unrealistic suggestions
- Auto-fill property prices and income based on property type
- Restore incomplete sessions via retrieveLoanApplicationData()
- Handle submission failures with simple retry UI (no offline queue)

Uses 969 lines of existing battle-tested storage code instead of creating new hooks.
Reduces average user input by 40% through smart pre-filling."
```

---

### Task 4: A/B Testing Framework

**Objective:** Enable data-driven optimization through built-in experimentation

**Implementation Steps:**

#### 4.1 Install Analytics/Experiment Tool

**Choose One:**

**Option A: PostHog (Recommended)**
```bash
npm install posthog-js
```

**Option B: Statsig**
```bash
npm install statsig-js
```

**Option C: Custom (if budget constrained)**
Use existing analytics + simple bucketing

#### 4.2 Create Experiment Configuration

**Create:** `lib/ab-testing/experiments.ts`

```typescript
// ABOUTME: A/B test experiment definitions for lead form optimization
// ABOUTME: Centralized config for all active experiments with feature flags

export interface Experiment {
  id: string
  name: string
  variants: {
    control: string
    treatment: string | string[]
  }
  allocation: number // % of users in experiment
  active: boolean
}

export const ACTIVE_EXPERIMENTS: Experiment[] = [
  {
    id: 'step2_cta_copy',
    name: 'Step 2 CTA Button Copy',
    variants: {
      control: 'Get instant loan estimate',
      treatment: [
        'See your max loan amount',
        'Calculate my borrowing power',
        'Continue to financial details'
      ]
    },
    allocation: 100,
    active: true
  },
  {
    id: 'instant_calc_timing',
    name: 'When to Show Instant Calculation',
    variants: {
      control: 'auto', // Show automatically
      treatment: 'on_demand' // Show on button click
    },
    allocation: 50,
    active: true
  },
  {
    id: 'field_order_step3',
    name: 'Step 3 Field Order',
    variants: {
      control: 'income_first', // Ask income before age
      treatment: 'age_first' // Ask age before income
    },
    allocation: 50,
    active: true
  },
  {
    id: 'trust_signal_position',
    name: 'Trust Signal Display Position',
    variants: {
      control: 'top', // Show at top of form
      treatment: 'inline' // Show next to relevant fields
    },
    allocation: 50,
    active: false // Not yet ready
  }
]

export function getActiveVariant(experimentId: string, userId: string): string {
  const experiment = ACTIVE_EXPERIMENTS.find(e => e.id === experimentId)
  if (!experiment || !experiment.active) {
    return 'control'
  }

  // Simple hash-based bucketing (deterministic)
  const hash = simpleHash(userId + experimentId)
  const bucket = hash % 100

  // Check if user is in experiment allocation
  if (bucket >= experiment.allocation) {
    return 'control'
  }

  // If treatment is array, distribute evenly
  if (Array.isArray(experiment.variants.treatment)) {
    const treatmentIndex = bucket % experiment.variants.treatment.length
    return experiment.variants.treatment[treatmentIndex]
  }

  return experiment.variants.treatment
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
```

#### 4.3 Create Experiment Hook

**Create:** `lib/hooks/useExperiment.ts`

```typescript
// ABOUTME: React hook for accessing A/B test variants in components
// ABOUTME: Handles experiment allocation, tracking, and variant rendering

import { useMemo, useEffect } from 'react'
import { getActiveVariant } from '@/lib/ab-testing/experiments'
import { trackEvent } from '@/lib/analytics/events'

export function useExperiment(experimentId: string, userId: string) {
  const variant = useMemo(
    () => getActiveVariant(experimentId, userId),
    [experimentId, userId]
  )

  // Track experiment exposure
  useEffect(() => {
    trackEvent('experiment_exposure', {
      experimentId,
      variant,
      userId
    })
  }, [experimentId, variant, userId])

  return variant
}

// Utility hook for rendering variant-specific content
export function useVariantContent<T extends Record<string, any>>(
  experimentId: string,
  userId: string,
  contentMap: T
): T[keyof T] {
  const variant = useExperiment(experimentId, userId)
  return contentMap[variant] || contentMap.control
}
```

#### 4.4 Apply Experiments to Form

**Update:** `components/forms/ProgressiveFormWithController.tsx`

```tsx
import { useExperiment, useVariantContent } from '@/lib/hooks/useExperiment'

export function ProgressiveFormWithController({ sessionId, ... }) {
  // Experiment: Step 2 CTA copy
  const step2CtaText = useVariantContent(
    'step2_cta_copy',
    sessionId,
    {
      control: 'Get instant loan estimate',
      'See your max loan amount': 'See your max loan amount →',
      'Calculate my borrowing power': 'Calculate my borrowing power',
      'Continue to financial details': 'Continue to financial details'
    }
  )

  // Experiment: Instant calc timing
  const calcTiming = useExperiment('instant_calc_timing', sessionId)
  const showCalcAutomatically = calcTiming === 'auto'

  return (
    <div>
      {/* ... */}

      {/* Step 2 CTA uses experiment variant */}
      <Button type="submit">
        {step2CtaText}
      </Button>

      {/* Instant calc respects timing experiment */}
      {showCalcAutomatically ? (
        instantCalcResult && <CalcResult {...instantCalcResult} />
      ) : (
        <button onClick={() => setShowCalc(true)}>
          See your max loan amount →
        </button>
      )}
    </div>
  )
}
```

#### 4.5 Add Conversion Tracking

**Create:** `lib/analytics/events.ts`

```typescript
// ABOUTME: Analytics event tracking for form interactions and conversions
// ABOUTME: Integrates with PostHog/Statsig for A/B test analysis

export function trackEvent(
  eventName: string,
  properties: Record<string, any>
) {
  // PostHog example
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, properties)
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties)
  }
}

// Form-specific events
export const FormEvents = {
  STEP_STARTED: 'form_step_started',
  STEP_COMPLETED: 'form_step_completed',
  FIELD_CHANGED: 'form_field_changed',
  INSTANT_CALC_VIEWED: 'instant_calc_viewed',
  INSTANT_CALC_CLICKED: 'instant_calc_button_clicked',
  FORM_ABANDONED: 'form_abandoned',
  FORM_COMPLETED: 'form_completed',
  BROKER_MATCHED: 'broker_matched'
}
```

**Testing Task 4:**

1. **Test Experiment Bucketing:**

```typescript
import { getActiveVariant } from '../experiments'

describe('A/B Test Bucketing', () => {
  it('should return consistent variant for same user', () => {
    const userId = 'user-123'
    const variant1 = getActiveVariant('step2_cta_copy', userId)
    const variant2 = getActiveVariant('step2_cta_copy', userId)

    expect(variant1).toBe(variant2)
  })

  it('should distribute users across variants', () => {
    const variants = new Set()

    for (let i = 0; i < 1000; i++) {
      const variant = getActiveVariant('step2_cta_copy', `user-${i}`)
      variants.add(variant)
    }

    // Should have multiple variants
    expect(variants.size).toBeGreaterThan(1)
  })

  it('should return control for inactive experiments', () => {
    const variant = getActiveVariant('trust_signal_position', 'user-123')
    expect(variant).toBe('control')
  })
})
```

2. **Integration Test:**

```tsx
import { render, screen } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

// Mock experiment hook
jest.mock('@/lib/hooks/useExperiment', () => ({
  useVariantContent: jest.fn((experimentId, userId, contentMap) => {
    return contentMap['See your max loan amount']
  })
}))

describe('A/B Test Integration', () => {
  it('should render treatment variant CTA', () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-123"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    expect(screen.getByText('See your max loan amount →')).toBeInTheDocument()
  })
})
```

**Commit Point:**
```bash
git add lib/ab-testing/experiments.ts
git add lib/hooks/useExperiment.ts
git add lib/analytics/events.ts
git commit -m "feat: add A/B testing framework for continuous optimization

- Create experiment configuration system
- Add useExperiment hook for variant allocation
- Implement conversion event tracking
- Add experiments for CTA copy and calc timing
- Include comprehensive test coverage

Enables data-driven optimization with zero manual intervention"
```

---

## Integration & Testing

### Task 5: Progressive Rollout Strategy

**Objective:** Safely deploy Path 2 changes using feature flags

**Implementation Steps:**

#### 5.1 Add Feature Flag System

**Create:** `lib/feature-flags.ts`

```typescript
// ABOUTME: Feature flag system for progressive rollout of Path 2 changes
// ABOUTME: Allows safe deployment with instant rollback capability

export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercentage: number
  allowlist?: string[] // User IDs or emails
}

const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  mobile_first_form: {
    key: 'mobile_first_form',
    enabled: false,
    rolloutPercentage: 0,
    allowlist: [] // Add test user emails
  },
  conditional_fields: {
    key: 'conditional_fields',
    enabled: true,
    rolloutPercentage: 50
  },
  smart_defaults: {
    key: 'smart_defaults',
    enabled: true,
    rolloutPercentage: 100
  },
  ab_testing: {
    key: 'ab_testing',
    enabled: true,
    rolloutPercentage: 100
  }
}

export function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  userEmail?: string
): boolean {
  const flag = FEATURE_FLAGS[flagKey]
  if (!flag) return false

  // Check if explicitly disabled
  if (!flag.enabled) return false

  // Check allowlist
  if (flag.allowlist && (userId || userEmail)) {
    if (
      flag.allowlist.includes(userId || '') ||
      flag.allowlist.includes(userEmail || '')
    ) {
      return true
    }
  }

  // Check rollout percentage
  if (userId) {
    const hash = simpleHash(userId + flagKey)
    const bucket = hash % 100
    return bucket < flag.rolloutPercentage
  }

  return flag.rolloutPercentage === 100
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}
```

#### 5.2 Conditional Component Rendering

**Update:** `app/apply/page.tsx`

```tsx
import { isFeatureEnabled } from '@/lib/feature-flags'
import { ProgressiveFormWithController } from '@/components/forms/ProgressiveFormWithController'
import { ProgressiveFormMobile } from '@/components/forms/ProgressiveFormMobile'

export default function ApplyPage() {
  const [sessionId] = useState(generateSessionId())
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const useMobileForm =
    isMobile &&
    isFeatureEnabled('mobile_first_form', sessionId)

  return (
    <main>
      {useMobileForm ? (
        <ProgressiveFormMobile
          loanType={loanType}
          sessionId={sessionId}
          onComplete={handleComplete}
        />
      ) : (
        <ProgressiveFormWithController
          loanType={loanType}
          sessionId={sessionId}
          onStepCompletion={handleStepCompletion}
          onAIInsight={handleAIInsight}
          onScoreUpdate={handleScoreUpdate}
        />
      )}
    </main>
  )
}
```

### Task 6: Comprehensive Testing

**Create:** `tests/e2e/path2-integration.test.ts`

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('Path 2 Complete Flow', () => {
  test.use({
    ...devices['iPhone 13'],
  })

  test('should complete mobile form with conditional fields', async ({ page }) => {
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

    await page.click('button:has-text("Continue")')

    // Step 3: Financial Details
    const incomeInput = page.locator('input[name="actualIncomes.0"]')
    const defaultIncome = await incomeInput.inputValue()
    expect(defaultIncome).toBeTruthy() // Should be pre-filled

    await page.click('button:has-text("Connect with AI Mortgage Specialist")')

    // Should reach broker match screen
    await expect(page.locator('text=AI BROKER MATCHED')).toBeVisible()
  })

  test('should restore session after page reload', async ({ page, context }) => {
    await page.goto('http://localhost:3000/apply')

    // Fill partial data
    await page.fill('input[name="name"]', 'Session Test')
    await page.fill('input[name="email"]', 'session@test.com')

    // Reload page
    await page.reload()

    // Data should be restored
    await expect(page.locator('input[name="name"]')).toHaveValue('Session Test')
    await expect(page.locator('input[name="email"]')).toHaveValue('session@test.com')
  })

  test('should respect A/B test variant', async ({ page }) => {
    // Mock experiment to return specific variant
    await page.addInitScript(() => {
      (window as any).__EXPERIMENTS__ = {
        'step2_cta_copy': 'See your max loan amount'
      }
    })

    await page.goto('http://localhost:3000/apply')

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
})
```

### Task 7: Documentation

**Update:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`

Add Path 2 section:

```markdown
## Path 2 Enhancements

### Mobile-First Form
- Location: `components/forms/ProgressiveFormMobile.tsx`
- Trigger: Viewport < 768px + feature flag enabled
- Features:
  - Touch-optimized inputs (48px minimum)
  - Bottom sheet selectors
  - Swipe navigation
  - Sticky header/footer

### Conditional Fields
- Configuration: `lib/forms/field-conditionals.ts`
- Hook: `lib/hooks/useFieldVisibility.ts`
- Logic: Show/hide fields based on user answers
- Example: Development name only for new launch properties

### Smart Defaults
- Configuration: `lib/forms/smart-defaults.ts`
- Based on Singapore market data
- Property type determines default price and income
- Location-aware (future enhancement)

### Session Persistence
- Hook: `lib/hooks/useFormSession.ts`
- Storage: localStorage with 24hr expiry
- Auto-save: 500ms debounce
- Restore: On page reload or return visit

### A/B Testing
- Config: `lib/ab-testing/experiments.ts`
- Hook: `lib/hooks/useExperiment.ts`
- Active experiments:
  - Step 2 CTA copy (4 variants)
  - Instant calc timing (auto vs on-demand)
  - Step 3 field order (income vs age first)

### Feature Flags
- Config: `lib/feature-flags.ts`
- Rollout: Percentage-based + allowlist
- Flags:
  - `mobile_first_form`: 0% (testing only)
  - `conditional_fields`: 50%
  - `smart_defaults`: 100%
  - `ab_testing`: 100%
```

### Task 8: Rollout Checklist

1. **Week 1: Internal Testing**
   - [ ] Enable `mobile_first_form` for team emails (allowlist)
   - [ ] Test on real devices (iPhone, Android, iPad)
   - [ ] Fix any critical bugs
   - [ ] Run full test suite

2. **Week 2: Beta Rollout (10%)**
   - [ ] Set `mobile_first_form` rollout to 10%
   - [ ] Monitor error rates
   - [ ] Track conversion metrics
   - [ ] Gather user feedback

3. **Week 2-3: Gradual Increase**
   - [ ] Day 1-2: 25% rollout
   - [ ] Day 3-4: 50% rollout
   - [ ] Day 5-6: 75% rollout
   - [ ] Day 7: 100% rollout

4. **Week 3: Full Launch**
   - [ ] All users on Path 2
   - [ ] Remove Path 1 code (deprecate)
   - [ ] Document learnings
   - [ ] Plan Path 3 improvements

**Commit Point:**
```bash
git add lib/feature-flags.ts
git add tests/e2e/path2-integration.test.ts
git add docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md
git commit -m "feat: add progressive rollout system for Path 2

- Create feature flag system with percentage rollout
- Add comprehensive E2E tests for all Path 2 features
- Document mobile-first form, conditionals, and A/B testing
- Define 3-week rollout plan with monitoring checkpoints

Enables safe deployment with instant rollback capability"
```

---

## Success Metrics (Path 2)

Track these additional metrics:

1. **Mobile Conversion Rate:**
   - **Baseline:** Current mobile conversion
   - **Target:** +40% increase
   - **Measure:** Mobile completions / Mobile starts

2. **Fields Shown Per User:**
   - **Baseline:** ~15 fields average
   - **Target:** 8-10 fields (conditional hiding)
   - **Measure:** Avg visible fields per session

3. **Session Restoration Rate:**
   - **New Metric:** % of users who return and restore
   - **Target:** >30% of incomplete sessions
   - **Measure:** Restored sessions / Total incomplete

4. **Smart Default Acceptance:**
   - **New Metric:** % of pre-filled values kept
   - **Target:** >70% acceptance
   - **Measure:** Unchanged defaults / Total defaults shown

5. **A/B Test Winners:**
   - Track winning variants
   - Document learnings
   - Apply winners to 100% traffic

---

## Risk Mitigation

### Technical Risks

1. **localStorage Quota Exceeded:**
   - **Mitigation:** Implement storage cleanup
   - **Fallback:** Server-side session storage

2. **Mobile Browser Compatibility:**
   - **Mitigation:** Test on Safari iOS, Chrome Android
   - **Fallback:** Graceful degradation to Path 1

3. **A/B Test Variant Pollution:**
   - **Mitigation:** Clear allocation on experiment end
   - **Fallback:** Manual user re-bucketing

### Product Risks

1. **User Confusion from Experiments:**
   - **Mitigation:** Limit to 2 active experiments max
   - **Fallback:** Pause experiments if bounce increases

2. **Over-Optimization:**
   - **Mitigation:** Focus on high-impact changes only
   - **Fallback:** Revert if metrics don't improve in 2 weeks

---

## Next Steps

After Path 2 success:

1. **Voice Input** (Path 3A)
   - "Say your income instead of typing"
   - Singapore English accent support

2. **Instant Approval Indicator** (Path 3B)
   - Show approval likelihood in real-time
   - MAS compliance pre-check

3. **Multi-Property Comparison** (Path 3C)
   - Compare up to 3 properties side-by-side
   - Smart recommendations

4. **WhatsApp Integration** (Path 3D)
   - Continue application via WhatsApp
   - Singapore's preferred messaging platform
