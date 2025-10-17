// ABOUTME: Step 3 Refinance section with income panel, objectives, current loan snapshot, and advisory preview

'use client'

import { useMemo } from 'react'
import { Controller, Control, UseFormSetValue, UseFormWatch, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import { calculateComplianceSnapshot, calculateRefinanceOutlook } from '@/lib/calculations/instant-profile'

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
  // Watch relevant fields for MAS readiness calculation
  const watchedFields = useWatch({
    control,
    name: [
      'actualIncomes.0',
      'actualAges.0',
      'employmentType',
      'creditCardCount',
      'existingCommitments',
      'propertyValue',
      'outstandingLoan',
      'ownerOccupied',
      'currentRate',
      'monthsRemaining',
      'refinancingGoals',
      'propertyType'
    ]
  })

  const [
    monthlyIncome,
    age,
    employmentType,
    creditCardCount,
    existingCommitments,
    propertyValue,
    outstandingLoan,
    ownerOccupiedForm,
    currentRateForm,
    monthsRemainingForm,
    refinancingGoalsForm,
    propertyTypeForm
  ] = watchedFields

  const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) return parsed
    }
    return fallback
  }

  const propertyValueNumeric = toNumber(propertyValue ?? fieldValues.propertyValue)
  const outstandingLoanNumeric = toNumber(outstandingLoan ?? fieldValues.outstandingLoan)
  const currentRateNumeric = toNumber(currentRateForm ?? fieldValues.currentRate)
  const monthsRemainingNumeric = toNumber(monthsRemainingForm ?? fieldValues.monthsRemaining)
  const ownerOccupiedValue = typeof ownerOccupiedForm === 'boolean'
    ? ownerOccupiedForm
    : (typeof fieldValues.ownerOccupied === 'boolean' ? fieldValues.ownerOccupied : true)
  const propertyTypeValue = (propertyTypeForm as string) || fieldValues.propertyType || 'Private'
  const refinancingGoalsValue: string[] = Array.isArray(refinancingGoalsForm) && refinancingGoalsForm.length > 0
    ? refinancingGoalsForm as string[]
    : Array.isArray(fieldValues.refinancingGoals)
      ? fieldValues.refinancingGoals
      : []

  // Calculate MAS readiness metrics using real compliance calculators
  const calculateMASReadiness = () => {
    // Only require income and age - commitments default to 0
    if (!monthlyIncome || !age) {
      return {
        isReady: false,
        tdsr: 0,
        tdsrLimit: 55,
        msr: 0,
        msrLimit: 30,
        reasons: ['Complete income and age to check eligibility']
      }
    }

    // Get property type from form context
    const propertyType = watch('propertyType') || 'Private'

    // Calculate total existing commitments (defaults to 0 if not entered)
    const totalExistingCommitments = (existingCommitments || 0) + (creditCardCount || 0) * 50

    // Calculate monthly mortgage payment for the REFINANCED loan
    // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    // Using MAS stress test rate (4% for residential properties)
    const stressTestRate = 4.0 // MAS stress test rate
    const monthlyRate = stressTestRate / 100 / 12
    const tenureYears = 25 // Standard assumption for refinance
    const numberOfPayments = tenureYears * 12

    let monthlyMortgagePayment = 0
    if (outstandingLoanNumeric > 0 && monthlyRate > 0) {
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)
      const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1
      monthlyMortgagePayment = Math.ceil(outstandingLoanNumeric * (numerator / denominator))
    }

    // Calculate TDSR: (New Mortgage Payment + Existing Commitments) / Income × 100%
    // TDSR limit is 55% of income (MAS regulation)
    const tdsrRatio = monthlyIncome > 0
      ? ((monthlyMortgagePayment + totalExistingCommitments) / monthlyIncome) * 100
      : 0
    const tdsrLimitPercent = 55

    // Calculate MSR: (New Mortgage Payment ONLY) / Income × 100%
    // MSR limit is 30% of income (applies to HDB/EC properties only)
    // Note: MSR does NOT include existing debts, only the new mortgage payment
    const msrLimitPercent = 30
    const isHDBOrEC = propertyType === 'HDB' || propertyType === 'EC'
    const msrRatio = isHDBOrEC && monthlyIncome > 0
      ? (monthlyMortgagePayment / monthlyIncome) * 100
      : 0

    // Check compliance
    const isTDSRCompliant = tdsrRatio <= tdsrLimitPercent
    const isMSRCompliant = !isHDBOrEC || (msrRatio <= msrLimitPercent)
    const isReady = isTDSRCompliant && isMSRCompliant && age < 65

    const reasons = []
    if (!isTDSRCompliant) {
      reasons.push(`TDSR ${tdsrRatio.toFixed(1)}% exceeds ${tdsrLimitPercent}% limit`)
    }
    if (!isMSRCompliant) {
      reasons.push(`MSR ${msrRatio.toFixed(1)}% exceeds ${msrLimitPercent}% limit`)
    }

    if (age >= 65) reasons.push(`Age ${age} exceeds standard lending limits`)

    if (isReady && reasons.length === 0) {
      reasons.push('Eligible for mortgage refinancing')
    }

    return {
      isReady,
      tdsr: tdsrRatio,
      tdsrLimit: tdsrLimitPercent,
      msr: msrRatio,
      msrLimit: msrLimitPercent,
      reasons
    }
  }

  const masReadiness = calculateMASReadiness()

  const selectedGoals = refinancingGoalsValue
  const primaryGoal = selectedGoals.find((goal) => goal !== 'cash_out')
    ?? (selectedGoals.includes('cash_out') ? 'cash_out' : 'lower_monthly_payment')

  const mapGoalToObjective = (goal: string) => {
    switch (goal) {
      case 'shorten_tenure':
        return 'shorten_tenure' as const
      case 'rate_certainty':
        return 'rate_certainty' as const
      case 'cash_out':
        return 'cash_out' as const
      default:
        return 'lower_payment' as const
    }
  }

  const primaryObjective = mapGoalToObjective(primaryGoal)

  const shouldCalculateOutlook = propertyValueNumeric > 0 && outstandingLoanNumeric > 0

  const refinanceOutlook = useMemo(() => {
    if (!shouldCalculateOutlook) {
      return null
    }

    return calculateRefinanceOutlook({
      property_value: propertyValueNumeric,
      current_balance: outstandingLoanNumeric,
      current_rate: currentRateNumeric,
      months_remaining: monthsRemainingNumeric,
      property_type: propertyTypeValue as any,
      is_owner_occupied: ownerOccupiedValue,
      objective: primaryObjective,
      outstanding_loan: outstandingLoanNumeric
    })
  }, [
    propertyValueNumeric,
    outstandingLoanNumeric,
    currentRateNumeric,
    monthsRemainingNumeric,
    propertyTypeValue,
    ownerOccupiedValue,
    primaryObjective,
    shouldCalculateOutlook
  ])

  const outlookSummary = refinanceOutlook ?? {
    projectedMonthlySavings: undefined,
    maxCashOut: 0,
    timingGuidance: 'Provide current loan details to generate refinance insights.',
    recommendations: [] as string[],
    reasonCodes: [] as string[],
    policyRefs: [] as string[],
    ltvCapApplied: 0,
    cpfRedemptionAmount: 0
  }

  const handlePrimaryGoalSelect = (goal: 'lower_monthly_payment' | 'shorten_tenure' | 'rate_certainty') => {
    const preservedCashOut = selectedGoals.includes('cash_out')
    const nextGoals = preservedCashOut ? [goal, 'cash_out'] : [goal]
    setValue('refinancingGoals' as any, nextGoals, { shouldDirty: true })
    onFieldChange('refinancingGoals', nextGoals, {
      section: 'refinance_objectives',
      action: 'goal_selected',
      metadata: {
        goal,
        previousGoals: selectedGoals
      }
    })
  }

  const handleCashOutToggle = (enabled: boolean) => {
    const baseGoals = selectedGoals.filter((goal) => goal !== 'cash_out')
    const normalizedBase = baseGoals.length > 0 ? baseGoals : ['lower_monthly_payment']
    const nextGoals = enabled ? [...normalizedBase, 'cash_out'] : normalizedBase
    setValue('refinancingGoals' as any, nextGoals, { shouldDirty: true })
    onFieldChange('refinancingGoals', nextGoals, {
      section: 'refinance_objectives',
      action: enabled ? 'cash_out_enabled' : 'cash_out_disabled',
      metadata: {
        goal: 'cash_out',
        enabled,
        previousGoals: selectedGoals
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Income Panel - Shared with New Purchase but简化版 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Income Details</h3>
        
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
                <label htmlFor="monthly-income-primary" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                  Monthly Income *
                </label>
                <Input
                  {...field}
                  id="monthly-income-primary"
                  type="number"
                  className="font-mono"
                  placeholder="8000"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    field.onChange(value)
                    onFieldChange('actualIncomes.0', value, {
                      section: 'refinance_income',
                      action: 'updated'
                    })
                  }}
                />
                {errors['actualIncomes.0'] && (
                  <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors['actualIncomes.0'])}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="actualAges.0"
            control={control}
            render={({ field }) => (
              <div>
                <label htmlFor="age-primary" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                  Your Age *
                </label>
                <Input
                  {...field}
                  id="age-primary"
                  type="number"
                  placeholder="35"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    field.onChange(value)
                    onFieldChange('actualAges.0', value, {
                      section: 'refinance_demographics',
                      action: 'updated'
                    })
                  }}
                />
                {errors['actualAges.0'] && (
                  <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors['actualAges.0'])}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="employmentType"
            control={control}
            render={({ field }) => (
              <div>
                <label htmlFor="employment-type-select" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                  Employment Type *
                </label>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    onFieldChange('employmentType', value, {
                      section: 'refinance_demographics',
                      action: 'updated'
                    })
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
        </div>

        {/* Joint Applicant Fields - Only render once */}
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
                  <label htmlFor="monthly-income-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Monthly Income
                  </label>
                  <Input
                    {...field}
                    id="monthly-income-joint"
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
          </div>
        )}
      </div>

      {/* Current Loan Snapshot */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Current Loan Information</h3>
        
        <div className="space-y-4 p-4 border border-[#E5E5E5]">
          <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
            Property & Loan Details
          </p>
          
          <div className="text-xs text-[#666666] space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Property Value:</span>
              <span className="font-mono font-semibold text-black">
                ${fieldValues.propertyValue?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Outstanding Loan:</span>
              <span className="font-mono font-semibold text-black">
                ${fieldValues.outstandingLoan?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Current Rate:</span>
              <span className="font-mono font-semibold text-black">
                {fieldValues.currentRate ? `${fieldValues.currentRate}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Bank:</span>
              <span className="font-semibold text-black">
                {fieldValues.currentBank || 'N/A'}
              </span>
            </div>
          </div>

          {/* Owner-Occupied Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F8F8F8] border border-[#E5E5E5]">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-black">
                Owner-Occupied?
              </label>
              <p className="text-xs text-[#666666]">
                Affects MSR calculations
              </p>
            </div>
            <Controller
              name="ownerOccupied"
              control={control}
              render={({ field }) => (
                <div>
                  <button
                    type="button"
                    role="switch"
                    aria-label="owner-occupied"
                    aria-checked={field.value}
                    onClick={() => {
                      const newValue = !field.value
                      field.onChange(newValue)
                      onFieldChange('ownerOccupied', newValue, {
                        section: 'refinance_property_details',
                        action: newValue ? 'enabled' : 'disabled'
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
        </div>
      </div>

      {/* Refinance Objectives Panel */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Refinance Objectives</h3>
        
        <div className="space-y-4 p-4 border border-[#E5E5E5]">
          <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2">
            What are you trying to achieve?
          </p>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handlePrimaryGoalSelect('lower_monthly_payment')}
              className={`w-full px-4 py-2 text-sm font-mono transition-colors text-left ${selectedGoals.includes('lower_monthly_payment') ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'}`}
            >
              Reduce monthly payments
            </button>

            <button
              type="button"
              onClick={() => handlePrimaryGoalSelect('shorten_tenure')}
              className={`w-full px-4 py-2 text-sm font-mono transition-colors text-left ${selectedGoals.includes('shorten_tenure') ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'}`}
            >
              Shorten my loan tenure
            </button>

            <button
              type="button"
              onClick={() => handlePrimaryGoalSelect('rate_certainty')}
              className={`w-full px-4 py-2 text-sm font-mono transition-colors text-left ${selectedGoals.includes('rate_certainty') ? 'bg-[#FCD34D] text-black border border-[#FCD34D]' : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'}`}
            >
              Lock in rate certainty
            </button>
          </div>

          {/* Cash-out Checkbox */}
          <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedGoals.includes('cash_out')}
                onChange={(e) => handleCashOutToggle(e.target.checked)}
                className="w-4 h-4 text-[#FCD34D] border-[#E5E5E5] rounded focus:ring-[#FCD34D]"
              />
              <span className="text-[#666666]">Also cash out equity</span>
            </label>
          </div>
        </div>
      </div>

      {/* Cash-out Fields - Only for Private Property */}
      {propertyTypeValue && propertyTypeValue !== 'HDB' && selectedGoals.includes('cash_out') && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-black">Cash-Out Details (Private Property Only)</h3>
          
          <div className="space-y-4 p-4 border border-[#E5E5E5]">
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
                      {...field}
                      id="cash-out-amount"
                      type="number"
                      className="font-mono"
                      placeholder="50000"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        field.onChange(value)
                        onFieldChange('cashOutAmount', value, {
                          section: 'refinance_cash_out',
                          action: 'updated'
                        })
                      }}
                    />
                    <p className="text-xs text-[#666666] mt-1">
                      Amount you want to cash out from your property
                    </p>
                    <p className="text-xs text-[#666666] mt-1">
                      Maximum is 70% of cash-out value
                    </p>
                  </div>
                )}
              />
              
              <Controller
                name="cashOutReason"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="cash-out-reason" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                      Cash-Out Reason *
                    </label>
                    <Input
                      {...field}
                      id="cash-out-reason"
                      type="text"
                      placeholder="Example: Home renovation"
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        onFieldChange('cashOutReason', e.target.value, {
                          section: 'refinance_cash_out',
                          action: 'updated'
                        })
                      }}
                    />
                    <p className="text-xs text-[#666666] mt-1">
                      Why you&apos;re cashing out
                    </p>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timing Guidance */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Timing Analysis</h3>
        
        <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
          <Controller
            name="monthsRemaining"
            control={control}
            render={({ field }) => (
              <div>
                <label htmlFor="months-remaining" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                  Months Remaining in Lock-in Period
                </label>
                <Input
                  {...field}
                  id="months-remaining"
                  type="number"
                  className="font-mono"
                  placeholder="12"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    field.onChange(value)
                    onFieldChange('monthsRemaining', value, {
                      section: 'refinance_timing',
                      action: 'updated'
                    })
                  }}
                />
                <p className="text-xs text-[#666666] mt-1">
                  Helps determine optimal timing for refinancing
                </p>
              </div>
            )}
          />
          
          {/* Advisory Preview */}
          <div className="mt-4 p-3 border border-[#E5E5E5] bg-white">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#FCD34D]" role="img" aria-label="Timing guidance icon" />
              <span className="text-sm font-semibold text-black">Timing Guidance</span>
            </div>
            <p className="text-xs text-[#666666]">
              {outlookSummary.timingGuidance}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Refinance Outlook</h3>

        <div className="p-4 border border-[#E5E5E5] bg-white space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">Projected savings</p>
              <p className="text-sm font-mono text-black">
                {outlookSummary.projectedMonthlySavings != null
                  ? `$${outlookSummary.projectedMonthlySavings.toLocaleString()}/mo`
                  : '—'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">Available cash-out</p>
              <p className="text-sm font-mono text-black">
                {outlookSummary.maxCashOut ? `$${outlookSummary.maxCashOut.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">Timing guidance</p>
            <p className="text-xs text-[#666666]">{outlookSummary.timingGuidance}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">Reason codes</p>
            <div className="flex flex-wrap gap-2">
              {outlookSummary.reasonCodes.length > 0 ? (
                outlookSummary.reasonCodes.map((code) => (
                  <span key={code} className="text-[11px] uppercase tracking-wide bg-[#F8F8F8] border border-[#E5E5E5] px-2 py-1 text-[#666666]">
                    {code}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#666666]">No reason codes yet</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-1">Policy references</p>
            <div className="flex flex-wrap gap-2">
              {outlookSummary.policyRefs.length > 0 ? (
                outlookSummary.policyRefs.map((ref) => (
                  <span key={ref} className="text-[11px] bg-[#F8F8F8] border border-[#E5E5E5] px-2 py-1 text-[#666666]">
                    {ref}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#666666]">No policy references recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAS Readiness Card */}
      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-black">MAS Readiness Check</h3>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            masReadiness.isReady ? 'bg-[#10B981]' : 'bg-[#EF4444]'
          }`}>
            {masReadiness.isReady ? (
              <span className="text-white text-xs">✓</span>
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" role="img" aria-label="MAS readiness indicator" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#666666]">TDSR</span>
            <span className={`text-sm font-mono ${
              masReadiness.tdsr <= masReadiness.tdsrLimit ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}>
              {masReadiness.tdsr.toFixed(1)}% / {masReadiness.tdsrLimit}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[#666666]">MSR</span>
            <span className={`text-sm font-mono ${
              masReadiness.msr <= masReadiness.msrLimit ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}>
              {masReadiness.msr.toFixed(1)}% / {masReadiness.msrLimit}%
            </span>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5]">
            <p className="text-xs text-[#666666] mb-2">Requirements:</p>
            <ul className="space-y-1">
              {masReadiness.reasons.map((reason, index) => (
                <li key={index} className={`text-xs flex items-start gap-2 ${
                  reason.includes('Eligible') || reason.includes('Ready') ? 'text-[#10B981]' : 'text-[#666666]'
                }`}>
                  <span className="mt-0.5">{reason.includes('Eligible') || reason.includes('Ready') ? '✓' : '•'}</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
