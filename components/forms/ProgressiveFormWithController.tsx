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
  LoanType
} from '@/lib/contracts/form-contracts'
import {
  eventBus,
  FormEvents,
  useEventPublisher,
  useCreateEvent
} from '@/lib/events/event-bus'
import { Step3NewPurchase } from './sections/Step3NewPurchase'
import { Step3Refinance } from './sections/Step3Refinance'
import { cn, formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
import { calculateInstantProfile, roundMonthlyPayment } from '@/lib/calculations/instant-profile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

    if (!currentValue || !validValues.includes(currentValue)) {
      const nextValue = validValues[0]
      if (nextValue) {
        setValue('propertyType', nextValue)
        onFieldChange('propertyType', nextValue)
      }
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
    await next(data)
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
          <div className="space-y-4">
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
          <div className="space-y-4">
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
                    return null
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

            {loanType === 'new_purchase' ? (
              <>
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
                  render={({ field }) => (
                    <div>
                      <label 
                        htmlFor="combined-age"
                        className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                      >
                        Combined Age *
                      </label>
                      <Input
                        {...field}
                        id="combined-age"
                        type="number"
                        placeholder="35"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                          onFieldChange('combinedAge', value)
                        }}
                      />
                      {errors.combinedAge && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.combinedAge)}</p>
                      )}
                    </div>
                  )}
                />
              </>
            ) : loanType === 'refinance' && (
              <>
                <Controller
                  name="currentRate"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Current Interest Rate (%) *
                      </label>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="3.0"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          field.onChange(value)
                        }}
                      />
                      {errors.currentRate && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.currentRate)}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="outstandingLoan"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Outstanding Loan Amount *
                      </label>
                      <Input
                        {...field}
                        type="number"
                        className="font-mono"
                        placeholder="400000"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                        }}
                      />
                      {errors.outstandingLoan && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.outstandingLoan)}</p>
                      )}
                    </div>
                  )}
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

            {!isInstantCalcLoading && showInstantCalc && instantCalcResult && (() => {
              // Helper function to calculate monthly payment
              const calculateMonthlyPayment = (loanAmount: number, rate: number = 2.8, years: number = 25) => {
                const monthlyRate = rate / 100 / 12
                const months = years * 12
                const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
                return Math.round(monthlyPayment)
              }

              if (loanType === 'new_purchase' && instantCalcResult.maxLoanAmount) {
                const propertyPrice = instantCalcResult.propertyPrice ?? Number(fieldValues.priceRange ?? 0)
                const maxLoan = instantCalcResult.maxLoanAmount
                const rateAssumption = instantCalcResult.rateAssumption ?? 2.8
                const monthlyPayment = instantCalcResult.estimatedMonthlyPayment ?? calculateMonthlyPayment(maxLoan, rateAssumption)
                const downPayment = instantCalcResult.downPayment ?? Math.max(propertyPrice - maxLoan, 0)
                const cpfAllowedAmount = instantCalcResult.cpfAllowedAmount ?? Math.min(downPayment * 0.8, 200000)
                const cashRequired = Math.max(downPayment - cpfAllowedAmount, 0)
                const minCashPercent = instantCalcResult.minCashPercent ?? (propertyPrice > 0 ? Math.round((cashRequired / propertyPrice) * 100) : 0)
                const minCashRequired = instantCalcResult.minCashRequired ?? cashRequired
                const ltvPercent = typeof instantCalcResult.ltvRatio === 'number'
                  ? instantCalcResult.ltvRatio
                  : (propertyPrice > 0 ? Math.round((maxLoan / propertyPrice) * 100) : ltvMode)
                const tenureCapYears = instantCalcResult.tenureCapYears
                const tenureCapSource = instantCalcResult.tenureCapSource
                const limitingFactor = instantCalcResult.limitingFactor
                const reasonCodes: string[] = instantCalcResult.reasonCodes ?? []
                const policyRefs: string[] = instantCalcResult.policyRefs ?? []

                return (
                  <div className="mt-6 p-8 bg-white border border-[#E5E5E5]">
                    <h4 className="text-2xl font-semibold text-[#000000] mb-4">
                      ✨ You qualify for up to
                    </h4>

                    <div className="text-5xl font-semibold text-[#000000] mb-6">
                      ${maxLoan.toLocaleString()}
                    </div>

                    <p className="text-[#666666] text-base mb-8">
                      {generateUserFriendlySummary(instantCalcResult)}
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                      className="text-[#666666] hover:text-[#000000] underline text-sm"
                    >
                      {showAnalysisDetails ? 'Hide details' : 'View full breakdown'}
                    </button>

                    {showAnalysisDetails && (
                      <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#666666]">Monthly Payment</span>
                            <span className="text-sm font-mono text-[#000000]">
                              ${monthlyPayment.toLocaleString()}/mo
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#666666]">Down Payment</span>
                            <span className="text-sm font-mono text-[#000000]">
                              ${Math.round(downPayment).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#666666]">Cash Required</span>
                            <span className="text-sm font-mono text-[#000000]">
                              ${Math.round(cashRequired).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#666666]">CPF Allowed</span>
                            <span className="text-sm font-mono text-[#000000]">
                              ${Math.round(cpfAllowedAmount).toLocaleString()}
                            </span>
                          </div>

                          {tenureCapYears && (
                            <div className="pt-4 border-t border-[#E5E5E5]">
                              <p className="text-xs text-[#666666]">
                                Tenure capped at {tenureCapYears} years ({tenureCapSource === 'age' ? 'age limit' : 'regulation'})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )

              }

              // Calculate additional metrics for refinance
              if (loanType === 'refinance' && instantCalcResult.monthlySavings) {
                // Use currentMonthlyPayment from calculateRefinanceOutlook() which handles missing rates
                const currentMonthlyPayment = instantCalcResult.currentMonthlyPayment ?? 0
                const newMonthlyPayment = currentMonthlyPayment - instantCalcResult.monthlySavings
                const lifetimeSavings = instantCalcResult.monthlySavings * 12 * 20 // Over 20 years
                const breakEvenMonths = 0 // Would be calculated based on refinancing costs

                return (
                  <div className="mt-6 p-6 bg-[#F8F8F8] border border-[#E5E5E5]">
                    <h4 className="text-sm font-semibold text-black mb-4">
                      <Sparkles className="inline-block w-4 h-4 mr-2" />
                      Your Refinancing Opportunity
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Current vs New Payment */}
                      <div className="border-b border-[#E5E5E5] pb-3">
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                          Current Monthly Payment
                        </p>
                        <p className="text-lg font-mono text-black">
                          ${currentMonthlyPayment.toLocaleString()}/mo
                          <span className="text-sm text-[#666666] ml-2">[@ {instantCalcResult.currentRate || 3.5}% interest]</span>
                        </p>
                      </div>

                      <div className="border-b border-[#E5E5E5] pb-3">
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">
                          New Monthly Payment (est.)
                        </p>
                        <p className="text-lg font-mono font-semibold text-black">
                          ${newMonthlyPayment.toLocaleString()}/mo
                          <span className="text-sm text-[#666666] ml-2">[@ 2.6% interest]</span>
                        </p>
                      </div>

                      {/* Monthly Savings */}
                      <div className="border-b border-[#E5E5E5] pb-3">
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                          Monthly Savings
                        </p>
                        <p className="text-xl font-mono font-semibold text-[#10B981]">
                          ${instantCalcResult.monthlySavings.toLocaleString()}/mo
                          <span className="text-sm text-[#10B981] ml-2">[🔥 {Math.round((instantCalcResult.monthlySavings / currentMonthlyPayment) * 100)}% reduction]</span>
                        </p>
                      </div>

                      {/* Lifetime Savings */}
                      <div className="border-b border-[#E5E5E5] pb-3">
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                          Lifetime Savings
                        </p>
                        <p className="text-lg font-mono font-semibold text-black">
                          ${lifetimeSavings.toLocaleString()}
                          <span className="text-sm text-[#666666] ml-2">[over 20 years]</span>
                        </p>
                      </div>

                      {/* Break-even Period */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                          Break-even Period
                        </p>
                        <p className="text-lg font-mono font-semibold text-black">
                          9 months 
                          <span className="text-sm text-[#666666] ml-2">[recover refinancing cost]</span>
                        </p>
                      </div>
                    </div>

                    {/* Urgency Message */}
                    <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                      <div className="flex items-center gap-2 p-3 bg-[#FCD34D]/10 border border-[#FCD34D]/20">
                        <AlertTriangle className="w-4 h-4 text-[#FCD34D]" />
                        <div>
                          <p className="text-sm font-semibold text-black">Highly recommended</p>
                          <p className="text-xs text-[#666666]">Savings over $300/mo justify refinancing</p>
                          <p className="text-xs text-[#666666]">⏰ Complete Step 3 now to lock in current rates</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return null
            })()}

            

            {/* LTV Toggle for What-If Analysis */}
            {showInstantCalc && instantCalcResult && loanType === 'new_purchase' && (
              <div className="mt-6 p-4 bg-[#F8F8F8] border border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black">LTV Scenario Analysis</p>
                    <p className="text-xs text-[#666666]">See how different LTV settings affect your borrowing power</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLtvSelection(75)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        ltvMode === 75 
                          ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' 
                          : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'
                      }`}
                    >
                      75% (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLtvSelection(55)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        ltvMode === 55 
                          ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' 
                          : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'
                      }`}
                    >
                      55%
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 text-xs text-[#666666]">
                  <Info className="w-4 h-4 text-[#666666]" aria-hidden="true" />
                  <span>
                    75% LTV matches Dr Elena&apos;s baseline persona for first-time buyers. Switch to 55% if you want a conservative investment scenario with more cash buffer.
                  </span>
                </div>
                
                {ltvComparisonData ? (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-white border border-[#E5E5E5]">
                      <p className="text-xs text-[#666666] mb-1">Max Loan</p>
                      <p className="text-sm font-mono font-semibold text-black">
                        ${ltvComparisonData.maxLoan.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#666666] mt-1">({ltvMode}% LTV)</p>
                    </div>
                    <div className="p-2 bg-white border border-[#E5E5E5]">
                      <p className="text-xs text-[#666666] mb-1">Monthly Payment</p>
                      <p className="text-sm font-mono font-semibold text-black">
                        ${ltvComparisonData.monthlyPayment.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#666666] mt-1">${ltvComparisonData.downpayment.toLocaleString()} down</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-[#666666]">
                    <p className="text-sm">Complete all fields to see LTV analysis</p>
                  </div>
                )}
                
                <div className="mt-2 p-2 bg-[#FCD34D]/10 border border-[#FCD34D]/20">
                  <p className="text-xs text-black">
                    <span className="font-semibold">Selected: {ltvMode}% LTV</span> - Adjust to see impact on borrowing capacity
                  </p>
                </div>
              </div>
            )}

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
          </div>
        )

      case 3: // Your Finances
        return (
          <div className="space-y-4">
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
              />
            ) : (
              <Step3Refinance
                onFieldChange={onFieldChange}
                showJointApplicant={showJointApplicant}
                errors={errors}
                getErrorMessage={getErrorMessage}
                fieldValues={fieldValues}
                control={control}
                setValue={setValue}
                watch={watch}
              />
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
          actualAges: fieldValues.actualAges,
          actualIncomes: fieldValues.actualIncomes,
          employmentType: fieldValues.employmentType,
          hasExistingLoan: fieldValues.hasExistingLoan,
          existingLoanDetails: fieldValues.existingLoanDetails
        }}
        leadScore={leadScore}
        sessionId={sessionId}
        onTransitionComplete={(conversationId) => {
          console.log('Chat transition complete:', conversationId)
        }}
        onFallbackRequired={(fallbackData) => {
          console.log('Fallback required:', fallbackData)
        }}
      />
    )
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Progress Indicator */}
      <div className="mb-8">
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

      {/* Step Description */}
      <div className="mb-6">
        <h2 className="text-2xl font-light text-black mb-2">
          {currentStepConfig.description}
        </h2>
        {leadScore > 0 && (
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Shield className="w-4 h-4 text-[#10B981]" />
            <span>Trust Score: {leadScore}%</span>
          </div>
        )}
      </div>

      {/* Form Content */}
      <form onSubmit={handleStepSubmit}>
        <Card className="border-[#E5E5E5]">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
