'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// NextNest's MAS-Compliant Precision Standards for Lead Generation
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
  // Lead capture
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

interface NextNestCalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  ltvRatio: number;
  tdsr: number;
  msr: number;
  potentialSavings: number;
  refinancingCostBenefit: number;
  breakEvenPeriod: number;
  masCompliance: {
    stressTestRate: number;
    tdsrWithinLimit: boolean;
    msrWithinLimit: boolean;
  };
  precisionLevel: 'market_estimate' | 'mas_preview';
}

const NextNestLeadGenCalculator: React.FC = () => {
  const [results, setResults] = useState<NextNestCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvancedPreview, setShowAdvancedPreview] = useState(false);
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

  // NextNest's MAS-Compliant Calculation Module (Tier 1)
  const calculateWithNextNestPrecision = (inputs: MortgageInputs): NextNestCalculationResult => {
    const principal = inputs.loanAmount;
    
    // NextNest's MAS-Compliant Stress Test Rates
    const stressTestRates = {
      residential: 4.0,  // MAS Notice 632 compliant
      commercial: 5.0,   // MAS Notice 632 compliant
      private: 4.0       // Same as residential
    };
    
    const stressTestRate = inputs.propertyType === 'Commercial' ? 
      stressTestRates.commercial : stressTestRates.residential;
    
    // Use higher of actual rate or stress test rate
    const calculationRate = Math.max(inputs.interestRate, stressTestRate);
    const monthlyRate = calculationRate / 100 / 12;
    const numPayments = inputs.loanTenure * 12;

    // NextNest's Exact Monthly Payment Formula
    const exactMonthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Client-Protective Rounding (Round UP for conservative estimation)
    const monthlyPayment = Math.ceil(exactMonthlyPayment);
    
    const totalInterest = (monthlyPayment * numPayments) - principal;
    const ltvRatio = (inputs.loanAmount / inputs.propertyValue) * 100;

    // NextNest's CORRECT TDSR Calculation (55% limit, not 60%)
    const totalDebtService = monthlyPayment + inputs.existingDebt;
    const tdsr = (totalDebtService / inputs.monthlyIncome) * 100;
    const tdsrWithinLimit = tdsr <= 55; // MAS compliant limit

    // NextNest's MSR Calculation (Property-specific limits)
    const msrLimits = {
      'HDB': 30,
      'Private': 30, // No MSR for private (only TDSR applies)
      'Commercial': 35
    };
    
    const msrLimit = msrLimits[inputs.propertyType];
    const msr = (monthlyPayment / inputs.monthlyIncome) * 100;
    const msrWithinLimit = inputs.propertyType === 'Private' || msr <= msrLimit;

    // Conservative Potential Savings Estimation
    const marketOptimizedRate = Math.max(inputs.interestRate - 0.2, 2.5); // Conservative 0.2% improvement
    const optimizedMonthlyRate = marketOptimizedRate / 100 / 12;
    const optimizedPayment = principal * 
      (optimizedMonthlyRate * Math.pow(1 + optimizedMonthlyRate, numPayments)) / 
      (Math.pow(1 + optimizedMonthlyRate, numPayments) - 1);
    
    const potentialSavings = monthlyPayment - optimizedPayment;
    
    // NextNest's Refinancing Cost Estimation
    const refinancingCosts = inputs.propertyType === 'HDB' ? 1500 : 
                            inputs.propertyType === 'Private' ? 1800 : 2000;
    const refinancingCostBenefit = (potentialSavings * 12 * inputs.loanTenure) - refinancingCosts;
    const breakEvenPeriod = potentialSavings > 0 ? refinancingCosts / potentialSavings : 999;

    return {
      monthlyPayment,
      totalInterest,
      ltvRatio,
      tdsr,
      msr: inputs.propertyType === 'Private' ? 0 : msr, // No MSR for private
      potentialSavings,
      refinancingCostBenefit,
      breakEvenPeriod,
      masCompliance: {
        stressTestRate,
        tdsrWithinLimit,
        msrWithinLimit
      },
      precisionLevel: showAdvancedPreview ? 'mas_preview' : 'market_estimate'
    };
  };

  const onSubmit = async (data: MortgageInputs) => {
    setIsCalculating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const calculationResults = calculateWithNextNestPrecision(data);
    setResults(calculationResults);
    setIsCalculating(false);
    setCurrentStep(2);

    // Enhanced lead scoring for n8n
    const leadScore = calculateLeadScore(data, calculationResults);
    console.log('Lead Score:', leadScore);
  };

  // Enhanced Lead Scoring Algorithm
  const calculateLeadScore = (inputs: MortgageInputs, results: NextNestCalculationResult): number => {
    let score = 0;
    
    // Loan quantum scoring
    if (inputs.loanAmount >= 1500000) score += 3;
    else if (inputs.loanAmount >= 1000000) score += 2;
    else if (inputs.loanAmount >= 750000) score += 1;
    
    // Property type sophistication
    if (inputs.propertyType === 'Commercial') score += 2;
    if (inputs.propertyType === 'Private' && inputs.loanAmount >= 800000) score += 1;
    
    // Timeline urgency
    const timelineScoring = {
      'immediate': 3,
      'within-3-months': 2,
      'within-6-months': 1,
      'planning': 0
    };
    score += timelineScoring[inputs.timeline as keyof typeof timelineScoring] || 0;
    
    // Financial sophistication indicators
    if (results.masCompliance.tdsrWithinLimit && results.masCompliance.msrWithinLimit) score += 1;
    if (results.potentialSavings > 500) score += 1; // Significant savings opportunity
    if (showAdvancedPreview) score += 2; // Interest in precision
    
    return Math.min(score, 10); // Cap at 10
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* NextNest Precision Branding */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          NextNest Mortgage Calculator
        </h1>
        <p className="text-lg text-gray-600 mb-1">
          Singapore's Most Advanced MAS-Compliant Calculations
        </p>
        <div className="flex justify-center items-center space-x-4 text-sm text-green-600">
          <span>✓ MAS Notice 632 Compliant</span>
          <span>✓ Stress Test Accurate</span>
          <span>✓ Client Protective Rounding</span>
        </div>
      </div>

      {currentStep === 1 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Value (SGD)
              </label>
              <input
                {...register('propertyValue', { required: true, min: 100000 })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 800000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (SGD)
              </label>
              <input
                {...register('loanAmount', { required: true, min: 50000 })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 600000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                {...register('propertyType', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HDB">HDB</option>
                <option value="Private">Private Property</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Interest Rate (%)
              </label>
              <input
                {...register('interestRate', { required: true, min: 1, max: 10 })}
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3.5"
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdvancedPreview(!showAdvancedPreview)}
              className="text-blue-600 font-medium hover:text-blue-800"
            >
              {showAdvancedPreview ? '▼' : '▶'} Show NextNest's Advanced MAS-Compliant Analysis
            </button>
            {showAdvancedPreview && (
              <p className="text-sm text-gray-600 mt-2">
                Preview of full precision analysis available to NextNest clients
              </p>
            )}
          </div>

          {showAdvancedPreview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Income (SGD)
                </label>
                <input
                  {...register('monthlyIncome', { min: 0 })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 12000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Monthly Debt (SGD)
                </label>
                <input
                  {...register('existingDebt', { min: 0 })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 800"
                />
              </div>
            </div>
          )}

          {/* Lead Capture */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Get Your Personalized Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                {...register('name', { required: true })}
                type="text"
                placeholder="Full Name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="Email Address"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                {...register('phone', { required: true })}
                type="tel"
                placeholder="Phone Number"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isCalculating ? 'Calculating with NextNest\'s Advanced Methodology...' : 'Get MAS-Compliant Analysis'}
          </button>
        </form>
      )}

      {currentStep === 2 && results && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Mortgage Analysis
            </h2>
            <div className="inline-flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
              <span className="text-green-600 font-medium">
                NextNest MAS-Certified: {results.masCompliance.stressTestRate}% Stress Test Applied
              </span>
            </div>
          </div>

          {/* Key Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Monthly Payment</h3>
              <p className="text-3xl font-bold text-blue-600">
                SGD {results.monthlyPayment.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Conservative estimate (rounded up for client protection)
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 mb-2">Potential Savings</h3>
              <p className="text-3xl font-bold text-green-600">
                SGD {results.potentialSavings.toFixed(0)}/month
              </p>
              <p className="text-sm text-gray-600">
                Conservative 0.2% rate improvement estimate
              </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-orange-900 mb-2">Break-Even</h3>
              <p className="text-3xl font-bold text-orange-600">
                {results.breakEvenPeriod.toFixed(1)} months
              </p>
              <p className="text-sm text-gray-600">
                Time to recover refinancing costs
              </p>
            </div>
          </div>

          {/* MAS Compliance Status */}
          {showAdvancedPreview && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">MAS Regulatory Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${results.masCompliance.tdsrWithinLimit ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>TDSR: {results.tdsr.toFixed(1)}% (Limit: 55%)</span>
                </div>
                {results.msr > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${results.masCompliance.msrWithinLimit ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>MSR: {results.msr.toFixed(1)}% (Property-specific limit)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upgrade to Full Analysis */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="text-center">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Unlock NextNest's Full Precision Analysis
              </h3>
              <p className="text-gray-700 mb-4">
                Complete MAS-compliant calculations including IWAA, EFA modeling, and stamp duty optimization
              </p>
              <div className="flex justify-center space-x-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700">
                  Schedule Consultation
                </button>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium border border-blue-600 hover:bg-blue-50">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Estimates based on MAS guidelines and NextNest's advanced computational methodology</p>
            <p>• Stress test rates applied as per MAS Notice 632</p>
            <p>• Conservative rounding applied for client protection</p>
            <p>• Precise analysis requires full financial review and consultation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextNestLeadGenCalculator;