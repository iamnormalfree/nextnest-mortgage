---
title: "Step 2 Instant Analysis: Pure LTV Calculation Architecture"
created: 2025-10-19
status: active
phase: Design
priority: critical
tags: [forms, calculations, dr-elena-v2, instant-analysis]
---

# Step 2 Instant Analysis: Pure LTV Calculation Architecture

## Context

**CRITICAL ISSUES FOUND IN PHASE 0:**
1. **Line 342 of useProgressiveFormController.ts** - Hardcoded $8,000 income fallback applied in Step 2
2. **Step 2 calculation premature** - Applies MSR/TDSR calculations before income collected (Step 3)
3. **UI messaging misleading** - Shows "Based on your income" when income not yet provided

**Solution:** Create calculatePureLtvMaxLoan() function that calculates Step 2 results using ONLY:
- Property price
- Property type
- Existing properties count
- Age (for tenure caps)

NO income-based calculations (MSR/TDSR) until Step 3.

---

## #LCL_EXPORT_CRITICAL: Dr. Elena v2 LTV Policy Mapping

### LTV Tier Selection

**Source:** dr-elena-mortgage-expert-v2.json → computational_modules.ltv_limits.individual_borrowers

First property (existing_properties = 0):
  max_ltv_base: 75%
  max_ltv_reduced: 55%
  min_cash_base: 5%
  min_cash_reduced: 10%

Second property (existing_properties = 1):
  max_ltv_base: 45%
  max_ltv_reduced: 25%
  min_cash: 25%

Third+ property (existing_properties >= 2):
  max_ltv_base: 35%
  max_ltv_reduced: 15%
  min_cash: 25%

### LTV Reduction Triggers

**Source:** computational_modules.ltv_limits.tenure_or_age_triggers.rule

Rule: "Apply reduced LTV tier if (HDB flat tenure > 25y) OR (non-HDB tenure > 30y) OR (loan end age > 65)."

Implementation Logic:
  const tenureTriggerThreshold = property_type === 'HDB' ? 25 : 30
  const loanEndAge = age + tenure
  const reducedLtvTriggered = (tenure > tenureTriggerThreshold) || (loanEndAge > 65)
  const ltvPercentage = reducedLtvTriggered ? max_ltv_reduced : max_ltv_base

### Tenure Caps

**Source:** computational_modules.property_specific_rules

HDB:
  - Concessionary loan: 25 years (max_tenure_hdb_loan)
  - Bank loan: 30 years (max_tenure_bank_loan)

EC: Max tenure 35 years
Private: Max tenure 35 years  
Commercial: Max tenure 35 years

Age-based cap:
  const maxTenureByAge = 65 - age
  const maxTenureByType = getMaxTenureForPropertyType(property_type)
  const effectiveTenure = Math.min(maxTenureByAge, maxTenureByType)

### CPF vs Cash Split

**Source:** computational_modules.cpf_usage_rules.limits

withdrawal_limit_percent: 120  (120% of valuation limit)

First property base LTV (75%):
  min_cash_base: 5%
  Remainder: up to 120% can be CPF

First property reduced LTV (55%):
  min_cash_reduced: 10%
  Remainder: up to 120% can be CPF

Second/Third+ property:
  min_cash: 25%

Commercial Property Exception:
  cpf_usage: "Not allowed"
  Result: 100% cash down payment

### Rounding Rules

**Source:** computational_modules.rounding_rules

loan_eligibility:
  rule: "ROUND DOWN to nearest thousand"
  reason: "Protect clients from over-borrowing"
  formula: "Math.floor(value / 1000) * 1000"

funds_required:
  rule: "ROUND UP to nearest thousand"
  reason: "Ensure clients have sufficient funds"
  formula: "Math.ceil(value / 1000) * 1000"

---

## Function Specification

### A. Function Signature

Calculate Pure LTV Max Loan (Step 2 - NO INCOME DATA)

Uses ONLY property regulations, age, and LTV limits.
Does NOT apply MSR/TDSR calculations (those require income from Step 3).

Source: dr-elena-mortgage-expert-v2.json
- LTV limits: computational_modules.ltv_limits.individual_borrowers
- Tenure rules: computational_modules.property_specific_rules
- CPF rules: computational_modules.cpf_usage_rules
- Rounding: computational_modules.rounding_rules

export function calculatePureLtvMaxLoan(params: {
  property_price: number
  existing_properties: number
  age: number
  property_type: 'HDB' | 'Private' | 'EC' | 'Commercial'
}): PureLtvResult

### B. Result Interface

interface PureLtvResult {
  // Core Results
  maxLoanAmount: number           // Pure LTV calculation (rounded DOWN to $1k)
  ltvPercentage: number            // 75%, 55%, 45%, 35%, 25%, 15%
  downPaymentRequired: number      // property_price - maxLoanAmount (rounded UP to $1k)
  
  // CPF/Cash Breakdown
  cpfDownPayment: number           // CPF portion (up to 120% limit)
  cashDownPayment: number          // Cash portion (minimum required)
  minCashPercent: number           // Minimum cash requirement % (5%, 10%, 25%, 100%)
  
  // Tenure Analysis
  maxTenure: number                // Age-based tenure cap (65 - age)
  tenureByPropertyType: number     // Property type tenure cap
  effectiveTenure: number          // MIN(age cap, property type cap)
  
  // Regulatory Context
  reasonCodes: string[]            // E.g., ['first_property_75_ltv', 'tenure_capped_by_age']
  policyRefs: string[]             // E.g., ['MAS Notice 645', 'MAS Notice 632']
  
  // Calculation Type Flag
  calculationType: 'pure_ltv'      // Distinguishes from full MSR/TDSR analysis
}

### C. Implementation Pseudocode

See full implementation in plan document.

---

## Integration Points

### A. Replace Hardcoded Income in useProgressiveFormController.ts

CURRENT (WRONG - Line 342):
  const income = Math.max(
    parseNumber(formData.actualIncomes?.[0] ?? formData.monthlyIncome, 8000),
    0
  )

NEW (CORRECT):
  if (currentStep === 2) {
    const pureLtvResult = calculatePureLtvMaxLoan({
      property_price: propertyPrice,
      existing_properties: formData.existingProperties,
      age: parseNumber(formData.combinedAge, 35),
      property_type: formData.propertyType
    })
    setInstantCalcResult(pureLtvResult)
  }

### B. Update UI Messaging

CURRENT (MISLEADING):
  "Based on your income and MAS compliance"

NEW (ACCURATE):
  if (instantCalcResult.calculationType === 'pure_ltv'):
    "Based on property regulations and LTV limits"
  else:
    "Based on your income and MAS compliance"

---

## Test Scenarios

All test scenarios documented in full plan with expected outputs.

---

## Implementation Checklist

- [ ] Create calculatePureLtvMaxLoan() in lib/calculations/instant-profile.ts
- [ ] Add PureLtvResult interface
- [ ] Update useProgressiveFormController.ts line 342
- [ ] Add calculationType discriminator to InstantCalcResult
- [ ] Update UI messaging in ProgressiveFormWithController.tsx
- [ ] Write unit tests for all scenarios
- [ ] Verify Dr. Elena v2 compliance

---

## Success Criteria

1. Step 2 calculation uses ZERO income data
2. UI messaging accurately reflects calculation type
3. All test scenarios pass
4. Dr. Elena v2 compliance verified
5. Smooth Step 2 → Step 3 transition

