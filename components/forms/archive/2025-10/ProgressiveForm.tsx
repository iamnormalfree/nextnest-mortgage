/**
 * ABANDONED: 2025-10-17
 *
 * REASON FOR ABANDONMENT:
 * Legacy gate-based form only used by IntelligentMortgageForm.tsx (which itself is
 * not in production). Production uses ProgressiveFormWithController.tsx.
 *
 * ARCHITECTURE:
 * - Gate-based progression with LeadForm domain entity
 * - Event bus integration (FormEvents.FIELD_CHANGED, AI_INSIGHT_REQUESTED)
 * - Field-level AI insight triggering on significant fields
 * - Calls /api/ai-insights endpoint
 *
 * REPLACED BY:
 * - components/forms/ProgressiveFormWithController.tsx (step-based architecture)
 * - Client-side instant calculations vs. API-dependent insights
 * - Direct Chatwoot integration for AI interaction
 *
 * USEFUL PATTERNS PRESERVED:
 * - Field-level AI insight triggering (alternative to instant calculation)
 * - Trust signal system with deduplication
 * - LeadForm entity pattern (still exists in lib/domains/forms/entities/)
 * - Progressive trust level visualization
 * Documented in docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md (Legacy Patterns section)
 *
 * VERIFICATION QUESTIONS ANSWERED:
 * - LeadForm entity: Still exists, production uses hybrid approach (entity + RHF)
 * - Event bus: Fully integrated in production
 * - IPA Status field: Type exists in contract but NOT in UI (future enhancement)
 * - Urgency calculation: Production uses lead scoring instead
 *
 * ARCHIVED: components/forms/archive/2025-10/ProgressiveForm.tsx
 */

/**
 * Progressive Form Architecture
 * Lead: Sarah Lim - Senior Frontend Engineer
 *
 * Gate-based progressive disclosure form with AI insights
 * Implements micro-commitment ladder for trust building
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm, Controller, FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  FormState,
  FormGate,
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
import { LeadForm } from '@/lib/domains/forms/entities/LeadForm'
import { createGateSchema } from '@/lib/validation/mortgage-schemas'
import { useLoadingAnimation } from '@/lib/hooks/useAnimation'
import { cn, formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
import '@/styles/animations.css'

// ============================================================================
// GATE DEFINITIONS
// ============================================================================

const formGates: FormGate[] = [
  {
    gateNumber: 0,
    label: 'Loan Type',
    description: 'Choose your mortgage path',
    fieldsRequired: ['loanType'],
    minimumFields: 1,
    trustLevel: 0,
    ctaText: 'Get Instant Estimate (No Email Required)'
  },
  {
    gateNumber: 1,
    label: 'Basic Information',
    description: 'Get your personalized rate',
    fieldsRequired: ['name', 'email', 'phone'],
    minimumFields: 3,
    trustLevel: 25,
    ctaText: 'See Detailed Analysis'
  },
  {
    gateNumber: 2,
    label: 'Property Details',
    description: 'Help us find your best match',
    fieldsRequired: [],
    minimumFields: 0,
    trustLevel: 50,
    ctaText: 'Get Full Analysis'
  },
  {
    gateNumber: 3,
    label: 'Financial Profile',
    description: 'Get broker-exclusive rates',
    fieldsRequired: ['monthlyIncome', 'existingCommitments'],
    minimumFields: 2,
    trustLevel: 75,
    ctaText: 'Get Best Rates & Expert Advice'
  }
]

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ProgressiveFormProps {
  loanType: LoanType
  sessionId: string
  onGateCompletion: (gate: number, data: any) => void
  onAIInsight: (insight: AIInsightResponse) => void
  onScoreUpdate: (score: LeadScore) => void
  isSubmitting?: boolean
  submissionError?: string | null
  className?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressiveForm({
  loanType,
  sessionId,
  onGateCompletion,
  onAIInsight,
  onScoreUpdate,
  isSubmitting = false,
  submissionError = null,
  className
}: ProgressiveFormProps) {
  // Form state management
  const [currentGate, setCurrentGate] = useState(1) // Start at gate 1 (loan type already selected)
  const [completedGates, setCompletedGates] = useState<number[]>([0])
  const [leadForm] = useState(() => {
    const form = new LeadForm(sessionId)
    // Set the loan type and progress to gate 1 since loan type is already selected
    form.selectLoanType(loanType)
    form.setFieldValue('loanType', loanType, 0)
    form.progressToGate(1)
    return form
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsightResponse[]>([])
  const [trustSignalsShown, setTrustSignalsShown] = useState<string[]>([])
  
  // Event publishing
  const publishEvent = useEventPublisher()
  const createEvent = useCreateEvent(sessionId)
  
  // Loading animation - considers both local analysis and n8n submission
  const showLoading = useLoadingAnimation(isAnalyzing || isSubmitting, 500)
  
  // React Hook Form setup with proper default values
  const currentSchema = createGateSchema(loanType, currentGate)
  const getDefaultValues = () => {
    const defaults: any = {
      loanType,
      name: '',
      email: '',
      phone: '',
      // Gate 3 fields
      monthlyIncome: 0,
      existingCommitments: 0,
      packagePreference: '',
      riskTolerance: '',
      planningHorizon: ''
    }
    
    // Add loan-type specific defaults
    if (loanType === 'new_purchase') {
      defaults.propertyType = ''
      defaults.priceRange = 0
      defaults.purchaseTimeline = ''
      defaults.ipaStatus = ''
      defaults.firstTimeBuyer = false
    } else if (loanType === 'refinance') {
      defaults.currentRate = 0
      defaults.lockInStatus = ''
      defaults.currentBank = ''
      defaults.propertyValue = 0
      defaults.outstandingLoan = 0
    }
    // REMOVED: equity_loan not in LoanType union ('new_purchase' | 'refinance' | 'commercial')
    // else if (loanType === 'equity_loan') {
    //   defaults.propertyValue = 0
    //   defaults.outstandingLoan = 0
    //   defaults.equityNeeded = 0
    //   defaults.purpose = ''
    // }
    
    return defaults
  }

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    reset
  } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onChange',
    defaultValues: getDefaultValues()
  })
  
  // Watch for field changes to trigger AI insights
  const watchedFields = watch()
  
  // Debug current form state
  useEffect(() => {
    console.log('📋 Form state update:', {
      currentGate,
      isValid,
      errors: Object.keys(errors),
      watchedFields,
      schema: currentSchema._def
    })
  }, [currentGate, isValid, errors, watchedFields, currentSchema])
  
  useEffect(() => {
    // Set loan type in lead form
    leadForm.selectLoanType(loanType)
  }, [loanType, leadForm])
  
  // Field change handler with AI trigger
  const handleFieldChange = useCallback(async (fieldName: string, value: any) => {
    // Update lead form
    leadForm.setFieldValue(fieldName, value, currentGate)
    
    // Emit field changed event
    await publishEvent(createEvent(
      FormEvents.FIELD_CHANGED,
      `field-${fieldName}`,
      { fieldName, value, gate: currentGate }
    ))
    
    // Trigger AI insight for significant fields
    const significantFields = ['priceRange', 'currentRate', 'monthlyIncome', 'propertyType']
    if (significantFields.includes(fieldName)) {
      requestAIInsight(fieldName, value)
    }
  }, [currentGate, leadForm, publishEvent, createEvent]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Request AI insight
  const requestAIInsight = useCallback(async (fieldName: string, value: any) => {
    setIsAnalyzing(true)
    
    await publishEvent(createEvent(
      FormEvents.AI_INSIGHT_REQUESTED,
      `insight-${fieldName}`,
      { fieldName, value }
    ))
    
    try {
      // Call API for AI insight 
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: {
            [fieldName]: value,
            loanType: loanType,
            ...leadForm.getPublicData()
          },
          aiContext: {
            sessionId,
            currentGate,
            completedGates
          },
          stage: 'detailed'
        })
      })
      
      if (response.ok) {
        const insight: AIInsightResponse = await response.json()
        setAiInsights(prev => [...prev, insight])
        leadForm.addAIInsight(insight)
        onAIInsight(insight)
        
        await publishEvent(createEvent(
          FormEvents.AI_INSIGHT_RECEIVED,
          `insight-${fieldName}`,
          { insight }
        ))
      }
    } catch (error) {
      console.error('AI insight error:', error)
      await publishEvent(createEvent(
        FormEvents.AI_INSIGHT_FAILED,
        `insight-${fieldName}`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ))
    } finally {
      setIsAnalyzing(false)
    }
  }, [publishEvent, createEvent, sessionId, currentGate, completedGates, loanType, leadForm, onAIInsight])
  
  // Progress to next gate
  const progressToNextGate = async (data: any) => {
    console.log('🔍 Attempting to progress to next gate:', {
      currentGate,
      formData: data,
      leadFormData: leadForm.getPublicData()
    })
    
    // Ensure all form data is synced to LeadForm before validation
    console.log('📤 Syncing data to LeadForm:', data)
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        console.log(`  📝 Setting ${key} = ${data[key]} (${typeof data[key]})`)
        leadForm.setFieldValue(key, data[key], currentGate)
      }
    })
    
    console.log('📊 LeadForm state after sync:', leadForm.getPublicData())
    
    // Validate and progress (LeadForm and React state should be in sync)
    const nextGate = currentGate + 1
    console.log(`🔄 Calling progressToGate(${nextGate}) from current gate ${currentGate}`)
    const canProgress = leadForm.progressToGate(nextGate)
    
    console.log('✅ Can progress?', canProgress)
    
    if (canProgress) {
      setCompletedGates(prev => [...prev, currentGate])
      setCurrentGate(currentGate + 1)
      
      // Emit gate completed event
      await publishEvent(createEvent(
        FormEvents.GATE_COMPLETED,
        `gate-${currentGate}`,
        { gateNumber: currentGate, data }
      ))
      
      // Callback to parent
      onGateCompletion(currentGate, data)
      
      // Show trust signal for new gate
      showTrustSignal(currentGate + 1)
      
      console.log('🎉 Successfully progressed to gate:', currentGate + 1)
    } else {
      console.log('❌ Cannot progress - validation failed')
    }
  }
  
  // Show trust signal based on gate
  const showTrustSignal = (gateNumber: number) => {
    const trustSignals = {
      1: '✅ Your data is encrypted with bank-grade security',
      2: '🎯 AI analyzing 23+ banks for your profile',
      3: '💰 Average savings identified: $456/month'
    }
    
    const signal = trustSignals[gateNumber as keyof typeof trustSignals]
    if (signal && !trustSignalsShown.includes(signal)) {
      setTrustSignalsShown(prev => [...prev, signal])
      
      publishEvent(createEvent(
        FormEvents.TRUST_SIGNAL_SHOWN,
        `trust-gate-${gateNumber}`,
        { signal, gateNumber }
      ))
    }
  }
  
  // Render loan-type specific fields for Gate 2
  const renderLoanSpecificFields = () => {
    switch (loanType) {
      case 'new_purchase':
        return (
          <>
            {/* Purchase Timeline */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When are you buying?
              </label>
              <Controller
                name="purchaseTimeline"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.purchaseTimeline ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('purchaseTimeline', e.target.value)
                    }}
                  >
                    <option value="">Select timeline</option>
                    <option value="this_month">This month</option>
                    <option value="next_3_months">Next 3 months</option>
                    <option value="3_6_months">3-6 months</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                )}
              />
              {errors.purchaseTimeline && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.purchaseTimeline.message)}
                </p>
              )}
            </div>

            {/* Property Type */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.propertyType ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('propertyType', e.target.value)
                    }}
                  >
                    <option value="">Select property type</option>
                    <option value="HDB">HDB Flat</option>
                    <option value="EC">Executive Condo</option>
                    <option value="Private">Private Condo</option>
                    <option value="Landed">Landed Property</option>
                  </select>
                )}
              />
              {errors.propertyType && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.propertyType.message)}
                </p>
              )}
            </div>

            {/* Price Range */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Price Range <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <Controller
                name="priceRange"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      className={cn(
                        'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.priceRange ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="800,000"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(e.target.value)
                        field.onChange(numericValue)
                        handleFieldChange('priceRange', Number(numericValue))
                      }}
                    />
                  </div>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 Rough estimate helps us recommend suitable options. You can explore multiple ranges.
              </p>
              {errors.priceRange && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.priceRange.message)}
                </p>
              )}
            </div>

            {/* IPA Status */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                In-Principle Approval Status <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <Controller
                name="ipaStatus"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.ipaStatus ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('ipaStatus', e.target.value)
                    }}
                  >
                    <option value="">Select IPA status</option>
                    <option value="have_ipa">Already have IPA</option>
                    <option value="applied">Applied, waiting</option>
                    <option value="starting">Starting process</option>
                    <option value="what_is_ipa">What is IPA?</option>
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 IPA = pre-approval from bank. Helps with negotiations but not required to start.
              </p>
              {errors.ipaStatus && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.ipaStatus.message)}
                </p>
              )}
            </div>
          </>
        )

      case 'refinance':
        return (
          <>
            {/* Current Rate */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Interest Rate (%) <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <Controller
                name="currentRate"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step="0.1"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.currentRate ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    placeholder="3.5"
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('currentRate', Number(e.target.value))
                    }}
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 Check your latest statement or estimate. We&apos;ll verify exact rate later.
              </p>
              {errors.currentRate && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.currentRate.message)}
                </p>
              )}
            </div>

            {/* Lock-in Status */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lock-in Period Status
              </label>
              <Controller
                name="lockInStatus"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.lockInStatus ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('lockInStatus', e.target.value)
                    }}
                  >
                    <option value="">Select lock-in status</option>
                    <option value="ending_soon">Ending soon</option>
                    <option value="no_lock">No lock-in</option>
                    <option value="locked">Still locked</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                )}
              />
              {errors.lockInStatus && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.lockInStatus.message)}
                </p>
              )}
            </div>

            {/* Current Bank */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Bank
              </label>
              <Controller
                name="currentBank"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.currentBank ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('currentBank', e.target.value)
                    }}
                  >
                    <option value="">Select current bank</option>
                    <option value="DBS">DBS</option>
                    <option value="OCBC">OCBC</option>
                    <option value="UOB">UOB</option>
                    <option value="Standard Chartered">Standard Chartered</option>
                    <option value="Citibank">Citibank</option>
                    <option value="HSBC">HSBC</option>
                    <option value="Maybank">Maybank</option>
                    <option value="CIMB">CIMB</option>
                    <option value="Hong Leong Finance">Hong Leong Finance</option>
                    <option value="Bank of China">Bank of China</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Singapura Finance">Singapura Finance</option>
                    <option value="RHB">RHB</option>
                    <option value="HL Bank">HL Bank</option>
                    <option value="Other">Other</option>
                  </select>
                )}
              />
              {errors.currentBank && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.currentBank.message)}
                </p>
              )}
            </div>

            {/* Property Value */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Property Value
              </label>
              <Controller
                name="propertyValue"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      className={cn(
                        'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.propertyValue ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="1,200,000"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(e.target.value)
                        field.onChange(numericValue)
                        handleFieldChange('propertyValue', Number(numericValue))
                      }}
                    />
                  </div>
                )}
              />
              {errors.propertyValue && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.propertyValue.message)}
                </p>
              )}
            </div>

            {/* Outstanding Loan */}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outstanding Loan Balance
              </label>
              <Controller
                name="outstandingLoan"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      className={cn(
                        'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.outstandingLoan ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="800,000"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(e.target.value)
                        field.onChange(numericValue)
                        handleFieldChange('outstandingLoan', Number(numericValue))
                      }}
                    />
                  </div>
                )}
              />
              {errors.outstandingLoan && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.outstandingLoan.message)}
                </p>
              )}
            </div>
          </>
        )

      // REMOVED: equity_loan not in LoanType union ('new_purchase' | 'refinance' | 'commercial')
      /*
      case 'equity_loan':
        return (
          <>
            {/* Property Value *\/}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Property Value <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <Controller
                name="propertyValue"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      className={cn(
                        'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.propertyValue ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="1,500,000"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(e.target.value)
                        field.onChange(numericValue)
                        handleFieldChange('propertyValue', Number(numericValue))
                      }}
                    />
                  </div>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 We can estimate via market data if you&apos;re unsure. Leave blank for now.
              </p>
              {errors.propertyValue && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.propertyValue.message)}
                </p>
              )}
            </div>

            {/* Outstanding Loan *\/}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outstanding Mortgage Balance
              </label>
              <Controller
                name="outstandingLoan"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      className={cn(
                        'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.outstandingLoan ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="600,000"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(e.target.value)
                        field.onChange(numericValue)
                        handleFieldChange('outstandingLoan', Number(numericValue))
                      }}
                    />
                  </div>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 Ballpark figure is fine. Check your latest statement or bank app for estimate.
              </p>
              {errors.outstandingLoan && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.outstandingLoan.message)}
                </p>
              )}
            </div>

            {/* Equity Needed *\/}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equity Amount Needed
              </label>
              <Controller
                name="equityNeeded"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      className={cn(
                        'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.equityNeeded ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="300,000"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(e) => {
                        const numericValue = parseFormattedNumber(e.target.value)
                        field.onChange(numericValue)
                        handleFieldChange('equityNeeded', Number(numericValue))
                      }}
                    />
                  </div>
                )}
              />
              {errors.equityNeeded && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.equityNeeded.message)}
                </p>
              )}
            </div>

            {/* Purpose *\/}
            <div className="field-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Equity Loan <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </label>
              <Controller
                name="purpose"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.purpose ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('purpose', e.target.value)
                    }}
                  >
                    <option value="">Select purpose (optional)</option>
                    <option value="investment">Investment</option>
                    <option value="business">Business Capital</option>
                    <option value="personal">Personal Use</option>
                    <option value="other">Other</option>
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 General category is fine. We can discuss details later.
              </p>
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                  {String(errors.purpose.message)}
                </p>
              )}
            </div>
          </>
        )
      */

      default:
        return null
    }
  }

  // Render Gate 3 fields (Optimization Parameters)
  const renderGate3Fields = () => {
    return (
      <>
        <div className="space-y-4">
          {/* Monthly Income */}
          <div className="field-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Income
            </label>
            <Controller
              name="monthlyIncome"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    className={cn(
                      'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.monthlyIncome ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    placeholder="8,000"
                    value={formatNumberWithCommas(field.value || '')}
                    onChange={(e) => {
                      const numericValue = parseFormattedNumber(e.target.value)
                      field.onChange(numericValue)
                      handleFieldChange('monthlyIncome', Number(numericValue))
                    }}
                  />
                </div>
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Combined household income for joint applications
            </p>
            {errors.monthlyIncome && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {String(errors.monthlyIncome.message)}
              </p>
            )}
          </div>

          {/* Existing Commitments */}
          <div className="field-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Commitments <span className="text-gray-400 text-sm font-normal">(Optional)</span>
            </label>
            <Controller
              name="existingCommitments"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    className={cn(
                      'w-full pl-8 pr-4 py-2 border rounded-lg field-focus transition-all-300',
                      errors.existingCommitments ? 'border-red-500 field-error' : 'border-gray-300'
                    )}
                    placeholder="1,500"
                    value={formatNumberWithCommas(field.value || '')}
                    onChange={(e) => {
                      const numericValue = parseFormattedNumber(e.target.value)
                      field.onChange(numericValue)
                      handleFieldChange('existingCommitments', Number(numericValue))
                    }}
                  />
                </div>
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Include car loans, student loans, credit cards. Skip if none.
            </p>
            {errors.existingCommitments && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {String(errors.existingCommitments.message)}
              </p>
            )}
          </div>

          {/* Package Preference */}
          <div className="field-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What matters most to you?
            </label>
            <Controller
              name="packagePreference"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                    errors.packagePreference ? 'border-red-500 field-error' : 'border-gray-300'
                  )}
                  onChange={(e) => {
                    field.onChange(e)
                    handleFieldChange('packagePreference', e.target.value)
                  }}
                >
                  <option value="">Select your priority</option>
                  <option value="lowest_rate">Lowest interest rate</option>
                  <option value="flexibility">Flexibility (no lock-in)</option>
                  <option value="stability">Stability (fixed rates)</option>
                  <option value="features">Extra features (offset, redraw)</option>
                </select>
              )}
            />
            {errors.packagePreference && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {String(errors.packagePreference.message)}
              </p>
            )}
          </div>

          {/* Risk Tolerance */}
          <div className="field-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Appetite
            </label>
            <Controller
              name="riskTolerance"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                    errors.riskTolerance ? 'border-red-500 field-error' : 'border-gray-300'
                  )}
                  onChange={(e) => {
                    field.onChange(e)
                    handleFieldChange('riskTolerance', e.target.value)
                  }}
                >
                  <option value="">Select risk tolerance</option>
                  <option value="conservative">Conservative (prefer fixed rates)</option>
                  <option value="moderate">Moderate (mix of fixed & floating)</option>
                  <option value="aggressive">Aggressive (okay with floating rates)</option>
                </select>
              )}
            />
            {errors.riskTolerance && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {String(errors.riskTolerance.message)}
              </p>
            )}
          </div>

          {/* Planning Horizon */}
          <div className="field-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Planning Timeline
            </label>
            <Controller
              name="planningHorizon"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                    errors.planningHorizon ? 'border-red-500 field-error' : 'border-gray-300'
                  )}
                  onChange={(e) => {
                    field.onChange(e)
                    handleFieldChange('planningHorizon', e.target.value)
                  }}
                >
                  <option value="">How long will you keep this property?</option>
                  <option value="short_term">Short-term (2-5 years)</option>
                  <option value="medium_term">Medium-term (5-10 years)</option>
                  <option value="long_term">Long-term (10+ years)</option>
                </select>
              )}
            />
            {errors.planningHorizon && (
              <p className="mt-1 text-sm text-red-600 animate-fade-in">
                {String(errors.planningHorizon.message)}
              </p>
            )}
          </div>
        </div>
        
        {/* Trust Signal */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg animate-fade-in">
          <div className="flex items-center text-sm text-purple-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            AI analyzing 23+ banks for your personalized strategy
          </div>
        </div>
      </>
    )
  }

  // Render form fields based on current gate
  const renderGateFields = () => {
    switch (currentGate) {
      case 1:
        return (
          <>
            <div className="space-y-4">
              {/* Name Field */}
              <div className="field-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ''}
                      type="text"
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.name ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="John Doe"
                      onChange={(e) => {
                        field.onChange(e)
                        handleFieldChange('name', e.target.value)
                      }}
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 animate-fade-in">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>
              
              {/* Email Field */}
              <div className="field-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ''}
                      type="email"
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.email ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="john@example.com"
                      onChange={(e) => {
                        field.onChange(e)
                        handleFieldChange('email', e.target.value)
                      }}
                    />
                  )}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 animate-fade-in">
                    {String(errors.email.message)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Trust Signal */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg animate-fade-in">
              <div className="flex items-center text-sm text-blue-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                We&apos;ll email you a detailed report instantly
              </div>
            </div>
          </>
        )
        
      case 2:
        return (
          <>
            <div className="space-y-4">
              {/* Phone Field - Common to all loan types */}
              <div className="field-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Singapore Phone Number
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg field-focus transition-all-300',
                        errors.phone ? 'border-red-500 field-error' : 'border-gray-300'
                      )}
                      placeholder="9123 4567"
                      onChange={(e) => {
                        field.onChange(e)
                        handleFieldChange('phone', e.target.value)
                      }}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 animate-fade-in">
                    {String(errors.phone.message)}
                  </p>
                )}
              </div>

              {/* Loan-Type Specific Fields */}
              {renderLoanSpecificFields()}
            </div>
            
            {/* Trust Signal */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg animate-fade-in">
              <div className="flex items-center text-sm text-green-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                We&apos;ll WhatsApp you exclusive rates not shown online
              </div>
            </div>
          </>
        )
        
      case 3:
        return renderGate3Fields()
        
      default:
        return null
    }
  }
  
  return (
    <div className={cn('progressive-form', className)}>
      {/* Progress Indicator */}
      <div className="progress-indicator mb-6">
        <div className="flex items-center justify-between">
          {formGates.map((gate, index) => (
            <div
              key={gate.gateNumber}
              className={cn(
                'flex items-center',
                index < formGates.length - 1 && 'flex-1'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all-300',
                  completedGates.includes(gate.gateNumber)
                    ? 'bg-green-500 text-white'
                    : gate.gateNumber === currentGate
                    ? 'bg-[#FFB800] text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {completedGates.includes(gate.gateNumber) ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  gate.gateNumber + 1
                )}
              </div>
              {index < formGates.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 transition-all-300',
                    completedGates.includes(gate.gateNumber)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Gate Labels */}
        <div className="flex justify-between mt-2">
          {formGates.map((gate) => (
            <div
              key={gate.gateNumber}
              className={cn(
                'text-xs',
                gate.gateNumber === currentGate
                  ? 'text-[#FFB800] font-semibold'
                  : completedGates.includes(gate.gateNumber)
                  ? 'text-green-600'
                  : 'text-gray-400'
              )}
            >
              {gate.label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Trust Level Indicator */}
      <div className="trust-level mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Trust Level</span>
          <span className="font-semibold text-[#FFB800]">
            {formGates[currentGate]?.trustLevel || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="bg-gradient-to-r from-[#FFB800] to-[#FFC933] h-2 rounded-full transition-all-300"
            style={{ width: `${formGates[currentGate]?.trustLevel || 0}%` }}
          />
        </div>
      </div>
      
      {/* Form Content */}
      <form onSubmit={handleSubmit(progressToNextGate)} className="space-y-6">
        {/* Gate Description */}
        <div className="animate-fade-in">
          <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">
            {formGates[currentGate]?.label}
          </h3>
          <p className="text-gray-600">
            {formGates[currentGate]?.description}
          </p>
        </div>
        
        {/* Dynamic Fields */}
        <div className="animate-slide-up">
          {renderGateFields()}
        </div>
        
        {/* AI Insights Display */}
        {aiInsights.length > 0 && (
          <div className="ai-insights space-y-3">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-[#FFB800]/10 to-transparent rounded-lg border border-[#FFB800]/20 animate-fade-in"
              >
                <div className="flex items-start">
                  <span className="text-[#FFB800] mr-2">✨</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{insight.insight}</p>
                    {insight.calculation && (
                      <div className="mt-2 text-xs text-gray-600">
                        Monthly: ${insight.calculation.monthlyPayment?.amount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || showLoading}
          onClick={() => {
            console.log('🔘 Button clicked! isValid:', isValid, 'currentGate:', currentGate, 'errors:', errors)
          }}
          className={cn(
            'w-full py-3 px-6 rounded-lg font-semibold transition-all-300',
            isValid && !showLoading
              ? 'bg-[#FFB800] text-white hover:bg-[#FFC933] hover-scale'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          {showLoading ? (
            <span className="flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              {isSubmitting && currentGate === 2 ? 'Submitting for preliminary analysis...' :
               isSubmitting && currentGate === 3 ? 'Submitting for full analysis...' :
               'Analyzing...'}
            </span>
          ) : (
            formGates[currentGate]?.ctaText || 'Continue'
          )}
        </button>
      </form>
      
      {/* Submission Error Message */}
      {submissionError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {submissionError}
          </p>
        </div>
      )}
      
      {/* Trust Signals */}
      {trustSignalsShown.length > 0 && (
        <div className="mt-6 space-y-2">
          {trustSignalsShown.map((signal, index) => (
            <div
              key={index}
              className="text-sm text-gray-600 flex items-center animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {signal}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProgressiveForm