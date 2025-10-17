/**
 * ARCHIVED: 2025-10-17
 *
 * REASON FOR ARCHIVAL:
 * This simple standalone calculator component was used for marketing campaigns
 * (Reddit, LinkedIn, HardwareZone) but is no longer needed as campaigns are being discontinued.
 *
 * DEPENDENCIES:
 * - Uses lib/calculations/mortgage.ts (legacy calculator, also being archived)
 * - Used by: app/campaigns/* and app/calculators/* (all archived)
 *
 * REPLACED BY:
 * The main application now uses:
 * - components/forms/ProgressiveFormWithController.tsx (production form)
 * - lib/calculations/instant-profile.ts (Dr Elena v2 calculations)
 *
 * MIGRATION NOTE:
 * If simple calculator is needed in future, extract the UI and wire it to
 * instant-profile.ts instead of the legacy mortgage.ts calculator.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { calculateMortgageWithMetrics, MORTGAGE_SCENARIOS, calculateLeadScore } from '@/lib/calculations/mortgage'
import type { MortgageInput, LeadCaptureData } from '@/types/mortgage'

// Configuration interface for platform-specific customization
interface CalculatorConfig {
  // Campaign attribution
  source: string
  campaign: string
  utmParams?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
  }
  
  // UI customization
  title?: string
  subtitle?: string
  defaultScenario?: keyof typeof MORTGAGE_SCENARIOS
  showQuickScenarios?: boolean
  
  // Behavioral customization  
  savingsThreshold?: number // Minimum savings to show lead form
  webhookUrl?: string // Override webhook URL for campaign-specific endpoints
}

interface Props {
  config: CalculatorConfig
}

const SingaporeMortgageCalculator = ({ config }: Props) => {
  const [results, setResults] = useState<any>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  // Set defaults from config
  const {
    source,
    campaign,
    utmParams = {},
    title = "Singapore Mortgage Calculator",
    subtitle = "AI-powered analysis with TDSR/MSR calculations and all bank packages compared",
    defaultScenario,
    showQuickScenarios = true,
    savingsThreshold = 100
  } = config

  // Main calculator form
  const {
    register: registerCalc,
    handleSubmit: handleCalculate,
    setValue,
    watch,
    formState: { errors: calcErrors }
  } = useForm<MortgageInput>({
    defaultValues: {
      loanAmount: defaultScenario ? MORTGAGE_SCENARIOS[defaultScenario].loanAmount : 500000,
      interestRate: defaultScenario ? MORTGAGE_SCENARIOS[defaultScenario].interestRate : 2.5,
      loanTerm: defaultScenario ? MORTGAGE_SCENARIOS[defaultScenario].loanTerm : 25,
      propertyValue: defaultScenario ? MORTGAGE_SCENARIOS[defaultScenario].propertyValue : 625000,
      propertyType: defaultScenario ? MORTGAGE_SCENARIOS[defaultScenario].propertyType : 'HDB',
      monthlyIncome: 8000,
      existingDebt: 0
    }
  })

  // Lead capture form  
  const {
    register: registerLead,
    handleSubmit: handleLeadSubmit,
    formState: { errors: leadErrors }
  } = useForm<LeadCaptureData & { currentBank?: string }>()

  const watchedValues = watch()

  // Quick scenario buttons
  const setQuickScenario = (scenarioKey: keyof typeof MORTGAGE_SCENARIOS) => {
    const scenario = MORTGAGE_SCENARIOS[scenarioKey]
    setValue('loanAmount', scenario.loanAmount)
    setValue('interestRate', scenario.interestRate)
    setValue('loanTerm', scenario.loanTerm)
    setValue('propertyValue', scenario.propertyValue)
    setValue('propertyType', scenario.propertyType)
  }

  const onCalculate = (data: MortgageInput) => {
    setIsCalculating(true)
    
    setTimeout(() => {
      // Convert form string values to numbers for Zod validation
      const processedData = {
        ...data,
        loanAmount: Number(data.loanAmount),
        interestRate: Number(data.interestRate),
        loanTerm: Number(data.loanTerm),
        propertyValue: Number(data.propertyValue),
        monthlyIncome: Number(data.monthlyIncome) || 0,
        existingDebt: Number(data.existingDebt) || 0
      }
      
      const calculationResults = calculateMortgageWithMetrics(processedData)
      setResults(calculationResults)
      setIsCalculating(false)
      
      // Show lead form if significant savings potential
      if (calculationResults.potentialSavings && calculationResults.potentialSavings > savingsThreshold) {
        setShowLeadForm(true)
      }
    }, 1000)
  }

  const onSubmitLead = async (leadData: LeadCaptureData & { currentBank?: string }) => {
    try {
      // Calculate enhanced lead score
      const leadInputs: MortgageInput = {
        ...watchedValues,
        ...leadData
      }
      const leadScore = results ? calculateLeadScore(leadInputs, results, false) : 0
      
      // Enhanced webhook data with n8n field mapping
      const webhookData = {
        // Primary fields (REQUIRED - exact field names for n8n)
        loanQuantum: watchedValues.loanAmount, // Critical: n8n expects loanQuantum
        propertyValue: watchedValues.propertyValue,
        propertyType: watchedValues.propertyType, // Must be: 'HDB', 'Private', or 'Commercial'
        timeline: leadData.timeline, // Must be: 'immediate', 'soon', 'planning', or 'exploring'
        
        // Contact fields (REQUIRED)
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        
        // Financial fields (OPTIONAL but recommended)
        currentBank: leadData.currentBank || '',
        monthlyIncome: watchedValues.monthlyIncome,
        existingDebt: watchedValues.existingDebt,
        interestRate: watchedValues.interestRate,
        loanTenure: watchedValues.loanTerm,
        
        // Attribution fields (AUTOMATIC)
        source,
        campaign,
        utmParams,
        timestamp: new Date().toISOString(),
        
        // Lead scoring (ENHANCED)
        leadScore,
        priority: leadScore >= 7 ? 'A' : leadScore >= 4 ? 'B' : 'C',
        
        // Calculation results (INCLUDE ALL)
        calculationResults: {
          monthlyPayment: results?.monthlyPayment || 0,
          totalInterest: results?.totalInterest || 0,
          ltvRatio: results?.ltvRatio || 0,
          tdsr: results?.tdsr || 0,
          msr: results?.msr || 0,
          potentialSavings: results?.potentialSavings || 0,
          refinancingCostBenefit: results?.refinancingCostBenefit || 0,
          breakEvenPeriod: results?.breakEvenMonths || 0,
          masCompliance: {
            tdsrWithinLimit: results?.tdsrCompliant || false,
            msrWithinLimit: results?.msrCompliant || false,
            overallCompliant: results?.overallCompliant || false
          }
        }
      }

      // Use config webhook URL, environment variable, or fallback to API
      const webhookUrl = config.webhookUrl || 
                        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
                        'https://primary-production-1af6.up.railway.app/webhook-test/forms/submit'
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://nextnest.sg'
        },
        body: JSON.stringify(webhookData)
      })

      if (response.ok) {
        setLeadSubmitted(true)
        setShowLeadForm(false)
      } else {
        throw new Error(`Webhook submission failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Webhook submission error:', error)
      // Store lead data locally for retry
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingLead', JSON.stringify({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          timeline: leadData.timeline,
          loanAmount: watchedValues.loanAmount,
          propertyValue: watchedValues.propertyValue
        }))
      }
      // Show manual contact option
      alert('Thank you for your interest! Please call us at +65 8888 8888 for immediate assistance.')
    }
  }

  if (leadSubmitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-mist">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white border border-fog p-8 shadow-sm">
              <div className="w-16 h-16 bg-emerald/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-ink mb-4">
                Analysis Request Submitted!
              </h2>
              <p className="text-graphite mb-6">
                Our AI is analyzing all 286 mortgage packages to find your optimal solution. 
                You&apos;ll receive your complete analysis within 24 hours.
              </p>
              <button
                onClick={() => {setLeadSubmitted(false); setResults(null); setShowLeadForm(false)}}
                className="text-gold hover:text-gold-dark font-medium"
              >
                Calculate another scenario
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto overflow-x-hidden">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-ink mb-4">
              {title}
            </h1>
            <p className="text-lg text-graphite">
              {subtitle}
            </p>
          </div>

          {/* Quick Scenario Buttons */}
          {showQuickScenarios && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-center">Quick Scenarios (Click to Auto-Fill)</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <button
                  onClick={() => setQuickScenario('HDB_FLAT')}
                  className="p-4 border border-fog hover:border-gold hover:bg-gold/5 transition-all"
                >
                  <div className="text-left">
                    <div className="font-medium text-ink">HDB Resale</div>
                    <div className="text-sm text-graphite">$500K property, 80% loan</div>
                  </div>
                </button>
                <button
                  onClick={() => setQuickScenario('PRIVATE_CONDO')}
                  className="p-4 border border-fog hover:border-gold hover:bg-gold/5 transition-all"
                >
                  <div className="text-left">
                    <div className="font-medium text-ink">Private Condo</div>
                    <div className="text-sm text-graphite">$1M property, 80% loan</div>
                  </div>
                </button>
                <button
                  onClick={() => setQuickScenario('COMMERCIAL')}
                  className="p-4 border border-fog hover:border-gold hover:bg-gold/5 transition-all"
                >
                  <div className="text-left">
                    <div className="font-medium text-ink">Commercial</div>
                    <div className="text-sm text-graphite">$2M property, 70% loan</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Centralized Calculator Form - Full Width */}
          <div className="bg-white border border-fog p-8 mb-8">
            <h2 className="text-2xl font-normal text-ink mb-6 text-center">
              Mortgage Details
            </h2>

            <form onSubmit={handleCalculate(onCalculate)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                <div>
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Property Value (SGD)
                  </label>
                  <input
                    {...registerCalc('propertyValue', { 
                      required: 'Property value is required', 
                      min: { value: 100000, message: 'Minimum property value is $100,000' },
                      max: { value: 50000000, message: 'Maximum property value is $50,000,000' }
                    })}
                    type="number"
                    min="100000"
                    max="50000000"
                    step="1000"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                    placeholder="e.g., 800000"
                  />
                  {calcErrors.propertyValue && (
                    <span className="text-ruby text-sm">{calcErrors.propertyValue.message}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Loan Amount (SGD)
                  </label>
                  <input
                    {...registerCalc('loanAmount', { 
                      required: 'Loan amount is required', 
                      min: { value: 50000, message: 'Minimum loan amount is $50,000' },
                      max: { value: 40000000, message: 'Maximum loan amount is $40,000,000' }
                    })}
                    type="number"
                    min="50000"
                    max="40000000"
                    step="1000"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                    placeholder="e.g., 640000"
                  />
                  {calcErrors.loanAmount && (
                    <span className="text-ruby text-sm">{calcErrors.loanAmount.message}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Property Type
                  </label>
                  <select
                    {...registerCalc('propertyType')}
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  >
                    <option value="HDB">HDB (Resale/BTO)</option>
                    <option value="Private">Private Property</option>
                    <option value="Commercial">Commercial Property</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Interest Rate (%)
                  </label>
                  <input
                    {...registerCalc('interestRate', { 
                      required: 'Interest rate is required',
                      min: { value: 0.1, message: 'Interest rate must be at least 0.1%' },
                      max: { value: 15, message: 'Interest rate cannot exceed 15%' }
                    })}
                    type="number"
                    min="0.1"
                    max="15"
                    step="0.01"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                    placeholder="e.g., 2.8"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Loan Term (Years)
                  </label>
                  <select
                    {...registerCalc('loanTerm')}
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Monthly Income (SGD)
                  </label>
                  <input
                    {...registerCalc('monthlyIncome', { min: 0 })}
                    type="number"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                    placeholder="8000"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs uppercase tracking-wider text-silver font-medium mb-2 block">
                    Existing Monthly Debt (SGD)
                  </label>
                  <input
                    {...registerCalc('existingDebt', { min: 0 })}
                    type="number"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalculating}
                className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] w-full disabled:opacity-50"
              >
                {isCalculating ? 'Analyzing Your Options...' : 'Get My Mortgage Analysis'}
              </button>
            </form>
          </div>

          {/* Results Display - Full Width */}
          {isCalculating && (
            <div className="bg-white border border-fog p-8 mb-8">
              <h2 className="text-2xl font-normal text-ink mb-6 text-center">
                Analyzing Your Options...
              </h2>
              <div className="space-y-6">
                {/* Main Payment Skeleton */}
                <div className="animate-pulse">
                  <div className="h-24 bg-fog"></div>
                </div>
                {/* Metrics Skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="animate-pulse">
                    <div className="h-20 bg-fog"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-20 bg-fog"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-20 bg-fog"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-20 bg-fog"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {results && !isCalculating && (
            <div className="bg-white border border-fog p-8 mb-8">
              <h2 className="text-2xl font-normal text-ink mb-6 text-center">
                Your Analysis Results
              </h2>

              <div className="space-y-6">
                {/* Main Payment Highlight */}
                <div className="bg-gold/10 border border-gold p-6">
                  <div className="text-center">
                    <div className="text-xs text-silver uppercase tracking-wider mb-2">Monthly Payment</div>
                    <div className="text-3xl font-mono font-medium text-gradient-gold">
                      ${results.monthlyPayment.toLocaleString('en-SG', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Singapore Metrics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="bg-white border border-fog p-4">
                    <div className="text-xs text-silver uppercase tracking-wider mb-2">LTV Ratio</div>
                    <div className="text-xl font-mono font-medium text-ink">
                      {results.ltvRatio?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white border border-fog p-4">
                    <div className="text-xs text-silver uppercase tracking-wider mb-2">
                      TDSR {results.tdsr && results.tdsr <= 55 ? '✓' : '⚠️'}
                    </div>
                    <div className={`text-xl font-mono font-medium ${results.tdsr && results.tdsr <= 55 ? 'text-emerald' : 'text-ruby'}`}>
                      {results.tdsr?.toFixed(1)}%
                    </div>
                    <div className="text-xs text-silver">Max: 55%</div>
                  </div>
                  <div className="bg-white border border-fog p-4">
                    <div className="text-xs text-silver uppercase tracking-wider mb-2">
                      MSR {results.msr && results.msr <= 30 ? '✓' : '⚠️'}
                    </div>
                    <div className={`text-xl font-mono font-medium ${results.msr && results.msr <= 30 ? 'text-emerald' : 'text-ruby'}`}>
                      {results.msr?.toFixed(1)}%
                    </div>
                    <div className="text-xs text-silver">Max: 30%</div>
                  </div>
                  <div className="bg-white border border-fog p-4">
                    <div className="text-xs text-silver uppercase tracking-wider mb-2">Total Interest</div>
                    <div className="text-xl font-mono font-medium text-ink">
                      ${results.totalInterest.toLocaleString('en-SG', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Potential Savings Highlight */}
                {results.potentialSavings && results.potentialSavings > 50 && (
                  <div className="bg-emerald/5 border-l-4 border-emerald p-6">
                    <h4 className="text-lg font-medium text-ink mb-2">
                      💰 Potential Savings Found!
                    </h4>
                    <p className="text-graphite mb-4">
                      Our analysis shows you could save <strong className="text-emerald">${results.potentialSavings.toFixed(0)}/month</strong>
                      - that&apos;s <strong className="text-emerald">${(results.potentialSavings * 12).toLocaleString()}/year</strong>!
                    </p>
                    {!showLeadForm && (
                      <button
                        onClick={() => setShowLeadForm(true)}
                        className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Get My Complete Analysis →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lead Capture Form - Full Width */}
          {showLeadForm && (
            <div className="bg-gold/5 border-l-4 border-gold p-8 mb-8">
              <h3 className="text-xl font-medium text-ink mb-4 text-center">
                Get Your Complete Mortgage Optimization Report
              </h3>
              <p className="text-graphite mb-6 text-center">
                Our AI will analyze all 286 bank packages to find your optimal solution. Delivered within 24 hours, guaranteed.
              </p>

              <form onSubmit={handleLeadSubmit(onSubmitLead)} className="grid grid-cols-1 gap-4 max-w-4xl mx-auto md:grid-cols-2">
                <div>
                  <input
                    {...registerLead('name', { required: 'Name is required' })}
                    type="text"
                    placeholder="Your full name"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  />
                  {leadErrors.name && <span className="text-ruby text-sm">{leadErrors.name.message}</span>}
                </div>

                <div>
                  <input
                    {...registerLead('phone', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^(\+65)?[689]\d{7}$/,
                        message: 'Please enter a valid Singapore phone number'
                      }
                    })}
                    type="tel"
                    placeholder="+65 9123 4567 or 91234567"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  />
                  {leadErrors.phone && <span className="text-ruby text-sm">{leadErrors.phone.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <input
                    {...registerLead('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    type="email"
                    placeholder="Your email address"
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  />
                  {leadErrors.email && <span className="text-ruby text-sm">{leadErrors.email.message}</span>}
                </div>

                <div>
                  <select
                    {...registerLead('currentBank')}
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  >
                    <option value="">Select current bank (optional)</option>
                    <option value="DBS">DBS Bank</option>
                    <option value="OCBC">OCBC Bank</option>
                    <option value="UOB">UOB</option>
                    <option value="Maybank">Maybank</option>
                    <option value="CIMB">CIMB Bank</option>
                    <option value="Standard Chartered">Standard Chartered</option>
                    <option value="Hong Leong Finance">Hong Leong Finance</option>
                    <option value="HSBC">HSBC</option>
                    <option value="Citibank">Citibank</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <select
                    {...registerLead('timeline', { required: 'Timeline is required' })}
                    className="h-12 px-4 border border-fog focus:border-gold focus:outline-none w-full font-mono"
                  >
                    <option value="">When do you need this?</option>
                    <option value="immediate">Immediate (within 1 month)</option>
                    <option value="soon">Soon (within 3 months)</option>
                    <option value="planning">Planning (3-6 months)</option>
                    <option value="exploring">Just exploring options</option>
                  </select>
                  {leadErrors.timeline && <span className="text-ruby text-sm">{leadErrors.timeline.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      {...registerLead('consent', { required: 'Consent is required' })}
                      type="checkbox"
                      className="w-4 h-4 text-gold border-fog focus:ring-gold"
                    />
                    <span className="text-sm text-graphite">
                      I consent to be contacted about my mortgage optimization opportunities. 
                      NextNest will provide transparent analysis at no cost to me.
                    </span>
                  </label>
                  {leadErrors.consent && <span className="text-ruby text-sm">{leadErrors.consent.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] w-full"
                  >
                    Get My Complete Analysis - Free & Fast →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Trust Indicators - Full Width */}
          <div className="bg-white border border-fog p-8">
            <h3 className="text-2xl font-normal text-ink mb-6 text-center">
              The NextNest Transparency Guarantee
            </h3>
            <p className="text-lg text-graphite mb-6 text-center">
              If we can&apos;t provide clear analysis of ALL your options within 48 hours, 
              we&apos;ll help you connect with your bank&apos;s repricing team - for free.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
              <div className="text-center">
                <div className="text-3xl font-mono font-medium text-gradient-gold">286</div>
                <div className="text-xs text-silver uppercase tracking-wider">Bank packages analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-medium text-emerald">24h</div>
                <div className="text-xs text-silver uppercase tracking-wider">Guaranteed response time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-medium text-gold">$0</div>
                <div className="text-xs text-silver uppercase tracking-wider">Cost to you (banks pay us)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SingaporeMortgageCalculator