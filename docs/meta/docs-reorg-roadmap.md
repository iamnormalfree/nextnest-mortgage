---
title: docs-reorg-roadmap
owner: docs-wg (product, design, ops)
status: in-progress
last-reviewed: 2025-09-28
---

# Docs Reorg Roadmap

## Why this exists
- Preserve the consolidation strategy we outlined while we were mapping the repo.
- Give the two-terminal implementation workflow a single source of truth for documentation moves, feature checkpoints, and approvals.

## Current workflows snapshot
- Implementation uses a two-terminal flow: Terminal A runs implementation plans, Terminal B validates (junior dev checks first, then final review).
- Recent feature focus: mobile Broker UI updates are underway; desktop Broker UI now follows the sophisticated flow version but still needs end-to-end QA.
- ChatOps gap: Broker assignment to Chatwoot at `chat.nextnest.sg` is not configured, so the LLM broker hand-off still feels synthetic.

## Current state observations
- Root still holds 30+ markdown files (plans, reports, guides) alongside folders such as `AI_Broker/`, `Campaigns/`, `Session_Context/`, `Remap/`, `Testing/`, and `Tech-Team/` that function as documentation silos.
- `docs/` currently contains only `design/`, `evaluations/`, `plans/`, `runbooks/`, and `overview.md`; there is no `meta/`, `reports/`, or `_templates/` structure yet.
- `docs/overview.md` links back to several root-level runbooks and plans, forcing contributors to jump between the curated tree and the legacy markdown in the root.

## Target single-source architecture
- Keep the repository root lightweight: `README.md` for onboarding plus a short pointer into `docs/`.
- Build out the five core buckets: `docs/meta/`, `docs/plans/{active,archive,backlog}/`, `docs/runbooks/<domain>/`, `docs/design/`, `docs/evaluations/`, and `docs/reports/`.
- Add `docs/_templates/` for plan, runbook, and report scaffolds complete with metadata blocks (status, owner, last-reviewed).
- Normalize file naming to lowercase kebab-case with date or scope prefixes where useful (e.g. `2025-09-28-launch-deduplication.md`).
- Embed explicit ownership assignments so doc reviews can be routed to the right domain leads.

## Migration playbook
- [ ] Secure agreement on the folder taxonomy and naming conventions with product, design, ops, and engineering leads.
- [ ] Tag every root-level markdown file with its target category + status, then move or rename it in a single refactor PR.
- [ ] While moving, add/update metadata blocks (`status`, `owner`, `last-reviewed`) to each document.
- [ ] Refresh `docs/overview.md` and any `docs/*/README.md` files to point exclusively to the new locations; remove stale aliases.
- [ ] Drop short "Moved to" stubs or internal wiki redirects for externally linked files until external references are updated.
- [ ] Follow up with CI/automation: fail builds when new Markdown lands outside `docs/`, and enforce doc updates tied to feature routes.

## Root-level docs to relocate
- Plans/guides: `APPLY_PRODUCTION_READINESS_PLAN.md`, `BROKER_UI_REINTEGRATION_PLAN.md`, `MASTER_IMPLEMENTATION_PLAN.md`, `MOBILE_OPTIMIZATION_PLAN.md`, `PRODUCTION_READINESS_CHECKLIST.md`.
- Runbooks/operations: `CHATWOOT_SETUP_GUIDE.md`, `BROKER_CHAT_ALIGNMENT_PLAN.md`, `PRODUCTION_DEPLOYMENT_GUIDE.md`.
- Reports/analyses: `HOMEPAGE_ISSUE_ROOT_CAUSE_ANALYSIS.md`, `FIX_TASKS_COMPLETION_REPORT.md`, `test-deduplication-output.md`.
- Meta/dashboards: `CURRENT_STATE_REPORT.md`, `EXECUTION_NOTES.md`, `ORGANIZATION_COMPLETE.md`.
- Folders needing placement: `AI_Broker/`, `Campaigns/`, `Intelligent_Lead_Form/`, `Session_Context/`, `Remap/`, `Tech-Team/`, `Techteam-Roundtable/`, `Testing/` (should split across `docs/`, `scripts/`, `validation-reports/`).

## Outstanding product integration work
- [ ] Validate the mobile Broker UI responsive fixes against the latest design tokens.
- [ ] Complete QA on the desktop sophisticated flow; ensure documentation in `components/features/broker` (or equivalent) references the governing plan.
- [ ] Configure Broker assignment into Chatwoot at `chat.nextnest.sg` so LLM interactions reflect human hand-offs.
- [ ] Align the AI broker chat behaviour with the intended "human-like" experience once Chatwoot integration is wired.

## Implementation flow checkpoints
- Terminal A (implementation): follow plan checklist, capture progress notes here, and update relevant `docs/plans/` entries.
- Slash commands (for example `/response-awareness`) coordinate Claude sub-agents via `.claude/commands` and `.claude/agents`, keeping orchestration logic out of source files.
- Terminal B (validation): junior developer performs first pass, records findings; lead reviewer signs off and logs status in `docs/meta/current-state-report.md` after consolidation.
- Ensure any feature change touching `app/` routes updates the corresponding `docs/plans/` entry, component README, and `lib/` domain logic summary.

## Next review window
- Schedule a docs owners sync once the taxonomy draft is circulated.
- Use the sync to assign owners per folder (`frontend`, `ai-broker`, `ops`) and to commit to a monthly docs scrub.

## Changelog
- 2025-09-28: Initial capture of the consolidation strategy, workflow notes, and outstanding Broker UI + Chatwoot tasks.
