<!-- ABOUTME: Standards for what files and directories are allowed at repository root in NextNest -->
<!-- Extracted from CLAUDE.md 2025-10-19 to improve findability and reduce main file length -->

# Root Directory Guide

This guide defines what files and directories are allowed at the repository root in NextNest. Keeping the root clean and organized improves repository navigation and prevents clutter from accumulating.

> **Reference:** This content is extracted from [CLAUDE.md](../CLAUDE.md) lines 182-229.

---

## Why This Matters

A clean repository root:
- Makes it easier to find important configuration files
- Prevents temporary/debug files from being committed
- Signals project structure clearly to new developers
- Reduces noise in git status and file listings
- Enforces separation of concerns (code vs config vs docs)

---

## Allowed at Repository Root

### Package & Configuration

- `package.json`, `package-lock.json` - NPM dependencies
- `tsconfig.json`, `tsconfig.tsbuildinfo` - TypeScript config
- `next.config.js` - Next.js configuration
- `postcss.config.js` - CSS processing
- `jest.config.mjs`, `jest.setup.ts` - Test configuration
- `components.json` - Shadcn/ui config
- `tailwind.config.ts` - Design system (canonical)
- `tailwind.bloomberg.config.ts` - Historical reference (archived 2025-10-17)

### Environment & Deployment

- `.env.example`, `.env.local` - Environment variables
- `.gitignore`, `.dockerignore` - VCS exclusions
- `.eslintrc.json` - Linting rules
- `.mcp.json` - MCP server config
- `docker-compose.yml`, `Dockerfile` - Container config
- `railway.toml`, `Procfile` - Deployment config

### Documentation (5 files only)

- `README.md` - Project overview
- `CLAUDE.md` - AI assistant instructions
- `CANONICAL_REFERENCES.md` - Tier 1 file catalog
- `AGENTS.md` - Agent configuration
- `SKILL.md` - Skill definitions

### Data Sources

- `dr-elena-mortgage-expert-v2.json` - Canonical Dr Elena v2 persona
- `next-env.d.ts` - Auto-generated Next.js types

---

## FORBIDDEN at Root

### Log Files
- `*.log` files - Should be in `logs/` directory or `.gitignore`

### Test/Debug Files
- `test-*.ts`, `test-*.js`, `test-*.json` - Should be in `tests/` or `scripts/test-data/`
- `verify-*.js` - Should be in `scripts/`

### Backup/Temporary Files
- `*.backup`, `*.new`, `*.tmp.*` - Delete or archive to `docs/reports/investigations/`
- `*.patch` files - Archive to `docs/reports/investigations/`
- Temp files (`_*.js`, `_*.py`, `nul`, `temp*`) - Delete

### Script Files
- Script files (`*.py`, `*.ps1`, `*.sh`) - Should be in `scripts/`

### Documentation Files
- `*_SUMMARY.md` - Archive to `docs/plans/archive/`
- `*_REPORT.md` - Archive to `docs/reports/`
- `*_FIX.md` - Delete (use git log)
- `*_STATUS.md` - Delete (stale)
- `*_IMPLEMENTATION.md` - Move to `docs/runbooks/`

---

## Standard Directory Structure

### Next.js Standard Directories
- `app/` - Next.js 14 app router pages
- `components/` - React components organized by domain
- `lib/` - Business logic, calculations, utilities
- `public/` - Static assets (images, fonts, etc.)
- `styles/` - Global styles and CSS modules

### Project-Specific Directories
- `docs/` - All documentation (runbooks, plans, reports)
- `scripts/` - Build scripts, utilities, automation
- `tests/` - Test files not colocated with components
- `hooks/` - Custom React hooks

### Data Directories
- `data/` - Static data files, fixtures
- `database/` - Database schemas, migrations
- `supabase/` - Supabase-specific configuration

### Archive Directories (if needed)
- `_archived/` - Deprecated code for reference
- `backups/` - Manual backups (prefer git instead)

---

## File Placement Decision Guide

### Question: Where should this file go?

**Configuration file?**
→ Check "Allowed at Repository Root" section above
→ If not listed, ask before adding to root

**Documentation file?**
→ Is it one of the 5 allowed docs? (README, CLAUDE, CANONICAL_REFERENCES, AGENTS, SKILL)
→ YES: Root is fine
→ NO: Place in appropriate `docs/` subdirectory

**Code file?**
→ NEVER at root - use `app/`, `components/`, `lib/`, or `hooks/`

**Test file?**
→ NEVER at root - colocate with component or use `tests/` directory

**Script file?**
→ NEVER at root - use `scripts/` directory

**Data file?**
→ Is it the Dr Elena persona JSON? YES: Root is fine
→ Otherwise: Use `data/`, `database/`, or appropriate subdirectory

**Log/debug file?**
→ NEVER commit - add to `.gitignore` or delete

**Temporary/backup file?**
→ NEVER commit - use git history instead

---

## Cleanup Checklist

Before committing, verify:

- [ ] No `*.log` files in root
- [ ] No `test-*.ts` or `verify-*.js` in root
- [ ] No `*.backup`, `*.new`, `*.tmp.*` files anywhere
- [ ] No `*_SUMMARY.md` or `*_REPORT.md` in root
- [ ] All scripts in `scripts/` directory
- [ ] All docs (except the 5 allowed) in `docs/` subdirectories
- [ ] No temporary files (`nul`, `temp*`, `_*.js`)

---

## What to Do If You Find Forbidden Files

| File Type | Action |
|-----------|--------|
| `*.log` | Add to `.gitignore` or delete |
| `test-*.ts` | Move to `tests/` or `scripts/test-data/` |
| `*.backup` | Delete (use `git show HEAD~1:path/to/file`) |
| `*_SUMMARY.md` | Archive to `docs/plans/archive/{year}/{month}/` |
| `*_REPORT.md` | Move to `docs/reports/investigations/` |
| `*_FIX.md` | Delete (info should be in git log) |
| `verify-*.js` | Move to `scripts/` |
| Script files | Move to `scripts/` |
| Temp files | Delete immediately |

---

## Examples

### Good Root Directory Listing

```
package.json
tsconfig.json
next.config.js
tailwind.config.ts
README.md
CLAUDE.md
CANONICAL_REFERENCES.md
.gitignore
.env.example
docker-compose.yml
dr-elena-mortgage-expert-v2.json
app/
components/
docs/
lib/
scripts/
tests/
```

### Bad Root Directory Listing

```
package.json
test-api.ts          ❌ Should be in tests/
verify-build.js      ❌ Should be in scripts/
debug.log            ❌ Should be in .gitignore
FIX_SUMMARY.md       ❌ Delete (use git log)
temp-component.tsx   ❌ Delete or move to app/_dev/
backup.sql           ❌ Delete or move to database/
```

---

**Last Updated:** 2025-10-19  
**Source:** [CLAUDE.md](../CLAUDE.md) lines 182-229
