'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// NextNest's Full MAS-Compliant Computational Module (Tier 2 - Client Tool)
interface ComprehensiveMortgageInputs {
  // Property Details
  propertyValue: number;
  loanAmount: number;
  propertyType: 'HDB' | 'EC' | 'Private' | 'Commercial';
  propertyLocation: string;
  isNewProperty: boolean;
  isBUC: boolean; // Building Under Construction
  
  // Borrower Details (supports multiple borrowers)
  borrowers: BorrowerDetails[];
  
  // Loan Details
  interestRatePackage: string;
  currentInterestRate: number;
  lockInPeriod: number;
  loanTenure: number;
  refinancingFrom: string;
  
  // Income and Commitments
  totalRecognizedIncome: number;
  totalCommitments: number;
  
  // Existing Property Details (for ABSD calculation)
  existingProperties: number;
  buyerStatus: 'SC' | 'PR' | 'Foreigner' | 'Entity';
  spouseBuyerStatus?: 'SC' | 'PR' | 'Foreigner';
  
  // Advanced Options
  useEFA: boolean; // Eligible Financial Assets
  pledgedAssets?: number;
  showFunds?: number;
}

interface BorrowerDetails {
  age: number;
  monthlyIncome: number;
  incomeType: 'fixed' | 'variable' | 'self_employed' | 'rental';
  recognitionRate: number;
}

interface NextNestFullAnalysis {
  // Basic Calculations
  monthlyPayment: number;
  totalInterest: number;
  
  // Regulatory Compliance
  tdsr: number;
  tdsrLimit: number;
  tdsrCompliant: boolean;
  msr: number;
  msrLimit: number;
  msrCompliant: boolean;
  
  // LTV Analysis
  maxLTVAllowed: number;
  actualLTV: number;
  minCashRequired: number;
  cpfUsageAllowed: number;
  
  // Age and Tenure Analysis
  iwaa: number; // Income Weighted Average Age
  maxTenureAllowed: number;
  tenureCompliant: boolean;
  
  // Stamp Duty Calculations
  bsd: number; // Buyer's Stamp Duty
  absd: number; // Additional Buyer's Stamp Duty
  totalStampDuty: number;
  
  // Advanced Calculations
  efaRequirements?: {
    monthlyDeficit: number;
    pledgeFundRequired: number;
    showFundRequired: number;
  };
  
  // Progressive Payment (for BUC)
  progressivePaymentSchedule?: ProgressivePayment[];
  
  // ROI Analysis (for investment properties)
  roiAnalysis?: {
    grossRentalYield: number;
    netRentalYield: number;
    cashOnCash: number;
  };
  
  // Stress Testing
  stressTestResults: {
    rate: number;
    monthlyPaymentAtStress: number;
    tdsrAtStress: number;
    compliantAtStress: boolean;
  };
  
  // Client Protection Measures
  clientProtections: {
    conservativeRounding: boolean;
    worstCaseScenario: boolean;
    bufferRecommendations: string[];
  };
}

interface ProgressivePayment {
  stage: string;
  percentage: number;
  amount: number;
  timing: string;
  paymentBreakdown: {
    cash: number;
    cpf: number;
    bankLoan: number;
  };
}

const NextNestClientPrecisionTool: React.FC = () => {
  const [analysis, setAnalysis] = useState<NextNestFullAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ComprehensiveMortgageInputs>({
    defaultValues: {
      borrowers: [{ age: 35, monthlyIncome: 10000, incomeType: 'fixed', recognitionRate: 1.0 }],
      propertyType: 'Private',
      buyerStatus: 'SC',
      existingProperties: 0,
      useEFA: false,
      isNewProperty: true,
      isBUC: false
    }
  });

  // NextNest's Full Computational Engine
  const performComprehensiveAnalysis = (inputs: ComprehensiveMortgageInputs): NextNestFullAnalysis => {
    const principal = inputs.loanAmount;
    
    // 1. IWAA Calculation (Income Weighted Average Age)
    const totalIncome = inputs.borrowers.reduce((sum, b) => sum + b.monthlyIncome, 0);
    const iwaa = Math.ceil(
      inputs.borrowers.reduce((sum, b) => sum + (b.age * b.monthlyIncome), 0) / totalIncome
    );
    
    // 2. Maximum Tenure Calculation
    const maxTenureByAge = inputs.propertyType === 'HDB' || inputs.propertyType === 'EC' ? 
      Math.min(25, 65 - iwaa) : Math.min(35, 65 - iwaa);
    const tenureCompliant = inputs.loanTenure <= maxTenureByAge;
    
    // 3. Stress Test Rate (NextNest's MAS-compliant rates)
    const stressTestRate = inputs.propertyType === 'Commercial' ? 5.0 : 4.0;
    const calculationRate = Math.max(inputs.currentInterestRate, stressTestRate);
    
    // 4. Monthly Payment Calculation
    const monthlyRate = calculationRate / 100 / 12;
    const numPayments = inputs.loanTenure * 12;
    const exactMonthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Client-protective rounding (round UP)
    const monthlyPayment = Math.ceil(exactMonthlyPayment);
    
    // 5. TDSR Calculation (55% limit)
    const totalDebtService = monthlyPayment + inputs.totalCommitments;
    const tdsr = (totalDebtService / inputs.totalRecognizedIncome) * 100;
    const tdsrCompliant = tdsr <= 55;
    
    // 6. MSR Calculation (property-specific)
    const msrLimits = { 'HDB': 30, 'EC': 30, 'Private': null, 'Commercial': null };
    const msrLimit = msrLimits[inputs.propertyType] || 0;
    const msr = msrLimit ? (monthlyPayment / inputs.totalRecognizedIncome) * 100 : 0;
    const msrCompliant = !msrLimit || msr <= msrLimit;
    
    // 7. LTV Limits (based on property count and buyer status)
    const getLTVLimits = () => {
      if (inputs.buyerStatus === 'Entity') return { maxLTV: 15, minCash: 15 };
      
      const ltvMatrix = {
        0: { maxLTV: 75, minCash: 5 }, // First property
        1: { maxLTV: 45, minCash: 25 }, // Second property  
        2: { maxLTV: 35, minCash: 25 }  // Third+ property
      };
      
      const propertyCount = Math.min(inputs.existingProperties, 2);
      let limits = ltvMatrix[propertyCount as keyof typeof ltvMatrix];
      
      // Extended tenure adjustment
      if (inputs.loanTenure > 30 || (iwaa + inputs.loanTenure > 65)) {
        limits = { maxLTV: limits.maxLTV - 5, minCash: limits.minCash + 5 };
      }
      
      return limits;
    };
    
    const ltvLimits = getLTVLimits();
    const actualLTV = (inputs.loanAmount / inputs.propertyValue) * 100;
    const minCashRequired = Math.ceil((inputs.propertyValue * ltvLimits.minCash / 100) / 1000) * 1000;
    const cpfUsageAllowed = inputs.propertyType !== 'Commercial';
    
    // 8. Stamp Duty Calculations
    const calculateBSD = (value: number, isCommercial: boolean) => {
      const tiers = isCommercial ? [
        { max: 180000, rate: 0.01, base: 0 },
        { max: 360000, rate: 0.02, base: 1800 },
        { max: 1000000, rate: 0.03, base: 5400 },
        { max: 1500000, rate: 0.04, base: 24600 },
        { above: 1500000, rate: 0.05, base: 44600 }
      ] : [
        { max: 180000, rate: 0.01, base: 0 },
        { max: 360000, rate: 0.02, base: 1800 },
        { max: 1000000, rate: 0.03, base: 5400 },
        { max: 1500000, rate: 0.04, base: 24600 },
        { max: 3000000, rate: 0.05, base: 44600 },
        { above: 3000000, rate: 0.06, base: 119600 }
      ];
      
      let bsd = 0;
      let remainingValue = value;
      
      for (const tier of tiers) {
        if ('max' in tier && remainingValue > tier.max) {
          bsd = tier.base + (tier.max - (value - remainingValue)) * tier.rate;
          remainingValue -= tier.max;
        } else if ('above' in tier) {
          bsd = tier.base + remainingValue * tier.rate;
          break;
        } else {
          bsd = tier.base + remainingValue * tier.rate;
          break;
        }
      }
      
      return Math.ceil(bsd);
    };
    
    const bsd = calculateBSD(inputs.propertyValue, inputs.propertyType === 'Commercial');
    
    // ABSD Calculation
    const calculateABSD = () => {
      if (inputs.propertyType === 'HDB' || inputs.propertyType === 'EC') return 0;
      
      const absdRates = {
        'SC': [0, 20, 30], // First, second, third+ property
        'PR': [5, 30, 35],
        'Foreigner': [60, 60, 60],
        'Entity': [65, 65, 65]
      };
      
      const propertyIndex = Math.min(inputs.existingProperties, 2);
      const rate = absdRates[inputs.buyerStatus][propertyIndex];
      
      return Math.ceil(inputs.propertyValue * rate / 100);
    };
    
    const absd = calculateABSD();
    const totalStampDuty = bsd + absd;
    
    // 9. EFA Calculations (if applicable)
    let efaRequirements;
    if (inputs.useEFA) {
      const availableIncome = inputs.totalRecognizedIncome * 0.55 - inputs.totalCommitments;
      const monthlyDeficit = Math.max(0, monthlyPayment - availableIncome);
      
      if (monthlyDeficit > 0) {
        const pledgeFundRequired = Math.ceil((monthlyDeficit / 0.55) * 48 / 1000) * 1000;
        const showFundRequired = Math.ceil(pledgeFundRequired / 0.30 / 1000) * 1000;
        
        efaRequirements = {
          monthlyDeficit,
          pledgeFundRequired,
          showFundRequired
        };
      }
    }
    
    // 10. Stress Test Results
    const stressMonthlyPayment = principal * 
      (stressTestRate/100/12 * Math.pow(1 + stressTestRate/100/12, numPayments)) / 
      (Math.pow(1 + stressTestRate/100/12, numPayments) - 1);
    
    const stressTestResults = {
      rate: stressTestRate,
      monthlyPaymentAtStress: Math.ceil(stressMonthlyPayment),
      tdsrAtStress: ((Math.ceil(stressMonthlyPayment) + inputs.totalCommitments) / inputs.totalRecognizedIncome) * 100,
      compliantAtStress: ((Math.ceil(stressMonthlyPayment) + inputs.totalCommitments) / inputs.totalRecognizedIncome) * 100 <= 55
    };
    
    return {
      monthlyPayment,
      totalInterest: (monthlyPayment * numPayments) - principal,
      tdsr,
      tdsrLimit: 55,
      tdsrCompliant,
      msr,
      msrLimit,
      msrCompliant,
      maxLTVAllowed: ltvLimits.maxLTV,
      actualLTV,
      minCashRequired,
      cpfUsageAllowed,
      iwaa,
      maxTenureAllowed: maxTenureByAge,
      tenureCompliant,
      bsd,
      absd,
      totalStampDuty,
      efaRequirements,
      stressTestResults,
      clientProtections: {
        conservativeRounding: true,
        worstCaseScenario: true,
        bufferRecommendations: [
          "All calculations use conservative rounding for client protection",
          "Stress test rates applied as per MAS guidelines",
          "Consider 10% income buffer for unexpected changes"
        ]
      }
    };
  };

  const onSubmit = async (data: ComprehensiveMortgageInputs) => {
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const comprehensiveAnalysis = performComprehensiveAnalysis(data);
    setAnalysis(comprehensiveAnalysis);
    setIsCalculating(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Your Personal Mortgage Brain
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          The Only Analysis That Thinks Like You Do
        </p>
        <div className="flex justify-center items-center space-x-6 text-sm">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ IWAA Certified</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">✓ EFA Modeling</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">✓ Full Stamp Duty Analysis</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">✓ Stress Test Compliant</span>
        </div>
      </div>

      {!analysis ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Property Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Value (SGD)
                </label>
                <input
                  {...register('propertyValue', { required: true, min: 100000 })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <option value="EC">Executive Condominium</option>
                  <option value="Private">Private Property</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Borrower Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Financial Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Recognized Monthly Income (SGD)
                </label>
                <input
                  {...register('totalRecognizedIncome', { required: true, min: 1000 })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Monthly Commitments (SGD)
                </label>
                <input
                  {...register('totalCommitments', { min: 0 })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-md font-medium text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {isCalculating ? 'Your Personal Mortgage Brain is thinking...' : 'Get My Personalized Analysis'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['overview', 'compliance', 'costs', 'advanced'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium capitalize ${
                  activeTab === tab ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Monthly Payment</h3>
                <p className="text-3xl font-bold text-blue-600">
                  SGD {analysis.monthlyPayment.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  At {analysis.stressTestResults.rate}% stress test rate
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-green-900 mb-2">LTV Ratio</h3>
                <p className="text-3xl font-bold text-green-600">
                  {analysis.actualLTV.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  Max allowed: {analysis.maxLTVAllowed}%
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-purple-900 mb-2">Total Stamp Duty</h3>
                <p className="text-3xl font-bold text-purple-600">
                  SGD {analysis.totalStampDuty.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  BSD: {analysis.bsd.toLocaleString()}, ABSD: {analysis.absd.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">MAS Regulatory Compliance Analysis</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">TDSR (Total Debt Servicing Ratio)</h4>
                      <p className="text-sm text-gray-600">Current: {analysis.tdsr.toFixed(1)}% | Limit: {analysis.tdsrLimit}%</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.tdsrCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {analysis.tdsrCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </span>
                  </div>

                  {analysis.msr > 0 && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">MSR (Mortgage Servicing Ratio)</h4>
                        <p className="text-sm text-gray-600">Current: {analysis.msr.toFixed(1)}% | Limit: {analysis.msrLimit}%</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysis.msrCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {analysis.msrCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Loan Tenure</h4>
                      <p className="text-sm text-gray-600">
                        IWAA: {analysis.iwaa} years | Max Tenure: {analysis.maxTenureAllowed} years
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.tenureCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {analysis.tenureCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Client Protections */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Your Personal Mortgage Brain Protection Framework</h3>
            <div className="space-y-2">
              {analysis.clientProtections.bufferRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-blue-600">•</span>
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextNestClientPrecisionTool;