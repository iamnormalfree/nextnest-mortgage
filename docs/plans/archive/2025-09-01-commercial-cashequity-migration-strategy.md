---
title: commercial-cashequity-migration-strategy
status: archived
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Historical plan archived for reference. Use `/response-awareness` if resurrecting.

# Commercial Property, Cash Equity & Migration Strategy

## 1. 🏢 COMMERCIAL PROPERTY ROUTING

### Loan Type Selection (Gate 0)
```typescript
type LoanType = 'new_purchase' | 'refinance' | 'commercial'
// Commercial added back but with special routing
```

### Commercial Property Detection & Routing

#### If Commercial Selected at Gate 0:
```typescript
const handleCommercialSelection = async () => {
  // Immediate routing decision
  const commercialFlow = {
    gate0: "commercial",
    gate1: {
      // Still collect name/email for lead capture
      collectBasicInfo: true,
      showCommercialNotice: true
    },
    gate2: {
      // Ask ONE key question
      purchaseStructure: 'personal' | 'company',
      // Then route to broker
      skipRemainingGates: true
    }
  }
  
  // Display message
  return {
    title: "Commercial Property Specialist Required",
    message: "Commercial property purchases require specialized assessment",
    subMessage: "Our licensed brokers will help determine:",
    points: [
      "Whether to buy under personal name (TDSR applies) or company (no TDSR)",
      "Optimal financing structure for tax efficiency",
      "Bank selection based on commercial lending criteria",
      "Special commercial loan packages and rates"
    ],
    cta: "Connect with Commercial Specialist"
  }
}
```

#### Simplified Commercial Flow:
```
Gate 0: Select "Commercial" 
  ↓
Gate 1: Name + Email (for lead capture)
  ↓
Gate 2: Single Question - "Buying as individual or company?"
  ↓
IMMEDIATE BROKER ROUTING (Skip Gate 3)
```

### Commercial Category in Property Routing
```typescript
// If new_purchase selected but property is commercial
interface PropertyCategoryRouting {
  propertyCategory: 'resale' | 'new_launch' | 'bto' | 'commercial'
  
  // If commercial selected during new_purchase flow
  if (propertyCategory === 'commercial') {
    return {
      alert: "Switching to Commercial Flow",
      action: redirectToCommercialFlow(),
      skipCurrentPath: true
    }
  }
}
```

---

## 2. 💰 CASH EQUITY HANDLING (AI AGENT)

### Not a Loan Type, But AI-Recognized Intent

#### CashEquityDetectionAgent Implementation:
```typescript
class CashEquityDetectionAgent {
  // Keywords that trigger cash equity detection
  private cashEquitySignals = [
    'cash out', 'equity loan', 'term loan', 
    'cash from property', 'unlock equity',
    'borrow against property', 'property as collateral'
  ]
  
  detectCashEquityIntent(userInput: string): boolean {
    return this.cashEquitySignals.some(signal => 
      userInput.toLowerCase().includes(signal)
    )
  }
  
  async handleCashEquityInquiry(context: any) {
    // AI responds intelligently
    return {
      detected: true,
      response: "I see you're interested in unlocking cash from your property.",
      questions: [
        "Is this for an existing property you own?",
        "What's the approximate value of your property?",
        "How much equity do you need to unlock?",
        "What's the purpose of the funds?"
      ],
      routing: {
        // Route to refinance flow with cash-out option
        suggestedFlow: 'refinance',
        withCashOut: true,
        alternativeProducts: [
          'Term loan against property',
          'Overdraft facility',
          'Refinance with cash-out'
        ]
      },
      brokerHandoff: {
        specialist: 'equity_release_specialist',
        priority: 'high',
        context: 'Client interested in equity release options'
      }
    }
  }
}
```

### Integration with Main AI Agents:
```typescript
// In SituationalAnalysisAgent
class SituationalAnalysisAgent {
  private cashEquityAgent = new CashEquityDetectionAgent()
  
  async analyze(userData: any) {
    // Check for cash equity intent in any user input
    if (this.cashEquityAgent.detectCashEquityIntent(userData.freeText)) {
      const cashEquityResponse = await this.cashEquityAgent.handleCashEquityInquiry(userData)
      
      return {
        ...standardAnalysis,
        specialIntent: cashEquityResponse,
        recommendedAction: 'Redirect to refinance with cash-out option'
      }
    }
  }
}
```

---

## 3. 📊 MIGRATION PLAN FOR EXISTING EQUITY_LOAN DATA

### Current State Analysis
```sql
-- Identify existing equity_loan records
SELECT COUNT(*) as total_equity_loans,
       AVG(loan_amount) as avg_loan_amount,
       COUNT(DISTINCT user_id) as unique_users
FROM loan_applications 
WHERE loan_type = 'equity_loan'
```

### Migration Strategy

#### Phase 1: Data Preservation (Week 1)
```typescript
// 1. Create backup table
CREATE TABLE legacy_equity_loan_backup AS 
SELECT * FROM loan_applications 
WHERE loan_type = 'equity_loan'

// 2. Add migration flags
ALTER TABLE loan_applications 
ADD COLUMN migration_status VARCHAR(50) DEFAULT NULL,
ADD COLUMN original_loan_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN migrated_at TIMESTAMP DEFAULT NULL
```

#### Phase 2: Data Transformation (Week 1-2)
```typescript
const migrateEquityLoanData = async () => {
  const equityLoans = await db.query(`
    SELECT * FROM loan_applications 
    WHERE loan_type = 'equity_loan'
  `)
  
  for (const loan of equityLoans) {
    // Analyze loan purpose and amount
    const migrationStrategy = determineMigrationStrategy(loan)
    
    if (migrationStrategy.type === 'refinance_with_cashout') {
      await db.update({
        id: loan.id,
        loan_type: 'refinance',
        additional_fields: {
          cash_out_amount: loan.equity_needed,
          cash_out_purpose: loan.purpose,
          original_type: 'equity_loan'
        },
        migration_status: 'migrated_to_refinance',
        migrated_at: new Date()
      })
    } else if (migrationStrategy.type === 'commercial') {
      await db.update({
        id: loan.id,
        loan_type: 'commercial',
        additional_fields: {
          commercial_purpose: loan.purpose,
          financing_type: 'equity_release'
        },
        migration_status: 'migrated_to_commercial',
        migrated_at: new Date()
      })
    }
  }
}
```

#### Phase 3: User Communication (Week 2)
```typescript
const notifyAffectedUsers = async () => {
  const affectedUsers = await getEquityLoanUsers()
  
  for (const user of affectedUsers) {
    await sendEmail({
      to: user.email,
      subject: "Important: Updates to Your Loan Application",
      template: 'equity_loan_migration',
      data: {
        userName: user.name,
        originalApplication: user.loan_details,
        newClassification: user.migration_strategy,
        benefits: [
          "Access to more competitive rates",
          "Broader range of bank options",
          "Specialized broker support"
        ],
        action: "Your application has been upgraded to our enhanced system"
      }
    })
  }
}
```

#### Phase 4: Analytics & Reporting (Week 3)
```typescript
interface MigrationReport {
  totalMigrated: number
  byType: {
    toRefinance: number
    toCommercial: number
    archived: number
  }
  userNotifications: {
    sent: number
    opened: number
    actioned: number
  }
  brokerHandoffs: {
    created: number
    converted: number
  }
}

const generateMigrationReport = async (): Promise<MigrationReport> => {
  // Generate comprehensive migration report
  return {
    totalMigrated: await countMigratedRecords(),
    byType: await getMigrationBreakdown(),
    userNotifications: await getNotificationMetrics(),
    brokerHandoffs: await getBrokerConversionMetrics()
  }
}
```

### Migration Timeline

| Week | Action | Responsible | Status |
|------|--------|------------|---------|
| 1 | Backup all equity_loan data | DevOps | Pending |
| 1 | Deploy migration scripts | Backend | Pending |
| 1-2 | Execute data transformation | Backend | Pending |
| 2 | Send user notifications | Marketing | Pending |
| 2 | Update broker training materials | Sales | Pending |
| 3 | Generate migration report | Analytics | Pending |
| 3 | Archive legacy tables | DevOps | Pending |

### Rollback Plan

```typescript
const rollbackMigration = async () => {
  // 1. Restore from backup
  await db.query(`
    UPDATE loan_applications la
    SET 
      loan_type = backup.loan_type,
      migration_status = 'rolled_back',
      migrated_at = NULL
    FROM legacy_equity_loan_backup backup
    WHERE la.id = backup.id
  `)
  
  // 2. Notify affected users
  await notifyRollback()
  
  // 3. Restore UI elements
  await deployLegacyUI()
}
```

### Success Metrics

```typescript
const migrationSuccess = {
  dataIntegrity: {
    target: "100% data preserved",
    measure: "No data loss during migration"
  },
  userExperience: {
    target: "< 5% user complaints",
    measure: "Support ticket analysis"
  },
  brokerAdoption: {
    target: "> 80% broker engagement",
    measure: "Broker handling of migrated leads"
  },
  conversionRate: {
    target: "Maintain or improve",
    measure: "Compare pre/post migration conversion"
  }
}
```

---

## 4. 🔧 IMPLEMENTATION CHECKLIST

### Frontend Changes:
- [ ] Add 'commercial' to LoanType enum
- [ ] Create commercial routing component
- [ ] Update LoanTypeSelector with commercial option
- [ ] Add commercial notice/messaging
- [ ] Remove equity_loan from UI

### Backend Changes:
- [ ] Update API schemas for commercial
- [ ] Create CashEquityDetectionAgent
- [ ] Integrate cash equity detection in AI agents
- [ ] Create migration scripts
- [ ] Set up backup procedures

### Database Changes:
- [ ] Create legacy_equity_loan_backup table
- [ ] Add migration tracking columns
- [ ] Update loan_type constraints
- [ ] Create migration audit log

### Testing:
- [ ] Test commercial routing flow
- [ ] Test cash equity AI detection
- [ ] Test migration scripts on staging
- [ ] Verify rollback procedures
- [ ] Load test with migrated data

### Documentation:
- [ ] Update API documentation
- [ ] Create broker training materials
- [ ] Update user help center
- [ ] Document migration procedures