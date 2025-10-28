# Form Navigation Standardization & Chat History Fix

**ABOUTME:** Comprehensive implementation guide for standardizing navigation across form flow and fixing chat back button behavior.
**ABOUTME:** Contains all code examples, component extraction, testing procedures for executing form navigation plan.

## Purpose

This runbook supports `docs/plans/active/2025-11-07-form-navigation-standardization.md`. It contains the detailed "how" while the plan contains the "what/why/when" decisions.

## Prerequisites

**Read these first:**
1. Current navigation: `components/layout/ConditionalNav.tsx`
2. Apply page: `app/apply/page.tsx`
3. Form controller: `components/forms/ProgressiveFormWithController.tsx`

**Key principles:**
- Consistent navigation across all form pages (loan selector + Steps 1-4)
- "Back to Home" always goes to `/` (not browser history back)
- Chat page uses `router.replace()` to prevent back button navigation loop

## Problem Statement

**Issue 1: Inconsistent Navigation**
- `/apply` page (loan selector) has minimal nav (logo only)
- Form Steps 1-4 may have different nav patterns
- User confused about how to exit form flow

**Issue 2: Chat Back Button Loop**
- User completes form → redirects to `/chat`
- User manually navigates to `/apply` again
- Clicks browser back button → goes to `/chat` (incorrect)
- **Should go to:** `/` (homepage)

## Target Files

**Files to modify:**
1. `components/layout/FormNav.tsx` (NEW - create shared component)
2. `components/layout/ConditionalNav.tsx` (update /apply navigation)
3. `app/apply/page.tsx` (use new FormNav component)
4. `components/forms/ProgressiveFormWithController.tsx` (render FormNav in form steps)
5. `app/chat/page.tsx` (add router.replace() and navigation guard)

**Files to read (context only):**
- `app/layout.tsx` (understand layout structure)
- `lib/forms/form-config.ts` (understand step names)

## Task 1: Create Shared FormNav Component

**Location:** Create new file `components/layout/FormNav.tsx`

**Purpose:** Consistent top navigation for all form pages (loan selector + Steps 1-4)

**Full component code:**

```typescript
// ABOUTME: Standardized navigation component for form flow pages
// ABOUTME: Provides consistent "Back to Home" and "Get Started" CTAs across loan selector and form steps

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Logo from '@/public/images/logos/nn-logo-nobg-img.png'

interface FormNavProps {
  /**
   * Show "Get Started" button (yellow CTA)
   * - true: Show button (for loan selector page)
   * - false: Hide button (for form steps - user is already in form)
   */
  showGetStarted?: boolean
  /**
   * Override "Get Started" button behavior
   * - Default: Scrolls to #loan-selector or stays on page
   * - Custom: Provide onClick handler
   */
  onGetStartedClick?: () => void
  /**
   * Current form step (1-4) for context
   * - Used for analytics/tracking
   * - Optional: Only provide if on actual form step
   */
  currentStep?: number
}

export function FormNav({
  showGetStarted = false,
  onGetStartedClick,
  currentStep
}: FormNavProps) {
  const router = useRouter()

  const handleGetStartedClick = () => {
    if (onGetStartedClick) {
      onGetStartedClick()
    } else {
      // Default: Scroll to loan selector if on /apply page
      const loanSelector = document.getElementById('loan-selector')
      if (loanSelector) {
        loanSelector.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <nav className="fixed top-0 w-full h-14 sm:h-16 bg-white border-b border-[#E5E5E5] z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">

        {/* Left: Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={Logo}
            alt="NextNest Logo"
            className="h-5 sm:h-10 w-auto max-w-[200px]"
            priority
          />
        </Link>

        {/* Right: Back to Home + Optional Get Started */}
        <div className="flex items-center gap-4">
          {/* Back to Home - Always visible */}
          <Link
            href="/"
            className="text-sm text-[#666666] hover:text-[#000000] transition-colors"
          >
            Back to Home
          </Link>

          {/* Get Started CTA - Conditional */}
          {showGetStarted && (
            <button
              onClick={handleGetStartedClick}
              className="px-6 py-2 bg-[#FCD34D] text-[#000000] text-sm font-semibold hover:bg-[#FBB614] transition-colors"
            >
              Get Started →
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
```

**Design notes:**

**Typography:**
- Logo: Standard size (`h-5 sm:h-10`)
- "Back to Home": `text-sm` (14px)
- "Get Started": `text-sm font-semibold` (14px, weight 600)

**Colors:**
- Background: `bg-white` (white nav bar)
- Border: `border-[#E5E5E5]` (light grey bottom border)
- "Back to Home": `text-[#666666]` (grey), hover `text-[#000000]` (black)
- "Get Started": `bg-[#FCD34D]` (yellow), hover `bg-[#FBB614]` (darker yellow)

**Layout:**
- Fixed top: `fixed top-0` (stays at top when scrolling)
- Height: `h-14 sm:h-16` (56px mobile, 64px desktop)
- Flexbox: `justify-between` (logo left, links right)
- Gap: `gap-4` (16px between "Back to Home" and "Get Started")
- Z-index: `z-50` (above page content)

**Behavior:**
- "Back to Home": Direct link to `/` (not browser back)
- "Get Started": Optional, shows on loan selector, hides in form steps
- Default "Get Started" behavior: Scrolls to #loan-selector if exists

**Why this pattern:**
- ✅ Consistent across all form pages
- ✅ "Back to Home" always escapes form flow (user never trapped)
- ✅ "Get Started" provides CTA on loan selector, disappears in form (user already started)
- ✅ Minimal, professional (Swiss spa finesse)

---

## Task 2: Update ConditionalNav to Use FormNav

**Location:** `components/layout/ConditionalNav.tsx` lines 27-41

**Current code (minimal /apply nav):**
```typescript
// Minimal header (logo only) for form flow - maximize focus & conversion
if (pathname?.startsWith('/apply')) {
  return (
    <nav className="fixed top-0 w-full h-14 sm:h-16 bg-white border-b border-fog z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center">
        <a href="/" className="flex items-center">
          <Image
            src={Logo}
            alt="NextNest Logo"
            className="h-5 sm:h-10 w-auto max-w-[200px]"
            priority
          />
        </a>
      </div>
    </nav>
  )
}
```

**After (use FormNav component):**
```typescript
import { FormNav } from '@/components/layout/FormNav'

// ... inside ConditionalNav function:

// Form flow navigation - standardized across loan selector and form steps
if (pathname?.startsWith('/apply')) {
  return <FormNav showGetStarted={true} />
}
```

**Changes explained:**
- Replace entire `<nav>` block with `<FormNav>` component
- Set `showGetStarted={true}` because /apply is loan selector page (user hasn't started form yet)
- "Back to Home" link now visible (was missing in original)
- "Get Started" button now visible (provides CTA)

**Testing:**
1. Navigate to `/apply` page
2. Verify logo appears (left side)
3. Verify "Back to Home" link appears (right side)
4. Verify "Get Started" button appears (right side, yellow)
5. Click "Back to Home" → Should navigate to `/` (homepage)
6. Click "Get Started" → Should scroll to loan selector cards on page

---

## Task 3: Use FormNav in /apply Page

**Location:** `app/apply/page.tsx`

**Current structure:**
```typescript
export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyPageContent />
    </Suspense>
  )
}

function ApplyPageContent() {
  // ... component logic
  return (
    <>
      {/* Main content - form only (header comes from ConditionalNav in layout) */}
      <main className="min-h-screen bg-mist">
        {/* ... loan selector content */}
      </main>
    </>
  )
}
```

**No changes needed in this file** - navigation is handled by `ConditionalNav.tsx` in layout.

**However, if you want explicit control:**

**Option A: Keep current (recommended)**
- Navigation comes from `app/layout.tsx` → `ConditionalNav`
- No changes to `app/apply/page.tsx`

**Option B: Explicit import (if layout doesn't handle it)**
```typescript
import { FormNav } from '@/components/layout/FormNav'

function ApplyPageContent() {
  return (
    <>
      <FormNav showGetStarted={true} />
      <main className="min-h-screen bg-mist pt-16"> {/* Add pt-16 for fixed nav space */}
        {/* ... loan selector content */}
      </main>
    </>
  )
}
```

**I recommend Option A** - use ConditionalNav from layout (DRY principle, one source of truth).

---

## Task 4: Use FormNav in Progressive Form Steps

**Location:** `components/forms/ProgressiveFormWithController.tsx`

**Current structure:**
Form component renders steps but navigation comes from layout's ConditionalNav.

**Decision point:** Does form render its own layout or rely on app layout?

**Check current behavior:**
1. Open form (navigate to /apply → select loan type → Step 1)
2. Does navigation appear at top?
3. If YES → ConditionalNav is working, no changes needed
4. If NO → Form needs to render FormNav explicitly

**If form needs explicit nav rendering:**

**Find form container** (search for `ResponsiveFormLayout` or main form wrapper):

**Before:**
```typescript
return (
  <div className="form-container">
    {/* Step content */}
    <Step1Content />
  </div>
)
```

**After:**
```typescript
import { FormNav } from '@/components/layout/FormNav'

return (
  <>
    <FormNav showGetStarted={false} currentStep={currentStep} />
    <div className="form-container pt-16"> {/* Add padding-top for fixed nav */}
      {/* Step content */}
      <Step1Content />
    </div>
  </>
)
```

**Parameters:**
- `showGetStarted={false}` - User already in form, don't show CTA
- `currentStep={currentStep}` - Pass current step (1-4) for analytics

**Padding:**
- Add `pt-16` (64px) to main container to account for fixed nav height
- Without this, nav will overlap form content

**Testing:**
1. Complete loan selector → Start form Step 1
2. Verify FormNav appears at top
3. Verify "Back to Home" link visible
4. Verify "Get Started" button NOT visible (user already in form)
5. Click "Back to Home" → Should navigate to `/` (homepage, not loan selector)
6. Progress to Step 2, 3, 4 → Verify nav stays consistent

---

## Task 5: Fix Chat Page History Navigation

**Location:** `app/chat/page.tsx`

**Problem:** User clicks browser back from `/chat` → goes to `/apply` or form steps (incorrect)

**Solution:** Use `router.replace()` when navigating to chat + add navigation guard

**Step 5.1: Update ChatTransitionScreen redirect**

**Find:** `components/forms/ChatTransitionScreen.tsx` (or wherever chat redirect happens)

**Search for:** `router.push('/chat')` or similar navigation to chat

**Before:**
```typescript
const handleContinueToChat = () => {
  router.push('/chat') // Normal navigation - adds to history
}
```

**After:**
```typescript
const handleContinueToChat = () => {
  router.replace('/chat') // Replace current history entry - back button skips this
}
```

**Why `router.replace()` instead of `router.push()`:**
- `push()`: Adds new entry to browser history → back button goes to previous page
- `replace()`: Replaces current entry → back button goes to page BEFORE previous page
- **Effect:** Skips form pages in back button navigation

**Example history stack:**
```
BEFORE (with push):
1. Homepage (/)
2. Apply (/apply)
3. Form Step 1
4. Form Step 2
5. Form Step 3
6. Chat (/chat) ← Current page
[Back button] → Goes to Form Step 3 ❌

AFTER (with replace):
1. Homepage (/)
2. Apply (/apply)
3. Form Step 1
4. Form Step 2
5. Chat (/chat) ← Replaced Form Step 3 entry
[Back button] → Goes to Form Step 2 still... 🤔

Actually need to replace MULTIPLE times or clear history
```

**Better solution:** Replace entire history when transitioning to chat:

```typescript
const handleContinueToChat = () => {
  // Replace current entry
  router.replace('/chat')

  // Clear forward history
  if (typeof window !== 'undefined' && window.history) {
    // Replace entire history stack with just chat page
    window.history.pushState(null, '', '/chat')
  }
}
```

**Even better (recommended):** Add navigation guard on chat page itself.

---

**Step 5.2: Add Navigation Guard to Chat Page**

**Location:** `app/chat/page.tsx` (main chat page component)

**Add at top of component:**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()

  // Navigation guard: Prevent back button from going to form
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // User clicked back button
      // Instead of going to form, redirect to homepage
      event.preventDefault()
      router.replace('/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  // ... rest of chat component
}
```

**How this works:**
1. User is on `/chat` page
2. Clicks browser back button
3. `popstate` event fires
4. Our handler intercepts it
5. Redirects to `/` (homepage) instead of previous form page

**Alternative (simpler):** Show modal confirmation before allowing back:

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Show browser confirmation dialog
    e.preventDefault()
    e.returnValue = 'Are you sure you want to leave? Your conversation will be saved.'
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}, [])
```

**Recommended approach:** Combine both:
1. Use `router.replace('/chat')` when transitioning from form
2. Add `popstate` guard on chat page
3. Add "Back to Home" link in chat UI (explicit exit)

---

**Step 5.3: Add "Back to Home" Link in Chat UI**

**Location:** `app/chat/page.tsx` (chat page layout)

**Add explicit navigation option:**

```typescript
export default function ChatPage() {
  return (
    <div className="chat-container">
      {/* Top nav with explicit exit */}
      <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
        <h1 className="text-lg font-semibold">AI Broker Chat</h1>
        <Link
          href="/"
          className="text-sm text-[#666666] hover:text-[#000000]"
        >
          Back to Home
        </Link>
      </div>

      {/* Chat messages */}
      <div className="messages">
        {/* ... chat content */}
      </div>
    </div>
  )
}
```

**Why explicit link:**
- Users can exit chat without browser back button
- Clear, professional exit path
- Consistent with FormNav pattern

---

## Task 6: Update Navigation Links Throughout Site

**Files to check:**
- `components/layout/ConditionalNav.tsx` (homepage nav)
- `app/page.tsx` (homepage CTAs)
- Any other pages that link to form

**Search for these patterns:**
```typescript
// OLD (may go to /apply):
<Link href="/apply?loanType=new_purchase">Get Started</Link>

// DECISION: Keep /apply or skip to /form?
```

**Option A: Keep /apply as loan selector page**
- Links stay: `href="/apply"` or `href="/apply?loanType=X"`
- User sees 3 cards, selects loan type, goes to form
- **Current recommended flow**

**Option B: Remove /apply, go directly to form**
- Links change: `href="/form?loanType=X"`
- Skip loan selector entirely
- Simpler but less user choice

**Per your loan selector plan (Task 3):** You're keeping loan selector but fixing it, so **Option A is correct**.

**No changes needed to existing links** - they correctly point to `/apply`.

---

## Design System Compliance

**FormNav component:**

**Typography:**
- Links: `text-sm` (14px, weight 400)
- Button: `text-sm font-semibold` (14px, weight 600)
- Logo: Standard size (`h-5 sm:h-10`)

**Colors:**
- Nav background: `bg-white` (white)
- Border: `border-[#E5E5E5]` (light grey)
- "Back to Home": `text-[#666666]` → `hover:text-[#000000]` (grey to black)
- "Get Started": `bg-[#FCD34D]` → `hover:bg-[#FBB614]` (yellow to darker yellow)
- **NO additional yellow elements** (only 1 button, Rule of Two compliant)

**Layout:**
- Height: `h-14 sm:h-16` (56px mobile, 64px desktop)
- Max width: `max-w-7xl mx-auto` (centered, constrained)
- Padding: `px-4 md:px-8` (16px mobile, 32px desktop)
- Z-index: `z-50` (above content, below modals if any)

**Spacing:**
- Logo to links: `justify-between` (flexbox, max space)
- Link to button: `gap-4` (16px)
- Button padding: `px-6 py-2` (24px horizontal, 8px vertical)

**Effects:**
- Link hover: `transition-colors` (smooth color change)
- Button hover: `transition-colors` (smooth background change)
- Duration: 200ms (default, meets design system limit)

**Corners:**
- Button: **NO rounded corners** (Swiss spa sharp rectangles)
- If you see `rounded-*` classes, **DELETE them**

**Accessibility:**
- Link contrast: Grey (#666666) on white = 5.7:1 (AA compliant)
- Black on white: 21:1 (AAA compliant)
- Button contrast: Black text on yellow = 12:1 (AAA compliant)
- Touch targets: Button 48px height (exceeds 44px minimum)

---

## Testing Procedures

### Manual Testing

**Test 1: Loan Selector Page (/apply)**
1. Navigate to `http://localhost:3000/apply`
2. **Verify FormNav appears:**
   - Logo visible (left)
   - "Back to Home" link visible (right, grey text)
   - "Get Started" button visible (right, yellow)
3. **Click "Back to Home":**
   - Should navigate to `/` (homepage)
   - Should NOT use browser back (test by going Homepage → Apply → Apply again → Click "Back to Home" should always go to /)
4. **Click "Get Started":**
   - Should scroll to loan selector cards on page
   - OR stay on page if no scroll behavior (acceptable)
5. **Mobile (375px):**
   - Nav height adjusts to 56px
   - Logo scales to smaller size
   - Links remain readable and tappable

**Test 2: Form Steps (1-4)**
1. Navigate to /apply → Select "New Purchase" → Step 1
2. **Verify FormNav appears:**
   - Logo visible
   - "Back to Home" link visible
   - "Get Started" button NOT visible (user already in form)
3. **Progress through steps:**
   - Step 1 → Step 2 → Step 3 → Step 4
   - FormNav stays consistent (doesn't change or disappear)
4. **Click "Back to Home" from any step:**
   - Should navigate to `/` (homepage)
   - User exits form flow cleanly

**Test 3: Chat Page Navigation**
1. Complete form Steps 1-4 → Transition to `/chat`
2. **Verify chat page loads**
3. **Click browser back button:**
   - Should navigate to `/` (homepage)
   - Should NOT go back to form Step 3 or Step 4
4. **If "Back to Home" link in chat UI:**
   - Click it → Should navigate to `/`

**Test 4: Navigation Loop Prevention**
1. Homepage → /apply → Form Steps → /chat
2. From /chat, manually type `/apply` in URL
3. Load /apply page
4. Click browser back
5. **Verify:** Should go to `/` (homepage), NOT `/chat`

### Responsive Testing

**Viewports:**
- Desktop: 1440px (FormNav full size)
- Tablet: 768px (Links may compress)
- Mobile: 375px (Logo scales, links remain tappable)

**Check at each viewport:**
- Nav height: 56px mobile, 64px desktop
- Logo scales proportionally
- "Back to Home" link readable (min 14px text)
- "Get Started" button readable and tappable (min 44px height)
- No horizontal scroll
- No text truncation

### Build Verification

```bash
npm run build
```

**Expected:** No TypeScript errors, no warnings

**Common issues:**
- Missing FormNav import
- Router import issues (`useRouter` from 'next/navigation' not 'next/router')
- Image import path incorrect

### Link Testing

**Check all navigation paths:**
```bash
# Test all navigation links work:
# 1. Homepage → /apply (works)
# 2. /apply "Back to Home" → / (works)
# 3. /apply → Form → "Back to Home" → / (works)
# 4. Form → /chat → Back button → / (works, not form)
# 5. /chat "Back to Home" → / (if link exists, works)
```

### Edge Case Testing

**Test Edge Case 1: Direct URL Access**
- Type `http://localhost:3000/apply` directly in URL bar
- FormNav should appear correctly
- "Back to Home" should still work (goes to /, not broken back button)

**Test Edge Case 2: Refresh on Form Step**
- Navigate to Form Step 2
- Refresh page (F5 or Ctrl+R)
- FormNav should reappear
- "Back to Home" should work

**Test Edge Case 3: Multiple Browser Tabs**
- Tab 1: /apply page
- Tab 2: /chat page
- Switch between tabs
- Navigation should remain consistent

---

## Common Mistakes to Avoid

### ❌ Don't Do This

**Mistake 1: Using browser back instead of direct link**
```typescript
// NO - uses browser history
<button onClick={() => router.back()}>Back to Home</button>
```

**Mistake 2: Forgetting padding for fixed nav**
```typescript
// NO - fixed nav overlaps content
<nav className="fixed top-0">...</nav>
<main className=""> {/* Missing pt-16 */}
```

**Mistake 3: Using router.push() to chat**
```typescript
// NO - adds chat to history, back button goes to form
router.push('/chat')
```

**Mistake 4: Adding rounded corners to button**
```typescript
// NO - violates Swiss spa sharp rectangles
<button className="rounded-lg">Get Started</button>
```

**Mistake 5: Showing "Get Started" in form steps**
```typescript
// NO - user already started form
<FormNav showGetStarted={true} currentStep={2} />
```

### ✅ Do This Instead

**Correct 1: Direct link to homepage**
```typescript
<Link href="/">Back to Home</Link>
```

**Correct 2: Add padding for fixed nav**
```typescript
<nav className="fixed top-0">...</nav>
<main className="pt-16"> {/* 64px padding = nav height */}
```

**Correct 3: Use router.replace() to chat**
```typescript
router.replace('/chat') // Replaces history, back skips form
```

**Correct 4: Sharp rectangle buttons**
```typescript
<button className=""> // No rounded classes
```

**Correct 5: Hide "Get Started" in form**
```typescript
<FormNav showGetStarted={false} currentStep={2} />
```

---

## Commit Messages

Follow conventional commits format:

**Create FormNav component:**
```bash
feat(nav): create standardized FormNav component for form flow
```

**Update ConditionalNav:**
```bash
refactor(nav): use FormNav component for /apply route
```

**Add navigation guard:**
```bash
fix(chat): add navigation guard to prevent back button to form
```

**Update chat redirect:**
```bash
fix(forms): use router.replace() when transitioning to chat
```

---

## Related Documentation

- **Plan:** `docs/plans/active/2025-11-07-form-navigation-standardization.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Forms Architecture:** `docs/runbooks/FORMS_ARCHITECTURE_GUIDE.md`
- **Voice Guide:** `docs/content/voice-and-tone.md` (for CTA copy)

---

## Questions or Issues

If you encounter ambiguity:
1. Check existing ConditionalNav implementation
2. Test navigation flow manually (Homepage → Apply → Form → Chat)
3. When in doubt: Direct links over browser back, explicit navigation over implicit
