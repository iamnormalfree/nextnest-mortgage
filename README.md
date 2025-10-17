# NextNest - Singapore's Smartest Mortgage Platform

An AI-powered mortgage platform with sophisticated UI design and intelligent broker matching.

## What's Included

✅ **Landing Page** - Clean hero section with your existing design
✅ **Lead Capture Form** - Working contact form with validation
✅ **Mortgage Calculator** - Interactive dashboard with real calculations
✅ **Responsive Design** - Mobile-friendly with Tailwind CSS
✅ **API Endpoint** - Form submission handling

## Key Simplifications

- **12 dependencies** instead of 82
- **No complex state management** (React Query, Zustand)
- **No heavy charting libraries** (Recharts removed)
- **No database complexity** (simple API endpoints)
- **No lazy loading complexity** (everything loads normally)
- **No AI features** (focus on core mortgage functionality)

## Quick Start

```bash
cd ModernMortgage-Simple
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
├── app/
│   ├── api/contact/          # Form submission API
│   ├── dashboard/            # Mortgage calculator
│   ├── globals.css           # Tailwind styles
│   ├── layout.tsx            # Root layout with navigation
│   └── page.tsx              # Landing page
├── components/
│   ├── ContactSection.tsx    # Lead capture form
│   ├── HeroSection.tsx       # Hero with mortgage preview
│   ├── ServicesSection.tsx   # Features section
│   └── icons.tsx             # Simple SVG icons
└── package.json              # Minimal dependencies
```

## Features

### Landing Page
- Hero section with mortgage preview card
- Services section highlighting benefits
- Statistics and social proof

### Lead Capture Form
- Required fields: name, email, phone, loan amount, property type
- Form validation and submission
- Success state with thank you message
- API endpoint for processing submissions

### Mortgage Calculator
- Interactive sliders for loan amount, interest rate, term
- Real-time payment calculations
- Quick scenario buttons (HDB, Private Condo)
- Payment breakdown and totals

## 🎨 Design System

**Single Source of Truth:** `/app/redesign/sophisticated-flow/page.tsx`

### Quick Setup
```bash
# Enable the new design system
echo "NEXT_PUBLIC_USE_SOPHISTICATED_FLOW=true" >> .env.local
npm run dev
```

### Design Principles
- **90% Monochrome + 10% Yellow** (#FCD34D)
- **NO Purple** - Yellow accent only
- **Sharp Rectangles** - NO rounded corners
- **Font Weights:** 300/400/600 ONLY
- **"Rule of One":** ONE yellow element per viewport

### Key Files
- **Design Tokens:** `/lib/design/tokens.ts`
- **Documentation:** `/docs/design/SINGLE_SOURCE_OF_TRUTH.md`
- **Setup Guide:** `/SOPHISTICATED_FLOW_SETUP.md`

### Component Patterns
```typescript
import { COLORS, COMPONENT_PATTERNS } from '@/lib/design/tokens'

// Primary CTA (yellow)
<button className={COMPONENT_PATTERNS.primaryButton.className}>
  Get Started
</button>

// Card with sharp corners
<div className={COMPONENT_PATTERNS.card.className}>
  {/* content */}
</div>
```

---

## Next Steps

1. **Add Email Integration** - Connect form to email service
2. **Add Database** - Store leads in simple database
3. **Add Analytics** - Basic Google Analytics
4. **Deploy** - Host on Vercel or Netlify

## Deployment

```bash
npm run build
npm start
```

The site is ready for production deployment on any hosting platform that supports Next.js.
