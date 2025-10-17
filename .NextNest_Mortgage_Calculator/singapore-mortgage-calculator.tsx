'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// Singapore-specific mortgage calculation logic
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
  // Lead capture fields
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

const SingaporeMortgageCalculator: React.FC = () => {
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
      propertyType: 'HDB',
      interestRate: 3.5,
      loanTenure: 25,
      currentBank: '',
    }
  });

  const propertyValue = watch('propertyValue');
  const loanAmount = watch('loanAmount');
  const propertyType = watch('propertyType');

  // Singapore-specific mortgage calculations
  const calculateMortgage = (inputs: MortgageInputs): CalculationResult => {
    const principal = inputs.loanAmount;
    const monthlyRate = inputs.interestRate / 100 / 12;
    const numPayments = inputs.loanTenure * 12;

    // Monthly payment calculation
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalInterest = (monthlyPayment * numPayments) - principal;
    const ltvRatio = (inputs.loanAmount / inputs.propertyValue) * 100;

    // Singapore TDSR (Total Debt Servicing Ratio) - max 60%
    const totalDebtService = monthlyPayment + inputs.existingDebt;
    const tdsr = (totalDebtService / inputs.monthlyIncome) * 100;

    // Singapore MSR (Mortgage Servicing Ratio) - varies by property type
    const msrLimit = inputs.propertyType === 'HDB' ? 30 : 
                    inputs.propertyType === 'Private' ? 30 : 35;
    const msr = (monthlyPayment / inputs.monthlyIncome) * 100;

    // Potential savings calculation (assuming 0.3% reduction in rate)
    const optimizedRate = inputs.interestRate - 0.3;
    const optimizedMonthlyRate = optimizedRate / 100 / 12;
    const optimizedPayment = (principal * optimizedMonthlyRate * Math.pow(1 + optimizedMonthlyRate, numPayments)) / 
                            (Math.pow(1 + optimizedMonthlyRate, numPayments) - 1);
    
    const potentialSavings = monthlyPayment - optimizedPayment;
    const refinancingCosts = inputs.propertyValue * 0.005; // Approximate legal and valuation costs
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

  // Quick scenario buttons (Hormozi's simplification principle)
  const setQuickScenario = (scenario: string) => {
    switch (scenario) {
      case 'hdb_resale':
        setValue('propertyValue', 500000);
        setValue('loanAmount', 400000);
        setValue('propertyType', 'HDB');
        setValue('interestRate', 2.8);
        break;
      case 'private_condo':
        setValue('propertyValue', 1200000);
        setValue('loanAmount', 960000);
        setValue('propertyType', 'Private');
        setValue('interestRate', 3.2);
        break;
      case 'commercial':
        setValue('propertyValue', 2000000);
        setValue('loanAmount', 1400000);
        setValue('propertyType', 'Commercial');
        setValue('interestRate', 3.8);
        break;
    }
  };

  // Submit to n8n webhook (guerilla growth tactic: direct integration)
  const submitToWebhook = async (data: MortgageInputs) => {
    const webhookData = {
      // Mortgage calculation inputs (matching n8n field names)
      loanQuantum: data.loanAmount,  // Fixed field mapping
      propertyValue: data.propertyValue,
      currentBank: data.currentBank,
      propertyType: data.propertyType,
      timeline: data.timeline,
      monthlyIncome: data.monthlyIncome,
      existingDebt: data.existingDebt,
      
      // Contact details
      name: data.name,
      email: data.email,
      phone: data.phone,
      
      // Attribution (enhanced for campaign tracking)
      source: 'website_calculator_general',  // Will be overridden in campaign versions
      campaign: 'homepage_calculator',
      timestamp: new Date().toISOString(),
      
      // Optional: Include client-side calculations for verification
      clientCalculations: results
    };

    try {
      // Replace with your n8n webhook URL
      const response = await fetch('https://your-n8n-instance.com/webhook/nextnest-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      if (response.ok) {
        alert('Your analysis request has been submitted! We\'ll contact you within 24 hours with your complete mortgage options.');
      }
    } catch (error) {
      console.error('Webhook submission error:', error);
      alert('Thank you for your interest! Please call us at +65 8888 8888 for immediate assistance.');
    }
  };

  const onCalculate = (data: MortgageInputs) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const calculationResults = calculateMortgage(data);
      setResults(calculationResults);
      setIsCalculating(false);
      
      // Hormozi's Grand Slam Offer: Show immediate value before asking for contact
      if (calculationResults.potentialSavings > 100) {
        setShowLeadForm(true);
      }
    }, 1000);
  };

  const onSubmitLead = (data: MortgageInputs) => {
    submitToWebhook(data);
    setCurrentStep(3); // Success step
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Strategic headline and value proposition */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-gilda text-[#1C1C1E] mb-4">
            The Only Mortgage Analysis That 
            <span className="text-[#FFB800]"> Thinks Like You Do</span>
          </h1>
          <p className="text-xl text-[#8E8E93] mb-6">
            AI-enhanced analysis that understands your unique situation. Get personalized insights in 60 seconds.
          </p>
          <div className="flex justify-center items-center space-x-4 text-sm text-[#059669]">
            <span className="flex items-center">✓ Personalized intelligence</span>
            <span className="flex items-center">✓ Sophisticated analysis</span>
            <span className="flex items-center">✓ 24-hour guarantee</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <>
              {/* Quick scenario buttons - Guerilla growth: reduce friction */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Quick Scenarios (Click to Auto-Fill)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setQuickScenario('hdb_resale')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">HDB Resale</div>
                      <div className="text-sm text-[#8E8E93]">$500K property, 80% loan</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setQuickScenario('private_condo')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Private Condo</div>
                      <div className="text-sm text-[#8E8E93]">$1.2M property, 80% loan</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setQuickScenario('commercial')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Commercial</div>
                      <div className="text-sm text-[#8E8E93]">$2M property, 70% loan</div>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onCalculate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Property Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Value (SGD)
                    </label>
                    <input
                      {...register('propertyValue', { required: 'Property value is required', min: 100000 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 800,000"
                    />
                    {errors.propertyValue && (
                      <span className="text-red-500 text-sm">{errors.propertyValue.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount (SGD)
                    </label>
                    <input
                      {...register('loanAmount', { required: 'Loan amount is required', min: 50000 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 640,000"
                    />
                    {errors.loanAmount && (
                      <span className="text-red-500 text-sm">{errors.loanAmount.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
                      {...register('propertyType', { required: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="HDB">HDB (Resale/BTO)</option>
                      <option value="Private">Private Property</option>
                      <option value="Commercial">Commercial Property</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Interest Rate (%)
                    </label>
                    <input
                      {...register('interestRate', { required: 'Interest rate is required', min: 1, max: 10 })}
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3.2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Tenure (Years)
                    </label>
                    <select
                      {...register('loanTenure', { required: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 years</option>
                      <option value={20}>20 years</option>
                      <option value={25}>25 years</option>
                      <option value={30}>30 years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Gross Income (SGD)
                    </label>
                    <input
                      {...register('monthlyIncome', { required: 'Monthly income is required', min: 1000 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 8,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Existing Monthly Debt (SGD)
                    </label>
                    <input
                      {...register('existingDebt', { min: 0 })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Bank
                    </label>
                    <input
                      {...register('currentBank')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., DBS, OCBC, UOB"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full bg-gradient-to-r from-[#FFB800] to-[#F4B942] text-[#1C1C1E] py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isCalculating ? 'Calculating Your Best Options...' : 'Get My Mortgage Analysis (Free)'}
                </button>
              </form>
            </>
          )}

          {/* Results Display - Hormozi's value-first approach */}
          {results && currentStep === 1 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-[rgba(255,184,0,0.1)] to-[rgba(107,70,193,0.1)] rounded-xl border border-[rgba(255,184,0,0.3)]">
              <h3 className="text-2xl font-bold font-gilda text-[#1C1C1E] mb-6">Your Mortgage Analysis Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Monthly Payment</div>
                  <div className="text-2xl font-bold text-[#1C1C1E]">
                    ${results.monthlyPayment.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Potential Monthly Savings</div>
                  <div className="text-2xl font-bold text-[#059669]">
                    ${results.potentialSavings.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">Total Interest</div>
                  <div className="text-2xl font-bold text-[#1C1C1E]">
                    ${results.totalInterest.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">LTV Ratio</div>
                  <div className="text-2xl font-bold text-[#1C1C1E]">
                    {results.ltvRatio.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">TDSR</div>
                  <div className={`text-2xl font-bold ${results.tdsr <= 60 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {results.tdsr.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">Max: 60%</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-[#8E8E93] uppercase tracking-wide">MSR</div>
                  <div className={`text-2xl font-bold ${results.msr <= 30 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {results.msr.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">Max: 30%</div>
                </div>
              </div>

              {/* Hormozi's Grand Slam Offer - Show potential savings to create desire */}
              {results.potentialSavings > 100 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-[rgba(255,184,0,0.2)] to-[rgba(244,185,66,0.2)] border-l-4 border-[#FFB800] rounded-lg">
                  <h4 className="text-xl font-bold font-gilda text-[#1C1C1E] mb-2">🎯 We Found Significant Savings Opportunities!</h4>
                  <p className="text-[#1C1C1E] mb-4">
                    Our AI analysis suggests you could save <strong className="text-[#FFB800]">${results.potentialSavings.toFixed(0)}/month</strong> 
                    - that's <strong className="text-[#FFB800]">${(results.potentialSavings * 12).toLocaleString()}/year</strong> or 
                    <strong className="text-[#FFB800]"> ${results.refinancingCostBenefit.toLocaleString()}</strong> over your loan term!
                  </p>
                  <button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Get My Complete Analysis (Free) →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lead Capture Form - Only shown after value demonstration */}
          {showLeadForm && currentStep === 1 && (
            <div className="mt-8 p-6 bg-[rgba(15,76,117,0.1)] border-l-4 border-[#0F4C75] rounded-xl">
              <h3 className="text-xl font-bold font-gilda text-[#1C1C1E] mb-4">
                Get Your Complete Mortgage Optimization Report
              </h3>
              <p className="text-[#8E8E93] mb-6">
                Our AI will analyze all 286 bank packages to find your optimal mortgage solution. 
                Delivered within 24 hours, guaranteed.
              </p>

              <form onSubmit={handleSubmit(onSubmitLead)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                </div>

                <div>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    type="tel"
                    placeholder="Your phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <select
                    {...register('timeline', { required: 'Timeline is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">When do you need this mortgage solution?</option>
                    <option value="immediate">Immediate (within 1 month)</option>
                    <option value="soon">Soon (within 3 months)</option>
                    <option value="planning">Planning (3-6 months)</option>
                    <option value="exploring">Just exploring options</option>
                  </select>
                  {errors.timeline && <span className="text-red-500 text-sm">{errors.timeline.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      {...register('consent', { required: 'Consent is required' })}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      I consent to be contacted about my mortgage optimization opportunities. 
                      By submitting, I understand NextNest will provide personalized mortgage analysis at no cost to me.
                    </span>
                  </label>
                  {errors.consent && <span className="text-red-500 text-sm">{errors.consent.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FFB800] to-[#F4B942] text-[#1C1C1E] py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Get My Complete Analysis - Free & Fast →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success Step */}
          {currentStep === 3 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold font-gilda text-[#1C1C1E] mb-4">Analysis Request Submitted Successfully!</h2>
              <p className="text-xl text-[#8E8E93] mb-6">
                Our AI is now analyzing all 286 mortgage packages to find your optimal solution.
              </p>
              <div className="bg-[rgba(5,150,105,0.1)] border-l-4 border-[#059669] p-6 rounded-lg">
                <h3 className="font-semibold text-[#059669] mb-2">What happens next:</h3>
                <ul className="text-left text-[#1C1C1E] space-y-2">
                  <li>✓ Our AI analyzes your situation against all available packages</li>
                  <li>✓ We prepare your personalized mortgage optimization report</li>
                  <li>✓ You'll receive your complete analysis within 24 hours</li>
                  <li>✓ Optional: Schedule a 15-minute call to discuss your options</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Strategic guarantee and social proof */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold font-gilda text-[#1C1C1E] mb-4">The NextNest Intelligence Guarantee</h3>
            <p className="text-lg text-[#8E8E93] mb-6">
              If our personalized analysis doesn't reveal opportunities you haven't considered within 24 hours, 
              we'll provide a complimentary consultation to ensure you get the insights you need.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FFB800]">286</div>
                <div className="text-sm text-[#8E8E93]">Bank packages analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#059669]">24</div>
                <div className="text-sm text-[#8E8E93]">Hours guaranteed response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#6B46C1]">$0</div>
                <div className="text-sm text-[#8E8E93]">Cost to you (banks pay us)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingaporeMortgageCalculator;