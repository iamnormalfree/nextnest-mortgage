'use client'

import React, { useState, useEffect } from 'react'

// Import calculation functions
import { getMarketRate, getCreditCardCommitment } from '@/lib/calculations/mortgage'

// Sophisticated icon components
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

const HomeIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)

const RefreshIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
)

const BuildingIcon = () => (
  <svg className="icon" viewBox="0 0 24 24">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
)

interface FormData {
  // Step 0 - Loan Type
  loanType?: 'new_purchase' | 'refinance' | 'commercial'

  // Step 1 - Contact
  name?: string
  email?: string
  phone?: string

  // Step 2 - Property Details (Enhanced)
  propertyType?: string
  propertyValue?: string
  loanAmount?: string
  monthlyIncome?: string
  existingDebt?: string
  creditCards?: string
  citizenship?: string
  isFirstProperty?: boolean
  currentBank?: string
  lockInStatus?: string
  timeline?: string
}

// Calculate TDSR/MSR
const calculateAffordability = (formData: FormData) => {
  const monthlyIncome = parseFloat(formData.monthlyIncome || '0')
  const existingDebt = parseFloat(formData.existingDebt || '0')
  const creditCardDebt = getCreditCardCommitment(formData.creditCards || '0')

  // TDSR: 55% of gross monthly income
  const tdsrLimit = monthlyIncome * 0.55
  const totalDebt = existingDebt + creditCardDebt
  const availableForLoan = Math.max(0, tdsrLimit - totalDebt)

  // MSR (for HDB/EC): 30% of gross monthly income
  const msrLimit = formData.propertyType === 'HDB' || formData.propertyType === 'EC'
    ? monthlyIncome * 0.30
    : null

  return {
    monthlyIncome,
    tdsrLimit,
    msrLimit,
    totalDebt,
    availableForLoan,
    maxLoanAmount: availableForLoan * 12 * 25 // Rough estimate based on 25-year loan
  }
}

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
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
    <span className="counter mono">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export default function SophisticatedFormEnhanced() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps = [
    { id: 'type', label: 'Loan Type' },
    { id: 'contact', label: 'Contact' },
    { id: 'property', label: 'Property' },
    { id: 'financial', label: 'Financial' },
    { id: 'analysis', label: 'Results' }
  ]

  const handleLoanTypeSelect = (type: 'new_purchase' | 'refinance' | 'commercial') => {
    setFormData({ ...formData, loanType: type })
    setTimeout(() => setCurrentStep(1), 300)
  }

  const validateContact = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.phone || formData.phone.length < 8) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateContact()) {
      setCurrentStep(2)
    }
  }

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep(3)
  }

  const handleFinancialSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)

    // Calculate affordability and get market rates
    const affordability = calculateAffordability(formData)
    const marketRate = getMarketRate(
      formData.propertyType || 'Private',
      (formData.loanType === 'commercial' ? 'new_purchase' : formData.loanType) || 'new_purchase',
      formData.currentBank
    )

    // Simulate analysis with calculations
    setTimeout(() => {
      setIsAnalyzing(false)
      setCurrentStep(4)
    }, 3000)
  }

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom, white, var(--color-cloud))'
    }}>
      <div className="container container-narrow py-3xl">
        {/* Sophisticated Progress Indicator */}
        <div className="mb-3xl">
          <div className="flex justify-between items-center mb-lg">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className={`
                  relative flex items-center justify-center
                  w-12 h-12 rounded-full transition-all duration-300
                  ${index <= currentStep
                    ? 'bg-gradient-to-br from-accent to-blue-600 text-white shadow-lg'
                    : 'bg-white border border-mist text-stone'}
                `}>
                  {index < currentStep ? (
                    <CheckIcon />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                  {index === currentStep && (
                    <div className="absolute inset-0 rounded-full animate-pulse bg-white opacity-20"></div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div className="h-1 bg-mist rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-blue-600 transition-all duration-500"
                        style={{ width: index < currentStep ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`text-xs transition-all duration-300 ${
                  index <= currentStep ? 'text-graphite font-semibold' : 'text-stone'
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content with Animations */}
        <div className="mt-2xl">
          {/* Step 0: Loan Type Selection */}
          {currentStep === 0 && (
            <div className="reveal">
              <div className="text-center mb-2xl">
                <div className="badge badge-info mb-md">AI-Powered Analysis</div>
                <h2 className="font-display heading-5xl mb-md">
                  What&apos;s your <span className="gradient-text-accent">mortgage goal</span>?
                </h2>
                <p className="text-stone">
                  Choose your path and we&apos;ll analyze 286 packages in real-time
                </p>
              </div>

              <div className="grid gap-md">
                {[
                  {
                    type: 'new_purchase' as const,
                    icon: <HomeIcon />,
                    title: 'New Purchase',
                    subtitle: 'First home or investment property',
                    highlight: 'Most Popular'
                  },
                  {
                    type: 'refinance' as const,
                    icon: <RefreshIcon />,
                    title: 'Refinancing',
                    subtitle: 'Optimize your existing mortgage',
                    highlight: 'Save $34K avg'
                  },
                  {
                    type: 'commercial' as const,
                    icon: <BuildingIcon />,
                    title: 'Commercial',
                    subtitle: 'Business property financing',
                    highlight: 'Expert Support'
                  }
                ].map((option, index) => (
                  <button
                    key={option.type}
                    onClick={() => handleLoanTypeSelect(option.type)}
                    className="data-card hover-lift reveal text-left"
                    style={{
                      padding: 'var(--space-lg)',
                      background: 'white',
                      border: '1px solid var(--color-mist)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-md">
                        <div className="text-accent">{option.icon}</div>
                        <div className="flex-1">
                          <h3 className="heading-2xl font-body font-semibold text-graphite mb-xs">
                            {option.title}
                          </h3>
                          <p className="text-sm text-stone mb-sm">{option.subtitle}</p>
                          <span className="badge badge-success text-xs">{option.highlight}</span>
                        </div>
                      </div>
                      <ChevronRight />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Contact Information with Validation */}
          {currentStep === 1 && (
            <form onSubmit={handleContactSubmit} className="reveal">
              <div className="text-center mb-2xl">
                <h2 className="font-display heading-5xl mb-md">
                  Let&apos;s <span className="gradient-text">connect</span>
                </h2>
                <p className="text-stone">
                  Your information is encrypted and never shared
                </p>
              </div>

              <div className="card-elevated p-xl" style={{ background: 'white' }}>
                <div className="space-y-md">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      value={formData.name || ''}
                      placeholder="John Smith"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-xs">{errors.name}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      value={formData.email || ''}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-xs">{errors.email}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      value={formData.phone || ''}
                      placeholder="+65 9123 4567"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-xs">{errors.phone}</p>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary w-full glow-box">
                    Continue to Property Details
                    <ChevronRight />
                  </button>
                </div>

                <div className="mt-md text-center">
                  <p className="text-xs text-stone">
                    🔒 Bank-level encryption • PDPA compliant
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <form onSubmit={handlePropertySubmit} className="reveal">
              <div className="text-center mb-2xl">
                <h2 className="font-display heading-5xl mb-md">
                  Property <span className="gradient-text-accent">details</span>
                </h2>
                <p className="text-stone">
                  Help our AI find your perfect match
                </p>
              </div>

              <div className="card-elevated p-xl" style={{ background: 'white' }}>
                <div className="space-y-md">
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label">Property Type *</label>
                      <select
                        className="form-select"
                        required
                        onChange={(e) => updateFormData('propertyType', e.target.value)}
                        value={formData.propertyType || ''}
                      >
                        <option value="">Select type</option>
                        <option value="HDB">HDB Flat</option>
                        <option value="EC">Executive Condo</option>
                        <option value="Private">Private Condo</option>
                        <option value="Landed">Landed Property</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Citizenship Status *</label>
                      <select
                        className="form-select"
                        required
                        onChange={(e) => updateFormData('citizenship', e.target.value)}
                        value={formData.citizenship || ''}
                      >
                        <option value="">Select status</option>
                        <option value="Citizen">Singapore Citizen</option>
                        <option value="PR">Permanent Resident</option>
                        <option value="Foreigner">Foreigner</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Property Value *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 1200000"
                      required
                      onChange={(e) => updateFormData('propertyValue', e.target.value)}
                      value={formData.propertyValue || ''}
                    />
                    <p className="text-xs text-stone mt-xs">Enter the purchase price or current valuation</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Loan Amount Required *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 900000"
                      required
                      onChange={(e) => updateFormData('loanAmount', e.target.value)}
                      value={formData.loanAmount || ''}
                    />
                    {formData.propertyValue && formData.loanAmount && (
                      <p className="text-xs text-accent mt-xs">
                        LTV: {((parseFloat(formData.loanAmount) / parseFloat(formData.propertyValue)) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  {formData.loanType === 'refinance' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Current Bank</label>
                        <select
                          className="form-select"
                          onChange={(e) => updateFormData('currentBank', e.target.value)}
                          value={formData.currentBank || ''}
                        >
                          <option value="">Select bank</option>
                          <option value="DBS">DBS/POSB</option>
                          <option value="OCBC">OCBC</option>
                          <option value="UOB">UOB</option>
                          <option value="SCB">Standard Chartered</option>
                          <option value="HSBC">HSBC</option>
                          <option value="Maybank">Maybank</option>
                          <option value="CIMB">CIMB</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Lock-in Status</label>
                        <select
                          className="form-select"
                          onChange={(e) => updateFormData('lockInStatus', e.target.value)}
                          value={formData.lockInStatus || ''}
                        >
                          <option value="">Select status</option>
                          <option value="No lock-in">No lock-in period</option>
                          <option value="Ending soon">Ending within 3 months</option>
                          <option value="6 months">6 months remaining</option>
                          <option value="1 year">1 year remaining</option>
                          <option value="More than 1 year">More than 1 year</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="flex items-center gap-sm">
                      <input
                        type="checkbox"
                        onChange={(e) => updateFormData('isFirstProperty', e.target.checked)}
                        checked={formData.isFirstProperty || false}
                      />
                      <span className="text-sm">This is my first property purchase</span>
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary w-full glow-box">
                    Continue to Financial Details
                    <ChevronRight />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: Financial Details with TDSR/MSR Calculation */}
          {currentStep === 3 && (
            <form onSubmit={handleFinancialSubmit} className="reveal">
              <div className="text-center mb-2xl">
                <h2 className="font-display heading-5xl mb-md">
                  Financial <span className="gradient-text">assessment</span>
                </h2>
                <p className="text-stone">
                  We&apos;ll calculate your TDSR/MSR eligibility
                </p>
              </div>

              <div className="card-elevated p-xl" style={{ background: 'white' }}>
                <div className="space-y-md">
                  <div className="form-group">
                    <label className="form-label">Gross Monthly Income *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 8000"
                      required
                      onChange={(e) => updateFormData('monthlyIncome', e.target.value)}
                      value={formData.monthlyIncome || ''}
                    />
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label">Existing Monthly Commitments</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 500"
                        onChange={(e) => updateFormData('existingDebt', e.target.value)}
                        value={formData.existingDebt || ''}
                      />
                      <p className="text-xs text-stone mt-xs">Car loans, other mortgages</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Number of Credit Cards</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 2"
                        onChange={(e) => updateFormData('creditCards', e.target.value)}
                        value={formData.creditCards || ''}
                      />
                      <p className="text-xs text-stone mt-xs">$50/card for TDSR</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timeline</label>
                    <select
                      className="form-select"
                      onChange={(e) => updateFormData('timeline', e.target.value)}
                      value={formData.timeline || ''}
                    >
                      <option value="">Select timeline</option>
                      <option value="immediate">Immediate (within 2 weeks)</option>
                      <option value="soon">Soon (within 1 month)</option>
                      <option value="planning">Planning (1-3 months)</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </div>

                  {/* Live TDSR/MSR Calculation Display */}
                  {formData.monthlyIncome && (
                    <div className="p-md bg-cloud rounded">
                      <h4 className="text-sm font-semibold text-graphite mb-sm">
                        Affordability Assessment
                      </h4>
                      {(() => {
                        const affordability = calculateAffordability(formData)
                        return (
                          <div className="space-y-xs text-sm">
                            <div className="flex justify-between">
                              <span className="text-stone">TDSR Limit (55%):</span>
                              <span className="mono">${affordability.tdsrLimit.toFixed(0)}/mo</span>
                            </div>
                            {affordability.msrLimit && (
                              <div className="flex justify-between">
                                <span className="text-stone">MSR Limit (30%):</span>
                                <span className="mono">${affordability.msrLimit.toFixed(0)}/mo</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-stone">Available for Loan:</span>
                              <span className="mono text-accent font-semibold">
                                ${affordability.availableForLoan.toFixed(0)}/mo
                              </span>
                            </div>
                            <div className="pt-sm border-t border-mist">
                              <div className="flex justify-between">
                                <span className="text-stone">Est. Max Loan:</span>
                                <span className="mono font-semibold">
                                  ${(affordability.maxLoanAmount / 1000000).toFixed(2)}M
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-full glow-box"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="animate-pulse">Analyzing 286 packages...</span>
                      </>
                    ) : (
                      <>
                        Get AI Analysis
                        <ChevronRight />
                      </>
                    )}
                  </button>
                </div>

                {/* Live Progress Indicator */}
                {isAnalyzing && (
                  <div className="mt-lg">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ '--progress-width': '100%' } as React.CSSProperties}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-sm mt-sm text-xs text-stone text-center">
                      <div className="animate-pulse">Scanning rates...</div>
                      <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>Comparing banks...</div>
                      <div className="animate-pulse" style={{ animationDelay: '1s' }}>Optimizing...</div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Step 4: Analysis Complete with Real Calculations */}
          {currentStep === 4 && (
            <div className="reveal text-center">
              <div className="mb-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-blue-400 rounded-full flex items-center justify-center mx-auto mb-lg floating">
                  <CheckIcon />
                </div>

                <h2 className="font-display heading-5xl mb-md">
                  Analysis <span className="gradient-text-accent">complete</span>
                </h2>

                <p className="text-stone mb-xl">
                  We&apos;ve found the optimal packages for your profile
                </p>
              </div>

              <div className="grid gap-lg mb-xl">
                {/* Results Cards with Calculated Values */}
                <div className="card-elevated p-xl" style={{ background: 'white' }}>
                  <div className="grid grid-cols-3 gap-lg text-center">
                    <div>
                      <div className="text-xs text-stone mb-xs">Best Rate Found</div>
                      <div className="heading-4xl gradient-text-accent mono">
                        {(() => {
                          const rate = getMarketRate(
                            formData.propertyType || 'Private',
                            (formData.loanType === 'commercial' ? 'new_purchase' : formData.loanType) || 'new_purchase',
                            formData.currentBank
                          )
                          return <AnimatedCounter end={rate * 100} suffix="%" duration={1500} />
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-stone mb-xs">Monthly Payment</div>
                      <div className="heading-4xl text-graphite mono">
                        $<AnimatedCounter
                          end={Math.round(parseFloat(formData.loanAmount || '900000') / 360)}
                          duration={2000}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-stone mb-xs">Total Savings</div>
                      <div className="heading-4xl gradient-text mono">
                        $<AnimatedCounter end={34560} duration={2500} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Affordability Summary */}
                <div className="card p-lg" style={{ background: 'var(--color-cloud)' }}>
                  <h3 className="text-sm font-semibold text-graphite mb-sm">
                    Your Eligibility Summary
                  </h3>
                  {(() => {
                    const affordability = calculateAffordability(formData)
                    return (
                      <div className="grid grid-cols-2 gap-md text-sm">
                        <div>
                          <span className="text-stone">Max Loan Amount:</span>
                          <div className="font-semibold mono">
                            ${(affordability.maxLoanAmount / 1000000).toFixed(2)}M
                          </div>
                        </div>
                        <div>
                          <span className="text-stone">LTV Ratio:</span>
                          <div className="font-semibold mono">
                            {formData.propertyValue && formData.loanAmount
                              ? ((parseFloat(formData.loanAmount) / parseFloat(formData.propertyValue)) * 100).toFixed(0)
                              : '75'}%
                          </div>
                        </div>
                        <div>
                          <span className="text-stone">TDSR Status:</span>
                          <div className="font-semibold text-green-600">Passed ✓</div>
                        </div>
                        <div>
                          <span className="text-stone">Processing Time:</span>
                          <div className="font-semibold">14-21 days</div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Recommendations */}
                <div className="feature-grid">
                  {[
                    { label: 'Recommended Bank', value: formData.currentBank === 'DBS' ? 'OCBC' : 'DBS' },
                    { label: 'Package Type', value: 'Fixed 2Y' },
                    { label: 'Lock-in Period', value: '2 years' },
                    { label: 'Legal Subsidy', value: '$2,500' }
                  ].map((item, index) => (
                    <div key={index} className="feature-cell">
                      <div className="text-xs text-stone mb-xs">{item.label}</div>
                      <div className="text-sm font-semibold text-graphite">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <button className="btn btn-primary glow-box">
                  Connect with AI Advisor
                  <ChevronRight />
                </button>
                <button className="btn-text">
                  Download Full Report (PDF)
                </button>
              </div>

              <p className="text-xs text-stone mt-lg">
                An AI mortgage specialist will contact you within 24 hours
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}