# Lead Form to AI Broker Chat Handoff Optimization Plan

**Date**: 2025-11-01
**Status**: Active
**Priority**: P0 (Critical - Users Cannot Reach AI Brokers)
**Complexity**: Medium
**Estimated Duration**: 2-3 days

## Executive Summary

This plan addresses two critical issues preventing users from successfully transitioning from the lead form to AI broker chat:

1. **BLOCKER**: Chat transition screen never triggers after form completion
2. **UX FRICTION**: Information overload and form fatigue cause drop-off before users reach AI brokers

Both issues must be fixed to achieve the core business goal: getting users chatting with AI mortgage specialists smoothly and confidently.

## Context for New Engineers

### What Is This Project?

NextNest is a mortgage lead capture website for the Singapore market. The core user flow is:

1. User fills out a 4-step progressive form about their mortgage needs
2. Form provides instant mortgage calculations powered by "Dr Elena v2" (a persona-driven calculation engine)
3. User transitions to live chat with an AI mortgage specialist (via Chatwoot)
4. AI specialist helps user through their mortgage journey

**Current Problem**: Step 3 → Step 4 transition is broken. Users complete the form but never reach the AI broker.

### Key Technical Concepts

- **Progressive Form**: 4-step form that builds trust through progressive disclosure (ask for contact info only after showing value)
- **Dr Elena v2 Persona**: Authoritative calculation engine that outputs persona-driven reason codes (like `msr_binding`, `ltv_first_loan`) which must be translated to user-friendly language
- **Instant Calculation**: Real-time mortgage calculations shown as user fills property details (Step 3)
- **MAS Compliance**: Singapore Monetary Authority regulations for TDSR (Total Debt Servicing Ratio) and MSR (Mortgage Servicing Ratio)
- **ChatTransitionScreen**: Loading screen component that should appear after Step 4, creates Chatwoot contact, and redirects to chat

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Forms**: React Hook Form + Zod validation
- **State**: React hooks (no Redux/Zustand)
- **Styling**: Tailwind CSS (design system: 90% monochrome + 10% yellow accent, sharp rectangles only)
- **Chat**: Chatwoot integration via `/api/chatwoot-contact-from-lead` endpoint
- **Testing**: Jest + React Testing Library (see `components/forms/__tests__/` for examples)

### File Structure Overview

```
app/apply/page.tsx                              # Main form page route
components/forms/
  ProgressiveFormWithController.tsx             # Main form component (UI layer)
  ChatTransitionScreen.tsx                      # Transition screen to chat
  sections/
    Step3NewPurchase.tsx                        # Step 3 (property details) for new purchase
    Step3Refinance.tsx                          # Step 3 (property details) for refinance
hooks/
  useProgressiveFormController.ts               # Form state controller (business logic)
lib/
  calculations/
    instant-profile.ts                          # Dr Elena v2 calculation engine
    dr-elena-constants.ts                       # Dr Elena persona constants and limits
  forms/
    form-config.ts                              # Form step definitions and defaults
  contracts/
    form-contracts.ts                           # TypeScript interfaces for form data
  validation/
    mortgage-schemas.ts                         # Zod validation schemas
```

### Important Development Principles (From CLAUDE.md)

1. **TDD (Test-Driven Development)**: Write failing test → Make it pass → Refactor
2. **DRY (Don't Repeat Yourself)**: Refactor duplication even if tedious
3. **YAGNI (You Aren't Gonna Need It)**: Don't add features we don't need right now
4. **Frequent Commits**: Commit after each passing test or small working change
5. **NO shortcuts**: Doing it right > doing it fast

---

## Problem 1: Chat Transition Blocker (P0)

### Root Cause Analysis

**File**: `components/forms/ProgressiveFormWithController.tsx`
**Lines**: 105-111

```typescript
onFormComplete: (data) => {
  setIsFormCompleted(true)
  // Trigger chat transition if needed
  if (currentStep === 2) { // Step 3 would be index 2
    setShowChatTransition(true)
  }
}
```

**The Bug**:

The `onFormComplete` callback checks `if (currentStep === 2)`, but when the user clicks "Connect with AI Mortgage Specialist" on Step 4, `currentStep` is `3` (because steps are 0-indexed: 0=Loan Type, 1=Contact, 2=Property, 3=Finance).

The comment says "Step 3 would be index 2" but that's incorrect. The form has 4 steps with indices 0, 1, 2, 3. The final step (Your Finances) is index 3, not 2.

**Why This Happens**:

Looking at `lib/forms/form-config.ts`, the `formSteps` array has 4 entries:
- Step 0: Loan Type
- Step 1: Who You Are
- Step 2: What You Need
- Step 3: Your Finances

The controller's `onFormComplete` is called from `hooks/useProgressiveFormController.ts` at line 570:

```typescript
// Handle form completion
if (isLastStep && onFormComplete) {
  try {
    onFormComplete(leadForm.formData)
  } catch (error) {
    console.error('⚠️ Form completion callback failed:', error)
  }
}
```

Where `isLastStep = currentStep === formSteps.length - 1` (line 523). So when `currentStep = 3` and `formSteps.length = 4`, `isLastStep = true`, and `onFormComplete` fires. But the check inside the callback is wrong.

**Evidence from Browser Testing**:

Console logs show:
```
Gate 3 completed with data: {loanType: new_purchase, name: John Tan, ...}
```

This confirms `onFormComplete` IS being called, but `setShowChatTransition(true)` is NOT being executed because `currentStep === 2` is false.

---

## Problem 2: UX Friction Points

### Issue 2A: Information Overload in Instant Analysis (Step 3)

**File**: `components/forms/sections/Step3NewPurchase.tsx`
**Lines**: 244-394

**Current Behavior**:

After user enters 4 property fields (category, type, price, age) and clicks "Get instant loan estimate", the UI shows:

```
✨ Your Personalized Analysis

MAXIMUM LOAN AMOUNT
$284,000 [75% LTV]
Limiting factor: MSR

ESTIMATED MONTHLY PAYMENT
$1,246/mo [@ 2.3% assumed rate]

DOWN PAYMENT REQUIRED
$216,000 [43.2% down]
├─ Cash required: $0
└─ CPF allowed: $216,000
└─ Persona min cash (0%): $0

Tenure capped at 25 years (regulation).

Reason codes:
• msr_binding
• tenure_cap_property_limit

Policy references:
• MAS Notice 645
• MAS Notice 632
• mas_tenure_cap_hdb
• cpf_accrued_interest

💡 Complete Step 3 to unlock:
🔒 TDSR/MSR compliance check
🔒 Stamp duty calculation
🔒 23 bank comparisons
```

**Problems**:

1. **Too much information at once**: 4 metrics + technical jargon + locked features
2. **Technical codes exposed**: `msr_binding`, `tenure_cap_property_limit` mean nothing to users
3. **No emotional "wow moment"**: Data dump instead of excitement
4. **Locked features create FOMO**: May motivate OR may discourage (unclear)
5. **Poor visual hierarchy**: Everything has equal weight

**Dr Elena v2 Context**:

The calculation engine (`lib/calculations/instant-profile.ts`) returns `reasonCodes` and `policyRefs` arrays that are meant for internal tracking and AI broker context, NOT for direct user display. These codes should be:

- Stored in form data for AI broker to reference
- Translated to plain English for users
- Simplified to 1-2 key insights max

**User Psychology**:

At this step, the user has:
- Given name, email, phone (trust commitment made)
- Shared basic property info (still exploring)
- NOT yet shared income (withholding sensitive data)

They need:
- **Validation**: "Yes, this is possible for you"
- **Clarity**: One big number they understand
- **Momentum**: Clear next step that feels easy

### Issue 2B: Step 4 Form Fatigue

**File**: `components/forms/sections/Step3NewPurchase.tsx` (despite name, this renders Step 4 content)
**Lines**: 412-689

**Current Behavior**:

Step 4 (Your Finances) requires:
1. Toggle: Adding joint applicant? (Yes/No)
2. Monthly income (number input)
3. Variable/bonus income (number input)
4. Your age (number input)
5. Employment type (dropdown)
6. Property loans checkbox
7. Car loans checkbox
8. Credit cards checkbox
9. Personal lines checkbox
10. Other commitments (free text)

**Total**: 10+ interactions before "Connect with AI Mortgage Specialist" button is enabled.

**Problems**:

1. **Sharp drop from "wow" to "work"**: Step 3 gave instant gratification, Step 4 feels tedious
2. **Redundant age input**: User already entered "Combined Age" in Step 2 (line 35 of form-config.ts)
3. **No incremental value shown**: MAS Readiness shows 0.0% until ALL fields filled
4. **Commitment expansion WITHOUT dead-end prevention**: User must expand each loan type even if they have none
5. **No smart defaults**: Every field starts empty (except employment type)

**Dr Elena v2 Context**:

The MAS Readiness Check calculation requires:
- Income (for TDSR/MSR ratios)
- Age (for tenure limits)
- Liabilities (for debt servicing ratio)

But it can run with PARTIAL data. The current implementation doesn't update MAS Readiness until the "Connect" button is clicked, missing opportunity for live feedback.

**User Psychology**:

At this step, the user has:
- Seen their potential loan amount (excited)
- Committed contact info (invested)
- Started financial disclosure (vulnerable)

They need:
- **Progress feedback**: See MAS Readiness update LIVE as they type
- **Minimal friction**: Pre-fill what we already know (age from Step 2)
- **Quick path**: "No loans" should be one click, not 4 checkboxes

---

## Implementation Plan

### Overview

This plan is broken into 9 bite-sized tasks that can be completed in sequence with TDD. Each task includes:
- Clear acceptance criteria
- Files to modify
- Test strategy
- Commit message template

**Estimated Timeline**: 2-3 days for a skilled developer new to the codebase

### Task Dependencies

```
Task 1 (Fix chat transition)
  ↓
Task 2 (Test chat transition) → BLOCKER RESOLVED, ship if needed
  ↓
Task 3 (Simplify instant analysis UI)
  ↓
Task 4 (Test instant analysis)
  ↓
Task 5 (Pre-fill age in Step 4)
  ↓
Task 6 (Test age pre-fill)
  ↓
Task 7 (Add live MAS Readiness updates)
  ↓
Task 8 (Test live MAS updates)
  ↓
Task 9 (Simplify commitment inputs)
  ↓
Task 10 (Test commitment inputs) → ALL TASKS COMPLETE
```

---

## Task 1: Fix Chat Transition Trigger

**Objective**: Make `ChatTransitionScreen` appear after user completes Step 4.

**Priority**: P0 (Blocker)
**Complexity**: Low
**Time Estimate**: 30 minutes

### Acceptance Criteria

- [ ] When user clicks "Connect with AI Mortgage Specialist" on Step 4, `ChatTransitionScreen` component renders
- [ ] Console logs show `setShowChatTransition(true)` being called
- [ ] Form disappears and transition screen appears with loading animation

### Files to Modify

**File**: `components/forms/ProgressiveFormWithController.tsx`

### Current Code (Lines 105-111)

```typescript
onFormComplete: (data) => {
  setIsFormCompleted(true)
  // Trigger chat transition if needed
  if (currentStep === 2) { // Step 3 would be index 2
    setShowChatTransition(true)
  }
}
```

### New Code

```typescript
onFormComplete: (data) => {
  setIsFormCompleted(true)
  // Trigger chat transition if needed
  if (currentStep === 3) { // Step 4 (Your Finances) is index 3
    setShowChatTransition(true)
  }
}
```

**Change**: `currentStep === 2` → `currentStep === 3`

**Why**: The form has 4 steps (indices 0, 1, 2, 3). Step 4 (Your Finances) is index 3, not 2.

### Testing Strategy

**Manual Test** (Playwright):

1. Navigate to `http://localhost:3003/apply?loanType=new_purchase`
2. Fill Step 2 (contact info) → Click "Continue to property details"
3. Fill Step 3 (property details) → Click "Get instant loan estimate"
4. Fill Step 4 (financial details) → Click "Connect with AI Mortgage Specialist"
5. **EXPECTED**: `ChatTransitionScreen` appears with "Connecting you with an AI mortgage specialist..." message
6. **VERIFY**: Console shows no errors, form is hidden

**Automated Test** (to be written in Task 2):

See Task 2 for test file creation.

### How to Test This Task

```bash
# Start dev server
npm run dev

# In browser, navigate to:
http://localhost:3003/apply?loanType=new_purchase

# Fill form through all 4 steps and verify transition screen appears
```

### Commit Message Template

```
fix: correct chat transition step index check

The onFormComplete callback was checking currentStep === 2,
but Step 4 (Your Finances) is index 3 in the 4-step form
(indices 0, 1, 2, 3). This prevented ChatTransitionScreen
from ever rendering.

Updated check to currentStep === 3 to trigger transition
after final step completion.

Verified manually via Playwright browser testing.

Refs: #ISSUE_NUMBER
```

### Documentation to Review

- `lib/forms/form-config.ts` - See `formSteps` array for step indices
- `hooks/useProgressiveFormController.ts` - See how `onFormComplete` is triggered

---

## Task 2: Add Test for Chat Transition

**Objective**: Ensure Task 1 fix doesn't regress.

**Priority**: P0
**Complexity**: Low
**Time Estimate**: 45 minutes

### Acceptance Criteria

- [ ] Test file created and passing
- [ ] Test verifies `ChatTransitionScreen` renders after Step 4 completion
- [ ] Test uses realistic form data matching Dr Elena v2 expectations
- [ ] Test runs in CI without errors

### Files to Create

**File**: `components/forms/__tests__/ChatTransition.test.tsx`

### Test Code

```typescript
/**
 * ABOUTME: Tests for chat transition screen triggering after form completion.
 * ABOUTME: Ensures users successfully reach AI broker chat interface.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

// Mock ChatTransitionScreen to avoid Chatwoot API calls in tests
jest.mock('../ChatTransitionScreen', () => {
  return function MockChatTransitionScreen() {
    return <div data-testid="chat-transition-screen">Connecting to AI broker...</div>
  }
})

describe('Chat Transition After Form Completion', () => {
  it('should show ChatTransitionScreen after completing Step 4', async () => {
    const user = userEvent.setup()
    const mockOnStepCompletion = jest.fn()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session-123"
        onStepCompletion={mockOnStepCompletion}
      />
    )

    // Step 1: Fill loan type (pre-filled by loanType prop)
    // Step 2: Fill contact info
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const phoneInput = screen.getByLabelText(/phone/i)

    await user.type(nameInput, 'John Tan')
    await user.type(emailInput, 'john.tan@example.com')
    await user.type(phoneInput, '91234567')

    const continueBtn = screen.getByRole('button', { name: /continue to property details/i })
    await user.click(continueBtn)

    // Step 3: Fill property details
    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })

    // Note: Fields are pre-filled with defaults from form-config.ts
    // Just need to click "Get instant loan estimate"
    const estimateBtn = screen.getByRole('button', { name: /get instant loan estimate/i })
    await user.click(estimateBtn)

    // Step 4: Fill financial details
    await waitFor(() => {
      expect(screen.getByLabelText(/monthly income/i)).toBeInTheDocument()
    })

    // Note: Income and age have defaults (5000, 30 from form-config.ts)
    // Just need to click "Connect with AI Mortgage Specialist"
    const connectBtn = screen.getByRole('button', { name: /connect with ai mortgage specialist/i })
    await user.click(connectBtn)

    // VERIFY: ChatTransitionScreen should appear
    await waitFor(() => {
      expect(screen.getByTestId('chat-transition-screen')).toBeInTheDocument()
    }, { timeout: 3000 })

    // VERIFY: Form should be hidden
    expect(screen.queryByLabelText(/monthly income/i)).not.toBeInTheDocument()
  })

  it('should NOT show ChatTransitionScreen before Step 4 completion', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session-123"
      />
    )

    // Fill Step 2
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john.tan@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue to property details/i }))

    // Fill Step 3
    await waitFor(() => {
      expect(screen.getByLabelText(/property category/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: ChatTransitionScreen should NOT appear yet
    await waitFor(() => {
      expect(screen.getByLabelText(/monthly income/i)).toBeInTheDocument()
    })
    expect(screen.queryByTestId('chat-transition-screen')).not.toBeInTheDocument()
  })
})
```

### How to Run This Test

```bash
# Run this specific test file
npm test -- ChatTransition.test.tsx

# Run all form tests
npm test -- components/forms/__tests__

# Run in watch mode during development
npm test -- --watch ChatTransition.test.tsx
```

### Test Design Notes

**Why Mock ChatTransitionScreen?**

The real `ChatTransitionScreen` component calls `/api/chatwoot-contact-from-lead` which requires:
- Valid Chatwoot API credentials
- Database connection
- Network requests

Mocking it isolates the test to ONLY verify the transition logic, not the Chatwoot integration.

**Why Use Realistic Form Data?**

The form has complex validation rules (Zod schemas in `lib/validation/mortgage-schemas.ts`). Using realistic data ensures the test reflects real user behavior.

**Why Two Test Cases?**

1. **Positive case**: Verify transition DOES happen after Step 4
2. **Negative case**: Verify transition does NOT happen prematurely

Both cases prevent regressions.

### Commit Message Template

```
test: add chat transition trigger verification

Added tests to ensure ChatTransitionScreen renders after
Step 4 completion and NOT before. Mocks ChatTransitionScreen
to avoid Chatwoot API dependencies.

Tests verify the fix from previous commit (currentStep === 3
check) and prevent future regressions.

All tests passing.

Refs: #ISSUE_NUMBER
```

### Documentation to Review

- Existing test examples: `components/forms/__tests__/ProgressiveFormWithController.test.tsx`
- Testing library docs: https://testing-library.com/docs/react-testing-library/intro/

---

## Task 3: Simplify Instant Analysis Display

**Objective**: Reduce information overload in Step 3 instant analysis to create a "wow moment" instead of data dump.

**Priority**: P1 (High - Reduces Drop-off)
**Complexity**: Medium
**Time Estimate**: 2 hours

### Acceptance Criteria

- [ ] Instant analysis shows ONE primary metric prominently (max loan amount)
- [ ] Technical persona codes (`msr_binding`, etc.) are hidden from users
- [ ] User-friendly summary (1-2 sentences) replaces technical jargon
- [ ] Optional: "View details" expandable section for interested users
- [ ] Design matches sophisticated flow design system (sharp rectangles, yellow accent)

### Files to Modify

**File**: `components/forms/sections/Step3NewPurchase.tsx`

### Current Code Structure (Lines 244-394)

The instant analysis card currently has 4 sections:
1. Maximum Loan Amount (with LTV %)
2. Estimated Monthly Payment (with rate assumption)
3. Down Payment Required (with CPF breakdown)
4. Guidance + Reason Codes + Policy Refs + Locked Features

### New Code Structure

**Simplified View** (Default):

```tsx
{/* Instant Analysis - Simplified */}
<div className="bg-white border border-[#E5E5E5] p-8">
  <h4 className="text-2xl font-semibold text-[#000000] mb-4">
    ✨ You qualify for up to
  </h4>

  <div className="text-5xl font-semibold text-[#000000] mb-6">
    ${formatCurrency(instantCalcResult.maxLoanAmount)}
  </div>

  <p className="text-[#666666] text-base mb-8">
    {generateUserFriendlySummary(instantCalcResult)}
  </p>

  <button
    onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
    className="text-[#666666] hover:text-[#000000] underline"
  >
    {showAnalysisDetails ? 'Hide details' : 'View full breakdown'}
  </button>

  {showAnalysisDetails && (
    <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
      {/* Existing detailed metrics */}
      <div className="grid gap-4">
        <MetricRow
          label="Monthly Payment"
          value={`$${formatCurrency(monthlyPayment)}/mo`}
          hint={`@ ${assumedRate}% assumed rate`}
        />
        <MetricRow
          label="Down Payment"
          value={`$${formatCurrency(downPayment)}`}
          hint={`${downPaymentPercent}% of property price`}
        />
        {/* Add more detailed metrics here */}
      </div>
    </div>
  )}
</div>
```

### Helper Function: `generateUserFriendlySummary`

Add this function to translate Dr Elena persona codes into plain English:

```typescript
/**
 * Translates Dr Elena v2 persona codes into user-friendly summary
 *
 * @param calcResult - Result from calculateNewPurchaseProfile
 * @returns 1-2 sentence summary explaining the result in plain English
 */
function generateUserFriendlySummary(calcResult: NewPurchaseProfileResult): string {
  const summaryParts: string[] = []

  // Start with primary limiting factor
  if (calcResult.limitingFactor === 'MSR') {
    summaryParts.push('Based on your income, you can borrow comfortably within MSR guidelines.')
  } else if (calcResult.limitingFactor === 'TDSR') {
    summaryParts.push('Your loan amount is optimized for healthy debt servicing.')
  } else if (calcResult.limitingFactor === 'LTV') {
    summaryParts.push('Loan amount is set by property price and loan-to-value limits.')
  }

  // Add tenure context if capped
  const tenureCapped = calcResult.reasonCodes?.includes('tenure_cap_property_limit') ||
                       calcResult.reasonCodes?.includes('tenure_cap_age_limit')

  if (tenureCapped) {
    summaryParts.push('Your loan tenure is capped at 25 years per MAS regulations.')
  }

  // Add CPF context if applicable
  const cpfAllowed = calcResult.downPaymentBreakdown?.cpfAllowed > 0
  if (cpfAllowed) {
    summaryParts.push('You can use CPF for your down payment.')
  }

  return summaryParts.join(' ')
}
```

### Visual Design Notes

**Before** (Current):
```
┌─────────────────────────────────────┐
│ ✨ Your Personalized Analysis       │
│                                     │
│ MAXIMUM LOAN AMOUNT                 │
│ $284,000 [75% LTV]                  │
│ Limiting factor: MSR                │
│                                     │
│ ESTIMATED MONTHLY PAYMENT           │
│ $1,246/mo [@ 2.3% assumed rate]    │
│                                     │
│ DOWN PAYMENT REQUIRED               │
│ $216,000 [43.2% down]              │
│ ├─ Cash: $0                        │
│ └─ CPF: $216,000                   │
│                                     │
│ Reason codes:                       │
│ • msr_binding                       │
│ • tenure_cap_property_limit         │
│                                     │
│ Policy refs:                        │
│ • MAS Notice 645                    │
│ • mas_tenure_cap_hdb                │
└─────────────────────────────────────┘
```

**After** (Simplified):
```
┌─────────────────────────────────────┐
│ ✨ You qualify for up to            │
│                                     │
│        $284,000                     │  ← BIG NUMBER
│                                     │
│ Based on your income, you can       │
│ borrow comfortably within MSR       │
│ guidelines. Your loan tenure is     │
│ capped at 25 years per MAS          │
│ regulations. You can use CPF for    │
│ your down payment.                  │
│                                     │
│ [View full breakdown]  ← expandable │
└─────────────────────────────────────┘
```

### Testing Strategy

**Manual Test**:
1. Fill form through Step 3
2. Verify big number is prominent and clear
3. Verify summary uses plain English (no `msr_binding` jargon)
4. Click "View full breakdown" and verify details expand
5. Verify design uses sharp rectangles and monochrome colors

**Automated Test** (Task 4):
See Task 4 for test file.

### How to Test This Task

```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:3003/apply?loanType=new_purchase

# Fill through Step 2 → Step 3 and verify new instant analysis UI
```

### Commit Message Template

```
feat: simplify instant analysis display for clarity

Reduced information overload in Step 3 instant analysis:
- Show ONE big number (max loan amount) prominently
- Translate Dr Elena persona codes to plain English summary
- Hide technical jargon (msr_binding, policy refs, etc.)
- Add "View full breakdown" expandable for details

Goal: Create "wow moment" instead of data dump, reduce
drop-off before Step 4.

Follows TDD: Manual testing verified, automated tests next.

Refs: #ISSUE_NUMBER
```

### Documentation to Review

- Design system: `docs/design/SINGLE_SOURCE_OF_TRUTH.md`
- Dr Elena constants: `lib/calculations/dr-elena-constants.ts`
- Calculation types: `lib/calculations/instant-profile.ts` (see `NewPurchaseProfileResult` interface)

---

## Task 4: Add Tests for Simplified Instant Analysis

**Objective**: Ensure Task 3 UI changes work correctly and don't regress.

**Priority**: P1
**Complexity**: Medium
**Time Estimate**: 1 hour

### Acceptance Criteria

- [ ] Test verifies big number (max loan amount) is displayed
- [ ] Test verifies technical persona codes are NOT shown
- [ ] Test verifies "View full breakdown" toggle works
- [ ] Test verifies user-friendly summary is present
- [ ] All tests passing

### Files to Create

**File**: `components/forms/__tests__/InstantAnalysis.test.tsx`

### Test Code

```typescript
/**
 * ABOUTME: Tests for instant analysis display in Step 3 (property details).
 * ABOUTME: Ensures Dr Elena calculations are presented in user-friendly format.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Instant Analysis Display', () => {
  it('should show max loan amount prominently', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 3
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Trigger instant calculation
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Big number is shown
    expect(await screen.findByText(/you qualify for up to/i)).toBeInTheDocument()
    expect(screen.getByText(/\$284,000/)).toBeInTheDocument() // HDB default scenario
  })

  it('should NOT show technical persona codes by default', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 3 and trigger calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Technical codes are hidden
    expect(screen.queryByText(/msr_binding/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tenure_cap_property_limit/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/MAS Notice 645/i)).not.toBeInTheDocument()
  })

  it('should show user-friendly summary instead of jargon', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate and trigger calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Plain English summary is shown
    expect(await screen.findByText(/based on your income/i)).toBeInTheDocument()
    // Could be "MSR guidelines" or "TDSR" depending on calculation
  })

  it('should toggle detailed breakdown on click', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate and trigger calculation
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: Details are hidden initially
    expect(screen.queryByText(/monthly payment/i)).not.toBeInTheDocument()

    // Click "View full breakdown"
    const toggleBtn = await screen.findByRole('button', { name: /view full breakdown/i })
    await user.click(toggleBtn)

    // VERIFY: Details are now visible
    expect(await screen.findByText(/monthly payment/i)).toBeInTheDocument()
    expect(screen.getByText(/down payment/i)).toBeInTheDocument()

    // Click again to hide
    await user.click(screen.getByRole('button', { name: /hide details/i }))

    // VERIFY: Details are hidden again
    expect(screen.queryByText(/monthly payment/i)).not.toBeInTheDocument()
  })
})
```

### How to Run This Test

```bash
npm test -- InstantAnalysis.test.tsx
```

### Commit Message Template

```
test: add instant analysis UI verification

Added tests for simplified instant analysis display:
- Verifies max loan amount is shown prominently
- Verifies technical persona codes are hidden
- Verifies user-friendly summary is present
- Verifies "View full breakdown" toggle works

All tests passing.

Refs: #ISSUE_NUMBER
```

---

## Task 5: Pre-fill Age in Step 4 from Step 2 Data

**Objective**: Reduce redundant input - user already entered "Combined Age" in Step 2, use it to pre-fill "Your Age" in Step 4.

**Priority**: P1
**Complexity**: Low
**Time Estimate**: 45 minutes

### Acceptance Criteria

- [ ] When user reaches Step 4, "Your Age" field is pre-filled with value from Step 2's "Combined Age"
- [ ] User can still edit the age if needed
- [ ] If Step 2 age is missing, field remains empty (graceful degradation)
- [ ] Works for both single and joint applicants

### Files to Modify

**File**: `hooks/useProgressiveFormController.ts`

### Current Code (Lines 66-72 in `lib/forms/form-config.ts`)

```typescript
actualAges: {
  0: 30, // Set reasonable defaults
  1: undefined
},
```

This sets a default age of 30, but doesn't pull from Step 2's `combinedAge` field.

### New Code Location

**File**: `hooks/useProgressiveFormController.ts`
**Function**: `next()` callback
**Location**: Around line 540-560

Add this logic AFTER step progression:

```typescript
const next = useCallback(async (data: any) => {
  try {
    // ... existing validation and progression logic ...

    // After moving to next step, check if we need to pre-fill Step 4 age
    if (nextStep === 3) { // Moving to Step 4 (Your Finances)
      const combinedAge = leadForm.formData.combinedAge

      if (combinedAge && !leadForm.formData.actualAges?.[0]) {
        // Pre-fill primary applicant age from Step 2 combinedAge
        // For single applicants, use full combinedAge
        // For joint applicants, divide by 2 as reasonable estimate
        const hasJointApplicant = leadForm.formData.hasJointApplicant
        const estimatedAge = hasJointApplicant
          ? Math.round(combinedAge / 2)
          : combinedAge

        setValue('actualAges.0', estimatedAge, { shouldValidate: false })
      }
    }

    // ... rest of function ...
  } catch (error) {
    console.error('Error in next():', error)
  }
}, [currentStep, leadForm, setValue, /* other dependencies */])
```

### Logic Explanation

**For Single Applicants**:
- Step 2: User enters "Combined Age" = 35
- Step 4: Pre-fill "Your Age" = 35

**For Joint Applicants**:
- Step 2: User enters "Combined Age" = 70 (e.g., 35 + 35)
- Step 4: Pre-fill Applicant 1 age = 35 (70 / 2)
- Step 4: Applicant 2 age remains empty (user must fill)

**Graceful Degradation**:
- If `combinedAge` is missing → Don't pre-fill, use default (30)
- If `actualAges[0]` already has value → Don't overwrite

### Testing Strategy

**Manual Test**:
1. Fill Step 2 with Combined Age = 40
2. Progress to Step 3 → Step 4
3. Verify "Your Age" shows 40 (not 30)
4. Edit age to 42
5. Verify change persists

**Automated Test** (Task 6):
See Task 6 for test file.

### How to Test This Task

```bash
npm run dev

# Test with different ages:
# - Try age 25 → Should see 25 in Step 4
# - Try age 60 → Should see 60 in Step 4
# - Try joint applicant with combined age 80 → Should see 40 in Step 4
```

### Commit Message Template

```
feat: pre-fill Step 4 age from Step 2 combined age

Reduced redundant input by pre-filling "Your Age" in Step 4
with value from "Combined Age" in Step 2. For joint applicants,
divides combined age by 2 as reasonable estimate.

User can still edit the pre-filled value if needed.

Gracefully handles missing data by falling back to defaults.

Refs: #ISSUE_NUMBER
```

### Documentation to Review

- Form config defaults: `lib/forms/form-config.ts` (lines 66-72)
- Form data structure: `lib/contracts/form-contracts.ts`

---

## Task 6: Add Tests for Age Pre-fill

**Objective**: Ensure Task 5 age pre-fill works correctly for all scenarios.

**Priority**: P1
**Complexity**: Low
**Time Estimate**: 45 minutes

### Acceptance Criteria

- [ ] Test verifies age is pre-filled for single applicant
- [ ] Test verifies age is divided for joint applicant
- [ ] Test verifies user can edit pre-filled age
- [ ] Test verifies graceful degradation when combinedAge is missing
- [ ] All tests passing

### Files to Create

**File**: `components/forms/__tests__/AgePrefill.test.tsx`

### Test Code

```typescript
/**
 * ABOUTME: Tests for age pre-fill from Step 2 to Step 4.
 * ABOUTME: Ensures user doesn't have to re-enter age information.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Age Pre-fill in Step 4', () => {
  it('should pre-fill age for single applicant', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Step 2: Fill contact info
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: Combined Age defaults to 35 (from form-config.ts)
    // Click through to Step 4
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // VERIFY: "Your Age" field is pre-filled with 35
    await screen.findByLabelText(/your age/i)
    const ageInput = screen.getByLabelText(/your age/i)
    expect(ageInput).toHaveValue(35) // Default from Step 2
  })

  it('should divide combined age for joint applicants', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Step 2: Fill contact info
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: Change combined age to 80
    await screen.findByLabelText(/combined age/i)
    const combinedAgeInput = screen.getByLabelText(/combined age/i)
    await user.clear(combinedAgeInput)
    await user.type(combinedAgeInput, '80')

    // Enable joint applicant
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))
    await screen.findByLabelText(/adding a joint applicant/i)
    await user.click(screen.getByLabelText(/adding a joint applicant/i))

    // VERIFY: Applicant 1 age is pre-filled with 40 (80 / 2)
    const age1Input = screen.getByLabelText(/your age/i)
    expect(age1Input).toHaveValue(40)
  })

  it('should allow user to edit pre-filled age', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Edit age from 35 to 42
    await screen.findByLabelText(/your age/i)
    const ageInput = screen.getByLabelText(/your age/i)
    await user.clear(ageInput)
    await user.type(ageInput, '42')

    // VERIFY: Age is updated
    expect(ageInput).toHaveValue(42)
  })
})
```

### How to Run This Test

```bash
npm test -- AgePrefill.test.tsx
```

### Commit Message Template

```
test: add age pre-fill verification

Added tests for age pre-fill from Step 2 to Step 4:
- Single applicant uses full combined age
- Joint applicant divides combined age by 2
- User can edit pre-filled age

All tests passing.

Refs: #ISSUE_NUMBER
```

---

## Task 7: Add Live MAS Readiness Updates

**Objective**: Show MAS Readiness Check updating in real-time as user types income, instead of waiting for final button click.

**Priority**: P1
**Complexity**: Medium
**Time Estimate**: 2 hours

### Acceptance Criteria

- [ ] TDSR/MSR ratios update live as user types income
- [ ] Update debounced (wait 500ms after user stops typing)
- [ ] No calculation errors shown during partial input
- [ ] Performance acceptable (no lag while typing)
- [ ] Works for both single and joint applicants

### Files to Modify

**File**: `components/forms/sections/Step3NewPurchase.tsx`

### Current Behavior

MAS Readiness shows "0.0% / 55%" until user fills ALL fields and clicks "Connect with AI Mortgage Specialist".

### New Behavior

MAS Readiness updates LIVE as user types:
1. User types income: 5000 → TDSR updates to "15.2% / 55%"
2. User adds car loan: 500/mo → TDSR updates to "18.7% / 55%"
3. User sees progress in real-time → feels engaged

### Implementation Strategy

**Step 1**: Add `useEffect` to watch income fields and trigger calculation

```typescript
import { useEffect, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { debounce } from 'lodash' // or implement custom debounce

// In Step3NewPurchase component:
const monthlyIncome = useWatch({ control, name: 'actualIncomes.0' })
const variableIncome = useWatch({ control, name: 'actualVariableIncomes.0' })
const liabilities = useWatch({ control, name: 'liabilities' })

// Debounced calculation trigger
const debouncedCalculate = useMemo(
  () =>
    debounce(async () => {
      // Only calculate if we have minimum required data
      if (!monthlyIncome || monthlyIncome <= 0) {
        return // Don't calculate with invalid data
      }

      try {
        // Trigger controller's instant calculation
        await trigger(['actualIncomes.0', 'actualAges.0', 'liabilities'])
      } catch (error) {
        console.error('Live MAS calculation error:', error)
        // Fail silently - user will see result when they submit
      }
    }, 500), // 500ms debounce
  [monthlyIncome, trigger]
)

useEffect(() => {
  debouncedCalculate()

  // Cleanup
  return () => {
    debouncedCalculate.cancel()
  }
}, [monthlyIncome, variableIncome, liabilities, debouncedCalculate])
```

**Step 2**: Update MAS Readiness display to show live results

The `instantCalcResult` already contains TDSR/MSR values from the controller. Just need to ensure they're displayed even when form is incomplete.

```typescript
// Current (only shows when all fields valid):
{isFormValid && (
  <div>
    <div>TDSR: {tdsrRatio}% / 55%</div>
    <div>MSR: {msrRatio}% / 30%</div>
  </div>
)}

// New (shows as soon as income is entered):
{monthlyIncome > 0 && (
  <div>
    <div>TDSR: {tdsrRatio ?? '...'} % / 55%</div>
    <div>MSR: {msrRatio ?? '...'} % / 30%</div>
  </div>
)}
```

### Debounce Implementation (if lodash not available)

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  return debounced
}
```

### Performance Considerations

- **Debounce**: 500ms prevents excessive calculations while typing
- **Validation guard**: Only calculate when `monthlyIncome > 0` to avoid errors
- **Error handling**: Fail silently if calculation errors (user will see result on submit)
- **Cleanup**: Cancel debounce on unmount to prevent memory leaks

### Testing Strategy

**Manual Test**:
1. Navigate to Step 4
2. Type income: 5000 → Wait 500ms → Verify MAS Readiness shows TDSR/MSR %
3. Change income: 8000 → Wait 500ms → Verify ratios update
4. Add car loan: 500/mo → Wait 500ms → Verify TDSR increases
5. Verify no errors in console

**Automated Test** (Task 8):
See Task 8 for test file.

### How to Test This Task

```bash
npm run dev

# Navigate to Step 4
# Open browser DevTools console
# Type income slowly and watch MAS Readiness update
# Verify debounce works (updates stop 500ms after typing stops)
```

### Commit Message Template

```
feat: add live MAS Readiness updates in Step 4

MAS Readiness Check now updates in real-time as user types
income and liability information. Debounced 500ms to prevent
excessive calculations.

User sees progress immediately instead of waiting until
final button click. Improves engagement and reduces
form fatigue.

Handles incomplete data gracefully (shows "..." while calculating).

Refs: #ISSUE_NUMBER
```

### Documentation to Review

- Controller hook: `hooks/useProgressiveFormController.ts`
- MAS calculation: `lib/calculations/instant-profile.ts` (search for TDSR/MSR)

---

## Task 8: Add Tests for Live MAS Updates

**Objective**: Ensure Task 7 live MAS updates work correctly and don't cause performance issues.

**Priority**: P1
**Complexity**: Medium
**Time Estimate**: 1 hour

### Acceptance Criteria

- [ ] Test verifies MAS Readiness updates when income changes
- [ ] Test verifies debounce works (doesn't update on every keystroke)
- [ ] Test verifies no errors with incomplete data
- [ ] Test verifies cleanup on unmount (no memory leaks)
- [ ] All tests passing

### Files to Create

**File**: `components/forms/__tests__/LiveMASUpdates.test.tsx`

### Test Code

```typescript
/**
 * ABOUTME: Tests for live MAS Readiness updates in Step 4.
 * ABOUTME: Ensures real-time feedback works without performance issues.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

// Mock the debounce delay for faster tests
jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn: any) => {
    // In tests, use immediate execution instead of 500ms delay
    fn.cancel = jest.fn()
    return fn
  }
}))

describe('Live MAS Readiness Updates', () => {
  it('should update TDSR when user types income', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Initial state: 0.0% (default income 5000 from form-config.ts)
    await screen.findByText(/TDSR.*0\.0%/i)

    // Change income to 8000
    const incomeInput = screen.getByLabelText(/monthly income/i)
    await user.clear(incomeInput)
    await user.type(incomeInput, '8000')

    // VERIFY: TDSR updates (should be different from 0.0%)
    await waitFor(() => {
      const tdsrText = screen.getByText(/TDSR/i).textContent
      expect(tdsrText).not.toContain('0.0%')
    }, { timeout: 2000 })
  })

  it('should handle incomplete data gracefully', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Clear income (incomplete data)
    const incomeInput = screen.getByLabelText(/monthly income/i)
    await user.clear(incomeInput)

    // VERIFY: No errors shown, MAS Readiness shows placeholder
    await waitFor(() => {
      expect(screen.getByText(/TDSR/i)).toBeInTheDocument()
    })

    // Should show "..." or "0.0%" but NOT throw error
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('should update when liabilities change', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Get initial TDSR
    await screen.findByText(/TDSR/i)
    const initialTDSR = screen.getByText(/TDSR/i).textContent

    // Add car loan
    await user.click(screen.getByLabelText(/car loans/i))
    // Assume this opens monthly payment input
    const carLoanInput = screen.getByLabelText(/car loan.*monthly payment/i)
    await user.type(carLoanInput, '500')

    // VERIFY: TDSR updates (should increase)
    await waitFor(() => {
      const newTDSR = screen.getByText(/TDSR/i).textContent
      expect(newTDSR).not.toBe(initialTDSR)
    }, { timeout: 2000 })
  })
})
```

### How to Run This Test

```bash
npm test -- LiveMASUpdates.test.tsx
```

### Debugging Tips

If tests fail:
1. Check if debounce mock is working (should execute immediately in tests)
2. Verify `instantCalcResult` is being updated in controller
3. Add `screen.debug()` to see current DOM state
4. Check console for calculation errors

### Commit Message Template

```
test: add live MAS updates verification

Added tests for real-time MAS Readiness updates:
- Verifies TDSR updates when income changes
- Verifies graceful handling of incomplete data
- Verifies updates when liabilities change
- Mocks debounce for faster test execution

All tests passing.

Refs: #ISSUE_NUMBER
```

---

## Task 9: Simplify Commitment Inputs

**Objective**: Reduce friction in Step 4 by simplifying how users indicate existing loans/commitments.

**Priority**: P1
**Complexity**: Medium
**Time Estimate**: 2 hours

### Acceptance Criteria

- [ ] Replace 4 individual checkboxes with single "Do you have existing loans?" Yes/No
- [ ] If "Yes", show expandable sections for each loan type
- [ ] If "No", skip all commitment inputs entirely
- [ ] Preserve existing functionality for users who DO have loans
- [ ] Design matches sophisticated flow (sharp rectangles, monochrome)

### Files to Modify

**File**: `components/forms/sections/Step3NewPurchase.tsx`

### Current UI (Lines 550-630)

```tsx
<div className="space-y-4">
  <Checkbox label="Property loans" />
  {propertyLoansEnabled && <Input label="Monthly payment" />}

  <Checkbox label="Car loans" />
  {carLoansEnabled && <Input label="Monthly payment" />}

  <Checkbox label="Credit cards" />
  {creditCardsEnabled && <Input label="Monthly payment" />}

  <Checkbox label="Personal lines" />
  {personalLinesEnabled && <Input label="Monthly payment" />}

  <Textarea label="Other commitments" />
</div>
```

**Problem**: User must click 4 checkboxes even if they have NO loans.

### New UI Structure

```tsx
<div className="space-y-6">
  {/* Single gate question */}
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold text-[#000000]">
        Do you have any existing loans or commitments?
      </h4>
      <p className="text-sm text-[#666666]">
        Property loans, car loans, credit cards, etc.
      </p>
    </div>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setHasCommitments(false)}
        className={`px-6 py-2 border ${
          hasCommitments === false
            ? 'bg-[#000000] text-white border-[#000000]'
            : 'bg-white text-[#666666] border-[#E5E5E5]'
        }`}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => setHasCommitments(true)}
        className={`px-6 py-2 border ${
          hasCommitments === true
            ? 'bg-[#000000] text-white border-[#000000]'
            : 'bg-white text-[#666666] border-[#E5E5E5]'
        }`}
      >
        Yes
      </button>
    </div>
  </div>

  {/* Only show if Yes */}
  {hasCommitments && (
    <div className="space-y-4 pl-4 border-l-2 border-[#E5E5E5]">
      <h5 className="font-semibold text-[#000000]">
        Tell us about your commitments
      </h5>

      <Checkbox
        label="Property loans"
        checked={liabilities.propertyLoans.enabled}
        onChange={(checked) =>
          setValue('liabilities.propertyLoans.enabled', checked)
        }
      />
      {liabilities.propertyLoans.enabled && (
        <Input
          label="Monthly payment"
          {...register('liabilities.propertyLoans.monthlyPayment')}
        />
      )}

      {/* Repeat for car loans, credit cards, personal lines */}

      <Textarea
        label="Other commitments (optional)"
        placeholder="School fees, guarantor obligations, allowances"
        {...register('liabilities.otherCommitments')}
      />
    </div>
  )}
</div>
```

### State Management

Add local state to track Yes/No selection:

```typescript
const [hasCommitments, setHasCommitments] = useState<boolean | null>(null)

// Update form values when user clicks No
useEffect(() => {
  if (hasCommitments === false) {
    // Clear all commitment fields
    setValue('liabilities.propertyLoans.enabled', false)
    setValue('liabilities.carLoans.enabled', false)
    setValue('liabilities.creditCards.enabled', false)
    setValue('liabilities.personalLines.enabled', false)
    setValue('liabilities.otherCommitments', '')
  }
}, [hasCommitments, setValue])
```

### User Experience Flow

**Before** (Current):
1. User sees 4 checkboxes + text area
2. If no loans, must consciously SKIP all 5 inputs
3. Feels like work, unclear if required
4. Total interactions: ~5 (checking that each is unchecked)

**After** (Improved):
1. User sees "Do you have loans?" Yes/No
2. Clicks "No" → Done, all fields cleared automatically
3. Total interactions: 1

**For Users WITH Loans**:
1. Clicks "Yes" → Commitment section expands
2. Checks relevant loan types
3. Enters monthly payments
4. Total interactions: Same as before (~5-8)

### Visual Design

**Yes/No Buttons**:
- Sharp rectangles (no rounded corners)
- Black background when selected, white when not
- Black border, monochrome palette
- Matches design system

### Testing Strategy

**Manual Test**:
1. Navigate to Step 4
2. Click "No" → Verify all commitment fields disappear
3. Click "Yes" → Verify fields reappear
4. Fill some commitment data → Click "No" → Verify data is cleared
5. Click "Yes" again → Verify fields are empty (previously cleared)

**Automated Test** (Task 10):
See Task 10 for test file.

### How to Test This Task

```bash
npm run dev

# Navigate to Step 4
# Test Yes/No toggle multiple times
# Verify MAS Readiness still updates correctly
# Verify form submission works with No (no loans)
```

### Commit Message Template

```
feat: simplify commitment inputs with gate question

Replaced 4 individual loan checkboxes with single
"Do you have existing loans?" Yes/No gate.

If No: All commitment fields cleared automatically (1 click)
If Yes: Expandable section shows detailed loan inputs

Reduces friction for users with no loans (majority case
in Singapore first-time buyer market).

Preserves full functionality for users with commitments.

Refs: #ISSUE_NUMBER
```

### Documentation to Review

- Design system: `docs/design/SINGLE_SOURCE_OF_TRUTH.md`
- Form defaults: `lib/forms/form-config.ts` (lines 94-100)

---

## Task 10: Add Tests for Simplified Commitments

**Objective**: Ensure Task 9 commitment simplification works correctly for all scenarios.

**Priority**: P1
**Complexity**: Medium
**Time Estimate**: 1 hour

### Acceptance Criteria

- [ ] Test verifies "No" clears all commitment fields
- [ ] Test verifies "Yes" shows commitment inputs
- [ ] Test verifies toggling Yes → No → Yes works correctly
- [ ] Test verifies form submission works with "No" selected
- [ ] All tests passing

### Files to Create

**File**: `components/forms/__tests__/CommitmentInputs.test.tsx`

### Test Code

```typescript
/**
 * ABOUTME: Tests for simplified commitment inputs in Step 4.
 * ABOUTME: Ensures Yes/No gate reduces friction for users with no loans.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressiveFormWithController } from '../ProgressiveFormWithController'

describe('Simplified Commitment Inputs', () => {
  it('should hide commitment fields when user selects No', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "No" for existing loans
    await screen.findByText(/do you have any existing loans/i)
    const noButton = screen.getByRole('button', { name: /^No$/i })
    await user.click(noButton)

    // VERIFY: Commitment checkboxes are hidden
    await waitFor(() => {
      expect(screen.queryByLabelText(/property loans/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/car loans/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/credit cards/i)).not.toBeInTheDocument()
    })
  })

  it('should show commitment fields when user selects Yes', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "Yes" for existing loans
    await screen.findByText(/do you have any existing loans/i)
    const yesButton = screen.getByRole('button', { name: /^Yes$/i })
    await user.click(yesButton)

    // VERIFY: Commitment checkboxes are shown
    await waitFor(() => {
      expect(screen.getByLabelText(/property loans/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/car loans/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/credit cards/i)).toBeInTheDocument()
    })
  })

  it('should clear commitment data when toggling from Yes to No', async () => {
    const user = userEvent.setup()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "Yes"
    await screen.findByText(/do you have any existing loans/i)
    const yesButton = screen.getByRole('button', { name: /^Yes$/i })
    await user.click(yesButton)

    // Fill in some commitment data
    await waitFor(() => {
      expect(screen.getByLabelText(/car loans/i)).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText(/car loans/i))
    const carLoanPayment = screen.getByLabelText(/car loan.*monthly payment/i)
    await user.type(carLoanPayment, '500')

    // Click "No"
    const noButton = screen.getByRole('button', { name: /^No$/i })
    await user.click(noButton)

    // Click "Yes" again
    await user.click(yesButton)

    // VERIFY: Previously entered data is cleared
    await waitFor(() => {
      expect(screen.getByLabelText(/car loans/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/car loans/i)).not.toBeChecked()
  })

  it('should allow form submission with No commitments', async () => {
    const user = userEvent.setup()
    const mockOnStepCompletion = jest.fn()

    render(
      <ProgressiveFormWithController
        loanType="new_purchase"
        sessionId="test-session"
        onStepCompletion={mockOnStepCompletion}
      />
    )

    // Navigate to Step 4
    await user.type(screen.getByLabelText(/full name/i), 'John Tan')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '91234567')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByRole('button', { name: /get instant loan estimate/i })
    await user.click(screen.getByRole('button', { name: /get instant loan estimate/i }))

    // Click "No" for commitments
    await screen.findByText(/do you have any existing loans/i)
    const noButton = screen.getByRole('button', { name: /^No$/i })
    await user.click(noButton)

    // Click "Connect with AI Mortgage Specialist"
    const connectButton = screen.getByRole('button', { name: /connect with ai mortgage specialist/i })
    await user.click(connectButton)

    // VERIFY: Form submission succeeds (ChatTransitionScreen appears)
    await waitFor(() => {
      expect(screen.getByTestId('chat-transition-screen')).toBeInTheDocument()
    }, { timeout: 3000 })

    // VERIFY: onStepCompletion was called with hasCommitments = false
    expect(mockOnStepCompletion).toHaveBeenCalled()
  })
})
```

### How to Run This Test

```bash
npm test -- CommitmentInputs.test.tsx
```

### Commit Message Template

```
test: add simplified commitment inputs verification

Added tests for Yes/No commitment gate:
- Verifies No hides all commitment fields
- Verifies Yes shows commitment inputs
- Verifies toggling clears previously entered data
- Verifies form submission works with No

All tests passing.

Refs: #ISSUE_NUMBER
```

---

## Testing Strategy (Overall)

### Manual Testing Checklist

Before marking tasks complete, manually verify:

- [ ] **Task 1-2**: Chat transition appears after Step 4 completion
- [ ] **Task 3-4**: Instant analysis shows big number, plain English, no jargon
- [ ] **Task 5-6**: Age pre-fills from Step 2 to Step 4
- [ ] **Task 7-8**: MAS Readiness updates live as user types
- [ ] **Task 9-10**: "No loans" path is one click, clears all fields

### Automated Testing

Run full test suite before final commit:

```bash
# Run all tests
npm test

# Run only form tests
npm test -- components/forms/__tests__

# Run in watch mode during development
npm test -- --watch
```

### Performance Testing

Verify no performance degradation:

```bash
# Build production bundle
npm run build

# Check bundle size (should be < 140KB gzipped)
npm run analyze

# Test in Lighthouse (Chrome DevTools)
# Target: Performance score > 90
```

---

## Deployment Strategy

### Phased Rollout

**Phase 1: Blocker Fix (Tasks 1-2)**
- Deploy chat transition fix immediately
- Monitor Chatwoot contact creation rate
- Verify users are reaching AI brokers

**Phase 2: UX Improvements (Tasks 3-10)**
- Deploy all UX improvements together
- A/B test if desired (keep old form as variant)
- Monitor completion rate and time-to-chat metrics

### Rollback Plan

If issues arise:

1. **Chat transition broken**: Revert Task 1 commit
2. **Calculation errors**: Disable live MAS updates (Task 7), keep manual trigger
3. **User confusion**: Revert commitment simplification (Task 9), keep checkboxes

### Success Metrics

Track these metrics before/after deployment:

- **Completion Rate**: % of users who start form and reach chat
- **Time to Chat**: Average time from landing page to first AI broker message
- **Drop-off by Step**: Where users abandon the form
- **Contact Creation Rate**: % of Step 4 completions that create Chatwoot contact

**Target Improvements**:
- Completion rate: +15% (from ~60% to ~75%)
- Time to chat: -30% (from ~5 min to ~3.5 min)
- Drop-off at Step 4: -40% (from ~20% to ~12%)

---

## Appendix: Code References

### Key Files

| File | Purpose | LOC |
|------|---------|-----|
| `components/forms/ProgressiveFormWithController.tsx` | Main form UI component | ~1500 |
| `hooks/useProgressiveFormController.ts` | Form state controller | ~700 |
| `lib/calculations/instant-profile.ts` | Dr Elena v2 calculation engine | ~900 |
| `lib/forms/form-config.ts` | Form step definitions | ~300 |
| `components/forms/ChatTransitionScreen.tsx` | Chat loading screen | ~150 |

### Testing Resources

- **Existing test examples**: `components/forms/__tests__/ProgressiveFormWithController.test.tsx`
- **Testing library docs**: https://testing-library.com/docs/react-testing-library/intro/
- **Jest docs**: https://jestjs.io/docs/getting-started
- **React Hook Form testing**: https://react-hook-form.com/advanced-usage#TestingForm

### Design System Resources

- **Single source of truth**: `docs/design/SINGLE_SOURCE_OF_TRUTH.md`
- **Design tokens**: `lib/design/tokens.ts`
- **Reference implementation**: `app/redesign/sophisticated-flow/page.tsx`

---

## FAQ for New Engineers

### Q: What is "Dr Elena v2"?

**A**: Dr Elena v2 is the persona-driven mortgage calculation engine in `lib/calculations/instant-profile.ts`. It's called a "persona" because it embeds Singapore mortgage regulations and best practices into the calculation logic, then outputs:
- **Numeric results**: Max loan amount, monthly payment, TDSR/MSR ratios
- **Reason codes**: Snake_case codes like `msr_binding`, `ltv_first_loan` explaining WHY the result is what it is
- **Policy references**: Links to MAS regulations (e.g., "MAS Notice 645")

The reason codes are meant for internal tracking and AI broker context, NOT for direct user display. Always translate them to plain English.

### Q: Why is the form so complex?

**A**: Singapore mortgage regulations are complex:
- **TDSR (Total Debt Servicing Ratio)**: 55% cap on total monthly debt payments vs. income
- **MSR (Mortgage Servicing Ratio)**: 30% cap for HDB/EC properties
- **LTV (Loan-to-Value)**: 75% for first property, 45% for second, varies by age
- **CPF usage**: Central Provident Fund can be used for down payment with restrictions
- **Tenure limits**: Max 25 years for HDB, 35 years for private, reduced if buyer is older

The form collects all data needed to calculate these compliance metrics accurately.

### Q: What happens after the form is completed?

**A**: The `ChatTransitionScreen` component:
1. Shows a loading animation
2. Calls `/api/chatwoot-contact-from-lead` to create a Chatwoot contact
3. Stores form data in the contact's custom attributes
4. Redirects user to Chatwoot chat widget URL
5. AI broker (via n8n automation) receives contact data and sends personalized greeting

### Q: Why TDD for all tasks?

**A**: Per CLAUDE.md (project instructions):
> "FOR EVERY NEW FEATURE OR BUGFIX, YOU MUST follow Test Driven Development:
> 1. Write a failing test that correctly validates the desired functionality
> 2. Run the test to confirm it fails as expected
> 3. Write ONLY enough code to make the failing test pass
> 4. Run the test to confirm success
> 5. Refactor if needed while keeping tests green"

This prevents regressions and ensures code quality.

### Q: How do I run just one test?

**A**: Use Jest's file pattern matching:

```bash
# Run specific test file
npm test -- ChatTransition.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should show ChatTransitionScreen"

# Run in watch mode
npm test -- --watch ChatTransition.test.tsx
```

### Q: What if I'm stuck on a task?

**A**:
1. **Read the documentation** linked in the task
2. **Look at existing tests** in `components/forms/__tests__/` for patterns
3. **Check console errors** in browser DevTools
4. **Add debug logging**: `console.log('🔍 Debug:', { variable })`
5. **Ask for help**: Tag the task as blocked and explain what you've tried

### Q: Can I skip tests for "quick fixes"?

**A**: No. Per CLAUDE.md:
> "YOU MUST TRACK All non-trivial changes in git.
> YOU MUST commit frequently throughout the development process, even if your high-level tasks are not yet done."

Every task has tests. No exceptions.

---

## Commit Workflow

For each task:

```bash
# 1. Create feature branch
git checkout -b task-1-fix-chat-transition

# 2. Make changes
# ... edit files ...

# 3. Run tests
npm test -- ChatTransition.test.tsx

# 4. Commit (use template from task)
git add components/forms/ProgressiveFormWithController.tsx
git commit -m "fix: correct chat transition step index check

The onFormComplete callback was checking currentStep === 2,
but Step 4 (Your Finances) is index 3 in the 4-step form
(indices 0, 1, 2, 3). This prevented ChatTransitionScreen
from ever rendering.

Updated check to currentStep === 3 to trigger transition
after final step completion.

Verified manually via Playwright browser testing.

Refs: #ISSUE_NUMBER"

# 5. Push and create PR (or continue to next task)
git push origin task-1-fix-chat-transition
```

---

## End of Plan

**Total Tasks**: 10
**Estimated Duration**: 2-3 days
**Priority**: P0 (Critical - Blocker)

**Next Steps**:
1. Review this plan with team lead
2. Create GitHub issues for each task (optional)
3. Assign to engineer
4. Begin Task 1

**Success Criteria**:
- All 10 tasks completed with passing tests
- Manual QA verification passed
- Users successfully reach AI broker chat
- No performance degradation
- Code reviewed and merged

Good luck! 🚀
