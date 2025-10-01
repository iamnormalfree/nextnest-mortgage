// Test script for corrected G2 scoring
function calculateLeadScore(formData, gate) {
  const completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;
  
  // Gate-appropriate field expectations
  const g2Fields = ['name','email','phone','loanType'];
  const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];
  
  const requiredFields = gate === 'G3' ? g3Fields : g2Fields;
  const completeCount = requiredFields.reduce((a,k)=> a + (formData[k]?1:0),0);
  
  // Add loan-specific field bonuses for G2
  let loanSpecificBonus = 0;
  if (gate === 'G2') {
    if (formData.loanType === 'new_purchase' && formData.purchaseTimeline) loanSpecificBonus += 2;
    if (formData.loanType === 'new_purchase' && formData.propertyType) loanSpecificBonus += 2;
    if (formData.loanType === 'refinance' && formData.propertyValue) loanSpecificBonus += 2;
    if (formData.loanType === 'refinance' && formData.outstandingLoan) loanSpecificBonus += 2;
    if (formData.loanType === 'refinance' && formData.lockInStatus) loanSpecificBonus += 2;
    if (formData.loanType === 'cash_equity' && formData.equityNeeded) loanSpecificBonus += 2;
    if (formData.loanType === 'cash_equity' && formData.purpose) loanSpecificBonus += 2;
  }
  
  const completeness = Math.min(completenessMax, Math.round((completeCount/requiredFields.length)*completenessMax) + loanSpecificBonus);
  
  // Enhanced finance score
  let finance = financeMax;
  
  if (gate === 'G2') {
    if (formData.loanType === 'refinance' && formData.propertyValue && formData.outstandingLoan) {
      const propertyValue = Number(formData.propertyValue) || 0;
      const outstanding = Number(formData.outstandingLoan) || 0;
      const ltv = propertyValue > 0 ? (outstanding / propertyValue) : 1;
      
      if (ltv < 0.6) finance += 5;
      else if (ltv > 0.8) finance -= 10;
    } else {
      finance -= 5; // Minor penalty, not -20
    }
  } else if (gate === 'G1') {
    finance -= 25;
  }
  
  // Enhanced urgency
  const urgencyMapping = {
    'this_month': urgencyMax,
    'immediate': urgencyMax,
    'next_month': 15,
    'next_3_months': 12,
    'ending_soon': 15,
    'within_6_months': 8,
    '6_months_plus': 5
  };
  
  const urgencyIndicators = [formData.urgency, formData.purchaseTimeline, formData.lockInStatus].filter(Boolean);
  const urgencyField = urgencyIndicators[0] || '';
  const urgency = urgencyMapping[urgencyField.toLowerCase()] || 8;
  
  // Engagement
  const engagement = gate==='G3'? engageMax : gate==='G2'? 7 : 3;
  
  // Final calculation
  const rawScore = completeness + finance + urgency + engagement;
  const score = Math.max(0, Math.min(100, rawScore));
  
  let segment = 'Cold';
  if (score>=80) segment='Premium'; 
  else if (score>=60) segment='Qualified'; 
  else if (score>=40) segment='Developing';
  
  return {
    score,
    segment,
    breakdown: { completeness, finance, urgency, engagement, loanSpecificBonus, rawScore }
  };
}

// Test cases
console.log("=== CORRECTED G2 SCORING TESTS ===\n");

// Test 1: New Purchase G2
const newPurchase = {
  name: "Sarah Chen",
  email: "sarah.chen@example.com",
  phone: "91234567",
  loanType: "new_purchase",
  purchaseTimeline: "next_3_months",
  propertyType: "HDB"
};

const newPurchaseResult = calculateLeadScore(newPurchase, 'G2');
console.log("NEW PURCHASE G2:");
console.log(`Score: ${newPurchaseResult.score} (${newPurchaseResult.segment})`);
console.log(`Breakdown:`, newPurchaseResult.breakdown);
console.log();

// Test 2: Refinance G2  
const refinance = {
  name: "David Lim",
  email: "david@example.com", 
  phone: "98765432",
  loanType: "refinance",
  propertyValue: "800000",
  outstandingLoan: "500000", 
  lockInStatus: "ending_soon"
};

const refinanceResult = calculateLeadScore(refinance, 'G2');
console.log("REFINANCE G2:");
console.log(`Score: ${refinanceResult.score} (${refinanceResult.segment})`);
console.log(`Breakdown:`, refinanceResult.breakdown);
console.log();

// Test 3: Cash Equity G2
const cashEquity = {
  name: "Jennifer Wong",
  email: "jennifer@example.com",
  phone: "87654321", 
  loanType: "cash_equity",
  purpose: "investment",
  equityNeeded: "200000"
};

const cashEquityResult = calculateLeadScore(cashEquity, 'G2');
console.log("CASH EQUITY G2:");
console.log(`Score: ${cashEquityResult.score} (${cashEquityResult.segment})`);
console.log(`Breakdown:`, cashEquityResult.breakdown);
console.log();

// Comparison with old scoring
console.log("=== COMPARISON ===");
console.log("Old G2 scoring: All ~43-46 points (Developing)");
console.log(`New Purchase: ${newPurchaseResult.score} (${newPurchaseResult.segment})`);
console.log(`Refinance: ${refinanceResult.score} (${refinanceResult.segment})`); 
console.log(`Cash Equity: ${cashEquityResult.score} (${cashEquityResult.segment})`);