# Git Worktree Workflow

**Purpose:** Manage parallel development streams without interrupting current work.

**Last Updated:** 2025-10-19
**Tier:** 2 (Runbook - Implementation Guide)
**Related Files:**
- Tier 1: `CANONICAL_REFERENCES.md` - Worktree location standards
- Tier 3: Plans reference this for parallel development tasks
- Agent: `.claude/agents/worktree-helper.md` - Automated worktree creation

---

## Quick Reference

```bash
# Create worktree for bug fix
git worktree add .worktrees/fix-bug-name -b fix/bug-name

# Open in new VS Code window
code .worktrees/fix-bug-name

# Work, commit, push from worktree
cd .worktrees/fix-bug-name
git add .
git commit -m "fix: description"
git push -u origin fix/bug-name

# Switch back to main project
cd ../..

# Delete worktree when done
git worktree remove .worktrees/fix-bug-name
```

---

## Table of Contents

1. [What Are Worktrees?](#what-are-worktrees)
2. [When to Use Worktrees](#when-to-use-worktrees)
3. [Worktree Location Standards](#worktree-location-standards)
4. [Creating Worktrees](#creating-worktrees)
5. [Working in Worktrees](#working-in-worktrees)
6. [Merging and Cleanup](#merging-and-cleanup)
7. [Response-Awareness Integration](#response-awareness-integration)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## What Are Worktrees?

**Git worktrees** allow you to have multiple working directories (checkouts) from the same repository simultaneously.

### Traditional Git Workflow
```
C:\Projects\NextNest\
  - Can only work on ONE branch at a time
  - Must commit/stash changes to switch branches
  - Risk losing context between switches
```

### With Worktrees
```
C:\Projects\NextNest\                  # Main workspace (feature-a branch)
  - app/
  - components/
  - Feature A files (uncommitted changes OK)

C:\Projects\NextNest\.worktrees\fix-bug-b\  # Separate workspace (fix/bug-b branch)
  - app/
  - components/
  - Clean checkout for Bug B

Both share: .git/ (same history, same remote)
```

### Key Benefits

1. **No interruptions**: Keep main workspace messy while fixing urgent bugs
2. **Parallel development**: Work on multiple features simultaneously
3. **Clean isolation**: Each worktree has its own branch and file state
4. **Shared Git state**: Both worktrees see the same commits, tags, remotes
5. **No context switching**: Each VS Code window maintains its own state

---

## When to Use Worktrees

### ✅ Use Worktrees When:

**1. Urgent interruptions**
```
Scenario: Working on Feature A (uncommitted changes)
Interrupt: Critical bug needs immediate fix
Solution: Create worktree for bug fix
```

**2. Parallel features**
```
Scenario: Feature B depends on Feature A (under review)
Problem: Can't merge Feature A yet, but need to start Feature B
Solution: Create worktree for Feature B based on Feature A branch
```

**3. Testing across branches**
```
Scenario: Need to verify bug exists on both main and develop branches
Solution: One worktree per branch for comparison
```

**4. Long-running reviews**
```
Scenario: PR under review, want to start next feature
Solution: Create worktree for new feature while PR is reviewed
```

### ❌ Don't Use Worktrees When:

**1. Related work on same feature**
```
Bad: Creating worktree for every small change to same feature
Good: Continue in main workspace
```

**2. Clean workspace**
```
Bad: No uncommitted changes, creating worktree unnecessarily
Good: Just create a regular branch (git checkout -b)
```

**3. Quick typo fixes**
```
Bad: Worktree for 1-line change
Good: Stash, fix, commit, unstash
```

**4. Learning Git**
```
Bad: Using worktrees before understanding branches
Good: Master branches first, then add worktrees
```

---

## Worktree Location Standards

**CANONICAL LOCATION:** `.worktrees/[branch-name]/`

### Directory Structure

```
NextNest/                              # Main project
├── .git/                              # Shared Git database
├── .worktrees/                        # All worktrees here
│   ├── fix-calculator-bug/            # Bug fix worktree
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   ├── feature-new-dashboard/         # Feature worktree
│   └── test-production-issue/         # Testing worktree
├── app/                               # Main workspace files
├── components/
└── .gitignore                         # Contains: .worktrees/
```

### Naming Conventions

**Branch name → Worktree folder name**

```bash
# Bug fixes
Branch: fix/calculator-returns-nan
Folder: .worktrees/fix-calculator-returns-nan

# Features
Branch: feature/add-email-validation
Folder: .worktrees/feature-add-email-validation

# Hotfixes
Branch: hotfix/security-patch-v1.2.3
Folder: .worktrees/hotfix-security-patch-v1.2.3

# Testing
Branch: test/verify-mobile-layout
Folder: .worktrees/test-verify-mobile-layout
```

**Rules:**
- Use branch name as folder name (consistency)
- Lowercase with hyphens (no spaces, no underscores)
- Descriptive (bug-name, feature-name, not "temp" or "test1")

### .gitignore Entry

**REQUIRED:** Add to `.gitignore` (prevents committing worktrees)

```gitignore
# Git worktrees (managed via git worktree command)
.worktrees/
```

**Why ignore worktrees?**
- Git manages worktrees separately via `.git/worktrees/`
- Committing `.worktrees/` would duplicate code
- Each developer creates their own worktrees as needed

---

## Creating Worktrees

### Method 1: Manual Creation (Full Control)

**Step 1: Create worktree**
```bash
# From main project directory
git worktree add .worktrees/fix-bug-name -b fix/bug-name

# Output:
# Preparing worktree (new branch 'fix/bug-name')
# HEAD is now at abc1234 Latest commit message
```

**Step 2: Navigate to worktree**
```bash
cd .worktrees/fix-bug-name
```

**Step 3: Verify branch**
```bash
git branch
# Output:
# * fix/bug-name
```

**Step 4: Open in VS Code**
```bash
# From worktree directory
code .

# Or from main project
code .worktrees/fix-bug-name
```

### Method 2: Automated via Response-Awareness (Recommended)

**Trigger:** `/response-awareness` detects uncommitted changes + unrelated task

```
You: "/response-awareness 'Fix calculator bug returning NaN'"

Claude:
  "I notice you have uncommitted changes to progressive form implementation.
   This bug fix is unrelated to your current work.

   Would you like me to create a worktree for isolated bug fixing?"

   [Yes] [No, I'll commit first] [No, continue here]

You: "Yes"

Claude:
  "Creating worktree at .worktrees/fix-calculator-bug/ on branch fix/calculator-bug

   Next steps:
   1. Open new VS Code window: code .worktrees/fix-calculator-bug
   2. Fix bug, test, commit
   3. Push: git push -u origin fix/calculator-bug
   4. Create PR
   5. Return to main workspace when done

   Main workspace unchanged - your progressive form work is safe."
```

**What the agent does:**
1. Checks for uncommitted changes (`git status`)
2. Assesses if task is related or unrelated
3. Creates worktree with descriptive branch name
4. Runs `npm install` in worktree (if needed)
5. Logs to `docs/work-log.md`
6. Returns structured JSON with paths and next steps

See: `.claude/agents/worktree-helper.md` for full agent implementation

### Method 3: Create from Existing Branch

**Use case:** Need to work on existing branch without switching main workspace

```bash
# Create worktree from existing remote branch
git worktree add .worktrees/feature-existing feature/existing-branch

# Create worktree from existing local branch
git worktree add .worktrees/fix-existing fix/existing-bug
```

### Method 4: Create for Testing

**Use case:** Compare behavior across branches

```bash
# Worktree for main branch
git worktree add .worktrees/test-main main

# Worktree for develop branch
git worktree add .worktrees/test-develop develop

# Now you can run tests in both simultaneously
cd .worktrees/test-main && npm test
cd .worktrees/test-develop && npm test
```

---

## Working in Worktrees

### Daily Workflow

**1. Start work in worktree**
```bash
# Open worktree in VS Code
code .worktrees/fix-bug-name

# Verify you're on correct branch
git branch
# * fix/bug-name

# Install dependencies (if needed)
npm install
```

**2. Make changes**
```bash
# Edit files
code app/calculator/route.ts

# Run tests (TDD)
npm test -- calculator

# Check status
git status
```

**3. Commit work**
```bash
# Stage changes
git add app/calculator/

# Commit with message
git commit -m "fix: calculator returning NaN for edge case

- Added validation for empty input
- Fixed division by zero handling
- Added tests for edge cases"
```

**4. Push to remote**
```bash
# First push (set upstream)
git push -u origin fix/bug-name

# Subsequent pushes
git push
```

**5. Create PR**
```bash
# Using GitHub CLI (from worktree)
gh pr create --title "Fix calculator NaN bug" --body "$(cat <<'EOF'
## Summary
- Fixed calculator returning NaN for empty inputs
- Added validation and error handling

## Test Plan
- [x] Unit tests pass
- [x] Manual testing with edge cases
- [x] No regressions in existing functionality
EOF
)"
```

### Environment Setup in Worktrees

**Dependencies:**
```bash
# Worktrees share node_modules by default (via symlink or copy)
# If you need isolated dependencies:
npm install  # Creates worktree-specific node_modules
```

**Environment variables:**
```bash
# Copy from main workspace
cp ../../.env.local .env.local

# Or create worktree-specific
echo "DATABASE_URL=..." > .env.local
```

**Development server:**
```bash
# Run dev server in worktree
npm run dev

# Will use different port if main workspace already running
# Edit package.json to specify port if needed
```

### Switching Between Worktrees

**Main workspace → Worktree:**
```bash
# From main project
cd .worktrees/fix-bug-name

# Or open new terminal in VS Code
# Terminal > New Terminal (automatically uses worktree path)
```

**Worktree → Main workspace:**
```bash
# From worktree
cd ../..

# Or switch VS Code window
# Cmd/Ctrl + Tab between windows
```

**Multiple VS Code windows:**
```bash
# Main workspace in window 1
code .

# Worktree in window 2
code .worktrees/fix-bug-name

# Worktree in window 3
code .worktrees/feature-dashboard
```

### Git Operations in Worktrees

**All standard Git commands work:**
```bash
# From worktree directory
git status
git add .
git commit -m "message"
git push
git pull
git log
git diff
```

**Shared operations affect all worktrees:**
```bash
# Fetch updates (visible in all worktrees)
git fetch origin

# Create tag (visible everywhere)
git tag v1.2.3

# View branches (shows all, including other worktrees)
git branch --all
```

**Branch-specific operations:**
```bash
# Merge in worktree
git merge main

# Rebase in worktree
git rebase main

# Cherry-pick from another branch
git cherry-pick abc1234
```

---

## Merging and Cleanup

### Merging Worktree Changes

**Option 1: Merge via PR (Recommended)**
```bash
# 1. Push from worktree
cd .worktrees/fix-bug-name
git push -u origin fix/bug-name

# 2. Create PR on GitHub
gh pr create --title "Fix: Calculator bug" --base main

# 3. Review, approve, merge on GitHub

# 4. Update main workspace
cd ../..
git checkout main
git pull origin main
```

**Option 2: Local merge**
```bash
# 1. Commit and test in worktree
cd .worktrees/fix-bug-name
git add .
git commit -m "fix: description"
npm test  # Ensure tests pass

# 2. Switch to main workspace
cd ../..
git checkout main

# 3. Merge worktree branch
git merge fix/bug-name

# 4. Push to remote
git push origin main
```

### Cleaning Up Worktrees

**Step 1: List active worktrees**
```bash
git worktree list

# Output:
# C:/Projects/NextNest                    abc1234 [main]
# C:/Projects/NextNest/.worktrees/fix-bug def5678 [fix/bug-name]
```

**Step 2: Remove worktree**
```bash
# Remove worktree (keeps branch)
git worktree remove .worktrees/fix-bug-name

# Or delete manually then prune
rm -rf .worktrees/fix-bug-name
git worktree prune
```

**Step 3: Delete branch (optional)**
```bash
# Delete local branch
git branch -d fix/bug-name

# Delete remote branch
git push origin --delete fix/bug-name
```

**Force removal (if uncommitted changes):**
```bash
# Warning: This discards uncommitted work
git worktree remove .worktrees/fix-bug-name --force
```

### Cleanup Checklist

After merging worktree work:

- [ ] PR merged (or local merge completed)
- [ ] Main workspace updated (`git pull`)
- [ ] Worktree removed (`git worktree remove`)
- [ ] Branch deleted locally (`git branch -d`)
- [ ] Branch deleted remotely (`git push origin --delete`)
- [ ] Entry removed from `docs/work-log.md` (or marked complete)

### Bulk Cleanup

**Remove all worktrees at once:**
```bash
# List all worktrees
git worktree list | grep ".worktrees" | awk '{print $1}' | while read dir; do
  git worktree remove "$dir"
done

# Or manual
rm -rf .worktrees/*
git worktree prune
```

---

## Response-Awareness Integration

### How Response-Awareness Detects Worktree Needs

**Phase 0 Pre-Check (before complexity assessment):**

```javascript
// Pseudo-code from response-awareness router
const hasUncommittedChanges = checkGitStatus();
const taskType = analyzeUserRequest(userInput);

if (hasUncommittedChanges && taskType.isUnrelated) {
  // Offer worktree creation
  deployAgent('worktree-helper');
}
```

**Detection triggers:**
1. **Uncommitted changes present** (`git status --short` returns output)
2. **New task is unrelated** to current work (keyword analysis)
3. **Worktree integration enabled** (`.claude/config/response-awareness-config.json`)

**Example detection:**

```
Current work: "Progressive form implementation" (files in components/forms/)
New request: "Fix calculator bug" (files in app/calculator/)

Analysis:
- Uncommitted: YES (progressive form changes)
- Related: NO (different domain)
→ Offer worktree
```

### Worktree-Helper Agent Flow

**1. Assessment**
```
Input: User task + git status

Output:
- Should create worktree? (yes/no)
- Suggested branch name
- Reasoning
```

**2. Creation**
```bash
git worktree add .worktrees/[branch-name] -b [branch-name]
cd .worktrees/[branch-name]
npm install  # If needed
```

**3. Documentation**
```markdown
# Added to docs/work-log.md

## Worktree Created: fix/calculator-bug

**Created:** 2025-10-19
**Location:** .worktrees/fix-calculator-bug/
**Branch:** fix/calculator-bug
**Reason:** Uncommitted progressive form work, unrelated bug fix
**Status:** active

### Setup
- Dependencies installed: ✓
- Tests passing: ✓
- Dev server: Port 3001 (main uses 3000)

### Cleanup Steps
- [ ] Fix bug and test
- [ ] Commit and push
- [ ] Create PR
- [ ] Merge PR
- [ ] Remove worktree
- [ ] Delete branch
```

**4. Return Control**
```json
{
  "worktree_path": ".worktrees/fix-calculator-bug",
  "branch_name": "fix/calculator-bug",
  "next_steps": [
    "Open VS Code: code .worktrees/fix-calculator-bug",
    "Fix bug and run tests",
    "Commit: git add . && git commit -m 'fix: description'",
    "Push: git push -u origin fix/calculator-bug",
    "Create PR: gh pr create"
  ],
  "cleanup_command": "git worktree remove .worktrees/fix-calculator-bug"
}
```

### Configuration

**File:** `.claude/config/response-awareness-config.json`

```json
{
  "features": {
    "worktree_integration": true,
    "worktree_auto_offer": true,
    "worktree_location": ".worktrees/"
  },
  "worktree": {
    "require_clean_status": false,
    "auto_npm_install": true,
    "log_to_work_log": true
  }
}
```

**Flags:**
- `worktree_integration`: Enable/disable entire feature
- `worktree_auto_offer`: Automatically offer (vs ask permission)
- `require_clean_status`: Only create if main workspace is committed
- `auto_npm_install`: Run npm install in new worktrees
- `log_to_work_log`: Document in work-log.md

### Manual Trigger

**Explicitly request worktree:**
```
You: "/response-awareness 'Create worktree for feature X'"

Claude: "Creating worktree at .worktrees/feature-x/..."
```

**Disable worktree offer:**
```
You: "/response-awareness 'Fix bug (no worktree)'"

Claude: "Proceeding without worktree creation..."
```

---

## Common Patterns

### Pattern 1: Bug Fix While Feature In Progress

```bash
# Scenario: Building feature, urgent bug reported

# Current state
git status
# modified: components/forms/ProgressiveForm.tsx (uncommitted)

# Use response-awareness
/response-awareness "Fix calculator returning NaN for empty input"

# Claude creates worktree
# .worktrees/fix-calculator-nan/

# Fix bug in worktree
code .worktrees/fix-calculator-nan
# Edit app/calculator/route.ts
# Run tests
npm test

# Commit and push
git add .
git commit -m "fix: calculator NaN for empty input"
git push -u origin fix/calculator-nan

# Create PR
gh pr create --title "Fix calculator NaN bug"

# Return to main workspace
cd ../..
# Continue feature work (ProgressiveForm.tsx still uncommitted)
```

### Pattern 2: Parallel Feature Development

```bash
# Scenario: Feature A under review, start Feature B

# Feature A is in PR
git branch
# * feature/progressive-form-mobile

# Create worktree for Feature B
git worktree add .worktrees/feature-email-validation -b feature/email-validation

# Work on Feature B
code .worktrees/feature-email-validation

# Both features in progress:
# Main: feature/progressive-form-mobile (under review)
# Worktree: feature/email-validation (active development)

# When Feature A merges
cd ../..
git checkout main
git pull
git branch -d feature/progressive-form-mobile

# Rebase Feature B on updated main
cd .worktrees/feature-email-validation
git rebase main
```

### Pattern 3: Testing Across Branches

```bash
# Scenario: Verify bug exists on both main and develop

# Create worktree for main
git worktree add .worktrees/test-main main

# Create worktree for develop
git worktree add .worktrees/test-develop develop

# Test on main
cd .worktrees/test-main
npm test -- calculator
# Bug confirmed

# Test on develop
cd ../test-develop
npm test -- calculator
# Bug confirmed

# Fix in new worktree
cd ../..
git worktree add .worktrees/fix-calculator-bug -b fix/calculator-bug

# Apply fix
cd .worktrees/fix-calculator-bug
# Make fix
npm test  # Verify

# Cleanup test worktrees
cd ../..
git worktree remove .worktrees/test-main
git worktree remove .worktrees/test-develop
```

### Pattern 4: Long-Running Experiment

```bash
# Scenario: Experiment with new architecture, keep main work active

# Create experiment worktree
git worktree add .worktrees/experiment-new-state-mgmt -b experiment/new-state-mgmt

# Work on experiment
code .worktrees/experiment-new-state-mgmt
# Major refactoring, takes days/weeks

# Continue regular work in main workspace
code .
# Daily bug fixes, features on main branch

# If experiment succeeds
cd .worktrees/experiment-new-state-mgmt
git push -u origin experiment/new-state-mgmt
# Create PR for review

# If experiment fails
cd ../..
git worktree remove .worktrees/experiment-new-state-mgmt
git branch -D experiment/new-state-mgmt  # Force delete
```

### Pattern 5: Hotfix for Production

```bash
# Scenario: Production issue, need immediate fix

# Main workspace on develop branch (unstable)
git branch
# * develop

# Create hotfix worktree from main
git worktree add .worktrees/hotfix-v1.2.3 -b hotfix/v1.2.3 main

# Fix in worktree
code .worktrees/hotfix-v1.2.3
# Make minimal fix
npm test

# Commit and push
git add .
git commit -m "hotfix: critical production bug"
git push -u origin hotfix/v1.2.3

# Merge to main
git checkout main
git merge hotfix/v1.2.3
git push origin main

# Also merge to develop
git checkout develop
git merge hotfix/v1.2.3
git push origin develop

# Cleanup
git worktree remove .worktrees/hotfix-v1.2.3
git branch -d hotfix/v1.2.3
```

---

## Troubleshooting

### Error: "fatal: '.worktrees/name' already exists"

**Cause:** Worktree folder exists but Git doesn't track it

**Fix:**
```bash
# Remove folder
rm -rf .worktrees/name

# Prune stale worktree references
git worktree prune

# Recreate
git worktree add .worktrees/name -b branch-name
```

### Error: "fatal: 'branch-name' is already checked out"

**Cause:** Branch is already active in another worktree or main workspace

**Fix:**
```bash
# List all worktrees
git worktree list

# Remove conflicting worktree
git worktree remove .worktrees/conflicting-name

# Or use different branch name
git worktree add .worktrees/name -b new-branch-name
```

### Error: "npm: command not found" in worktree

**Cause:** Path or environment not set up in worktree

**Fix:**
```bash
# From worktree directory
which npm
# If not found, check PATH

# Or use full path
/path/to/npm install

# Or reload shell
exec $SHELL
```

### Worktree removed but branch still exists

**Expected behavior** - worktree removal doesn't delete branches

**Clean up:**
```bash
# List branches
git branch

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

### Worktree has merge conflicts

**Scenario:** Tried to merge main into worktree branch, conflicts occurred

**Fix:**
```bash
# From worktree
git status
# Shows conflicted files

# Resolve conflicts manually
code path/to/conflicted/file.ts

# Mark resolved
git add path/to/conflicted/file.ts

# Continue merge
git merge --continue

# Or abort
git merge --abort
```

### Can't remove worktree (uncommitted changes)

**Error:** "fatal: '.worktrees/name' contains modified or untracked files"

**Fix:**
```bash
# Option 1: Commit changes
cd .worktrees/name
git add .
git commit -m "wip: save work"
cd ../..
git worktree remove .worktrees/name

# Option 2: Force remove (discards changes)
git worktree remove .worktrees/name --force

# Option 3: Move elsewhere
mv .worktrees/name ../backup-name
git worktree prune
```

### Worktree node_modules out of sync

**Cause:** package.json changed in main workspace, worktree has old dependencies

**Fix:**
```bash
# From worktree
npm install  # Reinstall based on current package.json

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Git thinks worktree is dirty (status shows changes in main workspace)

**Cause:** Working in wrong directory

**Fix:**
```bash
# Check current directory
pwd
# Expected: /path/to/project/.worktrees/name
# If not, navigate there

cd .worktrees/name
git status  # Now shows correct status
```

### VS Code extensions not working in worktree

**Cause:** Extensions need workspace trust or configuration

**Fix:**
```bash
# Option 1: Trust workspace
# File > Trust Workspace

# Option 2: Copy settings from main
cp ../../.vscode/settings.json .vscode/

# Option 3: Install extensions workspace-specific
# Extensions > Install in Worktree
```

---

## Summary

**Git worktrees enable:**
- Parallel development without interrupting current work
- Isolated environments for bug fixes, experiments, testing
- Clean separation between related and unrelated tasks
- Efficient context switching via multiple VS Code windows

**Standard workflow:**
1. Response-awareness detects need → offers worktree creation
2. Worktree-helper agent creates `.worktrees/[branch-name]/`
3. Open in new VS Code window
4. Work, test, commit, push, create PR
5. Return to main workspace (unchanged)
6. Remove worktree after merge

**Integration with Tier 1-3:**
- **Tier 1:** `.worktrees/` location standard, .gitignore rules
- **Tier 2:** This runbook (implementation guide)
- **Tier 3:** Plans reference this when parallel work needed

**Key principle:** Worktrees are temporary workspaces. Main workspace is canonical. Clean up regularly.

---

**See Also:**
- `.claude/agents/worktree-helper.md` - Automated worktree creation agent
- `CANONICAL_REFERENCES.md` - Worktree location standards
- `.claude/config/response-awareness-config.json` - Worktree feature flags
- `docs/work-log.md` - Worktree activity logging
