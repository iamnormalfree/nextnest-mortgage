// ABOUTME: Co-applicant panel with full field parity (income, age, employment)

'use client'

import { Control, Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'
import { EmploymentPanel } from './EmploymentPanel'
import { formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils'

interface CoApplicantPanelProps {
  control: Control<any>
  errors: any
  onFieldChange: (field: string, value: any, analytics?: any) => void
  loanType: 'new_purchase' | 'refinance'
}

export function CoApplicantPanel({
  control,
  errors,
  onFieldChange,
  loanType
}: CoApplicantPanelProps) {
  // Watch employment type for progressive disclosure
  const employmentType_1 = (useWatch({ control, name: 'employmentType_1' }) as string) || ''

  return (
    <div className="space-y-4 p-4 border border-[#E5E5E5] border-l-4 border-l-purple-500 bg-[#F8F8F8]">
      <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
        Income Details
      </p>

      {/* EMPLOYMENT TYPE FIRST - Drives progressive disclosure */}
      <EmploymentPanel
        applicantNumber={1}
        control={control}
        errors={errors}
        onFieldChange={onFieldChange}
      />

      {/* CONDITIONAL: Monthly income for employed/in-between-jobs only */}
      {employmentType_1 && (employmentType_1 === 'employed' || employmentType_1 === 'in-between-jobs') && (
      <Controller
        name="actualIncomes.1"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="monthly-income-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
              Monthly Income *
            </label>
            <Input
              {...field}
              id="monthly-income-joint"
              type="text"
              inputMode="numeric"
              className="font-mono"
              placeholder="6,000"
              value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
              onChange={(e) => {
                const parsedValue = parseFormattedNumber(e.target.value) || 0
                field.onChange(parsedValue)
                onFieldChange('actualIncomes.1', parsedValue, {
                  section: 'co_applicant',
                  action: 'income_updated',
                  applicant: 1
                })
              }}
            />
            {errors['actualIncomes.1'] && (
              <p className="text-[#DC2626] text-xs mt-1" role="alert">
                Monthly income is required
              </p>
            )}
          </div>
        )}
      />
      )}

      {/* CONDITIONAL: Variable income for all except not-working and self-employed */}
      {employmentType_1 && employmentType_1 !== 'not-working' && employmentType_1 !== 'self-employed' && (
      <Controller
        name="actualVariableIncomes.1"
        control={control}
        render={({ field }) => (
          <div>
            <label htmlFor="variable-income-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
              Variable / bonus income (optional)
            </label>
            <Input
              {...field}
              id="variable-income-joint"
              type="text"
              inputMode="numeric"
              className="font-mono"
              placeholder="1,500"
              value={field.value ? formatNumberWithCommas(field.value.toString()) : ''}
              onChange={(e) => {
                const parsedValue = parseFormattedNumber(e.target.value) || 0
                field.onChange(parsedValue)
                onFieldChange('actualVariableIncomes.1', parsedValue, {
                  section: 'co_applicant',
                  action: 'variable_income_updated',
                  applicant: 1
                })
              }}
            />
            <p className="text-xs text-[#666666] mt-1">
              70% of commissions and bonuses are recognized
            </p>
          </div>
        )}
      />
      )}

      {/* AGE - Always required when employment type is selected */}
      {employmentType_1 && (
      <Controller
        name="actualAges.1"
        control={control}
        render={({ field }) => (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="age-joint" className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
                Age *
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
              id="age-joint"
              type="number"
              min="18"
              max="99"
              step="1"
              placeholder="35"
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                field.onChange(value)
                onFieldChange('actualAges.1', value, {
                  section: 'co_applicant',
                  action: 'age_updated',
                  applicant: 1
                })
              }}
            />
            {errors['actualAges.1'] && (
              <p className="text-[#DC2626] text-xs mt-1" role="alert">
                Age is required
              </p>
            )}
          </div>
        )}
      />
      )}
    </div>
  )
}
