---
title: context-validation-updates
type: meta
owner: operations
last-reviewed: 2025-09-30
---

# Updates Needed to NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md

## Changes Required for New Architecture

### 1. Domain Knowledge Mapping (Lines 52-73)
**UPDATE NEEDED:**
```typescript
// OLD
supportedScenarios: ["HDB", "Private", "Commercial"]

// NEW
supportedScenarios: ["HDB", "Private"] // Removed Commercial/Equity
loanTypes: ["new_purchase", "refinance"] // Simplified from 3 to 2
```

### 2. Form Structure (Lines 59-66)
**UPDATE NEEDED:**
```typescript
// OLD
{ gate: 3, fields: ["monthlyIncome", "existingCommitments"], submission: true, n8nGate: "G3" }

// NEW
{ 
  gate: 3, 
  fields: ["monthlyIncome", "existingCommitments", "packagePreference", "riskTolerance", "planningHorizon"], 
  submission: true, 
  aiProcessing: "full_optimization" // Not n8n anymore
}
```

### 3. System Integration Points (Lines 76-104)
**UPDATE NEEDED:**
```typescript
// OLD
external: {
  n8nWebhook: "Expects G2/G3 structure with urgencyProfile",
  workflows: "Gate 2 = basic analysis, Gate 3 = full PDF generation"
}

// NEW
external: {
  n8nWebhook: "DEPRECATED - Replaced by local AI agents",
  aiAgents: {
    gate2: ["SituationalAnalysis", "DecouplingDetection", "RateIntelligence"],
    gate3: ["EnhancedAnalysis", "DynamicDefense", "BrokerHandoff"]
  }
}
```

### 4. New Validation Checks to Add
**ADD TO PHASE 1:**
```typescript
propertyRouting: {
  gate2Enhancement: "Property category selection for new_purchase",
  dynamicFields: "Different field sets per category (resale/new_launch/bto)",
  validation: "Conditional schema based on propertyCategory"
}

aiAgentIntegration: {
  decouplingDetection: "Pattern-based, no form fields",
  competitiveProtection: "Information gating for competitors",
  rateIntelligence: "Educational without specific rates"
}
```

### 5. Business Logic Verification (Lines 107-133)
**UPDATE NEEDED:**
```typescript
// ADD
optimizationStrategy: {
  gate3Purpose: "Not just financial eligibility, but optimization preferences",
  aiProcessing: "Two-stage: Gate 2 initial, Gate 3 enhanced",
  decouplingDetection: "AI-inferred, not user-declared"
}
```

## Framework Still Valid For:
✅ Pre-implementation validation process
✅ Cross-system consistency checks
✅ Impact assessment methodology
✅ Implementation step validation
✅ Post-implementation testing

## Framework Needs Updates For:
⚠️ Loan type simplification (3 → 2)
⚠️ Gate 3 repositioning (Financial → Optimization)
⚠️ n8n replacement with AI agents
⚠️ Property routing at Gate 2
⚠️ Decoupling as AI detection

The core validation PROCESS remains the same, but the CONTENT being validated has evolved.