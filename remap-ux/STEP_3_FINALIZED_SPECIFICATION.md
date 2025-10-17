# 📋 STEP 3 FINALIZED SPECIFICATION
**Date: February 9, 2025**
**Status: APPROVED by Tech Team**

---

## ✅ FINAL STEP 3 DESIGN

### **Core Principle**
Step 3 maintains simplicity (3-4 fields) while capturing essential data for accurate TDSR/MSR calculations. It leverages the `combinedAge` field from Step 2 for IWAA calculation.

---

## 📊 FIELD SPECIFICATIONS

### **For SINGLE Applicant (3 fields)**

```typescript
interface Step3Single {
  monthlyIncome: number       // S$ prefix, min 0, max 9999999
  monthlyCommitments?: number  // Optional, default 0
  employmentType: 'employed' | 'self_employed'
}
```

### **For JOINT Application (4-5 fields)**

```typescript
interface Step3Joint {
  applicationType: 'single' | 'joint'  // Radio buttons
  applicant1Income: number              // Primary applicant
  applicant2Income: number              // Co-applicant
  monthlyCommitments?: number           // Combined, optional
  employmentType: 'both_employed' | 'mixed' | 'both_self'
}
```

---

## 🧮 BACKEND CALCULATIONS

### **Smart Defaults Applied**
- **combinedAge from Step 2**: Used for IWAA calculation
- **propertyCount**: 1 (assume selling current to avoid ABSD)
- **citizenship**: 'SC' (for preliminary calculations)
- **creditCards**: Included in monthlyCommitments if provided

### **IWAA Calculation**
```typescript
// Using combinedAge from Step 2 as proxy
const preliminaryIWAA = formData.step2.combinedAge

// For refinement (optional post-submission):
const accurateIWAA = (age1 * income1 + age2 * income2) / (income1 + income2)
```

### **TDSR/MSR Calculation**
```typescript
// Using Dr. Elena's formulas
const tdsr = (monthlyPayment + commitments) / income
const msr = propertyType === 'HDB' || propertyType === 'EC' 
  ? monthlyPayment / income 
  : null

// Stress test rate: 4% for residential
const stressTestRate = 4.0
```

---

## 🎯 UX FLOW

### **Progressive Disclosure**
1. Start with `applicationType` selection
2. If single: Show 3 fields
3. If joint: Show 4-5 fields with side-by-side income inputs
4. Real-time TDSR/MSR calculation as user types

### **Instant Value Delivery**
- After income: "You can afford up to $1.2M property"
- After commitments: "Maximum loan: $900k based on TDSR"
- If joint: "Combined profile allows 28-year tenure"

### **Post-Submission Refinement**
```
✅ Preliminary Assessment Complete!
Max Loan: S$650,000
TDSR: 45% (Healthy)

Want more accuracy?
[Refine Details] [Talk to AI Broker]
```

---

## 📱 MOBILE OPTIMIZATION

### **Input Patterns**
```html
<!-- Income fields -->
<input type="number" inputmode="numeric" pattern="[0-9]*" />

<!-- Side-by-side for joint (responsive) -->
<div class="flex flex-col sm:flex-row gap-3">
  <input placeholder="Age" class="w-full sm:w-20" />
  <input placeholder="Income" class="flex-1" />
</div>
```

### **Touch Targets**
- Minimum 44x44px for all interactive elements
- 8px spacing between fields
- Large radio buttons for applicationType

---

## 🔄 INTEGRATION POINTS

### **Data From Step 2**
- `combinedAge`: For IWAA calculation
- `propertyPrice`: For loan amount calculation
- `propertyType`: For MSR applicability
- `purchaseTimeline`: For urgency scoring

### **API Endpoints**
```typescript
// After Step 3 completion
POST /api/calculate-eligibility
{
  ...step1Data,  // name, email, phone
  ...step2Data,  // property details + combinedAge
  ...step3Data   // income, commitments, employment
}

// Response
{
  maxLoan: 650000,
  tdsr: 0.45,
  msr: null,  // or 0.25 for HDB/EC
  tenure: 28,
  monthlyPayment: 3200,
  confidence: 'high',
  refinementAvailable: true
}
```

---

## ✅ CONGRUENCY CHECKLIST

### **Files Updated**
- [x] `remap-ux/field-mapping-ux-improved.md` - Step 3 fields updated
- [x] `remap-ux/frontend-backend-ai-architecture-ux.md` - FormData interface updated
- [ ] `Remap/UX_IMPROVEMENT_IMPLEMENTATION_PLAN.md` - Task 2.3 needs update

### **Key Alignments**
- ✅ Step 3 uses `combinedAge` from Step 2 (no duplicate age collection)
- ✅ Employment type is explicitly asked (not inferred from income)
- ✅ Joint application fields are progressive (only show if needed)
- ✅ Backend applies smart defaults for missing data
- ✅ Post-submission refinement available for accuracy

---

## 🚀 IMPLEMENTATION NOTES

### **Priority Order**
1. Update `ProgressiveForm.tsx` with new Step 3 fields
2. Create TDSR/MSR calculation functions using Dr. Elena's formulas
3. Implement smart defaults in backend
4. Add post-submission refinement flow
5. Test on mobile devices

### **Success Metrics**
- Form completion rate: Target 60%+
- Time to complete Step 3: <30 seconds
- Mobile completion rate: >50%
- Refinement opt-in rate: 30-40%

---

## 📝 NOTES

This simplified Step 3 design:
- Maintains consistency with Steps 1-2 (simple, progressive)
- Captures essential data for accurate calculations
- Uses smart defaults to reduce user burden
- Provides clear upgrade path to refinement
- Optimizes for conversion while maintaining accuracy