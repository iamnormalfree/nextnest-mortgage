'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Loader2 } from 'lucide-react'
import { cn, formatNumberWithCommas } from '@/lib/utils'

export type InstantAnalysisType = 'new_purchase' | 'refinance'

export interface InstantAnalysisResult {
  type: InstantAnalysisType
  ltvUsed?: number
  maxLoan?: number
  monthlyPayment?: number
  stressTestPayment?: number
  tenureLimit?: number
  interestRate?: number
  currentPayment?: number
  newPayment?: number
  monthlySavings?: number
  yearlySavings?: number
  inputValues?: Record<string, unknown>
}

interface InstantAnalysisCardProps {
  isVisible: boolean
  isLoading: boolean
  result?: InstantAnalysisResult | null
  className?: string
}

export function InstantAnalysisCard({ isVisible, isLoading, result, className }: InstantAnalysisCardProps) {
  if (!isVisible) {
    return null
  }

  const containerClasses = 'mt-4 w-full rounded-2xl border border-mist bg-white shadow-sm sm:shadow-md'
  const bodyPadding = 'px-4 py-4 sm:px-6 sm:py-5'

  if (isLoading) {
    return (
      <section className={cn(containerClasses, className)}>
        <div className={cn(bodyPadding, 'space-y-4')}>
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-gold" />
            <div>
              <p className="text-sm font-semibold text-ink">Running instant analysis</p>
              <p className="mt-1 text-xs text-graphite">
                Processing your details with our AI heuristics. This usually takes a few seconds.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </section>
    )
  }

  if (!result) {
    return null
  }

  const isRefinance = result.type === 'refinance'

  return (
    <section className={cn(containerClasses, 'animate-fade-in', className)}>
      <div className={cn(bodyPadding, 'space-y-5')}>
        <div className="text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-emerald" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">Instant analysis complete</p>
          <p className="mt-2 text-xs leading-relaxed text-graphite">
            Instant estimate using default assumptions. Our AI broker will refine the numbers before consultation.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {isRefinance ? (
            <>
              <MetricCard label="Current payment" value={formatCurrency(result.currentPayment)} emphasize />
              <MetricCard label="Estimated new payment" value={formatCurrency(result.newPayment)} highlight />
              <MetricCard label="Monthly savings" value={formatCurrency(result.monthlySavings)} highlight positive />
              <MetricCard label="Annual savings" value={formatCurrency(result.yearlySavings)} positive />
            </>
          ) : (
            <>
              <MetricCard
                label={`Max loan (${Math.round((result.ltvUsed ?? 0) * 100)}% LTV)`}
                value={formatCurrency(result.maxLoan)}
                highlight
              />
              <MetricCard
                label={`Monthly payment @ ${(result.interestRate ?? 2.8).toFixed(1)}%`}
                value={formatCurrency(result.monthlyPayment)}
              />
              <MetricCard
                label="Stress test payment @ 4%"
                value={formatCurrency(result.stressTestPayment)}
              />
              <MetricCard
                label="Max tenure"
                value={result.tenureLimit ? `${result.tenureLimit} years` : ''}
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

interface MetricCardProps {
  label: string
  value?: string
  highlight?: boolean
  positive?: boolean
  emphasize?: boolean
}

function MetricCard({ label, value = '', highlight = false, positive = false, emphasize = false }: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-1.5 rounded-xl border border-transparent bg-mist px-4 py-3 shadow-sm transition-all sm:gap-2 sm:px-5 sm:py-4',
        highlight && 'border-gold/50 bg-gold/10 shadow-[0_6px_20px_rgba(249,173,29,0.12)]',
        positive && !highlight && 'border-emerald/40 bg-emerald/10'
      )}
    >
      <p
        className={cn(
          'text-xs leading-snug text-graphite md:text-sm',
          emphasize && 'font-medium text-charcoal'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'text-base font-semibold text-charcoal md:text-lg',
          positive && 'text-emerald',
          highlight && 'text-emerald'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return ''
  }
  return `S$${formatNumberWithCommas(Math.round(value))}`
}
