/**
 * Updated G3 Validation with Unified Urgency Handling
 * Implements dynamic validation and urgency calculation based on loan type
 * Version: 2.0 - Post-Roundtable Consensus
 */

// For n8n Code Node: Gate 3 Profile Validator & Ratios
const { formData = {}, gate } = items[0].json;

// --- URGENCY CALCULATION ---
// Calculate urgency based on loan-specific fields
function calculateUrgencyProfile(data) {
  const { loanType } = data;
  
  switch(loanType) {
    case 'new_purchase': {
      const timeline = data.purchaseTimeline || 'exploring';
      const mappings = {
        'this_month': { level: 'immediate', score: 20, reason: 'Property purchase this month' },
        'next_3_months': { level: 'soon', score: 15, reason: 'Purchase within 3 months' },
        '3_6_months': { level: 'planning', score: 10, reason: 'Planning 3-6 months ahead' },
        'exploring': { level: 'exploring', score: 5, reason: 'Exploring options' }
      };
      return { ...mappings[timeline], source: 'purchaseTimeline' };
    }
    
    case 'refinance': {
      const lockStatus = data.lockInStatus || 'not_sure';
      const mappings = {
        'ending_soon': { level: 'immediate', score: 20, reason: 'Lock-in ending soon' },
        'no_lock': { level: 'soon', score: 15, reason: 'No penalty - can switch' },
        'not_sure': { level: 'soon', score: 12, reason: 'Status needs verification' },
        'locked': { level: 'planning', score: 8, reason: 'In lock-in period' }
      };
      return { ...mappings[lockStatus], source: 'lockInStatus' };
    }
    
    case 'equity_loan': {
      const purpose = data.purpose || 'other';
      const mappings = {
        'investment': { level: 'immediate', score: 18, reason: 'Investment opportunity' },
        'business': { level: 'immediate', score: 18, reason: 'Business capital' },
        'personal': { level: 'soon', score: 12, reason: 'Personal financing' },
        'other': { level: 'exploring', score: 8, reason: 'General equity inquiry' }
      };
      return { ...mappings[purpose], source: 'purpose' };
    }
    
    default:
      return { level: 'exploring', score: 5, source: 'default', reason: 'General inquiry' };
  }
}

// Calculate urgency profile
const urgencyProfile = calculateUrgencyProfile(formData);

// --- UNIVERSAL REQUIREMENTS ---
const universal = ['name', 'email', 'phone', 'loanType'];
const missingUniversal = universal.filter(f => !formData[f] && formData[f] !== 0);

// --- INTENT-BASED REQUIREMENTS ---
const loanType = formData.loanType || 'unknown';
let intentRequired = [];
let intentOptional = [];
let aiEnhancers = [];

switch(loanType) {
  case 'refinance':
    intentRequired = ['currentRate', 'outstandingLoan', 'monthlyIncome'];
    intentOptional = ['lockInStatus', 'currentBank', 'propertyValue', 'existingCommitments'];
    aiEnhancers = ['yearsRemaining', 'originalLoanAmount', 'propertyType'];
    break;
  case 'new_purchase':
    intentRequired = ['propertyType', 'priceRange', 'monthlyIncome'];
    intentOptional = ['purchaseTimeline', 'ipaStatus', 'firstTimeBuyer', 'existingCommitments'];
    aiEnhancers = ['employmentType', 'citizenship'];
    break;
  case 'equity_loan':
    intentRequired = ['propertyValue', 'outstandingLoan', 'monthlyIncome'];
    intentOptional = ['equityNeeded', 'purpose', 'existingCommitments'];
    aiEnhancers = ['propertyType', 'tenureDesired'];
    break;
  default:
    // Fallback for unknown loan types
    intentRequired = ['monthlyIncome'];
    intentOptional = ['propertyType', 'existingCommitments'];
    aiEnhancers = [];
}

// --- CALCULATE COMPLETENESS ---
const missingRequired = intentRequired.filter(f => !formData[f] && formData[f] !== 0);
const hasRequired = intentRequired.filter(f => formData[f] || formData[f] === 0);
const hasOptional = intentOptional.filter(f => formData[f] || formData[f] === 0);
const hasEnhancers = aiEnhancers.filter(f => formData[f] || formData[f] === 0);

// Scoring
const requiredScore = intentRequired.length ? (hasRequired.length / intentRequired.length) * 40 : 0;
const optionalScore = intentOptional.length ? (hasOptional.length / intentOptional.length) * 30 : 0;
const enhancerScore = aiEnhancers.length ? (hasEnhancers.length / aiEnhancers.length) * 20 : 0;
const universalScore = (1 - (missingUniversal.length / universal.length)) * 10;

const completenessScore = Math.round(requiredScore + optionalScore + enhancerScore + universalScore);

// --- DETERMINE VALIDATION STATE ---
const hasMinimumForAnalysis = missingUniversal.length === 0 && missingRequired.length <= 2;
const isComplete = missingUniversal.length === 0 && missingRequired.length === 0;

// --- CALCULATE CAPABILITIES ---
const capabilities = {
  canCalculatePayment: formData.loanType && (formData.priceRange || formData.outstandingLoan) && formData.monthlyIncome,
  canAssessDSR: formData.monthlyIncome && (formData.priceRange || formData.outstandingLoan),
  canMatchBanks: completenessScore >= 60,
  canGenerateReport: completenessScore >= 70,
  canProvideSavings: formData.currentRate && formData.outstandingLoan,
  canAssessUrgency: urgencyProfile.score > 0,
  canPersonalize: completenessScore >= 50
};

// --- DETERMINE ANALYSIS LEVEL ---
let analysisLevel = 'basic';
if (completenessScore >= 80) analysisLevel = 'comprehensive';
else if (completenessScore >= 60) analysisLevel = 'detailed';
else if (completenessScore >= 40) analysisLevel = 'moderate';

// --- CALCULATE METRICS ---
const metrics = {};

// DSR Calculation
if (formData.monthlyIncome) {
  const commitments = formData.existingCommitments || 0;
  let mortgagePayment = 0;
  
  if (formData.priceRange) {
    // New purchase: estimate based on 75% LTV, 30 years, 3.5% rate
    mortgagePayment = (formData.priceRange * 0.75 * 0.035) / 12;
  } else if (formData.outstandingLoan) {
    // Refinance/equity: use outstanding loan
    mortgagePayment = (formData.outstandingLoan * 0.035) / 12;
  }
  
  metrics.dsr = commitments > 0 || mortgagePayment > 0 
    ? ((commitments + mortgagePayment) / formData.monthlyIncome).toFixed(2)
    : 0;
}

// Potential Savings (for refinance)
if (formData.currentRate && formData.outstandingLoan) {
  const currentPayment = (formData.outstandingLoan * (formData.currentRate / 100)) / 12;
  const newPayment = (formData.outstandingLoan * 0.03) / 12; // Assume 3% new rate
  metrics.potentialSavings = Math.round(currentPayment - newPayment);
}

// Add urgency score to metrics
metrics.urgencyScore = urgencyProfile.score;

// --- LEAD SCORING PREVIEW ---
const leadScore = {
  completeness: completenessScore,
  urgency: urgencyProfile.score,
  hasHighValueSignals: 
    (formData.priceRange > 1500000) ||
    (formData.outstandingLoan > 1000000) ||
    (formData.monthlyIncome > 15000) ||
    (urgencyProfile.level === 'immediate')
};

// --- BUILD VALIDATION RESPONSE ---
const validation = {
  isValid: hasMinimumForAnalysis,
  isComplete: isComplete,
  completenessScore: completenessScore,
  analysisLevel: analysisLevel,
  
  missingFields: {
    universal: missingUniversal,
    required: missingRequired,
    optional: intentOptional.filter(f => !formData[f]),
    enhancers: aiEnhancers.filter(f => !formData[f])
  },
  
  presentFields: {
    required: hasRequired,
    optional: hasOptional,
    enhancers: hasEnhancers
  },
  
  dataCaveats: {
    limitations: [],
    improvements: []
  },
  
  urgencyProfile: urgencyProfile // Add urgency profile to validation
};

// Add specific caveats based on missing data
if (missingRequired.length > 0) {
  validation.dataCaveats.limitations.push(`Missing ${missingRequired.length} critical fields for complete analysis`);
  validation.dataCaveats.improvements.push(`Add ${missingRequired.join(', ')} for comprehensive insights`);
}

if (hasOptional.length < intentOptional.length / 2) {
  validation.dataCaveats.improvements.push('Complete optional fields for personalized recommendations');
}

// --- ENHANCED AI GUIDANCE ---
const ai = {
  capabilities: capabilities,
  recommendedAnalysisDepth: analysisLevel,
  
  suggestedInsights: [],
  warningsForAI: [],
  contextForAI: {}
};

// Build AI guidance based on available data
if (capabilities.canProvideSavings) {
  ai.suggestedInsights.push('savings_comparison');
  ai.contextForAI.savingsContext = {
    currentRate: formData.currentRate,
    potentialSavings: metrics.potentialSavings
  };
}

if (capabilities.canAssessDSR) {
  ai.suggestedInsights.push('affordability_assessment');
  ai.contextForAI.dsrContext = {
    dsr: metrics.dsr,
    isHealthy: metrics.dsr < 0.55
  };
}

if (urgencyProfile.level === 'immediate') {
  ai.suggestedInsights.push('urgent_action_plan');
  ai.contextForAI.urgencyContext = urgencyProfile;
}

// Add warnings for missing critical data
if (!formData.monthlyIncome) {
  ai.warningsForAI.push('Cannot calculate affordability without income');
}

if (!formData.propertyType && loanType === 'new_purchase') {
  ai.warningsForAI.push('Property type needed for accurate bank matching');
}

// --- FINAL OUTPUT ---
items[0].json = {
  ...items[0].json,
  validation: validation,
  ai: ai,
  metrics: metrics,
  leadScore: leadScore,
  urgency: urgencyProfile, // Add urgency as top-level field for easy access
  gate: gate || 'G3',
  timestamp: new Date().toISOString()
};

// Log summary
console.log(`
=== G3 VALIDATION SUMMARY ===
Loan Type: ${loanType}
Completeness: ${completenessScore}%
Analysis Level: ${analysisLevel}
Urgency: ${urgencyProfile.level} (${urgencyProfile.score}/20)
Can Proceed: ${validation.isValid}
Missing Required: ${missingRequired.join(', ') || 'None'}
DSR: ${metrics.dsr || 'N/A'}
Potential Savings: $${metrics.potentialSavings || 'N/A'}
=============================
`);

return items;