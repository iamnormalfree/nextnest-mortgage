# Mobile Loan Form Optimization Task List
Date: 2025-09-20

## Scope
Audit and refine the three-step loan application flow for mobile while preserving desktop layout parity.

## Tasks
1. Ship a segmented control primitive and retrofit it into the commercial loan purpose picker plus the Step 3 applicant toggles.
2. Restructure Step 2 property and instant analysis cards for new purchase and refinance paths so typography, spacing, and loading states respect mobile breakpoints.
3. Replace ad-hoc warning and success banners with `Alert`-based components, converting the Step 3 compliance notice into a collapsible pattern.
4. Run `npm run lint` and responsive smoke tests at 320, 375, 414, and 1024 widths; capture screenshots and note findings in `validation-reports/loan-form-mobile.md`.

## Deliverables
- Updated UI components under `components/forms/` and `components/ui/`.
- Validation notes with screenshots documenting before/after mobile states.
- Lint report confirming no regressions before handoff.

## Constraint Alignment

- Constraint A – Public Surfaces Ready (`docs/plans/re-strategy/strategy-alignment-matrix.md`, C1): Optimising the loan form for mobile preserves Stage 0 usability and accessibility benchmarks on the primary lead funnel before launch.

## Follow-up Issues (2025-09-20)
- Instant analysis card still overflows on small widths; metrics and the gold alert drift outside the card container.
- Property category cards in Step 2 appear staggered on desktop after the mobile layout tweaks.
- Compliance warning alert mixes the icon with the heading copy instead of centering the icon on its own line.
- Broker dashboard (`app/dashboard`) remains desktop-only; mobile view requires horizontal scrolling to interact.

## New Tasks
5. Refine `components/forms/InstantAnalysisCard.tsx` so metrics stack vertically below 640px and the `Alert` uses an inset flex container (no absolute icon positioning). Verify the card stays within the parent width on iPhone SE/14 Pro and Android Pixel breakpoints.
6. Adjust the Step 2 property picker in `components/forms/ProgressiveForm.tsx` to use `md:grid-cols-2 lg:grid-cols-3` and align the icon/text block with consistent padding (`md:flex-row md:items-start`).
7. Rebuild the MSR/TDSR warning alert in Step 3 to include a centered icon row (wrap `AlertTriangle` in a `div` with `justify-center` and `mb-3`) and ensure the description text no longer shifts the icon.
8. Make `components/calculators/SingaporeMortgageCalculator.tsx` responsive: stack the main calculator/results columns on mobile, add `overflow-x-hidden`, and allow the metrics grid to collapse to single-column at <768px. Capture fresh mobile screenshots for the validation report.
