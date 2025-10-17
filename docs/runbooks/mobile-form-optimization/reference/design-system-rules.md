# Design System Rules - Path2 Mobile-First Form

**Source:** Path2 Plan Lines 66-79
**Reference:** `/app/redesign/sophisticated-flow/page.tsx` (single source of truth)

---

## Color Palette

**Core Principle:** 90% monochrome + 10% yellow accent

### Allowed Colors
- **Monochrome:**
  - `#000000` - Black (text, icons)
  - `#333333` - Dark gray (secondary text)
  - `#666666` - Medium gray (helper text, placeholders)
  - `#999999` - Light gray (borders, dividers)
  - `#E5E5E5` - Very light gray (backgrounds, borders)
  - `#FFFFFF` - White (backgrounds, cards)

- **Accent:**
  - `#FCD34D` - Yellow (primary CTA, focus states)
  - `#FBB614` - Dark yellow (hover states)

- **Semantic:**
  - `#EF4444` - Red (errors only)

### Forbidden Colors
- ❌ Purple (all shades)
- ❌ Blue (all shades)
- ❌ Green (except for success states)
- ❌ Any color not listed above

---

## Typography

### Font Weights

**Allowed:**
- `font-light` (300) - Large headings only
- `font-normal` (400) - Body text, labels
- `font-semibold` (600) - Buttons, emphasis

**Forbidden:**
- ❌ `font-medium` (500)
- ❌ `font-bold` (700)
- ❌ `font-extrabold` (800+)

### Font Sizes
- `text-xs` (12px) - Helper text, captions
- `text-sm` (14px) - Labels, secondary text
- `text-base` (16px) - Body text, inputs
- `text-lg` (18px) - Subheadings
- `text-xl` (20px) - Section headings
- `text-2xl` (24px) - Large inputs (mobile)

---

## Borders & Corners

### Border Radius
**MANDATORY:** Sharp rectangles only

```tsx
// ✅ CORRECT
<button className="bg-[#FCD34D]">Continue</button>
<input className="border-2 border-[#E5E5E5]" />

// ❌ WRONG - NO rounded corners
<button className="rounded-lg bg-[#FCD34D]">Continue</button>
<input className="rounded border-2" />
```

**Exception:** None. Zero tolerance for rounded corners.

### Border Width
- `border` (1px) - Default borders
- `border-2` (2px) - Input fields, emphasis
- `border-t` / `border-b` - Dividers, sticky headers/footers

---

## Component Patterns

### "Rule of One" - CTAs
**Critical Rule:** ONE yellow CTA button per viewport maximum

```tsx
// ✅ CORRECT - Only one yellow button visible
<footer className="sticky bottom-0">
  <button className="w-full bg-[#FCD34D]">Continue</button>
</footer>

// ❌ WRONG - Multiple yellow buttons
<div>
  <button className="bg-[#FCD34D]">Save</button>
  <button className="bg-[#FCD34D]">Continue</button>
</div>
```

**Why:** Yellow draws the eye. Multiple CTAs = decision paralysis.

### Touch Targets (Mobile)
**WCAG 2.1 Level AAA:** 48px minimum

```tsx
// ✅ CORRECT
<button className="h-12 px-4">Continue</button> {/* 48px */}
<input className="h-14 px-4" /> {/* 56px */}

// ❌ WRONG
<button className="h-8">Continue</button> {/* 32px - too small */}
```

---

## Forbidden Libraries

### framer-motion
**Status:** ❌ BANNED (40KB bundle cost)

**Use instead:** Native browser APIs
```tsx
// ✅ CORRECT - Native touch events
onTouchStart={handleTouchStart}
onTouchMove={handleTouchMove}
onTouchEnd={handleTouchEnd}

// ❌ WRONG - framer-motion
<motion.div drag />
```

---

## Compliance Checklist

Before committing any UI component:

- [ ] No rounded corners (`rounded-*` classes)
- [ ] Only approved font weights (300, 400, 600)
- [ ] Colors from approved palette only
- [ ] One yellow CTA per viewport max
- [ ] Touch targets ≥48px on mobile
- [ ] No framer-motion imports

**See:** `/app/redesign/sophisticated-flow/page.tsx` for canonical examples
