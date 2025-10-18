# NextNest Current State Report

_Last updated: 2025-09-30 11:05_

## Repository Snapshot
- Landing experience tightened for mobile with consistent CTA routing into the funnel (`components/HeroSection.tsx`, `components/StatsSection.tsx`, `components/FeatureCards.tsx`, `components/ServicesSection.tsx`).
- `/apply` now hosts the progressive and commercial flows via dynamic imports, persisting session data and AI insights through `useLoanApplicationContext` (`app/apply/page.tsx`, `lib/hooks/useLoanApplicationContext.tsx`).
- AI analysis pipeline active: `POST /api/forms/analyze` orchestrates multi-agent scoring; feature flags gate the responsive broker shell served by `/apply/insights` and `/chat` (`app/api/forms/analyze/route.ts`, `components/ai-broker/ResponsiveBrokerShell.tsx`, `app/apply/insights/InsightsPageClient.tsx`, `app/chat/page.tsx`).
- Chatwoot integration normalizes roles and posts activity messages via the `/activities` endpoint with fallback to `/messages`, preserving custom attributes (`app/api/chat/messages/route.ts`, `lib/integrations/chatwoot-client.ts`).
- Repository lacks updated onboarding docs—the root `README.md` still describes the pre-AI build, so contributors miss the current funnel and chat flows.

## Plan Inventory

### In Progress / Needs Follow-up
- `Docs/mobile-ai-broker-ui-rebuild-plan.md` – Phase work underway; mobile shell live behind `FEATURE_FLAGS.MOBILE_AI_BROKER_UI`.
- `Docs/mobile-loan-form-optimization.md` – Core tasks landed; follow-up issues noted for overflow and alert alignment.
- `Docs/FORM_COMPACT_MODE_AND_APPLY_PAGE_TASKLIST.md` – Implementation largely complete but checklist/lint confirmations remain unchecked.
- `Docs/Broker_System_Message_Plan.md` – Code changes shipped; ensure step 5 (documentation updates) is finalized.

### Complete / Keep as Runbooks
- `Docs/AI_BROKER_IMPLEMENTATION_PLAN.md`
- `Docs/MOBILE_ALIGNMENT_IMPLEMENTATION_PLAN.md`
- `Docs/mobile-ui-alignment-plan.md`
- `Docs/MOBILE_ALIGNMENT_IMPLEMENTATION_PLAN.md`
- `Docs/PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK.md`
- `Docs/FORM_COMPACT_MODE_AND_APPLY_PAGE_TASKLIST.md` (layout guidance now in code)
- `Docs/PROGRESSIVE_FORM_TO_BROKER_UI_IMPLEMENTATION.md`
- `Docs/CHAT_AND_LEAD_FORM_UX_TASKLIST.md`
- `Docs/mobile-loan-form-optimization.md` (retain for reference even with open issues)

### Superseded / Archive Candidates
- `MASTER_IMPLEMENTATION_PLAN.md`
- `MOBILE_OPTIMIZATION_PLAN.md`
- `MCP_Satellite_Implementation_Plan/MCP_IMPLEMENTATION_PLAN.md`
- `Archive/Planning_Docs/revised-implementation-plan.md`
- `AI_Broker/IMPLEMENTATION_PLAN.md`
- `AI_Broker/FORM_TO_CHAT_IMPLEMENTATION_PLAN.md`
- `AI_Broker/CHATWOOT_IMPLEMENTATION_PLAN.md`
- `Remap/UX_IMPROVEMENT_IMPLEMENTATION_PLAN.md`
- `remap-ux/UX_IMPROVEMENT_IMPLEMENTATION_PLAN.md`
- `remap-ux/RECONCILIATION_PLAN.md`
- `redesign/IMPLEMENTATION_PLAN.md`
- `redesign/IMPLEMENTATION-PLAN-TAILWIND-SHADCN.md`
- `redesign/CLEAN_BROKER_UI_IMPLEMENTATION_PLAN.md`
- `Archive/Phase1_Completed/AI_INTELLIGENT_LEAD_FORM_IMPLEMENTATION_PLAN.md`

## Reorganization Recommendations
- Group documents under `Docs/plans/{active, archive}` and relocate legacy directories (`AI_Broker`, `Remap`, `remap-ux`, `MCP_Satellite_Implementation_Plan`, root `*_PLAN.md`) into the archive bucket with dated subfolders.
- Maintain an index file (e.g., `Docs/plans/STATUS.md`) summarizing owner, last update, and status to reduce re-reading large plans.
- Split `Docs/` into logical areas: `plans/`, `runbooks/`, and `evaluations/` (move validation notes like `validation-reports/loan-form-mobile.md` alongside evaluations).
- Refresh `README.md` (and optionally add `Docs/overview.md`) to explain the AI-enabled funnel, key routes, environment variables, and feature flag behaviour.
- Document required Chatwoot environment variables in `.env.example` and replace hard-coded defaults in `lib/integrations/chatwoot-client.ts` before production rollout.

## Next Steps (Suggested)
1. Close or update in-progress plans (check off validation, add results).
2. Execute the doc reorganization above and update internal links (completed in repo – ensure external references are refreshed).
3. Update onboarding docs and provide environment setup instructions.\n4. Update internal dashboards/Notion/Confluence links to the new docs paths (plans, runbooks, reports).
4. Schedule regression on `/apply` and `/chat` once mobile broker UI is enabled in production.
5. Consolidate experimental routes under a `/playground` area or remove unused ones.

---

## Collaboration Notes (fill in before next sprint)

### A. Desired Outcome
_Your notes here_

### B. Mandatory Deliverables
_Your notes here_

### C. Nice-to-Haves / Stretch Goals
_Your notes here_

### D. Constraints or Approvals
_Your notes here_

### E. References to Review
_Your notes here_

### F. Testing Expectations
_Your notes here_

### G. Open Questions for the Team
_Your notes here_

### H. Additional Notes
_Your notes here_


