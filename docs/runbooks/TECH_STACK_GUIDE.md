# NextNest Tech Stack Guide

_Last reviewed: 2025-09-28_

## Purpose
- Onboard engineers and partner teams to the current platform baseline.
- Capture the target direction for design, documentation, and chat operations so delivery work lines up with the reorg roadmap.

## Current State Snapshot
- **Web app** runs on Next.js 14.2 (App Router) with React 18 and TypeScript 5.6.
- **Design system** is Tailwind + shadcn/ui with brand tokens stored under `lib/design-tokens`; Bloomberg theme work lives alongside production tokens via `tailwind.bloomberg.config.ts`.
- **Forms** use React Hook Form + Zod with progressive multi-step shells under `components/forms/` and orchestration logic in `lib/forms/`.
- **Chat surface** at `chat.nextnest.sg` is backed by Chatwoot; AI brokers run through OpenAI with hand-off automation via `lib/integrations/chatwoot-client.ts` and n8n workflows.
- **Data layer** relies on Supabase (lead storage + event logging) and Langfuse for LLM traceability.

## Core Platform
### Framework & Runtime
- Next.js (App Router) with server components preferred; client components gated by `'use client'` and kept thin.
- Node 20+ runtime expected in all environments; local development managed through `npm run dev`.
- TypeScript strict mode enforced (see `tsconfig.json`).

### Build & Tooling
- ESLint + Next linting (`npm run lint`) and brand lint (`npm run lint:brand`) are required gates before merge.
- PostCSS + Tailwind compile our utility classes; design tokens are generated via scripts under `lib/design-tokens`.
- Bundle analysis with `ANALYZE=true npm run build` and the `@next/bundle-analyzer` helper when investigating regressions.
- Docker and Railway configs exist for deployment parity (`Dockerfile`, `docker-compose.yml`, `railway.toml`).

### State & Data Access
- Supabase client split into public and admin helpers (`lib/db/supabase-client.ts`); RLS governs lead data.
- Domain-specific services live in `lib/features/`, `lib/forms/`, `lib/ai/`, and `lib/calculations/` to keep React components lean.
- Event bus + analytics helpers stay under `lib/events/` and `lib/analytics/` for cross-surface telemetry.

## UI & Design System
- Tailwind is the styling backbone; custom tokens (spacing, typography, color ramps) are declared in `lib/design-tokens` and surfaced through Tailwind config extensions.
- shadcn/ui primitives are stored under `components/ui/`; feature compositions are migrating into `components/<domain>/` (e.g. `components/ai-broker`, `components/forms`).
- Responsive targets: mobile-first breakpoints (320px, 375px, 768px) with the new broker flow optimised for 320px+ and re-validated on desktop.
- Upcoming action: complete the component README roll-out so every feature folder references its governing doc in `docs/plans/` or `docs/runbooks/`.

## Application Architecture
```
app/                       # Route groups (apply, calculators, chat, etc.)
  (test-*)                 # Temporary sandboxes to be migrated into /experiments
components/
  ui/                      # shadcn primitives and shared tokens
  ai-broker/, chat/, ...   # Feature composites (to consolidate under components/features/*)
lib/
  ai/, analytics/, ...     # Domain logic, integrations, design tokens, forms
hooks/                      # Cross-feature React hooks
public/, assets/            # Runtime/static assets
scripts/, validation-reports/
```
- Stick to server-first rendering; lift client state into hooks only when interactivity demands.
- All new documentation for these folders should live under `docs/` (see `docs/meta/docs-reorg-roadmap.md`).

## AI & ChatOps Stack
- **Chatwoot** (self-hosted) powers conversations at `chat.nextnest.sg`; queues name brokers and orchestrate hand-offs.
- **OpenAI / Langfuse** handle LLM responses and observability; prompts and guardrails reside in `lib/ai/` and `docs/runbooks/AI_BROKER_PERSONA_SYSTEM.md`.
- **n8n workflows** (see `n8n-workflows/` and `docs/runbooks/N8N_CHATWOOT_AI_WORKFLOW.md`) dispatch automation tasks, broker assignment, and escalation triggers.
- **Current gaps**: automatic broker assignment in production Chatwoot is not wired yet, so LLM replies still appear system-generated; follow the TODOs in `lib/integrations/chatwoot-client.ts` and align with the Chatwoot deployment guides before launch.
- **Next steps**: implement the "virtual human" delay/typing indicators, confirm Chatwoot inbox mapping per broker, and record the decision trail in `docs/meta/current-state-report.md`.

## Data, Analytics & Compliance
- Lead submissions flow through Supabase with validation in `lib/validation/` and deduplication routines in `lib/integrations/conversation-deduplication.ts`.
- Mortgage calculations and financial utilities live in `lib/calculations/` and are consumed by the calculators under `app/calculators/`.
- Compliance surfaces (`app/pdpa`, `app/compliance`) rely on shared copy from `docs/runbooks/brand-messaging.md` and should reference the same tokens.
- Langfuse telemetry is wired for AI conversations; extend coverage to forms before GA.

## Environments & Deployment
- **Local**: `.env.local` seeds Supabase keys and Chatwoot credentials; run `npm run dev` plus `npm run validate-context` when touching AI prompts.
- **Staging/Preview**: Vercel / Railway environments build via `npm run build`; ensure `SUPABASE_SERVICE_KEY` stays off the client bundle.
- **Production**: target infrastructure is self-hosted Chatwoot + Next.js deployment (Railway); Docker images kept in sync with `Dockerfile`.
- Deployment checklist now includes: lint all, build, run chat smoke test against `chat.nextnest.sg`, execute progressive form regression, and document results in `validation-reports/`.

## Monitoring & Alerting
- Error tracking currently manual via logs; action item to wire structured logging in `lib/monitoring/` and forward to the ops dashboard.
- Bundle size and lighthouse checks run ad-hoc; integrate with CI once doc consolidation PR lands.
- Chatwoot conversation health tracked through Langfuse/N8N metrics—expand to include broker response-time SLAs post assignment automation.

## Operational Workflow Notes
- Teams work in a two-terminal flow: Terminal A executes implementation steps, Terminal B handles validation (junior QA first, lead sign-off second).
- Slash commands (for example `/response-awareness`) coordinate Claude sub-agents stored in `.claude/commands` and `.claude/agents`, keeping orchestration logic out of the production codebase.
- Any feature touching `app/` routes must update its corresponding plan/runbook plus component README, per the docs roadmap.
- Monthly docs + tech stack review recommended: owners sweep their sections, demote stale runbooks to archive, and update `last-reviewed` stamps.

## Roadmap / Outstanding Tasks
1. Finalise docs reorg (move root markdown into `docs/` buckets, add `_templates/`).
2. Finish broker assignment + human-like LLM cues for Chatwoot at `chat.nextnest.sg`.
3. Polish mobile Broker UI QA and align with latest design tokens.
4. Stand up CI checks for bundle budgets, lint:brand enforcement, and doc-location guardrails.
5. Migrate sandbox routes (`app/test-*`) into a dedicated `experiments/` tree once the docs PR merges.

