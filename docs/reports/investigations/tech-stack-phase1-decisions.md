# Tech Stack Phase 1 Implementation Decisions

**Date:** 2025-10-17
**Source:** Root TECH_STACK_GUIDE.md (archived sections)

## Phase 1 Implementation Details

**Status:** ✅ COMPLETED

**Dependencies Added:**
- `zod` (12KB) - Form validation and schema parsing
- `clsx` (500B) - Conditional CSS class utility
- `date-fns` (tree-shakeable) - Date manipulation for mortgage calculations
- `sharp` - Image optimization for Next.js
- `@next/bundle-analyzer` (dev) - Bundle size monitoring

**New Folder Structure:**
```
├── lib/
│   ├── calculations/
│   │   └── mortgage.ts          # Extracted calculator logic with Zod validation
│   ├── seo/                     # SEO utilities (future)
│   └── utils.ts                 # Utility functions (clsx, formatters)
├── data/                        # Static data for programmatic content
├── types/
│   └── mortgage.ts              # TypeScript interfaces
```

**Bundle Configuration:**
- Bundle analyzer configured in `next.config.js`
- Image optimization with AVIF/WebP support
- Package import optimization for react-hook-form and date-fns

## Architecture Strategy

### Folder Structure Evolution
Based on GEO optimization requirements, the project adopted a hybrid structure:

```
NextNest/
├── app/
│   ├── (marketing)/              # Route group for static/SEO pages
│   │   ├── calculators/         # Static calculator pages for SEO
│   │   │   └── [location]/[type]/page.tsx
│   │   └── guides/              # Educational content
│   ├── dashboard/               # Existing interactive calculator (preserved)
│   ├── api/                     # API routes
│   └── layout.tsx              # Root layout
├── lib/                         # Business logic layer
│   ├── calculations/           # Mortgage calculation utilities
│   ├── seo/                   # SEO utilities
│   └── utils.ts
├── data/                       # Static data for programmatic content
├── types/                      # TypeScript definitions
└── components/
    ├── marketing/              # Static/SEO components
    ├── dashboard/              # Interactive components
    └── ui/                     # Base components
```

### Component Strategy
**Decision**: Preserve existing dashboard calculator, add new static components for SEO
- **Existing Dashboard**: Keep `app/dashboard/page.tsx` as interactive calculator
- **New Static Calculators**: Create progressive enhancement versions for SEO
- **Shared Logic**: Extract calculations to `lib/calculations/` for reuse

### SEO/GEO Implementation
- **Static Generation**: Pre-render calculator pages for all location/type combinations
- **Schema Markup**: Structured data for AI crawlers
- **Progressive Enhancement**: Ensure functionality without JavaScript

### Development Phases
1. **Phase 1**: ✅ **COMPLETED** - Extract business logic, add new dependencies
2. **Phase 2**: Create static calculator pages and components
3. **Phase 3**: Implement AI triage system and n8n integration

## Risk Mitigation
- **Preserve Working Features**: ✅ Existing dashboard remains untouched
- **Incremental Migration**: ✅ Shared logic extracted without breaking changes
- **Fallback Strategy**: Static pages work without JavaScript
