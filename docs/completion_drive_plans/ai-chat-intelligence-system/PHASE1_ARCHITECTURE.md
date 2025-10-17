# Phase 1: System Architecture - AI Chat Intelligence System

**Version:** 1.0  
**Last Updated:** 2025-10-10  
**Status:** Planning - Architecture Design  

---

## Executive Summary

This document defines the complete system architecture for the AI Chat Intelligence System, including multi-model token optimization, response-awareness principles, and memory management.

**Architecture Goals:**
- Token efficiency: 24,000 tokens per 20-turn conversation (40% reduction)
- Cost optimization: $0.10 per conversation (83% reduction)
- Response time: < 2s (95th percentile)
- Scalability: Handle 1000+ concurrent conversations

---

## 1. High-Level Architecture Diagram

**Flow:**
Form Completion → LeadToContext Contract → ConversationStateManager → IntentRouter → Handlers → Multi-Model Orchestrator → Response-Awareness Tracker → Memory Management → Redis/Supabase

**Components:**
1. **ConversationStateManager**: Tracks phase, intent history, token budget
2. **IntentRouter**: Classifies and routes user messages
3. **Multi-Model Orchestrator**: Selects optimal AI model per request
4. **Response-Awareness Tracker**: Prevents repetition
5. **Memory Management**: Token-budgeted history loading

---

## 2. Multi-Model Token Optimization Strategy

### Model Selection Logic

**gpt-4o-mini (70% of conversations):**
- Use case: Simple responses, greetings, clarifications
- Cost: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- Max tokens: 300 per response
- Temperature: 0.7

**gpt-4o (20% of conversations):**
- Use case: Complex calculations, detailed explanations
- Cost: $5 per 1M input tokens, $15 per 1M output tokens
- Max tokens: 500 per response
- Temperature: 0.5

**claude-3.5-sonnet (10% of conversations):**
- Use case: Creative responses, closing conversations
- Cost: $3 per 1M input tokens, $15 per 1M output tokens
- Max tokens: 400 per response
- Temperature: 0.8

### Cost Breakdown (20-turn conversation)

**Naive Approach (100% gpt-4o):**
Total cost: $0.60 per conversation

**Optimized Approach:**
- gpt-4o-mini (14 turns): $0.0046
- gpt-4o (4 turns): $0.06
- claude-3.5-sonnet (2 turns): $0.024
- **Total: $0.09 (~$0.10 with overhead)**
- **Savings: 83% reduction**

---

## 3. Data Flow Across 5 Domains

### 3.1 Form Domain → AI Domain

**LeadToContext Contract:**
Transforms ProcessedLeadData → ConversationContext

Key transformations:
- Extract structured facts from form fields
- Derive conversation goals from loan type
- Calculate personalization hints from lead score
- Set initial token budget (2800 tokens max)

### 3.2 Calculation Domain → AI Domain

**CalculationToExplanation Contract:**
Transforms pure calculation results → natural language explanations

Process:
1. Run Dr. Elena's MAS-compliant calculations
2. Apply client-protective rounding
3. Generate natural language explanation via LLM
4. Include regulatory context
5. Suggest next steps

### 3.3 Memory Domain → AI Domain

**MemoryToContext Contract:**
Loads conversation history within token budget

Strategy:
- Recent messages (last 5): Load verbatim (~1000 tokens)
- Old messages (6-20): Load summaries (~500 tokens)
- Stated facts: Load all (~200 tokens)
- Total budget: ~1700 tokens for context

---

## 4. Redis + Supabase Memory Architecture

### Redis (Short-Term, Hot Cache)

**Data structures:**
1. Recent messages: List (last 10 turns, TTL 24h)
2. Stated facts: Hash (response-awareness, TTL 24h)
3. Conversation state: Hash (phase, intents, TTL 24h)

### Supabase (Long-Term, Archive)

**Tables:**
1. conversations: id, lead_id, phase, intent_history, token_budget_used
2. messages: id, conversation_id, role, content, token_count, model_used
3. conversation_summaries: id, conversation_id, turn_range, summary, facts_extracted

---

## 5. Response-Awareness Principles

### Track Stated Facts

Extract and store all facts mentioned in AI responses:
- Numerical facts: "Monthly payment is $2,340"
- Policy facts: "MAS requires 55% TDSR limit"
- Personal facts: "You mentioned buying in 3 months"

### Prevent Repetition

Before generating each response:
1. Load all stated facts from Redis
2. Add response-awareness instructions to prompt
3. Instruct LLM to build on previous statements
4. Only repeat if user asks for clarification

### Progressive Disclosure

Reveal information gradually across conversation:
- Turn 1-5: High-level overview
- Turn 6-10: Detailed explanations
- Turn 11-15: Advanced options
- Turn 16-20: Closing and next steps

---

## 6. Implementation Priorities

### Priority 1: Foundation (Weeks 1-2)
- ConversationStateManager
- IntentRouter
- Redis cache setup
- Supabase schema migration

### Priority 2: Core Intelligence (Week 3)
- Multi-model orchestrator
- CalculationToExplanation contract
- Response-awareness tracker

### Priority 3: Memory & Optimization (Week 4)
- Conversation summarizer
- MemoryToContext contract
- Token budget enforcement

### Priority 4: Integration (Week 5-6)
- Chatwoot webhook integration
- Form-to-chat transition
- End-to-end testing

---

**Document Status:** Complete  
**Last Updated:** 2025-10-10