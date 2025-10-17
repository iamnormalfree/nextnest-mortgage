# NextNest Design System

**Design System - Sophisticated Flow (Single Source of Truth)**

## Reference Files

- **Reference Implementation:** `/app/redesign/sophisticated-flow/page.tsx`
- **Design Tokens:** `/lib/design/tokens.ts`
- **Documentation:** `/docs/design/SINGLE_SOURCE_OF_TRUTH.md`

## Core Principles

### 1. 90% Monochrome + 10% Yellow Accent (#FCD34D)
- ❌ NO purple (#7C3AED) - completely removed from design system
- ✅ Use yellow ONLY for primary CTAs and key metric accents

### 2. Sharp Rectangles - NO Rounded Corners
- ❌ NEVER use: `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-md`
- ✅ ALWAYS use: Clean 1px borders with sharp 90-degree corners

### 3. Font Weights: 300/400/600 ONLY
- ❌ FORBIDDEN: `font-medium` (500), `font-bold` (700)
- ✅ ALLOWED: `font-light` (300), `font-normal` (400), `font-semibold` (600)

### 4. "Rule of One" - Yellow Accent Usage
- ONE yellow CTA button per viewport
- ONE key metric underline (optional, 2px border-bottom)
- ONE active state indicator

### 5. Glass Morphism - Navigation Only
- ✅ Allowed: `bg-white/95 backdrop-blur-md` on navigation bars
- ❌ NOT allowed: Cards, buttons, content areas

## Color Palette

```typescript
// Monochrome (90% of UI)
Black:   #000000  // Primary text, headlines
Stone:   #666666  // Body text, secondary
Mist:    #E5E5E5  // Dividers, borders
Cloud:   #F8F8F8  // Subtle backgrounds
White:   #FFFFFF  // Primary background

// Yellow Accent (10% of UI - CTAs only)
Yellow:       #FCD34D  // Primary accent
Yellow Hover: #FBB614  // Hover state

// Semantic (System feedback only)
Success: #10B981
Error:   #EF4444
```

## Quick Reference

### Import Design Tokens
```typescript
import { COLORS, COMPONENT_PATTERNS } from '@/lib/design/tokens'
```

### Primary CTA (Yellow)
```typescript
<button className={COMPONENT_PATTERNS.primaryButton.className}>
  Get Started
</button>
```

### Secondary Button (Ghost)
```typescript
<button className={COMPONENT_PATTERNS.secondaryButton.className}>
  Learn More
</button>
```

### Card with Sharp Corners
```typescript
<div className={COMPONENT_PATTERNS.card.className}>
  {/* content */}
</div>
```

## Quality Checklist

Before committing ANY UI component:
- [ ] Uses colors from `/lib/design/tokens.ts` ONLY
- [ ] NO rounded corners (sharp rectangles only)
- [ ] Font weights are 300, 400, or 600 ONLY
- [ ] Yellow accent on max ONE element per viewport
- [ ] Borders are 1px (2px for metric underlines only)
- [ ] Glass morphism ONLY on navigation
- [ ] Monospace font for numbers

## Typography

- **Headlines**: Font weight 600 (semibold), black color
- **Body text**: Font weight 400 (normal), stone color
- **Light text**: Font weight 300 (light) for subtle emphasis
- **Numbers**: Monospace font family for financial figures

## Spacing

- Use Tailwind's standard spacing scale
- Consistent padding/margin patterns throughout
- Generous whitespace for breathing room

## Component Patterns

### Navigation
- Glass morphism effect: `bg-white/95 backdrop-blur-md`
- Fixed positioning
- Sharp edges, no rounded corners

### Cards
- Sharp corners with 1px border
- Subtle backgrounds (Cloud: #F8F8F8)
- Clear visual hierarchy

### Buttons
- **Primary**: Yellow background, sharp corners, font weight 600
- **Secondary**: Ghost style with border, yellow text on hover
- **Disabled**: Reduced opacity, no yellow

### Forms
- Clean inputs with sharp corners
- Clear labels and validation states
- Yellow focus rings on active inputs (following "Rule of One")

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Maintain design principles across all screen sizes
- Stack elements vertically on mobile when appropriate
