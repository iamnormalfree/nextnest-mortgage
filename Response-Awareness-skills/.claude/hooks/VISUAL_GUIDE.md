# Orchestrator Firewall - Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLAUDE CODE SESSION                          │
│                                                                     │
│  User: /response-awareness-heavy "Add authentication"              │
│                                                                     │
│  Assistant: ## Phase 1: Planning                                   │
│  ┌────────────────────────────────────────────────┐               │
│  │  Task(subagent_type="general-purpose", ...)    │               │
│  │  [Planning agent deployed] ← ORCHESTRATOR MODE │               │
│  └────────────────────────────────────────────────┘               │
│                                                                     │
│  Assistant: ## Phase 2: Synthesis                                  │
│  [Synthesize approaches...]                                        │
│                                                                     │
│  Assistant: ## Phase 3: Implementation                             │
│  "Now I'll implement..."                                           │
│                                                                     │
│  ⚠️  CRITICAL MOMENT: About to use Edit() ⚠️                        │
│                           ↓                                         │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR FIREWALL HOOK                       │
│                   (before_tool_use: Edit)                           │
│                                                                     │
│  1. RECEIVE CONVERSATION CONTEXT                                   │
│     ├─ Full conversation history                                   │
│     ├─ Tool being invoked (Edit)                                   │
│     └─ Environment context                                         │
│                                                                     │
│  2. STATE DETECTION                                                │
│     ┌────────────────────────────────────────┐                    │
│     │ Tier Detection                         │                    │
│     │ ├─ Scan: /response-awareness-heavy     │                    │
│     │ └─ Result: HEAVY ✅                     │                    │
│     ├────────────────────────────────────────┤                    │
│     │ Task() Detection                       │                    │
│     │ ├─ Scan: Task(subagent_type=           │                    │
│     │ └─ Result: YES ✅                       │                    │
│     ├────────────────────────────────────────┤                    │
│     │ Phase Detection                        │                    │
│     │ ├─ Scan: ## Phase 3: Implementation    │                    │
│     │ └─ Result: Phase 3 ✅                   │                    │
│     ├────────────────────────────────────────┤                    │
│     │ Agent Detection                        │                    │
│     │ ├─ Scan: "You are implementing..."    │                    │
│     │ └─ Result: NO (not deployed agent) ✅   │                    │
│     └────────────────────────────────────────┘                    │
│                                                                     │
│  3. ORCHESTRATOR ANALYSIS                                          │
│     ├─ Tier: HEAVY → Orchestrator-only ✅                          │
│     ├─ Task() used: YES → Orchestrator ✅                          │
│     ├─ Deployed agent: NO → Not implementer ✅                     │
│     └─ Conclusion: ORCHESTRATOR IMPLEMENTING (VIOLATION!) ❌        │
│                                                                     │
│  4. DECISION: BLOCK ❌                                              │
│     ├─ Severity: BLOCK                                             │
│     ├─ Message: HEAVY_orchestrator_phase3                          │
│     └─ Exit code: 1 (prevent tool execution)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        USER SEES MESSAGE                            │
│                                                                     │
│  🛑 ORCHESTRATOR FIREWALL - CRITICAL VIOLATION                      │
│                                                                     │
│  HEAVY/FULL TIER - ORCHESTRATOR MODE                               │
│                                                                     │
│  State Detected:                                                   │
│  - Tier: HEAVY                                                     │
│  - Phase: 3                                                        │
│  - Task() usage: YES                                               │
│  - Role: ORCHESTRATOR                                              │
│                                                                     │
│  ❌ CRITICAL RULE VIOLATION:                                        │
│  HEAVY/FULL tier orchestrators NEVER implement directly            │
│                                                                     │
│  Required Action:                                                  │
│  Deploy implementation agents:                                     │
│                                                                     │
│      Task(subagent_type="general-purpose",                         │
│           description="Implement auth system",                     │
│           prompt="...")                                            │
│                                                                     │
│  ❌ Tool execution BLOCKED by orchestrator firewall                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      USER CORRECTS BEHAVIOR                         │
│                                                                     │
│  Assistant: You're right, I should deploy agents.                  │
│                                                                     │
│  Task(                                                             │
│      subagent_type="general-purpose",                              │
│      description="Implement authentication system",                │
│      prompt="""                                                    │
│      You are implementing the authentication system.               │
│                                                                     │
│      Files: auth_service.py, user_model.py, auth_routes.py        │
│      Architecture: [design from synthesis]                         │
│      ...                                                           │
│      """                                                           │
│  )                                                                 │
│                                                                     │
│  ✅ CORRECT: Orchestrator delegating, agent implementing           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tier Decision Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ABOUT TO USE Edit/Write                         │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
                  ┌─────────────────┐
                  │ What tier?      │
                  └─────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
    ┌──────┐           ┌──────┐           ┌──────┐
    │ NONE │           │LIGHT │           │MEDIUM│
    └──────┘           └──────┘           └──────┘
        ↓                   ↓                   ↓
   ✅ ALLOW         ┌───────┴───────┐     ┌─────┴─────┐
                    ↓               ↓     ↓           ↓
              ┌──────────┐   ┌──────────┐│Task()?   │Task()?
              │Task()?   │   │Task()?   ││NO        │YES
              │NO        │   │YES       │└─────┬─────┘
              └────┬─────┘   └────┬─────┘      ↓
                   ↓              ↓        ⚠️ WARN   🛑 BLOCK
              ✅ ALLOW       ⚠️ WARN

        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
    ┌──────┐           ┌──────┐           ┌──────┐
    │HEAVY │           │ FULL │           │ AUTO │
    └──────┘           └──────┘           └──────┘
        ↓                   ↓                   ↓
   🛑 BLOCK            🛑 BLOCK         ┌───────┴───────┐
                                        ↓               ↓
                                  ┌──────────┐   ┌──────────┐
                                  │Task()?   │   │Task()?   │
                                  │NO        │   │YES       │
                                  └────┬─────┘   └────┬─────┘
                                       ↓              ↓
                                  ✅ ALLOW       🛑 BLOCK
```

---

## State Detection Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONVERSATION ANALYSIS                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │  Step 1: TIER DETECTION                           │
    │  ───────────────────────────────────────          │
    │  Pattern: /response-awareness-{tier}              │
    │                                                   │
    │  Scan conversation for:                           │
    │  ├─ /response-awareness-full   → FULL            │
    │  ├─ /response-awareness-heavy  → HEAVY           │
    │  ├─ /response-awareness-medium → MEDIUM          │
    │  ├─ /response-awareness-light  → LIGHT           │
    │  ├─ /response-awareness        → AUTO            │
    │  └─ (none found)               → NONE            │
    │                                                   │
    │  Result: Most recent match wins                   │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │  Step 2: TASK() DETECTION                         │
    │  ───────────────────────────────────────          │
    │  Pattern: Task invocation syntax                  │
    │                                                   │
    │  Search for:                                      │
    │  ├─ Task(subagent_type=                          │
    │  ├─ <invoke name="Task">                         │
    │  └─ invoke name="Task"                           │
    │                                                   │
    │  Result: YES if any pattern found                 │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │  Step 3: PHASE DETECTION                          │
    │  ───────────────────────────────────────          │
    │  Pattern: ## Phase N: Title                       │
    │                                                   │
    │  Search for:                                      │
    │  ├─ ## Phase 1: Planning                         │
    │  ├─ ## Phase 2: Synthesis                        │
    │  ├─ ## Phase 3: Implementation                   │
    │  └─ ## Phase 4: Verification                     │
    │                                                   │
    │  Result: Most recent phase number (or None)       │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │  Step 4: DEPLOYED AGENT DETECTION                 │
    │  ───────────────────────────────────────          │
    │  Pattern: Deployment context clues                │
    │                                                   │
    │  Search recent context (last 5000 chars) for:     │
    │  ├─ "You are implementing"                       │
    │  ├─ "You have been deployed to"                  │
    │  └─ "subagent_type.*prompt.*Implement"           │
    │                                                   │
    │  Result: YES if deployed agent context found      │
    └───────────────────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────────┐
    │  FINAL STATE                                      │
    │  ───────────────────────────────────────          │
    │  ┌─────────────────────────────────────┐         │
    │  │ Tier:           HEAVY               │         │
    │  │ Phase:          3                   │         │
    │  │ Task() used:    YES                 │         │
    │  │ Deployed agent: NO                  │         │
    │  │ Is orchestrator: YES                │         │
    │  └─────────────────────────────────────┘         │
    └───────────────────────────────────────────────────┘
```

---

## Message Generation Logic

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SHOULD_BLOCK() DECISION TREE                      │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │ Tier = NONE?  │
                    └───────┬───────┘
                        YES │ NO
                            ↓
                    ┌───────────────┐
                    │ Deployed      │
                    │ agent?        │
                    └───────┬───────┘
                        YES │ NO
                            ↓
            ┌───────────────┴───────────────┐
            ↓                               ↓
     ┌─────────────┐                 ┌─────────────┐
     │ Tier = LIGHT│                 │ Tier =      │
     │             │                 │ MEDIUM      │
     └──────┬──────┘                 └──────┬──────┘
         YES│ NO                         YES│ NO
            ↓                               ↓
   ┌────────┴────────┐           ┌─────────┴─────────┐
   ↓                 ↓           ↓                   ↓
┌──────┐      ┌──────────┐   ┌──────┐         ┌──────────┐
│Task()│      │Task()    │   │Task()│         │Task()    │
│NO    │      │YES       │   │NO    │         │YES       │
└──┬───┘      └────┬─────┘   └──┬───┘         └────┬─────┘
   ↓               ↓            ↓                   ↓
✅ ALLOW      ⚠️ WARN      ⚠️ WARN           🛑 BLOCK
  Silent      LIGHT_       MEDIUM_          MEDIUM_
              WITH_TASK    NO_TASK          ORCHESTRATOR

            ┌───────────────┴───────────────┐
            ↓                               ↓
     ┌─────────────┐                 ┌─────────────┐
     │ Tier = HEAVY│                 │ Tier = FULL │
     │             │                 │ or AUTO     │
     └──────┬──────┘                 └──────┬──────┘
            ↓                               ↓
   ┌────────┴────────┐                     ↓
   ↓                 ↓               🛑 BLOCK
┌──────┐      ┌──────────┐           (Always)
│Task()│      │Task()    │
│NO    │      │YES       │
└──┬───┘      └────┬─────┘
   ↓               ↓
🛑 BLOCK      🛑 BLOCK
HEAVY_        HEAVY_
NO_TASK       ORCHESTRATOR
```

---

## Example Scenarios (Visual)

### ✅ SCENARIO: LIGHT Tier - No Task()

```
┌──────────────────────────────────────────────┐
│ Conversation                                 │
├──────────────────────────────────────────────┤
│ User: /response-awareness-light             │
│       "Fix typo in README"                   │
│                                              │
│ Assistant: I'll fix the typo.               │
│            [About to use Edit()]             │
└──────────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────────┐
│ Firewall Analysis                            │
├──────────────────────────────────────────────┤
│ Tier: LIGHT ✅                               │
│ Task() used: NO ✅                           │
│ Deployed agent: NO                           │
│ Decision: ALLOW ✅                           │
└──────────────────────────────────────────────┘
                  ↓
        [Edit() executes normally]
            ✅ SUCCESS
```

### 🛑 SCENARIO: HEAVY Tier - Orchestrator

```
┌──────────────────────────────────────────────┐
│ Conversation                                 │
├──────────────────────────────────────────────┤
│ User: /response-awareness-heavy             │
│       "Add authentication"                   │
│                                              │
│ Assistant: ## Phase 1: Planning             │
│            Task(subagent_type=...)          │
│            [Planning complete]               │
│                                              │
│ Assistant: ## Phase 3: Implementation       │
│            [About to use Edit()]             │
└──────────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────────┐
│ Firewall Analysis                            │
├──────────────────────────────────────────────┤
│ Tier: HEAVY ❌                               │
│ Task() used: YES ❌                          │
│ Phase: 3 ⚠️                                  │
│ Deployed agent: NO ❌                        │
│ Decision: BLOCK 🛑                           │
└──────────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────────┐
│ 🛑 ORCHESTRATOR FIREWALL BLOCKED             │
│                                              │
│ You are ORCHESTRATOR - deploy agents        │
│ instead of implementing directly             │
│                                              │
│ Required: Task(...) to delegate              │
└──────────────────────────────────────────────┘
                  ↓
        [Edit() PREVENTED ❌]
    User corrects → Deploys agent ✅
```

---

## File Structure Overview

```
.claude/hooks/
│
├── orchestrator-firewall.py          ⭐ MAIN LOGIC
│   ├─ State detection (tier, Task(), phase, agent)
│   ├─ Decision logic (should_block)
│   ├─ Message generation (tier-specific)
│   └─ Debug mode
│
├── orchestrator-firewall.bat         🪟 Windows wrapper
│   └─ Calls Python script
│
├── orchestrator-firewall.sh          🐧 Unix wrapper
│   └─ Calls Python script
│
├── README.md                          📖 Quick start
│   ├─ What it does
│   ├─ When it fires
│   └─ Quick examples
│
├── ORCHESTRATOR_FIREWALL_GUIDE.md     📚 Full guide
│   ├─ Complete documentation
│   ├─ Configuration
│   ├─ Customization
│   ├─ Troubleshooting
│   └─ Advanced features
│
├── TEST_SCENARIOS.md                  🧪 Test cases
│   ├─ Scenario matrix
│   ├─ Detailed examples
│   ├─ Edge cases
│   └─ Manual testing
│
├── VISUAL_GUIDE.md                    🎨 This file
│   ├─ System diagrams
│   ├─ Flow charts
│   └─ Visual examples
│
├── IMPLEMENTATION_SUMMARY.md          📋 Technical summary
│   ├─ What was built
│   ├─ Design decisions
│   ├─ Deployment status
│   └─ Success metrics
│
└── hook-config-example.json           ⚙️ Config reference
    └─ Integration example
```

---

## Quick Reference Chart

| Tier | Task() | Agent? | Firewall | Message Type | Exit Code |
|------|--------|--------|----------|--------------|-----------|
| ❌ NONE | Any | Any | ✅ ALLOW | (silent) | 0 |
| 🟢 LIGHT | ❌ NO | ❌ NO | ✅ ALLOW | (silent) | 0 |
| 🟢 LIGHT | ✅ YES | ❌ NO | ⚠️ WARN | Consider delegate | 0 |
| 🟡 MEDIUM | ❌ NO | ❌ NO | ⚠️ WARN | Consider delegate | 0 |
| 🟡 MEDIUM | ✅ YES | ❌ NO | 🛑 BLOCK | Must delegate | 1 |
| 🔴 HEAVY | Any | ❌ NO | 🛑 BLOCK | Orchestrator only | 1 |
| 🔴 FULL | Any | ❌ NO | 🛑 BLOCK | Orchestrator only | 1 |
| 🔵 AUTO | ✅ YES | ❌ NO | 🛑 BLOCK | Router orchestrator | 1 |
| ⭐ Any | Any | ✅ YES | ✅ ALLOW | (deployed agent) | 0 |

**Legend**:
- ✅ = Condition met
- ❌ = Condition not met
- 🛑 = Blocked
- ⚠️ = Warning
- ✅ = Allowed

---

## Integration Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE SYSTEM                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  User Prompt Submit Hook                           │   │
│  │  ───────────────────────────────────────           │   │
│  │  If /response-awareness → Add reminder             │   │
│  │  "Orchestrate only, do not implement"              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Conversation Processing                            │   │
│  │  [User messages, Assistant responses, Tool calls]   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Before Tool Use Hook ⭐ ORCHESTRATOR FIREWALL      │   │
│  │  ───────────────────────────────────────           │   │
│  │  Intercepts: Edit, Write, NotebookEdit             │   │
│  │  Analysis: Tier, Task(), Phase, Agent              │   │
│  │  Action: Allow / Warn / Block                       │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Tool Execution                                     │   │
│  │  [Only executes if firewall allows (exit code 0)]  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

The Orchestrator Firewall Hook provides:

✅ **External Enforcement** - Turns framework rules into executable checks
✅ **Tier-Aware** - Adapts to LIGHT/MEDIUM/HEAVY/FULL complexity
✅ **Phase-Aware** - Provides checkpoint guidance at transitions
✅ **Smart Detection** - Recognizes orchestrators vs deployed agents
✅ **Clear Messages** - Actionable guidance with recovery steps
✅ **Minimal Overhead** - ~50-200ms per tool invocation
✅ **Customizable** - Debug mode, disable option, message customization

**Result**: Reliable orchestration integrity through automated enforcement.

---

**Created**: 2025-10-02
**Version**: 1.0
**Part of**: Response-Awareness Framework
