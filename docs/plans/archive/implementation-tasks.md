# NextNest Bloomberg Terminal × Spotify Redesign - Implementation Tasks

## Based on independent-ux-evaluation-2.md

This is a precise, junior-developer-friendly task list for implementing the Bloomberg Terminal × Spotify × Swiss Spa design philosophy.

---

## Phase 1: Color System Foundation

### Phase 1.1: Define color variables in globals.css
**Exact Implementation:**
```css
/* Primary Palette - 95% of UI */
--ink: #0A0A0A;           /* Primary text - pure black */
--charcoal: #1C1C1C;      /* Secondary text */
--graphite: #374151;      /* From logo - body text */
--silver: #8E8E93;        /* Tertiary text */
--pearl: #C7C7CC;        /* Disabled states */
--fog: #E5E5EA;          /* Borders, dividers */
--mist: #F2F2F7;         /* Backgrounds */
--white: #FFFFFF;         /* Cards, inputs */

/* Accent - 5% of UI (from logo) */
--gold: #FCD34D;          /* Primary actions only */
--gold-dark: #F59E0B;     /* Hover states */
--gold-pale: #FEF3C7;     /* Backgrounds at 5% opacity */

/* Semantic (minimal use) */
--emerald: #10B981;       /* Positive only */
--ruby: #EF4444;          /* Errors only */
```

### Phase 1.2: Remove ALL emoji instances
**Files to check:**
- `app/redesign/sophisticated-flow/page.tsx`
- `components/forms/IntelligentMortgageForm.tsx`
- `components/forms/SimpleAgentUI.tsx`

**Find and remove:**
- 🔒 Bank-level encryption
- 🏦 Bank logos
- ✨ Sparkles
- 🎯 Target
- Any other decorative emojis

### Phase 1.3: Install and configure icon library
**Command:**
```bash
npm install lucide-react
```

### Phase 1.4: Create icon mappings
**Replace each emoji with specific icon:**
```typescript
import {
  Lock,           // Replace 🔒
  Building2,      // Replace 🏦
  TrendingUp,     // Replace 📈
  Calculator,     // Replace 🧮
  Shield,         // Replace 🛡️
  CheckCircle,    // Replace ✅
  AlertCircle,    // Replace ⚠️
  Info           // Replace ℹ️
} from 'lucide-react';

// Icon size: 24px
// Stroke width: 2px
<Lock className="w-6 h-6" strokeWidth={2} />
```

---

## Phase 2: Typography System

### Phase 2.1: Update typography - install SF Pro Display
**Add to globals.css:**
```css
@import url('https://fonts.cdnfonts.com/css/sf-pro-display');

/* Font Stack */
--font-primary: 'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace;
```

### Phase 2.2: Define typography scale
**Exact sizes to implement:**
```css
/* Scale (Major Third - 1.25 ratio) */
--text-xs: 11px;     /* Labels, metadata */
--text-sm: 13px;     /* Secondary text */
--text-base: 16px;   /* Body text */
--text-lg: 20px;     /* Subheadings */
--text-xl: 25px;     /* Section headers */
--text-2xl: 31px;    /* Page headers */
--text-3xl: 39px;    /* Hero text */
--text-4xl: 49px;    /* Display text */
```

### Phase 2.3: Apply font weights
**Weights to use:**
```css
--weight-light: 300;     /* Hero headlines only */
--weight-regular: 400;   /* Body text */
--weight-medium: 500;    /* Buttons, important text */
--weight-semibold: 600;  /* Section headers */
```

---

## Phase 3: Spacing System

### Phase 3.1: Implement 8px spacing system variables
**Add to globals.css:**
```css
/* Mathematical Progression */
--space-0: 0px;
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
--space-8: 64px;
--space-10: 80px;
--space-12: 96px;
--space-16: 128px;
```

### Phase 3.2: Update all padding/margins
**Rules:**
- Section padding: `128px` (space-16)
- Card padding: `32px` (space-4)
- Form group spacing: `24px` (space-3)
- Button padding: `16px × 32px` (space-2 × space-4)
- Icon spacing: `8px` (space-1)

---

## Phase 4: Navigation Bar

### Phase 4.1: Navigation dimensions
**Exact specifications:**
```css
.navigation {
  height: 64px;
  background: white;
  border-bottom: 1px solid #E5E5EA;
  padding: 0 32px;
}
```

### Phase 4.2: Navigation elements
**Logo and buttons:**
```css
.logo {
  height: 32px;
}

.nav-button {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1C;
  background: transparent;
  border: none;
  padding: 8px 16px;
}
```

---

## Phase 5: Hero Section

### Phase 5.1: Remove ALL animations
**Delete:**
- Floating animations
- Parallax effects
- Continuous movements
- Gradient animations

### Phase 5.2: Hero typography
**Exact implementation:**
```css
.hero-heading {
  font-size: 49px;
  font-weight: 300;
  color: #0A0A0A;
  margin-bottom: 16px;
}

.hero-subtext {
  font-size: 20px;
  font-weight: 400;
  color: #1C1C1C;
  margin-bottom: 48px;
}
```

### Phase 5.3: Hero buttons
**Two buttons only:**
```css
.hero-button {
  height: 48px;
  padding: 0 32px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 0;
  transition: all 200ms ease;
}

.hero-button-primary {
  background: #FCD34D;
  color: #0A0A0A;
}

.hero-button-secondary {
  background: transparent;
  color: #1C1C1C;
  border: 1px solid #E5E5EA;
}
```

---

## Phase 6: Form Design

### Phase 6.1: Form fields
**Exact specifications:**
```css
.form-input {
  height: 48px;
  padding: 0 16px;
  background: white;
  border: 1px solid #E5E5EA;
  font-size: 16px;
  color: #0A0A0A;
  transition: border-color 200ms ease;
}
```

### Phase 6.2: Form labels
**Label styling:**
```css
.form-label {
  font-size: 11px;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
```

### Phase 6.3: Form focus states
**Focus behavior:**
```css
.form-input:focus {
  border-color: #FCD34D;
  outline: none;
  /* NO box-shadow */
}
```

### Phase 6.4: Form spacing
**Exact measurements:**
- Between fields: `24px`
- Between sections: `48px`
- Form padding: `32px`

---

## Phase 7: Button System

### Phase 7.1: Primary button
**Gold button:**
```css
.btn-primary {
  background: #FCD34D;
  color: #0A0A0A;
  height: 48px;
  padding: 0 32px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  transition: all 200ms ease;
}
```

### Phase 7.2: Secondary button
**Ghost button:**
```css
.btn-secondary {
  background: transparent;
  color: #1C1C1C;
  height: 48px;
  padding: 0 32px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #E5E5EA;
  transition: all 200ms ease;
}
```

### Phase 7.3: Button hover states
**Hover effects:**
```css
.btn-primary:hover {
  background: #F59E0B;
  transform: scale(1.02);
}

.btn-secondary:hover {
  background: #F2F2F7;
}
```

### Phase 7.4: Button click state
**Active state:**
```css
.btn:active {
  transform: scale(0.98);
}
```

---

## Phase 8: AI Broker Interface

### Phase 8.1: Sidebar layout
**Dimensions:**
```css
.ai-sidebar {
  width: 320px;
  background: #F2F2F7;
  padding: 24px;
  border-radius: 8px;
}
```

### Phase 8.2: Confidence score
**Display:**
```css
.confidence-score {
  font-size: 31px;
  font-family: 'SF Mono', monospace;
  color: #0A0A0A;
}

.confidence-bar {
  height: 4px;
  background: #E5E5EA;
  border-radius: 2px;
}

.confidence-fill {
  height: 100%;
  background: #FCD34D;
  transition: width 300ms ease;
}
```

### Phase 8.3: Chat messages
**Styling:**
```css
.message-user {
  background: #0A0A0A;
  color: white;
  text-align: right;
  margin-left: 30%;
}

.message-ai {
  background: white;
  color: #0A0A0A;
  border: 1px solid #E5E5EA;
  text-align: left;
  margin-right: 30%;
}
```

### Phase 8.4: Chat dimensions
**Specifications:**
```css
.message {
  padding: 16px;
  border-radius: 8px;
  max-width: 70%;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}
```

---

## Phase 9: Metric Cards

### Phase 9.1: Card structure
**Dimensions:**
```css
.metric-card {
  height: 120px;
  background: white;
  border: 1px solid #E5E5EA;
  padding: 24px;
  /* NO border-radius */
}
```

### Phase 9.2: Remove animations
**Delete:**
- Floating effects
- Hover animations (except 2px lift)
- Number counters (keep ONE for hero metric only)

### Phase 9.3: Card typography
**Text hierarchy:**
```css
.metric-label {
  font-size: 11px;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 31px;
  color: #0A0A0A;
  font-weight: 500;
}

.metric-change {
  font-size: 13px;
  color: #10B981; /* or #EF4444 for negative */
  margin-top: 8px;
}
```

---

## Phase 10: Progress Indicator

### Phase 10.1: Progress structure
**Specifications:**
```css
.progress-step {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #E5E5EA;
}

.progress-line {
  height: 1px;
  background: #E5E5EA;
  flex: 1;
}
```

### Phase 10.2: Progress states
**Colors:**
```css
.step-active {
  background: #FCD34D;
  border-color: #FCD34D;
}

.step-complete {
  background: #1C1C1C;
  border-color: #1C1C1C;
  /* Show checkmark icon inside */
}

.step-pending {
  background: transparent;
  border-color: #E5E5EA;
}
```

---

## Phase 11: Color Replacement

### Phase 11.1: Remove ALL purple
**Find and replace:**
- Search: `#7C3AED`
- Replace: `#FCD34D`
- Search: `purple`
- Replace: `gold`

### Phase 11.2: Remove gradients
**Keep only ONE gradient:**
- Hero section background (subtle)
- Remove ALL other gradients

### Phase 11.3: Reduce shadows
**Maximum opacity:**
```css
/* Replace all shadows with: */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
/* or */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```

---

## Phase 12: Animation Rules

### Phase 12.1: Limit all transitions
**Maximum duration:**
```css
transition: all 200ms ease;
/* NO transitions longer than 200ms */
```

### Phase 12.2: Hover lift effect
**Exact implementation:**
```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
}
```

### Phase 12.3: Remove decorative animations
**Delete:**
- Parallax scrolling
- Floating elements
- Continuous animations
- Pulsing effects
- Rotation animations

---

## Phase 13: Mobile Optimization

### Phase 13.1: Grid stacking
**Breakpoint:**
```css
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

### Phase 13.2: Mobile buttons
**Dimensions:**
```css
@media (max-width: 768px) {
  .button {
    height: 56px;
    width: 100%;
  }
}
```

### Phase 13.3: Mobile padding
**Spacing:**
```css
@media (max-width: 768px) {
  .section {
    padding: 64px 16px;
  }
}
```

---

## Phase 14: Loading States

### Phase 14.1: Skeleton loading
**Structure:**
```css
.skeleton {
  background: #F2F2F7;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}
```

### Phase 14.2: Skeleton animation
**Wave effect:**
```css
.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: skeleton-wave 1.5s infinite;
}

@keyframes skeleton-wave {
  to { left: 100%; }
}
```

---

## Phase 15: Quality Checks

### Phase 15.1: Performance audit
**Targets:**
- CSS bundle size: < 100KB
- First paint: < 1 second
- Lighthouse score: > 95

### Phase 15.2: Steve Jobs Test
**Questions to validate:**
1. Can you remove any element without breaking the design? ✓
2. Would Bloomberg Terminal users respect this? ✓
3. Would you trust this with $1M mortgage? ✓
4. Does it feel worth $50K/month subscription? ✓

---

## Files to Update

### Primary files:
1. `app/redesign/sophisticated-flow/page.tsx`
2. `app/redesign/sophisticated-flow/sophisticated-flow.module.css`
3. `components/forms/IntelligentMortgageForm.tsx`
4. `components/forms/SimpleAgentUI.tsx`
5. `app/globals.css`

### Component files:
- All form components in `components/forms/`
- All UI components in `components/ui/`
- Navigation components
- Card components

---

## Testing Checklist

After each phase:
- [ ] Visual regression test
- [ ] Mobile responsiveness check
- [ ] Performance audit
- [ ] Accessibility scan
- [ ] Cross-browser testing

---

## Notes for Junior Developers

1. **Always use exact values** - Don't approximate colors or sizes
2. **Test after each change** - Verify nothing breaks
3. **Commit frequently** - One task = one commit
4. **Ask questions** - If unclear, refer to evaluation doc
5. **No creativity** - Follow specifications exactly

---

## Success Metrics

- **Clean:** Every element has purpose
- **Fast:** 200ms max animations
- **Trustworthy:** Institutional-grade appearance
- **Minimal:** 95% monochrome, 5% accent

---

*Implementation based on independent-ux-evaluation-2.md - Bloomberg Terminal × Spotify × Swiss Spa design philosophy*