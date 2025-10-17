---
title: 2025-08-31-mortgageinput-type-consolidation
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-08-31
---

# MortgageInput Type Consolidation - Session Summary

**Date:** 2025-08-31  
**Session Focus:** Consolidating MortgageInput and EnhancedMortgageInput types to eliminate redundancy

## Problem Identified

The codebase had two mortgage input types that were essentially identical:
- `MortgageInput` - Already contained all Singapore-specific fields
- `EnhancedMortgageInput` - Extended MortgageInput with lead capture fields (name, email, phone)

This created confusion and maintenance overhead without providing real value.

## Solution Implemented

### ✅ **Type Consolidation Strategy**
1. **Keep `MortgageInput`** - Already had all necessary Singapore mortgage fields
2. **Remove `EnhancedMortgageInput`** - Redundant extension only added lead capture fields
3. **Separate concerns** - Lead capture data handled in forms, not calculations

### ✅ **Files Modified**

**1. `types/mortgage.ts`**
- Removed `EnhancedMortgageInput` export and interface
- Added comment explaining separation of concerns
- Kept `MortgageInput` with all Singapore-specific fields:
  - `loanAmount`, `interestRate`, `loanTerm` (core)
  - `monthlyIncome`, `existingDebt`, `propertyType`, `citizenship`, etc. (Singapore-specific)

**2. `lib/calculations/mortgage.ts`**
- Updated import to remove `EnhancedMortgageInput`
- Updated all function signatures to use `MortgageInput`:
  - `calculateMortgage(input: MortgageInput)`
  - `calculateSingaporeMetrics(input: MortgageInput, ...)`
  - `calculateLeadScore(inputs: MortgageInput, ...)`
- Renamed `calculateEnhancedMortgage` → `calculateMortgageWithMetrics` for clarity
- All functions now use unified `MortgageInput` type

**3. `components/calculators/SingaporeMortgageCalculator.tsx`**
- Updated imports: `EnhancedMortgageInput` → `MortgageInput`
- Updated form types and function calls
- Updated function call: `calculateEnhancedMortgage` → `calculateMortgageWithMetrics`

### ✅ **Implementation Process**

1. **Analysis Phase**
   - Searched codebase for all `MortgageInput` and `EnhancedMortgageInput` references
   - Identified that `MortgageInput` already contained all necessary fields
   - Found only 3-4 active files needed updates (others were backup files)

2. **Type Definition Updates**
   - Removed redundant `EnhancedMortgageInput` interface
   - Updated imports across codebase

3. **Function Signature Updates**
   - Updated all calculation functions to use `MortgageInput`
   - Renamed wrapper function for clarity

4. **Component Updates**
   - Updated React components to use unified type
   - Maintained all functionality while simplifying types

5. **Verification**
   - Confirmed no TypeScript errors
   - Verified application compiles successfully
   - Tested dashboard loads without runtime errors

## Key Benefits Achieved

### ✅ **Simplified Architecture**
- **Single source of truth**: Only `MortgageInput` type needed
- **Eliminated confusion**: No more "basic" vs "enhanced" distinction
- **Cleaner API**: One unified type for all mortgage calculations
- **Better maintainability**: Fewer types to manage and keep in sync

### ✅ **Preserved Functionality**
- All Singapore-specific fields maintained in `MortgageInput`
- All regulatory compliance calculations (TDSR, MSR, LTV) intact
- Lead capture handled separately in form processing
- No breaking changes to calculation logic

### ✅ **Code Quality Improvements**
- More descriptive function names (`calculateMortgageWithMetrics`)
- Clear separation of concerns (mortgage calculations vs lead capture)
- Consistent type usage across codebase
- Reduced cognitive overhead for developers

## Technical Details

### **MortgageInput Interface (Final)**
```typescript
export interface MortgageInput {
  // Core mortgage fields
  loanAmount: number
  interestRate: number
  loanTerm: number
  downPayment?: number
  propertyValue?: number
  
  // Singapore-specific inputs
  monthlyIncome?: number
  existingDebt?: number
  propertyType?: 'HDB' | 'EC' | 'Private' | 'Commercial'
  citizenship?: 'Citizen' | 'PR' | 'Foreigner'
  isFirstProperty?: boolean
  currentBank?: string
  commercialBuyerType?: 'individual' | 'operating_company' | 'investment_company'
}
```

### **Key Functions (Post-Refactor)**
- `calculateMortgage(input: MortgageInput)` - Basic payment calculation
- `calculateMortgageWithMetrics(input: MortgageInput)` - Full calculation with Singapore metrics
- `calculateSingaporeMetrics(input: MortgageInput, ...)` - TDSR/MSR/LTV calculations
- `calculateLeadScore(inputs: MortgageInput, ...)` - Lead scoring algorithm

### **Validation**
- ✅ TypeScript compilation successful
- ✅ No lint errors related to type changes
- ✅ Dashboard application loads correctly
- ✅ All mortgage calculation features preserved

## Files Not Modified

**Backup Files (Ignored)**
- `lib/calculations/mortgage.backup.ts`
- `components/calculators/SingaporeMortgageCalculator.backup.tsx`
- Files in `.NextNest_Mortgage_Calculator/` directory

These contain old references to `EnhancedMortgageInput` but are not part of the active codebase.

## Conclusion

Successfully consolidated mortgage input types from a confusing dual-type system to a clean, unified architecture. The refactoring:

- **Eliminated redundancy** without losing functionality
- **Improved code clarity** and maintainability  
- **Simplified the developer experience**
- **Maintained all Singapore-specific mortgage features**
- **Preserved backward compatibility** in terms of functionality

The mortgage calculation system now has a single, comprehensive input type that handles both basic and advanced Singapore mortgage scenarios seamlessly.