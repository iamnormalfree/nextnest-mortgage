// ABOUTME: Mobile-first progressive mortgage application form with touch optimization
// ABOUTME: Uses native touch events (no framer-motion) and debounced calculations

/**
 * ABANDONED: 2025-10-17
 *
 * REASON FOR ABANDONMENT:
 * This mobile-specific form was created as a separate implementation but fell 32 hours
 * out of sync with the production form (ProgressiveFormWithController.tsx).
 *
 * MISSING FEATURES (vs production):
 * - Step 3 (Your Finances) - entire step not implemented
 * - Dr Elena v2 calculations and instant analysis
 * - Chatwoot handoff and ChatTransitionScreen integration
 * - Session persistence via useLoanApplicationStorage
 * - Joint applicant support
 * - Commercial loan support
 * - Event bus integration for analytics
 *
 * DECISION:
 * Use single responsive form approach instead (ProgressiveFormWithController.tsx with
 * mobile-optimized CSS). Maintaining two forms creates unnecessary technical debt.
 *
 * REPLACED BY:
 * components/forms/ProgressiveFormWithController.tsx (enhanced with responsive design)
 *
 * PRESERVED CONCEPTS:
 * - Native touch events (48px minimum touch targets)
 * - Debounced calculations (performance optimization)
 * - Mobile-first field ordering
 * These patterns documented in docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md
 *
 * ARCHIVED: components/forms/archive/2025-10/ProgressiveFormMobile.tsx
 */

'use client'

import React, { useState, useMemo, useCallback, TouchEvent } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { MobileNumberInput } from './mobile/MobileNumberInput'
import { MobileSelect } from './mobile/MobileSelect'
import { createGateSchema } from '@/lib/validation/mortgage-schemas'
import type { LoanType } from '@/lib/contracts/form-contracts'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'

interface ProgressiveFormMobileProps {
  loanType: LoanType
  sessionId: string
  onComplete: (data: any) => void
  onStepChange?: (step: number) => void
  onFieldChange?: (fieldName: string, value: any) => void
}

export function ProgressiveFormMobile({
  loanType,
  sessionId,
  onComplete,
  onStepChange,
  onFieldChange
}: ProgressiveFormMobileProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const currentSchema = createGateSchema(loanType, currentStep + 1) // Gates are 1-indexed

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
    getValues
  } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onChange'
  })

  // Debounced field change handler (prevents jank during swipe gestures)
  const debouncedFieldChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (fieldName: string, value: any) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        onFieldChange?.(fieldName, value)
      }, 300)
    }
  }, [onFieldChange])

  // Native touch event handlers (0KB bundle size vs 40KB for framer-motion)
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = async () => {
    if (!touchStart || !touchEnd) return

    const delta = touchStart - touchEnd
    const threshold = 100 // Minimum swipe distance in pixels

    if (Math.abs(delta) > threshold) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }

      if (delta > 0 && currentStep < 2) {
        // Swiped left - go to next step
        const isStepValid = await trigger()
        if (isStepValid) {
          goToNextStep()
        }
      } else if (delta < 0 && currentStep > 0) {
        // Swiped right - go to previous step
        goToPreviousStep()
      }
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const goToNextStep = useCallback(() => {
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    onStepChange?.(nextStep)
  }, [currentStep, onStepChange])

  const goToPreviousStep = useCallback(() => {
    const prevStep = currentStep - 1
    setCurrentStep(prevStep)
    onStepChange?.(prevStep)
  }, [currentStep, onStepChange])

  const onSubmit = async (data: any) => {
    if (currentStep < 2) {
      goToNextStep()
    } else {
      onComplete(data)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Step 1: Basic Information
        return (
          <div className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">
                    Your Name
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={cn(
                      'w-full h-14 px-4 text-base',
                      'border-2 border-[#E5E5E5]',
                      'focus:border-[#FCD34D] focus:outline-none transition-colors',
                      'touch-manipulation',
                      errors.name && 'border-[#EF4444]'
                    )}
                    placeholder="John Doe"
                    onChange={(e) => {
                      field.onChange(e)
                      debouncedFieldChange('name', e.target.value)
                    }}
                    onFocus={() => 'vibrate' in navigator && navigator.vibrate(10)}
                  />
                  {errors.name && (
                    <p className="text-sm text-[#EF4444]" role="alert">
                      {String(errors.name.message)}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">
                    Email Address
                  </label>
                  <input
                    {...field}
                    type="email"
                    inputMode="email"
                    className={cn(
                      'w-full h-14 px-4 text-base',
                      'border-2 border-[#E5E5E5]',
                      'focus:border-[#FCD34D] focus:outline-none transition-colors',
                      'touch-manipulation',
                      errors.email && 'border-[#EF4444]'
                    )}
                    placeholder="john@example.com"
                    onChange={(e) => {
                      field.onChange(e)
                      debouncedFieldChange('email', e.target.value)
                    }}
                    onFocus={() => 'vibrate' in navigator && navigator.vibrate(10)}
                  />
                  {errors.email && (
                    <p className="text-sm text-[#EF4444]" role="alert">
                      {String(errors.email.message)}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Trust Signal */}
            <div className="mt-4 p-3 bg-blue-50">
              <div className="flex items-center text-sm text-blue-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Bank-grade encryption. We&apos;ll email you a detailed report instantly.
              </div>
            </div>
          </div>
        )

      case 1: // Step 2: Property Details
        return (
          <div className="space-y-4">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">
                    Singapore Phone Number
                  </label>
                  <input
                    {...field}
                    type="tel"
                    inputMode="tel"
                    className={cn(
                      'w-full h-14 px-4 text-base font-mono',
                      'border-2 border-[#E5E5E5]',
                      'focus:border-[#FCD34D] focus:outline-none transition-colors',
                      'touch-manipulation',
                      errors.phone && 'border-[#EF4444]'
                    )}
                    placeholder="9123 4567"
                    onChange={(e) => {
                      field.onChange(e)
                      debouncedFieldChange('phone', e.target.value)
                    }}
                    onFocus={() => 'vibrate' in navigator && navigator.vibrate(10)}
                  />
                  {errors.phone && (
                    <p className="text-sm text-[#EF4444]" role="alert">
                      {String(errors.phone.message)}
                    </p>
                  )}
                </div>
              )}
            />

            {loanType === 'new_purchase' && (
              <>
                <Controller
                  name="propertyType"
                  control={control}
                  render={({ field }) => (
                    <MobileSelect
                      label="Property Type"
                      name="propertyType"
                      options={[
                        { value: 'HDB', label: 'HDB Flat', description: 'Public housing' },
                        { value: 'EC', label: 'Executive Condo', description: 'Hybrid public-private' },
                        { value: 'Private', label: 'Private Condo', description: 'Fully private' },
                        { value: 'Landed', label: 'Landed Property', description: 'House, bungalow' }
                      ]}
                      value={field.value || ''}
                      onChange={(val) => {
                        field.onChange(val)
                        debouncedFieldChange('propertyType', val)
                      }}
                      error={errors.propertyType ? String(errors.propertyType.message) : undefined}
                    />
                  )}
                />

                <Controller
                  name="priceRange"
                  control={control}
                  render={({ field }) => (
                    <MobileNumberInput
                      label="Property Price Range (Optional)"
                      name="priceRange"
                      value={formatNumberWithCommas(field.value || '')}
                      onChange={(val) => {
                        const numericValue = parseFormattedNumber(val)
                        field.onChange(numericValue)
                        debouncedFieldChange('priceRange', numericValue)
                      }}
                      placeholder="800,000"
                      helperText="💡 Rough estimate helps us recommend suitable options"
                      error={errors.priceRange ? String(errors.priceRange.message) : undefined}
                    />
                  )}
                />
              </>
            )}

            {loanType === 'refinance' && (
              <>
                <Controller
                  name="currentRate"
                  control={control}
                  render={({ field }) => (
                    <MobileNumberInput
                      label="Current Interest Rate (%) (Optional)"
                      name="currentRate"
                      value={field.value || ''}
                      onChange={(val) => {
                        field.onChange(val)
                        debouncedFieldChange('currentRate', val)
                      }}
                      prefix="%"
                      placeholder="3.5"
                      helperText="💡 Check your latest statement or estimate"
                      error={errors.currentRate ? String(errors.currentRate.message) : undefined}
                    />
                  )}
                />

                <Controller
                  name="lockInStatus"
                  control={control}
                  render={({ field }) => (
                    <MobileSelect
                      label="Lock-in Period Status"
                      name="lockInStatus"
                      options={[
                        { value: 'ending_soon', label: 'Ending soon', description: 'Within 6 months' },
                        { value: 'no_lock', label: 'No lock-in', description: 'Free to refinance' },
                        { value: 'locked', label: 'Still locked', description: 'Penalty applies' },
                        { value: 'not_sure', label: 'Not sure', description: 'We can help check' }
                      ]}
                      value={field.value || ''}
                      onChange={(val) => {
                        field.onChange(val)
                        debouncedFieldChange('lockInStatus', val)
                      }}
                      error={errors.lockInStatus ? String(errors.lockInStatus.message) : undefined}
                    />
                  )}
                />
              </>
            )}

            {/* Trust Signal */}
            <div className="mt-4 p-3 bg-green-50">
              <div className="flex items-center text-sm text-green-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                We&apos;ll WhatsApp you exclusive rates not shown online
              </div>
            </div>
          </div>
        )

      case 2: // Step 3: Financial Details
        return (
          <div className="space-y-4">
            <Controller
              name="monthlyIncome"
              control={control}
              render={({ field }) => (
                <MobileNumberInput
                  label="Monthly Income"
                  name="monthlyIncome"
                  value={formatNumberWithCommas(field.value || '')}
                  onChange={(val) => {
                    const numericValue = parseFormattedNumber(val)
                    field.onChange(numericValue)
                    debouncedFieldChange('monthlyIncome', numericValue)
                  }}
                  placeholder="8,000"
                  helperText="💡 Combined household income for joint applications"
                  error={errors.monthlyIncome ? String(errors.monthlyIncome.message) : undefined}
                />
              )}
            />

            <Controller
              name="existingCommitments"
              control={control}
              render={({ field }) => (
                <MobileNumberInput
                  label="Monthly Commitments (Optional)"
                  name="existingCommitments"
                  value={formatNumberWithCommas(field.value || '')}
                  onChange={(val) => {
                    const numericValue = parseFormattedNumber(val)
                    field.onChange(numericValue)
                    debouncedFieldChange('existingCommitments', numericValue)
                  }}
                  placeholder="1,500"
                  helperText="💡 Car loans, student loans, credit cards. Skip if none"
                  error={errors.existingCommitments ? String(errors.existingCommitments.message) : undefined}
                />
              )}
            />

            {/* Trust Signal */}
            <div className="mt-4 p-3 bg-purple-50">
              <div className="flex items-center text-sm text-purple-700">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                AI analyzing 23+ banks for your personalized strategy
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className={cn(
              "text-sm text-[#666666] px-2 py-1 touch-manipulation",
              currentStep === 0 && "invisible"
            )}
            aria-label="Go to previous step"
          >
            ← Back
          </button>
          <div className="text-xs text-[#666666]">
            Step {currentStep + 1} of 3
          </div>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Form Content (scrollable) */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 px-4 py-6 overflow-auto"
      >
        <div className="max-w-lg mx-auto">
          {renderStepContent()}
        </div>
      </form>

      {/* Sticky Footer CTA */}
      <footer className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-4 py-3">
        <button
          type="submit"
          disabled={!isValid}
          onClick={() => 'vibrate' in navigator && navigator.vibrate(10)}
          className={cn(
            'w-full h-12 font-semibold text-base transition-colors touch-manipulation',
            isValid
              ? 'bg-[#FCD34D] hover:bg-[#FBB614] text-black'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
          aria-label={currentStep < 2 ? 'Continue to next step' : 'Submit form'}
        >
          {currentStep < 2 ? 'Continue' : 'Connect with AI Mortgage Specialist'}
        </button>
      </footer>
    </div>
  )
}
