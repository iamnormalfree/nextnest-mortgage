# Next Implementation Priorities

**Created:** October 2, 2025
**Status:** PLANNING
**Previous Session:** [Broker Chat Alignment Implementation](../../sessions/2025-10-02-broker-chat-alignment-implementation-session.md)

---

## Priority 1: Fix Remaining Message Duplication (Message #2) ⚡ URGENT

**Plan:** `docs/sessions/2025-10-03-message-duplication-fix-continuation.md`
**Status:** IN PROGRESS - Reduced from 3 to 2 messages
**Estimated Time:** 1-2 hours

### Current Status
- ✅ Message #1 eliminated: `chatwoot-natural-flow` webhook disabled
- ❌ Message #2 active: Unknown source sending "Sarah Wong" default greeting
- ✅ Echo detection system implemented (working correctly)

### Tasks for Next Session
1. **Identify Message #2 source:**
   - Check Chatwoot webhook configuration (multiple webhooks?)
   - Search all code for Chatwoot message POSTs
   - Review n8n workflows for default greetings
   - Check Chatwoot auto-assignment feature
   - Verify archived routes not accessible

2. **Add diagnostic logging:**
   - Stack trace in `sendInitialMessage()` to identify callers
   - Monitor server logs during test form submission

3. **Disable/fix Message #2 source**

4. **Test with NEW email:**
   - Verify ONLY 1 greeting message appears
   - Confirm correct broker (not default Sarah Wong)

### Success Criteria
- ✅ Greeting appears EXACTLY ONCE (not 2 times)
- ✅ Uses ASSIGNED broker (not default Sarah Wong)
- ✅ No duplicate messages
- ✅ Zero errors in browser/server console

### Investigation Commands
```bash
# Check webhooks
curl -H "Api-Access-Token: ML1DyhzJyDKFFvsZLvEYfHnC" \
  https://chat.nextnest.sg/api/v1/accounts/1/webhooks

# Search for message senders
grep -r "message_type.*outgoing" . --include="*.ts" -n | grep -v node_modules
```

### Files Modified So Far
- `app/api/chatwoot-natural-flow/route.ts` (DISABLED)
- `lib/utils/message-tracking.ts` (created)
- `lib/integrations/chatwoot-client.ts` (tracking added)
- `app/api/chatwoot-webhook/route.ts` (echo detection added)
- `app/api/chatwoot-ai-webhook/route.ts` (tracking added)

---

## Priority 2: AI Broker Conversation Intelligence 🤖 HIGH PRIORITY

**Plan:** DOES NOT EXIST (needs creation)
**Suggested Name:** `2025-10-03-ai-broker-conversation-intelligence-plan.md`
**Estimated Effort:** 2-3 days implementation
**User Feedback:** *"There are still some issues in terms of the user experience in chatwoot as well as having a meaningful conversations with the AI brokers"*

### Current Gaps
❌ AI brokers don't have intelligent conversation capabilities
❌ No n8n workflow for AI-driven responses
❌ No context retention across messages
❌ No personality-based response generation
❌ No clear handoff triggers to human brokers

### Recommended Scope

#### 1. n8n AI Response Workflow
- **Trigger:** Chatwoot webhook on new user message
- **Process:**
  1. Fetch conversation history from Supabase
  2. Build context with broker personality + user profile
  3. Call OpenAI/Claude API with personality-specific prompt
  4. Post AI response to Chatwoot
  5. Log to Langfuse for observability
- **Deliverable:** `n8n-workflows/ai-broker-response-handler.json`

#### 2. Broker Personality Prompt Templates
- **Data Source:** `ai_brokers` table (personality_type, communication_style, strengths, etc.)
- **Templates:** One prompt template per personality type
  - Aggressive: Michelle Chen (quick, confident, premium rates)
  - Balanced: Rachel Tan (thorough, balanced approach)
  - Conservative: Sarah Wong (cautious, risk-averse)
- **Deliverable:** `lib/ai/broker-prompts.ts`

#### 3. Conversation Context Management
- **Store in Supabase:**
  - `conversation_messages` table (full history)
  - `conversation_context` table (extracted entities, preferences, concerns)
- **Context Window:** Last 10 messages + user profile summary
- **Deliverable:** `lib/ai/context-builder.ts`

#### 4. Handoff Trigger Detection
- **Keywords:** "speak to human", "real person", "manager", "escalate"
- **Sentiment:** Frustration, confusion (use sentiment analysis API)
- **Complexity:** User asks questions AI can't answer
- **Action:** Notify team, update conversation status to "pending_human_handoff"
- **Deliverable:** `lib/ai/handoff-detector.ts`

#### 5. Quality Monitoring (Langfuse)
- **Metrics:**
  - Response time (target: <3s)
  - Response quality (user satisfaction thumbs up/down)
  - Handoff rate (target: <20%)
  - Conversation completion rate
- **Deliverable:** Langfuse dashboard configuration

### Integration Architecture

```
User Message
    ↓
Chatwoot Webhook → n8n AI Response Handler
    ↓
1. Fetch conversation history (Supabase)
2. Build context (user profile + broker personality)
3. Detect handoff triggers
    ├─ If handoff needed → Notify team
    └─ Else → Continue to AI response
4. Generate AI response (OpenAI/Claude)
    ├─ Personality prompt template
    ├─ Conversation context
    └─ User profile data
5. Post response to Chatwoot
6. Log to Langfuse (tracing)
7. Update conversation context (Supabase)
```

### Dependencies
- Chatwoot webhook (already configured)
- n8n instance (already running)
- OpenAI API key (check if available)
- Langfuse account (check if configured)
- Supabase tables: `conversation_messages`, `conversation_context`

### Risks
- OpenAI API costs (need usage limits)
- Response latency (target <3s, may need caching)
- Context window size (token limits)
- Hallucinations (need prompt engineering + safeguards)

---

## Priority 3: Chatwoot UX Improvements 🎨 MEDIUM PRIORITY

**Plan:** DOES NOT EXIST (needs discovery)
**Suggested Name:** `2025-10-04-chatwoot-ux-improvements-plan.md`
**User Feedback:** *"issues in terms of the user experience in chatwoot"*

### Discovery Questions (User Input Needed)

1. **Message Display Issues?**
   - Are messages formatted correctly?
   - Font sizes readable on mobile?
   - Proper line breaks and spacing?

2. **Typing Indicators?**
   - Does "Broker is typing..." appear?
   - Does it disappear when message sent?

3. **System Messages?**
   - Are join/leave notifications clear?
   - Are activity messages styled differently from chat?

4. **Mobile Experience?**
   - Does chat widget work on mobile?
   - Is it responsive and usable?
   - Touch targets large enough?

5. **Broker Presence?**
   - Can user see if broker is online?
   - Does broker avatar display?
   - Is broker name prominent?

6. **Conversation Flow?**
   - Easy to scroll through history?
   - New message notifications work?
   - Can user see message timestamps?

### Recommended Approach
1. **User Demo Session:** Screen share to observe actual UX issues
2. **Issue Cataloging:** Document each specific problem with screenshots
3. **Prioritization:** Categorize as CRITICAL / HIGH / MEDIUM / LOW
4. **Implementation Plan:** Create targeted plan for top 5 issues

---

## Priority 4: Production Monitoring & Alerting 📊 LOW PRIORITY

**Plan:** Does not exist
**Suggested Name:** `2025-10-05-broker-system-monitoring-plan.md`

### Metrics to Track
1. **Broker Assignment Rate:** % of conversations assigned vs queued
2. **Message Delivery Success:** % of messages posted without errors
3. **API Latency:** p50, p95, p99 for `/api/chatwoot-conversation`
4. **Broker Availability:** Real-time broker capacity monitoring
5. **User Satisfaction:** Chat ratings, completion rate

### Tools
- Vercel Analytics (already available)
- Sentry (error tracking)
- Custom dashboard (Supabase queries)
- Langfuse (AI quality metrics)

---

## Immediate Next Steps (Today)

1. ✅ Session summary created: `docs/sessions/2025-10-02-broker-chat-alignment-implementation-session.md`
2. ✅ Plan status updated: `2025-09-26-broker-chat-alignment-plan.md` → READY_FOR_TESTING
3. ⏳ **User Action:** Test complete broker flow with fresh form submission
4. ⏳ **User Action:** Disable legacy webhook in Chatwoot admin
5. ⏳ **User Decision:** Choose next priority (AI intelligence or UX discovery)

---

## Resource Allocation Estimate

| Priority | Effort | Timeline | Dependencies |
|----------|--------|----------|--------------|
| P1: Testing & Validation | 1-2 hours | Today | User testing |
| P2: AI Conversation Intelligence | 2-3 days | This week | OpenAI API, n8n, Langfuse |
| P3: Chatwoot UX Improvements | 1-2 days | Next week | Discovery session |
| P4: Monitoring Setup | 4-6 hours | Next week | Analytics tools |

---

## Recommended Flow

**Option A: AI-First Approach**
1. Complete P1 testing (today)
2. Create AI conversation intelligence plan (tomorrow)
3. Implement n8n AI workflow (2-3 days)
4. Discover UX issues during AI testing
5. Address UX based on real usage

**Option B: UX-First Approach**
1. Complete P1 testing (today)
2. UX discovery session (tomorrow)
3. Fix top UX issues (1-2 days)
4. Then tackle AI intelligence with better UX

**Recommendation:** **Option A (AI-First)** because:
- AI intelligence is core functionality blocker
- UX issues may surface during AI testing
- Better to have working AI on mediocre UX than great UX with no AI

---

## Questions for User

1. **Is OpenAI API key already configured?** Check `.env.local` for `OPENAI_API_KEY`
2. **Is Langfuse account set up?** Check for `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`
3. **What's the budget for OpenAI API usage?** Need to set rate limits
4. **Who will test the broker chat flow?** Internal QA or external users?
5. **What's the priority: AI intelligence or UX improvements?**

---

## Related Documentation

- Implementation Session: `docs/sessions/2025-10-02-broker-chat-alignment-implementation-session.md`
- Broker Chat Alignment Plan: `docs/plans/active/2025-09-26-broker-chat-alignment-plan.md`
- Webhook Disable Procedure: `docs/runbooks/chatwoot-webhook-disable-procedure.md`
- n8n Coordination Guide: `docs/runbooks/n8n-workflow-coordination.md`

---

**Next Action:** Choose Priority 2 (AI) or Priority 3 (UX) and create implementation plan using `/response-awareness` orchestration.
