# Forms Architecture Guide

**Last Updated:** 2025-10-18

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

## Related Documentation
- [Tech Stack Guide](./TECH_STACK_GUIDE.md) - Overall architecture
- [Migration Guide](../MIGRATION_GUIDE.md) - Component migration patterns
- [Session Context](../Session_Context/shadcn_implementation_complete.md) - Recent optimization session