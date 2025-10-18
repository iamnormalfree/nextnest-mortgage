# How to Integrate NextNest Customizations

Your response-awareness framework gets updated regularly from the GitHub repo. To keep your NextNest customizations working after updates, follow these instructions.

---

## The Solution: Shared Module

All NextNest customizations are in:
```
.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md
```

This file contains:
- Configuration loading
- Phase 0 extensions (worktree, brainstorming, debug detection)
- TDD enforcement
- CANONICAL_REFERENCES checks
- Component placement validation
- YAGNI checks
- Logging/plan path overrides

---

## Integration Steps

### Step 1: Router Integration

**File:** `.claude/commands/response-awareness.md`

**Add at the top** (after the header, before "## Phase 0: Intelligent Routing"):

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

**Then in Phase 0**, before the standard "Immediate Assessment" section, add:

```markdown
### Phase 0: Pre-Assessment

**FIRST: Run NextNest Extensions** (see NEXTNEST_CUSTOMIZATIONS.md)

If worktree needed → Create worktree and continue in isolated workspace
If brainstorming needed → Clarify requirements first
If debugging task → Route to systematic-debugging skill

**THEN: Continue with standard complexity assessment below**

### Step 1: Immediate Assessment (standard)
...
```

### Step 2: Tier Integration

**Files:**
- `.claude/skills/response-awareness-light/SKILL.md`
- `.claude/skills/response-awareness-medium/SKILL.md`
- `.claude/skills/response-awareness-heavy/SKILL.md`
- `.claude/skills/response-awareness-full/phase-X-*.md` (all phase files)

**Add at the top** (after existing shared module loads):

```markdown
## Load Shared Observability Modules

**Always:**
Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

**If LOGGING_LEVEL != none:**
Read file `.claude/skills/response-awareness-shared/LOGGING_INSTRUCTIONS.md`

**For HEAVY/FULL:**
Read file `.claude/skills/response-awareness-shared/PLAN_PERSISTENCE.md`

---

## Apply NextNest Customizations

**Throughout implementation:**
- TDD mandatory: Write failing test FIRST for every feature
- Check CANONICAL_REFERENCES.md before modifying files
- Use Component Placement Decision Tree for new files
- Apply YAGNI ruthlessly (remove unrequested features)
- Override log paths with config settings
- Override plan paths with config settings

---
```

---

## After GitHub Updates

**When you sync from upstream GitHub:**

1. **Router** (`.claude/commands/response-awareness.md`):
   - Pull latest from GitHub
   - Re-add the "Load NextNest Customizations" section at top
   - Re-add "FIRST: Run NextNest Extensions" in Phase 0

2. **Tier Skills**:
   - Pull latest from GitHub
   - Re-add the "Load Shared Observability Modules" section at top
   - Re-add the "Apply NextNest Customizations" section

3. **Shared Module** (`.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`):
   - **Never gets updated from GitHub** (it's NextNest-specific)
   - This file stays as-is, no changes needed

---

## Why This Works

**Upstream files** (from GitHub):
- Router and tier skills are vanilla framework
- Get updated regularly with improvements

**NextNest customizations** (local only):
- Separate file in `response-awareness-shared/`
- Loaded by router and tiers via Read command
- Never conflicts with upstream updates

**Integration points:**
- Just 2-3 lines added to router
- Just 2-3 lines added to each tier skill
- Easy to re-add after updates

---

## Quick Re-Integration Script

After pulling from GitHub, run these edits:

**Router:**
```bash
# Open router
code .claude/commands/response-awareness.md

# Add after header:
# ---
# ## Load NextNest Customizations
# Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`
# ...
```

**Each Tier:**
```bash
# Open tier skill
code .claude/skills/response-awareness-light/SKILL.md

# Add after header:
# ## Load Shared Observability Modules
# **Always:**
# Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`
# ...
```

---

## What NOT to Do

❌ **Don't edit upstream files extensively** - hard to maintain after updates
❌ **Don't put NextNest code directly in router/tiers** - will be overwritten
❌ **Don't forget to re-add load commands** - customizations won't apply

✅ **Do keep customizations in NEXTNEST_CUSTOMIZATIONS.md** - survives updates
✅ **Do re-add simple load commands** - quick and easy
✅ **Do update configs in `.claude/config/`** - separate from framework files

---

## Example: Full Router Integration

```markdown
# /response-awareness - Universal Smart Router

## Purpose
Universal entry point that assesses task complexity and routes...

---

## Load NextNest Customizations

Read file `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Git worktree check
- Extension 0.2: Brainstorming pre-check
- Extension 0.3: Debug task detection

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`

---

## Your Role as Router

You analyze the user's request...

[Rest of upstream content unchanged]

---

## Complexity Assessment Protocol

### Phase 0: Intelligent Routing

**FIRST: Run NextNest Extensions** (see NEXTNEST_CUSTOMIZATIONS.md)

If worktree needed → Create worktree
If brainstorming needed → Clarify requirements
If debugging task → Route to systematic-debugging

**THEN: Continue with standard assessment:**

**Step 1: Immediate Assessment** (no agent needed)
...
```

---

## Testing Integration

After re-integration, test:

```bash
# Test worktree detection
git status  # Make sure you have uncommitted changes
/response-awareness "Add new feature"
# Should offer worktree creation

# Test brainstorming detection
/response-awareness "I'm thinking about adding a dashboard"
# Should offer brainstorming skill

# Test debug detection
/response-awareness "Fix the bug where calculator returns NaN"
# Should offer systematic-debugging skill

# Test config loading
# Check that logs go to docs/completion_drive_logs/
# Check that plans go to docs/plans/active/
```

---

## Questions?

See:
- `RESPONSE_AWARENESS_SETUP.md` - Full architecture overview
- `UPDATE_GUIDE.md` - Upstream sync workflow
- `.claude/skills/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md` - Customization details
- `.claude/config/response-awareness-config.json` - Feature flags

---

**Last Updated:** 2025-10-18
**Maintenance:** Re-add load commands after each GitHub sync
