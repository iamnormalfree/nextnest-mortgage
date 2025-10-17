# Phase 1: Dr. Elena Integration Guide

**Version:** 1.0  
**Last Updated:** 2025-10-10  
**Status:** Planning - Integration Specification  

---

## Executive Summary

This document defines how to integrate Dr. Elena Tan Wei Ming, the Singapore Mortgage Expert persona, into the AI Chat Intelligence System.

**Core Competencies:**
- Regulatory compliance (MAS Notice 632, 645)
- Client-protective rounding rules  
- Mortgage calculation formulas (TDSR, MSR, LTV, IWAA)
- Multi-property scenarios
- Income recognition rules

---

## 1. Dr. Elena Core Competencies

### 1.1 Regulatory Framework

**MAS Notice 632 - LTV Limits:**
- First property: 75% LTV, minimum 5% cash
- Second property: 45% LTV, minimum 25% cash
- Third+ property: 35% LTV, minimum 25% cash
- Corporate buyers: 15% LTV

**MAS Notice 645 - TDSR Framework:**
- Maximum TDSR: 55% of recognized income
- Stress test rates: 4% residential, 5% commercial
- All debt obligations included

**MSR Limits (HDB/EC only):**
- Maximum MSR: 30% of recognized income
- Applies in addition to TDSR
- Use whichever is more restrictive

### 1.2 Computational Precision Rules

**Rounding Rules (from dr-elena-mortgage-expert.json):**

1. **Loan Eligibility (ROUND DOWN to nearest thousand)**
   - Formula: Math.floor(value / 1000) * 1000
   - Applies to: max_loan_amount, tdsr_limit, msr_limit
   - Reason: Protect clients from over-borrowing

2. **Funds Required (ROUND UP to nearest thousand)**
   - Formula: Math.ceil(value / 1000) * 1000
   - Applies to: downpayment, stamp_duty, cpf_refund
   - Reason: Ensure sufficient funds

3. **Monthly Payments (ROUND UP to nearest dollar)**
   - Formula: Math.ceil(value)
   - Applies to: monthly_installment, tdsr_commitment
   - Reason: Conservative estimation

4. **Percentages (2 decimal places)**
   - Formula: Math.round(value * 100) / 100
   - Applies to: interest_rates, absd_rates

---

## 2. Core Calculation Formulas

### 2.1 Monthly Payment

**Formula:** P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
- P = Principal loan amount
- r = Monthly interest rate (annual_rate / 12)
- n = Total number of payments (years × 12)

**Client Display:** Math.ceil(exact_calculation)

### 2.2 TDSR Available

**Formula:** (Recognized_Income × 0.55) - Total_Commitments

**Client Display:** Math.floor(exact_calculation)

### 2.3 MSR Limit

**Formula:** Recognized_Income × 0.30

**Applies to:** HDB and EC properties only

**Client Display:** Math.floor(exact_calculation)

### 2.4 IWAA (Income-Weighted Average Age)

**Formula:** Σ(age_i × income_i) / Σ(income_i)

**Rounding:** Round UP to nearest integer

**Purpose:** Used for determining maximum loan tenure

### 2.5 Maximum Loan Tenure

**Formulas:**
- HDB/EC (75% LTV): MIN(25, 65 - IWAA)
- HDB/EC (55% LTV): MIN(30, 75 - IWAA)
- Private (75% LTV): MIN(30, 65 - IWAA)
- Private (55% LTV): MIN(35, 75 - IWAA)

---

## 3. Income Recognition Rules

### 3.1 Fixed Income (100% recognition)
- Base salary, guaranteed bonuses
- Documentation: 3 months payslips + employment letter

### 3.2 Variable Income (70% recognition)
- Commissions, non-guaranteed bonuses, overtime
- Documentation: 2 years tax assessment or 12 months payslips

### 3.3 Rental Income (70% recognition)
- Gross rental income
- Requirements: Minimum 6 months tenancy agreement

### 3.4 Self-Employed Income (70% recognition)
- Declared income
- Documentation: 2 years tax assessment

### 3.5 Asset-Based Income
- Pledged assets: 30% of pledged amount / 48 months
- Unpledged assets: Conditional assessment based on liquidity

---

## 4. System Prompt Templates

### 4.1 Greeting Phase

Current Phase: Greeting
Goals: Welcome warmly, acknowledge loan type, ask ONE qualifying question
Response length: Under 100 words

### 4.2 Discovery Phase

Current Phase: Discovery
Goals: Ask for ONE missing piece of information, explain why needed
Response length: Under 150 words

### 4.3 Calculation Phase

Current Phase: Calculation
Goals: Explain calculation in plain English, highlight key numbers, mention MAS compliance
Response length: Under 200 words
CRITICAL: Do not repeat previously stated facts

### 4.4 Closing Phase

Current Phase: Closing
Goals: Summarize key findings, recommend ONE next step, offer human broker connection
Response length: Under 150 words

---

## 5. Validation Requirements

### 5.1 Input Validation

**Property Price:** Min 0, Max 99,999,999
**Monthly Income:** Min 0, Max 9,999,999
**Interest Rate:** Min 0%, Max 20%
**Loan Tenure:** Min 1 year, Max 35 years
**Age:** Min 21, Max 100

### 5.2 Cross-Field Validation

**Tenure + Age:** Tenure + Age <= 65 (HDB/EC) or <= 75 (Private)
**LTV + Property Count:** LTV decreases with property count
**MSR + Property Type:** MSR only applies to HDB/EC

---

## 6. Discrepancies Found in Current Implementation

### 6.1 lib/calculations/mortgage.ts

**Issue 1:** Income recognition not implemented
- Current: Assumes 100% recognition for all income
- Fix: Add incomeRecognitionRate parameter

**Issue 2:** Stress test rate not always used
- Current: Sometimes uses actual rate instead of stress test rate
- Fix: Always use MAX(actual_rate, stress_test_rate) for TDSR

**Issue 3:** MSR calculation incomplete
- Current: MSR calculation exists but not properly integrated
- Fix: Check MSR in addition to TDSR for HDB/EC properties

### 6.2 lib/ai/broker-ai-service.ts

**Issue 1:** No calculation validation
- Current: AI generates responses without verifying calculations
- Fix: Add CalculationToExplanation contract validation

**Issue 2:** No rounding awareness
- Current: AI doesn't explain why numbers are rounded
- Fix: Include rounding rationale in explanations

---

## 7. Integration Checklist

- [ ] Implement all Dr. Elena core formulas in lib/calculations/mortgage.ts
- [ ] Add income recognition rate parameters
- [ ] Implement CalculationToExplanation contract
- [ ] Create lib/calculations/dr-elena-explainer.ts
- [ ] Add validation for all inputs
- [ ] Implement cross-field validation
- [ ] Create system prompt templates for each phase
- [ ] Add rounding awareness to AI explanations
- [ ] Test with all property types (HDB, EC, Private, Commercial)
- [ ] Test with multiple applicants (IWAA)
- [ ] Test with variable income scenarios
- [ ] Verify MAS compliance for all calculations

---

**Document Status:** Complete  
**Last Updated:** 2025-10-10
