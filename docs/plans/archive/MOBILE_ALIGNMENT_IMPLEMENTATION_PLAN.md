# Mobile Alignment Implementation Plan

## Goal
Restore a polished 320px experience without disturbing desktop layouts by tightening spacing, centering content, and ensuring full-width tappable elements across the homepage sections.

## Prerequisites
- Run `npm install` if the workspace is fresh.
- Start the dev server with `npm run dev` so you can live-check `http://localhost:3000`.
- Use Chrome DevTools responsive mode (Ctrl+Shift+M) to preview 320x480, 375x812, 768x1024, and 1280x800.

## 1. HeroSection Cleanup (`components/HeroSection.tsx`)
1. Update the left column wrapper (`<div>` around the headline and CTAs) to `className="text-center md:text-left space-y-4 md:space-y-6"` and add `mx-auto max-w-md md:max-w-none` so copy stays centered and readable at 320px.
2. Apply `w-full sm:w-auto` to both CTA `<a>` tags while keeping their existing flex alignment so buttons span the viewport on phones but shrink back on wider screens.
3. Change the metric card wrapper to `className="mt-8 md:mt-0 md:pl-10"` and its inner container to `className="relative w-full max-w-full sm:max-w-sm mx-auto"` with `p-5 sm:p-6` so the card no longer overflows on small devices.
4. Add `text-center sm:text-left` to the card headings and ensure all metric values use `text-lg sm:text-xl md:text-2xl` typography for clean scaling.

## 2. StatsSection Spacing (`components/StatsSection.tsx`)
1. Reduce the section padding to `py-12 md:py-16`.
2. Change the grid wrapper to `className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"` and add `space-y-6 md:space-y-0` so cards stack with breathing room on mobile but remain a row on desktop.

## 3. FeatureCards Resizing (`components/FeatureCards.tsx`)
1. Switch section padding to `py-12 md:py-16` and container padding to `px-3 sm:px-4 md:px-8`.
2. Downgrade the heading to `text-xl sm:text-2xl` and the intro copy to `text-sm sm:text-base`.
3. Add `p-5 md:p-6` and `space-y-2` inside each card, and change the metric block to `text-base sm:text-lg text-right` to prevent cramped metrics at 320px.

## 4. ServicesSection Tabs (`components/ServicesSection.tsx`)
1. Replace the tab bar container with `className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center"`.
2. Add `w-full sm:w-auto text-center` to each tab button so they become thumb-friendly stacks on phones.
3. In each tab panel, use `className="bg-white border border-fog p-5 md:p-6 space-y-4"` and convert badge rows to `className="flex flex-wrap gap-2"` so labels wrap gracefully.
4. For the bottom CTA block, update the wrapper to `p-6 md:p-8` and the inner grid to `items-start`. Set the left column to `text-center md:text-left space-y-4` and apply `w-full sm:w-auto` to both CTA buttons.

## 5. LoanTypeSection Cards (`components/LoanTypeSection.tsx`)
1. Reduce section padding to `py-12 md:py-16`.
2. Update the heading to `text-xl sm:text-2xl` and supporting copy to `text-sm sm:text-base`.
3. Change the grid to `gap-4 md:gap-6` and each card class to `relative p-5 md:p-6 space-y-3 text-left`.
4. In the metric area, switch to `flex flex-col items-start` with value typography `text-base sm:text-2xl` so cards stay balanced at 320px.

## 6. Footer Layout (`components/Footer.tsx`)
1. Wrap the inner row with `className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start justify-between text-center sm:text-left"`.
2. Give the link group `className="flex gap-4 sm:gap-6 justify-center"` to avoid edge hugging on narrow screens.

## QA Checklist
- Hero headline and metric card align centrally at 320px with no horizontal scroll.
- CTA buttons span the viewport only on mobile, revert on tablet/desktop.
- Stats, feature cards, services tabs, loan cards, and footer stack cleanly at 320px yet retain desktop layout.
- No Tailwind classes were removed from desktop breakpoints; only responsive additions were made.
- Run `npm run lint` and confirm it passes.
- Capture before/after screenshots for hero, services tabs, loan cards, and footer at 320px.

## Verification Steps
1. `npm run dev` and open `http://localhost:3000`.
2. In DevTools responsive mode, test 320x480, 375x812, 768x1024, and 1280x800.
3. Scroll through the entire page, checking for alignment, spacing, and overflow issues.
4. Once verified, stop the dev server and run `npm run lint`.
5. Document manual testing results in `validation-reports/` if required by the team workflow.
