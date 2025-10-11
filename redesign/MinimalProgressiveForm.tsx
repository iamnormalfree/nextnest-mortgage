'use client'

import React, { useState } from 'react'

// Minimal icon components
const ChevronRight = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

const CheckIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

interface FormData {
  loanType?: 'new' | 'refinance' | 'commercial'
  name?: string
  email?: string
  phone?: string
  propertyType?: string
  loanAmount?: string
  monthlyIncome?: string
}

export default function MinimalProgressiveForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const steps = [
    { id: 'type', label: 'Loan Type' },
    { id: 'contact', label: 'Contact' },
    { id: 'property', label: 'Property' },
    { id: 'analysis', label: 'Analysis' }
  ]

  const handleLoanTypeSelect = (type: 'new' | 'refinance' | 'commercial') => {
    setFormData({ ...formData, loanType: type })
    setCurrentStep(1)
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep(2)
  }

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      setCurrentStep(3)
    }, 2000)
  }

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="min-h-screen bg-white py-3xl">
      <div className="container container-narrow">
        {/* Progress Indicator - Ultra Minimal */}
        <div className="flex justify-between mb-2xl">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${index <= currentStep
                  ? 'bg-black text-white'
                  : 'bg-mist text-stone'}
              `}>
                {index < currentStep ? <CheckIcon /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-px mx-2 ${
                  index < currentStep ? 'bg-black' : 'bg-mist'
                }`} style={{ width: '80px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mt-3xl">
          {/* Step 0: Loan Type Selection */}
          {currentStep === 0 && (
            <div>
              <h2 className="font-display heading-5xl text-black text-center mb-md">
                What brings you here?
              </h2>
              <p className="text-center text-stone mb-2xl">
                Choose your mortgage path to get started.
              </p>

              <div className="grid gap-md">
                <button
                  onClick={() => handleLoanTypeSelect('new')}
                  className="p-lg text-left border border-mist hover:border-black transition-colors group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="heading-2xl font-body font-semibold text-graphite mb-xs">
                        New Purchase
                      </h3>
                      <p className="text-stone">
                        Buying your first home or investment property
                      </p>
                    </div>
                    <ChevronRight />
                  </div>
                </button>

                <button
                  onClick={() => handleLoanTypeSelect('refinance')}
                  className="p-lg text-left border border-mist hover:border-black transition-colors group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="heading-2xl font-body font-semibold text-graphite mb-xs">
                        Refinancing
                      </h3>
                      <p className="text-stone">
                        Optimize your existing mortgage terms
                      </p>
                    </div>
                    <ChevronRight />
                  </div>
                </button>

                <button
                  onClick={() => handleLoanTypeSelect('commercial')}
                  className="p-lg text-left border border-mist hover:border-black transition-colors group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="heading-2xl font-body font-semibold text-graphite mb-xs">
                        Commercial
                      </h3>
                      <p className="text-stone">
                        Business property or investment financing
                      </p>
                    </div>
                    <ChevronRight />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <form onSubmit={handleContactSubmit}>
              <h2 className="font-display heading-5xl text-black text-center mb-md">
                Let&apos;s connect
              </h2>
              <p className="text-center text-stone mb-2xl">
                We&apos;ll use this to share your personalized analysis.
              </p>

              <div className="space-y-md">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    onChange={(e) => updateFormData('name', e.target.value)}
                    value={formData.name || ''}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    onChange={(e) => updateFormData('email', e.target.value)}
                    value={formData.email || ''}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    value={formData.phone || ''}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full mt-lg">
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <form onSubmit={handlePropertySubmit}>
              <h2 className="font-display heading-5xl text-black text-center mb-md">
                Property details
              </h2>
              <p className="text-center text-stone mb-2xl">
                Help us understand your needs better.
              </p>

              <div className="space-y-md">
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select
                    className="form-select"
                    required
                    onChange={(e) => updateFormData('propertyType', e.target.value)}
                    value={formData.propertyType || ''}
                  >
                    <option value="">Select type</option>
                    <option value="hdb">HDB</option>
                    <option value="condo">Private Condo</option>
                    <option value="landed">Landed Property</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Loan Amount Range</label>
                  <select
                    className="form-select"
                    required
                    onChange={(e) => updateFormData('loanAmount', e.target.value)}
                    value={formData.loanAmount || ''}
                  >
                    <option value="">Select range</option>
                    <option value="<500k">Under $500K</option>
                    <option value="500k-1m">$500K - $1M</option>
                    <option value="1m-2m">$1M - $2M</option>
                    <option value=">2m">Over $2M</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Income</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 8000"
                    required
                    onChange={(e) => updateFormData('monthlyIncome', e.target.value)}
                    value={formData.monthlyIncome || ''}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full mt-lg">
                  {isAnalyzing ? 'Analyzing...' : 'Get Analysis'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Analysis Complete */}
          {currentStep === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-lg">
                <CheckIcon />
              </div>

              <h2 className="font-display heading-5xl text-black mb-md">
                Analysis ready
              </h2>

              <p className="text-stone mb-xl">
                Based on your profile, here&apos;s what we found:
              </p>

              <div className="card-elevated p-xl text-left mb-xl">
                <div className="grid gap-lg">
                  <div>
                    <div className="text-sm text-stone mb-xs">Estimated Rate</div>
                    <div className="heading-3xl font-display text-accent">1.4% - 2.1%</div>
                  </div>
                  <div>
                    <div className="text-sm text-stone mb-xs">Monthly Payment</div>
                    <div className="heading-3xl font-display text-black">$2,450 - $2,780</div>
                  </div>
                  <div>
                    <div className="text-sm text-stone mb-xs">Potential Savings</div>
                    <div className="heading-3xl font-display text-black">$18,000+</div>
                  </div>
                </div>
              </div>

              <p className="text-stone mb-lg">
                An AI mortgage advisor will contact you within 24 hours with your complete analysis.
              </p>

              <button className="btn btn-primary">
                Chat with AI Advisor Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}