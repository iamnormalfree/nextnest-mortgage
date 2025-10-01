---
title: n8n-workflow-modifications
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# n8n Workflow Modifications Guide

## Current State & Required Changes

### 1. **WHERE TO ADD "Respond to Webhook" Node**

**Location**: Right after the **"AI JSON Output Parser"** node (node ID: `a309f30f-ab4c-43c3-a32c-845f1c51450e`)

**Steps to Add:**
1. In n8n, find the "AI JSON Output Parser" node
2. Add a new **"Respond to Webhook"** node after it
3. Connect the output of "AI JSON Output Parser" to the new node
4. The "AI Output Valid?" node should come AFTER the response (for async processing)

**Correct Flow:**
```
Form Submission Webhook 
    ↓
Parse & Gate Detector
    ↓
Gate Router (G1/G2/G3)
    ↓
Mortgage Analysis Agent
    ↓
AI JSON Output Parser
    ↓
🔴 ADD HERE: Respond to Webhook (returns data to NextNest immediately)
    ↓
AI Output Valid? (continues async processing)
    ↓
[Background processing: emails, CRM, etc.]
```

**Configure Respond to Webhook node:**
```json
{
  "success": true,
  "gate": "={{ $json.gate }}",
  "ai": "={{ $json.ai }}",
  "lead": "={{ $json.lead }}",
  "source": "n8n_analysis"
}
```

### 2. **Lead Routing: HubSpot vs Airtable**

**Decision Logic Node** (add after Lead Score Calculator):
```javascript
// Determine if Commercial or Residential
const loanAmount = $json.formData.outstandingLoan || $json.formData.priceRange || 0;
const propertyType = $json.formData.propertyType || '';
const isCommercial = (
  loanAmount > 5000000 || 
  propertyType === 'Commercial' ||
  $json.formData.loanType === 'commercial_loan' ||
  $json.formData.purpose?.includes('business')
);

return [{
  json: {
    ...$json,
    leadType: isCommercial ? 'commercial' : 'residential',
    crmDestination: isCommercial ? 'hubspot' : 'airtable'
  }
}];
```

### 2a. **Airtable Node (Residential Leads)**
Keep existing node, but update mapping:
```javascript
{
  "operation": "append",
  "table": "Residential Leads",
  "fields": {
    "Email": "={{ $json.email || $json.formData.email }}",
    "Phone": "={{ $json.phone || $json.formData.phone }}",
    "Name": "={{ $json.formData.name }}",
    "Gate": "={{ $json.gate }}",
    "Lead Score": "={{ $json.lead.score }}",
    "Segment": "={{ $json.lead.segment }}",
    "DSR": "={{ $json.lead.dsr }}",
    "Loan Type": "={{ $json.formData.loanType }}",
    "Property Type": "={{ $json.formData.propertyType }}",
    "Current Rate": "={{ $json.formData.currentRate }}",
    "Outstanding Loan": "={{ $json.formData.outstandingLoan }}",
    "AI Insights": "={{ JSON.stringify($json.ai) }}",
    "Created At": "={{ new Date().toISOString() }}",
    "Source": "Website Form"
  }
}
```

### 2b. **HubSpot Node (Commercial/High-Value Leads)**
Add for commercial leads only:
```javascript
{
  "operation": "create",
  "resource": "contact",
  "properties": {
    "email": "={{ $json.email || $json.formData.email }}",
    "firstname": "={{ $json.formData.name?.split(' ')[0] }}",
    "lastname": "={{ $json.formData.name?.split(' ').slice(1).join(' ') }}",
    "phone": "={{ $json.phone || $json.formData.phone }}",
    "hs_lead_status": "Commercial - {{ $json.gate }}",
    "lead_score": "={{ $json.lead.score }}",
    "loan_amount": "={{ $json.formData.outstandingLoan }}",
    "property_type": "Commercial",
    "deal_stage": "={{ $json.lead.segment }}",
    "ai_insights": "={{ JSON.stringify($json.ai) }}"
  }
}
```

### 3. **WhatsApp Manual Bridge via Telegram**

**Replace WhatsApp Cloud nodes with Telegram "Action Required" Messages**:

```javascript
// Telegram Bot Message for Manual WhatsApp Follow-up
{
  "chatId": "your-telegram-chat-id",
  "text": `📱 *WhatsApp Action Required*
  
*Lead:* ${$json.formData.name}
*Phone:* +65${$json.formData.phone}
*Score:* ${$json.lead.score} (${$json.lead.segment})
*Type:* ${$json.formData.loanType}

*Message to send:*
\`\`\`
Hi ${$json.formData.name?.split(' ')[0]}, 

Thanks for your mortgage inquiry on NextNest. ${
  $json.lead.segment === 'Premium' 
    ? "Your profile qualifies for exclusive rates from 3 banks. Can we discuss your refinancing timeline?"
    : $json.lead.segment === 'Qualified'
    ? "I've analyzed your situation and found potential savings. When would be a good time for a quick call?"
    : "I can help optimize your mortgage. What's your main concern - rates or loan amount?"
}

Best regards,
[Your name]
NextNest Mortgage Specialist
\`\`\`

*AI Insights:*
${$json.ai?.insights?.[0]?.message || 'Review profile for opportunities'}

*Next Steps:*
${$json.ai?.nextSteps?.immediate?.join(', ') || 'Schedule consultation'}

[Copy message above and send via WhatsApp]`,
  "parse_mode": "Markdown"
}
```

### 4. **Google Sheets for Analytics (Both Residential & Commercial)**

Create Google Sheet with these tabs:
- **Tab 1: All Leads** (comprehensive tracking)
- **Tab 2: Commercial** (HubSpot sync)
- **Tab 3: Residential** (Airtable sync)

```javascript
{
  "operation": "append",
  "sheetId": "your-sheet-id",
  "sheetName": "All Leads",
  "data": {
    "Timestamp": "={{ new Date().toISOString() }}",
    "Name": "={{ $json.formData.name }}",
    "Email": "={{ $json.formData.email }}",
    "Phone": "={{ $json.formData.phone }}",
    "Lead Type": "={{ $json.leadType }}",
    "CRM": "={{ $json.crmDestination }}",
    "Loan Type": "={{ $json.formData.loanType }}",
    "Amount": "={{ $json.formData.outstandingLoan || $json.formData.priceRange }}",
    "Lead Score": "={{ $json.lead.score }}",
    "Segment": "={{ $json.lead.segment }}",
    "Gate": "={{ $json.gate }}",
    "DSR": "={{ $json.lead.dsr }}",
    "AI Response": "={{ $json.ai ? 'Yes' : 'No' }}",
    "Follow-up": "={{ $json.lead.segment === 'Premium' ? 'Immediate' : $json.lead.segment === 'Qualified' ? '2hr' : '24hr' }}"
  }
}
```

### 5. **Simplified Workflow Structure**

```
SYNCHRONOUS PATH (Instant response to NextNest):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Webhook → Parse → Gate Router → AI Analysis → RESPOND TO WEBHOOK
                                                        ↓
                                              [Returns to NextNest]

ASYNCHRONOUS PATH (After response):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Output Valid? → Lead Scoring → Lead Type Router:
                                          ↓
                    ┌─────────────────────┴─────────────────────┐
              Commercial                                  Residential
              (>$5M or business)                          (<$5M personal)
                    ↓                                           ↓
              HubSpot CRM                                 Airtable
                    ↓                                           ↓
              [Both paths merge]
                    ↓
              Google Sheets (Analytics)
                    ↓
              Segment-based Actions:
              ├── Premium: Telegram Alert (manual WhatsApp)
              ├── Qualified: Resend Email + Telegram (2hr)
              ├── Developing: Listmonk Nurture
              └── Cold: Add to Newsletter
```

### 6. **Priority-Based Telegram Alerts**

**Premium Lead (Score 80+)** - Immediate Alert:
```javascript
{
  "message": "🔴 URGENT: Premium lead needs WhatsApp within 30min",
  "includeMessage": true,
  "suggestedAction": "Call first, then WhatsApp"
}
```

**Qualified Lead (Score 60-79)** - 2-Hour Window:
```javascript
{
  "message": "🟡 Qualified lead for WhatsApp follow-up",
  "includeMessage": true,
  "suggestedAction": "WhatsApp within 2 hours"
}
```

**Developing Lead (Score 40-59)** - Daily Batch:
```javascript
{
  "message": "🟢 Nurture lead - add to daily WhatsApp broadcast",
  "includeMessage": false,
  "suggestedAction": "Include in tomorrow's broadcast"
}
```

### 7. **Environment Variables Update**

```env
# ✅ Configured
OPENROUTER_API_KEY=your-key
RESEND_API_KEY=your-key

# 📊 Lead Storage (Dual System)
AIRTABLE_BASE_ID=your-residential-base
AIRTABLE_LEADS_TABLE_ID=your-table-id
AIRTABLE_API_KEY=your-airtable-key
HUBSPOT_API_KEY=your-hubspot-private-app-key

# 🤖 Manual WhatsApp Bridge
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# 📈 Analytics
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account
GOOGLE_PRIVATE_KEY=your-private-key

# 📧 Campaign Emails (when ready)
LISTMONK_URL=pending-setup
LISTMONK_API_KEY=pending-setup
```

## Testing Sequence

### Step 1: Test Residential Lead (Airtable)
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Ahmad Rahman",
      "email": "ahmad@test.com",
      "phone": "91234567",
      "loanType": "refinance",
      "propertyType": "HDB",
      "currentRate": 3.5,
      "outstandingLoan": 400000,
      "monthlyIncome": 8000,
      "lockInStatus": "ending_soon",
      "urgency": "immediate"
    }
  }'
```

### Step 2: Test Commercial Lead (HubSpot)
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "David Tan",
      "email": "david@company.com",
      "phone": "98765432",
      "loanType": "commercial_loan",
      "propertyType": "Commercial",
      "currentRate": 4.8,
      "outstandingLoan": 8000000,
      "monthlyIncome": 50000,
      "purpose": "business_expansion",
      "urgency": "immediate"
    }
  }'
```

### Expected Results:
1. **Immediate**: Get AI response back from webhook
2. **Residential**: Check Airtable for new record
3. **Commercial**: Check HubSpot for new contact
4. **Telegram**: Receive WhatsApp action message with pre-written text
5. **Google Sheets**: See both leads logged

## Quick Implementation Checklist

- [ ] Add "Respond to Webhook" node AFTER "AI JSON Output Parser"
- [ ] Add "Lead Type Router" node to split commercial/residential
- [ ] Keep Airtable for residential (<$5M)
- [ ] Add HubSpot for commercial (>$5M)
- [ ] Replace WhatsApp Cloud with Telegram alerts containing WhatsApp messages
- [ ] Set up Google Sheets with 3 tabs
- [ ] Configure different Telegram alert formats by segment
- [ ] Test both residential and commercial flows
- [ ] Verify instant webhook response
- [ ] Check CRM routing works correctly

## Important Notes

### The Critical Fix:
**Must add "Respond to Webhook" right after AI JSON Output Parser** - this returns data to NextNest immediately. The "AI Output Valid?" node and all other processing happens AFTER the response.

### WhatsApp Strategy:
Since WhatsApp Cloud API is stuck and Twilio lacks SG numbers, the Telegram bot becomes your "action queue" - it tells you exactly what to send and to whom, allowing manual but guided WhatsApp outreach from your phone.

### Lead Routing:
- **Residential** (<$5M, personal): Airtable (unlimited records)
- **Commercial** (>$5M, business): HubSpot (precious 1000 limit)
- **Analytics**: Google Sheets (tracks everything)