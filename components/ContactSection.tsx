// ABOUTME: Homepage contact section offering loan-type selection CTA
// ABOUTME: Routes users to /apply workflow after choosing a journey

'use client'

import { useRouter } from 'next/navigation'
import type { LoanType } from '@/components/forms/SimpleLoanTypeSelector'

const loanTypeOptions: Array<{ id: LoanType; label: string; caption: string; badge?: string }> = [
  { id: 'new_purchase', label: 'New Purchase', caption: 'First home or upgrading', badge: 'Most popular' },
  { id: 'refinance', label: 'Refinancing', caption: 'Lower existing payments', badge: 'Save avg $34K' },
  { id: 'commercial', label: 'Commercial', caption: 'Business property financing', badge: 'Direct to broker' }
]

export default function ContactSection() {
  const router = useRouter()

  return (
    <section id="contact" className="py-16 bg-nn-grey-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-gilda font-normal text-nn-grey-dark mb-4">
            Start your intelligent mortgage analysis
          </h2>
          <p className="text-lg text-nn-grey-medium max-w-3xl mx-auto font-inter">
            Pick the journey that fits you. We’ll take you straight into the progressive form on /apply, where instant analysis and MAS-compliant insights are waiting.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {loanTypeOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => router.push(`/apply?loanType=${option.id}`)}
              className="border border-nn-grey-medium/40 bg-white px-6 py-8 text-left transition-all duration-200 hover:border-nn-gold hover:bg-nn-gold/10 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-nn-gold"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-xl font-semibold text-nn-grey-dark font-inter">
                  {option.label}
                </div>
                {option.badge && (
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wide bg-nn-gold/15 text-nn-grey-dark">
                    {option.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-nn-grey-medium font-inter">
                {option.caption}
              </p>
              <div className="mt-6 text-sm font-medium text-nn-gold font-inter">
                Continue →
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-nn-grey-medium text-center font-inter mt-6">
          The full multi-step form, instant calculations, and Chatwoot-tested broker handoff live on /apply. Selecting a journey takes you straight there.
        </p>
      </div>
    </section>
  )
}

