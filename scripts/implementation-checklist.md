# 🎯 NEXTNEST IMPLEMENTATION CHECKLIST
**Mandatory Process for ALL Code Changes**

## 🚨 BEFORE WRITING ANY CODE

### Step 1: Context Validation
```bash
# Run this command FIRST - blocks implementation if context gaps found
node scripts/validate-context.js
```

**Expected Output:**
```
✅ PHASE 1: DOMAIN KNOWLEDGE VALIDATED
✅ PHASE 2: CONSISTENCY VALIDATED  
✅ PHASE 3: IMPLEMENTATION READINESS VALIDATED
✅ PHASE 4: DOCUMENTATION ALIGNED
🚀 VALIDATION COMPLETE - READY FOR SAFE IMPLEMENTATION
```

**If validation fails:**
```
❌ CRITICAL ERRORS FOUND:
🛑 IMPLEMENTATION BLOCKED - FIX ERRORS BEFORE PROCEEDING
```

### Step 2: Change Impact Assessment

Fill out this matrix BEFORE implementation:

```yaml
Change Description: [Describe what you're changing]
Change Type: [field_addition | calculation_update | workflow_change | api_modification]

Impact Areas:
  Frontend Components:
    - [ ] components/forms/IntelligentMortgageForm.tsx
    - [ ] components/forms/ProgressiveForm.tsx  
    - [ ] components/forms/LoanTypeSelector.tsx
    - [ ] Other: ________________
    
  Backend Systems:
    - [ ] app/api/forms/analyze/route.ts
    - [ ] lib/calculations/mortgage.ts
    - [ ] lib/calculations/urgency-calculator.ts
    - [ ] Other: ________________
    
  External Integrations:
    - [ ] n8n workflows
    - [ ] Webhook endpoints
    - [ ] Third-party APIs
    - [ ] Other: ________________
    
  Documentation:
    - [ ] NEXTNEST_GATE_STRUCTURE_ROUNDTABLE.md
    - [ ] AI_INTELLIGENT_LEAD_FORM_IMPLEMENTATION_PLAN.md
    - [ ] ROUNDTABLE_PROGRESSIVE_FORM_N8N_INTEGRATION.md
    - [ ] Other: ________________

Contract Verification:
  - [ ] Field names consistent across all systems
  - [ ] Data types match between layers
  - [ ] Function signatures remain compatible
  - [ ] API inputs/outputs unchanged (or properly versioned)

Risk Assessment:
  - [ ] No existing functionality will break
  - [ ] Rollback plan defined
  - [ ] Testing strategy defined
  - [ ] Success criteria established
```

## 🔧 DURING IMPLEMENTATION

### Step 3: Atomic Implementation with Real-time Validation

Use this pattern for ALL changes:

```typescript
// MANDATORY IMPLEMENTATION PATTERN

interface ImplementationStep {
  step: number
  description: string
  files: string[]
  preValidation: string[]  // Commands to run before
  postValidation: string[] // Commands to run after
  rollbackPlan: string[]   // How to undo if fails
}

const implementationPlan: ImplementationStep[] = [
  {
    step: 1,
    description: "Update calculation logic",
    files: ["lib/calculations/mortgage.ts"],
    preValidation: [
      "npm run type-check",
      "node scripts/validate-context.js"
    ],
    postValidation: [
      "npm run type-check", 
      "npm test lib/calculations/mortgage.test.ts",
      "node scripts/validate-context.js"
    ],
    rollbackPlan: [
      "git checkout HEAD -- lib/calculations/mortgage.ts"
    ]
  },
  
  {
    step: 2, 
    description: "Update API integration",
    files: ["app/api/forms/analyze/route.ts"],
    preValidation: [
      "curl -X GET http://localhost:3000/api/forms/analyze",
      "node scripts/validate-context.js"
    ],
    postValidation: [
      "npm run type-check",
      "curl -X POST http://localhost:3000/api/forms/analyze -d '{}' -H 'Content-Type: application/json'",
      "node scripts/validate-context.js"
    ],
    rollbackPlan: [
      "git checkout HEAD -- app/api/forms/analyze/route.ts"
    ]
  }
  
  // Add more steps as needed...
]
```

### Step 4: Execute with Continuous Validation

For each implementation step:

```bash
# Before making changes
npm run type-check
node scripts/validate-context.js

# Make your changes to the files

# Immediately after changes  
npm run type-check
node scripts/validate-context.js
npm test [relevant-test-files]

# If any validation fails:
git checkout HEAD -- [changed-files]  # Rollback
# Fix issues and retry
```

## 🧪 AFTER IMPLEMENTATION  

### Step 5: Comprehensive Testing

```bash
# 1. Type safety
npm run type-check

# 2. Build verification
npm run build

# 3. Linting
npm run lint

# 4. Context validation
node scripts/validate-context.js

# 5. Functional testing
npm run dev
# Manually test affected functionality

# 6. Integration testing
# Test form submission -> API -> n8n flow
# Test fallback scenarios
# Test error handling
```

### Step 6: Regression Testing

```bash
# Test existing scenarios still work
curl -X POST http://localhost:3000/api/forms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "loanType": "new_purchase",
      "name": "Test User", 
      "email": "test@example.com",
      "phone": "91234567",
      "propertyType": "HDB",
      "priceRange": 800000,
      "purchaseTimeline": "this_month"
    },
    "metadata": {
      "sessionId": "test-session",
      "submissionPoint": "gate2",
      "n8nGate": "G2", 
      "timestamp": "2025-08-31T00:00:00.000Z"
    }
  }'

# Expected: Successful response with insights
```

### Step 7: Documentation Update

```bash
# Update documentation if needed
# 1. Check what docs are affected by your change
grep -r "your-changed-field" *.md

# 2. Update affected documentation
# 3. Verify documentation consistency
node scripts/validate-context.js

# 4. Commit documentation WITH code changes
git add .
git commit -m "feat: your change + updated docs"
```

## 📊 SUCCESS CRITERIA

### ✅ Implementation Successful When:

```bash
# All these commands pass:
node scripts/validate-context.js          # Context aligned
npm run type-check                        # TypeScript valid
npm run build                             # Build succeeds  
npm run lint                              # Code quality good
npm test                                  # Tests pass
curl -X GET http://localhost:3000/api/forms/analyze  # Health check passes

# And manual verification:
# ✅ Form still works through all 4 gates
# ✅ Calculations produce expected results
# ✅ API submissions succeed
# ✅ n8n integration works (or fallback works)
# ✅ No existing functionality broken
# ✅ Documentation reflects changes
```

### ❌ Implementation Failed - Rollback Required When:

```bash
# Any of these fail:
node scripts/validate-context.js    # ❌ Context validation failed
npm run type-check                  # ❌ TypeScript errors
npm run build                       # ❌ Build failed
# OR manual verification shows:
# ❌ Form progression broken
# ❌ Calculations return unexpected results  
# ❌ API returns errors
# ❌ Existing functionality broken
```

## 🎯 QUICK REFERENCE COMMANDS

### Before Any Change
```bash
node scripts/validate-context.js
```

### During Implementation (after each file change)
```bash
npm run type-check && node scripts/validate-context.js
```

### Before Committing
```bash
npm run type-check && npm run build && npm run lint && node scripts/validate-context.js
```

### Emergency Rollback
```bash
git checkout HEAD -- [changed-files]
npm run type-check
node scripts/validate-context.js
```

## 🛡️ ENFORCEMENT

### Code Review Requirements
- [ ] Implementation checklist completed
- [ ] `node scripts/validate-context.js` passes
- [ ] All validation commands pass
- [ ] Documentation updated if needed
- [ ] Regression testing completed

### CI/CD Integration
Add to your CI pipeline:
```yaml
steps:
  - name: Context Validation
    run: node scripts/validate-context.js
    
  - name: Type Check  
    run: npm run type-check
    
  - name: Build
    run: npm run build
    
  - name: Lint
    run: npm run lint
```

---

**This checklist enforces the Context Validation Framework and prevents architectural fragmentation.**

**Use this for EVERY change - no exceptions.**