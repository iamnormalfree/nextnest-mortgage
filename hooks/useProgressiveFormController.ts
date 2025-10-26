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
import type { InstantCalcResult, PureLtvCalcResult, FullAnalysisCalcResult, RefinanceCalcResult } from '@/lib/contracts/form-contracts'
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
import { calculatePureLtvMaxLoan } from '@/lib/calculations/instant-profile-pure-ltv'
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
  instantCalcResult: InstantCalcResult | null
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
  const [propertyCategory, setPropertyCategory] = useState<'resale' | 'new_launch' | 'bto' | 'commercial' | null>(null)
  const [leadScore, setLeadScore] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isInstantCalcLoading, setIsInstantCalcLoading] = useState(false)
  const [instantCalcResult, setInstantCalcResult] = useState<InstantCalcResult | null>(null)
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
    mode: 'onBlur',
    reValidateMode: 'onBlur',  // Prevent validation on every keystroke after first error
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

  /**
   * Check if Step 2 required data is complete for pure LTV calculation
   * Pure LTV needs: propertyPrice, propertyType, combinedAge, existingProperties
   * Does NOT need income
   */
  const hasRequiredStep2Data = useCallback((): boolean => {
    const formData = form.getValues()
    
    return !!(
      (formData.priceRange || formData.propertyPrice) &&
      formData.propertyType &&
      formData.combinedAge &&
      formData.existingProperties !== undefined  // 0 is valid (first property)
    )
  }, [form])

  /**
   * Check if Step 3 required data is complete for full analysis
   * Full analysis needs: all Step 2 data + actual income
   */
  const hasRequiredStep3Data = useCallback((): boolean => {
    const formData = form.getValues()
    
    return (
      hasRequiredStep2Data() &&
      (formData.actualIncomes?.[0] ?? 0) > 0  // Must have positive income
    )
  }, [form, hasRequiredStep2Data])


  // Calculate instant results with step-aware routing
  const calculateInstant = useCallback((options: { force?: boolean; ltvMode?: number } = {}) => {
    console.log('🔍 calculateInstant called:', { force: options.force, ltvMode: options.ltvMode, hasCalculated, currentStep })
    const { force = false, ltvMode: ltvOverride } = options
    if (hasCalculated && !force) {
      console.log('🔍 calculateInstant: Early return (already calculated and not forced)')
      return
    }

    // CRITICAL FIX: Use getValues() to get FRESH form data instead of stale watchedFields closure
    const formData = form.getValues()

    // STEP-AWARE ROUTING: Different calculation logic based on current step
    if (currentStep === 2 && mappedLoanType === 'new_purchase') {
      // ========================================
      // STEP 2: PURE LTV CALCULATION (NO INCOME)
      // ========================================
      console.log('🔍 Step 2: Using PURE LTV calculation (no income)')

      if (!hasRequiredStep2Data()) {
        console.log('🔍 Step 2: Missing required data, setting result to NULL')
        setInstantCalcResult(null)
        return
      }

      const parseNumber = (value: any, fallback: number) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : fallback
      }

      const rawPrice = formData.priceRange ?? formData.propertyPrice ?? 0
      const propertyPrice = parseNumber(rawPrice, 0)

      if (propertyPrice <= 0) {
        console.log('🔍 Step 2: propertyPrice <= 0, setting result to NULL')
        setInstantCalcResult(null)
        return
      }

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

      const existingProperties = parseNumber(formData.existingProperties, 0)
      const age = parseNumber(formData.combinedAge, 35)

      console.log('🔍 Step 2: Calling calculatePureLtvMaxLoan with:', {
        property_price: propertyPrice,
        existing_properties: existingProperties,
        age,
        property_type: personaPropertyType
      })

      // ⚠️ CRITICAL: Call pure LTV function (NO INCOME PARAMETER)
      const pureLtvResult = calculatePureLtvMaxLoan({
        property_price: propertyPrice,
        existing_properties: existingProperties,
        age,
        property_type: personaPropertyType
      })

      console.log('🔍 Step 2: Pure LTV result:', pureLtvResult)

      // Set result and trigger display animation
      setInstantCalcResult(pureLtvResult) // calculationType: 'pure_ltv'
      setIsInstantCalcLoading(true)
      setShowInstantCalc(false)

      if (instantCalcTimerRef.current) {
        clearTimeout(instantCalcTimerRef.current)
      }

      instantCalcTimerRef.current = setTimeout(() => {
        console.log('🔍 Step 2: 1000ms timer fired, showing pure LTV results')
        setShowInstantCalc(true)
        setIsInstantCalcLoading(false)
      }, 1000)

      setHasCalculated(true)

    } else if (currentStep >= 3 && mappedLoanType === 'new_purchase') {
      // ========================================
      // STEP 3+: FULL ANALYSIS WITH INCOME
      // ========================================
      console.log('🔍 Step 3+: Using FULL ANALYSIS calculation (with income)')

      if (!hasRequiredStep3Data()) {
        console.log('🔍 Step 3+: Missing required data (including income), setting result to NULL')
        setInstantCalcResult(null)
        return
      }

      const parseNumber = (value: any, fallback: number) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : fallback
      }

      // ⚠️ CRITICAL: Validate actual income (NO DEFAULT FALLBACK)
      const actualIncome = parseNumber(formData.actualIncomes?.[0], 0)
      if (actualIncome <= 0) {
        console.log('🔍 Step 3+: No valid income provided, setting result to NULL')
        setInstantCalcResult(null)
        return
      }

      const ltvModeValue = ltvOverride ?? 75
      const rawPrice = formData.priceRange ?? formData.propertyPrice ?? 0
      const propertyPrice = parseNumber(rawPrice, 0)

      if (propertyPrice <= 0) {
        console.log('🔍 Step 3+: propertyPrice <= 0, setting result to NULL')
        setInstantCalcResult(null)
        return
      }

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

      // ========================================================================
      // CO-APPLICANT DATA EXTRACTION FOR IWAA
      // ========================================================================
      //
      // For joint applications, extract ages and incomes arrays from form data
      // to calculate IWAA (Income-Weighted Average Age) for accurate tenure caps.
      //
      // Form fields:
      // - actualAges: [number, number?] - Ages of applicant 1 and 2
      // - actualIncomes: [number, number?] - Incomes of applicant 1 and 2
      //
      // These are passed to calculateInstantProfile which handles IWAA calculation
      // and applies appropriate tenure formulas per Dr Elena v2 spec.
      //
      // Fallback: If arrays not available, uses single 'age' parameter (backwards compat)
      // ========================================================================

      // Extract co-applicant data for IWAA calculation
      const actualAges = formData.actualAges
      const actualIncomes = formData.actualIncomes

      // Parse arrays, filtering out undefined/null/zero values
      const parsedAges = Array.isArray(actualAges)
        ? actualAges.filter((v): v is number => typeof v === 'number' && v > 0)
        : []

      const parsedIncomes = Array.isArray(actualIncomes)
        ? actualIncomes.filter((v): v is number => typeof v === 'number' && v >= 0)
        : []

      const age = parseNumber(formData.combinedAge, 35)
      const tenure = Math.max(parseNumber(formData.requestedTenure, 25), 1)
      const commitments = Math.max(parseNumber(formData.existingCommitments, 0), 0)
      const rateAssumption = getPlaceholderRate(personaPropertyType, mappedLoanType)

      console.log('🔍 Step 3+: IWAA data for calculation:', {
        actualAges,
        actualIncomes,
        parsedAges,
        parsedIncomes,
        hasCoApplicant: parsedAges.length > 1,
        fallbackAge: age
      })

      console.log('🔍 Step 3+: Calling calculateInstantProfile with:', {
        property_price: propertyPrice,
        property_type: personaPropertyType,
        buyer_profile: buyerProfile,
        existing_properties: existingProperties,
        income: actualIncome, // ← ACTUAL income, NOT hardcoded
        incomes: parsedIncomes.length > 0 ? parsedIncomes : undefined,
        ages: parsedAges.length > 0 ? parsedAges : undefined,
        commitments,
        rate: rateAssumption,
        tenure,
        age,
        ltvModeValue
      })

      const profile = calculateInstantProfile({
        property_price: propertyPrice,
        property_type: personaPropertyType,
        buyer_profile: buyerProfile,
        existing_properties: existingProperties,
        income: actualIncome, // ← ACTUAL income, NOT hardcoded
        incomes: parsedIncomes.length > 0 ? parsedIncomes : undefined,  // ← NEW: for IWAA
        commitments,
        rate: rateAssumption,
        tenure,
        age,
        ages: parsedAges.length > 0 ? parsedAges : undefined,  // ← NEW: for IWAA
        loan_type: 'new_purchase',
        is_owner_occupied: true
      }, ltvModeValue)

      console.log('🔍 Step 3+: Full analysis result:', {
        maxLoan: profile.maxLoan,
        maxLTV: profile.maxLTV,
        limitingFactor: profile.limitingFactor,
        ltvCapApplied: profile.ltvCapApplied
      })

      const monthlyPayment = roundMonthlyPayment(
        profile.maxLoan * ((rateAssumption / 100 / 12) * Math.pow(1 + rateAssumption / 100 / 12, tenure * 12)) /
        (Math.pow(1 + rateAssumption / 100 / 12, tenure * 12) - 1)
      )

      const minCashRequired = Math.round((profile.minCashPercent / 100) * propertyPrice)
      const cashDownPayment = minCashRequired
      const cpfDownPayment = Math.max(0, profile.downpaymentRequired - minCashRequired)

      const fullAnalysisResult: FullAnalysisCalcResult = {
        calculationType: 'full_analysis' as const,
        propertyPrice,
        propertyType: personaPropertyType,
        ltvRatio: profile.maxLTV,
        ltvPercentage: profile.maxLTV,
        maxLoanAmount: profile.maxLoan,
        downPayment: profile.downpaymentRequired,
        estimatedMonthlyPayment: monthlyPayment,
        minCashPercent: profile.minCashPercent,
        minCashRequired,
        cpfAllowed: profile.cpfAllowed,
        cpfAllowedAmount: profile.cpfAllowedAmount,
        cashDownPayment,
        cpfDownPayment,
        effectiveTenure: profile.tenureCapYears || 25,
        tenureCapSource: profile.tenureCapSource,
        limitingFactor: profile.limitingFactor,
        tdsrAvailable: profile.tdsrAvailable,
        msrLimit: profile.msrLimit,
        msrPass: profile.reasonCodes?.includes('msr_pass'),
        tdsrPass: profile.reasonCodes?.includes('tdsr_pass'),
        msrUsagePercent: undefined,
        tdsrUsagePercent: undefined,
        absdRate: profile.absdRate,
        reasonCodes: profile.reasonCodes,
        policyRefs: profile.policyRefs,
        ltvMode: ltvModeValue,
        rateAssumption
      }

      // Set result and trigger display animation
      setInstantCalcResult(fullAnalysisResult)
      setIsInstantCalcLoading(true)
      setShowInstantCalc(false)

      if (instantCalcTimerRef.current) {
        clearTimeout(instantCalcTimerRef.current)
      }

      instantCalcTimerRef.current = setTimeout(() => {
        console.log('🔍 Step 3+: 1000ms timer fired, showing full analysis results')
        setShowInstantCalc(true)
        setIsInstantCalcLoading(false)
      }, 1000)

      setHasCalculated(true)

    } else if (mappedLoanType === 'refinance') {
      // ========================================
      // REFINANCE CALCULATION (unchanged)
      // ========================================
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
      const refinanceResult: RefinanceCalcResult = {
        calculationType: 'refinance_analysis' as const,
        propertyPrice: propertyValue,
        propertyType,
        maxLoanAmount: outstandingLoan,
        monthlySavings: outlook?.projectedMonthlySavings ?? 0,
        currentMonthlyPayment: outlook?.currentMonthlyPayment ?? 0,
        currentRate: currentRate,
        outstandingLoan: outstandingLoan,
        maxCashOut: outlook?.maxCashOut ?? 0,
        timingGuidance: outlook?.timingGuidance ?? 'Provide current loan details to generate refinance insights.',
        reasonCodes: outlook?.reasonCodes ?? [],
        policyRefs: outlook?.policyRefs ?? [],
        ltvCapApplied: outlook?.ltvCapApplied ?? 0,
        cpfRedemptionAmount: outlook?.cpfRedemptionAmount ?? 0,
        rateAssumption: 2.6
      }

      console.log('🔍 Refinance: result =', refinanceResult)

      setInstantCalcResult(refinanceResult)
      setIsInstantCalcLoading(true)
      setShowInstantCalc(false)

      if (instantCalcTimerRef.current) {
        clearTimeout(instantCalcTimerRef.current)
      }

      instantCalcTimerRef.current = setTimeout(() => {
        console.log('🔍 Refinance: 1000ms timer fired, showing results')
        setShowInstantCalc(true)
        setIsInstantCalcLoading(false)
      }, 1000)

      setHasCalculated(true)
    } else {
      console.log('🔍 calculateInstant: No matching calculation path, setting result to NULL')
      setInstantCalcResult(null)
    }
  }, [currentStep, hasRequiredStep2Data, hasRequiredStep3Data, form, mappedLoanType, propertyCategory, hasCalculated])

  // Debounced instant analysis recalculation when watched fields change
  useEffect(() => {
    console.log('🔍 Debounced recalc effect triggered:', {
      currentStep,
      hasCalculated,
      priceRange: watchedFields.priceRange,
      propertyPrice: watchedFields.propertyPrice,
      combinedAge: watchedFields.combinedAge
    })

    // Only apply reactivity on step 2 and after initial calculation
    if (currentStep !== 2 || !hasCalculated) {
      console.log('🔍 Debounced recalc: Early return (not step 2 or not calculated yet)')
      return
    }

    console.log('🔍 Debounced recalc: Setting loading state TRUE')
    // Set loading state immediately when fields change
    setIsInstantCalcLoading(true)

    const timer = setTimeout(() => {
      console.log('🔍 Debounced recalc: setTimeout callback executing')
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

      console.log('🔍 Debounced recalc: hasMinimumFields =', hasMinimumFields)

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
      } else {
        console.log('🔍 Debounced recalc: Minimum fields NOT met, skipping calculation')
      }

      // Clear loading state after recalculation
      console.log('🔍 Debounced recalc: Setting loading state FALSE (line 491)')
      setIsInstantCalcLoading(false)
    }, 500) // 500ms debounce to prevent excessive calculations

    return () => {
      console.log('🔍 Debounced recalc: Cleanup function running')
      clearTimeout(timer)
      // If effect is cleaned up before timer fires, clear loading state
      setIsInstantCalcLoading(false)
    }
    // CRITICAL FIX: Removed calculateInstant from dependencies to prevent infinite loop
    // calculateInstant reads watchedFields directly, so it always has fresh data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedFields.priceRange,
    watchedFields.propertyPrice,
    watchedFields.propertyValue,
    watchedFields.loanQuantum,
    watchedFields.actualAges?.[0],  // Watch first element as primitive, not array reference
    watchedFields.combinedAge,       // Watch combinedAge from Step 2
    watchedFields.ltvMode,
    watchedFields.propertyType,
    watchedFields.existingProperties, // Watch property ownership changes (1st/2nd/3rd property)
    currentStep,
    hasCalculated,
    mappedLoanType
    // calculateInstant removed - causes infinite loop because it's recreated on every watchedFields change
  ])

  // Instant calculation triggers (from ProgressiveForm) - use specific field dependencies
  useEffect(() => {
    const shouldTriggerCalculation = () => {
      console.log('🔍 Initial trigger: Checking if should trigger calculation', {
        currentStep,
        hasCalculated,
        mappedLoanType
      })

      if (currentStep !== 2) {
        console.log('🔍 Initial trigger: Not step 2')
        return false
      }
      if (hasCalculated) {
        console.log('🔍 Initial trigger: Already calculated')
        return false
      }

      const fields = watchedFields

      if (mappedLoanType === 'new_purchase') {
        const result = !!(
          fields.propertyCategory &&
          fields.propertyType &&
          (fields.priceRange || fields.propertyPrice) &&
          fields.combinedAge
        )
        console.log('🔍 Initial trigger (new_purchase): Has required fields?', result, {
          propertyCategory: fields.propertyCategory,
          propertyType: fields.propertyType,
          priceRange: fields.priceRange,
          propertyPrice: fields.propertyPrice,
          combinedAge: fields.combinedAge
        })
        return result
      } else if (mappedLoanType === 'refinance') {
        const result = !!(
          fields.propertyType &&
          fields.currentRate &&
          fields.outstandingLoan &&
          fields.currentBank
        )
        console.log('🔍 Initial trigger (refinance): Has required fields?', result)
        return result
      }
      return false
    }

    if (shouldTriggerCalculation()) {
      console.log('🔍 Initial trigger: Triggering calculation in 500ms')
      const timer = setTimeout(() => {
        console.log('🔍 Initial trigger: Timer fired, calling calculateInstant()')
        calculateInstant()
      }, 500)
      return () => {
        console.log('🔍 Initial trigger: Cleanup - clearing timer')
        clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, mappedLoanType, hasCalculated, watchedFields
    // calculateInstant removed - it reads watchedFields directly so always has fresh data
  ])

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

