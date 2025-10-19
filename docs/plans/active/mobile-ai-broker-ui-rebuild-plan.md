---
status: active
priority: high
complexity: heavy
estimated_hours: 40
---

# Mobile-First AI Broker UI Rebuild

## Context

Current AI Broker UI (SimpleAgentUI) suffers from desktop-centric design causing poor mobile UX:
- Heavy padding (24px) and large spacing unsuitable for mobile viewports
- No progressive disclosure - information overload on small screens
- Missing mobile breakpoint strategy and touch-friendly interactions
- Desktop grid systems (md:grid-cols-2) assume desktop space

**Rebuild Strategy:** Progressive Enhancement with feature flag
- Build mobile components alongside existing desktop UI
- Feature flag to toggle between implementations  
- Gradual rollout with fallback safety (maintain SimpleAgentUI)

## Problem

Mobile users cannot effectively use AI Broker features due to desktop-first UI design. Must rebuild with mobile-first architecture while maintaining desktop experience and business metrics.

## Success Criteria

- [ ] 100% content visible without horizontal scroll on 320px+ viewports
- [ ] All touch targets ≥44px (iOS/Android standard)
- [ ] Load time <2s on throttled 3G connection
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1, FID <100ms
- [ ] Business metrics maintained or improved (broker consultation requests, engagement)

## Tasks

See [Mobile-First Architecture Runbook](../../runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md) for complete implementation patterns, design tokens, component examples, and testing strategies.

### Setup Gate (Half Day)

- [ ] Implement `useMobileAIBroker` feature flag and mobile design tokens (MOBILE_DESIGN_TOKENS)
  - See runbook: Design System Tokens section
  - Create lib/design-tokens/mobile.ts
  - Add NEXT_PUBLIC_MOBILE_AI_BROKER environment variable
- [ ] Create chat-first layout skeleton behind progressive enhancement guardrail
  - Verify guardrail leaves desktop experience untouched
- [ ] Add Storybook/DevTools viewport presets for iPhone SE (375×667) and Pixel widths (360×760)

### Iteration 1 - Chat Spine (Day 1)

- [ ] Build mobile shell: top bar, chat transcript list, sticky composer
  - See runbook: Screen-by-Screen Implementation > Live Chat Shell
  - Composer surfaces loading/error states inline above input
- [ ] Hook composer to existing chat service with streaming skeleton states
  - Confirm thumb reach for primary actions (56px touch targets)
- [ ] Capture QA notes and screenshots in validation-reports/ for traceability

### Iteration 2 - Insight Layer (Day 2)

- [ ] Implement MobileScoreWidget plus Tier-1 insight strip
  - See runbook: Component Implementation Patterns > MobileScoreWidget
  - Wire collapse state, telemetry events, align with MOBILE_DESIGN_TOKENS
- [ ] Validate screen-reader output for score announcements and priority badges

### Iteration 3 - Analysis Stack (Day 3)

- [ ] Compose accordion of MobileInsightCard instances for each domain track
  - See runbook: Component Implementation Patterns > MobileInsightCard
  - Persist expansion state across navigation and refreshes
- [ ] Ensure CTA chips inject prompts into composer and respect touch target sizing (≥44px)
- [ ] Add Storybook stories or unit tests covering collapsed/expanded variations

### Iteration 4 - Rates & Offers (Day 4)

- [ ] Build tab chip navigation and swipeable rate card carousel
  - See runbook: Component Implementation Patterns > MobileSectionTabs
  - Lazy-load data with skeleton placeholders
  - Guard data fetching so chat shell stays responsive on slow networks
- [ ] Provide "Send to chat" and "Compare" hooks with offer metadata and analytics
- [ ] Test horizontal gestures on physical iOS/Android devices (avoid system gesture conflicts)

### Iteration 5 - Actions & Drawers (Day 5)

- [ ] Implement sticky action sheet with primary/secondary/tertiary CTAs
  - See runbook: Screen-by-Screen Implementation > Actions & Support
  - Confirm CTA order and copy with product before freezing
- [ ] Add supplemental drawers for documents, calculators, disclosures
  - Restore focus to chat transcript after each drawer closes
- [ ] Confirm drawers respect touch targets, accessible headings, keyboard escape routes

### Validation & Sign-Off

- [ ] Run npm run lint:all, mobile device smoke tests (iPhone SE, Pixel 7, iPad Mini)
  - See runbook: Testing Strategies > Device Testing
- [ ] Execute screen-reader passes (VoiceOver, TalkBack)
- [ ] Low-bandwidth testing via DevTools throttling, verify analytics events, feature flag fallback
- [ ] Record manual validation in validation-reports/, update plan with learnings
- [ ] Notify stakeholders before expanding flag cohort

## Testing Strategy

See [Mobile-First Architecture Runbook](../../runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md#testing-strategies) for:
- Feature flag setup (FEATURE_FLAGS.MOBILE_AI_BROKER_UI)
- Progressive testing phases (dev → internal → staging → 5% production → full)
- Device testing checklist (iPhone SE, iPhone 12, Samsung Galaxy S10)
- Cross-browser testing (Safari Mobile, Chrome Mobile, Samsung Internet, Firefox Mobile)
- A/B testing framework (control vs treatment variants)
- Success metrics (technical, UX, business)

**Critical Test Files:**
- app/test-mobile/page.tsx - 360px playground
- app/test-ui/TestUIClient.tsx - 375px frame for side-by-side
- validation-reports/2025-09-mobile-ui/ - Screenshot series

## Rollback Plan

See [Mobile-First Architecture Runbook](../../runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md#risk-mitigation) for:
- Feature flag rollout config (start 0% production, allowlist test users)
- Automatic fallback to SimpleAgentUI via ErrorBoundary
- Data compatibility (MobileAIBrokerUIProps extends SimpleAgentUIProps)
- No backend changes required (backward compatibility guaranteed)

**Rollback Steps:**
1. Set NEXT_PUBLIC_MOBILE_AI_BROKER=false in environment
2. Redeploy application (mobile UI disabled, desktop UI active)
3. Monitor metrics for 24h to confirm restoration
4. Investigate root cause before re-enabling

## Related Documentation

- [Mobile-First Architecture Runbook](../../runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md) - Complete implementation guide
- [AI Broker Complete Guide](../../runbooks/AI_BROKER_COMPLETE_GUIDE.md) - Full system architecture
- [Design System](../../DESIGN_SYSTEM.md) - Bloomberg color tokens
- [Forms Architecture](../../runbooks/FORMS_ARCHITECTURE_GUIDE.md) - Form patterns
- [Component Placement Decision Tree](../../CLAUDE.md#component-placement-decision-tree)
- [CANONICAL_REFERENCES.md](../../CANONICAL_REFERENCES.md) - Tier 1 files

## Notes

**Field Testing Summary (September 2025):**
- Visual QA: iPhone 12 (390×844), Pixel 7 (412×915) passed
- DevTools: 320×568, 360×720 no horizontal scroll, ≥44px touch targets
- Cross-browser: Safari Mobile 17, Chrome 128, Firefox 128 passed
- Assumptions: Fast 3G tested; slower networks + full analytics pending
- Accessibility: VoiceOver/TalkBack sanity passed; full narration pending

**Progressive Enhancement Strategy:**
Option 1 (Recommended) maintains existing SimpleAgentUI while building MobileAIBrokerUI alongside. Feature flag enables gradual migration with fallback safety. Option 2 (Complete Rebuild) considered only if Option 1 proves insufficient.

---

**Last Updated:** 2025-10-19  
**Canonical Code:** components/ai-broker/, lib/design-tokens/mobile.ts  
**Runbook:** docs/runbooks/ai-broker/MOBILE_FIRST_ARCHITECTURE.md
