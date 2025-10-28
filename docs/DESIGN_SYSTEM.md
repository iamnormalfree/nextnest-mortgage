# NextNest Design System

**Version:** 2.0 — Unified Canon
**Last Updated:** 2025-10-28
**Status:** Canonical (Single Source of Truth)
**Alignment:** Re-Strategy Part 04 + Logo DNA

---

## Strategic Foundation

### Brand Positioning

**NextNest is evidence-based mortgage advisory delivered through invisible intelligence and visible outcomes.**

- **Strategic principle:** Premium services don't explain their systems. They make complex work feel effortless.
- **Visual identity:** 90% monochrome precision + 10% gold-standard yellow
- **Experience goal:** Swiss spa finesse — calm, precise, understated luxury

### Logo DNA

Our logo encodes the design system:
- **Black geometric frame:** Structure, precision, professionalism (90%)
- **Yellow diagonal accent:** Energy, clarity, the "inside edge" (10%)
- **Sharp angles:** Modern minimalism, no curves, architectural precision

**Design principle:** The logo already made the bet on yellow. We commit fully to this differentiation.

---

## Design Pillars (UX Principles)

Every design decision must serve at least two of these pillars:

1. **Calm Intelligence** — Minimal interface, generous whitespace, deliberate typography. Showcase key insights, hide noise unless requested.

2. **Visible Evidence** — Every recommendation backed by data (savings, timestamps, scenario IDs). Provide "evidence chips" in UI and PDFs.

3. **Human-First Flow** — Copy acknowledges the user ("Here's what we found"). Face-to-name elements (Brent bio, availability cues).

4. **Controlled Transparency** — Show ranges and disclaimers. Guard deviated rates/bank names until human confirmation.

5. **Guided Simplicity** — Progressive disclosure. Lead with next best action, offer depth on demand (accordions, tooltips).

6. **Invisible Automation** — Highlight where system helped ("We compared 16 banks"), but outcomes feel effortless.

---

## Core Principles (Visual Execution)

### 1. 90% Monochrome + 10% Yellow Accent

**Foundation (90% of UI):**
- ✅ Monochrome palette establishes professionalism and readability
- ✅ Generous whitespace creates breathing room
- ❌ NO purple (#7C3AED) — completely removed from design system
- ❌ NO multi-color schemes — discipline over variety

**Yellow Accent (10% of UI):**
- ✅ Use yellow ONLY for primary CTAs and success highlights
- ✅ Think "gold standard" — premium watch accents, quality seals
- ❌ NOT energetic startup yellow — precise, valuable, rare

---

### 2. Sharp Rectangles — NO Rounded Corners

**Why:** Matches logo geometry, signals precision, aligns with Swiss design principles.

- ❌ NEVER use: `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-md`
- ✅ ALWAYS use: Clean 1px borders with sharp 90-degree corners
- ✅ Exception: None (maintain discipline)

---

### 3. Font Weights: 300 / 400 / 600 ONLY

**Why:** Simplified hierarchy = easier maintenance = Swiss precision.

- ❌ FORBIDDEN: `font-medium` (500), `font-bold` (700)
- ✅ ALLOWED:
  - `font-light` (300) — Large headings, subtle emphasis
  - `font-normal` (400) — Body text, readable content
  - `font-semibold` (600) — Headlines, CTAs, key metrics

---

### 4. "Rule of Two" — Yellow Accent Usage

**Maximum 2 yellow elements per viewport:**

1. **One primary CTA** (most important action)
2. **One success highlight** (optional — savings, key metric, achievement)

**Examples:**
```
✅ GOOD:
- [Yellow CTA: Start Your Analysis]
- [Yellow highlight: SAVE $185/month]

❌ TOO MUCH:
- [Yellow CTA]
- [Yellow metric]
- [Yellow progress bar]
- [Yellow badge]
```

---

### 5. Glass Morphism — Navigation Only

**Why:** Subtle premium effect, but overuse dilutes impact.

- ✅ Allowed: `bg-white/95 backdrop-blur-md` on navigation bars
- ❌ NOT allowed: Cards, buttons, content areas, modals

---

## Color Palette

### Monochrome Foundation (90% of UI)

```typescript
// Primary Text & Structure
Black:    #000000  // Headlines, logo frame, primary emphasis
Charcoal: #374151  // Body text (warmer, more readable for long content)
Stone:    #666666  // Secondary text, labels, metadata

// Backgrounds & Dividers
White:    #FFFFFF  // Primary canvas
Cloud:    #F8F8F8  // Subtle section backgrounds
Mist:     #E5E5E5  // Dividers, borders, separators
```

**Text color strategy:**
- **Black (#000000):** Headlines, hero copy, navigation, logo
- **Charcoal (#374151):** Body text, paragraphs, form labels (easier on eyes for reading)
- **Stone (#666666):** Helper text, timestamps, metadata, captions

---

### Yellow Accent (10% of UI)

```typescript
// Brand Primary (from logo)
Yellow:       #FCD34D  // Primary CTAs, savings highlights, success states
Yellow Hover: #FBB614  // Hover state (darker for contrast)
Yellow Focus: #FCD34D  // Focus rings (same as base)
```

**Usage guidelines:**
- Primary CTAs: "Start Your Analysis", "Review Options", "Confirm Choice"
- Success states: Calculation complete, analysis ready, scenario saved
- Key metrics: Savings amount, break-even months (when celebrating outcome)
- Logo accent: Yellow diagonal (always visible)

**Anti-patterns (do NOT use yellow for):**
- ❌ Warnings (use semantic colors)
- ❌ Info badges (use blue functional)
- ❌ Secondary actions (use ghost buttons)
- ❌ Decorative elements

---

### Functional Colors (Semantic — System Feedback Only)

```typescript
// Blue — Informational (NOT brand primary)
Trust Blue:     #0F4C75  // Links in body text, info tooltips, data visualization
Info Blue:      #2563EB  // Help text, informational badges

// Semantic States
Success Green:  #059669  // Form validation success, completion states
Alert Red:      #DC2626  // Errors, warnings, destructive actions
```

**Blue's role:** Functional, not brand. Use for:
- Text links within paragraphs
- Informational tooltips ("ⓘ What is TDSR?")
- Data visualization (charts, graphs)
- Secondary actions (ghost buttons with blue text on hover)

**Blue should NEVER:**
- ❌ Replace yellow for primary CTAs
- ❌ Dominate the visual hierarchy
- ❌ Appear in logo or hero brand elements

---

## Typography

### Typeface

**Primary:** Inter (geometric sans-serif)
- Modern, highly readable, professional
- Excellent rendering at all sizes
- Wide language support

**Monospace:** JetBrains Mono or SF Mono (for financial figures)
- Use for: Rates, dollar amounts, percentages, calculations
- Improves number scanability and precision feel

### Font Weights

```typescript
font-light    (300)  // Large headings (48px+), subtle emphasis
font-normal   (400)  // Body text, readable content
font-semibold (600)  // Headlines, CTAs, key metrics, navigation
```

### Type Scale (Desktop Baseline)

```typescript
Hero:         text-5xl (48px) font-light    // Homepage hero headline
H1:           text-4xl (36px) font-semibold // Page titles
H2:           text-3xl (30px) font-semibold // Section headings
H3:           text-2xl (24px) font-semibold // Card titles, subsections
Body Large:   text-lg  (18px) font-normal   // Hero subheadlines
Body:         text-base(16px) font-normal   // Paragraph text, forms (1.6 line-height)
Small:        text-sm  (14px) font-normal   // Labels, helper text
Tiny:         text-xs  (12px) font-normal   // Timestamps, metadata
```

### Responsive Adjustments

- **Mobile:** Reduce hero to `text-4xl`, H1 to `text-3xl`
- **Tablet:** Use desktop scale
- **Line height:** 1.6 for body text, 1.2 for headlines

---

## Spacing & Layout

### Grid System

**8px base unit:** All spacing derives from multiples of 8px

```typescript
Micro:    8px   (gap-2)   // Tight inline spacing
Small:    16px  (gap-4)   // Related elements
Medium:   24px  (gap-6)   // Card padding
Large:    32px  (gap-8)   // Section spacing (mobile)
XLarge:   64px  (gap-16)  // Section spacing (desktop)
XXLarge:  96px  (gap-24)  // Major page sections
```

### Content Width Constraints

```typescript
Hero Width:     960px  (max-w-[960px])  // Homepage hero, wide layouts
Body Width:     720px  (max-w-[720px])  // Readable content, forms, articles
Narrow Width:   600px  (max-w-[600px])  // Focused single-column forms
```

### Vertical Rhythm

- Desktop sections: 64px vertical spacing (`py-16`)
- Mobile sections: 32px vertical spacing (`py-8`)
- Cards/modules: 24px internal padding (`p-6`)

---

## Component Patterns

### Buttons

#### Primary Button (Yellow)

```typescript
className="bg-[#FCD34D] hover:bg-[#FBB614] text-black font-semibold px-8 py-3 border border-black transition-colors"

// Usage: ONE per viewport (most important action)
// Examples: "Start Your Analysis", "Review Options", "Confirm"
```

#### Secondary Button (Ghost)

```typescript
className="bg-transparent hover:bg-black hover:text-white text-black font-semibold px-8 py-3 border border-black transition-colors"

// Usage: Less prominent actions
// Examples: "Learn More", "See Details", "Skip"
```

#### Text Link (Blue)

```typescript
className="text-[#0F4C75] hover:underline font-normal"

// Usage: Inline links in body text, supplementary navigation
// Examples: "Read disclosure", "See how we calculate"
```

---

### Cards

#### Standard Card

```typescript
className="bg-white border border-[#E5E5E5] p-6"

// Sharp corners, 1px border, subtle backgrounds
// No shadows, no rounding
```

#### Scenario Card (Evidence Display)

```typescript
<div className="bg-[#F8F8F8] border border-[#E5E5E5] p-6 space-y-3">
  <div className="text-sm text-[#666666]">HDB 4-room refinance</div>
  <div className="text-xl font-semibold font-mono">Save $185/month</div>
  <div className="text-sm text-[#666666]">Break-even: 14 months</div>
  <div className="text-xs text-[#666666] border-t border-[#E5E5E5] pt-3">
    Validated Oct 28, 2025
  </div>
</div>

// Key metric in yellow (optional if celebrating savings):
<div className="text-xl font-semibold font-mono text-[#FCD34D] border-b-2 border-[#FCD34D] inline-block">
  Save $185/month
</div>
```

---

### Navigation

#### Header (Glass Morphism)

```typescript
className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-50"

// Contents:
// Left: Logo (black frame + yellow diagonal)
// Center: Navigation links (charcoal text, hover: black)
// Right: ONE yellow CTA
```

---

### Forms

#### Input Field

```typescript
className="w-full px-4 py-3 bg-white border border-[#E5E5E5] text-[#374151] focus:outline-none focus:border-[#FCD34D] focus:ring-2 focus:ring-[#FCD34D]/20"

// Sharp corners, clean borders
// Yellow focus state (follows "Rule of Two" — only active input gets yellow)
```

#### Label

```typescript
className="block text-sm font-normal text-[#374151] mb-2"
```

#### Helper Text

```typescript
className="text-sm text-[#666666] mt-1"
```

#### Error State

```typescript
className="w-full px-4 py-3 bg-white border border-[#DC2626] text-[#374151]"
// Error message:
className="text-sm text-[#DC2626] mt-1"
```

---

### Data Display

#### Key Metric (Yellow Highlight)

```typescript
// Use sparingly (one per section max)
<div className="font-mono text-2xl font-semibold text-[#FCD34D] border-b-2 border-[#FCD34D] inline-block pb-1">
  $185/month
</div>
```

#### Comparison Table

```typescript
<table className="w-full border-collapse">
  <thead>
    <tr className="border-b border-[#E5E5E5]">
      <th className="text-left py-3 font-semibold text-sm">Option</th>
      <th className="text-right py-3 font-semibold text-sm">Monthly</th>
      <th className="text-right py-3 font-semibold text-sm">Total (36mo)</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[#E5E5E5]">
      <td className="py-3 text-[#374151]">Stay</td>
      <td className="py-3 text-right font-mono">$2,340</td>
      <td className="py-3 text-right font-mono">$84,240</td>
    </tr>
    <tr className="border-b border-[#E5E5E5]">
      <td className="py-3 text-[#374151]">Refinance</td>
      <td className="py-3 text-right font-mono">$2,155</td>
      <td className="py-3 text-right font-mono">$77,580</td>
    </tr>
  </tbody>
</table>

// Optional: Highlight savings row with yellow underline
```

---

## Motion & Interaction

### Transitions

**Standard:** 200ms ease-out (color, background, border changes)

```typescript
transition-colors duration-200

// Use for: Button hovers, link hovers, focus states
```

**Quick:** 150ms ease-out (micro-interactions)

```typescript
transition-all duration-150

// Use for: Dropdown menus, tooltips, small reveals
```

### Accessibility

- Respect `prefers-reduced-motion` settings
- No parallax effects
- No auto-playing animations
- Transitions only for state changes (never decorative)

---

## Iconography

### Style

- Outline icons, 1.5px stroke
- Inherit text color
- Size: 20px (standard), 24px (large), 16px (small)

### Usage

- Use sparingly (text-first design)
- Icons support text, never replace it
- Pair with labels for clarity

**Examples:**
```typescript
// Good: Icon + label
<button>
  <Icon name="check" className="w-5 h-5 mr-2" />
  Confirm
</button>

// Avoid: Icon only (unless universally recognized like ×, ☰)
```

---

## Responsive Design

### Breakpoints

```typescript
sm:  640px   // Small tablets, large phones
md:  768px   // Tablets portrait
lg:  1024px  // Tablets landscape, small laptops
xl:  1280px  // Desktops
2xl: 1536px  // Large desktops
```

### Mobile-First Approach

Base styles = mobile (320px+)
Add complexity at breakpoints:

```typescript
// Mobile (default)
<div className="grid grid-cols-1 gap-4">

// Tablet and up
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Mobile Adaptations

- Stack layouts vertically
- Reduce hero text size (`text-4xl` → `text-3xl`)
- Increase touch targets (minimum 44px × 44px)
- Reduce section spacing (64px → 32px)
- Full-width CTAs on mobile

---

## Quality Control Checklist

Before committing ANY UI component:

### Visual Compliance
- [ ] Uses colors from this doc ONLY (no arbitrary hex codes)
- [ ] NO rounded corners (sharp rectangles only)
- [ ] Font weights are 300, 400, or 600 ONLY
- [ ] Yellow accent on max TWO elements per viewport
- [ ] Borders are 1px (2px for key metric underlines only)
- [ ] Glass morphism ONLY on navigation

### Brand Alignment
- [ ] Aligns with logo DNA (90% monochrome, 10% yellow)
- [ ] Serves at least TWO design pillars
- [ ] Supports re-strategy (evidence-based, professional, Swiss spa finesse)
- [ ] Blue used functionally, NOT as primary brand color

### Typography
- [ ] Headlines use font-semibold (600)
- [ ] Body text uses font-normal (400)
- [ ] Large headings may use font-light (300)
- [ ] Numbers use monospace font
- [ ] Line height 1.6 for body text

### Accessibility
- [ ] Color contrast >= 4.5:1 for body text
- [ ] Color contrast >= 3:1 for large text (18px+)
- [ ] Keyboard navigable
- [ ] Focus states visible (yellow ring)
- [ ] Alt text for meaningful images
- [ ] Descriptive link text (not "click here")

### Responsive
- [ ] Mobile-first approach
- [ ] Touch targets >= 44px × 44px
- [ ] Text remains readable on all screen sizes
- [ ] No horizontal scroll
- [ ] Maintains design principles across breakpoints

---

## Implementation Reference

### Design Tokens Location

**Primary:** `/lib/design/tokens.ts`

```typescript
export const COLORS = {
  // Monochrome (90%)
  black: '#000000',
  charcoal: '#374151',
  stone: '#666666',
  mist: '#E5E5E5',
  cloud: '#F8F8F8',
  white: '#FFFFFF',

  // Yellow Accent (10%)
  yellow: '#FCD34D',
  yellowHover: '#FBB614',

  // Functional (Blue)
  trustBlue: '#0F4C75',
  infoBlue: '#2563EB',

  // Semantic
  success: '#059669',
  error: '#DC2626',
}

export const COMPONENT_PATTERNS = {
  primaryButton: {
    className: 'bg-[#FCD34D] hover:bg-[#FBB614] text-black font-semibold px-8 py-3 border border-black transition-colors'
  },
  secondaryButton: {
    className: 'bg-transparent hover:bg-black hover:text-white text-black font-semibold px-8 py-3 border border-black transition-colors'
  },
  card: {
    className: 'bg-white border border-[#E5E5E5] p-6'
  },
  // ... more patterns
}
```

### Tailwind Config

Ensure `tailwind.config.ts` uses these exact values:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Monochrome
        black: '#000000',
        charcoal: '#374151',
        stone: '#666666',
        mist: '#E5E5E5',
        cloud: '#F8F8F8',

        // Yellow (brand)
        yellow: {
          DEFAULT: '#FCD34D',
          hover: '#FBB614',
        },

        // Blue (functional)
        trust: '#0F4C75',
        info: '#2563EB',

        // Semantic
        success: '#059669',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        semibold: '600',
      },
    },
  },
}
```

---

## Reference Files

- **Production Homepage:** `/app/page.tsx` (current implementation)
- **Design Tokens:** `/lib/design/tokens.ts`
- **Voice & Tone:** `/docs/content/voice-and-tone.md`
- **Brand Canon:** `/docs/plans/re-strategy/Part04-brand-ux-canon.md`
- **Accessibility:** `/docs/runbooks/design/accessibility-checklist.md`

---

## Governance

**Document Owner:** Design/Brand (Brent approval required)

**Update Triggers:**
- New surface added (mobile app, partner portal)
- Brand testing reveals optimization
- Accessibility requirements change
- Re-strategy evolution

**Review Cadence:** Before each major surface launch

**Sync Requirement:**
- Update `docs/work-log.md` when design decisions land
- Maintain alignment with CAN-001, CAN-016, CAN-020

---

## Design Philosophy Summary

### Visual Identity
**90% monochrome precision + 10% gold-standard yellow**

### UX Principles
**Calm Intelligence • Visible Evidence • Human-First Flow**

### Execution Style
**Sharp rectangles • Generous whitespace • Deliberate typography**

### Brand Outcome
**Swiss spa finesse — precision craftsmanship, understated luxury**

---

**The design system serves the brand promise:**
"We track 16 banks in real-time. You get only what fits your situation."

**Visual translation:**
90% of the UI works invisibly (monochrome structure). 10% celebrates visible outcomes (yellow highlights the math that matters).

---

**Version History:**
- v1.0 (2025-10) — "Sophisticated Flow" implementation
- v2.0 (2025-10-28) — Unified canon resolving Part04 contradictions, logo DNA alignment, re-strategy compliance

**Status:** ✅ CANONICAL — Single source of truth for all design decisions
