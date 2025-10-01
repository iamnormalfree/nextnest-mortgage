---
title: implementation-guide
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# n8n Workflow Update Implementation Guide

## Overview
This guide explains how to update the n8n workflow with intelligent, capability-based validation and AI analysis.

## Step 1: Update Gate 3 Profile Validator & Ratios Node

### Location in Workflow
- Node Name: `Gate 3 Profile Validator & Ratios`
- Node ID: `d53767b6-f323-40b7-8399-b6d45f9e7cb0`
- Position in workflow: After Gate Router, before Mortgage Analysis Agent

### Replace Existing Code
1. Open the node in n8n
2. Delete all existing code in the JavaScript code field
3. Copy entire contents from: `updated-g3-validation.js`
4. Paste into the code field
5. Save the node

### What Changes
- **Before**: Fixed field validation, binary pass/fail
- **After**: Dynamic validation based on loan type, capability assessment, completeness scoring

## Step 2: Update Mortgage Analysis Agent Node

### Location in Workflow
- Node Name: `Mortgage Analysis Agent`
- Node ID: `3237e406-e3d7-4339-a856-b3aac7c446c6`
- Position: After Gate 3 Profile Validator

### Update the Prompt
1. Open the node in n8n
2. Find the "Text" or "Prompt" field
3. Replace entire prompt with contents from: `updated-mortgage-analysis-prompt.txt`
4. Save the node

### What Changes
- **Before**: Static prompt expecting all fields
- **After**: Adaptive prompt that checks capabilities and adjusts response

## Step 3: Update AI JSON Output Parser (Optional Enhancement)

### Current Code Location
- Node Name: `AI JSON Output Parser`
- Node ID: `a309f30f-ab4c-43c3-a32c-845f1c51450e`

### Enhanced Parser Code
```javascript
const raw = items[0].json;
let parsed = null;

try {
  // Some AI nodes return text in raw.output or raw.data
  const text = raw.text || raw.output || raw.data || raw.response || raw.message || JSON.stringify(raw);
  parsed = typeof text === 'string' ? JSON.parse(text) : text;
  
  // Validate expected structure
  if (parsed && typeof parsed === 'object') {
    // Ensure required keys exist
    if (!parsed.insights) parsed.insights = [];
    if (!parsed.bankMatches) parsed.bankMatches = [];
    if (!parsed.nextSteps) parsed.nextSteps = { immediate: [], shortTerm: [], strategic: [] };
    if (!parsed.dataCaveats) parsed.dataCaveats = { limitations: [], improvements: [] };
  }
} catch(e) { 
  console.error('AI parsing error:', e);
  parsed = null; 
}

// If parsing failed, check if we should use fallback
if (!parsed && items[0].json.ai && items[0].json.ai.recommendedAnalysisDepth === 'basic') {
  // Use simpler fallback for basic analysis
  parsed = {
    insights: [{
      type: 'opportunity',
      title: 'Analysis in progress',
      message: 'Our AI is analyzing your profile. Complete more fields for deeper insights.',
      urgency: 'low',
      psychTrigger: 'authority',
      value: 'Personalized recommendations'
    }],
    bankMatches: [],
    nextSteps: {
      immediate: ['Complete your profile'],
      shortTerm: ['Book consultation'],
      strategic: ['Monitor market rates']
    },
    dataCaveats: {
      limitations: ['Limited data provided'],
      improvements: ['Add financial details for accurate analysis']
    }
  };
}

items[0].json.ai = parsed;
return items;
```

## Step 4: Update Lead Score Calculator

### Location
- Node Name: `Lead Score Calculator`
- Node ID: `c234691c-4003-4804-a73b-d2a45bece05c`

### Enhanced Integration
The Lead Score Calculator can now use the richer validation data:

```javascript
const { formData={}, gate, validation={}, metrics={}, leadScore={} } = items[0].json;

// Use the pre-calculated scores from validation
const completeness = leadScore.completeness || 0;
const urgency = metrics.urgencyScore || 0;

// Enhanced scoring using validation insights
const financeScore = metrics.potentialSavings > 1000 ? 40 : 
                     metrics.dsr > 0.55 ? 15 : 
                     metrics.dsr > 0 ? 30 : 20;

const engagement = gate === 'G3' ? 10 : gate === 'G2' ? 7 : 3;

// High-value signals from validation
const highValueBonus = leadScore.hasHighValueSignals ? 10 : 0;

const rawScore = completeness + financeScore + urgency + engagement + highValueBonus;
let score = Math.max(0, Math.min(100, rawScore));

let segment = 'Cold';
if (score >= 80) segment = 'Premium';
else if (score >= 60) segment = 'Qualified';
else if (score >= 40) segment = 'Developing';

console.log(`ENHANCED SCORING:`);
console.log(`- Completeness: ${completeness}`);
console.log(`- Finance: ${financeScore}`);
console.log(`- Urgency: ${urgency}`);
console.log(`- Engagement: ${engagement}`);
console.log(`- High Value Bonus: ${highValueBonus}`);
console.log(`- Total Score: ${score} (${segment})`);

items[0].json.lead = { 
  score, 
  segment, 
  dsr: metrics.dsr,
  potentialSavings: metrics.potentialSavings,
  analysisCapability: validation.analysisLevel,
  scoreBreakdown: { 
    completeness, 
    finance: financeScore, 
    urgency, 
    engagement, 
    highValueBonus,
    rawScore 
  } 
};

return items;
```

## Testing Scenarios

### Test Case 1: Refinance with Good Data
```json
{
  "formData": {
    "name": "John Tan",
    "email": "john@example.com",
    "phone": "+6591234567",
    "loanType": "refinance",
    "currentRate": 4.2,
    "outstandingLoan": 800000,
    "monthlyIncome": 15000,
    "lockInStatus": "ending_soon"
  },
  "gate": "G3"
}
```
**Expected**: High completeness (80%+), significant savings detected, comprehensive analysis

### Test Case 2: New Purchase with Minimal Data
```json
{
  "formData": {
    "name": "Sarah Lim",
    "email": "sarah@example.com",
    "phone": "+6598765432",
    "loanType": "new_purchase",
    "propertyType": "HDB",
    "monthlyIncome": 8000
  },
  "gate": "G2"
}
```
**Expected**: Medium completeness (50-60%), basic analysis, prompts for price range

### Test Case 3: Equity Loan with Partial Data
```json
{
  "formData": {
    "name": "David Wong",
    "email": "david@example.com",
    "loanType": "equity_loan",
    "propertyValue": 1200000
  },
  "gate": "G1"
}
```
**Expected**: Low completeness (30-40%), limited analysis, educational focus

## Monitoring & Debugging

### Check Validation Output
In n8n, after Gate 3 node runs, examine the output:
- `validation.completenessScore` - Should be 0-100
- `ai.capabilities` - Should show true/false for each capability
- `metrics` - Should contain calculated values where possible

### Check AI Response
After Mortgage Analysis Agent:
- Verify JSON structure is valid
- Check that insights match capabilities
- Ensure no hardcoded bank names appear

### Common Issues & Fixes

**Issue**: AI returns markdown instead of JSON
**Fix**: Emphasize "valid JSON only, no markdown" in prompt

**Issue**: Missing fields cause workflow to fail
**Fix**: Validation now handles missing fields gracefully

**Issue**: AI generates insights for missing data
**Fix**: Capability checks prevent this

## Rollback Plan

If issues occur, you can revert by:
1. Restoring original Gate 3 validation code
2. Restoring original Mortgage Analysis Agent prompt
3. The workflow will function with reduced intelligence but won't break

## Success Metrics

After implementation, monitor:
- **Completion Rate**: Should increase as partial data is now accepted
- **AI Response Quality**: More relevant insights based on available data
- **Lead Scoring Accuracy**: Better differentiation between segments
- **Error Rate**: Should decrease significantly