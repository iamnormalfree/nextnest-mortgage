# Form & Chat Brand Alignment Implementation Guide

**ABOUTME:** Comprehensive implementation guide for aligning progressive form and AI broker chat with brand voice and design system.
**ABOUTME:** Contains all code examples, design specs, and testing procedures for executing form/chat brand alignment plan.

## Purpose

This runbook supports `docs/plans/active/2025-11-07-form-chat-brand-alignment.md`. It contains the detailed "how" while the plan contains the "what/why/when" decisions.

## Prerequisites

**Read these first:**
1. `docs/content/voice-and-tone.md` - Voice pillars, linguistic patterns, surface playbooks
2. `docs/DESIGN_SYSTEM.md` - Swiss spa finesse principles
3. `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md` - Form structure and patterns
4. Plan: `docs/plans/active/2025-11-07-form-chat-brand-alignment.md`

**Key principles:**
- **Sophisticatedly accessible:** Plain language, professionally understated (not overly friendly)
- **Active voice:** "We'll send..." not "System will..."
- **Grounded disclosure:** Set expectations (24hr timeline, PDPA compliance)
- **Singapore fluency:** Local naming conventions, comprehensible numbers

## Target Files

1. **`components/forms/ProgressiveFormWithController.tsx`** - Main form controller
2. **`app/chat/page.tsx`** - AI broker chat interface
3. **`components/forms/ChatTransitionScreen.tsx`** - Handoff screen (optional)
4. **`lib/validation/mortgage-schemas.ts`** - Error messages (optional)
5. **`lib/forms/form-config.ts`** - Form labels and placeholders (optional)

## Priority 1: Form Copy Updates

### Task 1.1: Replace Casual Headline in Step 2

**Location:** `components/forms/ProgressiveFormWithController.tsx` (search for "Let's get to know you")

**Current issue:** "Let's get to know you" is too casual for Swiss spa finesse

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
- "Let's" = conversational, informal
- "Your contact information" = direct, professional, clear purpose
- Maintains Swiss spa understated tone

**Alternative options (if context needs more warmth):**
- "Contact details" (minimal)
- "How we'll reach you" (slightly warmer, still professional)

**Testing:** Navigate to Step 2, verify headline reads professionally

---

### Task 1.2: Add Privacy Disclosure & Timeline

**Location:** `components/forms/ProgressiveFormWithController.tsx` (Step 2, after headline)

**Current issue:** Missing PDPA reassurance and timeline context (voice guide: grounded disclosure)

**Code to add:**
```typescript
<h2 className="text-2xl font-light text-[#000000] mb-2">
  Your contact information
</h2>
{/* ADD THIS: Privacy disclosure */}
<p className="text-sm text-[#666666] mb-6">
  We'll send your analysis within 24 hours.{' '}
  <span className="text-[#666666]">Your data stays private, per PDPA.</span>
</p>
```

**Design notes:**
- Font: `text-sm` (14px, smaller than body)
- Color: `text-[#666666]` (grey, de-emphasized but readable)
- Spacing: `mb-6` (24px below, creates breathing room before form fields)
- Tone: Active voice ("We'll send" not "You will receive")

**Why this matters:**
- **Timeline:** "24 hours" sets expectations (grounded promise)
- **Privacy:** "PDPA" signals Singapore compliance awareness
- **Reassurance:** Reduces form abandonment anxiety

**Testing:** Verify disclosure appears on Step 2, text is readable (4.5:1 contrast)

---

### Task 1.3: Update Form Placeholders to Singapore Names

**Location:** Multiple files - depends on where placeholders are defined

**Option A: Centralized config** (preferred)
If placeholders come from `lib/forms/form-config.ts` or similar:

**Before:**
```typescript
export const formConfig = {
  contactInfo: {
    fullName: {
      placeholder: 'John Doe'
    },
    phone: {
      placeholder: '+65 1234 5678'
    },
    email: {
      placeholder: 'john.doe@example.com'
    }
  }
}
```

**After:**
```typescript
export const formConfig = {
  contactInfo: {
    fullName: {
      placeholder: 'Tan Wei Ming'
    },
    phone: {
      placeholder: '9123 4567'
    },
    email: {
      placeholder: 'weiming.tan@example.com'
    }
  }
}
```

**Option B: Inline in component**
If placeholders are hardcoded in `ProgressiveFormWithController.tsx`:

Search for:
- `placeholder="John Doe"` → Replace with `placeholder="Tan Wei Ming"`
- `placeholder="+65 1234 5678"` → Replace with `placeholder="9123 4567"`
- `placeholder="john.doe@example.com"` → Replace with `placeholder="weiming.tan@example.com"`

**Singapore naming conventions:**
- **Common surnames:** Tan, Lim, Lee, Ng, Wong, Chen, Ong
- **Common given names:** Wei Ming, Xiao Ming, Kai Li, Jun Wei, Hui Ling
- **Phone format:** 8-digit mobile (9XXX XXXX or 8XXX XXXX), no +65 prefix in placeholder
- **Email:** firstname.lastname pattern common in professional context

**Additional property-related placeholders:**
- Property address: "Blk 123 Ang Mo Kio Ave 3 #12-345" (HDB format)
- Property address: "The Sail @ Marina Bay, #15-02" (private condo format)
- Postal code: "560123" (6 digits)

**Testing:** Fill out form, verify placeholders feel locally appropriate

---

## Priority 2: Chat UI Updates

### Task 2.1: Replace System-Focused Empty State

**Location:** `app/chat/page.tsx` (search for "No Conversation Found")

**Current issue:** "No Conversation Found" exposes system internals, technical language

**Before:**
```typescript
<div className="text-center py-12">
  <h3 className="text-xl font-semibold text-[#000000] mb-2">
    No Conversation Found
  </h3>
  <p className="text-base text-[#666666]">
    Start a new conversation to get mortgage advice
  </p>
</div>
```

**After:**
```typescript
<div className="text-center py-12">
  <h3 className="text-xl font-semibold text-[#000000] mb-2">
    Analysis not ready yet
  </h3>
  <p className="text-base text-[#666666] mb-4">
    Complete your information first, then we'll analyze your scenario.
  </p>
  <p className="text-xs text-[#666666]">
    Typical analysis time: 24 hours
  </p>
</div>
```

**Changes explained:**
- "No Conversation Found" → "Analysis not ready yet" (outcome-focused, not system-focused)
- Added context: "Complete your information first" (clear next step)
- Added timeline: "24 hours" (grounded disclosure)
- Tone: Calm, helpful (not error-like)

**Design notes:**
- Headline: `text-xl font-semibold` (20px, weight 600)
- Body: `text-base` (16px, weight 400)
- Timeline: `text-xs` (12px, de-emphasized)
- No yellow (not a CTA, informational only)

---

### Task 2.2: Update Chat CTA Language

**Location:** `app/chat/page.tsx` (search for "Go to Home" or similar navigation CTAs)

**Current issue:** "Go to Home" is navigation-focused, not outcome-focused

**Before:**
```typescript
<button className="px-6 py-3 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614]">
  Go to Home
</button>
```

**After:**
```typescript
<button className="px-6 py-3 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614]">
  Start Your Analysis
</button>
```

**Alternative CTAs (context-dependent):**
- "Complete Your Form" (if form is incomplete)
- "Get Your Analysis" (if form is complete, awaiting chat)
- "View Your Options" (if analysis is ready)

**Voice guide principle:** CTAs describe outcomes, not destinations
- ❌ "Go to Form", "Back to Homepage"
- ✅ "Start Your Analysis", "See Your Options"

---

## Priority 3: Additional Brand Touches (Optional)

### Task 3.1: Loading States

**Pattern:** Replace generic "Loading..." with brand-aligned language

**Before:**
```typescript
<p>Loading...</p>
```

**After:**
```typescript
<p className="text-sm text-[#666666]">
  Preparing your analysis...
</p>
```

**Other loading context options:**
- "Checking your information..." (form validation)
- "Comparing 16 banks..." (analysis running)
- "Preparing your recommendations..." (final stage)

---

### Task 3.2: Error Message Tone

**Location:** `lib/validation/mortgage-schemas.ts` or inline validation messages

**Pattern:** Replace harsh "Invalid..." with helpful guidance

**Before:**
```typescript
.refine(value => value > 0, {
  message: 'Invalid amount'
})
```

**After:**
```typescript
.refine(value => value > 0, {
  message: 'Please enter an amount greater than $0'
})
```

**Voice guide principles for errors:**
- Start with "Please..." (polite request)
- Explain what's needed, not what's wrong
- Provide context when helpful

**Examples:**

| ❌ Harsh | ✅ Helpful |
|---------|-----------|
| "Invalid email" | "Please enter a valid email address" |
| "Required field" | "We need this to prepare your analysis" |
| "Must be a number" | "Please enter numbers only" |
| "Out of range" | "Amount must be between $100K and $5M" |

---

### Task 3.3: Confirmation/Transition Screen

**Location:** `components/forms/ChatTransitionScreen.tsx` (if exists) or add to form controller

**Purpose:** Smooth handoff between form completion and AI broker chat

**Recommended copy:**
```typescript
<div className="text-center py-16">
  <div className="mb-6">
    {/* Success icon or checkmark */}
    <div className="w-16 h-16 mx-auto bg-[#000000] text-white flex items-center justify-center text-3xl">
      ✓
    </div>
  </div>

  <h2 className="text-2xl font-light text-[#000000] mb-3">
    Information received
  </h2>

  <p className="text-base text-[#666666] mb-2 max-w-md mx-auto">
    We'll analyze your scenario against 16 banks and send your personalized comparison within 24 hours.
  </p>

  <p className="text-sm text-[#666666] mb-8">
    Check your email ({userEmail}) for updates.
  </p>

  <button className="px-8 py-4 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614]">
    View Your Dashboard
  </button>
</div>
```

**Design notes:**
- Checkmark: Black square (sharp corners, Swiss spa), white icon
- Headlines: Light weight (300), professional tone
- Timeline: "24 hours" repeated (reinforces grounded disclosure)
- Personalization: Shows user's email (confirms correct contact)
- CTA: Outcome-focused ("View Your Dashboard" not "Go to Dashboard")

---

### Task 3.4: Progress Indicators

**Pattern:** Replace technical labels with plain language

**Before:**
```typescript
<div className="text-sm text-[#666666]">
  Step 2 of 4: User Data Collection
</div>
```

**After:**
```typescript
<div className="text-sm text-[#666666]">
  Step 2 of 4: Your Information
</div>
```

**Step labels (voice-aligned):**
- Step 1: "Property & Loan" (not "Property Selection")
- Step 2: "Your Information" (not "User Data")
- Step 3: "Financial Details" (not "Income & Commitments Input")
- Step 4: "Confirmation" (not "Data Validation")

---

## Design System Compliance

### Typography
- Headlines (form steps): `text-2xl font-light` (24px, weight 300)
- Subheadings: `text-xl font-semibold` (20px, weight 600)
- Body text: `text-base` (16px, weight 400)
- Helper text: `text-sm` (14px, weight 400)
- Captions/timestamps: `text-xs` (12px, weight 400)

**NEVER use font-weight 500** (not in design system)

### Colors
- Headlines: `text-[#000000]` (black)
- Body text: `text-[#666666]` (grey)
- Helper text: `text-[#666666]` (grey)
- Error text: `text-[#DC2626]` (red, only for errors)
- Success: `text-[#059669]` (green, for confirmations)
- Borders: `border-[#E5E5E5]` (light grey)

**Yellow usage:**
- Primary CTAs only: `bg-[#FCD34D]` with hover `bg-[#FBB614]`
- NO yellow for badges, labels, or decorative elements
- Rule of Two: Max 2 yellow elements per viewport

### Spacing (8px System)
- Section gaps: `mb-8` (32px), `mb-12` (48px)
- Field gaps: `mb-4` (16px), `mb-6` (24px)
- Inline spacing: `mb-2` (8px)

### Corners (Sharp Rectangles)
- **NO rounded corners** anywhere
- Form inputs: `border` (no `rounded-lg`)
- Buttons: Square corners (no `rounded-md`)
- Cards: Sharp edges (Swiss spa principle)

### Effects
- Transitions: `transition-colors duration-200` (200ms max)
- NO scale transforms (`hover:scale-105`)
- NO shadows (except subtle `shadow-sm` for elevation)
- Focus states: `focus:ring-2 focus:ring-[#000000]` (black ring, accessible)

---

## Testing Procedures

### Manual Browser Testing

**Form flow (Step 2):**
1. Navigate to Step 2
2. Verify headline: "Your contact information" (not "Let's get to know you")
3. Verify disclosure appears: "We'll send your analysis within 24 hours..."
4. Verify placeholders: "Tan Wei Ming", "9123 4567", "weiming.tan@example.com"
5. Fill form with valid data, proceed to Step 3
6. Return to Step 2, verify changes persist

**Chat empty state:**
1. Navigate to `/chat` without completing form
2. Verify headline: "Analysis not ready yet" (not "No Conversation Found")
3. Verify helpful context: "Complete your information first..."
4. Verify timeline: "Typical analysis time: 24 hours"
5. Click CTA, verify it says "Start Your Analysis" (not "Go to Home")

**Error states:**
1. Leave required field empty, trigger validation
2. Verify error message starts with "Please..." (helpful tone)
3. Verify error color: red text, no yellow
4. Fix error, verify success state is calm (green check, not celebratory)

### Build Verification

```bash
npm run build
```

**Expected:** No TypeScript errors, no warnings, build succeeds

**Common issues:**
- Unclosed JSX tags
- Missing imports (if you extracted config)
- String literals need escaping (apostrophes in "We'll")

### Accessibility Checks

**Contrast ratios:**
- Black on white: 21:1 (AAA)
- Grey (#666666) on white: 5.7:1 (AA)
- Red (#DC2626) on white: 5.9:1 (AA)

**Focus states:**
- All form inputs: `focus:ring-2 focus:ring-[#000000]`
- All buttons: Visible focus indicator
- Tab order: Logical (top to bottom, left to right)

**Screen reader:**
- Labels: All inputs have associated `<label>` tags
- Error messages: Use `aria-describedby` to link to input
- Loading states: Use `aria-live="polite"` for updates

---

## Voice Guide Quick Reference

### Linguistic Patterns

**Pattern 1: Active Voice**
- ✅ "We'll send your analysis..."
- ❌ "Your analysis will be sent..."

**Pattern 4: Honest Promises**
- ✅ "We'll send your analysis within 24 hours"
- ❌ "Instant analysis" (can't guarantee)

**Pattern 5: Grounded Disclosure**
- ✅ "Typical analysis time: 24 hours"
- ❌ "Fast turnaround" (vague)

**Pattern 6: Singapore Context Fluency**
- ✅ "Blk 123 Ang Mo Kio Ave 3"
- ❌ "123 Main Street, Apt 4B"

### Surface-Specific Playbook: Forms

**Tone:** Calm, professional, clear purpose
**Avoid:** Enthusiasm ("Awesome!"), urgency ("Hurry!"), casualness ("Hey there!")
**Use:** Direct language, plain explanations, visible timelines

**Examples:**
- Headlines: "Your contact information" (not "Let's get to know you!")
- Disclosures: "Your data stays private, per PDPA" (not "Don't worry, we're secure!")
- CTAs: "Continue to financial details" (not "Next step →")

### Surface-Specific Playbook: AI Broker Chat

**Tone:** Conversational but professional, outcome-focused
**Avoid:** System references ("bot", "AI", "algorithm"), error jargon ("404", "Not Found")
**Use:** Human language ("We're analyzing...", "Here are your options...")

**Examples:**
- Empty state: "Analysis not ready yet" (not "No Conversation Found")
- Loading: "Comparing 16 banks..." (not "Processing request...")
- Results: "We found 3 packages that match" (not "Query returned 3 results")

---

## Common Mistakes to Avoid

### ❌ Don't Do This

**Mistake 1: Overly casual tone**
```typescript
// NO
<h2>Let's get started! 🚀</h2>
<p>We're super excited to help you find the perfect mortgage!</p>
```

**Mistake 2: System-focused language**
```typescript
// NO
<p>No conversation found in database</p>
<p>Error: User session not initialized</p>
```

**Mistake 3: Generic placeholders**
```typescript
// NO
<input placeholder="John Smith" />
<input placeholder="+1 555-1234" />
```

**Mistake 4: Vague promises**
```typescript
// NO
<p>We'll get back to you soon!</p>
<p>Fast turnaround guaranteed!</p>
```

**Mistake 5: Missing context**
```typescript
// NO
<button>Submit</button> // Submit what? For what purpose?
```

### ✅ Do This Instead

**Correct 1: Professional, understated tone**
```typescript
<h2 className="text-2xl font-light">Your contact information</h2>
<p className="text-sm text-[#666666]">
  We'll send your analysis within 24 hours.
</p>
```

**Correct 2: Outcome-focused language**
```typescript
<p>Analysis not ready yet</p>
<p>Complete your information first, then we'll analyze your scenario.</p>
```

**Correct 3: Singapore-appropriate placeholders**
```typescript
<input placeholder="Tan Wei Ming" />
<input placeholder="9123 4567" />
```

**Correct 4: Grounded promises with timelines**
```typescript
<p>We'll send your analysis within 24 hours.</p>
<p>Typical analysis time: 24 hours</p>
```

**Correct 5: Clear, outcome-focused CTAs**
```typescript
<button>Start Your Analysis</button>
<button>View Your Options</button>
```

---

## Commit Messages

Follow conventional commits format:

**Form copy updates:**
```bash
fix(forms): update Step 2 headline to professional tone per voice guide
feat(forms): add PDPA disclosure and 24hr timeline to contact step
fix(forms): update placeholders to Singapore naming conventions
```

**Chat UI updates:**
```bash
fix(chat): replace system-focused empty state with helpful context
fix(chat): update CTA to outcome-focused language
```

**Error message improvements:**
```bash
fix(validation): update error messages to helpful tone per voice guide
```

---

## Related Documentation

- **Plan:** `docs/plans/active/2025-11-07-form-chat-brand-alignment.md`
- **Voice Guide:** `docs/content/voice-and-tone.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Forms Architecture:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
- **Re-Strategy:** `docs/plans/re-strategy/Part04-brand-ux-canon.md`

---

## Questions or Issues

If you encounter ambiguity:
1. Check voice guide first (`docs/content/voice-and-tone.md` - Section 3: Linguistic Patterns)
2. Refer to surface playbooks (`voice-and-tone.md` - Section 5: Surface-Specific Playbooks)
3. When in doubt, choose: plain language over jargon, helpful over harsh, professional over casual
