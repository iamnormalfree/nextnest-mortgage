---
title: excel-365-n8n-setup
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# Excel 365 + n8n Integration (Unified Storage Solution)

## Setup Guide - All Storage in Excel 365

### 1. **Excel Setup in OneDrive/SharePoint**

Create `NextNest_CRM.xlsx` with these sheets:

#### Sheet 1: All_Leads (Replaces Airtable + HubSpot + Google Sheets)
| Column | Type | Purpose |
|--------|------|---------|
| ID | AutoNumber | Unique identifier |
| Timestamp | DateTime | When submitted |
| Name | Text | Lead name |
| Email | Email | Contact email |
| Phone | Text | WhatsApp number |
| Lead_Type | Choice | Residential/Commercial |
| LoanType | Choice | refinance/new_purchase/commercial_loan/etc |
| PropertyType | Text | HDB/Private/Commercial |
| Amount | Number | Loan amount |
| Current_Rate | Number | Current mortgage rate |
| Monthly_Income | Number | For DSR calculation |
| Score | Number | AI lead score (0-100) |
| Segment | Text | Premium/Qualified/Developing/Cold |
| DSR | Number | Debt Service Ratio |
| Gate | Text | G1/G2/G3 |
| AI_Insights | Long Text | Full AI analysis JSON |
| Bank_Matches | Text | Recommended banks |
| Next_Steps | Text | AI recommended actions |
| WhatsApp_Sent | Yes/No | Manual tracking |
| Email_Status | Text | Sent/Pending/Failed |
| Follow_Up_Date | Date | Next action |
| Notes | Long Text | Manual notes |
| Source | Text | Website/Campaign/Direct |
| Campaign_ID | Text | If from campaign |

#### Sheet 2: Commercial_Leads (Filtered View - Replaces HubSpot)
Auto-filter: Lead_Type = "Commercial" OR Amount > 5000000

#### Sheet 3: Residential_Leads (Filtered View - Replaces Airtable)
Auto-filter: Lead_Type = "Residential" AND Amount <= 5000000

#### Sheet 4: High_Priority (Filtered View)
Auto-filter: Score >= 70 OR Segment = "Premium"

#### Sheet 5: Pending_WhatsApp
Auto-filter: WhatsApp_Sent = No AND Score >= 60

#### Sheet 6: Analytics_Dashboard (Replaces Google Sheets)
Pivot tables and charts for:
- Lead conversion by segment
- Average lead score by source
- DSR distribution
- Gate completion rates
- Response times

### 2. **n8n Workflow (5 Nodes)**

```
[1] Webhook Receive
        ↓
[2] OpenRouter AI Analysis
        ↓
[3] Respond to Webhook ← Returns to NextNest immediately
        ↓
[4] Microsoft Excel (Append Row)
        ↓
[5] Telegram Notification
```

### 3. **Node Configurations**

#### Node 1: Webhook
Default configuration

#### Node 2: OpenRouter AI
```javascript
{
  "model": "openai/gpt-4-mini",
  "messages": [{
    "role": "system",
    "content": "You are a Singapore mortgage expert. Analyze the lead and return JSON with score (0-100), segment (Premium/Qualified/Developing/Cold), and one actionable insight."
  }, {
    "role": "user", 
    "content": "Lead data: {{JSON.stringify($json.formData)}}"
  }],
  "max_tokens": 300
}
```

#### Node 3: Respond to Webhook
```javascript
{
  "responseMode": "lastNode",
  "responseData": {
    "success": true,
    "score": "={{ $json.score }}",
    "segment": "={{ $json.segment }}",
    "insight": "={{ $json.insight }}",
    "source": "ai_analysis"
  }
}
```

#### Node 4: Microsoft Excel 365 (Unified Storage)
```javascript
{
  "authentication": "OAuth2",
  "resource": "table",
  "operation": "append",
  "workbook": "NextNest_CRM.xlsx",
  "worksheet": "All_Leads",
  "data": {
    "Timestamp": "={{ $now.toISO() }}",
    "Name": "={{ $('Webhook').item.json.formData.name }}",
    "Email": "={{ $('Webhook').item.json.formData.email }}",
    "Phone": "={{ $('Webhook').item.json.formData.phone }}",
    "Lead_Type": "={{ $json.formData.outstandingLoan > 5000000 || $json.formData.loanType === 'commercial_loan' ? 'Commercial' : 'Residential' }}",
    "LoanType": "={{ $('Webhook').item.json.formData.loanType }}",
    "PropertyType": "={{ $('Webhook').item.json.formData.propertyType || 'Not specified' }}",
    "Amount": "={{ $('Webhook').item.json.formData.outstandingLoan }}",
    "Current_Rate": "={{ $('Webhook').item.json.formData.currentRate || 0 }}",
    "Monthly_Income": "={{ $('Webhook').item.json.formData.monthlyIncome || 0 }}",
    "Score": "={{ $json.lead?.score || $json.score }}",
    "Segment": "={{ $json.lead?.segment || $json.segment }}",
    "DSR": "={{ $json.lead?.dsr || 0 }}",
    "Gate": "={{ $json.gate }}",
    "AI_Insights": "={{ JSON.stringify($json.ai) }}",
    "Bank_Matches": "={{ JSON.stringify($json.ai?.bankMatches || []) }}",
    "Next_Steps": "={{ JSON.stringify($json.ai?.nextSteps || {}) }}",
    "WhatsApp_Sent": "No",
    "Email_Status": "Pending",
    "Follow_Up_Date": "={{ $json.segment === 'Premium' ? $now.toISO() : $json.segment === 'Qualified' ? $now.plus({hours: 2}).toISO() : $now.plus({days: 1}).toISO() }}",
    "Source": "Website Form",
    "Campaign_ID": "={{ $('Webhook').item.json.formData.campaignId || '' }}"
  }
}
```

#### Node 5: Telegram Alert
```javascript
{
  "authentication": "botToken",
  "chatId": "{{ $env.TELEGRAM_CHAT_ID }}",
  "text": `🔔 *New Lead - Row #{{ $json.id }}*

*Name:* {{ $('Webhook').item.json.formData.name }}
*Phone:* +65{{ $('Webhook').item.json.formData.phone }}
*Score:* {{ $json.score }}/100 ({{ $json.segment }})
*Type:* {{ $('Webhook').item.json.formData.loanType }}

*AI Says:* {{ $json.insight }}

*WhatsApp Message:*
\`\`\`
Hi {{ $('Webhook').item.json.formData.name.split(' ')[0] }},

Thanks for reaching out through NextNest. {{ $json.segment === 'Premium' ? 'Your profile qualifies for exclusive rates from multiple banks.' : $json.segment === 'Qualified' ? 'I can help you save on your mortgage.' : 'I can help optimize your mortgage situation.' }}

{{ $json.insight }}

When would be good for a quick 10-min call to discuss your options?

Best regards,
[Your name]
NextNest Mortgage Specialist
\`\`\`

📊 [Open Excel Row {{ $json.id }}](https://excel.office.com)
✅ After WhatsApp sent, update Excel row`,
  "parse_mode": "Markdown"
}
```

### 4. **Setting up Microsoft OAuth in n8n**

1. Go to [Azure Portal](https://portal.azure.com)
2. Register new application
3. Add permissions: `Files.ReadWrite`, `Sites.ReadWrite.All`
4. Get credentials:
   - Client ID
   - Client Secret
   - Tenant ID

5. In n8n, create Microsoft OAuth2 credentials:
   - Authorization URL: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
   - Access Token URL: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
   - Scope: `Files.ReadWrite Sites.ReadWrite.All offline_access`

### 5. **Manual Workflow After Telegram Alert**

1. **Receive Telegram notification**
2. **Copy WhatsApp message**
3. **Send via WhatsApp on phone**
4. **Update Excel directly** (mobile or web):
   - Mark "WhatsApp_Sent" = Yes
   - Add notes about conversation
   - Update follow-up date

### 6. **Share Excel with Clients (Optional)**

For transparency, share read-only views:
1. Create filtered view (hide sensitive data)
2. Share link with password
3. Client sees their loan progress
4. Builds trust and credibility

### 7. **Testing Commands**

#### Test Basic Lead:
```bash
curl -X POST https://primary-production-1af6.up.railway.app/webhook-test/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@test.com",
      "phone": "91234567",
      "loanType": "refinance",
      "outstandingLoan": 500000
    }
  }'
```

#### Expected Results:
1. ✅ Instant response with AI score
2. ✅ Row added to Excel 365
3. ✅ Telegram message with WhatsApp template
4. ✅ Excel accessible on phone for updates

### 8. **Environment Variables**

```env
# n8n environment
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_TENANT_ID=your-tenant

TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

OPENROUTER_API_KEY=your-key
```

## Benefits of This Unified Excel Approach

✅ **Single Source of Truth**: All leads in one Excel workbook (no HubSpot/Airtable/Google Sheets)
✅ **Cost-effective**: Only $6/month for Microsoft 365 Business Basic
✅ **Simple**: Only 5 n8n nodes for complete workflow
✅ **Fast**: Instant AI response to NextNest
✅ **Mobile**: Update Excel on phone (iOS/Android apps)
✅ **Manual WhatsApp**: Full control over messaging via Telegram alerts
✅ **No Power Automate**: Direct Excel API usage
✅ **Scalable**: Excel handles 1M+ rows per sheet
✅ **Analytics Built-in**: Pivot tables and charts replace Google Sheets dashboards
✅ **Compliance**: Data stays in Microsoft's secure infrastructure
✅ **Shareable**: Create filtered views for clients/partners

## Excel Formulas for Analytics Dashboard

Add these to the "Analytics_Dashboard" sheet:

### Lead Metrics
```excel
=COUNTIF(All_Leads[Score],">70")                    // High priority leads
=COUNTIF(All_Leads[Segment],"Premium")              // Premium segment count
=AVERAGE(All_Leads[Score])                          // Average lead quality
=COUNTIF(All_Leads[WhatsApp_Sent],"No")           // Pending WhatsApp
```

### Commercial vs Residential Split
```excel
=COUNTIF(All_Leads[Lead_Type],"Commercial")         // Commercial leads (was HubSpot)
=COUNTIF(All_Leads[Lead_Type],"Residential")        // Residential leads (was Airtable)
=SUMIF(All_Leads[Lead_Type],"Commercial",All_Leads[Amount])  // Total commercial value
```

### Gate Analysis
```excel
=COUNTIF(All_Leads[Gate],"G3")/COUNT(All_Leads[Gate])  // G3 completion rate
=AVERAGEIF(All_Leads[Gate],"G3",All_Leads[Score])      // Average G3 score
```

### Filtered Views for Different Teams
```excel
=FILTER(All_Leads,(All_Leads[Score]>80)*(All_Leads[Lead_Type]="Commercial"))  // Premium commercial
=FILTER(All_Leads,(All_Leads[DSR]<0.55)*(All_Leads[Amount]>500000))          // Qualified by DSR
=SORT(FILTER(All_Leads,All_Leads[Follow_Up_Date]=TODAY()),4,-1)              // Today's follow-ups
```

## Storage Migration Summary

| Previous System | Now in Excel 365 | Sheet/View |
|----------------|------------------|------------|
| HubSpot CRM (Commercial) | Excel | Commercial_Leads view |
| Airtable (Residential) | Excel | Residential_Leads view |
| Google Sheets (Analytics) | Excel | Analytics_Dashboard sheet |
| Multiple APIs/Costs | Single Excel API | $6/month total |

This unified Excel approach eliminates complexity while maintaining all functionality!