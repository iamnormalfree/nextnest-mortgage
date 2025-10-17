---
title: hybrid-tollbooth-v2-differentiated
type: report
status: analysis
owner: forms
date: 2025-08-28
---

# Hybrid Tollbooth v2: Differentiated Lightning Capture
## Maintaining Revenue Strategy While Capturing Loan-Type Intelligence

### Strategic Overview Update
**Goal**: Capture leads in 30 seconds WITH loan-type specific intelligence
**Philosophy**: "Different urgencies need different hooks, but same tollbooth gates"
**Revenue Model**: Differentiated capture → Better scoring → Higher conversion

---

## Phase 1: Lightning Capture (DIFFERENTIATED)

### Entry Point: Loan Type Selection FIRST
```typescript
interface LightningCaptureV2 {
  // IMMEDIATE SPLIT: User selects loan type upfront
  entryPoint: {
    headline: 'What brings you here today?',
    options: [
      {
        type: 'new_purchase',
        label: 'Buying a Property',
        subtext: 'Get pre-approved in 24 hours',
        icon: '🏠'
      },
      {
        type: 'refinance',
        label: 'Better Rate on Existing Loan',
        subtext: 'Save up to $500/month',
        icon: '💰'
      },
      {
        type: 'equity_loan',
        label: 'Cash From Your Property',
        subtext: 'Unlock up to 75% equity',
        icon: '🔓'
      }
    ],
    psychology: 'Self-selection creates commitment'
  }
}
```

### Path A: New Purchase Lightning Capture (30 seconds)
```typescript
interface NewPurchaseLightning {
  step1_urgency: {
    // CRITICAL: Capture urgency signals immediately
    purchaseTimeline: {
      type: 'button_select',
      options: [
        'This month', // HOT lead
        'Next 3 months', // WARM lead
        '3-6 months', // NURTURE lead
        'Just exploring' // EDUCATE lead
      ],
      required: true
    },
    
    propertyType: {
      type: 'quick_select',
      options: ['HDB', 'EC', 'Private Condo', 'Landed'],
      required: true
    },
    
    priceRange: {
      type: 'slider',
      min: 300000,
      max: 5000000,
      showMonthlyPayment: true, // Instant value
      required: true
    }
  },

  step2_qualification: {
    // IPA is THE key differentiator for purchase urgency
    ipaStatus: {
      type: 'smart_select',
      options: [
        'Have IPA already', // HOTTEST - ready to compete
        'Applied, waiting', // HOT - needs backup options
        'Starting application', // WARM - needs guidance
        'What is IPA?' // COLD - needs education
      ],
      helpText: 'In-Principle Approval from bank',
      required: true
    },

    firstTimeBuyer: {
      type: 'yes_no',
      impacts: 'Grants, TDSR calculation, stamp duty',
      required: true
    }
  },

  step3_contact: {
    name: { type: 'text', required: true },
    phone: { 
      type: 'tel', 
      validation: 'singapore_format',
      required: true 
    },
    email: { 
      type: 'email',
      required: true 
    },
    
    // SMART: Urgency-based preference
    contactUrgency: {
      type: 'auto_select',
      logic: {
        if: 'purchaseTimeline === "This month"',
        then: 'Call me today',
        else: 'Email/WhatsApp is fine'
      }
    }
  },

  instantResponse: {
    display: 'Checking your pre-approval options...',
    result: {
      hasIPA: 'Great! We found 3 banks that can compete with your current IPA',
      noIPA: 'You qualify for pre-approval from 5+ banks',
      exploring: 'Based on $X property, your monthly payment would be $Y'
    },
    teaser: 'Complete profile for specific bank recommendations →',
    urgencyTrigger: {
      hot: 'Broker will call within 2 hours',
      warm: 'Detailed analysis ready in email',
      cold: 'Educational guide + calculator access'
    }
  }
}
```

### Path B: Refinancing Lightning Capture (30 seconds)
```typescript
interface RefinancingLightning {
  step1_pain: {
    // CRITICAL: Identify refinancing urgency/pain
    currentRate: {
      type: 'number_input',
      placeholder: 'e.g., 4.5',
      suffix: '%',
      required: true,
      instantCalc: 'Show potential savings immediately'
    },
    
    lockInStatus: {
      type: 'urgency_select',
      options: [
        'Lock-in ending soon', // HOT - time sensitive
        'No lock-in period', // WARM - can switch anytime
        'Still locked in', // COLD - future planning
        'Not sure' // QUALIFY - needs checking
      ],
      required: true
    },
    
    currentBank: {
      type: 'smart_dropdown',
      prefilled: ['DBS', 'OCBC', 'UOB', 'StanChart', 'HSBC', 'Other'],
      required: true
    }
  },

  step2_property: {
    propertyValue: {
      type: 'slider',
      min: 300000,
      max: 10000000,
      showEquity: true, // Show available equity
      required: true
    },
    
    outstandingLoan: {
      type: 'auto_calculate',
      basedOn: 'propertyValue',
      editable: true,
      showLTV: true
    },
    
    propertyType: {
      type: 'quick_select',
      options: ['HDB', 'EC', 'Private', 'Commercial'],
      required: true
    }
  },

  step3_contact: {
    name: { type: 'text', required: true },
    phone: { type: 'tel', required: true },
    email: { type: 'email', required: true },
    
    // SMART: Lock-in based urgency
    preferredTiming: {
      type: 'auto_suggest',
      logic: {
        if: 'lockInStatus === "ending soon"',
        then: 'Call me ASAP - every day counts',
        elseif: 'lockInStatus === "no lock-in"',
        then: 'This week works',
        else: 'No rush, email is fine'
      }
    }
  },

  instantResponse: {
    display: 'Calculating your savings...',
    result: {
      hotLead: 'You could save $[XXX-YYY]/month with current rates!',
      warmLead: 'Refinancing could reduce your rate from X% to Y%',
      coldLead: 'Lock-in ends [date]. Set a reminder for best timing.'
    },
    teaser: 'See which banks offer the lowest rates for you →',
    urgencyTrigger: {
      lockInEnding: 'Time-sensitive: Broker will call today',
      noLockIn: 'Immediate savings possible - analysis in 24h',
      stillLocked: 'We\'ll monitor rates and alert you'
    }
  }
}
```

---

## Technical Architecture (Systems Architect Input)

### Dynamic Form Architecture
```typescript
interface DifferentiatedFormSystem {
  routing: {
    // Loan type selection determines entire flow
    loanTypeRouter: (selection: LoanType) => {
      switch(selection) {
        case 'new_purchase':
          return <NewPurchaseLightningForm />
        case 'refinance':
          return <RefinancingLightningForm />
        case 'equity_loan':
          return <EquityLoanLightningForm />
      }
    }
  },

  stateManagement: {
    // Unified state with loan-type specific schemas
    formState: {
      common: CommonFields,
      specific: LoanTypeSpecificFields,
      metadata: {
        loanType: LoanType,
        urgencyScore: number,
        completionTime: number,
        abandonmentPoint?: string
      }
    },
    
    validation: {
      // Dynamic Zod schemas per loan type
      schemaSelector: (loanType: LoanType) => {
        return loanTypeSchemas[loanType].merge(commonSchema)
      }
    }
  },

  intelligentDefaults: {
    // Pre-fill based on loan type patterns
    newPurchase: {
      loanTenure: 30, // Most common
      downPayment: 0.25, // Standard 25%
    },
    refinancing: {
      loanTenure: 'match_existing',
      cashOut: 0 // Most don't cash out
    }
  }
}
```

### Lead Scoring Differentiation
```typescript
interface DifferentiatedLeadScoring {
  newPurchaseScoring: {
    urgencyFactors: {
      timeline_this_month: 100,
      has_ipa: 90,
      made_offer: 85,
      otp_signed: 95,
      actively_viewing: 70,
      exploring: 30
    },
    
    valueFactors: {
      private_property: 100,
      loan_above_2m: 95,
      first_time_buyer: 80, // Grants opportunity
      executive_condo: 75,
      hdb: 60
    }
  },

  refinancingScoring: {
    urgencyFactors: {
      lock_in_ending_3months: 100,
      lock_in_ending_6months: 80,
      no_lock_in: 70,
      high_current_rate: 85, // >4%
      still_locked: 30
    },
    
    valueFactors: {
      loan_above_1m: 100,
      property_value_above_2m: 95,
      commercial_property: 90,
      multiple_properties: 100
    }
  },

  routingLogic: {
    scoreAbove90: 'immediate_broker_call',
    score70to90: 'priority_email_followup',
    score50to70: 'standard_nurture_sequence',
    scoreBelow50: 'educational_content_track'
  }
}
```

### Progressive Enhancement Gates (Maintaining Tollbooth)
```typescript
interface MaintainedTollboothGates {
  gate1: {
    // Lightning capture complete
    cost: 'Basic contact + loan type specifics',
    value: 'Instant calculation + rough qualification',
    withhold: 'Specific banks, exact rates, application tactics'
  },

  gate2: {
    // Enhanced profile (via email/dashboard)
    trigger: 'Email link or dashboard prompt',
    additional: {
      newPurchase: ['income details', 'cpf usage', 'grants eligibility'],
      refinancing: ['existing loan details', 'cpf refund', 'penalty calculation']
    },
    value: 'Detailed PDF report with comparisons',
    withhold: 'Bank names, negotiation tactics'
  },

  gate3: {
    // Full qualification (PDF download)
    requirement: 'Complete financial profile',
    value: 'Full analysis with savings scenarios',
    withhold: 'Exclusive rates, waiver strategies'
  },

  gate4: {
    // Broker consultation (Revenue)
    value: 'Everything - exclusive rates, tactics, support',
    conversion: 'Client engagement'
  }
}
```

### A/B Testing Framework
```typescript
interface DifferentiatedTestingStrategy {
  entryPointTests: {
    control: 'Generic form for all',
    variantA: 'Loan type selection first',
    variantB: 'Visual cards for loan type',
    metric: 'Completion rate by loan type'
  },

  urgencyCapture: {
    newPurchase: {
      control: 'Standard property questions',
      variant: 'Timeline + IPA status first',
      metric: 'Lead score correlation'
    },
    refinancing: {
      control: 'Property details first',
      variant: 'Current rate + lock-in first',
      metric: 'Urgency identification accuracy'
    }
  },

  instantValue: {
    control: 'Generic "calculating" message',
    variant: 'Loan-type specific teasers',
    metric: 'Gate 2 progression rate'
  }
}
```

---

## Implementation Priority

### Week 1: Core Differentiation
1. **Day 1-2**: Implement loan type router and conditional rendering
2. **Day 3-4**: Create loan-specific lightning capture forms
3. **Day 5**: Differentiated lead scoring algorithms

### Week 2: Intelligence Layer
1. **Day 1-2**: Urgency detection and auto-routing
2. **Day 3-4**: Dynamic nurture sequences by loan type
3. **Day 5**: A/B testing framework

### Week 3: Optimization
1. Performance monitoring by loan type
2. Conversion analysis per path
3. Iterate based on data

---

## Success Metrics Update

```typescript
interface DifferentiatedMetrics {
  captureMetrics: {
    overallCompletion: 'Target: 70% across all types',
    newPurchaseCompletion: 'Target: 75% (higher urgency)',
    refinancingCompletion: 'Target: 65% (more consideration)',
    timeToComplete: 'Target: <35 seconds average'
  },

  intelligenceMetrics: {
    urgencyDetectionAccuracy: 'Target: 85% correct routing',
    leadScoreCorrelation: 'Target: 0.7 with conversion',
    brokerResponseTime: {
      hot: '<2 hours',
      warm: '<24 hours',
      cold: '<72 hours'
    }
  },

  conversionMetrics: {
    gate1_to_gate2: {
      newPurchase: 'Target: 45%',
      refinancing: 'Target: 35%'
    },
    gate2_to_consultation: {
      newPurchase: 'Target: 35%',
      refinancing: 'Target: 30%'
    },
    consultation_to_client: {
      newPurchase: 'Target: 45%',
      refinancing: 'Target: 40%'
    }
  }
}
```

---

## Key Improvements in V2

1. **Loan-Type Intelligence**: Captures urgency signals specific to each journey
2. **Differentiated Scoring**: Accurate lead prioritization from first touch
3. **Smart Routing**: Hot leads get immediate attention
4. **Maintained Gates**: Tollbooth strategy intact but with better segmentation
5. **Instant Value**: Loan-type specific calculations and teasers
6. **Progressive Enhancement**: Natural progression through value gates

The system now captures the RIGHT 30-second data for each loan type while maintaining the tollbooth revenue strategy.