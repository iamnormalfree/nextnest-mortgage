/**
 * Mortgage Form Validation Schemas
 * Lead: Ahmad Ibrahim - Senior Backend Engineer
 * 
 * Zod schemas for progressive form validation with Singapore-specific rules
 * Implements gate-based validation strategy from Tech-Team architecture
 */

import { z } from 'zod'

// ============================================================================
// SINGAPORE-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Singapore phone number validation
 */
const singaporePhoneSchema = z.string()
  .regex(/^[689]\d{7}$/, 'Please enter a valid Singapore phone number (8 digits starting with 6, 8, or 9)')
  .transform((val) => val.replace(/\D/g, ''))

/**
 * Property price validation with Singapore market ranges
 */
const propertyPriceSchema = z.number()
  .min(100000, 'Minimum property price is $100,000')
  .max(99999999, 'Maximum property price is $99,999,999')

/**
 * Income validation
 */
const incomeSchema = z.number()
  .min(0, 'Income cannot be negative')
  .max(9999999, 'Please enter a valid income amount')

/**
 * Age validation for mortgage eligibility
 */
const ageSchema = z.number()
  .min(21, 'Minimum age for mortgage is 21')
  .max(100, 'Please enter a valid age')

// ============================================================================
// BASE SCHEMA FOR ALL LOAN TYPES - GATE-BASED STRUCTURE
// ============================================================================

const baseLeadSchema = z.object({
  // Gate 0 - Loan Type Selection (no personal info required)
  loanType: z.enum(['new_purchase', 'refinance', 'equity_loan'], {
    message: 'Please select a valid loan type'
  }),
  
  // Gate 1 - Basic Information
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .transform((email) => email.trim()),
  
  // Gate 2 - Contact Information
  phone: singaporePhoneSchema,
  
  // Optional tracking fields
  marketingConsent: z.boolean().optional(),
  referralSource: z.string().optional(),
  sessionId: z.string().optional()
})

// New purchase specific schema
export const newPurchaseSchema = baseLeadSchema.extend({
  loanType: z.literal('new_purchase'),
  purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']),
  priceRange: z.number().min(300000).max(5000000),
  ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']),
  firstTimeBuyer: z.boolean(),
  downPaymentReady: z.boolean().optional(),
  cpfUsage: z.enum(['yes', 'no', 'unsure']).optional()
})

// Refinancing specific schema
export const refinanceSchema = baseLeadSchema.extend({
  loanType: z.literal('refinance'),
  currentRate: z.number().min(0).max(10),
  lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
  currentBank: z.string().min(1),
  outstandingLoan: z.number().min(10000).max(10000000),
  propertyValue: z.number().min(100000).max(20000000),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']),
  yearsPurchased: z.number().min(0).max(50),
  refinanceReason: z.enum(['lower_rate', 'cash_out', 'better_terms', 'debt_consolidation']),
  cashOutAmount: z.number().min(0).max(2000000).optional()
})

// Equity loan specific schema
export const equityLoanSchema = baseLeadSchema.extend({
  loanType: z.literal('equity_loan'),
  propertyValue: z.number().min(200000).max(20000000),
  propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']),
  existingLoan: z.number().min(0).max(10000000),
  equityAmount: z.number().min(50000).max(3000000),
  purpose: z.enum(['business', 'investment', 'renovation', 'education', 'other']),
  repaymentPeriod: z.enum(['5_years', '10_years', '15_years', '20_years']),
  monthlyIncome: z.number().min(3000).max(100000)
})

// Union type for all form schemas
export const mortgageFormSchema = z.discriminatedUnion('loanType', [
  newPurchaseSchema,
  refinanceSchema,
  equityLoanSchema
])

export type MortgageFormData = z.infer<typeof mortgageFormSchema>
export type NewPurchaseData = z.infer<typeof newPurchaseSchema>
export type RefinanceData = z.infer<typeof refinanceSchema>
export type EquityLoanData = z.infer<typeof equityLoanSchema>

// Progressive disclosure validation schemas
export const step1Schema = z.object({
  loanType: z.enum(['new_purchase', 'refinance', 'equity_loan'])
})

export const step2BaseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().regex(/^[689]\d{7}$/, 'Please enter a valid Singapore number')
})

// AI Context Schema for intelligent analysis
export const aiContextSchema = z.object({
  userBehavior: z.object({
    timeOnPage: z.number(),
    formInteractions: z.number(),
    hesitationPoints: z.array(z.string()),
    deviceType: z.enum(['mobile', 'desktop', 'tablet'])
  }),
  marketContext: z.object({
    currentRates: z.object({
      hdb: z.number(),
      private: z.number(),
      commercial: z.number()
    }),
    rateDirection: z.enum(['rising', 'falling', 'stable']),
    marketSentiment: z.enum(['hot', 'cooling', 'stable'])
  }),
  leadIntelligence: z.object({
    urgencyScore: z.number().min(0).max(10),
    sophisticationLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    priceRange: z.enum(['budget', 'mid_market', 'premium', 'luxury']),
    likelyToConvert: z.boolean()
  })
})

export type AIContext = z.infer<typeof aiContextSchema>

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid Singapore phone number (8 digits starting with 6, 8, or 9)',
  MIN_AMOUNT: 'Amount must be at least SGD',
  MAX_AMOUNT: 'Amount cannot exceed SGD',
  INVALID_RANGE: 'Please select a valid range'
} as const

// Singapore-specific validation helpers
export const validateSingaporePhone = (phone: string): boolean => {
  const phoneRegex = /^[689]\d{7}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

export const validatePropertyValue = (value: number, propertyType: string): boolean => {
  const minimums = {
    HDB: 200000,
    EC: 500000,
    Private: 600000,
    Landed: 1000000
  }
  return value >= minimums[propertyType as keyof typeof minimums]
}

export const validateLoanAmount = (loanAmount: number, propertyValue: number, propertyType: string): boolean => {
  const ltvLimits = {
    HDB: 0.9,    // 90% for citizens
    EC: 0.9,     // 90% for citizens
    Private: 0.75, // 75% for first property
    Landed: 0.75   // 75% for first property
  }
  
  const maxLoan = propertyValue * ltvLimits[propertyType as keyof typeof ltvLimits]
  return loanAmount <= maxLoan
}

// ============================================================================
// PROGRESSIVE FORM GATE SCHEMAS
// ============================================================================

/**
 * Creates the appropriate validation schema for a specific gate and loan type
 * This enables progressive disclosure validation
 */
export const createGateSchema = (loanType: string, gateNumber: number) => {
  // Gate 0: Loan Type Selection (handled by LoanTypeSelector)
  if (gateNumber === 0) {
    return z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan'])
    })
  }
  
  // Gate 1: Basic Information (Name + Email)
  if (gateNumber === 1) {
    return z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address')
    })
  }
  
  // Gate 2: Contact Details (Add Phone)
  if (gateNumber === 2) {
    return z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      phone: singaporePhoneSchema
    })
  }
  
  // Gate 3: Optimization Parameters
  if (gateNumber === 3) {
    const baseGate3Schema = z.object({
      loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      phone: singaporePhoneSchema,
      // Gate 3 specific fields
      monthlyIncome: z.number()
        .min(0, 'Income cannot be negative')
        .max(9999999, 'Please enter a valid income amount'),
      existingCommitments: z.number()
        .min(0, 'Commitments cannot be negative')
        .max(9999999, 'Please enter a valid amount')
        .optional(),
      packagePreference: z.enum(['lowest_rate', 'flexibility', 'stability', 'features'], {
        message: 'Please select what matters most to you'
      }),
      riskTolerance: z.enum(['conservative', 'moderate', 'aggressive'], {
        message: 'Please select your risk appetite'
      }),
      planningHorizon: z.enum(['short_term', 'medium_term', 'long_term'], {
        message: 'Please select your planning timeline'
      })
    })
    
    // Add loan-type specific fields from Gate 2
    switch (loanType) {
      case 'new_purchase':
        return baseGate3Schema.extend({
          propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']),
          priceRange: z.number().min(300000, 'Minimum property price is $300,000'),
          purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']),
          ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']),
          firstTimeBuyer: z.boolean()
        })
      
      case 'refinance':
        return baseGate3Schema.extend({
          currentRate: z.number().min(1, 'Current rate must be at least 1%').max(10, 'Please verify current rate'),
          lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
          currentBank: z.string().min(1, 'Please select your current bank'),
          propertyValue: z.number().min(300000, 'Minimum property value is $300,000'),
          outstandingLoan: z.number().min(0, 'Outstanding loan cannot be negative')
        })
      
      case 'equity_loan':
        return baseGate3Schema.extend({
          propertyValue: z.number().min(500000, 'Minimum property value for equity loan is $500,000'),
          equityNeeded: z.number().min(100000, 'Minimum equity loan amount is $100,000'),
          purpose: z.enum(['investment', 'renovation', 'business', 'education', 'other'])
        })
      
      default:
        return baseGate3Schema
    }
  }
  
  // For any future gates, return the full schema
  const fullSchema = z.object({
    loanType: z.enum(['new_purchase', 'refinance', 'equity_loan']),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: singaporePhoneSchema
  })
  
  // Extend with loan-type specific fields
  switch (loanType) {
    case 'new_purchase':
      return fullSchema.extend({
        propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']),
        priceRange: z.number().min(300000, 'Minimum property price is $300,000'),
        purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']),
        ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']),
        firstTimeBuyer: z.boolean()
      })
    
    case 'refinance':
      return fullSchema.extend({
        currentRate: z.number().min(1, 'Current rate must be at least 1%').max(10, 'Please verify current rate'),
        lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
        currentBank: z.string().min(1, 'Please select your current bank'),
        propertyValue: z.number().min(300000, 'Minimum property value is $300,000'),
        outstandingLoan: z.number().min(0, 'Outstanding loan cannot be negative')
      })
    
    case 'equity_loan':
      return fullSchema.extend({
        propertyValue: z.number().min(500000, 'Minimum property value for equity loan is $500,000'),
        equityNeeded: z.number().min(100000, 'Minimum equity loan amount is $100,000'),
        purpose: z.enum(['investment', 'renovation', 'business', 'education', 'other'])
      })
    
    default:
      return fullSchema
  }
}

/**
 * Alias for createGateSchema to support progressive form hooks
 * @deprecated Use createGateSchema instead
 */
export const createStepSchema = createGateSchema