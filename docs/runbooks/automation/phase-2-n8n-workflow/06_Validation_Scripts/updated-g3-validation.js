/**
 * Updated G3 Validation for n8n Workflow
 * Implements dynamic, intent-based validation
 * Lead: Marcus Chen & Wei Zhang
 */

// For n8n Code Node: Gate 3 Profile Validator & Ratios
const { formData = {}, gate } = items[0].json;

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
const enhancerScore = aiEnhancers.length ? (hasEnhancers.length / aiEnhancers.length) * 30 : 30;
const completenessScore = Math.round(requiredScore + optionalScore + enhancerScore);

// --- FINANCIAL CALCULATIONS ---
const income = Number(formData.monthlyIncome) || 0;
const outstanding = Number(formData.outstandingLoan) || 0;
const commitments = Number(formData.existingCommitments) || 0;
const currentRate = Number(formData.currentRate) || 0;
const priceRange = Number(formData.priceRange) || 0;

// DSR Calculation
let dsr = null;
if (income > 0) {
  const monthlyDebt = (outstanding * 0.003) + commitments;
  dsr = Number((monthlyDebt / income).toFixed(2));
}

// Potential Savings (refinance)
let potentialSavings = null;
if (loanType === 'refinance' && currentRate > 0 && outstanding > 0) {
  const marketRate = 2.8; // Current market average
  if (currentRate > marketRate) {
    const currentMonthly = outstanding * (currentRate / 100 / 12);
    const newMonthly = outstanding * (marketRate / 100 / 12);
    potentialSavings = Math.round(currentMonthly - newMonthly);
  }
}

// Max Affordability (new purchase)
let maxLoan = null;
if (loanType === 'new_purchase' && income > 0) {
  const maxDSR = 0.55;
  const maxMonthlyPayment = (income * maxDSR) - commitments;
  maxLoan = Math.round(maxMonthlyPayment * 300); // Rough loan calculation
}

// --- URGENCY CALCULATION ---
let urgencyScore = 30; // Base urgency

// Lock-in urgency
if (formData.lockInStatus === 'ending_soon') urgencyScore += 40;
else if (formData.lockInStatus === 'ended') urgencyScore += 30;
else if (formData.lockInStatus === 'locked_in') urgencyScore -= 10;

// Rate urgency (refinance)
if (currentRate > 4) urgencyScore += 30;
else if (currentRate > 3.5) urgencyScore += 20;
else if (currentRate > 3) urgencyScore += 10;

// Timeline urgency (new purchase)
if (formData.purchaseTimeline === 'immediate') urgencyScore += 40;
else if (formData.purchaseTimeline === '3_months') urgencyScore += 25;
else if (formData.purchaseTimeline === '6_months') urgencyScore += 10;

// Cap at 100
urgencyScore = Math.min(100, urgencyScore);

// --- AI READINESS ASSESSMENT ---
const aiCapabilities = {
  canGenerateInsights: missingRequired.length === 0,
  canCalculateSavings: loanType === 'refinance' ? 
    Boolean(currentRate && outstanding) : 
    Boolean(priceRange && income),
  canProvideBankMatches: Boolean(income && (formData.propertyType || formData.propertyValue)),
  canOfferTimingAdvice: loanType === 'refinance' ? 
    Boolean(formData.lockInStatus) : 
    Boolean(formData.purchaseTimeline),
  canProvideFullAnalysis: completenessScore >= 70
};

// --- DETERMINE ANALYSIS LEVEL ---
let analysisLevel = 'basic';
if (completenessScore >= 80) analysisLevel = 'comprehensive';
else if (completenessScore >= 60) analysisLevel = 'intermediate';

// --- INTELLIGENT INSIGHT HINTS FOR AI ---
const insightHints = [];

if (dsr && dsr > 0.55) {
  insightHints.push('high_dsr_warning');
}

if (potentialSavings && potentialSavings > 500) {
  insightHints.push('significant_savings_opportunity');
}

if (currentRate && currentRate > 3.5) {
  insightHints.push('above_market_rate');
}

if (formData.lockInStatus === 'ending_soon') {
  insightHints.push('optimal_refinance_window');
}

if (loanType === 'new_purchase' && !formData.ipaStatus) {
  insightHints.push('suggest_ipa_advantage');
}

// --- OUTPUT STRUCTURE ---
items[0].json = {
  // Original data
  formData,
  gate,
  
  // Validation results
  validation: {
    ok: missingUniversal.length === 0 && missingRequired.length === 0,
    missingUniversal,
    missingRequired,
    missingOptional: intentOptional.filter(f => !formData[f] && formData[f] !== 0),
    completenessScore,
    analysisLevel
  },
  
  // Financial metrics
  metrics: {
    dsr,
    potentialSavings,
    maxLoan,
    urgencyScore
  },
  
  // AI guidance
  ai: {
    capabilities: aiCapabilities,
    insightHints,
    recommendedAnalysisDepth: analysisLevel,
    dataQuality: completenessScore >= 70 ? 'high' : completenessScore >= 40 ? 'medium' : 'low'
  },
  
  // Lead scoring inputs
  leadScore: {
    completeness: completenessScore,
    urgency: urgencyScore,
    hasHighValueSignals: Boolean(potentialSavings > 1000 || priceRange > 1500000),
    engagementLevel: gate === 'G3' ? 'high' : gate === 'G2' ? 'medium' : 'low'
  },
  
  // Processing metadata
  processedAt: new Date().toISOString(),
  workflowVersion: '2.0',
  validationType: 'dynamic_intent_based'
};

console.log('=== G3 VALIDATION COMPLETE ===');
console.log('Loan Type:', loanType);
console.log('Completeness:', completenessScore + '%');
console.log('Analysis Level:', analysisLevel);
console.log('AI Capabilities:', Object.entries(aiCapabilities).filter(([k,v]) => v).map(([k]) => k).join(', '));
console.log('Insight Hints:', insightHints.join(', '));

return items;