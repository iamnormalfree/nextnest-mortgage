ABOUTME: Scenario database system design for capturing, storing, and operationalizing mortgage cases.
ABOUTME: Details schemas, workflows, integrations, and testing strategy for automated Supabase capture.

# Scenario Database System (Part 03)

---
title: "Scenario Database System"
status: draft
owner: engineering
created: 2025-10-22
dependencies:
  - docs/plans/re-strategy/Part01-rate-transparency-integration-plan.md
  - docs/plans/re-strategy/Part02-strategic-canon-and-launch-alignment.md
  - docs/plans/re-strategy/backlog/master-task-list.csv (tasks CAN-004, CAN-011, CAN-012)
---

## 0. Purpose & Scope

Establish the end-to-end system that captures every customer scenario, stores it securely in Supabase, powers AI personas, feeds PSEO, and supports analytics. Automate ingestion from the lead funnel/chat while preserving manual review hooks. Aligns with Stage 0/1 readiness requirements and the six-domain canon.

Out of scope:
- Rate ingestion (covered in Part 01).
- Strategic sequencing (set in Part 02).
- Downstream licensing/referral mechanics (future parts).

## 1. Objectives

1. **Single Source of Truth** – Supabase schema for scenarios, outcomes, audit logs, and attachments with PDPA-compliant retention.
2. **Automated Capture** – Form + chat events automatically create/ update scenario records with minimal manual work.
3. **Operational Workflow** – Provide tools for review, enrichment, and status tracking (stay/reprice/refinance, outcome, follow-up).
4. **AI & Content Integration** – Expose curated scenario data to AI broker prompts, PSEO generation, and analytics dashboards.
5. **Security & Compliance** – Enforce anonymization, consent linkage, and deletion policies. No deviated rate leakage.

## 2. High-Level Architecture

```
Form Submission ─┐
                 ├─> Scenario Intake Service ──> Supabase (scenarios, snapshots, outcomes, events)
Chat Events ─────┘             │
                               ├─> Response Awareness Ledger (AI context)
                               ├─> Admin Scenario Console (review/enrich)
                               └─> PSEO/Analytics Pipelines (read-only)
```

### Components
- **Scenario Intake Service**: Next.js server actions (App Router) that transform form & chat data into normalized scenario records. Runs validations, attaches consent IDs, and queues follow-up tasks.
- **Supabase Data Layer**: Managed PostgreSQL with Row Level Security (RLS) strategies to limit access via service role. Tables described in Section 3.
- **Admin Scenario Console**: Secure admin route for reviewing/editing scenarios, attaching outcomes, and logging manual notes.
- **Integration Hooks**: Webhooks/queries for AI brokers, PSEO engine, and analytics dashboards.
- **Retention & Audit**: Background jobs to expire personally identifiable data per PDPA (default 5-day consent, extendable).

## 3. Data Model (Supabase)

All tables prefixed `scenario_` for clarity.

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `scenario_cases` | Primary record per opportunity | `id (uuid)`, `lead_id`, `consent_id`, `status (enum: draft, active, closed)`, `created_at`, `updated_at`, `next_review_at` |
| `scenario_inputs` | Snapshot of inputs (structured JSON) | `case_id`, `version`, `loan_amount`, `tenure_months`, `property_type`, `current_bank_mask`, `lock_in_remaining`, `income_profile_json`, `created_by`, `created_at` |
| `scenario_calculations` | Computed results for stay/reprice/refi | `case_id`, `calc_version`, `stay_json`, `reprice_json`, `refi_json`, `recommendation (enum)`, `net_savings`, `hassle_score`, `ai_notes_json`, `created_at` |
| `scenario_outcomes` | Final decision + result | `case_id`, `decision (enum: stay, reprice, refinance, lost, dormant)`, `bank_mask`, `loan_quantum`, `commission_estimate`, `signed_at`, `notes` |
| `scenario_events` | Timeline of interactions | `id`, `case_id`, `event_type (lead_form, chat, reveal, follow_up, bank_quote, doc_received, signed)`, `payload_json`, `created_at` |
| `scenario_documents` | References to uploaded docs (if any) | `case_id`, `doc_type`, `storage_path`, `expires_at`, `is_masked`, `created_at` |
| `scenario_tags` | Metadata for analytics/AI | `case_id`, `tag`, `source` |

Primary relationships:
- `scenario_cases` 1:N `scenario_inputs`, `scenario_calculations`, `scenario_events`, `scenario_tags`.
- `scenario_outcomes` one per closed case.

### RLS / Access
- Only service role (server-side) can insert/update. Admin UI uses service role.
- Analytical read role restricted to masked fields (no email/PII).
- AI brokers access read-only view that excludes PII and actual bank names.

### Migrations
- Use Supabase SQL migration files under `supabase/migrations/20251022_scenario_schema.sql`.
- Include `CREATE TYPE` for enums.
- Provide seed script for initial testing.

## 4. Data Flow

### 4.1 Intake from Lead Form
1. User submits progressive form (Step 0 Stage 0 readiness).
2. Server action `createScenarioCase`:
   - Create `scenario_cases` row (`status = draft`).
   - Insert `scenario_inputs` version 1 with normalized values.
   - Attach `consent_id` from PDPA flow.
   - Emit `scenario_events` entry (type `lead_form`).
   - Trigger `ScenarioCalculationJob` (BullMQ) to compute stay/reprice/refi via existing mortgage engine.
3. Calculation job stores results in `scenario_calculations` with recommended path and key metrics.
4. If lead enters chat, event stream continues (Section 4.2).

### 4.2 Chat & AI Broker Integration
1. AI broker loads scenario context via new helper `getScenarioContext(caseId)`:
   - Pulls latest inputs, calculations, tags, reveal status.
   - Masks bank identifiers; only uses baseline metrics.
2. When rate reveal occurs, `scenario_events` receives `reveal` entry with payload (packages shown).
3. AI decisions/logging:
   - `scenario_tags` updated with heuristics (`#preemptive`, `#counter_offer`, `#retention_risk`).
   - Response-awareness ledger references scenario ID for continuity.
4. When human broker updates status, `scenario_outcomes` inserted with final decision.

### 4.3 Manual Review / Enrichment
Admin console features:
- Timeline view (events, reveals, follow-ups).
- Input history diff (versioned inputs/calculations).
- Editable notes, outcome selection, next review date.
- Attachment upload (bank quotes as masked PDFs).
- Anonymization toggle (mask/unmask for training; default masked).

### 4.4 Consent & Retention
- `consent_id` links to PDPA store (existing or new table). Auto-expire job soft deletes PII fields when consent lapses.
- On expiry: `scenario_inputs` retains masked fields only; `scenario_documents` removed; events sanitized.
- Logging of deletions stored in `scenario_events` with `event_type = consent_expired`.

## 5. AI & PSEO Consumption

### AI Broker Context API
- Introduce `lib/scenarios/getScenarioContext.ts` returning:
  - `inputs.summary` (masked), `calculations.recommendation`, `savings`, `hassle_score`, `tags`.
  - `counter_offer` data if bank quote recorded.
- Ensure caching to avoid repeated DB hits; respect feature flag for Part 01 reveals.

### PSEO Integration
- Build `lib/scenarios/pseo-export.ts` producing anonymized case summaries (no dates/PII).
- Include fields: property type, loan amount band, decision reason, net savings, key hurdles.
- Only export cases with outcomes and explicit consent.
- Connect to PSEO scaffolding pipeline (Stage 2 tasks CAN-013/014).

### Analytics
- Provide SQL views for dashboards:
  - `scenario_stats_daily` (new cases, reveals, conversions).
  - `scenario_recommendation_vs_outcome`.
  - `scenario_followup_effectiveness` (time from event to outcome).

## 6. Security & Compliance Considerations

- **PII Masking**: Store only initials or hashed IDs in primary tables; form contact data kept in existing lead store.
- **Rate Leakage Prevention**: Actual deviated rates remain in separate secure store (if needed) and never written to scenario tables.
- **Access Logging**: Every admin console action logs to `scenario_events` (`admin_edit`, `admin_view`).
- **Backups/Exports**: Use Supabase managed backups; no CSV exports without anonymization script.
- **PDPA**: Document processes in updated `docs/runbooks/data/rate-parser.md` and new `docs/runbooks/data/scenario-retention.md`.

## 7. Implementation Plan

### Stage 0 Deliverables
1. **Schema Migration** (CAN-012)  
   - Implement SQL migrations and deploy to Supabase.  
   - Write Jest tests for Zod schemas and data validation.
2. **Intake Service MVP**  
   - Server action creates case + inputs + events.  
   - Calculation job stores first results (reuse existing mortgage engine).  
   - Add unit/integration tests (`tests/integration/scenario-intake.test.ts`).
3. **Admin Console Skeleton**  
   - Read-only timeline view for QA.  
   - Authentication via existing admin middleware.
4. **PDPA Hooks**  
   - Link consent IDs from form.  
   - Background task to handle expiry (cron job or Supabase function).

### Stage 1 Enhancements
1. **Automated Chat Updates**  
   - On chat start, tie conversation to scenario case.  
   - Log reveals and outcomes automatically.  
   - Add `scenario_tags` updates via heuristics.
2. **AI Context API**  
   - Provide sanitized scenario context to AI broker service.  
   - Add unit tests ensuring no PII/bank names leak.
3. **Admin Console Editing**  
   - Outcome entry forms, manual notes, attachments.  
   - Audit logging.

### Stage 2 Scale
1. **PSEO Export Pipeline**  
   - Scheduled job generating anonymized scenario summaries for content team.  
   - Validation to confirm consent and anonymization.
2. **Analytics Dashboards**  
   - Build admin pages with key metrics.  
   - Integrate with Part 02 monitoring.
3. **Retention Automation**  
   - Automatic reminders when scenarios stale (`next_review_at`).  
   - Alerts for high-value cases approaching consent expiry.

## 8. Testing Strategy

- **Unit**: Zod schema validation (`lib/scenarios/schema.ts`), intake service, AI context builder.
- **Integration**: Form submission → scenario creation; chat event → scenario tagging; admin edits → outcome recording.
- **E2E**: Simulate full lead funnel in staging; verify scenario timeline matches expected events.
- **Security**: Tests ensuring masked data in AI context; PDPA expiry clears PII.
- **Performance**: Ensure Supabase queries efficient (<50 ms) with indexes on `case_id`, `created_at`.

## 9. Documentation Updates

- `docs/runbooks/data/scenario-retention.md` (new) – retention, consent, deletion steps.
- `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` – how scenarios feed AI context.
- `docs/work-log.md` – log migration deployment, first cases entered.
- Update Part 02 Stage 0 checklist once Stage 0 deliverables completed.

## 10. Next Steps

1. Generate Supabase migration scripts and submit PR (Stage 0).  
2. Implement intake service + tests.  
3. Build admin console MVP.  
4. Coordinate with ops to capture first 5 cases (CAN-004) using new system.  
5. After Stage 0, proceed with Stage 1 tasks (integration with chat + AI).
