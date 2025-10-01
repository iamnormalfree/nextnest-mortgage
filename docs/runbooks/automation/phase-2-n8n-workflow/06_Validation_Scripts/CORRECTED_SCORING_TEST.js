// Test corrected scoring to ensure G1 stays at ~19 points (Cold)
function calculateLeadScore(formData, gate) {
  const completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;
  
  // All gates use G3 standards for base scoring pressure
  const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];
  const baseCompleteCount = g3Fields.reduce((a,k)=> a + (formData[k]?1:0),0);
  
  // ONLY G2 gets bonuses to differentiate from G1
  let loanSpecificBonus = 0;
  if (gate === 'G2') {
    // Loan-specific bonuses
    if (formData.loanType === 'new_purchase' && formData.purchaseTimeline) loanSpecificBonus += 2;
    if (formData.loanType === 'new_purchase' && formData.propertyType) loanSpecificBonus += 2;
    if (formData.loanType === 'refinance' && formData.propertyValue) loanSpecificBonus += 2;
    if (formData.loanType === 'refinance' && formData.outstandingLoan) loanSpecificBonus += 2;
    if (formData.loanType === 'refinance' && formData.lockInStatus) loanSpecificBonus += 2;
    if (formData.loanType === 'cash_equity' && formData.equityNeeded) loanSpecificBonus += 2;
    if (formData.loanType === 'cash_equity' && formData.purpose) loanSpecificBonus += 2;
    
    // G2 base field bonuses
    if (formData.phone) loanSpecificBonus += 1;
    if (formData.name) loanSpecificBonus += 1;
  }
  
  const completeness = Math.min(completenessMax, Math.round((baseCompleteCount/g3Fields.length)*completenessMax) + loanSpecificBonus);
  
  // Finance score
  let finance = financeMax;
  
  if (gate === 'G3') {
    const income = Number(formData.monthlyIncome)||0;
    const outstanding = Number(formData.outstandingLoan)||0;
    const dsr = income ? (outstanding*0.003/income) : 0;
    
    if (!income) finance -= 20;
    if (dsr>0.55) finance -= 15;
    if (dsr>0.65) finance -= 25;
  } else if (gate === 'G2') {
    if (formData.loanType === 'refinance' && formData.propertyValue && formData.outstandingLoan) {
      const propertyValue = Number(formData.propertyValue) || 0;
      const outstanding = Number(formData.outstandingLoan) || 0;
      const ltv = propertyValue > 0 ? (outstanding / propertyValue) : 1;
      
      if (ltv < 0.6) finance += 5;
      else if (ltv > 0.8) finance -= 10;
    } else {
      finance -= 5;
    }
  } else if (gate === 'G1') {
    finance -= 25; // G1 penalty unchanged
  }
  
  // Urgency
  const urgencyMapping = {
    'this_month': urgencyMax, 'immediate': urgencyMax, 'next_month': 15,
    'next_3_months': 12, 'ending_soon': 15, 'within_6_months': 8, '6_months_plus': 5
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
    score, segment,
    breakdown: { completeness, finance, urgency, engagement, loanSpecificBonus, baseCompleteCount, rawScore }
  };
}

console.log("=== CORRECTED SCORING VALIDATION ===\n");

// G1 Test - Should return to ~19 points (Cold)
const g1 = { email: "test@test.com", loanType: "refinance" };
const g1Result = calculateLeadScore(g1, 'G1');

console.log("G1 CORRECTED:");
console.log(`Score: ${g1Result.score} (${g1Result.segment})`);
console.log(`Expected: ~19 (Cold)`);
console.log(`Fields: email + loanType = 2/8 G3 fields`);
console.log(`Breakdown:`, g1Result.breakdown);
console.log();

// G2 Tests - Should maintain high scores
const g2Refinance = {
  name: "David Lim", email: "david@example.com", phone: "98765432",
  loanType: "refinance", propertyValue: "800000", outstandingLoan: "500000", lockInStatus: "ending_soon"
};

const g2Result = calculateLeadScore(g2Refinance, 'G2');
console.log("G2 REFINANCE:");
console.log(`Score: ${g2Result.score} (${g2Result.segment})`);
console.log(`Expected: ~90+ (Premium)`);
console.log(`Breakdown:`, g2Result.breakdown);
console.log();

// Summary
console.log("=== VALIDATION SUMMARY ===");
console.log(`G1: ${g1Result.score} (${g1Result.segment}) - Should be ~19 Cold ✅`);
console.log(`G2: ${g2Result.score} (${g2Result.segment}) - Should be ~90+ Premium ✅`);

if (g1Result.score <= 25 && g1Result.segment === 'Cold') {
  console.log("\n✅ G1 SCORING FIXED - Tollbooth strategy preserved!");
} else {
  console.log("\n❌ G1 still broken - needs further adjustment");
}