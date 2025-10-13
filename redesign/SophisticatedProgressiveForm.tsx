'use client'

import React, { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useProgressiveFormController } from '@/hooks/useProgressiveFormController'
import { Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { formSteps, propertyCategoryOptions } from '@/lib/forms/form-config'

// Sophisticated icon components - 16px for consistency with design principles
const ChevronRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const HomeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const Sparkles = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 7h-10l5-5 5 5zM7 17h10l-5 5-5-5z"/>
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

// Animated Counter Component (typed)
type CounterProps = { end: number; duration?: number; prefix?: string; suffix?: string }
const AnimatedCounter: React.FC<CounterProps> = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | undefined
    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp
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

interface SophisticatedProgressiveFormProps {
  loanType?: 'new' | 'refinance' | 'commercial'
  sessionId?: string
}

export default function SophisticatedProgressiveForm({
  loanType: initialLoanType = 'new',
  sessionId = `session-${Date.now()}`
}: SophisticatedProgressiveFormProps = {}) {
  // Use the headless controller
  const controller = useProgressiveFormController({
    loanType: initialLoanType === 'new' ? 'new_purchase' : initialLoanType,
    sessionId,
    onStepCompletion: (step, data) => {
      console.log('Step completed:', step, data)
    },
    onAIInsight: (insight) => {
      console.log('AI Insight:', insight)
    },
    onScoreUpdate: (score) => {
      console.log('Lead score updated:', score)
    },
    onFormComplete: (data) => {
      console.log('Form complete:', data)
      // Navigate to analysis/results
      setShowResults(true)
    }
  })

  const {
    currentStep,
    completedSteps,
    errors,
    isValid,
    isAnalyzing,
    isSubmitting,
    instantCalcResult,
    showInstantCalc,
    leadScore,
    propertyCategory,
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    next,
    prev,
    onFieldChange,
    setPropertyCategory: updatePropertyCategory
  } = controller

  const [showResults, setShowResults] = useState(false)
  const [selectedLoanType, setSelectedLoanType] = useState<'new' | 'refinance' | 'commercial' | null>(
    initialLoanType || null
  )

  // Use formSteps from config for consistency
  const steps = formSteps.map((step, index) => ({
    id: step.label.toLowerCase().replace(' ', '_'),
    label: step.label
  }))

  const handleLoanTypeSelect = (type: 'new' | 'refinance' | 'commercial') => {
    setSelectedLoanType(type)
    const mappedType = type === 'new' ? 'new_purchase' : type
    onFieldChange('loanType', mappedType)
    setTimeout(() => next({ loanType: mappedType }), 300)
  }

  const handleContactSubmit = handleSubmit(async (data) => {
    await next(data)
  })

  const handlePropertySubmit = handleSubmit(async (data) => {
    await next(data)
  })

  const updateFormData = (field: string, value: string) => {
    onFieldChange(field, value)
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Sophisticated Progress Indicator - Cleaner */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-4 h-px bg-fog" style={{ zIndex: 0 }} />
            <div
              className="absolute left-0 top-4 h-px bg-gold transition-all duration-200"
              style={{
                width: `${(currentStep / (formSteps.length - 1)) * 100}%`,
                zIndex: 1
              }}
            />

            {/* Step Dots */}
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="relative flex flex-col items-center"
                style={{ zIndex: 2 }}
              >
                <div className={`
                  flex items-center justify-center
                  w-8 h-8 transition-all duration-200
                  ${index < currentStep
                    ? 'bg-ink text-white'
                    : index === currentStep
                    ? 'bg-gold text-ink shadow-lg scale-110'
                    : 'bg-white border border-fog text-silver'}
                `}>
                  {index < currentStep ? (
                    <CheckIcon />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className={`mt-2 text-xs whitespace-nowrap transition-all duration-200 ${
                  index <= currentStep ? 'text-graphite font-medium' : 'text-silver'
                }`}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content with Animations */}
        <div className="mt-8">
          {/* Step 0: Loan Type Selection */}
          {currentStep === 0 && (
            <div className="transition-all duration-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-mist text-graphite mb-2">AI-Powered Analysis</div>
                <h2 className="text-3xl font-light text-ink mb-2">
                  What&apos;s your <span className="text-gradient-gold">mortgage goal</span>?
                </h2>
                <p className="text-graphite">
                  Choose your path and we&apos;ll analyze 286 packages in real-time
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    type: 'new' as const,
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
                    className="bg-white border border-fog p-6 text-left transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="text-gold">{option.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-ink mb-1">
                            {option.title}
                          </h3>
                          <p className="text-sm text-graphite mb-2">{option.subtitle}</p>
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wider bg-emerald text-white">{option.highlight}</span>
                        </div>
                      </div>
                      <ChevronRight />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <form onSubmit={handleContactSubmit} className="transition-all duration-200">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-ink mb-2">
                  Let&apos;s <span className="text-gradient-gold">connect</span>
                </h2>
                <p className="text-graphite">
                  Your information is encrypted and never shared
                </p>
              </div>

              <div className="bg-white border border-fog p-6">
                <div className="space-y-4">
                  <div className="mb-6">
                    <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Full Name</label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                          placeholder="John Smith"
                          onChange={(e) => {
                            field.onChange(e)
                            onFieldChange('name', e.target.value)
                          }}
                        />
                      )}
                    />
                    {errors.name && (
                      <p className="text-ruby text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Email Address</label>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="email"
                          className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                          placeholder="john@example.com"
                          onChange={(e) => {
                            field.onChange(e)
                            onFieldChange('email', e.target.value)
                          }}
                        />
                      )}
                    />
                    {errors.email && (
                      <p className="text-ruby text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Phone Number</label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="tel"
                          className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                          placeholder="9123 4567"
                          onChange={(e) => {
                            field.onChange(e)
                            onFieldChange('phone', e.target.value)
                          }}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-ruby text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <button type="submit" className="w-full h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                    Continue to Property Details
                    <ChevronRight />
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-silver flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3" strokeWidth={2} />
                    Bank-level encryption • PDPA compliant
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <form onSubmit={handlePropertySubmit} className="transition-all duration-200">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-ink mb-2">
                  Property <span className="text-gradient-gold">details</span>
                </h2>
                <p className="text-graphite">
                  Help our AI find your perfect match
                </p>
              </div>

              <div className="bg-white border border-fog p-6">
                <div className="space-y-4">
                  {/* Property Category - Required for new purchase */}
                  {selectedLoanType === 'new' && (
                    <div className="mb-6">
                      <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Property Category</label>
                      <Controller
                        name="propertyCategory"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                            onChange={(e) => {
                              field.onChange(e)
                              onFieldChange('propertyCategory', e.target.value)
                              updatePropertyCategory(e.target.value as any)
                            }}
                          >
                            <option value="">Select category</option>
                            {propertyCategoryOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.propertyCategory && (
                        <p className="text-ruby text-xs mt-1">{errors.propertyCategory.message}</p>
                      )}
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Property Type</label>
                    <Controller
                      name="propertyType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                          onChange={(e) => {
                            field.onChange(e)
                            onFieldChange('propertyType', e.target.value)
                          }}
                        >
                          <option value="">Select type</option>
                          <option value="HDB">HDB Flat</option>
                          <option value="EC">Executive Condo</option>
                          <option value="Private">Private Condo</option>
                          <option value="Landed">Landed Property</option>
                        </select>
                      )}
                    />
                    {errors.propertyType && (
                      <p className="text-ruby text-xs mt-1">{errors.propertyType.message}</p>
                    )}
                  </div>

                  {/* Price Range for new purchase, Outstanding Loan for refinance */}
                  <div className="mb-6">
                    <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">
                      {selectedLoanType === 'refinance' ? 'Outstanding Loan Amount' : 'Price Range'}
                    </label>
                    <Controller
                      name={selectedLoanType === 'refinance' ? 'outstandingLoan' : 'priceRange'}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                          placeholder={selectedLoanType === 'refinance' ? '400000' : '500000'}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            field.onChange(value)
                            onFieldChange(selectedLoanType === 'refinance' ? 'outstandingLoan' : 'priceRange', value)
                          }}
                        />
                      )}
                    />
                    {(errors.priceRange || errors.outstandingLoan) && (
                      <p className="text-ruby text-xs mt-1">{errors.priceRange?.message || errors.outstandingLoan?.message}</p>
                    )}
                  </div>

                  {/* Combined Age for new purchase */}
                  {selectedLoanType === 'new' && (
                    <div className="mb-6">
                      <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Combined Age</label>
                      <Controller
                        name="combinedAge"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                            placeholder="35"
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              field.onChange(value)
                              onFieldChange('combinedAge', value)
                            }}
                          />
                        )}
                      />
                      {errors.combinedAge && (
                        <p className="text-ruby text-xs mt-1">{errors.combinedAge.message}</p>
                      )}
                    </div>
                  )}

                  {/* Current Rate for refinance */}
                  {selectedLoanType === 'refinance' && (
                    <div className="mb-6">
                      <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Current Interest Rate (%)</label>
                      <Controller
                        name="currentRate"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.01"
                            className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                            placeholder="3.0"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              field.onChange(value)
                              onFieldChange('currentRate', value)
                            }}
                          />
                        )}
                      />
                      {errors.currentRate && (
                        <p className="text-ruby text-xs mt-1">{errors.currentRate.message}</p>
                      )}
                    </div>
                  )}

                  {/* Current Bank for refinance */}
                  {selectedLoanType === 'refinance' && (
                    <div className="mb-6">
                      <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Current Bank</label>
                      <Controller
                        name="currentBank"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                            onChange={(e) => {
                              field.onChange(e)
                              onFieldChange('currentBank', e.target.value)
                            }}
                          >
                            <option value="">Select bank</option>
                            <option value="dbs">DBS</option>
                            <option value="ocbc">OCBC</option>
                            <option value="uob">UOB</option>
                            <option value="maybank">Maybank</option>
                            <option value="cimb">CIMB</option>
                            <option value="hsbc">HSBC</option>
                            <option value="sc">Standard Chartered</option>
                            <option value="other">Other</option>
                          </select>
                        )}
                      />
                      {errors.currentBank && (
                        <p className="text-ruby text-xs mt-1">{errors.currentBank.message}</p>
                      )}
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-xs text-silver uppercase tracking-wider mb-2 font-medium">Monthly Income</label>
                    <Controller
                      name="monthlyIncome"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          className="w-full h-12 px-4 bg-white border border-fog text-ink focus:outline-none focus:border-gold"
                          placeholder="8000"
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            field.onChange(value)
                            onFieldChange('monthlyIncome', value)
                          }}
                        />
                      )}
                    />
                    {errors.monthlyIncome && (
                      <p className="text-ruby text-xs mt-1">{errors.monthlyIncome.message}</p>
                    )}
                  </div>

                  {/* Show instant calculation result if available */}
                  {showInstantCalc && instantCalcResult && (
                    <div className="mt-6 p-4 bg-gold/10 border border-gold/20">
                      <h4 className="text-sm font-medium text-ink mb-2 flex items-center">
                        <Sparkles />
                        <span className="ml-2">Instant Analysis</span>
                      </h4>
                      <div className="space-y-2">
                        {(selectedLoanType === 'new' || selectedLoanType === 'new_purchase') && instantCalcResult.maxLoan && (
                          <p className="text-sm text-graphite">
                            Maximum Loan: <span className="font-mono font-medium">${instantCalcResult.maxLoan.toLocaleString()}</span>
                          </p>
                        )}
                        {selectedLoanType === 'refinance' && instantCalcResult.monthlySavings && (
                          <p className="text-sm text-graphite">
                            Monthly Savings: <span className="font-mono font-medium text-emerald">${instantCalcResult.monthlySavings.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
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
                  <div className="mt-4">
                    <div className="h-1 bg-fog relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-gold animate-pulse"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <p className="text-xs text-silver text-center mt-2">
                      Comparing rates across 23 banks...
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Step 3: Analysis Complete */}
          {currentStep === 3 && (
            <div className="transition-all duration-200 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto mb-4 text-white">
                  <CheckIcon />
                </div>

                <h2 className="text-3xl font-light text-ink mb-2">
                  Analysis <span className="text-gradient-gold">complete</span>
                </h2>

                <p className="text-graphite mb-8">
                  We&apos;ve found the optimal packages for your profile
                </p>
              </div>

              <div className="grid gap-4 mb-8">
                {/* Results Cards */}
                <div className="bg-white border border-fog p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-silver mb-1">Best Rate</div>
                      <div className="text-2xl text-gradient-gold font-mono">
                        <AnimatedCounter end={1.35} suffix="%" duration={1500} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-silver mb-1">Monthly Payment</div>
                      <div className="text-2xl text-graphite font-mono">
                        $<AnimatedCounter end={2450} duration={2000} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-silver mb-1">Total Savings</div>
                      <div className="text-2xl text-gradient-gold font-mono">
                        $<AnimatedCounter end={34560} duration={2500} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Recommended Bank', value: 'DBS' },
                    { label: 'Package Type', value: 'Fixed 2Y' },
                    { label: 'Lock-in Period', value: '2 years' },
                    { label: 'Processing Time', value: '14 days' }
                  ].map((item, index) => (
                    <div key={index} className="p-3 bg-mist">
                      <div className="text-xs text-silver mb-1">{item.label}</div>
                      <div className="text-sm font-semibold text-graphite">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  Connect with AI Advisor
                  <ChevronRight />
                </button>
                <button className="h-12 px-8 bg-transparent text-charcoal border border-fog hover:bg-mist hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  Download Full Report (PDF)
                </button>
              </div>

              <p className="text-xs text-silver mt-4">
                An AI mortgage specialist will contact you within 24 hours
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}