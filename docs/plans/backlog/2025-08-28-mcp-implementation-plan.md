---
title: mcp-implementation-plan
status: backlog
owner: platform
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Feed this backlog item into `/response-awareness` before implementation.

# MCP Mortgage Brain Implementation Plan
## Technical Specification & Development Guide

### **PROJECT**: Multi-Domain Mortgage Intelligence Platform
### **PRIMARY DOMAIN**: refinancing.com.sg
### **BUDGET**: $35/month
### **TIMELINE**: 4 weeks to full deployment

---

## **WEEK 1: MCP SERVER DEVELOPMENT**

### **Day 1-2: Project Setup**

```bash
# Initialize MCP server project
mkdir mcp-mortgage-brain
cd mcp-mortgage-brain
npm init -y
npm install @modelcontextprotocol/sdk zod dotenv

# Project structure
mcp-mortgage-brain/
├── src/
│   ├── server.ts           # Main MCP server
│   ├── tools/
│   │   ├── analyze.ts      # Mortgage analysis tool
│   │   ├── calculate.ts    # Calculation tool
│   │   ├── score.ts        # Lead scoring tool
│   │   └── compare.ts      # Bank comparison tool
│   ├── resources/
│   │   ├── rates.json      # Current bank rates
│   │   ├── schemes.json    # Gov schemes & grants
│   │   └── banks.json      # Bank profiles
│   ├── personalities/
│   │   ├── refinancing.ts  # Refinancing expert
│   │   ├── rates.ts        # Rate tracker
│   │   ├── compare.ts      # Comparison engine
│   │   └── homeloans.ts    # First-timer guide
│   └── core/
│       ├── tollbooth.ts    # Value gating logic
│       ├── psychology.ts   # Dr. Elena's triggers
│       └── calculations.ts # Mortgage math
├── package.json
└── mcp.json                # MCP configuration
```

### **Day 2: MCP Server Configuration**

```json
// mcp.json
{
  "name": "mortgage-brain",
  "version": "1.0.0",
  "description": "Singapore's Personal Mortgage Brain",
  "author": "NextNest",
  "tools": [
    {
      "name": "analyze_profile",
      "description": "Analyze mortgage profile with psychological insights",
      "inputSchema": {
        "type": "object",
        "properties": {
          "formData": { "type": "object" },
          "domain": { "type": "string" },
          "gate": { "type": "number" }
        }
      }
    },
    {
      "name": "calculate_savings",
      "description": "Calculate potential savings without revealing exact amounts",
      "inputSchema": {
        "type": "object",
        "properties": {
          "currentRate": { "type": "number" },
          "outstandingLoan": { "type": "number" },
          "remainingTenure": { "type": "number" }
        }
      }
    },
    {
      "name": "match_banks",
      "description": "Match profile to banks without naming them",
      "inputSchema": {
        "type": "object",
        "properties": {
          "profile": { "type": "object" },
          "preferences": { "type": "array" }
        }
      }
    }
  ],
  "resources": [
    {
      "uri": "rates://current",
      "name": "Current Bank Rates",
      "mimeType": "application/json"
    },
    {
      "uri": "schemes://singapore",
      "name": "Singapore Mortgage Schemes",
      "mimeType": "application/json"
    }
  ],
  "prompts": [
    {
      "name": "refinancing_expert",
      "description": "Expert in refinancing optimization"
    },
    {
      "name": "rate_tracker",
      "description": "Real-time rate monitoring"
    }
  ]
}
```

### **Day 3: Core Tools Implementation**

```typescript
// src/tools/analyze.ts
import { z } from 'zod'
import { getTollboothLevel, applyPsychTriggers } from '../core'

const analyzeSchema = z.object({
  formData: z.record(z.any()),
  domain: z.string(),
  gate: z.number()
})

export async function analyzeProfile(params: unknown) {
  const { formData, domain, gate } = analyzeSchema.parse(params)
  
  // Never mention Dr. Elena, always "Personal Mortgage Brain"
  const personality = getPersonality(domain)
  
  // Gate-based progressive disclosure
  const disclosureLevel = getTollboothLevel(gate)
  
  // Generate insights without revealing numbers
  const insights = await generateInsights(formData, personality, disclosureLevel)
  
  // Apply psychological triggers subtly
  const triggeredInsights = applyPsychTriggers(insights, personality.triggers)
  
  return {
    source: "Your Personal Mortgage Brain",
    insights: triggeredInsights,
    nextAction: getNextAction(gate),
    disclaimer: "Schedule consultation for exact figures"
  }
}

// Personality configurations
function getPersonality(domain: string) {
  const personalities = {
    'refinancing.com.sg': {
      focus: 'refinancing optimization',
      triggers: ['loss_aversion', 'urgency', 'scarcity'],
      tone: 'urgent but professional',
      systemPrompt: `You are Singapore's refinancing specialist. 
        Focus on lock-in periods ending, rate windows closing, and timing optimization.
        Never reveal exact savings amounts.`
    },
    'rates.com.sg': {
      focus: 'rate intelligence',
      triggers: ['social_proof', 'authority', 'comparison'],
      tone: 'analytical and authoritative',
      systemPrompt: `You track every rate movement in Singapore.
        Show trends and patterns without specific numbers.`
    },
    'compare.com.sg': {
      focus: 'comprehensive comparison',
      triggers: ['completeness', 'authority', 'trust'],
      tone: 'thorough and balanced',
      systemPrompt: `You compare everything comprehensively.
        Show relative positions without exact figures.`
    },
    'homeloans.com.sg': {
      focus: 'first-timer guidance',
      triggers: ['trust', 'education', 'support'],
      tone: 'friendly and educational',
      systemPrompt: `You guide first-time buyers step by step.
        Focus on education and confidence building.`
    }
  }
  
  return personalities[domain] || personalities['refinancing.com.sg']
}
```

### **Day 4: Psychology & Tollbooth Implementation**

```typescript
// src/core/psychology.ts
// Dr. Elena's expertise embedded (never revealed)
export const psychologicalTriggers = {
  loss_aversion: {
    phrases: [
      "This window typically closes within weeks",
      "Similar profiles missed this opportunity and regretted it",
      "Market conditions won't stay favorable forever"
    ],
    timing: "early_in_message"
  },
  
  scarcity: {
    phrases: [
      "Only 2 banks currently offering this",
      "Limited slots this month",
      "3 other clients viewing similar options"
    ],
    timing: "call_to_action"
  },
  
  social_proof: {
    phrases: [
      "73% of profiles like yours benefited",
      "847 successful refinances this month",
      "Ranked #1 strategy by similar borrowers"
    ],
    timing: "middle_of_message"
  },
  
  authority: {
    phrases: [
      "Based on 10,000+ analyzed profiles",
      "Our proprietary algorithm detected",
      "Bank insiders confirm this trend"
    ],
    timing: "opening"
  },
  
  urgency: {
    phrases: [
      "Act within 48 hours for best outcomes",
      "This rate expires soon",
      "Decision window closing"
    ],
    timing: "closing"
  }
}

// src/core/tollbooth.ts
export function getTollboothLevel(gate: number) {
  return {
    1: {
      reveal: ['market_direction', 'general_advice'],
      hide: ['specific_rates', 'bank_names', 'savings_amounts'],
      tease: "Complete profile for personalized insights"
    },
    2: {
      reveal: ['eligibility_hints', 'timing_factors'],
      hide: ['exact_numbers', 'bank_recommendations'],
      tease: "Unlock bank matches with full profile"
    },
    3: {
      reveal: ['bank_categories', 'optimization_strategies'],
      hide: ['contact_details', 'exact_savings'],
      tease: "Book consultation for exact figures and introduction"
    }
  }[gate]
}
```

### **Day 5: Testing & Integration**

```bash
# Test MCP server locally
npm run dev

# Test with Claude Desktop
# Add to Claude Desktop config:
{
  "mcpServers": {
    "mortgage-brain": {
      "command": "node",
      "args": ["./mcp-mortgage-brain/dist/server.js"],
      "env": {
        "DOMAIN": "refinancing.com.sg"
      }
    }
  }
}

# Test with different LLMs via API
npm run test:gpt4
npm run test:claude
npm run test:llama
```

---

## **WEEK 2: WEB APPLICATION DEVELOPMENT**

### **Day 6-7: Next.js Setup for refinancing.com.sg**

```bash
# Create web app
npx create-next-app@latest refinancing-sg --typescript --tailwind --app
cd refinancing-sg

# Install dependencies
npm install @modelcontextprotocol/sdk lucide-react framer-motion
```

```typescript
// app/page.tsx
export default function RefinancingHome() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Hero />
      <GateProgressiveForm />
      <TrustSignals />
      <PsychologicalTriggers />
    </main>
  )
}

// components/GateProgressiveForm.tsx
'use client'
import { useState } from 'react'
import { useMCPConnection } from '@/hooks/useMCP'

export default function GateProgressiveForm() {
  const [gate, setGate] = useState(1)
  const [formData, setFormData] = useState({})
  const { analyze, loading, insights } = useMCPConnection()
  
  const handleGateSubmit = async (data: any) => {
    const result = await analyze({
      formData: { ...formData, ...data },
      domain: 'refinancing.com.sg',
      gate
    })
    
    if (gate < 3) {
      setGate(gate + 1) // Progressive disclosure
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        {/* Progress indicator */}
        <div className="flex space-x-2">
          {[1,2,3].map(g => (
            <div 
              key={g}
              className={`flex-1 h-2 ${g <= gate ? 'bg-red-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-sm mt-2 text-gray-600">
          {gate === 1 && "Step 1: Basic info (no email required)"}
          {gate === 2 && "Step 2: Unlock eligibility insights"}
          {gate === 3 && "Step 3: Get personalized strategy"}
        </p>
      </div>
      
      {/* Gate-specific fields */}
      {gate === 1 && <Gate1Fields onSubmit={handleGateSubmit} />}
      {gate === 2 && <Gate2Fields onSubmit={handleGateSubmit} />}
      {gate === 3 && <Gate3Fields onSubmit={handleGateSubmit} />}
      
      {/* AI insights display */}
      {insights && (
        <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400">
          <h3 className="font-bold text-gray-900">
            Your Personal Mortgage Brain Says:
          </h3>
          {insights.map((insight, i) => (
            <div key={i} className="mt-4">
              <p className="font-medium">{insight.title}</p>
              <p className="text-gray-700">{insight.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### **Day 8-9: MCP Client Integration**

```typescript
// hooks/useMCP.ts
import { MCPClient } from '@modelcontextprotocol/sdk'
import { useState } from 'react'

export function useMCPConnection() {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  
  const analyze = async (params: any) => {
    setLoading(true)
    
    try {
      // Connect to MCP server
      const client = new MCPClient({
        url: process.env.NEXT_PUBLIC_MCP_URL || 'ws://localhost:3000',
        // Can use any LLM provider here
        llmProvider: process.env.NEXT_PUBLIC_LLM || 'groq',
        llmConfig: getLLMConfig()
      })
      
      const result = await client.callTool('analyze_profile', params)
      setInsights(result.insights)
      return result
      
    } catch (error) {
      // Fallback to template responses
      return getFallbackResponse(params.gate)
    } finally {
      setLoading(false)
    }
  }
  
  return { analyze, loading, insights }
}

function getLLMConfig() {
  // Route to different LLMs based on complexity
  return {
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.1-70b',
      temperature: 0.7
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'mistralai/mixtral-8x7b',
      temperature: 0.7
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo',
      temperature: 0.7
    }
  }
}
```

### **Day 10: Deploy to Production**

```yaml
# vercel.json
{
  "env": {
    "NEXT_PUBLIC_MCP_URL": "@mcp-server-url",
    "GROQ_API_KEY": "@groq-api-key",
    "OPENROUTER_API_KEY": "@openrouter-api-key"
  },
  "domains": [
    "refinancing.com.sg",
    "www.refinancing.com.sg"
  ]
}
```

```bash
# Deploy to Vercel
vercel --prod

# Deploy MCP server to Railway
railway up
```

---

## **WEEK 3: OPTIMIZATION & EXPANSION**

### **Day 11-12: A/B Testing Framework**

```typescript
// lib/experiments.ts
export const experiments = {
  'hero_headline': {
    control: "Save Thousands on Your Home Loan",
    variants: [
      "Your Lock-In Period Ends Soon - Act Now",
      "3 Banks Want Your Refinancing Business",
      "Refinancing Window Closing This Month"
    ]
  },
  
  'psychological_triggers': {
    control: ['authority', 'trust'],
    variants: [
      ['urgency', 'scarcity'],
      ['loss_aversion', 'social_proof'],
      ['fear', 'greed']
    ]
  },
  
  'gate_progression': {
    control: 3, // 3 gates
    variants: [2, 4] // Test different gate counts
  }
}
```

### **Day 13-14: Launch rates.com.sg**

```typescript
// Same codebase, different configuration
const ratesConfig = {
  domain: 'rates.com.sg',
  theme: {
    primary: '#3498DB',
    hero: 'Track Every Bank Rate in Real-Time',
    emotion: 'authority'
  },
  personality: 'rate_tracker',
  features: ['rate_alerts', 'trend_charts', 'comparison_table']
}
```

### **Day 15: Add WhatsApp Integration**

```typescript
// channels/whatsapp.ts
import { Client } from 'whatsapp-web.js'

const whatsapp = new Client()

whatsapp.on('message', async msg => {
  const mcpResponse = await mcp.analyze({
    formData: parseMessage(msg.body),
    domain: 'refinancing.com.sg',
    gate: 1,
    channel: 'whatsapp'
  })
  
  msg.reply(formatForWhatsApp(mcpResponse))
})
```

---

## **WEEK 4: SCALE & OPTIMIZE**

### **Day 16-20: Launch All Domains**
- compare.com.sg - Comparison focus
- homeloans.com.sg - First-timer focus
- Each with unique personality but same MCP brain

### **Day 21-25: Performance Optimization**
- Implement caching for common queries
- CDN setup for static assets
- Database indexing for fast lookups
- LLM response caching

### **Day 26-28: Analytics & Monitoring**

```typescript
// analytics/tracker.ts
export const analytics = {
  trackGateCompletion: (gate, domain) => {
    // Measure conversion per gate
  },
  
  trackPsychTrigger: (trigger, effectiveness) => {
    // Which triggers work best
  },
  
  trackLLMCost: (provider, cost) => {
    // Monitor spending
  },
  
  trackLeadQuality: (score, outcome) => {
    // Optimize scoring
  }
}
```

---

## **LAUNCH CHECKLIST**

### **Technical:**
- [ ] MCP server deployed on Railway
- [ ] Web app deployed on Vercel
- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] LLM API keys configured
- [ ] Fallback responses ready
- [ ] Error handling tested
- [ ] PDPA compliance verified

### **Content:**
- [ ] Psychological triggers configured
- [ ] Tollbooth gates defined
- [ ] Email templates created
- [ ] WhatsApp responses formatted
- [ ] Trust signals displayed
- [ ] Legal disclaimers added

### **Monitoring:**
- [ ] Analytics tracking active
- [ ] Error logging configured
- [ ] Cost monitoring setup
- [ ] Lead capture working
- [ ] A/B tests running

---

## **SUCCESS METRICS**

Week 1: MCP server live, 10 test leads
Week 2: refinancing.com.sg live, 100 leads
Week 3: 2 domains live, 500 leads total
Week 4: All domains live, 1000+ leads
Month 2: 2000+ leads, 10% premium conversion

---

## **TOTAL INVESTMENT**

One-time: $0 (using existing tools)
Monthly: $35 (hosting + backup LLM)
Per lead: ~$0.002 average

**ROI**: Each premium lead worth $200-500 in commission
**Breakeven**: 1 conversion per month

---

*Ready to build Singapore's smartest mortgage platform across 4 premium domains!*