# Task 1: Mobile-First Form Components

**Status:** ✅ COMPLETED
**Commit:** `8578ebd` - "feat: create mobile-first form with native touch events"
**Completion Date:** 2025-10-17

[← Back to Index](../00-INDEX.md) | [Next: Task 2 →](task-2-conditional-fields.md)

---

## Overview

**Objective:** Create a touch-optimized, mobile-first form experience

**Why This Matters:**
- >60% of mortgage shoppers browse on mobile first
- Current form has small touch targets, tiny fonts
- Desktop-first design punishes mobile users

**Files Created:**
- ✅ `components/forms/ProgressiveFormMobile.tsx` - Main mobile form with native touch events
- ✅ `components/forms/mobile/MobileNumberInput.tsx` - Touch-optimized input with haptic feedback
- ✅ `components/forms/mobile/MobileSelect.tsx` - Bottom sheet pattern for selections
- ✅ `components/ErrorBoundary.tsx` - React error boundary for graceful failures

---

## Implementation Steps

### 1.1 Create Mobile-Optimized Component Shell

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

---

### 1.2 Design Mobile-Optimized Input Components

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

---

### 1.3 Create Dropdown Alternative for Mobile

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

---

### 1.4 Add Swipe Navigation (✅ COMPLETED with Native Touch Events)

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

---

## Testing

### Test Suite

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

### Run Tests

```bash
npx playwright test tests/mobile/ --project='Mobile Chrome'
```

---

## Key Features Implemented

- Native touch events (0KB bundle cost vs 40KB framer-motion) ✅
- Haptic feedback on all interactions ✅
- Debounced field changes (300ms) to prevent calculation jank during swipes ✅
- 48px+ touch targets (WCAG compliant) ✅
- Bottom sheet pattern for mobile-native UX ✅
- Error boundaries for graceful degradation ✅
- Proper ARIA labels for accessibility ✅

---

## Commit Information

```bash
git add components/forms/ProgressiveFormMobile.tsx
git add components/forms/mobile/
git add tests/mobile/
git commit -m "feat: create mobile-first form with touch optimization

- Add ProgressiveFormMobile component with sticky header/footer
- Create MobileNumberInput with inputMode and large touch targets
- Add MobileSelect with bottom sheet pattern
- Implement swipe navigation using native touch events
- Add mobile-specific test suite

Mobile users now get native-feeling experience with 48px+ touch targets"
```

**Actual Commit:** `8578ebd` - "feat: create mobile-first form with native touch events"

---

[← Back to Index](../00-INDEX.md) | [Next: Task 2 →](task-2-conditional-fields.md)
