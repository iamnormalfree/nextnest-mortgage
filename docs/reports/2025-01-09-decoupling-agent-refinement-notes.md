---
title: 2025-01-09-decoupling-agent-refinement-notes
type: report
status: disabled
date: 2025-09-01
---

# 🔄 DECOUPLING DETECTION AGENT - REFINEMENT NOTES

**Status**: DISABLED - Needs LLM-based refinement
**Date**: 2025-01-09
**Issue**: Unrealistic trigger patterns identified

---

## 🚨 PROBLEMS IDENTIFIED

### **Current Implementation Issues**

1. **Unrealistic Name Patterns**
   - ❌ No one puts "Mrs/Mr" in name fields
   - ❌ Name analysis too simplistic
   - ❌ Pattern matching doesn't reflect real user behavior

2. **Missing Form Fields**
   - ❌ `firstTimeBuyer` not actually used in lead form
   - ❌ Many trigger conditions based on non-existent fields
   - ❌ Assumptions about available data incorrect

3. **Incorrect Risk Triggers**
   - ❌ Medium risk triggers are not realistic
   - ❌ Income mismatch calculations too aggressive
   - ❌ Timeline urgency doesn't indicate ABSD optimization

4. **Only Valid Indicators**
   - ✅ High-value private property purchases ($1.5M+)
   - ✅ New purchase (not first-time buyer if trackable)
   - ⚠️ All other patterns need validation

---

## 💡 PROPOSED SOLUTION: LLM-BASED CONVERSATION ANALYSIS

### **Post Gate-3 Conversation Flow**

Instead of algorithmic pattern detection, implement **conversational AI analysis**:

```typescript
interface PostGate3ConversationFlow {
  trigger: "After Gate 3 completion"
  approach: "LLM-powered conversation analysis"
  dataPoints: {
    formData: "All submitted form information"
    conversationHistory: "Natural language exchanges"
    userResponses: "Follow-up question answers"
    behavioralPatterns: "Hesitation, clarifications, questions"
  }
}
```

### **LLM Conversation Prompts**

```typescript
const decouplingDetectionPrompt = `
Based on this mortgage application and any conversation context:

Form Data: ${formData}
Conversation: ${conversationHistory}

Analyze for potential ABSD optimization opportunities by considering:

1. **High-Value Private Property Indicators**:
   - Property value >$1.5M SGD
   - Private property type
   - New purchase (not refinance)

2. **Conversational Cues** (look for):
   - Questions about "spouse" or "joint ownership"
   - Mentions of "existing property" or "second property"
   - Concerns about "ABSD" or "additional duties"
   - Questions about "ownership structure"
   - References to "property transfer" or "timing"

3. **Natural Follow-up Questions**:
   - If high-value private property: "Will this be purchased under joint names or single name?"
   - If ownership questions arise: "Do you or your spouse currently own any property?"
   - If ABSD concerns: "Are you looking to optimize the property structure?"

Respond with:
- Risk Level: none/low/medium/high
- Confidence: 0-100%
- Reasoning: Why this assessment
- Recommended Questions: What to ask next
- Broker Priority: standard/medium/high/immediate
`;
```

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 1: Disable Current Agent**
✅ **COMPLETED**
- Commented out DecouplingDetectionAgent imports
- Disabled all pattern recognition calls
- Reverted API responses to standard format

### **Phase 2: Design LLM Integration**
**Status**: TO DO
- Create post-Gate-3 conversation handler
- Design natural follow-up question flow
- Implement LLM-based analysis prompts

### **Phase 3: Real-World Testing**
**Status**: TO DO
- Test with actual user conversations
- Refine prompts based on real behavior
- Validate with mortgage brokers

---

## 🎯 REALISTIC DETECTION CRITERIA

### **Only Trigger When**:

1. **High-Value Private Property**
   ```typescript
   priceRange > 1500000 && propertyType === 'Private' && loanType === 'new_purchase'
   ```

2. **User Asks Ownership Questions**
   ```typescript
   conversationIncludes(['spouse', 'joint', 'single name', 'ABSD', 'ownership'])
   ```

3. **Natural Conversation Flow**
   ```typescript
   // After Gate 3, if high-value private property
   followUpQuestion: "Will this property be purchased under joint names or single name?"
   
   // Based on response, determine next steps
   if (response.includes('single') && highValue) {
     askAboutSpouseProperty()
   }
   ```

---

## 🚫 AVOID THESE PATTERNS

### **Don't Use**:
- ❌ Name pattern analysis (Mrs/Mr detection)
- ❌ Algorithmic marital status inference
- ❌ Income-to-property ratio triggers
- ❌ Timeline urgency as ABSD signal
- ❌ Session behavior analysis
- ❌ Automatic assumptions about user intent

### **Use Instead**:
- ✅ Natural conversation flow
- ✅ User-initiated questions about structure
- ✅ LLM analysis of conversation context
- ✅ Progressive disclosure through questions
- ✅ Expert broker consultation for complex cases

---

## 📝 NEXT STEPS

1. **Design Conversation Flow**
   - Map out post-Gate-3 question sequences
   - Create branching logic based on responses
   - Define clear trigger conditions

2. **Implement LLM Analysis**
   - Create conversation analysis prompts
   - Test with various scenarios
   - Refine based on broker feedback

3. **Validate with Real Data**
   - Test with actual user interactions
   - Monitor false positive/negative rates
   - Adjust prompts and triggers accordingly

---

## 🔄 MASTER_IMPLEMENTATION_PLAN UPDATE

**Task 7: Decoupling Detection (AI)**
- **Status**: ON HOLD - Requires LLM refinement
- **Reason**: Unrealistic trigger patterns identified
- **Next Action**: Design conversation-based detection flow
- **Timeline**: To be determined after LLM integration planning

---

**This agent will be reactivated once realistic, conversation-based detection is implemented.**