# Dr Elena v2 Calculation Matrix

> Audit mapping of persona computational modules to implementation plan requirements

## LTV & Tenure Triggers

### Individual Borrower LTV Limits (Source: computational_modules.ltv_limits.individual_borrowers)

| Loan Count | Base LTV | Reduced LTV | Min Cash Base | Min Cash Reduced | Trigger Conditions |
|------------|----------|-------------|---------------|------------------|-------------------|
| First loan | 75% | 55% | 5% | 10% | Tenure > 25y (HDB) OR > 30y (non-HDB) OR loan end age > 65 |
| Second loan | 45% | 25% | 25% | N/A | Same tenure/age triggers apply |
| Third+ loan | 35% | 15% | 25% | N/A | Same tenure/age triggers apply |

**Implementation Mapping**: Step 2 LTV segmented control should default to 75% with 55% adjacent option. Need to implement reduced LTV logic when tenure/age triggers detected.

### Tenure Rules by Property Type

| Property Type | Max Tenure | Age Trigger | Special Rules |
|---------------|------------|-------------|--------------|
| HDB (concessionary) | 25 years | > 65 at loan end | MSR applies, 0% cash downpayment |
| HDB (bank loan) | 30 years | > 65 at loan end | MSR applies |
| EC | 35 years | > 65 at loan end | MSR applies only for developer sale |
| Private | 35 years | > 65 at loan end | No MSR |
| Commercial | 35 years | > 65 at loan end | No CPF, 5% stress test rate |

**Implementation Mapping**: Need tenure validation in Step 3, with age-based LTV reduction logic.

## CPF & Cash Requirements

### Rounding Rules (Source: computational_modules.rounding_rules)

- **Loan Eligibility**: ROUND DOWN to nearest thousand (protect from over-borrowing)
- **Funds Required**: ROUND UP to nearest thousand (ensure sufficient funds)
- **Monthly Payments**: ROUND UP to nearest dollar (conservative estimation)
- **Percentages**: 2 decimal places

### CPF Usage Limits

| Limit Type | Value | Description |
|------------|-------|-------------|
| Withdrawal Limit | 120% | Of property valuation/purchase price |
| Valuation Limit | Lower of valuation or purchase price | At time of purchase |
| Post-120% Rule | Cash servicing required | Once limit reached |

**Implementation Mapping**: Step 2 instant analysis should show CPF vs cash breakdown with proper rounding. Need CPF usage validation for property types.

## TDSR/MSR Formulas & Floors

### Core Formulas

- **TDSR**: `(Recognized_Income × 0.55) - Total_Commitments`
- **MSR**: `Recognized_Income × 0.30` (HDB/EC developer sale only)
- **Stress Test Rates**: 4.0% for residential, 5.0% for non-residential

### Income Recognition Rates

| Income Type | Recognition Rate | Documentation Required |
|-------------|------------------|---------------------|
| Fixed income | 100% | 3 months payslips + employment letter |
| Variable income | 70% | 2 years NOA or 12 months payslips |
| Self-employed | 70% | Latest 2 years NOA |
| Rental income | 70% | ≥6 months tenancy |

**Implementation Mapping**: Step 3 income panel needs employment type selectors with recognition rate application. Commitment calculations need credit card/inclusion formulas.

## Refinance Data Points Analysis

### Present Refinance Logic
- **Objectives**: Lower payment, shorten tenure, rate certainty ✅
- **Cash-out**: Private property only, equity term loan calculation ✅
- **Timing Guidance**: Months remaining on package ✅
- **Owner vs Investment**: Toggle for advisory logic ✅

### Missing Refinance Data Points
- **Monthly Savings Calculation**: Not explicitly defined in persona
- **Break-even Analysis**: Moving cost vs monthly savings
- **Penalty Calculations**: Lock-in penalty formulas
- **Property Use Impact**: Owner-occupied vs investment LTV differences

**Implementation Gap**: Need to capture cash-out constraints and servicing rules from persona, but monthly savings calculation will require additional business logic.

## Edge Clauses & Special Cases

### Self-Employed Recognition
- 70% income recognition with 2 years NOA documentation
- **Implementation**: Employment type switch revealing business age/NOA fields

### Variable Income Handling
- 70% recognition rate configurable
- **Implementation**: Optional variable income field with comma formatting

### Cash-out Constraints
- Private property only (post-TOP)
- Maximum tenure 35 years with age rules
- Cash servicing only (no CPF for installments)
- **Implementation**: Property type validation and cash-out eligibility checks

### Age & Tenure Interaction
- Income-Weighted Average Age (IWAA): `(Σ Age_i × Income_i) / (Σ Income_i)`
- Rule to nearest integer
- **Implementation**: Multi-borrower age calculation for LTV triggers

## Commitment Calculations

### Standard Formulas
- **Credit Cards**: `MAX(Outstanding_Balance × 0.03, 50)` per card
- **Overdraft**: `Facility_Limit × 0.05`
- **Guarantor**: `Guaranteed_Amount × 0.20`
- **Existing Mortgages**: Actual payment at stress test rate

**Implementation Mapping**: Step 3 liabilities checklist with structured fields applying these formulas.

## Open Questions for Implementation

1. **Refinance Monthly Savings**: Should use interest rate differential calculation or fixed formula?
2. **Early Repayment Penalties**: Not defined in persona - should we assume standard lock-in penalties?
3. **BUC Progressive Payments**: Persona has detailed schedule but spec only mentions "optional context"
4. **EFR (Eligible Financial Assets)**: Persona has detailed pledge/show fund calculations but not in current implementation plan
5. **Multi-borrower Calculations**: Persona describes combined vs individual assessment - is this needed for current scope?

## Implementation Priority Matrix

| Feature | Persona Coverage | Implementation Plan Priority | Notes |
|---------|------------------|----------------------------|-------|
| LTV calculation logic | ✅ Complete | HIGH | Core instant analysis |
| TDSR/MSR formulas | ✅ Complete | HIGH | Step 3 compliance |
| CPF usage rules | ✅ Complete | HIGH | Down payment breakdown |
| Income recognition | ✅ Complete | MEDIUM | Employment type selectors |
| Refinance objectives | ✅ Complete | MEDIUM | Objectives panel |
| Cash-out calculations | ✅ Complete | LOW | Private property gating |
| EFR pledge/show funds | ✅ Complete | NOT IN SCOPE | Future enhancement |
| Progressive payments | ✅ Complete | NOT IN SCOPE | Future BUC feature |

## Conclusion

The Dr Elena v2 persona provides comprehensive calculation rules that align well with the Step 2/3 implementation plan. Key gaps identified around refinance monthly savings calculations and early repayment penalties. The persona's emphasis on rounding rules, income recognition, and age/tenure triggers must be faithfully implemented in the calculator modules.

**Next Steps**: Annotate implementation plan with specific persona section references, create test fixtures from test scenarios, and implement calculator module with persona-aligned constants.
