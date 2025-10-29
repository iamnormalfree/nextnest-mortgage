---
status: active
priority: high
complexity: medium
estimated_hours: 3-4
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-016, CAN-036
---

# Form & Chat Brand Alignment

## Context

Update progressive mortgage form and AI broker chat UI to align with brand positioning per `docs/content/voice-and-tone.md` and `docs/DESIGN_SYSTEM.md`.

**Voice violations identified (2025-11-07 audit):**
1. **Casual tone:** "Let's get to know you" (conflicts with Swiss spa understated professionalism)
2. **System language:** "No Conversation Found" (exposes technical internals)
3. **Generic placeholders:** "John Doe", "+65 1234 5678" (not Singapore-context fluent)
4. **Missing disclosure:** No PDPA reassurance, no 24hr timeline context

## Implementation Guide

**All code examples, design specs, and testing procedures are in:**
`docs/runbooks/design/form-chat-brand-alignment-implementation.md`

This plan contains only decisions (what/why/when). Reference the runbook for implementation details (how).

## Success Criteria

- [x] Form headlines: Professional tone (no "Let's..." phrasing)
- [x] Chat empty state: Human-centered language (no "system" references)
- [x] Placeholders: Singapore naming conventions (Tan Wei Ming, 9123 4567)
- [x] Disclosures: PDPA + 24hr timeline visible on contact step
- [x] CTAs: Outcome-focused (not navigation-focused)
- [x] Error messages: Helpful tone (no "Invalid..." messaging)
- [x] Build: Passes without warnings
- [ ] Manual test: Complete form flow at 375px/768px/1440px

## Tasks

### Priority 1: Form Copy Updates (WHAT)

**WHY:** Form uses casual tone and generic placeholders that conflict with "sophisticatedly accessible" voice principle.

#### 1.1 Replace Casual Headline (Step 2)
- **Decision:** "Let's get to know you" → "Your contact information"
- **WHY:** "Let's" = overly casual, conflicts with Swiss spa understated tone
- **File:** `components/forms/ProgressiveFormWithController.tsx` (search for "Let's get to know you")
- **Implementation:** See runbook Task 1.1

#### 1.2 Add Privacy Disclosure & Timeline
- **Decision:** INSERT disclosure after Step 2 headline
- **Content:** "We'll send your analysis within 24 hours. Your data stays private, per PDPA."
- **WHY:** Grounded disclosure reduces form abandonment anxiety
- **Design:** Grey text (14px), 24px spacing below
- **File:** `components/forms/ProgressiveFormWithController.tsx` (after headline)
- **Implementation:** See runbook Task 1.2

#### 1.3 Update Placeholders to Singapore Names
- **Decision:** Replace all generic placeholders with Singapore-appropriate examples
  - "John Doe" → "Tan Wei Ming"
  - "+65 1234 5678" → "9123 4567"
  - "john.doe@example.com" → "weiming.tan@example.com"
- **WHY:** Singapore-context fluency (voice guide Pattern 6)
- **Files:** `lib/forms/form-config.ts` (if centralized) OR `ProgressiveFormWithController.tsx` (if inline)
- **Implementation:** See runbook Task 1.3 (includes property address formats)

---

### Priority 2: Chat UI Updates (WHAT)

**WHY:** Chat interface exposes system internals and uses navigation-focused CTAs instead of outcome-focused language.

#### 2.1 Replace System-Focused Empty State
- **Decision:** "No Conversation Found" → "Analysis not ready yet"
- **Content:** Add context: "Complete your information first, then we'll analyze your scenario."
- **Content:** Add timeline: "Typical analysis time: 24 hours"
- **WHY:** Outcome-focused (what you get) not system-focused (what failed)
- **File:** `app/chat/page.tsx` (search for "No Conversation Found")
- **Implementation:** See runbook Task 2.1

#### 2.2 Update Chat CTA Language
- **Decision:** "Go to Home" → "Start Your Analysis"
- **WHY:** Outcome-focused CTAs (voice guide principle: describe outcomes, not destinations)
- **Alternatives:** "Complete Your Form", "Get Your Analysis", "View Your Options" (context-dependent)
- **File:** `app/chat/page.tsx` (search for "Go to Home")
- **Implementation:** See runbook Task 2.2

---

### Priority 3: Optional Brand Touches (WHAT)

**WHY:** Consistency across all micro-copy touchpoints reinforces brand voice.

#### 3.1 Loading States (Optional)
- **Decision:** "Loading..." → "Preparing your analysis..."
- **Context-specific options:** "Checking your information...", "Comparing 16 banks..."
- **File:** Various (search for "Loading")
- **Implementation:** See runbook Task 3.1

#### 3.2 Error Message Tone (Optional)
- **Decision:** Replace harsh "Invalid..." with helpful guidance
- **Pattern:** Start with "Please...", explain what's needed (not what's wrong)
- **Examples:** "Invalid email" → "Please enter a valid email address"
- **File:** `lib/validation/mortgage-schemas.ts` (if centralized)
- **Implementation:** See runbook Task 3.2

#### 3.3 Confirmation/Transition Screen (Optional)
- **Decision:** Add handoff screen between form completion and chat
- **Content:** "Information received" headline, 24hr timeline reiteration, dashboard CTA
- **File:** `components/forms/ChatTransitionScreen.tsx` (if exists) or add to controller
- **Implementation:** See runbook Task 3.3

#### 3.4 Progress Indicators (Optional)
- **Decision:** Update step labels to plain language
  - "User Data Collection" → "Your Information"
  - "Income & Commitments Input" → "Financial Details"
- **File:** Form controller or config file
- **Implementation:** See runbook Task 3.4

---

### Priority 4: Testing & Verification (WHEN)

**WHY:** Ensure voice consistency across entire form/chat flow at all viewport sizes.

#### 4.1 Manual Browser Test
- **Flow:** Navigate Step 1 → Step 2 → Step 3 → Step 4 → Chat
- **Verify:** Headlines, disclosures, placeholders, CTAs, error states
- **Viewports:** 375px (mobile), 768px (tablet), 1440px (desktop)
- **Implementation:** See runbook (detailed checklist)

#### 4.2 Build Verification
- **Command:** `npm run build`
- **Expected:** No TypeScript errors, no warnings
- **Common issues:** Unclosed JSX tags, string literal escaping ("We'll")
- **Implementation:** See runbook Task 4.2

#### 4.3 Accessibility Check
- **Contrast:** Verify grey text (#666666) meets 4.5:1 minimum on white
- **Focus states:** All inputs have visible `focus:ring-2` indicator
- **Screen reader:** Labels associated with inputs, error messages use `aria-describedby`
- **Implementation:** See runbook (detailed accessibility section)

---

## Execution Order

1. **Form copy** (Tasks 1.1-1.3) - Low risk, immediate impact
2. **Chat UI** (Tasks 2.1-2.2) - Quick fixes
3. **Optional touches** (Tasks 3.1-3.4) - If time permits, consistency wins
4. **Testing** (Tasks 4.1-4.3) - Final verification

Commit after each priority group (1 commit per priority = 3-4 commits total).

---

## Voice Guide Quick Reference

**Key patterns for this plan:**
- **Pattern 1 (Active Voice):** "We'll send..." not "Your analysis will be sent..."
- **Pattern 4 (Honest Promises):** Only promise what you can guarantee (24hr timeline = grounded)
- **Pattern 5 (Grounded Disclosure):** Set expectations (timelines, privacy, process)
- **Pattern 6 (Singapore Fluency):** Local names, phone formats, property conventions

**Surface playbooks:**
- **Forms:** Calm, professional, clear purpose (see voice-and-tone.md Section 5.1)
- **Chat:** Conversational but professional, outcome-focused (see voice-and-tone.md Section 5.2)

---

## Related Documentation

- **Implementation guide:** `docs/runbooks/design/form-chat-brand-alignment-implementation.md`
- **Voice guide:** `docs/content/voice-and-tone.md` (read Sections 3 & 5)
- **Design system:** `docs/DESIGN_SYSTEM.md`
- **Forms architecture:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
- **Re-strategy:** `docs/plans/re-strategy/Part04-brand-ux-canon.md`

---

## Rollback Plan

If issues occur:
1. Revert last commit: `git revert HEAD`
2. Check dev server: `npm run dev`
3. Test form flow manually at localhost:3000
4. Investigate specific changes: `git diff HEAD~1`

---

## Notes

- All changes are copy/UX focused (no logic changes)
- Estimated 30 mins per task (3-4 hours total for Priority 1-2)
- Optional tasks (Priority 3) add 1-2 hours if pursued
- Form and chat can be updated in parallel (different files)
