# Approved Components for Premium Form & AI Broker UI

Based on UX evaluation principles (Swiss spa minimalism, 90% monochrome + 10% yellow accent)

## ✅ APPROVED Components (Align with Premium Minimalism)

### 1. **Form Elements**

#### Floating Label Input ✅
```css
.input-premium with floating label
```
- **Why:** Clean, sophisticated, space-efficient
- **Usage:** All form inputs in progressive form
- **Modification:** Change purple focus to charcoal (#374151)

#### Simple Dropdown ✅
```css
Basic select with border-[#E5E5E5]
```
- **Why:** Clean, functional, no unnecessary decoration
- **Usage:** Property type, loan amount selections
- **Modification:** Focus border should be charcoal, not purple

#### Radio Selection (Simplified) ✅
```css
.radio-premium (without purple accent)
```
- **Why:** Clear selection states
- **Usage:** Loan type selection (HDB/Private/Commercial)
- **Modification:** Active state = charcoal circle, not purple

### 2. **Buttons**

#### Primary Button (Modified) ✅
```css
.btn-premium (with yellow background)
```
- **ONE per screen only**
- **Color:** Yellow (#FCD34D) background, charcoal text
- **Usage:** "Start Analysis", "Continue", "Send Message"
- **Remove:** Gradient, use solid yellow

#### Ghost Button ✅
```css
.btn-premium-ghost
```
- **Why:** Secondary actions without visual weight
- **Usage:** "Learn More", "Back", "Cancel"
- **Color:** Charcoal border and text

### 3. **Cards**

#### Elevated Card (Subtle) ✅
```css
.card-premium-elevated (with minimal shadow)
```
- **Why:** Creates hierarchy without decoration
- **Usage:** Data display, form sections
- **Modification:** Reduce shadow to 5% opacity

#### Glass Card (Ultra Subtle) ⚠️
```css
.glass-premium (95% white opacity)
```
- **Use sparingly:** Navigation bar only
- **Not for:** Content areas or forms

### 4. **Feedback Elements**

#### Progress Bar (Monochrome) ✅
```css
.progress-premium (without gradient)
```
- **Color:** Grey background, charcoal fill
- **Usage:** Form completion indicator
- **Remove:** Shimmer effect, gradient

#### Simple Spinner ✅
```css
.spinner-premium (in charcoal)
```
- **Why:** Clear loading state
- **Usage:** Button loading, data fetching
- **Color:** Charcoal only

#### Skeleton Loading ✅
```css
.skeleton-premium
```
- **Why:** Maintains layout during load
- **Usage:** AI response loading
- **Color:** Light grey (#F5F5F5)

### 5. **Micro-interactions**

#### Hover States ✅
- **Opacity change:** 0.8 on hover
- **Duration:** 200ms max
- **No:** Color changes, transforms

#### Focus States ✅
- **Outline:** 2px solid charcoal
- **Offset:** 2px
- **No:** Colored glows or shadows

## ❌ REJECTED Components (Too Decorative)

### Components to AVOID:

1. **Liquid Buttons** ❌
   - Too playful, not professional enough

2. **Neumorphic Elements** ❌
   - Trendy, not timeless
   - Creates visual noise

3. **Magnetic Effects** ❌
   - Gimmicky, distracting from content

4. **Morphing Shapes** ❌
   - Pure decoration, no function

5. **Parallax Cards** ❌
   - Unnecessary complexity

6. **Animated Dividers** ❌
   - Distracting movement

7. **Purple Gradients** ❌
   - Replace with solid colors

8. **Badges (Most)** ❌
   - Only keep essential status indicators

9. **Tooltips with Animation** ❌
   - Use static, simple tooltips if needed

10. **Toggle Switch (Complex)** ❌
    - Use simple checkbox instead

## 📋 Implementation Guidelines for Forms

### Progressive Form Structure:
```
1. Loan Type Selection
   - Simple radio buttons (charcoal active state)
   - Ghost cards for options

2. Contact Information
   - Floating label inputs
   - Charcoal focus states
   - One yellow "Continue" button

3. Property Details
   - Simple dropdowns
   - Monochrome progress bar

4. Results Display
   - Elevated cards with data
   - ONE yellow CTA
```

### AI Broker UI Structure:
```
1. Message Interface
   - Simple white/grey message bubbles
   - No gradients or animations
   - Charcoal text

2. Input Area
   - Floating label input
   - Yellow send button (only color)

3. Data Display
   - Monochrome metrics
   - ONE yellow accent for key metric
   - Simple dividers
```

## 🎯 Component Color Modifications

### Replace ALL Purple (#7C3AED) with:
- **Interactive elements:** Charcoal (#374151)
- **Primary CTA:** Yellow (#FCD34D)
- **Hover states:** Darker charcoal (#1A1A1A)
- **Active states:** Charcoal with 2px underline

### Typography in Components:
- **Headers:** Charcoal, weight 400
- **Body:** Grey (#6B6B6B), weight 400
- **Labels:** Charcoal, weight 500
- **No gradients on any text**

## ✨ Acceptable Premium Touches (Use Sparingly)

### Maximum 2-3 per page:
1. **Subtle shadow on cards** (5% opacity)
2. **200ms transitions** on interactions
3. **ONE yellow accent** per viewport

### Avoid:
- Shimmer effects
- Pulsing animations
- Gradient fills
- 3D transforms
- Glow effects
- Complex animations

## Summary

**Use:** Clean inputs, simple buttons, minimal cards, basic feedback
**Avoid:** Decorative effects, animations, gradients, purple colors
**Focus:** Functionality over ornamentation
**Color:** 90% monochrome, 10% yellow accent

The goal: Components should be invisible - users focus on the task, not the UI.