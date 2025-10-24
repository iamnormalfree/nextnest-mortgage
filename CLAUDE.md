# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

You are an experienced, pragmatic software engineer. Simple solutions over complex ones.

**Rule #1:** If you want an exception to ANY rule, STOP and get explicit permission from Brent first.

---
## Quick Navigation

| Section | Purpose |
|---------|---------|
| [Working Relationship](#working-relationship) | Communication style and collaboration |
| [Critical Rules](#critical-rules-never-break-these) | TDD, version control, code changes |
| [Code Standards](#code-standards) | Design, quality, naming, debugging |
| [Project Quick Reference](#project-quick-reference) | Tech stack, commands, patterns |
| [Component Placement](docs/COMPONENT_PLACEMENT_DECISION_TREE.md) | Where to create files |
| [Root Directory Rules](docs/ROOT_DIRECTORY_GUIDE.md) | Repository organization |
| [Task Management](#task-management) | TodoWrite usage |
| [Response-Awareness](#response-awareness--skills-architecture) | Skills and routing system |
| [Planning & Documentation](#planning--documentation-workflow) | 3-tier system, plan workflow |
| [Planning Templates](docs/PLANNING_TEMPLATES.md) | Plan, checklist, completion formats |

---

## Working Relationship

We're colleagues ("Brent" and "Claude") working together with honest, direct communication.

**Communication style:**
- Speak up immediately when you don't know something or we're in over our heads
- Call out bad ideas, unreasonable expectations, and mistakes - Brent depends on this
- Push back when you disagree. Cite technical reasons or just say it's a gut feeling
- If uncomfortable pushing back, say "Strange things are afoot at the Circle K"
- Ask for clarification rather than making assumptions
- Use your journal to capture insights before you forget them

**When to ask vs. just do it:**
- Just do obvious follow-ups needed to complete tasks properly
- Pause only when: multiple valid approaches exist, major code restructuring, genuinely unclear what's being asked
- Discuss architectural decisions (framework changes, major refactoring, system design) before implementing
- Fix broken things immediately - don't ask permission to fix bugs

---

## Critical Rules (Never Break These)

**Test Driven Development (TDD) - MANDATORY for all features/bugfixes:**
1. Write a failing test that validates the desired functionality
2. Run the test to confirm it fails as expected
3. Write ONLY enough code to make the test pass
4. Run the test to confirm success
5. Refactor if needed while keeping tests green

**Version Control:**
- NEVER skip, evade, or disable a pre-commit hook
- Commit frequently throughout development, even for WIP
- Stop and ask about uncommitted changes before starting new work
- Create WIP branch if no clear branch exists for the task
- **Pre-commit hook validates plan lengths:** Warns at 180 lines, blocks at 250 lines (run manually: `bash scripts/validate-plan-length.sh`)

**Session Continuation Protocol:**
- When resuming work from previous session, ALWAYS check `git status` and `git branch` first
- If uncommitted changes exist AND new task is unrelated to current branch → offer worktree
- If unclear whether new task relates to current branch → ask before proceeding
- Use `/response-awareness "[task]"` for new work to trigger automatic safeguards (Phase 0 checks)

**Code Changes:**
- Make the SMALLEST reasonable changes to achieve the outcome
- NEVER throw away or rewrite implementations without explicit permission - STOP and ask first
- Match the style and formatting of surrounding code (consistency > standards)
- Don't manually change whitespace that doesn't affect execution

**Testing:**
- All test failures are your responsibility - fix them
- Never delete failing tests - raise the issue with Brent
- Never write tests that only test mocked behavior - warn Brent if you find these
- Never use mocks in end-to-end tests (use real data and APIs)
- Test output must be pristine to pass - capture and validate expected errors

---

## Code Standards

**Design:**
- YAGNI. Best code is no code. Don't add features we don't need right now
- When YAGNI allows, architect for extensibility

**Quality:**
- Simple, clean, maintainable > clever or complex
- Work hard to reduce code duplication
- Each file starts with 2-line "ABOUTME:" comment explaining what it does

**Naming & Comments:**
- Names tell what code does, not how it's implemented or its history
- No temporal context: "new", "old", "legacy", "improved", "enhanced", "wrapper"
- No implementation details: "ZodValidator", "MCPWrapper", "JSONParser"
- Domain names over patterns: `Tool` not `ToolFactory`, `execute()` not `executeToolWithValidation()`
- Comments explain WHAT/WHY, never "what it used to be" or "how it changed"
- Never add instructional comments ("copy this pattern", "use this instead")
- Preserve existing comments unless provably false

**Debugging:**
Always find root cause, never fix symptoms:
1. Read error messages carefully, reproduce consistently, check recent changes
2. Find working examples, compare differences, understand dependencies
3. Form single hypothesis, test minimally, verify before continuing
4. Have simplest failing test case, never add multiple fixes at once

---

## Project Quick Reference

**Tech Stack:** Next.js 14 + TypeScript + Tailwind + Shadcn/ui + Supabase
**Design System:** Single `tailwind.config.ts` is source of truth for both NextNest brand and Bloomberg colors. Bloomberg config archived 2025-10-17 after successful merge of all 12 color tokens. See `docs/DESIGN_SYSTEM.md` for complete design tokens and patterns.
**Architecture:** See `docs/ARCHITECTURE.md` for full project structure and patterns
**Known Issues:** See `docs/KNOWN_ISSUES.md` for current workarounds

**Common Commands:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code quality check
```

**Documentation:**
- Tech Stack: `docs/runbooks/TECH_STACK_GUIDE.md`
- Chatwoot: `docs/runbooks/chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md`
- AI Broker: `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md`
- Deployment: `docs/runbooks/devops/production-deployment-guide.md`
- Forms: `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`

**Key Patterns:**
- Components: Self-contained in `components/` with TypeScript interfaces
- API routes: `app/api/[endpoint]/route.ts` with proper error handling
- Business logic: `lib/` directory for calculations and utilities
- Validation: Zod schemas for all form handling and data structures
- Performance: Target <140KB gzipped bundle size

---

## Component Placement Decision Tree

**Before creating ANY file in app/ or components/, use the decision tree:**

See **[Component Placement Decision Tree](docs/COMPONENT_PLACEMENT_DECISION_TREE.md)** for the complete 6-question workflow.

**Quick summary:**
- Test/development pages → `app/_dev/`
- Experimental code → `components/archive/YYYY-MM/`
- Production pages → `app/[route-name]/`
- Reusable components → Domain-specific folders (ui, layout, forms, etc.)
- NO `.backup.tsx` files, NO `app/test-*` pages

**Key principle:** Every file must have clear purpose and proper location.

---

## Root Directory Requirements

See **[Root Directory Guide](docs/ROOT_DIRECTORY_GUIDE.md)** for complete file organization standards.

**Critical rules:**
- Only standard configs, package files, and 5 docs allowed at root
- NO `*.log`, `test-*.js`, `*.backup`, `*.patch` files
- NO temp files, status reports, or investigation docs
- Use proper directories: `docs/`, `scripts/`, `tests/`, `data/`

---

## Task Management

- Use TodoWrite tool to track all tasks
- Mark todos completed immediately after finishing (don't batch)
- Never discard tasks without Brent's approval
- Use journal for unrelated issues found during work

---

## Response-Awareness & Skills Architecture

**CRITICAL: Understanding the layered AI assistance system**

### Three-Layer System

**Layer 1: Upstream Reference** (`.claude/upstream-reference/`)
- Pristine copies of response-awareness framework from GitHub
- Used for comparison when syncing updates
- **NEVER modify** - reference only
- Download new versions here for manual comparison

**Layer 2: Configuration** (`.claude/config/`)
- `response-awareness-config.json` - Feature flags, paths, tier settings
- `logging-config.json` - Verbose logging, learning mode
- `agents-config.json` - Custom agents, model preferences
- **Modify freely** - these are your settings

**Layer 3: Working Files** (`.claude/skills/`, `.claude/commands/`, `.claude/agents/`)
- Your customized versions with NextNest integrations
- May differ from upstream (worktree checks, CLAUDE.md compliance, etc.)
- **Modify carefully** - preserve customizations when syncing upstream

### Key Skills Available

**From Response-Awareness Framework:**
- `/response-awareness` - Universal router (complexity assessment → tier routing)
- `response-awareness-light` - Single file, fast execution
- `response-awareness-medium` - Multi-file, optional planning
- `response-awareness-heavy` - Complex features, full planning
- `response-awareness-full` - Multi-domain architecture

**From Superpowers (adapted for NextNest):**
- `brainstorming` - Refine vague ideas into designs before planning
- `systematic-debugging` - Root cause investigation (NEVER skip this for bugs)

**NextNest Custom:**
- `worktree-helper` - Manage parallel development streams

### When to Use Each Skill

- **Bugs/Errors:** Use `systematic-debugging` (router detects "fix" keywords)
- **Vague Ideas:** Use `brainstorming` to clarify before planning
- **Clear Requirements:** Router assesses complexity and routes to appropriate tier
- **Parallel Work:** Router offers worktree when uncommitted changes conflict with new task

### Configuration-Driven Behavior

All paths and features come from config files (`.claude/config/*.json`), NOT hardcoded. Use `logging-config.json` for verbose logs, `response-awareness-config.json` for feature flags.

### Syncing with Upstream

**When response-awareness framework updates:**
1. Download latest ZIP → `.claude/upstream-reference/response-awareness-vX.X.X/`
2. Run comparison: `node scripts/compare-upstream.js vX.X.X`
3. Manually merge while preserving NextNest customizations
4. Update version in `.claude/config/response-awareness-config.json`

See [UPDATE_GUIDE.md](UPDATE_GUIDE.md) for full workflow.

### NextNest Customizations to Preserve

When syncing upstream, ALWAYS preserve:
1. **Configuration Loading** - Config file paths, feature flags, NextNest settings
2. **Worktree Integration** - Phase 0 pre-checks, worktree-helper deployment
3. **Brainstorming Pre-Checks** - Vague language detection, requirement clarification
4. **CLAUDE.md Compliance** - TDD enforcement, CANONICAL_REFERENCES checks, Component Placement, YAGNI
5. **Logging Paths** - `docs/completion_drive_logs/`, learning mode, plan persistence

### Communication Style for Skills

- Exploratory/vague requests → Offer brainstorming skill
- Bug reports → ALWAYS offer systematic-debugging
- Clear implementations → Route through response-awareness, announce tier

### Forbidden Patterns

❌ **Don't bypass skills when they apply:**
- Bug reported → Must offer systematic-debugging (don't jump to fixes)
- Vague idea → Offer brainstorming (don't assume requirements)
- Complex task → Use response-awareness tiers (don't implement ad-hoc)

❌ **Don't modify upstream reference files:**
- `.claude/upstream-reference/` is pristine - comparison only

❌ **Don't hardcode paths:**
- Always load from `.claude/config/*.json`

✅ **Do update configs when needs change:**
- Change logging verbosity → Edit `logging-config.json`
- Disable worktrees → Set `features.worktree_integration: false`
- Add custom agent → Update `agents-config.json`

---

## Planning & Documentation Workflow

**CRITICAL: One plan per feature. No proliferation.**

### 3-Tier Documentation System

**Before creating ANY documentation, understand the 3-tier hierarchy:**

**Tier 1: Code (Canonical Truth)**
- Location: Production code files listed in `CANONICAL_REFERENCES.md`
- Purpose: THE source of truth - actual implementation
- Examples: `instant-profile.ts`, `ProgressiveFormWithController.tsx`, `form-contracts.ts`
- Rule: **Check CANONICAL_REFERENCES.md before modifying ANY Tier 1 file**
- Change Process: Tests first → Update code → Update dependent files → Verify build

**Tier 2: Runbooks (Implementation Guides)**
- Location: `docs/runbooks/{domain}/`
- Purpose: HOW to implement features, linking to Tier 1 code
- Examples: `FORMS_ARCHITECTURE_GUIDE.md`, `AI_BROKER_COMPLETE_GUIDE.md`
- Rule: **NEVER duplicate code from Tier 1** - link to it with file:line references
- Update: When Tier 1 code changes significantly

**Tier 3: Plans (Temporary Decision Documents)**
- Location: `docs/plans/active/` (then archived)
- Purpose: WHAT to build and WHY, temporary task tracking
- Max Length: 200 lines
- Rule: **Reference runbooks, never duplicate them** - link to runbooks for "how"
- Lifecycle: Created → Executed → Completed → Archived

**Critical Rules:**
1. **Never duplicate Tier 1 code** in runbooks or plans - link to it instead
2. **Check CANONICAL_REFERENCES.md** before modifying core files
3. **Runbooks never expire** - plans do (archive after completion)
4. **Plans reference runbooks** - don't contain full implementation guides
5. **Never create new tiers** - everything fits into these 3 levels

**Examples:**
- ✅ Plan says: "Update instant-profile.ts calculation (see CANONICAL_REFERENCES.md for rules)"
- ✅ Runbook says: "See instant-profile.ts:245 for TDSR calculation implementation"
- ❌ Plan contains full code examples from instant-profile.ts
- ❌ Runbook duplicates calculation logic from instant-profile.ts

### Constraint Alignment (MANDATORY)

- **Before any planning or coding:**
  - Open `docs/plans/re-strategy/strategy-alignment-matrix.md` and `docs/plans/ROADMAP.md`.
  - Confirm the highest-priority constraint (row status emoji). If Constraint A isn’t ✅, do not work on downstream items.
  - Identify the relevant CAN task(s) for your work; if none exist, stop and ask Brent.

- **When drafting or updating a plan:**
  - Reference the constraint row explicitly (e.g., “Constraint B – Data In, Data Approved”).
  - Link the plan to the exact CAN task(s) in the backlog CSV.
  - Ensure runbooks are in place or scheduled via CAN tasks before implementation.

- **During implementation:**
  - Keep the matrix/roadmap statuses unchanged until exit criteria are met (tests, docs, evidence).
  - Stage 0 work must update `docs/plans/re-strategy/stage0-launch-gate.md` as checkpoints are cleared.

- **After completion:**
  - Update the matrix status emoji and add notes/evidence.
  - Update the roadmap phase notes if scope changed.
  - Log completion details in `docs/work-log.md` (constraint, CAN task, tests run).
  - Only then archive plans or move to the next constraint.

---

## Fractal Alignment System (Meta-Framework)

**Core Principle:** Every change exists at multiple tier levels, creating bidirectional verification like double-entry accounting.

**The Tiers:**
- **Tier 5:** Re-Strategy (`docs/plans/re-strategy/Part*.md`)
- **Tier 4:** Roadmap Constraints (`docs/plans/ROADMAP.md`)
- **Tier 3:** Active Plans (`docs/plans/active/*.md`)
- **Tier 2:** Runbooks (`docs/runbooks/**/*.md`)
- **Tier 1:** Code (`CANONICAL_REFERENCES.md` files)
- **Tier 0:** Tests (`tests/**/*.test.ts`)

**Fractal Balance Equation:** System is aligned when:
```
Every tier references tier above (↑ upward alignment)
AND
Every tier has evidence below (↓ downward verification)
AND
All work serves active constraint (single bottleneck)
AND
Audit trail exists in work log
```

### Mandatory Workflow

**Before ANY code change:**

1. **CHECK Phase** (5-10 minutes):
   ```bash
   # Run pre-implementation checks:
   # See: docs/runbooks/strategy/constraint-implementation-workflow.md Phase 0

   - Identify active constraint (from matrix)
   - Verify CAN task exists (from backlog)
   - Check runbook exists (or CAN task to create it)
   - Verify Tier 1 rules (from CANONICAL_REFERENCES.md)
   - Check for conflicts (work log, active plans)
   ```

   **If ANY check fails → STOP. Do not proceed to coding.**

2. **IMPLEMENT Phase**:
   ```typescript
   // In your code, create tier references:

   // Implementation follows: docs/runbooks/[domain]/[guide].md
   // Serves: Constraint [A/B/C/D], CAN-[###]

   // Then follow TDD cycle (see Critical Rules above)
   ```

3. **VERIFY Phase**:
   ```bash
   # After implementation:
   # See: docs/runbooks/strategy/constraint-implementation-workflow.md Phase 2

   - Collect evidence (tests, screenshots, metrics)
   - Verify success criteria from plan/roadmap
   - Update status in tier above (plan → constraint → matrix)
   - Link evidence in tracking docs
   - Update work log
   ```

**If you skip CHECK phase → Code may not align with re-strategy → Rework required.**

### Implementation Runbooks

For detailed step-by-step workflows:

- **Before starting work:** `docs/runbooks/strategy/constraint-implementation-workflow.md`
- **Weekly reviews:** `docs/runbooks/strategy/weekly-constraint-review.md`
- **Codebase audits:** `docs/runbooks/strategy/constraint-a-audit-checklist.md`
- **System architecture:** `docs/runbooks/strategy/fractal-alignment-system.md`

### Drift Detection

**System is BALANCED when:**
- ✅ One constraint showing 🟡 (all others ⬜ or ✅)
- ✅ All active plans reference same constraint
- ✅ Runbooks exist before code (or CAN task scheduled)
- ✅ Evidence linked for all ✅ status claims
- ✅ Work log updated weekly

**System is DRIFTING when:**
- 🚩 Multiple constraints showing 🟡
- 🚩 Plans working on future constraints
- 🚩 Code committed before runbooks created
- 🚩 Status ✅ without evidence links
- 🚩 Work log silent for >1 week

**Weekly constraint review detects drift → Remediate within 1 week (not months).**

---

### Planning Rules

**File format:** `docs/plans/active/{date}-{feature-slug}.md`

**Maximum length: 200 lines**
- If longer, split into multiple plans OR extract to runbook
- Plans contain DECISIONS (what to build, why, testing)
- Plans do NOT contain INSTRUCTIONS (code examples, tutorials)

See **[Planning Templates](docs/PLANNING_TEMPLATES.md)** for:
- Plan template structure (required sections, frontmatter format)
- Pre-implementation checklist (file placement, test planning)
- Work-log entry format (daily progress tracking)
- Completion report template (outcome documentation)

**Plan size management:**
- Red flags: code examples >20 lines, "read this first" prerequisites, troubleshooting sections, copy-paste tutorials
- If too large: extract code examples to runbooks, link to existing docs, or split into phases
- Check `docs/plans/active/` before creating new plans - update existing instead of duplicating
- **Automated validation:** Pre-commit hook checks plan lengths (soft limit: 180 lines, hard limit: 250 lines)
- **Manual check:** Run `bash scripts/validate-plan-length.sh` to validate all active plans before committing

### Execution Rules

**During implementation:**
- Use ONLY: TodoWrite tool, `docs/work-log.md`, git commits
- DO NOT create: new plans, investigation reports, status updates, fix summaries

### Completion Rules

**Create ONE completion report when fully done:**
- File format: `docs/plans/active/{date}-{feature-slug}-COMPLETION.md`
- When: All tasks completed/deferred, all tests passing, code merged
- Archive immediately after completion to `docs/plans/archive/{year}/{month}/`

### Forbidden: Root-Level Documentation

**NEVER create these at repository root:**
- `*_SUMMARY.md`, `*_REPORT.md`, `*_FIX.md`, `*_STATUS.md`, `*_IMPLEMENTATION.md`, `*.txt` status files
- **Exception:** README.md, CLAUDE.md, AGENTS.md, SKILL.md, standard configs

### Quick Reference: Where Things Go

| Document Type | Location |
|---------------|----------|
| Active plan | `docs/plans/active/` |
| Implementation todos | TodoWrite tool |
| Daily notes | `docs/work-log.md` |
| Completion report | `docs/plans/active/` then archive |
| Archived plans | `docs/plans/archive/{year}/{month}/` |
| Implementation guides | `docs/runbooks/{domain}/` |
| Investigation findings | `docs/work-log.md` |
