# ⚠️ DEPRECATED - Archived 2025-10-01

**This document has been superseded by**: `docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md`

**Why archived**: Content consolidated into comprehensive guide for better maintenance.

**Original content preserved below for reference**:

---

---
title: chatwoot-setup-guide
type: runbook
domain: chatops
owner: ops
last-reviewed: 2025-09-30
---

# 📚 Chatwoot Setup Guide for NextNest

## Overview
This guide explains how to configure Chatwoot (chat.nextnest.sg) to work seamlessly with the NextNest mortgage application form-to-chat integration.

## Why Each Step Matters in Your Workflow

### 1. **Custom Attributes Configuration** 🏷️
**Why it matters:** Custom attributes allow you to see lead qualification data directly in the Chatwoot conversation panel. When a mortgage inquiry comes in, you'll immediately see:
- Lead score (0-100)
- Loan type (new purchase/refinancing/commercial)
- Employment status
- Monthly income
- Property category

This helps agents prioritize high-value leads and personalize their responses.

---

## Step-by-Step Setup Instructions

### Step 1: Configure Custom Attributes (CRITICAL) ⚠️

**Location:** Chatwoot Admin → Settings → Custom Attributes → Add Attribute

1. Click "Add Attribute"
2. Select "Applies to: Contact"
3. Create these attributes one by one:

| Attribute Key | Display Name | Type | Description |
|--------------|--------------|------|-------------|
| `lead_score` | Lead Score | Number | Qualification score (0-100) |
| `loan_type` | Loan Type | Text | new_purchase/refinancing/commercial |
| `employment_type` | Employment Type | Text | employed/self-employed/etc |
| `property_category` | Property Category | Text | resale/new_launch/bto/commercial |
| `session_id` | Session ID | Text | Unique form session identifier |
| `broker_persona` | AI Broker Type | Text | aggressive/balanced/conservative |
| `monthly_income` | Monthly Income | Number | Combined monthly income |
| `property_price` | Property Price | Number | Target property value |
| `has_existing_loan` | Has Existing Loan | Text | true/false for refinancing |

**Why this matters:** Without these attributes, the lead qualification data won't be visible in Chatwoot, making it impossible to prioritize or personalize responses effectively.

### Step 2: Verify API Access Token ✅

**Location:** Chatwoot Admin → Settings → Profile Settings → Access Token

1. Check if your current token matches: `ML1DyhzJyDKFFvsZLvEYfHnC`
2. If not, generate a new token and update `.env.local`
3. Ensure the token has these permissions:
   - Create/update contacts
   - Create conversations
   - Access inbox

**Why this matters:** The API token is what allows the form to communicate with Chatwoot. Without proper permissions, conversations won't be created.

### Step 3: Configure Webhook (Recommended) 🔗

**Location:** Chatwoot Admin → Settings → Integrations → Webhooks

1. Click "Add Webhook"
2. Enter webhook URL: `https://nextnest.sg/api/chatwoot-webhook`
3. Select events:
   - `conversation_created` - Track when chat starts
   - `message_created` - Process AI responses
   - `conversation_status_changed` - Monitor resolution

**Why this matters:** Webhooks enable real-time synchronization between Chatwoot and your application, allowing for automated responses and analytics tracking.

### Step 4: Set Up Agent Assignment Rules 🤖

**Location:** Chatwoot Admin → Settings → Automation → Add Rule

Create three automation rules based on lead scores:

#### Rule 1: High-Value Leads (Score 75-100)
- **Condition:** Custom Attribute `lead_score` > 75
- **Actions:** 
  - Assign to team: "Premium Sales"
  - Add label: "🔥 Hot Lead"
  - Send initial message: Use Marcus Chen persona template

#### Rule 2: Medium-Value Leads (Score 45-74)
- **Condition:** Custom Attribute `lead_score` between 45-74
- **Actions:**
  - Assign to team: "General Sales"
  - Add label: "Qualified Lead"
  - Send initial message: Use Sarah Wong persona template

#### Rule 3: Low-Value Leads (Score 0-44)
- **Condition:** Custom Attribute `lead_score` < 45
- **Actions:**
  - Assign to team: "Support"
  - Add label: "Nurture Lead"
  - Send initial message: Use David Lim persona template

**Why this matters:** Automated assignment ensures leads are handled by the right team instantly, improving response times and conversion rates.

### Step 5: Create Canned Responses 📝

**Location:** Chatwoot Admin → Settings → Canned Responses

Create templates for each broker persona:

#### Marcus Chen (Aggressive - High Lead Score)
```
Hi {{contact.name}}! 🎯

I've analyzed your mortgage application and have excellent news!

✅ Pre-qualification Status: Highly Likely Approved
💰 Potential Savings: Based on your profile
🏆 Your Profile Score: {{custom_attributes.lead_score}}/100

The market is moving fast. Ready to lock in these rates today?
```

#### Sarah Wong (Balanced - Medium Lead Score)
```
Hello {{contact.name}}! 👋

I've reviewed your {{custom_attributes.loan_type}} application.

Your profile shows good potential for approval. Let me guide you through your options and answer any questions.

What would you like to explore first?
```

#### David Lim (Conservative - Low Lead Score)
```
Hi {{contact.name}},

Thank you for your mortgage inquiry. I'm here to help you understand your options without any pressure.

Feel free to ask me anything - even questions you think might be "basic."
```

**Why this matters:** Canned responses ensure consistent, personalized messaging that matches the lead's qualification level.

### Step 6: Configure Teams 👥

**Location:** Chatwoot Admin → Settings → Teams

Create three teams:
1. **Premium Sales** - For high-value leads
2. **General Sales** - For qualified leads
3. **Support** - For nurture leads

Assign agents to appropriate teams based on their expertise.

**Why this matters:** Team-based routing ensures leads are handled by agents with the right skills and authority levels.

---

## Testing Your Setup

### Test Command (Run in Terminal):
```bash
curl -X POST http://localhost:3000/api/chatwoot-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "91234567",
      "loanType": "new_purchase",
      "propertyCategory": "resale",
      "actualAges": [30],
      "actualIncomes": [8000],
      "employmentType": "employed"
    },
    "sessionId": "test-123",
    "leadScore": 85
  }'
```

### Expected Result:
- Conversation created in Chatwoot
- Custom attributes visible in conversation panel
- Correct team assignment based on lead score
- Appropriate initial message sent

---

## Troubleshooting

### Issue: "Phone number has already been taken"
**Solution:** The system now searches for existing contacts by email and phone, updating them instead of creating duplicates.

### Issue: 400 Bad Request
**Solution:** Ensure all required fields are populated in the form. The API now accepts optional employment type and income arrays.

### Issue: Custom attributes not showing
**Solution:** Verify attributes are created with exact key names as listed above.

### Issue: Webhooks not firing
**Solution:** Check webhook URL is publicly accessible and returns 200 status.

---

## Workflow Impact Summary

This integration creates a seamless handoff from form to chat:

1. **User completes mortgage form** → Lead score calculated
2. **API creates Chatwoot conversation** → Custom attributes attached
3. **Automation rules trigger** → Correct team assigned
4. **Agent sees full context** → Personalized response sent
5. **Analytics tracked** → Conversion funnel optimized

The result: Higher conversion rates, faster response times, and better customer experience.

---

## Next Steps

1. ✅ Complete all custom attribute creation
2. ✅ Test with a real form submission
3. ✅ Monitor first 10 conversations for any issues
4. ✅ Adjust automation rules based on agent feedback
5. ✅ Review analytics after first week

---

## Support

For technical issues:
- Check server logs: `npm run dev`
- Review Chatwoot logs: Admin → System Logs
- Contact: tech@nextnest.sg