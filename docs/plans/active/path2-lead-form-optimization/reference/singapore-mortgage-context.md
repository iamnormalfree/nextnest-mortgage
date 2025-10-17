# Singapore Mortgage Context - Path2 Reference

**Source:** Path2 Plan Lines 60-65
**For:** Engineers unfamiliar with Singapore property market

---

## Property Types

### HDB (Housing Development Board)
- **Description:** Public housing built by government
- **Typical Price:** ~$500,000 (Q3 2024)
- **Target Buyer:** First-time buyers, median income households
- **Restrictions:** Income ceiling, citizenship requirements
- **Max LTV:** 85% (first-timers), 75% (subsequent)

### EC (Executive Condominium)
- **Description:** Hybrid public-private housing
- **Typical Price:** ~$850,000 (Q3 2024)
- **Target Buyer:** Middle-income families
- **Restrictions:** Income ceiling $16,000/month, 5-year MOP
- **Max LTV:** 75%

### Private Condominium
- **Description:** Private residential property
- **Typical Price:** ~$1,200,000 (Q3 2024)
- **Target Buyer:** Higher-income households
- **Restrictions:** Minimal (ABSD for foreigners)
- **Max LTV:** 75% (first), 45% (second)

### Landed Property
- **Description:** Terrace, semi-detached, bungalow
- **Typical Price:** ~$2,500,000 (Q3 2024)
- **Target Buyer:** High-net-worth individuals
- **Restrictions:** Foreigners restricted, high ABSD
- **Max LTV:** 75% (first), 45% (second)

---

## Loan Types

### New Purchase
- **Purpose:** Buy new property
- **Common For:** HDB BTO, new launch condos, resale properties
- **Key Fields:** Property price, downpayment, property type

### Refinance
- **Purpose:** Replace existing loan with better terms
- **Common For:** Lower interest rate, shorten tenure, consolidate debt
- **Key Fields:** Outstanding loan, current rate, remaining tenure

### Equity Loan
- **Purpose:** Cash out from property equity
- **Common For:** Renovations, investments, debt consolidation
- **Key Fields:** Property value, outstanding loan, cash needed

---

## Typical Buyer Profile

### Demographics (Q3 2024 Market Data)
- **Age:** 30-40 years old (median first-time buyer: 35)
- **Income:** $5,000-12,000/month (median household: $8,000)
- **Marital Status:** 60% married/joint applicants
- **Property Choice:** 55% HDB, 30% Private, 10% EC, 5% Landed

### Income Mapping by Property Type
```typescript
HDB: $5,000/month median
EC: $8,000/month median
Private: $12,000/month median
Landed: $20,000/month median
```

**Why This Matters for Smart Defaults:**
- HDB buyer earning $3,000/month → Suggest $400k property (not $500k)
- Private buyer earning $6,000/month → Flag affordability issue early

---

## Singapore Mortgage Regulations (MAS)

### TDSR (Total Debt Servicing Ratio)
**Rule:** Monthly debt obligations ≤ 55% of gross income

**Example:**
- Income: $8,000/month
- Max monthly debt: $4,400 (55% × $8,000)
- Includes: Mortgage, car loans, credit cards, personal loans

### MSR (Mortgage Servicing Ratio)
**Rule:** Monthly mortgage ≤ 30% of gross income (HDB/EC only)

**Example:**
- Income: $5,000/month
- Max mortgage payment: $1,500 (30% × $5,000)

### LTV (Loan-to-Value) Limits
**First Property:**
- HDB: 85% (CPF usage) or 75% (bank loan)
- Private: 75%

**Second Property:**
- All types: 45% LTV max

---

## Market Data (Q3 2024)

### Property Prices
| Type | Median Price | Price Range |
|------|--------------|-------------|
| HDB 3-room | $350,000 | $250k-450k |
| HDB 4-room | $500,000 | $400k-650k |
| HDB 5-room | $600,000 | $500k-800k |
| EC | $850,000 | $700k-1.1M |
| Private | $1,200,000 | $800k-2M |
| Landed | $2,500,000 | $1.5M-5M |

### Interest Rates
- **Fixed Rate (2-year):** 2.5-3.0%
- **Variable Rate (SORA):** 2.8-3.2%
- **HDB Loan:** 2.6% (fixed)

### Loan Tenure
- **Most Common:** 25 years
- **Range:** 15-30 years
- **Max:** 35 years or age 65, whichever is earlier

---

## Glossary for Engineers

- **CPF:** Central Provident Fund (Singapore's social security savings)
- **OA:** Ordinary Account (CPF account used for property downpayment)
- **ABSD:** Additional Buyer's Stamp Duty (tax on property purchase)
- **MOP:** Minimum Occupation Period (5 years for HDB/EC)
- **TOP:** Temporary Occupation Permit (new launch completion date)
- **SORA:** Singapore Overnight Rate Average (benchmark interest rate)

**References:**
- MAS Notice 632: https://www.mas.gov.sg/regulation/notices/notice-632
- HDB Loan Eligibility: https://www.hdb.gov.sg/cs/infoweb/residential/financing-a-flat-purchase
