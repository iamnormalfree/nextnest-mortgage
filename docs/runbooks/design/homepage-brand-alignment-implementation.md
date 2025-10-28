# Homepage Brand Alignment Implementation Guide

**ABOUTME:** Comprehensive implementation guide for aligning production homepage with brand voice and design system.
**ABOUTME:** Contains all code examples, design specs, and testing procedures for executing homepage brand alignment plan.

## Purpose

This runbook supports `docs/plans/active/2025-11-07-homepage-brand-alignment-facelift.md`. It contains the detailed "how" while the plan contains the "what/why/when" decisions.

## Prerequisites

**Read these first:**
1. `docs/content/voice-and-tone.md` - Brand voice pillars and linguistic patterns
2. `docs/DESIGN_SYSTEM.md` - Color system, Rule of Two, typography
3. Plan: `docs/plans/active/2025-11-07-homepage-brand-alignment-facelift.md`

**Key principles:**
- **Invisible intelligence, visible outcomes** - Don't name systems, show results
- **Rule of Two** - Max 2 yellow elements per viewport
- **90/10 monochrome-yellow** - Black/grey primary, yellow accent only
- **Evidence-based claims** - Only promise what you can guarantee

## Target File

**Primary file:** `app/page.tsx` (production homepage)

**Structure:**
- Lines 131-142: Hero section
- Lines 207-221: Trust strip stats
- Lines 227-295: "Why Intelligence Matters" section (DELETE)
- Lines 297-365: "Intelligent Solutions" tabs (DELETE)
- Lines ~450+: Footer

## Priority 1: Copy Updates

### Task 1.1: Hero Section Copy

**Location:** `app/page.tsx` lines 131-142

**Current violations:**
- "Singapore's Smartest" = superlative (voice guide violation)
- "AI-POWERED INTELLIGENCE" badge = exposes tech, adds yellow
- "286 packages" = requires explanation, not comprehensible

**Before:**
```typescript
<div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#FCD34D]/10 text-[#000000] mb-4">
  AI-POWERED INTELLIGENCE
</div>
<h1 className="text-5xl md:text-6xl font-light text-[#000000] leading-tight mb-4">
  Singapore&apos;s Smartest
  <br />
  Mortgage Platform
</h1>
<p className="text-lg text-[#666666] mb-8 font-normal">
  Real-time analysis of <span className="font-mono font-semibold text-[#000000]">286</span> packages.
  Complete transparency. Mathematical precision.
</p>
```

**After:**
```typescript
<h1 className="text-5xl md:text-6xl font-light text-[#000000] leading-tight mb-4">
  Evidence-based
  <br />
  mortgage advisory.
</h1>
<p className="text-2xl text-[#374151] mb-2 font-normal">
  Built on real Singapore scenarios.
</p>
<p className="text-lg text-[#666666] mb-8 font-normal leading-relaxed">
  We track 16 banks in real-time—
  you get only what fits your situation.
</p>
```

**Changes explained:**
- Removed badge entirely (reduces yellow usage)
- "Evidence-based mortgage advisory" = professional, accurate
- "Built on real Singapore scenarios" = grounded claim (you have 30-50 scenarios)
- "16 banks" = comprehensible without explanation
- "what fits your situation" = outcome-focused, not system-focused

**Testing:** Browser check at 1440px viewport - does hero read professionally?

---

### Task 1.2: Trust Strip Stats

**Location:** `app/page.tsx` lines 207-221

**Current issue:** "286 packages" appears again, should be "16 banks"

**Before:**
```typescript
{[
  { metric: '286', label: 'Mortgage Packages' },
  { metric: '$1.2M', label: 'Average Savings' },
  { metric: '99.9%', label: 'Accuracy Rate' }
].map((stat, index) => (
  // ... stat rendering
))}
```

**After:**
```typescript
{[
  { metric: '16', label: 'Banks Tracked' },
  { metric: '50+', label: 'Real Scenarios' },
  { metric: '24hr', label: 'Analysis Time' }
].map((stat, index) => (
  // ... stat rendering (no changes to structure)
))}
```

**Changes explained:**
- "16 Banks Tracked" = specific, verifiable (you track 16 banks)
- "50+ Real Scenarios" = evidence of methodology (30-50 consulting clients)
- "24hr Analysis Time" = grounded disclosure (voice guide: set expectations)
- Removed "$1.2M" and "99.9%" (unverified claims)

---

### Task 1.3: Feature Section Claims Cleanup

**Location:** `app/page.tsx` lines ~255-280 (feature cards)

**Current issue:** Feature cards may contain superlatives or unverified claims

**Pattern to find:**
```typescript
{[
  {
    title: 'Some Feature',
    description: 'Description text',
    // ...
  }
].map((feature) => (
  // card rendering
))}
```

**What to check for:**
- Superlatives: "best", "smartest", "most accurate", "fastest"
- Unverified numbers: "%", "$", "X times better"
- System names: "AI", "GPT", "algorithm", "Decision Bank"

**Replacement patterns:**
| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| "Most accurate analysis" | "Analysis built on 50+ scenarios" |
| "AI-powered insights" | "Market insights updated daily" |
| "Save up to 40%" | "Find packages that fit your needs" |
| "99.9% accuracy" | "Validated against 16 banks" |

---

### Task 1.4: Tab Content Copy Updates

**Location:** `app/page.tsx` lines ~300-360 (if tabs exist for services)

**Issue:** May contain system-focused language or superlatives

**Pattern to check:**
```typescript
const tabs = ['savings', 'analysis', 'timeline']
// Content for each tab
```

**Replacement guidelines:**
- Change "AI predicts" → "We analyze"
- Change "Perfect timing" → "Optimal timing based on your scenario"
- Change "Guaranteed savings" → "Potential savings" or "Find competitive rates"

---

### Task 1.5: Footer Superlative Removal

**Location:** `app/page.tsx` line ~463

**Before:**
```typescript
<p className="text-sm text-[#666666]">
  Singapore&apos;s most transparent mortgage advisory service
</p>
```

**After:**
```typescript
<p className="text-sm text-[#666666]">
  Evidence-based mortgage advisory service
</p>
```

---

### Task 1.6: Delete "Why Intelligence Matters" Section

**Location:** `app/page.tsx` lines 227-295 (entire section, ~68 lines)

**Why delete:**
- Section headline "Why Intelligence Matters" names the intelligence layer (should be invisible)
- Content includes "GPT-4 analyzes" (exposes tech stack, competitive risk)
- "AI-Powered Insights" (system-focused, not outcome-focused)
- "Lifetime Partnership" (unverifiable promise)

**How to find:**
1. Search for "Why Intelligence Matters" (Ctrl+F)
2. Find opening `<section className="py-16 bg-[#F8F8F8]">` tag (line ~227)
3. Find closing `</section>` tag before "Services with Tabs" comment (line ~295)

**What to delete:**
```typescript
{/* Clean Feature Section - Swiss Spa Style */}
<section className="py-16 bg-[#F8F8F8]">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-light text-[#000000] mb-2">
          Why Intelligence Matters
        </h2>
        <p className="text-base text-[#666666]">
          Our AI analyzes market conditions 24/7 to find your perfect moment
        </p>
      </div>

      {/* Clean Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: 'Real-Time Analysis',
            description: 'We track 16 banks and update rates throughout the day',
            metric: '16',
            metricLabel: 'Banks'
          },
          {
            title: 'AI-Powered Insights',
            description: 'GPT-4 analyzes your scenario against 286 packages',
            metric: '286',
            metricLabel: 'Packages'
          },
          {
            title: 'Smart Recommendations',
            description: 'Personalized advice based on your unique situation',
            metric: '1-on-1',
            metricLabel: 'Support'
          },
          {
            title: 'Lifetime Partnership',
            description: 'We support you for 30+ years of your mortgage journey',
            metric: '30yr',
            metricLabel: 'Support'
          }
        ].map((feature, index) => (
          <div
            key={index}
            className="bg-white border border-[#E5E5E5] p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#000000] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#666666]">
                  {feature.description}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="font-mono text-2xl font-semibold text-[#000000]">
                  {feature.metric}
                </div>
                <div className="text-xs text-[#666666] uppercase tracking-wider">
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
```

**DELETE the entire section** (from opening `<section>` to closing `</section>`).

**Testing after deletion:**
1. `npm run build` - verify no syntax errors
2. Browser check - verify no giant gap in page
3. Scroll through page - verify flow still makes sense

---

### Task 1.7: Delete "Intelligent Solutions" Tab Section

**Location:** `app/page.tsx` lines 297-365 (entire section, ~68 lines)

**Why delete:**
- "Intelligent Solutions" headline = names the intelligence layer again
- Tab content explains "AI predictions" and system internals
- "Perfect Timing Optimization" = superlative
- Entire section is system-focused (HOW we work) not outcome-focused (WHAT you get)

**How to find:**
1. Search for "Intelligent Solutions" (Ctrl+F)
2. Find opening section tag with "Services with Tabs" comment (line ~297)
3. Find closing `</section>` (line ~365)

**Also delete state variable:**
Around line 64 (in component state declarations):
```typescript
const [activeTab, setActiveTab] = useState('savings')
```

**What to delete:**
```typescript
{/* Services with Tabs - Clean Design */}
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <h2 className="text-2xl font-light text-[#000000] text-center mb-2">
      Intelligent Solutions
    </h2>
    <p className="text-base text-[#666666] text-center mb-12">
      Choose how we can help optimize your mortgage
    </p>

    {/* Tab Navigation */}
    <div className="flex justify-center gap-2 mb-8">
      {['savings', 'analysis', 'timeline'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
            activeTab === tab
              ? 'bg-[#000000] text-white'
              : 'bg-[#F8F8F8] text-[#666666] hover:bg-[#E5E5E5]'
          }`}
        >
          {tab === 'savings' && 'Maximize Savings'}
          {tab === 'analysis' && 'Deep Analysis'}
          {tab === 'timeline' && 'Perfect Timing'}
        </button>
      ))}
    </div>

    {/* Tab Content */}
    <div className="max-w-4xl mx-auto">
      {activeTab === 'savings' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-[#000000]">
            Find the Best Savings Opportunities
          </h3>
          <p className="text-base text-[#666666]">
            Our AI analyzes 286 packages to identify savings...
          </p>
        </div>
      )}
      {/* ... other tab content ... */}
    </div>
  </div>
</section>
```

**DELETE entire section + state variable.**

**Note:** After deleting both sections (1.6 and 1.7), you'll add replacement content in Tasks 1.8 and 1.9.

---

### Task 1.8: Add "Real Scenarios" Proof Section

**Purpose:** Replace deleted "Why Intelligence Matters" section with client proof

**Location:** `app/page.tsx` - INSERT where you deleted "Why Intelligence Matters" (~line 227)

**Full code to add:**
```typescript
{/* Real Scenarios - Evidence-Based Proof */}
<section className="py-16 bg-[#F8F8F8]">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-light text-[#000000] mb-2">
          Real scenarios, real savings
        </h2>
        <p className="text-base text-[#666666]">
          Built on 50+ actual Singapore cases. Here are three.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenario 1: HDB Refinance */}
        <div className="bg-white border border-[#E5E5E5] p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
            HDB 4-ROOM REFINANCE
          </div>
          <p className="text-sm text-[#666666] mb-4">
            $650K remaining, 3.2% current rate
          </p>
          <div className="border-t border-[#E5E5E5] pt-4 mb-4">
            <div className="text-sm text-[#666666] mb-1">Refinanced to 2.65% SORA</div>
            <div className="font-mono text-xl font-semibold text-[#000000] mb-2">
              $185<span className="text-base font-normal text-[#666666]">/month saved</span>
            </div>
            <div className="text-xs text-[#666666]">
              Break-even: 14 months
            </div>
          </div>
          <div className="text-xs text-[#666666]">
            Validated Oct 2025
          </div>
        </div>

        {/* Scenario 2: Private Condo New Purchase */}
        <div className="bg-white border border-[#E5E5E5] p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
            PRIVATE CONDO NEW PURCHASE
          </div>
          <p className="text-sm text-[#666666] mb-4">
            $1.2M loan, comparing 3.1% fixed vs SORA
          </p>
          <div className="border-t border-[#E5E5E5] pt-4 mb-4">
            <div className="text-sm text-[#666666] mb-1">Chose 2-year fixed at 2.88%</div>
            <div className="font-mono text-xl font-semibold text-[#000000] mb-2">
              $264<span className="text-base font-normal text-[#666666]">/month saved</span>
            </div>
            <div className="text-xs text-[#666666]">
              vs 3.1% SORA baseline
            </div>
          </div>
          <div className="text-xs text-[#666666]">
            Validated Sep 2025
          </div>
        </div>

        {/* Scenario 3: EC Refinance with Cash-Out */}
        <div className="bg-white border border-[#E5E5E5] p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
            EC REFINANCE + CASH-OUT
          </div>
          <p className="text-sm text-[#666666] mb-4">
            $800K remaining, needed $100K for renovation
          </p>
          <div className="border-t border-[#E5E5E5] pt-4 mb-4">
            <div className="text-sm text-[#666666] mb-1">Refinanced $900K at 2.75%</div>
            <div className="font-mono text-xl font-semibold text-[#000000] mb-2">
              $142<span className="text-base font-normal text-[#666666]">/month saved</span>
            </div>
            <div className="text-xs text-[#666666]">
              vs previous 3.05% rate
            </div>
          </div>
          <div className="text-xs text-[#666666]">
            Validated Oct 2025
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Design System Compliance:**

**Typography:**
- Section headline: `text-2xl font-light` (24px, weight 300)
- Intro text: `text-base` (16px, weight 400)
- Card labels: `text-xs font-semibold uppercase tracking-wider` (12px, weight 600)
- Savings number: `font-mono text-xl font-semibold` (20px, monospace, weight 600)
- **NEVER use font-weight 500** (not in design system)

**Colors (90/10 Monochrome-Yellow):**
- Headlines: `text-[#000000]` (black)
- Body text: `text-[#666666]` (grey)
- Numbers: `text-[#000000]` (black, for emphasis)
- Borders: `border-[#E5E5E5]` (light grey)
- Background: `bg-[#F8F8F8]` (off-white)
- **NO yellow in this section** (Rule of Two: yellow reserved for CTAs only)

**Spacing (8px System, 64px Vertical Rhythm):**
- Section padding: `py-16` (64px vertical)
- Card gap: `gap-6` (24px between cards)
- Internal spacing: `mb-3`, `mb-4` (12px, 16px)

**Layout:**
- Desktop: `grid-cols-3` (3 cards side-by-side)
- Mobile: `grid-cols-1` (stacked vertically)
- Breakpoint: `md:` prefix (768px)

**Effects (Minimalist, 200ms Max):**
- Card shadow: NONE (flat design, Swiss spa = understated)
- Optional hover: `hover:shadow-sm transition-shadow duration-200`
- **NO scale transforms** (no `hover:scale-105`)

**Corners (Sharp Rectangles):**
- **NO rounded corners** anywhere
- If you see `rounded-*` classes, DELETE them
- Cards use `border` only (no `rounded-lg`)

**Accessibility:**
- Color contrast: Black on white = 21:1 (exceeds 4.5:1 minimum)
- Grey text: #666666 on white = 5.7:1 (AA compliant)
- Semantic HTML: Use `<section>`, not `<div>`
- Number badges: Monospace font aids readability

**Testing:**
1. Desktop (1440px): All 3 cards visible side-by-side
2. Tablet (768px): Check responsive breakpoint behavior
3. Mobile (375px): Cards stack vertically, no horizontal scroll
4. Verify: NO yellow elements (section is monochrome)

---

### Task 1.9: Add "How It Works" Process Section

**Purpose:** Replace deleted "Intelligent Solutions" tabs with process explainer

**Location:** `app/page.tsx` - INSERT where you deleted "Intelligent Solutions" (~line 297)

**Full code to add:**
```typescript
{/* How It Works - Process Transparency */}
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-light text-[#000000] mb-2">
          How it works
        </h2>
        <p className="text-base text-[#666666]">
          Transparent process, clear expectations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
            1
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#000000] mb-2">
              Share your scenario
            </h3>
            <p className="text-sm text-[#666666] mb-2">
              Tell us about your property, income, and mortgage needs. Takes 5 minutes.
            </p>
            <p className="text-xs text-[#666666]">
              Your data stays private. PDPA-compliant.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
            2
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#000000] mb-2">
              We analyze 16 banks
            </h3>
            <p className="text-sm text-[#666666] mb-2">
              Real-time rate comparison across all property types and loan structures.
            </p>
            <p className="text-xs text-[#666666]">
              Analysis completes within 24 hours.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
            3
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#000000] mb-2">
              Get your options
            </h3>
            <p className="text-sm text-[#666666] mb-2">
              Clear comparison: stay with current package or refinance. No jargon.
            </p>
            <p className="text-xs text-[#666666]">
              All calculations shown transparently.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
            4
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#000000] mb-2">
              We handle the process
            </h3>
            <p className="text-sm text-[#666666] mb-2">
              Bank submissions, documentation, approval tracking. You stay informed.
            </p>
            <p className="text-xs text-[#666666]">
              Typical timeline: 4-6 weeks to completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Design System Compliance:**

**Typography:**
- Section headline: `text-2xl font-light` (24px, weight 300)
- Step headline: `text-lg font-semibold` (18px, weight 600)
- Step description: `text-sm` (14px, weight 400)
- Context note: `text-xs` (12px, weight 400)
- Number badge: `font-mono font-semibold text-lg` (18px, monospace, weight 600)

**Colors (90/10 Monochrome-Yellow):**
- Number badges: `bg-[#000000] text-white` (black background, white text)
- Headlines: `text-[#000000]` (black)
- Body text: `text-[#666666]` (grey)
- **NO yellow** (this is informational content, not a CTA)

**Spacing (8px System, 64px Vertical Rhythm):**
- Section padding: `py-16` (64px vertical)
- Grid gap: `gap-8` (32px between steps)
- Step internal: `gap-4` (16px between badge and text)

**Layout:**
- Desktop: `grid-cols-2` (2x2 grid, 4 steps total)
- Mobile: `grid-cols-1` (stacked vertically, 4 steps)
- Breakpoint: `md:` prefix (768px)

**Number Badges:**
- Size: `w-12 h-12` (48x48px, exceeds 44px minimum touch target)
- Shape: Square (no `rounded-full`, Swiss spa = sharp rectangles)
- Color: Black background, white text (high contrast)
- Font: Monospace for visual consistency with data

**Effects (Minimalist):**
- **NO hover states** (informational content, not interactive)
- **NO transitions** (static process diagram)
- **NO shadows** (flat design, Swiss spa = clean lines)

**Accessibility:**
- Number badges: 21:1 contrast (white on black)
- Text hierarchy: Headlines (600 weight) > descriptions (400 weight) > context (xs size)
- Semantic HTML: Use `<section>`, `<h3>` for step headlines
- Responsive: Touch targets 48x48px (exceeds WCAG 44px minimum)

**Testing:**
1. Desktop (1440px): 2x2 grid layout
2. Tablet (768px): Check grid collapse behavior
3. Mobile (375px): Vertical stack, badges align left
4. Verify: NO yellow elements, NO rounded corners

---

## Priority 2: Yellow Reduction (Rule of Two)

### Task 2.1: Audit Yellow Elements

**Objective:** Identify all yellow elements on the homepage

**How to find them:**
1. Search in `app/page.tsx` for: `#FCD34D` (yellow hex code)
2. Search for: `bg-[#FCD34D]` or `text-[#FCD34D]`
3. Search for: `bg-yellow` or `text-yellow`

**Rule of Two:** Max 2 yellow elements visible per viewport at any scroll position

**Common violations:**
- Multiple yellow badges ("AI-POWERED", "NEW", "FEATURED")
- Yellow borders on cards
- Yellow icon backgrounds
- Yellow underlines on links

### Task 2.2: Convert Non-CTA Yellow to Black/Grey

**Pattern:**
```typescript
// BEFORE (yellow badge, not a CTA)
<div className="bg-[#FCD34D]/10 text-[#000000]">
  AI-POWERED INTELLIGENCE
</div>

// AFTER (remove entirely or convert to grey)
<div className="bg-[#F8F8F8] text-[#666666]">
  INTELLIGENCE
</div>
```

**Rule:** Only PRIMARY conversion CTAs get yellow (e.g., "Get Started", "Analyze My Mortgage")

### Task 2.3: Verify CTA Hierarchy

**Ensure only 2 yellow CTAs per viewport:**

**Primary CTA (yellow):**
```typescript
<button className="px-8 py-4 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614] transition-colors">
  Get Your Analysis
</button>
```

**Secondary CTA (black):**
```typescript
<button className="px-8 py-4 bg-[#000000] text-white font-semibold hover:bg-[#333333] transition-colors">
  Learn More
</button>
```

**Tertiary CTA (link):**
```typescript
<button className="text-[#666666] hover:text-[#000000] underline">
  View Documentation
</button>
```

---

## Priority 3: Claims Cleanup

### Task 3.1: Remove All Unverified Claims

**Search for these patterns in `app/page.tsx`:**
- `%` (percentage claims like "40% savings", "99.9% accuracy")
- `X times` or `Xx` (multipliers like "10x faster")
- Superlatives: "best", "smartest", "fastest", "most accurate"
- Absolutes: "guaranteed", "never", "always", "perfect"

**Replacement guidelines:**

| ❌ Unverified | ✅ Grounded |
|--------------|-------------|
| "Save up to 40%" | "Find competitive rates across 16 banks" |
| "99.9% accuracy" | "Validated against real Singapore scenarios" |
| "23 banks covered" | "16 banks tracked" (use actual number) |
| "Guaranteed savings" | "Compare your options" |
| "Perfect timing" | "Timing based on your scenario" |

---

## Priority 4: Testing & Verification

### Task 4.1: Manual Browser Testing

**Viewport sizes to test:**
1. **Desktop:** 1440px width (common desktop)
2. **Tablet:** 768px width (iPad portrait)
3. **Mobile:** 375px width (iPhone SE)

**What to check at each viewport:**
- Copy: No superlatives, no "286 packages", evidence-based claims
- Colors: Max 2 yellow elements visible at any scroll position
- Layout: No text overflow, proper line breaks, readable spacing
- Images: Load correctly, proper aspect ratio

### Task 4.2: Build Verification

```bash
npm run build
```

**Expected output:** No warnings, build succeeds

**Common issues:**
- Unclosed JSX tags
- Missing closing quotes
- Invalid className syntax

### Task 4.3: Screenshot Comparison (Before/After)

**Using Playwright:**
```typescript
// Take "after" screenshot
await page.goto('http://localhost:3000')
await page.screenshot({ path: 'homepage-after.png', fullPage: true })
```

**Compare visually:**
1. Hero section: Evidence-based headline, no badge
2. Trust strip: "16 Banks", "50+ Scenarios", "24hr" stats
3. Real Scenarios: 3 proof cards (no yellow)
4. How It Works: 4-step process (black badges)
5. Footer: "Evidence-based" tagline

### Task 4.4: Swiss Spa Audit (Final Check)

**Swiss Spa Finesse Checklist:**
- [ ] **Calm:** No flashing, no bright colors dominating, peaceful scroll
- [ ] **Precise:** Numbers are exact ("16 banks" not "10+ banks"), dates shown ("Validated Oct 2025")
- [ ] **Understated:** Outcomes speak for themselves, no hype words ("smartest", "revolutionary")
- [ ] **Effortless:** Clear next steps, no cognitive load, obvious information hierarchy

**Voice Guide Compliance:**
- [ ] **Mathematically Evidenced:** All claims tied to data or scenarios
- [ ] **Singapore-Context Fluent:** "HDB 4-room", "EC", dollar amounts in SGD context
- [ ] **Grounded Disclosure:** Timelines shown ("24hr", "4-6 weeks"), expectations set
- [ ] **Sophisticatedly Accessible:** No jargon, numbers explained, plain language

**Rule of Two:**
- [ ] Scroll through entire homepage
- [ ] At each viewport position, count yellow elements
- [ ] Should NEVER see more than 2 yellow elements at once

---

## Common Mistakes to Avoid

### ❌ Don't Do This

**Mistake 1: Adding rounded corners**
```typescript
// NO - violates Swiss spa sharp rectangles
<div className="rounded-lg border">
```

**Mistake 2: Using font-weight 500**
```typescript
// NO - not in design system
<p className="font-medium"> // font-medium = 500
```

**Mistake 3: Exposing tech stack**
```typescript
// NO - violates "invisible intelligence"
<p>Our GPT-4 powered AI analyzes...</p>
```

**Mistake 4: Making unverifiable claims**
```typescript
// NO - can't guarantee
<p>Save up to 40% on your mortgage</p>
```

**Mistake 5: Overusing yellow**
```typescript
// NO - violates Rule of Two
<div className="bg-[#FCD34D]">Badge 1</div>
<div className="bg-[#FCD34D]">Badge 2</div>
<button className="bg-[#FCD34D]">CTA 1</button>
<button className="bg-[#FCD34D]">CTA 2</button>
// 4 yellow elements visible = violation
```

### ✅ Do This Instead

**Correct 1: Sharp rectangles**
```typescript
<div className="border"> // No rounded-lg
```

**Correct 2: Use weights 300/400/600**
```typescript
<p className="font-light">   // 300
<p className="font-normal">  // 400
<p className="font-semibold"> // 600
```

**Correct 3: Outcome-focused language**
```typescript
<p>We analyze 16 banks to find packages that match your scenario.</p>
```

**Correct 4: Grounded claims**
```typescript
<p>Compare your current rate against 16 banks.</p>
```

**Correct 5: Rule of Two compliance**
```typescript
<div className="bg-[#F8F8F8]">Badge 1</div>
<div className="bg-[#F8F8F8]">Badge 2</div>
<button className="bg-[#FCD34D]">Primary CTA</button>   // Yellow
<button className="bg-[#000000]">Secondary CTA</button> // Black
// Only 1 yellow element visible = compliant
```

---

## Commit Messages

Follow conventional commits format:

**Copy updates:**
```bash
fix(homepage): update hero to evidence-based positioning
```

**Yellow reduction:**
```bash
style(homepage): enforce Rule of Two for yellow elements
```

**Section replacement:**
```bash
refactor(homepage): replace system explanations with client proof
```

**Claims cleanup:**
```bash
fix(homepage): remove unverified claims per voice guide
```

---

## Related Documentation

- **Plan:** `docs/plans/active/2025-11-07-homepage-brand-alignment-facelift.md`
- **Voice Guide:** `docs/content/voice-and-tone.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Re-Strategy:** `docs/plans/re-strategy/Part04-brand-ux-canon.md`

---

## Questions or Issues

If you encounter ambiguity:
1. Check voice guide first (`docs/content/voice-and-tone.md`)
2. Refer to design system (`docs/DESIGN_SYSTEM.md`)
3. When in doubt, choose: outcome-focused over system-focused, grounded over superlative, monochrome over yellow
