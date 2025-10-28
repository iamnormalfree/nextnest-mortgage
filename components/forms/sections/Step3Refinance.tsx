// ABOUTME: Step 3 Refinance section with income panel, objectives, current loan snapshot, and advisory preview

'use client'

import { useMemo, useState, useEffect } from 'react'
import { Controller, Control, UseFormSetValue, UseFormWatch, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import { calculateComplianceSnapshot, calculateRefinanceOutlook } from '@/lib/calculations/instant-profile'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
import { EmploymentPanel } from './EmploymentPanel'
import { CoApplicantPanel } from './CoApplicantPanel'
import { EditableSection } from './EditableSection'

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
  // State management for EditableSection expansion tracking
  const [isPrimaryEmploymentExpanded, setIsPrimaryEmploymentExpanded] = useState(true)
  const [isCoApplicantEmploymentExpanded, setIsCoApplicantEmploymentExpanded] = useState(false)
  const [hasShownCoApplicantSection, setHasShownCoApplicantSection] = useState(false)

  // First-time visibility tracking to prevent premature auto-collapse (Problem 3)
  useEffect(() => {
    if (showJointApplicant && !hasShownCoApplicantSection) {
      setIsCoApplicantEmploymentExpanded(false)  // Start collapsed
      setHasShownCoApplicantSection(true)         // Mark as shown
    }
  }, [showJointApplicant, hasShownCoApplicantSection])

  // "One section open at a time" handlers (Problem 4)
  const handleEditPrimary = () => {
    setIsCoApplicantEmploymentExpanded(false)  // Collapse co-applicant
    setIsPrimaryEmploymentExpanded(prev => !prev)  // Toggle primary
  }

  const handleEditCoApplicant = () => {
    setIsPrimaryEmploymentExpanded(false)  // Collapse primary
    setIsCoApplicantEmploymentExpanded(prev => !prev)  // Toggle co-applicant
  }

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

  // Watch fields for completion detection
  const employmentType_1 = useWatch({ control, name: 'employmentType_1' })
  const coApplicantIncome = useWatch({ control, name: 'actualIncomes.1' })
  const coApplicantAge = useWatch({ control, name: 'actualAges.1' })

  // Primary employment completion detection
  const isPrimaryEmploymentComplete = useMemo(() => {
    // Check if employment type is selected
    const hasEmploymentType = Boolean(employmentType)

    // Check if no validation errors for primary employment fields
    const primaryFields = ['employmentType', 'actualIncomes.0', 'actualAges.0']
    const hasErrors = primaryFields.some(field => errors[field])

    return hasEmploymentType && !hasErrors
  }, [employmentType, errors])

  // Co-applicant employment completion detection
  const isCoApplicantEmploymentComplete = useMemo(() => {
    if (!showJointApplicant) return true  // N/A if no co-applicant

    const hasEmploymentType = Boolean(employmentType_1)

    // Check income field (if applicable for employment type)
    const needsIncome = employmentType_1 === 'employed' || employmentType_1 === 'in-between-jobs'
    const hasIncome = needsIncome ? Boolean(coApplicantIncome) : true

    // Check age field (always required when employment type selected)
    const hasAge = Boolean(coApplicantAge)

    // Check for validation errors
    const coApplicantFields = ['employmentType_1', 'actualIncomes.1', 'actualAges.1']
    const hasErrors = coApplicantFields.some(field => errors[field])

    return hasEmploymentType && hasIncome && hasAge && !hasErrors
  }, [showJointApplicant, employmentType_1, coApplicantIncome, coApplicantAge, errors])

  // Summary text generators
  const getPrimaryEmploymentSummary = () => {
    if (!employmentType) return 'Click Complete to provide employment details'

    const labels: Record<string, string> = {
      'employed': 'Employed',
      'self-employed': 'Self-employed',
      'not-working': 'Not working',
      'in-between-jobs': 'In-between jobs'
    }

    return labels[employmentType] || 'Employment details provided'
  }

  const getCoApplicantEmploymentSummary = () => {
    if (!employmentType_1) return 'Click Complete to provide employment details'

    const labels: Record<string, string> = {
      'employed': 'Employed',
      'self-employed': 'Self-employed',
      'not-working': 'Not working',
      'in-between-jobs': 'In-between jobs'
    }

    return labels[employmentType_1] || 'Employment details provided'
  }

  const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) return parsed
    }
    return fallback
  }

  const propertyValueNumeric = toNumber(propertyValue ?? fieldValues?.propertyValue)
  const outstandingLoanNumeric = toNumber(outstandingLoan ?? fieldValues?.outstandingLoan)
  const currentRateNumeric = toNumber(currentRateForm ?? fieldValues?.currentRate)
  const monthsRemainingNumeric = toNumber(monthsRemainingForm ?? fieldValues?.monthsRemaining)
  const ownerOccupiedValue = typeof ownerOccupiedForm === 'boolean'
    ? ownerOccupiedForm
    : (typeof fieldValues?.ownerOccupied === 'boolean' ? fieldValues?.ownerOccupied : true)
  const propertyTypeValue = (propertyTypeForm as string) || fieldValues?.propertyType || 'Private'
  const refinancingGoalsValue: string[] = Array.isArray(refinancingGoalsForm) && refinancingGoalsForm.length > 0
    ? refinancingGoalsForm as string[]
    : Array.isArray(fieldValues?.refinancingGoals)
      ? fieldValues?.refinancingGoals
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

  const handleGoalToggle = (goal: 'lower_monthly_payment' | 'shorten_tenure' | 'rate_certainty') => {
    const isCurrentlySelected = selectedGoals.includes(goal)
    const preservedCashOut = selectedGoals.includes('cash_out')

    let nextGoals: string[]
    if (isCurrentlySelected) {
      // Deselect: remove this goal but keep others
      nextGoals = selectedGoals.filter(g => g !== goal)
      // Ensure at least one non-cash-out goal remains, default to lower_monthly_payment
      const hasOtherGoals = nextGoals.some(g => g !== 'cash_out')
      if (!hasOtherGoals && preservedCashOut) {
        nextGoals = ['lower_monthly_payment', 'cash_out']
      } else if (nextGoals.length === 0) {
        nextGoals = ['lower_monthly_payment']
      }
    } else {
      // Select: add this goal to existing ones
      const baseGoals = selectedGoals.filter(g => g !== 'cash_out')
      nextGoals = [...baseGoals, goal]
      if (preservedCashOut) {
        nextGoals.push('cash_out')
      }
    }

    setValue('refinancingGoals' as any, nextGoals, { shouldDirty: true })
    onFieldChange('refinancingGoals', nextGoals, {
      section: 'refinance_objectives',
      action: isCurrentlySelected ? 'goal_deselected' : 'goal_selected',
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
                  type="text"
                  inputMode="numeric"
                  className="font-mono"
                  placeholder="8,000"
                  value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                  onChange={(e) => {
                    const parsedValue = parseFormattedNumber(e.target.value) || 0
                    field.onChange(parsedValue)
                    onFieldChange('actualIncomes.0', parsedValue, {
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
                  id="age-primary"
                  type="number"
                  min="18"
                  max="99"
                  step="1"
                  placeholder="35"
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value)
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

          <EditableSection
            title="Primary Applicant Employment"
            isExpanded={isPrimaryEmploymentExpanded}
            isComplete={isPrimaryEmploymentComplete}
            onEdit={handleEditPrimary}
            summaryText={getPrimaryEmploymentSummary()}
          >
            <EmploymentPanel
              applicantNumber={0}
              control={control}
              errors={errors}
              onFieldChange={onFieldChange}
            />
          </EditableSection>
        </div>

        {showJointApplicant && (
          <EditableSection
            title="Co-Applicant Employment"
            isExpanded={isCoApplicantEmploymentExpanded}
            isComplete={isCoApplicantEmploymentComplete}
            onEdit={handleEditCoApplicant}
            summaryText={getCoApplicantEmploymentSummary()}
          >
            <CoApplicantPanel
              control={control}
              errors={errors}
              onFieldChange={onFieldChange}
              loanType="refinance"
            />
          </EditableSection>
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
                ${fieldValues?.propertyValue?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Outstanding Loan:</span>
              <span className="font-mono font-semibold text-black">
                ${fieldValues?.outstandingLoan?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Current Rate:</span>
              <span className="font-mono font-semibold text-black">
                {fieldValues?.currentRate ? `${fieldValues?.currentRate}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Bank:</span>
              <span className="font-semibold text-black">
                {fieldValues?.currentBank || 'N/A'}
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
                      id="cash-out-amount"
                      type="number"
                      min="0"
                      className="font-mono"
                      placeholder="50000"
                      name={field.name}
                      ref={field.ref}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseInt(e.target.value)
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
                  id="months-remaining"
                  type="number"
                  min="0"
                  className="font-mono"
                  placeholder="12"
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value)
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
