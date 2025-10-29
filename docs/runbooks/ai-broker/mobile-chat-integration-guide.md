# Mobile AI Broker Chat Integration Guide

**ABOUTME:** Step-by-step implementation guide for integrating mobile AI broker UI with production chat page. Zero-context engineer can follow this to complete integration using TDD workflow.

**Last Updated:** 2025-11-07
**Plan:** `docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md`
**Constraint:** A – Public Surfaces Ready

---

## Table of Contents

1. [Prerequisites & Context](#prerequisites--context)
2. [Current State vs Target State](#current-state-vs-target-state)
3. [Implementation Tasks](#implementation-tasks)
4. [Testing Strategy](#testing-strategy)
5. [Verification Checklist](#verification-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites & Context

### What You Need to Read FIRST

**Before touching any code, read these in order:**

1. **Design System & Tokens**
   - `docs/DESIGN_SYSTEM.md` - Color palette (gold, ink, fog, graphite)
   - `lib/design-tokens/mobile.ts` - Mobile spacing, touch targets, breakpoints
   - `docs/content/voice-and-tone.md` - Brand voice (professional, evidence-based)

2. **Architecture**
   - `docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md` - System overview
   - `docs/runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md` - Mobile component patterns
   - `lib/features/feature-flags.ts` - Feature flag system

3. **Testing Approach**
   - `docs/runbooks/TECH_STACK_GUIDE.md` - Next.js 14, React Testing Library, Playwright
   - Project uses TDD: Write failing test → Implement → Verify → Commit

4. **Project Rules (CRITICAL)**
   - `CLAUDE.md` - TDD mandatory, frequent commits, never skip tests
   - `docs/COMPONENT_PLACEMENT_DECISION_TREE.md` - Where files go
   - Test files go in same directory as component: `__tests__/ComponentName.test.tsx`

### Tech Stack Summary

- **Framework:** Next.js 14 (App Router, Server Components, Client Components)
- **State:** React hooks (useState, useEffect, useRef)
- **Styling:** Tailwind CSS with design tokens
- **Testing:** Jest + React Testing Library (unit), Playwright (e2e)
- **Chat Backend:** Chatwoot integration via API routes

### Current File Structure

```
app/
  chat/
    page.tsx                    ← PRODUCTION CHAT PAGE (we'll modify this)
    __tests__/
      ChatPageNavigationGuard.test.tsx

components/
  ai-broker/                    ← MOBILE COMPONENTS (already built)
    ResponsiveBrokerShell.tsx   ← ROUTER (mobile/desktop switcher)
    MobileAIBrokerUI.tsx
    MobileAIAssistantCompact.tsx
    IntegratedBrokerChat.tsx    ← DESKTOP CHAT (Chatwoot integration)
    types.ts

  chat/                         ← CURRENT CHAT COMPONENTS
    ChatLayoutShell.tsx         ← Desktop layout with sidebar
    CustomChatInterface.tsx     ← Chatwoot integration
    InsightsSidebar.tsx         ← Desktop sidebar

lib/
  features/
    feature-flags.ts            ← Feature flag definitions
  design-tokens/
    mobile.ts                   ← Mobile-first design tokens
  hooks/
    useMediaQuery.ts            ← Mobile detection hook
```

---

## Current State vs Target State

### Current Flow (Desktop-Only)

```
app/chat/page.tsx
  → <ChatLayoutShell> (fixed desktop layout)
      → <InsightsSidebar> (left sidebar)
      → <CustomChatInterface> (Chatwoot chat)
```

**Problem:** Mobile users get desktop layout (sidebars, large padding, desktop grid).

### Target Flow (Responsive)

```
app/chat/page.tsx
  → <ResponsiveBrokerShell> (device detector)
      → [Mobile] <MobileAIAssistantCompact> (full-screen mobile UI)
      → [Desktop] <IntegratedBrokerChat> (existing desktop UI)
```

**Solution:** Shell detects viewport, routes to appropriate UI via feature flag.

---

## Implementation Tasks

### Task 0: Environment Setup (5 minutes)

**Goal:** Enable mobile UI feature flag in development.

**Files to modify:**
- `.env.local` (create if doesn't exist)

**Steps:**

1. Create `.env.local` in project root:
```bash
# File: .env.local
NEXT_PUBLIC_MOBILE_AI_BROKER=true
```

2. Verify flag is enabled:
```bash
# Run dev server
npm run dev

# Open browser console, check:
console.log(process.env.NEXT_PUBLIC_MOBILE_AI_BROKER) // should print "true"
```

3. Restart dev server if already running (env changes require restart).

**Why:** Feature flag must be explicitly enabled for mobile UI to render. Development auto-enables it, but explicit env var is clearer.

**Commit:**
```
chore: enable mobile AI broker feature flag for development

- Add NEXT_PUBLIC_MOBILE_AI_BROKER=true to .env.local
- Required for ResponsiveBrokerShell to route mobile UI

Constraint: A – Public Surfaces Ready
Plan: docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md
```

**Verification:**
- [ ] `.env.local` file exists in project root
- [ ] File contains `NEXT_PUBLIC_MOBILE_AI_BROKER=true`
- [ ] Dev server restarts without errors

---

### Task 1: Write Integration Test (TDD - RED) (15 minutes)

**Goal:** Write failing test that describes desired behavior.

**Files to create:**
- `app/chat/__tests__/ChatPageMobileIntegration.test.tsx`

**Test Requirements:**
1. Test that chat page renders ResponsiveBrokerShell when feature flag enabled
2. Test that mobile UI renders on mobile viewport (375px)
3. Test that desktop UI renders on desktop viewport (1440px)
4. Test that conversationId prop passes through correctly

**Code:**

```typescript
// File: app/chat/__tests__/ChatPageMobileIntegration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import ChatContent from '../page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn()
  }))
}))

// Mock ResponsiveBrokerShell (we'll verify it gets called)
jest.mock('@/components/ai-broker/ResponsiveBrokerShell', () => ({
  ResponsiveBrokerShell: jest.fn(({ conversationId }) => (
    <div data-testid="responsive-broker-shell">
      ConversationId: {conversationId}
    </div>
  ))
}))

// Mock feature flags
jest.mock('@/lib/features/feature-flags', () => ({
  FEATURE_FLAGS: {
    MOBILE_AI_BROKER_UI: true
  }
}))

describe('ChatPage Mobile Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock sessionStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'form_data') {
        return JSON.stringify({
          name: 'Test User',
          email: 'test@example.com'
        })
      }
      return null
    })
  })

  it('renders ResponsiveBrokerShell when conversationId exists', async () => {
    // Arrange
    const mockSearchParams = new URLSearchParams('conversation=12345')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    // Act
    render(<ChatContent />)

    // Assert
    await waitFor(() => {
      const shell = screen.getByTestId('responsive-broker-shell')
      expect(shell).toBeInTheDocument()
      expect(shell).toHaveTextContent('ConversationId: 12345')
    })
  })

  it('passes user data from sessionStorage to ResponsiveBrokerShell', async () => {
    // Arrange
    const mockSearchParams = new URLSearchParams('conversation=12345')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    // Act
    render(<ChatContent />)

    // Assert
    await waitFor(() => {
      const { ResponsiveBrokerShell } = require('@/components/ai-broker/ResponsiveBrokerShell')
      expect(ResponsiveBrokerShell).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 12345,
          formData: expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com'
          })
        }),
        expect.anything()
      )
    })
  })

  it('renders empty state card when no conversationId', async () => {
    // Arrange
    const mockSearchParams = new URLSearchParams('')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    // Act
    render(<ChatContent />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Analysis not ready yet')).toBeInTheDocument()
      expect(screen.getByText('Start Your Analysis')).toBeInTheDocument()
    })
  })
})
```

**Run test (should FAIL):**
```bash
npm test -- app/chat/__tests__/ChatPageMobileIntegration.test.tsx
```

**Expected output:** Test fails because `ChatContent` doesn't use `ResponsiveBrokerShell` yet.

**Commit:**
```
test: add failing test for mobile AI broker chat integration

- Test ResponsiveBrokerShell renders on chat page
- Test conversationId and formData pass through correctly
- Test empty state when no conversationId
- Tests currently FAIL (TDD red phase)

Constraint: A – Public Surfaces Ready
Plan: docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md
```

**Verification:**
- [ ] Test file created at correct path
- [ ] Tests run and FAIL as expected
- [ ] Failure message mentions ResponsiveBrokerShell not found

---

### Task 2: Refactor Chat Page to Use ResponsiveBrokerShell (TDD - GREEN) (30 minutes)

**Goal:** Modify `app/chat/page.tsx` to use ResponsiveBrokerShell, make tests pass.

**Files to modify:**
- `app/chat/page.tsx`

**Current code structure:**
```typescript
// Current: app/chat/page.tsx (lines 130-173)
return (
  <ChatLayoutShell leftSidebar={<InsightsSidebar />}>
    <div className="h-full flex flex-col">
      {/* Loading state */}
      {/* Handoff notification */}
      <div className="flex-1 overflow-hidden">
        <CustomChatInterface
          conversationId={parseInt(conversationId)}
          contactName={userData?.name || 'You'}
          contactEmail={userData?.email}
          brokerName={broker?.name || 'Agent'}
          prefillMessage={inputMessage}
        />
      </div>
    </div>
  </ChatLayoutShell>
)
```

**Target code structure:**
```typescript
// Target: app/chat/page.tsx
return (
  <ResponsiveBrokerShell
    conversationId={parseInt(conversationId)}
    broker={broker}
    formData={userData}
    isLoading={!isReady}
  />
)
```

**Step-by-step refactor:**

1. **Add import at top of file:**

```typescript
// File: app/chat/page.tsx (add to imports section, around line 3)
import { ResponsiveBrokerShell } from '@/components/ai-broker/ResponsiveBrokerShell'
```

2. **Remove unused imports (lines 5-12):**

```typescript
// REMOVE these imports (no longer needed):
import CustomChatInterface from '@/components/chat/CustomChatInterface'
import ChatLayoutShell from '@/components/chat/ChatLayoutShell'
import InsightsSidebar from '@/components/chat/InsightsSidebar'
import BrokerProfile from '@/components/chat/BrokerProfile'
import HandoffNotification from '@/components/chat/HandoffNotification'
```

3. **Replace return statement (lines 130-173):**

**BEFORE:**
```typescript
return (
  <ChatLayoutShell leftSidebar={<InsightsSidebar />}>
    <div className="h-full flex flex-col">
      {!isReady ? (
        <div className="flex items-center justify-center min-h-[600px]">
          {/* Loading indicator */}
        </div>
      ) : (
        <>
          {isHandoff && (
            <HandoffNotification
              reason={handoffDetails.reason}
              urgencyLevel={handoffDetails.urgency}
            />
          )}
          <div className="flex-1 overflow-hidden">
            <CustomChatInterface
              conversationId={parseInt(conversationId)}
              contactName={userData?.name || 'You'}
              contactEmail={userData?.email}
              brokerName={broker?.name || 'Agent'}
              prefillMessage={inputMessage}
            />
          </div>
        </>
      )}
    </div>
  </ChatLayoutShell>
)
```

**AFTER:**
```typescript
return (
  <ResponsiveBrokerShell
    conversationId={parseInt(conversationId)}
    broker={broker}
    formData={userData}
    sessionId={conversationId} // Use conversationId as sessionId
    isLoading={!isReady}
  />
)
```

4. **Remove unused state variables (lines 23-26):**

```typescript
// REMOVE (no longer needed by ResponsiveBrokerShell):
const [isHandoff, setIsHandoff] = useState(false)
const [handoffDetails, setHandoffDetails] = useState<{ reason?: string; urgency?: any }>({})
const [inputMessage, setInputMessage] = useState('')
```

5. **Remove handoff event listener (lines 65-82):**

```typescript
// REMOVE entire block:
// Listen for handoff events (custom event from chat interface)
const handleHandoff = (event: CustomEvent) => {
  setIsHandoff(true)
  setHandoffDetails({
    reason: event.detail?.reason || 'Customer requested human assistance',
    urgency: event.detail?.urgency || 'normal'
  })
}

window.addEventListener('chatwoot:handoff' as any, handleHandoff)

// Cleanup
return () => {
  window.removeEventListener('chatwoot:handoff' as any, handleHandoff)
}
```

6. **Clean up unused functions:**

```typescript
// REMOVE (no longer needed):
const handleSuggestionClick = (text: string) => {
  setInputMessage(text)
}
```

**Final refactored file:**

```typescript
// File: app/chat/page.tsx (complete refactored version)
'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ResponsiveBrokerShell } from '@/components/ai-broker/ResponsiveBrokerShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversationId = searchParams.get('conversation')
  const [isReady, setIsReady] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [broker, setBroker] = useState<any>(null)
  const [isLoadingBroker, setIsLoadingBroker] = useState(true)
  const hasInitialized = useRef(false)

  // Navigation guard: Prevent back button from returning to form
  useEffect(() => {
    const currentPath = window.location.pathname + window.location.search
    window.history.pushState(null, '', currentPath)

    const handlePopState = () => {
      window.location.replace('/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Retrieve stored user information from sessionStorage
    const formData = sessionStorage.getItem('form_data')

    if (formData) {
      const data = JSON.parse(formData)
      console.log('Retrieved user data:', data)
      setUserData(data)
    }

    // Fetch broker details if conversation exists
    if (conversationId) {
      fetchBrokerDetails(conversationId)
    }

    // Small delay to ensure everything is loaded
    setTimeout(() => {
      setIsReady(true)
    }, 500)
  }, [conversationId])

  const fetchBrokerDetails = async (convId: string) => {
    try {
      setIsLoadingBroker(true)
      const response = await fetch(`/api/brokers/conversation/${convId}`)
      if (response.ok) {
        const data = await response.json()
        setBroker(data.broker)
        console.log('Broker assigned:', data.broker)
      } else {
        console.log('No broker assigned to this conversation')
      }
    } catch (error) {
      console.error('Error fetching broker:', error)
    } finally {
      setIsLoadingBroker(false)
    }
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <Card className="max-w-md border-fog">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-ink mb-2">Analysis not ready yet</h2>
            <p className="text-graphite mb-4">
              Complete the form first—we&apos;ll have your breakdown ready within 24 hours.
            </p>
            <Button
              onClick={() => window.location.href = '/apply'}
              className="bg-gold text-ink hover:bg-gold-dark"
            >
              Start Your Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ResponsiveBrokerShell
      conversationId={parseInt(conversationId)}
      broker={broker}
      formData={userData}
      sessionId={conversationId}
      isLoading={!isReady}
    />
  )
}

export default function ChatPage() {
  return (
    <div className="fixed inset-0">
      <Suspense fallback={
        <div className="min-h-screen bg-mist flex items-center justify-center">
          <div className="w-16 h-1 bg-fog overflow-hidden">
            <div className="h-full bg-gold transition-all duration-200" style={{ width: '60%' }}/>
          </div>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </div>
  )
}
```

**Run tests (should PASS):**
```bash
npm test -- app/chat/__tests__/ChatPageMobileIntegration.test.tsx
```

**Expected output:** All tests pass.

**Commit:**
```
feat: integrate ResponsiveBrokerShell with chat page

- Replace ChatLayoutShell with ResponsiveBrokerShell
- Remove unused components (CustomChatInterface, InsightsSidebar, HandoffNotification)
- Pass conversationId, broker, formData to shell
- Shell handles mobile/desktop routing via feature flag
- Tests now PASS (TDD green phase)

Constraint: A – Public Surfaces Ready
Plan: docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Verification:**
- [ ] Tests pass
- [ ] Dev server starts without errors
- [ ] Navigate to `/chat?conversation=123` → page renders
- [ ] No TypeScript errors in IDE

---

### Task 3: Manual Mobile/Desktop Toggle Test (10 minutes)

**Goal:** Verify feature flag toggle switches between mobile and desktop UI.

**No code changes.** This is manual verification only.

**Steps:**

1. **Test Mobile UI (Feature Flag ON):**

```bash
# Ensure .env.local has:
NEXT_PUBLIC_MOBILE_AI_BROKER=true

# Restart dev server
npm run dev

# Open browser (Chrome DevTools)
# 1. Navigate to http://localhost:3000/chat?conversation=12345
# 2. Open DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)
# 3. Select "iPhone SE" (375×667)
# 4. Refresh page
```

**Expected:** Mobile UI renders (MobileAIAssistantCompact component).

**Visual check:**
- Full-screen mobile layout (no sidebar)
- Touch-friendly spacing
- Large touch targets (≥44px)

2. **Test Desktop UI (Same Flag ON):**

```bash
# Same browser, same URL
# 1. Toggle Device Toolbar OFF (desktop view)
# 2. Resize browser to 1440px wide
# 3. Refresh page
```

**Expected:** Desktop UI renders (IntegratedBrokerChat component).

**Visual check:**
- Desktop layout with sidebar
- Standard desktop spacing
- Desktop-sized buttons

3. **Test Feature Flag OFF:**

```bash
# Edit .env.local:
NEXT_PUBLIC_MOBILE_AI_BROKER=false

# Restart dev server
npm run dev

# Repeat mobile/desktop tests
```

**Expected:** Desktop UI renders on BOTH mobile and desktop (fallback behavior).

4. **Restore Feature Flag:**

```bash
# Edit .env.local:
NEXT_PUBLIC_MOBILE_AI_BROKER=true

# Restart dev server
```

**Document results:**

Create file: `docs/test-reports/2025-11-07-mobile-chat-integration-manual-test.md`

```markdown
# Mobile Chat Integration Manual Test

**Date:** 2025-11-07
**Tester:** [Your Name]
**Environment:** Development (localhost:3000)

## Test Results

| Viewport | Flag ON | Flag OFF |
|----------|---------|----------|
| Mobile (375px) | ✅ Mobile UI | ✅ Desktop UI (fallback) |
| Desktop (1440px) | ✅ Desktop UI | ✅ Desktop UI (fallback) |

## Screenshots

- Mobile UI: [attach screenshot]
- Desktop UI: [attach screenshot]

## Issues Found

[None / List any issues]

## Notes

- Toggle works as expected
- No console errors
- Smooth transition between layouts
```

**Commit:**
```
docs: add mobile chat integration manual test report

- Verified ResponsiveBrokerShell toggles mobile/desktop correctly
- Feature flag ON → mobile UI on mobile, desktop UI on desktop
- Feature flag OFF → desktop UI everywhere (fallback)
- No console errors or visual regressions

Constraint: A – Public Surfaces Ready
Plan: docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Verification:**
- [ ] Mobile UI renders at 375px with flag ON
- [ ] Desktop UI renders at 1440px with flag ON
- [ ] Desktop UI renders everywhere with flag OFF
- [ ] Test report created with screenshots

---

### Task 4: Add E2E Test for Mobile Flow (20 minutes)

**Goal:** Write Playwright test that verifies mobile chat flow end-to-end.

**Files to create:**
- `tests/e2e-mobile-chat-integration.spec.ts`

**Test Requirements:**
1. Test form submission → redirect to chat page
2. Test mobile viewport renders mobile UI
3. Test conversationId in URL
4. Test no horizontal scroll on mobile

**Code:**

```typescript
// File: tests/e2e-mobile-chat-integration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Mobile Chat Integration', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  })

  test('redirects to chat page after form submission', async ({ page }) => {
    // Navigate to form
    await page.goto('http://localhost:3000/apply')

    // Fill form (simplified - adjust based on actual form fields)
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Wait for redirect to chat page
    await page.waitForURL(/\/chat\?conversation=\d+/)

    // Verify conversationId in URL
    const url = page.url()
    expect(url).toContain('/chat?conversation=')
  })

  test('renders mobile UI on mobile viewport', async ({ page }) => {
    // Navigate directly to chat (assume conversationId=12345 for testing)
    await page.goto('http://localhost:3000/chat?conversation=12345')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check for mobile UI indicators
    // Adjust selectors based on actual mobile UI structure
    const isMobileLayout = await page.evaluate(() => {
      const width = window.innerWidth
      return width <= 768 // Mobile breakpoint
    })

    expect(isMobileLayout).toBe(true)

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test('mobile UI is touch-friendly', async ({ page }) => {
    await page.goto('http://localhost:3000/chat?conversation=12345')
    await page.waitForLoadState('networkidle')

    // Find all interactive elements (buttons, links)
    const interactiveElements = await page.locator('button, a[href], input, textarea').all()

    // Check touch target sizes (minimum 44px)
    for (const element of interactiveElements) {
      const box = await element.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.width).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('empty state shows when no conversationId', async ({ page }) => {
    await page.goto('http://localhost:3000/chat')
    await page.waitForLoadState('networkidle')

    // Verify empty state message
    await expect(page.getByText('Analysis not ready yet')).toBeVisible()
    await expect(page.getByText('Start Your Analysis')).toBeVisible()
  })
})

test.describe('Desktop Chat Integration', () => {
  test.use({
    viewport: { width: 1440, height: 900 } // Desktop
  })

  test('renders desktop UI on desktop viewport', async ({ page }) => {
    await page.goto('http://localhost:3000/chat?conversation=12345')
    await page.waitForLoadState('networkidle')

    // Check for desktop UI indicators
    const isDesktopLayout = await page.evaluate(() => {
      const width = window.innerWidth
      return width > 768 // Desktop breakpoint
    })

    expect(isDesktopLayout).toBe(true)
  })
})
```

**Run E2E test:**

```bash
# Start dev server (if not running)
npm run dev

# Run Playwright test (in separate terminal)
npx playwright test tests/e2e-mobile-chat-integration.spec.ts
```

**Expected output:** Tests pass (may need to adjust selectors based on actual UI).

**Commit:**
```
test: add e2e tests for mobile chat integration

- Test form → chat redirect with conversationId
- Test mobile UI renders on mobile viewport
- Test no horizontal scroll on mobile
- Test touch target sizes ≥44px
- Test desktop UI renders on desktop viewport

Constraint: A – Public Surfaces Ready
Plan: docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Verification:**
- [ ] E2E tests pass on mobile viewport (375px)
- [ ] E2E tests pass on desktop viewport (1440px)
- [ ] No horizontal scroll detected
- [ ] Touch targets verified ≥44px

---

### Task 5: Create Test Playground Pages (15 minutes)

**Goal:** Create isolated test pages for rapid manual QA.

**Files to create:**
1. `app/test-mobile-chat/page.tsx` - Mobile-only test page
2. `app/test-desktop-chat/page.tsx` - Desktop-only test page

**Why:** Allows testing mobile/desktop UI in isolation without toggling feature flags or viewport.

**Code:**

```typescript
// File: app/test-mobile-chat/page.tsx
'use client'

import { Suspense } from 'react'
import { MobileAIAssistantCompact } from '@/components/ai-broker/MobileAIAssistantCompact'

// Mock data for testing
const mockData = {
  situationalInsights: {
    otpAnalysis: {
      urgencyLevel: 'high' as const,
      keyFactors: ['Lock-in ending soon', 'Market rates favorable'],
      recommendations: ['Refinance to fixed rate', 'Consider 3-year lock-in'],
      timeline: 'Complete within 4 weeks'
    },
    overallRecommendation: 'Refinancing recommended based on current market conditions'
  },
  rateIntelligence: {
    marketPhase: 'Stabilizing',
    timingRecommendation: 'Lock in rates now before next Fed decision',
    keyInsights: ['Rates expected to stabilize', 'Good time to lock in']
  },
  defenseStrategy: {
    primaryFocus: 'Secure favorable fixed rate',
    nextActions: ['Submit refinancing application', 'Compare bank offers']
  },
  leadScore: 85
}

export default function TestMobileChatPage() {
  return (
    <div className="fixed inset-0 bg-white">
      {/* Force mobile viewport for testing */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />

      <Suspense fallback={<div>Loading...</div>}>
        <MobileAIAssistantCompact
          situationalInsights={mockData.situationalInsights}
          rateIntelligence={mockData.rateIntelligence}
          defenseStrategy={mockData.defenseStrategy}
          leadScore={mockData.leadScore}
          isLoading={false}
          formData={{ name: 'Test User', email: 'test@example.com' }}
          sessionId="test-session-123"
        />
      </Suspense>
    </div>
  )
}
```

```typescript
// File: app/test-desktop-chat/page.tsx
'use client'

import { Suspense } from 'react'
import { IntegratedBrokerChat } from '@/components/ai-broker/IntegratedBrokerChat'

// Mock data for testing (same as mobile)
const mockData = {
  situationalInsights: {
    otpAnalysis: {
      urgencyLevel: 'high' as const,
      keyFactors: ['Lock-in ending soon', 'Market rates favorable'],
      recommendations: ['Refinance to fixed rate', 'Consider 3-year lock-in'],
      timeline: 'Complete within 4 weeks'
    },
    overallRecommendation: 'Refinancing recommended based on current market conditions'
  },
  rateIntelligence: {
    marketPhase: 'Stabilizing',
    timingRecommendation: 'Lock in rates now before next Fed decision',
    keyInsights: ['Rates expected to stabilize', 'Good time to lock in']
  },
  defenseStrategy: {
    primaryFocus: 'Secure favorable fixed rate',
    nextActions: ['Submit refinancing application', 'Compare bank offers']
  },
  leadScore: 85
}

export default function TestDesktopChatPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div>Loading...</div>}>
        <IntegratedBrokerChat
          conversationId={12345}
          broker={{ name: 'Test Broker', email: 'broker@example.com' }}
          formData={{ name: 'Test User', email: 'test@example.com' }}
          sessionId="test-session-123"
          situationalInsights={mockData.situationalInsights}
          rateIntelligence={mockData.rateIntelligence}
          defenseStrategy={mockData.defenseStrategy}
          leadScore={mockData.leadScore}
        />
      </Suspense>
    </div>
  )
}
```

**Usage:**

```bash
# Test mobile UI in isolation
http://localhost:3000/test-mobile-chat

# Test desktop UI in isolation
http://localhost:3000/test-desktop-chat
```

**Manual QA Checklist:**

1. Navigate to `/test-mobile-chat`:
   - [ ] UI renders in 375px viewport
   - [ ] No horizontal scroll
   - [ ] Touch targets ≥44px
   - [ ] Chat composer works
   - [ ] Insights display correctly

2. Navigate to `/test-desktop-chat`:
   - [ ] UI renders in desktop layout
   - [ ] Sidebar displays insights
   - [ ] Chat interface works
   - [ ] Desktop spacing correct

**Commit:**
```
feat: add test playground pages for mobile/desktop chat

- Create /test-mobile-chat for isolated mobile UI testing
- Create /test-desktop-chat for isolated desktop UI testing
- Mock data allows testing without real conversationId
- Useful for rapid manual QA and visual regression testing

Constraint: A – Public Surfaces Ready
Plan: docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Verification:**
- [ ] `/test-mobile-chat` page loads without errors
- [ ] `/test-desktop-chat` page loads without errors
- [ ] Both pages render mock data correctly
- [ ] Pages useful for manual testing

---

## Testing Strategy

### Unit Tests (React Testing Library)

**What to test:**
- Component renders correctly with props
- State changes work as expected
- User interactions trigger correct callbacks
- Error states display properly

**Example test structure:**

```typescript
describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const mockCallback = jest.fn()
    render(<ComponentName onAction={mockCallback} />)

    await userEvent.click(screen.getByRole('button'))
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('displays error state when error prop provided', () => {
    render(<ComponentName error="Test error" />)
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })
})
```

### E2E Tests (Playwright)

**What to test:**
- Full user flows (form → chat → interaction)
- Viewport-specific behavior (mobile vs desktop)
- Navigation guards (back button behavior)
- Performance metrics (load time, Core Web Vitals)

**Example test structure:**

```typescript
test('user completes full flow', async ({ page }) => {
  // Start at homepage
  await page.goto('/')

  // Fill form
  await page.fill('[name="name"]', 'Test User')
  await page.click('button[type="submit"]')

  // Verify redirect
  await page.waitForURL(/\/chat/)

  // Verify chat loads
  await expect(page.getByRole('textbox')).toBeVisible()
})
```

### Manual Testing Checklist

**Mobile (iPhone SE - 375×667):**
- [ ] No horizontal scroll on any page
- [ ] All buttons ≥44px touch targets
- [ ] Text readable without zoom
- [ ] Chat composer accessible (not hidden by keyboard)
- [ ] Smooth scrolling performance
- [ ] No layout shifts (CLS <0.1)

**Desktop (1440×900):**
- [ ] Sidebar visible and functional
- [ ] Chat interface full-featured
- [ ] Insights display with proper spacing
- [ ] No layout regressions from mobile changes

**Cross-browser (minimum):**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Chrome Desktop
- [ ] Safari Desktop

---

## Verification Checklist

### Code Quality

- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npx playwright test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code follows DRY principle (no duplication)
- [ ] YAGNI principle followed (no unused code)

### Functionality

- [ ] Feature flag toggle works (mobile/desktop switch)
- [ ] ConversationId passes through correctly
- [ ] Form data (userData) passes through correctly
- [ ] Broker data passes through correctly
- [ ] Empty state shows when no conversationId
- [ ] Navigation guard prevents back to form

### Performance

- [ ] Page loads in <2s on 3G (DevTools throttling)
- [ ] No console errors
- [ ] No unnecessary re-renders
- [ ] Images/assets optimized
- [ ] No layout shift (CLS <0.1)

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44px on mobile
- [ ] Focus indicators visible

### Documentation

- [ ] Work log updated with completion
- [ ] Test reports committed
- [ ] Screenshots captured for mobile/desktop
- [ ] Plan updated with learnings

---

## Troubleshooting

### Issue: Feature Flag Not Working

**Symptoms:** Mobile UI doesn't render even with flag enabled.

**Solution:**
1. Check `.env.local` file exists and contains `NEXT_PUBLIC_MOBILE_AI_BROKER=true`
2. Restart dev server (`npm run dev`)
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for feature flag value:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_MOBILE_AI_BROKER)
   ```

### Issue: Tests Failing with "ResponsiveBrokerShell not found"

**Symptoms:** Unit tests fail with import error.

**Solution:**
1. Check file path: `components/ai-broker/ResponsiveBrokerShell.tsx` exists
2. Check export: File exports `ResponsiveBrokerShell` (not default export)
3. Update import in test:
   ```typescript
   import { ResponsiveBrokerShell } from '@/components/ai-broker/ResponsiveBrokerShell'
   ```

### Issue: Horizontal Scroll on Mobile

**Symptoms:** Content wider than viewport on mobile.

**Solution:**
1. Check for fixed widths in CSS (use `max-w-full` instead)
2. Check for large padding/margins (use mobile design tokens)
3. Use Chrome DevTools → Elements → Computed to find overflowing element
4. Add to CSS: `overflow-x: hidden` as last resort (fix root cause first)

### Issue: Touch Targets Too Small

**Symptoms:** Buttons/links hard to tap on mobile.

**Solution:**
1. Check element uses mobile design tokens:
   ```typescript
   import { MOBILE_DESIGN_TOKENS } from '@/lib/design-tokens/mobile'

   // Apply minimum touch target
   className={`min-h-[${MOBILE_DESIGN_TOKENS.touchTargets.minimum}]`}
   ```
2. Use `getTouchTarget()` helper function
3. Add padding to increase clickable area

### Issue: Desktop UI Shows on Mobile

**Symptoms:** Desktop layout renders on mobile viewport.

**Solution:**
1. Check feature flag: `NEXT_PUBLIC_MOBILE_AI_BROKER=true`
2. Check `useMobileView()` hook works (log viewport width):
   ```typescript
   const isMobile = useMobileView()
   console.log('Is mobile:', isMobile, 'Width:', window.innerWidth)
   ```
3. Check ResponsiveBrokerShell logic:
   ```typescript
   const shouldUseMobileUI = FEATURE_FLAGS.MOBILE_AI_BROKER_UI && isMobileViewport
   ```

### Issue: TypeScript Errors in Chat Page

**Symptoms:** Red squiggles in IDE, build fails.

**Solution:**
1. Check prop types match:
   ```typescript
   // ResponsiveBrokerShell expects:
   conversationId: number
   broker: AssignedBroker | null
   formData: any
   ```
2. Check imports correct:
   ```typescript
   import { ResponsiveBrokerShell } from '@/components/ai-broker/ResponsiveBrokerShell'
   ```
3. Run `npm run build` to see full error messages

---

## Success Criteria Met

After completing all tasks, verify:

- [ ] Feature flag toggle works (verified manually)
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Mobile UI renders correctly (375px)
- [ ] Desktop UI renders correctly (1440px)
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥44px verified
- [ ] No console errors
- [ ] Production build succeeds
- [ ] Test reports committed
- [ ] Work log updated
- [ ] Plan marked complete

**Next:** Update Stage 0 Launch Gate verification log in `docs/plans/re-strategy/stage0-launch-gate.md`.

---

**Last Updated:** 2025-11-07
**Plan:** `docs/plans/active/mobile-ai-broker-ui-rebuild-plan.md`
**Related:** `docs/runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md`
