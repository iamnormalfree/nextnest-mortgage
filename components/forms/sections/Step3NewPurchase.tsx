// ABOUTME: Step 3 New Purchase section with income panel, liabilities toggles, and MAS readiness card

'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Control, Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { getEmploymentRecognitionRate } from '@/lib/calculations/instant-profile'
import type { InstantCalcResult } from '@/lib/contracts/form-contracts'
import type { MasReadinessResult } from '@/hooks/useMasReadiness'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'
import { EmploymentPanel } from './EmploymentPanel'
import { EMPLOYMENT_LABELS } from '@/lib/forms/employment-types'
import { CoApplicantPanel } from './CoApplicantPanel'

type LiabilityKey = 'propertyLoans' | 'carLoans' | 'creditCards' | 'personalLines'

interface LiabilityDetails {
  enabled: boolean
  outstandingBalance: number | ''
  monthlyPayment: number | ''
}

type LiabilityState = Record<LiabilityKey, LiabilityDetails> & {
  otherCommitments: string
}

interface Step3NewPurchaseProps {
  onFieldChange: (field: string, value: any, analytics?: any) => void
  showJointApplicant: boolean
  errors: any
  getErrorMessage: (error: any) => string
  control: Control<any>
  instantCalcResult?: InstantCalcResult | null
  masReadiness: MasReadinessResult
}

const LIABILITY_CONFIG: Array<{ key: LiabilityKey; label: string; balanceLabel: string; paymentLabel: string; analyticsKey: string }> = [
  {
    key: 'propertyLoans',
    label: 'Property loans',
    balanceLabel: 'Property loan outstanding balance',
    paymentLabel: 'Property loan monthly payment',
    analyticsKey: 'property_loans'
  },
  {
    key: 'carLoans',
    label: 'Car loans',
    balanceLabel: 'Car loan outstanding balance',
    paymentLabel: 'Car loan monthly payment',
    analyticsKey: 'car_loans'
  },
  {
    key: 'creditCards',
    label: 'Credit cards',
    balanceLabel: 'Credit card outstanding balance',
    paymentLabel: 'Credit card minimum payment',
    analyticsKey: 'credit_cards'
  },
  {
    key: 'personalLines',
    label: 'Personal lines',
    balanceLabel: 'Personal line outstanding balance',
    paymentLabel: 'Personal line monthly payment',
    analyticsKey: 'personal_lines'
  }
]

const ensureNumber = (value: unknown): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return 0
}

export function Step3NewPurchase({ onFieldChange, showJointApplicant, errors, getErrorMessage, control, instantCalcResult, masReadiness }: Step3NewPurchaseProps) {
  const [hasCommitmentsPrimary, setHasCommitmentsPrimary] = useState<boolean | null>(null)
  const [hasCommitmentsCoApplicant, setHasCommitmentsCoApplicant] = useState<boolean | null>(null)
  const [isPrimaryIncomeExpanded, setIsPrimaryIncomeExpanded] = useState(true)
  const [isCoApplicantIncomeExpanded, setIsCoApplicantIncomeExpanded] = useState(true)
  const [hasAutoCollapsedPrimary, setHasAutoCollapsedPrimary] = useState(false)
  const [hasAutoCollapsedCoApplicant, setHasAutoCollapsedCoApplicant] = useState(false)

  const primaryIncome = ensureNumber(useWatch({ control, name: 'actualIncomes.0' }))
  const variableIncome = ensureNumber(useWatch({ control, name: 'actualVariableIncomes.0' }))
  const age = ensureNumber(useWatch({ control, name: 'actualAges.0' }))
  
  // Track previous values to detect actual user input (not just pre-filled values)
  // Initialize with current values so first render doesn't trigger collapse
  const prevPrimaryIncomeRef = useRef<number>(primaryIncome)
  const prevAgeRef = useRef<number>(age)
  const employmentType = (useWatch({ control, name: 'employmentType' }) as string) || ''
  const employmentDetails = useWatch({ control, name: 'employmentDetails' }) as Record<string, any> | undefined
  const liabilitiesRaw = useWatch({ control, name: 'liabilities' }) as Partial<LiabilityState> | undefined
  const liabilities2Raw = useWatch({ control, name: 'liabilities_2' }) as Partial<LiabilityState> | undefined
  const propertyValue = ensureNumber(useWatch({ control, name: 'priceRange' }))
  const loanAmount = ensureNumber(instantCalcResult?.maxLoanAmount)
  const propertyType = (useWatch({ control, name: 'propertyType' }) as string) || 'Private'

  // Co-applicant fields
  const coApplicantIncome = ensureNumber(useWatch({ control, name: 'actualIncomes.1' }))
  const coApplicantAge = ensureNumber(useWatch({ control, name: 'actualAges.1' }))
  const employmentType_1 = (useWatch({ control, name: 'employmentType_1' }) as string) || ''
  const prevCoIncomeRef = useRef<number>(coApplicantIncome)
  const prevCoAgeRef = useRef<number>(coApplicantAge)

  const liabilities: LiabilityState = useMemo(() => {
    const base: LiabilityState = {
      propertyLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      carLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      creditCards: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      personalLines: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      otherCommitments: ''
    }

    if (!liabilitiesRaw) {
      return base
    }

    return {
      ...base,
      ...liabilitiesRaw,
      propertyLoans: { ...base.propertyLoans, ...liabilitiesRaw.propertyLoans },
      carLoans: { ...base.carLoans, ...liabilitiesRaw.carLoans },
      creditCards: { ...base.creditCards, ...liabilitiesRaw.creditCards },
      personalLines: { ...base.personalLines, ...liabilitiesRaw.personalLines },
      otherCommitments: liabilitiesRaw.otherCommitments ?? ''
    }
  }, [liabilitiesRaw])

  const liabilities2: LiabilityState = useMemo(() => {
    const base: LiabilityState = {
      propertyLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      carLoans: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      creditCards: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      personalLines: { enabled: false, outstandingBalance: '', monthlyPayment: '' },
      otherCommitments: ''
    }

    if (!liabilities2Raw) {
      return base
    }

    return {
      ...base,
      ...liabilities2Raw,
      propertyLoans: { ...base.propertyLoans, ...liabilities2Raw.propertyLoans },
      carLoans: { ...base.carLoans, ...liabilities2Raw.carLoans },
      creditCards: { ...base.creditCards, ...liabilities2Raw.creditCards },
      personalLines: { ...base.personalLines, ...liabilities2Raw.personalLines },
      otherCommitments: liabilities2Raw.otherCommitments ?? ''
    }
  }, [liabilities2Raw])

  const totalMonthlyCommitments = useMemo(() => {
    return LIABILITY_CONFIG.reduce((total, config) => {
      const details = liabilities[config.key]
      if (!details?.enabled) return total
      return total + ensureNumber(details.monthlyPayment)
    }, 0)
  }, [liabilities])

  // Clear all commitment fields when user selects "No" to having commitments
  useEffect(() => {
    if (hasCommitmentsPrimary === false) {
      LIABILITY_CONFIG.forEach((config) => {
        onFieldChange(`liabilities.${config.key}.enabled`, false)
        onFieldChange(`liabilities.${config.key}.outstandingBalance`, '')
        onFieldChange(`liabilities.${config.key}.monthlyPayment`, '')
      })
      onFieldChange('liabilities.otherCommitments', '')
    }
  }, [hasCommitmentsPrimary, onFieldChange])

  useEffect(() => {
    if (hasCommitmentsCoApplicant === false) {
      LIABILITY_CONFIG.forEach((config) => {
        onFieldChange(`liabilities_2.${config.key}.enabled`, false)
        onFieldChange(`liabilities_2.${config.key}.outstandingBalance`, '')
        onFieldChange(`liabilities_2.${config.key}.monthlyPayment`, '')
      })
      onFieldChange('liabilities_2.otherCommitments', '')
    }
  }, [hasCommitmentsCoApplicant, onFieldChange])

  useEffect(() => {
    if (hasCommitmentsCoApplicant === false) {
      LIABILITY_CONFIG.forEach((config) => {
        onFieldChange(`liabilities_2.${config.key}.enabled`, false)
        onFieldChange(`liabilities_2.${config.key}.outstandingBalance`, '')
        onFieldChange(`liabilities_2.${config.key}.monthlyPayment`, '')
      })
      onFieldChange('liabilities_2.otherCommitments', '')
    }
  }, [hasCommitmentsCoApplicant, onFieldChange])

  // DISABLED: Auto-collapse causes UX issues when user is still typing
  // Income panel now only collapses when:
  // 1. User clicks "Yes" to commitments (explicit action)
  // 2. User manually collapses it
  //
  // useEffect(() => {
  //   if (!employmentType || hasAutoCollapsedPrimary) return
  //   // ... auto-collapse logic removed
  // }, [employmentType, primaryIncome, age, employmentDetails, isPrimaryIncomeExpanded, hasAutoCollapsedPrimary])

  // DISABLED: Auto-collapse causes UX issues when user is still typing
  // Co-applicant income panel now only collapses when:
  // 1. User clicks "Yes" to co-applicant commitments (explicit action)
  // 2. User manually collapses it
  //
  // useEffect(() => {
  //   if (!showJointApplicant || hasAutoCollapsedCoApplicant) return
  //   // ... auto-collapse logic removed
  // }, [showJointApplicant, coApplicantIncome, coApplicantAge, isCoApplicantIncomeExpanded, hasAutoCollapsedCoApplicant])

  const recognitionRate = getEmploymentRecognitionRate(employmentType)

  const selfEmployedDeclared = employmentType === 'self-employed'
    ? ensureNumber(employmentDetails?.['self-employed']?.averageReportedIncome) || primaryIncome
    : primaryIncome

  const recognizedPrimaryIncome = (() => {
    if (employmentType === 'self-employed') {
      return ensureNumber(selfEmployedDeclared) * recognitionRate
    }
    return primaryIncome * recognitionRate
  })()

  // Variable income recognition: 70% for employed/in-between-jobs, 0% for not-working
  const variableRecognitionRate = employmentType === 'not-working' ? 0 : 0.7
  const recognizedVariableIncome = ensureNumber(variableIncome) * variableRecognitionRate

  const recognizedIncome = Math.max(recognizedPrimaryIncome + recognizedVariableIncome, 0)
  const effectiveIncome = recognizedIncome > 0 ? recognizedIncome : primaryIncome + variableIncome

  // Get display income for summary
  const getDisplayIncome = () => {
    if (employmentType === 'self-employed') {
      return ensureNumber(employmentDetails?.['self-employed']?.averageReportedIncome)
    }
    return primaryIncome
  }

  // MAS readiness now calculated in parent and passed as prop

  return (
    <div className="space-y-6">
      {/* PRIMARY APPLICANT SECTION HEADER */}
      <div className="py-4 px-6 bg-blue-50 border-l-4 border-l-blue-600 -mx-4 sm:mx-0">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">👤</span>
          <h2 className="text-lg font-bold text-blue-900 uppercase tracking-wide">Primary Applicant</h2>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Income Details</h3>

        {!isPrimaryIncomeExpanded ? (
          // COLLAPSED SUMMARY VIEW
          <div className="p-4 border border-[#E5E5E5] border-l-4 border-l-blue-500 bg-[#F8F8F8] flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">Income</p>
              <p className="text-xs text-[#666666]">
                {EMPLOYMENT_LABELS[employmentType as keyof typeof EMPLOYMENT_LABELS] || employmentType}
                {' • '}
                ${formatNumberWithCommas(getDisplayIncome())}/month
                {' • '}
                Age {age}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrimaryIncomeExpanded(true)}
              className="text-sm text-[#666666] hover:text-black transition-colors min-h-[44px] px-4 py-2"
            >
              Edit
            </button>
          </div>
        ) : (
          // EXPANDED VIEW
          <div className="space-y-4 p-4 border border-[#E5E5E5] border-l-4 border-l-blue-500">
            <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
              Income Details
            </p>


            {/* EMPLOYMENT TYPE FIRST - Drives progressive disclosure */}
            <EmploymentPanel
              applicantNumber={0}
              control={control}
              errors={errors}
              onFieldChange={onFieldChange}
            />

            {/* CONDITIONAL: Monthly income for employed/in-between-jobs only */}
            {employmentType && (employmentType === 'employed' || employmentType === 'in-between-jobs') && (
            <Controller
              name="actualIncomes.0"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="monthly-income-primary" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Monthly income *
                  </label>
                  <Input
                    {...field}
                    id="monthly-income-primary"
                    type="text"
                    inputMode="numeric"
                    className="font-mono"
                    placeholder="8,000"
                    value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                    onChange={(event) => {
                      const parsedValue = parseFormattedNumber(event.target.value) || 0
                      field.onChange(parsedValue)
                      onFieldChange('actualIncomes.0', parsedValue, {
                        section: 'income_panel',
                        action: 'updated_primary_income',
                        metadata: { newValue: parsedValue, timestamp: new Date() }
                      })
                    }}
                  />
                  {errors['actualIncomes.0'] && (
                    <p className="text-[#EF4444] text-xs mt-1">Monthly income is required</p>
                  )}
                </div>
              )}
            />

            )}

            {/* CONDITIONAL: Variable income for all except not-working */}
            {employmentType && employmentType !== 'not-working' && employmentType !== 'self-employed' && (
            <Controller
              name="actualVariableIncomes.0"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="variable-income" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Variable / bonus income (optional)
                  </label>
                  <Input
                    {...field}
                    id="variable-income"
                    type="text"
                    inputMode="numeric"
                    className="font-mono"
                    placeholder="1,500"
                    value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                    onChange={(event) => {
                      const parsedValue = parseFormattedNumber(event.target.value) || 0
                      field.onChange(parsedValue)
                      onFieldChange('actualVariableIncomes.0', parsedValue, {
                        section: 'income_panel',
                        action: 'updated_variable_income',
                        metadata: { newValue: parsedValue, timestamp: new Date() }
                      })
                    }}
                  />
                  <p className="text-xs text-[#666666] mt-1">
                    Averaged into MAS readiness for commission or bonus structures
                  </p>
                </div>
              )}
            />

            )}

            {/* AGE - Always required */}
            {employmentType && (
            <Controller
              name="actualAges.0"
              control={control}
              render={({ field }) => (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="age-primary" className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                      Your Age *
                    </label>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-[#999999] cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-[#000000] text-white text-xs rounded shadow-lg z-10">
                        This is just to quickly check for max loan based on estimations. Next step with income declaration will be more precise.
                        <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#000000]"></div>
                      </div>
                    </div>
                  </div>
                  <Input
                    {...field}
                    id="age-primary"
                    type="number"
                    min="18"
                    max="99"
                    step="1"
                    placeholder="35"
                    onChange={(event) => {
                      const value = ensureNumber(event.target.value)
                      field.onChange(event.target.value)
                      onFieldChange('actualAges.0', value, {
                        section: 'income_panel',
                        action: 'updated_primary_age',
                        metadata: { newValue: value, timestamp: new Date() }
                      })
                    }}
                  />
                  {errors['actualAges.0'] && (
                    <p className="text-[#EF4444] text-xs mt-1">Age is required</p>
                  )}
                </div>
              )}
            />


            )}


          </div>
        )}

        {/* APPLICANT 1 FINANCIAL COMMITMENTS - Only show after employment, income, and age filled */}
        {employmentType && primaryIncome > 0 && age > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-black">Financial Commitments</h3>
            <div className="space-y-6 p-4 border border-[#E5E5E5] border-l-4 border-l-blue-500">
              {/* Single gate question */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#000000] text-sm">
                    Do you have any existing loans or commitments?
                  </h4>
                  <p className="text-xs text-[#666666] mt-1">
                    Property loans, car loans, credit cards, etc.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHasCommitmentsPrimary(false)}
                    className={`px-6 py-2 border text-sm font-semibold ${
                      hasCommitmentsPrimary === false
                        ? 'bg-[#000000] text-white border-[#000000]'
                        : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#000000]'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCommitmentsPrimary(true)}
                    className={`px-6 py-2 border text-sm font-semibold ${
                      hasCommitmentsPrimary === true
                        ? 'bg-[#000000] text-white border-[#000000]'
                        : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#000000]'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Only show if Yes */}
              {hasCommitmentsPrimary && (
                <div className="space-y-4 pl-4 border-l-2 border-[#E5E5E5]">
                  <h5 className="font-semibold text-[#000000] text-sm">
                    Tell us about your commitments
                  </h5>

                  {LIABILITY_CONFIG.map((config) => (
                    <div key={config.key} className="space-y-3">
                      <Controller
                        name={`liabilities.${config.key}.enabled` as const}
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center justify-between">
                            <label htmlFor={`liability-${config.key}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                              {config.label}
                            </label>
                            <Checkbox
                              id={`liability-${config.key}`}
                              checked={Boolean(field.value)}
                              onCheckedChange={(checked) => {
                                const enabled = checked === true
                                field.onChange(enabled)
                                onFieldChange(`liabilities.${config.key}.enabled`, enabled, {
                                  section: 'liabilities_panel',
                                  action: 'toggle',
                                  metadata: {
                                    liabilityType: config.key,
                                    analyticsKey: config.analyticsKey,
                                    timestamp: new Date()
                                  }
                                })
                              }}
                            />
                          </div>
                        )}
                      />

                      {liabilities[config.key].enabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
                          <Controller
                            name={`liabilities.${config.key}.outstandingBalance` as const}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <label htmlFor={`${config.key}-balance`} className="text-[10px] uppercase tracking-wider text-[#666666] mb-2 block">
                                  {config.balanceLabel}
                                </label>
                                <Input
                                  {...field}
                                  id={`${config.key}-balance`}
                                  type="text"
                                  inputMode="numeric"
                                  className="font-mono"
                                  placeholder="0"
                                  value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                                  onChange={(event) => {
                                    const parsedValue = parseFormattedNumber(event.target.value) || 0
                                    field.onChange(parsedValue)
                                    onFieldChange(`liabilities.${config.key}.outstandingBalance`, parsedValue, {
                                      section: 'liabilities_panel',
                                      action: 'balance_updated',
                                      metadata: {
                                        liabilityType: config.key,
                                        newValue: parsedValue,
                                        timestamp: new Date()
                                      }
                                    })
                                  }}
                                />
                              </div>
                            )}
                          />

                          <Controller
                            name={`liabilities.${config.key}.monthlyPayment` as const}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <label htmlFor={`${config.key}-payment`} className="text-[10px] uppercase tracking-wider text-[#666666] mb-2 block">
                                  {config.paymentLabel}
                                </label>
                                <Input
                                  {...field}
                                  id={`${config.key}-payment`}
                                  type="text"
                                  inputMode="numeric"
                                  className="font-mono"
                                  placeholder="0"
                                  value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                                  onChange={(event) => {
                                    const parsedValue = parseFormattedNumber(event.target.value) || 0
                                    field.onChange(parsedValue)
                                    onFieldChange(`liabilities.${config.key}.monthlyPayment`, parsedValue, {
                                      section: 'liabilities_panel',
                                      action: 'payment_updated',
                                      metadata: {
                                        liabilityType: config.key,
                                        newValue: parsedValue,
                                        timestamp: new Date()
                                      }
                                    })
                                  }}
                                />
                              </div>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <Controller
                    name="liabilities.otherCommitments"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label htmlFor="other-commitments" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                          Other commitments (optional)
                        </label>
                        <textarea
                          {...field}
                          id="other-commitments"
                          rows={3}
                          className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                          placeholder="School fees, guarantor obligations, allowances"
                          onChange={(event) => {
                            field.onChange(event.target.value)
                            onFieldChange('liabilities.otherCommitments', event.target.value, {
                              section: 'liabilities_panel',
                              action: 'updated_freeform',
                              metadata: { length: event.target.value.length, timestamp: new Date() }
                            })
                          }}
                        />
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {showJointApplicant && (
          <>
            {/* CO-APPLICANT SECTION HEADER */}
            <div className="py-4 px-6 bg-purple-50 border-l-4 border-l-purple-600 -mx-4 sm:mx-0 mt-12">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">👥</span>
                <h2 className="text-lg font-bold text-purple-900 uppercase tracking-wide">Co-Applicant</h2>
              </div>
            </div>

            {!isCoApplicantIncomeExpanded ? (
              // CO-APPLICANT COLLAPSED VIEW
              <div className="p-4 border border-[#E5E5E5] border-l-4 border-l-purple-500 bg-[#F8F8F8] flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">Income</p>
                  <p className="text-xs text-[#666666]">
                    ${formatNumberWithCommas(coApplicantIncome)}/month
                    {' • '}
                    Age {coApplicantAge}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCoApplicantIncomeExpanded(true)}
                  className="text-sm text-[#666666] hover:text-black transition-colors min-h-[44px] px-4 py-2"
                >
                  Edit
                </button>
              </div>
            ) : (
              <CoApplicantPanel
                control={control}
                errors={errors}
                onFieldChange={onFieldChange}
                loanType="new_purchase"
              />
            )}

            {/* CO-APPLICANT FINANCIAL COMMITMENTS - Only show after employment, income, and age filled */}
            {showJointApplicant && employmentType_1 && coApplicantIncome > 0 && coApplicantAge > 0 && (
              <div className="space-y-4">
                <div className="space-y-6 p-4 border border-[#E5E5E5] border-l-4 border-l-purple-500">
                  {/* Single gate question */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#000000] text-sm">
                        Does co-applicant have any existing loans or commitments?
                      </h4>
                      <p className="text-xs text-[#666666] mt-1">
                        Property loans, car loans, credit cards, etc.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setHasCommitmentsCoApplicant(false)}
                        className={`px-6 py-2 border text-sm font-semibold ${
                          hasCommitmentsCoApplicant === false
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#000000]'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasCommitmentsCoApplicant(true)}
                        className={`px-6 py-2 border text-sm font-semibold ${
                          hasCommitmentsCoApplicant === true
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#000000]'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>

                  {/* Only show if Yes */}
                  {hasCommitmentsCoApplicant && (
                    <div className="space-y-4 pl-4 border-l-2 border-[#E5E5E5]">
                      <h5 className="font-semibold text-[#000000] text-sm">
                        Tell us about co-applicant&apos;s commitments
                      </h5>

                      {LIABILITY_CONFIG.map((config) => (
                        <div key={config.key} className="space-y-3">
                          <Controller
                            name={`liabilities_2.${config.key}.enabled` as const}
                            control={control}
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <label htmlFor={`liability-2-${config.key}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                                  {config.label}
                                </label>
                                <Checkbox
                                  id={`liability-2-${config.key}`}
                                  checked={Boolean(field.value)}
                                  onCheckedChange={(checked) => {
                                    const enabled = checked === true
                                    field.onChange(enabled)
                                    onFieldChange(`liabilities_2.${config.key}.enabled`, enabled, {
                                      section: 'liabilities_panel',
                                      action: 'toggle',
                                      metadata: {
                                        liabilityType: config.key,
                                        analyticsKey: config.analyticsKey,
                                        timestamp: new Date()
                                      }
                                    })
                                  }}
                                />
                              </div>
                            )}
                          />

                          {liabilities2[config.key].enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
                              <Controller
                                name={`liabilities_2.${config.key}.outstandingBalance` as const}
                                control={control}
                                render={({ field }) => (
                                  <div>
                                    <label htmlFor={`${config.key}-2-balance`} className="text-[10px] uppercase tracking-wider text-[#666666] mb-2 block">
                                      {config.balanceLabel}
                                    </label>
                                    <Input
                                      {...field}
                                      id={`${config.key}-2-balance`}
                                      type="text"
                                      inputMode="numeric"
                                      className="font-mono"
                                      placeholder="0"
                                      value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                                      onChange={(event) => {
                                        const parsedValue = parseFormattedNumber(event.target.value) || 0
                                        field.onChange(parsedValue)
                                        onFieldChange(`liabilities_2.${config.key}.outstandingBalance`, parsedValue, {
                                          section: 'liabilities_panel',
                                          action: 'balance_updated',
                                          metadata: {
                                            liabilityType: config.key,
                                            newValue: parsedValue,
                                            timestamp: new Date()
                                          }
                                        })
                                      }}
                                    />
                                  </div>
                                )}
                              />

                              <Controller
                                name={`liabilities_2.${config.key}.monthlyPayment` as const}
                                control={control}
                                render={({ field }) => (
                                  <div>
                                    <label htmlFor={`${config.key}-2-payment`} className="text-[10px] uppercase tracking-wider text-[#666666] mb-2 block">
                                      {config.paymentLabel}
                                    </label>
                                    <Input
                                      {...field}
                                      id={`${config.key}-2-payment`}
                                      type="text"
                                      inputMode="numeric"
                                      className="font-mono"
                                      placeholder="0"
                                      value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                                      onChange={(event) => {
                                        const parsedValue = parseFormattedNumber(event.target.value) || 0
                                        field.onChange(parsedValue)
                                        onFieldChange(`liabilities_2.${config.key}.monthlyPayment`, parsedValue, {
                                          section: 'liabilities_panel',
                                          action: 'payment_updated',
                                          metadata: {
                                            liabilityType: config.key,
                                            newValue: parsedValue,
                                            timestamp: new Date()
                                          }
                                        })
                                      }}
                                    />
                                  </div>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <Controller
                        name="liabilities_2.otherCommitments"
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label htmlFor="other-commitments-2" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                              Other commitments (optional)
                            </label>
                            <textarea
                              {...field}
                              id="other-commitments-2"
                              rows={3}
                              className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                              placeholder="School fees, guarantor obligations, allowances"
                              onChange={(event) => {
                                field.onChange(event.target.value)
                                onFieldChange('liabilities_2.otherCommitments', event.target.value, {
                                  section: 'liabilities_panel',
                                  action: 'updated_freeform',
                                  metadata: { length: event.target.value.length, timestamp: new Date() }
                                })
                              }}
                            />
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
