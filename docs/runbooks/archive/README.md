# 📁 Archived Runbooks

This directory contains legacy documentation that has been superseded by consolidated guides.

## Why Archive?

**Previous state**: 35+ runbook files with 60% content overlap
**Current state**: 18 canonical runbooks with <20% overlap
**Improvement**: 38% fewer files to maintain

## Archive Structure

### `/chatwoot/` - Chatwoot Integration Legacy Docs

Files that were consolidated into `docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md`:

- ✅ `ai-setup-partial.md` - AI configuration (now Part 3 of complete guide)
- ✅ `deployment-partial.md` - Platform deployment (now Part 1 of complete guide)
- ✅ `n8n-setup-partial.md` - n8n integration (now Part 4 of complete guide)
- ✅ `chatwoot-setup-guide-legacy.md` - Operational setup (archived 2025-10-01)
- ✅ `n8n-chatwoot-ai-workflow-legacy.md` - Workflow details (archived 2025-10-01)

**Use instead**: `docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md` (1166 lines, comprehensive)

---

### `/ai-broker/` - AI Broker System Legacy Docs

Files that were consolidated into `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`:

- ✅ `persona-partial.md` - Persona system architecture
- ✅ `setup-partial.md` - Implementation guide
- ✅ `flow-partial.md` - User flow documentation

**Use instead**: `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` (comprehensive)

---

### `/` - General Legacy Documentation

- ✅ `DEPLOYMENT_GUIDE_LEGACY.md` - Superseded by `docs/runbooks/devops/production-deployment-guide.md`
- ✅ `tech-stack-verbose.md` - Superseded by `docs/runbooks/TECH_STACK_GUIDE.md`

---

## Canonical Documentation (Always Use These)

### Core Guides
- **Tech Stack**: [`docs/runbooks/TECH_STACK_GUIDE.md`](../TECH_STACK_GUIDE.md)
- **Forms Architecture**: [`docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`](../FORMS_ARCHITECTURE_GUIDE.md)

### Chatwoot Integration
- **Complete Setup**: [`docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md`](../chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md)
- **Troubleshooting**: [`docs/runbooks/CHATWOOT_SELF_HOSTED_TROUBLESHOOTING.md`](../CHATWOOT_SELF_HOSTED_TROUBLESHOOTING.md)

### AI Broker System
- **Complete Guide**: [`docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`](../AI_BROKER_COMPLETE_GUIDE.md)
- **Broker Profiles**: [`docs/runbooks/ai-brokers-profiles.md`](../ai-brokers-profiles.md)

### Deployment & Operations
- **Production Deployment**: [`docs/runbooks/devops/production-deployment-guide.md`](../devops/production-deployment-guide.md)
- **Readiness Checklist**: [`docs/runbooks/devops/production-readiness-checklist.md`](../devops/production-readiness-checklist.md)
- **Environment Variables**: [`docs/runbooks/devops/deployment-env-variables.md`](../devops/deployment-env-variables.md)

---

## Archive Policy

**When we archive**:
- Multiple docs covering same topic
- Content merged into comprehensive guide
- Documentation contradicts current codebase

**Why we keep archives**:
- Historical reference
- Recovery if consolidation missed details
- Understanding evolution of architecture

**Retention**: Archives kept indefinitely with deprecation notices

---

**Last Updated**: 2025-10-01
**Consolidation Audit**: See `docs/completion_drive_plans/runbooks_analysis.md` for full details
