# Instant Analysis UI Components

**Purpose:** Component implementations for progressive form instant analysis (Step 2 Pure LTV, Step 3 Full Analysis)

**Owner:** Forms domain

**Related Plans:**
- `docs/plans/active/2025-10-19-ui-messaging-strategy-progressive-form.md`
- `docs/plans/active/2025-10-19-step2-instant-analysis-pure-ltv-calculation.md`

**Canonical References:** See `CANONICAL_REFERENCES.md`

---

## Architecture Overview

**Two-Phase Educational Journey:**
- **Step 2:** Property Feasibility (Pure LTV) - NO income data
- **Step 3:** Income Affordability (Full Analysis) - Complete picture

**Discriminator Pattern:**
```typescript
{instantCalcResult?.calculationType === 'pure_ltv' && <PureLtvCard />}
{instantCalcResult?.calculationType === 'full_analysis' && <FullAnalysisCard />}
```

---

## Component 1: InfoTooltip

**Location:** `components/forms/ProgressiveFormWithController.tsx` (inline utility)

**Purpose:** Educational tooltips for LTV, MSR, TDSR, CPF concepts

```typescript
interface InfoTooltipProps {
  children: React.ReactNode
  className?: string
}

function InfoTooltip({ children, className }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <span className={cn("inline-flex items-center relative", className)}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        className="ml-1 text-[#666666] hover:text-[#000000] transition-colors"
        aria-label="More information"
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 p-4 bg-white border border-[#E5E5E5] shadow-lg left-0 top-6">
          <div className="text-sm text-[#666666] leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </span>
  )
}
```

**Design:** Sharp rectangles, Bloomberg colors, accessible

---

## Component 2: PureLtvCard (Step 2)

**Location:** `components/forms/ProgressiveFormWithController.tsx` (inline component)

**Purpose:** Display pure LTV calculation results (property-based only, NO income)

```typescript
interface PureLtvCardProps {
  result: {
    maxLoanAmount: number
    ltvPercentage: number
    downPaymentRequired: number
    cpfDownPayment: number
    cashDownPayment: number
    minCashPercent: number
    maxTenure: number
    effectiveTenure: number
    reasonCodes: string[]
    propertyPrice?: number
  }
  formData: any
}

function PureLtvCard({ result, formData }: PureLtvCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="mt-6 p-8 bg-white border border-[#E5E5E5]">
      {/* Header */}
      <h4 className="text-2xl font-semibold text-[#000000] mb-4">
        Property Feasibility Check
      </h4>

      {/* Max Loan Amount */}
      <div className="text-5xl font-semibold text-[#000000] mb-6 font-mono">
        ${result.maxLoanAmount.toLocaleString()}
      </div>

      {/* Context Explanation */}
      <p className="text-[#666666] text-base mb-8">
        Based on property regulations and LTV limits for your situation.
        {result.reasonCodes.includes('first_property_75_ltv') &&
          " As a first-time buyer, you can borrow up to 75% of the property value."}
        {result.reasonCodes.includes('second_property_45_ltv') &&
          " For a second property, LTV is capped at 45%."}
      </p>

      {/* Toggle Details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-[#666666] hover:text-[#000000] underline text-sm mb-6"
      >
        {showDetails ? 'Hide breakdown' : 'View breakdown'}
      </button>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-[#E5E5E5] space-y-6">
          {/* LTV Calculation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#000000]">
                Maximum Loan (LTV Limit)
                <InfoTooltip>
                  LTV (Loan-to-Value) is the maximum percentage of property value you can borrow,
                  set by MAS regulations. First property buyers can borrow up to 75% of the property price.
                </InfoTooltip>
              </span>
              <span className="text-sm font-mono text-[#000000]">
                ${result.maxLoanAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-[#666666] ml-4">
              {result.ltvPercentage}% of ${result.propertyPrice?.toLocaleString() ?? 'property price'}
            </div>
          </div>

          {/* Down Payment Required */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#000000]">
                Down Payment Required
              </span>
              <span className="text-sm font-mono text-[#000000]">
                ${result.downPaymentRequired.toLocaleString()}
              </span>
            </div>

            {/* CPF/Cash Breakdown */}
            <div className="ml-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#666666]">
                  CPF (OA)
                  <InfoTooltip>
                    You can use CPF funds from your Ordinary Account to pay for part of your down payment,
                    up to 120% of the property valuation limit.
                  </InfoTooltip>
                </span>
                <span className="font-mono text-[#666666]">
                  ${result.cpfDownPayment.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-[#666666]">
                  Cash (minimum {result.minCashPercent}%)
                  <InfoTooltip>
                    MAS requires a minimum percentage to be paid in cash (not CPF).
                    Typically 5% for first property, 10% for reduced LTV, and 25% for second/third properties.
                  </InfoTooltip>
                </span>
                <span className="font-mono text-[#666666]">
                  ${result.cashDownPayment.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tenure Cap */}
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#000000]">
                Maximum Loan Tenure
              </span>
              <span className="text-sm font-mono text-[#000000]">
                {result.effectiveTenure} years
              </span>
            </div>
            <div className="text-xs text-[#666666] ml-4 mt-1">
              Based on your age ({formData.combinedAge}). Loan must end by age 65.
            </div>
          </div>
        </div>
      )}

      {/* Next Step Expectation */}
      <div className="mt-6 p-4 bg-[#F8F8F8] border border-[#E5E5E5]">
        <p className="text-sm text-[#666666]">
          <span className="font-semibold text-[#000000]">Next:</span> We'll check your income
          to confirm you can afford this amount.
        </p>
      </div>
    </div>
  )
}
```

**Key Features:**
- NO mention of income
- Emphasizes property regulations
- Educational tooltips
- Sets expectation for Step 3

---

## Component 3: FullAnalysisCard (Step 3)

**Location:** `components/forms/ProgressiveFormWithController.tsx` (inline component)

**Purpose:** Display full affordability analysis (income + property)

```typescript
interface FullAnalysisCardProps {
  result: {
    maxLoanAmount: number
    tdsrPass: boolean
    msrPass?: boolean
    tdsrUsagePercent: number
    msrUsagePercent?: number
    monthlyPayment: number
    tenure: number
    rate: number
    limitingFactor: 'LTV' | 'TDSR' | 'MSR'
    ltvPercentage: number
    downPaymentRequired: number
    cpfDownPayment: number
    cashDownPayment: number
  }
  formData: any
}

function FullAnalysisCard({ result, formData }: FullAnalysisCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const allChecksPassed = result.tdsrPass && (result.msrPass ?? true)

  return (
    <div className="mt-6 p-8 bg-white border border-[#E5E5E5]">
      {/* Header */}
      <h4 className="text-2xl font-semibold text-[#000000] mb-4">
        Income & Affordability Check
      </h4>

      {/* Final Approved Amount */}
      <div className={cn(
        "p-6 mb-6 border",
        allChecksPassed
          ? "bg-[#F0FDF4] border-[#10B981]"
          : "bg-[#FEF2F2] border-[#EF4444]"
      )}>
        <div className="text-sm mb-2" style={{ color: allChecksPassed ? '#059669' : '#DC2626' }}>
          {allChecksPassed ? 'Approved Loan Amount' : 'Maximum Available Based on Income'}
        </div>
        <div className="text-4xl font-semibold font-mono" style={{ color: allChecksPassed ? '#059669' : '#DC2626' }}>
          ${result.maxLoanAmount.toLocaleString()}
        </div>
        {allChecksPassed && (
          <div className="text-sm mt-2" style={{ color: '#059669' }}>
            ✓ You can borrow the full LTV amount!
          </div>
        )}
      </div>

      {/* MAS Compliance Checks */}
      <div className="space-y-3 mb-6">
        {/* TDSR Check */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-0.5 w-5 h-5 flex items-center justify-center border",
            result.tdsrPass ? "border-[#10B981] text-[#10B981]" : "border-[#EF4444] text-[#EF4444]"
          )}>
            {result.tdsrPass ? '✓' : '✗'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#000000]">TDSR Check</span>
              <InfoTooltip>
                TDSR (Total Debt Servicing Ratio) limits ALL your monthly debt payments
                (mortgage + car loans + credit cards + other debts) to 55% of your gross monthly income.
                Required by MAS for all property loans.
              </InfoTooltip>
            </div>
            <div className="text-xs text-[#666666] mt-1">
              {result.tdsrUsagePercent.toFixed(1)}% of 55% limit {result.tdsrPass ? '(within limit)' : '(exceeded)'}
            </div>
          </div>
        </div>

        {/* MSR Check (if applicable) */}
        {result.msrUsagePercent !== undefined && (
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 w-5 h-5 flex items-center justify-center border",
              result.msrPass ? "border-[#10B981] text-[#10B981]" : "border-[#EF4444] text-[#EF4444]"
            )}>
              {result.msrPass ? '✓' : '✗'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#000000]">MSR Check</span>
                <InfoTooltip>
                  MSR (Mortgage Servicing Ratio) limits your monthly mortgage payment to 30% of your
                  gross monthly income. Applies to HDB and Executive Condominium purchases.
                </InfoTooltip>
              </div>
              <div className="text-xs text-[#666666] mt-1">
                {result.msrUsagePercent.toFixed(1)}% of 30% limit {result.msrPass ? '(within limit)' : '(exceeded)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Payment */}
      <div className="flex justify-between items-center mb-6 pb-6 border-b border-[#E5E5E5]">
        <span className="text-sm text-[#666666]">Estimated Monthly Payment</span>
        <span className="text-lg font-semibold font-mono text-[#000000]">
          ${result.monthlyPayment.toLocaleString()}/mo
        </span>
      </div>

      {/* Toggle Details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-[#666666] hover:text-[#000000] underline text-sm"
      >
        {showDetails ? 'Hide full breakdown' : 'View full breakdown'}
      </button>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-[#E5E5E5] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">LTV Percentage</span>
            <span className="text-sm font-mono text-[#000000]">{result.ltvPercentage}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Down Payment</span>
            <span className="text-sm font-mono text-[#000000]">
              ${result.downPaymentRequired.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">CPF Allowed</span>
            <span className="text-sm font-mono text-[#000000]">
              ${result.cpfDownPayment.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Cash Required</span>
            <span className="text-sm font-mono text-[#000000]">
              ${result.cashDownPayment.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Loan Tenure</span>
            <span className="text-sm font-mono text-[#000000]">{result.tenure} years</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#666666]">Interest Rate (assumed)</span>
            <span className="text-sm font-mono text-[#000000]">{result.rate}%</span>
          </div>

          <div className="pt-4 border-t border-[#E5E5E5]">
            <div className="text-xs text-[#666666]">
              Limiting Factor: <span className="font-semibold">{result.limitingFactor}</span>
              {result.limitingFactor === 'LTV' && ' - Property LTV limits'}
              {result.limitingFactor === 'TDSR' && ' - Total debt servicing capacity'}
              {result.limitingFactor === 'MSR' && ' - Mortgage servicing capacity'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Key Features:**
- Shows income-based affordability
- MAS compliance checks (TDSR/MSR)
- Success/error states
- Limiting factor explanation

---

## Component 4: Error State Components

```typescript
// Missing Step 2 Data
function Step2MissingDataWarning() {
  return (
    <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#F59E0B]">
      <p className="text-sm text-[#000000]">
        ⚠ Please fill in property details to see loan eligibility
      </p>
    </div>
  )
}

// Missing Step 3 Income
function Step3MissingIncomeWarning() {
  return (
    <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#F59E0B]">
      <p className="text-sm text-[#000000]">
        ⚠ Please enter your income to see full affordability analysis
      </p>
    </div>
  )
}

// TDSR/MSR Failure Guidance
function AffordabilityFailureGuidance({
  tdsrFailed,
  msrFailed
}: {
  tdsrFailed: boolean
  msrFailed: boolean
}) {
  return (
    <div className="mt-6 p-4 bg-[#FEF2F2] border border-[#EF4444]">
      {tdsrFailed && (
        <div className="mb-3">
          <p className="text-sm font-semibold text-[#000000] mb-1">
            TDSR Limit Exceeded
          </p>
          <p className="text-xs text-[#666666]">
            Your total monthly debt payments would exceed 55% of your income.
            Consider a lower loan amount or reducing existing commitments.
          </p>
        </div>
      )}

      {msrFailed && (
        <div>
          <p className="text-sm font-semibold text-[#000000] mb-1">
            MSR Limit Exceeded
          </p>
          <p className="text-xs text-[#666666]">
            Your mortgage payment would exceed 30% of your gross income.
            Consider a lower property price or larger down payment.
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## Integration Pattern

**Location:** `components/forms/ProgressiveFormWithController.tsx` (replace lines 948-1011)

```typescript
const renderInstantAnalysis = () => {
  if (!instantCalcResult) return null

  // Check for missing data
  if (currentStep === 2 && !hasRequiredStep2Data()) {
    return <Step2MissingDataWarning />
  }

  if (currentStep === 3 && !formData.actualIncomes?.[0]) {
    return <Step3MissingIncomeWarning />
  }

  // Discriminator-based rendering
  if (instantCalcResult.calculationType === 'pure_ltv') {
    return <PureLtvCard result={instantCalcResult} formData={formData} />
  }

  if (instantCalcResult.calculationType === 'full_analysis') {
    const tdsrFailed = !instantCalcResult.tdsrPass
    const msrFailed = instantCalcResult.msrPass === false

    return (
      <>
        <FullAnalysisCard result={instantCalcResult} formData={formData} />
        {(tdsrFailed || msrFailed) && (
          <AffordabilityFailureGuidance
            tdsrFailed={tdsrFailed}
            msrFailed={msrFailed}
          />
        )}
      </>
    )
  }

  return null
}

// In render JSX:
{renderInstantAnalysis()}
```

---

## Educational Tooltip Content

```typescript
const TOOLTIP_CONTENT = {
  LTV: `LTV (Loan-to-Value) is the maximum percentage of property value you can borrow, set by Singapore banking regulations. First property buyers can borrow up to 75% of the property price.`,

  MSR: `MSR (Mortgage Servicing Ratio) limits your monthly mortgage payment to 30% of your gross monthly income. Applies to HDB and Executive Condominium purchases.`,

  TDSR: `TDSR (Total Debt Servicing Ratio) limits ALL your monthly debt payments (mortgage + car loans + credit cards + other debts) to 55% of your gross monthly income. Required by MAS for all property loans.`,

  CPF_DOWNPAYMENT: `You can use CPF funds (Ordinary Account) to pay for part of your down payment, up to 120% of the property valuation.`,

  MIN_CASH: `MAS requires a minimum percentage to be paid in cash (not CPF). Typically 5% for first property, 10% for reduced LTV, and 25% for second/third properties.`,

  TENURE_CAP: `Loan tenure is capped by the lower of: (1) property type limit (25-35 years), or (2) age limit (must end by age 65).`,

  REDUCED_LTV: `Reduced LTV applies when loan tenure exceeds thresholds (>25 years for HDB, >30 years for others) OR when loan would end after age 65.`,
}
```

---

## Design System Compliance

### Colors
- Monochrome: #000000, #666666, #E5E5E5, #F8F8F8, #FFFFFF
- Semantic: #10B981 (success), #EF4444 (error), #F59E0B (warning)

### Typography
- Headings: font-semibold (600)
- Body: font-normal (400)
- Numbers: font-mono

### Layout
- Sharp rectangles (NO rounded corners)
- 1px borders
- 8px spacing increments

---

## Accessibility Features

- Keyboard navigation (Enter/Space for tooltips)
- ARIA labels on interactive elements
- Color contrast WCAG AA compliant
- Touch targets ≥44px
- Semantic HTML structure

---

## Analytics Events

```typescript
// Step 2 Pure LTV Display
eventBus.publish({
  type: 'ANALYTICS_EVENT',
  payload: {
    event: 'step2_pure_ltv_shown',
    properties: {
      ltv_percentage: result.ltvPercentage,
      max_loan: result.maxLoanAmount,
      property_type: formData.propertyType
    }
  }
})

// Step 3 Full Analysis Display
eventBus.publish({
  type: 'ANALYTICS_EVENT',
  payload: {
    event: 'step3_full_analysis_shown',
    properties: {
      tdsr_pass: result.tdsrPass,
      msr_pass: result.msrPass,
      limiting_factor: result.limitingFactor
    }
  }
})

// Tooltip Engagement
eventBus.publish({
  type: 'ANALYTICS_EVENT',
  payload: {
    event: 'education_tooltip_viewed',
    properties: {
      concept: 'LTV' | 'MSR' | 'TDSR',
      step: currentStep
    }
  }
})
```

---

## Testing Checklist

**Manual Testing:**
- [ ] Step 2 Pure LTV displays correctly
- [ ] Step 3 Full Analysis displays correctly
- [ ] Tooltips work (hover + click)
- [ ] Breakdown expand/collapse works
- [ ] Error states display correctly
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

**E2E Testing:**
- See separate test plan

---

## Future Enhancements

- Link tooltips to full MAS Notice pages
- Visual progress bars for TDSR/MSR usage
- Scenario calculator ("what if" analysis)
- Comparison mode (Step 2 vs Step 3 side-by-side)
