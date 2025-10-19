/**
 * Headless Progressive Form Controller
 * Phase B-0.1: Bloomberg Terminal Design System Implementation
 *
 * This hook separates business logic from UI presentation
 * Provides a typed interface for any UI implementation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, useWatch, Control, UseFormRegister, UseFormHandleSubmit, UseFormWatch, UseFormSetValue, UseFormTrigger } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LeadForm } from '@/lib/domains/forms/entities/LeadForm'
import { createStepSchema } from '@/lib/validation/mortgage-schemas'
import { FormStep, LeadScore, AIInsightResponse, LoanType } from '@/lib/contracts/form-contracts'
import { conversionTracker } from '@/lib/analytics/conversion-tracking'
import { eventBus, FormEvents, useEventPublisher, useCreateEvent } from '@/lib/events/event-bus'
import {
  calculateInstantProfile,
  roundMonthlyPayment,
  calculateRefinanceOutlook,
  calculateRefinancingSavings,
  calculateIWAA,
  getPlaceholderRate
} from '@/lib/calculations/instant-profile'
import { formSteps, getDefaultValues } from '@/lib/forms/form-config'

// Interface for the controller's return value
export interface ProgressiveFormController {
  // State
  currentStep: number
  completedSteps: number[]
  errors: any
  isValid: boolean
  isAnalyzing: boolean
  isInstantCalcLoading: boolean
  isSubmitting: boolean
  instantCalcResult: any
  leadScore: number
  propertyCategory: 'resale' | 'new_launch' | 'bto' | 'commercial' | null
  fieldValues: Record<string, any>
  trustSignalsShown: string[]
  showInstantCalc: boolean

  // React Hook Form
  control: Control<any>
  register: UseFormRegister<any>
  handleSubmit: UseFormHandleSubmit<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  trigger: UseFormTrigger<any>

  // Actions
  next: (data: any) => Promise<void>
  prev: () => void
  onFieldChange: (name: string, value: any, context?: FieldChangeContext) => void
  requestAIInsight: (fieldName: string, value: any) => Promise<void>
  setPropertyCategory: (category: 'resale' | 'new_launch' | 'bto' | 'commercial' | null) => void
  calculateInstant: (options?: { force?: boolean; ltvMode?: number }) => void
}

interface FieldChangeContext {
  action?: string
  section?: string
  fieldState?: Record<string, any>
  tier?: number
  metadata?: Record<string, any>
}

interface UseProgressiveFormControllerProps {
  loanType: LoanType
  sessionId: string
  onStepCompletion?: (step: number, data: any) => void
  onAIInsight?: (insight: AIInsightResponse) => void
  onScoreUpdate?: (score: LeadScore) => void
  onFormComplete?: (data: any) => void
}

export function useProgressiveFormController({
  loanType,
  sessionId,
  onStepCompletion,
  onAIInsight,
  onScoreUpdate,
  onFormComplete
}: UseProgressiveFormControllerProps): ProgressiveFormController {
  // Initialize LeadForm domain entity
  const [leadForm] = useState(() => {
    const form = new LeadForm(sessionId)
    // Map 'new' to 'new_purchase' if needed (handle legacy values)
    const mappedLoanType = (loanType as any) === 'new' ? 'new_purchase' : loanType
    form.selectLoanType(mappedLoanType as LoanType)
    form.setFieldValue('loanType', mappedLoanType, 0)
    form.progressToStep(1)
    return form
  })

  // State management
  const [currentStep, setCurrentStep] = useState(1) // Start at step 1 (loan type already selected)
  const [completedSteps, setCompletedSteps] = useState<number[]>([0])
  const [propertyCategory, setPropertyCategory] = useState<'resale' | 'new_launch' | 'bto' | 'commercial' | null>('resale')
  const [leadScore, setLeadScore] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isInstantCalcLoading, setIsInstantCalcLoading] = useState(false)
  const [instantCalcResult, setInstantCalcResult] = useState<any>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [trustSignalsShown, setTrustSignalsShown] = useState<string[]>([])
  const [showInstantCalc, setShowInstantCalc] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const instantCalcTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (instantCalcTimerRef.current) {
        clearTimeout(instantCalcTimerRef.current)
      }
    }
  }, [])

  // Use ref to track previous values to prevent infinite loops
  const prevFieldValuesRef = useRef<string>('')
  const prevScoreFieldsRef = useRef<string>('')

  // Event publishing
  const publishEvent = useEventPublisher()
  const createEvent = useCreateEvent(sessionId)

  // React Hook Form setup
  const mappedLoanType = (loanType as any) === 'new' ? 'new_purchase' : loanType
  const currentSchema = createStepSchema(mappedLoanType, currentStep)
  const defaultValues = getDefaultValues(mappedLoanType as LoanType)

  const form = useForm<Record<string, any>>({
    resolver: zodResolver(currentSchema) as any,
    mode: 'onChange',
    defaultValues
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
    trigger,
    reset
  } = form

  const watchedFields = watch()


  // Lead scoring logic - FIXED: use ref to avoid infinite loops
  useEffect(() => {
    const fields = watchedFields
    
    // Create serialized snapshot of fields that affect scoring
    const scoreFields = JSON.stringify({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      propertyCategory: fields.propertyCategory,
      propertyType: fields.propertyType,
      propertyPrice: fields.propertyPrice,
      priceRange: fields.priceRange,
      monthlyIncome: fields.monthlyIncome,
      actualIncomes: fields.actualIncomes,
      employmentType: fields.employmentType,
      purchaseTimeline: fields.purchaseTimeline,
      lockInStatus: fields.lockInStatus,
      currentRate: fields.currentRate,
      // New refinance Step 3 fields
      refinancingGoals: fields.refinancingGoals,
      ownerOccupied: fields.ownerOccupied,
      monthsRemaining: fields.monthsRemaining
    })

    // Only recalculate if scoring fields actually changed
    if (scoreFields === prevScoreFieldsRef.current) {
      return
    }
    
    prevScoreFieldsRef.current = scoreFields

    let score = 0

    // Basic information scoring
    if (fields.name?.length > 2) score += 10
    if (fields.email?.includes('@')) score += 10
    if (fields.phone?.length >= 8) score += 10

    // Property details scoring (Step 2)
    if (fields.propertyCategory) score += 15
    if (fields.propertyType) score += 15
    if (fields.propertyPrice || fields.priceRange) score += 20

    // Financial details scoring (Step 3)
    if (fields.monthlyIncome > 0 || fields.actualIncomes?.[0] > 0) score += 15
    if (fields.employmentType === 'employed') score += 10
    if (fields.employmentType === 'self-employed') score += 8

    // Timeline urgency scoring
    if (fields.purchaseTimeline === 'immediate') score += 25
    if (fields.purchaseTimeline === 'next_3_months') score += 20
    if (fields.purchaseTimeline === 'next_6_months') score += 10

    // Refinancing specific scoring
    if (mappedLoanType === 'refinance') {
      if (fields.lockInStatus === 'ending_soon') score += 20
      if (fields.currentRate > 3.5) score += 15
    }

    const finalScore = Math.min(score, 100)
    setLeadScore(finalScore)

    if (onScoreUpdate) {
      onScoreUpdate({
        total: finalScore,
        urgency: finalScore * 0.4,
        value: finalScore * 0.4,
        qualification: finalScore * 0.2,
        breakdown: {
          urgencyFactors: {},
          valueFactors: {},
          qualificationFactors: {}
        },
        routing: finalScore >= 75 ? 'immediate' :
                 finalScore >= 50 ? 'priority' :
                 finalScore >= 25 ? 'standard' : 'nurture',
        confidence: 0.8,
        timestamp: new Date()
      })
    }
  }, [watchedFields, mappedLoanType, onScoreUpdate])

  // Track field values - FIXED: use ref to avoid infinite loops
  useEffect(() => {
    const currentValues = JSON.stringify(watchedFields)
    
    // Only update if values actually changed
    if (currentValues !== prevFieldValuesRef.current) {
      prevFieldValuesRef.current = currentValues
      setFieldValues(watchedFields)
    }
  }, [watchedFields])

  // Field change handler
  const onFieldChange = useCallback((name: string, value: any, context?: FieldChangeContext) => {
    setValue(name, value)
    leadForm.setFieldValue(name, value, currentStep)

    const inferredAction =
      typeof value === 'boolean'
        ? value ? 'enabled' : 'disabled'
        : value === null || value === undefined || value === ''
          ? 'cleared'
          : 'changed'

    const baseFieldState = { [name]: value }
    const fieldState = context?.fieldState
      ? { ...context.fieldState, ...baseFieldState }
      : baseFieldState

    const eventPayload: Record<string, any> = {
      loanType: mappedLoanType,
      fieldName: name,
      fieldValue: value,
      fieldState,
      step: currentStep,
      action: context?.action ?? inferredAction,
      section: context?.section,
      tier: context?.tier,
      timestamp: new Date(),
      ...context?.metadata
    }

    // Publish field change event
    publishEvent(createEvent(
      FormEvents.FIELD_CHANGED,
      `session-${sessionId}`,
      eventPayload
    ))

    // Track conversion - field interaction tracking
    // Note: trackFieldInteraction method not available in current ConversionTracker
    // conversionTracker.trackFieldInteraction(name, currentStep)
  }, [currentStep, setValue, leadForm, publishEvent, createEvent, sessionId, mappedLoanType])

  // Calculate instant results
  const calculateInstant = useCallback((options: { force?: boolean; ltvMode?: number } = {}) => {
    const { force = false, ltvMode: ltvOverride } = options
    if (hasCalculated && !force) return

    const formData = watchedFields
    let result = null

    if (mappedLoanType === 'new_purchase') {
      const parseNumber = (value: any, fallback: number) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : fallback
      }

      const ltvModeValue = ltvOverride ?? 75
      const rawPrice = formData.priceRange ?? formData.propertyPrice ?? 0
      const propertyPrice = parseNumber(rawPrice, 0)
      if (propertyPrice <= 0) {
        result = null
      } else {
        const rawPropertyType: string | undefined = formData.propertyType || (propertyCategory === 'commercial' ? 'Commercial' : undefined)
        const personaPropertyType: 'HDB' | 'Private' | 'EC' | 'Commercial' = (() => {
          switch (rawPropertyType) {
            case 'Private':
            case 'Landed':
              return 'Private'
            case 'EC':
              return 'EC'
            case 'Commercial':
              return 'Commercial'
            case 'HDB':
            default:
              return 'HDB'
          }
        })()

        const buyerProfile = (formData.buyerProfile as 'SC' | 'PR' | 'Foreigner') || 'SC'
        const existingProperties = parseNumber(formData.existingProperties, 0)
        const age = parseNumber(formData.combinedAge, 35)
        const tenure = Math.max(parseNumber(formData.requestedTenure, 25), 1)
        const income = Math.max(parseNumber(formData.actualIncomes?.[0] ?? formData.monthlyIncome, 8000), 0)
        const commitments = Math.max(parseNumber(formData.existingCommitments, 0), 0)
        const rateAssumption = getPlaceholderRate(personaPropertyType, mappedLoanType)

        const profile = calculateInstantProfile({
          property_price: propertyPrice,
          property_type: personaPropertyType,
          buyer_profile: buyerProfile,
          existing_properties: existingProperties,
          income,
          commitments,
          rate: rateAssumption,
          tenure,
          age,
          loan_type: 'new_purchase',
          is_owner_occupied: true
        }, ltvModeValue)

        const monthlyPayment = roundMonthlyPayment(
          profile.maxLoan * ((rateAssumption / 100 / 12) * Math.pow(1 + rateAssumption / 100 / 12, tenure * 12)) /
          (Math.pow(1 + rateAssumption / 100 / 12, tenure * 12) - 1)
        )

        const minCashRequired = Math.round((profile.minCashPercent / 100) * propertyPrice)

        result = {
          propertyPrice,
          propertyType: personaPropertyType,
          ltvRatio: profile.maxLTV,
          maxLoanAmount: profile.maxLoan,
          downPayment: profile.downpaymentRequired,
          estimatedMonthlyPayment: monthlyPayment,
          minCashPercent: profile.minCashPercent,
          minCashRequired,
          cpfAllowed: profile.cpfAllowed,
          cpfAllowedAmount: profile.cpfAllowedAmount,
          tenureCapYears: profile.tenureCapYears,
          tenureCapSource: profile.tenureCapSource,
          limitingFactor: profile.limitingFactor,
          tdsrAvailable: profile.tdsrAvailable,
          absdRate: profile.absdRate,
          reasonCodes: profile.reasonCodes,
          policyRefs: profile.policyRefs,
          ltvMode: ltvModeValue,
          rateAssumption,
          personaProfile: profile
        }
      }
    } else if (mappedLoanType === 'refinance') {
      const parseNumber = (value: any, fallback: number) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : fallback
      }

      const propertyValue = parseNumber(formData.propertyValue, 0)
      const outstandingLoan = parseNumber(formData.outstandingLoan, 0)
      const currentRate = parseNumber(formData.currentRate, 0) // 0 means not provided
      const monthsRemaining = parseNumber(formData.monthsRemaining, 0)

      const propertyType = formData.propertyType || 'Private'
      const isOwnerOccupied = typeof formData.ownerOccupied === 'boolean' ? formData.ownerOccupied : true
      const refinancingGoals = Array.isArray(formData.refinancingGoals) ? formData.refinancingGoals : []
      const primaryGoal = refinancingGoals.find((goal: string) => goal !== 'cash_out') ??
                         (refinancingGoals.includes('cash_out') ? 'cash_out' : 'lower_monthly_payment')

      const mapGoalToObjective = (goal: string) => {
        switch (goal) {
          case 'shorten_tenure': return 'shorten_tenure' as const
          case 'rate_certainty': return 'rate_certainty' as const
          case 'cash_out': return 'cash_out' as const
          default: return 'lower_payment' as const
        }
      }

      const outlook = calculateRefinanceOutlook({
        property_value: propertyValue,
        current_balance: outstandingLoan,
        current_rate: currentRate, // Will use default estimation if 0
        months_remaining: monthsRemaining,
        property_type: propertyType as any,
        is_owner_occupied: isOwnerOccupied,
        objective: mapGoalToObjective(primaryGoal),
        outstanding_loan: outstandingLoan
      })

      // Map to format expected by UI
      result = {
        monthlySavings: outlook?.projectedMonthlySavings ?? 0,
        currentMonthlyPayment: outlook?.currentMonthlyPayment ?? 0,
        currentRate: currentRate,
        outstandingLoan: outstandingLoan,
        maxCashOut: outlook?.maxCashOut ?? 0,
        timingGuidance: outlook?.timingGuidance ?? 'Provide current loan details to generate refinance insights.',
        reasonCodes: outlook?.reasonCodes ?? [],
        policyRefs: outlook?.policyRefs ?? [],
        ltvCapApplied: outlook?.ltvCapApplied ?? 0,
        cpfRedemptionAmount: outlook?.cpfRedemptionAmount ?? 0
      }
    }

    if (result) {
      if (instantCalcTimerRef.current) {
        clearTimeout(instantCalcTimerRef.current)
      }

      setInstantCalcResult(result)
      setIsInstantCalcLoading(true)
      setShowInstantCalc(false)

      instantCalcTimerRef.current = setTimeout(() => {
        setShowInstantCalc(true)
        setIsInstantCalcLoading(false)
      }, 1000)

      setHasCalculated(true)
    }
  }, [mappedLoanType, watchedFields, hasCalculated, propertyCategory])

  // Debounced instant analysis recalculation when watched fields change
  useEffect(() => {
    // Only apply reactivity on step 2 and after initial calculation
    if (currentStep !== 2 || !hasCalculated) return

    // Set loading state immediately when fields change
    setIsInstantCalcLoading(true)

    const timer = setTimeout(() => {
      // Read directly from watchedFields (the full form watch)
      const {
        propertyValue,
        loanQuantum,
        actualAges,
        ltvMode,
        propertyType,
        priceRange,
        propertyPrice,
        combinedAge
      } = watchedFields

      // Only recalculate if we have minimum required fields
      const hasMinimumFields = mappedLoanType === 'new_purchase'
        ? (priceRange || propertyPrice) && (actualAges?.[0] || combinedAge)
        : propertyValue && loanQuantum

      if (hasMinimumFields) {
        console.log('🔄 Instant analysis recalculating with:', {
          priceRange,
          propertyPrice,
          actualAges,
          combinedAge,
          ltvMode,
          propertyType
        })

        // Force recalculation with current values
        calculateInstant({
          force: true,
          ltvMode: ltvMode || 75
        })
      }

      // Clear loading state after recalculation
      setIsInstantCalcLoading(false)
    }, 500) // 500ms debounce to prevent excessive calculations

    return () => {
      clearTimeout(timer)
      // If effect is cleaned up before timer fires, clear loading state
      setIsInstantCalcLoading(false)
    }
    // CRITICAL FIX: Depend on the specific watched field values, not a separate useWatch
    // Watch both actualAges[0] (primitive) AND combinedAge to catch all age changes
  }, [
    watchedFields.priceRange,
    watchedFields.propertyPrice,
    watchedFields.propertyValue,
    watchedFields.loanQuantum,
    watchedFields.actualAges?.[0],  // Watch first element as primitive, not array reference
    watchedFields.combinedAge,       // Watch combinedAge from Step 2
    watchedFields.ltvMode,
    watchedFields.propertyType,
    currentStep,
    hasCalculated,
    mappedLoanType,
    calculateInstant
  ])

  // Instant calculation triggers (from ProgressiveForm) - use specific field dependencies
  useEffect(() => {
    const shouldTriggerCalculation = () => {
      if (currentStep !== 2) return false
      if (hasCalculated) return false

      const fields = watchedFields

      if (mappedLoanType === 'new_purchase') {
        return !!(
          fields.propertyCategory &&
          fields.propertyType &&
          (fields.priceRange || fields.propertyPrice) &&
          fields.combinedAge
        )
      } else if (mappedLoanType === 'refinance') {
        return !!(
          fields.propertyType &&
          fields.currentRate &&
          fields.outstandingLoan &&
          fields.currentBank
        )
      }
      return false
    }

    if (shouldTriggerCalculation()) {
      const timer = setTimeout(() => {
        calculateInstant()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, mappedLoanType, hasCalculated, watchedFields, calculateInstant])

  // AI insight request handler
  const requestAIInsight = useCallback(async (fieldName: string, value: any) => {
    setIsAnalyzing(true)

    try {
      // Simulate AI insight generation
      await new Promise(resolve => setTimeout(resolve, 500))

      const insight: AIInsightResponse = {
        insight: `Based on your ${fieldName}, we recommend...`,
        confidence: 0.85,
        source: 'algorithmic',
        responseTime: 500
      }

      if (onAIInsight) {
        onAIInsight(insight)
      }
    } catch (error) {
      console.error('Failed to get AI insight:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [onAIInsight])

  // Navigation handlers
  const next = useCallback(async (data: any) => {
    try {
      // ============================================================================
      // UI STATE SYNCHRONIZATION FIX
      // Update UI state IMMEDIATELY to ensure form progression isn't blocked by
      // async tracking operations. This matches the fix in ProgressiveForm.tsx
      // ============================================================================


      // Update lead form (synchronous domain logic)
      Object.entries(data).forEach(([key, value]) => {
        leadForm.setFieldValue(key, value, currentStep)
      })

      // Update React state FIRST (synchronous, immediate UI feedback)
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep])
      }

      // Check if form is complete
      const isLastStep = currentStep === formSteps.length - 1

      if (!isLastStep) {
        // Move to next step IMMEDIATELY (before async operations)
        const nextStep = currentStep + 1
        setCurrentStep(nextStep)
        leadForm.progressToStep(nextStep)

        // Pre-fill age in Step 4 from Step 2 combinedAge
        if (nextStep === 3) { // Moving to Step 4 (Your Finances)
          const combinedAge = leadForm.formData.combinedAge

          if (combinedAge && !leadForm.formData.actualAges?.[0]) {
            // Pre-fill primary applicant age from Step 2 combinedAge
            // For single applicants, use full combinedAge
            // For joint applicants, divide by 2 as reasonable estimate
            const hasJointApplicant = leadForm.formData.hasJointApplicant
            const estimatedAge = hasJointApplicant
              ? Math.round(combinedAge / 2)
              : combinedAge

            setValue('actualAges.0', estimatedAge, { shouldValidate: false })
          }
        }

      }

      // Notify parent (synchronous callback)
      if (onStepCompletion) {
        try {
          onStepCompletion(currentStep, data)
        } catch (error) {
          console.error('⚠️ Parent callback failed:', error)
        }
      }

      // Track analytics AFTER UI update (fire-and-forget, truly non-blocking)
      // NO AWAIT - function returns immediately, analytics run in background
      conversionTracker.trackFormStepCompleted(
        sessionId,
        currentStep,
        data,
        Date.now()
      )
        
        .catch(error => console.error('⚠️ Analytics tracking failed (non-critical):', error))

      // Publish event (fire-and-forget, truly non-blocking)
      // NO AWAIT - function returns immediately, event publishes in background
      try {
        publishEvent(createEvent(
          FormEvents.STEP_COMPLETED,
          sessionId, // aggregateId
          {
            step: currentStep,
            data
          }
        ))

      } catch (error) {
        console.error('⚠️ Event publishing failed (non-critical):', error)
      }

      // Handle form completion
      if (isLastStep && onFormComplete) {
        try {
          onFormComplete(leadForm.formData)

        } catch (error) {
          console.error('⚠️ Form completion callback failed:', error)
        }
      }

    } catch (error) {
      console.error('❌ Critical error progressing to next step:', error)
      // Even on error, log detailed info for debugging
      console.error('Error details:', { currentStep, data, error })
    }
  }, [currentStep, completedSteps, leadForm, onStepCompletion, onFormComplete, publishEvent, createEvent, sessionId])

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  return {
    // State
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

    // React Hook Form
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,

    // Actions
    next,
    prev,
    onFieldChange,
    requestAIInsight,
    setPropertyCategory,
    calculateInstant
  }
}
