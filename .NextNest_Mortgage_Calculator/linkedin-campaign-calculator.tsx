'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// Same interfaces as main calculator
interface MortgageInputs {
  propertyValue: number;
  loanAmount: number;
  interestRate: number;
  loanTenure: number;
  propertyType: 'HDB' | 'Private' | 'Commercial';
  currentBank: string;
  monthlyIncome: number;
  existingDebt: number;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

interface CalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  ltvRatio: number;
  tdsr: number;
  msr: number;
  potentialSavings: number;
  refinancingCostBenefit: number;
  breakEvenPeriod: number;
}

const LinkedInCampaignCalculator: React.FC = () => {
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<MortgageInputs>({
    defaultValues: {
      propertyType: 'Commercial',
      interestRate: 3.8,
      loanTenure: 25,
      currentBank: '',
    }
  });

  // Same calculation logic as main calculator
  const calculateMortgage = (inputs: MortgageInputs): CalculationResult => {
    const principal = inputs.loanAmount;
    const monthlyRate = inputs.interestRate / 100 / 12;
    const numPayments = inputs.loanTenure * 12;

    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalInterest = (monthlyPayment * numPayments) - principal;
    const ltvRatio = (inputs.loanAmount / inputs.propertyValue) * 100;

    const totalDebtService = monthlyPayment + inputs.existingDebt;
    const tdsr = (totalDebtService / inputs.monthlyIncome) * 100;
    const msrLimit = inputs.propertyType === 'HDB' ? 30 : 
                    inputs.propertyType === 'Private' ? 30 : 35;
    const msr = (monthlyPayment / inputs.monthlyIncome) * 100;

    const optimizedRate = inputs.interestRate - 0.4; // Higher optimization for commercial
    const optimizedMonthlyRate = optimizedRate / 100 / 12;
    const optimizedPayment = (principal * optimizedMonthlyRate * Math.pow(1 + optimizedMonthlyRate, numPayments)) / 
                            (Math.pow(1 + optimizedMonthlyRate, numPayments) - 1);
    
    const potentialSavings = monthlyPayment - optimizedPayment;
    const refinancingCosts = inputs.propertyValue * 0.006; // Higher costs for commercial
    const refinancingCostBenefit = (potentialSavings * 12 * inputs.loanTenure) - refinancingCosts;
    const breakEvenPeriod = refinancingCosts / potentialSavings;

    return {
      monthlyPayment,
      totalInterest,
      ltvRatio,
      tdsr,
      msr,
      potentialSavings,
      refinancingCostBenefit,
      breakEvenPeriod
    };
  };

  // LinkedIn B2B-specific quick scenarios
  const setQuickScenario = (scenario: string) => {
    switch (scenario) {
      case 'commercial_property':
        setValue('propertyValue', 3000000);
        setValue('loanAmount', 2100000);
        setValue('propertyType', 'Commercial');
        setValue('interestRate', 4.2);
        break;
      case 'high_value_residential':
        setValue('propertyValue', 2500000);
        setValue('loanAmount', 1750000);
        setValue('propertyType', 'Private');
        setValue('interestRate', 3.5);
        break;
      case 'investment_portfolio':
        setValue('propertyValue', 1800000);
        setValue('loanAmount', 1260000);
        setValue('propertyType', 'Private');
        setValue('interestRate', 3.8);
        break;
    }
  };

  // LinkedIn-specific attribution
  const submitToWebhook = async (data: MortgageInputs) => {
    const webhookData = {
      loanQuantum: data.loanAmount,
      propertyValue: data.propertyValue,
      currentBank: data.currentBank,
      propertyType: data.propertyType,
      timeline: data.timeline,
      monthlyIncome: data.monthlyIncome,
      existingDebt: data.existingDebt,
      
      name: data.name,
      email: data.email,
      phone: data.phone,
      
      // LinkedIn-specific attribution
      source: 'linkedin_campaign',
      campaign: 'linkedin_b2b_commercial',
      referrer: 'linkedin_business_network',
      timestamp: new Date().toISOString(),
      
      clientCalculations: results
    };

    try {
      const response = await fetch('https://your-n8n-instance.com/webhook/nextnest-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      if (response.ok) {
        alert('Your executive analysis request has been submitted! Our team will contact you within 24 hours with comprehensive mortgage optimization strategies.');
      }
    } catch (error) {
      console.error('Webhook submission error:', error);
      alert('Thank you for your interest! Please call us at +65 8888 8888 for immediate executive assistance.');
    }
  };

  const onCalculate = (data: MortgageInputs) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const calculationResults = calculateMortgage(data);
      setResults(calculationResults);
      setIsCalculating(false);
      
      if (calculationResults.potentialSavings > 200) {
        setShowLeadForm(true);
      }
    }, 1000);
  };

  const onSubmitLead = (data: MortgageInputs) => {
    submitToWebhook(data);
    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* LinkedIn B2B headline */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-gilda text-[#1C1C1E] mb-4">
            Commercial Property & Investment
            <span className="text-[#FFB800]"> Finance Optimization</span>
          </h1>
          <p className="text-xl text-[#8E8E93] mb-6">
            Strategic mortgage analysis for business owners and high-net-worth individuals. 
            Optimize cash flow and maximize ROI across your property portfolio.
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-[#059669]">
            <span className="flex items-center">✓ Executive-level analysis</span>
            <span className="flex items-center">✓ Commercial property expertise</span>
            <span className="flex items-center">✓ Portfolio optimization</span>
          </div>
          
          {/* LinkedIn credibility badge */}
          <div className="mt-4 inline-flex items-center px-6 py-3 bg-[rgba(0,119,181,0.1)] border border-[#0077B5] rounded-full">
            <span className="text-sm text-[#0077B5] font-medium">🏢 Trusted by Singapore Business Leaders</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <>
              {/* LinkedIn B2B-specific quick scenarios */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Executive Property Scenarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setQuickScenario('commercial_property')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Commercial Property</div>
                      <div className="text-sm text-[#8E8E93]">$3M office/retail, typical savings: $800/month</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setQuickScenario('high_value_residential')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Luxury Residential</div>
                      <div className="text-sm text-[#8E8E93]">$2.5M private residence, wealth optimization</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setQuickScenario('investment_portfolio')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Investment Portfolio</div>
                      <div className="text-sm text-[#8E8E93]">$1.8M investment property, cash flow focus</div>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onCalculate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Property Value (SGD) *
                    </label>
                    <input
                      {...register('propertyValue', { required: 'Property value is required', min: 500000 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                      placeholder="e.g., 2,000,000"
                    />
                    {errors.propertyValue && (
                      <span className="text-[#DC2626] text-sm">{errors.propertyValue.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Loan Amount (SGD) *
                    </label>
                    <input
                      {...register('loanAmount', { required: 'Loan amount is required', min: 350000 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                      placeholder="e.g., 1,400,000"
                    />
                    {errors.loanAmount && (
                      <span className="text-[#DC2626] text-sm">{errors.loanAmount.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Property Classification
                    </label>
                    <select
                      {...register('propertyType', { required: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                    >
                      <option value="Commercial">Commercial Property</option>
                      <option value="Private">Luxury Residential</option>
                      <option value="HDB">Executive HDB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Current Interest Rate (%)
                    </label>
                    <input
                      {...register('interestRate', { required: 'Interest rate is required', min: 2, max: 8 })}
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                      placeholder="e.g., 4.2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Monthly Gross Income (SGD) *
                    </label>
                    <input
                      {...register('monthlyIncome', { required: 'Monthly income is required', min: 5000 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                      placeholder="e.g., 25,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Existing Monthly Obligations (SGD)
                    </label>
                    <input
                      {...register('existingDebt', { min: 0 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                      placeholder="e.g., 2,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Current Banking Relationship
                    </label>
                    <select
                      {...register('currentBank')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                    >
                      <option value="">Select current bank</option>
                      <option value="DBS">DBS/POSB</option>
                      <option value="OCBC">OCBC</option>
                      <option value="UOB">UOB</option>
                      <option value="Maybank">Maybank</option>
                      <option value="HSBC">HSBC</option>
                      <option value="Standard Chartered">Standard Chartered</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Investment Timeline
                    </label>
                    <select
                      {...register('timeline', { required: 'Timeline is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                    >
                      <option value="">When do you need optimization?</option>
                      <option value="immediate">Immediate (within 30 days)</option>
                      <option value="soon">Near-term (within quarter)</option>
                      <option value="planning">Strategic planning (6-12 months)</option>
                      <option value="exploring">Portfolio review & optimization</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full bg-gradient-to-r from-[#FFB800] to-[#F4B942] text-[#1C1C1E] py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isCalculating ? 'Processing Executive Analysis...' : 'Calculate Portfolio Optimization (Complimentary)'}
                </button>
              </form>
            </>
          )}

          {/* Results display with executive language */}
          {results && currentStep === 1 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-[rgba(255,184,0,0.1)] to-[rgba(107,70,193,0.1)] rounded-xl border border-[rgba(255,184,0,0.3)]">
              <h3 className="text-2xl font-bold font-gilda text-[#1C1C1E] mb-6">Executive Financial Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Monthly Payment</div>
                  <div className="text-2xl font-bold text-[#1C1C1E]">
                    ${results.monthlyPayment.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Monthly Cash Flow Opportunity</div>
                  <div className="text-2xl font-bold text-[#059669]">
                    ${results.potentialSavings.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Annual Impact</div>
                  <div className="text-2xl font-bold text-[#6B46C1]">
                    ${(results.potentialSavings * 12).toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">TDSR Ratio</div>
                  <div className={`text-2xl font-bold ${results.tdsr <= 60 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {results.tdsr.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">Regulatory max: 60%</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Financing Ratio</div>
                  <div className="text-2xl font-bold text-[#1C1C1E]">
                    {results.ltvRatio.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">LTV</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">ROI Break-Even</div>
                  <div className="text-2xl font-bold text-[#6B46C1]">
                    {results.breakEvenPeriod.toFixed(1)} months
                  </div>
                </div>
              </div>

              {/* LinkedIn B2B-specific value proposition */}
              {results.potentialSavings > 200 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-[rgba(255,184,0,0.2)] to-[rgba(244,185,66,0.2)] border-l-4 border-[#FFB800] rounded-lg">
                  <h4 className="text-xl font-bold font-gilda text-[#1C1C1E] mb-2">💼 Strategic Optimization Identified</h4>
                  <p className="text-[#1C1C1E] mb-4">
                    Our analysis reveals <strong className="text-[#FFB800]">${results.potentialSavings.toFixed(0)}/month cash flow optimization</strong> 
                    potential - equivalent to <strong className="text-[#FFB800]">${(results.potentialSavings * 12).toLocaleString()}/year</strong> in improved returns.
                    Total portfolio impact: <strong className="text-[#FFB800]">${results.refinancingCostBenefit.toLocaleString()}</strong>
                  </p>
                  <button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Request Executive Consultation →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lead form with executive language */}
          {showLeadForm && currentStep === 1 && (
            <div className="mt-8 p-6 bg-[rgba(15,76,117,0.1)] border-l-4 border-[#0F4C75] rounded-xl">
              <h3 className="text-xl font-bold font-gilda text-[#1C1C1E] mb-4">
                Executive Portfolio Analysis Request
              </h3>
              <p className="text-[#8E8E93] mb-6">
                Our executive team will provide a comprehensive analysis of your financing structure 
                and present strategic optimization opportunities tailored to your business objectives.
              </p>

              <form onSubmit={handleSubmit(onSubmitLead)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  />
                  {errors.name && <span className="text-[#DC2626] text-sm">{errors.name.message}</span>}
                </div>

                <div>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    type="tel"
                    placeholder="Your contact number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  />
                  {errors.phone && <span className="text-[#DC2626] text-sm">{errors.phone.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    type="email"
                    placeholder="Your business email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  />
                  {errors.email && <span className="text-[#DC2626] text-sm">{errors.email.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      {...register('consent', { required: 'Consent is required' })}
                      type="checkbox"
                      className="w-4 h-4 text-[#FFB800] border-gray-300 rounded focus:ring-[#FFB800]"
                    />
                    <span className="text-sm text-[#8E8E93]">
                      I consent to receive the executive portfolio analysis and strategic consultation. 
                      NextNest will provide confidential financial optimization recommendations.
                    </span>
                  </label>
                  {errors.consent && <span className="text-[#DC2626] text-sm">{errors.consent.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FFB800] to-[#F4B942] text-[#1C1C1E] py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Request Executive Analysis - Complimentary →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success step with executive language */}
          {currentStep === 3 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🏢</div>
              <h2 className="text-3xl font-bold font-gilda text-[#1C1C1E] mb-4">Executive Analysis Request Received</h2>
              <p className="text-xl text-[#8E8E93] mb-6">
                Our executive team is preparing a comprehensive financing optimization analysis 
                tailored to your specific portfolio and business objectives.
              </p>
              <div className="bg-[rgba(5,150,105,0.1)] border-l-4 border-[#059669] p-6 rounded-lg">
                <h3 className="font-semibold text-[#059669] mb-2">Executive Service Process:</h3>
                <ul className="text-left text-[#1C1C1E] space-y-2">
                  <li>✓ Comprehensive portfolio analysis across all financing options</li>
                  <li>✓ Strategic optimization recommendations with ROI projections</li>
                  <li>✓ Executive briefing document delivered within 24 hours</li>
                  <li>✓ Optional executive consultation to discuss implementation strategy</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* LinkedIn B2B trust signals */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold font-gilda text-[#1C1C1E] mb-4">Executive Financial Advisory</h3>
            <p className="text-lg text-[#8E8E93] mb-6">
              Strategic mortgage optimization for business leaders. Confidential analysis, 
              executive-level service, and proven results for Singapore's most successful professionals.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FFB800]">$2M+</div>
                <div className="text-sm text-[#8E8E93]">Average portfolio value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#059669]">24hr</div>
                <div className="text-sm text-[#8E8E93]">Executive response time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#6B46C1]">500+</div>
                <div className="text-sm text-[#8E8E93]">Business leaders served</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInCampaignCalculator;