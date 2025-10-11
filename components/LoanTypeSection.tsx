'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoanTypeOption {
  id: string
  title: string
  description: string
  displayValue: string
  metricLabel: string
}

const loanTypes: LoanTypeOption[] = [
  {
    id: 'new_purchase',
    title: 'New Purchase',
    description: 'First-time or upgrading',
    displayValue: '1.35%',
    metricLabel: 'From'
  },
  {
    id: 'refinance',
    title: 'Refinancing',
    description: 'Switch to better rates',
    displayValue: '$480',
    metricLabel: 'Save/month'
  },
  {
    id: 'commercial',
    title: 'Commercial',
    description: 'Business properties',
    displayValue: '2.1%',
    metricLabel: 'From'
  }
]

export default function LoanTypeSection() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSelect = (type: string) => {
    console.log('🔄 LoanType selected:', type)
    setSelectedType(type)
    setIsLoading(true)

    // Navigate immediately without delay for better UX
    const targetUrl = `/apply?loanType=${type}`
    console.log('📍 Navigating to:', targetUrl)

    // Use router.push directly without setTimeout
    router.push(targetUrl)
  }

  return (
    <section className="py-12 md:py-16 bg-white border-t border-fog relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-gold motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-ink font-medium">Loading application form...</p>
            <p className="mt-1 text-sm text-silver">Please wait a moment</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl font-light text-ink mb-2">
            What brings you here today?
          </h2>
          <p className="text-sm sm:text-base text-graphite mb-4">
            Choose your path for personalized analysis
          </p>
          <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-gold/10 text-gold">
            Select one option below
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
          {loanTypes.map((type) => {
            const isSelected = selectedType === type.id

            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type.id)}
                disabled={isLoading}
                className={`
                  relative p-5 md:p-6 bg-white border transition-all duration-200
                  ${isSelected
                    ? 'border-gold bg-gold/5 shadow-md scale-[1.02]'
                    : 'border-fog hover:border-gold/50 hover:shadow-sm hover:-translate-y-0.5'
                  }
                  ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
              >
                <div className="space-y-3 mb-4">
                  <h3 className="text-lg font-medium text-ink">
                    {type.title}
                  </h3>
                  <p className="text-sm text-graphite">
                    {type.description}
                  </p>
                  <div>
                    <span className="block font-mono text-xl md:text-2xl font-medium text-gold leading-none tracking-tight">
                      {type.displayValue}
                    </span>
                    <span className="text-xs text-silver uppercase tracking-wide leading-tight">
                      {type.metricLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-mist pt-4 md:border-none md:mt-0 md:pt-0">
                  <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-center">
                    {isSelected ? (
                      <>
                        <span className="inline-flex h-2 w-2 rounded-full bg-gold" aria-hidden="true"></span>
                        <span className="font-medium text-gold">Selected</span>
                      </>
                    ) : (
                      <span className="text-silver md:hidden">Tap to select</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-silver">
            Already know what you need?{' '}
            <a
              href="/apply?loanType=new_purchase"
              className="text-charcoal hover:text-gold transition-colors duration-200 font-medium"
            >
              Skip to application &gt;&gt;
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}





