ABOUTME: Client-controlled contact and follow-up canon aligning AI drafts with human review.
ABOUTME: Defines lead states, cadence, channels, and follow-up guardrails.

# Client-Controlled Contact & Follow-Up System (Part 05)

---
title: "Client-Controlled Contact & Follow-Up System"
status: draft
owner: operations
created: 2025-10-22
dependencies:
  - docs/plans/re-strategy/Part01-rate-transparency-integration-plan.md
  - docs/plans/re-strategy/Part03-scenario-database-system.md
  - docs/plans/re-strategy/Part04-brand-ux-canon.md
  - docs/plans/re-strategy/backlog/master-task-list.csv (tasks CAN-008, CAN-020..022)
---

## 0. Objectives
- Keep the customer in control while ensuring consistent, context-rich follow-ups.
- Blend AI automation with human oversight: AI drafts, brokers approve/send except for dormant/unresponsive segments.
- Maintain trust even when we earn $0 (repricing/stay) by capturing value through scenario enrichment.
- Support 50+ concurrent conversations without exceeding the 12–14h/week operational target.

## 1. Lead States & Heat Tags

### 1.1 Canonical States
1. **New Intake** – Form/chat just completed. First follow-up drafted automatically; broker reviews and sends.
2. **Active Conversation** – Two-way exchange (booked call, ongoing Q&A). Every message AI drafts, broker approves.
3. **Decision Pending** – Waiting on bank counter-offer, documents, or client response. AI recommends nudges aligned with decision deadline; broker approves.
4. **Long-Term Nurture** – Lead is months away or exploring. AI prepares periodic check-ins (monthly/quarterly). Broker can approve in batch.
5. **Dormant/Unresponsive** – No engagement after defined cadence or explicitly paused. Fully automated drips until re-engagement; human review optional.

### 1.2 Heat Tags (applied across states)
- **Hot** – High loan quantum or imminent decision; escalate to human quickly.
- **Warm** – Engaged but timeline flexible.
- **Cold-Future** – Far from needing a loan but still interested.
- **Cold-Unresponsive** – No replies after repeated nudges; automation takes over.

## 2. Communication Channels

- **Primary**: Email + WhatsApp (via Chatwoot channel integration).  
- **Secondary**: In-dashboard notifications for logged-in users (future enhancement).  
- **Fallback**: SMS (only if WhatsApp unavailable).  
- **Manual calls**: Only when triggered by state (e.g., high-value lead stalled, explicit request).

## 3. Follow-Up Cadence by State

### 3.1 New Intake
- **Touchpoints**: 3 within first 72 hours.
  1. Immediate summary email/WhatsApp (AI draft, human approve).
  2. 24h reminder with scenario insights.
  3. 48–72h follow-up offering call/benchmark once more.
- **Escalation**: If high loan quantum or explicit urgency, broker call scheduled (human decision).

### 3.2 Active Conversation
- **Cadence**: Event-driven (bank updates, client replies).  
- **Rule**: Respond within 2 hours during business time, 12 hours otherwise.  
- **AI Role**: Draft responses with context summary; broker approves and sends.  
- **Handoff**: If lead asks for human or conversation complexity escalates, broker handles manually but can still use AI suggestions.

### 3.3 Decision Pending
- **Cadence**: Every 2–3 days until decision deadline.  
- **Content**: Progress updates, document reminders, benchmark comparisons.  
- **AI Role**: Draft nudges referencing scenario IDs, rate expiry, and pending tasks. Broker approves.
- **Dark Arts Defense**:  
  - If bank counter-offer expected: AI proposes script to request copy of offer; broker approves.  
  - If bank unresponsive: AI drafts status check ping; automation can send if broker approves in bulk.

### 3.4 Long-Term Nurture
- **Cadence**: Monthly (cold-future) or quarterly (post-decision).  
- **Content**: Feed scenario insights, rate trends, festive greetings contextualised by lead info.  
- **Automation**: AI drafts series, broker can approve in batches (e.g., 40 leads).  
- **Value Capture**: Each touch adds metadata to scenario DB (interest level, new info).

### 3.5 Dormant/Unresponsive
- **Cadence**: Automated drip every 60–90 days.  
- **No manual action** unless lead re-engages.  
- **Content**: Soft updates, invite to check new scenario or join webinar.  
- **Exit**: If lead responds, automatically shift to New Intake or Active Conversation and restore human approval loop.

## 4. Follow-Up Workflow & Tooling

### 4.1 AI Draft Generation
- Triggered by state transitions or scheduled cadences.  
- Pulls scenarios, lead context, last messages, rate reveal history.  
- Produces draft message (email + WhatsApp), model-proposed send time, and recommended next follow-up date.
- Stores draft in Chatwoot conversation + operations dashboard.

### 4.2 Human Approval Queue
- Brokers see queue grouped by state (New, Pending, Nurture, Dormant).  
- Each entry shows: lead summary, heat tag, recommended message (with editable fields), recommended send time, and scenario IDs.  
- Broker can approve/send, edit, snooze, or skip.  
- Approvals log to Supabase (`scenario_events` + `follow_up_actions` table).  
- For bulk (e.g., monthly nurture), provide batch approval with preview.  
- If message auto-sent for Dormant state, tag conversation for review in operations dashboard.

### 4.3 Logging & Analytics
- Every follow-up -> `scenario_events` with `event_type = follow_up`, details (`channel`, `state`, `heat`, `approved_by`).  
- Track send outcome (delivered, read, replied) via Chatwoot metrics.  
- Dashboard metrics: follow-up volume per broker, response rates by state, conversion impact.  
- Feed data into CAN-010 (analytics logging) and Part 03 dashboards.

## 5. Templates & Content Rules

- **Tone**: Evidence-based, empathetic, action-oriented. Reference scenario insights, not generic fluff.  
- **Transparency**: Continue to mention compensation (“We earn only if you switch banks; repricing/stay pays us nothing but we still benchmark it for you.”).  
- **Personalization**: Always use name, scenario context (property type, loan stage), and decision status.  
- **Compliance**: Ensure PDPA consent still valid; if consent expired, stop automated messages until renewed.  
- **Festive/Rate Updates**: Pre-approved templates (Annex A) that AI can adapt with scenario tidbits.

## 6. Automation Guardrails

- **AI Confidence**: If AI confidence < threshold (e.g., uncertain tone, conflicting data), flag for manual review and do not queue message.  
- **Rate Shopper Flag**: For leads flagged as rate shoppers, AI preps scripts that reference competitor offers and escalate to human quickly.  
- **Urgency Handling**: For high loan quantum with upcoming deadlines, AI suggests switching to manual call.  
- **Opt-Outs**: Manage unsubscribe/stop keywords across channels; update lead state to Dormant immediately.

## 7. Implementation Deliverables

### Stage 0 (Planning & Setup)
1. Define Supabase tables: `follow_up_actions`, extend `scenario_events` (refer Part 03).  
2. Update backlog tasks (CAN-008, CAN-020..022) for heuristics, messaging, CTA restyle.  
3. Create message template library (Annex A) seeded with brand-approved copy.

### Stage 1 (Semi-Automation)
1. Implement AI draft generator tying into Ably/Chatwoot events.  
2. Build broker approval queue UI (web dashboard).  
3. Wire state transitions + heat tagging automation.  
4. Log all actions to Supabase; ensure analytics API picks up follow-up events.

### Stage 2 (Scale & Automation)
1. Enable batch approvals for nurture segments.  
2. Implement dormant-state auto-drip (with Chatwoot automation or backend).  
3. Integrate in-dashboard messaging for logged-in users.  
4. Add proactive trigger monitors (e.g., Fed rate update → auto-draft for relevant leads).

## 8. Testing & KPIs

- **Functional**: Unit tests for draft generator, state transitions, logging; integration tests sending via email/WhatsApp sandbox.  
- **Operational**: Pilot with subset of leads; monitor time spent vs. conversions.  
- **KPIs**:
  - Response rate per state.  
  - Conversion rate (stay/reprice/refi) linked to follow-ups.  
  - Broker time spent in approval queue (target within SLA).  
  - Number of new scenario tags captured through nurture touches.

## 9. Documentation Updates

- Update `docs/runbooks/operations/follow-up-playbook.md` (new) with workflows, scripts, escalation paths.  
- Add messaging templates to `docs/runbooks/brand/copywriting-guide.md` Annex.  
- Document automation logic in `docs/runbooks/engineering/automation-platform.md`.

## 10. Annex A – Template Library (Outline)

1. **New Intake** – immediate summary, 24h reminder, 48h nudge.  
2. **Decision Pending** – counter-offer request, document checklist, deadline reminder.  
3. **Long-Term Nurture** – monthly scenario insight, rate update, festive greeting.  
4. **Dormant** – quarterly check-in, “new scenario library milestone,” soft opt-in.  
5. **Rate Shopper Script** – tactful benchmark response.  

Templates to be stored in structured format (YAML/JSON) for AI to adapt.
