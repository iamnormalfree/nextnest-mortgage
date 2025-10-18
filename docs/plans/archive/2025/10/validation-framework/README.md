# Legacy Validation Framework (Archived 2025-10-18)

**Archived Reason:** Framework validated legacy architecture (IntelligentMortgageForm, gate-based structure) that no longer exists in production.

**Current Production:** ProgressiveFormWithController with step-based architecture and instant-profile.ts calculations.

**Replacement:** Jest test suite in `tests/` + CANONICAL_REFERENCES.md provide better validation.

**Last Run:** September 3, 2025 (failed with 9% score due to missing legacy files)

**Contents:**
- validation-reports/ - Generated validation reports from legacy framework
- validate-context.js - Validation script (checks for archived files)

**Do not attempt to run this framework** - it references files that were archived in October 2025.
