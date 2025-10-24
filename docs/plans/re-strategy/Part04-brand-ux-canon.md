ABOUTME: Brand and UX canon defining positioning, visual system, and trust design for NextNest.
ABOUTME: Aligns design DNA research with implementation gates before launch.

# Brand & UX Canon (Part 04)

---
title: "Brand & UX Canon"
status: draft
owner: design
created: 2025-10-22
references:
  - docs/strategy_integration/nn-design-dna.md
  - docs/plans/re-strategy/Part02-strategic-canon-and-launch-alignment.md
  - docs/plans/re-strategy/backlog/master-task-list.csv (tasks CAN-001, CAN-002, CAN-005)
---

## 0. Purpose

Lock the customer-facing identity so every surface—web, chat, PDFs, follow-ups—expresses “Assured Intelligence”: calm, evidence-backed guidance delivered by a human-led, AI-assisted brokerage. This canon translates the design DNA research into concrete standards, deliverables, and review gates required before Stage 1 launch.

## 1. Brand North Star

- **Promise**: “Evidence-based mortgage advisory. Built on every real Singapore scenario.”  
- **Supporting Hero Copy**: “Real-time analysis of 286 packages. Mathematical precision. Complete transparency.”
- **Voice**: Warm expertise. Speak plainly, acknowledge context, act as a co-pilot.  
  Tone spectrum: Calm ▸ Reassuring ▸ Precise. Never flippant or alarmist.
- **Experience Goal**: User gains confidence within the first 10 seconds—feels seen (personal context) and informed (clear next step + proof we’ve done the math).

## 2. Design Pillars (Do Not Deviate)

1. **Calm Intelligence** – Minimal interface, generous white space, deliberate typography. Showcase key insights, hide noise unless requested.
2. **Visible Evidence** – Every recommendation backed by data snapshots (net savings, scenario reference, calculation timestamp). Provide “evidence chips” in UI and PDFs.
3. **Human-First Flow** – Copy acknowledges the user: “Here’s what we found”, “Let’s review it together”. Face-to-name elements (Brent bio, availability cues).
4. **Controlled Transparency** – Show ranges, highlights, and disclaimers. Guard deviated rates and bank names until the right step (aligns with Part 01).
5. **Guided Simplicity** – Progressive disclosure. Lead with the next best action; offer deeper insight on demand (accordion details, hover tooltips).
6. **Invisible Automation** – Highlight moments where the system worked on the user’s behalf (“Pulled your loan history to save time”), without breaking trust.

## 3. Visual System Blueprint

### 3.1 Color Canon
- **Base**: Off-white (`#F8F8F8`), light grey (`#E5E5E5`), neutral divider grey (`#D1D5DB`).  
- **Primary Text**: Charcoal (`#374151`) – used for nearly all copy.  
- **Primary Action / Trust Accent**: Deep trust blue (`#0F4C75`) – buttons, links, key highlights.  
- **Secondary Accent**: Warm gold (`#FCD34D`) – success/savings highlights, progress indicators, brand flourishes.  
- **Functional Colors**:  
  - Success green (`#059669`)  
  - Alert red (`#DC2626`)  
  - Neutral info blue (`#2563EB`) for tooltips/help  
- **Prohibited**: Purple tones, neon gradients, high-saturation multi-color schemes. They appear in legacy docs/components and must be phased out.

### 3.2 Typography
- **Primary Typeface**: Inter (geometric sans). Use for all headings, body, UI labels.  
- **Weights**: 300, 400, 500, 600. Avoid italics unless necessary (e.g., disclaimers).  
- **Scale** (desktop baseline):  
  - Hero: 48–56px  
  - Section heading: 32px  
  - Subheading / card title: 24px  
  - Body: 16px (line-height 1.6)  
  - Small/label: 14px  
- **Serif usage**: None by default. Reserve optional serif for long-form editorial only (not shipped yet). Gilda Display to be removed from production as part of future implementation work.

### 3.3 Iconography & Illustration
- Outline icons, 1.5px stroke, inheriting text color.  
- Illustration style: diagrammatic, line-based, muted; purpose is explanation, not decoration.  
- Avoid stock photography; use desaturated environmental imagery only when relevant.

### 3.4 Layout & Motion
- Grid: 8px spacing system, sections with 64px vertical rhythm.  
- Max content width: 960px hero, 720px body.  
- Motion: Ease-out 150–200ms; respect reduced-motion settings; only for state changes.

Deliverable: Update brand kit (`/design/system/brand-kit.fig`) to reflect new palette and remove purple/Gilda references.
| Layout | Max width 960px for hero, 720px for body content. Consistent 64px section padding. | Form steps use full width, but keep breathing space. |
| Motion | Subtle (150-200ms) ease-out transitions. Use to reinforce state changes (rate reveal opening, CTA hover). No parallax. | Motion preference respects OS reduced-motion settings. |

Deliverable: `/design/system/brand-kit.fig` (Figma) capturing color, type, components, and copy tone examples.

## 4. Core Surfaces & Requirements

### 4.1 Homepage (Stage 0)
- **Hero**: Headline + supporting copy + primary CTA (“See Your Scenario”). Subtext clarifies we evaluate staying, repricing, refinancing.
- **Trust Strip**: Three badges highlighting PDPA compliance, audit trail, banker-ready packs (icons + short copy).
- **Scenario Snapshot Section**: Carousel or grid showing anonymized scenario cards (property type, loan band, decision reason, net savings). Pull data from scenario DB (Part 03).
- **Process Overview**: 4-step loop with short copy (Form → Scenario → 15-min call → Banker pack). Illustrations optional but consistent.
- **Testimonials/Authority**: Placeholder for client quote and a human profile (Brent headshot, credentials).
- **Footer**: Physical address, contact, regulatory statements, privacy links.

### 4.2 Lead Form
- Step titles framed as conversation (“Let’s get your basics”, “A bit about your property”).  
- Inline reassurance below sensitive fields (“Your data is encrypted. Consent expires in 5 days.”).
- Progress indicator (4 steps max display at once).  
- Confirmation screen shows immediate next action (“We’re loading your analysis…” with bullet timeline).

### 4.3 Chat Experience
- Left sidebar displays scenario chips (loan amount, property type, recommendation) once available.  
- When rate reveal triggered, bottom sheet/side panel matches hero styling (muted palette, evidence tags).  
- Typing indicators: simple dot animation + text (“Michelle is preparing your numbers…”).

### 4.4 PDF / One-Pager
- Title block with initials, property type, timestamp, validity (# days).  
- Three masked options in columns with key metrics (monthly payment, net 36-month cost, lock-in).  
- Evidence footer with scenario ID, ruleset version, consent ID.

### 4.5 Follow-Up & Notifications
- Value-driven templates only (no countdown pressure).  
- Examples: “Your banker pack is ready”, “We benchmarked your bank’s counter-offer—here’s what changed”.

## 5. Copy Guidance

- **Voice**: Confident, concise, compassionate.  
  - “Let’s walk through the options that fit your profile.”  
  - “Here’s the math behind this recommendation.”  
  - Avoid jargon; when necessary, explain in parentheses.
- **Words to Avoid**: “Guaranteed”, “Secret”, “Instant approval”.  
- **Transparency phrasing**: “We evaluate staying, repricing, and refinancing. We’ll reveal the specific bank once we’ve confirmed the fit together.”
- **Error States**: Acknowledge impact and next steps (“We’re reconnecting to pull refreshed rates. This usually takes under 30 seconds.”).

Deliverable: `docs/content/voice-and-tone.md` – examples for hero copy, form guidance, chat prompts, follow-up messages aligned with Inter voice.

## 6. Imagery & Media

- Use abstract/architectural line art or stylized property renders; avoid stock photos of people shaking hands.  
- Video/demo assets: maximum 90 seconds, screens recorded in current UI.  
- Animations should reinforce clarity (e.g., flow diagrams showing scenario steps).

## 7. Accessibility & Compliance

- All interactive elements meet WCAG 2.1 AA.  
- Keyboard navigable modals and forms.  
- Provide alt text for illustrative graphics; descriptive captions for scenario cards.  
- Color contrast (foreground/background) >= 4.5:1 for body text.

Documentation update: `docs/runbooks/design/accessibility-checklist.md` (new).

## 8. Governance & QA

- **Design Review Cadence**: Weekly check against this canon; document decisions in `docs/work-log.md`.  
- **Sign-off Gate** (Stage 0):  
  - Homepage passes heuristic review.  
  - Form + chat flows aligned with tone + accessibility.  
  - PDF template approved with scenario data.  
  - Trust strip deployed.  
  - Voice guide and component library published.
- **Design Debt Log**: Maintain backlog in `docs/plans/re-strategy/backlog/master-task-list.csv` under relevant domains.

## 9. Implementation Hand-Off

- Provide component specs to engineering (Figma → Storybook or direct design tokens).  
- Define responsive breakpoints and variations.  
- Supply copy sheets for localization or future updates.  
- Collaborate with engineering to ensure Part 01/03 integrations (rate reveal panel, scenario cards) match visual guidelines.

## 11. Legacy Asset Policy

- Archive or annotate older design docs referencing purple/Gilda palettes (`docs/design/NEXTNEST_VISUAL_BRAND_IDENTITY_SYSTEM.md`, `docs/design/DESIGN_PRINCIPLES.md`, related runbooks).  
- Update Tailwind tokens to remove `nn-purple` usage; flag components still relying on it and schedule replacement.  
- Document phase-out plan in `docs/work-log.md` with target dates.

## 10. Next Actions

1. Assemble brand kit in Figma (color, type, components, scenario card).  
2. Draft voice/tone guide with example copy.  
3. Update backlog (CAN-001/002/005) with specific sub-tasks (hero rewrite, trust strip, PSEO template styling).  
4. Schedule design review to confirm Stage 0 checklist prior to development kickoff.
