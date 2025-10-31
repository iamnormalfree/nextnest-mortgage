---
title: "Brand Kit & Figma Canon Refresh Plan"
status: draft
owner: design
created: 2025-10-31
constraint: "Constraint A – Public Surfaces Ready"
can_tasks:
  - CAN-017
priority: high
estimated_hours: 10-12
---

# Brand Kit & Figma Canon Refresh Plan

## Overview

Constraint A still has CAN-017 open: we need a single canonical brand kit and Figma component library that matches the Part 04 Brand & UX canon. This plan delivers an auditable design source of truth so engineering and marketing work off the same palette, typography, and component specs before Stage 0 launch.

## Objectives

- Produce an updated Figma library (NextNest Brand Canon) covering typography, color tokens, spacing scale, icon usage, and key UI components (buttons, form inputs, chat shells).
- Export a compact documentation pack (PDF + PNG previews) for non-Figma stakeholders.
- Ensure the library references match live code tokens (Tailwind config, CSS vars) and Stage 0 accessibility constraints.
- Publish an adoption note in `docs/runbooks/brand/` pointing to source file and usage expectations.

## Dependencies

- Part 04 Brand & UX Canon (latest revision)
- `docs/runbooks/brand/messaging.md` and `docs/content/voice-and-tone.md`
- Tailwind token mapping in `tailwind.config.ts`
- Accessibility audit report `docs/test-reports/2025-10-29-accessibility-audit-can-037.md`

## Deliverables

1. Figma library file (`NextNest Brand Canon`) shared with engineering and marketing teams.
2. Exported asset bundle (`/docs/assets/brand-kit/`) containing palette swatches, typography specimens, and component cheat sheet.
3. Runbook entry `docs/runbooks/brand/brand-kit-reference.md` summarizing how to consume the kit and linking back to Figma.
4. Alignment note in `docs/work-log.md` citing completion, links, and validation steps.

## Plan of Record

### Phase 1 – Canon Review & Audit (2-3 hours)

- Audit Part 04 canon sections for palette, typography, imagery, and motion guidance.
- Inventory existing Figma files and components; mark conflicting assets for removal.
- Cross-check Tailwind tokens (`nn-gold`, `nn-blue-trust`, `charcoal`, etc.) and verify color values against canon.
- Confirm accessibility targets (AA contrast, 48px touch targets) with reference to the accessibility audit.

### Phase 2 – Figma Library Build (4-5 hours)

- Create structured pages: Foundations (color, type, spacing), Components (buttons, form inputs, chat modules), Layout Patterns (hero, trust strip, progressive form steps).
- Apply auto layout and component variants that mirror live code states (default, hover, focus, disabled) using the canon token mapping (primary CTA = warm gold, secondary actions = trust blue).
- Embed documentation notes in Figma (description fields) referencing Part 04 sections and relevant runbooks.
- Run contrast checks inside Figma to ensure AA compliance for all component states.

### Phase 3 – Asset Export & Documentation (2 hours)

- Export PNG/PDF specimens to `docs/assets/brand-kit/`.
- Draft `docs/runbooks/brand/brand-kit-reference.md` outlining:
  - Link to canonical Figma file
  - Palette values, typography pairings, spacing scale
  - Process for proposing updates (review cadence, owner)
  - Mapping table from design tokens → Tailwind tokens
- Update `docs/work-log.md` with CAN-017 completion entry and evidence links.

### Phase 4 – Handoff & Adoption (1-2 hours)

- Schedule review with engineering (focus on token parity and responsive breakpoints).
- Notify marketing/copy stakeholders in `#brand-canon` Slack channel with download links and expectations.
- Archive superseded Figma files or clearly mark them as deprecated within Figma.
- Log completion in Stage 0 launch gate checklist once stakeholders sign off.

## Acceptance Criteria

- ✅ Figma library shared with edit access for design team and view for engineering/marketing.
- ✅ Palette, typography, and spacing values match Tailwind configuration and pass AA contrast checks.
- ✅ Component variants cover primary user flows (homepage hero, progressive form, chat shell) with accessibility annotations.
- ✅ Runbook entry published and linked from Part 04 index.
- ✅ `docs/work-log.md` includes CAN-017 completion record with validation screenshots.

## Constraint Alignment

- **Constraint A – Public Surfaces Ready** (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1 row). This plan closes CAN-017 so Stage 0 public surfaces have a single design canon before handoff.

## Risks & Mitigations

- **Token drift between Figma and Tailwind**: verify values with engineering before finalizing, update Tailwind seeds if discrepancies surface.
- **Adoption lag**: couple runbook update with Slack announcement and add to next weekly constraint review checklist.
- **Accessibility regression**: re-run contrast checks after any late palette adjustments; do not publish without AA confirmation.

## Next Steps

- Brent to confirm ownership and timeline.
- Once Phase 3 completes, flip CAN-017 to ✅ in alignment matrix and Stage 0 launch gate log.
