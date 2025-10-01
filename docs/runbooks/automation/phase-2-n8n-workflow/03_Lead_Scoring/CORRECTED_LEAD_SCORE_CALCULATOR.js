// CORRECTED Lead Score Calculator - Maintains G1 Cold Segment
const { formData={}, gate, ai } = items[0].json;
const completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;

// Field expectations - G1 and G2 use G3 standards to maintain scoring pressure
const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];
const baseCompleteCount = g3Fields.reduce((a,k)=> a + (formData[k]?1:0),0);

// ONLY G2 gets loan-specific bonuses to differentiate from G1
let loanSpecificBonus = 0;
if (gate === 'G2') {
  // Loan-specific field bonuses for G2 differentiation
  if (formData.loanType === 'new_purchase' && formData.purchaseTimeline) loanSpecificBonus += 2;
  if (formData.loanType === 'new_purchase' && formData.propertyType) loanSpecificBonus += 2;
  if (formData.loanType === 'refinance' && formData.propertyValue) loanSpecificBonus += 2;
  if (formData.loanType === 'refinance' && formData.outstandingLoan) loanSpecificBonus += 2;
  if (formData.loanType === 'refinance' && formData.lockInStatus) loanSpecificBonus += 2;
  if (formData.loanType === 'cash_equity' && formData.equityNeeded) loanSpecificBonus += 2;
  if (formData.loanType === 'cash_equity' && formData.purpose) loanSpecificBonus += 2;
  
  // G2 also gets base field adjustments for having phone/name
  if (formData.phone) loanSpecificBonus += 1;
  if (formData.name) loanSpecificBonus += 1;
}

// Calculate completeness - G1 uses base G3 standards, G2 gets bonuses
const completeness = Math.min(completenessMax, Math.round((baseCompleteCount/g3Fields.length)*completenessMax) + loanSpecificBonus);

console.log(`COMPLETENESS: ${baseCompleteCount}/${g3Fields.length} fields + ${loanSpecificBonus} G2 bonus = ${completeness}/${completenessMax}`);
console.log('Fields present:', g3Fields.filter(k => formData[k]));
console.log('Fields missing:', g3Fields.filter(k => !formData[k]));

// Finance score calculation - unchanged logic
let finance = financeMax;
console.log(`FINANCE START: ${finance}/${financeMax}`);

if (gate === 'G3') {
  // Full income assessment only at Gate 3
  const income = Number(formData.monthlyIncome)||0;
  const outstanding = Number(formData.outstandingLoan)||0;
  const dsr = income ? (outstanding*0.003/income) : 0;
  
  if (!income) { finance -= 20; console.log('No income: -20, now', finance); }
  if (dsr>0.55) { finance -= 15; console.log('DSR >55%: -15, now', finance); }
  if (dsr>0.65) { finance -= 25; console.log('DSR >65%: -25, now', finance); }
} else if (gate === 'G2') {
  // Gate 2: Use available financial indicators
  if (formData.loanType === 'refinance' && formData.propertyValue && formData.outstandingLoan) {
    const propertyValue = Number(formData.propertyValue) || 0;
    const outstanding = Number(formData.outstandingLoan) || 0;
    const ltv = propertyValue > 0 ? (outstanding / propertyValue) : 1;
    
    console.log(`Refinance LTV assessment: ${outstanding}/${propertyValue} = ${(ltv*100).toFixed(1)}%`);
    if (ltv < 0.6) { 
      finance += 5; 
      console.log('Strong LTV position: +5, now', finance); 
    } else if (ltv > 0.8) { 
      finance -= 10; 
      console.log('High leverage: -10, now', finance); 
    }
  } else {
    // Minor penalty for missing financial profile, not full income penalty
    finance -= 5;
    console.log('Incomplete financial profile: -5, now', finance);
  }
} else if (gate === 'G1') {
  finance -= 25; 
  console.log('Gate G1: -25, now', finance);
}

console.log(`FINANCE FINAL: ${finance}/${financeMax}`);

// Urgency calculation with loan-specific mapping
let urgency = 5;
const urgencyMapping = {
  'this_month': urgencyMax,
  'immediate': urgencyMax,
  'next_month': 15,
  'next_3_months': 12,
  'ending_soon': 15,  // Lock-in ending
  'within_6_months': 8,
  '6_months_plus': 5
};

// Check multiple urgency sources
const urgencyIndicators = [
  formData.urgency,
  formData.purchaseTimeline, 
  formData.lockInStatus
].filter(Boolean);

const urgencyField = urgencyIndicators[0] || '';
urgency = urgencyMapping[urgencyField.toLowerCase()] || 8;

console.log(`URGENCY: Indicators [${urgencyIndicators.join(', ')}] -> ${urgency}/${urgencyMax}`);

// Calculate engagement score
const engagement = gate==='G3'? engageMax : gate==='G2'? 7 : 3;
console.log(`ENGAGEMENT: Gate ${gate} = ${engagement}/${engageMax}`);

// Final score calculation
const rawScore = completeness + finance + urgency + engagement;
let score = Math.max(0, Math.min(100, rawScore));
console.log(`SCORE BREAKDOWN: ${completeness} + ${finance} + ${urgency} + ${engagement} = ${rawScore} (capped to ${score})`);

// Segment classification 
let segment = 'Cold';
if (score>=80) segment='Premium'; 
else if (score>=60) segment='Qualified'; 
else if (score>=40) segment='Developing';

console.log(`SEGMENT: Score ${score} -> ${segment}`);

// Calculate DSR only when income is available
const income = Number(formData.monthlyIncome)||0;
const outstanding = Number(formData.outstandingLoan)||0;
const dsr = income ? Number(((outstanding*0.003/income)).toFixed(2)) : null;

items[0].json.lead = { 
  score, 
  segment, 
  dsr, 
  scoreBreakdown: { 
    completeness, 
    finance, 
    urgency, 
    engagement, 
    rawScore,
    loanSpecificBonus,
    baseCompleteCount
  } 
};

return items;