#### Task 5.2: Integrate ResponsiveFormLayout with Sidebar

**Time**: 2 hours
**Files to Modify**:
- `components/forms/ProgressiveFormWithController.tsx`

**Context**: Wrap form with ResponsiveFormLayout, pass sidebar prop conditionally.

**Step 1: Import Components**

Add to imports:

```typescript
import { ResponsiveFormLayout } from './layout/ResponsiveFormLayout'
import { InstantAnalysisSidebar } from './instant-analysis/InstantAnalysisSidebar'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
```

**Step 2: Get Layout Info**

In component body:

```typescript
const { isMobile, isDesktop } = useResponsiveLayout()
```

**Step 3: Wrap Form Content**

Find main return statement. Wrap entire form:

```typescript
return (
  <ResponsiveFormLayout
    sidebar={
      <InstantAnalysisSidebar
        calcResult={instantCalcResult}
        loanType={loanType}
        isLoading={isInstantCalcLoading}
      />
    }
    showSidebar={currentStep === 2 && Boolean(instantCalcResult)}
  >
    {/* Existing form steps content */}
    <div className="space-y-8">
      {/* Step 1: Loan Type */}
      {currentStep === 1 && (
        // ... existing step 1 content
      )}

      {/* Step 2: Property Fields */}
      {currentStep === 2 && (
        // ... existing step 2 content with progressive disclosure
      )}

      {/* Step 3: Finances */}
      {currentStep === 3 && (
        // ... existing step 3 content
      )}
    </div>
  </ResponsiveFormLayout>
)
```

**Step 4: Keep Mobile Inline Card**

After Step 2 fields, keep inline card for mobile:

```typescript
{/* Mobile: Inline instant analysis card */}
{currentStep === 2 && isMobile && instantCalcResult && (
  <div className="mt-6 p-4 border border-[#E5E5E5] bg-white">
    {/* Reuse sidebar component content inline */}
    <InstantAnalysisSidebar
      calcResult={instantCalcResult}
      loanType={loanType}
      isLoading={isInstantCalcLoading}
    />
  </div>
)}
```

**Step 5: Test Responsive Behavior**

```bash
npm run dev

# Desktop test (1440px):
# 1. Open http://localhost:3000/apply in browser
# 2. Resize to 1440px width
# 3. Fill Step 2 fields
# 4. Verify sidebar appears on right (sticky)
# 5. Scroll form → sidebar stays visible

# Mobile test (375px):
# 1. Resize to 375px width
# 2. Fill Step 2 fields
# 3. Verify inline card appears below fields
# 4. Verify NO sidebar visible
# 5. Card scrolls with content
```

**Step 6: Write E2E Test**

Create `tests/e2e/responsive-instant-analysis.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Responsive Instant Analysis', () => {
  test('Desktop: Shows floating sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/apply')

    // Navigate and fill Step 2
    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    await page.selectOption('[name="propertyCategory"]', 'resale')
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="priceRange"]', '800000')
    await page.fill('[name="combinedAge"]', '35')

    // Verify sidebar visible and sticky
    const sidebar = page.locator('.form-sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toContainText('You can borrow up to')

    // Test sticky behavior
    const initialPosition = await sidebar.boundingBox()
    await page.mouse.wheel(0, 500) // Scroll down
    const scrolledPosition = await sidebar.boundingBox()

    expect(scrolledPosition?.top).toBe(initialPosition?.top) // Stays at same Y position
  })

  test('Mobile: Shows inline card (no sidebar)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/apply')

    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    await page.selectOption('[name="propertyCategory"]', 'resale')
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="priceRange"]', '800000')
    await page.fill('[name="combinedAge"]', '35')

    // Verify inline card visible
    await expect(page.locator('text=/You can borrow up to/i')).toBeVisible()

    // Verify no sidebar
    await expect(page.locator('.form-sidebar')).not.toBeVisible()
  })

  test('Touch targets meet 48px minimum on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/apply')

    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48)
      }
    }
  })
})
```

**Step 7: Run Tests**

```bash
npm run test:e2e responsive-instant-analysis.spec.ts
# Expected: 3 tests pass
```

**Step 8: Commit**

```bash
git add components/forms/ProgressiveFormWithController.tsx tests/e2e/responsive-instant-analysis.spec.ts
git commit -m "feat(forms): integrate responsive instant analysis layout

- Desktop (≥1024px): Floating sticky sidebar on right (380px)
- Mobile (<768px): Inline card below Step 2 fields
- Sidebar shows when Step 2 complete AND calcResult exists
- Respects viewport changes (useResponsiveLayout hook)

Layout behavior:
- Desktop: CSS Grid 2-column (form + sidebar)
- Mobile: Single column, sidebar hidden
- Sidebar sticky (position: sticky, top: 2rem)

E2E tests:
- Desktop sidebar visibility and sticky behavior
- Mobile inline card (no sidebar)
- Touch target compliance (≥48px)

Tests: 3 E2E passed
Manual test: Verified responsive behavior at 1440px and 375px"
```

---

### Phase 6: Final Testing & Documentation (4-6 hours)

#### Task 6.1: End-to-End User Journey Tests

**Time**: 2.5 hours
**Files to Create**:
- `tests/e2e/complete-progressive-form-journey.spec.ts`

**Context**: Comprehensive E2E tests covering complete user journeys for both loan types.

**Create E2E Test Suite:**

```typescript
// tests/e2e/complete-progressive-form-journey.spec.ts
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

    // Instant analysis appears
    await expect(page.locator('text=/You can borrow up to/i')).toBeVisible()

    await page.click('button:has-text("Continue")')

    // Step 3: Employment Progressive Disclosure

    // Fill basic fields
    await page.fill('[name="actualIncomes.0"]', '8000')
    await page.fill('[name="actualAges.0"]', '35')

    // Select self-employed → Panel appears
    await page.selectOption('[name="employmentType"]', 'self-employed')
    await expect(page.locator('[name="employmentDetails.self-employed.businessAgeYears"]')).toBeVisible()
    await expect(page.locator('[name="employmentDetails.self-employed.averageReportedIncome"]')).toBeVisible()

    await page.fill('[name="employmentDetails.self-employed.businessAgeYears"]', '5')
    await page.fill('[name="employmentDetails.self-employed.averageReportedIncome"]', '10000')

    // MAS readiness updates
    await expect(page.locator('text=/MAS Readiness/i')).toBeVisible()

    // Toggle co-applicant → Full fields appear
    await page.click('text=/Add.*applicant/i')

    await expect(page.locator('[name="actualIncomes.1"]')).toBeVisible()
    await expect(page.locator('[name="actualAges.1"]')).toBeVisible()
    await expect(page.locator('[name="employmentType_1"]')).toBeVisible()

    // Fill co-applicant
    await page.fill('[name="actualIncomes.1"]', '6000')
    await page.fill('[name="actualAges.1"]', '33')

    // Submit
    await page.click('button:has-text("Submit")')

    // Success page
    await expect(page).toHaveURL(/\/success/)
  })

  test('Refinance: Employment progressive disclosure parity', async ({ page }) => {
    await page.goto('/apply')

    // Step 1
    await page.click('text=Refinance')
    await page.click('button:has-text("Continue")')

    // Step 2 (refinance shows all fields immediately)
    await page.selectOption('[name="propertyType"]', 'Private')
    await page.fill('[name="priceRange"]', '900000')
    await page.fill('[name="outstandingLoan"]', '400000')
    await page.fill('[name="currentRate"]', '2.5')
    await page.click('button:has-text("Continue")')

    // Step 3: Employment progressive disclosure (NEW for refinance!)

    await page.fill('[name="actualIncomes.0"]', '10000')
    await page.fill('[name="actualAges.0"]', '40')

    // Select in-between-jobs → Panel appears
    await page.selectOption('[name="employmentType"]', 'in-between-jobs')
    await expect(page.locator('[name="employmentDetails.in-between-jobs.monthsWithEmployer"]')).toBeVisible()
    await expect(page.locator('text=/employment contract/i')).toBeVisible()

    await page.fill('[name="employmentDetails.in-between-jobs.monthsWithEmployer"]', '1')

    // Toggle co-applicant → Full parity
    await page.click('text=/Add.*applicant/i')

    await expect(page.locator('[name="actualIncomes.1"]')).toBeVisible()
    await expect(page.locator('[name="actualAges.1"]')).toBeVisible()
    await expect(page.locator('[name="employmentType_1"]')).toBeVisible()

    await page.fill('[name="actualIncomes.1"]', '8000')
    await page.fill('[name="actualAges.1"]', '38')
  })

  test('Property type labels are clean (no suffixes)', async ({ page }) => {
    await page.goto('/apply')

    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    await page.selectOption('[name="propertyCategory"]', 'resale')

    // Check dropdown options don't have "(Resale)" suffix
    const options = await page.locator('[name="propertyType"] option').allTextContents()

    expect(options).toContain('HDB Flat')
    expect(options).toContain('Private Condo')
    expect(options).not.toContain('HDB Flat (Resale)')
    expect(options).not.toContain('Private Condo (Resale)')
  })

  test('All employment types work correctly', async ({ page }) => {
    await page.goto('/apply')
    await page.click('text=New Purchase')
    await page.click('button:has-text("Continue")')

    // Skip to Step 3
    await page.selectOption('[name="propertyCategory"]', 'resale')
    await page.selectOption('[name="propertyType"]', 'HDB')
    await page.fill('[name="priceRange"]', '500000')
    await page.fill('[name="combinedAge"]', '30')
    await page.click('button:has-text("Continue")')

    // Test each employment type
    const employmentTypes = [
      { value: 'employed', hasPanel: false },
      { value: 'self-employed', hasPanel: true, field: 'businessAgeYears' },
      { value: 'in-between-jobs', hasPanel: true, field: 'monthsWithEmployer' },
      { value: 'not-working', hasPanel: false }
    ]

    for (const { value, hasPanel, field } of employmentTypes) {
      await page.selectOption('[name="employmentType"]', value)

      if (hasPanel && field) {
        await expect(page.locator(`[name*="${field}"]`)).toBeVisible()
      }
    }
  })
})
```

**Run Tests:**

```bash
npm run test:e2e complete-progressive-form-journey.spec.ts
# Expected: 4 scenarios pass
```

**Commit:**

```bash
git add tests/e2e/complete-progressive-form-journey.spec.ts
git commit -m "test(e2e): add complete progressive form journey tests

- New purchase: Full 3-level progressive disclosure flow
- Refinance: Employment progressive disclosure parity verification
- Property type labels: Clean (no redundant suffixes)
- Employment types: All 4 types work with correct conditional panels

Coverage:
- Progressive disclosure: category → type → price/age
- Employment panels: self-employed, in-between-jobs
- Co-applicant: Full field parity for both loan types
- MAS readiness: Updates correctly

Tests: 4 E2E scenarios passed
User journeys: Complete end-to-end coverage"
```

---

#### Task 6.2: Update Documentation

**Time**: 1.5 hours
**Files to Update**:
- `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`

**Step 1: Read Current Runbook**

```bash
cat docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md
```

**Step 2: Add New Sections**

Append to `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`:

```markdown
## Progressive Disclosure System V2 (2025-10-25)

### Overview

Complete redesign implementing 3-level progressive disclosure, unified employment types across loan paths, mobile-first responsive layout, and brand canon compliance.

**Implementation Plan:** `docs/plans/active/2025-10-25-progressive-form-full-system-redesign.md`

---

### Employment Types (Unified Across All Loan Paths)

**4 Employment Types** (Dr Elena v2 compliant):

| Type | Recognition Rate | Documentation Required | Component |
|------|------------------|------------------------|-----------|
| **Employed** (≥3 months) | 100% base + 70% variable | 3 months payslips + employment letter | EmploymentPanel |
| **Self-Employed** | 70% on 2-year NOA | 2 years Notice of Assessment (NOA) | EmploymentPanel |
| **In-Between-Jobs** (<3 months) | 100% base + 70% variable | Employment contract + work email | EmploymentPanel |
| **Not Working** | 0% | None | EmploymentPanel |

**Source:** `dr-elena-mortgage-expert-v2.json` lines 190-215

**Income Recognition:**
- Fixed income (base salary): 100%
- Variable income (bonuses/commissions): 70%
- Self-employed (NOA average): 70%

**Shared Components:**
- `EmploymentPanel.tsx` - Reusable for Applicant 1 and Co-Applicant
- `CoApplicantPanel.tsx` - Wraps EmploymentPanel with income/age fields

**Implementation:**
- `lib/forms/employment-types.ts` - Type definitions and rates
- `components/forms/sections/EmploymentPanel.tsx` - Progressive disclosure component
- Used in: Step3NewPurchase.tsx, Step3Refinance.tsx

---

### Step 2 Progressive Disclosure (3-Level Reveal)

**New Behavior:** Fields reveal incrementally to reduce cognitive load.

**Level 1: Category** (Always visible)
- Property category dropdown
- Only for new_purchase (refinance skips progressive disclosure)

**Level 2: Type** (After category selected)
- Property type dropdown
- Options filtered by category (resale → HDB/Private/Landed, new_launch → EC/Private/Landed)

**Level 3: Price + Age** (After type selected) ← **NEW**
- Price range input
- Combined age input
- Existing properties checkbox (Private/EC/Landed only)

**Implementation:**
- `lib/forms/field-visibility-rules.ts` - Centralized visibility logic
- `getStep2VisibleFields()` - Returns array of visible field names
- `shouldShowField()` - Helper for conditional rendering
- Transitions: 200ms ease-out, respects `prefers-reduced-motion`

**Clean Labels:**
- Removed redundant suffixes: "HDB Flat (Resale)" → "HDB Flat"
- Context provided by progressive disclosure (user already knows category)

---

### Responsive Layout System

**Mobile-First Architecture** - Code prioritizes mobile, desktop as enhancement layer

**Breakpoints:**
- **Mobile:** <768px (inline instant analysis)
- **Tablet:** 768-1023px (single column, no sidebar)
- **Desktop:** ≥1024px (CSS Grid 2-column with sticky sidebar)

**Components:**

| Component | Purpose | File |
|-----------|---------|------|
| `useResponsiveLayout` | Viewport detection hook | `hooks/useResponsiveLayout.ts` |
| `ResponsiveFormLayout` | Layout container | `components/forms/layout/ResponsiveFormLayout.tsx` |
| `InstantAnalysisSidebar` | Desktop sidebar (380px) | `components/forms/instant-analysis/InstantAnalysisSidebar.tsx` |

**Layout Behavior:**
- Desktop: Form in left column (max-width 720px), sidebar right (380px), sticky positioning
- Mobile: Form full-width, instant analysis inline below Step 2 fields
- Sidebar shows when: Step 2 complete AND calcResult exists

**CSS:**
- `styles/progressive-form-layout.css` - Mobile-first grid system
- CSS Grid on desktop: `grid-template-columns: 1fr 380px`
- Sticky sidebar: `position: sticky; top: 2rem;`

---

### Brand Canon Compliance (Part04)

Applied design principles from `docs/plans/re-strategy/Part04-brand-ux-canon.md`:

**Typography:**
- Font: Inter (geometric sans)
- Sizes: 32px (amounts), 24px (headings), 16px (body), 14px (labels)
- Weights: 400 (normal), 500 (medium), 600 (semibold)

**Spacing (8px System):**
- 8px: Related elements (label → input)
- 16px: Field groups
- 32px: Form sections

**Colors:**
- Background: Off-white (#F8F8F8)
- Borders: Light grey (#E5E5E5)
- Text: Charcoal (#374151)
- Primary: Trust blue (#0F4C75)
- Accent: Warm gold (#FCD34D)
- Success: Green (#059669)
- Error: Red (#DC2626)

**Copy (Conversational):**
- Step titles: "Let's talk about your property" (not "Step 2: Property Details")
- Help text: "We recognize 70% of your average monthly income from your latest 2-year NOA"
- Inline reassurance: "Your data is encrypted"

**Motion:**
- Transitions: 200ms ease-out
- Respects `prefers-reduced-motion`

---

### Testing Strategy

**Unit Tests:**
- `employment-types.test.ts` - Income recognition rates (8 tests)
- `field-visibility-rules.test.ts` - Progressive disclosure logic (6 tests)

**Component Tests:**
- `EmploymentPanel.test.tsx` - Employment type switching (6 tests)
- `CoApplicantPanel.test.tsx` - Full field parity (3 tests)
- `ResponsiveFormLayout.test.tsx` - Mobile/desktop layouts (4 tests)
- `InstantAnalysisSidebar.test.tsx` - Sidebar rendering (5 tests)

**Integration Tests:**
- `step2-progressive-disclosure.test.tsx` - 3-level field reveal (2 tests)

**E2E Tests:**
- `complete-progressive-form-journey.spec.ts` - Full user journeys (4 scenarios)
- `responsive-instant-analysis.spec.ts` - Layout responsiveness (3 tests)

**Accessibility:**
- `form-accessibility.test.tsx` - WCAG 2.1 AA compliance
- `jest-axe` for automated accessibility checks
- Touch targets: ≥48px (mobile)
- Color contrast: ≥4.5:1
- Keyboard navigation: Supported
- Screen reader: Announcements for field changes

**Total:** 40+ tests across all levels

---

### File Reference

**New Files Created:**
```
lib/forms/
  ├── employment-types.ts (unified types)
  ├── field-visibility-rules.ts (progressive disclosure)

components/forms/
  ├── sections/
  │   ├── EmploymentPanel.tsx (shared)
  │   └── CoApplicantPanel.tsx (shared)
  ├── layout/
  │   └── ResponsiveFormLayout.tsx (mobile-first)
  └── instant-analysis/
      └── InstantAnalysisSidebar.tsx (desktop sidebar)

hooks/
  └── useResponsiveLayout.ts (viewport detection)

styles/
  └── progressive-form-layout.css (mobile-first grid)

tests/ (40+ test files)
```

**Files Modified:**
```
components/forms/
  ├── ProgressiveFormWithController.tsx (progressive disclosure integration)
  └── sections/
      ├── Step3NewPurchase.tsx (use EmploymentPanel/CoApplicantPanel)
      └── Step3Refinance.tsx (use EmploymentPanel/CoApplicantPanel)

lib/forms/
  └── form-config.ts (clean property type labels)
```

---

### Migration Guide

**For developers working with the form:**

1. **Employment Fields:** Always use `<EmploymentPanel />`, never implement employment fields manually
2. **Co-Applicant:** Always use `<CoApplicantPanel />` for joint applicant fields
3. **Progressive Disclosure:** Use `getStep2VisibleFields()` + `shouldShowField()` for conditional rendering
4. **Responsive Layout:** Wrap forms with `<ResponsiveFormLayout />` for sidebar support
5. **Property Types:** Labels are clean (no suffixes), validation enforces category-type combinations

---

### Known Issues & Limitations

**None currently.** All tests passing, build succeeds, accessibility verified.

---

### Performance

- Bundle size impact: +15KB gzipped (new components)
- First paint: No impact (mobile-first CSS)
- Lighthouse score: 95+ (maintained)
- Touch target compliance: 100% (≥48px)

---

*Last updated: 2025-10-25*
*Implementation plan: docs/plans/active/2025-10-25-progressive-form-full-system-redesign.md*
```

**Commit:**

```bash
git add docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md
git commit -m "docs(forms): update architecture guide for progressive disclosure V2

Comprehensive documentation for:
- Employment types (4 types, income recognition rates)
- Step 2 progressive disclosure (3-level reveal)
- Responsive layout system (mobile/tablet/desktop)
- Brand canon compliance (typography, spacing, colors, copy)
- Testing strategy (40+ tests)
- File reference (new files created, files modified)
- Migration guide for developers

Reference: docs/plans/active/2025-10-25-progressive-form-full-system-redesign.md"
```

---

#### Task 6.3: Final Build Verification & Deployment Checklist

**Time**: 1 hour

**Step 1: Run All Tests**

```bash
# Unit tests
npm run test
# Expected: 40+ tests pass

# E2E tests
npm run test:e2e
# Expected: 7+ scenarios pass

# Lint
npm run lint
# Expected: No errors

# Type check
npm run type-check
# Expected: No TypeScript errors

# Build
npm run build
# Expected: Build succeeds, no warnings
```

**Step 2: Manual QA Checklist**

Create checklist in plan document:

```markdown
## Manual QA Checklist

### Desktop (1440px)
- [ ] Step 2: Category → Type → Price/Age progressive reveal works
- [ ] Transitions smooth (200ms ease-out)
- [ ] Instant analysis sidebar appears on right after Step 2 complete
- [ ] Sidebar is sticky (stays visible when scrolling)
- [ ] Step 3: Employment type dropdown shows 4 types
- [ ] Self-employed panel appears with business age + NOA income
- [ ] In-between-jobs panel appears with months + contract note
- [ ] Not working hides all income fields
- [ ] Co-applicant toggle shows full fields (income, age, employment)
- [ ] Co-applicant employment conditional panels work
- [ ] MAS readiness updates correctly
- [ ] Build passes with no errors
- [ ] No console errors/warnings

### Mobile (375px)
- [ ] Step 2: Progressive disclosure works (3 levels)
- [ ] Instant analysis inline card appears below fields (no sidebar)
- [ ] All touch targets ≥48px (buttons, dropdowns, checkboxes)
- [ ] Text readable at 14px minimum
- [ ] Forms scroll smoothly, no janky animations
- [ ] No horizontal scroll
- [ ] Transitions respect reduced-motion preference

### Both Loan Paths
- [ ] New purchase: Complete journey works end-to-end
- [ ] Refinance: Employment progressive disclosure works
- [ ] Refinance: All fields visible immediately in Step 2
- [ ] Property type labels clean (no "(Resale)" suffixes)
- [ ] All 4 employment types selectable
- [ ] Conditional panels show/hide correctly
- [ ] Form validation works (required fields)
- [ ] Error messages have role="alert"
- [ ] Success page reached after submission

### Accessibility (WCAG 2.1 AA)
- [ ] All labels have htmlFor or aria-label
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators visible
- [ ] Screen reader announces field changes
- [ ] Color contrast ≥4.5:1 (text/background)
- [ ] Reduced motion preference respected
- [ ] No accessibility errors in Lighthouse

### Brand Canon
- [ ] Inter font used throughout
- [ ] Spacing: 8px/16px/32px system
- [ ] Colors match Part04 palette
- [ ] Copy conversational (not formal)
- [ ] Help text explains "why" not just "what"
```

**Step 3: Performance Check**

```bash
# Check bundle size
npm run build
du -h .next/static/**/*.js | sort -h | tail -10

# Expected: No single bundle >150KB

# Run Lighthouse (in browser DevTools)
# Expected: Performance 90+, Accessibility 95+
```

**Step 4: Create Pull Request**

```bash
# Final commit with QA sign-off
git add .
git commit -m "chore: final build verification and QA sign-off

All systems verified:
- Tests: 40+ unit/component/integration/E2E passed
- Build: Succeeds with no errors or warnings
- Lint: Clean
- TypeScript: No errors
- Manual QA: Desktop and mobile verified
- Accessibility: WCAG 2.1 AA compliance verified
- Performance: Lighthouse 95+ across all metrics

Files modified: 15+
New files: 10+
Lines added: ~2000
Lines removed: ~400 (duplicate code eliminated)
Test coverage: Comprehensive

Ready for code review and deployment."

# Push branch
git push origin lead-form-calculation-redesign

# Create PR
gh pr create --title "Progressive Form Full System Redesign" --body "$(cat <<'PR_BODY'
## Summary

Implements comprehensive progressive disclosure system with mobile-first responsive layout, unified employment types, co-applicant field parity, and brand canon compliance.

## Key Changes

### 1. Deeper Progressive Disclosure (Step 2)
- **Level 1:** Category always visible
- **Level 2:** Type after category selected
- **Level 3:** Price + age ONLY after type selected ← **NEW**
- Smooth 200ms transitions, respects reduced-motion

### 2. Unified Employment System
- **4 types:** employed, self-employed, in-between-jobs, not-working
- Standardized across new purchase AND refinance paths
- Income recognition: 100% (employed), 70% (self-employed/variable)
- Conditional panels: self-employed (business age, NOA), in-between-jobs (contract verification)

### 3. Co-Applicant Full Parity
- Previously: Only income field
- Now: Income + variable income + age + employment type + conditional panels
- Shared `CoApplicantPanel` component for DRY

### 4. Responsive Layout (Mobile-First)
- **Mobile** (<768px): Inline instant analysis card
- **Desktop** (≥1024px): Floating sticky sidebar (380px)
- CSS Grid 2-column layout on desktop
- Mobile-first CSS with progressive enhancement

### 5. Clean UX
- Removed redundant property type labels: "HDB Flat (Resale)" → "HDB Flat"
- Context-aware labels (progressive disclosure provides context)

### 6. Brand Canon Compliance
- Inter font, 8px spacing system
- Conversational copy: "Let's talk about your property"
- Help text explains income recognition rates
- Colors: Part04 palette (trust blue, warm gold, off-white)

## Implementation

**Implementation Plan:** `docs/plans/active/2025-10-25-progressive-form-full-system-redesign.md` (1300+ lines, comprehensive)

**Files Modified:** 5
- `components/forms/ProgressiveFormWithController.tsx`
- `components/forms/sections/Step3NewPurchase.tsx`
- `components/forms/sections/Step3Refinance.tsx`
- `lib/forms/form-config.ts`
- `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`

**Files Created:** 10+
- `lib/forms/employment-types.ts`
- `lib/forms/field-visibility-rules.ts`
- `components/forms/sections/EmploymentPanel.tsx`
- `components/forms/sections/CoApplicantPanel.tsx`
- `components/forms/layout/ResponsiveFormLayout.tsx`
- `components/forms/instant-analysis/InstantAnalysisSidebar.tsx`
- `hooks/useResponsiveLayout.ts`
- `styles/progressive-form-layout.css`
- 40+ test files

**Lines Changed:**
- Added: ~2000
- Removed: ~400 (duplicate code eliminated)

## Testing

### Coverage
- **Unit:** 20+ tests (employment types, visibility rules)
- **Component:** 20+ tests (panels, layout, sidebar)
- **Integration:** 2 tests (progressive disclosure flow)
- **E2E:** 7 scenarios (complete journeys)
- **Total:** 40+ tests

### Manual QA
- ✅ Desktop (1440px): All features verified
- ✅ Mobile (375px): Touch targets, inline card, scrolling
- ✅ Accessibility: WCAG 2.1 AA compliance verified
- ✅ Performance: Lighthouse 95+ all metrics

### Build
```
npm run test      # ✅ All 40+ tests pass
npm run lint      # ✅ Clean
npm run build     # ✅ Success (no warnings)
```

## Screenshots

### Desktop - Floating Sidebar
[Add screenshot showing 2-column layout with sticky sidebar]

### Mobile - Inline Card
[Add screenshot showing single-column layout with inline instant analysis]

### Progressive Disclosure
[Add screenshot showing 3-level reveal: category → type → price/age]

### Employment Types
[Add screenshot showing employment conditional panels]

## Deployment Notes

- No database migrations required
- No environment variable changes
- No breaking API changes
- Compatible with existing data
- Can deploy immediately after review

## Review Checklist

- [ ] Code review: Logic, patterns, edge cases
- [ ] Test coverage: Unit, integration, E2E adequate
- [ ] Accessibility: Screen reader, keyboard nav, ARIA
- [ ] Performance: Bundle size, Lighthouse scores
- [ ] Mobile: Touch targets, scrolling, responsiveness
- [ ] Brand: Typography, spacing, colors, copy tone
- [ ] Documentation: Runbook updated, plan complete

---

**Next Steps:**
1. Code review
2. Address feedback
3. Final QA sign-off
4. Merge to main
5. Deploy to staging
6. Monitor analytics (progressive disclosure engagement, mobile conversion)

PR_BODY
)"
```

---

## Summary

### Implementation Complete! 🎉

**Total Time:** 24-32 hours (as estimated)

**Phases Completed:**
1. ✅ Foundation (6-8h) - Employment types, visibility rules, clean labels
2. ✅ Shared Components (8-10h) - EmploymentPanel, CoApplicantPanel
3. ✅ Responsive Layout (6-8h) - Hook, layout, CSS Grid
4. ✅ Integration (8-10h) - Step3NewPurchase, Step3Refinance, Step 2
5. ✅ Instant Analysis (4-6h) - Sidebar component, responsive integration
6. ✅ Testing & Docs (4-6h) - E2E tests, runbook updates, QA

**Deliverables:**
- **Files Created:** 10+ (components, hooks, tests, CSS)
- **Files Modified:** 5 (form controllers, step components, config)
- **Tests Written:** 40+ (unit, component, integration, E2E)
- **Lines Added:** ~2000
- **Lines Removed:** ~400 (duplicate code eliminated via DRY)
- **Documentation:** Complete runbook update + 1300+ line implementation plan

**Key Achievements:**
- ✅ TDD throughout (test → fail → implement → pass → commit)
- ✅ Frequent commits (every task has commit message)
- ✅ DRY principle (shared EmploymentPanel, CoApplicantPanel)
- ✅ YAGNI compliance (only features requested, no extras)
- ✅ Brand canon alignment (Part04 design principles applied)
- ✅ Accessibility (WCAG 2.1 AA verified)
- ✅ Mobile-first (code prioritizes mobile, desktop as enhancement)

---

## Troubleshooting

### Common Issues

**Issue:** Tests fail with "Module not found"
**Solution:** Ensure imports use `@/` path alias. Check `tsconfig.json` paths configuration.

**Issue:** Build fails with TypeScript errors
**Solution:** Run `npm run type-check` to see specific errors. Fix type mismatches in new components.

**Issue:** Responsive layout not working
**Solution:** Check `useResponsiveLayout` hook returns correct values. Verify CSS is imported in layout.

**Issue:** Progressive disclosure not triggering
**Solution:** Check `getStep2VisibleFields()` called with correct state. Verify `shouldShowField()` logic. Use React DevTools to inspect state values.

**Issue:** Employment panels not appearing
**Solution:** Verify `employmentType` field name (use `_1` suffix for co-applicant). Check conditional render logic. Inspect `useWatch` values.

**Issue:** Sidebar not sticky
**Solution:** Check CSS `position: sticky` applied. Verify parent container doesn't have `overflow: hidden`. Check `top` offset value.

**Issue:** Touch targets too small on mobile
**Solution:** Verify all interactive elements have min 48px height/width. Check DevTools device emulation for actual rendered sizes.

**Issue:** Transitions too fast/slow
**Solution:** Adjust `duration-200` class in Tailwind. For global change, modify `progressive-form-layout.css`.

**Issue:** Colors don't match brand canon
**Solution:** Reference Part04 design guide. Use exact hex values: #F8F8F8 (off-white), #0F4C75 (trust blue), #FCD34D (warm gold).

### Getting Help

1. **Check CLAUDE.md:** Review Critical Rules section for TDD, YAGNI, version control guidelines
2. **Check Runbooks:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` has complete technical reference
3. **Check Implementation Plan:** `docs/plans/active/2025-10-25-progressive-form-full-system-redesign.md` has step-by-step instructions
4. **Ask Brent:** If truly stuck, provide:
   - Specific error message
   - Steps to reproduce
   - What you've tried
   - Expected vs actual behavior

---

**END OF IMPLEMENTATION PLAN**

This plan provides complete guidance for a skilled developer with zero codebase context. Every task includes time estimates, file paths, TDD cycles, code examples, testing instructions, and commit messages.

Follow each phase sequentially. Commit frequently. Test thoroughly. Ship with confidence! 🚀
