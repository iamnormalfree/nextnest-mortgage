---
title: broker-ui-reintegration-plan
status: in-progress
owner: engineering
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Use `/response-awareness` to deploy Phase 1 planners before executing this plan.

# Broker UI Re-Integration Plan (CORRECTED)

_Last updated: 2025-09-25 - Senior Dev Review Complete_

## ⚠️ CRITICAL: Architecture Understanding
**The SophisticatedAIBrokerUI does NOT have real chat functionality** - it only has a placeholder chat simulation. This plan has been completely revised to address the actual architecture.

## Objective
Integrate the live Chatwoot-powered CustomChatInterface into the sophisticated broker UI layout while maintaining the premium design and ensuring proper data flow.

## Prerequisites
- [ ] **STOP**: Read this entire plan before starting any code changes
- [ ] .env.local contains valid Chatwoot credentials (verify with `grep CHATWOOT .env.local`)
- [ ] npm run dev runs without errors
- [ ] Create test Chatwoot conversation manually to verify API connectivity
- [ ] Document current UI flow with screenshots in validation-reports/before/

## Architecture Issues to Fix
1. **conversationId is NOT passed to ResponsiveBrokerShell** - must add this prop
2. **Session storage keys are inconsistent** - need unified approach
3. **SophisticatedAIBrokerUI has no real chat** - only placeholder messages
4. **Feature flags may cause unexpected mobile UI on desktop** - verify logic

## Implementation Phases

### Phase 1: Add conversationId Support (MUST DO FIRST)
**Time: 2 hours**

#### 1.1 Update ResponsiveBrokerShell Interface
- [ ] Open `components/ai-broker/ResponsiveBrokerShell.tsx`
- [ ] Add conversationId to the interface (after line 31):
```typescript
export interface ResponsiveBrokerShellProps {
  // ... existing props ...

  // Chat integration
  conversationId?: number | null

  // ... rest of props ...
}
```
- [ ] Add conversationId to the component props destructuring (line 57)
- [ ] Test TypeScript compilation: `npx tsc --noEmit`

#### 1.2 Update InsightsPageClient to Pass conversationId
- [ ] Open `app/apply/insights/InsightsPageClient.tsx`
- [ ] Pass chatwootConversationId to ResponsiveBrokerShell (line 115):
```typescript
<ResponsiveBrokerShell
  conversationId={chatwootConversationId}  // ADD THIS LINE
  situationalInsights={analysisData?.situationalInsights}
  // ... other props
/>
```
- [ ] Verify prop is passed correctly with console.log in ResponsiveBrokerShell

### Phase 2: Create Unified Session Manager (CRITICAL)
**Time: 2 hours**

#### 2.1 Create Session Manager Utility
- [ ] Create new file: `lib/utils/session-manager.ts`
```typescript
// Unified session storage keys
const KEYS = {
  CHATWOOT_SESSION: (sessionId: string) => `chatwoot_session_${sessionId}`,
  FORM_DATA: 'form_data',
  LEAD_SCORE: 'lead_score',
  WIDGET_CONFIG: 'chatwoot_widget_config'
} as const

export const sessionManager = {
  getChatwootSession(sessionId: string) {
    const stored = sessionStorage.getItem(KEYS.CHATWOOT_SESSION(sessionId))
    return stored ? JSON.parse(stored) : null
  },

  setChatwootSession(sessionId: string, data: any) {
    sessionStorage.setItem(KEYS.CHATWOOT_SESSION(sessionId), JSON.stringify(data))
  },

  getFormData() {
    const stored = sessionStorage.getItem(KEYS.FORM_DATA)
    return stored ? JSON.parse(stored) : null
  },

  // ... add other methods as needed
}
```
- [ ] Replace all direct sessionStorage calls with sessionManager
- [ ] Test session persistence across page refreshes

### Phase 3: Create Integrated Broker Chat Component
**Time: 3 hours**

#### 3.1 Extract Layout from SophisticatedAIBrokerUI
- [ ] Create `components/ai-broker/SophisticatedLayout.tsx`
- [ ] Copy lines 183-299 from SophisticatedAIBrokerUI (the sidebar and header)
- [ ] Make it accept `children` prop for the chat area
- [ ] Export metrics data as props

#### 3.2 Create IntegratedBrokerChat Component
- [ ] Create `components/ai-broker/IntegratedBrokerChat.tsx`
```typescript
'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { SophisticatedLayout } from './SophisticatedLayout'

// Lazy load the chat interface
const CustomChatInterface = dynamic(
  () => import('@/components/chat/CustomChatInterface'),
  {
    ssr: false,
    loading: () => <ChatLoadingSkeleton />
  }
)

interface IntegratedBrokerChatProps {
  conversationId: number
  formData: any
  sessionId: string
  situationalInsights?: any
  rateIntelligence?: any
  defenseStrategy?: any
  leadScore?: number | null
}

export function IntegratedBrokerChat({
  conversationId,
  formData,
  sessionId,
  situationalInsights,
  rateIntelligence,
  defenseStrategy,
  leadScore
}: IntegratedBrokerChatProps) {
  // Extract broker name from formData or use default
  const brokerName = formData?.brokerName || 'AI Mortgage Advisor'

  return (
    <SophisticatedLayout
      insights={situationalInsights}
      rateIntelligence={rateIntelligence}
      leadScore={leadScore}
    >
      <CustomChatInterface
        conversationId={conversationId}
        contactName={formData?.name || 'You'}
        contactEmail={formData?.email}
        brokerName={brokerName}
      />
    </SophisticatedLayout>
  )
}

function ChatLoadingSkeleton() {
  return (
    <div className="flex-1 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  )
}
```
- [ ] Test component renders without errors
- [ ] Verify CustomChatInterface receives all required props

### Phase 4: Update ResponsiveBrokerShell Logic
**Time: 1 hour**

#### 4.1 Implement Conditional Rendering
- [ ] Open `components/ai-broker/ResponsiveBrokerShell.tsx`
- [ ] Import the new IntegratedBrokerChat component
- [ ] Update the desktop rendering logic (starting at line 99):
```typescript
// Desktop UI - Choose between integrated chat or placeholder
if (!shouldUseMobileUI) {
  // If we have a conversationId, show the integrated chat
  if (conversationId) {
    return (
      <IntegratedBrokerChat
        conversationId={conversationId}
        formData={formData}
        sessionId={sessionId}
        situationalInsights={situationalInsights}
        rateIntelligence={rateIntelligence}
        defenseStrategy={defenseStrategy}
        leadScore={leadScore}
      />
    )
  }

  // Otherwise show the placeholder UI (existing behavior)
  return (
    <SophisticatedAIBrokerUI
      formData={formData}
      sessionId={sessionId}
      // ... other props
    />
  )
}
```
- [ ] Test both paths: with and without conversationId
- [ ] Verify smooth transition between states

### Phase 5: Fix Feature Flag Logic
**Time: 1 hour**

#### 5.1 Update Feature Flag Configuration
- [ ] Open `lib/features/feature-flags.ts`
- [ ] Add explicit environment check:
```typescript
export const FEATURE_FLAGS = {
  MOBILE_AI_BROKER_UI:
    typeof window !== 'undefined' && window.innerWidth < 768 ? true :
    process.env.NEXT_PUBLIC_MOBILE_AI_BROKER === 'true',
  // ... other flags
}
```
- [ ] Test on different viewport sizes
- [ ] Verify desktop users don't see mobile UI incorrectly

### Phase 6: Comprehensive Testing
**Time: 2 hours**

#### 6.1 End-to-End Flow Testing
- [ ] Start fresh incognito browser session
- [ ] Complete entire /apply flow
- [ ] Verify ChatTransitionScreen creates conversation
- [ ] Confirm /apply/insights shows live chat
- [ ] Test message sending and receiving
- [ ] Refresh page - verify chat persists
- [ ] Switch to mobile viewport - verify mobile UI loads

#### 6.2 Error Scenario Testing
- [ ] Test with invalid Chatwoot credentials
- [ ] Test with network disconnection
- [ ] Test with missing sessionStorage data
- [ ] Verify fallback UI shows appropriately

#### 6.3 Code Quality Checks
- [ ] Run `npm run lint` - fix all errors
- [ ] Run `npm run lint:brand` - fix brand violations
- [ ] Run `npx tsc --noEmit` - fix TypeScript errors
- [ ] Check browser console - zero errors/warnings

### Phase 7: Documentation & Handoff
**Time: 1 hour**

#### 7.1 Create Implementation Report
- [ ] Document all changed files in validation-reports/implementation.md
- [ ] Include before/after screenshots
- [ ] List any remaining known issues
- [ ] Document testing steps performed

#### 7.2 Prepare Pull Request
- [ ] Write detailed PR description
- [ ] Include testing instructions
- [ ] Link to this plan
- [ ] Tag appropriate reviewers

## Common Pitfalls to Avoid

### ❌ DO NOT:
1. Assume SophisticatedAIBrokerUI has real chat functionality
2. Modify CustomChatInterface's core logic
3. Change the mobile UI flow
4. Forget to handle missing conversationId
5. Use inconsistent session storage keys
6. Skip the TypeScript compilation tests
7. Merge without testing the complete flow

### ✅ DO:
1. Test each phase independently before moving on
2. Keep the existing UI as fallback
3. Add console.log statements for debugging (remove before PR)
4. Test on both mobile and desktop viewports
5. Verify Chatwoot messages actually appear
6. Handle all error cases gracefully
7. Document any deviations from this plan

## Success Criteria
- [ ] Live Chatwoot messages appear in sophisticated UI layout
- [ ] No console errors or warnings in production build
- [ ] Mobile/desktop switching works correctly
- [ ] Session persists across page refreshes
- [ ] Graceful degradation when Chatwoot unavailable
- [ ] All existing functionality remains intact
- [ ] Page load time remains under 3 seconds

## Emergency Rollback
If critical issues arise:
1. `git stash` your changes
2. `git checkout main`
3. `npm run dev` to verify stability
4. Document the issue encountered
5. Consult senior developer before retry

## Time Estimate
**Total: 12 hours** broken down as:
- Phase 1: 2 hours
- Phase 2: 2 hours
- Phase 3: 3 hours
- Phase 4: 1 hour
- Phase 5: 1 hour
- Phase 6: 2 hours
- Phase 7: 1 hour

**Add 20% buffer for unexpected issues: ~15 hours total**

---

## Notes for Junior Developer
This plan has been completely revised after discovering that the original assumptions were incorrect. The SophisticatedAIBrokerUI doesn't have real chat - it's just a mockup. Follow this plan exactly in order - each phase builds on the previous one. If you encounter ANY issues not covered here, STOP and ask for help rather than trying to improvise solutions.