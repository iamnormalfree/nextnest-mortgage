# 320px Mobile Screen Fixes
## Addressing Ultra-Small Screen Issues

### 🎯 Problems Identified:
1. Logo too large (40px height)
2. Hero text still too big for 320px
3. No differentiation between 320px and 640px screens
4. Padding too generous for small screens

---

## Fix 1: Reduce Logo Size on Mobile (2 mins)
**File: components/ConditionalNav.tsx**

**Line 24 - FIND:**
```typescript
className="h-10 w-auto"
```

**REPLACE WITH:**
```typescript
className="h-8 sm:h-10 w-auto"
```

This makes the logo 32px on 320px screens, 40px on 640px+

---

## Fix 2: Optimize Hero Text for 320px (3 mins)
**File: components/HeroSection.tsx**

**Line 13 - FIND:**
```typescript
<h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-ink leading-tight mb-6">
```

**REPLACE WITH:**
```typescript
<h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light text-ink leading-tight mb-4 sm:mb-6">
```

**Line 18 - FIND:**
```typescript
<p className="text-base md:text-lg text-charcoal mb-6 max-w-xl">
```

**REPLACE WITH:**
```typescript
<p className="text-sm sm:text-base md:text-lg text-charcoal mb-4 sm:mb-6 max-w-xl">
```

---

## Fix 3: Adjust Container Padding for 320px (2 mins)
**File: components/HeroSection.tsx**

**Line 9 - FIND:**
```typescript
<div className="max-w-7xl mx-auto px-4 md:px-8">
```

**REPLACE WITH:**
```typescript
<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
```

---

## Fix 4: Optimize Metric Card for 320px (3 mins)
**File: components/HeroSection.tsx**

**Lines 59, 67, 75 - FIND:**
```typescript
<div className="font-mono text-xl md:text-2xl font-medium text-ink">
```

**REPLACE WITH:**
```typescript
<div className="font-mono text-lg sm:text-xl md:text-2xl font-medium text-ink">
```

**Line 83 - FIND:**
```typescript
<div className="font-mono text-2xl md:text-3xl font-medium text-gradient-gold">
```

**REPLACE WITH:**
```typescript
<div className="font-mono text-xl sm:text-2xl md:text-3xl font-medium text-gradient-gold">
```

---

## Fix 5: Adjust Section Padding for 320px (2 mins)
**File: components/HeroSection.tsx**

**Line 8 - FIND:**
```typescript
<section className="bg-hero-gradient py-8 md:py-16 lg:py-20 scroll-mt-12" id="hero">
```

**REPLACE WITH:**
```typescript
<section className="bg-hero-gradient py-6 sm:py-8 md:py-16 lg:py-20 scroll-mt-12" id="hero">
```

---

## Fix 6: Button Text Size for Small Screens (2 mins)
**File: components/HeroSection.tsx**

**Lines 23-28 - Update button classes:**
```typescript
<a
  href="/apply?loanType=new_purchase"
  className="h-12 px-6 sm:px-8 bg-gold text-ink font-medium text-sm sm:text-base hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
>
  Start Free Analysis
</a>
```

---

## Fix 7: NavBar Height Adjustment (2 mins)
**File: components/ConditionalNav.tsx**

**Line 18 - FIND:**
```typescript
<nav className="fixed top-0 w-full h-16 bg-white border-b border-fog z-50">
```

**REPLACE WITH:**
```typescript
<nav className="fixed top-0 w-full h-14 sm:h-16 bg-white border-b border-fog z-50">
```

---

## 📱 Responsive Breakpoint Strategy

### Current (Problem):
- **320px-767px**: All treated the same (text-2xl)
- **768px+**: Desktop sizes

### New (Solution):
- **320px-639px**: Ultra-small (text-xl)
- **640px-767px**: Regular mobile (text-2xl)
- **768px+**: Tablet/Desktop (text-4xl+)

---

## 🎯 Result After Fixes:

### 320px screens will have:
- Smaller logo (32px height)
- Smaller text (text-xl for headlines)
- Tighter padding (px-3, py-6)
- Smaller metric card text
- More compact navbar

### 640px+ screens maintain:
- Current mobile sizes
- Better readability
- Proper spacing

---

## Testing Sizes:
- **320px**: iPhone SE, older devices
- **375px**: iPhone 12 mini
- **390px**: iPhone 14
- **640px**: Large phones, small tablets

Total time: ~16 minutes