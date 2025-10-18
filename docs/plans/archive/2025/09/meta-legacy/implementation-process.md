---
title: implementation-process
type: meta
owner: engineering
last-reviewed: 2025-09-30
---

# 🔧 IMPLEMENTATION PROCESS
**How to Stick to the Single Source of Truth**
**Reference**: MASTER_IMPLEMENTATION_PLAN.md

---

## 🎯 MANDATORY PROCESS FOR ALL CODE CHANGES

### **STEP 1: Before Writing Any Code** ⚠️ CRITICAL

#### 1.1 Reference Check
```bash
# Always start here:
1. Open MASTER_IMPLEMENTATION_PLAN.md
2. Confirm current task priority (Week 1/2/3)
3. Check task status (NOT STARTED/IN PROGRESS)
4. Read implementation checklist
```

#### 1.2 Context Validation (Per Framework)
```bash
# Required reading before ANY change:
1. Read Remap/NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md
2. Check Remap/field-mapping.md for field definitions
3. Verify Remap/frontend-backend-ai-architecture.md for technical specs
```

#### 1.3 Task List Update
```bash
# Update task-list.md:
1. Mark current task as "In Progress"
2. Note start time and approach
3. Identify any potential blockers
```

### **STEP 2: During Implementation** 🔄

#### 2.1 Incremental Progress
```typescript
// For each subtask (e.g., 1.1, 1.2, 1.3):
1. Complete ONE subtask at a time
2. Test immediately
3. Check off in task-list.md
4. Commit changes with clear message
```

#### 2.2 Validation Checks
```bash
# After each subtask:
npm run type-check  # TypeScript compilation
npm run lint        # Code quality
npm run dev         # Test in browser

# ⚠️ HOMEPAGE ISSUE PREVENTION:
# If CSS not loading or "Cannot find module" errors:
1. Kill server (Ctrl+C)
2. rm -rf .next      # Clear corrupted cache
3. npm run dev       # Restart fresh
4. Verify homepage loads with styling before continuing
```

#### 2.3 Architecture Alignment
```typescript
// Before proceeding to next subtask:
1. Verify change aligns with MASTER_IMPLEMENTATION_PLAN.md specs
2. Check no conflicts with field-mapping.md
3. Ensure follows frontend-backend-ai-architecture.md patterns
```

### **STEP 3: After Completing Task** ✅

#### 3.1 Final Validation
```bash
# Complete testing sequence:
1. Test all gate progressions (0→1→2→3)
2. Test different loan types (new_purchase/refinance/commercial)
3. Verify form submission works
4. Check console for errors
```

#### 3.2 Documentation Updates
```typescript
// Update tracking documents:
1. Mark task as COMPLETED in MASTER_IMPLEMENTATION_PLAN.md
2. Update progress percentage in task-list.md
3. Note any deviations or learnings
```

#### 3.3 Commit Strategy
```bash
git add .
git commit -m "feat(task-X): [descriptive message]

- Implemented [specific feature]
- Updated [specific files]
- Tested [specific scenarios]
- Refs: MASTER_IMPLEMENTATION_PLAN.md Task X"
```

---

## 📋 DAILY WORKFLOW TEMPLATE

### Morning Startup Routine
```markdown
1. Open MASTER_IMPLEMENTATION_PLAN.md
2. Check current week focus (Week 1: Critical Path)
3. Identify today's target task
4. Read relevant technical specs in Remap/
5. Update task-list.md with today's plan
```

### During Development
```markdown
1. Work on ONE subtask at a time
2. Test after each change
3. Reference architecture docs when stuck
4. Check off completed items in task-list.md
5. Commit frequently with clear messages
```

### End of Day Review
```markdown
1. Update MASTER_IMPLEMENTATION_PLAN.md with progress
2. Note any blockers discovered
3. Plan tomorrow's focus
4. Commit all changes
5. Update Session_Context/ if needed
```

---

## 🚨 RED FLAGS - WHEN TO STOP

### Stop Implementation If:
- ❌ Change conflicts with field-mapping.md definitions
- ❌ Breaks existing gate progression
- ❌ TypeScript compilation fails
- ❌ Creates architectural inconsistencies
- ❌ Deviates from MASTER_IMPLEMENTATION_PLAN.md without documentation

### Resolution Process:
```markdown
1. Document the conflict in task-list.md
2. Reference NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md
3. Update architecture docs if needed
4. Get alignment before proceeding
```

---

## 📊 PROGRESS TRACKING SYSTEM

### Task Status Levels
```typescript
NOT STARTED → IN PROGRESS → TESTING → COMPLETED
```

### Progress Indicators
```markdown
Week 1 Goals:
- [ ] Gate 3 functional (Task 1) - 0% ❌
- [ ] Schema updates (Task 2) - 0% ❌ 
- [ ] Property routing (Task 3) - 0% ❌

Daily Progress:
- Today's Target: Task 1.1 (renderGate3Fields)
- Completion: 0/6 subtasks ❌
- Blockers: None yet
```

---

## 🔧 IMPLEMENTATION CHECKLIST

### Before Starting Any Task
- [ ] Read MASTER_IMPLEMENTATION_PLAN.md task description
- [ ] Check field-mapping.md for field requirements
- [ ] Review frontend-backend-ai-architecture.md for patterns
- [ ] Update task-list.md status to "IN PROGRESS"
- [ ] **Clear Next.js cache**: rm -rf .next
- [ ] Ensure dev environment is running (npm run dev)
- [ ] **Verify homepage loads** with full styling before starting

### During Implementation
- [ ] Complete subtasks in order (1.1 → 1.2 → 1.3...)
- [ ] Test after each subtask
- [ ] Check TypeScript compilation
- [ ] Verify no console errors
- [ ] Check off completed items in task-list.md

### After Completing Task
- [ ] Test complete gate progression
- [ ] Verify all loan type paths work
- [ ] **Kill server and clear cache**: rm -rf .next
- [ ] **Test production build**: npm run build
- [ ] **Restart dev server**: npm run dev
- [ ] **Verify homepage + new functionality** work correctly
- [ ] Update MASTER_IMPLEMENTATION_PLAN.md status
- [ ] Commit with descriptive message
- [ ] Move to next task in sequence

---

## 📁 QUICK REFERENCE FILES

### Always Open These Files
```
1. MASTER_IMPLEMENTATION_PLAN.md (main reference)
2. task-list.md (daily tracking)
3. Remap/field-mapping.md (field definitions)
4. components/forms/ProgressiveForm.tsx (current work)
```

### Reference When Needed
```
- Remap/NEXTNEST_CONTEXT_VALIDATION_FRAMEWORK.md (validation process)
- Remap/frontend-backend-ai-architecture.md (technical patterns)  
- lib/validation/mortgage-schemas.ts (schema definitions)
- types/mortgage.ts (type definitions)
```

---

## 💡 SUCCESS PATTERNS

### Proven Approach
1. **Read First** - Always check docs before coding
2. **Small Steps** - Complete one subtask at a time  
3. **Test Often** - Verify each change immediately
4. **Document Progress** - Keep task-list.md updated
5. **Stay Aligned** - Reference architecture docs frequently

### Avoid These Mistakes
- ❌ Coding without reading task specifications
- ❌ Making multiple changes without testing
- ❌ Skipping TypeScript compilation checks
- ❌ Not updating progress tracking
- ❌ Deviating from planned architecture

---

## 🎯 CURRENT FOCUS REMINDER

**Week 1 Priority**: Task 1 - Implement Gate 3
**Critical Path**: Gate 3 is blocking everything else
**Next File**: `components/forms/ProgressiveForm.tsx`
**Next Action**: Add renderGate3Fields() function

**Remember**: Every change must align with the single source of truth in MASTER_IMPLEMENTATION_PLAN.md