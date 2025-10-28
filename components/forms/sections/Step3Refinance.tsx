// ABOUTME: Simplified Step 3 Refinance section with job change questions and progressive disclosure

'use client'

import { useState } from 'react'
import { Controller, Control, UseFormSetValue, UseFormWatch, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'

interface Step3RefinanceProps {
  onFieldChange: (field: string, value: any, analytics?: any) => void
  showJointApplicant: boolean
  errors: any
  getErrorMessage: (error: any) => string
  fieldValues: any
  control: Control<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
}

export function Step3Refinance({
  onFieldChange,
  showJointApplicant,
  errors,
  getErrorMessage,
  fieldValues,
  control,
  setValue,
  watch
}: Step3RefinanceProps) {
  // State for progressive disclosure
  const [hasChangedJobPrimary, setHasChangedJobPrimary] = useState<boolean | null>(null)
  const [hasChangedJobCoApplicant, setHasChangedJobCoApplicant] = useState<boolean | null>(null)
  const [lockInTimeframe, setLockInTimeframe] = useState<string>('')

  // Watch property type for cash-out eligibility
  const propertyTypeValue = useWatch({ control, name: 'propertyType' })

  // Watch refinancing goals
  const selectedGoals = watch('refinancingGoals') || []

  // Handle goal toggle
  const handleGoalToggle = (goal: string) => {
    const newGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter((g: string) => g !== goal)
      : [...selectedGoals, goal]

    setValue('refinancingGoals', newGoals)
    onFieldChange('refinancingGoals', newGoals, {
      section: 'refinance_objectives',
      action: 'updated'
    })
  }

  // Handle cash-out toggle
  const handleCashOutToggle = (checked: boolean) => {
    const newGoals = checked
      ? [...selectedGoals, 'cash_out']
      : selectedGoals.filter((g: string) => g !== 'cash_out')

    setValue('refinancingGoals', newGoals)
    onFieldChange('refinancingGoals', newGoals, {
      section: 'refinance_objectives',
      action: checked ? 'cash_out_selected' : 'cash_out_deselected'
    })
  }

  return (
    <div className="space-y-6">
      {/* Job Change Questions */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Employment Status</h3>

        {/* Primary Applicant Section */}
        <div className="p-4 border-l-4 border-l-[#FCD34D] bg-[#FFFBEB]/30 border border-[#E5E5E5]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#FCD34D] flex items-center justify-center text-black font-semibold text-sm">
              1
            </div>
            <h4 className="text-sm font-semibold text-black">Primary Applicant</h4>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
              Have you changed jobs since taking this loan?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setHasChangedJobPrimary(false)
                  onFieldChange('hasChangedJobPrimary', false)
                }}
                className={`flex-1 px-4 py-3 border text-sm font-medium transition-colors ${
                  hasChangedJobPrimary === false
                    ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                    : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasChangedJobPrimary(true)
                  onFieldChange('hasChangedJobPrimary', true)
                }}
                className={`flex-1 px-4 py-3 border text-sm font-medium transition-colors ${
                  hasChangedJobPrimary === true
                    ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                    : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
                }`}
              >
                Yes
              </button>
            </div>

            {/* Progressive disclosure: Employment status if job changed */}
            {hasChangedJobPrimary === true && (
              <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                <Controller
                  name="employmentStatusPrimary"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                        Current Employment Status *
                      </label>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value)
                          onFieldChange('employmentStatusPrimary', value)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self-employed">Self-employed</SelectItem>
                          <SelectItem value="in-between-jobs">In-between jobs</SelectItem>
                          <SelectItem value="not-working">Not working</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.employmentStatusPrimary && (
                        <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.employmentStatusPrimary)}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Co-Applicant Section (if joint application) */}
        {showJointApplicant && (
          <div className="p-4 border-l-4 border-l-[#10B981] bg-[#F0FDF4]/30 border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white font-semibold text-sm">
                2
              </div>
              <h4 className="text-sm font-semibold text-black">Co-Applicant</h4>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                Has co-applicant changed jobs since taking this loan?
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasChangedJobCoApplicant(false)
                    onFieldChange('hasChangedJobCoApplicant', false)
                  }}
                  className={`flex-1 px-4 py-3 border text-sm font-medium transition-colors ${
                    hasChangedJobCoApplicant === false
                      ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                      : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasChangedJobCoApplicant(true)
                    onFieldChange('hasChangedJobCoApplicant', true)
                  }}
                  className={`flex-1 px-4 py-3 border text-sm font-medium transition-colors ${
                    hasChangedJobCoApplicant === true
                      ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                      : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
                  }`}
                >
                  Yes
                </button>
              </div>

              {/* Progressive disclosure: Co-applicant employment status */}
              {hasChangedJobCoApplicant === true && (
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <Controller
                    name="employmentStatusCoApplicant"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                          Co-Applicant Current Employment Status *
                        </label>
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => {
                            field.onChange(value)
                            onFieldChange('employmentStatusCoApplicant', value)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self-employed">Self-employed</SelectItem>
                            <SelectItem value="in-between-jobs">In-between jobs</SelectItem>
                            <SelectItem value="not-working">Not working</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.employmentStatusCoApplicant && (
                          <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.employmentStatusCoApplicant)}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lock-in Period Progressive Disclosure */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Lock-in Period</h3>

        <div className="space-y-4 p-4 border border-[#E5E5E5] bg-white">
          <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
            Time remaining in lock-in period
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setLockInTimeframe('within-3-months')
                onFieldChange('lockInTimeframe', 'within-3-months')
              }}
              className={`px-4 py-3 border text-sm font-medium transition-colors ${
                lockInTimeframe === 'within-3-months'
                  ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                  : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
              }`}
            >
              Within 3 months
            </button>
            <button
              type="button"
              onClick={() => {
                setLockInTimeframe('3-6-months')
                setValue('lockInSpecificMonth', undefined)  // Clear specific month
                onFieldChange('lockInTimeframe', '3-6-months')
              }}
              className={`px-4 py-3 border text-sm font-medium transition-colors ${
                lockInTimeframe === '3-6-months'
                  ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                  : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
              }`}
            >
              3-6 months
            </button>
            <button
              type="button"
              onClick={() => {
                setLockInTimeframe('more-than-6-months')
                setValue('lockInSpecificMonth', undefined)  // Clear specific month
                onFieldChange('lockInTimeframe', 'more-than-6-months')
              }}
              className={`px-4 py-3 border text-sm font-medium transition-colors ${
                lockInTimeframe === 'more-than-6-months'
                  ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                  : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
              }`}
            >
              More than 6 months
            </button>
            <button
              type="button"
              onClick={() => {
                setLockInTimeframe('out-of-lock-in')
                setValue('lockInSpecificMonth', undefined)  // Clear specific month
                onFieldChange('lockInTimeframe', 'out-of-lock-in')
              }}
              className={`px-4 py-3 border text-sm font-medium transition-colors ${
                lockInTimeframe === 'out-of-lock-in'
                  ? 'border-[#FCD34D] bg-[#FFFBEB] text-black'
                  : 'border-[#E5E5E5] bg-white text-[#666666] hover:bg-[#F8F8F8]'
              }`}
            >
              Out of lock-in
            </button>
          </div>

          {/* Progressive disclosure: Specific month if within 3 months */}
          {lockInTimeframe === 'within-3-months' && (
            <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
              <Controller
                name="lockInSpecificMonth"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                      Specific Month *
                    </label>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => {
                        const numValue = parseInt(value)
                        field.onChange(numValue)
                        onFieldChange('lockInSpecificMonth', numValue)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 month</SelectItem>
                        <SelectItem value="2">2 months</SelectItem>
                        <SelectItem value="3">3 months</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.lockInSpecificMonth && (
                      <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.lockInSpecificMonth)}</p>
                    )}
                  </div>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Refinance Objectives Panel */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Refinance Objectives</h3>

        <div className="space-y-4 p-4 border border-[#E5E5E5] bg-white">
          <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
            What are you trying to achieve?
          </p>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 px-4 py-2 text-sm border border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8] transition-colors">
              <input
                type="checkbox"
                checked={selectedGoals.includes('lower_monthly_payment')}
                onChange={() => handleGoalToggle('lower_monthly_payment')}
                className="w-4 h-4 text-[#FCD34D] border-[#E5E5E5] rounded focus:ring-[#FCD34D]"
                aria-label="Reduce monthly payments"
              />
              <span className="font-mono text-[#666666]">Reduce monthly payments</span>
            </label>

            <label className="flex items-center space-x-3 px-4 py-2 text-sm border border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8] transition-colors">
              <input
                type="checkbox"
                checked={selectedGoals.includes('shorten_tenure')}
                onChange={() => handleGoalToggle('shorten_tenure')}
                className="w-4 h-4 text-[#FCD34D] border-[#E5E5E5] rounded focus:ring-[#FCD34D]"
                aria-label="Shorten my loan tenure"
              />
              <span className="font-mono text-[#666666]">Shorten my loan tenure</span>
            </label>

            <label className="flex items-center space-x-3 px-4 py-2 text-sm border border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8] transition-colors">
              <input
                type="checkbox"
                checked={selectedGoals.includes('rate_certainty')}
                onChange={() => handleGoalToggle('rate_certainty')}
                className="w-4 h-4 text-[#FCD34D] border-[#E5E5E5] rounded focus:ring-[#FCD34D]"
                aria-label="Lock in rate certainty"
              />
              <span className="font-mono text-[#666666]">Lock in rate certainty</span>
            </label>

            <label className="flex items-center space-x-3 px-4 py-2 text-sm border border-[#E5E5E5] cursor-pointer hover:bg-[#F8F8F8] transition-colors">
              <input
                type="checkbox"
                checked={selectedGoals.includes('cash_out')}
                onChange={(e) => handleCashOutToggle(e.target.checked)}
                className="w-4 h-4 text-[#FCD34D] border-[#E5E5E5] rounded focus:ring-[#FCD34D]"
                aria-label="Also cash out equity"
              />
              <span className="font-mono text-[#666666]">Also cash out equity</span>
            </label>
          </div>
        </div>
      </div>

      {/* Cash-out Fields - Only for Private Property */}
      {propertyTypeValue && propertyTypeValue !== 'HDB' && selectedGoals.includes('cash_out') && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-black">Cash-Out Details (Private Property Only)</h3>

          <div className="space-y-4 p-4 border border-[#E5E5E5] bg-white">
            <div className="grid grid-cols-1 gap-4">
              <Controller
                name="cashOutAmount"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="cash-out-amount" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                      Cash-Out Amount *
                    </label>
                    <Input
                      id="cash-out-amount"
                      type="text"
                      className="font-mono"
                      placeholder="50,000"
                      name={field.name}
                      ref={field.ref}
                      value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const parsedValue = parseFormattedNumber(e.target.value) || 0
                        field.onChange(parsedValue)
                        onFieldChange('cashOutAmount', parsedValue, {
                          section: 'cash_out',
                          action: 'amount_entered'
                        })
                      }}
                    />
                    <p className="text-xs text-[#666666] mt-1">
                      Amount you wish to cash out from property equity
                    </p>
                    {errors.cashOutAmount && (
                      <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.cashOutAmount)}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="cashOutReason"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="cash-out-reason" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                      Reason for Cash-Out (Optional)
                    </label>
                    <Input
                      id="cash-out-reason"
                      type="text"
                      placeholder="e.g., Home renovation, business capital, debt consolidation"
                      name={field.name}
                      ref={field.ref}
                      value={field.value || ''}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        onFieldChange('cashOutReason', e.target.value, {
                          section: 'cash_out',
                          action: 'reason_entered'
                        })
                      }}
                    />
                    <p className="text-xs text-[#666666] mt-1">
                      Helps us provide more relevant advice
                    </p>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
