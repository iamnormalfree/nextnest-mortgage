---
title: form-architecture-evolution
type: report
category: planning
status: archived
owner: planning
date: 2025-09-01
---

# NextNest Form Architecture Evolution
## Progressive Refinement Based on Real Broker Intelligence

---

## ITERATION 1: BASIC FIELD MAPPING
**Context**: Initial analysis of existing form structure
**Focus**: Understanding current implementation status

### Gate Structure Overview
- **Gate 0**: Loan Type Selection ✅
- **Gate 1**: Name + Email ✅
- **Gate 2**: Phone + Loan-specific fields ✅
- **Gate 3**: Financial Profile ❌ (NOT IMPLEMENTED)

### Key Findings
1. Gate 3 exists in definition but not in renderGateFields()
2. AI insights only using basic urgency scoring (urgencyProfile.score * 5)
3. Many schema fields not actually used in form
4. Submission happens at Gates 2 & 3 only (cumulative data)

### Problems Identified
- Missing Gate 3 implementation breaks funnel
- AI insights too basic for meaningful value
- Field inconsistencies between schema and form

---

## ITERATION 2: REAL BROKER INTELLIGENCE INTEGRATION
**Feedback Incorporated**: Commentary about OTP urgency, payment schemes, refinancing strategy
**Focus**: Transform from generic calculator to sophisticated advisory system

### New Purchase Intelligence (Gate 2 Enhanced)

#### Property Type Routing (Critical for Different Flows)
```typescript
interface NewPurchaseRouting {
  propertyCategory: 'resale' | 'new_launch' | 'bto'
  
  // Resale Properties (Private/HDB)
  resaleFlow?: {
    propertyType: 'hdb_resale' | 'private_resale'
    otpStatus: 'not_yet' | 'viewing' | 'otp_received' | 'otp_exercised'
    otpExpiryDays?: number // 21 days for private, 14 days for HDB
    ipaRequired: boolean // Critical for eligibility
    eligibilityQuestions: {
      citizenship: 'citizen' | 'pr' | 'foreigner'
      incomeStability: boolean
      existingLoans: boolean
    }
  }
  
  // New Launch Properties (EC/Private)
  newLaunchFlow?: {
    propertyType: 'ec_launch' | 'private_launch'
    stage: 'balloting' | 'booking' | 'selection' | 'signed'
    paymentScheme: {
      selected?: 'progressive' | 'deferred' | 'undecided'
      deferredPremium: number // 2-3% additional
      progressiveSchedule?: string[] // Payment milestones
      cashFlowAnalysis: string[]
    }
    timeline: {
      expectedTop: Date
      constructionStage: string
      floatingLockIn: string // "Convert 3 months before TOP"
    }
  }
  
  // BTO (Separate Process)
  btoFlow?: {
    stage: 'applying' | 'balloted' | 'selecting' | 'signed'
    flatType: '2room' | '3room' | '4room' | '5room' | 'executive'
    grants: string[] // Applicable grants
    timingConsiderations: string[]
  }
}
```

### Refinance Intelligence (Gate 2 Enhanced)
```typescript
interface RefinanceInsights {
  // Lock-in Intelligence
  lockInAnalysis: {
    currentStatus: string
    optimalTiming: string // 4-5 months before lock-in ends
    repricingRisk: 'high' | 'medium' | 'low'
    competitorAdvantage: string
  }
  
  // Bank Strategy Intelligence  
  bankStrategy: {
    currentBank: string
    avoidCurrentBank: boolean // Don't earn from repricing
    repricingThreat: {
      likelyToOffer: boolean
      timeframe: string
      counterStrategy: string[]
    }
  }
  
  // Cost-Benefit Analysis
  costBenefit: {
    loanQuantum: number
    refinancingViable: boolean // Based on quantum thresholds
    legalFeeSubsidy: boolean // >250k HDB, >450k private
    breakEvenMonths: number
  }
}
```

### Gate 3 Repositioning
- From "Financial Details" → "Optimization Parameters"
- Not about eligibility (refinancers already eligible)
- Focus on IPA calculation for new purchases

---

## ITERATION 3: PSYCHOLOGICAL NON-PRIMING & COMPETITIVE PROTECTION
**Feedback Incorporated**: 
- Never mention "repricing" to avoid triggering clients
- Protect against competitors using our platform
- Loan types: Focus on new purchase and refinancing (decoupling as strategy, not product)
- Withhold rates until broker consultation

### Loan Type Simplification
```typescript
// Primary loan types (Gate 0)
type LoanType = 'new_purchase' | 'refinance'
// Note: Decoupling is a STRATEGY within new_purchase, not a separate loan type
// Cash equity is minimal focus - handled as refinance sub-strategy
```

### Psychological Non-Priming Strategy
```typescript
// ❌ FORBIDDEN TERMS (Never Use)
const FORBIDDEN_TERMS = [
  'repricing', 'repricing team', 'current bank offers',
  'call your bank', 'check with your bank'
]

// ✅ SAFE ALTERNATIVE LANGUAGE
const SAFE_LANGUAGE = {
  instead_of_repricing: 'internal rate adjustments',
  instead_of_current_bank: 'your existing lender',
  focus_on_client_benefit: 'ensuring you get the best available rates'
}
```

### Decoupling Intelligence (Within New Purchase Context)
```typescript
interface DecouplingStrategy {
  // Detect decoupling opportunity/intent
  ownershipStructure: {
    currentOwnership: 'single' | 'joint_tenancy' | 'tenancy_in_common'
    purchasingAs: 'single_name' | 'joint_names'
    maritalStatus: 'single' | 'married' | 'divorced'
  }
  
  // Decoupling indicators
  decouplingSignals: {
    spouseOwnsProperty: boolean
    buyingInSingleName: boolean // While married = likely decoupling
    previouslyDecoupled: boolean
    planningToDecouple: boolean
  }
  
  // Strategic implications
  decouplingImplications: {
    absdAvoidance: string // "Each spouse can own 1 property"
    loanEligibility: string // "Individual assessment possible"
    cpfUsage: string // "Separate CPF accounts"
    stampDutyOptimization: string
  }
}
```

### Competitive Protection Agent
```typescript
class CompetitiveProtectionAgent {
  detectCompetitorSignals(sessionData: any): boolean {
    const signals = [
      sessionData.rapidSessionCount > 3,
      /@(realty|property|broker|agent)/.test(sessionData.email),
      sessionData.completionSpeed < 30, // Too fast
      sessionData.multipleScenarios > 2
    ]
    return signals.filter(Boolean).length >= 2
  }
  
  gateInformation(insights: any, isCompetitor: boolean): any {
    if (isCompetitor) {
      return {
        message: "Please speak directly with our licensed brokers.",
        limitedInsights: insights.genericInsights
      }
    }
    return insights
  }
}
```

### Rate Protection Strategy
```typescript
// Bank Name Coding (D***S Strategy)
const BANK_CODING = {
  'DBS': 'D***S',
  'OCBC': 'O***C', 
  'UOB': 'U***B'
}

// Never disclose:
// - Specific rates
// - Bank names (use coded references)
// - Exact savings (use ranges)
// - Deviated rates
```

---

## ITERATION 4: STRATEGIC RATE INTELLIGENCE SYSTEM
**Feedback Incorporated**: 
- Users want meaningful rate information
- Show rate levers and market dynamics
- Educate about SORA, Fed impact, bank behaviors
- Local banks lead changes (DBS first)
- Foreign banks have special features (offset accounts, flexible fund recognition)

### Personalized Market Intelligence (Safe to Show)
```typescript
interface PersonalizedMarketIntelligence {
  // Fed/SORA Context (Educational)
  marketContext: {
    currentSoraEnvironment: 'rising' | 'stable' | 'declining'
    fedMeetingImpact: {
      nextMeetingDate: Date
      expectedDirection: 'likely_hold' | 'potential_cut' | 'potential_hike'
      yourImpact: string // "Rising SORA could affect floating packages"
    }
    inflationContext: {
      currentTrend: string
      yourImplication: string
    }
  }
  
  // Bank Landscape (Educational)
  bankLandscape: {
    localBanks: {
      characteristics: "Lead rate changes, strong relationships"
      yourFit: string // Based on profile
    }
    foreignBanks: {
      characteristics: "Offset accounts, flexible fund recognition"
      yourAdvantage: string // If complex assets
    }
  }
}
```

### Personalized Rate Levers (Without Actual Rates)
```typescript
interface PersonalizedRateLevers {
  profileAdvantages: {
    incomeStability: 'advantageous' | 'standard' | 'requires_strategy'
    loanQuantumBenefits: 'premium_tier' | 'standard_tier'
    propertyTypeAdvantages: string[]
  }
  
  optimizationOpportunities: {
    packageTypeOptimization: {
      fixed: { 
        advantages: string[], 
        considerations: string[],
        tenure: '1yr' | '2yr' | '3yr' | '5yr'
      }
      floating: { 
        advantages: string[], 
        considerations: string[],
        spread: '1M_SORA' | '3M_SORA' | '6M_SORA'
      }
      hybrid: { 
        advantages: string[], 
        considerations: string[],
        structure: '1yr_fixed_then_float' | '2yr_fixed_then_float' | 'fixed_with_conversion'
      }
    }
    relationshipBenefits: {
      newRelationship: "New customer packages often 0.1-0.3% better"
      portfolioConsolidation: "Banking relationship unlocks better terms"
    }
  }
}
```

### Dynamic Defense Strategy Agent (AI-Generated, Not Hard-Coded)
```typescript
class DynamicDefenseAgent {
  // Generate defense strategy on-the-fly based on client profile
  generateDefenseStrategy(clientData: any): DefenseStrategy {
    const profile = this.analyzeClientProfile(clientData)
    
    return {
      // Local vs Foreign Bank Analysis
      bankCategoryAnalysis: {
        localBanks: {
          advantages: this.getLocalBankAdvantages(profile),
          propensity: "Quick approval, relationship focus, rate leadership",
          bestFor: this.assessLocalBankFit(profile)
        },
        foreignBanks: {
          advantages: this.getForeignBankAdvantages(profile),
          propensity: "Specialized features, flexible criteria, offset accounts",
          bestFor: this.assessForeignBankFit(profile)
        }
      },
      
      // Package Type Comparison (Generic but Specific)
      packageComparison: {
        fixed: {
          currentMarketPosition: this.assessFixedRateEnvironment(),
          potentialSavings: "Range: 0.3-0.8% below floating",
          bestScenarios: ["Rising rate environment", "Risk-averse profile"],
          bankPropensity: this.getBankPropensityForFixed(profile)
        },
        floating: {
          spreadOptions: this.analyzeSpreadOptions(profile),
          potentialMovement: "Based on SORA trajectory",
          bestScenarios: ["Declining rate environment", "Flexibility needed"],
          bankPropensity: this.getBankPropensityForFloating(profile)
        },
        hybrid: {
          structures: this.recommendHybridStructures(profile),
          conversionFlexibility: "Free conversion after X years",
          bestScenarios: ["Uncertain market", "Balanced approach"],
          bankPropensity: this.getBankPropensityForHybrid(profile)
        }
      },
      
      // Multi-Layer Defense (Dynamic)
      defenseOptions: this.generateDynamicDefense(profile),
      
      // Broker Consultation Priming
      brokerValue: {
        exclusiveAccess: "Rates not available online",
        negotiationPower: "Leverage across multiple banks",
        customization: "Package features tailored to your situation"
      }
    }
  }
  
  private generateDynamicDefense(profile: any): DefenseOption[] {
    // Dynamically generate 3-5 defense options based on:
    // - Client's current bank (avoid)
    // - Profile strength (leverage points)
    // - Market conditions (timing)
    // - Competitor landscape (what others might offer)
    
    return [
      {
        strategy: "Primary",
        approach: this.selectPrimaryApproach(profile),
        rationale: this.explainPrimaryRationale(profile)
      },
      {
        strategy: "Alternative",
        approach: this.selectAlternativeApproach(profile),
        rationale: this.explainAlternativeRationale(profile)
      },
      {
        strategy: "Insurance",
        approach: this.selectInsuranceApproach(profile),
        rationale: this.explainInsuranceRationale(profile)
      }
    ]
  }
}
```

---

## FINAL ARCHITECTURE SUMMARY

### Gate Flow
1. **Gate 0**: Loan Type → Route to specialized intelligence
2. **Gate 1**: Identity → Build trust, personal connection
3. **Gate 2**: Situational Intelligence → Capture context for sophisticated AI
4. **Gate 3**: Eligibility Optimization → Not "financial details" but optimization

### AI Agent Orchestration
1. **Competitive Protection Agent**: Detect and gate competitor access
2. **Situational Analysis Agent**: Generate sophisticated insights at Gate 2
3. **Rate Intelligence Agent**: Provide market education without revealing rates
4. **Broker Handoff Agent**: Prepare comprehensive brief for broker consultation

### Key Principles
- **Psychological Non-Priming**: Never trigger repricing thoughts
- **Competitive Protection**: Gate access from competitors
- **Strategic Withholding**: Rates only through broker consultation
- **Educational Value**: Provide market intelligence without specifics
- **Multi-Layer Defense**: Primary + backup strategies against competitors

### Success Metrics
- User gets valuable insights without specific rates
- Competitors can't extract our intelligence
- Clients primed for broker consultation
- Never trigger repricing consideration
- Maintain 3-5 strategic options for defense

---

## IMPLEMENTATION MAPPING TO CONTEXT VALIDATION FRAMEWORK

### Phase 1: Context Gathering (Per NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md)

#### Domain Knowledge Validation
```typescript
// Verify mortgage calculations alignment
const domainValidation = {
  mortgageCalculations: {
    drElenaExpertise: "✅ Using dr-elena-mortgage-expert.json",
    masCompliance: "✅ TDSR 55%, Stress Test 4%",
    singaporeSpecific: "✅ LTV, MSR, ABSD calculations"
  },
  
  formStructure: {
    gates: [
      { gate: 0, fields: ['loanType'], submission: false },
      { gate: 1, fields: ['name', 'email'], submission: false },
      { gate: 2, fields: ['phone', ...dynamicLoanFields], submission: true },
      { gate: 3, fields: ['monthlyIncome', 'existingCommitments'], submission: true }
    ]
  }
}
```

### Phase 2: Implementation Changes Required

#### IntelligentMortgageForm.tsx Changes
```typescript
interface FormStateChanges {
  // Simplify loan types
  loanTypes: ['new_purchase', 'refinance'], // Remove equity_loan
  
  // Enhanced Gate 2 data structure
  gate2Data: {
    // Add property category routing
    propertyCategory?: 'resale' | 'new_launch' | 'bto',
    
    // Add decoupling detection
    ownershipStructure?: {
      purchasingAs: 'single_name' | 'joint_names',
      maritalStatus: string,
      spousePropertyStatus?: string
    },
    
    // Existing fields remain
    phone: string,
    ...dynamicLoanSpecificFields
  }
}
```

#### ProgressiveForm.tsx Changes
```typescript
interface ProgressiveFormChanges {
  // Dynamic field rendering based on property category
  renderGate2Fields(): JSX.Element {
    if (loanType === 'new_purchase') {
      // First ask property category
      if (!propertyCategory) return renderPropertyCategorySelection()
      
      // Then route to appropriate flow
      switch(propertyCategory) {
        case 'resale': return renderResaleFields()
        case 'new_launch': return renderNewLaunchFields()
        case 'bto': return renderBtoFields()
      }
    }
    
    if (loanType === 'refinance') {
      return renderRefinanceFields()
    }
  }
  
  // Implement Gate 3 (Currently missing)
  renderGate3Fields(): JSX.Element {
    return (
      <>
        <MonthlyIncomeField />
        <ExistingCommitmentsField />
        <OptimizationPreferences />
      </>
    )
  }
}
```

#### Schema Updates (mortgage-schemas.ts)
```typescript
// Simplified base schema
const baseSchema = z.object({
  loanType: z.enum(['new_purchase', 'refinance']),
  // ... rest remains same
})

// New purchase with routing
const newPurchaseSchema = baseSchema.extend({
  propertyCategory: z.enum(['resale', 'new_launch', 'bto']),
  
  // Conditional fields based on category
  resaleFields: z.object({
    otpStatus: z.enum(['not_yet', 'viewing', 'otp_received']),
    ipaRequired: z.boolean()
  }).optional(),
  
  newLaunchFields: z.object({
    paymentScheme: z.enum(['progressive', 'deferred', 'undecided']),
    expectedTop: z.date().optional()
  }).optional(),
  
  // Decoupling detection
  ownershipStructure: z.object({
    purchasingAs: z.enum(['single_name', 'joint_names']),
    spousePropertyStatus: z.boolean().optional()
  })
})
```

### Phase 3: AI Agent Integration

#### New Agent Architecture
```typescript
const aiAgentOrchestration = {
  // After Gate 2
  situationalAnalysisAgent: {
    input: 'gate2Data with property routing',
    output: 'sophisticated insights based on property type'
  },
  
  // New: Dynamic Defense Agent
  dynamicDefenseAgent: {
    input: 'complete profile data',
    output: 'customized defense strategy',
    timing: 'before broker consultation'
  },
  
  // Rate Intelligence Agent (Enhanced)
  rateIntelligenceAgent: {
    showPackageComparison: true,
    showMarketDynamics: true,
    hideSpecificRates: true,
    useDynamicStrategy: true
  }
}
```

### Phase 4: Data Flow Validation

#### Gate Progression with Context Validation
```typescript
const gateProgression = {
  gate0: {
    validate: () => loanType in ['new_purchase', 'refinance'],
    store: 'local',
    submit: false
  },
  
  gate1: {
    validate: () => validateBasicInfo(name, email),
    store: 'local',
    submit: false
  },
  
  gate2: {
    validate: () => {
      // Validate based on property category
      if (propertyCategory === 'resale') validateResaleFields()
      if (propertyCategory === 'new_launch') validateNewLaunchFields()
      // Check decoupling signals
      detectDecouplingOpportunity()
    },
    store: 'cumulative',
    submit: true // First n8n submission
  },
  
  gate3: {
    validate: () => validateFinancials(income, commitments),
    store: 'cumulative',
    submit: true // Second n8n submission
  }
}
```

### Implementation Priority
1. **Critical**: Implement Gate 3 in ProgressiveForm.tsx
2. **High**: Add property category routing in Gate 2
3. **High**: Integrate Dynamic Defense Agent
4. **Medium**: Refine AI insights with new intelligence
5. **Medium**: Add decoupling detection logic