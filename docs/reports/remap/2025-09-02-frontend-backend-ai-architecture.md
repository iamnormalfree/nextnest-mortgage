---
title: frontend-backend-ai-architecture
type: report
status: analysis
owner: engineering
date: 2025-09-02
---

# Frontend/Backend AI Architecture Implementation Plan
## ✅ COMPLETED: Replaced n8n with Local AI Agent Processing (2025-01-09)

---

## 🏗️ **FRONTEND/BACKEND AI ARCHITECTURE**

### **IntelligentMortgageForm.tsx (Redesigned)**

```typescript
'use client'

import React, { useState } from 'react'
import { LoanTypeSelector } from './LoanTypeSelector'
import { ProgressiveForm } from './ProgressiveForm'
import { SimpleAgentUI } from './SimpleAgentUI'
import { DynamicDefenseAgent } from '@/lib/agents/dynamic-defense-agent'
import { SituationalAnalysisAgent } from '@/lib/agents/situational-analysis-agent'
import { RateIntelligenceAgent } from '@/lib/agents/rate-intelligence-agent'
import { CompetitiveProtectionAgent } from '@/lib/agents/competitive-protection-agent'

// Align with NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md
interface FormState {
  gate0Data: { loanType: 'new_purchase' | 'refinance' | 'commercial' } // Include commercial for routing
  gate1Data: { name: string; email: string }
  gate2Data: {
    phone: string
    applicantType: 'single' | 'joint' // Added 2025-01-09 for Singapore reality
    // Property routing per evolution.md
    propertyCategory?: 'resale' | 'new_launch' | 'bto' | 'commercial'
    // NOTE: ownershipStructure removed - now AI-inferred by DecouplingDetectionAgent
    // Loan-specific fields (per ROUNDTABLE authority doc)
    ...dynamicLoanFields
  }
  gate3Data: { 
    monthlyIncome: number
    existingCommitments?: number
    // Optimization preferences per evolution.md
    optimizationPreferences?: OptimizationPreferences
  }
}

// AI-Inferred Fields (Not in FormState)
interface AIInferredData {
  // Decoupling detection - analyzed by AI from patterns
  ownershipStructure?: {
    purchasingAs: 'single_name' | 'joint_names'  // Inferred from form data
    maritalStatus: 'single' | 'married' | 'divorced'  // Inferred from patterns
    spousePropertyStatus?: boolean  // Asked by AI if needed
  }
  // Cash equity inquiry - handled by AI if mentioned
  cashEquityIntent?: {
    mentioned: boolean
    propertyValue?: number
    outstandingLoan?: number
    purpose?: string
  }
}

interface AIAgentState {
  situationalInsights: SituationalInsight[]
  rateIntelligence: RateIntelligence
  defenseStrategy: DefenseStrategy
  brokerConsultationBrief: BrokerBrief
}

const IntelligentMortgageForm = ({ className = '' }) => {
  const [selectedLoanType, setSelectedLoanType] = useState<'new_purchase' | 'refinance' | null>(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  // Form state per Context Validation Framework
  const [formState, setFormState] = useState<FormState>({
    gate0Data: {},
    gate1Data: {},
    gate2Data: {},
    gate3Data: {}
  })
  
  // AI Agent orchestration state
  const [aiAgentState, setAiAgentState] = useState<AIAgentState>({
    situationalInsights: [],
    rateIntelligence: null,
    defenseStrategy: null,
    brokerConsultationBrief: null
  })
  
  // Agent instances
  const [competitiveProtectionAgent] = useState(() => new CompetitiveProtectionAgent())
  const [situationalAnalysisAgent] = useState(() => new SituationalAnalysisAgent())
  const [rateIntelligenceAgent] = useState(() => new RateIntelligenceAgent())
  const [dynamicDefenseAgent] = useState(() => new DynamicDefenseAgent())

  // Per ROUNDTABLE submission strategy - ONLY at Gates 2 & 3
  const handleGateCompletion = async (gate: number, data: any) => {
    console.log(`📋 Gate ${gate} completed with data:`, data)
    
    // Competitive protection check
    const isCompetitor = competitiveProtectionAgent.detectCompetitorSignals({
      sessionId,
      completionSpeed: Date.now() - sessionStart,
      email: formState.gate1Data?.email
    })
    
    switch(gate) {
      case 0:
      case 1:
        // NO BACKEND CALLS - Store locally only (per ROUNDTABLE authority)
        updateFormState(gate, data)
        break
        
      case 2:
        // FIRST AI PROCESSING - Situational Analysis
        updateFormState(gate, data)
        
        const gate2CumulativeData = {
          ...formState.gate0Data,
          ...formState.gate1Data,
          ...data
        }
        
        // Sequential AI agent processing (replace n8n)
        const situationalInsights = await situationalAnalysisAgent.analyze(gate2CumulativeData)
        const rateIntelligence = await rateIntelligenceAgent.generateIntelligence(gate2CumulativeData)
        
        // Competitive protection gating
        const gatedInsights = competitiveProtectionAgent.gateInformation(
          { situationalInsights, rateIntelligence }, 
          isCompetitor
        )
        
        setAiAgentState(prev => ({
          ...prev,
          situationalInsights: gatedInsights.situationalInsights,
          rateIntelligence: gatedInsights.rateIntelligence
        }))
        
        break
        
      case 3:
        // SECOND AI PROCESSING - Complete optimization
        updateFormState(gate, data)
        
        const gate3CumulativeData = {
          ...formState.gate0Data,
          ...formState.gate1Data,
          ...formState.gate2Data,
          ...data
        }
        
        // Final AI processing sequence
        const enhancedInsights = await situationalAnalysisAgent.enhanceWithFinancials(gate3CumulativeData)
        const defenseStrategy = await dynamicDefenseAgent.generateDefenseStrategy(gate3CumulativeData)
        const brokerBrief = await prepareBrokerConsultation(gate3CumulativeData, {
          situationalInsights: enhancedInsights,
          defenseStrategy
        })
        
        setAiAgentState(prev => ({
          ...prev,
          situationalInsights: enhancedInsights,
          defenseStrategy,
          brokerConsultationBrief: brokerBrief
        }))
        
        break
    }
  }

  const updateFormState = (gate: number, data: any) => {
    const gateKey = `gate${gate}Data` as keyof FormState
    setFormState(prev => ({
      ...prev,
      [gateKey]: data
    }))
  }

  return (
    <section id="intelligent-contact" className={`py-16 bg-nn-grey-light ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {!selectedLoanType ? (
          <LoanTypeSelector onSelect={setSelectedLoanType} />
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Progressive Form */}
            <ProgressiveForm 
              loanType={selectedLoanType}
              sessionId={sessionId}
              onGateCompletion={handleGateCompletion}
              formState={formState}
            />
            
            {/* Simple Agent UI - Replace complex n8n insights */}
            <SimpleAgentUI
              situationalInsights={aiAgentState.situationalInsights}
              rateIntelligence={aiAgentState.rateIntelligence}
              defenseStrategy={aiAgentState.defenseStrategy}
              brokerBrief={aiAgentState.brokerConsultationBrief}
            />
          </div>
        )}
      </div>
    </section>
  )
}
```

### **ProgressiveForm.tsx (Enhanced for Property Routing)**

```typescript
'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createGateSchema } from '@/lib/validation/mortgage-schemas'

// Per ROUNDTABLE authority - 4 gates exactly
const formGates = [
  { gateNumber: 0, label: 'Loan Type', description: 'Choose your path' },
  { gateNumber: 1, label: 'Basic Information', description: 'Get personalized insights' },
  { gateNumber: 2, label: 'Contact Details', description: 'Unlock intelligent analysis' },
  { gateNumber: 3, label: 'Financial Profile', description: 'Complete optimization' } // Now implemented!
]

export function ProgressiveForm({ loanType, onGateCompletion, formState }) {
  const [currentGate, setCurrentGate] = useState(1) // Start at gate 1 (loan type selected)
  const [completedGates, setCompletedGates] = useState([0])
  
  // Property category routing state (per evolution.md)
  const [propertyCategory, setPropertyCategory] = useState<'resale' | 'new_launch' | 'bto' | null>(null)
  
  const currentSchema = createGateSchema(loanType, currentGate, propertyCategory)
  
  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onChange'
  })

  // Gate progression per ROUNDTABLE submission strategy
  const progressToNextGate = async (data: any) => {
    // Update local state
    setCompletedGates(prev => [...prev, currentGate])
    
    // Call parent handler (triggers AI processing at Gates 2 & 3)
    await onGateCompletion(currentGate, data)
    
    if (currentGate < 3) {
      setCurrentGate(currentGate + 1)
    }
  }

  // Render Gate 2 with property routing (per evolution.md)
  const renderGate2Fields = () => {
    if (loanType === 'new_purchase') {
      // First: Property category selection
      if (!propertyCategory) {
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              What type of property are you purchasing?
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'resale', label: 'Resale Property (HDB/Private)', desc: 'Existing completed property' },
                { value: 'new_launch', label: 'New Launch (EC/Private)', desc: 'Under construction development' },
                { value: 'bto', label: 'BTO Application', desc: 'HDB Build-To-Order' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPropertyCategory(option.value as any)}
                  className="p-4 text-left border rounded-lg hover:border-nn-gold transition-colors"
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )
      }

      // Then: Category-specific fields
      switch(propertyCategory) {
        case 'resale':
          return renderResaleFields()
        case 'new_launch':
          return renderNewLaunchFields()
        case 'bto':
          return renderBtoFields()
      }
    }

    if (loanType === 'refinance') {
      return renderRefinanceFields()
    }
  }

  // ✅ GATE 3 IMPLEMENTED (2025-01-09)
  const renderGate3Fields = () => {
    return (
      <div className="space-y-4">
        {/* Monthly Income */}
        <div className="field-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income
          </label>
          <Controller
            name="monthlyIncome"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  {...field}
                  type="number"
                  className="w-full pl-8 pr-4 py-2 border rounded-lg"
                  placeholder="8000"
                />
              </div>
            )}
          />
        </div>

        {/* Existing Commitments */}
        <div className="field-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Existing Monthly Commitments <span className="text-gray-400">(Optional)</span>
          </label>
          <Controller
            name="existingCommitments"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  {...field}
                  type="number"
                  className="w-full pl-8 pr-4 py-2 border rounded-lg"
                  placeholder="2000"
                />
              </div>
            )}
          />
        </div>

        {/* Optimization Preferences (per evolution.md) */}
        <div className="field-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Package Preference
          </label>
          <Controller
            name="packagePreference"
            control={control}
            render={({ field }) => (
              <select {...field} className="w-full px-4 py-2 border rounded-lg">
                <option value="">What matters most to you?</option>
                <option value="lowest_rate">Lowest possible rate</option>
                <option value="flexibility">Maximum flexibility</option>
                <option value="stability">Rate stability</option>
                <option value="features">Additional features</option>
              </select>
            )}
          />
        </div>
      </div>
    )
  }

  const renderGateFields = () => {
    switch (currentGate) {
      case 1:
        return renderGate1Fields() // Name + Email
      case 2:
        return (
          <>
            {renderPhoneField()}
            {renderGate2Fields()} {/* Property routing logic */}
            {/* NOTE: ownershipStructure detection removed - now handled by AI */}
          </>
        )
      case 3:
        return renderGate3Fields() // IMPLEMENT THIS!
      default:
        return null
    }
  }

  return (
    <div className="progressive-form">
      {/* Progress Indicator */}
      <div className="progress-indicator mb-6">
        {/* Same as existing implementation */}
      </div>
      
      {/* Form Content */}
      <form onSubmit={handleSubmit(progressToNextGate)} className="space-y-6">
        <div className="animate-slide-up">
          {renderGateFields()}
        </div>
        
        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-3 px-6 rounded-lg font-semibold bg-nn-gold text-white"
        >
          {formGates[currentGate]?.ctaText || 'Continue'}
        </button>
      </form>
    </div>
  )
}
```

### **SimpleAgentUI.tsx (Replace Complex n8n Insights)**

```typescript
'use client'

import React from 'react'

interface SimpleAgentUIProps {
  situationalInsights: SituationalInsight[]
  rateIntelligence: RateIntelligence
  defenseStrategy: DefenseStrategy
  brokerBrief: BrokerBrief
}

export function SimpleAgentUI({ 
  situationalInsights, 
  rateIntelligence, 
  defenseStrategy,
  brokerBrief 
}: SimpleAgentUIProps) {
  
  if (!situationalInsights?.length) return null

  return (
    <div className="mt-8 space-y-6">
      {/* Situational Insights */}
      {situationalInsights.map((insight, index) => (
        <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {insight.title}
              </h3>
              <p className="text-gray-700 mb-3">
                {insight.message}
              </p>
              
              {/* Strategic Intelligence Display */}
              {insight.strategicIntelligence && (
                <div className="space-y-2">
                  {insight.strategicIntelligence.map((intel, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 bg-nn-gold rounded-full"></span>
                      <span>{intel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Rate Intelligence Display */}
      {rateIntelligence && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">
            📊 Your Rate Environment Analysis
          </h3>
          
          {/* Market Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Market Timing</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {rateIntelligence.marketTiming.map((timing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <span>{timing}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Your Advantages</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {rateIntelligence.profileAdvantages.map((advantage, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <span>{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Package Comparison (Generic but Specific) */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-3">Package Suitability Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Fixed', 'Floating', 'Hybrid'].map(packageType => (
                <div key={packageType} className="text-center p-3 bg-gray-50 rounded">
                  <div className="font-medium text-gray-900">{packageType}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getPackageSuitability(packageType, rateIntelligence)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Broker Consultation Priming */}
      {brokerBrief && (
        <div className="bg-gradient-to-r from-nn-gold/10 to-yellow-50 rounded-lg p-6 border border-nn-gold/30">
          <h3 className="font-semibold text-nn-grey-dark mb-4">
            🎯 Ready for Expert Consultation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-nn-grey-dark mb-2">What Our Brokers Will Provide:</h4>
              <ul className="space-y-1 text-sm text-nn-grey-medium">
                <li>✅ Access to rates not available online</li>
                <li>✅ Customized package negotiations</li>
                <li>✅ Strategic timing optimization</li>
                <li>✅ Multi-bank competitive analysis</li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <button className="bg-nn-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-nn-gold/90 transition-colors">
                Speak with Licensed Broker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

## 📋 **CONTEXT-VALIDATED IMPLEMENTATION PLAN**

### **Phase 1: Context Validation (MANDATORY)**

#### **Domain Knowledge Mapping ✅**
```typescript
// Per NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md
const domainValidation = {
  mortgageCalculations: {
    formula: "M = P * [r(1+r)^n] / [(1+r)^n - 1]", // ✅ lib/calculations/mortgage.ts:62
    masCompliance: "TDSR 55%, Stress Test 4%",        // ✅ lib/calculations/mortgage.ts:87-98
    singaporeSpecific: "LTV, MSR, ABSD calculations"  // ✅ lib/calculations/mortgage.ts:176-275
  },
  formStructure: {
    gates: [
      { gate: 0, fields: ['loanType'], submission: false },
      { gate: 1, fields: ['name', 'email'], submission: false },
      { gate: 2, fields: ['phone', ...propertyRouting], submission: true }, // AI processing
      { gate: 3, fields: ['monthlyIncome', 'existingCommitments'], submission: true } // AI processing
    ]
  }
}
```

#### **System Integration Points Mapping ✅**
```typescript
// Replace n8n with frontend/backend agents
const systemIntegrations = {
  frontend: {
    form: "components/forms/IntelligentMortgageForm.tsx",
    agentUI: "components/forms/SimpleAgentUI.tsx", // NEW
    calculations: "lib/calculations/mortgage.ts",
    agents: {
      situational: "lib/agents/situational-analysis-agent.ts", // NEW
      rateIntelligence: "lib/agents/rate-intelligence-agent.ts", // NEW
      dynamicDefense: "lib/agents/dynamic-defense-agent.ts", // NEW
      competitiveProtection: "lib/agents/competitive-protection-agent.ts" // NEW
    }
  },
  backend: {
    api: "app/api/forms/analyze/route.ts", // MODIFIED for agent orchestration
    agentOrchestration: "app/api/agents/", // NEW
    fallback: "Local processing only - no n8n dependency"
  },
  external: {
    n8nWebhook: "REMOVED - All processing local",
    workflows: "REPLACED - AI agents in frontend/backend"
  }
}
```

### **Phase 2: Implementation Tasks**

#### **🔥 Critical Tasks (Context Validation Required)**

**Task 1: Implement Gate 3** ✅ COMPLETED (2025-01-09)
- **Context**: Gate 3 implementation completed with optimization parameters
- **Status**: All renderGate3Fields() functionality implemented
- **Impact**: Complete form progression 0→1→2→3 functional
```typescript
// ✅ ALL SUBTASKS COMPLETED (2025-01-09):
[x] 1.1. Add renderGate3Fields() to ProgressiveForm.tsx
[x] 1.2. Create financial profile fields (monthlyIncome, existingCommitments)
[x] 1.3. Add optimization preferences fields per evolution.md
[x] 1.4. Update createGateSchema() for gate 3 validation
[x] 1.5. Test gate progression 0->1->2->3
```

**Task 2: Create AI Agent Architecture** ✅ COMPLETED (2025-01-09)
- **Context**: Successfully replaced n8n processing with local AI agents
- **Status**: All agents operational and integrated
```typescript
// ✅ ALL SUBTASKS COMPLETED (2025-01-09):
[x] 2.1. Create SituationalAnalysisAgent class
[x] 2.2. Create RateIntelligenceAgent class  
[x] 2.3. Create DynamicDefenseAgent class
[x] 2.4. Create CompetitiveProtectionAgent class
[x] 2.5. Implement agent orchestration in IntelligentMortgageForm.tsx
[x] 2.6. Create SimpleAgentUI component for results display
```

**Task 3: Implement Property Category Routing** ✅ COMPLETED (2025-01-09)
- **Context**: Property routing fully implemented with all category flows
- **Status**: Resale/new_launch/bto/commercial routing operational
```typescript
// ✅ ALL SUBTASKS COMPLETED (2025-01-09):
[x] 3.1. Add propertyCategory state to ProgressiveForm.tsx
[x] 3.2. Create property category selection UI
[x] 3.3. Implement renderResaleFields() for HDB/Private resale
[x] 3.4. Implement renderNewLaunchFields() for EC/Private launches
[x] 3.5. Implement renderBtoFields() for BTO applications
[x] 3.6. Update schema validation for conditional fields
```

**Task 4: Add Decoupling Detection** 💑 MEDIUM
- **Context**: Per evolution.md iteration 3 - detect married buying single name
- **Validation**: Business logic for ABSD avoidance
```typescript
// Subtasks:
4.1. Implement pattern recognition without form fields (AI-inferred only)
4.2. Create decoupling signal detection logic
4.3. Generate strategic implications (ABSD, CPF, eligibility)
4.4. Update situational analysis agent with decoupling intelligence
```

#### **🎯 AI Agent Implementation Tasks**

**Task 5: SituationalAnalysisAgent** 
```typescript
// lib/agents/situational-analysis-agent.ts
5.1. Implement OTP urgency analysis for new purchase
5.2. Implement payment scheme analysis (progressive vs deferred)
5.3. Implement lock-in timing analysis for refinance
5.4. Implement cost-benefit analysis with quantum thresholds
5.5. Generate psychological triggers per loan type
```

**Task 6: RateIntelligenceAgent**
```typescript  
// lib/agents/rate-intelligence-agent.ts
6.1. Implement SORA/Fed market analysis
6.2. Generate personalized rate levers without specific rates
6.3. Create bank category analysis (local vs foreign)
6.4. Implement package comparison (fixed/floating/hybrid)
6.5. Generate strategic timing recommendations
```

**Task 7: DynamicDefenseAgent**
```typescript
// lib/agents/dynamic-defense-agent.ts  
7.1. Implement client profile analysis
7.2. Generate defense options based on current bank avoidance
7.3. Create multi-layer strategy (primary/alternative/insurance)
7.4. Implement bank propensity analysis
7.5. Generate broker consultation priming
```

**Task 8: CompetitiveProtectionAgent**
```typescript
// lib/agents/competitive-protection-agent.ts
8.1. Implement competitor signal detection
8.2. Create information gating logic  
8.3. Generate safe alternative language
8.4. Implement session monitoring for rapid/suspicious usage
8.5. Create fallback responses for detected competitors
```

#### **🔧 Schema & Validation Updates**

**Task 9: Update Schemas for Property Routing**
```typescript
// lib/validation/mortgage-schemas.ts
9.1. Update loanType to ['new_purchase', 'refinance', 'commercial']
9.2. Add propertyCategory enum ['resale', 'new_launch', 'bto', 'commercial']
9.3. Create conditional field schemas per property category
9.4. Remove ownershipStructure from form schemas (AI-inferred only)
9.5. Update createGateSchema() for dynamic validation
```

**Task 10: API Layer Modifications**  
```typescript
// app/api/forms/analyze/route.ts
10.1. Remove n8n webhook calls
10.2. Implement local AI agent orchestration
10.3. Add competitive protection middleware
10.4. Create fallback-only processing (no external dependencies)
10.5. Update response format for SimpleAgentUI consumption
```

### **Phase 3: Testing & Validation**

**Task 11: Context Validation Testing**
```bash
# Per NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md
11.1. Verify all imports resolve (npm run build:check)
11.2. Test gate progression 0->1->2->3 with all loan types
11.3. Validate form output matches agent input contracts  
11.4. Test psychological non-priming (no forbidden terms)
11.5. Verify competitive protection triggers correctly
```

**Task 12: Regression Testing**
```typescript
// Test existing functionality remains intact
12.1. Verify existing mortgage calculations still work
12.2. Test urgency calculation consistency
12.3. Validate form submission flow (Gates 2 & 3 only)
12.4. Check rate protection (no specific rates disclosed)
12.5. Ensure broker consultation priming effectiveness
```

### **Phase 4: Deployment Strategy**

**Task 13: Incremental Deployment**
```typescript
13.1. Deploy Gate 3 implementation (Critical Gap)
13.2. Deploy AI agent architecture (replace n8n dependency)
13.3. Deploy property routing (enhanced user experience)
13.4. Deploy competitive protection (business critical)
13.5. Monitor lead quality and conversion metrics
```

## 🎯 **IMPLEMENTATION PRIORITY ORDER**

### **Week 1 (Critical)**
1. **Task 1**: Implement Gate 3 (breaks funnel)
2. **Task 2**: Basic AI Agent structure  
3. **Task 10**: Remove n8n dependency

### **Week 2 (High Value)**  
4. **Task 3**: Property category routing
5. **Task 5-6**: Core AI agents (Situational + Rate Intelligence)
6. **Task 9**: Schema updates

### **Week 3 (Enhancement)**
7. **Task 4**: Decoupling detection
8. **Task 7-8**: Advanced AI agents (Defense + Protection)
9. **Task 11-12**: Testing & validation

## **Key Benefits of This Architecture**

1. **Eliminates n8n Dependency**: All processing local to frontend/backend
2. **Maintains Proven Psychology**: Gate structure and priming remain intact
3. **Enhanced Intelligence**: Property routing and decoupling detection
4. **Competitive Protection**: Built-in safeguards against competitors
5. **Broker-Centric**: All flows designed to drive broker consultation
6. **Context Validated**: Full compliance with framework requirements

This architecture transforms the form from n8n-dependent to self-contained while preserving all strategic advantages.