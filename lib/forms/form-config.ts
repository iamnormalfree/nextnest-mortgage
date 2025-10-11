/**
 * Form Configuration
 * Phase B-0.2: Extracted domain configuration from UI
 *
 * Central configuration for progressive form steps and default values
 */

import { FormStep, LoanType } from '@/lib/contracts/form-contracts'

/**
 * Progressive form step definitions
 * Defines the micro-commitment ladder for trust building
 */
export const formSteps: FormStep[] = [
  {
    stepNumber: 0,
    label: 'Loan Type',
    description: 'Choose your mortgage path',
    fieldsRequired: ['loanType'],
    minimumFields: 1,
    trustLevel: 0,
    ctaText: 'Get Instant Estimate (No Email Required)'
  },
  {
    stepNumber: 1,
    label: 'Who You Are',
    description: 'Let\'s get to know you',
    fieldsRequired: ['name', 'email', 'phone'],
    minimumFields: 3,
    trustLevel: 25,
    ctaText: 'Continue to property details'
  },
  {
    stepNumber: 2,
    label: 'What You Need',
    description: 'Tell us about your property goals',
    fieldsRequired: ['propertyCategory'],
    minimumFields: 1,
    trustLevel: 50,
    ctaText: 'Get instant loan estimate'
  },
  {
    stepNumber: 3,
    label: 'Your Finances',
    description: 'Help us understand your financial situation',
    fieldsRequired: ['actualAges.0', 'actualIncomes.0', 'employmentType'],
    minimumFields: 3,
    trustLevel: 75,
    ctaText: 'Connect with AI Mortgage Specialist'
  }
]

/**
 * Get default form values based on loan type
 * Provides sensible defaults for Singapore market
 */
export function getDefaultValues(loanType: LoanType): Record<string, any> {
  const defaults: any = {
    loanType,
    name: '',
    email: '',
    phone: '',
    // Singapore reality: Joint applications are the norm
    applicantType: 'joint',
    // Combined age for instant calculations
    combinedAge: 35,
    // Step 3 fields (Your Finances)
    monthlyIncome: undefined,
    existingCommitments: undefined,
    employmentType: 'employed', // Set a default value
    // Initialize actualAges and actualIncomes to prevent controlled/uncontrolled input warnings
    actualAges: {
      0: 30, // Set reasonable defaults
      1: undefined
    },
    actualIncomes: {
      0: 5000, // Set reasonable defaults
      1: undefined
    },
    // Initialize co-applicant fields to avoid validation errors for single applicants
    coApplicantCommitments: undefined,
    coApplicantCreditCards: '',
    coApplicantEmployment: ''
  }

  // Add loan-type specific defaults
  if (loanType === 'new_purchase') {
    defaults.propertyCategory = 'resale' // Default category
    defaults.propertyType = 'HDB' // Default property type
    defaults.priceRange = 500000 // Default price range
    defaults.combinedAge = 35 // Default combined age
    defaults.purchaseTimeline = 'next_3_months'
    defaults.firstTimeBuyer = false
  } else if (loanType === 'refinance') {
    defaults.propertyType = 'HDB' // Required by step 2 schema
    defaults.currentRate = 3.0 // Default reasonable rate
    defaults.lockInStatus = 'no_lock' // Default to no lock-in
    defaults.currentBank = 'dbs' // Default to first bank option
    defaults.propertyValue = undefined
    defaults.outstandingLoan = 400000 // Default reasonable outstanding loan
    defaults.remainingTenure = undefined
    // Per-applicant income/job changes flow defaults
    defaults.mainApplicantChanges = undefined
    defaults.coApplicantChanges = undefined
    // New refined refinancing fields
    defaults.refinancingGoals = []
    defaults.yearsInProperty = undefined
  } else if (loanType === 'commercial') {
    defaults.commercialPropertyType = ''
    defaults.purchaseStructure = ''
  }

  return defaults
}

/**
 * Map UI loan type to schema loan type
 * Handles legacy naming conventions
 */
export function mapLoanType(uiLoanType: string): LoanType {
  if (uiLoanType === 'new') {
    return 'new_purchase'
  }
  return uiLoanType as LoanType
}

/**
 * Property category options for new purchases
 */
export const propertyCategoryOptions = [
  {
    value: 'resale',
    label: 'Resale',
    description: 'Existing HDB or private property'
  },
  {
    value: 'new_launch',
    label: 'New Launch',
    description: 'Brand new development'
  },
  {
    value: 'bto',
    label: 'BTO',
    description: 'Build-To-Order HDB flat'
  },
  {
    value: 'commercial',
    label: 'Commercial',
    description: 'Office, retail, or industrial'
  }
]

/**
 * Field visibility rules
 * Determines which fields to show based on form state
 */
export function getVisibleFields(
  loanType: LoanType,
  step: number,
  propertyCategory?: string
): string[] {
  const visibleFields: string[] = []

  if (step === 1) {
    // Step 1: Basic info
    visibleFields.push('name', 'email', 'phone')
  } else if (step === 2) {
    // Step 2: Property details
    if (loanType === 'new_purchase') {
      visibleFields.push('propertyCategory')

      if (propertyCategory === 'resale') {
        visibleFields.push('propertyType', 'priceRange', 'purchaseTimeline', 'firstTimeBuyer')
      } else if (propertyCategory === 'new_launch') {
        visibleFields.push('developmentName', 'unitType', 'topDate', 'paymentScheme')
      } else if (propertyCategory === 'bto') {
        visibleFields.push('btoProject', 'flatType', 'grantAmount', 'firstTimer')
      }
    } else if (loanType === 'refinance') {
      visibleFields.push('propertyType', 'currentRate', 'lockInStatus', 'currentBank', 'outstandingLoan')
    } else if (loanType === 'commercial') {
      visibleFields.push('commercialPropertyType', 'purchaseStructure')
    }
  } else if (step === 3) {
    // Step 3: Financial details
    visibleFields.push('actualAges.0', 'actualIncomes.0', 'employmentType')

    // Add co-applicant fields if joint application
    if (propertyCategory !== 'commercial') {
      visibleFields.push('actualAges.1', 'actualIncomes.1')
    }
  }

  return visibleFields
}