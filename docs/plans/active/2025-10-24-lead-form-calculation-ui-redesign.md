---
status: draft
complexity: medium
estimated_hours: 6
constraint: A
can_tasks: CAN-001, CAN-016, CAN-020, CAN-036
related_plans: 2025-10-30-progressive-form-experience-implementation-plan.md
---

# Lead Form Calculation UI Redesign

## Problem

Step 3 (New Purchase) calculation display has multiple UX issues identified during brainstorming:

1. **Calculation Bug**: Shows $440k (55% LTV) when should default to $600k (75% LTV)
2. **Misleading Toggle**: 55% LTV option confuses users - shows property × 55% without considering income/TDSR (false precision)
3. **Verbose Copy**: "Dr Elena" internal references, overly technical language
4. **Premature Details**: Monthly payment and CPF breakdown shown without income data (misleading assumptions)
5. **No Progressive Disclosure**: All form fields shown at once, creating invalid property category/type combinations
6. **Misaligned with Re-Strategy**: Doesn't convey "Assured Intelligence" brand (transparent + empowering)

User should feel: "I can borrow X, so I don't need as much cash!" (empowering) AND "I understand what drives this number" (transparent).

## Success Criteria

- [ ] Property category shown first, property type appears only after category selected (progressive disclosure)
- [ ] Property type dropdown only shows valid types for selected category
- [ ] Calculation defaults to 75% LTV (first home) or 45% LTV (second home checkbox)
- [ ] 55% LTV toggle removed entirely from Step 3
- [ ] Max loan amount displayed prominently with empowering copy
- [ ] Personalized property caveats shown (CPF usage, tenure based on age + property type)
- [ ] Monthly payment and CPF breakdown removed from Step 3 (moved to detailed calculator)
- [ ] All "Dr Elena" references removed from user-facing copy
- [ ] Tests verify correct LTV calculation for all property types + second home scenarios
- [ ] Tests verify correct tenure calculation (age limit vs property limit)
- [ ] Mobile responsive (320px+)

## Tasks

### Task 1: Update Dr Elena v2 HDB Tenure Rules (✅ COMPLETED)
- [x] Fixed `dr-elena-mortgage-expert-v2.json` with precise HDB tenure structure
- [x] Replaced ambiguous fields with `tenure_rules` object
- [x] Distinguished: purchase_normal (25y), purchase_extended (30y), refinancing rules

**Evidence**: Agent completed this during brainstorming session.

### Task 2: Write Failing Tests for Calculation Logic (TDD) (1h)

**Test file**: `tests/components/ProgressiveFormCalculation.test.tsx`

Write tests FIRST (should fail initially):

- [ ] Test: Private condo (resale), age 40, first home → $600k loan, 25yr tenure (age limit)
- [ ] Test: HDB (resale), age 30, first home → $600k loan, 25yr tenure (HDB limit)
- [ ] Test: HDB (resale), age 30, second home → $360k loan (45% LTV), 25yr tenure
- [ ] Test: Commercial, age 35, first home → $600k loan, "Cannot use CPF" caveat
- [ ] Test: EC (new), age 45 → Shows "Income cap applies if buying from developer"
- [ ] Test: Progressive disclosure - property type hidden until category selected
- [ ] Test: Property type options filtered by category (e.g., "resale" only shows HDB/Private/EC/Landed resale)
- [ ] Test: Calculation hidden until all fields filled

Run tests: `npm test -- ProgressiveFormCalculation.test.tsx` (should see 8 failures)

### Task 3: Create Calculation Helper Functions (1h)

**File**: `lib/calculations/property-loan-helpers.ts`

Implement the pure calculation functions:

- [ ] `calculateMaxLoan(propertyPrice, isSecondHome)` → returns max loan (75% or 45% LTV)
- [ ] `getPropertyTenureLimit(propertyType)` → returns max years from Dr Elena v2 rules
- [ ] `calculateMaxTenure(combinedAge, propertyType)` → returns min(65-age, propertyLimit)
- [ ] `getTenureMessage(maxTenure, ageLimit, propertyLimit, propertyType, combinedAge)` → returns user-friendly string
- [ ] `generatePropertyCaveats(propertyPrice, propertyCategory, propertyType, combinedAge, isSecondHome)` → returns { maxLoan, caveats[] }

Link to canonical: Uses `dr-elena-mortgage-expert-v2.json` via `DR_ELENA_*` constants from `lib/calculations/dr-elena-constants.ts`

Run tests: Should now pass 5/8 tests (calculation logic works, UI not yet updated)

### Task 4: Update ProgressiveFormWithController - Progressive Disclosure (2h)

**File**: `components/forms/ProgressiveFormWithController.tsx`

**Target:** Lines 594-700 (property category/type fields)

- [ ] Property type dropdown already has conditional logic - verify it filters correctly by category
- [ ] Check existing `PROPERTY_TYPES_BY_CATEGORY` mapping (should be in form-config.ts)
- [ ] Verify property type resets when category changes
- [ ] Remaining fields (price, age, checkbox) should show after type selected - implement if missing

Run tests: Should now pass 7/8 tests (progressive disclosure works, calculation display pending)

### Task 5: Update ProgressiveFormWithController - Calculation Display (1.5h)

**File**: `components/forms/ProgressiveFormWithController.tsx`

**Target:** Lines 998-1062 (inline calculation display JSX)

Replace calculation display section:

- [ ] Call `generatePropertyCaveats()` when all fields filled
- [ ] Display max loan with empowering headline: "✨ You can borrow up to $X"
- [ ] Display personalized caveats in amber warning box
- [ ] Style with gradient background (blue-50 to indigo-50)
- [ ] Add CTA link to "detailed calculator" (placeholder for now)
- [ ] Remove monthly payment display
- [ ] Remove CPF breakdown display
- [ ] Remove "View full breakdown" expandable section

Run tests: All 8 tests should pass

### Task 6: Mobile Responsive Testing (0.5h)

- [ ] Test on 320px viewport (smallest mobile)
- [ ] Test on 375px viewport (iPhone SE)
- [ ] Test on 390px viewport (iPhone 12/13)
- [ ] Verify no horizontal scroll
- [ ] Verify text readable, buttons tappable (44px minimum)

Manual QA on real devices or browser DevTools.

## Testing Strategy

**Unit Tests** (`tests/components/ProgressiveFormCalculation.test.tsx`):
- Calculation logic (max loan, tenure, caveats)
- Helper functions (calculateMaxLoan, generatePropertyCaveats, etc.)
- Property type filtering by category

**Integration Tests** (`tests/integration/lead-form-flow.test.ts`):
- Complete flow: Select category → type → fill fields → see calculation
- Second home checkbox toggles LTV correctly
- Category change resets property type

**E2E Tests** (update existing form E2E tests):
- Update expectations to match new calculation UI
- Remove assertions for 55% toggle (no longer exists)
- Verify personalized caveats appear
- Test progressive disclosure flow

**Manual QA Checklist**:
- [ ] All property category/type combinations show correct caveats
- [ ] Age-based tenure calculations accurate
- [ ] Second home checkbox works correctly
- [ ] Copy is clear and non-technical
- [ ] Mobile responsive (320px+)

## Rollback Plan

Low risk (UI only, no schema changes). If needed: Git revert single commit, or feature flag toggle. Old component archived to `components/archive/2025-10/`.

## Dependencies

**Canonical References**:
- `dr-elena-mortgage-expert-v2.json` (updated with precise HDB tenure rules)
- `lib/calculations/dr-elena-constants.ts` (existing constants)

**Related Plans**:
- `2025-10-30-progressive-form-experience-implementation-plan.md` (marked needs_corrections - this fixes it)

**UI Components**:
- Existing shadcn components (Select, Input, Checkbox, Label)

**Re-Strategy Alignment**:
- Part 04 (Brand & UX Canon) - "Assured Intelligence" voice
- Constraint A - Public Surfaces Ready (homepage, form, chat accessibility)
- CAN-001, CAN-016, CAN-020, CAN-036 (brand messaging, accessibility)

## File Changes Summary

**Modified**:
- `components/forms/ProgressiveFormWithController.tsx` (lines 998-1062, calculation display rewrite)
- `dr-elena-mortgage-expert-v2.json` (HDB tenure rules - already done)

**Created**:
- `lib/calculations/property-loan-helpers.ts` (new calculation helpers)
- `tests/components/ProgressiveFormCalculation.test.tsx` (new test file)

**Note:** ProgressiveFormWithController is large file - only modifying inline calculation JSX block (lines 998-1062), not extracting to separate component

## Success Metrics

**Quantitative**:
- Calculation accuracy: 100% correct max loan for all property type combinations
- Mobile viewports: 0 horizontal scroll on 320px+
- Test coverage: ≥90% for calculation logic
- Performance: No regression in form render time

**Qualitative**:
- Users report "I understand what I can borrow" (exit survey)
- No confusion about 55% vs 75% LTV (removed choice paralysis)
- Copy feels transparent and empowering (re-strategy alignment)
- Progressive disclosure feels natural (not overwhelming)

## Notes

Applies "Assured Intelligence" brand - transparent about what we know (LTV caps, tenure limits) and honest about what we don't (monthly payment needs income). 55% LTV at Step 3 is false precision - removed. Write tests FIRST (Task 2). Serves Constraint A (Public Surfaces Ready).
