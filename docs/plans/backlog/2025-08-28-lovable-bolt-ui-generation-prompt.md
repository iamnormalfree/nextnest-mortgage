---
title: lovable-bolt-ui-generation-prompt
status: backlog
owner: platform
last-reviewed: 2025-09-30
orchestration: /response-awareness
---

> Feed this backlog item into `/response-awareness` before implementation.

# Lovable/Bolt Prompt for MCP-Powered Satellite Domain UIs

## Core Architecture Differentiation

### Main NextNest vs Satellite Domains

**Main NextNest (AI_INTELLIGENT_LEAD_FORM_IMPLEMENTATION_PLAN.md):**
- **Complex Multi-Gate System**: 10+ fields, progressive disclosure, multiple validation layers
- **Heavy AI Processing**: n8n workflows, PDF generation, multi-tier analysis
- **Enterprise Integration**: CRM sync, broker assignment, lead scoring engine
- **Revenue Strategy**: Tollbooth with strategic withholding, consultation-driven
- **Tech Stack**: Next.js 14, TypeScript, Zod, React Hook Form, n8n, Redis queues
- **Target**: Comprehensive mortgage intelligence platform for all scenarios

**MCP Satellite Domains (THIS APPROACH):**
- **Single-Purpose Simplicity**: 4-step focused journey, minimal fields
- **Instant MCP Responses**: Direct LLM chat, no complex workflows needed
- **Lightweight Architecture**: Static site + MCP server, no database required
- **Revenue Strategy**: Quick capture → instant value → upsell to main platform
- **Tech Stack**: Static HTML/CSS/JS + MCP server (can run on $5 VPS)
- **Target**: Specific mortgage intent capture with personality-driven engagement

---

## Lovable/Bolt Generation Prompt

### System Prompt

```
You are an expert UI/UX developer specializing in conversion-optimized mortgage websites. You will generate 4 distinct single-page applications for Singapore mortgage domains. Each must be mobile-first, blazingly fast (<500ms load), and integrate with an MCP (Model Context Protocol) server for AI chat capabilities.

CRITICAL REQUIREMENTS:
1. Each domain gets ONE unique visual identity and personality
2. All share the same 4-step journey structure but with different terminology
3. Mobile-responsive with thumb-friendly touch targets
4. Static site that connects to MCP server via WebSocket/API
5. Under 50KB total page weight (excluding fonts)
6. Singapore market terminology and compliance

THE 4-STEP JOURNEY FRAMEWORK:
Every domain follows this pattern but with unique naming:
Step 1: Intent (What brings you here?)
Step 2: Context (Tell us about your situation)
Step 3: Discovery (Let's explore your options)
Step 4: Action (Your personalized plan)

Generate complete HTML/CSS/JS for each domain with:
- Unique color schemes and typography
- Domain-specific illustrations/icons
- Personality-driven microcopy
- MCP chat integration points
```

### Domain 1: refinancing.com.sg

```
Create a SOPHISTICATED, ANALYTICAL interface for refinancing.com.sg

PERSONALITY: "The Rate Optimizer" - Data-driven, precise, savings-focused
COLORS: Deep Navy (#0F172A) + Emerald Green (#10B981) + Pure White
TYPOGRAPHY: Inter for body, Space Grotesk for headings

4-STEP JOURNEY:
1. "Rate Check" - Current rate vs market (single slider input)
2. "Loan Profile" - Outstanding amount & remaining tenure (2 inputs)
3. "Savings Analysis" - MCP calculates potential savings (chat interface)
4. "Switch Plan" - Personalized refinancing roadmap (results + CTA)

UNIQUE ELEMENTS:
- Live rate ticker showing "Market Rate Today: 3.2%"
- Savings calculator that updates in real-time
- "Days until lock-in expires" countdown timer
- Trust signal: "Analyzed 12,847 refinancing cases"

MCP INTEGRATION:
<div id="mcp-chat" class="hidden">
  <div class="chat-header">
    <span class="ai-name">RateBot</span>
    <span class="status">Analyzing your savings...</span>
  </div>
  <div class="chat-messages"></div>
</div>

MOBILE OPTIMIZATION:
- Thumb-zone navigation with bottom tab bar
- Swipe between steps instead of clicking
- Number pad for numeric inputs
- Pull-to-refresh for rate updates
```

### Domain 2: rates.com.sg

```
Create a DYNAMIC, REAL-TIME interface for rates.com.sg

PERSONALITY: "The Market Pulse" - Live data, urgency, market movements
COLORS: Electric Blue (#3B82F6) + Alert Orange (#FB923C) + Charcoal (#1F2937)
TYPOGRAPHY: DM Sans for body, Bebas Neue for rate displays

4-STEP JOURNEY:
1. "Rate Alert" - Set your target rate (slider with haptic feedback)
2. "Loan Details" - Quick profiling (3 toggle buttons)
3. "Market Intel" - MCP provides rate predictions (streaming chat)
4. "Rate Lock" - Secure today's rates (urgency-driven CTA)

UNIQUE ELEMENTS:
- Animated rate chart showing 24-hour movements
- "17 users monitoring rates now" social proof ticker
- Color-coded rate changes (green down, red up)
- Countdown: "Rates update in 3h 24m"

MCP INTEGRATION:
<div id="mcp-stream">
  <div class="rate-ai">
    <canvas id="rate-pulse"></canvas>
    <div class="ai-insights"></div>
  </div>
</div>

MOBILE OPTIMIZATION:
- Gesture-based rate selection (pinch to zoom timeline)
- Haptic feedback on rate changes
- Persistent bottom sheet for quick actions
- Landscape mode for detailed charts
```

### Domain 3: compare.com.sg

```
Create a CLEAN, COMPARISON-FOCUSED interface for compare.com.sg

PERSONALITY: "The Fair Evaluator" - Neutral, balanced, comprehensive
COLORS: Purple (#8B5CF6) + Mint (#34D399) + Light Grey (#F3F4F6)
TYPOGRAPHY: Manrope for body, Sora for headings

4-STEP JOURNEY:
1. "Quick Compare" - Property type & loan amount (2 cards to choose)
2. "Your Profile" - Employment & income (simplified form)
3. "Side-by-Side" - MCP generates comparisons (split-screen chat)
4. "Best Match" - Top 3 recommendations (swipeable cards)

UNIQUE ELEMENTS:
- Visual comparison bars for each bank
- "Apples to apples" toggle for fair comparison
- Pros/cons list generator
- "Unbiased algorithm" trust badge

MCP INTEGRATION:
<div id="mcp-compare">
  <div class="comparison-engine">
    <div class="bank-a"></div>
    <div class="vs-indicator">VS</div>
    <div class="bank-b"></div>
  </div>
  <div class="mcp-verdict"></div>
</div>

MOBILE OPTIMIZATION:
- Swipe left/right to compare different banks
- Collapsible sections for detailed views
- Tab bar for switching comparison criteria
- One-thumb reachable CTAs
```

### Domain 4: homeloans.com.sg

```
Create a WARM, APPROACHABLE interface for homeloans.com.sg

PERSONALITY: "The Friendly Guide" - Supportive, educational, first-timer friendly
COLORS: Coral (#FF6B6B) + Sky Blue (#38BDF8) + Cream (#FFFBF0)
TYPOGRAPHY: Nunito Sans for body, Poppins for headings

4-STEP JOURNEY:
1. "Dream Home" - Property aspirations (visual selector with icons)
2. "About You" - First-timer status & budget (friendly questionnaire)
3. "Learn & Explore" - MCP education mode (conversational chat)
4. "Your Journey" - Step-by-step roadmap (timeline visualization)

UNIQUE ELEMENTS:
- Illustrated home icons for property types
- "First-Timer?" helper mode with tooltips
- Progress bar showing "67% ready for your home loan"
- Celebration animations on milestones

MCP INTEGRATION:
<div id="mcp-guide">
  <div class="friendly-bot">
    <img src="bot-avatar.svg" alt="Friendly assistant">
    <div class="chat-bubble"></div>
  </div>
  <div class="quick-questions">
    <button>What's TDSR?</button>
    <button>Can I afford this?</button>
  </div>
</div>

MOBILE OPTIMIZATION:
- Large, friendly touch targets (minimum 48px)
- Smooth scroll with section snapping
- Bottom drawer for help content
- Voice input option for questions
```

---

## Technical Implementation

### Shared MCP Integration Code

```javascript
// MCP Connection Manager (shared across all domains)
class MCPClient {
  constructor(domain) {
    this.domain = domain;
    this.personality = this.getPersonality(domain);
    this.wsUrl = 'wss://mcp.nextnest.sg/chat';
  }
  
  getPersonality(domain) {
    const personalities = {
      'refinancing': 'analytical_optimizer',
      'rates': 'market_pulse',
      'compare': 'fair_evaluator',
      'homeloans': 'friendly_guide'
    };
    return personalities[domain];
  }
  
  async sendMessage(step, data) {
    const payload = {
      domain: this.domain,
      personality: this.personality,
      step: step,
      data: data,
      timestamp: Date.now()
    };
    
    // Send to MCP server
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return response.json();
  }
  
  streamResponse(message, callback) {
    const ws = new WebSocket(this.wsUrl);
    ws.onmessage = (event) => {
      callback(JSON.parse(event.data));
    };
    ws.send(JSON.stringify({ message, personality: this.personality }));
  }
}
```

### Mobile-First CSS Framework

```css
/* Shared mobile-first base styles */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --thumb-reach: 60vh; /* Thumb reachable zone */
}

.step-container {
  min-height: 100vh;
  padding-bottom: calc(80px + var(--safe-area-inset-bottom));
  scroll-snap-align: start;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(80px + var(--safe-area-inset-bottom));
  background: var(--brand-primary);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

/* Touch-friendly inputs */
input, button, .touchable {
  min-height: 48px;
  min-width: 48px;
  touch-action: manipulation;
}

/* Smooth iOS-style transitions */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

.step-transition {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (hover: none) {
  /* Mobile-only optimizations */
  .desktop-only { display: none; }
  .hover-effect:active { opacity: 0.8; }
}
```

---

## Deployment Instructions

```bash
# Each domain is a single HTML file + shared MCP connector
project/
├── refinancing/
│   └── index.html (complete SPA)
├── rates/
│   └── index.html (complete SPA)
├── compare/
│   └── index.html (complete SPA)
├── homeloans/
│   └── index.html (complete SPA)
├── shared/
│   ├── mcp-client.js (5KB)
│   └── analytics.js (2KB)
└── mcp-server/
    └── index.js (runs on separate VPS)

# Deploy to CDN
npm run build
aws s3 sync ./dist s3://mortgage-domains/ --cache-control max-age=31536000

# MCP server runs separately
pm2 start mcp-server/index.js --name mortgage-brain
```

---

## Key Differentiators Summary

| Aspect | Main NextNest | MCP Satellites |
|--------|--------------|----------------|
| **Complexity** | 10+ fields, multi-gate | 4 simple steps |
| **Processing** | n8n workflows, PDF gen | Direct MCP chat |
| **Load Time** | ~2 seconds | <500ms |
| **Infrastructure** | Next.js, Redis, Database | Static files + MCP |
| **Cost** | $200+/month | $35/month total |
| **Purpose** | Comprehensive platform | Single-intent capture |
| **Revenue Model** | Complex tollbooth | Quick capture → upsell |
| **Personalization** | Form-based scoring | Personality-driven AI |
| **Mobile UX** | Responsive | Mobile-first |
| **Data Collection** | Extensive profiling | Minimal viable info |

---

## Success Metrics

Each domain should achieve:
- **Page Load**: <500ms on 3G
- **Time to First Interaction**: <2 seconds
- **4-Step Completion Rate**: >75%
- **MCP Response Time**: <200ms
- **Mobile Conversion**: >65%
- **Cost per Domain**: <$9/month
- **Upsell to Main Platform**: >25%

This approach creates hyper-focused, personality-driven experiences that feel completely different from the comprehensive NextNest platform while sharing the same MCP brain infrastructure.