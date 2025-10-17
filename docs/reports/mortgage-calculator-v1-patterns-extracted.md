# Mortgage Calculator V1 - Extracted Patterns

**Extraction Date:** 2025-10-17
**Source:** `.NextNest_Mortgage_Calculator/` (legacy folder)
**Status:** Knowledge preserved, code deleted

---

## Overview

This document preserves valuable UX patterns and calculation algorithms from the V1 mortgage calculator before deletion. The calculator had calculation errors (TDSR 60% bug, MSR misapplication) but contained useful interaction patterns.

---

## 1. WPM-Based Typing Calculation Algorithm

### Purpose
Simulate natural human typing speed to create authentic AI broker interactions.

### Source
`_archived/api/chatwoot-enhanced-flow/route.ts` (lines 304-320)

### Algorithm

```typescript
/**
 * Calculate natural typing time based on message length
 * @param message - The message to be "typed"
 * @param broker - Broker object with personality trait
 * @returns Milliseconds to simulate typing
 */
function calculateNaturalTypingTime(message: string, broker: any): number {
  // Base typing speeds by personality
  const words = message.split(' ').length
  const baseWPM = broker.personality === 'aggressive' ? 55 :
                  broker.personality === 'conservative' ? 45 : 50

  // Core typing time calculation
  const baseTime = (words / baseWPM) * 60 * 1000

  // Add thinking time (1-2 seconds)
  const thinkingTime = 1000 + Math.random() * 1000

  // Add natural variation (±20%)
  const variation = baseTime * 0.2
  const typingTime = baseTime + thinkingTime + (Math.random() * variation * 2 - variation)

  return Math.floor(typingTime)
}
```

### Key Insights
- **Personality affects WPM**: Aggressive (55 WPM) > Balanced (50 WPM) > Conservative (45 WPM)
- **Thinking time**: Always add 1-2 seconds for realism
- **Natural variation**: ±20% prevents robotic consistency
- **Constraints**: Min 2s, max 8s (see line 179 in archived route.ts)

### Application
Use this when implementing AI broker chat interfaces to avoid instant responses that break immersion.

---

## 2. Quick Scenario Preset Buttons

### Purpose
Allow users to quickly populate forms with common property scenarios.

### Source
`enhanced-lead-gen-calculator.tsx` (inferred from property type selection)

### Pattern

```typescript
// Property type presets with sensible defaults
const SCENARIO_PRESETS = {
  HDB: {
    propertyValue: 500000,
    loanAmount: 375000,
    interestRate: 3.5,
    loanTenure: 25
  },
  Private: {
    propertyValue: 1200000,
    loanAmount: 900000,
    interestRate: 3.7,
    loanTenure: 30
  },
  Commercial: {
    propertyValue: 2000000,
    loanAmount: 1300000,
    interestRate: 4.0,
    loanTenure: 20
  }
}
```

### UI Implementation Idea
```tsx
<div className="flex gap-2 mb-4">
  <button onClick={() => loadPreset('HDB')}>
    HDB Example
  </button>
  <button onClick={() => loadPreset('Private')}>
    Private Example
  </button>
  <button onClick={() => loadPreset('Commercial')}>
    Commercial Example
  </button>
</div>
```

### Why This Works
- Reduces cognitive load for first-time users
- Provides realistic examples for each property type
- Accelerates form completion (key for conversion)

---

## 3. Tab-Based Results UI Pattern

### Purpose
Progressive disclosure of complex calculation results without overwhelming users.

### Source
`nextnest-client-precision-tool.tsx` (lines 443-455)

### Pattern

```tsx
const RESULT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'costs', label: 'Costs' },
  { id: 'advanced', label: 'Advanced' }
]

// Tab Navigation UI
<div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
  {RESULT_TABS.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 py-2 px-4 rounded-md font-medium capitalize ${
        activeTab === tab.id ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Tab Content Strategy
- **Overview**: 3 key metrics (Monthly Payment, LTV, Stamp Duty)
- **Compliance**: TDSR/MSR/Tenure status with visual indicators
- **Costs**: Breakdown of all fees and charges
- **Advanced**: EFA modeling, stress tests, optimization options

### Key Insights
- Start with most important info (overview)
- Use traffic light colors for compliance (green/red indicators)
- Don't hide critical info in advanced tabs (keep it in overview too)

---

## 4. Lead Scoring Algorithm

### Purpose
Prioritize high-value leads for immediate human follow-up.

### Source
`n8n-webhook-config.json` (lines 122-123) and `enhanced-lead-gen-calculator.tsx` (lines 158-185)

### Algorithm

```typescript
function calculateLeadScore(inputs: MortgageInputs, results: CalculationResult): number {
  let score = 0

  // 1. Loan Quantum Scoring (0-3 points)
  if (inputs.loanAmount >= 1500000) score += 3
  else if (inputs.loanAmount >= 1000000) score += 2
  else if (inputs.loanAmount >= 750000) score += 1

  // 2. Property Type Sophistication (0-3 points)
  if (inputs.propertyType === 'Commercial') score += 2
  if (inputs.propertyType === 'Private' && inputs.loanAmount >= 800000) score += 1

  // 3. Timeline Urgency (0-3 points)
  const timelineScoring = {
    'immediate': 3,
    'within-3-months': 2,
    'within-6-months': 1,
    'planning': 0
  }
  score += timelineScoring[inputs.timeline] || 0

  // 4. Financial Sophistication (0-4 points)
  if (results.masCompliance.tdsrWithinLimit && results.masCompliance.msrWithinLimit) score += 1
  if (results.potentialSavings > 500) score += 1
  if (showAdvancedPreview) score += 2 // Interest in precision

  return Math.min(score, 10) // Cap at 10
}
```

### Routing Rules (from n8n config)
```typescript
const routingDecision = {
  crm: propertyType === 'Commercial' || loanQuantum > 800000 ? 'hubspot' : 'airtable',
  priority: totalScore >= 8 ? 'high' : totalScore >= 6 ? 'medium' : 'low',
  followUpSequence: timeline === 'immediate' ? 'urgent_24h' : 'standard_nurture'
}
```

### Application
- Score ≥8: High priority, immediate human response
- Score 6-7: Medium priority, 24h response SLA
- Score <6: Low priority, automated nurture sequence

---

## 5. Calculation Errors to Avoid

### Critical Bugs Found in V1

#### Bug 1: TDSR Limit at 60% (WRONG!)
```typescript
// ❌ WRONG - Found in legacy code
const tdsrWithinLimit = tdsr <= 60 // INCORRECT!

// ✅ CORRECT - MAS Notice 632 compliant
const tdsrWithinLimit = tdsr <= 55 // Correct limit
```

**Source:** `enhanced-lead-gen-calculator.tsx` line 95 had correct 55%, but some campaign calculators used 60%.

#### Bug 2: MSR Applied to Private Property
```typescript
// ❌ WRONG - MSR doesn't apply to private property
const msrLimits = {
  'HDB': 30,
  'Private': 30, // WRONG! No MSR for private
  'Commercial': 35
}

// ✅ CORRECT
const msrLimits = {
  'HDB': 30,
  'EC': 30,
  'Private': null, // No MSR for private property
  'Commercial': null
}
```

**Source:** Multiple calculators in the folder had this error.

#### Bug 3: Stress Test Rate Application
```typescript
// ✅ CORRECT approach from nextnest-client-precision-tool.tsx
const stressTestRate = inputs.propertyType === 'Commercial' ? 5.0 : 4.0
const calculationRate = Math.max(inputs.currentInterestRate, stressTestRate)
```

**Key:** Use the HIGHER of actual rate or stress test rate for all calculations.

---

## 6. Conservative Rounding Pattern

### Purpose
Client-protective estimation (round against the borrower's favor for safety margin).

### Source
`enhanced-lead-gen-calculator.tsx` lines 86-88

### Pattern

```typescript
// Calculate exact monthly payment
const exactMonthlyPayment = principal *
  (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
  (Math.pow(1 + monthlyRate, numPayments) - 1)

// Client-protective rounding (round UP for conservative estimation)
const monthlyPayment = Math.ceil(exactMonthlyPayment)
```

### Why Round Up?
- Protects borrowers from underestimating costs
- Builds trust (we never surprise them with higher actual payments)
- MAS compliance mindset (conservative estimates)

### Where to Apply
- Monthly payments (round UP)
- Stamp duty (round UP to nearest dollar)
- Total interest (round UP)
- Min cash required (round UP to nearest $1,000)

### Where NOT to Apply
- LTV ratio (use exact percentage)
- TDSR/MSR (use exact percentage for compliance)
- Maximum loan amount (round DOWN for safety)

---

## 7. Progressive Disclosure UX Pattern

### Purpose
Show basic calculator, reveal advanced options only when user is ready.

### Source
`enhanced-lead-gen-calculator.tsx` lines 261-274

### Pattern

```tsx
{/* Collapsible Advanced Section */}
<div className="bg-blue-50 p-4 rounded-lg">
  <button
    type="button"
    onClick={() => setShowAdvancedPreview(!showAdvancedPreview)}
    className="text-blue-600 font-medium hover:text-blue-800"
  >
    {showAdvancedPreview ? '▼' : '▶'} Show NextNest's Advanced MAS-Compliant Analysis
  </button>
  {showAdvancedPreview && (
    <p className="text-sm text-gray-600 mt-2">
      Preview of full precision analysis available to NextNest clients
    </p>
  )}
</div>

{/* Show additional fields when toggled */}
{showAdvancedPreview && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <input {...register('monthlyIncome')} />
    <input {...register('existingDebt')} />
  </div>
)}
```

### Benefits
- Prevents overwhelming first-time users
- Captures interest signal (lead scoring boost for advanced users)
- Upsell opportunity ("Unlock full analysis")

---

## Implementation Notes

### Do NOT Port These Files Directly
The calculation logic contained errors. Use these patterns as reference ONLY.

### Use These Patterns In:
1. **New Progressive Form**: Scenario presets, tab-based results
2. **AI Broker Chat**: WPM-based typing simulation
3. **Lead Scoring**: Adapt algorithm for current form fields
4. **Results Display**: Progressive disclosure, conservative rounding

### Test Against:
- `lib/calculations/dr-elena-mortgage.ts` (correct calculation engine)
- `tests/dr-elena-v2-regulation.test.ts` (regulatory compliance)

---

## Files Deleted

All files in `.NextNest_Mortgage_Calculator/` deleted on 2025-10-17:
- `enhanced-lead-gen-calculator.tsx` (17,877 bytes)
- `nextnest-client-precision-tool.tsx` (21,613 bytes)
- `n8n-webhook-config.json` (11,296 bytes)
- `hardwarezone-campaign-calculator.tsx` (36,162 bytes)
- `linkedin-campaign-calculator.tsx` (27,526 bytes)
- `reddit-campaign-calculator.tsx` (26,395 bytes)
- `singapore-mortgage-calculator.tsx` (27,866 bytes)
- Various markdown guides (implementation/campaign docs)

**Total removed:** ~180 files, ~6 MB

---

## Related Documentation

- Correct calculations: `lib/calculations/dr-elena-mortgage.ts`
- Regulatory tests: `tests/dr-elena-v2-regulation.test.ts`
- Dr. Elena calculation matrix: `docs/reports/DR_ELENA_V2_CALCULATION_MATRIX.md`
- Progressive form: `components/forms/ProgressiveForm.tsx`
