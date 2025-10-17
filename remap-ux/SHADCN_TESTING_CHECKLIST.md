# shadcn/ui Integration Testing Checklist
**For NextNest Progressive Mortgage Form**  
**Date**: September 6, 2025

---

## 🎯 CRITICAL TESTING AREAS

### **Pre-Implementation Tests**
Before replacing any components in the main ProgressiveForm, verify:

#### 1. Current Progressive Form Baseline
- [ ] **Step 2 New Purchase**: All 4 fields work (propertyCategory, propertyType, propertyPrice, approximateAge)
- [ ] **Step 2 Refinancing**: All 4 fields work (propertyType, currentRate, outstandingLoan, currentBank)  
- [ ] **Step 3**: Maximum 5 fields display correctly per path
- [ ] **Instant Calculations**: Trigger properly on field changes
- [ ] **IWAA Calculation**: Joint applicant handling works
- [ ] **Form Validation**: Zod + React Hook Form displays errors correctly
- [ ] **Mobile Touch Targets**: 48px minimum on all interactive elements
- [ ] **Event Bus Integration**: AI insights populate correctly
- [ ] **Navigation**: Forward/backward between steps works
- [ ] **Form Submission**: Complete flow submits successfully

---

## 🧪 SHADCN/UI COMPONENT TESTING

### **Phase 1: Basic Component Tests**
Test each shadcn/ui component individually:

#### Form Wrapper (`<Form>`)
- [ ] **Import Success**: `import { Form } from "@/components/ui/form"` works
- [ ] **React Hook Form Integration**: `<Form {...form}>` connects properly
- [ ] **Validation Display**: Error messages appear correctly
- [ ] **Accessibility**: ARIA labels and screen reader compatibility
- [ ] **NextNest Styling**: CSS variables apply correctly

#### Input Fields (`<Input>`)
- [ ] **Basic Functionality**: Text input, number input, email validation
- [ ] **Touch Targets**: 48px height maintained (`className="h-12"`)
- [ ] **Focus States**: NextNest gold focus ring appears
- [ ] **Placeholder Text**: Displays correctly
- [ ] **Error States**: Red border and error message on validation failure
- [ ] **Mobile Keyboard**: Correct keyboard types (number, email) on mobile
- [ ] **Field Registration**: React Hook Form `{...field}` spread works

#### Select Dropdowns (`<Select>`)
- [ ] **Basic Functionality**: Options display and select correctly
- [ ] **Touch Targets**: 48px height maintained
- [ ] **Keyboard Navigation**: Arrow keys work, Enter selects
- [ ] **Mobile Experience**: Touch-friendly dropdown on mobile devices
- [ ] **Placeholder**: "Select..." text shows when no option chosen
- [ ] **Value Persistence**: Selected value remains after form re-renders
- [ ] **Integration**: `onValueChange={field.onChange}` works

#### Buttons (`<Button>`)
- [ ] **Variants**: Primary, secondary, outline styles work
- [ ] **Sizes**: Large buttons maintain 48px touch targets
- [ ] **Disabled State**: Proper styling when `disabled={true}`
- [ ] **Loading State**: Spinner or loading text displays
- [ ] **Hover Effects**: NextNest gold hover states
- [ ] **Focus Accessibility**: Keyboard focus ring visible
- [ ] **Submit Functionality**: Form submission triggers correctly

#### Cards (`<Card>`)
- [ ] **Selection States**: Visual feedback when selected
- [ ] **Hover Effects**: Shadow and border changes on hover
- [ ] **Touch Targets**: Minimum 48px height for card buttons
- [ ] **Content Layout**: CardHeader, CardContent spacing correct
- [ ] **Responsive**: Stack on mobile, side-by-side on desktop
- [ ] **NextNest Branding**: Gold selection rings and gradients
- [ ] **Click Handlers**: `onClick` events fire correctly

#### Progress & Status (`<Progress>`, `<Badge>`)
- [ ] **Progress Animation**: Smooth transitions between values
- [ ] **Step Badges**: Current, completed, upcoming states
- [ ] **Color Coding**: Green=completed, gold=current, gray=upcoming
- [ ] **Accessibility**: Progress percentage announced to screen readers
- [ ] **Visual Consistency**: Matches NextNest design system

#### Loading States (`<Skeleton>`)
- [ ] **Animation**: Smooth pulse animation
- [ ] **Sizing**: Proper widths and heights for content placeholders
- [ ] **Contextual**: AI-themed loading messages
- [ ] **Performance**: No layout shift when content loads
- [ ] **Mobile**: Responsive skeleton sizes

---

## 🚀 PROGRESSIVE FORM INTEGRATION TESTING

### **Phase 2: Integration with Existing Form Logic**

#### Form State Management
- [ ] **Field Watching**: `useForm().watch()` triggers re-renders
- [ ] **Validation Triggers**: Real-time validation on field changes
- [ ] **Default Values**: Pre-populated fields work with shadcn/ui components
- [ ] **Form Reset**: `form.reset()` clears shadcn/ui components
- [ ] **Step Navigation**: Data persists when navigating between steps
- [ ] **Conditional Fields**: `shouldShowField` logic works with new components

#### Calculation Integration
- [ ] **Instant Calculations**: Mortgage calculations trigger on shadcn/ui field changes
- [ ] **IWAA Logic**: Joint applicant calculations work with new age/income inputs
- [ ] **Property Type Logic**: Calculations adjust based on shadcn/ui select values
- [ ] **Validation Rules**: Zod schemas work with shadcn/ui FormField pattern
- [ ] **Error Handling**: Calculation errors display properly in shadcn/ui components

#### Event Bus & AI Integration
- [ ] **Event Publishing**: Form changes publish to event bus correctly
- [ ] **AI Insights Display**: Insights populate in shadcn/ui Cards
- [ ] **Loading States**: AI processing shows shadcn/ui Skeleton components
- [ ] **Real-time Updates**: Form updates trigger AI recalculations
- [ ] **Error Recovery**: AI failures don't break shadcn/ui components

---

## 📱 MOBILE & ACCESSIBILITY TESTING

### **Mobile Device Testing**

#### Touch Target Compliance
- [ ] **48px Minimum**: All interactive elements meet accessibility standards
- [ ] **Button Heights**: `h-12` class applied to all buttons
- [ ] **Input Heights**: `h-12` class applied to all form inputs  
- [ ] **Card Touch Areas**: `min-h-[48px]` on clickable cards
- [ ] **Select Dropdowns**: Trigger areas are 48px minimum

#### Responsive Design
- [ ] **iPhone SE (375px)**: Form works on smallest target screen
- [ ] **iPad (768px)**: Tablet layout displays correctly
- [ ] **Desktop (1200px+)**: Full desktop experience
- [ ] **Single Column**: Mobile layouts stack vertically
- [ ] **No Horizontal Scroll**: All content fits within viewport
- [ ] **Text Readability**: 16px minimum font sizes maintained

#### Mobile-Specific Features
- [ ] **Keyboard Types**: Number keypad for numeric inputs
- [ ] **Input Modes**: Proper inputMode attributes
- [ ] **Zoom Prevention**: meta viewport prevents unwanted zoom
- [ ] **Touch Gestures**: Swipe and tap interactions work smoothly
- [ ] **Performance**: No lag on slower mobile devices

### **Accessibility (WCAG 2.1 AA)**

#### Keyboard Navigation
- [ ] **Tab Order**: Logical tab sequence through all form elements
- [ ] **Enter Key**: Submits forms, activates buttons
- [ ] **Arrow Keys**: Navigate select options and radio groups
- [ ] **Escape Key**: Closes dropdowns and modals
- [ ] **Space Bar**: Activates buttons and checkboxes

#### Screen Reader Compatibility
- [ ] **ARIA Labels**: All form fields properly labeled
- [ ] **Error Messages**: Screen readers announce validation errors
- [ ] **Progress Updates**: Step changes announced to assistive technology
- [ ] **Loading States**: Loading messages announced
- [ ] **Required Fields**: Required status communicated clearly

#### Visual Accessibility
- [ ] **Focus Rings**: Visible focus indicators on all interactive elements
- [ ] **Color Contrast**: WCAG AA compliance (4.5:1 for normal text)
- [ ] **Color Independence**: Information not conveyed by color alone
- [ ] **Text Scaling**: Readable at 200% zoom level
- [ ] **High Contrast Mode**: Works with Windows/macOS high contrast

---

## ⚡ PERFORMANCE & BUNDLE TESTING

### **Bundle Size Analysis**
- [ ] **Before Measurement**: Record current bundle size
- [ ] **After Measurement**: Verify shadcn/ui impact stays under +20KB
- [ ] **Tree Shaking**: Only used shadcn/ui components included in bundle
- [ ] **Lighthouse Score**: Performance score remains above 90
- [ ] **Core Web Vitals**: LCP, FID, CLS metrics within Google targets

### **Runtime Performance**
- [ ] **Form Interactions**: No lag on input field changes
- [ ] **Validation Speed**: Real-time validation performs smoothly
- [ ] **Animation Performance**: 60fps on progress bars and hover effects
- [ ] **Memory Usage**: No memory leaks during form usage
- [ ] **Mobile Performance**: Smooth experience on mid-range devices

---

## 🛠️ DEVELOPMENT & DEBUGGING TESTING

### **TypeScript Integration**
- [ ] **Type Safety**: No TypeScript errors after shadcn/ui integration
- [ ] **IntelliSense**: Auto-completion works for shadcn/ui components
- [ ] **Prop Validation**: TypeScript catches incorrect prop usage
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Import Statements**: All shadcn/ui imports resolve correctly

### **Development Experience**
- [ ] **Hot Reload**: Changes to shadcn/ui components trigger fast refresh
- [ ] **Error Boundaries**: Component errors don't crash entire form
- [ ] **Console Warnings**: No React warnings in development console
- [ ] **DevTools**: React DevTools shows proper component hierarchy
- [ ] **Debugging**: Easy to inspect form state and component props

### **Browser Compatibility**
- [ ] **Chrome**: Latest and Chrome 90+ (2 versions back)
- [ ] **Safari**: Latest and Safari 14+ (2 versions back)
- [ ] **Firefox**: Latest and Firefox 88+ (2 versions back)
- [ ] **Edge**: Latest and Edge 90+ (2 versions back)
- [ ] **Mobile Safari**: iOS 14+ Safari
- [ ] **Chrome Mobile**: Android Chrome

---

## 🚨 CRITICAL REGRESSION TESTING

### **Business Logic Protection**
Ensure these remain unchanged after shadcn/ui integration:

#### Mortgage Calculations (PROTECTED)
- [ ] **HDB LTV Logic**: 75% vs 55% loan-to-value calculations intact
- [ ] **EC/Private LTV Logic**: Property-specific calculations unchanged  
- [ ] **Age Limits**: Loan tenure calculations based on age work correctly
- [ ] **Income Validation**: IWAA joint applicant logic unchanged
- [ ] **Rate Calculations**: Interest rate computations accurate
- [ ] **MAS Compliance**: Singapore regulatory requirements maintained

#### Form Validation Schemas
- [ ] **Step 2 Schema**: Zod validation rules unchanged
- [ ] **Step 3 Schema**: All required/optional field rules intact
- [ ] **Error Messages**: Custom validation messages preserved
- [ ] **Field Dependencies**: Conditional validation logic works
- [ ] **Cross-field Validation**: Multi-field validation rules maintained

#### Event Bus & AI Integration
- [ ] **Event Publishing**: Form submission events publish correctly
- [ ] **AI Triggers**: Calculation changes trigger AI analysis
- [ ] **Insight Display**: AI insights populate form correctly
- [ ] **Error Handling**: AI failures handled gracefully
- [ ] **Data Flow**: Information flows correctly between components

---

## ✅ SIGN-OFF CRITERIA

### **Implementation Complete When:**
1. **All Component Tests Pass**: Every shadcn/ui component works correctly
2. **Integration Tests Pass**: Full form flow works end-to-end  
3. **Mobile Tests Pass**: All mobile and accessibility requirements met
4. **Performance Tests Pass**: Bundle size and runtime performance acceptable
5. **Regression Tests Pass**: All existing functionality preserved
6. **Cross-browser Tests Pass**: Works consistently across supported browsers
7. **TypeScript Clean**: No TypeScript errors or warnings
8. **Documentation Updated**: All guides reflect shadcn/ui implementation

### **Testing Timeline:**
- **Phase 1 (Day 1)**: Component isolation tests
- **Phase 2 (Day 2)**: Progressive form integration tests
- **Phase 3 (Day 3)**: Mobile, accessibility, and performance tests
- **Phase 4 (Day 4)**: Regression testing and sign-off

### **Test Environment:**
- **URL**: `http://localhost:3015` (or current dev server)
- **Advanced Examples**: `/test-shadcn` and `/advanced-lead`
- **Reference Components**: `ShadcnProgressiveFormTest.tsx`, `AdvancedShadcnLeadForm.tsx`

---

## 🔧 TROUBLESHOOTING GUIDE

### **Common Issues & Solutions:**

#### "Form not submitting after shadcn/ui integration"
- **Check**: FormField `name` props match form schema
- **Fix**: Ensure `control={form.control}` on all FormFields
- **Verify**: `{...field}` spread applied to form controls

#### "Validation errors not displaying"
- **Check**: `<FormMessage />` included in FormItem
- **Fix**: Import FormMessage from "@/components/ui/form"
- **Verify**: Zod schema matches shadcn/ui FormField names

#### "Mobile touch targets too small"
- **Check**: `h-12` class applied to interactive elements
- **Fix**: Add `className="h-12"` to inputs, buttons, selects
- **Verify**: `min-h-[48px]` on clickable cards

#### "NextNest branding lost"
- **Check**: CSS variables in globals.css
- **Fix**: Ensure `--primary`, `--accent` variables set correctly
- **Verify**: `ring-nn-gold` and NextNest classes still work

#### "TypeScript errors after implementation"
- **Check**: Import statements for shadcn/ui components
- **Fix**: Update import paths to "@/components/ui/*"
- **Verify**: All component props match TypeScript interfaces

---

This comprehensive checklist ensures shadcn/ui integrates seamlessly with your progressive mortgage form while maintaining all existing functionality, performance, and NextNest branding.