---
status: active
priority: medium
complexity: medium
estimated_hours: 6
constraint: C1 – Public Surface Readiness
can_tasks: CAN-001, CAN-020, CAN-036
---

# Decision Bank Homepage Concepts – Test Page

## Purpose

Prototype a non-production page that exercises “Decision Bank” messaging so we can validate copy, layout, and evidence patterns before touching the live homepage.

## Scope

- Build a Next.js page under `app/test-homepage-decision-bank/page.tsx`.
- Reuse existing design tokens; avoid altering shared components.
- Implement four exploratory sections:
  1. Decision Bank range snapshot with rate-type ranges and bank counts.
  2. Stay vs. switch comparison cards highlighting math and disclosure pointers.
  3. Evidence carousel showcasing anonymized Decision Bank case summaries.
  4. Disclosure banner anchored to the new compensation guidance.
- No routing changes or production copy updates yet.

## Success Criteria

- Page renders without impacting existing routes.
- Copy adheres to `docs/content/voice-and-tone.md` (Decision Bank wording, stay vs. refinance focus, disclosure pointer).
- Sections align with Part04 brand canon (trust palette, typography rhythm, evidence-first storytelling).
- Assets ready for stakeholder review (Brent + design) without extra build steps.

## Out of Scope

- Updating `app/page.tsx`.
- Refactoring shared components/design tokens.
- Hooking into live data sources; mock numbers are acceptable but must look realistic (range, bank counts).

## Approach

1. Draft static JSON fixtures inside the page for ranges and case studies.
2. Compose UI with local functional components (e.g., `DecisionBankRangeCard`) to keep the file legible.
3. Ensure accessibility basics: semantic headings, descriptive aria labels on carousels, keyboard navigation for evidence slider.
4. Surface disclosure text via a dedicated banner linking to the future disclosure document.

## Validation

- Manual review in desktop and mobile breakpoints.
- Basic Lighthouse accessibility check (no automated gating yet).
- Brent walkthrough before any production change request.

## Next Steps After Approval

- If the concepts resonate, schedule implementation plan for production homepage updates and run full accessibility checklist per CAN-037.
- If copy changes are approved, sync with design for Decision Bank visuals and update other surfaces (form, chat).

## Timeline

- Day 0: Build prototype page.
- Day 1: Stakeholder review and revisions.
- Day 2: Decide on production rollout plan.
