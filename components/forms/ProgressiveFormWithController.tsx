// ABOUTME: Progressive mortgage application form with 3-step flow and real-time validation
// ABOUTME: Integrates with Chatwoot for seamless broker handoff and lead scoring

'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { useProgressiveFormController } from '@/hooks/useProgressiveFormController'
import {
  FormState,
  FormStep,
  LeadScore,
  AIInsightResponse,
  LoanType,
  isPureLtvResult,
  isFullAnalysisResult,
  isRefinanceResult
} from '@/lib/contracts/form-contracts'
import {
  eventBus,
  FormEvents,
  useEventPublisher,
  useCreateEvent
} from '@/lib/events/event-bus'
import { Step3NewPurchase } from './sections/Step3NewPurchase'
import { Step3Refinance } from './sections/Step3Refinance'
import { ResponsiveFormLayout } from './layout/ResponsiveFormLayout'
import { InstantAnalysisSidebar } from './instant-analysis/InstantAnalysisSidebar'
import { MasReadinessSidebar } from './instant-analysis/MasReadinessSidebar'
import { RefinanceOutlookSidebar } from './instant-analysis/RefinanceOutlookSidebar'
import { useMasReadiness } from '@/hooks/useMasReadiness'
import { useWatch } from 'react-hook-form'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { cn, formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
import { calculateInstantProfile, roundMonthlyPayment, calculateRefinanceOutlook } from '@/lib/calculations/instant-profile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ChevronDown,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Shield,
  Sparkles,
  CheckCircle,
  Users,
  Home,
  DollarSign,
  TrendingUp,
  Info
} from 'lucide-react'
import ChatTransitionScreen from '@/components/forms/ChatTransitionScreen'
import ChatWidgetLoader from '@/components/forms/ChatWidgetLoader'
import { formSteps, propertyCategoryOptions, getPropertyTypeOptions } from '@/lib/forms/form-config'

// Helper function to safely extract error messages
const getErrorMessage = (error: any): string => {
  if (!error) return 'This field is required'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error) return error.message
  return 'This field is required'
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ProgressiveFormProps {
  loanType: LoanType
  sessionId: string
  onStepCompletion: (step: number, data: any) => void
  onAIInsight: (insight: AIInsightResponse) => void
  onScoreUpdate: (score: LeadScore) => void
  isExternallySubmitting?: boolean
  submissionError?: string | null
  className?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressiveFormWithController({
  loanType,
  sessionId,
  onStepCompletion,
  onAIInsight,
  onScoreUpdate,
  isExternallySubmitting = false,
  submissionError = null,
  className
}: ProgressiveFormProps) {
  // State for chat transition
  const [showChatTransition, setShowChatTransition] = useState(false)
  const [chatConfig, setChatConfig] = useState<any>(null)
  const [isFormCompleted, setIsFormCompleted] = useState(false)
  const [showOptionalContext, setShowOptionalContext] = useState(false)
  const [showJointApplicant, setShowJointApplicant] = useState(false)
  const [ltvMode, setLtvMode] = useState(75) // Default LTV mode (75% with 55% option)
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false)

  // Ref for throttling analytics events
  const stepTrackerRef = useRef<Record<string, number>>({})

  // Responsive layout detection
  const { isMobile, isDesktop } = useResponsiveLayout()

  // Use the headless controller
  const controller = useProgressiveFormController({
    loanType,
    sessionId,
    onStepCompletion,
    onAIInsight,
    onScoreUpdate,
    onFormComplete: (data) => {
      setIsFormCompleted(true)
      // Trigger chat transition if needed
      if (currentStep === 3) { // Step 4 (Your Finances) is index 3
        setShowChatTransition(true)
      }
    }
  })

  const {
    currentStep,
    completedSteps,
    errors,
    isValid,
    isAnalyzing,
    isInstantCalcLoading,
    isSubmitting,
    instantCalcResult,
    leadScore,
    propertyCategory,
    fieldValues,
    trustSignalsShown,
    showInstantCalc,
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    next,
    prev,
    onFieldChange,
    requestAIInsight,
    setPropertyCategory,
    calculateInstant
  } = controller


  // Helper function to get employment recognition rate (Dr Elena v2 persona aligned)
  const getEmploymentRecognitionRate = (employmentType: string) => {
    switch (employmentType) {
      case 'employed':
        return 1.0 // 100% recognition for employed
      case 'self-employed':
        return 0.7 // 70% recognition for self-employed (2-year NOA requirement)
      case 'contract':
      case 'variable':
        return 0.6 // 60% recognition for contract/freelance or variable income
      case 'other':
        return 0.5
      case 'not-working':
      case 'unemployed':
      default:
        return 0.0 // 0% recognition for unemployed
    }
  }
  // Watch form values for MAS readiness calculation (Step 3)
  const primaryIncome = useWatch({ control, name: 'actualIncomes.0' }) || 0
  const variableIncome = useWatch({ control, name: 'actualVariableIncomes.0' }) || 0
  const coApplicantIncome = useWatch({ control, name: 'actualIncomes.1' }) || 0  // Co-applicant income
  const age = useWatch({ control, name: 'actualAges.0' }) || 0
  const employmentType = useWatch({ control, name: 'employmentType' }) || 'employed'
  const employmentDetails = useWatch({ control, name: 'employmentDetails' })
  const liabilitiesRaw = useWatch({ control, name: 'liabilities' })
  const propertyValue = useWatch({ control, name: 'priceRange' }) || 0
  const propertyType = useWatch({ control, name: 'propertyType' }) || 'Private'

  // Calculate effective income with employment recognition (primary applicant)
  const recognitionRate = getEmploymentRecognitionRate(employmentType)
  const selfEmployedDeclared = employmentType === 'self-employed'
    ? employmentDetails?.['self-employed']?.averageReportedIncome || primaryIncome
    : primaryIncome

  const recognizedPrimaryIncome = employmentType === 'self-employed'
    ? selfEmployedDeclared * recognitionRate
    : primaryIncome * recognitionRate

  const variableRecognitionRate = employmentType === 'not-working' ? 0 : 0.7
  const recognizedVariableIncome = variableIncome * variableRecognitionRate
  const recognizedIncome = Math.max(recognizedPrimaryIncome + recognizedVariableIncome, 0)

  // Include co-applicant income in total (assumed employed, 100% recognition)
  const totalIncome = (recognizedIncome > 0 ? recognizedIncome : primaryIncome + variableIncome) + coApplicantIncome
  const effectiveIncome = totalIncome

  // Calculate total monthly commitments from both applicants' liabilities
  const liabilities2Raw = useWatch({ control, name: 'liabilities_2' })
  
  const totalMonthlyCommitments = useMemo(() => {
    const keys = ['propertyLoans', 'carLoans', 'creditCards', 'personalLines']
    
    // Applicant 1 commitments
    const applicant1Total = !liabilitiesRaw ? 0 : keys.reduce((total, key) => {
      const liability = liabilitiesRaw[key]
      if (!liability?.enabled) return total
      return total + (Number(liability.monthlyPayment) || 0)
    }, 0)
    
    // Applicant 2 commitments (if joint application)
    const applicant2Total = !liabilities2Raw ? 0 : keys.reduce((total, key) => {
      const liability = liabilities2Raw[key]
      if (!liability?.enabled) return total
      return total + (Number(liability.monthlyPayment) || 0)
    }, 0)
    
    return applicant1Total + applicant2Total
  }, [liabilitiesRaw, liabilities2Raw])

  // Watch co-applicant data for IWAA calculation
  const actualAgesRaw = useWatch({ control, name: 'actualAges' })
  const actualIncomesRaw = useWatch({ control, name: 'actualIncomes' })

  // Parse and filter arrays for IWAA
  // React Hook Form may return objects {0: val1, 1: val2} instead of arrays
  const parseFormArray = (data: any, minValue = 0, maxValue = Infinity): number[] => {
    if (!data) return []

    const filterValid = (v: any): v is number =>
      typeof v === 'number' && v > minValue && v <= maxValue

    // If it's already an array, filter it
    if (Array.isArray(data)) {
      return data.filter(filterValid)
    }

    // If it's an object, convert to array using Object.values()
    if (typeof data === 'object') {
      return Object.values(data).filter(filterValid)
    }

    return []
  }

  const actualAges = parseFormArray(actualAgesRaw, 0, 100)  // Ages 1-100
  const actualIncomes = parseFormArray(actualIncomesRaw, 0, Infinity)  // Any positive income

  // Calculate MAS readiness using hook (with IWAA support)
  const masReadiness = useMasReadiness({
    effectiveIncome,
    age: Number(age),
    ages: actualAges.length > 0 ? actualAges : undefined,
    incomes: actualIncomes.length > 0 ? actualIncomes : undefined,
    propertyValue: Number(propertyValue),
    propertyType: propertyType,
    totalMonthlyCommitments,
    loanAmount: instantCalcResult?.maxLoanAmount || 0
  })

  // Watch refinance fields explicitly for useMemo dependencies
  const refinancePriceRange = useWatch({ control, name: 'priceRange' })
  const refinanceOutstandingLoan = useWatch({ control, name: 'outstandingLoan' })
  const refinanceCurrentRate = useWatch({ control, name: 'currentRate' })
  const refinanceMonthsRemaining = useWatch({ control, name: 'monthsRemaining' })
  const refinancePropertyType = useWatch({ control, name: 'propertyType' })
  const refinanceOwnerOccupied = useWatch({ control, name: 'ownerOccupied' })
  const refinanceGoals = useWatch({ control, name: 'refinancingGoals' })

  // Calculate refinance outlook for Step 3 sidebar (refinance only)
  const refinanceOutlookResult = useMemo(() => {
    if (loanType !== 'refinance') return null

    const propertyValue = refinancePriceRange
    const outstandingLoan = refinanceOutstandingLoan

    if (!propertyValue || !outstandingLoan) return null

    const selectedGoals = Array.isArray(refinanceGoals) ? refinanceGoals : []
    const primaryGoal = selectedGoals.find(g => g !== 'cash_out') ?? 'lower_monthly_payment'

    const mapGoalToObjective = (goal: string) => {
      switch (goal) {
        case 'shorten_tenure': return 'shorten_tenure' as const
        case 'rate_certainty': return 'rate_certainty' as const
        case 'cash_out': return 'cash_out' as const
        default: return 'lower_payment' as const
      }
    }

    return calculateRefinanceOutlook({
      property_value: propertyValue,
      current_balance: outstandingLoan,
      current_rate: refinanceCurrentRate || 0,
      months_remaining: refinanceMonthsRemaining || 0,
      property_type: refinancePropertyType || 'Private',
      is_owner_occupied: refinanceOwnerOccupied !== false,
      objective: mapGoalToObjective(primaryGoal),
      outstanding_loan: outstandingLoan
    })
  }, [
    loanType,
    refinancePriceRange,
    refinanceOutstandingLoan,
    refinanceCurrentRate,
    refinanceMonthsRemaining,
    refinancePropertyType,
    refinanceOwnerOccupied,
    refinanceGoals
  ])

  // Calculate refinance data availability for sidebar loading state
  const refinanceDataAvailable = Boolean(
    loanType === 'refinance' &&
    refinancePriceRange &&
    refinanceOutstandingLoan
  )

  const personaVersion = 'dr_elena_v2'

  const propertyTypeOptions = useMemo(
    () => getPropertyTypeOptions(loanType, propertyCategory),
    [loanType, propertyCategory]
  )

  const refinancePropertyTypeOptions = useMemo(
    () => getPropertyTypeOptions('refinance'),
    []
  )

  const shouldShowPropertyTypeSelect =
    loanType === 'new_purchase' &&
    propertyCategory !== null &&
    propertyCategory !== 'bto' &&
    propertyCategory !== 'commercial'

  const showOptionalContextToggle =
    loanType === 'new_purchase' && propertyCategory === 'new_launch'

  // Timer cleanup removed (auto-advance disabled per spec)

  // Analytics hooks
  const publishEvent = useEventPublisher()
  const createEvent = useCreateEvent(sessionId)

  const handleLtvSelection = useCallback((mode: number) => {
    if (ltvMode === mode) {
      return
    }

    setLtvMode(mode)
    calculateInstant({ force: true, ltvMode: mode })

    const trackLtvToggle = async () => {
      try {
        const event = createEvent(
          FormEvents.FIELD_CHANGED,
          `session-${sessionId}`,
          {
            loanType,
            personaVersion,
            ltvMode: mode,
            action: 'selected',
            section: 'ltv_toggle',
            timestamp: new Date()
          }
        )
        await publishEvent(event)
      } catch (error) {
        console.warn('Analytics event failed:', error)
      }
    }

    trackLtvToggle()
  }, [ltvMode, calculateInstant, createEvent, loanType, personaVersion, publishEvent, sessionId])

  // Calculate LTV comparison data based on current form values and selected LTV mode using audited calculator
  const ltvComparisonData = useMemo(() => {
    if (!fieldValues.priceRange && !fieldValues.propertyValue) return null

    // Handle both new purchase and refinance property values
    const propertyValue = parseFormattedNumber(
      (fieldValues.priceRange || fieldValues.propertyValue)?.toString() || '0'
    )
    const income = parseFormattedNumber(fieldValues.income?.toString() || '0')
    const commitments = parseFormattedNumber(fieldValues.commitments?.toString() || '500')

    if (!propertyValue || !income) return null

    try {
      // For new purchase scenarios, use the 75% LTV calculator result as base
      if (loanType === 'new_purchase' && instantCalcResult) {
        const selectedProfile = calculateInstantProfile(
          {
            property_price: propertyValue,
            property_type: fieldValues.propertyType || 'HDB',
            buyer_profile: fieldValues.buyerProfile || 'SC',
            existing_properties: Number(fieldValues.existingProperties) || 0,
            income,
            commitments,
            rate: 3.6,
            tenure: 25,
            age: Number(fieldValues.combinedAge) || 35,
            loan_type: 'new_purchase',
            is_owner_occupied: true
          },
          ltvMode // Use selected LTV mode
        )

        // Calculate monthly payment using the selected LTV mode
        const monthlyPayment = roundMonthlyPayment(
          selectedProfile.maxLoan * (0.028 / 12) * Math.pow(1 + 0.028 / 12, 25 * 12) / 
          (Math.pow(1 + 0.028 / 12, 25 * 12) - 1)
        )

        return {
          maxLoan: selectedProfile.maxLoan,
          downpayment: propertyValue - selectedProfile.maxLoan,
          monthlyPayment,
          limitingFactor: selectedProfile.limitingFactor
        }
      }

      // Fallback: use basic calculation for refinance or missing instantCalcResult
      const selectedProfile = calculateInstantProfile(
        {
          property_price: propertyValue,
          property_type: fieldValues.propertyType || 'Private',
          buyer_profile: fieldValues.buyerProfile || 'SC',
          existing_properties: Number(fieldValues.existingProperties) || 0,
          income,
          commitments,
          rate: 3.6,
          tenure: 25,
          age: Number(fieldValues.combinedAge) || 35,
          loan_type: (loanType === 'commercial' ? 'new_purchase' : loanType) || 'new_purchase',
          is_owner_occupied: true
        },
        ltvMode
      )

      const monthlyPayment = roundMonthlyPayment(
        selectedProfile.maxLoan * (0.028 / 12) * Math.pow(1 + 0.028 / 12, 25 * 12) / 
        (Math.pow(1 + 0.028 / 12, 25 * 12) - 1)
      )

      return {
        maxLoan: selectedProfile.maxLoan,
        downpayment: propertyValue - selectedProfile.maxLoan,
        monthlyPayment,
        limitingFactor: selectedProfile.limitingFactor
      }
    } catch (error) {
      console.error('LTV comparison calculation failed:', error)
      return null
    }
  }, [fieldValues, loanType, ltvMode, instantCalcResult])

  useEffect(() => {
    if (loanType !== 'new_purchase') {
      return
    }

    const currentValue = watch('propertyType')

    if (propertyCategory === 'bto') {
      if (currentValue !== 'HDB') {
        setValue('propertyType', 'HDB')
        onFieldChange('propertyType', 'HDB')
      }
      return
    }

    if (propertyCategory === 'commercial') {
      if (currentValue !== 'Commercial') {
        setValue('propertyType', 'Commercial')
        onFieldChange('propertyType', 'Commercial')
      }
      return
    }

    const validValues = propertyTypeOptions.map(option => option.value)
    if (validValues.length === 0) {
      return
    }

    // Clear property type if invalid, but don't auto-select (user must choose)
    if (currentValue && !validValues.includes(currentValue)) {
      setValue('propertyType', '')
      onFieldChange('propertyType', '')
    }
  }, [loanType, propertyCategory, propertyTypeOptions, setValue, watch, onFieldChange])

  useEffect(() => {
    if (!showOptionalContextToggle && showOptionalContext) {
      setShowOptionalContext(false)
    }
  }, [showOptionalContextToggle, showOptionalContext])

  // Progress calculation
  const progressPercentage = ((currentStep + 1) / formSteps.length) * 100

  // Analytics: Track step transitions
  useEffect(() => {
    const trackStepTransition = async (step: number, action: 'started' | 'completed') => {
      try {
        const event = createEvent(
          action === 'started' ? FormEvents.STEP_STARTED : FormEvents.STEP_COMPLETED,
          `session-${sessionId}`,
          {
            loanType,
            step,
            stepName: formSteps[step]?.label || `Step ${step + 1}`,
            action,
            timestamp: new Date()
          }
        )
        await publishEvent(event)
      } catch (error) {
        console.warn('Analytics event failed:', error)
      }
    }

    // Throttling to prevent duplicate events on re-render
    const stepTimeKey = `step-started-${currentStep}`
    const lastEmitTime = stepTrackerRef.current[stepTimeKey]
    const currentTime = Date.now()
    
    // Only emit event if it's been more than 1 second since last emission for this step
    if (!lastEmitTime || currentTime - lastEmitTime > 1000) {
      stepTrackerRef.current[stepTimeKey] = currentTime
      trackStepTransition(currentStep, 'started')
    }
  }, [currentStep, sessionId, loanType, createEvent, publishEvent])

  const canSubmitCurrentStep = isValid


  // Helper function to calculate liabilities total (credit_card, overdraft, guarantor formulas)
  const calculateTotalLiabilities = (creditCardCount: number, existingCommitments: number, employmentType: string, monthlyIncome?: number) => {
    // Credit card minimum payments: 3% of credit limit or S$50 minimum, whichever is higher
    const creditCardPayments = Math.max(creditCardCount * 50, creditCardCount * 3000 * 0.03)
    
    // Total monthly commitments
    const totalCommitments = creditCardPayments + existingCommitments
    
    // Apply income recognition based on employment type with safeguard for negative income
    const recognitionRate = getEmploymentRecognitionRate(employmentType)
    const recognizedIncome = monthlyIncome && monthlyIncome > 0 ? monthlyIncome * recognitionRate : 0
    
    return {
      creditCardPayments,
      existingCommitments,
      totalCommitments,
      recognizedIncome,
      recognitionRate,
      tdsrImpact: monthlyIncome ? (totalCommitments / recognizedIncome) * 100 : 0
    }
  }

  // Manual optional context toggle - REMOVED AUTO-ADVANCE (per spec)
  // Users now control when to expand optional context themselves
  useEffect(() => {
    if (!showInstantCalc || !instantCalcResult) return

    const trackTier2Display = async () => {
      try {
        const event = createEvent(
          FormEvents.PROCESSING_TIER_COMPLETED,
          `session-${sessionId}`,
          {
            loanType,
            personaVersion,
            ltvMode,
            tier: 2,
            hasResult: true,
            resultType: loanType === 'new_purchase' ? 'max_loan' : 'monthly_savings',
            fieldState: {
              hasInstantCalc: true,
              instantCalcResult
            },
            timestamp: new Date()
          }
        )
        await publishEvent(event)
      } catch (error) {
        console.warn('Analytics event failed:', error)
      }
    }

    trackTier2Display()
  }, [showInstantCalc, instantCalcResult, loanType, sessionId, createEvent, publishEvent, ltvMode])

  // Sync showJointApplicant with form field value
  useEffect(() => {
    setShowJointApplicant(fieldValues.hasJointApplicant || false)
  }, [fieldValues.hasJointApplicant])

  // Get current step config
  const currentStepConfig = formSteps[currentStep] || formSteps[0]

  // Handle form submission for current step
  const handleStepSubmit = handleSubmit(async (data) => {
    console.log('✅ Form validation passed, submitting step', { currentStep, data })
    await next(data)
  }, (errors) => {
    console.error('❌ Form validation failed:', { currentStep, errors })
    console.log('Current form values:', watch())
  })

  /**
   * Translates Dr Elena v2 persona codes into user-friendly summary
   *
   * @param calcResult - Result from calculateNewPurchaseProfile
   * @returns 1-2 sentence summary explaining the result in plain English
   */
  const generateUserFriendlySummary = useCallback((calcResult: any): string => {
    const summaryParts: string[] = []

    // Start with primary limiting factor
    if (calcResult.limitingFactor === 'MSR') {
      summaryParts.push('Based on your income, you can borrow comfortably within MSR guidelines.')
    } else if (calcResult.limitingFactor === 'TDSR') {
      summaryParts.push('Your loan amount is optimized for healthy debt servicing.')
    } else if (calcResult.limitingFactor === 'LTV') {
      summaryParts.push('Loan amount is set by property price and loan-to-value limits.')
    }

    // Add tenure context if capped
    const tenureCapped = calcResult.reasonCodes?.includes('tenure_cap_property_limit') ||
                         calcResult.reasonCodes?.includes('tenure_cap_age_limit')

    if (tenureCapped) {
      summaryParts.push('Your loan tenure is capped at 25 years per MAS regulations.')
    }

    // Add CPF context if applicable
    const cpfAllowed = calcResult.cpfAllowedAmount > 0
    if (cpfAllowed) {
      summaryParts.push('You can use CPF for your down payment.')
    }

    return summaryParts.join(' ')
  }, [])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Who You Are
        return (
          <div className="space-y-5">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <label 
                    htmlFor="full-name"
                    className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                  >
                    Full Name *
                  </label>
                  <Input
                    {...field}
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    onChange={(e) => {
                      field.onChange(e)
                      onFieldChange('name', e.target.value)
                    }}
                  />
                  {errors.name && (
                    <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.name)}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div>
                  <label 
                    htmlFor="email"
                    className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                  >
                    Email Address *
                  </label>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    onChange={(e) => {
                      field.onChange(e)
                      onFieldChange('email', e.target.value)
                    }}
                  />
                  {errors.email && (
                    <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.email)}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <div>
                  <label 
                    htmlFor="phone"
                    className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                  >
                    Phone Number *
                  </label>
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="91234567"
                    onChange={(e) => {
                      field.onChange(e)
                      onFieldChange('phone', e.target.value)
                    }}
                  />
                  {errors.phone && (
                    <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.phone)}</p>
                  )}
                </div>
              )}
            />
          </div>
        )

      case 2: // What You Need
        return (
          <div className="space-y-5">
            {loanType === 'new_purchase' && (
              <Controller
                name="propertyCategory"
                control={control}
                render={({ field }) => (
                  <div>
                    <label 
                      htmlFor="property-category"
                      className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                    >
                      Property Category *
                    </label>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        onFieldChange('propertyCategory', value)
                        setPropertyCategory(value as any)
                      }}
                    >
                      <SelectTrigger id="property-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyCategoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} - {option.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.propertyCategory && (
                      <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.propertyCategory)}</p>
                    )}
                  </div>
                )}
              />
            )}

            {loanType === 'new_purchase' && (
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => {
                  if (!shouldShowPropertyTypeSelect) {
                    return <></>
                  }

                  return (
                    <div>
                      <label 
                        htmlFor="property-type"
                        className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                      >
                        Property Type *
                      </label>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          onFieldChange('propertyType', value)

                          // Reset existingProperties to 0 when switching to HDB (can't own 2 HDBs)
                          if (value === 'HDB') {
                            setValue('existingProperties', 0)
                            calculateInstant({ force: true })
                          }
                        }}
                      >
                        <SelectTrigger id="property-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.propertyType && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.propertyType)}</p>
                      )}
                    </div>
                  )
                }}
              />
            )}

            {/* Show property type selector for refinance */}
            {loanType === 'refinance' && (
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <div>
                    <label 
                      htmlFor="property-type"
                      className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                    >
                      Property Type *
                    </label>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        onFieldChange('propertyType', value)

                        // Reset existingProperties to 0 when switching to HDB (can't own 2 HDBs)
                        if (value === 'HDB') {
                          setValue('existingProperties', 0)
                        }
                      }}
                    >
                      <SelectTrigger id="property-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {refinancePropertyTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.propertyType && (
                      <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.propertyType)}</p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Progressive disclosure: Show remaining fields ONLY after propertyType selected */}
            {loanType === 'new_purchase' && fieldValues.propertyType && (
              <>
                {/* Property Ownership - Only show for Private/EC/Landed (HDB buyers can't own 2 HDBs) */}
                {(fieldValues.propertyType === 'Private' ||
                  fieldValues.propertyType === 'EC' ||
                  fieldValues.propertyType === 'Landed') && (
                  <Controller
                    name="existingProperties"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3 p-3 bg-[#F8F8F8] rounded-lg border border-[#E5E5E5]">
                    <input
                      type="checkbox"
                      id="second-property"
                      checked={field.value === 1}
                      onChange={(e) => {
                        const newValue = e.target.checked ? 1 : 0
                        field.onChange(newValue)
                        onFieldChange('existingProperties', newValue)
                        calculateInstant({ force: true })
                      }}
                      className="w-4 h-4 text-nextnest-primary border-gray-300 rounded focus:ring-nextnest-primary"
                    />
                    <label
                      htmlFor="second-property"
                      className="text-sm text-[#666666] cursor-pointer flex-1"
                    >
                      I&apos;m keeping my current property <span className="text-xs text-[#999999]">(second home, LTV capped at 45%)</span>
                    </label>
                  </div>
                    )}
                  />
                )}

                <Controller
                  name="priceRange"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label 
                        htmlFor="property-price"
                        className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                      >
                        Property Price *
                      </label>
                      <Input
                        {...field}
                        id="property-price"
                        type="text"
                        className="font-mono"
                        placeholder="500,000"
                        value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                        onChange={(e) => {
                          const parsedValue = parseFormattedNumber(e.target.value) || 0
                          console.log('[PRICE INPUT] onChange fired:', { rawValue: e.target.value, parsedValue })
                          field.onChange(parsedValue)
                          onFieldChange('priceRange', parsedValue)
                        }}
                      />
                      {errors.priceRange && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.priceRange)}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="combinedAge"
                  control={control}
                  render={({ field, fieldState, formState }) => {
                    console.log('🔍 CONTROLLER RENDER combinedAge:', {
                      fieldValue: field.value,
                      fieldValueType: typeof field.value,
                      error: fieldState.error,
                      isDirty: fieldState.isDirty,
                      isTouched: fieldState.isTouched,
                      isValidating: formState.isValidating
                    })

                    return (
                      <div>
                        <label
                          htmlFor="combined-age"
                          className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                        >
                          Combined Age *
                        </label>
                        <Input
                          name={field.name}
                          ref={field.ref}
                          id="combined-age"
                          type="number"
                          min="18"
                          max="99"
                          step="1"
                          placeholder="35"
                          value={field.value ?? ''} // Convert undefined to empty string for controlled input
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : parseInt(e.target.value)
                            console.log('🔧 combinedAge onChange:', { raw: e.target.value, parsed: value, type: typeof value })
                            field.onChange(value)
                            onFieldChange('combinedAge', value)
                          }}
                          onBlur={field.onBlur}
                        />
                        {errors.combinedAge && (
                          <p className="text-[#EF4444] text-xs mt-1">
                            {getErrorMessage(errors.combinedAge)}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
              </>
            )}

            {loanType === 'refinance' && (
              <>
                <Controller
                  name="currentRate"
                  control={control}
                  render={({ field, fieldState, formState }) => {
                    console.log('🔍 CONTROLLER RENDER currentRate:', {
                      fieldValue: field.value,
                      fieldValueType: typeof field.value,
                      error: fieldState.error,
                      isDirty: fieldState.isDirty,
                      isTouched: fieldState.isTouched,
                      isValidating: formState.isValidating
                    })

                    return (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                          Current Interest Rate (%) *
                        </label>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="3.0"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : parseFloat(e.target.value)
                            console.log('🔧 currentRate onChange:', { raw: e.target.value, parsed: value, type: typeof value })
                            field.onChange(value)
                          }}
                        />
                        {errors.currentRate && (
                          <p className="text-[#EF4444] text-xs mt-1">
                            {getErrorMessage(errors.currentRate)}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />

                <Controller
                  name="outstandingLoan"
                  control={control}
                  render={({ field, fieldState, formState }) => {
                    console.log('🔍 CONTROLLER RENDER outstandingLoan:', {
                      fieldValue: field.value,
                      fieldValueType: typeof field.value,
                      error: fieldState.error,
                      isDirty: fieldState.isDirty,
                      isTouched: fieldState.isTouched,
                      isValidating: formState.isValidating
                    })

                    return (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                          Outstanding Loan Amount *
                        </label>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          className="font-mono"
                          placeholder="400,000"
                          value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                          onChange={(e) => {
                            const parsedValue = parseFormattedNumber(e.target.value) || 0
                            console.log('🔧 outstandingLoan onChange:', { raw: e.target.value, parsed: parsedValue, type: typeof parsedValue })
                            field.onChange(parsedValue)
                          }}
                        />
                        {errors.outstandingLoan && (
                          <p className="text-[#EF4444] text-xs mt-1">
                            {getErrorMessage(errors.outstandingLoan)}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />

                <Controller
                  name="currentBank"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Current Bank *
                      </label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dbs">DBS</SelectItem>
                          <SelectItem value="ocbc">OCBC</SelectItem>
                          <SelectItem value="uob">UOB</SelectItem>
                          <SelectItem value="maybank">Maybank</SelectItem>
                          <SelectItem value="cimb">CIMB</SelectItem>
                          <SelectItem value="hsbc">HSBC</SelectItem>
                          <SelectItem value="sc">Standard Chartered</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.currentBank && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.currentBank)}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="priceRange"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Current Property Value *
                      </label>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        className="font-mono"
                        placeholder="800,000"
                        value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                        onChange={(e) => {
                          const parsedValue = parseFormattedNumber(e.target.value) || 0
                          field.onChange(parsedValue)
                          onFieldChange('priceRange', parsedValue)
                        }}
                      />
                      {errors.priceRange && (
                        <p className="text-[#EF4444] text-xs mt-1">
                          {getErrorMessage(errors.priceRange)}
                        </p>
                      )}
                    </div>
                  )}
                />
              </>
            )}

            {/* Show instant calculation result if available */}
            {isInstantCalcLoading && (
              <div className="mt-6 p-6 bg-[#F8F8F8] border border-[#E5E5E5] animate-pulse">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                  <span>Analyzing...</span>
                </div>
                <p className="text-xs text-[#666666] mt-2">
                  Dr Elena is calibrating your persona-aligned loan estimate. This takes about a second.
                </p>
              </div>
            )}

            {/* 
              ========================================
              MOBILE RESPONSIVE TESTING CHECKLIST
              ========================================
              
              Test the following viewports BEFORE merge:
              
              1. 320px viewport (iPhone SE)
                 - Verify no horizontal scroll
                 - Check calculation card fits width
                 - Verify caveats list readable
              
              2. 375px viewport (iPhone 12/13)
                 - Check spacing between elements
                 - Verify button sizes (min 44px height)
                 - Test caveat text wrapping
              
              3. 390px viewport (standard mobile)
                 - Verify heading font sizes
                 - Check max loan amount visibility
                 - Test CTA link tapability
              
              4. Touch targets
                 - All buttons minimum 44px (iOS guideline)
                 - Links have adequate spacing
                 - Checkbox has 44px touch area
              
              5. Readability
                 - Text minimum 14px on mobile
                 - Adequate line-height for lists
                 - Color contrast meets WCAG AA
              
              Test command: npm run dev, open DevTools, test responsive mode
              ========================================
            */}
            {showOptionalContextToggle && (
              <div className="mt-6 border-t border-[#E5E5E5] pt-6">
                {/* Optional Context Block */}
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !showOptionalContext
                    setShowOptionalContext(newValue)

                    // Analytics: Track optional context expansion
                    const trackOptionalContext = async () => {
                      try {
                        const event = createEvent(
                      FormEvents.USER_HESITATED,
                      `session-${sessionId}`,
                      {
                        loanType,
                        personaVersion,
                        ltvMode,
                        action: newValue ? 'expanded' : 'collapsed',
                        section: 'optional_context',
                            fieldState: { showOptionalContext: newValue },
                            timestamp: new Date()
                          }
                        )
                        await publishEvent(event)
                      } catch (error) {
                        console.warn('Analytics event failed:', error)
                      }
                    }
                    trackOptionalContext()
                  }}
                  className="w-full flex items-center justify-between p-4 bg-[#F8F8F8] border border-[#E5E5E5] hover:bg-[#E5E5E5] transition-colors duration-300"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`w-4 h-4 text-[#666666] transition-transform duration-300 ${
                        showOptionalContext ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="text-sm text-[#666666]">Add optional context</span>
                  </div>
                  <span className="text-xs text-[#666666]">For better personalization</span>
                </button>

                {showOptionalContext && (
                  <div className="space-y-4 mt-4 p-4 bg-[#F8F8F8] border border-[#E5E5E5]">
                    <Controller
                      name="developmentName"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label
                            htmlFor="development-name"
                            className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                          >
                            Development Name (Optional)
                          </label>
                          <Input
                            {...field}
                            id="development-name"
                            type="text"
                            placeholder="e.g., The Tampines Condo"
                            onChange={(e) => {
                              field.onChange(e)
                              onFieldChange('developmentName', e.target.value)
                            }}
                          />
                          <p className="text-xs text-[#666666] mt-1">
                            Help us understand the specific property you&apos;re considering
                          </p>
                        </div>
                      )}
                    />

                    <Controller
                      name="paymentScheme"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label
                            htmlFor="payment-scheme"
                            className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                          >
                            Preferred Payment Scheme (Optional)
                          </label>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              onFieldChange('paymentScheme', value)
                            }}
                          >
                            <SelectTrigger id="payment-scheme">
                              <SelectValue placeholder="Select payment scheme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash Payment</SelectItem>
                              <SelectItem value="cpf_plus_cash">CPF + Cash</SelectItem>
                              <SelectItem value="full_cpf">Full CPF</SelectItem>
                              <SelectItem value="bank_loan">Bank Loan</SelectItem>
                              <SelectItem value="not_sure">Not sure yet</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-[#666666] mt-1">
                            This helps us tailor loan recommendations to your preferences
                          </p>
                        </div>
                      )}
                    />

                    <Controller
                      name="unitType"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label
                            htmlFor="unit-type"
                            className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                          >
                            Unit Type (Optional)
                          </label>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              onFieldChange('unitType', value)
                            }}
                          >
                            <SelectTrigger id="unit-type">
                              <SelectValue placeholder="Select unit type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-bedroom">1 Bedroom</SelectItem>
                              <SelectItem value="2-bedroom">2 Bedroom</SelectItem>
                              <SelectItem value="3-bedroom">3 Bedroom</SelectItem>
                              <SelectItem value="4-bedroom">4 Bedroom</SelectItem>
                              <SelectItem value="penthouse">Penthouse</SelectItem>
                              <SelectItem value="not_sure">Not sure yet</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-[#666666] mt-1">
                            Helps us estimate size-based loan adjustments
                          </p>
                        </div>
                      )}
                    />

                    <Controller
                      name="topDate"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label
                            htmlFor="top-date"
                            className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                          >
                            Expected TOP Date (Optional)
                          </label>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              onFieldChange('topDate', value)
                            }}
                          >
                            <SelectTrigger id="top-date">
                              <SelectValue placeholder="Select TOP date" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                              <SelectItem value="2027">2027</SelectItem>
                              <SelectItem value="2028">2028</SelectItem>
                              <SelectItem value="2029">2029</SelectItem>
                              <SelectItem value="not_sure">Not sure yet</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-[#666666] mt-1">
                            Knowing your TOP helps us align payment milestones
                          </p>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Mobile: Inline instant analysis card */}
            {currentStep === 2 && isMobile && instantCalcResult && (
              <div className="mt-6 p-4 border border-[#E5E5E5] bg-white rounded-lg">
                <InstantAnalysisSidebar
                  calcResult={instantCalcResult}
                  loanType={loanType}
                  isLoading={isInstantCalcLoading}
                />
              </div>
            )}
          </div>
        )

      case 3: // Your Finances
        return (
          <div className="space-y-5">
            {/* Joint Applicant Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#F8F8F8] border border-[#E5E5E5]">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-black">
                  Adding a joint applicant?
                </label>
                <p className="text-xs text-[#666666]">
                  Increase borrowing power with combined income
                </p>
              </div>
              <Controller
                name="hasJointApplicant"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => {
                        const newValue = !field.value
                        
                        // Clear Applicant 2 data when disabling joint applicant
                        if (!newValue) {
                          setValue('actualIncomes.1', undefined)
                          setValue('actualAges.1', undefined)
                          setValue('applicant2Commitments', undefined)
                          onFieldChange('actualIncomes.1', undefined)
                          onFieldChange('actualAges.1', undefined)
                          onFieldChange('applicant2Commitments', undefined)
                        }
                        
                        field.onChange(newValue)
                        setShowJointApplicant(newValue)
                        onFieldChange('hasJointApplicant', newValue, {
                          action: newValue ? 'enabled' : 'disabled',
                          section: 'joint_applicant',
                          fieldState: { hasJointApplicant: newValue }
                        })
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        field.value ? 'bg-[#FCD34D]' : 'bg-[#E5E5E5]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          field.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-[#666666]">
                      {field.value ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              />
            </div>

            {loanType === 'new_purchase' ? (
              <Step3NewPurchase
                onFieldChange={onFieldChange}
                showJointApplicant={showJointApplicant}
                errors={errors}
                getErrorMessage={getErrorMessage}
                control={control}
                instantCalcResult={instantCalcResult}
                masReadiness={masReadiness}
              />
            ) : (
              <Step3Refinance
                onFieldChange={onFieldChange}
                showJointApplicant={showJointApplicant}
                errors={errors}
                getErrorMessage={getErrorMessage}
                control={control}
              />
            )}

            {/* Mobile: Inline MAS readiness card */}
            {currentStep === 3 && isMobile && loanType === 'new_purchase' && (
              <div className="mt-6 p-4 border border-[#E5E5E5] bg-white rounded-lg">
                <MasReadinessSidebar result={masReadiness} />
              </div>
            )}

            {/* Mobile: Inline refinance outlook card */}
            {currentStep === 3 && isMobile && loanType === 'refinance' && refinanceOutlookResult && (
              <div className="mt-6 p-4 border border-[#E5E5E5] bg-white rounded-lg">
                <RefinanceOutlookSidebar
                  outlookResult={refinanceOutlookResult}
                  isLoading={!refinanceDataAvailable}
                />
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Render chat widget if form is completed
  if (showChatTransition) {
    return (
      <ChatTransitionScreen
        formData={{
          name: fieldValues.name || '',
          email: fieldValues.email || '',
          phone: fieldValues.phone || '',
          loanType: loanType || 'new_purchase',
          propertyCategory: fieldValues.propertyCategory,
          propertyType: fieldValues.propertyType,
          actualAges: Array.isArray(fieldValues.actualAges)
            ? fieldValues.actualAges.filter((v): v is number => typeof v === 'number')
            : (fieldValues.actualAges ? Object.values(fieldValues.actualAges).filter((v): v is number => typeof v === 'number') : []),
          actualIncomes: Array.isArray(fieldValues.actualIncomes)
            ? fieldValues.actualIncomes.filter((v): v is number => typeof v === 'number')
            : (fieldValues.actualIncomes ? Object.values(fieldValues.actualIncomes).filter((v): v is number => typeof v === 'number') : []),
          employmentType: fieldValues.employmentType,
          hasExistingLoan: fieldValues.hasExistingLoan,
          existingLoanDetails: fieldValues.existingLoanDetails
        }}
        leadScore={leadScore}
        sessionId={sessionId}
        onTransitionComplete={(conversationId) => {
          console.log('Chat transition complete:', conversationId)
          // Navigate to chat page with conversation ID
          window.location.href = `/chat?conversation=${conversationId}`
        }}
        onFallbackRequired={(fallbackData) => {
          console.log('Fallback required:', fallbackData)
        }}
      />
    )
  }

  return (
    <div className="w-full">
      {/* Progress Indicator - outside grid */}
      <div className={cn('mb-8 w-full max-w-2xl mx-auto', className)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-black">
            Step {currentStep + 1} of {formSteps.length}: {currentStepConfig.label}
          </h3>
          <span className="text-xs text-[#666666]">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-1" />
      </div>

      {/* Unified container for headline + form + sidebar */}
      <div className="w-full max-w-6xl mx-auto">
        <div className="rounded-lg border border-[#E5E5E5]/50 bg-white/40 backdrop-blur-sm p-8 md:p-10 shadow-sm">
          {/* Step headline inside container */}
          <h2 className="text-3xl md:text-4xl font-normal text-black mb-8 leading-tight text-center">
            {currentStepConfig.description}
          </h2>

          {/* Grid with form + sidebar */}
          <ResponsiveFormLayout
            sidebar={
              currentStep === 2 ? (
                <InstantAnalysisSidebar
                  calcResult={instantCalcResult}
                  loanType={loanType}
                  isLoading={isInstantCalcLoading}
                />
              ) : currentStep === 3 && loanType === 'new_purchase' ? (
              <MasReadinessSidebar result={masReadiness} />
            ) : currentStep === 3 && loanType === 'refinance' ? (
              <RefinanceOutlookSidebar
                outlookResult={refinanceOutlookResult}
                isLoading={!refinanceDataAvailable}
              />
            ) : null
            }
            showSidebar={
              (currentStep === 2 && Boolean(instantCalcResult)) ||
              (currentStep === 3 && (loanType === 'new_purchase' || loanType === 'refinance'))
            }
          >
            <form onSubmit={handleStepSubmit}>
              <div className="space-y-6">
                {renderStepContent()}

            {/* Trust Signals */}
            {trustSignalsShown.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
                <div className="flex items-center gap-2 text-xs text-[#666666]">
                  <Shield className="w-3 h-3" />
                  <span>Bank-level security • PDPA compliant • No spam guarantee</span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prev}
                  className="h-12 px-6"
                >
                  Back
                </Button>
              )}

              <Button
                type="submit"
                className="h-12 px-8 bg-[#FCD34D] text-black hover:bg-[#FBB614] flex-1 ml-auto"
                disabled={!canSubmitCurrentStep || isSubmitting || isExternallySubmitting}
              >
                {isSubmitting || isExternallySubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse">Processing...</span>
                  </span>
                ) : (
                  currentStepConfig.ctaText
                )}
              </Button>
            </div>

            {/* Error Display */}
            {submissionError && (
              <div className="mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm">
                <AlertTriangle className="inline-block w-4 h-4 mr-2" />
                {submissionError}
              </div>
            )}
              </div>
            </form>
          </ResponsiveFormLayout>
        </div>
      </div>
    </div>
  )
}
