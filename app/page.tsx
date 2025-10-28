/**
 * Sophisticated Flow Page
 * Design System: Monochrome Minimalism
 *
 * Stack:
 * - Tailwind CSS for utilities
 * - shadcn/ui for components
 *
 * Colors: 90% Monochrome + 10% Yellow accent (#FCD34D)
 * Typography: Weights 300/400/600 only
 * Sharp rectangles: NO rounded corners
 * Animations: 200ms max
 */

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/public/images/logos/nn-logo-nobg-img.png'
import ContactSection from '@/components/landing/ContactSection'

type ViewState = 'landing' | 'loanTypeSelection'

// Icon components - 16px for buttons, following design principles
const ArrowRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const ChevronDown = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let startTime: number | undefined
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return (
    <span className="font-mono">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export default function Home() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewState>('landing')

  const navigateToLoanTypeSelection = () => {
    setCurrentView('loanTypeSelection')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    setCurrentView('landing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLoanTypeSelect = (loanType: 'new_purchase' | 'refinance' | 'commercial') => {
    // Route to production /apply with loan type
    router.push(`/apply?loanType=${loanType}`)
  }

  return (
    <>
      {/* Glass Morphism Navigation - Swiss Spa Design */}
      <nav className="fixed top-0 w-full h-20 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-50">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <button onClick={navigateToHome} className="flex items-center">
            <Image
              src={Logo}
              alt="NextNest"
              height={36}
              width={140}
              style={{ objectFit: 'contain' }}
              priority
            />
          </button>
          <div className="flex items-center gap-8">
            {currentView === 'landing' && (
              <>
                <a href="#services" className="text-sm font-normal text-[#666666] hover:text-[#000000] cursor-pointer hidden md:block transition-colors duration-200">Services</a>
                <a href="#insights" className="text-sm font-normal text-[#666666] hover:text-[#000000] cursor-pointer hidden md:block transition-colors duration-200">Insights</a>
              </>
            )}
            {currentView === 'loanTypeSelection' && (
              <button onClick={navigateToHome} className="text-sm font-normal text-[#666666] hover:text-[#000000] cursor-pointer transition-colors duration-200">
                Back to Home
              </button>
            )}
            <button
              onClick={navigateToLoanTypeSelection}
              className="h-12 px-8 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              Get Started
              <ArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* View Switcher with Transitions */}
      {currentView === 'landing' && (
        <>
          {/* Clean Hero Section - No Decorations */}
          <section className="py-8 md:py-16 lg:py-20 bg-gradient-to-b from-white to-[#F8F8F8]" style={{
            paddingTop: '96px',
            position: 'relative'
          }}>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="grid md:grid-cols-[1fr_420px] gap-12 items-center max-w-[1100px] mx-auto">
                {/* Left: Content */}
                <div>
                  {/* Remove badge entirely - cleaner, less yellow */}
                  <h1 className="text-5xl md:text-6xl font-light text-[#000000] leading-tight mb-4">
                    Evidence-based
                    <br />
                    mortgage advisory.
                  </h1>
                  <p className="text-2xl text-[#374151] mb-2 font-normal">
                    Built on real Singapore scenarios.
                  </p>
                  <p className="text-lg text-[#666666] mb-8 font-normal leading-relaxed">
                    We track 16 banks in real-time—
                    you get only what fits your situation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={navigateToLoanTypeSelection}
                      className="h-14 px-8 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Start Free Analysis
                      <ArrowRight />
                    </button>
                    <button className="h-14 px-8 border border-[#E5E5E5] text-[#666666] hover:bg-[#F8F8F8] hover:text-[#000000] transition-all duration-200 flex items-center justify-center gap-2">
                      View Demo
                    </button>
                  </div>
                </div>

                {/* Right: Clean Metric Card */}
                <div>
                  <div className="bg-white border border-[#E5E5E5] p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs text-[#666666] uppercase tracking-wider font-semibold">
                        LIVE ANALYSIS
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#10B981] text-white">
                        Real-time
                      </span>
                    </div>

                    <div className="grid gap-4">
                      {[
                        { label: 'Current Rate', value: 2.6, suffix: '%' },
                        { label: 'Optimal Rate', value: 1.4, suffix: '%', accent: true },
                        { label: 'Monthly Savings', value: 480, prefix: '$' }
                      ].map((metric, index) => (
                        <div key={index} className="p-4 bg-[#F8F8F8]">
                          <div className="text-xs text-[#666666] mb-2">{metric.label}</div>
                          <div className={`font-mono text-3xl font-semibold text-[#000000]`}>
                            <AnimatedCounter
                              end={metric.value}
                              prefix={metric.prefix}
                              suffix={metric.suffix}
                              duration={1000 + (index * 500)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>


                    <div className="text-center mt-8 pt-6 border-t border-[#E5E5E5]">
                      <div className="text-xs text-[#666666] mb-2">LIFETIME SAVINGS</div>
                      <div className="font-mono text-4xl font-semibold text-[#000000]">
                        $<AnimatedCounter end={34560} duration={2500} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* Trust Indicators - Clean Metrics */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {([
                  { value: 16, label: 'Banks Tracked', sublabel: '', isString: false, prefix: '', suffix: '' },
                  { value: 50, label: 'Real Scenarios', sublabel: '', isString: false, prefix: '', suffix: '+' },
                  { value: '24hr', label: 'Analysis Time', sublabel: '', isString: true, prefix: '', suffix: '' }
                ] as Array<{value: number | string; label: string; sublabel: string; isString: boolean; prefix: string; suffix: string}>).map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-1">
                      <span className="font-mono text-3xl font-semibold text-[#000000]">
                        {stat.isString ? stat.value : (
                          <>
                            {stat.prefix}<AnimatedCounter end={stat.value as number} duration={2000} />{stat.suffix}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#666666]">{stat.label}</div>
                    {stat.sublabel && <div className="text-xs text-[#666666]">{stat.sublabel}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Real Scenarios - Evidence-Based Proof */}
          <section className="py-16 bg-[#F8F8F8]">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-light text-[#000000] mb-2">
                    Real scenarios, real savings
                  </h2>
                  <p className="text-base text-[#666666]">
                    Built on 50+ actual Singapore cases. Here are three.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scenario 1: HDB Refinance */}
                  <div className="bg-white border border-[#E5E5E5] p-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
                      HDB 4-ROOM REFINANCE
                    </div>
                    <p className="text-sm text-[#666666] mb-4">
                      $650K remaining, 3.2% current rate
                    </p>
                    <div className="border-t border-[#E5E5E5] pt-4 mb-4">
                      <div className="text-sm text-[#666666] mb-1">Refinanced to 2.65% SORA</div>
                      <div className="font-mono text-xl font-semibold text-[#000000] mb-2">
                        $185<span className="text-base font-normal text-[#666666]">/month saved</span>
                      </div>
                      <div className="text-xs text-[#666666]">
                        Break-even: 14 months
                      </div>
                    </div>
                    <div className="text-xs text-[#666666]">
                      Validated Oct 2025
                    </div>
                  </div>

                  {/* Scenario 2: Private Condo New Purchase */}
                  <div className="bg-white border border-[#E5E5E5] p-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
                      PRIVATE CONDO NEW PURCHASE
                    </div>
                    <p className="text-sm text-[#666666] mb-4">
                      $1.2M loan, comparing 3.1% fixed vs SORA
                    </p>
                    <div className="border-t border-[#E5E5E5] pt-4 mb-4">
                      <div className="text-sm text-[#666666] mb-1">Chose 2-year fixed at 2.88%</div>
                      <div className="font-mono text-xl font-semibold text-[#000000] mb-2">
                        $264<span className="text-base font-normal text-[#666666]">/month saved</span>
                      </div>
                      <div className="text-xs text-[#666666]">
                        vs 3.1% SORA baseline
                      </div>
                    </div>
                    <div className="text-xs text-[#666666]">
                      Validated Sep 2025
                    </div>
                  </div>

                  {/* Scenario 3: EC Refinance with Cash-Out */}
                  <div className="bg-white border border-[#E5E5E5] p-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
                      EC REFINANCE + CASH-OUT
                    </div>
                    <p className="text-sm text-[#666666] mb-4">
                      $800K remaining, needed $100K for renovation
                    </p>
                    <div className="border-t border-[#E5E5E5] pt-4 mb-4">
                      <div className="text-sm text-[#666666] mb-1">Refinanced $900K at 2.75%</div>
                      <div className="font-mono text-xl font-semibold text-[#000000] mb-2">
                        $142<span className="text-base font-normal text-[#666666]">/month saved</span>
                      </div>
                      <div className="text-xs text-[#666666]">
                        vs previous 3.05% rate
                      </div>
                    </div>
                    <div className="text-xs text-[#666666]">
                      Validated Oct 2025
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works - Process Transparency */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-light text-[#000000] mb-2">
                    How it works
                  </h2>
                  <p className="text-base text-[#666666]">
                    Transparent process, clear expectations.
                  </p>
                </div>

                <div className="flex flex-col gap-8 items-center">
                  {/* Step 1 */}
                  <div className="flex gap-4 w-full max-w-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-2">
                        Share your scenario
                      </h3>
                      <p className="text-sm text-[#666666] mb-2">
                        Tell us about your property, income, and mortgage needs. Takes 5 minutes.
                      </p>
                      <p className="text-xs text-[#666666]">
                        Your data stays private. PDPA-compliant.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 w-full max-w-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-2">
                        We analyze 16 banks
                      </h3>
                      <p className="text-sm text-[#666666] mb-2">
                        Real-time rate comparison across all property types and loan structures.
                      </p>
                      <p className="text-xs text-[#666666]">
                        Analysis completes within 24 hours.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 w-full max-w-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-2">
                        Get your options
                      </h3>
                      <p className="text-sm text-[#666666] mb-2">
                        Clear comparison: stay with current package or refinance. No jargon.
                      </p>
                      <p className="text-xs text-[#666666]">
                        All calculations shown transparently.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4 w-full max-w-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-mono font-semibold text-lg">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-2">
                        We handle the process
                      </h3>
                      <p className="text-sm text-[#666666] mb-2">
                        Bank submissions, documentation, approval tracking. You stay informed.
                      </p>
                      <p className="text-xs text-[#666666]">
                        Typical timeline: 4-6 weeks to completion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Bridge - Reinforcement Before Conversion */}
          <section className="py-12 bg-[#000000]">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-2xl font-light text-white mb-3">
                Built on 50+ real Singapore scenarios
              </h2>
              <p className="text-base text-[#CCCCCC] mb-0">
                Evidence-based methodology. Transparent calculations. Choose your scenario below to get started.
              </p>
            </div>
          </section>

          {/* Progressive Form Contact Section */}
          <ContactSection />
        </>
      )}

      {/* Loan Type Selection View */}
      {currentView === 'loanTypeSelection' && (
        <div className="min-h-screen bg-gradient-to-b from-white to-[#F8F8F8] pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#FCD34D]/10 text-[#000000] mb-4">
                Step 1 of 4
              </div>
              <h1 className="text-4xl md:text-5xl font-light text-[#000000] mb-4">
                What&apos;s your <span className="font-semibold">mortgage goal</span>?
              </h1>
              <p className="text-lg text-[#666666]">
                Choose your path and we&apos;ll analyze 16 banks in real-time
              </p>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              {[
                {
                  type: 'new_purchase' as const,
                  title: 'New Purchase',
                  description: 'First home or investment property',
                  badge: 'Most Popular',
                  badgeColor: 'bg-[#10B981] text-white'
                },
                {
                  type: 'refinance' as const,
                  title: 'Refinancing',
                  description: 'Optimize your existing mortgage',
                  badge: 'Most Popular',
                  badgeColor: 'bg-[#FCD34D] text-[#000000]'
                },
                {
                  type: 'commercial' as const,
                  title: 'Commercial',
                  description: 'Business property financing',
                  badge: 'Expert Support',
                  badgeColor: 'bg-[#666666] text-white'
                }
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleLoanTypeSelect(option.type)}
                  className="bg-white border border-[#E5E5E5] p-8 text-left transition-all duration-200 hover:shadow-lg hover:border-[#FCD34D] group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-[#000000] mb-2 group-hover:text-[#000000]">
                        {option.title}
                      </h3>
                      <p className="text-base text-[#666666] mb-4">{option.description}</p>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider ${option.badgeColor}`}>
                        {option.badge}
                      </span>
                    </div>
                    <ArrowRight />
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-[#666666]">
                Not sure? Our AI will help you choose the best option during your consultation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Minimal Professional */}
      {currentView === 'landing' && (
        <footer className="py-12 bg-white border-t border-[#E5E5E5]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

              {/* Column 1: Tagline + Copyright */}
              <div className="md:col-span-2">
                <p className="text-sm text-[#666666] mb-4">
                  Evidence-based mortgage advisory service
                </p>
                <p className="text-xs text-[#666666]">
                  © 2025 NextNest. All rights reserved.
                </p>
              </div>

              {/* Column 2: Legal */}
              <div>
                <h3 className="text-sm font-semibold text-[#000000] mb-3">
                  Legal
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/pdpa" className="text-sm text-[#666666] hover:text-[#000000]">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/pdpa" className="text-sm text-[#666666] hover:text-[#000000]">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Contact */}
              <div>
                <h3 className="text-sm font-semibold text-[#000000] mb-3">
                  Contact
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="mailto:hello@nextnest.sg"
                      className="text-sm text-[#666666] hover:text-[#000000]"
                    >
                      hello@nextnest.sg
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  )
}
