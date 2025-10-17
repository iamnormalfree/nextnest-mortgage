# Broker Chat System Message Redesign Plan

## Objective
Render broker status updates ("{{broker}} is joining") as neutral system messages instead of customer bubbles, hide noisy Chatwoot automation events, and rely on the official activity endpoint so Chatwoot classifies messages correctly.

## Tasks

1. **Normalize message roles server-side**
   - File: `app/api/chat/messages/route.ts`
   - Derive a `role` field for every message and return it with `{ id, content, role, created_at, private, sender, original }`.
   - Map string or numeric `message_type` plus `sender.type` and `private` to roles:
     * incoming / `sender.type === 'contact'` -> `user`
     * outgoing or `sender.type` in (`agent`, `bot`) -> `agent`
     * activity / `sender.type === 'system'` -> `system`
     * private messages remain `agent` but keep the `private` flag so the UI can suppress them.
   - Persist the raw Chatwoot payload under `original` for debugging, and keep the existing `after_id` filter and chronological sorting.

2. **Use Chatwoot activity endpoint safely**
   - File: `lib/integrations/chatwoot-client.ts`
   - Update `createActivityMessage` to POST to `/api/v1/accounts/:accountId/conversations/:conversationId/activities` with the payload Chatwoot expects (e.g. `{ action: 'conversation_activity', content }`). Handle the 204-without-body response and log non-2xx statuses.
   - Before mutating conversation custom attributes, load current values (or rely on Chatwoot's merge endpoint if available) and PATCH with `{ custom_attributes: { ...existing, ...updates } }` so we never wipe prior keys.

3. **Rework UI rendering around roles**
   - Files: `components/chat/CustomChatInterface.tsx`, `components/chat/EnhancedChatInterface.tsx`
   - Extend the shared `Message` type with `role: 'user' | 'agent' | 'system'` and fall back to `message_type` only if `role` is missing (for backward compatibility during rollout).
   - When optimistically adding or merging messages client-side, assign the correct `role` (`user` for customer input, `agent` for broker replies) so new entries render consistently.
   - Replace `isUserMessage` logic with role checks, render `role === 'system'` as a centered status chip without avatars, and keep `user`/`agent` alignment as-is.
   - Continue hiding boilerplate system notices by testing `message.content` against `/conversation was reopened/i` and `/added property/i`, now executed in the branch that handles `role === 'system'`.

4. **Verify end-to-end behaviour**
   - Add temporary logging inside `GET /api/chat/messages` to confirm Chatwoot emits `message_type: 2` with `sender.type: 'system'` and that we translate it to `role: 'system'`.
   - Trigger a fresh conversation, open `/chat`, and confirm:
     * "{{broker}} is reviewing your details." and "{{broker}} joined." appear centered as system chips.
     * Customer-facing bubbles only show `role === 'user'` messages.
     * "Conversation was reopened" / "added Property" events no longer render.
   - Remove debug logging after validation.

5. **Document the flow**
   - Update `Docs/AI_BROKER_IMPLEMENTATION_PLAN.md` (and any other broker runbooks) with the new `role` response contract and the switch to the activities endpoint so future contributors understand how system notices are produced.
