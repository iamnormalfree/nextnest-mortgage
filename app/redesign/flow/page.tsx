'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Logo from '@/assets/nn-logo-nobg-img.png'
import MinimalProgressiveForm from '@/redesign/MinimalProgressiveForm'
import MinimalAIBrokerUI from '@/redesign/MinimalAIBrokerUI'

type ViewState = 'landing' | 'form' | 'broker'

// Minimal icon components
const ChevronRight = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

export default function MinimalFlowPage() {
  const [currentView, setCurrentView] = useState<ViewState>('landing')

  // Smooth transitions between views
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
      {/* Persistent Navigation */}
      <nav className="nav">
        <div className="container nav-container">
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
          <div className="nav-links">
            {currentView === 'landing' && (
              <>
                <a href="#services" className="nav-link hidden-mobile">Services</a>
                <a href="#contact" className="nav-link hidden-mobile">Contact</a>
              </>
            )}
            <button onClick={navigateToForm} className="nav-link nav-cta">
              {currentView === 'landing' ? 'Get Started' : 'Back to Form'}
            </button>
          </div>
        </div>
      </nav>

      {/* View Switcher */}
      {currentView === 'landing' && (
        <>
          {/* Minimal Hero */}
          <section className="section-xl" style={{ paddingTop: '192px' }}>
            <div className="container">
              <div className="flex flex-col items-center text-center">
                <h1 className="font-display heading-7xl text-black mb-md">
                  Mortgage Intelligence
                </h1>
                <p className="text-xl text-stone mb-xl" style={{ maxWidth: '600px' }}>
                  AI analysis of 286 packages. Mathematical precision meets complete transparency.
                </p>
                <button onClick={navigateToForm} className="btn btn-primary">
                  Start Analysis
                </button>
              </div>
            </div>
          </section>

          {/* Trust Indicators */}
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

          {/* Simple CTA Section */}
          <section id="contact" className="section-lg">
            <div className="container container-narrow text-center">
              <h2 className="font-display heading-5xl text-black mb-md">
                Ready to optimize?
              </h2>
              <p className="text-stone mb-xl">
                Complete mortgage analysis in under 2 minutes.
              </p>
              <button onClick={navigateToForm} className="btn btn-primary">
                Begin Analysis <ChevronRight />
              </button>
            </div>
          </section>
        </>
      )}

      {/* Progressive Form View */}
      {currentView === 'form' && (
        <div style={{ paddingTop: '80px' }}>
          <MinimalProgressiveForm />
          {/* Add transition to broker at the end of form */}
          <div className="text-center py-lg">
            <button onClick={navigateToBroker} className="btn-text flex items-center gap-sm mx-auto">
              Continue to AI Advisor <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* AI Broker View */}
      {currentView === 'broker' && (
        <div style={{ paddingTop: '80px' }}>
          <MinimalAIBrokerUI />
        </div>
      )}

      {/* Minimal Footer (only on landing) */}
      {currentView === 'landing' && (
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
      )}
    </>
  )
}