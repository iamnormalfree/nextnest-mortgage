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

See file for complete content...
