---
title: Chat Observability & Security Hardening
status: backlog
owner: engineering
created: 2025-10-22
priority: high
complexity: medium
tags:
  - observability
  - security
  - chatwoot
  - bullmq
context: |
  The chat stack is running BullMQ + Chatwoot with fallback support, but there is limited production-grade visibility and real-time alerting. Security checks in health endpoints are placeholders. This plan captures the end-to-end observability and security posture required before scaling traffic.
---

## Goals
- Production-grade monitoring for chat API, BullMQ worker, and Redis
- Real-time alerting for queue health, SLA breaches, and Chatwoot failures
- Proper audit logging, HMAC checks, and secrets management for compliance
- Dedicated dashboards and accessible tooling for operational support

## Phase 1 – Core Observability (Datadog + Sentry)
1. **APM & Metrics**
   - Instrument Next.js API routes with Datadog APM (or equivalent)
   - Add BullMQ worker instrumentation (job latency, fail counts)
   - Configure Redis integration for queue depth, memory, connection metrics

2. **Logging**
   - Forward Next.js server logs, Chatwoot webhook logs, and worker stdout to Datadog Logs (or designated sink)
   - Correlate logs with traces via request IDs

3. **Error Tracking**
   - Add Sentry to Next.js (frontend + API) and BullMQ worker
   - Configure alerts for new errors, regression spikes

## Phase 2 – Chatwoot Health & Security
1. **Chatwoot Health**
   - Enable Chatwoot audit logging and HMAC in production
   - Stream Chatwoot audit logs to log sink (S3 → Athena or Datadog)
   - Update `/api/health/chat-integration` security check to validate:
     - Audit log heartbeat (last entry < 6h)
     - HMAC key present
     - Fallback channels (phone/email) responsive

2. **Secrets Management**
   - Move Chatwoot tokens, Redis creds, OpenAI key to AWS Secrets Manager (or Doppler/Vault)
   - Update runtime (Railway/Vercel) to pull secrets dynamically

## Phase 3 – Queue & Worker Visibility
1. **BullMQ UI**
   - Deploy Bull Board or Arena for support engineers
   - Restrict access (basic auth or VPN)

2. **Worker Monitoring**
   - Surface worker heartbeat (`/api/worker/start`) in dashboard
   - Alert on worker down, queue waiting > threshold, retries > 0

## Phase 4 – Security Controls
1. **Edge Protection**
   - Front app with Cloudflare or AWS WAF + rate limiting
   - Ensure TLS, HSTS, and security headers configured

2. **Dependency & Image Scanning**
   - Enable Dependabot/Snyk for npm vulnerabilities
   - Add Trivy/Grype scanning in CI for Docker images

3. **SIEM Integration (optional)**
   - Pipe normalized logs (auth events, admin actions) into SIEM (Panther, Splunk, Datadog Security Monitor)

## Phase 5 – Dashboards & Alerts
1. **Dashboards**
   - Chat SLA (time to first response, fallback usage)
   - Queue metrics (waiting, failed, active jobs)
   - Chatwoot API latency & error rate
   - Worker uptime, Redis health
   - Error rate & SLO compliance

2. **Alerts**
   - SLA breach: >5s 95th percentile response time
   - Queue backlog threshold
   - Chatwoot 5xx rate, webhook failures
   - Security events (audit log missing, secrets missing)

## Deliverables
- Datadog (or equivalent) dashboards + alert configs
- Sentry projects for web + worker
- Updated health endpoint with real security signals
- BullMQ dashboard URL & auth
- Documentation in `docs/runbooks/`

## References
- Datadog Node.js APM docs
- Sentry Next.js + BullMQ guides
- Chatwoot Audit Log setup
- AWS Secrets Manager best practices
- Bull Board/Arena deployments
