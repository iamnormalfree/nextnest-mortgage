# NextNest Bloomberg Terminal Design Implementation Plan
## Tailwind + shadcn/ui + Bloomberg Approach (Optimized)

**Created:** 2025-01-14
**Updated:** 2025-01-14 (Improved single source of truth)
**Target:** Junior Developers
**Scope:** ENTIRE MAIN SITE (not just sophisticated-flow)
**Test Implementation:** Start with `/redesign/sophisticated-flow` page
**Final Implementation:** Apply to all main pages (`/`, `/dashboard`, `/calculator`, etc.)
**Goal:** Achieve <2 second load time with ~10KB CSS bundle

---

## 🎯 Overview

We're implementing an **optimized hybrid approach** that combines:
1. **Tailwind CSS** - Single source of truth for ALL design tokens (~8KB)
2. **shadcn/ui** - For accessible components (0KB - just Tailwind)
3. **Minimal Critical CSS** - Only for complex animations (~1KB)

### 🆕 Key Improvements in This Version:
- **Single Source of Truth**: All design tokens in tailwind.config.ts only
- **No Duplicated Colors**: CSS variables reference Tailwind via RGB values
- **No !important Hacks**: Default transitions set in config
- **Optimized Fonts**: Using Next.js font system (non-blocking)
- **Gradients in Tailwind**: bg-hero-gradient and bg-gradient-gold-text utilities
- **Automatic 200ms Transitions**: Set as default, no manual overrides needed

This is **better than pure CSS** because:
- Smaller bundle (9KB vs 30KB)
- Easier maintenance (one config file)
- Type safety with IntelliSense
- Better performance (font optimization)
- Cleaner code (no overrides)

---

## 📋 Phase 1: Setup Tailwind Config (Day 1)

### Step 1.1: Backup Current Config
```bash
# In terminal
cp tailwind.config.ts tailwind.config.backup.ts
```

### Step 1.2: Update Tailwind Config (Complete Single Source of Truth)
Replace your `tailwind.config.ts` with this optimized Bloomberg design system:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    // Set defaults at theme level (not in extend)
    transitionDuration: {
      DEFAULT: '200ms',
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '300': '300ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
      '2000': '2000ms', // For counter animation only
    },
    extend: {
      colors: {
        // Bloomberg Terminal Palette - Single Source of Truth
        'white': '#FFFFFF',
        'ink': '#0A0A0A',
        'charcoal': '#1C1C1C',
        'graphite': '#374151',
        'silver': '#8E8E93',
        'pearl': '#C7C7CC',
        'fog': '#E5E5EA',
        'mist': '#F2F2F7',

        // Accent - 5% of UI
        'gold': {
          DEFAULT: '#FCD34D',
          dark: '#F59E0B',
          pale: '#FEF3C7',
        },

        // Semantic
        'emerald': '#10B981',
        'ruby': '#EF4444',

        // shadcn compatibility (reference our colors)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'Helvetica Neue', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.5' }],
        'sm': ['13px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'lg': ['20px', { lineHeight: '1.3' }],
        'xl': ['25px', { lineHeight: '1.3' }],
        '2xl': ['31px', { lineHeight: '1.2' }],
        '3xl': ['39px', { lineHeight: '1.2' }],
        '4xl': ['49px', { lineHeight: '1.2' }],
      },
      spacing: {
        '0': '0px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
        '10': '80px',
        '12': '96px',
        '16': '128px',
      },
      backgroundImage: {
        // Gradients defined here - no need for custom CSS
        'gradient-gold-text': 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
        'hero-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F2F2F7 100%)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "skeleton": "skeleton-wave 1.5s infinite",
        "counter": "counter 2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "skeleton-wave": {
          to: { transform: "translateX(100%)" },
        },
        "counter": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### Step 1.3: Test Config
```bash
npm run dev
# Check that site still loads
```

---

## 📋 Phase 2: Font Optimization & CSS Setup (Day 1)

### Step 2.1: Optimize Font Loading with Next.js
Update `app/layout.tsx` for non-blocking font loading:

```typescript
// app/layout.tsx
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'

// Option A: If you have SF Pro Display files locally
const sfProDisplay = localFont({
  src: [
    {
      path: '../public/fonts/SF-Pro-Display-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Display-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Display-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-sans',
})

// Option B: Use Inter as fallback (similar to SF Pro)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sfProDisplay.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Step 2.2: Update globals.css with CSS Variables
Update your `app/globals.css` to map shadcn variables to Tailwind colors:

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Map shadcn variables to Tailwind colors using RGB values */
    --background: 255 255 255; /* white */
    --foreground: 10 10 10; /* ink */

    --card: 255 255 255; /* white */
    --card-foreground: 10 10 10; /* ink */

    --popover: 255 255 255; /* white */
    --popover-foreground: 10 10 10; /* ink */

    --primary: 252 211 77; /* gold */
    --primary-foreground: 10 10 10; /* ink */

    --secondary: 242 242 247; /* mist */
    --secondary-foreground: 28 28 28; /* charcoal */

    --muted: 242 242 247; /* mist */
    --muted-foreground: 55 65 81; /* graphite */

    --accent: 252 211 77; /* gold */
    --accent-foreground: 10 10 10; /* ink */

    --destructive: 239 68 68; /* ruby */
    --destructive-foreground: 255 255 255; /* white */

    --border: 229 229 234; /* fog */
    --input: 229 229 234; /* fog */
    --ring: 252 211 77; /* gold */

    --radius: 0rem; /* No rounded corners */
  }

  /* Optional dark mode (if needed) */
  .dark {
    --background: 10 10 10;
    --foreground: 255 255 255;
    /* ... other dark mode colors */
  }
}

/* Custom utilities that Tailwind can't handle */
@layer utilities {
  /* Text gradient utility */
  .text-gradient-gold {
    @apply bg-gradient-gold-text bg-clip-text text-transparent;
  }

  /* Ensure all transitions default to 200ms */
  * {
    @apply transition-all duration-200;
  }

  /* Remove default focus rings */
  *:focus {
    @apply outline-none;
  }

  /* Gold focus for form elements */
  input:focus,
  select:focus,
  textarea:focus {
    @apply border-gold;
  }
}
```

### Step 2.3: Create Minimal Critical CSS (Optional)
Only if you need animations that can't be in Tailwind:

```css
/* styles/bloomberg-critical.css - ONLY for complex animations */

/* Complex skeleton loader (if Tailwind's animate-pulse isn't enough) */
@keyframes skeleton-wave {
  to { transform: translateX(100%); }
}

.skeleton-loader {
  position: relative;
  overflow: hidden;
}

.skeleton-loader::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: skeleton-wave 1.5s infinite;
}

/* That's it! Everything else is in Tailwind */
```

---

## 📋 Phase 3: Update sophisticated-flow Page (Day 2)

### Step 3.1: Remove Old CSS Imports
In `app/redesign/sophisticated-flow/page.tsx`:

```typescript
// DELETE these lines:
import '../../../redesign/sophisticated-flow-consolidated.css'

// Or if using multiple:
import '../../../redesign/minimal.css'
import '../../../redesign/sophisticated.css'
import '../../../redesign/sophisticated-premium.css'
import '../../../redesign/bloomberg-terminal.css'
```

### Step 3.2: Convert to Tailwind Classes

#### Before (Custom CSS):
```tsx
<nav className="nav">
  <div className="container nav-container">
    <div className="nav-links">
```

#### After (Tailwind):
```tsx
<nav className="fixed top-0 w-full h-16 bg-white border-b border-fog z-50">
  <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
    <div className="flex items-center gap-6">
```

### Step 3.3: Class Conversion Reference

| Old CSS Class | Tailwind Replacement |
|--------------|---------------------|
| `.nav` | `fixed top-0 w-full h-16 bg-white border-b border-fog` |
| `.container` | `max-w-7xl mx-auto px-4 md:px-8` |
| `.btn-premium-primary` | `h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark` |
| `.btn-premium-ghost` | `h-12 px-8 border border-fog text-charcoal hover:bg-mist` |
| `.heading-4xl` | `text-4xl font-light text-ink leading-tight` |
| `.text-stone` | `text-graphite` |
| `.mb-md` | `mb-3` |
| `.gap-md` | `gap-3` |
| `.section` | `py-16 md:py-32` |
| `.card` | `bg-white border border-fog p-6 shadow-sm` |
| `.badge` | `px-3 py-1 text-xs uppercase tracking-wider font-medium` |

---

## 📋 Phase 4: Update Components (Day 2-3)

### Step 4.1: Convert Hero Section (Using New Approach)

```tsx
// New Hero with Tailwind (gradients from config)
export function HeroSection() {
  return (
    <section className="bg-hero-gradient py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-6 items-center">

          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs uppercase tracking-wider font-medium mb-2">
              AI-Powered Intelligence
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-light text-ink leading-tight mb-2">
              Singapore's Smartest<br />
              Mortgage Platform
            </h1>

            {/* Description */}
            <p className="text-lg text-charcoal mb-6">
              Real-time analysis of <span className="font-mono font-medium">286</span> packages.
            </p>

            {/* Buttons - transition defaults to 200ms from config */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]">
                Start Free Analysis
              </button>
              <button className="h-12 px-8 border border-fog text-charcoal hover:bg-mist">
                View Demo
              </button>
            </div>
          </div>

          {/* Right Metric Card with gradient text */}
          <div className="bg-white border border-fog p-6">
            <h3 className="text-xs text-silver uppercase tracking-wider mb-4">
              Lifetime Savings
            </h3>
            {/* Using gradient from Tailwind config */}
            <div className="text-3xl font-mono font-medium text-gradient-gold">
              $34,560
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

### Step 4.2: Convert Form Components

```tsx
// Before (Custom CSS)
<div className="form-group">
  <label className="form-label">Property Type</label>
  <select className="form-select">

// After (Tailwind + shadcn)
<div className="space-y-2">
  <Label className="text-xs uppercase tracking-wider text-silver">
    Property Type
  </Label>
  <Select>
    <SelectTrigger className="h-12 border-fog focus:border-gold">
```

---

## 📋 Phase 5: Integrate shadcn Components (Day 3)

### Step 5.1: Update shadcn Button

In `components/ui/button.tsx`, update the variants:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gold text-ink hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-ruby text-white hover:bg-ruby/90",
        outline: "border border-fog bg-white hover:bg-mist text-charcoal",
        secondary: "bg-mist text-charcoal hover:bg-fog",
        ghost: "hover:bg-mist text-charcoal",
        link: "text-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-10 px-6 text-xs",
        lg: "h-14 px-10",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Step 5.2: Use shadcn in Components

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

// Use them with Bloomberg styling
<Button className="w-full">
  Get Started
</Button>

<Input
  className="h-12 border-fog focus:border-gold font-mono"
  placeholder="Enter amount"
/>
```

---

## 📋 Phase 6: Testing Checklist (Day 4)

### Performance Testing
- [ ] Run Lighthouse audit
- [ ] Check bundle size: `npm run build && npm run analyze`
- [ ] Verify CSS is under 15KB
- [ ] Test load time < 2 seconds
- [ ] Check Core Web Vitals

### Visual Testing
- [ ] No purple (#7C3AED) anywhere
- [ ] Gold accent (#FCD34D) working
- [ ] 64px navigation height
- [ ] 48px button heights
- [ ] 8px spacing grid maintained
- [ ] No rounded corners
- [ ] 200ms transitions

### Responsive Testing
- [ ] Mobile: iPhone 14 Pro (390px)
- [ ] Tablet: iPad (768px)
- [ ] Desktop: 1440px
- [ ] Buttons full width on mobile
- [ ] Grid stacks properly

### Component Testing
- [ ] Forms work correctly
- [ ] shadcn components styled properly
- [ ] Icons display (no emojis)
- [ ] Hover states work
- [ ] Focus states are gold

---

## 📋 Phase 7: Cleanup (Day 4)

### Step 7.1: Remove Unused Files
Once sophisticated-flow is working:

```bash
# These can be deleted if no other pages use them:
# rm redesign/sophisticated-flow-consolidated.css
# rm redesign/minimal.css
# rm redesign/sophisticated.css
# rm redesign/sophisticated-premium.css
# rm redesign/bloomberg-terminal.css
```

### Step 7.2: Document Changes
Create a comment at top of page.tsx:

```typescript
/**
 * Sophisticated Flow Page
 * Design System: Bloomberg Terminal × Spotify × Swiss Spa
 *
 * Stack:
 * - Tailwind CSS for utilities
 * - shadcn/ui for components
 * - bloomberg-critical.css for special effects
 *
 * Colors: 95% monochrome + 5% gold (#FCD34D)
 * Spacing: 8px grid system
 * Animations: 200ms max
 */
```

---

## 🎯 Quick Reference

### Color Palette
```typescript
// Use these Tailwind classes:
text-ink        // #0A0A0A - Primary text
text-charcoal   // #1C1C1C - Secondary text
text-graphite   // #374151 - Body text
text-silver     // #8E8E93 - Labels
bg-gold         // #FCD34D - Primary accent
bg-mist         // #F2F2F7 - Backgrounds
border-fog      // #E5E5EA - Borders
```

### Spacing (8px grid)
```typescript
p-1   // 8px
p-2   // 16px
p-3   // 24px
p-4   // 32px
p-6   // 48px
p-8   // 64px
p-16  // 128px
```

### Typography
```typescript
text-xs   // 11px - Labels
text-sm   // 13px - Secondary
text-base // 16px - Body
text-lg   // 20px - Subheadings
text-xl   // 25px - Section headers
text-2xl  // 31px - Page headers
text-3xl  // 39px - Hero
text-4xl  // 49px - Display
```

### Common Patterns
```typescript
// Navigation
"fixed top-0 w-full h-16 bg-white border-b border-fog z-50"

// Primary Button
"h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] transition-all"

// Ghost Button
"h-12 px-8 border border-fog text-charcoal hover:bg-mist transition-all"

// Card
"bg-white border border-fog p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"

// Input
"h-12 px-4 border border-fog focus:border-gold focus:outline-none"

// Label
"text-xs uppercase tracking-wider text-silver font-medium"
```

---

## ⚠️ Common Mistakes to Avoid

1. **DON'T duplicate color definitions**
   - ❌ Defining colors in both Tailwind config AND CSS
   - ✅ Define once in tailwind.config.ts

2. **DON'T use !important overrides**
   - ❌ `transition-duration: 200ms !important`
   - ✅ Set defaults in Tailwind config

3. **DON'T use @import for fonts**
   - ❌ `@import url('font-url')` in CSS
   - ✅ Use Next.js font optimization in layout.tsx

4. **DON'T use rounded corners**
   - ❌ `rounded-md`, `rounded-lg`
   - ✅ All border-radius set to 0 in config

5. **DON'T use purple anywhere**
   - ❌ `bg-purple-500`
   - ✅ `bg-gold`

6. **DON'T override transitions manually**
   - ❌ Adding `transition-all duration-200` to every element
   - ✅ Default duration set in config (automatic)

7. **DON'T use decorative animations**
   - ❌ `animate-pulse`, `animate-bounce`
   - ✅ Only `animate-skeleton` and `animate-counter`

8. **DON'T use emojis in UI**
   - ❌ 🔒, 🏦, ✨
   - ✅ Lucide React icons

---

## 🚀 Implementation Phases for Main Site

### Phase A: Test on sophisticated-flow (Days 1-4)

#### ⚠️ CRITICAL: Potential Issues for Junior Developers

**Without this enhanced guidance, a junior developer might:**
1. **Break the entire site** by deleting wrong parts of tailwind.config.ts
2. **Create color mismatches** by using HSL instead of RGB format
3. **Cause build errors** by removing essential @tailwind directives
4. **Miss critical verifications** and continue with broken setup
5. **Apply wrong classes** without understanding the mapping
6. **Create performance issues** by not setting transition defaults correctly
7. **Break shadcn components** by misconfiguring CSS variables

**This enhanced plan prevents these by:**
- Providing EXACT code to copy/paste
- Including verification steps after EVERY change
- Showing expected outcomes ("page should look broken")
- Adding warning boxes for common mistakes
- Providing rollback instructions (backups)
- Breaking complex tasks into tiny sub-steps
- Including console commands to verify state

#### Day 1: Setup & Configuration

##### ⚠️ BEFORE YOU START - CRITICAL CHECKS
- [ ] **Verify you're in the right directory**
  - [ ] Run `pwd` - should show `/path/to/NextNest`
  - [ ] Run `ls` - should see `app`, `components`, `tailwind.config.ts`
  - [ ] If not in right directory: `cd` to NextNest root

- [ ] **Check current branch**
  - [ ] Run `git status` - note current branch
  - [ ] Run `git diff` - should be clean (no uncommitted changes)
  - [ ] If changes exist: commit them first or stash: `git stash`

##### TASK 1: Backup current configuration
- [ ] **Create backups (DO NOT SKIP)**
  - [ ] Run: `cp tailwind.config.ts tailwind.config.backup.ts`
  - [ ] Verify backup exists: `ls tailwind.config.backup.ts`
  - [ ] Run: `cp app/globals.css app/globals.backup.css`
  - [ ] Verify backup exists: `ls app/globals.backup.css`
  - [ ] Create new branch: `git checkout -b bloomberg-redesign`
  - [ ] Verify on new branch: `git branch` (should show * bloomberg-redesign)

##### TASK 2: Update Tailwind Configuration
- [ ] **Open `tailwind.config.ts`**
  - [ ] DELETE everything in the file
  - [ ] COPY the ENTIRE config from Phase 1, Step 1.2 (lines 39-189)
  - [ ] SAVE the file

- [ ] **Verify the config has these EXACT values:**
  - [ ] Search for `transitionDuration` - find this block:
    ```typescript
    transitionDuration: {
      DEFAULT: '200ms',  // MUST have this line
      // ... other durations
    }
    ```
  - [ ] Search for `colors:` - verify ALL these exist:
    ```typescript
    'ink': '#0A0A0A',        // ✓ Check this exact hex
    'charcoal': '#1C1C1C',   // ✓ Check this exact hex
    'graphite': '#374151',   // ✓ Check this exact hex
    'silver': '#8E8E93',     // ✓ Check this exact hex
    'fog': '#E5E5EA',        // ✓ Check this exact hex
    'mist': '#F2F2F7',       // ✓ Check this exact hex
    'gold': {
      DEFAULT: '#FCD34D',    // ✓ Check this exact hex
      dark: '#F59E0B',       // ✓ Check this exact hex
    }
    ```
  - [ ] Search for `backgroundImage` - verify these gradients exist:
    ```typescript
    backgroundImage: {
      'gradient-gold-text': 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
      'hero-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F2F2F7 100%)',
    }
    ```
  - [ ] Search for `borderRadius` - ALL must be 0px:
    ```typescript
    borderRadius: {
      DEFAULT: '0px',
      none: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
    }
    ```

- [ ] **Test the configuration**
  - [ ] Run: `npm run dev`
  - [ ] Check terminal - NO red errors
  - [ ] If errors about missing packages: `npm install tailwindcss-animate`
  - [ ] Open browser to `localhost:3000`
  - [ ] Page should still load (might look broken - that's OK for now)

##### TASK 3: Setup Font Optimization
- [ ] **Open `app/layout.tsx`**
  - [ ] Find the imports at the top
  - [ ] ADD these imports (don't delete existing ones):
    ```typescript
    import { Inter } from 'next/font/google'

    const inter = Inter({
      subsets: ['latin'],
      display: 'swap',
      variable: '--font-sans',
    })
    ```
  - [ ] Find the `<html>` tag (around line 20-30)
  - [ ] CHANGE from: `<html lang="en">`
  - [ ] TO: `<html lang="en" className={inter.variable}>`
  - [ ] SAVE the file

- [ ] **Verify font setup**
  - [ ] Check browser - refresh the page
  - [ ] Open DevTools (F12) > Network tab
  - [ ] Look for font files loading
  - [ ] Should see Inter font files (woff2 format)
  - [ ] Text should not "flash" when page loads

##### TASK 4: Update globals.css
- [ ] **Open `app/globals.css`**
  - [ ] Find the first line - should have `@tailwind base;`
  - [ ] If it has `@import` for fonts at top - DELETE those lines

- [ ] **Add the CSS variables (COPY THIS EXACTLY)**
  - [ ] After `@tailwind utilities;` add:
    ```css
    @layer base {
      :root {
        /* Map shadcn variables to Bloomberg colors using RGB */
        --background: 255 255 255; /* white */
        --foreground: 10 10 10; /* ink */
        --card: 255 255 255;
        --card-foreground: 10 10 10;
        --popover: 255 255 255;
        --popover-foreground: 10 10 10;
        --primary: 252 211 77; /* gold */
        --primary-foreground: 10 10 10;
        --secondary: 242 242 247; /* mist */
        --secondary-foreground: 28 28 28;
        --muted: 242 242 247;
        --muted-foreground: 55 65 81;
        --accent: 252 211 77;
        --accent-foreground: 10 10 10;
        --destructive: 239 68 68;
        --destructive-foreground: 255 255 255;
        --border: 229 229 234; /* fog */
        --input: 229 229 234;
        --ring: 252 211 77;
        --radius: 0rem;
      }
    }
    ```

- [ ] **Add utility classes**
  - [ ] After the `:root` block, add:
    ```css
    @layer utilities {
      .text-gradient-gold {
        @apply bg-gradient-gold-text bg-clip-text text-transparent;
      }

      * {
        @apply transition-all duration-200;
      }

      *:focus {
        @apply outline-none;
      }

      input:focus,
      select:focus,
      textarea:focus {
        @apply border-gold;
      }
    }
    ```

- [ ] **Test globals.css changes**
  - [ ] SAVE the file
  - [ ] Check browser - page should still load
  - [ ] If you have any shadcn components on main site:
    - [ ] Check they still display (colors might change)
    - [ ] Buttons should work
    - [ ] Forms should work
  - [ ] Check console for errors (F12 > Console)
  - [ ] Should be NO red errors

##### ✅ DAY 1 CHECKPOINT
Before moving to Day 2, verify:
- [ ] `tailwind.config.ts` has Bloomberg colors
- [ ] `app/layout.tsx` has Inter font setup
- [ ] `app/globals.css` has CSS variables
- [ ] Site still loads (even if ugly)
- [ ] No console errors
- [ ] You're on `bloomberg-redesign` branch

⚠️ **COMMON MISTAKES TO AVOID:**
- DON'T delete the `@tailwind` directives in globals.css
- DON'T forget the `className={inter.variable}` on `<html>`
- DON'T use HSL format for colors - use RGB (space-separated)
- DON'T skip the backups - you'll need them if something breaks

#### Day 2: Convert sophisticated-flow Page

##### ⚠️ BEFORE STARTING DAY 2
- [ ] Verify Day 1 is complete (all checkboxes checked)
- [ ] Run `npm run dev` - should be running without errors
- [ ] Open `http://localhost:3000/redesign/sophisticated-flow` in browser
- [ ] Page loads (might look broken with old styles)

##### TASK 1: Remove Old CSS Imports
- [ ] **Open `app/redesign/sophisticated-flow/page.tsx`**
  - [ ] Look at lines 1-20 for import statements
  - [ ] FIND this line (around line 7):
    ```typescript
    import '../../../redesign/sophisticated-flow-consolidated.css'
    ```
  - [ ] DELETE that entire line
  - [ ] Also DELETE if you see any of these:
    ```typescript
    import '../../../redesign/minimal.css'
    import '../../../redesign/sophisticated.css'
    import '../../../redesign/sophisticated-premium.css'
    import '../../../redesign/bloomberg-terminal.css'
    ```
  - [ ] SAVE the file

- [ ] **Verify CSS removal**
  - [ ] Refresh browser on sophisticated-flow page
  - [ ] Page should look VERY broken (no styles)
  - [ ] This is CORRECT - we're rebuilding with Tailwind
  - [ ] Check console - should have NO errors about missing CSS files

##### TASK 2: Convert Navigation (EXACT REPLACEMENTS)
- [ ] **Find the navigation section**
  - [ ] Search (Ctrl+F) for: `<nav className="nav"`
  - [ ] Should be around line 82-120

- [ ] **Replace nav element**
  - [ ] FIND:
    ```tsx
    <nav className="nav">
    ```
  - [ ] REPLACE WITH:
    ```tsx
    <nav className="fixed top-0 w-full h-16 bg-white border-b border-fog z-50">
    ```

- [ ] **Replace nav-container**
  - [ ] FIND:
    ```tsx
    <div className="container nav-container">
    ```
  - [ ] REPLACE WITH:
    ```tsx
    <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
    ```

- [ ] **Replace nav-links**
  - [ ] FIND:
    ```tsx
    <div className="nav-links">
    ```
  - [ ] REPLACE WITH:
    ```tsx
    <div className="flex items-center gap-6">
    ```

- [ ] **Replace ALL nav-link classes**
  - [ ] FIND each occurrence of:
    ```tsx
    className="nav-link"
    ```
  - [ ] REPLACE EACH WITH:
    ```tsx
    className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer"
    ```

- [ ] **Replace button classes in nav**
  - [ ] FIND:
    ```tsx
    className="btn-premium btn-premium-primary"
    ```
  - [ ] REPLACE WITH:
    ```tsx
    className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
    ```

- [ ] **Test navigation**
  - [ ] SAVE the file
  - [ ] Refresh browser
  - [ ] Navigation should:
    - [ ] Be fixed at top
    - [ ] Have white background
    - [ ] Have thin grey border at bottom
    - [ ] Logo on left, buttons on right
    - [ ] Gold "Get Started" button
  - [ ] Measure height in DevTools (should be 64px/4rem)

- [ ] **Convert Hero Section**
  - [ ] Replace className="section" with `py-16 md:py-32`
  - [ ] Use `bg-hero-gradient` for background (from Tailwind config)
  - [ ] Convert container: `max-w-7xl mx-auto px-4 md:px-8`
  - [ ] Update grid: `grid md:grid-cols-2 gap-6 items-center`
  - [ ] Test hero gradient displays correctly

- [ ] **Convert Buttons**
  - [ ] Find all btn-premium-primary buttons
  - [ ] Replace with: `h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]`
  - [ ] Find all btn-premium-ghost buttons
  - [ ] Replace with: `h-12 px-8 border border-fog text-charcoal hover:bg-mist`
  - [ ] Remove any `transition-all` classes (automatic from config)
  - [ ] Test all buttons have 48px height and proper hover states

- [ ] **Convert Typography**
  - [ ] Replace heading-4xl with `text-4xl font-light text-ink leading-tight`
  - [ ] Replace heading-3xl with `text-3xl font-light text-ink leading-tight`
  - [ ] Replace heading-2xl with `text-2xl font-normal text-ink`
  - [ ] Update all text-stone to `text-graphite`
  - [ ] Convert labels to `text-xs uppercase tracking-wider text-silver font-medium`
  - [ ] Verify all text uses correct font sizes from config

#### Day 3: Convert Components & Forms

- [ ] **Update Metric Cards**
  - [ ] Convert card classes to `bg-white border border-fog p-6 shadow-sm`
  - [ ] Add hover state: `hover:-translate-y-0.5 hover:shadow-md`
  - [ ] Update metric labels: `text-xs text-silver uppercase tracking-wider mb-1`
  - [ ] Update metric values: `text-2xl font-mono font-medium text-ink`
  - [ ] For gold values use: `text-gold`
  - [ ] Test cards have proper spacing and hover effects

- [ ] **Convert Form Elements**
  - [ ] Update all inputs to: `h-12 px-4 border border-fog focus:border-gold focus:outline-none`
  - [ ] Ensure select elements have same styling
  - [ ] Convert form labels to uppercase style
  - [ ] Add proper spacing between form groups: `space-y-6`
  - [ ] Test focus states show gold border

- [ ] **Apply Gradient Text**
  - [ ] Find important metrics that need gradient
  - [ ] Add class: `text-gradient-gold` (utility from globals.css)
  - [ ] Or use: `bg-gradient-gold-text bg-clip-text text-transparent`
  - [ ] Limit to ONE gradient text element per viewport
  - [ ] Verify gradient displays correctly

- [ ] **Update Badges/Pills**
  - [ ] Convert badge classes to: `px-3 py-1 text-xs uppercase tracking-wider font-medium`
  - [ ] Success badges: `bg-emerald text-white`
  - [ ] Warning badges: `bg-gold/10 text-gold`
  - [ ] Info badges: `bg-mist text-graphite`
  - [ ] Test all badge variants display correctly

- [ ] **Convert Progress Indicators**
  - [ ] Update progress bar: `h-1 bg-fog`
  - [ ] Update progress fill: `h-full bg-gold`
  - [ ] For step indicators use: `w-6 h-6 rounded-full border-2 border-fog`
  - [ ] Active step: `bg-gold border-gold`
  - [ ] Complete step: `bg-charcoal border-charcoal`

#### Day 4: Testing & Optimization

- [ ] **Performance Testing**
  - [ ] Run `npm run build`
  - [ ] Check build output for CSS size (should be ~9-10KB)
  - [ ] Run Lighthouse audit in Chrome DevTools
  - [ ] Verify Core Web Vitals:
    - [ ] LCP < 2.5s
    - [ ] FID < 100ms
    - [ ] CLS < 0.1
  - [ ] Check load time is under 2 seconds

- [ ] **Visual Testing**
  - [ ] Verify NO purple (#7C3AED) anywhere on page
  - [ ] Check gold accent (#FCD34D) is used for primary actions
  - [ ] Confirm navigation is exactly 64px height
  - [ ] Verify all buttons are 48px height
  - [ ] Check all corners are sharp (no border-radius)
  - [ ] Ensure fonts are SF Pro or Inter
  - [ ] Verify 8px spacing grid is maintained

- [ ] **Responsive Testing**
  - [ ] Test on mobile (390px - iPhone 14 Pro)
    - [ ] Navigation collapses properly
    - [ ] Buttons are full width
    - [ ] Text is readable
    - [ ] Forms are usable
  - [ ] Test on tablet (768px - iPad)
    - [ ] Grid layouts work
    - [ ] Spacing is appropriate
  - [ ] Test on desktop (1440px)
    - [ ] Max-width containers work
    - [ ] Layout is centered

- [ ] **Component Testing**
  - [ ] Test all form inputs focus state (gold border)
  - [ ] Verify all buttons have hover states
  - [ ] Check transitions are 200ms (not longer)
  - [ ] Test any modals/dropdowns if present
  - [ ] Verify icons display (no broken images)
  - [ ] Check loading states/skeletons work

- [ ] **Cross-browser Testing**
  - [ ] Test in Chrome
  - [ ] Test in Firefox
  - [ ] Test in Safari (if on Mac)
  - [ ] Test in Edge
  - [ ] Document any browser-specific issues

- [ ] **Accessibility Check**
  - [ ] Run axe DevTools extension
  - [ ] Check color contrast ratios (WCAG AA)
  - [ ] Verify keyboard navigation works
  - [ ] Test with screen reader (if possible)
  - [ ] Ensure all images have alt text

- [ ] **Final Cleanup**
  - [ ] Remove any console.log statements
  - [ ] Delete commented-out code
  - [ ] Ensure no TypeScript errors: `npm run type-check`
  - [ ] Run linter: `npm run lint`
  - [ ] Fix any linting issues

- [ ] **Documentation**
  - [ ] Document any issues encountered
  - [ ] Note any deviations from the plan
  - [ ] List components that need special attention
  - [ ] Create notes for Phase B implementation

#### Success Criteria Checklist
- [ ] Page loads in under 2 seconds
- [ ] CSS bundle is under 10KB
- [ ] No purple colors visible
- [ ] Gold accent used sparingly (5% of UI)
- [ ] All transitions are 200ms
- [ ] Navigation is 48px height
- [ ] Buttons are 48px height
- [ ] No rounded corners
- [ ] Fonts load without blocking
- [ ] All shadcn components work correctly
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] Lighthouse score > 90

### Phase B: Apply to Main Site (Days 5-8)

#### B-0: Headless Controller Refactor (Day 5)
Objective: keep all existing business logic (schemas, calculations, analytics, events) but present it with the sophisticated UI. We do this by creating a reusable “headless” controller hook that powers any UI.

Files we will work with:
- `lib/domains/forms/entities/LeadForm.ts` (domain state – do not change logic)
- `lib/validation/mortgage-schemas.ts` (Zod schemas – do not change logic)
- `lib/calculations/mortgage.ts` (calculations – do not change logic)
- `lib/analytics/conversion-tracking.ts`, `lib/events/event-bus.ts` (analytics/events – unchanged)
- `components/forms/ProgressiveForm.tsx` (current UI – source for logic we mirror)
- `redesign/SophisticatedProgressiveForm.tsx` (new UI skin)

Step B-0.1: Create headless controller
- [ ] Create `hooks/useProgressiveFormController.ts`
- [ ] Initialize `LeadForm(sessionId)` and set `loanType` (map `'new'` → `'new_purchase'` if needed)
- [ ] Create React Hook Form instance using `zodResolver(createStepSchema(loanType, currentStep))`
- [ ] Import default values from a new helper (see B-0.2) and pass as `defaultValues`
- [ ] Expose a typed interface for UIs:
  - state: `currentStep`, `completedSteps`, `errors`, `isValid`, `isAnalyzing`, `instantCalcResult`, `leadScore`
  - RHF: `control`, `register`, `handleSubmit`, `watch`, `setValue`, `trigger`
  - actions: `next(data)`, `prev()`, `onFieldChange(name, value)`, `requestAIInsight(name, value)`
- [ ] Reuse the same instant-calculation triggers from `components/forms/ProgressiveForm.tsx` (do not alter math)
- [ ] Forward analytics/events (conversion tracking and `FormEvents`) exactly as in `ProgressiveForm`

Step B-0.2: Extract domain bits from UI into lib (no behavior changes)
- [ ] Use consolidated `lib/forms/form-config.ts` which exports:
  - `formSteps`, `getDefaultValues(loanType)`, `mapLoanType`, `getVisibleFields`
- [ ] Keep calculators as-is in `lib/calculations/mortgage.ts`
- [ ] Reference `lib/forms/field-mapping.ts` for UI → schema mapping

Step B-0.3: Wire sophisticated UI to the controller
- [ ] Open `redesign/SophisticatedProgressiveForm.tsx`
- [ ] Remove local state for fields that will be controlled by RHF
- [ ] Import and use `useProgressiveFormController`
- [ ] Bind inputs/selects to the controller (`register` or `Controller`) with Bloomberg Tailwind classes
- [ ] Drive progress UI from `currentStep` and `formSteps.length`
- [ ] Import `formSteps` from `lib/forms/form-config.ts` and use it for progress (do not hardcode local steps)
- [ ] Call `onFieldChange(name, value)` on user edits to sync `LeadForm` and analytics
- [ ] Use `instantCalcResult` from controller to render metrics (no UI logic changes required)
- [ ] When using `Controller`, wrap `onChange`: `onChange={(e) => { field.onChange(e); onFieldChange(field.name, e.target?.value ?? e) }}`

Step B-0.4: Field mapping (Sophisticated UI → existing schema keys)
- [ ] Loan type: UI `'new' | 'refinance' | 'commercial'` → schema `loanType: 'new_purchase' | 'refinance' | 'commercial'`
- [ ] Property category: `propertyCategory: 'resale' | 'new_launch' | 'bto' | 'commercial'`
- [ ] Property type: `propertyType: string` (auto-set to `'Commercial'` when category is commercial)
- [ ] Loan amount: bind to `priceRange: number` (rename UI label if needed)
- [ ] Combined age: `combinedAge: number`
- [ ] Refinance fields: `currentRate: number`, `outstandingLoan: number`, `currentBank: string`
- [ ] Income: map UI `monthlyIncome` → schema `actualIncomes.0` (or set both via controller)
- [ ] Required field coverage by step:
  - New purchase, Step 2: `propertyCategory`, `propertyType`, `priceRange:number`, `combinedAge:number`
    - Exception: if `propertyCategory === 'commercial'`, only `propertyCategory` is required and set `propertyType = 'Commercial'` automatically
  - Refinance, Step 2: `propertyType`, `currentRate:number`, `outstandingLoan:number`, `currentBank:string`

Verification (Day 5)
- [ ] Build succeeds: `npm run build`
- [ ] Brand lint passes: `npm run lint:brand` (no hex colors like `#FCD34D` in components)
- [ ] Visit `/redesign/sophisticated-flow` → Enter form view
  - [ ] Step 1 requires: `name`, `email`, `phone`
  - [ ] Step 2 (new purchase): requires `propertyCategory` (+ `propertyType`, `priceRange`, `combinedAge` unless commercial)
  - [ ] Step 2 (refinance): requires `propertyType`, `currentRate`, `outstandingLoan`, `currentBank`
  - [ ] Instant calculations appear under the same conditions as main form
- [ ] Analytics/events fire (check console logs and network where applicable)
- [ ] Field changes publish `FIELD_CHANGED` events and conversion tracking (watch console)

#### B-1: Main Landing Page Conversion (Day 6)
**File**: `app/page.tsx`
**Critical**: This is the most visible page - test thoroughly after each step

##### PREPARATION (15 minutes)
- [ ] **Create safety backup**
  ```bash
  cp app/page.tsx app/page.backup.tsx
  git add app/page.backup.tsx
  git commit -m "backup: main page before Bloomberg conversion"
  ```
- [ ] **Verify dev server running**
  - Open `http://localhost:3000` or any other open ports in browser
  - Page should load correctly
  - Keep this tab open for testing

##### STEP 1: Remove old styling conflicts (30 minutes)
- [ ] **Open `app/page.tsx`**
- [ ] **Search for color classes to replace:**
  ```
  Find all: bg-blue, text-blue, border-blue
  Replace with: bg-gold, text-gold, border-gold

  Find all: bg-purple, text-purple, border-purple
  Replace with: bg-gold, text-gold, border-gold

  Find all: bg-primary, text-primary
  Replace with: bg-gold, text-ink
  ```
- [ ] **Save and check** - page should still load
- [ ] Run `npm run lint:brand` and fix any violations
- [ ] Restrict replacements to `components/` and `redesign/` only; do not modify 3rd-party CSS or chart themes

##### STEP 2: Convert Hero Component (45 minutes)
- [ ] **Find the Hero section** (usually first major component)
- [ ] **Replace background:**
  - Old: `bg-gradient-to-r from-blue-500 to-purple-600`
  - New: `bg-hero-gradient`
- [ ] **Update container:**
  - Old: `container mx-auto px-4`
  - New: `max-w-7xl mx-auto px-4 md:px-8`
- [ ] **Convert headings:**
  - Find: `text-5xl`, `text-6xl`
  - Replace: `text-4xl md:text-5xl font-light text-ink`
- [ ] **Convert buttons:**
  ```tsx
  // Primary button pattern
  className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]"

  // Secondary button pattern
  className="h-12 px-8 border border-fog text-charcoal hover:bg-mist"
  ```
- [ ] **Test after each change** - refresh browser

##### STEP 3: Convert Service Cards (30 minutes)
- [ ] **Find service/feature cards**
- [ ] **Update card wrapper:**
  ```tsx
  className="bg-white border border-fog p-6 hover:-translate-y-0.5 hover:shadow-md transition-all"
  ```
- [ ] **Update card headings:**
  ```tsx
  className="text-xl font-medium text-ink mb-2"
  ```
- [ ] **Update card text:**
  ```tsx
  className="text-base text-graphite"
  ```

##### STEP 4: Convert Contact Section (30 minutes)
- [ ] **Import headless controller** (if form exists):
  ```tsx
  import { useProgressiveFormController } from '@/hooks/useProgressiveFormController'
  ```
- [ ] **Update form inputs:**
  ```tsx
  className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full"
  ```
- [ ] **Update labels:**
  ```tsx
  className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block"
  ```
- [ ] When binding via RHF, also call controller change hook:
  ```tsx
  <Controller
    name="email"
    control={control}
    render={({ field }) => (
      <input
        {...field}
        onChange={(e) => { field.onChange(e); onFieldChange('email', e.target.value) }}
      />
    )}
  />
  ```

##### VERIFICATION CHECKLIST
- [ ] No blue/purple colors visible
- [ ] Gold accent only on CTAs
- [ ] All text readable (proper contrast)
- [ ] Buttons are 48px height
- [ ] Forms have gold focus states
- [ ] Page loads in < 2 seconds
- [ ] Brand lint passes: `npm run lint:brand`
- [ ] Search code for `purple` or `#7C3AED` → none in `components/` and `redesign/`

##### COMMON MISTAKES TO AVOID
⚠️ DON'T remove semantic HTML tags (header, main, section)
⚠️ DON'T delete accessibility attributes (aria-*, role)
⚠️ DON'T change component logic, only styling
⚠️ DON'T add rounded corners (no `rounded-*` classes)

##### STEP 5: Brand Compliance & Safe Rollout (45 minutes)

- [ ] Brand align Intelligent Mortgage form used on landing
  - [ ] Replace legacy/non-brand utilities in `components/forms/IntelligentMortgageForm.tsx`:
    ```diff
    - bg-blue-50, border-blue-200, bg-purple-50, border-purple-200
    + bg-mist, border-fog

    - gray-50, gray-200
    + fog, mist (backgrounds), fog (borders)

    - text-nn-grey-dark, text-nn-grey-medium
    + text-ink (primary), text-graphite or text-silver (secondary/labels)

    - bg-nn-gold, text-nn-gold
    + bg-gold (accent on CTAs only), text-ink for text; for highlighted numbers use `text-gradient-gold`

    - rounded-2xl, rounded-lg
    + remove (Bloomberg style: 0 radius; theme already sets 0 by default)

    - Misc focus styles
    + ensure inputs/selects use `focus:border-gold focus:outline-none`
    ```
  - [ ] Ensure inputs and primary/secondary buttons are 48px height: `h-12`
  - [ ] Keep gold accent usage to ~5% of UI; never use gold as body text color

- [ ] Add a safe rollout feature flag (env-controlled)
  - [ ] In `components/ContactSection.tsx`, default which form to show using an env flag:
    ```tsx
    // At top (client component)
    const defaultIntelligent = process.env.NEXT_PUBLIC_USE_INTELLIGENT_FORM !== 'false'
    const [useIntelligentForm, setUseIntelligentForm] = useState(defaultIntelligent)
    ```
  - [ ] Add to `.env.local.example`:
    ```env
    NEXT_PUBLIC_USE_INTELLIGENT_FORM=true
    ```
  - [ ] Staging strategy:
    - Set `NEXT_PUBLIC_USE_INTELLIGENT_FORM=false` on staging to temporarily show the simple contact form while refactoring `IntelligentMortgageForm`
    - Once brand refactor passes lint on staging, flip back to `true`

- [ ] QA both code paths (before flipping on production)
  - [ ] With `NEXT_PUBLIC_USE_INTELLIGENT_FORM=false` (simple form):
    - Inputs use: `h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full`
    - Labels use: `text-xs uppercase tracking-wider text-silver font-medium mb-2 block`
    - Submit button uses primary pattern `h-12 px-8 bg-gold text-ink ...`
  - [ ] With `NEXT_PUBLIC_USE_INTELLIGENT_FORM=true` (intelligent form):
    - No blue/purple/gray-utility classes present
    - No `nn-*` custom color tokens; use `ink/graphite/silver/fog/mist/gold`
    - No `rounded-*` classes
    - Brand lint passes

- [ ] Brand gates
  - [ ] Run: `npm run lint:brand` (must pass)
  - [ ] Search: `purple|bg-purple|text-purple|border-purple|#7C3AED` → none in `components/` and `redesign/`

- [ ] Rollback plan
  - [ ] To disable Intelligent form on landing instantly, set `NEXT_PUBLIC_USE_INTELLIGENT_FORM=false` and rebuild; the simple form remains brand-compliant

---

#### B-2: Dashboard Page Conversion (Day 6-7)
**File**: `app/dashboard/page.tsx`
**Critical**: Complex page with calculations - preserve all functionality

##### PREPARATION
- [ ] **Backup dashboard**
  ```bash
  cp app/dashboard/page.tsx app/dashboard/page.backup.tsx
  ```
- [ ] **Check existing functionality**
  - Navigate to `/dashboard`
  - Test calculator works
  - Note all interactive features

##### STEP 1: Layout Structure (30 minutes)
- [ ] **Update page wrapper:**
  ```tsx
  <div className="min-h-screen bg-white">
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
  ```
- [ ] **Convert sidebar (if exists):**
  ```tsx
  className="w-64 bg-white border-r border-fog h-full"
  ```
- [ ] **Main content area:**
  ```tsx
  className="flex-1 bg-white"
  ```

##### STEP 2: Calculator Form Integration (1 hour)
- [ ] **Check if using ProgressiveForm**
  - If yes: Already uses headless controller ✓
  - If no: Continue with manual conversion
- [ ] **Update form container:**
  ```tsx
  className="bg-white border border-fog p-6"
  ```
- [ ] **Convert number inputs:**
  ```tsx
  <input
    type="number"
    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
    // Keep all onChange, value props unchanged
  />
  ```
- [ ] **Update calculate button:**
  ```tsx
  className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] w-full"
  ```

##### STEP 3: Results Display (45 minutes)
- [ ] **Metric cards pattern:**
  ```tsx
  <div className="bg-white border border-fog p-6">
    <div className="text-xs text-silver uppercase tracking-wider mb-2">
      {label}
    </div>
    <div className="text-2xl font-mono font-medium text-ink">
      ${value.toLocaleString()}
    </div>
  </div>
  ```
- [ ] **Important metrics with gradient:**
  ```tsx
  <div className="text-3xl font-mono font-medium text-gradient-gold">
    ${savings.toLocaleString()}
  </div>
  ```
- [ ] **Charts/graphs:**
  - Keep existing chart libraries. Prefer brand tokens over hex.
    ```ts
    // Prefer reading CSS variables for chart colors
    const styles = getComputedStyle(document.documentElement)
    const gold = styles.getPropertyValue('--nn-gold').trim()
    const ink = styles.getPropertyValue('--nn-ink').trim()
    const graphite = styles.getPropertyValue('--nn-graphite').trim()
    const silver = styles.getPropertyValue('--nn-silver').trim()
    const colors = [gold, ink, graphite, silver]
    ```
  - If a library strictly requires hex, document it and add a linter whitelist for that file with a comment.

##### STEP 4: Loading States (15 minutes)
- [ ] **Skeleton loader pattern:**
  ```tsx
  <div className="animate-pulse">
    <div className="h-12 bg-fog mb-4"></div>
    <div className="h-8 bg-fog w-3/4"></div>
  </div>
  ```

##### TESTING CHECKLIST
- [ ] Calculator still calculates correctly
- [ ] All inputs accept values
- [ ] Results update dynamically
- [ ] Charts display properly
- [ ] No JavaScript errors in console
- [ ] Brand lint passes: `npm run lint:brand`

---

#### B-3: Component Library Update (Day 7)
**Critical**: Update shared components used across entire site

##### PREPARATION
- [ ] **List all components in use:**
  ```bash
  ls components/
  ```
- [ ] **Create component backup:**
  ```bash
  cp -r components components.backup
  ```

##### STEP 1: Navigation Component (45 minutes)
**File**: `components/Navigation.tsx` or in `app/layout.tsx`

  - [ ] **Update nav wrapper:**
  ```tsx
  <nav className="fixed top-0 w-full h-12 bg-white border-b border-fog z-50">
    <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
  ```
- [ ] **Logo area:**
  ```tsx
  className="flex items-center gap-2"
  ```
- [ ] **Nav links:**
  ```tsx
  className="text-sm font-medium text-charcoal hover:text-gold transition-colors"
  ```
- [ ] **Mobile menu button (if exists):**
  ```tsx
  className="h-10 w-10 flex items-center justify-center text-charcoal hover:bg-mist md:hidden"
  ```

##### STEP 2: Button Component Update (30 minutes)
**File**: `components/ui/button.tsx`

- [ ] **Update button variants:**
  ```tsx
  const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-gold text-ink hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]",
          destructive: "bg-ruby text-white hover:bg-ruby/90",
          outline: "border border-fog bg-white hover:bg-mist text-charcoal",
          secondary: "bg-mist text-charcoal hover:bg-fog",
          ghost: "hover:bg-mist text-charcoal",
          link: "text-gold underline-offset-4 hover:underline",
        },
        size: {
          default: "h-12 px-8",
          sm: "h-10 px-6 text-xs",
          lg: "h-14 px-10",
          icon: "h-12 w-12",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  )
  ```

##### STEP 3: Input Component Update (30 minutes)
**File**: `components/ui/input.tsx`

- [ ] **Update input base class:**
  ```tsx
  const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
      return (
        <input
          type={type}
          className={cn(
            "flex h-12 w-full border border-fog bg-white px-4 text-base text-ink",
            "placeholder:text-silver",
            "focus:border-gold focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }
  )
  ```

##### STEP 4: Card Component Update (20 minutes)
**File**: `components/ui/card.tsx`

- [ ] **Update card classes:**
  ```tsx
  const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-fog p-6",
          "hover:-translate-y-0.5 hover:shadow-md transition-all",
          className
        )}
        {...props}
      />
    )
  )
  ```

##### VERIFICATION
- [ ] Test each component in isolation
- [ ] Check component usage across pages
- [ ] Verify no style conflicts

---

#### B-4: Form System Integration (Day 7-8)
**Critical**: Ensure all forms use headless controller

##### STEP 1: Identify All Forms (30 minutes)
- [ ] **Search for forms:**
  ```bash
  grep -r "<form" app/ components/ --include="*.tsx"
  ```
- [ ] **List forms found:**
  - [ ] Contact form: `___________`
  - [ ] Lead form: `___________`
  - [ ] Calculator form: `___________`
  - [ ] Other: `___________`

##### STEP 2: Convert Each Form (1 hour per form)
For each form identified:

- [ ] **Import controller:**
  ```tsx
  import { useProgressiveFormController } from '@/hooks/useProgressiveFormController'
  ```
- [ ] **Initialize controller:**
  ```tsx
  const controller = useProgressiveFormController({
    loanType: 'new_purchase', // or appropriate type
    sessionId: `session-${Date.now()}`,
    onFormComplete: (data) => {
      // Handle form submission
    }
  })
  ```
- [ ] **Bind form fields:**
  ```tsx
  <input {...controller.register('fieldName')} />
  ```
- [ ] **Handle submission:**
  ```tsx
  <form onSubmit={controller.handleSubmit(onSubmit)}>
  ```

##### STEP 3: Test Form Functionality
- [ ] All fields accept input
- [ ] Validation works
- [ ] Submission processes correctly
- [ ] Error messages display

---

#### B-5: Performance Optimization (Day 8)

##### STEP 1: Remove Unused CSS (30 minutes)
- [ ] **Check for old CSS imports:**
  ```bash
  grep -r "import.*\.css" app/ components/ --include="*.tsx"
  ```
- [ ] **Remove unused CSS files:**
  - Keep only: `globals.css`
  - Delete old theme CSS files
  - Delete component-specific CSS

##### STEP 2: Bundle Analysis (30 minutes)
- [ ] **Install analyzer (if not present):**
  ```bash
  npm i -D @next/bundle-analyzer
  ```
- [ ] **Run analysis:**
  ```bash
  ANALYZE=true npm run build
  ```
- [ ] **Check results:**
  - CSS should be < 15KB
  - No duplicate Tailwind utilities

##### STEP 3: Font Optimization Check (15 minutes)
- [ ] **Verify font loading in `app/layout.tsx`:**
  - Using `next/font`
  - Has `display: 'swap'`
  - Variable assigned to HTML

##### STEP 4: Image Optimization (30 minutes)
- [ ] **Convert img to Next/Image:**
  ```tsx
  import Image from 'next/image'

  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    className="..."
  />
  ```

---

### Phase C: Cleanup & Verification (Day 9)

#### C-1: Code Cleanup
- [ ] **Remove backup files:**
  ```bash
  rm app/page.backup.tsx
  rm app/dashboard/page.backup.tsx
  rm -rf components.backup
  ```
- [ ] **Remove old CSS:**
  ```bash
  # List CSS files first (don't delete globals.css!)
  find . -name "*.css" -not -name "globals.css"
  ```
- [ ] **Remove unused dependencies:**
  ```bash
  npm prune
  ```

#### C-2: Final Testing Checklist
- [ ] **Visual consistency:**
  - [ ] No purple/blue colors
  - [ ] Gold used sparingly (5%)
  - [ ] Consistent spacing (8px grid)
  - [ ] No rounded corners
  - [ ] All buttons 48px height

- [ ] **Functionality:**
  - [ ] All forms submit correctly
  - [ ] Calculations work
  - [ ] Navigation works
  - [ ] Mobile responsive
  - [ ] No console errors

- [ ] **Performance:**
  - [ ] Lighthouse score > 90
  - [ ] Load time < 2 seconds
  - [ ] CSS bundle < 15KB
  - [ ] Fonts load without blocking

#### C-3: Documentation
- [ ] **Update README:**
  - Note design system change
  - Update color palette docs
  - Update component usage
- [ ] **Create migration notes:**
  - List all changed files
  - Note any breaking changes
  - Document new patterns

---

### Phase D: Production Deployment (Day 10)

#### D-1: Pre-deployment Checks
- [ ] **Run full test suite:**
  ```bash
  npm run build
  npm run lint
  ```
- [ ] **Check environment variables:**
  - All API keys present
  - Correct production URLs

#### D-2: Deployment
- [ ] **Create production build:**
  ```bash
  npm run build
  ```
- [ ] **Test production build locally:**
  ```bash
  npm run start
  ```
- [ ] **Deploy to staging first**
- [ ] **Test on staging**
- [ ] **Deploy to production**

#### D-2.5: API Smoke Tests (staging and production)
- [ ] Health: `GET /api/health/chat-integration` returns 200
- [ ] AI analysis: `POST /api/forms/analyze` with a minimal valid payload returns 2xx JSON
- [ ] Chatwoot: `POST /api/chatwoot-conversation` returns conversation URL and ID
- [ ] Observe logs for errors/timeouts

#### D-3: Post-deployment Monitoring
- [ ] Check all pages load
- [ ] Test forms submit
- [ ] Monitor error logs
- [ ] Check performance metrics

---

## 📞 Need Help?

- Check `redesign/design-principles-guide.md` for design rules
- Look at `components/bloomberg-example.tsx` for patterns
- Review `sophisticated-flow/page.tsx` for reference implementation

Remember: The goal is **minimal, fast, and trustworthy** - like Bloomberg Terminal!

---

*Implementation based on Bloomberg Terminal × Spotify × Swiss Spa design philosophy*