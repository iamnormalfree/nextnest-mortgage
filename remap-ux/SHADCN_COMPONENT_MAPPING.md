# shadcn/ui Component Mapping Reference
**For NextNest Progressive Mortgage Form**  
**Date**: September 6, 2025

---

## 🎯 QUICK REFERENCE
This guide maps current custom components to their shadcn/ui replacements for the progressive mortgage form.

**🚀 Live Test Examples Available:**
- **Basic Testing**: `http://localhost:3015/test-shadcn`
- **Advanced Lead Form**: `http://localhost:3015/advanced-lead`
- **Progressive Form Demo**: See `ShadcnProgressiveFormTest.tsx`

---

## 📝 FORM COMPONENTS

### 1. Form Wrapper
**Current**: Custom `<form>` element
```typescript
<form onSubmit={handleSubmit(progressToNextStep)} className="space-y-6">
```

**shadcn/ui Replacement**: `<Form>` component
```typescript
import { Form } from "@/components/ui/form"

<Form {...form}>
  <form onSubmit={form.handleSubmit(progressToNextStep)} className="space-y-6">
```

**Benefits**: Enhanced accessibility, better validation display

---

### 2. Text Input Fields
**Current**: Custom `<input>` elements
```typescript
<input
  type="text"
  {...register('name')}
  placeholder="Enter your full name"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
/>
```

**shadcn/ui Replacement**: `<FormField>` + `<Input>`
```typescript
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Full Name</FormLabel>
      <FormControl>
        <Input 
          placeholder="Enter your full name"
          className="h-12" // Ensure 48px touch target
          {...field} 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Benefits**: Automatic validation display, consistent styling, accessibility

---

### 3. Select Dropdowns
**Current**: Custom `<select>` elements
```typescript
<select {...register('propertyType')} required>
  <option value="">Select property type</option>
  <option value="hdb">HDB Flat</option>
  <option value="condo">Condominium</option>
</select>
```

**shadcn/ui Replacement**: `<Select>` component
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<FormField
  control={form.control}
  name="propertyType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Property Type</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="hdb">HDB Flat</SelectItem>
          <SelectItem value="condo">Condominium</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Benefits**: Better mobile experience, keyboard navigation, accessibility

---

### 4. Buttons
**Current**: Custom `<button>` elements
```typescript
<button
  type="submit"
  disabled={!isValid || isSubmitting}
  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
>
  Continue to Step {currentStep + 1}
</button>
```

**shadcn/ui Replacement**: `<Button>` component
```typescript
import { Button } from "@/components/ui/button"

<Button
  type="submit"
  disabled={!isValid || isSubmitting}
  className="w-full h-12" // Maintain 48px touch target
  size="lg"
>
  Continue to Step {currentStep + 1}
</Button>
```

**Benefits**: Consistent hover states, loading indicators, size variants

---

## 🃏 CARD COMPONENTS

### 5. Property Category Cards
**Current**: Custom div cards
```typescript
<div className="grid grid-cols-2 gap-4">
  <div 
    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
      selectedCategory === 'resale' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
    }`}
    onClick={() => handleSelect('resale')}
  >
    <h3>Resale Property</h3>
    <p>Ready to move in</p>
  </div>
</div>
```

**shadcn/ui Replacement**: `<Card>` component
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card 
    className={cn(
      "cursor-pointer transition-all hover:shadow-nn-medium",
      "min-h-[48px] p-4", // Mobile touch target
      selectedCategory === 'resale' && "ring-2 ring-primary bg-gradient-to-br from-yellow-50 to-orange-50"
    )}
    onClick={() => handleSelect('resale')}
  >
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-gilda">Resale Property</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <p className="text-sm text-muted-foreground">Ready to move in</p>
    </CardContent>
  </Card>
</div>
```

**Benefits**: Professional shadows, better hover effects, consistent spacing

---

## 📊 PROGRESS & STATUS COMPONENTS

### 6. Progress Indicator
**Current**: Custom progress bar
```typescript
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-blue-600 h-2 rounded-full" 
    style={{ width: `${(currentStep / 3) * 100}%` }}
  ></div>
</div>
```

**shadcn/ui Replacement**: `<Progress>` component
```typescript
import { Progress } from "@/components/ui/progress"

<Progress 
  value={(currentStep / 3) * 100} 
  className="h-2"
/>
```

**Benefits**: Smooth animations, accessibility, consistent styling

---

### 7. Step Badges
**Current**: Custom step indicators
```typescript
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${
  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
}`}>
  {step}
</div>
```

**shadcn/ui Replacement**: `<Badge>` component
```typescript
import { Badge } from "@/components/ui/badge"

<Badge 
  variant={step <= currentStep ? "default" : "secondary"}
  className="h-8 w-8 rounded-full flex items-center justify-center"
>
  {step}
</Badge>
```

**Benefits**: Consistent variants, better contrast ratios

---

### 8. Loading States
**Current**: Custom loading animations
```typescript
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
</div>
```

**shadcn/ui Replacement**: `<Skeleton>` component
```typescript
import { Skeleton } from "@/components/ui/skeleton"

<div className="space-y-3">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

**Benefits**: Consistent loading animations, better performance

---

## 🎨 NEXTNET BRANDING WITH SHADCN/UI

### Using NextNest Colors with shadcn/ui
```typescript
// Primary Button (NextNest Gold)
<Button className="bg-primary text-primary-foreground">

// Accent Button (NextNest Purple)  
<Button variant="secondary" className="bg-accent text-accent-foreground">

// Cards with NextNest Gradients
<Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-primary">

// Focus Ring (NextNest Gold)
<Input className="focus:ring-primary focus:border-primary">
```

---

## 📱 MOBILE OPTIMIZATION MAINTAINED

### Touch Targets (48px minimum)
```typescript
// All interactive elements maintain touch targets
<Button className="h-12">        // 48px height
<Input className="h-12">         // 48px height  
<Card className="min-h-[48px]">  // Minimum 48px height
<SelectTrigger className="h-12"> // 48px height
```

### Responsive Layouts
```typescript
// Cards stack on mobile, side-by-side on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Form fields stack vertically with proper spacing
<div className="space-y-6">
```

---

## 🔧 IMPLEMENTATION ORDER

### Phase 2A: Core Form Components (Day 1)
1. ✅ Form wrapper (`<Form>`)
2. ✅ Text inputs (`<Input>` + `<FormField>`)  
3. ✅ Buttons (`<Button>`)
4. ✅ Select dropdowns (`<Select>`)

### Phase 2B: Visual Enhancements (Day 2)
5. ✅ Property category cards (`<Card>`)
6. ✅ Progress indicator (`<Progress>`)
7. ✅ Step badges (`<Badge>`)

### Phase 2C: Polish (Day 3)
8. ✅ Loading states (`<Skeleton>`)
9. ✅ Mobile testing and refinement
10. ✅ Accessibility audit

---

## ⚠️ CRITICAL REMINDERS

### DO NOT CHANGE:
- Form validation logic (React Hook Form + Zod)
- Calculation triggers and business rules
- Event bus and AI insights integration  
- Step progression logic
- Mobile touch target sizes

### MAINTAIN:
- NextNest brand colors and gradients
- 48px minimum touch targets
- Single column mobile layouts
- All existing form functionality
- Bundle size target (<140KB)

---

## 🧪 TESTING CHECKLIST

After each component replacement:
- [ ] Form submits successfully
- [ ] Validation messages display correctly
- [ ] Mobile touch targets work properly
- [ ] NextNest branding is preserved
- [ ] No console errors
- [ ] Bundle size impact acceptable

**Test URL**: http://localhost:3015

---

## 🎯 ADVANCED PATTERNS DEMONSTRATED

### Real-time Lead Scoring
```typescript
// Advanced pattern from AdvancedShadcnLeadForm.tsx
const [leadScore, setLeadScore] = useState(0)

useEffect(() => {
  let score = 0
  // Contact completeness (30%)
  if (watchedValues.fullName?.length > 2) score += 10
  if (watchedValues.email?.includes('@')) score += 10
  
  // Purchase intent (40%)
  if (watchedValues.purchaseTimeline === 'immediate') score += 20
  
  // Financial qualification (30%)
  if (watchedValues.employmentType === 'employed') score += 15
  
  setLeadScore(score)
}, [watchedValues])

// Visual feedback with color-coded scoring
<Badge variant="outline" className={cn("text-lg font-bold", getLeadScoreColor())}>
  {leadScore}/100
</Badge>
```

### Interactive Card Selection with Visual States
```typescript
// Advanced selection pattern with visual feedback
<Card 
  className={cn(
    "cursor-pointer transition-all duration-300 hover:shadow-lg",
    "border-2 min-h-[120px] relative overflow-hidden",
    field.value === option.value 
      ? "border-nn-gold bg-gradient-to-br from-nn-gold/10 to-nn-purple/5 shadow-lg ring-2 ring-nn-gold/20" 
      : "border-gray-200 hover:border-nn-gold/50"
  )}
  onClick={() => field.onChange(option.value)}
>
  {/* Visual selection indicator */}
  {field.value === option.value && (
    <div className="absolute top-2 right-2 w-6 h-6 bg-nn-gold rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
  )}
</Card>
```

### Professional Loading States
```typescript
// AI-themed loading with context
{isCalculating && (
  <Card className="bg-blue-50 border-blue-200">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[160px]" />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-nn-gold border-t-transparent"></div>
      </div>
      <p className="text-sm text-blue-600 mt-3">
        🤖 Processing your information with AI-powered mortgage insights...
      </p>
    </CardContent>
  </Card>
)}
```

### Multi-step Progress with Status Tracking
```typescript
// Advanced progress visualization
const getStepStatus = (stepId: number) => {
  if (completedSteps.includes(stepId)) return "completed"
  if (stepId === currentStep) return "current"
  return "upcoming"
}

<div className={cn(
  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300",
  status === "completed" && "bg-green-500 border-green-500 text-white shadow-lg",
  status === "current" && "bg-nn-gold border-nn-gold text-white shadow-lg ring-4 ring-nn-gold/20",
  status === "upcoming" && "bg-white border-gray-300 text-gray-400"
)}>
  {status === "completed" ? "✓" : step.id}
</div>
```

---

This mapping ensures a smooth transition from custom components to shadcn/ui while demonstrating advanced UX patterns for professional finance applications.