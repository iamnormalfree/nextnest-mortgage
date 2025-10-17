---
title: analysis-mortgage-calc-doc
type: report
category: planning
status: archived
owner: planning
date: 2025-08-31
---

2. Mortgage Calculations Integration Points:

  📊 calculateLeadScore() (line 7, IntelligentMortgageForm.tsx):
  // Used for lead qualification and routing
  const basicLeadScore = urgencyProfile.score * 5

  🔬 generateMortgageInsights() (line 8, IntelligentMortgageForm.tsx):
  // Gate 2: Basic calculations (preliminary analysis)
  const currentMonthly = this.calculatePaymentForRate(outstandingLoan, currentRate)
  const newMonthly = this.calculatePaymentForRate(outstandingLoan, marketRate)

  // Gate 3: Full mortgage calculations with Singapore metrics
  import { calculateMortgage } from '@/lib/calculations/mortgage'

  ⚡ calculateUrgencyProfile() (line 6, IntelligentMortgageForm.tsx):
  // Maps loan-specific fields to unified urgency scores
  const urgencyProfile = calculateUrgencyProfile(cumulativeData)

  3. Specific Functions Used:

  | Function                  | Where Used                       | Purpose                              |
  |---------------------------|----------------------------------|--------------------------------------|
  | calculateLeadScore()      | IntelligentMortgageForm.tsx:82   | Lead qualification (0-100 points)    |
  | calculateMortgage()       | mortgage-insights-generator.ts:6 | Basic monthly payment calculations   |
  | calculateUrgencyProfile() | IntelligentMortgageForm.tsx:78   | Maps timeline/status → urgency score |
  | MAS_LIMITS                | Via insights generator           | Singapore regulatory compliance      |

  4. Data Flow Architecture:

  User Input → Progressive Form Gates → Mortgage Calculations → AI Insights

  Gate 0: Loan Type Selection
  Gate 1: Name + Email
  Gate 2: Phone + Loan Details → calculateUrgencyProfile() → Basic insights
  Gate 3: Income + Commitments → calculateMortgage() → Full analysis

  5. Key Insight Generation:

  Gate 2 Insights (Preliminary):
  - Payment estimates using basic calculation formulas
  - Refinancing opportunity analysis
  - Property value assessments

  Gate 3 Insights (Comprehensive):
  - Full TDSR/MSR/LTV compliance analysis
  - Singapore regulatory calculations
  - Bank recommendations
  - Complete affordability breakdown

  The Progressive Form is the primary system that leverages mortgage.ts calculations, while the traditional Lead Form is essentially deprecated in favor of the intelligent, calculation-driven experience.


  🏗️ Form Architecture: Parent-Child Relationship

  IntelligentMortgageForm.tsx (Parent/Orchestrator)

  This is the main container component that:
  - Orchestrates the entire flow: Manages the overall form journey
  - Holds cumulative state: Stores data from all gates (gate0Data, gate1Data, gate2Data, gate3Data)
  - Handles loan type selection: Shows LoanTypeSelector first
  - Manages submissions: Sends data to n8n API endpoints
  - Controls insights: Stores AI responses and lead scores

  // IntelligentMortgageForm.tsx structure:
  const IntelligentMortgageForm = () => {
    // 1. First shows LoanTypeSelector
    // 2. Once loan type selected → shows ProgressiveForm
    // 3. Manages all API submissions
    // 4. Stores cumulative form state
  }

  ProgressiveForm.tsx (Child/UI Component)

  This is the actual form UI component that:
  - Renders the gate-based forms: Shows different fields based on current gate
  - Displays progress indicators: Visual progress bar (Gates 0→1→2→3)
  - Handles field validation: Uses Zod schemas for each gate
  - Animates transitions: Smooth animations between gates
  - Shows insights: Displays AI-generated insights after submissions

  // ProgressiveForm.tsx structure:
  const ProgressiveForm = ({ loanType, onSubmit, insights }) => {
    // Receives loan type from parent
    // Renders appropriate fields for each gate
    // Calls parent's onSubmit when user advances
  }

  📊 Visual Flow Diagram

  IntelligentMortgageForm (Parent)
      │
      ├── Stage 1: LoanTypeSelector
      │   └── User picks: new_purchase/refinance/equity_loan
      │
      └── Stage 2: ProgressiveForm (Child)
          ├── Gate 0: Already completed (loan type)
          ├── Gate 1: Name + Email
          ├── Gate 2: Phone + Loan-specific fields
          └── Gate 3: Financial details

  🔄 Data Flow Between Components

  // IntelligentMortgageForm.tsx (Parent)
  <ProgressiveForm
    loanType={selectedLoanType}           // Passes down loan type
    onGateComplete={handleGateSubmit}     // Receives data back up
    aiInsights={aiInsights}               // Passes down insights
    isSubmitting={isSubmitting}           // Controls loading states
  />

  // ProgressiveForm.tsx (Child)
  const handleSubmit = (gateData) => {
    // Collects form data from current gate
    onGateComplete(gateData)  // Sends to parent
    // Parent handles API submission
  }

  🎯 Key Differences Summary

  | Aspect           | IntelligentMortgageForm                          | ProgressiveForm                              |
  |------------------|--------------------------------------------------|----------------------------------------------|
  | Role             | Orchestrator/Container                           | UI Component                                 |
  | Responsibilities | State management, API calls, loan type selection | Form rendering, user interaction, validation |
  | Data             | Holds ALL cumulative data                        | Only displays current gate                   |
  | API Integration  | Handles n8n submissions                          | No direct API calls                          |
  | Insights         | Fetches and stores insights                      | Only displays insights                       |
  | Navigation       | Controls overall flow                            | Manages gate transitions                     |

  💡 Why This Architecture?

  1. Separation of Concerns: Business logic (parent) vs UI logic (child)
  2. Reusability: ProgressiveForm could theoretically be reused with different orchestrators
  3. State Management: Centralized state in parent makes debugging easier
  4. Testing: Can test UI and business logic separately

  In summary: Think of IntelligentMortgageForm as the brain (logic/state) and ProgressiveForm as the body (UI/interaction). They work together as one intelligent lead capture system.



   📦 Fields Managed by IntelligentMortgageForm but NOT Used by ProgressiveForm

  1. Cumulative Form State ❌ Not Passed

  // IntelligentMortgageForm stores ALL gate data:
  const [formState, setFormState] = useState<FormState>({
    gate0Data: {},
    gate1Data: {},
    gate2Data: {},
    gate3Data: {}
  })
  ProgressiveForm doesn't receive this cumulative state - it only sends data UP, never receives the full history.

  2. Calculated/Enriched Fields ❌ Not Passed

  // IntelligentMortgageForm calculates these BEFORE API submission:
  urgencyProfile: calculateUrgencyProfile(cumulativeData)  // Line 78
  leadScore: urgencyProfile.score * 5                      // Line 82
  These calculations happen in the parent but are never shown to the user via ProgressiveForm.

  3. Submission Metadata ❌ Not Passed

  // IntelligentMortgageForm adds these to API calls:
  metadata: {
    sessionId,           // Line 97 - passed but not used for display
    submissionPoint,     // Line 98 - 'gate2' or 'gate3'
    n8nGate,            // Line 99 - 'G2' or 'G3'
    timestamp           // Line 100 - ISO timestamp
  }

  4. Error States ❌ Not Passed

  // IntelligentMortgageForm tracks:
  const [submissionError, setSubmissionError] = useState<string | null>(null)  // Line 56
  const [isSubmitting, setIsSubmitting] = useState(false)                      // Line 55
  ProgressiveForm doesn't receive submission errors - it manages its own validation errors only.

  5. AI Response Data ❌ Not Passed (Partially)

  // IntelligentMortgageForm stores:
  const [aiInsights, setAiInsights] = useState<any[]>([])  // Line 59
  const [leadScore, setLeadScore] = useState<number>(null)  // Line 60
  While ProgressiveForm can trigger updates via callbacks, it doesn't receive the full stored history.

  ✅ What ProgressiveForm DOES Receive

  interface ProgressiveFormProps {
    loanType: LoanType                                    // Selected loan type
    sessionId: string                                     // Session tracking
    onGateCompletion: (gate: number, data: any) => void  // Callback to send data up
    onAIInsight: (insight: AIInsightResponse) => void    // Callback to trigger insights
    onScoreUpdate: (score: LeadScore) => void            // Callback to update score
  }

  🎯 Why This Separation Matters

  1. Backend Enrichment: IntelligentMortgageForm adds calculated fields (urgencyProfile, leadScore) that are for backend processing, not user display
  2. API Optimization: Metadata like submissionPoint and n8nGate are routing instructions for the API, not user-facing data
  3. State Management: The cumulative formState allows replaying/debugging but would clutter the UI component
  4. Error Handling: Submission errors are handled silently - the form continues with local processing even if n8n fails
  5. Security: Some enriched data (like internal lead scores) shouldn't be exposed in the UI

  In summary: IntelligentMortgageForm acts as a data enrichment layer between the user-facing ProgressiveForm and the backend API, adding calculations, metadata, and handling that the user      
  never sees.




  Looking at these three documents, I can see there's a clear architectural pattern where IntelligentMortgageForm acts as the orchestrator and ProgressiveForm is the UI presentation layer.
  The key elements from IntelligentMortgageForm that should be implemented into ProgressiveForm are:

  🎯 Implementation Strategy: Separating Concerns

  1. What Stays in IntelligentMortgageForm (Orchestrator)

  - Cumulative state management (formState with gate0Data through gate3Data)
  - API submissions (submitToN8n at Gates 2 and 3)
  - Urgency calculations (calculateUrgencyProfile)
  - Lead scoring (calculateLeadScore)
  - Session management (sessionId)
  - n8n response handling (aiInsights, leadScore)

  2. What Moves/Enhances in ProgressiveForm (UI Layer)

  Based on the documents, here's what should be implemented in ProgressiveForm:

● Read(components\forms\ProgressiveForm.tsx)
  ⎿  Read 20 lines (ctrl+r to expand)

● 📋 Implementation Plan: Elements to Add to ProgressiveForm

  1. Enhanced Props Interface ✅

  interface ProgressiveFormProps {
    // Existing props
    loanType: LoanType
    sessionId: string
    onGateCompletion: (gate: number, data: any) => void
    onAIInsight: (insight: AIInsightResponse) => void
    onScoreUpdate: (score: LeadScore) => void

    // NEW: Add from IntelligentMortgageForm
    isSubmitting?: boolean          // Loading state during API calls
    submissionError?: string | null  // Error messages
    aiInsights?: any[]              // Insights to display
    leadScore?: number | null       // Current lead score
    currentGateData?: any           // Pre-filled data for recovery
  }

  2. Visual Elements from AI Implementation Plan 🎨

  A. Trust Signal Cascade (Phase 2B, Task 2.4)

  // Add to ProgressiveForm's render
  const TrustSignals = () => (
    <div className="trust-cascade">
      {currentGate >= 0 && (
        <div className="authority-bar fade-in">
          <span>🔒 Bank-Grade Security</span>
          <span>⭐ 4.9/5 (2,847 reviews)</span>
        </div>
      )}
      {currentGate >= 1 && (
        <div className="social-proof-ticker fade-in-delayed">
          <span>👥 12,847 saved this month</span>
          <span>📉 Avg savings: $382/month</span>
        </div>
      )}
    </div>
  )

  B. Progressive Confidence Bar (Phase 1A, Task 1.3)

  // Already partially implemented, enhance with:
  <div className="confidence-bar">
    <div className="trust-level" data-gate={currentGate}>
      Bank-Grade Security • {Math.min(100, (currentGate + 1) * 25)}% Complete
    </div>
    {isSubmitting && (
      <div className="submission-indicator">
        <span className="spinner-gold"></span>
        Analyzing with AI...
      </div>
    )}
  </div>

  C. AI Insight Display Panel (Phase 2A, Task 2.2)

  // Add after form fields in each gate
  {aiInsights && aiInsights.length > 0 && (
    <div className="ai-insights-container">
      {aiInsights.map((insight, index) => (
        <div key={index} className="ai-insight-card fade-in">
          <div className="ai-badge">
            <Icon name="sparkles" className="text-nn-gold" />
            <span>AI Analysis</span>
          </div>
          <p className="insight-text">{insight.message}</p>
          {insight.calculations && (
            <div className="calculation-grid">
              {/* Display calculations */}
            </div>
          )}
        </div>
      ))}
    </div>
  )}

  3. Gate-Specific CTAs from Roundtable 🎯

  // Update gateButtons per NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md
  const gateButtons = {
    0: "Get Instant Estimate (No Email Required)",
    1: "See Your Personalized Analysis",
    2: "Get Full Report & Bank Matches",
    3: "Unlock Exclusive Rates & Expert Advice"
  }

  4. Psychological Hooks (Phase 2A) 🧠

  // Add contextual hooks per gate
  const psychologicalHooks = {
    gate0: {
      scarcity: "Only 3 banks currently offer rates below 3%",
      urgency: null // Don't pressure at entry
    },
    gate1: {
      social: "73% of similar profiles saved $500+/month",
      authority: "Based on 10,000+ mortgage analyses"
    },
    gate2: {
      urgency: "DBS rates increase Friday - 3 days left",
      scarcity: "Limited IPA slots available this month"
    },
    gate3: {
      exclusivity: "Unlock broker-exclusive rates",
      value: "Average client saves $45,000 over loan term"
    }
  }

  // Display relevant hook for current gate
  {psychologicalHooks[`gate${currentGate}`] && (
    <div className="psychological-hook">
      {/* Render appropriate hook */}
    </div>
  )}

  5. Processing Visualization (Phase 3A, Task 3.3) ⏳

  // Show during submission at Gates 2 and 3
  {isSubmitting && currentGate >= 2 && (
    <ProcessingVisualization
      currentTier={currentGate === 2 ? 1 : 2}
      progress={submissionProgress}
    >
      <div className="tier tier-1 completed">
        ✓ Instant Analysis Complete
      </div>
      <div className="tier tier-2 processing">
        🧠 AI Deep Dive in Progress...
      </div>
      {currentGate === 3 && (
        <div className="tier tier-3 queued">
          📄 Full Report Generation (45s)
        </div>
      )}
    </ProcessingVisualization>
  )}

  6. Security Indicators (Phase 2B, Task 2.5) 🔒

  const securityFeatures = {
    0: ['256-bit encryption', 'No data stored'],
    1: ['Bank-grade security', 'Email encryption'],
    2: ['Complete data protection', 'PDPA compliant'],
    3: ['End-to-end security', 'Broker-only access']
  }

  // Add to each gate's UI
  <div className="security-indicators">
    {securityFeatures[currentGate]?.map(feature => (
      <div className="security-feature">
        ✓ {feature}
      </div>
    ))}
  </div>

  7. Smart Field Grouping & Micro-Commitments 📝

  // Implement intelligent field ordering per urgency
  const getFieldOrder = (loanType: LoanType, gate: number) => {
    if (gate === 2) {
      // Most important fields first
      if (loanType === 'refinance') {
        return ['currentRate', 'lockInStatus', 'outstandingLoan'] // Urgency first
      }
      if (loanType === 'new_purchase') {
        return ['purchaseTimeline', 'propertyType', 'priceRange'] // Timeline first
      }
    }
    return defaultFieldOrder
  }

  🔄 Data Flow Implementation

  // ProgressiveForm.tsx enhancements
  const ProgressiveForm = ({
    loanType,
    onGateCompletion,
    aiInsights,
    isSubmitting,
    submissionError
  }: ProgressiveFormProps) => {

    // Local state for current gate
    const [currentGate, setCurrentGate] = useState(1)
    const [localFormData, setLocalFormData] = useState({})

    const handleGateProgression = async () => {
      // Validate current gate
      const isValid = await trigger()

      if (isValid) {
        // Send data UP to parent
        onGateCompletion(currentGate, localFormData)

        // Parent handles submission at Gates 2 & 3
        // ProgressiveForm just shows loading state
        if (currentGate < 3) {
          setCurrentGate(currentGate + 1)
        }
      }
    }

    return (
      <div className="progressive-form">
        {/* Trust signals */}
        <TrustSignals />

        {/* Progress indicator */}
        <ProgressBar currentGate={currentGate} />

        {/* Security indicators */}
        <SecurityIndicators gate={currentGate} />

        {/* Form fields */}
        {renderGateFields(currentGate, loanType)}

        {/* AI insights display */}
        {aiInsights && <AIInsightDisplay insights={aiInsights} />}

        {/* Psychological hooks */}
        <PsychologicalHooks gate={currentGate} />

        {/* Processing visualization */}
        {isSubmitting && <ProcessingVisualization />}

        {/* Error handling */}
        {submissionError && <ErrorAlert message={submissionError} />}

        {/* Gate progression button */}
        <button
          onClick={handleGateProgression}
          disabled={isSubmitting}
          className="btn-primary-gradient"
        >
          {isSubmitting ? 'Analyzing...' : gateButtons[currentGate]}
        </button>
      </div>
    )
  }

  📊 Summary: What Gets Implemented Where

  | Feature             | IntelligentMortgageForm | ProgressiveForm        |
  |---------------------|-------------------------|------------------------|
  | State Management    | ✅ Cumulative formState  | ❌ Only current gate    |
  | API Calls           | ✅ submitToN8n           | ❌ Just triggers parent |
  | Calculations        | ✅ Urgency, Lead Score   | ❌ Display only         |
  | Trust Signals       | ❌                       | ✅ Visual elements      |
  | Progress Bar        | ❌                       | ✅ Gate progression     |
  | AI Insights         | ✅ Fetches               | ✅ Displays             |
  | Security Badges     | ❌                       | ✅ Per-gate display     |
  | Psychological Hooks | ❌                       | ✅ Contextual display   |
  | Processing Visual   | ❌                       | ✅ During submission    |
  | Field Validation    | ❌                       | ✅ Zod schemas          |
  | Error Display       | ❌                       | ✅ User feedback        |

  This separation ensures ProgressiveForm remains a pure presentation component while IntelligentMortgageForm handles all business logic and state orchestration.
