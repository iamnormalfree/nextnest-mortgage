'use client'

import React, { useState } from 'react'

// Import shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

// Import calculation functions
import { getPlaceholderRate } from '@/lib/calculations/archive/2025-10/mortgage'

// Simple helper for credit card debt calculation (3.5% of card limit per MAS)
const getCreditCardCommitment = (creditCards: string): number => {
  const numCards = parseFloat(creditCards || '0')
  // Assume average $10,000 credit limit per card, 3.5% minimum payment
  return numCards * 10000 * 0.035
}

// Minimal icon components
const ChevronRight = () => (
  <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const Check = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

interface FormData {
  // Step 0
  loanType?: 'new' | 'refinance'

  // Step 1
  name?: string
  email?: string
  phone?: string

  // Step 2
  propertyType?: string
  propertyValue?: string
  loanAmount?: string

  // Step 3
  monthlyIncome?: string
  existingDebt?: string
  creditCards?: string
}

export default function MinimalSophisticatedForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const steps = ['Type', 'Contact', 'Property', 'Financial', 'Results']

  const handleNext = () => {
    if (currentStep === 3) {
      setIsAnalyzing(true)
      setTimeout(() => {
        setIsAnalyzing(false)
        setCurrentStep(4)
      }, 2000)
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  // Calculate affordability
  const calculateAffordability = () => {
    const monthlyIncome = parseFloat(formData.monthlyIncome || '0')
    const existingDebt = parseFloat(formData.existingDebt || '0')
    const creditCardDebt = getCreditCardCommitment(formData.creditCards || '0')

    const tdsrLimit = monthlyIncome * 0.55
    const totalDebt = existingDebt + creditCardDebt
    const availableForLoan = Math.max(0, tdsrLimit - totalDebt)

    return {
      monthlyIncome,
      tdsrLimit,
      totalDebt,
      availableForLoan,
      maxLoanAmount: availableForLoan * 12 * 25
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-2xl mx-auto px-4 py-16">

        {/* Minimal Progress Bar */}
        <div className="mb-12">
          <Progress
            value={(currentStep / (steps.length - 1)) * 100}
            className="h-0.5 mb-6"
          />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <button
                key={step}
                onClick={() => index < currentStep && setCurrentStep(index)}
                className="text-xs font-medium tracking-wide uppercase transition-colors"
                style={{
                  color: index <= currentStep ? 'var(--color-graphite)' : 'var(--color-stone)',
                  cursor: index < currentStep ? 'pointer' : 'default'
                }}
              >
                {step}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">

          {/* Step 0: Loan Type */}
          {currentStep === 0 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center">
                <h2 className="text-3xl font-light mb-2">
                  Choose your path
                </h2>
                <p className="text-sm text-stone">
                  New purchase or refinancing
                </p>
              </div>

              <div className="grid gap-4">
                <Card
                  className="cursor-pointer border-mist hover:border-graphite transition-colors"
                  onClick={() => {
                    updateField('loanType', 'new')
                    handleNext()
                  }}
                >
                  <CardContent className="py-6">
                    <h3 className="font-medium mb-1">New Purchase</h3>
                    <p className="text-sm text-stone">First home or investment</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer border-mist hover:border-graphite transition-colors"
                  onClick={() => {
                    updateField('loanType', 'refinance')
                    handleNext()
                  }}
                >
                  <CardContent className="py-6">
                    <h3 className="font-medium mb-1">Refinancing</h3>
                    <p className="text-sm text-stone">Optimize existing mortgage</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 1: Contact */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center">
                <h2 className="text-3xl font-light mb-2">
                  Contact details
                </h2>
                <p className="text-sm text-stone">
                  We&apos;ll keep this confidential
                </p>
              </div>

              <Card className="border-0 shadow-none">
                <CardContent className="space-y-6 p-0">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-wide text-stone">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                      placeholder="John Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wide text-stone">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wide text-stone">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                      placeholder="+65 9123 4567"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Property */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center">
                <h2 className="text-3xl font-light mb-2">
                  Property details
                </h2>
                <p className="text-sm text-stone">
                  Help us understand your needs
                </p>
              </div>

              <Card className="border-0 shadow-none">
                <CardContent className="space-y-6 p-0">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-stone">
                      Property Type
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['HDB', 'Condo', 'Landed', 'Commercial'].map((type) => (
                        <Button
                          key={type}
                          variant={formData.propertyType === type ? 'default' : 'outline'}
                          className="h-auto py-3"
                          onClick={() => updateField('propertyType', type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-xs uppercase tracking-wide text-stone">
                      Property Value
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.propertyValue || ''}
                      onChange={(e) => updateField('propertyValue', e.target.value)}
                      className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                      placeholder="1,200,000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loan" className="text-xs uppercase tracking-wide text-stone">
                      Loan Amount
                    </Label>
                    <Input
                      id="loan"
                      type="number"
                      value={formData.loanAmount || ''}
                      onChange={(e) => updateField('loanAmount', e.target.value)}
                      className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                      placeholder="900,000"
                    />
                    {formData.propertyValue && formData.loanAmount && (
                      <p className="text-xs text-stone">
                        LTV: {((parseFloat(formData.loanAmount) / parseFloat(formData.propertyValue)) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Financial */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center">
                <h2 className="text-3xl font-light mb-2">
                  Financial assessment
                </h2>
                <p className="text-sm text-stone">
                  Calculate your eligibility
                </p>
              </div>

              <Card className="border-0 shadow-none">
                <CardContent className="space-y-6 p-0">
                  <div className="space-y-2">
                    <Label htmlFor="income" className="text-xs uppercase tracking-wide text-stone">
                      Monthly Income
                    </Label>
                    <Input
                      id="income"
                      type="number"
                      value={formData.monthlyIncome || ''}
                      onChange={(e) => updateField('monthlyIncome', e.target.value)}
                      className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                      placeholder="8,000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="debt" className="text-xs uppercase tracking-wide text-stone">
                        Monthly Commitments
                      </Label>
                      <Input
                        id="debt"
                        type="number"
                        value={formData.existingDebt || ''}
                        onChange={(e) => updateField('existingDebt', e.target.value)}
                        className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                        placeholder="500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cards" className="text-xs uppercase tracking-wide text-stone">
                        Credit Cards
                      </Label>
                      <Input
                        id="cards"
                        type="number"
                        value={formData.creditCards || ''}
                        onChange={(e) => updateField('creditCards', e.target.value)}
                        className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
                        placeholder="2"
                      />
                    </div>
                  </div>

                  {/* Live TDSR Calculation */}
                  {formData.monthlyIncome && (
                    <div className="pt-6 border-t">
                      {(() => {
                        const affordability = calculateAffordability()
                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-stone">TDSR Limit (55%)</span>
                              <span className="font-mono">${affordability.tdsrLimit.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone">Available for Loan</span>
                              <span className="font-mono font-medium">${affordability.availableForLoan.toFixed(0)}</span>
                            </div>
                            <Progress
                              value={(affordability.totalDebt / affordability.tdsrLimit) * 100}
                              className="h-1"
                            />
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-6">
                  <Check />
                </div>
                <h2 className="text-3xl font-light mb-2">
                  Analysis complete
                </h2>
                <p className="text-sm text-stone">
                  Your personalized recommendations
                </p>
              </div>

              <div className="grid gap-6">
                {/* Best Rate */}
                <Card className="border-mist">
                  <CardContent className="py-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone mb-1">Best Rate Found</p>
                        <p className="text-2xl font-light">
                          {getPlaceholderRate(
                            formData.propertyType || 'Private',
                            formData.loanType === 'refinance' ? 'refinance' : 'new_purchase'
                          ).toFixed(2)}%
                        </p>
                      </div>
                      <Badge variant="outline">DBS</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Payment */}
                <Card className="border-mist">
                  <CardContent className="py-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone mb-1">Monthly Payment</p>
                        <p className="text-2xl font-light font-mono">
                          ${Math.round(parseFloat(formData.loanAmount || '900000') / 360).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-stone">30 years</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Savings */}
                <Card className="border-mist">
                  <CardContent className="py-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone mb-1">Total Savings</p>
                        <p className="text-2xl font-light font-mono">
                          $34,560
                        </p>
                      </div>
                      <span className="text-xs text-green-600">vs market rate</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-6">
                <Button className="w-full" size="lg">
                  Connect with AI Advisor
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-12">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-stone"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : currentStep === 3 ? 'Get Results' : 'Continue'}
              {!isAnalyzing && <ChevronRight />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}