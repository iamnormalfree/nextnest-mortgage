ABOUTME: White-label/B2B readiness plan for future licensing and partnerships.
ABOUTME: Defines evidence milestones, tooling, and outreach sequencing for B2B.

# White-Label & B2B Readiness (Part 08)

---
title: "White-Label & B2B Readiness"
status: draft
owner: strategy/growth
created: 2025-10-22
references:
  - docs/strategy_integration/permissable-asymmetry.md
  - docs/strategy_integration/clear-ideas-framework.md
  - docs/plans/re-strategy/Part03-scenario-database-system.md
  - docs/plans/re-strategy/Part06-pseo-rhizome-system.md
  - docs/plans/re-strategy/Part07-referral-partnership-engine.md
---

## 0. Purpose & Scope

Outline the prerequisites and staged plan for offering NextNest’s scenario engine as a white-label/B2B solution (e.g., to SME owners requiring commercial mortgages, other brokers, or finance partners). Goal: know when we are “ready” to seed B2B outreach, what evidence/assets to gather, and how to package offers without diluting core brand.

## 1. B2B Target Segments & Value Props

### 1.1 Primary Targets
- **SME owners seeking commercial mortgage intelligence** – provide tailored insights, calculators, and scenario dossiers as lead magnets.
- **Boutique mortgage/finance brokers** – license scenario database + workflow tools.
- **Financial advisors/property agencies** – embed scenario recommendation engine as co-branded module.

### 1.2 Value Proposition Set
- Evidence-based scenario engine (Part 03) with documented cases.
- Programmatic content (Part 06) & data library for joint marketing.
- Referral system backend (Part 07) enabling partner onboarding.
- PDPA-compliant consent flow + audit trails.

## 2. Readiness Evidence Checklist

Establish thresholds before approaching each B2B segment.

| Evidence | Metric | Source |
|----------|--------|--------|
| Scenario depth | ≥100 documented scenarios across residential/commercial | Supabase `scenario_cases` |
| Performance data | Conversion rates (Lead→Deal), time saved stats, follow-up effectiveness | Analytics dashboards |
| Content authority | Prime Nodes published, 20+ lateral pieces, evidence of GEO presence | Part 06 outputs |
| Compliance & PDPA | Documented consent flow, security posture, audit logs | Part 07/operations docs |
| Case studies | At least 3 detailed anonymized case studies (client + SME partner) | Marketing repo |

Document progress in `docs/reports/b2b-readiness.md` (new) with quarterly updates.

## 3. Asset & Tool Requirements

- **White-label Portal Concept**: Evaluate multi-tenant or co-branded views for partners (future). For now, ensure scenario dashboards can export customizable reports (PDF/CSV).
- **Marketing Collateral**:
  - One-pager summarizing architecture, compliance, ROI data.
  - Technical brief referencing Part 03/05/06/07.
  - Demo deck using Clear Ideas framework (one claim + concrete proof).
- **Success Metrics** (for pilot): track partner acquisition cost, partner retention, revenue share.

## 4. Outreach Sequencing & Playbooks

### 4.1 Stage A – Quiet Seeding (Post Stage 2 readiness)
- Identify SME owners already in funnel (via Part 05 follow-up tags).
- Offer them scenario whitepaper (customized) to validate interest.
- Collect testimonials/case study data.

### 4.2 Stage B – Partner Pilots
- Approach 1–2 trusted agents/brokers for pilot licensing (co-branded scenario reports, maybe limited access to scenario database via API).
- Sign NDAs, set expectations (no resell, track usage). Evaluate technical requirements (carrier portal, read-only API keys).

### 4.3 Stage C – Broader Licensing
- After success metrics met, prepare licensing T&Cs, pricing model (e.g., monthly license + performance bonus). Ensure legal review.

## 5. Technical Considerations for White-Label

- **Multi-tenant Data Access**: design Supabase row-level access if offering direct database/API access (future). For now, plan to deliver outputs via secure reports.
- **Brand Customization**: allow partner logo + colors on scenario PDFs and dashboards (config-driven).
- **Usage Tracking**: add `source_partner_id` to scenario logs for usage analytics.

## 6. Documentation & Content Updates

- Create `docs/runbooks/b2b/white-label-playbook.md` with outreach scripts, readiness checklist, and compliance steps.
- Update Part 06 backlog with content assets targeted at SME/B2B (e.g., “Commercial mortgage scenario pack”).
- Add B2B section to referral playbook with partner tiers.

## 7. Backlog Seeds

- CAN-029: Draft B2B readiness report template (`docs/reports/b2b-readiness.md`).
- CAN-030: Build scenario PDF export with partner branding options.
- CAN-031: Prepare whitepaper/evidence pack for SME owners.
- CAN-032: Develop pilot licensing proposal template.

