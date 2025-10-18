# Model Selection Strategy - Response-Awareness Framework

**Created**: 2025-10-16
**Status**: ✅ Active

---

## Overview

The Response-Awareness Framework uses a hybrid model strategy to balance quality, speed, and cost:

- **Haiku 3.5**: Fast, cost-efficient implementation for clear instructions
- **Sonnet 4.5**: Strong metacognition for planning, synthesis, and verification

---

## Model Selection by Tier

| Tier | Scout | Planning | Implementation | Verification | Cost Savings |
|------|-------|----------|----------------|--------------|--------------|
| **LIGHT** | Haiku | N/A | Haiku | Haiku (optional) | ~70% |
| **MEDIUM** | Haiku | Sonnet (orchestrator) | Haiku | Sonnet (orchestrator) | ~40% |
| **HEAVY** | Haiku | Sonnet | Sonnet | Sonnet | ~30% (scout only) |
| **FULL** | Haiku | Sonnet | Sonnet | Sonnet | ~10% (scout only) |

---

## Decision Matrix

### Always Haiku
✅ **Complexity-Scout** (all tiers)
- Objective measurement (file counts, pattern matching)
- Clear instructions, no ambiguity
- 2x faster, 1/3 cost
- No metacognition needed

### Haiku for LIGHT & MEDIUM Implementation
✅ **LIGHT tier implementation**
- Single file, clear requirements
- Excellent instruction-following
- Fast turnaround critical

✅ **MEDIUM tier implementation**
- 2-5 files with clear plan from Sonnet orchestrator
- Well-defined specifications
- Haiku sweet spot

### Always Sonnet
🧠 **HEAVY tier** (all phases)
- Multi-path exploration needs pattern recognition
- Synthesis needs spotting contradictions
- Implementation needs catching assumptions (#COMPLETION_DRIVE)
- Verification needs finding subtle issues

🧠 **FULL tier** (all phases)
- Multi-domain complexity demands maximum metacognition
- Survey: Stakeholder identification across systems
- Planning: Cross-domain integration points
- Synthesis: Unifying disparate approaches
- Implementation: Multi-system coordination
- Verification: System-wide issue detection

---

## Why Haiku Works for LIGHT & MEDIUM

### Haiku Strengths
- **2x faster** than Sonnet (critical for simple tasks)
- **1/3 the cost** (significant savings on high-volume work)
- **Excellent instruction-following** (when instructions are clear)
- **Pattern replication** (follows established patterns well)

### When Haiku Works Best
- Clear, explicit requirements
- Well-defined specification from Sonnet planning
- 1-5 files with straightforward changes
- Established patterns to follow
- Mechanical transformations (refactoring, cleanup)

### Why Sonnet Orchestrates (MEDIUM)
- Sonnet creates the clear plan
- Haiku executes the plan
- Sonnet verifies the results
- Best of both: metacognition + speed

---

## Why Sonnet Required for HEAVY & FULL

### Metacognitive Demands
**HEAVY tier (5+ files, architectural decisions):**
- Recognizing alternative approaches (#PATH_DECISION)
- Spotting assumptions (#COMPLETION_DRIVE)
- Catching pattern momentum (#CARGO_CULT)
- Synthesis: Unifying multiple planning approaches
- Verification: Tag resolution across complex work

**FULL tier (multi-domain, system-wide):**
- All HEAVY demands, plus:
- Cross-domain integration contracts
- Stakeholder identification across systems
- Contradiction detection across domains
- Multi-system coordination
- System-wide verification

### Haiku Limitations at Complexity
- Weaker metacognition (may miss alternatives)
- Less able to catch own assumptions
- Reduced pattern recognition across complex contexts
- Synthesis quality lower for multi-path scenarios
- Verification may miss subtle integration issues

---

## Cost/Benefit Analysis

### LIGHT Tier (Haiku)
- **Savings**: ~70% (all Haiku except orchestrator)
- **Risk**: Low (simple tasks, easy to verify)
- **ROI**: High (huge savings, minimal risk)

### MEDIUM Tier (Hybrid)
- **Savings**: ~40% (Haiku implementers, Sonnet orchestration)
- **Risk**: Low-Medium (Sonnet creates clear plans)
- **ROI**: High (good savings, quality maintained)

### HEAVY Tier (Mostly Sonnet)
- **Savings**: ~30% (Haiku scout only)
- **Risk**: Medium-High (complex work needs metacognition)
- **ROI**: Medium (some savings, quality critical)

### FULL Tier (All Sonnet)
- **Savings**: ~10% (Haiku scout only)
- **Risk**: High (system-wide changes high-stakes)
- **ROI**: Low savings, but quality paramount

---

## Deployment Patterns

### LIGHT Tier
```python
# Direct implementation or single Haiku agent
Task(
    subagent_type="general-purpose",
    model="claude-3-5-haiku-20241022",  # Fast Haiku
    description="Fix validation bug in user_form.py",
    prompt="[clear, specific instructions]"
)
```

### MEDIUM Tier
```python
# Sonnet orchestrator creates plan, Haiku executes
Task(
    subagent_type="data-architect",
    model="claude-3-5-haiku-20241022",  # Haiku implementer
    description="Implement skill tree data model",
    prompt="""
    Implement per this specification:
    [Clear, detailed specification from Sonnet planning]
    """
)
```

### HEAVY Tier
```python
# All Sonnet for metacognition
Task(
    subagent_type="data-architect",
    model="claude-sonnet-4-5-20250929",  # Sonnet for all phases
    description="Plan data model for multi-enemy combat",
    prompt="Design data model for multi-enemy combat system..."
)
```

### FULL Tier
```python
# All Sonnet, all phases
Task(
    subagent_type="plan-synthesis-agent",
    model="claude-sonnet-4-5-20250929",  # Synthesis MUST be Sonnet
    description="Synthesize skill tree planning approaches",
    prompt="Synthesize skill tree planning approaches..."
)
```

---

## Scout Deployment (All Tiers)

**ALWAYS use Haiku for complexity-scout:**

```python
Task(
    subagent_type="general-purpose",
    model="claude-3-5-haiku-20241022",  # Haiku for speed + cost
    description="Analyze task complexity for response-awareness routing",
    prompt="""
    You are analyzing task complexity for the Response-Awareness Framework.

    Task: [user's request]

    Analyze the codebase and provide scored assessment:
    1. File Scope (0-3): How many files affected?
    2. Requirement Clarity (0-3): How clear are requirements?
    3. Integration Risk (0-3): What's the integration complexity?
    4. Change Type (0-3): Cosmetic vs architectural?

    Provide:
    - Score for each dimension with reasoning
    - Total score (0-12)
    - Recommended tier (LIGHT/MEDIUM/HEAVY/FULL)
    """
)
```

---

## Key Principles

1. **Scout always Haiku** - objective measurement, no metacognition needed
2. **LIGHT/MEDIUM implementation uses Haiku** - clear instructions, speed matters
3. **HEAVY/FULL uses all Sonnet** - metacognition critical for complexity
4. **Synthesis always Sonnet** - hardest cognitive task, cannot delegate
5. **Verification matches tier** - LIGHT/MEDIUM can use Haiku, HEAVY/FULL needs Sonnet

---

## Migration Notes

**Updated files:**
- `.claude/commands/response-awareness.md` - Router with Haiku scout guidance
- `.claude/skills/response-awareness-light/SKILL.md` - Haiku implementation
- `.claude/skills/response-awareness-medium/SKILL.md` - Hybrid (Sonnet orchestrates, Haiku implements)
- `.claude/skills/response-awareness-heavy/SKILL.md` - All Sonnet
- `.claude/skills/response-awareness-full/SKILL.md` - All Sonnet

**Backward compatibility:**
- No breaking changes to API
- Model parameter optional (can still omit, defaults to Sonnet)
- Explicit model selection recommended for clarity

---

## Future Optimizations

**Potential Haiku expansions:**
- Phase 5 (Documentation) in FULL tier - template-based docs
- Simple refactoring in HEAVY tier - mechanical transformations
- Data model implementation in HEAVY tier (if synthesis very explicit)

**Monitor for:**
- Haiku metacognition improvements (may expand usage)
- Cost changes (may shift tier thresholds)
- Quality metrics (verify Haiku success rate in MEDIUM)

---

**Version**: 1.0
**Last Updated**: 2025-10-16
**Strategy**: Hybrid (Haiku for speed/cost, Sonnet for metacognition)
