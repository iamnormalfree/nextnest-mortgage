---
title: unified-implementation-v2-v3
type: report
status: analysis
owner: forms
date: 2025-08-28
---

# Unified Implementation: v2 Forms + v3 AI Agents
## Complete Technical Architecture Respecting NextNest Tech Stack

### Architecture Overview
**v2 Forms**: Frontend differentiated capture system (Next.js/React)
**v3 AI**: Backend intelligence layer (n8n + AI APIs)
**Integration**: Minimal dependencies, maximum impact

---

## Part 1: v2 Form Implementation (Frontend)

### Required Dependencies & Alternatives

#### 1. Enhanced Form Validation
**Recommended**: `zod` (12KB) - Already in your stack ✅
```bash
# Already installed
npm install zod
```

**Alternative (No Dependency)**:
```typescript
// DIY validation if avoiding zod
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePhone = (phone: string) => /^[689]\d{7}$/.test(phone) // Singapore format
const validateRequired = (value: any) => value !== undefined && value !== ''
```

#### 2. Progressive Form State Management
**Recommended**: Keep `react-hook-form` (already installed) ✅

**Alternative (No Dependency)**:
```typescript
// Native React state with localStorage
const useFormPersistence = (key: string) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(key) || '{}')
    }
    return {}
  })
  
  const updateData = (newData: any) => {
    setData(newData)
    localStorage.setItem(key, JSON.stringify(newData))
  }
  
  return [data, updateData]
}
```

#### 3. Real-time Calculations
**Recommended**: No new dependencies needed ✅
```typescript
// Use existing React hooks + extracted calculation logic
// Already have this in lib/calculations/mortgage.ts
```

### v2 Form Component Structure
```typescript
// app/components/forms/LightningCaptureV2.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { calculateMonthlyPayment } from '@/lib/calculations/mortgage'

// Dynamic schema based on loan type
const createLoanSchema = (loanType: string) => {
  const baseSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^[689]\d{7}$/, 'Invalid Singapore number')
  })

  if (loanType === 'new_purchase') {
    return baseSchema.extend({
      purchaseTimeline: z.enum(['this_month', 'next_3_months', '3_6_months', 'exploring']),
      propertyType: z.enum(['HDB', 'EC', 'Private', 'Landed']),
      priceRange: z.number().min(300000).max(5000000),
      ipaStatus: z.enum(['have_ipa', 'applied', 'starting', 'what_is_ipa']),
      firstTimeBuyer: z.boolean()
    })
  } else if (loanType === 'refinance') {
    return baseSchema.extend({
      currentRate: z.number().min(0).max(10),
      lockInStatus: z.enum(['ending_soon', 'no_lock', 'locked', 'not_sure']),
      currentBank: z.string(),
      propertyValue: z.number().min(300000).max(10000000),
      outstandingLoan: z.number()
    })
  }
  
  return baseSchema
}

export function LightningCaptureV2() {
  const [loanType, setLoanType] = useState<string>('')
  const [aiInsights, setAiInsights] = useState<any>({})
  
  const form = useForm({
    resolver: zodResolver(createLoanSchema(loanType))
  })

  // Real-time field analysis via webhook to n8n
  const analyzeField = async (fieldName: string, value: any) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          value,
          loanType,
          formContext: form.getValues()
        })
      })
      
      const insight = await response.json()
      setAiInsights(prev => ({ ...prev, [fieldName]: insight }))
    } catch (error) {
      console.error('AI analysis failed:', error)
    }
  }

  // Progressive form persistence
  useEffect(() => {
    const savedData = localStorage.getItem('leadFormProgress')
    if (savedData) {
      form.reset(JSON.parse(savedData))
    }
  }, [])

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('leadFormProgress', JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    // Form JSX implementation
    <div>
      {/* Loan type selection */}
      {/* Dynamic fields based on loan type */}
      {/* Real-time AI insights display */}
    </div>
  )
}
```

---

## Part 2: Integration Layer (API Routes)

### No Additional Dependencies Needed ✅

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  // Option 1: Direct to n8n webhook (Recommended)
  const n8nWebhook = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/lightning-analysis'
  
  try {
    const n8nResponse = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const insight = await n8nResponse.json()
    return NextResponse.json(insight)
  } catch (error) {
    // Fallback to basic analysis if n8n unavailable
    return NextResponse.json({
      insight: getBasicInsight(data.fieldName, data.value),
      calculation: getBasicCalculation(data)
    })
  }
}

// Fallback functions for when AI is unavailable
function getBasicInsight(field: string, value: any) {
  const insights: Record<string, any> = {
    priceRange: `Properties in this range: ${value < 1000000 ? 'HDB/EC' : 'Private'}`,
    currentRate: `Rate comparison: ${value > 3.5 ? 'Above market' : 'Competitive'}`,
    purchaseTimeline: value === 'this_month' ? 'Urgent - priority processing' : 'Standard timeline'
  }
  return insights[field] || 'Analyzing...'
}

function getBasicCalculation(data: any) {
  if (data.priceRange) {
    const monthlyPayment = calculateMonthlyPayment({
      loanAmount: data.priceRange * 0.75, // 75% LTV
      interestRate: 3.5,
      tenureYears: 30
    })
    return { monthlyPayment }
  }
  return null
}
```

---

## Part 3: n8n Workflow Configuration

### n8n Setup (Self-Hosted)

#### Option 1: Docker (Recommended for Production)
```bash
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-password
    volumes:
      - ./n8n_data:/home/node/.n8n
```

#### Option 2: NPM (Development)
```bash
npm install -g n8n
n8n start
```

### n8n Workflow JSON Export
```json
{
  "name": "Lightning Analysis Workflow",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "lightning-analysis",
      "parameters": {
        "path": "lightning-analysis",
        "responseMode": "responseNode",
        "responseData": "allEntries"
      }
    },
    {
      "name": "OpenAI Analysis",
      "type": "n8n-nodes-base.openAi",
      "position": [450, 300],
      "parameters": {
        "operation": "completion",
        "model": "gpt-3.5-turbo",
        "prompt": "Analyze this mortgage data: {{$json.fieldName}}: {{$json.value}}. Context: {{$json.formContext}}. Generate insight that impresses but doesn't reveal specific banks or rates.",
        "maxTokens": 100,
        "temperature": 0.7
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "position": [650, 300],
      "parameters": {
        "functionCode": "return [{\n  json: {\n    insight: $input.first().json.choices[0].text,\n    calculation: calculateRelevantMetrics($input.first().json),\n    teaser: 'Complete your profile to see more...'\n  }\n}];"
      }
    },
    {
      "name": "Webhook Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [850, 300],
      "parameters": {
        "responseData": "={{$json}}"
      }
    }
  ]
}
```

---

## Part 4: AI Provider Options & Alternatives

### Primary: OpenAI API
**Cost**: ~$0.002 per analysis
```typescript
// If using directly without n8n
const openaiApiKey = process.env.OPENAI_API_KEY

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 100
  })
})
```

### Alternative 1: Anthropic Claude
**Cost**: ~$0.003 per analysis
```typescript
const claudeApiKey = process.env.ANTHROPIC_API_KEY

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': claudeApiKey,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100
  })
})
```

### Alternative 2: Local LLM (No API Costs)
**Using Ollama for complete privacy**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Run API server
ollama serve
```

```typescript
// Use local LLM
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama2',
    prompt: prompt,
    stream: false
  })
})
```

### Alternative 3: No AI Fallback
```typescript
// Pure algorithmic insights without AI
function generateInsightWithoutAI(field: string, value: any, context: any): string {
  const insights = {
    priceRange: {
      low: 'Exploring entry-level properties with strong appreciation potential',
      mid: 'Target market sweet spot with maximum financing options',
      high: 'Premium segment with exclusive broker negotiations available'
    },
    currentRate: {
      high: `Your ${value}% rate is above current market rates of 2.8-3.5%`,
      average: 'Your rate is competitive but optimization possible',
      low: 'Excellent rate - timing considerations for refinancing'
    },
    purchaseTimeline: {
      urgent: 'Priority processing recommended - market inventory is tight',
      moderate: 'Good timing - adequate preparation window for best rates',
      exploring: 'Perfect time to understand your options without pressure'
    }
  }
  
  // Smart selection based on value ranges
  return selectInsight(insights, field, value)
}
```

---

## Part 5: PDF Generation Options

### Option 1: React PDF (Client-Side)
**Dependency**: `@react-pdf/renderer` (200KB)
```bash
npm install @react-pdf/renderer
```

```typescript
import { Document, Page, Text, View, PDFDownloadLink } from '@react-pdf/renderer'

const MyDocument = ({ data }) => (
  <Document>
    <Page size="A4">
      <View>
        <Text>Personalized Mortgage Analysis for {data.name}</Text>
        {/* PDF content */}
      </View>
    </Page>
  </Document>
)

// In component
<PDFDownloadLink document={<MyDocument data={formData} />} fileName="analysis.pdf">
  {({ loading }) => loading ? 'Generating...' : 'Download PDF'}
</PDFDownloadLink>
```

### Option 2: Server-Side with Puppeteer
**Dependency**: `puppeteer` (Heavy - 170MB)
```bash
npm install puppeteer
```

**Alternative: Use n8n's PDF node instead** ✅

### Option 3: HTML to PDF (Recommended - Lightweight)
**Dependency**: `jspdf` (300KB) + `html2canvas` (150KB)
```bash
npm install jspdf html2canvas
```

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const generatePDF = async () => {
  const element = document.getElementById('pdf-content')
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF()
  pdf.addImage(imgData, 'PNG', 0, 0)
  pdf.save('analysis.pdf')
}
```

### Option 4: No Dependency - HTML Print Styles
```css
/* app/styles/print.css */
@media print {
  .no-print { display: none; }
  .page-break { page-break-after: always; }
  
  @page {
    size: A4;
    margin: 20mm;
  }
}
```

```typescript
// Generate PDF via browser print
const printPDF = () => {
  window.print()
}
```

---

## Part 6: Complete Implementation Timeline

### Week 1: Form Implementation
```bash
# Day 1-2: v2 Forms
- Implement loan type router component
- Create differentiated capture forms
- Add Zod validation schemas

# Day 3-4: State Management  
- Progressive form persistence (localStorage)
- Real-time calculation hooks
- API route integration

# Day 5: Testing
- Form validation testing
- Cross-browser testing
- Mobile responsiveness
```

### Week 2: n8n + AI Integration
```bash
# Day 1-2: n8n Setup
- Deploy n8n (Docker/local)
- Create Lightning Analysis workflow
- Test webhook connections

# Day 3-4: AI Configuration
- Set up OpenAI/Claude API
- Configure prompts for tollbooth strategy
- Implement fallback logic

# Day 5: PDF Generation
- Choose PDF approach (html2canvas recommended)
- Create PDF templates
- Test generation pipeline
```

### Week 3: Full System Integration
```bash
# Day 1-2: End-to-end Testing
- Complete user journey testing
- Performance optimization
- Error handling

# Day 3-4: Nurture Workflows
- Email automation via n8n
- Behavioral tracking setup
- A/B testing framework

# Day 5: Launch Preparation
- Production deployment
- Monitoring setup
- Documentation
```

---

## Part 7: Environment Variables

```env
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Production
DATABASE_URL=postgresql://...
EMAIL_SERVICE_API=...
ANALYTICS_ID=...
```

---

## Part 8: Monitoring & Analytics

### Option 1: Vercel Analytics (If hosting on Vercel)
```bash
npm install @vercel/analytics
```

### Option 2: Self-Hosted (Plausible/Umami)
```bash
# No dependency - script tag only
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

### Option 3: Custom Tracking (No Dependencies)
```typescript
// lib/analytics.ts
export const trackEvent = (event: string, properties?: any) => {
  if (typeof window !== 'undefined') {
    // Send to your backend
    fetch('/api/track', {
      method: 'POST',
      body: JSON.stringify({ event, properties })
    })
    
    // Or to Google Analytics if installed
    if (window.gtag) {
      window.gtag('event', event, properties)
    }
  }
}
```

---

## Cost Analysis

### With AI (OpenAI/Claude)
- ~$0.002-0.003 per form analysis
- ~$0.01 per PDF generation
- Total: ~$0.15-0.30 per qualified lead

### Without AI (Fallback Mode)
- $0 for basic algorithmic insights
- Limited personalization
- Still functional tollbooth strategy

### Recommended Approach
1. Start with algorithmic fallbacks (free)
2. Add AI for high-value leads only (leadScore > 70)
3. Scale AI usage as revenue grows

---

## Security Considerations

### Form Security
```typescript
// Implement rate limiting
const rateLimit = new Map()

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const attempts = rateLimit.get(ip) || 0
  
  if (attempts > 10) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  
  rateLimit.set(ip, attempts + 1)
  // Clear after 1 minute
  setTimeout(() => rateLimit.delete(ip), 60000)
  
  // Process request...
}
```

### Data Protection
- Never send PII to AI APIs
- Encrypt sensitive data in localStorage
- Use HTTPS in production
- Implement CSRF protection

---

## Summary

This unified implementation:
1. **Respects your tech stack** - Minimal new dependencies
2. **v2 Forms** - Built with existing Next.js/React/Zod
3. **v3 AI** - Integrated via n8n (self-hosted) + API calls
4. **Fallbacks everywhere** - Works without AI if needed
5. **Progressive enhancement** - Basic → Enhanced → AI-Powered
6. **Cost-effective** - Start free, add AI as you scale

The system maintains the tollbooth revenue strategy while appearing as "Singapore's smartest mortgage intelligence system" to users.