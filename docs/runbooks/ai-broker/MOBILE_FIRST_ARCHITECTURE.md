# Mobile-First AI Broker Architecture

**ABOUTME:** Implementation guide for building mobile-optimized AI Broker UI with chat-first layout, progressive disclosure, and touch-friendly interactions. Links to canonical code in components/ai-broker/.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design System Tokens](#design-system-tokens)
3. [Component Implementation Patterns](#component-implementation-patterns)
4. [Layout & Interaction Principles](#layout--interaction-principles)
5. [Screen-by-Screen Implementation](#screen-by-screen-implementation)
6. [Responsive Strategy](#responsive-strategy)
7. [Performance Optimization](#performance-optimization)
8. [Testing Strategies](#testing-strategies)
9. [Risk Mitigation](#risk-mitigation)
10. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

### Component Structure

```typescript
components/ai-broker/
├── MobileAIBrokerUI.tsx      // Main orchestrator
├── MobileInsightCard.tsx     // Single insight per card
├── MobileScoreWidget.tsx     // Compact score display
├── MobileActionCard.tsx      // CTA-focused cards
├── MobileSectionTabs.tsx     // Tab navigation for sections
├── types.ts                  // Shared interfaces
└── index.ts                  // Exports
```

### Information Architecture

```typescript
// Current: All sections visible simultaneously (information overload)
// New: Progressive disclosure with tab navigation

type MobileSections =
  | 'overview'     // Lead score + primary insight
  | 'analysis'     // Situational analysis
  | 'rates'        // Rate intelligence
  | 'actions'      // Next steps/CTA

// Mobile-first content prioritization:
// 1. Overview (always visible) - 80px height
// 2. Analysis (collapsible cards) - 60px collapsed, 120px expanded
// 3. Rates (tab navigation) - On-demand
// 4. Actions (sticky bottom) - 56px height
```

### Progressive Disclosure Pattern

- **Level 1:** Lead score + primary recommendation (always visible)
- **Level 2:** Key insights (expandable cards)
- **Level 3:** Detailed analysis (tab navigation)
- **Level 4:** Supporting data (modal/drawer on demand)

### Mobile Viewport Math

```
Target: iPhone SE (375px × 667px) - smallest common viewport
Available height: 667px
- Browser chrome: ~60px
- Navigation: ~44px
- Available content: ~563px

Content allocation:
- Score widget: 80px
- Primary insight: 80px
- Secondary insights: 2×60px = 120px
- Action buttons: 56px
- Buffer/spacing: 80px
Total: 416px (leaves 147px buffer)
```

---

## Design System Tokens

### Mobile Spacing

```typescript
// lib/design-tokens/mobile.ts
export const MOBILE_SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem'     // 20px
} // Max spacing = 20px vs current 24px (p-6)
```

### Mobile Typography

```typescript
export const MOBILE_TYPOGRAPHY = {
  micro: 'text-[10px]',   // For labels/metadata
  tiny: 'text-[11px]',    // For supporting text
  small: 'text-xs',       // For body text
  body: 'text-sm',        // For primary content
  lead: 'text-base'       // For headings
} // Smaller than current sizing
```

### Touch Targets

```typescript
export const MOBILE_TOUCH_TARGETS = {
  minimum: '44px',        // iOS/Android standard
  comfortable: '48px',    // Preferred size
  large: '56px'          // For primary actions
}
```

### Complete Design Token Export

```typescript
// lib/design-tokens/mobile.ts
export const MOBILE_DESIGN_TOKENS = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem'     // 20px
  },
  typography: {
    micro: 'text-[10px]',
    tiny: 'text-[11px]',
    small: 'text-xs',
    body: 'text-sm',
    lead: 'text-base'
  },
  touchTargets: {
    minimum: '44px',
    comfortable: '48px',
    large: '56px'
  }
} as const
```

---

## Component Implementation Patterns

See the full runbook file for detailed component implementations...
