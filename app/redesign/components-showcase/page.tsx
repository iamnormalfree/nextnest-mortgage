'use client'

import React, { useState, useRef, useEffect } from 'react'

export default function ComponentsShowcase() {
  const [activeTab, setActiveTab] = useState('buttons')
  const [toggleState, setToggleState] = useState(false)
  const [radioValue, setRadioValue] = useState('option1')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(60)
  const magneticRef = useRef<HTMLButtonElement>(null)
  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 })

  // Magnetic button effect
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magneticRef.current) return
    const rect = magneticRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 5
    const y = (e.clientY - rect.top - rect.height / 2) / 5
    setMagneticPos({ x, y })
  }

  const handleMouseLeave = () => {
    setMagneticPos({ x: 0, y: 0 })
  }

  // Simulate loading
  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  // Animate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F8F8] to-transparent opacity-50" />
        <div className="relative container max-w-6xl mx-auto px-4 py-24">
          <h1 className="text-6xl font-light tracking-tight mb-4">
            <span style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Premium</span> Components
          </h1>
          <p className="text-xl text-[#666666] max-w-2xl">
            Sophisticated UI elements following Swiss spa minimalism with strategic premium touches
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="sticky top-0 z-50 glass-premium border-b border-[#E5E5E5]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {['buttons', 'forms', 'cards', 'feedback', 'advanced'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 capitalize font-medium text-sm transition-all duration-300 border-b-2 ${
                  activeTab === tab
                    ? 'border-[#7C3AED] text-[#7C3AED]'
                    : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Sections */}
      <div className="container max-w-6xl mx-auto px-4 py-16">
        {/* Buttons Section */}
        {activeTab === 'buttons' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-light mb-8">Premium Buttons</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Primary Button */}
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-4">Primary Action</h3>
                  <button className="btn-premium btn-premium-primary w-full">
                    Get Started
                  </button>
                  <p className="text-xs text-[#666666] mt-4">
                    Gradient with shimmer effect on hover
                  </p>
                </div>

                {/* Ghost Button */}
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-4">Ghost Button</h3>
                  <button className="btn-premium btn-premium-ghost w-full">
                    Learn More
                  </button>
                  <p className="text-xs text-[#666666] mt-4">
                    Subtle border with fill on hover
                  </p>
                </div>

                {/* Magnetic Button */}
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-4">Magnetic Effect</h3>
                  <button
                    ref={magneticRef}
                    className="btn-premium btn-premium-ghost btn-magnetic w-full"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      transform: `translate(${magneticPos.x}px, ${magneticPos.y}px)`
                    }}
                  >
                    Hover Me
                  </button>
                  <p className="text-xs text-[#666666] mt-4">
                    Follows cursor subtly
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-light mb-6">Liquid Buttons</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="card-premium card-premium-elevated p-6">
                  <button className="btn-liquid w-full">
                    <span className="btn-liquid-text">Liquid Fill Effect</span>
                  </button>
                </div>
                <div className="card-premium card-premium-elevated p-6">
                  <button className="btn-premium neumorphic-flat">
                    Neumorphic Button
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Forms Section */}
        {activeTab === 'forms' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-light mb-8">Form Elements</h2>

              {/* Floating Label Input */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Floating Label Input</h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder=" "
                      className="input-premium"
                    />
                    <label className="input-premium-label">Email Address</label>
                    <div className="input-premium-underline" />
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Premium Toggle</h3>
                  <div className="flex items-center gap-4">
                    <span className={toggleState ? 'text-[#666666]' : 'text-[#1A1A1A] font-medium'}>
                      Off
                    </span>
                    <div
                      className={`switch-premium ${toggleState ? 'active' : ''}`}
                      onClick={() => setToggleState(!toggleState)}
                    >
                      <div className="switch-premium-handle" />
                    </div>
                    <span className={toggleState ? 'text-[#1A1A1A] font-medium' : 'text-[#666666]'}>
                      On
                    </span>
                  </div>
                </div>
              </div>

              {/* Radio & Checkbox */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Radio Selection</h3>
                  <div className="space-y-4">
                    {['option1', 'option2', 'option3'].map((option) => (
                      <label key={option} className="flex items-center gap-3 cursor-pointer">
                        <div
                          className={`radio-premium ${radioValue === option ? 'active' : ''}`}
                          onClick={() => setRadioValue(option)}
                        />
                        <span className="text-[#1A1A1A]">Option {option.slice(-1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Checkbox</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <div className="checkbox-premium">
                          <svg className="checkbox-premium-check w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[#1A1A1A]">Selection {item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Dropdown</h3>
                  <select className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors">
                    <option>Select Option</option>
                    <option>Premium Plan</option>
                    <option>Enterprise Plan</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Cards Section */}
        {activeTab === 'cards' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-light mb-8">Card Designs</h2>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Elevated Card */}
                <div className="card-premium card-premium-elevated card-premium-interactive">
                  <h3 className="text-xl font-medium mb-2">Elevated Card</h3>
                  <p className="text-[#666666] mb-4">
                    Hover for lift effect with expanding gradient background
                  </p>
                  <div className="text-3xl font-light">$2,450</div>
                </div>

                {/* Neumorphic Card */}
                <div className="neumorphic-floating rounded-2xl p-8">
                  <h3 className="text-xl font-medium mb-2">Neumorphic</h3>
                  <p className="text-[#666666] mb-4">
                    Soft shadows creating depth without borders
                  </p>
                  <div className="badge-premium badge-premium-accent">
                    Premium
                  </div>
                </div>

                {/* Glass Card */}
                <div className="glass-premium rounded-2xl p-8">
                  <h3 className="text-xl font-medium mb-2">Glassmorphic</h3>
                  <p className="text-[#666666] mb-4">
                    Translucent with backdrop blur effect
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-[#666666]">Live</span>
                  </div>
                </div>
              </div>

              {/* Parallax Card */}
              <div className="mt-12">
                <h3 className="text-2xl font-light mb-6">3D Parallax Card</h3>
                <div className="parallax-container">
                  <div className="parallax-card card-premium card-premium-elevated p-12 text-center">
                    <div className="shape-morph mx-auto mb-6" style={{ width: '100px', height: '100px' }} />
                    <h4 className="text-2xl font-light mb-2">Interactive 3D</h4>
                    <p className="text-[#666666]">Hover to see perspective shift</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Feedback Section */}
        {activeTab === 'feedback' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-light mb-8">Feedback & Loading</h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Progress Bar */}
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Premium Progress Bar</h3>
                  <div className="progress-premium">
                    <div className="progress-premium-fill" style={{ width: `${progress}%` }} />
                    <div className="progress-premium-shimmer" />
                  </div>
                  <p className="text-sm text-[#666666] mt-4">{progress}% Complete</p>
                </div>

                {/* Loading States */}
                <div className="card-premium card-premium-elevated p-6">
                  <h3 className="text-lg font-medium mb-6">Loading States</h3>
                  <div className="flex items-center gap-6">
                    <div className="spinner-premium" />
                    <button
                      onClick={handleLoadingDemo}
                      className="btn-premium btn-premium-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="spinner-premium w-4 h-4 border-2" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        'Click to Load'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Skeleton Loading */}
              <div className="card-premium card-premium-elevated p-6">
                <h3 className="text-lg font-medium mb-6">Skeleton Loading</h3>
                <div className="space-y-4">
                  <div className="skeleton-premium h-4 rounded" />
                  <div className="skeleton-premium h-4 rounded w-3/4" />
                  <div className="skeleton-premium h-4 rounded w-1/2" />
                </div>
              </div>

              {/* Badges */}
              <div className="card-premium card-premium-elevated p-6">
                <h3 className="text-lg font-medium mb-6">Premium Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="badge-premium badge-premium-accent">Premium</div>
                  <div className="badge-premium badge-premium-success">Active</div>
                  <div className="badge-premium badge-premium-warning">Pending</div>
                  <div className="badge-premium badge-premium-live badge-premium-accent">Live</div>
                </div>
              </div>

              {/* Tooltips */}
              <div className="card-premium card-premium-elevated p-6">
                <h3 className="text-lg font-medium mb-6">Sophisticated Tooltips</h3>
                <div className="flex gap-8">
                  <div className="tooltip-premium">
                    <button className="btn-premium btn-premium-ghost">Hover for Info</button>
                    <div className="tooltip-premium-content">
                      Premium tooltip with smooth animation
                    </div>
                  </div>
                  <div className="tooltip-premium">
                    <span className="text-[#7C3AED] cursor-help underline">Help</span>
                    <div className="tooltip-premium-content">
                      Click to learn more about this feature
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Advanced Section */}
        {activeTab === 'advanced' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-light mb-8">Advanced Effects</h2>

              {/* Magnetic Field */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="card-premium card-premium-elevated p-8 text-center">
                  <h3 className="text-lg font-medium mb-6">Magnetic Field</h3>
                  <div className="magnetic-field inline-block">
                    <button className="btn-premium btn-premium-primary">
                      Magnetic Aura
                    </button>
                  </div>
                  <p className="text-xs text-[#666666] mt-4">
                    Hover to see the magnetic field effect
                  </p>
                </div>

                {/* Morphing Shape */}
                <div className="card-premium card-premium-elevated p-8 text-center">
                  <h3 className="text-lg font-medium mb-6">Liquid Morph</h3>
                  <div className="shape-morph mx-auto" style={{ width: '120px', height: '120px' }} />
                  <p className="text-xs text-[#666666] mt-4">
                    Continuous morphing animation
                  </p>
                </div>
              </div>

              {/* Dividers */}
              <div className="card-premium card-premium-elevated p-8">
                <h3 className="text-lg font-medium mb-6">Premium Dividers</h3>
                <div className="space-y-8">
                  <div className="divider-premium" />
                  <div className="divider-premium divider-premium-gradient" />
                  <div className="divider-premium divider-premium-animated" />
                </div>
              </div>

              {/* Combined Demo */}
              <div className="mt-12">
                <h3 className="text-2xl font-light mb-6">Complete Premium Form</h3>
                <div className="card-premium card-premium-elevated max-w-2xl mx-auto">
                  <form className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder=" "
                        className="input-premium"
                      />
                      <label className="input-premium-label">Full Name</label>
                      <div className="input-premium-underline" />
                    </div>

                    <div className="relative">
                      <input
                        type="email"
                        placeholder=" "
                        className="input-premium"
                      />
                      <label className="input-premium-label">Email Address</label>
                      <div className="input-premium-underline" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <select className="px-4 py-3 bg-white border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors">
                        <option>Select Plan</option>
                        <option>Basic - $9/mo</option>
                        <option>Premium - $29/mo</option>
                        <option>Enterprise - Custom</option>
                      </select>

                      <div className="flex items-center justify-center gap-4">
                        <span className="text-sm">Monthly</span>
                        <div
                          className={`switch-premium ${toggleState ? 'active' : ''}`}
                          onClick={() => setToggleState(!toggleState)}
                        >
                          <div className="switch-premium-handle" />
                        </div>
                        <span className="text-sm">Yearly</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="checkbox-premium">
                        <svg className="checkbox-premium-check w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <label className="text-sm text-[#666666]">
                        I agree to the terms and conditions
                      </label>
                    </div>

                    <div className="pt-4">
                      <button type="button" className="btn-premium btn-premium-primary w-full">
                        Complete Registration
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] mt-24">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-light mb-4">Design Philosophy</h3>
            <p className="text-[#666666] max-w-2xl mx-auto mb-8">
              Every component follows our Swiss spa minimalism principles with strategic sophistication.
              Premium touches are applied sparingly for maximum impact.
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <div className="text-2xl font-light mb-1" style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #FCD34D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>2-3</div>
                <div className="text-[#666666]">Gradients per page</div>
              </div>
              <div>
                <div className="text-2xl font-light mb-1">200ms</div>
                <div className="text-[#666666]">Max animation</div>
              </div>
              <div>
                <div className="text-2xl font-light mb-1">8px</div>
                <div className="text-[#666666]">Base spacing</div>
              </div>
              <div>
                <div className="text-2xl font-light mb-1">95%</div>
                <div className="text-[#666666]">Accessibility</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}