# 📋 UX-IMPROVED FIELD MAPPING
**Based on Tech Team Roundtable Recommendations**
**Date: February 9, 2025**

---

## 🎯 CORE CONCEPT: "WHO, WHAT, HOW"
**Simplified 3-Step Journey (Plus Loan Type Selection)**

---

## 📍 STEP 0: LOAN TYPE SELECTION (Before Form)
**Separate Component - Not Part of Form Gates**

| Field    | Type | Schema                                        | Label               | UX Improvement | Status |
|----------|------|-----------------------------------------------|---------------------|----------------|--------|
| loanType | enum | 'new_purchase' \| 'refinance' \| 'commercial' | Choose Your Path    | Visual cards with icons | ✅ IMPLEMENTED |

**UX Changes:**
- Commercial detection triggers quick 5-field form (updated from 4)
- Clear visual distinction between paths with gradient cards
- Immediate value proposition for each type
- Direct broker routing for commercial loans (bypasses AI)

---

## 📍 STEP 1: WHO YOU ARE
**All Contact Information Together**

| Field | Type   | Schema                                     | Label         | UX Improvement | Status |
|-------|--------|--------------------------------------------|---------------|----------------|--------|
| name  | string | min(2), max(100), regex(/^[a-zA-Z\s'-]+$/) | Your Name     | Autofocus on load | 🔄 TO UPDATE |
| email | string | email(), toLowerCase(), trim()             | Email Address | Trust badge: "🔒 Never sold" | 🔄 TO UPDATE |
| phone | string | regex(/^[689]\d{7}$/)                     | Phone Number  | Trust badge: "📞 Broker consultation only" | 🔄 TO MOVE |

**UX Changes:**
- Phone MOVED from Step 2 to Step 1
- Proactive trust signals before each field
- Clear value: "Get instant analysis after this step"
- Progressive value: Welcome message after completion

---

## 📍 STEP 2: WHAT YOU NEED
**Property and Loan Details (Progressive Disclosure)**

### Core Fields (Always Visible First)

| Field            | Type | Schema                                       | Label                 | UX Improvement | Status |
|------------------|------|----------------------------------------------|-----------------------|----------------|--------|
| propertyCategory | enum | 'resale' \| 'new_launch' \| 'bto' \| 'commercial' | Property Category | Visual cards, not dropdown | 🔄 TO UPDATE |
| propertyType     | enum | Conditional based on category               | Property Type         | Only after category selected | ✅ IMPROVED |

### Progressive Fields (Show One at a Time)

| Field            | Type    | Schema                           | Label             | AI Trigger | Show After | Status |
|------------------|---------|----------------------------------|-------------------|------------|------------|--------|
| priceRange       | number  | min(300000), max(5000000)       | Property Price    | ✨ Yes     | propertyType | ✅ IMPROVED |
| combinedAge      | slider  | min(25), max(65), default(35)   | Your Age(s)       | ✨ Yes     | priceRange | 🆕 NEW |
| purchaseTimeline | enum    | 'immediate' \| 'soon' \| 'later' | When Buying?      | ✨ Yes     | combinedAge | ✅ IMPROVED |

**Progressive Disclosure Rules:**
1. Show propertyCategory first (visual cards)
2. After selection → Show propertyType
3. After propertyType → Show priceRange
4. After priceRange → Show combinedAge (slider)
5. After combinedAge → Show purchaseTimeline
6. NEVER show more than 2-3 fields at once

**Instant Value Delivery:**
- After propertyType: "🏠 HDB market: Average 2.8% rates"
- After priceRange: "💰 Estimated monthly: $2,847"
- No bank names, just market aggregates

### Category-Specific Fields (Conditional)

#### For Resale Properties
| Field     | Type | Schema              | Label          | When Shown | Status |
|-----------|------|---------------------|----------------|------------|--------|
| otpStatus | enum | OTP status options  | OTP Status     | After timeline | 🆕 NEW |

#### For New Launch
| Field        | Type   | Schema             | Label         | When Shown | Status |
|--------------|--------|--------------------|---------------|------------|--------|
| launchStatus | enum   | Launch stages      | Launch Stage  | After timeline | 🆕 NEW |
| projectName  | string | Optional text      | Project Name  | After status | 🆕 NEW |

#### For BTO
| Field          | Type   | Schema          | Label            | When Shown | Status |
|----------------|--------|-----------------|------------------|------------|--------|
| btoStage       | enum   | BTO stages      | Application Stage | After timeline | 🆕 NEW |
| completionDate | string | Month picker    | Est. Completion   | After stage | 🆕 NEW |

#### For Commercial (Special Routing)
**Triggers CommercialQuickForm Component - 5 Fields Only:**
| Field | Type   | Schema            | Label         | Purpose | Status |
|-------|--------|-------------------|---------------|---------|--------|
| commercialLoanType | enum | 'new_purchase' \| 'refinancing' | Loan Purpose | Business routing | ✅ IMPLEMENTED |
| name  | string | Required          | Contact Name  | Quick handoff | ✅ IMPLEMENTED |
| email | string | Email validation  | Business Email | Quick handoff | ✅ IMPLEMENTED |
| phone | string | Phone validation  | Contact Number | Quick handoff | ✅ IMPLEMENTED |
| uen   | string | [0-9]{9}[A-Z]     | Company UEN   | Verification | ✅ IMPLEMENTED |

### REFINANCING Fields (Different from New Purchase)

| Field            | Type    | Schema                           | Label                  | AI Trigger | Order | Status |
|------------------|---------|----------------------------------|------------------------|------------|-------|--------|
| currentRate      | number  | min(0), max(10), decimal(2)     | Current Interest Rate  | ✨ Yes     | 1     | 🆕 NEW |
| outstandingLoan  | number  | min(0), max(9999999)            | Outstanding Loan       | ✨ Yes     | 2     | 🆕 NEW |
| currentBank      | dropdown| Bank list                       | Current Bank           | Exclusion  | 3     | 🆕 NEW |
| combinedAge      | slider  | min(25), max(65), default(35)   | Your Age(s)           | ✨ Yes     | 4     | 🆕 NEW |
| lockInStatus     | radio   | Lock-in options                 | Lock-in Status         | Timing     | 5     | 🆕 NEW |
| propertyType     | enum    | 'HDB' \| 'EC' \| 'Private'      | Property Type         | MSR check  | 6     | 🆕 NEW |
| propertyValue    | number  | For cash-out calculation        | Current Value          | Optional   | 7     | 🆕 NEW |

**Note:** combinedAge is REQUIRED for refinancing to calculate remaining tenure (65 - age or 75 - age for private)

---

## 📍 STEP 3: YOUR FINANCES
**Simplified Financial Assessment (Using Step 2's combinedAge for IWAA)**

### For Single Applicant (3 fields)

| Field               | Type   | Schema               | Label                | AI Trigger | Status |
|---------------------|--------|----------------------|----------------------|------------|--------|
| monthlyIncome       | number | min(0), max(9999999) | Monthly Income       | ✨ Yes     | ✅ KEPT |
| monthlyCommitments  | number | min(0), optional()   | Monthly Commitments  | ✨ Yes     | ✅ KEPT |
| employmentType      | enum   | 'employed' \| 'self_employed' | Employment Status | Income recognition | 🆕 NEW |

### For Joint Application (4-5 fields)

| Field             | Type   | Schema                        | Label                   | Purpose | Status |
|-------------------|--------|-------------------------------|-------------------------|---------|--------|
| applicationType   | enum   | 'single' \| 'joint'           | Application Type        | Show joint fields | 🆕 NEW |
| applicant1Income  | number | min(0), max(9999999)          | Primary Applicant Income | IWAA calculation | 🆕 NEW |
| applicant2Income  | number | min(0), max(9999999)          | Co-Applicant Income     | IWAA calculation | 🆕 NEW |
| monthlyCommitments| number | min(0), optional()            | Combined Commitments    | TDSR calculation | ✅ KEPT |
| employmentType    | enum   | 'both_employed' \| 'mixed' \| 'both_self' | Employment Mix | Income recognition | 🆕 NEW |

**Backend Smart Defaults:**
- Uses `combinedAge` from Step 2 for IWAA calculation
- Assumes `propertyCount: 1` (avoid ABSD)
- Assumes `citizenship: 'SC'` for preliminary calc
- Calculates TDSR/MSR using Dr. Elena's formulas

**Value Delivery:**
- After income: "You can afford up to $1.2M property"
- After commitments: "Maximum loan: $900k based on TDSR"
- If joint: "Combined profile allows 28-year tenure"
- Post-submission: "Want more accuracy? [Refine Details]"

---

## 🤖 AI BEHAVIOR IMPROVEMENTS

### Visual AI Indicators

| Field Type | Indicator | Meaning | User Sees |
|------------|-----------|---------|-----------|
| AI-Triggered | ✨ | AI will analyze | "✨ AI will analyze this" |
| Processing | 🔄 | Currently analyzing | "🔄 Comparing 23 banks..." |
| Complete | ✅ | Analysis done | "✅ 3 insights found" |

### Progressive AI Analysis

| Step | Fields Completed | AI Response | Compliance |
|------|------------------|-------------|------------|
| 1 | Email only | Welcome message | No analysis |
| 2 | Property type | Market pulse | Aggregated only |
| 2 | + Price | Preliminary calculation | No bank names |
| 3 | + Income | Affordability analysis | Range only |
| 3 | All fields | Full optimization | Ready for broker |

---

## 🔄 FIELD FLOW IMPROVEMENTS

### Before (Current Issues):
```
Gate 0 → Gate 1 (2 fields) → Gate 2 (7+ fields!) → Gate 3 (5 fields)
         ↑                    ↑                     ↑
         OK                   OVERWHELMING          COMPLEX
```

### After (UX Improved):
```
Loan Type → Step 1 (3 fields) → Step 2 (2-4 visible) → Step 3 (2-3 visible)
    ↑            ↑                    ↑                      ↑
  Separate    Grouped Contact    Progressive            Progressive
```

---

## 📱 MOBILE-SPECIFIC IMPROVEMENTS

### Input Optimizations

| Field Type | Desktop | Mobile | Improvement |
|------------|---------|--------|-------------|
| Numbers | type="number" | inputmode="numeric" | Better keyboard |
| Phone | type="tel" | pattern="[689][0-9]{7}" | Native validation |
| Email | type="email" | autocomplete="email" | Faster entry |
| Currency | Custom formatter | inputmode="decimal" | Decimal keyboard |

### Touch Target Sizes

| Element | Current | Improved | Standard |
|---------|---------|----------|----------|
| Input fields | 36px | 44px | Apple HIG |
| Buttons | 40px | 48px | Material Design |
| Radio/Checkbox | 20px | 44px | WCAG 2.1 |
| Links | Text only | 44px padding | Accessibility |

---

## 🛡️ COMPLIANCE & TRUST MAPPING

### Trust Signals by Step

| Step | Trust Signal | When Shown | Purpose |
|------|--------------|------------|---------|
| 1 | "🔒 Bank-grade encryption" | Before email | Security assurance |
| 1 | "📧 Never sold or shared" | With email field | Privacy promise |
| 2 | "🏦 MAS regulated broker" | After property type | Credibility |
| 2 | "📊 23+ banks compared" | During analysis | Value proposition |
| 3 | "💰 No hidden fees" | Before income | Transparency |
| 3 | "🎯 Personalized strategy" | After submission | Benefit clarity |

### Compliance Requirements

| Data Type | Display Rule | Example | Forbidden |
|-----------|--------------|---------|-----------|
| Interest Rates | Range only | "2.6% - 3.8%" | "DBS: 2.65%" |
| Bank Names | Categories only | "Local banks" | "OCBC offers..." |
| Calculations | Estimates only | "From $2,800/mo" | "Exact: $2,847.32" |
| Advice | Educational only | "Consider fixed rates" | "You should choose..." |

---

## 🔄 MIGRATION NOTES

### Fields to Move
1. **phone**: From Gate 2 → Step 1
2. **applicantType**: Add to Step 2 (after phone)

### Fields to Remove from Form
1. **ownershipStructure**: Now AI-inferred
2. **decouplingIntent**: Now AI-detected
3. **firstTimeBuyer**: Move to optional or AI-inferred

### New Fields to Add
1. **propertyCategory**: Visual selector for property type routing
2. **otpStatus**: For resale properties
3. **launchStatus**: For new launches
4. **btoStage**: For BTO applications
5. **uen**: For commercial quick form

### Progressive Disclosure Rules
1. Max 2-3 fields visible at once in Steps 2-3
2. Show next field only after current is filled
3. Category-specific fields only after category selected
4. Commercial triggers different flow entirely

---

## 📊 EXPECTED IMPROVEMENTS

| Metric | Current | Expected | Improvement |
|--------|---------|----------|-------------|
| Fields visible at once | 7+ | 2-3 | -70% cognitive load |
| Time to first value | 2-3 min | 30 sec | -85% waiting |
| Mobile completion | <20% | >50% | +150% mobile success |
| Field abandonment | High | <10% | -80% abandonment |
| Commercial dead-ends | 100% | 0% | Eliminated frustration |

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Move phone field to Step 1
- [ ] Implement progressive disclosure for Step 2
- [ ] Add property category selector
- [ ] Create commercial quick form
- [ ] Add AI indicator labels
- [ ] Implement trust badges
- [ ] Add contextual loading messages
- [ ] Optimize mobile inputs
- [ ] Add compliance disclaimers
- [ ] Test progressive value delivery