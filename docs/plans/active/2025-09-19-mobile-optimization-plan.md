---
title: mobile-optimization-plan
status: in-progress
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# Mobile Optimization Implementation Plan - Bloomberg Terminal Design
# Version 2.0 - Junior Developer Ready

## 🎯 Current State Analysis

### What's Working Correctly:
✅ Color palette follows design guide (monochrome + gold)
✅ Typography scale correct (Major Third ratio)
✅ 8px grid spacing system in place
✅ Desktop view follows Bloomberg Terminal aesthetic

### Critical Mobile Issues (MUST FIX):
1. **Mobile menu broken** - Button visible but not functional
2. **Text too large on phones** - 49px hero text doesn't fit
3. **Metric card overflow** - Card extends beyond viewport on 320px screens
4. **No touch-friendly spacing** - Elements too close together

### Design Guide Violations Found:
❌ **Animation duration exceeds limit** - Line 84 uses 2500ms (max is 2000ms)
❌ **Mobile breakpoints missing** - Not responsive below 768px
✅ **Multiple counters in hero are OK** - Design guide updated to allow this
✅ **Staggered animations create better UX** - Progressive timing enhances perception

## ⚠️ IMPORTANT RULES - READ FIRST!

### DO NOT MODIFY:
1. **tailwind.config.ts spacing** - Already uses correct 8px grid
2. **Color system** - Already correct
3. **Desktop styles** - Must remain unchanged

### ONLY USE THESE TAILWIND CLASSES:
```
// Text sizes (mobile → desktop)
text-2xl md:text-4xl   // For hero headlines
text-xl md:text-2xl    // For section headers
text-base md:text-lg   // For subheadings
text-sm                // For body text (no change)
text-xs                // For labels (no change)

// Padding (mobile → desktop)
py-8 md:py-16         // Section vertical padding
px-4 md:px-8          // Container horizontal padding
p-4 md:p-6            // Card padding

// NEVER use sm: or lg: breakpoints - only md:
```

## 📋 Implementation Tasks - Step by Step

### Task 1: Fix Animation Staggering (3 mins)
**File: components/HeroSection.tsx**

**Create a progressive stagger effect that reaches 2000ms max:**

**Line 60 - FIND:**
```typescript
<AnimatedCounter end={2.6} suffix="%" duration={1000} />
```
**REPLACE WITH:**
```typescript
<AnimatedCounter end={2.6} suffix="%" duration={500} />
```

**Line 68 - FIND:**
```typescript
<AnimatedCounter end={1.4} suffix="%" duration={1500} />
```
**REPLACE WITH:**
```typescript
<AnimatedCounter end={1.4} suffix="%" duration={1000} />
```

**Line 76 - FIND:**
```typescript
<AnimatedCounter end={480} prefix="$" duration={2000} />
```
**REPLACE WITH:**
```typescript
<AnimatedCounter end={480} prefix="$" duration={1500} />
```

**Line 84 - FIND:**
```typescript
<AnimatedCounter end={34560} duration={2500} />
```
**REPLACE WITH:**
```typescript
<AnimatedCounter end={34560} duration={2000} />
```

**Result:** Creates a cascading animation effect (500ms → 1000ms → 1500ms → 2000ms) that feels progressive and stays within limits.

### Task 2: Fix Hero Text for Mobile (5 mins)
**File: components/HeroSection.tsx**

**Line 13 - FIND:**
```typescript
<h1 className="text-4xl md:text-5xl font-light text-ink leading-tight mb-6">
```

**REPLACE WITH:**
```typescript
<h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-ink leading-tight mb-6">
```

**Line 18 - FIND:**
```typescript
<p className="text-lg text-charcoal mb-6 max-w-xl">
```

**REPLACE WITH:**
```typescript
<p className="text-base md:text-lg text-charcoal mb-6 max-w-xl">
```

### Task 3: Fix Mobile Navigation (10 mins)
**File: components/ConditionalNav.tsx**

**ADD these imports at line 2 (after 'use client'):**
```typescript
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
```

**ADD state at line 8 (after const pathname):**
```typescript
const [open, setOpen] = useState(false)
```

**REPLACE lines 40-45 (mobile menu button) with:**
```typescript
{/* Mobile menu using Shadcn Sheet */}
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild className="md:hidden">
    <button className="h-10 w-10 flex items-center justify-center text-charcoal hover:bg-mist transition-colors duration-200">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[280px] bg-white">
    <nav className="flex flex-col gap-4 mt-8">
      <a href="#hero" onClick={() => setOpen(false)}
         className="text-base font-medium text-charcoal hover:text-gold py-2">
        Home
      </a>
      <a href="#services" onClick={() => setOpen(false)}
         className="text-base font-medium text-charcoal hover:text-gold py-2">
        Services
      </a>
      <a href="/apply?loanType=new_purchase" onClick={() => setOpen(false)}
         className="text-base font-medium text-charcoal hover:text-gold py-2">
        Apply
      </a>
      <a href="/apply?loanType=new_purchase"
         className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark flex items-center justify-center mt-4">
        Get Started →
      </a>
    </nav>
  </SheetContent>
</Sheet>
```

### Task 4: Fix Metric Card Overflow (10 mins)
**File: components/HeroSection.tsx**

**Line 43 - FIND:**
```typescript
<div className="lg:pl-10">
```

**REPLACE WITH:**
```typescript
<div className="lg:pl-10 mt-8 md:mt-0">
```

**Line 44 - FIND:**
```typescript
<div className="relative w-full max-w-md mx-auto">
```

**REPLACE WITH:**
```typescript
<div className="relative w-full max-w-sm md:max-w-md mx-auto">
```

**Lines 59, 67, 75 - FIND each:**
```typescript
<div className="font-mono text-2xl font-medium text-ink">
```

**REPLACE WITH:**
```typescript
<div className="font-mono text-xl md:text-2xl font-medium text-ink">
```

**Line 83 - FIND:**
```typescript
<div className="font-mono text-3xl font-medium text-gradient-gold">
```

**REPLACE WITH:**
```typescript
<div className="font-mono text-2xl md:text-3xl font-medium text-gradient-gold">
```

### Task 5: Fix Section Padding (5 mins)
**Find all files with these patterns and update:**

**FIND:**
```typescript
<section className="py-16 md:py-32"
```

**REPLACE WITH:**
```typescript
<section className="py-8 md:py-16 lg:py-20"
```

**Files to check:**
- components/HeroSection.tsx (line 8)
- components/ServicesSection.tsx
- components/StatsSection.tsx
- components/LoanTypeSection.tsx
- components/CTASection.tsx
- components/Footer.tsx

### Task 6: Make Buttons Touch-Friendly (5 mins)
**File: components/HeroSection.tsx**

**Lines 22-35 - Keep buttons at h-12 (48px) but make them full width on mobile:**

**FIND:**
```typescript
<div className="flex flex-col sm:flex-row gap-2 mb-6">
```

**REPLACE WITH:**
```typescript
<div className="flex flex-col sm:flex-row gap-3 mb-6">
```

**This increases the gap between buttons on mobile for easier tapping.**

### Task 7: Verify Shadcn Sheet Component (2 mins)
**Check if Sheet component exists:**

```bash
# Run this command
ls components/ui/sheet.tsx
```

**If file doesn't exist, install it:**
```bash
npx shadcn-ui@latest add sheet
```

**The Sheet component is better than custom overlay because:**
- Handles accessibility automatically
- Smooth animations built-in
- Follows design system
- No custom state management needed

### Task 8: Fix Lead Form Responsiveness (10 mins)
**Files to update:**
- components/forms/IntelligentMortgageForm.tsx
- components/forms/ProgressiveForm.tsx
- components/forms/SimpleLoanTypeSelector.tsx

**FIND ALL instances of:**
```typescript
className="grid grid-cols-2
```

**REPLACE WITH:**
```typescript
className="grid grid-cols-1 md:grid-cols-2
```

**Specific lines to fix:**

1. **IntelligentMortgageForm.tsx line ~85:**
   ```typescript
   // FIND:
   <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-white">
   // REPLACE:
   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 p-3 bg-white">
   ```

2. **ProgressiveForm.tsx - Multiple locations:**
   - Line ~240: `<div className="grid grid-cols-2 gap-3">`
   - Line ~290: `<div className="grid grid-cols-2 gap-4 text-sm">`

   Change all to include `grid-cols-1 md:` prefix

3. **SimpleLoanTypeSelector.tsx line ~45:**
   ```typescript
   // This one is already correct!
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
   ```

**Why this matters:**
- Form fields need full width on mobile for thumb typing
- Two-column layout on 320px screens makes inputs too narrow
- Stacked fields follow mobile UX best practices
- Desktop layout remains unchanged (2 columns above 768px)

## ✅ Testing Checklist for Junior Developer

### Before Starting:
- [ ] Create a git branch: `git checkout -b mobile-optimization`
- [ ] Start dev server: `npm run dev`
- [ ] Open Chrome DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)

### Test Each Change:
1. **After Task 1 (Animations):**
   - [ ] Only ONE counter animates (lifetime savings)
   - [ ] Animation is 2 seconds max

2. **After Task 1 (Animation Staggering):**
   - [ ] Animations cascade: 500ms → 1000ms → 1500ms → 2000ms
   - [ ] All animations complete within 2 seconds

3. **After Task 2 (Hero Text):**
   - [ ] Text fits on iPhone SE (375px width)
   - [ ] No horizontal scroll

4. **After Task 3 (Navigation):**
   - [ ] Mobile menu opens/closes
   - [ ] Links work and close menu

5. **After Task 4 (Metric Card):**
   - [ ] Card fits on 320px screen
   - [ ] Numbers are readable

6. **After Task 5 (Padding):**
   - [ ] Sections have proper spacing
   - [ ] Content isn't cramped

7. **After Task 6 (Buttons):**
   - [ ] Buttons are full width on mobile
   - [ ] Easy to tap with thumb

8. **After Task 8 (Forms):**
   - [ ] Form fields stack in single column on mobile
   - [ ] Each input is full width
   - [ ] Easy to type with thumbs
   - [ ] No horizontal scrolling in forms

### Final Verification:
- [ ] Test on real phone if possible
- [ ] Run `npm run lint`
- [ ] Check desktop view is unchanged
- [ ] Test the lead capture form on mobile

## 🚫 Common Mistakes - DO NOT DO THESE!

1. **DON'T change tailwind.config.ts** - Spacing is already correct
2. **DON'T use sm: or lg: breakpoints** - Only use md:
3. **DON'T make buttons 56px tall** - Keep them 48px (h-12)
4. **DON'T add custom CSS** - Use only Tailwind classes
5. **DON'T modify desktop styles** - Only add mobile overrides
6. **DON'T use `hidden` class** - Content should be visible
7. **DON'T create new components** - Modify existing ones
8. **DON'T change the color scheme** - It's already correct

## 🛠 Required Tools Check

```bash
# Check if Shadcn UI is installed
ls components/ui/

# Should see: button.tsx, card.tsx, input.tsx, etc.
# If missing Sheet component, install it:
npx shadcn-ui@latest add sheet

# Test your changes
npm run dev
# Open http://localhost:3000

# Lint your code
npm run lint
```

## 📱 Browser Testing Sizes

**Test these specific widths:**
- 320px - Minimum mobile (iPhone SE)
- 375px - Standard mobile (iPhone 12)
- 768px - Tablet (iPad)
- 1024px - Desktop starts here

**Chrome DevTools shortcuts:**
- F12 - Open DevTools
- Ctrl+Shift+M - Toggle device mode
- Ctrl+Shift+R - Hard refresh

## 📊 Success Criteria

**Your implementation is correct if:**
1. ✅ Mobile menu opens and closes properly
2. ✅ No horizontal scroll on 320px screens
3. ✅ Text is readable without zooming
4. ✅ All animations are 2000ms or less
5. ✅ Desktop view is exactly the same as before
6. ✅ All animations are 200ms except the one counter (2000ms)
7. ✅ Buttons remain 48px height (h-12)
8. ✅ Following 8px grid spacing
9. ✅ Form fields stack properly on mobile
10. ✅ Lead capture form is usable on 320px screens

## ⏱ Time Estimate

- Task 1: Fix Animation Staggering - 3 mins
- Task 2: Fix Hero Text - 5 mins
- Task 3: Fix Navigation - 10 mins
- Task 4: Fix Metric Card - 10 mins
- Task 5: Fix Padding - 5 mins
- Task 6: Fix Buttons - 5 mins
- Task 7: Verify Sheet - 2 mins
- Task 8: Fix Forms - 10 mins
- Testing - 15 mins

**Total: ~55 mins**

## 💡 If You Get Stuck

1. Check the line numbers mentioned in each task
2. Use exact find/replace strings provided
3. Don't overthink - changes are minimal
4. Test after each task, not all at once
5. Desktop view should NOT change

## 📝 Final Reminders

- This plan follows the Bloomberg Terminal design principles
- We're using Shadcn UI components (already installed)
- The 8px grid is already configured in Tailwind
- Colors are already correct (monochrome + gold)
- We're fixing mobile WITHOUT breaking desktop
- Forms are critical - they capture leads and need to work on all devices

## 📦 What This Plan Delivers

**Mobile Experience (320-767px):**
- ✅ Readable text without zooming
- ✅ Working navigation menu
- ✅ Properly sized metric cards
- ✅ Full-width buttons and form fields
- ✅ Single column layouts for easy scrolling
- ✅ Progressive animation stagger (500ms → 2000ms)

**Desktop Experience (768px+):**
- ✅ 100% unchanged from current design
- ✅ Bloomberg Terminal aesthetic preserved
- ✅ Two-column forms maintained
- ✅ Original spacing and typography

**Code Quality:**
- ✅ Zero custom CSS
- ✅ No new dependencies
- ✅ Only defensive mobile overrides
- ✅ Follows existing patterns
- ✅ Clean, maintainable changes