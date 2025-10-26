# Manual QA Checklist - Progressive Form Redesign

**Date:** 2025-10-26
**Feature:** Minimal Header + Centered Headlines + Unified Container
**Test Environment:** localhost:3000

---

## Pre-Testing Setup

- [ ] Run `npm run dev`
- [ ] Clear browser cache
- [ ] Open DevTools (F12)
- [ ] Prepare to test on Desktop (1440px) and Mobile (375px)

---

## Desktop Testing (1440px viewport)

### Minimal Header
- [ ] Navigate to http://localhost:3000/apply?loanType=new_purchase
- [ ] **VERIFY:** Only NextNest logo visible in header
- [ ] **VERIFY:** NO navigation links (Home, Services, Apply, Get Started)
- [ ] **VERIFY:** Header height is h-14 (56px) on desktop
- [ ] **VERIFY:** Logo is visible and clickable (links to homepage)

### Spacing & Layout
- [ ] **VERIFY:** Small gap between nav and form content (~5rem / 80px)
- [ ] **VERIFY:** Form content starts close to nav bar (not excessive whitespace)
- [ ] **VERIFY:** Background color is #F8F8F8 (off-white/light gray)

### Step 1: Contact Information
- [ ] Fill in "Full Name" field (e.g., John Doe)
- [ ] Fill in "Email Address" field (e.g., john@example.com)
- [ ] Fill in "Phone Number" field (e.g., 91234567)
- [ ] **VERIFY:** Headline "Let's get to know you" is **centered**
- [ ] **VERIFY:** Headline uses font-normal (not font-light)
- [ ] Click "Continue to property details"

### Step 2: Property Details
- [ ] **VERIFY:** Headline "Tell us about your property goals" is **centered**
- [ ] **VERIFY:** Headline uses font-normal weight
- [ ] Select "Resale - Existing HDB or private property"
- [ ] Select "Private Condo"
- [ ] Enter property price: 800000
- [ ] Enter combined age: 35
- [ ] **VERIFY:** Instant Analysis sidebar appears on RIGHT side
- [ ] **VERIFY:** Vertical divider (1px solid #E5E5E5) between form and sidebar
- [ ] **VERIFY:** Sidebar shows "You can borrow up to $600,000"
- [ ] **VERIFY:** Unified container (form + sidebar in same white container)
- [ ] **VERIFY:** Container has semi-transparent background (bg-white/40 backdrop-blur-sm)
- [ ] **VERIFY:** Sidebar is sticky (scroll down, sidebar stays visible)

### Visual Inspection
- [ ] **VERIFY:** No console errors in DevTools
- [ ] **VERIFY:** No visual glitches or layout breaks
- [ ] **VERIFY:** Typography looks clean and professional
- [ ] **VERIFY:** Spacing follows 8px system (8px, 16px, 32px, 64px)

---

## Mobile Testing (375px viewport)

### Setup
- [ ] Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select "iPhone SE" or custom 375px x 667px
- [ ] Refresh page

### Minimal Header
- [ ] Navigate to http://localhost:3000/apply?loanType=new_purchase
- [ ] **VERIFY:** Only NextNest logo visible in header
- [ ] **VERIFY:** Logo does NOT cause horizontal scroll
- [ ] **VERIFY:** Logo is appropriately sized for mobile (h-5 / 20px height)
- [ ] **VERIFY:** NO navigation links visible

### Spacing & Layout
- [ ] **VERIFY:** Small gap between nav and form (~4rem / 64px)
- [ ] **VERIFY:** No horizontal scroll on entire page
- [ ] **VERIFY:** Content fits within 375px viewport width

### Step 1: Contact Information
- [ ] Fill in all fields (name, email, phone)
- [ ] **VERIFY:** Headline "Let's get to know you" is **centered**
- [ ] **VERIFY:** All touch targets are ≥48px height
- [ ] **VERIFY:** Text is readable (≥14px font size)
- [ ] Click "Continue to property details"

### Step 2: Property Details
- [ ] **VERIFY:** Headline "Tell us about your property goals" is **centered**
- [ ] Fill property category, type, price, age
- [ ] **VERIFY:** Sidebar is HIDDEN on mobile
- [ ] **VERIFY:** No vertical divider visible (mobile is single column)
- [ ] **VERIFY:** Form fields stack vertically
- [ ] **VERIFY:** No horizontal scroll

### Visual Inspection
- [ ] **VERIFY:** Touch targets are large enough for thumbs
- [ ] **VERIFY:** Form is easy to navigate on mobile
- [ ] **VERIFY:** No layout shifts or jumps
- [ ] **VERIFY:** Buttons are full-width or appropriately sized

---

## Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] Desktop: All tests pass
- [ ] Mobile viewport: All tests pass

### Firefox
- [ ] Desktop: Minimal header works
- [ ] Mobile viewport: No horizontal scroll

### Safari (if available)
- [ ] Desktop: Layout intact
- [ ] Mobile: Touch targets work

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all form fields in order
- [ ] **VERIFY:** Focus indicators visible
- [ ] **VERIFY:** Can submit form with Enter key
- [ ] **VERIFY:** Can navigate backward with Shift+Tab

### Screen Reader (Optional)
- [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
- [ ] **VERIFY:** Headline is announced
- [ ] **VERIFY:** Form labels are announced
- [ ] **VERIFY:** Error messages have role="alert"

### Color Contrast
- [ ] **VERIFY:** Text/background contrast ≥4.5:1
- [ ] **VERIFY:** Headline is readable (black #000000 on white/light gray)
- [ ] **VERIFY:** Secondary text (#666666) is readable

### Reduced Motion
- [ ] Enable "prefers-reduced-motion" in OS settings
- [ ] **VERIFY:** No animations or transitions occur
- [ ] **VERIFY:** Form still functions normally

---

## Performance Testing

### Lighthouse Audit
- [ ] Open DevTools → Lighthouse tab
- [ ] Run audit for Desktop
- [ ] **TARGET:** Performance ≥90
- [ ] **TARGET:** Accessibility ≥95
- [ ] Run audit for Mobile
- [ ] **TARGET:** Performance ≥80 (mobile)
- [ ] **TARGET:** Accessibility ≥95

### Bundle Size (from build output)
- [ ] /apply route: 190 kB First Load JS (acceptable for feature-rich form)
- [ ] Homepage: 97.5 kB First Load JS (✅ under 100KB target)
- [ ] Shared chunks: 87.4 kB

---

## Brand Canon Compliance

### Typography
- [ ] **VERIFY:** Font family is Inter (check DevTools)
- [ ] **VERIFY:** Headlines use text-3xl or text-4xl (48px-60px)
- [ ] **VERIFY:** Labels use text-xs uppercase tracking-wider
- [ ] **VERIFY:** Body text is ≥14px

### Colors
- [ ] **VERIFY:** Primary text: #000000 (black)
- [ ] **VERIFY:** Secondary text: #666666 (gray)
- [ ] **VERIFY:** Borders: #E5E5E5 (light gray)
- [ ] **VERIFY:** Background: #F8F8F8 (off-white)
- [ ] **VERIFY:** Accent: #FFD700 (gold) on CTA buttons

### Spacing
- [ ] **VERIFY:** Consistent 8px spacing system
- [ ] **VERIFY:** Form fields have adequate spacing (16px-32px)
- [ ] **VERIFY:** No cramped or overly tight layouts

---

## Known Issues (From Automated QA)

### P0 - CRITICAL (Fix Required)
- [ ] **Mobile horizontal scroll bug** - Logo expanding beyond container
  - Current: Logo 471px wide (causes 96px overflow)
  - Fix: Add `max-w-[200px]` to logo in ConditionalNav.tsx
  - **STATUS:** ⚠️ NEEDS FIX

### P1 - Should Fix
- [ ] **Step 2 headline not centered** - "Let's get to know you" is left-aligned
  - Fix: Add `text-center` class to headline
  - **STATUS:** ⚠️ NEEDS FIX

---

## Final Checklist

- [ ] All desktop tests passed
- [ ] All mobile tests passed
- [ ] No console errors
- [ ] No accessibility violations
- [ ] Performance targets met
- [ ] Brand canon compliance verified
- [ ] Known issues documented
- [ ] Screenshots captured for evidence

---

## Notes & Observations

**Tester Name:** _________________
**Date Completed:** _________________
**Issues Found:** _________________
**Overall Status:** ☐ PASS  ☐ PASS WITH ISSUES  ☐ FAIL

**Additional Comments:**

