// ABOUTME: Progressive mortgage application form with 3-step flow and real-time validation
// ABOUTME: Integrates with Chatwoot for seamless broker handoff and lead scoring

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Controller, FieldError } from 'react-hook-form'
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

  // Progress calculation
  const progressPercentage = ((currentStep + 1) / formSteps.length) * 100

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
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Full Name *
                  </label>
                  <Input
                    {...field}
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
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Email Address *
                  </label>
                  <Input
                    {...field}
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
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Phone Number *
                  </label>
                  <Input
                    {...field}
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
                    <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
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
                      <SelectTrigger>
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
                  <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Property Type *
                  </label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HDB">HDB Flat</SelectItem>
                      <SelectItem value="EC">Executive Condo</SelectItem>
                      <SelectItem value="Private">Private Condo</SelectItem>
                      <SelectItem value="Landed">Landed Property</SelectItem>
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
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Property Price *
                      </label>
                      <Input
                        {...field}
                        type="number"
                        className="font-mono"
                        placeholder="500000"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
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
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Combined Age *
                      </label>
                      <Input
                        {...field}
                        type="number"
                        placeholder="35"
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          field.onChange(value)
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
            {showInstantCalc && instantCalcResult && (
              <div className="mt-6 p-4 bg-[#FCD34D]/10 border border-[#FCD34D]/20">
                <h4 className="text-sm font-semibold text-black mb-2">
                  <Sparkles className="inline-block w-4 h-4 mr-2" />
                  Instant Analysis
                </h4>
                <div className="space-y-2">
                  {loanType === 'new_purchase' && instantCalcResult.maxLoan && (
                    <p className="text-sm text-[#666666]">
                      Maximum Loan: <span className="font-mono font-semibold">${instantCalcResult.maxLoan.toLocaleString()}</span>
                    </p>
                  )}
                  {loanType === 'refinance' && instantCalcResult.monthlySavings && (
                    <p className="text-sm text-[#666666]">
                      Monthly Savings: <span className="font-mono font-semibold text-[#10B981]">${instantCalcResult.monthlySavings.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 3: // Your Finances
        return (
          <div className="space-y-4">
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
                    onValueChange={field.onChange}
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
                    }}
                  />
                  <p className="text-xs text-[#666666] mt-1">
                    Include car loans, other mortgages, credit cards, etc.
                  </p>
                </div>
              )}
            />
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
                disabled={!isValid || isSubmitting || isExternallySubmitting}
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