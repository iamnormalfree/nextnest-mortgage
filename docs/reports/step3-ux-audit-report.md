# Step 3 New Purchase - UX Audit Report

**Date:** 2025-10-19  
**Test Scope:** Step 3 New Purchase flow (Income, Age, Liabilities, MAS Readiness Check)  
**Testing Method:** Code review + Playwright E2E testing

---

## Executive Summary

Total Issues Identified: **18**
- Critical: **2**
- High: **7**
- Medium: **6**
- Low: **3**

---

## Critical Issues

### 1. Income field accepts negative numbers

**Location:** Step 3 > Income Details > Monthly income input (line 428)  
**User Impact:** Users can enter negative income values (e.g., "-5000") which are mathematically invalid. This corrupts TDSR/MSR calculations and leads to incorrect eligibility assessments.  
**Severity:** Critical

**Current Code:**
\
**Recommendation:**
- Add min="0" attribute to prevent negative values
- Add client-side validation in onChange handler
- Add Zod schema validation with .min(0) constraint

---

### 2. Age field accepts negative numbers and unrealistic values

**Location:** Step 3 > Income Details > Your Age input (line 489)  
**User Impact:** Users can enter negative ages (e.g., "-5") or unrealistic ages (e.g., "150"), causing incorrect loan tenure calculations and invalid eligibility results.  
**Severity:** Critical

**Recommendation:**
- Add min="18" and max="99" attributes
- Display helpful error message: "Age must be between 18 and 99"
- Add Zod validation: .min(18).max(99)

---

## High Priority Issues

### 3. Variable income field accepts negative numbers

**Location:** Step 3 > Variable/bonus income input (line 459)  
**User Impact:** Negative bonus income can be entered, distorting income recognition calculations.  
**Severity:** High

### 4. Liability balance fields accept negative numbers

**Location:** Step 3 > Financial Commitments > Outstanding balance inputs (line 691)  
**User Impact:** Negative loan balances are nonsensical and corrupt TDSR calculations.  
**Severity:** High

### 5. Liability monthly payment fields accept negative numbers

**Location:** Step 3 > Financial Commitments > Monthly payment inputs (line 719)  
**User Impact:** Negative monthly payments corrupt TDSR calculations.  
**Severity:** High

### 6. Self-employed business age accepts negative numbers

**Location:** Step 3 > Self-employed details > Business age input (line 292)  
**User Impact:** Negative business ages are invalid.  
**Severity:** High

### 7. Number inputs accept leading zeros ("0 prefix bug")

**Location:** All number input fields  
**User Impact:** Users can enter "08000" instead of "8000", causing visual confusion.  
**Severity:** High

**Recommendation:**
- Add onChange handler to strip leading zeros: value.replace(/^0+(?=d)/, '')
- Or use type="text" with inputmode="numeric" pattern

### 8. No visual feedback when MAS calculations update

**Location:** Step 3 > MAS Readiness Check card (line 771)  
**User Impact:** When users change income/age/liabilities, TDSR/MSR values update silently. Users may not notice the calculations have changed.  
**Severity:** High

**Recommendation:**
- Add actual timestamp that updates when calculations re-run
- Add subtle animation/flash when values change
- Consider adding loading state during calculation

---

## Medium Priority Issues

### 9. Age field accepts decimal values

**Location:** Step 3 > Your Age input (line 489)  
**User Impact:** Users can enter "35.5" which is unusual for age entry.  
**Severity:** Medium

**Recommendation:** Add step="1" attribute to restrict to integers

### 10. Income fields accept very large unrealistic values

**Location:** All income input fields  
**User Impact:** Users can enter astronomical values like "9999999999" causing overflow.  
**Severity:** Medium

**Recommendation:** Add reasonable max attribute (e.g., max="500000" for Singapore context)

### 11. No placeholder text showing expected format

**Location:** Several liability input fields  
**User Impact:** Users unsure of expected format.  
**Severity:** Medium

### 12. Liabilities panel - No indication when fields are cleared by "No" button

**Location:** Step 3 > Financial Commitments (line 608-641)  
**User Impact:** When user clicks "Yes" then "No", all liability data is cleared silently.  
**Severity:** Medium

**Recommendation:** Add confirmation dialog or visual transition

### 13. Variable income panel - No explanation of 60% recognition rate

**Location:** Step 3 > Variable income employment type (line 339-405)  
**User Impact:** Users see "Income recognition: 60%" but don't understand WHY.  
**Severity:** Medium

**Recommendation:** Add tooltip explaining MAS regulations

### 14. Self-employed panel - No explanation of 70% recognition rate

**Location:** Step 3 > Self-employed employment type (line 272-337)  
**User Impact:** Similar to #13 - unclear why only 70% recognized.  
**Severity:** Medium

---

## Low Priority Issues

### 15. No visual distinction between required and optional fields

**Location:** Throughout Step 3  
**User Impact:** Users uncertain which fields MUST be filled.  
**Severity:** Low

### 16. Employment recognition rate displays as integer (100%, 70%)

**Location:** Step 3 > Employment type dropdown helper text (line 555)  
**User Impact:** Minor - could be more precise with decimal places.  
**Severity:** Low

### 17. Other commitments textarea has no character limit

**Location:** Step 3 > Financial Commitments > Other commitments (line 749)  
**User Impact:** Users could enter extremely long text causing layout issues.  
**Severity:** Low

**Recommendation:** Add maxLength="500" attribute with character counter

---

## Implementation Priority

### Phase 1 (Immediate - Critical Issues)
- Add min="0" to all income and liability inputs
- Add min="18" max="99" to age input
- Add Zod validation schemas for all numeric fields

### Phase 2 (Next Sprint - High Priority)
- Fix leading zero behavior in number inputs
- Add visual feedback for MAS calculation updates
- Add input validation error messages

### Phase 3 (Future - Medium/Low Priority)
- Add confirmation dialog for liability clearing
- Add explanatory tooltips for recognition rates
- Add character limits to text inputs

---

**Report Generated:** 2025-10-19  
**Tool:** Playwright E2E + Manual Code Review  
**Component:** components/forms/sections/Step3NewPurchase.tsx
