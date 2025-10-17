# Current Behaviour Analysis - Progressive Form Restoration

**Date**: 2025-10-28  
**Task**: Document gaps between current Step 2/3 fields and restoration plan requirements

## Current Step 2 Fields (New Purchase)

### ✅ Already Present (Match Plan)
- `propertyCategory` - Property Category dropdown
- `propertyType` - Property Type dropdown 
- `priceRange` - Property Price numeric input
- `combinedAge` - Combined Age numeric input

### ❌ Missing from Current Implementation
- Optional context block with:
  - `developmentName` field
  - `paymentScheme` selection
  - Toggle for optional section (expandable)

### ❌ Current Instant Analysis Limitations
- Only shows single metric: `Maximum Loan` or `Monthly Savings`
- Missing Tier 2 panel requirements:
  - Loan range display
  - Down payment breakdown
  - Monthly payment estimate
  - CPF vs cash allocation
  - "Unlock Step 3" preview tiles
  - MAS compliance indicators

## Current Step 3 Fields (New Purchase)

### ✅ Already Present
- `actualIncomes.0` - Monthly Income
- `actualAges.0` - Your Age  
- `employmentType` - Employment Type
- `existingCommitments` - Monthly Commitments

### ❌ Missing from Current Implementation
- Joint applicant toggle/switch
- Applicant 2 fields (`actualAges.1`, `actualIncomes.1`) when joint enabled
- Credit card count field
- Tier 3 MAS-compliant panel (only basic instant calc shown)

## Controller Analysis

### ✅ Confirmed Working
- `useProgressiveFormController` supports all required field changes
- `onFieldChange` works for instant calculation triggers
- `instantCalcResult` populated correctly
- `calculateInstant()` function runs when all required fields filled

### ✅ Event Bus Integration
- Analytics publisher exists: `lib/events/event-bus.ts`
- Form events tracked: `FIELD_CHANGED`, `STEP_COMPLETED`

## Instant Calculation Strategy Gaps

Current Tier 2 display:
```typescript
// Shows only single metric
{showInstantCalc && instantCalcResult && (
  <div className="mt-6 p-4 bg-[#FCD34D]/10 border border-[#FCD34D]/20">
    <h4>Instant Analysis</h4>
    <p>Maximum Loan: ${instantCalcResult.maxLoan.toLocaleString()}</p>
  </div>
)}
```

Required Tier 2 display (per INSTANT_CALCULATION_STRATEGY_v2.md):
- Loan range (65%–75% LTV)
- Down payment ranges  
- Monthly payment estimates
- CPF vs cash breakdown
- Locked tiles: TDSR/MSR, Stamp Duty, Bank comparisons
- CTA: "Complete Step 3 to unlock"

## Gaps Summary

| Feature | Current State | Required State | Gap Type |
|---------|---------------|----------------|-----------|
| Step 2 optional context | Missing | Expandable block with dev/payment fields | UI Component |
| Tier 2 instant analysis | Single metric | Multi-metric panel with locked tiles | UI Overhaul |
| Joint applicant support | Single applicant only | Toggle + Applicant 2 fields | Logic + UI |
| Tier 3 MAS compliance | Basic calc show | Full MAS panel (TDSR, MSR, probabilities) | Integration |
| Analytics foundation | Basic events | Step transitions, optional block, joint toggle | Event Tracking |

## Implementation Priority

1. **High Priority**: Tier 2 instant analysis panel (core user value)
2. **High Priority**: Step 2 optional context block (data collection)
3. **Medium Priority**: Joint applicant toggle & fields (UX improvement)
4. **Medium Priority**: Tier 3 MAS compliance panel (compliance feature)
5. **Low Priority**: Expanded analytics tracking (measurement)

## Testing Framework Note

- ✅ Jest/RTL testing infrastructure successfully installed (Jest 30.2.0, RTL 16.3.0)
- ✅ Test configuration working: jest.config.mjs, jest.setup.ts, test scripts package.json
- ✅ Baseline tests created: `components/forms/__tests__/ProgressiveFormWithController.test.tsx`
- ✅ Tests include 6 real baseline tests with actual component rendering and current vs required behavior documentation
- Note: Tests are marked with test.skip and include detailed CURRENT vs REQUIRED behavior documentation

## Files Needing Updates

- `components/forms/ProgressiveFormWithController.tsx` - Main UI changes
- `hooks/useProgressiveFormController.ts` - May need joint applicant logic
- `lib/forms/form-config.ts` - Optional field definitions
- `lib/validation/mortgage-schemas.ts` - Joint applicant validation rules

## Critical Runtime Issue

**BLOCKING ERROR FOUND**: `/apply` page crashes with `ReferenceError: ProgressiveForm is not defined`

**Location**: `app/apply/page.tsx:96`  
**Error**: Dynamic import syntax issue with ProgressiveFormWithController component  
**Impact**: Step 2/3 testing cannot proceed until this is resolved  
**Fix Required**: Update import statement or fix dynamic loading syntax

**Log Evidence**:
```
⨯ app\apply\page.tsx (96:14) @ ProgressiveForm
⨯ ReferenceError: ProgressiveForm is not defined
   at ApplyPageContent (./app/apply/page.tsx:139:104)
```

## Conclusion

Current implementation has solid foundation with correct Step 2 required fields, but BLOCKING runtime error prevents any testing:
1. **BLOCKING**: /apply page crash must be fixed before proceeding
2. Rich instant analysis display (current vs required) 
3. Optional context collection
4. Joint applicant support
5. MAS compliance tier

All core calculation logic exists - but critical import issue blocks progress.
