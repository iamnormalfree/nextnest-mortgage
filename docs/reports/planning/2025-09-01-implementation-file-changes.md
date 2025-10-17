---
title: implementation-file-changes
type: report
category: planning
status: archived
owner: planning
date: 2025-09-01
---

# Complete File Changes for Frontend/Backend AI Architecture Implementation

## 🎯 ALL FILES THAT WILL BE MODIFIED

### 1. FORM COMPONENTS (Frontend)

#### Core Form Files to Modify:
```
✏️ components/forms/IntelligentMortgageForm.tsx
   - Remove equity_loan from type definitions (line 43)
   - Update FormState interface (lines 17-45)
   - Add AI agent instances (lines 74-78)
   - Modify handleGateCompletion for AI processing (lines 81-154)
   - Remove n8n dependency, add local agent processing

✏️ components/forms/ProgressiveForm.tsx
   - Add renderGate3Fields() implementation (missing!)
   - Add property category routing at Gate 2
   - Remove renderOwnershipStructureDetection() from form
   - Update formGates label for Gate 3 (line 209)
   - Add property category state management

✏️ components/forms/LoanTypeSelector.tsx
   - Remove equity_loan option
   - Update to show new_purchase, refinance, and commercial
   - Add commercial routing logic (direct to broker after Gate 2)
```

#### New Components to Create:
```
✨ components/forms/SimpleAgentUI.tsx (NEW)
   - Display AI insights from agents
   - Show rate intelligence without specific rates
   - Display defense strategies
   - Broker consultation priming

✨ components/forms/PropertyCategorySelector.tsx (NEW)
   - Resale/New Launch/BTO selection UI
   - Dynamic field routing based on selection

✨ components/forms/property-flows/ResaleFlow.tsx (NEW)
✨ components/forms/property-flows/NewLaunchFlow.tsx (NEW)
✨ components/forms/property-flows/BtoFlow.tsx (NEW)
```

### 2. AI AGENTS (New Architecture)

#### New Agent Files to Create:
```
✨ lib/agents/situational-analysis-agent.ts (NEW)
   - OTP urgency analysis
   - Payment scheme analysis
   - Lock-in timing analysis

✨ lib/agents/rate-intelligence-agent.ts (NEW)
   - SORA/Fed market analysis
   - Package comparison without rates
   - Bank category analysis

✨ lib/agents/dynamic-defense-agent.ts (NEW)
   - Client profile analysis
   - Multi-layer defense strategy
   - Bank propensity analysis

✨ lib/agents/competitive-protection-agent.ts (NEW)
   - Competitor signal detection
   - Information gating logic
   - Session monitoring

✨ lib/agents/decoupling-detection-agent.ts (NEW)
   - Pattern recognition (no form fields)
   - Dynamic question generation
   - ABSD optimization detection

✨ lib/agents/broker-handoff-agent.ts (NEW)
   - Prepare consultation brief
   - Summarize insights
   - Prime for conversion
```

### 3. VALIDATION & SCHEMAS

#### Files to Modify:
```
✏️ lib/validation/mortgage-schemas.ts
   - Remove equity_loan schemas
   - Add propertyCategory to new purchase schema (including 'commercial' option)
   - Add Gate 3 optimization preferences schema
   - Remove ownershipStructure from form schemas (move to AI)
   - Add conditional validation based on property category
   - Add commercial loan type validation with broker routing

✏️ lib/contracts/form-contracts.ts
   - Update FormState type
   - Add AIAgentState interface
   - Update LoanType to 'new_purchase' | 'refinance' | 'commercial' (equity_loan removed)
```

### 4. CALCULATIONS & UTILITIES

#### Files to Modify:
```
✏️ lib/calculations/urgency-calculator.ts
   - Remove equity_loan urgency calculations
   - Update for property category routing

✏️ lib/calculations/mortgage.ts
   - Remove equity_loan scenarios
   - Update lead scoring for optimization preferences
```

### 5. API ROUTES

#### Files to Modify:
```
✏️ app/api/forms/analyze/route.ts
   - Remove n8n webhook calls
   - Add local AI agent orchestration
   - Update response format for SimpleAgentUI
   - Add competitive protection middleware

✏️ app/api/ai-insights/route.ts
   - Modify to use new AI agents
   - Remove n8n dependency
```

#### New API Routes to Create:
```
✨ app/api/agents/situational/route.ts (NEW)
✨ app/api/agents/rate-intelligence/route.ts (NEW)
✨ app/api/agents/defense/route.ts (NEW)
✨ app/api/agents/decoupling/route.ts (NEW)
```

### 6. TYPE DEFINITIONS

#### Files to Modify:
```
✏️ types/mortgage.ts
   - Remove EquityLoanInput interface
   - Add PropertyCategory type
   - Add OptimizationPreferences interface
   - Update MortgageInput union type
```

### 7. DOMAINS & ENTITIES

#### Files to Modify:
```
✏️ lib/domains/forms/entities/LeadForm.ts
   - Remove equity_loan handling
   - Add property category management
   - Update gate progression logic for Gate 3

✏️ lib/domains/forms/value-objects/FormField.ts
   - Add new Gate 3 field definitions
   - Add property category field
```

### 8. EVENT BUS & PROCESSING

#### Files to Modify:
```
✏️ lib/events/event-bus.ts
   - Add AI agent events
   - Add property routing events

✏️ lib/processing/insight-processor.ts
   - Update to use AI agents instead of n8n
   - Add competitive protection logic
```

### 9. STYLES (Minor Updates)

#### Files to Check/Update:
```
✏️ styles/animations.css
   - May need new animations for AI UI components
```

## 📊 IMPACT SUMMARY

### Total Files to Modify: ~20
### Total New Files to Create: ~15
### Critical Path Files:
1. ProgressiveForm.tsx (Gate 3 implementation)
2. mortgage-schemas.ts (validation)
3. AI agent files (core logic)
4. analyze/route.ts (backend integration)

## 🔄 MIGRATION STRATEGY

### Phase 1: Foundation (Week 1)
1. Implement Gate 3 in ProgressiveForm.tsx
2. Update schemas and validation
3. Create basic AI agent structure

### Phase 2: AI Integration (Week 2)
4. Implement all AI agents
5. Add property routing
6. Create SimpleAgentUI component

### Phase 3: Cleanup (Week 3)
7. Remove n8n dependencies
8. Remove equity_loan references
9. Testing and validation

## ⚠️ BREAKING CHANGES

1. **Loan Type Change**: equity_loan removal, commercial added with special routing:
   - Existing form submissions
   - Database records
   - Analytics tracking

2. **API Response Format**: New AI agent responses differ from n8n format
   - Frontend display components need updates
   - Any external integrations need notification

3. **Schema Changes**: Gate structure modifications affect:
   - Form validation
   - Data persistence
   - Progress tracking

## 🔍 FILES TO BACKUP BEFORE CHANGES

```bash
# Create backup of critical files
cp components/forms/IntelligentMortgageForm.tsx components/forms/IntelligentMortgageForm.backup.tsx
cp components/forms/ProgressiveForm.tsx components/forms/ProgressiveForm.backup.tsx
cp lib/validation/mortgage-schemas.ts lib/validation/mortgage-schemas.backup.ts
cp app/api/forms/analyze/route.ts app/api/forms/analyze/route.backup.ts
```

## 📝 CONFIGURATION FILES TO CHECK

```
✓ package.json - No changes needed
✓ tsconfig.json - No changes needed
✓ next.config.js - No changes needed
✓ tailwind.config.ts - No changes needed
```

## 🧪 TEST FILES TO UPDATE

```
✏️ __tests__/forms/IntelligentMortgageForm.test.tsx
✏️ __tests__/forms/ProgressiveForm.test.tsx
✏️ __tests__/calculations/urgency-calculator.test.ts
✏️ __tests__/api/forms/analyze.test.ts
```

This comprehensive list shows every file that will be touched by the implementation.