---
title: "Mobile Form Baseline Analytics Plan"
status: backlog
owner: data-engineering
created: 2025-11-01
constraint: "Constraint A – Public Surfaces Ready"
purpose: "Capture pre-rollout metrics so the mobile-first rebuild can be verified against a known baseline."
---

# Mobile Form Baseline Analytics Plan

## Background

The mobile-first rebuild (`docs/plans/active/2025-10-18-lead-form-mobile-first-rebuild.md`) requires hard data to confirm improvements. Today we lack reliable desktop/mobile conversion and field-visibility telemetry, which would leave the rollout unverified. This plan establishes the baseline analytics and reporting before the new mobile flow ships.

## Objectives

1. Instrument the key funnel events for the `/apply` form on both desktop and mobile.
2. Produce a 14-day rolling baseline for:
   - `mobile_conversion_rate`
   - `desktop_conversion_rate`
   - `fields_shown_avg`
   - `session_restored_rate`
   - `smart_default_kept_rate` (once defaults ship)
3. Stand up a quick PostHog (or equivalent) dashboard plus CSV export to share with stakeholders.

## Deliverables

- Event schema documented in `docs/runbooks/analytics/form-conversion-events.md`.
- Tracking implemented in production (`app/apply/page.tsx`, `hooks/useProgressiveFormController.ts`).
- Baseline report stored at `docs/reports/analytics/2025-11-<date>-mobile-form-baseline.md`.
- Dashboard link posted in `#forms` Slack channel with interpretation notes.

## Plan of Record

### Phase 1 – Instrumentation Audit (0.5 day)
- Review existing analytics code (`lib/analytics`, `PostHogProvider` usage).
- Confirm event naming conventions with analytics runbook.
- Draft event schema (step start/complete, reveal, submit).

### Phase 2 – Tracking Implementation (1 day)
- Add event triggers in `ProgressiveFormWithController.tsx` and relevant hooks.
- Ensure events carry viewport/device context.
- Add guard to avoid double-counting on auto-save.
- Write smoke test (`tests/integration/forms/form-analytics.test.ts`).

### Phase 3 – Baseline Collection (1–2 days)
- Deploy instrumentation.
- Capture 14 days of data (or minimum 7 if schedule constrained; annotate gap).
- Export metrics to CSV + Markdown summary.

### Phase 4 – Handoff (0.5 day)
- Publish dashboard link and report.
- Update mobile rebuild plan checklist with baseline reference.
- Log completion in `docs/work-log.md`.

## Success Criteria

- Events visible in PostHog within 5 minutes of deployment.
- Baseline metrics reported with clear start/end dates.
- Mobile rebuild plan references the report before rollout.

## Notes

- If analytics infrastructure is pending, note blockers and escalate before implementation proceeds.
- Once the mobile rebuild ships, rerun this plan’s report as a follow-up to compare deltas.
