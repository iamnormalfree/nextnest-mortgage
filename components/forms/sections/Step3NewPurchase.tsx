// ABOUTME: Step 3 New Purchase section with income panel, liabilities toggles, and MAS readiness card

'use client'

import { useMemo, useState, useEffect } from 'react'
import { Control, Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { getEmploymentRecognitionRate, calculateInstantProfile } from '@/lib/calculations/instant-profile'
import { DR_ELENA_INCOME_DESCRIPTIONS, DR_ELENA_REASON_CODE_MESSAGES } from '@/lib/calculations/dr-elena-constants'
import type { InstantCalcResult } from '@/lib/contracts/form-contracts'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'

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
}

const LIABILITY_CONFIG: Array<{ key: LiabilityKey; label: string; balanceLabel: string; paymentLabel: string; analyticsKey: string }> = [
  {
    key: 'propertyLoans',
    label: 'Property loans',
    balanceLabel: 'Outstanding balance',
    paymentLabel: 'Monthly payment',
    analyticsKey: 'property_loans'
  },
  {
    key: 'carLoans',
    label: 'Car loans',
    balanceLabel: 'Outstanding balance',
    paymentLabel: 'Monthly payment',
    analyticsKey: 'car_loans'
  },
  {
    key: 'creditCards',
    label: 'Credit cards',
    balanceLabel: 'Outstanding balance',
    paymentLabel: 'Minimum payment',
    analyticsKey: 'credit_cards'
  },
  {
    key: 'personalLines',
    label: 'Personal lines',
    balanceLabel: 'Outstanding balance',
    paymentLabel: 'Monthly payment',
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

export function Step3NewPurchase({ onFieldChange, showJointApplicant, errors, getErrorMessage, control, instantCalcResult }: Step3NewPurchaseProps) {
  const [hasCommitments, setHasCommitments] = useState<boolean | null>(null)

  const primaryIncome = ensureNumber(useWatch({ control, name: 'actualIncomes.0' }))
  const variableIncome = ensureNumber(useWatch({ control, name: 'actualVariableIncomes.0' }))
  const age = ensureNumber(useWatch({ control, name: 'actualAges.0' }))
  const employmentType = (useWatch({ control, name: 'employmentType' }) as string) || 'employed'
  const employmentDetails = useWatch({ control, name: 'employmentDetails' }) as Record<string, any> | undefined
  const liabilitiesRaw = useWatch({ control, name: 'liabilities' }) as Partial<LiabilityState> | undefined
  const propertyValue = ensureNumber(useWatch({ control, name: 'priceRange' }))
  const loanAmount = ensureNumber(instantCalcResult?.maxLoanAmount)
  const propertyType = (useWatch({ control, name: 'propertyType' }) as string) || 'Private'

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

  const totalMonthlyCommitments = useMemo(() => {
    return LIABILITY_CONFIG.reduce((total, config) => {
      const details = liabilities[config.key]
      if (!details?.enabled) return total
      return total + ensureNumber(details.monthlyPayment)
    }, 0)
  }, [liabilities])

  // Clear all commitment fields when user selects "No" to having commitments
  useEffect(() => {
    if (hasCommitments === false) {
      LIABILITY_CONFIG.forEach((config) => {
        onFieldChange(`liabilities.${config.key}.enabled`, false)
        onFieldChange(`liabilities.${config.key}.outstandingBalance`, '')
        onFieldChange(`liabilities.${config.key}.monthlyPayment`, '')
      })
      onFieldChange('liabilities.otherCommitments', '')
    }
  }, [hasCommitments, onFieldChange])

  const recognitionRate = getEmploymentRecognitionRate(employmentType)

  const variableProfileIncome = employmentType === 'variable'
    ? ensureNumber(employmentDetails?.variable?.averagePastTwelveMonths)
    : variableIncome

  const selfEmployedDeclared = employmentType === 'self-employed'
    ? ensureNumber(employmentDetails?.['self-employed']?.averageReportedIncome) || primaryIncome
    : primaryIncome

  const recognizedPrimaryIncome = (() => {
    if (employmentType === 'self-employed') {
      return ensureNumber(selfEmployedDeclared) * recognitionRate
    }
    if (employmentType === 'variable') {
      return primaryIncome
    }
    return primaryIncome * recognitionRate
  })()
  const recognizedVariableIncome = ensureNumber(variableProfileIncome) * getEmploymentRecognitionRate('variable')

  const recognizedIncome = Math.max(recognizedPrimaryIncome + recognizedVariableIncome, 0)
  const effectiveIncome = recognizedIncome > 0 ? recognizedIncome : primaryIncome + variableProfileIncome

  const masReadiness = useMemo(() => {
    if (!effectiveIncome || !age || !propertyValue) {
      return {
        isReady: false,
        tdsr: 0,
        tdsrLimit: 55,
        msr: 0,
        msrLimit: 30,
        reasons: ['Complete income, age, and property value to check eligibility']
      }
    }

    const calculatorResult = calculateInstantProfile({
      property_price: propertyValue,
      property_type: propertyType as any,
      buyer_profile: 'SC',
      existing_properties: 0,
      income: effectiveIncome,
      commitments: totalMonthlyCommitments,
      rate: 3.0,
      tenure: 30,
      age,
      loan_type: 'new_purchase',
      is_owner_occupied: true
    })

    // Use persona-derived reason codes and policy references from calculator
    // instead of hardcoded strings
    const limitingFactor = calculatorResult.limitingFactor
    const reasons: string[] = []

    // Add persona-derived reason codes
    if (calculatorResult.reasonCodes && calculatorResult.reasonCodes.length > 0) {
      reasons.push(...calculatorResult.reasonCodes.map(code => {
        // Convert snake_case reason codes to user-friendly messages using persona constants
        return DR_ELENA_REASON_CODE_MESSAGES[code] || code
      }))
    }

    // Add policy references if available
    if (calculatorResult.policyRefs && calculatorResult.policyRefs.length > 0) {
      reasons.push(`Policy references: ${calculatorResult.policyRefs.join(', ')}`)
    }

    // Fallback if no reasons provided
    if (!reasons.length) {
      reasons.push('Eligible for mortgage financing')
    }

    // Calculate monthly mortgage payment for the NEW loan
    // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    // Using MAS stress test rate (4% for residential properties)
    const stressTestRate = 4.0 // MAS stress test rate for residential
    const monthlyRate = stressTestRate / 100 / 12
    const tenureYears = 25 // Standard assumption for new purchase
    const numberOfPayments = tenureYears * 12

    let monthlyMortgagePayment = 0
    if (loanAmount > 0 && monthlyRate > 0) {
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)
      const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1
      monthlyMortgagePayment = Math.ceil(loanAmount * (numerator / denominator))
    }

    // Calculate TDSR: (New Mortgage Payment + Existing Commitments) / Income × 100%
    // TDSR limit is 55% of income (MAS regulation)
    const tdsrRatio = effectiveIncome > 0
      ? ((monthlyMortgagePayment + totalMonthlyCommitments) / effectiveIncome) * 100
      : 0

    // Calculate MSR: (New Mortgage Payment ONLY) / Income × 100%
    // MSR limit is 30% of income (applies to HDB/EC properties only)
    // Note: MSR does NOT include existing debts, only the new mortgage payment
    const msrLimitAmount = calculatorResult.msrLimit ?? (effectiveIncome * 0.30)
    const msrRatio = effectiveIncome > 0 && msrLimitAmount > 0
      ? (monthlyMortgagePayment / effectiveIncome) * 100
      : 0

    return {
      isReady: limitingFactor !== 'TDSR' && limitingFactor !== 'MSR',
      tdsr: tdsrRatio,
      tdsrLimit: 55,
      msr: msrRatio,
      msrLimit: 30,
      reasons
    }
  }, [age, propertyValue, propertyType, effectiveIncome, totalMonthlyCommitments, loanAmount])

  const renderSelfEmployedPanel = () => {
    if (employmentType !== 'self-employed') return null

    return (
      <div className="space-y-3 border border-[#E5E5E5] bg-white p-3">
        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
          Self-employed details
        </p>

        <Controller
          name="employmentDetails.self-employed.businessAgeYears"
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor="self-employed-business-age" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Years your business has been operating
              </label>
              <Input
                {...field}
                id="self-employed-business-age"
                type="number"
                min="0"
                placeholder="5"
                onChange={(event) => {
                  const value = event.target.value
                  field.onChange(value)
                  onFieldChange('employmentDetails.self-employed.businessAgeYears', value, {
                    section: 'employment_panel',
                    action: 'business_age_updated',
                    metadata: { newValue: value, timestamp: new Date() }
                  })
                }}
              />
            </div>
          )}
        />

        <Controller
          name="employmentDetails.self-employed.averageReportedIncome"
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor="self-employed-average-profit" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Average 12-month profit after expenses
              </label>
              <Input
                {...field}
                id="self-employed-average-profit"
                type="number"
                min="0"
                placeholder="9000"
                className="font-mono"
                onChange={(event) => {
                  const value = event.target.value
                  field.onChange(value)
                  onFieldChange('employmentDetails.self-employed.averageReportedIncome', ensureNumber(value), {
                    section: 'employment_panel',
                    action: 'average_income_updated',
                    metadata: { newValue: Number(value) || 0, timestamp: new Date() }
                  })
                }}
              />
            </div>
          )}
        />
      </div>
    )
  }

  const renderVariableIncomePanel = () => {
    if (employmentType !== 'variable') return null

    return (
      <div className="space-y-3 border border-[#E5E5E5] bg-white p-3">
        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
          Variable income averaging
        </p>

        <Controller
          name="employmentDetails.variable.averagePastTwelveMonths"
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor="variable-average-income" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Average monthly income over 12 months
              </label>
              <Input
                {...field}
                id="variable-average-income"
                type="number"
                min="0"
                placeholder="8500"
                className="font-mono"
                onChange={(event) => {
                  const value = event.target.value
                  field.onChange(value)
                  onFieldChange('employmentDetails.variable.averagePastTwelveMonths', ensureNumber(value), {
                    section: 'employment_panel',
                    action: 'variable_average_updated',
                    metadata: { newValue: Number(value) || 0, timestamp: new Date() }
                  })
                }}
              />
            </div>
          )}
        />

        <Controller
          name="employmentDetails.variable.lowestObservedIncome"
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor="variable-lowest-income" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Lowest observed monthly income
              </label>
              <Input
                {...field}
                id="variable-lowest-income"
                type="number"
                min="0"
                placeholder="5000"
                className="font-mono"
                onChange={(event) => {
                  const value = event.target.value
                  field.onChange(value)
                  onFieldChange('employmentDetails.variable.lowestObservedIncome', ensureNumber(value), {
                    section: 'employment_panel',
                    action: 'variable_lowest_updated',
                    metadata: { newValue: Number(value) || 0, timestamp: new Date() }
                  })
                }}
              />
            </div>
          )}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Income Details</h3>

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

          <Controller
            name="employmentType"
            control={control}
            render={({ field }) => (
              <div>
                <label
                  id="employment-type-label"
                  className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
                >
                  Employment Type *
                </label>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    onFieldChange('employmentType', value, {
                      section: 'employment_panel',
                      action: 'changed',
                      metadata: {
                        from: field.value || 'none',
                        to: value,
                        recognitionRate: getEmploymentRecognitionRate(value),
                        timestamp: new Date()
                      }
                    })
                  }}
                >
                  <SelectTrigger
                    id="employment-type-select"
                    aria-labelledby="employment-type-label"
                    aria-label="Employment Type"
                  >
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed (salary)</SelectItem>
                    <SelectItem value="self-employed">Self-employed</SelectItem>
                    <SelectItem value="variable">Variable income</SelectItem>
                    <SelectItem value="not-working">Not working</SelectItem>
                    <SelectItem value="other">Other / mixed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employmentType && (
                  <p className="text-[#EF4444] text-xs mt-1">{getErrorMessage(errors.employmentType)}</p>
                )}
                <p className="text-xs text-[#666666] mt-1">
                  {(() => {
                    const empType = field.value || 'employed'
                    const rate = Math.round(getEmploymentRecognitionRate(empType) * 100)
                    const persona = DR_ELENA_INCOME_DESCRIPTIONS[empType as keyof typeof DR_ELENA_INCOME_DESCRIPTIONS]

                    if (!persona) {
                      return `Income recognition: ${rate}%`
                    }

                    // Build message from persona data
                    const description = persona.description
                    const documentation = persona.documentation

                    return `MAS recognizes ${rate}% of ${description.toLowerCase()} (${documentation})`
                  })()}
                </p>
              </div>
            )}
          />

          {renderSelfEmployedPanel()}
          {renderVariableIncomePanel()}
        </div>

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
                  <label htmlFor="joint-income" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                    Monthly income
                  </label>
                  <Input
                    {...field}
                    id="joint-income"
                    type="text"
                    inputMode="numeric"
                    className="font-mono"
                    placeholder="6,000"
                    value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
                    onChange={(event) => {
                      const parsedValue = parseFormattedNumber(event.target.value) || 0
                      field.onChange(parsedValue)
                      onFieldChange('actualIncomes.1', parsedValue, {
                        section: 'income_panel',
                        action: 'updated_joint_income',
                        metadata: { newValue: parsedValue, timestamp: new Date() }
                      })
                    }}
                  />
                  <p className="text-xs text-[#666666] mt-1">Optional if not applicable</p>
                </div>
              )}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-black">Financial Commitments</h3>

        <div className="space-y-6 p-4 border border-[#E5E5E5]">
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
                onClick={() => setHasCommitments(false)}
                className={`px-6 py-2 border text-sm font-semibold ${
                  hasCommitments === false
                    ? 'bg-[#000000] text-white border-[#000000]'
                    : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#000000]'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHasCommitments(true)}
                className={`px-6 py-2 border text-sm font-semibold ${
                  hasCommitments === true
                    ? 'bg-[#000000] text-white border-[#000000]'
                    : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#000000]'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* Only show if Yes */}
          {hasCommitments && (
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
                    <div className="grid grid-cols-[1fr_1fr] gap-3">
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

      <div className="p-4 border border-[#E5E5E5] bg-[#F8F8F8]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-black">MAS Readiness Check</h3>
            <p className="text-xs text-[#666666]">Updated just now</p>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            masReadiness.isReady ? 'bg-[#10B981]' : 'bg-[#EF4444]'
          }`}>
            {masReadiness.isReady ? (
              <CheckCircle className="w-4 h-4 text-white" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
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
                  reason.includes('Eligible') ? 'text-[#10B981]' : 'text-[#666666]'
                }`}>
                  <span className="mt-0.5">{reason.includes('Eligible') ? '✓' : '•'}</span>
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
