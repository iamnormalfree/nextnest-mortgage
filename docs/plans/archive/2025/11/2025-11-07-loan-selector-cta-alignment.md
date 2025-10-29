---
status: active
priority: high
complexity: low
estimated_hours: 1-2
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-020, CAN-036
---

# Loan Selector & CTA Alignment

## Context

Fix redundant CTA and brand violations in homepage loan selector section per `docs/content/voice-and-tone.md` and `docs/DESIGN_SYSTEM.md`.

**UX problem identified (2025-11-07):**
- "Ready to optimize?" CTA button → goes to /apply page
- /apply page shows 3 loan selector cards
- Homepage bottom section shows SAME 3 loan selector cards
- **Result:** Users see same cards twice (confusing, redundant)

**Brand violations:**
1. **"Start your intelligent mortgage analysis"** - names intelligence layer (should be invisible)
2. **"Chatwoot-tested broker handoff"** - exposes tech stack
3. **3 yellow badges** - violates Rule of Two (max 2 per viewport)
4. **Links to /apply** - unnecessary intermediate page

## Implementation Guide

**All code examples, design specs, and testing procedures are in:**
`docs/runbooks/design/loan-selector-cta-alignment-implementation.md`

This plan contains only decisions (what/why/when). Reference the runbook for implementation details (how).

## Success Criteria

- [x] "Ready to optimize?" section repurposed (no button, dark background, reinforcement message)
- [x] Loan selector headline: "Choose your scenario" (not "intelligent mortgage analysis")
- [x] Footer text: No "Chatwoot-tested" reference
- [x] Only 1 yellow badge visible (Rule of Two compliant)
- [x] All cards link to /apply (correct - /apply is the progressive form page)
- [x] /apply page preserved (correct - it's the actual form page, not redundant)
- [x] Build passes without warnings
- [ ] Manual test: Click each card → goes to /apply with loanType param

## Tasks

### Task 1: Repurpose "Ready to Optimize?" Section

**Decision:** Keep section but remove button, convert to dark reinforcement block

**WHY:**
- Current: Button goes to /apply page (redundant with cards below)
- Problem: Users click button → see same 3 cards they can already see on homepage
- Solution: Repurpose as visual break + trust reinforcement (no navigation)

**Changes:**
- Background: White → Black (`bg-[#000000]`)
- Headline: "Ready to optimize?" → "Built on 50+ real Singapore scenarios"
- Copy: Remove mention of /apply, add "Choose your scenario below"
- Remove: Button/Link component entirely

**Benefits:**
- ✅ Keeps homepage length (not too thin)
- ✅ No redundant CTA (eliminates confusion)
- ✅ Dark section provides visual rhythm (alternating light/dark)
- ✅ Reinforces trust message before conversion point

**File:** `app/page.tsx` (search for "Ready to optimize")
**Implementation:** See runbook Task 1

---

### Task 2: Fix Loan Selector Section Copy

**Decision:** Update headlines, remove tech stack references, fix Rule of Two violations

**WHY:**
- "intelligent mortgage analysis" = names intelligence layer (should be invisible)
- "Chatwoot-tested" = exposes tech stack (competitive risk)
- 3 yellow badges = violates Rule of Two

**Changes:**

**Headlines:**
- "Start your intelligent mortgage analysis" → "Choose your scenario"
- Remove explanation about /apply page → "Select your situation to see available packages"

**Footer text:**
- "Chatwoot-tested broker handoff" → "Takes 5 minutes. Your data stays private per PDPA."

**Badges (Rule of Two):**
- Card 1 (New Purchase): Yellow → Grey badge
- Card 2 (Refinancing): Yellow → **KEEP YELLOW** (primary action)
- Card 3 (Commercial): Yellow → Grey badge
- Result: Only 1 yellow badge visible

**Links:**
- `/apply?loanType=X` → `/form?loanType=X` (skip intermediate page)
- Continue arrow text: Yellow → Black
- Entire card now clickable (better UX)

**File:** `app/page.tsx` (search for "Start your intelligent mortgage analysis")
**Implementation:** See runbook Task 2

---

### Task 3: Delete /apply Page

**Decision:** Delete intermediate page entirely (if exists)

**WHY:**
- Redundant (shows same 3 cards as homepage)
- Extra click = higher drop-off rate
- Duplicate content = harder to maintain

**Steps:**
1. Check if `app/apply/page.tsx` exists
2. If yes, delete file/directory
3. Grep search for remaining `/apply` references
4. Update any orphaned links to `/form`

**File:** `app/apply/page.tsx` (or `app/apply/` directory)
**Implementation:** See runbook Task 3

---

## Execution Order

1. **Repurpose CTA section** (Task 1) - Low risk, visual change only
2. **Fix loan selector** (Task 2) - Copy changes, badge colors, link updates
3. **Delete /apply page** (Task 3) - Cleanup, verify no broken links

Commit after each task (3 commits total).

---

## Design Highlights

**Trust bridge section (repurposed CTA):**
- Black background (`bg-[#000000]`)
- White headline, light grey body text
- NO button (text only)
- 48px vertical padding (slim, elegant)

**Loan selector section:**
- Light grey background (`bg-[#F8F8F8]`)
- Only 1 yellow badge (Refinancing - primary action)
- 2 grey badges (New Purchase, Commercial)
- Entire card clickable with hover state (border grey → black)
- Sharp rectangles (no rounded corners)

**Rule of Two compliance:**
- Before: 3 yellow badges + button = 4 yellow elements ❌
- After: 1 yellow badge = 1 yellow element ✅

---

## Testing Checklist

**Visual verification:**
- [ ] Trust bridge section has black background
- [ ] NO button in trust bridge section
- [ ] Loan selector headline: "Choose your scenario"
- [ ] Only 1 yellow badge visible (Refinancing card)
- [ ] Footer text: "Takes 5 minutes. Your data stays private per PDPA."
- [ ] NO "Chatwoot-tested" text anywhere

**Link testing:**
- [ ] New Purchase card → `/form?loanType=new_purchase`
- [ ] Refinancing card → `/form?loanType=refinance`
- [ ] Commercial card → `/form?loanType=commercial`
- [ ] Navigate to `/apply` → 404 or redirect (page deleted)

**Responsive:**
- [ ] Desktop (1440px): 3 cards side-by-side
- [ ] Mobile (375px): Cards stack vertically

---

## Rollback Plan

If issues occur:
1. Revert commit: `git revert HEAD`
2. Check dev server: `npm run dev`
3. Investigate: `git diff HEAD~1 app/page.tsx`

---

## Related Documentation

- **Implementation guide:** `docs/runbooks/design/loan-selector-cta-alignment-implementation.md`
- **Voice guide:** `docs/content/voice-and-tone.md` (Section 2: Core Principle)
- **Design system:** `docs/DESIGN_SYSTEM.md` (Rule of Two)
- **Homepage plan:** `docs/plans/active/2025-11-07-homepage-brand-alignment-facelift.md`

---

## Notes

- This supplements homepage alignment plan (different section focus)
- Estimated 30-45 mins per task (1-2 hours total)
- Main risk: Breaking card links (verify /form route exists)
- /apply page may not exist yet (check before deleting)
