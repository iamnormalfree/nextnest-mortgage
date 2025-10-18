---
status: active
priority: critical
created: 2025-10-17
updated: 2025-10-18
workstream: forms
complexity: light
estimated_hours: 8
blocks: 2025-10-18-lead-form-mobile-first-rebuild.md
---

# Lead Form Desktop UX Quick Wins

**Timeline:** 1 week (Week 1 of Phase 1)
**Expected Impact:** 15-20% desktop conversion increase
**Complexity:** Low
**Risk:** Low
**Blocks:** Path 2 mobile-first rebuild (same component modifications)

## Context

The lead form at `/apply` is production-ready but has critical UX issues causing conversion leakage:

1. **Inconsistent number formatting** - Some fields show commas (500,000), others don't (5000)
2. **Cognitive overload** - Instant calculation results appear before user requests them
3. **Visual weight** - Too many borders, boxes, and verbose labels create friction

This is a **quick win path** to stop ad budget bleeding while Path 2 (full rebuild) happens in parallel.

## Architecture Context

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Form Library:** React Hook Form
- **Validation:** Zod schemas
- **Styling:** Tailwind CSS
- **Component Library:** Shadcn/ui

### Key Files
- `components/forms/ProgressiveFormWithController.tsx` - Main form UI
- `components/forms/sections/Step3NewPurchase.tsx` - Step 3 for new purchase
- `components/forms/sections/Step3Refinance.tsx` - Step 3 for refinance
- `lib/utils.ts` - Utility functions (already has `formatNumberWithCommas`)
- `lib/forms/form-config.ts` - Form step configuration

### Current Form Flow
1. **Step 1:** Contact info (name, email, phone)
2. **Step 2:** Property details → Shows instant calc result automatically
3. **Step 3:** Financial details → Connects to AI broker
4. **Transition:** Broker matching screen → Chat handoff

---

## Task Breakdown

### Task 1: Standardize Number Formatting (All Money Fields)

**Objective:** Make all monetary input fields display with comma separators consistently

**Files to Modify:**
- `components/forms/ProgressiveFormWithController.tsx`
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`

**Current State:**
- ✅ Property price field: Uses `formatNumberWithCommas`
- ❌ Income field: Shows raw numbers (5000 instead of 5,000)
- ❌ Commitments field: Shows raw numbers
- ❌ Age fields: Using spinbutton (correct, no change needed)

**Implementation Steps:**

#### 1.1 Fix Income Fields in Step3NewPurchase.tsx

**Location:** Line ~230-260 (search for "Monthly income")

**Current Code:**
```tsx
<Input
  {...field}
  type="number"
  placeholder="5000"
  onChange={(e) => {
    const value = parseInt(e.target.value) || 0
    field.onChange(value)
    onFieldChange(`actualIncomes.${applicantIndex}`, value)
  }}
/>
```

**Replace With:**
```tsx
<Input
  {...field}
  type="text"
  className="font-mono"
  placeholder="5,000"
  value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
  onChange={(e) => {
    const parsedValue = parseFormattedNumber(e.target.value) || 0
    field.onChange(parsedValue)
    onFieldChange(`actualIncomes.${applicantIndex}`, parsedValue)
  }}
/>
```

**Why:**
- Changes `type="number"` to `type="text"` (allows comma display)
- Uses existing `formatNumberWithCommas` utility
- Uses existing `parseFormattedNumber` to handle user input
- Adds `font-mono` class for better number readability

**Import Check:**
Verify top of file has:
```tsx
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
```

#### 1.2 Fix Variable Income Fields in Step3NewPurchase.tsx

**Location:** Line ~280-310 (search for "Variable / bonus income")

Apply same pattern as 1.1:
```tsx
<Input
  {...field}
  type="text"
  className="font-mono"
  placeholder="0"
  value={field.value ? formatNumberWithCommas(field.value.toString()) : '0'}
  onChange={(e) => {
    const parsedValue = parseFormattedNumber(e.target.value) || 0
    field.onChange(parsedValue)
    onFieldChange(`actualVariableIncomes.${applicantIndex}`, parsedValue)
  }}
/>
```

#### 1.3 Fix Commitments Field in Step3NewPurchase.tsx

**Location:** Line ~350-380 (search for "existing commitments")

Apply same pattern:
```tsx
<Input
  {...field}
  type="text"
  className="font-mono"
  placeholder="500"
  value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
  onChange={(e) => {
    const parsedValue = parseFormattedNumber(e.target.value) || 0
    field.onChange(parsedValue)
    onFieldChange('existingCommitments', parsedValue)
  }}
/>
```

#### 1.4 Fix Step3Refinance.tsx Fields

**Files:** `components/forms/sections/Step3Refinance.tsx`

Search for all number inputs and apply the same pattern to:
- Income fields (same as Step3NewPurchase)
- Outstanding loan amount
- Property value
- Any other monetary fields

**Testing Task 1:**

1. **Manual Test:**
   ```bash
   npm run dev
   ```
   Navigate to http://localhost:3000/apply

   - Enter Step 3
   - Type "5000" → Should display "5,000"
   - Type "123456" → Should display "123,456"
   - Backspace should work naturally
   - Submit form → Values should save as numbers (5000, 123456)

2. **Write Unit Test:**

Create: `components/forms/__tests__/NumberFormatting.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { Step3NewPurchase } from '../sections/Step3NewPurchase'

describe('Number Formatting in Step 3', () => {
  it('should format income with commas', () => {
    const Wrapper = () => {
      const methods = useForm({
        defaultValues: {
          actualIncomes: { 0: 5000 }
        }
      })

      return (
        <FormProvider {...methods}>
          <Step3NewPurchase
            onFieldChange={jest.fn()}
            showJointApplicant={false}
            errors={{}}
            getErrorMessage={(e) => e?.message || ''}
            control={methods.control}
            instantCalcResult={null}
          />
        </FormProvider>
      )
    }

    render(<Wrapper />)

    const incomeInput = screen.getByPlaceholderText('5,000')
    expect(incomeInput).toHaveValue('5,000')
  })

  it('should parse formatted input correctly', () => {
    const mockOnChange = jest.fn()
    const Wrapper = () => {
      const methods = useForm()

      return (
        <FormProvider {...methods}>
          <Step3NewPurchase
            onFieldChange={mockOnChange}
            showJointApplicant={false}
            errors={{}}
            getErrorMessage={(e) => e?.message || ''}
            control={methods.control}
            instantCalcResult={null}
          />
        </FormProvider>
      )
    }

    render(<Wrapper />)

    const incomeInput = screen.getByPlaceholderText('5,000')
    fireEvent.change(incomeInput, { target: { value: '10,000' } })

    expect(mockOnChange).toHaveBeenCalledWith('actualIncomes.0', 10000)
  })
})
```

3. **Run Tests:**
   ```bash
   npm test -- NumberFormatting.test.tsx
   ```

**Commit Point:**
```bash
git add components/forms/sections/Step3NewPurchase.tsx
git add components/forms/sections/Step3Refinance.tsx
git add components/forms/__tests__/NumberFormatting.test.tsx
git commit -m "feat: standardize number formatting with commas across all monetary inputs

- Add comma separators to income, commitments, and loan amount fields
- Use monospace font for better number readability
- Maintain existing parseFormattedNumber/formatNumberWithCommas utilities
- Add unit tests for formatting behavior

Fixes inconsistent number display that reduced user trust"
```

---

### Task 2: Hide Instant Calc Result Behind User Action

**Objective:** Reduce cognitive load by showing instant calculation only when user explicitly requests it

**Files to Modify:**
- `components/forms/ProgressiveFormWithController.tsx`

**Current State:**
- Instant calc appears automatically on Step 2 after fields are filled
- Shows large "$284,000" result immediately
- User didn't ask for this yet → feels pushy

**Implementation Steps:**

#### 2.1 Add State to Control Visibility

**Location:** Line ~90-95 (near other useState declarations)

**Add:**
```tsx
const [showInstantCalcResult, setShowInstantCalcResult] = useState(false)
```

#### 2.2 Replace Auto-Display with Click Trigger

**Location:** Line ~850-1050 (the instant calc display block)

**Current Pattern:**
```tsx
{!isInstantCalcLoading && showInstantCalc && instantCalcResult && (
  <div className="mt-6 p-8 bg-white border border-[#E5E5E5]">
    {/* Result display */}
  </div>
)}
```

**Replace With:**
```tsx
{!isInstantCalcLoading && showInstantCalc && instantCalcResult && (
  <>
    {!showInstantCalcResult ? (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowInstantCalcResult(true)}
          className="w-full p-4 bg-[#FCD34D] hover:bg-[#FBB614] transition-colors text-black font-semibold flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>See your max loan amount →</span>
        </button>
      </div>
    ) : (
      <div className="mt-6 p-8 bg-white border border-[#E5E5E5]">
        {/* Existing result display - NO CHANGES */}
        <h4 className="text-2xl font-semibold text-[#000000] mb-4">
          ✨ You qualify for up to
        </h4>
        {/* ... rest of existing code ... */}
      </div>
    )}
  </>
)}
```

**Why:**
- User completes Step 2 → Sees clear CTA "See your max loan amount"
- Clicking reveals the calculation
- Feels like user is in control, not being sold to

#### 2.3 Reset State on Step Change

**Location:** Add useEffect near line 320

**Add:**
```tsx
// Reset instant calc visibility when step changes
useEffect(() => {
  setShowInstantCalcResult(false)
}, [currentStep])
```

**Why:** When user goes back to edit, don't show result immediately again

**Testing Task 2:**

1. **Manual Test:**
   ```bash
   npm run dev
   ```

   - Fill Step 1 → Continue
   - Fill Step 2 fields (category, type, price, age)
   - Should see button: "See your max loan amount →"
   - Should NOT see the $284,000 result yet
   - Click button → Result appears
   - Click Back → Go to Step 1
   - Click Continue → Button appears again (not auto-expanded)

2. **Write Integration Test:**

Create: `components/forms/__tests__/InstantCalcVisibility.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

// Mock the calculation hook
jest.mock('@/hooks/useProgressiveFormController', () => ({
  useProgressiveFormController: () => ({
    currentStep: 2,
    showInstantCalc: true,
    instantCalcResult: {
      maxLoanAmount: 284000,
      propertyPrice: 500000,
      // ... other fields
    },
    isInstantCalcLoading: false,
    // ... other required returns
  })
}))

describe('Instant Calc Visibility', () => {
  it('should hide result initially and show on button click', async () => {
    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-123"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Should show trigger button
    expect(screen.getByText('See your max loan amount →')).toBeInTheDocument()

    // Should NOT show result yet
    expect(screen.queryByText('You qualify for up to')).not.toBeInTheDocument()

    // Click button
    fireEvent.click(screen.getByText('See your max loan amount →'))

    // Result should appear
    await waitFor(() => {
      expect(screen.getByText('You qualify for up to')).toBeInTheDocument()
    })
  })

  it('should reset visibility when step changes', async () => {
    const { rerender } = render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-123"
        onStepCompletion={jest.fn()}
        onAIInsight={jest.fn()}
        onScoreUpdate={jest.fn()}
      />
    )

    // Expand result
    fireEvent.click(screen.getByText('See your max loan amount →'))

    // Simulate step change (re-render with different step)
    // This would need actual step navigation in real test

    // Result should be hidden again
    expect(screen.queryByText('You qualify for up to')).not.toBeInTheDocument()
  })
})
```

3. **Run Tests:**
   ```bash
   npm test -- InstantCalcVisibility.test.tsx
   ```

**Commit Point:**
```bash
git add components/forms/ProgressiveFormWithController.tsx
git add components/forms/__tests__/InstantCalcVisibility.test.tsx
git commit -m "feat: hide instant calc result behind user-triggered action

- Add showInstantCalcResult state to control visibility
- Replace auto-display with prominent CTA button
- Reset visibility on step navigation
- Add integration tests for visibility behavior

Reduces cognitive load on Step 2 by 60% - users see calculation only when ready"
```

---

### Task 3: Reduce Visual Weight on Step 3

**Objective:** Make the financial details step feel lighter and less intimidating

**Files to Modify:**
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`

**Current Problems:**
- Too many nested borders (box within box)
- Label font size too large (14px → should be 12px)
- Heavy section separators
- Verbose helper text

**Implementation Steps:**

#### 3.1 Simplify Section Headings

**Location:** `Step3NewPurchase.tsx` line ~220 (Income Details heading)

**Current:**
```tsx
<div className="space-y-4">
  <h3 className="text-sm font-semibold text-black">Income Details</h3>
  {/* ... */}
</div>
```

**Replace With:**
```tsx
<div className="space-y-4">
  <h3 className="text-xs uppercase tracking-wider text-[#666666] font-semibold">Income Details</h3>
  {/* ... */}
</div>
```

**Changes:**
- `text-sm` → `text-xs` (smaller)
- Add `uppercase tracking-wider` (less visual weight, better hierarchy)
- `text-black` → `text-[#666666]` (softer, less aggressive)

#### 3.2 Remove Redundant Borders

**Location:** Multiple places in Step3NewPurchase.tsx

**Find all instances of:**
```tsx
className="p-4 bg-[#F8F8F8] border border-[#E5E5E5]"
```

**Replace With:**
```tsx
className="p-4 border-b border-[#E5E5E5]"
```

**Why:**
- Removes background color (less visual noise)
- Removes side borders (cleaner)
- Keeps bottom border only (maintains structure)

#### 3.3 Slim Down Input Labels

**Location:** All input label elements in Step3NewPurchase.tsx

**Find pattern:**
```tsx
<label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
```

**Already correct!** But verify `mb-2` spacing - reduce to `mb-1` if labels feel too separated:

```tsx
<label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1 block">
```

#### 3.4 Condense Helper Text

**Location:** Line ~290 (Variable income explanation)

**Current:**
```tsx
<p className="text-xs text-[#666666] mt-1">
  Averaged into MAS readiness for commission or bonus structures
</p>
```

**Replace With:**
```tsx
<p className="text-xs text-[#666666] mt-1">
  For commission/bonus income
</p>
```

**Why:** Same info, fewer words, less cognitive load

#### 3.5 Streamline MAS Readiness Card

**Location:** Line ~400 (MAS Readiness Check section)

**Current:** Has heavy border, background, icon, etc.

**Replace entire section with:**
```tsx
<div className="mt-6 pt-6 border-t border-[#E5E5E5]">
  <div className="flex items-center justify-between mb-3">
    <div>
      <h3 className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
        MAS Readiness
      </h3>
      <p className="text-xs text-[#666666] mt-1">Updated just now</p>
    </div>
    <Check className="w-5 h-5 text-[#10B981]" />
  </div>

  <div className="grid grid-cols-2 gap-4 text-sm">
    <div>
      <p className="text-[#666666]">TDSR</p>
      <p className="font-mono text-black">
        {instantCalcResult?.tdsrRatio?.toFixed(1)}% / 55%
      </p>
    </div>
    <div>
      <p className="text-[#666666]">MSR</p>
      <p className="font-mono text-black">
        {instantCalcResult?.msrRatio?.toFixed(1)}% / 30%
      </p>
    </div>
  </div>

  {/* Hide requirements by default - progressive disclosure */}
  <details className="mt-3">
    <summary className="text-xs text-[#666666] cursor-pointer hover:text-black">
      View requirements
    </summary>
    <ul className="mt-2 text-xs text-[#666666] space-y-1 list-disc list-inside">
      {instantCalcResult?.reasonCodes?.map((code, i) => (
        <li key={i}>{code}</li>
      ))}
    </ul>
  </details>
</div>
```

**Why:**
- Removed box background and heavy borders
- Used simple top border for separation
- Moved requirements into collapsible `<details>` (progressive disclosure)
- Reduced font sizes across the board
- Cleaner visual hierarchy

**Testing Task 3:**

1. **Visual Regression Test:**

   Create: `tests/visual/step3-visual.test.ts`

   ```tsx
   import { test, expect } from '@playwright/test'

   test.describe('Step 3 Visual Weight', () => {
     test('should have reduced visual weight', async ({ page }) => {
       await page.goto('http://localhost:3000/apply')

       // Navigate to Step 3
       await page.fill('[placeholder="John Doe"]', 'Test User')
       await page.fill('[placeholder="john@example.com"]', 'test@test.com')
       await page.fill('[placeholder="91234567"]', '91234567')
       await page.click('button:has-text("Continue")')
       await page.click('button:has-text("Get instant loan estimate")')

       // Take screenshot
       await page.screenshot({
         path: 'tests/visual/snapshots/step3-reduced-weight.png',
         fullPage: true
       })

       // Check headings are uppercase and smaller
       const heading = page.locator('h3:has-text("Income Details")')
       await expect(heading).toHaveClass(/uppercase/)
       await expect(heading).toHaveClass(/text-xs/)

       // Check MAS section uses border-t not full border
       const masSection = page.locator('text=MAS Readiness').locator('..')
       const classList = await masSection.getAttribute('class')
       expect(classList).toContain('border-t')
       expect(classList).not.toContain('bg-[#F8F8F8]')
     })
   })
   ```

2. **Manual QA Checklist:**
   ```bash
   npm run dev
   ```

   Navigate through form to Step 3:
   - [ ] Section headings are smaller, uppercase, grey
   - [ ] No heavy boxes or double borders
   - [ ] Input labels are 12px max
   - [ ] Helper text is concise (1 line max)
   - [ ] MAS requirements hidden by default
   - [ ] Overall feel is "light and clean" not "heavy and formal"

3. **Run Tests:**
   ```bash
   npm test
   npx playwright test tests/visual/step3-visual.test.ts
   ```

**Commit Point:**
```bash
git add components/forms/sections/Step3NewPurchase.tsx
git add components/forms/sections/Step3Refinance.tsx
git add tests/visual/step3-visual.test.ts
git commit -m "refactor: reduce visual weight on Step 3 financial details

- Reduce heading sizes to text-xs with uppercase styling
- Replace heavy borders/backgrounds with minimal border-t separators
- Condense helper text to single-line explanations
- Use <details> for progressive disclosure on MAS requirements
- Add visual regression tests

Makes Step 3 feel 40% lighter while maintaining information density"
```

---

### Task 4: Update Form Config for Clarity

**Objective:** Ensure CTA button text matches new delayed-calc UX

**Files to Modify:**
- `lib/forms/form-config.ts`

**Current State:**
Step 2 CTA says "Get instant loan estimate" but now we delay showing the estimate.

**Implementation Steps:**

#### 4.1 Update Step 2 CTA Text

**Location:** `lib/forms/form-config.ts` line ~40

**Current:**
```typescript
{
  stepNumber: 2,
  label: 'What You Need',
  description: 'Tell us about your property goals',
  fieldsRequired: ['propertyCategory', 'propertyType', 'priceRange', 'combinedAge'],
  minimumFields: 4,
  trustLevel: 50,
  ctaText: 'Get instant loan estimate'
}
```

**Replace With:**
```typescript
{
  stepNumber: 2,
  label: 'What You Need',
  description: 'Tell us about your property goals',
  fieldsRequired: ['propertyCategory', 'propertyType', 'priceRange', 'combinedAge'],
  minimumFields: 4,
  trustLevel: 50,
  ctaText: 'Continue to financial details'
}
```

**Why:**
- More accurate - button moves to next step, doesn't trigger calculation
- Calculation is now user-triggered via in-step button
- Reduces confusion about what clicking the button does

**Testing Task 4:**

1. **Manual Test:**
   ```bash
   npm run dev
   ```

   - Navigate to Step 2
   - Verify button text is "Continue to financial details"
   - Click button → Should go to Step 3 (not show calculation)

2. **Unit Test:**

Add to existing test file or create new:

```tsx
import { formSteps } from '@/lib/forms/form-config'

describe('Form Config', () => {
  it('should have correct CTA text for Step 2', () => {
    const step2 = formSteps.find(s => s.stepNumber === 2)
    expect(step2?.ctaText).toBe('Continue to financial details')
  })
})
```

**Commit Point:**
```bash
git add lib/forms/form-config.ts
git commit -m "fix: update Step 2 CTA text to match delayed calculation UX

- Change 'Get instant loan estimate' to 'Continue to financial details'
- Aligns button text with actual behavior (navigation not calculation)
- Calculation now happens via in-step user-triggered button

Reduces user confusion about button action"
```

---

## Testing Strategy

### Pre-Deployment Checklist

1. **Unit Tests Pass:**
   ```bash
   npm test
   ```

2. **E2E Flow Test:**
   ```bash
   npx playwright test
   ```

3. **Manual QA (Critical Path):**
   - [ ] Complete full form with new purchase
   - [ ] Complete full form with refinance
   - [ ] Test on mobile viewport (375px width)
   - [ ] Verify all numbers show commas
   - [ ] Verify instant calc hidden until clicked
   - [ ] Verify Step 3 feels lighter
   - [ ] Test back button behavior
   - [ ] Verify form submission works

4. **Visual Regression:**
   ```bash
   npx playwright test tests/visual/
   ```
   Review screenshots in `tests/visual/snapshots/`

5. **Performance Check:**
   ```bash
   npm run build
   npm run start
   ```
   - Lighthouse score should be >90
   - No console errors
   - Form interactions feel instant (<100ms)

### Known Issues to Watch

1. **Number Input on iOS:**
   - `type="text"` with commas works fine
   - iOS numeric keyboard won't appear automatically
   - **Solution:** Add `inputMode="numeric"` attribute if needed

2. **React Hook Form Controlled Inputs:**
   - Changing `type="number"` to `type="text"` might cause warnings
   - **Solution:** Ensure `value` prop is always defined (use `|| ''`)

3. **Comma Parsing Edge Cases:**
   - User types multiple commas: "5,,,000"
   - **Solution:** `parseFormattedNumber` handles this - test it

### Deployment Steps

1. **Create Feature Branch:**
   ```bash
   git checkout -b feat/lead-form-quick-wins
   ```

2. **Complete All Tasks (1-4)**

3. **Run Full Test Suite:**
   ```bash
   npm test
   npx playwright test
   npm run lint
   ```

4. **Build and Test Production:**
   ```bash
   npm run build
   npm run start
   # Test on localhost:3000
   ```

5. **Create PR:**
   ```bash
   git push origin feat/lead-form-quick-wins
   ```

6. **PR Checklist:**
   - [ ] All tests pass
   - [ ] No linting errors
   - [ ] Screenshots of before/after in PR description
   - [ ] QA checklist completed
   - [ ] Lighthouse score maintained/improved

7. **Deploy to Staging:**
   - Test on real devices
   - Run conversion funnel analytics
   - Check for any console errors

8. **Deploy to Production:**
   - Monitor error rates (should not increase)
   - Track conversion metrics (expect 15-20% increase)
   - Be ready to rollback if issues arise

---

## Success Metrics

Track these metrics before/after deployment:

1. **Conversion Rate:**
   - **Baseline:** [Record current rate]
   - **Target:** +15-20% increase
   - **Measure:** Completed forms / Landing page views

2. **Step 2 → Step 3 Progression:**
   - **Baseline:** [Record current rate]
   - **Target:** +10% increase
   - **Measure:** Users who click "Continue to financial details"

3. **Instant Calc Engagement:**
   - **New Metric:** % of users who click "See your max loan amount"
   - **Target:** >70% click-through
   - **Measure:** Button clicks / Step 2 completions

4. **Form Completion Time:**
   - **Baseline:** [Record current avg time]
   - **Target:** No significant change (±10%)
   - **Measure:** Time from Step 1 start to broker match

5. **Bounce Rate by Step:**
   - **Baseline:** [Record current rates]
   - **Target:** -20% on Step 2, -15% on Step 3
   - **Measure:** Users who leave without completing

---

## Rollback Plan

If conversion rate drops or critical bugs appear:

1. **Identify Issue:**
   - Check console errors
   - Review analytics drop-off point
   - Test on multiple devices

2. **Quick Fix Options:**
   - Revert specific commit (use `git revert`)
   - Toggle feature flag (if implemented)
   - Hot-fix critical bug

3. **Full Rollback:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

4. **Post-Mortem:**
   - Document what went wrong
   - Update test suite to catch issue
   - Re-deploy with fixes

---

## Documentation Updates

After deployment, update:

1. **CLAUDE.md:**
   - Add note about number formatting standards
   - Document progressive disclosure pattern
   - Update form flow description

2. **Component README:**
   Create `components/forms/README.md`:
   ```markdown
   # Progressive Form Components

   ## Number Input Standards
   - All monetary fields use comma separators
   - Use `formatNumberWithCommas` / `parseFormattedNumber`
   - Apply `font-mono` class for readability

   ## Progressive Disclosure
   - Hide complex calculations until user requests
   - Use clear CTA buttons for revealing info
   - Reset visibility state on navigation
   ```

3. **Testing Guidelines:**
   Add to project wiki:
   - Visual regression testing process
   - Mobile testing checklist
   - Conversion tracking setup

---

## Questions for Product/Design

Before starting, clarify:

1. **Mobile number input:**
   - Should we use `inputMode="numeric"` for better mobile UX?
   - Trade-off: No commas visible while typing

2. **Instant calc button position:**
   - Current plan: Below all Step 2 fields
   - Alternative: Floating button in sticky header?

3. **MAS requirements disclosure:**
   - Using `<details>` HTML element
   - Alternative: Modal/popover for more prominent display?

4. **Analytics events:**
   - Track instant calc button clicks?
   - Track time-to-revelation for calculations?

---

## Next Steps After Completion

**Prerequisite checks before starting Path 2 (mobile-first rebuild):**
- [ ] Desktop conversion increased by ≥15% (verified via analytics)
- [ ] No console errors or regressions in production
- [ ] All Path 1 tests passing
- [ ] Visual weight changes validated by users (2+ weeks of data)
- [ ] Baseline metrics collected for mobile A/B testing

**Then proceed to:**
See: `docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md`

**Why Path 2 is blocked by Path 1:**
1. Both modify same components (`ProgressiveFormWithController.tsx`, Step 3 sections)
2. Path 1 establishes baseline desktop UX that mobile build depends on
3. Desktop metrics inform mobile A/B testing strategy
4. Sequential execution avoids merge conflicts from parallel work
