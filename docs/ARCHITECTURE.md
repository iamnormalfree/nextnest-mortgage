# NextNest Architecture

**NextNest** is a mortgage website built with Next.js 14 and TypeScript, designed with a **lean, GEO-first approach** for AI citation and search optimization. The architecture follows a hybrid SSR/client-side pattern.

## Key Design Principles

- **Stay Lean**: 12 dependencies vs typical 82+ - evaluate all additions carefully
- **GEO-First**: Optimized for Generative Engine Optimization and AI crawlers
- **Performance Priority**: Target ~140KB gzipped bundle size
- **Progressive Enhancement**: Core functionality works without JavaScript

## Core Architecture Components

### App Router Structure (`app/` directory)

**Pages:**
- `page.tsx` - Landing page with hero, services, and lead capture
- `layout.tsx` - Root layout with fixed navigation and global metadata
- `apply/page.tsx` - Progressive mortgage application form
- `dashboard/page.tsx` - Interactive mortgage calculator with React hooks

**API Routes:**
- `api/contact/route.ts` - Contact form submission
- `api/chatwoot-conversation/route.ts` - Lead form to Chatwoot integration
- `api/chatwoot-webhook/route.ts` - Chatwoot webhook event handler
- `api/forms/analyze/route.ts` - Form data analysis
- `api/ai-insights/route.ts` - AI-generated insights
- `api/compliance/report/route.ts` - MAS compliance reporting

### Business Logic Layer (`lib/` directory)
- `lib/calculations/mortgage.ts` - Mortgage calculation engine with Zod validation
- `lib/calculations/instant-profile.ts` - Dr Elena v2 calculation engine
- `lib/calculations/dr-elena-constants.ts` - Dr Elena persona constants and limits
- `lib/utils.ts` - Utility functions using clsx for conditional CSS

### Type Definitions (`types/` directory)
- `types/mortgage.ts` - TypeScript interfaces for mortgage data structures

### Component Strategy

NextNest follows a **domain-driven component organization** for scalability and maintainability:

- **`components/ui/`** - Design system primitives (Shadcn/ui: button, input, card, etc.)
- **`components/layout/`** - Layout components (ConditionalNav, Footer)
- **`components/landing/`** - Homepage sections (Hero, Services, Contact, CTA, Stats, Features, LoanType)
- **`components/shared/`** - Cross-feature utilities (AnimatedCounter, ErrorBoundary, icons, ChatwootWidget)
- **`components/forms/`** - Form components (ProgressiveFormWithController + sections)
- **`components/ai-broker/`** - AI broker chat components
- **`components/chat/`** - Chat UI components
- **`components/analytics/`** - Analytics visualizations
- **`components/calculators/`** - Calculator widgets

**Organization Rules:**
- 3+ related files → create domain subfolder
- Single utilities → place in `shared/`
- UI primitives → use `ui/` (Shadcn only)
- See CANONICAL_REFERENCES.md for Tier 1 component change rules

**Patterns:**
- Layout Pattern: Fixed navigation + page content composition
- Form Handling: React Hook Form with Zod validation
- Styling: Tailwind CSS with custom color palette and typography

## Tech Stack Specifics

- **Framework**: Next.js 14 with App Router
- **UI Components**: Shadcn/ui components with Tailwind CSS
- **Validation**: Zod schemas for type-safe form handling
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form for performance and validation
- **Build**: Optimized package imports for react-hook-form and date-fns
- **Type Safety**: TypeScript strict mode with comprehensive type definitions

## Code Style Guidelines

Follow the clean code principles defined in `CLAUDE.md`:
- Use meaningful names that reveal purpose
- Extract magic numbers to named constants
- Keep functions small and focused (single responsibility)
- Write smart comments that explain "why," not "what"
- Maintain DRY principles through proper abstraction

## File Organization Patterns

### Component Creation
1. **Determine placement** using Component Placement Decision Tree (CLAUDE.md)
2. Create `.tsx` files in appropriate domain folder:
   - UI primitives → `components/ui/`
   - Layout → `components/layout/`
   - Landing sections → `components/landing/`
   - Shared utilities → `components/shared/`
   - Forms → `components/forms/`
3. Use TypeScript interfaces for props
4. Follow existing naming conventions (PascalCase)
5. Import and compose in page components

### API Development
1. Create `route.ts` files in `app/api/[endpoint]/` structure
2. Export named HTTP method functions (GET, POST, etc.)
3. Use NextRequest/NextResponse types
4. Implement proper error handling and JSON responses

## Development Workflow

### Bundle Size Management
- Use `@next/bundle-analyzer` to monitor bundle size
- Target <140KB gzipped for marketing pages
- Leverage Next.js automatic code splitting
- Optimize package imports in `next.config.js`

### Form Development
- Use React Hook Form for performance
- Implement Zod schemas for validation in `lib/calculations/`
- Follow existing patterns:
  - Landing page forms: `components/landing/ContactSection.tsx`
  - Application form: `components/forms/ProgressiveFormWithController.tsx`
  - See FORMS_ARCHITECTURE_GUIDE.md for detailed patterns

## Business Logic

### Mortgage Calculations
- Core logic in `lib/calculations/mortgage.ts`
- Uses standard mortgage formula: `M = P * [r(1+r)^n] / [(1+r)^n - 1]`
- Zod validation for input sanitization
- Predefined scenarios: HDB_FLAT and PRIVATE_CONDO

### Navigation Structure
- Fixed navigation with dashboard link
- Hash-based internal navigation (#hero, #services, #contact)
- Mobile-responsive hamburger menu (not yet implemented)

## Testing and Quality

When making changes:
1. Run `npm run lint` to ensure code quality
2. Verify responsive design on multiple screen sizes
3. Test form submissions and calculations
4. Check bundle size impact with analyzer

## Deployment Configuration

- Image optimization configured for AVIF/WebP formats
- Static generation enabled for marketing pages
- Bundle analysis available via environment variable
- Ready for Vercel/Netlify deployment

## AI Broker Integration Architecture

### System Overview

NextNest implements an AI-powered broker chat system that provides personalized mortgage advisory through:
- **5 AI Broker Personas** with distinct communication styles (aggressive, balanced, conservative)
- **Lead Scoring & Routing** (0-100 score) matching customers to appropriate broker personas
- **Chatwoot Integration** (self-hosted at chat.nextnest.sg) for chat interface
- **Conversation Management** with deduplication and human handoff capabilities

### System Flow

```
Lead Form Submission (/apply)
  ↓
Chatwoot Conversation Creation
  ↓
AI Broker Assignment (based on lead score)
  ↓
Personalized Greeting & Chat
  ↓
Human Handoff (when needed)
```

### Database Schema

**AI Brokers Table:**
```sql
ai_brokers (
  id UUID,
  name TEXT,
  personality_type TEXT,        -- 'aggressive' | 'balanced' | 'conservative'
  is_available BOOLEAN,
  current_workload INTEGER,     -- Max 3 concurrent conversations
  active_conversations JSONB
)
```

**Broker Conversations Table:**
```sql
broker_conversations (
  id UUID,
  broker_id UUID,
  chatwoot_conversation_id INTEGER,
  lead_score DECIMAL,
  loan_type TEXT,
  status TEXT,                  -- 'active' | 'completed' | 'handed_off'
  assigned_at TIMESTAMPTZ
)
```

### Key API Routes

**`app/api/chatwoot-conversation/route.ts`**
- Creates Chatwoot conversations from form submissions
- Implements conversation deduplication (returning customers reuse conversations)
- Triggers broker assignment based on lead score
- Handles contact creation and metadata

**`app/api/chatwoot-webhook/route.ts`**
- Receives webhook events from Chatwoot
- Implements echo detection (prevents bot message loops)
- Routes incoming messages to AI processing
- Detects human handoff scenarios

### Integration Patterns

**Conversation Deduplication:**
- Matches existing conversations by contact + loan type
- Reuses conversations within 30-day window
- Prevents duplicate greetings to returning customers

**Echo Detection:**
- Tracks bot message IDs to prevent processing own messages
- In-memory deduplication set for webhook events
- Prevents infinite loops in bot-to-bot scenarios

**Human Handoff:**
- Detects complex questions requiring human intervention
- Updates conversation status from 'bot' to 'open'
- Releases AI broker capacity for reassignment
- Maintains conversation history for seamless transition

**Broker Capacity Management:**
- Each AI broker handles max 3 concurrent conversations
- Workload tracking with automatic availability updates
- Round-robin assignment within personality type tiers

### Environment Configuration

Required environment variables:

```bash
# Chatwoot Integration
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_API_KEY=your_api_key_here
CHATWOOT_BOT_USER_ID=1

# Database (Supabase)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# AI Integration
OPENAI_API_KEY=sk-...

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Performance Characteristics

| Metric | Target | Notes |
|--------|--------|-------|
| Greeting message delay | 2s | Human-like timing |
| Activity message delay | 500ms | System notifications |
| Response timing | 1-6s | Based on message urgency |
| Broker capacity | 3 concurrent | Per AI broker persona |
| Conversation deduplication | <30 days | Returning customer window |

### Migration Notes

Current implementation uses n8n for AI orchestration (external webhook). Future migration to Vercel AI SDK in-process is planned. See `docs/reports/investigations/ai-broker-system-pre-bullmq-migration-baseline.md` for detailed migration planning.

---

## AI Intelligent Lead Form Architecture

### Form File Structure
```
app/apply/page.tsx                              # Main form page route
components/forms/
  ProgressiveFormWithController.tsx             # Main form component (UI layer)
  ChatTransitionScreen.tsx                      # Transition screen to chat
  sections/
    Step3NewPurchase.tsx                        # Step 3 (property details) for new purchase
    Step3Refinance.tsx                          # Step 3 (property details) for refinance
hooks/
  useProgressiveFormController.ts               # Form state controller (business logic)
lib/
  calculations/
    instant-profile.ts                          # Dr Elena v2 calculation engine
    dr-elena-constants.ts                       # Dr Elena persona constants and limits
  forms/
    form-config.ts                              # Form step definitions and defaults
  contracts/
    form-contracts.ts                           # TypeScript interfaces for form data
  validation/
    mortgage-schemas.ts                         # Zod validation schemas
```

### Tech-Team Virtual Specialists
The project employs an 8-specialist virtual team for AI-powered lead capture implementation:
- Lead Full-Stack Architect, Frontend Engineer, Backend Engineer, AI/ML Engineer
- DevOps Engineer, Data Engineer, Security Engineer, UX Engineer
- Technical Project Coordinator for orchestration

### Critical Problems Prevention
The team identified and addresses 10 critical issues through structured roundtable formats:
1. Architectural inconsistency → Weekly Architecture Reviews
2. Component coupling → Event-driven architecture with TypeScript interfaces
3. AI integration brittleness → Multi-layer fallback system with circuit breakers
4. Missing learning loops → A/B testing framework and continuous optimization
5. Database schema chaos → Domain-driven design with bounded contexts
6. Configuration drift → DevOps deployment readiness checks
7. UX fragmentation → Bi-weekly consistency workshops
8. Data pipeline brittleness → Weekly reliability reviews
9. Security afterthought → Security-first development with compliance gates
10. Integration hell → Daily standup plus with integration focus

### Implementation Standards
- TypeScript strict mode with no `any` types
- Test-driven development with 80% coverage minimum
- Architecture Decision Records (ADRs) for all major decisions
- Performance budgets: <150KB bundle, <3s load time
- Security gates: PDPA compliance, automated vulnerability scanning

### Roundtable Formats
Structured collaboration sessions preventing code quality issues:
- Architecture Review (Weekly): Interface definitions and technical debt
- Pre-Implementation Planning (Per feature): Requirements and risk assessment
- AI Optimization Lab (Weekly): Performance metrics and prompt engineering
- Security & Compliance (Bi-weekly): Threat modeling and compliance checks
- Technical Debt Tribunal (Monthly): Debt prioritization and reduction

### Key Architectural Patterns
- Event-driven form components with event bus pattern
- Circuit breaker pattern for AI service resilience
- Multi-tier processing with clear bounded contexts
- Progressive disclosure with trust signal building
- Real-time lead scoring with behavioral analytics

For detailed implementation guidance, see `Tech-Team/` directory documentation.
