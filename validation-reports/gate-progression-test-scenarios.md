# 🧪 GATE PROGRESSION TESTING SCENARIOS
**Task 9.2**: Test all gate progression paths  
**Date**: 2025-01-09  
**Status**: Ready for Testing

---

## 🎯 TEST OBJECTIVES

1. **Validate Gate Flow**: Ensure 0→1→2→3 progression works for all loan types
2. **Schema Validation**: Confirm each gate validates correctly
3. **AI Integration**: Verify AI processing at Gates 2 & 3  
4. **Commercial Routing**: Test direct broker routing for commercial loans
5. **Property Routing**: Test property category selection for new_purchase

---

## 📋 TEST SCENARIOS

### **Scenario 1: New Purchase - Resale Property** 
**Path**: Gate 0 → Gate 1 → Gate 2 → Gate 3 → AI Analysis

#### Gate 0: Loan Type Selection
```javascript
// Test Data
loanType: 'new_purchase'

// Expected Behavior
✅ Form advances to Gate 1
✅ No validation errors
✅ loanType stored in formState.gate0Data
```

#### Gate 1: Basic Information  
```javascript
// Test Data
name: 'John Tan'
email: 'john.tan@example.com'

// Expected Behavior  
✅ Form advances to Gate 2
✅ Email validation passes
✅ Name format validation passes
✅ Data stored in formState.gate1Data
```

#### Gate 2: Contact & Property Selection
```javascript
// Test Data
phone: '91234567'
propertyCategory: 'resale' // NEW FIELD

// Expected Behavior
✅ Phone validation (Singapore format)
✅ Property category selector appears
✅ Resale-specific fields rendered
✅ Form advances to Gate 3
✅ AI processing triggered (situational analysis)
```

#### Gate 3: Optimization Parameters
```javascript
// Test Data  
monthlyIncome: 12000
existingCommitments: 3000
packagePreference: 'lowest_rate'
riskTolerance: 'moderate'
planningHorizon: 'medium_term'

// Expected Behavior
✅ Financial validation passes
✅ Optimization preferences stored
✅ Full AI analysis triggered
✅ SimpleAgentUI displays insights
✅ Broker consultation CTA appears
```

---

### **Scenario 2: Refinance - Locked Property**
**Path**: Gate 0 → Gate 1 → Gate 2 → Gate 3 → AI Analysis

#### Gate 0 → Gate 1
```javascript
loanType: 'refinance'
name: 'Mary Lim'  
email: 'mary.lim@example.com'

// Expected: Standard progression ✅
```

#### Gate 2: Refinance-Specific Fields
```javascript
phone: '98765432'
// Refinance-specific fields should appear
currentRate: 3.5
lockInStatus: 'locked'
currentBank: 'DBS'
propertyValue: 800000
outstandingLoan: 200000

// Expected Behavior
✅ Refinance fields rendered (not property category)
✅ Lock-in status affects urgency calculation  
✅ AI processing generates lock-in timing insights
```

#### Gate 3: Complete Profile
```javascript
monthlyIncome: 15000
existingCommitments: 2500
packagePreference: 'stability'

// Expected Behavior
✅ Refinance + financial profile complete
✅ AI generates savings analysis
✅ Rate intelligence shows timing recommendations
✅ Defense strategy considers current bank
```

---

### **Scenario 3: Commercial Property - Direct Broker Routing**
**Path**: Gate 0 → Gate 1 → Gate 2 → **BROKER HANDOFF** (Skip Gate 3)

#### Gate 0 → Gate 1 
```javascript
loanType: 'commercial'
name: 'Business Owner Pte Ltd'
email: 'owner@business.com.sg'

// Expected: Standard progression ✅
```

#### Gate 2: Commercial → Broker
```javascript
phone: '62345678'
businessType: 'retail'
propertyValue: 2500000

// Expected Behavior
✅ Commercial-specific fields rendered
✅ High urgency profile generated (score: 19)
✅ **CRITICAL**: Form should route to broker after Gate 2
✅ Gate 3 should be SKIPPED for commercial
✅ AI shows "Specialist consultation required" message
```

---

### **Scenario 4: New Purchase - BTO Application**
**Path**: Gate 0 → Gate 1 → Gate 2 (BTO fields) → Gate 3

#### Gate 2: BTO-Specific Routing
```javascript
loanType: 'new_purchase'
phone: '91234567'
propertyCategory: 'bto' // Should trigger BTO-specific fields

// Expected Behavior
✅ BTO-specific fields appear (different from resale)
✅ BTO application timeline fields
✅ HDB eligibility considerations
✅ Different urgency calculation for BTO timeline
```

---

### **Scenario 5: New Purchase - New Launch**
**Path**: Gate 0 → Gate 1 → Gate 2 (New Launch fields) → Gate 3

#### Gate 2: New Launch Property
```javascript
propertyCategory: 'new_launch'

// Expected Behavior  
✅ New launch specific fields (TOP timeline, payment scheme)
✅ Progressive payment vs deferred payment options
✅ OTP urgency factors
✅ Different AI insights for new launches
```

---

## 🔧 TESTING METHODOLOGY

### **Manual Testing Steps**
1. **Setup**: Start dev server (`npm run dev`)
2. **Navigate**: Go to homepage, scroll to form section
3. **Execute**: Complete each scenario step-by-step
4. **Validate**: Check expected behaviors at each gate
5. **Record**: Document any deviations or issues

### **Automated Testing Approach** (Future)
```javascript
// Example test structure
describe('Gate Progression Testing', () => {
  test('New Purchase Resale - Complete Flow', async () => {
    // Gate 0
    await selectLoanType('new_purchase')
    expect(getCurrentGate()).toBe(1)
    
    // Gate 1  
    await fillBasicInfo({ name: 'Test', email: 'test@example.com' })
    expect(getCurrentGate()).toBe(2)
    
    // Gate 2
    await selectPropertyCategory('resale')
    await fillContactInfo({ phone: '91234567' })
    expect(getAIProcessingStatus()).toBe('triggered')
    
    // Gate 3
    await fillOptimizationParams({
      monthlyIncome: 12000,
      packagePreference: 'lowest_rate'
    })
    expect(getBrokerConsultationCTA()).toBeVisible()
  })
})
```

---

## ⚠️ CRITICAL TEST POINTS

### **Commercial Loan Routing** ⚠️ PRIORITY
- **Must Skip Gate 3**: Commercial loans should NOT show Gate 3
- **Direct Broker Route**: After Gate 2, show broker consultation
- **Urgency Score**: Should be 19 (immediate, specialist required)

### **Property Category Selection** ⚠️ IMPORTANT  
- **Only for New Purchase**: Category selector only appears for new_purchase
- **Different Fields**: Each category shows relevant fields
- **Validation**: Category selection required before progression

### **AI Processing Triggers** ⚠️ CRITICAL
- **Gate 2**: Should trigger situational analysis
- **Gate 3**: Should trigger full AI orchestration
- **Commercial**: Should trigger specialist consultation message

---

## 📊 SUCCESS CRITERIA

### **All Scenarios Must Pass**
- ✅ Gate progression 0→1→2→3 (except commercial: 0→1→2→BROKER)
- ✅ Validation works at each gate
- ✅ AI processing triggered at correct points
- ✅ Property routing displays correct fields
- ✅ Commercial routing skips Gate 3
- ✅ Form state preserved throughout progression
- ✅ SimpleAgentUI displays appropriate insights

### **Error Handling**
- ✅ Invalid input prevented from progressing
- ✅ Network failures gracefully handled
- ✅ AI processing failures show fallback content
- ✅ Browser back/forward doesn't break state

### **Performance Benchmarks**
- ✅ Gate transitions < 200ms
- ✅ AI processing response < 3s  
- ✅ Form validation < 100ms
- ✅ No memory leaks during progression

---

## 🚀 READY FOR TESTING

**Test Environment**: Development (`npm run dev`)  
**Test Data**: Prepared for all scenarios  
**Expected Duration**: 30-45 minutes for complete testing  
**Next Step**: Execute scenarios and document results

**Ready to proceed with comprehensive gate progression testing** ✅