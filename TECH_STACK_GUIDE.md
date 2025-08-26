# NextNest - Tech Stack & Codebase Navigation Guide

## 🚀 Tech Stack Overview

### **Core Framework**
- **Next.js 14.0.4** - React-based full-stack framework with App Router
- **React 18.3.0** - UI library with hooks and modern patterns
- **TypeScript 5.6.0** - Type-safe JavaScript development

### **Styling & UI**
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **PostCSS 8.4.49** - CSS processing tool
- **Autoprefixer 10.4.20** - CSS vendor prefixing
- **Custom Fonts**: Gilda Display (serif), Inter (sans-serif)

### **Form Handling**
- **React Hook Form 7.53.0** - Performant form library with validation

### **Development Tools**
- **ESLint 8.57.1** - Code linting and formatting
- **TypeScript Types** - @types/node, @types/react, @types/react-dom

### **Build & Deployment**
- **Node.js** - Runtime environment
- **npm** - Package manager
- **Next.js Build System** - Production optimization

---

## 🎯 Development Philosophy

### **Core Principles**
- **Stay Lean**: Keep Next.js but evaluate all dependencies before adding
- **GEO-First**: Optimize for AI citation and Generative Engine Optimization
- **Performance Priority**: Maintain fast site speed (~140KB gzipped target)
- **Progressive Enhancement**: Build core functionality without JavaScript, enhance with JS
- **SSR Strategy**: Server-render marketing/SEO pages, use client islands for interactivity

### **Decision Framework**
Before adding any dependency or feature, ask:
1. **Does this improve GEO/SEO?**
2. **Is this essential for user functionality?**
3. **Can we build this with existing tools?**
4. **What's the bundle size impact?**

### **Architecture Strategy**
- **Marketing Pages**: SSR for AI crawlers and search engines
- **Dashboard**: Hybrid SSR shell + interactive islands
- **Calculators**: Server-rendered initial state + client interactivity
- **Programmatic Content**: Generate location/loan-type combinations for SEO
- **External APIs**: Add only when user dashboards are ready

---

## 📁 Project Structure & Navigation

```
NextNest/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   └── contact/
│   │       └── route.ts          # Contact form submission endpoint
│   ├── dashboard/
│   │   └── page.tsx              # Mortgage calculator page
│   ├── globals.css               # Global Tailwind styles
│   ├── layout.tsx                # Root layout with navigation
│   └── page.tsx                  # Landing page (home)
├── components/                   # Reusable React components
│   ├── ContactSection.tsx        # Lead capture form component
│   ├── HeroSection.tsx           # Hero section with mortgage preview
│   ├── ServicesSection.tsx       # Features and benefits section
│   └── icons.tsx                 # SVG icon components
├── Configuration Files
│   ├── .eslintrc.json           # ESLint configuration
│   ├── next.config.js           # Next.js configuration
│   ├── package.json             # Dependencies and scripts
│   ├── postcss.config.js        # PostCSS configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   └── tsconfig.json            # TypeScript configuration
└── README.md                    # Project documentation
```

---

## 🧭 Navigation Guide

### **Main Application Flow**
1. **Landing Page** (`app/page.tsx`)
   - Entry point with hero, services, and contact sections
   - Uses components from `components/` directory

2. **Dashboard** (`app/dashboard/page.tsx`)
   - Interactive mortgage calculator
   - Client-side React with hooks for state management

3. **API Endpoint** (`app/api/contact/route.ts`)
   - Handles form submissions
   - Returns JSON responses

### **Component Architecture**
- **Layout Component** (`app/layout.tsx`)
  - Fixed navigation bar
  - Global metadata and styling
  - Wraps all pages

- **Page Components** (`app/page.tsx`, `app/dashboard/page.tsx`)
  - Route-specific content
  - Import and compose smaller components

- **Feature Components** (`components/`)
  - Self-contained UI sections
  - Reusable across pages

### **Key Files to Understand**

#### **1. `app/layout.tsx`**
- Root layout component
- Navigation structure
- Global styling and fonts
- SEO metadata

#### **2. `app/page.tsx`**
- Home page composition
- Imports HeroSection, ServicesSection, ContactSection

#### **3. `app/dashboard/page.tsx`**
- Mortgage calculator logic
- React hooks for state management
- Real-time calculations
- Interactive sliders and forms

#### **4. `app/api/contact/route.ts`**
- POST endpoint for form submissions
- Basic validation
- JSON response handling
- Error handling

#### **5. `components/ContactSection.tsx`**
- Lead capture form
- React Hook Form integration
- Form validation and submission

#### **6. `tailwind.config.ts`**
- Custom color palette
- Font configurations
- Component styling utilities

---

## 🎨 Design System

### **Color Palette**
```css
Primary Blue: #4A90E2 (primary-500)
Dark Blue: #3A80D2 (primary-600)
Dark Navy: #0D1B2A (dark-900)
Light Background: #FAF9F8 (light-50)
```

### **Typography**
- **Headings**: Gilda Display (serif)
- **Body Text**: Inter (sans-serif)
- **Responsive sizing**: Tailwind's text-* classes

### **Layout Patterns**
- **Container**: `container mx-auto px-4 sm:px-6 lg:px-8`
- **Cards**: `bg-white rounded-xl shadow-lg border`
- **Buttons**: `bg-[#4A90E2] hover:bg-[#3A80D2] text-white`

---

## 🔧 Development Workflow

### **Local Development**
```bash
npm install          # Install dependencies
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

### **File Modification Guidelines**

#### **Adding New Pages**
1. Create file in `app/` directory
2. Export default React component
3. Add navigation link in `app/layout.tsx`

#### **Adding New Components**
1. Create `.tsx` file in `components/`
2. Use TypeScript interfaces for props
3. Import and use in page components

#### **Styling Guidelines**
1. Use Tailwind utility classes
2. Follow existing color scheme
3. Maintain responsive design patterns
4. Use custom fonts: `font-gilda` or `font-sans`

#### **API Development**
1. Create `route.ts` in `app/api/[endpoint]/`
2. Export HTTP method functions (GET, POST, etc.)
3. Use NextRequest/NextResponse types
4. Implement proper error handling

---

## 🚀 Deployment Configuration

### **Environment Variables**
Currently no environment variables required, but recommended for production:
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
DATABASE_URL=your-database-connection
EMAIL_SERVICE_API_KEY=your-email-service-key
```

### **Build Optimization**
- Next.js automatic code splitting
- Image optimization with `next/image`
- CSS optimization with Tailwind purging
- TypeScript compilation

### **Production Considerations**
1. **Database Integration** - Add database for lead storage
2. **Email Service** - Connect contact form to email service
3. **Analytics** - Add Google Analytics or similar
4. **Error Monitoring** - Add Sentry or similar service
5. **Environment Variables** - Secure API keys and configurations

---

## 📋 Feature Overview

### **Current Features**
✅ **Responsive Landing Page**
- Hero section with mortgage preview
- Services showcase
- Lead capture form

✅ **Interactive Mortgage Calculator**
- Real-time payment calculations
- Adjustable loan parameters
- Quick scenario buttons (HDB, Private Condo)

✅ **Contact Form**
- Form validation with React Hook Form
- API endpoint for submissions
- Success/error state handling

✅ **Modern UI/UX**
- Clean, professional design
- Mobile-responsive layout
- Smooth transitions and interactions

### **Potential Enhancements**
- Database integration for lead storage
- Email notifications for form submissions
- Advanced mortgage calculation features
- User authentication and saved calculations
- CRM integration
- A/B testing capabilities

---

## 🛠️ Troubleshooting

### **Common Issues**
1. **Build Errors**: Check TypeScript types and imports
2. **Styling Issues**: Verify Tailwind class names and configuration
3. **API Errors**: Check route.ts file structure and exports
4. **Form Issues**: Verify React Hook Form setup and validation

### **Development Tips**
- Use browser dev tools for debugging
- Check console for errors and warnings
- Use TypeScript for better error catching
- Test responsive design on multiple screen sizes
- Validate forms thoroughly before submission

### Reusable Tools You DON'T Need:
❌ Skip these popular additions:
React Query (overkill for your simple data needs)
Zustand/Redux (no complex state management needed)
Framer Motion (animations aren't priority)
Heavy component libraries (Tailwind is enough)

### WHEN TO USE PROGRESSIVE ENHANCEMENT:

#### ✅ USE FOR:
1. Calculators (work without JS for SEO)
2. Forms (accessibility requirement)  
3. Search (basic GET params work everywhere)
4. File uploads (fallback for all devices)

#### ❌ DON'T USE FOR:
1. Real-time chat (requires JS)
2. Complex animations (JS-only features)
3. Client-only features (like drawing tools)

### WHEN TO USE MICRO-FRAMEWORKS:

#### ✅ USE WHEN:
1. You have repetitive code patterns
2. Need focused functionality (validation, dates, HTTP)
3. Want to avoid reinventing the wheel
4. Bundle size is still small

#### ❌ AVOID WHEN:
1. You can write it in 5-10 lines yourself
2. Only using 1-2 functions from large library
3. Adds complexity without clear benefit

#### FOR YOUR MORTGAGE PLATFORM - RECOMMENDED:
✅ Zod (form validation)
✅ clsx (conditional CSS)
✅ date-fns (mortgage date calculations)
❌ Skip: lodash, ramda, moment.js (too heavy)

---

## 🏗️ Architecture Decisions & Implementation Strategy

### **Folder Structure Evolution**
Based on GEO optimization requirements, the project will adopt a hybrid structure:

```
NextNest/
├── app/
│   ├── (marketing)/              # Route group for static/SEO pages
│   │   ├── calculators/         # Static calculator pages for SEO
│   │   │   └── [location]/[type]/page.tsx
│   │   └── guides/              # Educational content
│   ├── dashboard/               # Existing interactive calculator (preserved)
│   ├── api/                     # API routes
│   └── layout.tsx              # Root layout
├── lib/                         # Business logic layer
│   ├── calculations/           # Mortgage calculation utilities
│   ├── seo/                   # SEO utilities
│   └── utils.ts
├── data/                       # Static data for programmatic content
├── types/                      # TypeScript definitions
└── components/
    ├── marketing/              # Static/SEO components
    ├── dashboard/              # Interactive components
    └── ui/                     # Base components
```

### **Component Strategy**
**Decision**: Preserve existing dashboard calculator, add new static components for SEO
- **Existing Dashboard**: Keep `app/dashboard/page.tsx` as interactive calculator
- **New Static Calculators**: Create progressive enhancement versions for SEO
- **Shared Logic**: Extract calculations to `lib/calculations/` for reuse

### **Progressive Enhancement Pattern**
1. **Level 1**: Works without JavaScript (form submissions via GET params)
2. **Level 2**: JavaScript enhancement for real-time calculations
3. **Level 3**: Advanced features (charts, comparisons)

### **Bundle Size Management**
- **Target**: Maintain <140KB gzipped for marketing pages
- **Strategy**: Code splitting between marketing and dashboard routes
- **Monitoring**: Use `@next/bundle-analyzer` for tracking

### **SEO/GEO Implementation**
- **Static Generation**: Pre-render calculator pages for all location/type combinations
- **Schema Markup**: Structured data for AI crawlers
- **Progressive Enhancement**: Ensure functionality without JavaScript

### **Development Phases**
1. **Phase 1**: ✅ **COMPLETED** - Extract business logic, add new dependencies
2. **Phase 2**: Create static calculator pages and components  
3. **Phase 3**: Implement AI triage system and n8n integration

### **Phase 1 Implementation Details**
**Dependencies Added:**
- `zod` (12KB) - Form validation and schema parsing
- `clsx` (500B) - Conditional CSS class utility
- `date-fns` (tree-shakeable) - Date manipulation for mortgage calculations
- `sharp` - Image optimization for Next.js
- `@next/bundle-analyzer` (dev) - Bundle size monitoring

**New Folder Structure:**
```
├── lib/
│   ├── calculations/
│   │   └── mortgage.ts          # Extracted calculator logic with Zod validation
│   ├── seo/                     # SEO utilities (future)
│   └── utils.ts                 # Utility functions (clsx, formatters)
├── data/                        # Static data for programmatic content
├── types/
│   └── mortgage.ts              # TypeScript interfaces
```

**Bundle Configuration:**
- Bundle analyzer configured in `next.config.js`
- Image optimization with AVIF/WebP support
- Package import optimization for react-hook-form and date-fns

### **Risk Mitigation**
- **Preserve Working Features**: ✅ Existing dashboard remains untouched
- **Incremental Migration**: ✅ Shared logic extracted without breaking changes
- **Fallback Strategy**: Static pages work without JavaScript