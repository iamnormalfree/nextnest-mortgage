# Frontend State Propagation Plan: Broker Assignment Flow

**Domain**: Frontend state management
**Problem**: Broker state propagation disconnect between pre-selection and Supabase assignment
**Date**: 2025-10-01
**Status**: Planning Phase 1

---

## Executive Summary

The current broker state propagation system has a **timing disconnect**: `ChatTransitionScreen` calculates and displays a broker persona (Michelle Chen, Jasmine Lee, etc.) **before** calling the API, then the API assigns a **real broker** from Supabase (Dr. Elena, etc.), but the UI never updates to reflect the actual assignment. This causes downstream components to display stale persona data instead of the real broker.

**Root Cause**: State is written to sessionStorage with pre-selected persona, then overwritten by API response, but no mechanism exists to propagate the update through the component tree or trigger re-renders.

---

## Problem Analysis

### Current Flow (Broken)

```
┌─────────────────────────────────────────────────────────────────┐
│ ChatTransitionScreen (lines 89-96)                              │
│ ────────────────────────────────────────────────────────────    │
│ 1. calculateBrokerPersona(leadScore, formData)                  │
│    → Returns: { name: "Jasmine Lee", type: "aggressive", ... }  │
│                                                                  │
│ 2. setBrokerPersona(personaDetails)                             │
│    → Local React state updated                                  │
│                                                                  │
│ 3. setState('ready')                                             │
│    → Shows "Continue to Chat" button with Jasmine Lee           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                   [User clicks button]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ initiateChatTransition() → POST /api/chatwoot-conversation      │
│ ────────────────────────────────────────────────────────────    │
│ API Response (lines 335-372):                                   │
│   {                                                              │
│     conversationId: 123,                                         │
│     widgetConfig: {                                              │
│       customAttributes: {                                        │
│         ai_broker_id: "dr-elena",                               │
│         ai_broker_name: "Dr. Elena Rodriguez",  ← REAL BROKER   │
│         broker_persona: "analytical",                            │
│         broker_status: "joining"                                 │
│       }                                                          │
│     }                                                            │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                   ❌ NO UPDATE MECHANISM ❌
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ sessionStorage (lines 174-188)                                  │
│ ────────────────────────────────────────────────────────────    │
│ ✅ Writes: chatwoot_widget_config (has real broker)             │
│ ✅ Writes: form_data (basic fields only)                        │
│ ✅ Writes: lead_score                                           │
│ ❌ DOES NOT WRITE: broker name to chatwoot_session_${sessionId} │
│ ❌ DOES NOT UPDATE: ChatTransitionScreen's brokerPersona state  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              onTransitionComplete(conversationId)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ InsightsPageClient (lines 25-37)                                │
│ ────────────────────────────────────────────────────────────    │
│ useEffect runs once on mount:                                   │
│   const stored = sessionStorage.getItem(                        │
│     `chatwoot_session_${sessionId}`                             │
│   )                                                              │
│   → ❌ Returns NULL or OLD DATA (no broker name)                │
│   → Sets chatwootConversationId but no broker info              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ResponsiveBrokerShell → IntegratedBrokerChat                    │
│ ────────────────────────────────────────────────────────────    │
│ Passes conversationId to IntegratedBrokerChat                   │
│ ❌ Does NOT pass broker name (not available in props)           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ IntegratedBrokerChat (lines 39-84)                              │
│ ────────────────────────────────────────────────────────────    │
│ 1. Check sessionManager.getChatwootSession(sessionId)           │
│    → ❌ Returns NULL or { conversationId: 123 } (no brokerName) │
│                                                                  │
│ 2. Fallback: fetch /api/chat/messages                           │
│    → ✅ API returns conversation.custom_attributes.ai_broker_name│
│    → ✅ Updates sessionStorage with broker name                 │
│    → ✅ Updates local state: setBrokerName("Dr. Elena...")      │
│                                                                  │
│ 3. Pass brokerName to CustomChatInterface                       │
│    → ✅ Chat header displays correct broker name                │
└─────────────────────────────────────────────────────────────────┘
```

### The Problem

**#POISON_PATH: The word "session" making me think sessionStorage is sufficient**

The flow works **eventually** because `IntegratedBrokerChat` makes an API call to fetch the broker name. However:

1. **Race Condition**: If the API call is slow, user sees "AI Mortgage Advisor" (default) for several seconds
2. **Redundant API Call**: We already have the broker name in the `/api/chatwoot-conversation` response but don't use it
3. **Transition Screen Shows Wrong Broker**: User sees "Jasmine Lee" on the "Continue to Chat" button, but then the chat loads with "Dr. Elena Rodriguez"
4. **State Fragmentation**: Broker data is split across:
   - `ChatTransitionScreen.brokerPersona` (pre-selected persona)
   - API response `widgetConfig.customAttributes.ai_broker_name` (real broker)
   - sessionStorage `chatwoot_widget_config` (has real broker in nested structure)
   - sessionStorage `chatwoot_session_${sessionId}` (missing broker name)

---

## Path Exploration

### #PATH_DECISION: State Update Mechanism After API Returns

#### Path A: Update sessionStorage in ChatTransitionScreen Before Redirect

**Approach**: Extract broker name from API response and write to sessionStorage before calling `onTransitionComplete()`.

**Implementation**:
```typescript
// In ChatTransitionScreen.tsx, lines 169-196
if (data.success && data.conversationId && data.conversationId > 0) {
  // Existing sessionStorage writes...

  // NEW: Extract broker name from API response
  const brokerName = data.widgetConfig?.customAttributes?.ai_broker_name ||
                     data.widgetConfig?.customAttributes?.broker_persona ||
                     'AI Mortgage Advisor'

  // NEW: Write to chatwoot_session with broker info
  sessionStorage.setItem(`chatwoot_session_${sessionId}`, JSON.stringify({
    conversationId: data.conversationId,
    brokerName: brokerName,
    brokerStatus: data.widgetConfig?.customAttributes?.broker_status || 'assigned',
    contactId: data.widgetConfig?.customAttributes?.contact_id,
    createdAt: new Date().toISOString()
  }))

  // Optionally update displayed broker name before transition
  if (data.widgetConfig?.customAttributes?.ai_broker_name) {
    const realBrokerName = data.widgetConfig.customAttributes.ai_broker_name
    setBrokerPersona(prev => ({
      ...prev,
      name: realBrokerName
    }))
  }

  // Proceed with existing flow
  setConversationId(data.conversationId)
  onTransitionComplete(data.conversationId)
}
```

**Pros**:
- ✅ Simple, localized change (1 file)
- ✅ Guarantees sessionStorage is updated before navigation
- ✅ No race conditions (writes happen before redirect)
- ✅ Eliminates redundant API call in IntegratedBrokerChat
- ✅ Can optionally update transition screen to show real broker name

**Cons**:
- ⚠️ Relies on sessionStorage availability (not an issue in browser)
- ⚠️ Doesn't fix the "Continue to Chat" button showing wrong broker initially
- ⚠️ If user clicks "Continue" immediately, they still see pre-selected persona momentarily

**Risk Assessment**: **LOW**
This approach is reliable because:
- sessionStorage writes are synchronous
- Writes happen before navigation
- No network requests involved after API returns

**Recommendation**: ✅ **RECOMMENDED** - Simplest solution with highest reliability

---

#### Path B: Pass Broker Data via URL Params on Redirect

**Approach**: Encode broker name in URL when navigating to insights page.

**Implementation**:
```typescript
// In ChatTransitionScreen.tsx
onTransitionComplete(data.conversationId, {
  brokerName: data.widgetConfig?.customAttributes?.ai_broker_name,
  brokerStatus: data.widgetConfig?.customAttributes?.broker_status
})

// Parent component redirects with URL params
router.push(`/apply/insights?session=${sessionId}&conversation=${conversationId}&broker=${encodeURIComponent(brokerName)}`)

// In InsightsPageClient.tsx
const searchParams = useSearchParams()
const brokerName = searchParams.get('broker')
const brokerStatus = searchParams.get('status')

// Pass to ResponsiveBrokerShell as props
<ResponsiveBrokerShell
  brokerName={brokerName}
  brokerStatus={brokerStatus}
  {...otherProps}
/>
```

**Pros**:
- ✅ No reliance on sessionStorage
- ✅ State is explicit and traceable in URL
- ✅ Deep linking support (refresh preserves broker)
- ✅ Easy to test (just construct URL)

**Cons**:
- ⚠️ Exposes internal broker assignments in URL (not sensitive, but not ideal)
- ⚠️ Requires prop drilling through ResponsiveBrokerShell → IntegratedBrokerChat
- ⚠️ URL becomes longer and less clean
- ⚠️ Must encode/decode names with special characters

**Risk Assessment**: **LOW-MEDIUM**
- Risk: URL encoding issues with non-ASCII characters (broker names like "Dr. Elena Rodríguez")
- Risk: User manually edits URL to inject different broker name (need validation)

**Recommendation**: ⚠️ **SECONDARY OPTION** - More complex, but useful for deep linking

---

#### Path C: React Context Provider for Broker State

**Approach**: Create a `BrokerStateContext` that tracks broker assignment and updates reactively.

**Implementation**:
```typescript
// New file: lib/contexts/broker-state-context.tsx
interface BrokerState {
  conversationId: number | null
  brokerName: string | null
  brokerStatus: 'assigned' | 'queued' | 'joining'
  lastUpdated: Date | null
}

export const BrokerStateContext = createContext<{
  state: BrokerState
  updateBroker: (data: Partial<BrokerState>) => void
}>({ ... })

export function BrokerStateProvider({ children }) {
  const [state, setState] = useState<BrokerState>({ ... })

  const updateBroker = useCallback((data: Partial<BrokerState>) => {
    setState(prev => ({ ...prev, ...data, lastUpdated: new Date() }))
    // Also sync to sessionStorage
    sessionStorage.setItem('broker_state', JSON.stringify({ ...state, ...data }))
  }, [state])

  return (
    <BrokerStateContext.Provider value={{ state, updateBroker }}>
      {children}
    </BrokerStateContext.Provider>
  )
}

// Usage in ChatTransitionScreen
const { updateBroker } = useBrokerState()
updateBroker({
  conversationId: data.conversationId,
  brokerName: data.widgetConfig.customAttributes.ai_broker_name,
  brokerStatus: 'joining'
})

// Usage in IntegratedBrokerChat
const { state } = useBrokerState()
const brokerName = state.brokerName || 'AI Mortgage Advisor'
```

**Pros**:
- ✅ Reactive updates across all components
- ✅ Single source of truth
- ✅ Type-safe with TypeScript
- ✅ Can trigger side effects (analytics, logging)
- ✅ Supports real-time updates (polling, webhooks)

**Cons**:
- ⚠️ Adds complexity (new Context provider, hooks)
- ⚠️ Requires wrapping app/pages in provider
- ⚠️ Overkill for this simple use case
- ⚠️ More files to maintain

**Risk Assessment**: **MEDIUM**
- Risk: Over-engineering for a simple state propagation problem
- Risk: Context re-renders can affect performance if not memoized properly
- Risk: Debugging is harder (state changes not visible in URL or storage)

**Recommendation**: ❌ **NOT RECOMMENDED** - Too complex for the problem scope

---

#### Path D: Hybrid Approach (Recommended for Production)

**Approach**: Combine Path A (sessionStorage update) with Path B (URL params as backup).

**Implementation**:
```typescript
// In ChatTransitionScreen - Write to BOTH sessionStorage AND pass via callback
const brokerData = {
  conversationId: data.conversationId,
  brokerName: data.widgetConfig?.customAttributes?.ai_broker_name,
  brokerStatus: data.widgetConfig?.customAttributes?.broker_status,
  brokerId: data.widgetConfig?.customAttributes?.ai_broker_id
}

// Write to sessionStorage (primary)
sessionStorage.setItem(`chatwoot_session_${sessionId}`, JSON.stringify(brokerData))

// Pass via callback (backup for parent component)
onTransitionComplete(data.conversationId, brokerData)

// In InsightsPageClient - Try sessionStorage first, then URL, then API
const [brokerData, setBrokerData] = useState<BrokerData | null>(null)

useEffect(() => {
  // Priority 1: sessionStorage (fastest)
  const stored = sessionStorage.getItem(`chatwoot_session_${sessionId}`)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.brokerName) {
        setBrokerData(parsed)
        return
      }
    } catch {}
  }

  // Priority 2: URL params (fallback for refresh)
  const urlBroker = searchParams.get('broker')
  if (urlBroker) {
    setBrokerData({
      conversationId: parseInt(searchParams.get('conversation') || '0'),
      brokerName: urlBroker,
      brokerStatus: searchParams.get('status') || 'assigned'
    })
    return
  }

  // Priority 3: API call (last resort)
  fetchBrokerFromAPI()
}, [sessionId])
```

**Pros**:
- ✅ Multiple layers of redundancy
- ✅ Handles edge cases (sessionStorage cleared, page refresh, etc.)
- ✅ Fast (sessionStorage) with reliable fallback (URL)
- ✅ Easy to test each layer independently

**Cons**:
- ⚠️ More code to maintain
- ⚠️ Complexity in fallback logic

**Risk Assessment**: **LOW**
- Very robust, handles all edge cases

**Recommendation**: ✅ **RECOMMENDED FOR PRODUCTION** - Best balance of reliability and maintainability

---

### #PATH_DECISION: Duplicate Message Deduplication Strategy

**Context**: When no brokers are available, Supabase returns `status: 'queued'`, and a system message is sent:
> "All AI specialists are helping other clients. Your request is #1 in queue..."

This message sometimes appears **twice** in the chat UI, causing confusion.

#### Path A: Filter in `/api/chat/messages` Before Returning to Frontend

**Implementation**:
```typescript
// In app/api/chat/messages/route.ts, lines 85-126
const formattedMessages = messages
  .map((msg: any) => { /* existing formatting */ })
  .filter((msg, index, array) => {
    // Deduplicate queue messages by content
    if (msg.content?.includes('All AI specialists are helping')) {
      const firstQueueIndex = array.findIndex(m =>
        m.content?.includes('All AI specialists are helping')
      )
      return index === firstQueueIndex // Keep only first occurrence
    }
    return true // Keep all other messages
  })
```

**Pros**:
- ✅ Centralized deduplication (one place, all clients benefit)
- ✅ Removes duplicate before it reaches frontend
- ✅ Easy to extend to other message types

**Cons**:
- ⚠️ String matching is brittle (if message text changes, logic breaks)
- ⚠️ Backend shouldn't know about UI-specific message filtering

**Risk Assessment**: **MEDIUM**
- Risk: False positives if message content varies slightly

**Recommendation**: ✅ **RECOMMENDED** - Centralized and efficient

---

#### Path B: Extend `getMessageRole()` to Mark Duplicates as System

**Implementation**:
```typescript
// In components/chat/CustomChatInterface.tsx, lines 338-387
const getMessageRole = (message: Message): 'user' | 'agent' | 'system' => {
  // Existing role logic...

  // NEW: Check if this is a duplicate queue message
  if (message.content?.includes('All AI specialists are helping')) {
    // Check if we've already seen this message
    const seenQueueMessage = messages.some(m =>
      m.id !== message.id &&
      m.content?.includes('All AI specialists are helping')
    )

    if (seenQueueMessage) {
      return 'system' // Will be hidden by frontend filter
    }
  }

  return 'agent'
}
```

**Pros**:
- ✅ No backend changes needed
- ✅ Frontend has full control over what to display

**Cons**:
- ⚠️ Doesn't actually remove duplicates from state
- ⚠️ Relies on frontend filter logic to hide system messages
- ⚠️ Must check entire messages array on every render

**Risk Assessment**: **LOW**
- No breaking changes, easy to test

**Recommendation**: ⚠️ **SECONDARY OPTION** - Good for quick fix, but not ideal long-term

---

#### Path C: Track Seen Message IDs in CustomChatInterface State

**Implementation**:
```typescript
// In CustomChatInterface.tsx
const [seenQueueMessageIds, setSeenQueueMessageIds] = useState<Set<number>>(new Set())

const filteredMessages = messages.filter(msg => {
  if (msg.content?.includes('All AI specialists are helping')) {
    if (seenQueueMessageIds.has(msg.id)) {
      return false // Hide duplicate
    }
    setSeenQueueMessageIds(prev => new Set(prev).add(msg.id))
  }
  return true
})
```

**Pros**:
- ✅ Precise (tracks by message ID, not content)
- ✅ Handles multiple types of duplicate messages

**Cons**:
- ⚠️ State management complexity
- ⚠️ Must persist `seenQueueMessageIds` to sessionStorage for page refresh

**Risk Assessment**: **MEDIUM**
- Risk: State synchronization issues

**Recommendation**: ❌ **NOT RECOMMENDED** - Over-engineered

---

#### **RECOMMENDED SOLUTION: Path A (Backend Filter)**

**Rationale**: Centralized, efficient, and removes duplicates at the source.

**#LCL_EXPORT_FIRM: integration_boundary::message_deduplication_strategy**

**Backend Team Instructions**:
- Implement content-based deduplication in `/api/chat/messages` route
- Filter out duplicate queue messages before returning to frontend
- Consider using message IDs instead of content matching for robustness

---

## Session Storage Schema Design

### #LCL_EXPORT_CRITICAL: interface_contract::chatwoot_session_schema

**Current Schema (Incomplete)**:
```typescript
// lib/utils/session-manager.ts, lines 11-17
interface ChatwootSession {
  conversationId: number
  contactId?: number
  email?: string
  createdAt?: string
  brokerName?: string  // ← Added recently, but NOT populated by API flow
}
```

**Proposed Enhanced Schema**:
```typescript
interface ChatwootSession {
  // Core conversation data
  conversationId: number
  contactId?: number
  inboxId?: number

  // Broker assignment (from Supabase)
  brokerName: string                          // "Dr. Elena Rodriguez"
  brokerId?: string                           // "dr-elena"
  brokerSlug?: string                         // "dr-elena"
  brokerPersonalityType: string               // "analytical", "aggressive", etc.
  brokerStatus: 'assigned' | 'queued' | 'joining' | 'active'
  brokerJoinEta?: number                      // seconds until broker joins
  brokerQueuePosition?: number                // position in queue if queued

  // Pre-selected persona (kept for fallback)
  preselectedPersona?: {
    name: string                              // "Jasmine Lee"
    type: 'aggressive' | 'balanced' | 'conservative'
    approach: string                          // "premium_rates_focus"
  }

  // Contact metadata
  email?: string
  phone?: string
  leadScore?: number

  // Timestamps
  createdAt: string                           // ISO 8601
  lastUpdated?: string                        // ISO 8601

  // State tracking
  conversationReused?: boolean                // true if reused existing conversation
  reuseReason?: string                        // why conversation was reused
}
```

**Why This Schema?**

1. **Separation of Concerns**:
   - `brokerName` = real assigned broker from Supabase
   - `preselectedPersona` = frontend pre-selection (kept for analytics/fallback)

2. **Status Tracking**:
   - `brokerStatus` allows UI to show different states ("Joining in 30s...", "In queue...", etc.)

3. **Fallback Support**:
   - If `brokerName` is missing, UI can fall back to `preselectedPersona.name`

4. **Debugging Support**:
   - `lastUpdated` timestamp helps debug stale data issues
   - `conversationReused` flag helps understand deduplication behavior

---

### #LCL_EXPORT_FIRM: type_definitions::broker_state_types

**TypeScript Type Definitions** (to be added to `types/broker.ts` or `types/chatwoot.ts`):

```typescript
/**
 * Broker assignment status from Supabase
 */
export type BrokerStatus = 'assigned' | 'queued' | 'joining' | 'active'

/**
 * Broker personality type (from Supabase agents table)
 */
export type BrokerPersonalityType =
  | 'analytical'
  | 'aggressive'
  | 'balanced'
  | 'conservative'
  | 'empathetic'

/**
 * Pre-selected broker persona (calculated by frontend before API call)
 */
export interface PreselectedBrokerPersona {
  name: string
  type: 'aggressive' | 'balanced' | 'conservative'
  approach: 'premium_rates_focus' | 'educational_consultative' | 'value_focused_supportive'
  title: string
  urgencyLevel: 'high' | 'medium' | 'low'
}

/**
 * Assigned broker data (from Supabase via API response)
 */
export interface AssignedBroker {
  id: string                              // "dr-elena"
  name: string                            // "Dr. Elena Rodriguez"
  slug: string                            // "dr-elena"
  personalityType: BrokerPersonalityType  // "analytical"
  status: BrokerStatus                    // "joining"
  joinEta?: number                        // seconds until join (30, 45, etc.)
  queuePosition?: number                  // position in queue if queued
}

/**
 * Complete Chatwoot session data stored in sessionStorage
 */
export interface ChatwootSession {
  conversationId: number
  contactId?: number
  inboxId?: number

  // Assigned broker (from Supabase)
  broker: AssignedBroker | null

  // Pre-selected persona (frontend calculation, kept for fallback)
  preselectedPersona?: PreselectedBrokerPersona

  // Contact metadata
  email?: string
  phone?: string
  leadScore?: number

  // Timestamps
  createdAt: string
  lastUpdated?: string

  // Deduplication metadata
  conversationReused?: boolean
  reuseReason?: string
}

/**
 * Broker data extracted from API response
 * (intermediate format between API and sessionStorage)
 */
export interface BrokerDataFromAPI {
  conversationId: number
  brokerId?: string
  brokerName: string
  brokerPersonalityType: string
  brokerStatus: BrokerStatus
  brokerJoinEta?: number
  brokerQueuePosition?: number
  contactId?: number
}
```

---

## Component-Specific Changes

### 1. ChatTransitionScreen.tsx

**File**: `components/forms/ChatTransitionScreen.tsx`
**Lines to Modify**: 169-196 (API response handler)

**Changes**:

```typescript
// Lines 169-196 (existing code)
if (data.success && data.conversationId && data.conversationId > 0) {
  // Track successful chat creation
  const transitionTime = (Date.now() - startTime) / 1000
  await conversionTracker.trackChatCreated(sessionId, data.conversationId, leadScore, transitionTime)

  // Store widget config (EXISTING)
  if (data.widgetConfig) {
    sessionStorage.setItem('chatwoot_widget_config', JSON.stringify(data.widgetConfig))
  }

  // Store form data (EXISTING)
  sessionStorage.setItem('form_data', JSON.stringify({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    loanType: formData.loanType
  }))

  // Store lead score (EXISTING)
  sessionStorage.setItem('lead_score', leadScore.toString())

  // ✅ NEW: Extract broker data from API response
  const brokerData: ChatwootSession = {
    conversationId: data.conversationId,
    contactId: data.widgetConfig?.customAttributes?.contact_id,
    broker: {
      id: data.widgetConfig?.customAttributes?.ai_broker_id || '',
      name: data.widgetConfig?.customAttributes?.ai_broker_name || 'AI Mortgage Advisor',
      slug: data.widgetConfig?.customAttributes?.broker_slug || '',
      personalityType: data.widgetConfig?.customAttributes?.broker_persona || 'balanced',
      status: data.widgetConfig?.customAttributes?.broker_status || 'assigned',
      joinEta: data.widgetConfig?.customAttributes?.broker_join_eta,
      queuePosition: data.widgetConfig?.customAttributes?.broker_queue_position
    },
    preselectedPersona: brokerPersona ? {
      name: brokerPersona.name,
      type: brokerPersona.type,
      approach: brokerPersona.approach,
      title: brokerPersona.title,
      urgencyLevel: brokerPersona.urgencyLevel
    } : undefined,
    email: formData.email,
    phone: formData.phone,
    leadScore: leadScore,
    createdAt: new Date().toISOString(),
    conversationReused: data.widgetConfig?.customAttributes?.conversation_reused || false,
    reuseReason: data.widgetConfig?.customAttributes?.reuse_reason
  }

  // ✅ NEW: Write complete broker data to sessionStorage
  sessionStorage.setItem(`chatwoot_session_${sessionId}`, JSON.stringify(brokerData))

  // ✅ OPTIONAL: Update displayed broker name on transition screen
  // (This fixes the issue where "Continue to Chat" shows wrong broker)
  if (data.widgetConfig?.customAttributes?.ai_broker_name) {
    const realBrokerName = data.widgetConfig.customAttributes.ai_broker_name
    setBrokerPersona(prev => ({
      ...prev,
      name: realBrokerName // Update displayed name to match Supabase assignment
    }))
  }

  // Successfully created conversation - proceed directly to chat
  setConversationId(data.conversationId)
  setProgress(100)
  setMessage('Connected! Loading chat...')

  // Notify parent and let it handle loading the chat widget
  onTransitionComplete(data.conversationId)
  return
}
```

**Impact**:
- ✅ Fixes stale broker name in sessionStorage
- ✅ Optionally updates transition screen to show real broker name
- ✅ Stores complete broker metadata for downstream components
- ✅ Preserves pre-selected persona for analytics

**Testing**:
```typescript
// Test Case 1: Verify sessionStorage is populated after API call
test('updates sessionStorage with real broker name', async () => {
  const mockResponse = {
    success: true,
    conversationId: 123,
    widgetConfig: {
      customAttributes: {
        ai_broker_name: 'Dr. Elena Rodriguez',
        ai_broker_id: 'dr-elena',
        broker_status: 'joining'
      }
    }
  }

  // Trigger API call
  await initiateChatTransition()

  // Assert sessionStorage was updated
  const stored = sessionStorage.getItem('chatwoot_session_test-session')
  expect(JSON.parse(stored).broker.name).toBe('Dr. Elena Rodriguez')
})

// Test Case 2: Verify transition screen updates broker name
test('updates displayed broker name on transition screen', async () => {
  // Initial state shows pre-selected persona
  expect(screen.getByText('Jasmine Lee')).toBeInTheDocument()

  // Click "Continue to Chat"
  fireEvent.click(screen.getByText('Continue to Chat'))

  // Wait for API response
  await waitFor(() => {
    expect(screen.getByText('Dr. Elena Rodriguez')).toBeInTheDocument()
  })
})
```

---

### 2. InsightsPageClient.tsx

**File**: `app/apply/insights/InsightsPageClient.tsx`
**Lines to Modify**: 22-37 (sessionStorage read logic)

**Changes**:

```typescript
// Lines 22-37 (EXISTING CODE)
const [chatwootConversationId, setChatwootConversationId] = useState<number | null>(null)

useEffect(() => {
  // Check if Chatwoot conversation was already created
  const stored = sessionStorage.getItem(`chatwoot_session_${sessionId}`)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      console.log('Found existing Chatwoot session:', parsed)
      setChatwootConversationId(parsed.conversationId)
    } catch (err) {
      console.error('Error parsing Chatwoot session:', err)
    }
  }
}, [sessionId])

// ✅ NEW: Add broker data state and pass to ResponsiveBrokerShell
const [chatwootConversationId, setChatwootConversationId] = useState<number | null>(null)
const [brokerData, setBrokerData] = useState<AssignedBroker | null>(null)

useEffect(() => {
  // Check if Chatwoot conversation was already created
  const stored = sessionStorage.getItem(`chatwoot_session_${sessionId}`)
  if (stored) {
    try {
      const parsed: ChatwootSession = JSON.parse(stored)
      console.log('Found existing Chatwoot session:', parsed)
      setChatwootConversationId(parsed.conversationId)

      // ✅ NEW: Extract broker data
      if (parsed.broker) {
        setBrokerData(parsed.broker)
        console.log('Loaded broker from session:', parsed.broker.name)
      }
    } catch (err) {
      console.error('Error parsing Chatwoot session:', err)
    }
  }
}, [sessionId])

// Lines 119-133 (EXISTING ResponsiveBrokerShell)
return (
  <ResponsiveBrokerShell
    conversationId={chatwootConversationId}
    situationalInsights={analysisData?.situationalInsights}
    rateIntelligence={analysisData?.rateIntelligence}
    defenseStrategy={analysisData?.defenseStrategy}
    leadScore={analysisData?.leadScore}
    formData={data}
    sessionId={sessionId}
    isLoading={isLoading}
    onBrokerConsultation={handleBrokerConsultation}
    onUpdateFormData={handleUpdateFormData}
    initialMobileState={initialMobileState}
    // ✅ NEW: Pass broker data as prop
    brokerData={brokerData}
  />
)
```

**Impact**:
- ✅ Reads broker data from sessionStorage on mount
- ✅ Passes broker data to ResponsiveBrokerShell as prop
- ✅ Eliminates need for downstream API call in IntegratedBrokerChat

---

### 3. ResponsiveBrokerShell.tsx

**File**: `components/ai-broker/ResponsiveBrokerShell.tsx`
**Lines to Modify**: 40-63 (props interface and component logic)

**Changes**:

```typescript
// Lines 40-63 (EXISTING PROPS)
export interface ResponsiveBrokerShellProps {
  // Analysis data from form submission
  situationalInsights?: SituationalInsights | null
  rateIntelligence?: RateIntelligence | null
  defenseStrategy?: DefenseStrategy | null
  leadScore?: number | null

  // Chat integration
  conversationId?: number | null

  // Form data context
  formData?: any
  sessionId?: string

  // Loading states
  isLoading?: boolean

  // Actions
  onBrokerConsultation?: () => void
  onUpdateFormData?: (data: any) => void

  // Server-side mobile detection
  initialMobileState?: boolean
}

// ✅ NEW: Add broker data prop
export interface ResponsiveBrokerShellProps {
  // ... existing props ...

  // ✅ NEW: Broker assignment data
  brokerData?: AssignedBroker | null
}

// Lines 114-128 (EXISTING IntegratedBrokerChat render)
if (conversationId) {
  return (
    <ChatErrorBoundary>
      <IntegratedBrokerChat
        conversationId={conversationId}
        formData={formData}
        sessionId={sessionId || ''}
        situationalInsights={situationalInsights}
        rateIntelligence={rateIntelligence}
        defenseStrategy={defenseStrategy}
        leadScore={leadScore}
        // ✅ NEW: Pass broker data to IntegratedBrokerChat
        brokerData={brokerData}
      />
    </ChatErrorBoundary>
  )
}
```

**Impact**:
- ✅ Pure pass-through component (no logic changes)
- ✅ Forwards broker data to IntegratedBrokerChat
- ✅ Maintains existing behavior for all other props

---

### 4. IntegratedBrokerChat.tsx

**File**: `components/ai-broker/IntegratedBrokerChat.tsx`
**Lines to Modify**: 17-25 (props interface), 36-84 (broker name fetch logic)

**Changes**:

```typescript
// Lines 17-25 (EXISTING PROPS)
interface IntegratedBrokerChatProps {
  conversationId: number
  formData: any
  sessionId: string
  situationalInsights?: any
  rateIntelligence?: any
  defenseStrategy?: any
  leadScore?: number | null
}

// ✅ NEW: Add broker data prop
interface IntegratedBrokerChatProps {
  conversationId: number
  formData: any
  sessionId: string
  situationalInsights?: any
  rateIntelligence?: any
  defenseStrategy?: any
  leadScore?: number | null
  // ✅ NEW: Broker data passed from parent
  brokerData?: AssignedBroker | null
}

// Lines 36-84 (EXISTING broker name fetch logic)
const [brokerName, setBrokerName] = useState('AI Mortgage Advisor')
const [hasFetchedBroker, setHasFetchedBroker] = useState(false)

useEffect(() => {
  // Only fetch broker name once when component mounts
  if (hasFetchedBroker) return;

  // Try session storage first
  const chatwootSession = sessionManager.getChatwootSession(sessionId)
  if (chatwootSession?.brokerName) {
    setBrokerName(chatwootSession.brokerName)
    setHasFetchedBroker(true)
    return;
  }

  // Try formData as fallback
  if (formData?.brokerName) {
    setBrokerName(formData.brokerName)
    // Don't set hasFetchedBroker here, still try to fetch from API
  }

  // Fetch from API
  const fetchBrokerName = async () => {
    try {
      const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.conversation?.custom_attributes?.ai_broker_name) {
          setBrokerName(data.conversation.custom_attributes.ai_broker_name)
          // Update session
          const session = sessionManager.getChatwootSession(sessionId) || {}
          sessionManager.setChatwootSession(sessionId, {
            ...session,
            conversationId,
            brokerName: data.conversation.custom_attributes.ai_broker_name
          })
        }
      }
    } catch (error) {
      console.error('Error fetching broker name:', error)
    } finally {
      setHasFetchedBroker(true)
    }
  }

  if (conversationId) {
    fetchBrokerName()
  }
}, [conversationId, sessionId])

// ✅ NEW: Simplified broker name logic with prop-based priority
const [brokerName, setBrokerName] = useState('AI Mortgage Advisor')

useEffect(() => {
  // Priority 1: Use broker data passed as prop (from sessionStorage)
  if (brokerData?.name) {
    setBrokerName(brokerData.name)
    console.log('Using broker name from prop:', brokerData.name)
    return
  }

  // Priority 2: Check sessionStorage directly (fallback)
  const chatwootSession = sessionManager.getChatwootSession(sessionId)
  if (chatwootSession?.broker?.name) {
    setBrokerName(chatwootSession.broker.name)
    console.log('Using broker name from sessionStorage:', chatwootSession.broker.name)
    return
  }

  // Priority 3: Fetch from API (last resort for backwards compatibility)
  const fetchBrokerName = async () => {
    try {
      const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.conversation?.custom_attributes?.ai_broker_name) {
          setBrokerName(data.conversation.custom_attributes.ai_broker_name)
          console.log('Fetched broker name from API:', data.conversation.custom_attributes.ai_broker_name)

          // Update sessionStorage for next time
          const session = sessionManager.getChatwootSession(sessionId) || { conversationId }
          sessionManager.setChatwootSession(sessionId, {
            ...session,
            broker: {
              id: data.conversation.custom_attributes.ai_broker_id || '',
              name: data.conversation.custom_attributes.ai_broker_name,
              slug: data.conversation.custom_attributes.broker_slug || '',
              personalityType: data.conversation.custom_attributes.broker_persona || 'balanced',
              status: data.conversation.custom_attributes.broker_status || 'active'
            }
          })
        }
      }
    } catch (error) {
      console.error('Error fetching broker name:', error)
    }
  }

  if (conversationId) {
    fetchBrokerName()
  }
}, [brokerData, conversationId, sessionId])
```

**Impact**:
- ✅ Eliminates redundant API call when broker data is available in props
- ✅ Maintains backwards compatibility (still fetches from API if needed)
- ✅ Updates sessionStorage if API call is made (for page refresh)
- ✅ Clear priority order: prop → sessionStorage → API

---

### 5. CustomChatInterface.tsx

**File**: `components/chat/CustomChatInterface.tsx`
**Lines to Modify**: None (already receives `brokerName` as prop)

**Changes**: ✅ **No changes needed**

**Rationale**: `CustomChatInterface` already receives `brokerName` as a prop and displays it correctly in the chat header. The fix is upstream in `IntegratedBrokerChat`.

---

### 6. session-manager.ts

**File**: `lib/utils/session-manager.ts`
**Lines to Modify**: 11-17 (ChatwootSession interface), 20-29 (getChatwootSession/setChatwootSession)

**Changes**:

```typescript
// Lines 11-17 (EXISTING INTERFACE)
interface ChatwootSession {
  conversationId: number
  contactId?: number
  email?: string
  createdAt?: string
  brokerName?: string
}

// ✅ NEW: Enhanced interface matching schema definition
interface ChatwootSession {
  conversationId: number
  contactId?: number
  inboxId?: number

  // Broker assignment (from Supabase)
  broker: AssignedBroker | null

  // Pre-selected persona (kept for fallback)
  preselectedPersona?: PreselectedBrokerPersona

  // Contact metadata
  email?: string
  phone?: string
  leadScore?: number

  // Timestamps
  createdAt: string
  lastUpdated?: string

  // Deduplication metadata
  conversationReused?: boolean
  reuseReason?: string
}

// Lines 20-29 (EXISTING METHODS - NO CHANGES NEEDED)
export const sessionManager = {
  getChatwootSession(sessionId: string): ChatwootSession | null {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.CHATWOOT_SESSION(sessionId))
    return stored ? JSON.parse(stored) : null
  },

  setChatwootSession(sessionId: string, data: ChatwootSession) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.CHATWOOT_SESSION(sessionId), JSON.stringify(data))
  },

  // ... rest of methods unchanged ...
}
```

**Impact**:
- ✅ Type-safe interface matching schema
- ✅ No runtime changes (methods remain the same)
- ✅ Better TypeScript autocomplete and error checking

---

## Edge Case Handling

### #PLAN_UNCERTAINTY: Edge Case Matrix

| **Scenario** | **Current Behavior** | **Proposed Behavior** | **Risk Level** |
|--------------|----------------------|------------------------|----------------|
| **API returns `status: 'queued'` (no broker assigned)** | Shows pre-selected persona name (e.g., "Jasmine Lee"), then chat shows default "AI Mortgage Advisor" | Store `broker: null` in sessionStorage, display queue status message: "AI Specialists are busy. You're #2 in queue." | **LOW** - Clear fallback logic |
| **User refreshes page during transition** | sessionStorage cleared, loses all broker data | If using Hybrid Approach (Path D), URL params preserve broker name | **MEDIUM** - Needs URL param backup |
| **sessionStorage is cleared by browser** | All broker data lost, defaults to "AI Mortgage Advisor" | API call fallback in IntegratedBrokerChat still works | **LOW** - Graceful degradation |
| **API response is slow (5+ seconds)** | User sees pre-selected persona for entire duration, then wrong broker in chat | Transition screen updates broker name when API returns (before redirect) | **MEDIUM** - UX slightly improved, but still shows wrong broker initially |
| **API returns malformed `widgetConfig` (missing `ai_broker_name`)** | sessionStorage stores `undefined`, IntegratedBrokerChat falls back to API call | Fallback to pre-selected persona name or default "AI Mortgage Advisor" | **LOW** - Multiple fallback layers |
| **User clicks "Continue to Chat" rapidly before API returns** | Race condition: redirect happens before sessionStorage write | Use synchronous sessionStorage write before redirect (already planned) | **LOW** - Fixed by Path A implementation |
| **Broker is reassigned mid-conversation (future feature)** | UI never updates, shows stale broker name | ❌ **Out of scope** - requires real-time updates (WebSocket/polling) | **HIGH** - Future enhancement needed |

---

### Edge Case Handling Strategy

#### Scenario 1: API Returns `status: 'queued'` (No Broker Assigned)

**Current API Response**:
```json
{
  "conversationId": 123,
  "widgetConfig": {
    "customAttributes": {
      "broker_status": "queued",
      "broker_queue_position": 2,
      "ai_broker_name": "",  // Empty or missing
      "ai_broker_id": ""
    }
  }
}
```

**Proposed Handling**:
```typescript
// In ChatTransitionScreen.tsx
const brokerData: ChatwootSession = {
  conversationId: data.conversationId,
  broker: data.widgetConfig?.customAttributes?.ai_broker_name ? {
    id: data.widgetConfig.customAttributes.ai_broker_id,
    name: data.widgetConfig.customAttributes.ai_broker_name,
    slug: data.widgetConfig.customAttributes.broker_slug || '',
    personalityType: data.widgetConfig.customAttributes.broker_persona || 'balanced',
    status: data.widgetConfig.customAttributes.broker_status || 'queued',
    queuePosition: data.widgetConfig.customAttributes.broker_queue_position
  } : null,  // ✅ Store null if no broker assigned

  preselectedPersona: brokerPersona,  // Keep pre-selected persona for fallback
  // ... rest of fields
}

// In IntegratedBrokerChat.tsx
const brokerDisplayName = brokerData?.broker?.name ||
                          brokerData?.preselectedPersona?.name ||
                          'AI Mortgage Advisor'

// Show queue status if queued
{brokerData?.broker?.status === 'queued' && (
  <div className="text-sm text-graphite">
    AI Specialists are busy. You're #{brokerData.broker.queuePosition} in queue.
  </div>
)}
```

**Testing**:
```typescript
test('handles queued status correctly', () => {
  const queuedResponse = {
    conversationId: 123,
    widgetConfig: {
      customAttributes: {
        broker_status: 'queued',
        broker_queue_position: 2
      }
    }
  }

  // Assert broker is null
  expect(brokerData.broker).toBeNull()

  // Assert fallback to pre-selected persona
  expect(screen.getByText('Jasmine Lee')).toBeInTheDocument()
  expect(screen.getByText('You\'re #2 in queue')).toBeInTheDocument()
})
```

---

#### Scenario 2: User Refreshes Page During Transition

**Problem**: If user refreshes while on `/apply/insights` page, sessionStorage **may** be cleared (browser-dependent).

**Solution (Hybrid Approach - Path D)**:
```typescript
// Parent component redirects with URL params as backup
router.push(
  `/apply/insights?session=${sessionId}&conversation=${conversationId}&broker=${encodeURIComponent(brokerName)}`
)

// InsightsPageClient reads URL params as fallback
const searchParams = useSearchParams()
const urlBrokerName = searchParams.get('broker')

// Priority: sessionStorage → URL params → API call
const brokerName = sessionStorage.getChatwootSession(sessionId)?.broker?.name ||
                   urlBrokerName ||
                   'AI Mortgage Advisor'
```

**Trade-off**:
- **Pro**: Survives page refresh
- **Con**: Exposes broker name in URL (not sensitive, but not ideal)

**Recommendation**: ✅ Implement if refresh behavior is critical to UX

---

#### Scenario 3: API Response is Slow (5+ Seconds)

**Problem**: User sees pre-selected persona ("Jasmine Lee") on transition screen for entire duration, then sees different broker ("Dr. Elena") in chat.

**Solution Options**:

**Option A: Update transition screen when API returns**
```typescript
// In ChatTransitionScreen.tsx, after API returns
if (data.widgetConfig?.customAttributes?.ai_broker_name) {
  setBrokerPersona(prev => ({
    ...prev,
    name: data.widgetConfig.customAttributes.ai_broker_name
  }))
  setMessage(`Matched with ${data.widgetConfig.customAttributes.ai_broker_name}!`)
}
```

**Option B: Don't show persona name until API returns**
```typescript
// In ChatTransitionScreen.tsx, line 299
<h3 className="text-sm font-semibold text-ink">
  {brokerPersona.name || 'Finding your perfect match...'}
</h3>
```

**Recommendation**: ✅ **Option A** - Update broker name when API returns, shows correct broker before redirect

---

#### Scenario 4: Broker is Reassigned Mid-Conversation (Future Feature)

**Problem**: If broker is reassigned after conversation starts (e.g., escalation, load balancing), UI will not update.

**#PLAN_UNCERTAINTY: Real-time broker updates**

**Questions for Backend Team**:
- Does Supabase support broker reassignment after conversation starts?
- If yes, how will frontend be notified? (webhook? polling? WebSocket?)
- Should UI show a transition message like "Transferring to Senior Advisor..."?

**Out of Scope for Phase 1**: Real-time updates require:
- WebSocket connection or polling mechanism
- UI transition animations
- Message context preservation

**Future Implementation Path**:
```typescript
// Hypothetical future code
useEffect(() => {
  const pollBrokerStatus = setInterval(async () => {
    const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`)
    const data = await response.json()

    if (data.conversation.custom_attributes.ai_broker_name !== currentBrokerName) {
      // Broker was reassigned
      setBrokerName(data.conversation.custom_attributes.ai_broker_name)
      showTransitionMessage('Transferred to specialist...')
    }
  }, 10000) // Poll every 10 seconds

  return () => clearInterval(pollBrokerStatus)
}, [conversationId])
```

---

## API Contract Definition

### #LCL_EXPORT_FIRM: integration_boundary::api_response_contract

**API Endpoint**: `POST /api/chatwoot-conversation`

**Expected Response Structure** (already implemented, documented here for reference):

```typescript
interface ChatwootConversationAPIResponse {
  // Success flag
  success: boolean

  // Conversation ID (primary identifier)
  conversationId: number

  // Widget configuration (for Chatwoot SDK)
  widgetConfig: {
    baseUrl: string
    websiteToken: string
    conversationId: number
    locale: 'en'
    position: 'right'
    hideMessageBubble: boolean

    // ⚠️ CRITICAL: Custom attributes contain broker assignment data
    customAttributes: {
      // Core broker assignment (from Supabase)
      ai_broker_id: string                    // "dr-elena"
      ai_broker_name: string                  // "Dr. Elena Rodriguez"
      broker_slug: string                     // "dr-elena"
      broker_persona: string                  // "analytical"
      broker_status: 'assigned' | 'queued' | 'joining'
      broker_join_eta?: number                // seconds until join (30, 45, etc.)
      broker_queue_position?: number          // position in queue if queued

      // Lead context
      lead_score: number
      loan_type: string
      property_category: string
      monthly_income: number
      purchase_timeline: string

      // Session tracking
      session_id: string
      contact_id?: number

      // Deduplication metadata
      conversation_reused?: boolean
      reuse_reason?: string

      // Employment and property context
      employment_type: string
      property_price: number
      existing_commitments: number
      applicant_ages: number[]

      // Bot trigger
      status: 'bot'
    }
  }

  // Error handling
  error?: string
  fallback?: {
    type: 'phone' | 'email' | 'form'
    contact: string
    message: string
  }
}
```

**Key Fields for Frontend State Propagation**:

| **Field** | **Type** | **Purpose** | **Priority** |
|-----------|----------|-------------|--------------|
| `customAttributes.ai_broker_name` | `string` | Display name in chat UI | **HIGH** |
| `customAttributes.broker_status` | `'assigned' \| 'queued' \| 'joining'` | Show queue status or joining message | **HIGH** |
| `customAttributes.ai_broker_id` | `string` | Unique broker identifier for analytics | MEDIUM |
| `customAttributes.broker_persona` | `string` | Personality type (for future AI tuning) | MEDIUM |
| `customAttributes.broker_join_eta` | `number` | Show "Joining in 30s..." message | LOW |
| `customAttributes.broker_queue_position` | `number` | Show "You're #2 in queue" message | LOW |

**Validation Rules**:
```typescript
// Frontend should validate API response before storing
function validateBrokerDataFromAPI(response: any): BrokerDataFromAPI | null {
  if (!response.success || !response.conversationId) {
    return null
  }

  const attrs = response.widgetConfig?.customAttributes
  if (!attrs) {
    return null
  }

  return {
    conversationId: response.conversationId,
    brokerId: attrs.ai_broker_id || '',
    brokerName: attrs.ai_broker_name || 'AI Mortgage Advisor',
    brokerPersonalityType: attrs.broker_persona || 'balanced',
    brokerStatus: attrs.broker_status || 'assigned',
    brokerJoinEta: attrs.broker_join_eta,
    brokerQueuePosition: attrs.broker_queue_position,
    contactId: attrs.contact_id
  }
}
```

---

## Integration Points with Backend

### #LCL_EXPORT_FIRM: integration_boundary::backend_requirements

**Backend Team Needs to Know**:

1. **Broker Name is Critical for UI**:
   - Frontend displays `customAttributes.ai_broker_name` in chat header
   - Must be populated for all `status: 'assigned'` responses
   - If queued (`status: 'queued'`), `ai_broker_name` can be empty or missing

2. **Broker Status Enum Values**:
   - `'assigned'`: Broker is assigned and ready to chat
   - `'queued'`: No brokers available, lead is in queue
   - `'joining'`: Broker is assigned but not yet active (future feature)
   - Frontend expects exactly these string values (case-sensitive)

3. **Queue Position is Optional but Recommended**:
   - If `status: 'queued'`, populate `broker_queue_position` (1, 2, 3, etc.)
   - Frontend will display: "You're #2 in queue" if available

4. **Broker Reassignment (Future Enhancement)**:
   - If brokers can be reassigned after conversation starts, frontend needs notification mechanism
   - Options: polling `/api/chat/messages` for updated `custom_attributes`, or WebSocket push
   - **#PLAN_UNCERTAINTY**: Not implemented in Phase 1, needs architecture discussion

5. **Deduplication Metadata**:
   - If conversation is reused, populate `conversation_reused: true` and `reuse_reason`
   - Frontend logs this for debugging but doesn't display to user

---

### #LCL_EXPORT_CRITICAL: integration_boundary::message_deduplication

**Duplicate Queue Message Issue**:

**Problem**: System message "All AI specialists are helping other clients..." appears **twice** in chat UI.

**Root Cause Analysis Needed**:
1. Is message sent twice by backend? (check n8n workflow logs)
2. Is message duplicated during polling? (check `/api/chat/messages` response)
3. Is frontend rendering the same message twice? (check `CustomChatInterface` logic)

**Recommended Solution**: Filter duplicates in `/api/chat/messages` before returning to frontend.

**Implementation**:
```typescript
// In app/api/chat/messages/route.ts, lines 85-126
const formattedMessages = messages
  .map((msg: any) => { /* existing formatting */ })
  .reduce((acc, msg, index, array) => {
    // Deduplicate queue messages by content substring
    if (msg.content?.includes('All AI specialists are helping')) {
      const alreadyHasQueueMessage = acc.some(m =>
        m.content?.includes('All AI specialists are helping')
      )
      if (alreadyHasQueueMessage) {
        console.log('Filtered duplicate queue message:', msg.id)
        return acc // Skip this duplicate
      }
    }

    return [...acc, msg]
  }, [])
```

**Alternative**: Deduplicate by message ID + content hash (more robust):
```typescript
const seenContentHashes = new Set<string>()

const formattedMessages = messages
  .map(msg => { /* formatting */ })
  .filter(msg => {
    // Create content hash (first 50 chars)
    const contentHash = `${msg.sender?.type || 'unknown'}_${msg.content?.substring(0, 50)}`

    if (seenContentHashes.has(contentHash)) {
      console.log('Filtered duplicate message:', msg.id, contentHash)
      return false
    }

    seenContentHashes.add(contentHash)
    return true
  })
```

**Backend Team Action Items**:
1. Investigate why queue message is sent twice (check Supabase trigger logs)
2. Implement deduplication in `/api/chat/messages` route (recommended)
3. OR fix root cause in Supabase/n8n workflow (if message is sent twice at source)

---

## Testing Strategy

### Unit Tests

```typescript
// Test: session-manager.ts
describe('sessionManager', () => {
  it('stores and retrieves broker data correctly', () => {
    const sessionId = 'test-session-123'
    const brokerData: ChatwootSession = {
      conversationId: 456,
      broker: {
        id: 'dr-elena',
        name: 'Dr. Elena Rodriguez',
        slug: 'dr-elena',
        personalityType: 'analytical',
        status: 'assigned'
      },
      createdAt: new Date().toISOString()
    }

    sessionManager.setChatwootSession(sessionId, brokerData)
    const retrieved = sessionManager.getChatwootSession(sessionId)

    expect(retrieved?.broker?.name).toBe('Dr. Elena Rodriguez')
    expect(retrieved?.broker?.status).toBe('assigned')
  })

  it('handles null broker (queued status)', () => {
    const sessionId = 'test-session-queued'
    const brokerData: ChatwootSession = {
      conversationId: 789,
      broker: null,
      createdAt: new Date().toISOString()
    }

    sessionManager.setChatwootSession(sessionId, brokerData)
    const retrieved = sessionManager.getChatwootSession(sessionId)

    expect(retrieved?.broker).toBeNull()
  })
})

// Test: ChatTransitionScreen.tsx
describe('ChatTransitionScreen broker assignment', () => {
  it('updates sessionStorage with broker name from API response', async () => {
    const mockResponse = {
      success: true,
      conversationId: 123,
      widgetConfig: {
        customAttributes: {
          ai_broker_name: 'Dr. Elena Rodriguez',
          ai_broker_id: 'dr-elena',
          broker_status: 'assigned'
        }
      }
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })

    render(<ChatTransitionScreen {...defaultProps} />)

    fireEvent.click(screen.getByText('Continue to Chat'))

    await waitFor(() => {
      const stored = sessionStorage.getItem('chatwoot_session_test-session')
      const parsed = JSON.parse(stored)
      expect(parsed.broker.name).toBe('Dr. Elena Rodriguez')
    })
  })

  it('handles queued status correctly', async () => {
    const mockResponse = {
      success: true,
      conversationId: 456,
      widgetConfig: {
        customAttributes: {
          broker_status: 'queued',
          broker_queue_position: 2
        }
      }
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })

    render(<ChatTransitionScreen {...defaultProps} />)
    fireEvent.click(screen.getByText('Continue to Chat'))

    await waitFor(() => {
      const stored = sessionStorage.getItem('chatwoot_session_test-session')
      const parsed = JSON.parse(stored)
      expect(parsed.broker).toBeNull()
    })
  })
})

// Test: IntegratedBrokerChat.tsx
describe('IntegratedBrokerChat broker name display', () => {
  it('uses broker name from props (Priority 1)', () => {
    const brokerData = {
      id: 'dr-elena',
      name: 'Dr. Elena Rodriguez',
      slug: 'dr-elena',
      personalityType: 'analytical',
      status: 'assigned'
    }

    render(
      <IntegratedBrokerChat
        conversationId={123}
        sessionId="test-session"
        formData={{}}
        brokerData={brokerData}
      />
    )

    expect(screen.getByText('Dr. Elena Rodriguez')).toBeInTheDocument()
  })

  it('falls back to sessionStorage if prop is missing', () => {
    sessionStorage.setItem('chatwoot_session_test-session', JSON.stringify({
      conversationId: 123,
      broker: {
        id: 'grace-lim',
        name: 'Grace Lim',
        slug: 'grace-lim',
        personalityType: 'conservative',
        status: 'assigned'
      }
    }))

    render(
      <IntegratedBrokerChat
        conversationId={123}
        sessionId="test-session"
        formData={{}}
      />
    )

    expect(screen.getByText('Grace Lim')).toBeInTheDocument()
  })
})
```

---

### Integration Tests

```typescript
// Test: Full flow from ChatTransitionScreen → InsightsPageClient → IntegratedBrokerChat
describe('Broker state propagation (E2E)', () => {
  it('propagates broker name through entire flow', async () => {
    // 1. Render ChatTransitionScreen
    render(<ChatTransitionScreen {...defaultProps} />)

    // 2. Click "Continue to Chat"
    fireEvent.click(screen.getByText('Continue to Chat'))

    // 3. Wait for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chatwoot-conversation', expect.any(Object))
    })

    // 4. Verify sessionStorage was updated
    const stored = sessionStorage.getItem('chatwoot_session_test-session')
    const parsed = JSON.parse(stored)
    expect(parsed.broker.name).toBe('Dr. Elena Rodriguez')

    // 5. Navigate to insights page
    router.push('/apply/insights?session=test-session')

    // 6. Verify InsightsPageClient reads broker from sessionStorage
    render(<InsightsPageClient initialMobileState={false} />)

    await waitFor(() => {
      expect(screen.getByText('Dr. Elena Rodriguez')).toBeInTheDocument()
    })
  })
})
```

---

## Implementation Checklist

### Phase 1: Core State Propagation (Priority: HIGH)

- [ ] **Update ChatTransitionScreen.tsx** (lines 169-196)
  - [ ] Extract broker data from API response `widgetConfig.customAttributes`
  - [ ] Write complete `ChatwootSession` to sessionStorage with broker info
  - [ ] Optional: Update displayed broker name before redirect (lines 282-313)
  - [ ] Add error handling for missing `ai_broker_name` field
  - [ ] Test: sessionStorage write happens before `onTransitionComplete()` call

- [ ] **Update session-manager.ts** (lines 11-17)
  - [ ] Replace `brokerName?: string` with `broker: AssignedBroker | null`
  - [ ] Add `preselectedPersona?: PreselectedBrokerPersona` field
  - [ ] Add TypeScript interface for `AssignedBroker` and `BrokerPersonalityType`
  - [ ] Update JSDoc comments with schema documentation

- [ ] **Update InsightsPageClient.tsx** (lines 22-37, 119-133)
  - [ ] Add `brokerData` state variable
  - [ ] Extract broker from sessionStorage in useEffect
  - [ ] Pass `brokerData` prop to ResponsiveBrokerShell
  - [ ] Test: broker data is available on mount (no API call needed)

- [ ] **Update ResponsiveBrokerShell.tsx** (lines 40-63, 114-128)
  - [ ] Add `brokerData?: AssignedBroker | null` to props interface
  - [ ] Pass `brokerData` to IntegratedBrokerChat
  - [ ] Test: prop drilling works correctly

- [ ] **Update IntegratedBrokerChat.tsx** (lines 17-25, 36-84)
  - [ ] Add `brokerData?: AssignedBroker | null` to props interface
  - [ ] Simplify broker name logic: prop → sessionStorage → API
  - [ ] Remove redundant API call when broker data is in props
  - [ ] Update sessionStorage when API fallback is used
  - [ ] Test: API call is skipped when broker data is available
  - [ ] Test: API fallback still works for backwards compatibility

---

### Phase 2: Edge Case Handling (Priority: MEDIUM)

- [ ] **Handle Queued Status**
  - [ ] Store `broker: null` when `status: 'queued'`
  - [ ] Display queue position message in UI
  - [ ] Fall back to pre-selected persona name for display
  - [ ] Test: queued conversations show correct messaging

- [ ] **Handle Malformed API Responses**
  - [ ] Add validation function `validateBrokerDataFromAPI()`
  - [ ] Default to pre-selected persona if broker name is missing
  - [ ] Log errors to console for debugging
  - [ ] Test: missing fields don't crash UI

- [ ] **Handle Page Refresh** (Hybrid Approach - Optional)
  - [ ] Pass broker name via URL params as backup
  - [ ] Read URL params in InsightsPageClient as fallback
  - [ ] Test: page refresh preserves broker name

---

### Phase 3: Message Deduplication (Priority: HIGH)

- [ ] **Investigate Duplicate Queue Message**
  - [ ] Check backend logs to identify source of duplicate
  - [ ] Determine if message is sent twice or rendered twice

- [ ] **Implement Backend Deduplication** (Recommended)
  - [ ] Add content-based filter in `/api/chat/messages` route
  - [ ] Filter out duplicate queue messages before returning to frontend
  - [ ] Test: duplicate messages are filtered correctly
  - [ ] **#LCL_EXPORT_FIRM: Coordinate with backend team**

- [ ] **OR Implement Frontend Deduplication** (Fallback)
  - [ ] Extend `getMessageRole()` to mark duplicates as system
  - [ ] Filter system messages in render logic
  - [ ] Test: duplicate messages are hidden in UI

---

### Phase 4: Testing & Validation (Priority: HIGH)

- [ ] **Unit Tests**
  - [ ] Test `sessionManager` CRUD operations
  - [ ] Test `ChatTransitionScreen` API response handling
  - [ ] Test `IntegratedBrokerChat` broker name priority logic
  - [ ] Test edge cases (null broker, missing fields, etc.)

- [ ] **Integration Tests**
  - [ ] Test full flow: ChatTransitionScreen → InsightsPageClient → IntegratedBrokerChat
  - [ ] Test sessionStorage persistence across components
  - [ ] Test API fallback when sessionStorage is empty

- [ ] **Manual QA**
  - [ ] Test on desktop Chrome
  - [ ] Test on mobile Safari (iOS)
  - [ ] Test page refresh behavior
  - [ ] Test slow API responses (throttle network)
  - [ ] Test queued status display
  - [ ] Verify no duplicate messages in chat

---

## Uncertainties & Questions

### #PLAN_UNCERTAINTY: Open Questions for Stakeholders

1. **Broker Reassignment Mid-Conversation**:
   - **Question**: Can brokers be reassigned after conversation starts?
   - **Impact**: If yes, need real-time update mechanism (polling/WebSocket)
   - **Status**: Out of scope for Phase 1, needs architecture discussion

2. **Queue Position Polling**:
   - **Question**: Should queue position update in real-time ("You're #3 in queue... #2... #1...")?
   - **Impact**: Requires polling `/api/chat/messages` every 5-10 seconds
   - **Status**: Nice-to-have, not critical for MVP

3. **Transition Screen Broker Update**:
   - **Question**: Should "Continue to Chat" button update to show real broker name after API returns?
   - **Impact**: Better UX consistency, but adds complexity
   - **Status**: Recommended (low effort, high value)

4. **URL Param Backup Strategy**:
   - **Question**: Is page refresh a common user behavior we need to support?
   - **Impact**: If yes, implement Hybrid Approach (Path D) with URL params
   - **Status**: Depends on analytics data (how often do users refresh?)

5. **Duplicate Message Root Cause**:
   - **Question**: Is queue message sent twice by backend, or rendered twice by frontend?
   - **Impact**: Determines whether fix is backend or frontend
   - **Status**: Needs backend team investigation

---

## Probability Space Distortion Markers

### #POISON_PATH: sessionStorage Over-Reliance

**Distortion**: The word "session" in "sessionStorage" made me initially assume it was the only viable state management approach.

**Reality**: URL params, React Context, and props are equally valid alternatives with different trade-offs.

**Mitigation**: Explored 4 different paths (A, B, C, D) with explicit pros/cons before recommending solution.

---

### #FIXED_FRAMING: "Broker State Must Update Reactively"

**Distortion**: Initial problem framing implied real-time updates were required ("UI never updates when real broker is assigned").

**Reality**: The issue is **initial state propagation**, not real-time updates. User sees wrong broker on first load, but doesn't need live updates after that.

**Mitigation**: Focused solution on one-time state write during API response, not continuous polling.

---

## Risk Assessment Summary

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
|----------|----------------|------------|----------------|
| **sessionStorage cleared by browser** | LOW | MEDIUM | Implement API fallback (already exists in IntegratedBrokerChat) |
| **Race condition: redirect before sessionStorage write** | LOW | HIGH | Use synchronous sessionStorage write before redirect |
| **Malformed API response (missing broker name)** | MEDIUM | LOW | Validate response and fall back to pre-selected persona |
| **Duplicate queue messages confuse users** | HIGH | MEDIUM | Implement backend deduplication in Phase 3 |
| **Page refresh loses broker state** | MEDIUM | LOW | Optional: Implement URL param backup (Hybrid Approach) |
| **Broker reassignment not supported** | LOW | HIGH (future) | Out of scope for Phase 1, needs architecture discussion |

---

## Recommended Implementation Order

### Week 1: Core State Propagation

1. **Day 1-2**: Update `ChatTransitionScreen.tsx` to write broker data to sessionStorage
2. **Day 2-3**: Update `session-manager.ts` with enhanced schema
3. **Day 3-4**: Update `InsightsPageClient.tsx` and `ResponsiveBrokerShell.tsx` to pass broker data
4. **Day 4-5**: Update `IntegratedBrokerChat.tsx` to use broker data from props
5. **Day 5**: Write unit tests for all modified components

### Week 2: Edge Cases & Testing

1. **Day 1-2**: Implement queued status handling
2. **Day 2-3**: Implement malformed response validation
3. **Day 3**: Investigate duplicate queue message root cause (backend team collaboration)
4. **Day 4**: Implement message deduplication (backend or frontend)
5. **Day 5**: Integration testing and manual QA

---

## Conclusion

**Recommended Solution**: **Path A (sessionStorage Update) + Path A (Backend Message Deduplication)**

**Rationale**:
- ✅ Simplest implementation (localized changes)
- ✅ Highest reliability (synchronous writes, no race conditions)
- ✅ Backward compatible (API fallback still works)
- ✅ Eliminates redundant API call in IntegratedBrokerChat
- ✅ Fixes duplicate message issue at the source

**Key Implementation Insight**: The problem is **not** a state management architecture issue—it's a **data flow timing issue**. We already have the broker name in the API response; we just need to **extract it and store it** before navigation.

**Success Criteria**:
1. ✅ Broker name displayed in chat header matches Supabase assignment (not pre-selected persona)
2. ✅ No redundant API call to fetch broker name (sessionStorage hit rate > 90%)
3. ✅ No duplicate queue messages in chat UI
4. ✅ Queued conversations show queue position correctly
5. ✅ Page refresh preserves broker name (if Hybrid Approach implemented)

---

## Next Steps

1. **Review this plan with team** (estimate: 30-60 minutes)
2. **Get approval from backend team** on API contract and message deduplication strategy
3. **Create TypeScript type definitions** (`types/broker.ts`)
4. **Begin Phase 1 implementation** (estimated: 3-5 days)
5. **Coordinate with backend team** on duplicate message investigation (parallel work)

---

**End of Plan**
