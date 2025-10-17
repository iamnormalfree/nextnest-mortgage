# NextNest Design System - Single Source of Truth

**Last Updated:** 2025-10-13
**Status:** ✅ Active
**Reference Implementation:** `/app/redesign/sophisticated-flow/page.tsx`

---

## 🎯 Purpose

This document establishes the **sophisticated flow** as the canonical design system for all NextNest UI development going forward.

## 📍 Source of Truth Location

### Primary Reference
- **File:** `/app/redesign/sophisticated-flow/page.tsx`
- **Route:** `/redesign/sophisticated-flow` (or `/` when feature flag enabled)
- **Design Tokens:** `/lib/design/tokens.ts`

### Feature Flag Control
```typescript
// .env.local
NEXT_PUBLIC_USE_SOPHISTICATED_FLOW=true  // Enable on homepage

// lib/features/feature-flags.ts
USE_SOPHISTICATED_FLOW: process.env.NODE_ENV === 'development' ||
                        process.env.NEXT_PUBLIC_USE_SOPHISTICATED_FLOW === 'true'
```

---

## 🎨 Core Design System

### Color Palette
```typescript
// 90% Monochrome
Black:   #000000  // Primary text, headlines
Stone:   #666666  // Body text, secondary
Mist:    #E5E5E5  // Dividers, borders
Cloud:   #F8F8F8  // Subtle backgrounds
White:   #FFFFFF  // Primary background

// 10% Yellow Accent (CTAs and key metrics ONLY)
Yellow:       #FCD34D  // Primary accent
Yellow Hover: #FBB614  // Hover state

// Semantic (System feedback only)
Success: #10B981
Error:   #EF4444
Warning: #F59E0B
```

### Visual Style Rules

#### 1. **NO Rounded Corners** ❌
- All elements use sharp rectangles
- NO: `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-md`
- YES: Clean 1px borders with 90-degree corners

#### 2. **Yellow Accent - "Rule of One"** 🟨
Per viewport, yellow should appear on:
- **ONE primary CTA button** (e.g., "Get Started")
- **ONE key metric underline** (2px border-bottom)
- **ONE active state** (e.g., selected tab)

NEVER use yellow on:
- Body text
- Multiple buttons
- Icons
- Decorative elements

#### 3. **Typography Weights** 📝
ONLY three weights allowed:
- `font-light` (300) - Headlines
- `font-normal` (400) - Body text
- `font-semibold` (600) - Emphasis

FORBIDDEN: 500, 700, 800, 900

#### 4. **Glass Morphism** 🪟
Allowed ONLY on:
- Navigation bars: `bg-white/95 backdrop-blur-md`
- Modal overlays

NOT allowed on:
- Content cards
- Buttons
- Body sections

---

## 📦 Component Patterns

Import from `/lib/design/tokens.ts`:

```typescript
import { COLORS, COMPONENT_PATTERNS, SPACING } from '@/lib/design/tokens'

// Primary CTA Button
<button className={COMPONENT_PATTERNS.primaryButton.className}>
  Get Started
</button>

// Card
<div className={COMPONENT_PATTERNS.card.className}>
  {/* content */}
</div>

// Key Metric with Yellow Underline (use sparingly!)
<div className={COMPONENT_PATTERNS.metricAccent.className}>
  1.4%
</div>
```

---

## 🚀 Migration Strategy

### Phase 1: Gradual Rollout (Current)
- Feature flag controls sophisticated flow on homepage
- Old design remains on other pages
- Test and iterate with subset of users

### Phase 2: Component Migration
For each existing page:
1. Create feature flag for that page
2. Migrate colors, remove rounded corners
3. Update typography weights
4. Apply "Rule of One" for yellow
5. Test thoroughly
6. Flip feature flag

### Phase 3: Complete Cutover
- Remove all feature flags
- Delete old design files
- Sophisticated flow becomes default everywhere

---

## ✅ Quality Checklist

Before merging ANY UI component:

- [ ] Uses colors from `COLORS` constant only
- [ ] NO rounded corners (sharp rectangles only)
- [ ] Font weights are 300, 400, or 600 ONLY
- [ ] Yellow accent on max ONE element per viewport
- [ ] Borders are 1px (2px for metric underlines only)
- [ ] Shadows are subtle (shadow-sm or shadow-md)
- [ ] Transitions 200-600ms with ease-out
- [ ] Glass morphism ONLY on navigation
- [ ] Monospace font for numbers
- [ ] Follows COMPONENT_PATTERNS where applicable

---

## 🔄 Update Process

### When Design System Changes:
1. **Update Reference:** Modify `/app/redesign/sophisticated-flow/page.tsx`
2. **Update Tokens:** Sync `/lib/design/tokens.ts`
3. **Update Docs:** Document change in this file
4. **Communicate:** Notify team in Slack/email
5. **Cascade:** Update existing components gradually

### Version Control:
- Design changes = minor version bump
- Breaking changes = major version bump
- Document in CHANGELOG.md

---

## 🚫 Anti-Patterns

### Common Mistakes to Avoid:

❌ **Using Purple Accent**
```typescript
// WRONG
className="bg-[#7C3AED]"

// CORRECT
className="bg-[#FCD34D]"
```

❌ **Rounded Corners**
```typescript
// WRONG
className="rounded-lg"

// CORRECT - sharp corners
className="border border-[#E5E5E5]"
```

❌ **Multiple Yellow CTAs**
```typescript
// WRONG - two yellow buttons
<button className="bg-[#FCD34D]">Action 1</button>
<button className="bg-[#FCD34D]">Action 2</button>

// CORRECT - one yellow, one ghost
<button className="bg-[#FCD34D]">Primary Action</button>
<button className="border border-[#E5E5E5]">Secondary</button>
```

❌ **Wrong Font Weights**
```typescript
// WRONG
className="font-medium" // 500 - not allowed!

// CORRECT
className="font-semibold" // 600
```

---

## 📚 Related Documentation

- **Design Principles:** `/docs/design/DESIGN_PRINCIPLES.md`
- **Color Usage Guide:** `/docs/design/precise-color-usage-guide.md`
- **Component Guide:** `/docs/design/balanced-premium-components-guide.md`
- **Implementation:** `/app/redesign/sophisticated-flow/page.tsx`
- **Design Tokens:** `/lib/design/tokens.ts`

---

## 🏆 Success Metrics

The design system succeeds when:
- [ ] All new components use sophisticated flow patterns
- [ ] No purple (#7C3AED) in codebase
- [ ] No rounded corners in UI (except legacy pages)
- [ ] Consistent yellow accent usage (Rule of One)
- [ ] 100% compliance with quality checklist

---

## 📞 Support

Questions about design system?
1. Check `/lib/design/tokens.ts` for patterns
2. Reference `/app/redesign/sophisticated-flow/page.tsx`
3. Review this document
4. Ask in #design-system Slack channel

**Maintainer:** Development Team
**Design Owner:** Brent
