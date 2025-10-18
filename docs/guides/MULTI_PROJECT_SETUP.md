# Multi-Project Response-Awareness Setup Guide

Complete guide for managing response-awareness framework and Superpowers skills across multiple projects using git subtree.

---

## Overview

This setup allows you to:
- ✅ Maintain one canonical source for frameworks (claude-shared repository)
- ✅ Sync updates to all projects with one command per project
- ✅ Keep project-specific configurations isolated
- ✅ Track changes via git (revert bad updates easily)
- ✅ No symlink dependencies (works on Windows)

---

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Shared Repository (GitHub)                         │
│ https://github.com/iamnormalfree/claude-shared              │
│                                                              │
│ Contains:                                                    │
│ - response-awareness tiers (light/medium/heavy/full)        │
│ - Superpowers skills (brainstorming, systematic-debugging)  │
│ - Templates for config files                                │
│ - Templates for agents                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ git subtree
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Project Subtree                                    │
│ .claude/frameworks/shared/                                  │
│                                                              │
│ Git subtree embedded in project - syncs with Layer 1       │
└─────────────────────────────────────────────────────────────┘
                            ↑ references
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Project-Specific Files                             │
│ .claude/config/          - Project settings                 │
│ .claude/commands/        - Wrapper commands (load subtree)  │
│ .claude/agents/          - Custom agents                    │
└─────────────────────────────────────────────────────────────┘
```

### What Lives Where

| Content | Location | Shared? | Purpose |
|---------|----------|---------|---------|
| Response-awareness tiers | `claude-shared/frameworks/response-awareness/` | ✅ Yes | Universal orchestration workflows |
| Superpowers skills | `claude-shared/frameworks/superpowers/` | ✅ Yes | brainstorming, systematic-debugging |
| NEXTNEST_CUSTOMIZATIONS.md | `claude-shared/frameworks/response-awareness/response-awareness-shared/` | ✅ Yes | Phase 0 extensions (worktree, brainstorming, debug) |
| Config templates | `claude-shared/templates/config/` | ✅ Yes | Starting point for new projects |
| Project configs | `.claude/config/` | ❌ No | response-awareness-config.json, logging-config.json, agents-config.json |
| Response-awareness command | `.claude/commands/response-awareness.md` | ❌ No | Loads shared frameworks + project configs |
| Custom agents | `.claude/agents/` | ❌ No | Project-specific agents (worktree-helper, etc.) |

---

## Initial Setup (Already Complete for NextNest)

NextNest is already configured. These steps document what was done for reference:

### 1. Created Shared Repository

```bash
# Location: C:\Users\HomePC\.config\claude-shared
# GitHub: https://github.com/iamnormalfree/claude-shared

cd C:\Users\HomePC\.config\claude-shared
git init
# ... copied frameworks from NextNest
git add .
git commit -m "Initial commit: Claude shared repository"
git remote add origin https://github.com/iamnormalfree/claude-shared.git
git push -u origin master
```

### 2. Added Subtree to NextNest

```bash
cd C:\Users\HomePC\Desktop\Code\NextNest
git subtree add --prefix .claude/frameworks/shared \
  https://github.com/iamnormalfree/claude-shared.git master --squash
```

### 3. Updated NextNest Configuration

- Updated `.claude/commands/response-awareness.md` to load from subtree path
- Archived old skill files to `.claude/skills/archive/2025-10-pre-subtree/`
- Kept project-specific files in `.claude/config/`

---

## Adding to New Projects

### Option 1: Automated Setup (Recommended)

Use the setup script:

```powershell
# From NextNest root directory
.\scripts\setup-new-project.ps1 -ProjectPath "C:\Path\To\NewProject"
```

**What it does:**
1. Creates `.claude/` directory structure
2. Adds git subtree from claude-shared
3. Copies config templates
4. Creates response-awareness command with correct paths
5. Commits everything

**Requirements:**
- Target project must be a git repository
- Working tree must be clean (commit or stash changes first)

### Option 2: Manual Setup

```bash
# 1. Navigate to project
cd C:\Path\To\NewProject

# 2. Ensure working tree is clean
git status

# 3. Add subtree
git subtree add --prefix .claude/frameworks/shared \
  https://github.com/iamnormalfree/claude-shared.git master --squash

# 4. Create config directory
mkdir -p .claude/config

# 5. Copy config templates
cp .claude/frameworks/shared/templates/config/*.json .claude/config/

# 6. Create response-awareness command
# (See template below)

# 7. Commit
git add .claude/
git commit -m "feat: add claude-shared frameworks via git subtree"
```

#### Response-Awareness Command Template

Create `.claude/commands/response-awareness.md`:

```markdown
# /response-awareness - Universal Smart Router

## Purpose
Universal entry point that assesses task complexity and routes to the appropriate orchestration tier.

**Core Innovation**: Dynamic routing based on actual complexity, not guesswork.

---

## Load Project Customizations

Read file `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Git worktree check (if uncommitted changes detected)
- Extension 0.2: Brainstorming pre-check (if vague language detected)
- Extension 0.3: Debug task detection (if bug keywords detected)

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`

---

## Your Role as Router

You analyze the user's request, score its complexity, and invoke the appropriate Response Awareness tier Skill.

**You do NOT execute the workflow yourself** - you route to the Skill that contains the workflow.

---

For the full router documentation, see:
`.claude/frameworks/shared/frameworks/SKILL.md`
```

---

## Updating Frameworks

### Single Project Update

```bash
# Navigate to project
cd C:\Path\To\Project

# Ensure clean working tree
git status

# Pull latest from shared repository
git subtree pull --prefix .claude/frameworks/shared \
  https://github.com/iamnormalfree/claude-shared.git master --squash

# Test
/response-awareness "test task"
```

### Bulk Update (Multiple Projects)

**Option 1: Using update script**

```powershell
# Create project list
# File: scripts/project-list.txt
C:\Users\HomePC\Desktop\Code\NextNest
C:\Projects\Project2
C:\Projects\Project3

# Run update
cd C:\Users\HomePC\Desktop\Code\NextNest
.\scripts\update-all-projects.ps1
```

**Option 2: Dry run first (recommended)**

```powershell
.\scripts\update-all-projects.ps1 -DryRun
```

**Option 3: Specify paths directly**

```powershell
.\scripts\update-all-projects.ps1 -ProjectPaths @(
  "C:\Projects\Project1",
  "C:\Projects\Project2"
)
```

### Update Workflow Diagram

```
1. Update claude-shared repository
   ↓
   cd C:\Users\HomePC\.config\claude-shared
   # Make changes to frameworks
   git add .
   git commit -m "Update: description"
   git push origin master

2. Pull to each project
   ↓
   cd C:\Project
   git subtree pull --prefix .claude/frameworks/shared \
     https://github.com/iamnormalfree/claude-shared.git master --squash

3. Test
   ↓
   /response-awareness "test task"
```

---

## Customization Strategy

### What to Customize Where

**In Shared Repository** (affects all projects):
- Response-awareness tier workflows
- Superpowers skill improvements
- NEXTNEST_CUSTOMIZATIONS.md (Phase 0 extensions)
- Universal agent definitions

**In Project Configs** (affects one project):
- `response-awareness-config.json`:
  - Tier preferences
  - Model selections
  - Feature toggles
  - Logging paths
- `logging-config.json`:
  - Verbosity levels
  - Log file locations
- `agents-config.json`:
  - Project-specific agents
  - Agent overrides

**Example: Different Projects, Different Settings**

```json
// NextNest: .claude/config/response-awareness-config.json
{
  "tier_preferences": {
    "light": { "model": "claude-3-5-haiku-20241022" },
    "medium": { "model": "claude-3-5-haiku-20241022" },
    "heavy": { "model": "claude-sonnet-4-5-20250929" },
    "full": { "model": "claude-sonnet-4-5-20250929" }
  }
}

// SmallProject: .claude/config/response-awareness-config.json
{
  "tier_preferences": {
    "light": { "model": "claude-3-5-haiku-20241022" },
    "medium": { "model": "claude-3-5-haiku-20241022" },
    "heavy": { "model": "claude-3-5-haiku-20241022" },  // Use Haiku everywhere
    "full": { "model": "claude-3-5-haiku-20241022" }
  }
}
```

---

## Troubleshooting

### Issue: "fatal: working tree has modifications"

**Cause:** Uncommitted changes in project

**Solution:**
```bash
git status
# Commit or stash changes
git add .
git commit -m "WIP: before subtree update"
# Then retry subtree pull
```

### Issue: Subtree pull shows conflicts

**Cause:** Local modifications to shared files

**Solution:**
```bash
# Option 1: Accept theirs (shared repo version)
git checkout --theirs .claude/frameworks/shared/
git add .claude/frameworks/shared/
git commit -m "Accept upstream changes"

# Option 2: Manually resolve
# Edit conflicted files
git add .claude/frameworks/shared/
git commit -m "Merge upstream with local changes"
```

### Issue: Response-awareness command not finding files

**Cause:** Incorrect path in command file

**Solution:**
Check `.claude/commands/response-awareness.md`:
```markdown
Read file `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`
```

Must match actual subtree structure.

### Issue: Project-specific config not loading

**Cause:** Config file doesn't exist or has wrong format

**Solution:**
```bash
# Copy template
cp .claude/frameworks/shared/templates/config/response-awareness-config.json .claude/config/

# Or fix JSON syntax
# Use JSON validator: jsonlint.com
```

---

## Testing the Setup

### Verification Checklist

After setup or update, verify:

1. **Subtree exists:**
   ```bash
   ls .claude/frameworks/shared/frameworks/response-awareness/
   # Should show: response-awareness-light, medium, heavy, full, shared
   ```

2. **Command loads correctly:**
   ```bash
   /response-awareness "test complexity routing"
   # Should show complexity assessment and tier routing
   ```

3. **Config files present:**
   ```bash
   ls .claude/config/
   # Should show: response-awareness-config.json, logging-config.json, agents-config.json
   ```

4. **Update mechanism works:**
   ```bash
   # Make test change in claude-shared
   # Push to GitHub
   # Pull to project
   git subtree pull --prefix .claude/frameworks/shared \
     https://github.com/iamnormalfree/claude-shared.git master --squash
   # Verify change appears in .claude/frameworks/shared/
   ```

---

## Maintenance

### Regular Tasks

**Weekly/Monthly:**
- Check for upstream response-awareness updates
- Sync to claude-shared repository
- Pull to all projects

**When Adding New Project:**
- Run `setup-new-project.ps1`
- Customize project configs
- Add to `scripts/project-list.txt`

**When Making Improvements:**
- If universal → Update claude-shared
- If project-specific → Update `.claude/config/`

### Best Practices

1. **Always test in one project first** before bulk updating
2. **Use dry-run mode** for bulk updates initially
3. **Keep customizations in designated locations**
   - Shared: claude-shared repository
   - Project: `.claude/config/`
4. **Commit before updating** to easily revert if needed
5. **Document changes** in commit messages

---

## Migration from Old Setup

If you have old projects with inline skills (not using subtree):

### Migration Steps

1. **Backup old files:**
   ```bash
   cd OldProject
   mkdir -p .claude/skills/archive/2025-10-pre-subtree
   mv .claude/skills/response-awareness-* .claude/skills/archive/2025-10-pre-subtree/
   mv .claude/skills/brainstorming.md .claude/skills/archive/2025-10-pre-subtree/
   mv .claude/skills/systematic-debugging.md .claude/skills/archive/2025-10-pre-subtree/
   ```

2. **Run setup script:**
   ```powershell
   .\scripts\setup-new-project.ps1 -ProjectPath "C:\Path\To\OldProject"
   ```

3. **Verify everything works:**
   ```bash
   /response-awareness "test task"
   ```

4. **Remove archives once confident:**
   ```bash
   git rm -rf .claude/skills/archive/2025-10-pre-subtree/
   git commit -m "Clean up archived skills after migration"
   ```

---

## Reference Files

| File | Purpose | Location |
|------|---------|----------|
| `UPDATE_GUIDE.md` | How to sync with upstream | NextNest root |
| `setup-new-project.ps1` | Automated project setup | `scripts/` |
| `update-all-projects.ps1` | Bulk update script | `scripts/` |
| `project-list.example.txt` | Template for project list | `scripts/` |
| `CLAUDE.md` | AI assistant instructions | NextNest root (see "Response-Awareness & Skills Architecture") |
| Shared repo README | Claude-shared documentation | `claude-shared/README.md` |

---

## Support

**Issues with setup:**
1. Check this guide first
2. Review UPDATE_GUIDE.md
3. Check CLAUDE.md section "Response-Awareness & Skills Architecture"
4. Test with `/response-awareness "test task"`

**Common questions:**
- Q: Can I have different versions in different projects?
  - A: No - subtree always syncs to latest. Use feature flags in configs instead.

- Q: What if I want project-specific customizations?
  - A: Put them in `.claude/config/` files, not in shared frameworks.

- Q: Can I contribute improvements back?
  - A: Yes! Update claude-shared repo and push to GitHub.

---

**Last Updated:** 2025-10-18
**Setup Tested:** NextNest (fully working)
**Scripts Available:** setup-new-project.ps1, update-all-projects.ps1
