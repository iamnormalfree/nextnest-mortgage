/**
 * Sophisticated Flow Page
 * Design System: Bloomberg Terminal × Spotify × Swiss Spa
 *
 * Stack:
 * - Tailwind CSS for utilities
 * - shadcn/ui for components
 * - bloomberg-critical.css for special effects
 *
 * Colors: 95% monochrome + 5% gold (#FCD34D)
 * Spacing: 8px grid system
 * Animations: 200ms max
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Logo from '@/assets/nn-logo-nobg-img.png'

// Dynamic imports for better performance
const SophisticatedProgressiveForm = dynamic(
  () => import('@/redesign/SophisticatedProgressiveForm'),
  { ssr: false }
)

const SophisticatedAIBrokerUI = dynamic(
  () => import('@/redesign/SophisticatedAIBrokerUI'),
  { ssr: false }
)

type ViewState = 'landing' | 'form' | 'broker'

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

export default function SophisticatedFlowPage() {
  const [currentView, setCurrentView] = useState<ViewState>('landing')
  const [activeTab, setActiveTab] = useState('savings')
  const [selectedLoanType, setSelectedLoanType] = useState<'new' | 'refinance' | 'commercial'>('new')
  const [sessionId] = useState(`session-${Date.now()}`)

  const navigateToForm = () => {
    setCurrentView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToBroker = () => {
    setCurrentView('broker')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    setCurrentView('landing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Bloomberg Terminal Navigation - Clean & Minimal */}
      <nav className="fixed top-0 w-full h-12 bg-white border-b border-fog z-50">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <button onClick={navigateToHome} className="flex items-center">
            <Image
              src={Logo}
              alt="NextNest"
              height={32}
              width={120}
              style={{ objectFit: 'contain' }}
              priority
            />
          </button>
          <div className="flex items-center gap-6">
            {currentView === 'landing' && (
              <>
                <a href="#services" className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer hidden md:block">Services</a>
                <a href="#insights" className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer hidden md:block">Insights</a>
              </>
            )}
            {currentView === 'form' && (
              <button onClick={navigateToHome} className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer">
                Back to Home
              </button>
            )}
            {currentView === 'broker' && (
              <button onClick={navigateToForm} className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer">
                Back to Form
              </button>
            )}
            <button onClick={navigateToForm} className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
              {currentView === 'landing' ? 'Get Started' :
               currentView === 'form' ? 'Continue' :
               'Dashboard'}
              <ArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* View Switcher with Transitions */}
      {currentView === 'landing' && (
        <>
          {/* Clean Hero Section - No Decorations */}
          <section className="py-8 md:py-16 lg:py-20 bg-hero-gradient" style={{
            paddingTop: '64px',
            position: 'relative'
          }}>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="grid md:grid-cols-[1fr_420px] gap-12 items-center max-w-[1100px] mx-auto">
                {/* Left: Content */}
                <div>
                  <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-gold/10 text-gold mb-2">
                    AI-POWERED INTELLIGENCE
                  </div>
                  <h1 className="text-4xl md:text-5xl font-light text-ink leading-tight mb-2">
                    Singapore&apos;s Smartest
                    <br />
                    Mortgage Platform
                  </h1>
                  <p className="text-lg text-charcoal mb-6">
                    Real-time analysis of <span className="font-mono font-medium">286</span> packages.
                    Complete transparency. Mathematical precision.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={navigateToForm} className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                      Start Free Analysis
                      <ArrowRight />
                    </button>
                    <button className="h-12 px-8 border border-fog text-charcoal hover:bg-mist flex items-center gap-2">
                      View Demo
                    </button>
                  </div>
                </div>

                {/* Right: Clean Metric Card */}
                <div>
                  <div className="bg-white border border-fog p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs text-silver uppercase tracking-wider font-medium">
                        LIVE ANALYSIS
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">
                        Real-time
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {[
                        { label: 'Current Rate', value: 2.6, suffix: '%' },
                        { label: 'Optimal Rate', value: 1.4, suffix: '%', accent: true },
                        { label: 'Monthly Savings', value: 480, prefix: '$' }
                      ].map((metric, index) => (
                        <div key={index} className="p-2 bg-mist">
                          <div className="text-xs text-silver mb-1">{metric.label}</div>
                          <div className={`font-mono text-2xl font-medium ${metric.accent ? 'text-gold' : 'text-ink'}`}>
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


                    <div className="text-center mt-6">
                      <div className="text-xs text-silver mb-1">LIFETIME SAVINGS</div>
                      <div className="font-mono text-3xl font-medium text-gradient-gold">
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
                  { value: 286, label: 'Packages', sublabel: 'Analyzed Daily' },
                  { value: 34560, label: 'Average Savings', sublabel: 'Per Customer', prefix: '$' },
                  { value: 24, label: 'Hour Response', sublabel: 'Guaranteed' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-1">
                      <span className="font-mono text-3xl font-medium text-gradient-gold">
                        {stat.prefix}<AnimatedCounter end={stat.value} duration={2000} />
                      </span>
                    </div>
                    <div className="text-sm font-medium text-graphite">{stat.label}</div>
                    <div className="text-xs text-silver">{stat.sublabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Clean Feature Section - Bloomberg Style */}
          <section className="py-16 bg-mist">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-light text-ink mb-2">
                    Why Intelligence Matters
                  </h2>
                  <p className="text-base text-graphite">
                    Our AI analyzes market conditions 24/7 to find your perfect moment
                  </p>
                </div>

                {/* Clean Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Real-time Analysis',
                      description: 'Market data updated every 15 minutes from 23 banks',
                      metric: '99.9%',
                      metricLabel: 'Accuracy'
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
                      className="bg-white border border-fog p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-ink mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-graphite">
                            {feature.description}
                          </p>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className="font-mono text-lg font-medium text-gold">
                            {feature.metric}
                          </div>
                          <div className="text-xs text-silver">
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
              <h2 className="text-2xl font-light text-ink text-center mb-2">
                Intelligent Solutions
              </h2>
              <p className="text-base text-graphite text-center mb-12">
                Choose how we can help optimize your mortgage
              </p>

              {/* Tab Navigation */}
              <div className="flex justify-center gap-2 mb-8">
                {['savings', 'analysis', 'timeline'].map((tab) => (
                  <button
                    key={tab}
                    className={`h-12 px-6 text-sm font-medium flex items-center ${activeTab === tab ? 'bg-gold text-ink' : 'bg-white text-charcoal border border-fog hover:bg-mist'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="max-w-3xl mx-auto">
                {activeTab === 'savings' && (
                  <div className="bg-white border border-fog p-6">
                    <h3 className="text-xl font-medium text-ink mb-2">Maximum Savings Strategy</h3>
                    <p className="text-base text-graphite mb-6">
                      Our AI analyzes all 286 packages to find your optimal rate,
                      considering repricing penalties, lock-in periods, and long-term costs.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">Save up to 40%</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite">Real-time rates</div>
                    </div>
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="bg-white border border-fog p-6">
                    <h3 className="text-xl font-medium text-ink mb-2">Complete Market Analysis</h3>
                    <p className="text-graphite mb-6">
                      Get a comprehensive view of every option available, including
                      staying with your current bank, repricing, or refinancing.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite">286 packages</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-gold/10 text-gold">Updated daily</div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="bg-white border border-fog p-6">
                    <h3 className="text-xl font-medium text-ink mb-2">Perfect Timing Optimization</h3>
                    <p className="text-graphite mb-6">
                      Know exactly when to make your move based on lock-in periods,
                      market conditions, and rate predictions.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">24h response</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite">AI predictions</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CTA Section - Clean Call to Action */}
          <section className="py-16 bg-white border-t border-fog">
            <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
              <h2 className="text-2xl font-light text-ink mb-2">
                Ready to optimize?
              </h2>
              <p className="text-base text-graphite mb-8">
                Join thousands who&apos;ve saved with intelligent mortgage analysis
              </p>
              <button onClick={navigateToForm} className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                Get Your Free Analysis
                <ArrowRight />
              </button>
            </div>
          </section>
        </>
      )}

      {/* Progressive Form View */}
      {currentView === 'form' && (
        <div className="pt-32">
          <SophisticatedProgressiveForm
            loanType={selectedLoanType}
            sessionId={sessionId}
          />
          <div className="text-center py-8">
            <button
              onClick={navigateToBroker}
              className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              style={{ margin: '0 auto', display: 'inline-flex' }}
            >
              Continue to AI Advisor
              <ArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* AI Broker View */}
      {currentView === 'broker' && (
        <div className="pt-20">
          <SophisticatedAIBrokerUI />
        </div>
      )}

      {/* Footer - Minimal Bloomberg Style */}
      {currentView === 'landing' && (
        <footer className="bg-white border-t border-fog py-6">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-center">
              <div className="text-sm text-graphite">
                © 2024 NextNest. Singapore&apos;s most transparent mortgage advisor.
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer">
                  Privacy
                </a>
                <a href="#" className="text-sm font-medium text-charcoal hover:text-gold cursor-pointer">
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