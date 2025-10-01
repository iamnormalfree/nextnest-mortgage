---
title: g3-test-expected-results
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# G3 Test Scenarios - Expected Results

## Test Execution
Run the PowerShell script: `.\g3-test-scenarios.ps1`

## Expected Results by Test

### REFINANCING TESTS

#### Test 1: Michael Chen - Complete Premium Profile
- **Completeness**: ~95%
- **Segment**: Premium
- **AI Capabilities**: All enabled
- **Key Insights**: High savings opportunity ($1000+/month), optimal timing (lock-in ending)
- **Urgency Score**: 90+ (high rate + ending lock-in)

#### Test 2: Jennifer Tan - High Savings Opportunity
- **Completeness**: ~75%
- **Segment**: Qualified/Premium
- **AI Capabilities**: Can calculate savings, generate insights
- **Key Insights**: Significant overpayment alert (5.2% vs 2.8% market)
- **Potential Savings**: $2000+/month
- **Urgency Score**: 85+ (very high rate)

#### Test 3: David Lim - Minimal Required
- **Completeness**: ~55%
- **Segment**: Qualified
- **AI Capabilities**: Basic insights, savings calculation
- **Missing**: Property type, lock-in status for better analysis
- **Urgency Score**: 50 (moderate rate, no timeline info)

#### Test 4: Rachel Wong - Missing Income ⚠️
- **Validation**: FAIL (missing required monthlyIncome)
- **Missing Required**: ['monthlyIncome']
- **AI Response**: Fallback template or error handling

#### Test 5: Kevin Ng - High DSR Risk
- **Completeness**: ~80%
- **Segment**: Qualified (despite high DSR)
- **DSR**: 0.81 (81% - very high risk)
- **AI Insights**: DSR warning, eligibility concerns
- **Special Flag**: high_dsr_warning

### NEW PURCHASE TESTS

#### Test 6: Amanda Lee - First-Time Buyer Premium
- **Completeness**: ~95%
- **Segment**: Premium
- **Max Loan**: ~$1.35M (based on income/DSR)
- **AI Capabilities**: Full analysis enabled
- **Special Insights**: First-time buyer advantages, IPA leverage

#### Test 7: William Tan - Luxury Segment
- **Completeness**: ~70%
- **Segment**: Premium (high-value signal)
- **High Value Flag**: TRUE (property >$1.5M)
- **AI Focus**: Premium market insights, negotiation power

#### Test 8: Susan Koh - Basic Requirements
- **Completeness**: ~55%
- **Segment**: Developing/Qualified
- **Max Loan**: ~$900K
- **Missing**: Timeline, IPA status for better guidance

#### Test 9: Peter Goh - Missing Property Type ⚠️
- **Validation**: FAIL (missing required propertyType)
- **Missing Required**: ['propertyType']
- **AI Response**: Cannot provide bank matches without property type

#### Test 10: Grace Ong - Urgent Timeline
- **Completeness**: ~85%
- **Segment**: Premium
- **Urgency Score**: 95+ (immediate timeline + IPA)
- **AI Focus**: Speed to close, competitive advantage

### EQUITY LOAN TESTS

#### Test 11: Thomas Lau - Business Expansion Premium
- **Completeness**: ~95%
- **Segment**: Premium
- **LTV**: 28% (very conservative)
- **AI Insights**: Strong equity position, multiple options
- **Urgency Score**: 40 (no time pressure)

#### Test 12: Catherine Sim - Investment Purpose
- **Completeness**: ~75%
- **Segment**: Qualified
- **Available Equity**: ~$350K
- **AI Focus**: Investment leverage strategies

#### Test 13: Robert Chan - Basic Requirements
- **Completeness**: ~55%
- **Segment**: Developing/Qualified
- **Available Equity**: ~$400K
- **Missing**: Purpose, tenure for targeted advice

#### Test 14: Michelle Yeo - High Leverage
- **Completeness**: ~85%
- **Segment**: Premium (high-value property)
- **Current LTV**: 50%
- **Target LTV**: 86% (aggressive)
- **AI Insights**: Risk assessment, alternative structures

#### Test 15: Daniel Tay - Missing Income ⚠️
- **Validation**: FAIL (missing required monthlyIncome)
- **Missing Required**: ['monthlyIncome']
- **AI Response**: Cannot assess eligibility without income

## Summary Statistics

### By Loan Type Success Rate
- **Refinancing**: 4/5 pass (80%)
- **New Purchase**: 4/5 pass (80%)
- **Equity Loan**: 4/5 pass (80%)

### By Segment Distribution
- **Premium** (80%+): Tests 1, 6, 11, 14
- **Qualified** (60-79%): Tests 2, 3, 5, 7, 10, 12
- **Developing** (40-59%): Tests 8, 13
- **Failed Validation**: Tests 4, 9, 15

### AI Capability Coverage
- **Full Analysis** (all capabilities): 4 tests
- **Comprehensive** (most capabilities): 5 tests
- **Intermediate** (some capabilities): 3 tests
- **Basic/Fallback**: 3 tests

## Monitoring Points

1. **Validation Success**: 12/15 should pass validation
2. **Completeness Scores**: Should range from 55% to 95%
3. **Urgency Scores**: Should be highest for tests 1, 2, 5, 10
4. **High Value Flags**: Should trigger for tests 7, 11, 14
5. **DSR Warnings**: Should appear for test 5
6. **Savings Calculations**: Should work for all refinance tests with rate+loan
7. **Max Loan Calculations**: Should work for all new purchase tests with income

## Debugging Checklist

If a test fails unexpectedly:
1. Check if all universal fields are present (name, email, phone, loanType)
2. Verify loan-type specific requirements are met
3. Confirm the webhook URL is correct
4. Check n8n workflow execution logs
5. Verify the validation node output structure
6. Ensure AI agent receives proper context variables