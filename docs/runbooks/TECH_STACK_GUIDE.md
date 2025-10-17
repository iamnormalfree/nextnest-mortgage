# NextNest Tech Stack Guide

_Last reviewed: 2025-09-28_

## Purpose
- Onboard engineers and partner teams to the current platform baseline.
- Capture the target direction for design, documentation, and chat operations so delivery work lines up with the reorg roadmap.

## Current State Snapshot
- **Web app** runs on Next.js 14.2 (App Router) with React 18 and TypeScript 5.6.
- **Design system** is Tailwind + shadcn/ui with brand tokens stored under `lib/design-tokens`; Bloomberg design tokens (ink, gold, charcoal, etc.) are merged into tailwind.config.ts.
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

---

## Engineering Decision Frameworks

### GEO-First Philosophy

**Core Principles:**
- **Stay Lean**: Keep Next.js but evaluate all dependencies before adding
- **GEO-First**: Optimize for AI citation and Generative Engine Optimization
- **Performance Priority**: Maintain fast site speed (~140KB gzipped target)
- **Progressive Enhancement**: Build core functionality without JavaScript, enhance with JS
- **SSR Strategy**: Server-render marketing/SEO pages, use client islands for interactivity

**Decision Framework:**
Before adding any dependency or feature, ask:
1. **Does this improve GEO/SEO?**
2. **Is this essential for user functionality?**
3. **Can we build this with existing tools?**
4. **What's the bundle size impact?**

**Architecture Strategy:**
- **Marketing Pages**: SSR for AI crawlers and search engines
- **Dashboard**: Hybrid SSR shell + interactive islands
- **Calculators**: Server-rendered initial state + client interactivity
- **Programmatic Content**: Generate location/loan-type combinations for SEO
- **External APIs**: Add only when user dashboards are ready

### Dependency Decision Framework

#### When to Use Progressive Enhancement

**✅ USE FOR:**
1. Calculators (work without JS for SEO)
2. Forms (accessibility requirement)
3. Search (basic GET params work everywhere)
4. File uploads (fallback for all devices)

**❌ DON'T USE FOR:**
1. Real-time chat (requires JS)
2. Complex animations (JS-only features)
3. Client-only features (like drawing tools)

#### When to Use Micro-Frameworks

**✅ USE WHEN:**
1. You have repetitive code patterns
2. Need focused functionality (validation, dates, HTTP)
3. Want to avoid reinventing the wheel
4. Bundle size is still small

**❌ AVOID WHEN:**
1. You can write it in 5-10 lines yourself
2. Only using 1-2 functions from large library
3. Adds complexity without clear benefit

#### For NextNest Mortgage Platform - Recommended

**✅ Approved Dependencies:**
- Zod (form validation)
- clsx (conditional CSS)
- date-fns (mortgage date calculations)

**❌ Skip These:**
- React Query (overkill for simple data needs)
- Zustand/Redux (no complex state management needed)
- Framer Motion (animations aren't priority)
- Heavy component libraries (Tailwind is enough)
- lodash, ramda, moment.js (too heavy)

### Design System Specifications

**Color Palette:**
```css
Primary Blue: #4A90E2 (primary-500)
Dark Blue: #3A80D2 (primary-600)
Dark Navy: #0D1B2A (dark-900)
Light Background: #FAF9F8 (light-50)
```

**Typography:**
- **Headings**: Gilda Display (serif)
- **Body Text**: Inter (sans-serif)
- **Responsive sizing**: Tailwind's text-* classes

**Layout Patterns:**
- **Container**: `container mx-auto px-4 sm:px-6 lg:px-8`
- **Cards**: `bg-white rounded-xl shadow-lg border`
- **Buttons**: `bg-[#4A90E2] hover:bg-[#3A80D2] text-white`

### Progressive Enhancement Pattern

1. **Level 1**: Works without JavaScript (form submissions via GET params)
2. **Level 2**: JavaScript enhancement for real-time calculations
3. **Level 3**: Advanced features (charts, comparisons)

### Bundle Size Management

- **Target**: Maintain <140KB gzipped for marketing pages
- **Strategy**: Code splitting between marketing and dashboard routes
- **Monitoring**: Use `@next/bundle-analyzer` for tracking

### Troubleshooting & Development Tips

**Common Issues:**
1. **Build Errors**: Check TypeScript types and imports
2. **Styling Issues**: Verify Tailwind class names and configuration
3. **API Errors**: Check route.ts file structure and exports
4. **Form Issues**: Verify React Hook Form setup and validation

**Development Tips:**
- Use browser dev tools for debugging
- Check console for errors and warnings
- Use TypeScript for better error catching
- Test responsive design on multiple screen sizes
- Validate forms thoroughly before submission

---

**Last reviewed:** 2025-10-17

## Roadmap / Outstanding Tasks
1. Finalise docs reorg (move root markdown into `docs/` buckets, add `_templates/`).
2. Finish broker assignment + human-like LLM cues for Chatwoot at `chat.nextnest.sg`.
3. Polish mobile Broker UI QA and align with latest design tokens.
4. Stand up CI checks for bundle budgets, lint:brand enforcement, and doc-location guardrails.
5. Migrate sandbox routes (`app/test-*`) into a dedicated `experiments/` tree once the docs PR merges.

