'use client'

import React from 'react'
import Image from 'next/image'
import Logo from '@/assets/nn-logo-nobg-img.png'

// Minimal icon components
const ChevronRight = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

const CheckIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const ShieldIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
)

export default function RedesignHomepage() {
  return (
    <>
      {/* Navigation - Ultra Minimal */}
      <nav className="nav">
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
            <a href="#" className="nav-link nav-cta">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section - With Minimal Card */}
      <section className="section-xl" style={{ paddingTop: '192px' }}>
        <div className="container">
          <div className="hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: 'var(--space-3xl)',
            alignItems: 'center',
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            {/* Left: Content */}
            <div>
              <h1 className="font-display heading-7xl text-black mb-md">
                Mortgage Intelligence
              </h1>
              <p className="text-xl text-stone mb-xl">
                AI analysis of 286 packages. Mathematical precision meets complete transparency.
              </p>
              <a href="#contact" className="btn btn-primary">
                See Your Options
              </a>
            </div>

            {/* Right: Minimal Mortgage Card */}
            <div>
              <div className="card-elevated mortgage-card-tilt" style={{
                padding: 'var(--space-lg)',
                background: 'white'
              }}>
                <h3 className="text-sm text-stone mb-lg" style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500'
                }}>
                  Your Mortgage Overview
                </h3>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: 'var(--space-sm)',
                    borderBottom: '1px solid var(--color-mist)'
                  }}>
                    <span className="text-sm text-stone">Current rate</span>
                    <span className="font-semibold text-graphite">2.6%</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: 'var(--space-sm)',
                    borderBottom: '1px solid var(--color-mist)'
                  }}>
                    <span className="text-sm text-stone">Optimal rate</span>
                    <span className="font-semibold text-accent">1.4%</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: 'var(--space-sm)',
                    borderBottom: '1px solid var(--color-mist)'
                  }}>
                    <span className="text-sm text-stone">Monthly savings</span>
                    <span className="font-semibold text-graphite">$480</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: 'var(--space-sm)',
                    borderBottom: '1px solid var(--color-mist)'
                  }}>
                    <span className="text-sm text-stone">Lock-in period</span>
                    <span className="font-semibold text-graphite">2 years</span>
                  </div>
                </div>

                {/* Total Savings - Emphasized */}
                <div style={{
                  marginTop: 'var(--space-lg)',
                  padding: 'var(--space-md)',
                  background: 'var(--color-cloud)',
                  borderLeft: '2px solid var(--color-accent)'
                }}>
                  <div className="text-xs text-stone mb-xs">Total savings over loan</div>
                  <div className="heading-3xl font-display text-black">$34,560</div>
                </div>

                {/* Subtle Progress Dots */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-xs)',
                  justifyContent: 'center',
                  marginTop: 'var(--space-md)'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-mist)'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-accent)'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-mist)'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Subtle */}
      <section className="section bg-cloud">
        <div className="container">
          <div className="grid grid-cols-3 text-center">
            <div>
              <div className="heading-4xl font-display text-black">286</div>
              <div className="text-sm text-stone mt-sm">Packages Analyzed</div>
            </div>
            <div>
              <div className="heading-4xl font-display text-black">$34K</div>
              <div className="text-sm text-stone mt-sm">Average Savings</div>
            </div>
            <div>
              <div className="heading-4xl font-display text-black">24h</div>
              <div className="text-sm text-stone mt-sm">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Clean Grid */}
      <section id="services" className="section-lg">
        <div className="container">
          <h2 className="font-display heading-5xl text-black text-center mb-2xl">
            Transparent Intelligence
          </h2>

          <div className="grid grid-cols-3 gap-2xl">
            <div className="text-center">
              <div className="flex justify-center mb-md">
                <CheckIcon />
              </div>
              <h3 className="heading-2xl font-body font-semibold text-graphite mb-sm">
                Complete Transparency
              </h3>
              <p className="text-stone">
                All options shown including repricing and staying put.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-md">
                <ShieldIcon />
              </div>
              <h3 className="heading-2xl font-body font-semibold text-graphite mb-sm">
                AI Analysis
              </h3>
              <p className="text-stone">
                Mathematical precision across all 286 market packages.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-md">
                <TrendingUpIcon />
              </div>
              <h3 className="heading-2xl font-body font-semibold text-graphite mb-sm">
                Lifetime Partner
              </h3>
              <p className="text-stone">
                Continuous optimization throughout your mortgage journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Visualization - Minimal */}
      <section className="section bg-cloud">
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3xl)' }}>
            <div className="flex flex-col justify-center">
              <h2 className="font-display heading-5xl text-black mb-md">
                Bank-Agnostic Advice
              </h2>
              <p className="text-stone mb-lg">
                Our engine models repricing, refinancing, or staying put—then ranks what maximizes your savings.
              </p>
              <a href="#contact" className="btn-text flex items-center gap-sm" style={{ width: 'fit-content' }}>
                See all options <ChevronRight />
              </a>
            </div>

            <div className="card-elevated p-xl">
              <div className="mb-lg">
                <div className="text-sm text-stone mb-xs">Current Rate</div>
                <div className="heading-3xl font-display text-black">2.6%</div>
              </div>
              <div className="mb-lg">
                <div className="text-sm text-stone mb-xs">Optimal Rate</div>
                <div className="heading-3xl font-display text-accent">1.4%</div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-mist)', paddingTop: 'var(--space-md)' }}>
                <div className="text-sm text-stone mb-xs">Lifetime Savings</div>
                <div className="heading-3xl font-display text-black">$34,560</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form - Elegant Simplicity */}
      <section id="contact" className="section-lg">
        <div className="container container-narrow">
          <h2 className="font-display heading-5xl text-black text-center mb-md">
            Get Your Analysis
          </h2>
          <p className="text-center text-stone mb-2xl">
            Complete mortgage intelligence within 48 hours.
          </p>

          <form className="card-elevated">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Loan Amount</label>
              <select className="form-select">
                <option>Select amount</option>
                <option>Under $500K</option>
                <option>$500K - $1M</option>
                <option>$1M - $2M</option>
                <option>Over $2M</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-select">
                <option>Select type</option>
                <option>HDB</option>
                <option>Private Condo</option>
                <option>Landed Property</option>
                <option>Commercial</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-lg">
              Get Complete Analysis
            </button>

            <p className="text-xs text-stone text-center mt-md">
              We earn referral fees only from banks you choose. Complete transparency guaranteed.
            </p>
          </form>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="section bg-cloud">
        <div className="container">
          <div className="flex justify-between items-center">
            <div className="text-sm text-stone">
              © 2024 NextNest. Singapore&apos;s most transparent mortgage advisor.
            </div>
            <div className="flex gap-lg">
              <a href="#" className="text-sm text-stone" style={{ textDecoration: 'none' }}>Privacy</a>
              <a href="#" className="text-sm text-stone" style={{ textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}