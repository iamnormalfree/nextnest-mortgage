# Response-Awareness Framework Update Guide

This guide explains how to sync your customized response-awareness framework with upstream updates.

---

## Architecture Overview

**Three-Layer System:**

1. **Upstream Reference** (`.claude/upstream-reference/`) - Pristine upstream files for comparison
2. **Configuration Layer** (`.claude/config/`) - Your customizations (paths, features, agents)
3. **Working Files** (`.claude/skills/`, `.claude/commands/`) - Your customized versions

**Key Principle:** Never directly copy upstream files. Always compare and merge manually.

---

## When Upstream Updates Are Available

### Important Note

Since you sync from GitHub regularly (not zip downloads), the process is simpler:

1. **Pull latest from GitHub** to your `.claude/` directory
2. **Re-add NextNest integration** to the router
3. **Done** - Your customizations are preserved

### Step 1: Pull Latest from GitHub

```bash
# You sync your response-awareness framework from GitHub
# (Your existing workflow - pull latest changes)
```

### Step 2: Re-add NextNest Integration to Router

After pulling from GitHub, the router file `.claude/commands/response-awareness.md` will be updated.

**You need to re-add ONE section** at the top:

Edit `.claude/commands/response-awareness.md` and add after "Core Innovation" line:

```markdown
---

## Load NextNest Customizations

Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Git worktree check (if uncommitted changes detected)
- Extension 0.2: Brainstorming pre-check (if vague language detected)
- Extension 0.3: Debug task detection (if bug keywords detected)

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`

---
```

And update Phase 0 section to reference NextNest extensions:

```markdown
### Phase 0: Intelligent Routing

**FIRST: Run NextNest Extensions** (see NEXTNEST_CUSTOMIZATIONS.md loaded above)

- If worktree needed → Deploy worktree-helper agent
- If brainstorming needed → Invoke brainstorming skill
- If debugging task → Route to systematic-debugging skill

**THEN: Continue with standard complexity assessment:**
```

**That's it!** Your customizations are preserved.

### Step 3: (Optional) Run Comparison for Major Changes

Use the comparison script (created below):

```bash
# From project root
node scripts/compare-upstream.js v2.1.0
```

**Output:**
```
=== Response-Awareness Upstream Comparison ===

Comparing:
  Upstream: .claude/upstream-reference/response-awareness-v2.1.0/
  Local:    .claude/skills/, .claude/commands/

MODIFIED FILES (differences found):
  - skills/response-awareness-light.md
    Local customizations:
      - Line 45: Added worktree check
      - Line 120: Changed logging path to docs/completion_drive_logs/

  - commands/response-awareness.md
    Local customizations:
      - Line 30-60: Added brainstorming pre-check
      - Line 100: Load config from .claude/config/

NEW FILES IN UPSTREAM (not in local):
  - agents/new-specialized-agent.md

DELETED FILES IN UPSTREAM (removed from upstream):
  - None

LOCAL-ONLY FILES (your custom files):
  - skills/brainstorming.md (from Superpowers)
  - skills/systematic-debugging.md (from Superpowers)
  - skills/worktree-workflow.md (custom)
  - agents/worktree-helper.md (custom)

=== Recommendations ===

1. Review modified files for upstream improvements
2. Consider adopting new-specialized-agent.md
3. Preserve local customizations when merging
```

### Step 4: Review Differences Manually

For each modified file, use a diff tool:

```bash
# Windows: Use VS Code
code --diff .claude\upstream-reference\response-awareness-v2.1.0\skills\response-awareness-light.md .claude\skills\response-awareness-light.md

# Or use git diff
git diff --no-index .claude/upstream-reference/response-awareness-v2.1.0/skills/response-awareness-light.md .claude/skills/response-awareness-light.md
```

**What to look for:**
- Upstream bug fixes → Adopt these
- Upstream new features → Evaluate if useful
- Your customizations (config loading, worktree checks) → Preserve these

### Step 5: Merge Changes

**Option A: Manual merge in editor**

Open both files side-by-side in VS Code:
1. Copy upstream improvements to your version
2. Keep your customizations (config loading, logging paths)
3. Test after merging

**Option B: Three-way merge**

```bash
# Use your previous version as base
git merge-file .claude/skills/response-awareness-light.md \
  .claude/upstream-reference/response-awareness-v2.0.0/skills/response-awareness-light.md \
  .claude/upstream-reference/response-awareness-v2.1.0/skills/response-awareness-light.md
```

### Step 6: Test Changes

```bash
# Test with simple task
/response-awareness "simple test task"

# Verify customizations still work:
# - Logging goes to docs/completion_drive_logs/
# - Worktree check runs
# - Brainstorming pre-check runs
# - Config loads from .claude/config/
```

### Step 7: Update Version Tracking

Edit `.claude/config/response-awareness-config.json`:

```json
{
  "version": "2.0-nextnest-custom",
  "upstream_version": "2.1.0",  // ← Update this
  "last_sync_date": "2025-10-18"  // ← Update this
  // ... rest of config
}
```

### Step 8: Document Changes

Add entry to `docs/work-log.md`:

```markdown
## 2025-10-18 - Updated Response-Awareness Framework

**Upstream version:** v2.1.0
**Previous version:** v2.0.0

**Changes adopted:**
- Bug fix in complexity-scout scoring logic
- New preserving-tensions integration in HEAVY tier

**Changes skipped:**
- Upstream changed logging format (kept our custom format)

**Customizations preserved:**
- Worktree integration in Phase 0
- Brainstorming pre-check
- Config loading from .claude/config/
```

---

## What to Preserve During Updates

**ALWAYS preserve these customizations:**

1. **Config Loading**
   ```javascript
   // Your code (keep this):
   const config = loadConfig('.claude/config/response-awareness-config.json');

   // Upstream code (don't replace with this):
   const LOG_PATH = "completion_drive_logs/"; // hardcoded
   ```

2. **Worktree Integration**
   ```markdown
   ## Phase 0: Pre-Assessment (NextNest Custom)

   ### Step 1: Git Worktree Check
   // This is your customization - keep it
   ```

3. **Brainstorming Pre-Check**
   ```markdown
   ### Step 2: Brainstorming Pre-Check
   // This is your customization - keep it
   ```

4. **Logging Paths**
   ```javascript
   // Your code (keep this):
   const logPath = config.paths.verbose_logs;

   // Upstream code (don't replace with this):
   const logPath = "./logs/"; // hardcoded
   ```

5. **Custom Agents**
   - `worktree-helper.md` - Your custom agent, not in upstream
   - Keep this file, it won't conflict

6. **Superpowers Skills**
   - `brainstorming.md`
   - `systematic-debugging.md`
   - `worktree-workflow.md`
   - These are not in upstream, keep them

---

## What to Adopt from Upstream

**ALWAYS consider adopting:**

1. **Bug Fixes**
   - Upstream fixes to complexity scoring
   - Agent deployment logic improvements
   - Tag resolution fixes

2. **New Agents**
   - If upstream adds new specialized agents, evaluate usefulness
   - Example: `contract-validator`, `data-architect`

3. **Framework Improvements**
   - Better phase transition logic
   - Enhanced verification protocols
   - Performance optimizations

4. **Documentation Updates**
   - Improved examples
   - Better explanations
   - New best practices

---

## Conflict Resolution Strategy

### Scenario 1: Upstream Changes Section You've Customized

**Example:** Upstream updates Phase 0 complexity scoring, but you've added worktree check to Phase 0

**Resolution:**
1. Read upstream changes to understand intent
2. Apply upstream logic improvements
3. Keep your worktree check inserted BEFORE upstream logic
4. Test to ensure both work together

**Pattern:**
```markdown
## Phase 0: Pre-Assessment

### NextNest Custom: Worktree Check
[Your code - preserved]

### Upstream: Complexity Scoring (Updated)
[Upstream improvements - adopted]
```

### Scenario 2: Upstream Adds New File You Don't Need

**Example:** Upstream adds `agents/blockchain-specialist.md`

**Resolution:**
- Don't copy it to your `.claude/agents/`
- It stays in `.claude/upstream-reference/` for reference
- If you ever need it, copy and customize

### Scenario 3: Upstream Changes Config Format

**Example:** Upstream adds new tier "ULTRA" between HEAVY and FULL

**Resolution:**
1. Update `.claude/config/response-awareness-config.json` to add ULTRA tier settings
2. Update your router to handle ULTRA tier
3. Test tier routing still works

---

## Comparison Script

**Location:** `scripts/compare-upstream.js`

**Purpose:** Automated comparison between upstream and local files

**Usage:**
```bash
node scripts/compare-upstream.js v2.1.0
```

**What it does:**
1. Lists all files in upstream reference
2. Compares with your working files
3. Identifies differences
4. Highlights local customizations
5. Suggests files to review

**Output:** Markdown report saved to `docs/reports/upstream-comparison-v2.1.0.md`

---

## Version History Tracking

**Keep a log of upstream versions you've synced:**

**Location:** `.claude/config/version-history.json`

```json
{
  "sync_history": [
    {
      "upstream_version": "2.0.0",
      "sync_date": "2025-10-15",
      "changes_adopted": ["Initial setup"],
      "changes_skipped": []
    },
    {
      "upstream_version": "2.1.0",
      "sync_date": "2025-10-18",
      "changes_adopted": [
        "Bug fix in complexity-scout",
        "New preserving-tensions integration"
      ],
      "changes_skipped": [
        "Logging format change (kept custom format)"
      ]
    }
  ],
  "current_working_version": "2.0-nextnest-custom",
  "based_on_upstream": "2.1.0"
}
```

---

## Quick Reference: File Ownership

| File Location | Owner | Modify? | Source |
|---------------|-------|---------|--------|
| `.claude/upstream-reference/` | Upstream | NO (pristine copy) | GitHub releases |
| `.claude/config/` | You | YES (your settings) | Created locally |
| `.claude/skills/response-awareness-*.md` | Hybrid | YES (merge upstream + custom) | Upstream + your customizations |
| `.claude/skills/brainstorming.md` | You | YES (local only) | Superpowers |
| `.claude/skills/worktree-workflow.md` | You | YES (local only) | Custom |
| `.claude/commands/response-awareness.md` | Hybrid | YES (merge upstream + custom) | Upstream + your customizations |
| `.claude/agents/worktree-helper.md` | You | YES (local only) | Custom |

**Legend:**
- **Upstream:** Files from response-awareness GitHub
- **You:** Files you created for NextNest
- **Hybrid:** Upstream files you've customized

---

## Backup Strategy

**Before syncing:**

```bash
# Create backup of current working files
mkdir -p backups/response-awareness-$(date +%Y-%m-%d)
cp -r .claude/skills backups/response-awareness-$(date +%Y-%m-%d)/
cp -r .claude/commands backups/response-awareness-$(date +%Y-%m-%d)/
cp -r .claude/agents backups/response-awareness-$(date +%Y-%m-%d)/

# If merge goes wrong, restore:
cp -r backups/response-awareness-2025-10-18/* .claude/
```

---

## FAQ

**Q: Should I update every time upstream releases?**

A: No. Only update when:
- Upstream has bug fixes you need
- Upstream adds features you want
- You're starting a complex project and want latest improvements

**Q: What if I've heavily customized a file?**

A: Keep your version. Only adopt specific upstream improvements you need. Your customizations take priority.

**Q: Can I contribute my customizations back to upstream?**

A: Yes! If your worktree integration or config layer would benefit others, propose it to upstream. But keep your NextNest-specific logic separate.

**Q: What if comparison script shows 50+ differences?**

A: Normal if you've customized heavily. Focus on:
1. Bug fixes in upstream (adopt)
2. New features you want (adopt selectively)
3. Ignore formatting/style differences

**Q: Should I track upstream-reference/ in git?**

A: Your choice:
- **Track it:** Collaborators get same reference version
- **Don't track:** Add to `.gitignore`, each dev downloads own reference

Recommendation: **Don't track** - it's large and infrequently used.

---

## Checklist: Syncing with Upstream

- [ ] Download latest upstream release ZIP
- [ ] Unzip to `.claude/upstream-reference/response-awareness-vX.X.X/`
- [ ] Run comparison script: `node scripts/compare-upstream.js vX.X.X`
- [ ] Review comparison report in `docs/reports/`
- [ ] For each modified file:
  - [ ] Open diff in VS Code
  - [ ] Identify upstream improvements
  - [ ] Merge improvements while preserving customizations
  - [ ] Test file works after merge
- [ ] Update `.claude/config/response-awareness-config.json` upstream_version
- [ ] Update `.claude/config/version-history.json`
- [ ] Document changes in `docs/work-log.md`
- [ ] Test full workflow: `/response-awareness "test task"`
- [ ] Verify logging, worktrees, brainstorming still work
- [ ] Commit changes: `git add .claude/ && git commit -m "chore: sync with upstream vX.X.X"`

---

**Last Updated:** 2025-10-18
**Current Upstream Version:** 2.0.0 (initial setup)
**Current Working Version:** 2.0-nextnest-custom
