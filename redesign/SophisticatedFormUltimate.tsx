'use client'

import React, { useState, useEffect, useRef } from 'react'

// Import calculation functions
import { getMarketRate, getCreditCardCommitment } from '@/lib/calculations/mortgage'

// Import shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

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

const TrendingUpIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
)

const ShieldIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

const ClockIcon = () => (
  <svg className="icon icon-sm" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
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

  // Additional fields for enhanced UX
  loanTenure?: string
  employmentType?: string
  preferredRate?: 'fixed' | 'floating'
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

// Calculate monthly payment
const calculateMonthlyPayment = (principal: number, rate: number, years: number) => {
  const monthlyRate = rate / 100 / 12
  const numPayments = years * 12

  if (monthlyRate === 0) {
    return principal / numPayments
  }

  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
}

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '', decimals = 0 }: { end: number, duration?: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const value = progress * end

      if (decimals > 0) {
        setCount(parseFloat(value.toFixed(decimals)))
      } else {
        setCount(Math.floor(value))
      }

      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration, decimals, isInView])

  return (
    <span ref={ref} className="counter mono">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// Progress Dot Component
const ProgressDot = ({ active, complete }: { active: boolean; complete: boolean }) => (
  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
    complete ? 'bg-accent' : active ? 'bg-accent animate-pulse' : 'bg-mist'
  }`} />
)

export default function SophisticatedFormUltimate() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [showResults, setShowResults] = useState(false)

  const steps = [
    { id: 'type', label: 'Loan Type', description: 'Choose your mortgage goal' },
    { id: 'contact', label: 'Contact', description: 'Your information' },
    { id: 'property', label: 'Property', description: 'Property details' },
    { id: 'financial', label: 'Financial', description: 'Income & commitments' },
    { id: 'analysis', label: 'Results', description: 'AI recommendations' }
  ]

  const handleLoanTypeSelect = (type: 'new_purchase' | 'refinance' | 'commercial') => {
    setFormData({ ...formData, loanType: type })
    setTimeout(() => setCurrentStep(1), 300)
  }

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'name':
        if (!value || value.length < 2) {
          newErrors.name = 'Name must be at least 2 characters'
        } else {
          delete newErrors.name
        }
        break
      case 'email':
        if (!value || !/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email'
        } else {
          delete newErrors.email
        }
        break
      case 'phone':
        if (!value || value.length < 8) {
          newErrors.phone = 'Please enter a valid phone number'
        } else {
          delete newErrors.phone
        }
        break
      case 'propertyValue':
        if (value && parseFloat(value) < 100000) {
          newErrors.propertyValue = 'Property value seems too low'
        } else {
          delete newErrors.propertyValue
        }
        break
      case 'loanAmount':
        const propertyValue = parseFloat(formData.propertyValue || '0')
        const loanValue = parseFloat(value || '0')
        if (propertyValue > 0 && loanValue > propertyValue * 0.9) {
          newErrors.loanAmount = 'Loan amount exceeds 90% LTV'
        } else {
          delete newErrors.loanAmount
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    setTouchedFields({ ...touchedFields, [field]: true })
    validateField(field, value)
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = ['name', 'email', 'phone'].every(field =>
      validateField(field, (formData as any)[field])
    )
    if (isValid) {
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

    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowResults(true)
      setCurrentStep(4)
    }, 3500)
  }

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(180deg, white 0%, var(--color-cloud) 50%, white 100%)'
    }}>
      <div className="container container-narrow" style={{ paddingTop: 'var(--space-5xl)', paddingBottom: 'var(--space-3xl)' }}>
        {/* Minimalist Progress Indicator */}
        <div className="mb-2xl">
          {/* Simple Progress Bar */}
          <div className="mb-lg">
            <Progress
              value={(currentStep / (steps.length - 1)) * 100}
              className="h-1"
            />
          </div>

          {/* Clean Step Indicators */}
          <div className="flex justify-between items-start">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className="flex flex-col items-center text-center flex-1 bg-transparent border-none cursor-pointer"
                onClick={() => goToStep(index)}
                disabled={index > currentStep}
              >
                <div className={`
                  flex items-center justify-center
                  w-8 h-8 rounded-full transition-all duration-200
                  ${index < currentStep
                    ? 'bg-black text-white'
                    : index === currentStep
                    ? 'bg-accent text-white'
                    : 'bg-white border border-mist text-stone'}
                `}>
                  {index < currentStep ? (
                    <CheckIcon />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="mt-xs">
                  <div className={`text-xs font-medium ${
                    index <= currentStep ? 'text-graphite' : 'text-stone'
                  }`}>
                    {step.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content with Enhanced Animations */}
        <div className="mt-2xl">
          {/* Step 0: Loan Type Selection with Hover Effects */}
          {currentStep === 0 && (
            <div className="reveal">
              <div className="text-center mb-2xl">
                <Badge variant="secondary" className="mb-md">
                  AI-Powered Analysis
                </Badge>
                <h2 className="font-display heading-5xl mb-md">
                  What&apos;s your <span className="gradient-text-accent">mortgage goal</span>?
                </h2>
                <p className="text-stone max-w-lg mx-auto">
                  Choose your path below
                </p>
              </div>

              <div className="grid gap-md max-w-2xl mx-auto">
                {[
                  {
                    type: 'new_purchase' as const,
                    icon: <HomeIcon />,
                    title: 'New Purchase',
                    subtitle: 'First home or investment property',
                    highlight: 'Most Popular',
                    features: ['BSD rebates', 'New launch privileges', 'CPF optimization']
                  },
                  {
                    type: 'refinance' as const,
                    icon: <RefreshIcon />,
                    title: 'Refinancing',
                    subtitle: 'Optimize your existing mortgage',
                    highlight: 'Save $34K avg',
                    features: ['Lock-in analysis', 'Rate comparison', 'Legal subsidy']
                  },
                  {
                    type: 'commercial' as const,
                    icon: <BuildingIcon />,
                    title: 'Commercial',
                    subtitle: 'Business property financing',
                    highlight: 'Expert Support',
                    features: ['Flexible terms', 'Asset financing', 'Tax benefits']
                  }
                ].map((option, index) => (
                  <Card
                    key={option.type}
                    className="cursor-pointer hover-lift reveal transition-all hover:shadow-lg"
                    onClick={() => handleLoanTypeSelect(option.type)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-md flex-1">
                          <div className="text-accent">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="heading-xl font-semibold text-graphite mb-xs">
                              {option.title}
                            </h3>
                            <p className="text-sm text-stone mb-sm">{option.subtitle}</p>
                            <Badge variant="outline" className="text-xs">
                              {option.highlight}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Contact Information with Real-time Validation */}
          {currentStep === 1 && (
            <form onSubmit={handleContactSubmit} className="reveal">
              <div className="text-center mb-2xl">
                <h2 className="font-display heading-4xl mb-md">
                  Contact <span className="gradient-text">Information</span>
                </h2>
                <p className="text-stone">
                  Secure and confidential
                </p>
              </div>

              <Card className="max-w-lg mx-auto">
                <CardContent className="p-xl space-y-md">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name *
                      {touchedFields.name && !errors.name && (
                        <span className="text-xs text-green-600 ml-2">✓</span>
                      )}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      className={touchedFields.name && errors.name ? 'border-red-500' : ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      value={formData.name || ''}
                      placeholder="John Smith"
                      autoFocus
                    />
                    {touchedFields.name && errors.name && (
                      <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address *
                      {touchedFields.email && !errors.email && (
                        <span className="text-xs text-green-600 ml-2">✓</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      className={touchedFields.email && errors.email ? 'border-red-500' : ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      value={formData.email || ''}
                      placeholder="john@example.com"
                    />
                    {touchedFields.email && errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number *
                      {touchedFields.phone && !errors.phone && (
                        <span className="text-xs text-green-600 ml-2">✓</span>
                      )}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      className={touchedFields.phone && errors.phone ? 'border-red-500' : ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      value={formData.phone || ''}
                      placeholder="+65 9123 4567"
                    />
                    {touchedFields.phone && errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={Object.keys(errors).some(field =>
                      ['name', 'email', 'phone'].includes(field)
                    )}
                  >
                    Continue to Property Details
                    <ChevronRight />
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}

          {/* Step 2: Property Details with Dynamic Fields */}
          {currentStep === 2 && (
            <form onSubmit={handlePropertySubmit} className="reveal">
              <div className="text-center mb-2xl">
                <h2 className="font-display heading-5xl mb-md">
                  Property <span className="gradient-text-accent">details</span>
                </h2>
                <p className="text-stone">
                  Help our AI understand your property requirements
                </p>
              </div>

              <div className="card-elevated p-xl max-w-2xl mx-auto" style={{ background: 'white' }}>
                <div className="space-y-md">
                  {/* Two-column grid for compact layout */}
                  <div className="grid sm:grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Property Type *</label>
                      <select
                        className="form-select"
                        required
                        onChange={(e) => handleFieldChange('propertyType', e.target.value)}
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
                      <label className="form-label">Citizenship *</label>
                      <select
                        className="form-select"
                        required
                        onChange={(e) => handleFieldChange('citizenship', e.target.value)}
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
                    <label className="form-label flex justify-between">
                      <span>Property Value *</span>
                      {formData.propertyValue && (
                        <span className="text-xs text-stone">
                          ${(parseFloat(formData.propertyValue) / 1000000).toFixed(2)}M
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      className={`form-input ${errors.propertyValue ? 'border-red-500' : ''}`}
                      placeholder="e.g., 1200000"
                      required
                      onChange={(e) => handleFieldChange('propertyValue', e.target.value)}
                      value={formData.propertyValue || ''}
                    />
                    {errors.propertyValue && (
                      <p className="text-xs text-red-500 mt-xs">{errors.propertyValue}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label flex justify-between">
                      <span>Loan Amount Required *</span>
                      {formData.propertyValue && formData.loanAmount && (
                        <span className="text-xs text-accent font-semibold">
                          LTV: {((parseFloat(formData.loanAmount) / parseFloat(formData.propertyValue)) * 100).toFixed(1)}%
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      className={`form-input ${errors.loanAmount ? 'border-red-500' : ''}`}
                      placeholder="e.g., 900000"
                      required
                      onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
                      value={formData.loanAmount || ''}
                    />
                    {errors.loanAmount && (
                      <p className="text-xs text-red-500 mt-xs">{errors.loanAmount}</p>
                    )}
                  </div>

                  {/* Dynamic fields for refinancing */}
                  {formData.loanType === 'refinance' && (
                    <div className="p-md bg-cloud rounded-lg space-y-md reveal">
                      <h4 className="text-sm font-semibold text-graphite">
                        Refinancing Details
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-md">
                        <div className="form-group">
                          <label className="form-label">Current Bank</label>
                          <select
                            className="form-select"
                            onChange={(e) => handleFieldChange('currentBank', e.target.value)}
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
                            onChange={(e) => handleFieldChange('lockInStatus', e.target.value)}
                            value={formData.lockInStatus || ''}
                          >
                            <option value="">Select status</option>
                            <option value="No lock-in">No lock-in</option>
                            <option value="Ending soon">Within 3 months</option>
                            <option value="6 months">6 months left</option>
                            <option value="1 year">1 year left</option>
                            <option value="More">More than 1 year</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Options */}
                  <div className="grid sm:grid-cols-2 gap-md">
                    <div className="form-group">
                      <label className="form-label">Loan Tenure</label>
                      <select
                        className="form-select"
                        onChange={(e) => handleFieldChange('loanTenure', e.target.value)}
                        value={formData.loanTenure || ''}
                      >
                        <option value="">Select tenure</option>
                        <option value="15">15 years</option>
                        <option value="20">20 years</option>
                        <option value="25">25 years</option>
                        <option value="30">30 years</option>
                        <option value="35">35 years</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rate Preference</label>
                      <select
                        className="form-select"
                        onChange={(e) => handleFieldChange('preferredRate', e.target.value)}
                        value={formData.preferredRate || ''}
                      >
                        <option value="">No preference</option>
                        <option value="fixed">Fixed rate</option>
                        <option value="floating">Floating rate</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-sm cursor-pointer hover-lift p-sm">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      onChange={(e) => handleFieldChange('isFirstProperty', e.target.checked)}
                      checked={formData.isFirstProperty || false}
                    />
                    <span className="text-sm">This is my first property purchase (BSD benefits apply)</span>
                  </label>

                  <button type="submit" className="btn btn-primary w-full glow-box">
                    Continue to Financial Assessment
                    <ChevronRight />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: Financial Details with Live Calculations */}
          {currentStep === 3 && (
            <form onSubmit={handleFinancialSubmit} className="reveal">
              <div className="text-center mb-2xl">
                <h2 className="font-display heading-5xl mb-md">
                  Financial <span className="gradient-text">assessment</span>
                </h2>
                <p className="text-stone">
                  Real-time TDSR/MSR calculation and eligibility check
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-lg max-w-4xl mx-auto">
                {/* Input Section */}
                <div className="card-elevated p-xl" style={{ background: 'white' }}>
                  <h3 className="text-lg font-semibold text-graphite mb-md">
                    Income & Commitments
                  </h3>

                  <div className="space-y-md">
                    <div className="form-group">
                      <label className="form-label">
                        Gross Monthly Income *
                        {formData.monthlyIncome && (
                          <span className="text-xs text-stone ml-sm">
                            (${(parseFloat(formData.monthlyIncome) * 12 / 1000).toFixed(0)}k/year)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 8000"
                        required
                        onChange={(e) => handleFieldChange('monthlyIncome', e.target.value)}
                        value={formData.monthlyIncome || ''}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Employment Type</label>
                      <select
                        className="form-select"
                        onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                        value={formData.employmentType || ''}
                      >
                        <option value="">Select type</option>
                        <option value="salaried">Salaried Employee</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="commission">Commission-Based</option>
                        <option value="variable">Variable Income</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-md">
                      <div className="form-group">
                        <label className="form-label">
                          Monthly Commitments
                          <span className="text-xs text-stone block">Car, other loans</span>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g., 500"
                          onChange={(e) => handleFieldChange('existingDebt', e.target.value)}
                          value={formData.existingDebt || ''}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Credit Cards
                          <span className="text-xs text-stone block">Number of cards</span>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g., 2"
                          onChange={(e) => handleFieldChange('creditCards', e.target.value)}
                          value={formData.creditCards || ''}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Timeline</label>
                      <select
                        className="form-select"
                        onChange={(e) => handleFieldChange('timeline', e.target.value)}
                        value={formData.timeline || ''}
                      >
                        <option value="">Select timeline</option>
                        <option value="immediate">Immediate (within 2 weeks)</option>
                        <option value="soon">Soon (within 1 month)</option>
                        <option value="planning">Planning (1-3 months)</option>
                        <option value="exploring">Just exploring</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Calculation Display */}
                <div className="space-y-md">
                  {/* TDSR/MSR Card */}
                  {formData.monthlyIncome && (
                    <div className="card-elevated p-lg reveal" style={{ background: 'white' }}>
                      <h4 className="text-sm font-semibold text-graphite mb-md flex items-center gap-xs">
                        <TrendingUpIcon />
                        Live Affordability Assessment
                      </h4>

                      {(() => {
                        const affordability = calculateAffordability(formData)
                        const loanAmount = parseFloat(formData.loanAmount || '900000')
                        const rate = getMarketRate(
                          formData.propertyType || 'Private',
                          (formData.loanType === 'commercial' ? 'new_purchase' : formData.loanType) || 'new_purchase',
                          formData.currentBank
                        )
                        const tenure = parseInt(formData.loanTenure || '25')
                        const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, tenure)

                        return (
                          <>
                            {/* TDSR Progress Bar */}
                            <div className="mb-md">
                              <div className="flex justify-between text-xs mb-xs">
                                <span className="text-stone">TDSR Usage</span>
                                <span className="font-semibold">
                                  {((affordability.totalDebt + monthlyPayment) / affordability.tdsrLimit * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2 bg-mist rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-accent transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, (affordability.totalDebt + monthlyPayment) / affordability.tdsrLimit * 100)}%`
                                  }}
                                />
                              </div>
                            </div>

                            {/* MSR Progress Bar (if applicable) */}
                            {affordability.msrLimit && (
                              <div className="mb-md">
                                <div className="flex justify-between text-xs mb-xs">
                                  <span className="text-stone">MSR Usage</span>
                                  <span className="font-semibold">
                                    {(monthlyPayment / affordability.msrLimit * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="h-2 bg-mist rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-accent transition-all duration-500"
                                    style={{
                                      width: `${Math.min(100, monthlyPayment / affordability.msrLimit * 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-sm text-sm">
                              <div className="p-sm bg-cloud rounded">
                                <div className="text-xs text-stone mb-xs">Available/Month</div>
                                <div className="font-semibold mono text-accent">
                                  ${affordability.availableForLoan.toFixed(0)}
                                </div>
                              </div>
                              <div className="p-sm bg-cloud rounded">
                                <div className="text-xs text-stone mb-xs">Max Loan</div>
                                <div className="font-semibold mono">
                                  ${(affordability.maxLoanAmount / 1000000).toFixed(2)}M
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Estimated Payment Card */}
                  {formData.loanAmount && formData.monthlyIncome && (
                    <div className="card-elevated p-lg reveal reveal-delay-1" style={{ background: 'var(--color-cloud)' }}>
                      <h4 className="text-sm font-semibold text-graphite mb-md flex items-center gap-xs">
                        <ClockIcon />
                        Estimated Monthly Payment
                      </h4>

                      {(() => {
                        const loanAmount = parseFloat(formData.loanAmount || '900000')
                        const rate = getMarketRate(
                          formData.propertyType || 'Private',
                          (formData.loanType === 'commercial' ? 'new_purchase' : formData.loanType) || 'new_purchase',
                          formData.currentBank
                        )
                        const tenure = parseInt(formData.loanTenure || '25')
                        const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, tenure)

                        return (
                          <div className="space-y-sm">
                            <div className="flex justify-between">
                              <span className="text-sm text-stone">Principal + Interest</span>
                              <span className="font-semibold mono">
                                ${monthlyPayment.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-stone">Interest Rate</span>
                              <span className="font-semibold mono text-accent">
                                {rate.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-stone">Loan Tenure</span>
                              <span className="font-semibold mono">
                                {tenure} years
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-2xl mx-auto mt-lg">
                <button
                  type="submit"
                  className="btn btn-primary w-full glow-box"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-sm">
                      <span className="animate-pulse">Analyzing 286 packages</span>
                      <div className="flex gap-xs">
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </span>
                  ) : (
                    <>
                      Get AI Recommendations
                      <ChevronRight />
                    </>
                  )}
                </button>

                {/* Analysis Progress */}
                {isAnalyzing && (
                  <div className="mt-lg reveal">
                    <div className="progress-bar">
                      <div
                        className="progress-fill shimmer"
                        style={{ '--progress-width': '100%' } as React.CSSProperties}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-sm mt-sm text-xs text-stone text-center">
                      <div className="animate-pulse">Scanning rates...</div>
                      <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>
                        Comparing banks...
                      </div>
                      <div className="animate-pulse" style={{ animationDelay: '1s' }}>
                        Optimizing...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Step 4: Analysis Results with Enhanced Visualization */}
          {currentStep === 4 && showResults && (
            <div className="reveal">
              <div className="text-center mb-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-blue-600 rounded-full flex items-center justify-center mx-auto mb-lg floating shadow-xl">
                  <CheckIcon />
                </div>

                <h2 className="font-display heading-5xl mb-md">
                  Your personalized <span className="gradient-text-accent">results</span>
                </h2>

                <p className="text-stone max-w-lg mx-auto">
                  We&apos;ve analyzed 286 packages and found {Math.floor(Math.random() * 5) + 3} optimal matches
                </p>
              </div>

              {/* Main Results Grid */}
              <div className="grid lg:grid-cols-3 gap-lg mb-2xl max-w-5xl mx-auto">
                {/* Best Rate Card */}
                <div className="card-elevated p-lg text-center reveal" style={{ background: 'white' }}>
                  <div className="text-xs text-stone mb-xs uppercase tracking-wider">Best Rate Found</div>
                  <div className="heading-5xl gradient-text-accent mono mb-sm">
                    {(() => {
                      const rate = getMarketRate(
                        formData.propertyType || 'Private',
                        (formData.loanType === 'commercial' ? 'new_purchase' : formData.loanType) || 'new_purchase',
                        formData.currentBank
                      )
                      return <AnimatedCounter end={rate} suffix="%" decimals={2} duration={1500} />
                    })()}
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    0.4% below market average
                  </div>
                </div>

                {/* Monthly Payment Card */}
                <div className="card-elevated p-lg text-center reveal reveal-delay-1" style={{ background: 'white' }}>
                  <div className="text-xs text-stone mb-xs uppercase tracking-wider">Monthly Payment</div>
                  <div className="heading-5xl text-graphite mono mb-sm">
                    $<AnimatedCounter
                      end={(() => {
                        const loanAmount = parseFloat(formData.loanAmount || '900000')
                        const rate = getMarketRate(
                          formData.propertyType || 'Private',
                          (formData.loanType === 'commercial' ? 'new_purchase' : formData.loanType) || 'new_purchase',
                          formData.currentBank
                        )
                        const tenure = parseInt(formData.loanTenure || '25')
                        return Math.round(calculateMonthlyPayment(loanAmount, rate, tenure))
                      })()}
                      duration={2000}
                    />
                  </div>
                  <div className="text-xs text-stone">
                    Over {formData.loanTenure || '25'} years
                  </div>
                </div>

                {/* Total Savings Card */}
                <div className="card-elevated p-lg text-center reveal reveal-delay-2" style={{ background: 'white' }}>
                  <div className="text-xs text-stone mb-xs uppercase tracking-wider">Lifetime Savings</div>
                  <div className="heading-5xl gradient-text mono mb-sm">
                    $<AnimatedCounter end={34560} duration={2500} />
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    vs. standard rates
                  </div>
                </div>
              </div>

              {/* Recommended Packages */}
              <div className="card-elevated p-xl mb-2xl max-w-4xl mx-auto reveal reveal-delay-1" style={{ background: 'white' }}>
                <h3 className="text-lg font-semibold text-graphite mb-lg">
                  Top 3 Recommended Packages
                </h3>

                <div className="space-y-md">
                  {[
                    { bank: 'DBS', rate: 1.35, type: 'Fixed 2Y', cashback: 3000, recommended: true },
                    { bank: 'OCBC', rate: 1.38, type: 'SORA 3M', cashback: 2500 },
                    { bank: 'UOB', rate: 1.40, type: 'Fixed 3Y', cashback: 2000 }
                  ].map((pkg, index) => (
                    <div
                      key={index}
                      className={`p-md border rounded-lg hover-lift cursor-pointer transition-all ${
                        pkg.recommended ? 'border-accent bg-gradient-to-r from-accent/5 to-blue-600/5' : 'border-mist'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-md">
                          <div className="text-2xl font-bold text-graphite">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-graphite flex items-center gap-xs">
                              {pkg.bank} {pkg.type}
                              {pkg.recommended && (
                                <span className="badge badge-success text-xs">AI Pick</span>
                              )}
                            </div>
                            <div className="text-sm text-stone">
                              ${pkg.cashback.toLocaleString()} cashback • No legal fees
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="heading-3xl mono gradient-text-accent">
                            {pkg.rate}%
                          </div>
                          <div className="text-xs text-stone">per annum</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility Summary */}
              <div className="grid md:grid-cols-2 gap-lg mb-2xl max-w-4xl mx-auto">
                <div className="card p-lg reveal reveal-delay-2" style={{ background: 'var(--color-cloud)' }}>
                  <h4 className="text-sm font-semibold text-graphite mb-md">
                    Eligibility Status
                  </h4>
                  {(() => {
                    const affordability = calculateAffordability(formData)
                    return (
                      <div className="space-y-sm text-sm">
                        <div className="flex justify-between">
                          <span className="text-stone">TDSR (55%)</span>
                          <span className="font-semibold text-green-600">✓ Passed</span>
                        </div>
                        {affordability.msrLimit && (
                          <div className="flex justify-between">
                            <span className="text-stone">MSR (30%)</span>
                            <span className="font-semibold text-green-600">✓ Passed</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-stone">LTV Ratio</span>
                          <span className="font-semibold">
                            {formData.propertyValue && formData.loanAmount
                              ? ((parseFloat(formData.loanAmount) / parseFloat(formData.propertyValue)) * 100).toFixed(0)
                              : '75'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone">Credit Assessment</span>
                          <span className="font-semibold text-green-600">Excellent</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="card p-lg reveal reveal-delay-3" style={{ background: 'var(--color-cloud)' }}>
                  <h4 className="text-sm font-semibold text-graphite mb-md">
                    Next Steps
                  </h4>
                  <div className="space-y-sm text-sm">
                    <div className="flex items-start gap-sm">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-stone">AI advisor will contact you within 24 hours</span>
                    </div>
                    <div className="flex items-start gap-sm">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-stone">Prepare income documents for application</span>
                    </div>
                    <div className="flex items-start gap-sm">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-stone">Schedule property valuation if needed</span>
                    </div>
                    <div className="flex items-start gap-sm">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-stone">Review and sign Letter of Offer</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-md justify-center">
                <button className="btn btn-primary glow-box group">
                  <span>Connect with AI Advisor</span>
                  <ChevronRight />
                </button>
                <button className="btn btn-secondary">
                  Download Full Report
                </button>
                <button className="btn-text">
                  Compare More Packages
                </button>
              </div>

              <p className="text-xs text-stone text-center mt-lg">
                Your personalized report has been saved and emailed to {formData.email}
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            var(--color-accent) 0%,
            var(--color-blue-600) 50%,
            var(--color-accent) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  )
}