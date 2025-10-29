// ABOUTME: Prototype Decision Bank homepage concepts for review.
// ABOUTME: Non-production page exercising new messaging and evidence structure.

'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

type RateType = 'sora' | 'fixed' | 'hybrid'

type RangeSnapshot = {
  type: RateType
  label: string
  sublabel: string
  range: [number, number]
  banks: number
  notes: string
}

type StaySwitchData = {
  title: string
  headline: string
  metrics: Array<{ label: string; value: string; detail?: string }>
  highlights: string[]
  intent: 'stay' | 'switch'
}

type CaseStudy = {
  id: string
  client: string
  property: string
  outcome: 'stay' | 'switch'
  summary: string
  savings: string
  decisionTime: string
}

type ProcessStep = {
  title: string
  description: string
  detail: string
}

const rangeSnapshots: RangeSnapshot[] = [
  {
    type: 'sora',
    label: 'SORA packages',
    sublabel: 'Floating rate options',
    range: [2.63, 2.78],
    banks: 6,
    notes: 'Updated 07 Nov 2025 · Decision Bank range monitor'
  },
  {
    type: 'fixed',
    label: 'Fixed (2-year)',
    sublabel: 'Owner-occupied homes',
    range: [2.85, 3.12],
    banks: 5,
    notes: 'Includes major domestic lenders + 1 regional bank'
  },
  {
    type: 'hybrid',
    label: 'Hybrid (part-fixed)',
    sublabel: 'Cashflow smoothing',
    range: [2.74, 2.96],
    banks: 4,
    notes: 'Decision Bank recommends hybrid only with 18m monitoring'
  }
]

const staySwitchComparison: StaySwitchData[] = [
  {
    title: 'Stay with current bank',
    headline: 'Keep 2.78% effective rate · lock-in 9 months left',
    metrics: [
      { label: 'Monthly payment', value: '$3,420' },
      { label: 'Legal fees', value: '$0', detail: 'No refinance charges' },
      { label: 'Break-even', value: '—', detail: 'N/A (stay scenario)' }
    ],
    highlights: [
      'Decision Bank confidence: 78%',
      'Recommend stay if savings < $180/m',
      'Schedule review when rate crosses 3.1%'
    ],
    intent: 'stay'
  },
  {
    title: 'Switch via Decision Bank',
    headline: 'Move to 2.63% SORA + 0.20 spread',
    metrics: [
      { label: 'Monthly payment', value: '$3,210', detail: '$210/month saved' },
      { label: 'Legal + valuation', value: '$2,350', detail: 'Covered by lender rebate' },
      { label: 'Break-even', value: '11 months' }
    ],
    highlights: [
      'Decision Bank confidence: 92%',
      'Assign advisor once docs received',
      'Trigger alert if rates rise by 15 bps'
    ],
    intent: 'switch'
  }
]

const caseStudies: CaseStudy[] = [
  {
    id: 'DB-1737',
    client: 'HDB upgrader · dual income',
    property: '4-room HDB to EC',
    outcome: 'stay',
    summary: 'Decision Bank advised staying due to 8-month lock-in and marginal savings.',
    savings: '$180/month avoided refinance fees',
    decisionTime: '12-hour turnaround'
  },
  {
    id: 'DB-1842',
    client: 'Private condo investor',
    property: 'Freehold 2BR',
    outcome: 'switch',
    summary: 'Moved to hybrid package after stress-testing cashflow under rising SORA.',
    savings: '$420/month net after fees',
    decisionTime: '18-hour turnaround'
  },
  {
    id: 'DB-1904',
    client: 'Commercial shophouse owner',
    property: 'F&B unit, District 3',
    outcome: 'switch',
    summary: 'Refinanced to structured rate with staged drawdown advised by Decision Bank.',
    savings: '$1,120/month net',
    decisionTime: '36-hour turnaround'
  }
]

const processSteps: ProcessStep[] = [
  {
    title: 'Brief the Decision Bank',
    description: 'Submit your scenario in under five minutes.',
    detail: 'We link consent, income bands, and lock-in clocks to your Decision Bank record.'
  },
  {
    title: 'Compare stay vs. switch',
    description: 'Decision Bank models both paths using case evidence.',
    detail: 'Ranges show banks + spreads; repricing appears only when it truly wins.'
  },
  {
    title: 'Human review and next step',
    description: 'Advisor signs off, handles documents, and monitors post-move.',
    detail: 'Disclosure reminder: we earn a fee only when you refinance through us.'
  }
]

const carouselItemClass = clsx(
  'min-w-[280px]',
  'md:min-w-[320px]',
  'bg-white/70',
  'border',
  'border-white/60',
  'p-6',
  'shadow-[0_18px_40px_-30px_rgba(15,76,117,0.35)]',
  'backdrop-blur-sm',
  'flex',
  'flex-col',
  'justify-between'
)

const rateBadgeColors: Record<RateType, string> = {
  sora: 'text-[#0F4C75]',
  fixed: 'text-[#b38600]',
  hybrid: 'text-[#047857]'
}

const DecisionBankHero: React.FC = () => (
  <section className="bg-gradient-to-br from-[#F8FBFF] via-white to-[#EEF4F9] pt-28 pb-24">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
      <div className="space-y-8">
        <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] bg-white/40 text-[#0B1F32] backdrop-blur">
          NextNest Decision Bank (our analysis team)
        </span>
        <h1 className="text-4xl md:text-5xl font-light text-[#0B1F32] leading-tight">
          Stay or switch, without second-guessing.
        </h1>
        <p className="max-w-xl text-base text-[#374151]">
          Decision Bank quietly balances your current package against today&apos;s best switch paths and surfaces the numbers you need to move calmly.
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold tracking-[0.25em] text-[#0B1F32] uppercase">
          {[
            '286 packages monitored',
            'Ranges refresh 4× daily',
            'Advisor reply under 24h'
          ].map((chip) => (
            <span key={chip} className="inline-flex items-center px-3 py-1 bg-white/60 backdrop-blur text-[#0B1F32]">
              {chip}
            </span>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/apply"
            className="inline-flex h-14 items-center justify-center rounded-none bg-[#FCD34D] px-6 text-base font-semibold text-[#0B1F32] shadow-sm shadow-[#FCD34D]/40 transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            Start analysis
          </Link>
          <a
            href="#ranges"
            className="inline-flex h-14 items-center justify-center border border-[#0F4C75]/30 px-6 text-base font-semibold text-[#0B1F32] transition-colors duration-200 hover:bg-white/60"
          >
            Skip to ranges
          </a>
        </div>
      </div>

      <div className="bg-white/70 border border-white/60 shadow-[0_18px_40px_-24px_rgba(15,76,117,0.35)] p-6 space-y-5 backdrop-blur">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0B1F32]">
              Decision Bank snapshot
            </h2>
            <p className="text-xs text-[#6B7280]">07 Nov 2025 · 14:05</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#047857]">
            <span className="h-2 w-2 rounded-full bg-[#047857]" aria-hidden="true" />
            Live signal
          </span>
        </header>
        <div className="space-y-4">
          {rangeSnapshots.map((range) => (
            <div key={range.type} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[#0B1F32]">
                <span className="font-semibold">{range.label}</span>
                <span className="text-xs uppercase tracking-[0.25em] text-[#6B7280]">{range.banks} banks</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-[#6B7280]">{range.sublabel}</p>
                <p className="font-mono text-2xl text-[#0B1F32]">
                  {range.range[0].toFixed(2)} – {range.range[1].toFixed(2)}%
                </p>
              </div>
              <p className={clsx('text-xs text-[#6B7280]', rateBadgeColors[range.type])}>{range.notes}</p>
            </div>
          ))}
        </div>
        <footer className="border-t border-white/60 pt-3">
          <p className="text-xs text-[#6B7280]">
            Named banks unlock during advisor review.
          </p>
        </footer>
      </div>
    </div>
  </section>
)

const StaySwitchSection: React.FC = () => (
  <section id="ranges" className="bg-white py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="text-3xl font-light text-[#0B1F32]">Stay vs. switch highlights</h2>
        <p className="text-sm text-[#6B7280]">
          Snapshot based on today&apos;s Decision Bank ranges; repricing appears only when it wins.
        </p>
      </header>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {staySwitchComparison.map((option) => (
          <article
            key={option.intent}
            className={clsx(
              'border border-white/70 bg-white/60 p-6 shadow-[0_18px_40px_-30px_rgba(15,76,117,0.35)] backdrop-blur-md transition-shadow duration-200 hover:shadow-[0_24px_45px_-28px_rgba(15,76,117,0.35)]',
              option.intent === 'switch' ? 'outline outline-1 outline-[#0F4C75]/35' : ''
            )}
            aria-label={`${option.title} summary`}
          >
            <header className="space-y-2">
              <h3 className="text-sm uppercase tracking-wide text-[#6B7280]">{option.title}</h3>
              <p className="text-lg font-semibold text-[#0B1F32]">{option.headline}</p>
            </header>
            <dl className="mt-6 grid gap-4">
              {option.metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col border-l border-[#0F4C75]/30 pl-3">
                  <dt className="text-xs uppercase tracking-wide text-[#6B7280]">{metric.label}</dt>
                  <dd className="text-lg font-mono text-[#0B1F32]">{metric.value}</dd>
                  {metric.detail && <span className="text-xs text-[#6B7280]">{metric.detail}</span>}
                </div>
              ))}
            </dl>
            <ul className="mt-6 space-y-2">
              {option.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm text-[#374151]">
                  <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 bg-[#0F4C75]/70" />
                  {highlight}
                </li>
              ))}
            </ul>
            <footer className="mt-6 text-xs text-[#6B7280]">
              Decision Bank evidence level updated each time ranges move by ≥10 bps.
            </footer>
          </article>
        ))}
      </div>
    </div>
  </section>
)

const CaseCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? caseStudies.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === caseStudies.length - 1 ? 0 : prev + 1))
  }

  const visibleCases = useMemo(() => {
    const current = caseStudies[activeIndex]
    const next = caseStudies[(activeIndex + 1) % caseStudies.length]
    return [current, next]
  }, [activeIndex])

  return (
    <section className="bg-gradient-to-r from-[#F8FBFF] via-white to-[#F8FBFF] py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-light text-[#0B1F32]">Decision Bank case log</h2>
            <p className="mt-2 text-sm text-[#6B7280]">Anonymized Singapore outcomes shaping today&apos;s guidance.</p>
          </div>
          <div className="flex gap-2" aria-label="Decision Bank case navigation">
            <button
              type="button"
              onClick={handlePrevious}
              className="h-10 w-10 border border-[#0F4C75]/40 text-[#0F4C75] backdrop-blur-sm bg-white/60 transition-colors duration-200 hover:bg-white"
              aria-label="Previous case study"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="h-10 w-10 border border-[#0F4C75]/40 text-[#0F4C75] backdrop-blur-sm bg-white/60 transition-colors duration-200 hover:bg-white"
              aria-label="Next case study"
            >
              ›
            </button>
          </div>
        </header>

        <div className="mt-10 flex gap-4 overflow-hidden" role="list">
          {visibleCases.map((item) => (
            <article key={item.id} className={carouselItemClass} role="listitem">
              <header>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[#6B7280]">
                  <span>{item.id}</span>
                  <span>{item.outcome === 'stay' ? 'Stay' : 'Switch'} advised</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#0B1F32]">{item.client}</h3>
                <p className="text-sm text-[#6B7280]">{item.property}</p>
              </header>
              <p className="mt-4 flex-1 text-sm text-[#374151]">{item.summary}</p>
              <footer className="mt-6 space-y-2 text-sm text-[#0B1F32]">
                <p>{item.savings}</p>
                <p className="text-xs text-[#6B7280]">Decision window: {item.decisionTime}</p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const DecisionBankProcess: React.FC = () => (
  <section className="bg-white py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <h2 className="text-3xl font-light text-[#0B1F32]">Decision Bank flow in 3 steps</h2>
      </header>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {processSteps.map((step, index) => (
          <article key={step.title} className="border border-white/70 bg-white/60 p-6 shadow-[0_18px_40px_-32px_rgba(15,76,117,0.35)] backdrop-blur-sm space-y-3">
            <span className="inline-flex h-8 w-8 items-center justify-center border border-[#0F4C75]/40 text-[#0F4C75] text-sm font-semibold">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-[#0B1F32]">{step.title}</h3>
            <p className="text-sm text-[#374151]">{step.description}</p>
            <p className="text-xs text-[#6B7280]">{step.detail}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
)

const DisclosureBanner: React.FC = () => (
  <section className="bg-[#0B1F32] py-6">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-2 text-white md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-semibold uppercase tracking-wide">Disclosure</p>
      <Link href="/docs/disclosure" className="text-sm underline underline-offset-4 md:max-w-3xl">
        View the full disclosure statement (coming soon)
      </Link>
    </div>
  </section>
)

const TestDecisionBankPage: React.FC = () => (
  <main className="min-h-screen bg-[#F5F7FA] text-[#0B1F32]">
    <DecisionBankHero />
    <StaySwitchSection />
    <CaseCarousel />
    <DecisionBankProcess />
    <DisclosureBanner />
  </main>
)

export default TestDecisionBankPage
