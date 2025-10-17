
# Mortgage Calculations — Cell-by-Cell Computational Guide (Aligned to MAS / HDB / IRAS 2025)

> This reference enables any mortgage agent to replicate every major calculation from the **Annex B – Loan Structuring Worksheet.xlsx** and **RB Repayment Table.xlsx** without Excel.  
> Each computational cell is listed with its purpose, manual formula, and the governing guideline.

---

## 1️⃣ Loan Structuring Worksheet (Annex B)

### Income Recognition & Commitments

| Cell | Label | Formula | Manual Replication | Regulatory Basis |
|------|--------|----------|--------------------|------------------|
| **B3** | Age (Buyer 1) | — | Input borrower age (yrs) | MAS 632 – tenure ≤ age 75 |
| **C3** | Age (Buyer 2) | — | Same as B3 | MAS 632 |
| **B5** | Monthly Basic Salary (B1) | — | Enter fixed monthly pay | MAS 645 § 10(a) |
| **B6** | Annual NOA (B1) | — | Latest IRAS NOA income | MAS 645 § 10(b) |
| **B7** | Variable Income Recognised (B1) | `=(NOA − 12×Basic)×70% ÷ 12` | 70 % of annual variable ÷ 12 | MAS 645 § 10(b) |
| **B8** | Monthly Rental (B1) | — | Input gross rental | MAS 645 § 10(c) |
| **B9** | Recognised Rental Income (B1) | `=B8×70%` | 70 % if ≥ 6 mth lease | MAS 645 § 10(c) |
| **B10** | Total Recognised Income (B1) | `=B5 + B7 + B9` | 100 % basic + 70 % variable/rental | MAS 645 § 10 |
| **C10** | Total Recognised Income (B2) | same as B10 logic | — | — |
| **E10** | Total Household Income | `=B10 + C10` | Sum of borrowers | MAS 645 § 9 |

### Commitments

| Cell | Label | Formula | Manual Replication | Regulatory Basis |
|------|--------|----------|--------------------|------------------|
| **B13** | Credit Card Outstanding | — | Input total balance | MAS 645 § 11 |
| **B14** | Credit Card Monthly Obligation | `=MAX(3%×B13, 50)` | 3 % or $50 min | MAS 645 Annex A Note 3 |
| **B15** | Other Loans (Car/Personal/etc.) | — | Input actual instalments | MAS 645 § 11 |
| **B16** | Guarantor Exposure | — | 20 % of guaranteed loan’s instalment | MAS 645 § 11 note (d) |
| **B17** | Total Monthly Debt | `=SUM(B14:B16)` | Sum all obligations | — |

### IWAA & Tenure Limits

| Cell | Label | Formula | Manual Replication | Regulatory Basis |
|------|--------|----------|--------------------|------------------|
| **E15** | Income‑Weighted Average Age (IWAA) | `=(B3×B10 + C3×C10)/(B10 + C10)` | Σ(Age×Income)/Σ(Income) | MAS 632 para 7 |
| **E16** | Max Tenure (HDB) | `=MIN(75 − E15, 30)` | Lower of 75 – IWAA or 30 yrs | MAS 632 / HDB Loan Guide |
| **E17** | Max Tenure (Private) | `=MIN(75 − E15, 35)` | Lower of 75 – IWAA or 35 yrs | MAS 632 para 7 |
| **E18** | Tenure Allowed (Refinance) | `=MIN(E17, 35 − YearsSincePurchase − 1)` | Cap by years since purchase | MAS 632 para 7 (b) |

### Stress Rate / MSR / TDSR Tests

| Cell | Label | Formula | Manual Replication | Regulatory Basis |
|------|--------|----------|--------------------|------------------|
| **E21** | Stress Rate | — | Use max(package rate, 4%) | MAS 645 Annex A 4 % (Resi), 5 % (Non‑Resi) |
| **E22** | Monthly Instalment (Stress) | `=PMT(E21/12, Tenure×12, LoanAmt)` | EMI at stress rate | MAS 645 Annex A Note 1 |
| **E23** | MSR % | `=E22 / E10` | Instalment ÷ Gross Income ≤ 30 % | MAS 645 § 8(b) / HDB |
| **E24** | TDSR % | `=(E22 + B17)/E10` | (Mortgage + Other Debts) ÷ Income ≤ 55 % | MAS 645 § 8(a) |
| **E25** | Pass/Fail Flag | `=IF(E23≤30%, "MSR Pass", "MSR Fail")` & `IF(E24≤55%, "TDSR Pass", "Fail")` | Text flag logic | — |

### Loan Breakdown / LTV / Cashflow

| Cell | Label | Formula | Manual Replication | Regulatory Basis |
|------|--------|----------|--------------------|------------------|
| **F10** | Purchase Price | — | Enter contract price | IRAS BSD rule: use higher of price or valuation |
| **F11** | Valuation | — | Input bank valuation | MAS 632 § 4(b) |
| **F12** | Loan Amount | — | Target loan | — |
| **F13** | LTV % | `=F12 / MIN(F10, F11)` | Loan ÷ lower of price/valuation | MAS 632 Appendix 2 |
| **F14** | Cash Downpayment (5 % or 10 %) | `=F10×0.05` or `×0.10` | Based on LTV band | MAS 632 / HDB Loan Guide |
| **F15** | BSD | tier formula see § 6 | IRAS BSD calculation | IRAS BSD Schedule |
| **F16** | ABSD | tier formula see § 6 | IRAS ABSD calculation | IRAS ABSD Schedule |

---

## 2️⃣ Repayment Table (Single & Progressive)

### Single — Standard Amortisation

| Cell | Label | Formula | Manual Meaning | Note |
|------|--------|----------|----------------|------|
| **B3** | Loan Amount | — | Input principal (P) | — |
| **B4** | Interest Rate (p.a.) | — | Nominal annual r | — |
| **B5** | Tenure (yrs) | — | Term Y | — |
| **B6** | EMI | `=PMT(B4/12, B5×12, B3)` | Monthly instalment | — |
| **A10** | Month 1 | — | first period | — |
| **B10** | Interest | `=PrevOutstanding×B4/12` | Month’s interest | Standard amortisation |
| **C10** | Principal | `=EMI − Interest` | Principal paid | — |
| **D10** | Balance | `=PrevOutstanding − Principal` | Remaining loan | — |

### Progressive — BUC Staged Disbursement

| Cell | Label | Formula | Manual Meaning | Note |
|------|--------|----------|----------------|------|
| **A5** | Stage % of PP | — | Disbursement ratio | Developer schedule |
| **B5** | Amount Disbursed | `=A5×PurchasePrice` | Cash released at stage | — |
| **C5** | Interest on Stage | `=B5×(Rate/12)` | Interest during construction | — |
| **D5** | Cumulative Interest | `=SUM(C$5:C5)` | Total till this stage | — |
| **E10** | EMI (Full) | `=PMT(Rate/12, Tenure×12, Σ B5)` | Full instalment post‑TOP | — |

---

## 3️⃣ BSD & ABSD Computation (2025 IRAS)

### Buyer’s Stamp Duty (BSD)

| Tier | Bracket | Rate | Incremental Tax |
|------|----------|------|-----------------|
| 1 | 1st $180 000 | 1 % | $1 800 |
| 2 | Next $180 000 | 2 % | $3 600 |
| 3 | Next $640 000 | 3 % | $19 200 |
| 4 | Next $500 000 | 4 % | $20 000 |
| 5 | Next $1.5 m | 5 % | $75 000 |
| 6 | Above $3 m | 6 % | Balance × 6 % |

**Example:** $4 000 000 → BSD = 1 800 + 3 600 + 19 200 + 20 000 + 75 000 + (1 000 000×6 %) = $179 600.

### Additional Buyer’s Stamp Duty (ABSD)

| Profile | 1st Property | 2nd | 3rd + | Entities |
|----------|--------------|------|-------|-----------|
| Singapore Citizen | 0 % | 20 % | 30 % | – |
| Permanent Resident | 5 % | 30 % | 35 % | – |
| Foreigners | 60 % | – | – | – |
| Entities | – | – | – | 65 % |

Compute `=PurchasePrice×Rate` on same base as BSD.

---

## 4️⃣ Equity & Bridging Computation

| Cell | Label | Formula | Manual Meaning | Guideline |
|------|--------|----------|----------------|------------|
| **H3** | Market Value | — | Valuation post‑TOP | MAS 632 |
| **H4** | Outstanding Loan | — | Current loan balance | — |
| **H5** | CPF Used (+ accrued int.) | — | CPF OA used to purchase | CPF Rules |
| **H6** | Max Equity Available | `=H3×75% − H4 − H5` | Cash‑out eligibility | MAS 632 & Bank policy |
| **I3** | Bridging Cash Need | — | Cash shortfall during transition | — |
| **I4** | Max Bridging Loan | `=Min(I3, 0.75×SalePrice − Outstanding)` | Repay within 6 mths | MAS Guidelines on short‑term credit |

---

## 5️⃣ Key Reference Formulas

| Name | Expression | Meaning |
|------|-------------|----------|
| PMT | `=P×i×(1+i)^n / ((1+i)^n−1)` | Monthly instalment for loan P at rate i per mth, n months |
| IWAA | `Σ(Age×Income)/Σ(Income)` | Age weighted by income for tenure limit |
| MSR | `=Instalment ÷ GrossIncome` | ≤ 30 % (HDB/EC Dev) |
| TDSR | `=(Instalment+Debts) ÷ GrossIncome` | ≤ 55 % (all loans) |
| Equity Avail | `=Val×75%−Loan−CPF` | Private cash‑out limit |
| BSD Tier | Piecewise function (see § 3) | Tax on purchase price |

---

## 6️⃣ Compliance Checklist (Agent Quick‑Run)

1. Verify borrower income and commitments.  
2. Compute recognised income per MAS 645.  
3. Apply IWAA → tenure caps (per MAS 632).  
4. Test MSR/TDSR using stress rate (≥ 4 %).  
5. Confirm LTV ≤ 75 %, age ≤ 75 at maturity.  
6. Compute BSD/ABSD (see § 3).  
7. For refinance or equity, re‑run TDSR & claw‑back logic.  
8. Document outputs → LO / law firm instructions.  

---

**Latest Guideline Sources (Checked Oct 2025)**  
- MAS Notice 632 — Residential Property Loans.  
- MAS Notice 645 — Computation of TDSR & Income Recognition Rules.  
- HDB Loan Eligibility Guide (20 Aug 2024 LTV revision).  
- IRAS BSD & ABSD Rates (Feb 2023).  

---
