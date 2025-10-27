# Forms Architecture Guide

**Last Updated:** 2025-10-26

## Production Forms Status

### Active Production Form
**File:** `components/forms/ProgressiveFormWithController.tsx`
**Route:** `/app/apply/page.tsx`
**Status:** ✅ PRODUCTION (Tier 1)
**Features:** 3-step progressive, Chatwoot integration, Step3 components, analytics
**Size:** 1,517 lines

### Landing Page
**File:** `app/page.tsx`
**Purpose:** Homepage with loan type selection → routes to `/apply`
**Previously:** Was in `app/redesign/sophisticated-flow/page.tsx` (archived 2025-10-18)

### Archived Experimental Forms
**Location:** `components/archive/2025-10/redesign-experiments/`
**Contents:** SophisticatedProgressiveForm and related prototypes
**Status:** Reference only, not for production use

---

## Overview
NextNest uses a hybrid form architecture optimized for performance, SEO, and user experience. This guide documents our form patterns, bundle optimization strategies, and best practices.

## Form Component Hierarchy

```
ContactSection (Static/SSR friendly)
├── Basic HTML Form (Default - SEO visible)
└── IntelligentMortgageForm (Dynamic import - Complex features)
    ├── ProgressiveForm (Multi-step with validation)
    ├── AI Agents (Lead scoring, insights)
    └── ShadCN UI Components (Form, FormField, etc.)
```

## Bundle Size Strategy

### Current Performance Metrics
- **Homepage Bundle**: 90.5 kB (First Load JS)
- **Shared Chunks**: 87.3 kB
- **Target**: <140KB ✅ Achieved

### Optimization Techniques

#### 1. Dynamic Imports for Heavy Components
```typescript
// ❌ Bad - Loads everything upfront
import IntelligentMortgageForm from './forms/IntelligentMortgageForm'

// ✅ Good - Loads on demand
const IntelligentMortgageForm = dynamic(
  () => import('./forms/IntelligentMortgageForm'),
  { 
    loading: () => <div>Loading...</div>,
    ssr: false // Only for client-heavy components
  }
)
```

#### 2. Package Import Optimization
Configure in `next.config.js`:
```javascript
experimental: {
  optimizePackageImports: [
    'react-hook-form',
    'date-fns',
    '@radix-ui/react-select',
    '@radix-ui/react-label',
    'lucide-react'
  ]
}
```

#### 3. Production Optimizations
```javascript
swcMinify: true,
compiler: {
  removeConsole: process.env.NODE_ENV === 'production',
}
```

## Form Patterns

### 1. Basic Form (SEO-Friendly)
Use for simple forms that need to be crawlable:

```tsx
// Plain HTML form - fully SSR/static compatible
<form onSubmit={handleSubmit} className="space-y-6">
  <input type="text" name="name" required />
  <button type="submit">Submit</button>
</form>
```

### 2. ShadCN Form Pattern
Use for complex forms with validation:

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 3. Progressive Multi-Step Forms
For complex user journeys:

```tsx
// Use LeadForm entity for state management
const leadForm = useMemo(() => new LeadForm(loanType), [loanType])

// Progress through steps with validation
const progressToNextStep = (data: any) => {
  if (leadForm.progressToStep(currentStep + 1)) {
    setCurrentStep(prev => prev + 1)
  }
}
```

## SEO & GEO Considerations

### Static/SSR Compatibility

| Component | SSR | Static | SEO Impact | When to Use |
|-----------|-----|--------|------------|-------------|
| Basic HTML Form | ✅ | ✅ | Full visibility | Landing pages, simple contacts |
| ShadCN Forms | ✅ | ✅ | Full visibility | Complex validation needed |
| Dynamic Forms | ❌ | ❌ | Hidden from crawlers | Heavy interactions, AI features |

### Programmatic SEO Strategy

1. **Landing Pages**: Use basic forms for full SEO visibility
2. **Calculator Pages**: Can use ShadCN forms (SSR compatible)
3. **Interactive Tools**: Dynamic import for performance

Example for programmatic pages:
```tsx
// app/mortgage/[city]/page.tsx
export default function CityMortgagePage({ params }) {
  // This content is fully SSR/static
  return (
    <>
      <h1>Mortgage Broker in {params.city}</h1>
      <BasicContactForm /> {/* SEO visible */}
      
      {/* Complex form loads only if user interacts */}
      <DynamicCalculator />
    </>
  )
}
```

## Bundle Size Monitoring

### Check Bundle Size
```bash
npm run build
# Look for "First Load JS" in output
```

### Analyze Bundle
```bash
# Install analyzer
npm i -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Run analysis
ANALYZE=true npm run build
```

### Red Flags to Watch
- First Load JS > 150KB
- Individual route > 200KB
- Shared chunks > 100KB

## Best Practices

### ✅ DO's
1. **Dynamic import** heavy components not needed for initial render
2. **Use basic forms** for SEO-critical pages
3. **Optimize imports** in next.config.js
4. **Monitor bundle size** in CI/CD
5. **Lazy load** below-the-fold components

### ❌ DON'Ts
1. **Don't dynamic import** SEO-critical content
2. **Don't use ssr: false** for content pages
3. **Don't import** entire libraries (use tree-shaking)
4. **Don't bundle** test/development code
5. **Don't ignore** build warnings about size

## Form Component Decision Tree

```
Need SEO visibility?
├─ Yes → Use basic HTML form or SSR-compatible ShadCN
└─ No → Complex interactions needed?
    ├─ Yes → Dynamic import with loading state
    └─ No → Regular ShadCN form

Need validation?
├─ Simple → HTML5 validation
├─ Complex → Zod + React Hook Form
└─ Multi-step → LeadForm entity + ProgressiveForm

Page type?
├─ Landing → Optimize for speed (basic forms)
├─ Tool → Balance features/performance
└─ Dashboard → Full features OK (authenticated)
```

## Migration Guide

### Converting Forms to Optimized Pattern

1. **Identify heavy forms** (>50KB impact)
2. **Wrap in dynamic()** import
3. **Add loading state**
4. **Test SSR/static generation**
5. **Verify bundle size reduction**

### Example Migration
```tsx
// Before: 181 kB bundle
import ComplexForm from './ComplexForm'

// After: 90.5 kB bundle
const ComplexForm = dynamic(() => import('./ComplexForm'), {
  loading: () => <FormSkeleton />,
  ssr: false // Only if no SEO needed
})
```

## Monitoring & Maintenance

### Regular Checks
- [ ] Weekly: Check build output for size regression
- [ ] Monthly: Run bundle analyzer
- [ ] Quarterly: Audit form patterns
- [ ] Per feature: Assess SSR/static needs

### Performance Budget
- Homepage: <100KB First Load JS
- Feature pages: <150KB First Load JS
- Shared chunks: <90KB
- Individual chunks: <50KB

## Troubleshooting

### Bundle Size Too Large
1. Check for accidental imports
2. Look for duplicate dependencies
3. Verify dynamic imports working
4. Check for dev dependencies in prod

### SSR/Hydration Errors
1. Ensure dynamic imports have `ssr: false` if needed
2. Check for browser-only APIs
3. Verify loading states
4. Test with `npm run build && npm start`

### Form Not SEO Visible
1. Remove dynamic import for SEO pages
2. Use progressive enhancement
3. Ensure critical content in initial HTML
4. Test with `curl` or Google's Rich Results Test

## Recent Changes & Awareness Notes

### Property-Type-Aware Rates (2025-10-18)
**Commit:** `c55f4c3`
**Impact:** G3 validation now uses property-specific refinance rates

**What Changed:**
- `lib/validation/dynamic-g3-validation.ts` now uses `getPlaceholderRate()` for market rate assumptions
- Refinance savings calculations adapt to property type (HDB: 2.1%, Private: 2.6%, Commercial: 3.0%)

**Testing Recommendations:**
- Test refinance scenarios across HDB, Private, and Commercial properties
- Verify potential savings calculations show different thresholds for different property types
- Monitor G3 validation edge cases (low current rates, high outstanding loans)

**Related Files:**
- Source function: `lib/calculations/instant-profile.ts:862-870` (`getPlaceholderRate`)
- Validation logic: `lib/validation/dynamic-g3-validation.ts:122-133`
- Function usage audit: `docs/plans/active/2025-10-18-function-usage-audit-plan.md`

**Deferred Opportunities:**
- Using full `calculateRefinancingSavings()` for break-even analysis in G3 validation (MEDIUM priority)
- Property-type-aware rates in ProgressiveFormWithController instant analysis UI (LOW priority)

---

---

## Progressive Disclosure System V2 (2025-10-25)

### Overview

Complete redesign implementing 3-level progressive disclosure, unified employment types across loan paths, mobile-first responsive layout, and brand canon compliance.

**Implementation Plan:** `docs/plans/active/2025-10-25-progressive-form-full-system-redesign.md`

**Key Improvements:**
- **Deeper Step 2 Disclosure**: Category → Type → Price/Age (3-level reveal)
- **Unified Employment**: 4 employment types with income recognition rates
- **Co-Applicant Parity**: Full field mirror (income, age, employment)
- **Responsive Layout**: Floating sidebar (desktop), inline card (mobile)
- **Clean Labels**: Removed redundant property type suffixes
- **Brand Canon**: Part04 design principles (typography, spacing, conversational copy)

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

**Example Usage:**
```tsx
<EmploymentPanel
  applicantNumber={0}  // 0 for primary, 1 for co-applicant
  control={control}
  errors={errors}
  onFieldChange={onFieldChange}
/>
```

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

**Example:**
```tsx
const visibleFields = getStep2VisibleFields({
  loanType: 'new_purchase',
  propertyCategory: 'resale',
  propertyType: 'Private'
})
// Returns: ['propertyCategory', 'propertyType', 'priceRange', 'combinedAge', 'existingProperties']
```

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
| `progressive-form-layout.css` | Mobile-first CSS Grid | `styles/progressive-form-layout.css` |

**Desktop Layout (≥1024px):**
```css
.form-layout-container {
  display: grid;
  grid-template-columns: minmax(450px, 1fr) 380px;
  gap: 0; /* Using padding + divider instead */
}

.form-content {
  border-right: 1px solid #E5E5E5; /* Vertical divider */
  padding-right: 2rem;
}

.form-sidebar {
  position: sticky;
  top: 2rem;
  padding-left: 2rem;
}
```

**Mobile Layout (<768px):**
```css
.form-layout-container {
  display: block;
  padding: 1rem;
}

.form-sidebar {
  display: none; /* Hidden on mobile */
}
```

**Example Usage:**
```tsx
<ResponsiveFormLayout
  sidebar={<InstantAnalysisSidebar />}
  showSidebar={hasCalculated}
>
  <form>{/* Form fields */}</form>
</ResponsiveFormLayout>
```

---

### Brand Canon Compliance (Part04)

**Typography:**
- Font: Inter (already in use)
- Headline: `font-normal text-center` (3xl/4xl)
- Labels: `text-xs uppercase tracking-wider font-semibold`
- Body: 14px minimum for readability

**Spacing (8px System):**
- `spacing-xs`: 0.5rem (8px)
- `spacing-sm`: 1rem (16px)
- `spacing-md`: 2rem (32px)
- `spacing-lg`: 4rem (64px)

**Colors:**
- Primary text: `#000000` (black)
- Secondary text: `#666666` (gray)
- Borders: `#E5E5E5` (light gray)
- Background: `#F8F8F8` (off-white)
- Accent: `#FFD700` (gold)

**Conversational Copy:**
- Help text explains "why" not just "what"
- Example: "We recognize 70% of your average monthly income from your latest 2-year NOA"
- Avoid jargon, use plain language

**Accessibility:**
- All labels have `htmlFor` or `aria-label`
- Error messages have `role="alert"`
- Color contrast ≥4.5:1
- Touch targets ≥48px on mobile
- Respects `prefers-reduced-motion`

---

### Testing Strategy

**Unit Tests:**
- `employment-types.test.ts` - Income recognition rates, documentation requirements
- `field-visibility-rules.test.ts` - Progressive disclosure logic
- `EmploymentPanel.test.tsx` - Component rendering, conditional panels
- `CoApplicantPanel.test.tsx` - Field parity, integration
- `ResponsiveFormLayout.test.tsx` - Viewport-based rendering
- `useResponsiveLayout.test.ts` - Breakpoint detection

**E2E Tests:**
- `complete-progressive-form-journey.spec.ts` - Full user journeys
  - New purchase: 3-level progressive disclosure
  - Refinance: Employment progressive disclosure parity
  - Property type labels: Clean (no suffixes)
  - All employment types: Correct conditional panels

**Test Coverage Target:** 80%+ for new components

**Running Tests:**
```bash
npm run test                  # Unit tests
npm run test:e2e             # E2E tests
npm run test:watch           # Watch mode
```

---

### File Reference

**Core Libraries:**
- `lib/forms/employment-types.ts` - Employment type system
- `lib/forms/field-visibility-rules.ts` - Progressive disclosure logic
- `lib/forms/form-config.ts` - Property type options (clean labels)

**Shared Components:**
- `components/forms/sections/EmploymentPanel.tsx` - Employment fields
- `components/forms/sections/CoApplicantPanel.tsx` - Co-applicant wrapper
- `components/forms/layout/ResponsiveFormLayout.tsx` - Layout container

**Step Components:**
- `components/forms/sections/Step3NewPurchase.tsx` - New purchase path
- `components/forms/sections/Step3Refinance.tsx` - Refinance path

**Hooks:**
- `hooks/useResponsiveLayout.ts` - Viewport detection

**Styles:**
- `styles/progressive-form-layout.css` - Mobile-first CSS Grid

**Tests:**
- `tests/forms/employment-types.test.ts`
- `tests/forms/field-visibility-rules.test.ts`
- `tests/forms/property-type-validation.test.ts`
- `tests/components/EmploymentPanel.test.tsx`
- `tests/components/CoApplicantPanel.test.tsx`
- `tests/components/ResponsiveFormLayout.test.tsx`
- `tests/hooks/useResponsiveLayout.test.ts`
- `tests/e2e/complete-progressive-form-journey.spec.ts`

---

### Migration Guide

**If You're Working With Forms:**

1. **Employment Fields** - Don't duplicate, use `<EmploymentPanel>`
   ```tsx
   // Before: 200+ lines of employment field code
   // After:
   <EmploymentPanel applicantNumber={0} control={control} errors={errors} onFieldChange={onFieldChange} />
   ```

2. **Co-Applicant Fields** - Don't duplicate, use `<CoApplicantPanel>`
   ```tsx
   // Before: Separate income/age/employment fields
   // After:
   {showJointApplicant && <CoApplicantPanel loanType="new_purchase" control={control} errors={errors} onFieldChange={onFieldChange} />}
   ```

3. **Property Type Labels** - Use clean labels (no suffixes)
   ```tsx
   // Before: "HDB Flat (Resale)"
   // After: "HDB Flat"
   ```

4. **Step 2 Progressive Disclosure** - Use `getStep2VisibleFields()`
   ```tsx
   const visibleFields = getStep2VisibleFields({ loanType, propertyCategory, propertyType })
   const showField = (name: string) => visibleFields.includes(name)
   ```

5. **Responsive Layout** - Wrap form content
   ```tsx
   <ResponsiveFormLayout sidebar={<InstantAnalysisSidebar />} showSidebar={hasCalculated}>
     {/* Form fields */}
   </ResponsiveFormLayout>
   ```

---

### Known Issues & Limitations

**Current State:**
- Tablet (768-1023px) hides sidebar (can be customized to show inline card)
- Mobile shows inline instant analysis card (implementation pending in plan)
- Slide-in drawer pattern not yet implemented (future enhancement)

**Performance:**
- CSS Grid has excellent browser support (96%+)
- Sticky positioning works in all modern browsers
- `prefers-reduced-motion` respected for accessibility

---

### Performance

**Bundle Impact:**
- Employment types library: ~2KB
- Field visibility rules: ~1KB
- EmploymentPanel component: ~4KB
- ResponsiveFormLayout: ~3KB
- **Total new code: ~10KB** (minimal impact)

**Removed Code:**
- Duplicate employment fields: ~200 lines per step component
- Duplicate co-applicant fields: ~100 lines per step component
- **Net reduction: ~400 lines** across codebase

**Runtime Performance:**
- Progressive disclosure: O(1) field visibility checks
- Responsive layout: Uses CSS Grid (hardware accelerated)
- Employment panels: Lazy rendering (only visible type's panel mounts)

---

## Related Documentation
- [Tech Stack Guide](./TECH_STACK_GUIDE.md) - Overall architecture
- [Migration Guide](../MIGRATION_GUIDE.md) - Component migration patterns
- [Session Context](../Session_Context/shadcn_implementation_complete.md) - Recent optimization session
- [AI Broker Guide](./AI_BROKER_COMPLETE_GUIDE.md) - AI insights and broker system
- [Progressive Form Redesign Plan](../plans/active/2025-10-25-progressive-form-full-system-redesign.md) - V2 implementation plan