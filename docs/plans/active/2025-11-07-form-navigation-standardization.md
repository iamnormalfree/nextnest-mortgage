---
status: active
priority: high
complexity: low
estimated_hours: 2-3
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-036
---

# Form Navigation Standardization & Chat History Fix

## Context

Fix inconsistent navigation across form flow and chat page back button loop.

**UX problems identified (2025-11-07):**
1. **Inconsistent navigation:** /apply page has logo only, form steps may have different patterns
2. **Chat back button loop:** User completes form → /chat → manually navigates to /apply → clicks back → goes to /chat (incorrect)
3. **No exit path:** Users can't easily return to homepage from form flow

**Current issues:**
- ConditionalNav shows minimal header (logo only) for /apply route
- Form steps may not have consistent navigation
- Chat page uses `router.push('/chat')` → adds to history → back button returns to form
- Missing "Back to Home" link across form pages

## Implementation Guide

**All code examples, component creation, testing procedures are in:**
`docs/runbooks/ux/form-navigation-standardization-implementation.md`

This plan contains only decisions (what/why/when). Reference the runbook for implementation details (how).

## Success Criteria

- [ ] FormNav component created (shared across loan selector + form steps)
- [ ] "Back to Home" link visible on all form pages (direct link to `/`, not browser back)
- [ ] "Get Started" button shows on loan selector, hides in form steps
- [ ] ConditionalNav uses FormNav for /apply route
- [ ] Chat page uses `router.replace('/chat')` (prevents back button loop)
- [ ] Navigation guard on chat page (back button → homepage, not form)
- [ ] Build passes without warnings
- [ ] Manual test: Homepage → Apply → Form → Chat → Back button goes to homepage

## Tasks

### Task 1: Create Shared FormNav Component

**Decision:** Extract standardized navigation to reusable component

**WHY:**
- Current: Each page has different nav pattern (inconsistent)
- Solution: Single component = consistent UX across form flow
- DRY: One source of truth for form navigation

**Component features:**
- Logo (left, clickable to `/`)
- "Back to Home" link (right, always direct link to `/`)
- "Get Started" button (right, conditional based on page context)
- Props: `showGetStarted`, `onGetStartedClick`, `currentStep`

**File:** Create `components/layout/FormNav.tsx`
**Implementation:** See runbook Task 1 (full component code, design specs)

---

### Task 2: Update ConditionalNav to Use FormNav

**Decision:** Replace minimal /apply navigation with FormNav component

**WHY:**
- Current: Only shows logo (lines 27-41)
- Missing: "Back to Home" link, "Get Started" CTA
- Solution: Use FormNav with `showGetStarted={true}`

**Changes:**
- Import FormNav
- Replace `if (pathname?.startsWith('/apply'))` block with `<FormNav showGetStarted={true} />`
- Remove old `<nav>` JSX

**File:** `components/layout/ConditionalNav.tsx` (lines 27-41)
**Implementation:** See runbook Task 2

---

### Task 3: Use FormNav in Form Steps (Optional)

**Decision:** Verify FormNav renders during form steps, add explicitly if needed

**WHY:**
- Form steps need same navigation as loan selector
- Current behavior unclear (may already work via ConditionalNav)
- If not, render FormNav with `showGetStarted={false}`

**Check:**
1. Does ConditionalNav handle form step routes?
2. If NO → Add FormNav to ProgressiveFormWithController

**File:** `components/forms/ProgressiveFormWithController.tsx` (if needed)
**Implementation:** See runbook Task 4

---

### Task 4: Fix Chat Page History Navigation

**Decision:** Use `router.replace()` instead of `router.push()` when transitioning to chat

**WHY:**
- Current: `router.push('/chat')` adds entry to history → back button returns to form
- Problem: User trapped in loop (form → chat → back → form → chat)
- Solution: `router.replace('/chat')` replaces history → back button skips form

**Sub-tasks:**

**4.1: Update Chat Transition Redirect**
- Find: `ChatTransitionScreen.tsx` or wherever chat redirect happens
- Change: `router.push('/chat')` → `router.replace('/chat')`
- File: `components/forms/ChatTransitionScreen.tsx`
- Implementation: See runbook Task 5.1

**4.2: Add Navigation Guard to Chat Page**
- Add: `popstate` event listener on chat page
- Behavior: Back button → redirect to `/` instead of form
- File: `app/chat/page.tsx`
- Implementation: See runbook Task 5.2

**4.3: Add "Back to Home" Link in Chat UI**
- Add: Explicit link to exit chat
- Position: Top of chat interface
- File: `app/chat/page.tsx`
- Implementation: See runbook Task 5.3

---

## Execution Order

1. **Create FormNav component** (Task 1) - Foundation, 30-45 mins
2. **Update ConditionalNav** (Task 2) - Quick integration, 15 mins
3. **Check form steps** (Task 3) - Verification, 15 mins
4. **Fix chat history** (Task 4.1-4.3) - 3 sub-tasks, 45-60 mins

Commit after each task (4 commits total).

---

## Design Highlights

**FormNav component:**
- Fixed top: `fixed top-0 z-50` (stays visible when scrolling)
- Height: 56px mobile, 64px desktop
- Background: White with light grey bottom border
- Logo (left): Standard NextNest logo
- "Back to Home" (right): Grey text, hover to black
- "Get Started" (right): Yellow button (only on loan selector)

**Chat navigation guard:**
- `popstate` event listener intercepts back button
- Redirects to `/` instead of allowing history navigation
- `router.replace()` prevents history entry

**Consistency:**
- All form pages (loan selector + Steps 1-4) use same FormNav
- Chat page has explicit "Back to Home" link
- No page leaves user without exit path

---

## Testing Checklist

**Navigation consistency:**
- [ ] /apply shows: Logo + "Back to Home" + "Get Started"
- [ ] Form Step 1 shows: Logo + "Back to Home" (no "Get Started")
- [ ] Form Step 2-4 shows: Same as Step 1
- [ ] All "Back to Home" links go to `/` (not browser back)

**Chat history fix:**
- [ ] Complete form → Redirect to /chat
- [ ] Click browser back from /chat → Goes to `/` (not form)
- [ ] Chat page has "Back to Home" link (explicit exit)

**Responsive:**
- [ ] Desktop (1440px): Full layout
- [ ] Mobile (375px): Logo scales, links remain tappable

---

## Rollback Plan

If issues occur:
1. Revert commit: `git revert HEAD`
2. Check dev server: `npm run dev`
3. Test navigation: Homepage → Apply → Form → Chat
4. Investigate: `git diff HEAD~1`

---

## Related Documentation

- **Implementation guide:** `docs/runbooks/ux/form-navigation-standardization-implementation.md`
- **Design System:** `docs/DESIGN_SYSTEM.md` (Rule of Two, colors)
- **Forms Architecture:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
- **Current nav:** `components/layout/ConditionalNav.tsx`

---

## Notes

- FormNav is form-specific (not for homepage or other pages)
- ConditionalNav continues to handle routing logic (which nav to show)
- Chat history fix prevents back button frustration (UX best practice)
- Estimated time: 2-3 hours (4 tasks, mostly straightforward)
