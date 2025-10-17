# NextNest Campaign-Specific Calculator Implementation Guide

## 📦 Complete Campaign Package Ready

### **Files Created:**

1. **`n8n-calculation-logic-fixed.js`** - Fixed calculation logic with helper functions
2. **`singapore-mortgage-calculator.tsx`** - Updated main calculator with correct webhook submission
3. **`reddit-campaign-calculator.tsx`** - Reddit r/PersonalFinanceSG optimized version
4. **`linkedin-campaign-calculator.tsx`** - LinkedIn B2B commercial version  
5. **`hardwarezone-campaign-calculator.tsx`** - HardwareZone technical version

## 🎯 **Campaign-Specific Optimizations**

### **Reddit Campaign (`/campaigns/reddit/`)**
**Target Audience:** r/PersonalFinanceSG community members
**Positioning:** "Your Personal Mortgage Brain" - sophisticated analysis that thinks like you
**Attribution:** `source: 'reddit_campaign'`, `campaign: 'reddit_mathematical'`

**Key Features:**
- Community credibility badges
- Mathematical language that sounds sophisticated but accessible
- Quick scenarios: "HDB → Private", "Young Professional", "Investment Property"
- Reddit-friendly success metrics and social proof

### **LinkedIn Campaign (`/campaigns/linkedin/`)**
**Target Audience:** Singapore business owners, HNW individuals  
**Positioning:** "Your Personal Mortgage Brain" for sophisticated portfolio decisions
**Attribution:** `source: 'linkedin_campaign'`, `campaign: 'linkedin_b2b_commercial'`

**Key Features:**
- Executive language and premium positioning
- Commercial property focus with higher loan amounts
- Business owner scenarios: Commercial, Luxury Residential, Investment Portfolio
- Professional trust signals and executive service promises

### **HardwareZone Campaign (`/campaigns/hwz/`)**
**Target Audience:** Tech-savvy property investors
**Positioning:** "Personal Mortgage Intelligence System" with advanced technical analysis
**Attribution:** `source: 'hardwarezone_campaign'`, `campaign: 'hwz_technical_analysis'`

**Key Features:**
- Technical jargon and mathematical precision
- Monospace fonts for numbers, advanced parameters
- Monte Carlo simulation mentions, API integration ready
- Technical scenarios with precise calculations and engineering mindset

## 🔧 **n8n Integration Fixed**

### **Corrected Calculation Logic:**
```javascript
// Fixed field mapping
const loan = Number($json.loanQuantum || $json.loanAmount || 0);
const value = Number($json.propertyValue || 0);
const ltv = value > 0 ? (loan / value) * 100 : 0;  // Percentage conversion fixed

// Enhanced lead scoring
let score = 0;
if (loan >= 1500000) score += 3; 
else if (loan >= 1000000) score += 2; 
else if (loan >= 750000) score += 1;

// Fixed timeline scoring
switch($json.timeline) {
  case 'immediate': score += 3; break;  // Fixed from +1 to +3
  case 'soon': score += 2; break;
  case 'planning': score += 1; break;
  default: score += 0;
}

// Enhanced savings calculation with helper function
function calculateMonthlyPayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}
```

### **Updated Webhook Payload:**
```javascript
const webhookData = {
  loanQuantum: data.loanAmount,  // Fixed field name mapping
  propertyValue: data.propertyValue,
  currentBank: data.currentBank,
  propertyType: data.propertyType,
  timeline: data.timeline,
  monthlyIncome: data.monthlyIncome,
  existingDebt: data.existingDebt,
  
  name: data.name,
  email: data.email,
  phone: data.phone,
  
  // Campaign-specific attribution
  source: 'reddit_campaign',      // Changes per campaign
  campaign: 'reddit_mathematical', // Changes per campaign
  referrer: 'r_PersonalFinanceSG', // Changes per campaign
  timestamp: new Date().toISOString(),
  
  clientCalculations: results
};
```

## 📁 **NextNest Folder Structure Implementation**

### **Recommended File Placement:**

```
NextNest/
├── app/
│   ├── calculator/                    # General calculator route
│   │   └── page.tsx                  # singapore-mortgage-calculator.tsx
│   ├── campaigns/                    # Campaign-specific routes
│   │   ├── reddit/
│   │   │   └── page.tsx              # reddit-campaign-calculator.tsx
│   │   ├── linkedin/
│   │   │   └── page.tsx              # linkedin-campaign-calculator.tsx
│   │   └── hwz/
│   │       └── page.tsx              # hardwarezone-campaign-calculator.tsx
│   ├── dashboard/                    # Keep existing dashboard
│   │   └── page.tsx                  # Preserve original
│   └── api/
│       └── webhook/
│           └── route.ts              # Optional: proxy to n8n
```

### **Implementation Steps:**

1. **Copy Files to NextNest:**
```bash
# Navigate to NextNest project
cd /path/to/NextNest

# Create campaign directories
mkdir -p app/campaigns/reddit
mkdir -p app/campaigns/linkedin  
mkdir -p app/campaigns/hwz
mkdir -p app/calculator

# Copy campaign calculators
cp singapore-mortgage-calculator.tsx app/calculator/page.tsx
cp reddit-campaign-calculator.tsx app/campaigns/reddit/page.tsx
cp linkedin-campaign-calculator.tsx app/campaigns/linkedin/page.tsx
cp hardwarezone-campaign-calculator.tsx app/campaigns/hwz/page.tsx
```

2. **Update Environment Variables:**
```bash
# Add to .env.local
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/nextnest-leads
```

3. **Configure n8n Webhook:**
   - Use the fixed calculation logic from `n8n-calculation-logic-fixed.js`
   - Update your n8n workflow Node 3 with the corrected JavaScript code
   - Test with sample payloads from each campaign

## 🎨 **Brand Consistency Maintained**

All campaign versions use **NextNest's correct brand colors:**
- **NextNest Gold**: `#FFB800` (primary CTAs, highlights)
- **Precision Grey Dark**: `#1C1C1E` (primary text)
- **Precision Grey Medium**: `#8E8E93` (secondary text)
- **Success Green**: `#059669` (positive metrics)
- **Authority Purple**: `#6B46C1` (premium features)
- **Trust Blue**: `#0F4C75` (security indicators)

## 📊 **Campaign Attribution & Analytics**

### **Attribution Mapping:**
```javascript
// Reddit Campaign
source: 'reddit_campaign'
campaign: 'reddit_mathematical'
referrer: 'r_PersonalFinanceSG'

// LinkedIn Campaign  
source: 'linkedin_campaign'
campaign: 'linkedin_b2b_commercial'
referrer: 'linkedin_business_network'

// HardwareZone Campaign
source: 'hardwarezone_campaign'
campaign: 'hwz_technical_analysis'
referrer: 'hardwarezone_property_forum'
```

### **URL Structure:**
```
https://nextnest.sg/campaigns/reddit/?utm_source=reddit&utm_medium=organic&utm_campaign=mathematical
https://nextnest.sg/campaigns/linkedin/?utm_source=linkedin&utm_medium=social&utm_campaign=b2b_commercial  
https://nextnest.sg/campaigns/hwz/?utm_source=hardwarezone&utm_medium=forum&utm_campaign=technical
```

## 🚀 **Deployment Priority**

### **Phase 1 (Week 1): Reddit Campaign**
1. Deploy Reddit calculator to `/campaigns/reddit/`
2. Test n8n webhook with reddit attribution  
3. Launch guerilla marketing campaign on r/PersonalFinanceSG
4. Monitor conversion rates and community reception

### **Phase 2 (Week 2): LinkedIn B2B**
1. Deploy LinkedIn calculator to `/campaigns/linkedin/`
2. Configure HubSpot integration for high-value leads
3. Launch LinkedIn outreach with commercial property focus
4. Track B2B lead quality and follow-up effectiveness

### **Phase 3 (Week 3): HardwareZone Technical**
1. Deploy HardwareZone calculator to `/campaigns/hwz/`
2. Test technical features and advanced parameters
3. Launch technical content marketing on HWZ property forum
4. Measure engagement with technically-minded audience

### **Phase 4 (Week 4): Analytics & Optimization**
1. Compare conversion rates across all campaigns
2. A/B test different value propositions  
3. Optimize based on attribution data from n8n
4. Scale winning approaches and pause underperforming campaigns

## ⚡ **Quick Implementation Commands**

### **For immediate deployment:**
```bash
# 1. Copy main calculator (homepage)
cp singapore-mortgage-calculator.tsx /path/to/NextNest/app/calculator/page.tsx

# 2. Copy campaign calculators
cp reddit-campaign-calculator.tsx /path/to/NextNest/app/campaigns/reddit/page.tsx
cp linkedin-campaign-calculator.tsx /path/to/NextNest/app/campaigns/linkedin/page.tsx
cp hardwarezone-campaign-calculator.tsx /path/to/NextNest/app/campaigns/hwz/page.tsx

# 3. Update n8n workflow
# Copy the code from n8n-calculation-logic-fixed.js into your n8n Node 3

# 4. Test deployment
cd /path/to/NextNest
npm run dev
```

### **Test URLs:**
- General: `http://localhost:3000/calculator`
- Reddit: `http://localhost:3000/campaigns/reddit`
- LinkedIn: `http://localhost:3000/campaigns/linkedin`  
- HardwareZone: `http://localhost:3000/campaigns/hwz`

## 🎯 **Success Metrics by Campaign**

### **Reddit Campaign KPIs:**
- Calculator completions per day: 10+ (community-driven)
- Lead conversion rate: 15%+ (trust-based)
- Community sentiment: Positive mentions and upvotes
- Attribution: High organic discovery rate

### **LinkedIn B2B KPIs:**
- Calculator completions per day: 5+ (high-value leads)
- Lead conversion rate: 25%+ (targeted audience)
- Average loan amount: $800K+ (commercial focus)
- Attribution: Direct LinkedIn referral traffic

### **HardwareZone KPIs:**
- Calculator completions per day: 8+ (technical audience)
- Lead conversion rate: 20%+ (engaged users)
- Advanced feature usage: 40%+ (technical sophistication)
- Attribution: Forum thread referrals

---

## 📋 **Implementation Checklist**

- [ ] Copy all 4 calculator files to NextNest project
- [ ] Create campaign directory structure
- [ ] Update n8n calculation logic with fixed code
- [ ] Configure environment variables
- [ ] Test webhook submissions for all campaigns
- [ ] Verify brand colors and styling consistency
- [ ] Set up campaign-specific analytics tracking
- [ ] Deploy to staging environment for testing
- [ ] Conduct end-to-end testing for each campaign flow
- [ ] Deploy to production with proper attribution
- [ ] Launch guerilla marketing campaigns with attribution links
- [ ] Monitor conversion rates and optimize based on data

**All campaigns are now ready for seamless deployment to NextNest with proper attribution tracking and n8n integration!**