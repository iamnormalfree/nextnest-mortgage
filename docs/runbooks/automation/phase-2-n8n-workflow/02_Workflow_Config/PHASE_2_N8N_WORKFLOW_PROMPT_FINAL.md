---
title: phase-2-n8n-workflow-prompt-final
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

# Phase 2: Final n8n Workflow Prompt
## NextNest AI-Powered Mortgage Lead Intelligence System

### **MASTER PROMPT FOR N8N WORKFLOW CREATION**

```markdown
Build a comprehensive mortgage lead intelligence and nurture system that:

## Core Lead Processing Pipeline

Receives form submissions via webhook from Next.js app containing progressive disclosure gates (email-only, phone+basic, or complete profile)

Determines completion level and routes to appropriate analysis tier:
- Gate 1 (email): Basic market insights only, no personalized data
- Gate 2 (phone): Eligibility indicators and general recommendations  
- Gate 3 (complete): Full analysis with bank matching and savings calculations

## Intelligent Analysis Engine

For complete profiles, sends this prompt to OpenAI GPT-4:

```
You are an expert mortgage advisor in Singapore with deep knowledge of all banks' policies, government schemes, and market trends. Analyze this client profile and provide strategic insights without revealing specific numbers.

Client Profile:
- Name: {{formData.name}}
- Loan Type: {{formData.loanType}}
- Property Type: {{formData.propertyType}}
- Current Rate: {{formData.currentRate}}%
- Outstanding Loan: SGD {{formData.outstandingLoan}}
- Monthly Income: SGD {{formData.monthlyIncome}}
- Lock-in Status: {{formData.lockInStatus}}
- Urgency: {{formData.urgency}}

Generate analysis with these components:

1. SITUATION ASSESSMENT
Evaluate their current position using market context. Reference "current market average of 3.2%" or "87% of similar profiles" but never reveal their specific savings amount.

2. STRATEGIC OPPORTUNITIES
Identify 3-5 opportunities using psychological triggers:
- Loss aversion: "Market window closing in [timeframe]"
- Social proof: "73% of similar profiles benefited from..."
- Information asymmetry: "Banks don't advertise this but..."
- Scarcity: "Only 2 banks currently offering..."

3. RISK FACTORS
Highlight 2-3 risks they should address:
- DSR concerns (if ratio > 0.55)
- Market timing risks
- Approval challenges

4. BANK RECOMMENDATIONS
Suggest 3 banks without naming them directly:
- "Leading local bank with flexible criteria"
- "Foreign bank with competitive rates"
- "Digital bank with fast approval"

5. ACTION PRIORITY
Create urgency with next steps:
- Immediate: What to do in next 48 hours
- Short-term: Actions for next 2 weeks
- Strategic: 3-month optimization plan

Format as JSON with psychological triggers tagged:
{
  "insights": [
    {
      "type": "opportunity|risk|timing|comparison",
      "title": "Compelling headline",
      "message": "Detailed insight",
      "urgency": "high|medium|low",
      "psychTrigger": "loss_aversion|social_proof|scarcity|authority",
      "value": "Hidden benefit without numbers"
    }
  ],
  "bankMatches": [
    {
      "description": "Bank profile without name",
      "strength": "Key advantage",
      "likelihood": "High|Medium|Low"
    }
  ],
  "nextSteps": {
    "immediate": ["Action 1", "Action 2"],
    "shortTerm": ["Action 3", "Action 4"],
    "strategic": ["Action 5", "Action 6"]
  }
}

Remember: NEVER reveal specific savings amounts, exact interest rates they could get, or actual bank names. Create curiosity gaps that require consultation to resolve.
```

Falls back to psychological trigger templates if AI fails, maintaining tollbooth strategy by promising manual review from "Personal Mortgage Brain" within 2 hours

## Lead Scoring & Segmentation

Calculates dynamic lead score (0-100) based on:
- Profile completeness (30%)
- Financial qualifying factors (40%)
- Urgency indicators (20%)
- Engagement behavior (10%)

Segments leads into:
- Premium (80-100): Immediate human callback within 2 hours
- Qualified (60-79): Automated nurture with periodic human touch
- Developing (40-59): Educational content and market updates
- Cold (<40): Monthly market reports only

Stores all lead data in Airtable with full history tracking

## Dual Email System Architecture

### Transactional Emails (via Resend API):
For time-sensitive, one-to-one communications requiring instant delivery:

- Form submission confirmations (Gate 1-3 completions)
- "Your analysis is ready" notifications with PDF attachments
- Appointment confirmations with calendar invites
- Priority lead alerts with "only 3 slots remaining" messaging
- Password resets and account notifications
- SMS-style urgent updates for premium leads

Uses Resend's React Email templates for consistent branding
Tracks delivery, opens, and clicks via webhooks
Implements retry logic for failed sends

### Campaign Emails (via self-hosted Listmonk):
For scalable nurture sequences and bulk communications:

- Welcome series based on loan type (3-5 emails over 14 days)
- Weekly market intelligence newsletters segmented by interest
- Educational drip campaigns for developing leads
- Monthly rate alerts and policy updates
- Re-engagement campaigns for dormant leads
- Success stories and testimonials

Syncs with Airtable daily to update segments:
- Creates lists: `premium_refinance`, `qualified_newpurchase`, `developing_equity`
- Tags leads with: loan type, urgency level, engagement score
- Manages unsubscribes across all campaigns
- A/B tests subject lines and send times

## Multi-Channel Nurture Orchestration

Creates personalized nurture sequences using both email systems:

Premium leads (Resend for all):
- Immediate: Confirmation email with "priority processing" badge
- 30 mins: Analysis ready email with psychological triggers
- 2 hours: SMS via Twilio if no email open
- 4 hours: WhatsApp follow-up with calendar link
- Next day: Personal email from "Your Personal Mortgage Brain"

Qualified leads (Mix of both):
- Immediate: Confirmation via Resend
- 2 hours: Analysis email via Resend
- Day 2-7: Educational series via Listmonk
- Day 8: Personalized follow-up via Resend
- Week 2+: Weekly newsletters via Listmonk

Developing leads (Primarily Listmonk):
- Immediate: Welcome email via Resend
- Weekly: Market updates via Listmonk campaigns
- Monthly: Rate alerts via Listmonk
- Quarterly: Profile completion reminder via Resend

## Professional PDF Report Generation

For qualified leads (score > 60), generates professional PDF report:

### PDF Template Structure:
```html
<!-- Professional A4 PDF Template -->
<html>
<head>
  <style>
    @page { size: A4; margin: 20mm; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #0D1B2A;
    }
    .header {
      border-bottom: 3px solid #4A90E2;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo { width: 150px; }
    .report-title {
      color: #4A90E2;
      font-size: 28px;
      font-weight: 300;
      margin: 20px 0;
    }
    .client-info {
      background: #FAF9F8;
      padding: 15px;
      border-left: 4px solid #4A90E2;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .insight-box {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .bank-card {
      border: 1px solid #e0e0e0;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
    }
    .cta-section {
      background: #4A90E2;
      color: white;
      padding: 25px;
      text-align: center;
      border-radius: 8px;
      margin-top: 40px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <!-- Page 1: Cover & Executive Summary -->
  <div class="header">
    <img src="[NextNest Logo]" class="logo" />
    <h1 class="report-title">Personalized Mortgage Strategy Report</h1>
    <div class="client-info">
      <strong>Prepared for:</strong> {{client.name}}<br>
      <strong>Report Date:</strong> {{date}}<br>
      <strong>Reference:</strong> {{reportId}}<br>
      <strong>Loan Type:</strong> {{loanType}}
    </div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <p>Based on our analysis of your profile and current market conditions, we've identified 
    <strong>{{opportunityCount}} optimization opportunities</strong> for your {{loanType}} requirements.</p>
    
    <div class="insight-box">
      <h3>🎯 Key Finding</h3>
      <p>{{primaryInsight.message}}</p>
    </div>
  </div>

  <!-- Page 2: Market Analysis -->
  <div class="section" style="page-break-before: always;">
    <h2>Market Position Analysis</h2>
    {{#each marketInsights}}
    <div class="insight-box">
      <h3>{{title}}</h3>
      <p>{{message}}</p>
      <small>Impact: {{value}}</small>
    </div>
    {{/each}}
  </div>

  <!-- Page 3: Bank Recommendations -->
  <div class="section" style="page-break-before: always;">
    <h2>Bank Matching Results</h2>
    <p>We've analyzed your profile against 15+ banks. Here are your top matches:</p>
    
    {{#each bankMatches}}
    <div class="bank-card">
      <h3>{{description}}</h3>
      <p><strong>Key Advantage:</strong> {{strength}}</p>
      <p><strong>Approval Likelihood:</strong> {{likelihood}}</p>
      <div style="background: #f0f0f0; padding: 10px; margin-top: 10px;">
        <small>💡 Why this bank: {{reason}}</small>
      </div>
    </div>
    {{/each}}
  </div>

  <!-- Page 4: Action Plan -->
  <div class="section" style="page-break-before: always;">
    <h2>Your Personalized Action Plan</h2>
    
    <h3>📌 Immediate Actions (Next 48 Hours)</h3>
    <ol>
      {{#each nextSteps.immediate}}
      <li>{{this}}</li>
      {{/each}}
    </ol>

    <h3>📅 Short-term Strategy (Next 2 Weeks)</h3>
    <ol>
      {{#each nextSteps.shortTerm}}
      <li>{{this}}</li>
      {{/each}}
    </ol>

    <h3>🎯 Long-term Optimization (3 Months)</h3>
    <ol>
      {{#each nextSteps.strategic}}
      <li>{{this}}</li>
      {{/each}}
    </ol>
  </div>

  <!-- Page 5: Next Steps CTA -->
  <div class="cta-section">
    <h2>Ready to Optimize Your Mortgage?</h2>
    <p>Your Personal Mortgage Brain has identified significant opportunities.<br>
    Schedule a consultation to unlock the full strategy.</p>
    <div style="margin: 20px 0;">
      <a href="{{consultationLink}}" style="background: white; color: #4A90E2; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Book Your Strategy Session
      </a>
    </div>
    <p><small>Limited slots available this week</small></p>
  </div>

  <!-- Footer with Compliance -->
  <div class="footer">
    <p><strong>Important Disclaimers:</strong></p>
    <ul>
      <li>This analysis is based on information provided and current market conditions as of {{date}}</li>
      <li>Actual rates and approval subject to bank's credit assessment</li>
      <li>NextNest Pte Ltd is a licensed mortgage broker regulated by MAS</li>
      <li>We earn commissions from successful placements but provide unbiased advice</li>
    </ul>
    <p>© 2024 NextNest Pte Ltd | UEN: 202300000X | License: MAS-XXX-2024</p>
  </div>
</body>
</html>
```

### PDF Generation Workflow:

1. **Generate PDF** using Puppeteer or similar with professional formatting
2. **Quality Check Node**: 
   - PDF size < 2MB
   - All variables populated
   - No broken formatting
   
3. **Admin Review Step** (YOUR REQUIREMENT):
   ```
   IF lead.score >= 80 OR lead.urgency == "immediate":
     - Email PDF to brent@nextnest.sg FIRST
     - Subject: "REVIEW: Premium Lead Report - {{client.name}}"
     - Body includes lead score, urgency, and AI insights
     - WAIT for manual approval or 30-minute timeout
   ELSE:
     - Auto-send after generation
   ```

4. **Client Delivery**:
   - If approved or timeout: Send to client via Resend
   - Track PDF opens via unique URL
   - Follow up if not opened in 24 hours

For consultation bookings:
- Creates calendar event with Zoom/Google Meet link
- Sends confirmation via Resend immediately
- Adds to Listmonk reminder campaign (1 day, 1 hour before)
- Post-meeting follow-up sequence via Listmonk

## Performance Tracking & Optimization

Tracks all interactions in Airtable:
- Email metrics from both Resend (webhooks) and Listmonk (API)
- Form abandonment points and recovery rates
- PDF download tracking via unique URLs
- Consultation show rates and outcomes
- Conversion from lead to application

Generates weekly performance dashboard combining:
- Resend: Transactional email performance (delivery rate, response time)
- Listmonk: Campaign metrics (open rate, CTR, unsubscribes)
- Overall: Lead quality trends, conversion by source, CAC

A/B tests across both platforms:
- Resend: Transactional email templates, CTA buttons
- Listmonk: Campaign subject lines, send times, content length
- Cross-platform: Email vs SMS vs WhatsApp for urgent comms

## Integration Requirements

Webhooks:
- Receive from Next.js form API (/api/forms/analyze)
- Send to Slack for premium lead alerts
- Trigger SMS via Twilio for urgent cases
- Receive email events from Resend

APIs:
- OpenAI GPT-4 for analysis (2000 token limit per request)
- Airtable for data storage and retrieval
- Resend for transactional emails
- Listmonk (self-hosted) for campaign emails
- HubSpot CRM sync for commercial inquiries
- Google Sheets for performance dashboards
- Twilio for SMS (premium leads only)

Email Configuration:
- Resend: API key for transactional sends
- Listmonk: Connected to Fastmail SMTP for campaigns
- SPF/DKIM/DMARC configured for both

## Error Handling & Compliance

Implements circuit breaker pattern for external APIs:
- Resend down: Queue in n8n for retry
- Listmonk down: Failover to Resend for critical emails
- OpenAI down: Use psychological trigger templates
- Airtable down: Local JSON backup

Maintains PDPA compliance:
- Consent tracking in Airtable for all channels
- Unsubscribe handling synced between Resend and Listmonk
- Data retention: 7 years for financial, 2 years for marketing
- Audit trail: Every email logged with purpose and consent

Handles errors gracefully:
- Email failures trigger alternative channel (SMS)
- Failed webhooks queue for retry (max 3 attempts)
- Daily error summary to admin email
- Fallback templates maintain user experience

## Scalability & Performance

Optimizes for dual email system efficiency:
- Resend: Max 100 emails/second for instant sends
- Listmonk: Batch sends of 1000 emails/minute
- Intelligent routing based on urgency
- Cost optimization: campaigns via Listmonk, urgent via Resend

Performance targets:
- Webhook response: <2 seconds
- Transactional email: <5 seconds to inbox
- Campaign email: Within scheduled window
- Total cost: <$0.50 per lead including all services

Uses n8n features:
- Separate workflows for transactional vs campaign
- Queue management for load balancing
- Parallel processing for bulk operations
- Caching for repeated AI prompts

## Deployment Configuration

Environment variables:
- RESEND_API_KEY for transactional emails
- LISTMONK_URL for campaign server (Railway hosted)
- LISTMONK_API_KEY for campaign management
- OPENAI_API_KEY for AI analysis
- AIRTABLE_API_KEY for database
- TWILIO_AUTH_TOKEN for SMS
- FASTMAIL_SMTP for Listmonk sending

Monitoring:
- Separate metrics for Resend vs Listmonk performance
- Alert if either service degrades
- Daily cost tracking for both platforms
- Weekly email reputation monitoring

Deploy with:
- n8n on Railway (existing setup)
- Listmonk on Railway (new container)
- Environment-based routing rules
- Comprehensive logging for both email systems
```

---

## **IMPLEMENTATION NOTES**

### **Email Service Division of Labor**

| Email Type | Service | Reason | Example |
|------------|---------|---------|---------|
| Form confirmations | Resend | Instant delivery needed | "Thanks for submitting!" |
| Analysis ready | Resend | Time-sensitive | "Your report is ready" |
| Appointment reminders | Resend | Critical timing | "Meeting in 1 hour" |
| Welcome series | Listmonk | Scheduled campaign | 5-email onboarding |
| Market updates | Listmonk | Bulk newsletter | "Weekly rates digest" |
| Educational content | Listmonk | Drip campaign | "Mortgage tips #3" |
| Re-engagement | Listmonk | Segmented campaign | "We miss you" |
| Password resets | Resend | Security critical | "Reset your password" |

### **Cost Optimization**

| Service | Monthly Volume | Cost | Per Email |
|---------|---------------|------|-----------|
| Resend | 2,000 transactional | $20 | $0.01 |
| Listmonk | 8,000 campaigns | $5 (hosting) | $0.000625 |
| **Total** | **10,000 emails** | **$25** | **$0.0025** |

### **Technical Setup Order**

1. Deploy Listmonk on Railway
2. Configure Fastmail SMTP in Listmonk
3. Set up Resend account and API key
4. Create email templates in both systems
5. Build n8n workflow with dual routing
6. Test with sample leads
7. Monitor for first week
8. Optimize based on metrics

---

## **ROUNDTABLE APPROVAL**

✅ **Marcus (Architect)**: "Clean separation of concerns. Excellent."
✅ **Kelly (DevOps)**: "Infrastructure is solid and scalable."
✅ **Ahmad (Backend)**: "API integration points are clear."
✅ **Raj (AI/ML)**: "AI prompts are optimized for cost."
✅ **Jason (Data)**: "Tracking architecture is comprehensive."
✅ **Sarah (Frontend)**: "User experience maintained throughout."
✅ **Emily (Coordinator)**: "Meets all business requirements."

**STATUS: READY FOR N8N IMPLEMENTATION**

---

*This prompt incorporates both Listmonk for campaign management and Resend for transactional emails, providing enterprise-grade email architecture at startup cost.*