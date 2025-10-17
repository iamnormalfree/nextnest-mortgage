# Phase 1: Domain Survey - AI Chat Intelligence System

**Version:** 1.0  
**Last Updated:** 2025-10-10  
**Status:** Planning - Foundation Survey  

---

## Executive Summary

This document provides a comprehensive survey of the NextNest codebase to identify all domains affected by the AI Chat Intelligence System implementation.

**Key Findings:**
- 5 affected domains requiring coordination
- 23 explicit integration contracts needed
- 42 files requiring modification or extension
- Token efficiency target: 40% reduction (24k tokens per 20-turn conversation)
- Cost target: 83% reduction ($0.10 per conversation)

---

## 1. Domain Inventory

### 1.1 Domain 1: Forms & Lead Capture
**Directory:** `lib/domains/forms/`, `components/forms/`  
**Maturity:** High (well-structured with DDD principles)  
**Integration Complexity:** Medium

#### Current State
```
lib/domains/forms/entities/LeadForm.ts              # Lead form aggregate root
lib/domains/forms/services/MortgageCalculationService.ts  # Calculation service
lib/contracts/form-contracts.ts                     # Contract definitions
components/forms/IntelligentMortgageForm.tsx        # Main form component
```

#### Integration Points
1. **LeadToContextContract**: Transform ProcessedLeadData → ConversationContext
2. **Form completion event** → Trigger conversation creation
3. **Form field values** → Extract structured facts for Dr. Elena
4. **Lead score** → Influence conversation strategy

---

### 1.2 Domain 2: AI & Conversation Management
**Directory:** `lib/ai/`, `app/api/chat/`  
**Maturity:** Medium (existing broker AI, needs enhancement)  
**Integration Complexity:** High

#### Current State
```
lib/ai/broker-ai-service.ts                  # Vercel AI SDK integration (GPT-4)
lib/ai/natural-conversation-flow.ts          # Conversation flow logic
lib/ai/first-message-templates.ts            # Template system
```

#### Integration Points
1. **ConversationStateManager** (NEW): Track phase, intent, token budget
2. **IntentRouter** (NEW): Route user messages to handlers
3. **Multi-model orchestration**: gpt-4o-mini (70%) + gpt-4o (20%) + claude-3.5-sonnet (10%)
4. **Response-awareness**: Prevent repeating information
5. **Memory management**: Redis short-term, Supabase long-term

#### Files to Create
- lib/ai/conversation-state-manager.ts
- lib/ai/intent-router.ts
- lib/ai/conversation-summarizer.ts
- lib/ai/response-awareness-tracker.ts
- lib/ai/multi-model-orchestrator.ts

---

### 1.3 Domain 3: Mortgage Calculations (Dr. Elena Core)
**Directory:** `lib/calculations/`  
**Maturity:** High (MAS-compliant, well-tested)  
**Integration Complexity:** Low (pure functions)

#### Current State
```
lib/calculations/mortgage.ts                  # Core mortgage calculations
dr-elena-mortgage-expert.json                # Computational precision rules
```

#### Core Formulas
1. **Monthly Payment**: P × [r(1+r)^n] / [(1+r)^n - 1]
2. **TDSR Available**: (Income × 0.55) - Total_Commitments
3. **MSR Limit**: Income × 0.30 (HDB/EC only)
4. **IWAA**: Σ(age_i × income_i) / Σ(income_i)
5. **LTV Limits**: 75% (1st), 45% (2nd), 35% (3rd+)

#### Rounding Rules (Client Protection)
- Loan eligibility: ROUND DOWN to nearest thousand
- Funds required: ROUND UP to nearest thousand
- Monthly payments: ROUND UP to nearest dollar

#### Integration Points
1. **CalculationToExplanationContract**: Pure calculations → LLM natural language
2. **Calculation triggers**: When to run Dr. Elena computations
3. **Result formatting**: Present numbers with proper rounding

---

### 1.4 Domain 4: Data Storage & Memory
**Directory:** `lib/db/`, `lib/queue/`  
**Maturity:** High (Supabase + Redis infrastructure)  
**Integration Complexity:** Medium

#### Current State
```
lib/db/supabase-client.ts                    # Client configuration
lib/queue/redis-config.ts                    # Redis setup
lib/utils/session-manager.ts                 # Session storage
```

#### Integration Points
1. **MemoryToContextContract**: Load conversation history with token budget
2. **Redis conversation cache**: Store last N turns (sliding window)
3. **Supabase conversation archive**: Long-term storage
4. **Token-budgeted retrieval**: Summarize old, keep recent verbatim

---

### 1.5 Domain 5: Chatwoot Integration
**Directory:** `lib/integrations/`, `app/api/chatwoot-*/`  
**Maturity:** Medium (functional, needs enhancement)  
**Integration Complexity:** High (external system)

#### Current State
```
lib/integrations/chatwoot-client.ts          # API client
app/api/chatwoot-webhook/route.ts           # Incoming messages
lib/utils/message-tracking.ts               # Prevent duplicates
```

#### Integration Points
1. Chatwoot conversation creation triggered by form completion
2. User messages → Intent router → AI response → Chatwoot API
3. Broker assignment based on lead score
4. Message deduplication

---

## 2. File Impact Analysis

### 2.1 Files to CREATE (15 new files)

**AI/Conversation Layer:**
- lib/ai/conversation-state-manager.ts
- lib/ai/intent-router.ts
- lib/ai/conversation-summarizer.ts
- lib/ai/response-awareness-tracker.ts
- lib/ai/multi-model-orchestrator.ts

**Data Layer:**
- lib/db/conversation-repository.ts
- lib/db/message-repository.ts

**Calculation Layer:**
- lib/calculations/dr-elena-explainer.ts

**API Routes:**
- app/api/chat/route.ts

### 2.2 Files to MODIFY (12 existing files)

**AI Services:**
- lib/ai/broker-ai-service.ts
- lib/ai/natural-conversation-flow.ts

**Chatwoot Integration:**
- lib/integrations/chatwoot-client.ts
- app/api/chatwoot-webhook/route.ts

**Form Components:**
- lib/contracts/form-contracts.ts
- components/forms/IntelligentMortgageForm.tsx

---

## 3. Risk Assessment

### 3.1 High Risk Areas
1. **Multi-Model Orchestration Complexity**
   - Risk: Model selection logic becomes brittle
   - Mitigation: Clear decision tree, extensive testing, feature flags

2. **Token Budget Management**
   - Risk: Exceeding budget causes cost overruns
   - Mitigation: Hard limits, monitoring, automatic summarization

3. **Chatwoot Webhook Reliability**
   - Risk: Webhook failures cause lost messages
   - Mitigation: Retry logic, dead letter queue, idempotency keys

### 3.2 Medium Risk Areas
4. **Dr. Elena Integration**
   - Risk: Calculation errors propagate to AI responses
   - Mitigation: Pure function testing, validation layer

5. **Intent Classification Accuracy**
   - Risk: Misrouted intents cause poor UX
   - Mitigation: Fallback to human, confidence thresholds

---

## 4. Success Metrics

### 4.1 Technical Metrics
- **Token efficiency**: 24,000 tokens per 20-turn conversation (40% reduction)
- **Cost per conversation**: $0.10 (83% reduction from $0.60)
- **Response time**: < 2s (95th percentile)
- **Intent accuracy**: > 90% correct classification

### 4.2 Business Metrics
- **Conversation completion rate**: > 60%
- **Lead qualification rate**: > 40%
- **Human handoff rate**: < 20%
- **User satisfaction**: > 4.0/5.0

---

**Document Status:** Complete  
**Last Updated:** 2025-10-10
