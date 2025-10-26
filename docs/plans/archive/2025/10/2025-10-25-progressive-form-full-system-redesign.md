# Progressive Form Full System Redesign - Implementation Plan

**Date**: 2025-10-25
**Status**: Ready for implementation
**Complexity**: HEAVY (24-32 hours)
**Engineer Context**: Assume zero codebase knowledge, skilled developer, needs full guidance

---

## Overview

This plan implements a comprehensive progressive disclosure system with mobile-first responsive layout, unified employment types across loan paths, co-applicant field parity, and NextNest brand canon compliance.

**Core Changes:**
1. **Deeper Step 2 Progressive Disclosure**: Category → Type → Price/Age (3-level reveal)
2. **Unified Employment System**: 4 employment types (employed, self-employed, in-between-jobs, not-working)
3. **Co-Applicant Mirroring**: Full field parity with Applicant 1 (income, age, employment)
4. **Responsive Layout**: Floating sidebar (desktop), inline card (mobile), slide-in drawer (tablet)
5. **Clean Labels**: Remove redundant property type suffixes
6. **Brand Canon**: Apply Part04 design principles (typography, spacing, conversational copy)

---

## Prerequisites

**Read First (30 minutes):**
- `CLAUDE.md` - Critical Rules section (TDD, YAGNI, version control)
- `docs/plans/re-strategy/Part04-brand-ux-canon.md` - Design pillars and visual system
- `dr-elena-mortgage-expert-v2.json` lines 190-215 - Income recognition rates
- `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` - Existing form patterns

**Technical Stack:**
- Next.js 14 + TypeScript + Tailwind CSS
- React Hook Form + Zod validation
- Shadcn/ui components
- Jest + React Testing Library (unit/integration)
- Playwright (E2E tests)

**Development Commands:**
```bash
npm run dev          # Start dev server (localhost:3000)
npm run test         # Run Jest unit tests
npm run test:watch   # Jest watch mode
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint check
npm run build        # Production build (must pass before commit)
```

---

## Task Breakdown

### Phase 1: Foundation - Employment Types & Validation (6-8 hours)

#### Task 1.1: Create Employment Type System (TDD)

**Time**: 1.5 hours
**Files to Create**:
- `lib/forms/employment-types.ts`
- `tests/forms/employment-types.test.ts`

**Step 1: Write Failing Tests**

Create `tests/forms/employment-types.test.ts`:

```typescript
import {
  INCOME_RECOGNITION_RATES,
  VARIABLE_INCOME_RECOGNITION_RATE,
  DOCUMENTATION_REQUIREMENTS,
  EmploymentType
} from '@/lib/forms/employment-types'

describe('employment-types', () => {
  describe('Income Recognition Rates', () => {
    it('recognizes employed income at 100%', () => {
      expect(INCOME_RECOGNITION_RATES.employed).toBe(1.0)
    })

    it('recognizes self-employed income at 70%', () => {
      expect(INCOME_RECOGNITION_RATES['self-employed']).toBe(0.7)
    })

    it('recognizes in-between-jobs at 100%', () => {
      expect(INCOME_RECOGNITION_RATES['in-between-jobs']).toBe(1.0)
    })

    it('recognizes not-working at 0%', () => {
      expect(INCOME_RECOGNITION_RATES['not-working']).toBe(0.0)
    })

    it('recognizes variable income at 70%', () => {
      expect(VARIABLE_INCOME_RECOGNITION_RATE).toBe(0.7)
    })
  })

  describe('Documentation Requirements', () => {
    it('requires payslips and letter for employed', () => {
      expect(DOCUMENTATION_REQUIREMENTS.employed).toContain('Latest 3 months payslips')
      expect(DOCUMENTATION_REQUIREMENTS.employed).toContain('Employment letter')
    })

    it('requires 2 years NOA for self-employed', () => {
      expect(DOCUMENTATION_REQUIREMENTS['self-employed']).toContain('Latest 2 years Notice of Assessment (NOA)')
    })

    it('requires contract and work email for in-between-jobs', () => {
      expect(DOCUMENTATION_REQUIREMENTS['in-between-jobs']).toContain('Employment contract (signed)')
      expect(DOCUMENTATION_REQUIREMENTS['in-between-jobs']).toContain('Email from work email address')
    })
  })
})
```

**Step 2: Run Test (Should Fail)**
```bash
npm run test employment-types.test.ts
# Expected: Module not found error
```

**Step 3: Implement to Make Tests Pass**

Create `lib/forms/employment-types.ts`:

```typescript
// ABOUTME: Unified employment type system with Dr Elena v2 income recognition rates

export type EmploymentType =
  | 'employed'           // ≥3 months with employer (100% base + 70% variable)
  | 'self-employed'      // Business owner (70% on 2-year NOA)
  | 'in-between-jobs'    // <3 months with employer (100% base + 70% variable, needs contract)
  | 'not-working'        // Unemployed/retired (0% recognition)

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  'employed': 'Employed (3+ months with current employer)',
  'self-employed': 'Self-employed / Business owner',
  'in-between-jobs': 'Just started new job (<3 months)',
  'not-working': 'Not working'
}

// Dr Elena v2 income recognition rates (dr-elena-mortgage-expert-v2.json lines 190-211)
export const INCOME_RECOGNITION_RATES: Record<EmploymentType, number> = {
  'employed': 1.0,           // 100% on base salary
  'in-between-jobs': 1.0,    // 100% on base salary (but different docs)
  'self-employed': 0.7,      // 70% on declared NOA income
  'not-working': 0.0         // 0% (no income)
}

export const VARIABLE_INCOME_RECOGNITION_RATE = 0.7  // 70% for bonuses/commissions

export const DOCUMENTATION_REQUIREMENTS: Record<EmploymentType, string[]> = {
  'employed': [
    'Latest 3 months payslips',
    'Employment letter'
  ],
  'in-between-jobs': [
    'Employment contract (signed)',
    'Email from work email address (proof of employment)',
    'Available payslips (1-2 months if applicable)'
  ],
  'self-employed': [
    'Latest 2 years Notice of Assessment (NOA)',
    'Business registration documents'
  ],
  'not-working': []
}

export function getEmploymentRecognitionRate(type: EmploymentType): number {
  return INCOME_RECOGNITION_RATES[type]
}

export function calculateRecognizedIncome(params: {
  employmentType: EmploymentType
  baseIncome: number
  variableIncome?: number
  noaMonthlyAverage?: number  // For self-employed
}): number {
  const { employmentType, baseIncome, variableIncome = 0, noaMonthlyAverage = 0 } = params

  if (employmentType === 'self-employed') {
    return (noaMonthlyAverage || baseIncome) * 0.7
  }

  if (employmentType === 'not-working') {
    return 0
  }

  // employed or in-between-jobs
  const recognizedBase = baseIncome * 1.0
  const recognizedVariable = variableIncome * VARIABLE_INCOME_RECOGNITION_RATE

  return recognizedBase + recognizedVariable
}
```

**Step 4: Run Test (Should Pass)**
```bash
npm run test employment-types.test.ts
# Expected: All tests pass
```

**Step 5: Commit**
```bash
git add lib/forms/employment-types.ts tests/forms/employment-types.test.ts
git commit -m "feat(forms): add unified employment type system with Dr Elena v2 rates

- Create employment-types.ts with 4 types (employed, self-employed, in-between-jobs, not-working)
- Income recognition: employed 100%, self-employed 70%, variable 70%
- Documentation requirements per type from dr-elena-mortgage-expert-v2.json
- Add calculateRecognizedIncome helper
- Full test coverage (income recognition + documentation)

Tests: 8 passed
TDD: Write failing tests → Implement → All pass"
```

---

#### Task 1.2: Field Visibility Rules Engine (TDD)

**Time**: 2 hours
**Files to Create**:
- `lib/forms/field-visibility-rules.ts`
- `tests/forms/field-visibility-rules.test.ts`

**Step 1: Write Failing Tests**

Create `tests/forms/field-visibility-rules.test.ts`:

```typescript
import { getStep2VisibleFields } from '@/lib/forms/field-visibility-rules'
import type { LoanType, PropertyCategory, PropertyType } from '@/lib/contracts/form-contracts'

describe('field-visibility-rules', () => {
  describe('Step 2 Progressive Disclosure', () => {
    it('shows only category when nothing selected', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: null,
        propertyType: null
      })

      expect(fields).toEqual(['propertyCategory'])
    })

    it('shows category + type after category selected', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: null
      })

      expect(fields).toEqual(['propertyCategory', 'propertyType'])
    })

    it('shows price + age ONLY after type selected (NEW behavior)', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: 'Private'
      })

      expect(fields).toContain('propertyCategory')
      expect(fields).toContain('propertyType')
      expect(fields).toContain('priceRange')
      expect(fields).toContain('combinedAge')
    })

    it('shows existing properties checkbox for Private/EC/Landed', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: 'Private'
      })

      expect(fields).toContain('existingProperties')
    })

    it('does NOT show existing properties for HDB', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: 'HDB'
      })

      expect(fields).not.toContain('existingProperties')
    })

    it('refinance shows all fields immediately (no progressive disclosure)', () => {
      const fields = getStep2VisibleFields({
        loanType: 'refinance',
        propertyCategory: null,
        propertyType: 'Private'
      })

      expect(fields).toContain('propertyType')
      expect(fields).toContain('priceRange')
      expect(fields).toContain('outstandingLoan')
    })
  })
})
```

**Step 2: Run Test (Should Fail)**
```bash
npm run test field-visibility-rules.test.ts
```

**Step 3: Implement**

Create `lib/forms/field-visibility-rules.ts`:

```typescript
// ABOUTME: Centralized field visibility logic for progressive disclosure

import type { LoanType, PropertyCategory, PropertyType } from '@/lib/contracts/form-contracts'

interface Step2State {
  loanType: LoanType
  propertyCategory: PropertyCategory | null
  propertyType: PropertyType | null
}

export function getStep2VisibleFields(state: Step2State): string[] {
  const fields: string[] = []

  // Refinance: No progressive disclosure, show all immediately
  if (state.loanType === 'refinance') {
    return [
      'propertyType',
      'priceRange',
      'outstandingLoan',
      'currentRate',
      'currentBank',
      'existingProperties'
    ]
  }

  // New Purchase: 3-level progressive disclosure

  // Level 1: Category always visible
  fields.push('propertyCategory')

  // Level 2: Type appears after category selected
  if (state.propertyCategory) {
    fields.push('propertyType')
  }

  // Level 3: Price + age appear ONLY after type selected
  if (state.propertyType) {
    fields.push('priceRange', 'combinedAge')

    // Existing properties checkbox (for Private/EC/Landed only)
    if (['Private', 'EC', 'Landed'].includes(state.propertyType)) {
      fields.push('existingProperties')
    }
  }

  return fields
}

export function shouldShowField(fieldName: string, visibleFields: string[]): boolean {
  return visibleFields.includes(fieldName)
}
```

**Step 4: Run Test (Should Pass)**
```bash
npm run test field-visibility-rules.test.ts
```

**Step 5: Commit**
```bash
git add lib/forms/field-visibility-rules.ts tests/forms/field-visibility-rules.test.ts
git commit -m "feat(forms): add 3-level progressive disclosure for Step 2

- Level 1: Category always visible
- Level 2: Type after category selected
- Level 3: Price + age ONLY after type selected (NEW)
- Refinance bypasses progressive disclosure (all fields shown)
- Test coverage: 6 test cases covering all disclosure levels

Tests: 6 passed
TDD: Write failing tests → Implement → All pass"
```

---

#### Task 1.3: Clean Property Type Labels

**Time**: 1 hour
**Files to Modify**:
- `lib/forms/form-config.ts`
- `tests/forms/form-config.test.ts` (if exists)

**Step 1: Read Current Implementation**
```bash
# Review current property type options
cat lib/forms/form-config.ts | grep -A 20 "propertyTypeOptionsByCategory"
```

**Step 2: Update Labels** (Remove redundant suffixes)

Edit `lib/forms/form-config.ts`:

```typescript
export const propertyTypeOptionsByCategory: Record<
  'default' | 'resale' | 'new_launch' | 'bto' | 'commercial' | 'refinance',
  PropertyTypeOption[]
> = {
  default: [
    { value: 'HDB', label: 'HDB Flat' },
    { value: 'EC', label: 'Executive Condo' },
    { value: 'Private', label: 'Private Condo' },
    { value: 'Landed', label: 'Landed Property' }
  ],
  resale: [
    { value: 'HDB', label: 'HDB Flat' },              // REMOVED: (Resale)
    { value: 'Private', label: 'Private Condo' },      // REMOVED: (Resale)
    { value: 'Landed', label: 'Landed Property' }      // REMOVED: (Resale)
  ],
  new_launch: [
    { value: 'EC', label: 'Executive Condo' },         // REMOVED: (New Launch)
    { value: 'Private', label: 'Private Condo' },      // REMOVED: (New Launch)
    { value: 'Landed', label: 'Landed Property' }      // REMOVED: (New Launch)
  ],
  bto: [
    { value: 'HDB', label: 'HDB Flat' }                // REMOVED: (BTO)
  ],
  commercial: [
    { value: 'Commercial', label: 'Commercial Property' }
  ],
  refinance: [
    { value: 'HDB', label: 'HDB Flat' },
    { value: 'EC', label: 'Executive Condo' },
    { value: 'Private', label: 'Private Condo' },
    { value: 'Landed', label: 'Landed Property' }
  ]
}
```

**Step 3: Add Validation Test**

Create test to ensure valid category-type combinations:

```typescript
// tests/forms/property-type-validation.test.ts
describe('Property Type Validation', () => {
  it('resale category only allows HDB, Private, Landed', () => {
    const options = getPropertyTypeOptions('new_purchase', 'resale')
    const values = options.map(opt => opt.value)

    expect(values).toEqual(['HDB', 'Private', 'Landed'])
    expect(values).not.toContain('EC')
  })

  it('new_launch category only allows EC, Private, Landed', () => {
    const options = getPropertyTypeOptions('new_purchase', 'new_launch')
    const values = options.map(opt => opt.value)

    expect(values).toEqual(['EC', 'Private', 'Landed'])
    expect(values).not.toContain('HDB')
  })

  it('labels are clean without category suffixes', () => {
    const options = getPropertyTypeOptions('new_purchase', 'resale')

    options.forEach(opt => {
      expect(opt.label).not.toContain('(Resale)')
      expect(opt.label).not.toContain('(New Launch)')
    })
  })
})
```

**Step 4: Run Tests**
```bash
npm run test property-type-validation.test.ts
```

**Step 5: Commit**
```bash
git add lib/forms/form-config.ts tests/forms/property-type-validation.test.ts
git commit -m "refactor(forms): remove redundant property type label suffixes

- Clean labels: 'HDB Flat' not 'HDB Flat (Resale)'
- Context provided by progressive disclosure (user already selected category)
- Validation ensures category-type combinations still enforced
- Aligns with Part04 Brand Canon (Calm Intelligence, concise copy)

Tests: 3 passed
File: lib/forms/form-config.ts"
```

---

### Phase 2: Shared Components (8-10 hours)

#### Task 2.1: EmploymentPanel Component (TDD)

**Time**: 3 hours
**Files to Create**:
- `components/forms/sections/EmploymentPanel.tsx`
- `tests/components/EmploymentPanel.test.tsx`

**Context**: This is a NEW shared component that replaces duplicated employment fields in Step3NewPurchase and Step3Refinance. It will be used for BOTH Applicant 1 and Co-Applicant.

**Step 1: Write Failing Component Tests**

Create `tests/components/EmploymentPanel.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useForm, FormProvider } from 'react-hook-form'
import { EmploymentPanel } from '@/components/forms/sections/EmploymentPanel'

// Test wrapper to provide React Hook Form context
const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('EmploymentPanel', () => {
  const mockOnFieldChange = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders employment type dropdown', () => {
    render(
      <TestWrapper>
        <EmploymentPanel
          applicantNumber={0}
          onFieldChange={mockOnFieldChange}
          errors={{}}
        />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument()
  })

  it('shows self-employed panel when type is self-employed', async () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'employed' }}>
        <EmploymentPanel applicantNumber={0} onFieldChange={mockOnFieldChange} errors={{}} />
      </TestWrapper>
    )

    const select = screen.getByLabelText(/Employment Type/i)
    fireEvent.change(select, { target: { value: 'self-employed' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/business has been operating/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Average.*NOA/i)).toBeInTheDocument()
    })
  })

  it('shows in-between-jobs panel with contract verification', async () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'employed' }}>
        <EmploymentPanel applicantNumber={0} onFieldChange={mockOnFieldChange} errors={{}} />
      </TestWrapper>
    )

    const select = screen.getByLabelText(/Employment Type/i)
    fireEvent.change(select, { target: { value: 'in-between-jobs' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Months with current employer/i)).toBeInTheDocument()
      expect(screen.getByText(/employment contract/i)).toBeInTheDocument()
    })
  })

  it('displays income recognition rate help text', () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'self-employed' }}>
        <EmploymentPanel applicantNumber={0} onFieldChange={mockOnFieldChange} errors={{}} />
      </TestWrapper>
    )

    expect(screen.getByText(/70%/i)).toBeInTheDocument()
  })

  it('hides conditional panels when switching back to employed', async () => {
    render(
      <TestWrapper defaultValues={{ employmentType: 'self-employed' }}>
        <EmploymentPanel applicantNumber={0} onFieldChange={mockOnFieldChange} errors={{}} />
      </TestWrapper>
    )

    // Should show self-employed panel initially
    expect(screen.getByLabelText(/business has been operating/i)).toBeInTheDocument()

    // Switch to employed
    const select = screen.getByLabelText(/Employment Type/i)
    fireEvent.change(select, { target: { value: 'employed' } })

    await waitFor(() => {
      expect(screen.queryByLabelText(/business has been operating/i)).not.toBeInTheDocument()
    })
  })

  it('works for co-applicant with applicantNumber=1', () => {
    render(
      <TestWrapper>
        <EmploymentPanel
          applicantNumber={1}
          onFieldChange={mockOnFieldChange}
          errors={{}}
        />
      </TestWrapper>
    )

    // Should still render but with different field names
    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run Test (Should Fail)**
```bash
npm run test EmploymentPanel.test.tsx
# Expected: Module not found error
```

**Step 3: Implement Component**

Create `components/forms/sections/EmploymentPanel.tsx`:

```typescript
// ABOUTME: Shared employment field panel with progressive disclosure for all employment types

'use client'

import { useMemo } from 'react'
import { Control, Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  EmploymentType,
  EMPLOYMENT_LABELS,
  getEmploymentRecognitionRate
} from '@/lib/forms/employment-types'

interface EmploymentPanelProps {
  applicantNumber: 0 | 1             // Primary (0) or Co-applicant (1)
  control: Control<any>
  errors: any
  onFieldChange: (field: string, value: any, analytics?: any) => void
  showEmploymentDetails?: boolean    // Show conditional panels (default: true)
  compact?: boolean                  // Compact mode for co-applicant (default: false)
}

export function EmploymentPanel({
  applicantNumber,
  control,
  errors,
  onFieldChange,
  showEmploymentDetails = true,
  compact = false
}: EmploymentPanelProps) {
  // Watch employment type to show conditional panels
  const employmentType = useWatch({
    control,
    name: applicantNumber === 0 ? 'employmentType' : 'employmentType_1',
    defaultValue: 'employed'
  }) as EmploymentType

  const recognitionRate = getEmploymentRecognitionRate(employmentType)

  const fieldPrefix = applicantNumber === 0 ? '' : '_1'

  // Self-employed conditional panel
  const renderSelfEmployedPanel = () => {
    if (!showEmploymentDetails || employmentType !== 'self-employed') return null

    return (
      <div className="space-y-3 border border-[#E5E5E5] bg-white p-3 mt-3">
        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
          Self-employed details
        </p>

        <Controller
          name={`employmentDetails${fieldPrefix}.self-employed.businessAgeYears`}
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={`self-employed-business-age-${applicantNumber}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Years your business has been operating
              </label>
              <Input
                {...field}
                id={`self-employed-business-age-${applicantNumber}`}
                type="number"
                min="0"
                placeholder="5"
                onChange={(e) => {
                  field.onChange(e.target.value)
                  onFieldChange(`employmentDetails${fieldPrefix}.self-employed.businessAgeYears`, e.target.value, {
                    section: 'employment_panel',
                    action: 'business_age_updated',
                    applicant: applicantNumber
                  })
                }}
              />
            </div>
          )}
        />

        <Controller
          name={`employmentDetails${fieldPrefix}.self-employed.averageReportedIncome`}
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={`self-employed-noa-${applicantNumber}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Average monthly income from 2-year NOA
              </label>
              <Input
                {...field}
                id={`self-employed-noa-${applicantNumber}`}
                type="number"
                min="0"
                placeholder="10000"
                className="font-mono"
                onChange={(e) => {
                  field.onChange(e.target.value)
                  onFieldChange(`employmentDetails${fieldPrefix}.self-employed.averageReportedIncome`, Number(e.target.value) || 0, {
                    section: 'employment_panel',
                    action: 'noa_income_updated',
                    applicant: applicantNumber
                  })
                }}
              />
              <p className="text-xs text-[#666666] mt-1">
                We recognize 70% of your average monthly income from your latest 2-year NOA
              </p>
            </div>
          )}
        />
      </div>
    )
  }

  // In-between-jobs conditional panel
  const renderInBetweenJobsPanel = () => {
    if (!showEmploymentDetails || employmentType !== 'in-between-jobs') return null

    return (
      <div className="space-y-3 border border-[#E5E5E5] bg-white p-3 mt-3">
        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
          New employment details
        </p>

        <Controller
          name={`employmentDetails${fieldPrefix}.in-between-jobs.monthsWithEmployer`}
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={`in-between-months-${applicantNumber}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Months with current employer (0-2)
              </label>
              <Input
                {...field}
                id={`in-between-months-${applicantNumber}`}
                type="number"
                min="0"
                max="2"
                placeholder="1"
                onChange={(e) => {
                  field.onChange(e.target.value)
                  onFieldChange(`employmentDetails${fieldPrefix}.in-between-jobs.monthsWithEmployer`, e.target.value)
                }}
              />
            </div>
          )}
        />

        <div className="p-3 bg-[#F8F8F8] border border-[#E5E5E5]">
          <p className="text-xs text-[#666666]">
            Since you're new to this job, we'll need your signed employment contract and an email from your work email to verify employment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Controller
        name={applicantNumber === 0 ? 'employmentType' : 'employmentType_1'}
        control={control}
        render={({ field }) => (
          <div>
            <label
              id={`employment-type-label-${applicantNumber}`}
              className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
            >
              Employment Type *
            </label>
            <Select
              value={field.value || 'employed'}
              onValueChange={(value) => {
                field.onChange(value)
                onFieldChange(applicantNumber === 0 ? 'employmentType' : 'employmentType_1', value, {
                  section: 'employment_panel',
                  action: 'changed',
                  applicant: applicantNumber,
                  metadata: {
                    from: field.value || 'none',
                    to: value,
                    recognitionRate: getEmploymentRecognitionRate(value as EmploymentType)
                  }
                })
              }}
            >
              <SelectTrigger
                id={`employment-type-select-${applicantNumber}`}
                aria-labelledby={`employment-type-label-${applicantNumber}`}
              >
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[applicantNumber === 0 ? 'employmentType' : 'employmentType_1'] && (
              <p className="text-[#DC2626] text-xs mt-1" role="alert">
                Employment type is required
              </p>
            )}
            <p className="text-xs text-[#666666] mt-1">
              Income recognition: {Math.round(recognitionRate * 100)}%
            </p>
          </div>
        )}
      />

      {renderSelfEmployedPanel()}
      {renderInBetweenJobsPanel()}
    </div>
  )
}
```

**Step 4: Run Test (Should Pass)**
```bash
npm run test EmploymentPanel.test.tsx
# Expected: All 6 tests pass
```

**Step 5: Manual Test in Browser**
```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3000/apply
# Test employment type dropdown switching
# Verify conditional panels appear/disappear
```

**Step 6: Commit**
```bash
git add components/forms/sections/EmploymentPanel.tsx tests/components/EmploymentPanel.test.tsx
git commit -m "feat(forms): add shared EmploymentPanel component with progressive disclosure

- Supports 4 employment types: employed, self-employed, in-between-jobs, not-working
- Conditional panels for self-employed (business age, NOA income) and in-between-jobs (months, contract)
- Works for both Applicant 1 (applicantNumber=0) and Co-Applicant (applicantNumber=1)
- Shows income recognition rate (100%, 70%, 0%) as help text
- Brand canon compliant: Inter font, conversational help text, 8px spacing

Tests: 6 passed (component rendering, conditional panels, field switching)
TDD: Write failing tests → Implement component → All pass"
```

---

#### Task 2.2: CoApplicantPanel Component (Wrapper)

**Time**: 1.5 hours
**Files to Create**:
- `components/forms/sections/CoApplicantPanel.tsx`
- `tests/components/CoApplicantPanel.test.tsx`

**Context**: Co-Applicant now gets FULL mirror of Applicant 1 fields (income, age, employment). This component wraps EmploymentPanel and adds income/age fields.

**Step 1: Write Failing Tests**

Create `tests/components/CoApplicantPanel.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { useForm, FormProvider } from 'react-hook-form'
import { CoApplicantPanel } from '@/components/forms/sections/CoApplicantPanel'

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('CoApplicantPanel', () => {
  const mockOnFieldChange = jest.fn()

  it('renders all co-applicant fields', () => {
    render(
      <TestWrapper>
        <CoApplicantPanel
          control={null as any}
          errors={{}}
          onFieldChange={mockOnFieldChange}
          loanType="new_purchase"
        />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Monthly Income/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument()
  })

  it('uses EmploymentPanel with applicantNumber=1', () => {
    render(
      <TestWrapper>
        <CoApplicantPanel
          control={null as any}
          errors={{}}
          onFieldChange={mockOnFieldChange}
          loanType="new_purchase"
        />
      </TestWrapper>
    )

    // Employment panel should be for co-applicant
    const select = screen.getByLabelText(/Employment Type/i)
    expect(select).toHaveAttribute('id', 'employment-type-select-1')
  })

  it('shows variable income field with help text', () => {
    render(
      <TestWrapper>
        <CoApplicantPanel
          control={null as any}
          errors={{}}
          onFieldChange={mockOnFieldChange}
          loanType="new_purchase"
        />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/Variable.*bonus.*income/i)).toBeInTheDocument()
    expect(screen.getByText(/70%/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run Test (Should Fail)**
```bash
npm run test CoApplicantPanel.test.tsx
# Expected: Module not found error
```

**Step 3: Implement Component**

Create `components/forms/sections/CoApplicantPanel.tsx`:

```typescript
// ABOUTME: Co-applicant panel with full field parity (income, age, employment)

'use client'

import { Control, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { EmploymentPanel } from './EmploymentPanel'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'

interface CoApplicantPanelProps {
  control: Control<any>
  errors: any
  onFieldChange: (field: string, value: any, analytics?: any) => void
  loanType: 'new_purchase' | 'refinance'
}

export function CoApplicantPanel({
  control,
  errors,
  onFieldChange,
  loanType
}: CoApplicantPanelProps) {
  return (
    <div className="space-y-4 p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
      <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
        Applicant 2 (Joint)
      </p>

      {/* Monthly Income */}
      <Controller
        name="actualIncomes.1"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="monthly-income-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
              Monthly Income *
            </label>
            <Input
              {...field}
              id="monthly-income-joint"
              type="text"
              inputMode="numeric"
              className="font-mono"
              placeholder="6,000"
              value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
              onChange={(e) => {
                const parsedValue = parseFormattedNumber(e.target.value) || 0
                field.onChange(parsedValue)
                onFieldChange('actualIncomes.1', parsedValue, {
                  section: 'co_applicant',
                  action: 'income_updated',
                  applicant: 1
                })
              }}
            />
            {errors['actualIncomes.1'] && (
              <p className="text-[#DC2626] text-xs mt-1" role="alert">
                Monthly income is required
              </p>
            )}
          </div>
        )}
      />

      {/* Variable Income (Optional) */}
      <Controller
        name="actualVariableIncomes.1"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="variable-income-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
              Variable / bonus income (optional)
            </label>
            <Input
              {...field}
              id="variable-income-joint"
              type="text"
              inputMode="numeric"
              className="font-mono"
              placeholder="1,500"
              value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
              onChange={(e) => {
                const parsedValue = parseFormattedNumber(e.target.value) || 0
                field.onChange(parsedValue)
                onFieldChange('actualVariableIncomes.1', parsedValue, {
                  section: 'co_applicant',
                  action: 'variable_income_updated',
                  applicant: 1
                })
              }}
            />
            <p className="text-xs text-[#666666] mt-1">
              70% of commissions and bonuses are recognized
            </p>
          </div>
        )}
      />

      {/* Age */}
      <Controller
        name="actualAges.1"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="age-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
              Age *
            </label>
            <Input
              {...field}
              id="age-joint"
              type="number"
              min="18"
              max="99"
              step="1"
              placeholder="35"
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                field.onChange(value)
                onFieldChange('actualAges.1', value, {
                  section: 'co_applicant',
                  action: 'age_updated',
                  applicant: 1
                })
              }}
            />
            {errors['actualAges.1'] && (
              <p className="text-[#DC2626] text-xs mt-1" role="alert">
                Age is required
              </p>
            )}
          </div>
        )}
      />

      {/* Employment Panel (Reused!) */}
      <EmploymentPanel
        applicantNumber={1}
        control={control}
        errors={errors}
        onFieldChange={onFieldChange}
      />
    </div>
  )
}
```

**Step 4: Run Test (Should Pass)**
```bash
npm run test CoApplicantPanel.test.tsx
# Expected: All 3 tests pass
```

**Step 5: Manual Test**
```bash
npm run dev

# Navigate to http://localhost:3000/apply
# Go to Step 3
# Toggle "Add joint applicant"
# Verify:
# - Income field appears
# - Variable income field appears
# - Age field appears
# - Employment type dropdown appears
# - Employment conditional panels work
```

**Step 6: Commit**
```bash
git add components/forms/sections/CoApplicantPanel.tsx tests/components/CoApplicantPanel.test.tsx
git commit -m "feat(forms): add CoApplicantPanel with full field parity

- Income + variable income fields (with comma formatting)
- Age field (18-99 validation)
- Reuses EmploymentPanel component (applicantNumber=1)
- Full mirror of Applicant 1 structure
- Brand canon: conversational help text, 8px spacing, Inter font

Tests: 3 passed (fields render, employment panel integration, help text)
Component: Wraps EmploymentPanel for DRY principle"
```

---

### Phase 3: Responsive Layout System (6-8 hours)

#### Task 3.1: useResponsiveLayout Hook

**Time**: 1.5 hours
**Files to Create**:
- `hooks/useResponsiveLayout.ts`
- `tests/hooks/useResponsiveLayout.test.ts`

**Context**: Detects viewport size and returns mobile/tablet/desktop flags for responsive rendering.

**Step 1: Write Failing Tests**

Create `tests/hooks/useResponsiveLayout.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'

// Mock window.matchMedia
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes(`${width}px`),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  })

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width
  })
}

describe('useResponsiveLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('detects mobile viewport (<768px)', () => {
    mockMatchMedia(375)

    const { result } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.width).toBe(375)
  })

  it('detects tablet viewport (768-1023px)', () => {
    mockMatchMedia(900)

    const { result } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.width).toBe(900)
  })

  it('detects desktop viewport (≥1024px)', () => {
    mockMatchMedia(1440)

    const { result } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.width).toBe(1440)
  })

  it('updates on window resize', () => {
    mockMatchMedia(375)

    const { result, rerender } = renderHook(() => useResponsiveLayout())

    expect(result.current.isMobile).toBe(true)

    // Simulate resize to desktop
    act(() => {
      mockMatchMedia(1440)
      window.dispatchEvent(new Event('resize'))
    })

    rerender()

    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
  })
})
```

**Step 2: Run Test (Should Fail)**
```bash
npm run test useResponsiveLayout.test.ts
# Expected: Module not found error
```

**Step 3: Implement Hook**

Create `hooks/useResponsiveLayout.ts`:

```typescript
// ABOUTME: Responsive layout hook for mobile/tablet/desktop detection with SSR safety

'use client'

import { useState, useEffect } from 'react'

interface ResponsiveLayout {
  isMobile: boolean    // <768px
  isTablet: boolean    // 768-1023px
  isDesktop: boolean   // ≥1024px
  width: number
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,  // Default to desktop for SSR
    width: typeof window !== 'undefined' ? window.innerWidth : 1024
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth

      setLayout({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width
      })
    }

    // Initial check on mount
    handleResize()

    // Listen for window resize events
    window.addEventListener('resize', handleResize)

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return layout
}
```

**Step 4: Run Test (Should Pass)**
```bash
npm run test useResponsiveLayout.test.ts
# Expected: All 4 tests pass
```

**Step 5: Commit**
```bash
git add hooks/useResponsiveLayout.ts tests/hooks/useResponsiveLayout.test.ts
git commit -m "feat(hooks): add useResponsiveLayout for viewport detection

- Breakpoints: <768px mobile, 768-1023px tablet, ≥1024px desktop
- Returns { isMobile, isTablet, isDesktop, width }
- SSR-safe (defaults to desktop, checks window exists)
- Listens to resize events, cleans up on unmount
- Updates state on viewport changes

Tests: 4 passed (mobile, tablet, desktop detection, resize handling)"
```

---