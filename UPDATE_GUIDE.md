# Response-Awareness Framework Update Guide

This guide explains how to sync your customized response-awareness framework with upstream updates using the git subtree approach.

---

## Architecture Overview

**Three-Layer System:**

1. **Shared Repository** (`https://github.com/iamnormalfree/claude-shared`) - Canonical frameworks
2. **Local Subtree** (`.claude/frameworks/shared/`) - Git subtree of shared repository
3. **Configuration Layer** (`.claude/config/`) - Project-specific settings

**Key Principle:** Shared frameworks are managed via git subtree. Updates from shared repository automatically sync to all projects.

---

## Multi-Project Architecture

### Repository Structure

```
claude-shared/                              # Shared GitHub repository
├── frameworks/
│   ├── response-awareness/
│   │   ├── response-awareness-light/
│   │   ├── response-awareness-medium/
│   │   ├── response-awareness-heavy/
│   │   ├── response-awareness-full/
│   │   └── response-awareness-shared/      # Includes NEXTNEST_CUSTOMIZATIONS.md
│   └── superpowers/
│       ├── brainstorming.md
│       └── systematic-debugging.md
├── templates/
└── README.md

NextNest/                                   # Your project
├── .claude/
│   ├── frameworks/
│   │   └── shared/                         # Git subtree → claude-shared
│   ├── config/                             # Project-specific configs
│   │   ├── response-awareness-config.json
│   │   ├── logging-config.json
│   │   └── agents-config.json
│   ├── commands/
│   │   └── response-awareness.md           # References subtree path
│   └── agents/
│       └── worktree-helper.md
└── ...
```

---

## Updating Shared Frameworks

### When to Update

1. **Response-awareness framework gets new version** - Update claude-shared repo
2. **Superpowers skills updated** - Update claude-shared repo
3. **You improve customizations** - Update claude-shared repo

### Step 1: Update Shared Repository

```bash
# Navigate to shared repository
cd C:\Users\HomePC\.config\claude-shared

# Pull latest upstream changes (if tracking upstream)
# OR manually update files

# Commit changes
git add .
git commit -m "Update response-awareness to v2.2.0"

# Push to GitHub
git push origin master
```

### Step 2: Pull Updates to NextNest (or any project)

```bash
# Navigate to project
cd C:\Users\HomePC\Desktop\Code\NextNest

# Pull subtree updates
git subtree pull --prefix .claude/frameworks/shared https://github.com/iamnormalfree/claude-shared.git master --squash

# Commit the merge
# (Git will create merge commit automatically)
```

### Step 3: Verify Integration

```bash
# Test the response-awareness command
/response-awareness "test task"

# Should load from new path:
# .claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md
```

---

## Setting Up New Projects

### Option 1: Use setup-new-project.ps1 Script

```powershell
# From any location
.\setup-new-project.ps1 -ProjectPath "C:\Projects\MyNewProject"
```

This will:
1. Create `.claude/` directory structure
2. Add git subtree to the project
3. Copy config templates
4. Update paths in response-awareness.md

### Option 2: Manual Setup

```bash
# 1. Navigate to new project
cd C:\Projects\MyNewProject

# 2. Add subtree
git subtree add --prefix .claude/frameworks/shared https://github.com/iamnormalfree/claude-shared.git master --squash

# 3. Copy config templates
cp .claude/frameworks/shared/templates/config/* .claude/config/

# 4. Create response-awareness command
# See template in: .claude/frameworks/shared/templates/commands/response-awareness.md
```

---

## Key File Paths (After Subtree Setup)

| Purpose | Old Path (Before) | New Path (After Subtree) |
|---------|------------------|--------------------------|
| NextNest Customizations | `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md` | `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md` |
| Brainstorming Skill | `.claude/skills/brainstorming.md` | `.claude/frameworks/shared/frameworks/superpowers/brainstorming.md` |
| Systematic Debugging | `.claude/skills/systematic-debugging.md` | `.claude/frameworks/shared/frameworks/superpowers/systematic-debugging.md` |
| Response Awareness Light | `.claude/skills/response-awareness-light/` | `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-light/` |
| Response Awareness Medium | `.claude/skills/response-awareness-medium/` | `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-medium/` |
| Response Awareness Heavy | `.claude/skills/response-awareness-heavy/` | `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-heavy/` |
| Response Awareness Full | `.claude/skills/response-awareness-full/` | `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-full/` |

**What stays local (NOT in subtree):**
- `.claude/config/` - Project-specific settings
- `.claude/commands/` - Project-specific command wrappers (reference subtree)
- `.claude/agents/worktree-helper.md` - Custom agents
- `.claude/skills/executing-plans/` - Project-specific skills

---

## Response-Awareness Command Integration

Your `.claude/commands/response-awareness.md` should load customizations from the subtree:

```markdown
## Load NextNest Customizations

Read file `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Git worktree check (if uncommitted changes detected)
- Extension 0.2: Brainstorming pre-check (if vague language detected)
- Extension 0.3: Debug task detection (if bug keywords detected)

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`
```

---

## Troubleshooting

### Subtree not updating

```bash
# Force pull
git subtree pull --prefix .claude/frameworks/shared https://github.com/iamnormalfree/claude-shared.git master --squash

# If conflicts, resolve and commit
```

### Path not found errors

Check that response-awareness.md references the correct subtree path:

```markdown
Read file `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`
```

### Customizations lost after update

If customizations are in NEXTNEST_CUSTOMIZATIONS.md (in shared repo), they persist across updates.

If customizations are in config files (`.claude/config/`), they're project-specific and never overwritten.

---

## Update Workflow Summary

```
1. Update claude-shared repo
   ↓
2. git subtree pull in each project
   ↓
3. Test /response-awareness
   ↓
4. Done - all projects updated
```

**Benefits:**
- ✅ One update syncs to all projects
- ✅ No manual file copying
- ✅ Git tracks changes
- ✅ Can revert bad updates
- ✅ Project configs stay isolated
- ✅ Works on Windows without symlinks

---

## Comparison with Old Approach

| Aspect | Old (Zip + Manual Copy) | New (Git Subtree) |
|--------|------------------------|-------------------|
| Update method | Download zip, extract, copy | `git subtree pull` |
| Multi-project sync | Manual copy to each | One command per project |
| Track changes | Manual comparison | Git diff |
| Revert bad updates | Restore from backup | `git revert` |
| Customization preservation | Manual merge | Automatic (in NEXTNEST_CUSTOMIZATIONS.md) |
| Windows compatibility | ✅ | ✅ |

---

**Last Updated:** 2025-10-18
**Subtree Setup Date:** 2025-10-18
**Shared Repository:** https://github.com/iamnormalfree/claude-shared
