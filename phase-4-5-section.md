### Phase 4.5: Post-Execution Verification

**Purpose**: Verify that agent-claimed work actually landed in files, preventing false success reporting.

**Why This Phase Exists**: Implementation agents may report success based on generating plans rather than executing actual file modifications. This phase catches the claim vs. reality gap.

**MAIN AGENT ACTIONS**:

After Phase 4 completion, BEFORE Phase 5:

1. **Deploy Post-Execution Verifier**:
   - Use Task tool to deploy `metacognitive-tag-verifier` agent
   - Provide Phase 3 & 4 completion reports as input
   - Provide list of files that should have been modified

2. **Track verification status**:
   - PENDING → IN_PROGRESS → COMPLETED/FAILED

3. **Handle verification results**:
   - If VERIFIED: Proceed to Phase 5
   - If FAILED: Mark agents as FAILED, deploy corrective agents with READ-FIRST constraints

**VERIFICATION AGENT INSTRUCTIONS**:

```markdown
## Task: Post-Execution Verification

**Objective**: Verify implementation claims match file reality

**Actions**:

### 1. Security Cleanup Verification

If implementation claimed "removed hardcoded credentials":

```bash
# Verify tokens actually removed
grep -r "hardcoded_pattern" target_directory/ | wc -l
# Expected: 0 or minimal (docs/examples only)
```

Report Format:
```
- Claimed: Modified 11 files
- Verified: grep found 22 remaining instances
- Status: ❌ FAILED
- Action: Re-deploy with READ-FIRST constraint
```

### 2. File Deletion Verification

```bash
ls file/that/should/be/gone 2>&1 | grep "No such file"
# Expected: "No such file or directory"
```

### 3. File Creation Verification

```bash
wc -l path/to/new/file.md
# Expected: >500 lines for "comprehensive" guide
```

### 4. Content Modification Verification

```bash
grep -r "old_pattern" files/ | wc -l  # Should be 0
grep -r "new_pattern" files/ | wc -l  # Should be >0
```

### 5. Cross-Reference Agent Claims vs. Reality

For EACH implementation agent's report:

```
Agent: [Name]
Claimed: Modified file1.js, file2.js, file3.ts

Verification:
1. file1.js - Read file - grep for expected change
   Status: ❌ NOT FOUND (claim false)
2. file2.js - Read file - grep for expected change
   Status: ❌ NOT FOUND (claim false)
3. file3.ts - Read file - grep for expected change
   Status: ✅ VERIFIED

Overall: FAILED (66% unverified)
```

**REQUIRED OUTPUT**:

```markdown
# Phase 4.5 Verification Report

## Summary Table

| Agent | Claimed | Verified | Failed | Status |
|-------|---------|----------|--------|--------|
| Security | 11 files | 3 | 8 | ❌ FAILED |
| Archive | 9 deletes | 9 | 0 | ✅ VERIFIED |

## Detailed Failures

### Security Agent
- Claimed: Modified scripts/*.js to use env vars
- Reality: Only 3 files changed
- Evidence: `grep process.env.PATTERN scripts/*.js | wc -l` returned 3
- Root Cause: Edit tool requires Read first, batch edits failed
- Correction: Deploy agent with Node.js script approach

## Overall Status

PHASE 4.5: ❌ FAILED

Critical Issues: 1 (security cleanup incomplete)

Recommendation: Deploy corrective agents before Phase 5
```
```

**Why This Works Without Overloading Orchestrator**:

- Orchestrator only deploys agent and reads report (coordination)
- Verification agent does actual grep/ls/read work (execution)
- Preserves cognitive load separation
