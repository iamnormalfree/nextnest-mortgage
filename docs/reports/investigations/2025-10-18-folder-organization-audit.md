# Folder Organization Audit

**Date:** 2025-10-18
**Purpose:** Verify all repository folders are organized according to NextNest standards
**Context:** Following mortgage.ts migration, audit full repository structure

---

## ✅ CORRECT LOCATION - Standard Next.js

| Folder | Purpose | Status |
|--------|---------|--------|
| `app/` | Next.js 14 App Router pages/routes | ✅ Correct |
| `components/` | React components (forms, UI, shared) | ✅ Correct |
| `hooks/` | Custom React hooks | ✅ Correct |
| `lib/` | Business logic, calculations, utilities | ✅ Correct |
| `public/` | Static assets (images, fonts, etc.) | ✅ Correct |
| `styles/` | Global CSS, Tailwind config | ✅ Correct |
| `types/` | TypeScript type definitions | ✅ Correct |
| `node_modules/` | NPM dependencies (gitignored) | ✅ Correct |
| `.next/` | Next.js build output (gitignored) | ✅ Correct |

## ✅ CORRECT LOCATION - Project-Specific

| Folder | Purpose | Status |
|--------|---------|--------|
| `docs/` | Documentation, runbooks, plans, reports | ✅ Correct |
| `scripts/` | Build scripts, utilities, test helpers | ✅ Correct |
| `tests/` | Test files and test data | ✅ Correct |
| `supabase/` | Supabase config and migrations | ✅ Correct |

## ✅ CORRECT LOCATION - Tool Configs

| Folder | Purpose | Status |
|--------|---------|--------|
| `.claude/` | Claude Code hooks and config | ✅ Correct |
| `.codex/` | Codex journal and notes | ✅ Correct |
| `.factory/` | Factory pattern configs | ✅ Correct |
| `.git/` | Git version control | ✅ Correct |
| `.vscode/` | VS Code workspace settings | ✅ Correct |
| `.playwright-mcp/` | Playwright screenshots (gitignored) | ✅ Correct |

## ⚠️ NEEDS REVIEW - Questionable Folders

### `assets/` - Should be in `public/`
**Contents:** 2 logo images
**Issue:** Next.js convention is to put static assets in `public/`
**Recommendation:** Move to `public/images/` or `public/logos/`
**Action:** `git mv assets/nn-logo-*.* public/images/logos/`

### `backups/` - Empty, DELETE
**Contents:** Empty directory
**Issue:** No content, likely leftover from old workflow
**Recommendation:** Delete
**Action:** `rmdir backups/`

### `data/` - Empty, DELETE
**Contents:** Empty directory
**Issue:** No content, unclear purpose
**Recommendation:** Delete (test data should be in `tests/` or `scripts/test-data/`)
**Action:** `rmdir data/`

### `database/` - Empty, DELETE
**Contents:** Empty directory
**Issue:** Database config should be in `supabase/` (already exists)
**Recommendation:** Delete
**Action:** `rmdir database/`

### `experiments/` - Archive or Organize
**Contents:** `legacy/` subfolder
**Issue:** Unclear what experiments are active vs archived
**Recommendation:**
- If active experiments → rename to `_experiments/` (underscore indicates work-in-progress)
- If archived → move to `docs/reports/investigations/`
**Action:** Needs manual review of `experiments/legacy/` contents

### `logs/` - Keep (PDPA Compliance)
**Contents:** Daily audit logs (JSONL format)
**Status:** ✅ Already in `.gitignore` (Session 5)
**Purpose:** Regulatory compliance (MAS/PDPA requirements)
**Recommendation:** Keep, configure proper storage in Phase 2

### `mortgage-sg/` - Archive to `docs/`
**Contents:** `mortgage-client-monitoring-system.md`
**Issue:** Looks like a planning document, should be in `docs/` structure
**Recommendation:** Move to `docs/plans/archive/` or `docs/reports/investigations/`
**Action:** Review file, move to appropriate docs location

### `remap-ux/` - Archive to `docs/`
**Contents:** 5 markdown files (AI_BROKER_TOPICS.md, IMPLEMENTATION_LOG.md, etc.)
**Issue:** These are documentation files, not code
**Recommendation:** Move to `docs/reports/investigations/` or `docs/runbooks/`
**Action:**
```bash
git mv remap-ux/*.md docs/reports/investigations/2025-10-remap-ux/
rmdir remap-ux/
```

### `temp/` - Keep for Now (Active QA)
**Contents:** Test findings and Playwright screenshots
**Status:** Contains current QA findings for active branch
**Recommendation:** Keep until branch is merged, then clean up
**Action:** Add to `.gitignore` if not already

---

## 📋 Cleanup Action Plan

### High Priority (Do Now)
1. ✅ Delete empty folders: `backups/`, `data/`, `database/`
2. ⚠️ Move `assets/` → `public/images/logos/`
3. ⚠️ Archive `remap-ux/` → `docs/reports/investigations/2025-10-remap-ux/`
4. ⚠️ Archive `mortgage-sg/` → `docs/reports/investigations/`

### Medium Priority (Review First)
5. 🔍 Review `experiments/legacy/` - archive or keep?
6. 🔍 Review `temp/` - confirm in .gitignore

### Low Priority (Phase 2)
7. 📝 Configure proper log storage for `logs/` directory

---

## Root Directory File Audit (Quick Check)

### ❌ Suspicious Files at Root
- `nul` - Likely error artifact, DELETE
- `build-verification.log` - Should be in `logs/` or deleted
- `tailwind.bloomberg.config.ts.archived` - Should be in `docs/archive/` or deleted

### ✅ Expected Files at Root
- Config files: `package.json`, `tsconfig.json`, `next.config.js`, etc.
- Documentation: `README.md`, `CLAUDE.md`, `AGENTS.md`, `SKILL.md`
- Data sources: `dr-elena-mortgage-expert-v2.json`

---

## Summary

**Total Folders:** 29
**Correct Location:** 23 (79%)
**Needs Action:** 6 (21%)
**Empty (Delete):** 3
**Misplaced (Move):** 3

**Recommended Actions:**
1. Delete 3 empty folders
2. Move 2 folders to `public/` and `docs/`
3. Review 1 experiments folder
4. Clean up 3 root-level files

**Estimated Time:** 15 minutes
