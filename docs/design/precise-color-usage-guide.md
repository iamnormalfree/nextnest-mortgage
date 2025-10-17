# Precise Color Usage Guide for NextNest

## Color Distribution
- **90% Monochrome** (Charcoal, Grey, White)
- **10% Yellow Accent** (#FCD34D from logo)
- **0% Purple** (Completely removed)

## Yellow Accent Usage: EXACTLY Where & When

### 1. Primary CTA Button (One per viewport)
**Where:** The single most important action button
**Examples:**
- Homepage: "Start Analysis" button
- Form page: "Continue" button
- Results page: "Get Broker Support" button

```css
.btn-primary {
  background: #FCD34D;
  color: #374151; /* Charcoal text on yellow */
}
```

### 2. Key Success Metric (One per section)
**Where:** The most important positive number
**Examples:**
- Best rate achieved: "1.35%"
- Total savings: "$34,560"
- Time saved: "2 hours vs 3 weeks"

```css
.metric-highlight {
  color: #374151; /* Charcoal text */
  border-bottom: 2px solid #FCD34D; /* Yellow underline */
}
```

### 3. Active State Indicators
**Where:** Current/selected states only
**Examples:**
- Active tab underline
- Selected option radio button
- Current step in progress bar

```css
.tab.active {
  border-bottom: 2px solid #FCD34D;
}
```

## Absolutely NO Yellow For:

### ❌ Never Use Yellow:
1. **Backgrounds** - Too overwhelming
2. **Body text** - Poor readability
3. **Multiple buttons** - Dilutes importance
4. **Decorative elements** - Not functional
5. **Gradients** - Loses sophistication
6. **Icons** - Keep monochrome
7. **Borders/cards** - Too busy
8. **Error states** - Use red (#EF4444)
9. **Headers/titles** - Keep charcoal

## Page-by-Page Yellow Allocation

### Homepage
```
✅ ONE Yellow Use: "Start Analysis" button
✅ ONE Yellow Accent: "1.35%" best rate (underline only)
❌ NO Yellow: Logo already provides yellow presence
```

### Progressive Form
```
✅ ONE Yellow Use: Active step indicator (dot or underline)
✅ ONE Yellow Use: "Continue" button
❌ NO Yellow: Form fields, labels, or backgrounds
```

### AI Broker Interface
```
✅ ONE Yellow Use: "Send" or primary action button
✅ ONE Yellow Accent: Lead score or confidence metric
❌ NO Yellow: Message bubbles, typing indicators
```

### Results/Dashboard
```
✅ ONE Yellow Use: "Contact Broker" CTA
✅ ONE Yellow Accent: Total savings number (underline)
❌ NO Yellow: Charts, graphs, secondary metrics
```

## Visual Hierarchy Without Purple

### Text Colors Only:
```css
/* Headlines */
--text-primary: #0A0A0A;    /* Black for headlines */
--text-body: #374151;       /* Charcoal for body */
--text-secondary: #6B6B6B;  /* Grey for secondary */
--text-disabled: #9CA3AF;   /* Light grey for disabled */

/* NO purple text anywhere */
```

### How to Create Emphasis Without Color:
1. **Size** - Larger font for importance
2. **Weight** - Bold for emphasis
3. **Position** - Top/center for priority
4. **Whitespace** - Isolation creates focus
5. **Contrast** - Black on white for maximum impact

## Interaction States (No Purple)

### Hover States:
```css
.btn-primary:hover {
  background: #FBB614; /* Darker yellow */
}

.link:hover {
  color: #0A0A0A; /* Black instead of charcoal */
  /* Never purple */
}
```

### Focus States:
```css
:focus {
  outline: 2px solid #374151; /* Charcoal outline */
  /* Never purple */
}
```

## The One Exception: Status Colors

### Semantic Colors (Not Brand Colors):
```css
--success: #10B981;  /* Green for positive changes */
--error: #EF4444;    /* Red for errors */
--warning: #F59E0B;  /* Orange for warnings */
--info: #3B82F6;     /* Blue for information */
```

These are ONLY for:
- Success messages
- Error alerts
- System notifications
- Status indicators

## Implementation Checklist

Before adding ANY yellow:
- [ ] Is there already yellow on screen? (Logo counts)
- [ ] Is this the PRIMARY action?
- [ ] Is this the KEY metric?
- [ ] Would removing it reduce clarity?

If any answer is NO, use monochrome instead.

## The Rule of One

**Per Viewport:**
- ONE yellow button
- ONE yellow accent (underline/indicator)
- ONE yellow micro-interaction (hover)
- ZERO yellow backgrounds
- ZERO yellow text

## Why No Purple?

1. **Brand Conflict**: Fights with yellow logo
2. **Cognitive Load**: Two accent colors confuse hierarchy
3. **Market Position**: Yellow is your differentiator
4. **Sophistication**: Monochrome + one accent is more premium

## Final Word

**Yellow is precious. Use it like saffron - sparingly and strategically.**

When in doubt, use charcoal/grey. The logo provides ambient yellow presence on every page, so you need very little additional yellow to maintain brand consistency.