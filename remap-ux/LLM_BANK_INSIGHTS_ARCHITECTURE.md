# 🤖 LLM BANK INSIGHTS GENERATION ARCHITECTURE
**Real-time Market Intelligence System**
**Date: February 9, 2025**

---

## 📊 SYSTEM OVERVIEW

### **Core Concept**
LLM-powered insights generated from live bank database, updated daily at 9:05 AM SGT (after SORA update at 9:00 AM).

### **Data Flow**
```
Live Bank Database (Airtable/Excel 365)
    ↓ [9:05 AM Daily Cron]
LLM Analysis Engine (GPT-4/Claude)
    ↓ [Generate Insights]
Insights Cache (Redis/PostgreSQL)
    ↓ [API Endpoint]
Progressive Form (Real-time Pull)
```

---

## 🏦 BANK DATABASE SCHEMA

### **Historical Data Tables (For Trend Analysis)**
```typescript
interface HistoricalRateSnapshot {
  snapshotDate: Date                  // Daily snapshot at 9:05 AM
  propertyType: string                 // HDB, EC, Private, Landed
  
  // Aggregated metrics
  metrics: {
    averageRate: number                // Average across all packages
    medianRate: number                 // Median rate
    minRate: number                    // Lowest available
    maxRate: number                    // Highest rate
    packageCount: number               // Total packages available
  }
  
  // Category breakdown
  byCategory: {
    fixed: { avg: number, count: number }
    floating: { avg: number, count: number }
  }
  
  // SORA reference
  soraRate: number                    // SORA rate on this date
  
  // Rate changes
  changesFromPrevious: {
    packagesAdded: number              // New packages introduced
    packagesRemoved: number            // Packages discontinued
    ratesIncreased: number             // Packages with rate hikes
    ratesDecreased: number             // Packages with rate cuts
  }
}

// Store 90 days of history for trend analysis
const HISTORY_RETENTION = 90 // days
```

### **Core Fields**
```typescript
interface BankPackage {
  // Identity
  bankName: string                    // DBS, OCBC, UOB, etc. (16 banks)
  packageName: string                  // e.g., "DBS FHR18"
  lastUpdated: Date                    // Timestamp of last update
  
  // Loan Parameters
  loanQuantumMin: number               // e.g., 100000
  loanQuantumMax: number               // e.g., 5000000
  loanType: 'new_purchase' | 'refinance' | 'both'
  category: 'fixed' | 'floating' | 'hybrid'
  
  // Property Eligibility
  propertyType: string[]               // ['HDB', 'EC', 'Private', 'Landed']
  occupancyType: 'owner' | 'investment' | 'both'
  
  // Interest Rates (%)
  rates: {
    year1: number                      // e.g., 2.65
    year2: number                      // e.g., 2.85
    year3: number                      // e.g., 3.05
    year4: number                      // e.g., 3.25
    year5: number                      // e.g., 3.45
    thereafter: number                 // e.g., 4.25
  }
  
  // Special Features
  features: {
    lockIn: number                     // Years (0 = no lock-in)
    lockInPenalty?: string             // e.g., "1.5% of loan amount"
    clawback: number                   // Years
    legalSubsidy?: number              // Dollar amount
    valuationSubsidy?: boolean         
    freeConversion?: number            // Number of free conversions
    interestOffset?: boolean           // Mortgage-linked account
    partialPrepayment?: string         // Terms
  }
  
  // Constraints
  minLoanTenure?: number               // Years
  maxLoanTenure?: number               // Years
  ageLimit?: number                    // Max age at loan maturity
  citizenshipRequired?: boolean        // Singapore citizens only
  
  // SORA-specific (for floating)
  soraSpread?: number                  // e.g., 0.75 (SORA + 0.75%)
  soraFloor?: number                   // Minimum rate regardless of SORA
}
```

---

## 🎯 LLM-GENERATED INSIGHTS CATALOG

### **1. Market Pulse Insights (Step 2 - Property Type)**
```typescript
interface MarketPulseInsight {
  propertyType: string
  insightType: 'market_pulse'
  content: {
    averageRate: string               // "2.6% - 3.2%"
    trend: 'rising' | 'stable' | 'falling'
    bestCategory: 'fixed' | 'floating'
    topFeature: string                // "No lock-in packages popular"
  }
  confidence: number                  // 0-100
  validUntil: Date                    // Next SORA update
}

// TREND CALCULATION METHODOLOGY:
interface TrendAnalysis {
  // Historical comparison windows
  comparisons: {
    weekOverWeek: number      // Current avg vs 7 days ago
    monthOverMonth: number    // Current avg vs 30 days ago  
    quarterOverQuarter: number // Current avg vs 90 days ago
  }
  
  // Trend determination logic
  trendLogic: {
    rising: "weekOverWeek > 0.05% AND monthOverMonth > 0.10%",
    falling: "weekOverWeek < -0.05% AND monthOverMonth < -0.10%",
    stable: "abs(weekOverWeek) <= 0.05% OR mixed signals"
  }
  
  // Data sources for trend
  dataSources: [
    "Daily SORA rates (MAS API)",
    "Historical package snapshots (stored daily)",
    "Rate change announcements (bank scraping)",
    "Fed rate expectations (market data)"
  ]
}

// Examples with trend context:
"🏠 HDB: Average 2.65-2.95% (↑ 0.15% from last month)"
"🏢 Private: 2.85-3.35% (→ stable for 3 weeks)"
"📉 Market trend: Rates falling - down 0.25% from peak"
```

### **2. Instant Loan Eligibility (Step 2 - After 3 Fields)**
```typescript
interface LoanEligibilityInsight {
  loanAmount: number
  propertyType: string
  age: number
  insightType: 'eligibility'
  content: {
    maxLoan: number
    bestRate: string                  // Range, no bank names
    monthlyPayment: number
    topPackages: number               // Count only
    specialOffers: string[]           // Generic features
  }
}

// Examples:
"💰 You qualify for S$750,000 across 12 packages"
"🎯 Best rates: 2.65-2.85% for your profile"
"✨ 3 banks offering legal subsidy for your range"
```

### **3. Refinancing Savings Analysis**
```typescript
interface RefinancingSavingsInsight {
  currentRate: number
  outstandingLoan: number
  currentBank: string
  insightType: 'refinance_savings'
  content: {
    bestAvailableRate: string         // Excluding current bank
    monthlySavings: number
    lifetimeSavings: number
    switchingCost: number
    breakEvenMonths: number
    topAlternatives: number           // Count of better packages
  }
}

// Examples:
"💰 Save S$456/month with rates from 2.45%"
"📊 14 packages beat your current 3.8% rate"
"⚖️ Break-even in 4 months including switching costs"
```

### **4. Timing Intelligence**
```typescript
interface TimingInsight {
  lockInStatus: string
  insightType: 'timing'
  content: {
    recommendation: string
    urgencyLevel: 'immediate' | 'soon' | 'plan_ahead' | 'wait'
    marketOutlook: string
    riskFactors: string[]
  }
}

// Examples:
"⏰ Perfect timing - rates bottoming out"
"📅 Plan ahead - expect better rates in Q2"
"🔥 Act fast - 3 banks raising rates next week"
```

### **5. Package Optimization (Step 3)**
```typescript
interface PackageOptimizationInsight {
  income: number
  preferences: object
  insightType: 'optimization'
  content: {
    recommendedCategory: 'fixed' | 'floating'
    matchScore: number                // How well packages match preferences
    topFeatures: string[]
    tradeoffs: string[]
    specialEligibility: string[]      // Special schemes qualified for
  }
}

// Examples:
"🎯 Fixed 2-year packages match your stability preference"
"💡 Your income qualifies for premium banking benefits"
"🏆 Consider packages with free conversions given market volatility"
```

---

## 🔄 CRON JOB ARCHITECTURE

### **Daily Update Process (9:05 AM SGT)**
```typescript
interface DailyInsightGeneration {
  schedule: "5 9 * * *"  // 9:05 AM daily
  steps: [
    {
      name: "Fetch SORA",
      action: "Pull latest SORA from MAS API",
      timeout: 30
    },
    {
      name: "Update Database",
      action: "Sync Airtable/Excel with latest rates",
      timeout: 60
    },
    {
      name: "Generate Base Insights",
      action: "LLM analyzes all packages",
      prompts: string[]  // See prompt templates below
      timeout: 300
    },
    {
      name: "Cache Results",
      action: "Store in Redis with 24hr TTL",
      timeout: 30
    },
    {
      name: "Notify Status",
      action: "Send success/failure notification",
      timeout: 10
    }
  ]
}
```

### **LLM Prompt Templates**

#### **Market Analysis Prompt (With Trend Detection)**
```
You are a Singapore mortgage expert analyzing bank packages.
Current SORA: {sora_rate}
Date: {current_date}

CURRENT PACKAGES DATA:
{current_packages_json}

HISTORICAL CONTEXT:
- 7 days ago: Average {property_type} rate was {week_ago_rate}%
- 30 days ago: Average {property_type} rate was {month_ago_rate}%
- 90 days ago: Average {property_type} rate was {quarter_ago_rate}%
- SORA trend: {sora_trend_description}

TREND ANALYSIS REQUIRED:
1. Calculate rate change percentages for each period
2. Determine trend direction using these rules:
   - RISING: Week-over-week increase >0.05% AND month-over-month >0.10%
   - FALLING: Week-over-week decrease >0.05% AND month-over-month >0.10%
   - STABLE: Changes within ±0.05% OR conflicting signals

3. Identify trend drivers:
   - SORA movements impact on floating packages
   - Bank competition (new packages or rate cuts)
   - Regulatory changes (if any)
   - Market sentiment shifts

4. Generate insights:
   - Average rate ranges by property type (no bank names)
   - Trend direction with supporting data
   - Momentum indicator (accelerating/decelerating)
   - Forward outlook based on patterns

Output format: JSON with trend confidence (0-100)
Compliance: Never mention specific bank names in insights
```

#### **Package Comparison Prompt**
```
Compare packages for:
- Loan amount: {loan_amount}
- Property type: {property_type}
- Exclude bank: {current_bank}

Generate:
1. Count of eligible packages
2. Best rate range available
3. Average savings potential
4. Common beneficial features

Constraints:
- Aggregate data only
- No specific bank identification
- Ranges instead of exact rates
```

---

## 🚀 IMPLEMENTATION TASKS

### **Phase 1: Database Setup**
```typescript
// Task A: Create Airtable/Excel 365 Schema
const setupDatabase = {
  platform: 'Airtable', // or 'Excel365'
  tables: [
    'bank_packages',      // Main package data
    'sora_history',       // Historical SORA rates
    'insights_cache',     // Generated insights
    'update_log'          // Cron job history
  ],
  api: {
    endpoint: '/api/bank-data',
    authentication: 'Bearer token',
    rateLimit: 100  // requests per minute
  }
}
```

### **Phase 2: LLM Integration**
```typescript
// Task B: Setup LLM Analysis Engine
const llmConfig = {
  provider: 'OpenAI', // or 'Anthropic'
  model: 'gpt-4-turbo',
  temperature: 0.3,    // Lower for consistency
  maxTokens: 2000,
  
  endpoints: {
    marketAnalysis: '/api/insights/market',
    eligibility: '/api/insights/eligibility',
    refinancing: '/api/insights/refinance',
    optimization: '/api/insights/optimize'
  }
}
```

### **Phase 3: Cron Job Setup**
```typescript
// Task C: Implement Daily Update Job
const cronJob = {
  platform: 'n8n', // or 'GitHub Actions', 'Vercel Cron'
  schedule: '5 9 * * *',
  
  workflow: [
    'fetchSoraRate',
    'updateBankDatabase',
    'generateMarketInsights',
    'generateEligibilityTemplates',
    'cacheResults',
    'notifyCompletion'
  ],
  
  errorHandling: {
    retries: 3,
    backoff: 'exponential',
    alerting: 'email + slack'
  }
}
```

### **Phase 4: API Integration**
```typescript
// Task D: Create Form API Endpoints
const apiEndpoints = {
  // Real-time insight fetching
  GET: {
    '/api/insights/market/:propertyType': 'Get market pulse',
    '/api/insights/eligibility': 'Calculate eligibility',
    '/api/insights/refinance': 'Analyze refinancing',
    '/api/insights/optimize': 'Optimize package selection'
  },
  
  // Caching strategy
  cache: {
    provider: 'Redis',
    ttl: 86400, // 24 hours
    invalidateOn: ['SORA_UPDATE', 'MANUAL_REFRESH']
  }
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Database & Infrastructure**
- [ ] Setup Airtable/Excel 365 with bank packages schema
- [ ] Create API access for database
- [ ] Implement rate limiting and security
- [ ] Setup Redis cache for insights
- [ ] Configure backup and recovery

### **LLM Integration**
- [ ] Setup OpenAI/Anthropic API access
- [ ] Create prompt templates for each insight type
- [ ] Implement prompt versioning system
- [ ] Add response validation and sanitization
- [ ] Setup fallback for LLM failures

### **Cron Job System**
- [ ] Configure n8n/GitHub Actions for daily updates
- [ ] Implement SORA rate fetching from MAS
- [ ] Add comprehensive error handling
- [ ] Setup monitoring and alerting
- [ ] Create manual trigger option

### **API Development**
- [ ] Create insight fetching endpoints
- [ ] Implement caching layer
- [ ] Add rate limiting per client
- [ ] Setup authentication/authorization
- [ ] Create webhook for real-time updates

### **Form Integration**
- [ ] Update ProgressiveForm.tsx to fetch insights
- [ ] Add loading states during fetch
- [ ] Implement fallback for API failures
- [ ] Add insight refresh capability
- [ ] Create insight display components

---

## 🔒 COMPLIANCE & SECURITY

### **Data Protection**
- No storage of specific bank-customer relationships
- Aggregated insights only, no individual rates
- PDPA compliant data handling
- Encrypted API communications

### **MAS Compliance**
- No specific rate promises
- Educational content only
- Clear disclaimers on all insights
- Broker consultation for final rates

### **Security Measures**
- API key rotation monthly
- Rate limiting per endpoint
- Input sanitization for LLM prompts
- Output validation before display
- Audit logging for all operations

---

## 📊 MONITORING & METRICS

### **System Health**
```typescript
const monitoring = {
  uptime: {
    target: 99.9,
    measure: 'API availability'
  },
  freshness: {
    target: '< 24 hours',
    measure: 'Insight age'
  },
  accuracy: {
    target: '> 95%',
    measure: 'Rate range correctness'
  },
  performance: {
    target: '< 200ms',
    measure: 'API response time'
  }
}
```

### **Business Metrics**
- Insight engagement rate
- Conversion improvement
- User satisfaction scores
- Broker feedback quality

---

## 🚦 ROLLOUT PLAN

### **Phase 1: MVP (Week 1)**
- Basic database with 5 banks
- Manual insight generation
- Static rate ranges

### **Phase 2: Automation (Week 2)**
- Daily cron job setup
- LLM integration for 5 banks
- Basic caching

### **Phase 3: Full Scale (Week 3)**
- All 16 banks integrated
- Complete insight types
- Production caching

### **Phase 4: Optimization (Week 4)**
- Performance tuning
- Advanced insights
- A/B testing

---

**END OF DOCUMENT**