// ABOUTME: Shared employment field panel with progressive disclosure for all employment types

'use client'

import { Control, Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  EmploymentType,
  EMPLOYMENT_LABELS,
  getEmploymentRecognitionRate
} from '@/lib/forms/employment-types'

interface EmploymentPanelProps {
  applicantNumber: 0 | 1
  control: Control<any>
  errors: any
  touchedFields?: any
  onFieldChange: (field: string, value: any, analytics?: any) => void
  showEmploymentDetails?: boolean
  compact?: boolean
}

export function EmploymentPanel({
  applicantNumber,
  control,
  errors,
  touchedFields,
  onFieldChange,
  showEmploymentDetails = true,
  compact = false
}: EmploymentPanelProps) {
  // Watch employment type to show conditional panels
  const employmentType = useWatch({
    control,
    name: applicantNumber === 0 ? 'employmentType' : 'employmentType_1'
  }) as EmploymentType

  const recognitionRate = getEmploymentRecognitionRate(employmentType)
  const fieldPrefix = applicantNumber === 0 ? '' : '_1'

  // Helper to generate field names based on applicantNumber
  const getFieldName = (baseName: string) =>
    applicantNumber === 0 ? baseName : `${baseName}_1`

  // Helper to check if error should be displayed (only show if field has been touched)
  const shouldShowError = (fieldName: string): boolean => {
    if (!touchedFields) return true // If touchedFields not provided, show errors (backward compat)

    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    const hasError = getNestedValue(errors, fieldName)
    const isTouched = getNestedValue(touchedFields, fieldName)

    return Boolean(hasError && isTouched)
  }

  // Self-employed conditional panel
  const renderSelfEmployedPanel = () => {
    if (!showEmploymentDetails || employmentType !== 'self-employed') return null

    return (
      <div className="space-y-3 border border-[#E5E5E5] bg-white p-3 mt-3">
        <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
          Self-employed details
        </p>

        <Controller
          name={`employmentDetails${fieldPrefix}.self-employed.businessAgeYears`}
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={`self-employed-business-age-${applicantNumber}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Years your business has been operating
              </label>
              <Input
                {...field}
                id={`self-employed-business-age-${applicantNumber}`}
                type="number"
                min="0"
                placeholder="5"
                onChange={(e) => {
                  field.onChange(e.target.value)
                  onFieldChange(`employmentDetails${fieldPrefix}.self-employed.businessAgeYears`, e.target.value, {
                    section: 'employment_panel',
                    action: 'business_age_updated',
                    applicant: applicantNumber
                  })
                }}
              />
            </div>
          )}
        />

        <Controller
          name={`employmentDetails${fieldPrefix}.self-employed.averageReportedIncome`}
          control={control}
          render={({ field }) => (
            <div>
              <label htmlFor={`self-employed-noa-${applicantNumber}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
                Average monthly income from 2-year NOA
              </label>
              <Input
                {...field}
                id={`self-employed-noa-${applicantNumber}`}
                type="number"
                min="0"
                placeholder="10000"
                className="font-mono"
                onChange={(e) => {
                  field.onChange(e.target.value)
                  onFieldChange(`employmentDetails${fieldPrefix}.self-employed.averageReportedIncome`, Number(e.target.value) || 0, {
                    section: 'employment_panel',
                    action: 'noa_income_updated',
                    applicant: applicantNumber
                  })
                }}
              />
              <p className="text-xs text-[#666666] mt-1">
                We recognize 70% of your average monthly income from your latest 2-year NOA
              </p>
            </div>
          )}
        />
      </div>
    )
  }

  //   // In-between-jobs conditional panel
  //   const renderInBetweenJobsPanel = () => {
  //     if (!showEmploymentDetails || employmentType !== 'in-between-jobs') return null
  // 
  //     return (
  //       <div className="space-y-3 border border-[#E5E5E5] bg-white p-3 mt-3">
  //         <p className="text-xs uppercase tracking-wider text-[#666666] font-semibold">
  //           New employment details
  //         </p>
  // 
  //         <Controller
  //           name={`employmentDetails${fieldPrefix}.in-between-jobs.monthsWithEmployer`}
  //           control={control}
  //           render={({ field }) => (
  //             <div>
  //               <label htmlFor={`in-between-months-${applicantNumber}`} className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block">
  //                 Months with current employer (0-2)
  //               </label>
  //               <Input
  //                 {...field}
  //                 id={`in-between-months-${applicantNumber}`}
  //                 type="number"
  //                 min="0"
  //                 max="2"
  //                 placeholder="1"
  //                 onChange={(e) => {
  //                   field.onChange(e.target.value)
  //                   onFieldChange(`employmentDetails${fieldPrefix}.in-between-jobs.monthsWithEmployer`, e.target.value, {
  //                     section: 'employment_panel',
  //                     action: 'months_updated',
  //                     applicant: applicantNumber
  //                   })
  //                 }}
  //               />
  //             </div>
  //           )}
  //         />
  // 
  //         <div className="p-3 bg-[#F8F8F8] border border-[#E5E5E5]">
  //           <p className="text-xs text-[#666666]">
  //             Since you&apos;re new to this job, we&apos;ll need your signed employment contract and an email from your work email to verify employment.
  //           </p>
  //         </div>
  //       </div>
  //     )
  //   }

  return (
    <div className="space-y-4">
      <Controller
        name={getFieldName('employmentType')}
        control={control}
        render={({ field }) => (
          <div>
            <label
              id={`employment-type-label-${applicantNumber}`}
              className="text-xs uppercase tracking-wider text-[#666666] font-semibold mb-2 block"
            >
              Employment Type *
            </label>
            <Select
              value={field.value || ''}
              onValueChange={(value) => {
                field.onChange(value)
                onFieldChange(getFieldName('employmentType'), value, {
                  section: 'employment_panel',
                  action: 'changed',
                  applicant: applicantNumber,
                  metadata: {
                    from: field.value || 'none',
                    to: value,
                    recognitionRate: getEmploymentRecognitionRate(value as EmploymentType)
                  }
                })
              }}
            >
              <SelectTrigger
                id={`employment-type-select-${applicantNumber}`}
                aria-labelledby={`employment-type-label-${applicantNumber}`}
              >
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    data-testid={`employment-option-${value}`}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shouldShowError(getFieldName('employmentType')) && (
              <p className="text-[#DC2626] text-xs mt-1" role="alert">
                Employment type is required
              </p>
            )}
            {employmentType && (
              <p className="text-xs text-[#666666] mt-1">
                Income recognition: {Math.round(recognitionRate * 100)}%
              </p>
            )}
          </div>
        )}
      />

      {renderSelfEmployedPanel()}
      {/* {renderInBetweenJobsPanel()} */}
    </div>
  )
}
