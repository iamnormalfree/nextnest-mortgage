---
title: 2025-10-09-employment-type-field-fix
type: report
category: session-context
status: archived
owner: ai-broker
date: 2025-09-10
---

 Research Complete: Employment Type Field Analysis & Fix

  📊 Research Findings:

  1. NEW PURCHASE Path:

  - Step 3 Schema: employmentType is REQUIRED
  - UI Behavior: Employment field is ALWAYS visible in Step 3
  - Status: ✅ Working correctly

  2. REFINANCE Path:

  - Step 3 Schema: employmentType is OPTIONAL
  - UI Behavior: Employment field is CONDITIONALLY visible (only shows if job/income changed)
    - If mainApplicantChanges === 'no': Field is hidden
    - If mainApplicantChanges === 'yes': Field is shown
  - Issue Found: When field is hidden, no value is passed, causing validation errors

  3. COMMERCIAL Path:

  - Behavior: Skips Step 3 entirely, routes directly to broker consultation
  - Status: ✅ Working correctly

  🔧 Issues Fixed:

  1. API Validation Schema (/api/chatwoot-conversation/route.ts):
    - Added default value 'employed' for employmentType when undefined
    - Made arrays properly optional with defaults
  2. Data Transformation (ProgressiveForm.tsx):
    - Fixed conversion of actualAges and actualIncomes from object format ({0: 30, 1: undefined}) to array format ([30])
    - Added fallback for employmentType to default to 'employed' when undefined
  3. Validation Logic:
    - Ensured refinancing path works correctly when employment status hasn't changed

  ✅ Test Results:

  The API now successfully creates conversations with proper validation:
  {
    "success": true,
    "conversationId": 8,
    "widgetConfig": {...}
  }

  📝 Summary:

  The employment type field is correctly implemented with different requirements per path:
  - New Purchase: Always required and shown
  - Refinance: Optional and conditionally shown
  - Commercial: Not applicable (skips Step 3)

  The issue was in the data transformation layer where the form's object structure wasn't being properly converted to the API's expected array format. This has been fixed and tested
  successfully.
