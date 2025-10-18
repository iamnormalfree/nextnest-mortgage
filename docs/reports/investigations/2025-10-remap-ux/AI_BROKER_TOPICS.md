# 🤖 AI BROKER CONVERSATION TOPICS
**Internal Note: What the AI Broker Should Ask About**

## 📝 PURPOSE
This document lists the specific topics and questions the AI broker should cover during consultation, based on property categories selected in Step 2.

---

## 🏗️ NEW LAUNCH PROPERTIES

### **Questions to Ask:**
1. **Launch Status**
   - What stage is the launch? (Preview/VVIP/Launch Soon/Already Launched)
   - Have you registered interest or attended previews?

2. **Project Details**
   - What's the project name?
   - Which developer and location?
   - What unit types are you interested in?

3. **Launch Strategy**
   - Are you targeting VVIP preview or public launch?
   - Do you have priority booking status?
   - What's your timeline for booking?

4. **Financing Preferences**
   - Interested in developer financing schemes?
   - Progressive payment vs deferred payment preference?
   - Need bridge loan if selling current property?

### **AI Broker Value-Add:**
- Advise on optimal booking timing
- Compare developer vs bank financing packages  
- Guide on documentation preparation
- Share market insights on pricing and demand

---

## 🎯 BTO PROPERTIES

### **Questions to Ask:**
1. **Application Stage**
   - Have you applied for BTO? Which project?
   - Current status: Applied/Balloted/Selected/Collecting Keys?
   - Expected key collection timeline?

2. **Financing Preferences**
   - Considering HDB loan vs bank loan?
   - Current CPF savings available?
   - Applied for housing grants?

3. **Personal Status**
   - First-time buyer or second-timer?
   - Single or joint application?
   - Any income changes since application?

4. **Additional Needs**
   - Planning renovation loan?
   - Need advice on timeline coordination?
   - Concerns about income assessment?

### **AI Broker Value-Add:**
- Compare HDB loan vs bank loan pros/cons
- Guide on CPF usage optimization
- Help with income assessment preparation
- Coordinate financing timeline with key collection

---

## 🏠 RESALE PROPERTIES
*(Already handled well in current form - no additional topics needed)*

---

## 🏢 COMMERCIAL PROPERTIES

### **Questions to Ask:**
1. **Property Type**
   - Shop house, office, industrial, retail?
   - Investment or own-use?
   - Leasing plans?

2. **Financing Needs**
   - What's your business structure?
   - Personal guarantee vs corporate borrowing?
   - Cash flow considerations?

### **AI Broker Value-Add:**
- Commercial lending specialist guidance
- Tax implications advice
- Cash flow analysis

---

## 💡 INTEGRATION NOTES

### **For Developers:**
- These topics are stored as `TODO: AI BROKER` comments in the code
- Location: `components/forms/ProgressiveForm.tsx` in `renderNewLaunchFields()` and `renderBtoFields()`
- The AI broker system should reference these topics when the user's property category is detected

### **Implementation:**
- Form captures: Property Category → AI Broker reads this file
- AI Broker starts conversation with category-specific topics
- Maintains context throughout consultation
- Can reference form data (price, age, etc.) for personalized advice

---

## 🔄 UPDATES

### **When to Update This File:**
- New property categories added
- Market changes require new questions
- User feedback suggests missing topics
- New financing products launched

### **Change Log:**
- **2025-09-04**: Initial creation with New Launch and BTO topics