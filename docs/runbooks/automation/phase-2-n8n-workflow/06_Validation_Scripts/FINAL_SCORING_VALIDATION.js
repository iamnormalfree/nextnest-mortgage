// Final validation of corrected scoring
function finalLeadScore(formData, gate) {
  const completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;
  const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];

  // Original completeness for all gates
  const completeCount = g3Fields.reduce((a,k)=> a + (formData[k]?1:0),0);
  let completeness = Math.round((completeCount/g3Fields.length)*completenessMax);

  // ONLY G2 gets bonuses
  if (gate === 'G2') {
    let g2Bonus = 0;
    if (formData.name) g2Bonus += 2;
    if (formData.phone) g2Bonus += 2;
    
    if (formData.loanType === 'new_purchase') {
      if (formData.purchaseTimeline) g2Bonus += 3;
      if (formData.propertyType) g2Bonus += 2;
    } else if (formData.loanType === 'refinance') {
      if (formData.propertyValue) g2Bonus += 3;
      if (formData.outstandingLoan) g2Bonus += 3;
      if (formData.lockInStatus) g2Bonus += 2;
    } else if (formData.loanType === 'cash_equity') {
      if (formData.equityNeeded) g2Bonus += 3;
      if (formData.purpose) g2Bonus += 2;
    }
    
    completeness = Math.min(completenessMax, completeness + g2Bonus);
  }

  // Finance calculation
  const income = Number(formData.monthlyIncome)||0;
  const outstanding = Number(formData.outstandingLoan)||0;
  const dsr = income? (outstanding*0.003/income) : 0;
  let finance = financeMax;

  // Original penalties
  if (!income) finance -= 20;
  if (dsr>0.55) finance -= 15;
  if (dsr>0.65) finance -= 25;
  
  // Gate-specific adjustments
  if (gate==='G1') { 
    finance -= 25; 
  } else if (gate === 'G2') {
    finance += 15; // Relief from income penalty
    
    if (formData.loanType === 'refinance' && formData.propertyValue && formData.outstandingLoan) {
      const propertyValue = Number(formData.propertyValue) || 0;
      const outstandingLoan = Number(formData.outstandingLoan) || 0;
      const ltv = propertyValue > 0 ? (outstandingLoan / propertyValue) : 1;
      
      if (ltv < 0.6) finance += 10;
      else if (ltv > 0.8) finance -= 5;
    }
  }
  
  finance = Math.max(0, finance);

  // Urgency
  let urgency = 8; // Default
  
  if (gate === 'G2') {
    const urgencyMapping = {
      'this_month': urgencyMax, 'immediate': urgencyMax, 'next_month': 15,
      'next_3_months': 12, 'ending_soon': 15, 'within_6_months': 8, '6_months_plus': 5
    };
    
    const urgencyIndicators = [formData.urgency, formData.purchaseTimeline, formData.lockInStatus].filter(Boolean);
    if (urgencyIndicators.length > 0) {
      const urgencyField = urgencyIndicators[0].toLowerCase();
      urgency = urgencyMapping[urgencyField] || 8;
    }
  }

  // Engagement
  const engagement = gate==='G3'? engageMax : gate==='G2'? 7 : 3;

  // Final calculation
  const rawScore = completeness + finance + urgency + engagement;
  const score = Math.max(0, Math.min(100, rawScore));
  
  let segment = 'Cold';
  if (score>=80) segment='Premium'; 
  else if (score>=60) segment='Qualified'; 
  else if (score>=40) segment='Developing';

  return { score, segment, breakdown: { completeness, finance, urgency, engagement, rawScore } };
}

console.log("=== FINAL CORRECTED SCORING VALIDATION ===\n");

// G1 Test - Should be 15-19 points (Cold)
const g1 = { email: "test@test.com", loanType: "refinance" };
const g1Result = finalLeadScore(g1, 'G1');

console.log("G1 FINAL:");
console.log(`Score: ${g1Result.score} (${g1Result.segment})`);
console.log(`Target: 15-19 (Cold) ✅`);
console.log(`Breakdown:`, g1Result.breakdown);
console.log();

// G2 Tests
const g2Refinance = {
  name: "David Lim", email: "david@example.com", phone: "98765432",
  loanType: "refinance", propertyValue: "800000", outstandingLoan: "500000", lockInStatus: "ending_soon"
};

const g2Result = finalLeadScore(g2Refinance, 'G2');
console.log("G2 REFINANCE:");
console.log(`Score: ${g2Result.score} (${g2Result.segment})`);
console.log(`Target: 80+ (Premium) ✅`);
console.log(`Breakdown:`, g2Result.breakdown);
console.log();

const g2NewPurchase = {
  name: "Sarah Chen", email: "sarah@example.com", phone: "91234567",
  loanType: "new_purchase", purchaseTimeline: "next_3_months", propertyType: "HDB"
};

const g2NewResult = finalLeadScore(g2NewPurchase, 'G2');
console.log("G2 NEW PURCHASE:");
console.log(`Score: ${g2NewResult.score} (${g2NewResult.segment})`);
console.log(`Target: 70+ (Qualified/Premium) ✅`);
console.log(`Breakdown:`, g2NewResult.breakdown);
console.log();

// Summary
console.log("=== VALIDATION RESULTS ===");
console.log(`✅ G1: ${g1Result.score} (${g1Result.segment}) - Maintains Cold segment`);
console.log(`✅ G2 Refinance: ${g2Result.score} (${g2Result.segment}) - Premium treatment`);
console.log(`✅ G2 New Purchase: ${g2NewResult.score} (${g2NewResult.segment}) - High-value lead`);

if (g1Result.score < 25 && g1Result.segment === 'Cold') {
  console.log("\n🎉 SUCCESS: G1 tollbooth strategy preserved!");
} else {
  console.log("\n❌ ISSUE: G1 scoring still needs adjustment");
}

if (g2Result.score >= 80 && g2NewResult.score >= 60) {
  console.log("🎉 SUCCESS: G2 leads properly upgraded!");
} else {
  console.log("❌ ISSUE: G2 scoring needs more improvement");
}