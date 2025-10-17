---
title: broker-chat-alignment-plan
status: ready-for-testing
owner: engineering
last-reviewed: 2025-10-02
orchestration: /response-awareness
implementation-session: docs/sessions/2025-10-02-broker-chat-alignment-implementation-session.md
---

**Implementation Status: ✅ CODE COMPLETE - Pending End-to-End Testing**
**Implementation Date:** October 2, 2025
**Files Modified:** 10 files, ~150 lines changed
**Critical Bugs Fixed:** 4 (sessionStorage overwrite, persona timing, duplicates, Supabase config)

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# Broker Chat Alignment Implementation Plan

## Purpose
Ensure the AI broker assigned after the apply form matches every message shown in the broker UI, remove duplicate queue messages, and guarantee the "broker joined" system activity is always published without relying on long-lived timers.

## Current Symptoms
- The chat header shows one broker (e.g., Michelle Chen) while the first agent message is authored by another (e.g., Sarah Wong).
- "All AI specialists are helping other homeowners right now..." appears twice: once centered (system) and once as a right-aligned user bubble.
- "{Broker} is joining the conversation" never appears, so the user only sees the queue message.

## Confirmed Root Causes
1. `ChatTransitionScreen` selects a persona before contacting Supabase and never updates the UI when the real assignment returns (`components/forms/ChatTransitionScreen.tsx`).
2. `app/api/chatwoot-conversation/route.ts` replaces the persona in Chatwoot only if a broker is found, but `ChatTransitionScreen` keeps using its original guess, so the chat UI loads stale persona data.
3. `chatwootClient.sendInitialMessage` sends the greeting immediately after `announceBrokerJoin`, but the data passed in still references the original persona when no live broker is inserted.
4. The legacy enhanced webhook (`app/api/chatwoot-enhanced-flow/route.ts`) is still firing and randomly picks a broker persona, so it overwrites Supabase assignments with different names.
5. The queue activity is emitted twice by Chatwoot: once correctly as `message_type: 2` and once as `message_type: 'incoming'` with `sender.type: 'contact'`, which the UI classifies as a user bubble (`components/chat/CustomChatInterface.tsx`).
6. `BrokerEngagementManager.announceBrokerJoin` depends on `setTimeout` inside the API route; once the request completes in Vercel/Next, the timer is dropped, so "{Broker} joined..." is never posted.

## Preconditions / Environment Notes
- Supabase `ai_brokers` table must contain at least one `is_active` and `is_available` broker record; otherwise all leads stay queued.
- Confirm the deployment target (e.g., Vercel) does not allow long-lived timers inside API routes; use n8n or a dedicated background worker instead.
- Ensure you have access to Chatwoot admin (`chat.nextnest.sg`) to adjust webhook configuration.

## Implementation Steps

### 1. Unify Broker Persona End-to-End
1.1 Add a field to the object written into `sessionStorage` in `ChatTransitionScreen` so the assigned broker name from `/api/chatwoot-conversation` replaces the pre-selected persona.
   - File: `components/forms/ChatTransitionScreen.tsx`
   - On a successful response, persist `{ conversationId, brokerName, brokerStatus }` using `sessionManager.setChatwootSession` before redirect.
1.2 Update the transition UI to re-render with the assigned broker (`ChatTransitionScreen` ready state). Show the broker name from API if present; fall back to the persona only when no broker is returned (`status: 'queued'`).
1.3 Pass the stored broker name into the insights page shell (`app/apply/insights/InsightsPageClient.tsx`) so `ResponsiveBrokerShell` forwards it to `IntegratedBrokerChat` and down to `CustomChatInterface`.

### 2. Force the Greeting to Use the Assigned Broker
2.1 In `app/api/chatwoot-conversation/route.ts`, after `brokerEngagementManager.handleNewConversation(...)` resolves, if a broker was assigned update `processedLeadData.brokerPersona` before using it anywhere else.
2.2 In `lib/engagement/broker-engagement-manager.ts`, ensure the `processedLeadData` stored in the context already contains the Supabase broker name before calling `sendInitialMessage`.
2.3 In `lib/integrations/chatwoot-client.ts`, guard `sendInitialMessage` so it uses a supplied `leadData.brokerPersona.name` and log an error if the value is missing, rather than defaulting to the original persona.

### 3. Remove or Update the Legacy Enhanced Webhook
3.1 In Chatwoot admin, disable the webhook pointing to `/api/chatwoot-enhanced-flow` OR update the endpoint to respect `conversation.custom_attributes.ai_broker_name`. For this release, disable it entirely so only the new orchestrator posts messages.
3.2 Delete or feature-flag calls to `app/api/chatwoot-enhanced-flow/route.ts` if it is no longer required. Document the decision in the repo's runbook for reference.

### 4. Guarantee Broker Join Activity Delivery
4.1 Replace the `setTimeout` based scheduling in `BrokerEngagementManager` with a background-safe mechanism:
   - Option A: Move the join/greeting logic into an n8n workflow triggered by a webhook we call immediately.
   - Option B: Use a dedicated job runner (e.g., queue in Supabase or Upstash) to defer the message without relying on API route timers.
4.2 Until the scheduler is in place, keep the join message synchronous by awaiting a small `wait(ms)` utility within the same request to guarantee the activity is written before the route returns (acceptable if delay ≤ 2s).
4.3 After posting the join message, update `broker_status` to `engaged` and then call `sendInitialMessage`.

### 5. Filter Duplicate Queue Messages
5.1 Instrument `/api/chat/messages/route.ts` to drop any `incoming` message whose content equals the queue text and whose `sender.type` ≠ `contact` OR matches the activity we already emitted. This prevents the UI from rendering a duplicate user bubble.
5.2 Alternatively, extend `getMessageRole` in `CustomChatInterface` to treat that specific string as `system`, which also removes the right-side message until Chatwoot stops echoing it.

## Validation Checklist
- Complete a fresh apply flow in dev: assigned broker name must match the greeting message and chat header.
- Confirm the system messages in the chat appear in this order:
  1. Queue message (only once, centered).
  2. "{Broker} is reviewing your details" (if we keep it).
  3. "{Broker} joined the conversation".
  4. Broker greeting authored by the same broker.
- In Chatwoot inbox, verify `conversation.custom_attributes.ai_broker_name` matches the greeting author.
- Verify there are no 500s in `/api/chatwoot-conversation` logs and that `sendInitialMessage` logs the correct broker name.
- After disabling the enhanced webhook, ensure no messages originate from it in the Chatwoot timeline.

## Rollback Steps
- Re-enable the enhanced webhook if the new orchestrator fails.
- Revert the changes in `ChatTransitionScreen`, `chatwoot-conversation` API, and `BrokerEngagementManager` via git if the chat stops bootstrapping.
- If join activities still fail, set `DISABLE_BROKER_ASSIGNMENT=true` temporarily to route all leads to the default persona while investigating.

## Documentation & Follow-Up
- Update `docs/runbooks/PROGRESSIVE_FORM_COMPACT_EXECUTION_PLAYBOOK.md` with the new broker assignment flow.
- Add a note in `validation-reports/` after manual QA (include timestamp and tester).
- Coordinate with the Chat Ops team to ensure n8n/queue infrastructure is ready if Option A was chosen in Step 4.
