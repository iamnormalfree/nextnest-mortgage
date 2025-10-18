# docs/ Organization Audit

**Date:** 2025-10-18
**Purpose:** Evaluate docs/ folder structure against established standards
**Context:** Post folder-reorganization cleanup - ensure documentation follows best practices

---

## Executive Summary

**Overall Assessment:** ⚠️ **NEEDS ORGANIZATION**

- **19 root-level docs files** - should be organized into subfolders
- **16 subdirectories** - some well-organized, some need clarification
- **Mixed purposes** - research, guides, plans, reports, completions all at root

**Key Issues:**
1. Too many files at docs/ root (19 files)
2. Duplicate/outdated files (multiple AI_BROKER reports, DR_ELENA guides)
3. Unclear folder purposes (completion_drive_*, evaluations, sessions)
4. Missing folder organization for common doc types

---

## Current State Analysis

### Root-Level Files (19 total)

**✅ SHOULD STAY AT ROOT (4 files)**
These are canonical reference docs:
- `ARCHITECTURE.md` (8.8K) - Core architecture reference
- `DESIGN_SYSTEM.md` (3.8K) - Design tokens and patterns
- `KNOWN_ISSUES.md` (3.3K) - Current workarounds
- `work-log.md` (23K) - Daily work log (Tier 2 working doc)

**⚠️ IMPLEMENTATION PLANS (4 files) → Should be in docs/plans/**
These look like old plans that should be archived:
- `AI_BROKER_IMPLEMENTATION_PLAN_REVISED.md` (75K)
- `DR_ELENA_STAGING_TEST_PLAN.md` (12K)
- `TASKS_9-11_COMPLETION_REPORT.md` (5.8K)
- `VERCEL_AI_SDK_VS_DIFY_DECISION.md` (14K) - Decision document

**📚 RESEARCH/REPORTS (3 files) → Should be in docs/reports/**
- `AI_BROKER_RESEARCH_REPORT.md` (37K)
- `AI_BROKER_RESEARCH_REPORT_UPDATED.md` (14K) - Duplicate?
- `DR_ELENA_INTEGRATION_COMPLETE.md` (12K) - Completion report

**📖 GUIDES (5 files) → Should be in docs/runbooks/**
- `DR_ELENA_QUICK_START.md` (8.4K) - Getting started guide
- `ENVIRONMENT_SETUP.md` (20K) - Setup guide
- `n8n-message-deduplication-fix.md` (9.0K) - Implementation guide
- `n8n-message-tracking-implementation-guide.md` (5.7K) - Implementation guide
- `INTEGRATION_MAPPING.md` (27K) - Architecture documentation

**❓ UNCLEAR (3 files)**
- `CURRENT_ARCHITECTURE.md` (25K) - Duplicate of ARCHITECTURE.md?
- `codex-log.md` (196 bytes) - Nearly empty, purpose unclear
- `overview.md` (20K) - General project overview

---

## Subdirectory Analysis

### ✅ WELL-ORGANIZED

**docs/plans/** - Plan management
- `active/` - Current plans (23 files)
- `archive/` - Completed plans
- `backlog/` - Future work
- **Status:** ✅ Good structure, follows CLAUDE.md standards

**docs/runbooks/** - Implementation guides
- Domain-organized subdirectories (chatops/, devops/, mobile-form-optimization/)
- **Status:** ✅ Good, Tier 2 documentation properly organized

**docs/reports/** - Investigation reports
- `investigations/` - Ad-hoc investigation findings
- `session-context/` - Session summaries
- `remap/` - Remapping documents
- **Status:** ✅ Good structure

### ⚠️ NEEDS CLARIFICATION

**docs/archive/** - General archive
- **Issue:** Unclear purpose vs docs/plans/archive/
- **Recommendation:** Clarify if this is for non-plan archives

**docs/completion_drive_plans/** & **docs/completion_drive_checkpoints/**
- **Issue:** Looks like legacy project structure from another system
- **Recommendation:** Archive or integrate into docs/plans/

**docs/evaluations/**
- **Issue:** Purpose unclear, might overlap with docs/reports/
- **Recommendation:** Merge into docs/reports/evaluations/ or archive

**docs/sessions/** vs **docs/reports/session-context/**
- **Issue:** Duplicate purposes
- **Recommendation:** Consolidate into docs/reports/session-context/

**docs/meta/**
- **Issue:** Purpose unclear - project meta documentation?
- **Recommendation:** Define purpose or distribute files to appropriate locations

**docs/validation-reports/**
- **Issue:** Might belong in docs/reports/validation/
- **Recommendation:** Consolidate reporting structure

### ✅ SPECIALIZED (OK to keep)

**docs/_templates/** - Document templates
**docs/design/** - Design assets and mockups
**docs/mortgage-lessons/** - Domain knowledge
**docs/openai-apps-sdk/** - SDK research
**docs/troubleshooting/** - Troubleshooting guides
**docs/audits/** - Audit reports

---

## Recommended Structure (Based on CLAUDE.md Standards)

```
docs/
├── ARCHITECTURE.md                    # ✅ Root - Core reference
├── DESIGN_SYSTEM.md                   # ✅ Root - Design reference
├── KNOWN_ISSUES.md                    # ✅ Root - Known issues
├── work-log.md                   # ✅ Root - Daily log
│
├── plans/                             # ✅ Plans (Tier 3)
│   ├── active/                        # Current work
│   ├── archive/{year}/{month}/        # Completed plans
│   ├── backlog/                       # Future work
│   └── ROADMAP.md                     # Strategic roadmap
│
├── runbooks/                          # ✅ Implementation guides (Tier 2)
│   ├── {domain}/                      # Domain-organized guides
│   └── archive/                       # Outdated guides
│
├── reports/                           # ✅ Reports & investigations
│   ├── investigations/                # Ad-hoc findings
│   ├── session-context/               # Session summaries
│   ├── evaluations/                   # Technology evaluations
│   ├── validation/                    # Validation reports
│   └── decisions/                     # Architecture decisions
│
├── _templates/                        # ✅ Document templates
├── design/                            # ✅ Design assets
├── mortgage-lessons/                  # ✅ Domain knowledge
├── troubleshooting/                   # ✅ Troubleshooting guides
├── audits/                            # ✅ Audit reports
│
└── archive/                           # ✅ Historical artifacts
    └── {year}/                        # Year-organized archives
```

---

## Priority Actions

### HIGH PRIORITY (Do Now)

**1. Move Implementation Plans to docs/plans/archive/**
```bash
git mv docs/AI_BROKER_IMPLEMENTATION_PLAN_REVISED.md docs/plans/archive/2025/10/
git mv docs/DR_ELENA_STAGING_TEST_PLAN.md docs/plans/archive/2025/10/
git mv docs/TASKS_9-11_COMPLETION_REPORT.md docs/plans/archive/2025/10/
```

**2. Move Research Reports to docs/reports/**
```bash
mkdir -p docs/reports/research
git mv docs/AI_BROKER_RESEARCH_REPORT*.md docs/reports/research/
git mv docs/DR_ELENA_INTEGRATION_COMPLETE.md docs/reports/research/
```

**3. Move Implementation Guides to docs/runbooks/**
```bash
mkdir -p docs/runbooks/chatops
git mv docs/n8n-message-*.md docs/runbooks/chatops/
git mv docs/DR_ELENA_QUICK_START.md docs/runbooks/
git mv docs/ENVIRONMENT_SETUP.md docs/runbooks/
```

**4. Move Decision Document**
```bash
mkdir -p docs/reports/decisions
git mv docs/VERCEL_AI_SDK_VS_DIFY_DECISION.md docs/reports/decisions/
```

### MEDIUM PRIORITY (Review Then Move)

**5. Evaluate Duplicate Files**
- Compare `ARCHITECTURE.md` vs `CURRENT_ARCHITECTURE.md` - keep one
- Compare `overview.md` vs `ARCHITECTURE.md` - keep one or merge
- Check `AI_BROKER_RESEARCH_REPORT.md` vs `_UPDATED.md` - keep latest

**6. Consolidate Report Folders**
```bash
# If docs/validation-reports/ has content, move to:
git mv docs/validation-reports/* docs/reports/validation/

# If docs/evaluations/ has content, move to:
git mv docs/evaluations/* docs/reports/evaluations/
```

**7. Review Legacy Folders**
- Check `docs/completion_drive_*` - archive if obsolete
- Check `docs/sessions/` - merge into docs/reports/session-context/
- Check `docs/meta/` - distribute files or clarify purpose

### LOW PRIORITY (Optional Cleanup)

**8. Delete Empty/Minimal Files**
- Check `codex-log.md` (196 bytes) - delete if unused

**9. Add Missing Folders**
```bash
mkdir -p docs/reports/decisions    # Architecture decisions
mkdir -p docs/reports/validation   # Validation reports
mkdir -p docs/reports/evaluations  # Technology evaluations
```

---

## Verification Checklist

After reorganization, verify:
- [ ] No files at docs/ root except: ARCHITECTURE.md, DESIGN_SYSTEM.md, KNOWN_ISSUES.md, work-log.md
- [ ] All plans in docs/plans/ (active, archive, or backlog)
- [ ] All implementation guides in docs/runbooks/
- [ ] All reports in docs/reports/ subdirectories
- [ ] No duplicate folders (sessions vs session-context, etc.)
- [ ] Clear purpose for each subdirectory

---

## Questions for Brent

1. **CURRENT_ARCHITECTURE.md vs ARCHITECTURE.md** - Which is canonical?
2. **docs/meta/** - What is this folder's purpose?
3. **docs/completion_drive_*** - Are these from a previous project? Archive?
4. **docs/archive/** vs **docs/plans/archive/** - What's the distinction?
5. **codex-log.md** - Different from work-log.md? Can we delete it?

---

## Expected Outcome

**After cleanup:**
- 4 files at docs/ root (core references)
- 19 files moved to appropriate subdirectories
- Clear folder hierarchy matching CLAUDE.md standards
- No duplicate purposes across folders
- Easy navigation: plans → runbooks → reports → archives
