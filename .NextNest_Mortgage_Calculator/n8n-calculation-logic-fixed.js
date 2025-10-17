// Fixed n8n Calculation Logic for NextNest Lead Processing
// Node 3: Data Processing & Lead Scoring - v1.2

// Helper function for monthly payment calculation
function calculateMonthlyPayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Main calculation logic
const loan = Number($json.loanQuantum || $json.loanAmount || 0);
const value = Number($json.propertyValue || 0);
const ltv = value > 0 ? (loan / value) * 100 : 0;  // Convert to percentage
const currentBank = $json.currentBank || '';
const timeline = $json.timeline || '';
const monthlyIncome = Number($json.monthlyIncome || 0);
const existingDebt = Number($json.existingDebt || 0);
const interestRate = Number($json.interestRate || 3.5); // Add interest rate parsing
const loanTenure = Number($json.loanTenure || 25); // Add loan tenure parsing

// Property type detection (match calculator options) - FIXED case sensitivity
const propertyType = ($json.propertyType || '');
const propertyTypeLower = propertyType.toLowerCase();
const isCommercial = propertyType === 'Commercial' || propertyTypeLower === 'commercial';
const isPrivate = propertyType === 'Private' || propertyTypeLower === 'private';
const isHDB = propertyType === 'HDB' || propertyTypeLower === 'hdb';

// Lead scoring system
let score = 0;

// Loan amount scoring
if (loan >= 1500000) score += 3; 
else if (loan >= 1000000) score += 2; 
else if (loan >= 750000) score += 1;

// Property type scoring
if (isCommercial) score += 2;
if (isPrivate && loan >= 800000) score += 1; // High-value private

// Timeline urgency scoring (FIXED)
switch(timeline) {
  case 'immediate': score += 3; break;
  case 'soon': score += 2; break;
  case 'planning': score += 1; break;
  default: score += 0;
}

// Income qualification scoring
if (monthlyIncome > 0) {
  const monthlyPaymentRatio = loan > 0 ? (calculateMonthlyPayment(loan, 3.5, 25) / monthlyIncome) * 100 : 0;
  if (monthlyPaymentRatio <= 25) score += 1; // Good MSR ratio
}

const priority = score >= 7 ? 'A' : score >= 4 ? 'B' : 'C';

// Enhanced savings calculation - Use actual provided rate
const currentRate = interestRate || 3.5; // Use provided rate or default
const optimizedRate = Math.max(currentRate - 0.3, 2.5); // Conservative optimization with floor
const monthlyPayment = calculateMonthlyPayment(loan, currentRate, loanTenure);
const optimizedPayment = calculateMonthlyPayment(loan, optimizedRate, loanTenure);
const estSavingsMonth = Math.max(monthlyPayment - optimizedPayment, 0); // Ensure non-negative
const estSavingsYear = estSavingsMonth * 12;

// TDSR/MSR calculations (Singapore-specific)
const totalDebtService = monthlyPayment + existingDebt;
const tdsr = monthlyIncome > 0 ? (totalDebtService / monthlyIncome) * 100 : 0;
const msr = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0;

// CRM routing logic - Enhanced with multiple criteria
const isHighValue = loan >= 800000 || (isPrivate && loan >= 600000);
const crmDestination = isCommercial || isHighValue ? 'hubspot' : 'airtable';

// Campaign attribution
const source = $json.source || 'website_calculator';
const campaign = $json.campaign || 'general';

// Follow-up sequence determination
let followUpSequence = 'standard_nurture';
if (timeline === 'immediate') followUpSequence = 'urgent_24h';
if (priority === 'A') followUpSequence = 'high_value_vip';

return { 
  json: { 
    ...$json, 
    
    // Calculated metrics
    ltv: Math.round(ltv * 10) / 10,
    tdsr: Math.round(tdsr * 10) / 10,
    msr: Math.round(msr * 10) / 10,
    monthlyPayment: Math.round(monthlyPayment),
    
    // Lead scoring
    leadScore: score, 
    priority, 
    
    // Savings potential
    estSavingsMonth: Math.round(estSavingsMonth),
    estSavingsYear: Math.round(estSavingsYear), 
    
    // Segmentation
    segment: isCommercial ? 'commercial' : 'residential',
    propertyTypeCategory: propertyType,
    
    // Routing
    crmDestination,
    followUpSequence,
    
    // Attribution
    source,
    campaign,
    
    // Processing metadata
    processedAt: new Date().toISOString(),
    processingVersion: '1.1'
  } 
};