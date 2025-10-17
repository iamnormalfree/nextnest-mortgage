# NextNest Lead Generation Calculator - Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the NextNest mortgage calculator as a lead generation web app that integrates with our n8n automation workflow.

## Critical Integration Points

### 1. Calculator Frontend → n8n Webhook
**PRIMARY REQUIREMENT**: The calculator must POST data to the n8n webhook with exact field naming.

#### Required Field Mappings
```javascript
// CRITICAL: Use these exact field names for n8n integration
const webhookPayload = {
  // Primary fields (REQUIRED)
  loanQuantum: Number,        // NOT loanAmount - must be loanQuantum
  propertyValue: Number,       // Property value in SGD
  propertyType: String,        // Must be: 'HDB', 'Private', or 'Commercial' (case-sensitive)
  timeline: String,            // Must be: 'immediate', 'soon', 'planning', or 'exploring'
  
  // Contact fields (REQUIRED)
  name: String,               // Full name
  email: String,              // Valid email format
  phone: String,              // Singapore format (+65 or 65 prefix)
  
  // Financial fields (OPTIONAL but recommended)
  currentBank: String,        // Current bank name
  monthlyIncome: Number,      // Gross monthly income
  existingDebt: Number,       // Total monthly debt obligations
  interestRate: Number,       // Current interest rate (percentage)
  loanTenure: Number,         // Loan period in years
  
  // Attribution fields (AUTOMATIC)
  source: String,             // Set based on calculator variant
  campaign: String,           // Campaign identifier
  timestamp: String,          // ISO 8601 format
  
  // Calculation results (INCLUDE ALL)
  calculationResults: {
    monthlyPayment: Number,
    totalInterest: Number,
    ltvRatio: Number,
    tdsr: Number,
    msr: Number,
    potentialSavings: Number,
    refinancingCostBenefit: Number,
    breakEvenPeriod: Number
  }
}
```

### 2. Implementation Priorities

#### Phase 1: Core Calculator (Week 1)
1. **Use `singapore-mortgage-calculator.tsx` as primary template**
   - Most complete implementation
   - Includes all required fields
   - Has proper validation and error handling

2. **Critical Fixes Required**:
   ```javascript
   // Fix 1: Update webhook URL (line 157)
   const response = await fetch('https://your-n8n-instance.com/webhook/nextnest-leads', {
   // Change to actual n8n webhook URL provided by backend team
   
   // Fix 2: Ensure field mapping consistency
   loanQuantum: data.loanAmount,  // Map frontend field to n8n expected field
   
   // Fix 3: Add missing fields from form
   interestRate: data.interestRate,
   loanTenure: data.loanTenure,
   ```

3. **Calculation Accuracy**:
   - Use the updated calculation logic from `n8n-calculation-logic-fixed.js`
   - Apply MAS stress test rates: 4% for residential, 5% for commercial
   - TDSR limit is 55% (not 60%)
   - MSR applies only to HDB (30% limit)

#### Phase 2: Campaign Variants (Week 2)
Each campaign calculator needs specific source attribution:

```javascript
// Reddit Campaign Calculator
source: 'reddit_calculator',
campaign: 'reddit_personalfinancesg',

// LinkedIn Campaign Calculator  
source: 'linkedin_calculator',
campaign: 'linkedin_business_owners',

// HardwareZone Campaign Calculator
source: 'hardwarezone_calculator', 
campaign: 'hardwarezone_property_forum',
```

### 3. Technical Requirements

#### API Endpoints
```javascript
// Production n8n webhook
POST https://[n8n-instance]/webhook/nextnest-leads

// Development/Testing
POST https://[n8n-instance]/webhook-test/nextnest-leads

// Response handling
200 OK - Lead captured successfully
400 Bad Request - Validation error
500 Internal Error - System error (implement retry)
```

#### CORS Configuration
```javascript
// Required headers for cross-origin requests
headers: {
  'Content-Type': 'application/json',
  'Origin': 'https://nextnest.sg'  // Production domain
}

// n8n will respond with:
'Access-Control-Allow-Origin': 'https://nextnest.sg'
'Access-Control-Allow-Methods': 'POST, OPTIONS'
```

### 4. Data Validation Rules

#### Frontend Validation (Before Submission)
```javascript
// Property value constraints
propertyValue: {
  HDB: min 100000, max 1500000,
  Private: min 200000, max 10000000,
  Commercial: min 300000, max 50000000
}

// LTV constraints
ltvRatio: {
  HDB: max 80%,
  Private: max 75%,
  Commercial: max 70%
}

// Phone validation (Singapore)
phonePattern: /^(\+65)?[689]\d{7}$/

// Email validation
emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

#### Backend Processing (n8n)
The n8n workflow will:
1. Calculate lead score (0-10)
2. Route to appropriate CRM (HubSpot for commercial/high-value, Airtable for residential)
3. Send confirmation email
4. Trigger Telegram alerts for high-value leads (score >= 8)

### 5. UI/UX Requirements

#### Mobile Responsiveness
- Calculator must work on mobile devices (>50% of traffic)
- Use responsive grid layouts
- Test on iPhone 12+ and Samsung Galaxy S21+

#### Loading States
```javascript
// Show calculating state
{isCalculating && (
  <div className="loading-spinner">
    Analyzing 286 bank packages...
  </div>
)}
```

#### Error Handling
```javascript
// Network error fallback
catch (error) {
  console.error('Webhook submission error:', error);
  // Show manual contact option
  showManualContactModal();
  // Store data locally for retry
  localStorage.setItem('pendingLead', JSON.stringify(webhookData));
}
```

### 6. Testing Checklist

#### Before Deployment
- [ ] All required fields present in webhook payload
- [ ] Field names match exactly (loanQuantum not loanAmount)
- [ ] Property types are correctly capitalized
- [ ] Timeline values match enum options
- [ ] Calculations match n8n logic
- [ ] CORS headers configured
- [ ] Error states handled gracefully
- [ ] Mobile responsive design verified
- [ ] Form validation working
- [ ] Success/failure messages display correctly

#### Integration Testing
```javascript
// Test payload (use in Postman or similar)
{
  "loanQuantum": 640000,
  "propertyValue": 800000,
  "propertyType": "Private",
  "timeline": "immediate",
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+6591234567",
  "monthlyIncome": 12000,
  "existingDebt": 500,
  "currentBank": "DBS",
  "interestRate": 3.5,
  "loanTenure": 25,
  "source": "website_calculator",
  "campaign": "general",
  "timestamp": "2025-08-27T12:00:00.000Z",
  "calculationResults": {
    "monthlyPayment": 3200,
    "totalInterest": 320000,
    "ltvRatio": 80,
    "tdsr": 30,
    "msr": 26.7,
    "potentialSavings": 150,
    "refinancingCostBenefit": 45000,
    "breakEvenPeriod": 12
  }
}
```

### 7. Deployment Steps

#### Week 1 Deliverables
1. Main calculator page (`/calculator`)
2. Thank you/confirmation page (`/calculator/thank-you`)
3. Webhook integration with n8n
4. Basic analytics tracking

#### Week 2 Deliverables
1. Campaign-specific calculators
   - `/calculator/reddit`
   - `/calculator/linkedin`
   - `/calculator/hardwarezone`
2. A/B testing framework
3. Performance optimizations

### 8. Performance Metrics

Track these KPIs from day 1:
- Form completion rate
- Calculation-to-lead conversion
- Average time to complete
- Error rate
- Mobile vs desktop usage
- Campaign source performance

### 9. Security Considerations

1. **Never expose sensitive calculations**
   - Keep proprietary logic server-side
   - Frontend shows estimates only

2. **Rate limiting**
   - Implement reCAPTCHA for production
   - Limit submissions per IP

3. **Data sanitization**
   - Sanitize all inputs before webhook submission
   - Validate data types and ranges

### 10. Support & Escalation

#### Common Issues & Solutions

**Issue**: Webhook returns 400 error
**Solution**: Check field names match exactly, validate required fields present

**Issue**: Calculations don't match n8n
**Solution**: Use the exact formulas from `n8n-calculation-logic-fixed.js`

**Issue**: CORS errors
**Solution**: Ensure n8n webhook configured with correct origin headers

#### Contacts
- n8n Backend: [Backend team contact]
- UI/UX Review: [Design team contact]
- Business Logic: [Product owner contact]

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval)
npm run deploy:production
```

## File Structure
```
/components
  /calculator
    - MortgageCalculator.tsx      # Main calculator component
    - CalculatorForm.tsx           # Form inputs
    - CalculationResults.tsx       # Results display
    - LeadCaptureForm.tsx         # Contact details form
    - CampaignVariants/           # Campaign-specific versions
      - RedditCalculator.tsx
      - LinkedInCalculator.tsx
      - HardwareZoneCalculator.tsx
    
/lib
  - calculations.ts               # Calculation logic
  - validations.ts               # Form validation
  - webhookClient.ts             # n8n integration
  
/pages
  - calculator.tsx               # Main calculator page
  - calculator/[campaign].tsx    # Dynamic campaign pages
```

## Notes for Junior Developer

1. **Start with the main calculator** - Get this working perfectly before variants
2. **Test webhook integration early** - Don't wait until the end
3. **Use TypeScript** - Already set up in the `.tsx` files
4. **Keep calculations consistent** - Always reference `n8n-calculation-logic-fixed.js`
5. **Document any deviations** - If you need to change something, document why

## Acceptance Criteria

- [ ] Calculator accurately processes all property types
- [ ] Webhook successfully sends data to n8n
- [ ] Lead scoring matches n8n logic
- [ ] Mobile responsive design implemented
- [ ] Error handling covers all edge cases
- [ ] Campaign attribution working correctly
- [ ] Confirmation emails triggered
- [ ] High-value lead alerts sent
- [ ] All test cases passing
- [ ] Documentation complete

---

**IMPORTANT**: This calculator is the primary lead generation tool. Quality and accuracy are critical. Test thoroughly before deployment.