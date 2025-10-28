// ABOUTME: Homepage loan selector section - primary conversion point
// ABOUTME: Routes users directly to /apply workflow after choosing loan type

'use client'

import Link from 'next/link'
import type { LoanType } from '@/components/forms/SimpleLoanTypeSelector'

const loanTypeOptions: Array<{ id: LoanType; label: string; caption: string; badge?: string; badgeStyle: string }> = [
  { id: 'new_purchase', label: 'New Purchase', caption: 'First home or upgrading', badge: 'MOST POPULAR', badgeStyle: 'bg-[#F8F8F8] text-[#666666] border border-[#E5E5E5]' },
  { id: 'refinance', label: 'Refinancing', caption: 'Lower existing payments', badge: 'SAVE AVG $34K', badgeStyle: 'bg-[#FCD34D] text-[#000000]' },
  { id: 'commercial', label: 'Commercial', caption: 'Business property financing', badge: 'DIRECT TO BROKER', badgeStyle: 'bg-[#F8F8F8] text-[#666666] border border-[#E5E5E5]' }
]

export default function ContactSection() {
  return (
    <section id="loan-selector" className="py-16 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-[#000000] mb-2">
            Choose your scenario
          </h2>
          <p className="text-base text-[#666666]">
            Select your situation to see available packages
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loanTypeOptions.map(option => (
            <Link
              key={option.id}
              href={`/apply?loanType=${option.id}`}
              className="bg-white border border-[#E5E5E5] p-6 hover:border-[#000000] transition-colors block"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#000000]">{option.label}</h3>
                {option.badge && (
                  <span className={`px-2 py-1 text-xs font-semibold ${option.badgeStyle}`}>
                    {option.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#666666] mb-6">
                {option.caption}
              </p>
              <span className="text-[#000000] font-semibold hover:text-[#666666]">
                Continue →
              </span>
            </Link>
          ))}
        </div>

        <p className="text-xs text-[#666666] text-center mt-8">
          Takes 5 minutes. Your data stays private per PDPA.
        </p>
      </div>
    </section>
  )
}
