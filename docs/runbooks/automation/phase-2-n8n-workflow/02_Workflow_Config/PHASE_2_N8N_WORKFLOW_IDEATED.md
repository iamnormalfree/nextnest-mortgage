---
title: phase-2-n8n-workflow-ideated
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

<function_calls>
<invoke name="structured_response">
<parameter name="workflow_plan">{
  "steps": [
    "Set up webhook trigger with validation - Configure webhook receiver for Next.js form submissions with field validation, rate limiting, and gate level classification",
    "Parse and normalize form data - Extract all fields, validate data types, calculate initial financial ratios, and determine completion tier (Gate 1/2/3)",
    "Store initial lead record in Airtable - Create base record with form data, timestamp, source tracking, and initial status for audit trail",
    "Route by completion gate level - Use switch node to direct Gate 1 (email only), Gate 2 (phone+basic), Gate 3 (complete) to appropriate processing branches",
    "Configure Gate 1 basic response branch - Generate market insights template without personalization for email-only submissions",
    "Send Gate 1 confirmation via Resend - Deliver market overview email with progressive disclosure incentive to upgrade profile",
    "Configure Gate 2 eligibility analysis - Process phone and basic info to generate eligibility indicators and general recommendations",
    "Send Gate 2 analysis via Resend - Deliver eligibility insights with strong CTA to complete full profile for detailed analysis",
    "Configure Gate 3 comprehensive analysis pipeline - Set up full AI-powered analysis workflow for complete profiles",
    "Calculate static lead score components - Compute profile completeness (15%), financial qualifying factors (20%), urgency indicators (10%), property type (5%)",
    "Configure OpenAI GPT-4 mortgage advisor agent - Set up AI agent with comprehensive system prompt, JSON schema output, and 2000 token limit",
    "Connect GPT-4 model via OpenRouter API - Integrate model with error handling, rate limiting, and response validation",
    "Add structured output parser for AI analysis - Configure JSON parser to extract insights, bankMatches, nextSteps, and psychTriggers arrays",
    "Execute comprehensive mortgage analysis - Send complete profile to AI agent for situation assessment, opportunities, risks, and bank recommendations",
    "Implement AI analysis fallback system - Configure psychological trigger templates with client-specific variables if OpenAI fails",
    "Parse AI output into structured data - Extract and validate insights array, bank matches, action steps, and urgency indicators",
    "Calculate dynamic behavioral score baseline - Set initial behavioral score (50% weight) based on form completion speed and field accuracy",
    "Combine static and dynamic scores - Merge profile score (50%) with behavioral score (50%) for final lead score 0-100",
    "Segment leads by score and urgency - Classify as Premium (80-100), Qualified (60-79), Developing (40-59), Cold (<40) with urgency modifiers",
    "Update Airtable with complete analysis - Store AI insights, lead score, segment, and trigger behavioral tracking",
    "Configure email routing decision matrix - Route based on urgency (immediate/high/medium/low) + value (premium/qualified/developing) + type (transactional/campaign)",
    "Set up Resend transactional email system - Configure API with React email templates for instant, high-priority communications",
    "Configure Listmonk campaign platform - Set up self-hosted server connection for bulk nurture sequences and automated campaigns",
    "Route Premium leads to immediate response - Send instant confirmation via Resend with priority processing badge and 2-hour analysis promise",
    "Configure Premium lead escalation sequence - Set up parallel workflow: email tracking → SMS after 2hrs → WhatsApp after 4hrs → personal email next day",
    "Route Qualified leads to mixed sequence - Send confirmation via Resend, then analysis email via Resend, followed by nurture via Listmonk",
    "Configure Developing lead nurture flow - Welcome via Resend, then weekly market updates and educational content via Listmonk campaigns",
    "Set up PDF generation qualification check - Filter leads with score > 60 for professional mortgage strategy report generation",
    "Configure PDF template data preparation - Merge client data, AI insights, bank recommendations, and personalized action plans into template variables",
    "Generate professional PDF report - Use Puppeteer to convert HTML template to A4 PDF with proper formatting, page breaks, and compliance footer",
    "Implement PDF quality validation pipeline - Check file size (<2MB), validate variable population, verify formatting integrity, and scan for errors",
    "Configure admin review routing for Premium leads - Email PDF to brent@nextnest.sg if lead score ≥80 OR urgency = immediate, with 30-minute timeout",
    "Set up parallel touchpoint continuation - Allow SMS, WhatsApp, and other channels to proceed while PDF approval is pending",
    "Handle admin approval responses - Process manual approval, rejection with feedback, or timeout auto-approval for PDF delivery",
    "Deliver PDF via Resend with tracking - Send to client with unique URL tracking, engagement monitoring, and follow-up triggers",
    "Configure behavioral tracking system - Monitor email opens, link clicks, PDF downloads, form interactions, and time-on-page metrics",
    "Update dynamic lead scores continuously - Recalculate behavioral component based on engagement patterns and update Airtable records",
    "Sync lead segments to Listmonk daily - Create and update audience lists: premium_refinance, qualified_newpurchase, developing_equity with tags",
    "Configure Listmonk automated campaigns - Set up welcome series, weekly newsletters, educational drips, rate alerts, and re-engagement sequences",
    "Implement campaign personalization engine - Tag leads with loan type, urgency level, engagement score, and behavioral patterns for targeted delivery",
    "Set up consultation booking integration - Create calendar events with video conference links and send immediate confirmations via Resend",
    "Configure appointment reminder automation - Set up Listmonk campaigns for meeting reminders at 24 hours, 1 hour, and 15 minutes before",
    "Implement cross-platform unsubscribe sync - Ensure unsubscribe preferences are honored across Resend, Listmonk, SMS, and WhatsApp channels",
    "Configure Slack alerting for high-value leads - Send immediate notifications with lead details, score, and next actions when Premium leads identified",
    "Set up WhatsApp Business API integration - Configure automated messages with calendar booking links for Premium leads after email non-response",
    "Implement circuit breaker pattern for APIs - Configure fallback systems: Resend down → n8n queue retry, Listmonk down → Resend overflow, OpenAI down → template fallback",
    "Set up OpenAI error recovery system - Queue failed analyses for automated retry when service restored, with batch processing for recovery",
    "Configure webhook retry with exponential backoff - Implement maximum 3 attempts for failed external API calls with increasing delay intervals",
    "Set up client compensation for AI failures - Automatically upgrade service level or extend consultation time for leads affected by system failures",
    "Configure comprehensive error logging - Track all API failures, email bounces, PDF generation errors, and user experience issues in Airtable",
    "Implement performance monitoring dashboard - Track email delivery rates, open rates, click rates, and conversion metrics across both platforms",
    "Set up lead progression analytics - Monitor conversion from form → consultation → application with funnel analysis and drop-off points",
    "Configure A/B testing framework - Test email templates, subject lines, send times, and CTA buttons across Resend and Listmonk with statistical significance",
    "Set up daily operational health checks - Monitor API status, email reputation, queue lengths, and system performance with automated alerting",
    "Configure PDPA compliance system - Log consent timestamps, track communication preferences, maintain unsubscribe audit trail, and handle data requests",
    "Implement automated data retention - Set up 7-year retention for financial records, 2-year for marketing data, with automated archival and deletion",
    "Configure cost optimization routing - Route transactional urgency via Resend, educational nurture via Listmonk, with cost-per-message tracking",
    "Set up HubSpot CRM bidirectional sync - Push qualified leads to sales pipeline, pull deal status back to update lead records and nurture sequences",
    "Configure Google Sheets performance dashboard - Aggregate metrics from Resend, Listmonk, Airtable, and HubSpot into executive reporting dashboard",
    "Set up automated weekly reporting - Generate performance reports on lead quality trends, conversion rates, channel effectiveness, and ROI analysis",
    "Configure environment variable management - Secure API keys for Resend, Listmonk, OpenAI, Airtable, Twilio, HubSpot with rotation and monitoring",
    "Implement load balancing and queue management - Set up separate workflows for transactional vs campaign processing with appropriate resource allocation",
    "Configure comprehensive monitoring and alerting - Set up uptime monitoring for both email platforms with degradation alerts and failover triggers",
    "Set up backup and disaster recovery - Configure data backups, API failover sequences, and business continuity procedures for critical lead processing"
  ]
}</parameter>
</invoke>
</function_calls>
</function_calls>

Perfect! I've created a comprehensive production-ready workflow plan that covers all your requirements while maintaining efficiency and robustness. The plan includes:

## Key Production Features Implemented:

### **Multi-Tiered Processing Architecture**
- Gate-level routing with appropriate analysis depth
- Dynamic lead scoring (50% static profile + 50% behavioral)
- Intelligent email platform routing based on urgency and value

### **Dual Email System Optimization**
- **Resend**: Instant transactional emails (confirmations, urgent follow-ups, admin alerts)
- **Listmonk**: Scalable campaigns (nurture sequences, newsletters, educational content)
- Smart routing matrix preventing conflicts and optimizing costs

### **Robust AI Integration**
- Comprehensive GPT-4 agent with structured output
- Fallback template system for API failures
- Automated retry and batch recovery systems
- Client compensation for service disruptions

### **Advanced Lead Management**
- Real-time behavioral tracking and score updates
- Parallel processing (PDF approval doesn't block other touchpoints)
- Cross-platform unsubscribe synchronization
- Progressive lead nurturing based on engagement

### **Production-Grade Error Handling**
- Circuit breaker patterns for all external APIs
- Exponential backoff retry logic
- Comprehensive error logging and monitoring
- Automated health checks and alerting

### **Compliance & Performance**
- PDPA compliance with audit trails
- Automated data retention policies
- A/B testing framework for optimization
- Cost monitoring and optimization

The workflow is designed to handle high volume while maintaining personalization, with robust failover systems ensuring no leads are lost even during service disruptions. Ready to implement with your existing infrastructure!