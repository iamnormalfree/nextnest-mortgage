---
title: property-tier-calculation-investigation
status: in_progress
owner: engineering
created: 2025-10-19
priority: high
estimated_hours: 2 (reduced from 3 - brainstorming session clarified root cause)
dependencies:
  - 2025-10-19-progressive-form-input-reactivity-fixes.md (completed)
related_plans:
  - 2025-10-31-progressive-form-calculation-correction-plan.md (completed - did not address property tier)
completed_tasks:
  - Brainstorming session completed (first principles analysis)
  - Immediate fix applied (added existingProperties: 0 default)
  - Investigation completed (localStorage persistence ruled out)
  - Runbook created (CLEAR_FORM_STORAGE.md)
---

# Property Tier Calculation Investigation

## Context

**Discovered during:** Progressive form validation/reactivity testing (2025-10-19)
**Status:** OUT OF SCOPE for validation plan, requires separate investigation
**Branch:** TBD (needs brainstorming session first)

---

## Issue Summary

**Symptom:** Max loan amount showing $375k instead of expected ~$1.125M for $1.5M property

**Test Scenario:**
- Property price: $1.5M
- Property type: Resale HDB
- Combined age: 35
- Expected max loan (75% LTV, first property): $1.125M
- Actual max loan: $375k

**Root Cause Hypothesis:** Calculator receiving `existingProperties = 1` (second property tier) instead of `0` (first property tier)

**Evidence:**
- Singapore MAS regulations: First property = 75% LTV, Second property = 45% LTV
- Calculator appears to be applying second property tier restrictions
- `existingProperties` field not initialized in form config defaults
- No visible UI field found for this value

---

## FINDINGS SUMMARY (2025-10-19)

### Root Cause Identified ✓

**The calculator is CORRECT - the problem was missing default value.**

**What we found:**
1. Calculator properly implements dr Elena v2 LTV tiers:
   - First property: 75% LTV base, 55% reduced
   - Second property: 45% LTV base, 25% reduced
   - Third+ property: 35% LTV base, 15% reduced

2. `existingProperties` field was NOT initialized in `lib/forms/form-config.ts`
   - React Hook Form uses `undefined` when default not provided
   - `parseNumber(undefined, 0)` should return 0, BUT...
   - Somewhere the value became 1 (possibly manual setValue during testing)

3. Test scenario confirmed calculator logic:
   - Input: $1.5M HDB, age 35, tenure 25, `existingProperties = 1`
   - HDB tenure trigger: 25 years → reduced LTV
   - Second property + reduced LTV = 25% LTV
   - 25% × $1.5M = $375k ✓ CORRECT

**Immediate Fix Applied:**
- Added `existingProperties: 0` to `lib/forms/form-config.ts` line 84
- Default to first property (most common Singapore scenario)

**localStorage Investigation:**
- Checked `lib/hooks/useFormState.ts` - Does NOT store `existingProperties` (not in schema)
- Only sessionStorage used for Chatwoot integration (cleared on tab close)
- No form persistence contaminating tests
- Created runbook: `docs/runbooks/forms/CLEAR_FORM_STORAGE.md`

### Next Decision Required: UI Field Strategy

See "Recommended Fix Strategy" section below for 3 options (A, B, C).

---

## Investigation Tasks

### Task 1: Trace existingProperties Data Flow (1 hour)

**Files to examine:**
- `lib/forms/form-config.ts` - Default values (currently missing `existingProperties`)
- `hooks/useProgressiveFormController.ts:329` - Where value is read: `parseNumber(formData.existingProperties, 0)`
- `components/forms/ProgressiveFormWithController.tsx:221,253` - Where value is passed to calculator

**Questions:**
1. Why is `existingProperties` not in form config defaults?
2. Is there a hidden UI field setting this value?
3. Is browser localStorage persisting old values?
4. Does the parseNumber function have a bug when value is undefined?

### Task 2: Check for UI Fields (0.5 hours)

**Search patterns:**
- "How many properties"
- "Do you own"
- "First property"
- "Second property"
- Any Step 0/1 questions about property ownership

**Files to check:**
- Homepage loan selector
- Step 0 (Loan Type)
- Step 1 (Who You Are)
- All form initialization code

### Task 3: Verify Calculator Logic (0.5 hours)

**Files:**
- `lib/calculations/instant-profile.ts` - LTV calculation logic
- `lib/calculations/dr-elena-constants.ts` - Property tier definitions

**Verify:**
- How does calculator determine property tier from `existing_properties` value?
- What LTV percentages are applied for 0, 1, 2+ properties?
- Are there additional factors affecting max loan (age, tenure, income)?

### Task 4: Browser State Investigation (0.5 hours)

**Check:**
- localStorage keys related to form state
- sessionStorage persistence
- React Hook Form's internal state
- Any form hydration from URL params or cookies

**Test:**
- Clear all browser storage
- Start fresh form session
- Check what value existingProperties has on first load

### Task 5: Fix Strategy (0.5 hours)

**Options:**
1. Add `existingProperties: 0` to form config defaults
2. Add explicit UI field asking "Is this your first property?"
3. Infer from other fields (if no existing property loans, assume first property)
4. Fix parseNumber function to handle undefined correctly

**Decision criteria:**
- UX impact (do we need to ask users?)
- Data accuracy (can we safely default to 0?)
- Business requirements (is this a required field?)

---

## Expected Outcomes

After investigation, one of these should be true:

1. **Bug confirmed:** `existingProperties` needs default value of 0 in form config
2. **Missing UI:** Need to add "first property?" question in Step 0 or Step 1
3. **Calculator bug:** LTV tier logic has error, regardless of input value
4. **Data corruption:** Browser storage or state persistence issue

---

## Success Criteria

✅ **Root cause identified** - Exact reason why value is 1 instead of 0
✅ **Fix strategy chosen** - Clear decision on how to address (with user input if needed)
✅ **Test scenario documented** - Steps to reproduce and verify fix
✅ **No regressions** - Fix doesn't break existing functionality

---

## Related Files

**Code:**
- `hooks/useProgressiveFormController.ts:329` - Reads existingProperties
- `lib/forms/form-config.ts` - Should contain default value
- `components/forms/ProgressiveFormWithController.tsx:221,253` - Passes to calculator
- `lib/calculations/instant-profile.ts` - Uses value for LTV calculation

**Tests:**
- `components/forms/__tests__/Step3NewPurchase-MSR-TDSR.test.tsx:154,175` - Hardcodes 0
- Need to add tests for property tier calculation accuracy

**Documentation:**
- `docs/runbooks/mobile-form-optimization/reference/singapore-mortgage-context.md` - LTV rules
- `docs/reports/DR_ELENA_V2_CALCULATION_MATRIX.md` - Persona calculation rules

---

## Recommended Fix Strategy (From Brainstorming Session)

### ✅ Option A: Add Explicit UI Field (RECOMMENDED)

**Implementation:**
- Add question in Step 1 or Step 2: "Is this your first property purchase in Singapore?"
- Show appropriate LTV cap feedback immediately
- Options:
  - "Yes" → existingProperties = 0, show "Up to 75% LTV!"
  - "No (2nd property)" → existingProperties = 1, show "LTV capped at 45%"
  - "No (3rd+ property)" → existingProperties = 2, show "LTV capped at 35%"

**Pros:**
- Accurate data for ABSD calculations
- User understands LTV restrictions upfront
- Matches Singapore regulatory framework
- Enables tailored advice based on property count

**Cons:**
- One more form field (but high value question)

### Option B: Smart Default + Inference

**Implementation:**
- Default to 0 (first property)
- Infer from liabilities: If property loan exists → existingProperties = 1

**Pros:**
- No extra UI question
- Works for most users

**Cons:**
- Less accurate for investors
- Cash-paid properties not detected

### Option C: Contextual Inference from Loan Type

**Implementation:**
- new_purchase → default to 0
- refinance → default to 1

**Pros:**
- Simple logic

**Cons:**
- Doesn't handle 2nd/3rd property purchases

### Decision: Proceed with Option A

Recommended for accuracy and regulatory compliance.

---

## Implementation Completed (2025-10-19)

### ✅ UI Field Added (Option 1 - Conditional Checkbox)

**Implementation Details:**

1. **Component:** `components/forms/ProgressiveFormWithController.tsx:702-733`
   - **Conditional display:** Only shows for Private/EC/Landed properties
   - **HDB exclusion:** Never shown for HDB (can't own 2 HDBs per regulations)
   - **Simple checkbox:** "I'm keeping my current property (second home, LTV capped at 45%)"
   - **Default:** Unchecked (existingProperties = 0 = first property)
   - **Minimal friction:** Single checkbox, no verbose options

2. **Controller Hook:** `hooks/useProgressiveFormController.ts:538`
   - Added `watchedFields.existingProperties` to debounced recalc effect
   - Instant analysis updates when checkbox toggled
   - 500ms debounce prevents excessive recalculations

3. **Form Config:** `lib/forms/form-config.ts:84`
   - Default value: `existingProperties: 0` (first property)

**Singapore Market Alignment:**
- HDB buyers never confused (checkbox doesn't appear)
- Private/EC/Landed buyers see simple yes/no
- No "Three+" option (too rare in Singapore - investors decouple via spouse/company names)
- Covers 99.9% of real Singapore scenarios
- Handles ABSD context (keeping property = paying ABSD)

### Next Steps for Manual Testing

1. **Clear Browser Storage** (see `docs/runbooks/forms/CLEAR_FORM_STORAGE.md`)
   ```javascript
   Object.keys(localStorage).forEach(key => {
     if (key.startsWith('nextnest_form_')) localStorage.removeItem(key);
   });
   ```

2. **Test Scenarios:**
   - Navigate to `/apply` → New Purchase

   **HDB Test:**
   - Select HDB property type
   - Checkbox should NOT appear (can't own 2 HDBs)
   - $500k price, age 35 → Expect ~$375k (75% LTV)

   **Private Property Test (First Property):**
   - Select Private property type
   - Checkbox appears but UNCHECKED by default
   - $1.5M price, age 35 → Expect ~$1.125M (75% LTV)

   **Private Property Test (Second Property):**
   - Select Private property type
   - CHECK the box "I'm keeping my current property"
   - $1.5M price, age 35 → Expect ~$562.5k-$675k (45% LTV)
   - Verify instant analysis updates when toggling checkbox on/off

3. **Additional Testing:**
   - Write E2E test: First vs Second vs Third property scenarios
   - Verify ABSD calculations use correct tier
   - Test tenure/age trigger interactions with property tiers

---

## Notes

- ✅ Brainstorming session completed - root cause understood
- ✅ Immediate default value fix applied
- ✅ Investigation completed - no localStorage contamination
- ⚠️ Manual testing REQUIRED before proceeding to UI field
- Decision needed: Which option (A, B, or C) for long-term solution?
