---
title: archive-organization-guide
type: meta
owner: operations
last-reviewed: 2025-09-30
---

# 📦 ARCHIVE ORGANIZATION GUIDE

## Files to Archive (Move to Archive/ folder)

### Phase 1 Completed Documents
```
Archive/Phase1_Completed/
├── AI_INTELLIGENT_LEAD_FORM_IMPLEMENTATION_PLAN.md (original plan - Phase 1 done)
├── ROUNDTABLE_PROGRESSIVE_FORM_N8N_INTEGRATION.md (n8n approach - being replaced)
├── 31082025_lead-form-tasks.md (old task list)
├── PHASE_1B_COMPLETION_REPORT.md
├── PHASE_1B_ROUNDTABLE_SESSION.md
└── PHASE_1_IMPLEMENTATION_STATUS.md
```

### Planning & Evolution Documents
```
Archive/Planning_Docs/
├── Remap/form-architecture-evolution.md (keep for reference)
├── Remap/revised-implementation-plan.md (superseded by MASTER)
├── Remap/commercial-cashequity-migration-strategy.md (reference only)
├── Remap/implementation-file-changes.md (reference only)
├── Remap/context-validation-updates.md
└── Remap/analysis-mortgage-calc-doc.md
```

### Old Mappings
```
Archive/Old_Mappings/
├── Remap/field-mapping-original.md
└── NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md (superseded by current field-mapping.md)
```

### Testing & Session Docs
```
Archive/Testing/
├── Testing/
├── Session_Context/
└── TESTING_GUIDE.md
```

## Files to Keep Active

### Root Directory
- MASTER_IMPLEMENTATION_PLAN.md (NEW - Single source of truth)
- CLAUDE.md (Active - AI context)
- package.json, tsconfig.json, etc. (Active configs)

### Remap/ Directory (Keep These)
- NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md (Active - validation process)
- field-mapping.md (Active - current field definitions)
- frontend-backend-ai-architecture.md (Active - technical specs)

### Delete/Clean
- task-list.md (duplicate)
- task-list-progressive-form-integration.md (duplicate)
- test-n8n-post-webhook.md (obsolete)
- workflow-prompt-examples.md (n8n specific - obsolete)

## Manual Steps to Organize

1. Create Archive/ directory structure:
```bash
mkdir -p Archive/Phase1_Completed
mkdir -p Archive/Planning_Docs  
mkdir -p Archive/Old_Mappings
mkdir -p Archive/Testing
```

2. Move files according to the structure above

3. Update CLAUDE.md to reference MASTER_IMPLEMENTATION_PLAN.md

4. Delete duplicate/obsolete files

## Version Control Commit
```bash
git add -A
git commit -m "feat: reorganize documentation with MASTER_IMPLEMENTATION_PLAN as single source of truth

- Created MASTER_IMPLEMENTATION_PLAN.md as single source of truth
- Archived completed Phase 1 documents
- Consolidated scattered task lists
- Clarified Week 1-3 implementation priorities
- Removed n8n dependencies in favor of local AI agents"
```