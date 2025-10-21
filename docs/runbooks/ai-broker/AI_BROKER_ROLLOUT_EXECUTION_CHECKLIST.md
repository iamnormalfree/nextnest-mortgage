---
title: AI Broker Rollout Execution Checklist
owner: engineering
status: Draft
last_reviewed: 2025-10-21
---

# AI Broker Rollout Execution Checklist

> Use this checklist when executing Phase 3 of `2025-10-21-ai-broker-chat-activation-plan.md`. It converts the playbook into concrete commands, logging expectations, and stakeholder communication steps.

## 1. Pre-flight (One Hour Before Validation Window)

- [ ] Confirm Redis, OpenAI, and Chatwoot credentials in the target environment (Railway or Vercel).
  ```bash
  # Review current rollout status
  curl https://<env-domain>/api/admin/migration-status | jq
  # Review worker state
  curl https://<env-domain>/api/worker/start | jq
  ```
- [ ] Download recent worker logs (Railway dashboard or `railway logs --service bullmq-worker`).
- [ ] Notify stakeholders in `#ai-broker`:
  ```
  Heads up: starting AI Broker staged rollout validation at <time>. Target: 10% traffic with n8n fallback enabled. Will share metrics after the validation window.
  ```

## 2. Validation Stage (10 Percent Traffic)

- [ ] Update environment configuration:
  ```bash
  ENABLE_AI_BROKER=true
  ENABLE_BULLMQ_BROKER=true
  BULLMQ_ROLLOUT_PERCENTAGE=10
  ```
- [ ] Redeploy worker/service.
- [ ] Verify migration status reflects 10 percent rollout and n8n fallback enabled.
- [ ] Execute smoke chats (desktop and mobile) and log timestamps plus response latency.
- [ ] Record findings in `docs/work-log.md` under a new Phase 3 entry.
- [ ] If failure rate >= 2 percent or response P95 > 5 s, rollback immediately (see Section 5).

## 3. Ramp Stage (50 Percent Traffic)

- [ ] Preconditions met: validation window complete, failed job rate < 1 percent, worker stable for 24 hours.
- [ ] Update configuration:
  ```bash
  BULLMQ_ROLLOUT_PERCENTAGE=50
  ```
- [ ] Announce ramp in `#ai-broker` with current metrics.
- [ ] Re-run smoke chats and `/api/admin/migration-status`.
- [ ] Review Chatwoot inbox transcripts for persona continuity and handoff behavior.
- [ ] Capture results in the work log.

## 4. Full Cutover (100 Percent Traffic)

- [ ] Preconditions met: Ramp window stable for 72 hours and leadership sign-off recorded.
- [ ] Update configuration:
  ```bash
  ENABLE_AI_BROKER=false
  BULLMQ_ROLLOUT_PERCENTAGE=100
  ```
- [ ] Redeploy worker/service.
- [ ] Run end-to-end verification:
  - Desktop and mobile smoke chats.
  - `/api/admin/migration-status` and `/api/worker/start`.
  - Chatwoot transcript review for at least two conversations.
- [ ] Post completion update in `#ai-broker` and `#customer-systems`.
- [ ] Schedule 48 hour post-cutover review meeting (engineering, operations, support).

## 5. Rollback Procedure

If SLA breaches occur (response P95 > 5 s, duplicate replies, failed job rate >= 2 percent):

```bash
BULLMQ_ROLLOUT_PERCENTAGE=<previous value>
ENABLE_AI_BROKER=true
ENABLE_BULLMQ_BROKER=true
```

- Redeploy worker/service.
- Confirm `/api/admin/migration-status` reflects the rollback.
- Notify stakeholders with incident summary and planned next steps.
- Log incident details in `docs/work-log.md`.

## 6. Post-Execution Documentation

- [ ] Update `docs/plans/active/2025-10-21-ai-broker-chat-activation-plan-COMPLETION.md` with actual rollout metrics and verification outcomes.
- [ ] Attach production screenshots or logs (anonymized) to `docs/validation-reports/` if new evidence is collected.
- [ ] Ensure the Final Success Checklist in the activation plan is ticked only after all verification steps pass.
