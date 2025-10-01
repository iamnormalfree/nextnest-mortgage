// FINAL CORRECTED Lead Score Calculator - Preserves Original G1 Logic
const { formData={}, gate, ai } = items[0].json;
const completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;
const g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];

// Calculate completeness score - ORIGINAL LOGIC (all gates use G3 standards)
const completeCount = g3Fields.reduce((a,k)=> a + (formData[k]?1:0),0);
let completeness = Math.round((completeCount/g3Fields.length)*completenessMax);

// ONLY add G2 bonuses to differentiate from G1 (this is the key fix)
if (gate === 'G2') {
  let g2Bonus = 0;
  
  // Basic G2 field bonuses (name, phone that G1 doesn't have)
  if (formData.name) g2Bonus += 2;
  if (formData.phone) g2Bonus += 2;
  
  // Loan-specific G2 bonuses
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
  console.log(`COMPLETENESS: ${completeCount}/${g3Fields.length} base + ${g2Bonus} G2 bonus = ${completeness}/${completenessMax}`);
} else {
  console.log(`COMPLETENESS: ${completeCount}/${g3Fields.length} fields = ${completeness}/${completenessMax}`);
}

console.log('Fields present:', g3Fields.filter(k => formData[k]));
console.log('Fields missing:', g3Fields.filter(k => !formData[k]));

// Calculate finance score - ORIGINAL LOGIC for G1, enhanced for G2
const income = Number(formData.monthlyIncome)||0;
const outstanding = Number(formData.outstandingLoan)||0;
const dsr = income? (outstanding*0.003/income) : 0;
let finance = financeMax;
console.log(`FINANCE START: ${finance}/${financeMax}`);

// Original income penalty logic
if (!income) { 
  finance -= 20; 
  console.log('No income: -20, now', finance); 
}
if (dsr>0.55) { 
  finance -= 15; 
  console.log('DSR >55%: -15, now', finance); 
}
if (dsr>0.65) { 
  finance -= 25; 
  console.log('DSR >65%: -25, now', finance); 
}

// Gate-specific penalties/bonuses
if (gate==='G1') { 
  finance -= 25; 
  console.log('Gate G1: -25, now', finance); 
} else if (gate === 'G2') {
  // G2 gets relief from income penalty since income not captured yet
  finance += 15; // Offset the -20 income penalty
  console.log('Gate G2 income relief: +15, now', finance);
  
  // G2 Refinance gets additional financial assessment
  if (formData.loanType === 'refinance' && formData.propertyValue && formData.outstandingLoan) {
    const propertyValue = Number(formData.propertyValue) || 0;
    const outstandingLoan = Number(formData.outstandingLoan) || 0;
    const ltv = propertyValue > 0 ? (outstandingLoan / propertyValue) : 1;
    
    console.log(`Refinance LTV assessment: ${outstandingLoan}/${propertyValue} = ${(ltv*100).toFixed(1)}%`);
    if (ltv < 0.6) { 
      finance += 10; 
      console.log('Strong LTV position: +10, now', finance); 
    } else if (ltv > 0.8) { 
      finance -= 5; 
      console.log('High leverage: -5, now', finance); 
    }
  }
}

// Ensure finance doesn't go negative
finance = Math.max(0, finance);
console.log(`FINANCE FINAL: ${finance}/${financeMax} (income: ${income}, outstanding: ${outstanding}, DSR: ${(dsr*100).toFixed(1)}%)`);

// Calculate urgency score - ENHANCED for G2
let urgency = 5;
const u = (formData.urgency||'').toString().toLowerCase();
console.log(`URGENCY START: ${urgency}, input: "${formData.urgency}"`);

// Original urgency logic
if (u.includes('immediate')) { 
  urgency = urgencyMax; 
  console.log('Immediate: set to', urgency); 
} else if (u.includes('2')||u.includes('week')) { 
  urgency = 12; 
  console.log('2/week detected: set to', urgency); 
} else { 
  urgency = 8; 
  console.log('Default case: set to', urgency); 
}

// G2 enhanced urgency mapping from loan-specific fields
if (gate === 'G2') {
  const urgencyMapping = {
    'this_month': urgencyMax,
    'immediate': urgencyMax,
    'next_month': 15,
    'next_3_months': 12,
    'ending_soon': 15,  // Lock-in ending
    'within_6_months': 8,
    '6_months_plus': 5
  };
  
  // Check loan-specific urgency indicators
  const urgencyIndicators = [
    formData.urgency,
    formData.purchaseTimeline, 
    formData.lockInStatus
  ].filter(Boolean);
  
  if (urgencyIndicators.length > 0) {
    const urgencyField = urgencyIndicators[0].toLowerCase();
    const mappedUrgency = urgencyMapping[urgencyField];
    if (mappedUrgency) {
      urgency = mappedUrgency;
      console.log(`G2 urgency mapping: "${urgencyField}" -> ${urgency}`);
    }
  }
}

console.log(`URGENCY FINAL: ${urgency}/${urgencyMax}`);

// Calculate engagement score - ORIGINAL LOGIC
const engagement = gate==='G3'? engageMax : gate==='G2'? 7 : 3;
console.log(`ENGAGEMENT: Gate ${gate} = ${engagement}/${engageMax}`);

// Final score calculation
const rawScore = completeness + finance + urgency + engagement;
let score = Math.max(0, Math.min(100, rawScore));
console.log(`SCORE BREAKDOWN: ${completeness} + ${finance} + ${urgency} + ${engagement} = ${rawScore} (capped to ${score})`);

let segment = 'Cold';
if (score>=80) segment='Premium'; else if (score>=60) segment='Qualified'; else if (score>=40) segment='Developing';
console.log(`SEGMENT: Score ${score} -> ${segment}`);

items[0].json.lead = { 
  score, 
  segment, 
  dsr: Number(dsr.toFixed(2)), 
  scoreBreakdown: { 
    completeness, 
    finance, 
    urgency, 
    engagement, 
    rawScore 
  } 
};
return items;