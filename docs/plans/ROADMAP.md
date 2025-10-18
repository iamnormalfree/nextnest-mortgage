# NextNest Product Roadmap

**Last Updated:** 2025-10-17
**Status:** Phase 1 in progress
**Vision:** Transform mortgage decisions from overwhelming to empowering through transparent AI guidance

---

## Roadmap Philosophy

**Core Principle:** Build foundation first, then scale with content, then add advanced features.

**Phases:**
- **Phase 1 (Weeks 1-6):** Core experience - form, calculations, broker handoff
- **Phase 1.5 (Weeks 7-8):** Content foundation - regulatory compliance, insights library
- **Phase 2 (Weeks 9-12):** Content generation + scale - blog, SEO, lead gen
- **Phase 3 (Weeks 13+):** Advanced features - personalization, predictions, automation

**Rule:** Never archive this file. Plans come and go, but the roadmap persists.

---

## Phase 1: Core Experience (Weeks 1-6) ✅ IN PROGRESS

**Goal:** Ship a working mortgage application flow that captures leads and hands off to human brokers.

**Status:** 80% complete

### Week 1-2: Foundation ✅ COMPLETE
- [x] Next.js 14 app structure with TypeScript
- [x] Shadcn/ui component library
- [x] Tailwind design system (NextNest + Bloomberg tokens merged)
- [x] Supabase database setup
- [x] Dr Elena v2 calculation engine (`instant-profile.ts`)
- [x] MAS regulatory constants (`dr-elena-constants.ts`)

### Week 3-4: Progressive Form ✅ MOSTLY COMPLETE
- [x] 3-step progressive form (`ProgressiveFormWithController.tsx`)
  - Step 0: Loan type selector
  - Step 1: Who you are (name, email)
  - Step 2: What you need (property details, timeline)
  - Step 3: Your finances (income, commitments)
- [x] Instant calculations on Step 3 (TDSR, MSR, LTV, down payment)
- [x] Form state management (`useProgressiveFormController.ts`)
- [x] Form-to-chat handoff (`ChatTransitionScreen.tsx`)
- [ ] **PENDING:** IPA Status field integration (see note below)

### Week 5-6: Broker Integration 🔄 IN PROGRESS
- [x] Chatwoot integration
- [x] AI broker backend (`dr-elena-integration-service.ts`)
- [x] Mobile AI assistant UI (`MobileAIAssistantCompact.tsx`)
- [x] Chat message flow and webhooks
- [ ] **PENDING:** Broker assignment logic refinement
- [ ] **PENDING:** Conversation state synchronization fixes

### Critical Path Items
1. **Form calculation corrections** - Active plan: `2025-10-31-progressive-form-calculation-correction-plan.md`
2. **Mobile form experience** - Active plan: `2025-10-30-progressive-form-experience-implementation-plan.md`
3. **Lead form → chat handoff** - Active plan: `2025-11-01-lead-form-chat-handoff-optimization-plan.md`

### IPA Status Field - PENDING INTEGRATION
**Source:** Legacy forms had IPA (In-Principle Approval) status tracking
**Location:** Preserved in archived form headers for reference
**Decision:** Need to check existing form plans/runbooks to determine integration strategy
**Action:** See `components/forms/archive/2025-10/` abandonment headers for implementation details

---

## Phase 1.5: Content Foundation (Weeks 7-8)

**Goal:** Build the content infrastructure that makes NextNest trustworthy and SEO-ready.

**Status:** Not started

### Week 7: Regulatory Compliance Content
- [ ] MAS Notice 632 explainer (TDSR regulations)
- [ ] MAS Notice 645 explainer (MSR regulations)
- [ ] LTV limits guide (by property count and citizenship)
- [ ] CPF usage rules documentation
- [ ] ABSD/BSD calculator and guide
- [ ] Stamp duty calculator

### Week 8: Mortgage Insights Library
- [ ] Mortgage 101 guide (first-time buyers)
- [ ] Refinancing decision framework
- [ ] Commercial property financing guide
- [ ] Bank package comparison framework
- [ ] Rate outlook dashboard (data pipeline from market sources)

**Deliverables:**
- 10-15 core content pieces
- SEO-optimized landing pages
- Internal linking structure
- Content update process documented

---

## Phase 2: Content Generation + Scale (Weeks 9-12)

**Goal:** Scale content production and lead generation channels.

**Status:** Not started

### Week 9-10: Blog + SEO Engine
- [ ] Blog infrastructure (`/blog` route)
- [ ] CMS integration (Sanity or Contentful)
- [ ] SEO metadata generation
- [ ] Sitemap and robots.txt
- [ ] Google Search Console setup
- [ ] Initial 20 blog posts:
  - Mortgage guides
  - Market analysis
  - Rate predictions
  - Case studies

### Week 11-12: Lead Generation Channels
- [ ] Organic search optimization (target keywords documented)
- [ ] Partnerships with property portals
- [ ] Referral program infrastructure
- [ ] Email nurture sequences
- [ ] WhatsApp bot integration (Singapore preference)

**Metrics to Track:**
- Organic traffic growth
- Form completion rate
- Lead quality score distribution
- Broker handoff success rate
- Time to first broker response

---

## Phase 3: Advanced Features (Weeks 13+)

**Goal:** Add intelligence and automation to reduce manual broker work.

**Status:** Not started

### Personalization Engine
- [ ] User profile system (preferences, search history)
- [ ] Personalized rate recommendations
- [ ] Dynamic content based on user segment
- [ ] Email personalization based on form data

### Predictive Analytics
- [ ] Rate prediction model (time series forecasting)
- [ ] Urgency scoring improvements
- [ ] Lead quality prediction
- [ ] Optimal timing recommendations

### Automation
- [ ] Auto-assignment of brokers based on expertise
- [ ] Automated follow-up sequences
- [ ] Document collection automation
- [ ] Application status tracking

### Advanced Calculators
- [ ] Retirement mortgage calculator
- [ ] Equity loan optimizer
- [ ] Debt consolidation analyzer
- [ ] Multi-property portfolio analyzer

---

## Current Active Plans (Phase 1)

**Critical Path:**
1. `2025-10-31-progressive-form-calculation-correction-plan.md` - Fix Dr Elena v2 calculation alignment
2. `2025-10-30-progressive-form-experience-implementation-plan.md` - Mobile UX improvements
3. `2025-11-01-lead-form-chat-handoff-optimization-plan.md` - Smooth form-to-chat transition

**Supporting Work:**
- `mobile-ai-broker-ui-rebuild-plan.md` - Mobile broker UI variants evaluation
- `mobile-loan-form-optimization.md` - Form responsiveness

**Investigation:**
- IPA Status field integration strategy (check form runbooks)

---

## Deferred / Out of Scope

### Campaign Pages - ARCHIVED 2025-10-17
- **Reason:** Simple standalone calculator (`SingaporeMortgageCalculator.tsx`) and campaign pages (Reddit, LinkedIn, HWZ) archived
- **Decision:** Focus on core progressive form at `/apply` instead of separate campaign landing pages
- **Location:** `app/archive/2025-10/campaigns/`, `app/archive/2025-10/calculators/`

### Validation Dashboard - ARCHIVED 2025-10-17
- **Reason:** Internal debugging tool, no user integration
- **Location:** `app/archive/2025-10/validation-dashboard/`

### PDF Report Generation - ARCHIVED 2025-10-17
- **Reason:** Unfinished feature, zero frontend integration
- **Decision:** Use AI broker chat + email for personalized reports instead
- **Location:** `app/archive/2025-10/api/generate-report/`

---

## Success Metrics by Phase

### Phase 1 Success Criteria
- ✅ Form completion rate >60%
- ✅ Calculation accuracy: 100% MAS compliance (Dr Elena v2 verified)
- ⏳ Broker handoff success: >90%
- ⏳ Time to first broker response: <24 hours
- ⏳ Mobile usability score: >80/100

### Phase 1 Production Readiness Checklist

**Pre-Launch Requirements** (extracted from archived production readiness plans):

**Session & Storage:**
- [ ] SessionId persisted to sessionStorage before LoanApplicationProvider mounts
- [ ] Resume session guard: hydrate context from cached data on refresh
- [ ] Explicit "Reset application" action clears all storage keys
- [ ] Data retention policy: wipe cached loan data after N days (PDPA compliance)
- [ ] Browser fingerprinting for cross-session journey tracking (no cookies)

**Error Handling & Resilience:**
- [ ] ChatTransitionScreen surfaces API errors with retry CTA
- [ ] `/api/forms/analyze` failures show friendly message while retaining form data
- [ ] Feature flags (e.g., `ENABLE_CHAT_TRANSITION`) for quick incident response
- [ ] Network failure scenarios tested (503 responses, localStorage disabled)
- [ ] No double-creation of Chatwoot conversations (guard against multiple clicks)

**Broker Integration:**
- [ ] Assigned broker name matches greeting message and chat header
- [ ] System messages appear in correct order: queue → reviewing → joined → greeting
- [ ] `conversation.custom_attributes.ai_broker_name` matches greeting author
- [ ] No duplicate queue messages in chat UI
- [ ] Legacy enhanced webhook disabled or respects Supabase assignments

**Performance Benchmarks:**
- [ ] Bundle size <140KB gzipped
- [ ] Time to interactive <3s on 3G
- [ ] First contentful paint <1.5s
- [ ] Lighthouse performance score >90

**Security & Compliance:**
- [ ] Journey data retained for 2 years max (refinancing cycle)
- [ ] Personal data anonymization after 90 days inactivity
- [ ] Explicit consent captured for reminder communications
- [ ] Professional users excluded from marketing communications
- [ ] All API routes have proper error handling and input validation

**Mobile Parity:**
- [ ] Step navigation works on mobile + desktop
- [ ] CTA states consistent across viewports
- [ ] Validation messages readable on small screens
- [ ] Touch targets meet accessibility minimums (44x44px)

**Testing Coverage:**
- [ ] Unit tests: form validation, calculation logic, schema compliance
- [ ] Integration tests: form-to-chat handoff, broker assignment flow
- [ ] E2E tests: complete application journey (form → analysis → chat)
- [ ] Manual QA: network failures, API errors, localStorage edge cases
- [ ] Test output pristine (no uncaught errors, clean console)

**Documentation:**
- [ ] Runbooks updated with production flows
- [ ] Rollback procedures documented
- [ ] Known issues logged in `docs/KNOWN_ISSUES.md`
- [ ] Deployment checklist verified (see `docs/runbooks/devops/production-deployment-guide.md`)

**References:**
- Session hardening: `docs/plans/archive/2025/09/2025-09-26-apply-production-readiness-plan.md`
- Broker alignment: `docs/plans/archive/2025/09/2025-09-26-broker-chat-alignment-plan.md`
- Form restoration: `docs/plans/archive/2025/10/2025-10-28-progressive-form-restoration-implementation-plan.md`

### Phase 1.5 Success Criteria
- [ ] 15 core content pieces published
- [ ] SEO audit score >80/100
- [ ] Organic impressions >10k/month
- [ ] Content freshness <30 days average age

### Phase 2 Success Criteria
- [ ] Organic traffic: 50k visitors/month
- [ ] Form starts: 500/month
- [ ] Qualified leads: 100/month
- [ ] Cost per lead: <$50 SGD

### Phase 3 Success Criteria
- [ ] Personalization engagement lift: >20%
- [ ] Broker efficiency: 2x more leads per broker
- [ ] Customer satisfaction: >4.5/5 stars
- [ ] Referral rate: >15%

---

## Technical Debt & Maintenance

**Known Issues (to address before Phase 2):**
- [ ] Audit logs stored locally (need Railway volume or logging service)
- [ ] Compliance report returns mock data (need real log parsing)
- [ ] No alerting configured for security events
- [ ] Windows file lock issues (3 directories)
- [ ] ESLint warnings in test files
- [ ] Broker assignment logic refinement
- [ ] Conversation state synchronization

**Architectural Improvements:**
- [ ] Remove adapter pattern in dr-elena-integration-service.ts (migrate fully to instant-profile.ts)
- [ ] Consolidate AI broker mobile variants to single component with density props
- [ ] Extract mobile-specific patterns into shared utilities

---

## Decision Log

### 2025-10-17: Archive Simple Calculator
**Decision:** Archive `SingaporeMortgageCalculator.tsx` and campaign pages
**Reason:** Focus on core `/apply` progressive form instead of multiple entry points
**Impact:** Campaign traffic will redirect to `/apply?loanType=...`

### 2025-10-17: Migrate to instant-profile.ts
**Decision:** Migrate AI broker backend from `dr-elena-mortgage.ts` to `instant-profile.ts`
**Reason:** instant-profile.ts uses dynamic Dr Elena v2 constants, dr-elena-mortgage.ts uses hardcoded values
**Impact:** Backward compatibility maintained via adapters, gradual migration recommended

### 2025-10-17: Merge Bloomberg + NextNest Design Tokens
**Decision:** Archive `tailwind.bloomberg.config.ts`, keep merged `tailwind.config.ts`
**Reason:** All useful Bloomberg tokens (12 colors) successfully merged into main config
**Impact:** Single source of truth for design system, no breaking changes

### 2025-10-17: Keep AI Broker Mobile Variants
**Decision:** Preserve all 3 mobile AI assistant variants (standard, compact, fixed)
**Reason:** Active plan `mobile-ai-broker-ui-rebuild-plan.md` in progress, evaluation pending
**Impact:** Decision deferred until plan completion

---

## How to Use This Roadmap

**For Planning:**
1. Check current phase and active plans
2. Create new plans in `docs/plans/active/`
3. Plans must reference this roadmap (link to specific phase/week)
4. Plans <200 lines, archive when complete

**For Implementation:**
1. Work only on current phase tasks
2. Don't jump ahead to Phase 2/3 features
3. Update roadmap when completing major milestones
4. Archive plans to `docs/plans/archive/{year}/{month}/`

**For Decision-Making:**
1. Check "Deferred / Out of Scope" before starting new work
2. Add decision log entries when making architectural choices
3. Update success metrics as we learn

**For Onboarding:**
1. Read this roadmap first
2. Check active plans for current work
3. Read CANONICAL_REFERENCES.md for code architecture
4. Read CLAUDE.md for coding standards

---

## Questions / Clarifications Needed

1. **IPA Status Field:** Need to review form plans/runbooks to determine integration strategy
2. **Broker Assignment:** Needs algorithm refinement (currently manual/round-robin)
3. **Rate Data Source:** Which API/service for live mortgage rate data?
4. **Content Strategy:** SEO keywords and content calendar for Phase 1.5?
5. **Partnership Strategy:** Which property portals to prioritize in Phase 2?

---

**Remember:** This roadmap evolves. When you learn something, update it. When priorities shift, document why. When features get deferred, explain the reasoning.
