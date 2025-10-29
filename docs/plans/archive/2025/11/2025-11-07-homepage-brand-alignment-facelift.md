---
status: active
priority: high
complexity: medium
estimated_hours: 4-5
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-020, CAN-036
---

# Homepage Brand Alignment Facelift

## Context

Update production homepage (`app/page.tsx`) to align with brand positioning per `docs/content/voice-and-tone.md` and `docs/DESIGN_SYSTEM.md`.

**Strategic violations identified (2025-11-07 visual audit):**
1. **Voice misalignment:** "Singapore's Smartest" (superlative), "286 packages" (technical)
2. **Yellow overuse:** 6+ yellow elements (violates Rule of Two: max 2 per viewport)
3. **System exposure:** Sections named "Why Intelligence Matters" and "Intelligent Solutions" expose tech stack (GPT-4) and intelligence layer (should be invisible)
4. **Unverified claims:** "99.9% accuracy", "23 banks", "Save up to 40%"

## Implementation Guide

**All code examples, design specs, and testing procedures are in:**
`docs/runbooks/design/homepage-brand-alignment-implementation.md`

This plan contains only decisions (what/why/when). Reference the runbook for implementation details (how).

## Success Criteria

- [x] Hero: Evidence-based headline, no superlatives, "16 banks" not "286 packages"
- [x] Colors: Max 2 yellow elements visible per viewport (Rule of Two compliant)
- [x] Sections: Deleted system-focused content, replaced with client proof + process explainer
- [x] Claims: All evidence-backed or removed
- [x] Visual regression: No layout breaks, proper spacing maintained
- [x] Build: Passes without warnings
- [x] Manual test: Scroll entire page at 375px/768px/1440px viewports (QA Report: 2025-10-29)

## Tasks

### Priority 1: Copy Updates (WHAT)

**WHY:** Homepage currently violates voice guide with superlatives, technical language, and unverifiable claims. Need evidence-based positioning.

#### 1.1 Hero Section
- **Decision:** Replace "Singapore's Smartest" → "Evidence-based mortgage advisory"
- **Decision:** Remove AI badge (reduces yellow, less tech-focused)
- **Decision:** Change "286 packages" → "16 banks" (comprehensible, accurate)
- **File:** `app/page.tsx` lines 131-142
- **Implementation:** See runbook Task 1.1

#### 1.2 Trust Strip
- **Decision:** Replace unverified stats with grounded metrics
  - "286 Packages" → "16 Banks Tracked"
  - "$1.2M Savings" → "50+ Real Scenarios"
  - "99.9% Accuracy" → "24hr Analysis Time"
- **File:** `app/page.tsx` lines 207-221
- **Implementation:** See runbook Task 1.2

#### 1.3 Feature Section Claims
- **Decision:** Remove superlatives ("best", "smartest", "most accurate")
- **Decision:** Replace percentages with grounded descriptions
- **File:** `app/page.tsx` lines ~255-280
- **Implementation:** See runbook Task 1.3 (search patterns provided)

#### 1.4 Tab Content (if exists)
- **Decision:** Change system language to outcome language
  - "AI predicts" → "We analyze"
  - "Perfect timing" → "Optimal timing based on your scenario"
- **File:** `app/page.tsx` lines ~300-360
- **Implementation:** See runbook Task 1.4

#### 1.5 Footer
- **Decision:** Remove "most transparent" superlative → "Evidence-based"
- **File:** `app/page.tsx` line ~463
- **Implementation:** See runbook Task 1.5

#### 1.6 Delete "Why Intelligence Matters" Section
- **Decision:** DELETE entire section (lines 227-295, ~68 lines)
- **WHY:** Exposes tech stack ("GPT-4"), names intelligence layer, makes unverifiable promises ("Lifetime Partnership")
- **Strategic:** System-focused ("look at our AI") → Outcome-focused (replaced in Task 1.8)
- **Implementation:** See runbook Task 1.6

#### 1.7 Delete "Intelligent Solutions" Tabs
- **Decision:** DELETE entire section (lines 297-365, ~68 lines) + state variable
- **WHY:** Names intelligence layer again, explains HOW we work (system internals) not WHAT you get (outcomes)
- **Implementation:** See runbook Task 1.7

#### 1.8 Add "Real Scenarios" Proof Section
- **Decision:** INSERT where Task 1.6 deleted content (~line 227)
- **WHY:** Replace system explanations with client proof (outcome-focused)
- **Content:** 3 scenario cards:
  1. HDB 4-room refinance ($185/month saved)
  2. Private condo new purchase ($264/month saved)
  3. EC refinance + cash-out ($142/month saved)
- **Design:** Monochrome only (NO yellow), sharp corners, font-weights 300/400/600
- **Implementation:** See runbook Task 1.8 (includes full code + design specs)

#### 1.9 Add "How It Works" Process Section
- **Decision:** INSERT where Task 1.7 deleted content (~line 297)
- **WHY:** Reduces anxiety about process, sets expectations (24hr timeline, 4-6 weeks completion)
- **Content:** 4-step process grid:
  1. Share your scenario (5 min, PDPA-compliant)
  2. We analyze 16 banks (24hr completion)
  3. Get your options (stay vs refinance)
  4. We handle process (4-6 weeks typical)
- **Design:** Black number badges (48x48px), 2x2 grid desktop, stack mobile
- **Implementation:** See runbook Task 1.9 (includes full code + design specs)

---

### Priority 2: Yellow Reduction (WHAT)

**WHY:** Current homepage has 6+ yellow elements (violates Rule of Two: max 2 per viewport).

#### 2.1 Audit Yellow Elements
- **Decision:** Identify all instances of `#FCD34D` (yellow hex) in `app/page.tsx`
- **Implementation:** See runbook Task 2.1 (search patterns)

#### 2.2 Convert Non-CTA Yellow
- **Decision:** Change badges/decorative yellow → grey/black
- **Rule:** Only PRIMARY conversion CTAs get yellow
- **Implementation:** See runbook Task 2.2 (before/after patterns)

#### 2.3 Verify CTA Hierarchy
- **Decision:** Ensure max 2 yellow CTAs visible per viewport
- **Hierarchy:** Primary (yellow) → Secondary (black) → Tertiary (link)
- **Implementation:** See runbook Task 2.3

---

### Priority 3: Claims Cleanup (WHAT)

**WHY:** Unverified claims ("99.9% accuracy", "$1.2M savings") create legal/compliance risk and break trust.

#### 3.1 Remove Unverified Claims
- **Decision:** Delete or replace all claims with `%`, `X times`, superlatives, absolutes
- **Pattern:** Search for "best", "smartest", "guaranteed", "perfect", percentages
- **Replacement table:** See runbook Task 3.1
- **Implementation:** See runbook Task 3.1

---

### Priority 4: Testing & Verification (WHEN)

**WHY:** Ensure no visual regressions, verify brand alignment at all viewport sizes.

#### 4.1 Manual Browser Test
- **Viewports:** 1440px, 768px, 375px
- **Checklist:** Copy, colors, layout, images
- **Implementation:** See runbook Task 4.1

#### 4.2 Build Verification
- **Command:** `npm run build`
- **Expected:** No warnings, build succeeds
- **Implementation:** See runbook Task 4.2

#### 4.3 Screenshot Comparison
- **Tool:** Playwright (take "after" screenshot, compare with "before")
- **Sections to verify:** Hero, trust strip, Real Scenarios, How It Works, footer
- **Implementation:** See runbook Task 4.3

#### 4.4 Swiss Spa Audit
- **Checklist:** Calm, precise, understated, effortless (per voice guide)
- **Rule of Two:** Scroll entire page, verify max 2 yellow elements at any position
- **Implementation:** See runbook Task 4.4

---

## Execution Order

1. **Copy updates first** (Tasks 1.1-1.5) - Quick wins, low risk
2. **Section replacement** (Tasks 1.6-1.9) - Strategic changes, higher risk
3. **Yellow reduction** (Tasks 2.1-2.3) - After copy settled
4. **Claims cleanup** (Task 3.1) - Catch remaining violations
5. **Testing** (Tasks 4.1-4.4) - Final verification

Commit frequently. Each task = 1 commit (or bundle related tasks).

---

## Related Documentation

- **Implementation guide:** `docs/runbooks/design/homepage-brand-alignment-implementation.md`
- **Voice guide:** `docs/content/voice-and-tone.md`
- **Design system:** `docs/DESIGN_SYSTEM.md`
- **Re-strategy:** `docs/plans/re-strategy/Part04-brand-ux-canon.md`

---

## Rollback Plan

If visual regressions occur:
1. Revert last commit: `git revert HEAD`
2. Check dev server: `npm run dev`
3. Investigate specific file: `git diff HEAD~1 app/page.tsx`
4. Fix issue, re-commit

---

## Notes

- Tasks 1.8 and 1.9 add ~120 lines total (replacing ~136 deleted lines)
- Net result: Homepage length similar, content strategically improved
- Database of scenarios builds organically as you serve clients (authentic positioning)
