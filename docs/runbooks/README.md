# Runbooks Index

_Last updated: 2025-10-01_

Each runbook includes front matter describing owner and review cadence. Use /response-awareness if a runbook needs a major rewrite.

## Active Documents

| Domain | Documents | Owner |
|--------|-----------|-------|
| automation | - [README](runbooks/automation/phase-2-n8n-workflow/README.md)<br>- [implementation-guide](runbooks/automation/phase-2-n8n-workflow/01_Documentation/implementation-guide.md)<br>- [INTEGRATION_REQUIREMENTS](runbooks/automation/phase-2-n8n-workflow/01_Documentation/INTEGRATION_REQUIREMENTS.md)<br>- [N8N_WEBHOOK_TESTING_GUIDE](runbooks/automation/phase-2-n8n-workflow/01_Documentation/N8N_WEBHOOK_TESTING_GUIDE.md)<br>- [N8N_WORKFLOW_MODIFICATIONS](runbooks/automation/phase-2-n8n-workflow/01_Documentation/N8N_WORKFLOW_MODIFICATIONS.md)<br>- [PHASE_2_N8N_ACTUAL_WORKFLOW](runbooks/automation/phase-2-n8n-workflow/02_Workflow_Config/PHASE_2_N8N_ACTUAL_WORKFLOW.md)<br>- [PHASE_2_N8N_WORKFLOW_IDEATED](runbooks/automation/phase-2-n8n-workflow/02_Workflow_Config/PHASE_2_N8N_WORKFLOW_IDEATED.md)<br>- [PHASE_2_N8N_WORKFLOW_PROMPT_FINAL](runbooks/automation/phase-2-n8n-workflow/02_Workflow_Config/PHASE_2_N8N_WORKFLOW_PROMPT_FINAL.md)<br>- [g3-test-expected-results](runbooks/automation/phase-2-n8n-workflow/04_Testing/g3-test-expected-results.md)<br>- [EXCEL_365_N8N_SETUP](runbooks/automation/phase-2-n8n-workflow/05_Integration/EXCEL_365_N8N_SETUP.md) | Ops Lead |
| chatops | - [CHATWOOT_COMPLETE_SETUP_GUIDE](runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md) **[Canonical]** | AI/Chat Lead |
| devops | - [production-deployment-guide](runbooks/devops/production-deployment-guide.md)<br>- [deployment-env-variables](runbooks/devops/deployment-env-variables.md)<br>- [production-readiness-checklist](runbooks/devops/production-readiness-checklist.md) | Ops Lead |
| forms | - [form-refactor-guide](runbooks/forms/form-refactor-guide.md) | Frontend Lead |
| operations | - [roundtable-execution-guide](runbooks/operations/roundtable-execution-guide.md) | Operations |
| root | - [AI_BROKER_COMPLETE_GUIDE](runbooks/AI_BROKER_COMPLETE_GUIDE.md) **[Canonical]**<br>- [TECH_STACK_GUIDE](runbooks/TECH_STACK_GUIDE.md) **[Canonical]**<br>- [ai-brokers-profiles](runbooks/ai-brokers-profiles.md)<br>- [brand-messaging](runbooks/brand-messaging.md)<br>- [CHATWOOT_SELF_HOSTED_TROUBLESHOOTING](runbooks/CHATWOOT_SELF_HOSTED_TROUBLESHOOTING.md)<br>- [CHAT_AND_LEAD_FORM_UX_TASKLIST](runbooks/CHAT_AND_LEAD_FORM_UX_TASKLIST.md)<br>- [FORMS_ARCHITECTURE_GUIDE](runbooks/FORMS_ARCHITECTURE_GUIDE.md)<br>- [Founder_Ops_Guide](runbooks/Founder_Ops_Guide.md)<br>- [master-copywriting-guide](runbooks/master-copywriting-guide.md)<br>- [nextnest-visual-identity](runbooks/nextnest-visual-identity.md)<br>- [PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK](runbooks/PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK.md)<br>- [README](runbooks/README.md) | Shared |

---

## Archive

Superseded and outdated documentation is stored in `archive/` subdirectories with deprecation notices.

### Deprecated Documents (Pre-Modern Stack)
- **[DEPLOYMENT_GUIDE_LEGACY.md](runbooks/archive/DEPLOYMENT_GUIDE_LEGACY.md)** - Outdated deployment guide (pre-Chatwoot/Supabase era)
  - Replaced by: [production-deployment-guide.md](runbooks/devops/production-deployment-guide.md)
  - Archived: 2025-10-01
  - Reason: References non-existent files (railway.toml, Procfile), missing modern stack

### Superseded Documents (Verbose → Concise)
- **[tech-stack-verbose.md](runbooks/archive/tech-stack-verbose.md)** - Verbose tech stack guide
  - Replaced by: [TECH_STACK_GUIDE.md](runbooks/TECH_STACK_GUIDE.md)
  - Archived: 2025-10-01
  - Reason: TECH_STACK_GUIDE.md is the canonical reference (last reviewed 2025-09-28)

### Merged Documents (Chatwoot)
- **[deployment-partial.md](runbooks/archive/chatwoot/deployment-partial.md)** - Chatwoot deployment (partial)
- **[ai-setup-partial.md](runbooks/archive/chatwoot/ai-setup-partial.md)** - Chatwoot AI setup (partial)
- **[n8n-setup-partial.md](runbooks/archive/chatwoot/n8n-setup-partial.md)** - n8n Chatwoot setup (partial)
- **[chatwoot-setup-guide-legacy.md](runbooks/archive/chatwoot/chatwoot-setup-guide-legacy.md)** - Operational setup guide (legacy)
- **[n8n-chatwoot-ai-workflow-legacy.md](runbooks/archive/chatwoot/n8n-chatwoot-ai-workflow-legacy.md)** - n8n workflow details (legacy)
  - All replaced by: [CHATWOOT_COMPLETE_SETUP_GUIDE.md](runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md)
  - Archived: 2025-10-01
  - Reason: Consolidated to reduce overlap and improve maintainability

### Merged Documents (AI Broker)
- **[persona-partial.md](runbooks/archive/ai-broker/persona-partial.md)** - AI Broker persona system (partial)
- **[setup-partial.md](runbooks/archive/ai-broker/setup-partial.md)** - AI Broker setup guide (partial)
- **[flow-partial.md](runbooks/archive/ai-broker/flow-partial.md)** - Complete AI Broker flow (partial)
  - All replaced by: [AI_BROKER_COMPLETE_GUIDE.md](runbooks/AI_BROKER_COMPLETE_GUIDE.md)
  - Archived: 2025-10-01
  - Reason: Consolidated to reduce overlap and improve maintainability
