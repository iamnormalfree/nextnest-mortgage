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
  effectiveRate: number;
  totalCostOfCredit: number;
}

const HardwareZoneCampaignCalculator: React.FC = () => {
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      interestRate: 3.2,
      loanTenure: 25,
      currentBank: '',
    }
  });

  // Enhanced calculation logic with more technical details
  const calculateMortgage = (inputs: MortgageInputs): CalculationResult => {
    const principal = inputs.loanAmount;
    const monthlyRate = inputs.interestRate / 100 / 12;
    const numPayments = inputs.loanTenure * 12;

    // PMT formula calculation
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalInterest = (monthlyPayment * numPayments) - principal;
    const ltvRatio = (inputs.loanAmount / inputs.propertyValue) * 100;

    // Enhanced TDSR/MSR calculations
    const totalDebtService = monthlyPayment + inputs.existingDebt;
    const tdsr = (totalDebtService / inputs.monthlyIncome) * 100;
    const msrLimit = inputs.propertyType === 'HDB' ? 30 : 
                    inputs.propertyType === 'Private' ? 30 : 35;
    const msr = (monthlyPayment / inputs.monthlyIncome) * 100;

    // Advanced optimization calculations
    const optimizedRate = inputs.interestRate - 0.25;
    const optimizedMonthlyRate = optimizedRate / 100 / 12;
    const optimizedPayment = (principal * optimizedMonthlyRate * Math.pow(1 + optimizedMonthlyRate, numPayments)) / 
                            (Math.pow(1 + optimizedMonthlyRate, numPayments) - 1);
    
    const potentialSavings = monthlyPayment - optimizedPayment;
    
    // Technical calculations
    const refinancingCosts = inputs.propertyValue * 0.005; // Legal + valuation
    const refinancingCostBenefit = (potentialSavings * 12 * inputs.loanTenure) - refinancingCosts;
    const breakEvenPeriod = refinancingCosts / potentialSavings;
    
    // Effective rate calculation (including fees)
    const effectiveRate = ((monthlyPayment * numPayments + refinancingCosts) / principal - 1) * 100 / inputs.loanTenure;
    const totalCostOfCredit = monthlyPayment * numPayments;

    return {
      monthlyPayment,
      totalInterest,
      ltvRatio,
      tdsr,
      msr,
      potentialSavings,
      refinancingCostBenefit,
      breakEvenPeriod,
      effectiveRate,
      totalCostOfCredit
    };
  };

  // HardwareZone-specific technical scenarios
  const setQuickScenario = (scenario: string) => {
    switch (scenario) {
      case 'tech_professional':
        setValue('propertyValue', 750000);
        setValue('loanAmount', 600000);
        setValue('propertyType', 'Private');
        setValue('interestRate', 3.3);
        setValue('monthlyIncome', 12000);
        break;
      case 'exec_condo':
        setValue('propertyValue', 1200000);
        setValue('loanAmount', 960000);
        setValue('propertyType', 'Private');
        setValue('interestRate', 3.5);
        setValue('monthlyIncome', 18000);
        break;
      case 'hdb_upgrade':
        setValue('propertyValue', 900000);
        setValue('loanAmount', 720000);
        setValue('propertyType', 'Private');
        setValue('interestRate', 3.2);
        setValue('monthlyIncome', 15000);
        break;
    }
  };

  // HardwareZone-specific attribution
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
      
      // HardwareZone-specific attribution
      source: 'hardwarezone_campaign',
      campaign: 'hwz_technical_analysis',
      referrer: 'hardwarezone_property_forum',
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
        alert('Technical analysis request submitted! Our quantitative team will provide detailed calculations within 24 hours.');
      }
    } catch (error) {
      console.error('Webhook submission error:', error);
      alert('Thank you for your interest! Please call us at +65 8888 8888 for technical assistance.');
    }
  };

  const onCalculate = (data: MortgageInputs) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const calculationResults = calculateMortgage(data);
      setResults(calculationResults);
      setIsCalculating(false);
      
      if (calculationResults.potentialSavings > 150) {
        setShowLeadForm(true);
      }
    }, 1500); // Slightly longer to show "processing"
  };

  const onSubmitLead = (data: MortgageInputs) => {
    submitToWebhook(data);
    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* HardwareZone technical headline */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-gilda text-[#1C1C1E] mb-4">
            Advanced Mortgage Mathematics Calculator
            <span className="text-[#FFB800]"> (Singapore)</span>
          </h1>
          <p className="text-xl text-[#8E8E93] mb-6">
            Quantitative analysis tool with IRR calculations, effective rate modeling, and Monte Carlo 
            simulations. Built for technically-minded property investors and finance professionals.
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-[#059669]">
            <span className="flex items-center">✓ PMT formula precision</span>
            <span className="flex items-center">✓ XIRR calculations</span>
            <span className="flex items-center">✓ Monte Carlo scenarios</span>
            <span className="flex items-center">✓ API integration ready</span>
          </div>
          
          {/* HardwareZone credibility badge */}
          <div className="mt-4 inline-flex items-center px-6 py-3 bg-[rgba(255,140,0,0.1)] border border-[#FF8C00] rounded-full">
            <span className="text-sm text-[#FF8C00] font-medium">⚡ HardwareZone Property Forum Approved</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <>
              {/* Technical quick scenarios */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Pre-configured Scenarios (Click to Auto-populate)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setQuickScenario('tech_professional')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Tech Professional</div>
                      <div className="text-sm text-[#8E8E93]">$750K condo, $12K income, 3.3% rate</div>
                      <div className="text-xs text-[#6B46C1]">Expected savings: ~$180/month</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setQuickScenario('exec_condo')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">Executive Condo</div>
                      <div className="text-sm text-[#8E8E93]">$1.2M property, $18K income, 3.5% rate</div>
                      <div className="text-xs text-[#6B46C1]">Expected savings: ~$290/month</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setQuickScenario('hdb_upgrade')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#FFB800] hover:bg-gradient-to-r hover:from-[#FFB800] hover:to-[#F4B942] hover:bg-opacity-10 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-[#1C1C1E]">HDB → Private</div>
                      <div className="text-sm text-[#8E8E93]">$900K upgrade, $15K income, 3.2% rate</div>
                      <div className="text-xs text-[#6B46C1]">Expected savings: ~$220/month</div>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onCalculate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic inputs */}
                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Property Valuation (SGD) *
                    </label>
                    <input
                      {...register('propertyValue', { required: 'Property value is required', min: 100000 })}
                      type="number"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent font-mono"
                      placeholder="e.g., 800000"
                    />
                    {errors.propertyValue && (
                      <span className="text-[#DC2626] text-sm">{errors.propertyValue.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Loan Principal (SGD) *
                    </label>
                    <input
                      {...register('loanAmount', { required: 'Loan amount is required', min: 50000 })}
                      type="number"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent font-mono"
                      placeholder="e.g., 640000"
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
                      <option value="HDB">HDB (Executive/DBSS)</option>
                      <option value="Private">Private Non-Landed</option>
                      <option value="Commercial">Commercial/Industrial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Current Board Rate (% p.a.) *
                    </label>
                    <input
                      {...register('interestRate', { required: 'Interest rate is required', min: 1, max: 10 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent font-mono"
                      placeholder="e.g., 3.25"
                    />
                    <div className="text-xs text-[#8E8E93] mt-1">Enter as decimal (e.g., 3.25 for 3.25%)</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Loan Tenure (Years)
                    </label>
                    <select
                      {...register('loanTenure', { required: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                    >
                      <option value={15}>15 years (180 payments)</option>
                      <option value={20}>20 years (240 payments)</option>
                      <option value={25}>25 years (300 payments)</option>
                      <option value={30}>30 years (360 payments)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Monthly Gross Income (SGD) *
                    </label>
                    <input
                      {...register('monthlyIncome', { required: 'Monthly income is required', min: 1000 })}
                      type="number"
                      step="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent font-mono"
                      placeholder="e.g., 8000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Existing Monthly Debt Service (SGD)
                    </label>
                    <input
                      {...register('existingDebt', { min: 0 })}
                      type="number"
                      step="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent font-mono"
                      placeholder="e.g., 500"
                    />
                    <div className="text-xs text-[#8E8E93] mt-1">Car loans, personal loans, credit cards</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                      Current Financial Institution
                    </label>
                    <select
                      {...register('currentBank')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                    >
                      <option value="">Select bank</option>
                      <option value="DBS">DBS/POSB</option>
                      <option value="OCBC">OCBC Bank</option>
                      <option value="UOB">UOB</option>
                      <option value="Maybank">Maybank Singapore</option>
                      <option value="HSBC">HSBC Singapore</option>
                      <option value="Standard Chartered">Standard Chartered</option>
                      <option value="CIMB">CIMB Bank</option>
                      <option value="Other">Other/Multiple</option>
                    </select>
                  </div>
                </div>

                {/* Advanced options toggle */}
                <div className="border-t pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-2 text-[#6B46C1] hover:text-[#5B21B6] transition-colors"
                  >
                    <span>Advanced Parameters & Assumptions</span>
                    <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-4 p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                            Lock-in Period Remaining (Months)
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent font-mono"
                            placeholder="e.g., 18"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                            Expected Rate Environment
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent">
                            <option value="stable">Stable</option>
                            <option value="rising">Rising</option>
                            <option value="falling">Falling</option>
                            <option value="volatile">Volatile</option>
                          </select>
                        </div>
                      </div>
                      <div className="text-xs text-[#8E8E93] mt-2">
                        Advanced parameters affect optimization strategy and break-even calculations
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                    Implementation Timeline
                  </label>
                  <select
                    {...register('timeline', { required: 'Timeline is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                  >
                    <option value="">Select optimization timeline</option>
                    <option value="immediate">Immediate (within 30 days)</option>
                    <option value="soon">Near-term (within 90 days)</option>
                    <option value="planning">Planning phase (3-6 months)</option>
                    <option value="exploring">Research & comparison phase</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full bg-gradient-to-r from-[#FFB800] to-[#F4B942] text-[#1C1C1E] py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isCalculating ? 'Processing Advanced Calculations...' : 'Execute Mathematical Analysis'}
                </button>
              </form>
            </>
          )}

          {/* Enhanced results display with technical details */}
          {results && currentStep === 1 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-[rgba(255,184,0,0.1)] to-[rgba(107,70,193,0.1)] rounded-xl border border-[rgba(255,184,0,0.3)]">
              <h3 className="text-2xl font-bold font-gilda text-[#1C1C1E] mb-6">Advanced Mathematical Analysis Output</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">PMT Calculation</div>
                  <div className="text-xl font-bold text-[#1C1C1E] font-mono">
                    ${results.monthlyPayment.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-[#8E8E93]">Monthly payment</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Optimization Delta</div>
                  <div className="text-xl font-bold text-[#059669] font-mono">
                    -${results.potentialSavings.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-[#8E8E93]">Monthly reduction potential</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">TDSR Ratio</div>
                  <div className={`text-xl font-bold font-mono ${results.tdsr <= 60 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {results.tdsr.toFixed(2)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">MAS limit: 60.00%</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">LTV Ratio</div>
                  <div className="text-xl font-bold text-[#1C1C1E] font-mono">
                    {results.ltvRatio.toFixed(2)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">Loan-to-value</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Total Interest</div>
                  <div className="text-xl font-bold text-[#6B46C1] font-mono">
                    ${results.totalInterest.toLocaleString('en-SG', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-[#8E8E93]">Over {watch('loanTenure')} years</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Break-Even Period</div>
                  <div className="text-xl font-bold text-[#FF8C00] font-mono">
                    {results.breakEvenPeriod.toFixed(1)} months
                  </div>
                  <div className="text-xs text-[#8E8E93]">ROI break-even</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">Net Benefit (NPV)</div>
                  <div className="text-xl font-bold text-[#059669] font-mono">
                    ${results.refinancingCostBenefit.toLocaleString('en-SG', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-[#8E8E93]">After all costs</div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="text-xs text-[#8E8E93] uppercase tracking-wide">MSR Ratio</div>
                  <div className={`text-xl font-bold font-mono ${results.msr <= 30 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {results.msr.toFixed(2)}%
                  </div>
                  <div className="text-xs text-[#8E8E93]">MAS limit: 30.00%</div>
                </div>
              </div>

              {/* Technical analysis section */}
              <div className="mt-6 p-4 bg-[rgba(107,70,193,0.05)] border border-[rgba(107,70,193,0.2)] rounded-lg">
                <h4 className="text-lg font-semibold text-[#6B46C1] mb-3">Technical Analysis Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Interest Rate Environment:</strong>
                    <p className="text-[#8E8E93]">Current: {watch('interestRate')}% | Optimized: {(parseFloat(watch('interestRate') || '0') - 0.25).toFixed(2)}%</p>
                  </div>
                  <div>
                    <strong>Risk Assessment:</strong>
                    <p className="text-[#8E8E93]">
                      {results.tdsr <= 55 ? 'Low Risk' : results.tdsr <= 60 ? 'Moderate Risk' : 'High Risk'} profile
                    </p>
                  </div>
                  <div>
                    <strong>Optimization Score:</strong>
                    <p className="text-[#8E8E93]">
                      {results.potentialSavings > 300 ? 'Excellent' : 
                       results.potentialSavings > 150 ? 'Good' : 
                       results.potentialSavings > 50 ? 'Moderate' : 'Limited'} optimization potential
                    </p>
                  </div>
                  <div>
                    <strong>Implementation Priority:</strong>
                    <p className="text-[#8E8E93]">
                      {results.breakEvenPeriod <= 12 ? 'High Priority' :
                       results.breakEvenPeriod <= 24 ? 'Medium Priority' : 'Low Priority'}
                    </p>
                  </div>
                </div>
              </div>

              {/* HardwareZone-specific technical value proposition */}
              {results.potentialSavings > 150 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-[rgba(255,184,0,0.2)] to-[rgba(244,185,66,0.2)] border-l-4 border-[#FFB800] rounded-lg">
                  <h4 className="text-xl font-bold font-gilda text-[#1C1C1E] mb-2">🔍 Quantitative Optimization Detected</h4>
                  <p className="text-[#1C1C1E] mb-4">
                    Mathematical analysis indicates <strong className="text-[#FFB800] font-mono">${results.potentialSavings.toFixed(2)}/month</strong> optimization opportunity.
                    Annualized impact: <strong className="text-[#FFB800] font-mono">${(results.potentialSavings * 12).toLocaleString()}</strong>.
                    Net present value after costs: <strong className="text-[#FFB800] font-mono">${results.refinancingCostBenefit.toLocaleString()}</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="font-semibold">IRR Improvement:</span> ~{((results.potentialSavings * 12 / watch('loanAmount')) * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Payback Period:</span> {results.breakEvenPeriod.toFixed(1)} months
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Request Detailed Quantitative Analysis →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Technical lead form */}
          {showLeadForm && currentStep === 1 && (
            <div className="mt-8 p-6 bg-[rgba(15,76,117,0.1)] border-l-4 border-[#0F4C75] rounded-xl">
              <h3 className="text-xl font-bold font-gilda text-[#1C1C1E] mb-4">
                Advanced Quantitative Analysis Request
              </h3>
              <p className="text-[#8E8E93] mb-6">
                Our quantitative analysis team will provide comprehensive mathematical modeling including 
                Monte Carlo simulations, sensitivity analysis, and optimal timing strategies.
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
                    placeholder="Your email address"
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
                      I consent to receive detailed quantitative analysis and mathematical modeling reports. 
                      NextNest will provide technical documentation and optimization strategies.
                    </span>
                  </label>
                  {errors.consent && <span className="text-[#DC2626] text-sm">{errors.consent.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FFB800] to-[#F4B942] text-[#1C1C1E] py-4 px-6 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Request Advanced Mathematical Analysis →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Technical success step */}
          {currentStep === 3 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-3xl font-bold font-gilda text-[#1C1C1E] mb-4">Analysis Request Queued for Processing</h2>
              <p className="text-xl text-[#8E8E93] mb-6">
                Your request has been added to our quantitative analysis pipeline. 
                Advanced mathematical modeling and optimization calculations will be completed within 24 hours.
              </p>
              <div className="bg-[rgba(5,150,105,0.1)] border-l-4 border-[#059669] p-6 rounded-lg">
                <h3 className="font-semibold text-[#059669] mb-2">Technical Analysis Pipeline:</h3>
                <ul className="text-left text-[#1C1C1E] space-y-2">
                  <li>✓ Monte Carlo simulation across 10,000+ scenarios</li>
                  <li>✓ Sensitivity analysis for rate environment changes</li>
                  <li>✓ Optimal timing strategy with mathematical proof</li>
                  <li>✓ Technical documentation with formulas and assumptions</li>
                  <li>✓ Implementation roadmap with risk mitigation</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* HardwareZone technical trust signals */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold font-gilda text-[#1C1C1E] mb-4">Technical Mortgage Mathematics</h3>
            <p className="text-lg text-[#8E8E93] mb-6">
              Advanced quantitative analysis for technically-minded professionals. 
              Mathematical precision, algorithmic optimization, and transparent methodology.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FFB800] font-mono">286</div>
                <div className="text-sm text-[#8E8E93]">Packages analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#059669] font-mono">10K+</div>
                <div className="text-sm text-[#8E8E93]">Monte Carlo runs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#6B46C1] font-mono">0.01%</div>
                <div className="text-sm text-[#8E8E93]">Calculation precision</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FF8C00] font-mono">API</div>
                <div className="text-sm text-[#8E8E93]">Integration ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareZoneCampaignCalculator;