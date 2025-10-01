---
title: how-to-use-context-validation-framework
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# 🎯 HOW TO USE THE NEXTNEST CONTEXT VALIDATION FRAMEWORK

## 📋 Quick Start Guide

The Context Validation Framework **guarantees 100% context alignment** and prevents architectural fragmentation. Here's how to use it:

### 🚀 **Option 1: Automated Validation (Recommended)**

#### **Before Making ANY Code Changes:**
```bash
# Run the automated validation script
npm run validate-context

# If validation passes:
npm run pre-implement
```

#### **What It Checks:**
- ✅ **Domain Knowledge**: Mortgage calculations, form structure, urgency mapping
- ✅ **Consistency**: Cross-system field mapping, data types, API contracts  
- ✅ **Implementation Readiness**: TypeScript compilation, dependencies, build process
- ✅ **Documentation Alignment**: All docs synchronized with implementation

#### **Results:**
- 🟢 **APPROVED**: Proceed with implementation
- 🟡 **CAUTION**: Address warnings before proceeding  
- 🔴 **BLOCKED**: Fix errors before implementing

---

### 🎮 **Option 2: Interactive Dashboard Testing**

Use the validation dashboard for **hands-on testing** of data flow across all system layers:

```bash
# Start development server
npm run dev

# Navigate to validation dashboard
http://localhost:3002/validation-dashboard
```

#### **Dashboard Features:**
1. **Form Builder**: Create test data using presets or custom forms
2. **JSON Editor**: Edit generated JSON directly 
3. **Layer Testing**: Validate data through:
   - **Calculations Layer**: Mortgage calculations, urgency profiling, lead scoring
   - **Form Layer**: Gate progression, field validation, submission logic
   - **API Layer**: n8n routing, enrichment, fallback mechanisms
   - **Documentation Layer**: Compliance with documented gate structure

#### **Testing Workflow:**
1. Select preset (New Purchase/Refinance/Equity Loan) OR fill form manually
2. Click "Generate JSON" to create formatted test data
3. Edit JSON directly if needed for edge case testing
4. Click "Validate" to test through ALL system layers
5. Review results for gaps, conflicts, or alignment issues

---

### 📊 **Option 3: Manual Framework Process**

Follow the **4-Phase Validation Process** from `NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md`:

#### **Phase 1: Context Gathering (MANDATORY)**
```typescript
// Step 1.1: Domain Knowledge Mapping
✅ mortgageCalculations: Formula, MAS compliance, supported scenarios
✅ formStructure: 4-gate structure with submission strategy
✅ urgencyMapping: loanType → urgency field mapping

// Step 1.2: System Integration Points  
✅ frontend: Form components, calculations, insights
✅ backend: API routes, n8n integration, fallback logic
✅ external: n8n webhooks, workflows, data flow

// Step 1.3: Business Logic Verification
✅ tollboothStrategy: Gate 0-3 progression rules
✅ leadScoring: urgency(0-20) + value(0-40) + completeness(0-40)  
✅ singaporeCompliance: TDSR 55%, MSR limits, LTV rules
```

#### **Phase 2: Consistency Validation**
```typescript
// Step 2.1: Cross-System Field Mapping
✅ Verify loanType, urgencyProfile, purchaseTimeline exist across ALL layers
✅ Check field naming consistency (frontend ↔ API ↔ n8n)

// Step 2.2: Data Type Consistency  
✅ TypeScript interfaces match Zod schemas
✅ API input/output matches form submission format
✅ n8n workflow expectations align with API output
```

#### **Phase 3: Implementation Readiness**
```bash
# Step 3.1: Dependencies Verification
npm run build  # Must succeed
npx tsc --noEmit  # Must compile without errors

# Step 3.2: Function Existence Check
grep -r "calculateUrgencyProfile" lib/calculations/
grep -r "calculateLeadScore" lib/calculations/  
grep -r "calculateMortgage" lib/calculations/
```

#### **Phase 4: Change Impact Assessment**
```typescript
// Identify all affected areas for your change type:
interface ChangeImpact {
  frontend: string[]  // Components, validation, calculations
  backend: string[]   // API schemas, routes, integrations  
  external: string[]  // n8n workflows, webhooks, documentation
}
```

---

## 🎯 **When to Use Each Method**

### **Use Automated Script When:**
- Making any code changes to lead forms
- Adding new mortgage calculations
- Modifying API endpoints
- Updating form structure or fields
- **Before every commit/PR**

### **Use Interactive Dashboard When:**
- Testing specific data scenarios  
- Debugging data flow issues
- Validating edge cases
- Demonstrating system behavior
- **During development and QA**

### **Use Manual Process When:**
- Learning the system architecture
- Planning major feature additions
- Conducting architectural reviews
- **For complex architectural changes**

---

## 🔧 **Integration Into Development Workflow**

### **Pre-Commit Hook Setup:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run validate-context"
    }
  }
}
```

### **CI/CD Integration:**
```yaml
# .github/workflows/validate.yml
- name: Context Validation
  run: npm run validate-context
- name: Build Check  
  run: npm run build
```

### **Development Process:**
1. **Plan**: Use manual framework process for planning
2. **Develop**: Use validation dashboard for testing during development
3. **Validate**: Use automated script before commits
4. **Deploy**: All validations must pass in CI/CD

---

## 🚨 **Critical Rules**

### **NEVER Skip Validation:**
- ❌ **NO CODE CHANGES** without running validation first
- ❌ **NO COMMITS** with validation failures
- ❌ **NO DEPLOYMENTS** without 100% context alignment

### **Emergency Stop Conditions:**
```bash
🛑 STOP if any of these occur:
❌ TypeScript compilation fails
❌ Existing calculations break  
❌ Form submission fails
❌ n8n integration breaks
❌ Documentation conflicts discovered
❌ Context validation incomplete
```

### **Framework Authority:**
- **Mandatory** for all NextNest implementations
- **No exceptions** - context validation required for ALL changes
- **100% compliance** required before any feature deployment

---

## 🎉 **Success Metrics**

### **Before Framework:**
- ❌ Implementation gaps between mortgage knowledge and forms
- ❌ n8n workflows disconnected from calculation logic
- ❌ Documentation conflicts with implementation
- ❌ Scattered architecture causing integration issues

### **After Framework:**
- ✅ 100% context alignment before any changes
- ✅ All systems reference single source of truth
- ✅ Zero implementation gaps between layers
- ✅ Documentation synchronized with code
- ✅ n8n workflows leverage existing calculation logic
- ✅ Predictable, reliable implementation process

---

## 💡 **Quick Reference Commands**

```bash
# Full validation before implementation (saves report)
npm run validate-context

# Ready-to-implement check
npm run pre-implement

# Interactive testing dashboard
npm run dev → http://localhost:3002/validation-dashboard

# View latest validation report
npm run validation-report

# View all validation reports
npm run validation-history

# Clean old reports
npm run clean-reports

# Manual TypeScript check
npx tsc --noEmit

# Manual build check  
npm run build

# Check specific functions exist
grep -r "calculateUrgencyProfile" lib/
```

## 📊 **Validation Reports**

Every validation run **automatically saves detailed reports** to `validation-reports/`:

### **Report Types:**
- **`latest.md`** - Human-readable markdown report (most recent)
- **`latest.json`** - Machine-readable JSON report (for CI/CD)
- **`YYYY-MM-DD_HH-MM-SS_STATUS.md`** - Timestamped historical reports

### **Report Contents:**
- ✅ **Validation Score** (0-100%)
- 📊 **Phase-by-Phase Results** (4 phases)
- ❌ **Detailed Errors** (blocking issues)
- ⚠️ **Warnings** (improvement areas)
- 🎯 **Specific Recommendations** (next steps)
- 📈 **Historical Tracking** (validation trends)

### **Report Benefits:**
- **🔍 Debugging**: Detailed error analysis
- **📈 Tracking**: Progress over time
- **👥 Team Sharing**: Sharable validation status
- **🤖 CI/CD Integration**: Automated report parsing
- **📚 Documentation**: Validation history

---

**Remember: This framework PREVENTS the architectural fragmentation that has caused implementation gaps. Use it religiously for reliable, maintainable code.**