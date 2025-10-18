---
title: homepage-implementation-tasks
status: in-progress
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# Homepage Implementation Tasks - Junior Developer Guide

## 🎯 Pre-Implementation Setup
```bash
# 1. Ensure you're in the project directory
cd C:\Users\HomePC\Desktop\Code\NextNest

# 2. Create a new branch for your work
git checkout -b homepage-bloomberg-design

# 3. Start the development server
npm run dev

# 4. Open browser tabs for comparison:
# - Current: http://localhost:3000
# - Target design: http://localhost:3000/redesign/sophisticated-flow
```

## 📝 Task 1: Create AnimatedCounter Component
**Time: 10 minutes** | **Difficulty: Easy** | **File: NEW**

### Step 1: Create the file
Create new file: `components/AnimatedCounter.tsx`

### Step 2: Copy this EXACT code (don't modify):
```typescript
'use client'

import React from 'react'

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}

export default function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let startTime: number | undefined
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return (
    <span className="font-mono">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}
```

### Step 3: Verify
- Save file
- Check terminal - no red errors should appear
- Component is ready to use

## 📝 Task 2: Fix Navigation Height
**Time: 5 minutes** | **Difficulty: Easy** | **File: components/ConditionalNav.tsx**

### Find this line (line ~18):
```tsx
<nav className="fixed top-0 w-full h-12 bg-white border-b border-fog z-50">
```

### Replace with:
```tsx
<nav className="fixed top-0 w-full h-16 bg-white border-b border-fog z-50">
```

### Also update (line ~28 in app/layout.tsx):
```tsx
<main className="pt-12">  <!-- Find this -->
```
```tsx
<main className="pt-16">  <!-- Change to this -->
```

### Verify:
- Navigation should be taller (64px instead of 48px)
- Content shouldn't hide under navbar

## 📝 Task 3: Create StatsSection Component
**Time: 10 minutes** | **Difficulty: Easy** | **File: NEW + EDIT**

### Step 1: Create new file
Create: `components/StatsSection.tsx`

### Step 2: Copy this complete code:
```typescript
'use client'

import AnimatedCounter from './AnimatedCounter'

export default function StatsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Package Analysis */}
          <div className="text-center">
            <div className="mb-1">
              <span className="font-mono text-3xl font-medium text-gradient-gold">
                <AnimatedCounter end={286} duration={2000} />
              </span>
            </div>
            <div className="text-sm font-medium text-graphite">Packages</div>
            <div className="text-xs text-silver">Analyzed Daily</div>
          </div>

          {/* Average Savings */}
          <div className="text-center">
            <div className="mb-1">
              <span className="font-mono text-3xl font-medium text-gradient-gold">
                <AnimatedCounter end={34560} duration={2000} prefix="$" />
              </span>
            </div>
            <div className="text-sm font-medium text-graphite">Average Savings</div>
            <div className="text-xs text-silver">Per Customer</div>
          </div>

          {/* Response Time */}
          <div className="text-center">
            <div className="mb-1">
              <span className="font-mono text-3xl font-medium text-gradient-gold">
                <AnimatedCounter end={24} duration={2000} />
              </span>
            </div>
            <div className="text-sm font-medium text-graphite">Hour Response</div>
            <div className="text-xs text-silver">Guaranteed</div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

### Step 3: Update app/page.tsx
Open `app/page.tsx` and:

1. **DELETE** lines 5-29 (the entire StatsSection function):
```typescript
// DELETE THIS ENTIRE BLOCK:
const StatsSection = () => {
  return (
    <section className="bg-white border-y-2 border-fog py-12">
      // ... all content ...
    </section>
  )
}
```

2. **ADD** this import at top (line ~3):
```typescript
import StatsSection from '@/components/StatsSection'
```

### Verify:
- Stats should animate on load
- Gold gradient text for numbers
- Clean design without borders

## 📝 Task 4: Update HeroSection with Animations
**Time: 15 minutes** | **Difficulty: Medium** | **File: components/HeroSection.tsx**

### Step 1: Add client directive and import
At the VERY TOP of the file, add:
```typescript
'use client'

import AnimatedCounter from './AnimatedCounter'
import { Clock, Users, Star } from './icons'
```

### Step 2: Replace the metric card section
Find the comment `{/* Right Metric Card */}` (around line 40).
Replace EVERYTHING from line 40 to line 95 with:

```tsx
{/* Right Metric Card */}
<div className="lg:pl-10">
  <div className="relative w-full max-w-md mx-auto">
    <div className="bg-white border border-fog p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs text-silver uppercase tracking-wider font-medium">
          LIVE ANALYSIS
        </h3>
        <span className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">
          Real-time
        </span>
      </div>

      <div className="grid gap-3">
        {/* Current Rate */}
        <div className="p-2 bg-mist">
          <div className="text-xs text-silver mb-1">Current Rate</div>
          <div className="font-mono text-2xl font-medium text-ink">
            <AnimatedCounter end={2.6} suffix="%" duration={1000} />
          </div>
        </div>

        {/* Optimal Rate */}
        <div className="p-2 bg-mist">
          <div className="text-xs text-silver mb-1">Optimal Rate</div>
          <div className="font-mono text-2xl font-medium text-gold">
            <AnimatedCounter end={1.4} suffix="%" duration={1500} />
          </div>
        </div>

        {/* Monthly Savings */}
        <div className="p-2 bg-mist">
          <div className="text-xs text-silver mb-1">Monthly Savings</div>
          <div className="font-mono text-2xl font-medium text-ink">
            <AnimatedCounter end={480} prefix="$" duration={2000} />
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <div className="text-xs text-silver mb-1">LIFETIME SAVINGS</div>
        <div className="font-mono text-3xl font-medium text-gradient-gold">
          $<AnimatedCounter end={34560} duration={2500} />
        </div>
      </div>
    </div>
  </div>
</div>
```

### Verify:
- Metric card animates on load
- "LIVE ANALYSIS" badge appears
- Optimal rate shows in gold color

## 📝 Task 5: Add Tabs to ServicesSection
**Time: 20 minutes** | **Difficulty: Medium** | **File: components/ServicesSection.tsx**

### Step 1: Make it a client component
Add at the VERY TOP of the file:
```typescript
'use client'

import { useState } from 'react'
import { CheckCircle, Shield, TrendingUp } from './icons'
```

### Step 2: Replace the ENTIRE component
Replace ALL content in the file with:

```typescript
'use client'

import { useState } from 'react'
import { CheckCircle, Shield, TrendingUp } from './icons'

const ServicesSection = () => {
  const [activeTab, setActiveTab] = useState('savings')

  return (
    <section id="services" className="py-16 bg-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl font-light text-ink text-center mb-2">
          Intelligent Solutions
        </h2>
        <p className="text-base text-graphite text-center mb-12">
          Choose how we can help optimize your mortgage
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            className={`h-12 px-6 text-sm font-medium flex items-center ${
              activeTab === 'savings' ? 'bg-gold text-ink' : 'bg-white text-charcoal border border-fog hover:bg-mist'
            }`}
            onClick={() => setActiveTab('savings')}
          >
            Savings
          </button>
          <button
            className={`h-12 px-6 text-sm font-medium flex items-center ${
              activeTab === 'analysis' ? 'bg-gold text-ink' : 'bg-white text-charcoal border border-fog hover:bg-mist'
            }`}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button
            className={`h-12 px-6 text-sm font-medium flex items-center ${
              activeTab === 'timeline' ? 'bg-gold text-ink' : 'bg-white text-charcoal border border-fog hover:bg-mist'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === 'savings' && (
            <div className="bg-white border border-fog p-6">
              <h3 className="text-xl font-medium text-ink mb-2">Maximum Savings Strategy</h3>
              <p className="text-base text-graphite mb-6">
                Our AI analyzes all 286 packages to find your optimal rate,
                considering repricing penalties, lock-in periods, and long-term costs.
              </p>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">
                  Save up to 40%
                </div>
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite">
                  Real-time rates
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bg-white border border-fog p-6">
              <h3 className="text-xl font-medium text-ink mb-2">Complete Market Analysis</h3>
              <p className="text-graphite mb-6">
                Get a comprehensive view of every option available, including
                staying with your current bank, repricing, or refinancing.
              </p>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite">
                  286 packages
                </div>
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-gold/10 text-gold">
                  Updated daily
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-white border border-fog p-6">
              <h3 className="text-xl font-medium text-ink mb-2">Perfect Timing Optimization</h3>
              <p className="text-graphite mb-6">
                Know exactly when to make your move based on lock-in periods,
                market conditions, and rate predictions.
              </p>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">
                  24h response
                </div>
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite">
                  AI predictions
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Section - Keep existing */}
        <div className="mt-16 bg-mist border border-fog p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-light text-ink mb-4">
                Bank‑Agnostic, Math‑First Advice
              </h3>
              <p className="text-graphite mb-6">
                Our engine scans 286 packages and models repricing, refinancing, or staying put—then ranks what maximizes your long‑term savings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/apply?loanType=refinance"
                  className="btn-primary flex items-center justify-center"
                >
                  See ALL Your Options →
                </a>
                <a
                  href="/apply?loanType=new_purchase&debug=1"
                  className="btn-secondary flex items-center justify-center self-start sm:self-auto"
                >
                  Try Calculator
                </a>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="inline-block bg-white border border-fog p-6 shadow-sm">
                <div className="text-3xl font-mono font-medium text-gradient-gold mb-2">$34,560</div>
                <div className="text-xs text-silver uppercase tracking-wider">Average Savings Per Customer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection
```

### Verify:
- Tabs switch content when clicked
- Active tab has gold background
- Content changes based on selection

## New Sections (15 minutes each)

## 📝 Task 6: Create FeatureCards Component
**Time: 10 minutes** | **Difficulty: Easy** | **File: NEW**

### Step 1: Create new file
Create: `components/FeatureCards.tsx`

### Step 2: Copy this complete code:
```typescript
export default function FeatureCards() {
  const features = [
    {
      title: 'Real-time Analysis',
      description: 'Market data updated every 15 minutes from 23 banks',
      metric: '99.9%',
      metricLabel: 'Accuracy'
    },
    {
      title: 'Complete Transparency',
      description: 'See all options including staying with your current bank',
      metric: '100%',
      metricLabel: 'Coverage'
    },
    {
      title: 'AI-Powered Insights',
      description: 'GPT-4 analyzes your unique situation for optimal timing',
      metric: '<3s',
      metricLabel: 'Processing'
    },
    {
      title: 'Lifetime Partnership',
      description: 'Continuous monitoring and optimization throughout your loan',
      metric: '4.9/5',
      metricLabel: 'Rating'
    }
  ]

  return (
    <section className="py-16 bg-mist">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-ink mb-2">
              Why Intelligence Matters
            </h2>
            <p className="text-base text-graphite">
              Our AI analyzes market conditions 24/7 to find your perfect moment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-fog p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-ink mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-graphite">
                      {feature.description}
                    </p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className="font-mono text-lg font-medium text-gold">
                      {feature.metric}
                    </div>
                    <div className="text-xs text-silver">
                      {feature.metricLabel}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

### Verify:
- 4 feature cards in a 2x2 grid
- Metrics show in gold on the right
- Cards lift slightly on hover

## 📝 Task 7: Create CTASection Component
**Time: 5 minutes** | **Difficulty: Easy** | **File: NEW**

### Step 1: Create new file
Create: `components/CTASection.tsx`

### Step 2: Copy this complete code:
```typescript
export default function CTASection() {
  return (
    <section className="py-16 bg-white border-t border-fog">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-2xl font-light text-ink mb-2">
          Ready to optimize?
        </h2>
        <p className="text-base text-graphite mb-8">
          Join thousands who've saved with intelligent mortgage analysis
        </p>
        <a
          href="/apply?loanType=new_purchase"
          className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center transition-all duration-200"
        >
          Get Your Free Analysis →
        </a>
      </div>
    </section>
  )
}
```

### Verify:
- Clean centered CTA section
- Gold button with hover effect
- Links to /apply page

## 📝 Task 8: Create Footer Component
**Time: 5 minutes** | **Difficulty: Easy** | **File: NEW**

### Step 1: Create new file
Create: `components/Footer.tsx`

### Step 2: Copy this complete code:
```typescript
export default function Footer() {
  return (
    <footer className="bg-white border-t border-fog py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-graphite">
            © 2024 NextNest. Singapore's most transparent mortgage advisor.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

### Verify:
- Minimal footer with copyright
- Privacy and Terms links
- Matches Bloomberg aesthetic

## 📝 Task 9: Add Loan Type Selector Section
**Time: 10 minutes** | **Difficulty: Easy** | **File: NEW**

### Step 1: Create Bloomberg-style LoanTypeSection
Create new file: `components/LoanTypeSection.tsx`

### Step 2: Copy this complete code:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoanTypeSection() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSelect = (type: string) => {
    setSelectedType(type)
    setIsLoading(true)

    // Navigate after brief animation
    setTimeout(() => {
      router.push(`/apply?loanType=${type}`)
    }, 500)
  }

  const loanTypes = [
    {
      id: 'new_purchase',
      title: 'New Purchase',
      description: 'First-time or upgrading',
      metric: '1.35%',
      metricLabel: 'From'
    },
    {
      id: 'refinance',
      title: 'Refinancing',
      description: 'Switch to better rates',
      metric: '$480',
      metricLabel: 'Save/month'
    },
    {
      id: 'commercial',
      title: 'Commercial',
      description: 'Business properties',
      metric: '2.1%',
      metricLabel: 'From'
    }
  ]

  return (
    <section className="py-16 bg-white border-t border-fog">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-ink mb-2">
            What brings you here today?
          </h2>
          <p className="text-base text-graphite">
            Choose your path for personalized analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {loanTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              disabled={isLoading}
              className={`
                relative p-6 bg-white border transition-all duration-200
                ${selectedType === type.id
                  ? 'border-gold bg-gold/5 shadow-md scale-[1.02]'
                  : 'border-fog hover:border-gold/50 hover:shadow-sm hover:-translate-y-0.5'
                }
                ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              `}
            >
              {/* Top metric */}
              <div className="text-right mb-4">
                <div className="font-mono text-2xl font-medium text-gold">
                  {type.metric}
                </div>
                <div className="text-xs text-silver uppercase tracking-wider">
                  {type.metricLabel}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-medium text-ink mb-1 text-left">
                {type.title}
              </h3>
              <p className="text-sm text-graphite text-left">
                {type.description}
              </p>

              {/* Selection indicator */}
              {selectedType === type.id && (
                <div className="absolute top-3 left-3 w-2 h-2 bg-gold"></div>
              )}
            </button>
          ))}
        </div>

        {/* Alternative: Direct text links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-silver">
            Already know what you need?{' '}
            <a
              href="/apply?loanType=new_purchase"
              className="text-charcoal hover:text-gold transition-colors duration-200 font-medium"
            >
              Skip to application →
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
```

### Step 3: Verify
- Three loan type cards in a row
- Gold highlight on selection
- Redirects to `/apply?loanType=X` when clicked
- Bloomberg-style minimal design

## 📝 Task 10: Final Assembly - Update Main Page
**Time: 5 minutes** | **Difficulty: Easy** | **File: app/page.tsx**

### Step 1: Update imports
Replace ALL imports at the top of `app/page.tsx` with:

```typescript
import HeroSection from '@/components/HeroSection'
import StatsSection from '@/components/StatsSection'
import FeatureCards from '@/components/FeatureCards'
import ServicesSection from '@/components/ServicesSection'
import LoanTypeSection from '@/components/LoanTypeSection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'
```

### Step 2: Update the page component
Replace the entire `export default function Home()` function with:

```typescript
export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeatureCards />
      <ServicesSection />
      <LoanTypeSection />  {/* NEW: Loan type selector */}
      <CTASection />
      <Footer />
    </>
  )
}
```

### IMPORTANT: Component Order
The LoanTypeSection goes AFTER ServicesSection but BEFORE CTASection. This creates a natural flow:
1. Hero → 2. Stats → 3. Features → 4. Services → **5. Choose Loan Type** → 6. CTA → 7. Footer

### Verify:
- Page shows all 7 sections in correct order
- Loan type selector appears after Services
- Clicking loan type redirects to `/apply?loanType=X`
- No TypeScript errors

## ✅ Testing & Verification

### Step-by-Step Testing
1. **Save all files**
2. **Check terminal** - Fix any red errors
3. **Refresh browser** - Hard refresh with `Ctrl+Shift+R`
4. **Compare designs**:
   - Open `http://localhost:3000` (your work)
   - Open `http://localhost:3000/redesign/sophisticated-flow` (target)
   - They should look nearly identical

### Interactive Elements Checklist
- [ ] Numbers animate when page loads
- [ ] Service tabs switch content when clicked
- [ ] Cards lift slightly on hover
- [ ] Buttons scale on hover/click
- [ ] All links work correctly

### Visual Checklist
- [ ] Navigation is 64px tall (taller than before)
- [ ] Hero has animated metric card on right
- [ ] Stats section shows 3 animated numbers
- [ ] Feature cards in 2x2 grid with gold metrics
- [ ] Services has 3 clickable tabs
- [ ] **NEW: Loan Type selector with 3 cards**
- [ ] Clean CTA section (no form)
- [ ] Minimal footer at bottom

### Code Quality Check
```bash
# Run these commands:
npm run lint        # Should have no errors
npm run build       # Should build successfully
```

## 🐛 Troubleshooting Guide

### Common Errors & Solutions

#### "Module not found" Error
**Error**: `Cannot find module './AnimatedCounter'`
**Solution**:
- Check file is saved: `components/AnimatedCounter.tsx`
- Filename is case-sensitive!
- Restart server: `Ctrl+C` then `npm run dev`

#### Animations Not Working
**Problem**: Numbers don't animate
**Solution**:
- Ensure `'use client'` is at TOP of file
- Check AnimatedCounter is imported
- Hard refresh browser: `Ctrl+Shift+R`

#### Tabs Not Switching
**Problem**: Clicking tabs does nothing
**Solution**:
- ServicesSection must have `'use client'` at top
- Check `useState` is imported from 'react'
- Verify onClick handlers in button elements

#### Styles Look Wrong
**Problem**: Design doesn't match target
**Solution**:
- Copy code exactly as shown
- Don't modify class names
- Check Tailwind config hasn't changed

#### TypeScript Errors
**Error**: Red underlines in VS Code
**Solution**:
- Save all files
- Restart TypeScript server: `Ctrl+Shift+P` > "Restart TS Server"
- Check imports are correct

### Emergency Rollback
If everything breaks:
```bash
# Option 1: Undo all changes
git stash
git checkout main
npm run dev

# Option 2: Undo specific file
git checkout -- components/HeroSection.tsx

# Option 3: Start fresh
git reset --hard HEAD
```

## 🎉 Success Criteria

### You're done when:
1. **No errors** in terminal
2. **Page matches** sophisticated-flow design
3. **All animations** work smoothly
4. **Tabs switch** content properly
5. **Loan type cards** redirect to `/apply?loanType=X`
6. **Build succeeds**: `npm run build`

### Final Git Commit
```bash
# Check your changes
git status

# Add all files
git add .

# Commit with message
git commit -m "feat: implement Bloomberg Terminal design for homepage

- Added AnimatedCounter component
- Updated navigation to 64px height
- Enhanced HeroSection with animations
- Added tabs to ServicesSection
- Created FeatureCards section
- Added LoanTypeSection for loan selection
- Replaced ContactSection with CTA
- Added minimal footer"

# Push to your branch
git push origin homepage-bloomberg-design
```

## 📝 Summary

You've successfully transformed the homepage to match the sophisticated Bloomberg Terminal design by:

1. Creating reusable `AnimatedCounter` component
2. Fixing navigation height to 64px
3. Adding animations to HeroSection
4. Extracting StatsSection with animated metrics
5. Adding tab navigation to Services
6. Creating FeatureCards section
7. **Adding LoanTypeSection for loan selection** (NEW)
8. Replacing ContactSection with clean CTA
9. Adding minimal footer

The homepage now has the same professional, data-focused aesthetic as the target design, with proper loan type selection before users proceed to the application!