# 🤖 AI Agent Testing Guide

## Overview
This guide explains how to test the AI agents implemented for NextNest's intelligent mortgage form system.

## Available AI Agents

### 1. **SituationalAnalysisAgent** 
- Analyzes OTP urgency for new purchases
- Evaluates payment scheme options
- Assesses lock-in timing for refinancing
- Generates urgency scores and action items

### 2. **RateIntelligenceAgent**
- Provides market phase analysis (without specific rates)
- Recommends package types (fixed/floating/hybrid)
- Analyzes bank categories (local/foreign/digital)
- Generates timing recommendations

### 3. **DynamicDefenseAgent** ✅ NEW
- **Client Profile Analysis**
  - Risk profile (conservative/moderate/aggressive)
  - Financial strength assessment
  - Sophistication level detection
  - Urgency evaluation
- **Multi-Layer Strategy**
  - Immediate actions (within days)
  - Short-term plan (30 days)
  - Long-term strategy
- **Broker Consultation Priming**
  - Customized consultation briefs
  - Expected questions preparation
  - Closing strategies

### 4. **CompetitiveProtectionAgent** ✅ NEW
- Detects competitor signals
- Gates sensitive information
- Monitors suspicious sessions
- Implements rate limiting

## Testing Methods

### Method 1: Command Line Testing
```bash
# Simple test with formatted output
npx tsx scripts/test-agents-simple.ts

# Comprehensive test with all scenarios
npx tsx scripts/test-ai-agents.ts
```

### Method 2: Visual HTML Interface
```bash
# Start dev server if not running
npm run dev

# Open in browser
http://localhost:3000/test-ai-agents.html
```

### Method 3: Direct API Testing
```typescript
// Example in your code
import { DynamicDefenseAgent } from '@/lib/agents/dynamic-defense-agent'

const agent = new DynamicDefenseAgent()
const testData = {
  loanType: 'new_purchase',
  monthlyIncome: 8000,
  riskTolerance: 'conservative',
  // ... other fields
}

const profile = await agent.analyzeClientProfile(testData)
const strategy = await agent.generateDefenseStrategy(testData, profile)
console.log(strategy)
```

## Test Scenarios Included

### 1. First-Time HDB Buyer (Urgent)
- Conservative profile
- OTP expiring this month
- Tests urgency detection and stability recommendations

### 2. High Net Worth Refinancing
- Aggressive investor profile
- Lock-in ending soon
- Tests rate optimization strategies

### 3. BTO Application (Planning)
- Moderate risk profile
- 3-6 month timeline
- Tests planning phase recommendations

### 4. Commercial Property
- Business owner profile
- Tests commercial routing to broker

### 5. Competitor Detection
- Tests protection mechanisms
- Information gating demonstration

## Sample Outputs

### Client Profile Analysis
```
Risk Profile: conservative
Financial Strength: moderate
Sophistication: medium
Urgency: immediate
Priorities: [stability, certainty, long-term planning]
```

### Defense Strategy
```
Primary Strategy: Fixed Rate Security Strategy
Description: Lock in certainty with competitive fixed rates
Advantages:
  • Complete payment certainty
  • Protection from rate increases
  • Simplified budgeting

Risk Mitigation:
  ⚠️ OTP Expiry Risk (HIGH)
  → Apply to multiple banks simultaneously
```

### Multi-Layer Strategy
```
Immediate Actions:
  • Secure pre-approval from preferred banks
  • Lock in rate indications where possible

Short-term (30 days):
  • Execute primary strategy within 30 days
  • Monitor market for optimization opportunities

Long-term:
  • Build relationship for future refinancing
  • Plan prepayment strategy for interest savings
```

### Competitive Protection
```
Normal User: ✅ LEGITIMATE
  - Full access to insights
  - Complete rate intelligence
  - Defense strategies enabled

Competitor Detected: 🚨 RESTRICTED
  - Generic information only
  - Rate details hidden
  - Session monitored
```

## Key Features Demonstrated

1. **Intelligent Profiling**: Automatically assesses client sophistication and risk appetite
2. **Contextual Strategies**: Different approaches for conservative vs aggressive profiles
3. **Urgency-Based Actions**: Prioritizes actions based on timeline (OTP, lock-in, etc.)
4. **Security**: Protects sensitive information from competitors
5. **Broker Integration**: Prepares consultation briefs for smooth handoff

## Customization

To test with your own data, modify the test scenarios in:
- `scripts/test-agents-simple.ts` - For quick testing
- `scripts/test-ai-agents.ts` - For comprehensive testing
- `public/test-ai-agents.html` - For visual testing

## Validation Checklist

✅ **Client Profile Detection**
- [ ] Risk profile matches input preferences
- [ ] Financial strength calculated correctly
- [ ] Urgency level appropriate for timeline

✅ **Strategy Generation**
- [ ] Primary strategy aligns with profile
- [ ] Alternatives provided for flexibility
- [ ] Risk mitigation addresses key concerns

✅ **Broker Preparation**
- [ ] Consultation brief includes key points
- [ ] Expected questions are relevant
- [ ] Closing strategy matches urgency

✅ **Protection Mechanisms**
- [ ] Competitors detected accurately
- [ ] Information properly gated
- [ ] Session monitoring active

## Troubleshooting

If agents return undefined or errors:
1. Check that all required fields are provided
2. Verify enum values match exactly (case-sensitive)
3. Ensure monthlyIncome is a number, not string
4. Check TypeScript compilation: `npx tsc --noEmit`

## Next Steps

After testing, integrate the agents into:
1. `components/forms/IntelligentMortgageForm.tsx`
2. `components/forms/SimpleAgentUI.tsx`
3. `app/api/forms/analyze/route.ts`

Remove n8n dependencies and use local agent processing as demonstrated in the tests.