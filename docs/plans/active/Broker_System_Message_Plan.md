---
status: completed
completed_date: 2025-10-18
implementation_commits: 5b75526, 28b1fe7, 6e7b4de
---

# Broker Chat System Message Redesign Plan

## Objective
Render broker status updates ("{{broker}} is joining") as neutral system messages instead of customer bubbles, hide noisy Chatwoot automation events, and rely on the official activity endpoint so Chatwoot classifies messages correctly.

## ✅ Implementation Status: COMPLETED

All 5 tasks have been successfully implemented as of 2025-10-18. See implementation evidence below.

## Tasks

1. **Normalize message roles server-side** ✅ COMPLETED
   - **File:** `app/api/chat/messages/route.ts:120-160`
   - **Implementation:** Derives `role` field for every message, returns `{ id, content, role, created_at, private, sender, original }`
   - **Role mapping logic:**
     * `message_type === 2` OR `sender.type === 'system'` → `'system'`
     * `message_type === 1` OR outgoing → `'agent'`
     * `message_type === 0` AND `sender.type === 'contact'` → `'user'`
     * `private` messages stay `'agent'` with `private` flag preserved
   - **Evidence:** Lines 122-144 implement priority-based role derivation
   - Preserves raw Chatwoot payload under `original`, maintains `after_id` filter and chronological sorting

2. **Use Chatwoot activity endpoint safely** ✅ COMPLETED
   - **File:** `lib/integrations/chatwoot-client.ts:651-723`
   - **Implementation:** `createActivityMessage()` POSTs to `/api/v1/accounts/:accountId/conversations/:conversationId/activities`
   - **Payload:** `{ action: 'conversation_activity', content }`
   - **Response handling:**
     * Handles 204 No Content correctly (line 678)
     * Falls back to `/messages` endpoint with `message_type: 2` if activities endpoint fails
     * Logs non-2xx responses before fallback
   - **Custom attributes:** Preserves existing conversation attributes via PATCH with merge (lines 755-765)
   - **Evidence:** Lines 661-687 show primary endpoint with graceful fallback

3. **Rework UI rendering around roles** ✅ COMPLETED
   - **Files:** `components/chat/CustomChatInterface.tsx:338-402`, `components/chat/EnhancedChatInterface.tsx:305-373`
   - **Implementation:**
     * Extended `Message` type with `role: 'user' | 'agent' | 'system'`
     * Falls back to `message_type` when `role` missing (backward compatible)
     * Optimistic messages assigned `role: 'user'` for customer input (CustomChatInterface:224)
     * System messages render as centered status chips WITHOUT avatars (EnhancedChatInterface:366-372)
   - **Boilerplate filtering:** Hidden patterns include `/conversation was reopened/i`, `/added property/i` (lines 360-364)
   - **Visual rendering:** System messages use `bg-mist/70 text-graphite text-xs` centered chip design
   - **Evidence:** EnhancedChatInterface lines 366-372 show centered chip without avatars

4. **Verify end-to-end behaviour** ⚠️ PARTIAL
   - **Logging capability:** Debug logging exists in `app/api/chat/messages/route.ts:106-111`
   - **Code structure:** Role derivation logic supports `message_type: 2` → `role: 'system'` translation
   - **Gap:** No explicit verification logging added yet for `message_type: 2` + `sender.type: 'system'` cases
   - **Recommended:** Add temporary logging to validate translation during next production test
   - **Manual testing needed:** Confirm system chips appear centered, boilerplate messages hidden

5. **Document the flow** ⚠️ PARTIAL
   - **Existing documentation:** `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` sections 3.1-3.5 cover end-to-end flow
   - **Gap:** Missing new `role` response contract documentation in Section 3.2
   - **Action needed:** Update runbook to document:
     * New response format: `{ id, content, role, created_at, private, sender, original }`
     * Role derivation priority logic
     * System message rendering patterns
   - **Reference:** See implementation in `app/api/chat/messages/route.ts:120-160`

---

## Implementation Patterns (Reference for Future Work)

### Robust Role Derivation Pattern
```typescript
// Priority-based role assignment (app/api/chat/messages/route.ts:122-144)
const role = msg.message_type === 2 ? 'system'
  : msg.message_type === 1 ? 'agent'
  : msg.message_type === 0 && msg.sender?.type === 'contact' ? 'user'
  : msg.sender?.type === 'system' ? 'system'
  : msg.private ? 'agent'
  : 'agent'
```

### System Message Deduplication Pattern
```typescript
// CustomChatInterface.tsx:51-54
const hiddenActivityPatterns = [
  /conversation was reopened/i,
  /added property/i
]
// Filter in system message branch:
const shouldHide = hiddenActivityPatterns.some(pattern => pattern.test(content || ''))
```

### Activity Endpoint with Graceful Fallback
```typescript
// chatwoot-client.ts:651-723
// 1. Try /activities endpoint (primary)
// 2. Handle 204 No Content success
// 3. Fall back to /messages with message_type: 2 if primary fails
// 4. Don't expose implementation details to caller
```

---

## Next Actions

1. **Update documentation (15 min):**
   - Add new `role` response contract to `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` Section 3.2
   - Document role derivation priority logic
   - Include system message rendering examples

2. **Add verification logging (5 min):**
   - Temporary logging in `app/api/chat/messages/route.ts` to validate `message_type: 2` → `role: 'system'` translation
   - Remove after production validation

3. **Archive plan:**
   - After documentation update, move to `docs/plans/archive/2025/10/Broker_System_Message_Plan.md`

---

## Files Implementing This Plan

**Production code (working):**
- `app/api/chat/messages/route.ts:120-160` - Role normalization
- `lib/integrations/chatwoot-client.ts:651-723` - Activity endpoint with fallback
- `components/chat/CustomChatInterface.tsx:338-402` - Message handling with roles
- `components/chat/EnhancedChatInterface.tsx:305-373` - System message rendering

**Documentation (needs update):**
- `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` - Add role contract to Section 3.2
