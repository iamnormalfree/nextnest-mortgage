ABOUTME: Referral and partnership system plan aligning bankers, agents, and legal partners.
ABOUTME: Detailed implementation playbook with Airtable integration, PDPA handoff, and automation.

# Referral & Partnership Engine (Part 07)

---
title: "Referral & Partnership Engine"
status: draft
owner: growth/ops
created: 2025-10-22
references:
  - docs/strategy_integration/nn-deep-research.md
  - docs/plans/re-strategy/Part03-scenario-database-system.md
  - docs/plans/re-strategy/Part05-client-controlled-contact.md
  - docs/plans/re-strategy/Part06-pseo-rhizome-system.md
---

## 0. Purpose & Prerequisites

Build a lightweight yet scalable referral network across bankers, real estate agents, and legal partners. Goals:
- Capture partner relationships in Airtable.
- Provide referral submission flows with PDPA-friendly confirmations.
- Automate handoffs into Supabase and follow-up systems.
- Offer tailored incentives (non-monetary for bankers/lawyers; split-commission tracking for agents).

Prereqs: Node 18+, existing Supabase setup (Part 03), Airtable access with API key, Chatwoot + email service for confirmations.

## 1. Directory & File Overview

| Area | Purpose | Key Paths |
|------|---------|-----------|
| Airtable schema | Partner + referral tables | `docs/runbooks/ops/airtable-schema.md` (new) |
| API integration | Backend syncing | `lib/integrations/airtable.ts` |
| UI | Partner landing + referral forms | `app/partners/`, `app/partners/[type]/refer/page.tsx` |
| Supabase | Referral storage & linking | `supabase/migrations/` (new tables) |
| Notifications | Email/SMS confirmation | `app/api/referrals/notify/route.ts` |
| Automations | Scripts for syncing | `scripts/referrals/` |

## 2. Airtable Setup

Create base “NextNest Partnerships” with tables:
- **Partners**: fields `id`, `type` (banker/agent/law), `name`, `company`, `email`, `phone`, `notes`, `status`, `created_at`.
- **Referrals**: `id`, `partner_id` (link), `client_name`, `client_email`, `client_phone`, `property_type`, `loan_stage`, `notes`, `pdpa_confirmed` (checkbox), `status` (new/intake/active/closed/dormant), `created_at`.
- Optional: **Meetings** for relationship touches (coffee/lunch).

Document schema in `docs/runbooks/ops/airtable-schema.md` with screenshots and field descriptions.

## 3. Supabase Schema Extensions

Migration file `supabase/migrations/20251022_referrals.sql`:
- `referral_sources` table mirroring Airtable `Partners` (for caching).
- `referrals` table linking to `referral_sources` and `leads` (if created).
- Fields for PDPA confirmation timestamp, partner type, incentive tracking, follow-up schedule.

Create repository helper `lib/db/repositories/referral-repository.ts` with methods:
- `upsertPartner`, `createReferral`, `linkLeadToReferral`, `updateReferralStatus`.
Add tests `tests/db/referral-repository.test.ts` (use Supabase test harness).

## 4. API & Sync

### 4.1 Airtable Integration
- Build `lib/integrations/airtable.ts` using Airtable REST API (or official client). Provide functions `fetchPartners`, `createReferral`, `updateReferralStatus`.
- Store API key + base ID in `.env.local` (`AIRTABLE_API_KEY`, `AIRTABLE_BASE_PARTNERS`). Document in `docs/runbooks/devops/deployment-env-variables.md`.

### 4.2 Sync Script
- Create `scripts/referrals/sync-airtable.ts`:
  1. Fetch partners from Airtable → upsert into Supabase `referral_sources`.
  2. Fetch new referrals → insert into Supabase `referrals` with `status = 'new'`.
  3. Mark synced records in Airtable (e.g., “Synced” checkbox or timestamp).
- Add cron/CI job (GitHub Action) to run hourly/daily.

### 4.3 API Routes
- `app/api/referrals/submit/route.ts` – receives form submissions, validates, writes to Airtable (primary) and Supabase (cache), triggers notifications.
- `app/api/referrals/update-status/route.ts` – endpoints for internal tools to update referral progression.
- Include Zod validation; tests in `tests/api/referrals-submit.test.ts`.

## 5. Partner-Facing UI

### 5.1 Partner Landing Page
- Create `app/partners/page.tsx` with overview, explanation of incentive model per partner type, and call-to-action buttons.
- Use brand styles (Part 04). Include PDPA statement snippet partners can reuse.

### 5.2 Referral Forms
- Create `app/partners/banker/refer/page.tsx`, `app/partners/agent/refer/page.tsx`, `app/partners/law/refer/page.tsx`.
- Shared form component `components/partners/ReferralForm.tsx` with props for type-specific fields.
- Fields: Partner identity (prefilled via query param or manual entry), client contact, property context, “PDPA consent obtained” checkbox, optional notes.
- On submit: call `/api/referrals/submit`.
- Show success page explaining client confirmation process and expected timeline.

### 5.3 Partner Portal (optional Stage 2)
- Protected route `app/partners/dashboard/page.tsx` to list their referrals using Supabase data (requires authentication/invite token).

## 6. Client Confirmation & PDPA

- After referral submission, trigger email/SMS to client via existing email service or new provider. Implement in `app/api/referrals/notify/route.ts`:
  - Email template `emails/referral-confirmation.mjml` stating partner referred them, summarizing privacy policy, providing “Confirm & Start” CTA linking to lead form.
  - If client clicks confirm, update Supabase (`pdpa_confirmed_at`) and move referral to `status = 'intake'`.
  - Provide opt-out link (sets status `declined`).
- Log notifications to Supabase `referral_notifications` table.

## 7. Internal Workflow Integration

- Modify lead intake to accept `referral_id` query param; when client completes form, link to referral via `referral_repository`.
- In follow-up system (Part 05), surface referral partner data so AI/brokers know source.
- Add Slack/Email alert to operations when new referral arrives.

## 8. Incentive & Relationship Tracking

- Real estate agents: add fields `commission_split_percentage`, `deal_value` (populated once closed). Create script `scripts/referrals/calculate-agent-payouts.ts` to summarize monthly.
- Bankers/lawyers: maintain relationship touch log (`Meetings` table) to schedule coffees/lunches. Add UI component `components/partners/TouchpointList.tsx` for internal dashboard.
- Document guidelines in `docs/runbooks/ops/partner-care.md` (frequency of touchpoints, acceptable gifts, etc.).

## 9. Testing & QA

- Unit tests for API routes and repository functions (Jest). Ensure PDPA checkbox enforced.
- Integration test simulating referral submission → client confirmation → lead capture (use Playwright or API test harness).
- Manual QA: verify Airtable sync, Supabase records, notification emails, and follow-up integration.

## 10. Stage Plan

### Stage 0 – Foundation (2–3 weeks)
1. Setup Airtable base + document schema.
2. Implement Supabase migrations for referral tables.
3. Create referral submission API + shared form component.
4. Wire up client confirmation emails.
5. Manual test end-to-end with sample banker + agent referral.

### Stage 1 – Partner Onboarding (weeks 3–5)
1. Build partner landing page and individual referral forms.
2. Deploy Airtable sync script + schedule.
3. Add internal alerts + dashboards (basic list of referrals with status).
4. Prepare partner-facing PDPA PDFs and sample consent wording.

### Stage 2 – Scale & Portal (week 6+)
1. Implement partner dashboard (view referrals, status updates).
2. Automate agent commission summaries.
3. Integrate follow-up automation to trigger nurture sequences per partner source.
4. Expand to co-marketing assets (Part 06 content) for partners.

## 11. Documentation Deliverables

- `docs/runbooks/ops/airtable-schema.md`
- `docs/runbooks/ops/referral-playbook.md` (daily workflow, partner onboarding steps).
- `docs/runbooks/ops/partner-care.md` (touchpoint cadence & compliance).
- Update `docs/runbooks/devops/deployment-env-variables.md` with Airtable + email env vars.
- Append partner referral process to `docs/plans/re-strategy/backlog/master-task-list.csv` (new tasks: sync script, portal, payout calculator).

## 12. Backlog Seed Tasks

- Add CAN-024: Implement referral submission API + Supabase tables.
- CAN-025: Build partner landing + forms.
- CAN-026: Configure Airtable sync + alerts.
- CAN-027: Implement client confirmation notifications.
- CAN-028: Develop agent commission summary script.

