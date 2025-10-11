/**
 * Headless Progressive Form Controller
 * Phase B-0.1: Bloomberg Terminal Design System Implementation
 *
 * This hook separates business logic from UI presentation
 * Provides a typed interface for any UI implementation
 */

import { useState, useEffect, useCallback } from 'react'
import { useForm, Control, UseFormRegister, UseFormHandleSubmit, UseFormWatch, UseFormSetValue, UseFormTrigger } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LeadForm } from '@/lib/domains/forms/entities/LeadForm'
import { createStepSchema } from '@/lib/validation/mortgage-schemas'
import { FormStep, LeadScore, AIInsightResponse, LoanType } from '@/lib/contracts/form-contracts'
import { conversionTracker } from '@/lib/analytics/conversion-tracking'
import { eventBus, FormEvents, useEventPublisher, useCreateEvent } from '@/lib/events/event-bus'
import {
  calculateInstantEligibility,
  calculateRefinancingSavings,
  calculateIWAA,
  getPlaceholderRate
} from '@/lib/calculations/mortgage'
import { formSteps, getDefaultValues } from '@/lib/forms/form-config'

// Interface for the controller's return value
export interface ProgressiveFormController {
  // State
  currentStep: number
  completedSteps: number[]
  errors: any
  isValid: boolean
  isAnalyzing: boolean
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
  onFieldChange: (name: string, value: any) => void
  requestAIInsight: (fieldName: string, value: any) => Promise<void>
  setPropertyCategory: (category: 'resale' | 'new_launch' | 'bto' | 'commercial' | null) => void
  calculateInstant: () => void
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
  const [instantCalcResult, setInstantCalcResult] = useState<any>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [trustSignalsShown, setTrustSignalsShown] = useState<string[]>([])
  const [showInstantCalc, setShowInstantCalc] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)

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

  // Lead scoring logic (from ProgressiveForm) - optimize dependencies
  useEffect(() => {
    let score = 0
    const fields = watch()

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
        urgency: finalScore * 0.4, // Estimate urgency as 40% of total
        value: finalScore * 0.4, // Estimate value as 40% of total
        qualification: finalScore * 0.2, // Estimate qualification as 20% of total
        breakdown: {
          urgencyFactors: {},
          valueFactors: {},
          qualificationFactors: {}
        },
        routing: finalScore >= 75 ? 'immediate' :
                 finalScore >= 50 ? 'priority' :
                 finalScore >= 25 ? 'standard' : 'nurture',
        confidence: 0.8, // Default confidence level
        timestamp: new Date()
      })
    }
  }, [
    // Specific field dependencies instead of entire object
    watch('name'),
    watch('email'),
    watch('phone'),
    watch('propertyCategory'),
    watch('propertyType'),
    watch('propertyPrice'),
    watch('priceRange'),
    watch('monthlyIncome'),
    watch('actualIncomes'),
    watch('employmentType'),
    watch('purchaseTimeline'),
    watch('lockInStatus'),
    watch('currentRate'),
    mappedLoanType,
    onScoreUpdate
  ])

  // Track field values - use ref to avoid infinite loops
  useEffect(() => {
    // Only update fieldValues if we actually need them for display
    // Using JSON.stringify comparison to check if values actually changed
    const currentValues = JSON.stringify(watchedFields)
    const prevValues = JSON.stringify(fieldValues)
    if (currentValues !== prevValues) {
      setFieldValues(watchedFields)
    }
  }, [JSON.stringify(watchedFields)])

  // Field change handler
  const onFieldChange = useCallback((name: string, value: any) => {
    setValue(name, value)
    leadForm.setFieldValue(name, value, currentStep)

    // Publish field change event
    publishEvent(createEvent(
      FormEvents.FIELD_CHANGED,
      sessionId, // aggregateId
      {
        fieldName: name,
        fieldValue: value,
        step: currentStep
      }
    ))

    // Track conversion - field interaction tracking
    // Note: trackFieldInteraction method not available in current ConversionTracker
    // conversionTracker.trackFieldInteraction(name, currentStep)
  }, [currentStep, setValue, leadForm, publishEvent, createEvent])

  // Calculate instant results
  const calculateInstant = useCallback(() => {
    if (hasCalculated) return

    const formData = watch()
    let result = null

    if (mappedLoanType === 'new_purchase') {
      const eligibility = calculateInstantEligibility(
        formData.priceRange || 500000, // propertyPrice
        formData.propertyType || 'HDB', // propertyType
        formData.combinedAge || 35, // combinedAge
        0.75 // ltvRatio (optional, defaults to 0.75)
      )

      result = eligibility
    } else if (mappedLoanType === 'refinance') {
      const savings = calculateRefinancingSavings(
        formData.currentRate || 3.0, // currentRate
        formData.outstandingLoan || 400000, // outstandingLoan
        formData.remainingTenure || 20, // remainingTenure (optional)
        formData.propertyValue // propertyValue (optional)
      )

      result = savings
    }

    if (result) {
      setInstantCalcResult(result)
      setShowInstantCalc(true)
      setHasCalculated(true)
    }
  }, [mappedLoanType, watch, hasCalculated])

  // Instant calculation triggers (from ProgressiveForm) - use specific field dependencies
  useEffect(() => {
    const shouldTriggerCalculation = () => {
      if (currentStep !== 2) return false
      if (hasCalculated) return false

      const fields = watch()

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
  }, [
    // Specific field dependencies
    currentStep,
    mappedLoanType,
    hasCalculated,
    watch('propertyCategory'),
    watch('propertyType'),
    watch('priceRange'),
    watch('propertyPrice'),
    watch('combinedAge'),
    watch('currentRate'),
    watch('outstandingLoan'),
    watch('currentBank'),
    calculateInstant
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

      console.log('✅ Form validation passed - updating UI state immediately')

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
        console.log('🎯 UI state updated - now at step:', nextStep)
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
        .then(() => console.log('📊 Analytics tracked successfully'))
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
        console.log('📡 Event published successfully')
      } catch (error) {
        console.error('⚠️ Event publishing failed (non-critical):', error)
      }

      // Handle form completion
      if (isLastStep && onFormComplete) {
        try {
          onFormComplete(leadForm.formData)
          console.log('✅ Form completion callback executed')
        } catch (error) {
          console.error('⚠️ Form completion callback failed:', error)
        }
      }

      console.log('✅ Successfully processed step transition')
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