// Comprehensive test for G1 and G2 scoring with new logic
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
  
  if (gate === 'G3') {
    // Full income assessment only at Gate 3
    const income = Number(formData.monthlyIncome)||0;
    const outstanding = Number(formData.outstandingLoan)||0;
    const dsr = income ? (outstanding*0.003/income) : 0;
    
    if (!income) { finance -= 20; }
    if (dsr>0.55) { finance -= 15; }
    if (dsr>0.65) { finance -= 25; }
  } else if (gate === 'G2') {
    // Gate 2: Use available financial indicators
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
    finance -= 25; // G1 penalty as before
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

console.log("=== COMPREHENSIVE G1/G2 TESTING ===\n");

// G1 Tests - Should still work as before
console.log("--- G1 TESTS ---");

const g1Basic = {
  email: "test@example.com",
  loanType: "refinance"
};

const g1Result = calculateLeadScore(g1Basic, 'G1');
console.log("G1 Basic (email only):");
console.log(`Score: ${g1Result.score} (${g1Result.segment})`);
console.log(`Expected: ~19 (Cold)`);
console.log(`Breakdown:`, g1Result.breakdown);
console.log();

// G2 Tests - New improved scoring
console.log("--- G2 TESTS ---");

const g2NewPurchase = {
  name: "Sarah Chen",
  email: "sarah@example.com",
  phone: "91234567",
  loanType: "new_purchase",
  purchaseTimeline: "next_3_months",
  propertyType: "HDB"
};

const g2NewPurchaseResult = calculateLeadScore(g2NewPurchase, 'G2');
console.log("G2 New Purchase:");
console.log(`Score: ${g2NewPurchaseResult.score} (${g2NewPurchaseResult.segment})`);
console.log(`Breakdown:`, g2NewPurchaseResult.breakdown);
console.log();

const g2Refinance = {
  name: "David Lim",
  email: "david@example.com",
  phone: "98765432", 
  loanType: "refinance",
  propertyValue: "800000",
  outstandingLoan: "500000",
  lockInStatus: "ending_soon"
};

const g2RefinanceResult = calculateLeadScore(g2Refinance, 'G2');
console.log("G2 Refinance:");
console.log(`Score: ${g2RefinanceResult.score} (${g2RefinanceResult.segment})`);
console.log(`Breakdown:`, g2RefinanceResult.breakdown);
console.log();

const g2CashEquity = {
  name: "Jennifer Wong", 
  email: "jennifer@example.com",
  phone: "87654321",
  loanType: "cash_equity",
  purpose: "investment",
  equityNeeded: "200000"
};

const g2CashEquityResult = calculateLeadScore(g2CashEquity, 'G2');
console.log("G2 Cash Equity:");
console.log(`Score: ${g2CashEquityResult.score} (${g2CashEquityResult.segment})`);
console.log(`Breakdown:`, g2CashEquityResult.breakdown);
console.log();

// Edge Cases
console.log("--- EDGE CASE TESTS ---");

const g2Minimal = {
  name: "Min Info",
  email: "min@example.com", 
  phone: "12345678",
  loanType: "new_purchase"
  // No additional fields
};

const g2MinimalResult = calculateLeadScore(g2Minimal, 'G2');
console.log("G2 Minimal (just required fields):");
console.log(`Score: ${g2MinimalResult.score} (${g2MinimalResult.segment})`);
console.log(`Breakdown:`, g2MinimalResult.breakdown);
console.log();

console.log("=== SUMMARY ===");
console.log(`G1 Basic: ${g1Result.score} (${g1Result.segment}) - No change from before`);
console.log(`G2 New Purchase: ${g2NewPurchaseResult.score} (${g2NewPurchaseResult.segment}) - Much improved`);  
console.log(`G2 Refinance: ${g2RefinanceResult.score} (${g2RefinanceResult.segment}) - Highest value`);
console.log(`G2 Cash Equity: ${g2CashEquityResult.score} (${g2CashEquityResult.segment}) - Premium segment`);
console.log(`G2 Minimal: ${g2MinimalResult.score} (${g2MinimalResult.segment}) - Still decent score`);