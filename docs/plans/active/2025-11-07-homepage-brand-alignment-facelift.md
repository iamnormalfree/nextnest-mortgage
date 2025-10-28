---
status: active
priority: high
complexity: medium
estimated_hours: 4-5
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-020, CAN-036
---

# Homepage Brand Alignment Facelift

## Context (Zero-Context Primer)

This plan updates the production homepage (`app/page.tsx`) to align with the new brand positioning documented in `docs/content/voice-and-tone.md` and `docs/DESIGN_SYSTEM.md`.

**Why this matters:** Our homepage currently violates three strategic principles:
1. **Voice alignment:** Says "Singapore's Smartest" (superlative) instead of evidence-based positioning
2. **System-focused copy:** References "286 packages" (technical) instead of "16 banks" (comprehensible)
3. **Yellow overuse:** 6+ yellow elements violate "Rule of Two" (max 2 per viewport)

**Target audience:** Skilled developer unfamiliar with mortgage advisory domain and NextNest brand strategy.

## Reference Documents (Read These First)

1. **`docs/content/voice-and-tone.md`** - Brand voice pillars, linguistic patterns, forbidden terms
2. **`docs/DESIGN_SYSTEM.md`** - Color palette, Rule of Two, 90/10 monochrome-yellow principle
3. **`docs/plans/re-strategy/Part04-brand-ux-canon.md`** - Strategic positioning, trust design

**Key takeaways:**
- **Voice:** "Invisible intelligence, visible outcomes" - don't name systems, show results
- **Numbers:** "16 banks" (comprehensible) not "286 packages" (requires explanation)
- **Yellow:** Primary CTAs only, max 2 per viewport
- **Claims:** Evidence-backed or grounded ("we track 16 banks") not superlatives ("smartest")

## Problem Statement

The current homepage (captured via Playwright on 2025-11-07) has:
- **6+ yellow elements** (violates Rule of Two)
- **"286 packages" referenced 4 times** (should be "16 banks")
- **Superlative claim** ("Singapore's Smartest")
- **Unverified claims** ("99.9% accuracy", "23 banks", "Save up to 40%")

## Success Criteria

- [ ] Hero headline follows voice-and-tone.md (no superlatives, evidence-based)
- [ ] "286 packages" replaced with "16 banks" across all sections
- [ ] Max 2 yellow elements visible per viewport (Rule of Two compliant)
- [ ] All claims either evidence-backed or removed
- [ ] Manual browser test: scroll through entire page, verify copy + colors
- [ ] Build passes without warnings
- [ ] No visual regressions (screenshot comparison before/after)

## Tasks (Bite-Sized, TDD Where Applicable)

### Priority 1: Copy Updates (30 mins)

#### Task 1.1: Update Hero Section Copy
**File:** `app/page.tsx` lines 131-142

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
{/* Remove badge entirely - cleaner, less yellow */}
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

**Testing:** Manual browser check - does hero read professionally without superlatives?

**Commit message:** `fix(homepage): update hero to evidence-based positioning per voice guide`

---

#### Task 1.2: Update Trust Strip Stats
**File:** `app/page.tsx` lines 207-221

**Before (line 208):**
```typescript
{ value: 286, label: 'Packages', sublabel: 'Analyzed Daily' },
```

**After:**
```typescript
{ value: 16, label: 'Banks', sublabel: 'Tracked Real-Time' },
```

**Testing:** Check that counter animates to 16, label reads "Banks"

**Commit message:** `fix(homepage): change trust strip from 286 packages to 16 banks`

---

#### Task 1.3: Update Feature Section Claims
**File:** `app/page.tsx` lines 242-247

**Before:**
```typescript
{
  title: 'Real-time Analysis',
  description: 'Market data updated every 15 minutes from 23 banks',
  metric: '99.9%',
  metricLabel: 'Accuracy'
},
```

**After:**
```typescript
{
  title: 'Real-Time Analysis',
  description: 'We track 16 banks and update rates throughout the day',
  metric: '16',
  metricLabel: 'Banks'
},
```

**Rationale:** "99.9% accuracy" is unverified. "16 banks" is factual and comprehensible.

**Testing:** Verify metric shows "16" with "Banks" label

**Commit message:** `fix(homepage): replace unverified accuracy claim with bank count`

---

#### Task 1.4: Update Tab Content Copy
**File:** `app/page.tsx` lines 325, 343

**Before (line 325):**
```typescript
Our AI analyzes all 286 packages to find your optimal rate,
```

**After:**
```typescript
We analyze 16 banks to find your optimal rate,
```

**Before (line 343):**
```typescript
<div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">286 packages</div>
```

**After:**
```typescript
<div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">16 banks</div>
```

**Testing:** Click through all 3 tabs, verify no "286" references remain

**Commit message:** `fix(homepage): update tab content to reference 16 banks consistently`

---

### Priority 2: Yellow Reduction (1 hour)

#### Task 2.1: Change Tab Active State to Black
**File:** `app/page.tsx` line 311

**Before:**
```typescript
className={`h-12 px-6 text-sm font-semibold flex items-center transition-all duration-200 ${activeTab === tab ? 'bg-[#FCD34D] text-[#000000]' : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'}`}
```

**After:**
```typescript
className={`h-12 px-6 text-sm font-semibold flex items-center transition-all duration-200 ${activeTab === tab ? 'bg-[#000000] text-white' : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'}`}
```

**Rationale:** Tabs are UI chrome, not primary CTAs. Yellow reserved for "Start Analysis" buttons.

**Testing:** Click through tabs, verify active state shows black background with white text

**Commit message:** `fix(homepage): change tab active state from yellow to black per Rule of Two`

---

#### Task 2.2: Remove Yellow Badge from Hero
**File:** `app/page.tsx` lines 131-133

**Action:** Delete the yellow badge entirely (already done in Task 1.1)

**Result:** Hero section now has 0 yellow elements, cleaner look

**Testing:** Verify no yellow badge appears above hero headline

---

#### Task 2.3: Audit Remaining Yellow Usage
**Manual check:**
1. Nav "Get Started" button (line 110) - **KEEP** (primary CTA)
2. Hero "Start Free Analysis" button (line 146) - **KEEP** (primary CTA)
3. Loan type badge (line 417) - **KEEP** (contextual highlight, only visible after scroll)
4. Tab badges (line 344) - Already changed to grey in Task 1.4

**Rule of Two compliance:**
- Viewport 1 (Hero): 1 yellow CTA ✅
- Viewport 2 (Features): 0 yellow ✅
- Viewport 3 (CTA Section): 1 yellow CTA ✅

**Testing:** Scroll through page, count yellow elements per screen - should never exceed 2

**Commit message:** `refactor(homepage): verify Rule of Two compliance (max 2 yellow/viewport)`

---

### Priority 3: Claims Cleanup (30 mins)

#### Task 3.1: Remove Unverified Savings Claim
**File:** `app/page.tsx` line 329

**Before:**
```typescript
<div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#10B981] text-white">Save up to 40%</div>
```

**After:**
```typescript
<div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">Comparison included</div>
```

**Rationale:** "40%" is ungrounded. Voice guide requires specific numbers with context.

**Testing:** Verify badge shows grey with "Comparison included" text

**Commit message:** `fix(homepage): replace unverified savings claim with factual badge`

---

### Priority 4: Final Review & Testing (30 mins)

#### Task 4.1: Manual Visual Regression Test
**Steps:**
1. Start dev server: `npm run dev`
2. Open `http://localhost:3001`
3. Take screenshot of each section
4. Compare against Playwright screenshots from 2025-11-07 visual audit
5. Verify changes:
   - Hero: No badge, new headline, "16 banks" copy ✅
   - Trust strip: "16 Banks" stat ✅
   - Features: "16" metric, "16 banks" description ✅
   - Tabs: Black active state, "16 banks" badge ✅
   - Yellow count: Max 2 per viewport ✅

**Acceptance:** All sections match expected changes, no visual bugs introduced

---

#### Task 4.2: Build Verification
**Command:** `npm run build`

**Expected:** Build completes successfully with no errors or warnings

**If errors:** Fix TypeScript/lint issues before committing

---

#### Task 4.3: Copy Proofreading Against Voice Guide
**Checklist:**
- [ ] No superlatives ("smartest", "best", "guaranteed")
- [ ] No system names ("Decision Bank", "The Index")
- [ ] Numbers are comprehensible ("16 banks" not "286 packages")
- [ ] Active voice ("We track" not "System analyzes")
- [ ] Personal ownership ("your situation" not "the scenario")

**If violations found:** Update copy per `docs/content/voice-and-tone.md` patterns

---

#### Task 4.4: Swiss Spa Finesse Audit (Final Quality Gate)

**Purpose:** Verify changes achieve Swiss spa treatment aesthetic: calm, precise, understated luxury, effortless.

**Audit checklist - scroll through entire homepage:**

**1. Calm (No Urgency/Pressure)**
- [ ] No countdown timers or "Act now!" language
- [ ] No aggressive urgency ("Limited time", "Don't miss out")
- [ ] No exclamation marks in body copy
- [ ] Tone is reassuring, never alarming

**2. Precision (Evidence-Backed Specificity)**
- [ ] Numbers have context ("16 banks" not just "banks")
- [ ] Claims are grounded ("We track" not "We guarantee")
- [ ] Specific details over vague promises
- [ ] Mathematical language where appropriate ("Real-time", "24-hour")

**3. Understated (Minimal, Confident)**
- [ ] Yellow appears max 2x per viewport (Rule of Two)
- [ ] No rainbow of colors - 90% monochrome, 10% yellow
- [ ] Generous white space between sections
- [ ] Typography is clean (no bold shouting in headlines)
- [ ] No ALL CAPS in headlines (badge labels acceptable)

**4. Effortless (Invisible Intelligence)**
- [ ] No system names ("Decision Bank", "The Index", "AI Engine")
- [ ] Focus on outcomes ("You get X") not process ("System does Y")
- [ ] Copy sounds like expert human, not marketing automation
- [ ] Intelligence works behind scenes, results are visible

**Pass criteria:** All 4 categories check out. If any fail, revise copy/design before final commit.

**Why this matters:** Swiss spa finesse is the brand DNA - precision without showing off, luxury without loudness. This audit ensures technical compliance (tasks 1-3) achieved the *aesthetic* goal.

---

## Testing Strategy

**Manual testing (no E2E tests for homepage yet):**
1. Visual regression via screenshot comparison
2. Cross-browser check (Chrome, Safari, Firefox)
3. Mobile responsive (375px, 768px, 1440px)
4. Color contrast check (all text meets WCAG AA)

**Automated testing:**
- Build passes (`npm run build`)
- No TypeScript errors
- No console warnings

**No unit tests required** - these are copy and styling changes, no logic

## Rollback Plan

If visual bugs or build failures occur:
1. `git log` to find last good commit
2. `git revert {commit-hash}` to undo changes
3. Investigate issue offline, retry with smaller changes

## Implementation Tips

**DRY considerations:**
- All "286 packages" → "16 banks" changes follow same pattern
- Consider extracting repeated copy to constants if more than 3 references

**YAGNI check:**
- Only change what violates brand alignment
- Don't add new features (Evidence Showcase, Process sections) unless explicitly approved

**Frequent commits:**
- Each task gets its own commit (use provided commit messages)
- Push after Priority 1 and 2 complete (working checkpoints)

## Common Mistakes to Avoid

1. **Don't change animation logic** - only copy and colors
2. **Don't alter component structure** - keep existing divs/classes
3. **Don't add new dependencies** - work with existing Tailwind classes
4. **Don't break responsive behavior** - test mobile after each change
5. **Don't skip manual testing** - screenshots are your proof

## After Completion

1. Update `docs/work-log.md` with completion entry
2. Create completion report: `2025-11-07-homepage-brand-alignment-facelift-COMPLETION.md`
3. Archive plan to `docs/plans/archive/2025/11/`
4. Notify Brent for stakeholder review

---

**Estimated total time:** 4-5 hours focused work
**Complexity:** Medium (copy changes + design system alignment)
**Risk level:** Low (no logic changes, easy rollback)
