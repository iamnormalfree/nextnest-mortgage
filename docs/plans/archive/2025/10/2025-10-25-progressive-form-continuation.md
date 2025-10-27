#### Task 3.2: ResponsiveFormLayout Component

**Time**: 2.5 hours
**Files to Create**:
- `components/forms/layout/ResponsiveFormLayout.tsx`
- `styles/progressive-form-layout.css`
- `tests/components/ResponsiveFormLayout.test.tsx`

**Context**: Mobile-first layout container that conditionally renders sidebar on desktop, inline on mobile.

**Step 1: Write Failing Tests**

Create `tests/components/ResponsiveFormLayout.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { ResponsiveFormLayout } from '@/components/forms/layout/ResponsiveFormLayout'

// Mock useResponsiveLayout hook
jest.mock('@/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: jest.fn()
}))

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

describe('ResponsiveFormLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders inline layout on mobile (no sidebar)', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      width: 375
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument()
  })

  it('renders sidebar on desktop when showSidebar=true', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1440
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument()
  })

  it('hides sidebar when showSidebar=false even on desktop', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1440
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar={false}>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument()
  })

  it('renders single column on tablet', () => {
    (useResponsiveLayout as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      width: 900
    })

    render(
      <ResponsiveFormLayout sidebar={<div>Sidebar Content</div>} showSidebar>
        <div>Form Content</div>
      </ResponsiveFormLayout>
    )

    expect(screen.getByText('Form Content')).toBeInTheDocument()
    // Tablet behavior: can decide to show/hide sidebar, for now hide
    expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument()
  })
})
```

**Step 2: Run Test (Should Fail)**
```bash
npm run test ResponsiveFormLayout.test.tsx
# Expected: Module not found error
```

**Step 3: Create Mobile-First CSS**

Create `styles/progressive-form-layout.css`:

```css
/* ABOUTME: Mobile-first CSS Grid layout for progressive form with responsive breakpoints */

/* ========================================
   Mobile Base (default, <768px)
   ======================================== */
.form-layout-container {
  display: block;
  width: 100%;
  padding: 1rem;
  background-color: #F8F8F8;
}

.form-content {
  max-width: 720px;
  margin: 0 auto;
}

.form-sidebar {
  display: none; /* Hidden on mobile */
}

/* ========================================
   Tablet (768px - 1023px)
   ======================================== */
@media (min-width: 768px) {
  .form-layout-container {
    padding: 2rem;
  }

  .form-content {
    /* Still single column, but more padding */
  }

  /* Sidebar still hidden on tablet (can be customized later) */
}

/* ========================================
   Desktop (≥1024px)
   ======================================== */
@media (min-width: 1024px) {
  .form-layout-container {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
    max-width: 1440px;
    margin: 0 auto;
    padding: 2rem 4rem;
  }

  .form-content {
    /* Constrained to left column */
    max-width: 720px;
  }

  .form-sidebar {
    display: block;
    position: sticky;
    top: 2rem;
    height: fit-content;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
  }
}

/* ========================================
   Accessibility: Reduced Motion
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* ========================================
   8px Spacing System (Brand Canon)
   ======================================== */
.spacing-xs { margin: 0.5rem; }   /* 8px */
.spacing-sm { margin: 1rem; }     /* 16px */
.spacing-md { margin: 2rem; }     /* 32px */
.spacing-lg { margin: 4rem; }     /* 64px */
```

**Step 4: Implement Component**

Create `components/forms/layout/ResponsiveFormLayout.tsx`:

```typescript
// ABOUTME: Mobile-first responsive layout container with conditional sidebar rendering

'use client'

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import '@/styles/progressive-form-layout.css'

interface ResponsiveFormLayoutProps {
  children: React.ReactNode          // Main form content
  sidebar?: React.ReactNode          // Optional sidebar (instant analysis)
  showSidebar: boolean               // Control sidebar visibility
}

export function ResponsiveFormLayout({
  children,
  sidebar,
  showSidebar
}: ResponsiveFormLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout()

  // Mobile (<768px): No sidebar, single column
  if (isMobile) {
    return (
      <div className="form-layout-container">
        <div className="form-content">
          {children}
        </div>
      </div>
    )
  }

  // Desktop (≥1024px): 2-column grid with sticky sidebar
  if (isDesktop && showSidebar && sidebar) {
    return (
      <div className="form-layout-container">
        <div className="form-content">
          {children}
        </div>
        <aside className="form-sidebar">
          {sidebar}
        </aside>
      </div>
    )
  }

  // Tablet or sidebar hidden: Single column
  return (
    <div className="form-layout-container">
      <div className="form-content">
        {children}
      </div>
    </div>
  )
}
```

**Step 5: Run Test (Should Pass)**
```bash
npm run test ResponsiveFormLayout.test.tsx
# Expected: All 4 tests pass
```

**Step 6: Manual Test**

```bash
npm run dev

# Test responsive behavior:
# 1. Open http://localhost:3000/apply
# 2. Open DevTools, responsive mode
# 3. Test 375px (mobile): Form full width, no sidebar
# 4. Test 900px (tablet): Form centered, no sidebar
# 5. Test 1440px (desktop): 2-column grid, sidebar on right
# 6. Verify sidebar is sticky (scroll form, sidebar stays visible)
```

**Step 7: Import CSS in Layout**

Add to `app/layout.tsx` (or root layout):

```typescript
import '@/styles/progressive-form-layout.css'
```

**Step 8: Commit**
```bash
git add components/forms/layout/ResponsiveFormLayout.tsx styles/progressive-form-layout.css tests/components/ResponsiveFormLayout.test.tsx app/layout.tsx
git commit -m "feat(layout): add mobile-first ResponsiveFormLayout with CSS Grid

- Mobile (<768px): Single column, no sidebar
- Tablet (768-1023px): Single column (sidebar hidden for now)
- Desktop (≥1024px): CSS Grid 2-column (form + sticky sidebar)
- Sidebar: 380px width, sticky positioning, max-height with scroll
- CSS: Mobile-first, 8px spacing system, reduced-motion support

Tests: 4 passed (mobile, tablet, desktop, sidebar toggle)
Files: ResponsiveFormLayout.tsx, progressive-form-layout.css
Brand Canon: Part04 spacing system, accessibility compliance"
```

---

### Phase 4: Integration & Refactoring (8-10 hours)

#### Task 4.1: Integrate EmploymentPanel into Step3NewPurchase

**Time**: 2.5 hours
**Files to Modify**:
- `components/forms/sections/Step3NewPurchase.tsx`

**Context**: Replace existing employment fields with shared EmploymentPanel component. Remove duplicated code (~200 lines).

**Step 1: Backup Current File**

```bash
cp components/forms/sections/Step3NewPurchase.tsx components/forms/sections/Step3NewPurchase.tsx.backup
```

**Step 2: Read Current Implementation**

```bash
# Find employment type section
grep -n "employmentType" components/forms/sections/Step3NewPurchase.tsx | head -20

# Find self-employed panel
grep -n "self-employed" components/forms/sections/Step3NewPurchase.tsx

# Find variable income panel
grep -n "variable" components/forms/sections/Step3NewPurchase.tsx
```

**Step 3: Import Shared Components**

Add to top of `Step3NewPurchase.tsx`:

```typescript
import { EmploymentPanel } from './EmploymentPanel'
import { CoApplicantPanel } from './CoApplicantPanel'
```

**Step 4: Replace Employment Type Dropdown**

Find employment type Controller (around lines 508-558).

**OLD CODE** (Delete):
```typescript
<Controller
  name="employmentType"
  control={control}
  render={({ field }) => (
    <div>
      <label>Employment Type *</label>
      <Select
        value={field.value}
        onValueChange={(value) => {
          field.onChange(value)
          onFieldChange('employmentType', value)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select employment type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="employed">Employed (Full-time)</SelectItem>
          <SelectItem value="self-employed">Self-Employed</SelectItem>
          <SelectItem value="contract">Contract/Freelance</SelectItem>
          <SelectItem value="unemployed">Unemployed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )}
/>

{renderSelfEmployedPanel()}
{renderVariableIncomePanel()}
```

**NEW CODE** (Replace with):
```typescript
<EmploymentPanel
  applicantNumber={0}
  control={control}
  errors={errors}
  onFieldChange={onFieldChange}
/>
```

**Step 5: Remove Old Helper Functions**

Delete these functions (no longer needed):

```typescript
// DELETE: renderSelfEmployedPanel() function (lines ~259-326)
// DELETE: renderVariableIncomePanel() function (lines ~328-396)
```

**Step 6: Replace Co-Applicant Section**

Find co-applicant fields (around lines 563-600).

**OLD CODE** (Delete):
```typescript
{showJointApplicant && (
  <div className="space-y-4 p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
    <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
      Applicant 2 (Joint)
    </p>

    <Controller
      name="actualIncomes.1"
      control={control}
      render={({ field }) => (
        <div>
          <label>Monthly Income</label>
          <Input
            id="monthly-income-joint"
            type="number"
            min="0"
            placeholder="6000"
            {...field}
          />
        </div>
      )}
    />
  </div>
)}
```

**NEW CODE** (Replace with):
```typescript
{showJointApplicant && (
  <CoApplicantPanel
    control={control}
    errors={errors}
    onFieldChange={onFieldChange}
    loanType="new_purchase"
  />
)}
```

**Step 7: Test in Browser**

```bash
npm run dev

# Navigate to http://localhost:3000/apply
# Select "New Purchase"
# Go to Step 3
# Test:
# 1. Employment type dropdown shows 4 types
# 2. Select "self-employed" → panel appears
# 3. Select "in-between-jobs" → panel appears
# 4. Toggle co-applicant → full fields appear
# 5. Co-applicant employment type works
# 6. MAS readiness updates correctly
```

**Step 8: Run Tests**

```bash
# Unit tests
npm run test

# Check for TypeScript errors
npm run type-check

# Build to verify no issues
npm run build
```

**Step 9: Commit**

```bash
git add components/forms/sections/Step3NewPurchase.tsx
git commit -m "refactor(forms): integrate EmploymentPanel into Step3NewPurchase

- Replace duplicated employment fields with shared EmploymentPanel component
- Replace co-applicant section with CoApplicantPanel
- Remove 200+ lines of duplicate code
- DRY: Single source of truth for employment logic

Deleted functions:
- renderSelfEmployedPanel() (~70 lines)
- renderVariableIncomePanel() (~70 lines)

Added components:
- <EmploymentPanel applicantNumber={0} />
- <CoApplicantPanel loanType='new_purchase' />

Manual test: Employment types work, co-applicant full parity verified
Build: Passes with no errors"
```

---

#### Task 4.2: Integrate EmploymentPanel into Step3Refinance

**Time**: 2 hours
**Files to Modify**:
- `components/forms/sections/Step3Refinance.tsx`

**Context**: Refinance path currently LACKS employment progressive disclosure. Add EmploymentPanel to achieve parity with new purchase.

**Step 1: Backup File**

```bash
cp components/forms/sections/Step3Refinance.tsx components/forms/sections/Step3Refinance.tsx.backup
```

**Step 2: Import Shared Components**

Add to top of file:

```typescript
import { EmploymentPanel } from './EmploymentPanel'
import { CoApplicantPanel } from './CoApplicantPanel'
```

**Step 3: Replace Employment Type Dropdown**

Find employment type Controller (around lines 362-394).

**OLD CODE** (Delete):
```typescript
<Controller
  name="employmentType"
  control={control}
  render={({ field }) => (
    <div>
      <label>Employment Type *</label>
      <Select
        value={field.value}
        onValueChange={(value) => {
          field.onChange(value)
          onFieldChange('employmentType', value)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select employment type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="employed">Employed (Full-time)</SelectItem>
          <SelectItem value="self-employed">Self-Employed</SelectItem>
          <SelectItem value="contract">Contract/Freelance</SelectItem>
          <SelectItem value="unemployed">Unemployed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )}
/>
```

**NEW CODE** (Replace with):
```typescript
<EmploymentPanel
  applicantNumber={0}
  control={control}
  errors={errors}
  onFieldChange={onFieldChange}
/>
```

**Step 4: Replace Co-Applicant Section**

Find co-applicant income field (around lines 398-435).

**OLD CODE** (Delete):
```typescript
{showJointApplicant && (
  <div className="space-y-4 p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
    <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
      Applicant 2 (Joint)
    </p>

    <Controller
      name="actualIncomes.1"
      control={control}
      render={({ field }) => (
        <div>
          <label>Monthly Income</label>
          <Input type="number" {...field} />
        </div>
      )}
    />
  </div>
)}
```

**NEW CODE** (Replace with):
```typescript
{showJointApplicant && (
  <CoApplicantPanel
    control={control}
    errors={errors}
    onFieldChange={onFieldChange}
    loanType="refinance"
  />
)}
```

**Step 5: Test in Browser**

```bash
npm run dev

# Navigate to http://localhost:3000/apply
# Select "Refinance"
# Go to Step 3
# Test:
# 1. Employment type dropdown shows 4 types (NEW!)
# 2. Select "self-employed" → panel with NOA field appears (NEW!)
# 3. Select "in-between-jobs" → panel with contract note appears (NEW!)
# 4. Toggle co-applicant → full fields appear (NEW!)
# 5. Co-applicant employment type works (NEW!)
# 6. MAS readiness updates correctly
```

**Step 6: Commit**

```bash
git add components/forms/sections/Step3Refinance.tsx
git commit -m "feat(forms): add employment progressive disclosure to refinance path

- Previously missing: self-employed and in-between-jobs conditional panels
- Now achieves parity with new purchase path
- Replace co-applicant with CoApplicantPanel (full field mirror)

Added components:
- <EmploymentPanel applicantNumber={0} />
- <CoApplicantPanel loanType='refinance' />

NEW features for refinance:
- Self-employed panel (business age, NOA income)
- In-between-jobs panel (months, contract verification)
- Co-applicant age + employment type fields

Manual test: Refinance employment types work, parity verified
Build: Passes with no errors"
```

---

