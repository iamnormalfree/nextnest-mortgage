// Test EXACT original scoring logic to understand 19-point G1
function originalLeadScore(formData, gate) {
  const completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;
  const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];

  // Original completeness calculation
  const completeCount = g3Fields.reduce((a,k)=> a + (formData[k]?1:0),0);
  const completeness = Math.round((completeCount/g3Fields.length)*completenessMax);
  
  // Original finance calculation 
  const income = Number(formData.monthlyIncome)||0;
  const outstanding = Number(formData.outstandingLoan)||0;
  const dsr = income? (outstanding*0.003/income) : 0;
  let finance = financeMax;
  
  if (!income) finance -= 20;  // This applies to ALL gates including G1
  if (dsr>0.55) finance -= 15;
  if (dsr>0.65) finance -= 25;
  if (gate==='G1') finance -= 25; // Additional G1 penalty
  
  // Make sure finance doesn't go below 0
  finance = Math.max(0, finance);
  
  // Original urgency calculation
  let urgency = 5;
  const u = (formData.urgency||'').toString().toLowerCase();
  if (u.includes('immediate')) urgency = urgencyMax;
  else if (u.includes('2')||u.includes('week')) urgency = 12;
  else urgency = 8;
  
  // Original engagement
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
    breakdown: { completeness, finance, urgency, engagement, rawScore, completeCount }
  };
}

console.log("=== ORIGINAL LOGIC TRACE ===\n");

// Test exact G1 data that should give 19 points
const g1Data = { email: "test@test.com", loanType: "refinance" };
const g1Original = originalLeadScore(g1Data, 'G1');

console.log("ORIGINAL G1 CALCULATION:");
console.log(`Data:`, g1Data);
console.log(`Fields in g3Fields:`, ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency']);
console.log(`Fields present: loanType only = 1 field`);
console.log(`Completeness: 1/8 = ${Math.round((1/8)*30)} = ${Math.round(3.75)} points`);
console.log(`Finance: 40 - 20 (no income) - 25 (G1) = -5 → capped to 0`);
console.log(`Urgency: Default 8 points`);
console.log(`Engagement: G1 = 3 points`);
console.log(`Total: ${Math.round(3.75)} + 0 + 8 + 3 = ${Math.round(3.75) + 0 + 8 + 3}`);
console.log();
console.log("ACTUAL RESULT:");
console.log(`Score: ${g1Original.score} (${g1Original.segment})`);
console.log(`Breakdown:`, g1Original.breakdown);

// The discrepancy suggests there might be rounding or field counting differences
console.log("\n=== DETAILED FIELD ANALYSIS ===");
const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];
g3Fields.forEach(field => {
  const hasField = g1Data[field] !== undefined && g1Data[field] !== '';
  console.log(`${field}: ${hasField ? '✅' : '❌'} (${g1Data[field] || 'undefined'})`);
});

const actualCount = g3Fields.reduce((a,k)=> a + (g1Data[k]?1:0),0);
console.log(`\nActual field count: ${actualCount}/8`);
console.log(`Completeness calculation: ${actualCount}/8 * 30 = ${(actualCount/8)*30} → ${Math.round((actualCount/8)*30)}`);