# Repository Guidelines

## Project Structure & Module Organization
Next.js routes live in `app/` with feature groups such as `app/apply`, `app/calculators`, and `app/chat`; `layout.tsx` and `globals.css` define shared chrome. UI building blocks sit in `components/` (feature subfolders plus shared `components/ui/`). Domain logic and integrations stay in `lib/`, organized by capability (AI, calculations, security, db). Custom React hooks belong in `hooks/`. Runtime assets live under `public/`, while brand and campaign collateral are in `assets/`. Operational playbooks and scripts reside in `Docs/` and `scripts/`; validation history is tracked in `validation-reports/`.

## Build, Test, and Development Commands
- `npm run dev` – launch the local Next.js server with hot reload on http://localhost:3000.
- `npm run build` – create the production build; ensure it passes before any deployment.
- `npm run start` – serve the compiled build locally to mirror production.
- `npm run lint` – enforce TypeScript/Next.js lint rules and import hygiene.
- `npm run lint:brand` – run `scripts/brand-lint.js` to safeguard naming, palette, and copy rules.
- `npm run lint:all` – chain both lint passes; required before opening a PR.
- `npm run validate-context` – sanity-check AI and automation context files before edits.
- `npm run pre-implement` – run validation plus readiness messaging ahead of large changes.

## Coding Style & Naming Conventions
Adopt TypeScript throughout. Components and exported hooks use `PascalCase`; helpers use `camelCase`. Prefer server components unless client state or effects require `'use client'`. Keep 2-space indentation and single quotes (ESLint will enforce). Compose styles with Tailwind utility classes and reuse shadcn primitives in `components/ui/`; avoid ad-hoc hex colors to stay within brand tokens checked by `scripts/brand-lint.js`.

## Testing & Validation
Automated unit tests are still in flight; linting plus scripted validations are the current gates. When adding tests, co-locate them near the feature (e.g., future calculator specs in `lib/calculations/__tests__`) and name files `*.test.ts`. Record manual test notes or workflow outcomes in `validation-reports/` using timestamped Markdown. For forms and chat flows, run the dedicated scripts in `scripts/` (e.g., conversation health checks) and document results.

## Commit & Pull Request Guidelines
Follow conventional commit prefixes (`feat`, `fix`, `chore`, or scoped variants like `feat(task-3)`) with subjects under 72 characters. Each PR should link related issues or Notion/Jira tasks, summarize affected routes/modules, list local commands run (`npm run lint:all`), and attach before/after screenshots for UI updates. Request review from domain owners (AI, calculators, compliance) when touching their modules.
