---
title: readme
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# Phase 2: n8n Workflow Setup

This directory contains the implementation of an intelligent lead scoring and analysis system using n8n workflow automation.

## Project Overview

**Goal**: Create an AI-powered mortgage lead analysis system that processes form submissions in real-time and provides intelligent insights.

**Key Features**:
- Multi-gate validation system (G1/G2/G3)
- AI-powered lead analysis via OpenRouter API
- Dynamic lead scoring and segmentation
- Real-time webhook integration with NextNest
- Email automation and nurture sequences

## Directory Structure

### 📚 01_Documentation/
Core implementation guides and requirements:
- `implementation-guide.md` - Step-by-step setup instructions
- `INTEGRATION_REQUIREMENTS.md` - Technical requirements and testing
- `N8N_WEBHOOK_TESTING_GUIDE.md` - Webhook testing procedures
- `N8N_WORKFLOW_MODIFICATIONS.md` - Required workflow changes

### ⚙️ 02_Workflow_Config/
n8n workflow configuration files:
- `PHASE_2_N8N_ACTUAL_WORKFLOW.md` - Final workflow specification
- `PHASE_2_N8N_WORKFLOW_IDEATED.md` - Initial workflow concepts
- `PHASE_2_N8N_WORKFLOW_PROMPT_FINAL.md` - Final AI prompts
- `Workflow for b52f969e-9d57-4706-aeb3-4f3ac907e853.json` - n8n workflow export
- `updated-mortgage-analysis-prompt.txt` - AI analysis prompt

### 🎯 03_Lead_Scoring/
Lead scoring calculation scripts:
- `FINAL_CORRECTED_LEAD_CALCULATOR.js` - Production lead scoring logic
- `CORRECTED_LEAD_SCORE_CALCULATOR.js` - Refined scoring algorithm
- `FIXED_LEAD_SCORE_CALCULATOR.js` - Bug-fixed version

### 🧪 04_Testing/
Test scenarios and validation:
- `test-payloads.json` - Sample data for testing different gates
- `G1_G2_COMPREHENSIVE_TEST.js` - Gate routing tests
- `g1-g2-test-scenarios.ps1` - PowerShell test scripts
- `G2_SCORING_TEST.js` - G2 gate scoring tests
- `g3-test-scenarios.ps1` - G3 gate test scenarios
- `g3-test-expected-results.md` - Expected test outcomes

### 🔗 05_Integration/
Third-party integrations:
- `EXCEL_365_N8N_SETUP.md` - Excel/Office 365 integration guide

### ✅ 06_Validation_Scripts/
Form validation and scoring scripts:
- `updated-g3-validation.js` - Enhanced G3 gate validation
- `FINAL_SCORING_VALIDATION.js` - Final scoring validation logic
- `CORRECTED_SCORING_TEST.js` - Corrected scoring tests
- `ORIGINAL_SCORING_TEST.js` - Original scoring reference

## Implementation Status

This represents Phase 2 of the NextNest intelligent lead form system. The workflow integrates with:

- **NextNest Frontend**: Real-time form analysis
- **OpenRouter API**: AI-powered insights generation
- **Email Systems**: Resend API for follow-ups
- **CRM Storage**: Airtable for lead management
- **Communications**: Slack alerts, Twilio/WhatsApp integration

## Key Technical Concepts

**Gate System**:
- **G1**: Minimal data (name + basic info)
- **G2**: Email + phone + 3+ fields
- **G3**: Complete profile (8+ fields)

**Lead Scoring**:
- Completeness (30 points max)
- Financial viability (40 points max)  
- Urgency indicators (20 points max)
- Engagement level (10 points max)

**AI Analysis**:
- Capability-based insights generation
- Psychological trigger identification
- Bank matching logic (anonymized)
- Next-step recommendations

## Next Steps

1. Deploy updated n8n workflow with validation improvements
2. Configure OpenRouter API for AI analysis
3. Test webhook integration with NextNest
4. Monitor lead scoring accuracy and adjust algorithms
5. Implement email nurture sequences

---

*Organized on: 2025-08-31*
*Project: NextNest Intelligent Lead Form System*