// ABOUTME: Progressive mortgage application form with 3-step flow and real-time validation
// ABOUTME: Integrates with Chatwoot for seamless broker handoff and lead scoring

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { cn, formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
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
  TrendingUp
} from 'lucide-react'
import ChatTransitionScreen from '@/components/forms/ChatTransitionScreen'
import ChatWidgetLoader from '@/components/forms/ChatWidgetLoader'
import { formSteps, propertyCategoryOptions } from '@/lib/forms/form-config'

// Helper function to safely extract error messages
const getErrorMessage = (error: any): string | undefined => {
  if (!error) return undefined
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
  const [ltvMode, setLtvMode] = useState(75) // Default LTV mode
  const [isAutoProgressing, setIsAutoProgressing] = useState(false) // Auto-progression spinner state

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
      if (currentStep === formSteps.length - 1) {
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

  // Analytics hooks
  const publishEvent = useEventPublisher()
  const createEvent = useCreateEvent(sessionId)

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

  const shouldEnableStep1Continue =
    Boolean(watch('name')) &&
    Boolean(watch('email')) &&
    Boolean(watch('phone'))

  const canSubmitCurrentStep =
    currentStep === 1
      ? isValid && shouldEnableStep1Continue
      : isValid

  // Toggle optional context when Step 2 fields are filled (for enhanced UX)
  useEffect(() => {
    if (currentStep === 2 && !isAutoProgressing) {
      const step2RequiredFields = ['propertyCategory', 'propertyType', 'priceRange', 'combinedAge']
      const hasAllRequiredFields = step2RequiredFields.every(field => 
        Boolean(watch(field)) && watch(field) !== ''
      )
      
      if (hasAllRequiredFields && !showOptionalContext) {
        // Show 1-second spinner before showing optional context and auto-progressing
        setIsAutoProgressing(true)
        
        setTimeout(() => {
          setShowOptionalContext(true)
          setIsAutoProgressing(false)
          
          // Auto-progress to Step 3 after another 1-second delay
          setTimeout(() => {
            onStepCompletion(2, fieldValues)
            // The parent component will handle the actual step progression
          }, 1000)
        }, 1000)
      }
    }
  }, [currentStep, watch, showOptionalContext, isAutoProgressing, fieldValues, onStepCompletion])
  useEffect(() => {
    if (!showInstantCalc || !instantCalcResult) return

    const trackTier2Display = async () => {
      try {
        const event = createEvent(
          FormEvents.PROCESSING_TIER_COMPLETED,
          `session-${sessionId}`,
          {
            loanType,
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
  }, [showInstantCalc, instantCalcResult, loanType, sessionId, createEvent, publishEvent])

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
                      {loanType === 'new_purchase' ? (
                        <>
                          <SelectItem value="HDB">HDB Flat</SelectItem>
                          <SelectItem value="EC">Executive Condo</SelectItem>
                          <SelectItem value="Private">Private Condo</SelectItem>
                          <SelectItem value="Landed">Landed Property</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="HDB">HDB Flat (Refinance)</SelectItem>
                          <SelectItem value="EC">Executive Condo (Refinance)</SelectItem>
                          <SelectItem value="Private">Private Condo (Refinance)</SelectItem>
                          <SelectItem value="Landed">Landed Property (Refinance)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && (
                    <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.propertyType)}</p>
                  )}
                </div>
              )}
            />

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
            {showInstantCalc && instantCalcResult && (() => {
              // Helper function to calculate monthly payment
              const calculateMonthlyPayment = (loanAmount: number, rate: number = 2.8, years: number = 25) => {
                const monthlyRate = rate / 100 / 12
                const months = years * 12
                const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
                return Math.round(monthlyPayment)
              }

              // Helper function to calculate down payment breakdown
              const calculateDownPayment = (price: number, loanAmount: number) => {
                const downPayment = price - loanAmount
                const cpfAllowed = Math.min(downPayment * 0.8, 200000) // CPF allowance capped at 80% of down payment, max $200k
                const cashRequired = downPayment - cpfAllowed
                return { downPayment, cpfAllowed, cashRequired }
              }

              // Calculate additional metrics for new purchase
              if (loanType === 'new_purchase' && instantCalcResult.maxLoanAmount) {
                const maxLoan = instantCalcResult.maxLoanAmount
                const monthlyPayment = instantCalcResult.estimatedMonthlyPayment ?? 0
                const inferredPrice = fieldValues.priceRange || Math.round(maxLoan / 0.75)
                const { downPayment, cpfAllowed, cashRequired } = calculateDownPayment(inferredPrice, maxLoan)
                const ltv = inferredPrice > 0 ? Math.round((maxLoan / inferredPrice) * 100) : 75

                return (
                  <div className="mt-6 p-6 bg-[#F8F8F8] border border-[#E5E5E5]">
                    <h4 className="text-sm font-semibold text-black mb-4">
                      <Sparkles className="inline-block w-4 h-4 mr-2" />
                      Your Personalized Analysis
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Maximum Loan */}
                      <div className="border-b border-[#E5E5E5] pb-3">
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">
                          Maximum Loan Amount
                        </p>
                        <p className="text-lg font-mono font-semibold text-black">
                          ${maxLoan.toLocaleString()}
                          <span className="text-sm text-[#666666] ml-2">[{ltv}% LTV]</span>
                        </p>
                      </div>

                      {/* Monthly Payment */}
                      <div className="border-b border-[#E5E5E5] pb-3">
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">
                          Estimated Monthly Payment
                        </p>
                        <p className="text-lg font-mono font-semibold text-black">
                          ${monthlyPayment.toLocaleString()}/mo
                          <span className="text-sm text-[#666666] ml-2">[@ 3.5% stress-tested rate]</span>
                        </p>
                      </div>

                      {/* Down Payment */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">
                          Down Payment Required
                        </p>
                        <p className="text-lg font-mono font-semibold text-black">
                          ${Math.round(downPayment).toLocaleString()}
                          <span className="text-sm text-[#666666] ml-2">[25% down]</span>
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-[#666666]">
                            ├─ Cash required: <span className="font-mono">${Math.round(cashRequired).toLocaleString()}</span>
                          </p>
                          <p className="text-sm text-[#666666]">
                            └─ CPF allowed: <span className="font-mono">${Math.round(cpfAllowed).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Locked Tier 3 Preview */}
                    <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                      <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                        💡 Complete Step 3 to unlock:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2 text-sm text-[#666666]">
                          <span className="text-[#999999]">🔒</span>
                          <span>TDSR/MSR compliance check</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#666666]">
                          <span className="text-[#999999]">🔒</span>
                          <span>Stamp duty calculation</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#666666]">
                          <span className="text-[#999999]">🔒</span>
                          <span>23 bank comparisons</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )

              }

              // Calculate additional metrics for refinance
              if (loanType === 'refinance' && instantCalcResult.monthlySavings) {
                const currentMonthlyPayment = instantCalcResult.outstandingLoan ? 
                  calculateMonthlyPayment(instantCalcResult.outstandingLoan, instantCalcResult.currentRate || 3.5) : 0
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

            {/* Auto-progression Spinner */}
            {isAutoProgressing && (
              <div className="mt-6 p-4 bg-[#F8F8F8] border border-[#E5E5E5]">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-[#FCD34D] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-black font-medium">Analyzing your loan options...</p>
                </div>
                <p className="text-xs text-[#666666] text-center mt-2">
                  Preparing personalized recommendations based on your inputs
                </p>
              </div>
            )}

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
                      onClick={() => setLtvMode(55)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        ltvMode === 55 
                          ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' 
                          : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'
                      }`}
                    >
                      55%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLtvMode(65)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        ltvMode === 65 
                          ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' 
                          : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'
                      }`}
                    >
                      65%
                    </button>
                    <button
                      type="button"
                      onClick={() => setLtvMode(75)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        ltvMode === 75 
                          ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' 
                          : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'
                      }`}
                    >
                      75%
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white border border-[#E5E5E5]">
                    <p className="text-xs text-[#666666] mb-1">Max Loan</p>
                    <p className="text-sm font-mono font-semibold text-black">
                      ${Math.round(instantCalcResult.maxLoanAmount * (ltvMode / 75)).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-white border border-[#E5E5E5]">
                    <p className="text-xs text-[#666666] mb-1">Cash Down</p>
                    <p className="text-sm font-mono font-semibold text-black">
                      ${Math.round((fieldValues.priceRange || 0) * (1 - ltvMode / 100)).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-white border border-[#E5E5E5]">
                    <p className="text-xs text-[#666666] mb-1">Monthly</p>
                    <p className="text-sm font-mono font-semibold text-black">
                      ${Math.round((instantCalcResult.maxLoanAmount * (ltvMode / 75)) * 0.028 / 12 * Math.pow(1 + 0.028 / 12, 25 * 12) / (Math.pow(1 + 0.028 / 12, 25 * 12) - 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-[#FCD34D]/10 border border-[#FCD34D]/20">
                  <p className="text-xs text-black">
                    <span className="font-semibold">Selected: {ltvMode}% LTV</span> - Adjust to see impact on borrowing capacity
                  </p>
                </div>
              </div>
            )}

            {/* Optional Context Block */}
            <div className="mt-6 border-t border-[#E5E5E5] pt-6">
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
                        <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                          Development Name (Optional)
                        </label>
                        <Input
                          {...field}
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
                        <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                          Preferred Payment Scheme (Optional)
                        </label>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            onFieldChange('paymentScheme', value)
                          }}
                        >
                          <SelectTrigger>
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
                </div>
              )}
            </div>
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

            {/* Applicant 1 Fields */}
            <div className="space-y-4 p-4 border border-[#E5E5E5]">
              <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                Applicant 1 (Primary)
              </p>

              <Controller
              name="actualIncomes.0"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Monthly Income *
                  </label>
                  <Input
                    {...field}
                    type="number"
                    className="font-mono"
                    placeholder="8000"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      field.onChange(value)
                      onFieldChange('actualIncomes.0', value)
                    }}
                  />
                  {errors['actualIncomes.0'] && (
                    <p className="text-[#EF4444] text-xs mt-1">Monthly income is required</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="actualAges.0"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Your Age *
                  </label>
                  <Input
                    {...field}
                    type="number"
                    placeholder="35"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      field.onChange(value)
                      onFieldChange('actualAges.0', value)
                    }}
                  />
                  {errors['actualAges.0'] && (
                    <p className="text-[#EF4444] text-xs mt-1">Age is required</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Employment Type *
                  </label>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      onFieldChange('employmentType', value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed (Full-time)</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="contract">Contract/Freelance</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.employmentType && (
                    <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.employmentType)}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="creditCardCount"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Credit Card Count
                  </label>
                  <Input
                    {...field}
                    type="number"
                    placeholder="2"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      field.onChange(value)
                      onFieldChange('creditCardCount', value)
                    }}
                  />
                  <p className="text-xs text-[#666666] mt-1">
                    Number of active credit cards
                  </p>
                </div>
              )}
            />

            <Controller
              name="existingCommitments"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Existing Monthly Commitments
                  </label>
                  <Input
                    {...field}
                    type="number"
                    className="font-mono"
                    placeholder="0"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      field.onChange(value)
                      onFieldChange('existingCommitments', value)
                    }}
                  />
                  <p className="text-xs text-[#666666] mt-1">
                    Include car loans, other mortgages, credit cards, etc.
                  </p>
                </div>
              )}
            />
            </div>

            {/* Applicant 2 Fields - Conditional */}
            {showJointApplicant && (
              <div className="space-y-4 p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
                <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                  Applicant 2 (Joint)
                </p>

                <Controller
                  name="actualIncomes.1"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Monthly Income
                      </label>
                      <Input
                        {...field}
                        type="number"
                        className="font-mono"
                        placeholder="6000"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                          onFieldChange('actualIncomes.1', value)
                        }}
                      />
                      <p className="text-xs text-[#666666] mt-1">
                        Optional if not applicable
                      </p>
                    </div>
                  )}
                />

                <Controller
                  name="actualAges.1"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Age
                      </label>
                      <Input
                        {...field}
                        type="number"
                        placeholder="32"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                          onFieldChange('actualAges.1', value)
                        }}
                      />
                      <p className="text-xs text-[#666666] mt-1">
                        For IWAA calculation
                      </p>
                    </div>
                  )}
                />

                <Controller
                  name="applicant2Commitments"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Applicant 2 Monthly Commitments
                      </label>
                      <Input
                        {...field}
                        type="number"
                        className="font-mono"
                        placeholder="0"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
                          onFieldChange('applicant2Commitments', value)
                        }}
                      />
                      <p className="text-xs text-[#666666] mt-1">
                        Separate commitments for joint calculation
                      </p>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Tier 3 MAS Placeholder Panel */}
            {isValid && fieldValues.actualIncomes?.[0] && fieldValues.actualAges?.[0] && (
              <div className="mt-6 p-6 bg-[#F8F8F8] border border-[#E5E5E5]">
                <h4 className="text-sm font-semibold text-black mb-4">
                  <Users className="inline-block w-4 h-4 mr-2" />
                  Complete Eligibility Analysis
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* MAS Compliance Indicators */}
                  <div className="border-b border-[#E5E5E5] pb-3">
                    <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                      MAS Compliance Check
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-[#10B981]">✓</span>
                        <span>TDSR/MSR calculation ready</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-[#10B981]">✓</span>
                        <span>Stamp duty estimation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-[#10B981]">✓</span>
                        <span>Bank comparison analysis</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="pt-3">
                    <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
                      🔒 Ready for AI Broker Analysis
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-[#999999]">🔒</span>
                        <span>Personalized loan recommendations</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-[#999999]">🔒</span>
                        <span>Real-time rate comparisons</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-[#999999]">🔒</span>
                        <span>Document requirements checklist</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                    <div className="flex items-center gap-2 p-3 bg-[#FCD34D]/10 border border-[#FCD34D]/20">
                      <DollarSign className="w-4 h-4 text-[#FCD34D]" />
                      <div>
                        <p className="text-sm font-semibold text-black">
                          Complete Step 3 to unlock personalized analysis
                        </p>
                        <p className="text-xs text-[#666666]">
                          Get your MAS-compliant mortgage assessment
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
