# Task 3: Simplify Instant Analysis Display - Implementation Plan

**Date**: 2025-10-17
**Status**: Ready for Implementation
**Priority**: P1 (High - Reduces user drop-off)
**Estimated Time**: 1-2 hours
**Complexity**: Medium

## Context

Tasks 1 & 2 (P0 blockers) are COMPLETE and committed:
- ✅ Task 1: Fixed chat transition step index (currentStep === 3)
- ✅ Task 2: Added chat transition tests (3 passing tests)

Task 3 simplifies the instant analysis display in Step 2 to reduce information overload and create a "wow moment" instead of a data dump.

## Current State Analysis

**File**: `components/forms/ProgressiveFormWithController.tsx`
**Lines**: 864-880 (main instant analysis card)

**Current Problems**:
1. Shows 4 metrics at once (max loan, monthly payment, down payment, guidance)
2. Exposes technical persona codes (`msr_binding`, `tenure_cap_property_limit`)
3. Shows policy references (`MAS Notice 645`, etc.)
4. Lists "locked features" creating FOMO
5. No visual hierarchy - everything has equal weight

**Current Structure**:
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
└─────────────────────────────────────┘
```

## Target State

**Simplified View** (Default):
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

**Expanded View** (After clicking "View full breakdown"):
```
┌─────────────────────────────────────┐
│ ✨ You qualify for up to            │
│                                     │
│        $284,000                     │
│                                     │
│ Based on your income...             │
│                                     │
│ [Hide details]                      │
│ ───────────────────────────────────│
│ Monthly Payment: $1,246/mo          │
│ Down Payment: $216,000              │
│ Cash Required: $0                   │
│ CPF Allowed: $216,000               │
└─────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Add State for Expandable Section

**File**: `components/forms/ProgressiveFormWithController.tsx`
**Location**: Around line 93 (with other useState declarations)

**Add**:
```typescript
const [showAnalysisDetails, setShowAnalysisDetails] = useState(false)
```

### Step 2: Create Helper Function for User-Friendly Summary

**File**: `components/forms/ProgressiveFormWithController.tsx`
**Location**: Before `renderStepContent()` (around line 450)

**Add**:
```typescript
/**
 * Translates Dr Elena v2 persona codes into user-friendly summary
 *
 * @param calcResult - Result from calculateNewPurchaseProfile
 * @returns 1-2 sentence summary explaining the result in plain English
 */
const generateUserFriendlySummary = useCallback((calcResult: any): string => {
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
  const cpfAllowed = calcResult.cpfAllowedAmount > 0
  if (cpfAllowed) {
    summaryParts.push('You can use CPF for your down payment.')
  }

  return summaryParts.join(' ')
}, [])
```

### Step 3: Replace Instant Analysis Card

**File**: `components/forms/ProgressiveFormWithController.tsx`
**Location**: Lines 864-880 (the `return` statement inside the instant calc IIFE)

**Replace entire card from**:
```typescript
return (
  <div className="mt-6 p-6 bg-[#F8F8F8] border border-[#E5E5E5]">
    <h4 className="text-sm font-semibold text-black mb-4">
      <Sparkles className="inline-block w-4 h-4 mr-2" />
      Your Personalized Analysis
    </h4>
    {/* ... current 4-metric display ... */}
  </div>
)
```

**With**:
```typescript
return (
  <div className="mt-6 p-8 bg-white border border-[#E5E5E5]">
    <h4 className="text-2xl font-semibold text-[#000000] mb-4">
      ✨ You qualify for up to
    </h4>

    <div className="text-5xl font-semibold text-[#000000] mb-6">
      ${maxLoan.toLocaleString()}
    </div>

    <p className="text-[#666666] text-base mb-8">
      {generateUserFriendlySummary(instantCalcResult)}
    </p>

    <button
      type="button"
      onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
      className="text-[#666666] hover:text-[#000000] underline text-sm"
    >
      {showAnalysisDetails ? 'Hide details' : 'View full breakdown'}
    </button>

    {showAnalysisDetails && (
      <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Monthly Payment</span>
            <span className="text-sm font-mono text-[#000000]">
              ${monthlyPayment.toLocaleString()}/mo
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Down Payment</span>
            <span className="text-sm font-mono text-[#000000]">
              ${Math.round(downPayment).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Cash Required</span>
            <span className="text-sm font-mono text-[#000000]">
              ${Math.round(cashRequired).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">CPF Allowed</span>
            <span className="text-sm font-mono text-[#000000]">
              ${Math.round(cpfAllowedAmount).toLocaleString()}
            </span>
          </div>

          {tenureCapYears && (
            <div className="pt-4 border-t border-[#E5E5E5]">
              <p className="text-xs text-[#666666]">
                Tenure capped at {tenureCapYears} years ({tenureCapSource === 'age' ? 'age limit' : 'regulation'})
              </p>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
)
```

### Step 4: Test the Changes

**Manual Test**:
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3003/apply?loanType=new_purchase`
3. Fill Step 1 (contact info)
4. Fill Step 2 (property details)
5. Click "Get instant loan estimate"
6. **Verify**:
   - Big number ($284,000 or similar) is prominent
   - Summary uses plain English (no `msr_binding`)
   - "View full breakdown" button exists
   - Details are hidden by default
7. Click "View full breakdown"
8. **Verify**:
   - Details expand showing 4 metrics
   - Button text changes to "Hide details"
9. Click "Hide details"
10. **Verify details collapse**

**Automated Test** (Task 4 - Next Session):
Create `components/forms/__tests__/InstantAnalysis.test.tsx` following the pattern from `ChatTransition.test.tsx`.

### Step 5: Commit

```bash
git add components/forms/ProgressiveFormWithController.tsx
git commit -m "$(cat <<'EOF'
feat: simplify instant analysis display for clarity

Reduced information overload in Step 2 instant analysis:
- Show ONE big number (max loan amount) prominently
- Translate Dr Elena persona codes to plain English summary
- Hide technical jargon (msr_binding, policy refs, etc.)
- Add "View full breakdown" expandable for details

Goal: Create "wow moment" instead of data dump, reduce
drop-off before Step 3.

Design follows sophisticated flow: sharp rectangles,
monochrome palette (90% black/gray + 10% yellow accent).

Per plan: docs/plans/active/2025-11-01-lead-form-chat-handoff-optimization-plan.md
Task 3 of 10 (P1 High Priority)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Design System Compliance

**Colors** (from `docs/design/SINGLE_SOURCE_OF_TRUTH.md`):
- ✅ 90% Monochrome: #000000 (text), #666666 (secondary), #E5E5E5 (borders)
- ✅ No purple colors
- ✅ Sharp rectangles (NO rounded corners)
- ✅ Font weights: 300/400/600 only

**Typography**:
- Big number: `text-5xl font-semibold` (60px, weight 600)
- Summary: `text-base` (16px, weight 400)
- Details: `text-sm` (14px, weight 400)

## Edge Cases to Handle

1. **Missing limitingFactor**: Default to generic "You qualify for this amount"
2. **No tenure cap**: Don't show tenure message
3. **Zero CPF allowed**: Don't mention CPF in summary
4. **Multiple limiting factors**: Only show primary (first one)

## Technical Debt Notes

**NOT included in this task** (defer to future):
- Animated expansion (use simple toggle for now)
- Icons for each detail metric (keep text-only)
- "Compare with other LTV scenarios" link (already exists in LTV toggle below)
- Accessibility improvements (add aria-labels in future iteration)

## Files Modified

1. `components/forms/ProgressiveFormWithController.tsx` - Main changes
2. `docs/plans/active/TASK_3_IMPLEMENTATION_PLAN.md` - This file (for reference)

## Files to Create (Task 4)

1. `components/forms/__tests__/InstantAnalysis.test.tsx` - Automated tests

## Success Criteria

- [ ] Big number ($XXX,XXX) is prominent and clear
- [ ] Summary uses plain English (no `msr_binding` visible)
- [ ] "View full breakdown" button toggles details
- [ ] Design uses sharp rectangles (no rounded corners)
- [ ] All text uses monochrome colors (black/gray)
- [ ] Manual testing passes all verification steps
- [ ] No console errors
- [ ] Existing tests still pass

## Rollback Plan

If issues arise:
```bash
git revert HEAD  # Revert the Task 3 commit
npm run dev      # Verify form works
```

## Next Steps (Task 4)

After Task 3 is complete:
1. Create `InstantAnalysis.test.tsx` test file
2. Test cases:
   - Verify big number is displayed
   - Verify technical codes NOT shown
   - Verify toggle works
   - Verify user-friendly summary present
3. Run tests: `npm test -- InstantAnalysis.test.tsx`
4. Commit tests

---

**Estimated Total Time for Task 3**: 1-2 hours
**Prerequisites**: Tasks 1 & 2 complete ✅
**Blocker**: None
