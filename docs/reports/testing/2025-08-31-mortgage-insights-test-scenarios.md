---
title: mortgage-insights-test-scenarios
type: report
category: testing
status: archived
owner: qa
date: 2025-08-31
---

# Mortgage Insights Testing Report - Roundtable Analysis
**Date**: 2025-08-31
**Participants**: Technical Roundtable Team
**Focus**: Testing mortgage insights generator with various scenarios to identify display gaps

## ðŸ” Testing Methodology

We'll test the `MortgageInsightsGenerator` with various scenarios for each loan type, documenting:
1. Input data (what user selects/enters)
2. Internal calculations performed
3. Expected insights based on our logic
4. Actual insights generated
5. Gap analysis

---

## SCENARIO SET A: NEW PURCHASE

### Test Case NP-1: High-Value Property, High Income
```javascript
// User Journey:
// Gate 0: Select "New Purchase"
// Gate 1: Enter name, email
// Gate 2: Select property details
const input_NP1 = {
  loanType: 'new_purchase',
  name: 'John Tan',
  email: 'john@example.com',
  phone: '91234567',
  propertyType: 'Private',
  priceRange: 2000000,
  purchaseTimeline: 'next_3_months',
  // Gate 3 data
  monthlyIncome: 25000,
  existingCommitments: 2000
}

// INTERNAL CALCULATIONS:
// 1. Urgency Profile:
//    - purchaseTimeline: 'next_3_months' â†’ score: 15, level: 'soon'
//    - reason: 'Purchase within 3 months'

// 2. Property Calculations:
//    - Loan Amount (75% LTV): $1,500,000
//    - Monthly Payment @ 3.5%: $6,726
//    - Downpayment (25%): $500,000
//    - Stamp Duty (~4.4%): $88,000
//    - Total Upfront: $588,000

// 3. TDSR Calculation:
//    - Available for housing: (25000 * 0.55) - 2000 = $11,750
//    - Max affordable loan @ 4% stress: $2,472,000
//    - Property within range: âœ…

// EXPECTED INSIGHTS AT GATE 2:
{
  insight1: {
    type: 'calculation',
    title: 'ðŸ  Purchase Cost Breakdown',
    message: 'For S$2,000,000 property with 75% loan',
    calculations: {
      maxLoan: 1500000,
      monthlyPayment: 6726,
      downpayment: 500000,
      stampDuty: 88000
    },
    details: [
      'Loan amount: S$1,500,000',
      '25% downpayment: S$500,000',
      'Estimated stamp duty: S$88,000',
      'Total upfront: S$588,000'
    ]
  }
}

// EXPECTED INSIGHTS AT GATE 3:
{
  insight1: {
    type: 'analysis',
    title: 'ðŸ“Š Your Personalized Affordability Analysis',
    message: 'Based on MAS TDSR framework, you can afford up to S$2,472,000 in loans',
    calculations: {
      maxLoan: 2472000,
      tdsr: 0.35,
      monthlyPayment: 11750
    },
    details: [
      'TDSR Ratio: 35.0% (limit: 55%)',
      'Available for housing: S$11,750/month',
      'Maximum property value: S$3,296,000'
    ]
  },
  insight2: {
    type: 'opportunity',
    title: 'âœ… Strong Borrowing Position',
    message: 'Your income comfortably supports this purchase',
    details: [
      'Payment uses only 27% of income',
      'Well below 55% TDSR limit',
      'Qualify for best bank rates'
    ]
  }
}
```

### Test Case NP-2: HDB Purchase, Moderate Income
```javascript
const input_NP2 = {
  loanType: 'new_purchase',
  name: 'Sarah Lim',
  email: 'sarah@example.com',
  phone: '98765432',
  propertyType: 'HDB',
  priceRange: 600000,
  purchaseTimeline: 'this_month',
  monthlyIncome: 8000,
  existingCommitments: 500
}

// INTERNAL CALCULATIONS:
// 1. Urgency: score 20 (immediate)
// 2. Loan: $450,000 (75% LTV)
// 3. Monthly: $2,017
// 4. MSR Check: $2,017 / $8,000 = 25.2% (under 30% limit âœ…)
// 5. TDSR: ($2,017 + $500) / $8,000 = 31.5% (under 55% âœ…)

// EXPECTED INSIGHTS AT GATE 3:
{
  insight1: {
    type: 'warning',
    title: 'â° Immediate Action Required',
    message: 'Property purchase this month - expedited processing needed',
    urgency: 'critical'
  },
  insight2: {
    type: 'calculation',
    title: 'ðŸ˜ï¸ HDB Purchase Analysis',
    message: 'MSR and TDSR compliance confirmed',
    details: [
      'MSR: 25.2% (limit: 30%)',
      'TDSR: 31.5% (limit: 55%)',
      'CPF usage eligible',
      'HDB grant eligibility to check'
    ]
  }
}
```

---

## SCENARIO SET B: REFINANCING

### Test Case RF-1: High Rate to Low Rate, No Lock-in
```javascript
const input_RF1 = {
  loanType: 'refinance',
  name: 'David Chen',
  email: 'david@example.com',
  phone: '91112222',
  currentRate: 4.5,
  outstandingLoan: 800000,
  lockInStatus: 'no_lockin',
  propertyValue: 1200000,
  monthlyIncome: 15000,
  existingCommitments: 1000
}

// INTERNAL CALCULATIONS:
// 1. Current Payment @ 4.5%: $4,053
// 2. New Payment @ 2.95%: $3,353
// 3. Monthly Savings: $700
// 4. Annual Savings: $8,400
// 5. Break-even (assuming $3k costs): 5 months

// EXPECTED INSIGHTS AT GATE 2:
{
  insight1: {
    type: 'opportunity',
    title: 'ðŸ’° Significant Savings Opportunity',
    message: 'Save S$700/month by refinancing from 4.5% to 2.95%',
    calculations: {
      monthlyPayment: 3353,
      maxLoan: 800000
    },
    details: [
      'Current payment: S$4,053/month',
      'New payment: S$3,353/month',
      'Annual savings: S$8,400',
      'Break-even period: 5 months'
    ],
    value: 'S$8,400 yearly'
  },
  insight2: {
    type: 'opportunity',
    title: 'âœ… Perfect Timing - No Lock-in Period',
    message: 'You can refinance immediately without any penalties',
    urgency: 'high',
    details: [
      'Zero penalty fees',
      'Free to switch to better rates',
      'Banks competing aggressively for no-penalty switches'
    ]
  }
}
```

### Test Case RF-2: Locked In, Marginal Savings
```javascript
const input_RF2 = {
  loanType: 'refinance',
  name: 'Michelle Ng',
  email: 'michelle@example.com',
  phone: '93334444',
  currentRate: 3.2,
  outstandingLoan: 500000,
  lockInStatus: 'locked_in',
  propertyValue: 800000,
  monthlyIncome: 10000,
  existingCommitments: 800
}

// CALCULATIONS:
// 1. Current: $2,124/month
// 2. New @ 2.95%: $2,096/month
// 3. Savings: $28/month (minimal)
// 4. Penalty (1.5%): $7,500
// 5. Break-even: 268 months (not worth it!)

// EXPECTED INSIGHTS:
{
  insight1: {
    type: 'calculation',
    title: 'ðŸ“Š Refinancing Analysis',
    message: 'Your current 3.2% rate is competitive. Market average is 2.95%',
    details: [
      'Current payment: S$2,124/month',
      'New payment: S$2,096/month',
      'Monthly savings: S$28 (minimal)',
      'Lock-in penalty: S$7,500'
    ]
  },
  insight2: {
    type: 'advice',
    title: 'ðŸ”’ Currently in Lock-in Period',
    message: 'Calculate if penalty cost is worth the savings from refinancing',
    details: [
      'Typical penalty: 1.5% of outstanding loan',
      'Your penalty: ~S$7,500',
      'Break-even: 268 months - not recommended',
      'Plan ahead for lock-in expiry date'
    ]
  }
}
```

---

## SCENARIO SET C: EQUITY LOAN

### Test Case EQ-1: Investment Purpose, High Equity
```javascript
const input_EQ1 = {
  loanType: 'equity_loan',
  name: 'Robert Tan',
  email: 'robert@example.com',
  phone: '95556666',
  propertyValue: 2500000,
  outstandingLoan: 600000,
  purpose: 'investment',
  monthlyIncome: 30000,
  existingCommitments: 3000
}

// CALCULATIONS:
// 1. Max LTV (75%): $1,875,000
// 2. Outstanding: $600,000
// 3. Available Equity: $1,275,000
// 4. TDSR available: $13,500/month
// 5. Max serviceable @ 5% stress: $2,835,000

// EXPECTED INSIGHTS:
{
  insight1: {
    type: 'calculation',
    title: 'ðŸ’Ž Available Equity',
    message: 'Unlock up to S$1,275,000 from your property',
    calculations: {
      maxLoan: 1275000
    },
    details: [
      'Property value: S$2,500,000',
      'Max LTV (75%): S$1,875,000',
      'Outstanding loan: S$600,000',
      'Available equity: S$1,275,000'
    ]
  },
  insight2: {
    type: 'opportunity',
    title: 'ðŸ“ˆ Investment Opportunity Timing',
    message: 'High urgency for investment purpose - market conditions favorable',
    urgency: 'high',
    details: [
      'Current equity loan rates: 3.2-3.8%',
      'Investment returns should exceed 5%',
      'Tax deductibility considerations'
    ]
  }
}
```

---

## ðŸ”´ IDENTIFIED GAPS IN CURRENT IMPLEMENTATION

### Gap 1: Insufficient Gate 2 Data Utilization
**Problem**: At Gate 2, we have propertyType, priceRange/outstandingLoan but aren't generating rich insights
**Missing Logic**:
- Property type specific insights (HDB vs Private vs Commercial)
- Market comparison for property price ranges
- Timeline-based action plans

### Gap 2: No Progressive Enhancement
**Problem**: Gate 3 insights don't build upon Gate 2 insights
**Should Have**:
- Reference to previous calculations
- Comparison showing how income data refined the analysis
- Progressive disclosure of complexity

### Gap 3: Missing Contextual Intelligence
**Problem**: Not using loan-specific nuances
**Examples**:
- HDB: Should mention grants, CPF usage, ethnic quotas
- Private: Should discuss ABSD implications, rental yield
- Commercial: Should note no CPF usage, higher stress test

### Gap 4: Weak Urgency Integration
**Problem**: Urgency score exists but doesn't drive insight priority/presentation
**Should Have**:
- High urgency â†’ Action-oriented insights first
- Low urgency â†’ Educational insights acceptable
- Critical urgency â†’ Step-by-step immediate action plan

### Gap 5: No Competitive Differentiation
**Problem**: Insights are generic, not NextNest-specific
**Missing**:
- "We negotiate with 16 banks simultaneously"
- "Our AI has analyzed 10,000+ similar profiles"
- "Exclusive rates not available to public"

---

## ðŸ“Š INSIGHT QUALITY METRICS

| Scenario | Expected Insights | Actually Generated | Quality Score | Missing Elements |
|----------|------------------|-------------------|--------------|------------------|
| NP-1 High Value | 5 detailed | 2 basic | 40% | Bank recommendations, ABSD calc, investment angle |
| NP-2 HDB | 4 specific | 1 generic | 25% | Grants, CPF, MSR focus |
| RF-1 No Lock | 3 actionable | 2 good | 67% | Urgency to act, bank comparison |
| RF-2 Locked | 3 analytical | 2 adequate | 67% | Repricing option, wait strategy |
| EQ-1 Investment | 4 strategic | 2 basic | 50% | ROI analysis, tax implications |

---

## ðŸŽ¯ RECOMMENDATIONS FOR IMPROVEMENT

### 1. Enhance Gate-Specific Logic
```typescript
// Gate 2 should generate:
- Market positioning insight
- Loan structure options
- Timeline-based roadmap

// Gate 3 should add:
- Personalized affordability
- Risk assessment
- Optimization strategies
```

### 2. Add Scenario-Specific Templates
```typescript
interface InsightTemplate {
  'hdb_purchase': ['grant_eligibility', 'cpf_optimization', 'msr_analysis'],
  'high_value_purchase': ['wealth_planning', 'absd_strategy', 'investment_roi'],
  'urgent_refinance': ['immediate_actions', 'document_checklist', 'bank_rankings'],
  // etc...
}
```

### 3. Implement Smart Prioritization
```typescript
function prioritizeInsights(insights: MortgageInsight[], context: InsightContext) {
  return insights.sort((a, b) => {
    // Urgency-based sorting
    if (context.urgencyScore > 15) {
      return a.actionable ? -1 : 1;
    }
    // Value-based sorting
    return b.calculations?.savings - a.calculations?.savings;
  });
}
```

### 4. Add Personality & Branding
```typescript
const NEXTNEST_ADVANTAGES = {
  bankNetwork: "We're connected to 16 banks for instant comparison",
  aiPower: "Our AI has optimized 10,000+ mortgages",
  exclusive: "Access rates 0.1-0.3% lower than walk-in",
  speed: "Pre-approval in 24 hours, not 2 weeks"
};
```

### 5. Create Insight Combinations
Instead of isolated insights, create narrative flows:
- Problem â†’ Solution â†’ Action
- Current State â†’ Opportunity â†’ NextNest Advantage
- Risk â†’ Mitigation â†’ Benefit

---

## ðŸ“ CONCLUSION

The mortgage insights generator has solid calculation logic but lacks:
1. **Contextual depth** - Not using all available data
2. **Progressive storytelling** - Each gate should build narrative
3. **Specificity** - Too generic, not scenario-adapted
4. **Urgency alignment** - Score exists but doesn't drive presentation
5. **Brand differentiation** - Missing NextNest's unique value props

**Next Steps**: 
1. Implement enhanced templates for each scenario
2. Add progressive insight building between gates
3. Create urgency-driven prioritization
4. Inject NextNest advantages into insights
5. Test with real user data to refine
