# Instant Calculation UI Strategy v2
**Goal**: Motivate form completion while paving a warm hand-off to AI + human brokers through credible MAS-compliant insights

**Date**: 2025-10-13
**Status**: Signed off for implementation

---

## Executive Summary

This iteration reframes instant calculations around the progressive form funnel. Step 2 shows motivating estimates using minimal inputs, Step 3 upgrades to precise MAS-compliant analysis when financial data is available, and the CTA stays consultative to nurture the transition from AI broker to human broker. New purchase borrowers see an estimated loan range centred on the 75 % LTV target with copy explaining that TDSR/MSR can confirm or limit that leverage. Refinancing borrowers see current vs estimated payments, monthly savings, and remaining-tenure savings grounded in their bank, rate, and outstanding balance. A backend offers service supplies non-identifying deviated-rate ranges (e.g., “banks offering 2.55 %–2.70 %”) so the UI remains compliant while the AI/human broker discloses specifics during consultation. Analytics combine funnel completion, tier engagement, and broker feedback so we can iterate quickly after the Tier 2 launch.

---

## Current State Analysis

### Available Calculation Functions

**`lib/calculations/mortgage.ts`**
- `calculateMortgage()` – monthly payment, total interest, total payment.
- `calculateSingaporeMetrics()` – TDSR, MSR, LTV compliance checks.
- `calculateMortgageWithMetrics()` – combined calculation returning compliance judgments.
- `calculateLeadScore()` – lead quality scoring (0–100).
- `calculateInstantEligibility()` – maximum loan amount, down payment, estimated monthly payment, required monthly income, LTV ratio.
- `calculateRefinancingSavings()` – current vs new monthly payment, monthly/annual/lifetime savings, break-even months, refinancing recommendation.

**`lib/calculations/dr-elena-mortgage.ts`**
- `calculateMaxLoanAmount()` – MAS-compliant output covering max loan, LTV penalties, monthly and stress-test payments, TDSR/MSR usage, down payment, CPF allowance, stamp duty, tenure bounds, reasoning, and compliance flags.
- `calculateRecognizedIncome()` – MAS Notice 645 income recognition including haircut rules.
- `calculateTDSR()` / `calculateMSR()` – detailed ratio calculations with stress testing.
- `calculateIWAA()` – income-weighted average age for joint applicants.
- `calculateStampDuty()` – BSD + ABSD calculation.

### Current UI Display

**File**: `components/forms/SophisticatedProgressiveForm.tsx` (existing Step 2 block)

```typescript
{showInstantCalc && instantCalcResult && (
  <div className="mt-6 p-4 bg-gold/10 border border-gold/20">
    <h4 className="text-sm font-medium text-ink mb-2 flex items-center">
      <Sparkles />
      <span className="ml-2">Instant Analysis</span>
    </h4>
    <div className="space-y-2">
      {(selectedLoanType === 'new' || selectedLoanType === 'new_purchase') && instantCalcResult.maxLoan && (
        <p className="text-sm text-graphite">
          Maximum Loan: <span className="font-mono font-medium">${instantCalcResult.maxLoan.toLocaleString()}</span>
        </p>
      )}

      {selectedLoanType === 'refinance' && instantCalcResult.monthlySavings && (
        <p className="text-sm text-graphite">
          Monthly Savings: <span className="font-mono font-medium text-emerald">${instantCalcResult.monthlySavings.toLocaleString()}</span>
        </p>
      )}
    </div>
  </div>
)}
```

### Gaps Observed
- Only a single metric appears per journey, so the borrower never sees down payment, tenure, or compliance context.
- No progressive unlocking or urgency signals to motivate Step 3 completion.
- MAS compliance cues and CTA guidance are absent.

These shortcomings drive the upgraded tiered experience described below.

---

## Progressive Funnel Overview

### Step 1 – Contact Capture
- Fields: name, email, phone
- Output: teaser that hints at personalized analysis once property details are shared
- CTA tone: advisory (“Continue to see what banks could offer you”)

### Step 2 – Property or Loan Context (Tier 2 output)
- **New purchase** (required fields): property category, property type, price range. Optional box: development name + payment scheme for launch/B U C buyers. Output: loan-range card (e.g., “$325K–$375K”) linked to 75 % LTV with explainer text (“Actual LTV depends on your TDSR/MSR”). Down-payment and monthly-instalment ranges help them plan, while optional launch details feed the broker without adding friction.
- **Refinancing** (required fields): current bank, current rate, outstanding loan, property type, lock-in status. Helper text clarifies which rate to enter; no hard validations block progress. Output: current vs estimated payment, monthly savings, and “≈$XX,XXX over the next Y years,” where Y defaults to 20 until tenure data is provided. Lock-in status drives urgency copy. “Banks currently offering X %–Y %” is sourced from the offers service while excluding the borrower’s current bank.

### Step 3 – Financial Detail (Tier 3 output)
- **New purchase**: capture each borrower’s income, commitments, employment status, plus an optional “special circumstances” text field (new job, probation, commission-heavy). Dr. Elena’s stack calculates recognized income, TDSR/MSR, tenure limits, funds required, and pledge/show-fund guidance. When ratios allow 75 % leverage, the UI shows a “✓ 75 % LTV secured” badge; otherwise we show the achievable LTV and recommend actions (reduce commitments, pledge/show funds) rather than generic “earn more” advice.
- **Refinancing**: capture each borrower’s age, primary goal (lower rates, lower payments, cash out, decoupling, shorten tenure, other), and only ask for income/employment if circumstances changed. Recalculate tenure via IWAA and TDSR to confirm feasibility. Savings panel adjusts based on goal (e.g., highlight total-interest reduction for lower rates, five-year vs full-tenure cashflow improvement for lower payments).
- **CTA**: “Review these results with our AI broker for next steps.” Summary payload (loan type, rates, goals, optional notes) is passed verbatim to the AI broker console.

---

## Instant Calculation Details

### New Purchase Panels
- **Tier 2**: Loan range (65%–75% LTV) plus down-payment/instalment ranges, with optional note if launch details provided (“Our broker will prep for The Lakegarden Residences”).
- **Tier 3**: MAS-compliant eligibility card listing max loan, funds required, stamp duty, tenure limits, TDSR/MSR usage, and pledge/show-fund recommendations when ratios block 75 %.

```
┌────────────────────────────────────────┐
│ ⚡ Instant Analysis Unlocked            │
├────────────────────────────────────────┤
│ Based on current mortgage trends:      │
│                                        │
│ • Avg new purchase rate: 2.8%          │
│ • Avg refinancing savings: $340/mo     │
│                                        │
│ Complete Step 2 to see YOUR            │
│ personalized analysis →                │
└────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────┐
│ ⚡ Your Personalized Analysis                       │
├────────────────────────────────────────────────────┤
│ Maximum Loan Amount                                │
│ $750,000                [75% LTV]                   │
│                                                    │
│ Estimated Monthly Payment                          │
│ $2,800/mo               [@ 2.8% interest]          │
│                                                    │
│ Down Payment Required                              │
│ $250,000                [25% down]                 │
│ ├─ Cash required: $50,000 (5%)                     │
│ └─ CPF allowed: $200,000                           │
│                                                    │
│ ✓ MAS-compliant loan structure                     │
│                                                    │
│ 💡 Complete Step 3 to unlock:                      │
│    • TDSR/MSR compliance check                     │
│    • Stamp duty calculation                        │
│    • 23 bank comparisons                           │
└────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────┐
│ ⚡ Complete Eligibility Analysis                    │
├────────────────────────────────────────────────────┤
│ Maximum Loan Amount                                │
│ $680,000                [TDSR-limited]             │
│                                                    │
│ Your TDSR Usage                                    │
│ 52.3% / 55%             [✓ MAS-compliant]          │
│                                                    │
│ Your MSR Usage (HDB)                               │
│ 28.7% / 30%             [✓ Within limit]           │
│                                                    │
│ Total Funds Required                               │
│ $370,000                                           │
│ ├─ Down payment: $320,000                          │
│ ├─ Stamp duty (BSD): $43,600                       │
│ └─ Legal/admin: ~$6,400                            │
│                                                    │
│ Loan Approval Probability                          │
│ 87%                     [High confidence]          │
│                                                    │
│ ═══════════════════════════════════════            │
│                                                    │
│ 🎯 NEXT STEP: AI Broker Consultation               │
│                                                    │
│ Our AI broker can help you:                        │
│ • Compare 23 banks (real-time rates)               │
│ • Find hidden discounts (~0.2% rate reduction)     │
│ • Navigate HDB/CPF rules                           │
│ • Process application in 14 days                   │
│                                                    │
│ [Connect with AI Broker Now]                      │
└────────────────────────────────────────────────────┘
```

### Refinancing Panels
- **Tier 2**: current vs estimated payment, monthly savings, break-even, remaining-tenure savings, and lock-in urgency messaging. Rate helper ensures users enter the correct figure without blocking progress.
- **Tier 3**: goal-specific copy (e.g., lower rates emphasises total interest saved and cash rebate impact; lower payments shows tenure extension trade-off; cash out highlights available equity). Savings line reads “≈$XX,XXX over the next Y years,” and shows a five-year view when appropriate.

```
┌────────────────────────────────────────────────────┐
│ ⚡ Your Refinancing Opportunity                     │
├────────────────────────────────────────────────────┤
│ Current Monthly Payment                            │
│ $3,200/mo               [@ 3.5% interest]          │
│                                                    │
│ New Monthly Payment (est.)                         │
│ $2,850/mo               [@ 2.6% interest]          │
│                                                    │
│ Monthly Savings                                    │
│ $350/mo                 [🔥 11% reduction]         │
│                                                    │
│ Lifetime Savings                                   │
│ $84,000                 [over 20 years]            │
│                                                    │
│ Break-even Period                                  │
│ 9 months                [recover refinancing cost] │
│                                                    │
│ ✓ Highly recommended (>$150/mo savings)            │
│                                                    │
│ ⏰ Lock-in rates ending? Complete Step 3 now!       │
└────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────┐
│ ⚡ Complete Refinancing Analysis                    │
├────────────────────────────────────────────────────┤
│ Your Potential Savings                             │
│                                                    │
│ Monthly:    $420/mo     [13% reduction]            │
│ Annual:     $5,040/yr   [One extra month free]     │
│ Lifetime:   $100,800    [over 20 years]            │
│                                                    │
│ Break-even: 7 months    [Fast payback]             │
│                                                    │
│ Your TDSR Usage (after refi)                       │
│ 48.2% / 55%             [✓ Improved by 6%]         │
│                                                    │
│ ⏰ TIMING URGENCY                                   │
│ • Your lock-in ends in 3 months                    │
│ • Current rates: 2.5-2.8% (historically low)       │
│ • Processing takes ~14 days                        │
│                                                    │
│ ═══════════════════════════════════════            │
│                                                    │
│ 🎯 RECOMMENDED ACTION                              │
│                                                    │
│ Connect with our AI broker to:                     │
│ • Lock in current rates before they rise           │
│ • Navigate repricing penalties                     │
│ • Compare 23 banks instantly                       │
│ • Maximize your $100K savings                      │
│                                                    │
│ [Connect with AI Broker Now]                      │
└────────────────────────────────────────────────────┘
```

**Psychological effects**:
- Tier 1 teaser sparks curiosity and sets expectation of value for Step 2.
- Tier 2 highlights tangible outcomes early, building urgency and trust while previewing locked metrics.
- Tier 3 delivers completion satisfaction, confirms MAS compliance, and positions the AI broker CTA as the natural next step.

### Offers Service
- Internal API aggregates deviated-rate ranges per borrower profile (property type, loan quantum, refinancer vs new purchase) while filtering out the borrower’s current bank. UI displays “Banks currently offering 2.55 %–2.70 %” and leaves exact deviated rates for broker negotiation.

---

## Analytics & Success Metrics

### Funnel Metrics
- Step completion (1→2, 2→3, submission)
- Time-on-Step 2 (target +15–30 seconds)
- Return rate after viewing Tier 2 panel

### Engagement Metrics
- Events for tier renders, helper expansions, optional field engagement, CTA clicks
- Segmented dashboards for new purchase vs refinancing journeys
- Targets: Instant calc view rate ≥ 95 %, CTA click rate ≥ 60 %, return visitor rate (abandon then return) ≥ 20 %

### Broker Feedback Loop
- AI broker console prompts for: “Were instant figures accurate?”, “Missing data at hand-off?”, “Did rate ranges help?”
- Tagging feeds weekly reviews with product and operations teams

### Targets
- Form completion ≥ 65 %
- Step 2→3 progression ≥ 80 %
- AI broker chat initiation ≥ 75 % of completed forms
- Broker accuracy satisfaction ≥ 90 %

---

## Implementation Phases

### Phase 1 – Tier 2 MVP
- Extend `useProgressiveFormController` so `calculateInstant()` returns tiered payloads for both journeys. Add enhanced metrics (monthly payment, CPF vs cash split) when running `calculateInstantEligibility()`.

```typescript
if (mappedLoanType === 'new_purchase') {
  const eligibility = calculateInstantEligibility(...)

  const monthlyPayment = calculateMonthlyPayment(
    eligibility.maxLoanAmount,
    2.8, // market rate estimate
    25 // standard tenure
  )

  result = {
    ...eligibility,
    monthlyPayment: monthlyPayment.monthlyPayment,
    cpfAllowed: eligibility.downPayment * 0.8,
    cashRequired: eligibility.downPayment * 0.2,
    tier: hasTDSRData ? 3 : 2
  }
}
```

- Build monochrome `InstantAnalysisDisplay` housing `TierOneTeaser`, `TierTwoPartialAnalysis`, and `TierThreeFullAnalysis` components.
- Emit baseline analytics (tier viewed, CTA clicked) and compile the broker summary payload at hand-off.

### Phase 2 – Refinancing Urgency & Offers Service
- Detect urgency signals when refinancing: lock-in ending soon, current rate > 3.5 %, savings > $300/mo, or break-even < 12 months.

```typescript
const urgencySignals = {
  lockInEndingSoon: fields.lockInStatus === 'ending_soon',
  highCurrentRate: fields.currentRate > 3.5,
  significantSavings: result.monthlySavings > 300,
  fastBreakEven: result.breakEvenMonths < 12
}

if (Object.values(urgencySignals).some(Boolean)) {
  banners.push(<UrgencyBanner signals={urgencySignals} />)
}
```

- Expose internal offers endpoint returning deviated-rate ranges filtered by borrower profile and excluding the borrower’s current bank.
- Surface the “Banks currently offering X %–Y %” banner once the endpoint is live; log impressions and interactions.

### Phase 3 – Tier 3 Precision Rollout
- When income + commitments are present, run Dr. Elena’s stack: TDSR/MSR, IWAA, pledge/show-funds guidance, and tenure recommendations.

```typescript
if (fields.monthlyIncome && fields.existingCommitments !== undefined) {
  const tdsrCalc = calculateTDSR(
    fields.monthlyIncome,
    fields.existingCommitments || 0,
    result.monthlyPayment,
    fields.propertyType
  )

  result.tdsr = tdsrCalc
  result.tier = 3
}
```

- Animate locked metrics: `TDSR Compliance`, `Stamp Duty Calculation`, `23 Bank Comparisons` display as 🔒 until Step 3 data is entered.
- Add conditional copy for 75 % LTV confirmation vs reduced LTV with concrete guidance (reduce commitments, pledge/show funds).
- Expand analytics to capture Tier 3 interactions, helper expansions, and broker feedback tags.

### Phase 4 – Post-Launch Iteration
- Review funnel + engagement dashboards weekly; compare against targets and flag regressions quickly.
- Partner with brokers on accuracy feedback; adjust helper text, data prompts, or calculations accordingly.
- Prepare Variant testing (see A/B section) once metrics stabilise and Success targets are trending in range.

---

## A/B Testing Approach

- **Variant A – Baseline**: existing single-metric panel, no urgency, no progressive unlocking.
- **Variant B – Enhanced Metrics (recommended control)**: Tier 2 panel shows three to four key metrics, MAS compliance indicator, and “Complete Step 3 to unlock” list with soft CTA.
- **Variant C – Aggressive Urgency**: builds on Variant B with prominent urgency banners, countdown timers for expiring lock-ins, animated counters, and a stronger CTA (“Claim your $84K savings now”).
- Launch with Variant B; run targeted A/B (B vs C) on refinancing funnel once Tier 2 metrics stabilise so urgency tactics can be validated where they’re most natural.

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Savings line overstates benefit for serial refinancers | Frame as “≈$XX,XXX over the next Y years” and add five-year figure when highlighting lower payments |
| Borrowers input promotional lock-in rate | Inline helper text clarifies rate choice; AI broker double-checks during conversation |
| Optional context fields reduce completion | Keep optional boxes collapsible with clear “Help our broker prepare (optional)” label |
| Offers data drifts from market | Ops refresh rate ranges daily; broker feedback tags highlight discrepancies |

---

## Technical Considerations

### Performance
- Calculations are pure TypeScript functions and complete in under 10 ms; no additional API latency for Tier 1/2.
- Progressive rendering keeps UI responsive: show panel shell immediately, hydrate metrics as soon as calculations resolve.

### Data Requirements
- **Tier 2 (New purchase)**: property type, price or price range, combined age (or primary applicant age).
- **Tier 2 (Refinancing)**: property type, current bank, current rate, outstanding loan amount, lock-in status.
- **Tier 3 (Both)**: Tier 2 fields plus monthly income per borrower and existing commitments (default to 0 allowed).

### Error Handling
- If inputs are incomplete or invalid, fall back to previous tier and show helper copy rather than an error wall.
- Sentry log on calculation exceptions; surface a generic “We’re recalculating your figures” message to borrowers.
- Lock metric tiles remain disabled until required data is present, preventing partial or misleading MAS compliance indicators.

---

## Missing Fields Analysis

- **Refinancing schema gaps** (`mortgage-schemas.ts` lines 89-95): `lockInStatus`, `propertyValue`, `refinanceReason`, `remainingTenure` exist in schema but never surfaced in UI.
- **Multi-applicant inputs** (Dr. Elena stack): `actualAges`, `actualIncomes`, and secondary applicant commitments never render, blocking IWAA accuracy today.
- **Conditional property fields** (`form-config.ts` lines 157-194): `getVisibleFields()` is defined but unused; BTO (`btoProject`, `flatType`, `grantAmount`, `firstTimer`), launch (`developmentName`, `unitType`, `topDate`, `paymentScheme`), and resale (`purchaseTimeline`, `firstTimeBuyer`) prompts remain dormant.

**Recommendation**: defer activating these fields until post-launch. Current input set is enough to drive compelling instant calculations, keeps the form lean, and allows AI broker follow-up to collect edge-case data. Log opportunities in the backlog and revisit once telemetry proves uplift.

---

## Next Steps

1. Finalise Tier 2 build (calculations, panels, telemetry) and push to staging.
2. Run Playwright regression plus manual MAS-compliance spot checks before opening the staging link.
3. Stand up offers-range endpoint with current-bank exclusion rules; wire the Tier 3 banner once responses are verified.
4. Layer Tier 3 MAS outputs after Tier 2 metrics confirm uplift; expand analytics + broker feedback loop in the same release.
5. Launch dashboards for product + broker leads and capture learnings for the Week 6 report.

---

## Summary

The v2 strategy turns instant calculations into a trust-building journey: Step 2 hooks borrowers with credible ranges, Step 3 proves MAS compliance or guides them toward pledge/show-fund solutions, and the AI broker invitation remains advisory to preserve a comfortable path to human consultation. Coordinated analytics and broker feedback ensure we can refine the experience rapidly after launch.
