# 🏦 LOAN TENURE CALCULATION RULES
**CRITICAL: DO NOT MODIFY WITHOUT PERMISSION**

## ⚠️ PROTECTED BUSINESS LOGIC

This document defines the loan tenure calculation rules implemented in `lib/calculations/mortgage.ts`. These rules are based on **Singapore MAS (Monetary Authority of Singapore) regulations** and are **PROTECTED** from unauthorized changes.

## 📋 TENURE CALCULATION MATRIX

### **HDB Properties**

| LTV Ratio | Formula | Cap | Example (Age 35) |
|-----------|---------|-----|------------------|
| **75%** | 65 - age | 25 years max | 65-35 = **30y** → capped at **25y** |
| **55%** | 75 - age | 30 years max | 75-35 = **40y** → capped at **30y** |

### **EC/Private Properties**

| LTV Ratio | Formula | Cap | Example (Age 35) |
|-----------|---------|-----|------------------|
| **75%** | 65 - age | 30 years max | 65-35 = **30y** → **30y** |
| **55%** | 75 - age | 35 years max | 75-35 = **40y** → capped at **35y** |

## 🔒 IMPLEMENTATION DETAILS

### **Code Location**
- **File**: `lib/calculations/mortgage.ts`
- **Function**: `calculateInstantEligibility()`
- **Lines**: Look for `⚠️ CRITICAL CALCULATION` comments

### **Current Logic**
```typescript
// ⚠️ CRITICAL CALCULATION - DO NOT MODIFY WITHOUT PERMISSION
if (ltvRatio > 0.55) {
  // 75% LTV scenario - stricter tenure limits
  if (isHDB) {
    maxTenure = Math.min(25, Math.max(5, 65 - combinedAge));
  } else {
    maxTenure = Math.min(30, Math.max(5, 65 - combinedAge));
  }
} else {
  // 55% LTV scenario - longer tenure allowed
  if (isHDB) {
    maxTenure = Math.min(30, Math.max(5, 75 - combinedAge));
  } else {
    maxTenure = Math.min(35, Math.max(5, 75 - combinedAge));
  }
}
// ⚠️ END CRITICAL CALCULATION
```

## 🎯 BUSINESS RATIONALE

### **Why These Rules Exist**
1. **Regulatory Compliance**: MAS requirements for responsible lending
2. **Risk Management**: Lower LTV = longer tenure allowed
3. **Property Type Differentiation**: Different rules for HDB vs Private
4. **Age-Based Limits**: Ensure loans complete before retirement age

### **75% vs 55% LTV Strategy**
- **75% LTV**: Standard loan with stricter tenure (most common)
- **55% LTV**: Lower risk loan with extended tenure options

## 🚫 CHANGE CONTROL

### **BEFORE Making ANY Changes:**
1. **STOP** and get explicit permission from:
   - Product Owner
   - Mortgage Expert
   - Business Stakeholder

2. **Document** the business case for the change

3. **Update** all related documentation:
   - This file (LOAN_TENURE_RULES.md)
   - RECONCILIATION_PLAN.md
   - JUNIOR_DEV_IMPLEMENTATION_GUIDE.md

4. **Test** thoroughly with all combinations:
   - Property Types: HDB, EC, Private, Landed
   - LTV Ratios: 75%, 55%
   - Age Ranges: 21-65 years

### **What CAN Be Changed (UI Only)**
✅ Display formatting of tenure
✅ Error messages and tooltips
✅ Input field styling
✅ Explanation text

### **What CANNOT Be Changed**
❌ Tenure calculation formulas
❌ LTV ratio options (75%/55%)
❌ Property type categorization
❌ Age limits and caps
❌ The core business logic

## 📞 ESCALATION PROCESS

If you need to modify this logic:

1. **Contact**: Product Owner immediately
2. **Provide**: Business justification
3. **Wait**: For explicit written approval
4. **Document**: All changes in this file
5. **Test**: Comprehensive regression testing
6. **Deploy**: Only after stakeholder sign-off

## 🔍 TESTING SCENARIOS

When testing changes, verify these scenarios:

| Property | LTV | Age | Expected Tenure | Notes |
|----------|-----|-----|----------------|-------|
| HDB | 75% | 35 | 25 years | Capped at 25y |
| HDB | 75% | 45 | 20 years | 65-45 = 20y |
| HDB | 55% | 35 | 30 years | Capped at 30y |
| HDB | 55% | 50 | 25 years | 75-50 = 25y |
| Private | 75% | 35 | 30 years | 65-35 = 30y |
| Private | 75% | 40 | 25 years | 65-40 = 25y |
| Private | 55% | 35 | 35 years | Capped at 35y |
| Private | 55% | 45 | 30 years | 75-45 = 30y |

---

## 📝 CHANGE LOG

### **2025-09-04**
- Initial documentation created
- Protected calculation rules documented
- Change control process established

---

**⚠️ REMEMBER: This is PROTECTED business logic. Always get permission before making changes!**