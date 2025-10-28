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
  const [activeTab, setActiveTab] = useState('savings')

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
                          <div className={`font-mono text-3xl font-semibold ${metric.accent ? 'text-[#000000] border-b-2 border-[#FCD34D] inline-block' : 'text-[#000000]'}`}>
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
                {[
                  { value: 16, label: 'Banks', sublabel: 'Tracked Real-Time' },
                  { value: 34560, label: 'Average Savings', sublabel: 'Per Customer', prefix: '$' },
                  { value: 24, label: 'Hour Response', sublabel: 'Guaranteed' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-1">
                      <span className="font-mono text-3xl font-semibold text-[#000000]">
                        {stat.prefix}<AnimatedCounter end={stat.value} duration={2000} />
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#666666]">{stat.label}</div>
                    <div className="text-xs text-[#666666]">{stat.sublabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Clean Feature Section - Swiss Spa Style */}
          <section className="py-16 bg-[#F8F8F8]">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-light text-[#000000] mb-2">
                    Why Intelligence Matters
                  </h2>
                  <p className="text-base text-[#666666]">
                    Our AI analyzes market conditions 24/7 to find your perfect moment
                  </p>
                </div>

                {/* Clean Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Real-Time Analysis',
                      description: 'We track 16 banks and update rates throughout the day',
                      metric: '16',
                      metricLabel: 'Banks'
                    },
                    {
                      title: 'Complete Transparency',
                      description: 'See all options including staying with your current bank',
                      metric: '100%',
                      metricLabel: 'Coverage'
                    },
                    {
                      title: 'AI-Powered Insights',
                      description: 'GPT-4 analyzes your unique situation for optimal timing',
                      metric: '<3s',
                      metricLabel: 'Processing'
                    },
                    {
                      title: 'Lifetime Partnership',
                      description: 'Continuous monitoring and optimization throughout your loan',
                      metric: '4.9/5',
                      metricLabel: 'Rating'
                    }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="bg-white border border-[#E5E5E5] p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-[#000000] mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-[#666666]">
                            {feature.description}
                          </p>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className="font-mono text-lg font-semibold text-[#000000]">
                            {feature.metric}
                          </div>
                          <div className="text-xs text-[#666666]">
                            {feature.metricLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Services with Tabs - Clean Design */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <h2 className="text-2xl font-light text-[#000000] text-center mb-2">
                Intelligent Solutions
              </h2>
              <p className="text-base text-[#666666] text-center mb-12">
                Choose how we can help optimize your mortgage
              </p>

              {/* Tab Navigation */}
              <div className="flex justify-center gap-2 mb-8">
                {['savings', 'analysis', 'timeline'].map((tab) => (
                  <button
                    key={tab}
                    className={`h-12 px-6 text-sm font-semibold flex items-center transition-all duration-200 ${activeTab === tab ? 'bg-[#000000] text-white' : 'bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="max-w-3xl mx-auto">
                {activeTab === 'savings' && (
                  <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-xl font-semibold text-[#000000] mb-2">Maximum Savings Strategy</h3>
                    <p className="text-base text-[#666666] mb-6">
                      We analyze 16 banks to find your optimal rate,
                      considering repricing penalties, lock-in periods, and long-term costs.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">Comparison included</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">Real-time rates</div>
                    </div>
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-xl font-semibold text-[#000000] mb-2">Complete Market Analysis</h3>
                    <p className="text-[#666666] mb-6">
                      Get a comprehensive view of every option available, including
                      staying with your current bank, repricing, or refinancing.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">16 banks</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#FCD34D]/10 text-[#000000]">Updated daily</div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-xl font-semibold text-[#000000] mb-2">Perfect Timing Optimization</h3>
                    <p className="text-[#666666] mb-6">
                      Know exactly when to make your move based on lock-in periods,
                      market conditions, and rate predictions.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#10B981] text-white">24h response</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#F8F8F8] text-[#666666]">AI predictions</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CTA Section - Clean Call to Action */}
          <section className="py-16 bg-white border-t border-[#E5E5E5]">
            <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
              <h2 className="text-2xl font-light text-[#000000] mb-2">
                Ready to optimize?
              </h2>
              <p className="text-base text-[#666666] mb-8">
                Join thousands who&apos;ve saved with intelligent mortgage analysis
              </p>
              <button onClick={navigateToLoanTypeSelection} className="h-14 px-8 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 mx-auto">
                Get Your Free Analysis
                <ArrowRight />
              </button>
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
                  badge: 'Save $34K avg',
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

      {/* Footer - Minimal Swiss Spa Style */}
      {currentView === 'landing' && (
        <footer className="bg-white border-t border-[#E5E5E5] py-6">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-center">
              <div className="text-sm text-[#666666]">
                © 2024 NextNest. Singapore&apos;s most transparent mortgage advisor.
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-sm font-semibold text-[#666666] hover:text-[#000000] cursor-pointer transition-colors duration-200">
                  Privacy
                </a>
                <a href="#" className="text-sm font-semibold text-[#666666] hover:text-[#000000] cursor-pointer transition-colors duration-200">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  )
}
