---
title: field-mapping-original
type: report
category: mappings
status: archived
owner: engineering
date: 2025-09-01
---

📋 COMPREHENSIVE FIELD MAPPING ACROSS ALL GATES (ORIGINAL VERSION - BEFORE ARCHITECTURAL CHANGES)

 🔍 UNIVERSAL FIELDS (ALL LOAN TYPES)

 Gate 0: Loan Type Selection

 | Field    | Type | Schema                                       | Label               | AI Insights                    | Status        |
 |----------|------|----------------------------------------------|---------------------|--------------------------------|---------------|
 | loanType | enum | 'new_purchase' | 'refinance' | 'equity_loan' | Loan Type Selection | ✅ Used for urgency calculation | ✅ IMPLEMENTED |

 Gate 1: Basic Information

 | Field | Type   | Schema                                     | Label         | AI Insights | Status        |
 |-------|--------|--------------------------------------------|---------------|-------------|---------------|
 | name  | string | min(2), max(100), regex(/^[a-zA-Z\s'-]+$/) | Your Name     | ❌ Not used  | ✅ IMPLEMENTED |
 | email | string | email(), toLowerCase(), trim()             | Email Address | ❌ Not used  | ✅ IMPLEMENTED |

 Gate 2: Contact & Core Details

 | Field | Type   | Schema                | Label                  | AI Insights | Status        |
 |-------|--------|-----------------------|------------------------|-------------|---------------|
 | phone | string | regex(/^[689]\d{7}$/) | Singapore Phone Number | ❌ Not used  | ✅ IMPLEMENTED |

 Gate 3: Financial Profile

 | Field               | Type   | Schema               | Label                | AI Insights                | Status            |
 |---------------------|--------|----------------------|----------------------|----------------------------|-------------------|
 | monthlyIncome       | number | min(0), max(9999999) | Monthly Income       | ✅ Used in lead scoring     | ❌ NOT IMPLEMENTED |
 | existingCommitments | number | min(0)               | Existing Commitments | ✅ Used in TDSR calculation | ❌ NOT IMPLEMENTED |

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
 💰 EQUITY LOAN TYPE

 Gate 2: Equity Loan Specific Fields

 | Field           | Type   | Schema                                           | Label                        | AI Insights                    | Status        |
 |-----------------|--------|--------------------------------------------------|------------------------------|--------------------------------|---------------|
 | propertyValue   | number | min(200000), max(20000000)                       | Current Property Value       | ✅ Used in equity calculation   | ✅ IMPLEMENTED |
 | outstandingLoan | number | min(0), max(10000000)                            | Outstanding Mortgage Balance | ✅ Used in available equity     | ✅ IMPLEMENTED |
 | equityNeeded    | number | min(50000), max(3000000)                         | Equity Amount Needed         | ✅ Used in feasibility analysis | ✅ IMPLEMENTED |
 | purpose         | enum   | 'investment' | 'business' | 'personal' | 'other' | Purpose of Equity Loan       | ✅ PRIMARY URGENCY FIELD        | ✅ IMPLEMENTED |

 Additional Schema Fields (NOT IN FORM)

 | Field           | Type   | Schema                                           | Status                     |
 |-----------------|--------|--------------------------------------------------|----------------------------|
 | propertyType    | enum   | 'HDB' | 'EC' | 'Private' | 'Landed'              | ❌ NOT IN FORM              |
 | existingLoan    | number | min(0), max(10000000)                            | ❌ DUPLICATE/DIFFERENT NAME |
 | equityAmount    | number | min(50000), max(3000000)                         | ❌ DUPLICATE/DIFFERENT NAME |
 | repaymentPeriod | enum   | '5_years' | '10_years' | '15_years' | '20_years' | ❌ NOT IN FORM              |
 | monthlyIncome   | number | min(3000), max(100000)                           | ❌ SHOULD BE IN GATE 3      |

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

 EQUITY LOAN: purpose → urgencyProfile
   'investment'     → { level: 'immediate', score: 18 }
   'business'       → { level: 'immediate', score: 18 }
   'personal'       → { level: 'soon', score: 12 }
   'other'          → { level: 'exploring', score: 8 }

 ---
 🔧 IMPLEMENTATION STATUS SUMMARY

 ✅ FULLY IMPLEMENTED

 - Gate 0: loanType selection
 - Gate 1: name, email capture
 - Gate 2: phone + all loan-specific fields per type
 - Urgency calculation system
 - n8n submission at Gates 2 & 3

 ❌ NOT IMPLEMENTED

 - Gate 3: Financial profile fields (monthlyIncome, existingCommitments)
 - Several schema fields not used in actual form
 - Gate 3 form rendering and validation

 ⚠️ INCONSISTENCIES FOUND

 1. Missing Gate 3: Form only renders Gates 1-2, but Gate 3 financial fields are critical
 2. Schema vs Form Mismatch: Many schema fields aren't in the form
 3. Field Name Inconsistencies: equityNeeded vs equityAmount, outstandingLoan vs existingLoan

 🎯 KEY RECOMMENDATIONS

 1. Implement Gate 3: Add financial profile fields to ProgressiveForm.tsx
 2. Clean Up Schemas: Remove unused schema fields or implement missing form fields
 3. Standardize Names: Align field names between schemas and forms
 4. Complete n8n Integration: Ensure all implemented fields reach n8n workflows correctly