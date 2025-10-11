'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Logo from '@/assets/nn-logo-nobg-img.png'

// Minimal icon components
const ChevronDown = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

const ArrowRight = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const CheckIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
)

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | undefined
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      setCount(Math.floor(progress * end))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return (
    <span className="counter mono">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export default function SophisticatedHomepage() {
  const [activeTab, setActiveTab] = useState('savings')
  const [hoveredCard, setHoveredCard] = useState(null)

  return (
    <>
      {/* Navigation with Glass Effect */}
      <nav className="nav glass" style={{ borderBottom: 'none' }}>
        <div className="container nav-container">
          <a href="/">
            <Image
              src={Logo}
              alt="NextNest"
              height={32}
              width={120}
              style={{ objectFit: 'contain' }}
              priority
            />
          </a>
          <div className="nav-links">
            <a href="#services" className="nav-link hidden-mobile">Services</a>
            <a href="#contact" className="nav-link hidden-mobile">Contact</a>
            <a href="#" className="btn-pill btn-primary">
              Get Started
              <ArrowRight />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section with Sophisticated Elements */}
      <section className="section-xl grid-pattern" style={{ paddingTop: '192px', position: 'relative' }}>
        <div className="container">
          <div className="hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: 'var(--space-3xl)',
            alignItems: 'center',
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            {/* Left: Content with Gradient Text */}
            <div>
              <div className="badge badge-info mb-md reveal">
                AI-Powered Analysis
              </div>
              <h1 className="font-display heading-7xl mb-md reveal reveal-delay-1">
                <span className="gradient-text">Mortgage</span>{' '}
                <span className="text-black">Intelligence</span>
              </h1>
              <p className="text-xl text-stone mb-xl reveal reveal-delay-2">
                Real-time analysis of <span className="mono font-semibold">286</span> packages.
                Mathematical precision meets complete transparency.
              </p>
              <div className="flex gap-md reveal reveal-delay-3">
                <button className="btn-pill btn-primary glow-box">
                  Start Analysis
                </button>
                <button className="btn-pill btn-secondary">
                  View Demo
                </button>
              </div>
            </div>

            {/* Right: Sophisticated Mortgage Card */}
            <div className="reveal reveal-delay-2">
              <div className="data-card card-elevated floating-tilt" style={{
                padding: 'var(--space-lg)',
                background: 'white',
                cursor: 'default'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation = 'none';
                  e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = '';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div className="flex justify-between items-center mb-lg">
                  <h3 className="text-sm text-stone" style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '500'
                  }}>
                    Live Analysis
                  </h3>
                  <span className="badge badge-success">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-xs animate-pulse"></span>
                    Real-time
                  </span>
                </div>

                {/* Animated Metrics */}
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  <div className="hover-lift" style={{
                    padding: 'var(--space-sm)',
                    background: 'var(--color-cloud)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <div className="text-xs text-stone mb-xs">Current Rate</div>
                    <div className="heading-3xl mono">
                      <AnimatedCounter end={2.6} suffix="%" duration={1000} />
                    </div>
                  </div>

                  <div className="hover-lift" style={{
                    padding: 'var(--space-sm)',
                    background: 'var(--color-cloud)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <div className="text-xs text-stone mb-xs">Optimal Rate</div>
                    <div className="heading-3xl mono gradient-text-accent">
                      <AnimatedCounter end={1.4} suffix="%" duration={1500} />
                    </div>
                  </div>

                  <div className="hover-lift" style={{
                    padding: 'var(--space-sm)',
                    background: 'var(--color-cloud)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <div className="text-xs text-stone mb-xs">Monthly Savings</div>
                    <div className="heading-3xl mono">
                      $<AnimatedCounter end={480} duration={2000} />
                    </div>
                  </div>
                </div>

                <div className="divider-gradient"></div>

                {/* Total Savings with Glow */}
                <div className="text-center">
                  <div className="text-xs text-stone mb-xs">Lifetime Savings</div>
                  <div className="heading-4xl font-display gradient-text-accent glow-text">
                    $<AnimatedCounter end={34560} duration={2500} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <ChevronDown />
        </div>
      </section>

      {/* Trust Indicators - Clean & Sophisticated */}
      <section className="section" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
        <div className="container">
          <div className="grid grid-cols-3 gap-2xl">
            {[
              {
                value: 286,
                label: 'Packages',
                sublabel: 'Analyzed Daily',
                prefix: ''
              },
              {
                value: 34560,
                label: 'Average Savings',
                sublabel: 'Per Customer',
                prefix: '$'
              },
              {
                value: 24,
                label: 'Hour Response',
                sublabel: 'Guaranteed',
                suffix: ''
              }
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-sm">
                  <span className="heading-6xl font-display gradient-text-accent">
                    {stat.prefix}<AnimatedCounter
                      end={stat.value}
                      duration={2000}
                    />{stat.suffix}
                  </span>
                </div>
                <div className="text-sm font-semibold text-graphite">
                  {stat.label}
                </div>
                <div className="text-xs text-stone">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sophisticated Feature Section - Botpress Style */}
      <section className="section bg-cloud">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-2xl">
              <h2 className="font-display heading-4xl mb-sm">
                Why <span className="gradient-text">Intelligence</span> Matters
              </h2>
              <p className="text-stone">
                Our AI analyzes market conditions 24/7 to find your perfect moment
              </p>
            </div>

            {/* Clean Feature Cards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-xl)' }}>
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
                  className="hover-lift reveal"
                  style={{
                    padding: 'var(--space-lg)',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid var(--color-mist)',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="flex justify-between items-start mb-md">
                    <div>
                      <h3 className="heading-2xl font-body font-semibold text-graphite mb-xs">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-stone">
                        {feature.description}
                      </p>
                    </div>
                    <div className="text-right" style={{ minWidth: '60px' }}>
                      <div className="text-xl font-semibold mono text-accent">
                        {feature.metric}
                      </div>
                      <div className="text-xs text-stone">
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

      {/* Services with Tabs */}
      <section className="section-lg">
        <div className="container">
          <h2 className="font-display heading-5xl text-center mb-md">
            <span className="gradient-text">Intelligent</span> Solutions
          </h2>
          <p className="text-center text-stone mb-2xl">
            Choose how we can help optimize your mortgage
          </p>

          {/* Tab Navigation */}
          <div className="tabs justify-center mb-xl">
            {['savings', 'analysis', 'timeline'].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-3xl mx-auto">
            {activeTab === 'savings' && (
              <div className="data-card reveal">
                <h3 className="heading-3xl font-body mb-md">Maximum Savings Strategy</h3>
                <p className="text-stone mb-lg">
                  Our AI analyzes all 286 packages to find your optimal rate,
                  considering repricing penalties, lock-in periods, and long-term costs.
                </p>
                <div className="flex items-center gap-md">
                  <div className="badge badge-success">Save up to 40%</div>
                  <div className="badge badge-info">Real-time rates</div>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="data-card reveal">
                <h3 className="heading-3xl font-body mb-md">Complete Market Analysis</h3>
                <p className="text-stone mb-lg">
                  Get a comprehensive view of every option available, including
                  staying with your current bank, repricing, or refinancing.
                </p>
                <div className="flex items-center gap-md">
                  <div className="badge badge-info">286 packages</div>
                  <div className="badge badge-warning">Updated daily</div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="data-card reveal">
                <h3 className="heading-3xl font-body mb-md">Perfect Timing Optimization</h3>
                <p className="text-stone mb-lg">
                  Know exactly when to make your move based on lock-in periods,
                  market conditions, and rate predictions.
                </p>
                <div className="flex items-center gap-md">
                  <div className="badge badge-success">24h response</div>
                  <div className="badge badge-info">AI predictions</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient Background */}
      <section className="section-lg" style={{
        background: 'linear-gradient(135deg, var(--color-cloud) 0%, white 100%)'
      }}>
        <div className="container container-narrow text-center">
          <h2 className="font-display heading-5xl mb-md">
            Ready to <span className="gradient-text-accent">optimize</span>?
          </h2>
          <p className="text-stone mb-xl">
            Join thousands who&apos;ve saved with intelligent mortgage analysis
          </p>
          <button className="btn-pill btn-primary glow-box">
            Get Your Free Analysis
            <ArrowRight />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="section glass-dark">
        <div className="container">
          <div className="flex justify-between items-center">
            <div className="text-sm text-stone">
              © 2024 NextNest. Singapore&apos;s most transparent mortgage advisor.
            </div>
            <div className="flex gap-lg">
              <a href="#" className="text-sm text-stone hover:text-accent" style={{ textDecoration: 'none' }}>
                Privacy
              </a>
              <a href="#" className="text-sm text-stone hover:text-accent" style={{ textDecoration: 'none' }}>
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}