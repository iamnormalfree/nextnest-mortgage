---
status: active
priority: high
complexity: medium
estimated_hours: 2-3
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-016, CAN-036
---

# Form & Chat Brand Alignment

## Context (Zero-Context Primer)

This plan updates the progressive mortgage form and AI broker chat UI to align with brand positioning documented in `docs/content/voice-and-tone.md` and `docs/DESIGN_SYSTEM.md`.

**Why this matters:** Form and chat are core conversion surfaces. They currently violate three voice guide principles:
1. **Conversational tone mismatch:** "Let's get to know you" (too casual for Swiss spa finesse)
2. **System-focused language:** "No Conversation Found" (exposes system internals)
3. **Missing grounded disclosure:** No privacy reassurance, no timeline context

**Target audience:** Skilled developer unfamiliar with NextNest brand strategy and mortgage advisory domain.

## Reference Documents (Read These First)

1. **`docs/content/voice-and-tone.md`** - Voice pillars, linguistic patterns, surface-specific playbooks
   - Key sections: Pattern 1 (Active Voice), Pattern 4 (Honest Promises), Pattern 5 (Grounded Disclosure)
2. **`docs/DESIGN_SYSTEM.md`** - Swiss spa finesse principles (calm, precise, understated, effortless)
3. **`docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`** - Form structure, step flow, validation patterns

**Key takeaways:**
- **Voice:** Active, human team ("We'll send..." not "System will...")
- **Tone:** Sophisticatedly accessible - plain language, not overly friendly
- **Disclosure:** Grounded promises (24-hour delivery, PDPA compliance)
- **Singapore fluency:** Use local naming conventions naturally

## Problem Statement

Visual audit (2025-11-07) and code review found:
- **Casual tone** - "Let's get to know you" conflicts with Swiss spa understated professionalism
- **System language** - "No Conversation Found" exposes technical details
- **Generic placeholders** - "John Doe" not Singapore-context appropriate
- **Missing disclosures** - No PDPA reassurance, no timeline context
- **Navigation CTAs** - "Go to Home" instead of outcome-focused "Start Your Analysis"

## Success Criteria

- [ ] Form headlines use professional tone (no "Let's..." phrasing)
- [ ] Chat empty state uses human-centered language (no "system" references)
- [ ] All placeholders use Singapore naming conventions
- [ ] PDPA disclosure added to contact info step
- [ ] 24-hour timeline mentioned where relevant
- [ ] All CTAs are outcome-focused (not navigation)
- [ ] Manual browser test: complete form flow, verify copy changes
- [ ] Build passes without warnings

## Tasks (Bite-Sized, ~30 mins each)

### Priority 1: Form Copy Updates (1 hour)

#### Task 1.1: Replace Casual Headline in Step 2
**File:** `components/forms/ProgressiveFormWithController.tsx` (around line 600-800, search for "Let's get to know you")

**Current issue:** "Let's get to know you" is too casual for Swiss spa finesse. Voice guide requires "sophisticatedly accessible" - plain language but professionally understated.

**How to find the code:**
1. Open `components/forms/ProgressiveFormWithController.tsx`
2. Search for string "Let's get to know you" (Ctrl+F)
3. You'll find it in the JSX for Step 2 rendering

**Before:**
```typescript
<h2 className="text-2xl font-light text-[#000000] mb-2">
  Let's get to know you
</h2>
```

**After:**
```typescript
<h2 className="text-2xl font-light text-[#000000] mb-2">
  Your contact information
</h2>
```

**Rationale:**
- Swiss spa = understated, not overly friendly
- "Your contact information" = clear, professional, functional
- Matches voice guide "sophisticatedly accessible" tone

**Testing:**
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3001/apply?loanType=refinance`
3. Verify headline reads "Your contact information"
4. Check it doesn't break responsive layout (test 375px, 768px, 1440px)

**Commit message:** `fix(form): replace casual headline with professional tone in Step 2`

---

#### Task 1.2: Add Privacy Disclosure to Contact Step
**File:** `components/forms/ProgressiveFormWithController.tsx` (same section as Task 1.1)

**Current issue:** No privacy reassurance on sensitive data collection. Voice guide requires "grounded disclosure."

**How to find insertion point:**
1. Same file as Task 1.1
2. Find the headline you just changed
3. Add new paragraph AFTER the headline, BEFORE the form fields

**Add this code:**
```typescript
<h2 className="text-2xl font-light text-[#000000] mb-2">
  Your contact information
</h2>
{/* NEW: Privacy disclosure */}
<p className="text-base text-[#666666] mb-6">
  We'll use this to prepare your analysis and send your breakdown within 24 hours.
</p>
```

**Then add PDPA reassurance AFTER the phone number field:**
```typescript
{/* After the phone number input field, add: */}
<p className="text-sm text-[#666666] mt-2">
  Your data is encrypted. PDPA-compliant. Consent expires in 5 days.
</p>
```

**Rationale:**
- **"Within 24 hours"** = honest promise (grounded disclosure)
- **PDPA compliance** = legal requirement + trust signal
- **"Consent expires in 5 days"** = sets clear expectation

**Testing:**
1. Navigate to Step 2 in form
2. Verify two new text paragraphs appear:
   - One under headline (timeline)
   - One under phone field (PDPA)
3. Check text color is grey (#666666) and readable
4. Verify no layout breaks on mobile (375px width)

**Commit message:** `feat(form): add privacy disclosure and timeline to contact step`

---

#### Task 1.3: Update Form Placeholders to Singapore Context
**File:** `components/forms/ProgressiveFormWithController.tsx` (contact fields section)

**Current issue:** Placeholders use Western names ("John Doe") not Singapore-appropriate. Voice guide pillar "Singapore-Context Fluent."

**How to find:**
1. Same file, Step 2 section
2. Search for `placeholder=` attributes in Input components
3. You'll find 3 inputs: name, email, phone

**Before:**
```typescript
<Input
  placeholder="John Doe"
  {...}
/>
<Input
  placeholder="john@example.com"
  {...}
/>
<Input
  placeholder="91234567"
  {...}
/>
```

**After:**
```typescript
<Input
  placeholder="Tan Wei Ming"
  {...}
/>
<Input
  placeholder="weiming@gmail.com"
  {...}
/>
<Input
  placeholder="9123 4567"
  {...}
/>
```

**Rationale:**
- **"Tan Wei Ming"** = common Singapore name (mix of ethnic backgrounds)
- **Space in phone** = Singapore format (9123 4567 not 91234567)
- Shows cultural fluency without being overly specific

**Testing:**
1. Navigate to Step 2
2. Focus each input field
3. Verify placeholders show Singapore-appropriate text
4. Test actual input still works (placeholders disappear on typing)

**Commit message:** `fix(form): update placeholders to Singapore naming conventions`

---

### Priority 2: Chat UI Updates (1 hour)

#### Task 2.1: Replace System Language in Empty State
**File:** `app/chat/page.tsx` lines 90-108

**Current issue:** "No Conversation Found" exposes system internals. Voice guide requires "active voice, human team."

**Before:**
```typescript
<h2 className="text-xl font-semibold text-ink mb-2">No Conversation Found</h2>
<p className="text-graphite mb-4">
  Please complete the mortgage form first to start a conversation.
</p>
```

**After:**
```typescript
<h2 className="text-xl font-semibold text-ink mb-2">Analysis not ready yet</h2>
<p className="text-graphite mb-4">
  Complete the form first—we'll have your breakdown ready within 24 hours.
</p>
```

**Rationale:**
- **"No Conversation Found"** = system error message (invisible intelligence violated)
- **"Analysis not ready yet"** = human explaining status
- **"within 24 hours"** = honest promise (grounded disclosure)
- **Em dash usage** = Swiss spa sophistication (typographic refinement)

**Testing:**
1. Navigate to: `http://localhost:3001/chat` (without conversation param)
2. Verify new headline and body text appear
3. Check tone feels like human explanation, not error
4. Verify em dash renders correctly (—)

**Commit message:** `fix(chat): replace system language with human-centered empty state`

---

#### Task 2.2: Update CTA to Outcome-Focused Language
**File:** `app/chat/page.tsx` line 100

**Current issue:** "Go to Home" is navigation language. Voice guide requires outcome-focused CTAs.

**Before:**
```typescript
<Button
  onClick={() => window.location.href = '/'}
  className="..."
>
  Go to Home
</Button>
```

**After:**
```typescript
<Button
  onClick={() => window.location.href = '/apply'}
  className="..."
>
  Start Your Analysis
</Button>
```

**Changes:**
1. Button text: "Go to Home" → "Start Your Analysis"
2. Destination: `'/'` → `'/apply'` (direct to action, not homepage)

**Rationale:**
- **"Start Your Analysis"** = outcome-focused (what user gets)
- **Direct to /apply** = removes friction (don't make them find form again)
- Matches homepage primary CTA (brand consistency)

**Testing:**
1. Click button on chat empty state
2. Verify redirects to `/apply` (form), not homepage
3. Check button text reads "Start Your Analysis"
4. Verify yellow button styling maintained (Rule of Two compliant)

**Commit message:** `fix(chat): change CTA to outcome-focused "Start Your Analysis"`

---

### Priority 3: Final Review & Testing (30 mins)

#### Task 3.1: Manual User Flow Test
**Purpose:** Verify all changes work end-to-end as a real user would experience them.

**Test scenario:**
1. Open homepage: `http://localhost:3001`
2. Click "Get Started" button
3. **Step 1:** Select loan type (refinance)
4. **Step 2:** Fill contact info
   - Verify headline: "Your contact information" ✅
   - Verify timeline text appears ✅
   - Verify PDPA disclosure appears ✅
   - Verify placeholders are Singapore names ✅
5. Continue to Step 3 (property details)
6. Complete form (submit)
7. Navigate to chat: `http://localhost:3001/chat` (no conversation param)
   - Verify empty state: "Analysis not ready yet" ✅
   - Verify CTA: "Start Your Analysis" ✅
   - Click button, verify goes to `/apply` ✅

**Acceptance:** All 8 verification points pass with no visual bugs

---

#### Task 3.2: Build Verification
**Command:** `npm run build`

**Expected:** Build completes successfully with no errors or warnings

**If errors occur:**
- Check TypeScript errors in modified files
- Verify no missing imports
- Ensure all strings are properly escaped

**If warnings occur:**
- Review and fix if related to changes
- Ignore pre-existing warnings unrelated to this work

---

#### Task 3.3: Swiss Spa Finesse Audit

**Purpose:** Ensure changes achieve Swiss spa aesthetic beyond technical compliance.

**Audit checklist:**

**1. Calm (No Urgency)**
- [ ] No countdown timers or "Act now!" language
- [ ] No exclamation marks in body copy
- [ ] Tone is reassuring ("within 24 hours" not "GET IT NOW")

**2. Precision (Evidence-Backed)**
- [ ] Timeline stated ("within 24 hours")
- [ ] Privacy commitment stated ("PDPA-compliant")
- [ ] No vague promises ("soon", "fast", "quick")

**3. Understated (Minimal)**
- [ ] Headlines are functional, not clever
- [ ] No unnecessary decorative elements added
- [ ] Typography remains clean and professional

**4. Effortless (Invisible Intelligence)**
- [ ] No system terminology ("conversation found", "loading data")
- [ ] Copy sounds like human expert explaining
- [ ] Intelligence works behind scenes (user sees only outcomes)

**Pass criteria:** All 4 categories pass. If any fail, revise copy before final commit.

**Why this matters:** Swiss spa finesse is the brand DNA. Technical compliance alone isn't enough - the *feeling* must be right.

---

#### Task 3.4: Cross-Device Responsive Check

**Viewports to test:**
1. **Mobile:** 375px (iPhone SE)
2. **Tablet:** 768px (iPad)
3. **Desktop:** 1440px (standard laptop)

**For each viewport:**
- [ ] Text is readable (no tiny fonts)
- [ ] Buttons are tappable (44px+ height on mobile)
- [ ] No horizontal scroll
- [ ] Disclosure text doesn't overflow
- [ ] Layout looks intentional, not broken

**How to test:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select each preset device
4. Navigate through form and chat
5. Screenshot any issues

---

## Testing Strategy

**No automated tests required** - these are UX/copy changes with no logic modifications.

**Manual testing covers:**
1. Visual regression (screenshots before/after)
2. User flow completion (form Step 2 → chat empty state)
3. Responsive behavior (3 viewport sizes)
4. Swiss spa finesse (aesthetic audit)

**Build verification:**
- TypeScript compilation (no errors)
- Next.js build success

**Why no unit tests:**
- Changes are presentational copy only
- No functions or logic modified
- User flow test is the appropriate validation

---

## Rollback Plan

If visual bugs or user confusion occurs:

1. `git log` to find last good commit
2. `git revert {commit-hash}` to undo changes
3. Investigate issue offline
4. Retry with smaller, incremental changes

**Alternative:** Cherry-pick only the working commits:
```bash
git revert HEAD~3  # Undo last 3 commits
git cherry-pick {good-commit-1}
git cherry-pick {good-commit-2}
```

---

## Implementation Tips

### DRY (Don't Repeat Yourself)
- Timeline "within 24 hours" appears twice (form + chat) - this is intentional consistency, not duplication
- If it appears >3 times, consider extracting to `lib/constants/copy.ts`

### YAGNI (You Aren't Gonna Need It)
- **Don't** add new components for disclosure text (just use `<p>` tags)
- **Don't** create config files for placeholders yet (only 3 fields)
- **Don't** add i18n infrastructure unless explicitly requested

### TDD (Test-Driven Development)
- For copy changes, "test" = visual inspection + user flow
- No need to write test files first for presentational updates
- Manual testing IS the appropriate test for UX changes

### Frequent Commits
- Each task = one commit (use provided commit messages)
- Push after Priority 1 and Priority 2 complete (working checkpoints)
- Don't batch all changes into one giant commit

---

## Common Mistakes to Avoid

1. **Don't change component structure** - only modify text content and strings
2. **Don't alter Tailwind classes** - maintain existing styling
3. **Don't add new dependencies** - work with existing components
4. **Don't break form validation** - only touch display text, not logic
5. **Don't skip mobile testing** - 60% of users are on mobile

---

## File Summary

**Files to modify (2 files):**
1. `components/forms/ProgressiveFormWithController.tsx` - Tasks 1.1, 1.2, 1.3
2. `app/chat/page.tsx` - Tasks 2.1, 2.2

**Files to reference (read-only):**
1. `docs/content/voice-and-tone.md` - Brand voice guide
2. `docs/DESIGN_SYSTEM.md` - Swiss spa principles
3. `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` - Form structure

**No new files created**

---

## After Completion

1. Update `docs/work-log.md` with completion entry
2. Take before/after screenshots for documentation
3. Create completion report: `2025-11-07-form-chat-brand-alignment-COMPLETION.md`
4. Archive plan to `docs/plans/archive/2025/11/`
5. Notify Brent for stakeholder review

---

**Estimated total time:** 2-3 hours focused work
**Complexity:** Medium (copy changes + multi-file coordination)
**Risk level:** Low (no logic changes, easy rollback)
**Dependencies:** None (can run parallel to homepage implementation)
