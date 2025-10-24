ABOUTME: Programmatic SEO rhizome strategy integrating scenario data, lateral content, and GEO.
ABOUTME: Defines pillars, templates, automation, and validation loops for PSEO.

# Programmatic SEO & Rhizome Content System (Part 06)

---
title: "Programmatic SEO & Rhizome Content System"
status: draft
owner: growth
created: 2025-10-22
references:
  - docs/strategy_integration/rhizome-pseo.md
  - docs/plans/re-strategy/Part03-scenario-database-system.md
  - docs/plans/re-strategy/Part04-brand-ux-canon.md
  - docs/plans/re-strategy/Part05-client-controlled-contact.md
---

## 0. Purpose & Prerequisites

Build a “content rhizome” that drives organic lead acquisition, establishes informational gravity, and feeds scenario-based personalization. The plan assumes:

- Engineer can run `npm install` and Node 18.x; use `npm run dev` for preview. 
- Content lives in `content/` (Markdown/MDX); programmatic pages under `content/generated/` (to be created). 
- Supabase exists per Part 03 (credentials in `.env.local`). 
- Style/copy follow Part 04 brand canon. 
- git: make frequent, scoped commits; follow TDD where feasible.

## 1. Directory & File Overview

| Area | Purpose | Key Files |
|------|---------|-----------|
| Content roots | Static & programmatic content | `content/prime-nodes/`, `content/generated/` |
| Data templates | Define programmatic patterns | `content/templates/` (new) |
| Supabase views | Feed scenario data | `supabase/migrations/` + `lib/db/views` |
| Scripts | Automation (fetch, build) | `scripts/pseo/` (new) |
| Prompts | LLM prompt sets | `prompts/pseo/` (new) |
| Docs | Runbooks + query shaping | `docs/runbooks/content/` |

## 2. Prime Nodes (Tier-1 Content)

Create 5–7 Prime Nodes that anchor the rhizome. For each node:

1. Create MDX file under `content/prime-nodes/<slug>.mdx`.
2. Use frontmatter with `title`, `description`, `tags`, `scenarioIds`.
3. Include: scenario callouts (`<ScenarioCallout id="..." />`), JSON-LD block (export via MDX frontmatter or inline component), and “See also” section linking to lateral content.
4. Target ~5,000 words; split sections using `<Section>` components as needed.

Prime Node topics (minimum 5):
- Singapore Mortgage Scenario Library
- Mortgage Timing & Repricing Playbook
- Eligibility & Compliance Intelligence
- Evidence-Based Follow-Up & Client Care
- Programmatic & Generative Engine Optimization
- Mortgage Calculator & Instant Analysis Architecture
- Optional: Broker Trust & Ethics Framework

**Testing:**
- Run `npm run lint` and `npm run test:mdx` (create if not existing) to ensure MDX compiles.
- Preview via `npm run dev`; confirm navigation links and metadata.

## 3. Programmatic Templates (Vertical Expansion)

### 3.1 Template Definitions
- Create `content/templates/` with JSON files (e.g., `calculator.template.json`, `best-rate.template.json`).
- Structure: 
```json
{
  "slugPattern": "scenarios/[persona]/calculator",
  "layout": "CalculatorPage",
  "fields": {
    "headline": "string",
    "intro": "markdown",
    "dataSource": "supabaseView",
    "cta": "string"
  }
}
```
- Document each template in `docs/runbooks/content/template-library.md`.

### 3.2 Data Feed
- Supabase view `scenario_content_feed` returning necessary fields (scenario ID, persona, rates, savings). Migration file: `supabase/migrations/20251022_scenario_content_feed.sql`.
- Access helper in `lib/db/views/scenarioContentFeed.ts` with typed interface.

### 3.3 Generation Pipeline
- Create `scripts/pseo/generate-programmatic.ts`: 
  1. Load templates from `content/templates/`. 
  2. Fetch data from Supabase.
  3. Fill template with data using AI helper (Claude/Codex) or deterministic string builder.
  4. Output MDX to `content/generated/<slug>.mdx` (create directories as needed).
- Provide CLI usage: `npm run pseo:generate -- --template calculator --limit 10`.

### 3.4 Guardrails & QA
- Add tests `tests/pseo/generate-programmatic.test.ts` verifying output MDX includes required sections and frontmatter.
- Add Markdown lint command (e.g., `npm run lint:content`).

### 3.5 Cadence Targets
- Stage 0: Handcraft 20 pages (no automation) to validate design. 
- Stage 1–2: Use pipeline to produce ~50/month.

## 4. Lateral Content (Surprise Nodes)

### 4.1 Ideation Workflow
- Store prompts in `prompts/pseo/lateral-ideation.md`. Example prompt includes Prime Node summary and scenario tags.
- Use Firecrawl/keyword API to fetch trending questions; feed into LLM prompt.
- Maintain backlog in `content/backlog/lateral-ideas.json` with priority score and assigned Prime Node.

### 4.2 Creation
- For each lateral topic: 
  1. Generate outline via `scripts/pseo/outline-lateral.ts` (optional). 
  2. Draft article (human or AI-assisted) in `content/lateral/<slug>.mdx`. 
  3. Include references to at least two Prime Nodes and relevant scenarios.

### 4.3 QA
- Review for brand tone (Part 04), ensure canonical links. 
- Add to `docs/runbooks/content/pseo-rhizome-playbook.md` under weekly tasks.

## 5. Signal Amplification

- Add structured data helpers (`components/seo/JsonLd.tsx`). 
- Create `scripts/pseo/publish-data-library.ts` to export Supabase scenario snapshots to CSV/JSON in `/public/data/`.
- Generate 90-sec Looms; embed via `<VideoEmbed>` component.
- Document outreach targets in `docs/runbooks/content/signal-amplification.md`.

## 6. Query Shaping & Monitoring

- Create `scripts/pseo/query-monitor.ts`:
  - Use Firecrawl or SGE API to fetch answer snapshots for key queries.
  - Store result in `analytics/query-monitor/DATE.json`.
  - Add failing queries to backlog.
- Run weekly via cron/GitHub Action.
- Document triage process in `docs/runbooks/content/query-shaping.md`.

## 7. Publishing Integration

- Update Next.js routes: create `[...slug].tsx` under `app/(content)/` to render MDX from `content/` directories.
- Implement ISR revalidation: update `next.config.js` with `revalidate` values for programmatic paths.
- Add sitemap updates (`scripts/pseo/update-sitemap.ts`).
- Ensure environment variables for Firecrawl/Serp API stored in `.env.local` with documentation in `docs/runbooks/devops/deployment-env-variables.md`.

## 8. Testing & CI

- Extend `package.json` scripts:
  - `pseo:generate`
  - `pseo:lint` (markdown + frontmatter)
  - `pseo:test`
- Update CI pipeline (GitHub Actions) to run new scripts.
- Add snapshot tests for schema markup using Jest or Playwright.

## 9. Stage Plan (Execution Tasks)

### Stage 0 – Foundation
1. Create directory scaffolding (`content/prime-nodes`, `content/templates`, `content/generated`, `prompts/pseo`, `scripts/pseo`).
2. Draft 5 Prime Nodes with full metadata.
3. Define at least 3 template JSON files and document in runbook.
4. Create Supabase view + migration for `scenario_content_feed`.
5. Set up Firecrawl/keyword API integration and document in `docs/runbooks/content/pseo-setup.md`.
6. Seed backlog JSON with ≥20 programmatic + 20 lateral ideas.

### Stage 1 – Controlled Rollout
1. Implement generation script + tests; produce first 10 programmatic MDX files (manual QA).
2. Publish 5 lateral articles; link to Prime Nodes.
3. Deploy query monitor script; capture baseline snapshots.
4. Build dashboards (e.g., Supabase + Grafana or Next.js page) tracking traffic & scenario conversions.

### Stage 2 – Scale
1. Automate monthly generation (batch job with scheduling). 
2. Launch data library + newsletter updates. 
3. Integrate nurture automation (Part 05) to notify leads when relevant pages publish. 
4. Expand to localized GEO variants (if needed).

## 10. Documentation

- Add/Update:
  - `docs/runbooks/content/pseo-rhizome-playbook.md` – daily/weekly tasks.
  - `docs/runbooks/content/template-library.md` – template definitions and required fields.
  - `docs/runbooks/content/query-shaping.md` – monitoring + remediation workflow.
  - `docs/runbooks/content/pseo-setup.md` – API keys, Firecrawl config.
  - Update `docs/runbooks/brand/messaging.md` to reference Prime Nodes.

## 11. Backlog Seed Tasks

- CAN-020: Update site copy to new messaging.
- CAN-021/022: CTA restyle + typography cleanup (needed before mass content). 
- CAN-023: Integrate Firecrawl/MCP keyword pipeline. 
- Add new tickets:
  - Generate Prime Node outlines. 
  - Supabase content feed migration. 
  - Build generation script + tests. 
  - Implement query monitor script. 
  - Create data library automation.
