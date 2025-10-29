# Collapsible Employment Sections - Design Decision

**Date:** 2025-10-28
**Domain:** Form Components | **Impact:** HIGH | **Risk:** MEDIUM

---

## Problem

From `docs/missedout-fixes-3.md` Problems 3-5:
- Auto-collapse prevention with first-time visibility
- "One section open at a time" coordination
- Immediate co-applicant visibility with yellow warning

**Current State:**
- EmploymentPanel, CoApplicantPanel: No collapse state
- Step3Refinance: Composes panels without coordination
- NO collapsible patterns in `components/ui/`

---

## Approach A: Wrapper Component ✅ RECOMMENDED

**Architecture:** `<EditableSection>` wraps existing panels

**Props:**
```typescript
{ title, summaryText, isExpanded, onToggleExpanded, isComplete, children }
```

**Pros:**
- Zero changes to EmploymentPanel/CoApplicantPanel (no Tier 1 risk)
- Reusable for all sections
- Clear separation: collapse UI vs form validation
- Simple testing

**Cons:**
- Extra nesting layer
- Parent generates summary (breaks encapsulation)
- Parent manages N boolean states

**Estimate:** 3.5h, ~290 LOC

---

## Approach B: Self-Contained Panels

**Architecture:** Add collapse props to existing panels

**Props Changes:** `isExpanded`, `onToggle`, `getSummaryText`, `isComplete`

**Pros:**
- No extra components
- Backward compatible

**Cons:**
- Modifies Tier 1 files
- Duplication risk across panels
- API bloat (4 new props per panel)

**Estimate:** 4.5h, ~200 LOC

---

## Approach C: New Components

**Architecture:** `EditableEmploymentSection`, `EditableCoApplicantSection`

**Pros:**
- Full encapsulation

**Cons:**
- Duplicates all form logic
- Maintenance burden (2 versions of employment fields)
- Divergence risk

**Estimate:** 6h, ~400 LOC

---

## Decision: Approach A

**Why:**
1. No Tier 1 changes (EmploymentPanel/CoApplicantPanel unchanged)
2. Reusable (works for lock-in, future sections)
3. Maintainable (single collapse logic)
4. Testable (wrapper vs validation independently)
5. Rollback-friendly (remove wrappers → revert)

**Trade-off:** Parent generates summary
- Alternative requires duplicating form logic (C) or API bloat (B)
- Summary is presentation logic (not business)
- Parent already watches `employmentType`

**Rejected:** Shadcn accordion (over-engineered, extra bundle)

---

## Implementation

### Phase 1: EditableSection (~80 LOC)
- Collapsed: summary + Edit button
- Expanded: children + Collapse button
- Yellow border/bg when incomplete, gray when complete
- "Required" badge when collapsed + incomplete
- ARIA: `aria-expanded`, `aria-label`

### Phase 2: Step3Refinance (~60 LOC)
- State: `isPrimaryExpanded`, `isCoApplicantExpanded`, `hasShownCoApplicantSection`
- Handlers: Toggle + collapse others (one at a time)
- Completion: `Boolean(employmentType) && !errors.employmentType`
- Summary: `EMPLOYMENT_LABELS[type]` + recognition %
- useEffect: First-time visibility (Problem 3)
- Wrap panels in EditableSection

### Phase 3: Tests (~150 LOC)
- Unit: EditableSection collapsed/expanded, styling, ARIA
- Integration: Primary expanded, co-applicant collapsed, one-at-a-time, validation when collapsed

---

## Key Decisions

#LCL_EXPORT_CRITICAL: **React Hook Form Integration**
- Fields stay in DOM when collapsed (validation automatic)

#LCL_EXPORT_FIRM: **Visual States**
- Incomplete: `border-[#FCD34D]` + `bg-[#FFFBEB]` + badge
- Complete: `border-[#E5E5E5]` + `bg-[#F8F8F8]`

#LCL_EXPORT_CASUAL: **Performance**
- `useMemo` for summary (deps: `employmentType`, `errors`)
- Bundle: ~1.5KB

---

## Open Questions

#QUESTION_SUPPRESSION: Ask before implementing

1. Include income recognition in summary?
   - Rec: Yes ("Employed (100% recognition)")
2. Remove fields from DOM when collapsed?
   - Rec: No (simpler, validation automatic)
3. Animation?
   - Rec: No (MVP)

---

## Success Criteria

- Problem 3: No auto-collapse when first shown
- Problem 4: One-at-a-time editing
- Problem 5: Immediate visibility + yellow warning
- No breaking changes to panels
- Validation works when collapsed
- Accessibility correct
- Tests pass

---

## References

**Code:**
- `components/forms/sections/Step3Refinance.tsx`
- `components/forms/sections/EmploymentPanel.tsx`
- `components/forms/sections/CoApplicantPanel.tsx`

**Requirements:** `docs/missedout-fixes-3.md`
**Architecture:** `CANONICAL_REFERENCES.md`
