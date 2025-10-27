<!-- ABOUTME: Multi-path debugging plan for conversation persistence issues -->

---
status: draft
complexity: medium
estimated_hours: 6
---

# Chat Conversation Persistence Debugging Plan

## Problem (2-3 sentences)
Production smoke test revealed chat messages are lost on page refresh, despite conversation ID and user data persisting correctly. The issue appears to be a UI state synchronization problem where CustomChatInterface fails to properly hydrate message history after page reload, even though the Chatwoot API returns the correct data.

## Success Criteria (3-5 measurable outcomes)
- Messages persist correctly across page refreshes for existing conversations
- API logs show successful message retrieval on initial load and subsequent refreshes
- Console shows proper message hydration without "No new messages, last ID: X" polling loop
- No visual gaps in conversation history for users
- Performance impact minimal (no unnecessary API calls or state resets)

## Tasks (5-15 tasks, each <2h)
- [ ] Write failing test that reproduces the message loss on page refresh
- [ ] Analyze network requests to confirm API returns correct message data on refresh
- [ ] Debug CustomChatInterface useEffect initialization sequence and state hydration
- [ ] Investigate lastMessageIdRef initialization and its impact on message fetching logic
- [ ] Examine polling behavior when conversation has existing messages vs empty conversation
- [ ] Test different conversation persistence scenarios (new vs existing conversations)
- [ ] Implement fix for proper state hydration on component mount
- [ ] Add validation and error handling for message loading failures
- [ ] Test fix across different browser refresh patterns (hard refresh, tab restore, etc.)
- [ ] Monitor performance impact of additional debugging and validation

## Testing Strategy
**Unit/Integration/E2E:** 
- Unit tests for CustomChatInterface state management logic
- Integration tests for API message retrieval and state hydration
- E2E tests simulating page refresh scenarios with existing conversations
- Network request validation for proper API calls on component mount

## Rollback Plan
If fixes introduce new issues, revert to previous CustomChatInterface.tsx version and implement simpler fallback approach with forced full message refresh on page load.

## Multi-Path Debugging Approaches

### Path 1: API Data Retrieval Investigation
#PATH_DECISION: Focus on API layer first to rule out data source issues

**Debugging Steps:**
1. **Network Inspector Analysis**: Monitor `/api/chat/messages` requests on page refresh
2. **API Response Validation**: Verify Chatwoot returns correct message payload
3. **Error Boundary Detection**: Check for silent API failures or malformed responses
4. **Rate Limiting Investigation**: Determine if polling interferes with initial load

**Key Metrics to Track:**
- API response time and status codes
- Message count in API response vs expected count
- Timing of initial fetch vs polling requests
- Correlation ID tracking across requests

### Path 2: UI State Hydration Analysis
#PATH_DECISION: Investigate component lifecycle and state management

**Debugging Steps:**
1. **Component Lifecycle Analysis**: Track useEffect execution order and timing
2. **State Initialization Review**: Examine initial message state and lastMessageIdRef behavior
3. **Polling Interaction Study**: Understand how polling affects initial state hydration
4. **Race Condition Detection**: Identify timing issues between fetch and poll operations

**Key Metrics to Track:**
- Component mount/unmount timing
- Message state transitions (empty → loading → populated)
- lastMessageIdRef values during initialization
- Polling interval vs fetch completion timing

### Path 3: Browser Storage and Cache Investigation
#PATH_DECISION: Explore browser-specific persistence issues

**Debugging Steps:**
1. **Browser Storage Analysis**: Check localStorage/sessionStorage usage patterns
2. **Cache Behavior Study**: Examine browser cache impact on API responses
3. **Service Worker Investigation**: Determine if service workers interfere with requests
4. **Cross-Browser Testing**: Verify issue exists across different browsers

**Key Metrics to Track:**
- Storage state before/after refresh
- Cache headers and response validation
- Service worker interception patterns
- Browser-specific behavior differences

## Critical Assumptions and Uncertainties

#PLAN_UNCERTAINTY: Root cause assumption - current analysis suggests this is likely a UI state hydration issue rather than API data loss, but this needs validation.

#PLAN_UNCERTAINTY: Polling interference - the 3-second polling interval may be interfering with initial message loading, causing race conditions.

#PLAN_UNCERTAINTY: Component lifecycle timing - useEffect dependencies and execution order may not be optimal for proper state restoration.

#LCL_EXPORT_CRITICAL: The solution must maintain backward compatibility with existing conversation flows while fixing the refresh persistence issue.

## Constraint Alignment

- Constraint A – Public Surfaces Ready (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1): Addressing persistence protects the customer-facing chat experience required for Stage 0 launch gate approval and keeps SLA/performance evidence intact.

## Root Cause Hypotheses

### Hypothesis A: lastMessageIdRef Initialization Issue
**Theory**: `lastMessageIdRef.current = 0` on mount causes polling logic to skip full message fetch, leading to empty state.

**Evidence**: Console shows "🔄 No new messages, last ID: 1493" suggesting polling runs before proper initialization.

### Hypothesis B: useEffect Dependency Race Condition
**Theory**: Multiple useEffect hooks may interfere with each other, causing state to be reset after initial load.

**Evidence**: CustomChatInterface has multiple useEffect hooks with different dependencies that could conflict.

### Hypothesis C: API Response Processing Issue
**Theory**: Message formatting or filtering logic may incorrectly process valid API responses on refresh.

**Evidence**: API logs show "Fetched messages: 0 messages" on reload, suggesting API response processing failure.

## Implementation Priorities

1. **Immediate (0-2 hours)**: Network debugging and API validation
2. **Short-term (2-4 hours)**: Component lifecycle analysis and state management fixes
3. **Medium-term (4-6 hours)**: Browser storage investigation and cross-browser testing

## Success Validation

**Manual Testing Checklist:**
- [ ] Create conversation with multiple messages
- [ ] Hard refresh page (Ctrl+F5) - verify all messages persist
- [ ] Tab refresh (F5) - verify all messages persist  
- [ ] Tab close/reopen - verify all messages persist
- [ ] Navigate away and back - verify all messages persist
- [ ] Test with both new and existing conversations

**Automated Testing:**
- E2E test that creates conversation, refreshes page, validates message persistence
- Network request monitoring to ensure proper API calls
- Component state validation throughout refresh cycle
