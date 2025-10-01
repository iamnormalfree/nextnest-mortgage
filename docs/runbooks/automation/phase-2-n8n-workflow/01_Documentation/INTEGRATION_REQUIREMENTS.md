---
title: integration-requirements
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# n8n Workflow Integration Requirements

## Current Issues & Solutions

### 1. **Webhook Direction Mismatch**
**Problem**: The workflow expects to receive webhooks at `/api/forms/analyze` but should be sending TO NextNest
**Solution**: 
- The n8n webhook should RECEIVE from NextNest at: `https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze`
- NextNest calls n8n, not the other way around

### 2. **Missing Real-Time Response**
**Problem**: Workflow uses email delivery instead of webhook response
**Solution**: Add a "Respond to Webhook" node after AI analysis to return data immediately

### 3. **Required Environment Variables**

Add these to your n8n instance:

```env
# AI Provider
OPENROUTER_API_KEY=your-openrouter-key-here

# Email Systems
RESEND_API_KEY=your-resend-api-key
LISTMONK_URL=https://your-listmonk-instance.com
LISTMONK_API_KEY=your-listmonk-key

# Storage
AIRTABLE_BASE_ID=your-base-id
AIRTABLE_LEADS_TABLE_ID=your-table-id
AIRTABLE_API_KEY=your-airtable-key

# Communications
SLACK_ALERT_CHANNEL_ID=C1234567890
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM=+65xxxxxxxx
WHATSAPP_PHONE_ID=your-whatsapp-id

# PDF Generation
PDF_RENDER_URL=https://your-pdf-service.com/render
```

### 4. **Test Payload Format**

From NextNest to n8n webhook:

```json
{
  "formData": {
    "name": "John Tan",
    "email": "john@example.com",
    "phone": "91234567",
    "loanType": "refinance",
    "propertyType": "Private",
    "currentRate": 4.2,
    "outstandingLoan": 800000,
    "monthlyIncome": 12000,
    "lockInStatus": "ending_soon",
    "urgency": "immediate"
  },
  "fieldName": "currentRate",
  "value": 4.2,
  "formContext": {
    "gate": 2,
    "completedFields": ["name", "email", "phone", "loanType"],
    "sessionId": "session-123"
  }
}
```

### 5. **Expected Response Format**

n8n should return (via Respond to Webhook node):

```json
{
  "success": true,
  "gate": "G2",
  "ai": {
    "insights": [
      {
        "type": "opportunity",
        "title": "High refinancing potential",
        "message": "Your 4.2% rate is significantly above market average",
        "urgency": "high",
        "psychTrigger": "loss_aversion",
        "value": "Potential monthly savings identified"
      }
    ],
    "bankMatches": [
      {
        "description": "Major local bank with competitive rates",
        "strength": "Fast approval for your profile",
        "likelihood": "High"
      }
    ],
    "nextSteps": {
      "immediate": ["Complete profile for exact calculations"],
      "shortTerm": ["Gather loan statements"],
      "strategic": ["Lock in rates before increase"]
    }
  },
  "lead": {
    "score": 75,
    "segment": "Qualified",
    "dsr": 0.20
  },
  "calculation": {
    "monthlyPayment": 3200,
    "savingsEstimate": 380,
    "breakEvenMonths": 6
  },
  "teaser": "3 banks competing for your profile. Complete to see which..."
}
```

## Testing Checklist

### Phase 1: Basic Connection
- [ ] Verify n8n webhook is accessible from NextNest
- [ ] Test with minimal payload (just email)
- [ ] Confirm webhook receives and logs data

### Phase 2: Gate Detection
- [ ] Test G1 detection (minimal fields)
- [ ] Test G2 detection (email + phone + some fields)
- [ ] Test G3 detection (all required fields)
- [ ] Verify gate routing works correctly

### Phase 3: AI Analysis
- [ ] Configure OpenRouter API key
- [ ] Test AI node with sample data
- [ ] Verify JSON parsing after AI response
- [ ] Check fallback to psychological triggers

### Phase 4: Lead Scoring
- [ ] Test score calculation logic
- [ ] Verify segment assignment (Premium/Qualified/etc)
- [ ] Test DSR calculation accuracy
- [ ] Check score-based routing

### Phase 5: Response Flow
- [ ] Add "Respond to Webhook" node after AI analysis
- [ ] Test synchronous response to NextNest
- [ ] Verify response format matches expected structure
- [ ] Test error handling and timeouts

### Phase 6: Email Follow-up (Async)
- [ ] Configure Resend API
- [ ] Test email templates
- [ ] Verify async email delivery
- [ ] Test wait nodes and escalation

## Quick Test Commands

### 1. Test n8n Webhook Directly:
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "email": "test@example.com",
      "loanType": "refinance"
    }
  }'
```

### 2. Test from NextNest API:
```bash
curl -X POST http://localhost:3000/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "91234567",
      "loanType": "refinance",
      "currentRate": 4.5
    }
  }'
```

## Workflow Modifications Needed

### Add Response Node:
After the "AI JSON Output Parser" node, add:
1. A new "Set" node to format the response
2. A "Respond to Webhook" node to return data synchronously

### Fix Webhook URL:
The webhook should be listening at the Railway URL, not trying to call NextNest's `/api/forms/analyze`

### Split Sync/Async:
- Immediate response: AI insights for real-time form display
- Async processing: Emails, PDF generation, Slack alerts

## Next Steps

1. **Immediate**: Add missing "Respond to Webhook" node in n8n
2. **Required**: Configure OpenRouter API key for AI to work
3. **Testing**: Start with G1 gate (minimal data) before testing complex flows
4. **Monitoring**: Set up n8n execution logs to debug issues