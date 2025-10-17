# Phase 1: Integration Contracts

**Version:** 1.0
**Last Updated:** 2025-10-10

## The 3 Critical Contracts

### Contract 1: LeadToContextContract
Transform ProcessedLeadData → ConversationContext

**Input:** ProcessedLeadData from form submission
**Output:** ConversationContext for AI conversation
**Purpose:** Bridge form domain to AI domain

**Key Transformations:**
- Extract structured facts from form fields
- Derive conversation goals from loan type
- Calculate personalization hints from lead score
- Set initial token budget (2800 tokens max)

### Contract 2: CalculationToExplanationContract
Transform pure calculations → natural language explanations

**Input:** CalculationResult with MAS-compliant numbers
**Output:** NaturalLanguageExplanation with context
**Purpose:** Bridge calculation domain to AI domain

**Key Transformations:**
- Run Dr. Elena's pure functions
- Apply client-protective rounding
- Generate natural language explanation via LLM
- Include regulatory context (MAS notices)
- Suggest actionable next steps

### Contract 3: MemoryToContextContract
Load conversation history within token budget

**Input:** ConversationId + TokenBudget  
**Output:** ConversationMemory with history
**Purpose:** Bridge storage domain to AI domain

**Key Transformations:**
- Load recent messages verbatim (last 5 turns, ~1000 tokens)
- Load old messages as summaries (turns 1-15, ~500 tokens)
- Load all stated facts (~200 tokens)
- Compress if exceeding budget
- Total: ~1700 tokens for context

## TypeScript Interface Definitions

```typescript
// Contract 1: LeadToContext
interface ProcessedLeadData {
  name: string;
  email: string;
  loanType: 'new_purchase' | 'refinance' | 'commercial';
  propertyType: 'HDB' | 'Private' | 'Commercial';
  leadScore: number;
}

interface ConversationContext {
  leadId: string;
  initialFacts: Record<string, any>;
  conversationGoals: string[];
  personalizationHints: {
    formalityLevel: 'casual' | 'professional';
    urgencyLevel: 'low' | 'medium' | 'high';
    sophisticationLevel: 'beginner' | 'intermediate' | 'expert';
  };
  tokenBudget: {
    systemPrompt: 800;
    facts: 200;
    history: 1500;
    userMessage: 300;
    total: 2800;
  };
}

// Contract 2: CalculationToExplanation
interface CalculationResult {
  type: 'tdsr' | 'monthly_payment' | 'eligibility';
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  roundingApplied: Array<{
    field: string;
    originalValue: number;
    roundedValue: number;
    reason: string;
  }>;
}

interface NaturalLanguageExplanation {
  summary: string;
  keyNumbers: string[];
  interpretation: string;
  nextSteps: string[];
  confidence: number;
}

// Contract 3: MemoryToContext
interface ConversationMemory {
  recentMessages: Message[];  // Last 5 verbatim
  summaries: Summary[];       // Older compressed
  statedFacts: Record<string, any>;
  tokenUsage: {
    recent: number;    // ~1000
    summaries: number; // ~500
    facts: number;     // ~200
    total: number;     // ~1700
  };
}
```

## Integration Flow Diagram

```
Form Completion
  ↓
[Contract 1: LeadToContext]
  ↓
ConversationContext Created
  ↓
User Message Arrives
  ↓
IntentRouter Classifies Intent
  ↓
If intent === 'calculation':
  ↓
[Contract 2: CalculationToExplanation]
  ↓
Dr. Elena Calculations Run
  ↓
Natural Language Explanation Generated
  ↓
Before Generating Response:
  ↓
[Contract 3: MemoryToContext]
  ↓
Conversation History Loaded (token-budgeted)
  ↓
Multi-Model Orchestrator Selects Model
  ↓
Response Generated
  ↓
Response-Awareness Tracker Updates Facts
  ↓
Response Sent to User
```

**Document Status:** Complete
**Last Updated:** 2025-10-10
