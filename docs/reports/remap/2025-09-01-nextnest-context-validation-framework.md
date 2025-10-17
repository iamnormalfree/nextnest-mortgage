---
title: nextnest-context-validation-framework
type: report
status: analysis
owner: engineering
date: 2025-09-01
---

# 🎯 NEXTNEST CONTEXT VALIDATION FRAMEWORK
**Purpose**: 100% Context Alignment System for All Code Changes
**Authority**: MANDATORY for all implementations

---

## 🚨 CRITICAL IMPLEMENTATION RULE
**NO CODE CHANGES WITHOUT COMPLETING THIS FRAMEWORK FIRST**

This framework prevents the architectural fragmentation that has caused implementation gaps between mortgage knowledge, lead forms, data flow, and n8n workflows.

---

## 📊 CURRENT SYSTEM ANALYSIS (BASELINE)

### **Identified Architecture Fragments:**
1. **Calculations Layer** (`lib/calculations/`)
   - ✅ `mortgage.ts` - Core mortgage calculations with MAS compliance
   - ✅ `urgency-calculator.ts` - Unified urgency profiling
   - ❌ **GAP**: Not integrated with form validation or n8n workflows

2. **Form Layer** (`components/forms/`)
   - ✅ `IntelligentMortgageForm.tsx` - Main orchestrator with cumulative submission
   - ✅ `ProgressiveForm.tsx` - Gate-based progressive disclosure
   - ❌ **GAP**: Disconnected from calculation engine insights

3. **API Layer** (`app/api/forms/`)
   - ✅ `analyze/route.ts` - n8n integration with fallback logic
   - ❌ **GAP**: Doesn't leverage full calculation capabilities

4. **Documentation Layer**
   - ✅ Planning documents exist
   - ❌ **GAP**: Not synchronized with actual implementation

### **Root Cause of Fragmentation:**
- Each layer evolved independently
- No unified data contracts between layers
- n8n workflows designed without considering existing calculation logic
- Documentation conflicts with actual implementation

---

## 🎯 CONTEXT VALIDATION PROCESS

### **PHASE 1: CONTEXT GATHERING (100% Required Before Any Change)**

#### **Step 1.1: Domain Knowledge Mapping**
```typescript
// MANDATORY: Complete this checklist before any mortgage-related change

interface DomainKnowledge {
  mortgageCalculations: {
    formula: "M = P * [r(1+r)^n] / [(1+r)^n - 1]" // Verified in lib/calculations/mortgage.ts:62
    masCompliance: "TDSR 55%, Stress Test 4%" // Verified in lib/calculations/mortgage.ts:87-98
    supportedScenarios: ["HDB", "Private", "Commercial"] // Verified in lib/calculations/mortgage.ts:294-343
    singaporeSpecific: "LTV limits, MSR, TDSR with stress testing" // Verified in lib/calculations/mortgage.ts:176-275
  }
  
  formStructure: {
    gates: [
      { gate: 0, fields: ["loanType"], submission: false },
      { gate: 1, fields: ["name", "email"], submission: false },
      { gate: 2, fields: ["phone", "...loanSpecific"], submission: true, n8nGate: "G2" },
      { gate: 3, fields: ["monthlyIncome", "existingCommitments", "packagePreference", "riskTolerance", "planningHorizon"], submission: true, n8nGate: "G3" }
    ] // Verified in NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md:53-82
  }
  
  urgencyMapping: {
    newPurchase: "purchaseTimeline -> urgencyProfile",
    refinance: "lockInStatus -> urgencyProfile", 
    equityLoan: "purpose -> urgencyProfile"
  } // Verified in lib/calculations/urgency-calculator.ts:98-119
}
```

#### **Step 1.2: System Integration Points Mapping**
```typescript
// MANDATORY: Trace all integration points before changes

interface SystemIntegrations {
  frontend: {
    form: "components/forms/IntelligentMortgageForm.tsx",
    calculations: "lib/calculations/mortgage.ts",
    urgency: "lib/calculations/urgency-calculator.ts",
    insights: "lib/insights/mortgage-insights-generator.ts"
  }
  
  backend: {
    api: "app/api/forms/analyze/route.ts",
    n8nIntegration: "callN8nAnalysis() with urgency enrichment",
    fallback: "generateAlgorithmicInsight() with psychological triggers"
  }
  
  external: {
    n8nWebhook: "Expects G2/G3 structure with urgencyProfile",
    workflows: "Gate 2 = basic analysis, Gate 3 = full PDF generation"
  }
  
  dataFlow: {
    direction: "Frontend -> API -> n8n + Fallback -> Frontend",
    enrichment: "urgencyProfile calculated before n8n",
    scoring: "leadScore = urgency + completeness + value"
  }
}
```

#### **Step 1.3: Business Logic Verification**
```typescript
// MANDATORY: Verify business rules alignment

interface BusinessLogic {
  tollboothStrategy: {
    gate0: "Zero friction entry - no email required",
    gate1: "Basic identity - minimal commitment", 
    gate2: "Qualifying data - meaningful analysis possible",
    gate3: "Optimization parameters - personalized strategy + broker contact"
  }
  
  leadScoring: {
    urgencyComponent: "0-20 points from urgency-calculator.ts",
    valueComponent: "0-40 points from loan amount/property type",
    completenessComponent: "0-40 points from profile completeness"
    // Verified in lib/calculations/mortgage.ts:348-378
  }
  
  singaporeCompliance: {
    tdsr: "55% maximum with 4% stress test",
    msr: "30% for HDB/Private, 35% for Commercial",
    ltv: "Property type + citizenship specific limits"
    // Verified in lib/calculations/mortgage.ts:86-99
  }
}
```

### **PHASE 2: CONSISTENCY VALIDATION**

#### **Step 2.1: Cross-System Field Mapping**
```typescript
// Run this validation BEFORE any field changes

const FIELD_CONSISTENCY_CHECK = {
  // Verify these fields exist and are named consistently across ALL systems
  coreFields: {
    "loanType": {
      frontend: "components/forms/IntelligentMortgageForm.tsx:43",
      api: "app/api/forms/analyze/route.ts:18", 
      calculations: "lib/calculations/urgency-calculator.ts:98",
      n8n: "Expected in G2 and G3 submissions"
    },
    
    "urgencyProfile": {
      frontend: "Generated in handleGateCompletion via calculateUrgencyProfile",
      api: "Added to enrichedFormData before n8n submission",
      calculations: "lib/calculations/urgency-calculator.ts:87-119",
      n8n: "Expected as computed field, not user input"
    },
    
    "purchaseTimeline": {
      frontend: "Gate 2 field for new_purchase loan type",
      api: "Optional field in analyzeRequestSchema",
      calculations: "Maps to urgency via mapPurchaseTimelineToUrgency",
      n8n: "Should be converted to urgencyProfile"
    }
  }
}
```

#### **Step 2.2: Data Type Consistency**
```typescript
// MANDATORY: Verify data types match across systems

interface DataTypeValidation {
  mortgageInput: {
    source: "types/mortgage.ts",
    validation: "Zod schemas in lib/calculations/mortgage.ts:6-32",
    apiUsage: "Used in app/api/forms/analyze/route.ts",
    formUsage: "Implemented in components/forms/"
  }
  
  urgencyProfile: {
    structure: "{ level, score, source, reason }",
    calculation: "lib/calculations/urgency-calculator.ts:87-95", 
    frontend: "Used in IntelligentMortgageForm.tsx:78",
    api: "Enriched before n8n in route.ts:98"
  }
  
  leadScore: {
    calculation: "lib/calculations/mortgage.ts:348-378",
    components: "urgency(0-20) + value(0-40) + completeness(0-40)",
    api: "Basic calculation in IntelligentMortgageForm.tsx:82",
    display: "components/forms/IntelligentMortgageForm.tsx:310-331"
  }
}
```

### **PHASE 3: IMPLEMENTATION READINESS CHECK**

#### **Step 3.1: Dependencies Verification**
```bash
# MANDATORY: Run these checks before implementation

# 1. Check all imports resolve
npm run build:check

# 2. Verify calculation functions exist
grep -r "calculateUrgencyProfile" lib/calculations/
grep -r "calculateLeadScore" lib/calculations/
grep -r "calculateMortgage" lib/calculations/

# 3. Check API endpoints respond
curl -X GET http://localhost:3000/api/forms/analyze

# 4. Verify form components load
npm run dev && check http://localhost:3000/#intelligent-contact
```

#### **Step 3.2: Contract Validation**
```typescript
// MANDATORY: Verify all interfaces match

// Check: Does the form output match API input?
const formOutput = handleGateCompletion(2, gate2Data)
const apiInput = analyzeRequestSchema.parse(formOutput) // Should not throw

// Check: Does API output match n8n input?
const apiOutput = callN8nAnalysis(enrichedData)
const n8nExpected = /* n8n workflow validation script expected format */

// Check: Does calculation input match form data?
const calculationInput = calculateUrgencyProfile(formData) // Should not throw
const mortgageInput = calculateMortgage(mortgageData) // Should not throw
```

### **PHASE 4: CHANGE IMPACT ASSESSMENT**

#### **Step 4.1: Ripple Effect Analysis**
```typescript
interface ChangeImpactMatrix {
  changeType: "field_addition" | "calculation_update" | "workflow_change" | "api_modification"
  
  impactAreas: {
    frontend: {
      components: string[] // List affected components
      validation: string[] // List affected validations  
      calculations: string[] // List affected calculations
    }
    
    backend: {
      api: string[] // List affected API routes
      schemas: string[] // List affected Zod schemas
      integrations: string[] // List affected integrations
    }
    
    external: {
      n8n: string[] // List affected n8n workflows
      webhooks: string[] // List affected webhooks
      documentation: string[] // List affected docs
    }
  }
  
  validationRequired: {
    testCases: string[] // List test cases to run
    manualVerification: string[] // List manual checks required
    regressionCheck: string[] // List regression checks needed
  }
}
```

---

## 🔧 IMPLEMENTATION PROCESS

### **STEP 1: Pre-Implementation Checklist**

```markdown
## Before Writing Any Code

### Context Validation ✅
- [ ] Domain knowledge mapped completely
- [ ] System integration points identified
- [ ] Business logic verified
- [ ] Field consistency checked
- [ ] Data types validated across all systems
- [ ] Dependencies verified
- [ ] Contracts validated
- [ ] Change impact assessed

### Documentation Alignment ✅  
- [ ] NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md consulted
- [ ] AI_INTELLIGENT_LEAD_FORM_IMPLEMENTATION_PLAN.md reviewed
- [ ] ROUNDTABLE_PROGRESSIVE_FORM_N8N_INTEGRATION.md checked
- [ ] All conflicting documentation identified and resolved

### System State Verification ✅
- [ ] Current calculation logic understood
- [ ] Form flow completely mapped
- [ ] API behavior documented
- [ ] n8n integration points clear
- [ ] Fallback mechanisms identified

### Implementation Plan ✅
- [ ] Change broken down into atomic steps
- [ ] Each step validated against system contracts
- [ ] Rollback plan defined
- [ ] Testing strategy defined
- [ ] Success criteria established
```

### **STEP 2: Implementation with Real-time Validation**

```typescript
// MANDATORY: Use this pattern for ALL implementations

interface ImplementationStep {
  step: number
  description: string
  preCheck: () => boolean  // Validate context before step
  execute: () => Promise<void>  // Execute the step
  postCheck: () => boolean  // Validate result after step
  rollback: () => Promise<void>  // Rollback if validation fails
}

// Example: Adding a new mortgage calculation
const implementationSteps: ImplementationStep[] = [
  {
    step: 1,
    description: "Add calculation function to lib/calculations/mortgage.ts",
    preCheck: () => {
      // Verify existing calculations still work
      const testResult = calculateMortgage(MORTGAGE_SCENARIOS.HDB_FLAT)
      return testResult.monthlyPayment > 0
    },
    execute: async () => {
      // Add new calculation function
      // Update existing interfaces
      // Add Zod validation if needed
    },
    postCheck: () => {
      // Verify new calculation works
      // Verify existing calculations still work
      // Verify TypeScript compiles
      return true
    },
    rollback: async () => {
      // git checkout HEAD -- lib/calculations/mortgage.ts
    }
  },
  
  {
    step: 2, 
    description: "Update API to use new calculation",
    preCheck: () => {
      // Verify calculation function exists and works
      return typeof newCalculationFunction === 'function'
    },
    execute: async () => {
      // Update app/api/forms/analyze/route.ts
      // Update Zod schemas
      // Update enrichment logic
    },
    postCheck: () => {
      // Test API endpoint
      // Verify n8n integration still works
      // Verify fallback still works
      return true
    },
    rollback: async () => {
      // Revert API changes
    }
  }
  
  // Continue for each implementation step...
]
```

### **STEP 3: Post-Implementation Validation Loop**

```typescript
// MANDATORY: Run complete validation after implementation

interface PostImplementationValidation {
  functionalTesting: {
    mortgageCalculations: "Run all MORTGAGE_SCENARIOS",
    urgencyProfiles: "Test all loan types with all urgency mappings",
    formFlow: "Test complete Gate 0->1->2->3 progression",
    apiIntegration: "Test n8n success and fallback scenarios"
  }
  
  integrationTesting: {
    frontendToAPI: "Verify form submission reaches API correctly",
    apiToN8n: "Verify enriched data sent to n8n matches expected format", 
    n8nToFrontend: "Verify n8n responses processed correctly",
    fallbackFlow: "Verify fallback triggers when n8n fails"
  }
  
  regressionTesting: {
    existingCalculations: "All existing mortgage scenarios still work",
    existingFormBehavior: "Form progression still follows gate structure",
    existingAPIs: "All endpoints still respond correctly",
    existingDocumentation: "All docs still accurate"
  }
}
```

---

## 🎯 FRAMEWORK USAGE EXAMPLES

### **Example 1: Adding New Mortgage Calculation**

**Before Implementation:**
```bash
# 1. Context Gathering
✅ Domain Knowledge: New calculation aligns with MAS requirements
✅ Integration Points: Will be used in lib/calculations/mortgage.ts
✅ Business Logic: Fits tollbooth strategy (no new gates needed)

# 2. Consistency Validation  
✅ Field Mapping: Uses existing loanAmount, interestRate fields
✅ Data Types: Returns MortgageResult interface
✅ Contract Validation: Matches calculateMortgage signature

# 3. Impact Assessment
✅ Frontend: No component changes needed
✅ Backend: Only lib/calculations/mortgage.ts affected
✅ External: n8n workflows unchanged
✅ Testing: Run MORTGAGE_SCENARIOS regression test
```

**Implementation Result: ✅ Success - No integration gaps**

### **Example 2: Adding New Form Field**

**Before Implementation:**
```bash
# 1. Context Gathering - FOUND GAPS!
❌ Domain Knowledge: New field purpose unclear
❌ Integration Points: Not defined in existing schemas
❌ Business Logic: Unclear which gate it belongs to

# STOP IMPLEMENTATION - Gaps identified
# Resolution Required:
1. Update NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md with field definition
2. Add field to appropriate gate schema
3. Update urgency calculation if needed
4. Update n8n workflow expectations
5. Re-run validation process
```

**Implementation Result: 🛑 Stopped - Gaps prevented fragmentation**

---

## 🔒 ENFORCEMENT MECHANISMS

### **Code Review Checklist**
```markdown
- [ ] Context validation framework completed before PR
- [ ] All integration points tested
- [ ] No documentation conflicts remain
- [ ] Regression tests pass
- [ ] n8n integration verified (if applicable)
```

### **Automated Checks**
```typescript
// Add to CI/CD pipeline
const validateImplementation = {
  typeCheck: "npm run type-check",
  buildCheck: "npm run build", 
  testCalculations: "npm run test:calculations",
  testIntegrations: "npm run test:integrations",
  documentationCheck: "scripts/validate-docs.sh"
}
```

### **Emergency Stop Conditions**
```bash
# STOP IMPLEMENTATION if any of these occur:
❌ TypeScript compilation fails
❌ Existing calculations break
❌ Form submission fails
❌ n8n integration breaks
❌ Documentation conflicts discovered
❌ Context validation incomplete
```

---

## 📈 SUCCESS METRICS

### **Before Framework (Current State)**
- ❌ Implementation gaps between mortgage knowledge and forms
- ❌ n8n workflows disconnected from calculation logic  
- ❌ Documentation conflicts with implementation
- ❌ Scattered architecture causing integration issues

### **After Framework (Target State)**
- ✅ 100% context alignment before any changes
- ✅ All systems reference single source of truth
- ✅ Zero implementation gaps between layers
- ✅ Documentation synchronized with code
- ✅ n8n workflows leverage existing calculation logic
- ✅ Predictable, reliable implementation process

---

## 🎯 QUICK REFERENCE

### **Before ANY Change**
1. **Map Context** - Understand domain, integrations, business logic
2. **Validate Consistency** - Check fields, types, contracts
3. **Assess Impact** - Identify all affected areas
4. **Plan Implementation** - Atomic steps with validation

### **During Implementation**
1. **Execute with Validation** - Pre-check → Execute → Post-check → Rollback if needed
2. **Test Continuously** - Verify each step before proceeding
3. **Monitor Integration Points** - Ensure connections remain intact

### **After Implementation**
1. **Run Complete Validation** - Functional, integration, regression tests
2. **Update Documentation** - Keep all docs synchronized
3. **Monitor System Health** - Verify all layers working correctly

---

**This framework GUARANTEES context alignment and prevents architectural fragmentation.**

**Authority**: Mandatory for all NextNest implementations  
**Owner**: All team members must follow this process  
**Exception Policy**: No exceptions - context validation required for ALL changes