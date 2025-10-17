---
title: revised-implementation-plan
status: archived
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Historical plan archived for reference. Use `/response-awareness` if resurrecting.

# Revised Frontend/Backend AI Architecture Implementation Plan
## Aligned with Form Architecture Evolution

---

## 🎯 CORE ARCHITECTURAL CHANGES

### Gate Repositioning & Flow Changes

#### Gate 0: Loan Type Selection (Simplified)
```typescript
type LoanType = 'new_purchase' | 'refinance'
// Note: Removed equity_loan - minimal focus per evolution.md
// Decoupling is a STRATEGY within new_purchase, detected by AI
```

#### Gate 1: Basic Information (Unchanged)
- Name + Email
- Trust building phase
- No submission to backend

#### Gate 2: Situational Intelligence (MAJOR CHANGES)
**New Structure with Property Routing:**
```typescript
interface Gate2Fields {
  // Common field
  phone: string
  
  // Property Category Routing (NEW - for new_purchase only)
  propertyCategory?: 'resale' | 'new_launch' | 'bto'
  
  // Dynamic fields based on propertyCategory
  resaleFields?: ResaleFlowFields
  newLaunchFields?: NewLaunchFlowFields
  btoFields?: BtoFlowFields
  
  // Refinance fields (if loan type is refinance)
  refinanceFields?: RefinanceFlowFields
}
```

#### Gate 3: Optimization Parameters (REPOSITIONED)
**From "Financial Profile" → "Optimization Parameters"**
```typescript
interface Gate3Fields {
  monthlyIncome: number
  existingCommitments?: number
  
  // NEW: Optimization preferences
  optimizationPreferences?: {
    packagePreference: 'lowest_rate' | 'flexibility' | 'stability' | 'features'
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
    planningHorizon: 'short_term' | 'medium_term' | 'long_term'
  }
}
```

---

## 🤖 AI AGENT ARCHITECTURE & PLACEMENT

### Agent Orchestration Points

#### After Gate 2 Completion (First AI Processing)
```typescript
// Triggered when Gate 2 is completed
async function processGate2WithAI(cumulativeData: Gate0to2Data) {
  // 1. Situational Analysis Agent
  const situationalInsights = await SituationalAnalysisAgent.analyze({
    loanType: cumulativeData.loanType,
    propertyCategory: cumulativeData.propertyCategory,
    ...cumulativeData
  })
  
  // 2. Decoupling Detection Agent (NEW - AI-driven, not form fields)
  const decouplingSignals = await DecouplingDetectionAgent.detect({
    // Agent asks intelligent questions based on patterns
    userResponses: cumulativeData,
    // Detects without explicit form fields
    inferredPatterns: {
      namePattern: cumulativeData.name, // Single name purchase?
      propertyType: cumulativeData.propertyType,
      timeline: cumulativeData.purchaseTimeline
    }
  })
  
  // 3. Rate Intelligence Agent (Educational only)
  const rateEducation = await RateIntelligenceAgent.educate({
    profile: cumulativeData,
    withholding: ['specific_rates', 'bank_names'],
    showing: ['market_dynamics', 'package_types', 'optimization_levers']
  })
  
  return {
    situationalInsights,
    decouplingOpportunity: decouplingSignals,
    rateEducation
  }
}
```

#### After Gate 3 Completion (Full AI Processing)
```typescript
async function processGate3WithAI(fullData: AllGatesData) {
  // 1. Enhanced Situational Analysis with Financials
  const enhancedInsights = await SituationalAnalysisAgent.enhanceWithFinancials({
    previousInsights: gate2Insights,
    financialData: fullData.gate3Data
  })
  
  // 2. Dynamic Defense Strategy Agent
  const defenseStrategy = await DynamicDefenseAgent.generateStrategy({
    profile: fullData,
    avoidCurrentBank: true,
    multiLayerDefense: true
  })
  
  // 3. Broker Consultation Brief
  const brokerBrief = await BrokerHandoffAgent.prepareBrief({
    fullProfile: fullData,
    insights: enhancedInsights,
    strategy: defenseStrategy
  })
  
  return {
    enhancedInsights,
    defenseStrategy,
    brokerBrief
  }
}
```

---

## 🔄 DECOUPLING AS AI-DRIVEN DETECTION

### Remove from Form Fields, Add to AI Agent

```typescript
// lib/agents/decoupling-detection-agent.ts
class DecouplingDetectionAgent {
  async detect(userData: any): Promise<DecouplingAnalysis> {
    // Intelligent pattern detection without explicit questions
    const signals = this.analyzeSignals(userData)
    
    if (signals.potentialDecoupling) {
      // AI asks follow-up questions dynamically
      return {
        detected: true,
        confidence: signals.confidence,
        questions: this.generateSmartQuestions(signals),
        implications: this.calculateImplications(signals)
      }
    }
    
    return { detected: false }
  }
  
  private analyzeSignals(data: any) {
    // Look for patterns that suggest decoupling
    return {
      singleNamePurchase: this.checkNamePattern(data),
      propertyOwnership: this.inferOwnership(data),
      maritalStatus: this.inferMaritalStatus(data),
      potentialDecoupling: this.calculateProbability(data)
    }
  }
  
  private generateSmartQuestions(signals: any): string[] {
    // Dynamic questions based on detected patterns
    const questions = []
    
    if (signals.singleNamePurchase && signals.likelyMarried) {
      questions.push("We notice you're purchasing in a single name. Is this for stamp duty optimization?")
    }
    
    if (signals.existingProperty) {
      questions.push("Does your spouse currently own any property?")
    }
    
    return questions
  }
}
```

### Schema Changes for Decoupling
```typescript
// Still in schema for validation, but NOT rendered as form fields
const decouplingSchema = z.object({
  // These are INFERRED or AI-ASKED, not form fields
  ownershipIntent: z.enum(['single', 'joint']).optional(),
  spousePropertyStatus: z.boolean().optional(),
  decouplingPurpose: z.enum(['absd_savings', 'loan_eligibility', 'other']).optional()
}).optional()
```

---

## 📋 IMPLEMENTATION TASKS (REVISED)

### Phase 1: Critical Foundation (Week 1)

#### Task 1: Implement Gate 3 with New Focus
```typescript
// components/forms/ProgressiveForm.tsx
const renderGate3Fields = () => {
  return (
    <>
      {/* Financial inputs for IPA calculation */}
      <MonthlyIncomeField />
      <ExistingCommitmentsField />
      
      {/* NEW: Optimization preferences */}
      <OptimizationPreferences />
    </>
  )
}
```

#### Task 2: Add Property Category Routing at Gate 2
```typescript
// components/forms/ProgressiveForm.tsx
const renderGate2Fields = () => {
  if (loanType === 'new_purchase' && !propertyCategory) {
    return <PropertyCategorySelector onSelect={setPropertyCategory} />
  }
  
  // Route to specific flow based on category
  switch(propertyCategory) {
    case 'resale': return <ResaleFlow />
    case 'new_launch': return <NewLaunchFlow />
    case 'bto': return <BtoFlow />
  }
}
```

#### Task 3: Create AI Agent Architecture
```typescript
// lib/agents/index.ts
export const AIAgentOrchestrator = {
  gate2Agents: [
    SituationalAnalysisAgent,
    DecouplingDetectionAgent, // No form fields needed
    RateIntelligenceAgent
  ],
  gate3Agents: [
    EnhancedAnalysisAgent,
    DynamicDefenseAgent,
    BrokerHandoffAgent
  ]
}
```

### Phase 2: AI Intelligence Layer (Week 2)

#### Task 4: Implement Decoupling Detection Agent
- Pattern recognition without form fields
- Dynamic question generation
- ABSD optimization analysis

#### Task 5: Situational Analysis Agent
- OTP urgency for resale
- Payment scheme analysis for new launch
- Lock-in timing for refinance

#### Task 6: Rate Intelligence Agent
- Market education without rates
- Package type comparison
- Bank category analysis

### Phase 3: Integration & Testing (Week 3)

#### Task 7: Remove n8n Dependency
- Replace webhook calls with local agent processing
- Implement fallback strategies

#### Task 8: Competitive Protection Layer
- Detect competitor usage patterns
- Gate sensitive information

#### Task 9: Testing & Validation
- Test all property category flows
- Validate AI agent responses
- Ensure decoupling detection works without form fields

---

## 🎯 KEY DIFFERENCES FROM ORIGINAL PLAN

1. **Gate 3 Repositioned**: Not just financial profile, but optimization parameters
2. **Property Routing at Gate 2**: Dynamic flows based on property category
3. **Decoupling as AI Detection**: No form fields, intelligent pattern recognition
4. **AI Agents at Specific Points**: Gate 2 and Gate 3 processing points
5. **Simplified Loan Types**: Only new_purchase and refinance

## 📊 FIELD MAPPING UPDATES NEEDED

Update field-mapping.md to reflect:
- Remove decoupling fields from Gate 2 form
- Add property category routing
- Add optimization preferences to Gate 3
- Mark decoupling fields as "AI-INFERRED" not "FORM-FIELD"

This architecture maintains the sophisticated intelligence while simplifying the user experience and protecting against competitors.