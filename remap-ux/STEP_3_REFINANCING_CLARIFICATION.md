# 📋 STEP 3 FOR REFINANCING - CLARIFICATION
**Date: February 9, 2025**
**Based on Dr. Elena's Mortgage Expertise**

---

## 🔍 THE ISSUE

Step 2 for refinancing was missing `combinedAge`, which is CRITICAL for:
1. **Remaining tenure calculation**: 65 - age (or 75 for private)
2. **Monthly payment calculation**: Shorter tenure = higher payments
3. **Refinancing eligibility**: Some packages have age limits

---

## ✅ THE SOLUTION

### **Step 2 for REFINANCING now includes:**

```typescript
// Refinancing Step 2 Fields (in order):
1. currentRate: number        // Your current interest rate
2. outstandingLoan: number    // Remaining loan amount
3. currentBank: dropdown      // For exclusion from comparison
4. combinedAge: slider        // CRITICAL for tenure calculation ← NOW ADDED
5. lockInStatus: radio        // Timing assessment
6. propertyType: enum         // HDB/EC/Private (for MSR)
7. propertyValue: number      // Optional, for cash-out
```

### **Step 3 for REFINANCING remains the same:**

```typescript
// Step 3 is IDENTICAL for both New Purchase and Refinancing:

For SINGLE:
- monthlyIncome: number
- monthlyCommitments: number (optional)
- employmentType: dropdown

For JOINT:
- applicationType: radio (single/joint)
- applicant1Income + applicant2Income
- monthlyCommitments: combined
- employmentType: simplified
```

---

## 📊 HOW IT WORKS

### **New Purchase Flow:**
```
Step 2: propertyPrice + propertyType + combinedAge → Instant loan estimate
Step 3: income + commitments → TDSR/MSR calculation using Step 2's combinedAge
```

### **Refinancing Flow:**
```
Step 2: currentRate + outstandingLoan + combinedAge → Savings calculation
Step 3: income + commitments → Affordability check using Step 2's combinedAge
```

---

## 🧮 DR. ELENA'S CALCULATIONS

### **For Refinancing, we need age because:**

```typescript
// Maximum remaining tenure calculation
const maxRemainingTenure = propertyType === 'HDB' || propertyType === 'EC'
  ? Math.min(25, 65 - combinedAge)  // HDB/EC: 65 retirement age
  : Math.min(35, 75 - combinedAge)  // Private: 75 extended age

// This affects monthly payment
const monthlyPayment = calculatePayment(
  outstandingLoan,
  maxRemainingTenure,  // ← Age determines this!
  newInterestRate
)

// TDSR calculation needs the monthly payment
const tdsr = (monthlyPayment + commitments) / income
```

### **Without age, we CANNOT calculate:**
- Remaining tenure
- Accurate monthly payments
- TDSR/MSR ratios
- Refinancing eligibility

---

## 🎯 KEY TAKEAWAYS

1. **combinedAge is MANDATORY** for both New Purchase and Refinancing in Step 2
2. **Step 3 is IDENTICAL** for both loan types (income assessment)
3. **Backend uses combinedAge** from Step 2 for all IWAA/tenure calculations
4. **No duplicate age collection** in Step 3

---

## ✅ IMPLEMENTATION CHECKLIST

- [x] Add combinedAge to Step 2 New Purchase fields
- [x] Add combinedAge to Step 2 Refinancing fields  
- [x] Update field-mapping-ux-improved.md
- [ ] Update ProgressiveForm.tsx to include age slider for refinancing
- [ ] Ensure Step 3 uses Step 2's combinedAge for both loan types

---

## 📝 NOTES

The simplified approach works because:
- We collect age ONCE in Step 2 (for instant calculations)
- Step 3 focuses purely on income/commitments
- Backend combines Step 2 age + Step 3 income for IWAA
- This maintains our 3-4 fields per step goal