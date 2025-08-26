# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev

# Production build and start
npm run build
npm run start

# Code quality
npm run lint
```

## Project Architecture

**NextNest** is a mortgage website built with Next.js 14 and TypeScript, designed with a **lean, GEO-first approach** for AI citation and search optimization. The architecture follows a hybrid SSR/client-side pattern.

### Key Design Principles
- **Stay Lean**: 12 dependencies vs typical 82+ - evaluate all additions carefully
- **GEO-First**: Optimized for Generative Engine Optimization and AI crawlers
- **Performance Priority**: Target ~140KB gzipped bundle size
- **Progressive Enhancement**: Core functionality works without JavaScript

### Core Architecture Components

**App Router Structure (`app/` directory):**
- `page.tsx` - Landing page with hero, services, and lead capture
- `layout.tsx` - Root layout with fixed navigation and global metadata
- `dashboard/page.tsx` - Interactive mortgage calculator with React hooks
- `api/contact/route.ts` - Form submission API endpoint

**Business Logic Layer (`lib/` directory):**
- `lib/calculations/mortgage.ts` - Mortgage calculation engine with Zod validation
- `lib/utils.ts` - Utility functions using clsx for conditional CSS

**Type Definitions (`types/` directory):**
- `types/mortgage.ts` - TypeScript interfaces for mortgage data structures

### Component Strategy
- **Feature Components** (`components/`): Self-contained UI sections (Hero, Services, Contact)
- **Layout Pattern**: Fixed navigation + page content composition
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom color palette and typography

### Tech Stack Specifics
- **Framework**: Next.js 14 with App Router
- **Validation**: Zod schemas for type-safe form handling
- **Styling**: Tailwind CSS with custom fonts (Gilda Display + Inter)
- **Forms**: React Hook Form for performance and validation
- **Build**: Optimized package imports for react-hook-form and date-fns

## Code Style Guidelines

Follow the clean code principles defined in `.windsurf/rules/clean-code-rules.mdc`:
- Use meaningful names that reveal purpose
- Extract magic numbers to named constants
- Keep functions small and focused (single responsibility)
- Write smart comments that explain "why," not "what"
- Maintain DRY principles through proper abstraction

## File Organization Patterns

**Component Creation:**
1. Create `.tsx` files in `components/` directory
2. Use TypeScript interfaces for props
3. Follow existing naming conventions (PascalCase)
4. Import and compose in page components

**API Development:**
1. Create `route.ts` files in `app/api/[endpoint]/` structure
2. Export named HTTP method functions (GET, POST, etc.)
3. Use NextRequest/NextResponse types
4. Implement proper error handling and JSON responses

## Development Workflow

**Bundle Size Management:**
- Use `@next/bundle-analyzer` to monitor bundle size
- Target <140KB gzipped for marketing pages
- Leverage Next.js automatic code splitting
- Optimize package imports in `next.config.js`

**Form Development:**
- Use React Hook Form for performance
- Implement Zod schemas for validation in `lib/calculations/`
- Follow existing patterns in `components/ContactSection.tsx`

**Styling Approach:**
- Primary palette: `#4A90E2` (primary), `#0D1B2A` (dark), `#FAF9F8` (light)
- Container pattern: `container mx-auto px-4 sm:px-6 lg:px-8`
- Button pattern: `bg-[#4A90E2] hover:bg-[#3A80D2] text-white`
- Use `font-gilda` for headings, `font-sans` for body text

## Business Logic

**Mortgage Calculations:**
- Core logic in `lib/calculations/mortgage.ts`
- Uses standard mortgage formula: `M = P * [r(1+r)^n] / [(1+r)^n - 1]`
- Zod validation for input sanitization
- Predefined scenarios: HDB_FLAT and PRIVATE_CONDO

**Navigation Structure:**
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