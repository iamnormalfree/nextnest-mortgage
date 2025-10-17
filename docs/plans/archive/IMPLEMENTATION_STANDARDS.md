# NextNest Implementation Standards
*The best of Swiss spa minimalism with strategic sophistication*

## Quick Reference: Gradient Budget

### Per Page Limits
| Page Type | Gradient Limit | Example Pages |
|-----------|---------------|---------------|
| Level 3 (Premium) | 3-4 gradients | Homepage, Landing |
| Level 2 (Refined) | 2-3 gradients | Dashboard, Features |
| Level 1 (Minimal) | 0-1 gradient | Forms, Settings |

### Gradient Grouping Rules
- Multiple trust indicators = 1 gradient use
- Hero headline words = 1 gradient use
- Collection of metric cards = 1 gradient use

## Component Library

### 1. Navigation Bar
```tsx
<nav className="nav glass" style={{ borderBottom: 'none' }}>
  <div className="container nav-container">
    <Logo />
    <div className="nav-links">
      <a href="#" className="nav-link">Text Link</a>
      <button className="btn-pill btn-primary">
        Primary CTA
        <ArrowRight />
      </button>
    </div>
  </div>
</nav>
```
**Guidelines:**
- Glass morphism: 70-95% white
- Primary CTA: Pill button acceptable
- Secondary links: Text only

### 2. Hero Section
```tsx
<section className="section-xl grid-pattern">
  <h1 className="font-display heading-7xl">
    <span className="gradient-text-accent">Key Word</span>
    <span className="text-black">Rest of Title</span>
  </h1>
  <p className="text-xl text-stone">
    Subtitle with <span className="mono font-semibold">286</span> inline metric
  </p>
  <div className="flex gap-md">
    <button className="btn-pill btn-primary glow-box">Primary</button>
    <button className="btn-pill btn-ghost">Secondary</button>
  </div>
</section>
```
**Guidelines:**
- ONE gradient text accent
- ONE primary + ONE ghost CTA
- Inline metrics in mono font

### 3. Trust Indicators
```tsx
<div className="grid grid-cols-3 gap-2xl">
  {metrics.map((stat) => (
    <div className="text-center reveal">
      <span className="heading-6xl font-display gradient-text-accent">
        <AnimatedCounter end={stat.value} />
      </span>
      <div className="text-sm font-semibold text-graphite">{stat.label}</div>
      <div className="text-xs text-stone">{stat.sublabel}</div>
    </div>
  ))}
</div>
```
**Guidelines:**
- Group of 3 counts as ONE gradient use
- Animated counters for engagement
- Staggered reveal animations

### 4. Data Cards
```tsx
<div className="data-card card-elevated hover-lift">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="heading-2xl font-semibold">{title}</h3>
      <p className="text-sm text-stone">{description}</p>
    </div>
    <div className="text-right">
      <div className="text-xl mono text-accent">{metric}</div>
      <div className="text-xs text-stone">{label}</div>
    </div>
  </div>
</div>
```
**Guidelines:**
- White background on cloud sections
- Hover-lift animation (2-4px)
- Metrics in corners, not gradients

### 5. Badges
```tsx
<span className="badge badge-success">Success</span>
<span className="badge badge-info">Info</span>
<span className="badge badge-warning">Warning</span>
```
**Colors:**
- Success: Green (#059669)
- Info: Blue (#0055FF)
- Warning: Amber (#F59E0B)

### 6. Live Indicators
```tsx
<span className="badge badge-success">
  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
  Real-time
</span>
```

### 7. Form Steps
```tsx
<div className="flex items-center justify-between">
  <div className="h-px bg-gradient-to-r from-accent to-blue-400"
       style={{ width: `${progress}%` }} />
  {steps.map((step, i) => (
    <div className={`w-8 h-8 rounded-full ${
      i < current ? 'bg-black' :
      i === current ? 'bg-accent' :
      'bg-white border'
    }`}>
      {i < current ? <Check /> : i + 1}
    </div>
  ))}
</div>
```

## Animation Standards

### Timing
- Micro interactions: 200ms
- Hover states: 200ms ease-out
- Reveal animations: 800ms ease-out
- Floating elements: 6s ease-in-out
- Counter animations: 1500-2500ms

### Reveal Stagger
```css
.reveal { animation-delay: 0s; }
.reveal-delay-1 { animation-delay: 0.1s; }
.reveal-delay-2 { animation-delay: 0.2s; }
.reveal-delay-3 { animation-delay: 0.3s; }
```

## Color Usage

### Text Hierarchy
1. **Primary**: `text-black` or `text-graphite`
2. **Secondary**: `text-stone`
3. **Accent**: `text-accent` (sparingly)
4. **Gradient**: `gradient-text-accent` (1-2 per section max)

### Backgrounds
1. **Primary**: White
2. **Secondary**: `var(--color-cloud)`
3. **Gradient**: 5-10% opacity only
4. **Glass**: 70-95% white with blur

## Spacing Checklist

- [ ] Section padding: `96px` vertical
- [ ] Container padding: `32px` horizontal
- [ ] Component gaps: `48px` between major
- [ ] Element gaps: `16px` between related
- [ ] All spacing uses 8px grid

## Performance Guidelines

### Image Optimization
- Use Next.js Image component
- Provide width/height or use fill
- Set priority on above-fold images

### Animation Performance
```css
.will-animate {
  will-change: transform;
}
```

### Bundle Size
- Target: <140KB gzipped
- Use dynamic imports for heavy components
- Tree-shake unused CSS

## Accessibility

### Color Contrast
- Text on white: Min 4.5:1 ratio
- Text on cloud: Min 4.5:1 ratio
- Interactive elements: Min 3:1 ratio

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}
```

### Touch Targets
- Minimum: 44x44px
- Preferred: 48x48px

## Mobile Optimization

### Breakpoints
```css
@media (max-width: 640px) { /* Mobile */ }
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 1024px) { /* Desktop */ }
```

### Mobile Adjustments
- Reduce gradients by 50%
- Disable floating animations
- Stack all grids to single column
- Increase touch target sizes

## Common Patterns

### Hero + Data Card
```tsx
<div className="hero-grid">
  <div>
    <h1>Title with <span className="gradient-text-accent">accent</span></h1>
    <p>Subtitle</p>
    <button className="btn-primary">CTA</button>
  </div>
  <div className="data-card floating-tilt">
    {/* Metrics */}
  </div>
</div>
```

### Feature Grid
```tsx
<div className="grid grid-cols-2 gap-xl">
  {features.map(f => (
    <div className="hover-lift card">
      <h3>{f.title}</h3>
      <p>{f.description}</p>
      <div className="mono text-accent">{f.metric}</div>
    </div>
  ))}
</div>
```

### Tab Navigation
```tsx
<div className="tabs">
  {tabs.map(tab => (
    <button className={`tab ${active === tab ? 'active' : ''}`}>
      {tab}
    </button>
  ))}
</div>
```

## Conversion Elements Priority

1. **Trust Signals** (animated counters, live indicators)
2. **Clear CTAs** (primary + ghost pattern)
3. **Data Emphasis** (mono fonts, strategic gradients)
4. **Social Proof** (badges, metrics)
5. **Urgency** (real-time updates, limited offers)

## Do's and Don'ts

### DO ✅
- Use gradients for trust and conversion
- Group related gradients as one
- Maintain 8px spacing grid
- Add hover-lift to interactive cards
- Use mono font for all numbers

### DON'T ❌
- Use more than 4 gradients per page
- Add gradients to body text
- Create rainbow effects
- Use bouncing animations
- Mix spacing units

## Testing Before Deploy

- [ ] Gradient count within limits?
- [ ] All spacing on 8px grid?
- [ ] Animations at 60fps?
- [ ] Mobile experience tested?
- [ ] Accessibility validated?
- [ ] Bundle size checked?
- [ ] Trust signals implemented?
- [ ] CTAs clear and compelling?

---

Remember: **Swiss spa minimalism** is the foundation. **Sophistication** is the strategic accent.