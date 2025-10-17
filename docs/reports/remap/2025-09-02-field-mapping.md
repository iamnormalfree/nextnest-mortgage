---
title: field-mapping
type: report
status: analysis
owner: engineering
date: 2025-09-02
---

 📋 COMPREHENSIVE FIELD MAPPING ACROSS ALL GATES

  🔍 UNIVERSAL FIELDS (ALL LOAN TYPES)

  Gate 0: Loan Type Selection

  | Field    | Type | Schema                                        | Label               | AI Insights                    | Status        |
  |----------|------|-----------------------------------------------|---------------------|--------------------------------|---------------|
  | loanType | enum | 'new_purchase' \| 'refinance' \| 'commercial' | Loan Type Selection | ✅ Used for routing logic       | ✅ IMPLEMENTED (2025-01-09) |

  Gate 1: Basic Information

  | Field | Type   | Schema                                     | Label         | AI Insights | Status        |
  |-------|--------|--------------------------------------------|---------------|-------------|---------------|
  | name  | string | min(2), max(100), regex(/^[a-zA-Z\s'-]+$/) | Your Name     | ❌ Not used  | ✅ IMPLEMENTED |
  | email | string | email(), toLowerCase(), trim()             | Email Address | ❌ Not used  | ✅ IMPLEMENTED |

  Gate 2: Contact & Core Details (NEEDS PROPERTY ROUTING)

  | Field | Type   | Schema                | Label                  | AI Insights | Status        |
  |-------|--------|-----------------------|------------------------|-------------|---------------|
  | phone | string | regex(/^[689]\d{7}$/) | Singapore Phone Number | ❌ Not used  | ✅ IMPLEMENTED |
  | applicantType | enum | 'single' \| 'joint' | Application Type | ✅ Used for IWAA calculations | ✅ IMPLEMENTED (2025-01-09) |
  | propertyCategory | enum | 'resale' \| 'new_launch' \| 'bto' \| 'commercial' | Property Category (New Purchase only) | ✅ Routes to different flows | ✅ IMPLEMENTED (2025-01-09) |

  Gate 3: Optimization Parameters (REPOSITIONED - Not just financial)

  Financial Fields (For IPA Calculation)
  
  | Field               | Type   | Schema               | Label                | AI Insights                | Status            |
  |---------------------|--------|----------------------|----------------------|----------------------------|-------------------|
  | monthlyIncome       | number | min(0), max(9999999) | Monthly Income       | ✅ Used in IPA calculation  | ✅ IMPLEMENTED (2025-01-09) |
  | existingCommitments | number | min(0), optional()   | Existing Commitments | ✅ Used in TDSR calculation | ✅ IMPLEMENTED (2025-01-09) |
  
  Optimization Preferences (NEW - For Strategic AI Analysis)
  
  | Field               | Type   | Schema                                                        | Label                | AI Insights                        | Status            |
  |---------------------|--------|---------------------------------------------------------------|----------------------|------------------------------------|-------------------|
  | packagePreference   | enum   | 'lowest_rate' \| 'flexibility' \| 'stability' \| 'features'  | What matters most?   | ✅ Drives package recommendation    | ✅ IMPLEMENTED (2025-01-09) |
  | riskTolerance       | enum   | 'conservative' \| 'moderate' \| 'aggressive'                 | Risk Appetite        | ✅ Fixed vs floating preference     | ✅ IMPLEMENTED (2025-01-09) |
  | planningHorizon     | enum   | 'short_term' \| 'medium_term' \| 'long_term'                 | Planning Timeline    | ✅ Tenure recommendation            | ✅ IMPLEMENTED (2025-01-09) |

  ---
  🏠 NEW PURCHASE LOAN TYPE

  Gate 2: New Purchase Specific Fields

  | Field            | Type    | Schema                                                      | Label                        | AI Insights                      | Status
                |
  |------------------|---------|-------------------------------------------------------------|------------------------------|----------------------------------|------------------------------    
  --------------|
  | propertyType     | enum    | 'HDB' | 'EC' | 'Private' | 'Landed'                         | Property Type                | ✅ Used in LTV/MSR calculations   | ✅ IMPLEMENTED
                  |
  | priceRange       | number  | min(300000), max(5000000)                                   | Property Price Range         | ✅ Used in affordability analysis | ✅ IMPLEMENTED
                  |
  | purchaseTimeline | enum    | 'this_month' | 'next_3_months' | '3_6_months' | 'exploring' | When are you buying?         | ✅ PRIMARY URGENCY FIELD          | ✅ IMPLEMENTED
                  |
  | ipaStatus        | enum    | 'have_ipa' | 'applied' | 'starting' | 'what_is_ipa'         | In-Principle Approval Status | ✅ Used in urgency refinement     | ✅ IMPLEMENTED
                  |
  | firstTimeBuyer   | boolean | boolean()                                                   | First Time Buyer             | ✅ Used in stamp duty calculation | ❌ FIELD EXISTS BUT NOT         
  IMPLEMENTED IN FORM |

  Additional Schema Fields (NOT IN FORM)

  | Field            | Type    | Schema                  | Status        |
  |------------------|---------|-------------------------|---------------|
  | downPaymentReady | boolean | optional()              | ❌ NOT IN FORM |
  | cpfUsage         | enum    | 'yes' | 'no' | 'unsure' | ❌ NOT IN FORM |

  ---
  🔄 REFINANCE LOAN TYPE

  Gate 2: Refinance Specific Fields

  | Field           | Type   | Schema                                            | Label                     | AI Insights                    | Status        |
  |-----------------|--------|---------------------------------------------------|---------------------------|--------------------------------|---------------|
  | currentRate     | number | min(0), max(10)                                   | Current Interest Rate (%) | ✅ Used in savings calculation  | ✅ IMPLEMENTED |
  | lockInStatus    | enum   | 'ending_soon' | 'no_lock' | 'locked' | 'not_sure' | Lock-in Period Status     | ✅ PRIMARY URGENCY FIELD        | ✅ IMPLEMENTED |
  | currentBank     | enum   | string().min(1)                                   | Current Bank              | ✅ Used in competitive analysis | ✅ IMPLEMENTED |
  | propertyValue   | number | min(100000), max(20000000)                        | Current Property Value    | ✅ Used in LTV calculation      | ✅ IMPLEMENTED |
  | outstandingLoan | number | min(10000), max(10000000)                         | Outstanding Loan Balance  | ✅ Used in equity calculation   | ✅ IMPLEMENTED |

  Additional Schema Fields (NOT IN FORM)

  | Field           | Type   | Schema                                                            | Status        |
  |-----------------|--------|-------------------------------------------------------------------|---------------|
  | yearsPurchased  | number | min(0), max(50)                                                   | ❌ NOT IN FORM |
  | refinanceReason | enum   | 'lower_rate' | 'cash_out' | 'better_terms' | 'debt_consolidation' | ❌ NOT IN FORM |
  | cashOutAmount   | number | min(0), max(2000000), optional()                                  | ❌ NOT IN FORM |

  ---
  💰 EQUITY LOAN TYPE (REMOVED - 2025-01-09)

  **Status**: REMOVED from loan type selection per MASTER_IMPLEMENTATION_PLAN.md
  **Replacement**: Cash equity requests handled by AI agents during conversation
  **Migration**: No existing data to migrate

  Previous Gate 2: Equity Loan Specific Fields (ARCHIVED)

  | Field           | Type   | Schema                                           | Label                        | Status        |
  |-----------------|--------|--------------------------------------------------|------------------------------|---------------|
  | propertyValue   | number | min(200000), max(20000000)                       | Current Property Value       | 🗄️ ARCHIVED   |
  | outstandingLoan | number | min(0), max(10000000)                            | Outstanding Mortgage Balance | 🗄️ ARCHIVED   |
  | equityNeeded    | number | min(50000), max(3000000)                         | Equity Amount Needed         | 🗄️ ARCHIVED   |
  | purpose         | enum   | 'investment' \| 'business' \| 'personal' \| 'other' | Purpose of Equity Loan       | 🗄️ ARCHIVED   |

  **Note**: Cash equity functionality moved to AI agent conversation analysis

  ---
  🤔 AI-INFERRED FIELDS (NOT IN FORM - DETECTED BY AGENTS)

  Decoupling Detection (AI Agent Analyzes Patterns)

  | Field                  | Type    | Detection Method                          | Purpose                            | When Detected        |
  |------------------------|---------|-------------------------------------------|------------------------------------|--------------------|
  | ownershipIntent        | enum    | Pattern: Single name purchase while married | ABSD optimization detection      | After Gate 2       |
  | spousePropertyStatus   | boolean | AI Question: "Does spouse own property?"   | Decoupling opportunity analysis   | AI Follow-up       |
  | decouplingPurpose      | enum    | AI Analysis of responses                   | Strategy recommendation           | AI Inference       |
  | maritalStatus          | enum    | Inferred from name/purchase patterns       | Eligibility implications          | AI Pattern Match   |
  | previousDecoupling     | boolean | Database check + pattern analysis          | Experience indicator              | Background Check   |

  Property Category Routing (NEW - User selects at Gate 2)

  | Field             | Type | Purpose                                  | Triggers                        |
  |-------------------|------|------------------------------------------|---------------------------------|
  | propertyCategory  | enum | Routes to resale/new_launch/bto/commercial flows | Different field sets per category (commercial → broker) |

  Cash Equity Handling (AI AGENT ONLY - Not a loan type)

  | Field                | Type    | Detection Method                        | Purpose                           | When Detected      |
  |----------------------|---------|------------------------------------------|-----------------------------------|--------------------|
  | cashEquityIntent     | boolean | Keywords: "cash out", "equity loan"     | Route to refinance with cash-out | During AI chat     |
  | equityAmount         | number  | AI Question: "How much equity needed?"  | Determine viability               | AI Follow-up       |
  | cashOutPurpose       | enum    | AI Question: "Purpose of funds?"        | Risk assessment                   | AI Follow-up       |
  | propertyForEquity    | object  | AI gathers property details             | Calculate available equity       | AI Conversation    |

  Commercial Property Handling (SPECIAL ROUTING) - UPDATED 2025-01-09

  | Field                | Type    | When Triggered                          | Action                            | Changes Made       |
  |----------------------|---------|------------------------------------------|-----------------------------------|--------------------|
  | commercialSelected   | boolean | User selects 'commercial' at Gate 0     | Skip to broker after Gate 2       | ✅ Replaced equity_loan |
  | purchaseStructure    | enum    | 'personal' \| 'company'                 | Determines TDSR applicability     | ✅ IMPLEMENTED     |
  | brokerHandoff        | boolean | After basic info collection              | Direct to commercial specialist   | ✅ IMPLEMENTED     |
  | propertyType         | -       | NOT SHOWN for commercial category       | Field hidden conditionally         | ✅ Fixed 2025-01-09 |
  | ipaStatus            | -       | NOT SHOWN for commercial category       | Field hidden conditionally         | ✅ Fixed 2025-01-09 |

  ---
  🤖 AI INSIGHTS & URGENCY MAPPING

  Urgency Profile Fields (COMPUTED - NOT USER INPUT)

  | Field                 | Type                                            | Purpose             | Source                               |
  |-----------------------|-------------------------------------------------|---------------------|--------------------------------------|
  | urgencyProfile.level  | 'immediate' | 'soon' | 'planning' | 'exploring' | Lead prioritization | Calculated from loan-specific fields |
  | urgencyProfile.score  | number (0-20)                                   | Numerical scoring   | Mapped from urgency level            |
  | urgencyProfile.source | string                                          | Traceability        | Which field determined urgency       |
  | urgencyProfile.reason | string                                          | Human explanation   | Why this urgency level               |

  Urgency Calculation Sources

  NEW PURCHASE: purchaseTimeline → urgencyProfile
    'this_month'     → { level: 'immediate', score: 20 }
    'next_3_months'  → { level: 'soon', score: 15 }
    '3_6_months'     → { level: 'planning', score: 10 }
    'exploring'      → { level: 'exploring', score: 5 }

  REFINANCE: lockInStatus → urgencyProfile
    'ending_soon'    → { level: 'immediate', score: 20 }
    'no_lock'        → { level: 'soon', score: 15 }
    'not_sure'       → { level: 'soon', score: 12 }
    'locked'         → { level: 'planning', score: 8 }

  COMMERCIAL: purchaseStructure → urgencyProfile
    'personal'       → { level: 'immediate', score: 19 }
    'company'        → { level: 'immediate', score: 19 }
    (All commercial loans get immediate routing to specialist)

  ---
  💡 TECHNICAL IMPLEMENTATION NOTES (Added 2025-01-09)

  Number Field Validation Fixes
  
  | Issue | Root Cause | Solution | Fields Fixed |
  |-------|------------|----------|--------------|
  | "Invalid input" errors | Empty string → Number('') → 0 → fails min validation | Handle empty as undefined | priceRange, propertyValue, outstandingLoan, monthlyIncome, existingCommitments, currentRate |
  
  IWAA and Joint Application Implementation
  
  | Feature | Rationale | Implementation | Status |
  |---------|-----------|----------------|--------|
  | applicantType field | Singapore norm: joint applications (couples using CPF) | Radio selection at Gate 2, defaults to 'joint' | ✅ IMPLEMENTED |
  | IWAA disclaimer | Banks use Income Weighted Average Age for calculations | Blue info box explaining broker will provide precise calculations | ✅ IMPLEMENTED |
  | Single applicant clarity | Singles >35 only applies to HDB, not private | Removed misleading brackets from single option | ✅ IMPLEMENTED |
  
  Conditional Field Display Logic
  
  | Property Category | propertyType Field | IPA Status Field | Reason |
  |-------------------|-------------------|------------------|--------|
  | resale | ✅ Shown | ✅ Shown | Standard residential flow |
  | new_launch | ✅ Shown (EC/Condo only) | ✅ Shown | New launches are condos/ECs |
  | bto | ✅ Shown | ✅ Shown | HDB BTO flow |
  | commercial | ❌ Hidden | ❌ Hidden | Commercial properties have different approval process |
  
  ---
  🔧 IMPLEMENTATION STATUS SUMMARY

  ✅ FULLY IMPLEMENTED (Updated 2025-01-09)

  - Gate 0: loanType selection ('new_purchase' | 'refinance' | 'commercial')
  - Gate 1: name, email capture  
  - Gate 2: phone + loan-specific fields + property routing
  - Gate 3: Optimization parameters (monthlyIncome, existingCommitments, preferences)
  - Property Category Routing at Gate 2 (resale/new_launch/bto/commercial flows)
  - AI Agent Architecture (replaced n8n processing)
  - Urgency calculation system (updated for commercial routing)

  ✅ COMPLETED BUT ON HOLD

  1. Decoupling Detection Agent (ON HOLD - needs LLM refinement)

  ❌ PLANNED FOR FUTURE

  1. Advanced market data integration
  2. Real-time rate intelligence
  3. LLM-based conversation analysis

  ✅ ARCHITECTURAL CHANGES COMPLETED (2025-01-09)

  1. ✅ Gate 3 Repositioning: From "Financial Profile" → "Optimization Parameters"
  2. ✅ Property Routing: Category selection at Gate 2 (including commercial)
  3. ✅ Decoupling as AI: Removed from form, moved to AI agent detection (ON HOLD)
  4. ✅ Loan Types: new_purchase/refinance/commercial (commercial for direct broker routing)
  5. ✅ Cash Equity: Removed as loan type, handled by AI agents in conversation
  6. ✅ AI Processing Points: After Gate 2 and Gate 3 (commercial routes to broker)

  🎯 IMPLEMENTATION PLAN STATUS - COMPLETED

  1. ✅ Week 1: Gate 3 + Property Routing + Basic AI Architecture - COMPLETED
  2. ✅ Week 2: AI Agents (Situational, Rate Intelligence, Defense, Protection) - COMPLETED  
  3. ✅ Week 3: Integration Testing + Competitive Protection + n8n Removal - COMPLETED

  **All core implementation completed as per MASTER_IMPLEMENTATION_PLAN.md**