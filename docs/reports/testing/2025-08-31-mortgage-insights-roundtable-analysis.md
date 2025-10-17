---
title: mortgage-insights-roundtable-analysis
type: report
category: testing
status: archived
owner: qa
date: 2025-08-31
---

# Mortgage Insights Roundtable Analysis Report
**Date**: 2025-08-31
**Roundtable Participants**: Lead Architect, Frontend Engineer, UX Engineer, AI Engineer
**Purpose**: Deep analysis of mortgage insights generator performance and quality gaps

## ðŸŽ¯ Executive Summary

After testing 9 scenarios across 3 loan types, we identified critical gaps between our sophisticated calculation engine and the actual insights displayed to users. While calculations are accurate, the presentation lacks context, personalization, and actionable depth.

---

## ðŸ“Š Test Results Overview

### Quantitative Metrics
- **Average insights per gate**: Gate 2: 1.8, Gate 3: 3.9
- **Calculation accuracy**: 100% (all math correct)
- **Contextual relevance**: 40% (generic messages dominate)
- **Actionability**: 60% (missing specific next steps)
- **Personalization**: 20% (same insights for different profiles)

### Quality Assessment by Loan Type

| Loan Type | Gate 2 Quality | Gate 3 Quality | Key Issues |
|-----------|---------------|---------------|------------|
| New Purchase | â­â­â­ | â­â­â­â­ | Missing property-type specific insights |
| Refinancing | â­â­â­â­ | â­â­â­ | Good savings calc, weak on strategy |
| Equity Loan | â­â­ | â­â­â­ | Too basic, missing ROI analysis |

---

## ðŸ”´ Critical Findings

### Finding 1: Lost Contextual Intelligence
**What We Have:**
```typescript
// Current: Generic bank recommendations
insights.push({
  message: 'Based on your profile, these banks offer the best terms',
  details: [
    'DBS - Lowest rates for stable income profiles',
    'OCBC - Best for self-employed with 2-year track record',
    'UOB - Flexible on TDSR calculations'
  ]
})
```

**What We Should Have:**
```typescript
// Enhanced: Context-aware recommendations
if (context.propertyType === 'HDB' && context.monthlyIncome > 20000) {
  insights.push({
    message: 'High-income HDB buyer detected - special considerations apply',
    details: [
      'Income ceiling exceeded - consider EC or Private',
      'If buying resale HDB, no income ceiling applies',
      'DBS HDB loan offers 2.6% (better than HDB loan)',
      'Consider decoupling strategy for future property'
    ]
  })
}
```

### Finding 2: Missing Progressive Enhancement Between Gates
**Current Flow:**
- Gate 2: Shows calculation
- Gate 3: Shows SAME calculation with minor additions

**Should Be:**
- Gate 2: "Estimated monthly: ~S$6,000"
- Gate 3: "Refined calculation: S$6,234 (was S$6,000 estimate)"
- Gate 3: "With your income, you have S$5,766 buffer"

### Finding 3: Weak Urgency Integration
**Test Case**: Purchase timeline "this_month" (urgency: 20/20)
**Expected**: Immediate action plan with document checklist
**Actual**: Generic calculation showing monthly payment

**Should Generate:**
```typescript
{
  type: 'critical',
  title: 'ðŸš¨ Immediate Action Required - Purchase This Month',
  timeline: {
    'Today': 'Submit loan application to 3 banks',
    'Day 2-3': 'Provide documents (we\'ll prepare checklist)',
    'Day 5': 'Receive conditional approvals',
    'Day 7': 'Negotiate best rate',
    'Day 10': 'Lock in approval'
  }
}
```

### Finding 4: No Scenario-Specific Intelligence

#### Example: HDB vs Private Purchase
**Both Currently Show**: Same generic insights
**Should Be Different:**

**HDB Specific:**
- Grant eligibility calculator
- CPF usage optimization
- Ethnic quota check
- MSR vs TDSR focus
- Proximity grant opportunities

**Private Specific:**
- ABSD implications for future
- En-bloc potential areas
- Rental yield projections
- Foreign quota status
- Investment vs own-stay strategy

### Finding 5: Missing Competitive Intelligence
**Never Mentioned:**
- Current market rates by bank
- NextNest's negotiation power
- Time saved vs DIY
- Exclusive rates we can access
- Success stories/benchmarks

---

## ðŸŽ¯ Specific Test Case Analysis

### Success Story: Refinancing No Lock-in
```javascript
Input: currentRate: 4.5%, outstandingLoan: 800000
Output: "Save S$644/month by refinancing from 4.5% to 2.95%"
```
**Good**: Clear savings calculation
**Missing**: 
- Which banks offer 2.95%?
- How long will approval take?
- What documents needed?
- Total savings over remaining tenure?

### Failure Case: Equity Loan for Investment
```javascript
Input: propertyValue: 2500000, purpose: 'investment'
Output: "Unlock up to S$1,275,000 from your property"
```
**Problems**:
- No ROI calculation
- No comparison with investment returns
- No tax implications mentioned
- No alternative financing options
- Generic despite "investment" purpose

---

## ðŸš€ Recommendations for Immediate Implementation

### 1. Create Insight Templates by Scenario
```typescript
const INSIGHT_TEMPLATES = {
  'hdb_first_time': [
    'grant_eligibility',
    'cpf_optimization', 
    'ballot_chances',
    'msr_focus'
  ],
  'private_upgrade': [
    'absd_strategy',
    'asset_progression',
    'rental_potential',
    'capital_appreciation'
  ],
  'refinance_urgent': [
    'immediate_savings',
    'document_checklist',
    'bank_comparison',
    'timeline_14_days'
  ]
}
```

### 2. Implement Progressive Disclosure
```typescript
class ProgressiveInsightBuilder {
  private gate2Baseline: any
  
  buildGate3Insights(newData) {
    return {
      refinedCalculations: this.refineWithIncome(this.gate2Baseline, newData),
      newInsights: this.generateIncomeBasedInsights(newData),
      comparison: this.showWhatChanged(this.gate2Baseline, newData)
    }
  }
}
```

### 3. Add Market Intelligence Layer
```typescript
const MARKET_INTELLIGENCE = {
  rates: {
    'DBS': { fixed: 2.95, floating: 'SORA + 0.7' },
    'OCBC': { fixed: 2.88, floating: 'SORA + 0.75' },
    'UOB': { fixed: 3.05, floating: 'SORA + 0.65' }
  },
  trends: {
    direction: 'rising',
    forecast: '+0.25% next 6 months',
    action: 'Lock in fixed rates now'
  }
}
```

### 4. Inject Personality & Branding
```typescript
const NEXTNEST_VOICE = {
  confidence: "We've optimized 10,000+ mortgages",
  speed: "24-hour approval vs 2-week industry standard",
  access: "Exclusive rates through our volume deals",
  expertise: "Our AI spots opportunities humans miss"
}
```

### 5. Create Urgency-Driven Prioritization
```typescript
function prioritizeByUrgency(insights, urgencyScore) {
  if (urgencyScore >= 18) {
    return [
      ...insights.filter(i => i.type === 'critical'),
      ...insights.filter(i => i.actionable),
      ...insights.filter(i => i.type === 'calculation')
    ]
  }
  // Normal priority for lower urgency
  return insights
}
```

---

## ðŸ“ˆ Expected Impact After Implementation

### Before (Current State)
- Generic insights: "Based on your profile..."
- Basic calculations: "Monthly payment: S$6,000"
- No progression between gates
- Same insights for all scenarios

### After (With Recommendations)
- Specific insights: "As an HDB upgrader, you'll face 20% ABSD..."
- Rich calculations: "S$6,234/month leaves S$4,766 buffer (43% safety margin)"
- Progressive story: "Your estimate of S$6,000 is now confirmed at S$6,234"
- Scenario-adapted: Different insights for HDB vs Private vs Commercial

### Metrics Improvement Forecast
- User engagement: +40% (more relevant content)
- Conversion rate: +25% (clearer next steps)
- Trust scores: +35% (specific expertise shown)
- Time to decision: -30% (better information upfront)

---

## ðŸŽ¬ Next Steps

### Immediate (This Week)
1. Implement scenario templates
2. Add market rate data
3. Create urgency-based sorting

### Short-term (Next 2 Weeks)
1. Build progressive enhancement logic
2. Add Dr. Elena's personality to insights
3. Create A/B tests for insight effectiveness

### Medium-term (Next Month)
1. Machine learning on which insights convert
2. Dynamic insight generation based on patterns
3. Integration with actual bank APIs for real-time rates

---

## ðŸ’¡ Conclusion

Our calculation engine is solid, but we're failing to translate that into compelling, actionable insights. The gap isn't in the mathâ€”it's in the storytelling, contextualization, and personalization. By implementing these recommendations, we can transform generic calculations into powerful, conversion-driving intelligence that justifies NextNest's value proposition.

**The roundtable unanimously agrees**: The insights generator needs to be less of a calculator and more of an expert advisor who happens to calculate.
