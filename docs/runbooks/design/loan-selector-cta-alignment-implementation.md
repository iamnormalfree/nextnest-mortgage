# Loan Selector & CTA Alignment Implementation Guide

**ABOUTME:** Comprehensive implementation guide for fixing loan selector section and CTA redundancy on homepage.
**ABOUTME:** Contains all code examples, design specs, and testing procedures for executing loan selector alignment plan.

## Purpose

This runbook supports `docs/plans/active/2025-11-07-loan-selector-cta-alignment.md`. It contains the detailed "how" while the plan contains the "what/why/when" decisions.

## Prerequisites

**Read these first:**
1. `docs/content/voice-and-tone.md` - Voice pillars, "invisible intelligence" principle
2. `docs/DESIGN_SYSTEM.md` - Rule of Two, 90/10 monochrome-yellow, Swiss spa finesse
3. Plan: `docs/plans/active/2025-11-07-loan-selector-cta-alignment.md`

**Key principles:**
- **Invisible intelligence:** Don't name the intelligence layer or expose tech stack
- **Rule of Two:** Max 2 yellow elements per viewport
- **Outcome-focused:** Show results, not process
- **No redundancy:** Don't make users click to see what they can already see

## Target File

**Primary file:** `app/page.tsx` (production homepage)

**Sections to modify:**
1. "Ready to optimize?" CTA section (repurpose, no deletion)
2. Loan selector section (fix copy, badges, links)

**Possible separate file:** `app/apply/page.tsx` (delete if exists)

## Task 1: Repurpose "Ready to Optimize?" Section

**Location:** `app/page.tsx` (search for "Ready to optimize")

**Current issue:**
- Has button that goes to /apply page (redundant with loan selector below)
- Creates confusing UX (button → separate page with same 3 cards user can already see)

**Decision:** Keep section but remove button, change to dark reinforcement block

**Before:**
```typescript
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
    <h2 className="text-2xl font-light text-[#000000] mb-2">
      Ready to optimize?
    </h2>
    <p className="text-base text-[#666666] mb-6">
      Get personalized analysis backed by real Singapore data
    </p>
    <Link
      href="/apply"
      className="inline-flex px-8 py-4 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614] transition-colors"
    >
      Get Your Free Analysis
    </Link>
  </div>
</section>
```

**After:**
```typescript
{/* Trust Bridge - Reinforcement Before Conversion */}
<section className="py-12 bg-[#000000]">
  <div className="max-w-4xl mx-auto px-4 text-center">
    <h2 className="text-2xl font-light text-white mb-3">
      Built on 50+ real Singapore scenarios
    </h2>
    <p className="text-base text-[#CCCCCC] mb-0">
      Evidence-based methodology. Transparent calculations. Choose your scenario below to get started.
    </p>
  </div>
</section>
```

**Changes explained:**

**Background color:**
- White → Black (`bg-[#000000]`)
- Creates visual break between content sections and conversion section
- Alternating rhythm: grey (scenarios) → white (how it works) → black (bridge) → grey (loan selector)

**Typography:**
- Headline stays `text-2xl font-light` (24px, weight 300)
- Text color: White for headline, light grey (#CCCCCC) for body on black background
- Removed `mb-6` from paragraph (no button below, use `mb-0`)

**Content:**
- "Ready to optimize?" → "Built on 50+ real Singapore scenarios"
- Reinforces trust message (evidence-based, 50+ scenarios)
- Removed subheading about "personalized analysis" (too close to system language)
- New copy: "Choose your scenario below" (points to section immediately following)

**Removed:**
- ❌ Button/Link component entirely (no more redundant navigation)
- ❌ Reference to /apply page

**Padding:**
- `py-16` → `py-12` (64px → 48px vertical, slimmer since it's just text)

**Why this works:**
- ✅ Keeps homepage length (not too thin)
- ✅ No redundant CTA (no button confusion)
- ✅ Reinforces brand message one more time before conversion
- ✅ Dark section provides visual rhythm
- ✅ Professional, understated (Swiss spa)

**Testing:**
1. Verify section appears with black background
2. Verify text is white/light-grey and readable
3. Verify no button present
4. Scroll test: Natural flow from "How It Works" → this section → "Loan Selector"

---

## Task 2: Fix Loan Selector Section Copy

**Location:** `app/page.tsx` (search for "Start your intelligent mortgage analysis")

**Current violations:**
1. "Start your intelligent mortgage analysis" = names intelligence layer
2. "MAS-compliant insights are waiting" = system-focused, compliance jargon
3. "Chatwoot-tested broker handoff" = exposes tech stack
4. 3 yellow badges = violates Rule of Two (max 2 per viewport)

**Before:**
```typescript
<section className="py-16 bg-[#F8F8F8]">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <div className="text-center mb-12">
      <h2 className="text-2xl font-light text-[#000000] mb-2">
        Start your intelligent mortgage analysis
      </h2>
      <p className="text-base text-[#666666]">
        Pick the journey that fits you. We'll take you straight into the progressive form on /apply,
        where instant analysis and MAS-compliant insights are waiting.
      </p>
    </div>

    {/* 3 loan type cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: New Purchase */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#000000]">New Purchase</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-[#FCD34D] text-[#000000]">
            MOST POPULAR
          </span>
        </div>
        <p className="text-sm text-[#666666] mb-6">
          First home or upgrading
        </p>
        <Link
          href="/apply?loanType=new_purchase"
          className="text-[#FCD34D] font-semibold hover:text-[#FBB614]"
        >
          Continue →
        </Link>
      </div>

      {/* Card 2: Refinancing */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#000000]">Refinancing</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-[#FCD34D] text-[#000000]">
            SAVE AVG $34K
          </span>
        </div>
        <p className="text-sm text-[#666666] mb-6">
          Lower existing payments
        </p>
        <Link
          href="/apply?loanType=refinance"
          className="text-[#FCD34D] font-semibold hover:text-[#FBB614]"
        >
          Continue →
        </Link>
      </div>

      {/* Card 3: Commercial */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#000000]">Commercial</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-[#FCD34D] text-[#000000]">
            DIRECT TO BROKER
          </span>
        </div>
        <p className="text-sm text-[#666666] mb-6">
          Business property financing
        </p>
        <Link
          href="/apply?loanType=commercial"
          className="text-[#FCD34D] font-semibold hover:text-[#FBB614]"
        >
          Continue →
        </Link>
      </div>
    </div>

    <p className="text-xs text-[#666666] text-center mt-8">
      The full multi-step form, instant calculations, and Chatwoot-tested broker handoff live on /apply.
      Selecting a journey takes you straight there.
    </p>
  </div>
</section>
```

**After:**
```typescript
{/* Loan Type Selector - Primary Conversion Point */}
<section id="loan-selector" className="py-16 bg-[#F8F8F8]">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <div className="text-center mb-12">
      <h2 className="text-2xl font-light text-[#000000] mb-2">
        Choose your scenario
      </h2>
      <p className="text-base text-[#666666]">
        Select your situation to see available packages
      </p>
    </div>

    {/* 3 loan type cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: New Purchase */}
      <Link
        href="/form?loanType=new_purchase"
        className="bg-white border border-[#E5E5E5] p-6 hover:border-[#000000] transition-colors block"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#000000]">New Purchase</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-[#F8F8F8] text-[#666666] border border-[#E5E5E5]">
            MOST POPULAR
          </span>
        </div>
        <p className="text-sm text-[#666666] mb-6">
          First home or upgrading
        </p>
        <span className="text-[#000000] font-semibold hover:text-[#666666]">
          Continue →
        </span>
      </Link>

      {/* Card 2: Refinancing */}
      <Link
        href="/form?loanType=refinance"
        className="bg-white border border-[#E5E5E5] p-6 hover:border-[#000000] transition-colors block"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#000000]">Refinancing</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-[#FCD34D] text-[#000000]">
            SAVE AVG $34K
          </span>
        </div>
        <p className="text-sm text-[#666666] mb-6">
          Lower existing payments
        </p>
        <span className="text-[#000000] font-semibold hover:text-[#666666]">
          Continue →
        </span>
      </Link>

      {/* Card 3: Commercial */}
      <Link
        href="/form?loanType=commercial"
        className="bg-white border border-[#E5E5E5] p-6 hover:border-[#000000] transition-colors block"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#000000]">Commercial</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-[#F8F8F8] text-[#666666] border border-[#E5E5E5]">
            DIRECT TO BROKER
          </span>
        </div>
        <p className="text-sm text-[#666666] mb-6">
          Business property financing
        </p>
        <span className="text-[#000000] font-semibold hover:text-[#666666]">
          Continue →
        </span>
      </Link>
    </div>

    <p className="text-xs text-[#666666] text-center mt-8">
      Takes 5 minutes. Your data stays private per PDPA.
    </p>
  </div>
</section>
```

**Changes explained:**

### Headlines & Copy

**Headline:**
- "Start your intelligent mortgage analysis" → "Choose your scenario"
- ❌ Removes "intelligent" (names intelligence layer)
- ✅ Uses "scenario" (Singapore-context fluent, matches voice guide)

**Subheading:**
- Complex explanation → "Select your situation to see available packages"
- ❌ Removes "progressive form on /apply" (exposes URL structure)
- ❌ Removes "MAS-compliant insights are waiting" (compliance jargon, system-focused)
- ✅ Simple, outcome-focused ("see available packages")

**Footer text:**
- "Chatwoot-tested broker handoff" → "Your data stays private per PDPA"
- ❌ Removes tech stack exposure
- ✅ Adds grounded disclosure (PDPA compliance, 5 min timeline)

### Badges (Rule of Two Compliance)

**Card 1 (New Purchase):**
- Yellow badge → Grey badge
- `bg-[#FCD34D]` → `bg-[#F8F8F8]` with `border border-[#E5E5E5]`
- Text: `text-[#000000]` → `text-[#666666]`

**Card 2 (Refinancing):**
- Yellow badge → **KEEP YELLOW** (primary action, savings-focused)
- This is your main conversion card (most users refinance)
- Only yellow element on page (Rule of Two compliant)

**Card 3 (Commercial):**
- Yellow badge → Grey badge
- Same styling as Card 1

**Result:** Only 1 yellow badge visible (Rule of Two = max 2, we're using 1)

### Links & Hover States

**Card container:**
- Entire card is now clickable (`<Link>` wraps entire card)
- Better UX (larger click target)
- Hover: Border changes from grey → black (`hover:border-[#000000]`)

**Continue link:**
- Yellow text → Black text
- `text-[#FCD34D]` → `text-[#000000]`
- Removes yellow from non-badge elements (Rule of Two)
- Hover: Black → Grey (`hover:text-[#666666]`)

**URL structure:**
- `/apply?loanType=X` → `/form?loanType=X`
- Goes directly to form (skip intermediate /apply page)

### Section ID

**Added:**
```typescript
<section id="loan-selector" ...>
```

**Why:** Allows anchor linking from other CTAs (if needed in future)

---

## Task 3: Delete /apply Page (If Exists)

**Check if file exists:** `app/apply/page.tsx`

**If it exists, delete it:**
```bash
rm app/apply/page.tsx
# Or if it's a directory:
rm -rf app/apply/
```

**Why delete:**
- Redundant (same content as homepage loan selector section)
- Creates confusing UX (users see same 3 cards twice)
- Extra click = higher drop-off rate
- Harder to maintain (duplicate content needs updating in 2 places)

**After deletion:**
1. Verify all links changed from `/apply` → `/form`
2. Check if any other pages link to `/apply` (grep search)
3. Update navigation/sitemap if needed

**Search for references:**
```bash
# Search for any remaining /apply references
grep -r "/apply" app/ components/ lib/
```

**If found, update to `/form` or remove:**
```typescript
// Before
<Link href="/apply">Get Started</Link>

// After
<Link href="/form">Get Started</Link>
```

---

## Design System Compliance

### Typography
- Headlines: `text-2xl font-light` (24px, weight 300)
- Card titles: `text-lg font-semibold` (18px, weight 600)
- Body text: `text-base` (16px, weight 400)
- Descriptions: `text-sm` (14px, weight 400)
- Badges: `text-xs font-semibold` (12px, weight 600)
- Footer: `text-xs` (12px, weight 400)

**NEVER use font-weight 500** (not in design system)

### Colors

**Trust bridge section (black):**
- Background: `bg-[#000000]` (black)
- Headline: `text-white` (white on black)
- Body: `text-[#CCCCCC]` (light grey on black)

**Loan selector section (light grey):**
- Background: `bg-[#F8F8F8]` (off-white)
- Cards: `bg-white` (white)
- Headlines: `text-[#000000]` (black)
- Body: `text-[#666666]` (grey)
- Borders: `border-[#E5E5E5]` (light grey)

**Badges:**
- Yellow (1 only): `bg-[#FCD34D] text-[#000000]`
- Grey (2 cards): `bg-[#F8F8F8] text-[#666666]` with `border-[#E5E5E5]`

**Links/CTAs:**
- Continue arrow: `text-[#000000]` (black)
- Hover: `hover:text-[#666666]` (grey)

### Spacing (8px System)

**Section padding:**
- Trust bridge: `py-12` (48px vertical)
- Loan selector: `py-16` (64px vertical)

**Internal spacing:**
- Headline margin: `mb-2` (8px)
- Paragraph margin: `mb-0` or `mb-6` (0 or 24px)
- Card grid gap: `gap-6` (24px)
- Card padding: `p-6` (24px)
- Footer margin: `mt-8` (32px)

### Corners (Sharp Rectangles)

**NO rounded corners anywhere:**
- Cards: `border` (no `rounded-lg`)
- Badges: No `rounded-` classes
- Swiss spa principle: sharp, clean lines

### Effects (200ms Max)

**Trust bridge:**
- NO hover states (informational only)
- NO transitions (static text)

**Loan selector cards:**
- Border color transition: `transition-colors`
- Hover: `hover:border-[#000000]` (grey → black)
- Duration: 200ms (default, meets design system limit)

**Continue links:**
- Text color transition on hover
- NO scale transforms (`hover:scale-105`)

### Accessibility

**Contrast ratios:**
- White on black: 21:1 (AAA)
- Light grey (#CCCCCC) on black: 10.7:1 (AAA)
- Black on white: 21:1 (AAA)
- Grey (#666666) on white: 5.7:1 (AA)

**Interactive elements:**
- Entire card is clickable (large target, exceeds 44px minimum)
- Visible focus states: `focus:ring-2 focus:ring-[#000000]`
- Link text: Clear action ("Continue →")

**Semantic HTML:**
- Section: `<section>` not `<div>`
- Headlines: Proper hierarchy (`<h2>` for section, `<h3>` for cards)
- Links: `<Link>` components (Next.js)

---

## Testing Procedures

### Manual Browser Testing

**Viewport sizes:**
1. Desktop: 1440px width
2. Tablet: 768px width
3. Mobile: 375px width

**Test flow:**
1. **Trust bridge section:**
   - Verify black background appears
   - Verify white/light-grey text readable
   - Verify NO button present
   - Verify text mentions "50+ scenarios" and "Choose your scenario below"

2. **Loan selector section:**
   - Verify headline: "Choose your scenario" (not "intelligent mortgage analysis")
   - Verify 3 cards visible
   - Verify only 1 yellow badge (Refinancing card)
   - Verify 2 grey badges (New Purchase, Commercial)
   - Verify entire card is clickable (hover changes border to black)
   - Verify footer text: "Takes 5 minutes. Your data stays private per PDPA."
   - NO "Chatwoot-tested" text

3. **Click behavior:**
   - Click New Purchase card → Goes to `/form?loanType=new_purchase`
   - Click Refinancing card → Goes to `/form?loanType=refinance`
   - Click Commercial card → Goes to `/form?loanType=commercial`
   - Verify NO intermediate /apply page appears

4. **Responsive behavior:**
   - Desktop: 3 cards side-by-side
   - Tablet: Check if grid collapses appropriately
   - Mobile: Cards stack vertically, full width

5. **Rule of Two check:**
   - Scroll entire homepage
   - Count yellow elements at each viewport position
   - Should NEVER see more than 2 yellow elements simultaneously
   - In this section: Only 1 yellow badge visible

### Build Verification

```bash
npm run build
```

**Expected:** No TypeScript errors, no warnings, build succeeds

**Common issues:**
- Unclosed JSX tags
- Missing imports (if Link/component paths changed)
- Invalid href values (ensure /form route exists)

### Link Testing

**Verify all loan type links work:**
```bash
# Start dev server
npm run dev

# Test each card:
# 1. Click New Purchase → http://localhost:3000/form?loanType=new_purchase
# 2. Click Refinancing → http://localhost:3000/form?loanType=refinance
# 3. Click Commercial → http://localhost:3000/form?loanType=commercial

# Verify /apply page deleted (should 404):
# Navigate to http://localhost:3000/apply → Should show 404 or redirect
```

### Grep for Orphaned References

**Search for any remaining /apply references:**
```bash
grep -r "/apply" app/ components/ lib/
# Should return NO results after cleanup
```

**If found, update or remove them**

---

## Common Mistakes to Avoid

### ❌ Don't Do This

**Mistake 1: Keeping the button**
```typescript
// NO - creates redundant navigation
<button onClick={goToApply}>Get Your Free Analysis</button>
{/* Next section has same 3 cards - confusing UX */}
```

**Mistake 2: Using rounded corners**
```typescript
// NO - violates Swiss spa sharp rectangles
<div className="rounded-lg border">
```

**Mistake 3: Multiple yellow badges**
```typescript
// NO - violates Rule of Two
<span className="bg-[#FCD34D]">MOST POPULAR</span>
<span className="bg-[#FCD34D]">SAVE AVG $34K</span>
<span className="bg-[#FCD34D]">DIRECT TO BROKER</span>
```

**Mistake 4: Exposing tech stack**
```typescript
// NO - exposes internal systems
<p>Chatwoot-tested broker handoff live on /apply</p>
```

**Mistake 5: System-focused language**
```typescript
// NO - names intelligence layer
<h2>Start your intelligent mortgage analysis</h2>
```

### ✅ Do This Instead

**Correct 1: Repurposed reinforcement section**
```typescript
<section className="py-12 bg-[#000000]">
  <h2 className="text-white">Built on 50+ real Singapore scenarios</h2>
  <p className="text-[#CCCCCC]">Choose your scenario below to get started.</p>
  {/* NO button */}
</section>
```

**Correct 2: Sharp rectangles**
```typescript
<div className="border"> // No rounded-lg
```

**Correct 3: Rule of Two compliance**
```typescript
<span className="bg-[#F8F8F8] text-[#666666]">MOST POPULAR</span> // Grey
<span className="bg-[#FCD34D] text-[#000000]">SAVE AVG $34K</span>  // Yellow (only 1)
<span className="bg-[#F8F8F8] text-[#666666]">DIRECT TO BROKER</span> // Grey
```

**Correct 4: Grounded disclosure**
```typescript
<p>Takes 5 minutes. Your data stays private per PDPA.</p>
```

**Correct 5: Outcome-focused language**
```typescript
<h2>Choose your scenario</h2>
<p>Select your situation to see available packages</p>
```

---

## Commit Messages

Follow conventional commits format:

**Trust bridge section:**
```bash
refactor(homepage): convert CTA section to trust reinforcement bridge
```

**Loan selector section:**
```bash
fix(homepage): update loan selector copy per voice guide
style(homepage): enforce Rule of Two for loan selector badges
fix(homepage): change loan links from /apply to /form
```

**Delete /apply page:**
```bash
refactor: remove redundant /apply page
```

---

## Related Documentation

- **Plan:** `docs/plans/active/2025-11-07-loan-selector-cta-alignment.md`
- **Voice Guide:** `docs/content/voice-and-tone.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Homepage plan:** `docs/plans/active/2025-11-07-homepage-brand-alignment-facelift.md`

---

## Questions or Issues

If you encounter ambiguity:
1. Check voice guide: "Invisible intelligence, visible outcomes" principle
2. Check design system: Rule of Two, sharp rectangles, 90/10 monochrome-yellow
3. When in doubt: outcome-focused over system-focused, fewer CTAs over more
